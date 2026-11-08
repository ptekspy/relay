/**
 * LocalStorage, SessionStorage & IndexedDB Explorer
 *
 * Inspects and manages web storage (localStorage, sessionStorage, IndexedDB)
 * on remote receivers, allowing desktop developers to view, edit, delete, and clear records.
 *
 * Note for Octavia: Used by the Storage inspector tab in Cloud Web DevTools.
 */

export type StorageType = "localStorage" | "sessionStorage" | "indexedDB";

export interface StorageItem {
  key: string;
  value: string;
  sizeBytes: number;
}

export interface StorageSnapshot {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
  indexedDbDatabases: string[];
}

export interface WebStorageLike {
  length: number;
  key: (index: number) => string | null;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

export interface StorageEnvironment {
  localStorage?: WebStorageLike;
  sessionStorage?: WebStorageLike;
  indexedDB?: {
    databases?: () => Promise<Array<{ name?: string }>>;
  };
}

export class StorageExplorerManager {
  public static calculateBytes(str: string): number {
    return typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(str).length
      : str.length;
  }

  public async getSnapshot(
    env: StorageEnvironment = typeof window !== "undefined"
      ? (window as unknown as StorageEnvironment)
      : {},
  ): Promise<StorageSnapshot> {
    const localItems = this.readStorageItems(env.localStorage);
    const sessionItems = this.readStorageItems(env.sessionStorage);
    let indexedDbDatabases: string[] = [];

    if (env.indexedDB && typeof env.indexedDB.databases === "function") {
      try {
        const dbs = await env.indexedDB.databases();
        indexedDbDatabases = dbs.map((d) => d.name || "").filter(Boolean);
      } catch {
        indexedDbDatabases = [];
      }
    }

    return {
      localStorage: localItems,
      sessionStorage: sessionItems,
      indexedDbDatabases,
    };
  }

  public setItem(
    type: "localStorage" | "sessionStorage",
    key: string,
    value: string,
    env: StorageEnvironment = typeof window !== "undefined"
      ? (window as unknown as StorageEnvironment)
      : {},
  ): boolean {
    const storage =
      type === "localStorage" ? env.localStorage : env.sessionStorage;
    if (!storage || typeof storage.setItem !== "function") {
      return false;
    }
    storage.setItem(key, value);
    return true;
  }

  public removeItem(
    type: "localStorage" | "sessionStorage",
    key: string,
    env: StorageEnvironment = typeof window !== "undefined"
      ? (window as unknown as StorageEnvironment)
      : {},
  ): boolean {
    const storage =
      type === "localStorage" ? env.localStorage : env.sessionStorage;
    if (!storage || typeof storage.removeItem !== "function") {
      return false;
    }
    storage.removeItem(key);
    return true;
  }

  public clear(
    type: "localStorage" | "sessionStorage",
    env: StorageEnvironment = typeof window !== "undefined"
      ? (window as unknown as StorageEnvironment)
      : {},
  ): boolean {
    const storage =
      type === "localStorage" ? env.localStorage : env.sessionStorage;
    if (!storage || typeof storage.clear !== "function") {
      return false;
    }
    storage.clear();
    return true;
  }

  private readStorageItems(storage: WebStorageLike | undefined): StorageItem[] {
    if (!storage) return [];

    const items: StorageItem[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) {
        const value = storage.getItem(key) ?? "";
        items.push({
          key,
          value,
          sizeBytes:
            StorageExplorerManager.calculateBytes(key) +
            StorageExplorerManager.calculateBytes(value),
        });
      }
    }

    return items.sort((a, b) => a.key.localeCompare(b.key));
  }
}
