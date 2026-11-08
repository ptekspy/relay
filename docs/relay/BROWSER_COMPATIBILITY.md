# Paddy Systems Relay — Receiver Browser Compatibility Matrix

This document defines supported receiver browser environments, tested OS versions, and specific API capabilities across mobile and desktop platforms.

---

## 1. Supported Browsers Matrix

| Browser / Client | Min Version | DOM Replay | Console Mirroring | Network TTFB | Touch Emulation | Screen Capture | Battery API |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobile Safari (iOS)** | iOS 15.4+ | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ DOM Replay only | ❌ Denied by Apple |
| **Chrome for Android** | Chrome 110+ | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ getDisplayMedia | ✅ Supported |
| **Firefox for Android** | Firefox 115+ | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Prompt required | ❌ Unsupported |
| **Samsung Internet** | v20+ | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Supported | ✅ Supported |
| **Desktop Chrome / Edge** | Chrome 110+ | ✅ Full | ✅ Full | ✅ Full | ✅ Pointer events | ✅ Full tab/screen | ✅ Supported |
| **Desktop Safari** | Safari 16.0+ | ✅ Full | ✅ Full | ✅ Full | ✅ Pointer events | ✅ Window/Screen | ❌ Denied |
| **Desktop Firefox** | Firefox 115+ | ✅ Full | ✅ Full | ✅ Full | ✅ Pointer events | ✅ Full screen | ❌ Unsupported |

---

## 2. Platform-Specific Quirks & Workarounds

### iOS Mobile Safari
- **Battery API (`navigator.getBattery`)**: Apple has explicitly blocked the Battery Status API due to fingerprinting concerns. Relay gracefully disables battery-adaptive throttling on iOS devices without throwing exceptions.
- **Display Media / Screen Capture**: Mobile Safari does not expose `navigator.mediaDevices.getDisplayMedia` to web apps. Relay automatically falls back to lightweight, high-fidelity DOM mutation snapshotting (`dom_replay`).
- **Autoplay / Audio**: iOS requires user interaction before playing audio elements.

### Android Chrome
- **Screen Capture**: Requires an explicit user gesture (`click` or `tap`) before calling `getDisplayMedia`. Relay presents a clear UI prompt before starting a stream.
- **PWA Fullscreen**: When launched from an "Add to Home Screen" shortcut, Android Chrome hides the URL bar, yielding 100% of the viewport to the Relay receiver.

---

## 3. Automation & Headless Receiver Support

- **Playwright / Puppeteer**: Supported in Chromium, WebKit, and Firefox for automated end-to-end telemetry testing.
- **Node / Bun Headless**: Connects via WebSocket as headless telemetry ingestors.
