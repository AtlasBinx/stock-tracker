import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPurchaseConfirmationEmail } from "@/lib/mailer";
import type Stripe from "stripe";

const BOUNTIES: Record<string, number> = { monthly: 1.5, "3month": 3.0, annual: 6.0 };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "mandate.updated":
        // PayPal subscribers can cancel directly from their PayPal account —
        // Stripe fires mandate.updated when their payment method is revoked.
        await handleMandateUpdated(event.data.object as Stripe.Mandate);
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const { plan, name, phone, promoCode, smsConsent } = session.metadata ?? {};
  const email = session.customer_email ?? session.customer_details?.email;
  if (!email || !plan) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  const isPrepaid = plan === "3month" || plan === "annual";
  const accessExpiresAt = isPrepaid ? currentPeriodEnd : null;
  const amountPaid = (session.amount_total ?? 0) / 100;

  const subscriber = await db.subscriber.upsert({
    where: { email },
    create: {
      name,
      email,
      phone: phone || null,
      active: true,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      plan,
      planStatus: "active",
      accessExpiresAt,
      promoCode: promoCode || null,
      smsConsent: smsConsent === "true",
    },
    update: {
      name,
      phone: phone || null,
      active: true,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      plan,
      planStatus: "active",
      accessExpiresAt,
      promoCode: promoCode || null,
      smsConsent: smsConsent === "true",
    },
  });

  if (promoCode) {
    const affiliateCode = await db.affiliateCode.findUnique({ where: { code: promoCode.toUpperCase() } });
    if (affiliateCode) {
      await db.affiliateUse.create({
        data: {
          codeId: affiliateCode.id,
          subscriberId: subscriber.id,
          plan,
          amount: amountPaid,
          bounty: BOUNTIES[plan] ?? 0,
        },
      });
    }
  }

  await sendPurchaseConfirmationEmail({ name, email }, plan, amountPaid, accessExpiresAt);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.subscriber.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { active: false, planStatus: "cancelled" },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = await db.subscriber.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  if (subscription.status === "active") {
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    const isPrepaid = sub.plan === "3month" || sub.plan === "annual";
    await db.subscriber.update({
      where: { id: sub.id },
      data: {
        planStatus: "active",
        active: true,
        accessExpiresAt: isPrepaid ? currentPeriodEnd : null,
      },
    });
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    await db.subscriber.update({
      where: { id: sub.id },
      data: { active: false, planStatus: "cancelled" },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.warn("Payment failed for invoice:", invoice.id);
}

async function handleMandateUpdated(mandate: Stripe.Mandate) {
  // When a PayPal subscriber revokes their mandate from PayPal's side,
  // deactivate their access so it matches the subscription cancellation.
  if (mandate.status !== "inactive") return;

  const paymentMethod = await stripe.paymentMethods.retrieve(
    mandate.payment_method as string
  );
  if (!paymentMethod.customer) return;

  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer.id;

  await db.subscriber.updateMany({
    where: { stripeCustomerId: customerId },
    data: { active: false, planStatus: "cancelled" },
  });
}
