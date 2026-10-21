import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import Notice from "@/models/Notice";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {noticeUpdateSchema} from "@/lib/validations/notice";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function PUT(request:NextRequest,context:Context){
 const access=await authorize("notices:update");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid notice ID.",400);
  const parsed=noticeUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();const item=await Notice.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!item)return apiError("Notice not found.",404);
  if(item.status==="published")return apiError("Unpublish the notice before editing it.",409);
  const patch=parsed.data;
  if(patch.title!==undefined)item.title=patch.title;if(patch.category!==undefined)item.category=patch.category;if(patch.description!==undefined)item.description=patch.description;if(patch.attachmentUrl!==undefined)item.attachmentUrl=patch.attachmentUrl;
  if(patch.publishAt!==undefined)item.publishAt=patch.publishAt?new Date(patch.publishAt):null;if(patch.expiresAt!==undefined)item.expiresAt=patch.expiresAt?new Date(patch.expiresAt):null;
  item.updatedBy=access.session.user.id;await item.save();
  await recordAudit({ schoolId: item.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "notice.updated", targetType: "notice", targetId: String(item._id), metadata: { category: item.category } });
  return NextResponse.json({data:{id:String(item._id),title:item.title,status:item.status,updatedAt:item.updatedAt}});
 }catch(error){return internalError(error);}
}
export async function DELETE(_request:NextRequest,context:Context){
 const access=await authorize("notices:delete");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid notice ID.",400);
  await connectToDatabase();const item=await Notice.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!item)return apiError("Notice not found.",404);if(item.status==="published")return apiError("Unpublish the notice before deleting it.",409);
  await item.deleteOne();
  await recordAudit({ schoolId: item.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "notice.deleted", targetType: "notice", targetId: String(item._id), metadata: {} });
  return new NextResponse(null,{status:204});
 }catch(error){return internalError(error);}
}