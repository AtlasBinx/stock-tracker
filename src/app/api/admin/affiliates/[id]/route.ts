import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  const { id } = await params;
  const { active } = await req.json();

  const updated = await db.affiliateCode.update({
    where: { id: Number(id) },
    data: { active },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  const { id } = await params;

  await db.affiliateCode.delete({ where: { id: Number(id) } });

  return NextResponse.json({ deleted: true });
}
