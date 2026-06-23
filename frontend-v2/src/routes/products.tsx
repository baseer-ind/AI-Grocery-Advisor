import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { products } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Product Intelligence — Household Advisor AI" }] }),
  component: ProductIntel,
});

const badgeStyles: Record<string, string> = {
  "BUY NOW": "bg-accent text-accent-foreground",
  WAIT: "bg-warning text-warning-foreground",
  "GOOD VALUE": "bg-foreground text-background",
  "WATCH PRICE": "bg-surface-2 text-foreground border border-border",
};

function ProductIntel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = products[activeIdx];

  return (
    <AppShell title="Product Intelligence" eyebrow="Catalog">
      <div className="grid grid-cols-12 gap-5">
        {/* List */}
        <aside className="col-span-12 lg:col-span-4 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Tracked products · 3
          </div>
          {products.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all flex items-center justify-between gap-3",
                activeIdx === i
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

        {/* Detail */}
        <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Product
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mt-1">{active.name}</h2>
              <div className="text-sm text-muted-foreground">{active.size}</div>
            </div>
            <span
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-widest font-semibold",
                badgeStyles[active.recommendation],
              )}
            >
              {active.recommendation}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Price label="Current" value={active.current} accent />
            <Price label="Average" value={active.avg} />
            <Price label="Lowest" value={active.low} subtle />
            <Price label="Highest" value={active.high} subtle />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold tracking-tight">6-month price trend</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Confidence
                </span>
                <div className="h-1.5 w-20 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${active.confidence}%` }} />
                </div>
                <span className="font-mono text-xs font-semibold">{active.confidence}%</span>
              </div>
            </div>
            <div className="h-56 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={active.trend}>
                  <defs>
                    <linearGradient id="prodG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [`₹${v}`, "Price"]}
                  />
                  <Area type="monotone" dataKey="p" stroke="var(--color-foreground)" strokeWidth={2} fill="url(#prodG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Why this recommendation
            </div>
            <p className="text-sm leading-relaxed">{active.reason}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Price({ label, value, accent, subtle }: { label: string; value: number; accent?: boolean; subtle?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent ? "border-foreground bg-background" : "border-border bg-background",
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
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
