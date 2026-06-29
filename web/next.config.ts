import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@copilotkit/runtime"],
  typescript: {
    // Docker route override uses HttpAgent which has a type mismatch with CopilotRuntime
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
