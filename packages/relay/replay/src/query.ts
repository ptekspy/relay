import type { EventQueryCriteria, ReplayEventWrapper } from "./types.js";

/**
 * High-speed in-memory search and query engine for recorded events.
 */
export class ReplayQueryEngine {
  private events: ReplayEventWrapper[] = [];

  constructor(events: ReplayEventWrapper[] = []) {
    this.events = events;
  }

  public setEvents(events: ReplayEventWrapper[]): void {
    this.events = events;
  }

  public query(criteria: EventQueryCriteria): ReplayEventWrapper[] {
    return this.events.filter((item) => {
      const { event, timestamp } = item;

      // Filter by timestamp range
      if (
        criteria.minTimestamp !== undefined &&
        timestamp < criteria.minTimestamp
      ) {
        return false;
      }
      if (
        criteria.maxTimestamp !== undefined &&
        timestamp > criteria.maxTimestamp
      ) {
        return false;
      }

      // Filter by kind
      if (
        criteria.kinds &&
        criteria.kinds.length > 0 &&
        !criteria.kinds.includes(event.kind)
      ) {
        return false;
      }

      // Filter console levels
      if (
        event.kind === "console" &&
        criteria.consoleLevels &&
        criteria.consoleLevels.length > 0
      ) {
        if (!criteria.consoleLevels.includes(event.level)) {
          return false;
        }
      }

      // Filter network status codes
      if (
        event.kind === "network" &&
        criteria.networkStatusCodes &&
        criteria.networkStatusCodes.length > 0
      ) {
        if (!criteria.networkStatusCodes.includes(event.status)) {
          return false;
        }
      }

      // Text search
      if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
        const query = criteria.searchQuery.toLowerCase();
        let matches = false;

        if (event.kind === "console") {
          matches = event.args.some((arg) =>
            String(arg).toLowerCase().includes(query),
          );
        } else if (event.kind === "network") {
          matches =
            event.url.toLowerCase().includes(query) ||
            event.method.toLowerCase().includes(query);
        } else if (event.kind === "dom_mutation") {
          matches = event.targetSelector.toLowerCase().includes(query);
        }

        if (!matches) return false;
      }

      return true;
    });
  }
}
