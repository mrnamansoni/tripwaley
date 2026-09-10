#!/usr/bin/env node
/**
 * Derive every brand asset the site and the invoice need, from two masters.
 *
 * Run: node scripts/make-brand-assets.mjs
 *
 * Sources (commit both):
 *   public/images/tripwaley-logo.png   the horizontal wordmark
 *   public/images/tripwaley-icon.png   the round badge — SQUARE. Optional; when
 *                                      it is missing the favicons are skipped.
 *
 * WHY TWO MASTERS. The wordmark is 3.36:1. Squeezed into a 16×16 favicon it is
 * an illegible smear, and letterboxed into a square it becomes a hairline of
 * text with empty space above and below. A tab icon needs the round badge. The
 * letterhead needs the wordmark. They are not interchangeable, so neither is
 * derived from the other.
 *
 * The wordmark is also TRIMMED here rather than used raw: the supplied file
 * carries 92px of transparent padding above the artwork and 56px below, so
 * placing it directly would render the logo visibly high in its own box and
 * smaller than the dimensions ask for. Trimming to the alpha bounding box makes
 * the file's aspect ratio mean what it says.
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "public", "images");
const APP = path.join(ROOT, "src", "app");
const kb = (p) => `${(readFileSync(p).length / 1024).toFixed(1)}KB`;

/* ---------------------------------------------- the wordmark, for the invoice */

const WORDMARK = path.join(IMAGES, "tripwaley-logo.png");
if (!existsSync(WORDMARK)) {
  console.error(`No wordmark at ${path.relative(ROOT, WORDMARK)}`);
  process.exit(1);
}

const MARK = path.join(IMAGES, "tripwaley-mark.png");
const trimmed = await sharp(WORDMARK)
  // threshold 8: ignore near-transparent anti-aliasing at the artwork's edge
  .trim({ threshold: 8 })
  .png()
  .toBuffer({ resolveWithObject: true });
writeFileSync(MARK, trimmed.data);
const aspect = (trimmed.info.width / trimmed.info.height).toFixed(3);
console.log(`  ✓ tripwaley-mark.png  ${trimmed.info.width}×${trimmed.info.height}  aspect ${aspect}  ${kb(MARK)}`);
console.log(`    → set MARK_ASPECT in src/lib/invoiceDoc.tsx to ${aspect} if this changed`);

/* ------------------------------------------------- the badge, for the favicons */

const BADGE = path.join(IMAGES, "tripwaley-icon.png");
if (!existsSync(BADGE)) {
  console.log(`\n  · no square badge at ${path.relative(ROOT, BADGE)} — favicons left alone.`);
  console.log(`    Save the ROUND logo there (square canvas, 512px+) and re-run.`);
  process.exit(0);
}

const meta = await sharp(BADGE).metadata();
if (Math.abs(meta.width - meta.height) / Math.max(meta.width, meta.height) > 0.02) {
  console.error(`\n  ✗ ${path.basename(BADGE)} is ${meta.width}×${meta.height}, not square.`);
  console.error(`    A non-square source letterboxes into every icon slot. Crop it first.`);
  process.exit(1);
}

const png = (size) =>
  sharp(BADGE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

/** ICO holding PNG images — since Vista an .ico may simply contain PNG data, so
 *  this is a 6-byte header, a 16-byte entry per size, then the PNG bytes. sharp
 *  cannot write ICO, and this is less work than pulling in a library for it. */
function ico(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const dir = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 encodes 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
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

/* Next serves EVERY icon.* it finds in app/, so the hand-drawn stand-in has to
   go or the page emits two competing <link rel="icon"> tags. */
const oldSvg = path.join(APP, "icon.svg");
if (existsSync(oldSvg)) {
  rmSync(oldSvg);
  console.log("  – removed the hand-drawn icon.svg stand-in");
}

console.log(`\n  ✓ favicon.ico     16/32/48  ${kb(path.join(APP, "favicon.ico"))}`);
console.log(`  ✓ apple-icon.png  180       ${kb(path.join(APP, "apple-icon.png"))}`);
console.log(`  ✓ icon.png        512       ${kb(path.join(APP, "icon.png"))}`);
