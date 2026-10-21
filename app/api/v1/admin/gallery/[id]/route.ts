import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import GalleryAlbum from "@/models/GalleryAlbum";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {galleryUpdateSchema} from "@/lib/validations/gallery";
import {apiError,internalError,validationError} from "@/lib/api-response";
type Context={params:Promise<{id:string}>};
export async function PUT(request:NextRequest,context:Context){
 const access=await authorize("gallery:update");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid gallery ID.",400);
  const parsed=galleryUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();const album=await GalleryAlbum.findOne({_id:id,...getSchoolFilter(access.session)});if(!album)return apiError("Album not found.",404);
  if(album.status==="published")return apiError("Unpublish this album before editing its draft.",409);
  const d=parsed.data;if(d.title!==undefined)album.title=d.title;if(d.slug!==undefined)album.slug=d.slug;if(d.description!==undefined)album.description=d.description;if(d.coverImageUrl!==undefined)album.coverImageUrl=d.coverImageUrl;if(d.items!==undefined)album.items=d.items;
  album.updatedBy=access.session.user.id;await album.save();
  await recordAudit({ schoolId: album.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "gallery.updated", targetType: "gallery-album", targetId: String(album._id), metadata: { slug: album.slug, photoCount: album.items.length } });
  return NextResponse.json({data:{id:String(album._id),title:album.title,slug:album.slug,status:album.status,updatedAt:album.updatedAt}});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("That gallery URL already exists.",409);return internalError(error);}
}
export async function DELETE(_request:NextRequest,context:Context){
 const access=await authorize("gallery:delete");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid gallery ID.",400);
  await connectToDatabase();const album=await GalleryAlbum.findOne({_id:id,...getSchoolFilter(access.session)});if(!album)return apiError("Album not found.",404);
  if(album.status==="published")return apiError("Unpublish this album before deleting it.",409);
  await album.deleteOne();
  await recordAudit({ schoolId: album.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "gallery.deleted", targetType: "gallery-album", targetId: String(album._id), metadata: { slug: album.slug } });
  return new NextResponse(null,{status:204});
 }catch(error){return internalError(error);}
}