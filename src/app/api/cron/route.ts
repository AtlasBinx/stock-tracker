import { NextResponse } from "next/server";
import { syncGuitarsGarden } from "@/lib/guitarsgarden";
import { db } from "@/lib/db";
import { sendExpiryReminderEmail } from "@/lib/mailer";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Sync products
  const result = await syncGuitarsGarden();

  // Send expiry reminders to subscribers whose access ends in 5–7 days
  const now = new Date();
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await db.subscriber.findMany({
    where: {
      active: true,
      planStatus: "active",
      accessExpiresAt: { gte: in5Days, lte: in7Days },
    },
  });

  for (const sub of expiring) {
    await sendExpiryReminderEmail(
      { name: sub.name, email: sub.email },
      sub.plan ?? "unknown",
      sub.accessExpiresAt!
    );
  }

  return NextResponse.json({
    ok: true,
    ...result,
    expiryRemindersSent: expiring.length,
    timestamp: new Date().toISOString(),
  });
}
