import { NextResponse } from "next/server";
import { syncGuitarsGarden } from "@/lib/guitarsgarden";

// POST /api/sync — trigger a manual sync
export async function POST() {
  const result = await syncGuitarsGarden();
  return NextResponse.json(result);
}
