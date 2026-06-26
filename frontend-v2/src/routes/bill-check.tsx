import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Check,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store as StoreIconLucide,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  aiFindings,
  basketOptions,
  categories,
  products,
  samplePriceList,
  stores,
} from "@/lib/sample-data";
import { hasRealData } from "@/lib/real-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bill-check")({
  head: () => ({ meta: [{ title: "Bill Check — Household Advisor AI" }] }),
  validateSearch: (search: Record<string, unknown>): { sample?: boolean } => ({
    sample: search.sample === "1" || search.sample === true || undefined,
  }),
  component: BillCheck,
});

const toneStyles = {
  warning: {
    ring: "border-warning/40 bg-warning/10",
    icon: AlertTriangle,
    color: "text-warning-foreground",
  },
  info: { ring: "border-border bg-surface", icon: Info, color: "text-muted-foreground" },
  success: { ring: "border-accent/40 bg-accent/10", icon: TrendingUp, color: "text-accent" },
} as const;

const badgeStyles: Record<string, string> = {
  "BUY NOW": "bg-accent text-accent-foreground",
  WAIT: "bg-warning text-warning-foreground",
  "GOOD VALUE": "bg-foreground text-background",
};

const storeCards = [
  {
    name: "BigBasket",
    logo: "BB",
    color: "bg-[#84B135] text-white",
    basket: 8250,
    availability: 96,
    delivery: "Same day",
    rating: 4.6,
    badge: "BEST VALUE" as const,
  },
  {
    name: "Zepto",
    logo: "Z",
    color: "bg-[#5C2D91] text-white",
    basket: 8920,
    availability: 88,
    delivery: "10 min",
    rating: 4.4,
    badge: "FASTEST" as const,
  },
  {
    name: "Blinkit",
    logo: "B",
    color: "bg-[#F8CB46] text-black",
    basket: 8780,
    availability: 82,
    delivery: "15 min",
    rating: 4.5,
    badge: "FASTEST" as const,
  },
];

const storeBadgeStyles: Record<string, string> = {
  "BEST VALUE": "bg-foreground text-background",
  FASTEST: "bg-accent text-accent-foreground",
};

const tabs = ["Overview", "Basket Swaps", "Product Picks", "Compare Stores"] as const;
type Tab = (typeof tabs)[number];

function BillCheck() {
  const { sample } = Route.useSearch();
  const [tab, setTab] = useState<Tab>("Overview");
  const [selected, setSelected] = useState(basketOptions[3].id);
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const current = basketOptions[0];
  const alternatives = basketOptions.slice(1);
  const activeProduct = products[activeProductIdx];

  if (!sample && !hasRealData()) {
    return (
      <AppShell title="Bill Check" eyebrow="No bill yet">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10 mt-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Not enough data yet
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Upload your first bill to see your analysis
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We don't show bill insights until we've actually read one of your bills — never invented
            numbers.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Upload a bill <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/bill-check"
              search={{ sample: true }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              Explore a sample bill
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Bill Check" eyebrow="Sample analysis">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning bg-warning/10 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-warning-foreground">
          Sample mode — this is illustrative data, not your bill
        </span>
        <Link to="/upload" className="text-xs font-semibold underline hover:no-underline">
          Upload your bill
        </Link>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-foreground text-background"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-7 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                AI Summary · high confidence
              </div>
              <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight text-balance max-w-3xl leading-tight">
                Your household spent <span className="font-mono">₹9,250</span> last month. A
                balanced shop — but <span className="text-accent">~₹1,100 of it was avoidable</span>{" "}
                without changing what you eat.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl text-pretty">
                We OCR-read every line item, then AI weighted price, quality, reviews, and timing
                across 42 products. Here are the four signals that matter most this month.
              </p>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiFindings.map((f) => {
              const t = toneStyles[f.tone];
              const Icon = t.icon;
              return (
                <article key={f.label} className={"rounded-2xl border p-6 " + t.ring}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={"h-4 w-4 " + t.color} />
                    <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">
                      {f.label}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed">{f.body}</p>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold tracking-tight">Category breakdown</h3>
              <p className="text-sm text-muted-foreground">Where your ₹9,250 went</p>
              <div className="h-72 mt-4 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
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
                      cursor={{ fill: "var(--color-surface-2)" }}
                      contentStyle={{
                        background: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold tracking-tight">Top 3 actions this week</h3>
              <p className="text-sm text-muted-foreground">Biggest impact, lowest effort</p>
              <ol className="mt-4 space-y-3">
                {[
                  {
                    n: "01",
                    action: "Buy oil from BigBasket",
                    save: 220,
                    why: "Same brand, 6% cheaper this week.",
                  },
                  {
                    n: "02",
                    action: "Switch snack brand",
                    save: 150,
                    why: "Yippee matches Maggi on reviews.",
                  },
                  {
                    n: "03",
                    action: "Delay rice purchase",
                    save: 180,
                    why: "Harvest price drop forecast in 7 days.",
                  },
                ].map((a) => (
                  <li
                    key={a.n}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{a.action}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.why}</div>
                    </div>
                    <div className="font-mono font-semibold text-accent text-sm shrink-0">
                      −₹{a.save}
                    </div>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setTab("Basket Swaps")}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                See basket alternatives <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative grid lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Potential annual savings
                </div>
                <h3 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
                  Small, calm changes compound to{" "}
                  <span className="text-accent font-mono">₹14,400</span> over a year.
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Monthly
                  </div>
                  <div className="mt-1 text-2xl font-semibold font-mono tracking-tight">₹1,200</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Annual
                  </div>
                  <div className="mt-1 text-2xl font-semibold font-mono tracking-tight text-accent">
                    ₹14,400
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="font-mono text-[11px] uppercase tracking-widest font-semibold text-accent">
                  Good decisions this month
                </span>
              </div>
              <ul className="mt-2 space-y-3">
                {[
                  "Milk purchased at an excellent price · ₹62/L vs ₹68 area average",
                  "Good quality-to-price ratio on rice — matches your usual brand rating",
                  "Strong value choices in staples — ₹240 saved vs last month",
                ].map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-6 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-foreground" />
                <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">
                  Healthy spending insights
                </span>
              </div>
              <ul className="mt-2 space-y-3 text-sm">
                {[
                  { l: "Snack spending higher than similar households", v: "+38%" },
                  { l: "Sugary beverages above your usual baseline", v: "+22%" },
                  { l: "Fresh produce purchases below average", v: "−18%" },
                ].map((i) => (
                  <li
                    key={i.l}
                    className="flex items-center justify-between border-t border-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <span className="text-muted-foreground">{i.l}</span>
                    <span className="font-mono font-semibold">{i.v}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Not a health app — just a quieter signal so spending matches what your household
                actually values.
              </p>
            </div>
          </section>
        </div>
      )}

      {tab === "Basket Swaps" && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Current Basket
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight font-mono">
                ₹{current.cost.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-muted-foreground">
                {current.items} items · {current.note}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alternatives.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className={cn(
                  "text-left rounded-2xl border p-5 transition-all",
                  selected === o.id
                    ? "border-foreground bg-surface"
                    : "border-border bg-surface hover:border-foreground/30",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold tracking-tight">{o.label}</span>
                  {o.badge && (
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold",
                        o.recommended
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-2 text-foreground border border-border",
                      )}
                    >
                      {o.badge}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold tracking-tight font-mono">
                  ₹{o.cost.toLocaleString("en-IN")}
                </div>
                <div className="mt-1 text-xs font-semibold text-accent">Save ₹{o.savings}</div>
                <p className="mt-3 text-xs text-muted-foreground">{o.note}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Why we recommend this
            </div>
            <p className="text-sm leading-relaxed max-w-3xl">
              Equal-quality brand swaps and a split across BigBasket and DMart save ₹1,300/month
              with no drop in your household's quality scores.
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90">
              Apply this basket
            </button>
          </div>
        </div>
      )}

      {tab === "Product Picks" && (
        <div className="mt-5 grid grid-cols-12 gap-5">
          <aside className="col-span-12 lg:col-span-4 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
              Tracked products · {products.length}
            </div>
            {products.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setActiveProductIdx(i)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all flex items-center justify-between gap-3",
                  activeProductIdx === i
                    ? "border-foreground bg-surface"
                    : "border-border bg-surface hover:border-foreground/30",
                )}
              >
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.size}</div>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold",
                    badgeStyles[p.recommendation],
                  )}
                >
                  {p.recommendation}
                </span>
              </button>
            ))}
          </aside>

          <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mt-1">{activeProduct.name}</h2>
                <div className="text-sm text-muted-foreground">{activeProduct.size}</div>
              </div>
              <span
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-widest font-semibold",
                  badgeStyles[activeProduct.recommendation],
                )}
              >
                {activeProduct.recommendation}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Price label="Current" value={activeProduct.current} accent />
              <Price label="Average" value={activeProduct.avg} />
              <Price label="Lowest" value={activeProduct.low} subtle />
              <Price label="Highest" value={activeProduct.high} subtle />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-background p-5">
              <h3 className="font-semibold tracking-tight mb-3">6-month price trend</h3>
              <div className="h-56 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeProduct.trend}>
                    <defs>
                      <linearGradient id="prodG" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="d"
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
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => [`₹${v}`, "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="p"
                      stroke="var(--color-foreground)"
                      strokeWidth={2}
                      fill="url(#prodG)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Why this recommendation
              </div>
              <p className="text-sm leading-relaxed">{activeProduct.reason}</p>
            </div>
          </section>
        </div>
      )}

      {tab === "Compare Stores" && (
        <div className="mt-5 space-y-5">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeCards.map((s) => (
              <article
                key={s.name}
                className="rounded-2xl border border-border bg-surface p-5 flex flex-col"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base",
                        s.color,
                      )}
                    >
                      {s.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight">{s.name}</h3>
                      <div className="text-xs text-muted-foreground">
                        ★ {s.rating} · {s.delivery}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap",
                      storeBadgeStyles[s.badge],
                    )}
                  >
                    {s.badge}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric label="Basket" value={`₹${s.basket.toLocaleString("en-IN")}`} />
                  <Metric label="Available" value={`${s.availability}%`} />
                  <Metric label="Delivery" value={s.delivery} small />
                </div>
                <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background px-2.5 py-2 text-xs font-semibold hover:opacity-90">
                    <ShoppingBasket className="h-3.5 w-3.5" /> Open basket
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold hover:bg-surface-2">
                    <Plus className="h-3.5 w-3.5" /> Add to cart
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((s) => (
              <article key={s.name} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {s.type === "Online" ? (
                        <Truck className="h-3 w-3 inline mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 inline mr-1" />
                      )}
                      {s.type}
                    </div>
                    <h3 className="mt-1 font-semibold tracking-tight">{s.name}</h3>
                  </div>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight">
                    ₹{s.basket.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground">for your basket</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>★ {s.rating}</span>
                  <span>{s.delivery}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface overflow-hidden">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-semibold tracking-tight">Price comparison · core staples</h3>
                <p className="text-sm text-muted-foreground">
                  Live online · validated by 1,240 nearby households
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Community
                </span>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-left text-xs uppercase tracking-widest font-mono text-muted-foreground bg-surface-2">
                  <tr>
                    <th className="py-3 px-6 font-medium">Product</th>
                    <th className="py-3 px-4 font-medium text-right">BigBasket</th>
                    <th className="py-3 px-4 font-medium text-right">DMart</th>
                    <th className="py-3 px-4 font-medium text-right">Zepto</th>
                    <th className="py-3 px-4 font-medium text-right pr-6">Local</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePriceList.map((row) => {
                    const prices = [row.bigbasket, row.dmart, row.zepto, row.local];
                    const min = Math.min(...prices);
                    return (
                      <tr key={row.product} className="border-t border-border">
                        <td className="py-3 px-6 font-medium">{row.product}</td>
                        {prices.map((p, idx) => (
                          <td
                            key={idx}
                            className={cn(
                              "py-3 px-4 text-right font-mono",
                              idx === 3 && "pr-6",
                              p === min ? "text-accent font-semibold" : "text-foreground",
                            )}
                          >
                            ₹{p}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Why split your shop
            </div>
            <p className="text-sm leading-relaxed max-w-3xl">
              The cheapest store rarely wins on every product. For your basket, splitting between
              BigBasket and DMart saves ₹840/month with no quality loss and adds only 6 minutes of
              pickup time.
            </p>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Price({
  label,
  value,
  accent,
  subtle,
}: {
  label: string;
  value: number;
  accent?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent ? "border-foreground bg-background" : "border-border bg-background",
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight font-mono",
          subtle && "text-muted-foreground",
        )}
      >
        ₹{value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn("mt-1 font-semibold font-mono tracking-tight", small ? "text-sm" : "text-lg")}
      >
        {value}
      </div>
    </div>
  );
}
