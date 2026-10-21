import mongoose,{Schema,type Model} from "mongoose";
export interface AuditLogDocument{
 schoolId:string;actorId:string;actorRole:string;action:string;targetType:string;targetId:string;
 metadata:Record<string,unknown>;createdAt:Date;
}
const schema=new Schema<AuditLogDocument>({
 schoolId:{type:String,required:true,index:true},actorId:{type:String,required:true,index:true},actorRole:{type:String,required:true,maxlength:40},
 action:{type:String,required:true,trim:true,maxlength:120,index:true},targetType:{type:String,required:true,trim:true,maxlength:80},
 targetId:{type:String,required:true,trim:true,maxlength:120},metadata:{type:Schema.Types.Mixed,default:{}}
},{timestamps:{createdAt:true,updatedAt:false},minimize:false,strict:true});
schema.index({schoolId:1,createdAt:-1});
schema.index({schoolId:1,actorId:1,createdAt:-1});
schema.index({schoolId:1,action:1,createdAt:-1});
const AuditLog=(mongoose.models.AuditLog as Model<AuditLogDocument>)||mongoose.model<AuditLogDocument>("AuditLog",schema);
export default AuditLog;