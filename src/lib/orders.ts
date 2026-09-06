import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { HoldQuote } from "./money";
import type { LeadSource } from "./webhookPayload";

/**
 * Payment orders — one row per attempt to hold a seat.
 *
 * These live in their own file, NOT in catalog.json, and that is deliberate.
 * The admin PUT rewrites catalog.json wholesale from whatever the browser had
 * loaded; if orders lived there, an admin pressing Save at the moment a payment
 * callback landed would silently erase the order — money taken, no record.
 * Separate file, separate write path, no shared failure.
 *
 * Concurrency: every mutation below is a fully SYNCHRONOUS read-modify-write.
 * Node runs one turn of the event loop at a time, so with no `await` between
 * the read and the write, two concurrent requests (the return page and the
 * webhook both landing at once — which happens constantly) cannot interleave
 * and lose an update. Do not make these functions async.
 *
 * The one case this does not cover is more than one container replica writing
 * the same volume. The catalog store has the same property, so the app is
 * already single-replica by construction; if that ever changes, orders need a
 * real lock before anything else does.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "orders.json");

export type OrderStatus = "created" | "paid" | "failed" | "expired";

export interface Order {
  /** merchantOrderId sent to PhonePe: ≤63 chars, only "_" and "-" as specials */
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;

  packageSlug: string;
  packageName: string;
  citySlug: string;
  cityName: string;
  date: string;
  occupancy: "double" | "triple";
  pax: number;

  coupon?: { code: string; label: string; discount: number };

  /** where the booking came from — page, surface and creator. Frozen with the
   *  order so attribution survives even if the visitor's session is long gone. */
  source?: LeadSource;

  /** frozen at creation, priced server-side — the ONLY authority on the amount */
  quote: HoldQuote;

  contact: { name: string; phone: string };

  phonepe?: {
    orderId?: string;
    state?: string;
    transactionId?: string;
    paymentMode?: string;
    errorCode?: string;
    /** true once PhonePe's server-to-server callback has been seen */
    webhookSeen?: boolean;
  };

  paidAt?: string;
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]");
}

function readAllSync(): Order[] {
  ensureFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    // a truncated or hand-edited file must not take the payment path down —
    // better to serve an empty list and keep accepting new orders
    console.error("[orders] orders.json unreadable — starting from empty");
    return [];
  }
}

function writeAllSync(rows: Order[]) {
  ensureFile();
  const tmp = `${FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 1));
  fs.renameSync(tmp, FILE);
}

/**
 * A merchant order id PhonePe will accept.
 * Constraint from their docs: max 63 characters, no specials except _ and -.
 */
export function newOrderId(): string {
  return `TW-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex")}`;
}

export function listOrders(): Order[] {
  return readAllSync().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(id: string): Order | undefined {
  if (!id) return undefined;
  return readAllSync().find((o) => o.id === id);
}

export function createOrder(row: Omit<Order, "createdAt" | "updatedAt" | "status">): Order {
  const now = new Date().toISOString();
  const order: Order = { ...row, createdAt: now, updatedAt: now, status: "created" };
  const rows = readAllSync();
  rows.push(order);
  writeAllSync(rows);
  return order;
}

/**
 * Status transitions are MONOTONIC: a paid order never moves back.
 *
 * Both the return page and the webhook update the same order, and they arrive
 * in no guaranteed order. A status poll that resolves late — say the customer
 * refreshed the return page while PhonePe's callback had already confirmed the
 * payment — must not be able to stamp "failed" over a real "paid".
 */
export function updateOrder(id: string, patch: Partial<Omit<Order, "id" | "createdAt">>): Order | undefined {
  const rows = readAllSync();
  const i = rows.findIndex((o) => o.id === id);
  if (i === -1) return undefined;

  const prev = rows[i];
  const next: Order = {
    ...prev,
    ...patch,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: new Date().toISOString(),
    phonepe: { ...prev.phonepe, ...patch.phonepe },
    // quote is frozen at creation — a patch must never be able to restate the price
    quote: prev.quote,
  };

  if (prev.status === "paid" && patch.status && patch.status !== "paid") {
    next.status = "paid";
    next.paidAt = prev.paidAt;
  }

  rows[i] = next;
  writeAllSync(rows);
  return next;
}
