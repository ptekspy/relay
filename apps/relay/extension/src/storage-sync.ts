import type { StorageItemSnapshot } from "./types.js";

/**
 * Synchronizes cookies and web storage snapshots between browser and mobile receivers.
 */
export class StorageSyncBridge {
  private items: Map<string, StorageItemSnapshot> = new Map();

  public syncItems(items: StorageItemSnapshot[]): void {
    for (const item of items) {
      const key = `${item.area}:${item.key}`;
      this.items.set(key, item);
    }
  }

  public getItemsByArea(
    area: StorageItemSnapshot["area"],
  ): StorageItemSnapshot[] {
    return Array.from(this.items.values()).filter((i) => i.area === area);
  }

  public getAllItems(): StorageItemSnapshot[] {
    return Array.from(this.items.values());
  }

  public serializeForReceiver(): string {
    return JSON.stringify(this.getAllItems());
  }
}
