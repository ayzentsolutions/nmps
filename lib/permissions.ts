import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type Permission =
  | "pages:read" | "pages:create" | "pages:update" | "pages:publish" | "pages:delete"
  | "notices:read" | "notices:create" | "notices:update" | "notices:publish" | "notices:delete"
  | "events:read" | "events:create" | "events:update" | "events:publish" | "events:delete"
  | "gallery:read" | "gallery:create" | "gallery:update" | "gallery:publish" | "gallery:delete"
  | "audit:read" | "users:manage" | "settings:manage" | "media:manage"
  | "admissions:manage" | "enquiries:manage";

const grants: Record<string, Permission[]> = {
  super_admin: [
    "pages:read", "pages:create", "pages:update", "pages:publish", "pages:delete",
    "notices:read", "notices:create", "notices:update", "notices:publish", "notices:delete",
    "events:read", "events:create", "events:update", "events:publish", "events:delete",
    "gallery:read", "gallery:create", "gallery:update", "gallery:publish", "gallery:delete",
    "audit:read", "users:manage", "settings:manage", "media:manage", "admissions:manage", "enquiries:manage"
  ],
  school_admin: [
    "pages:read", "pages:create", "pages:update", "pages:publish", "pages:delete",
    "notices:read", "notices:create", "notices:update", "notices:publish", "notices:delete",
    "events:read", "events:create", "events:update", "events:publish", "events:delete",
    "gallery:read", "gallery:create", "gallery:update", "gallery:publish", "gallery:delete",
    "audit:read", "users:manage", "settings:manage", "media:manage", "admissions:manage", "enquiries:manage"
  ],
  editor: [
    "pages:read", "pages:create", "pages:update",
    "notices:read", "notices:create", "notices:update",
    "events:read", "events:create", "events:update",
    "gallery:read", "gallery:create", "gallery:update", "media:manage"
  ],
  publisher: [
    "pages:read", "pages:publish", "notices:read", "notices:publish",
    "events:read", "events:publish", "gallery:read", "gallery:publish"
  ],
  admissions_staff: ["admissions:manage"],
  enquiry_staff: ["enquiries:manage"],
  media_manager: ["media:manage"]
};

export async function authorize(permission: Permission) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }
  if (session.user.mustChangePassword) {
    return { session: null, response: NextResponse.json({ error: "Change your temporary password before using the admin workspace.", code: "PASSWORD_CHANGE_REQUIRED" }, { status: 403 }) };
  }
  if (!(grants[session.user.role] ?? []).includes(permission)) {
    return {
      session: null,
      response: NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 })
    };
  }
  return { session, response: null };
}
