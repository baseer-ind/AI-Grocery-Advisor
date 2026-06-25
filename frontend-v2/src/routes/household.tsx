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

type Chip = { label: string; tone: "neutral" | "accent" | "warning" };

function deriveProfile(answers: Answers) {
  const chips: Chip[] = [];
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
    chips.push({ label: householdType, tone: "neutral" });
  }

  if (answers.budget != null && answers.size) {
    confidence += 15;
    const perPerson = answers.budget / answers.size;
    if (perPerson < 2500) {
      chips.push({ label: "Budget Conscious", tone: "accent" });
    } else if (perPerson > 6000) {
      chips.push({ label: "Spacious Budget", tone: "neutral" });
    }
  }

  if (answers.stores.length > 0) {
    confidence += 20;
    const lower = answers.stores.map((s) => s.toLowerCase());
    const allQuick = lower.every((s) => _QUICK_COMMERCE.has(s));
    const anyValue = lower.some((s) => _VALUE_STORES.has(s));
    if (allQuick) {
      shoppingStyle = "Convenience Shopper";
      chips.push({ label: "Convenience Shopper", tone: "neutral" });
    } else if (anyValue) {
      shoppingStyle = "Value Shopper";
      chips.push({ label: "Value Shopper", tone: "accent" });
    } else {
      shoppingStyle = "Mixed Shopper";
      chips.push({ label: "Mixed Shopper", tone: "neutral" });
    }
  }

  if (answers.frequency) {
    confidence += 15;
    if (answers.frequency === "weekly" || answers.frequency === "biweekly") {
      planningStyle = "Structured Planner";
    } else if (answers.frequency === "monthly") {
      planningStyle = "Bulk Planner";
      chips.push({ label: "Likely bulk purchaser", tone: "neutral" });
    } else {
      planningStyle = "Reactive Shopper";
      chips.push({ label: "Planning opportunity detected", tone: "warning" });
    }
  }

  if (answers.priorities.length > 0) {
    confidence += 30;
    const set = new Set(answers.priorities);
    if (set.has("save_money") || set.has("offer_seeker")) {
      chips.push({ label: "Value-conscious shopper", tone: "accent" });
    }
    if (set.has("premium_brands") || set.has("quality")) {
      chips.push({ label: "Quality-focused shopper", tone: "neutral" });
    }
    if (set.has("health_focused")) {
      chips.push({ label: "Health-focused shopper", tone: "neutral" });
    }
    if (set.has("convenience_first")) {
      chips.push({ label: "Convenience-first shopper", tone: "neutral" });
    }
  }

  confidence = Math.min(confidence, 90);

  return { householdType, shoppingStyle, planningStyle, pantryReadiness, confidence, chips };
}

function confidenceLabel(score: number) {
  if (score === 0) return "Unknown";
  if (score < 40) return "Low";
  if (score < 70) return "Moderate";
  return "Good";
}

const chipTone: Record<Chip["tone"], string> = {
  neutral: "bg-surface-2 text-foreground border border-border",
  accent: "bg-accent/15 text-accent-foreground border border-accent/30",
  warning: "bg-warning/15 text-warning-foreground border border-warning/30",
};

function ProfilePanel({ answers, started }: { answers: Answers; started: boolean }) {
  const profile = deriveProfile(answers);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
        Household Profile
      </div>

      {!started ? (
        <div className="text-sm text-muted-foreground">
          Answer a few questions and we'll build your profile live, right here.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-lg font-semibold tracking-tight">{profile.householdType}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{profile.shoppingStyle}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Planning Style" value={profile.planningStyle} />
            <Field label="Pantry Readiness" value={profile.pantryReadiness} />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono uppercase tracking-widest text-muted-foreground">
                Confidence
              </span>
              <span className="font-mono font-semibold">{confidenceLabel(profile.confidence)}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-500"
                style={{ width: `${profile.confidence}%` }}
              />
            </div>
          </div>

          {profile.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.chips.map((chip, i) => (
                <span
                  key={`${chip.label}-${i}`}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    chipTone[chip.tone],
                  )}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function InsightStrip({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
      <span className="text-foreground/90">{text}</span>
    </div>
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
        "rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface hover:bg-surface-2",
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
        "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity",
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/today"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          {started && step !== "snapshot" && <StepDots step={step} />}
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-7">
            {step === "intro" && (
              <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 text-center sm:text-left">
                <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-5 mx-auto sm:mx-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Let's get to know your household
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto sm:mx-0">
                  A few quick questions. Your profile builds itself as you answer — no forms, no
                  waiting.
                </p>
                <div className="mt-6 flex justify-center sm:justify-start">
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
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
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
                        className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-3 text-sm"
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

          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-10">
              <ProfilePanel answers={answers} started={started} />
            </div>
          </div>
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
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 space-y-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
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
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-surface-2"
        >
          −
        </button>
        <span className="font-mono font-semibold">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-surface-2"
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
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
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
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Continue building your profile
        </div>
        <Link
          to="/upload"
          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-surface-2"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <UploadIcon className="h-4 w-4" /> Upload a Bill
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/this-week"
          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-surface-2"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <ListChecks className="h-4 w-4" /> Create a Shopping List
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/today"
          className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-surface-2"
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
