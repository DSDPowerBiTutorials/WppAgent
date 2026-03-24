import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@repo/shared"],
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    ...(process.env.CODESPACE_NAME
      ? [`${process.env.CODESPACE_NAME}-3000.app.github.dev`]
      : []),
  ],
};

export default nextConfig;
