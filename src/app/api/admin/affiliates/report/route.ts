import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";
import { sendAffiliateReportEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  const { periodLabel, periodDays } = await req.json();
  const days = Number(periodDays) || 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const affiliates = await db.affiliateCode.findMany({
    where: { active: true, email: { not: null } },
    include: { uses: true },
  });

  const paid = ["30day", "annual", "monthly"];
  const results: { code: string; status: "sent" | "skipped"; reason?: string }[] = [];

  await Promise.allSettled(
    affiliates.map(async (a) => {
      if (!a.email) { results.push({ code: a.code, status: "skipped", reason: "no email" }); return; }

      const uses = a.uses as { plan: string; amount: number; bounty: number; createdAt: Date }[];

      const periodUses   = uses.filter((u) => new Date(u.createdAt) >= since);
      const periodTrials = periodUses.filter((u) => u.plan === "trial").length;
      const periodPaid   = periodUses.filter((u) => paid.includes(u.plan));

      const allTimePaid  = uses.filter((u) => paid.includes(u.plan));
      const activeTrials = uses.filter((u) => u.plan === "trial").length;

      await sendAffiliateReportEmail({
        creatorName:       a.creatorName,
        email:             a.email,
        code:              a.code,
        periodLabel:       periodLabel ?? `Last ${days} Days`,
        periodTrials,
        periodConversions: periodPaid.length,
        periodBounty:      periodPaid.reduce((s, u) => s + u.bounty, 0),
        allTimeConversions: allTimePaid.length,
        allTimeBounty:     allTimePaid.reduce((s, u) => s + u.bounty, 0),
        activeTrials,
      });

      results.push({ code: a.code, status: "sent" });
    })
  );

  return NextResponse.json({ sent: results.filter((r) => r.status === "sent").length, results });
}
