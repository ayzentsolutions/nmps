import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import Notice from "@/models/Notice";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
import {revalidatePath} from "next/cache";
type Context={params:Promise<{id:string}>};
export async function POST(_request:NextRequest,context:Context){
 const access=await authorize("notices:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid notice ID.",400);
  await connectToDatabase();const item=await Notice.findOne({_id:id,...getSchoolFilter(access.session)});
  if(!item)return apiError("Notice not found.",404);
  if(item.expiresAt&&item.publishAt&&item.expiresAt<=item.publishAt)return apiError("Expiry must be later than scheduled publication.",422);
  const now=new Date();item.publishedTitle=item.title;item.publishedCategory=item.category;item.publishedDescription=item.description;item.publishedAttachmentUrl=item.attachmentUrl;item.publishedAt=now;item.status="published";item.updatedBy=access.session.user.id;
  await item.save();revalidatePath("/notices");revalidatePath("/");
  return NextResponse.json({data:{id:String(item._id),status:item.status,publishedAt:item.publishedAt}});
 }catch(error){return internalError(error);}
}