"use client";

/* Client-side error boundary.
 *
 * Without this, an exception in any client component blanks the page — and
 * this site is animation-heavy, so a GSAP or measurement failure taking the
 * whole route down is a real risk. reset() re-renders the segment, which
 * recovers from a transient failure without a full reload. */

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // the digest is what correlates this with the server log entry
    console.error("[route error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-gold">something broke</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
        That didn&apos;t load properly.
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
        A part of this page failed on your device. Trying again usually fixes it — if it doesn&apos;t,
        the trips list below always works.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright"
        >
          Try again
        </button>
        <Link
          href="/trips"
          className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
        >
          All departures →
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-[0.6rem] tracking-widest text-white/25">ref {error.digest}</p>
      )}
    </main>
  );
}
