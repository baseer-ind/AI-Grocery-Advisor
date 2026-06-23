import { createFileRoute } from "@tanstack/react-router";
import { Bell, Calendar as CalIcon, Leaf, RefreshCcw, TrendingDown, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Household Calendar — Household Advisor AI" }] }),
  component: HouseholdCalendar,
});

type Ev = {
  day: number;
  label: string;
  type: "runout" | "reorder" | "alert" | "buynow" | "season";
};

const events: Ev[] = [
  { day: 2, label: "Atta runs out", type: "runout" },
  { day: 3, label: "Oil reorder window", type: "reorder" },
  { day: 4, label: "Buy-now: Surf Excel −₹80", type: "buynow" },
  { day: 6, label: "Monthly staples shop", type: "reorder" },
  { day: 9, label: "Price alert: Tide Plus", type: "alert" },
  { day: 12, label: "Rice harvest drop window", type: "season" },
  { day: 15, label: "Milk subscription renews", type: "reorder" },
  { day: 18, label: "Buy-now: Yippee combo", type: "buynow" },
  { day: 22, label: "Mango season peak (₹40/kg)", type: "season" },
  { day: 27, label: "Detergent runs out", type: "runout" },
];

const typeStyle: Record<Ev["type"], { chip: string; icon: React.ReactNode; label: string }> = {
  runout: { chip: "bg-warning/15 text-warning-foreground", icon: <Bell className="h-3 w-3" />, label: "Run out" },
  reorder: { chip: "bg-foreground text-background", icon: <RefreshCcw className="h-3 w-3" />, label: "Reorder" },
  alert: { chip: "bg-surface-2 text-foreground border border-border", icon: <Bell className="h-3 w-3" />, label: "Alert" },
  buynow: { chip: "bg-accent/15 text-accent", icon: <Zap className="h-3 w-3" />, label: "Buy now" },
  season: { chip: "bg-foreground/10 text-foreground", icon: <Leaf className="h-3 w-3" />, label: "Seasonal" },
};

function HouseholdCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <AppShell title="Household Calendar" eyebrow="Plan / Next 30 days">
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <CalIcon className="h-3 w-3 inline mr-1" />
                September 2025
              </div>
              <h3 className="mt-1 font-semibold tracking-tight">Next 30 days</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest">
              {(["runout", "reorder", "alert", "buynow", "season"] as const).map((t) => (
                <span key={t} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", typeStyle[t].chip)}>
                  {typeStyle[t].icon}
                  {typeStyle[t].label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
            {days.map((d) => {
              const ev = events.find((e) => e.day === d);
              return (
                <div
                  key={d}
                  className={cn(
                    "aspect-square rounded-lg border p-1.5 flex flex-col",
                    ev ? "border-foreground/40 bg-background" : "border-border bg-background",
                  )}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{d}</span>
                  {ev && (
                    <span
                      className={cn(
                        "mt-auto inline-flex items-center justify-center h-5 w-5 rounded-md self-end",
                        typeStyle[ev.type].chip,
                      )}
                    >
                      {typeStyle[ev.type].icon}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Upcoming events
          </div>
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.day + e.label} className="py-3 flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-semibold",
                    typeStyle[e.type].chip,
                  )}
                >
                  {e.day}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{e.label}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {typeStyle[e.type].label}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
                Seasonal opportunity
              </span>
            </div>
            Mangoes peak the third week of September — historically ₹40/kg lower than the prior month.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
