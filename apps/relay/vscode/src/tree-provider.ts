import type { ActiveSessionDetails, ConnectedReceiverItem } from "./types.js";

export interface TreeItemDescriptor {
  id: string;
  label: string;
  description?: string;
  collapsibleState: "none" | "collapsed" | "expanded";
  children?: TreeItemDescriptor[];
}

/**
 * TreeDataProvider model for VS Code sidebar.
 */
export class RelaySessionTreeProvider {
  private activeSession: ActiveSessionDetails | null = null;
  private changeListeners = new Set<() => void>();

  public setSession(session: ActiveSessionDetails | null): void {
    this.activeSession = session;
    this.notify();
  }

  public getTreeItems(): TreeItemDescriptor[] {
    if (!this.activeSession) {
      return [
        {
          id: "no-session",
          label: "No Active Relay Session",
          description: "Run 'Relay: Start Session'",
          collapsibleState: "none",
        },
      ];
    }

    const sessionRoot: TreeItemDescriptor = {
      id: "session-root",
      label: `Port :${this.activeSession.localPort} (${this.activeSession.shortCode})`,
      collapsibleState: "expanded",
      children: this.activeSession.receivers.map((rec) => ({
        id: rec.id,
        label: `${rec.name} (${rec.latencyMs}ms)`,
        description:
          rec.batteryLevel !== undefined
            ? `${Math.round(rec.batteryLevel * 100)}% 🔋`
            : rec.ipAddress,
        collapsibleState: "none",
      })),
    };

    return [sessionRoot];
  }

  public onDidChangeTreeData(cb: () => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }

  private notify(): void {
    for (const cb of this.changeListeners) {
      cb();
    }
  }
}
