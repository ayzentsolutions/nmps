import { z } from "zod";
const short = z.string().trim().max(12000);
const base = { id: z.string().min(1).max(100), visible: z.boolean().default(true) };
const hero = z.object({ ...base, type: z.literal("hero"), title: short.max(240), subtitle: short.max(1200).default(""), eyebrow: short.max(100).default(""), buttonLabel: short.max(80).default(""), buttonHref: z.string().max(300).default("") });
const richText = z.object({ ...base, type: z.literal("richText"), title: short.max(240).default(""), body: short });
const cta = z.object({ ...base, type: z.literal("cta"), title: short.max(240), body: short.max(2000).default(""), buttonLabel: short.max(80).default("Learn more"), buttonHref: z.string().max(300).default("") });
const stats = z.object({ ...base, type: z.literal("stats"), title: short.max(240).default(""), items: z.array(z.object({ label: short.max(100), value: short.max(60) })).max(8) });
const cardGrid = z.object({ ...base, type: z.literal("cardGrid"), title: short.max(240).default(""), items: z.array(z.object({ title: short.max(180), body: short.max(1200) })).max(12) });
const imageText = z.object({ ...base, type: z.literal("imageText"), title: short.max(240), body: short.max(4000), imageUrl: z.string().trim().max(1000).refine((value)=>value===""||/^https:\/\/\\S+$/i.test(value),"Use a secure HTTPS URL or leave blank.").default(""), imageAlt: short.max(240).default("") });
const faq = z.object({ ...base, type: z.literal("faq"), title: short.max(240).default(""), items: z.array(z.object({ question: short.max(300), answer: short.max(3000) })).max(30) });
export const blockSchema = z.discriminatedUnion("type", [hero, richText, cta, stats, cardGrid, imageText, faq,
  z.object({
    id: z.string().min(1).max(100), type: z.literal("imageText"), visible: z.boolean().default(true),
    title: z.string().trim().max(180).default(""), body: z.string().max(12000).default(""),
    imageUrl: z.string().trim().max(1000).refine((value) => value === "" || /^https:\/\/\S+$/i.test(value), "Use an HTTPS image URL.").default(""),
    imageAlt: z.string().trim().max(300).default("")
  }),
  z.object({
    id: z.string().min(1).max(100), type: z.literal("stats"), visible: z.boolean().default(true),
    title: z.string().trim().max(180).default(""),
    items: z.array(z.object({ label: z.string().trim().max(100).default(""), value: z.string().trim().max(100).default("") })).max(8).default([])
  }),
  z.object({
    id: z.string().min(1).max(100), type: z.literal("cardGrid"), visible: z.boolean().default(true),
    title: z.string().trim().max(180).default(""),
    items: z.array(z.object({ title: z.string().trim().max(180).default(""), body: z.string().max(2000).default("") })).max(12).default([])
  }),
  z.object({
    id: z.string().min(1).max(100), type: z.literal("faq"), visible: z.boolean().default(true),
    title: z.string().trim().max(180).default(""),
    items: z.array(z.object({ question: z.string().trim().max(300).default(""), answer: z.string().max(4000).default("") })).max(30).default([])
  }),
  z.object({
    id: z.string().min(1).max(100), type: z.literal("videoEmbed"), visible: z.boolean().default(true),
    title: z.string().trim().max(180).default(""),
    videoUrl: z.string().trim().max(1000).refine((value) => value === "" || /^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(value), "Use a YouTube or Vimeo HTTPS URL.").default(""),
    caption: z.string().trim().max(500).default("")
  })]);
export const pageContentSchema = z.object({
  blocks: z.array(blockSchema).max(100),
  seo: z.object({ title: z.string().trim().max(70).default(""), description: z.string().trim().max(180).default(""), ogImage: z.string().trim().max(1000).refine((value)=>value===""||/^https:\/\/\\S+$/i.test(value),"Use a secure HTTPS URL or leave blank.").default("") }).default({ title: "", description: "", ogImage: "" })
});
export const createPageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  schoolId: z.string().trim().max(100).optional(), draftContent: pageContentSchema.optional()
});
export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  draftContent: pageContentSchema.optional()
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
export type PageBlock = z.infer<typeof blockSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;