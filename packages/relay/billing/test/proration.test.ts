import { describe, expect, it } from "bun:test";
import {
  DEFAULT_TEAMS_SEAT_PRICE_CENTS,
  TEAMS_TIER_MINIMUM_SEATS,
  TeamsSeatManager,
} from "../src/proration.js";

describe("TASK-195: Automated Proration & Seat Management for Teams Tier", () => {
  const manager = new TeamsSeatManager();

  const cycleStartMs = 1700000000000;
  const cycleEndMs = cycleStartMs + 30 * 24 * 60 * 60 * 1000; // 30 days
  const halfWayMs = cycleStartMs + 15 * 24 * 60 * 60 * 1000; // 50% through

  it("enforces strict 3-seat minimum rule on Teams tier", () => {
    expect(() => {
      manager.calculateSeatAdjustment({
        currentSeats: 3,
        requestedSeats: 2, // Violates 3-seat minimum
        billingPeriod: { cycleStartMs, cycleEndMs },
      });
    }).toThrow(
      `Teams tier requires a minimum of ${TEAMS_TIER_MINIMUM_SEATS} seats`,
    );
  });

  it("calculates accurate prorated charge when adding a 4th seat exactly halfway through cycle", () => {
    const result = manager.calculateSeatAdjustment({
      currentSeats: 3,
      requestedSeats: 4,
      effectiveTimestampMs: halfWayMs,
      billingPeriod: { cycleStartMs, cycleEndMs },
      pricePerSeatCents: DEFAULT_TEAMS_SEAT_PRICE_CENTS, // 1500 cents ($15.00)
    });

    expect(result.previousSeats).toBe(3);
    expect(result.newSeats).toBe(4);
    expect(result.seatDelta).toBe(1);

    // 1 seat * 1500 cents * 0.5 cycle remaining = 750 cents ($7.50)
    expect(result.proratedAmountCents).toBe(750);
    expect(result.immediatePaymentRequired).toBe(true);

    // Next cycle: 4 seats * 1500 cents = 6000 cents ($60.00)
    expect(result.nextCycleSeats).toBe(4);
    expect(result.nextCycleBillingAmountCents).toBe(6000);
  });

  it("calculates prorated credit when reducing seats from 5 down to 3", () => {
    const result = manager.calculateSeatAdjustment({
      currentSeats: 5,
      requestedSeats: 3,
      effectiveTimestampMs: halfWayMs,
      billingPeriod: { cycleStartMs, cycleEndMs },
    });

    expect(result.seatDelta).toBe(-2);
    // -2 seats * 1500 cents * 0.5 = -1500 cents (-$15.00 credit)
    expect(result.proratedAmountCents).toBe(-1500);
    expect(result.immediatePaymentRequired).toBe(false);
    expect(result.nextCycleBillingAmountCents).toBe(4500); // 3 * 1500
  });
});
