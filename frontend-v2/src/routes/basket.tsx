import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { basketOptions } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/basket")({
  head: () => ({ meta: [{ title: "Basket Optimization — Household Advisor AI" }] }),
  component: Basket,
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Basket() {
  const [selected, setSelected] = useState("brands");
  const current = basketOptions[0];
  const alts = basketOptions.slice(1);

  return (
    <AppShell title="Basket Optimization" eyebrow="Bill / Alternatives">
      <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Current Basket
            </div>
            <div className="mt-1 text-4xl lg:text-5xl font-semibold tracking-tight font-mono">
              {fmt(current.cost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{current.items} products · BigBasket</div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-accent/10 text-accent px-3 py-1.5">
            <Sparkles className="h-4 w-4" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">
              3 smarter ways to shop this
            </span>
          </div>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {alts.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "text-left rounded-2xl border bg-surface p-6 transition-all relative",
                isSelected
                  ? "border-foreground ring-1 ring-foreground"
                  : "border-border hover:border-foreground/30",
                opt.recommended && "lg:scale-[1.02]",
              )}
            >
              {opt.badge && (
                <span
                  className={cn(
                    "absolute -top-2 left-6 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold",
                    opt.recommended ? "bg-foreground text-background" : "bg-surface-2 text-muted-foreground border border-border",
                  )}
                >
                  {opt.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Option {basketOptions.indexOf(opt)}
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{opt.label}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold font-mono tracking-tight">{fmt(opt.cost)}</span>
                <span className="text-sm text-muted-foreground line-through font-mono">{fmt(current.cost)}</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent text-xs font-semibold font-mono">
                Save ₹{opt.savings}
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-pretty">{opt.note}</p>

              <ul className="mt-5 space-y-2 text-sm">
                {sampleSwapsFor(opt.id).map((s) => (
                  <li key={s.label} className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-mono font-medium text-accent">−₹{s.delta}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </section>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Why we recommend
          </div>
          <div className="mt-1 max-w-2xl text-sm">
            We weight <b>quality</b> and <b>reviews</b> alongside price — never the cheapest by default. Brand swaps shown
            here all match or beat your current rating on Amazon, Flipkart, and BigBasket reviews.
          </div>
        </div>
        <button className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 whitespace-nowrap">
          Apply this basket
        </button>
      </div>
    </AppShell>
  );
}

function sampleSwapsFor(id: string) {
  if (id === "same") return [
    { label: "Re-time snacks ×4", delta: 180 },
    { label: "Skip duplicate oil 5L", delta: 170 },
  ];
  if (id === "stores") return [
    { label: "Rice → DMart", delta: 220 },
    { label: "Detergents → BigBasket", delta: 180 },
    { label: "Snacks → Zepto promo", delta: 600 },
  ];
  return [
    { label: "Aashirvaad → Pillsbury Atta", delta: 95 },
    { label: "Surf Excel → Tide Plus", delta: 80 },
    { label: "Maggi → Yippee (similar rating)", delta: 60 },
    { label: "Local equivalents ×7", delta: 1065 },
  ];
}
