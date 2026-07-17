"use client";

/* Blog / stories editor. Posts live in catalog.posts and render at
   /stories and /stories/[slug]. Body is plain text — blank lines split
   paragraphs on the site. */

import { useState } from "react";
import { useAdmin, Btn, Head, Field, Area, input, label } from "./ui";
import ImagePicker from "./ImagePicker";
import type { BlogPost } from "@/lib/types";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function StoriesEditor() {
  const { data, save } = useAdmin();
  const [posts, setPosts] = useState<BlogPost[]>(data.catalog.posts ?? []);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const open = posts.find((p) => p.slug === openSlug) ?? null;
  const upd = (patch: Partial<BlogPost>) =>
    setPosts((all) => all.map((p) => (p.slug === openSlug ? { ...p, ...patch } : p)));

  const addNew = () => {
    const slug = `new-story-${posts.length + 1}`;
    setPosts((all) => [
      { slug, title: "New story", excerpt: "", cover: "/images/group-mountains.jpg", body: "", author: "Tripwaley", date: new Date().toISOString().slice(0, 10), tags: [], published: false },
      ...all,
    ]);
    setOpenSlug(slug);
  };

  if (!open) {
    return (
      <>
        <Head title="Stories" sub="Blog posts for /stories. Draft = hidden from the site.">
          <Btn tone="ghost" onClick={addNew}>+ New story</Btn>
          <Btn onClick={() => save("posts", posts)}>Save all</Btn>
        </Head>
        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {posts.map((p) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => setOpenSlug(p.slug)} className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold">
                {p.title}
                <span className="ml-2 font-mono text-[0.6rem] text-white/35">/stories/{p.slug}</span>
              </button>
              <span className="hidden text-xs text-white/40 sm:block">{p.date}</span>
              <button
                type="button"
                onClick={() => setPosts((all) => all.map((x) => (x.slug === p.slug ? { ...x, published: !x.published } : x)))}
                className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${p.published ? "bg-success/20 text-success" : "bg-white/10 text-white/45"}`}
              >
                {p.published ? "published" : "draft"}
              </button>
              <Btn tone="ghost" onClick={() => setOpenSlug(p.slug)}>edit →</Btn>
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
        <Btn tone="ghost" onClick={() => setOpenSlug(null)}>← Back</Btn>
        <Btn tone="danger" onClick={() => { setPosts((all) => all.filter((p) => p.slug !== open.slug)); setOpenSlug(null); }}>Delete</Btn>
        <Btn onClick={async () => { if (await save("posts", posts)) setOpenSlug(null); }}>Save all stories</Btn>
      </Head>
      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        <Field l="title" v={open.title} on={(v) => upd({ title: v })} />
        <Field l="slug (url)" v={open.slug} on={(v) => { const s = slugify(v); setPosts((all) => all.map((p) => (p.slug === openSlug ? { ...p, slug: s } : p))); setOpenSlug(s); }} />
        <Field l="author" v={open.author} on={(v) => upd({ author: v })} />
        <Field l="date" v={open.date} type="date" on={(v) => upd({ date: v })} />
        <label className={label}>status
          <select value={open.published ? "1" : "0"} onChange={(e) => upd({ published: e.target.value === "1" })} className={input}>
            <option value="1">published — live</option>
            <option value="0">draft — hidden</option>
          </select>
        </label>
        <Field l="tags (comma separated)" v={open.tags.join(", ")} on={(v) => upd({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
        <div className="sm:col-span-2"><Area l="excerpt (card + preview)" v={open.excerpt} on={(v) => upd({ excerpt: v })} rows={2} /></div>
        <div className="sm:col-span-2">
          <ImagePicker label="cover photo" value={open.cover} onChange={(p) => upd({ cover: p })} aspect="aspect-[16/9]" />
        </div>
        <div className="sm:col-span-2">
          <Area l="body (blank line = new paragraph)" v={open.body} on={(v) => upd({ body: v })} rows={14} />
        </div>
      </div>
    </>
  );
}
