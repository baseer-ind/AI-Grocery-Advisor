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
  description: string;
  status: UnlockStatus;
  reason: string;
  to: string;
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
          description: "A daily read on whether you're stocked up or due for a trip.",
          status: "unlocked",
          reason: "Based on your real shopping history.",
          to: "/today",
        }
      : {
          id: "shopping-readiness",
          label: "Shopping Readiness",
          description: "A daily read on whether you're stocked up or due for a trip.",
          status: "locked",
          reason: "Needs your first shopping event.",
          to: "/upload",
        },
  );

  unlocks.push(
    distinctStores >= 2
      ? {
          id: "store-recommendations",
          label: "Store Recommendations",
          description: "Compare your basket across the stores you actually shop at.",
          status: "unlocked",
          reason: `Your history spans ${distinctStores} stores.`,
          to: "/bill-check",
        }
      : {
          id: "store-recommendations",
          label: "Store Recommendations",
          description: "Compare your basket across the stores you actually shop at.",
          status: "locked",
          reason: `Needs shopping events from ${2 - distinctStores} more store${2 - distinctStores === 1 ? "" : "s"}.`,
          to: "/upload",
        },
  );

  unlocks.push(
    pantry && pantry.confidence !== "low"
      ? {
          id: "pantry-prediction",
          label: "Pantry Prediction",
          description: "We estimate what's likely running low, without you tracking anything.",
          status: "unlocked",
          reason: "Confident enough purchase history to predict what's running low.",
          to: "/this-week",
        }
      : pantry
        ? {
            id: "pantry-prediction",
            label: "Pantry Prediction",
            description: "We estimate what's likely running low, without you tracking anything.",
            status: "learning",
            reason: "We're tracking your purchases, but need a bit more history to be confident.",
            to: "/this-week",
          }
        : {
            id: "pantry-prediction",
            label: "Pantry Prediction",
            description: "We estimate what's likely running low, without you tracking anything.",
            status: "locked",
            reason: "Needs at least 2 shopping events.",
            to: "/upload",
          },
  );

  unlocks.push(
    hasPreferredBrand
      ? {
          id: "brand-recommendations",
          label: "Brand Recommendations",
          description: "Recommendations that respect the brands you actually prefer.",
          status: "unlocked",
          reason: "You've told us preferred brands for some products.",
          to: "/products",
        }
      : {
          id: "brand-recommendations",
          label: "Brand Recommendations",
          description: "Recommendations that respect the brands you actually prefer.",
          status: "locked",
          reason: "Tell us a preferred brand for a frequently bought product to unlock this.",
          to: "/products",
        },
  );

  const eventsNeededForAlerts = Math.max(0, 3 - eventCount);
  unlocks.push(
    eventCount >= 3
      ? {
          id: "price-alerts",
          label: "Price Alerts",
          description: "We'll flag it when a price moves meaningfully on what you buy.",
          status: "unlocked",
          reason: "Enough shopping history to detect real price changes.",
          to: "/bill-check",
        }
      : {
          id: "price-alerts",
          label: "Price Alerts",
          description: "We'll flag it when a price moves meaningfully on what you buy.",
          status: "locked",
          reason: `Needs ${eventsNeededForAlerts} more shopping event${eventsNeededForAlerts === 1 ? "" : "s"}.`,
          to: "/upload",
        },
  );

  unlocks.push(
    planning != null
      ? {
          id: "planning-score",
          label: "Shopping Pattern Insights",
          description: "How consistent your shopping cadence is, and when you're due next.",
          status: "unlocked",
          reason: "Your shopping cadence is consistent enough to detect a pattern.",
          to: "/habits",
        }
      : {
          id: "planning-score",
          label: "Shopping Pattern Insights",
          description: "How consistent your shopping cadence is, and when you're due next.",
          status: "locked",
          reason: "Needs at least 3 shopping events to detect a pattern.",
          to: "/upload",
        },
  );

  return unlocks;
}
