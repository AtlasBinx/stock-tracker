/**
 * Run once to create Stripe products and prices.
 * Usage: node setup-stripe.mjs
 * Outputs the price IDs to add to your .env file.
 */
import Stripe from "stripe";
import { readFileSync } from "fs";

// Read STRIPE_SECRET_KEY from .env manually
const envContent = readFileSync(".env", "utf-8");
const match = envContent.match(/STRIPE_SECRET_KEY\s*=\s*"?([^"\n]+)"?/);
if (!match) {
  console.error("STRIPE_SECRET_KEY not found in .env");
  process.exit(1);
}

const stripe = new Stripe(match[1].trim(), { apiVersion: "2024-11-20.acacia" });

async function main() {
  console.log("Creating Stripe products and prices...\n");

  // Monthly product
  const monthly = await stripe.products.create({ name: "Guitars Garden Alerts — Monthly" });
  const monthlyPrice = await stripe.prices.create({
    product: monthly.id,
    unit_amount: 299,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Monthly $2.99",
  });

  // 3-Month Pass product
  const threeMonth = await stripe.products.create({ name: "Guitars Garden Alerts — 3-Month Pass" });
  const threeMonthPrice = await stripe.prices.create({
    product: threeMonth.id,
    unit_amount: 799,
    currency: "usd",
    recurring: { interval: "month", interval_count: 3 },
    nickname: "3-Month Pass $7.99",
  });

  // Annual Pass product
  const annual = await stripe.products.create({ name: "Guitars Garden Alerts — Annual Pass" });
  const annualPrice = await stripe.prices.create({
    product: annual.id,
    unit_amount: 2499,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Annual Pass $24.99",
  });

  console.log("✓ Products and prices created!\n");
  console.log("Add these to your .env file:\n");
  console.log(`STRIPE_PRICE_MONTHLY="${monthlyPrice.id}"`);
  console.log(`STRIPE_PRICE_3MONTH="${threeMonthPrice.id}"`);
  console.log(`STRIPE_PRICE_ANNUAL="${annualPrice.id}"`);
  console.log("\nAlso add these Vercel env vars (vercel env add ...)");
  console.log(`STRIPE_PRICE_MONTHLY → ${monthlyPrice.id}`);
  console.log(`STRIPE_PRICE_3MONTH  → ${threeMonthPrice.id}`);
  console.log(`STRIPE_PRICE_ANNUAL  → ${annualPrice.id}`);
  console.log("\nThen enable the Stripe Customer Portal at:");
  console.log("  https://dashboard.stripe.com/test/settings/billing/portal");
}

main().catch(console.error);
