"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, cn } from "@/lib/utils";
import { basketOptions } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

export default function BasketOptimization() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Basket Optimization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Three ways to buy the same basket — pick the balance of price, effort, and quality that fits you.
        </p>
      </div>

      <Card className="mb-6 bg-muted/40">
        <CardContent className="flex items-center justify-between pt-5">
          <div>
            <CardDescription>Current Basket</CardDescription>
            <div className="mt-1 text-2xl font-semibold">{formatINR(basketOptions.current.total)}</div>
          </div>
          <Badge variant="muted">Baseline</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {basketOptions.options.map((option, index) => (
          <Card
            key={option.id}
            className={cn(
              "relative flex flex-col",
              option.recommended && "border-primary shadow-md ring-1 ring-primary/30"
            )}
          >
            {option.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1 bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-3 w-3" /> Recommended
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Option {index + 1}</CardTitle>
              <div className="text-lg font-semibold text-foreground">{option.label}</div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="text-3xl font-semibold">{formatINR(option.total)}</div>
              <div
                className={cn(
                  "mt-1 text-xs font-medium",
                  option.total < basketOptions.current.total ? "text-success" : "text-muted-foreground"
                )}
              >
                {formatINR(basketOptions.current.total - option.total)} less than current
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{option.description}</p>

              <div className="mt-4 flex-1 space-y-2">
                {option.tradeoffs.map((tradeoff) => (
                  <div key={tradeoff} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {tradeoff}
                  </div>
                ))}
              </div>

              <Button className="mt-5 w-full" variant={option.recommended ? "default" : "outline"}>
                Choose this basket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
