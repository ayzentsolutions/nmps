import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import Enquiry from "@/models/Enquiry";
import User from "@/models/User";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {enquiryUpdateSchema} from "@/lib/validations/enquiry";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,context:Context){
 const access=await authorize("enquiries:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid enquiry ID.",400);
  await connectToDatabase();const enquiry=await Enquiry.findOne({_id:id,...getSchoolFilter(access.session)}).lean();
  if(!enquiry)return apiError("Enquiry not found.",404);
  return NextResponse.json({data:{id:String(enquiry._id),referenceNumber:enquiry.referenceNumber,name:enquiry.name,email:enquiry.email,phone:enquiry.phone,subject:enquiry.subject,message:enquiry.message,status:enquiry.status,assignedTo:enquiry.assignedTo,internalNotes:enquiry.internalNotes,followUps:enquiry.followUps,statusHistory:enquiry.statusHistory,createdAt:enquiry.createdAt,updatedAt:enquiry.updatedAt}});
 }catch(error){return internalError(error);}
}
export async function PATCH(request:NextRequest,context:Context){
 const access=await authorize("enquiries:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=enquiryUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid enquiry ID.",400);
  await connectToDatabase();const enquiry=await Enquiry.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!enquiry)return apiError("Enquiry not found.",404);
  const input=parsed.data;
  if(input.assignedTo!==undefined&&input.assignedTo!==null){
   if(!mongoose.isValidObjectId(input.assignedTo))return apiError("Invalid staff user ID.",422);
   const staff=await User.findOne({_id:input.assignedTo,schoolId:enquiry.schoolId,isActive:true}).select("_id");
   if(!staff)return apiError("Assigned staff member does not belong to this school or is inactive.",422);
  }
  if(input.assignedTo!==undefined)enquiry.assignedTo=input.assignedTo;
  if(input.internalNote)enquiry.internalNotes.push({authorId:access.session.user.id,body:input.internalNote,createdAt:new Date()});
  if(input.status&&input.status!==enquiry.status){enquiry.status=input.status;enquiry.statusHistory.push({status:input.status,changedBy:access.session.user.id,changedAt:new Date(),note:input.note||""});}
  else if(input.note&&!input.internalNote)enquiry.statusHistory.push({status:enquiry.status,changedBy:access.session.user.id,changedAt:new Date(),note:input.note});
  if(input.followUp)enquiry.followUps.push({staffId:access.session.user.id,dueAt:input.followUp.dueAt?new Date(input.followUp.dueAt):null,note:input.followUp.note,completedAt:null,createdAt:new Date()});
  if(input.completedFollowUpId){
   if(!mongoose.isValidObjectId(input.completedFollowUpId))return apiError("Invalid follow-up ID.",422);
   const followUp=enquiry.followUps.find((item)=>String((item as { _id?:unknown })._id)===input.completedFollowUpId);
   if(!followUp)return apiError("Follow-up not found.",404);
   followUp.completedAt=new Date();
  }
  await enquiry.save();
  return NextResponse.json({data:{id:String(enquiry._id),referenceNumber:enquiry.referenceNumber,status:enquiry.status,assignedTo:enquiry.assignedTo,internalNotes:enquiry.internalNotes,followUps:enquiry.followUps,statusHistory:enquiry.statusHistory,updatedAt:enquiry.updatedAt}});
 }catch(error){return internalError(error);}
}