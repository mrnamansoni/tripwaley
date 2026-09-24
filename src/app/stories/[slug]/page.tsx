import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import SiteFooter from "@/components/site/SiteFooter";
import { getAllPosts, getSettings, shortDate, normalizeMediaUrl, getLivePackages, nightsLabel, fromPrice, inr } from "@/lib/catalog";
import { isStoryLive, storyKind, readingMinutes, STORY_KINDS, storiesForDestination, resolveStoryAlias } from "@/lib/stories";
import { destinationsFor } from "@/lib/destinations";
import StoryBody from "@/components/site/StoryBody";
import { canonical } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/schema";

/** a story is readable only when live — a draft 404s like any unknown slug */
const liveStory = (slug: string) => getAllPosts().filter(isStoryLive).find((p) => p.slug === slug);

/** first ~155 characters of real prose, cut on a word boundary */
function summarise(body: string): string {
  const flat = (body ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= 155) return flat;
  return flat.slice(0, 152).replace(/\s+\S*$/, "") + "…";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = liveStory(slug);
  if (!post) return { title: "Story not found | Tripwaley" };
  /* Every published story shipped with an EMPTY meta description, because each
     one has a blank `excerpt` and this read it directly. Google then wrote its
     own snippet for the whole blog. Falling back to the opening of the body
     means a description can never be missing again, whatever the admin field
     holds. */
  const description = post.summary?.trim() || post.excerpt?.trim() || summarise(post.body);
  return {
    ...canonical(`/stories/${post.slug}`),
    title: `${post.title} | Tripwaley Stories`,
    description,
    openGraph: { title: post.title, description, images: [{ url: normalizeMediaUrl(post.cover) }], type: "article" },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = liveStory(slug);
  if (!post) {
    const to = resolveStoryAlias(slug, getAllPosts());
    if (to) permanentRedirect(`/stories/${to}`);
    notFound();
  }

  const settings = getSettings();
  const kind = storyKind(post);
  const summaryLine = post.summary?.trim() || post.excerpt?.trim() || "";
  const faqs = post.faqs ?? [];
  const destinationSlugs = post.destinations ?? [];
  /* the live trips that go where this story is about — the whole point of an
     informational page is that it hands the reader a real batch at the end */
  const trips = getLivePackages()
    .filter((p) => destinationsFor(p).some((d) => destinationSlugs.includes(d.slug)))
    .slice(0, 4)
    .map((p) => ({ slug: p.slug, name: p.name, nights: nightsLabel(p), price: fromPrice(p.slug) }));
  /* related by place, not by date: someone reading about Kedarkantha wants the
     other Kedarkantha pages, not last week's Goa story */
  const related = destinationSlugs.flatMap((d) => storiesForDestination(d, getAllPosts()));
  const more = [...new Map(related.filter((p) => p.slug !== post.slug).map((p) => [p.slug, p])).values()].slice(0, 3);
  const faqSchema = faqJsonLd(faqs);

  return (
    <>
      <Navbar />
      <main id="main" className="bg-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([
            articleJsonLd({
              title: post.title,
              description: post.excerpt?.trim() || summarise(post.body),
              slug: post.slug,
              image: post.cover,
              published: post.date,
              author: post.author,
            }),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
              { name: post.title, path: `/stories/${post.slug}` },
            ]),
            ...(faqSchema ? [faqSchema] : []),
          ]) }}
        />
        {/* cover */}
        <section className="relative h-[52vh] min-h-[22rem] w-full overflow-hidden">
          <SiteMedia src={post.cover} alt={post.title} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl px-5 pb-10 sm:px-8">
            <div className="mb-3 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{t}</span>
              ))}
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">{post.title}</h1>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">
              {STORY_KINDS.find((k) => k.kind === kind)?.label} · {post.author} · {shortDate(post.date)} · {readingMinutes(post.body)} min read
            </p>
          </div>
        </section>

        {/* body */}
        <article className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
          {/* The answer first. Google lifts these into answer boxes and AI summaries,
              and a reader who only wanted the number leaves satisfied either way. */}
          {summaryLine && (
            <p className="mb-8 border-l-2 border-brand pl-5 font-display text-xl font-bold leading-snug text-ink/80">
              {summaryLine}
            </p>
          )}

          <StoryBody body={post.body} />

          {faqs.length > 0 && (
            <section className="mt-12 border-t border-line pt-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Questions people ask</h2>
              <dl className="mt-5 space-y-5">
                {faqs.map((f) => (
                  <div key={f.q}>
                    <dt className="font-display text-base font-extrabold text-ink">{f.q}</dt>
                    <dd className="mt-1.5 text-[0.98rem] leading-relaxed text-ink/75">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {trips.length > 0 && (
            <section className="mt-12 rounded-3xl border border-line bg-card p-6 shadow-card">
              <p className="font-script text-2xl text-brand">go and see it</p>
              <ul className="mt-4 space-y-3">
                {trips.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/trips/${t.slug}`} className="group flex items-baseline justify-between gap-4 border-b border-line/70 pb-3">
                      <span className="font-display text-lg font-extrabold leading-tight text-ink group-hover:text-brand">{t.name}</span>
                      <span className="shrink-0 text-sm font-bold text-ink/70">
                        {t.price != null ? `from ${inr(t.price)}` : t.nights}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 border-t border-line pt-8">
            <Link href="/stories" className="text-sm font-bold text-brand hover:text-brand-bright">← All stories</Link>
          </div>
        </article>

        {/* more */}
        {more.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
            <p className="mb-6 text-[0.62rem] font-bold uppercase tracking-[0.35em] text-ink/45">keep reading</p>
            <div className="grid gap-6 sm:grid-cols-3">
              {more.map((p) => (
                <Link key={p.slug} href={`/stories/${p.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-transform hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SiteMedia src={p.cover} alt="" fill sizes="30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-extrabold leading-tight text-ink group-hover:text-brand">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </>
  );
}
