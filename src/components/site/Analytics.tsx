"use client";

/* GA4 + Meta Pixel loader.
 *
 * Both IDs come from admin Settings rather than being hardcoded, so the owner
 * can swap or disable a pixel without a deploy — and an unset ID renders
 * nothing at all, which keeps local dev out of the live analytics account.
 *
 * SPA note: next/script loads these once and they survive client-side
 * navigation. GA4's Enhanced Measurement tracks history changes on its own,
 * so it needs no help. Meta has no equivalent — without the effect below,
 * fbq would only ever report the first page of a visit.
 */

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { trackPageView } from "@/lib/analytics";

/* Wait for the visitor to actually do something before loading either tag.
 *
 * Measured on the live homepage: gtag costs 168KB and 181ms of main-thread
 * time, and fbevents another 196KB and 322ms. Together they were roughly half
 * the page's Total Blocking Time — the single heaviest term in the mobile
 * Performance score — and they were doing that work before the visitor had
 * touched anything.
 *
 * The trade is deliberate and was the owner's call: someone who opens the page
 * and leaves without scrolling, tapping or pressing a key is never counted.
 * Anyone who reads, scrolls or clicks is.
 *
 * `scroll` is included because on a page this tall it is the first thing
 * almost everyone does. All listeners are passive and fire once.
 */
const WAKE_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const;

function useFirstInteraction(): boolean {
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    if (awake) return;
    const wake = () => setAwake(true);

    /* A visitor who arrives already scrolled — a restored position, or an
       anchor link — has effectively interacted and might never fire one of
       the events below. The state change goes through a timer rather than
       being called straight from the effect body: a synchronous setState
       there triggers a cascading render, which is both a lint error and the
       thing the React docs warn about. Same pattern as CityProvider. */
    const t = window.scrollY > 0 ? setTimeout(() => setAwake(true), 0) : undefined;
    if (t === undefined) {
      for (const e of WAKE_EVENTS) window.addEventListener(e, wake, { once: true, passive: true });
    }
    return () => {
      if (t !== undefined) clearTimeout(t);
      for (const e of WAKE_EVENTS) window.removeEventListener(e, wake);
    };
  }, [awake]);

  return awake;
}

function MetaRouteTracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  // the base snippet already fires PageView for the first render; firing again
  // here would double-count the landing page
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView();
  }, [pathname, params]);

  return null;
}

export default function Analytics({ gaId, metaPixelId }: { gaId?: string; metaPixelId?: string }) {
  // Never fire from `npm run dev`. Local iteration would otherwise fill the
  // real GA4 property with localhost sessions and the Pixel with junk events,
  // and there's no way to tell them apart afterwards. Verification happens on
  // the live domain (Meta Events Manager → Test Events), which is what Meta's
  // own install instructions describe anyway.
  if (process.env.NODE_ENV !== "production") return null;

  const ga = gaId?.trim();
  const pixel = metaPixelId?.trim();
  if (!ga && !pixel) return null;

  /* The tags themselves live in a child component because the guards above
     return early, and a hook may not sit behind a conditional return. */
  return <DeferredTags ga={ga} pixel={pixel} />;
}

function DeferredTags({ ga, pixel }: { ga?: string; pixel?: string }) {
  const awake = useFirstInteraction();
  if (!awake) return null;

  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}');`}
          </Script>
        </>
      )}

      {pixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              alt=""
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
            />
          </noscript>
          {/* useSearchParams needs a Suspense boundary in the App Router */}
          <Suspense fallback={null}>
            <MetaRouteTracker />
          </Suspense>
        </>
      )}
    </>
  );
}
