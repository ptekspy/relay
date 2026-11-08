import { EdgeWorkerPoolManager } from "@src/pools";
import { eventHandler } from "h3";

const poolManager = new EdgeWorkerPoolManager();

export default eventHandler(() => {
  return {
    status: "ok",
    service: "relay-cloud-edge",
    edgeRegions: ["eu-west", "us-east", "us-west", "ap-east"],
    pools: {
      signaling: poolManager.getMetrics("signaling"),
      dataProxy: poolManager.getMetrics("data_proxy"),
    },
    timestamp: new Date().toISOString(),
  };
});
