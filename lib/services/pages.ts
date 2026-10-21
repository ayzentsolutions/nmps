import type { HydratedDocument } from "mongoose";
import Page, { type PageDocument } from "@/models/Page";
import PageVersion from "@/models/PageVersion";
import type { PageContent } from "@/lib/validations/page";

export async function createPage(input: { schoolId: string; title: string; slug: string; draftContent: PageContent; actorId: string }) {
  const page = await Page.create({ schoolId: input.schoolId, title: input.title, slug: input.slug, draftContent: input.draftContent, status: "draft", versionNumber: 1, createdBy: input.actorId, updatedBy: input.actorId });
  const version = await PageVersion.create({ schoolId: input.schoolId, pageId: page._id, versionNumber: 1, title: page.title, slug: page.slug, content: input.draftContent, status: "draft", createdBy: input.actorId });
  page.currentVersionId = version._id;
  await page.save();
  return page;
}
export async function updatePage(page: HydratedDocument<PageDocument>, patch: { title?: string; slug?: string; draftContent?: PageContent }, actorId: string) {
  if (patch.title !== undefined) page.title = patch.title;
  if (patch.slug !== undefined) page.slug = patch.slug;
  if (patch.draftContent !== undefined) page.draftContent = patch.draftContent;
  page.updatedBy = actorId; page.versionNumber += 1;
  const version = await PageVersion.create({ schoolId: page.schoolId, pageId: page._id, versionNumber: page.versionNumber, title: page.title, slug: page.slug, content: page.draftContent, status: "draft", createdBy: actorId });
  page.currentVersionId = version._id;
  await page.save(); return page;
}
export async function publishPage(page: HydratedDocument<PageDocument>, actorId: string) {
  page.versionNumber += 1;
  const version = await PageVersion.create({ schoolId: page.schoolId, pageId: page._id, versionNumber: page.versionNumber, title: page.title, slug: page.slug, content: page.draftContent, status: "published", createdBy: actorId });
  page.publishedContent = JSON.parse(JSON.stringify(page.draftContent)) as Record<string, unknown>;
  page.publishedVersionId = version._id; page.status = "published"; page.publishedAt = new Date(); page.updatedBy = actorId;
  await page.save(); return page;
}
export async function unpublishPage(page: HydratedDocument<PageDocument>, actorId: string) {
  page.status = "draft"; page.publishedContent = null; page.publishedVersionId = null; page.publishedAt = null; page.updatedBy = actorId;
  await page.save(); return page;
}
export function serializePage(page: any) {
  return { id: String(page._id), schoolId: page.schoolId, title: page.title, slug: page.slug, status: page.status, draftContent: page.draftContent, publishedContent: page.publishedContent, versionNumber: page.versionNumber, publishedAt: page.publishedAt, createdAt: page.createdAt, updatedAt: page.updatedAt };
}