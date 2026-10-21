import {randomBytes} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import AdmissionApplication from "@/models/AdmissionApplication";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {applicationSchema} from "@/lib/validations/admissions";
import {checkRateLimit} from "@/lib/rate-limit";
import {internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const limit=await checkRateLimit(request,"admission-application",5,10*60*1000);
  if(!limit.allowed)return NextResponse.json({error:"Too many applications were submitted from this connection. Please try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
  const parsed=applicationSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();
  const ref="NMPS-"+new Date().getUTCFullYear()+"-"+randomBytes(5).toString("hex").toUpperCase();
  const input=parsed.data;
  const application=await AdmissionApplication.create({
   schoolId:getDefaultSchoolId(),referenceNumber:ref,formSchemaVersion:1,
   admissionSession:input.admissionSession,studentName:input.studentName,
   dateOfBirth:input.dateOfBirth?new Date(input.dateOfBirth):null,gradeApplied:input.gradeApplied,
   parentName:input.parentName,parentEmail:input.parentEmail.toLowerCase(),parentPhone:input.parentPhone,
   address:input.address,answers:input.answers,status:"submitted",
   statusHistory:[{status:"submitted",changedBy:"public-form",changedAt:new Date(),note:"Application received"}]
  });
  return NextResponse.json({data:{referenceNumber:application.referenceNumber,status:application.status,message:"Your application has been received. Keep this reference number for follow-up."}},{status:201});
 }catch(error){return internalError(error);}
}