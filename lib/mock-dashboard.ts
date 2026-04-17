/* ── Mock Dashboard Data ── */

export interface KpiMetric {
  id: string;
  value: string;
  change: number;
  changeType: "up" | "down";
}

export interface MonthlyData {
  month: string;
  revenue: number;
  target: number;
  aov: number;
}

export interface SkuReturn {
  sku: string;
  name: string;
  returnRate: number;
  returns: number;
}

export interface DailySale {
  date: string;
  sales: number;
  orders: number;
}

export const KPI_DATA: KpiMetric[] = [
  { id: "gmv",         value: "£2,418,350", change: 12.3, changeType: "up" },
  { id: "aov",         value: "£147",       change: 5.1,  changeType: "up" },
  { id: "returnRate",  value: "3.2%",       change: 0.8,  changeType: "down" },
  { id: "dailyOrders", value: "1,847",      change: 18.2, changeType: "up" },
];

export const MONTHLY_DATA: MonthlyData[] = [
  { month: "Apr",  revenue: 148000,  target: 140000,  aov: 128 },
  { month: "May",  revenue: 165000,  target: 150000,  aov: 132 },
  { month: "Jun",  revenue: 172000,  target: 160000,  aov: 135 },
  { month: "Jul",  revenue: 189000,  target: 170000,  aov: 138 },
  { month: "Aug",  revenue: 195000,  target: 180000,  aov: 140 },
  { month: "Sep",  revenue: 210000,  target: 190000,  aov: 141 },
  { month: "Oct",  revenue: 198000,  target: 195000,  aov: 139 },
  { month: "Nov",  revenue: 245000,  target: 210000,  aov: 144 },
  { month: "Dec",  revenue: 278000,  target: 230000,  aov: 148 },
  { month: "Jan",  revenue: 215000,  target: 200000,  aov: 143 },
  { month: "Feb",  revenue: 228000,  target: 210000,  aov: 146 },
  { month: "Mar",  revenue: 242000,  target: 220000,  aov: 147 },
];

export const RETURNS_DATA: SkuReturn[] = [
  { sku: "IP14P-256-BK",  name: "iPhone 14 Pro 256GB",        returnRate: 5.8, returns: 29 },
  { sku: "GS24-128-BK",   name: "Samsung Galaxy S24",         returnRate: 4.9, returns: 18 },
  { sku: "PS5-DISC",      name: "PS5 Disc Edition",           returnRate: 4.2, returns: 34 },
  { sku: "MBA-M3-256",    name: "MacBook Air M3 256GB",       returnRate: 3.7, returns: 14 },
  { sku: "GP8-128",       name: "Google Pixel 8",             returnRate: 3.5, returns: 9 },
  { sku: "IP15-128-TI",   name: "iPhone 15 128GB",            returnRate: 3.1, returns: 22 },
  { sku: "XPS13-512",     name: "Dell XPS 13 Plus",           returnRate: 2.8, returns: 7 },
  { sku: "WH1000-SIL",    name: "Sony WH-1000XM5",           returnRate: 2.4, returns: 16 },
  { sku: "IPADM2-128",    name: "iPad Air M2 128GB",          returnRate: 2.1, returns: 8 },
  { sku: "AW9-45",        name: "Apple Watch Series 9",       returnRate: 1.8, returns: 6 },
];

export const DAILY_SALES: DailySale[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, 8 + i); // Mar 8 → Apr 6
  const base = 55000 + Math.sin(i * 0.4) * 12000 + i * 800;
  const orders = Math.round(340 + Math.sin(i * 0.5) * 80 + i * 6);
  return {
    date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    sales: Math.round(base),
    orders,
  };
});
