import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Flame,
  PiggyBank,
  Sparkles,
  Store as StoreIcon,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/command")({
  head: () => ({ meta: [{ title: "Household Command Center — Household Advisor AI" }] }),
  component: Command,
});

const runningLow = [
  { name: "Cooking Oil", note: "Runs out in 3 days" },
  { name: "Milk", note: "1 day of stock" },
  { name: "Atta", note: "Runs out in 2 days" },
];

const buyThisWeek = [
  { name: "Fortune Oil 5L", price: 920, store: "BigBasket" },
  { name: "Amul Milk 1L × 7", price: 462, store: "Subscription" },
  { name: "Aashirvaad Atta 10kg", price: 485, store: "DMart" },
  { name: "Surf Excel 2kg", price: 520, store: "DMart" },
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
];

function Command() {
  return (
    <AppShell title="Household Command Center" eyebrow="Home · Live">
      {/* Hero KPI band */}
      <section className="grid grid-cols-12 gap-4">
        <Big
          className="col-span-12 lg:col-span-4"
          eyebrow="Potential monthly savings"
          value="₹1,200"
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
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
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
              to="/list"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Open weekly list <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              Ask advisor
            </Link>
          </div>
        </div>
      </section>

      {/* 3 column intel */}
      <section className="mt-5 grid grid-cols-12 gap-4">
        <Panel
          className="col-span-12 md:col-span-6 lg:col-span-4"
          icon={<AlertCircle className="h-4 w-4 text-warning-foreground" />}
          eyebrow="Running low"
          to="/pantry"
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
          to="/list"
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
          to="/list"
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

      {/* Price alerts + Buy now ops */}
      <section className="mt-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Price alerts
              </span>
            </div>
            <Link to="/alerts" className="text-xs text-muted-foreground hover:text-foreground">
              Manage →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {priceAlerts.map((a) => (
              <li key={a.name} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.note}</div>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-semibold",
                    a.tone === "good" ? "bg-accent/10 text-accent" : "bg-warning/15 text-warning-foreground",
                  )}
                >
                  {a.tone === "good" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {a.change}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
              Buy-now opportunities
            </span>
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
      </section>

      {/* Inflation + calendar */}
      <section className="mt-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grocery inflation · this month
              </span>
            </div>
            <Link to="/inflation" className="text-xs text-muted-foreground hover:text-foreground">
              Full view →
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inflation.map((i) => (
              <li key={i.cat} className="rounded-xl border border-border bg-background p-4">
                <div className="text-xs text-muted-foreground">{i.cat}</div>
                <div
                  className={cn(
                    "mt-1 font-mono font-semibold text-lg",
                    i.pct > 0 ? "text-warning-foreground" : "text-accent",
                  )}
                >
                  {i.pct > 0 ? "+" : ""}
                  {i.pct.toFixed(1)}%
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Household impact this month: <b className="text-foreground font-mono">+₹180</b> versus the average
            month — mostly vegetables and rice.
          </p>
        </div>

        <Link
          to="/calendar"
          className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6 hover:border-foreground/30 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Household calendar
            </span>
          </div>
          <h3 className="font-semibold tracking-tight">Next 14 days · 6 events</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Oil reorder</span>
              <span className="font-mono text-xs text-muted-foreground">in 3 days</span>
            </li>
            <li className="flex justify-between">
              <span>Atta runs out</span>
              <span className="font-mono text-xs text-muted-foreground">in 2 days</span>
            </li>
            <li className="flex justify-between">
              <span>Rice price drop window</span>
              <span className="font-mono text-xs text-muted-foreground">in 12 days</span>
            </li>
            <li className="flex justify-between">
              <span>Monthly staples shop</span>
              <span className="font-mono text-xs text-muted-foreground">in 6 days</span>
            </li>
          </ul>
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
            Open calendar <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </section>

      {/* Confirm of last good week */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          <div>
            <div className="font-semibold">You saved ₹240 vs last week</div>
            <div className="text-xs text-muted-foreground">
              Strong calls on milk subscription and produce timing.
            </div>
          </div>
        </div>
        <Link
          to="/journey"
          className="inline-flex items-center gap-1 text-sm font-semibold hover:text-accent"
        >
          See savings journey <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}

function Big({
  className,
  eyebrow,
  value,
  sub,
  accent,
  icon,
}: {
  className?: string;
  eyebrow: string;
  value: string;
  sub: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        accent ? "border-accent/40 bg-accent/10" : "border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight font-mono">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Panel({
  className,
  eyebrow,
  icon,
  to,
  children,
}: {
  className?: string;
  eyebrow: string;
  icon: React.ReactNode;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </span>
        </div>
        <Link to={to} className="text-xs text-muted-foreground hover:text-foreground">
          Open →
        </Link>
      </div>
      {children}
    </div>
  );
}
