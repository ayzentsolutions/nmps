import mongoose, { Schema, type Model } from "mongoose";
export interface PageVersionDocument {
  schoolId: string; pageId: mongoose.Types.ObjectId; versionNumber: number; title: string; slug: string;
  content: Record<string, unknown>; status: "draft" | "published"; createdBy: string; createdAt: Date;
}
const schema = new Schema<PageVersionDocument>({
  schoolId: { type: String, required: true, index: true },
  pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
  versionNumber: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, maxlength: 160 }, slug: { type: String, required: true, maxlength: 180 },
  content: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["draft","published"], required: true },
  createdBy: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false }, minimize: false });
schema.index({ pageId: 1, versionNumber: 1 }, { unique: true });
schema.index({ schoolId: 1, pageId: 1, createdAt: -1 });
const PageVersion = (mongoose.models.PageVersion as Model<PageVersionDocument>) || mongoose.model<PageVersionDocument>("PageVersion", schema);
export default PageVersion;