"use client";

export interface MetricPoint {
  timestamp: number;
  latencyMs: number;
  throughputKb: number;
}

export function SessionMetricsChart({ data }: { data: MetricPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-xs text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800">
        Awaiting telemetry data...
      </div>
    );
  }

  const maxLatency = Math.max(...data.map((d) => d.latencyMs), 100);
  const width = 300;
  const height = 70;

  // Generate SVG path for latency line
  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - (d.latencyMs / maxLatency) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const latest = data[data.length - 1];

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-400">
          Real-Time Latency
        </span>
        <span className="text-xs font-mono font-bold text-emerald-400">
          {latest?.latencyMs ?? 0} ms
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-16 overflow-visible"
        aria-label="Latency graph"
      >
        <title>Latency Telemetry Graph</title>
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
        <span>Throughput: {latest?.throughputKb ?? 0} KB/s</span>
        <span>Peak: {maxLatency} ms</span>
      </div>
    </div>
  );
}
