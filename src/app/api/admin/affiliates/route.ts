import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const codes = await db.affiliateCode.findMany({
    include: { uses: true },
    orderBy: { createdAt: "desc" },
  });

  const report = codes.map((c) => ({
    code: c.code,
    creatorName: c.creatorName,
    active: c.active,
    totalUses: c.uses.length,
    byPlan: {
      monthly: c.uses.filter((u) => u.plan === "monthly").length,
      "3month": c.uses.filter((u) => u.plan === "3month").length,
      annual: c.uses.filter((u) => u.plan === "annual").length,
    },
    totalRevenue: c.uses.reduce((sum, u) => sum + u.amount, 0),
    totalBounty: c.uses.reduce((sum, u) => sum + u.bounty, 0),
    createdAt: c.createdAt,
  }));

  return NextResponse.json(report);
}

// POST to create a new affiliate code
export async function POST(req: Request) {
  const { code, creatorName, discountPercent = 10 } = await req.json();
  if (!code || !creatorName) {
    return NextResponse.json({ error: "code and creatorName required" }, { status: 400 });
  }

  const upperCode = code.toUpperCase();

  // Create Stripe coupon + promotion code
  const coupon = await stripe.coupons.create({
    percent_off: discountPercent,
    duration: "once",
    name: `${upperCode} — ${creatorName}`,
  });

  const promoCode = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: upperCode,
    restrictions: { first_time_transaction: true },
  });

  const affiliateCode = await db.affiliateCode.create({
    data: {
      code: upperCode,
      creatorName,
      stripeCouponId: coupon.id,
      stripePromoCodeId: promoCode.id,
    },
  });

  return NextResponse.json(affiliateCode, { status: 201 });
}
