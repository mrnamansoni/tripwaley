"use client";

/* Blog / stories editor. Posts live in catalog.posts and render at
   /stories and /stories/[slug]. Body is plain text — blank lines split
   paragraphs on the site. */

import { useState } from "react";
import { useAdmin, Btn, Head, Field, Area, input, label } from "./ui";
import MediaPicker from "./MediaPicker";
import StoryMeta from "./StoryMeta";
import StoryFaqs from "./StoryFaqs";
import { isStoryLive } from "@/lib/stories";
import type { BlogPost } from "@/lib/types";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function StoriesEditor() {
  const { data, save } = useAdmin();
  const [posts, setPosts] = useState<BlogPost[]>(data.catalog.posts ?? []);
  /* The server writes fields this editor has no control for — oldSlugs from
     the rename cascade, and later the draft writer's own. save() reloads the
     provider, so re-seed from it whenever its posts array gets a new identity
     (i.e. after every successful save): without this, the NEXT save would PUT
     the pre-save rows and wipe them. Adjusting state during render (rather
     than in a useEffect) is React's own documented pattern for "reset state
     when a prop changes" — it avoids the extra commit a useEffect would need,
     and this repo's lint (react-hooks/set-state-in-effect) rejects the effect
     form outright. */
  const [seededFrom, setSeededFrom] = useState(data.catalog.posts);
  if (seededFrom !== data.catalog.posts) {
    setSeededFrom(data.catalog.posts);
    setPosts(data.catalog.posts ?? []);
  }

  // Identified by position, not slug: the slug field rewrites live on every
  // keystroke, and a backspace can transiently equal another story's slug.
  // Matching by slug there would edit two rows at once.
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const open = openIdx != null ? posts[openIdx] ?? null : null;
  const upd = (patch: Partial<BlogPost>) =>
    setPosts((all) => all.map((p, i) => (i === openIdx ? { ...p, ...patch } : p)));

  const addNew = () => {
    const slug = `new-story-${posts.length + 1}`;
    setPosts((all) => [
      { slug, title: "New story", excerpt: "", cover: "/images/group-mountains.jpg", body: "", author: "Tripwaley", date: new Date().toISOString().slice(0, 10), tags: [], published: false },
      ...all,
    ]);
    setOpenIdx(0);
  };

  if (!open) {
    return (
      <>
        <Head title="Stories" sub="Blog posts for /stories. Draft = hidden from the site.">
          <Btn tone="ghost" onClick={addNew}>+ New story</Btn>
          <Btn onClick={() => save("posts", posts)}>Save all</Btn>
        </Head>
        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {posts.map((p, i) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => setOpenIdx(i)} className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold">
                {p.title}
                <span className="ml-2 font-mono text-[0.6rem] text-white/35">/stories/{p.slug}</span>
              </button>
              <span className="hidden text-xs text-white/40 sm:block">{p.date}</span>
              <button
                type="button"
                onClick={() => setPosts((all) => all.map((x) => (x.slug === p.slug ? { ...x, published: !x.published, status: !x.published ? "published" : "draft" } : x)))}
                className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${isStoryLive(p) ? "bg-success/20 text-success" : "bg-white/10 text-white/45"}`}
              >
                {isStoryLive(p) ? "published" : "draft"}
              </button>
              <Btn tone="ghost" onClick={() => setOpenIdx(i)}>edit →</Btn>
            </div>
          ))}
          {posts.length === 0 && <p className="px-4 py-8 text-center text-white/35">No stories yet — write your first.</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={open.title} sub={`/stories/${open.slug}`}>
        <Btn tone="ghost" onClick={() => setOpenIdx(null)}>← Back</Btn>
        <Btn tone="danger" onClick={() => { setPosts((all) => all.filter((_, i) => i !== openIdx)); setOpenIdx(null); }}>Delete</Btn>
        <Btn onClick={async () => { if (await save("posts", posts)) setOpenIdx(null); }}>Save all stories</Btn>
      </Head>
      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        <Field l="title" v={open.title} on={(v) => upd({ title: v })} />
        <Field l="slug (url)" v={open.slug} on={(v) => upd({ slug: slugify(v) })} />
        <Field l="author" v={open.author} on={(v) => upd({ author: v })} />
        <Field l="date" v={open.date} type="date" on={(v) => upd({ date: v })} />
        <label className={label}>status
          <select
            value={isStoryLive(open) ? "1" : "0"}
            /* `published` is what the site actually obeys (isStoryLive), and
               `status` is what the draft writer will set in build 3. Write
               both together so they can never disagree. */
            onChange={(e) => {
              const live = e.target.value === "1";
              upd({ published: live, status: live ? "published" : "draft" });
            }}
            className={input}
          >
            <option value="1">published — live</option>
            <option value="0">draft — hidden</option>
          </select>
        </label>
        <Field l="tags (comma separated)" v={open.tags.join(", ")} on={(v) => upd({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
        <StoryMeta post={open} all={posts} onChange={upd} />
        <StoryFaqs faqs={open.faqs ?? []} onChange={(faqs) => upd({ faqs })} />
        <div className="sm:col-span-2"><Area l="excerpt (card + preview)" v={open.excerpt} on={(v) => upd({ excerpt: v })} rows={2} /></div>
        <div className="sm:col-span-2">
          <MediaPicker label="cover photo" value={open.cover} onChange={(p) => upd({ cover: p })} aspect="aspect-[16/9]" />
        </div>
        <div className="sm:col-span-2">
          <Area l="body (blank line = new paragraph)" v={open.body} on={(v) => upd({ body: v })} rows={14} />
        </div>
      </div>
    </>
  );
}
