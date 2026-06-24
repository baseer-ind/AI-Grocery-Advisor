import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, FileText, Image as ImageIcon, Upload as UploadIcon, CheckCircle2, ScanLine, BarChart3, Lightbulb, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload Bill — Household Advisor AI" }] }),
  component: UploadPage,
});

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

type RealResult = { productsFound: number; categories: number; totalSpend: number };

function UploadPage() {
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
    setStage("processing");

    if (!file || !API_BASE) {
      // No backend configured yet — be honest instead of faking a real read.
      setTimeout(() => {
        setReal(null);
        setStage("done");
      }, 1400);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/v1/bills/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const basket: { total_price: number }[] = data.basket ?? [];
      const categories = new Set(
        (data.recommendations ?? []).map((r: any) => r.basket_item?.product_name?.split(" ")[0]),
      );
      setReal({
        productsFound: basket.length,
        categories: categories.size,
        totalSpend: basket.reduce((s, b) => s + (b.total_price ?? 0), 0),
      });
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  return (
    <AppShell title="Upload your bill" eyebrow="Bills / New Upload">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all p-12 text-center",
              drag ? "border-foreground bg-surface-2" : "border-border bg-surface",
            )}
          >
            <div className="absolute inset-0 grid-bg opacity-30 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-5">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Drop your bill here</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Drag and drop a photo, PDF, or screenshot from any grocery app. We read it instantly —
                and never keep the original image.
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
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                Browse files
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> JPG · PNG · HEIC</span>
                <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PDF · Screenshots</span>
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
                    Something went wrong reaching our bill reader. Try a clearer photo, or try again in a moment —
                    we won't show you made-up numbers.
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
                    <span className="font-semibold">{real ? "Bill read" : "Sample analysis — demo mode"}</span>
                  </div>
                  {!real && (
                    <p className="text-xs text-muted-foreground mb-4">
                      We're not yet reading your actual bill in this preview — the numbers below are a sample so you
                      can see what a real analysis looks like. We'll tell you the moment this is reading real receipts.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Products Found" value={String(real?.productsFound ?? 42)} />
                    <Stat label="Categories" value={String(real?.categories ?? 6)} />
                    <Stat label="Total Spend" value={`₹${(real?.totalSpend ?? 9250).toLocaleString("en-IN")}`} />
                  </div>
                  <Link
                    to="/bill-check"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                  >
                    {real ? "Analyze My Spending" : "See Sample Analysis"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            What happens next
          </div>
          <ol className="space-y-5">
            {[
              { icon: ScanLine, title: "We read your bill", body: "Every item, price and quantity — picked up automatically." },
              { icon: BarChart3, title: "We compare it", body: "Against your past shopping, so we know what's normal for you." },
              { icon: Lightbulb, title: "We give you tips", body: "3 easy swaps and the best time to buy — never just \"cheapest\"." },
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight font-mono mt-1">{value}</div>
    </div>
  );
}
