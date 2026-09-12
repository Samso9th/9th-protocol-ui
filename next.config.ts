import type { NextConfig } from "next";

// output: "standalone" produces .next/standalone with a self-contained
// server.js for the Docker runtime image. Dev (`next dev`) ignores it.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
