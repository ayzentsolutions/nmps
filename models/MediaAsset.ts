import mongoose,{Schema,type Model} from "mongoose";
export interface MediaAssetDocument{
 schoolId:string;publicId:string;secureUrl:string;resourceType:"image"|"raw";format:string;bytes:number;
 originalFilename:string;title:string;altText:string;caption:string;mimeType:string;uploadedBy:string;createdAt:Date;updatedAt:Date;
}
const schema=new Schema<MediaAssetDocument>({
 schoolId:{type:String,required:true,index:true},publicId:{type:String,required:true},
 secureUrl:{type:String,required:true,maxlength:1200},resourceType:{type:String,enum:["image","raw"],required:true},
 format:{type:String,required:true,maxlength:20},bytes:{type:Number,required:true,min:0},
 originalFilename:{type:String,required:true,trim:true,maxlength:255},title:{type:String,required:true,trim:true,maxlength:180},
 altText:{type:String,trim:true,maxlength:300,default:""},caption:{type:String,trim:true,maxlength:500,default:""},
 mimeType:{type:String,required:true,maxlength:100},uploadedBy:{type:String,required:true}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,publicId:1},{unique:true});
schema.index({schoolId:1,createdAt:-1});
schema.index({schoolId:1,title:"text",originalFilename:"text",altText:"text",caption:"text"});
const MediaAsset=(mongoose.models.MediaAsset as Model<MediaAssetDocument>)||mongoose.model<MediaAssetDocument>("MediaAsset",schema);
export default MediaAsset;