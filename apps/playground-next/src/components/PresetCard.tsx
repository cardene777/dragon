"use client";

import { CdlDiagramThumbnail } from "@cardenelabs/cdl";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { PresetMetadata } from "@/lib/presets";
import { cn } from "@/lib/cn";

/**
 * PresetCard — 1 preset を Neumorphism raised card で表示、 preview は cdl の
 * CdlDiagramThumbnail (click で内蔵 modal 拡大表示 + phase animation + tween diff)。
 *
 * modal は cdl side で完全実装 (thumbnail.tsx SSOT)、 dragon 側では wrap しない。
 * 6 theme override は cdl-theme.css の `[data-cdl-theme] [data-cdl-role]` selector で
 * cdl SVG の各 role に CSS 適用。
 */
export function PresetCard({
  preset,
}: {
  preset: PresetMetadata;
}): React.ReactElement {
  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl p-6 transition-all duration-300",
        "bg-[var(--nm-surface,#f0f3f7)] shadow-[var(--nm-shadow-raised-soft,0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04))]",
        "hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1",
        "focus-within:ring-2 focus-within:ring-[var(--v4-brand,#2d6a8f)] focus-within:ring-offset-2",
      )}
    >
      <header className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
          {preset.eyebrow}
        </div>
        <h3 className="mt-1 text-[17px] font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
          {preset.title}
        </h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          {preset.subtitle}
        </p>
      </header>

      <div className="preset-preview flex-1 rounded-xl overflow-hidden bg-[var(--nm-bg-base,#e8ecf1)] p-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.4)]">
        <CdlDiagramThumbnail diagram={preset.diagram as never} hideHeader />
      </div>

      <footer className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {preset.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--nm-bg-base,#e8ecf1)] px-2.5 py-0.5 text-[10.5px] font-medium text-[var(--v4-ink-dim,#5a6270)] font-mono"
            >
              {t}
            </span>
          ))}
        </div>
        <Link
          href={`/preset/${preset.slug}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[var(--v4-brand,#2d6a8f)] hover:bg-[var(--nm-bg-base,#e8ecf1)] transition-colors"
        >
          Detail
          <ExternalLink size={11} />
        </Link>
      </footer>
    </article>
  );
}
