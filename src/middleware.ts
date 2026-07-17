import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED.includes(pathname)) return NextResponse.next();

  const session = req.cookies.get("admin_session")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || session !== adminPassword) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
