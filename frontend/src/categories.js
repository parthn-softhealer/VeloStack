// Centralized definition of primary retail categories
export const MAIN_CATEGORIES = [
  {
    id: "all",
    name: "All Categories",
    icon: "grid",
    description: "Browse all trending items across marketplaces",
    keywords: [],
  },
  {
    id: "electronics",
    name: "Electronics",
    icon: "zap",
    description: "Audio, smart gadgets, LED lights, chargers & accessories",
    keywords: [
      "electronics",
      "led lights",
      "led",
      "headphones",
      "earbuds",
      "headset",
      "bluetooth",
      "speaker",
      "charger",
      "gadget",
      "usb",
      "audio",
      "cable",
      "strip lights",
    ],
  },
  {
    id: "fashion",
    name: "Fashion & Apparel",
    icon: "shirt",
    description: "Ethnic wear, t-shirts, kurtis, sarees, streetwear",
    keywords: [
      "fashion",
      "apparel",
      "kurti",
      "kurti sets",
      "t-shirt",
      "tshirt",
      "shirt",
      "saree",
      "ethnic",
      "clothing",
      "streetwear",
      "cotton",
      "anarkali",
      "dress",
    ],
  },
  {
    id: "watches",
    name: "Watches & Jewelry",
    icon: "watch",
    description: "Smartwatches, analog watches, jhumkas & jewellery",
    keywords: [
      "watch",
      "smartwatch",
      "jewellery",
      "jewelry",
      "jhumka",
      "earrings",
      "necklace",
      "bracelet",
      "ring",
      "bangles",
    ],
  },
  {
    id: "shoes",
    name: "Shoes & Footwear",
    icon: "shoe",
    description: "Sneakers, running shoes, casual footwear & loafers",
    keywords: [
      "shoe",
      "shoes",
      "footwear",
      "sneaker",
      "sneakers",
      "boots",
      "sandals",
      "slippers",
      "loafers",
      "running",
    ],
  },
  {
    id: "kitchen",
    name: "Home & Kitchen",
    icon: "home",
    description: "Blenders, air fryers, mixer grinders, kitchen tools",
    keywords: [
      "kitchen",
      "home",
      "blender",
      "juicer",
      "mixer",
      "grinder",
      "air fryer",
      "fryer",
      "cookware",
      "storage",
      "appliances",
      "bedsheets",
      "decor",
    ],
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "sparkles",
    description: "Makeup mirrors, trimmers, hair stylers & skincare tools",
    keywords: [
      "beauty",
      "mirror",
      "trimmer",
      "grooming",
      "skincare",
      "cosmetics",
      "makeup",
      "hair dryer",
      "shaver",
      "personal care",
    ],
  },
];

export function getCategoryById(id) {
  return MAIN_CATEGORIES.find((c) => c.id === id) || MAIN_CATEGORIES[0];
}

export function matchesMainCategory(item, categoryId) {
  if (!categoryId || categoryId === "all") return true;
  const cat = getCategoryById(categoryId);
  if (!cat || !cat.keywords.length) return true;

  const targetText = [
    item.canonical,
    item.rawCategory,
    item.title,
    item.seller,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return cat.keywords.some((kw) => targetText.includes(kw));
}
