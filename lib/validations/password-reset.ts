import {z} from "zod";
export const passwordResetRequestSchema=z.object({email:z.string().trim().email().max(254)});
export const passwordResetCompleteSchema=z.object({
 token:z.string().trim().min(32).max(128),
 password:z.string().min(14).max(200)
});
