import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Clock, ShoppingBasket, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/list")({
  head: () => ({ meta: [{ title: "Smart Shopping List — Household Advisor AI" }] }),
  component: SmartList,
});

type Row = { name: string; size: string; note: string; price: number };

const buyNow: Row[] = [
  { name: "Cooking Oil", size: "Fortune 5L", note: "Running low · price ₹45 below average", price: 920 },
  { name: "Milk", size: "Amul Gold 1L × 7", note: "Daily staple · subscription saves 6%", price: 462 },
  { name: "Atta", size: "Aashirvaad 10kg", note: "Running low · cycle ends in 2 days", price: 485 },
];

const buyThisWeek: Row[] = [
  { name: "Surf Excel", size: "2kg", note: "DMart deal · −₹20 this week", price: 520 },
  { name: "Tomatoes", size: "1kg", note: "Mid-week restock", price: 38 },
];

const buyLater: Row[] = [
  { name: "Rice", size: "Daawat Basmati 5kg", note: "Wait ~3 weeks · harvest drop expected", price: 745 },
  { name: "Sugar", size: "Madhur 1kg", note: "Stock at home covers next 24 days", price: 48 },
];

const haveIt: Row[] = [
  { name: "Tea", size: "Red Label 500g", note: "70% stock · skip this run", price: 0 },
  { name: "Salt", size: "Tata 1kg", note: "95% stock · skip this run", price: 0 },
];

function SmartList() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((s) => ({ ...s, [k]: !s[k] }));
  const total = buyNow.reduce((a, r) => a + r.price, 0);

  return (
    <AppShell title="Smart Shopping List" eyebrow="Lists / This week">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <Group
            title="Buy now"
            sub="Items running low — restock this week"
            icon={<Zap className="h-4 w-4" />}
            tone="primary"
            rows={buyNow}
            checked={checked}
            onToggle={toggle}
          />
          <Group
            title="Buy this week"
            sub="Worth picking up on your next shop"
            icon={<Clock className="h-4 w-4" />}
            tone="primary"
            rows={buyThisWeek}
            checked={checked}
            onToggle={toggle}
          />
          <Group
            title="Buy later"
            sub="Still available — wait for a better price or cycle"
            icon={<Clock className="h-4 w-4" />}
            tone="warning"
            rows={buyLater}
            checked={checked}
            onToggle={toggle}
          />
          <Group
            title="Already available"
            sub="You have enough at home"
            icon={<Check className="h-4 w-4" />}
            tone="muted"
            rows={haveIt}
            checked={checked}
            onToggle={toggle}
            muted
          />
        </div>

        {/* Sidebar summary */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 sticky top-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              This week's basket
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight font-mono">
                ₹{total.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-muted-foreground">{buyNow.length} items</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent text-xs font-semibold font-mono">
              Save ₹220 vs last week
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">AI tip.</span> Splitting this list between BigBasket
                and DMart saves ₹140 and adds 0 delivery time.
              </p>
            </div>

            <Link
              to="/stores"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              <ShoppingBasket className="h-4 w-4" />
              See store recommendations
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface-2">
              Share with family
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

const toneRing: Record<string, string> = {
  primary: "border-foreground/20",
  warning: "border-warning/30",
  muted: "border-border",
};

const toneChip: Record<string, string> = {
  primary: "bg-foreground text-background",
  warning: "bg-warning/15 text-warning-foreground",
  muted: "bg-surface-2 text-muted-foreground",
};

function Group({
  title,
  sub,
  icon,
  tone,
  rows,
  checked,
  onToggle,
  muted,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  tone: "primary" | "warning" | "muted";
  rows: Row[];
  checked: Record<string, boolean>;
  onToggle: (k: string) => void;
  muted?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border bg-surface", toneRing[tone])}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold",
              toneChip[tone],
            )}
          >
            {icon}
            {title}
          </span>
          <span className="text-sm text-muted-foreground">{sub}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{rows.length} items</span>
      </header>
      <ul className="divide-y divide-border">
        {rows.map((r) => {
          const key = title + r.name;
          const isChecked = !!checked[key];
          return (
            <li key={key} className="px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => onToggle(key)}
                className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                  isChecked
                    ? "bg-foreground border-foreground text-background"
                    : "border-border bg-background",
                )}
                aria-label="toggle"
              >
                {isChecked && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-medium text-sm flex items-center gap-2",
                    isChecked && "line-through text-muted-foreground",
                    muted && "text-muted-foreground",
                  )}
                >
                  {r.name}
                  <span className="text-xs text-muted-foreground font-normal">· {r.size}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>
              </div>
              {r.price > 0 && (
                <div className="font-mono text-sm font-semibold">₹{r.price.toLocaleString("en-IN")}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
