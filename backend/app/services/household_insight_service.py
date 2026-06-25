"""Generates the "immediate insight" shown after each onboarding step.

Hard constraint from the product decision this implements: no comparisons
to other households, no percentile claims, no "similar households spend X"
— Phase 1 beta has no real cohort to compare against, and inventing one
would violate the project's standing rule against fabricated data. Every
insight here is computed from either (a) arithmetic on the user's own
answer, or (b) a reflective restatement of the user's own selections — never
an external or invented statistic.
"""

from app.domain.models import Household, ShoppingBehavior, ShoppingStyle

_QUICK_COMMERCE = {"blinkit", "zepto"}

_FREQUENCY_INSIGHT = {
    "weekly": "Shopping weekly gives you more room to time purchases around restocking needs before you run out.",
    "biweekly": "Every two weeks is frequent enough to catch most restocking needs without daily trips.",
    "monthly": "Monthly shopping works well for staples, but perishables may need a top-up trip in between.",
    "as-needed": "As-needed shopping can mean more frequent small trips — pantry tracking may help you plan ahead instead.",
}

_PRIORITY_LABELS = {
    frozenset({"save_money", "bulk_buyer"}): "Price-conscious planner",
    frozenset({"save_money", "offer_seeker"}): "Deal-driven shopper",
    frozenset({"premium_brands", "quality"}): "Quality-focused shopper",
    frozenset({"health_focused"}): "Health-focused shopper",
    frozenset({"convenience_first"}): "Convenience-first shopper",
}


def household_profile_insight(household: Household) -> str:
    if not household.monthly_grocery_budget or household.size <= 0:
        return "Add your monthly grocery budget to see a per-person breakdown."
    per_person = float(household.monthly_grocery_budget) / household.size
    return (
        f"That's about ₹{per_person:,.0f} per person per month, based on your household size "
        f"of {household.size}."
    )


def shopping_behavior_insight(behavior: ShoppingBehavior) -> str:
    insights = []
    stores = {s.lower() for s in behavior.stores}
    if stores and stores.issubset(_QUICK_COMMERCE):
        insights.append(
            "You shop exclusively on quick-commerce — convenient, but these platforms often carry a "
            "price premium compared to planned shopping trips."
        )
    elif stores & _QUICK_COMMERCE and len(stores) > 1:
        insights.append(
            "Mixing quick-commerce with planned-trip stores can balance convenience against cost."
        )
    elif len(stores) > 1:
        insights.append(
            "Shopping across multiple stores can open up more price comparison opportunities as we learn "
            "your frequent categories."
        )

    frequency_note = _FREQUENCY_INSIGHT.get(behavior.frequency.lower())
    if frequency_note:
        insights.append(frequency_note)

    return " ".join(insights) if insights else "Thanks — we'll use this to tailor future recommendations."


def shopping_style_insight(style: ShoppingStyle) -> str:
    priorities = frozenset(p.lower() for p in style.priorities)
    for known, label in _PRIORITY_LABELS.items():
        if known.issubset(priorities):
            return f"Based on your selections, you appear to be a: {label}."
    if priorities:
        return "Thanks — we've recorded your shopping priorities to tailor future recommendations."
    return "Select at least one priority to get a personalized shopping-style label."
