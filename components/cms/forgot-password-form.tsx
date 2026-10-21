"use client";
import {useState,type FormEvent} from "react";
export default function ForgotPasswordForm(){
 const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setMessage("");
  try{const response=await fetch("/api/v1/auth/password-reset/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});const body=await response.json();if(!response.ok)throw new Error(body.error||"Could not process the request.");setMessage(body.message||"If an active account matches that email address, a reset link will be sent.");}
  catch(e){setError(e instanceof Error?e.message:"Could not process the request.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Staff account email<input required type="email" maxLength={254} autoComplete="email" className="form-field mt-1.5 font-normal" value={email} onChange={(e)=>setEmail(e.target.value)}/></label>{error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}{message?<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{message}</p>:null}<button disabled={busy} className="w-full rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-50">{busy?"Requesting link…":"Send reset link"}</button><p className="text-xs leading-5 text-slate-500">For account privacy, the same response is shown whether or not an active account exists.</p></form>;
}
