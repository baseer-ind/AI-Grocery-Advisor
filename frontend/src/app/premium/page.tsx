"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { premiumFeatures } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { Crown, CheckCircle2 } from "lucide-react";

export default function Premium() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Crown className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">AI Household Advisor Pro</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Go beyond the basics — unlock the full power of your household&apos;s purchase intelligence.
        </p>
      </div>

      <Card className="mx-auto max-w-3xl border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:justify-between">
          <div>
            <div className="text-3xl font-semibold">
              {formatINR(149)}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Cancel anytime. No long-term commitment.</div>
          </div>
          <Button size="lg">Upgrade to Pro</Button>
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {premiumFeatures.map((feature) => (
          <Card key={feature.name}>
            <CardContent className="flex gap-3 pt-5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div>
                <div className="text-sm font-medium">{feature.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{feature.description}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
