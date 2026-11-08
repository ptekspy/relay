export type Currency = "usd" | "gbp" | "eur";
export type BillingInterval = "month" | "year";
export type SubscriptionTier = "free" | "solo" | "teams" | "enterprise";

export interface PlanPrice {
  currency: Currency;
  unitAmount: number; // In smallest currency unit (e.g. cents, pence)
  interval: BillingInterval;
  stripePriceId?: string;
}

export interface ProductPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  minSeats: number;
  maxSeats?: number;
  features: string[];
  prices: PlanPrice[];
}

export const RELAY_PRODUCT_CATALOG: Record<SubscriptionTier, ProductPlan> = {
  free: {
    tier: "free",
    name: "Relay Local (Free Forever)",
    description: "Direct local network pairing for individual web developers",
    minSeats: 1,
    maxSeats: 1,
    features: [
      "Direct LAN WiFi/Ethernet pairing",
      "Unlimited local pairing sessions",
      "Real-time DOM and console mirroring",
      "Local firewall and network preflight",
    ],
    prices: [],
  },
  solo: {
    tier: "solo",
    name: "Relay Pro (Solo)",
    description: "Cloud tunneling and session links for independent developers",
    minSeats: 1,
    maxSeats: 1,
    features: [
      "Everything in Local",
      "Secure edge remote tunneling (WSS)",
      "Persistent subdomains (*.relay.paddy.systems)",
      "Up to 2 concurrent remote sessions",
      "7-day session recording retention",
    ],
    prices: [
      {
        currency: "usd",
        unitAmount: 1200,
        interval: "month",
        stripePriceId: "price_solo_usd_monthly",
      },
      {
        currency: "gbp",
        unitAmount: 1000,
        interval: "month",
        stripePriceId: "price_solo_gbp_monthly",
      },
      {
        currency: "eur",
        unitAmount: 1100,
        interval: "month",
        stripePriceId: "price_solo_eur_monthly",
      },
      {
        currency: "usd",
        unitAmount: 12000,
        interval: "year",
        stripePriceId: "price_solo_usd_annual",
      },
      {
        currency: "gbp",
        unitAmount: 10000,
        interval: "year",
        stripePriceId: "price_solo_gbp_annual",
      },
      {
        currency: "eur",
        unitAmount: 11000,
        interval: "year",
        stripePriceId: "price_solo_eur_annual",
      },
    ],
  },
  teams: {
    tier: "teams",
    name: "Relay Teams",
    description:
      "Collaborative device testing, multi-user sessions, and team RBAC",
    minSeats: 3,
    features: [
      "Everything in Pro Solo",
      "Centralized team management & seat billing",
      "Multi-receiver shared live sessions",
      "30-day session recording retention",
      "Custom audit logging and webhooks",
    ],
    prices: [
      {
        currency: "usd",
        unitAmount: 2900,
        interval: "month",
        stripePriceId: "price_teams_usd_monthly",
      },
      {
        currency: "gbp",
        unitAmount: 2400,
        interval: "month",
        stripePriceId: "price_teams_gbp_monthly",
      },
      {
        currency: "eur",
        unitAmount: 2700,
        interval: "month",
        stripePriceId: "price_teams_eur_monthly",
      },
      {
        currency: "usd",
        unitAmount: 29000,
        interval: "year",
        stripePriceId: "price_teams_usd_annual",
      },
      {
        currency: "gbp",
        unitAmount: 24000,
        interval: "year",
        stripePriceId: "price_teams_gbp_annual",
      },
      {
        currency: "eur",
        unitAmount: 27000,
        interval: "year",
        stripePriceId: "price_teams_eur_annual",
      },
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Relay Enterprise",
    description: "Dedicated edge clusters, SAML/SSO, and SLA guarantees",
    minSeats: 20,
    features: [
      "Everything in Teams",
      "Dedicated regional edge nodes",
      "SAML 2.0 / Okta / Azure AD SSO",
      "90-day recording retention & export to S3",
      "Custom MSA and 99.9% uptime SLA",
    ],
    prices: [],
  },
};
