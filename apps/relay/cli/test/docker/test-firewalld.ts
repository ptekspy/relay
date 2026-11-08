import { FirewalldAdapter } from "../../src/firewall/adapters/firewalld.js";
import { defaultExecutor } from "../../src/firewall/executor.js";

async function main() {
  console.log("--> Testing Firewalld inside Linux container...");

  const adapter = new FirewalldAdapter(defaultExecutor);

  const available = await adapter.isAvailable();
  console.log(`Firewalld available: ${available}`);
  if (!available) {
    throw new Error("Firewalld should be available in this container");
  }

  const active = await adapter.isActive();
  console.log(`Firewalld active: ${active}`);
  if (!active) {
    throw new Error("Firewalld should be active in this container");
  }

  // 1. Port 7332 should initially be blocked
  const initialStatus = await adapter.checkPort(7332);
  console.log(`Initial port 7332 status: ${initialStatus}`);
  if (initialStatus !== "blocked") {
    throw new Error(
      `Expected port 7332 to be blocked initially, got ${initialStatus}`,
    );
  }

  // 2. Remediate port 7332
  console.log("--> Executing allowPort(7332)...");
  const remediation = await adapter.allowPort(7332);
  console.log("Remediation result:", remediation);
  if (!remediation.success) {
    throw new Error(`Remediation failed: ${remediation.message}`);
  }

  // 3. Port 7332 should now be allowed
  const postStatus = await adapter.checkPort(7332);
  console.log(`Post-remediation port 7332 status: ${postStatus}`);
  if (postStatus !== "allowed") {
    throw new Error(
      `Expected port 7332 to be allowed after remediation, got ${postStatus}`,
    );
  }

  console.log("✓ Firewalld integration test passed completely!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
