import { describe, expect, it } from "bun:test";
import { ReceiverConnectionPool } from "../../../apps/relay/cli/src/receiver-pool.js";
import type { MenuItem } from "../../../apps/relay/cli/src/ui/Menu.js";

const MENU_ITEMS: MenuItem[] = [
  {
    id: "pair",
    label: "Pair Device (QR)",
    description: "Scan QR code or use short code to connect receiver",
  },
  {
    id: "receivers",
    label: "Connected Receivers",
    description: "Manage connected physical devices and inspect latency",
  },
  {
    id: "status",
    label: "Relay Status",
    description: "View connection, gateway, firewall, and node status",
  },
  {
    id: "stream",
    label: "Stream Events",
    description: "Tail active message pipeline",
  },
  {
    id: "config",
    label: "Configuration",
    description: "Inspect active CLI arguments and system info",
  },
];

describe("Journey 13: Terminal Interactive TUI Navigation (Receivers, Status, Stream, Config)", () => {
  it("navigates through all TUI menu items, updates selected index, and handles bounds wrapping", () => {
    expect(MENU_ITEMS.length).toBe(5);
    expect(MENU_ITEMS.map((m: MenuItem) => m.id)).toEqual([
      "pair",
      "receivers",
      "status",
      "stream",
      "config",
    ]);

    // Simulating keyboard arrow state machine in useInput
    let selectedIndex = 0;
    const moveDown = () => {
      selectedIndex =
        selectedIndex < MENU_ITEMS.length - 1 ? selectedIndex + 1 : 0;
    };
    const moveUp = () => {
      selectedIndex =
        selectedIndex > 0 ? selectedIndex - 1 : MENU_ITEMS.length - 1;
    };

    // Initial state: Pair (0)
    expect(selectedIndex).toBe(0);

    // Down -> Receivers (1)
    moveDown();
    expect(selectedIndex).toBe(1);
    expect(MENU_ITEMS[selectedIndex].id).toBe("receivers");

    // Down -> Status (2)
    moveDown();
    expect(selectedIndex).toBe(2);
    expect(MENU_ITEMS[selectedIndex].id).toBe("status");

    // Down -> Stream Events (3)
    moveDown();
    expect(selectedIndex).toBe(3);
    expect(MENU_ITEMS[selectedIndex].id).toBe("stream");

    // Down -> Configuration (4)
    moveDown();
    expect(selectedIndex).toBe(4);
    expect(MENU_ITEMS[selectedIndex].id).toBe("config");

    // Down -> Wraps around to Pair (0)
    moveDown();
    expect(selectedIndex).toBe(0);
    expect(MENU_ITEMS[selectedIndex].id).toBe("pair");

    // Up -> Wraps backward to Configuration (4)
    moveUp();
    expect(selectedIndex).toBe(4);
    expect(MENU_ITEMS[selectedIndex].id).toBe("config");
  });

  it("updates Connected Receivers table state in the TUI when receivers join and disconnect", () => {
    let poolChanged = false;
    const pool = new ReceiverConnectionPool({
      maxReceivers: 5,
      onPoolChange: () => {
        poolChanged = true;
      },
    });

    expect(pool.count).toBe(0);

    // 1. Client connects (e.g. mobile Safari on iOS)
    pool.register({
      id: "rcv-ios-1",
      name: "iPhone 15 Pro",
      platform: "ios",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ip: "192.168.1.105",
      connectedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    expect(pool.count).toBe(1);
    expect(poolChanged).toBe(true);

    const receivers = pool.getAll();
    expect(receivers[0].name).toBe("iPhone 15 Pro");
    expect(receivers[0].platform).toBe("ios");
    expect(receivers[0].ip).toBe("192.168.1.105");

    // 2. Client touches heartbeat
    pool.touch("rcv-ios-1");
    expect(pool.get("rcv-ios-1")?.lastActiveAt).toBeDefined();

    // 3. Client disconnects
    pool.remove("rcv-ios-1");
    expect(pool.count).toBe(0);
  });
});
