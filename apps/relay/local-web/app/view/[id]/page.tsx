"use client";

import type {
  RecordedEvent,
  SessionComment,
} from "@paddy-systems/relay-recording";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useRef, useState } from "react";
import { CommentPinOverlay } from "@/components/replay/CommentPinOverlay";
import { CommentsDrawer } from "@/components/replay/CommentsDrawer";
import { NewCommentModal } from "@/components/replay/NewCommentModal";
import { ReplayTimelineScrubber } from "@/components/replay/ReplayTimelineScrubber";

function RemoteReceiverContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const gatewayPort = searchParams.get("gateway") || "7331";

  // Target iframe URL: if token is available, direct to gateway; otherwise proxy through cloud-web
  const targetUrl = token
    ? `http://127.0.0.1:${gatewayPort}/?relay_token=${token}`
    : `/api/proxy/${id}/?gateway=${gatewayPort}`;

  // View state
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [reloading, setReloading] = useState(false);
  const [connected] = useState(true);

  // Feedback & Pin drop state
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const [pendingPinPosition, setPendingPinPosition] = useState<{
    xPercent: number;
    yPercent: number;
  } | null>(null);
  const [comments, setComments] = useState<SessionComment[]>([]);
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Replay playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(60000);
  const [speed, setSpeed] = useState(1);
  const sessionStartTimeRef = useRef(Date.now());

  // Activity & Telemetry Inspector State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<
    "network" | "console" | "dom" | "interactions"
  >("network");

  // Fetch comments & session telemetry on mount / periodically
  useEffect(() => {
    let cancelled = false;

    const fetchSessionData = async () => {
      try {
        const query = token
          ? `?token=${encodeURIComponent(token)}&gateway=${gatewayPort}`
          : `?gateway=${gatewayPort}`;
        const res = await fetch(`/api/proxy/${id}/__relay/recording${query}`);
        if (res.ok) {
          const data = (await res.json()) as {
            comments?: SessionComment[];
            events?: RecordedEvent[];
            durationMs?: number;
          };
          if (!cancelled && data) {
            if (Array.isArray(data.comments)) {
              setComments(data.comments);
            }
            if (Array.isArray(data.events)) {
              setRecordedEvents(data.events);
            }
            if (typeof data.durationMs === "number" && data.durationMs > 0) {
              setDurationMs(Math.max(60000, data.durationMs + 5000));
            }
          }
        }
      } catch {
        // Fallback or offline dev mode
      }
    };

    fetchSessionData();
    const interval = setInterval(fetchSessionData, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, token, gatewayPort]);

  // Replay playback timer tick
  useEffect(() => {
    if (!isPlaying || mode !== "replay") return;

    const tickInterval = 50;
    const interval = setInterval(() => {
      setCurrentTimeMs((prev) => {
        const next = prev + tickInterval * speed;
        if (next >= durationMs) {
          setIsPlaying(false);
          return durationMs;
        }
        return next;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [isPlaying, mode, speed, durationMs]);

  const handleReload = () => {
    setReloading(true);
    setTimeout(() => setReloading(false), 500);
  };

  const handleDropPinInitiated = (position: {
    xPercent: number;
    yPercent: number;
  }) => {
    setPendingPinPosition(position);
    setIsDroppingPin(false);
  };

  const handleCreateComment = async (data: {
    author: string;
    content: string;
  }) => {
    if (!pendingPinPosition) return;

    const effectiveTime =
      mode === "replay"
        ? currentTimeMs
        : Math.max(0, Date.now() - sessionStartTimeRef.current);

    const newComment: SessionComment = {
      id: `cmt_${Math.random().toString(36).slice(2, 10)}`,
      sessionId: id,
      timestampMs: effectiveTime,
      position: pendingPinPosition,
      author: { name: data.author },
      content: data.content,
      resolved: false,
      createdAt: Date.now(),
    };

    setComments((prev) => [...prev, newComment]);
    setPendingPinPosition(null);

    // Persist to gateway
    try {
      const query = token
        ? `?token=${encodeURIComponent(token)}&gateway=${gatewayPort}`
        : `?gateway=${gatewayPort}`;
      await fetch(`/api/proxy/${id}/__relay/comments${query}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newComment),
      });
    } catch {
      // Ignored if offline
    }
  };

  const handleSeek = (timestampMs: number) => {
    setCurrentTimeMs(timestampMs);
  };

  const handleSelectComment = (comment: SessionComment) => {
    if (mode === "live") {
      setMode("replay");
    }
    setCurrentTimeMs(comment.timestampMs);
    setIsPlaying(false);
  };

  const handleReplyComment = async (
    commentId: string,
    replyContent: string,
  ) => {
    const reply = {
      id: `rpl_${Math.random().toString(36).slice(2, 10)}`,
      commentId,
      author: { name: "Host Developer", isHost: true },
      content: replyContent,
      createdAt: Date.now(),
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), reply] }
          : c,
      ),
    );

    try {
      const query = token
        ? `?token=${encodeURIComponent(token)}&gateway=${gatewayPort}`
        : `?gateway=${gatewayPort}`;
      await fetch(`/api/proxy/${id}/__relay/comments${query}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          commentId,
          content: replyContent,
          author: { name: "Host Developer", isHost: true },
        }),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleArchiveComment = async (commentId: string) => {
    const archivePointMs =
      mode === "replay"
        ? currentTimeMs
        : Math.max(0, Date.now() - sessionStartTimeRef.current);

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, archived: true, archivedAtTimestampMs: archivePointMs }
          : c,
      ),
    );

    try {
      const query = token
        ? `?token=${encodeURIComponent(token)}&gateway=${gatewayPort}`
        : `?gateway=${gatewayPort}`;
      await fetch(`/api/proxy/${id}/__relay/comments${query}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          commentId,
          archivedAtTimestampMs: archivePointMs,
        }),
      });
    } catch {
      // Offline fallback
    }
  };

  // Active comments:
  // - Replay mode: visible within +/- 3000ms window, but hidden if currentTimeMs >= archivedAtTimestampMs
  // - Live mode: archived comments are hidden
  const activeReplayComments =
    mode === "replay"
      ? comments.filter((c) => {
          if (c.archived) {
            if (
              c.archivedAtTimestampMs !== null &&
              c.archivedAtTimestampMs !== undefined
            ) {
              if (currentTimeMs >= c.archivedAtTimestampMs) return false;
            } else {
              return false;
            }
          }
          return Math.abs(c.timestampMs - currentTimeMs) <= 3000;
        })
      : comments.filter((c) => !c.archived);

  // Active user interaction events during replay (clicks / inputs within 1500ms)
  const activeInteractions =
    mode === "replay"
      ? recordedEvents.filter(
          (e) =>
            e.type === "user_interaction" &&
            Math.abs(e.timestampMs - currentTimeMs) <= 1500,
        )
      : [];

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden font-sans">
      {/* Remote Top Bar */}
      <header className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/manage/${id}?token=${token}&gateway=${gatewayPort}`}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Manage Session
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="font-mono text-xs font-semibold text-zinc-300">
            Session: <span className="text-emerald-400 font-bold">{id}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              connected
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-rose-950 text-rose-400 border border-rose-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            {connected ? "Tunnel Connected" : "Disconnected"}
          </span>

          {recordedEvents.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-500 hidden md:inline">
              ({recordedEvents.length} events captured)
            </span>
          )}
        </div>

        {/* Center: Live vs Replay Mode Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => {
              setMode("live");
              setIsPlaying(false);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mode === "live"
                ? "bg-zinc-800 text-rose-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🔴 Live View
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("replay");
              if (comments.length > 0 || recordedEvents.length > 0) {
                const maxTime = Math.max(
                  ...comments.map((c) => c.timestampMs),
                  ...recordedEvents.map((e) => e.timestampMs),
                  1000,
                );
                setDurationMs(Math.max(60000, maxTime + 10000));
              }
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mode === "replay"
                ? "bg-zinc-800 text-blue-400 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ▶ Replay Recording
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Drop Pin Feedback Tool */}
          <button
            type="button"
            onClick={() => setIsDroppingPin(!isDroppingPin)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              isDroppingPin
                ? "bg-amber-500 border-amber-400 text-zinc-950 font-bold animate-pulse"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200"
            }`}
          >
            <span>📍</span>
            <span>{isDroppingPin ? "Click App Screen" : "Drop Pin"}</span>
          </button>

          {/* Toggle Comments Drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="px-2.5 py-1 text-xs rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Feedback ({comments.length})</span>
          </button>

          {/* Toggle Activity & Telemetry Inspector */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              isInspectorOpen
                ? "bg-zinc-800 border-zinc-700 text-white font-semibold"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
            }`}
          >
            <span>📊</span>
            <span>Inspector ({recordedEvents.length})</span>
          </button>

          <button
            type="button"
            onClick={handleReload}
            disabled={reloading}
            className="px-2.5 py-1 text-xs rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
          >
            {reloading ? "Reloading..." : "↻ Reload"}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        <main className="flex-1 h-full relative bg-zinc-900">
          <iframe
            key={`${targetUrl}-${reloading ? "reloading" : "ready"}`}
            src={targetUrl}
            title={`Remote Relay View for session ${id}`}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
            className="w-full h-full border-none"
          />

          {/* Spatial Pin Overlay */}
          <CommentPinOverlay
            comments={comments}
            activeComments={mode === "replay" ? activeReplayComments : comments}
            isDroppingPin={isDroppingPin}
            onDropPin={handleDropPinInitiated}
            onSelectComment={handleSelectComment}
            onReplyComment={handleReplyComment}
            onArchiveComment={handleArchiveComment}
          />

          {/* User Interaction Replay Pulse (Visible in Replay Mode) */}
          {mode === "replay" &&
            activeInteractions.map((act, i) => {
              const payload = act.payload as {
                xPercent?: number;
                yPercent?: number;
                targetSelector?: string;
              };
              return (
                <div
                  key={`${act.type}-${act.timestampMs}-${i}`}
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center transition-all duration-300"
                  style={{
                    left: `${payload.xPercent ?? 50}%`,
                    top: `${payload.yPercent ?? 50}%`,
                  }}
                >
                  <span className="w-10 h-10 rounded-full bg-rose-500/40 border-2 border-rose-400 animate-ping absolute" />
                  <span className="w-5 h-5 rounded-full bg-rose-500 shadow-xl text-[10px] font-bold text-white flex items-center justify-center">
                    👆
                  </span>
                  {payload.targetSelector && (
                    <span className="ml-8 px-2 py-0.5 rounded bg-zinc-950/90 border border-zinc-700 text-[11px] text-zinc-200 font-mono whitespace-nowrap shadow-xl">
                      {payload.targetSelector}
                    </span>
                  )}
                </div>
              );
            })}
        </main>

        {/* Sliding Comments Drawer */}
        <CommentsDrawer
          isOpen={isDrawerOpen}
          comments={comments}
          onClose={() => setIsDrawerOpen(false)}
          onSelectComment={handleSelectComment}
        />
      </div>

      {/* Replay Timeline Scrubber (Visible in Replay Mode) */}
      {mode === "replay" && (
        <ReplayTimelineScrubber
          currentTimeMs={currentTimeMs}
          durationMs={durationMs}
          isPlaying={isPlaying}
          speed={speed}
          comments={comments}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onSeek={handleSeek}
          onSpeedChange={setSpeed}
        />
      )}

      {/* Activity & Telemetry Inspector Panel */}
      {isInspectorOpen && (
        <section className="h-56 bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 z-30 font-mono text-xs">
          {/* Tabs bar */}
          <div className="h-9 px-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(
                [
                  {
                    id: "network",
                    label: "🌐 Network",
                    count: recordedEvents.filter((e) => e.type === "network")
                      .length,
                  },
                  {
                    id: "console",
                    label: "📟 Console",
                    count: recordedEvents.filter((e) => e.type === "console")
                      .length,
                  },
                  {
                    id: "dom",
                    label: "🌳 DOM Changes",
                    count: recordedEvents.filter(
                      (e) =>
                        e.type === "dom_mutation" || e.type === "dom_snapshot",
                    ).length,
                  },
                  {
                    id: "interactions",
                    label: "👆 User Clicks",
                    count: recordedEvents.filter(
                      (e) => e.type === "user_interaction",
                    ).length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectorTab(tab.id)}
                  className={`px-3 py-1 rounded text-[11px] transition-colors ${
                    inspectorTab === tab.id
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              className="text-zinc-400 hover:text-white px-2 py-0.5 rounded text-xs"
            >
              ✕ Close
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {inspectorTab === "network" &&
              recordedEvents
                .filter((e) => e.type === "network")
                .map((ev, i) => {
                  const p = ev.payload as {
                    method?: string;
                    url?: string;
                    status?: number;
                    durationMs?: number;
                  };
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/40 hover:bg-zinc-900 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span className="font-bold text-blue-400">
                          {p.method || "GET"}
                        </span>
                        <span className="text-zinc-300 truncate">
                          {p.url || "/"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={
                            p.status && p.status < 400
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {p.status || 200}
                        </span>
                        {p.durationMs !== undefined && (
                          <span className="text-zinc-500">
                            {p.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

            {inspectorTab === "console" &&
              recordedEvents
                .filter((e) => e.type === "console")
                .map((ev, i) => {
                  const p = ev.payload as { level?: string; args?: string[] };
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 py-1 px-2 rounded bg-zinc-900/40 text-[11px]"
                    >
                      <span
                        className={`uppercase font-bold text-[10px] px-1 rounded ${
                          p.level === "error"
                            ? "bg-rose-950 text-rose-400"
                            : p.level === "warn"
                              ? "bg-amber-950 text-amber-400"
                              : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {p.level || "log"}
                      </span>
                      <span className="text-zinc-300 break-words">
                        {p.args?.join(" ") || ""}
                      </span>
                    </div>
                  );
                })}

            {inspectorTab === "dom" &&
              recordedEvents
                .filter(
                  (e) => e.type === "dom_mutation" || e.type === "dom_snapshot",
                )
                .map((ev, i) => {
                  const p = ev.payload as {
                    targetSelector?: string;
                    mutationType?: string;
                  };
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/40 text-[11px]"
                    >
                      <span className="text-cyan-400">
                        {p.mutationType || "mutation"}
                      </span>
                      <span className="text-zinc-400 truncate">
                        {p.targetSelector || "document"}
                      </span>
                      <span className="text-zinc-500">{ev.timestampMs}ms</span>
                    </div>
                  );
                })}

            {inspectorTab === "interactions" &&
              recordedEvents
                .filter((e) => e.type === "user_interaction")
                .map((ev, i) => {
                  const p = ev.payload as {
                    action?: string;
                    targetSelector?: string;
                    xPercent?: number;
                    yPercent?: number;
                  };
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/40 text-[11px]"
                    >
                      <span className="font-bold text-amber-400 uppercase">
                        {p.action || "click"}
                      </span>
                      <span className="text-zinc-300">
                        {p.targetSelector || `(${p.xPercent}%, ${p.yPercent}%)`}
                      </span>
                      <span className="text-zinc-500">{ev.timestampMs}ms</span>
                    </div>
                  );
                })}

            {recordedEvents.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No telemetry events recorded yet. Perform actions on the
                connected app to capture logs, network requests, and DOM
                mutations.
              </div>
            )}
          </div>
        </section>
      )}

      {/* New In-Context Comment Modal */}
      <NewCommentModal
        isOpen={Boolean(pendingPinPosition)}
        position={pendingPinPosition}
        timestampMs={
          mode === "replay"
            ? currentTimeMs
            : Math.max(0, Date.now() - sessionStartTimeRef.current)
        }
        onClose={() => setPendingPinPosition(null)}
        onSubmit={handleCreateComment}
      />
    </div>
  );
}

export default function RemoteReceiverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-black text-zinc-400 font-sans text-xs">
          Loading Remote Relay View...
        </div>
      }
    >
      <RemoteReceiverContent id={id} />
    </Suspense>
  );
}
