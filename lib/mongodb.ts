import mongoose from "mongoose";
type Cache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
declare global { var mongooseCache: Cache | undefined; }
const cache: Cache = global.mongooseCache ?? { connection: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cache;
export async function connectToDatabase() {
  if (cache.connection && mongoose.connection.readyState === 1) return cache.connection;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (!cache.promise) cache.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  try { cache.connection = await cache.promise; return cache.connection; }
  catch (error) { cache.promise = null; throw error; }
}