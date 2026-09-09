/**
 * Which requests get markdown — the routing half of content negotiation.
 *
 * Separate from lib/markdown.ts on purpose. That module reads the catalog off
 * disk, and src/proxy.ts runs in the EDGE runtime where there is no `fs`.
 * Importing the renderer into middleware would drag the whole catalog layer
 * across that boundary. These are the only two facts middleware needs, and
 * this file imports nothing — which also lets scripts/test-markdown.mjs load it.
 */

/** the route families that have a markdown twin */
export const MARKDOWN_SECTIONS = ["trips", "destinations", "from", "stories"] as const;

/** Does a markdown renderer exist for this path? */
export function hasMarkdown(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return true;
  const seg = path.split("/").filter(Boolean);
  return seg.length === 2 && (MARKDOWN_SECTIONS as readonly string[]).includes(seg[0]);
}

/**
 * Should this request be answered with markdown?
 *
 * THE DANGEROUS PART is the Accept test. Every browser sends something like
 * `text/html,application/xhtml+xml,application/xml;q=0.9,*` + `/*;q=0.8` — and a
 * check that treated that trailing wildcard as "markdown is acceptable" would
 * serve markdown to every human visitor on the site, which is a total outage
 * that returns HTTP 200. So `text/markdown` has to be named explicitly, and the
 * wildcard must never count.
 */
export function wantsMarkdown(method: string, accept: string | null, pathname: string): boolean {
  if (method !== "GET") return false;
  if (!acceptsMarkdown(accept)) return false;
  return hasMarkdown(pathname);
}

/**
 * Is `text/markdown` one of the media types this Accept header actually lists?
 *
 * Parsed rather than pattern-matched. A regex over the whole header string
 * looks equivalent and is not: /\btext\/markdown\b/ also fires on
 * `application/text/markdown-x`, because "-" is a non-word character and so the
 * trailing \b matches. Splitting on commas and dropping the q-parameters
 * compares whole media types, which is what the header actually means.
 */
function acceptsMarkdown(accept: string | null): boolean {
  return (accept ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .includes("text/markdown");
}
