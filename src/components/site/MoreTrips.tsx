"use client";

/* MORE ESCAPES — a spin-carousel band for the trip detail page (the lab
   orbit-gallery pattern, reused). Other live packages orbit on a 3D ring:
   auto-rotates, drag to spin, tap to open. One GPU transform total. */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SpinCarousel from "./SpinCarousel";
import { inr } from "@/lib/types";

export interface MoreTrip {
  slug: string;
  name: string;
  nightsLabel: string;
  image: string;
  price?: number;
}

export default function MoreTrips({ trips }: { trips: MoreTrip[] }) {
  const [active, setActive] = useState(0);
  if (trips.length < 3) return null;
  const current = trips[active];

  return (
    <section className="overflow-hidden bg-[#0d0b09] py-[9vh]">
      <div className="px-5 text-center">
        <p className="font-script text-2xl text-gold">still deciding?</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          More escapes<span className="text-gold">.</span>
        </h2>
        <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white/40">
          {current ? `${current.name}${current.price ? ` · from ${inr(current.price)}` : ""}` : ""}
        </p>
      </div>

      <SpinCarousel
        className="mx-auto mt-6 h-[44vh] max-h-[22rem] w-full max-w-5xl"
        radius={Math.round(Math.max(280, trips.length * 30))}
        perspective={820}
        tiltDeg={-4}
        autoDegPerSec={7}
        cardClassName="h-[30vh] max-h-[16rem] w-[36vw] min-w-[8rem] max-w-[11rem]"
        onFrontChange={setActive}
      >
        {trips.map((t) => (
          <Link key={t.slug} href={`/trips/${t.slug}`} aria-label={t.name} className="relative block h-full w-full" draggable={false}>
            <span className="relative block h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-card-lg">
              <Image src={t.image} alt={t.name} fill sizes="38vw" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-2.5 pt-8">
                <span className="block truncate font-display text-xs font-extrabold text-white sm:text-sm">{t.name}</span>
                <span className="text-[0.52rem] font-bold uppercase tracking-widest text-gold">{t.nightsLabel}</span>
              </span>
            </span>
          </Link>
        ))}
      </SpinCarousel>
      <p className="mt-4 text-center text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/30">
        drag to spin · tap to open
      </p>
    </section>
  );
}
