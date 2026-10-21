"use client";

import {useState, type FormEvent} from "react";
import {CheckCircle2, Mail, MessageSquare} from "lucide-react";
import {PublicSiteHeader, PublicSiteFooter} from "@/components/public-site/public-site-chrome";
const initial={name:"",email:"",phone:"",subject:"",message:"",website:""};
export default function ContactPage(){
 const [form,setForm]=useState(initial);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [reference,setReference]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setReference("");
  try{const response=await fetch("/api/v1/enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const body=await response.json();if(!response.ok)throw new Error(body.error||"Could not send enquiry.");setReference(body.data.referenceNumber);setForm(initial);}
  catch(e){setError(e instanceof Error?e.message:"Could not send enquiry.");}finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-paper"><PublicSiteHeader />
  <section className="bg-ink py-16 text-white"><div className="container-site"><p className="eyebrow !text-gold">We’re here to help</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">Contact the school</h1><p className="mt-4 max-w-2xl leading-7 text-slate-200">Send a message to the school team. Your enquiry will be assigned a reference that you can keep for follow-up.</p></div></section>
  <section className="container-site grid gap-8 py-12 lg:grid-cols-[.7fr_1.3fr]"><div><div className="content-card"><span className="inline-flex rounded-xl bg-teal/10 p-3 text-teal"><Mail size={22}/></span><h2 className="mt-4 text-xl font-bold">Get in touch</h2><p className="mt-2 leading-7 text-slate-600">For admission questions, general information or a request for follow-up, use the form. The staff team can view and respond through the protected admin workflow.</p><div className="mt-5 flex items-center gap-3 text-sm text-slate-600"><MessageSquare size={18} className="text-teal"/>A reference is created after submission.</div></div></div>
   <div className="content-card"><h2 className="text-xl font-bold">Send an enquiry</h2>{reference?<div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 size={28}/><h3 className="mt-3 text-lg font-bold">Thank you for contacting us</h3><p className="mt-2 text-sm">Your reference number is <strong>{reference}</strong>. Please keep it for follow-up.</p><button onClick={()=>setReference("")} className="mt-4 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-bold">Send another enquiry</button></div>:<form onSubmit={submit} className="mt-5 space-y-4">{error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Your name<input required minLength={2} maxLength={160} className="form-field mt-1.5 font-normal" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><label className="text-sm font-semibold">Email<input required type="email" maxLength={254} className="form-field mt-1.5 font-normal" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Phone (optional)<input type="tel" maxLength={40} className="form-field mt-1.5 font-normal" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></label><label className="text-sm font-semibold">Subject<input required minLength={2} maxLength={180} className="form-field mt-1.5 font-normal" value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}/></label></div>
    <label className="block text-sm font-semibold">Message<textarea required minLength={10} maxLength={8000} rows={5} className="form-field mt-1.5 font-normal" value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})}/></label>
    <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Leave this field blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e)=>setForm({...form,website:e.target.value})}/></label>
    <button disabled={busy} className="w-full rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:opacity-50">{busy?"Sending…":"Send enquiry"}</button><p className="text-xs leading-5 text-slate-500">Please do not include sensitive health, financial or identity document information in the message.</p>
   </form>}</div>
  </section><PublicSiteFooter />
 </main>;
}