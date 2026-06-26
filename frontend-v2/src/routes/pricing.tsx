import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pro — Household Advisor AI" }] }),
  component: Pricing,
});

const tiers = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    description: "Start understanding your household this month.",
    features: [
      "5 bills / month",
      "Basket optimization (1 alternative)",
      "AI advisor — 20 prompts / month",
      "3 tracked products",
    ],
    cta: "Current plan",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹299",
    cadence: "per month",
    description: "Full household intelligence — for families serious about smart purchasing.",
    features: [
      "Unlimited bill analysis",
      "Historical price intelligence (12 months)",
      "Full basket optimization (3 alternatives)",
      "Buy-time recommendations & alerts",
      "Price alerts on tracked products",
      "Community pricing insights",
      "Multi-member household sharing",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Family+",
    price: "₹699",
    cadence: "per month",
    description: "For multi-generation homes and joint households.",
    features: [
      "Everything in Pro",
      "Up to 8 household members",
      "Concierge advisor (priority queue)",
      "Quarterly household audit",
      "API access for custom dashboards",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

function Pricing() {
  return (
    <AppShell title="Household Advisor Pro" eyebrow="Plans">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <Crown className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Pro</span>
        </div>
        <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
          Smarter purchasing decisions, every week.
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Pro pays for itself within a single bill. We're not optimizing for the cheapest — we're
          optimizing for the right decision across price, quality, reviews, and timing.
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <article
            key={t.name}
            className={cn(
              "rounded-2xl border bg-surface p-6 lg:p-7 flex flex-col relative",
              t.highlight ? "border-foreground ring-1 ring-foreground" : "border-border",
            )}
          >
            {t.highlight && (
              <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold">
                <Sparkles className="h-3 w-3" />
                Most households
              </span>
            )}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t.name}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight font-mono">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground text-pretty">{t.description}</p>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check
                    className={
                      "h-4 w-4 mt-0.5 shrink-0 " +
                      (t.highlight ? "text-accent" : "text-muted-foreground")
                    }
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {t.cta === "Current plan" ? (
              <button
                disabled
                className="mt-7 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold opacity-60 cursor-not-allowed"
              >
                Current plan
              </button>
            ) : t.cta === "Talk to us" ? (
              <Link
                to="/feedback"
                className="mt-7 w-full inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
              >
                Talk to us
              </Link>
            ) : (
              <button
                disabled
                title="Coming soon"
                className={cn(
                  "mt-7 w-full rounded-lg px-4 py-2.5 text-sm font-semibold opacity-40 cursor-not-allowed",
                  t.highlight ? "bg-foreground text-background" : "border border-border",
                )}
              >
                {t.cta} · Coming soon
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          [
            "Not a comparison site",
            "We never push you to the cheapest. Quality, reviews and your household preferences carry equal weight.",
          ],
          [
            "Not a delivery app",
            "We don't sell groceries or take affiliate fees. Our only incentive is your trust.",
          ],
          [
            "Private by design",
            "Bills are parsed on-device when possible. We never resell your purchase history.",
          ],
        ].map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-6">
            <h4 className="font-semibold tracking-tight">{t}</h4>
            <p className="text-sm text-muted-foreground mt-2 text-pretty">{b}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
