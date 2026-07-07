"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Keyboard } from "lucide-react";
import { THEMES, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * Keyboard shortcut system。
 * `?` で help modal 表示、 `T` で theme cycle、 `E` で editor 遷移、 `/` で search focus。
 *
 * modal 内 focus trap + Escape close は Radix Dialog に委譲。
 */

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

export function KeyboardShortcuts({
  theme,
  onThemeChange,
}: {
  theme: ThemeName;
  onThemeChange: (v: ThemeName) => void;
}): React.ReactElement {
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: "?",
      description: "Show keyboard shortcuts",
      action: () => setHelpOpen(true),
    },
    {
      key: "T",
      description: "Cycle themes forward (Shift+T = backward)",
      action: () => {
        const currentIdx = THEMES.indexOf(theme);
        const nextIdx = (currentIdx + 1) % THEMES.length;
        onThemeChange(THEMES[nextIdx]!);
      },
    },
    {
      key: "E",
      description: "Open editor page",
      action: () => (window.location.href = "/editor"),
    },
    {
      key: "D",
      description: "Open docs page",
      action: () => (window.location.href = "/docs"),
    },
    {
      key: "/",
      description: "Focus search",
      action: () => {
        const el = document.querySelector<HTMLInputElement>('input[aria-label="Search presets"]');
        el?.focus();
      },
    },
    {
      key: "Esc",
      description: "Close modal / clear search",
      action: () => {
        // handled by Radix + browser default
      },
    },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Skip if user is typing in an input / textarea / contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        const currentIdx = THEMES.indexOf(theme);
        const nextIdx = (currentIdx + dir + THEMES.length) % THEMES.length;
        onThemeChange(THEMES[nextIdx]!);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        window.location.href = "/editor";
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        window.location.href = "/docs";
      } else if (e.key === "/") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[aria-label="Search presets"]');
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [theme, onThemeChange]);

  return (
    <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
                <Keyboard size={16} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-[var(--color-ink)]">
                  Keyboard shortcuts
                </Dialog.Title>
                <Dialog.Description className="text-[12px] text-[var(--color-ink-dim)]">
                  Press <kbd className="rounded bg-[var(--color-surface-2)] px-1 py-0.5 font-mono text-[10px]">?</kbd> any time to open
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-full p-1.5 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="grid gap-2">
            {shortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--color-surface-2)]"
              >
                <span className="text-[13px] text-[var(--color-ink)]">{s.description}</span>
                <kbd
                  className={cn(
                    "rounded-md bg-[var(--color-surface-2)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--color-ink-dim)]",
                  )}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
