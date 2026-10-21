import {z} from "zod";
export const publicEnquirySchema=z.object({
 name:z.string().trim().min(2).max(160),
 email:z.string().trim().email().max(254),
 phone:z.string().trim().max(40).default(""),
 subject:z.string().trim().min(2).max(180),
 message:z.string().trim().min(10).max(8000),
 website:z.string().max(0).optional().default("")
});
export const enquiryUpdateSchema=z.object({
 status:z.enum(["new","contacted","follow_up","converted","closed"]).optional(),
 assignedTo:z.string().trim().max(100).nullable().optional(),
 note:z.string().trim().max(500).optional(),
 internalNote:z.string().trim().min(1).max(4000).optional(),
 followUp:z.object({dueAt:z.string().datetime().nullable().optional(),note:z.string().trim().min(1).max(1000)}).optional(),
 completedFollowUpId:z.string().max(100).optional()
}).refine((v)=>Object.keys(v).length>0,"Provide at least one update field.");