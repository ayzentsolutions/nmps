import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter,getDefaultSchoolId} from "@/lib/school";
import {updateUserSchema} from "@/lib/validations/user";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,context:Context){
 const access=await authorize("users:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid user ID.",400);
  const parsed=updateUserSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();const user=await User.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!user)return apiError("User not found.",404);
  const input=parsed.data;const isSuperAdmin=access.session.user.role==="super_admin";const isSelf=String(user._id)===access.session.user.id;
  if(isSelf&&(input.isActive===false||(input.role&&input.role!==user.role)))return apiError("You cannot deactivate your own account or change your own role.",409);
  if(!isSuperAdmin&&input.role&&["super_admin","school_admin"].includes(input.role))return apiError("Only a platform administrator may grant administrator-level roles.",403);
  if(!isSuperAdmin&&input.schoolId&&input.schoolId!==user.schoolId)return apiError("You cannot move users between schools.",403);
  if(user.role==="super_admin"&&!isSuperAdmin)return apiError("Only a platform administrator may update a platform administrator.",403);
  if(input.name!==undefined)user.name=input.name;
  if(input.role!==undefined)user.role=input.role;
  if(input.isActive!==undefined)user.isActive=input.isActive;
  if(isSuperAdmin&&input.schoolId!==undefined)user.schoolId=input.schoolId;
  await user.save();
  return NextResponse.json({data:{id:String(user._id),name:user.name,email:user.email,role:user.role,schoolId:user.schoolId,isActive:user.isActive,updatedAt:user.updatedAt}});
 }catch(error){return internalError(error);}
}
export async function GET(_request:NextRequest,context:Context){
 const access=await authorize("users:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid user ID.",400);await connectToDatabase();const user=await User.findOne({_id:id,...getSchoolFilter(access.session)}).select("name email role schoolId isActive createdAt updatedAt").lean();if(!user)return apiError("User not found.",404);return NextResponse.json({data:{id:String(user._id),name:user.name,email:user.email,role:user.role,schoolId:user.schoolId,isActive:user.isActive,createdAt:user.createdAt,updatedAt:user.updatedAt}});}catch(error){return internalError(error);}
}