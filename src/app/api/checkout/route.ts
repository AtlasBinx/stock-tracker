import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanKey, getPriceId, BASE_URL } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { plan, name, email, phone, promoCode, smsConsent, cancelExisting } = await req.json();

    if (!plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const planKey = plan as PlanKey;
    const planConfig = PLANS[planKey];
    const priceId = getPriceId(planKey);

    // Check for existing active subscription
    const existing = await db.subscriber.findUnique({ where: { email } });
    if (existing?.active && existing.planStatus === "active" && !cancelExisting) {
      if (existing.plan === "monthly" && planKey !== "monthly") {
        return NextResponse.json({
          conflict: "monthly",
          subscriptionId: existing.stripeSubscriptionId,
          customerId: existing.stripeCustomerId,
        }, { status: 409 });
      }
      if (existing.plan === planKey) {
        return NextResponse.json({ error: "You already have this plan active." }, { status: 400 });
      }
    }

    // If switching from monthly, cancel existing subscription first.
    // Only allowed when the existing record email matches the checkout email.
    if (cancelExisting && existing?.stripeSubscriptionId && existing.email === email) {
      await stripe.subscriptions.update(existing.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Validate promo code against our DB (tracking only — no Stripe discount applied)
    let validatedPromoCode = "";
    if (promoCode) {
      const upper = promoCode.toUpperCase();
      const found = await db.affiliateCode.findUnique({ where: { code: upper } });
      if (found?.active) validatedPromoCode = upper;
    }

    // Include PayPal if enabled in Stripe Dashboard — falls back gracefully if not
    const paymentMethodTypes: string[] = ["card"];
    if (process.env.STRIPE_ENABLE_PAYPAL === "true") {
      paymentMethodTypes.push("paypal");
    }

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "subscription",
      payment_method_types: paymentMethodTypes as ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        plan: planKey,
        name,
        phone: phone ?? "",
        promoCode: validatedPromoCode,
        smsConsent: smsConsent ? "true" : "false",
      },
      subscription_data: {
        metadata: { plan: planKey, name, phone: phone ?? "" },
      },
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/signup`,
      allow_promotion_codes: false,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
