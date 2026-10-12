import { NextResponse } from "next/server";
import { syncGuitarsGarden } from "@/lib/guitarsgarden";
import { db } from "@/lib/db";
import { sendExpiryReminderEmail, sendTrialExpiredEmail, sendFreeAlertFollowUpEmail, sendFreeAlertSecondFollowUpEmail } from "@/lib/mailer";

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

  const now = new Date();

  // Find expired subscribers before deactivating so we can email them
  const justExpired = await db.subscriber.findMany({
    where: {
      active: true,
      accessExpiresAt: { lt: now },
    },
    select: { id: true, name: true, email: true },
  });

  // Deactivate them
  if (justExpired.length > 0) {
    await db.subscriber.updateMany({
      where: { id: { in: justExpired.map((s) => s.id) } },
      data: { active: false, planStatus: "expired" },
    });

    // Send deactivation + conversion email to each
    for (const sub of justExpired) {
      await sendTrialExpiredEmail({ name: sub.name, email: sub.email });
    }
  }

  // Send follow-up to one-free-alert trial subscribers whose alert just fired
  const freeAlertFollowUps = await db.subscriber.findMany({
    where: {
      plan: "trial",
      freeAlertUsed: true,
      reminderSentAt: null,
    },
    select: { id: true, name: true, email: true },
  });

  for (const sub of freeAlertFollowUps) {
    await sendFreeAlertFollowUpEmail({ name: sub.name, email: sub.email });
    await db.subscriber.update({
      where: { id: sub.id },
      data: { reminderSentAt: new Date() },
    });
  }

  // Send second follow-up 4 days after the first, to trial subs who still haven't converted
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

  const secondFollowUps = await db.subscriber.findMany({
    where: {
      plan: "trial",
      freeAlertUsed: true,
      reminderSentAt: { lte: fourDaysAgo },
      secondReminderSentAt: null,
    },
    select: { id: true, name: true, email: true },
  });

  for (const sub of secondFollowUps) {
    await sendFreeAlertSecondFollowUpEmail({ name: sub.name, email: sub.email });
    await db.subscriber.update({
      where: { id: sub.id },
      data: { secondReminderSentAt: new Date() },
    });
  }

  // Send expiry reminders to subscribers whose access ends in 2–4 days (haven't been sent one yet)
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const expiring = await db.subscriber.findMany({
    where: {
      active: true,
      planStatus: { in: ["active", "cancelling"] },
      accessExpiresAt: { gte: in2Days, lte: in4Days },
      reminderSentAt: null,
    },
  });

  for (const sub of expiring) {
    await sendExpiryReminderEmail(
      { name: sub.name, email: sub.email },
      sub.plan ?? "unknown",
      sub.accessExpiresAt!
    );
    await db.subscriber.update({
      where: { id: sub.id },
      data: { reminderSentAt: now },
    });
  }

  return NextResponse.json({
    ok: true,
    ...result,
    expiredDeactivated: justExpired.length,
    freeAlertFollowUpsSent: freeAlertFollowUps.length,
    secondFollowUpsSent: secondFollowUps.length,
    expiryRemindersSent: expiring.length,
    timestamp: new Date().toISOString(),
  });
}
