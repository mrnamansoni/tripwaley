"use client";

/* Opens the page's <BookingBar> modal, optionally on a specific date.
 *
 * Exists so server-rendered cards — the creator trip page's departure list —
 * can start a real booking instead of linking out to WhatsApp. It carries no
 * state of its own; the bar owns the flow. */

import { BOOK_EVENT } from "./BookingBar";

export default function BookSeatButton({
  date,
  className,
  children,
}: {
  /** preselects this departure in the bar */
  date?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(BOOK_EVENT, { detail: { date } }))}
    >
      {children}
    </button>
  );
}
