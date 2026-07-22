import {
  Smartphone, Laptop, Tablet, Gamepad2, Watch, Headphones, Camera,
  Home, Package, Plane, Car, Cable, BatteryCharging, Speaker, Monitor,
  Keyboard, Mouse, Tv, Lightbulb, Wifi, Cpu, ShoppingBag,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons an admin can choose per category in the dashboard. The DB stores the
 * key as plain text, so anything unrecognised falls back to ShoppingBag.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Smartphone, Laptop, Tablet, Gamepad2, Watch, Headphones, Camera,
  Home, Package, Plane, Car, Cable, BatteryCharging, Speaker, Monitor,
  Keyboard, Mouse, Tv, Lightbulb, Wifi, Cpu, ShoppingBag,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

/** Accent keys with matching --color-cat-<key> / -soft pairs in globals.css. */
export const CATEGORY_COLOR_KEYS = [
  "smartphones", "laptops", "tablets", "consoles",
  "watches", "audio", "home", "deals",
] as const;

export function resolveIcon(name: string | null | undefined): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || ShoppingBag;
}

/** Falls back to a stable colour from the palette when none is set. */
export function resolveColorKey(key: string | null | undefined, index: number): string {
  return key || CATEGORY_COLOR_KEYS[index % CATEGORY_COLOR_KEYS.length];
}
