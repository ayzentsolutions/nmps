import mongoose,{Schema,type Model} from "mongoose";
export interface GalleryItem { id:string; imageUrl:string; altText:string; caption:string; order:number; }
export interface GalleryAlbumDocument{
 schoolId:string;title:string;slug:string;description:string;coverImageUrl:string;items:GalleryItem[];status:"draft"|"published"|"archived";
 publishedTitle:string|null;publishedSlug:string|null;publishedDescription:string|null;publishedCoverImageUrl:string|null;publishedItems:GalleryItem[]|null;publishedAt:Date|null;
 createdBy:string;updatedBy:string;createdAt:Date;updatedAt:Date;
}
const itemSchema=new Schema<GalleryItem>({id:{type:String,required:true},imageUrl:{type:String,required:true,maxlength:1000},altText:{type:String,trim:true,maxlength:300,default:""},caption:{type:String,trim:true,maxlength:500,default:""},order:{type:Number,default:0,min:0}},{_id:false});
const schema=new Schema<GalleryAlbumDocument>({
 schoolId:{type:String,required:true,index:true},title:{type:String,required:true,trim:true,maxlength:180},slug:{type:String,required:true,trim:true,lowercase:true,maxlength:180},
 description:{type:String,trim:true,maxlength:4000,default:""},coverImageUrl:{type:String,trim:true,maxlength:1000,default:""},items:{type:[itemSchema],default:[]},
 status:{type:String,enum:["draft","published","archived"],default:"draft",index:true},
 publishedTitle:{type:String,default:null,trim:true,maxlength:180},publishedSlug:{type:String,default:null,trim:true,lowercase:true,maxlength:180},
 publishedDescription:{type:String,default:null,trim:true,maxlength:4000},publishedCoverImageUrl:{type:String,default:null,trim:true,maxlength:1000},publishedItems:{type:[itemSchema],default:null},publishedAt:{type:Date,default:null,index:true},
 createdBy:{type:String,required:true},updatedBy:{type:String,required:true}
},{timestamps:true,minimize:false});
schema.index({schoolId:1,slug:1},{unique:true});
schema.index({schoolId:1,publishedSlug:1},{unique:true,partialFilterExpression:{publishedSlug:{$type:"string"}}});
schema.index({schoolId:1,status:1,updatedAt:-1});
const Album=(mongoose.models.GalleryAlbum as Model<GalleryAlbumDocument>)||mongoose.model<GalleryAlbumDocument>("GalleryAlbum",schema);
export default Album;