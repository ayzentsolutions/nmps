import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import Notice from "@/models/Notice";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
import {revalidatePath} from "next/cache";
type Context={params:Promise<{id:string}>};
export async function POST(_request:NextRequest,context:Context){
 const access=await authorize("notices:publish");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid notice ID.",400);
  await connectToDatabase();const item=await Notice.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!item)return apiError("Notice not found.",404);
  item.status="draft";item.publishedTitle=null;item.publishedCategory=null;item.publishedDescription=null;item.publishedAttachmentUrl=null;item.publishedAt=null;item.updatedBy=access.session.user.id;
  await item.save();
  await recordAudit({ schoolId: item.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "notice.unpublished", targetType: "notice", targetId: String(item._id), metadata: { category: item.category } });
  revalidatePath("/notices");revalidatePath("/");
  return NextResponse.json({data:{id:String(item._id),status:item.status}});
 }catch(error){return internalError(error);}
}