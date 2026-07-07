import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { InViewMount } from "@/components/InViewMount";

/**
 * NmPresetCard = 旧 apps/playground/src/components/PresetCard.astro 忠実移植 (Neumorphism style)。
 * layout = eyebrow + title + subtitle + preview + tags + docs link。
 * CSS = catalog.css の .nm-preset-* SSOT (旧 PresetCard.astro <style> tag 移植)。
 */
export interface NmPresetCardProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  diagram: CdlDiagram;
  onOpen: () => void;
}

export function NmPresetCard({
  id,
  eyebrow,
  title,
  subtitle,
  tags = [],
  diagram,
  onOpen,
}: NmPresetCardProps): React.ReactElement {
  return (
    <article className="nm-preset-card">
      <header className="nm-preset-card-head">
        <div className="nm-preset-id">{id}</div>
        <span className="nm-preset-eyebrow">{eyebrow}</span>
        <h3 className="nm-preset-title">{title}</h3>
        {subtitle && <p className="nm-preset-subtitle">{subtitle}</p>}
      </header>

      <div className="nm-preset-preview">
        <InViewMount
          className="w-full h-full"
          placeholder={
            <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
              loading…
            </div>
          }
        >
          <CdlDiagramView diagram={diagram as never} hideHeader />
        </InViewMount>
      </div>

      <footer className="nm-preset-card-foot">
        <div className="nm-preset-tags">
          {tags.map((t) => (
            <span key={t} className="nm-preset-tag">
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="nm-preset-docs"
          aria-label={`${title} を拡大表示`}
        >
          <span>拡大</span>
          <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
        </button>
      </footer>
    </article>
  );
}
