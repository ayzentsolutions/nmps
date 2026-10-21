import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Page from "@/models/Page";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";
import type { PageBlock, PageContent } from "@/lib/validations/page";

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamic = "force-dynamic";
async function getPublishedPage(slug: string) {
  if (!process.env.MONGODB_URI) return null;
  await connectToDatabase();
  return Page.findOne({ schoolId: getDefaultSchoolId(), publishedSlug: slug, status: "published", publishedContent: { $ne: null } }).lean();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params; const slug = resolved.slug?.join("/") || "home";
  const page = await getPublishedPage(slug); const content = page?.publishedContent as PageContent | null;
  return {
    title: content?.seo?.title || page?.publishedTitle || (slug === "home" ? "School Website" : "Page not found"),
    description: content?.seo?.description || "Official school information, news and admissions.",
    openGraph: content?.seo?.ogImage ? { images: [content.seo.ogImage] } : undefined,
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
function SiteHeader() {
  return <header className="site-header sticky top-0 z-20"><div className="container-site flex min-h-[78px] items-center justify-between gap-6"><Link href="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-sm font-black text-gold">S</span><span className="font-bold leading-tight">School Website<span className="mt-1 block text-xs font-normal text-slate-500">Learn · Grow · Lead</span></span></Link><nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex"><Link href="/about">About</Link><Link href="/academics">Academics</Link><Link href="/admissions">Admissions</Link><Link href="/notices">Notices</Link><Link href="/contact">Contact</Link></nav><Link className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white" href="/admissions">Admissions</Link></div></header>;
}
export default async function PublicPage({ params }: Props) {
  const resolved = await params; const slug = resolved.slug?.join("/") || "home";
  const page = await getPublishedPage(slug);
  if (!page && slug !== "home") notFound();
  const content = page?.publishedContent as PageContent | null;
  return <main><SiteHeader/>{content?.blocks?.length ? content.blocks.map((block,index)=><RenderBlock key={block.id || index} block={block}/>) : <><section className="hero-landing"><div className="container-site hero-content py-24 md:py-32"><p className="eyebrow !text-gold">A place to learn, grow, and lead</p><h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">Every learner deserves a remarkable beginning.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">A school community built on curiosity, character, and the confidence to shape a brighter future.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" href="/admissions">Explore admissions</Link><Link className="btn-secondary" href="/about">Discover our school</Link></div></div></section><section className="section-pad container-site"><div className="max-w-2xl"><p className="eyebrow">A thoughtful education</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">Room to discover strengths. Support to reach further.</h2><p className="mt-5 leading-8 text-slate-600">This is a generic starting shell. An authorized editor can publish the school’s actual homepage using approved CMS content blocks.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[{title:"Learning",body:"Create space for questions, exploration, and strong foundations."},{title:"Community",body:"Help students and families feel informed, included, and supported."},{title:"Possibility",body:"Share opportunities that help every student find their path."}].map((item)=><article key={item.title} className="content-card"><span className="eyebrow">Our approach</span><h3 className="mt-4 text-xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.body}</p></article>)}</div><div className="mt-10 rounded-3xl bg-paper p-7 md:p-10"><p className="eyebrow">Your website, your story</p><h2 className="mt-3 text-2xl font-bold">Publish the first page from the CMS.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Configure MongoDB and create the first administrator through the one-time bootstrap endpoint, then build and publish the homepage.</p><Link className="mt-6 inline-flex font-bold text-teal underline underline-offset-4" href="/admin">Open staff sign in</Link></div></section></>}<footer className="bg-ink py-10 text-white"><div className="container-site flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-bold">School Website</p><p className="mt-1 text-sm text-slate-300">Official information for students and families.</p></div><div className="flex flex-wrap gap-5 text-sm text-slate-300"><Link href="/privacy-policy">Privacy</Link><Link href="/terms-and-conditions">Terms</Link><Link href="/contact">Contact</Link></div></div></footer></main>;
}