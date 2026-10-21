import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";
import Page from "@/models/Page";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { getSchoolFilter } from "@/lib/school";
import { unpublishPage, serializePage } from "@/lib/services/pages";
import { apiError, internalError } from "@/lib/api-response";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: NextRequest, context: Context) {
  const access = await authorize("pages:publish"); if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    const { id } = await context.params; if (!mongoose.isValidObjectId(id)) return apiError("Invalid page ID.", 400);
    await connectToDatabase();
    const page = await Page.findOne({ _id: id, ...getSchoolFilter(access.session) });
    if (!page) return apiError("Page not found.", 404);
    const oldSlug = page.publishedSlug || page.slug;
    const updated = await unpublishPage(page, access.session.user.id);
    revalidatePath("/"); revalidatePath("/" + oldSlug); revalidateTag("school-pages");
    return NextResponse.json({ data: serializePage(updated) });
  } catch (error) { return internalError(error); }
}