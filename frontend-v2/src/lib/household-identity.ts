import type { ShoppingEventSummary } from "@/lib/api";
import type { FrequentProduct } from "@/lib/real-data";

// The Household Identity Engine forms an opinion — a memorable archetype,
// not a score — about how a household shops, but only once there's enough
// real shopping history to support it. Below the evidence threshold it
// says so plainly rather than guessing. Household-centric, not
// grocery-specific: every signal here (cadence, basket size, channel,
// store type, declared loyalty) generalizes to any purchase category.

export type HouseholdArchetypeId =
  | "quick-commerce-heavy"
  | "weekend-planner"
  | "value-seeker"
  | "bulk-buyer"
  | "brand-loyal"
  | "convenience-shopper"
  | "minimalist-buyer"
  | "balanced-shopper";

export type HouseholdIdentity = {
  archetype: HouseholdArchetypeId;
  label: string;
  evidence: string[];
};

const MIN_EVENTS_FOR_IDENTITY = 3;

const VALUE_RETAILER_MARKERS = [
  "dmart",
  "d-mart",
  "big bazaar",
  "reliance smart",
  "vishal mega mart",
  "more",
];

function round(n: number) {
  return Math.round(n);
}

function rupees(n: number) {
  return `₹${round(n).toLocaleString("en-IN")}`;
}

// Returns null below the real-evidence threshold — the caller should render
// "We're still learning your shopping style" rather than treat null as an
// archetype of its own.
export function computeHouseholdIdentity(
  events: ShoppingEventSummary[] | null,
  frequentProducts: FrequentProduct[] | null,
): HouseholdIdentity | null {
  if (!events || events.length < MIN_EVENTS_FOR_IDENTITY) return null;

  const dated = events.filter(
    (e): e is ShoppingEventSummary & { bill_date: string } => !!e.bill_date,
  );
  if (dated.length < MIN_EVENTS_FOR_IDENTITY) return null;

  const weekendCount = dated.filter((e) => {
    const day = new Date(e.bill_date).getDay();
    return day === 0 || day === 6;
  }).length;
  const weekendRatio = weekendCount / dated.length;

  const spends = events.map((e) => e.total_spend).filter((s): s is number => s != null);
  const avgBasket = spends.length ? spends.reduce((a, b) => a + b, 0) / spends.length : null;

  const quickCommerceCount = events.filter((e) => e.purchase_method === "quick_commerce").length;
  const quickCommerceRatio = quickCommerceCount / events.length;

  const sortedDates = dated.map((e) => new Date(e.bill_date).getTime()).sort((a, b) => a - b);
  const spanDays =
    sortedDates.length > 1 ? (sortedDates[sortedDates.length - 1] - sortedDates[0]) / 86400000 : 0;
  const eventsPerWeek = spanDays > 0 ? (dated.length / spanDays) * 7 : 0;
  const avgGapDays = eventsPerWeek > 0 ? round(7 / eventsPerWeek) : null;

  const storeNames = events.map((e) => e.store_name?.toLowerCase() ?? "").filter(Boolean);
  const valueRetailerCount = storeNames.filter((s) =>
    VALUE_RETAILER_MARKERS.some((marker) => s.includes(marker)),
  ).length;
  const valueRetailerRatio = storeNames.length ? valueRetailerCount / storeNames.length : 0;

  const trackedProducts = frequentProducts ?? [];
  const brandedProducts = trackedProducts.filter((p) => !!p.preferredBrand);
  const brandLoyaltyRatio =
    trackedProducts.length > 0 ? brandedProducts.length / trackedProducts.length : 0;

  if (quickCommerceRatio >= 0.5) {
    return {
      archetype: "quick-commerce-heavy",
      label: "Quick Commerce Heavy",
      evidence: [
        `${quickCommerceCount} of your last ${events.length} shopping events were quick-commerce orders.`,
        eventsPerWeek > 0 ? `You shop roughly ${eventsPerWeek.toFixed(1)} times a week.` : null,
      ].filter((e): e is string => e != null),
    };
  }

  if (weekendRatio >= 0.6 && avgBasket != null) {
    return {
      archetype: "weekend-planner",
      label: "Weekend Planner",
      evidence: [
        `${weekendCount} of your last ${dated.length} shopping trips happened on a Saturday or Sunday.`,
        avgGapDays != null ? `Your shopping cadence is roughly every ${avgGapDays} days.` : null,
        `Average basket size is ${rupees(avgBasket)}.`,
      ].filter((e): e is string => e != null),
    };
  }

  if (valueRetailerRatio >= 0.5 && avgBasket != null) {
    return {
      archetype: "value-seeker",
      label: "Value Seeker",
      evidence: [
        `Most of your shopping happens at value-focused stores.`,
        `Average basket size is ${rupees(avgBasket)}.`,
      ],
    };
  }

  if (avgBasket != null && avgBasket >= 2000 && avgGapDays != null && avgGapDays >= 10) {
    return {
      archetype: "bulk-buyer",
      label: "Bulk Buyer",
      evidence: [
        `Average basket size is ${rupees(avgBasket)}, with trips roughly every ${avgGapDays} days.`,
      ],
    };
  }

  if (brandLoyaltyRatio >= 0.6) {
    return {
      archetype: "brand-loyal",
      label: "Brand Loyal",
      evidence: [
        `You've told us a preferred brand for ${brandedProducts.length} of ${trackedProducts.length} products you regularly buy.`,
      ],
    };
  }

  if (eventsPerWeek >= 1.5 && avgBasket != null && avgBasket < 1500) {
    return {
      archetype: "convenience-shopper",
      label: "Convenience Shopper",
      evidence: [
        `You shop about ${eventsPerWeek.toFixed(1)} times a week.`,
        `Your baskets are smaller, averaging ${rupees(avgBasket)}.`,
      ],
    };
  }

  if (avgBasket != null && avgBasket < 800) {
    return {
      archetype: "minimalist-buyer",
      label: "Minimalist Buyer",
      evidence: [
        `Your average basket size is ${rupees(avgBasket)}, smaller than most households we see.`,
      ],
    };
  }

  return {
    archetype: "balanced-shopper",
    label: "Balanced Shopper",
    evidence: [
      "Your shopping doesn't lean heavily toward any one pattern yet — a healthy mix of timing and basket sizes.",
    ],
  };
}

// Replaces percentage-first messaging everywhere it appears. The number can
// still exist behind an info affordance, but this sentence is always the
// primary message.
export function confidenceNarrative(eventCount: number): string {
  if (eventCount === 0) return "We're just getting to know your household.";
  if (eventCount < MIN_EVENTS_FOR_IDENTITY)
    return "We're beginning to recognise your shopping habits.";
  if (eventCount < 8) return "We understand your routine well.";
  return "We can now make personalised recommendations with confidence.";
}
