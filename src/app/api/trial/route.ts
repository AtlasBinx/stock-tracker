import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPurchaseConfirmationEmail } from "@/lib/mailer";
import { sendSmsOptInConfirmation } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, promoCode } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    if (!phone?.trim()) {
      return NextResponse.json({ error: "A phone number is required for the free trial." }, { status: 400 });
    }

    // Free trial requires a valid active affiliate code
    if (!promoCode?.trim()) {
      return NextResponse.json({ error: "A referral code is required to start a free trial." }, { status: 403 });
    }

    const upper = promoCode.toUpperCase().trim();
    const affiliateCode = await db.affiliateCode.findUnique({ where: { code: upper } });
    if (!affiliateCode?.active) {
      return NextResponse.json({ error: "This referral code is not valid." }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // No second free trials
    const existing = await db.subscriber.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "already_exists", message: "This email has already used a free trial." },
        { status: 409 }
      );
    }

    const subscriber = await db.subscriber.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        active: true,
        plan: "trial",
        planStatus: "active",
        accessExpiresAt: null, // one-free-alert model — no time expiry
        smsConsent: true,
        promoCode: upper,
      },
    });

    // Track affiliate referral
    await db.affiliateUse.create({
      data: {
        codeId: affiliateCode.id,
        subscriberId: subscriber.id,
        plan: "trial",
        amount: 0,
        bounty: 0,
      },
    });

    await sendPurchaseConfirmationEmail(
      { name: subscriber.name, email: subscriber.email },
      "trial",
      0,
      null
    );

    await sendSmsOptInConfirmation(subscriber.phone!);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[trial] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
