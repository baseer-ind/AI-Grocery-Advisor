import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, FileText, Leaf, Sparkles, Target, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journey")({
  head: () => ({ meta: [{ title: "Household Savings Journey — Household Advisor AI" }] }),
  component: Journey,
});

const cumulative = [
  { m: "Mar", saved: 320 },
  { m: "Apr", saved: 820 },
  { m: "May", saved: 1480 },
  { m: "Jun", saved: 2340 },
  { m: "Jul", saved: 3360 },
  { m: "Aug", saved: 4560 },
];

const milestones = [
  { d: "12 Mar", text: "First bill uploaded", done: true },
  { d: "01 Apr", text: "Switched cooking oil store · ₹220 saved", done: true },
  { d: "08 May", text: "Started Amul milk subscription · ₹100/mo", done: true },
  { d: "22 Jun", text: "Skipped duplicate oil purchase · ₹920 saved", done: true },
  { d: "09 Aug", text: "Brand swap on detergent · ₹80/mo", done: true },
  { d: "—", text: "Hit ₹6,000 annual savings", done: false },
];

function Journey() {
  return (
    <AppShell title="Household Savings Journey" eyebrow="Progress / Over time">
      <section className="grid grid-cols-12 gap-4">
        <Stat
          className="col-span-6 lg:col-span-3"
          icon={<FileText className="h-4 w-4" />}
          label="Bills uploaded"
          value="6"
        />
        <Stat
          className="col-span-6 lg:col-span-3"
          icon={<Target className="h-4 w-4" />}
          label="Savings identified"
          value="₹7,200"
        />
        <Stat
          className="col-span-6 lg:col-span-3"
          icon={<Wallet className="h-4 w-4" />}
          label="Savings achieved"
          value="₹4,560"
          accent
        />
        <Stat
          className="col-span-6 lg:col-span-3"
          icon={<Leaf className="h-4 w-4" />}
          label="Waste avoided"
          value="3.2 kg"
        />
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="font-semibold tracking-tight">Cumulative savings</h3>
            <p className="text-sm text-muted-foreground">Since your first uploaded bill</p>
          </div>
          <span className="rounded-md bg-accent/10 text-accent px-2 py-1 text-[11px] font-semibold uppercase font-mono tracking-wider">
            On pace · ₹14.4k/yr
          </span>
        </div>
        <div className="h-72 -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative}>
              <defs>
                <linearGradient id="jG" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="saved" stroke="var(--color-accent)" strokeWidth={2} fill="url(#jG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Milestones
            </span>
          </div>
          <ol className="space-y-3">
            {milestones.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                    m.done ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted-foreground border border-border",
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.text}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {m.d}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent mb-2">
            Products optimized
          </div>
          <div className="text-4xl font-semibold tracking-tight font-mono">18 / 42</div>
          <p className="text-sm text-muted-foreground mt-1">
            of your regularly purchased products now have a smarter recommendation in play.
          </p>
          <div className="mt-5 h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-accent" style={{ width: "42%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">42% optimized</p>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  className,
  icon,
  label,
  value,
  accent,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent ? "border-accent/40 bg-accent/10" : "border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight font-mono">{value}</div>
    </div>
  );
}
