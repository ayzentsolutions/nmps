import type {FilterQuery} from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import GalleryAlbum,{type GalleryAlbumDocument} from "@/models/GalleryAlbum";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter,getSchoolIdForSession} from "@/lib/school";
import {gallerySchema} from "@/lib/validations/gallery";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("gallery:read");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<GalleryAlbumDocument>={...getSchoolFilter(access.session)};
  const status=request.nextUrl.searchParams.get("status");if(status&&["draft","published","archived"].includes(status))filter.status=status;
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{title:{$regex:q,$options:"i"}},{slug:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||30)));
  const [albums,total]=await Promise.all([GalleryAlbum.find(filter).sort({updatedAt:-1}).skip((page-1)*limit).limit(limit).lean(),GalleryAlbum.countDocuments(filter)]);
  return NextResponse.json({data:albums.map((a)=>({id:String(a._id),title:a.title,slug:a.slug,description:a.description,coverImageUrl:a.coverImageUrl,items:a.items,status:a.status,publishedAt:a.publishedAt,updatedAt:a.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest){
 const access=await authorize("gallery:create");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=gallerySchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 try{
  await connectToDatabase();const input=parsed.data;
  const album=await GalleryAlbum.create({...input,status:"draft",schoolId:getSchoolIdForSession(access.session),createdBy:access.session.user.id,updatedBy:access.session.user.id});
  return NextResponse.json({data:{id:String(album._id),title:album.title,slug:album.slug,status:album.status}},{status:201});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("A gallery album with this URL already exists.",409);return internalError(error);}
}