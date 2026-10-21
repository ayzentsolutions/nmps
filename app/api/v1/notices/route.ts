import {NextRequest,NextResponse} from "next/server";
import Notice from "@/models/Notice";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  await connectToDatabase();const now=new Date();
  const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const items=await Notice.find({schoolId:getDefaultSchoolId(),status:"published",publishedAt:{$lte:now},$and:[{$or:[{publishAt:null},{publishAt:{$lte:now}}]},{$or:[{expiresAt:null},{expiresAt:{$gt:now}}]}]})
   .select("publishedTitle publishedCategory publishedDescription publishedAttachmentUrl publishedAt expiresAt")
   .sort({publishedAt:-1}).limit(limit).lean();
  return NextResponse.json({data:items.map((n)=>({title:n.publishedTitle,category:n.publishedCategory,description:n.publishedDescription,attachmentUrl:n.publishedAttachmentUrl,publishedAt:n.publishedAt,expiresAt:n.expiresAt}))});
 }catch(error){return internalError(error);}
}