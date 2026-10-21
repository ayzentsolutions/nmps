import {NextRequest,NextResponse} from "next/server";
import mongoose from "mongoose";
import MediaAsset from "@/models/MediaAsset";
import Page from "@/models/Page";
import SiteSettings from "@/models/SiteSettings";
import Notice from "@/models/Notice";
import {authorize} from "@/lib/permissions";
import {connectToDatabase} from "@/lib/mongodb";
import {getSchoolFilter} from "@/lib/school";
import {apiError,internalError,validationError} from "@/lib/api-response";
import {z} from "zod";
import {deleteCloudinaryAsset} from "@/lib/storage/cloudinary";
type Context={params:Promise<{id:string}>};
const updateSchema=z.object({title:z.string().trim().min(1).max(180).optional(),altText:z.string().trim().max(300).optional(),caption:z.string().trim().max(500).optional()}).refine((v)=>Object.keys(v).length>0,"Provide metadata to update.");
export async function PATCH(request:NextRequest,context:Context){
 const access=await authorize("media:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid media ID.",400);
  const parsed=updateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return validationError(parsed.error);
  await connectToDatabase();const asset=await MediaAsset.findOne({_id:id,...getSchoolFilter(access.session)});if(!asset)return apiError("Asset not found.",404);
  if(parsed.data.title!==undefined)asset.title=parsed.data.title;if(parsed.data.altText!==undefined)asset.altText=parsed.data.altText;if(parsed.data.caption!==undefined)asset.caption=parsed.data.caption;
  await asset.save();return NextResponse.json({data:{id:String(asset._id),title:asset.title,altText:asset.altText,caption:asset.caption,secureUrl:asset.secureUrl}});
 }catch(error){return internalError(error);}
}
export async function DELETE(_request:NextRequest,context:Context){
 const access=await authorize("media:manage");if(access.response)return access.response;if(!access.session)return apiError("Authentication required.",401);
 try{
  const {id}=await context.params;if(!mongoose.isValidObjectId(id))return apiError("Invalid media ID.",400);
  await connectToDatabase();const asset=await MediaAsset.findOne({_id:id,...getSchoolFilter(access.session)});if(!asset)return apiError("Asset not found.",404);
  const url=asset.secureUrl;const schoolId=asset.schoolId;
  const [pageRef,settingsRef,noticeRef]=await Promise.all([
   Page.exists({schoolId,$or:[{"draftContent.blocks.imageUrl":url,"draftContent.seo.ogImage":url},{"publishedContent.blocks.imageUrl":url,"publishedContent.seo.ogImage":url}]}),
   SiteSettings.exists({schoolId,$or:[{logoUrl:url},{faviconUrl:url},{"seo.ogImage":url}]}),
   Notice.exists({schoolId,$or:[{attachmentUrl:url},{publishedAttachmentUrl:url}]})
  ]);
  if(pageRef||settingsRef||noticeRef)return apiError("This asset is still referenced by published or draft content. Remove those references before deleting it.",409);
  await deleteCloudinaryAsset(asset.publicId,asset.resourceType);await asset.deleteOne();
  return new NextResponse(null,{status:204});
 }catch(error){return internalError(error);}
}