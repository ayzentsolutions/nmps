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
      return { id: String(user._id), name: user.name, email: user.email, role: user.role, schoolId: user.schoolId };
    }
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = user.role; token.schoolId = user.schoolId; token.name = user.name; token.email = user.email; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.sub ?? ""; session.user.role = token.role as import("@/models/User").UserRole; session.user.schoolId = String(token.schoolId ?? ""); }
      return session;
    }
  }
});