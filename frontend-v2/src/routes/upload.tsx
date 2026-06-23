import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, Image as ImageIcon, Upload as UploadIcon, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload Bill — Household Advisor AI" }] }),
  component: UploadPage,
});

function UploadPage() {
  const [stage, setStage] = useState<"idle" | "processing" | "done">("idle");
  const [drag, setDrag] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    start();
  };

  const start = () => {
    setStage("processing");
    setTimeout(() => setStage("done"), 1400);
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
                Drag and drop a photo, PDF, or screenshot from any grocery app. We'll parse line items, categorize spend,
                and never store the original image.
              </p>
              <button
                onClick={start}
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
                    Parsing bill…
                  </div>
                  <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-foreground animate-[entrance_1.4s_linear] w-full origin-left" />
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>· OCR text extraction</li>
                    <li>· Normalizing 42 line items</li>
                    <li>· Matching to product catalog</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-semibold">Bill parsed — BigBasket · 21 Aug 2025</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Products Found" value="42" />
                    <Stat label="Categories" value="6" />
                    <Stat label="Total Spend" value="₹9,250" />
                  </div>
                  <Link
                    to="/analysis"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                  >
                    Analyze My Spending
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
              ["01", "Parse", "OCR + catalog matching identifies every product, unit price and quantity."],
              ["02", "Contextualize", "We compare against your last 6 months and your household profile."],
              ["03", "Advise", "You get 3 basket alternatives and timing recommendations — never a generic 'cheapest'."],
            ].map(([n, t, b]) => (
              <li key={n} className="flex gap-3">
                <span className="font-mono text-[10px] font-semibold text-muted-foreground mt-1">{n}</span>
                <div>
                  <div className="font-semibold text-sm">{t}</div>
                  <div className="text-sm text-muted-foreground">{b}</div>
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
