import bcrypt from "bcryptjs";
import {NextRequest,NextResponse} from "next/server";
import User from "@/models/User";
import {auth} from "@/lib/auth";
import {connectToDatabase} from "@/lib/mongodb";
import {checkRateLimit} from "@/lib/rate-limit";
import {recordAudit} from "@/lib/audit";
import {changePasswordSchema} from "@/lib/validations/change-password";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const session=await auth();
 if(!session?.user?.id)return apiError("Authentication required.",401);
 const limit=await checkRateLimit(request,"change-password",5,15*60*1000);
 if(!limit.allowed)return NextResponse.json({error:"Too many password changes. Please try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
 const parsed=changePasswordSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return validationError(parsed.error);
 try{
  await connectToDatabase();
  const user=await User.findOne({_id:session.user.id,isActive:true}).select("+passwordHash");
  if(!user)return apiError("This account is unavailable. Sign in again.",401);
  if(!(await bcrypt.compare(parsed.data.currentPassword,user.passwordHash)))return apiError("The current password is incorrect.",400);
  if(await bcrypt.compare(parsed.data.newPassword,user.passwordHash))return apiError("Choose a new password different from the current password.",422);
  const wasRequired=Boolean(user.mustChangePassword);
  user.passwordHash=await bcrypt.hash(parsed.data.newPassword,12);
  user.mustChangePassword=false;
  user.sessionVersion=Number(user.sessionVersion||0)+1;
  await user.save();
  await recordAudit({schoolId:user.schoolId,actorId:String(user._id),actorRole:user.role,action:"user.password-changed",targetType:"user",targetId:String(user._id),metadata:{reason:wasRequired?"first-login":"manual-change"}});
  return NextResponse.json({message:"Password changed. Sign in again using your new password."});
 }catch(error){return internalError(error);}
}
