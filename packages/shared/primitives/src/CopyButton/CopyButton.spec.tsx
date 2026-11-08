import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton.js";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("CopyButton", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("copies its value and resets the success label", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.useFakeTimers();

    render(<CopyButton className="copy-control" value="bun test" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Copycommand/ }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("bun test");
    expect(screen.getByRole("button", { name: /Copiedcommand/ })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: /Copycommand/ })).toBeTruthy();
    expect(screen.getByRole("button").classList.contains("copy-control")).toBe(
      true,
    );
  });

  it("keeps the copy label when clipboard access fails", async () => {
    const writeText = vi
      .fn()
      .mockRejectedValue(new Error("clipboard unavailable"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CopyButton value="bun test" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Copycommand/ }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("bun test");
    expect(screen.getByRole("button", { name: /Copycommand/ })).toBeTruthy();
  });
});
