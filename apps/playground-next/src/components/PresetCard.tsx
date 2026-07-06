"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Maximize2 } from "lucide-react";
import { DiagramView } from "./DiagramView";
import type { PresetDoc } from "@/lib/presets";
import type { ThemeName } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * 1 preset を Neumorphism card で表示、 click で Radix Dialog modal で拡大表示。
 *
 * modal は Portal で body 直下に mount、 z-index 気にせず overlay + centered content。
 * Escape / 背景 click / × button で close。
 *
 * hydrate は Server Component (page.tsx) から client boundary としてこの component、
 * Diagram SVG は client 側で描画 (rough.js useMemo 依存)。
 */
export function PresetCard({
  preset,
  theme,
}: {
  preset: PresetDoc;
  theme: ThemeName;
}): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article
        className={cn(
          "group flex flex-col rounded-2xl p-6 transition-all",
          "bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
          "hover:shadow-[var(--shadow-card-hover,0_8px_24px_rgba(0,0,0,0.12))] hover:-translate-y-1",
        )}
      >
        <header className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono">
            {preset.eyebrow}
          </div>
          <h3 className="mt-1 text-[17px] font-bold tracking-tight text-[var(--color-ink)]">
            {preset.title}
          </h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink-dim)]">
            {preset.subtitle}
          </p>
        </header>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${preset.title} を拡大表示`}
          className={cn(
            "relative w-full flex-1 min-h-[240px] rounded-xl overflow-hidden cursor-zoom-in",
            "bg-[var(--color-surface-2)] p-4",
            "shadow-[var(--shadow-inset)]",
            "transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
          )}
        >
          <DiagramView preset={preset} theme={theme} className="w-full h-full" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2 py-1 text-[10px] font-medium text-[var(--color-ink-dim)] shadow-sm">
              <Maximize2 size={10} /> Expand
            </span>
          </div>
        </button>

        <footer className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {preset.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-[10.5px] font-medium text-[var(--color-ink-dim)] font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        </footer>
      </article>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[94vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--color-surface)] p-8 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono">
                  {preset.eyebrow}
                </div>
                <Dialog.Title className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {preset.title}
                </Dialog.Title>
                <Dialog.Description className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
                  {preset.subtitle}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-full p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-2)] p-6 shadow-inner">
              <DiagramView
                preset={preset}
                theme={theme}
                interactive
                className="mx-auto max-h-[70vh] w-full"
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
