import { NextRequest, NextResponse } from "next/server";
import { stripe, BASE_URL, PLANS, type PlanKey } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const subscriber = await db.subscriber.findUnique({ where: { email } });
  if (!subscriber) return NextResponse.json({ error: "No subscription found for this email" }, { status: 404 });

  const FRIENDLY: Record<string, string> = { trial: "Free Trial", monthly: "Monthly" };
  const planLabel = subscriber.plan
    ? (PLANS[subscriber.plan as PlanKey]?.name ?? FRIENDLY[subscriber.plan] ?? subscriber.plan)
    : null;

  return NextResponse.json({
    name: subscriber.name,
    plan: subscriber.plan,
    planLabel,
    planStatus: subscriber.planStatus,
    active: subscriber.active,
    accessExpiresAt: subscriber.accessExpiresAt,
    hasStripe: !!subscriber.stripeCustomerId,
  });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const subscriber = await db.subscriber.findUnique({ where: { email } });
  if (!subscriber?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found for this email" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscriber.stripeCustomerId,
    return_url: `${BASE_URL}/account`,
  });

  return NextResponse.json({ url: session.url });
}
