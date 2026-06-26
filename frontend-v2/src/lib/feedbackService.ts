/**
 * feedbackService.ts
 *
 * Reusable utility for posting form payloads to a Google Apps Script
 * Web App endpoint (which writes rows to a Google Sheet).
 *
 * Uses the production Household Advisor feedback endpoint directly.
 */

export interface FeedbackPayload {
  timestamp: string;
  overallRating: string;
  wouldUse: string;
  valuableFeatures: string[];
  usageTiming: string[];
  biggestProblem: string;
  excitingFeature: string;
  confusingFeature: string;
  missingFeature: string;
  trustLevel: string;
  paymentInterest: string;
  referralInterest: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  householdSize: string;
  comments: string;
}

export interface SubmitResult {
  ok: boolean;
  status?: number;
  message?: string;
  data?: unknown;
}

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyGzvbwcKwI0OR0OEA8csHLxt-UL_09mV-Uhm95PYNXQRLRvB_GvvWAQUnELwPJxY1DEg/exec";

/**
 * Generic helper — POSTs a JSON payload to any Google Apps Script Web App URL.
 * Uses `no-cors` because Apps Script Web Apps often accept the POST but block
 * the browser from reading the response. The script reads `e.postData.contents` as JSON.
 */
/**
 * Flatten payload into form-encoded fields. Arrays are JSON-stringified so
 * they round-trip as a single column in the sheet.
 */
function toFormBody(payload: Record<string, unknown>): URLSearchParams {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      form.append(key, "");
    } else if (Array.isArray(value)) {
      form.append(key, value.join(", "));
    } else if (typeof value === "object") {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  }
  // Also include the raw JSON payload so scripts using e.postData.contents still work.
  form.append("payload", JSON.stringify(payload));
  return form;
}

export async function postToGoogleSheets<T extends Record<string, unknown>>(
  url: string,
  payload: T,
): Promise<SubmitResult> {
  try {
    console.log("[feedbackService] Request:", url, payload);

    const body = toFormBody(payload);

    // application/x-www-form-urlencoded is a CORS-safe content type (no preflight)
    // AND Apps Script auto-populates e.parameter / e.parameters from it.
    const res = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      body,
      redirect: "follow",
    });

    if (res.type === "opaque") {
      const data = {
        type: res.type,
        message:
          "Google Apps Script accepted the request; browser response is opaque due to no-cors mode.",
      };
      console.log("[feedbackService] Response received:", data);
      return { ok: true, status: 0, message: "Submitted", data };
    }

    let data: unknown = null;
    try {
      data = await res.clone().json();
    } catch {
      data = await res.text();
    }

    console.log("[feedbackService] Response received:", res.status, data);

    if (!res.ok) {
      return { ok: false, status: res.status, message: `Request failed (${res.status})`, data };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("[feedbackService] Submission failed", message);
    return { ok: false, message };
  }
}

export interface FounderFeedbackPayload {
  timestamp: string;
  page: string;
  tryingTo: string;
  confusing: string;
}

export async function submitFounderFeedback(
  payload: FounderFeedbackPayload,
): Promise<SubmitResult> {
  return postToGoogleSheets(GOOGLE_APPS_SCRIPT_URL, {
    ...(payload as unknown as Record<string, unknown>),
    formType: "founder_feedback",
  });
}

export async function submitFeedback(payload: FeedbackPayload): Promise<SubmitResult> {
  console.log("[feedbackService] Form submitted", payload);

  const result = await postToGoogleSheets(
    GOOGLE_APPS_SCRIPT_URL,
    payload as unknown as Record<string, unknown>,
  );

  if (result.ok) {
    console.log("[feedbackService] Response received", result);
  } else {
    console.error("[feedbackService] Submission failed", result);
  }
  return result;
}
