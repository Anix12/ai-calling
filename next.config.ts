import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets verification builds use a separate folder (NEXT_DIST_DIR=.next-verify)
  // so they never overwrite the `.next` used by a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
