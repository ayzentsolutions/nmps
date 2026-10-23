import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {auth,signOut} from "@/lib/auth";
import {ArrowLeft,Image as ImageIcon,LogOut} from "lucide-react";
import MediaManager from "@/components/cms/media-manager";
export const metadata:Metadata={title:"Media library",robots:{index:false,follow:false}};
export default async function AdminMediaPage(){
 const session=await auth();if(!session?.user?.id)redirect("/admin/login");
 if(!["super_admin","school_admin","editor","media_manager"].includes(session.user.role))redirect("/admin/dashboard");
 return <main className="admin-shell min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><Link href="/admin/dashboard" className="rounded-lg border p-2" aria-label="Back to dashboard"><ArrowLeft size={17}/></Link><span className="rounded-xl bg-ink p-2 text-white"><ImageIcon size={20}/></span><div className="font-bold">School CMS<span className="mt-0.5 block text-xs font-normal text-slate-500">Media library</span></div></div><form action={async()=>{"use server";await signOut({redirectTo:"/admin/login"});}}><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><LogOut size={15}/>Sign out</button></form></div></header><div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8"><MediaManager/></div></main>;
}