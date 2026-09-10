#!/usr/bin/env node
/**
 * Generate every favicon and app icon from the one brand logo.
 *
 * Run: node scripts/make-icons.mjs
 * Source: public/images/tripwaley-logo.png  (the master — commit it)
 *
 * Replaces a set of hand-drawn SVG approximations of the logo with the real
 * artwork. Generated from a single source so the tab icon, the iOS home-screen
 * icon and the PDF watermark can never drift apart.
 *
 * sharp handles the PNGs. The .ico is assembled here because sharp cannot write
 * ICO — which is less work than it sounds: since Vista an .ico may simply
 * CONTAIN PNG data, so the file is a 6-byte header, one 16-byte directory entry
 * per size, and the PNG bytes appended. No BMP encoding involved.
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public", "images", "tripwaley-logo.png");
const APP = path.join(ROOT, "src", "app");

if (!existsSync(SRC)) {
  console.error(`No logo at ${path.relative(ROOT, SRC)} — save the brand logo there first.`);
  process.exit(1);
}

/** a square PNG of the given edge, transparent where the artwork is */
const png = (size) =>
  sharp(SRC).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

/** ICO container holding PNG images — the modern, simple form of the format */
function ico(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // 1 = icon
  head.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const dir = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([head, ...dir, ...images.map((i) => i.data)]);
}

const [i16, i32, i48, i180, i512] = await Promise.all([16, 32, 48, 180, 512].map(png));

writeFileSync(path.join(APP, "favicon.ico"), ico([
  { size: 16, data: i16 },
  { size: 32, data: i32 },
  { size: 48, data: i48 },
]));
writeFileSync(path.join(APP, "apple-icon.png"), i180);
writeFileSync(path.join(APP, "icon.png"), i512);

/* The hand-drawn stand-in has to go: Next serves EVERY icon.* it finds in
   app/, so leaving it would emit two competing <link rel="icon"> tags. */
const oldSvg = path.join(APP, "icon.svg");
if (existsSync(oldSvg)) {
  rmSync(oldSvg);
  console.log("  – removed the old hand-drawn icon.svg");
}

const kb = (p) => `${(readFileSync(p).length / 1024).toFixed(1)}KB`;
console.log(`  ✓ favicon.ico    16/32/48  ${kb(path.join(APP, "favicon.ico"))}`);
console.log(`  ✓ apple-icon.png 180       ${kb(path.join(APP, "apple-icon.png"))}`);
console.log(`  ✓ icon.png       512       ${kb(path.join(APP, "icon.png"))}`);
