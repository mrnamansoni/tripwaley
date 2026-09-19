import Link from "next/link";
import { exploreGroups } from "@/lib/exploreLinks";

/* KEEP EXPLORING — a plain, server-rendered index of every landing page,
   sitting just above the footer. No JS and no animation: it exists so a
   visitor (and Google) can reach any destination, departure city, trip or
   creator from any page in one click. See src/lib/exploreLinks.ts. */
export default function ExploreLinks() {
  const groups = exploreGroups();
  if (groups.length === 0) return null;

  return (
    <nav aria-labelledby="explore-head" className="border-t border-line bg-cream px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="font-script text-2xl text-brand">keep exploring</p>
        <h2 id="explore-head" className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Every trip, every way in
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1fr_1fr_1.6fr_1fr] lg:gap-x-10">
          {groups.map((g) => (
            <div key={g.head} className={g.head === "Trips" ? "col-span-2 lg:col-span-1" : undefined}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink/70">{g.head}</p>
              <ul className={`mt-3 ${g.head === "Trips" ? "columns-2 gap-x-6 lg:columns-2" : ""}`}>
                {g.links.map((l) => (
                  <li key={l.href} className="break-inside-avoid">
                    <Link
                      href={l.href}
                      className="inline-block py-1.5 text-sm font-semibold leading-snug text-ink/80 transition-colors hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
