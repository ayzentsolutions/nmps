import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ShieldCheck} from "lucide-react";
import ResetPasswordForm from "@/components/cms/reset-password-form";
export const metadata:Metadata={title:"Set a new password",robots:{index:false,follow:false}};
type Props={searchParams:Promise<{token?:string}>};
export default async function ResetPasswordPage({searchParams}:Props){
 const params=await searchParams;
 return <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10"><div className="w-full max-w-md"><Link href="/admin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={16}/>Back to sign in</Link><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><span className="inline-flex rounded-full bg-teal/10 p-3 text-teal"><ShieldCheck size={22}/></span><h1 className="mt-4 text-2xl font-bold text-ink">Choose a new password</h1><p className="mt-2 mb-6 text-sm leading-6 text-slate-500">Reset links expire after 30 minutes and can be used only once.</p><ResetPasswordForm token={params.token||""}/></div></div></main>;
}
