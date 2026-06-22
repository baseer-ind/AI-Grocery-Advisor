import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  ShoppingBasket,
  PackageSearch,
  LineChart,
  BrainCircuit,
  MessageCircle,
  Store,
  Crown,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills/upload", label: "Upload Bill", icon: Receipt },
  { href: "/bills/analysis", label: "AI Analysis", icon: Sparkles },
  { href: "/basket", label: "Basket Optimization", icon: ShoppingBasket },
  { href: "/pantry", label: "Pantry Assistant", icon: PackageSearch },
  { href: "/products", label: "Product Intelligence", icon: LineChart },
  { href: "/household", label: "Household Intelligence", icon: BrainCircuit },
  { href: "/advisor", label: "AI Advisor", icon: MessageCircle },
  { href: "/stores", label: "Store Intelligence", icon: Store },
  { href: "/premium", label: "Premium", icon: Crown },
];
