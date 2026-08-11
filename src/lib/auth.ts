import { NextRequest } from "next/server";

export function isAdminRequest(req: NextRequest | Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookie = (req as NextRequest).cookies?.get("admin_session")?.value;
  return cookie === adminPassword;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
