/**
 * Remote Navigation Protocol & Bridge
 *
 * Implements protocol commands enabling host or web dashboard to trigger navigation
 * (back, forward, reload, navigate to URL) on connected mobile receivers.
 *
 * Note for Octavia: This handles remote receiver browser history and URL navigation.
 */

export type RemoteNavAction = "back" | "forward" | "reload" | "navigate";

export interface RemoteNavCommand {
  action: RemoteNavAction;
  url?: string;
  forceReload?: boolean;
}

export interface RemoteNavResult {
  action: RemoteNavAction;
  success: boolean;
  currentUrl: string;
  historyLength: number;
  error?: string;
}

export interface NavigableWindow {
  history: {
    back: () => void;
    forward: () => void;
    length: number;
  };
  location: {
    href: string;
    reload: () => void;
    assign?: (url: string) => void;
  };
}

export class RemoteNavigationBridge {
  /**
   * Executes a navigation command on target window / receiver environment.
   */
  public static execute(
    command: RemoteNavCommand,
    win: NavigableWindow = typeof window !== "undefined"
      ? (window as unknown as NavigableWindow)
      : (null as unknown as NavigableWindow),
  ): RemoteNavResult {
    if (!win) {
      return {
        action: command.action,
        success: false,
        currentUrl: "",
        historyLength: 0,
        error: "No window object available to navigate",
      };
    }

    try {
      switch (command.action) {
        case "back": {
          win.history.back();
          return {
            action: "back",
            success: true,
            currentUrl: win.location.href,
            historyLength: win.history.length,
          };
        }

        case "forward": {
          win.history.forward();
          return {
            action: "forward",
            success: true,
            currentUrl: win.location.href,
            historyLength: win.history.length,
          };
        }

        case "reload": {
          win.location.reload();
          return {
            action: "reload",
            success: true,
            currentUrl: win.location.href,
            historyLength: win.history.length,
          };
        }

        case "navigate": {
          if (!command.url) {
            return {
              action: "navigate",
              success: false,
              currentUrl: win.location.href,
              historyLength: win.history.length,
              error: "Missing URL for navigate action",
            };
          }

          // Security check: disallow javascript: and data: pseudo-protocols
          const trimmed = command.url.trim().toLowerCase();
          if (
            trimmed.startsWith("javascript:") ||
            trimmed.startsWith("data:")
          ) {
            return {
              action: "navigate",
              success: false,
              currentUrl: win.location.href,
              historyLength: win.history.length,
              error: "Blocked unsafe protocol in URL",
            };
          }

          if (typeof win.location.assign === "function") {
            win.location.assign(command.url);
          } else {
            win.location.href = command.url;
          }

          return {
            action: "navigate",
            success: true,
            currentUrl: win.location.href,
            historyLength: win.history.length,
          };
        }

        default:
          return {
            action: command.action,
            success: false,
            currentUrl: win.location.href,
            historyLength: win.history.length,
            error: `Unsupported navigation action: ${command.action}`,
          };
      }
    } catch (err) {
      return {
        action: command.action,
        success: false,
        currentUrl: win.location?.href || "",
        historyLength: win.history?.length || 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
