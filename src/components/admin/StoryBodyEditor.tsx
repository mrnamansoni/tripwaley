"use client";

/* The story body, with a formatting toolbar. The body stays plain text: each
   button writes the small Markdown that storyMarkdown reads (## heading,
   **bold**, [text](link) …), so a story typed or pasted without the toolbar
   formats just the same. Preview renders with the site's own parser. */

import { useRef, useState, type ReactNode } from "react";
import { parseBlocks, storyImages, type Inline } from "@/lib/storyMarkdown";
import { normalizeMediaUrl } from "@/lib/types";
import MediaPicker from "./MediaPicker";
import { input, label } from "./ui";

type Edit = { text: string; start: number; end: number };

/* wrap the selection, or insert a placeholder already selected for typing over */
function wrap(e: Edit, before: string, after: string, placeholder: string): Edit {
  const picked = e.text.slice(e.start, e.end) || placeholder;
  const text = e.text.slice(0, e.start) + before + picked + after + e.text.slice(e.end);
  return { text, start: e.start + before.length, end: e.start + before.length + picked.length };
}

/* put a prefix at the start of every selected line ("## ", "- ", "1. ") */
function prefixLines(e: Edit, prefix: (i: number) => string, strip: RegExp): Edit {
  const from = e.text.lastIndexOf("\n", e.start - 1) + 1;
  const toNl = e.text.indexOf("\n", e.end);
  const to = toNl === -1 ? e.text.length : toNl;
  const lines = e.text.slice(from, to).split("\n").map((l, i) => prefix(i) + l.replace(strip, ""));
  const block = lines.join("\n");
  return { text: e.text.slice(0, from) + block + e.text.slice(to), start: from, end: from + block.length };
}

/* a block of its own: blank lines either side */
function insertBlock(e: Edit, block: string): Edit {
  const head = e.text.slice(0, e.end).replace(/\s*$/, "");
  const tail = e.text.slice(e.end).replace(/^\s*/, "");
  const lead = head ? head + "\n\n" : "";
  const text = lead + block + (tail ? "\n\n" + tail : "\n");
  return { text, start: lead.length, end: lead.length + block.length };
}

const LINE_MARK = /^(#{1,3}\s+|[-*•]\s+|\d{1,3}[.)]\s+)/;

function Preview({ body }: { body: string }) {
  const inline = (nodes: Inline[], key = "n"): ReactNode[] =>
    nodes.map((n, i) => {
      const k = `${key}-${i}`;
      if (typeof n === "string") return n;
      if (n.kind === "b") return <strong key={k} className="text-white">{inline(n.children, k)}</strong>;
      if (n.kind === "i") return <em key={k}>{inline(n.children, k)}</em>;
      return <span key={k} title={n.href} className="text-gold underline underline-offset-2">{inline(n.children, k)}</span>;
    });
  const blocks = parseBlocks(body);
  if (!blocks.length) return <p className="text-sm text-white/35">Nothing written yet.</p>;
  return (
    <div className="space-y-3 text-[1rem] leading-relaxed text-white/80">
      {blocks.map((b, i) => {
        if (b.kind === "h2") return <h2 key={i} className="pt-2 font-display text-xl font-extrabold text-white">{inline(b.inline)}</h2>;
        if (b.kind === "h3") return <h3 key={i} className="pt-1 font-display text-lg font-extrabold text-white">{inline(b.inline)}</h3>;
        if (b.kind === "ul" || b.kind === "ol") {
          const L = b.kind;
          return <L key={i} className={`space-y-1 pl-5 ${L === "ul" ? "list-disc" : "list-decimal"}`}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</L>;
        }
        if (b.kind === "img") {
          return (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any pasted host */}
              <img src={normalizeMediaUrl(b.src)} alt={b.alt} className="max-h-64 rounded-lg object-cover" />
              <figcaption className={`mt-1 text-xs ${b.alt ? "text-white/50" : "font-bold text-brand-bright"}`}>
                {b.alt || "No alt text — describe what this photo shows"}
              </figcaption>
            </figure>
          );
        }
        return <p key={i}>{inline(b.inline)}</p>;
      })}
    </div>
  );
}

const tool = "rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white/75 transition-colors hover:border-gold hover:text-gold";

export default function StoryBodyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [linking, setLinking] = useState<{ url: string; sel: Edit } | null>(null);
  const [photo, setPhoto] = useState<{ src: string; alt: string; sel: Edit } | null>(null);

  const current = (): Edit => {
    const t = ref.current;
    return { text: value, start: t?.selectionStart ?? value.length, end: t?.selectionEnd ?? value.length };
  };
  const apply = (next: Edit) => {
    onChange(next.text);
    setTab("write");
    requestAnimationFrame(() => {
      const t = ref.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(next.start, next.end);
    });
  };

  const insertLink = () => {
    if (!linking) return;
    const url = linking.url.trim();
    if (url) apply(wrap(linking.sel, "[", `](${url})`, "link text"));
    setLinking(null);
  };
  const insertPhoto = () => {
    if (!photo?.src || !photo.alt.trim()) return;
    apply(insertBlock(photo.sel, `![${photo.alt.trim().replace(/[[\]]/g, "")}](${photo.src})`));
    setPhoto(null);
  };

  const missingAlt = storyImages(value).filter((p) => !p.alt).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className={label}>body</span>
        <div role="tablist" className="flex gap-1">
          {(["write", "preview"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-xs font-bold capitalize ${tab === t ? "bg-white/15 text-white" : "text-white/45 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Formatting">
        <button type="button" className={tool} onClick={() => apply(prefixLines(current(), () => "## ", LINE_MARK))} title="Section heading">H2</button>
        <button type="button" className={tool} onClick={() => apply(prefixLines(current(), () => "### ", LINE_MARK))} title="Smaller heading">H3</button>
        <button type="button" className={`${tool} font-extrabold`} onClick={() => apply(wrap(current(), "**", "**", "bold text"))} title="Bold">B</button>
        <button type="button" className={`${tool} italic`} onClick={() => apply(wrap(current(), "*", "*", "italic text"))} title="Italic">I</button>
        <button type="button" className={tool} onClick={() => { setPhoto(null); setLinking({ url: "", sel: current() }); }} title="Link the selected words">Link</button>
        <button type="button" className={tool} onClick={() => apply(prefixLines(current(), () => "- ", LINE_MARK))} title="Bulleted list">• List</button>
        <button type="button" className={tool} onClick={() => apply(prefixLines(current(), (i) => `${i + 1}. `, LINE_MARK))} title="Numbered list">1. List</button>
        <button type="button" className={tool} onClick={() => { setLinking(null); setPhoto({ src: "", alt: "", sel: current() }); }} title="Photo with alt text">Photo</button>
      </div>

      {linking && (
        <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-gold/40 bg-black/30 p-3">
          <label className={`${label} min-w-56 flex-1`}>link to — a site path like /trips/spiti or a full https:// address
            <input autoFocus value={linking.url} onChange={(e) => setLinking({ ...linking, url: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } if (e.key === "Escape") setLinking(null); }}
              placeholder="/destinations/spiti" className={input} />
          </label>
          <button type="button" className={`${tool} border-gold text-gold`} onClick={insertLink}>Add link</button>
          <button type="button" className={tool} onClick={() => setLinking(null)}>Cancel</button>
        </div>
      )}

      {photo && (
        <div className="mt-2 grid gap-3 rounded-lg border border-gold/40 bg-black/30 p-3 sm:grid-cols-2">
          <MediaPicker label="photo" value={photo.src} onChange={(src) => setPhoto({ ...photo, src })} allowVideo={false} />
          <div className="flex flex-col gap-2">
            <label className={label}>alt text — what the photo shows (required)
              <input value={photo.alt} onChange={(e) => setPhoto({ ...photo, alt: e.target.value })}
                placeholder="Bonfire at Kasol campsite in December" className={input} />
            </label>
            <div className="mt-auto flex gap-2">
              <button type="button" className={`${tool} border-gold text-gold disabled:opacity-40`} disabled={!photo.src || !photo.alt.trim()} onClick={insertPhoto}>Insert photo</button>
              <button type="button" className={tool} onClick={() => setPhoto(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {tab === "write" ? (
        <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={18} className={`${input} font-mono text-xs leading-relaxed`} />
      ) : (
        <div className="mt-1.5 min-h-64 rounded-lg border border-white/15 bg-black/30 p-4"><Preview body={value} /></div>
      )}

      <p className="mt-1.5 text-xs leading-relaxed text-white/40">
        Blank line = new paragraph. Select words, then press a button. <code>{"{{price trip-slug}}"}</code> shows today&apos;s fare.
      </p>
      {missingAlt > 0 && (
        <p className="mt-1 text-xs font-bold text-brand-bright">
          {missingAlt === 1 ? "1 photo has" : `${missingAlt} photos have`} no alt text. Write what each shows inside the [ ] brackets.
        </p>
      )}
    </div>
  );
}
