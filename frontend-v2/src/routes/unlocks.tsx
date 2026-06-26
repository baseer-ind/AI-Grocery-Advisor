import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Lock, Sparkles, Unlock as UnlockIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { getFrequentProducts, getHouseholdProfile } from "@/lib/real-data";
import {
  getPredictedPantry,
  getShoppingEvents,
  type PredictedPantry,
  type ShoppingEventSummary,
} from "@/lib/api";
import { computePlanningScore } from "@/lib/household-intelligence";
import { buildUnlocks, type Unlock } from "@/lib/household-unlocks";

export const Route = createFileRoute("/unlocks")({
  head: () => ({ meta: [{ title: "Unlocks — Household Advisor AI" }] }),
  component: UnlocksPage,
});

const cardStyles: Record<Unlock["status"], string> = {
  unlocked: "border-accent/30 bg-accent/5",
  learning: "border-warning/30 bg-warning/5",
  locked: "border-border bg-surface",
};

const statusLabel: Record<Unlock["status"], string> = {
  unlocked: "Unlocked",
  learning: "Learning…",
  locked: "Locked",
};

function StatusIcon({ status }: { status: Unlock["status"] }) {
  if (status === "unlocked") return <Check className="h-4 w-4 text-accent" />;
  if (status === "learning") return <Sparkles className="h-4 w-4 text-warning-foreground" />;
  return <Lock className="h-4 w-4 text-muted-foreground" />;
}

function UnlocksPage() {
  const profile = getHouseholdProfile();
  const [events, setEvents] = useState<ShoppingEventSummary[] | null>(null);
  const [pantry, setPantry] = useState<PredictedPantry | null>(null);
  const [loading, setLoading] = useState(!!profile);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      getShoppingEvents(profile.householdId).then(setEvents),
      getPredictedPantry(profile.householdId).then(setPantry),
    ]).finally(() => setLoading(false));
  }, [profile]);

  if (!profile) {
    return (
      <AppShell title="Unlocks" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Nothing unlocked yet
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Build your household profile to start unlocking capabilities.
          </h1>
          <div className="mt-6">
            <Link
              to="/household"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Build my household profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Unlocks" eyebrow="Household Advisor">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-surface-2" />
          <div className="h-20 rounded-2xl bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  const planning = computePlanningScore(events);
  const unlocks = buildUnlocks(events, pantry, planning, getFrequentProducts());
  const unlockedCount = unlocks.filter((u) => u.status === "unlocked").length;

  return (
    <AppShell title="Unlocks" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <UnlockIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {unlockedCount} of {unlocks.length} capabilities unlocked
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every capability turns on when there's enough real data behind it — never before. Add
              shopping events or teach us directly to unlock more.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {unlocks.map((u) => (
            <div key={u.id} className={cn("rounded-xl border p-4", cardStyles[u.status])}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <StatusIcon status={u.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight">{u.label}</h3>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {statusLabel[u.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{u.description}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{u.reason}</p>
                </div>
                {u.status === "unlocked" && (
                  <Link
                    to={u.to}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/knowledge"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Household Knowledge <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/teach"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Teach Household Advisor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
