/**
 * Founder Intelligence — Apps Script Web App
 *
 * Deploy steps:
 * 1. Go to https://script.google.com → New project.
 * 2. Delete the boilerplate code, paste this whole file in.
 * 3. Click "Deploy" → "New deployment" → type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the resulting Web App URL.
 * 5. Give that URL to Claude (or paste it into
 *    frontend-v2/src/lib/founderIntelligence.ts as FOUNDER_INTELLIGENCE_URL).
 *
 * Behavior:
 * - First event creates two sheets in the *active spreadsheet bound to this
 *   script* (Extensions → Apps Script from within a blank Google Sheet, OR
 *   any spreadsheet — bind this script to one via the Sheets UI first):
 *     - "Events"    — one row per event (raw log)
 *     - "Dashboard" — formulas summarizing Events, recalculated live
 * - No PII, no shopping list contents, no bill contents are ever expected
 *   in the payload — this script does not enforce that; the frontend is
 *   responsible for only sending product-interaction events.
 */

const EVENTS_SHEET_NAME = "Events";
const DASHBOARD_SHEET_NAME = "Dashboard";

function doPost(e) {
  try {
    const params = e.parameter || {};
    const sheet = getOrCreateEventsSheet();

    sheet.appendRow([
      params.timestamp || new Date().toISOString(),
      params.sessionId || "",
      params.householdId || "",
      params.eventName || "",
      params.screen || "",
      params.details || "",
    ]);

    ensureDashboard();

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateEventsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(EVENTS_SHEET_NAME);
    sheet.appendRow(["Timestamp", "Session ID", "Household ID", "Event Name", "Screen", "Details"]);
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
    ["Onboarding started", '=COUNTIF(Events!D2:D,"Started Onboarding")'],
    ["Onboarding completed", '=COUNTIF(Events!D2:D,"Completed Onboarding")'],
    ["Skipped grocery budget", '=COUNTIF(Events!D2:D,"Skipped Grocery Budget")'],
    ['Chose "figure it out"', '=COUNTIF(Events!D2:D,"Selected Figure It Out")'],
    ["Viewed Household HQ", '=COUNTIF(Events!D2:D,"Viewed Household HQ")'],
    ["Opened Shopping Planner", '=COUNTIF(Events!D2:D,"Opened Shopping Planner")'],
    ["Shopping list created", '=COUNTIF(Events!D2:D,"Created Shopping List")'],
    ["Shopping event added", '=COUNTIF(Events!D2:D,"Added Shopping Event")'],
    ["Teaching: manual entry", '=COUNTIF(Events!D2:D,"Selected Teaching Method Manual")'],
    ["Teaching: shopping list", '=COUNTIF(Events!D2:D,"Selected Teaching Method Shopping List")'],
    ["Teaching: bill upload", '=COUNTIF(Events!D2:D,"Selected Teaching Method Bill Upload")'],
    ["Bill upload attempted", '=COUNTIF(Events!D2:D,"Attempted Bill Upload")'],
    ["Bill upload succeeded", '=COUNTIF(Events!D2:D,"Bill Upload Success")'],
    ["Bill upload failed", '=COUNTIF(Events!D2:D,"Bill Upload Failed")'],
    ["Viewed Beta page", '=COUNTIF(Events!D2:D,"Viewed Beta Page")'],
    ["Feedback opened", '=COUNTIF(Events!D2:D,"Opened Feedback")'],
    ["Feedback submitted", '=COUNTIF(Events!D2:D,"Submitted Feedback")'],
    ["Returned next day", '=COUNTIF(Events!D2:D,"Returned Next Day")'],
    ["Returned after 7 days", '=COUNTIF(Events!D2:D,"Returned After 7 Days")'],
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
  return ContentService.createTextOutput("Founder Intelligence endpoint is live.");
}
