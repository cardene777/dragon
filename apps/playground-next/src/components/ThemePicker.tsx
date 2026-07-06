"use client";

import { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Palette } from "lucide-react";
import { THEME_CONFIGS, THEMES, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * theme dropdown selector。 選択で html[data-theme] を書き換えて
 * CSS var 経由で全 component が新 theme に切替、 diagram も再 render される。
 *
 * URL query `?theme=<name>` 対応、 default = neumorphism。
 * localStorage 保存で refresh 後も選択維持。
 */
export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeName;
  onChange: (v: ThemeName) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-dim)] font-mono">
        <Palette size={12} className="inline mr-1.5 -translate-y-px" />
        Theme
      </span>
      <Select.Root value={value} onValueChange={(v) => onChange(v as ThemeName)}>
        <Select.Trigger
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium sm:px-4",
            "bg-[var(--color-surface)] text-[var(--color-ink)]",
            "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
            "min-w-[140px] sm:min-w-[240px] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          )}
          aria-label="Theme"
        >
          <Select.Value>
            <span className="sm:hidden">{THEME_CONFIGS[value].label}</span>
            <span className="hidden sm:inline">
              {THEME_CONFIGS[value].label} <span className="text-[var(--color-ink-dim)]">— {THEME_CONFIGS[value].description.split("、")[0]}</span>
            </span>
          </Select.Value>
          <Select.Icon>
            <ChevronDown size={14} className="text-[var(--color-ink-dim)]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            className="z-50 min-w-[320px] overflow-hidden rounded-xl bg-[var(--color-surface)] p-1.5 shadow-2xl"
          >
            <Select.Viewport>
              {THEMES.map((t) => (
                <Select.Item
                  key={t}
                  value={t}
                  className={cn(
                    "relative flex cursor-pointer select-none items-start rounded-lg px-3 py-2.5 pr-9 text-sm outline-none",
                    "data-[highlighted]:bg-[var(--color-surface-2)]",
                    "data-[state=checked]:bg-[var(--color-surface-2)]",
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-ink)]">{THEME_CONFIGS[t].label}</div>
                    <div className="text-[12px] text-[var(--color-ink-dim)] mt-0.5">
                      {THEME_CONFIGS[t].description}
                    </div>
                  </div>
                  <Select.ItemIndicator className="absolute right-2 top-3">
                    <Check size={14} className="text-[var(--color-accent)]" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

/**
 * theme を html[data-theme] に反映 + localStorage 永続化 + URL query 同期する hook。
 */
export function useThemeSync(): [ThemeName, (v: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>("neumorphism");

  useEffect(() => {
    // 初回 mount で URL query > localStorage > default の順に決定
    const url = new URL(window.location.href);
    const qTheme = url.searchParams.get("theme") as ThemeName | null;
    const lsTheme = localStorage.getItem("dragon-theme") as ThemeName | null;
    const initial = qTheme && THEMES.includes(qTheme) ? qTheme : lsTheme && THEMES.includes(lsTheme) ? lsTheme : "neumorphism";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const update = (v: ThemeName): void => {
    setTheme(v);
    document.documentElement.setAttribute("data-theme", v);
    try {
      localStorage.setItem("dragon-theme", v);
    } catch {
      // ignore
    }
    const url = new URL(window.location.href);
    if (v === "neumorphism") {
      url.searchParams.delete("theme");
    } else {
      url.searchParams.set("theme", v);
    }
    window.history.replaceState({}, "", url.toString());
  };

  return [theme, update];
}
