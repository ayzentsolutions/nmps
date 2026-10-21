"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function LoginForm() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result=await signIn("credentials",{email,password,redirect:false,callbackUrl:"/admin/dashboard"});
      if(result?.error) { setError("Sign-in failed. Check your details or ask your administrator to verify your account."); setBusy(false); return; }
      window.location.assign(result?.url || "/admin/dashboard");
    } catch { setError("Sign-in is temporarily unavailable. Please try again."); setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="email">Work email</label><input className="form-field" id="email" type="email" autoComplete="username" required value={email} onChange={(e)=>setEmail(e.target.value)}/></div>
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="password">Password</label><input className="form-field" id="password" type="password" autoComplete="current-password" required value={password} onChange={(e)=>setPassword(e.target.value)}/></div>
    {error?<p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>:null}
    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={busy}><LockKeyhole size={16}/>{busy?"Signing in…":"Sign in"}<ArrowRight size={16}/></button>
    <p className="text-xs leading-5 text-slate-500">Authorized school staff only. Contact your administrator for access.</p>
  </form>;
}