import { describe, expect, it } from "bun:test";
import {
  type StorageEnvironment,
  StorageExplorerManager,
  type WebStorageLike,
} from "../src/storage-explorer.js";

describe("TASK-143: LocalStorage, SessionStorage & IndexedDB Explorer", () => {
  const createMockStorage = (
    initial: Record<string, string> = {},
  ): WebStorageLike => {
    const store = new Map<string, string>(Object.entries(initial));

    return {
      get length() {
        return store.size;
      },
      key: (idx: number) => Array.from(store.keys())[idx] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
    };
  };

  it("extracts snapshots of localStorage and sessionStorage with byte sizes", async () => {
    const manager = new StorageExplorerManager();
    const env: StorageEnvironment = {
      localStorage: createMockStorage({ theme: "dark", token: "xyz-123" }),
      sessionStorage: createMockStorage({ session_id: "sess-999" }),
      indexedDB: {
        databases: async () => [
          { name: "analytics_db" },
          { name: "cache_store" },
        ],
      },
    };

    const snapshot = await manager.getSnapshot(env);

    expect(snapshot.localStorage.length).toBe(2);
    expect(snapshot.localStorage[0]?.key).toBe("theme");
    expect(snapshot.localStorage[0]?.value).toBe("dark");
    expect(snapshot.localStorage[0]?.sizeBytes).toBeGreaterThan(0);

    expect(snapshot.sessionStorage.length).toBe(1);
    expect(snapshot.sessionStorage[0]?.key).toBe("session_id");

    expect(snapshot.indexedDbDatabases).toEqual([
      "analytics_db",
      "cache_store",
    ]);
  });

  it("updates, deletes, and clears storage items remotely", async () => {
    const manager = new StorageExplorerManager();
    const mockLocal = createMockStorage({ user: "alice" });
    const env: StorageEnvironment = { localStorage: mockLocal };

    // Set item
    manager.setItem("localStorage", "role", "admin", env);
    expect(mockLocal.getItem("role")).toBe("admin");

    // Remove item
    manager.removeItem("localStorage", "user", env);
    expect(mockLocal.getItem("user")).toBeNull();

    // Clear
    manager.clear("localStorage", env);
    expect(mockLocal.length).toBe(0);
  });
});
