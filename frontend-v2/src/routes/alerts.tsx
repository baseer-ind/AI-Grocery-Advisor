import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, BellOff, Plus, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Price Alerts — Household Advisor AI" }] }),
  component: Alerts,
});

type Alert = {
  name: string;
  size: string;
  current: number;
  target: number;
  trend: "down" | "up" | "flat";
  status: "buynow" | "watching" | "fired";
};

const initial: Alert[] = [
  { name: "Fortune Sunflower Oil", size: "5L", current: 920, target: 900, trend: "down", status: "buynow" },
  { name: "Aashirvaad Atta", size: "10kg", current: 485, target: 470, trend: "flat", status: "watching" },
  { name: "Daawat Basmati Rice", size: "5kg", current: 745, target: 680, trend: "up", status: "watching" },
  { name: "Surf Excel", size: "2kg", current: 520, target: 525, trend: "down", status: "fired" },
  { name: "Amul Gold Milk", size: "1L × 30", current: 1740, target: 1700, trend: "flat", status: "watching" },
];

const statusStyle = {
  buynow: { chip: "bg-accent text-accent-foreground", label: "BUY NOW" },
  watching: { chip: "bg-surface-2 text-foreground border border-border", label: "WATCHING" },
  fired: { chip: "bg-foreground text-background", label: "TARGET HIT" },
} as const;

function Alerts() {
  const [items, setItems] = useState(initial);

  return (
    <AppShell title="Price Alerts" eyebrow="Notifications">
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Active alerts
              </div>
              <h3 className="font-semibold tracking-tight">{items.length} products on watch</h3>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-2 text-sm font-semibold hover:opacity-90">
              <Plus className="h-4 w-4" /> Add product
            </button>
          </header>
          <ul className="divide-y divide-border">
            {items.map((a, idx) => (
              <li key={a.name} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">
                    {a.name} <span className="text-muted-foreground font-normal">· {a.size}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target ₹{a.target} · Currently{" "}
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        a.current <= a.target ? "text-accent" : "text-foreground",
                      )}
                    >
                      ₹{a.current}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs",
                    a.trend === "down" && "text-accent",
                    a.trend === "up" && "text-warning-foreground",
                    a.trend === "flat" && "text-muted-foreground",
                  )}
                >
                  {a.trend === "down" && <TrendingDown className="h-3 w-3" />}
                  {a.trend === "up" && <TrendingUp className="h-3 w-3" />}
                  {a.trend === "flat" && <span className="font-bold">—</span>}
                  {a.trend === "down" && "Falling"}
                  {a.trend === "up" && "Rising"}
                  {a.trend === "flat" && "Stable"}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold",
                    statusStyle[a.status].chip,
                  )}
                >
                  {a.status === "buynow" && <Zap className="h-3 w-3" />}
                  {statusStyle[a.status].label}
                </span>
                <button
                  onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Stop tracking"
                >
                  <BellOff className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                What we watch
              </span>
            </div>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>· Price drops below your target</li>
              <li>· Sudden price spikes (cut your basket)</li>
              <li>· Buy-now windows aligned with your pantry</li>
              <li>· Seasonal lows we've seen historically</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
              This week's biggest drop
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight font-mono">−6%</div>
            <p className="text-sm text-muted-foreground">
              Fortune Oil 5L is at a 4-month low on BigBasket. Stock matches your reorder window.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
