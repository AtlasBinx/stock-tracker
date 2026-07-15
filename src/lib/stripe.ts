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
  monthly: {
    name: "Monthly",
    price: 2.99,
    priceEnvKey: "STRIPE_PRICE_MONTHLY",
    billing: "monthly",
    renews: true,
    cancelAtPeriodEnd: false,
    bounty: 1.5,
    tagline: "Billed monthly · Cancel anytime · Keeps access through paid period",
  },
  "3month": {
    name: "3-Month Pass",
    price: 7.99,
    priceEnvKey: "STRIPE_PRICE_3MONTH",
    billing: "3 months",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 3.0,
    tagline: "One charge for 3 months · Never auto-renews · No surprise charges",
  },
  annual: {
    name: "Annual Pass",
    price: 24.99,
    priceEnvKey: "STRIPE_PRICE_ANNUAL",
    billing: "12 months",
    renews: false,
    cancelAtPeriodEnd: true,
    bounty: 6.0,
    tagline: "One charge for 12 months · Never auto-renews · No surprise charges",
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
