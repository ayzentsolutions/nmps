import type { Metadata } from "next";
import Link from "next/link";
import { School, ShieldCheck } from "lucide-react";
import LoginForm from "@/components/cms/login-form";
export const metadata:Metadata={title:"Staff sign in",robots:{index:false,follow:false}};
export default function AdminLoginPage(){
  return <main className="grid min-h-screen bg-paper lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-teal/30 blur-3xl"/>
      <Link href="/" className="relative inline-flex items-center gap-3 font-bold"><span className="rounded-xl bg-white/10 p-3"><School size={24}/></span><span>School CMS<span className="mt-1 block text-xs font-normal text-slate-300">Content and communications</span></span></Link>
      <div className="relative max-w-lg"><p className="eyebrow !text-gold">A connected school community</p><h1 className="mt-5 text-5xl font-bold leading-tight">Your school’s story, thoughtfully told.</h1><p className="mt-5 max-w-md leading-7 text-slate-300">Manage pages and publish updates through one secure workspace.</p></div><p className="relative text-xs text-slate-400">Authorized staff access only.</p>
    </section>
    <section className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-md">
      <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="rounded-xl bg-ink p-3 text-white"><School size={22}/></span><span className="font-bold">School CMS</span></div>
      <div className="mb-8"><span className="inline-flex rounded-full bg-teal/10 p-3 text-teal"><ShieldCheck size={22}/></span><p className="eyebrow mt-5">Administration portal</p><h2 className="mt-2 text-3xl font-bold">Welcome back</h2><p className="mt-2 leading-6 text-slate-500">Sign in with your staff account to manage school content.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><LoginForm/></div><div className="mt-4 text-right"><Link href="/admin/forgot-password" className="text-sm font-semibold text-teal underline underline-offset-4">Forgot password?</Link></div><p className="mt-6 text-center text-xs text-slate-500">Need access? Contact your school’s administrator.</p>
    </div></section>
  </main>;
}