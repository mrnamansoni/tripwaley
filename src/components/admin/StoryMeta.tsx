"use client";

/* The SEO half of a story: what it is, where it is about, and the search it
   is meant to own. The site has read these fields since build 1 — until now
   nothing could write them except a script on the server. */

import type { BlogPost } from "@/lib/types";
import { STORY_KINDS, duplicateKeywords } from "@/lib/stories";
import { DESTINATIONS } from "@/lib/destinations";
import { Field, Area, input, label } from "./ui";

export default function StoryMeta({
  post,
  all,
  onChange,
}: {
  post: BlogPost;
  all: BlogPost[];
  onChange: (patch: Partial<BlogPost>) => void;
}) {
  const picked = post.destinations ?? [];
  const toggle = (slug: string) =>
    onChange({ destinations: picked.includes(slug) ? picked.filter((s) => s !== slug) : [...picked, slug] });

  /* A warning, never a block: the owner decided a story is never refused for
     sharing a keyword. They are told, and they choose. */
  const clash = duplicateKeywords(all).get((post.keyword ?? "").trim().toLowerCase().replace(/\s+/g, " "));
  const others = (clash ?? []).filter((s) => s !== post.slug);

  const words = (post.body ?? "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <label className={label}>topic
        <select value={post.kind ?? "report"} onChange={(e) => onChange({ kind: e.target.value as BlogPost["kind"] })} className={input}>
          {STORY_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>{k.label} — {k.blurb}</option>
          ))}
        </select>
      </label>

      <div>
        <Field l="keyword this story should own" v={post.keyword ?? ""} on={(v) => onChange({ keyword: v })} />
        {others.length > 0 && (
          <p className="mt-1 text-[0.68rem] text-gold">
            Also used by {others.join(", ")} — two pages chasing one search usually means neither wins.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <p className={label}>destinations — where this story is about</p>
        <p className="mt-1 text-[0.68rem] text-white/40">
          This is what puts the story on a trip page. Untagged, it only appears under Stories.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DESTINATIONS.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => toggle(d.slug)}
              className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${
                picked.includes(d.slug) ? "bg-gold text-ink" : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <Area l="short answer (shown above the story, and on cards)" v={post.summary ?? ""} on={(v) => onChange({ summary: v })} rows={3} />
        <p className="mt-1 text-[0.68rem] text-white/40">
          {words} words in the body · {post.summary?.trim() ? "has a short answer" : "no short answer yet"} · {post.faqs?.length ?? 0} questions
        </p>
      </div>
    </>
  );
}
