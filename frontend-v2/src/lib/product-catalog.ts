// A curated, fixed-vocabulary catalog of commonly bought Indian grocery
// products, grouped by category — the same "small fixed-vocabulary
// multi-select" pattern already used for store/frequency/priority choices in
// household.tsx. This is a self-selection list, not a derived catalog, so it
// works with zero backend dependency and zero shopping history.
export const PRODUCT_CATEGORIES: { category: string; products: string[] }[] = [
  {
    category: "Staples",
    products: ["Rice", "Wheat Flour (Atta)", "Sugar", "Salt", "Cooking Oil", "Pulses (Dal)"],
  },
  {
    category: "Dairy",
    products: ["Milk", "Curd", "Paneer", "Butter", "Ghee", "Cheese"],
  },
  {
    category: "Vegetables & Fruits",
    products: ["Onions", "Potatoes", "Tomatoes", "Bananas", "Apples", "Leafy Greens"],
  },
  {
    category: "Snacks & Beverages",
    products: ["Biscuits", "Namkeen", "Tea", "Coffee", "Soft Drinks", "Juice"],
  },
  {
    category: "Personal Care",
    products: ["Soap", "Shampoo", "Toothpaste", "Sanitary Products", "Deodorant"],
  },
  {
    category: "Household",
    products: ["Detergent", "Dishwash", "Toilet Cleaner", "Tissue Paper", "Mosquito Repellent"],
  },
];
