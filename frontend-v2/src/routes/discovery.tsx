import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discovery")({
  head: () => ({ meta: [{ title: "Household Discovery — Household Advisor AI" }] }),
  component: Discovery,
});

const priorities = [
  "Save Money",
  "Get Best Value",
  "Buy Better Quality Products",
  "Improve Family Health",
  "Reduce Grocery Waste",
  "Save Time",
  "Compare Stores",
  "Track Household Consumption",
];

const householdTypes = ["Single Person", "Couple", "Family of 3–4", "Family of 5–6", "Family of 7+"];
const budgets = ["Under ₹5,000", "₹5,000–10,000", "₹10,000–15,000", "₹15,000–25,000", "₹25,000+"];
const shopStyles = ["Mostly Online", "Mostly Local Stores", "Mix Of Both"];
const matters = ["Price", "Quality", "Reviews", "Availability", "Delivery Speed", "Offers"];
const flex = ["Never Switch", "Switch If Similar", "Very Flexible"];
const memberships = [
  "Amazon Prime",
  "Swiggy One",
  "Zepto Pass",
  "BigBasket Membership",
  "Credit Card Offers",
  "Debit Card Offers",
  "UPI Cashback",
  "No Memberships",
];
const frustrations = [
  "Prices Keep Changing",
  "I Overspend",
  "Too Many Apps",
  "I Forget What I Need",
  "I Don't Know Where To Buy",
  "I Don't Know If I Got A Good Deal",
  "I Buy Things I Already Have",
  "I Waste Food",
];

type Step = {
  key: string;
  title: string;
  sub: string;
  type: "rank" | "single" | "multi";
  max?: number;
  options: string[];
};

const steps: Step[] = [
  { key: "why", title: "Why are you here?", sub: "Pick up to 3 — order matters.", type: "rank", max: 3, options: priorities },
  { key: "type", title: "Household type", sub: "So we tune portion sizes and frequency.", type: "single", options: householdTypes },
  { key: "budget", title: "Monthly grocery budget", sub: "We use this as a soft guardrail, not a limit.", type: "single", options: budgets },
  { key: "shop", title: "How do you usually shop?", sub: "Online, local, or both.", type: "single", options: shopStyles },
  { key: "matters", title: "What matters most?", sub: "Rank what your household values when buying.", type: "rank", max: 4, options: matters },
  { key: "flex", title: "Brand flexibility", sub: "How comfortable are you switching brands?", type: "single", options: flex },
  { key: "membership", title: "Memberships & benefits", sub: "We factor these into effective prices.", type: "multi", options: memberships },
  { key: "pain", title: "Biggest frustration", sub: "Pick up to 2.", type: "multi", max: 2, options: frustrations },
];

function Discovery() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const step = steps[stepIdx];
  const value = answers[step.key] ?? [];
  const done = stepIdx >= steps.length;

  const select = (opt: string) => {
    setAnswers((s) => {
      const cur = s[step.key] ?? [];
      if (step.type === "single") return { ...s, [step.key]: [opt] };
      if (cur.includes(opt)) return { ...s, [step.key]: cur.filter((x) => x !== opt) };
      if (step.max && cur.length >= step.max) return s;
      return { ...s, [step.key]: [...cur, opt] };
    });
  };

  const canContinue = value.length > 0;

  return (
    <AppShell title="Household Discovery" eyebrow={`Step ${Math.min(stepIdx + 1, steps.length)} of ${steps.length}`}>
      {/* Progress */}
      <div className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-1.5 mb-5">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < stepIdx ? "bg-accent" : i === stepIdx ? "bg-foreground" : "bg-surface-2",
            )}
          />
        ))}
      </div>

      {!done ? (
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6 lg:p-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {step.type === "rank"
                ? `Rank · up to ${step.max}`
                : step.type === "multi"
                ? step.max
                  ? `Select up to ${step.max}`
                  : "Select any"
                : "Single choice"}
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.sub}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.options.map((opt) => {
                const rank = value.indexOf(opt);
                const selected = rank !== -1;
                return (
                  <button
                    key={opt}
                    onClick={() => select(opt)}
                    className={cn(
                      "text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-all",
                      selected
                        ? "border-foreground bg-background"
                        : "border-border bg-background hover:border-foreground/30",
                    )}
                  >
                    <span className="text-sm font-medium">{opt}</span>
                    {selected && (
                      <span
                        className={cn(
                          "h-6 min-w-6 px-2 inline-flex items-center justify-center rounded-md font-mono text-[11px] font-semibold",
                          step.type === "rank"
                            ? "bg-foreground text-background"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {step.type === "rank" ? rank + 1 : <Check className="h-3 w-3" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                disabled={stepIdx === 0}
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                disabled={!canContinue}
                onClick={() => setStepIdx((i) => i + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {stepIdx === steps.length - 1 ? "Finish" : "Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6 h-fit sticky top-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Why we ask
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your answers tune every recommendation — from brand swaps to store splits — to your household's
              actual priorities, not generic averages.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
                  AI advisor
                </span>
              </div>
              <p className="text-sm">
                Two households with the same bill can get completely different advice. Quality, time, and
                flexibility matter as much as price.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 lg:p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
            <Check className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl lg:text-3xl font-semibold tracking-tight">
            Your household profile is tuned.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            We'll use these priorities for every recommendation — buy now vs. wait, brand swaps, store splits, and
            weekly lists.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/command"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Open Command Center <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              Upload a bill
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
