import mongoose, { Schema, type Model } from "mongoose";
export const USER_ROLES = ["super_admin","school_admin","editor","publisher","admissions_staff","enquiry_staff","media_manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export interface UserDocument {
  name: string; email: string; passwordHash: string; role: UserRole; schoolId: string;
  isActive: boolean; mustChangePassword: boolean; sessionVersion: number; createdAt: Date; updatedAt: Date;
}
const schema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: USER_ROLES, required: true, default: "editor" },
  schoolId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  mustChangePassword: { type: Boolean, default: false, index: true },
  sessionVersion: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
schema.index({ email: 1 }, { unique: true });
const User = (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", schema);
export default User;
