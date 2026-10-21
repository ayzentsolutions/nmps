import {z} from "zod";
export const userRoles=["super_admin","school_admin","editor","publisher","admissions_staff","enquiry_staff","media_manager"] as const;
export const createUserSchema=z.object({
 name:z.string().trim().min(2).max(120),
 email:z.string().trim().email().max(254),
 password:z.string().min(14).max(200),
 role:z.enum(userRoles),
 schoolId:z.string().trim().min(1).max(100).optional()
});
export const updateUserSchema=z.object({
 name:z.string().trim().min(2).max(120).optional(),
 role:z.enum(userRoles).optional(),
 isActive:z.boolean().optional(),
 schoolId:z.string().trim().min(1).max(100).optional()
}).refine((value)=>Object.keys(value).length>0,"Provide at least one user field.");