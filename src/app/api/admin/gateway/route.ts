import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { gatewaySummary, resolveGateway, writeGatewayConfig } from "@/lib/gatewayConfig";
import { PhonePeError } from "@/lib/phonepe";

/**
 * PhonePe credentials for the admin panel.
 *
 * Kept off /api/admin/catalog on purpose: that endpoint returns the whole
 * catalog to the browser, and a gateway secret has no business travelling with
 * it. Here the secret is WRITE-ONLY — GET reports whether one is set, never
 * what it is, so nothing can read a credential back out of the panel.
 *
 * Under /api/admin, so proxy.ts has already required an admin session.
 */

export async function GET() {
  return NextResponse.json(gatewaySummary());
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  // the client id is visible in the panel, so it can be validated normally
  const clientId = str(b.clientId);
  if (clientId && clientId.length > 200) {
    return NextResponse.json({ error: "client id looks wrong" }, { status: 422 });
  }
  const clientVersion = str(b.clientVersion);
  if (clientVersion && !/^\d{1,4}$/.test(clientVersion)) {
    return NextResponse.json({ error: "client version must be a number, e.g. 1" }, { status: 422 });
  }
  if (b.env !== undefined && b.env !== "sandbox" && b.env !== "production") {
    return NextResponse.json({ error: "environment must be sandbox or production" }, { status: 422 });
  }
  // PhonePe's own dashboard rejects these characters in webhook credentials
  for (const k of ["webhookUser", "webhookPass"] as const) {
    const v = str(b[k]);
    if (v && /[!`~]/.test(v)) {
      return NextResponse.json({ error: `${k} can't contain ! \` or ~` }, { status: 422 });
    }
  }

  writeGatewayConfig(b);
  // never log the body — it carries the secret
  console.log("[gateway] credentials updated from the admin panel");

  return NextResponse.json({ ok: true, ...gatewaySummary() });
}

/**
 * Prove the credentials actually work, by asking PhonePe for a token.
 *
 * Worth its own action: "saved" and "working" are different things, and the
 * difference usually only shows up when a customer tries to pay.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const g = resolveGateway();
  if (!g.clientId || !g.clientSecret || !g.clientVersion) {
    return NextResponse.json({ ok: false, error: "Fill in the client id, secret and version first." });
  }

  const url =
    g.env === "production"
      ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: g.clientId,
        client_version: g.clientVersion,
        client_secret: g.clientSecret,
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json?.access_token) {
      return NextResponse.json({
        ok: true,
        env: g.env,
        message: `Connected to PhonePe ${g.env}. Credentials are valid.`,
      });
    }
    return NextResponse.json({
      ok: false,
      env: g.env,
      // PhonePe's message is safe to surface; it never echoes the secret
      error: json?.message || json?.error_description || `PhonePe rejected the credentials (HTTP ${res.status}).`,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      env: g.env,
      error: e instanceof PhonePeError ? e.message : "Couldn't reach PhonePe. Check the server's internet access.",
    });
  }
}
