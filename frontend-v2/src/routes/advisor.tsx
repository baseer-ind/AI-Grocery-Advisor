import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisor")({
  head: () => ({ meta: [{ title: "AI Advisor — Household Advisor AI" }] }),
  component: Advisor,
});

type Msg = { role: "user" | "ai"; text: string; confidence?: number };

const seed: Msg[] = [
  { role: "user", text: "How can I save ₹1,000 this month?" },
  {
    role: "ai",
    confidence: 92,
    text:
      "Three moves get you there without changing your diet:\n\n• Switch Aashirvaad Atta to Pillsbury at DMart (-₹95 per 10kg, same rating).\n• Skip cooking oil this month — you have 1.6× your usual stock (-₹920).\n• Re-time your snack run to next Friday's 2-for-1 (-₹180).\n\nTotal modeled saving: ₹1,195. None of these compromise quality scores in your profile.",
  },
];

const prompts = [
  "How can I save ₹1,000 this month?",
  "What should I buy this week?",
  "What is running low?",
  "Which products should I switch?",
  "Should I buy basmati rice now or wait?",
  "Where should I buy rice?",
];

function Advisor() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, sampleReply(text)]);
      setTyping(false);
    }, 900);
  };

  return (
    <AppShell title="AI Advisor" eyebrow="Conversations">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-9 rounded-2xl border border-border bg-surface flex flex-col h-[calc(100vh-12rem)] min-h-[520px]">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Household Advisor</div>
              <div className="text-xs text-muted-foreground">
                Tuned to Baseer's home · 4 members · primary goal: save money
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
            {msgs.map((m, i) => (
              <Bubble key={i} m={m} />
            ))}
            {typing && (
              <div className="flex gap-3 items-center text-muted-foreground text-sm">
                <Dot /> <Dot delay={150} /> <Dot delay={300} />
                <span className="font-mono text-[10px] uppercase tracking-widest">advisor thinking</span>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="relative"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your household spending…"
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1">
            Suggested
          </div>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="block w-full text-left rounded-xl border border-border bg-surface px-4 py-3 text-sm hover:border-foreground/30 transition"
            >
              {p}
            </button>
          ))}
        </aside>
      </div>
    </AppShell>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex gap-3 max-w-2xl", isUser ? "ml-auto flex-row-reverse" : "")}>
      <div
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold",
          isUser ? "bg-surface-2 text-foreground border border-border" : "bg-foreground text-background",
        )}
      >
        {isUser ? "B" : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser ? "bg-foreground text-background" : "bg-surface-2 text-foreground border border-border",
        )}
      >
        {m.text}
        {m.confidence && !isUser && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Confidence
            </span>
            <div className="h-1.5 w-24 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${m.confidence}%` }} />
            </div>
            <span className="font-mono text-xs font-semibold">{m.confidence}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function sampleReply(q: string): Msg {
  const lower = q.toLowerCase();
  if (lower.includes("wait") || lower.includes("now")) {
    return {
      role: "ai",
      confidence: 78,
      text:
        "Hold off for now.\n\nBasmati rice is currently 8% above its 6-month average. Harvest cycles historically drop the price ~₹70/5kg in the next 3 weeks. You have ~2 weeks of stock — no risk of running out.\n\nI'll alert you if pricing breaks lower.",
    };
  }
  if (lower.includes("switch") || lower.includes("brand")) {
    return {
      role: "ai",
      confidence: 86,
      text:
        "Three switches I'd suggest, all rated ≥ your current pick:\n\n• Aashirvaad Atta → Pillsbury (−₹95, 4.4★ vs 4.3★)\n• Surf Excel → Tide Plus (−₹80, identical wash performance)\n• Maggi → Yippee (−₹60, similar reviews; your household ate both last year)\n\nKeep Amul, Daawat, and Fortune — those are best-in-class on your priorities.",
    };
  }
  if (lower.includes("waste")) {
    return {
      role: "ai",
      confidence: 81,
      text:
        "Snacks. They're 22% of your spend and we see 14% repeat purchases that don't finish before the next shop. Try buying half the quantity for 2 months and we'll re-evaluate.",
    };
  }
  return {
    role: "ai",
    confidence: 88,
    text:
      "Here's a tailored answer based on your household profile and last 6 months of spending. Tap one of the suggested prompts on the right for deeper analysis on savings, timing, or brand switches.",
  };
}
