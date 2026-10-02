import type { NextConfig } from "next";

const extraHosts = (process.env.IMAGE_REMOTE_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // District 9213 (ClubRunner) photo albums of the club
      { protocol: "https", hostname: "clubrunner.blob.core.windows.net" },
      { protocol: "https", hostname: "www.rotaryo.org" },
      ...extraHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
