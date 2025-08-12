import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["faiss-node"],
  outputFileTracingIncludes: {
    "/faiss_db": ["./faiss_db/index.faiss", "./faiss_db/index.pkl"],
  },
};

export default nextConfig;
