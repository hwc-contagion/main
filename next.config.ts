import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/contagion": ["./narrative.pipe"],
    "/api/narrative": ["./narrative.pipe"],
  },
};

export default nextConfig;
