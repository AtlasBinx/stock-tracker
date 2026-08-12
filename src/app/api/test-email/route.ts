import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendStockAlertEmail } from "@/lib/mailer";
import { sendStockAlertSms } from "@/lib/sms";
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

    const testProducts = [
      {
        title: "Firefly FFSP Electric Guitar (Example — New)",
        url: "https://guitarsgarden.com/products/new-firefly-ffsp-electric-guitar-cobra-burst-1",
        imageUrl: "https://cdn.shopify.com/s/files/1/0633/5515/7655/files/1_d5b7e2d4-13fc-4bb1-a3b1-1c5fdf8e7c4e.jpg",
        isNew: true,
      },
      {
        title: "Firefly FFMN Electric Guitar (Example — Restock)",
        url: "https://guitarsgarden.com/products/firefly-ffmn-electric-guitar-with-flamed-maple-top-green-burst-color",
        imageUrl: "https://cdn.shopify.com/s/files/1/0633/5515/7655/files/1_b9e3c2a1-4d5e-4f6b-8c7d-2e1f3a4b5c6d.jpg",
        isNew: false,
      },
    ];

    await sendStockAlertEmail(
      subscribers.map((s) => ({ name: s.name, email: s.email })),
      testProducts
    );

    const smsRecipients = subscribers
      .filter((s) => s.smsConsent && s.phone)
      .map((s) => ({ name: s.name, phone: s.phone! }));

    if (smsRecipients.length > 0) {
      await sendStockAlertSms(smsRecipients, testProducts);
    }

    return NextResponse.json({ emailsSent: subscribers.length, smsSent: smsRecipients.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
