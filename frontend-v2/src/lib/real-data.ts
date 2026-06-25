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

// Shopping Planner corrections — a household's own edits to the predicted
// "likely needed" list: items they removed because the prediction was wrong,
// and items they manually added because we don't know about them yet.
// Corrections persist and are re-applied on every future render of the
// planner — that's the entire "learns from corrections" promise, no hidden
// model retraining implied.
const PLANNER_REMOVED_KEY = "hb_planner_removed";
const PLANNER_ADDED_KEY = "hb_planner_added";

export type PlannerAddedItem = { name: string; addedAt: string };

export function getPlannerRemoved(): string[] {
  try {
    const raw = localStorage.getItem(PLANNER_REMOVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function removePlannerItem(name: string) {
  try {
    const current = getPlannerRemoved();
    if (!current.includes(name)) {
      localStorage.setItem(PLANNER_REMOVED_KEY, JSON.stringify([...current, name]));
    }
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function getPlannerAdded(): PlannerAddedItem[] {
  try {
    const raw = localStorage.getItem(PLANNER_ADDED_KEY);
    return raw ? (JSON.parse(raw) as PlannerAddedItem[]) : [];
  } catch {
    return [];
  }
}

export function addPlannerItem(name: string) {
  try {
    const current = getPlannerAdded();
    if (!current.some((i) => i.name === name)) {
      localStorage.setItem(
        PLANNER_ADDED_KEY,
        JSON.stringify([...current, { name, addedAt: new Date().toISOString() }]),
      );
    }
    // Adding an item the household knows it needs overrides any earlier
    // removal of that same item — the correction reflects current intent.
    const removed = getPlannerRemoved().filter((n) => n !== name);
    localStorage.setItem(PLANNER_REMOVED_KEY, JSON.stringify(removed));
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function removePlannerAddedItem(name: string) {
  try {
    const current = getPlannerAdded().filter((i) => i.name !== name);
    localStorage.setItem(PLANNER_ADDED_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

// Taught Household Facts — things a household tells the assistant directly
// because they can't yet be inferred from history ("we never buy soft
// drinks", "we always shop on salary day"). Deliberately household-centric,
// not grocery-specific — the category is free text, not a fixed grocery
// taxonomy, so this same store works for pharmacy/pet/baby facts later
// without a schema change.
const TAUGHT_FACTS_KEY = "hb_taught_facts";

export type TaughtFact = {
  id: string;
  text: string;
  category: string;
  taughtAt: string;
};

export function getTaughtFacts(): TaughtFact[] {
  try {
    const raw = localStorage.getItem(TAUGHT_FACTS_KEY);
    return raw ? (JSON.parse(raw) as TaughtFact[]) : [];
  } catch {
    return [];
  }
}

export function addTaughtFact(text: string, category: string) {
  try {
    const current = getTaughtFacts();
    const fact: TaughtFact = {
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      text,
      category,
      taughtAt: new Date().toISOString(),
    };
    localStorage.setItem(TAUGHT_FACTS_KEY, JSON.stringify([fact, ...current]));
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

export function removeTaughtFact(id: string) {
  try {
    const current = getTaughtFacts().filter((f) => f.id !== id);
    localStorage.setItem(TAUGHT_FACTS_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}

// First-unlocked timestamps — unlock status itself is always computed live
// from real signals (never stored as a fact), but the *moment* a capability
// first became unlocked is worth remembering for the Memory Timeline. We
// record it the first time we observe "unlocked" for a given id and never
// overwrite it, so it reflects when it actually happened, not when it was
// last viewed.
const UNLOCK_TIMESTAMPS_KEY = "hb_unlock_timestamps";

export function getUnlockTimestamps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(UNLOCK_TIMESTAMPS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function recordUnlockAchieved(id: string) {
  try {
    const current = getUnlockTimestamps();
    if (!current[id]) {
      current[id] = new Date().toISOString();
      localStorage.setItem(UNLOCK_TIMESTAMPS_KEY, JSON.stringify(current));
    }
  } catch {
    // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
  }
}
