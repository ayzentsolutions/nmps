import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { getSiteSettings } from "@/lib/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    return {
      title: { default: settings.seo.title || settings.schoolName, template: "%s | " + settings.schoolName },
      description: settings.seo.description || "Official school information, learning updates, events and admissions.",
      icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
      openGraph: settings.seo.ogImage ? { images: [settings.seo.ogImage] } : undefined
    };
  } catch {
    return {
      title: { default: "School Website", template: "%s | School Website" },
      description: "Official school information, learning updates, events and admissions."
    };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let style: CSSProperties = {};
  try {
    const settings = await getSiteSettings();
    style = {
      "--site-primary": settings.theme.primaryColor,
      "--site-accent": settings.theme.accentColor,
      "--site-highlight": settings.theme.highlightColor,
      "--site-container": settings.theme.containerWidth === "narrow" ? "920px" : settings.theme.containerWidth === "wide" ? "1380px" : "1180px",
      "--site-section-space": settings.theme.sectionSpacing === "compact" ? "56px" : settings.theme.sectionSpacing === "spacious" ? "112px" : "86px",
      fontFamily: settings.theme.bodyFont
    } as CSSProperties;
  } catch {
    // Public pages remain available with the default theme if the settings DB is temporarily unavailable.
  }
  return <html lang="en"><body style={style}>{children}</body></html>;
}
