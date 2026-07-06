"use client";

import { THEMES, THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * ThemeStrip — 6 theme を palette dot で並べる compact selector。
 * Header に置ける横幅コンパクトな visual switcher、 hover で theme name tooltip。
 *
 * mermaid.live の theme dropdown より高速に切替可能、 mobile でも 100px 幅程度で並ぶ。
 */

const THEME_COLORS: Record<ThemeName, { primary: string; accent: string }> = {
  blueprint: { primary: "#1e426c", accent: "#5a8ec1" },
  neumorphism: { primary: "#e8ecf1", accent: "#4a7fc8" },
  circuit: { primary: "#0a1a12", accent: "#c8a038" },
  handdrawn: { primary: "#fdf7d9", accent: "#a94a3a" },
  pinboard: { primary: "#d4b78a", accent: "#d94a2a" },
  isometric: { primary: "#e4e0d0", accent: "#6a4a30" },
};

export function ThemeStrip({
  value,
  onChange,
  className,
}: {
  value: ThemeName;
  onChange: (v: ThemeName) => void;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {THEMES.map((t) => {
        const active = t === value;
        const colors = THEME_COLORS[t];
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            title={THEME_CONFIGS[t].label}
            aria-label={`Switch to ${THEME_CONFIGS[t].label} theme`}
            aria-pressed={active}
            className={cn(
              "relative h-6 w-6 rounded-full transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
              active ? "scale-125 ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]" : "hover:scale-110 opacity-70 hover:opacity-100",
            )}
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 50%, ${colors.accent} 50%)`,
              border: `1px solid rgba(0, 0, 0, 0.15)`,
            }}
          />
        );
      })}
    </div>
  );
}
