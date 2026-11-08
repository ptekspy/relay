import type { SubscriptionTier } from "./catalog.js";

export interface StripeSubscriptionEvent {
  id: string;
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted"
    | "invoice.payment_failed";
  data: {
    object: {
      id: string;
      customer: string;
      status: "active" | "past_due" | "canceled" | "unpaid" | "trialing";
      items?: {
        data: Array<{
          price: {
            id: string;
            product: string;
          };
          quantity: number;
        }>;
      };
    };
  };
}

export interface UserSubscriptionState {
  customerId: string;
  subscriptionId: string;
  tier: SubscriptionTier;
  seats: number;
  status: string;
}

export class StripeBillingWebhookHandler {
  public processWebhook(
    event: StripeSubscriptionEvent,
    priceToTierMap: Record<
      string,
      { tier: SubscriptionTier; minSeats?: number }
    >,
  ): UserSubscriptionState {
    const sub = event.data.object;
    const firstItem = sub.items?.data[0];
    const priceId = firstItem?.price.id ?? "";
    const mapped = priceToTierMap[priceId] ?? {
      tier: "free" as SubscriptionTier,
    };

    let effectiveTier: SubscriptionTier = mapped.tier;
    if (sub.status === "canceled" || sub.status === "unpaid") {
      effectiveTier = "free";
    }

    return {
      customerId: sub.customer,
      subscriptionId: sub.id,
      tier: effectiveTier,
      seats: firstItem?.quantity ?? 1,
      status: sub.status,
    };
  }
}
