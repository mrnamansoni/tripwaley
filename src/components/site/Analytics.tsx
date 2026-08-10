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
import { Suspense, useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

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
