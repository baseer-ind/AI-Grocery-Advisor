"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardValue, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR, cn } from "@/lib/utils";
import { aiAnalysis } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";

const toneStyles: Record<string, { icon: React.ElementType; className: string }> = {
  warning: { icon: AlertTriangle, className: "text-warning bg-warning/10" },
  danger: { icon: TrendingDown, className: "text-danger bg-danger/10" },
  success: { icon: CheckCircle2, className: "text-success bg-success/10" },
};

export default function AIAnalysis() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">AI Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what we found in your latest bill — and how to spend smarter next time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{formatINR(aiAnalysis.currentSpend)}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Optimized Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue className="text-success">{formatINR(aiAnalysis.optimizedSpend)}</CardValue>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue className="text-primary">{formatINR(aiAnalysis.potentialSavings)}</CardValue>
            <CardDescription className="mt-1">13% of your current spend</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">AI Insights</CardTitle>
            <CardDescription>Plain-English findings from this bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiAnalysis.insights.map((insight) => {
              const tone = toneStyles[insight.tone];
              const Icon = tone.icon;
              return (
                <div key={insight.title} className="flex gap-3 rounded-xl border border-border p-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tone.className)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{insight.title}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{insight.detail}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Spending by Category</CardTitle>
            <CardDescription>This bill</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiAnalysis.categoryBreakdown} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={90} />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/basket">
          <Button size="lg" className="gap-2">
            See Basket Optimization <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
