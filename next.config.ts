import type { NextConfig } from "next";
import { env } from "process";

const nextConfig: NextConfig = {
  ...(env.REPLIT_DOMAINS && {
    allowedDevOrigins: [env.REPLIT_DOMAINS.split(",")[0]],
  }),
};

export default nextConfig;
