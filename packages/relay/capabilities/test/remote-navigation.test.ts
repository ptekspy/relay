import { describe, expect, it } from "bun:test";
import {
  type NavigableWindow,
  RemoteNavigationBridge,
} from "../src/remote-navigation.js";

describe("TASK-131: Remote Navigation Protocol & Bridge", () => {
  const createMockWindow = (
    initialUrl = "http://localhost:3000/page1",
  ): {
    win: NavigableWindow;
    reloaded: boolean;
    backCalled: boolean;
    forwardCalled: boolean;
    assignedUrl: string | null;
  } => {
    let reloaded = false;
    let backCalled = false;
    let forwardCalled = false;
    let assignedUrl: string | null = null;

    const win: NavigableWindow = {
      history: {
        length: 5,
        back: () => {
          backCalled = true;
        },
        forward: () => {
          forwardCalled = true;
        },
      },
      location: {
        href: initialUrl,
        reload: () => {
          reloaded = true;
        },
        assign: (url: string) => {
          assignedUrl = url;
          win.location.href = url;
        },
      },
    };

    return {
      win,
      get reloaded() {
        return reloaded;
      },
      get backCalled() {
        return backCalled;
      },
      get forwardCalled() {
        return forwardCalled;
      },
      get assignedUrl() {
        return assignedUrl;
      },
    };
  };

  it("triggers reload on target receiver window", () => {
    const mock = createMockWindow();
    const result = RemoteNavigationBridge.execute(
      { action: "reload" },
      mock.win,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe("reload");
    expect(mock.reloaded).toBe(true);
  });

  it("triggers back and forward history actions", () => {
    const mock = createMockWindow();

    const backResult = RemoteNavigationBridge.execute(
      { action: "back" },
      mock.win,
    );
    expect(backResult.success).toBe(true);
    expect(mock.backCalled).toBe(true);

    const fwdResult = RemoteNavigationBridge.execute(
      { action: "forward" },
      mock.win,
    );
    expect(fwdResult.success).toBe(true);
    expect(mock.forwardCalled).toBe(true);
  });

  it("navigates to specified valid URL", () => {
    const mock = createMockWindow();
    const result = RemoteNavigationBridge.execute(
      { action: "navigate", url: "http://localhost:3000/dashboard" },
      mock.win,
    );

    expect(result.success).toBe(true);
    expect(mock.assignedUrl).toBe("http://localhost:3000/dashboard");
    expect(mock.win.location.href).toBe("http://localhost:3000/dashboard");
  });

  it("blocks unsafe pseudo-protocols like javascript:", () => {
    const mock = createMockWindow();
    const result = RemoteNavigationBridge.execute(
      { action: "navigate", url: "javascript:alert(1)" },
      mock.win,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Blocked unsafe protocol");
    expect(mock.assignedUrl).toBeNull();
  });
});
