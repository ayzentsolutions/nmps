import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import AdmissionApplication from "@/models/AdmissionApplication";
import ApplicationDocument from "@/models/ApplicationDocument";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {createPrivateDocumentDownloadUrl,deletePrivateDocumentAsset} from "@/lib/storage/cloudinary";
import {recordAudit} from "@/lib/audit";
import {apiError,internalError} from "@/lib/api-response";
type Context={params:Promise<{id:string;documentId:string}>};
export async function GET(request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id,documentId}=await context.params;
  if(!mongoose.isValidObjectId(id)||!mongoose.isValidObjectId(documentId))return apiError("Invalid application or document ID.",400);
  await connectToDatabase();
  const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)}).select("_id schoolId");
  if(!app)return apiError("Application not found.",404);
  const doc=await ApplicationDocument.findOne({_id:documentId,applicationId:app._id,schoolId:app.schoolId});
  if(!doc)return apiError("Document not found.",404);
  const url=createPrivateDocumentDownloadUrl(doc.publicId,doc.format,120);
  await recordAudit({schoolId:app.schoolId,actorId:access.session.user.id,actorRole:access.session.user.role,action:"admission-document.downloaded",targetType:"admission-document",targetId:String(doc._id),metadata:{applicationId:String(app._id),mimeType:doc.mimeType}});
  return NextResponse.redirect(url,{headers:{"Cache-Control":"no-store, private","Referrer-Policy":"no-referrer"}});
 }catch(error){return internalError(error);}
}
export async function DELETE(_request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id,documentId}=await context.params;
  if(!mongoose.isValidObjectId(id)||!mongoose.isValidObjectId(documentId))return apiError("Invalid application or document ID.",400);
  await connectToDatabase();
  const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)}).select("_id schoolId");
  if(!app)return apiError("Application not found.",404);
  const doc=await ApplicationDocument.findOne({_id:documentId,applicationId:app._id,schoolId:app.schoolId});
  if(!doc)return apiError("Document not found.",404);
  await deletePrivateDocumentAsset(doc.publicId);await doc.deleteOne();
  await recordAudit({schoolId:app.schoolId,actorId:access.session.user.id,actorRole:access.session.user.role,action:"admission-document.deleted",targetType:"admission-document",targetId:String(doc._id),metadata:{applicationId:String(app._id)}});
  return new NextResponse(null,{status:204});
 }catch(error){return internalError(error);}
}