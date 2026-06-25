import type { ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile, TaughtFact } from "@/lib/real-data";
import type { Unlock } from "@/lib/household-unlocks";

// The Household Memory Timeline is built only from events with a real
// timestamp we actually recorded — household creation, frequent-products
// selection, and real shopping events. Never backfilled, never inferred.
// A household with little history simply gets a short timeline, not a
// padded one.

export type TimelineEntry = {
  id: string;
  date: Date;
  label: string;
};

export function buildHouseholdTimeline(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
  frequentProductsSavedAt: string | null,
  taughtFacts: TaughtFact[] = [],
  unlocks: Unlock[] = [],
  unlockTimestamps: Record<string, string> = {},
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (profile?.createdAt) {
    const d = new Date(profile.createdAt);
    if (!Number.isNaN(d.getTime())) {
      entries.push({ id: "household-created", date: d, label: "Household profile created" });
    }
  }

  if (frequentProductsSavedAt) {
    const d = new Date(frequentProductsSavedAt);
    if (!Number.isNaN(d.getTime())) {
      entries.push({
        id: "frequent-products-saved",
        date: d,
        label: "Told us what you regularly buy",
      });
    }
  }

  for (const event of events ?? []) {
    if (!event.bill_date) continue;
    const d = new Date(event.bill_date);
    if (Number.isNaN(d.getTime())) continue;
    const store = event.store_name ? ` at ${event.store_name}` : "";
    const spend =
      event.total_spend != null
        ? ` · ₹${Math.round(event.total_spend).toLocaleString("en-IN")}`
        : "";
    entries.push({
      id: `event-${event.shopping_event_id}`,
      date: d,
      label: `Shopping event${store}${spend}`,
    });
  }

  for (const fact of taughtFacts) {
    const d = new Date(fact.taughtAt);
    if (Number.isNaN(d.getTime())) continue;
    entries.push({
      id: `taught-${fact.id}`,
      date: d,
      label: `Taught us: "${fact.text}"`,
    });
  }

  for (const unlock of unlocks) {
    const ts = unlockTimestamps[unlock.id];
    if (!ts) continue;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) continue;
    entries.push({
      id: `unlock-${unlock.id}`,
      date: d,
      label: `${unlock.label} unlocked`,
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}
