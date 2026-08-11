import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  const id = parseInt((await params).id, 10);
  await db.subscriber.update({ where: { id }, data: { active: false } });
  return new NextResponse(null, { status: 204 });
}
