import { NextRequest, NextResponse } from "next/server";
import Page from "@/models/Page";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";
import { internalError } from "@/lib/api-response";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const schoolId = getDefaultSchoolId();
    const slug = request.nextUrl.searchParams.get("slug");
    if (slug) {
      const page = await Page.findOne({ schoolId, slug, status: "published", publishedContent: { $ne: null } }).lean();
      if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
      return NextResponse.json({ data: { title: page.title, slug: page.slug, content: page.publishedContent, publishedAt: page.publishedAt } });
    }
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 20), 1), 50);
    const pages = await Page.find({ schoolId, status: "published", publishedContent: { $ne: null } }).select("title slug publishedContent publishedAt updatedAt").sort({ publishedAt: -1 }).limit(limit).lean();
    return NextResponse.json({ data: pages.map((page) => ({ title: page.title, slug: page.slug, content: page.publishedContent, publishedAt: page.publishedAt, updatedAt: page.updatedAt })) });
  } catch (error) { return internalError(error); }
}