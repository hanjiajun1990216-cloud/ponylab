import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ponylab/ui", "@ponylab/shared"],
};

export default nextConfig;
