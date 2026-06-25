import type { ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile } from "@/lib/real-data";

// Every observation below is sourced from real, already-collected data —
// either the household's own onboarding answers or its real shopping-event
// history. None of this is ever inferred or fabricated. When the underlying
// signal doesn't exist yet, an observation reports `unlockedBy` instead of a
// guessed value — the UI must render that explanation, never a placeholder
// number.

export type MemoryObservation = {
  id: string;
  label: string;
  value: string | null;
  source: "onboarding" | "history" | null;
  unlockedBy: string | null;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MIN_EVENTS_FOR_DAY_PATTERN = 3;

function mostCommon(values: string[]): { value: string; count: number } | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: { value: string; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

export function buildHouseholdMemory(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
): MemoryObservation[] {
  const realEvents = events ?? [];

  // Preferred shopping day — only from real event history, never from a
  // single data point.
  const dayObservation: MemoryObservation = (() => {
    const dates = realEvents
      .map((e) => (e.bill_date ? new Date(e.bill_date) : null))
      .filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()));
    if (dates.length < MIN_EVENTS_FOR_DAY_PATTERN) {
      return {
        id: "preferred-day",
        label: "Preferred shopping day",
        value: null,
        source: null,
        unlockedBy: `Log ${MIN_EVENTS_FOR_DAY_PATTERN - dates.length} more shopping event${
          MIN_EVENTS_FOR_DAY_PATTERN - dates.length === 1 ? "" : "s"
        } to reveal a pattern.`,
      };
    }
    const best = mostCommon(dates.map((d) => DAY_NAMES[d.getDay()]));
    return {
      id: "preferred-day",
      label: "Preferred shopping day",
      value: best ? `${best.value}s` : null,
      source: "history",
      unlockedBy: null,
    };
  })();

  // Favourite store — prefer real history; fall back to stated onboarding
  // preference if no history yet.
  const storeObservation: MemoryObservation = (() => {
    const storeNames = realEvents.map((e) => e.store_name).filter((s): s is string => !!s);
    if (storeNames.length > 0) {
      const best = mostCommon(storeNames);
      return {
        id: "favourite-store",
        label: "Favourite store",
        value: best?.value ?? null,
        source: "history",
        unlockedBy: null,
      };
    }
    if (profile?.stores && profile.stores.length > 0) {
      return {
        id: "favourite-store",
        label: "Favourite store (stated)",
        value: profile.stores[0],
        source: "onboarding",
        unlockedBy: null,
      };
    }
    return {
      id: "favourite-store",
      label: "Favourite store",
      value: null,
      source: null,
      unlockedBy: "Log a shopping event or pick stores during onboarding to reveal this.",
    };
  })();

  // Shopping frequency — prefer real cadence from history; fall back to
  // stated onboarding frequency.
  const frequencyObservation: MemoryObservation = (() => {
    const dates = realEvents
      .map((e) => (e.bill_date ? new Date(e.bill_date).getTime() : null))
      .filter((t): t is number => t !== null && !Number.isNaN(t))
      .sort((a, b) => a - b);
    if (dates.length >= MIN_EVENTS_FOR_DAY_PATTERN) {
      const gaps: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      }
      const avgGap = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
      return {
        id: "shopping-frequency",
        label: "Shopping frequency",
        value: `About every ${avgGap} day${avgGap === 1 ? "" : "s"}`,
        source: "history",
        unlockedBy: null,
      };
    }
    if (profile?.frequency) {
      return {
        id: "shopping-frequency",
        label: "Shopping frequency (stated)",
        value: profile.frequency.replace(/_/g, " "),
        source: "onboarding",
        unlockedBy: null,
      };
    }
    return {
      id: "shopping-frequency",
      label: "Shopping frequency",
      value: null,
      source: null,
      unlockedBy: `Log ${MIN_EVENTS_FOR_DAY_PATTERN} shopping events to see your real cadence.`,
    };
  })();

  // Budget pattern — from stated onboarding budget vs. real average spend,
  // when both exist; otherwise whichever is available.
  const budgetObservation: MemoryObservation = (() => {
    const spends = realEvents
      .map((e) => e.total_spend)
      .filter((s): s is number => s != null && !Number.isNaN(s));
    if (spends.length > 0) {
      const avg = Math.round(spends.reduce((s, v) => s + v, 0) / spends.length);
      return {
        id: "budget-pattern",
        label: "Average spend per trip",
        value: `₹${avg.toLocaleString("en-IN")}`,
        source: "history",
        unlockedBy: null,
      };
    }
    if (profile?.budget) {
      return {
        id: "budget-pattern",
        label: "Stated monthly budget",
        value: `₹${profile.budget.toLocaleString("en-IN")}`,
        source: "onboarding",
        unlockedBy: null,
      };
    }
    return {
      id: "budget-pattern",
      label: "Budget pattern",
      value: null,
      source: null,
      unlockedBy: "Log a shopping event with a total spend to reveal this.",
    };
  })();

  // Shopping style — already derived and persisted at onboarding.
  const styleObservation: MemoryObservation = profile
    ? {
        id: "shopping-style",
        label: "Shopping style",
        value: `${profile.shoppingStyle} · ${profile.planningStyle}`,
        source: "onboarding",
        unlockedBy: null,
      }
    : {
        id: "shopping-style",
        label: "Shopping style",
        value: null,
        source: null,
        unlockedBy: "Complete your household profile to reveal this.",
      };

  return [
    dayObservation,
    storeObservation,
    frequencyObservation,
    budgetObservation,
    styleObservation,
  ];
}
