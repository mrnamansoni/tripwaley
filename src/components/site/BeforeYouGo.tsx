import Link from "next/link";
import type { Package } from "@/lib/types";
import { getAllPosts } from "@/lib/catalog";
import { storiesForPackage, groupByKind, readingMinutes, STORY_KINDS } from "@/lib/stories";

/* BEFORE YOU GO — everything written about the places this trip visits.
 *
 * A <details>, so it needs no JavaScript and every link is in the server HTML
 * whether it is open or shut: Google reads and follows collapsed content, and
 * a reader gets a short page until they ask for more. What sits here is
 * titles and summaries; the writing itself lives on each story's own URL,
 * where it can rank. */
export default function BeforeYouGo({ pkg }: { pkg: Package }) {
  const groups = groupByKind(storiesForPackage(pkg, getAllPosts()));
  if (groups.length === 0) return null;
  const count = groups.reduce((n, g) => n + g.posts.length, 0);
  const where = pkg.destination || pkg.name;

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      <details className="group rounded-3xl border border-line bg-card shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
          <span>
            <span className="block font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              Before you go — {where}
            </span>
            <span className="mt-1 block text-sm text-ink/65">
              {count} {count === 1 ? "piece" : "pieces"} on planning, cost and what it&apos;s actually like
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-2xl text-ink/40 transition-transform group-open:rotate-45">+</span>
        </summary>

        <div className="space-y-8 border-t border-line px-6 pb-7 pt-6">
          {groups.map((g) => (
            <div key={g.kind}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink/70">{g.label}</p>
              <p className="mt-1 text-xs text-ink/55">{STORY_KINDS.find((k) => k.kind === g.kind)?.blurb}</p>
              <ul className="mt-3 space-y-2.5">
                {g.posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/stories/${p.slug}`} className="group/row block rounded-xl px-3 py-2 transition-colors hover:bg-cream">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink group-hover/row:text-brand">{p.title}</span>
                        <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-wider text-ink/45">
                          {readingMinutes(p.body)} min
                        </span>
                      </span>
                      {p.summary && <span className="mt-0.5 block text-sm leading-snug text-ink/60">{p.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
