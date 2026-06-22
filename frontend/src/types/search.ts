export interface ListingResult {
  platform: string;
  platform_slug: string;
  mrp: number;
  selling_price: number;
  delivery_fee: number;
  platform_fee: number;
  handling_fee: number;
  effective_cost: number;
  platform_discount_pct: number;
  real_discount_pct: number;
  product_rating: number;
  delivery_rating: number;
  eta_minutes: number;
  in_stock: boolean;
  product_url: string;
}

export interface RecommendationOut {
  label: string;
  platform_name: string;
  effective_cost: number;
  reason: string;
}

export interface RecommendationSetOut {
  best_overall: RecommendationOut;
  cheapest: RecommendationOut;
  fastest: RecommendationOut;
  highest_rated: RecommendationOut;
  best_value: RecommendationOut;
}

export interface ProductSearchResult {
  product_id: number;
  product_name: string;
  brand: string;
  category: string;
  canonical_quantity: number;
  canonical_unit: string;
  listings: ListingResult[];
  recommendations: RecommendationSetOut;
}
