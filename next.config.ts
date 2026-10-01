import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow hot-reload / dev assets when the site is opened from another
  // device on the LAN (e.g. a phone at 192.168.1.x). Without this, Next
  // blocks /_next/hmr cross-origin and the tab keeps a stale JS bundle
  // whose buttons appear dead. Dev-only setting, no effect on production.
  allowedDevOrigins: ["192.168.1.33", "192.168.1.*"],
  // Pin Turbopack's root to this project. A stray package-lock.json in
  // /Users/nuel would otherwise make Turbopack misdetect the workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
