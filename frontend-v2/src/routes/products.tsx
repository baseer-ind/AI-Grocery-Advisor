import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/product-catalog";
import { getFrequentProducts, saveFrequentProducts, type FrequentProduct } from "@/lib/real-data";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Frequently Purchased Products — Household Advisor AI" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [selected, setSelected] = useState<FrequentProduct[]>(() => getFrequentProducts());
  const [customInput, setCustomInput] = useState("");
  const [saved, setSaved] = useState(false);

  function isSelected(name: string) {
    return selected.some((p) => p.name === name);
  }

  function toggle(name: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.some((p) => p.name === name) ? prev.filter((p) => p.name !== name) : [...prev, { name }],
    );
  }

  function setBrand(name: string, preferredBrand: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.map((p) =>
        p.name === name ? { ...p, preferredBrand: preferredBrand || undefined } : p,
      ),
    );
  }

  function addCustom() {
    const name = customInput.trim();
    if (!name || isSelected(name)) return;
    setSaved(false);
    setSelected((prev) => [...prev, { name }]);
    setCustomInput("");
  }

  function handleSave() {
    saveFrequentProducts(selected);
    setSaved(true);
  }

  return (
    <AppShell title="Frequently Purchased Products" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h1 className="text-lg font-semibold tracking-tight">What do you usually buy?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap everything your household regularly buys. Optionally tell us your preferred brand
            for each — this builds your Household DNA and helps personalize recommendations before
            you've ever uploaded a bill.
          </p>
        </div>

        {PRODUCT_CATEGORIES.map(({ category, products }) => (
          <section key={category} className="rounded-xl border border-border bg-surface p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {category}
            </div>
            <div className="flex flex-wrap gap-2">
              {products.map((name) => {
                const active = isSelected(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface hover:bg-surface-2",
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {name}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Add your own
          </div>
          <div className="flex items-center gap-2">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="e.g. Coconut Oil"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={addCustom}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </section>

        {selected.length > 0 && (
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Your selections ({selected.length}) — optional preferred brand
            </div>
            <div className="space-y-2">
              {selected.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(p.name)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  <input
                    value={p.preferredBrand ?? ""}
                    onChange={(e) => setBrand(p.name, e.target.value)}
                    placeholder="Preferred brand (optional)"
                    className="w-48 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={selected.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Save my selections
          </button>
          {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
        </div>

        <Link
          to="/knowledge"
          className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
        >
          Back to Your Household <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </AppShell>
  );
}
