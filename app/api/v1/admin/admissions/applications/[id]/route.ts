import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import AdmissionApplication from "@/models/AdmissionApplication";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {applicationUpdateSchema} from "@/lib/validations/admissions";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid application ID.",400);
  await connectToDatabase();const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)}).lean();
  if(!app)return apiError("Application not found.",404);
  return NextResponse.json({data:{id:String(app._id),referenceNumber:app.referenceNumber,formSchemaVersion:app.formSchemaVersion,admissionSession:app.admissionSession,studentName:app.studentName,dateOfBirth:app.dateOfBirth,gradeApplied:app.gradeApplied,parentName:app.parentName,parentEmail:app.parentEmail,parentPhone:app.parentPhone,address:app.address,answers:app.answers,status:app.status,statusHistory:app.statusHistory,internalNotes:app.internalNotes,createdAt:app.createdAt,updatedAt:app.updatedAt}});
 }catch(error){return internalError(error);}
}
export async function PATCH(request:NextRequest,context:Context){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=applicationUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid application ID.",400);
  await connectToDatabase();const app=await AdmissionApplication.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!app)return apiError("Application not found.",404);
  const input=parsed.data;
  if(input.internalNote)app.internalNotes.push({authorId:access.session.user.id,body:input.internalNote,createdAt:new Date()});
  if(input.status&&input.status!==app.status){app.status=input.status;app.statusHistory.push({status:input.status,changedBy:access.session.user.id,changedAt:new Date(),note:input.note||""});}
  else if(input.note&&!input.internalNote)app.statusHistory.push({status:app.status,changedBy:access.session.user.id,changedAt:new Date(),note:input.note});
  await app.save();
  return NextResponse.json({data:{id:String(app._id),referenceNumber:app.referenceNumber,status:app.status,statusHistory:app.statusHistory,updatedAt:app.updatedAt}});
 }catch(error){return internalError(error);}
}