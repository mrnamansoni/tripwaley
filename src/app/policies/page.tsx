import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { LEGAL_PAGES } from "@/components/site/LegalPage";
import { getCities, getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Policies | Tripwaley",
  description:
    "Terms & Conditions, Privacy Policy, Cancellation & Refund Policy, Service Delivery and Return Policy for Tripwaley group departures.",
};

/* The hub the footer has always linked to. Every policy document in one
   place, which is also what a payment-gateway reviewer looks for first. */
export default function PoliciesPage() {
  const s = getSettings();

  return (
    <CityProvider cities={getCities()} defaultCity={s.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">everything in writing</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Policies
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              What you agree to when you book, what happens to your data, and exactly what comes back if you
              cancel. No fine print, no surprises at the boarding point.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
          <ul className="grid gap-4 sm:grid-cols-2">
            {LEGAL_PAGES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-card"
                >
                  <h2 className="font-display text-xl font-extrabold text-ink transition-colors group-hover:text-brand">
                    {p.label}
                  </h2>
                  <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-ink/60">{p.blurb}</p>
                  <span className="mt-4 font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/35 transition-colors group-hover:text-brand">
                    read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <CurtainFooter whatsappLink={s.whatsappLink} whatsapp={s.whatsapp} announcement={s.announcement} />
    </CityProvider>
  );
}
