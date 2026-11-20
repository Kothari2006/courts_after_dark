export interface KantiProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  weight: string;
  availableWeights: string[];
  inStock: boolean;
  shelfLife: string;
  image: string;
  galleryImages: string[];
  description: string;
  ingredients: string;
  allergenInfo: string;
  dietaryInfo: string;
  shippingInfo: string;
  returnPolicy: string;
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
}

export interface KantiCategory {
  id: string;
  name: string;
  slug: string;
  subCategories?: string[];
  hasDropdown?: boolean;
}

export const KANTI_CATEGORIES: KantiCategory[] = [
  {
    id: "sweets",
    name: "Sweets",
    slug: "sweets",
    hasDropdown: true,
    subCategories: [
      "Bengali Sweets",
      "Ghewars",
      "Ghee & Khova Sweets",
      "Packed Sweets",
      "Assorted Sweets",
      "Special Kaju Sweets",
      "All Sweet Delights",
    ],
  },
  {
    id: "namkeens",
    name: "Namkeens",
    slug: "namkeens",
    hasDropdown: true,
    subCategories: [
      "Roasted Namkeens",
      "Traditional Mixtures",
      "Sev & Bhujia",
      "Chips & Crisps",
    ],
  },
  {
    id: "snacks",
    name: "Snacks",
    slug: "snacks",
    hasDropdown: true,
    subCategories: [
      "Benne Specials",
      "Makhana & Healthy Bites",
      "Puffs & Bakery Rolls",
      "Traditional Savories",
      "Chai Time Specials",
    ],
  },
  {
    id: "bakery",
    name: "Bakery & Boulangerie",
    slug: "bakery-boulangerie",
    hasDropdown: true,
    subCategories: [
      "Cookies and Biscuits",
      "Cakes",
      "Breads",
      "Sticks",
      "Rusk and Khari",
      "Beverages",
      "Doughnuts",
      "Croissants & Rolls",
    ],
  },
  {
    id: "chocolates",
    name: "Chocolates",
    slug: "chocolates",
    subCategories: [
      "Celestial Bars Collection",
      "Celestial Delight Collection",
      "Celestial Bark Collection",
    ],
  },
  {
    id: "gifting",
    name: "Gifting",
    slug: "gifting",
    subCategories: [
      "Corporate Gifts",
      "Personalised Gifts",
      "Festive Gifts",
      "Gift Hampers",
      "Assorted Gift Boxes",
    ],
  },
  {
    id: "candles",
    name: "Candles",
    slug: "candles",
    subCategories: ["Luxe Candles", "Aromatic Votives"],
  },
  {
    id: "fragrances",
    name: "Fragrances",
    slug: "fragrances",
    subCategories: ["Kaanish Perfumes", "Room Mists"],
  },
  {
    id: "ice-creams",
    name: "Ice creams",
    slug: "ice-creams",
    subCategories: ["Kulfi", "Artisan Cups"],
  },
  {
    id: "tea",
    name: "Tea",
    slug: "tea",
    subCategories: ["Assam CTC", "Masala Chai Blend", "Green Tea"],
  },
];

export const SNACKS_PRODUCTS: KantiProduct[] = [
  {
    id: "snack-1",
    slug: "benne-bakewadi-200g",
    name: "BENNE BAKEWADI-200G",
    category: "Snacks",
    subCategory: "Benne Specials",
    price: 100,
    originalPrice: 110,
    weight: "1Pc",
    availableWeights: ["1Pc", "200g", "500g"],
    inStock: true,
    shelfLife: "Shelf life before 5 days",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Crispy, flaky spiral pinwheels packed with spicy and sweet coconut poppy stuffing, kneaded with traditional pure butter (benne). An authentic tea-time indulgence from Karnataka's master sweetmakers.",
    ingredients:
      "Refined Wheat Flour (Maida), Pure Butter (Benne), Dried Coconut, Sesame Seeds, Poppy Seeds, Fennel Seeds, Red Chilli Powder, Garam Masala, Sugar, Edible Vegetable Oil, Iodized Salt.",
    allergenInfo:
      "Contains Wheat (Gluten), Dairy, Sesame Seeds. Manufactured in a facility that also processes tree nuts and peanuts.",
    dietaryInfo: "100% Vegetarian. Free from artificial colors and preservatives.",
    shippingInfo:
      "Packed fresh daily. Dispatched via Express Courier. Delivered within 24-48 hours across Bengaluru and 2-4 business days pan-India.",
    returnPolicy:
      "Perishable food item. Not eligible for returns. In the unlikely event of damage during transit or seal breakage, instant replacement or full refund is guaranteed.",
    rating: 4.8,
    reviewCount: 142,
    isBestSeller: true,
  },
  {
    id: "snack-2",
    slug: "benne-khari-150g",
    name: "BENNE KHARI-150G",
    category: "Snacks",
    subCategory: "Benne Specials",
    price: 100,
    weight: "1Pc",
    availableWeights: ["1Pc", "150g", "300g"],
    inStock: true,
    shelfLife: "Shelf life before 15 days",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Feather-light, thousand-layer puff pastry baked with farm-fresh butter. Airy, golden and wonderfully crunchy, it melts immediately on the tongue when dipped in hot filter coffee or masala chai.",
    ingredients:
      "Refined Wheat Flour, Pure Cultured Butter, Salt, Purified Water, Yeast, Edible Vegetable Fat.",
    allergenInfo: "Contains Wheat (Gluten) and Dairy (Milk Solid).",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Shipped in vacuum-cushioned protective bakery boxes to preserve delicate flakiness.",
    returnPolicy: "Perishable item. Guaranteed fresh on arrival or replacement provided.",
    rating: 4.9,
    reviewCount: 98,
    isBestSeller: true,
  },
  {
    id: "snack-3",
    slug: "benne-methi-khari-150g",
    name: "BENNE METHI KHARI-150G",
    category: "Snacks",
    subCategory: "Benne Specials",
    price: 123.81,
    weight: "1Pc",
    availableWeights: ["1Pc", "150g", "300g"],
    inStock: true,
    shelfLife: "Shelf life before 15 days",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Square-cut artisan butter puffs infused with aromatic dried fenugreek leaves (kasuri methi) and roasted cumin. Crisp, buttery layers balanced with herb bitterness and mild savory spice.",
    ingredients:
      "Refined Wheat Flour, Pure Butter, Dried Fenugreek (Kasuri Methi), Cumin, Black Pepper, Salt.",
    allergenInfo: "Contains Gluten, Dairy.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Ships same day. Packed in moisture-resistant tamper-evident trays.",
    returnPolicy: "Freshness guaranteed.",
    rating: 4.7,
    reviewCount: 76,
  },
  {
    id: "snack-4",
    slug: "benne-mushroom-puff",
    name: "Benne Mushroom Puff",
    category: "Snacks",
    subCategory: "Puffs & Bakery Rolls",
    price: 47.62,
    weight: "1Pc",
    availableWeights: ["1Pc"],
    inStock: false,
    shelfLife: "Shelf life before 2 days",
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281724?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1621996346565-e3d5d6281724?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Hot-baked puff stuffed with sautéed button mushrooms, caramelized onions, cracked pepper, and herbs wrapped in delicate buttery puff pastry. Prepared fresh in morning batches.",
    ingredients:
      "Fresh Button Mushrooms, Onions, Green Chillies, Garlic, Coriander, Black Pepper, Butter, Flour, Salt.",
    allergenInfo: "Contains Wheat, Milk Solids.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Available exclusively for same-day local delivery across Bengaluru.",
    returnPolicy: "Cooked hot snack. Non-refundable.",
    rating: 4.6,
    reviewCount: 112,
  },
  {
    id: "snack-5",
    slug: "benne-paneer-puff",
    name: "Benne Paneer Puff",
    category: "Snacks",
    subCategory: "Puffs & Bakery Rolls",
    price: 52.38,
    weight: "1Pc",
    availableWeights: ["1Pc"],
    inStock: false,
    shelfLife: "Shelf life before 2 days",
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Golden triangular puff pastry generously stuffed with spiced Malai Paneer cubes, capsicum, and aromatic garam masala, baked to crispy perfection.",
    ingredients:
      "Fresh Cottage Cheese (Paneer), Bell Peppers, Onions, Ginger-Garlic, Pure Butter, Flour, Salt, Spices.",
    allergenInfo: "Contains Dairy, Gluten.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Bengaluru local express delivery only.",
    returnPolicy: "Perishable freshly baked food.",
    rating: 4.9,
    reviewCount: 230,
  },
  {
    id: "snack-6",
    slug: "cream-bun",
    name: "Cream Bun",
    category: "Snacks",
    subCategory: "Puffs & Bakery Rolls",
    price: 38.1,
    weight: "1Pc",
    availableWeights: ["1Pc"],
    inStock: false,
    shelfLife: "Shelf life before 2 days",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Nostalgic Bengaluru bakery classic: ultra-soft sweet bun slit open and filled with whipped vanilla buttercream and topped with candied glazed cherries.",
    ingredients:
      "Wheat Flour, Butter, Milk, Sugar, Yeast, Vanilla Extract, Candied Tutti Frutti Cherries.",
    allergenInfo: "Contains Wheat, Dairy.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Bengaluru local delivery.",
    returnPolicy: "Bakery perishable item.",
    rating: 4.5,
    reviewCount: 88,
  },
  {
    id: "snack-7",
    slug: "dhokla",
    name: "Dhokla",
    category: "Snacks",
    subCategory: "Traditional Savories",
    price: 33.33,
    weight: "1Pc",
    availableWeights: ["1Pc", "4Pcs", "8Pcs"],
    inStock: false,
    shelfLife: "Shelf life before 1 day",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Steamed fermented gram flour spongy savory cake, tempered with crackling black mustard seeds, curry leaves, and green chillies, finished with fresh coriander and grated coconut.",
    ingredients:
      "Gram Flour (Besan), Yogurt, Green Chillies, Ginger, Turmeric, Mustard Seeds, Curry Leaves, Lemon Juice, Coriander.",
    allergenInfo: "Contains Mustard, Dairy.",
    dietaryInfo: "100% Vegetarian. Low calorie steamed snack.",
    shippingInfo: "Bengaluru local store pickup & fast courier only.",
    returnPolicy: "Fresh morning item. Non-returnable.",
    rating: 4.7,
    reviewCount: 310,
  },
  {
    id: "snack-8",
    slug: "masala-makhana-70-gms",
    name: "Masala Makhana 70 gms",
    category: "Snacks",
    subCategory: "Makhana & Healthy Bites",
    price: 228.57,
    weight: "70 gms",
    availableWeights: ["70 gms", "150 gms"],
    inStock: true,
    shelfLife: "Shelf life before 60 days",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Slow-roasted crunchy lotus seeds (foxnuts) seasoned with royal chatpata Indian spices and cold-pressed sunflower oil. High in protein, low in cholesterol, and guilt-free snacking.",
    ingredients:
      "Fox Nuts (Makhana), Edible Vegetable Oil, Red Chilli, Black Salt, Mango Powder (Amchur), Mint, Cumin, Hing, Rock Salt.",
    allergenInfo: "Nut-free. Processed on equipment that handles peanuts.",
    dietaryInfo: "100% Vegetarian, Gluten-Free, Vegan, Rich in Calcium.",
    shippingInfo: "Airtight nitrogen-flushed pouch. Delivers pan-India.",
    returnPolicy: "30-day sealed pouch replacement policy.",
    rating: 4.8,
    reviewCount: 165,
    isBestSeller: true,
  },
  {
    id: "snack-9",
    slug: "masala-popcorn-30-gms",
    name: "Masala Popcorn 30 gms",
    category: "Snacks",
    subCategory: "Makhana & Healthy Bites",
    price: 42.86,
    weight: "30 gms",
    availableWeights: ["30 gms", "60 gms"],
    inStock: true,
    shelfLife: "Shelf life before 45 days",
    image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Gourmet whole-grain corn kernels popped in pure butter and tossed with signature desi spice blend for an explosive crunch and tangy flavor.",
    ingredients:
      "Non-GMO Corn, Refined Edible Oil, Butter Flavor, Spices, Black Salt, Turmeric, Paprika.",
    allergenInfo: "Contains Corn, trace Dairy.",
    dietaryInfo: "100% Vegetarian, Whole Grain.",
    shippingInfo: "Heat-sealed nitrogen packed pouch.",
    returnPolicy: "Unopened packs eligible for replacement if seal is broken.",
    rating: 4.6,
    reviewCount: 92,
  },
  {
    id: "snack-10",
    slug: "methi-makhana-70-gms",
    name: "Methi Makhana 70 gms",
    category: "Snacks",
    subCategory: "Makhana & Healthy Bites",
    price: 228.57,
    weight: "70 gms",
    availableWeights: ["70 gms", "150 gms"],
    inStock: true,
    shelfLife: "Shelf life before 60 days",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Nutrient-dense roasted foxnuts dusted with organic dried methi leaves, roasted garlic powder, and pink Himalayan rock salt for herbal digestive wellness.",
    ingredients:
      "Fox Nuts (Makhana), Dried Fenugreek, Himalayan Pink Salt, Turmeric, Edible Oil, Roasted Spices.",
    allergenInfo: "Gluten-Free, Dairy-Free.",
    dietaryInfo: "100% Vegetarian, Diabetic Friendly, High Fiber.",
    shippingInfo: "Shipped pan-India with tamper-proof zip-lock packaging.",
    returnPolicy: "Guaranteed freshness.",
    rating: 4.7,
    reviewCount: 78,
  },
  {
    id: "snack-11",
    slug: "paneer-pizza",
    name: "Paneer Pizza",
    category: "Snacks",
    subCategory: "Puffs & Bakery Rolls",
    price: 76.19,
    weight: "1Pc",
    availableWeights: ["1Pc"],
    inStock: false,
    shelfLife: "Shelf life before 1 day",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Personal artisanal pizza crust topped with rich tomato herb concasse, spiced tandoori paneer tikka, diced capsicum, onions, and melted mozzarella cheese.",
    ingredients:
      "Wheat Crust, Mozzarella Cheese, Tandoori Paneer, Bell Peppers, Onions, Pizza Sauce, Oregano, Chilli Flakes.",
    allergenInfo: "Contains Dairy, Wheat.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Local Bengaluru express delivery only.",
    returnPolicy: "Prepared hot food item.",
    rating: 4.8,
    reviewCount: 154,
  },
  {
    id: "snack-12",
    slug: "paneer-wheat-samosa",
    name: "Paneer Wheat Samosa",
    category: "Snacks",
    subCategory: "Traditional Savories",
    price: 42.86,
    weight: "1Pc",
    availableWeights: ["1Pc", "2Pcs", "4Pcs"],
    inStock: false,
    shelfLife: "Shelf life before 1 day",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Wholesome 100% whole wheat flour crust folded into crisp golden triangles filled with crumbled fresh paneer, green peas, mint, and roasted whole spices.",
    ingredients:
      "Whole Wheat Flour (Atta), Paneer (Cottage Cheese), Green Peas, Potatoes, Green Chillies, Mint, Coriander, Spices, Oil, Salt.",
    allergenInfo: "Contains Wheat (Gluten), Dairy.",
    dietaryInfo: "100% Vegetarian. Whole wheat healthy alternative.",
    shippingInfo: "Delivered fresh hot from local Kanti Sweets store.",
    returnPolicy: "Cooked food item. Non-returnable.",
    rating: 4.9,
    reviewCount: 420,
    isBestSeller: true,
  },
  {
    id: "snack-13",
    slug: "salted-banana-chips-100g",
    name: "SALTED BANANA CHIPS-100G",
    category: "Snacks",
    subCategory: "Traditional Savories",
    price: 65,
    weight: "100 gms",
    availableWeights: ["100 gms", "250 gms", "500 gms"],
    inStock: true,
    shelfLife: "Shelf life before 30 days",
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Wafer-thin raw Nendran banana slices fried in pure coconut oil and lightly tossed in sea salt. Crisp, fragrant, and golden.",
    ingredients: "Raw Kerala Nendran Bananas, Pure Coconut Oil, Rock Salt.",
    allergenInfo: "Gluten-Free, Dairy-Free, Nut-Free.",
    dietaryInfo: "100% Vegetarian, Vegan.",
    shippingInfo: "Vacuum-sealed packaging to preserve maximum crispiness.",
    returnPolicy: "Replacement if package seal is compromised.",
    rating: 4.8,
    reviewCount: 215,
  },
  {
    id: "snack-14",
    slug: "pepper-banana-chips-100g",
    name: "PEPPER BANANA CHIPS-100G",
    category: "Snacks",
    subCategory: "Traditional Savories",
    price: 70,
    weight: "100 gms",
    availableWeights: ["100 gms", "250 gms", "500 gms"],
    inStock: true,
    shelfLife: "Shelf life before 30 days",
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Crispy sun-ripened banana chips dusted with freshly crushed Malabar black peppercorns and pink rock salt for a fiery kick.",
    ingredients: "Raw Bananas, Pure Coconut Oil, Malabar Black Pepper, Salt.",
    allergenInfo: "Gluten-Free, Vegan.",
    dietaryInfo: "100% Vegetarian.",
    shippingInfo: "Shipped pan-India.",
    returnPolicy: "Freshness guaranteed.",
    rating: 4.9,
    reviewCount: 180,
  },
  {
    id: "snack-15",
    slug: "butter-murukku-200g",
    name: "BUTTER MURUKKU-200G",
    category: "Snacks",
    subCategory: "Benne Specials",
    price: 95.24,
    weight: "200g",
    availableWeights: ["200g", "400g"],
    inStock: true,
    shelfLife: "Shelf life before 25 days",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Melt-in-mouth spiral murukku prepared with premium rice flour, roasted gram and rich churned white butter. Light, crunchy and non-greasy.",
    ingredients: "Rice Flour, Urad Dal, Pure Butter, Cumin Seeds, Asafoetida, Salt, Edible Oil.",
    allergenInfo: "Contains Dairy.",
    dietaryInfo: "100% Vegetarian, Gluten-Free.",
    shippingInfo: "Ships pan-India.",
    returnPolicy: "Standard sealed goods policy.",
    rating: 4.8,
    reviewCount: 195,
  },
];

