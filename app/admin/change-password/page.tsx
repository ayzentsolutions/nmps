import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { ArrowLeft, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import ChangePasswordForm from "@/components/cms/change-password-form";

export const metadata: Metadata = { title: "Account & security", robots: { index: false, follow: false } };

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  const mustChangePassword = Boolean(session.user.mustChangePassword);

  return <main className="admin-shell min-h-screen">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {!mustChangePassword ? <Link href="/admin/dashboard" className="rounded-lg border p-2" aria-label="Back to dashboard"><ArrowLeft size={17}/></Link> : null}
          <span className="rounded-xl bg-ink p-2 text-white"><KeyRound size={20}/></span>
          <div className="font-bold">School CMS<span className="mt-0.5 block text-xs font-normal text-slate-500">Account & security</span></div>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><LogOut size={15}/>Sign out</button>
        </form>
      </div>
    </header>
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6"><p className="eyebrow">Account settings</p><h1 className="mt-2 text-3xl font-bold text-ink">Account & security</h1><p className="mt-2 leading-7 text-slate-500">Review the identity attached to your session and securely change your password.</p></div>
      {mustChangePassword ? <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><ShieldCheck className="mt-0.5 shrink-0" size={20}/><div><p className="font-semibold">Password change required</p><p className="mt-1 text-sm leading-6">Your account must use a new password before the rest of the admin workspace can be used.</p></div></div> : null}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-teal/10 p-3 text-teal"><ShieldCheck size={20}/></span><div><h2 className="font-bold">Signed-in account</h2><p className="text-sm text-slate-500">These account details are read-only here.</p></div></div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt><dd className="mt-1 break-words font-semibold text-ink">{session.user.name || "Not set"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt><dd className="mt-1 break-words font-semibold text-ink">{session.user.email || "Not set"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt><dd className="mt-1 font-semibold capitalize text-ink">{session.user.role.replaceAll("_", " ")}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">School scope</dt><dd className="mt-1 break-words font-semibold text-ink">{session.user.schoolId}</dd></div>
        </dl>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-teal/10 p-3 text-teal"><KeyRound size={20}/></span><div><h2 className="text-lg font-bold text-ink">{mustChangePassword ? "Set your password" : "Change password"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{mustChangePassword ? "Replace the temporary password before continuing." : "Enter your current password and choose a new one. Changing it will sign you out of existing sessions."}</p></div></div>
        <ChangePasswordForm/>
      </section>
      {!mustChangePassword ? <p className="mt-5 text-sm text-slate-500"><Link href="/admin/forgot-password" className="font-semibold text-teal underline underline-offset-4">Forgot your current password?</Link> Request a reset link by email instead.</p> : null}
    </div>
  </main>;
}
