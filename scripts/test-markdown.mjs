#!/usr/bin/env node
/**
 * Content negotiation: who gets markdown, and — far more importantly — who doesn't.
 *
 * Run: node scripts/test-markdown.mjs
 *
 * The failure this file exists to prevent is not subtle, it is catastrophic and
 * it returns HTTP 200. Every browser sends an Accept header ending in a `* / *`
 * wildcard. If that wildcard were ever treated as "markdown is acceptable",
 * every human visitor would be served raw markdown instead of the website, with
 * no error anywhere to notice it by. `text/markdown` must be named explicitly.
 */

import assert from "node:assert/strict";
import { wantsMarkdown, hasMarkdown, MARKDOWN_SECTIONS } from "../src/lib/markdownRoutes.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

/* the real header Chrome, Safari and Firefox send for a page navigation */
const CHROME = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";
const SAFARI = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const CURL = "*/*";

console.log("\nmarkdown — a browser must NEVER be given markdown");
{
  for (const [name, accept] of [["Chrome", CHROME], ["Safari", SAFARI], ["curl", CURL]]) {
    assert.equal(wantsMarkdown("GET", accept, "/trips/spiti-solo-circuit"), false,
      `${name}'s Accept header must not trigger markdown`);
  }
  ok("Chrome, Safari and a bare */* all still get HTML");

  assert.equal(wantsMarkdown("GET", null, "/"), false, "no Accept header at all is not a markdown request");
  assert.equal(wantsMarkdown("GET", "", "/"), false);
  ok("a missing or empty Accept header gets HTML");
}

console.log("\nmarkdown — an agent that asks for it, gets it");
{
  assert.equal(wantsMarkdown("GET", "text/markdown", "/trips/spiti-solo-circuit"), true);
  assert.equal(wantsMarkdown("GET", "text/markdown, text/html;q=0.9", "/destinations/spiti"), true);
  assert.equal(wantsMarkdown("GET", "TEXT/MARKDOWN", "/from/delhi"), true, "media types are case-insensitive");
  ok("an explicit text/markdown is honoured, in any case and alongside other types");
}

console.log("\nmarkdown — near-misses must not match");
{
  // substring collisions: these name a different type that merely contains ours
  assert.equal(wantsMarkdown("GET", "text/markdownish", "/"), false);
  assert.equal(wantsMarkdown("GET", "application/text/markdown-x", "/"), false);
  ok("text/markdownish and friends do not count as text/markdown");
}

console.log("\nmarkdown — only GET is negotiated");
{
  for (const m of ["POST", "PUT", "DELETE", "HEAD", "OPTIONS"]) {
    assert.equal(wantsMarkdown(m, "text/markdown", "/trips/spiti-solo-circuit"), false, `${m} must not be rewritten`);
  }
  ok("POST and friends are never rewritten — a form submit must reach its handler");
}

console.log("\nmarkdown — only paths that actually have a renderer");
{
  assert.equal(hasMarkdown("/"), true, "the site summary");
  for (const s of MARKDOWN_SECTIONS) assert.equal(hasMarkdown(`/${s}/some-slug`), true, `${s} should negotiate`);
  ok(`/ and all ${MARKDOWN_SECTIONS.length} route families negotiate`);

  // listing pages, one-offs and admin have no markdown twin
  for (const p of ["/about", "/contact", "/trips", "/destinations", "/stories", "/admin", "/api/lead", "/travel-with/naman"]) {
    assert.equal(hasMarkdown(p), false, `${p} must NOT be negotiated`);
  }
  ok("listing pages, /admin and /api are left alone");

  assert.equal(hasMarkdown("/trips/a/b"), false, "a deeper path is not a trip page");
  assert.equal(hasMarkdown("/trips/spiti/"), true, "a trailing slash is the same page");
  ok("trailing slashes match; extra segments do not");
}

console.log(`\n${n} assertions passed.\n`);
