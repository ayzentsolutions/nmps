import {z} from "zod";
const url=z.string().trim().max(1000).refine((v)=>v===""||(v.startsWith("/")&&!v.startsWith("//"))||/^https:\/\/\S+$/i.test(v),"Image URL must be a relative path or HTTPS URL.");
export const eventSchema=z.object({
 title:z.string().trim().min(2).max(180),
 slug:z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
 description:z.string().trim().min(2).max(8000),
 location:z.string().trim().max(300).default(""),
 imageUrl:url.default(""),
 startAt:z.string().datetime(),
 endAt:z.string().datetime().nullable().optional()
}).refine((v)=>!v.endAt||new Date(v.endAt)>new Date(v.startAt),{path:["endAt"],message:"Event end must be after its start."});
export const eventUpdateSchema=eventSchema.partial().refine((v)=>Object.keys(v).length>0,"Provide at least one field.");