"use client";

import { useState } from "react";
import { searchProducts } from "@/lib/api";
import { ProductSearchResult } from "@/types/search";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ListingTable } from "@/components/ListingTable";
import { Card } from "@/components/ui/card";

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string) {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchProducts(q);
      setResults(data);
    } catch {
      setError("Could not reach the search service. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">AI Grocery Advisor</h1>
      <p className="mt-1 text-gray-500">
        Not a price list — a decision. We factor in delivery fees, platform fees and handling
        charges to tell you the real cost.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search e.g. Aashirvaad Atta 5kg"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Compare
        </button>
      </form>

      {loading && <p className="mt-8 text-gray-500">Comparing platforms…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      {results && results.length === 0 && !loading && (
        <p className="mt-8 text-gray-500">No matching products found. Try “atta” or “butter”.</p>
      )}

      {results?.map((result) => (
        <Card key={result.product_id} className="mt-8 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{result.product_name}</h2>
            <span className="text-sm text-gray-500">
              {result.canonical_quantity}
              {result.canonical_unit} · {result.category}
            </span>
          </div>

          <div className="mt-4">
            <RecommendationPanel recommendations={result.recommendations} />
          </div>

          <div className="mt-6">
            <ListingTable listings={result.listings} />
          </div>
        </Card>
      ))}
    </div>
  );
}
