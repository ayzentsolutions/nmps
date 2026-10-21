import mongoose,{Schema,type Model} from "mongoose";
export const APPLICATION_STATUSES=["submitted","under_review","documents_pending","accepted","rejected","withdrawn"] as const;
export type ApplicationStatus=(typeof APPLICATION_STATUSES)[number];
export interface AdmissionApplicationDocument{
 schoolId:string;referenceNumber:string;formSchemaVersion:number;admissionSession:string;studentName:string;dateOfBirth:Date|null;
 gradeApplied:string;parentName:string;parentEmail:string;parentPhone:string;address:string;answers:Record<string,string>;
 status:ApplicationStatus;statusHistory:{status:ApplicationStatus;changedBy:string;changedAt:Date;note:string}[];
 internalNotes:{authorId:string;body:string;createdAt:Date}[];createdAt:Date;updatedAt:Date;
}
const schema=new Schema<AdmissionApplicationDocument>({
 schoolId:{type:String,required:true,index:true},referenceNumber:{type:String,required:true,trim:true,immutable:true},
 formSchemaVersion:{type:Number,required:true,min:1,default:1},admissionSession:{type:String,required:true,trim:true,maxlength:80,index:true},
 studentName:{type:String,required:true,trim:true,maxlength:160},dateOfBirth:{type:Date,default:null},
 gradeApplied:{type:String,required:true,trim:true,maxlength:80,index:true},parentName:{type:String,required:true,trim:true,maxlength:160},
 parentEmail:{type:String,required:true,trim:true,lowercase:true,maxlength:254,index:true},parentPhone:{type:String,required:true,trim:true,maxlength:40},
 address:{type:String,trim:true,maxlength:800,default:""},answers:{type:Schema.Types.Mixed,default:{}},
 status:{type:String,enum:APPLICATION_STATUSES,default:"submitted",index:true},
 statusHistory:{type:[new Schema({status:{type:String,enum:APPLICATION_STATUSES,required:true},changedBy:{type:String,required:true},changedAt:{type:Date,default:Date.now},note:{type:String,trim:true,maxlength:500,default:""}},{_id:false})],default:[]},
 internalNotes:{type:[new Schema({authorId:{type:String,required:true},body:{type:String,required:true,trim:true,maxlength:4000},createdAt:{type:Date,default:Date.now}},{_id:true})],default:[]}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,referenceNumber:1},{unique:true});
schema.index({schoolId:1,status:1,createdAt:-1});
schema.index({schoolId:1,admissionSession:1,status:1,createdAt:-1});
const App=(mongoose.models.AdmissionApplication as Model<AdmissionApplicationDocument>)||mongoose.model<AdmissionApplicationDocument>("AdmissionApplication",schema);
export default App;