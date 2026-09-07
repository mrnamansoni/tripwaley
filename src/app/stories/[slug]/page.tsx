import type { Metadata } from "next";
import SiteMedia from "@/components/site/SiteMedia";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import CurtainFooter from "@/components/site/CurtainFooter";
import { getPost, getPosts, getSettings, shortDate, normalizeMediaUrl } from "@/lib/catalog";
import { canonical } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/schema";

/** first ~155 characters of real prose, cut on a word boundary */
function summarise(body: string): string {
  const flat = (body ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= 155) return flat;
  return flat.slice(0, 152).replace(/\s+\S*$/, "") + "…";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Story not found | Tripwaley" };
  /* Every published story shipped with an EMPTY meta description, because each
     one has a blank `excerpt` and this read it directly. Google then wrote its
     own snippet for the whole blog. Falling back to the opening of the body
     means a description can never be missing again, whatever the admin field
     holds. */
  const description = post.excerpt?.trim() || summarise(post.body);
  return {
    ...canonical(`/stories/${post.slug}`),
    title: `${post.title} | Tripwaley Stories`,
    description,
    openGraph: { title: post.title, description, images: [{ url: normalizeMediaUrl(post.cover) }], type: "article" },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const settings = getSettings();
  const paras = post.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const more = getPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

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
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">{post.author} · {shortDate(post.date)}</p>
          </div>
        </section>

        {/* body */}
        <article className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
          {post.excerpt && <p className="mb-8 border-l-2 border-brand pl-5 font-display text-xl font-bold leading-snug text-ink/80">{post.excerpt}</p>}
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/80">
            {paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
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
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </>
  );
}
