import {describe,expect,it} from "vitest";
import {pageContentSchema,createPageSchema} from "@/lib/validations/page";
import {noticeSchema} from "@/lib/validations/notice";
import {eventSchema} from "@/lib/validations/event";
import {gallerySchema} from "@/lib/validations/gallery";
import {applicationSchema} from "@/lib/validations/admissions";
import {publicEnquirySchema} from "@/lib/validations/enquiry";
import {settingsSchema} from "@/lib/validations/settings";

describe("page schemas",()=>{
 it("accepts a valid slug and known block types",()=>{
  expect(createPageSchema.safeParse({title:"About",slug:"about-the-school"}).success).toBe(true);
  expect(pageContentSchema.safeParse({blocks:[{id:"hero-1",type:"hero",title:"Welcome",buttonHref:"/admissions"}]}).success).toBe(true);
 });
 it("rejects path tricks and unknown executable block types",()=>{
  expect(createPageSchema.safeParse({title:"Bad",slug:"../admin"}).success).toBe(false);
  expect(pageContentSchema.safeParse({blocks:[{id:"x",type:"script",code:"alert(1)"}]}).success).toBe(false);
 });
 it("supports schema-validated photo and video content blocks",()=>{
  expect(pageContentSchema.safeParse({blocks:[{id:"image-1",type:"imageText",title:"Library",body:"A quiet learning space.",imageUrl:"https://res.cloudinary.com/example/image/upload/library.jpg",imageAlt:"Library shelves"}]}).success).toBe(true);
  expect(pageContentSchema.safeParse({blocks:[{id:"video-1",type:"videoEmbed",title:"School life",videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",caption:"A short introduction"}]}).success).toBe(true);
  expect(pageContentSchema.safeParse({blocks:[{id:"video-2",type:"videoEmbed",videoUrl:"https://malicious.example/video"}]}).success).toBe(false);
  expect(pageContentSchema.safeParse({blocks:[{id:"image-2",type:"imageText",imageUrl:"javascript:alert(1)"}]}).success).toBe(false);
 });
 it("rejects an excessive number of blocks",()=>{
  const blocks=Array.from({length:101},(_,i)=>({id:String(i),type:"richText",title:"Text",body:"Body"}));
  expect(pageContentSchema.safeParse({blocks}).success).toBe(false);
 });
});

describe("notice validation",()=>{
 const base={title:"School closure notice",category:"Circular",description:"The school will remain closed on the listed date.",attachmentUrl:"https://cdn.example.org/notice.pdf"};
 it("accepts a safe notice and optional HTTPS attachment",()=>expect(noticeSchema.safeParse(base).success).toBe(true));
 it("rejects javascript and non-HTTPS remote attachments",()=>{
  expect(noticeSchema.safeParse({...base,attachmentUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(noticeSchema.safeParse({...base,attachmentUrl:"http://example.org/x.pdf"}).success).toBe(false);
 });
 it("rejects expiry earlier than the scheduled publish time",()=>{
  expect(noticeSchema.safeParse({...base,publishAt:"2027-01-02T10:00:00.000Z",expiresAt:"2027-01-01T10:00:00.000Z"}).success).toBe(false);
 });
});

describe("events and gallery validation",()=>{
 it("rejects an end time before an event starts",()=>{
  expect(eventSchema.safeParse({title:"Sports day",slug:"sports-day",description:"Annual sports day",startAt:"2027-03-02T10:00:00.000Z",endAt:"2027-03-01T10:00:00.000Z"}).success).toBe(false);
 });
 it("accepts gallery items with alt text and captions",()=>{
  expect(gallerySchema.safeParse({title:"Annual day",slug:"annual-day",description:"School celebration",coverImageUrl:"",items:[{id:"photo-1",imageUrl:"https://res.cloudinary.com/example/image/upload/photo.jpg",altText:"Students on stage",caption:"Annual day",order:0}]}).success).toBe(true);
 });
 it("rejects gallery items without a source URL",()=>{
  expect(gallerySchema.safeParse({title:"Annual day",slug:"annual-day",items:[{id:"photo-1",imageUrl:"",order:0}]}).success).toBe(false);
 });
});

describe("public form validation",()=>{
 it("validates admission data and normalizes optional data with defaults",()=>{
  const result=applicationSchema.safeParse({admissionSession:"2027-2028",studentName:"Aarav Example",gradeApplied:"Class 1",parentName:"Parent Example",parentEmail:"parent@example.org",parentPhone:"+919876543210"});
  expect(result.success).toBe(true);
  if(result.success){expect(result.data.address).toBe("");expect(result.data.answers).toEqual({});}
 });
 it("rejects malformed email and accepts a blank enquiry honeypot",()=>{
  const base={name:"Parent Example",email:"parent@example.org",phone:"",subject:"Admission question",message:"Please share more details about admissions.",website:""};
  expect(publicEnquirySchema.safeParse(base).success).toBe(true);
  expect(publicEnquirySchema.safeParse({...base,email:"not-an-email"}).success).toBe(false);
  expect(publicEnquirySchema.safeParse({...base,website:"bot-filled"}).success).toBe(true);
 });
});

describe("website setting validation",()=>{
 it("requires hex colour tokens and safe navigation URLs",()=>{
  const base={schoolName:"Example School",tagline:"Learn",logoUrl:"",faviconUrl:"",theme:{primaryColor:"#10233f",accentColor:"#1d837c",highlightColor:"#d9b36c",bodyFont:"Arial",containerWidth:"standard",sectionSpacing:"comfortable"},navigation:[{id:"home",label:"Home",href:"/",children:[]}],contact:{address:"",email:"",phone:""},socialLinks:[],announcement:{enabled:false,message:"",href:""},footerText:"",seo:{title:"Example School",description:"A school description",ogImage:""}};
  expect(settingsSchema.safeParse(base).success).toBe(true);
  expect(settingsSchema.safeParse({...base,theme:{...base.theme,primaryColor:"red"}}).success).toBe(false);
  expect(settingsSchema.safeParse({...base,navigation:[{id:"bad",label:"Bad",href:"//evil.example",children:[]}]}).success).toBe(false);
 });
});
