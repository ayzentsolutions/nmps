import {NextRequest,NextResponse} from "next/server";
import GalleryAlbum from "@/models/GalleryAlbum";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  await connectToDatabase();const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||30)));
  const albums=await GalleryAlbum.find({schoolId:getDefaultSchoolId(),status:"published",publishedSlug:{$type:"string"}}).select("publishedTitle publishedSlug publishedDescription publishedCoverImageUrl publishedItems publishedAt").sort({publishedAt:-1}).limit(limit).lean();
  return NextResponse.json({data:albums.map((album)=>({title:album.publishedTitle,slug:album.publishedSlug,description:album.publishedDescription,coverImageUrl:album.publishedCoverImageUrl,photoCount:album.publishedItems?.length||0,publishedAt:album.publishedAt}))});
 }catch(error){return internalError(error);}
}