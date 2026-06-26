import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { submitFeedback, type FeedbackPayload } from "@/lib/feedbackService";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Help Us Build — Household Advisor AI" }] }),
  component: Feedback,
});

type StepDef =
  | { key: string; title: string; sub?: string; type: "single" | "multi"; options: string[] }
  | { key: string; title: string; sub?: string; type: "text"; placeholder: string };

const sections: StepDef[] = [
  {
    key: "rating",
    title: "After exploring the product, what's your overall impression?",
    sub: "Be honest — even a low rating helps us.",
    type: "single",
    options: [
      "⭐⭐⭐⭐⭐  Excellent",
      "⭐⭐⭐⭐  Good",
      "⭐⭐⭐  Average",
      "⭐⭐  Needs Improvement",
      "⭐  Not Useful",
    ],
  },
  {
    key: "wouldUse",
    title: "Would you actually use Household Advisor?",
    type: "single",
    options: ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"],
  },
  {
    key: "valuable",
    title: "Which features are most valuable to you?",
    sub: "Pick as many as you like.",
    type: "multi",
    options: [
      "Bill Analysis",
      "Savings Recommendations",
      "Store Comparison",
      "Store Recommendations",
      "Product Alternatives",
      "Buy Now vs Wait",
      "Pantry Assistant",
      "Smart Shopping List",
      "Price Alerts",
      "AI Household Advisor",
      "Household Dashboard",
      "Household Intelligence",
      "Healthy Spending Insights",
      "Community Pricing",
      "Kirana Store Comparison",
      "Other",
    ],
  },
  {
    key: "when",
    title: "When would you most likely use this app?",
    type: "multi",
    options: [
      "Before Shopping",
      "During Shopping",
      "After Shopping",
      "Weekly Planning",
      "Monthly Budget Review",
      "When Prices Change",
      "When Products Run Low",
      "Only Occasionally",
    ],
  },
  {
    key: "problem",
    title: "What grocery shopping problem do you struggle with most?",
    type: "single",
    options: [
      "I Overspend",
      "I Don't Know Where To Buy",
      "Prices Keep Changing",
      "I Forget What I Need",
      "I Buy Things I Already Have",
      "I Waste Food",
      "Too Many Apps",
      "Hard To Find Good Deals",
      "I Don't Know If I'm Getting Value",
      "Other",
    ],
  },
  {
    key: "exciting",
    title: "Which feature excited you the most?",
    sub: "Tell us in your own words.",
    type: "text",
    placeholder: "The pantry assistant blew my mind because...",
  },
  {
    key: "confusing",
    title: "What confused you?",
    sub: "We'd rather hear the rough edges now.",
    type: "text",
    placeholder: "I wasn't sure what to do on the...",
  },
  {
    key: "missing",
    title: "What feature would make this app indispensable for your household?",
    type: "text",
    placeholder: "If only it could...",
  },
  {
    key: "trust",
    title: "Would you trust recommendations from this platform when making purchasing decisions?",
    type: "single",
    options: ["Absolutely", "Likely", "Maybe", "Not Sure", "No"],
  },
  {
    key: "pay",
    title: "Would you pay for Household Advisor if it consistently saved you money?",
    sub: "No wrong answer — this helps us price fairly.",
    type: "single",
    options: ["No", "₹49/month", "₹99/month", "₹199/month", "₹299/month", "More than ₹299/month"],
  },
  {
    key: "refer",
    title: "Would you recommend this to family and friends?",
    type: "single",
    options: ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"],
  },
];

type Answers = Record<string, string | string[]>;
type Lead = {
  name: string;
  email: string;
  mobile: string;
  city: string;
  household: string;
  comments: string;
};

function Feedback() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [lead, setLead] = useState<Lead>({
    name: "",
    email: "",
    mobile: "",
    city: "",
    household: "",
    comments: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = sections.length + 1; // + founding household form
  const isLead = stepIdx === sections.length;
  const step = sections[stepIdx];

  const setAnswer = (key: string, value: string | string[]) =>
    setAnswers((s) => ({ ...s, [key]: value }));

  const toggleMulti = (key: string, opt: string) => {
    const cur = (answers[key] as string[]) ?? [];
    setAnswer(key, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  const asString = (v: unknown) => (typeof v === "string" ? v : "");
  const asArray = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

  const buildPayload = (): FeedbackPayload => ({
    timestamp: new Date().toISOString(),
    overallRating: asString(answers.rating),
    wouldUse: asString(answers.wouldUse),
    valuableFeatures: asArray(answers.valuable),
    usageTiming: asArray(answers.when),
    biggestProblem: asString(answers.problem),
    excitingFeature: asString(answers.exciting),
    confusingFeature: asString(answers.confusing),
    missingFeature: asString(answers.missing),
    trustLevel: asString(answers.trust),
    paymentInterest: asString(answers.pay),
    referralInterest: asString(answers.refer),
    name: lead.name.trim(),
    email: lead.email.trim(),
    mobile: lead.mobile.trim(),
    city: lead.city.trim(),
    householdSize: lead.household.trim(),
    comments: lead.comments.trim(),
  });

  const canContinue = (() => {
    if (submitting) return false;
    if (isLead) return lead.name.trim() && lead.email.trim();
    if (!step) return false;
    const v = answers[step.key];
    if (step.type === "text") return typeof v === "string" && v.trim().length > 0;
    if (step.type === "multi") return Array.isArray(v) && v.length > 0;
    return typeof v === "string" && v.length > 0;
  })();

  const submit = async () => {
    setSubmitError(null);

    // Required-field validation
    const required = ["rating", "wouldUse", "problem", "trust", "pay", "refer"] as const;
    const missing = required.find((k) => !asString(answers[k]));
    if (missing) {
      setSubmitError("Please complete all required questions before submitting.");
      return;
    }
    if (!lead.name.trim() || !lead.email.trim()) {
      setSubmitError("Name and email are required.");
      return;
    }

    const payload = buildPayload();
    setSubmitting(true);
    const result = await submitFeedback(payload);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(
        result.message ?? "Submission failed. Please check your connection and try again.",
      );
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("ha_feedback") ?? "[]");
      existing.push(payload);
      localStorage.setItem("ha_feedback", JSON.stringify(existing));
      localStorage.setItem("ha_feedback_submitted", "1");
    } catch {}
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AppShell title="Thank you" eyebrow="Feedback received">
        <div className="max-w-2xl mx-auto rounded-2xl border border-accent/30 bg-accent/5 p-8 lg:p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
            <Check className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl lg:text-3xl font-semibold tracking-tight">
            Thank you for helping build Household Advisor.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your feedback has been recorded and will directly influence upcoming features.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              disabled
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold opacity-60 cursor-not-allowed"
            >
              <MessageCircle className="h-4 w-4" /> Join WhatsApp Community (Coming Soon)
            </button>
            <Link
              to="/today"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              Follow Product Updates
            </Link>
            <Link
              to="/today"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Return To Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Help Us Build Household Advisor"
      eyebrow={`Section ${stepIdx + 1} of ${totalSteps}`}
    >
      {/* Founder note + progress */}
      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-12 lg:col-span-4 lg:order-2 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                B
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">A note from the founder</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Personal · 2 min read
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              We're building Household Advisor to help families make smarter purchasing decisions.
              Every piece of feedback is reviewed and helps shape the product roadmap.
            </p>
            <p className="mt-3 text-sm font-medium">
              Thank you for helping us build something meaningful.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
                Why we ask
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your input directly shapes what we build next — features, pricing, and what we cut. No
              corporate survey. No spam.
            </p>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-8 lg:order-1">
          <div className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-1.5 mb-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < stepIdx ? "bg-accent" : i === stepIdx ? "bg-foreground" : "bg-surface-2",
                )}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
            {!isLead && step ? (
              <>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {step.type === "multi"
                    ? "Select all that apply"
                    : step.type === "text"
                      ? "Open response"
                      : "Single choice"}
                </div>
                <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-balance">
                  {step.title}
                </h2>
                {step.sub && <p className="mt-1 text-sm text-muted-foreground">{step.sub}</p>}

                {step.type === "text" ? (
                  <textarea
                    value={(answers[step.key] as string) ?? ""}
                    onChange={(e) => setAnswer(step.key, e.target.value)}
                    placeholder={step.placeholder}
                    rows={5}
                    className="mt-6 w-full rounded-xl border border-border bg-background p-4 text-sm focus:outline-none focus:border-foreground/40 resize-none"
                  />
                ) : (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.options.map((opt) => {
                      const v = answers[step.key];
                      const selected =
                        step.type === "single" ? v === opt : Array.isArray(v) && v.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            step.type === "single"
                              ? setAnswer(step.key, opt)
                              : toggleMulti(step.key, opt)
                          }
                          className={cn(
                            "text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-all",
                            selected
                              ? "border-foreground bg-background"
                              : "border-border bg-background hover:border-foreground/30",
                          )}
                        >
                          <span className="text-sm font-medium">{opt}</span>
                          {selected && (
                            <span className="h-6 w-6 inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-accent">
                    Founding Households
                  </span>
                </div>
                <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">
                  Join The Founding Household Program
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get early access, help shape the product, and receive future premium features.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Name"
                    value={lead.name}
                    onChange={(v) => setLead({ ...lead, name: v })}
                    placeholder="Your full name"
                  />
                  <Field
                    label="Email"
                    value={lead.email}
                    onChange={(v) => setLead({ ...lead, email: v })}
                    placeholder="you@home.com"
                    type="email"
                  />
                  <Field
                    label="Mobile number"
                    value={lead.mobile}
                    onChange={(v) => setLead({ ...lead, mobile: v })}
                    placeholder="+91 ..."
                  />
                  <Field
                    label="City"
                    value={lead.city}
                    onChange={(v) => setLead({ ...lead, city: v })}
                    placeholder="Hyderabad"
                  />
                  <Field
                    label="Household size"
                    value={lead.household}
                    onChange={(v) => setLead({ ...lead, household: v })}
                    placeholder="4 members"
                  />
                </div>
                <div className="mt-3">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Optional comments
                  </label>
                  <textarea
                    value={lead.comments}
                    onChange={(e) => setLead({ ...lead, comments: e.target.value })}
                    rows={3}
                    placeholder="Anything else you'd like the founders to know..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:border-foreground/40 resize-none"
                  />
                </div>
              </>
            )}

            {submitError && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between">
              <button
                disabled={stepIdx === 0 || submitting}
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {isLead ? (
                <button
                  disabled={!canContinue}
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting feedback...
                    </>
                  ) : (
                    <>
                      Submit feedback <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled={!canContinue}
                  onClick={() => setStepIdx((i) => i + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Star className="inline h-3 w-3 mr-1 -mt-0.5" />
            Your responses are private and go directly to the founding team.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:border-foreground/40"
      />
    </div>
  );
}
