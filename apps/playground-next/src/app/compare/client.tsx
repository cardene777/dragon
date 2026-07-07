"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import { Github, Rocket, ChevronLeft, ChevronDown, Check } from "lucide-react";
import { DiagramView } from "@/components/DiagramView";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * /compare page — 1 preset を 6 theme grid で並列表示。
 * theme 差分を目視で瞬時に比較、 選択支援 UI として機能。
 *
 * URL query `?preset=<id>` で initial preset 決定、 default = swimlane。
 */
export function CompareClient(): React.ReactElement {
  const [presetId, setPresetId] = useState<string>("swimlane");
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!, [presetId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("preset");
    if (q && PRESETS.some((p) => p.id === q)) setPresetId(q);
  }, []);

  const updatePreset = (id: string): void => {
    setPresetId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("preset", id);
    window.history.replaceState({}, "", url.toString());
  };

  // For theme comparison, override html[data-theme] just for the diagram divs — not global.
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <Link href="/" className="flex items-center gap-3 font-bold text-[var(--color-ink)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-sm">
              <Rocket size={17} />
            </div>
            <span className="text-[15px]">dragon</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
          >
            <ChevronLeft size={14} /> Back to catalog
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-dim)] font-mono">
              Preset
            </span>
            <Select.Root value={presetId} onValueChange={updatePreset}>
              <Select.Trigger className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm min-w-[180px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
                <Select.Value>{preset.title}</Select.Value>
                <Select.Icon>
                  <ChevronDown size={14} className="text-[var(--color-ink-dim)]" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={6}
                  className="z-50 min-w-[240px] overflow-hidden rounded-xl bg-[var(--color-surface)] p-1.5 shadow-2xl"
                >
                  <Select.Viewport>
                    {PRESETS.map((p) => (
                      <Select.Item
                        key={p.id}
                        value={p.id}
                        className="relative flex cursor-pointer items-start rounded-lg px-3 py-2 pr-9 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-2)]"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-[var(--color-ink)]">{p.title}</div>
                          <div className="text-[11.5px] text-[var(--color-ink-dim)] mt-0.5">
                            {p.eyebrow}
                          </div>
                        </div>
                        <Select.ItemIndicator className="absolute right-2 top-2.5">
                          <Check size={14} className="text-[var(--color-accent)]" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          <DarkModeToggle />
          <a
            href="https://github.com/cardene777/dragon"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            aria-label="GitHub"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono">
            Theme comparison
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)]">
            {preset.title} across 6 themes
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-ink-dim)]">
            {preset.subtitle} 各 theme の視覚差分を即比較、 theme 選択の参考に。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <div
              key={t}
              data-theme={t}
              className={cn(
                "group rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]",
                "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover,0_8px_24px_rgba(0,0,0,0.12))]",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                    {THEME_CONFIGS[t].label}
                  </div>
                  <div className="text-[11.5px] text-[var(--color-ink-dim)] mt-0.5">
                    {THEME_CONFIGS[t].description}
                  </div>
                </div>
                <Link
                  href={`/preset/${preset.id}?theme=${t}`}
                  className="rounded-lg bg-[var(--color-surface-2)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`View ${preset.title} with ${THEME_CONFIGS[t].label} theme in detail`}
                >
                  View →
                </Link>
              </div>
              <div className="rounded-xl bg-[var(--color-surface-2)] p-3 shadow-[var(--shadow-inset)]">
                <DiagramView preset={preset} theme={t} className="w-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <CommandPalette theme="neumorphism" onThemeChange={() => undefined} />
    </div>
  );
}
