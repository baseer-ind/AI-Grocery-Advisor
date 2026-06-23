import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { AppShell } from "@/components/app-shell";
import { categories, monthlyTrend, topProducts } from "@/lib/sample-data";

export const Route = createFileRoute("/household")({
  head: () => ({ meta: [{ title: "Household Intelligence — Household Advisor AI" }] }),
  component: HouseholdIntel,
});

const brandLoyalty = [
  { brand: "Amul", share: 92 },
  { brand: "Aashirvaad", share: 78 },
  { brand: "Fortune", share: 71 },
  { brand: "Surf Excel", share: 64 },
  { brand: "Maggi", share: 58 },
];

function HouseholdIntel() {
  return (
    <AppShell title="Household Intelligence" eyebrow="Insights">
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8" title="Monthly spending trend" subtitle="6 months · vs. AI-optimized">
          <div className="h-64 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="spend" stroke="var(--color-foreground)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="optimized" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4" title="Family consumption" subtitle="Per-person estimates this month">
          <ul className="space-y-3 text-sm">
            {[
              ["Atta", "1.6 kg / person"],
              ["Milk", "7.0 L / person"],
              ["Cooking oil", "0.8 L / person · ↑ above avg"],
              ["Rice", "1.2 kg / person"],
              ["Snacks", "₹510 / person · ↑ heavy"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="col-span-12 lg:col-span-6" title="Category analysis" subtitle="Where your money goes">
          <div className="h-56 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip cursor={{ fill: "var(--color-surface-2)" }} contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6" title="Brand loyalty" subtitle="How often you repeat-buy the same brand">
          <ul className="space-y-3 mt-1">
            {brandLoyalty.map((b) => (
              <li key={b.brand}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{b.brand}</span>
                  <span className="font-mono text-muted-foreground">{b.share}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${b.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="col-span-12 lg:col-span-7" title="Top purchased products" subtitle="By frequency this quarter">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest font-mono text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium text-right">Purchased</th>
                <th className="py-2 font-medium text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3 text-right text-muted-foreground">{p.purchased}×</td>
                  <td className="py-3 text-right font-mono font-medium">₹{p.spend.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="col-span-12 lg:col-span-5" title="Savings opportunities" subtitle="Ranked by household impact">
          <ul className="space-y-3 text-sm">
            {[
              ["Re-time snack run", 320],
              ["Switch rice store", 280],
              ["Skip oil next month", 280],
              ["Subscribe to milk", 220],
              ["Bulk atta every 2 months", 180],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span>{k as string}</span>
                <span className="font-mono font-semibold text-accent">−₹{v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={"rounded-2xl border border-border bg-surface p-6 " + (className ?? "")}>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
