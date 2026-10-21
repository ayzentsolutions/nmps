import type { MetadataRoute } from "next";
import Page from "@/models/Page";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=(process.env.AUTH_URL||"https://example.invalid").replace(/\/+$/,"");
 const entries:MetadataRoute.Sitemap=[{url:base+"/",lastModified:new Date(),changeFrequency:"weekly",priority:1}];
 if(!process.env.MONGODB_URI)return entries;
 try{
  await connectToDatabase();
  const pages=await Page.find({schoolId:getDefaultSchoolId(),status:"published",publishedSlug:{$type:"string"}}).select("publishedSlug updatedAt").lean();
  return entries.concat(pages.filter((page)=>page.publishedSlug!=="home").map((page)=>({url:base+"/"+page.publishedSlug,lastModified:page.updatedAt||new Date(),changeFrequency:"monthly" as const,priority:0.7})));
 }catch(error){console.error("Sitemap generation failed",error instanceof Error?error.message:"Unknown error");return entries;}
}