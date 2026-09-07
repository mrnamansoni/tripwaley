import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Clause, PolicyPreamble } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/catalog";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  ...canonical("/shipping-policy"),
  title: "Service Delivery & Shipping Policy | Tripwaley",
  description:
    "Tripwaley sells travel services, not physical goods. How your booking confirmation, itinerary and trip documents are delivered, and when.",
};

const UPDATED = "2026-08-18";

export default function ShippingPolicyPage() {
  const s = getSettings();
  const entity = s.legalName || s.brand;

  return (
    <LegalPage
      kicker="nothing gets couriered"
      title="Service Delivery & Shipping Policy"
      updated={UPDATED}
      grievance
      intro={`${entity} sells travel services. There is no physical product to ship — everything you receive is delivered electronically, and the trip itself is delivered in person on the departure date.`}
    >
      <PolicyPreamble what="shipping and service delivery policy" />

      <Clause n={1} title="What this policy covers">
        <p>
          This shipping policy outlines how what you buy on the Platform reaches you. Because the Platform
          sells a travel service rather than a physical product, &ldquo;delivery&rdquo; here means two
          things: the booking documents that reach you electronically, and the departure itself, performed on
          its scheduled date.
        </p>
      </Clause>

      <Clause n={2} title="We do not ship physical goods">
        <p>
          {entity} sells seats on group departures. We do not sell, stock or dispatch any physical product, so
          no courier, shipping charge, tracking number or delivery address is involved in any purchase on this
          site.
        </p>
      </Clause>

      <Clause n={3} title="What you receive, and when">
        <ul>
          <li>
            <strong>Immediately on payment</strong> — an on-screen confirmation with your booking ID and the
            amount paid.
          </li>
          <li>
            <strong>Within 24 hours</strong> — a written booking confirmation on WhatsApp and email, listing
            your departure date, boarding city, occupancy and the balance due.
          </li>
          <li>
            <strong>Within 3 working days</strong> — the detailed itinerary, packing list and inclusions for
            your specific batch.
          </li>
          <li>
            <strong>2 to 5 days before departure</strong> — your boarding point and time, trip captain&apos;s
            contact number, and the batch WhatsApp group invite.
          </li>
        </ul>
        <p>
          All of it arrives electronically, at the phone number and email address given when booking. Nothing
          requires a physical address.
        </p>
      </Clause>

      <Clause n={4} title="Delivery of the service itself">
        <p>
          The service is delivered on the departure date stated on your confirmation, beginning at the
          boarding point and time we share with you, and ending when the batch returns to that city.
        </p>
        <p>
          Where an itinerary must change mid-trip for safety, weather or permit reasons, clause 6 of our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> applies.
        </p>
      </Clause>

      <Clause n={5} title="If something does not arrive">
        <p>
          If you have paid and not received a written confirmation within 24 hours, contact us with the
          booking ID shown on your payment screen. Payment confirmation messages occasionally fail because of
          a mistyped number or an overzealous spam filter — we will resend immediately and correct the record.
        </p>
        <p>
          A booking is valid from the moment your payment is confirmed, whether or not the message reached
          you. You are never at risk of losing a paid seat because a WhatsApp message failed to deliver.
        </p>
      </Clause>

      <Clause n={6} title="Confirmation, and limits on our liability for delay">
        <p>
          <strong>
            Delivery of our services is confirmed on the email ID and mobile number you provide at the time
            of booking.
          </strong>{" "}
          It is your responsibility to give us contact details that are correct and monitored; we are not
          responsible for a confirmation that fails to reach an address or number entered incorrectly.
        </p>
        <p>
          Departure timings depend on road, weather and permit conditions outside our control. The Platform
          Owner shall not be liable for any delay caused by such conditions, by a transport operator, or by a
          government or permit authority, beyond the remedies set out in our{" "}
          <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.
        </p>
      </Clause>

      <Clause n={7} title="Charges">
        <p>
          There are no shipping, handling, courier or delivery charges of any kind. The seat price shown on
          the trip page, plus applicable taxes, is the whole cost of the service. Where any charge of this
          nature is ever levied and separately disclosed to you, it is not refundable.
        </p>
      </Clause>
    </LegalPage>
  );
}
