/**
 * Service Worker & Cache Storage Inspector
 *
 * Inspects registered Service Workers, active registration states (installing,
 * waiting, active), and enumerated CacheStorage URLs. Provides remote unregistration
 * and cache invalidation controls.
 *
 * Note for Octavia: Used by the Application / Service Workers tab in Cloud Web.
 */

export type ServiceWorkerState =
  | "installing"
  | "waiting"
  | "active"
  | "redundant";

export interface ServiceWorkerRegistrationInfo {
  scope: string;
  scriptUrl: string;
  state: ServiceWorkerState;
  updateViaCache?: string;
}

export interface CacheStorageInfo {
  cacheName: string;
  cachedUrls: string[];
  itemCount: number;
}

export interface WorkerSnapshot {
  serviceWorkers: ServiceWorkerRegistrationInfo[];
  caches: CacheStorageInfo[];
}

export interface MockServiceWorker {
  scriptURL: string;
  state: ServiceWorkerState;
}

export interface MockServiceWorkerRegistration {
  scope: string;
  updateViaCache?: string;
  installing?: MockServiceWorker | null;
  waiting?: MockServiceWorker | null;
  active?: MockServiceWorker | null;
  unregister: () => Promise<boolean>;
}

export interface MockCache {
  keys: () => Promise<Array<{ url: string }>>;
}

export interface WorkerInspectorEnvironment {
  navigator?: {
    serviceWorker?: {
      getRegistrations: () => Promise<MockServiceWorkerRegistration[]>;
    };
  };
  caches?: {
    keys: () => Promise<string[]>;
    open: (name: string) => Promise<MockCache>;
    delete: (name: string) => Promise<boolean>;
  };
}

export class WorkerInspectorManager {
  public async getSnapshot(
    env: WorkerInspectorEnvironment = typeof window !== "undefined"
      ? (window as unknown as WorkerInspectorEnvironment)
      : {},
  ): Promise<WorkerSnapshot> {
    const serviceWorkers: ServiceWorkerRegistrationInfo[] = [];
    const cachesList: CacheStorageInfo[] = [];

    // Inspect Service Workers
    if (
      env.navigator?.serviceWorker &&
      typeof env.navigator.serviceWorker.getRegistrations === "function"
    ) {
      try {
        const registrations =
          await env.navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          const sw = reg.active || reg.waiting || reg.installing;
          if (sw) {
            serviceWorkers.push({
              scope: reg.scope,
              scriptUrl: sw.scriptURL || "",
              state: sw.state || "active",
              updateViaCache: reg.updateViaCache,
            });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // Inspect Cache Storage
    if (env.caches && typeof env.caches.keys === "function") {
      try {
        const cacheNames = await env.caches.keys();
        for (const name of cacheNames) {
          try {
            const cache = await env.caches.open(name);
            const reqs = await cache.keys();
            const cachedUrls = reqs.map((r) => r.url || "").filter(Boolean);
            cachesList.push({
              cacheName: name,
              cachedUrls,
              itemCount: cachedUrls.length,
            });
          } catch {
            cachesList.push({
              cacheName: name,
              cachedUrls: [],
              itemCount: 0,
            });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    return {
      serviceWorkers,
      caches: cachesList,
    };
  }

  public async unregisterWorker(
    scope: string,
    env: WorkerInspectorEnvironment = typeof window !== "undefined"
      ? (window as unknown as WorkerInspectorEnvironment)
      : {},
  ): Promise<boolean> {
    if (!env.navigator?.serviceWorker?.getRegistrations) {
      return false;
    }

    const registrations = await env.navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.scope === scope) {
        return reg.unregister();
      }
    }

    return false;
  }

  public async clearCache(
    cacheName?: string,
    env: WorkerInspectorEnvironment = typeof window !== "undefined"
      ? (window as unknown as WorkerInspectorEnvironment)
      : {},
  ): Promise<boolean> {
    if (!env.caches) {
      return false;
    }

    if (cacheName) {
      return env.caches.delete(cacheName);
    }

    const names = await env.caches.keys();
    const results = await Promise.all(
      names.map((n) => env.caches?.delete(n) ?? Promise.resolve(false)),
    );
    return results.every(Boolean);
  }
}
