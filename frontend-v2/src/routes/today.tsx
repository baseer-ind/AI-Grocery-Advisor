import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  PiggyBank,
  Sparkles,
  Store as StoreIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { categories, household, monthlyTrend } from "@/lib/sample-data";
import { demoEvents, demoPantry, demoProfile } from "@/lib/demo-household";
import {
  getFrequentProducts,
  getHouseholdProfile,
  hasRealData,
  type StoredHouseholdProfile,
} from "@/lib/real-data";
import { computeHouseholdIdentity, confidenceNarrative } from "@/lib/household-identity";
import {
  getPredictedPantry,
  getShoppingEvents,
  type PredictedPantry,
  type ShoppingEventSummary,
} from "@/lib/api";
import {
  buildHouseholdJourney,
  buildWeeklyActionCards,
  computeHouseholdIntelligenceScore,
  computePlanningScore,
  computeShoppingReadiness,
  type WeeklyActionCard,
} from "@/lib/household-intelligence";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/today")({
  head: () => ({ meta: [{ title: "Today — Household Advisor AI" }] }),
  validateSearch: (search: Record<string, unknown>): { sample?: boolean } => ({
    sample: search.sample === "1" || search.sample === true || undefined,
  }),
  component: Today,
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const inflation = [
  { cat: "Cooking Oil", pct: -3.2 },
  { cat: "Rice", pct: 4.8 },
  { cat: "Milk", pct: 1.4 },
  { cat: "Vegetables", pct: 6.7 },
  { cat: "Pulses", pct: 2.1 },
  { cat: "Snacks", pct: 0.6 },
];

const inflationTrend = [
  { m: "Mar", overall: 1.2, household: 1.0 },
  { m: "Apr", overall: 1.8, household: 1.4 },
  { m: "May", overall: 2.4, household: 2.0 },
  { m: "Jun", overall: 3.1, household: 2.7 },
  { m: "Jul", overall: 3.5, household: 3.2 },
  { m: "Aug", overall: 3.8, household: 3.5 },
];

const cumulativeSavings = [
  { m: "Mar", saved: 320 },
  { m: "Apr", saved: 820 },
  { m: "May", saved: 1480 },
  { m: "Jun", saved: 2340 },
  { m: "Jul", saved: 3360 },
  { m: "Aug", saved: 4560 },
];

const milestones = [
  { d: "12 Mar", text: "First bill uploaded", done: true },
  { d: "01 Apr", text: "Switched cooking oil store · ₹220 saved", done: true },
  { d: "08 May", text: "Started Amul milk subscription · ₹100/mo", done: true },
  { d: "22 Jun", text: "Skipped duplicate oil purchase · ₹920 saved", done: true },
  { d: "09 Aug", text: "Brand swap on detergent · ₹80/mo", done: true },
  { d: "—", text: "Hit ₹6,000 annual savings", done: false },
];

function Today() {
  const { sample } = Route.useSearch();
  const [showDetails, setShowDetails] = useState(false);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  const [pantry, setPantry] = useState<PredictedPantry | null>(null);
  const [events, setEvents] = useState<ShoppingEventSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  const profileForFetch = sample ? null : getHouseholdProfile();

  useEffect(() => {
    if (!profileForFetch) return;
    setLoading(true);
    Promise.all([
      getPredictedPantry(profileForFetch.householdId).then(setPantry),
      getShoppingEvents(profileForFetch.householdId).then(setEvents),
    ]).finally(() => setLoading(false));
  }, [profileForFetch]);

  if (!sample && !hasRealData()) {
    const profile = getHouseholdProfile();
    return (
      <AppShell title="Household HQ" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto space-y-4">
          <HouseholdSnapshotStrip profile={profile} />
          <div className="text-center rounded-2xl border border-border bg-surface p-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              We're just getting started
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile
                ? "We'll learn more after your first shopping event."
                : "Let's build your household profile."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile
                ? "Add a bill, your frequent purchases, or your monthly spend, and we'll start predicting your pantry and shopping rhythm from there — never invented numbers."
                : "It takes about two minutes and needs no bill — just a few questions about your household."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={profile ? "/upload" : "/household"}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                {profile ? "Add a bill" : "Build my household profile"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/today"
                search={{ sample: true }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const profile = getHouseholdProfile();

  if (loading) {
    return (
      <AppShell title="Household HQ" eyebrow="Household Advisor">
        <div className="max-w-xl mx-auto space-y-4 animate-pulse">
          <div className="h-20 rounded-2xl bg-surface-2" />
          <div className="h-32 rounded-2xl bg-surface-2" />
          <div className="h-32 rounded-2xl bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Household HQ" eyebrow="Household Advisor">
      <div className="space-y-4 max-w-3xl mx-auto">
        {sample && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warning bg-warning/10 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-warning-foreground">
              Interactive demo — exploring a demo household, not your data
            </span>
            <Link to="/upload" className="text-xs font-semibold underline hover:no-underline">
              Add a bill
            </Link>
          </div>
        )}
        <HouseholdHQ
          profile={sample ? demoProfile : profile}
          pantry={sample ? demoPantry : pantry}
          events={sample ? demoEvents : events}
          showScoreDetail={showScoreDetail}
          setShowScoreDetail={setShowScoreDetail}
        />

        {!sample && (
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/upload"
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Add a bill
            </Link>
            <Link
              to="/knowledge"
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
            >
              What we know about you
            </Link>
          </div>
        )}

        {/* Progressive disclosure: full breakdown — illustrative charts, sample mode only */}
        {sample && (
          <section className="rounded-2xl border border-border bg-surface">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium"
            >
              <span>Full breakdown — spend, inflation &amp; savings history</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showDetails && "rotate-180")}
              />
            </button>

            {showDetails && (
              <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-8 rounded-xl border border-border p-5">
                    <h3 className="font-semibold tracking-tight text-sm">Spend vs. AI-optimized</h3>
                    <p className="text-xs text-muted-foreground">Last 6 months</p>
                    <div className="h-56 -ml-4 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyTrend}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="spendG" x1="0" x2="0" y1="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor="var(--color-foreground)"
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--color-foreground)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient id="optG" x1="0" x2="0" y1="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor="var(--color-accent)"
                                stopOpacity={0.25}
                              />
                              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `₹${v / 1000}k`}
                          />
                          <Tooltip content={<ChartTip />} />
                          <Area
                            type="monotone"
                            dataKey="spend"
                            stroke="var(--color-foreground)"
                            strokeWidth={2}
                            fill="url(#spendG)"
                          />
                          <Area
                            type="monotone"
                            dataKey="optimized"
                            stroke="var(--color-accent)"
                            strokeWidth={2}
                            fill="url(#optG)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 rounded-xl border border-border p-5">
                    <h3 className="font-semibold tracking-tight text-sm">Category mix</h3>
                    <div className="h-40 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categories}
                            dataKey="value"
                            innerRadius={40}
                            outerRadius={62}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {categories.map((c, i) => (
                              <Cell key={i} fill={c.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip suffix="" />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-1.5 mt-2">
                      {categories.map((c) => (
                        <li key={c.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: c.color }}
                            />
                            <span className="text-muted-foreground">{c.name}</span>
                          </div>
                          <span className="font-mono font-medium">{fmt(c.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-7 rounded-xl border border-border p-5">
                    <h3 className="font-semibold tracking-tight text-sm">Inflation by category</h3>
                    <div className="h-52 mt-3 -ml-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inflation}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="cat"
                            stroke="var(--color-muted-foreground)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--color-surface-2)" }}
                            contentStyle={{
                              background: "var(--color-background)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            formatter={(v: any) => [`${v}%`, "MoM"]}
                          />
                          <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-5 rounded-xl border border-border p-5">
                    <h3 className="font-semibold tracking-tight text-sm">Basket vs. city</h3>
                    <div className="h-52 mt-3 -ml-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={inflationTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="m"
                            stroke="var(--color-muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--color-background)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="overall"
                            stroke="var(--color-foreground)"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="household"
                            stroke="var(--color-accent)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-5">
                  <div className="flex items-end justify-between mb-3">
                    <h3 className="font-semibold tracking-tight text-sm">
                      Cumulative savings since first bill
                    </h3>
                    <span className="rounded-md bg-accent/10 text-accent px-2 py-1 text-[11px] font-semibold uppercase font-mono tracking-wider">
                      On pace · ₹14.4k/yr
                    </span>
                  </div>
                  <div className="h-52 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeSavings}>
                        <defs>
                          <linearGradient id="jG" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="m"
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="saved"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          fill="url(#jG)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <ol className="mt-4 space-y-2">
                    {milestones.map((m, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={cn(
                            "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                            m.done
                              ? "bg-accent text-accent-foreground"
                              : "bg-surface-2 text-muted-foreground border border-border",
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{m.text}</div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {m.d}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-border p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <StoreIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Household profile</div>
                      <div className="text-xs text-muted-foreground">
                        {household.familySize} members · {household.monthlyBudget} budget ·{" "}
                        {household.primaryGoal}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/household"
                    className="text-xs font-semibold hover:text-accent shrink-0"
                  >
                    Update profile →
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function HouseholdSnapshotStrip({ profile }: { profile: StoredHouseholdProfile | null }) {
  if (!profile) {
    return (
      <Link
        to="/household"
        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface px-5 py-3.5 hover:border-foreground/30 transition-colors"
      >
        <span className="text-sm font-medium">
          Build your household profile to unlock personalized insights
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Link>
    );
  }

  const stats: { label: string; value: string }[] = [
    { label: "Shopping style", value: profile.shoppingStyle },
    { label: "Planning", value: profile.planningStyle },
    { label: "Pantry", value: profile.pantryReadiness },
    { label: "Profile confidence", value: `${Math.round(profile.confidence)}%` },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface px-5 py-3.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
              <div className="text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
        <Link
          to="/household"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
        >
          Update profile →
        </Link>
      </div>
    </section>
  );
}

function FeedCard({
  icon,
  tag,
  tagClass,
  title,
  body,
  to,
  cta,
  muted,
  why,
  improve,
  confidence,
}: {
  icon?: React.ReactNode;
  tag: string;
  tagClass: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  muted?: boolean;
  why?: string;
  improve?: string | null;
  confidence?: "low" | "medium" | "high";
}) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <section
      className={cn(
        "rounded-3xl bg-surface-2 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        muted && "opacity-90",
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">{tag}</span>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-balance">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{body}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Link
              to={to}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent"
            >
              {cta} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {why && (
              <button
                onClick={() => setShowWhy((v) => !v)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Why?
              </button>
            )}
          </div>
          {why && showWhy && (
            <div className="mt-2 text-xs text-muted-foreground border-t border-border pt-2 space-y-1">
              <p>
                {why}
                {confidence && <span className="ml-1 capitalize">· Confidence: {confidence}</span>}
              </p>
              {improve && <p>To improve this: {improve}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HouseholdHQ({
  profile,
  pantry,
  events,
  showScoreDetail,
  setShowScoreDetail,
}: {
  profile: StoredHouseholdProfile | null;
  pantry: PredictedPantry | null;
  events: ShoppingEventSummary[] | null;
  showScoreDetail: boolean;
  setShowScoreDetail: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const planning = computePlanningScore(events);
  const intelligence = computeHouseholdIntelligenceScore(profile, events, pantry);
  const readiness = computeShoppingReadiness(pantry, events, planning, profile, null);
  const identity = computeHouseholdIdentity(events, getFrequentProducts());
  const cards = buildWeeklyActionCards(pantry, events, planning, identity);
  const journey = buildHouseholdJourney(profile, events, pantry, planning);
  const journeyDone = journey.filter((m) => m.done).length;
  const narrative = confidenceNarrative(events?.length ?? 0);

  return (
    <>
      {/* Layer 1 — Shopping Readiness. One sentence, one fact to remember. Everything
          else on this screen is supporting detail, never competing with this answer. */}
      <section className="px-1 pt-2 pb-1">
        <div className="text-xs text-muted-foreground">{readiness.greeting}</div>

        <p className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance leading-[1.15]">
          {readiness.headline}
        </p>

        {readiness.remember && (
          <p className="mt-2 text-base text-muted-foreground text-pretty max-w-prose">
            {readiness.remember}
          </p>
        )}

        {identity && (
          <p className="mt-1 text-base text-muted-foreground">
            Your household appears to be a{" "}
            <span className="text-foreground font-medium">{identity.label}</span>.
          </p>
        )}

        {readiness.status !== "unknown" && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-1.5 w-1.5 rounded-full",
                readiness.status === "ready" ? "bg-accent" : "bg-warning",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {readiness.status === "ready" ? "Ready to shop" : "Needs a little attention"}
            </span>
          </div>
        )}

        {intelligence && (
          <button
            onClick={() => setShowScoreDetail((v) => !v)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            {narrative} — learn more
          </button>
        )}

        {/* Layer 3 — exploration, collapsed by default: confidence breakdown, shopping
            style, progress, and history. Real signals, but none of them is "what to do next." */}
        {intelligence && showScoreDetail && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold">{intelligence.profileConfidence}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                  Profile
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold">{intelligence.historyDepthScore}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                  Shopping history
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold">{intelligence.pantryConfidenceScore}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                  What you probably have
                </div>
              </div>
            </div>

            {profile && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Your shopping style
                </span>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                  {profile.shoppingStyle}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                  {profile.planningStyle}
                </span>
              </div>
            )}

            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Household identity
              </span>
              {identity ? (
                <div className="mt-1.5">
                  <span className="text-sm font-semibold">{identity.label}</span>
                  <ul className="mt-1.5 space-y-1">
                    {identity.evidence.map((e, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  We're still learning your shopping style.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Your progress
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {journeyDone}/{journey.length}
                </span>
              </div>
              <ol className="space-y-1.5">
                {journey.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 text-sm">
                    {m.done ? (
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn(!m.done && "text-muted-foreground")}>{m.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <ShoppingTimeline events={events} />
          </div>
        )}
      </section>

      {/* Layer 2 — the recommendations themselves */}
      {cards.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto snap-x pb-1 sm:grid sm:grid-cols-1 sm:overflow-visible">
          {cards.map((card) => (
            <div key={card.id} className="min-w-[85%] sm:min-w-0 snap-start">
              <FeedCard
                tag={card.tag}
                tagClass="bg-surface-2 text-foreground border border-border"
                title={card.title}
                body={card.body}
                to={card.to}
                cta={card.cta}
                why={card.why}
                improve={card.improve}
                confidence={card.confidence}
              />
            </div>
          ))}
        </div>
      ) : (
        <FeedCard
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          tag="Build your profile"
          tagClass="bg-accent text-accent-foreground"
          title="Add a bill to start seeing real recommendations"
          body="Once you have a couple of shopping events, this is where running-low items, timing, and store comparisons will show up."
          to="/upload"
          cta="Add a bill"
        />
      )}
    </>
  );
}

function ShoppingTimeline({ events }: { events: ShoppingEventSummary[] | null }) {
  if (events == null) return null;

  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Recent shopping
      </span>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Your first shopping event will show up here once you add a bill.
        </p>
      ) : (
        <ol className="mt-2 space-y-2.5">
          {events.map((e) => (
            <li
              key={e.shopping_event_id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div>
                <div className="font-medium">{e.store_name ?? "Unknown store"}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {e.bill_date ?? "Date unknown"}
                  {e.purchase_method ? ` · ${e.purchase_method.replace("_", " ")}` : ""}
                </div>
              </div>
              {e.total_spend != null && (
                <span className="font-mono font-semibold">{fmt(e.total_spend)}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ChartTip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      {label && (
        <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">
          {label}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.payload?.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto font-mono font-medium">
            ₹{p.value?.toLocaleString("en-IN")}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
