import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import SchoolEvent from "@/models/SchoolEvent";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {eventUpdateSchema} from "@/lib/validations/event";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function PUT(request:NextRequest,context:Context){
 const access=await authorize("events:update");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid event ID.",400);
  const parsed=eventUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();const item=await SchoolEvent.findOne({_id:id,...getSchoolFilter(access.session)});if(!item)return apiError("Event not found.",404);
  if(item.status==="published")return apiError("Unpublish this event before editing its draft.",409);
  const d=parsed.data;if(d.title!==undefined)item.title=d.title;if(d.slug!==undefined)item.slug=d.slug;if(d.description!==undefined)item.description=d.description;if(d.location!==undefined)item.location=d.location;if(d.imageUrl!==undefined)item.imageUrl=d.imageUrl;if(d.startAt!==undefined)item.startAt=new Date(d.startAt);if(d.endAt!==undefined)item.endAt=d.endAt?new Date(d.endAt):null;
  if(item.endAt&&item.endAt<=item.startAt)return apiError("Event end must be after its start.",422);
  item.updatedBy=access.session.user.id;await item.save();
  await recordAudit({ schoolId: item.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "event.updated", targetType: "event", targetId: String(item._id), metadata: { slug: item.slug } });
  return NextResponse.json({data:{id:String(item._id),title:item.title,slug:item.slug,status:item.status,updatedAt:item.updatedAt}});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("An event with that draft URL already exists.",409);return internalError(error);}
}
export async function DELETE(_request:NextRequest,context:Context){
 const access=await authorize("events:delete");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid event ID.",400);await connectToDatabase();const item=await SchoolEvent.findOne({_id:id,...getSchoolFilter(access.session)});if(!item)return apiError("Event not found.",404);if(item.status==="published")return apiError("Unpublish this event before deleting it.",409);await item.deleteOne();await recordAudit({schoolId:item.schoolId,actorId:access.session.user.id,actorRole:access.session.user.role,action:"event.deleted",targetType:"event",targetId:String(item._id),metadata:{slug:item.slug}});return new NextResponse(null,{status:204});}catch(error){return internalError(error);}
}