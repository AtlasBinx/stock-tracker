import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CreatorKit from "./CreatorKit";

export default async function CreatorPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  const affiliate = await db.affiliateCode.findUnique({
    where: { code },
    select: { code: true, creatorName: true, active: true },
  });

  if (!affiliate || !affiliate.active) notFound();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--text)" }}>
      <CreatorKit code={affiliate.code} creatorName={affiliate.creatorName} />
    </div>
  );
}
