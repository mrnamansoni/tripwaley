/* Media bytes: what a file really is, and the size it is kept at. Shared by
   the upload endpoint and the story save that copies Drive photos onto
   tripwaley.com. */

import sharp from "sharp";

/* Deliberately format-preserving — never changes the extension:
   - saveMedia()'s replace-in-place path requires the new bytes to match the
     existing file's extension, so switching format here would break Replace.
   - a cutout PNG's alpha edges must survive uploading; recompressing PNG as
     lossless (no palette reduction) can't degrade them, only shrink them.
   The real win is the dimension cap: source photos over ~2560px on the long
   edge cost real size for zero visual benefit — next.config.ts's optimizer
   never serves wider than 1920px, so anything beyond ~2560px is pure waste. */
export async function compressImage(buf: Buffer, ext: "jpg" | "png" | "webp"): Promise<Buffer> {
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

export type Ext = "jpg" | "png" | "webp" | "mp4" | "webm" | "mov";

export function sniff(buf: Buffer): { ext: Ext; kind: "image" | "video" } | null {
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
