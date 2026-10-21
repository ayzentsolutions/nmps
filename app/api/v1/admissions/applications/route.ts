import {randomBytes} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import AdmissionApplication from "@/models/AdmissionApplication";
import ApplicationDocument from "@/models/ApplicationDocument";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {applicationSchema} from "@/lib/validations/admissions";
import {checkRateLimit} from "@/lib/rate-limit";
import {uploadPrivateDocumentBuffer,deletePrivateDocumentAsset} from "@/lib/storage/cloudinary";
import {recordAudit} from "@/lib/audit";
import {sendTransactionalEmail} from "@/lib/email";
import {internalError,validationError} from "@/lib/api-response";

export const dynamic="force-dynamic";
export const runtime="nodejs";

function detectPrivateDocument(buffer:Buffer){
 if(buffer.length>=5&&buffer.toString("ascii",0,5)==="%PDF-")return{mimeType:"application/pdf",format:"pdf"};
 if(buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return{mimeType:"image/jpeg",format:"jpg"};
 if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return{mimeType:"image/png",format:"png"};
 return null;
}
function safeFilename(name:string){return name.replaceAll("/","_").replaceAll("\\","_").replace(/[\r\n]/g,"_").slice(0,255);}

export async function POST(request:NextRequest){
 try{
  const limit=await checkRateLimit(request,"admission-application",5,10*60*1000);
  if(!limit.allowed)return NextResponse.json({error:"Too many applications were submitted from this connection. Please try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});

  let rawInput:unknown;
  let files:File[]=[];
  if(request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")){
   const form=await request.formData();
   const rawFiles=form.getAll("documents");
   if(rawFiles.some((value)=>!(value instanceof File)))return NextResponse.json({error:"Invalid document upload."},{status:422});
   files=rawFiles.filter((value):value is File=>value instanceof File&&value.size>0);
   rawInput={
    admissionSession:form.get("admissionSession"),
    studentName:form.get("studentName"),
    dateOfBirth:form.get("dateOfBirth")||null,
    gradeApplied:form.get("gradeApplied"),
    parentName:form.get("parentName"),
    parentEmail:form.get("parentEmail"),
    parentPhone:form.get("parentPhone"),
    address:form.get("address")||"",
    answers:{}
   };
  }else{
   rawInput=await request.json().catch(()=>null);
  }

  const parsed=applicationSchema.safeParse(rawInput);
  if(!parsed.success)return validationError(parsed.error);
  if(files.length>3)return NextResponse.json({error:"Choose no more than 3 supporting documents."},{status:422});
  const totalBytes=files.reduce((sum,file)=>sum+file.size,0);
  if(totalBytes>4*1024*1024)return NextResponse.json({error:"The combined size of supporting documents must not exceed 4 MB."},{status:413});

  const validatedFiles:{file:File;buffer:Buffer;mimeType:string;format:string}[]=[];
  for(const file of files){
   if(file.size>4*1024*1024)return NextResponse.json({error:"Each supporting document must be 4 MB or smaller."},{status:413});
   const buffer=Buffer.from(await file.arrayBuffer());
   const detected=detectPrivateDocument(buffer);
   if(!detected)return NextResponse.json({error:"Supporting documents must be PDF, JPEG or PNG files."},{status:415});
   if(file.type&&file.type!==detected.mimeType)return NextResponse.json({error:"A supporting document's file type does not match its contents."},{status:415});
   validatedFiles.push({file,buffer,mimeType:detected.mimeType,format:detected.format});
  }

  if(validatedFiles.length&&(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)){
   return NextResponse.json({error:"Secure document storage is not configured yet. Please submit without attachments or contact the school."},{status:503});
  }

  await connectToDatabase();
  const input=parsed.data;
  const schoolId=getDefaultSchoolId();
  const referenceNumber="NMPS-"+new Date().getUTCFullYear()+"-"+randomBytes(5).toString("hex").toUpperCase();
  const uploadedPublicIds:string[]=[];
  let application:Awaited<ReturnType<typeof AdmissionApplication.create>>|null=null;

  try{
   application=await AdmissionApplication.create({
    schoolId,referenceNumber,formSchemaVersion:1,
    admissionSession:input.admissionSession,studentName:input.studentName,
    dateOfBirth:input.dateOfBirth?new Date(input.dateOfBirth):null,gradeApplied:input.gradeApplied,
    parentName:input.parentName,parentEmail:input.parentEmail.toLowerCase(),parentPhone:input.parentPhone,
    address:input.address,answers:input.answers,status:"submitted",
    statusHistory:[{status:"submitted",changedBy:"public-form",changedAt:new Date(),note:"Application received"}]
   });

   for(const item of validatedFiles){
    const uploaded=await uploadPrivateDocumentBuffer({buffer:item.buffer,schoolId,fileName:safeFilename(item.file.name),mimeType:item.mimeType});
    uploadedPublicIds.push(uploaded.publicId);
    const document=await ApplicationDocument.create({
     schoolId,applicationId:application._id,publicId:uploaded.publicId,originalFilename:safeFilename(item.file.name),
     mimeType:item.mimeType,format:uploaded.format||item.format,bytes:uploaded.bytes,uploadedBy:"public-applicant"
    });
    await recordAudit({schoolId,actorId:"public-applicant",actorRole:"public",action:"admission-document.submitted",targetType:"admission-document",targetId:String(document._id),metadata:{applicationId:String(application._id),mimeType:document.mimeType,bytes:document.bytes}});
   }
  }catch(error){
   if(application){
    try{await ApplicationDocument.deleteMany({schoolId,applicationId:application._id});await application.deleteOne();}catch{}
   }
   await Promise.all(uploadedPublicIds.map(async(publicId)=>{try{await deletePrivateDocumentAsset(publicId);}catch{}}));
   throw error;
  }

  await recordAudit({schoolId,actorId:"public-form",actorRole:"public",action:"admission.submitted",targetType:"admission-application",targetId:String(application._id),metadata:{status:application.status,referenceNumber:application.referenceNumber,documentCount:validatedFiles.length}});

  const tasks:Promise<boolean>[]=[
   sendTransactionalEmail({
    category:"admission-confirmation",to:input.parentEmail,subject:"NMPS admission application received",
    text:"Dear "+input.parentName+",\n\nYour admission application has been received.\nReference number: "+referenceNumber+"\nSession: "+input.admissionSession+"\nClass applied for: "+input.gradeApplied+"\n\nPlease keep the reference number for follow-up. This email is an acknowledgement of receipt, not an admission offer.\n\nNeeraj Memorial Public School",
    idempotencyKey:"nmps:"+referenceNumber+":parent-confirmation"
   })
  ];
  const admissionsInbox=process.env.ADMISSIONS_NOTIFICATION_EMAIL?.trim();
  if(admissionsInbox)tasks.push(sendTransactionalEmail({
   category:"admissions-notification",to:admissionsInbox,subject:"New NMPS admission application: "+referenceNumber,
   text:"A new admission application has been submitted.\nReference: "+referenceNumber+"\nStudent: "+input.studentName+"\nSession: "+input.admissionSession+"\nClass: "+input.gradeApplied+"\nParent/guardian: "+input.parentName+"\nParent email: "+input.parentEmail+"\nSupporting documents uploaded: "+validatedFiles.length+"\n\nReview the record in the protected NMPS admin workspace.",
   idempotencyKey:"nmps:"+referenceNumber+":admissions-notification"
  }));
  await Promise.all(tasks);

  return NextResponse.json({data:{referenceNumber:application.referenceNumber,status:application.status,documentsUploaded:validatedFiles.length,message:"Your application has been received. Keep this reference number for follow-up."}},{status:201});
 }catch(error){return internalError(error);}
}
