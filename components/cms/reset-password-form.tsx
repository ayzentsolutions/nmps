"use client";
import { readApiResponse } from "@/lib/client-api";
import Link from "next/link";
import {useState,type FormEvent} from "react";
export default function ResetPasswordForm({token}:{token:string}){
 const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setMessage("");
  if(!token){setError("This reset link is missing or invalid. Request a new link.");return;}
  if(password!==confirm){setError("The passwords do not match.");return;}
  setBusy(true);
  try{const response=await fetch("/api/v1/auth/password-reset/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});const body=await readApiResponse(response);if(!response.ok)throw new Error(body.error||"Could not reset password.");setMessage(body.message||"Password updated.");setPassword("");setConfirm("");}
  catch(e){setError(e instanceof Error?e.message:"Could not reset password.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">New password<input required type="password" minLength={14} maxLength={200} autoComplete="new-password" className="form-field mt-1.5 font-normal" value={password} onChange={(e)=>setPassword(e.target.value)}/><span className="mt-1 block text-xs font-normal text-slate-500">Use at least 14 characters.</span></label><label className="block text-sm font-semibold">Confirm new password<input required type="password" minLength={14} maxLength={200} autoComplete="new-password" className="form-field mt-1.5 font-normal" value={confirm} onChange={(e)=>setConfirm(e.target.value)}/></label>{error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}{message?<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message} <Link href="/admin/login" className="font-semibold underline">Sign in</Link></p>:null}<button disabled={busy||!token} className="w-full rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-50">{busy?"Updating password…":"Update password"}</button></form>;
}
