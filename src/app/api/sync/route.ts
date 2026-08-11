import { NextRequest, NextResponse } from "next/server";
import { syncGuitarsGarden } from "@/lib/guitarsgarden";
import { isAdminRequest, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();
  const result = await syncGuitarsGarden();
  return NextResponse.json(result);
}
