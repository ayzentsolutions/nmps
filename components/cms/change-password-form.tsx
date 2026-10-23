"use client";
import {useState,type FormEvent} from "react";
import {signOut} from "next-auth/react";

export default function ChangePasswordForm(){
 const [currentPassword,setCurrentPassword]=useState("");
 const [newPassword,setNewPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  if(newPassword!==confirmPassword){setError("The new passwords do not match.");return;}
  if(currentPassword===newPassword){setError("Choose a password different from the current password.");return;}
  setBusy(true);
  try{
   const response=await fetch("/api/v1/auth/change-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword,newPassword})});
   const body=await response.json();if(!response.ok)throw new Error(body.error||"Could not change password.");
   await signOut({redirect:false});window.location.assign("/admin/login?passwordChanged=1");
  }catch(e){setError(e instanceof Error?e.message:"Could not change password.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-4">
  <label className="block text-sm font-semibold">Current password<input required type="password" autoComplete="current-password" maxLength={200} className="form-field mt-1.5 font-normal" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)}/></label>
  <label className="block text-sm font-semibold">New password<input required type="password" minLength={14} maxLength={200} autoComplete="new-password" className="form-field mt-1.5 font-normal" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)}/><span className="mt-1 block text-xs font-normal text-slate-500">Use at least 14 characters.</span></label>
  <label className="block text-sm font-semibold">Confirm new password<input required type="password" minLength={14} maxLength={200} autoComplete="new-password" className="form-field mt-1.5 font-normal" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}/></label>
  {error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
  <button disabled={busy} className="w-full rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-50">{busy?"Updating password…":"Change password and sign out"}</button>
 </form>;
}
