import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  getFrequentProducts,
  getFrequentProductsSavedAt,
  getHouseholdProfile,
  getTaughtFacts,
  getUnlockTimestamps,
} from "@/lib/real-data";
import {
  getPredictedPantry,
  getShoppingEvents,
  type PredictedPantry,
  type ShoppingEventSummary,
} from "@/lib/api";
import { computePlanningScore } from "@/lib/household-intelligence";
import { buildHouseholdKnowledge } from "@/lib/household-knowledge";
import { computeHouseholdIdentity, confidenceNarrative } from "@/lib/household-identity";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Your Household — Household Advisor AI" }] }),
  component: YourHouseholdPage,
});

function YourHouseholdPage() {
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
      <AppShell title="Your Household" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto text-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            We haven't started learning about your household yet.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Build your household profile and we'll start recognising your shopping rhythm from
            there.
          </p>
          <div className="mt-6">
            <Link
              to="/household"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90"
            >
              Build my household profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const planning = computePlanningScore(events);
  const frequentProducts = getFrequentProducts();
  const identity = computeHouseholdIdentity(events, frequentProducts);
  const narrative = confidenceNarrative(events?.length ?? 0);
  const knowledge = buildHouseholdKnowledge(
    profile,
    events,
    frequentProducts,
    getFrequentProductsSavedAt(),
    getTaughtFacts(),
    pantry,
    planning,
    getUnlockTimestamps(),
  );

  return (
    <AppShell title="Your Household" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Your Household</h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {identity
              ? `We've learned that your household is a ${identity.label.toLowerCase()}${
                  profile.stores?.[0] ? `, and you prefer ${profile.stores[0]}` : ""
                }.`
              : "We've started understanding how your household shops."}{" "}
            {narrative} Every shopping event, and every correction, helps us make better
            recommendations.
          </p>
        </div>

        <KnownSection items={knowledge.known} />
        <LearningSection items={knowledge.learning} />
        <DiscoveriesSection entries={knowledge.recentlyLearned} />
        <AvailableSection unlocks={knowledge.unlocks} />

        <div className="flex items-center justify-center gap-6 pt-2">
          <Link
            to="/teach"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Teach Household Advisor →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function KnownSection({
  items,
}: {
  items: { id: string; label: string; value: string; evidence: string }[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-3">What we've learned</h2>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="w-full text-left py-2.5 flex items-start gap-2.5"
              >
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                <span className="text-base">
                  <span className="font-medium">{item.label}</span>{" "}
                  <span className="text-muted-foreground">{item.value}</span>
                </span>
              </button>
              {expanded === item.id && (
                <p className="ml-[1.625rem] text-sm text-muted-foreground pb-2">
                  Why? {item.evidence}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">Nothing confirmed yet.</p>
      )}
    </section>
  );
}

function LearningSection({
  items,
}: {
  items: { id: string; label: string; unlockedBy: string }[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-3">We're still learning</h2>
      {items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="text-base">
              <span className="font-medium">{item.label}.</span>{" "}
              <span className="text-muted-foreground">{item.unlockedBy}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">We've learned everything we can for now.</p>
      )}
    </section>
  );
}

function DiscoveriesSection({ entries }: { entries: { id: string; date: Date; label: string }[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-3">Recent discoveries</h2>
      {entries.length > 0 ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3 text-base">
              <span className="shrink-0 w-20 text-sm text-muted-foreground">
                {entry.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
              <span>{entry.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">
          Nothing yet — your first discoveries will show up here.
        </p>
      )}
    </section>
  );
}

function AvailableSection({
  unlocks,
}: {
  unlocks: {
    id: string;
    label: string;
    status: "unlocked" | "learning" | "locked";
    reason: string;
    to: string;
  }[];
}) {
  const sorted = [...unlocks].sort((a, b) => {
    const order = { unlocked: 0, learning: 1, locked: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-3">What's now available</h2>
      <ul className="space-y-2.5">
        {sorted.map((u) => (
          <li key={u.id} className="text-base">
            {u.status === "unlocked" ? (
              <Link to={u.to} className="flex items-baseline gap-2.5 hover:opacity-70">
                <Check className="h-4 w-4 shrink-0 text-accent translate-y-1" />
                <span className="font-medium">{u.label}</span>
              </Link>
            ) : (
              <div className="flex items-baseline gap-2.5 text-muted-foreground">
                <span className="h-4 w-4 shrink-0 inline-block rounded-full border border-current translate-y-1" />
                <span>
                  <span className="font-medium text-foreground">{u.label}</span> — {u.reason}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
