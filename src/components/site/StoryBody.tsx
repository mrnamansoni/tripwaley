import Link from "next/link";
import { expandTokens, type TokenLookup } from "@/lib/storyTokens";
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

/** Paragraphs split on blank lines, with {{price}} / {{next-departure}}
 *  filled in from the live catalog. */
export default function StoryBody({ body }: { body: string }) {
  const lookup = storyLookup();
  const paras = (body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/80">
      {paras.map((para, i) => (
        <p key={i}>
          {expandTokens(para, lookup).map((node, j) =>
            typeof node === "string" ? (
              node
            ) : (
              <Link key={j} href={node.href} className="font-semibold text-brand underline underline-offset-2 hover:text-brand-bright">
                {node.text}
              </Link>
            )
          )}
        </p>
      ))}
    </div>
  );
}
