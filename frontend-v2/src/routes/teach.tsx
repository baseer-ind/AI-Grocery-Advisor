import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, GraduationCap, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { addTaughtFact, getTaughtFacts, removeTaughtFact, type TaughtFact } from "@/lib/real-data";

export const Route = createFileRoute("/teach")({
  head: () => ({ meta: [{ title: "Teach Household Advisor — Household Advisor AI" }] }),
  component: TeachPage,
});

const CATEGORIES = [
  "Preferred brand",
  "Shopping day",
  "Favourite store",
  "Never buy",
  "Always buy",
  "Preferred pack size",
  "Preferred substitute",
  "Other",
];

const EXAMPLES = [
  "We usually buy Aashirvaad Atta.",
  "We never buy soft drinks.",
  "We prefer local vegetables.",
  "We always shop on salary day.",
];

function TeachPage() {
  const [facts, setFacts] = useState<TaughtFact[]>(() => getTaughtFacts());
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTaughtFact(trimmed, category);
    setFacts(getTaughtFacts());
    setText("");
  }

  function handleRemove(id: string) {
    removeTaughtFact(id);
    setFacts(getTaughtFacts());
  }

  return (
    <AppShell title="Teach Household Advisor" eyebrow="Household Advisor">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <GraduationCap className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Tell us things we can't yet figure out on our own.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              These become trusted household preferences — we'll never override them with a guess,
              and once bill scanning is reliable, we'll use it to confirm what you've told us rather
              than replace it.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Teach us something
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Teach this
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            What you've taught us ({facts.length})
          </div>
          {facts.length > 0 ? (
            <ul className="space-y-2">
              {facts.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5"
                >
                  <div className="flex-1">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {f.category}
                    </div>
                    <div className="text-sm mt-0.5">{f.text}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(f.id)}
                    className="shrink-0 p-1.5 -m-1.5 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove "${f.text}"`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing taught yet — anything you add here shows up immediately in Household
              Knowledge.
            </p>
          )}
        </section>

        <Link
          to="/knowledge"
          className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
        >
          Back to Household Knowledge <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </AppShell>
  );
}
