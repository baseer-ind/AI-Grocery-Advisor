"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, cn } from "@/lib/utils";
import { onlineStores, localStores } from "@/lib/mock-data";
import { Star, MapPin, Globe } from "lucide-react";

const confidenceVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  Verified: "success",
  High: "success",
  Medium: "warning",
  Low: "danger",
};

function StoreRow({
  name,
  price,
  confidence,
  rating,
  recommendation,
  distanceKm,
}: {
  name: string;
  price: number;
  confidence: string;
  rating: number;
  recommendation: string;
  distanceKm?: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" /> {rating}
          </span>
          {distanceKm !== undefined && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {distanceKm} km
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-semibold">{formatINR(price)}</div>
          <div className="text-xs text-muted-foreground">{recommendation}</div>
        </div>
        <Badge variant={confidenceVariant[confidence] ?? "default"}>{confidence}</Badge>
      </div>
    </div>
  );
}

export default function LocalStoreIntelligence() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Local Store Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comparing Fortune Sunflower Oil 5L across the stores your household actually has access to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold text-foreground">Online Stores</CardTitle>
            </div>
            <CardDescription>Prices verified within the last hour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {onlineStores.map((store) => (
              <StoreRow key={store.name} {...store} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold text-foreground">Local Stores</CardTitle>
            </div>
            <CardDescription>Crowdsourced from nearby household reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {localStores.map((store) => (
              <StoreRow key={store.name} {...store} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className={cn("mt-6 border-dashed")}>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Local store prices are crowdsourced from nearby households and carry a confidence score based on how many
          recent, consistent observations we have. Always treat &quot;Low&quot; confidence prices as a guide, not a guarantee.
        </CardContent>
      </Card>
    </AppShell>
  );
}
