"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { formatINR, cn } from "@/lib/utils";
import { productCatalog } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ProductIntelligence() {
  const [activeIndex, setActiveIndex] = useState(0);
  const product = productCatalog[activeIndex];

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Product Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real price history for the products you buy — so you know whether to buy now or wait.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {productCatalog.map((p, index) => (
          <button
            key={p.name}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              index === activeIndex ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">{product.name}</CardTitle>
              <CardDescription>90-day price intelligence</CardDescription>
            </div>
            <RecommendationBadge recommendation={product.recommendation} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Current Price" value={formatINR(product.currentPrice)} />
            <Stat label="Average Price" value={formatINR(product.averagePrice)} />
            <Stat label="Lowest Price" value={formatINR(product.lowestPrice)} highlight="success" />
            <Stat label="Highest Price" value={formatINR(product.highestPrice)} highlight="danger" />
          </div>

          <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm">{product.recommendationReason}</div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={product.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} width={50} domain={["dataMin - 50", "dataMax + 50"]} />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: "success" | "danger" }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-lg font-semibold",
          highlight === "success" && "text-success",
          highlight === "danger" && "text-danger"
        )}
      >
        {value}
      </div>
    </div>
  );
}
