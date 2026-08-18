#!/usr/bin/env node
/**
 * One-off: recompress photos already sitting in public/uploads.
 *
 * Uploads made before compression landed are stored at full phone resolution.
 * This applies the SAME treatment the upload route now does — max 2560px,
 * format preserved, PNG lossless — to files that predate it.
 *
 * Safety rules, because this rewrites live files on a Docker volume:
 *   • filenames never change, so every catalog reference keeps working
 *   • format never changes, so replace-in-place stays valid
 *   • a file is only replaced when the result is genuinely SMALLER
 *   • videos are skipped entirely (no re-encoding without ffmpeg)
 *   • writes are atomic (tmp + rename), so a crash can't truncate a live file
 *
 * Usage:
 *   node scripts/compress-existing-uploads.mjs           # dry run, reports only
 *   node scripts/compress-existing-uploads.mjs --apply   # actually rewrite
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE = /\.(jpe?g|png|webp)$/i;

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function compress(buf, ext) {
  const img = sharp(buf, { limitInputPixels: 268402689 }).rotate();
  const resized = img.resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true });
  if (/^jpe?g$/i.test(ext)) return resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  if (/^webp$/i.test(ext)) return resized.webp({ quality: 82 }).toBuffer();
  return resized.png({ compressionLevel: 9 }).toBuffer(); // lossless — keeps cutout alpha clean
}

if (!fs.existsSync(DIR)) {
  console.error(`no uploads directory at ${DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter((f) => IMAGE.test(f));
let before = 0;
let after = 0;
let changed = 0;
let skipped = 0;

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${files.length} image(s) in ${DIR}\n`);

for (const name of files) {
  const abs = path.join(DIR, name);
  const src = fs.readFileSync(abs);
  const ext = path.extname(name).slice(1);
  before += src.length;

  let out;
  try {
    out = await compress(src, ext);
  } catch (e) {
    console.log(`  SKIP  ${name} — ${e instanceof Error ? e.message : e}`);
    after += src.length;
    skipped++;
    continue;
  }

  // never make a file bigger; some already-optimised sources will grow
  if (out.length >= src.length) {
    console.log(`  keep  ${name.padEnd(52)} ${kb(src.length).padStart(9)} (already small enough)`);
    after += src.length;
    skipped++;
    continue;
  }

  const pct = Math.round((1 - out.length / src.length) * 100);
  console.log(`  ${APPLY ? "wrote" : "would"} ${name.padEnd(52)} ${kb(src.length).padStart(9)} → ${kb(out.length).padStart(9)}  −${pct}%`);

  if (APPLY) {
    const tmp = `${abs}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, out);
    fs.renameSync(tmp, abs); // atomic swap
  }
  after += out.length;
  changed++;
}

console.log(
  `\n${changed} file(s) ${APPLY ? "rewritten" : "would shrink"}, ${skipped} left as-is` +
    `\ntotal ${kb(before)} → ${kb(after)}  (−${Math.round((1 - after / before) * 100)}%)` +
    (APPLY ? "" : "\n\nre-run with --apply to write the changes")
);
