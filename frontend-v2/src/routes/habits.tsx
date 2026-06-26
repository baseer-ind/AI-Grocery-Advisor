import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Store as StoreIcon, Tag, Repeat } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getHouseholdProfile } from "@/lib/real-data";
import { getShoppingEvents, type ShoppingEventSummary } from "@/lib/api";
import { buildShoppingHabits } from "@/lib/shopping-habits";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "Shopping Habits — Household Advisor AI" }] }),
  component: ShoppingHabitsPage,
});

function ShoppingHabitsPage() {
  const profile = getHouseholdProfile();
  const [events, setEvents] = useState<ShoppingEventSummary[] | null>(null);
  const [loading, setLoading] = useState(!!profile);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    getShoppingEvents(profile.householdId)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) {
    return (
      <AppShell title="Shopping Habits" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Nothing to summarize yet
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Build your household profile to see your shopping habits.
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
      <AppShell title="Shopping Habits" eyebrow="Household Advisor">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-surface-2" />
          <div className="h-20 rounded-2xl bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  const habits = buildShoppingHabits(profile, events);

  return (
    <AppShell title="Shopping Habits" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h1 className="text-lg font-semibold tracking-tight">How your household shops</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A summary of your shopping cadence, stores, and preferences — sourced from your real
            history once it exists, your stated answers until then.
          </p>
        </div>

        {/* Cadence */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Repeat className="h-3.5 w-3.5" /> Shopping cadence
          </div>
          {habits.cadence.value ? (
            <p className="mt-2 text-sm font-medium">{habits.cadence.value}</p>
          ) : (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{habits.cadence.unlockedBy}</span>
            </div>
          )}
        </section>

        {/* Stores */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <StoreIcon className="h-3.5 w-3.5" /> Stores
          </div>
          {habits.stores.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {habits.stores.map((s) => (
                <li key={s.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  {s.source === "history" ? (
                    <span className="text-xs text-muted-foreground">
                      {s.count} visit{s.count === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">stated at onboarding</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Log a shopping event or pick stores in your profile to see this.</span>
            </div>
          )}
        </section>

        {/* Purchase preferences */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Purchase preferences
          </div>
          {habits.preferences.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {habits.preferences.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Tell us what matters to you during onboarding to see this.</span>
            </div>
          )}
        </section>

        {/* Brand preferences — honestly not tracked yet */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Brand preferences
          </div>
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              We don't track brand-level preferences yet — this will unlock once we can match
              products to brands from your shopping history.
            </span>
          </div>
        </section>

        {/* Shopping style */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Shopping style
          </div>
          {habits.shoppingStyle && habits.planningStyle ? (
            <p className="mt-2 text-sm font-medium">
              {habits.shoppingStyle} · {habits.planningStyle}
            </p>
          ) : (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Complete your household profile to see this.</span>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
