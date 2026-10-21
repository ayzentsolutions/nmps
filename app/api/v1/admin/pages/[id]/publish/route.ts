import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";
import Page from "@/models/Page";
import { recordAudit } from "@/lib/audit";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { getSchoolFilter } from "@/lib/school";
import { publishPage, serializePage } from "@/lib/services/pages";
import { apiError, internalError } from "@/lib/api-response";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: NextRequest, context: Context) {
  const access = await authorize("pages:publish");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    const slugConflict = await Page.findOne({ schoolId: page.schoolId, publishedSlug: page.slug, _id: { $ne: page._id } }).select("_id");
    if (slugConflict) return apiError("Another published page already uses this URL.", 409);
    const published = await publishPage(page, access.session.user.id);
    revalidatePath("/"); revalidatePath("/" + (published.publishedSlug || published.slug)); revalidateTag("school-pages");
    await recordAudit({ schoolId: published.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "page.published", targetType: "page", targetId: String(published._id), metadata: { slug: published.publishedSlug || published.slug, versionNumber: published.versionNumber } });
    return NextResponse.json({ data: serializePage(published) });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return apiError("Another published page already uses this URL.", 409);
    return internalError(error);
  }
}