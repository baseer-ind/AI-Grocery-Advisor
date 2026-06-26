// The Reflection Layer — turns whatever a household has genuinely shared
// (onboarding answers, taught facts, frequently purchased products) into a
// handful of natural-language sentences. Every sentence here must trace back
// to real stored data; nothing is templated per-screen or hardcoded as a
// generic greeting. Two households with different data get different
// reflections — that's the entire point.
import { getFrequentProducts, getHouseholdProfile, getTaughtFacts } from "@/lib/real-data";

const FREQUENCY_PHRASE: Record<string, string> = {
  weekly: "about once a week",
  biweekly: "about every two weeks",
  monthly: "about once a month",
  "as-needed": "only when you need to, not on a fixed schedule",
};

const PRIORITY_SENTENCE: Record<string, string> = {
  bulk_buyer: "You like buying in bulk to save trips.",
  save_money: "You're focused on saving money where you can.",
  offer_seeker: "You like to chase deals and offers.",
  premium_brands: "You prefer premium brands.",
  quality: "Quality matters most to you when shopping.",
  health_focused: "You shop with health in mind.",
  convenience_first: "Convenience comes first for you.",
};

export function getReflections(limit = 4): string[] {
  const profile = getHouseholdProfile();
  const facts = getTaughtFacts();
  const products = getFrequentProducts();

  const sentences: string[] = [];

  if (profile?.size) {
    sentences.push(
      `There ${profile.size === 1 ? "is" : "are"} ${profile.size} ${profile.size === 1 ? "person" : "people"} in your household.`,
    );
  }

  if (profile?.frequency && FREQUENCY_PHRASE[profile.frequency]) {
    sentences.push(`You usually shop ${FREQUENCY_PHRASE[profile.frequency]}.`);
  }

  const priority = profile?.priorities?.find((p) => PRIORITY_SENTENCE[p]);
  if (priority) {
    sentences.push(PRIORITY_SENTENCE[priority]);
  }

  if (profile?.stores && profile.stores.length > 0) {
    const list =
      profile.stores.length === 1
        ? profile.stores[0]
        : `${profile.stores.slice(0, -1).join(", ")} and ${profile.stores[profile.stores.length - 1]}`;
    sentences.push(`You usually shop at ${list}.`);
  }

  if (facts.length > 0) {
    sentences.push(facts[0].text);
  }

  if (products.length > 0) {
    const named = products.slice(0, 2).map((p) => p.name);
    const rest = products.length - named.length;
    const suffix =
      rest > 0
        ? `, including ${named.join(" and ")}, and ${rest} more`
        : ` — ${named.join(" and ")}`;
    sentences.push(
      `You've told us about ${products.length} thing${products.length === 1 ? "" : "s"} you regularly buy${suffix}.`,
    );
  }

  return sentences.slice(0, limit);
}

export function hasAnyMemory(): boolean {
  return getReflections(1).length > 0;
}
