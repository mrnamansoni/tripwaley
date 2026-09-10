/**
 * The invoice a customer downloads after paying to hold a seat.
 *
 * An INVOICE, deliberately not a tax invoice: Tripwaley has no GSTIN on file,
 * and Vyapar already issues the real tax invoices under its own numbering. So
 * there is no HSN/SAC column, no CGST/SGST split, and no integer invoice
 * sequence to collide with Vyapar's — the booking reference is the number.
 *
 * Presentational only. It receives an order, resolved settings and resolved
 * copy, and reads nothing itself, so it can be rendered from a script for
 * eyeballing without standing up the app.
 *
 * TYPEFACE RULE, AND IT IS NOT COSMETIC: every rupee figure is set in
 * Bricolage. Instrument Sans has no U+20B9 glyph, so money set in it loses the
 * ₹ sign silently — no error, no fallback box, just a bare number on a document
 * about money. Money is Bricolage. Prose is Instrument.
 */

import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import path from "node:path";
import type { Order } from "./orders";
import { invoiceLines, type InvoiceLine } from "./invoiceLines";
import { amountInWords } from "./amountInWords";

const FONTS = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Bricolage",
  fonts: [
    { src: path.join(FONTS, "BricolageGrotesque-700.ttf"), fontWeight: 700 },
    { src: path.join(FONTS, "BricolageGrotesque-800.ttf"), fontWeight: 800 },
  ],
});
Font.register({
  family: "Instrument",
  fonts: [
    { src: path.join(FONTS, "InstrumentSans-400.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "InstrumentSans-600.ttf"), fontWeight: 600 },
  ],
});
/* react-pdf hyphenates by default, which on a narrow money column produces
   things like "Depar-ture". Nothing here is long enough to need it. */
Font.registerHyphenationCallback((word) => [word]);

/* Instrument Sans has no U+20B9. Listing Bricolage after it lets the renderer
   fall back per GLYPH, so a ₹ typed into admin prose still prints — without
   that chain it comes out as a stray superscript, which is what happened. */
const BODY = ["Instrument", "Bricolage"];

/* The mark is the horizontal wordmark, trimmed to its artwork by
   scripts/make-brand-assets.mjs. Its aspect is declared rather than measured:
   react-pdf sizes an image from the style box, so giving a 3.36:1 wordmark a
   square box silently squashes it. Re-run the script if the artwork changes —
   it prints the aspect to set here. */
const MARK_ASPECT = 3.363;

/** watermark width in points — two thirds of an A4 sheet's width */
const WATERMARK_W = 400;
const WATERMARK_H = WATERMARK_W / MARK_ASPECT;

/** letterhead mark width in points */
const LOGO_W = 104;

const C = {
  ink: "#1a1614",
  brand: "#c91b20",
  gold: "#8a5605",
  line: "#eae4dd",
  cream: "#fffcf8",
  muted: "#6b625c",
  faint: "#f7f3ee",
};

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 36, fontFamily: BODY, fontSize: 9, color: C.ink, backgroundColor: C.cream, lineHeight: 1.45 },

  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  wordmark: { fontFamily: "Bricolage", fontWeight: 800, fontSize: 20, lineHeight: 1.2, color: C.brand, letterSpacing: -0.4, marginBottom: 2 },
  logo: { width: LOGO_W, height: LOGO_W / MARK_ASPECT, marginBottom: 4 },

  /* The watermark. Centred on A4 (595.28 × 841.89pt) by arithmetic rather than
     by a centring layout, because it is positioned absolutely and out of flow.
     Opacity 0.07: enough that a photocopy still carries it, light enough that
     9pt terms printed across the lettering stay legible. Past roughly 0.10 the
     script strokes start competing with the table rules for attention. */
  watermark: {
    position: "absolute",
    width: WATERMARK_W,
    height: WATERMARK_H,
    left: (595.28 - WATERMARK_W) / 2,
    top: (841.89 - WATERMARK_H) / 2,
    opacity: 0.07,
  },
  orgLine: { fontSize: 8, color: C.muted, maxWidth: 270, marginTop: 2 },
  docLabel: { fontFamily: "Bricolage", fontWeight: 700, fontSize: 13, letterSpacing: 2, textAlign: "right" },

  rule: { height: 2, backgroundColor: C.brand, marginTop: 10 },
  hair: { height: 1, backgroundColor: C.line },

  eyebrow: { fontFamily: BODY, fontWeight: 600, fontSize: 7, letterSpacing: 1.4, color: C.muted, textTransform: "uppercase" },
  h2: { fontFamily: "Bricolage", fontWeight: 700, fontSize: 11, marginBottom: 5 },

  cols: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  col: { width: "48%" },

  th: { flexDirection: "row", backgroundColor: C.brand, paddingVertical: 6, paddingHorizontal: 6 },
  thText: { color: "#ffffff", fontFamily: BODY, fontWeight: 600, fontSize: 8, letterSpacing: 0.4 },
  td: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.line },

  cNum: { width: "6%" },
  cItem: { width: "44%" },
  cQty: { width: "10%", textAlign: "right" },
  cUnit: { width: "10%", textAlign: "right" },
  cRate: { width: "15%", textAlign: "right" },
  cAmt: { width: "15%", textAlign: "right" },

  money: { fontFamily: "Bricolage", fontWeight: 700 },

  sumWrap: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  sum: { width: "62%" },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  sumRule: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  balBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.ink, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6 },

  factRow: { flexDirection: "row", paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: C.line },
  factKey: { width: "38%", color: C.muted, fontSize: 8.5 },
  factVal: { width: "62%", fontFamily: BODY, fontWeight: 600 },

  section: { marginTop: 14, borderLeftWidth: 3, borderLeftColor: C.gold, paddingLeft: 9 },
  bullet: { flexDirection: "row", marginTop: 4 },
  dot: { width: 10, color: C.brand },
  bulletText: { flex: 1, fontSize: 8.7, color: "#332c28" },

  payBox: { marginTop: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.faint, padding: 12 },

  footLeft: { position: "absolute", bottom: 22, left: 36, fontSize: 7, color: C.muted },
  footRight: { position: "absolute", bottom: 22, right: 36, fontSize: 7, color: C.muted, textAlign: "right" },
});

/* ---------------------------------------------------------------- helpers */

/** ₹1,23,456.00 — Indian grouping, always two decimals, sign carried outside */
const money = (paise: number): string =>
  `${paise < 0 ? "− " : ""}₹${(Math.abs(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const lines = (block: string): string[] =>
  block.split("\n").map((l) => l.trim()).filter(Boolean);

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.dot}>•</Text>
          <Text style={s.bulletText}>{t}</Text>
        </View>
      ))}
    </>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  const items = lines(body);
  if (!items.length) return null;
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.h2}>{title}</Text>
      <Bullets items={items} />
    </View>
  );
}

/** The logo, or the text wordmark when no logo file has been supplied. Never a
 *  broken image: react-pdf throws on a missing src, and it would take the whole
 *  invoice down rather than degrade. */
function Mark({ logo, brand }: { logo?: string; brand: string }) {
  /* jsx-a11y sees `Image` and assumes an HTML <img>. This is react-pdf's own
     primitive — a PDF has no alt attribute, and the brand name is printed in
     the letterhead beside it either way. */
  // eslint-disable-next-line jsx-a11y/alt-text
  if (logo) return <Image src={logo} style={s.logo} />;
  return <Text style={s.wordmark}>{brand}</Text>;
}

function Watermark({ logo }: { logo?: string }) {
  if (!logo) return null;
  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf primitive, purely decorative
  return <Image src={logo} style={s.watermark} fixed />;
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.factRow}>
      <Text style={s.factKey}>{k}</Text>
      <Text style={s.factVal}>{v}</Text>
    </View>
  );
}

function Footer({ brand, reference }: { brand: string; reference: string }) {
  /* Two separately-fixed Texts rather than one fixed row: the flag has to sit
     on the positioned element itself, not on a wrapper View around it.

     The right slot carries the BOOKING REFERENCE rather than "Page 2 of 3".
     A page number needs react-pdf's dynamic `render` prop, which in this
     version splices its result in as child instances and quietly emits nothing
     at all here — and a number that silently disappears is the least of it: it
     would also start lying the moment admin-edited terms grow long enough to
     push page 2 onto a second sheet. The reference cannot go stale, and it is
     what actually helps when one sheet turns up on its own.  */
  return (
    <>
      <Text style={s.footLeft} fixed>
        {brand} · tripwaley.com
      </Text>
      <Text style={s.footRight} fixed>
        {reference}
      </Text>
    </>
  );
}

/* ------------------------------------------------------------------ props */

export interface InvoiceOrg {
  brand: string;
  legalName?: string;
  address?: string;
  phone: string;
  email: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankHolder?: string;
  /** absolute path to the logo file; omitted when it is not on disk */
  logo?: string;
}

export interface InvoiceCopy {
  cancellation: string;
  important: string;
  disclaimer: string;
  whyUs: string;
  terms: string;
  footerNote: string;
}

export interface InvoiceTrip {
  /** "1N / 2D" when the package is still in the catalog */
  nightsLabel?: string;
  destination?: string;
  /** the departure date, already formatted for a reader */
  departsLabel?: string;
  /** the date the invoice is issued */
  issuedLabel: string;
}

/* ------------------------------------------------------------- the document */

export function InvoiceDocument({
  order,
  org,
  copy,
  trip,
}: {
  order: Order;
  org: InvoiceOrg;
  copy: InvoiceCopy;
  trip: InvoiceTrip;
}) {
  const rows = invoiceLines(order);
  const pax = Math.max(1, order.pax || 1);
  const q = order.quote;

  /* The table's own total is the PRE-coupon trip value, so it matches the
     "Trip price" row of the summary directly beneath it rather than appearing
     to contradict it. */
  const discountPaise = order.coupon ? Math.round(order.coupon.discount * 100) : 0;
  const grossPaise = q.totalPaise + discountPaise;
  // seatPrice is stored pre-coupon; orders written before that field existed
  // fall back to the gross split evenly, which is pre-coupon too
  const ratePaise = order.seatPrice ? Math.round(order.seatPrice * 100) : Math.round(grossPaise / pax);

  const value = (label: string) => rows.find((r) => r.label === label)?.paise ?? 0;
  const payable = value("Amount payable");
  const balance = value("Balance due");
  const bankReady = Boolean(org.bankAccount && org.bankIfsc && org.bankHolder);

  const itemName = [
    order.packageName,
    trip.nightsLabel,
    order.occupancy === "triple" ? "Triple sharing" : "Double sharing",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document
      title={`Tripwaley Invoice ${order.id}`}
      author={org.brand}
      subject={`Booking invoice for ${order.packageName}`}
    >
      {/* ============================================ page 1 — the invoice */}
      <Page size="A4" style={s.page}>
        <Watermark logo={org.logo} />
        <View style={s.brandRow}>
          <View>
            <Mark logo={org.logo} brand={org.brand} />
            {org.address ? <Text style={s.orgLine}>{org.address}</Text> : null}
            <Text style={s.orgLine}>
              {org.phone} · {org.email}
            </Text>
          </View>
          <View>
            <Text style={s.docLabel}>INVOICE</Text>
            <Text style={[s.orgLine, { textAlign: "right" }]}>No. {order.id}</Text>
            <Text style={[s.orgLine, { textAlign: "right" }]}>Date {trip.issuedLabel}</Text>
          </View>
        </View>
        <View style={s.rule} />

        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.eyebrow}>Bill to</Text>
            <Text style={[s.h2, { marginTop: 4 }]}>{order.contact.name}</Text>
            <Text style={{ color: C.muted }}>{order.contact.phone}</Text>
            {order.contact.email ? <Text style={{ color: C.muted }}>{order.contact.email}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.eyebrow}>Booking reference</Text>
            <Text style={[s.h2, { marginTop: 4, fontSize: 10 }]}>{order.id}</Text>
            <Text style={{ color: C.muted }}>Quote this in any correspondence.</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <View style={s.th}>
            <Text style={[s.thText, s.cNum]}>#</Text>
            <Text style={[s.thText, s.cItem]}>Item</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cUnit]}>Unit</Text>
            <Text style={[s.thText, s.cRate]}>Rate</Text>
            <Text style={[s.thText, s.cAmt]}>Amount</Text>
          </View>
          <View style={s.td}>
            <Text style={s.cNum}>1</Text>
            <View style={s.cItem}>
              <Text style={{ fontFamily: BODY, fontWeight: 600 }}>{itemName}</Text>
              <Text style={{ fontSize: 8, color: C.muted }}>
                {[trip.departsLabel ? `Departs ${trip.departsLabel}` : null, order.cityName ? `Boarding from ${order.cityName}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <Text style={s.cQty}>{pax}</Text>
            <Text style={s.cUnit}>Pax</Text>
            <Text style={[s.cRate, s.money]}>{money(ratePaise)}</Text>
            <Text style={[s.cAmt, s.money]}>{money(ratePaise * pax)}</Text>
          </View>
        </View>

        <View style={s.sumWrap}>
          <View style={s.sum}>
            {rows.map((r: InvoiceLine) =>
              r.kind === "total" ? null : (
                <View key={r.label}>
                  {r.label === "Amount payable" ? <View style={s.sumRule} /> : null}
                  <View style={s.sumRow}>
                    <Text
                      style={{
                        color: r.kind === "subtotal" ? C.ink : C.muted,
                        fontFamily: BODY,
                        fontWeight: r.kind === "subtotal" ? 600 : 400,
                      }}
                    >
                      {r.label}
                    </Text>
                    <Text style={[s.money, { fontSize: r.kind === "subtotal" ? 10 : 9 }]}>
                      {/* the paid row is a deduction, so it prints signed even
                          though it is stored positive */}
                      {money(r.kind === "deduct" ? -r.paise : r.paise)}
                    </Text>
                  </View>
                </View>
              )
            )}
            <View style={s.balBox}>
              <Text style={{ color: "#ffffff", fontFamily: BODY, fontWeight: 600, fontSize: 9 }}>
                Balance due
              </Text>
              <Text style={[s.money, { color: "#ffffff", fontSize: 13 }]}>{money(balance)}</Text>
            </View>
            <Text style={{ fontSize: 7.5, color: C.muted, marginTop: 5, textAlign: "right" }}>
              The amount paid counts toward your trip, not on top of it.
            </Text>
          </View>
        </View>

        <Footer brand={org.brand} reference={order.id} />
      </Page>

      {/* ======================================== page 2 — the booking terms */}
      <Page size="A4" style={s.page}>
        <Watermark logo={org.logo} />
        <View style={s.brandRow}>
          <Mark logo={org.logo} brand={org.brand} />
          <Text style={[s.orgLine, { textAlign: "right" }]}>Booking {order.id}</Text>
        </View>
        <View style={s.rule} />

        <View style={{ marginTop: 16 }}>
          <Text style={s.eyebrow}>Booking confirmation</Text>
          <Text style={[s.h2, { fontSize: 14, marginTop: 4, marginBottom: 8 }]}>
            {order.packageName}
            {trip.nightsLabel ? ` · ${trip.nightsLabel}` : ""}
          </Text>
          <Fact k="Traveller" v={order.contact.name} />
          {trip.destination ? <Fact k="Destination" v={trip.destination} /> : null}
          {trip.departsLabel ? <Fact k="Travel date" v={trip.departsLabel} /> : null}
          <Fact k="Travellers" v={`${pax} pax`} />
          <Fact k="Room sharing" v={order.occupancy === "triple" ? "Triple sharing" : "Double sharing"} />
          {order.cityName ? <Fact k="Boarding from" v={order.cityName} /> : null}
          <Fact k="Contact" v={order.contact.phone} />
        </View>

        <View style={s.payBox}>
          <Text style={s.eyebrow}>Payment</Text>
          <View style={[s.sumRow, { marginTop: 4 }]}>
            <Text style={{ color: C.muted }}>Total package cost</Text>
            <Text style={s.money}>{money(payable)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={{ color: C.muted }}>Received</Text>
            <Text style={s.money}>{money(q.holdTotalPaise)}</Text>
          </View>
          <View style={s.hair} />
          <View style={[s.sumRow, { marginTop: 2 }]}>
            <Text style={{ fontFamily: BODY, fontWeight: 600 }}>Balance due</Text>
            <Text style={[s.money, { fontSize: 11, color: C.brand }]}>{money(balance)}</Text>
          </View>
        </View>

        <Section title="Cancellation policy" body={copy.cancellation} />
        <Section title="Important information" body={copy.important} />
        <Section title="Travel disclaimer" body={copy.disclaimer} />
        <Section title="Why choose Tripwaley" body={copy.whyUs} />

        <Footer brand={org.brand} reference={order.id} />
      </Page>

      {/* ========================================= page 3 — the formalities */}
      <Page size="A4" style={s.page}>
        <Watermark logo={org.logo} />
        <View style={s.brandRow}>
          <Mark logo={org.logo} brand={org.brand} />
          <Text style={[s.orgLine, { textAlign: "right" }]}>Booking {order.id}</Text>
        </View>
        <View style={s.rule} />

        <View style={{ marginTop: 16 }}>
          <Text style={s.eyebrow}>Invoice amount in words</Text>
          <Text style={{ fontFamily: "Bricolage", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
            {amountInWords(payable)}
          </Text>
        </View>

        <Section title="Terms and conditions" body={copy.terms} />

        {bankReady ? (
          <View style={s.payBox}>
            <Text style={s.eyebrow}>Pay to</Text>
            <View style={{ marginTop: 5 }}>
              <Fact k="Account number" v={org.bankAccount!} />
              <Fact k="IFSC code" v={org.bankIfsc!} />
              <Fact k="Account holder" v={org.bankHolder!} />
            </View>
            <Text style={{ fontSize: 7.5, color: C.muted, marginTop: 7 }}>
              Confirm the balance amount with your trip captain before transferring. Tripwaley never
              asks for payment to any other account.
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ width: "55%" }}>
            <Text style={{ color: C.muted, fontSize: 8.5 }}>{copy.footerNote}</Text>
            <Text style={{ fontSize: 8, color: C.muted, marginTop: 6 }}>
              Questions? {org.phone} · {org.email}
            </Text>
          </View>
          <View style={{ width: "38%" }}>
            <View style={[s.hair, { marginBottom: 5 }]} />
            <Text style={{ textAlign: "right", fontSize: 8, color: C.muted }}>
              For {org.legalName || org.brand}
            </Text>
            <Text style={{ textAlign: "right", fontSize: 8, color: C.muted }}>Authorised Signatory</Text>
          </View>
        </View>

        <Footer brand={org.brand} reference={order.id} />
      </Page>
    </Document>
  );
}
