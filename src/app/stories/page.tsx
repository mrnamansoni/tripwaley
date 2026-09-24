import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import SiteFooter from "@/components/site/SiteFooter";
import StoryCard from "@/components/site/StoryCard";
import { getAllPosts, getSettings } from "@/lib/catalog";
import { isStoryLive, kindsWithStories } from "@/lib/stories";
import { DESTINATIONS } from "@/lib/destinations";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  ...canonical("/stories"),
  title: "Stories — field notes from the batches | Tripwaley",
  description: "Trip diaries, packing guides and route notes from Tripwaley's group departures across India.",
};

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const { place } = await searchParams;
  const settings = getSettings();
  const all = getAllPosts().filter(isStoryLive).sort((a, b) => b.date.localeCompare(a.date));
  const posts = place ? all.filter((p) => (p.destinations ?? []).includes(place)) : all;
  /* only offer a place filter where something is actually written, so the row
     never sends a reader to an empty page */
  const places = DESTINATIONS.filter((d) => all.some((p) => (p.destinations ?? []).includes(d.slug)));

  return (
    <>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">field notes from the road</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Stories<span className="text-gold">.</span>
            </h1>
          </div>
        </section>

        <nav aria-label="Filter stories" className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8">
          <div className="flex flex-wrap gap-2">
            <Link href="/stories" className={`rounded-full border px-4 py-1.5 text-sm font-bold ${!place ? "border-brand bg-brand text-white" : "border-line bg-card text-ink/75 hover:border-brand hover:text-brand"}`}>
              Everything
            </Link>
            {/* only a topic chip with at least one live story behind it —
                same rule the topic page itself applies before it 404s */}
            {kindsWithStories(all).map((k) => (
              <Link key={k.kind} href={`/stories/topic/${k.kind}`} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm font-bold text-ink/75 hover:border-brand hover:text-brand">
                {k.label}
              </Link>
            ))}
          </div>
          {places.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {places.map((d) => (
                <Link key={d.slug} href={`/stories?place=${d.slug}`} className={`rounded-full border px-3 py-1 text-xs font-bold ${place === d.slug ? "border-brand bg-brand text-white" : "border-line bg-card text-ink/70 hover:border-brand hover:text-brand"}`}>
                  {d.name}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          {posts.length === 0 ? (
            place && all.length > 0 ? (
              <p className="text-ink/50">No stories about this place yet — <Link href="/stories" className="font-bold text-brand">see all stories</Link>.</p>
            ) : (
              <p className="text-ink/50">No stories published yet — check back soon.</p>
            )
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <StoryCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </>
  );
}
