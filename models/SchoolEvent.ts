import mongoose,{Schema,type Model} from "mongoose";
export interface SchoolEventDocument{
 schoolId:string;title:string;slug:string;description:string;location:string;imageUrl:string;startAt:Date;endAt:Date|null;
 status:"draft"|"published"|"archived";publishedTitle:string|null;publishedSlug:string|null;publishedDescription:string|null;publishedLocation:string|null;publishedImageUrl:string|null;publishedStartAt:Date|null;publishedEndAt:Date|null;
 publishedAt:Date|null;createdBy:string;updatedBy:string;createdAt:Date;updatedAt:Date;
}
const schema=new Schema<SchoolEventDocument>({
 schoolId:{type:String,required:true,index:true},title:{type:String,required:true,trim:true,maxlength:180},slug:{type:String,required:true,trim:true,lowercase:true,maxlength:180},
 description:{type:String,required:true,trim:true,maxlength:8000},location:{type:String,trim:true,maxlength:300,default:""},imageUrl:{type:String,trim:true,maxlength:1000,default:""},
 startAt:{type:Date,required:true,index:true},endAt:{type:Date,default:null},
 status:{type:String,enum:["draft","published","archived"],default:"draft",index:true},
 publishedTitle:{type:String,default:null,trim:true,maxlength:180},publishedSlug:{type:String,default:null,trim:true,lowercase:true,maxlength:180},
 publishedDescription:{type:String,default:null,trim:true,maxlength:8000},publishedLocation:{type:String,default:null,trim:true,maxlength:300},publishedImageUrl:{type:String,default:null,trim:true,maxlength:1000},
 publishedStartAt:{type:Date,default:null},publishedEndAt:{type:Date,default:null},publishedAt:{type:Date,default:null,index:true},
 createdBy:{type:String,required:true},updatedBy:{type:String,required:true}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,slug:1},{unique:true});
schema.index({schoolId:1,publishedSlug:1},{unique:true,partialFilterExpression:{publishedSlug:{$type:"string"}}});
schema.index({schoolId:1,status:1,startAt:1});
const SchoolEvent=(mongoose.models.SchoolEvent as Model<SchoolEventDocument>)||mongoose.model<SchoolEventDocument>("SchoolEvent",schema);
export default SchoolEvent;