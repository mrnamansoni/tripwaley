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
import sharp from "sharp";
import { sameOrigin } from "@/lib/auth";
import { listMedia, saveMedia } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ media: listMedia() });
}

/* The public site was never the problem: next/image re-encodes every photo to
   AVIF/WebP on the way out, so a visitor never downloads the raw upload. What
   WAS uncompressed is the SOURCE sitting on the volume — a phone photo lands
   here at 3-5 MB and stayed exactly that size forever, which is what "images
   are uploading in high KB" actually meant (the admin library shows raw
   bytes, and the volume was filling up with full-resolution originals).
   compressImage() below fixes the source side; the accepted-size cap can be
   generous now because compression, not rejection, is the answer to a big
   photo. */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

/* Deliberately format-preserving — never changes the extension:
   - saveMedia()'s replace-in-place path requires the new bytes to match the
     existing file's extension, so switching format here would break Replace.
   - a cutout PNG's alpha edges must survive uploading; recompressing PNG as
     lossless (no palette reduction) can't degrade them, only shrink them.
   The real win is the dimension cap: source photos over ~2560px on the long
   edge cost real size for zero visual benefit — next.config.ts's optimizer
   never serves wider than 1920px, so anything beyond ~2560px is pure waste. */
async function compressImage(buf: Buffer, ext: "jpg" | "png" | "webp"): Promise<Buffer> {
  const img = sharp(buf, { limitInputPixels: 268402689 }).rotate(); // .rotate() bakes in EXIF orientation
  const resized = img.resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true });
  switch (ext) {
    case "jpg":
      return resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    case "webp":
      return resized.webp({ quality: 82 }).toBuffer();
    case "png":
      // lossless recompression only (no `quality`/`palette`) — those quantize
      // colour depth, which is exactly what would fray a cutout's edges
      return resized.png({ compressionLevel: 9 }).toBuffer();
  }
}

type Ext = "jpg" | "png" | "webp" | "mp4" | "webm" | "mov";

function sniff(buf: Buffer): { ext: Ext; kind: "image" | "video" } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", kind: "image" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", kind: "image" };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { ext: "webp", kind: "image" };
  // ISO base media (mp4 / m4v / mov): "ftyp" box at offset 4, brand at 8
  if (buf.length > 12 && buf.subarray(4, 8).toString() === "ftyp") {
    const brand = buf.subarray(8, 12).toString().toLowerCase();
    return { ext: brand.startsWith("qt") ? "mov" : "mp4", kind: "video" };
  }
  // Matroska / WebM EBML header
  if (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { ext: "webm", kind: "video" };
  }
  return null;
}

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
