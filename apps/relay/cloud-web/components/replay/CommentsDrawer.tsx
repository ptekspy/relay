"use client";

import type { SessionComment } from "@paddy-systems/relay-recording";

export interface CommentsDrawerProps {
  isOpen: boolean;
  comments: SessionComment[];
  onClose: () => void;
  onSelectComment: (comment: SessionComment) => void;
}

export function CommentsDrawer({
  isOpen,
  comments,
  onClose,
  onSelectComment,
}: CommentsDrawerProps) {
  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <aside className="w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col z-40 font-sans shadow-2xl">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-zinc-200">Feedback</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
            {comments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-900 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No comments yet. Click &ldquo;Drop Pin&rdquo; to leave feedback on
            the app screen.
          </div>
        ) : (
          comments.map((comment, idx) => (
            <button
              key={comment.id}
              type="button"
              onClick={() => onSelectComment(comment)}
              className="w-full text-left p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer transition-all text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-zinc-200">
                    {comment.author.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">
                  {formatTime(comment.timestampMs)}
                </span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed mb-2 break-words">
                {comment.content}
              </p>

              <div className="flex items-center justify-between text-[10px]">
                {comment.targetSelector ? (
                  <span className="font-mono text-cyan-400 truncate max-w-[150px]">
                    {comment.targetSelector}
                  </span>
                ) : (
                  <span className="text-zinc-600 font-mono">
                    x:{comment.position.xPercent}% y:
                    {comment.position.yPercent}%
                  </span>
                )}
                <span className="text-blue-400 hover:underline">
                  Jump to moment →
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
