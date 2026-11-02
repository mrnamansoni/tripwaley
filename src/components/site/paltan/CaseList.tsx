import { CaseNote, NameTape, Pin, Polaroid, Stamp, type CaseSubject } from "./caseBits";

/* THE FILE — the paltan case file as a stack of pages, for phones, tablets
   and anyone who asked for less motion. One red thread runs down through
   every polaroid, founder first; each face has its case note under it. The
   highlighter is the only motion, swept by scroll where the browser can. */
export default function CaseList({ subjects }: { subjects: CaseSubject[] }) {
  const n = subjects.length;
  const people = subjects.reduce((k, s) => k + 1 + s.crew.length, 0);
  return (
    <div className="case-list relative overflow-hidden bg-ink py-20 sm:py-24">
      <div className="case-felt noise absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-xl px-5">
        <h2 className="font-display text-[clamp(2.6rem,11vw,4.25rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-white">
          Kaun hain ye <span className="text-gold">log?</span>
        </h2>
        <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-white/75">
          The paltan: the core team behind every Tripwaley trip. Here&apos;s the file on each of them.
        </p>
      </div>

      <ol className="relative mx-auto mt-14 max-w-xl px-5">
        {/* the thread that ties them all together */}
        <span aria-hidden="true" className="absolute bottom-24 left-1/2 top-2 w-[2px] -translate-x-1/2 bg-brand-bright/80" />
        {subjects.map((s, i) => (
          <li key={s.id} className="relative pb-16 last:pb-0">
            <div className={`relative mx-auto ${i === 0 ? "w-[min(16rem,66vw)]" : "w-[min(13rem,56vw)]"}`}>
              <Polaroid s={s} sizes="(min-width:640px) 256px, 66vw" className="w-full" />
              <Pin className="absolute left-1/2 top-[3px] -translate-x-1/2" />
            </div>
            <div className="relative text-center">
              <NameTape name={s.name} className="-mt-4 text-[1rem]" />
            </div>
            <div className="relative mt-7">
              <CaseNote s={s} index={i} total={n} />
            </div>
          </li>
        ))}
      </ol>

      <div className="relative mx-auto mt-16 flex max-w-xl flex-wrap items-center justify-between gap-6 px-5">
        <div>
          <p className="font-display text-[clamp(2.2rem,9vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
            That&apos;s the <span className="text-gold">paltan.</span>
          </p>
          <p className="mt-2 text-[1rem] text-white/75">
            {people === 1 ? "One person" : `${people} people`} behind every seat you hold.
          </p>
        </div>
        <Stamp>Case closed</Stamp>
      </div>
    </div>
  );
}
