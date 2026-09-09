/**
 * The 27 governorates of Egypt.
 *
 * `value` is the canonical key: it is what the checkout `<select>` submits, what
 * gets stored in `orders.governorate`, and what the delivery-fee override list in
 * `store_configuration.delivery.governorates[].name` is matched against (both in
 * `computeShipping()` and inside `create_cod_order()`). Never localise the stored
 * value — localise `ar` / `en` for display only.
 */
export interface Governorate {
  value: string;
  ar: string;
  en: string;
}

export const EGYPT_GOVERNORATES: Governorate[] = [
  { value: "Cairo",         ar: "القاهرة",       en: "Cairo" },
  { value: "Giza",          ar: "الجيزة",        en: "Giza" },
  { value: "Alexandria",    ar: "الإسكندرية",    en: "Alexandria" },
  { value: "Qalyubia",      ar: "القليوبية",     en: "Qalyubia" },
  { value: "Dakahlia",      ar: "الدقهلية",      en: "Dakahlia" },
  { value: "Sharqia",       ar: "الشرقية",       en: "Sharqia" },
  { value: "Gharbia",       ar: "الغربية",       en: "Gharbia" },
  { value: "Monufia",       ar: "المنوفية",      en: "Monufia" },
  { value: "Beheira",       ar: "البحيرة",       en: "Beheira" },
  { value: "KafrElSheikh",  ar: "كفر الشيخ",     en: "Kafr El Sheikh" },
  { value: "Damietta",      ar: "دمياط",         en: "Damietta" },
  { value: "PortSaid",      ar: "بورسعيد",       en: "Port Said" },
  { value: "Ismailia",      ar: "الإسماعيلية",   en: "Ismailia" },
  { value: "Suez",          ar: "السويس",        en: "Suez" },
  { value: "Faiyum",        ar: "الفيوم",        en: "Faiyum" },
  { value: "BeniSuef",      ar: "بني سويف",      en: "Beni Suef" },
  { value: "Minya",         ar: "المنيا",        en: "Minya" },
  { value: "Asyut",         ar: "أسيوط",         en: "Asyut" },
  { value: "Sohag",         ar: "سوهاج",         en: "Sohag" },
  { value: "Qena",          ar: "قنا",           en: "Qena" },
  { value: "Luxor",         ar: "الأقصر",        en: "Luxor" },
  { value: "Aswan",         ar: "أسوان",         en: "Aswan" },
  { value: "RedSea",        ar: "البحر الأحمر",  en: "Red Sea" },
  { value: "NewValley",     ar: "الوادي الجديد", en: "New Valley" },
  { value: "Matrouh",       ar: "مطروح",         en: "Matrouh" },
  { value: "NorthSinai",    ar: "شمال سيناء",    en: "North Sinai" },
  { value: "SouthSinai",    ar: "جنوب سيناء",    en: "South Sinai" },
];

const BY_VALUE = new Map(EGYPT_GOVERNORATES.map((g) => [g.value, g]));

/** Display name for a stored governorate value; falls back to the raw value. */
export function governorateLabel(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const g = BY_VALUE.get(value);
  if (!g) return value;
  return locale === "ar" ? g.ar : g.en;
}

/** True when the value is one of the 27 known governorates. */
export function isGovernorate(value: string): boolean {
  return BY_VALUE.has(value);
}
