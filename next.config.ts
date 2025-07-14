import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   // Tambahkan blok 'images' di sini
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
