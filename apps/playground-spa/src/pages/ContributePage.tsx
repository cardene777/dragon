import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import "@/styles/compare.css";

/**
 * /contribute = 旧 contribute.astro placeholder。 旧版は build 時に CONTRIBUTING.md を fs.read で
 * markdown 変換、 SPA では GitHub 上の CONTRIBUTING.md 直リンクで代替。
 */
export function ContributePage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label="パンくずリスト" className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">コントリビュート</span>
          </nav>
          <span className="nm-eyebrow">CONTRIBUTE · OPEN SOURCE</span>
          <h1 className="nm-hero-title">
            <span className="nm-gradient-accent">dragon</span> にコントリビュートする
          </h1>
          <p className="nm-hero-subtitle">
            dragon は MIT License の OSS プロジェクト。 バグ報告 / 機能提案 / PR は GitHub Issues と Pull Request 経由で歓迎する。 開発ガイドライン (test / commit / branch / review) は CONTRIBUTING.md で SSOT。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>CONTRIBUTING.md を読む</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>Issue を起票</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="コントリビュート方法">
          <div className="nm-section-head">
            <h2 className="nm-section-title">コントリビュート方法</h2>
            <p className="nm-section-desc">
              3 経路で貢献可能 (バグ報告 / 機能提案 / PR)。 詳細は CONTRIBUTING.md SSOT を参照。
            </p>
          </div>
          <div className="nm-preset-grid">
            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">1. bug</div>
                <span className="nm-preset-eyebrow">BUG REPORT</span>
                <h3 className="nm-preset-title">バグ報告</h3>
                <p className="nm-preset-subtitle">
                  再現手順 + 期待動作 + 実際の挙動 を GitHub Issue (bug template) で起票。 最小再現コードが付いていれば maintainer は素早く対応できる。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">issue</span>
                  <span className="nm-preset-tag">reproduction</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=bug-report.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>バグを起票</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">2. feature</div>
                <span className="nm-preset-eyebrow">FEATURE REQUEST</span>
                <h3 className="nm-preset-title">機能提案</h3>
                <p className="nm-preset-subtitle">
                  新 DSL 構文 / 新プリセット / アニメーション機能などの提案。 用途 + 期待動作を feature template で提出。 議論 → 合意 → 実装 → PR の順で進む。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">feature</span>
                  <span className="nm-preset-tag">discussion</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=feature-request.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>機能を提案</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">3. PR</div>
                <span className="nm-preset-eyebrow">PULL REQUEST</span>
                <h3 className="nm-preset-title">Pull Request</h3>
                <p className="nm-preset-subtitle">
                  テスト先行 (TDD 推奨、 動作証明なし PR は merge 対象外) + typecheck / build 緑必須 + 1 PR = 1 concern。 詳細は CONTRIBUTING.md § Pull request SSOT。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">test</span>
                  <span className="nm-preset-tag">1 PR = 1 concern</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>PR を作成</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
