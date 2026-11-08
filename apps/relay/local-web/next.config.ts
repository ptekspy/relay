import { loadApplicationEnvironment } from "@paddy-systems/env/load-app-env";
import type { NextConfig } from "next";

loadApplicationEnvironment("RELAY");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@paddy-systems/feature-flags",
    "@paddy-systems/lib",
    "@paddy-systems/shared-primitives",
  ],
};

export default nextConfig;
