"use client";

import type {
  CommentReply,
  SessionComment,
} from "@paddy-systems/relay-recording";
import { useState } from "react";

export interface CommentPinOverlayProps {
  comments: SessionComment[];
  activeComments?: SessionComment[];
  isDroppingPin: boolean;
  onDropPin: (position: { xPercent: number; yPercent: number }) => void;
  onSelectComment?: (comment: SessionComment) => void;
  onReplyComment?: (commentId: string, content: string) => void;
  onArchiveComment?: (commentId: string) => void;
}

export function CommentPinOverlay({
  comments,
  activeComments,
  isDroppingPin,
  onDropPin,
  onSelectComment,
  onReplyComment,
  onArchiveComment,
}: CommentPinOverlayProps) {
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDroppingPin) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 1000) / 10;
    const yPercent = Math.round((y / rect.height) * 1000) / 10;

    onDropPin({ xPercent, yPercent });
  };

  const displayedComments = activeComments ?? comments;

  const handleSendReply = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplyComment?.(commentId, replyText.trim());
    setReplyText("");
  };

  return (
    <>
      {/* Drop Pin Backdrop Button */}
      {isDroppingPin && (
        <button
          type="button"
          aria-label="Click to place feedback pin"
          onClick={handleClick}
          className="absolute inset-0 z-30 cursor-crosshair bg-blue-500/10 w-full h-full border-none p-0 appearance-none pointer-events-auto"
        />
      )}

      {/* Pins and Popovers Container */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {displayedComments.map((comment, index) => {
          const isSelected = selectedCommentId === comment.id;

          return (
            <div
              key={comment.id}
              style={{
                left: `${comment.position.xPercent}%`,
                top: `${comment.position.yPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform hover:scale-110"
            >
              {/* Numbered Pin Badge */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCommentId(isSelected ? null : comment.id);
                  onSelectComment?.(comment);
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-lg border-2 transition-colors ${
                  comment.archived
                    ? "bg-zinc-800 border-zinc-600 text-zinc-400 opacity-60"
                    : isSelected
                      ? "bg-blue-500 border-white text-white ring-4 ring-blue-500/30"
                      : "bg-amber-500 border-zinc-950 text-zinc-950 hover:bg-amber-400"
                }`}
              >
                {index + 1}
              </button>

              {/* Comment Popover Card with Thread & Archiving */}
              {isSelected && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-9 w-72 bg-zinc-900 border border-zinc-700 rounded-xl p-3.5 shadow-2xl text-left z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {comment.author.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400">
                        {Math.floor(comment.timestampMs / 60000)}:
                        {String(
                          Math.floor((comment.timestampMs % 60000) / 1000),
                        ).padStart(2, "0")}
                      </span>
                      {!comment.archived && (
                        <button
                          type="button"
                          onClick={() => onArchiveComment?.(comment.id)}
                          className="text-[10px] text-zinc-400 hover:text-amber-400 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-200 leading-relaxed mb-2 break-words">
                    {comment.content}
                  </p>

                  {/* Threaded Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-1.5 my-2 max-h-36 overflow-y-auto border-t border-zinc-800/80 pt-2">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Replies ({comment.replies.length})
                      </div>
                      {comment.replies.map((reply: CommentReply) => (
                        <div
                          key={reply.id}
                          className="bg-zinc-950/80 rounded-lg p-2 border border-zinc-800 text-[11px]"
                        >
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="font-semibold text-emerald-400">
                              {reply.author.name}{" "}
                              {reply.author.isHost ? "(Host)" : ""}
                            </span>
                          </div>
                          <p className="text-zinc-300 leading-snug">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Host Reply Input */}
                  {!comment.archived && (
                    <form
                      onSubmit={(e) => handleSendReply(e, comment.id)}
                      className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply as host..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors"
                      >
                        Reply
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
