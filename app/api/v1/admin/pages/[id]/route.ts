import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Page from "@/models/Page";
import PageVersion from "@/models/PageVersion";
import { recordAudit } from "@/lib/audit";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { getSchoolFilter } from "@/lib/school";
import { updatePageSchema } from "@/lib/validations/page";
import { updatePage, serializePage } from "@/lib/services/pages";
import { apiError, internalError, validationError } from "@/lib/api-response";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const access = await authorize("pages:read");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    return NextResponse.json({ data: serializePage(page) });
  } catch (error) { return internalError(error); }
}

export async function PUT(request: NextRequest, context: Context) {
  const access = await authorize("pages:update");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    const parsed = updatePageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    const updated = await updatePage(page, parsed.data, access.session.user.id);
    await recordAudit({ schoolId: updated.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "page.updated", targetType: "page", targetId: String(updated._id), metadata: { slug: updated.slug } });
    return NextResponse.json({ data: serializePage(updated) });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) return apiError("A page with this slug already exists for this school.", 409);
    return internalError(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const access = await authorize("pages:delete");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    if (page.status === "published") return apiError("Unpublish this page before deleting it.", 409);
    await PageVersion.deleteMany({ pageId: page._id, schoolId: page.schoolId });
    await page.deleteOne();
    await recordAudit({ schoolId: page.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "page.deleted", targetType: "page", targetId: String(page._id), metadata: { slug: page.slug } });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return internalError(error); }
}