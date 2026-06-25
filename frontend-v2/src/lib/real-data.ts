// Single source of truth for "does this browser have any real household
// data yet?" — used to gate dashboards that would otherwise fall back to
// `sample-data.ts`. A real user must never see fabricated numbers presented
// as their own without explicitly opting into sample mode.
const HAS_REAL_DATA_KEY = "hb_has_real_data";

export function markHasRealData() {
  try {
    localStorage.setItem(HAS_REAL_DATA_KEY, "1");
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function hasRealData(): boolean {
  try {
    return (
      localStorage.getItem(HAS_REAL_DATA_KEY) === "1" ||
      !!localStorage.getItem("manualMonthlySpend")
    );
  } catch {
    return false;
  }
}

const HOUSEHOLD_PROFILE_KEY = "hb_household_profile";

export type StoredHouseholdProfile = {
  householdId: number;
  city: string;
  size: number;
  householdType: string;
  shoppingStyle: string;
  planningStyle: string;
  pantryReadiness: string;
  confidence: number;
  // Raw onboarding answers, kept verbatim alongside the derived snapshot above
  // so screens like Household Memory can render honest observations
  // ("favourite store", "budget pattern") sourced from what the household
  // actually told us, not just the summarized style labels.
  stores?: string[];
  frequency?: string | null;
  budget?: number | null;
  priorities?: string[];
  // When this profile was first saved — the one genuinely real timestamp we
  // have for "household created", used by the Household Memory Timeline.
  // Preserved across re-saves rather than overwritten, so it never drifts.
  createdAt?: string;
};

export function saveHouseholdProfile(profile: StoredHouseholdProfile) {
  try {
    const existing = getHouseholdProfile();
    const createdAt = existing?.createdAt ?? new Date().toISOString();
    localStorage.setItem(HOUSEHOLD_PROFILE_KEY, JSON.stringify({ ...profile, createdAt }));
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function getHouseholdProfile(): StoredHouseholdProfile | null {
  try {
    const raw = localStorage.getItem(HOUSEHOLD_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StoredHouseholdProfile) : null;
  } catch {
    return null;
  }
}

// Frequently Purchased Products — a household's own self-reported "we
// regularly buy this" list, optionally with a preferred brand per product.
// This is deliberately self-selected, not derived from bill history, so it
// works before a household has ever uploaded a bill.
const FREQUENT_PRODUCTS_KEY = "hb_frequent_products";

export type FrequentProduct = {
  name: string;
  preferredBrand?: string;
};

const FREQUENT_PRODUCTS_SAVED_AT_KEY = "hb_frequent_products_saved_at";

export function saveFrequentProducts(products: FrequentProduct[]) {
  try {
    localStorage.setItem(FREQUENT_PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(FREQUENT_PRODUCTS_SAVED_AT_KEY, new Date().toISOString());
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function getFrequentProducts(): FrequentProduct[] {
  try {
    const raw = localStorage.getItem(FREQUENT_PRODUCTS_KEY);
    return raw ? (JSON.parse(raw) as FrequentProduct[]) : [];
  } catch {
    return [];
  }
}

export function getFrequentProductsSavedAt(): string | null {
  try {
    return localStorage.getItem(FREQUENT_PRODUCTS_SAVED_AT_KEY);
  } catch {
    return null;
  }
}
