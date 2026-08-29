/**
 * Route guard for the admin surface. Every /admin page and /api/admin
 * endpoint (except login itself) requires a valid signed session cookie —
 * verified here at the edge, before any render or handler runs.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // /lab and /lab2 are unreleased design sandboxes — ~850KB of concepts that
  // were publicly reachable by anyone guessing the URL. noindex kept them out
  // of search but did nothing about direct access.
  const isLab = pathname === "/lab" || pathname === "/lab2" ||
    pathname.startsWith("/lab/") || pathname.startsWith("/lab2/");

  const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  // an unauthenticated visitor should not learn the labs exist
  if (isLab) return new NextResponse("Not found", { status: 404 });

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/lab", "/lab/:path*", "/lab2", "/lab2/:path*"],
};
