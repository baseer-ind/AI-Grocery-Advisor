import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Clock, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import {
  getFrequentProducts,
  getFrequentProductsSavedAt,
  getHouseholdProfile,
  getTaughtFacts,
} from "@/lib/real-data";
import {
  getPredictedPantry,
  getShoppingEvents,
  type PredictedPantry,
  type ShoppingEventSummary,
} from "@/lib/api";
import { computePlanningScore } from "@/lib/household-intelligence";
import { buildHouseholdKnowledge } from "@/lib/household-knowledge";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Household Knowledge — Household Advisor AI" }] }),
  component: HouseholdKnowledgePage,
});

const statusStyles: Record<string, string> = {
  unlocked: "border-accent/30 bg-accent/5",
  learning: "border-warning/30 bg-warning/5",
  locked: "border-border bg-surface",
};

function HouseholdKnowledgePage() {
  const profile = getHouseholdProfile();
  const [events, setEvents] = useState<ShoppingEventSummary[] | null>(null);
  const [pantry, setPantry] = useState<PredictedPantry | null>(null);

  useEffect(() => {
    if (!profile) return;
    getShoppingEvents(profile.householdId).then(setEvents);
    getPredictedPantry(profile.householdId).then(setPantry);
  }, [profile]);

  if (!profile) {
    return (
      <AppShell title="Household Knowledge" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Nothing learned yet
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Build your household profile to start teaching us about your household.
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

  const planning = computePlanningScore(events);
  const knowledge = buildHouseholdKnowledge(
    profile,
    events,
    getFrequentProducts(),
    getFrequentProductsSavedAt(),
    getTaughtFacts(),
    pantry,
    planning,
  );

  return (
    <AppShell title="Household Knowledge" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <BookOpen className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              We're no longer just recording your shopping — we're learning about your household.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every line below comes from something real: your onboarding answers, your shopping
              history, or something you've told us directly. Nothing here is a guess.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            <Check className="h-3.5 w-3.5" /> What we know
          </div>
          {knowledge.known.length > 0 ? (
            <ul className="space-y-2.5">
              {knowledge.known.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                  <span>
                    <span className="text-muted-foreground">{f.label}:</span>{" "}
                    <span className="font-medium">{f.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing confirmed yet.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            <Lock className="h-3.5 w-3.5" /> Still learning
          </div>
          {knowledge.learning.length > 0 ? (
            <ul className="space-y-2.5">
              {knowledge.learning.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="shrink-0">○</span>
                  <span>
                    <span className="text-foreground font-medium">{f.label}.</span> {f.unlockedBy}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              We've learned everything we can for now.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            <Clock className="h-3.5 w-3.5" /> Recently learned
          </div>
          {knowledge.recentlyLearned.length > 0 ? (
            <ul className="space-y-2.5">
              {knowledge.recentlyLearned.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-20 font-mono text-xs text-muted-foreground pt-0.5">
                    {entry.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="font-medium">{entry.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing learned yet — your milestones will show up here.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Upcoming unlocks
            </div>
            <Link
              to="/unlocks"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              See all
            </Link>
          </div>
          <ul className="space-y-2">
            {[...knowledge.unlocks]
              .sort((a, b) => {
                const order = { locked: 0, learning: 1, unlocked: 2 };
                return order[a.status] - order[b.status];
              })
              .slice(0, 3)
              .map((u) => (
                <li
                  key={u.id}
                  className={cn(
                    "rounded-lg border px-3.5 py-2.5 flex items-start gap-3",
                    statusStyles[u.status],
                  )}
                >
                  {u.status === "unlocked" ? (
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  ) : u.status === "learning" ? (
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-warning-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      {u.label}
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {u.status === "unlocked"
                          ? "Unlocked"
                          : u.status === "learning"
                            ? "Learning…"
                            : "Locked"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.reason}</div>
                  </div>
                </li>
              ))}
          </ul>
        </section>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/teach"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Teach Household Advisor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/memory"
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Household Memory <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
