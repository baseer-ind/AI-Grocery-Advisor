/**
 * analytics.ts
 *
 * Founder Analytics — anonymous, batched product-journey event logging.
 * NOT Google Analytics, NOT marketing analytics, NOT user tracking. Purpose:
 * understand how households naturally move through Household Advisor during
 * beta, using the existing Google Apps Script + Sheets infrastructure (same
 * pattern as feedbackService.ts) — no external analytics service.
 *
 * Hard rule: never send names, emails, phone numbers, shopping list
 * contents, bill contents, OCR text, product names, or any other PII.
 * Only the named product-interaction events fired by call sites below.
 *
 * Batching: events queue in memory and flush every 30s, when 10 events
 * accumulate, or when the user leaves the app. A failed flush is retried
 * once, then discarded — analytics must never block or slow the app.
 */

import { postToGoogleSheets } from "@/lib/feedbackService";

const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzNSrbL3w3I9nGUVon74H5VHbGLzv1zC-Um-hk9we36hLTVIsLrnDrueDWQv6ifnBkVQQ/exec";

const APP_VERSION = "beta";
const SESSION_ID_KEY = "ha_an_session_id";
const FLUSH_INTERVAL_MS = 30_000;
const MAX_QUEUE_SIZE = 10;

interface AnalyticsEvent {
  timestamp: string;
  sessionId: string;
  householdId: string | number;
  eventName: string;
  screen: string;
  platform: string;
  device: string;
  browser: string;
  appVersion: string;
  details: string;
}

let eventQueue: AnalyticsEvent[] = [];
let currentHouseholdId: string | number = "";
let initialized = false;

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

function detectPlatform(): string {
  if (typeof navigator === "undefined") return "unknown";
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "web";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari")) return "safari";
  return "unknown";
}

/** Associate subsequent events with a household, once one is known. */
export function identifyHousehold(householdId: string | number | null | undefined) {
  currentHouseholdId = householdId ?? "";
}

/** Push a fully-formed event onto the in-memory queue, flushing if full. */
export function queue(event: AnalyticsEvent) {
  eventQueue.push(event);
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    void flush();
  }
}

/** Record a named product-interaction event. Only meaningful events — never raw clicks. */
export function track(eventName: string, screen: string, details?: Record<string, unknown>) {
  queue({
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    householdId: currentHouseholdId,
    eventName,
    screen,
    platform: detectPlatform(),
    device: detectDevice(),
    browser: detectBrowser(),
    appVersion: APP_VERSION,
    details: details ? JSON.stringify(details) : "",
  });
}

async function send(batch: AnalyticsEvent[], isRetry = false): Promise<void> {
  if (!ANALYTICS_ENDPOINT || batch.length === 0) return;
  const result = await postToGoogleSheets(ANALYTICS_ENDPOINT, {
    events: JSON.stringify(batch),
  });
  if (!result.ok && !isRetry) {
    void send(batch, true);
  }
  // Otherwise discard silently — analytics must never affect the app.
}

/** Send everything currently queued. Uses sendBeacon when leaving the page. */
export function flush(useBeacon = false): void {
  if (eventQueue.length === 0) return;
  const batch = eventQueue;
  eventQueue = [];

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const body = new URLSearchParams({
      events: JSON.stringify(batch),
      payload: JSON.stringify({ events: JSON.stringify(batch) }),
    });
    const ok = navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
    if (ok) return;
  }
  void send(batch);
}

/** Call once on app boot. Sets up the flush interval and leave-page handlers. */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  setInterval(() => flush(), FLUSH_INTERVAL_MS);

  window.addEventListener("beforeunload", () => flush(true));
  window.addEventListener("pagehide", () => flush(true));
}
