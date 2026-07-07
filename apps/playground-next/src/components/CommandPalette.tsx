"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Palette, FileCode, BookOpen, Rocket, ArrowRight, Command as CmdIcon } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * Command palette (Cmd+K / Ctrl+K)。
 * VS Code / Linear / Raycast pattern。
 *
 * 3 category:
 *   1. Preset navigation (Open swimlane / Open topology / etc)
 *   2. Theme switch (Switch to Blueprint / Handdrawn / etc)
 *   3. Page navigation (Open editor / Open docs)
 *
 * fuzzy search で filter、 ↑↓ で select、 Enter で execute、 Esc で close。
 */

interface CommandItem {
  id: string;
  category: "preset" | "theme" | "page";
  label: string;
  description?: string;
  icon: React.ReactElement;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  theme,
  onThemeChange,
}: {
  theme: ThemeName;
  onThemeChange: (v: ThemeName) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const items: CommandItem[] = useMemo(() => {
    return [
      // Presets
      ...PRESETS.map((p) => ({
        id: `preset-${p.id}`,
        category: "preset" as const,
        label: `Open ${p.title}`,
        description: p.subtitle,
        icon: <FileCode size={14} />,
        action: () => (window.location.href = `/preset/${p.id}`),
        keywords: [p.title, p.eyebrow, ...p.tags],
      })),
      // Themes
      ...THEMES.filter((t) => t !== theme).map((t) => ({
        id: `theme-${t}`,
        category: "theme" as const,
        label: `Switch to ${THEME_CONFIGS[t].label}`,
        description: THEME_CONFIGS[t].description,
        icon: <Palette size={14} />,
        action: () => {
          onThemeChange(t);
          setOpen(false);
        },
        keywords: [THEME_CONFIGS[t].label, THEME_CONFIGS[t].description],
      })),
      // Pages
      {
        id: "page-catalog",
        category: "page" as const,
        label: "Go to Catalog",
        icon: <Rocket size={14} />,
        action: () => (window.location.href = "/"),
      },
      {
        id: "page-editor",
        category: "page" as const,
        label: "Open Editor",
        icon: <FileCode size={14} />,
        action: () => (window.location.href = "/editor"),
      },
      {
        id: "page-docs",
        category: "page" as const,
        label: "Read Docs",
        icon: <BookOpen size={14} />,
        action: () => (window.location.href = "/docs"),
      },
    ];
  }, [theme, onThemeChange]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((idx) => Math.min(idx + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((idx) => Math.max(idx - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const item = filtered[selectedIdx];
          if (item) item.action();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selectedIdx]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query, filtered.length]);

  const grouped = useMemo(() => {
    const map = new Map<CommandItem["category"], CommandItem[]>();
    filtered.forEach((item) => {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    });
    return map;
  }, [filtered]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[20vh] z-50 w-[560px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-2xl focus:outline-none">
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-4 py-3">
            <Search size={16} className="text-[var(--color-ink-dim)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, presets, themes…"
              autoFocus
              className="flex-1 bg-transparent text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] focus:outline-none"
            />
            <kbd className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-mute)]">
              esc
            </kbd>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="p-4 text-center text-[13px] text-[var(--color-ink-dim)]">
                No commands match "{query}"
              </p>
            )}
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category} className="mb-3">
                <div className="mb-1 px-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                  {category === "preset" ? "Presets" : category === "theme" ? "Themes" : "Pages"}
                </div>
                {items.map((item, idx) => {
                  const overallIdx = filtered.indexOf(item);
                  const isSelected = overallIdx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIdx(overallIdx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-[var(--color-surface-2)]"
                          : "hover:bg-[var(--color-surface-2)]",
                      )}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-ink-dim)]">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[var(--color-ink)]">
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="truncate text-[11.5px] text-[var(--color-ink-dim)]">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight size={12} className="text-[var(--color-accent)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-border-soft)] bg-[var(--color-surface-2)] px-4 py-2 text-[10.5px] text-[var(--color-ink-mute)]">
            <div className="flex items-center gap-3 font-mono">
              <kbd className="rounded bg-[var(--color-surface)] px-1 py-0.5 shadow-sm">↑↓</kbd>
              <span>navigate</span>
              <kbd className="rounded bg-[var(--color-surface)] px-1 py-0.5 shadow-sm">↵</kbd>
              <span>select</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <CmdIcon size={10} />
              <kbd className="rounded bg-[var(--color-surface)] px-1 py-0.5 shadow-sm">K</kbd>
              <span>to open</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
