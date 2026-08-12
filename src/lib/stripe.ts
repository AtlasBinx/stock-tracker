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
    price: 2.99,
    priceEnvKey: "STRIPE_PRICE_30DAY",
    billing: "30 days",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 0.75,
    tagline: "Drop incoming? Get in now · One charge, never auto-renews",
  },
  annual: {
    name: "Annual",
    price: 14.99,
    priceEnvKey: "STRIPE_PRICE_ANNUAL",
    billing: "12 months",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 3.0,
    tagline: "Just $1.25/mo · Best value · One charge, never auto-renews",
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
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://guitarstockalert.com";
