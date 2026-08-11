import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendStockAddedEmail } from "@/lib/mailer";
import { sendStockAddedSms } from "@/lib/sms";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  try {
    const body = await req.json().catch(() => ({}));
    const { recipientEmails } = body as { recipientEmails?: string[] };

    const where = recipientEmails?.length
      ? { active: true, email: { in: recipientEmails } }
      : { active: true };

    const subscribers = await db.subscriber.findMany({ where });
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
    }

    const testProducts = ["Test Product — Fender Stratocaster (Example)", "Test Product — Gibson Les Paul (Example)"];

    await sendStockAddedEmail(
      subscribers.map((s) => ({ name: s.name, email: s.email })),
      testProducts
    );

    const smsRecipients = subscribers
      .filter((s) => s.smsConsent && s.phone)
      .map((s) => ({ name: s.name, phone: s.phone! }));

    if (smsRecipients.length > 0) {
      await sendStockAddedSms(smsRecipients, testProducts);
    }

    return NextResponse.json({ emailsSent: subscribers.length, smsSent: smsRecipients.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
