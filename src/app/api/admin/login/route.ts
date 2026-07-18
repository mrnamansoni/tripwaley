import { NextResponse } from "next/server";
import { clearFailures, clientIp, rateLimit, recordFailure, sameOrigin, verifyPassword } from "@/lib/auth";
import { createSession, SESSION_COOKIE, SESSION_HOURS } from "@/lib/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const limit = rateLimit(ip);
  if (limit.blocked) {
    return NextResponse.json({ error: `too many attempts — try again in ${limit.retryMin} min` }, { status: 429 });
  }

  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!password || !verifyPassword(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  clearFailures(ip);
  const token = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
