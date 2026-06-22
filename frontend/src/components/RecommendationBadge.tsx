import { Badge } from "@/components/ui/badge";

const config = {
  BUY_NOW: { label: "BUY NOW", variant: "success" as const },
  WAIT: { label: "WAIT", variant: "warning" as const },
  GOOD_VALUE: { label: "GOOD VALUE", variant: "default" as const },
};

export function RecommendationBadge({ recommendation }: { recommendation: keyof typeof config }) {
  const { label, variant } = config[recommendation];
  return <Badge variant={variant}>{label}</Badge>;
}
