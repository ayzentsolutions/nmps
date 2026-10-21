import mongoose,{Schema,type Model} from "mongoose";
export interface ApplicationDocumentAsset {
 schoolId:string; applicationId:mongoose.Types.ObjectId; publicId:string; originalFilename:string; mimeType:string; format:string; bytes:number; uploadedBy:string; createdAt:Date; updatedAt:Date;
}
const schema=new Schema<ApplicationDocumentAsset>({
 schoolId:{type:String,required:true,index:true},
 applicationId:{type:Schema.Types.ObjectId,ref:"AdmissionApplication",required:true,index:true},
 publicId:{type:String,required:true},
 originalFilename:{type:String,required:true,trim:true,maxlength:255},
 mimeType:{type:String,required:true,maxlength:100},
 format:{type:String,required:true,maxlength:20},
 bytes:{type:Number,required:true,min:0},
 uploadedBy:{type:String,required:true}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,applicationId:1,createdAt:-1});
const ApplicationDocument=(mongoose.models.ApplicationDocument as Model<ApplicationDocumentAsset>)||mongoose.model<ApplicationDocumentAsset>("ApplicationDocument",schema);
export default ApplicationDocument;