/**
 * Founder Analytics — Apps Script Web App
 *
 * Anonymous product-journey event logging for Household Advisor beta.
 * NOT Google Analytics, NOT marketing analytics — a private log read only
 * by the founder, used to see how households naturally move through the
 * app. Receives batches of events from frontend-v2/src/lib/analytics.ts.
 *
 * Deploy / update steps:
 * 1. Go to https://script.google.com → open the existing "Founder
 *    Analytics" project (or New project if starting fresh).
 * 2. Delete existing code, paste this whole file in.
 * 3. Deploy → Manage deployments → edit the existing deployment → select
 *    "New version" → Deploy. (Reusing the existing deployment keeps the
 *    Web App URL unchanged — do NOT create a brand-new deployment unless
 *    you're fine updating the URL in analytics.ts too.)
 *    - Execute as: Me
 *    - Who has access: Anyone
 *
 * Behavior:
 * - Each request carries a batch: a form field "events" containing a JSON
 *   array of event objects (frontend batches up to 10 events, or every
 *   30s, or on page leave, before sending — this script just appends one
 *   row per event in the batch).
 * - First event creates two sheets in the *active spreadsheet bound to
 *   this script*:
 *     - "Events"    — one row per event (raw log)
 *     - "Dashboard" — formulas summarizing Events, recalculated live
 * - No PII, shopping list contents, bill contents, or product names are
 *   ever expected in the payload — this script does not enforce that;
 *   the frontend is responsible for only sending product-interaction
 *   events with the approved field set.
 */

const EVENTS_SHEET_NAME = "Events";
const DASHBOARD_SHEET_NAME = "Dashboard";
const EVENTS_HEADER = [
  "Timestamp",
  "Session ID",
  "Household ID",
  "Event Name",
  "Screen",
  "Platform",
  "Device",
  "Browser",
  "App Version",
  "Details",
];

function doPost(e) {
  try {
    const events = parseEvents(e);
    if (events.length > 0) {
      const sheet = getOrCreateEventsSheet();
      const rows = events.map((evt) => [
        evt.timestamp || new Date().toISOString(),
        evt.sessionId || "",
        evt.householdId || "",
        evt.eventName || "",
        evt.screen || "",
        evt.platform || "",
        evt.device || "",
        evt.browser || "",
        evt.appVersion || "",
        evt.details || "",
      ]);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, EVENTS_HEADER.length).setValues(rows);
    }

    ensureDashboard();

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, count: events.length }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Events arrive either as a form field "events" (JSON-array string, from
 * sendBeacon/fetch with a URL-encoded body) or as a raw JSON POST body with
 * an "events" array — support both since the frontend may use either path.
 */
function parseEvents(e) {
  const params = e.parameter || {};
  if (params.events) {
    return JSON.parse(params.events);
  }
  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      if (body.events) {
        return typeof body.events === "string" ? JSON.parse(body.events) : body.events;
      }
    } catch (err) {
      // not JSON — fall through to empty
    }
  }
  return [];
}

function getOrCreateEventsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(EVENTS_SHEET_NAME);
    sheet.appendRow(EVENTS_HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Lightweight dashboard — recomputed each time an event lands, using plain
 * COUNTIF/COUNTUNIQUE formulas pointed at the Events sheet so it never goes
 * stale and needs no manual refresh.
 */
function ensureDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let dash = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  if (dash) return; // formulas already in place, nothing to redo

  dash = ss.insertSheet(DASHBOARD_SHEET_NAME);
  const rows = [
    ["Metric", "Value"],
    ["Total sessions", '=COUNTUNIQUE(Events!B2:B)'],
    ["App opened", '=COUNTIF(Events!D2:D,"App Opened")'],
    ["Onboarding started", '=COUNTIF(Events!D2:D,"Started Onboarding")'],
    ["Onboarding completed", '=COUNTIF(Events!D2:D,"Completed Onboarding")'],
    ["Selected a teaching method", '=COUNTIF(Events!D2:D,"Selected Teaching Method")'],
    ["Viewed Household HQ", '=COUNTIF(Events!D2:D,"Viewed Household HQ")'],
    ["Opened Shopping Planner", '=COUNTIF(Events!D2:D,"Opened Shopping Planner")'],
    ["Shopping event created", '=COUNTIF(Events!D2:D,"Shopping Event Created")'],
    ["Bill upload started", '=COUNTIF(Events!D2:D,"Bill Upload Started")'],
    ["Bill upload succeeded", '=COUNTIF(Events!D2:D,"Bill Upload Success")'],
    ["Bill upload failed", '=COUNTIF(Events!D2:D,"Bill Upload Failed")'],
    ["Feedback submitted", '=COUNTIF(Events!D2:D,"Submitted Feedback")'],
    [],
    ["Most-visited screens (top 5, by event count)", '=QUERY(Events!E2:E,"select E, count(E) where E is not null group by E order by count(E) desc limit 5",0)'],
  ];
  dash.getRange(1, 1, rows.length, 2).setValues(
    rows.map((r) => (r.length === 2 ? r : [r[0] || "", ""])),
  );
  dash.setFrozenRows(1);
  dash.autoResizeColumns(1, 2);
}

function doGet() {
  return ContentService.createTextOutput("Founder Analytics endpoint is live.");
}
