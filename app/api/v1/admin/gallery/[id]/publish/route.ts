import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import GalleryAlbum from "@/models/GalleryAlbum";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
import {revalidatePath} from "next/cache";
type Context={params:Promise<{id:string}>};
export async function POST(_request:NextRequest,context:Context){
 const access=await authorize("gallery:publish");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid gallery ID.",400);await connectToDatabase();
  const album=await GalleryAlbum.findOne({_id:id,...getSchoolFilter(access.session)});if(!album)return apiError("Album not found.",404);
  if(album.items.length===0)return apiError("Add at least one image before publishing.",422);
  const conflict=await GalleryAlbum.findOne({schoolId:album.schoolId,publishedSlug:album.slug,_id:{$ne:album._id}}).select("_id");if(conflict)return apiError("That public gallery URL is already in use.",409);
  album.publishedTitle=album.title;album.publishedSlug=album.slug;album.publishedDescription=album.description;album.publishedCoverImageUrl=album.coverImageUrl||album.items[0].imageUrl;album.publishedItems=album.items.map((item)=>({id:item.id,imageUrl:item.imageUrl,altText:item.altText,caption:item.caption,order:item.order}));album.publishedAt=new Date();album.status="published";album.updatedBy=access.session.user.id;
  await album.save();
  await recordAudit({ schoolId: album.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "gallery.published", targetType: "gallery-album", targetId: String(album._id), metadata: { slug: album.publishedSlug, photoCount: album.publishedItems.length } });
  revalidatePath("/gallery");revalidatePath("/");return NextResponse.json({data:{id:String(album._id),status:album.status,publishedAt:album.publishedAt}});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("That public gallery URL is already in use.",409);return internalError(error);}
}