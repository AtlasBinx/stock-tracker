import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  }
  return _stripe;
}

// Convenience export for use in route handlers
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PLANS = {
  "30day": {
    name: "30-Day Pass",
    price: 9.99,
    priceEnvKey: "STRIPE_PRICE_30DAY",
    billing: "30 days",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 2.5,
    tagline: "One charge for 30 days · Never auto-renews · No surprise charges",
  },
  monthly: {
    name: "Monthly",
    price: 7.99,
    priceEnvKey: "STRIPE_PRICE_MONTHLY",
    billing: "monthly",
    renews: true,
    cancelAtPeriodEnd: false,
    bounty: 2.0,
    tagline: "Billed monthly · Cancel anytime · Keeps access through paid period",
  },
  annual: {
    name: "Annual Pass",
    price: 79.99,
    priceEnvKey: "STRIPE_PRICE_ANNUAL",
    billing: "12 months",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 10.0,
    tagline: "Just $6.67/mo · Save $15.89 vs monthly · One charge, never auto-renews",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPriceId(plan: PlanKey): string {
  const key = PLANS[plan].priceEnvKey;
  const id = process.env[key];
  if (!id) throw new Error(`Missing env var: ${key}`);
  return id;
}

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://stock-tracker-seven-delta.vercel.app";
