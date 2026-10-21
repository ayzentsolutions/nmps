import mongoose,{Schema,type Model} from "mongoose";
export interface PasswordResetTokenDocument{
 userId:mongoose.Types.ObjectId;schoolId:string;tokenHash:string;expiresAt:Date;consumedAt:Date|null;createdAt:Date;updatedAt:Date;
}
const schema=new Schema<PasswordResetTokenDocument>({
 userId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},
 schoolId:{type:String,required:true,index:true},
 tokenHash:{type:String,required:true,unique:true,select:false},
 expiresAt:{type:Date,required:true,index:true},
 consumedAt:{type:Date,default:null,index:true}
},{timestamps:true,minimize:false});
schema.index({expiresAt:1},{expireAfterSeconds:0});
schema.index({userId:1,consumedAt:1,expiresAt:1});
const PasswordResetToken=(mongoose.models.PasswordResetToken as Model<PasswordResetTokenDocument>)||mongoose.model<PasswordResetTokenDocument>("PasswordResetToken",schema);
export default PasswordResetToken;
