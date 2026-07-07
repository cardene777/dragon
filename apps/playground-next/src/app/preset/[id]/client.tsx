"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { CdlDiagramThumbnail } from "@cardenelabs/cdl";
import { Github, Rocket, ChevronLeft, ExternalLink, Share2, LayoutGrid } from "lucide-react";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { useToast } from "@/components/Toast";
import { PRESETS } from "@/lib/presets";

export function PresetDetailClient({
  slug,
}: {
  slug: string;
}): React.ReactElement {
  const { toast } = useToast();
  const [theme, setTheme] = useThemeSync();

  const preset = useMemo(
    () => PRESETS.find((p) => p.slug === slug) ?? PRESETS[0]!,
    [slug],
  );
  const currentIdx = useMemo(
    () => PRESETS.findIndex((p) => p.slug === preset.slug),
    [preset.slug],
  );
  const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length]!;
  const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length]!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        window.location.href = `/preset/${prevPreset.slug}`;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        window.location.href = `/preset/${nextPreset.slug}`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevPreset.slug, nextPreset.slug]);

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
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-[var(--v4-canvas,#f8fafc)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white shadow-sm">
              <Rocket size={17} />
            </div>
            <span className="text-[15px]">dragon</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back to catalog
          </Link>
          <div className="flex-1" />
          <ThemePicker value={theme} onChange={setTheme} />
          <DarkModeToggle />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--nm-bg-base,#e8ecf1)] px-3 py-1.5 text-[13px] font-semibold text-[var(--v4-ink,#1a1f2a)] hover:brightness-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
          >
            <Share2 size={13} />
            Share
          </button>
          <a
            href="https://github.com/cardene777/dragon"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--nm-bg-base,#e8ecf1)] hover:text-[var(--v4-ink,#1a1f2a)]"
            aria-label="GitHub"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
            {preset.eyebrow}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
            {preset.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            {preset.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {preset.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--nm-bg-base,#e8ecf1)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--v4-ink-dim,#5a6270)] font-mono"
              >
                {t}
              </span>
            ))}
            <div className="h-4 w-px bg-[var(--v4-line,#e2e8f0)] mx-2" />
            <a
              href={`/editor#preset=${preset.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-brand,#2d6a8f)] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110 transition-all"
            >
              <ExternalLink size={13} />
              Open in editor
            </a>
            <a
              href={`/compare?preset=${preset.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--nm-bg-base,#e8ecf1)] px-3 py-1.5 text-[13px] font-semibold text-[var(--v4-ink,#1a1f2a)] hover:brightness-95 transition-all"
            >
              <LayoutGrid size={13} />
              Compare themes
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--nm-bg-base,#e8ecf1)] p-6 shadow-inner">
          <CdlDiagramThumbnail diagram={preset.diagram as never} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href={`/preset/${prevPreset.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-canvas,#f8fafc)] px-3 py-2 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)] shadow-sm"
          >
            <ChevronLeft size={13} />
            <span className="opacity-70">prev</span>
            <span className="font-semibold">{prevPreset.title}</span>
          </Link>
          <span className="font-mono text-[11px] text-[var(--v4-ink-mute,#99a3b3)]">
            {currentIdx + 1} / {PRESETS.length}
          </span>
          <Link
            href={`/preset/${nextPreset.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-canvas,#f8fafc)] px-3 py-2 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)] shadow-sm"
          >
            <span className="opacity-70">next</span>
            <span className="font-semibold">{nextPreset.title}</span>
            <ChevronLeft size={13} className="rotate-180" />
          </Link>
        </div>
      </main>
      <CommandPalette theme={theme} onThemeChange={setTheme} />
    </div>
  );
}
