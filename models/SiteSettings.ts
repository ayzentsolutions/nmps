import mongoose, { Schema, type Model } from "mongoose";

export interface NavigationItem { id: string; label: string; href: string; children: { id: string; label: string; href: string }[]; }
export interface SiteSettingsDocument {
  schoolId: string;
  schoolName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  theme: { primaryColor: string; accentColor: string; highlightColor: string; bodyFont: "Arial" | "Georgia" | "Inter"; containerWidth: "narrow" | "standard" | "wide"; sectionSpacing: "compact" | "comfortable" | "spacious"; };
  navigation: NavigationItem[];
  contact: { address: string; email: string; phone: string; };
  socialLinks: { label: string; url: string }[];
  announcement: { enabled: boolean; message: string; href: string; };
  footerText: string;
  seo: { title: string; description: string; ogImage: string; };
  createdAt: Date;
  updatedAt: Date;
}
const navChild = new Schema({ id: {type:String,required:true}, label:{type:String,required:true,trim:true,maxlength:80}, href:{type:String,required:true,trim:true,maxlength:300} },{_id:false});
const navigationSchema = new Schema({ id:{type:String,required:true}, label:{type:String,required:true,trim:true,maxlength:80}, href:{type:String,required:true,trim:true,maxlength:300}, children:{type:[navChild],default:[]} },{_id:false});
const schema = new Schema<SiteSettingsDocument>({
  schoolId:{type:String,required:true,unique:true,index:true},
  schoolName:{type:String,required:true,trim:true,maxlength:120,default:"School Website"},
  tagline:{type:String,trim:true,maxlength:180,default:"Learn · Grow · Lead"},
  logoUrl:{type:String,trim:true,default:""}, faviconUrl:{type:String,trim:true,default:""},
  theme:{primaryColor:{type:String,default:"#10233f"},accentColor:{type:String,default:"#1d837c"},highlightColor:{type:String,default:"#d9b36c"},bodyFont:{type:String,enum:["Arial","Georgia","Inter"],default:"Arial"},containerWidth:{type:String,enum:["narrow","standard","wide"],default:"standard"},sectionSpacing:{type:String,enum:["compact","comfortable","spacious"],default:"comfortable"}},
  navigation:{type:[navigationSchema],default:[]},
  contact:{address:{type:String,trim:true,maxlength:500,default:""},email:{type:String,trim:true,lowercase:true,maxlength:254,default:""},phone:{type:String,trim:true,maxlength:50,default:""}},
  socialLinks:{type:[new Schema({label:{type:String,required:true,trim:true,maxlength:60},url:{type:String,required:true,trim:true,maxlength:500}},{_id:false})],default:[]},
  announcement:{enabled:{type:Boolean,default:false},message:{type:String,trim:true,maxlength:300,default:""},href:{type:String,trim:true,maxlength:300,default:""}},
  footerText:{type:String,trim:true,maxlength:500,default:""},
  seo:{title:{type:String,trim:true,maxlength:70,default:"School Website"},description:{type:String,trim:true,maxlength:180,default:"Official school information, news and admissions."},ogImage:{type:String,trim:true,default:""}}
},{timestamps:true,minimize:false});
const SiteSettings=(mongoose.models.SiteSettings as Model<SiteSettingsDocument>)||mongoose.model<SiteSettingsDocument>("SiteSettings",schema);
export default SiteSettings;