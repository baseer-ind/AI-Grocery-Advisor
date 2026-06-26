import type { PredictedPantry, ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile } from "@/lib/real-data";
import type { HouseholdIdentity } from "@/lib/household-identity";

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

  const profileConfidence = Math.round(profile.confidence);
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
      done: !!profile && profile.confidence >= 90,
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

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export type ShoppingReadiness = {
  greeting: string;
  status: "ready" | "attention" | "unknown";
  headline: string;
  remember: string | null;
};

// The hero of Household HQ. A household doesn't wake up wondering how well the
// app understands them — they wake up wondering if they need to buy groceries.
// This answers that one question first; everything else (confidence, history,
// progress) is supporting detail, never the headline.
export function computeShoppingReadiness(
  pantry: PredictedPantry | null,
  events: ShoppingEventSummary[] | null,
  planning: PlanningScore | null,
  profile: StoredHouseholdProfile | null,
  firstName: string | null,
): ShoppingReadiness {
  const greeting = firstName ? `${timeOfDayGreeting()}, ${firstName}` : timeOfDayGreeting();

  if (!events || events.length === 0) {
    return {
      greeting,
      status: "unknown",
      headline: profile
        ? "Add your first bill to get real shopping readiness here."
        : "Build your household profile to get started.",
      remember: null,
    };
  }

  const lowStock = pantry?.items
    .filter(
      (i) => i.estimated_days_of_stock_remaining != null && i.estimated_days_of_stock_remaining < 5,
    )
    .sort(
      (a, b) =>
        (a.estimated_days_of_stock_remaining ?? 0) - (b.estimated_days_of_stock_remaining ?? 0),
    );

  let daysUntilNext: number | null = null;
  if (planning) {
    const lastDateStr = events[0]?.bill_date;
    const daysSinceLast = lastDateStr
      ? Math.round((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast != null) daysUntilNext = planning.averageGapDays - daysSinceLast;
  }

  const overdue = daysUntilNext != null && daysUntilNext <= 0;
  const needsAttention = (lowStock && lowStock.length > 0) || overdue;

  let headline: string;
  if (overdue) {
    headline = "Your next shopping trip looks overdue.";
  } else if (lowStock && lowStock.length > 0) {
    headline = "You're mostly stocked, but a few things are running low.";
  } else if (daysUntilNext != null && daysUntilNext <= 2) {
    headline = `You're well stocked — your next trip is likely in about ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}.`;
  } else {
    headline = "You're well stocked for now.";
  }

  const remember =
    lowStock && lowStock.length > 0
      ? `${lowStock
          .slice(0, 2)
          .map((i) => i.product_name)
          .join(" and ")} may run low before your next trip.`
      : null;

  return { greeting, status: needsAttention ? "attention" : "ready", headline, remember };
}

export type WeeklyActionCard = {
  id: string;
  tag: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  why: string;
  improve: string | null;
  confidence: "low" | "medium" | "high";
};

export function buildWeeklyActionCards(
  pantry: PredictedPantry | null,
  events: ShoppingEventSummary[] | null,
  planning: PlanningScore | null,
  identity: HouseholdIdentity | null = null,
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
      improve:
        worst.confidence !== "high"
          ? "A couple more shopping events with this product would make this estimate more reliable."
          : null,
      confidence: pantry?.confidence ?? "low",
    });
  }

  if (planning && events && events.length > 0) {
    const lastDateStr = events[0]?.bill_date;
    const daysSinceLast = lastDateStr
      ? Math.round((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast != null && daysSinceLast >= planning.averageGapDays) {
      const identityNote =
        identity?.archetype === "weekend-planner"
          ? " Since you're usually a Weekend Planner, waiting until Saturday for your main trip tends to work well."
          : "";
      cards.push({
        id: "next-trip",
        tag: "Next shopping recommendation",
        title: `You usually shop every ~${planning.averageGapDays} days — it's been ${daysSinceLast}`,
        body: `Based on your real shopping history, not a guess.${identityNote}`,
        to: "/this-week",
        cta: "Plan this week's list",
        why: `Because: your last ${events.length} shopping trips averaged ${planning.averageGapDays} days apart, and it's been ${daysSinceLast} since your last one.`,
        improve:
          planning.score < 70
            ? "A few more shopping events would make this cadence estimate more consistent."
            : null,
        confidence: planning.score >= 70 ? "high" : planning.score >= 40 ? "medium" : "low",
      });
    }
  }

  return cards;
}
