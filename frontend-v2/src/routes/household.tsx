import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles, Upload as UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveHouseholdProfile } from "@/lib/real-data";

export const Route = createFileRoute("/household")({
  head: () => ({ meta: [{ title: "Build Your Household Profile — Household Advisor AI" }] }),
  component: HouseholdOnboardingPage,
});

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

const STORE_OPTIONS = ["D-Mart", "Reliance Fresh", "BigBasket", "Blinkit", "Zepto", "Local Kirana"];
const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
];
const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "save_money", label: "Save money" },
  { value: "bulk_buyer", label: "Buy in bulk" },
  { value: "offer_seeker", label: "Chase deals & offers" },
  { value: "premium_brands", label: "Prefer premium brands" },
  { value: "quality", label: "Prioritize quality" },
  { value: "health_focused", label: "Health-focused" },
  { value: "convenience_first", label: "Convenience first" },
];

const _QUICK_COMMERCE = new Set(["blinkit", "zepto"]);
const _VALUE_STORES = new Set(["d-mart", "local kirana", "reliance fresh"]);

type Answers = {
  size: number | null;
  adults: number;
  children: number;
  seniors: number;
  city: string;
  budget: number | null;
  stores: string[];
  frequency: string | null;
  priorities: string[];
};

const initialAnswers: Answers = {
  size: null,
  adults: 1,
  children: 0,
  seniors: 0,
  city: "",
  budget: null,
  stores: [],
  frequency: null,
  priorities: [],
};

// `confidence` here is a profile-completeness score on a 0–90 scale (not 0–1,
// not 0–100) — it caps below 100 because onboarding answers alone can never
// fully describe a household; real shopping history closes the remaining gap.
// Anywhere this value is displayed or combined with other 0–100 scores,
// treat it as already a whole-number percentage — never multiply by 100.
const MAX_PROFILE_CONFIDENCE = 90;

function deriveProfile(answers: Answers) {
  let householdType = "Unknown Household";
  let shoppingStyle = "Not Enough Data";
  let planningStyle = "Not Enough Data";
  const pantryReadiness = "Not Tracked Yet";
  let confidence = 0;

  if (answers.size != null) {
    confidence += 20;
    if (answers.size === 1) householdType = "Single Household";
    else if (answers.size === 2 && answers.children === 0) householdType = "Couple Household";
    else householdType = "Family Household";
  }

  if (answers.budget != null && answers.size) {
    confidence += 15;
  }

  if (answers.stores.length > 0) {
    confidence += 20;
    const lower = answers.stores.map((s) => s.toLowerCase());
    const allQuick = lower.every((s) => _QUICK_COMMERCE.has(s));
    const anyValue = lower.some((s) => _VALUE_STORES.has(s));
    if (allQuick) {
      shoppingStyle = "Convenience Shopper";
    } else if (anyValue) {
      shoppingStyle = "Value Shopper";
    } else {
      shoppingStyle = "Mixed Shopper";
    }
  }

  if (answers.frequency) {
    confidence += 15;
    if (answers.frequency === "weekly" || answers.frequency === "biweekly") {
      planningStyle = "Structured Planner";
    } else if (answers.frequency === "monthly") {
      planningStyle = "Bulk Planner";
    } else {
      planningStyle = "Reactive Shopper";
    }
  }

  if (answers.priorities.length > 0) {
    confidence += 30;
  }

  confidence = Math.min(confidence, MAX_PROFILE_CONFIDENCE);

  return { householdType, shoppingStyle, planningStyle, pantryReadiness, confidence };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function InsightStrip({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="mt-3 text-sm text-muted-foreground flex items-start gap-2">
      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
      <span>{text}</span>
    </p>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium text-left transition-colors",
        selected ? "bg-foreground text-background" : "bg-surface-2 hover:opacity-80",
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  busy,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity",
        disabled || busy
          ? "bg-surface-2 text-muted-foreground cursor-not-allowed"
          : "bg-foreground text-background hover:opacity-90",
      )}
    >
      {busy ? "Saving…" : children}
      {!busy && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

type StepKey = "intro" | "profile" | "behavior" | "style" | "snapshot";

function HouseholdOnboardingPage() {
  const [step, setStep] = useState<StepKey>("intro");
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const started = step !== "intro";

  async function submitProfile() {
    if (answers.size == null || !answers.city.trim()) return;
    if (!API_BASE) {
      setError("Backend URL is not configured (VITE_API_URL is missing from this build).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/household`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: answers.size,
          adults: answers.adults,
          children: answers.children,
          seniors: answers.seniors,
          city: answers.city.trim(),
          monthly_grocery_budget: answers.budget,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHouseholdId(data.household_id);
      setInsight(data.insight);
      setStep("behavior");
    } catch (err) {
      console.error("submitProfile failed", err);
      setError(
        `We couldn't save that step (${err instanceof Error ? err.message : "unknown error"}).`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitBehavior() {
    if (!API_BASE || !householdId || answers.stores.length === 0 || !answers.frequency) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/household/${householdId}/shopping-behavior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: answers.stores, frequency: answers.frequency }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInsight(data.insight);
      setStep("style");
    } catch (err) {
      console.error("submitBehavior failed", err);
      setError(
        `We couldn't save that step (${err instanceof Error ? err.message : "unknown error"}).`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitStyle() {
    if (!API_BASE || !householdId || answers.priorities.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/household/${householdId}/shopping-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorities: answers.priorities }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInsight(data.insight);
      setStep("snapshot");
      if (householdId) {
        const snapshot = deriveProfile(answers);
        saveHouseholdProfile({
          householdId,
          city: answers.city,
          size: answers.size ?? 0,
          householdType: snapshot.householdType,
          shoppingStyle: snapshot.shoppingStyle,
          planningStyle: snapshot.planningStyle,
          pantryReadiness: snapshot.pantryReadiness,
          confidence: snapshot.confidence,
          stores: answers.stores,
          frequency: answers.frequency,
          budget: answers.budget,
          priorities: answers.priorities,
        });
      }
    } catch (err) {
      console.error("submitStyle failed", err);
      setError(
        `We couldn't save that step (${err instanceof Error ? err.message : "unknown error"}).`,
      );
    } finally {
      setBusy(false);
    }
  }

  const profile = deriveProfile(answers);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/today"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          {started && step !== "snapshot" && <StepDots step={step} />}
        </div>

        <div>
          {step === "intro" && (
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-semibold tracking-tight">
                Let's get to know your household
              </h1>
              <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto sm:mx-0">
                A few quick questions. Nothing to set up, nothing to track — just tell us about your
                household and we'll take it from there.
              </p>
              <div className="mt-7 flex justify-center sm:justify-start">
                <PrimaryButton onClick={() => setStep("profile")}>Start</PrimaryButton>
              </div>
            </div>
          )}

          {step === "profile" && (
            <StepCard title="Tell us about your household">
              <div>
                <Label>Household size</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <OptionButton
                      key={n}
                      selected={answers.size === n}
                      onClick={() =>
                        setAnswers((a) => ({
                          ...a,
                          size: n,
                          adults: Math.min(a.adults, n) || 1,
                        }))
                      }
                    >
                      {n}
                      {n === 5 ? "+" : ""}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {answers.size != null && (
                <div className="grid grid-cols-3 gap-3">
                  <Counter
                    label="Adults"
                    value={answers.adults}
                    onChange={(v) => setAnswers((a) => ({ ...a, adults: v }))}
                  />
                  <Counter
                    label="Children"
                    value={answers.children}
                    onChange={(v) => setAnswers((a) => ({ ...a, children: v }))}
                  />
                  <Counter
                    label="Seniors"
                    value={answers.seniors}
                    onChange={(v) => setAnswers((a) => ({ ...a, seniors: v }))}
                  />
                </div>
              )}

              {answers.size != null && (
                <div>
                  <Label>City</Label>
                  <input
                    value={answers.city}
                    onChange={(e) => setAnswers((a) => ({ ...a, city: e.target.value }))}
                    placeholder="e.g. Mumbai"
                    className="mt-2 w-full rounded-2xl bg-surface-2 px-4 py-3 text-sm"
                  />
                </div>
              )}

              {answers.size != null && answers.city.trim() && (
                <div>
                  <Label>Monthly grocery budget (optional)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={answers.budget ?? ""}
                      onChange={(e) =>
                        setAnswers((a) => ({
                          ...a,
                          budget: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="12000"
                      className="w-full rounded-2xl bg-surface-2 pl-8 pr-4 py-3 text-sm"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="pt-2">
                <PrimaryButton
                  onClick={submitProfile}
                  busy={busy}
                  disabled={answers.size == null || !answers.city.trim()}
                >
                  Continue
                </PrimaryButton>
              </div>
            </StepCard>
          )}

          {step === "behavior" && (
            <StepCard title="Where and how often do you shop?">
              <InsightStrip text={insight} />
              <div>
                <Label>Where do you usually shop? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {STORE_OPTIONS.map((store) => {
                    const selected = answers.stores.includes(store);
                    return (
                      <OptionButton
                        key={store}
                        selected={selected}
                        onClick={() =>
                          setAnswers((a) => ({
                            ...a,
                            stores: selected
                              ? a.stores.filter((s) => s !== store)
                              : [...a.stores, store],
                          }))
                        }
                      >
                        {store}
                      </OptionButton>
                    );
                  })}
                </div>
              </div>

              {answers.stores.length > 0 && (
                <div>
                  <Label>How often do you shop?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {FREQUENCY_OPTIONS.map((f) => (
                      <OptionButton
                        key={f.value}
                        selected={answers.frequency === f.value}
                        onClick={() => setAnswers((a) => ({ ...a, frequency: f.value }))}
                      >
                        {f.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="pt-2">
                <PrimaryButton
                  onClick={submitBehavior}
                  busy={busy}
                  disabled={answers.stores.length === 0 || !answers.frequency}
                >
                  Continue
                </PrimaryButton>
              </div>
            </StepCard>
          )}

          {step === "style" && (
            <StepCard title="What matters most when you shop?">
              <InsightStrip text={insight} />
              <div>
                <Label>Pick what fits (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PRIORITY_OPTIONS.map((p) => {
                    const selected = answers.priorities.includes(p.value);
                    return (
                      <OptionButton
                        key={p.value}
                        selected={selected}
                        onClick={() =>
                          setAnswers((a) => ({
                            ...a,
                            priorities: selected
                              ? a.priorities.filter((x) => x !== p.value)
                              : [...a.priorities, p.value],
                          }))
                        }
                      >
                        {p.label}
                      </OptionButton>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="pt-2">
                <PrimaryButton
                  onClick={submitStyle}
                  busy={busy}
                  disabled={answers.priorities.length === 0}
                >
                  Finish
                </PrimaryButton>
              </div>
            </StepCard>
          )}

          {step === "snapshot" && <SnapshotCard profile={profile} insight={insight} />}
        </div>
      </div>
    </div>
  );
}

function StepDots({ step }: { step: StepKey }) {
  const order: StepKey[] = ["profile", "behavior", "style"];
  const idx = order.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {order.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i <= idx ? "w-6 bg-foreground" : "w-3 bg-surface-2",
          )}
        />
      ))}
    </div>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-foreground">{children}</div>;
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3.5">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-7 w-7 rounded-full bg-surface flex items-center justify-center hover:opacity-80"
        >
          −
        </button>
        <span className="font-semibold">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="h-7 w-7 rounded-full bg-surface flex items-center justify-center hover:opacity-80"
        >
          +
        </button>
      </div>
    </div>
  );
}

function SnapshotCard({
  profile,
  insight,
}: {
  profile: ReturnType<typeof deriveProfile>;
  insight: string | null;
}) {
  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="h-5 w-5 text-accent" />
        <span className="font-semibold">Household Snapshot</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Here's what we understand about your household so far — it'll keep getting sharper as you
        add more.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Shopping Style" value={profile.shoppingStyle} />
        <Field label="Planning Style" value={profile.planningStyle} />
        <Field label="Primary Opportunity" value={primaryOpportunity(profile)} />
        <Field label="Confidence" value={`${profile.confidence}%`} />
      </div>

      <InsightStrip text={insight} />

      <div className="mt-7 space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Continue building your profile
        </div>
        <Link
          to="/upload"
          className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5 hover:opacity-80"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <UploadIcon className="h-4 w-4" /> Add a Bill
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/this-week"
          className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5 hover:opacity-80"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <ListChecks className="h-4 w-4" /> Create a Shopping List
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/today"
          className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5 hover:opacity-80"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Go to Home
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

function primaryOpportunity(profile: ReturnType<typeof deriveProfile>) {
  if (profile.shoppingStyle === "Convenience Shopper") return "Store Optimization";
  if (profile.planningStyle === "Reactive Shopper") return "Planning Routine";
  if (profile.shoppingStyle === "Value Shopper") return "Deal Timing";
  return "Not Enough Data";
}
