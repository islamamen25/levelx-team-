"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ThemeConfig {
  primary:   string;
  secondary: string;
  accent:    string;
  surface:   string;
  radius:    string;
}

// ── Preset palettes (Back Market / Apple inspired) ───────────────────────────
const PRESETS: { name: string; theme: ThemeConfig }[] = [
  {
    name: "LevelX Mint",
    theme: { primary: "#00A699", secondary: "#1D1D1F", accent: "#F5A623", surface: "#FFFFFF", radius: "0.75rem" },
  },
  {
    name: "Apple Blue",
    theme: { primary: "#0071E3", secondary: "#1D1D1F", accent: "#34C759", surface: "#FFFFFF", radius: "0.75rem" },
  },
  {
    name: "Back Market",
    theme: { primary: "#24BE90", secondary: "#1B1B1B", accent: "#FF6B35", surface: "#FFFFFF", radius: "0.5rem" },
  },
  {
    name: "Midnight",
    theme: { primary: "#6366F1", secondary: "#0F172A", accent: "#F59E0B", surface: "#FFFFFF", radius: "1rem" },
  },
  {
    name: "Coral",
    theme: { primary: "#FF6B6B", secondary: "#2D3748", accent: "#68D391", surface: "#FFFFFF", radius: "0.625rem" },
  },
];

const RADIUS_OPTIONS = [
  { label: "Sharp",   value: "0rem" },
  { label: "Small",   value: "0.375rem" },
  { label: "Default", value: "0.75rem" },
  { label: "Large",   value: "1rem" },
  { label: "Pill",    value: "1.5rem" },
];

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string; desc: string }[] = [
  { key: "primary",   label: "Primary",   desc: "CTAs, links, highlights" },
  { key: "secondary", label: "Secondary", desc: "Text, navbar background" },
  { key: "accent",    label: "Accent",    desc: "Badges, deals, alerts" },
  { key: "surface",   label: "Surface",   desc: "Card & page background" },
];

const DEFAULT_THEME: ThemeConfig = PRESETS[0].theme;

// ── Component ─────────────────────────────────────────────────────────────────
interface ThemeEditorProps {
  value: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

export function ThemeEditor({ value, onChange }: ThemeEditorProps) {
  const [activePreset, setActivePreset] = useState<string | null>("LevelX Mint");

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.name);
    onChange(preset.theme);
  };

  const updateField = (key: keyof ThemeConfig, val: string) => {
    setActivePreset(null); // custom
    onChange({ ...value, [key]: val });
  };

  const reset = () => applyPreset(PRESETS[0]);

  return (
    <div className="space-y-6">
      {/* ── Preset Palettes ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)] mb-3">
          Brand Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={[
                "group relative flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all",
                activePreset === preset.name
                  ? "border-[var(--color-ceramic)] bg-white shadow-sm"
                  : "border-gray-100 bg-[var(--color-obsidian)] hover:border-gray-200",
              ].join(" ")}>
              {/* Colour dots */}
              <div className="flex gap-1">
                {[preset.theme.primary, preset.theme.secondary, preset.theme.accent].map((c, i) => (
                  <div key={i} className="h-3 w-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-xs font-semibold text-[var(--color-ceramic)]">{preset.name}</span>
              {activePreset === preset.name && (
                <Check className="h-3 w-3 text-[var(--color-mint)] ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Colour Pickers ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)] mb-3">
          Custom Colours
        </p>
        <div className="grid grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label, desc }) => (
            <div key={key}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              {/* Native colour input */}
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-xl ring-1 ring-black/10 overflow-hidden"
                  style={{ backgroundColor: value[key] as string }}>
                  <input
                    type="color"
                    value={value[key] as string}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    title={`Pick ${label} colour`}
                  />
                </div>
              </div>
              {/* Text input */}
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-[var(--color-ceramic)] block mb-1">
                  {label}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={value[key] as string}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateField(key, v);
                    }}
                    maxLength={7}
                    className="h-7 px-2 font-mono text-xs border-gray-100 bg-[var(--color-obsidian)] w-24"
                  />
                  <span className="text-[10px] text-[var(--color-slate)] truncate">{desc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Border Radius ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)] mb-3">
          Border Radius
        </p>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button key={r.value} onClick={() => updateField("radius", r.value)}
              className={[
                "flex flex-col items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                value.radius === r.value
                  ? "border-[var(--color-ceramic)] bg-white shadow-sm text-[var(--color-ceramic)]"
                  : "border-gray-100 bg-[var(--color-obsidian)] text-[var(--color-slate)] hover:border-gray-200",
              ].join(" ")}>
              {/* Visual radius preview */}
              <div className="h-6 w-6 border-2 border-current"
                style={{ borderRadius: r.value === "1.5rem" ? "50%" : r.value }} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Live Preview Bar ── */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-[var(--color-obsidian)] border-b border-gray-100">
          <p className="text-xs font-semibold text-[var(--color-slate)]">Live Preview</p>
        </div>
        <div className="p-4 bg-white flex items-center gap-3 flex-wrap">
          <button
            className="px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: value.primary, borderRadius: value.radius }}>
            Buy Now
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: value.secondary, borderRadius: value.radius }}>
            View All
          </button>
          <span
            className="px-2.5 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: value.accent, borderRadius: value.radius }}>
            20% OFF
          </span>
          <div
            className="h-8 w-32 border border-gray-100"
            style={{ backgroundColor: value.surface, borderRadius: value.radius }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[10px] text-gray-400">Card Surface</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <button onClick={reset}
        className="flex items-center gap-1.5 text-xs text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
        <RotateCcw className="h-3 w-3" /> Reset to LevelX defaults
      </button>
    </div>
  );
}

export { DEFAULT_THEME };
