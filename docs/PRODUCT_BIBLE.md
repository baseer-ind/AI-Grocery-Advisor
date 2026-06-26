# Household Advisor Product Bible

This document is the philosophy of the product, not its technical documentation. It is the permanent reference for every future design and engineering decision. When a proposed change conflicts with this document, the document wins until it is deliberately revised — not silently overridden by a single feature request.

---

## 1. The Product Mission

Household Advisor exists to become a household's quiet, trusted shopping companion — something that understands how a household actually lives and shops, and helps it shop a little better over time, without ever asking the household to change how it lives to be understood.

It is not a bill scanner, not a budgeting dashboard, not a rewards app. Those are mechanisms it sometimes uses. The mission is the relationship: a household should feel *known*, not *tracked*.

---

## 2. The Experience Model

A household does not experience Household Advisor as a set of screens. It experiences it as a small number of recurring moments in its life — checking in, being understood, getting ready, and doing the shopping itself. Every route, feature, and card that has ever been built belongs to exactly one of these moments, or it does not belong in the product at all. The Experience Model is the discipline of always designing from the moment inward, never from a feature outward.

---

## 3. The Emotional Journey

A household's relationship with Household Advisor should move through four emotional states, in order, and never skip ahead of where the evidence actually is:

**Curiosity → Understanding → Confidence → Habit**

- **Curiosity** is the landing page's job: make a household want to find out whether this could understand them.
- **Understanding** is onboarding and the first weeks: the household sees itself reflected back accurately for the first time.
- **Confidence** is what real shopping history earns: recommendations that are right often enough that the household stops double-checking them.
- **Habit** is the destination: opening Household Advisor stops being a decision and becomes a reflex, the way checking a weather app is a reflex.

No screen should try to manufacture a later stage of this journey before the evidence for it exists. A household three days in should not be spoken to as if it has reached Habit. This is the emotional-journey form of the project's oldest rule — never fabricate certainty — applied to tone, not just numbers.

---

## 4. The Four Moments

### Today
*"What does my household need from me right now?"*

Today exists because a household should never have to go looking for what matters. It is the one moment that compresses everything else — household understanding, planning, shopping history — into a single, current answer. It exists so a household has exactly one place to check, the way you check one weather app, not five.

Everything that is genuinely "what should I know right now" belongs here. Nothing else does — Today is not a home page in the sitemap sense, it is the answer to one question, asked fresh every time.

### Household
*"Does Household Advisor actually understand us, and can we shape that understanding?"*

This moment exists because trust requires legibility. A household that cannot see what the product believes about it, correct it, or watch it grow more accurate over time has no reason to trust its conclusions. Identity, memory, taught facts, habits, unlocked capabilities — all of these are facets of one relationship, not separate features, and they all answer this one moment's question.

Anything that is about *what the product knows or is learning about this specific household* belongs here — and only here. The moment a feature splits this into a second "identity" surface elsewhere, it should be pulled back in.

### Prepare
*"What's coming up, and how do I get ready for it?"*

This moment exists because a household's relationship with shopping is mostly anticipatory — most of the value of understanding a household is in helping it get ahead of a trip before it happens, not reacting after the fact. Shopping lists, pantry predictions, cadence-based nudges ("you usually shop every five days; it's been six") all live here because they are forward-looking by nature.

Anything that helps a household get ready for something that hasn't happened yet belongs here.

### Record Shopping
*"I'm doing it right now — help me, or capture what just happened."*

This moment exists because shopping itself is a present-tense act that deserves its own focused space, separate from planning for it or reflecting on it afterward. Adding a bill, comparing a basket across stores, logging a purchase — these are all the household acting in the moment, not thinking ahead or looking back.

Anything that only makes sense *while* a household is transacting belongs here.

### Why nothing else is a fifth moment

Account settings, billing, feedback, and "what to expect" content are real and necessary, but they are not moments in a household's relationship with the product — they are the scaffolding around that relationship. They should be reachable, but never compete with the four moments for attention, and never be designed as if they were a fifth peer destination.

---

## 5. Product Principles

- **The assistant speaks first.** A household should never open a screen and have to figure out what it means. The product states its understanding in plain language before it shows any evidence for it.
- **Never force one teaching method.** A household may teach Household Advisor by uploading a bill, answering a question, or simply telling it a fact in plain words. No single method is the "real" path and the others a workaround.
- **One screen = one question.** Every screen should be answerable to the question "what is this screen for?" with a single sentence. If it takes two sentences, it is two screens wearing one skin.
- **Never fabricate certainty.** If the data is thin, the product says so honestly — "still learning" beats a confident-looking number built on one data point, always.
- **Evidence before statistics.** A household should be able to ask "why do you think that?" and get a plain-language reason before — or instead of — a chart.
- **Relationship before reporting.** The product should read like it knows you, not like it audited you.
- **Guidance before dashboards.** A trusted companion tells you what to do next; a dashboard makes you figure that out yourself from a wall of numbers.
- **Progress through understanding, not gamification.** A household earns more capability by being known better, not by completing streaks or chasing points.
- **Teach naturally.** Correcting or informing the product should feel like talking to it, not filling out a form for it.
- **Reduce cognitive load.** Every screen should leave a household with less to think about, not more.

---

## 6. Design Principles

- **Warm before clever.** A clever interaction that doesn't feel warm is the wrong trade.
- **Calm before busy.** When in doubt, remove, don't add.
- **Mobile before desktop.** Most households will meet this product on a phone, often while actually shopping — design from there outward.
- **Sentence before card.** State the conclusion in words first; let the card be the evidence, not the message.
- **Insight before chart.** A chart is for someone who wants to verify; the insight is for everyone else.
- **One action before many options.** Offer the household the one sensible next step before offering a menu of possible ones.

---

## 7. Decision Filter

Before building any future feature, ask:

**Which of the four moments — Today, Household, Prepare, Record Shopping — does it improve?**

If the honest answer is none, it should not be built, regardless of how interesting, technically impressive, or easy to ship it is. If the answer is "it's related to one of them," that is not sufficient — it must improve the moment's actual question, not merely live near it. This filter applies equally to a new screen, a new card, a new nav entry, and a new backend capability: the question is asked once, before any of them, not after the fact to justify what was already built.
