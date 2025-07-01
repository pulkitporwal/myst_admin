import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: 'img.freepik.com'
      },
      {
        protocol: "https",
        hostname: 'res.cloudinary.com'
      }
    ]
  }

};

export default nextConfig;
