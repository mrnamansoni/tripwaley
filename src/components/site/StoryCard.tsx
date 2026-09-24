import Link from "next/link";
import SiteMedia from "./SiteMedia";
import type { BlogPost } from "@/lib/types";
import { storyKind, readingMinutes, STORY_KINDS } from "@/lib/stories";
import { shortDate } from "@/lib/catalog";

export default function StoryCard({ post }: { post: BlogPost }) {
  const label = STORY_KINDS.find((k) => k.kind === storyKind(post))?.label;
  return (
    <Link href={`/stories/${post.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-transform hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <SiteMedia src={post.cover} alt="" fill sizes="(max-width:640px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.25em] text-brand">{label}</p>
        <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink transition-colors group-hover:text-brand">{post.title}</h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink/65">{post.summary || post.excerpt}</p>
        <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-widest text-ink/55">
          {shortDate(post.date)} · {readingMinutes(post.body)} min read
        </p>
      </div>
    </Link>
  );
}
