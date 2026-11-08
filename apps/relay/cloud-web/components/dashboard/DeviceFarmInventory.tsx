"use client";

import { useState } from "react";
import type { SharedFarmDevice } from "@/lib/device-farm";

export interface DeviceFarmInventoryProps {
  initialDevices: SharedFarmDevice[];
  currentUserId: string;
  currentUserName: string;
}

export function DeviceFarmInventory({
  initialDevices,
  currentUserId,
  currentUserName,
}: DeviceFarmInventoryProps) {
  const [devices, setDevices] = useState<SharedFarmDevice[]>(initialDevices);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAcquire = (deviceId: string) => {
    setActionError(null);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        if (d.status === "in-use" && d.currentUser?.userId !== currentUserId) {
          setActionError(`Device is in-use by ${d.currentUser?.name}`);
          return d;
        }
        return {
          ...d,
          status: "in-use",
          currentUser: {
            userId: currentUserId,
            name: currentUserName,
            acquiredAt: Date.now(),
          },
        };
      }),
    );
  };

  const handleRelease = (deviceId: string) => {
    setActionError(null);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          status: "available",
          currentUser: undefined,
        };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-zinc-100">
      {actionError && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300">
          {actionError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const isMine = device.currentUser?.userId === currentUserId;
          const isLockedByOther = device.status === "in-use" && !isMine;
          const isOffline = device.status === "offline";

          return (
            <div
              key={device.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white text-sm">
                    {device.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      isOffline
                        ? "bg-zinc-800 text-zinc-400"
                        : device.status === "available"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-400">
                  <p>
                    OS:{" "}
                    <span className="text-zinc-200">{device.osVersion}</span> (
                    {device.platform})
                  </p>
                  <p className="flex items-center gap-2">
                    <span>Battery:</span>
                    <span className="font-mono font-medium text-zinc-200">
                      {device.batteryLevel}%
                    </span>
                    {device.isCharging && (
                      <span className="text-[10px] text-amber-400 font-semibold">
                        ⚡ Charging
                      </span>
                    )}
                  </p>
                  {device.currentUser && (
                    <p className="text-[11px] text-zinc-400">
                      Controller:{" "}
                      <strong
                        className={isMine ? "text-cyan-400" : "text-amber-300"}
                      >
                        {isMine ? "You" : device.currentUser.name}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                {isMine ? (
                  <button
                    type="button"
                    onClick={() => handleRelease(device.id)}
                    className="w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                  >
                    Release Device
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAcquire(device.id)}
                    disabled={isLockedByOther || isOffline}
                    className={`w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                      isLockedByOther || isOffline
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
                    }`}
                  >
                    {isLockedByOther
                      ? "In Use by Colleague"
                      : isOffline
                        ? "Device Offline"
                        : "Acquire & Control"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
