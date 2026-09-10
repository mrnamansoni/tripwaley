#!/usr/bin/env node
/**
 * Vendor the brand typefaces as static .ttf for the invoice PDF.
 *
 * Run: node scripts/pull-invoice-fonts.mjs
 * Needs: python3 with fonttools (the script builds a throwaway venv itself).
 *
 * WHY THIS IS NOT A TWO-LINE DOWNLOAD.
 *
 * The site loads Bricolage Grotesque and Instrument Sans through
 * next/font/google, which emits woff2 into .next/static — a build artefact, at
 * a hashed path, in a format @react-pdf/renderer cannot read. So the PDF needs
 * its own copies, committed at a stable path. Same reasoning as pulling the
 * Drive images local: a document handed to a paying customer should not depend
 * on a third party being reachable at the moment it is generated.
 *
 * Getting TrueType out of Google Fonts no longer works, though:
 *   - the css2 endpoint serves woff2 only, whatever user agent asks;
 *   - the legacy css endpoint returns a subsetted blob that is not a usable
 *     TrueType file, and collapses every requested weight into one;
 *   - and upstream in google/fonts BOTH families now ship ONLY as variable
 *     fonts. @react-pdf/renderer has no variable-font support — register one
 *     and every weight renders at the axis default, so the invoice would come
 *     out entirely in Bricolage 800 and Instrument 400.
 *
 * Hence: download the variable source, then pin every axis with fonttools to
 * produce genuine static instances. Bricolage's optical-size axis is pinned at
 * 24 — the font defaults to 96, which is display sizing and looks coarse at the
 * 9–20pt an invoice actually uses.
 *
 * Idempotent: an instance already on disk is left alone.
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "fonts");
const WORK = path.join(tmpdir(), "tripwaley-fonts");
const RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl";

const SOURCES = [
  {
    name: "InstrumentSans",
    url: `${RAW}/instrumentsans/InstrumentSans%5Bwdth,wght%5D.ttf`,
    /** axes pinned per instance — every axis must be pinned or it stays variable */
    instances: [
      { weight: 400, axes: ["wdth=100", "wght=400"] },
      { weight: 600, axes: ["wdth=100", "wght=600"] },
    ],
  },
  {
    name: "BricolageGrotesque",
    url: `${RAW}/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf`,
    instances: [
      { weight: 700, axes: ["opsz=24", "wdth=100", "wght=700"] },
      { weight: 800, axes: ["opsz=24", "wdth=100", "wght=800"] },
    ],
  },
];

const missing = SOURCES.flatMap((s) =>
  s.instances.filter((i) => !existsSync(path.join(OUT, `${s.name}-${i.weight}.ttf`)))
);
if (missing.length === 0) {
  console.log("all four static instances already present — nothing to do");
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(WORK, { recursive: true });

// a venv rather than a global install: this is a one-off build step and has no
// business changing the machine's Python
const venv = path.join(WORK, "venv");
if (!existsSync(path.join(venv, "bin", "fonttools"))) {
  console.log("building a throwaway venv for fonttools…");
  execFileSync("python3", ["-m", "venv", venv], { stdio: "inherit" });
  execFileSync(path.join(venv, "bin", "pip"), ["install", "--quiet", "fonttools"], { stdio: "inherit" });
}

for (const src of SOURCES) {
  const varPath = path.join(WORK, `${src.name}-var.ttf`);
  if (!existsSync(varPath)) {
    const buf = Buffer.from(await (await fetch(src.url)).arrayBuffer());
    // 0x00010000 is the TrueType magic; anything else means we fetched a page
    if (buf.readUInt32BE(0) !== 0x00010000) throw new Error(`${src.name}: not a TrueType file`);
    writeFileSync(varPath, buf);
    console.log(`  ↓ ${src.name} variable source  ${(buf.length / 1024).toFixed(0)}KB`);
  }

  for (const inst of src.instances) {
    const dest = path.join(OUT, `${src.name}-${inst.weight}.ttf`);
    if (existsSync(dest)) { console.log(`  · ${path.basename(dest)} already here`); continue; }
    execFileSync(
      path.join(venv, "bin", "fonttools"),
      ["varLib.instancer", varPath, ...inst.axes, "-o", dest],
      { stdio: "ignore" }
    );
    console.log(`  ✓ ${path.basename(dest)}`);
  }
}

rmSync(path.join(WORK, "venv"), { recursive: true, force: true });
console.log("\nfonts are in public/fonts — commit them; they are inputs, not build output");
