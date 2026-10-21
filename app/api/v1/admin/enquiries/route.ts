import type { FilterQuery } from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import Enquiry, { type EnquiryDocument } from "@/models/Enquiry";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("enquiries:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<EnquiryDocument>={...getSchoolFilter(access.session)};
  const status=request.nextUrl.searchParams.get("status");if(status&&["new","contacted","follow_up","converted","closed"].includes(status))filter.status=status;
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{referenceNumber:{$regex:q,$options:"i"}},{name:{$regex:q,$options:"i"}},{email:{$regex:q,$options:"i"}},{subject:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const [items,total]=await Promise.all([Enquiry.find(filter).sort({updatedAt:-1}).skip((page-1)*limit).limit(limit).select("-internalNotes -followUps").lean(),Enquiry.countDocuments(filter)]);
  return NextResponse.json({data:items.map((e)=>({id:String(e._id),referenceNumber:e.referenceNumber,name:e.name,email:e.email,phone:e.phone,subject:e.subject,message:e.message,status:e.status,assignedTo:e.assignedTo,createdAt:e.createdAt,updatedAt:e.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}