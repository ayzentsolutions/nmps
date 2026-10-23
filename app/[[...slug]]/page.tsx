/* CMS image URLs may be external HTTPS sources not present in the Next Image remotePatterns allowlist. */
/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Page from "@/models/Page";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";
import { getSiteSettings } from "@/lib/services/settings";
import type { PageBlock, PageContent } from "@/lib/validations/page";
import { PublicSiteHeader, PublicSiteFooter } from "@/components/public-site/public-site-chrome";

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
function getVideoEmbedUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parsed.searchParams.get("v") || (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : "");
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] : parts[parts.length - 1];
      return id && /^\d{5,12}$/.test(id) ? "https://player.vimeo.com/video/" + id : null;
    }
  } catch {
    return null;
  }
  return null;
}

function RenderBlock({ block }: { block: PageBlock }) {
  if (!block.visible) return null;
  const rawBlock = block as unknown as Record<string, unknown>;
  const textValue = (key: string) => typeof rawBlock[key] === "string" ? String(rawBlock[key]).trim() : "";
  if (["hero", "cta", "richText", "imageText"].includes(block.type) && !["title", "subtitle", "body", "buttonLabel", "imageUrl"].some(textValue)) return null;
  if (block.type === "imageGallery") {
    const photos = Array.isArray(block.items) ? block.items.filter((item) => item.imageUrl) : [];
    if (!photos.length) return null;
    return <section className="section-pad"><div className="container-site">{block.title ? <h2 className="mb-6 text-2xl font-bold text-ink md:text-3xl">{block.title}</h2> : null}<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-xl bg-white shadow-soft"><img src={photo.imageUrl} alt={photo.altText || photo.caption || "School gallery photo"} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover"/>{photo.caption ? <figcaption className="p-3 text-sm text-slate-600">{photo.caption}</figcaption> : null}</figure>)}</div></div></section>;
  }
  if (block.type === "downloadList") {
    const docs = Array.isArray(block.items) ? block.items.filter((item) => item.fileUrl) : [];
    if (!docs.length) return null;
    return <section className="section-pad"><div className="container-site"><div className="mx-auto max-w-4xl"><h2 className="text-2xl font-bold text-ink md:text-3xl">{block.title || "Downloads and documents"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{docs.map((doc,index) => <article key={index} className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-ink">{doc.title || "School document"}</h3>{doc.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{doc.description}</p> : null}<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-sm font-bold text-white">Open document</a></article>)}</div></div></div></section>;
  }
  if (block.type === "videoEmbed") {
    const embedUrl = getVideoEmbedUrl(String(block.videoUrl || ""));
    if (!embedUrl) return null;
    return <section className="section-pad"><div className="container-site"><div className="mx-auto max-w-4xl">{block.title ? <h2 className="mb-4 text-2xl font-bold text-ink md:text-3xl">{block.title}</h2> : null}<div className="aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-soft"><iframe src={embedUrl} title={String(block.title || "School video")} className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" /></div>{block.caption ? <p className="mt-3 text-sm text-slate-500">{block.caption}</p> : null}</div></div></section>;
  }

  if (block.type === "hero") return <section className="hero-landing"><div className="container-site hero-content py-16 sm:py-20 md:py-24">{block.eyebrow ? <p className="eyebrow !text-gold">{block.eyebrow}</p> : null}{block.title ? <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">{block.title}</h1> : null}{block.subtitle ? <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{block.subtitle}</p> : null}{block.buttonLabel && block.buttonHref ? <div className="mt-7"><Link className="btn-primary" href={block.buttonHref}>{block.buttonLabel}</Link></div> : null}</div></section>;
  if (block.type === "richText") return <section className="section-pad container-site"><div className="max-w-3xl">{block.title ? <h2 className="text-3xl font-bold tracking-tight">{block.title}</h2> : null}{block.body ? <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-600">{block.body}</p> : null}</div></section>;
  if (block.type === "cta") return <section className="container-site py-6"><div className="rounded-xl bg-teal px-6 py-7 text-white sm:px-8">{block.title ? <h2 className="text-2xl font-bold">{block.title}</h2> : null}{block.body ? <p className="mt-3 max-w-2xl leading-7 text-white/90">{block.body}</p> : null}{block.buttonLabel && block.buttonHref ? <Link className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 font-bold text-ink" href={block.buttonHref}>{block.buttonLabel}</Link> : null}</div></section>;
  if (block.type === "stats") { const metrics = Array.isArray(block.items) ? block.items.filter((item) => item.label?.trim() && item.value?.trim()) : []; if (!metrics.length) return null; return <section className="container-site grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((item,index)=><div key={index} className="content-card"><p className="text-3xl font-bold text-teal">{item.value}</p><p className="mt-2 text-sm text-slate-500">{item.label}</p></div>)}</section>; }
  if (block.type === "cardGrid") { const cards = Array.isArray(block.items) ? block.items.filter((item) => item.title.trim() || item.body.trim()) : []; if (!cards.length) return null; return <section className="section-pad container-site"><h2 className="text-3xl font-bold">{block.title}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((item,index)=><article key={index} className="content-card"><h3 className="font-bold">{item.title}</h3><p className="mt-2 leading-7 text-slate-600">{item.body}</p></article>)}</div></section>; }
  if (block.type === "imageText") return <section className="section-pad container-site grid items-center gap-8 md:grid-cols-2">{block.imageUrl ? <img src={block.imageUrl} alt={block.imageAlt || ""} className="max-h-[440px] w-full rounded-xl object-cover" loading="lazy" decoding="async"/> : null}<div>{block.title ? <h2 className="text-3xl font-bold">{block.title}</h2> : null}{block.body ? <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">{block.body}</p> : null}</div></section>;
  if (block.type === "faq") { const faqs = Array.isArray(block.items) ? block.items.filter((item) => item.question.trim() && item.answer.trim()) : []; if (!faqs.length) return null; return <section className="section-pad container-site">{block.title ? <h2 className="text-3xl font-bold">{block.title}</h2> : null}<div className="mt-5 space-y-3">{faqs.map((item,index)=><details key={index} className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{item.answer}</p></details>)}</div></section>; }
  return null;
}
export default async function PublicPage({ params }: Props) {
  const resolved = await params; const slug = resolved.slug?.join("/") || "home";
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSiteSettings()]);
  if (!page && slug !== "home") notFound();
  const content = page?.publishedContent as PageContent | null;
  const themeStyle = { "--site-primary": settings.theme.primaryColor, "--site-accent": settings.theme.accentColor, "--site-highlight": settings.theme.highlightColor, "--site-container": settings.theme.containerWidth === "narrow" ? "920px" : settings.theme.containerWidth === "wide" ? "1380px" : "1180px", "--site-section-space": settings.theme.sectionSpacing === "compact" ? "56px" : settings.theme.sectionSpacing === "spacious" ? "112px" : "86px", fontFamily: settings.theme.bodyFont } as CSSProperties;
  return <main style={themeStyle}><PublicSiteHeader />{content?.blocks?.length ? content.blocks.map((block,index)=><RenderBlock key={block.id || index} block={block}/>) : <section className="section-pad container-site"><div className="mx-auto max-w-2xl border-t border-slate-200 pt-10"><p className="eyebrow">Website information</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Homepage not published</h1><p className="mt-4 leading-7 text-slate-600">The school has not published its homepage yet. Please check back later or contact the school office for current information.</p></div></section>}<PublicSiteFooter /></main>;
}