import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";
import { CATEGORIES } from "@/lib/catalog";
import { PRESETS } from "@/lib/presets";
import "@/styles/compare.css";

/** 版の札が指す分類の呼び名 (#1805)。 出どころは `CATEGORIES[].label` 1 つ (#1788) */
const 分類の呼び名 = CATEGORIES.find((c) => c.slug === "presets")?.label ?? "";

/**
 * /release-notes = 旧 release-notes.astro placeholder。 旧版は CHANGELOG.md parse で
 * releases data を build 時生成、 SPA では GitHub 上の CHANGELOG.md への link で代替。
 */
export function ReleaseNotesPage(): React.ReactElement {
  const [locale] = useLocale();
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "道筋" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">更新履歴</span>
          </nav>
          <span className="nm-eyebrow">公開の記録 · v0.5 が最新</span>
          <h1 className="nm-hero-title">
            更新<span className="nm-gradient-accent">履歴</span>
          </h1>
          <p className="nm-hero-subtitle">
            dragon の版ごとの主な変更を要約して並べる。 くわしい記録は GitHub 上の CHANGELOG.md にある。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>変更の記録を GitHub で見る</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>GitHub リリース一覧</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="最新リリース概要">
          <div className="nm-section-head">
            <h2 className="nm-section-title">最新リリース</h2>
            <p className="nm-section-desc">
              いまの最新は v0.5 (テキスト記法と動く SVG)。 版ごとの記録は GitHub で読む。
            </p>
          </div>
          <article className="nm-preset-card">
            <header className="nm-preset-card-head">
              <div className="nm-preset-id">v0.5</div>
              <span className="nm-preset-eyebrow">テキスト記法 × 動く SVG</span>
              <h3 className="nm-preset-title">v0.5 (最新)</h3>
              {/* 描ける図の種類は一覧が持つ (#1806)。 ここに名前を並べると、図を足した日から古くなる */}
              <p className="nm-preset-subtitle">
                テキスト記法の読み取りと、明暗 2 通りの表示。 どんな図が描けるかは{" "}
                <Link to="/catalog/presets">{分類の呼び名}の一覧</Link> で確かめられる。
              </p>
            </header>
            <footer className="nm-preset-card-foot">
              <div className="nm-preset-tags">
                <span className="nm-preset-tag">v0.5</span>
                {/* 数は実物から出す (#1806)。 字で書くと見本を足した日から古くなる */}
                <span className="nm-preset-tag">
                  {PRESETS.length} {分類の呼び名}
                </span>
                <span className="nm-preset-tag">明暗 2 表示</span>
              </div>
              <a
                href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="nm-preset-docs"
                aria-label="v0.5 の変更の記録を GitHub で読む"
              >
                <span>GitHub で読む</span>
                <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
              </a>
            </footer>
          </article>
        </section>
      </main>
    </div>
  );
}
