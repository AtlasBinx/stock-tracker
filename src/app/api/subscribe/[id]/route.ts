import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/subscribe/:id — unsubscribe
export async function DELETE(_req: Request, { params }: Params) {
  const id = parseInt((await params).id, 10);
  await db.subscriber.update({ where: { id }, data: { active: false } });
  return new NextResponse(null, { status: 204 });
}
