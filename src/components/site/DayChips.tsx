/* Per-day "what's covered" chips — stay + meals.
 *
 * Buried in a paragraph, "dinner is included on day 3" is unfindable. As a
 * row of chips under the day title it answers the question at a glance, and
 * it's the single most useful thing a day-by-day itinerary can carry beyond
 * the prose itself.
 *
 * Renders nothing when a day has no data, so trips that haven't been filled
 * in yet simply don't show the row rather than showing an empty one.
 */

import { MEAL_LABEL, type Meal } from "@/lib/types";

export default function DayChips({
  meals,
  stay,
  tone = "dark",
  className = "",
}: {
  meals?: Meal[];
  stay?: boolean;
  tone?: "dark" | "light";
  className?: string;
}) {
  const list = meals ?? [];
  if (!stay && list.length === 0) return null;

  const base =
    tone === "dark"
      ? "border-white/15 bg-white/[0.06] text-white/70"
      : "border-ink/12 bg-ink/[0.04] text-ink/65";

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Included this day">
      {stay && (
        <li className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${base}`}>
          <span aria-hidden="true">⌂</span> Stay
        </li>
      )}
      {(["breakfast", "lunch", "dinner"] as Meal[])
        .filter((m) => list.includes(m))
        .map((m) => (
          <li
            key={m}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold ${base}`}
          >
            <span aria-hidden="true">•</span> {MEAL_LABEL[m]}
          </li>
        ))}
    </ul>
  );
}
