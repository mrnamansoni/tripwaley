import type { Metadata } from "next";
import LegalPage, { Clause } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Privacy Policy | Tripwaley",
  description:
    "What personal data Tripwaley collects, why we collect it, who it is shared with, how long we keep it and the rights you have over it.",
};

const UPDATED = "2026-08-18";

export default function PrivacyPage() {
  const s = getSettings();
  const entity = s.legalName || s.brand;

  return (
    <LegalPage
      kicker="your data, plainly explained"
      title="Privacy Policy"
      updated={UPDATED}
      intro={`What ${entity} collects when you browse this site or book a trip, why we need it, and what you can ask us to do with it.`}
    >
      <Clause n={1} title="What we collect">
        <ul>
          <li>
            <strong>What you give us.</strong> Name, phone number, email, boarding city, departure date,
            occupancy and traveller count when you hold a seat or book. For permitted regions we also collect
            government ID details, because the permit authority requires them.
          </li>
          <li>
            <strong>What we collect automatically.</strong> Pages viewed, approximate location from your IP,
            device and browser type, and how you arrived at the site.
          </li>
          <li>
            <strong>What we never collect.</strong> Full card numbers, CVV, UPI PIN or bank passwords. Those
            go directly to our payment gateway and are never visible to us or stored on our servers.
          </li>
        </ul>
      </Clause>

      <Clause n={2} title="Why we use it">
        <ul>
          <li>To confirm and run your booking — seats, stays, transport and permits.</li>
          <li>To contact you about your trip, including the WhatsApp group for your batch.</li>
          <li>To take payment and issue refunds through our payment gateway.</li>
          <li>To meet legal obligations, including permit and tax record-keeping.</li>
          <li>To improve the site, and — where you have not opted out — to show you relevant trip ads.</li>
        </ul>
        <p>
          We do not sell your personal data. We never share your phone number with other travellers without
          your consent.
        </p>
      </Clause>

      <Clause n={3} title="Who we share it with">
        <p>We share only what a party genuinely needs to do its job:</p>
        <ul>
          <li>
            <strong>Payment gateway</strong> — to process your payment and any refund. They act as an
            independent data controller under RBI regulation.
          </li>
          <li>
            <strong>Trip suppliers</strong> — the stays, transport operators and permit authorities on your
            specific itinerary receive the traveller names and IDs they are legally required to hold.
          </li>
          <li>
            <strong>Analytics and advertising</strong> — Google Analytics and Meta Pixel, described in clause 5.
          </li>
          <li>
            <strong>Authorities</strong> — where we are legally compelled to disclose.
          </li>
        </ul>
      </Clause>

      <Clause n={4} title="Where it is stored">
        <p>
          Booking records are held on our own server infrastructure in India, protected by access controls and
          served only over encrypted HTTPS connections. Administrative access requires an authenticated,
          signed session and is limited to our own team.
        </p>
      </Clause>

      <Clause n={5} title="Cookies, analytics and advertising">
        <p>
          This site uses cookies for essential functions such as keeping your chosen boarding city between
          pages. We also use:
        </p>
        <ul>
          <li>
            <strong>Google Analytics</strong> — aggregate statistics about how the site is used.
          </li>
          <li>
            <strong>Meta Pixel</strong> — to measure ad performance and show trips to people who have shown
            interest.
          </li>
        </ul>
        <p>
          You can block these with your browser settings, an ad blocker, or your device&apos;s ad-tracking
          controls. Blocking them does not affect your ability to browse or book.
        </p>
      </Clause>

      <Clause n={6} title="How long we keep it">
        <ul>
          <li><strong>Booking and payment records</strong> — retained as long as tax and permit law requires.</li>
          <li><strong>Enquiries that never became bookings</strong> — up to 24 months, then deleted.</li>
          <li><strong>Analytics data</strong> — per the retention period set in the analytics platform.</li>
        </ul>
      </Clause>

      <Clause n={7} title="Your rights">
        <p>You can ask us at any time to:</p>
        <ul>
          <li>tell you what personal data we hold about you;</li>
          <li>correct anything that is wrong;</li>
          <li>delete your data, where no legal obligation requires us to keep it;</li>
          <li>stop sending you marketing messages — this never affects trip-related messages for a live booking.</li>
        </ul>
        <p>
          Write to us using the details below. We respond within 30 days. There is no charge for a reasonable
          request.
        </p>
      </Clause>

      <Clause n={8} title="Children">
        <p>
          This site is not directed at children under 18, and we do not knowingly collect their data except as
          part of a booking made by a parent or guardian for a family travelling together.
        </p>
      </Clause>

      <Clause n={9} title="Security, and its limits">
        <p>
          We use HTTPS everywhere, keep payment credentials entirely off our systems, and restrict
          administrative access to authenticated sessions. No system is perfectly secure, but if a breach ever
          affects your data we will tell you and the relevant authority promptly.
        </p>
      </Clause>

      <Clause n={10} title="Changes">
        <p>
          We update this policy as the business or the law changes. The last-updated date is shown at the top
          of this page.
        </p>
      </Clause>
    </LegalPage>
  );
}
