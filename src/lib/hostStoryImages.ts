/* STORY PHOTOS ON OUR OWN DOMAIN.
 *
 * A story cover pasted as a Google Drive share link rendered fine, but the
 * BlogPosting schema, the og:image and Google Images all pointed at Drive,
 * and Drive serves the original file with no resize. So when a story is
 * saved, any Drive photo it uses (cover or inline ![photo](…)) is copied into
 * /uploads and the reference rewritten to that path.
 *
 * Only the Drive file id is taken from the pasted text: the download address
 * is built here, so a pasted link can never point this server at an
 * arbitrary host. A photo that cannot be fetched keeps its Drive link and the
 * save still goes through — the admin is told, not blocked. */

import type { BlogPost } from "./types";
import { driveId } from "./types";
import { localDrivePath } from "./localDriveImages";
import { saveMedia } from "./store";
import { compressImage, sniff } from "./mediaProcess";

const MAX_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

async function pull(id: string): Promise<string | null> {
  /* already on the volume from scripts/pull-drive-images.mjs */
  const known = localDrivePath(id);
  if (known) return known;
  try {
    const res = await fetch(`https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w2560`, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return null;
    const kind = sniff(buf);
    if (!kind || kind.kind !== "image") return null;
    const ext = kind.ext as "jpg" | "png" | "webp";
    let out: Buffer = buf;
    try { out = await compressImage(buf, ext); } catch { /* keep the original bytes */ }
    return saveMedia(out, { name: `story-${id.slice(0, 8)}`, ext });
  } catch {
    return null;
  }
}

const BODY_IMAGE = /(!\[[^\]\n]*\]\(\s*)([^)\s]+)(\s*\))/g;

/** Rewrites Drive photos in the given stories to /uploads copies, in place.
 *  Returns the refs that could not be copied. */
export async function hostStoryImages(posts: BlogPost[]): Promise<string[]> {
  const ids = new Set<string>();
  for (const p of posts) {
    const c = driveId(p.cover ?? "");
    if (c) ids.add(c);
    for (const m of (p.body ?? "").matchAll(BODY_IMAGE)) {
      const id = driveId(m[2]);
      if (id) ids.add(id);
    }
  }
  if (!ids.size) return [];

  const hosted = new Map<string, string>();
  const failed: string[] = [];
  /* a few at a time: a story save should not open dozens of sockets */
  const queue = [...ids];
  await Promise.all(
    Array.from({ length: Math.min(3, queue.length) }, async () => {
      for (let id = queue.shift(); id; id = queue.shift()) {
        const path = await pull(id);
        if (path) hosted.set(id, path);
        else failed.push(id);
      }
    })
  );

  const swap = (ref: string) => {
    const id = driveId(ref);
    return (id && hosted.get(id)) || ref;
  };
  for (const p of posts) {
    if (p.cover) p.cover = swap(p.cover);
    if (p.body) p.body = p.body.replace(BODY_IMAGE, (_, a: string, src: string, b: string) => a + swap(src) + b);
  }
  return failed;
}
