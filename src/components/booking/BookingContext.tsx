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
  priceFrom: number; // 0 = "on request"
}

interface BookingState {
  open: (mode: BookingMode, trip?: string) => void;
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
export function BookingProvider({ children, trips = [] }: { children: ReactNode; trips?: BookingTrip[] }) {
  const [modal, setModal] = useState<{ mode: BookingMode; trip?: string } | null>(null);

  const open = useCallback((mode: BookingMode, trip?: string) => {
    setModal({ mode, trip });
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <BookingCtx.Provider value={value}>
      {children}
      {modal && (
        <HoldSeatModal
          mode={modal.mode}
          initialTrip={modal.trip}
          trips={trips}
          onClose={() => setModal(null)}
        />
      )}
    </BookingCtx.Provider>
  );
}
