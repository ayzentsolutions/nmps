import {randomBytes,createHash} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import {connectToDatabase} from "@/lib/mongodb";
import {checkRateLimit} from "@/lib/rate-limit";
import {sendTransactionalEmail} from "@/lib/email";
import {passwordResetRequestSchema} from "@/lib/validations/password-reset";
import {internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
const genericMessage="If an active account matches that email address, a password reset link will be sent.";
export async function POST(request:NextRequest){
 try{
  const limit=await checkRateLimit(request,"password-reset-request",3,15*60*1000);
  if(!limit.allowed)return NextResponse.json({error:"Too many reset requests. Please try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
  const parsed=passwordResetRequestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();
  const user=await User.findOne({email:parsed.data.email.toLowerCase(),isActive:true}).select("_id email schoolId name");
  if(!user)return NextResponse.json({message:genericMessage},{status:200});
  await PasswordResetToken.deleteMany({userId:user._id,consumedAt:null});
  const token=randomBytes(32).toString("base64url");
  const tokenHash=createHash("sha256").update(token).digest("hex");
  const reset=await PasswordResetToken.create({userId:user._id,schoolId:user.schoolId,tokenHash,expiresAt:new Date(Date.now()+30*60*1000),consumedAt:null});
  const baseUrl=process.env.AUTH_URL?.trim();
  if(!baseUrl){console.error("Password reset email skipped: AUTH_URL is not configured.");await reset.deleteOne();return NextResponse.json({message:genericMessage},{status:200});}
  let resetUrl:string;
  try{const url=new URL("/admin/reset-password",baseUrl);url.searchParams.set("token",token);resetUrl=url.toString();}
  catch(error){console.error("Password reset email skipped: AUTH_URL is invalid.",{errorType:error instanceof Error?error.name:"UnknownError"});await reset.deleteOne();return NextResponse.json({message:genericMessage},{status:200});}
  const sent=await sendTransactionalEmail({
   category:"password-reset",to:user.email,subject:"Reset your NMPS staff account password",
   text:"Hello "+user.name+",\n\nA password reset was requested for your NMPS staff account. Use this link within 30 minutes:\n"+resetUrl+"\n\nIf you did not request this, you can ignore this email. Your current password has not changed.\n\nNMPS School CMS",
   idempotencyKey:"nmps:password-reset:"+tokenHash
  });
  if(!sent){await reset.deleteOne();console.error("Password reset email was not sent; reset token was invalidated.",{category:"password-reset"});}
  return NextResponse.json({message:genericMessage},{status:200});
 }catch(error){return internalError(error);}
}
