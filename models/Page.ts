import mongoose, { Schema, type Model } from "mongoose";
export interface PageDocument {
  schoolId: string; title: string; slug: string; status: "draft" | "published" | "archived";
  draftContent: Record<string, unknown>; publishedContent: Record<string, unknown> | null;
  currentVersionId: mongoose.Types.ObjectId | null; publishedVersionId: mongoose.Types.ObjectId | null;
  versionNumber: number; createdBy: string; updatedBy: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date;
}
const schema = new Schema<PageDocument>({
  schoolId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  status: { type: String, enum: ["draft","published","archived"], default: "draft", index: true },
  draftContent: { type: Schema.Types.Mixed, default: () => ({ blocks: [], seo: { title: "", description: "", ogImage: "" } }) },
  publishedContent: { type: Schema.Types.Mixed, default: null },
  currentVersionId: { type: Schema.Types.ObjectId, ref: "PageVersion", default: null },
  publishedVersionId: { type: Schema.Types.ObjectId, ref: "PageVersion", default: null },
  versionNumber: { type: Number, default: 0, min: 0 },
  createdBy: { type: String, required: true }, updatedBy: { type: String, required: true },
  publishedAt: { type: Date, default: null }
}, { timestamps: true, minimize: false });
schema.index({ schoolId: 1, slug: 1 }, { unique: true });
schema.index({ schoolId: 1, status: 1, updatedAt: -1 });
schema.index({ schoolId: 1, publishedAt: -1 });
const Page = (mongoose.models.Page as Model<PageDocument>) || mongoose.model<PageDocument>("Page", schema);
export default Page;