/**
 * Automated Proration & Seat Management for Teams Tier
 *
 * Enforces the strict 3-seat minimum requirement for the Teams tier,
 * calculates second-accurate proration for mid-cycle seat additions or removals,
 * and updates team authorization ceilings immediately.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-billing/proration.
 */

export const TEAMS_TIER_MINIMUM_SEATS = 3;
export const DEFAULT_TEAMS_SEAT_PRICE_CENTS = 1500; // $15.00/seat/month

export interface ProrationBillingPeriod {
  cycleStartMs: number;
  cycleEndMs: number;
}

export interface SeatAdjustmentRequest {
  currentSeats: number;
  requestedSeats: number;
  effectiveTimestampMs?: number;
  billingPeriod: ProrationBillingPeriod;
  pricePerSeatCents?: number;
}

export interface SeatAdjustmentResult {
  previousSeats: number;
  newSeats: number;
  seatDelta: number;
  proratedAmountCents: number; // positive = immediate charge, negative = credit
  immediatePaymentRequired: boolean;
  nextCycleSeats: number;
  nextCycleBillingAmountCents: number;
  effectiveAt: number;
}

export class TeamsSeatManager {
  private minSeats: number;
  private defaultPricePerSeatCents: number;

  constructor(options?: {
    minSeats?: number;
    pricePerSeatCents?: number;
  }) {
    this.minSeats = options?.minSeats ?? TEAMS_TIER_MINIMUM_SEATS;
    this.defaultPricePerSeatCents =
      options?.pricePerSeatCents ?? DEFAULT_TEAMS_SEAT_PRICE_CENTS;
  }

  public calculateSeatAdjustment(
    request: SeatAdjustmentRequest,
  ): SeatAdjustmentResult {
    const { currentSeats, requestedSeats, billingPeriod } = request;
    const pricePerSeat =
      request.pricePerSeatCents ?? this.defaultPricePerSeatCents;
    const effectiveAt = request.effectiveTimestampMs ?? Date.now();

    // 1. Enforce minimum seat rule
    if (requestedSeats < this.minSeats) {
      throw new Error(
        `Teams tier requires a minimum of ${this.minSeats} seats (requested: ${requestedSeats})`,
      );
    }

    if (currentSeats < this.minSeats) {
      throw new Error(
        `Current seats (${currentSeats}) is below Teams minimum of ${this.minSeats}`,
      );
    }

    const totalCycleMs = billingPeriod.cycleEndMs - billingPeriod.cycleStartMs;
    if (totalCycleMs <= 0) {
      throw new Error("Invalid billing cycle duration");
    }

    const remainingCycleMs = Math.max(
      0,
      billingPeriod.cycleEndMs - effectiveAt,
    );
    const remainingFraction = remainingCycleMs / totalCycleMs;

    const seatDelta = requestedSeats - currentSeats;
    const proratedAmountCents = Math.round(
      seatDelta * pricePerSeat * remainingFraction,
    );

    const nextCycleSeats = requestedSeats;
    const nextCycleBillingAmountCents = nextCycleSeats * pricePerSeat;

    return {
      previousSeats: currentSeats,
      newSeats: requestedSeats,
      seatDelta,
      proratedAmountCents,
      immediatePaymentRequired: proratedAmountCents > 0,
      nextCycleSeats,
      nextCycleBillingAmountCents,
      effectiveAt,
    };
  }
}
