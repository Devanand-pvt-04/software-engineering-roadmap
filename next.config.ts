import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The repo owner becomes the app's admin (overridable with ADMIN_GITHUB_LOGINS). Baked in at build time
  // in case Vercel's system variables aren't exposed to functions at runtime.
  env: { ZTD_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "" },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
