import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/contagion": ["./narrative.pipe"],
    "/api/narrative": ["./narrative.pipe"],
    "/api/parse-shock": ["./parse-shock.pipe"],
  },
};

export default nextConfig;
