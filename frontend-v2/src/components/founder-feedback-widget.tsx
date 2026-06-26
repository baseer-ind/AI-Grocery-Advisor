import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import { submitFounderFeedback } from "@/lib/feedbackService";

export function FounderFeedbackWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [tryingTo, setTryingTo] = useState("");
  const [confusing, setConfusing] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setOpen(false);
    setDone(false);
    setTryingTo("");
    setConfusing("");
  };

  const submit = async () => {
    if (!tryingTo.trim() && !confusing.trim()) return;
    setSubmitting(true);
    await submitFounderFeedback({
      timestamp: new Date().toISOString(),
      page: pathname,
      tryingTo: tryingTo.trim(),
      confusing: confusing.trim(),
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-3 lg:bottom-4 z-30 flex items-center gap-1.5 rounded-full bg-surface/90 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground shadow-sm"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Tell Baseer what confused you
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 p-4">
          <div className="w-full sm:max-w-sm rounded-3xl bg-surface p-6 space-y-4">
            {done ? (
              <div className="text-center py-4">
                <p className="text-base font-medium">Thank you — that helps a lot.</p>
                <button
                  onClick={reset}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Help us make Household Advisor better.
                  </h2>
                  <button onClick={reset} aria-label="Close" className="text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">What were you trying to do?</label>
                    <textarea
                      value={tryingTo}
                      onChange={(e) => setTryingTo(e.target.value)}
                      rows={2}
                      className="mt-1.5 w-full rounded-2xl bg-surface-2 p-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">What confused you?</label>
                    <textarea
                      value={confusing}
                      onChange={(e) => setConfusing(e.target.value)}
                      rows={2}
                      className="mt-1.5 w-full rounded-2xl bg-surface-2 p-3 text-sm outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={submit}
                  disabled={submitting || (!tryingTo.trim() && !confusing.trim())}
                  className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold disabled:opacity-40"
                >
                  {submitting ? "Sending…" : "Submit"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
