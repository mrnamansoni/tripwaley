"use client";

/* One IntersectionObserver for every background video on the page.
 *
 * <video autoplay loop> keeps decoding while scrolled off-screen in most
 * browsers — on a phone that is pure battery and data burn, and with several
 * loops on a long page it visibly costs frames. This pauses each one the
 * moment it leaves the viewport and resumes it on the way back.
 *
 * Mounted once in the root layout; it finds videos by the data attribute
 * <SiteMedia> stamps on them, including ones added after navigation.
 */

import { useEffect } from "react";

export default function VideoAutoPause() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && !reduced.matches) void v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.01 }
    );

    // re-observing an element the observer already holds is a no-op, so a
    // plain re-scan after DOM changes is safe and keeps this simple
    const scan = () => {
      for (const v of document.querySelectorAll<HTMLVideoElement>("video[data-tw-video]")) io.observe(v);
    };
    scan();

    /* Rescan on DOM changes, but coalesce: this page runs GSAP timelines that
       mutate the tree on every frame, so an un-debounced callback would run
       hundreds of times a second for nothing. */
    let queued = 0;
    const mo = new MutationObserver((records) => {
      if (queued) return;
      const addedElements = records.some((r) => Array.from(r.addedNodes).some((n) => n.nodeType === 1));
      if (!addedElements) return;
      queued = window.setTimeout(() => {
        queued = 0;
        scan();
      }, 300);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    /* Someone turning on Reduce Motion mid-session should stop the loops. */
    const onReduced = () => {
      for (const v of document.querySelectorAll<HTMLVideoElement>("video[data-tw-video]")) {
        if (reduced.matches) v.pause();
        else void v.play().catch(() => {});
      }
    };
    reduced.addEventListener("change", onReduced);

    return () => {
      io.disconnect();
      mo.disconnect();
      if (queued) clearTimeout(queued);
      reduced.removeEventListener("change", onReduced);
    };
  }, []);

  return null;
}
