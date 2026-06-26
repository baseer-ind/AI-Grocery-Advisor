import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Upload as UploadIcon,
  CheckCircle2,
  ScanLine,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { markHasRealData } from "@/lib/real-data";
import { matchConfidenceNarrative } from "@/lib/household-identity";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload Bill — Household Advisor AI" }] }),
  validateSearch: (search: Record<string, unknown>): { debug?: boolean } => ({
    debug: search.debug === "1" || search.debug === 1 || search.debug === true || undefined,
  }),
  component: UploadPage,
});

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

type Suggestion = { product_id: number; product_name: string; confidence: number };

type BasketItem = {
  basket_item_id: number | null;
  product_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  matched_product_id: number | null;
  match_tier: string | null;
  match_confidence: number | null;
  review_status: string;
};

type BillDebugInfo = {
  raw_ocr_text: string;
  ocr_confidence: number | null;
  detected_line_count: number;
  matched_product_count: number;
  unmatched_product_count: number;
  llm_fallback_triggered: boolean;
  llm_fallback_provider: string;
  gemini_response: string;
  gemini_message: string;
};

type RealResult = {
  productsFound: number;
  categories: number;
  totalSpend: number;
  items: BasketItem[];
  debug: BillDebugInfo | null;
};

function UploadPage() {
  const { debug } = Route.useSearch();
  const [stage, setStage] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [drag, setDrag] = useState(false);
  const [real, setReal] = useState<RealResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) start(file);
  };

  const start = async (file?: File) => {
    if (!file) return;
    setStage("processing");
    track("Bill Upload Started", "/upload");

    if (!API_BASE) {
      // No backend configured — fail loudly rather than ever showing
      // invented stats that look like a real read of this user's bill.
      setStage("error");
      track("Bill Upload Failed", "/upload");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      // Processes inline (OCR + matching), typically 5-15s — no queue or
      // worker required, so this works on free-tier hosting at beta scale.
      const url = `${API_BASE}/api/v1/bills/upload${debug ? "?debug=1" : ""}`;
      const res = await fetch(url, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const basket: BasketItem[] = data.basket ?? [];
      const categories = new Set(basket.map((b) => b.product_name.split(" ")[0]));
      setReal({
        productsFound: basket.length,
        categories: categories.size,
        totalSpend: basket.reduce((s, b) => s + (b.total_price ?? 0), 0),
        items: basket,
        debug: data.debug ?? null,
      });
      if (basket.length > 0) markHasRealData();
      setStage("done");
      track("Bill Upload Success", "/upload", { productsFound: basket.length });
    } catch {
      setStage("error");
      track("Bill Upload Failed", "/upload");
    }
  };

  const pendingReview = real?.items.filter((i) => i.review_status === "pending_review") ?? [];

  return (
    <AppShell title="Add a bill" eyebrow="Bills / New Upload">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div
            onDragOver={(e) => {
              if (stage === "processing") return;
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              if (stage === "processing") return;
              onDrop(e);
            }}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all p-12 text-center",
              drag ? "border-foreground bg-surface-2" : "border-border bg-surface",
              stage === "processing" && "opacity-60 pointer-events-none",
            )}
          >
            <div className="absolute inset-0 grid-bg opacity-30 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-5">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Drop your bill here</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Drag and drop a photo, PDF, or screenshot from any grocery app. We read it instantly
                — and never keep the original image.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) start(file);
                }}
              />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={stage === "processing"}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Browse files
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> JPG · PNG · HEIC
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> PDF · Screenshots
                </span>
              </div>
            </div>
          </div>

          {/* Result */}
          {stage !== "idle" && (
            <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
              {stage === "processing" ? (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                    Reading your bill…
                  </div>
                  <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-foreground animate-[entrance_1.4s_linear] w-full origin-left" />
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>· Reading the text</li>
                    <li>· Sorting line items</li>
                    <li>· Matching products</li>
                  </ul>
                </div>
              ) : stage === "error" ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                    <span className="font-semibold">We couldn't read that bill</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Something went wrong reaching our bill reader. Try a clearer photo, or try again
                    in a moment — we won't show you made-up numbers.
                  </p>
                  <button
                    onClick={() => setStage("idle")}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-2"
                  >
                    Try again
                  </button>
                </div>
              ) : real && real.productsFound === 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                    <span className="font-semibold">
                      We read the bill, but couldn't find any items
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The image came through, but we couldn't pick out any line items from it. Try a
                    clearer photo, or one that shows the full itemized list.
                  </p>
                  <button
                    onClick={() => setStage("idle")}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-2"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-semibold">Bill read</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Products Found" value={String(real?.productsFound ?? 0)} />
                    <Stat label="Categories" value={String(real?.categories ?? 0)} />
                    <Stat
                      label="Total Spend"
                      value={`₹${(real?.totalSpend ?? 0).toLocaleString("en-IN")}`}
                    />
                  </div>
                  <Link
                    to="/today"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                  >
                    See what we learned
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {import.meta.env.DEV && debug && real?.debug && <DebugPanel info={real.debug} />}

          {stage === "done" && real && pendingReview.length > 0 && (
            <VerificationPanel
              items={pendingReview}
              onResolved={(basketItemId, matchedProductId, reviewStatus) =>
                setReal((prev) =>
                  prev
                    ? {
                        ...prev,
                        items: prev.items.map((i) =>
                          i.basket_item_id === basketItemId
                            ? {
                                ...i,
                                matched_product_id: matchedProductId,
                                review_status: reviewStatus,
                              }
                            : i,
                        ),
                      }
                    : prev,
                )
              }
            />
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            What happens next
          </div>
          <ol className="space-y-5">
            {[
              {
                icon: ScanLine,
                title: "We read your bill",
                body: "Every item, price and quantity — picked up automatically.",
              },
              {
                icon: BarChart3,
                title: "We compare it",
                body: "Against your past shopping, so we know what's normal for you.",
              },
              {
                icon: Lightbulb,
                title: "We give you tips",
                body: '3 easy swaps and the best time to buy — never just "cheapest".',
              },
            ].map((step) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <step.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </AppShell>
  );
}

function VerificationPanel({
  items,
  onResolved,
}: {
  items: BasketItem[];
  onResolved: (basketItemId: number, matchedProductId: number | null, reviewStatus: string) => void;
}) {
  const remaining = items.filter((i) => i.review_status === "pending_review");

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2 mb-1">
        <HelpCircle className="h-5 w-5 text-warning-foreground" />
        <span className="font-semibold">
          {remaining.length > 0
            ? `Confirm ${remaining.length} item${remaining.length > 1 ? "s" : ""} we weren't sure about`
            : "All items confirmed — thank you!"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        We couldn't confidently match these to a product. Pick the right one, search manually, or
        tell us "Not Sure" — every answer makes future bills more accurate.
      </p>
      <div className="space-y-3">
        {items.map((item) =>
          item.basket_item_id ? (
            <VerificationRow key={item.basket_item_id} item={item} onResolved={onResolved} />
          ) : null,
        )}
      </div>
    </div>
  );
}

function VerificationRow({
  item,
  onResolved,
}: {
  item: BasketItem;
  onResolved: (basketItemId: number, matchedProductId: number | null, reviewStatus: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const resolved = item.review_status !== "pending_review";

  const loadSuggestions = async () => {
    if (suggestions !== null || loadingSuggestions || !item.basket_item_id) return;
    setLoadingSuggestions(true);
    setSuggestionsError(false);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bills/items/${item.basket_item_id}/suggestions`);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestionsError(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const confirm = async (action: string, productId: number | null) => {
    if (!item.basket_item_id || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bills/items/${item.basket_item_id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, product_id: productId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onResolved(item.basket_item_id, data.matched_product_id, data.review_status);
    } catch {
      // leave row as pending_review so the user can retry
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.map((p: any) => ({ id: p.product_id, name: p.product_name })));
    } catch {
      setSearchResults([]);
    }
  };

  if (resolved) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{item.product_name}</span>
          <span className="text-muted-foreground ml-2 text-xs">
            {item.review_status === "user_rejected" ? "Marked not sure" : "Confirmed"}
          </span>
        </div>
        <CheckCircle2 className="h-4 w-4 text-accent" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{item.product_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ₹{item.total_price.toLocaleString("en-IN")} · {item.quantity} {item.unit}
            {item.match_confidence != null &&
              ` · ${matchConfidenceNarrative(item.match_confidence)}`}
          </div>
        </div>
        <button
          onClick={loadSuggestions}
          disabled={busy}
          className="shrink-0 text-xs font-semibold rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2"
        >
          {loadingSuggestions
            ? "Loading…"
            : suggestions === null
              ? "Show matches"
              : "Refresh matches"}
        </button>
      </div>

      {suggestionsError && (
        <div className="mt-3 text-xs text-destructive">Couldn't load matches — try again.</div>
      )}
      {suggestions !== null && (
        <div className="mt-3 space-y-1.5">
          {suggestions.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No close matches found in our catalog.
            </div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.product_id}
              disabled={busy}
              onClick={() => confirm("select_suggestion", s.product_id)}
              className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2 text-left"
            >
              <span>{s.product_name}</span>
              <span className="text-xs text-muted-foreground">
                {matchConfidenceNarrative(s.confidence)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={busy}
          onClick={() => setSearchOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2"
        >
          <Search className="h-3.5 w-3.5" />
          Search manually
        </button>
        <button
          disabled={busy}
          onClick={() => confirm("not_sure", null)}
          className="text-xs font-semibold rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2"
        >
          Not Sure
        </button>
      </div>

      {searchOpen && (
        <div className="mt-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          {searchResults.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  disabled={busy}
                  onClick={() => confirm("manual_match", p.id)}
                  className="w-full text-left rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebugPanel({ info }: { info: BillDebugInfo }) {
  const rows: [string, string][] = [
    ["OCR confidence", info.ocr_confidence != null ? `${info.ocr_confidence.toFixed(1)}%` : "n/a"],
    ["Detected lines", String(info.detected_line_count)],
    ["Matched products", String(info.matched_product_count)],
    ["Unmatched products", String(info.unmatched_product_count)],
    ["LLM fallback provider", info.llm_fallback_provider],
    ["LLM fallback triggered", info.llm_fallback_triggered ? "yes" : "no"],
  ];

  return (
    <div className="mt-5 rounded-2xl border border-dashed border-warning bg-warning/5 p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-warning-foreground mb-3">
        Debug — bill processing trace
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-mono font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {info.gemini_message && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Gemini message
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-xs">
            {info.gemini_message}
          </pre>
        </div>
      )}
      {info.gemini_response && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Gemini raw response
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-xs">
            {info.gemini_response}
          </pre>
        </div>
      )}
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Raw OCR text
        </div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-xs">
          {info.raw_ocr_text || "(empty)"}
        </pre>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight font-mono mt-1">{value}</div>
    </div>
  );
}
