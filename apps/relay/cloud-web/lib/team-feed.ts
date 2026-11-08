/**
 * Team Session History & Multi-Developer Active Session Feed
 *
 * Models and filters live and historical team developer sessions with
 * git branch, port, and collaborator presence metadata.
 *
 * Note for Octavia: Used in the main dashboard team overview screen.
 */

export interface TeamSessionItem {
  id: string;
  shortCode: string;
  developerName: string;
  developerEmail: string;
  developerAvatar?: string;
  project: string;
  branch: string;
  commitHash?: string;
  targetPort: number;
  activeReceivers: number;
  createdAt: number;
  status: "live" | "idle" | "ended";
}

export interface TeamFeedFilterOptions {
  searchQuery?: string;
  project?: string;
  status?: "all" | "live" | "idle" | "ended";
}

export function filterTeamSessions(
  sessions: TeamSessionItem[],
  options: TeamFeedFilterOptions = {},
): TeamSessionItem[] {
  const query = options.searchQuery?.trim().toLowerCase() ?? "";
  const project = options.project?.trim().toLowerCase();
  const status = options.status ?? "all";

  return sessions.filter((s) => {
    if (status !== "all" && s.status !== status) {
      return false;
    }

    if (project && s.project.toLowerCase() !== project) {
      return false;
    }

    if (query) {
      const matchDev = s.developerName.toLowerCase().includes(query);
      const matchEmail = s.developerEmail.toLowerCase().includes(query);
      const matchProject = s.project.toLowerCase().includes(query);
      const matchBranch = s.branch.toLowerCase().includes(query);
      const matchCode = s.shortCode.toLowerCase().includes(query);

      if (
        !matchDev &&
        !matchEmail &&
        !matchProject &&
        !matchBranch &&
        !matchCode
      ) {
        return false;
      }
    }

    return true;
  });
}
