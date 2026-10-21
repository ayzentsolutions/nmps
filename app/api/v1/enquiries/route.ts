import {randomBytes} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import Enquiry from "@/models/Enquiry";
import {recordAudit} from "@/lib/audit";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {publicEnquirySchema} from "@/lib/validations/enquiry";
import {checkRateLimit} from "@/lib/rate-limit";
import {internalError,validationError} from "@/lib/api-response";
import {sendTransactionalEmail} from "@/lib/email";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const limit=await checkRateLimit(request,"public-enquiry",8,10*60*1000);
  if(!limit.allowed)return NextResponse.json({error:"Too many enquiries were submitted from this connection. Please try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
  const parsed=publicEnquirySchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return validationError(parsed.error);
  const input=parsed.data;
  // A filled honeypot is treated as accepted to avoid teaching bots the rule.
  if(input.website)return NextResponse.json({data:{referenceNumber:"Received",message:"Thank you. Your message was received."}},{status:201});
  await connectToDatabase();
  const referenceNumber="ENQ-"+new Date().getUTCFullYear()+"-"+randomBytes(5).toString("hex").toUpperCase();
  const enquiry=await Enquiry.create({
   schoolId:getDefaultSchoolId(),referenceNumber,name:input.name,email:input.email.toLowerCase(),
   phone:input.phone,subject:input.subject,message:input.message,status:"new",
   statusHistory:[{status:"new",changedBy:"public-form",changedAt:new Date(),note:"Enquiry received"}]
  });
  await recordAudit({schoolId:enquiry.schoolId,actorId:"public-form",actorRole:"public",action:"enquiry.submitted",targetType:"enquiry",targetId:String(enquiry._id),metadata:{status:enquiry.status,referenceNumber:enquiry.referenceNumber}});
  await Promise.all([
   sendTransactionalEmail({
    category:"enquiry-confirmation",to:input.email,subject:"NMPS enquiry received: "+referenceNumber,
    text:"Dear "+input.name+",\n\nThank you for contacting Neeraj Memorial Public School. Your message has been received.\nReference number: "+referenceNumber+"\nSubject: "+input.subject+"\n\nPlease keep this reference number for follow-up.\n\nNeeraj Memorial Public School",
    idempotencyKey:"nmps:"+referenceNumber+":sender-confirmation"
   }),
   ...(process.env.ENQUIRY_NOTIFICATION_EMAIL?.trim()?[sendTransactionalEmail({
    category:"enquiry-notification",to:process.env.ENQUIRY_NOTIFICATION_EMAIL.trim(),subject:"New NMPS enquiry: "+referenceNumber,
    text:"A new website enquiry has been received.\nReference: "+referenceNumber+"\nName: "+input.name+"\nEmail: "+input.email+"\nPhone: "+(input.phone||"Not provided")+"\nSubject: "+input.subject+"\n\nOpen the protected NMPS enquiry workspace to review the full message.",
    idempotencyKey:"nmps:"+referenceNumber+":enquiry-notification"
   })]:[])
  ]);
  return NextResponse.json({data:{referenceNumber:enquiry.referenceNumber,message:"Thank you. Your enquiry was received. Keep the reference number for follow-up."}},{status:201});
 }catch(error){return internalError(error);}
}