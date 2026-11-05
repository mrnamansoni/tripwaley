import Link from "next/link";
import type { ReactNode } from "react";
import SiteMedia from "@/components/site/SiteMedia";
import { expandTokens, type TokenLookup } from "@/lib/storyTokens";
import { parseBlocks, type Inline } from "@/lib/storyMarkdown";
import { fromPrice, upcomingDepartures, shortDate } from "@/lib/catalog";

/** the live-value lookups a rendering page hands to expandTokens */
export function storyLookup(): TokenLookup {
  return {
    price: (trip, city) => fromPrice(trip, city),
    nextDeparture: (trip) => {
      const next = upcomingDepartures({ packageSlug: trip, limit: 1 })[0];
      return next ? shortDate(next.date) : undefined;
    },
  };
}

const LINK = "font-semibold text-brand underline underline-offset-2 hover:text-brand-bright";

/* text leaves still carry {{price}} / {{next-departure}} tokens, filled from
   the live catalog on every render */
function renderInline(nodes: Inline[], lookup: TokenLookup, key = "n"): ReactNode[] {
  return nodes.flatMap((node, i): ReactNode[] => {
    const k = `${key}-${i}`;
    if (typeof node === "string") {
      return expandTokens(node, lookup).map((t, j) =>
        typeof t === "string" ? t : <Link key={`${k}-${j}`} href={t.href} className={LINK}>{t.text}</Link>
      );
    }
    const children = renderInline(node.children, lookup, k);
    if (node.kind === "b") return [<strong key={k} className="font-bold text-ink">{children}</strong>];
    if (node.kind === "i") return [<em key={k}>{children}</em>];
    return node.external
      ? [<a key={k} href={node.href} target="_blank" rel="noopener" className={LINK}>{children}</a>]
      : [<Link key={k} href={node.href} className={LINK}>{children}</Link>];
  });
}

/** A story body: paragraphs, ## headings, lists, photos, bold, italic and
 *  links, written in the admin's formatting toolbar (see storyMarkdown). */
export default function StoryBody({ body, fallbackAlt = "" }: { body: string; fallbackAlt?: string }) {
  const lookup = storyLookup();
  return (
    <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/80">
      {parseBlocks(body).map((b, i) => {
        switch (b.kind) {
          case "h2":
            return (
              <h2 key={i} id={b.id} className="scroll-mt-28 pt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink [text-wrap:balance]">
                {renderInline(b.inline, lookup)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id} className="scroll-mt-28 pt-2 font-display text-xl font-extrabold leading-snug text-ink [text-wrap:balance]">
                {renderInline(b.inline, lookup)}
              </h3>
            );
          case "ul":
          case "ol": {
            const List = b.kind;
            return (
              <List key={i} className={`space-y-2 pl-6 ${b.kind === "ul" ? "list-disc" : "list-decimal"} marker:text-brand`}>
                {b.items.map((item, j) => <li key={j} className="pl-1">{renderInline(item, lookup, `${i}-${j}`)}</li>)}
              </List>
            );
          }
          case "img":
            return (
              <figure key={i} className="py-2">
                <span className="relative block aspect-[3/2] overflow-hidden rounded-2xl bg-ink/5">
                  <SiteMedia src={b.src} alt={b.alt || fallbackAlt} fill sizes="(max-width:768px) 92vw, 720px" className="object-cover" />
                </span>
                {b.alt && <figcaption className="mt-2 text-sm leading-snug text-ink/65">{b.alt}</figcaption>}
              </figure>
            );
          default:
            return <p key={i}>{renderInline(b.inline, lookup)}</p>;
        }
      })}
    </div>
  );
}
