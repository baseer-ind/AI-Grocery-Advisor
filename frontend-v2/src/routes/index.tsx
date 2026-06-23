import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Upload as UploadIcon,
  Sparkles,
  Check,
  FileText,
  Image as ImageIcon,
  TrendingDown,
  Store,
  Clock,
  ShoppingBasket,
  Quote,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Household Advisor AI — Upload Your Grocery Bill. Discover Your Savings." },
      {
        name: "description",
        content:
          "Upload your grocery bill. We OCR-scan it and show you better stores, smarter alternatives, and how much you could have saved.",
      },
      { property: "og:title", content: "Household Advisor AI" },
      {
        property: "og:description",
        content: "Upload your grocery bill. Discover how much you could have saved.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <UploadBand />
      <ResultPreview />
      <Stores />
      <Insights />
      <Alternatives />
      <WhyUs />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 lg:px-8 h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight text-sm">Household Advisor</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AI · v1.0
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#stores" className="hover:text-foreground transition-colors">Stores</a>
          <a href="#why" className="hover:text-foreground transition-colors">Why us</a>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-semibold hover:opacity-90"
          >
            Analyze my bill
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
      <div className="h-2.5 w-2.5 rounded-sm bg-background rotate-45" />
      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 pt-16 lg:pt-24 pb-16 lg:pb-20 grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              AI Household Purchase Advisor
            </span>
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            Upload your grocery bill. <br />
            <span className="text-muted-foreground">Discover how much you could have saved.</span>
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground text-base lg:text-lg text-pretty">
            We OCR-scan your bill and quietly show you where you overspent and what to switch —
            no nagging, no compromise on quality.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 gap-2.5 max-w-xl">
            {[
              "Better places to buy",
              "Alternative products",
              "Missed savings",
              "Timed buy / wait calls",
            ].map((x) => (
              <li key={x} className="flex items-center gap-2 text-sm">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-semibold hover:opacity-90"
            >
              Analyze my bill
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/analysis"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-2"
            >
              See sample analysis
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> JPG · PNG · HEIC
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> PDF · Screenshots
            </span>
            <span>· Bills never stored</span>
          </div>
        </div>

        {/* Visual savings card */}
        <div className="lg:col-span-5">
          <SavingsHeroCard />
        </div>
      </div>
    </section>
  );
}

function SavingsHeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-foreground/10 via-transparent to-accent/20 blur-2xl opacity-60" />
      <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Aug 2025 · BigBasket
          </div>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">
            Sample
          </span>
        </div>
        <div className="mt-4">
          <div className="text-sm text-muted-foreground">You could have saved</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight font-mono">₹1,200</span>
            <span className="text-sm text-muted-foreground">last month</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MiniStat label="Current spend" value="₹9,250" />
          <MiniStat label="Optimized" value="₹8,050" accent />
        </div>

        <div className="mt-6 space-y-2.5">
          {[
            ["Cooking Oil", 220],
            ["Rice", 180],
            ["Snacks", 150],
            ["Beverages", 120],
          ].map(([name, amt]) => {
            const max = 220;
            const w = (Number(amt) / max) * 100;
            return (
              <div key={String(name)}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-semibold">₹{amt}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${w}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background p-3 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Insight.</span> Save ₹500/month without
            changing product quality.
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold font-mono tracking-tight ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Social proof ---------- */
function SocialProof() {
  const cards = [
    { spend: 9250, opt: 8050, save: 1200, family: "Family of 4 · Hyderabad" },
    { spend: 6800, opt: 6050, save: 750, family: "Couple · Bengaluru" },
    { spend: 12400, opt: 10950, save: 1450, family: "Family of 5 · Mumbai" },
  ];
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Real bills · Real savings
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">
              Households quietly saving every month.
            </h2>
          </div>
          <div className="text-sm text-muted-foreground max-w-sm">
            We don't push you to switch everything. Small, calm changes that compound.
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {c.family}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">Monthly spend</div>
                  <div className="font-mono font-semibold text-lg">
                    ₹{c.spend.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Optimized</div>
                  <div className="font-mono font-semibold text-lg">
                    ₹{c.opt.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">Potential savings</div>
                  <div className="font-mono font-semibold text-xl text-accent">
                    ₹{c.save.toLocaleString("en-IN")}
                  </div>
                </div>
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Upload your bill",
      body: "Drop a photo, PDF or screenshot from any grocery app or kirana.",
      icon: UploadIcon,
    },
    {
      n: "02",
      title: "OCR scan",
      body: "We extract every item, price and brand straight off the bill — no manual entry.",
      icon: Sparkles,
    },
    {
      n: "03",
      title: "Get recommendations",
      body: "Where to buy, what to buy, when to buy — and how much you could save.",
      icon: ShoppingBasket,
    },
  ];
  return (
    <section id="how" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            How it works
          </div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            Three steps. Then your household just gets quietly smarter.
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-7">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  STEP {s.n}
                </div>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Upload band ---------- */
function UploadBand() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-5 lg:px-8 py-16 lg:py-20">
        <div className="relative rounded-3xl border-2 border-dashed border-border bg-background p-10 lg:p-14 text-center overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
              <UploadIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl lg:text-3xl font-semibold tracking-tight">
              Drop your grocery bill here.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">or upload from phone</p>
            <Link
              to="/upload"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Choose a file
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Photos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> PDFs
              </span>
              <span>Screenshots</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Result preview ---------- */
function ResultPreview() {
  const breakdown = [
    { name: "Cooking Oil", save: 220 },
    { name: "Rice", save: 180 },
    { name: "Snacks", save: 150 },
    { name: "Beverages", save: 120 },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            What you'll see
          </div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            You could have saved <span className="text-accent">₹1,200</span> last month.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            A single, calm number — then a quiet breakdown of exactly where the savings hid in your
            cart. No noise, no upsells.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Current" value="₹9,250" />
              <Stat label="Optimized" value="₹8,050" accent />
              <Stat label="Savings" value="₹1,200" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Savings breakdown
              </div>
              <span className="text-xs text-muted-foreground">By category</span>
            </div>
            <div className="space-y-4">
              {breakdown.map((b) => {
                const w = (b.save / 220) * 100;
                return (
                  <div key={b.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span className="font-mono">₹{b.save}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-xl lg:text-2xl font-semibold font-mono tracking-tight ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Stores ---------- */
function Stores() {
  const stores = [
    { name: "Blinkit", cost: 8450, avail: 96, delivery: "12 mins", rating: 4.5 },
    { name: "Zepto", cost: 8320, avail: 98, delivery: "10 mins", rating: 4.4 },
    { name: "BigBasket", cost: 8050, avail: 99, delivery: "Next Day", rating: 4.6, best: true },
    { name: "Amazon Fresh", cost: 8180, avail: 97, delivery: "Same Day", rating: 4.7 },
  ];
  return (
    <section id="stores" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Store intelligence
            </div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
              The same basket, priced across every store you'd consider.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Price, availability, delivery and rating — not just the cheapest sticker.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stores.map((s) => (
            <div
              key={s.name}
              className={`relative rounded-2xl border bg-background p-6 ${
                s.best ? "border-foreground" : "border-border"
              }`}
            >
              {s.best && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-foreground text-background font-mono text-[10px] uppercase tracking-widest px-2.5 py-1">
                  Best overall value
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-surface-2 flex items-center justify-center">
                  <Store className="h-4 w-4" />
                </div>
                <div className="font-semibold">{s.name}</div>
              </div>
              <div className="mt-5">
                <div className="text-[11px] text-muted-foreground">Basket cost</div>
                <div className="font-mono font-semibold text-2xl tracking-tight">
                  ₹{s.cost.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-[11px]">
                <Kv k="Avail" v={`${s.avail}%`} />
                <Kv k="Delivery" v={s.delivery} />
                <Kv k="Rating" v={s.rating.toFixed(1)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{k}</div>
      <div className="font-mono font-semibold text-foreground mt-0.5">{v}</div>
    </div>
  );
}

/* ---------- Insights ---------- */
function Insights() {
  const items = [
    "22% of your budget goes to snacks — above the 14% average.",
    "Cooking oil is cheaper at 3 nearby stores.",
    "You're brand-loyal — that's fine, it explains the gap.",
    "Save ₹500/month with no quality trade-off.",
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Insights
          </div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            Observations only your household needs to hear.
          </h2>
        </div>
        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
          {items.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-6 flex gap-3"
            >
              <Quote className="h-4 w-4 text-accent shrink-0 mt-1" />
              <p className="text-sm leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Alternatives ---------- */
function Alternatives() {
  const rows = [
    {
      current: { name: "Fortune Sunflower Oil 5L", price: 920 },
      alt: { name: "Sundrop Heart Sunflower 5L", price: 860 },
      quality: "Minimal difference",
      save: 60,
    },
    {
      current: { name: "Lay's Classic Salted 52g × 6", price: 360 },
      alt: { name: "Too Yumm! Karare 60g × 6", price: 270 },
      quality: "Comparable",
      save: 90,
    },
    {
      current: { name: "Tropicana Orange 1L", price: 145 },
      alt: { name: "Real Activ Orange 1L", price: 115 },
      quality: "Minimal difference",
      save: 30,
    },
  ];
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl mb-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Smart alternatives
          </div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            Swap one or two things. Keep everything else.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Only switches where quality stays close and savings are real.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          {rows.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 px-6 py-5 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="lg:col-span-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Current
                </div>
                <div className="mt-1 font-medium">{r.current.name}</div>
                <div className="font-mono text-sm text-muted-foreground">₹{r.current.price}</div>
              </div>
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="lg:col-span-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Alternative
                </div>
                <div className="mt-1 font-medium">{r.alt.name}</div>
                <div className="font-mono text-sm text-muted-foreground">
                  ₹{r.alt.price} · {r.quality}
                </div>
              </div>
              <div className="lg:col-span-2 lg:text-right">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Save
                </div>
                <div className="mt-1 font-mono font-semibold text-accent text-lg">₹{r.save}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why us ---------- */
function WhyUs() {
  const cards = [
    { icon: Store, title: "Know where to buy", body: "Price, availability, delivery and rating — balanced." },
    { icon: Clock, title: "Know when to buy", body: "Buy-now vs wait, based on price history." },
    { icon: ShoppingBasket, title: "Know what to buy", body: "Alternatives that respect your taste." },
    { icon: Sparkles, title: "Save without compromise", body: "Never the cheapest cart — the smartest." },
  ];
  return (
    <section id="why" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Why households use us
          </div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            A trusted advisor — not a comparison site.
          </h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-surface p-6">
              <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center">
                <c.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-5 font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function FinalCta() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 lg:px-8 py-20 lg:py-28 text-center">
        <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-balance">
          You're probably overspending by ₹500–₹1,500 a month.
          <br />
          <span className="text-muted-foreground">Let's quietly fix that.</span>
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90"
          >
            Analyze my bill
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold hover:bg-surface-2"
          >
            See sample analysis
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span>© 2026 Household Advisor AI · Built for Indian households</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link to="/advisor" className="hover:text-foreground">Advisor</Link>
        </div>
      </div>
    </footer>
  );
}
