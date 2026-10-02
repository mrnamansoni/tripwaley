/* The refund slab — ONE copy, read by /refund-policy and by the FAQ on every
 * trip page, so the two can never disagree. Kept as data, not prose, because a
 * payment-gateway reviewer and a traveller both scan for the table, and the
 * owner will want to tune the windows without rewriting a legal paragraph. */
export const REFUND_SLAB: { window: string; refund: string; tone: "good" | "mid" | "bad" }[] = [
  { window: "7 days or more before departure", refund: "100% refund", tone: "good" },
  { window: "3 to 6 days before departure", refund: "50% refund", tone: "mid" },
  { window: "Less than 3 days before departure, or no-show", refund: "No refund", tone: "bad" },
];
