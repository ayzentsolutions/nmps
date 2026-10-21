import mongoose,{Schema,type Model} from "mongoose";
export const ENQUIRY_STATUSES=["new","contacted","follow_up","converted","closed"] as const;
export type EnquiryStatus=(typeof ENQUIRY_STATUSES)[number];
export interface EnquiryDocument{
 schoolId:string;referenceNumber:string;name:string;email:string;phone:string;subject:string;message:string;
 status:EnquiryStatus;assignedTo:string|null;internalNotes:{authorId:string;body:string;createdAt:Date}[];
 followUps:{staffId:string;dueAt:Date|null;note:string;completedAt:Date|null;createdAt:Date}[];
 statusHistory:{status:EnquiryStatus;changedBy:string;changedAt:Date;note:string}[];createdAt:Date;updatedAt:Date;
}
const schema=new Schema<EnquiryDocument>({
 schoolId:{type:String,required:true,index:true},referenceNumber:{type:String,required:true,immutable:true},
 name:{type:String,required:true,trim:true,maxlength:160},email:{type:String,required:true,trim:true,lowercase:true,maxlength:254,index:true},
 phone:{type:String,trim:true,maxlength:40,default:""},subject:{type:String,required:true,trim:true,maxlength:180},
 message:{type:String,required:true,trim:true,maxlength:8000},
 status:{type:String,enum:ENQUIRY_STATUSES,default:"new",index:true},assignedTo:{type:String,default:null,index:true},
 internalNotes:{type:[new Schema({authorId:{type:String,required:true},body:{type:String,required:true,trim:true,maxlength:4000},createdAt:{type:Date,default:Date.now}},{_id:true})],default:[]},
 followUps:{type:[new Schema({staffId:{type:String,required:true},dueAt:{type:Date,default:null},note:{type:String,required:true,trim:true,maxlength:1000},completedAt:{type:Date,default:null},createdAt:{type:Date,default:Date.now}},{_id:true})],default:[]},
 statusHistory:{type:[new Schema({status:{type:String,enum:ENQUIRY_STATUSES,required:true},changedBy:{type:String,required:true},changedAt:{type:Date,default:Date.now},note:{type:String,trim:true,maxlength:500,default:""}},{_id:false})],default:[]}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,referenceNumber:1},{unique:true});
schema.index({schoolId:1,status:1,createdAt:-1});
schema.index({schoolId:1,assignedTo:1,status:1,updatedAt:-1});
const Enquiry=(mongoose.models.Enquiry as Model<EnquiryDocument>)||mongoose.model<EnquiryDocument>("Enquiry",schema);
export default Enquiry;