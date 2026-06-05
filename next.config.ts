import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "mysql2", "xlsx"],
};

export default nextConfig;
