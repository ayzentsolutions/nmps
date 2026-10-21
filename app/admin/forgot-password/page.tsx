import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ShieldCheck} from "lucide-react";
import ForgotPasswordForm from "@/components/cms/forgot-password-form";
export const metadata:Metadata={title:"Forgot password",robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){
 return <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10"><div className="w-full max-w-md"><Link href="/admin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={16}/>Back to sign in</Link><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><span className="inline-flex rounded-full bg-teal/10 p-3 text-teal"><ShieldCheck size={22}/></span><h1 className="mt-4 text-2xl font-bold text-ink">Reset your password</h1><p className="mt-2 mb-6 text-sm leading-6 text-slate-500">Enter your staff account email. If it matches an active account and email delivery is configured, you’ll receive a time-limited reset link.</p><ForgotPasswordForm/></div></div></main>;
}
