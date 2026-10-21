import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import GalleryAlbum from "@/models/GalleryAlbum";
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
  album.status="draft";album.publishedTitle=null;album.publishedSlug=null;album.publishedDescription=null;album.publishedCoverImageUrl=null;album.publishedItems=null;album.publishedAt=null;album.updatedBy=access.session.user.id;
  await album.save();revalidatePath("/gallery");revalidatePath("/");return NextResponse.json({data:{id:String(album._id),status:album.status}});
 }catch(error){return internalError(error);}
}