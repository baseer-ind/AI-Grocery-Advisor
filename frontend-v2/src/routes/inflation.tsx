import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inflation")({
  head: () => ({ meta: [{ title: "Grocery Inflation — Household Advisor AI" }] }),
  component: Inflation,
});

const cats = [
  { name: "Oil", pct: -3.2, abs: -40 },
  { name: "Rice", pct: 4.8, abs: 35 },
  { name: "Milk", pct: 1.4, abs: 25 },
  { name: "Vegetables", pct: 6.7, abs: 92 },
  { name: "Pulses", pct: 2.1, abs: 18 },
  { name: "Snacks", pct: 0.6, abs: 12 },
];

const trend = [
  { m: "Mar", overall: 1.2, household: 1.0 },
  { m: "Apr", overall: 1.8, household: 1.4 },
  { m: "May", overall: 2.4, household: 2.0 },
  { m: "Jun", overall: 3.1, household: 2.7 },
  { m: "Jul", overall: 3.5, household: 3.2 },
  { m: "Aug", overall: 3.8, household: 3.5 },
];

function Inflation() {
  return (
    <AppShell title="Grocery Inflation" eyebrow="Macro / Last 6 months">
      <section className="grid grid-cols-12 gap-4">
        <Hero
          className="col-span-12 lg:col-span-5"
          icon={<Flame className="h-5 w-5 text-warning-foreground" />}
          eyebrow="Household impact this month"
          value="+₹180"
          sub="Versus your 6-month baseline basket"
        />
        <Hero
          className="col-span-6 lg:col-span-4"
          eyebrow="Your basket inflation"
          value="+3.5%"
          sub="Last 6 months · annualized"
        />
        <Hero
          className="col-span-6 lg:col-span-3"
          eyebrow="City average"
          value="+3.8%"
          sub="Hyderabad · same basket"
        />
      </section>

      <section className="mt-5 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">Inflation by category</h3>
          <p className="text-sm text-muted-foreground">Month-on-month change</p>
          <div className="h-64 mt-4 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, "MoM"]}
                />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">Your basket vs. city</h3>
          <p className="text-sm text-muted-foreground">Cumulative inflation, 6 months</p>
          <div className="h-64 mt-4 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="overall" stroke="var(--color-foreground)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="household" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-surface p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Category detail
        </div>
        <ul className="divide-y divide-border">
          {cats.map((c) => (
            <li key={c.name} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  Net change this month: <span className="font-mono">₹{c.abs > 0 ? "+" : ""}{c.abs}</span>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-sm font-semibold",
                  c.pct > 0 ? "bg-warning/15 text-warning-foreground" : "bg-accent/10 text-accent",
                )}
              >
                {c.pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {c.pct > 0 ? "+" : ""}
                {c.pct}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Hero({
  className,
  icon,
  eyebrow,
  value,
  sub,
}: {
  className?: string;
  icon?: React.ReactNode;
  eyebrow: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight font-mono">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
