import type { FilterQuery } from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import AdmissionApplication, { type AdmissionApplicationDocument } from "@/models/AdmissionApplication";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("admissions:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<AdmissionApplicationDocument>={...getSchoolFilter(access.session)};
  const status=request.nextUrl.searchParams.get("status");if(status&&["submitted","under_review","documents_pending","accepted","rejected","withdrawn"].includes(status))filter.status=status;
  const session=request.nextUrl.searchParams.get("session");if(session)filter.admissionSession=session.slice(0,80);
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{referenceNumber:{$regex:q,$options:"i"}},{studentName:{$regex:q,$options:"i"}},{parentEmail:{$regex:q,$options:"i"}},{parentPhone:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const [items,total]=await Promise.all([AdmissionApplication.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).select("-internalNotes -answers").lean(),AdmissionApplication.countDocuments(filter)]);
  return NextResponse.json({data:items.map((a)=>({id:String(a._id),referenceNumber:a.referenceNumber,admissionSession:a.admissionSession,studentName:a.studentName,gradeApplied:a.gradeApplied,parentName:a.parentName,parentEmail:a.parentEmail,parentPhone:a.parentPhone,status:a.status,createdAt:a.createdAt,updatedAt:a.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}