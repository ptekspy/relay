"use client";

import { useState } from "react";

export interface NewCommentModalProps {
  isOpen: boolean;
  position: { xPercent: number; yPercent: number } | null;
  timestampMs: number;
  onClose: () => void;
  onSubmit: (data: { author: string; content: string }) => void;
}

export function NewCommentModal({
  isOpen,
  position,
  timestampMs,
  onClose,
  onSubmit,
}: NewCommentModalProps) {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen || !position) return null;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit({
      author: author.trim() || "Viewer",
      content: content.trim(),
    });
    setContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
      <div className="w-96 bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-semibold text-sm">Add Feedback Comment</h3>
          </div>
          <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            {formatTime(timestampMs)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="comment-author-input"
              className="block text-xs text-zinc-400 mb-1"
            >
              Your Name
            </label>
            <input
              id="comment-author-input"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Sarah (Product Designer)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="comment-feedback-input"
              className="block text-xs text-zinc-400 mb-1"
            >
              Feedback
            </label>
            <textarea
              id="comment-feedback-input"
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What feels off or needs adjustment here?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>
              Target: {position.xPercent}% x {position.yPercent}%
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Post Pin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
