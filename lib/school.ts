import type { Session } from "next-auth";
export function getDefaultSchoolId() { return process.env.DEFAULT_SCHOOL_ID?.trim() || "default-school"; }
export function getSchoolIdForSession(session: Session, requestedSchoolId?: string) {
  return session.user.role === "super_admin" ? requestedSchoolId?.trim() || getDefaultSchoolId() : session.user.schoolId;
}
export function getSchoolFilter(session: Session) {
  return session.user.role === "super_admin" ? {} : { schoolId: session.user.schoolId };
}