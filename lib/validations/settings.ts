import { z } from "zod";
const safeHref = z.string().trim().max(500).refine((value)=>value===""||(value.startsWith("/")&&!value.startsWith("//"))||/^https?:\/\/\S+$/i.test(value)||value.startsWith("mailto:")||value.startsWith("tel:"),"Use a local path or a safe HTTP(S), email, or telephone URL.");
const navChild = z.object({id:z.string().min(1).max(100),label:z.string().trim().min(1).max(80),href:safeHref});
export const settingsSchema = z.object({
  schoolName:z.string().trim().min(1).max(120),
  tagline:z.string().trim().max(180),
  logoUrl:z.string().trim().max(1000).url().or(z.literal("")),
  faviconUrl:z.string().trim().max(1000).url().or(z.literal("")),
  theme:z.object({
    primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    highlightColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    bodyFont:z.enum(["Arial","Georgia","Inter"]),
    containerWidth:z.enum(["narrow","standard","wide"]),
    sectionSpacing:z.enum(["compact","comfortable","spacious"])
  }),
  navigation:z.array(z.object({id:z.string().min(1).max(100),label:z.string().trim().min(1).max(80),href:safeHref,children:z.array(navChild).max(12)})).max(30),
  contact:z.object({address:z.string().trim().max(500),email:z.string().trim().email().max(254).or(z.literal("")),phone:z.string().trim().max(50)}),
  socialLinks:z.array(z.object({label:z.string().trim().min(1).max(60),url:z.string().trim().max(500).refine((value)=>/^https:\/\/\S+$/i.test(value),"Use a secure HTTPS URL.").refine((value)=>value.startsWith("https://"),"Social links must use HTTPS.")})).max(12),
  announcement:z.object({enabled:z.boolean(),message:z.string().trim().max(300),href:safeHref}),
  footerText:z.string().trim().max(500),
  seo:z.object({title:z.string().trim().max(70),description:z.string().trim().max(180),ogImage:z.string().trim().max(1000).url().or(z.literal(""))})
});
export type SiteSettingsInput=z.infer<typeof settingsSchema>;