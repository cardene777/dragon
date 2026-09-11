import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";
import "@/styles/compare.css";

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
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">リリースノート</span>
          </nav>
          <span className="nm-eyebrow">公開の記録 · v0.5 が最新</span>
          <h1 className="nm-hero-title">
            リリース<span className="nm-gradient-accent">ノート</span>
          </h1>
          <p className="nm-hero-subtitle">
            dragon DSL のリリースごとの主要変更を要約表示。 詳細なリリースノートは GitHub 上の CHANGELOG.md を参照。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>CHANGELOG を GitHub で見る</span>
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
              現時点の最新リリースは v0.5 (Text DSL × SVG アニメーション)。 個別リリースノートは GitHub 経由で参照する。
            </p>
          </div>
          <article className="nm-preset-card">
            <header className="nm-preset-card-head">
              <div className="nm-preset-id">v0.5</div>
              <span className="nm-preset-eyebrow">テキスト記法 × 動く SVG</span>
              <h3 className="nm-preset-title">v0.5 (最新)</h3>
              <p className="nm-preset-subtitle">
                Text DSL parser + 12 プリセット (sequence / flow / topology / er / state / class / mind / pie / c4 / gantt / code / chart) + 明暗 2 通りの表示。
              </p>
            </header>
            <footer className="nm-preset-card-foot">
              <div className="nm-preset-tags">
                <span className="nm-preset-tag">v0.5</span>
                <span className="nm-preset-tag">12 プリセット</span>
                <span className="nm-preset-tag">明暗 2 表示</span>
              </div>
              <a
                href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="nm-preset-docs"
                aria-label="v0.5 の CHANGELOG を GitHub で読む"
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
