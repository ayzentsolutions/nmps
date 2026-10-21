import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { getDefaultSchoolId } from "@/lib/school";

const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), password: z.string().min(14).max(200) });
function matches(actual: string, expected: string) {
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: NextRequest) {
  const expected = process.env.BOOTSTRAP_SECRET;
  const supplied = request.headers.get("x-bootstrap-secret") || "";
  if (!expected || expected.length < 24 || !matches(supplied, expected)) return NextResponse.json({ error: "Bootstrap authorization failed." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input. Passwords must be at least 14 characters." }, { status: 422 });
  try {
    await connectToDatabase();
    if (await User.countDocuments({}) > 0) return NextResponse.json({ error: "Bootstrap is locked because a user already exists." }, { status: 409 });
    const user = await User.create({ name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "super_admin", schoolId: getDefaultSchoolId(), isActive: true });
    return NextResponse.json({ data: { id: String(user._id), email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error("Admin bootstrap failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Bootstrap could not be completed." }, { status: 500 });
  }
}