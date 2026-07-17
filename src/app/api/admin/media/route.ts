/**
 * Media manager endpoint.
 * GET  → library listing (public/images + public/uploads)
 * POST → multipart upload. With `replacePath`, overwrites that exact file
 *        IN PLACE — every page using the photo updates site-wide. Without
 *        it, the file lands in /uploads for the package-gallery picker.
 * Magic-byte sniffing, 6 MB cap, path-traversal-proof target resolution.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sameOrigin } from "@/lib/auth";
import { listMedia, saveImage } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ media: listMedia() });
}

const MAX_BYTES = 6 * 1024 * 1024;

function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
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
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "max 6 MB" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return NextResponse.json({ error: "only jpg / png / webp" }, { status: 415 });

  const replacePath = form.get("replacePath");
  try {
    const path = saveImage(buf, {
      replacePath: typeof replacePath === "string" && replacePath ? replacePath : undefined,
      name: file.name,
      ext: kind === "jpg" ? "jpg" : kind,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "save failed" }, { status: 400 });
  }
}
