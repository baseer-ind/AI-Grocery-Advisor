import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Check,
  Menu,
  X,
  ShoppingBasket,
  Store,
  Clock,
  ShieldCheck,
  Lock,
  Eye,
  MessageCircle,
  HeartHandshake,
  Compass,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Household Advisor — Your household's quiet shopping co-pilot" },
      {
        name: "description",
        content:
          "Household Advisor learns how your household actually shops, then helps you plan, compare, and save — without ever asking you to change how you live.",
      },
      { property: "og:title", content: "Household Advisor" },
      {
        property: "og:description",
        content: "It learns how your household shops. Then it starts helping.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Nav />
      <Hero />
      <Story />
      <HowItWorks />
      <LearnsOverTime />
      <WhyHouseholdsLoveIt />
      <Trust />
      <Screenshots />
      <BetaJourney />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */
const navLinks = [
  { href: "#how", label: "How it Works" },
  { href: "#why", label: "Why Household Advisor" },
  { href: "#learns", label: "Features" },
  { href: "#beta", label: "Beta" },
  { href: "#faq", label: "FAQ" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 lg:px-8 h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-semibold tracking-tight text-base">Household Advisor</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-sm text-muted-foreground">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/household"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Open My Household
          </Link>
          <Link
            to="/household"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Join the beta
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background px-5 py-5 space-y-4 animate-entrance">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-foreground"
            >
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <ThemeToggle />
            <Link
              to="/household"
              onClick={() => setOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-semibold"
            >
              Join the beta
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <div className="relative h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
      <div className="h-2.5 w-2.5 rounded-sm bg-background rotate-45" />
      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.35] pointer-events-none" />
      <div className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 pt-16 lg:pt-28 pb-20 lg:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 animate-entrance">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium">Now welcoming founding beta households</span>
          </div>
          <h1
            className="mt-7 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.04] text-balance animate-entrance"
            style={{ animationDelay: "60ms" }}
          >
            Your household already has a shopping rhythm.
            <span className="block text-muted-foreground">We're learning it.</span>
          </h1>
          <p
            className="mt-6 max-w-xl text-lg lg:text-xl text-muted-foreground leading-relaxed text-pretty animate-entrance"
            style={{ animationDelay: "120ms" }}
          >
            Household Advisor quietly learns how your household shops — what you buy, where, and how
            often — and turns that into a calmer, smarter way to plan your next trip.
          </p>
          <div
            className="mt-9 flex flex-wrap items-center gap-3 animate-entrance"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              to="/household"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity"
            >
              Join the beta
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 text-base font-semibold hover:bg-surface-2 transition-colors"
            >
              See how it works
            </a>
          </div>
          <p
            className="mt-6 text-sm text-muted-foreground animate-entrance"
            style={{ animationDelay: "240ms" }}
          >
            Built with early households. No fees during beta. Bills never stored.
          </p>
        </div>

        <div className="mt-16 lg:mt-20 animate-entrance" style={{ animationDelay: "260ms" }}>
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="rounded-[2rem] border border-border bg-surface p-3 shadow-sm">
        <div className="rounded-[1.5rem] bg-background border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">Your Household</span>
          </div>
          <div className="p-6 lg:p-8 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-xs text-muted-foreground">We've learned</div>
              <div className="mt-2 text-base font-medium leading-snug">
                Your household shops every 5–6 days, mostly on weekends.
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-xs text-muted-foreground">Recommendation</div>
              <div className="mt-2 text-base font-medium leading-snug">
                Cooking oil usually runs low around this time — worth adding to your next list.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Guided story ---------- */
function Story() {
  const lines = [
    "Your household makes hundreds of shopping decisions every month.",
    "Most apps only record those decisions after they happen.",
    "Household Advisor quietly learns how your household shops.",
    "Over time, it starts recognising your routine.",
    "Then it begins helping you shop smarter — before you ask.",
  ];
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-3xl px-5 lg:px-8 py-20 lg:py-28">
        <ul className="space-y-7 lg:space-y-9">
          {lines.map((line, i) => (
            <li
              key={line}
              className="flex items-start gap-4 lg:gap-5 animate-entrance"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="mt-1.5 font-mono text-xs text-muted-foreground shrink-0 w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className={`text-xl lg:text-2xl tracking-tight text-balance ${
                  i === lines.length - 1 ? "font-semibold" : "text-muted-foreground font-medium"
                }`}
              >
                {line}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Tell us about your household",
      body: "A couple of minutes — size, budget, where you shop. No bill required to start.",
      icon: Compass,
    },
    {
      n: "02",
      title: "We build your household profile",
      body: "Your shopping style and planning style, so recommendations start relevant, not generic.",
      icon: ShoppingBasket,
    },
    {
      n: "03",
      title: "Add a bill whenever you're ready",
      body: "A photo, a PDF, a screenshot — from any store. Every bill sharpens what we understand.",
      icon: Sparkles,
    },
    {
      n: "04",
      title: "Get one clear recommendation at a time",
      body: "Where to buy, what to swap, when to wait — never a wall of numbers.",
      icon: Store,
    },
  ];
  return (
    <section id="how" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Start with your household. Everything else follows."
          body="No bill required to begin — your profile is the foundation, real shopping data sharpens it from there."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-surface p-6 lg:p-7">
              <div className="h-11 w-11 rounded-2xl bg-foreground text-background flex items-center justify-center">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-6 font-mono text-[11px] tracking-widest text-muted-foreground">
                STEP {s.n}
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="font-mono text-[11px] uppercase tracking-widest text-accent">{eyebrow}</div>
      <h2 className="mt-3 text-3xl lg:text-5xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {body && (
        <p className="mt-4 text-base lg:text-lg text-muted-foreground text-pretty">{body}</p>
      )}
    </div>
  );
}

/* ---------- What it learns over time ---------- */
function LearnsOverTime() {
  const items = [
    {
      week: "Week one",
      title: "It learns the basics.",
      body: "How big your household is, roughly what you spend, and where you usually shop.",
    },
    {
      week: "First few weeks",
      title: "It starts recognising your rhythm.",
      body: "How often you shop, which categories matter most to you, and which brands you stay loyal to.",
    },
    {
      week: "Over time",
      title: "It starts helping before you ask.",
      body: "A heads-up before something runs low, a quieter store for your usual basket, a swap worth trying — only when it's confident.",
    },
  ];
  return (
    <section id="learns" className="py-20 lg:py-28 bg-surface border-y border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="What Household Advisor learns over time"
          title="It gets quieter and more useful, not louder."
        />
        <div className="mt-14 grid lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div
              key={item.week}
              className="relative rounded-3xl border border-border bg-background p-7"
            >
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {item.week}
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-balance">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              {i < items.length - 1 && (
                <div className="hidden lg:flex absolute top-7 -right-8 items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why households will love it ---------- */
function WhyHouseholdsLoveIt() {
  const cards = [
    {
      icon: HeartHandshake,
      title: "It adapts to you — not the other way round.",
      body: "We don't ask you to change how you shop. We learn how you already shop, and work around it.",
    },
    {
      icon: ShoppingBasket,
      title: "One recommendation at a time.",
      body: "No dashboards to interpret. Just the next sensible thing to do, explained in plain language.",
    },
    {
      icon: Store,
      title: "Honest about what it doesn't know yet.",
      body: "If we're not confident, we say so — instead of guessing and calling it intelligence.",
    },
    {
      icon: Clock,
      title: "Respects your time.",
      body: "A bill takes seconds to add. Everything else happens quietly in the background.",
    },
  ];
  return (
    <section id="why" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Why households will love it"
          title="Built to feel like help, not homework."
        />
        <div className="mt-14 grid sm:grid-cols-2 gap-5">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-3xl border border-border bg-surface p-7 flex gap-5"
            >
              <div className="h-11 w-11 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight text-lg">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Trust ---------- */
function Trust() {
  const points = [
    {
      icon: Lock,
      title: "Bills are never stored.",
      body: "We read what's needed to understand your purchase, then discard the image.",
    },
    {
      icon: Eye,
      title: "Nothing is guessed and presented as fact.",
      body: "Every number you see is gated by how much real data backs it — thin data means an honest 'still learning,' not a fabricated figure.",
    },
    {
      icon: ShieldCheck,
      title: "Your data builds your household's profile only.",
      body: "It's never sold, and it's never used to build a profile of you for anyone else.",
    },
  ];
  return (
    <section className="py-20 lg:py-28 bg-surface border-y border-border">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading eyebrow="Privacy & trust" title="Trust is the product, not a footnote." />
        <div className="mt-14 grid lg:grid-cols-3 gap-5">
          {points.map((p) => (
            <div key={p.title} className="rounded-3xl border border-border bg-background p-7">
              <div className="h-11 w-11 rounded-2xl bg-foreground text-background flex items-center justify-center">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-semibold tracking-tight text-lg">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Screenshots ---------- */
function Screenshots() {
  const frames = [
    {
      label: "Your Household",
      body: "A plain-language read on how your household shops — and why we think so.",
    },
    {
      label: "Compare My Basket",
      body: "See your basket priced across the stores you'd actually consider.",
    },
    { label: "Shopping List", body: "Built from what you usually buy, not a blank page." },
  ];
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="A look inside"
          title="Calm, focused screens — once you're in."
          body="The app itself stays simple on purpose: one idea per screen, never a feed to scroll through."
        />
        <div className="mt-14 grid sm:grid-cols-3 gap-5">
          {frames.map((f) => (
            <div key={f.label} className="rounded-3xl border border-border bg-surface p-2">
              <div className="rounded-[1.25rem] border border-border bg-background aspect-[9/14] p-5 flex flex-col">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {f.label}
                </div>
                <div className="mt-4 flex-1 flex items-center">
                  <p className="text-base font-medium leading-snug text-balance">{f.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Beta journey ---------- */
function BetaJourney() {
  return (
    <section id="beta" className="py-20 lg:py-28 bg-surface border-y border-border">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <SectionHeading eyebrow="Beta" title="We're early, and we're saying so." />
        <div className="mt-10 rounded-3xl border border-border bg-background p-8 lg:p-10">
          <p className="text-lg leading-relaxed text-pretty">
            Household Advisor is in beta. We're not chasing numbers — we're working closely with a
            small group of founding households to get the experience right before opening up
            further.
          </p>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Built with early households. If something confuses you, there's a small feedback button
            on every screen — we read every single one.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/household"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Join our founding beta community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              No fees during beta
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function Faq() {
  const faqs = [
    {
      q: "Do I need to upload a bill to get started?",
      a: "No. Building your household profile takes a couple of minutes on its own. Adding a bill is optional, and it makes everything sharper from there.",
    },
    {
      q: "What happens to a bill once I upload it?",
      a: "We read what's needed to understand the purchase — store, items, prices — and the image itself is never stored.",
    },
    {
      q: "Is this only useful once I have a lot of history?",
      a: "No. You'll get a household profile immediately. Recommendations that depend on real purchase history will honestly say 'still learning' until there's enough data to be confident.",
    },
    {
      q: "Is it free during the beta?",
      a: "Yes. There are no fees during beta — we want honest feedback, not friction.",
    },
    {
      q: "How do I give feedback?",
      a: "There's a quiet feedback button on every screen inside the app. You can also reach us directly — we read everything personally.",
    },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Good questions, answered plainly." />
        <div className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-medium text-base lg:text-lg">{f.q}</span>
                  <span
                    className={`shrink-0 h-7 w-7 rounded-full border border-border flex items-center justify-center text-base leading-none transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm lg:text-base text-muted-foreground leading-relaxed pr-10">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function FinalCta() {
  return (
    <section className="py-24 lg:py-32 bg-surface border-t border-border">
      <div className="mx-auto max-w-3xl px-5 lg:px-8 text-center">
        <Check className="h-9 w-9 mx-auto text-accent" />
        <h2 className="mt-6 text-3xl lg:text-5xl font-semibold tracking-tight text-balance">
          Join the beta and help shape what comes next.
        </h2>
        <p className="mt-4 text-base lg:text-lg text-muted-foreground text-pretty">
          A few minutes to build your household profile. No bill required to start, no fees during
          beta.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/household"
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity"
          >
            Join the beta
            <ArrowRight className="h-4 w-4" />
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
          <span>© 2026 Household Advisor · Built with early households</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/feedback" className="hover:text-foreground">
            Feedback
          </Link>
          <Link to="/today" className="hover:text-foreground">
            Open My Household
          </Link>
        </div>
      </div>
    </footer>
  );
}
