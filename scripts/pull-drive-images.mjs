#!/usr/bin/env node
/**
 * Pull every Google-Drive-hosted image onto our own domain.
 *
 * Run: node scripts/pull-drive-images.mjs
 *
 * WHY. A live crawl found 194 distinct images served from
 * lh3.googleusercontent.com and drive.google.com. On the homepage alone eight
 * of them accounted for 2,843KB of a 2,924KB payload — 97% of the page weight —
 * because a third-party URL cannot go through next/image. They arrive at full
 * original resolution: one is displayed at 42x304 and downloaded at 1116x1600.
 *
 * Cloudflare cannot help with any of it, because those bytes never touch our
 * domain. Neither can the AVIF pipeline, the resize pipeline, or the cache
 * headers. Pulling the files local is the only thing that puts them back under
 * our control — and it also removes the standing risk that a Drive link is
 * revoked, rate-limited or re-shared and the site quietly loses its photos.
 *
 * Sources are downscaled to 1600px on the long edge before being committed.
 * next/image resizes per request from whatever we ship, so a 4000px original
 * would only bloat the Docker image without ever being served at that size.
 *
 * FORMAT IS PRESERVED, NEVER FORCED. An earlier version of this script ran
 * `sips -s format jpeg` over everything, which silently flattened 13 transparent
 * PNGs — the creator cutout portraits — onto an opaque background. They are the
 * whole visual device of the creator pages. A cutout is a PNG *because* of its
 * alpha channel, so the format a file arrives in is the format it keeps.
 *
 * Idempotent: an image already downloaded is skipped, so this can be re-run
 * after new photos are added in the admin.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "images", "library");
const MANIFEST = path.join(ROOT, "src", "data", "driveImages.json");
const SITE = "https://tripwaley.com";
const MAX_EDGE = 1600;

/** content-type → the extension we store it under, alpha-preserving */
const EXT_FOR = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/jpg": "jpg" };

const driveId = (url) =>
  url.match(/\/d\/([A-Za-z0-9_-]{20,})/)?.[1] ?? url.match(/[?&]id=([A-Za-z0-9_-]{20,})/)?.[1] ?? null;

/** every Drive image referenced by the live site, found by crawling the sitemap */
async function collectFromSite() {
  const sm = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const ids = new Set();
  for (const u of urls) {
    const html = await (await fetch(u)).text();
    for (const m of html.matchAll(/https:\/\/(?:lh3\.googleusercontent\.com|drive\.google\.com)\/[^"'\\\s)]+/g)) {
      const id = driveId(m[0].replace(/&amp;/g, "&"));
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

/** and any that exist only in the local catalogs (drafts, unpublished rows) */
function collectFromCatalogs() {
  const ids = new Set();
  for (const p of [path.join(ROOT, "src/data/catalog.json"), path.join(ROOT, "data/catalog.json")]) {
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, "utf8").matchAll(/https:\/\/(?:lh3\.googleusercontent\.com|drive\.google\.com)\/[^"'\\\s)]+/g)) {
      const id = driveId(m[0]);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

  const ids = [...new Set([...(await collectFromSite()), ...collectFromCatalogs()])];
  console.log(`${ids.length} distinct Drive images referenced\n`);

  let pulled = 0, skipped = 0, saved = 0;
  const failed = [];

  for (const id of ids) {
    // an already-pulled id may be stored under any extension
    const existing = ["jpg", "png", "webp"].find((e) => existsSync(path.join(OUT_DIR, `${id}.${e}`)));
    if (existing) { manifest[id] = `/images/library/${id}.${existing}`; skipped++; continue; }

    try {
      // the /d/<id> form serves the file itself; /file/d/<id>/view serves an HTML page
      const res = await fetch(`https://lh3.googleusercontent.com/d/${id}`, { redirect: "follow" });
      if (!res.ok) { failed.push([id, `HTTP ${res.status}`]); continue; }
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      if (!type.startsWith("image/")) { failed.push([id, `not an image (${type.slice(0, 40)})`]); continue; }

      const ext = EXT_FOR[type] ?? "jpg";
      const rel = `/images/library/${id}.${ext}`;
      const abs = path.join(OUT_DIR, `${id}.${ext}`);

      const before = Buffer.from(await res.arrayBuffer());
      writeFileSync(abs, before);

      /* Downscale only. NO `-s format`: converting a PNG to JPEG discards its
         alpha channel, and the creator cutouts depend on it. */
      try {
        const args = ["-Z", String(MAX_EDGE)];
        // re-encoding a JPEG is what shrinks it; a PNG is left to its own encoder
        if (ext === "jpg") args.push("-s", "formatOptions", "normal");
        execFileSync("sips", [...args, abs, "--out", abs], { stdio: "ignore" });
      } catch { /* keep the original bytes if sips can't read this one */ }

      const after = readFileSync(abs);
      saved += before.length - after.length;
      pulled++;
      manifest[id] = rel;
      console.log(`  ✓ ${id}  ${(before.length / 1024).toFixed(0)}KB → ${(after.length / 1024).toFixed(0)}KB`);
    } catch (e) {
      failed.push([id, e.message]);
    }
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");

  console.log(`\npulled ${pulled}, already had ${skipped}, failed ${failed.length}`);
  console.log(`bytes saved by downscaling: ${(saved / 1024 / 1024).toFixed(1)}MB`);
  console.log(`manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} entries)`);
  if (failed.length) {
    console.log(`\nNOT PULLED — these stay on Drive and keep costing what they cost:`);
    for (const [id, why] of failed) console.log(`  ${id}  ${why}`);
  }
}

main();
