import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/services/settings";
import { internalError } from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const settings=await getSiteSettings();
    return NextResponse.json({data:{schoolName:settings.schoolName,tagline:settings.tagline,logoUrl:settings.logoUrl,faviconUrl:settings.faviconUrl,theme:settings.theme,navigation:settings.navigation,contact:settings.contact,socialLinks:settings.socialLinks,announcement:settings.announcement,footerText:settings.footerText,seo:settings.seo}});
  }catch(error){return internalError(error);}
}