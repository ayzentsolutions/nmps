import "dotenv/config";
import mongoose from "mongoose";
import Page from "@/models/Page";
import PageVersion from "@/models/PageVersion";
import SiteSettings from "@/models/SiteSettings";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
import {DEFAULT_SITE_SETTINGS} from "@/lib/services/settings";
import {pageContentSchema} from "@/lib/validations/page";

async function main(){
 if(process.env.NODE_ENV==="production")throw new Error("Refusing to seed when NODE_ENV=production.");
 if(process.env.SEED_DEMO!=="true")throw new Error("Set SEED_DEMO=true explicitly to run this one-time demo seed.");
 if(!process.env.MONGODB_URI)throw new Error("MONGODB_URI is required.");
 const schoolId=getDefaultSchoolId();
 if(!schoolId.startsWith("demo-"))throw new Error("For safety, DEFAULT_SCHOOL_ID must start with 'demo-' when running the demo seed.");
 await connectToDatabase();
 const [pageCount,settingsCount]=await Promise.all([Page.countDocuments({schoolId}),SiteSettings.countDocuments({schoolId})]);
 if(pageCount>0||settingsCount>0)throw new Error("Refusing to overwrite existing pages or website settings for this school.");
 const now=new Date();
 const pages=[
  {title:"Home",slug:"home",content:pageContentSchema.parse({blocks:[
   {id:"demo-hero",type:"hero",visible:true,eyebrow:"Welcome to Example School",title:"A place to learn, grow, and lead.",subtitle:"A welcoming learning community where each student is encouraged to explore their strengths and build confidence.",buttonLabel:"Discover our school",buttonHref:"/about-the-school"},
   {id:"demo-cards",type:"cardGrid",visible:true,title:"Learning for life",items:[
    {title:"Curiosity",body:"Encouraging questions, exploration and thoughtful problem-solving."},
    {title:"Community",body:"Building a respectful environment for students, families and staff."},
    {title:"Character",body:"Supporting responsibility, kindness and lifelong growth."}
   ]},
   {id:"demo-cta",type:"cta",visible:true,title:"Take the next step",body:"Learn about the school and discover the admissions process.",buttonLabel:"Admissions information",buttonHref:"/admissions"}
  ],seo:{title:"Home | Example School",description:"Welcome to Example School. Replace this demo text with your school's approved information.",ogImage:""}})},
  {title:"About the School",slug:"about-the-school",content:pageContentSchema.parse({blocks:[
   {id:"demo-about-intro",type:"richText",visible:true,title:"About Example School",body:"This is sample content added only by the explicit development seed. Replace it with approved information before publishing your live school website."},
   {id:"demo-about-facilities",type:"imageText",visible:true,title:"An environment that supports learning",body:"Describe classrooms, library spaces, laboratories, sport facilities and student support services here.",imageUrl:"",imageAlt:""},
   {id:"demo-about-faq",type:"faq",visible:true,title:"Frequently asked questions",items:[{question:"How do I contact the school?",answer:"Use the contact form to send a message to the school team."},{question:"Where can I find admission information?",answer:"Visit the admissions page and contact the school for current details."}]}
  ],seo:{title:"About the School | Example School",description:"Learn about the school's values and learning community.",ogImage:""}})}
 ];
 for(const item of pages){
  const page=await Page.create({schoolId,title:item.title,slug:item.slug,status:"published",publishedTitle:item.title,publishedSlug:item.slug,draftContent:item.content,publishedContent:item.content,publishedAt:now,versionNumber:1,createdBy:"demo-seed",updatedBy:"demo-seed"});
  const version=await PageVersion.create({schoolId,pageId:page._id,versionNumber:1,title:item.title,slug:item.slug,content:item.content,status:"published",createdBy:"demo-seed"});
  page.currentVersionId=version._id;page.publishedVersionId=version._id;await page.save();
 }

 const starterDrafts=[
  ["Principal’s Message","principals-message"],
  ["Vision and Mission","vision-and-mission"],
  ["Infrastructure and Facilities","infrastructure-and-facilities"],
  ["Academics","academics"],
  ["Curriculum","curriculum"],
  ["Faculty and Staff","faculty-and-staff"],
  ["Admission Process","admission-process"],
  ["Fee Information","fee-information"],
  ["Achievements","achievements"],
  ["Student Activities","student-activities"],
  ["Video Gallery","video-gallery"],
  ["Mandatory Disclosures","mandatory-disclosures"]
 ] as const;
 for(const [title,slug] of starterDrafts){
  const content=pageContentSchema.parse({blocks:[{id:"starter-"+slug,type:"richText",visible:true,title,body:"This is an unpublished starter draft. Replace this text with approved school information in the CMS, review it, and publish when ready."}],seo:{title:title+" | Example School",description:"Add the approved "+title.toLowerCase()+" content for your school.",ogImage:""}});
  const page=await Page.create({schoolId,title,slug,status:"draft",draftContent:content,publishedContent:null,publishedTitle:null,publishedSlug:null,publishedAt:null,versionNumber:1,createdBy:"demo-seed",updatedBy:"demo-seed"});
  const version=await PageVersion.create({schoolId,pageId:page._id,versionNumber:1,title,slug,content,status:"draft",createdBy:"demo-seed"});
  page.currentVersionId=version._id;await page.save();
 }
 await SiteSettings.create({...DEFAULT_SITE_SETTINGS,schoolId,schoolName:"Example School — Replace This",tagline:"Learn · Grow · Lead"});
 console.info("Demo data seeded for " + schoolId + ". Replace example text, assets and contact information before public use.");
}
main().catch((error:unknown)=>{console.error("Demo seed failed:",error instanceof Error?error.message:"Unknown error");process.exitCode=1;}).finally(async()=>{await mongoose.disconnect();});
