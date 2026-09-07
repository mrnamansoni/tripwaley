import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { LEGAL_PAGES } from "@/components/site/LegalPage";
import { getCities, getSettings } from "@/lib/catalog";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  ...canonical("/contact"),
  title: "Contact Tripwaley — talk to a human",
  description:
    "Phone, WhatsApp, email and registered address for Tripwaley. A human answers — usually before the second ring.",
};

export default function ContactPage() {
  const s = getSettings();
  const tel = s.whatsapp?.replace(/[^\d]/g, "");
  const entity = s.legalName || s.brand;

  const channels = [
    tel && {
      label: "WhatsApp",
      value: `+${tel}`,
      note: "Fastest. Batch questions, holds, cancellations.",
      href: s.whatsappLink,
      external: true,
    },
    tel && {
      label: "Phone",
      value: `+${tel}`,
      note: s.supportHours || "A human answers, not a menu.",
      href: `tel:+${tel}`,
      external: false,
    },
    s.email && {
      label: "Email",
      value: s.email,
      note: "Refunds, grievances, anything needing a paper trail.",
      href: `mailto:${s.email}`,
      external: false,
    },
  ].filter(Boolean) as { label: string; value: string; note: string; href: string; external: boolean }[];

  return (
    <CityProvider cities={getCities()} defaultCity={s.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">no ticket numbers, no bots</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Talk to <span className="text-gold">a human.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              Our ops desk runs through the night because batches board at 4 AM. Whichever way you reach us,
              the same small team answers.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group rounded-3xl border border-line bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-card"
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-ink/40">{c.label}</p>
                <p className="mt-2 font-display text-xl font-extrabold break-words text-ink transition-colors group-hover:text-brand">
                  {c.value}
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/60">{c.note}</p>
              </a>
            ))}
          </div>

          {(s.address || s.legalName || s.gstin) && (
            <section className="mt-10 rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-ink/40">
                registered business
              </p>
              <dl className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.78rem] font-bold uppercase tracking-wide text-ink/45">entity</dt>
                  <dd className="mt-1 font-display text-lg font-extrabold text-ink">{entity}</dd>
                </div>
                {s.gstin && (
                  <div>
                    <dt className="text-[0.78rem] font-bold uppercase tracking-wide text-ink/45">GSTIN</dt>
                    <dd className="mt-1 font-mono text-ink/80">{s.gstin}</dd>
                  </div>
                )}
                {s.address && (
                  <div className="sm:col-span-2">
                    <dt className="text-[0.78rem] font-bold uppercase tracking-wide text-ink/45">address</dt>
                    <dd className="mt-1 leading-relaxed text-ink/75">{s.address}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className="mt-10 rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <p className="font-script text-2xl text-brand">before you write in</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">
              Most answers are already written down.
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              <li>
                <Link
                  href="/about#faqs"
                  className="inline-flex rounded-full border border-line px-4 py-2 text-[0.8rem] font-bold text-ink/70 transition-colors hover:border-brand hover:text-brand"
                >
                  FAQs
                </Link>
              </li>
              {LEGAL_PAGES.filter((p) => p.href !== "/contact").map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="inline-flex rounded-full border border-line px-4 py-2 text-[0.8rem] font-bold text-ink/70 transition-colors hover:border-brand hover:text-brand"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <CurtainFooter whatsappLink={s.whatsappLink} whatsapp={s.whatsapp} announcement={s.announcement} />
    </CityProvider>
  );
}
