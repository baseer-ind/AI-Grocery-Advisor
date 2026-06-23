import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";

const TRIGGER_PATHS = new Set(["/analysis"]);
const VISIT_KEY = "ha_visited_paths";
const DISMISS_KEY = "ha_feedback_cta_dismissed";
const SUBMIT_KEY = "ha_feedback_submitted";
const THRESHOLD = 3;

export function FeedbackCta() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/feedback" || pathname === "/") return;
    if (localStorage.getItem(DISMISS_KEY) || localStorage.getItem(SUBMIT_KEY)) return;

    let visited: string[] = [];
    try {
      visited = JSON.parse(localStorage.getItem(VISIT_KEY) ?? "[]");
    } catch {}
    if (!visited.includes(pathname)) {
      visited.push(pathname);
      localStorage.setItem(VISIT_KEY, JSON.stringify(visited));
    }

    if (visited.length >= THRESHOLD || TRIGGER_PATHS.has(pathname)) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-auto rounded-2xl border border-border bg-surface shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center">
          <Heart className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            From the founder
          </div>
          <div className="text-sm font-semibold tracking-tight mt-0.5">
            Help us build Household Advisor
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You've explored the product — your feedback will directly shape what we ship next.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              to="/feedback"
              onClick={() => setShow(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:opacity-90"
            >
              Share feedback
            </Link>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
