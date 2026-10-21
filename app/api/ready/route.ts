import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
export const dynamic="force-dynamic";
export async function GET(){
 if(!process.env.MONGODB_URI)return NextResponse.json({status:"not_ready",reason:"database_not_configured"},{status:503});
 try{
  await connectToDatabase();
  if(!mongoose.connection.db)return NextResponse.json({status:"not_ready",reason:"database_unavailable"},{status:503});
  await mongoose.connection.db.admin().ping();
  return NextResponse.json({status:"ready",database:"connected"});
 }catch{return NextResponse.json({status:"not_ready",reason:"database_unavailable"},{status:503});}
}