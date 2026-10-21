import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import { createPage, serializePage } from "@/lib/services/pages";
import { createPageSchema, pageContentSchema } from "@/lib/validations/page";
import { getSchoolFilter, getSchoolIdForSession } from "@/lib/school";
import { apiError, internalError, validationError } from "@/lib/api-response";
import Page from "@/models/Page";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await authorize("pages:read");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    await connectToDatabase();
    const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80);
    const filter: Record<string, unknown> = { ...getSchoolFilter(access.session) };
    const status = request.nextUrl.searchParams.get("status");
    if (status && ["draft","published","archived"].includes(status)) filter.status = status;
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { slug: { $regex: q, $options: "i" } }];
    const pageNum = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 20)));
    const [items, total] = await Promise.all([
      Page.find(filter).sort({ updatedAt: -1 }).skip((pageNum - 1) * limit).limit(limit).lean(),
      Page.countDocuments(filter)
    ]);
    return NextResponse.json({ data: items.map(serializePage), pagination: { page: pageNum, limit, total } });
  } catch (error) { return internalError(error); }
}

export async function POST(request: NextRequest) {
  const access = await authorize("pages:create");
  if (access.response) return access.response;
  if (!access.session) return apiError("Authentication required.", 401);
  try {
    await connectToDatabase();
    const parsed = createPageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const draftContent = pageContentSchema.parse(parsed.data.draftContent ?? { blocks: [], seo: {} });
    const page = await createPage({
      schoolId: getSchoolIdForSession(access.session, parsed.data.schoolId),
      title: parsed.data.title, slug: parsed.data.slug, draftContent, actorId: access.session.user.id
    });
    return NextResponse.json({ data: serializePage(page) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) return apiError("A page with this slug already exists for this school.", 409);
    return internalError(error);
  }
}