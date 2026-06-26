import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasRealData } from "@/lib/real-data";

type Msg = { role: "user" | "ai"; text: string };

const seed: Msg[] = [
  {
    role: "ai",
    text: "Ask me anything about your spending — buy-vs-wait calls, brand swaps, or where your money is going.",
  },
];

const prompts = [
  "How can I save ₹1,000 this month?",
  "What should I buy this week?",
  "Should I buy basmati rice now or wait?",
];

// These are illustrative, scripted answers shown only in demo mode (no real
// shopping data yet) — never presented as a real recommendation about a
// household's actual purchases. Once real data exists, the widget hides
// itself rather than mixing fabricated answers with real ones.
function sampleReply(q: string): Msg {
  const lower = q.toLowerCase();
  if (lower.includes("wait") || lower.includes("now")) {
    return {
      role: "ai",
      text: "Example answer: Hold off for now. Basmati rice is often a little above its average price right after a bill cycle — harvest cycles tend to bring prices back down within a few weeks.",
    };
  }
  if (lower.includes("switch") || lower.includes("brand")) {
    return {
      role: "ai",
      text: "Example answer: A few switches worth trying, close in quality to what you already buy:\n\n• Aashirvaad Atta → Pillsbury\n• Surf Excel → Tide Plus\n• Maggi → Yippee",
    };
  }
  return {
    role: "ai",
    text: "Example answer: A few small moves without changing your diet — switching one staple brand, skipping a restock that's already well-stocked, and timing a snack run around a sale. Real numbers will replace this once we have your shopping history.",
  };
}

export function AskAiWidget() {
  const [open, setOpen] = useState(false);
  const demoMode = !hasRealData();
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

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

  // No real backend exists for this yet — only show the illustrative demo
  // version before a household has real shopping data, rather than mixing
  // fabricated answers into a household's real recommendations.
  if (!demoMode) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-5 lg:right-5 z-40 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-3 text-sm font-semibold shadow-lg hover:opacity-90 transition-all",
          open && "scale-0 opacity-0 pointer-events-none",
        )}
        aria-label="Ask AI"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-5 lg:right-5 z-50 w-[calc(100vw-2rem)] sm:w-[400px] rounded-2xl border border-border bg-surface shadow-2xl flex flex-col transition-all duration-200 ease-out",
          "h-[min(640px,calc(100vh-7rem))] lg:h-[min(640px,calc(100vh-2.5rem))]",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Ask AI</div>
              <div className="text-xs text-muted-foreground">
                Demo · example answers until you add real data
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {msgs.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {typing && (
            <div className="flex gap-2 items-center text-muted-foreground text-xs">
              <Dot /> <Dot delay={150} /> <Dot delay={300} />
            </div>
          )}
          {msgs.length === 1 && (
            <div className="space-y-2 pt-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="block w-full text-left rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm hover:border-foreground/30 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
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
              placeholder="Ask about your spending…"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex gap-2.5 max-w-[90%]", isUser ? "ml-auto flex-row-reverse" : "")}>
      <div
        className={cn(
          "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold",
          isUser
            ? "bg-surface-2 text-foreground border border-border"
            : "bg-foreground text-background",
        )}
      >
        {isUser ? "B" : <Sparkles className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-foreground text-background"
            : "bg-background text-foreground border border-border",
        )}
      >
        {m.text}
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
