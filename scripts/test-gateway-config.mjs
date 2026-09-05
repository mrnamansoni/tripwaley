#!/usr/bin/env node
/**
 * Gateway credential resolution.
 *
 * Run: node scripts/test-gateway-config.mjs
 *
 * Two rules here are easy to get subtly wrong, and both fail dangerously:
 *
 *   • ENVIRONMENT WINS. If the admin panel could override Dokploy, then putting
 *     live keys in the environment would silently do nothing while a stale
 *     sandbox key kept taking payments — and it would look like it worked.
 *   • A BLANK SECRET MEANS "UNCHANGED". The panel can never show a stored
 *     secret, so an untouched field arrives empty. If empty meant "clear",
 *     saving the webhook username would wipe the client secret and kill
 *     payments site-wide.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// the module resolves paths from cwd at import time, so move first
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "twgw-"));
fs.mkdirSync(path.join(tmp, "data"));
process.chdir(tmp);

const SRC = "/Users/apple/Applications/tripwaley/src/lib/gatewayConfig.ts";
const { resolveGateway, writeGatewayConfig, gatewaySummary } = await import(SRC);

const FILE = path.join(tmp, "data", "gateway.json");
const clearEnv = () => {
  for (const k of ["PHONEPE_CLIENT_ID","PHONEPE_CLIENT_SECRET","PHONEPE_CLIENT_VERSION",
                   "PHONEPE_ENV","PHONEPE_WEBHOOK_USER","PHONEPE_WEBHOOK_PASS"]) delete process.env[k];
};
const reset = () => { clearEnv(); if (fs.existsSync(FILE)) fs.unlinkSync(FILE); };

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

console.log("\ngateway — nothing configured fails closed");
{
  reset();
  const g = resolveGateway();
  assert.equal(g.clientId, "");
  assert.equal(g.clientSecret, "");
  assert.equal(g.env, "sandbox", "defaults to sandbox, never production");
  assert.equal(gatewaySummary().configured, false);
  ok("no env, no file → unconfigured, and sandbox by default");
}

console.log("\ngateway — the admin panel can configure it alone");
{
  reset();
  writeGatewayConfig({ clientId: "M222TEST", clientSecret: "s3cret", clientVersion: "1",
                       env: "sandbox", webhookUser: "hookuser", webhookPass: "hookpass" });
  const g = resolveGateway();
  assert.equal(g.clientId, "M222TEST");
  assert.equal(g.clientSecret, "s3cret");
  assert.equal(g.webhookPass, "hookpass");
  assert.equal(gatewaySummary().configured, true);
  ok("saved credentials alone make the gateway configured");
}

console.log("\ngateway — ENVIRONMENT WINS over the panel");
{
  reset();
  writeGatewayConfig({ clientId: "PANEL_ID", clientSecret: "panel_secret", clientVersion: "1", env: "sandbox" });
  process.env.PHONEPE_CLIENT_ID = "ENV_ID";
  process.env.PHONEPE_CLIENT_SECRET = "env_secret";
  process.env.PHONEPE_ENV = "production";

  const g = resolveGateway();
  assert.equal(g.clientId, "ENV_ID", "env must beat the panel");
  assert.equal(g.clientSecret, "env_secret");
  assert.equal(g.env, "production", "env must beat the panel's sandbox setting");
  ok("Dokploy values override anything saved in the admin panel");

  const s = gatewaySummary();
  assert.equal(s.lockedByEnv.clientId, true);
  assert.equal(s.lockedByEnv.clientSecret, true);
  assert.equal(s.lockedByEnv.env, true);
  assert.equal(s.lockedByEnv.webhookUser, false, "unset env vars don't lock their field");
  ok("the panel is told exactly which fields the environment has taken over");
}

console.log("\ngateway — a blank secret keeps the stored one");
{
  reset();
  writeGatewayConfig({ clientId: "ID1", clientSecret: "keepme", clientVersion: "1", webhookPass: "wp" });

  // the panel re-saves with only the username touched; secret fields arrive blank
  writeGatewayConfig({ clientId: "ID1", clientVersion: "1", webhookUser: "newuser",
                       clientSecret: "", webhookPass: "" });

  const g = resolveGateway();
  assert.equal(g.clientSecret, "keepme", "an untouched secret field must not wipe the secret");
  assert.equal(g.webhookPass, "wp", "same for the webhook password");
  assert.equal(g.webhookUser, "newuser", "the field they DID edit is saved");
  ok("saving the form without retyping secrets keeps payments working");
}

console.log("\ngateway — a secret can still be cleared deliberately");
{
  reset();
  writeGatewayConfig({ clientId: "ID1", clientSecret: "gone-soon" });
  writeGatewayConfig({ clientSecret: null });
  assert.equal(resolveGateway().clientSecret, "", "explicit null clears it");
  ok("passing null clears a credential when that is actually intended");
}

console.log("\ngateway — secrets never leave the server");
{
  reset();
  writeGatewayConfig({ clientId: "ID1", clientSecret: "topsecret", clientVersion: "1",
                       webhookUser: "u", webhookPass: "pw" });
  const s = gatewaySummary();
  const json = JSON.stringify(s);
  assert.ok(!json.includes("topsecret"), "the summary must not carry the client secret");
  assert.ok(!json.includes("pw"), "nor the webhook password");
  assert.equal(s.hasSecret, true, "only whether one is set");
  assert.equal(s.hasWebhookPass, true);
  assert.equal(s.clientId, "ID1", "the client id is an identifier, not a secret — shown");
  ok("the admin summary reports presence, never values");
}

console.log("\ngateway — the file is not world-readable");
{
  reset();
  writeGatewayConfig({ clientId: "ID1", clientSecret: "s" });
  const mode = fs.statSync(FILE).mode & 0o777;
  assert.equal(mode, 0o600, `expected 0600, got ${mode.toString(8)}`);
  ok("gateway.json is written 0600");
}

console.log("\ngateway — a corrupt file fails closed, not open");
{
  reset();
  fs.writeFileSync(FILE, "{ this is not json");
  const g = resolveGateway();
  assert.equal(g.clientSecret, "", "unreadable config must not resolve to a partial credential");
  assert.equal(gatewaySummary().configured, false);
  ok("a damaged file disables payments rather than half-configuring them");
}

console.log("\ngateway — an unknown environment value can't sneak through");
{
  reset();
  writeGatewayConfig({ clientId: "ID1", clientSecret: "s", env: "staging" });
  assert.equal(resolveGateway().env, "sandbox", "an unrecognised env falls back to sandbox");
  ok("only sandbox and production are honoured; anything else means sandbox");
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${n} assertions passed.\n`);
