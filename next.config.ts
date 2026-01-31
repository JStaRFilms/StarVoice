import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Disable static generation for client-side only app
  trailingSlash: true,
};

export default nextConfig;
