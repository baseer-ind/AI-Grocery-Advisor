// Realistic sample data for the AI Household Purchase Advisor prototype.
// No backend integration — every page reads from here.

export const householdProfile = {
  size: "3-4" as const,
  budget: "10,000–15,000" as const,
  shoppingStyle: "Mix of Both" as const,
  topPriorities: ["Save Money", "Get Best Value", "Optimize Monthly Spending"],
  brandFlexibility: "Switch if Similar" as const,
  memberships: ["Amazon Prime", "BigBasket Membership"],
  rankedFactors: ["Price", "Quality", "Offers", "Reviews", "Brand", "Delivery Speed"],
};

export const dashboardSummary = {
  currentSpend: 9250,
  optimizedSpend: 8050,
  potentialSavings: 1200,
  householdScore: 78,
};

export const monthlySpendTrend = [
  { month: "Jan", spend: 8600, optimized: 7700 },
  { month: "Feb", spend: 8900, optimized: 7850 },
  { month: "Mar", spend: 9100, optimized: 7950 },
  { month: "Apr", spend: 8950, optimized: 7900 },
  { month: "May", spend: 9400, optimized: 8100 },
  { month: "Jun", spend: 9250, optimized: 8050 },
];

export const categoryDistribution = [
  { name: "Staples", value: 2400, color: "#4f46e5" },
  { name: "Snacks", value: 2050, color: "#f59e0b" },
  { name: "Dairy", value: 1500, color: "#0ea5e9" },
  { name: "Personal Care", value: 1300, color: "#10b981" },
  { name: "Beverages", value: 1100, color: "#ec4899" },
  { name: "Cleaning", value: 900, color: "#8b5cf6" },
];

export const billUploadResult = {
  fileName: "BigBasket_June_Order.pdf",
  productsFound: 24,
  categories: 7,
  totalSpend: 9250,
  items: [
    { name: "Aashirvaad Atta 5kg", category: "Staples", price: 285 },
    { name: "Fortune Sunflower Oil 5L", category: "Staples", price: 1180 },
    { name: "Tata Salt 1kg", category: "Staples", price: 28 },
    { name: "Amul Butter 500g", category: "Dairy", price: 265 },
    { name: "Amul Milk 1L x 10", category: "Dairy", price: 620 },
    { name: "Lay's Classic Salted 90g x 4", category: "Snacks", price: 200 },
    { name: "Maggi Noodles 12-pack", category: "Snacks", price: 168 },
    { name: "Surf Excel 2kg", category: "Cleaning", price: 410 },
  ],
};

export const aiAnalysis = {
  currentSpend: 9250,
  optimizedSpend: 8050,
  potentialSavings: 1200,
  insights: [
    {
      title: "Snacks account for 22% of spending",
      detail: "That's ₹2,050 this month — above the 15% benchmark for households your size.",
      tone: "warning" as const,
    },
    {
      title: "Oil purchases are above market average",
      detail: "Fortune Sunflower Oil 5L was bought at ₹1,180; the tracked average across stores is ₹1,065.",
      tone: "danger" as const,
    },
    {
      title: "Rice was purchased at a higher than average price",
      detail: "₹68/kg paid vs. a ₹59/kg average observed across your saved stores this month.",
      tone: "warning" as const,
    },
    {
      title: "Savings opportunity detected",
      detail: "Switching 3 staples to better-priced stores and one alternate brand could save ₹1,200/month.",
      tone: "success" as const,
    },
  ],
  categoryBreakdown: [
    { name: "Staples", value: 2400 },
    { name: "Snacks", value: 2050 },
    { name: "Dairy", value: 1500 },
    { name: "Personal Care", value: 1300 },
    { name: "Beverages", value: 1100 },
    { name: "Cleaning", value: 900 },
  ],
};

export const basketOptions = {
  current: { label: "Current Basket", total: 9250 },
  options: [
    {
      id: "same-products",
      label: "Same Products, Different Stores",
      total: 8600,
      description: "Keep every product and brand identical — just reroute each item to its cheapest in-stock store.",
      tradeoffs: ["No quality or brand change", "May require ordering from 2 stores instead of 1"],
      recommended: false,
    },
    {
      id: "optimized-mix",
      label: "Optimized Store Mix",
      total: 8050,
      description: "Best overall balance of price, delivery speed, and store ratings across your basket.",
      tradeoffs: ["3 items move to a second store", "Average delivery time +12 minutes"],
      recommended: true,
    },
    {
      id: "alt-brands",
      label: "Alternative Brands",
      total: 7750,
      description: "Swaps 4 items for similarly-rated alternate brands at a lower price point.",
      tradeoffs: ["4 brand substitutions", "Rated within 0.2 stars of your usual picks"],
      recommended: false,
    },
  ],
};

export const pantryNeedToBuy = [
  { name: "Cooking Oil", reason: "Usually finished by now" },
  { name: "Milk", reason: "Last bought 6 days ago — weekly cadence" },
  { name: "Atta", reason: "Running low based on family size" },
];

export const pantryAvailable = [
  { name: "Rice", daysLeft: 18 },
  { name: "Sugar", daysLeft: 24 },
  { name: "Tea", daysLeft: 30 },
];

export const smartReorderSuggestions = [
  {
    name: "Cooking Oil",
    usuallyPurchasedEvery: "35 Days",
    lastPurchase: "32 Days Ago",
    recommendation: "Add To Next Basket",
    urgent: true,
  },
  {
    name: "Detergent Powder",
    usuallyPurchasedEvery: "28 Days",
    lastPurchase: "20 Days Ago",
    recommendation: "On Track",
    urgent: false,
  },
  {
    name: "Atta (5kg)",
    usuallyPurchasedEvery: "30 Days",
    lastPurchase: "29 Days Ago",
    recommendation: "Add To Next Basket",
    urgent: true,
  },
];

export const productIntelligence = {
  name: "Fortune Sunflower Oil 5L",
  currentPrice: 1180,
  averagePrice: 1065,
  lowestPrice: 980,
  highestPrice: 1240,
  recommendation: "WAIT" as const,
  recommendationReason:
    "Current price is 11% above the 90-day average. Prices have historically dipped in the first week of the month.",
  trend: [
    { date: "Jan", price: 1020 },
    { date: "Feb", price: 1050 },
    { date: "Mar", price: 1240 },
    { date: "Apr", price: 1100 },
    { date: "May", price: 980 },
    { date: "Jun", price: 1180 },
  ],
};

export const productCatalog = [
  { ...productIntelligence },
  {
    name: "Aashirvaad Atta 5kg",
    currentPrice: 285,
    averagePrice: 290,
    lowestPrice: 265,
    highestPrice: 310,
    recommendation: "GOOD_VALUE" as const,
    recommendationReason: "Priced at the 90-day average with high stock confidence — a safe time to buy.",
    trend: [
      { date: "Jan", price: 295 },
      { date: "Feb", price: 300 },
      { date: "Mar", price: 310 },
      { date: "Apr", price: 280 },
      { date: "May", price: 265 },
      { date: "Jun", price: 285 },
    ],
  },
  {
    name: "Tata Salt 1kg",
    currentPrice: 24,
    averagePrice: 27,
    lowestPrice: 22,
    highestPrice: 30,
    recommendation: "BUY_NOW" as const,
    recommendationReason: "Within 9% of the lowest price observed in 6 months — a strong time to stock up.",
    trend: [
      { date: "Jan", price: 28 },
      { date: "Feb", price: 27 },
      { date: "Mar", price: 30 },
      { date: "Apr", price: 26 },
      { date: "May", price: 25 },
      { date: "Jun", price: 24 },
    ],
  },
];

export const householdIntelligence = {
  monthlyTrend: monthlySpendTrend,
  categoryDistribution,
  topCategories: [
    { name: "Staples", share: 26 },
    { name: "Snacks", share: 22 },
    { name: "Dairy", share: 16 },
  ],
  brandLoyalty: [
    { brand: "Amul", category: "Dairy", loyaltyScore: 92 },
    { brand: "Aashirvaad", category: "Staples", loyaltyScore: 85 },
    { brand: "Tata", category: "Staples", loyaltyScore: 74 },
    { brand: "Surf Excel", category: "Cleaning", loyaltyScore: 61 },
  ],
  healthySpendingInsights: [
    "Snack spending is 18% higher than similar-sized households in your area.",
    "Sugary beverage purchases are above the household-size average this quarter.",
    "Fresh produce purchases are below average — consider adding more to your weekly basket.",
  ],
  potentialSavings: 1200,
};

export const advisorPrompts = [
  "How can I save ₹1,000 this month?",
  "Which products should I switch?",
  "Should I buy now or wait?",
  "Where should I buy rice this month?",
];

export const advisorResponses: Record<string, string> = {
  "How can I save ₹1,000 this month?":
    "Based on your last 3 bills, switching your oil and detergent purchases to BigBasket and moving your snack basket to a store with your active membership discount would save approximately ₹1,150 this month — close to your target. Want me to build that basket for you?",
  "Which products should I switch?":
    "I'd recommend switching Fortune Sunflower Oil to a similarly-rated store offer (saves ₹120/order) and your snack brand to a comparable alternative rated 4.3★ vs. your current 4.4★ — a negligible quality drop for an 18% price difference.",
  "Should I buy now or wait?":
    "For Fortune Sunflower Oil: wait. It's 11% above its 90-day average, and prices have historically dropped in the first week of the month. For Tata Salt: buy now — it's near its 6-month low.",
  "Where should I buy rice this month?":
    "DMart currently has your usual rice brand at ₹59/kg, ₹9/kg below what you paid last month. For your typical 10kg purchase, that's a ₹90 saving versus your last order.",
};

export const onlineStores = [
  { name: "Blinkit", price: 1180, confidence: "Verified" as const, rating: 4.3, recommendation: "Fast delivery" },
  { name: "Zepto", price: 1145, confidence: "Verified" as const, rating: 4.2, recommendation: "Best price online" },
  { name: "BigBasket", price: 1160, confidence: "Verified" as const, rating: 4.5, recommendation: "Most trusted" },
  { name: "Swiggy Instamart", price: 1190, confidence: "Verified" as const, rating: 4.1, recommendation: "—" },
];

export const localStores = [
  { name: "Ravi Kirana", price: 1100, confidence: "Medium" as const, rating: 4.0, recommendation: "3 matching observations", distanceKm: 0.8 },
  { name: "Lakshmi Stores", price: 1120, confidence: "Low" as const, rating: 3.8, recommendation: "Single observation — verify before relying on this", distanceKm: 1.4 },
  { name: "Fresh Mart", price: 1090, confidence: "High" as const, rating: 4.4, recommendation: "5 matching observations, tight price range", distanceKm: 1.1 },
];

export const premiumFeatures = [
  { name: "Unlimited Bill Analysis", description: "No monthly cap on bill uploads or AI analysis runs." },
  { name: "Historical Price Intelligence", description: "Full price-trend history, not just the last 30 days." },
  { name: "Household Optimization", description: "Personalized basket optimization tuned to your household profile." },
  { name: "Buy-Time Recommendations", description: "BUY NOW / WAIT verdicts for every product you track." },
  { name: "Price Alerts", description: "Get notified the moment a tracked product hits your target price." },
  { name: "Community Pricing Insights", description: "See verified local kirana prices near you, with confidence scores." },
];
