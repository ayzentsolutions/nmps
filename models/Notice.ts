import mongoose, { Schema, type Model } from "mongoose";
export interface NoticeDocument {
 schoolId:string; title:string; category:string; description:string; attachmentUrl:string; publishAt:Date|null; expiresAt:Date|null;
 status:"draft"|"published"|"archived"; publishedTitle:string|null; publishedCategory:string|null; publishedDescription:string|null; publishedAttachmentUrl:string|null;
 publishedAt:Date|null; createdBy:string; updatedBy:string; createdAt:Date; updatedAt:Date;
}
const schema=new Schema<NoticeDocument>({
 schoolId:{type:String,required:true,index:true},
 title:{type:String,required:true,trim:true,maxlength:180},
 category:{type:String,required:true,trim:true,maxlength:80,default:"General"},
 description:{type:String,required:true,trim:true,maxlength:8000},
 attachmentUrl:{type:String,trim:true,default:"",maxlength:1000},
 publishAt:{type:Date,default:null,index:true},expiresAt:{type:Date,default:null,index:true},
 status:{type:String,enum:["draft","published","archived"],default:"draft",index:true},
 publishedTitle:{type:String,default:null,trim:true,maxlength:180},publishedCategory:{type:String,default:null,trim:true,maxlength:80},
 publishedDescription:{type:String,default:null,trim:true,maxlength:8000},publishedAttachmentUrl:{type:String,default:null,trim:true,maxlength:1000},
 publishedAt:{type:Date,default:null,index:true},createdBy:{type:String,required:true},updatedBy:{type:String,required:true}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,status:1,updatedAt:-1});
schema.index({schoolId:1,publishedAt:-1,expiresAt:1});
const Notice=(mongoose.models.Notice as Model<NoticeDocument>)||mongoose.model<NoticeDocument>("Notice",schema);
export default Notice;