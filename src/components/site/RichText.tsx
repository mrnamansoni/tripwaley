"use client";

/* LONG-FORM COPY — the package brief and any other admin-written block.
 *
 * These fields routinely run to 13,000 characters (they come out of the
 * original inventory sheet as a whole trip document), and the page used to
 * hard-cut them at 500. This renders all of it, but gives the text structure
 * first so it reads as a document rather than a wall:
 *
 *   • blank lines separate paragraphs
 *   • a leading ALL-CAPS line, or "DAY 3: …", becomes a heading
 *   • bullet-ish lines (-, •, ✓) become a real list
 *
 * Long copy starts collapsed behind a fade with a Read-more toggle, so the
 * page keeps its shape. The full text is always in the DOM, so it stays
 * selectable, findable with ⌘F, and readable by search engines.
 */

import { useMemo, useState } from "react";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "list"; items: string[] };

const BULLET = /^\s*[-–—•*✓✦]\s+/;

/** true when a line is written in caps (ignoring digits and punctuation) */
function isCaps(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

/** A "DAY 3: …" marker, or a short all-caps line — but not an all-caps
 *  sentence. Character-class matching was too brittle here: real headings
 *  contain arrows, ampersands and en-dashes ("DAY 1: DELHI → MANALI"). */
function isHeadingLine(line: string): boolean {
  if (line.length > 110) return false;
  if (/^day\s*\d+/i.test(line)) return true;
  return isCaps(line) && !/[.!?]$/.test(line);
}

export function parseBlocks(raw: string): Block[] {
  const out: Block[] = [];
  const chunks = (raw ?? "").replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let i = 0;
    // a leading heading line: ALL CAPS, or "DAY 2: ..." style
    if (isHeadingLine(lines[0])) {
      out.push({ kind: "heading", text: lines[0].replace(/[:：]\s*$/, "") });
      i = 1;
    }

    let para: string[] = [];
    let list: string[] = [];
    // Keep the author's line breaks: these fields are hand-written, and lines
    // like "Ex-Delhi | Organized by Tripwaley" are deliberately their own line.
    // Joining them into one run of prose reads as a mistake.
    const flushPara = () => { if (para.length) { out.push({ kind: "para", text: para.join("\n") }); para = []; } };
    const flushList = () => { if (list.length) { out.push({ kind: "list", items: list }); list = []; } };

    for (; i < lines.length; i++) {
      const l = lines[i];
      if (BULLET.test(l)) { flushPara(); list.push(l.replace(BULLET, "")); }
      else { flushList(); para.push(l); }
    }
    flushPara();
    flushList();
  }
  return out;
}

export default function RichText({
  text,
  /** above this many characters the block starts collapsed */
  collapseOver = 900,
  /** how much shows while collapsed — the creator pages want a tighter
   *  preview than a full trip brief, so it can't be a fixed 16rem */
  collapsedHeight = "16rem",
  className = "",
  tone = "light",
  moreLabel = "Read the full brief",
  lessLabel = "Show less",
}: {
  text: string;
  collapseOver?: number;
  collapsedHeight?: string;
  className?: string;
  tone?: "light" | "dark";
  moreLabel?: string;
  lessLabel?: string;
}) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  const collapsible = (text ?? "").length > collapseOver;
  const [open, setOpen] = useState(false);

  if (!blocks.length) return null;

  const dark = tone === "dark";
  const body = dark ? "text-white/65" : "text-ink/70";
  const head = dark ? "text-white" : "text-ink";
  const tick = dark ? "text-gold" : "text-brand";
  // the fade sits over the cut edge; it has to match the surface behind it
  const fade = dark
    ? "bg-gradient-to-t from-ink via-ink/85 to-transparent"
    : "bg-gradient-to-t from-card via-card/85 to-transparent";

  return (
    <div className={className}>
      <div
        className={`relative overflow-hidden transition-[max-height] duration-500 ease-out`}
        style={{ maxHeight: collapsible && !open ? collapsedHeight : "none" }}
      >
        {blocks.map((b, i) => {
          if (b.kind === "heading") {
            return (
              <h3
                key={i}
                className={`font-display text-[0.7rem] font-extrabold uppercase tracking-[0.22em] ${head} ${i === 0 ? "" : "mt-6"}`}
              >
                {b.text}
              </h3>
            );
          }
          if (b.kind === "list") {
            return (
              <ul key={i} className="mt-3 space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className={`flex gap-2.5 text-[0.95rem] leading-relaxed ${body}`}>
                    <span className={`mt-0.5 shrink-0 ${tick}`} aria-hidden="true">—</span>
                    {it}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className={`mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed ${body}`}>
              {b.text}
            </p>
          );
        })}

        {collapsible && !open && (
          <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 ${fade}`} />
        )}
      </div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-colors ${
            dark
              ? "border-white/25 text-white hover:border-gold hover:text-gold"
              : "border-line text-ink/75 hover:border-brand hover:text-brand"
          }`}
        >
          {open ? lessLabel : moreLabel}
          <span aria-hidden="true" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      )}
    </div>
  );
}
