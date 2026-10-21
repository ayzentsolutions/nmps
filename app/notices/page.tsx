import type {Metadata} from "next";

import {FileText, ArrowRight, CalendarDays} from "lucide-react";
import Notice from "@/models/Notice";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {PublicSiteHeader, PublicSiteFooter} from "@/components/public-site/public-site-chrome";
export const metadata:Metadata={title:"Notices & circulars",description:"Published school notices, circulars and important updates."};
export const dynamic="force-dynamic";
export default async function NoticesPage(){
 let notices:{id:string;title:string;category:string;description:string;attachmentUrl:string;publishedAt:Date|null}[]=[];
 if(process.env.MONGODB_URI){
  try{
   await connectToDatabase();const now=new Date();
   const items=await Notice.find({schoolId:getDefaultSchoolId(),status:"published",publishedAt:{$lte:now},$and:[{$or:[{publishAt:null},{publishAt:{$lte:now}}]},{$or:[{expiresAt:null},{expiresAt:{$gt:now}}]}]})
    .select("publishedTitle publishedCategory publishedDescription publishedAttachmentUrl publishedAt").sort({publishedAt:-1}).limit(100).lean();
   notices=items.map((n)=>({id:String(n._id),title:n.publishedTitle||"Notice",category:n.publishedCategory||"General",description:n.publishedDescription||"",attachmentUrl:n.publishedAttachmentUrl||"",publishedAt:n.publishedAt}));
  }catch(error){console.error("Public notices failed to load",error instanceof Error?error.message:"Unknown error");}
 }
 return <main className="min-h-screen bg-paper"><PublicSiteHeader /><section className="bg-ink py-16 text-white"><div className="container-site"><p className="eyebrow !text-gold">Stay informed</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">Notices & circulars</h1><p className="mt-4 max-w-2xl leading-7 text-slate-200">Important updates and documents published by the school.</p></div></section><section className="container-site py-12"><div className="mb-6 flex items-center justify-between"><p className="text-sm text-slate-500">{notices.length} published {notices.length===1?"notice":"notices"}</p></div>{notices.length?<div className="grid gap-4">{notices.map((n)=><article key={n.id} className="content-card"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><span className="inline-flex w-fit rounded-xl bg-teal/10 p-3 text-teal"><FileText size={22}/></span><div className="min-w-0 flex-1"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{n.category}</span><h2 className="mt-3 text-xl font-bold">{n.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{n.description}</p>{n.publishedAt?<p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14}/>{new Date(n.publishedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>:null}</div>{n.attachmentUrl?<a href={n.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-teal underline underline-offset-4">Open attachment<ArrowRight size={15}/></a>:null}</div></article>)}</div>:<div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center"><FileText className="mx-auto text-slate-400" size={34}/><h2 className="mt-4 text-lg font-bold">No notices have been published yet</h2><p className="mt-2 text-sm text-slate-500">Check back later for school announcements and circulars.</p></div>}</section><PublicSiteFooter /></main>;
}