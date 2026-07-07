"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

type Mode = "light" | "dark" | "system";

/**
 * Dark mode toggle (3-way: light / dark / system)。
 *
 * html.dark class を管理、 tokens.css の `html.dark[data-theme="..."]` selector で
 * dark palette override が反映される。
 * localStorage で永続化、 system 選択時は prefers-color-scheme に追随する。
 */
export function DarkModeToggle(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("dragon-color-mode") as Mode) ?? "system";
    setMode(stored);
    applyMode(stored);

    if (stored === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (): void => applyMode("system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    return undefined;
  }, []);

  const applyMode = (m: Mode): void => {
    const isDark =
      m === "dark" ||
      (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };

  const onChange = (m: Mode): void => {
    setMode(m);
    localStorage.setItem("dragon-color-mode", m);
    applyMode(m);
  };

  const currentIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const Icon = currentIcon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Toggle color mode"
          className={cn(
            "rounded-lg p-2 text-[var(--color-ink-dim)] transition-colors",
            "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
          )}
        >
          <Icon size={15} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="end"
          className="z-50 min-w-[160px] overflow-hidden rounded-xl bg-[var(--color-surface)] p-1.5 shadow-2xl"
        >
          {[
            { key: "light" as const, label: "Light", icon: Sun },
            { key: "dark" as const, label: "Dark", icon: Moon },
            { key: "system" as const, label: "System", icon: Monitor },
          ].map((opt) => {
            const OptIcon = opt.icon;
            return (
              <DropdownMenu.Item
                key={opt.key}
                onSelect={() => onChange(opt.key)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none",
                  "data-[highlighted]:bg-[var(--color-surface-2)]",
                  mode === opt.key && "font-semibold text-[var(--color-accent)]",
                )}
              >
                <OptIcon size={14} />
                {opt.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
