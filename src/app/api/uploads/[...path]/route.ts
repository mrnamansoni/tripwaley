/**
 * Live disk-read server for /uploads/* — routed here by the beforeFiles
 * rewrite in next.config.ts, ahead of Next's normal public-folder serving.
 *
 * ROOT CAUSE this works around: Next 16's production server resolves
 * `public/` requests against a list of files captured when the server
 * process starts. A file the admin uploads at runtime — after that
 * process has already booted — is written to disk correctly (confirmed:
 * valid bytes, correct permissions) but is invisible to that resolver,
 * so the request falls through to the App Router's not-found page. It
 * only starts working again after the next full process restart.
 *
 * Restarting on every upload isn't viable (drops in-flight requests), and
 * there's no supported way to invalidate that internal list from app code.
 * So instead: this route reads the file straight off disk on every single
 * request — no list, no cache of its own — and the rewrite makes sure
 * traffic for /uploads/* reaches it instead of the broken path. Every
 * existing `/uploads/xxx.jpg` reference across the site keeps working
 * unchanged; this is purely how the bytes get served.
 *
 * /images/* (the seed photos baked into the Docker image) doesn't need
 * this: those files exist before the process ever boots, so they were
 * always inside whatever list gets captured at startup.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { Readable } from "node:stream";
import { resolvePublicMedia } from "@/lib/store";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const webPath = `/uploads/${segments.join("/")}`;

  // same traversal + extension guard the upload/replace API already trusts
  const abs = resolvePublicMedia(webPath);
  if (!abs || !fs.existsSync(abs)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stat = fs.statSync(abs);
  const ext = webPath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  // short, not zero: long enough to dedupe a page load's fan-out of
  // requests for the same file, short enough that Replace-in-place shows
  // up quickly — the same tradeoff next.config.ts makes for the image
  // optimizer's minimumCacheTTL.
  const cacheControl = "public, max-age=60";

  // Range support: video needs this to seek/scrub; large photos benefit
  // from it too. Without it, browsers can still play a video from the
  // start but scrubbing ahead breaks.
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
    if (start >= stat.size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${stat.size}` } });
    }
    const stream = fs.createReadStream(abs, { start, end });
    return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 206,
      headers: {
        "content-range": `bytes ${start}-${end}/${stat.size}`,
        "accept-ranges": "bytes",
        "content-length": String(end - start + 1),
        "content-type": contentType,
        "cache-control": cacheControl,
      },
    });
  }

  const stream = fs.createReadStream(abs);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "content-length": String(stat.size),
      "content-type": contentType,
      "accept-ranges": "bytes",
      "cache-control": cacheControl,
    },
  });
}
