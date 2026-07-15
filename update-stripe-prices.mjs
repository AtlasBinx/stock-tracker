/**
 * update-stripe-prices.mjs
 * Creates new Stripe prices at the updated price points.
 * Run once: node update-stripe-prices.mjs
 * Then paste the printed price IDs into your .env and Vercel env vars.
 */
import Stripe from "stripe";
import * as dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

const prices = [
  {
    nickname: "Monthly — $4.99/mo",
    unit_amount: 499,
    currency: "usd",
    recurring: { interval: "month", interval_count: 1 },
    envKey: "STRIPE_PRICE_MONTHLY",
  },
  {
    nickname: "3-Month Pass — $13.99",
    unit_amount: 1399,
    currency: "usd",
    recurring: { interval: "month", interval_count: 3 },
    envKey: "STRIPE_PRICE_3MONTH",
  },
  {
    nickname: "Annual Pass — $49.99",
    unit_amount: 4999,
    currency: "usd",
    recurring: { interval: "year", interval_count: 1 },
    envKey: "STRIPE_PRICE_ANNUAL",
  },
];

// Find or reuse existing product
const products = await stripe.products.list({ limit: 10 });
let product = products.data.find((p) => p.name.includes("Guitars Garden"));
if (!product) {
  product = await stripe.products.create({
    name: "Guitars Garden Stock Alerts",
    description: "Email + SMS alerts when new guitars hit the store.",
  });
  console.log("Created product:", product.id);
} else {
  console.log("Reusing product:", product.id, product.name);
}

console.log("\nCreating new prices...\n");

for (const p of prices) {
  const price = await stripe.prices.create({
    product: product.id,
    nickname: p.nickname,
    unit_amount: p.unit_amount,
    currency: p.currency,
    recurring: p.recurring,
  });
  console.log(`${p.envKey}="${price.id}"   # ${p.nickname}`);
}

console.log(`
---
Copy the lines above into your .env file, replacing the old STRIPE_PRICE_* values.
Then update the same keys in your Vercel project environment variables.
Existing subscribers are unaffected — they stay on their original price IDs.
`);
