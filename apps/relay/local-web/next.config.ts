import { loadApplicationEnvironment } from "@acme-systems/env/load-app-env";
import type { NextConfig } from "next";

loadApplicationEnvironment("RELAY");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@acme-systems/feature-flags",
    "@acme-systems/lib",
    "@acme-systems/shared-primitives",
  ],
};

export default nextConfig;
