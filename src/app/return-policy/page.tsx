import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Clause } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Return Policy | Tripwaley",
  description:
    "Tripwaley sells travel services with no physical goods, so nothing can be returned. Bookings are cancelled and refunded instead, under our Cancellation & Refund Policy.",
};

const UPDATED = "2026-08-18";

export default function ReturnPolicyPage() {
  const s = getSettings();
  const entity = s.legalName || s.brand;

  return (
    <LegalPage
      kicker="there is nothing to send back"
      title="Return Policy"
      updated={UPDATED}
      intro={`${entity} sells travel services, not physical products. Because nothing is shipped, nothing can be returned — a booking is cancelled and refunded instead.`}
    >
      <Clause n={1} title="No goods, so no returns">
        <p>
          Every purchase on this site is a seat on a group departure — a service, delivered on a fixed date.
          No physical item is dispatched to you at any point, so there is nothing to return, exchange or send
          back, and no return shipping address exists.
        </p>
      </Clause>

      <Clause n={2} title="Cancellation replaces returns">
        <p>
          What would be a &ldquo;return&rdquo; for a physical product is a{" "}
          <strong>cancellation</strong> here. If you no longer want a booked seat, cancel it — and you are
          refunded according to how far ahead of departure you cancel.
        </p>
        <p>
          The full slab, the timelines and the method of refund are in our{" "}
          <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>. In short: cancel 7 or more days
          before departure and you get 100% back.
        </p>
      </Clause>

      <Clause n={3} title="Changing your date instead">
        <p>
          You are not limited to cancelling. A one-time move to another departure of the same trip is free
          when requested 7 or more days ahead, subject to seats. Many travellers use this rather than
          cancelling outright.
        </p>
      </Clause>

      <Clause n={4} title="If the trip was not what we promised">
        <p>
          If an inclusion listed on your trip page was not delivered — a stay category, a named meal, or
          transport we committed to — tell us within 7 days of returning, with your booking ID.
        </p>
        <p>
          We investigate with the supplier and, where we got it wrong, refund the value of the missing
          inclusion to your original payment method. This is separate from the cancellation slab and is not
          time-barred by your departure date.
        </p>
      </Clause>
    </LegalPage>
  );
}
