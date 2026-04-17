"use client";

import { useState, useCallback, useTransition } from "react";
import { Loader2, Save, CheckCircle2, AlertCircle, Palette, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeEditor, type ThemeConfig } from "@/components/admin/theme-editor";
import { SectionManager, type PageSection } from "@/components/admin/section-manager";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StoreConfig {
  theme:  ThemeConfig;
  layout: PageSection[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ── Component ─────────────────────────────────────────────────────────────────
export function BuilderClient({ initial }: { initial: StoreConfig }) {
  const [config, setConfig]     = useState<StoreConfig>(initial);
  const [status, setStatus]     = useState<SaveStatus>("idle");
  const [isDirty, setIsDirty]   = useState(false);
  const [, startTransition]     = useTransition();

  const updateTheme = useCallback((theme: ThemeConfig) => {
    setConfig((c) => ({ ...c, theme }));
    setIsDirty(true);
    setStatus("idle");
  }, []);

  const updateLayout = useCallback((layout: PageSection[]) => {
    setConfig((c) => ({ ...c, layout }));
    setIsDirty(true);
    setStatus("idle");
  }, []);

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/store-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: config.theme, layout: config.layout }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
      setIsDirty(false);
      startTransition(() => {
        setTimeout(() => setStatus("idle"), 3000);
      });
    } catch {
      setStatus("error");
    }
  };

  const StatusIcon = () => {
    if (status === "saving") return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === "saved")  return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "error")  return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Save Bar ── */}
      <div className={[
        "flex items-center justify-between rounded-2xl border px-5 py-3.5 transition-all",
        isDirty
          ? "bg-amber-50 border-amber-200"
          : status === "saved"
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-gray-100",
      ].join(" ")}>
        <div className="flex items-center gap-2.5">
          <StatusIcon />
          <span className="text-sm font-semibold text-[var(--color-ceramic)]">
            {status === "saving" && "Saving changes…"}
            {status === "saved"  && "All changes saved to Supabase ✓"}
            {status === "error"  && "Save failed — please try again"}
            {status === "idle" && isDirty  && "You have unsaved changes"}
            {status === "idle" && !isDirty && "Storefront configuration"}
          </span>
        </div>
        <Button
          onClick={save}
          disabled={status === "saving" || (!isDirty && status !== "error")}
          className={[
            "h-9 px-5 text-sm font-semibold transition-all",
            isDirty || status === "error"
              ? "bg-[var(--color-ceramic)] text-white hover:bg-[var(--color-ceramic)]/90"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          ].join(" ")}>
          {status === "saving" ? (
            <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Saving…</>
          ) : (
            <><Save className="h-3.5 w-3.5 mr-2" />Save Changes</>
          )}
        </Button>
      </div>

      {/* ── Bento Grid: Theme + Sections ── */}
      <Tabs defaultValue="theme">
        <TabsList className="mb-6 bg-[var(--color-obsidian)] rounded-xl p-1 h-auto gap-1">
          <TabsTrigger value="theme"
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold
              data-active:bg-white data-active:shadow-sm data-active:text-[var(--color-ceramic)]
              text-[var(--color-slate)]">
            <Palette className="h-4 w-4" />
            Theme Settings
          </TabsTrigger>
          <TabsTrigger value="sections"
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold
              data-active:bg-white data-active:shadow-sm data-active:text-[var(--color-ceramic)]
              text-[var(--color-slate)]">
            <LayoutGrid className="h-4 w-4" />
            Section Manager
            <span className="ml-1 rounded-full bg-[var(--color-mint)] px-2 py-0.5 text-[10px] font-bold text-white">
              {config.layout.filter((s) => s.visible).length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Theme Settings Tab ── */}
        <TabsContent value="theme">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[var(--color-ceramic)]">Theme & Brand Colours</h2>
              <p className="text-xs text-[var(--color-slate)] mt-0.5">
                Choose a preset or customise individual brand tokens. Changes preview instantly.
              </p>
            </div>
            <ThemeEditor value={config.theme} onChange={updateTheme} />
          </div>
        </TabsContent>

        {/* ── Section Manager Tab ── */}
        <TabsContent value="sections">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[var(--color-ceramic)]">Home Page Sections</h2>
              <p className="text-xs text-[var(--color-slate)] mt-0.5">
                Reorder with arrows, toggle visibility with the eye icon, or add custom sections.
              </p>
            </div>
            <SectionManager value={config.layout} onChange={updateLayout} />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Bento Preview Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Colour tokens summary */}
        <div className="col-span-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-ceramic)] mb-3">Active Tokens</p>
          <div className="space-y-2">
            {(["primary", "secondary", "accent", "surface"] as const).map((key) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-md ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: config.theme[key] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[var(--color-ceramic)] capitalize">{key}</p>
                  <p className="text-[10px] font-mono text-[var(--color-slate)]">{config.theme[key]}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="h-5 w-5 rounded-md bg-gray-100 shrink-0 flex items-center justify-center">
                <div className="h-3 w-3 border-2 border-gray-400" style={{ borderRadius: config.theme.radius }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-ceramic)]">Radius</p>
                <p className="text-[10px] font-mono text-[var(--color-slate)]">{config.theme.radius}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section order summary */}
        <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-ceramic)] mb-3">Page Layout Preview</p>
          <div className="space-y-1.5">
            {[...config.layout]
              .sort((a, b) => a.order - b.order)
              .map((section, idx) => (
                <div key={section.id}
                  className={[
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs",
                    section.visible
                      ? "bg-[var(--color-obsidian)]"
                      : "opacity-40",
                  ].join(" ")}>
                  <span className="w-4 text-center text-[10px] font-bold text-gray-300">{idx + 1}</span>
                  <div className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: section.visible ? config.theme.primary + "30" : "#e5e7eb" }} />
                  <span className="font-medium text-[var(--color-ceramic)] w-28 truncate">{section.label}</span>
                  <span className={`text-[10px] font-semibold ${section.visible ? "text-emerald-500" : "text-gray-300"}`}>
                    {section.visible ? "●" : "○"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
