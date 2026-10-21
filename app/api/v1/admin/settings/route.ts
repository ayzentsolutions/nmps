import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import { recordAudit } from "@/lib/audit";
import { getDefaultSchoolId, getSchoolIdForSession } from "@/lib/school";
import { getSiteSettings } from "@/lib/services/settings";
import { settingsSchema } from "@/lib/validations/settings";
import { apiError, internalError, validationError } from "@/lib/api-response";
export const dynamic="force-dynamic";
export async function GET(){
 const access=await authorize("settings:manage");if(access.response)return access.response;
 if(!access.session)return apiError("Authentication required.",401);
 try{
  const schoolId=access.session.user.role==="super_admin"?getDefaultSchoolId():access.session.user.schoolId;
  return NextResponse.json({data:await getSiteSettings(schoolId)});
 }catch(error){return internalError(error);}
}
export async function PUT(request:NextRequest){
 const access=await authorize("settings:manage");if(access.response)return access.response;
 if(!access.session)return apiError("Authentication required.",401);
 const parsed=settingsSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return validationError(parsed.error);
 try{
  const schoolId=getSchoolIdForSession(access.session);
  await connectToDatabase();
  const saved=await SiteSettings.findOneAndUpdate({schoolId},{$set:parsed.data,$setOnInsert:{schoolId}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true});
  await recordAudit({ schoolId, actorId: access.session.user.id, actorRole: access.session.user.role, action: "settings.updated", targetType: "site-settings", targetId: String(saved._id), metadata: { schoolName: saved.schoolName } });
  return NextResponse.json({data:saved});
 }catch(error){return internalError(error);}
}