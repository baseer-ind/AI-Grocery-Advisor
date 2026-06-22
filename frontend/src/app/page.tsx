import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Sparkles,
    title: "Right Product",
    description: "Balances price with quality, ratings, and reviews — never just the cheapest option.",
  },
  {
    icon: ShieldCheck,
    title: "Right Place",
    description: "Compares verified platform prices and confidence-scored local kirana prices, honestly.",
  },
  {
    icon: Clock,
    title: "Right Time",
    description: "Knows whether to buy now or wait, based on real price history — not guesswork.",
  },
  {
    icon: TrendingUp,
    title: "Right Price",
    description: "Optimizes your whole basket across stores, not one item at a time.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Household Advisor</span>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Skip to demo dashboard
          </Button>
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center md:pt-24">
        <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Not a price comparison tool — an AI Household Purchase Advisor
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Help your household buy
          <br />
          <span className="text-primary">better</span>, not just cheaper.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          The right product, from the right place, at the right time, for the right price —
          based on your household&apos;s actual buying pattern, not a generic price table.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/onboarding">
            <Button size="lg" className="gap-2">
              Build my household profile <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Explore the demo
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent className="pt-5">
                <pillar.icon className="mb-3 h-5 w-5 text-primary" />
                <div className="font-medium">{pillar.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
