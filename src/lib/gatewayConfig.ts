import fs from "node:fs";
import path from "node:path";

/**
 * PhonePe credentials, settable from the admin panel — SERVER ONLY.
 *
 * These live in their own file, deliberately NOT in catalog.json. The catalog
 * is handed to the browser wholesale by /api/admin/catalog, and getSettings()
 * is read by public pages (the footer, the policy pages). A gateway secret
 * sitting in settings is one careless prop-spread away from being served to
 * every visitor. Separate file, never returned by the catalog API, never sent
 * to a client component.
 *
 * Precedence: ENVIRONMENT WINS. The env vars are the production path; this
 * file is the convenience path for setting sandbox keys without a redeploy.
 * If it were the other way round, putting live keys in Dokploy would silently
 * do nothing while a stale sandbox key kept serving — the worst possible
 * failure, because it looks like it works.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "gateway.json");

export interface StoredGateway {
  clientId?: string;
  clientSecret?: string;
  clientVersion?: string;
  env?: "sandbox" | "production";
  webhookUser?: string;
  webhookPass?: string;
}

export interface ResolvedGateway {
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  env: "sandbox" | "production";
  webhookUser: string;
  webhookPass: string;
  /** which fields came from the environment rather than the admin panel */
  fromEnv: Record<keyof StoredGateway, boolean>;
}

function readStored(): StoredGateway {
  try {
    if (!fs.existsSync(FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as StoredGateway) : {};
  } catch {
    // a corrupt file must not take payments down in a way that looks like a
    // gateway outage — behave as "not configured", which fails closed
    console.error("[gateway] gateway.json unreadable — treating as unset");
    return {};
  }
}

const envOf = (k: string) => (process.env[k] ?? "").trim();

/** Environment first, stored config second. Nothing is ever logged. */
export function resolveGateway(): ResolvedGateway {
  const s = readStored();

  const pick = (envKey: string, stored: string | undefined): [string, boolean] => {
    const e = envOf(envKey);
    if (e) return [e, true];
    return [(stored ?? "").trim(), false];
  };

  const [clientId, idEnv] = pick("PHONEPE_CLIENT_ID", s.clientId);
  const [clientSecret, secEnv] = pick("PHONEPE_CLIENT_SECRET", s.clientSecret);
  const [clientVersion, verEnv] = pick("PHONEPE_CLIENT_VERSION", s.clientVersion);
  const [webhookUser, wuEnv] = pick("PHONEPE_WEBHOOK_USER", s.webhookUser);
  const [webhookPass, wpEnv] = pick("PHONEPE_WEBHOOK_PASS", s.webhookPass);

  const envMode = envOf("PHONEPE_ENV");
  const mode = envMode || s.env || "sandbox";

  return {
    clientId,
    clientSecret,
    clientVersion: clientVersion || "1",
    env: mode === "production" ? "production" : "sandbox",
    webhookUser,
    webhookPass,
    fromEnv: {
      clientId: idEnv,
      clientSecret: secEnv,
      clientVersion: verEnv,
      env: Boolean(envMode),
      webhookUser: wuEnv,
      webhookPass: wpEnv,
    },
  };
}

/**
 * What the admin panel is allowed to see.
 * Secrets are reported as booleans — set once, never read back.
 */
export interface GatewaySummary {
  clientId: string;
  clientVersion: string;
  env: "sandbox" | "production";
  webhookUser: string;
  hasSecret: boolean;
  hasWebhookPass: boolean;
  configured: boolean;
  /** true when the environment is supplying a value, which the panel can't override */
  lockedByEnv: Record<string, boolean>;
}

export function gatewaySummary(): GatewaySummary {
  const g = resolveGateway();
  return {
    clientId: g.clientId,
    clientVersion: g.clientVersion,
    env: g.env,
    webhookUser: g.webhookUser,
    hasSecret: Boolean(g.clientSecret),
    hasWebhookPass: Boolean(g.webhookPass),
    configured: Boolean(g.clientId && g.clientSecret && g.clientVersion),
    lockedByEnv: {
      clientId: g.fromEnv.clientId,
      clientSecret: g.fromEnv.clientSecret,
      clientVersion: g.fromEnv.clientVersion,
      env: g.fromEnv.env,
      webhookUser: g.fromEnv.webhookUser,
      webhookPass: g.fromEnv.webhookPass,
    },
  };
}

/**
 * Merge a patch into the stored config.
 *
 * A blank string means "leave what's there" for the two secret fields — the
 * panel can't show them, so an untouched form field arrives empty and must not
 * wipe a working credential. Passing null explicitly clears a field.
 */
export function writeGatewayConfig(patch: Record<string, unknown>): StoredGateway {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const current = readStored();
  const next: StoredGateway = { ...current };

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);

  for (const key of ["clientId", "clientVersion", "webhookUser"] as const) {
    const v = str(patch[key]);
    if (v !== undefined) next[key] = v;
  }

  // secrets: blank = unchanged, null = clear
  for (const key of ["clientSecret", "webhookPass"] as const) {
    if (patch[key] === null) delete next[key];
    else {
      const v = str(patch[key]);
      if (v) next[key] = v;
    }
  }

  if (patch.env === "production" || patch.env === "sandbox") next.env = patch.env;

  const tmp = `${FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, FILE);
  try {
    fs.chmodSync(FILE, 0o600);
  } catch {
    /* best effort — some volume drivers refuse chmod */
  }
  return next;
}
