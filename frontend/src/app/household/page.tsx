"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardValue, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { householdIntelligence } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { HeartPulse } from "lucide-react";

export default function HouseholdIntelligence() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Household Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Understand how your household actually spends — not just what it spends.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Monthly Spending Trends</CardTitle>
            <CardDescription>Actual vs. optimized spend over time</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={householdIntelligence.monthlyTrend}>
                <defs>
                  <linearGradient id="hSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} width={50} />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Area type="monotone" dataKey="spend" stroke="#4f46e5" fill="url(#hSpend)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="optimized" stroke="#16a34a" fill="url(#hOptimized)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Category Distribution</CardTitle>
            <CardDescription>Where your household&apos;s money goes</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={householdIntelligence.categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {householdIntelligence.categoryDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Top Purchased Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {householdIntelligence.topCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <span>{cat.name}</span>
                <span className="font-medium">{cat.share}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Brand Loyalty Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {householdIntelligence.brandLoyalty.map((b) => (
              <div key={b.brand} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{b.brand}</div>
                  <div className="text-xs text-muted-foreground">{b.category}</div>
                </div>
                <Badge variant={b.loyaltyScore > 80 ? "success" : b.loyaltyScore > 65 ? "default" : "muted"}>
                  {b.loyaltyScore}% loyal
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue className="text-primary">{formatINR(householdIntelligence.potentialSavings)}</CardValue>
            <CardDescription className="mt-1">Identified from this month&apos;s spending pattern</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold text-foreground">Healthy Spending Insights</CardTitle>
          </div>
          <CardDescription>
            Patterns in what your household buys, for awareness only — this is not medical or dietary advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {householdIntelligence.healthySpendingInsights.map((insight) => (
            <div key={insight} className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
              {insight}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
