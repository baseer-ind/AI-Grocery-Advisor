import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  AlertCircle,
  ArrowRight,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  PiggyBank,
  Plus,
  Sparkles,
  Store as StoreIcon,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { categories, household, metrics, monthlyTrend } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — Household Advisor AI" }] }),
  component: Home,
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const runningLow = [
  { name: "Cooking Oil", note: "Runs out in 3 days" },
  { name: "Milk", note: "1 day of stock" },
  { name: "Atta", note: "Runs out in 2 days" },
];

const buyThisWeek = [
  { name: "Fortune Oil 5L", price: 920 },
  { name: "Amul Milk 1L × 7", price: 462 },
  { name: "Aashirvaad Atta 10kg", price: 485 },
  { name: "Surf Excel 2kg", price: 520 },
];

const canWait = [
  { name: "Basmati Rice 5kg", reason: "Harvest drop in ~3 weeks" },
  { name: "Sugar 1kg", reason: "24 days of stock" },
  { name: "Tea 500g", reason: "70% stock at home" },
];

const priceAlerts = [
  { name: "Fortune Oil 5L", change: "−6%", tone: "good" as const, note: "Below 6-month average" },
  { name: "Basmati Rice 5kg", change: "+4%", tone: "bad" as const, note: "Trending up before harvest" },
  { name: "Surf Excel 2kg", change: "−3%", tone: "good" as const, note: "DMart weekly deal" },
];

const buyNowOps = [
  { name: "Fortune Oil 5L", save: 120 },
  { name: "Tide Plus 2kg", save: 80 },
  { name: "Yippee Noodles ×6", save: 60 },
];

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

type AlertItem = {
  name: string;
  size: string;
  current: number;
  target: number;
  trend: "down" | "up" | "flat";
  status: "buynow" | "watching" | "fired";
};

const initialAlerts: AlertItem[] = [
  { name: "Fortune Sunflower Oil", size: "5L", current: 920, target: 900, trend: "down", status: "buynow" },
  { name: "Aashirvaad Atta", size: "10kg", current: 485, target: 470, trend: "flat", status: "watching" },
  { name: "Daawat Basmati Rice", size: "5kg", current: 745, target: 680, trend: "up", status: "watching" },
  { name: "Surf Excel", size: "2kg", current: 520, target: 525, trend: "down", status: "fired" },
];

const statusStyle = {
  buynow: { chip: "bg-accent text-accent-foreground", label: "BUY NOW" },
  watching: { chip: "bg-surface-2 text-foreground border border-border", label: "WATCHING" },
  fired: { chip: "bg-foreground text-background", label: "TARGET HIT" },
} as const;

const tabs = ["Overview", "Trends", "Household", "Alerts & Journey"] as const;
type Tab = (typeof tabs)[number];

function Home() {
  const [tab, setTab] = useState<Tab>("Overview");
  const savingsPct = Math.round((metrics.potentialSavings / metrics.currentSpend) * 100);

  return (
    <AppShell title={`Welcome back, ${household.name}.`} eyebrow="Home">
      {/* Tab switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-foreground text-background" : "bg-surface border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mt-5 space-y-5">
          {/* Hero KPI band */}
          <section className="grid grid-cols-12 gap-4">
            <Big
              className="col-span-12 lg:col-span-4"
              eyebrow="Potential monthly savings"
              value={fmt(metrics.potentialSavings)}
              sub="With this week's smart swaps"
              accent
            />
            <Big
              className="col-span-6 lg:col-span-4"
              eyebrow="Potential annual savings"
              value="₹14,400"
              sub="If you stay on plan"
            />
            <Big
              className="col-span-6 lg:col-span-4"
              eyebrow="Best store today"
              value="BigBasket"
              sub="₹8,250 · 96% available · same day"
              icon={<StoreIcon className="h-5 w-5" />}
            />
          </section>

          {/* AI weekly recommendation */}
          <section className="rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" />
                  AI recommendation · this week
                </div>
                <h2 className="mt-3 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
                  Split this shop between <span className="text-accent">BigBasket</span> and{" "}
                  <span className="text-accent">DMart</span> and skip cooking oil — saves ₹540 with no quality loss.
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your pantry shows 1.6× normal oil stock. Rice is trending up before harvest — wait one more week.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to="/this-week"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
                >
                  Open weekly list <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* 3 column intel */}
          <section className="grid grid-cols-12 gap-4">
            <Panel
              className="col-span-12 md:col-span-6 lg:col-span-4"
              icon={<AlertCircle className="h-4 w-4 text-warning-foreground" />}
              eyebrow="Running low"
              to="/this-week"
            >
              <ul className="space-y-2">
                {runningLow.map((r) => (
                  <li key={r.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.note}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel
              className="col-span-12 md:col-span-6 lg:col-span-4"
              icon={<Zap className="h-4 w-4 text-accent" />}
              eyebrow="Buy this week"
              to="/this-week"
            >
              <ul className="space-y-2">
                {buyThisWeek.slice(0, 4).map((r) => (
                  <li key={r.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{r.name}</span>
                    <span className="font-mono text-xs">₹{r.price}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel
              className="col-span-12 md:col-span-12 lg:col-span-4"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              eyebrow="Can wait"
              to="/this-week"
            >
              <ul className="space-y-2">
                {canWait.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium truncate">{r.name}</span>
                    <span className="text-xs text-muted-foreground truncate text-right">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          {/* Charts */}
          <section className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-semibold tracking-tight">Spend vs. AI-Optimized</h3>
                  <p className="text-sm text-muted-foreground">Last 6 months — same basket quality, smarter decisions.</p>
                </div>
                <span className="rounded-md bg-accent/10 text-accent px-2 py-1 text-[11px] font-semibold uppercase font-mono tracking-wider">
                  Saved ₹6.4k
                </span>
              </div>
              <div className="h-72 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendG" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="optG" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="spend" stroke="var(--color-foreground)" strokeWidth={2} fill="url(#spendG)" />
                    <Area type="monotone" dataKey="optimized" stroke="var(--color-accent)" strokeWidth={2} fill="url(#optG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold tracking-tight">Category mix</h3>
              <p className="text-sm text-muted-foreground">This month — 6 categories tracked</p>
              <div className="h-44 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                      {categories.map((c, i) => (
                        <Cell key={i} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip suffix="" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 mt-2">
                {categories.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-mono font-medium">{fmt(c.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ActionCard
              to="/upload"
              icon={<Sparkles className="h-4 w-4" />}
              eyebrow="Start here"
              title="Upload this month's bill"
              body="We OCR-read every item, then AI analyzes it — categorizes spend and surfaces the 3 biggest savings instantly."
            />
            <ActionCard
              to="/bill-check"
              icon={<TrendingDown className="h-4 w-4" />}
              eyebrow="Optimize"
              title="See your basket alternatives"
              body="Same products, smarter stores, or similar-brand swaps — you choose the tradeoff."
            />
            <ActionCard
              to="/this-week"
              icon={<TrendingUp className="h-4 w-4" />}
              eyebrow="Plan"
              title="This week's shopping list"
              body="Pantry-aware list — buy now, buy later, or skip what you already have."
            />
          </section>
        </div>
      )}

      {tab === "Trends" && (
        <div className="mt-5 space-y-5">
          <section className="grid grid-cols-12 gap-4">
            <Hero
              className="col-span-12 lg:col-span-5"
              icon={<Flame className="h-5 w-5 text-warning-foreground" />}
              eyebrow="Household impact this month"
              value="+₹180"
              sub="Versus your 6-month baseline basket"
            />
            <Hero className="col-span-6 lg:col-span-4" eyebrow="Your basket inflation" value="+3.5%" sub="Last 6 months · annualized" />
            <Hero className="col-span-6 lg:col-span-3" eyebrow="City average" value="+3.8%" sub="Hyderabad · same basket" />
          </section>

          <section className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold tracking-tight">Inflation by category</h3>
              <p className="text-sm text-muted-foreground">Month-on-month change</p>
              <div className="h-64 mt-4 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inflation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="cat" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      cursor={{ fill: "var(--color-surface-2)" }}
                      contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${v}%`, "MoM"]}
                    />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold tracking-tight">Your basket vs. city</h3>
              <p className="text-sm text-muted-foreground">Cumulative inflation, 6 months</p>
              <div className="h-64 mt-4 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inflationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="overall" stroke="var(--color-foreground)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="household" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "Household" && (
        <div className="mt-5 grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Household Profile</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-semibold">B</div>
              <div>
                <div className="font-semibold">Baseer's Home</div>
                <div className="text-xs text-muted-foreground">Hyderabad · Active 6 months</div>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <ProfileRow icon={Users} label="Family size" value={household.familySize} />
              <ProfileRow icon={Wallet} label="Budget" value={household.monthlyBudget} />
              <ProfileRow icon={Target} label="Primary goal" value={household.primaryGoal} />
              <ProfileRow icon={Leaf} label="Score" value={`${household.score}/100`} />
            </dl>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {household.memberships.map((m) => (
                <span key={m} className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-3">
            <KPI label="Current Spend" value={fmt(metrics.currentSpend)} delta={`-₹${metrics.lastMonthSpend - metrics.currentSpend} vs last month`} good />
            <KPI label="Optimized Spend" value={fmt(metrics.optimizedSpend)} delta="With recommended swaps" />
            <KPI label="Potential Savings" value={fmt(metrics.potentialSavings)} delta={`${savingsPct}% smarter`} highlight />
            <KPI label="Household Score" value={`${household.score}/100`} delta="Top 12% of similar homes" good />
          </div>

          <div className="col-span-12 rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-semibold tracking-tight">Savings opportunities</h3>
            <p className="text-sm text-muted-foreground">Ranked by household impact</p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Re-time snack run", 320],
                ["Switch rice store", 280],
                ["Skip oil next month", 280],
                ["Subscribe to milk", 220],
                ["Bulk atta every 2 months", 180],
              ].map(([k, v]) => (
                <li key={k as string} className="flex items-center justify-between border-b border-border pb-2">
                  <span>{k as string}</span>
                  <span className="font-mono font-semibold text-accent">−₹{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "Alerts & Journey" && (
        <div className="mt-5 space-y-5">
          <section className="grid grid-cols-12 gap-4">
            <Stat className="col-span-6 lg:col-span-3" label="Bills uploaded" value="6" />
            <Stat className="col-span-6 lg:col-span-3" label="Savings identified" value="₹7,200" />
            <Stat className="col-span-6 lg:col-span-3" label="Savings achieved" value="₹4,560" accent />
            <Stat className="col-span-6 lg:col-span-3" label="Waste avoided" value="3.2 kg" />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="font-semibold tracking-tight">Cumulative savings</h3>
                <p className="text-sm text-muted-foreground">Since your first uploaded bill</p>
              </div>
              <span className="rounded-md bg-accent/10 text-accent px-2 py-1 text-[11px] font-semibold uppercase font-mono tracking-wider">
                On pace · ₹14.4k/yr
              </span>
            </div>
            <div className="h-64 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeSavings}>
                  <defs>
                    <linearGradient id="jG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="saved" stroke="var(--color-accent)" strokeWidth={2} fill="url(#jG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Milestones</span>
              </div>
              <ol className="space-y-3">
                {milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                        m.done ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted-foreground border border-border",
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.text}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Price alerts</span>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {initialAlerts.map((a) => (
                  <li key={a.name} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground">Target ₹{a.target} · Now ₹{a.current}</div>
                    </div>
                    <span className={cn("rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold shrink-0", statusStyle[a.status].chip)}>
                      {statusStyle[a.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="h-4 w-4 text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">Buy-now opportunities</span>
              </div>
              <ul className="divide-y divide-border">
                {buyNowOps.map((b) => (
                  <li key={b.name} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="font-mono text-sm font-semibold text-accent">−₹{b.save}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <BellOff className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Price watch</span>
              </div>
              <p className="text-sm text-muted-foreground">We watch for drops below target, sudden spikes, and seasonal lows — so you don't have to check prices yourself.</p>
              <Link to="/this-week" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:text-accent">
                <Plus className="h-3.5 w-3.5" /> Add a product to track
              </Link>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Big({ className, eyebrow, value, sub, accent, icon }: { className?: string; eyebrow: string; value: string; sub: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border p-6", accent ? "border-accent/40 bg-accent/10" : "border-border bg-surface", className)}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight font-mono">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Panel({ className, eyebrow, icon, to, children }: { className?: string; eyebrow: string; icon: React.ReactNode; to: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</span>
        </div>
        <Link to={to} className="text-xs text-muted-foreground hover:text-foreground">
          Open →
        </Link>
      </div>
      {children}
    </div>
  );
}

function Hero({ className, icon, eyebrow, value, sub }: { className?: string; icon?: React.ReactNode; eyebrow: string; value: string; sub: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight font-mono">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Stat({ className, label, value, accent }: { className?: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", accent ? "border-accent/40 bg-accent/10" : "border-border bg-surface", className)}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight font-mono">{value}</div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, good, highlight }: { label: string; value: string; delta: string; good?: boolean; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", highlight ? "border-accent/40 bg-accent/10" : "border-border bg-surface")}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight font-mono">{value}</div>
      <div className={cn("mt-1 text-xs font-medium", good ? "text-accent" : "text-muted-foreground")}>{delta}</div>
    </div>
  );
}

function ActionCard({ to, icon, eyebrow, title, body }: { to: string; icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-surface p-6 hover:border-foreground/30 transition-all block">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
          {icon}
          {eyebrow}
        </div>
      </div>
      <h4 className="font-semibold tracking-tight">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1 text-pretty">{body}</p>
    </Link>
  );
}

function ChartTip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      {label && <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto font-mono font-medium">₹{p.value?.toLocaleString("en-IN")}{suffix}</span>
        </div>
      ))}
    </div>
  );
}
