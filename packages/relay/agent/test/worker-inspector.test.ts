import { describe, expect, it } from "bun:test";
import {
  type MockServiceWorkerRegistration,
  type WorkerInspectorEnvironment,
  WorkerInspectorManager,
} from "../src/worker-inspector.js";

describe("TASK-148: Service Worker & Cache Storage Inspector", () => {
  it("enumerates active service workers and cache storage resources", async () => {
    const manager = new WorkerInspectorManager();

    const mockRegs: MockServiceWorkerRegistration[] = [
      {
        scope: "https://example.com/app/",
        active: {
          scriptURL: "https://example.com/app/sw.js",
          state: "active",
        },
        unregister: async () => true,
      },
      {
        scope: "https://example.com/auth/",
        waiting: {
          scriptURL: "https://example.com/auth/sw-v2.js",
          state: "waiting",
        },
        unregister: async () => true,
      },
    ];

    const mockCaches: Record<string, string[]> = {
      "v1-assets": [
        "https://example.com/app/bundle.js",
        "https://example.com/app/style.css",
      ],
      "v1-images": ["https://example.com/logo.png"],
    };

    const env: WorkerInspectorEnvironment = {
      navigator: {
        serviceWorker: {
          getRegistrations: async () => mockRegs,
        },
      },
      caches: {
        keys: async () => Object.keys(mockCaches),
        open: async (name: string) => ({
          keys: async () => (mockCaches[name] || []).map((url) => ({ url })),
        }),
        delete: async (name: string) => {
          delete mockCaches[name];
          return true;
        },
      },
    };

    const snapshot = await manager.getSnapshot(env);

    expect(snapshot.serviceWorkers.length).toBe(2);
    expect(snapshot.serviceWorkers[0]?.scope).toBe("https://example.com/app/");
    expect(snapshot.serviceWorkers[0]?.state).toBe("active");
    expect(snapshot.serviceWorkers[1]?.state).toBe("waiting");

    expect(snapshot.caches.length).toBe(2);
    expect(snapshot.caches[0]?.cacheName).toBe("v1-assets");
    expect(snapshot.caches[0]?.itemCount).toBe(2);
    expect(snapshot.caches[0]?.cachedUrls).toContain(
      "https://example.com/app/bundle.js",
    );
  });

  it("unregisters service worker and clears cache storage", async () => {
    const manager = new WorkerInspectorManager();
    let unregisterCalled = false;
    const deletedCaches: string[] = [];

    const env: WorkerInspectorEnvironment = {
      navigator: {
        serviceWorker: {
          getRegistrations: async () => [
            {
              scope: "https://example.com/app/",
              active: { scriptURL: "sw.js", state: "active" },
              unregister: async () => {
                unregisterCalled = true;
                return true;
              },
            },
          ],
        },
      },
      caches: {
        keys: async () => ["cache-1"],
        open: async () => ({ keys: async () => [] }),
        delete: async (name: string) => {
          deletedCaches.push(name);
          return true;
        },
      },
    };

    const unregResult = await manager.unregisterWorker(
      "https://example.com/app/",
      env,
    );
    expect(unregResult).toBe(true);
    expect(unregisterCalled).toBe(true);

    const clearResult = await manager.clearCache("cache-1", env);
    expect(clearResult).toBe(true);
    expect(deletedCaches).toEqual(["cache-1"]);
  });
});
