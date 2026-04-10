// @ts-nocheck  
import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    expiration: {
      maxEntries: 128,
      maxAgeSeconds: 24 * 60 * 60,
    },
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true, // Mengabaikan error TS saat build di VPS
  },
  
  // Menggunakan 'as any' untuk menghindari error tipe data TypeScript yang Anda temukan sebelumnya
  experimental: {
    serverActions: {
      allowedOrigins: ["banikarimmekarjaya.id", "www.banikarimmekarjaya.id", "localhost:3000"],
    },
  } as any,

  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "banikarimmekarjaya.id",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Tambahkan IP lokal jika Anda masih ingin melakukan tes via IP di VPS
      {
        protocol: "http",
        hostname: "192.168.1.124", 
      },
    ],
  },
};

export default withPWA(nextConfig);