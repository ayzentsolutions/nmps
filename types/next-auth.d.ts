import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/models/User";
declare module "next-auth" {
  interface Session { user: { id: string; role: UserRole; schoolId: string } & DefaultSession["user"]; }
  interface User { role: UserRole; schoolId: string; }
}
declare module "next-auth/jwt" { interface JWT { role?: UserRole; schoolId?: string; } }