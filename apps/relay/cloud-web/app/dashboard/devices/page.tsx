"use client";

import { useState } from "react";

interface ConnectedDevice {
  id: string;
  name: string;
  ip: string;
  os: string;
  browser: string;
  trustScore: number;
  status: "APPROVED" | "PENDING" | "BLOCKED";
  lastActive: string;
}

const INITIAL_DEVICES: ConnectedDevice[] = [
  {
    id: "dev_tab_m9",
    name: "Lenovo Tab M9 (HA1TGPDC)",
    ip: "192.168.1.145",
    os: "Android 12 (API 31)",
    browser: "Chrome Mobile 120.0",
    trustScore: 98,
    status: "APPROVED",
    lastActive: "Just now",
  },
  {
    id: "dev_iphone_15",
    name: "iPhone 15 Pro",
    ip: "192.168.1.182",
    os: "iOS 17.4",
    browser: "Mobile Safari 17.4",
    trustScore: 95,
    status: "APPROVED",
    lastActive: "12m ago",
  },
  {
    id: "dev_unknown_bot",
    name: "Automated Runner / Probe",
    ip: "45.33.32.156",
    os: "Linux x86_64",
    browser: "curl/7.88.1",
    trustScore: 35,
    status: "PENDING",
    lastActive: "1m ago",
  },
];

export default function DevicesDashboardPage() {
  const [devices, setDevices] = useState<ConnectedDevice[]>(INITIAL_DEVICES);

  const updateStatus = (id: string, newStatus: "APPROVED" | "BLOCKED") => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
    );
  };

  const disconnectDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Device Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review, approve, or revoke access for devices pairing with your
            relay sessions.
          </p>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Network & Client</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="py-4 px-4 font-semibold text-white">
                    <div>{device.name}</div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {device.id}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <div className="font-mono text-zinc-300">{device.ip}</div>
                    <div className="text-zinc-500">
                      {device.os} • {device.browser}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono ${
                          device.trustScore >= 80
                            ? "text-emerald-400"
                            : device.trustScore >= 50
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {device.trustScore}/100
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        device.status === "APPROVED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : device.status === "PENDING"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-500">
                    {device.lastActive}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {device.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(device.id, "APPROVED")}
                          className="px-2.5 py-1 text-xs rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                        >
                          Approve
                        </button>
                      )}
                      {device.status !== "BLOCKED" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(device.id, "BLOCKED")}
                          className="px-2.5 py-1 text-xs rounded bg-zinc-900 text-rose-400 border border-zinc-800 hover:bg-rose-950"
                        >
                          Block
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => disconnectDevice(device.id)}
                        className="px-2.5 py-1 text-xs rounded bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
