import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Camera, CheckCircle2, Plus, Sparkles, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pantry")({
  head: () => ({ meta: [{ title: "Pantry Assistant — Household Advisor AI" }] }),
  component: Pantry,
});

type Item = {
  name: string;
  size: string;
  daysSince: number;
  cycle: number;
  level: number; // 0-100
};

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

function Pantry() {
  return (
    <AppShell title="Pantry Assistant" eyebrow="Home / What you already have">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Know before you shop
          </div>
          <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
            We track what you usually buy, so you never re-buy what you already have.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Based on your last 6 bills, we estimate what's running low at home and what can wait. No barcode
            scanning required.
          </p>
        </div>
      </div>

      {/* Running Low */}
      <Section
        title="Running low"
        sub="Restock before your next shop"
        icon={<AlertCircle className="h-4 w-4 text-warning-foreground" />}
        tone="warning"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {runningLow.map((i) => (
            <PantryCard key={i.name} item={i} tone="warning" />
          ))}
        </div>
      </Section>

      {/* Smart Reorder */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-accent" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Smart reorder suggestion
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mt-1">Cooking Oil · Fortune 5L</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Usually bought every <b className="text-foreground">35 days</b>. Last purchased{" "}
              <b className="text-foreground">32 days ago</b>. Adding it to your next basket prevents a last-minute
              ₹120 price spike at quick-commerce apps.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/list"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add to next basket
            </Link>
          </div>
        </div>
      </section>

      {/* Out of stock */}
      <Section
        title="Out of stock"
        sub="Add to your next shop"
        icon={<XCircle className="h-4 w-4 text-destructive" />}
        tone="destructive"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outOfStock.map((i) => (
            <article
              key={i.name}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-semibold tracking-tight">{i.name}</h4>
                <div className="text-xs text-muted-foreground">
                  {i.size} · last bought {i.daysSince}d ago
                </div>
              </div>
              <Link
                to="/list"
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-semibold hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Link>
            </article>
          ))}
        </div>
      </Section>

      {/* Available */}
      <Section
        title="Available at home"
        sub="No need to re-buy this week"
        icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
        tone="success"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {available.map((i) => (
            <PantryCard key={i.name} item={i} tone="success" />
          ))}
        </div>
      </Section>


      {/* Photo Recognition - Coming Soon */}
      <section className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-6 lg:p-8">
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
                Snap a photo of your shelf or fridge — AI identifies products, reads expiry dates, and updates your
                pantry automatically.
              </p>
            </div>
          </div>
          <button
            disabled
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed"
          >
            Notify me
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function Section({
  title,
  sub,
  icon,
  tone,
  children,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  tone: "warning" | "success" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-widest font-semibold",
                tone === "warning" && "text-warning-foreground",
                tone === "success" && "text-accent",
                tone === "destructive" && "text-destructive",
              )}
            >
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
        <div
          className={cn("h-full", tone === "warning" ? "bg-warning" : "bg-accent")}
          style={{ width: `${item.level}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Bought {item.daysSince}d ago</span>
        <span>Cycle ~{item.cycle}d</span>
      </div>
    </article>
  );
}
