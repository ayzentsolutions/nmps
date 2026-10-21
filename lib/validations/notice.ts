import {z} from "zod";
const url=z.string().trim().max(1000).refine((v)=>v===""||(v.startsWith("/")&&!v.startsWith("//"))||/^https:\/\/\S+$/i.test(v),"Attachment must be a relative path or HTTPS URL.");
const noticeObjectSchema=z.object({
 title:z.string().trim().min(2).max(180),
 category:z.string().trim().min(1).max(80).default("General"),
 description:z.string().trim().min(2).max(8000),
 attachmentUrl:url.default(""),
 publishAt:z.string().datetime().nullable().optional(),
 expiresAt:z.string().datetime().nullable().optional()
});
const validSchedule=(v:{publishAt?:string|null;expiresAt?:string|null})=>!v.publishAt||!v.expiresAt||new Date(v.expiresAt)>new Date(v.publishAt);
export const noticeSchema=noticeObjectSchema.refine(validSchedule,{path:["expiresAt"],message:"Expiry must be later than the scheduled publication time."});
export const noticeUpdateSchema=noticeObjectSchema.partial()
 .refine(validSchedule,{path:["expiresAt"],message:"Expiry must be later than the scheduled publication time."})
 .refine((v)=>Object.keys(v).length>0,"Provide at least one field.");
export type NoticeInput=z.infer<typeof noticeSchema>;
