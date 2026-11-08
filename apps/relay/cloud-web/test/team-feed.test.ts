import { describe, expect, it } from "bun:test";
import { filterTeamSessions, type TeamSessionItem } from "../lib/team-feed";

describe("TASK-166: Team Session History & Multi-Developer Active Session Feed", () => {
  const sampleSessions: TeamSessionItem[] = [
    {
      id: "sess-1",
      shortCode: "APP-111",
      developerName: "Octavia",
      developerEmail: "octavia@paddy.systems",
      project: "p-s-core",
      branch: "feat/relay-tunnel",
      targetPort: 3000,
      activeReceivers: 3,
      createdAt: Date.now() - 60000,
      status: "live",
    },
    {
      id: "sess-2",
      shortCode: "APP-222",
      developerName: "Sally Smith",
      developerEmail: "sally@paddy.systems",
      project: "wearfolio",
      branch: "fix/auth-flow",
      targetPort: 5173,
      activeReceivers: 1,
      createdAt: Date.now() - 120000,
      status: "live",
    },
    {
      id: "sess-3",
      shortCode: "APP-333",
      developerName: "Bob Dev",
      developerEmail: "bob@paddy.systems",
      project: "p-s-core",
      branch: "main",
      targetPort: 8080,
      activeReceivers: 0,
      createdAt: Date.now() - 360000,
      status: "idle",
    },
  ];

  it("filters sessions by keyword query across developer, branch, and project", () => {
    const octaviaResult = filterTeamSessions(sampleSessions, {
      searchQuery: "octavia",
    });
    expect(octaviaResult.length).toBe(1);
    expect(octaviaResult[0]?.id).toBe("sess-1");

    const branchResult = filterTeamSessions(sampleSessions, {
      searchQuery: "auth-flow",
    });
    expect(branchResult.length).toBe(1);
    expect(branchResult[0]?.id).toBe("sess-2");

    const projectResult = filterTeamSessions(sampleSessions, {
      project: "p-s-core",
    });
    expect(projectResult.length).toBe(2);
  });

  it("filters sessions by status (live vs idle)", () => {
    const liveSessions = filterTeamSessions(sampleSessions, {
      status: "live",
    });
    expect(liveSessions.length).toBe(2);

    const idleSessions = filterTeamSessions(sampleSessions, {
      status: "idle",
    });
    expect(idleSessions.length).toBe(1);
    expect(idleSessions[0]?.developerName).toBe("Bob Dev");
  });
});
