import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Upload,
  Sparkles,
  ShoppingBasket,
  MessagesSquare,
  Boxes,
  Home,
  Store,
  Crown,
  Menu,
  X,
  Refrigerator,
  ListChecks,
  Compass,
  Bell,
  Flame,
  Calendar,
  TrendingUp,
  Gauge,
  Heart,
} from "lucide-react";
import { FeedbackCta } from "./feedback-cta";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Get Started",
    items: [
      { to: "/command", label: "Command Center", icon: Gauge },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/discovery", label: "Household Discovery", icon: Compass },
    ],
  },
  {
    label: "Shopping",
    items: [
      { to: "/upload", label: "Upload Bill", icon: Upload },
      { to: "/analysis", label: "AI Analysis", icon: Sparkles },
      { to: "/basket", label: "Basket Optimization", icon: ShoppingBasket },
      { to: "/pantry", label: "Pantry Assistant", icon: Refrigerator },
      { to: "/list", label: "Smart Shopping List", icon: ListChecks },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/advisor", label: "AI Advisor", icon: MessagesSquare },
      { to: "/products", label: "Product Intelligence", icon: Boxes },
      { to: "/household", label: "Household Intelligence", icon: Home },
      { to: "/stores", label: "Store Intelligence", icon: Store },
      { to: "/inflation", label: "Grocery Inflation", icon: Flame },
    ],
  },
  {
    label: "Planning",
    items: [
      { to: "/calendar", label: "Household Calendar", icon: Calendar },
      { to: "/alerts", label: "Price Alerts", icon: Bell },
      { to: "/journey", label: "Savings Journey", icon: TrendingUp },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/pricing", label: "Pro", icon: Crown },
      { to: "/feedback", label: "Help Us Build", icon: Heart },
    ],
  },
] as const;

export function AppShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold tracking-tight">Household Advisor</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 z-30 h-screen w-72 shrink-0 border-r border-border bg-surface flex flex-col",
            "transition-transform lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <Link to="/" className="hidden lg:flex items-center gap-2.5 px-6 h-16 border-b border-border">
            <Logo />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-sm">Household Advisor</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI · v1.0</span>
            </div>
          </Link>
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="m-3 rounded-xl border border-border bg-surface-2 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Household
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                B
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Baseer's Home</div>
                <div className="text-xs text-muted-foreground">4 members · Hyderabad</div>
              </div>
            </div>
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-8">
            <div>
              {eyebrow && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-medium hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                Upload Bill
              </Link>
            </div>
          </div>

          <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
            <div className="lg:hidden mb-6">
              {eyebrow && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
      <FeedbackCta />
    </div>
  );
}

function Logo() {
  return (
    <div className="relative h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
      <div className="h-2.5 w-2.5 rounded-sm bg-background rotate-45" />
      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}
