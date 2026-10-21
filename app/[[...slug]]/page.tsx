import type { Metadata, CSSProperties } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Page from "@/models/Page";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";
import { getSiteSettings } from "@/lib/services/settings";
import type { PageBlock, PageContent } from "@/lib/validations/page";

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamic = "force-dynamic";
async function getPublishedPage(slug: string) {
  if (!process.env.MONGODB_URI) return null;
  await connectToDatabase();
  return Page.findOne({ schoolId: getDefaultSchoolId(), publishedSlug: slug, status: "published", publishedContent: { $ne: null } }).lean();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug?.join("/") || "home";
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSiteSettings()]);
  const content = page?.publishedContent as PageContent | null;
  return {
    title: content?.seo?.title || page?.publishedTitle || settings.seo.title || settings.schoolName,
    description: content?.seo?.description || settings.seo.description,
    openGraph: content?.seo?.ogImage || settings.seo.ogImage ? { images: [content?.seo?.ogImage || settings.seo.ogImage] } : undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    robots: { index: slug === "home" || Boolean(page), follow: true }
  };
}
function RenderBlock({ block }: { block: PageBlock }) {
  if (!block.visible) return null;
  if (block.type === "hero") return <section className="hero-landing"><div className="container-site hero-content py-24 md:py-32"><p className="eyebrow !text-gold">{block.eyebrow}</p><h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">{block.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{block.subtitle}</p>{block.buttonLabel ? <div className="mt-8"><Link className="btn-primary" href={block.buttonHref || "/"}>{block.buttonLabel}</Link></div> : null}</div></section>;
  if (block.type === "richText") return <section className="section-pad container-site"><div className="max-w-3xl">{block.title ? <h2 className="text-3xl font-bold tracking-tight">{block.title}</h2> : null}<p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-600">{block.body}</p></div></section>;
  if (block.type === "cta") return <section className="container-site py-8"><div className="rounded-3xl bg-teal px-7 py-10 text-white md:px-12"><h2 className="text-3xl font-bold">{block.title}</h2><p className="mt-3 max-w-2xl leading-7 text-white/90">{block.body}</p>{block.buttonLabel ? <Link className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-bold text-ink" href={block.buttonHref || "/contact"}>{block.buttonLabel}</Link> : null}</div></section>;
  if (block.type === "stats") return <section className="container-site grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">{block.items.map((item,index)=><div key={index} className="content-card"><p className="text-3xl font-bold text-teal">{item.value}</p><p className="mt-2 text-sm text-slate-500">{item.label}</p></div>)}</section>;
  if (block.type === "cardGrid") return <section className="section-pad container-site"><h2 className="text-3xl font-bold">{block.title}</h2><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{block.items.map((item,index)=><article key={index} className="content-card"><h3 className="font-bold">{item.title}</h3><p className="mt-2 leading-7 text-slate-600">{item.body}</p></article>)}</div></section>;
  if (block.type === "imageText") return <section className="section-pad container-site grid items-center gap-10 md:grid-cols-2">{block.imageUrl ? <img src={block.imageUrl} alt={block.imageAlt} className="max-h-[440px] w-full rounded-3xl object-cover" loading="lazy"/> : <div className="flex min-h-64 items-center justify-center rounded-3xl bg-paper text-slate-400">Add an image in the CMS</div>}<div><h2 className="text-3xl font-bold">{block.title}</h2><p className="mt-5 whitespace-pre-wrap leading-8 text-slate-600">{block.body}</p></div></section>;
  return <section className="section-pad container-site"><h2 className="text-3xl font-bold">{block.title}</h2><div className="mt-6 space-y-3">{block.items.map((item,index)=><details key={index} className="rounded-xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{item.answer}</p></details>)}</div></section>;
}
function safeSiteHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value) || /^mailto:/i.test(value) || /^tel:/i.test(value)) return value;
  return "/";
}
function SiteHeader({ settings }: { settings: Awaited<ReturnType<typeof getSiteSettings>> }) {
  return <>
    {settings.announcement.enabled && settings.announcement.message ? <div className="bg-[var(--site-primary,#10233f)] px-4 py-2 text-center text-sm text-white">{settings.announcement.href ? <Link href={safeSiteHref(settings.announcement.href)} className="underline underline-offset-4">{settings.announcement.message}</Link> : settings.announcement.message}</div> : null}
    <header className="site-header sticky top-0 z-20"><div className="container-site flex min-h-[78px] items-center justify-between gap-6">
      <Link href="/" className="flex min-w-0 items-center gap-3"><span className="site-brand-mark flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-black text-gold">{settings.logoUrl ? <img src={settings.logoUrl} alt="" className="h-full w-full object-contain" /> : "S"}</span><span className="min-w-0 font-bold leading-tight">{settings.schoolName}<span className="mt-1 block truncate text-xs font-normal text-slate-500">{settings.tagline}</span></span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">{settings.navigation.map((item) => item.children?.length ? <details key={item.id} className="relative"><summary className="cursor-pointer list-none hover:text-[var(--site-accent,#1d837c)]">{item.label} <span aria-hidden="true">⌄</span></summary><div className="absolute left-0 top-full z-30 mt-3 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">{item.children.map((child) => <Link key={child.id} className="block rounded-lg px-3 py-2 hover:bg-slate-50" href={safeSiteHref(child.href)}>{child.label}</Link>)}</div></details> : <Link key={item.id} href={safeSiteHref(item.href)} className="hover:text-[var(--site-accent,#1d837c)]">{item.label}</Link>)}</nav>
      <Link className="btn-site-primary rounded-full px-4 py-2.5 text-sm font-bold text-white" href={safeSiteHref(settings.navigation.find((item) => item.label.toLowerCase().includes("admission"))?.href || "/admissions")}>Admissions</Link>
    </div></header>
  </>;
}
export default async function PublicPage({ params }: Props) {
  const resolved = await params; const slug = resolved.slug?.join("/") || "home";
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSiteSettings()]);
  if (!page && slug !== "home") notFound();
  const content = page?.publishedContent as PageContent | null;
  const themeStyle = { "--site-primary": settings.theme.primaryColor, "--site-accent": settings.theme.accentColor, "--site-highlight": settings.theme.highlightColor, "--site-container": settings.theme.containerWidth === "narrow" ? "920px" : settings.theme.containerWidth === "wide" ? "1380px" : "1180px", "--site-section-space": settings.theme.sectionSpacing === "compact" ? "56px" : settings.theme.sectionSpacing === "spacious" ? "112px" : "86px", fontFamily: settings.theme.bodyFont } as CSSProperties;
  return <main style={themeStyle}><SiteHeader settings={settings}/>{content?.blocks?.length ? content.blocks.map((block,index)=><RenderBlock key={block.id || index} block={block}/>) : <><section className="hero-landing"><div className="container-site hero-content py-24 md:py-32"><p className="eyebrow !text-gold">A place to learn, grow, and lead</p><h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">Every learner deserves a remarkable beginning.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">A school community built on curiosity, character, and the confidence to shape a brighter future.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" href="/admissions">Explore admissions</Link><Link className="btn-secondary" href="/about">Discover our school</Link></div></div></section><section className="section-pad container-site"><div className="max-w-2xl"><p className="eyebrow">A thoughtful education</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">Room to discover strengths. Support to reach further.</h2><p className="mt-5 leading-8 text-slate-600">This is a generic starting shell. An authorized editor can publish the school’s actual homepage using approved CMS content blocks.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[{title:"Learning",body:"Create space for questions, exploration, and strong foundations."},{title:"Community",body:"Help students and families feel informed, included, and supported."},{title:"Possibility",body:"Share opportunities that help every student find their path."}].map((item)=><article key={item.title} className="content-card"><span className="eyebrow">Our approach</span><h3 className="mt-4 text-xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.body}</p></article>)}</div><div className="mt-10 rounded-3xl bg-paper p-7 md:p-10"><p className="eyebrow">Your website, your story</p><h2 className="mt-3 text-2xl font-bold">Publish the first page from the CMS.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Configure MongoDB and create the first administrator through the one-time bootstrap endpoint, then build and publish the homepage.</p><Link className="mt-6 inline-flex font-bold text-teal underline underline-offset-4" href="/admin">Open staff sign in</Link></div></section></>}<footer className="site-footer py-10 text-white"><div className="container-site grid gap-6 sm:grid-cols-2"><div><p className="font-bold">{settings.schoolName}</p><p className="mt-1 text-sm text-slate-300">{settings.footerText || settings.tagline}</p>{settings.contact.address ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{settings.contact.address}</p> : null}<div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">{settings.contact.email ? <a href={"mailto:" + settings.contact.email}>{settings.contact.email}</a> : null}{settings.contact.phone ? <a href={"tel:" + settings.contact.phone}>{settings.contact.phone}</a> : null}</div></div><div className="flex flex-col gap-4 sm:items-end"><div className="flex flex-wrap gap-5 text-sm text-slate-300">{settings.navigation.map((item) => <Link key={item.id} href={safeSiteHref(item.href)}>{item.label}</Link>)}</div>{settings.socialLinks.length ? <div className="flex flex-wrap gap-4 text-sm text-slate-300">{settings.socialLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</div> : null}</div></div></footer></main>;
}