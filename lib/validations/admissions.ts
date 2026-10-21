import {z} from "zod";
export const applicationSchema=z.object({
 admissionSession:z.string().trim().min(2).max(80),
 studentName:z.string().trim().min(2).max(160),
 dateOfBirth:z.string().date().nullable().optional(),
 gradeApplied:z.string().trim().min(1).max(80),
 parentName:z.string().trim().min(2).max(160),
 parentEmail:z.string().trim().email().max(254),
 parentPhone:z.string().trim().min(7).max(40),
 address:z.string().trim().max(800).default(""),
 answers:z.record(z.string().max(100),z.string().trim().max(2000)).default({})
});
export const applicationUpdateSchema=z.object({
 status:z.enum(["submitted","under_review","documents_pending","accepted","rejected","withdrawn"]).optional(),
 note:z.string().trim().max(500).optional(),
 internalNote:z.string().trim().min(1).max(4000).optional()
}).refine((v)=>Object.keys(v).length>0,"Provide at least one update field.");