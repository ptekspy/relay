/**
 * Relay Client-Side Injected Recorder Script
 *
 * Runs inside the browser on the paired device to continuously record:
 * - DOM Snapshots and incremental mutations (MutationObserver)
 * - User interactions (click, tap, input, scroll) with coordinates and CSS selectors
 * - Console logs (log, warn, error)
 * - Network telemetry (fetch)
 * - In-Context Feedback: interactive pin drop overlay and mobile comment modal
 */

export interface ClientRecorderConfig {
  sessionId?: string;
  ingestEndpoint?: string;
  enableFeedbackOverlay?: boolean;
}

export function generateClientRecorderScript(
  config: ClientRecorderConfig = {},
): string {
  const {
    sessionId = "default",
    ingestEndpoint = "/__relay/record",
    enableFeedbackOverlay = true,
  } = config;

  return `(() => {
  if (window.__RELAY_RECORDER_INSTALLED__) return;
  window.__RELAY_RECORDER_INSTALLED__ = true;

  const SESSION_ID = ${JSON.stringify(sessionId)};
  const INGEST_URL = ${JSON.stringify(ingestEndpoint)};
  const FEEDBACK_ENABLED = ${JSON.stringify(enableFeedbackOverlay)};
  const START_TIME = Date.now();

  let eventQueue = [];
  let isFlushing = false;

  function elapsed() {
    return Math.max(0, Date.now() - START_TIME);
  }

  function getSelector(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    if (el.getAttribute("data-testid")) return '[data-testid="' + el.getAttribute("data-testid") + '"]';
    let path = el.tagName.toLowerCase();
    if (el.className && typeof el.className === "string") {
      const cls = el.className.trim().split(/\\s+/).slice(0, 2).join(".");
      if (cls) path += "." + cls;
    }
    return path;
  }

  function sendEvent(type, payload) {
    eventQueue.push({
      timestampMs: elapsed(),
      type,
      payload,
    });
    if (eventQueue.length >= 25) {
      flushQueue();
    }
  }

  function flushQueue() {
    if (eventQueue.length === 0 || isFlushing) return;
    const batch = eventQueue.slice();
    eventQueue = [];
    isFlushing = true;

    fetch(INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID, events: batch }),
      keepalive: true,
    })
      .catch(() => {
        // Re-queue on failure if within reason
        if (eventQueue.length < 500) {
          eventQueue = batch.concat(eventQueue);
        }
      })
      .finally(() => {
        isFlushing = false;
      });
  }

  setInterval(flushQueue, 1000);
  window.addEventListener("beforeunload", flushQueue);

  // 1. Initial DOM Snapshot
  sendEvent("dom_snapshot", {
    html: document.documentElement ? document.documentElement.outerHTML : "",
    url: window.location.href,
  });

  // 2. Viewport
  sendEvent("viewport", {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

  window.addEventListener("resize", () => {
    sendEvent("viewport", {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    });
  });

  // 3. Incremental DOM MutationObserver
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        sendEvent("dom_mutation", {
          targetSelector: getSelector(m.target),
          mutationType: m.type,
          attributeName: m.attributeName || undefined,
          newValue: m.type === "characterData" ? m.target.textContent || undefined : undefined,
        });
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  // 4. User Interaction Capture (Clicks, Inputs)
  document.addEventListener("pointerdown", (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    sendEvent("user_interaction", {
      action: "click",
      x: e.clientX,
      y: e.clientY,
      xPercent: Math.round((e.clientX / w) * 1000) / 10,
      yPercent: Math.round((e.clientY / h) * 1000) / 10,
      targetSelector: getSelector(e.target),
    });
  }, true);

  document.addEventListener("input", (e) => {
    const target = e.target;
    if (!target) return;
    const isSensitive = target.type === "password" || target.name?.includes("secret");
    sendEvent("user_interaction", {
      action: "input",
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      targetSelector: getSelector(target),
      value: isSensitive ? "[REDACTED]" : (target.value ? target.value.slice(0, 100) : undefined),
    });
  }, true);

  // 5. Console Capture
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = function(...args) {
    originalLog.apply(console, args);
    sendEvent("console", { level: "log", args: args.map(String) });
  };
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    sendEvent("console", { level: "warn", args: args.map(String) });
  };
  console.error = function(...args) {
    originalError.apply(console, args);
    sendEvent("console", { level: "error", args: args.map(String) });
  };

  // 6. Network Interceptor
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const start = elapsed();
    const url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
    // Avoid intercepting telemetry ingestion calls
    if (url.includes("/__relay/")) {
      return originalFetch.apply(window, args);
    }
    const method = (args[1] && args[1].method) || "GET";
    try {
      const resp = await originalFetch.apply(window, args);
      sendEvent("network", {
        url,
        method,
        status: resp.status,
        durationMs: elapsed() - start,
      });
      return resp;
    } catch (err) {
      sendEvent("network", {
        url,
        method,
        status: 0,
        durationMs: elapsed() - start,
      });
      throw err;
    }
  };

  // 7. In-Context Mobile/Web Feedback Overlay
  if (FEEDBACK_ENABLED) {
    const btn = document.createElement("div");
    btn.id = "__relay_feedback_btn";
    btn.innerHTML = "💬";
    btn.setAttribute(
      "style",
      "position:fixed;bottom:20px;right:20px;width:44px;height:44px;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.5);user-select:none;-webkit-tap-highlight-color:transparent;"
    );

    let commentMode = false;
    let highlightBox = null;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      commentMode = !commentMode;
      btn.style.background = commentMode ? "#3b82f6" : "#18181b";
      btn.style.borderColor = commentMode ? "#60a5fa" : "#3f3f46";
      document.body.style.cursor = commentMode ? "crosshair" : "";
    });

    document.addEventListener("click", (e) => {
      if (!commentMode || e.target === btn || btn.contains(e.target)) return;
      e.stopPropagation();
      e.preventDefault();

      const target = e.target;
      const rect = target.getBoundingClientRect();
      const xPercent = Math.round((e.clientX / window.innerWidth) * 1000) / 10;
      const yPercent = Math.round((e.clientY / window.innerHeight) * 1000) / 10;
      const selector = getSelector(target);

      // Prompt for comment
      const commentText = window.prompt("Relay In-Context Feedback:\\nLeave a comment for " + selector + ":");
      if (commentText && commentText.trim()) {
        const commentObj = {
          id: "cmt_" + Math.random().toString(36).slice(2, 10),
          sessionId: SESSION_ID,
          timestampMs: elapsed(),
          position: { xPercent, yPercent },
          targetSelector: selector,
          routeUrl: window.location.pathname,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
          },
          author: { name: "Device Tester" },
          content: commentText.trim(),
          createdAt: Date.now(),
        };

        sendEvent("session_comment", commentObj);

        // Also post directly to /__relay/comments
        fetch("/__relay/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(commentObj),
        }).catch(() => {});

        alert("Comment pinned at " + Math.round(elapsed() / 1000) + "s on " + selector);
      }

      commentMode = false;
      btn.style.background = "#18181b";
      btn.style.borderColor = "#3f3f46";
      document.body.style.cursor = "";
    }, true);

    document.body.appendChild(btn);
  }
})();`;
}
