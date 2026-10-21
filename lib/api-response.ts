import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function apiError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export function validationError(error: ZodError) {
  return NextResponse.json({ error: "Validation failed.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 422 });
}
export function internalError(error: unknown) {
  console.error("API request failed", error instanceof Error ? { name: error.name, message: error.message } : { message: "Unknown error" });
  return apiError("An unexpected server error occurred.", 500);
}