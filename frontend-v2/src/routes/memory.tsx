import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getHouseholdProfile } from "@/lib/real-data";
import { getShoppingEvents, type ShoppingEventSummary } from "@/lib/api";
import { buildHouseholdMemory } from "@/lib/household-memory";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "Household Memory — Household Advisor AI" }] }),
  component: HouseholdMemoryPage,
});

function HouseholdMemoryPage() {
  const profile = getHouseholdProfile();
  const [events, setEvents] = useState<ShoppingEventSummary[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    getShoppingEvents(profile.householdId).then(setEvents);
  }, [profile]);

  if (!profile) {
    return (
      <AppShell title="Household Memory" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Nothing remembered yet
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Build your household profile to start building memory.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Household Memory only shows things we actually know about your household — never a
            guess.
          </p>
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

  const observations = buildHouseholdMemory(profile, events);

  return (
    <AppShell title="Household Memory" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <BrainCircuit className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              What we know about your household
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every observation below comes from your real onboarding answers or your actual
              shopping history — nothing here is invented.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {observations.map((obs) => (
            <div
              key={obs.id}
              className="rounded-xl border border-border bg-surface p-4 flex items-start justify-between gap-4"
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {obs.label}
                </div>
                {obs.value != null ? (
                  <div className="mt-1 text-base font-semibold tracking-tight">{obs.value}</div>
                ) : (
                  <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{obs.unlockedBy}</span>
                  </div>
                )}
              </div>
              {obs.source && (
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-1">
                  {obs.source === "history" ? "From your purchases" : "From onboarding"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
