# Beta Learning Plan

This document governs the first 5–20 households. It exists so that beta is judged by what we learned, not by what we shipped. The Product Bible defines what Household Advisor is; this document defines how we'll find out whether reality agrees with it.

---

## Mission

Beta exists to learn, not to prove perfection. We are not launching a finished product to validate that it works — we are placing a deliberately small, frozen surface in front of real households to find out which of our beliefs about them are true. Every metric, hypothesis, and interview question below exists to answer one question honestly: does this match how a household actually lives and shops, or only how we imagined it would? Until that's answered with real evidence, we do not build further.

---

## Success Metrics

- **Onboarding Completion Rate** — % of households that start `/household` and reach the Snapshot step.
- **Time to First Useful Insight** — time from onboarding completion to the first moment Today shows a real (non-"still learning") readiness sentence or action card.
- **Time to First Trust** — the first moment a household says, in their own words (interview or feedback form), "yes, that's us" — about the household identity, a recommendation, or a predicted pantry item. Not a click event; a stated reaction.
- **First Shopping Event Created** — time from onboarding to first real bill upload or manual list addition.
- **Teaching Method Chosen** — which method (bill upload, manual product entry, plain-text correction) each household reaches for first and most often.
- **7-Day Return Rate** — % of onboarded households that open the app again within 7 days.
- **Recommendation Acceptance** — % of Weekly Action Cards that lead to the suggested action (e.g., "Add to list" tapped) vs. ignored.
- **Household Understanding Growth** — change in profile/pantry/planning confidence over the household's first 2 weeks.

---

## Product Hypotheses

**Do households naturally understand the product?**
- *Evidence required:* Onboarding completion rate ≥70%; in interviews, households can describe in their own words what Household Advisor does without being prompted.
- *Decision if confirmed:* Leave onboarding and landing copy as-is; invest learning budget elsewhere.
- *Decision if rejected:* Revisit onboarding copy/sequence before adding any new capability — confusion at the door invalidates everything downstream.

**Do households use multiple teaching methods?**
- *Evidence required:* At least 3 of the first 10 households use two or more of (bill upload / manual entry / plain-text correction) within their first two weeks.
- *Decision if confirmed:* Keep all three paths equally prominent; no action needed.
- *Decision if rejected:* Investigate whether the unused method(s) are discoverable at all before assuming households don't want them.

**Do households revisit Household (the "what we know about you" screens)?**
- *Evidence required:* ≥30% of returning households visit `/knowledge`, `/teach`, `/unlocks`, `/habits`, or `/products` more than once in two weeks.
- *Decision if confirmed:* The six-route Household-moment sprawl identified in the Product Alignment Sprint is tolerated by real usage; defer any consolidation.
- *Decision if rejected:* This is the strongest signal yet to consolidate the six Household routes into one destination — but only act once this evidence exists, not before.

**Do households miss Bill Check, now that it's removed?**
- *Evidence required:* Three or more households independently ask, unprompted, for a way to see "what I spent" or "compare stores" in more depth than Today's action cards provide.
- *Decision if confirmed:* Design a real bill-analysis surface from first principles, built on actual per-bill data — not a revival of the old sample-data screen.
- *Decision if rejected:* Bill Check stays removed indefinitely. Inline insights on Today were sufficient.

**Do households want deeper shopping reports?**
- *Evidence required:* Same three-or-more threshold, specifically for category breakdowns, spend trends, or comparison charts (distinct from "I miss Bill Check" — this is about depth, not the destination).
- *Decision if confirmed:* Propose a detail view (Option B from the Bill Check review) attached to Shopping Timeline, not a new standalone destination.
- *Decision if rejected:* Today's sentence-first action cards remain the only reporting surface in the product.

**Do households naturally build shopping lists, or do they expect the list to build itself from pantry predictions?**
- *Evidence required:* Track ratio of manually-added planner items vs. items that came from Predicted Pantry's "running low" bucket.
- *Decision if confirmed (manual-first):* Make manual add more prominent in This Week.
- *Decision if confirmed (prediction-first):* Manual add can recede further; predicted pantry becomes the primary list-building mechanism.

---

## Interview Learning Goals

Behavioral questions, not feature requests:

- What confused them in the first five minutes?
- Where did they hesitate before tapping something?
- When did they smile, or react out loud?
- What surprised them — in a good way or a bad way?
- What made them trust (or distrust) a specific recommendation?
- When did they stop reading and start skimming?
- Did they notice the assistant's tone, or did it go unnoticed (which is also useful data)?
- What did they try to do that the product had no answer for?
- Did they ever feel like the product was guessing instead of knowing?

---

## Founder Dashboard

The only metrics that matter during beta — not vanity metrics:

- Households onboarded
- Households returning (7-day)
- First Trust achieved (count + median time-to)
- Shopping events recorded
- Teaching events completed, by method
- Recommendation acceptance rate
- Top confusion points (from interviews/feedback, not guessed)
- Top requested capability (only counted once 3+ households independently ask)
- Most ignored screen (lowest repeat-visit rate among Household-moment routes)

---

## Discipline

If fewer than three households independently reveal the same need, we observe — we do not build. The Product Bible's Decision Filter applies to beta-era requests exactly as it applies to internal ideas: a single household's request is a data point, not a mandate. Three independent ones are evidence. The job during this phase is to tell the difference, every time, and resist the urge to build ahead of it.
