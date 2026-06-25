import type { ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile } from "@/lib/real-data";

// Shopping Habits is a behavioral summary built the same way Household
// Memory is: real shopping history wins when it exists, stated onboarding
// answers fill in until then, and anything we genuinely don't collect yet
// says so instead of guessing.

const MIN_EVENTS_FOR_CADENCE = 3;

export type CadenceSummary = {
  value: string;
  source: "history" | "onboarding" | null;
  unlockedBy: string | null;
};

export function computeCadence(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
): CadenceSummary {
  const dates = (events ?? [])
    .map((e) => (e.bill_date ? new Date(e.bill_date).getTime() : null))
    .filter((t): t is number => t !== null && !Number.isNaN(t))
    .sort((a, b) => a - b);

  if (dates.length >= MIN_EVENTS_FOR_CADENCE) {
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / 86_400_000);
    const avgGap = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
    return {
      value: `Shops about every ${avgGap} day${avgGap === 1 ? "" : "s"}, based on ${dates.length} real shopping events`,
      source: "history",
      unlockedBy: null,
    };
  }

  if (profile?.frequency) {
    return {
      value: `Stated frequency: ${profile.frequency.replace(/_/g, " ")}`,
      source: "onboarding",
      unlockedBy: null,
    };
  }

  return {
    value: "",
    source: null,
    unlockedBy: `Log ${MIN_EVENTS_FOR_CADENCE} shopping events, or set a frequency in your profile, to see this.`,
  };
}

export type StoreRanking = {
  name: string;
  count: number;
  source: "history" | "onboarding";
};

export function rankStores(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
): StoreRanking[] {
  const storeNames = (events ?? []).map((e) => e.store_name).filter((s): s is string => !!s);

  if (storeNames.length > 0) {
    const counts = new Map<string, number>();
    for (const s of storeNames) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count, source: "history" as const }))
      .sort((a, b) => b.count - a.count);
  }

  return (profile?.stores ?? []).map((name) => ({ name, count: 0, source: "onboarding" as const }));
}

const PRIORITY_LABELS: Record<string, string> = {
  save_money: "Save money",
  bulk_buyer: "Buy in bulk",
  offer_seeker: "Chase deals & offers",
  premium_brands: "Prefer premium brands",
  quality: "Prioritize quality",
  health_focused: "Health-focused",
  convenience_first: "Convenience first",
};

export function getPurchasePreferences(profile: StoredHouseholdProfile | null): string[] {
  return (profile?.priorities ?? []).map((p) => PRIORITY_LABELS[p] ?? p);
}

export type ShoppingHabits = {
  cadence: CadenceSummary;
  stores: StoreRanking[];
  preferences: string[];
  shoppingStyle: string | null;
  planningStyle: string | null;
};

export function buildShoppingHabits(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
): ShoppingHabits {
  return {
    cadence: computeCadence(profile, events),
    stores: rankStores(profile, events),
    preferences: getPurchasePreferences(profile),
    shoppingStyle: profile?.shoppingStyle ?? null,
    planningStyle: profile?.planningStyle ?? null,
  };
}
