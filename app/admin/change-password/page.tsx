import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {ShieldCheck} from "lucide-react";
import ChangePasswordForm from "@/components/cms/change-password-form";
export const metadata:Metadata={title:"Change temporary password",robots:{index:false,follow:false}};
export default async function ChangePasswordPage(){
 const session=await auth();
 if(!session?.user?.id)redirect("/admin/login");
 if(!session.user.mustChangePassword)redirect("/admin/dashboard");
 return <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10"><div className="w-full max-w-md"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><span className="inline-flex rounded-full bg-teal/10 p-3 text-teal"><ShieldCheck size={22}/></span><h1 className="mt-4 text-2xl font-bold text-ink">Secure your staff account</h1><p className="mt-2 mb-6 text-sm leading-6 text-slate-500">For security, you must replace the temporary password before accessing the admin workspace.</p><ChangePasswordForm/></div><p className="mt-4 text-center text-xs text-slate-500">Need help? Contact your school administrator.</p><div className="mt-4 text-center"><Link href="/admin/login" className="text-xs font-semibold text-teal underline">Return to sign in</Link></div></div></main>;
}
