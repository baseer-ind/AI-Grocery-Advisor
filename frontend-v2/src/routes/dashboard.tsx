import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp, Users, Wallet, Target, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { categories, household, metrics, monthlyTrend } from "@/lib/sample-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Household Dashboard — Household Advisor AI" }] }),
  component: Dashboard,
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Dashboard() {
  const savingsPct = Math.round((metrics.potentialSavings / metrics.currentSpend) * 100);

  return (
    <AppShell title={`Welcome back, ${household.name}.`} eyebrow="Household / Overview">
      {/* Profile + KPIs */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Household Profile
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-semibold">
              B
            </div>
            <div>
              <div className="font-semibold">Baseer's Home</div>
              <div className="text-xs text-muted-foreground">Hyderabad · Active 6 months</div>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <ProfileRow icon={Users} label="Family size" value={household.familySize} />
            <ProfileRow icon={Wallet} label="Budget" value={household.monthlyBudget} />
            <ProfileRow icon={ShoppingBag} label="Shopping style" value={household.shoppingStyle} />
            <ProfileRow icon={Target} label="Primary goal" value={household.primaryGoal} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {household.memberships.map((m) => (
              <span
                key={m}
                className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="Current Spend" value={fmt(metrics.currentSpend)} delta={`-₹${metrics.lastMonthSpend - metrics.currentSpend} vs last month`} good />
          <KPI label="Optimized Spend" value={fmt(metrics.optimizedSpend)} delta="With recommended swaps" />
          <KPI
            label="Potential Savings"
            value={fmt(metrics.potentialSavings)}
            delta={`${savingsPct}% smarter`}
            highlight
          />
          <KPI label="Household Score" value={`${household.score}/100`} delta="Top 12% of similar homes" good />
        </div>
      </section>

      {/* Charts */}
      <section className="mt-5 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-semibold tracking-tight">Spend vs. AI-Optimized</h3>
              <p className="text-sm text-muted-foreground">Last 6 months — same basket quality, smarter decisions.</p>
            </div>
            <span className="rounded-md bg-accent/10 text-accent px-2 py-1 text-[11px] font-semibold uppercase font-mono tracking-wider">
              Saved ₹6.4k
            </span>
          </div>
          <div className="h-72 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="optG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="spend" stroke="var(--color-foreground)" strokeWidth={2} fill="url(#spendG)" />
                <Area type="monotone" dataKey="optimized" stroke="var(--color-accent)" strokeWidth={2} fill="url(#optG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold tracking-tight">Category mix</h3>
          <p className="text-sm text-muted-foreground">This month — 6 categories tracked</p>
          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                  {categories.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip suffix="" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 mt-2">
            {categories.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono font-medium">{fmt(c.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <ActionCard
          to="/upload"
          icon={<Sparkles className="h-4 w-4" />}
          eyebrow="Start here"
          title="Upload this month's bill"
          body="We'll extract products, categorize spend, and surface the 3 biggest savings instantly."
        />
        <ActionCard
          to="/basket"
          icon={<TrendingDown className="h-4 w-4" />}
          eyebrow="Optimize"
          title="See your basket alternatives"
          body="Same products, smarter stores, or similar-brand swaps — you choose the tradeoff."
        />
        <ActionCard
          to="/advisor"
          icon={<TrendingUp className="h-4 w-4" />}
          eyebrow="Ask"
          title="Talk to your AI advisor"
          body="Honest answers on buy-vs-wait, brand switches, and where your money is going."
        />
      </section>
    </AppShell>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, good, highlight }: { label: string; value: string; delta: string; good?: boolean; highlight?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-5 " +
        (highlight ? "border-accent/40 bg-accent/10" : "border-border bg-surface")
      }
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight font-mono">{value}</div>
      <div className={"mt-1 text-xs font-medium " + (good ? "text-accent" : "text-muted-foreground")}>{delta}</div>
    </div>
  );
}

function ActionCard({ to, icon, eyebrow, title, body }: { to: string; icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-surface p-6 hover:border-foreground/30 transition-all block">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
          {icon}
          {eyebrow}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <h4 className="font-semibold tracking-tight">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1 text-pretty">{body}</p>
    </Link>
  );
}

function ChartTip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      {label && <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto font-mono font-medium">₹{p.value?.toLocaleString("en-IN")}{suffix}</span>
        </div>
      ))}
    </div>
  );
}
