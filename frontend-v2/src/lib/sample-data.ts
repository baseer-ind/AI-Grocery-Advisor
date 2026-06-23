export const household = {
  name: "Baseer",
  familySize: "3-4",
  monthlyBudget: "₹15,000–25,000",
  shoppingStyle: "Mix of Both",
  primaryGoal: "Save Money",
  score: 84,
  memberships: ["Amazon Prime", "BigBasket Membership"],
};

export const metrics = {
  currentSpend: 9250,
  optimizedSpend: 7950,
  potentialSavings: 1300,
  lastMonthSpend: 9850,
};

export const monthlyTrend = [
  { month: "Mar", spend: 8200, optimized: 7100 },
  { month: "Apr", spend: 9400, optimized: 7800 },
  { month: "May", spend: 8950, optimized: 7600 },
  { month: "Jun", spend: 10200, optimized: 8400 },
  { month: "Jul", spend: 9850, optimized: 8200 },
  { month: "Aug", spend: 9250, optimized: 7950 },
];

export const categories = [
  { name: "Staples", value: 2840, color: "var(--color-primary)" },
  { name: "Snacks", value: 2035, color: "var(--color-accent)" },
  { name: "Dairy", value: 1480, color: "var(--color-warning)" },
  { name: "Produce", value: 1290, color: "var(--color-success)" },
  { name: "Beverages", value: 985, color: "var(--color-muted-foreground)" },
  { name: "Household", value: 620, color: "var(--color-destructive)" },
];

export const basketOptions = [
  {
    id: "current",
    label: "Current Basket",
    cost: 9250,
    items: 42,
    note: "Your existing shop",
    badge: null,
    recommended: false,
  },
  {
    id: "same",
    label: "Keep Same Products",
    cost: 8900,
    savings: 350,
    items: 42,
    note: "Re-time purchases across the next 3 weeks",
    badge: "Lowest Effort",
    recommended: false,
  },
  {
    id: "stores",
    label: "Switch Stores",
    cost: 8250,
    savings: 1000,
    items: 42,
    note: "Split across BigBasket, DMart and a local kirana",
    badge: "Balanced",
    recommended: false,
  },
  {
    id: "brands",
    label: "Switch Similar Brands",
    cost: 7950,
    savings: 1300,
    items: 42,
    note: "Equal quality alternatives with strong reviews",
    badge: "Recommended",
    recommended: true,
  },
];

export const aiFindings = [
  {
    label: "Snacks heavy",
    body: "Snacks account for 22% of spending — well above the 14% average for households your size.",
    tone: "warning" as const,
  },
  {
    label: "Cooking oil",
    body: "You bought 10L of cooking oil this month — about 1.6× your usual rhythm. You can skip next month.",
    tone: "info" as const,
  },
  {
    label: "Rice premium",
    body: "Rice was 8% higher than the regional market average. BigBasket has the same brand 6% cheaper.",
    tone: "warning" as const,
  },
  {
    label: "Strong wins",
    body: "Dairy and produce were bought at the right time — you saved ₹240 versus last month.",
    tone: "success" as const,
  },
];

export const products = [
  {
    name: "Fortune Sunflower Oil",
    size: "5L",
    current: 920,
    avg: 965,
    low: 880,
    high: 1080,
    recommendation: "BUY NOW",
    confidence: 92,
    reason: "Priced ₹45 below your 6-month average and supply is steady.",
    trend: [
      { d: "Mar", p: 980 },
      { d: "Apr", p: 1040 },
      { d: "May", p: 1080 },
      { d: "Jun", p: 1010 },
      { d: "Jul", p: 950 },
      { d: "Aug", p: 920 },
    ],
  },
  {
    name: "Daawat Basmati Rice",
    size: "5kg",
    current: 745,
    avg: 690,
    low: 620,
    high: 760,
    recommendation: "WAIT",
    confidence: 78,
    reason: "Above average. Harvest season typically drops price ~₹70 in 3 weeks.",
    trend: [
      { d: "Mar", p: 660 },
      { d: "Apr", p: 670 },
      { d: "May", p: 680 },
      { d: "Jun", p: 700 },
      { d: "Jul", p: 720 },
      { d: "Aug", p: 745 },
    ],
  },
  {
    name: "Amul Gold Milk (subscription)",
    size: "1L × 30",
    current: 1740,
    avg: 1740,
    low: 1680,
    high: 1800,
    recommendation: "GOOD VALUE",
    confidence: 88,
    reason: "Flat pricing all year. Subscription beats one-off purchases by ~6%.",
    trend: [
      { d: "Mar", p: 1740 },
      { d: "Apr", p: 1740 },
      { d: "May", p: 1740 },
      { d: "Jun", p: 1740 },
      { d: "Jul", p: 1740 },
      { d: "Aug", p: 1740 },
    ],
  },
];

export const topProducts = [
  { name: "Aashirvaad Atta 10kg", purchased: 6, spend: 3120 },
  { name: "Amul Gold Milk 1L", purchased: 28, spend: 1820 },
  { name: "Tata Salt 1kg", purchased: 4, spend: 112 },
  { name: "Fortune Sunflower Oil 5L", purchased: 2, spend: 1840 },
  { name: "Surf Excel 2kg", purchased: 1, spend: 540 },
];

export const stores = [
  { name: "BigBasket", type: "Online", basket: 8250, rating: 4.6, delivery: "Same day", confidence: "High" },
  { name: "DMart Ready", type: "Online", basket: 8410, rating: 4.5, delivery: "Next day", confidence: "High" },
  { name: "Zepto", type: "Online", basket: 8920, rating: 4.4, delivery: "10 min", confidence: "Medium" },
  { name: "Reliance Fresh — Banjara Hills", type: "Local", basket: 8640, rating: 4.3, delivery: "Walk-in", confidence: "Community" },
  { name: "Ratnadeep — Jubilee Hills", type: "Local", basket: 8990, rating: 4.5, delivery: "Walk-in", confidence: "Community" },
  { name: "Local Kirana (Sai Stores)", type: "Local", basket: 9120, rating: 4.2, delivery: "Walk-in", confidence: "Submitted" },
];

export const samplePriceList = [
  { product: "Fortune Sunflower Oil 5L", bigbasket: 920, dmart: 935, zepto: 989, local: 950 },
  { product: "Aashirvaad Atta 10kg", bigbasket: 485, dmart: 469, zepto: 510, local: 495 },
  { product: "Amul Gold Milk 1L", bigbasket: 66, dmart: 66, zepto: 72, local: 68 },
  { product: "Tata Salt 1kg", bigbasket: 28, dmart: 26, zepto: 32, local: 30 },
  { product: "Surf Excel 2kg", bigbasket: 540, dmart: 520, zepto: 575, local: 555 },
];
