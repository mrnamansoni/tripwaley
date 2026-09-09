#!/usr/bin/env node
/**
 * Re-pull the transparent PNGs that an earlier version of pull-drive-images.mjs
 * flattened onto an opaque background by running `sips -s format jpeg` over
 * every file. Those 13 are the creator cutout portraits — the visual device the
 * whole creator page is built around — so losing their alpha channel replaced
 * each cutout with an ordinary rectangular photo.
 *
 * Targeted by id rather than by crawling, because the site now serves the local
 * copies for everything already migrated: the Drive URLs are no longer in the
 * HTML to be discovered.
 *
 * Run: node scripts/repull-png-cutouts.mjs
 */

import { writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "images", "library");
const MANIFEST = path.join(ROOT, "src", "data", "driveImages.json");
const MAX_EDGE = 1600;

const PNG_IDS = [
  "1W_Eu6mGDAspQxOUOFSpRS5A83KhZBxW-", "1M6F2bnyrcHJIemnL_nhbDL_3hdQGSQsx",
  "1iY--g7H8T6g73uyVRr16vhIGMrNaLHD-", "1wkvhbFRUcvSd3LjmDc1XVMEVuyH3CM0a",
  "1QGdk5JKy0-OZ968reYDaJn5KDXPNuCuJ", "1Wi24vyaWSnCHwD0V-YWVGDTAz5XsSwch",
  "1zmzPqXaOlm4hWaVykbZBk1DQm-yhc3Wo", "1Vknk1WKLsWjLeoCJUdEutTFI0TsJ5wwL",
  "1jZQbK5hU8I03Cfo4NqBu-MyZpxgJNqla", "1DtouNrew77pFnQazxf0660L87S539jIx",
  "15_mQpmgfXP0oO387ik6zQRHGJDjHHUND", "1qTprFkof3h8xnDhEnTHChoS2pUhhy276",
  "16JGWYE9ZACgrkbXowihi6GbZtgOg8YRD",
];

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
let ok = 0;
const failed = [];

for (const id of PNG_IDS) {
  const abs = path.join(OUT_DIR, `${id}.png`);
  // a flattened .jpg from the bad run must not linger — it would win the
  // extension lookup and keep serving the opaque version
  rmSync(path.join(OUT_DIR, `${id}.jpg`), { force: true });

  try {
    const res = await fetch(`https://lh3.googleusercontent.com/d/${id}`, { redirect: "follow" });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || type !== "image/png") { failed.push([id, `${res.status} ${type}`]); continue; }

    const before = Buffer.from(await res.arrayBuffer());
    writeFileSync(abs, before);

    // resize only — no format conversion, so the alpha channel survives
    try { execFileSync("sips", ["-Z", String(MAX_EDGE), abs, "--out", abs], { stdio: "ignore" }); } catch {}

    const after = readFileSync(abs);
    manifest[id] = `/images/library/${id}.png`;
    ok++;
    console.log(`  ✓ ${id}  ${(before.length / 1024).toFixed(0)}KB → ${(after.length / 1024).toFixed(0)}KB`);
  } catch (e) {
    failed.push([id, e.message]);
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
console.log(`\nrestored ${ok}/${PNG_IDS.length} PNGs, manifest has ${Object.keys(manifest).length} entries`);
if (failed.length) { console.log("FAILED:"); for (const [id, why] of failed) console.log(`  ${id}  ${why}`); }
