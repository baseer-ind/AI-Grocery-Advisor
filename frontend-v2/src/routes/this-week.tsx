import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowRight, Camera, Check, CheckCircle2, Clock, Plus, ShoppingBasket, Sparkles, XCircle, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/this-week")({
  head: () => ({ meta: [{ title: "This Week — Household Advisor AI" }] }),
  component: ThisWeek,
});

type Item = { name: string; size: string; daysSince: number; cycle: number; level: number };

const runningLow: Item[] = [
  { name: "Cooking Oil", size: "Fortune 5L", daysSince: 32, cycle: 35, level: 18 },
  { name: "Milk", size: "Amul Gold 1L", daysSince: 2, cycle: 3, level: 22 },
  { name: "Atta", size: "Aashirvaad 10kg", daysSince: 28, cycle: 30, level: 25 },
];

const outOfStock: Item[] = [
  { name: "Detergent", size: "Surf Excel 2kg", daysSince: 62, cycle: 60, level: 0 },
  { name: "Dish Wash", size: "Vim Bar ×3", daysSince: 45, cycle: 40, level: 0 },
];

const available: Item[] = [
  { name: "Rice", size: "Daawat Basmati 5kg", daysSince: 8, cycle: 45, level: 78 },
  { name: "Sugar", size: "Madhur 1kg", daysSince: 6, cycle: 30, level: 82 },
  { name: "Tea", size: "Red Label 500g", daysSince: 12, cycle: 60, level: 70 },
  { name: "Salt", size: "Tata 1kg", daysSince: 4, cycle: 90, level: 95 },
];

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

const tabs = ["Shopping List", "Pantry"] as const;
type Tab = (typeof tabs)[number];

function ThisWeek() {
  const [tab, setTab] = useState<Tab>("Shopping List");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((s) => ({ ...s, [k]: !s[k] }));
  const total = buyNow.reduce((a, r) => a + r.price, 0);

  return (
    <AppShell title="This Week" eyebrow="Pantry & Shopping List">
      <div className="flex gap-1.5 -mx-1 px-1">
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

      {tab === "Shopping List" && (
        <div className="mt-5 grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8 space-y-5">
            <Group title="Buy now" sub="Items running low — restock this week" icon={<Zap className="h-4 w-4" />} tone="primary" rows={buyNow} checked={checked} onToggle={toggle} />
            <Group title="Buy this week" sub="Worth picking up on your next shop" icon={<Clock className="h-4 w-4" />} tone="primary" rows={buyThisWeek} checked={checked} onToggle={toggle} />
            <Group title="Buy later" sub="Still available — wait for a better price or cycle" icon={<Clock className="h-4 w-4" />} tone="warning" rows={buyLater} checked={checked} onToggle={toggle} />
            <Group title="Already available" sub="You have enough at home" icon={<Check className="h-4 w-4" />} tone="muted" rows={haveIt} checked={checked} onToggle={toggle} muted />
          </div>

          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6 sticky top-24">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">This week's basket</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight font-mono">₹{total.toLocaleString("en-IN")}</span>
                <span className="text-sm text-muted-foreground">{buyNow.length} items</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent text-xs font-semibold font-mono">
                Save ₹220 vs last week
              </div>
              <div className="mt-5 rounded-xl border border-border bg-background p-4 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">AI tip.</span> Splitting this list between BigBasket and DMart saves ₹140 and adds 0 delivery time.
                </p>
              </div>
              <Link to="/bill-check" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90">
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
      )}

      {tab === "Pantry" && (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative max-w-3xl">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Know before you shop</div>
              <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
                We track what you usually buy, so you never re-buy what you already have.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Based on your last 6 bills, we estimate what's running low at home and what can wait. No barcode scanning required.
              </p>
            </div>
          </div>

          <Section title="Running low" sub="Restock before your next shop" icon={<AlertCircle className="h-4 w-4 text-warning-foreground" />} tone="warning">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {runningLow.map((i) => (
                <PantryCard key={i.name} item={i} tone="warning" />
              ))}
            </div>
          </Section>

          <section className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-accent" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Smart reorder suggestion</div>
            </div>
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold tracking-tight mt-1">Cooking Oil · Fortune 5L</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                  Usually bought every <b className="text-foreground">35 days</b>. Last purchased{" "}
                  <b className="text-foreground">32 days ago</b>. Adding it to your next basket prevents a last-minute ₹120 price spike.
                </p>
              </div>
              <button
                onClick={() => setTab("Shopping List")}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Add to next basket
              </button>
            </div>
          </section>

          <Section title="Out of stock" sub="Add to your next shop" icon={<XCircle className="h-4 w-4 text-destructive" />} tone="destructive">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStock.map((i) => (
                <article key={i.name} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold tracking-tight">{i.name}</h4>
                    <div className="text-xs text-muted-foreground">{i.size} · last bought {i.daysSince}d ago</div>
                  </div>
                  <button onClick={() => setTab("Shopping List")} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-semibold hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Available at home" sub="No need to re-buy this week" icon={<CheckCircle2 className="h-4 w-4 text-accent" />} tone="success">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {available.map((i) => (
                <PantryCard key={i.name} item={i} tone="success" />
              ))}
            </div>
          </Section>

          <section className="rounded-2xl border border-dashed border-border bg-surface p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight">Pantry photo recognition</h3>
                    <span className="rounded-md bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                    Snap a photo of your shelf or fridge — AI identifies products, reads expiry dates, and updates your pantry automatically.
                  </p>
                </div>
              </div>
              <button disabled className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                Notify me
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

const toneRing: Record<string, string> = { primary: "border-foreground/20", warning: "border-warning/30", muted: "border-border" };
const toneChip: Record<string, string> = { primary: "bg-foreground text-background", warning: "bg-warning/15 text-warning-foreground", muted: "bg-surface-2 text-muted-foreground" };

function Group({ title, sub, icon, tone, rows, checked, onToggle, muted }: { title: string; sub: string; icon: React.ReactNode; tone: "primary" | "warning" | "muted"; rows: Row[]; checked: Record<string, boolean>; onToggle: (k: string) => void; muted?: boolean }) {
  return (
    <section className={cn("rounded-2xl border bg-surface", toneRing[tone])}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold", toneChip[tone])}>
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
                className={cn("h-5 w-5 rounded-md border flex items-center justify-center shrink-0", isChecked ? "bg-foreground border-foreground text-background" : "border-border bg-background")}
                aria-label="toggle"
              >
                {isChecked && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={cn("font-medium text-sm flex items-center gap-2", isChecked && "line-through text-muted-foreground", muted && "text-muted-foreground")}>
                  {r.name}
                  <span className="text-xs text-muted-foreground font-normal">· {r.size}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>
              </div>
              {r.price > 0 && <div className="font-mono text-sm font-semibold">₹{r.price.toLocaleString("en-IN")}</div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Section({ title, sub, icon, tone, children }: { title: string; sub: string; icon: React.ReactNode; tone: "warning" | "success" | "destructive"; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <span className={cn("font-mono text-[10px] uppercase tracking-widest font-semibold", tone === "warning" && "text-warning-foreground", tone === "success" && "text-accent", tone === "destructive" && "text-destructive")}>
              {title}
            </span>
          </div>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{sub}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function PantryCard({ item, tone }: { item: Item; tone: "warning" | "success" }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold tracking-tight">{item.name}</h4>
          <div className="text-xs text-muted-foreground">{item.size}</div>
        </div>
        <span className="font-mono text-xs font-semibold">{item.level}%</span>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className={cn("h-full", tone === "warning" ? "bg-warning" : "bg-accent")} style={{ width: `${item.level}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Bought {item.daysSince}d ago</span>
        <span>Cycle ~{item.cycle}d</span>
      </div>
    </article>
  );
}
