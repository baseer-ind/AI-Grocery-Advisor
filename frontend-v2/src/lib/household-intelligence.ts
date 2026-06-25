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
  greeting: string;
  lines: string[];
};

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// A flowing, personal briefing rather than a stat grid — each sentence maps to one
// real, already-computed signal. A signal with no data simply contributes no sentence;
// nothing here is ever invented to fill space.
export function buildDailyBrief(
  pantry: PredictedPantry | null,
  events: ShoppingEventSummary[] | null,
  planning: PlanningScore | null,
  profile: StoredHouseholdProfile | null,
  intelligence: HouseholdIntelligence | null,
  firstName: string | null,
): DailyBrief {
  const greeting = firstName ? `${timeOfDayGreeting()}, ${firstName}` : timeOfDayGreeting();
  const lines: string[] = [];

  if (planning && events && events.length > 0) {
    const lastDateStr = events[0]?.bill_date;
    const daysSinceLast = lastDateStr
      ? Math.round((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast != null) {
      const daysUntilNext = planning.averageGapDays - daysSinceLast;
      if (daysUntilNext <= 2) {
        lines.push(
          daysUntilNext <= 0
            ? "Your next shopping trip looks overdue based on how often you usually shop."
            : `Your next shopping trip is likely due in about ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}.`,
        );
      }
    }
  }

  const lowStock = pantry?.items
    .filter(
      (i) => i.estimated_days_of_stock_remaining != null && i.estimated_days_of_stock_remaining < 5,
    )
    .sort(
      (a, b) =>
        (a.estimated_days_of_stock_remaining ?? 0) - (b.estimated_days_of_stock_remaining ?? 0),
    )
    .slice(0, 2);
  if (lowStock && lowStock.length > 0) {
    const names = lowStock.map((i) => i.product_name).join(" and ");
    lines.push(`${names} may need replenishing soon.`);
  }

  const storeNames = new Set((events ?? []).map((e) => e.store_name).filter(Boolean));
  if (events && events.length > 0 && storeNames.size === 1) {
    lines.push(`Your recent shopping has stayed with ${[...storeNames][0]}.`);
  } else if (storeNames.size >= 2) {
    lines.push("Comparing your usual stores this week could save you a little.");
  }

  if (lines.length === 0) {
    if (events && events.length > 0) {
      lines.push(
        "Still learning your household's shopping pattern — a few more bills will sharpen this.",
      );
    } else if (profile) {
      lines.push("Add your first bill to start getting real, personal recommendations here.");
    } else {
      lines.push("Build your household profile to get started — it takes about two minutes.");
    }
  }

  if (intelligence) {
    lines.push(
      intelligence.score >= 90
        ? "We have a strong picture of your household's shopping habits."
        : `We understand about ${intelligence.score}% of your household's shopping habits so far.`,
    );
  }

  return { greeting, lines };
}

export type WeeklyActionCard = {
  id: string;
  tag: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  why: string;
  confidence: "low" | "medium" | "high";
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
    const worst = runningLow[0];
    cards.push({
      id: "running-low",
      tag: "Likely running low",
      title: `${runningLow.length} item${runningLow.length > 1 ? "s" : ""} likely running low`,
      body: runningLow.map((i) => i.product_name).join(" · "),
      to: "/this-week",
      cta: "Add to list",
      why: `Because: ${worst.product_name} usually lasts about ${worst.estimated_days_of_stock_remaining} more day${worst.estimated_days_of_stock_remaining === 1 ? "" : "s"} based on how often you buy it.`,
      confidence: pantry?.confidence ?? "low",
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
        why: `Because: your last ${events.length} shopping trips averaged ${planning.averageGapDays} days apart, and it's been ${daysSinceLast} since your last one.`,
        confidence: planning.score >= 70 ? "high" : planning.score >= 40 ? "medium" : "low",
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
      why: `Because: your shopping history includes ${distinctStores.size} different stores, so we can compare prices across them.`,
      confidence: "medium",
    });
  }

  return cards;
}
