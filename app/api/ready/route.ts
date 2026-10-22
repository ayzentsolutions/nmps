import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function safeDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return { name: "UnknownError" };
  const candidate = error as Error & { code?: string | number };
  // Keep useful Atlas/Mongoose diagnostics in server logs without exposing credentials.
  const message = error.message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'\x60]+/gi, "mongodb://[redacted]")
    .slice(0, 500);
  return {
    name: error.name,
    ...(candidate.code !== undefined ? { code: String(candidate.code) } : {}),
    message
  };
}

export async function GET() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { status: "not_ready", reason: "database_not_configured" },
      { status: 503 }
    );
  }

  try {
    await connectToDatabase();
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { status: "not_ready", reason: "database_unavailable" },
        { status: 503 }
      );
    }
    await mongoose.connection.db.admin().ping();
    return NextResponse.json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("[readiness] MongoDB connection check failed", safeDatabaseError(error));
    return NextResponse.json(
      { status: "not_ready", reason: "database_unavailable" },
      { status: 503 }
    );
  }
}
