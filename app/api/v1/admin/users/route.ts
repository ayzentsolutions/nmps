import type { FilterQuery } from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import User, { type UserDocument } from "@/models/User";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId,getSchoolFilter} from "@/lib/school";
import {createUserSchema} from "@/lib/validations/user";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("users:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<UserDocument>={...getSchoolFilter(access.session)};
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{name:{$regex:q,$options:"i"}},{email:{$regex:q,$options:"i"}}];
  const role=request.nextUrl.searchParams.get("role");if(role&&["super_admin","school_admin","editor","publisher","admissions_staff","enquiry_staff","media_manager"].includes(role))filter.role=role;
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||50)));
  const [items,total]=await Promise.all([User.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).select("name email role schoolId isActive createdAt updatedAt").lean(),User.countDocuments(filter)]);
  return NextResponse.json({data:items.map((u)=>({id:String(u._id),name:u.name,email:u.email,role:u.role,schoolId:u.schoolId,isActive:u.isActive,createdAt:u.createdAt,updatedAt:u.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest){
 const access=await authorize("users:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=createUserSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 const input=parsed.data;const isSuperAdmin=access.session.user.role==="super_admin";
 if(!isSuperAdmin&&["super_admin","school_admin"].includes(input.role))return apiError("Only a platform administrator may create administrator-level accounts.",403);
 const schoolId=isSuperAdmin?(input.schoolId||getDefaultSchoolId()):access.session.user.schoolId;
 try{
  await connectToDatabase();
  const item=await User.create({name:input.name,email:input.email.toLowerCase(),passwordHash:await bcrypt.hash(input.password,12),role:input.role,schoolId,isActive:true});
  await recordAudit({ schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "user.created", targetType: "user", targetId: String(item._id), metadata: { role: item.role } });
  return NextResponse.json({data:{id:String(item._id),name:item.name,email:item.email,role:item.role,schoolId:item.schoolId,isActive:item.isActive}},{status:201});
 }catch(error){
  if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("An account with this email address already exists.",409);
  return internalError(error);
 }
}