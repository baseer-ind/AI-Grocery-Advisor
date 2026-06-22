"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { advisorPrompts, advisorResponses } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Sparkles, Send, Bot, User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const FALLBACK_RESPONSE =
  "I'd weigh price, quality, reviews, and timing together for that — based on your household profile, I'd lean toward optimizing for value rather than the absolute lowest price. Want me to run the numbers on a specific product?";

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your household purchase advisor. Ask me anything about your spending, what to buy, where, or when — I'll factor in price, quality, reviews, and timing, not just the lowest price.",
    },
  ]);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    const response = advisorResponses[text] ?? FALLBACK_RESPONSE;
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: response }]);
    setInput("");
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">AI Advisor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything about your household&apos;s purchases — price, quality, timing, and place, balanced together.
        </p>
      </div>

      <Card className="flex h-[600px] flex-col">
        <CardContent className="flex-1 space-y-4 overflow-y-auto pt-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex items-start gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"
                )}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </CardContent>

        <div className="border-t border-border p-4">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {advisorPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Sparkles className="h-3 w-3" /> {p}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your household advisor anything…"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </AppShell>
  );
}
