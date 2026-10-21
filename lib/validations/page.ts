import { z } from "zod";

const short = z.string().trim().max(12000);
const base = { id: z.string().min(1).max(100), visible: z.boolean().default(true) };
const hrefSchema = z.string().trim().max(500).refine(
  (value) => value === "" || (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\/\S+$/i.test(value),
  "Use a local path or HTTPS URL."
);
const imageUrlSchema = z.string().trim().max(1000).refine(
  (value) => value === "" || /^https:\/\/\S+$/i.test(value),
  "Use an HTTPS image URL or leave blank."
);
const videoUrlSchema = z.string().trim().max(1000).refine((value) => {
  if (value === "") return true;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return parsed.protocol === "https:" && ["youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "player.vimeo.com"].includes(host);
  } catch {
    return false;
  }
}, "Use a valid YouTube or Vimeo HTTPS URL.");

const hero = z.object({
  ...base, type: z.literal("hero"), title: short.max(240), subtitle: short.max(1200).default(""),
  eyebrow: short.max(100).default(""), buttonLabel: short.max(80).default(""), buttonHref: hrefSchema.default("")
});
const richText = z.object({ ...base, type: z.literal("richText"), title: short.max(240).default(""), body: short });
const cta = z.object({
  ...base, type: z.literal("cta"), title: short.max(240), body: short.max(2000).default(""),
  buttonLabel: short.max(80).default("Learn more"), buttonHref: hrefSchema.default("")
});
const stats = z.object({
  ...base, type: z.literal("stats"), title: short.max(240).default(""),
  items: z.array(z.object({ label: short.max(100), value: short.max(60) })).max(8).default([])
});
const cardGrid = z.object({
  ...base, type: z.literal("cardGrid"), title: short.max(240).default(""),
  items: z.array(z.object({ title: short.max(180), body: short.max(1200) })).max(12).default([])
});
const imageText = z.object({
  ...base, type: z.literal("imageText"), title: short.max(240).default(""), body: short.max(4000).default(""),
  imageUrl: imageUrlSchema.default(""), imageAlt: short.max(300).default("")
});
const faq = z.object({
  ...base, type: z.literal("faq"), title: short.max(240).default(""),
  items: z.array(z.object({ question: short.max(300), answer: short.max(4000) })).max(30).default([])
});
const videoEmbed = z.object({
  ...base, type: z.literal("videoEmbed"), title: short.max(180).default(""),
  videoUrl: videoUrlSchema.default(""), caption: short.max(500).default("")
});
const imageGallery = z.object({
  ...base, type: z.literal("imageGallery"), title: short.max(180).default(""),
  items: z.array(z.object({
    id: z.string().min(1).max(100), imageUrl: imageUrlSchema,
    altText: short.max(300).default(""), caption: short.max(500).default("")
  })).max(24).default([])
});
const downloadList = z.object({
  ...base, type: z.literal("downloadList"), title: short.max(180).default(""),
  items: z.array(z.object({
    title: short.max(180).default(""), description: short.max(500).default(""),
    fileUrl: imageUrlSchema
  })).max(30).default([])
});

export const blockSchema = z.discriminatedUnion("type", [
  hero, richText, cta, stats, cardGrid, imageText, faq, videoEmbed, imageGallery, downloadList
]);

export const pageContentSchema = z.object({
  blocks: z.array(blockSchema).max(100),
  seo: z.object({
    title: z.string().trim().max(70).default(""),
    description: z.string().trim().max(180).default(""),
    ogImage: imageUrlSchema.default("")
  }).default({ title: "", description: "", ogImage: "" })
});

const reservedSlugs = new Set([
  "admin", "api", "admissions", "contact", "notices", "events", "gallery",
  "robots", "sitemap", "favicon", "manifest", "privacy-policy", "terms"
]);
const slugSchema = z.string().trim().min(1).max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
  .refine((slug) => !reservedSlugs.has(slug), "This URL is reserved for a system page.");

export const createPageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: slugSchema,
  schoolId: z.string().trim().min(1).max(100).optional(),
  draftContent: pageContentSchema.optional()
});
export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  slug: slugSchema.optional(),
  draftContent: pageContentSchema.optional()
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export type PageBlock = z.infer<typeof blockSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
