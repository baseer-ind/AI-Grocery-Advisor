import { ListingResult } from "@/types/search";
import { Badge } from "@/components/ui/badge";

export function ListingTable({ listings }: { listings: ListingResult[] }) {
  const sorted = [...listings].sort((a, b) => a.effective_cost - b.effective_cost);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[800px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3">Platform</th>
            <th className="px-4 py-3">MRP</th>
            <th className="px-4 py-3">Selling Price</th>
            <th className="px-4 py-3">Delivery</th>
            <th className="px-4 py-3">Platform Fee</th>
            <th className="px-4 py-3">Handling</th>
            <th className="px-4 py-3">Effective Cost</th>
            <th className="px-4 py-3">Real Discount</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">ETA</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((listing, i) => (
            <tr key={listing.platform_slug} className="border-t border-gray-100">
              <td className="px-4 py-3 font-medium text-gray-900">
                {listing.platform}
                {i === 0 && (
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700">Cheapest</Badge>
                )}
                {!listing.in_stock && (
                  <Badge className="ml-2 bg-gray-200 text-gray-600">Out of stock</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400 line-through">₹{listing.mrp}</td>
              <td className="px-4 py-3">₹{listing.selling_price}</td>
              <td className="px-4 py-3">₹{listing.delivery_fee}</td>
              <td className="px-4 py-3">₹{listing.platform_fee}</td>
              <td className="px-4 py-3">₹{listing.handling_fee}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">₹{listing.effective_cost}</td>
              <td className="px-4 py-3 text-emerald-700">{listing.real_discount_pct}%</td>
              <td className="px-4 py-3">
                {listing.product_rating}★ <span className="text-gray-400">/ {listing.delivery_rating}★ delivery</span>
              </td>
              <td className="px-4 py-3">{listing.eta_minutes} min</td>
              <td className="px-4 py-3">
                <a
                  href={listing.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Buy →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
