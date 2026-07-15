import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS } from "@/lib/theme";
import { InViewMount } from "@/components/InViewMount";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";
import "@/styles/compare.css";

/**
 * /compare = 選択した preset を 6 theme で並列表示 (Neumorphism style)。
 * hero + preset select toolbar + 6 theme grid (data-cdl-theme + CdlDiagramView)。
 */
export function ComparePage(): React.ReactElement {
  const [locale] = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSlug = searchParams.get("preset") ?? "swimlane";
  const [presetSlug, setPresetSlug] = useState<string>(initialSlug);

  const preset = useMemo(
    () => PRESETS.find((p) => p.slug === presetSlug) ?? PRESETS[0],
    [presetSlug],
  );

  useEffect(() => {
    setSearchParams(
      (params) => {
        params.set("preset", presetSlug);
        return params;
      },
      { replace: true },
    );
  }, [presetSlug, setSearchParams]);

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">テーマ比較</span>
          </nav>
          <span className="nm-eyebrow">THEME COMPARISON · 6 THEMES</span>
          <h1 className="nm-hero-title">
            {preset.title} <span className="nm-gradient-accent">× 6 テーマ</span>
          </h1>
          <p className="nm-hero-subtitle">
            {preset.subtitle} 選択したプリセットを Blueprint / Neumorphism / Circuit / Handdrawn / Pinboard / Isometric の 6 テーマで並列表示、 視覚的な差異を確認できる。
          </p>
          <div className="nm-hero-actions">
            <div className="nm-preset-select-wrap">
              <Select.Root value={presetSlug} onValueChange={setPresetSlug}>
                <Select.Trigger className="nm-preset-select-trigger" aria-label="プリセットを選択">
                  <Select.Value>{preset.title}</Select.Value>
                  <Select.Icon>
                    <ChevronDown size={14} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={6}
                    className="nm-preset-select-content"
                  >
                    <Select.Viewport>
                      {PRESETS.map((p) => (
                        <Select.Item key={p.slug} value={p.slug} className="nm-preset-select-item">
                          <div className="flex-1">
                            <div className="font-medium">{p.title}</div>
                            <div className="text-[11.5px] opacity-70">{p.eyebrow}</div>
                          </div>
                          <Select.ItemIndicator className="ml-2">
                            <Check size={14} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <Link to="/editor" className="nm-hero-btn nm-hero-btn-secondary">
              <span>エディタで開く</span>
            </Link>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="テーマ比較グリッド">
          <div className="nm-section-head">
            <h2 className="nm-section-title">
              テーマ <span className="nm-section-count">({THEMES.length})</span>
            </h2>
            <p className="nm-section-desc">
              各テーマは <code>data-cdl-theme</code> 属性で切り替わる。 Blueprint = 設計図、 Neumorphism = 立体、 Circuit = PCB、 Handdrawn = 手描き、 Pinboard = 掲示板、 Isometric = 3D。
            </p>
          </div>
          <div className="nm-preset-grid">
            {THEMES.map((t) => (
              <article key={t} data-cdl-theme={t} className="nm-preset-card">
                <header className="nm-preset-card-head">
                  <span className="nm-preset-eyebrow">{THEME_CONFIGS[t].label}</span>
                  <h3 className="nm-preset-title">{THEME_CONFIGS[t].label}</h3>
                  <p className="nm-preset-subtitle">{THEME_CONFIGS[t].description}</p>
                </header>
                <div className="nm-preset-preview">
                  <InViewMount
                    className="w-full h-full"
                    placeholder={
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
                        読み込み中…
                      </div>
                    }
                  >
                    <CdlDiagramView diagram={preset.diagram as never} hideHeader />
                  </InViewMount>
                </div>
                <footer className="nm-preset-card-foot">
                  <div className="nm-preset-tags">
                    <span className="nm-preset-tag">{t}</span>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
