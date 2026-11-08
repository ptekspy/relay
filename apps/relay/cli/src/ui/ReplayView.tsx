import { Box, Text, useInput } from "ink";
import open from "open";
import type React from "react";
import { useEffect, useState } from "react";
import type { RelayGateway } from "../gateway.js";
import type { RelaySession } from "../session.js";

interface ReplayViewProps {
  session: RelaySession;
  gateway?: RelayGateway | null;
  viewerPort?: number;
}

export const ReplayView: React.FC<ReplayViewProps> = ({
  session,
  gateway,
  viewerPort = 9481,
}) => {
  const [commentCount, setCommentCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [latestComments, setLatestComments] = useState<
    Array<{
      id: string;
      timestampMs: number;
      author: string;
      content: string;
      selector?: string;
    }>
  >([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Poll gateway for real-time recording and comment updates
  useEffect(() => {
    if (!gateway) return;

    const updateStats = () => {
      const events = gateway.getRecordedEvents?.() ?? [];
      const comments = gateway.getComments?.() ?? [];

      setEventCount(events.length);
      setCommentCount(comments.length);
      setLatestComments(
        comments.slice(-8).map((c) => ({
          id: c.id,
          timestampMs: c.timestampMs,
          author: c.author.name,
          content: c.content,
          selector: c.targetSelector,
        })),
      );
    };

    updateStats();
    const timer = setInterval(updateStats, 1000);
    return () => clearInterval(timer);
  }, [gateway]);

  useInput((input) => {
    // Open Web Replay Viewer
    if (input.toLowerCase() === "o") {
      const gwPort = gateway?.port ?? 7331;
      const webUrl = `http://localhost:${viewerPort}/view/${session.id}?token=${session.token}&gateway=${gwPort}`;
      setStatusMsg(`Opening Web Replay Viewer: ${webUrl}`);
      void open(webUrl);
      setTimeout(() => setStatusMsg(null), 3000);
    }

    // Add Terminal Marker/Comment
    if (input.toLowerCase() === "c" && gateway?.addComment) {
      const newComment = {
        id: `cli_${Math.random().toString(36).slice(2, 8)}`,
        sessionId: session.id,
        timestampMs: Date.now() - session.createdAt,
        position: { xPercent: 50, yPercent: 50 },
        author: { name: "CLI Operator" },
        content: `Terminal checkpoint at ${new Date().toLocaleTimeString()}`,
        resolved: false,
        createdAt: Date.now(),
      };
      gateway.addComment(newComment);
      setStatusMsg("✓ Pinned terminal comment marker to session timeline!");
      setTimeout(() => setStatusMsg(null), 2500);
    }
  });

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Box flexDirection="column" gap={1}>
      {/* Session Recording Telemetry Status */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="blue"
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Text bold color="blue">
            Session Recording & Telemetry Pipeline
          </Text>
          <Text color="green">● LIVE CAPTURE ACTIVE</Text>
        </Box>
        <Text color="gray">
          Continuous recording: DOM mutations, clicks, network fetch, console
          errors.
        </Text>
        <Box gap={3} marginTop={1}>
          <Text>
            Events Recorded:{" "}
            <Text bold color="cyan">
              {eventCount}
            </Text>
          </Text>
          <Text>
            Feedback Pins:{" "}
            <Text bold color="yellow">
              {commentCount}
            </Text>
          </Text>
          <Text>
            Session ID: <Text color="white">{session.id}</Text>
          </Text>
        </Box>
      </Box>

      {/* Status banner */}
      {statusMsg && (
        <Box borderStyle="single" borderColor="green" paddingX={1}>
          <Text color="green">{statusMsg}</Text>
        </Box>
      )}

      {/* In-Context Feedback Pins / Comments Feed */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text bold color="yellow">
          In-Context Timeline Feedback & Pins ({commentCount}):
        </Text>

        {latestComments.length === 0 ? (
          <Text dimColor>
            No feedback comments yet. Tap 💬 on a connected device or press [c]
            to drop a terminal marker.
          </Text>
        ) : (
          <Box flexDirection="column" marginTop={1} gap={0}>
            {latestComments.map((cmt) => (
              <Box key={cmt.id} gap={1}>
                <Text color="cyan">[{formatTime(cmt.timestampMs)}]</Text>
                <Text bold color="yellow">
                  {cmt.author}:
                </Text>
                <Text color="white">&ldquo;{cmt.content}&rdquo;</Text>
                {cmt.selector && <Text dimColor>({cmt.selector})</Text>}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Action Keyboard Shortcuts */}
      <Box gap={2} marginTop={1}>
        <Text color="gray">
          Press{" "}
          <Text bold color="white">
            [o]
          </Text>{" "}
          Open Web Replay Viewer
        </Text>
        <Text color="gray">
          Press{" "}
          <Text bold color="white">
            [c]
          </Text>{" "}
          Drop CLI Comment Marker
        </Text>
      </Box>
    </Box>
  );
};
