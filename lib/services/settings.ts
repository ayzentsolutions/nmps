import SiteSettings, { type SiteSettingsDocument } from "@/models/SiteSettings";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";

export const DEFAULT_SITE_SETTINGS = {
  schoolId:"default-school",
  schoolName:"School Website",
  tagline:"Learn · Grow · Lead",
  logoUrl:"",
  faviconUrl:"",
  theme:{primaryColor:"#10233f",accentColor:"#1d837c",highlightColor:"#d9b36c",bodyFont:"Arial" as const,containerWidth:"standard" as const,sectionSpacing:"comfortable" as const},
  navigation:[
    {id:"about",label:"About",href:"/about-the-school",children:[]},
    {id:"academics",label:"Academics",href:"/academics",children:[]},
    {id:"admissions",label:"Admissions",href:"/admissions",children:[]},
    {id:"notices",label:"Notices",href:"/notices",children:[]},
    {id:"contact",label:"Contact",href:"/contact",children:[]}
  ],
  contact:{address:"",email:"",phone:""},
  socialLinks:[],
  announcement:{enabled:false,message:"",href:""},
  footerText:"",
  seo:{title:"School Website",description:"Official school information, learning updates, events and admissions.",ogImage:""}
};

export async function getSiteSettings(schoolId=getDefaultSchoolId()) {
  if(!process.env.MONGODB_URI) return {...DEFAULT_SITE_SETTINGS,schoolId};
  await connectToDatabase();
  const settings=await SiteSettings.findOne({schoolId}).lean();
  if(!settings) return {...DEFAULT_SITE_SETTINGS,schoolId};
  return {
    schoolId:settings.schoolId,schoolName:settings.schoolName,tagline:settings.tagline,
    logoUrl:settings.logoUrl,faviconUrl:settings.faviconUrl,
    theme:settings.theme||DEFAULT_SITE_SETTINGS.theme,navigation:settings.navigation||DEFAULT_SITE_SETTINGS.navigation,
    contact:settings.contact||DEFAULT_SITE_SETTINGS.contact,socialLinks:settings.socialLinks||[],
    announcement:settings.announcement||DEFAULT_SITE_SETTINGS.announcement,footerText:settings.footerText||"",
    seo:settings.seo||DEFAULT_SITE_SETTINGS.seo
  };
}

export async function saveSiteSettings(schoolId:string,input:Omit<SiteSettingsDocument,"schoolId"|"createdAt"|"updatedAt">) {
  await connectToDatabase();
  return SiteSettings.findOneAndUpdate({schoolId},{$set:input,$setOnInsert:{schoolId}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true});
}