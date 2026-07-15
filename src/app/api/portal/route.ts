import { NextRequest, NextResponse } from "next/server";
import { stripe, BASE_URL } from "@/lib/stripe";
import { db } from "@/lib/db";

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
