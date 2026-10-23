import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { LayoutDashboard, PanelsTopLeft, Image, Bell, CalendarDays, ArrowUpRight, LogOut, Settings, ClipboardList, MessageSquare, Users, History, ShieldCheck, KeyRound } from "lucide-react";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

const modules = [
  { title: "Pages & visual builder", body: "Create and compose pages with reusable content blocks.", href: "/admin/pages", icon: PanelsTopLeft, tone: "bg-teal/10 text-teal", roles: ["super_admin", "school_admin", "editor", "publisher"] },
  { title: "Media library", body: "Upload, search, edit and reuse public images and circular PDFs.", href: "/admin/media", icon: Image, tone: "bg-amber-100 text-amber-800", roles: ["super_admin", "school_admin", "editor", "media_manager"] },
  { title: "Notices & circulars", body: "Create, schedule, publish and expire school notices and circulars.", href: "/admin/notices", icon: Bell, tone: "bg-blue-100 text-blue-800", roles: ["super_admin", "school_admin", "editor", "publisher"] },
  { title: "Events", body: "Create event drafts with dates, locations and published snapshots.", href: "/admin/events", icon: CalendarDays, tone: "bg-violet-100 text-violet-800", roles: ["super_admin", "school_admin", "editor", "publisher"] },
  { title: "Photo galleries", body: "Build responsive albums using images from the managed media library.", href: "/admin/gallery", icon: Image, tone: "bg-fuchsia-100 text-fuchsia-800", roles: ["super_admin", "school_admin", "editor", "publisher"] },
  { title: "Admissions", body: "Review applications, update status and record staff-only notes.", href: "/admin/admissions", icon: ClipboardList, tone: "bg-orange-100 text-orange-800", roles: ["super_admin", "school_admin", "admissions_staff"] },
  { title: "Enquiries CRM", body: "Assign enquiries, track their lifecycle and schedule follow-ups.", href: "/admin/enquiries", icon: MessageSquare, tone: "bg-cyan-100 text-cyan-800", roles: ["super_admin", "school_admin", "enquiry_staff"] },
  { title: "Website settings", body: "Update the school identity, theme, navigation, contact details and footer.", href: "/admin/settings", icon: Settings, tone: "bg-slate-100 text-slate-800", roles: ["super_admin", "school_admin"] },
  { title: "Staff accounts", body: "Create staff accounts, assign roles and disable access when needed.", href: "/admin/users", icon: Users, tone: "bg-rose-100 text-rose-800", roles: ["super_admin", "school_admin"] },
  { title: "Audit log", body: "Review recent administrator actions, actors and targets.", href: "/admin/audit-logs", icon: History, tone: "bg-indigo-100 text-indigo-800", roles: ["super_admin", "school_admin"] }
];

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (session.user.mustChangePassword) redirect("/admin/change-password");

  const visibleModules = modules.filter((module) => (module.roles as string[]).includes(session.user.role));

  return <div className="admin-shell">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold"><span className="rounded-xl bg-ink p-2.5 text-white"><LayoutDashboard size={20}/></span><span>School CMS<span className="mt-0.5 block text-xs font-normal text-slate-500">Administration workspace</span></span></Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{session.user.name || session.user.email}</p><p className="text-xs capitalize text-slate-500">{session.user.role.replaceAll("_", " ")}</p></div>
          <Link href="/admin/change-password" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><KeyRound size={15}/><span className="hidden sm:inline">Account & security</span><span className="sm:hidden">Account</span></Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><LogOut size={15}/><span className="hidden sm:inline">Sign out</span></button></form>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="eyebrow">Your workspace</p><h1 className="mt-2 text-3xl font-bold">Good to see you.</h1><p className="mt-3 max-w-2xl leading-7 text-slate-500">Manage the school information and operational tasks available to your staff role. Draft content stays private until explicitly published.</p>
      <div className="mt-6 max-w-2xl border-l-2 border-teal pl-4 text-sm leading-6 text-slate-600">Choose a workspace below to manage website content, admissions, enquiries, media, or staff access. Available tools depend on your assigned role.</div>
      <h2 className="mt-10 text-lg font-bold">Your workspaces</h2>
      {visibleModules.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visibleModules.map((module) => { const Icon = module.icon; return <Link key={module.title} href={module.href} className="content-card group transition hover:-translate-y-0.5 hover:shadow-soft"><span className={"inline-flex rounded-xl p-3 " + module.tone}><Icon size={20}/></span><h3 className="mt-5 flex items-center justify-between gap-2 font-bold">{module.title}<ArrowUpRight size={16} className="shrink-0 text-slate-400 group-hover:text-teal"/></h3><p className="mt-2 text-sm leading-6 text-slate-500">{module.body}</p></Link>; })}</div> : <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No workspaces are assigned to this account. Contact your school administrator.</p>}
      <h2 className="mt-10 text-lg font-bold">Account & security</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Link href="/admin/change-password" className="content-card group transition hover:-translate-y-0.5 hover:shadow-soft"><span className="inline-flex rounded-xl bg-teal/10 p-3 text-teal"><ShieldCheck size={20}/></span><h3 className="mt-4 flex items-center justify-between font-bold">Change password <ArrowUpRight size={16} className="text-slate-400 group-hover:text-teal"/></h3><p className="mt-2 text-sm leading-6 text-slate-500">Update your account password, review your sign-in identity, and revoke existing sessions by changing your password.</p></Link>
        <Link href="/admin/forgot-password" className="content-card group transition hover:-translate-y-0.5 hover:shadow-soft"><span className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-800"><KeyRound size={20}/></span><h3 className="mt-4 flex items-center justify-between font-bold">Forgot password / recovery <ArrowUpRight size={16} className="text-slate-400 group-hover:text-teal"/></h3><p className="mt-2 text-sm leading-6 text-slate-500">Request an email reset link if you cannot sign in. Email delivery must be configured.</p></Link>
      </div>
      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 text-teal" size={20}/><div><h3 className="font-bold">Security reminder</h3><p className="mt-1 text-sm leading-6 text-slate-600">Use a unique password, sign out from shared devices, and ask an administrator to disable accounts when staff access should end. Password changes invalidate existing sessions.</p></div></div></div>
    </main>
  </div>;
}
