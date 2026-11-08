/**
 * Redis Cluster / Valkey Distributed Session State Partitioning
 *
 * Implements CRC16 slot hashing (0..16383) with Redis Cluster hash tag parsing {tag},
 * partition routing across multi-AZ masters, and replica synchronization.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-infra/valkey.
 */

export const TOTAL_CLUSTER_SLOTS = 16384;

export interface ValkeyClusterNode {
  id: string;
  az: "az-a" | "az-b" | "az-c";
  role: "master" | "replica";
  startSlot: number;
  endSlot: number;
  data: Map<string, { value: string; expiresAt?: number }>;
}

export class ValkeyClusterManager {
  private masters: ValkeyClusterNode[] = [];
  private replicas: ValkeyClusterNode[] = [];

  constructor() {
    this.initializeDefaultTopology();
  }

  private initializeDefaultTopology(): void {
    // 3 Masters across 3 Availability Zones
    const m1: ValkeyClusterNode = {
      id: "valkey-master-az-a",
      az: "az-a",
      role: "master",
      startSlot: 0,
      endSlot: 5460,
      data: new Map(),
    };
    const m2: ValkeyClusterNode = {
      id: "valkey-master-az-b",
      az: "az-b",
      role: "master",
      startSlot: 5461,
      endSlot: 10922,
      data: new Map(),
    };
    const m3: ValkeyClusterNode = {
      id: "valkey-master-az-c",
      az: "az-c",
      role: "master",
      startSlot: 10923,
      endSlot: 16383,
      data: new Map(),
    };

    this.masters = [m1, m2, m3];

    // Replicas in alternate AZs for HA
    this.replicas = [
      {
        id: "valkey-replica-az-b",
        az: "az-b",
        role: "replica",
        startSlot: 0,
        endSlot: 5460,
        data: new Map(),
      },
      {
        id: "valkey-replica-az-c",
        az: "az-c",
        role: "replica",
        startSlot: 5461,
        endSlot: 10922,
        data: new Map(),
      },
      {
        id: "valkey-replica-az-a",
        az: "az-a",
        role: "replica",
        startSlot: 10923,
        endSlot: 16383,
        data: new Map(),
      },
    ];
  }

  /**
   * Extracts hash tag from key (e.g. "session:{team_42}:heartbeat" -> "team_42")
   */
  public extractHashTag(key: string): string {
    const start = key.indexOf("{");
    if (start !== -1) {
      const end = key.indexOf("}", start + 1);
      if (end !== -1 && end > start + 1) {
        return key.substring(start + 1, end);
      }
    }
    return key;
  }

  /**
   * Computes Redis-compatible CRC16 hash slot (0..16383)
   */
  public getSlot(key: string): number {
    const taggedKey = this.extractHashTag(key);
    let crc = 0;
    for (let i = 0; i < taggedKey.length; i++) {
      const char = taggedKey.charCodeAt(i);
      const tabVal = this.crc16Tab[(crc >>> 8) ^ char] ?? 0;
      crc = ((crc << 8) ^ tabVal) & 0xffff;
    }
    return crc % TOTAL_CLUSTER_SLOTS;
  }

  public getMasterForSlot(slot: number): ValkeyClusterNode {
    const master = this.masters.find(
      (m) => slot >= m.startSlot && slot <= m.endSlot,
    );
    if (!master) {
      throw new Error(`Uncovered hash slot: ${slot}`);
    }
    return master;
  }

  public set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): { slot: number; nodeId: string } {
    const slot = this.getSlot(key);
    const master = this.getMasterForSlot(slot);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;

    master.data.set(key, { value, expiresAt });

    // Replicate synchronously to replica node
    const replica = this.replicas.find(
      (r) => slot >= r.startSlot && slot <= r.endSlot,
    );
    if (replica) {
      replica.data.set(key, { value, expiresAt });
    }

    return { slot, nodeId: master.id };
  }

  public get(key: string): string | null {
    const slot = this.getSlot(key);
    const master = this.getMasterForSlot(slot);
    const item = master.data.get(key);

    if (!item) return null;
    if (item.expiresAt !== undefined && Date.now() > item.expiresAt) {
      master.data.delete(key);
      return null;
    }

    return item.value;
  }

  public heartbeat(
    sessionId: string,
    ttlSeconds = 300,
  ): { slot: number; nodeId: string; expiresAt: number } {
    const key = `session:{${sessionId}}:heartbeat`;
    const slot = this.getSlot(key);
    const master = this.getMasterForSlot(slot);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    master.data.set(key, {
      value: JSON.stringify({
        sessionId,
        lastHeartbeat: Date.now(),
        expiresAt,
      }),
      expiresAt,
    });

    return { slot, nodeId: master.id, expiresAt };
  }

  public getClusterStats(): {
    totalKeys: number;
    distribution: Record<string, number>;
  } {
    let totalKeys = 0;
    const distribution: Record<string, number> = {};

    for (const master of this.masters) {
      const size = master.data.size;
      distribution[master.id] = size;
      totalKeys += size;
    }

    return { totalKeys, distribution };
  }

  // Precomputed CRC16 CCITT lookup table
  private readonly crc16Tab = new Uint16Array([
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108,
    0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210,
    0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b,
    0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401,
    0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee,
    0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6,
    0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d,
    0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
    0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5,
    0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc,
    0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87, 0x4ce4,
    0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd,
    0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13,
    0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a,
    0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e,
    0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
    0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1,
    0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb,
    0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0,
    0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8,
    0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657,
    0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9,
    0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882,
    0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
    0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e,
    0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07,
    0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d,
    0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74,
    0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
  ]);
}
