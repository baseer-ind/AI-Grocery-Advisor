"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, ShoppingCart } from "lucide-react";
import { pantryNeedToBuy, pantryAvailable, smartReorderSuggestions } from "@/lib/mock-data";

export default function PantryAssistant() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Pantry Assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Know what you need before you shop — no more guessing or duplicate orders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Need To Buy</CardTitle>
            <CardDescription>Running low based on your household&apos;s usual pace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pantryNeedToBuy.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.reason}</div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-warning" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Already Available</CardTitle>
            <CardDescription>Estimated days of supply remaining</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pantryAvailable.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="text-sm font-medium">{item.name}</div>
                <Badge variant="success">{item.daysLeft} days left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Smart Reorder Suggestions</CardTitle>
          <CardDescription>Based on your household&apos;s historical purchase cadence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {smartReorderSuggestions.map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-8">
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">Usually purchased every</div>
                  <div className="text-sm">{item.usuallyPurchasedEvery}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last purchase</div>
                  <div className="text-sm">{item.lastPurchase}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={item.urgent ? "warning" : "muted"}>{item.recommendation}</Badge>
                {item.urgent && (
                  <Button size="sm" className="gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" /> Add To Next Basket
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6 border-dashed">
        <CardContent className="flex items-center gap-4 pt-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Camera className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Pantry Photo Recognition</div>
            <div className="text-xs text-muted-foreground">
              Snap a photo of your pantry shelf and we&apos;ll detect what&apos;s running low automatically.
            </div>
          </div>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </AppShell>
  );
}
