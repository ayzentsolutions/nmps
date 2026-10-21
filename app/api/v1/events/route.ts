import {NextRequest,NextResponse} from "next/server";
import SchoolEvent from "@/models/SchoolEvent";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  await connectToDatabase();const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const filter={schoolId:getDefaultSchoolId(),status:"published",publishedSlug:{$type:"string"},publishedAt:{$ne:null}};
  const items=await SchoolEvent.find(filter).select("publishedTitle publishedSlug publishedDescription publishedLocation publishedImageUrl publishedStartAt publishedEndAt publishedAt").sort({publishedStartAt:1}).limit(limit).lean();
  return NextResponse.json({data:items.map((item)=>({title:item.publishedTitle,slug:item.publishedSlug,description:item.publishedDescription,location:item.publishedLocation,imageUrl:item.publishedImageUrl,startAt:item.publishedStartAt,endAt:item.publishedEndAt,publishedAt:item.publishedAt}))});
 }catch(error){return internalError(error);}
}