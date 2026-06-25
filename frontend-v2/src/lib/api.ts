const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

export type PredictedPantryItem = {
  product_id: number;
  product_name: string;
  category: string;
  last_purchased_bill_date: string | null;
  typical_repurchase_interval_days: number | null;
  estimated_days_of_stock_remaining: number | null;
  confidence: "low" | "medium" | "high";
  purchase_count: number;
};

export type PredictedPantry = {
  household_id: number;
  items: PredictedPantryItem[];
  confidence: "low" | "medium" | "high";
};

export type ShoppingEventSummary = {
  shopping_event_id: number;
  bill_date: string | null;
  store_name: string | null;
  total_spend: number | null;
  purchase_method: string | null;
};

async function getJson<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getPredictedPantry(householdId: number) {
  return getJson<PredictedPantry>(`/api/v1/household/${householdId}/pantry/predicted`);
}

export function getShoppingEvents(householdId: number) {
  return getJson<ShoppingEventSummary[]>(`/api/v1/household/${householdId}/shopping-events`);
}
