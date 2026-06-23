import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Heart, Info, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { aiFindings, categories } from "@/lib/sample-data";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "AI Analysis — Household Advisor AI" }] }),
  component: Analysis,
});

const toneStyles = {
  warning: { ring: "border-warning/40 bg-warning/10", icon: AlertTriangle, color: "text-warning-foreground" },
  info: { ring: "border-border bg-surface", icon: Info, color: "text-muted-foreground" },
  success: { ring: "border-accent/40 bg-accent/10", icon: TrendingUp, color: "text-accent" },
} as const;

function Analysis() {
  return (
    <AppShell title="AI Analysis" eyebrow="Bill / 21 Aug 2025">
      {/* Hero finding */}
      <div className="rounded-2xl border border-border bg-surface p-7 lg:p-10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            AI Summary · high confidence
          </div>
          <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight text-balance max-w-3xl leading-tight">
            Your household spent <span className="font-mono">₹9,250</span> last month.
            A balanced shop — but{" "}
            <span className="text-accent">~₹1,100 of it was avoidable</span> without changing what you eat.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl text-pretty">
            We weighted price, quality, reviews, and timing across 42 line items. Below are the four signals that matter
            most for your household this month.
          </p>
        </div>
      </div>

      {/* Findings */}
      <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiFindings.map((f) => {
          const t = toneStyles[f.tone];
          const Icon = t.icon;
          return (
            <article key={f.label} className={"rounded-2xl border p-6 " + t.ring}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={"h-4 w-4 " + t.color} />
                <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">{f.label}</span>
              </div>
              <p className="text-base leading-relaxed">{f.body}</p>
            </article>
          );
        })}
      </section>

      {/* Category breakdown */}
      <section className="mt-5 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">Category breakdown</h3>
          <p className="text-sm text-muted-foreground">Where your ₹9,250 went</p>
          <div className="h-72 mt-4 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">Savings opportunities</h3>
          <p className="text-sm text-muted-foreground">Ranked by impact for your household</p>
          <ul className="mt-4 divide-y divide-border">
            {[
              { label: "Re-time snacks purchases", impact: 320, why: "Buy when 2-for-1 promos run" },
              { label: "Switch rice store", impact: 280, why: "BigBasket has same brand cheaper" },
              { label: "Skip cooking oil next month", impact: 280, why: "Inventory is already 1.6× normal" },
              { label: "Subscribe to Amul milk", impact: 220, why: "6% lower than ad-hoc orders" },
            ].map((o) => (
              <li key={o.label} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{o.label}</div>
                  <div className="text-xs text-muted-foreground">{o.why}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-accent">-₹{o.impact}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">monthly</div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/basket"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            See basket alternatives
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Annual savings projection */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
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
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              Based on your last 6 bills, applying our recommendations consistently saves about ₹1,200 every month —
              without changing what your household eats.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BigStat label="Monthly" value="₹1,200" />
            <BigStat label="Annual" value="₹14,400" accent />
          </div>
        </div>
      </section>

      {/* Top 3 actions */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-accent" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Top 3 actions this week
          </div>
        </div>
        <h3 className="text-lg font-semibold tracking-tight mb-5">Start here — biggest impact, lowest effort.</h3>
        <ol className="space-y-3">
          {[
            { n: "01", action: "Buy oil from BigBasket", save: 220, why: "Same brand, 6% cheaper than your usual store this week." },
            { n: "02", action: "Switch snack brand", save: 150, why: "Yippee matches Maggi on reviews and household ratings." },
            { n: "03", action: "Delay rice purchase by one week", save: 180, why: "Harvest pricing drop is forecast within 7 days." },
          ].map((a) => (
            <li
              key={a.n}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-xs font-semibold text-muted-foreground">{a.n}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{a.action}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.why}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-semibold text-accent">Save ₹{a.save}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Good decisions + Healthy spending */}
      <section className="mt-5 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-semibold text-accent">
              Good decisions this month
            </span>
          </div>
          <h3 className="font-semibold tracking-tight">You're getting these right.</h3>
          <ul className="mt-4 space-y-3">
            {[
              "Milk purchased at an excellent price · ₹62/L vs ₹68 area average",
              "Good quality-to-price ratio on rice — matches your usual brand rating",
              "Strong value choices in staples — ₹240 saved vs last month",
              "Produce bought at the right time of week (Tuesday restock)",
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
          <h3 className="font-semibold tracking-tight">A calmer balance for your basket.</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { l: "Snack spending higher than similar households", v: "+38%" },
              { l: "Sugary beverages above your usual baseline", v: "+22%" },
              { l: "Fresh produce purchases below average", v: "−18%" },
            ].map((i) => (
              <li key={i.l} className="flex items-center justify-between border-t border-border pt-3 first:border-t-0 first:pt-0">
                <span className="text-muted-foreground">{i.l}</span>
                <span className="font-mono font-semibold">{i.v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Not a health app — just a quieter signal so spending matches what your household actually values.
          </p>
        </div>
      </section>

      {/* Future roadmap */}
      <section className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Coming soon · Roadmap
          </div>
        </div>
        <h3 className="text-lg font-semibold tracking-tight mb-5">
          What your advisor will quietly do next.
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Historical price intelligence",
            "Community pricing",
            "Local kirana intelligence",
            "Pantry photo recognition",
            "Household intelligence",
            "Grocery inflation tracking",
          ].map((r) => (
            <div key={r} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{r}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-1 text-2xl lg:text-3xl font-semibold font-mono tracking-tight " + (accent ? "text-accent" : "")}>
        {value}
      </div>
    </div>
  );
}
