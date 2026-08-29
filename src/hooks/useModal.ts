"use client";

/* Shared dialog behaviour.
 *
 * Both weak modals already announce aria-modal="true", which tells a screen
 * reader the rest of the page is inert — but nothing moved focus into them or
 * kept it there, so a keyboard user tabbed straight out into content they had
 * just been told did not exist, with no Escape route. That combination is
 * worse than having no aria-modal at all.
 *
 * HoldSeatModal already did this correctly; this is that behaviour extracted
 * so the other dialogs get it too.
 */

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useModal<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  // where focus was before the dialog opened, so it can be handed back
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    restoreTo.current = document.activeElement as HTMLElement | null;

    // focus the first real control, not the container — a screen reader
    // should land on something actionable
    const first = root?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? root)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;

      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!items.length) return;

      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      // wrap at both ends so Tab can never leave the dialog
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
