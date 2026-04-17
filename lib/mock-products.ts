export type ConditionTier = "Fair" | "Good" | "Excellent" | "Premium";

export interface ConditionOption {
  tier: ConditionTier;
  price_delta: number; // relative to Excellent price
  stock: number;
}

export interface MockImage {
  alt: string;
  gradient: string; // CSS gradient used as placeholder
}

export interface MockVariant {
  id: string;
  specs: string;      // e.g. "128GB"
  colour: string;
  price: number;      // Excellent condition price (GBP)
  original_price: number;
  stock: number;
}

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  images: MockImage[];
  variants: MockVariant[];
  condition_options: ConditionOption[];
  rating: number;
  review_count: number;
  specs: Record<string, string>;
}

/** Generates a 4-tier condition ladder relative to the Excellent base price */
export function defaultConditions(basePrice: number): ConditionOption[] {
  return [
    { tier: "Fair",      price_delta: -Math.round(basePrice * 0.25), stock: 4 },
    { tier: "Good",      price_delta: -Math.round(basePrice * 0.12), stock: 8 },
    { tier: "Excellent", price_delta: 0,                              stock: 12 },
    { tier: "Premium",   price_delta:  Math.round(basePrice * 0.08), stock: 5 },
  ];
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _formatGBP = formatGBP; // exported for use in components

export const PRODUCTS: MockProduct[] = [
  {
    id: "p1",
    slug: "iphone-15",
    name: "Apple iPhone 15",
    brand: "Apple",
    category: "Smartphones",
    images: [
      { alt: "iPhone 15 front", gradient: "linear-gradient(135deg, #e8e8ed 0%, #d1d1d6 100%)" },
      { alt: "iPhone 15 back",  gradient: "linear-gradient(135deg, #d1d1d6 0%, #c7c7cc 100%)" },
    ],
    variants: [
      { id: "v1a", specs: "128GB", colour: "Black Titanium", price: 589, original_price: 849, stock: 14 },
      { id: "v1b", specs: "256GB", colour: "Black Titanium", price: 649, original_price: 949, stock: 9 },
      { id: "v1c", specs: "128GB", colour: "Natural Titanium", price: 589, original_price: 849, stock: 7 },
    ],
    condition_options: defaultConditions(589),
    rating: 4.7,
    review_count: 312,
    specs: { Display: "6.1\" Super Retina XDR", Chip: "A16 Bionic", Camera: "48MP + 12MP", Battery: "3877 mAh" },
  },
  {
    id: "p2",
    slug: "iphone-14-pro",
    name: "Apple iPhone 14 Pro 256GB",
    brand: "Apple",
    category: "Smartphones",
    images: [
      { alt: "iPhone 14 Pro front", gradient: "linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%)" },
      { alt: "iPhone 14 Pro back",  gradient: "linear-gradient(135deg, #3a3a3c 0%, #48484a 100%)" },
    ],
    variants: [
      { id: "v2a", specs: "256GB", colour: "Space Black", price: 649, original_price: 1099, stock: 11 },
      { id: "v2b", specs: "512GB", colour: "Space Black", price: 749, original_price: 1299, stock: 6 },
    ],
    condition_options: defaultConditions(649),
    rating: 4.8,
    review_count: 489,
    specs: { Display: "6.1\" Super Retina XDR ProMotion", Chip: "A16 Bionic", Camera: "48MP Triple", Battery: "3200 mAh" },
  },
  {
    id: "p3",
    slug: "samsung-galaxy-s24",
    name: "Samsung Galaxy S24",
    brand: "Samsung",
    category: "Smartphones",
    images: [
      { alt: "Galaxy S24", gradient: "linear-gradient(135deg, #6200ea 0%, #7c4dff 100%)" },
    ],
    variants: [
      { id: "v3a", specs: "128GB", colour: "Onyx Black", price: 449, original_price: 699, stock: 18 },
      { id: "v3b", specs: "256GB", colour: "Onyx Black", price: 499, original_price: 769, stock: 10 },
    ],
    condition_options: defaultConditions(449),
    rating: 4.6,
    review_count: 201,
    specs: { Display: "6.2\" Dynamic AMOLED 120Hz", Chip: "Snapdragon 8 Gen 3", Camera: "50MP Triple", Battery: "4000 mAh" },
  },
  {
    id: "p4",
    slug: "google-pixel-8",
    name: "Google Pixel 8",
    brand: "Google",
    category: "Smartphones",
    images: [
      { alt: "Pixel 8", gradient: "linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)" },
    ],
    variants: [
      { id: "v4a", specs: "128GB", colour: "Obsidian", price: 399, original_price: 599, stock: 15 },
    ],
    condition_options: defaultConditions(399),
    rating: 4.5,
    review_count: 143,
    specs: { Display: "6.2\" OLED 120Hz", Chip: "Google Tensor G3", Camera: "50MP Dual", Battery: "4575 mAh" },
  },
  {
    id: "p5",
    slug: "macbook-air-m3",
    name: "Apple MacBook Air M3 13\"",
    brand: "Apple",
    category: "Laptops",
    images: [
      { alt: "MacBook Air M3", gradient: "linear-gradient(135deg, #e5e5ea 0%, #d1d1d6 100%)" },
      { alt: "MacBook Air M3 open", gradient: "linear-gradient(135deg, #d1d1d6 0%, #c7c7cc 100%)" },
    ],
    variants: [
      { id: "v5a", specs: "8GB / 256GB", colour: "Midnight", price: 849, original_price: 1299, stock: 8 },
      { id: "v5b", specs: "16GB / 512GB", colour: "Midnight", price: 1049, original_price: 1599, stock: 4 },
    ],
    condition_options: defaultConditions(849),
    rating: 4.9,
    review_count: 267,
    specs: { Chip: "Apple M3", RAM: "8GB", Display: "13.6\" Liquid Retina", Battery: "Up to 18 hours" },
  },
  {
    id: "p6",
    slug: "dell-xps-13",
    name: "Dell XPS 13 Plus",
    brand: "Dell",
    category: "Laptops",
    images: [
      { alt: "Dell XPS 13", gradient: "linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 100%)" },
    ],
    variants: [
      { id: "v6a", specs: "16GB / 512GB", colour: "Graphite", price: 699, original_price: 1199, stock: 6 },
    ],
    condition_options: defaultConditions(699),
    rating: 4.4,
    review_count: 98,
    specs: { Chip: "Intel Core i7-1360P", RAM: "16GB LPDDR5", Display: "13.4\" OLED Touch", Battery: "Up to 12 hours" },
  },
  {
    id: "p7",
    slug: "ipad-air-m2",
    name: "Apple iPad Air M2 11\"",
    brand: "Apple",
    category: "Tablets",
    images: [
      { alt: "iPad Air M2", gradient: "linear-gradient(135deg, #5ac8fa 0%, #007aff 100%)" },
    ],
    variants: [
      { id: "v7a", specs: "128GB Wi-Fi", colour: "Blue", price: 449, original_price: 699, stock: 12 },
      { id: "v7b", specs: "256GB Wi-Fi", colour: "Blue", price: 549, original_price: 849, stock: 7 },
    ],
    condition_options: defaultConditions(449),
    rating: 4.7,
    review_count: 184,
    specs: { Chip: "Apple M2", Display: "11\" Liquid Retina", Camera: "12MP Wide", Battery: "Up to 10 hours" },
  },
  {
    id: "p8",
    slug: "playstation-5",
    name: "Sony PlayStation 5 Disc Edition",
    brand: "Sony",
    category: "Consoles",
    images: [
      { alt: "PS5", gradient: "linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)" },
      { alt: "PS5 side", gradient: "linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%)" },
    ],
    variants: [
      { id: "v8a", specs: "825GB SSD", colour: "White", price: 349, original_price: 479, stock: 9 },
    ],
    condition_options: defaultConditions(349),
    rating: 4.8,
    review_count: 520,
    specs: { CPU: "AMD Zen 2 8-core", GPU: "10.28 TFLOPS RDNA 2", Storage: "825GB Custom SSD", Output: "4K 120fps" },
  },
  {
    id: "p9",
    slug: "apple-watch-series-9",
    name: "Apple Watch Series 9 45mm",
    brand: "Apple",
    category: "Smartwatches",
    images: [
      { alt: "Apple Watch S9", gradient: "linear-gradient(135deg, #ff9f0a 0%, #ff6b00 100%)" },
    ],
    variants: [
      { id: "v9a", specs: "45mm GPS", colour: "Midnight Aluminium", price: 279, original_price: 429, stock: 16 },
      { id: "v9b", specs: "45mm GPS+Cellular", colour: "Midnight Aluminium", price: 329, original_price: 499, stock: 8 },
    ],
    condition_options: defaultConditions(279),
    rating: 4.6,
    review_count: 231,
    specs: { Chip: "Apple S9 SiP", Display: "Always-On Retina", Health: "ECG, Blood Oxygen", Battery: "Up to 18 hours" },
  },
  {
    id: "p10",
    slug: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "Headphones",
    images: [
      { alt: "Sony WH-1000XM5", gradient: "linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%)" },
    ],
    variants: [
      { id: "v10a", specs: "Wireless", colour: "Black", price: 199, original_price: 349, stock: 21 },
      { id: "v10b", specs: "Wireless", colour: "Silver", price: 199, original_price: 349, stock: 14 },
    ],
    condition_options: defaultConditions(199),
    rating: 4.8,
    review_count: 408,
    specs: { "Noise Cancellation": "Industry-leading ANC", Battery: "30 hours", Connection: "Bluetooth 5.2", Weight: "250g" },
  },
];

export function getAllBrands(): string[] {
  return [...new Set(PRODUCTS.map((p) => p.brand))].sort();
}

export function getAllCategories(): string[] {
  return [...new Set(PRODUCTS.map((p) => p.category))].sort();
}

export function getProductBySlug(slug: string): MockProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
