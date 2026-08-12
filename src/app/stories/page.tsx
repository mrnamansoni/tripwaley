import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CurtainFooter from "@/components/site/CurtainFooter";
import { getPosts, getSettings, shortDate } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Stories — field notes from the batches | Tripwaley",
  description: "Trip diaries, packing guides and route notes from Tripwaley's group departures across India.",
};

export default function StoriesPage() {
  const settings = getSettings();
  const posts = getPosts().slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Navbar overDarkHero />
      <main className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">field notes from the road</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Stories<span className="text-gold">.</span>
            </h1>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-ink/50">No stories published yet — check back soon.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.slug} href={`/stories/${p.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-transform hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SiteMedia src={p.cover} alt="" fill sizes="(max-width:640px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-blush px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-brand">{t}</span>
                      ))}
                    </div>
                    <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink transition-colors group-hover:text-brand">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink/60">{p.excerpt}</p>
                    <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-widest text-ink/40">{p.author} · {shortDate(p.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} announcement={settings.announcement} />
    </>
  );
}
