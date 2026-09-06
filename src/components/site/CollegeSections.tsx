/* Sections unique to /college-trips.
   Server-rendered, no hooks — the quote form is the only client island. */

import SiteMedia from "./SiteMedia";
import ReadMore from "./ReadMore";
import { inr } from "@/lib/types";
import type { CollegeTrip } from "@/lib/types";

/* ------------------------------------------------ the batch wall -------

   A college coordinator is buying reassurance, not a destination — the
   question behind every enquiry is "who else has trusted you with 60 of
   their students?". So the proof wall leads with the institution's name and
   the batch size, and treats the photo as evidence rather than decoration. */

export function CollegeWall({
  runs,
  eyebrow,
  headline,
  accent,
}: {
  runs: CollegeTrip[];
  eyebrow: string;
  headline: string;
  accent: string;
}) {
  if (!runs.length) return null;

  return (
    <section id="previous" className="relative overflow-hidden bg-ink py-[10vh]">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl">
          {headline} <span className="text-gold">{accent}</span>
        </h2>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {runs.map((r) => (
            <li key={r.slug}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/50">
                <div className="relative h-52 overflow-hidden bg-ink">
                  <SiteMedia
                    src={r.cover}
                    alt={`${r.college} in ${r.destination}`}
                    fill
                    sizes="(max-width:640px) 92vw, (max-width:1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                  {r.year && (
                    <span className="absolute right-4 top-4 rounded-full bg-ink/75 px-3 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white backdrop-blur-sm">
                      {r.year}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-xl font-extrabold leading-tight text-white">{r.college}</h3>
                    {r.city && (
                      <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-white/55">{r.city}</p>
                    )}
                  </div>
                </div>

                {/* the batch record — the numbers a coordinator actually scans */}
                <dl className="grid grid-cols-3 divide-x divide-white/10 border-y border-white/10">
                  {[
                    { k: "students", v: r.students ? String(r.students) : "—" },
                    { k: "days", v: r.nights ? String(r.nights) : "—" },
                    { k: "per head", v: r.pricePerStudent ? inr(r.pricePerStudent) : "—" },
                  ].map((cell) => (
                    <div key={cell.k} className="px-3 py-3 text-center">
                      <dd className="font-display text-base font-extrabold leading-none text-gold">{cell.v}</dd>
                      <dt className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-white/40">{cell.k}</dt>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-1 flex-col p-5">
                  {r.destination && (
                    <p className="text-sm font-bold leading-snug text-white/80">{r.destination}</p>
                  )}
                  {r.quote && (
                    <blockquote className="mt-3 flex-1 border-l-2 border-gold/60 pl-3.5">
                      {/* these run to 1,300 characters — a college head writing a
                          thank-you note does not write short. Clamped so the row of
                          cards keeps one height, with the full text still in the DOM. */}
                      <ReadMore lines={5} moreLabel="Read the full note" tone="dark">
                        <p className="text-[0.86rem] leading-relaxed text-white/60">&ldquo;{r.quote}&rdquo;</p>
                      </ReadMore>
                      {r.quoteBy && (
                        <footer className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/35">
                          {r.quoteBy}
                        </footer>
                      )}
                    </blockquote>
                  )}
                </div>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------ how it works --------- */

export function CollegeSteps({
  title,
  steps,
}: {
  title: string;
  steps: { title: string; detail: string }[];
}) {
  if (!steps.length) return null;
  return (
    <section className="bg-cream py-[10vh]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {title}
        </h2>

        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="group relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card"
            >
              <span aria-hidden="true" className="font-display text-5xl font-extrabold leading-none text-brand/15 transition-colors duration-500 group-hover:text-brand/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold leading-snug text-ink">{s.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{s.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
