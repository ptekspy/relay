"use client";

import type { SessionComment } from "@paddy-systems/relay-recording";

export interface ReplayTimelineScrubberProps {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  speed: number;
  comments: SessionComment[];
  onPlay: () => void;
  onPause: () => void;
  onSeek: (timestampMs: number) => void;
  onSpeedChange: (speed: number) => void;
}

export function ReplayTimelineScrubber({
  currentTimeMs,
  durationMs,
  isPlaying,
  speed,
  comments,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
}: ReplayTimelineScrubberProps) {
  const safeDuration = Math.max(durationMs, 1000);
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTimeMs / safeDuration) * 100),
  );

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number.parseFloat(e.target.value);
    const targetMs = (percent / 100) * safeDuration;
    onSeek(targetMs);
  };

  return (
    <footer className="h-16 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 gap-4 shrink-0 z-20 font-sans">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={isPlaying ? onPause : onPlay}
        className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white text-xs transition-colors shrink-0"
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      {/* Time Display */}
      <div className="font-mono text-xs text-zinc-400 shrink-0 w-24">
        <span className="text-zinc-200 font-semibold">
          {formatTime(currentTimeMs)}
        </span>{" "}
        / {formatTime(safeDuration)}
      </div>

      {/* Scrubber Track Container */}
      <div className="relative flex-1 flex items-center h-8">
        {/* Timeline Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progressPercent}
          onChange={handleScrubberChange}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 z-10"
        />

        {/* Comment Pin Marks on Timeline */}
        {comments.map((comment, index) => {
          const markerPercent = Math.min(
            100,
            Math.max(0, (comment.timestampMs / safeDuration) * 100),
          );

          return (
            <button
              key={comment.id}
              type="button"
              onClick={() => onSeek(comment.timestampMs)}
              title={`${comment.author.name}: ${comment.content} (${formatTime(comment.timestampMs)})`}
              style={{ left: `${markerPercent}%` }}
              className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-300 border border-zinc-950 shadow flex items-center justify-center text-[8px] font-bold text-zinc-950 z-20 group transition-transform hover:scale-125"
            >
              {index + 1}
              {/* Tooltip on Hover */}
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded whitespace-nowrap shadow-xl z-50 pointer-events-none">
                {comment.author.name}: {comment.content.slice(0, 30)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
              speed === s
                ? "bg-blue-600 text-white font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </footer>
  );
}
