import type {FilterQuery} from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import SchoolEvent,{type SchoolEventDocument} from "@/models/SchoolEvent";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter,getSchoolIdForSession} from "@/lib/school";
import {eventSchema} from "@/lib/validations/event";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("events:read");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<SchoolEventDocument>={...getSchoolFilter(access.session)};
  const status=request.nextUrl.searchParams.get("status");if(status&&["draft","published","archived"].includes(status))filter.status=status;
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{title:{$regex:q,$options:"i"}},{slug:{$regex:q,$options:"i"}},{location:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const [items,total]=await Promise.all([SchoolEvent.find(filter).sort({startAt:-1}).skip((page-1)*limit).limit(limit).lean(),SchoolEvent.countDocuments(filter)]);
  return NextResponse.json({data:items.map((e)=>({id:String(e._id),title:e.title,slug:e.slug,description:e.description,location:e.location,imageUrl:e.imageUrl,startAt:e.startAt,endAt:e.endAt,status:e.status,publishedAt:e.publishedAt,updatedAt:e.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest){
 const access=await authorize("events:create");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=eventSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 try{
  await connectToDatabase();const input=parsed.data;
  const event=await SchoolEvent.create({...input,startAt:new Date(input.startAt),endAt:input.endAt?new Date(input.endAt):null,status:"draft",schoolId:getSchoolIdForSession(access.session),createdBy:access.session.user.id,updatedBy:access.session.user.id});
  return NextResponse.json({data:{id:String(event._id),title:event.title,slug:event.slug,status:event.status}},{status:201});
 }catch(error){if(error&&typeof error==="object"&&"code"in error&&error.code===11000)return apiError("An event with this draft URL already exists.",409);return internalError(error);}
}