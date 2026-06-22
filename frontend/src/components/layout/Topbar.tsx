"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { navItems } from "./nav-items";

export function Topbar() {
  const pathname = usePathname();
  const current = navItems.find((item) => pathname?.startsWith(item.href));

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 hover:bg-muted md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold md:text-lg">{current?.label ?? "Household Advisor"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <div className="font-medium text-foreground">Priya S.</div>
          <div>Household Score: 78</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          PS
        </div>
      </div>
    </header>
  );
}
