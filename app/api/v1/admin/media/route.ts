import {NextRequest,NextResponse} from "next/server";
import MediaAsset from "@/models/MediaAsset";
import { recordAudit } from "@/lib/audit";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolIdForSession,getSchoolFilter} from "@/lib/school";
import {uploadMediaBuffer} from "@/lib/storage/cloudinary";
import {apiError,internalError,validationError} from "@/lib/api-response";
import {z} from "zod";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const metadataSchema=z.object({title:z.string().trim().max(180).optional(),altText:z.string().trim().max(300).optional(),caption:z.string().trim().max(500).optional()});
function detectFile(buffer:Buffer){
 if(buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return {mimeType:"image/jpeg",resourceType:"image" as const,format:"jpg"};
 if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {mimeType:"image/png",resourceType:"image" as const,format:"png"};
 if(buffer.length>=12&&buffer.toString("ascii",0,4)==="RIFF"&&buffer.toString("ascii",8,12)==="WEBP")return {mimeType:"image/webp",resourceType:"image" as const,format:"webp"};
 if(buffer.length>=12&&buffer.toString("ascii",4,8)==="ftyp"&&["avif","avis"].includes(buffer.toString("ascii",8,12)))return {mimeType:"image/avif",resourceType:"image" as const,format:"avif"};
 if(buffer.length>=5&&buffer.toString("ascii",0,5)==="%PDF-")return {mimeType:"application/pdf",resourceType:"raw" as const,format:"pdf"};
 return null;
}
export async function GET(request:NextRequest){
 const access=await authorize("media:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  await connectToDatabase();
  const filter:import("mongoose").FilterQuery<import("@/models/MediaAsset").MediaAssetDocument>={...getSchoolFilter(access.session)};
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,100);if(q)filter.$or=[{title:{$regex:q,$options:"i"}},{originalFilename:{$regex:q,$options:"i"}},{altText:{$regex:q,$options:"i"}},{caption:{$regex:q,$options:"i"}}];
  const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")||1));const limit=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("limit")||30)));
  const [items,total]=await Promise.all([MediaAsset.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).select("-publicId").lean(),MediaAsset.countDocuments(filter)]);
  return NextResponse.json({data:items.map((asset)=>({id:String(asset._id),schoolId:asset.schoolId,secureUrl:asset.secureUrl,resourceType:asset.resourceType,format:asset.format,bytes:asset.bytes,originalFilename:asset.originalFilename,title:asset.title,altText:asset.altText,caption:asset.caption,mimeType:asset.mimeType,uploadedBy:asset.uploadedBy,createdAt:asset.createdAt})),pagination:{page,limit,total}});
 }catch(error){return internalError(error);}
}
export async function POST(request:NextRequest){
 const access=await authorize("media:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const form=await request.formData();
  const file=form.get("file");
  if(!(file instanceof File))return apiError("Choose an image or PDF file.",422);
  if(file.size===0)return apiError("The selected file is empty.",422);
  if(file.size>4*1024*1024)return apiError("For compatibility with serverless deployment limits, maximum upload size is 4 MB per file.",413);
  const buffer=Buffer.from(await file.arrayBuffer());
  const detected=detectFile(buffer);
  if(!detected)return apiError("Unsupported file contents. Use JPEG, PNG, WebP, AVIF or PDF.",415);
  if(file.type&&file.type!==detected.mimeType)return apiError("File type does not match its content.",415);
  const isImage=detected.resourceType==="image";
  if(isImage&&file.size>4*1024*1024)return apiError("Image upload size limit is 4 MB.",413);
  const input=metadataSchema.safeParse({title:form.get("title")||file.name,altText:form.get("altText")||"",caption:form.get("caption")||""});
  if(!input.success)return validationError(input.error);
  await connectToDatabase();
  const schoolId=getSchoolIdForSession(access.session);
  const uploaded=await uploadMediaBuffer({buffer,schoolId,fileName:file.name,resourceType:detected.resourceType,mimeType:detected.mimeType});
  try{
   const asset=await MediaAsset.create({
    schoolId,publicId:uploaded.publicId,secureUrl:uploaded.secureUrl,resourceType:uploaded.resourceType,format:uploaded.format||detected.format,bytes:uploaded.bytes,
    originalFilename:file.name.slice(0,255),title:input.data.title||file.name.slice(0,180),altText:input.data.altText||"",caption:input.data.caption||"",mimeType:detected.mimeType,uploadedBy:access.session.user.id
   });
   await recordAudit({ schoolId: asset.schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "media.uploaded", targetType: "media-asset", targetId: String(asset._id), metadata: { resourceType: asset.resourceType, format: asset.format, bytes: asset.bytes } });
   return NextResponse.json({data:{id:String(asset._id),secureUrl:asset.secureUrl,resourceType:asset.resourceType,title:asset.title,altText:asset.altText,caption:asset.caption,bytes:asset.bytes,format:asset.format}},{status:201});
  }catch(error){
   try{const {deleteCloudinaryAsset}=await import("@/lib/storage/cloudinary");await deleteCloudinaryAsset(uploaded.publicId,uploaded.resourceType);}catch{}
   throw error;
  }
 }catch(error){return internalError(error);}
}