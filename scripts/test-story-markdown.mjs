#!/usr/bin/env node
/**
 * Story formatting — headings, bold, italic, links, lists and photos in a
 * story body, and the plain text that meta descriptions are cut from.
 *
 * Run: node scripts/test-story-markdown.mjs
 */

import assert from "node:assert/strict";
import { parseBlocks, parseInline, safeHref, storyPlainText, storyImages } from "../src/lib/storyMarkdown.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

console.log("\nold stories");
{
  const body = "First paragraph\nstill first.\n\nSecond paragraph.";
  assert.deepEqual(parseBlocks(body), [
    { kind: "p", inline: ["First paragraph still first."] },
    { kind: "p", inline: ["Second paragraph."] },
  ]);
  ok("plain text with blank lines renders as the same paragraphs it always did");
  assert.deepEqual(parseInline("Costs {{price spiti-valley delhi}} from Delhi"), ["Costs {{price spiti-valley delhi}} from Delhi"]);
  ok("price tokens pass through untouched for StoryBody to fill in");
  assert.deepEqual(parseInline("2 * 3 * 4 and snake_case_name"), ["2 * 3 * 4 and snake_case_name"]);
  ok("a lone star and underscores inside a word are not italics");
}

console.log("\ninline");
{
  assert.deepEqual(parseInline("a **bold** and *it* and _it2_"), [
    "a ", { kind: "b", children: ["bold"] }, " and ", { kind: "i", children: ["it"] }, " and ", { kind: "i", children: ["it2"] },
  ]);
  ok("bold and both italic forms");
  assert.deepEqual(parseInline("see [Spiti](/destinations/spiti)."), [
    "see ", { kind: "a", href: "/destinations/spiti", external: false, children: ["Spiti"] }, ".",
  ]);
  ok("an internal link");
  assert.deepEqual(parseInline("[**book** now](https://tripwaley.com/trips?x=1)"), [
    { kind: "a", href: "/trips?x=1", external: false, children: [{ kind: "b", children: ["book"] }, " now"] },
  ]);
  ok("Tripwaley's own absolute address becomes an internal link; bold inside link text");
  assert.deepEqual(parseInline("map at https://maps.google.com/x?q=1."), [
    "map at ", { kind: "a", href: "https://maps.google.com/x?q=1", external: true, children: ["maps.google.com/x?q=1"] }, ".",
  ]);
  ok("a bare address becomes a link, without its trailing full stop");
  assert.equal(parseInline("[Spiti](https://en.wikipedia.org/wiki/Spiti_(valley))")[0].href, "https://en.wikipedia.org/wiki/Spiti_(valley)");
  ok("an address with (parentheses) in it");
  assert.deepEqual(parseInline("[click](javascript:alert(1)) now"), ["click now"]);
  assert.ok(parseInline("[x](//evil.com)").every((x) => typeof x === "string"));
  ok("javascript: and protocol-relative addresses never become links");
  assert.equal(safeHref("mailto:hi@tripwaley.com")?.external, true);
  assert.equal(safeHref("#cost")?.href, "#cost");
  assert.equal(safeHref("ftp://x.com"), undefined);
  ok("mailto and anchors allowed, other schemes refused");
}

console.log("\nblocks");
{
  const body = [
    "# Big", "", "## Getting there", "Take the bus.", "### By road", "",
    "- warm jacket", "* gloves", "1. day one", "2) day two", "",
    "![Snow on Kunzum La](/uploads/kunzum.jpg)", "## Getting there",
  ].join("\n");
  const b = parseBlocks(body);
  assert.deepEqual(b.map((x) => x.kind), ["h2", "h2", "p", "h3", "ul", "ol", "img", "h2"]);
  ok("a '# ' heading is a section heading; the page keeps one h1");
  assert.equal(b[1].id, "getting-there");
  assert.equal(b[7].id, "getting-there-2");
  ok("headings get anchors, made unique");
  assert.deepEqual(b[4].items, [["warm jacket"], ["gloves"]]);
  assert.deepEqual(b[5].items, [["day one"], ["day two"]]);
  ok("bullets and numbered steps");
  assert.deepEqual(b[6], { kind: "img", src: "/uploads/kunzum.jpg", alt: "Snow on Kunzum La" });
  ok("a photo on its own line, with its alt text");
}

console.log("\nplain text");
{
  const body = "## Cost\n\nIt is **₹12,000** from [Delhi](/x).\n\n![a](/b.jpg)\n\n- one\n- two";
  assert.equal(storyPlainText(body), "Cost\n\nIt is ₹12,000 from Delhi.\n\none two");
  ok("formatting is stripped for descriptions and reading time");
  assert.deepEqual(storyImages(body), [{ src: "/b.jpg", alt: "a" }]);
  ok("body photos are listed for hosting");
}

console.log(`\n${n} checks passed\n`);
