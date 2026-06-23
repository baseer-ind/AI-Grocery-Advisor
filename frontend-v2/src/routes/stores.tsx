import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Truck, ShieldCheck, Users, ExternalLink, ShoppingBasket, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { samplePriceList, stores } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stores")({
  head: () => ({ meta: [{ title: "Store Intelligence — Household Advisor AI" }] }),
  component: StoreIntel,
});

type StoreCard = {
  name: string;
  logo: string;
  color: string;
  basket: number;
  availability: number;
  delivery: string;
  rating: number;
  badge: "BEST VALUE" | "FASTEST" | "BEST QUALITY" | "MOST AVAILABLE";
};

const storeCards: StoreCard[] = [
  { name: "BigBasket", logo: "BB", color: "bg-[#84B135] text-white", basket: 8250, availability: 96, delivery: "Same day", rating: 4.6, badge: "BEST VALUE" },
  { name: "Zepto", logo: "Z", color: "bg-[#5C2D91] text-white", basket: 8920, availability: 88, delivery: "10 min", rating: 4.4, badge: "FASTEST" },
  { name: "Blinkit", logo: "B", color: "bg-[#F8CB46] text-black", basket: 8780, availability: 82, delivery: "15 min", rating: 4.5, badge: "FASTEST" },
  { name: "Instamart", logo: "IS", color: "bg-[#FC8019] text-white", basket: 8640, availability: 86, delivery: "20 min", rating: 4.3, badge: "BEST QUALITY" },
  { name: "Amazon Fresh", logo: "AF", color: "bg-[#232F3E] text-white", basket: 8480, availability: 98, delivery: "Next day", rating: 4.5, badge: "MOST AVAILABLE" },
];

const badgeStyles: Record<StoreCard["badge"], string> = {
  "BEST VALUE": "bg-foreground text-background",
  FASTEST: "bg-accent text-accent-foreground",
  "BEST QUALITY": "bg-warning text-warning-foreground",
  "MOST AVAILABLE": "bg-surface-2 text-foreground border border-border",
};

const confidenceTone: Record<string, string> = {
  High: "bg-accent/15 text-accent",
  Medium: "bg-warning/15 text-warning-foreground",
  Community: "bg-foreground/10 text-foreground",
  Submitted: "bg-surface-2 text-muted-foreground",
};

function StoreIntel() {
  return (
    <AppShell title="Local Store Intelligence" eyebrow="Stores · Hyderabad">
      {/* Store recommendation cards with logos */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Recommended stores · for your basket
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Where your shop performs best this week
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeCards.map((s) => (
            <article
              key={s.name}
              className="rounded-2xl border border-border bg-surface p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base", s.color)}>
                    {s.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">{s.name}</h3>
                    <div className="text-xs text-muted-foreground">★ {s.rating} · {s.delivery}</div>
                  </div>
                </div>
                <span className={cn("rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap", badgeStyles[s.badge])}>
                  {s.badge}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Metric label="Basket" value={`₹${s.basket.toLocaleString("en-IN")}`} />
                <Metric label="Available" value={`${s.availability}%`} />
                <Metric label="Delivery" value={s.delivery} small />
              </div>

              <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-2">
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background px-2.5 py-2 text-xs font-semibold hover:opacity-90">
                  <ShoppingBasket className="h-3.5 w-3.5" />
                  Open basket
                </button>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold hover:bg-surface-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add to cart
                </button>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold hover:bg-surface-2">
                  Continue
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Original local + community stores */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <article key={s.name} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.type === "Online" ? <Truck className="h-3 w-3 inline mr-1" /> : <MapPin className="h-3 w-3 inline mr-1" />}
                  {s.type}
                </div>
                <h3 className="mt-1 font-semibold tracking-tight">{s.name}</h3>
              </div>
              <span className={"rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold " + confidenceTone[s.confidence]}>
                {s.confidence}
              </span>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono tracking-tight">₹{s.basket.toLocaleString("en-IN")}</span>
              <span className="text-xs text-muted-foreground">for your basket</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>★ {s.rating}</span>
              <span>{s.delivery}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-semibold tracking-tight">Price comparison · core staples</h3>
            <p className="text-sm text-muted-foreground">Live online · validated by 1,240 nearby households</p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <Legend dot="bg-accent" label="Lowest" />
            <Legend icon={<ShieldCheck className="h-3 w-3" />} label="Verified" />
            <Legend icon={<Users className="h-3 w-3" />} label="Community" />
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
                    {prices.map((p, idx) => {
                      const keys = ["bigbasket", "dmart", "zepto", "local"];
                      return (
                        <td
                          key={keys[idx]}
                          className={
                            "py-3 px-4 text-right font-mono " +
                            (idx === 3 ? "pr-6 " : "") +
                            (p === min ? "text-accent font-semibold" : "text-foreground")
                          }
                        >
                          ₹{p}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Why split your shop
        </div>
        <p className="text-sm leading-relaxed max-w-3xl">
          The cheapest store rarely wins on every product. For your basket, splitting between BigBasket and DMart saves
          ₹840/month with no quality loss and adds only 6 minutes of pickup time. We weigh delivery, ratings, and your
          household priorities — not just unit price.
        </p>
      </section>
    </AppShell>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-semibold font-mono tracking-tight", small ? "text-sm" : "text-lg")}>{value}</div>
    </div>
  );
}

function Legend({ dot, icon, label }: { dot?: string; icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      {dot ? <span className={"h-2 w-2 rounded-full " + dot} /> : icon}
      {label}
    </span>
  );
}
