/* STORY FORMATTING — the small slice of Markdown a story body may use.
 *
 * The body is typed in a plain admin textarea, so formatting is plain text
 * the toolbar writes for you:
 *
 *   ## Heading            ### Smaller heading
 *   **bold**  *italic*  _italic_
 *   [link text](/trips/spiti-valley)   or a bare https://… address
 *   - a bullet            1. a numbered step
 *   ![what the photo shows](/uploads/photo.jpg)   on a line of its own
 *
 * A blank line still starts a new paragraph, so every story written before
 * this existed renders exactly as it did. Anything this parser does not know
 * stays text: no raw HTML, and a link whose address is not http(s), mailto,
 * tel, a site path or an anchor renders as its words only. */

export type Inline =
  | string
  | { kind: "b"; children: Inline[] }
  | { kind: "i"; children: Inline[] }
  | { kind: "a"; href: string; external: boolean; children: Inline[] };

export type Block =
  | { kind: "p"; inline: Inline[] }
  | { kind: "h2"; id: string; inline: Inline[] }
  | { kind: "h3"; id: string; inline: Inline[] }
  | { kind: "ul"; items: Inline[][] }
  | { kind: "ol"; items: Inline[][] }
  | { kind: "img"; src: string; alt: string };

const SITE_HOST = /^https?:\/\/(?:www\.)?tripwaley\.com(?=\/|$|[?#])/i;

/** A safe address for a story link, or undefined. Tripwaley's own absolute
 *  links come back as site paths, so they stay internal links. */
export function safeHref(raw: string): { href: string; external: boolean } | undefined {
  const url = (raw ?? "").trim();
  if (!url) return undefined;
  if (SITE_HOST.test(url)) return { href: url.replace(SITE_HOST, "") || "/", external: false };
  if (url.startsWith("#")) return { href: url, external: false };
  if (url.startsWith("/") && !url.startsWith("//")) return { href: url, external: false };
  if (/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url)) return { href: url, external: true };
  if (/^(mailto|tel):[^\s]+$/i.test(url)) return { href: url, external: true };
  return undefined;
}

/* an address, allowing one level of (parentheses) inside it — Wikipedia
   links have them, and a stray ")" left in the text looks broken */
const URL = /([^()\s]*(?:\([^()\s]*\)[^()\s]*)*)/.source;

/* earliest match wins; each alternative is one inline form */
const INLINE = new RegExp(
  [
    /\[([^\]\n]+)\]\(\s*/.source + URL + /\s*\)/.source, // 1,2  [text](url)
    /\*\*([^*\n]+?)\*\*/.source, // 3        **bold**
    /\*([^*\s](?:[^*\n]*?[^*\s])?)\*/.source, // 4        *italic*
    /(?<![\p{L}\p{N}_])_([^_\s](?:[^_\n]*?[^_\s])?)_(?![\p{L}\p{N}_])/u.source, // 5   _italic_
    /(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/.source, // 6        bare address
  ].join("|"),
  "gu"
);

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const push = (s: string) => {
    if (!s) return;
    const last = out[out.length - 1];
    if (typeof last === "string") out[out.length - 1] = last + s;
    else out.push(s);
  };
  let at = 0;
  for (const m of (text ?? "").matchAll(INLINE)) {
    push(text.slice(at, m.index));
    at = m.index! + m[0].length;
    const [raw, linkText, linkUrl, bold, star, under, bare] = m;
    if (linkText !== undefined) {
      const safe = safeHref(linkUrl);
      if (safe) out.push({ kind: "a", ...safe, children: parseInline(linkText) });
      else for (const n of parseInline(linkText)) {
        if (typeof n === "string") push(n);
        else out.push(n);
      }
    } else if (bold !== undefined) out.push({ kind: "b", children: parseInline(bold) });
    else if (star !== undefined || under !== undefined) out.push({ kind: "i", children: parseInline(star ?? under) });
    else if (bare !== undefined) {
      const safe = safeHref(bare);
      if (safe) out.push({ kind: "a", ...safe, children: [bare.replace(/^https?:\/\/(www\.)?/i, "")] });
      else push(raw);
    }
  }
  push((text ?? "").slice(at));
  return out;
}

/** the words of a line with its formatting taken off */
export function inlineText(nodes: Inline[]): string {
  return nodes.map((n) => (typeof n === "string" ? n : inlineText(n.children))).join("");
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "section";

const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const BULLET = /^[-*•]\s+(.+)$/;
const NUMBER = /^\d{1,3}[.)]\s+(.+)$/;
const IMAGE = new RegExp(/^!\[([^\]\n]*)\]\(\s*/.source + URL + /\s*\)$/.source);

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const ids = new Map<string, number>();
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const endPara = () => {
    if (para.length) blocks.push({ kind: "p", inline: parseInline(para.join(" ")) });
    para = [];
  };
  const endList = () => {
    if (list) blocks.push(list.kind === "ul" ? { kind: "ul", items: list.items.map(parseInline) } : { kind: "ol", items: list.items.map(parseInline) });
    list = null;
  };

  for (const rawLine of (body ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) { endPara(); endList(); continue; }

    const h = HEADING.exec(line);
    const img = IMAGE.exec(line);
    const bullet = BULLET.exec(line);
    const num = NUMBER.exec(line);

    if (h) {
      endPara(); endList();
      const inline = parseInline(h[2]);
      /* one h1 per page: the story title. "# " is read as a section heading */
      const kind: "h2" | "h3" = h[1].length === 3 ? "h3" : "h2";
      const base = slugify(inlineText(inline));
      const seen = ids.get(base) ?? 0;
      ids.set(base, seen + 1);
      blocks.push({ kind, id: seen ? `${base}-${seen + 1}` : base, inline });
    } else if (img) {
      endPara(); endList();
      blocks.push({ kind: "img", alt: img[1].trim(), src: img[2] });
    } else if (bullet || num) {
      endPara();
      const kind = bullet ? "ul" : "ol";
      if (list && list.kind !== kind) endList();
      list ??= { kind, items: [] };
      list.items.push((bullet ?? num)![1]);
    } else {
      endList();
      para.push(line);
    }
  }
  endPara();
  endList();
  return blocks;
}

/** Plain words, for meta descriptions, reading time and word counts. */
export function storyPlainText(body: string): string {
  return parseBlocks(body)
    .map((b) => {
      if (b.kind === "img") return "";
      if (b.kind === "ul" || b.kind === "ol") return b.items.map(inlineText).join(" ");
      return inlineText(b.inline);
    })
    .filter(Boolean)
    .join("\n\n");
}

/** every photo a body shows, for hosting and alt-text checks */
export const storyImages = (body: string): { src: string; alt: string }[] =>
  parseBlocks(body).flatMap((b) => (b.kind === "img" ? [{ src: b.src, alt: b.alt }] : []));
