# Household Advisor — Design Philosophy

**Role split, made explicit:** This document is the design direction. Claude (with the product owner) defines it; Lovable executes it screen by screen. Lovable does not invent direction — it builds to spec and is held to the audit at the bottom of this document on every screen, every time.

## The One-Sentence Brief

The app should feel like opening Apple Health in the morning, not like logging into a dashboard. The interface disappears; the household feels guided.

## Principles (in priority order — when two conflict, the higher one wins)

1. **One sentence beats one card.** If a card's content can be said in a sentence, it becomes a sentence. Cards are reserved for things that genuinely need a contained shape (an action, a comparison, a list).
2. **Typography creates hierarchy, not chrome.** Size and weight and spacing do the work that borders, background tints, and shadows currently do.
3. **Calm over complete.** Showing less but trustworthy beats showing everything we technically have data for. (This is the same principle already governing the real-data-gating pattern in the code — the design philosophy and the data philosophy are the same philosophy.)
4. **One recommendation, not a feed.** Every screen leads with the single most useful thing, not a list of five things competing for attention.
5. **Native before novel.** Mobile-first, thumb-reachable, platform-idiomatic motion. Never a desktop layout shrunk to fit a phone.

## Visual Language

**Color** — Warm neutrals as the base (think paper, not white; charcoal, not black). One accent color, used sparingly and only to mean "this needs your attention" — never decoratively, never as a dashboard category color-key. No gradients. No drop shadows beyond the faintest elevation cue. Light and dark mode both built from the same warm-neutral logic, not inverted black.

**Typography scale** — Few sizes, each with a clear job:
- Display (the "Good Evening, Baseer" line): large, set apart, the first thing the eye lands on.
- Body: comfortable reading width (~60-75 characters per line on mobile), generous line-height.
- Caption/meta: small, muted, used for timestamps and secondary context only.
No more than 3-4 sizes total. Weight (regular/medium/semibold) does most of the hierarchy work, not size jumps.

**Spacing scale** — One consistent step system (e.g. 4/8/12/16/24/32/48/64). Default to the next size up whenever unsure — breathing room is the brand, not a side effect.

**Surfaces** — Minimal borders. Where a boundary is needed, prefer a soft background tint over a hard 1px line. Rounded corners throughout, consistent radius scale (not ad hoc per component).

**Icons** — Used only where they remove ambiguity a word couldn't. Never icon-only tap targets without a text label nearby. Fewer icons overall than today's interface.

**Motion** — Only meaningful transitions: a recommendation gently appearing, a card expanding to reveal detail, a confidence number visibly growing. No decorative animation, no motion for its own sake.

**Empty states** — Calm and helpful, never apologetic or childish. They explain what will appear and why it isn't there yet (consistent with the existing "we don't fabricate" data principle).

## Household HQ — Redesigned (reference layout)

This replaces the current stat-strip-plus-five-cards Home with something closer to a daily briefing:

```
Good Evening, Baseer

Your household is doing well.
Your next shopping trip is likely this weekend.
Milk may run low before then.

──────────────
Today's Recommendation
──────────────
[the single highest-value action — one sentence + one tap]

──────────────
Continue Shopping Plan
──────────────

──────────────
Recent Memory
──────────────
[one line — most recent thing learned]

Learn More →
```

Everything currently on Home that isn't one of these — the Household Intelligence Score breakdown, Shopping DNA, the Weekly Action Cards, the charts — still exists, but moves one tap deeper ("Learn More"), not on the first screen. The first screen answers "how is my household doing and what's the one thing I should know," nothing else.

## Component System (what Lovable should build, once, and reuse everywhere)

- Typography tokens (the scale above)
- Color tokens (warm neutral surfaces + one accent, light/dark)
- Spacing tokens
- One Card primitive (used sparingly per Principle 1)
- One Button primitive (primary/secondary/text — no more than 3 variants)
- One Sheet/bottom-drawer primitive (for "Learn More" style drill-ins, replacing full-page navigation where it's just "show me more about this one thing")
- One bottom navigation primitive
- One empty-state primitive

Every new screen pulls from this set. No screen invents its own card style, its own spacing, its own shade of border.

## The Design Audit (apply to every screen, before and after Lovable touches it)

For each screen, answer plainly:
- Would Apple ship this?
- Would Notion ship this?
- Would Airbnb ship this?
- Does it feel like software, or like assistance?
- Could any card here be a sentence instead?
- Is there exactly one primary recommendation, or is it competing with several?

Any "no" / "feels like software" / "more than one primary thing" sends the screen back for another pass — restyling within the old layout doesn't pass the audit; the layout itself has to be challenged.

## What This Replaces

Remove anything that currently reads as: dashboard, admin panel, SaaS analytics tool, developer UI, prototype, or demo. That includes today's stat-strip hero, the five-card Weekly Action feed treated as five equal boxes, and any screen whose first impression is "here is data" rather than "here is what you should know."

## Working Relationship With Lovable

Lovable's job is implementation against this document and the component system above — not invention of new direction. When a screen is redesigned: state the brief from this document, point to the reference layout where one exists, and run the Design Audit on the result before accepting it. If Lovable's output drifts from this philosophy (extra cards, new ad hoc colors, decorative motion), that's a rejection, not a starting point to negotiate from.
