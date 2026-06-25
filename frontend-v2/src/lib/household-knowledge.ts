import type { PredictedPantry, ShoppingEventSummary } from "@/lib/api";
import { buildHouseholdMemory } from "@/lib/household-memory";
import { buildHouseholdTimeline, type TimelineEntry } from "@/lib/household-timeline";
import type { PlanningScore } from "@/lib/household-intelligence";
import { buildUnlocks, type Unlock } from "@/lib/household-unlocks";
import type { FrequentProduct, StoredHouseholdProfile, TaughtFact } from "@/lib/real-data";

// Household Knowledge — the internal "what do we actually understand about
// this household" view, surfaced honestly. Every entry traces back to a
// real signal (onboarding answer, shopping history, or something the
// household explicitly taught us) — nothing here is inferred and shown as
// certain. This module is intentionally household-centric (it doesn't know
// about "groceries" specifically), so it can carry pharmacy/pet/baby facts
// later without a rewrite.

export type KnownFact = {
  id: string;
  label: string;
  value: string;
};

export type LearningFact = {
  id: string;
  label: string;
  unlockedBy: string;
};

export type HouseholdKnowledge = {
  known: KnownFact[];
  learning: LearningFact[];
  recentlyLearned: TimelineEntry[];
  unlocks: Unlock[];
};

export function buildHouseholdKnowledge(
  profile: StoredHouseholdProfile | null,
  events: ShoppingEventSummary[] | null,
  frequentProducts: FrequentProduct[] | null,
  frequentProductsSavedAt: string | null,
  taughtFacts: TaughtFact[],
  pantry: PredictedPantry | null,
  planning: PlanningScore | null,
): HouseholdKnowledge {
  const observations = buildHouseholdMemory(profile, events, frequentProducts);

  const known: KnownFact[] = observations
    .filter((o) => o.value != null)
    .map((o) => ({ id: o.id, label: o.label, value: o.value as string }));

  for (const fact of taughtFacts) {
    known.push({ id: `taught-${fact.id}`, label: fact.category, value: fact.text });
  }

  const learning: LearningFact[] = observations
    .filter((o) => o.value == null && o.unlockedBy != null)
    .map((o) => ({ id: o.id, label: o.label, unlockedBy: o.unlockedBy as string }));

  const timeline = buildHouseholdTimeline(profile, events, frequentProductsSavedAt);
  const recentlyLearned = timeline.slice(0, 3);

  const unlocks = buildUnlocks(events, pantry, planning, frequentProducts);

  return { known, learning, recentlyLearned, unlocks };
}
