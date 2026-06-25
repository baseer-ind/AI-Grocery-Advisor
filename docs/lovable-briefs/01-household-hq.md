# Lovable Brief 01 — Household HQ (Home)

Implementation brief. Direction comes from `docs/DESIGN_PHILOSOPHY.md` — read that first; this brief applies it to one screen. Do not introduce new colors, card styles, icons, or motion beyond what's specified there.

## What screen this replaces

`frontend-v2/src/routes/today.tsx` — currently a stat-strip hero (Household Intelligence Score + sub-stats) followed by five `FeedCard`s (Weekly Action Cards), a milestones block, and progressive-disclosure charts. It reads as a dashboard. This brief turns it into a daily briefing.

## Goal

Opening the app should feel like opening Apple Health in the morning: one greeting, one read on how things are going, one thing to act on, one thing to remember. Everything else is one tap away, not on screen at once.

## Layout (top to bottom)

1. **Greeting + status line**
   - "Good [Morning/Afternoon/Evening], {firstName}." — time-of-day computed client-side.
   - One sentence on household status, written in plain language, not a stat. Source: the same signals already feeding `computeHouseholdIntelligenceScore()` and `computePlanningScore()`, but rendered as a sentence, not a number-first card. Example shape: "Your household is doing well. Your next shopping trip is likely this weekend." If a Predicted Pantry item is low, append it: "Milk may run low before then." If there isn't enough real data yet, this becomes the existing honest "still learning" narrative (`confidenceNarrative()`), not a fabricated status.
   - No card, no border, no background tint here — this is just type on the page background, largest text on the screen.

2. **Today's Recommendation**
   - Exactly one. The single highest-value item from what's currently the Weekly Action Cards set (likely-running-low item, next-shopping-trip nudge, store recommendation, spend-change, new recurring purchase) — pick the most actionable one, not all of them.
   - One sentence describing it + one primary action (tap to act, e.g. "Add to shopping list" or "View plan"). If nothing qualifies (no real data yet), this section becomes the single existing CTA ("Build your household profile" / "Add a bill") — never multiple empty cards.
   - This is the one place on the page that can look like a contained card (per Principle 1 — it's an action, not a fact).

3. **Continue Shopping Plan**
   - A single line + tap-through to the Shopping Planner, only shown if a plan exists in progress. Omitted entirely if there's nothing to continue — don't render an empty/disabled state for this one.

4. **Recent Memory**
   - One line: the single most recent thing learned about the household (from the existing Memory Timeline data). Not a list — just the latest entry, in sentence form ("We learned you usually shop on weekends.").
   - "Learn More →" tap-through to the full Household Knowledge page (`/knowledge`), where the Score breakdown, Shopping DNA, full Action Cards, charts, and full timeline all still live — moved here from the home screen, not deleted.

## Explicitly removed from the first screen

- The stat-strip hero with sub-stats (Score number, profile confidence %, pantry confidence %) — moves to `/knowledge` behind "Learn More."
- All five `FeedCard`s as a stacked list — collapses to the single "Today's Recommendation."
- The milestones block — replaced by the one-line "Recent Memory."
- Charts (`monthlyTrend`/`categories`) — move to `/knowledge` or a dedicated detail view, not on Home.

## Visual spec

- Background: warm neutral surface (per Design Philosophy color tokens), not white/gray dashboard background.
- Greeting: Display-scale type, no container.
- Status sentence: Body-scale, comfortable line length, muted-but-readable color (not full-strength caption gray).
- Section dividers (between Recommendation / Continue Plan / Recent Memory): a plain horizontal rule or whitespace gap — not boxed sections with borders on all sides.
- Today's Recommendation: the one Card primitive on this screen, rounded, soft elevation, no harsh border.
- "Learn More" and "Continue Shopping Plan": text links/buttons, not icon-only.
- No charts, no progress rings, no colored category chips on this screen.

## Data sources (no new backend calls — everything already exists)

- `getHouseholdProfile()` — name, profile signals
- `computeHouseholdIntelligenceScore()` / `computePlanningScore()` (`lib/household-intelligence.ts`) — feed the status sentence, not displayed as numbers here
- `getPredictedPantry()` (`lib/api.ts`) — low-stock item for the status line / recommendation
- existing Weekly Action Cards logic — pick the top one instead of rendering all
- `buildHouseholdTimeline()` (`lib/household-timeline.ts`) — most recent entry for Recent Memory
- existing Shopping Planner state — for Continue Shopping Plan

## Mobile

This is the primary target — assume phone width first. Generous top padding so the greeting doesn't feel cramped under the status bar. Today's Recommendation card and any buttons must be comfortably thumb-reachable (lower half of a one-handed phone grip where possible).

## Acceptance — run the Design Audit before calling this done

- Would Apple ship this? Would Notion ship this? Would Airbnb ship this?
- Is there exactly one primary recommendation on screen, not several competing?
- Could anything still on screen be cut to a sentence?
- Does the first impression read "here's how you're doing," not "here's your data"?

If any answer is no, it goes back for another pass — restyling the existing stat-strip/five-card layout in new colors does not satisfy this brief.
