"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardValue, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { dashboardSummary, householdProfile, monthlySpendTrend, categoryDistribution } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingDown, Wallet, Sparkles, Gauge } from "lucide-react";

export default function Dashboard() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back, Priya</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s how your household is doing this month.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Current Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{formatINR(dashboardSummary.currentSpend)}</CardValue>
            <CardDescription className="mt-1">This month, across all stores</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Optimized Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue className="text-success">{formatINR(dashboardSummary.optimizedSpend)}</CardValue>
            <CardDescription className="mt-1">If you followed our recommendations</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Potential Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue className="text-primary">{formatINR(dashboardSummary.potentialSavings)}</CardValue>
            <CardDescription className="mt-1">13% below your current spend</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Household Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{dashboardSummary.householdScore}/100</CardValue>
            <CardDescription className="mt-1">Better than 64% of similar households</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Spend vs. Optimized Spend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendTrend}>
                <defs>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="optimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} width={40} />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Area type="monotone" dataKey="spend" stroke="#4f46e5" fill="url(#spend)" strokeWidth={2} name="Actual Spend" />
                <Area type="monotone" dataKey="optimized" stroke="#16a34a" fill="url(#optimized)" strokeWidth={2} name="Optimized Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Category Distribution</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categoryDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Your Household Profile</CardTitle>
          <CardDescription>From your Household Discovery onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ProfileStat label="Family Size" value={householdProfile.size} />
            <ProfileStat label="Budget" value={householdProfile.budget} />
            <ProfileStat label="Shopping Style" value={householdProfile.shoppingStyle} />
            <ProfileStat label="Brand Flexibility" value={householdProfile.brandFlexibility} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {householdProfile.topPriorities.map((priority) => (
              <Badge key={priority}>{priority}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
