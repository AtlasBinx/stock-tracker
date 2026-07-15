import { NextResponse } from "next/server";
import { syncGuitarsGarden } from "@/lib/guitarsgarden";

export async function GET(req: Request) {
  // Optional secret check — set CRON_SECRET in .env to lock this endpoint
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await syncGuitarsGarden();
  return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
}
