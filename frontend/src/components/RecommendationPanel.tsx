import { RecommendationSetOut } from "@/types/search";
import { Card } from "@/components/ui/card";

const ORDER: { key: keyof RecommendationSetOut; emoji: string; accent: string }[] = [
  { key: "best_overall", emoji: "🏆", accent: "border-amber-300 bg-amber-50" },
  { key: "cheapest", emoji: "💰", accent: "border-emerald-300 bg-emerald-50" },
  { key: "fastest", emoji: "⚡", accent: "border-blue-300 bg-blue-50" },
  { key: "highest_rated", emoji: "⭐", accent: "border-purple-300 bg-purple-50" },
  { key: "best_value", emoji: "🎯", accent: "border-rose-300 bg-rose-50" },
];

export function RecommendationPanel({ recommendations }: { recommendations: RecommendationSetOut }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ORDER.map(({ key, emoji, accent }) => {
        const rec = recommendations[key];
        return (
          <Card key={key} className={`p-4 border-2 ${accent}`}>
            <div className="text-sm font-semibold text-gray-700">
              {emoji} {rec.label}
            </div>
            <div className="mt-1 text-lg font-bold text-gray-900">{rec.platform_name}</div>
            <div className="text-sm text-gray-600">₹{rec.effective_cost}</div>
            <p className="mt-2 text-xs leading-snug text-gray-600">{rec.reason}</p>
          </Card>
        );
      })}
    </div>
  );
}
