import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{
 const base=(process.env.AUTH_URL||"https://example.invalid").replace(/\/+$/,"");
 return {rules:{userAgent:"*",allow:"/",disallow:["/admin","/api"]},sitemap:base+"/sitemap.xml"};
}