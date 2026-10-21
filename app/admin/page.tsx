import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export default async function AdminRootPage(){ const session=await auth(); redirect(session?.user?.id?"/admin/dashboard":"/admin/login"); }