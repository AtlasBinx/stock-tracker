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
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
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

    // If switching from monthly, cancel existing subscription first
    if (cancelExisting && existing?.stripeSubscriptionId) {
      await stripe.subscriptions.update(existing.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Resolve promo code to a Stripe Promotion Code ID if provided
    let discounts: { promotion_code: string }[] | undefined;
    let allowPromoCodes = true;
    if (promoCode) {
      const codes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (codes.data.length > 0) {
        discounts = [{ promotion_code: codes.data[0].id }];
        allowPromoCodes = false;
      }
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
        promoCode: promoCode ?? "",
        smsConsent: smsConsent ? "true" : "false",
      },
      subscription_data: {
        metadata: { plan: planKey, name, phone: phone ?? "" },
        ...(planConfig.cancelAtPeriodEnd ? { cancel_at_period_end: true } : {}),
      },
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/signup`,
      ...(discounts ? { discounts } : { allow_promotion_codes: allowPromoCodes }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
