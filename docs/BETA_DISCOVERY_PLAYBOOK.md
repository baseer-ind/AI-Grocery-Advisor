# Household Advisor — Product Discovery Bible (Beta Discovery Playbook)

**Internal use only. Not for users.**

This is the single source of truth for every interview, bug, insight, and request collected during the beta validation phase. Its purpose is to let patterns emerge instead of anecdotes accumulating. Every person running an interview should fill the Observation Log using this document — not their memory.

## Mission

Our goal is NOT to prove that the product is good. Our goal is to discover why households would or would not adopt it. Every interview should increase our understanding.

## North Star Metric — "Households Helped"

A household is considered "helped" if, during a session, they either:
- Act on a recommendation.
- Teach the assistant something new.
- Improve their shopping plan.
- Complete a shopping event.
- Return because the app provided ongoing value.

This keeps the team focused on usefulness rather than engagement alone. Do not substitute DAU, Shopping Events count, or Bills Uploaded for this metric — those measure activity, not whether the household was actually helped.

## Positioning (for reference during interviews — not to be read aloud to testers)

1. **What does Household Advisor do?** Household Advisor learns how your family shops over time and helps you plan smarter, reduce waste, and make better shopping decisions with less manual effort.
2. **Why should someone open it every week?** Because the predictions and recommendations get sharper the more it knows, so checking in is how the assistant gets useful for you specifically, not generic advice.
3. **What makes it different from expense trackers/grocery apps?** Those record what happened; this forms an opinion about who you are as a household and acts on it before you ask.

The test: can a beta tester answer these three questions consistently after five minutes of unguided use? If not, that's a finding, not a failure to fix immediately.

## Success Metrics

**Primary**
- Household completes onboarding.
- Household understands the product.
- Household returns within 7 days.

**Secondary**
- Shopping Event created.
- Household teaches the assistant.
- Shopping Planner used.
- Interactive Demo explored.
- Feedback submitted.

## Staged Beta Rollout

### Phase 1 — Founder Validation (3 households)
Goal: validate the interview process itself, not the product. 45–60 minutes per household. Observe. Don't teach. Refine your questions before scaling.

### Phase 2 — Guided Beta (10 households)
Once questions are validated, observe a deliberately diverse set: parents, working professionals, homemakers, elderly, students.

### Phase 3 — Silent Beta (20–30 households)
Stop helping. Just send the link. Measure behavior. No guided interviews — pure usage telemetry/behavior.

---

## Interview Script

### Before Using
Ask before showing the product at all. **Do NOT explain Household Advisor yet.**
1. Tell me about how your household currently plans grocery shopping.
2. Who usually makes shopping decisions?
3. Do you maintain a shopping list?
4. Do you keep track of spending?
5. What's the most frustrating part of household shopping?

### First Impression
Observe only, record — do not prompt.
- How long before they click something?
- What do they click first?
- Do they understand what the product does?
- Do they ask questions?
- Do they hesitate?
- Do they ignore something?

### During Usage
Never tell them what to click. Instead ask:
- "What are you thinking right now?"
- "What would you expect to happen?"
- "What would you click next?"

### After Onboarding
- What did you expect to see?
- What surprised you?
- Does the Home screen make sense?
- What would you do next?

### Weekly Value
- Would this help you before shopping?
- Would this help you after shopping?
- Would you check this every week? Why? Why not?

### Trust
- Did any recommendation surprise you?
- Did anything feel unrealistic?
- Did you believe the recommendations? Why?

### Bill Upload
Ask only if they naturally reach it. Do not force testing. Observe whether they want to upload or prefer another way.

### Closing Questions
- If this app disappeared tomorrow, would you miss it?
- What would you miss most?
- If you could change one thing, what would it be?

---

## Observation Log

Fill one per household, immediately after the session.

| Field | Notes |
|---|---|
| Household ID | |
| Age Group | |
| Household Size | |
| Primary Shopper | |
| Shopping Frequency | |
| Stores Used | |
| Interview Date | |
| Completion Time | |
| Confusion Points | |
| Favourite Feature | |
| Most Valuable Screen | |
| Least Valuable Screen | |
| Would Use Again | |
| Would Recommend | |
| Top Three Quotes | |

---

## Weekly Review Process

Group feedback into themes. Never prioritize one-off requests. Only prioritize ideas requested independently by at least 40% of households. Focus on repeated confusion, repeated delight, repeated requests; ignore isolated opinions unless they reveal a deeper usability problem.

## What We Will NOT Build During Beta

Better OCR, more recommendation cards, more dashboards, more analytics, more identity types — build something only if multiple households independently request it.

## Product Principles

- Never fabricate.
- Never overwhelm.
- Always explain why.
- The assistant learns. The user should not have to manage it.
- Every recommendation should help the household make a better decision.
