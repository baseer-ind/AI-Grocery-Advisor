import type { PredictedPantry, ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile } from "@/lib/real-data";

const PANTRY_CONFIDENCE_SCORE: Record<"low" | "medium" | "high", number> = {
  low: 33,
  medium: 66,
  high: 100,
};

export type HouseholdIntelligence = {
  score: number;
  profileConfidence: number;
  historyDepthScore: number;
  pantryConfidenceScore: number;
};

// Blends three already-real signals so the headline number is explainable,
// not a black box: how complete the stated profile is, how much real
// shopping history exists, and how confident the predicted pantry is.
export function computeHouseholdIntelligenceScore(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
  pantry: PredictedPantry | null,
): HouseholdIntelligence | null {
  if (!profile) return null;

  const profileConfidence = Math.round(profile.confidence * 100);
  const historyDepthScore = Math.min((events?.length ?? 0) * 10, 100);
  const pantryConfidenceScore = pantry ? PANTRY_CONFIDENCE_SCORE[pantry.confidence] : 0;

  const score = Math.round((profileConfidence + historyDepthScore + pantryConfidenceScore) / 3);

  return { score, profileConfidence, historyDepthScore, pantryConfidenceScore };
}

export type PlanningScore = {
  score: number;
  averageGapDays: number;
  statedFrequency: string | null;
};

const MIN_EVENTS_FOR_PLANNING_SCORE = 3;

// Gated below 3 real events — never renders a score off zero/one data point.
export function computePlanningScore(events: ShoppingEventSummary[] | null): PlanningScore | null {
  if (!events || events.length < MIN_EVENTS_FOR_PLANNING_SCORE) return null;

  const dates = events
    .map((e) => (e.bill_date ? new Date(e.bill_date).getTime() : null))
    .filter((t): t is number => t !== null && !Number.isNaN(t))
    .sort((a, b) => a - b);

  if (dates.length < MIN_EVENTS_FOR_PLANNING_SCORE) return null;

  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
  }

  const averageGapDays = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - averageGapDays) ** 2, 0) / gaps.length;
  const stddev = Math.sqrt(variance);

  // Lower relative variance (stddev / mean) means more consistent cadence.
  const relativeVariance = averageGapDays > 0 ? stddev / averageGapDays : 1;
  const score = Math.max(0, Math.round(100 - relativeVariance * 100));

  return { score, averageGapDays: Math.round(averageGapDays), statedFrequency: null };
}

export type JourneyMilestone = {
  id: string;
  label: string;
  done: boolean;
};

// Every milestone maps to a real, checkable signal — never a fabricated streak/XP system.
export function buildHouseholdJourney(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
  pantry: PredictedPantry | null,
  planning: PlanningScore | null,
): JourneyMilestone[] {
  const eventCount = events?.length ?? 0;
  const distinctStores = new Set((events ?? []).map((e) => e.store_name).filter(Boolean)).size;
  const hasRecurring = (pantry?.items.filter((i) => i.purchase_count >= 3).length ?? 0) > 0;

  return [
    { id: "household-created", label: "Household created", done: !!profile },
    {
      id: "profile-completed",
      label: "Profile completed",
      done: !!profile && profile.confidence >= 0.9,
    },
    { id: "shopping-style-identified", label: "Shopping style identified", done: !!profile },
    { id: "first-event", label: "First shopping event logged", done: eventCount >= 1 },
    { id: "recurring-detected", label: "Recurring purchases detected", done: hasRecurring },
    {
      id: "pantry-enabled",
      label: "Pantry prediction enabled",
      done: !!pantry && pantry.confidence !== "low",
    },
    { id: "pattern-established", label: "Shopping pattern established", done: planning != null },
    { id: "store-optimization", label: "Store optimization available", done: distinctStores >= 2 },
  ];
}

export type DailyBrief = {
  headline: string;
  detail: string | null;
};

// One sentence, drawn only from real signals already computed elsewhere — never invented.
export function buildDailyBrief(
  pantry: PredictedPantry | null,
  events: ShoppingEventSummary[] | null,
  planning: PlanningScore | null,
  profile: StoredHouseholdProfile | null,
): DailyBrief {
  const soonestLow = pantry?.items
    .filter((i) => i.estimated_days_of_stock_remaining != null)
    .sort(
      (a, b) =>
        (a.estimated_days_of_stock_remaining ?? 0) - (b.estimated_days_of_stock_remaining ?? 0),
    )[0];

  if (soonestLow && (soonestLow.estimated_days_of_stock_remaining ?? 99) < 4) {
    return {
      headline: `${soonestLow.product_name} may run out in ${Math.max(0, Math.round(soonestLow.estimated_days_of_stock_remaining ?? 0))} day${Math.round(soonestLow.estimated_days_of_stock_remaining ?? 0) === 1 ? "" : "s"}.`,
      detail: "Based on your purchase history for this item.",
    };
  }

  if (planning && events && events.length > 0) {
    const lastDateStr = events[0]?.bill_date;
    const daysSinceLast = lastDateStr
      ? Math.round((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast != null) {
      const remaining = planning.averageGapDays - daysSinceLast;
      if (remaining <= 2) {
        return {
          headline: "Your next shopping trip is likely due soon.",
          detail: `You usually shop every ~${planning.averageGapDays} days — it's been ${daysSinceLast}.`,
        };
      }
    }
  }

  if (events && events.length >= 3) {
    return {
      headline: "Your shopping habits are becoming more predictable.",
      detail: `${events.length} shopping events tracked so far.`,
    };
  }

  if (profile && profile.confidence < 0.9) {
    return {
      headline: "Your household profile is almost complete.",
      detail: "A few more details will sharpen every recommendation below.",
    };
  }

  if (events && events.length > 0) {
    return {
      headline: "Still learning your household's shopping pattern.",
      detail: "Add a few more shopping events for sharper predictions.",
    };
  }

  return {
    headline: "Add your first bill to start building real insights.",
    detail: null,
  };
}

export type WeeklyActionCard = {
  id: string;
  tag: string;
  title: string;
  body: string;
  to: string;
  cta: string;
};

export function buildWeeklyActionCards(
  pantry: PredictedPantry | null,
  events: ShoppingEventSummary[] | null,
  planning: PlanningScore | null,
): WeeklyActionCard[] {
  const cards: WeeklyActionCard[] = [];

  const runningLow = pantry?.items.filter(
    (i) => i.estimated_days_of_stock_remaining != null && i.estimated_days_of_stock_remaining < 7,
  );
  if (runningLow && runningLow.length > 0) {
    cards.push({
      id: "running-low",
      tag: "Likely running low",
      title: `${runningLow.length} item${runningLow.length > 1 ? "s" : ""} likely running low`,
      body: runningLow.map((i) => i.product_name).join(" · "),
      to: "/this-week",
      cta: "Add to list",
    });
  }

  if (planning && events && events.length > 0) {
    const lastDateStr = events[0]?.bill_date;
    const daysSinceLast = lastDateStr
      ? Math.round((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast != null && daysSinceLast >= planning.averageGapDays) {
      cards.push({
        id: "next-trip",
        tag: "Next shopping recommendation",
        title: `You usually shop every ~${planning.averageGapDays} days — it's been ${daysSinceLast}`,
        body: "Based on your real shopping history, not a guess.",
        to: "/this-week",
        cta: "Plan this week's list",
      });
    }
  }

  const distinctStores = new Set((events ?? []).map((e) => e.store_name).filter(Boolean));
  if (distinctStores.size >= 2) {
    cards.push({
      id: "store-recommendation",
      tag: "Store recommendation",
      title: "Your recent shops span multiple stores",
      body: "Compare your basket across them to see where it's cheaper this week.",
      to: "/bill-check",
      cta: "Compare stores",
    });
  }

  return cards;
}
