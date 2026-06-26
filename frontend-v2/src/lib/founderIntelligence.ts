/**
 * founderIntelligence.ts
 *
 * Anonymous product-journey event logging — NOT marketing analytics, NOT
 * user tracking for business metrics. Purpose: let the founder see how real
 * households move through onboarding and teaching paths, even when they
 * never submit the feedback form.
 *
 * Hard rule: never log PII (name/email/phone), shopping list contents, or
 * bill contents. Only the named product-interaction events below.
 */

import { postToGoogleSheets } from "@/lib/feedbackService";

// Paste the Web App URL from deploying founder-intelligence-apps-script.gs
// (repo root) here. Until set, logEvent() is a silent no-op.
const FOUNDER_INTELLIGENCE_URL = "";

const SESSION_ID_KEY = "ha_fi_session_id";
const FIRST_VISIT_KEY = "ha_fi_first_visit_at";
const LAST_VISIT_KEY = "ha_fi_last_visit_at";
const RETURN_FLAGS_KEY = "ha_fi_return_flags";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function logEvent(
  eventName: string,
  screen: string,
  details?: Record<string, unknown>,
  householdId?: number | string | null,
) {
  if (!FOUNDER_INTELLIGENCE_URL) return;
  void postToGoogleSheets(FOUNDER_INTELLIGENCE_URL, {
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    householdId: householdId ?? "",
    eventName,
    screen,
    details: details ? JSON.stringify(details) : "",
  });
}

/**
 * Call once on app boot (e.g. root layout). Fires "App Opened" plus, at
 * most once per calendar day, "Returned Next Day" / "Returned After 7 Days"
 * based on the gap since the last visit recorded in localStorage.
 */
export function trackAppOpened(screen: string) {
  let firstVisit: string | null = null;
  let lastVisit: string | null = null;
  try {
    firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  } catch {
    // localStorage unavailable — skip return-visit tracking, still log App Opened
  }

  const now = new Date();
  logEvent("App Opened", screen);

  if (!firstVisit) {
    try {
      localStorage.setItem(FIRST_VISIT_KEY, now.toISOString());
    } catch {
      // non-critical
    }
  } else if (lastVisit) {
    const daysSinceLast = Math.floor(
      (now.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24),
    );
    let flags: Record<string, boolean> = {};
    try {
      flags = JSON.parse(localStorage.getItem(RETURN_FLAGS_KEY) ?? "{}");
    } catch {
      flags = {};
    }
    if (daysSinceLast >= 1 && daysSinceLast < 7 && !flags.nextDay) {
      logEvent("Returned Next Day", screen);
      flags.nextDay = true;
    }
    if (daysSinceLast >= 7 && !flags.afterWeek) {
      logEvent("Returned After 7 Days", screen);
      flags.afterWeek = true;
    }
    try {
      localStorage.setItem(RETURN_FLAGS_KEY, JSON.stringify(flags));
    } catch {
      // non-critical
    }
  }

  try {
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  } catch {
    // non-critical
  }
}
