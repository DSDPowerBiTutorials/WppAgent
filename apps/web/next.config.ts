import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
