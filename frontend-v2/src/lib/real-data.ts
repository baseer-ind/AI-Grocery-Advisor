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
    return localStorage.getItem(HAS_REAL_DATA_KEY) === "1" || !!localStorage.getItem("manualMonthlySpend");
  } catch {
    return false;
  }
}
