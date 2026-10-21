import AuditLog from "@/models/AuditLog";
import {connectToDatabase} from "@/lib/mongodb";
type AuditInput={schoolId:string;actorId:string;actorRole:string;action:string;targetType:string;targetId:string;metadata?:Record<string,unknown>};
export async function recordAudit(input:AuditInput){
 try{
  await connectToDatabase();
  await AuditLog.create({schoolId:input.schoolId,actorId:input.actorId,actorRole:input.actorRole,action:input.action,targetType:input.targetType,targetId:input.targetId,metadata:input.metadata||{}});
 }catch(error){
  // Audit logging failure is operationally visible without leaking request payloads or blocking unrelated content writes.
  console.error("Audit write failed for "+input.action,error instanceof Error?error.name:"UnknownError");
 }
}