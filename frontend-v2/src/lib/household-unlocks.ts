import type { PredictedPantry, ShoppingEventSummary } from "@/lib/api";
import type { PlanningScore } from "@/lib/household-intelligence";
import type { FrequentProduct } from "@/lib/real-data";

// Capabilities the assistant can offer, gated on real signal thresholds —
// never gamified (no points/streaks), just an honest "here's what unlocks
// this." Household-centric, not grocery-specific: every unlock here is
// phrased in terms of shopping events / stores / products in general, so
// the same model will hold for pharmacy, pet supplies, etc. later.

export type UnlockStatus = "unlocked" | "learning" | "locked";

export type Unlock = {
  id: string;
  label: string;
  status: UnlockStatus;
  reason: string;
};

export function buildUnlocks(
  events: ShoppingEventSummary[] | null,
  pantry: PredictedPantry | null,
  planning: PlanningScore | null,
  frequentProducts: FrequentProduct[] | null,
): Unlock[] {
  const eventCount = events?.length ?? 0;
  const distinctStores = new Set((events ?? []).map((e) => e.store_name).filter(Boolean)).size;
  const hasPreferredBrand = (frequentProducts ?? []).some((p) => !!p.preferredBrand);

  const unlocks: Unlock[] = [];

  unlocks.push(
    eventCount >= 1
      ? {
          id: "shopping-readiness",
          label: "Shopping Readiness",
          status: "unlocked",
          reason: "Based on your real shopping history.",
        }
      : {
          id: "shopping-readiness",
          label: "Shopping Readiness",
          status: "locked",
          reason: "Needs your first shopping event.",
        },
  );

  unlocks.push(
    distinctStores >= 2
      ? {
          id: "store-recommendations",
          label: "Store Recommendations",
          status: "unlocked",
          reason: `Your history spans ${distinctStores} stores.`,
        }
      : {
          id: "store-recommendations",
          label: "Store Recommendations",
          status: "locked",
          reason: `Needs shopping events from ${2 - distinctStores} more store${2 - distinctStores === 1 ? "" : "s"}.`,
        },
  );

  unlocks.push(
    pantry && pantry.confidence !== "low"
      ? {
          id: "pantry-prediction",
          label: "Pantry Prediction",
          status: "unlocked",
          reason: "Confident enough purchase history to predict what's running low.",
        }
      : pantry
        ? {
            id: "pantry-prediction",
            label: "Pantry Prediction",
            status: "learning",
            reason: "We're tracking your purchases, but need a bit more history to be confident.",
          }
        : {
            id: "pantry-prediction",
            label: "Pantry Prediction",
            status: "locked",
            reason: "Needs at least 2 shopping events.",
          },
  );

  unlocks.push(
    hasPreferredBrand
      ? {
          id: "brand-recommendations",
          label: "Brand Recommendations",
          status: "unlocked",
          reason: "You've told us preferred brands for some products.",
        }
      : {
          id: "brand-recommendations",
          label: "Brand Recommendations",
          status: "locked",
          reason: "Tell us a preferred brand for a frequently bought product to unlock this.",
        },
  );

  const eventsNeededForAlerts = Math.max(0, 3 - eventCount);
  unlocks.push(
    eventCount >= 3
      ? {
          id: "price-alerts",
          label: "Price Alerts",
          status: "unlocked",
          reason: "Enough shopping history to detect real price changes.",
        }
      : {
          id: "price-alerts",
          label: "Price Alerts",
          status: "locked",
          reason: `Needs ${eventsNeededForAlerts} more shopping event${eventsNeededForAlerts === 1 ? "" : "s"}.`,
        },
  );

  unlocks.push(
    planning != null
      ? {
          id: "planning-score",
          label: "Shopping Pattern Insights",
          status: "unlocked",
          reason: "Your shopping cadence is consistent enough to detect a pattern.",
        }
      : {
          id: "planning-score",
          label: "Shopping Pattern Insights",
          status: "locked",
          reason: "Needs at least 3 shopping events to detect a pattern.",
        },
  );

  return unlocks;
}
