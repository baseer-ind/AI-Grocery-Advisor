import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  PiggyBank,
  Store,
  Clock,
  ShoppingBasket,
  ScanLine,
  TrendingDown,
  ListChecks,
  Eye,
  PencilLine,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discovery")({
  head: () => ({ meta: [{ title: "Household Profile — Household Advisor AI" }] }),
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
  { key: "why", title: "What brings you here?", sub: "Tap up to 3, in the order they matter to you — we'll lead with the first one.", type: "rank", max: 3, options: priorities },
  { key: "type", title: "Who are you shopping for?", sub: "So we tune portion sizes and frequency.", type: "single", options: householdTypes },
  { key: "budget", title: "Roughly, what's your monthly grocery budget?", sub: "A range is fine — you can change this anytime.", type: "single", options: budgets },
  { key: "shop", title: "How do you usually shop?", sub: "Online, local, or a bit of both.", type: "single", options: shopStyles },
  { key: "matters", title: "What matters most when you buy?", sub: "Tap in the order you care about them — no dragging needed.", type: "rank", max: 4, options: matters },
  { key: "flex", title: "How open are you to switching brands?", sub: "If we find a cheaper match, should we suggest it?", type: "single", options: flex },
  { key: "membership", title: "Any memberships or cards we should know about?", sub: "We'll factor these into real prices, not list prices.", type: "multi", options: memberships },
  { key: "pain", title: "What frustrates you most about grocery shopping today?", sub: "Pick up to 2 — this shapes what we show you first.", type: "multi", max: 2, options: frustrations },
];

type Answers = Record<string, string[]>;

const budgetMidpoint: Record<string, number> = {
  "Under ₹5,000": 4000,
  "₹5,000–10,000": 7500,
  "₹10,000–15,000": 12500,
  "₹15,000–25,000": 20000,
  "₹25,000+": 30000,
};

function estimateMonthlySpend(answers: Answers): number {
  const budget = answers.budget?.[0];
  return budgetMidpoint[budget ?? ""] ?? 12500;
}

function estimateSavingsPct(answers: Answers): number {
  let pct = 8;
  if ((answers.pain ?? []).length) pct += (answers.pain?.length ?? 0) * 1.5;
  if (answers.why?.[0] === "Save Money") pct += 3;
  if (answers.flex?.[0] === "Very Flexible") pct += 2;
  return Math.min(pct, 18);
}

type Stage = "questions" | "building" | "profile" | "savings" | "capabilities" | "actions";

const stageOrder: Stage[] = ["questions", "building", "profile", "savings", "capabilities", "actions"];
const stageLabel: Record<Stage, string> = {
  questions: "Step 1 of 5 · Tell us about your household",
  building: "Step 2 of 5 · Building your profile",
  profile: "Step 2 of 5 · Your household profile",
  savings: "Step 3 of 5 · Potential savings",
  capabilities: "Step 4 of 5 · What we can do for you",
  actions: "Step 5 of 5 · Pick a starting point",
};

function Discovery() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [stage, setStage] = useState<Stage>("questions");
  const step = steps[stepIdx];
  const value = stage === "questions" ? answers[step.key] ?? [] : [];

  const select = (opt: string) => {
    setAnswers((s) => {
      const cur = s[step.key] ?? [];
      if (step.type === "single") return { ...s, [step.key]: [opt] };
      if (cur.includes(opt)) return { ...s, [step.key]: cur.filter((x) => x !== opt) };
      if (step.max && cur.length >= step.max) return s;
      return { ...s, [step.key]: [...cur, opt] };
    });
  };

  useEffect(() => {
    if (stage !== "building") return;
    const t = setTimeout(() => setStage("profile"), 1600);
    return () => clearTimeout(t);
  }, [stage]);

  const canContinue = value.length > 0;
  const overallStepNum = stageOrder.indexOf(stage) + 1;

  return (
    <AppShell title="Household Profile" eyebrow={stageLabel[stage]}>
      {/* Overall progress across all 5 steps */}
      <div className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-1.5 mb-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              n < overallStepNum ? "bg-accent" : n === overallStepNum ? "bg-foreground" : "bg-surface-2",
            )}
          />
        ))}
      </div>

      {stage === "questions" && (
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6 lg:p-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {step.type === "rank"
                ? `Tap in order · up to ${step.max}`
                : step.type === "multi"
                  ? step.max
                    ? `Select up to ${step.max}`
                    : "Select any"
                  : "Pick one"}
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
                      selected ? "border-foreground bg-background" : "border-border bg-background hover:border-foreground/30",
                    )}
                  >
                    <span className="text-sm font-medium">{opt}</span>
                    {selected && (
                      <span
                        className={cn(
                          "h-6 min-w-6 px-2 inline-flex items-center justify-center rounded-md font-mono text-[11px] font-semibold",
                          step.type === "rank" ? "bg-foreground text-background" : "bg-accent text-accent-foreground",
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
                onClick={() => {
                  if (stepIdx === steps.length - 1) setStage("building");
                  else setStepIdx((i) => i + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {stepIdx === steps.length - 1 ? "Build my profile" : "Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6 h-fit lg:sticky lg:top-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Why we ask</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your answers tune every recommendation — from brand swaps to store splits — to your household's
              actual priorities, not generic averages.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">AI advisor</span>
              </div>
              <p className="text-sm">
                Two households with the same bill can get completely different advice. Quality, time, and
                flexibility matter as much as price.
              </p>
            </div>
          </aside>
        </div>
      )}

      {stage === "building" && <BuildingScreen />}
      {stage === "profile" && <ProfileScreen answers={answers} onNext={() => setStage("savings")} />}
      {stage === "savings" && <SavingsScreen answers={answers} onNext={() => setStage("capabilities")} />}
      {stage === "capabilities" && <CapabilitiesScreen onNext={() => setStage("actions")} />}
      {stage === "actions" && <ActionsScreen />}
    </AppShell>
  );
}

function BuildingScreen() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 lg:p-16 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center animate-pulse">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl lg:text-2xl font-semibold tracking-tight">Building your household profile…</h2>
      <p className="mt-2 text-sm text-muted-foreground">Matching your answers against real pricing patterns.</p>
      <div className="mt-6 mx-auto max-w-xs h-1 w-full bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-foreground animate-[entrance_1.6s_linear] w-full origin-left" />
      </div>
    </div>
  );
}

function ProfileScreen({ answers, onNext }: { answers: Answers; onNext: () => void }) {
  const type = answers.type?.[0] ?? "Family of 3–4";
  const budget = answers.budget?.[0] ?? "₹10,000–15,000";
  const shop = answers.shop?.[0] ?? "Mix Of Both";
  const flexAns = answers.flex?.[0] ?? "Switch If Similar";
  const topPriority = answers.why?.[0] ?? "Save Money";
  const topMatters = answers.matters?.slice(0, 2) ?? ["Price", "Quality"];
  const memberships = (answers.membership ?? []).filter((m) => m !== "No Memberships");

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 lg:p-10">
      <div className="mx-auto h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
        <Check className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl lg:text-3xl font-semibold tracking-tight text-center text-balance">
        Here's your household, at a glance.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-xl mx-auto">
        Built entirely from your answers — nothing generic.
      </p>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
        <ProfileFact label="Household" value={type} />
        <ProfileFact label="Monthly budget" value={budget} />
        <ProfileFact label="Shopping style" value={shop} />
        <ProfileFact label="Brand flexibility" value={flexAns} />
      </div>

      <div className="mt-5 max-w-3xl mx-auto rounded-xl border border-border bg-background p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          What we'll optimize for first
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag highlight>{topPriority}</Tag>
          {topMatters.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
          {memberships.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-7 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          See what this could save you <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SavingsScreen({ answers, onNext }: { answers: Answers; onNext: () => void }) {
  const spend = estimateMonthlySpend(answers);
  const pct = estimateSavingsPct(answers);
  const savings = Math.round((spend * pct) / 100);
  const annual = savings * 12;

  const insights = [
    { icon: Store, text: `Households like yours typically split shopping across 2 stores to save ${pct.toFixed(0)}%+ without losing convenience.` },
    { icon: Clock, text: "Buying staples on a cycle instead of on impulse avoids most duplicate purchases." },
    { icon: TrendingDown, text: "Brand-equivalent swaps on 3-4 regular items usually account for the biggest single saving." },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Based on your profile</div>
        <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
          You could save about <span className="text-accent">₹{savings.toLocaleString("en-IN")}/month</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          That's roughly ₹{annual.toLocaleString("en-IN")}/year — without changing product quality.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        <Stat label="Est. monthly spend" value={`₹${spend.toLocaleString("en-IN")}`} />
        <Stat label="Potential savings" value={`${pct.toFixed(0)}%`} accent />
        <Stat label="Per year" value={`₹${annual.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-7 max-w-2xl mx-auto space-y-2.5">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
            <span className="h-8 w-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
              <ins.icon className="h-4 w-4" />
            </span>
            <p className="text-sm text-muted-foreground">{ins.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        These are estimates based on patterns from similar households — your real numbers will sharpen the moment
        you upload a bill or log a few purchases.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          See how it works <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CapabilitiesScreen({ onNext }: { onNext: () => void }) {
  const capabilities = [
    { icon: ScanLine, title: "Read any bill", body: "Photos, PDFs, screenshots from any app — we extract every item automatically." },
    { icon: Store, title: "Compare stores", body: "See the same basket priced across BigBasket, DMart, Zepto and more." },
    { icon: TrendingDown, title: "Smart swaps", body: "Brand-equivalent suggestions — never just the cheapest option." },
    { icon: Clock, title: "Buy now vs. wait", body: "We track price patterns so you know when to stock up or hold off." },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      <div className="text-center max-w-lg mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">What's next</div>
        <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
          Here's how we'll keep finding savings.
        </h2>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {capabilities.map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-background p-4">
            <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
              <c.icon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold tracking-tight text-sm">{c.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex justify-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          I'm ready <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ActionsScreen() {
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSpend, setManualSpend] = useState("");
  const [saved, setSaved] = useState(false);

  const saveManualSpend = () => {
    const n = Number(manualSpend.replace(/[^0-9.]/g, ""));
    if (!n) return;
    try {
      localStorage.setItem("manualMonthlySpend", String(n));
    } catch {
      // localStorage unavailable (e.g. private browsing) — non-critical, skip persisting
    }
    setSaved(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      <div className="text-center max-w-lg mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last step</div>
        <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
          How do you want to start?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick whichever feels easiest — you can do the rest later.</p>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        <ActionCard
          to="/upload"
          icon={<ScanLine className="h-4 w-4" />}
          title="Upload a bill"
          body="Most accurate — we read every line item in 5-15 seconds."
          primary
        />
        <ActionCardButton
          icon={<PencilLine className="h-4 w-4" />}
          title="Enter grocery spend manually"
          body="No bill handy? Just tell us roughly what you spend."
          onClick={() => setManualOpen((v) => !v)}
        />
        <ActionCard
          to="/this-week"
          icon={<ListChecks className="h-4 w-4" />}
          title="Create a shopping list"
          body="Start planning this week's shop — pantry-aware."
        />
        <ActionCard
          to="/today"
          icon={<Eye className="h-4 w-4" />}
          title="Explore a demo household"
          body="See exactly what insights look like with sample data."
        />
      </div>

      {manualOpen && (
        <div className="mt-4 max-w-md mx-auto rounded-xl border border-border bg-background p-4">
          {saved ? (
            <div className="text-center">
              <Check className="h-5 w-5 text-accent mx-auto" />
              <p className="text-sm mt-2">Got it — we'll use this until your first bill comes in.</p>
              <Link
                to="/today"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Go to Today <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Roughly how much do you spend on groceries per month?
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={manualSpend}
                  onChange={(e) => setManualSpend(e.target.value)}
                  placeholder="12,000"
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
                <button
                  onClick={saveManualSpend}
                  className="rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-semibold hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3 max-w-3xl mx-auto">
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
        <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Every action you take here makes future recommendations sharper.
        </p>
      </div>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-1 text-balance">{value}</div>
    </div>
  );
}

function Tag({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
        highlight ? "bg-foreground text-background border-foreground" : "border-border bg-surface",
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tracking-tight font-mono mt-1", accent && "text-accent")}>{value}</div>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  body,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-xl border p-4 transition-all block",
        primary ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/30",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center mb-3",
          primary ? "bg-background text-foreground" : "bg-surface-2",
        )}
      >
        {icon}
      </div>
      <h3 className="font-semibold tracking-tight text-sm">{title}</h3>
      <p className={cn("text-xs mt-1", primary ? "opacity-80" : "text-muted-foreground")}>{body}</p>
    </Link>
  );
}

function ActionCardButton({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-xl border border-border bg-background p-4 hover:border-foreground/30 transition-all">
      <div className="h-9 w-9 rounded-lg bg-surface-2 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-semibold tracking-tight text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </button>
  );
}
