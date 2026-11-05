/**
 * Media manager endpoint.
 * GET  → library listing (public/images + public/uploads)
 * POST → multipart upload, photo OR video. With `replacePath`, overwrites that
 *        exact file IN PLACE — every page using it updates site-wide. Without
 *        it, the file lands in /uploads for the pickers.
 * Magic-byte sniffing, per-kind size caps, path-traversal-proof resolution.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sameOrigin } from "@/lib/auth";
import { listMedia, saveMedia } from "@/lib/store";
import { compressImage, sniff } from "@/lib/mediaProcess";

export async function GET() {
  return NextResponse.json({ media: listMedia() });
}

/* The public site was never the problem: next/image re-encodes every photo to
   AVIF/WebP on the way out, so a visitor never downloads the raw upload. What
   WAS uncompressed is the SOURCE sitting on the volume — a phone photo lands
   here at 3-5 MB and stayed exactly that size forever, which is what "images
   are uploading in high KB" actually meant (the admin library shows raw
   bytes, and the volume was filling up with full-resolution originals).
   compressImage() (lib/mediaProcess) fixes the source side; the accepted-size cap can be
   generous now because compression, not rejection, is the answer to a big
   photo. */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniff(buf);
  if (!sniffed) return NextResponse.json({ error: "only jpg / png / webp photos, or mp4 / webm / mov video" }, { status: 415 });

  const cap = sniffed.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > cap) {
    return NextResponse.json(
      { error: `${sniffed.kind === "video" ? "Video" : "Photo"} is too large — max ${Math.round(cap / 1024 / 1024)} MB` },
      { status: 413 }
    );
  }

  let toStore: Buffer = buf;
  if (sniffed.kind === "image") {
    try {
      toStore = await compressImage(buf, sniffed.ext as "jpg" | "png" | "webp");
    } catch {
      // a source sharp can't parse (truncated file, exotic colour profile) —
      // fall back to the original bytes rather than fail the whole upload
      toStore = buf;
    }
  }

  const replacePath = form.get("replacePath");
  try {
    const path = saveMedia(toStore, {
      replacePath: typeof replacePath === "string" && replacePath ? replacePath : undefined,
      name: file.name,
      ext: sniffed.ext,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, path, kind: sniffed.kind, bytes: toStore.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "save failed" }, { status: 400 });
  }
}
