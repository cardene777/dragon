"use client";

import Link from "next/link";
import { Github, Rocket, ChevronLeft, ExternalLink, Share2 } from "lucide-react";
import { DiagramView } from "@/components/DiagramView";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useToast } from "@/components/Toast";
import type { PresetDoc } from "@/lib/presets";

/**
 * /preset/[id] detail page — client component。
 *
 * SSR = generateStaticParams で 10 preset pre-render (page.tsx server component)。
 * client = 本 file、 theme picker + dark mode toggle + preview + share button。
 */
export function PresetDetailClient({ preset }: { preset: PresetDoc }): React.ReactElement {
  const { toast } = useToast();
  const [theme, setTheme] = useThemeSync();

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        type: "success",
        title: "URL copied",
        description: window.location.href,
      });
    } catch {
      toast({ type: "error", title: "Copy failed" });
    }
  };

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
          <ThemePicker value={theme} onChange={setTheme} />
          <DarkModeToggle />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-2)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] hover:brightness-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <Share2 size={13} />
            Share
          </button>
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
            {preset.eyebrow}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
            {preset.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
            {preset.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {preset.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-ink-dim)] font-mono"
              >
                {t}
              </span>
            ))}
            <div className="h-4 w-px bg-[var(--color-border-soft)] mx-2" />
            <a
              href={`/editor#preset=${preset.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110 transition-all"
            >
              <ExternalLink size={13} />
              Open in editor
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface-2)] p-6 shadow-[var(--shadow-inset)]">
          <DiagramView
            preset={preset}
            theme={theme}
            interactive
            className="mx-auto max-h-[70vh] w-full"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Nodes
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {preset.nodes.length}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Edges
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {preset.edges.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
