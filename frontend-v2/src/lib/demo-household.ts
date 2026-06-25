import type { PredictedPantry, ShoppingEventSummary } from "@/lib/api";
import type { StoredHouseholdProfile } from "@/lib/real-data";

// A demo household, shaped exactly like real data so the demo experience and the
// real experience run through the same components. Only the content is fake —
// the interface, hierarchy, and logic are identical to what a real household sees.
export const demoProfile: StoredHouseholdProfile = {
  householdId: -1,
  city: "Hyderabad",
  size: 4,
  householdType: "Family",
  shoppingStyle: "Value Shopper",
  planningStyle: "Structured Planner",
  pantryReadiness: "Well stocked",
  confidence: 0.92,
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const demoEvents: ShoppingEventSummary[] = [
  {
    shopping_event_id: -1,
    bill_date: daysAgo(2),
    store_name: "BigBasket",
    total_spend: 2140,
    purchase_method: "online",
  },
  {
    shopping_event_id: -2,
    bill_date: daysAgo(9),
    store_name: "DMart",
    total_spend: 3380,
    purchase_method: "in_store",
  },
  {
    shopping_event_id: -3,
    bill_date: daysAgo(16),
    store_name: "BigBasket",
    total_spend: 1960,
    purchase_method: "online",
  },
  {
    shopping_event_id: -4,
    bill_date: daysAgo(23),
    store_name: "DMart",
    total_spend: 3120,
    purchase_method: "in_store",
  },
  {
    shopping_event_id: -5,
    bill_date: daysAgo(30),
    store_name: "BigBasket",
    total_spend: 2280,
    purchase_method: "online",
  },
];

export const demoPantry: PredictedPantry = {
  household_id: -1,
  confidence: "high",
  items: [
    {
      product_id: -1,
      product_name: "Cooking oil",
      category: "Staples",
      last_purchased_bill_date: daysAgo(23),
      typical_repurchase_interval_days: 28,
      estimated_days_of_stock_remaining: 3,
      confidence: "high",
      purchase_count: 4,
    },
    {
      product_id: -2,
      product_name: "Milk",
      category: "Dairy",
      last_purchased_bill_date: daysAgo(2),
      typical_repurchase_interval_days: 4,
      estimated_days_of_stock_remaining: 2,
      confidence: "high",
      purchase_count: 6,
    },
    {
      product_id: -3,
      product_name: "Rice",
      category: "Staples",
      last_purchased_bill_date: daysAgo(16),
      typical_repurchase_interval_days: 45,
      estimated_days_of_stock_remaining: 21,
      confidence: "medium",
      purchase_count: 3,
    },
  ],
};
