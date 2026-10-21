import { createHash } from "node:crypto";
import { connectToDatabase } from "@/lib/mongodb";

type LimitResult = { allowed: boolean; retryAfterSeconds: number; remaining: number };
declare global { var rateLimitIndexesPromise: Promise<void> | undefined; }

export async function checkRateLimit(request: Pick<Request, "headers">, scope: string, maximum: number, windowMs = 60_000): Promise<LimitResult> {
  await connectToDatabase();
  const mongoose = (await import("mongoose")).default;
  const collection = mongoose.connection.db?.collection("public_rate_limits");
  if (!collection) throw new Error("Rate limit collection is unavailable.");

  if (!global.rateLimitIndexesPromise) {
    global.rateLimitIndexesPromise = Promise.all([
      collection.createIndex({ key: 1 }, { unique: true }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    ]).then(() => undefined).catch((error) => {
      global.rateLimitIndexesPromise = undefined;
      throw error;
    });
  }
  await global.rateLimitIndexesPromise;

  const forwarded = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")
    || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 128);
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const key = scope + ":" + createHash("sha256").update(ip).digest("hex").slice(0, 32) + ":" + bucket;
  const expiresAt = new Date((bucket + 2) * windowMs);

  try {
    await collection.updateOne({ key }, {
      $inc: { count: 1 },
      $setOnInsert: { key, scope, expiresAt, createdAt: new Date(now) }
    }, { upsert: true });
  } catch (error) {
    // A concurrent first request can race on the unique bucket key. Retry as an update.
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      await collection.updateOne({ key }, { $inc: { count: 1 } }, { upsert: false });
    } else {
      throw error;
    }
  }
  const record = await collection.findOne({ key }, { projection: { count: 1 } });
  const count = Number(record?.count || 0);
  const retryAfterSeconds = Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000));
  return { allowed: count <= maximum, retryAfterSeconds, remaining: Math.max(0, maximum - count) };
}