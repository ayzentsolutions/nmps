import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) });
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials, request) {
      const limit = await checkRateLimit(request, "staff-login", 10, 15 * 60 * 1000);
      if (!limit.allowed) return null;
      const parsed = schema.safeParse(credentials);
      if (!parsed.success || !process.env.MONGODB_URI) return null;
      await connectToDatabase();
      const user = await User.findOne({ email: parsed.data.email.toLowerCase(), isActive: true }).select("+passwordHash");
      if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
      return {
        id: String(user._id), name: user.name, email: user.email, role: user.role, schoolId: user.schoolId,
        mustChangePassword: Boolean(user.mustChangePassword), sessionVersion: Number(user.sessionVersion || 0)
      };
    }
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.mustChangePassword = Boolean(user.mustChangePassword);
        token.sessionVersion = Number(user.sessionVersion || 0);
        token.name = user.name;
        token.email = user.email;
        return token;
      }
      if (token.sub && process.env.MONGODB_URI) {
        try {
          await connectToDatabase();
          const current = await User.findById(token.sub).select("name email role schoolId isActive mustChangePassword sessionVersion").lean();
          const currentVersion = Number(current?.sessionVersion || 0);
          const tokenVersion = Number(token.sessionVersion || 0);
          if (!current || !current.isActive || currentVersion !== tokenVersion) {
            token.sub = "";
            token.mustChangePassword = false;
            return token;
          }
          token.role = current.role;
          token.schoolId = current.schoolId;
          token.mustChangePassword = Boolean(current.mustChangePassword);
          token.sessionVersion = currentVersion;
          token.name = current.name;
          token.email = current.email;
        } catch {
          // Fail closed when session validity cannot be checked against the current account.
          token.sub = "";
          token.mustChangePassword = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as import("@/models/User").UserRole;
        session.user.schoolId = String(token.schoolId ?? "");
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    }
  }
});
