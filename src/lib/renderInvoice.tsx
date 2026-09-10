/**
 * Assemble a customer's invoice and render it to a PDF buffer.
 *
 * This is where the catalog is read. invoiceDoc.tsx stays presentational so it
 * can be rendered from a script without the app around it, and the route stays
 * a route — HTTP status, headers, rate limiting, nothing else.
 *
 * Lives in a .tsx of its own because the shipped docs specify `route.js|ts` for
 * Route Handlers, so the JSX has to be somewhere other than the route file.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { getPackage, getSettings, invoiceBank, text, weekday, shortDate } from "./catalog";
import { nightsLabel } from "./types";
import type { Order } from "./orders";
import { InvoiceDocument } from "./invoiceDoc";

/** The brand mark, if it has actually been added to the repo.
 *  Checked rather than assumed: react-pdf throws on a missing image src, and an
 *  absent logo must degrade to the text wordmark, not take down the one
 *  document a paying customer is trying to download. */
function logoPath(): string | undefined {
  for (const name of ["tripwaley-logo.png", "tripwaley-logo.jpg"]) {
    const p = path.join(process.cwd(), "public", "images", name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export async function renderInvoice(order: Order): Promise<Buffer> {
  const settings = getSettings();
  const bank = invoiceBank();
  const pkg = getPackage(order.packageSlug);

  const departsLabel = order.date
    ? order.date.includes("-")
      ? `${weekday(order.date)}, ${shortDate(order.date)}`
      : order.date
    : undefined;

  const issued = order.paidAt ? new Date(order.paidAt) : new Date();

  return renderToBuffer(
    <InvoiceDocument
      order={order}
      org={{
        brand: settings.brand,
        legalName: settings.legalName,
        address: settings.address,
        // the number the site publishes everywhere and actually answers
        phone: settings.whatsapp ? `+${settings.whatsapp.replace(/\D/g, "")}` : "",
        email: settings.email || "Tripwaley.sales@gmail.com",
        bankAccount: bank.account,
        bankIfsc: bank.ifsc,
        bankHolder: bank.holder,
        logo: logoPath(),
      }}
      copy={{
        cancellation: text("invoice.cancellation"),
        important: text("invoice.important"),
        disclaimer: text("invoice.disclaimer"),
        whyUs: text("invoice.whyUs"),
        terms: text("invoice.terms"),
        footerNote: text("invoice.footerNote"),
      }}
      trip={{
        /* A package renamed or deleted since the booking falls back to the name
           frozen on the order, rather than guessing or printing nothing. */
        nightsLabel: pkg ? nightsLabel(pkg) : undefined,
        destination: pkg?.destination || undefined,
        departsLabel,
        issuedLabel: issued.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      }}
    />
  );
}
