import { ProductSearchResult } from "@/types/search";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  return res.json();
}
