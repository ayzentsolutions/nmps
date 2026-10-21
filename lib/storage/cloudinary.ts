import {v2 as cloudinary} from "cloudinary";
import {Readable} from "node:stream";

export function configureCloudinary(){
 const cloudName=process.env.CLOUDINARY_CLOUD_NAME;
 const apiKey=process.env.CLOUDINARY_API_KEY;
 const apiSecret=process.env.CLOUDINARY_API_SECRET;
 if(!cloudName||!apiKey||!apiSecret)throw new Error("Cloudinary is not configured.");
 cloudinary.config({cloud_name:cloudName,api_key:apiKey,api_secret:apiSecret,secure:true});
 return cloudinary;
}
export async function uploadMediaBuffer(input:{
 buffer:Buffer;schoolId:string;fileName:string;resourceType:"image"|"raw";mimeType:string;
}){
 const client=configureCloudinary();
 const originalBase=input.fileName.replace(/\\.[^.]+$/,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70)||"asset";
 const suffix=crypto.randomUUID();
 const publicId=input.resourceType==="raw"?originalBase+"-"+suffix+".pdf":originalBase+"-"+suffix;
 return new Promise<{publicId:string;secureUrl:string;resourceType:"image"|"raw";format:string;bytes:number}>((resolve,reject)=>{
  const stream=client.uploader.upload_stream({
   folder:"nmps/"+input.schoolId+"/media",public_id:publicId,resource_type:input.resourceType,
   type:"upload",overwrite:false,unique_filename:false,use_filename:false,access_mode:"public",
   context:{mime_type:input.mimeType}
  },(error,result)=>{
   if(error||!result){reject(error||new Error("Media provider returned no asset."));return;}
   resolve({publicId:result.public_id,secureUrl:result.secure_url,resourceType:input.resourceType,format:result.format||"",bytes:result.bytes||input.buffer.length});
  });
  Readable.from(input.buffer).pipe(stream);
 });
}
export async function deleteCloudinaryAsset(publicId:string,resourceType:"image"|"raw"){
 const client=configureCloudinary();
 return client.uploader.destroy(publicId,{resource_type:resourceType,type:"upload",invalidate:true});
}