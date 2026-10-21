import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Page from "@/models/Page";
import PageVersion from "@/models/PageVersion";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { getSchoolFilter } from "@/lib/school";
import { apiError, internalError } from "@/lib/api-response";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  const access = await authorize("pages:read");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) }).select("_id schoolId");
    if (!page) return apiError("Page not found.", 404);
    const versions = await PageVersion.find({ pageId: page._id, schoolId: page.schoolId }).sort({ versionNumber: -1 }).limit(50).select("versionNumber title slug status createdAt createdBy").lean();
    return NextResponse.json({ data: versions.map((v) => ({ id: String(v._id), versionNumber: v.versionNumber, title: v.title, slug: v.slug, status: v.status, createdAt: v.createdAt, createdBy: v.createdBy })) });
  } catch (error) { return internalError(error); }
}