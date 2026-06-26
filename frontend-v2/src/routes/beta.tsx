import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { logEvent } from "@/lib/founderIntelligence";

export const Route = createFileRoute("/beta")({
  head: () => ({ meta: [{ title: "Welcome to the Beta — Household Advisor AI" }] }),
  component: BetaPage,
});

function BetaPage() {
  useEffect(() => {
    logEvent("Viewed Beta Page", "/beta");
  }, []);

  return (
    <AppShell title="Household Advisor Beta" eyebrow="Welcome">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Beta v1</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Welcome to the Household Advisor Beta
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Thank you for joining the early beta. You're among the first households helping us build
            a smarter way to plan shopping and manage everyday household decisions. This is an early
            release, and your feedback will directly shape what comes next.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-3">What to expect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Household Advisor becomes more useful over time. The more it learns about your
            household, the more personalised its recommendations become. During the beta, some
            features are still evolving, and you'll occasionally see areas marked "Coming Soon."
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-lg font-semibold tracking-tight">A few things to know</h2>

          <div>
            <h3 className="font-medium">Household understanding improves over time</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Recommendations are based on the information you've shared and your shopping history.
              As your household builds up history, the assistant becomes more accurate and more
              helpful.
            </p>
          </div>

          <div>
            <h3 className="font-medium">Bill analysis is improving</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Receipt and bill analysis works best with clear, well-lit photos. We're continuously
              improving support for different stores, receipt formats, and image quality. If a bill
              isn't recognised perfectly, you can still help the assistant learn through manual
              corrections.
            </p>
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" /> We value honesty over guesswork
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Household Advisor will never intentionally invent recommendations or pretend to know
              something it doesn't. If we don't have enough information yet, we'll tell you openly
              and explain what additional information would help.
            </p>
          </div>

          <div>
            <h3 className="font-medium">Your feedback matters</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Every suggestion, correction, and shopping event helps us improve Household Advisor —
              not just for your household, but for every household using the beta. We're building
              this together.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-3">How you can help</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The most valuable feedback isn't "I like it." Tell us what confused you, what felt
            unnecessary, what you expected but couldn't find, which recommendation was genuinely
            useful, and what would make you open Household Advisor again next week. Even small
            observations help us improve.
          </p>
          <Link
            to="/feedback"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            <Heart className="h-4 w-4" /> Share feedback
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-3">Our promise</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We're committed to building a product that's honest, helpful, privacy-conscious, easy to
            use, and continuously improving. We'll never trade trust for flashy features.
          </p>
        </section>

        <p className="text-sm text-muted-foreground italic">
          Thank you for helping shape the future of Household Advisor.
          <br />— The Household Advisor Team
        </p>
      </div>
    </AppShell>
  );
}
