import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import SiteFooter from "@/components/site/SiteFooter";
import StoryCard from "@/components/site/StoryCard";
import { getAllPosts, getSettings } from "@/lib/catalog";
import { isStoryLive, storyKind, STORY_KINDS, kindsWithStories } from "@/lib/stories";
import { canonical } from "@/lib/seo";

export function generateStaticParams() {
  /* only build a topic that actually has a live story behind it — a topic
     with none 404s at request time via the same rule below */
  return kindsWithStories(getAllPosts()).map((k) => ({ kind: k.kind }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  const meta = STORY_KINDS.find((k) => k.kind === kind);
  if (!meta) return {};
  const title = `${meta.label} — travel stories & guides | Tripwaley`;
  return { ...canonical(`/stories/topic/${kind}`), title, description: meta.blurb, openGraph: { title, description: meta.blurb, type: "website" } };
}

export default async function TopicPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const meta = STORY_KINDS.find((k) => k.kind === kind);
  if (!meta) notFound();

  const settings = getSettings();
  const posts = getAllPosts()
    .filter(isStoryLive)
    .filter((p) => storyKind(p) === meta.kind)
    .sort((a, b) => b.date.localeCompare(a.date));

  /* a topic nobody has written a live story for yet is not a page worth
     Google indexing — same 404 an unknown kind already gets above */
  if (posts.length === 0) notFound();

  return (
    <>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Link href="/stories" className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-white/45 hover:text-gold">← all stories</Link>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl">
              {meta.label}<span className="text-gold">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70">{meta.blurb}</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-ink/60">Nothing here yet — <Link href="/stories" className="font-bold text-brand">read everything else</Link>.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <StoryCard key={p.slug} post={p} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </>
  );
}
