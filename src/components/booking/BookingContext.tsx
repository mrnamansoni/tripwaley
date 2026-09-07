"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import HoldSeatModal from "./HoldSeatModal";

export type BookingMode = "hold" | "token";

/** Real, bookable trip for the Hold-my-seat dropdown (fed from the catalog). */
export interface BookingTrip {
  slug: string;
  name: string;
  dateLabel: string; // next departure, e.g. "12 Jul" — or "flexible dates"
  /** the SAME departure as an ISO date, "" when there isn't one. The modal used
   *  to submit `dateLabel`, so /api/lead's 10-char cap turned "flexible dates"
   *  into "flexible d" and the CRM received "12 Jul" — no year, unparseable —
   *  in a field every consumer treats as ISO. */
  date: string;
  priceFrom: number; // 0 = "on request"
}

/** the three percentages the booking ladder runs on, resolved server-side */
export interface BookingRates { holdPercent: number; gstPercent: number; advancePercent: number }

interface BookingState {
  open: (mode: BookingMode, trip?: string) => void;
  /** the real, admin-configured WhatsApp number (digits) — so header/nav
   *  WhatsApp links never fall back to a hardcoded placeholder. */
  whatsapp: string;
  waLink: (text: string) => string;
}

const BookingCtx = createContext<BookingState | null>(null);

export function useBooking(): BookingState {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

/** Global provider so any section (hero card, bento, CTA band) can launch booking.
 *  `trips` is resolved server-side (real packages + next departures) and handed
 *  to the modal so the dropdown never shows placeholder destinations. */
export function BookingProvider({
  children,
  trips = [],
  whatsapp = "",
  rates,
  defaultCity = "",
  payEnabled = false,
}: {
  children: ReactNode;
  trips?: BookingTrip[];
  whatsapp?: string;
  rates: BookingRates;
  /** the city a modal-opened hold is priced from — the modal has no city picker */
  defaultCity?: string;
  /** false when PhonePe isn't configured; then the modal offers no payment */
  payEnabled?: boolean;
}) {
  const [modal, setModal] = useState<{ mode: BookingMode; trip?: string } | null>(null);

  const open = useCallback((mode: BookingMode, trip?: string) => {
    setModal({ mode, trip });
  }, []);

  const value = useMemo(
    () => ({
      open,
      whatsapp,
      waLink: (text: string) => `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
    }),
    [open, whatsapp]
  );

  return (
    <BookingCtx.Provider value={value}>
      {children}
      {modal && (
        <HoldSeatModal
          mode={modal.mode}
          initialTrip={modal.trip}
          trips={trips}
          rates={rates}
          defaultCity={defaultCity}
          payEnabled={payEnabled}
          onClose={() => setModal(null)}
        />
      )}
    </BookingCtx.Provider>
  );
}
