import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import AdmissionApplication from "@/models/AdmissionApplication";
import ApplicationDocument from "@/models/ApplicationDocument";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {uploadPrivateDocumentBuffer} from "@/lib/storage/cloudinary";
import {recordAudit} from "@/lib/audit";
import {apiError,internalError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export const runtime="nodejs";
export const dynamic="force-dynamic";
function detect(buffer:Buffer){
 if(buffer.length>=5&&buffer.toString("ascii",0,5)==="%PDF-")return{mimeType:"application/pdf",format:"pdf"};
 if(buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return{mimeType:"image/jpeg",format:"jpg"};
 if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return{mimeType:"image/png",format:"png"};
 return null;
}
export async function GET(_request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid application ID.",400);
  await connectToDatabase();const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)}).select("_id schoolId");
  if(!app)return apiError("Application not found.",404);
  const docs=await ApplicationDocument.find({schoolId:app.schoolId,applicationId:app._id}).sort({createdAt:-1}).select("-publicId").lean();
  return NextResponse.json({data:docs.map((doc)=>({id:String(doc._id),filename:doc.originalFilename,mimeType:doc.mimeType,format:doc.format,bytes:doc.bytes,uploadedAt:doc.createdAt}))},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid application ID.",400);
  const form=await request.formData();const candidate=form.get("file");
  if(!(candidate instanceof File))return apiError("Choose a PDF, JPEG or PNG document.",422);
  if(candidate.size===0)return apiError("Selected document is empty.",422);
  if(candidate.size>4*1024*1024)return apiError("Private document upload limit is 4 MB.",413);
  const buffer=Buffer.from(await candidate.arrayBuffer());const detected=detect(buffer);
  if(!detected)return apiError("Unsupported document. Use PDF, JPEG or PNG.",415);
  if(candidate.type&&candidate.type!==detected.mimeType)return apiError("File type does not match file contents.",415);
  await connectToDatabase();const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!app)return apiError("Application not found.",404);
  const uploaded=await uploadPrivateDocumentBuffer({buffer,schoolId:app.schoolId,fileName:candidate.name,mimeType:detected.mimeType});
  try{
   const doc=await ApplicationDocument.create({schoolId:app.schoolId,applicationId:app._id,publicId:uploaded.publicId,originalFilename:candidate.name.replaceAll("/","_").replaceAll("\\","_").replace(/[\r\n]/g,"_").slice(0,255),mimeType:detected.mimeType,format:uploaded.format||detected.format,bytes:uploaded.bytes,uploadedBy:access.session.user.id});
   await recordAudit({schoolId:app.schoolId,actorId:access.session.user.id,actorRole:access.session.user.role,action:"admission-document.uploaded",targetType:"admission-document",targetId:String(doc._id),metadata:{applicationId:String(app._id),mimeType:doc.mimeType,bytes:doc.bytes}});
   return NextResponse.json({data:{id:String(doc._id),filename:doc.originalFilename,mimeType:doc.mimeType,bytes:doc.bytes}},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){
   try{const {deletePrivateDocumentAsset}=await import("@/lib/storage/cloudinary");await deletePrivateDocumentAsset(uploaded.publicId);}catch{}
   throw error;
  }
 }catch(error){return internalError(error);}
}