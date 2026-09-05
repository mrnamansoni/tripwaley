import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import PendingPoll from "@/components/site/PendingPoll";
import { getCities, getSettings } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { refreshFromPhonePe } from "@/lib/settle";
import { formatPaise } from "@/lib/money";
import { weekday, shortDate } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Payment | Tripwaley",
  robots: { index: false, follow: false },
};

/* Where PhonePe sends the traveller back to.
 *
 * Landing here proves nothing — this URL is guessable and carries no secret.
 * So the page ignores every query parameter except the order id, asks PhonePe
 * directly what happened, and renders that. A payment is only ever confirmed
 * by the Order Status API agreeing on both the state AND the amount. */

const mono = "font-mono text-[0.6rem] uppercase tracking-[0.4em]";

function Shell({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <CityProvider cities={getCities()} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-20 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </section>
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </CityProvider>
  );
}

export default async function PayReturn({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const settings = getSettings();
  const { order: id } = await searchParams;

  const existing = id ? getOrder(id) : undefined;
  if (!existing) {
    return (
      <Shell>
        <p className={`${mono} text-gold`}>payment · not found</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl">
          We can&apos;t find that payment.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/60">
          The link may be incomplete. If money has left your account, send us the reference on
          WhatsApp and we&apos;ll trace it straight away — nothing is lost.
        </p>
        <Actions settings={settings} />
      </Shell>
    );
  }

  // ask the gateway itself; a network failure leaves the stored status intact
  let status = existing.status;
  let gatewayDown = false;
  try {
    const settled = await refreshFromPhonePe(existing.id);
    status = settled?.order.status ?? status;
  } catch {
    gatewayDown = true;
  }

  const q = existing.quote;
  const tripLine = `${existing.packageName}${existing.date ? ` · ${existing.date.includes("-") ? `${weekday(existing.date)}, ${shortDate(existing.date)}` : existing.date}` : ""}`;

  if (status === "paid") {
    return (
      <Shell>
        <p className={`${mono} text-gold`}>payment · confirmed</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl">
          Your seat is held. 🎉
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/60">
          We&apos;ve received <strong className="text-white">{formatPaise(q.holdTotalPaise)}</strong> for{" "}
          <strong className="text-white">{tripLine}</strong>. A trip captain will call you on{" "}
          {existing.contact.phone} to confirm the details.
        </p>

        <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.04] p-5">
          <p className={`${mono} text-white/40`}>what happens next</p>
          <ol className="mt-4 space-y-4">
            <Step n={1} done title={`${formatPaise(q.holdTotalPaise)} paid — seat held`}>
              {formatPaise(q.holdBasePaise)} hold{q.holdGstPaise > 0 && <> + {formatPaise(q.holdGstPaise)} GST</>}.
              This amount counts toward your booking, not on top of it.
            </Step>
            <Step n={2} title={`${formatPaise(q.advanceBalancePaise)} to confirm`}>
              Our team collects this about a week before departure, taking your advance to{" "}
              {q.advancePercent}% of the trip cost.
            </Step>
            <Step n={3} title={`${formatPaise(q.departureBalancePaise)} at departure`}>
              The balance, paid when you board.
            </Step>
          </ol>
        </div>

        <p className="mt-6 text-sm text-white/45">
          Reference <span className="font-mono text-white/70">{existing.id}</span> — keep this for any query.
        </p>
        <Actions settings={settings} />
      </Shell>
    );
  }

  if (status === "failed") {
    /* An amount mismatch is NOT an ordinary failure: the gateway settled a
       figure we did not price, so money may well have moved. Telling that
       customer "nothing has been charged" would be false, and it is exactly
       the person most likely to have been charged. They get a different page. */
    const mismatch = existing.phonepe?.state === "AMOUNT_MISMATCH";

    return (
      <Shell>
        <p className={`${mono} text-gold`}>payment · {mismatch ? "needs a human" : "not completed"}</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl">
          {mismatch ? <>We need to check this one.</> : <>That payment didn&apos;t go through.</>}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/60">
          {mismatch ? (
            <>
              The amount that reached our payment gateway doesn&apos;t match the{" "}
              {formatPaise(q.holdTotalPaise)}{" "}
              we quoted, so we haven&apos;t confirmed the hold
              automatically. <strong className="text-white">If money has left your account it is safe.</strong>{" "}
              Send us the reference below on WhatsApp and we&apos;ll sort it out today — refunding or
              confirming, whichever is right.
            </>
          ) : (
            <>
              Your account hasn&apos;t been charged for this attempt, and your seat hasn&apos;t been held.
              You can try again from the trip page, or message us and we&apos;ll hold it manually while you
              sort the payment out.
            </>
          )}
        </p>
        <p className="mt-6 text-sm text-white/45">
          Reference <span className="font-mono text-white/70">{existing.id}</span>
        </p>
        <Actions settings={settings} retry={mismatch ? undefined : `/trips/${existing.packageSlug}`} />
      </Shell>
    );
  }

  // still PENDING — typical for a UPI collect awaiting approval in the bank app
  return (
    <Shell>
      <p className={`${mono} text-gold`}>payment · waiting</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl">
        Waiting for your bank.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-white/60">
        {gatewayDown
          ? "We couldn't reach the payment gateway just now. If you completed the payment it is safe — this page will update as soon as we can confirm it."
          : "If you approved a UPI request, this can take a minute or two. Keep this page open — it updates itself."}
      </p>
      <PendingPoll orderId={existing.id} />
      <p className="mt-6 text-sm text-white/45">
        Reference <span className="font-mono text-white/70">{existing.id}</span>
      </p>
      <Actions settings={settings} />
    </Shell>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-extrabold ${
          done ? "bg-gold text-ink" : "border border-white/20 text-white/50"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div>
        <p className="font-display text-base font-bold text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/55">{children}</p>
      </div>
    </li>
  );
}

function Actions({ settings, retry }: { settings: ReturnType<typeof getSettings>; retry?: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {retry && (
        <Link
          href={retry}
          className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 py-3 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright"
        >
          Try again →
        </Link>
      )}
      <a
        href={settings.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
      >
        Message us on WhatsApp
      </a>
      <Link
        href="/trips"
        className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-gold hover:text-gold"
      >
        All departures
      </Link>
    </div>
  );
}
