"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  "Save Money",
  "Get Best Value",
  "Buy Better Quality Products",
  "Reduce Grocery Waste",
  "Improve Family Health",
  "Compare Stores",
  "Optimize Monthly Spending",
  "Save Time",
  "Track Household Consumption",
];

const HOUSEHOLD_SIZES = ["1", "2", "3-4", "5-6", "7+"];

const BUDGETS = ["Under ₹5,000", "₹5,000–10,000", "₹10,000–15,000", "₹15,000–25,000", "₹25,000+"];

const SHOPPING_PREFS = ["Mostly Online", "Mostly Local Stores", "Mix of Both"];

const FACTORS = ["Price", "Quality", "Reviews", "Brand", "Delivery Speed", "Offers"];

const BRAND_FLEXIBILITY = ["Never Switch", "Switch if Similar", "Very Flexible"];

const MEMBERSHIPS = ["Amazon Prime", "Swiggy One", "Zepto Pass", "BigBasket Membership"];

const TOTAL_STEPS = 8;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [priorities, setPriorities] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState("3-4");
  const [budget, setBudget] = useState("₹10,000–15,000");
  const [shoppingPref, setShoppingPref] = useState("Mix of Both");
  const [factorRanking, setFactorRanking] = useState<string[]>(FACTORS);
  const [brandFlexibility, setBrandFlexibility] = useState("Switch if Similar");
  const [memberships, setMemberships] = useState<string[]>([]);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  function togglePriority(option: string) {
    setPriorities((prev) => {
      if (prev.includes(option)) return prev.filter((p) => p !== option);
      if (prev.length >= 3) return prev;
      return [...prev, option];
    });
  }

  function toggleMembership(option: string) {
    setMemberships((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    );
  }

  function moveFactor(index: number, direction: -1 | 1) {
    setFactorRanking((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function back() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Household Discovery</span>
        </div>

        <Progress value={progress} className="mb-1" />
        <div className="mb-8 text-xs text-muted-foreground">
          Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}
        </div>

        <Card>
          <CardContent className="pt-6">
            {step === 1 && (
              <StepShell
                title="Why are you here?"
                subtitle="Select up to 3 priorities. The order matters — pick your most important one first."
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PRIORITY_OPTIONS.map((option) => {
                    const selectedIndex = priorities.indexOf(option);
                    const selected = selectedIndex !== -1;
                    return (
                      <button
                        key={option}
                        onClick={() => togglePriority(option)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {option}
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                            {selectedIndex + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Household Size" subtitle="How many people are you shopping for?">
                <OptionGrid options={HOUSEHOLD_SIZES} selected={householdSize} onSelect={setHouseholdSize} />
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="Monthly Grocery Budget" subtitle="A rough range is fine — you can refine this later.">
                <OptionGrid options={BUDGETS} selected={budget} onSelect={setBudget} columns={1} />
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Shopping Preference" subtitle="Where do you usually buy groceries?">
                <OptionGrid options={SHOPPING_PREFS} selected={shoppingPref} onSelect={setShoppingPref} columns={1} />
              </StepShell>
            )}

            {step === 5 && (
              <StepShell title="Rank what matters most" subtitle="Use the arrows to reorder — top of the list matters most.">
                <div className="space-y-2">
                  {factorRanking.map((factor, index) => (
                    <div
                      key={factor}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{factor}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveFactor(index, -1)}
                          disabled={index === 0}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          aria-label={`Move ${factor} up`}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveFactor(index, 1)}
                          disabled={index === factorRanking.length - 1}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          aria-label={`Move ${factor} down`}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell title="Brand Flexibility" subtitle="How willing are you to switch brands for a better deal?">
                <OptionGrid options={BRAND_FLEXIBILITY} selected={brandFlexibility} onSelect={setBrandFlexibility} columns={1} />
              </StepShell>
            )}

            {step === 7 && (
              <StepShell title="Memberships" subtitle="Select any memberships your household already has.">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MEMBERSHIPS.map((option) => {
                    const selected = memberships.includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => toggleMembership(option)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                          selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                        )}
                      >
                        {option}
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </StepShell>
            )}

            {step === 8 && (
              <StepShell title="Your Household Profile" subtitle="Here's what we'll use to personalize every recommendation.">
                <div className="space-y-4">
                  <SummaryRow label="Top priorities" value={priorities.length ? priorities.join(", ") : "Not selected"} />
                  <SummaryRow label="Household size" value={householdSize} />
                  <SummaryRow label="Monthly budget" value={budget} />
                  <SummaryRow label="Shopping style" value={shoppingPref} />
                  <SummaryRow label="What matters most" value={factorRanking.slice(0, 3).join(" > ")} />
                  <SummaryRow label="Brand flexibility" value={brandFlexibility} />
                  <SummaryRow label="Memberships" value={memberships.length ? memberships.join(", ") : "None"} />
                </div>
              </StepShell>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={step === 1} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={next} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => router.push("/dashboard")} className="gap-2">
                  Go to my dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Skip onboarding and explore the demo
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
  columns = 2,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-1")}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
            selected === option ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
