#!/usr/bin/env node
/**
 * Generate the ADMIN_PASSWORD_HASH for production.
 * Usage: node scripts/hash-password.mjs "your-strong-password"
 */
import { randomBytes, scryptSync } from "node:crypto";

const pw = process.argv[2];
if (!pw || pw.length < 8) {
  console.error("usage: node scripts/hash-password.mjs \"password (min 8 chars)\"");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(pw, salt, 64).toString("hex");
console.log("Add to your production env:\n");
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
console.log(`SESSION_SECRET=${randomBytes(24).toString("hex")}`);
