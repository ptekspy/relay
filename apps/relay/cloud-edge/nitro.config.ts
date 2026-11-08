import { fileURLToPath } from "node:url";
import {
  defineNitroConfig,
  type NitroConfig,
} from "@paddy-systems/nitro-config";

const config: NitroConfig = defineNitroConfig({
  alias: {
    "@src": fileURLToPath(new URL("./src", import.meta.url)),
  },
  cloudflare: {
    nodeCompat: true,
  },
});

export default config;
