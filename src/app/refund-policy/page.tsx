import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Clause, PolicyPreamble } from "@/components/site/LegalPage";
import { getSettings, holdRates } from "@/lib/catalog";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  ...canonical("/refund-policy"),
  title: "Cancellation & Refund Policy | Tripwaley",
  description:
    "Cancellation windows, refund slabs, how refunds are processed and how long they take for Tripwaley group departures.",
};

const UPDATED = "2026-09-05";

/* The refund slab. Kept as data, not prose, because a payment gateway
   reviewer and a traveller both scan for the table — and because the owner
   will want to tune the windows without rewriting a legal paragraph. */
const SLAB: { window: string; refund: string; tone: "good" | "mid" | "bad" }[] = [
  { window: "7 days or more before departure", refund: "100% refund", tone: "good" },
  { window: "3 to 6 days before departure", refund: "50% refund", tone: "mid" },
  { window: "Less than 3 days before departure, or no-show", refund: "No refund", tone: "bad" },
];

const TONE = {
  good: "bg-success/12 text-success",
  mid: "bg-gold/15 text-ink",
  bad: "bg-brand/10 text-brand",
} as const;

export default function RefundPolicyPage() {
  const s = getSettings();
  const { holdPercent: hold, gstPercent: gst, advancePercent: advance } = holdRates();
  const entity = s.legalName || s.brand;

  return (
    <LegalPage
      kicker="plans change, we know"
      title="Cancellation & Refund Policy"
      updated={UPDATED}
      grievance
      intro={`How to cancel a booking with ${entity}, exactly how much comes back to you, and how long it takes to reach your account.`}
    >
      <PolicyPreamble what="refund and cancellation policy" />

      <Clause n={1} title="What this policy covers">
        <p>
          This refund and cancellation policy outlines how you can cancel, or seek a refund for, a service
          that you have purchased through the Platform. The service sold on this Platform is a seat on a
          fixed-date group departure. Under this policy:
        </p>
      </Clause>

      <Clause n={2} title="How to cancel">
        <p>
          Write to us on WhatsApp or email using the contact details at the bottom of this page, from the
          number or address used to book. Tell us the booking ID and the departure date.
        </p>
        <p>
          <strong>Your cancellation takes effect when we acknowledge it in writing</strong>, not when you send
          it. We acknowledge within one working day. The refund slab below is applied against the time of that
          acknowledgement.
        </p>
      </Clause>

      <Clause n={3} title="The hold you paid online">
        <p>
          The {hold}% you pay on this website{gst > 0 ? `, plus the ${gst}% GST charged on it,` : ""} holds
          your seat. It is <strong>not a separate fee</strong> — it is adjusted against the{" "}
          {advance}% advance that confirms your booking, and against the total cost of your trip.
        </p>
        <p>
          <strong>It is refundable.</strong> If you cancel, it is treated as money already paid towards the
          trip and returned under the slab below, exactly like any other payment. Where a trip is cancelled by
          us, it is refunded in full. GST already remitted to the government is refunded only to the extent we
          are able to recover it from the authorities.
        </p>
      </Clause>

      <Clause n={4} title="Refund slab">
        <p>
          The percentage below applies to the <strong>total trip cost</strong> for the traveller being
          cancelled — not just the advance paid.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[26rem] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="rounded-l-xl border-y border-l border-line bg-cream px-4 py-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ink/45">
                  when you cancel
                </th>
                <th className="rounded-r-xl border-y border-r border-line bg-cream px-4 py-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ink/45">
                  you get back
                </th>
              </tr>
            </thead>
            <tbody>
              {SLAB.map((row) => (
                <tr key={row.window}>
                  <td className="border-b border-line px-4 py-4 align-middle text-[0.92rem] text-ink/75">
                    {row.window}
                  </td>
                  <td className="border-b border-line px-4 py-4 align-middle">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[0.78rem] font-extrabold ${TONE[row.tone]}`}>
                      {row.refund}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Payment-gateway charges on the original transaction are non-refundable where the gateway does not
          return them to us. Where they do, we pass them back in full.
        </p>
      </Clause>

      <Clause n={5} title="How refunds are paid">
        <ul>
          <li>
            Refunds go back to the <strong>original payment method</strong> — the same card, UPI ID or bank
            account used to pay. We cannot redirect a refund to a different account.
          </li>
          <li>
            We initiate the refund within <strong>3 working days</strong> of acknowledging your cancellation.
          </li>
          <li>
            Your bank then takes a further <strong>5 to 7 working days</strong> to credit it. This part is
            controlled by your bank, not by us.
          </li>
          <li>We share the payment-gateway refund reference so you can track it with your bank.</li>
        </ul>
      </Clause>

      <Clause n={6} title="If we cancel the departure">
        <p>
          If <strong>we</strong> cancel a batch — insufficient group size, unsafe road or weather conditions,
          permit refusal, or any reason on our side — you choose either:
        </p>
        <ul>
          <li>a <strong>100% refund</strong> of everything you have paid us, with no deduction; or</li>
          <li>a <strong>full-value transfer</strong> to any other departure within the next 12 months.</li>
        </ul>
        <p>
          Costs you booked separately, such as flights or trains to the boarding city, are not refundable by
          us. We strongly recommend travel insurance for exactly this reason.
        </p>
      </Clause>

      <Clause n={7} title="Changing your date instead of cancelling">
        <p>
          A one-time date change to another departure of the same trip is free if requested{" "}
          <strong>7 or more days before</strong> your original departure, subject to seats being available.
          Inside 7 days, the slab in clause 4 applies instead.
        </p>
        <p>If the new departure costs more, you pay the difference. If it costs less, we refund the difference.</p>
      </Clause>

      <Clause n={8} title="Partly used trips and no-shows">
        <p>
          Once a departure has begun, unused portions — a skipped stay, a meal not taken, an activity you opt
          out of, or leaving the trip early — are not refundable, because those costs are already committed on
          your behalf.
        </p>
        <p>
          The same applies if you miss the boarding point. Contact your trip captain immediately if you are
          running late; we will help you rejoin where it is safely possible, at your own cost.
        </p>
      </Clause>

      <Clause n={9} title="Removal from a trip">
        <p>
          Where a traveller is removed from a departure under clause 7 of our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> — conduct endangering the group, illegal
          substances, or persistent disruption — no refund is due, and onward travel arrangements are the
          traveller&apos;s own responsibility.
        </p>
      </Clause>

      <Clause n={10} title="If the trip was not as described">
        <p>
          If an inclusion listed on your trip page was not delivered — a stay category, a named meal, or
          transport we committed to — report it to our customer service team within{" "}
          <strong>7 days</strong> of returning, quoting your booking ID.
        </p>
        <p>
          We investigate with the supplier concerned and take an appropriate decision. Where we got it wrong,
          we refund the value of the missing inclusion to your original payment method. This is separate from
          the cancellation slab in clause 4.
        </p>
      </Clause>

      <Clause n={11} title="Grievances">
        <p>
          If a refund has not reached you within the timelines above, write to us with your booking ID and we
          will trace it with the payment gateway and respond within 5 working days. Contact details are below.
        </p>
      </Clause>
    </LegalPage>
  );
}
