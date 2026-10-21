import {createHash} from "node:crypto";
import bcrypt from "bcryptjs";
import {NextRequest,NextResponse} from "next/server";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import {connectToDatabase} from "@/lib/mongodb";
import {recordAudit} from "@/lib/audit";
import {passwordResetCompleteSchema} from "@/lib/validations/password-reset";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const parsed=passwordResetCompleteSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return validationError(parsed.error);
 try{
  await connectToDatabase();
  const tokenHash=createHash("sha256").update(parsed.data.token).digest("hex");
  const current=await PasswordResetToken.findOne({tokenHash,consumedAt:null,expiresAt:{$gt:new Date()}}).select("+tokenHash");
  if(!current)return apiError("This reset link is invalid or expired. Request a new one.",400);
  const now=new Date();
  const consumed=await PasswordResetToken.findOneAndUpdate({_id:current._id,consumedAt:null,expiresAt:{$gt:now}},{$set:{consumedAt:now}},{new:true});
  if(!consumed)return apiError("This reset link is invalid or expired. Request a new one.",400);
  const user=await User.findOne({_id:consumed.userId,schoolId:consumed.schoolId,isActive:true}).select("+passwordHash");
  if(!user)return apiError("This reset link is invalid or expired. Request a new one.",400);
  user.passwordHash=await bcrypt.hash(parsed.data.password,12);
  await user.save();
  await PasswordResetToken.deleteMany({userId:user._id});
  await recordAudit({schoolId:user.schoolId,actorId:String(user._id),actorRole:user.role,action:"user.password-reset",targetType:"user",targetId:String(user._id),metadata:{method:"email-token"}});
  return NextResponse.json({message:"Password updated. You can now sign in with your new password."});
 }catch(error){return internalError(error);}
}
