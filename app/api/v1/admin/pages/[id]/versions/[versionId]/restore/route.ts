import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Page from "@/models/Page";
import PageVersion from "@/models/PageVersion";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { getSchoolFilter } from "@/lib/school";
import { pageContentSchema } from "@/lib/validations/page";
import { updatePage, serializePage } from "@/lib/services/pages";
import { apiError, internalError } from "@/lib/api-response";
type Context = { params: Promise<{ id: string; versionId: string }> };
export async function POST(_request: NextRequest, context: Context) {
  const access = await authorize("pages:update");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id, versionId } = await context.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(versionId)) return apiError("Invalid page or version ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    const version = await PageVersion.findOne({ _id: versionId, pageId: page._id, schoolId: page.schoolId });
    if (!version) return apiError("Version not found for this page.", 404);
    const content = pageContentSchema.safeParse(version.content);
    if (!content.success) return apiError("This version does not match the current content schema and cannot be restored automatically.", 409);
    const restored = await updatePage(page, { title: version.title, slug: version.slug, draftContent: content.data }, access.session.user.id);
    return NextResponse.json({ data: serializePage(restored), message: "Version restored as a new draft. Publish separately to make it public." });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) return apiError("The historical slug is already used by another page.", 409);
    return internalError(error);
  }
}