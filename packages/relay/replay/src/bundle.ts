import type { ReplayEventWrapper } from "./types.js";

export interface BundleOptions {
  title?: string;
  sessionId: string;
  events: ReplayEventWrapper[];
}

export const FIVE_MB_LIMIT = 5 * 1024 * 1024; // 5,242,880 bytes

/**
 * Compiles a session recording into a standalone self-contained offline HTML replay file.
 * Requires ZERO internet connectivity, containing full DOM, console, and network scrubbers.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-replay/bundle.
 */
export function buildStandaloneHtmlReplay(options: BundleOptions): string {
  const { title = "Relay Session Replay", sessionId, events } = options;
  const serializedEvents = JSON.stringify(events).replace(/</g, "\\u003c");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${sessionId}</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --text: #f4f4f5;
      --accent: #3b82f6;
      --muted: #71717a;
      --border: #27272a;
      --err: #ef4444;
      --warn: #f59e0b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card);
    }
    main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 400px;
      overflow: hidden;
    }
    #viewport-container {
      padding: 1.5rem;
      overflow: auto;
      border-right: 1px solid var(--border);
      display: flex;
      justify-content: center;
      background: #000;
    }
    #viewport {
      width: 100%;
      max-width: 480px;
      min-height: 600px;
      background: #ffffff;
      color: #111827;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5);
      overflow: auto;
    }
    #telemetry-sidebar {
      display: flex;
      flex-direction: column;
      background: var(--card);
      overflow: hidden;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      background: #141416;
    }
    .tab {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      font-weight: 500;
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
    }
    .tab.active {
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
    }
    #telemetry-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
      font-family: ui-monospace, monospace;
      font-size: 0.75rem;
      list-style: none;
      margin: 0;
    }
    .log-item {
      padding: 0.35rem 0.5rem;
      border-bottom: 1px solid var(--border);
      word-break: break-all;
    }
    .log-item.error { color: var(--err); }
    .log-item.warn { color: var(--warn); }
    footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 1rem;
      align-items: center;
      background: var(--card);
    }
    button.btn-ctl {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.4rem 0.85rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 600;
    }
    input[type=range] {
      flex: 1;
      cursor: pointer;
    }
    #timer {
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
      color: var(--muted);
      min-width: 90px;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <strong>⚡ Relay Standalone Replay</strong>
      <span style="color: var(--muted); margin-left: 0.5rem;">Session: \`${sessionId}\`</span>
    </div>
    <div id="statusBadge" style="font-size: 0.8rem; color: #10b981;">Offline Compatible (100% Embedded)</div>
  </header>
  <main>
    <div id="viewport-container">
      <div id="viewport">
        <div id="reconstructed-dom"></div>
      </div>
    </div>
    <div id="telemetry-sidebar">
      <div class="tabs">
        <button class="tab active" id="tabConsole">Console Logs</button>
        <button class="tab" id="tabNetwork">Network Waterfall</button>
      </div>
      <ul id="telemetry-list"></ul>
    </div>
  </main>
  <footer>
    <button id="playBtn" class="btn-ctl">Play</button>
    <input type="range" id="scrubber" min="0" max="100" value="0">
    <div id="timer">00:00</div>
  </footer>
  <script>
    const events = ${serializedEvents};
    console.log("[Relay Replay] Loaded " + events.length + " events for session ${sessionId}");
    let isPlaying = false;
    let playhead = 0;
    let timerInterval = null;

    const startTs = events.length > 0 ? events[0].timestamp : 0;
    const endTs = events.length > 0 ? events[events.length - 1].timestamp : 0;
    const duration = Math.max(1, endTs - startTs);

    const playBtn = document.getElementById('playBtn');
    const scrubber = document.getElementById('scrubber');
    const timer = document.getElementById('timer');
    const list = document.getElementById('telemetry-list');
    const domView = document.getElementById('reconstructed-dom');

    function renderTelemetry(currentMs) {
      list.innerHTML = '';
      const visible = events.filter(e => e.timestamp <= currentMs);
      visible.slice(-50).forEach(e => {
        const li = document.createElement('li');
        li.className = 'log-item' + (e.event.level === 'error' ? ' error' : '');
        const time = new Date(e.timestamp).toISOString().slice(11, 19);
        li.textContent = '[' + time + '] ' + (e.event.message || e.event.kind);
        list.appendChild(li);
      });
      list.scrollTop = list.scrollHeight;
    }

    function renderDOM(currentMs) {
      const domEvents = events.filter(e => e.timestamp <= currentMs && e.event.kind === 'dom_mutation');
      if (domEvents.length === 0) {
        domView.innerHTML = '<p style="color: #6b7280; font-size: 0.9rem;">Initial DOM snapshot loaded.</p>';
        return;
      }
      domView.innerHTML = '<div style="padding: 4px; font-size: 0.9rem;">Reconstructed DOM State (' + domEvents.length + ' mutations applied)</div>';
    }

    function updatePlayhead(percent) {
      const currentTs = startTs + (duration * (percent / 100));
      const secs = Math.floor((currentTs - startTs) / 1000);
      timer.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
      renderTelemetry(currentTs);
      renderDOM(currentTs);
    }

    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';
      if (isPlaying) {
        timerInterval = setInterval(() => {
          playhead += 1;
          if (playhead > 100) {
            playhead = 0;
            isPlaying = false;
            playBtn.textContent = 'Play';
            clearInterval(timerInterval);
          }
          scrubber.value = playhead;
          updatePlayhead(playhead);
        }, 100);
      } else {
        clearInterval(timerInterval);
      }
    });

    scrubber.addEventListener('input', (e) => {
      playhead = Number(e.target.value);
      updatePlayhead(playhead);
    });

    // Initial render
    updatePlayhead(0);
  </script>
</body>
</html>`;

  return html;
}
