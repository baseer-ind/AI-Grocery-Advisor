import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  Sparkles,
  Home as HomeIcon,
  Crown,
  Menu,
  X,
  ListChecks,
  Heart,
  UserCircle2,
  ScanLine,
  TrendingDown,
  Repeat,
  ShoppingBasket,
  BookOpen,
  GraduationCap,
  Unlock,
} from "lucide-react";
import { FeedbackCta } from "./feedback-cta";
import { ThemeToggle } from "./theme-toggle";
import { AskAiWidget } from "./ask-ai-widget";
import { cn } from "@/lib/utils";
import { getHouseholdProfile, type StoredHouseholdProfile } from "@/lib/real-data";

const navGroups = [
  {
    label: "Your Household",
    items: [
      { to: "/today", label: "Home", icon: HomeIcon },
      { to: "/this-week", label: "Shopping List", icon: ListChecks },
      { to: "/knowledge", label: "Your Household", icon: BookOpen },
      { to: "/teach", label: "Teach Household Advisor", icon: GraduationCap },
      { to: "/unlocks", label: "Unlocks", icon: Unlock },
      { to: "/habits", label: "Shopping Habits", icon: Repeat },
      { to: "/products", label: "Frequently Purchased", icon: ShoppingBasket },
      { to: "/household", label: "Profile", icon: UserCircle2 },
    ],
  },
  {
    label: "Improve Your Recommendations",
    items: [
      { to: "/upload", label: "Add Shopping Event", icon: ScanLine },
      { to: "/bill-check", label: "Compare My Basket", icon: TrendingDown },
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

// Bottom nav is the primary nav on mobile. Bill upload/Bill Check are
// deliberately not here — they're a data source you reach from Home, not
// a destination households think in terms of.
const bottomNavItems = [
  { to: "/today", label: "Home", icon: HomeIcon },
  { to: "/this-week", label: "List", icon: ListChecks },
  { to: "/household", label: "Profile", icon: UserCircle2 },
] as const;

export function AppShell({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<StoredHouseholdProfile | null>(null);

  useEffect(() => {
    setProfile(getHouseholdProfile());
  }, []);

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
        {/* Sidebar (desktop nav) */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 z-30 h-screen w-72 shrink-0 border-r border-border bg-surface flex flex-col",
            "transition-transform duration-300 ease-in-out lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <Link
            to="/"
            className="hidden lg:flex items-center gap-2.5 px-6 h-16 border-b border-border"
          >
            <Logo />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-sm">Household Advisor</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                AI · v1.0
              </span>
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
            {profile ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                  {profile.city ? profile.city[0] : "H"}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{profile.householdType}</div>
                  <div className="text-xs text-muted-foreground">
                    {profile.size ? `${profile.size} members` : "Profile started"}
                    {profile.city ? ` · ${profile.city}` : ""}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/household"
                className="flex items-center gap-2 text-sm font-semibold hover:opacity-80"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                Build your household profile
              </Link>
            )}
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden animate-[entrance_0.2s_ease-out]"
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
            <ThemeToggle />
          </div>

          <div className="p-5 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
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

      {/* Mobile bottom nav — primary navigation on phones */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="grid grid-cols-3">
          {bottomNavItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <FeedbackCta />
      <AskAiWidget />
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
