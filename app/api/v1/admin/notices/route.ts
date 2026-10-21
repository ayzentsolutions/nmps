import type { FilterQuery } from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import Notice, { type NoticeDocument } from "@/models/Notice";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter,getSchoolIdForSession} from "@/lib/school";
import {noticeSchema} from "@/lib/validations/notice";
import {apiError,internalError,validationError} from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const access=await authorize("notices:read");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();
  const filter:FilterQuery<NoticeDocument>={...getSchoolFilter(access.session)};
  const status=request.nextUrl.searchParams.get("status");if(status&&["draft","published","archived"].includes(status))filter.status=status;
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80);if(q)filter.$or=[{title:{$regex:q,$options:"i"}},{category:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||20)));
  const [items,total]=await Promise.all([Notice.find(filter).sort({updatedAt:-1}).skip((page-1)*limit).limit(limit).lean(),Notice.countDocuments(filter)]);
  return NextResponse.json({data:items.map((n)=>({id:String(n._id),schoolId:n.schoolId,title:n.title,category:n.category,description:n.description,attachmentUrl:n.attachmentUrl,publishAt:n.publishAt,expiresAt:n.expiresAt,status:n.status,publishedAt:n.publishedAt,updatedAt:n.updatedAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest){
 const access=await authorize("notices:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 const parsed=noticeSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
 try{
  await connectToDatabase();
  const item=await Notice.create({...parsed.data,publishAt:parsed.data.publishAt?new Date(parsed.data.publishAt):null,expiresAt:parsed.data.expiresAt?new Date(parsed.data.expiresAt):null,status:"draft",schoolId:getSchoolIdForSession(access.session),createdBy:access.session.user.id,updatedBy:access.session.user.id});
  return NextResponse.json({data:{id:String(item._id),title:item.title,status:item.status}},{status:201});
 }catch(error){return internalError(error);}
}