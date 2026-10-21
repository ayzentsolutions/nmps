import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverActions: { bodySizeLimit: "2mb" },
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] }
};
export default nextConfig;