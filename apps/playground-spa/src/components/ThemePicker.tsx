import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Palette } from "lucide-react";
import { THEMES, THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/useLocale";

export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeName;
  onChange: (v: ThemeName) => void;
}): React.ReactElement {
  const [locale] = useLocale();
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-ink-dim,#5a6270)] font-mono">
        <Palette size={12} className="inline mr-1.5 -translate-y-px" />
        Theme
      </span>
      <Select.Root value={value} onValueChange={(v) => onChange(v as ThemeName)}>
        <Select.Trigger
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium sm:px-4",
            "bg-white text-[var(--v4-ink,#1a1f2a)] shadow-sm hover:shadow transition-shadow",
            "min-w-[140px] sm:min-w-[240px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]",
          )}
          aria-label={locale === "ja" ? "テーマ切替" : "Theme"}
        >
          <Select.Value>
            <span className="sm:hidden">{THEME_CONFIGS[value].label}</span>
            <span className="hidden sm:inline">
              {THEME_CONFIGS[value].label}{" "}
              <span className="text-[var(--v4-ink-dim,#5a6270)]">
                — {THEME_CONFIGS[value].description.split("、")[0]}
              </span>
            </span>
          </Select.Value>
          <Select.Icon>
            <ChevronDown size={14} className="text-[var(--v4-ink-dim,#5a6270)]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            className="z-50 min-w-[320px] overflow-hidden rounded-xl bg-white p-1.5 shadow-2xl"
          >
            <Select.Viewport>
              {THEMES.map((t) => (
                <Select.Item
                  key={t}
                  value={t}
                  className={cn(
                    "relative flex cursor-pointer select-none items-start rounded-lg px-3 py-2.5 pr-9 text-sm outline-none",
                    "data-[highlighted]:bg-[var(--v4-canvas,#f8fafc)]",
                    "data-[state=checked]:bg-[var(--v4-canvas,#f8fafc)]",
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium text-[var(--v4-ink,#1a1f2a)]">
                      {THEME_CONFIGS[t].label}
                    </div>
                    <div className="text-[12px] text-[var(--v4-ink-dim,#5a6270)] mt-0.5">
                      {THEME_CONFIGS[t].description}
                    </div>
                  </div>
                  <Select.ItemIndicator className="absolute right-2 top-3">
                    <Check size={14} className="text-[var(--v4-brand,#2d6a8f)]" />
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
