import type {FilterQuery} from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import AuditLog,{type AuditLogDocument} from "@/models/AuditLog";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("audit:read");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();const filter:FilterQuery<AuditLogDocument>={...getSchoolFilter(access.session)};
  const action=request.nextUrl.searchParams.get("action")?.trim().slice(0,120);if(action)filter.action=action;
  const actor=request.nextUrl.searchParams.get("actor")?.trim().slice(0,120);if(actor)filter.actorId=actor;
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(100,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||50)));
  const [items,total]=await Promise.all([AuditLog.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),AuditLog.countDocuments(filter)]);
  return NextResponse.json({data:items.map((item)=>({id:String(item._id),schoolId:item.schoolId,actorId:item.actorId,actorRole:item.actorRole,action:item.action,targetType:item.targetType,targetId:item.targetId,metadata:item.metadata,createdAt:item.createdAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}