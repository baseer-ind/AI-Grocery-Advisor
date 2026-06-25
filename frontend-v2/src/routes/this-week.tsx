import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  ShoppingBasket,
  Sparkles,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import {
  addPlannerItem,
  getHouseholdProfile,
  getPlannerAdded,
  getPlannerRemoved,
  hasRealData,
  removePlannerAddedItem,
  removePlannerItem,
} from "@/lib/real-data";
import { getPredictedPantry, type PredictedPantry, type PredictedPantryItem } from "@/lib/api";

export const Route = createFileRoute("/this-week")({
  head: () => ({ meta: [{ title: "This Week — Household Advisor AI" }] }),
  validateSearch: (search: Record<string, unknown>): { sample?: boolean } => ({
    sample: search.sample === "1" || search.sample === true || undefined,
  }),
  component: ThisWeek,
});

type Item = { name: string; size: string; daysSince: number; cycle: number; level: number };

// Demo-only data — illustrative, shown only in the interactive demo (?sample=true).
// Never rendered for a real household; real lists are built from PredictedPantry below.
const demoRunningLow: Item[] = [
  { name: "Cooking Oil", size: "Fortune 5L", daysSince: 32, cycle: 35, level: 18 },
  { name: "Milk", size: "Amul Gold 1L", daysSince: 2, cycle: 3, level: 22 },
  { name: "Atta", size: "Aashirvaad 10kg", daysSince: 28, cycle: 30, level: 25 },
];

const demoOutOfStock: Item[] = [
  { name: "Detergent", size: "Surf Excel 2kg", daysSince: 62, cycle: 60, level: 0 },
  { name: "Dish Wash", size: "Vim Bar ×3", daysSince: 45, cycle: 40, level: 0 },
];

const demoAvailable: Item[] = [
  { name: "Rice", size: "Daawat Basmati 5kg", daysSince: 8, cycle: 45, level: 78 },
  { name: "Sugar", size: "Madhur 1kg", daysSince: 6, cycle: 30, level: 82 },
  { name: "Tea", size: "Red Label 500g", daysSince: 12, cycle: 60, level: 70 },
  { name: "Salt", size: "Tata 1kg", daysSince: 4, cycle: 90, level: 95 },
];

type Row = {
  name: string;
  size: string;
  note: string;
  price?: number;
  source?: "predicted" | "added";
};

const demoBuyNow: Row[] = [
  {
    name: "Cooking Oil",
    size: "Fortune 5L",
    note: "Running low · price ₹45 below average",
    price: 920,
  },
  {
    name: "Milk",
    size: "Amul Gold 1L × 7",
    note: "Daily staple · subscription saves 6%",
    price: 462,
  },
  { name: "Atta", size: "Aashirvaad 10kg", note: "Running low · cycle ends in 2 days", price: 485 },
];

const demoBuyThisWeek: Row[] = [
  { name: "Surf Excel", size: "2kg", note: "DMart deal · −₹20 this week", price: 520 },
  { name: "Tomatoes", size: "1kg", note: "Mid-week restock", price: 38 },
];

const demoHaveIt: Row[] = [
  { name: "Tea", size: "Red Label 500g", note: "70% stock · skip this run", price: 0 },
  { name: "Salt", size: "Tata 1kg", note: "95% stock · skip this run", price: 0 },
];

const tabs = ["Shopping List", "Pantry"] as const;
type Tab = (typeof tabs)[number];

// Buckets a real, predicted pantry into the same shape the UI expects — no
// prices or savings, since we don't know real prices. Only what we actually know:
// the item, how confident we are, and roughly how soon it'll run out.
function bucketRealPantry(
  pantry: PredictedPantry | null,
  removed: string[],
  added: { name: string }[],
) {
  const items = (pantry?.items ?? []).filter((i) => !removed.includes(i.product_name));
  const withEstimate = items.filter((i) => i.estimated_days_of_stock_remaining != null);

  const toRow = (i: PredictedPantryItem): Row => ({
    name: i.product_name,
    size: i.category,
    note:
      i.estimated_days_of_stock_remaining != null
        ? `Usually lasts ~${i.typical_repurchase_interval_days ?? "?"} days · about ${i.estimated_days_of_stock_remaining} day${i.estimated_days_of_stock_remaining === 1 ? "" : "s"} left`
        : "Not enough purchase history yet",
    source: "predicted",
  });

  const runningLow = withEstimate
    .filter((i) => (i.estimated_days_of_stock_remaining ?? 0) < 5)
    .sort(
      (a, b) =>
        (a.estimated_days_of_stock_remaining ?? 0) - (b.estimated_days_of_stock_remaining ?? 0),
    );
  const soon = withEstimate
    .filter((i) => {
      const d = i.estimated_days_of_stock_remaining ?? 0;
      return d >= 5 && d < 14;
    })
    .sort(
      (a, b) =>
        (a.estimated_days_of_stock_remaining ?? 0) - (b.estimated_days_of_stock_remaining ?? 0),
    );
  const stocked = withEstimate.filter((i) => (i.estimated_days_of_stock_remaining ?? 0) >= 14);

  const addedRows: Row[] = added
    .filter((a) => !removed.includes(a.name))
    .map((a) => ({
      name: a.name,
      size: "",
      note: "You added this — not from your purchase history.",
      source: "added",
    }));

  return {
    runningLow: [...addedRows, ...runningLow.map(toRow)],
    soon: soon.map(toRow),
    stocked: stocked.map(toRow),
  };
}

function ThisWeek() {
  const { sample } = Route.useSearch();
  const [tab, setTab] = useState<Tab>("Shopping List");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((s) => ({ ...s, [k]: !s[k] }));

  const [pantry, setPantry] = useState<PredictedPantry | null>(null);
  const profile = sample ? null : getHouseholdProfile();

  const [removed, setRemoved] = useState<string[]>(() => getPlannerRemoved());
  const [added, setAdded] = useState(() => getPlannerAdded());
  const [newItemName, setNewItemName] = useState("");

  function handleRemove(row: Row) {
    if (row.source === "added") {
      removePlannerAddedItem(row.name);
      setAdded(getPlannerAdded());
    } else {
      removePlannerItem(row.name);
      setRemoved(getPlannerRemoved());
    }
  }

  function handleAddItem() {
    const name = newItemName.trim();
    if (!name) return;
    addPlannerItem(name);
    setAdded(getPlannerAdded());
    setRemoved(getPlannerRemoved());
    setNewItemName("");
  }

  useEffect(() => {
    if (!profile) return;
    getPredictedPantry(profile.householdId).then(setPantry);
  }, [profile]);

  if (!sample && !hasRealData()) {
    return (
      <AppShell title="This Week" eyebrow="Pantry & Shopping List">
        <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-surface p-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            We're just getting started
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile
              ? "We'll build your shopping list after your first bill."
              : "Let's build your household profile."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile
              ? "Once we've seen a couple of shopping events, we'll start predicting what's running low — never invented numbers."
              : "It takes about two minutes and needs no bill — just a few questions about your household."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={profile ? "/upload" : "/household"}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              {profile ? "Add a bill" : "Build my household profile"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/this-week"
              search={{ sample: true }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              See how it works
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const real = !sample ? bucketRealPantry(pantry, removed, added) : null;
  const buyNow = sample ? demoBuyNow : real!.runningLow;
  const buyThisWeek = sample ? demoBuyThisWeek : real!.soon;
  const haveIt = sample ? demoHaveIt : real!.stocked;
  const total = sample ? demoBuyNow.reduce((a, r) => a + (r.price ?? 0), 0) : null;
  const trackedCount = sample ? null : (pantry?.items.length ?? 0);
  const noPantryYet = !sample && !pantry;

  return (
    <AppShell title="This Week" eyebrow="Pantry & Shopping List">
      {sample && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning bg-warning/10 px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-warning-foreground">
            Interactive demo — exploring a demo household, not your data
          </span>
          <Link to="/upload" className="text-xs font-semibold underline hover:no-underline">
            Add your own bill
          </Link>
        </div>
      )}

      <div className="flex gap-1.5 -mx-1 px-1">
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

      {tab === "Shopping List" && (
        <div className="mt-5 grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {noPantryYet ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  We'll start predicting what's running low once we understand your shopping habits
                  — add a bill to get started.
                </p>
              </div>
            ) : (
              <>
                <Group
                  title="Likely running low"
                  sub={
                    sample
                      ? "Items running low — restock this week"
                      : "Based on your purchase history"
                  }
                  icon={<Zap className="h-4 w-4" />}
                  tone="primary"
                  rows={buyNow}
                  checked={checked}
                  onToggle={toggle}
                  onRemove={sample ? undefined : handleRemove}
                  emptyLabel="Nothing looks low right now."
                />
                <Group
                  title="Worth picking up soon"
                  sub={sample ? "Worth picking up on your next shop" : "A few days of stock left"}
                  icon={<Clock className="h-4 w-4" />}
                  tone="warning"
                  rows={buyThisWeek}
                  checked={checked}
                  onToggle={toggle}
                  onRemove={sample ? undefined : handleRemove}
                  emptyLabel="Nothing in this range yet."
                />
                <Group
                  title="Well stocked"
                  sub="You have enough at home"
                  icon={<Check className="h-4 w-4" />}
                  tone="muted"
                  rows={haveIt}
                  checked={checked}
                  onToggle={toggle}
                  onRemove={sample ? undefined : handleRemove}
                  muted
                  emptyLabel="Nothing well-stocked yet — check back after a few more bills."
                />

                {!sample && (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Know you need something we missed?
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                        placeholder="e.g. Coffee"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6 sticky top-24">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                This week's list
              </div>
              {sample ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight font-mono">
                      ₹{(total ?? 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-muted-foreground">{demoBuyNow.length} items</span>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent text-xs font-semibold font-mono">
                    Save ₹220 vs last week
                  </div>
                  <div className="mt-5 rounded-xl border border-border bg-background p-4 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">AI tip.</span> Splitting this
                      list between BigBasket and DMart saves ₹140 and adds 0 delivery time.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight">
                      {trackedCount} item{trackedCount === 1 ? "" : "s"} tracked
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    We don't estimate prices yet — only what's likely running low, based on your
                    real shopping history.
                  </p>
                </>
              )}
              <Link
                to="/bill-check"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                <ShoppingBasket className="h-4 w-4" />
                See store recommendations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {tab === "Pantry" && (
        <div className="mt-5 space-y-5">
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
                {sample
                  ? "Based on your last 6 bills, we estimate what's running low at home and what can wait. No barcode scanning required."
                  : "Based on your real shopping history, we estimate what's running low at home and what can wait. No barcode scanning required."}
              </p>
            </div>
          </div>

          {sample ? (
            <>
              <Section
                title="Running low"
                sub="Restock before your next shop"
                icon={<AlertCircle className="h-4 w-4 text-warning-foreground" />}
                tone="warning"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {demoRunningLow.map((i) => (
                    <PantryCard key={i.name} item={i} tone="warning" />
                  ))}
                </div>
              </Section>

              <Section
                title="Out of stock"
                sub="Add to your next shop"
                icon={<XCircle className="h-4 w-4 text-destructive" />}
                tone="destructive"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoOutOfStock.map((i) => (
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
                      <button
                        onClick={() => setTab("Shopping List")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-semibold hover:opacity-90"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </article>
                  ))}
                </div>
              </Section>

              <Section
                title="Available at home"
                sub="No need to re-buy this week"
                icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
                tone="success"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {demoAvailable.map((i) => (
                    <PantryCard key={i.name} item={i} tone="success" />
                  ))}
                </div>
              </Section>
            </>
          ) : noPantryYet || !pantry || pantry.items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted-foreground">
                We'll begin predicting your pantry once we understand your shopping habits — add a
                couple of bills to get started.
              </p>
            </div>
          ) : (
            <Section
              title={`Confidence: ${pantry.confidence}`}
              sub="What we think you have, based on your real shopping history"
              icon={<Sparkles className="h-4 w-4 text-accent" />}
              tone="success"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pantry.items.map((i) => (
                  <RealPantryCard key={i.product_id} item={i} />
                ))}
              </div>
            </Section>
          )}

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
                    Snap a photo of your shelf or fridge — AI identifies products, reads expiry
                    dates, and updates your pantry automatically.
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
        </div>
      )}
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
  onRemove,
  muted,
  emptyLabel,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  tone: "primary" | "warning" | "muted";
  rows: Row[];
  checked: Record<string, boolean>;
  onToggle: (k: string) => void;
  onRemove?: (row: Row) => void;
  muted?: boolean;
  emptyLabel?: string;
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
      {rows.length === 0 ? (
        <div className="px-6 py-6 text-sm text-muted-foreground">
          {emptyLabel ?? "Nothing here yet."}
        </div>
      ) : (
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
                  aria-label={onRemove ? "Confirm" : "toggle"}
                  title={onRemove ? "Confirm — yes, I need this" : undefined}
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
                    {r.size && (
                      <span className="text-xs text-muted-foreground font-normal">· {r.size}</span>
                    )}
                    {r.source === "added" && (
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        Added by you
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>
                </div>
                {!!r.price && r.price > 0 && (
                  <div className="font-mono text-sm font-semibold">
                    ₹{r.price.toLocaleString("en-IN")}
                  </div>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(r)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${r.name}`}
                    title="Remove — this isn't actually needed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
    <section>
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

// Real pantry items — the fill is computed directly from the same prediction
// fields shown below it (days remaining / typical interval), never invented.
function RealPantryCard({ item }: { item: PredictedPantryItem }) {
  const pct =
    item.estimated_days_of_stock_remaining != null && item.typical_repurchase_interval_days
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (item.estimated_days_of_stock_remaining / item.typical_repurchase_interval_days) *
                100,
            ),
          ),
        )
      : null;
  const tone = pct != null && pct < 30 ? "warning" : "success";

  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold tracking-tight">{item.product_name}</h4>
          <div className="text-xs text-muted-foreground">{item.category}</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {item.confidence}
        </span>
      </div>
      {pct != null && (
        <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={cn("h-full", tone === "warning" ? "bg-warning" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {item.estimated_days_of_stock_remaining != null
            ? `~${item.estimated_days_of_stock_remaining}d left`
            : "Not enough history yet"}
        </span>
        {item.typical_repurchase_interval_days != null && (
          <span>Cycle ~{item.typical_repurchase_interval_days}d</span>
        )}
      </div>
    </article>
  );
}
