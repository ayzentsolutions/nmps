import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import SchoolEvent from "@/models/SchoolEvent";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
import {revalidatePath} from "next/cache";
type Context={params:Promise<{id:string}>};
export async function POST(_request:NextRequest,context:Context){
 const access=await authorize("events:publish");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid event ID.",400);await connectToDatabase();
  const item=await SchoolEvent.findOne({_id:id,...getSchoolFilter(access.session)});if(!item)return apiError("Event not found.",404);
  if(item.endAt&&item.endAt<=item.startAt)return apiError("Event end must be after its start.",422);
  const conflict=await SchoolEvent.findOne({schoolId:item.schoolId,publishedSlug:item.slug,_id:{$ne:item._id}}).select("_id");if(conflict)return apiError("That public event URL is already in use.",409);
  item.publishedTitle=item.title;item.publishedSlug=item.slug;item.publishedDescription=item.description;item.publishedLocation=item.location;item.publishedImageUrl=item.imageUrl;item.publishedStartAt=item.startAt;item.publishedEndAt=item.endAt;item.publishedAt=new Date();item.status="published";item.updatedBy=access.session.user.id;
  await item.save();revalidatePath("/events");revalidatePath("/");return NextResponse.json({data:{id:String(item._id),status:item.status,publishedAt:item.publishedAt}});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("That public event URL is already in use.",409);return internalError(error);}
}