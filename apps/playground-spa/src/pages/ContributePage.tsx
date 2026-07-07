import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";

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
          <nav aria-label="パンくず" className="nm-crumb">
            <Link to="/">overview</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">contribute</span>
          </nav>
          <span className="nm-eyebrow">CONTRIBUTE · OPEN SOURCE</span>
          <h1 className="nm-hero-title">
            Contribute to <span className="nm-gradient-accent">dragon</span>
          </h1>
          <p className="nm-hero-subtitle">
            dragon は MIT License の OSS プロジェクト。 bug 報告 / feature 提案 / PR は GitHub Issues と Pull Request 経由で歓迎する。 開発ガイドライン (test / commit / branch / review) は CONTRIBUTING.md で SSOT。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>Read CONTRIBUTING.md</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>Open an issue</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="how to contribute">
          <div className="nm-section-head">
            <h2 className="nm-section-title">How to contribute</h2>
            <p className="nm-section-desc">
              3 経路で貢献可能 (bug 報告 / feature 提案 / PR)。 詳細は CONTRIBUTING.md SSOT を参照。
            </p>
          </div>
          <div className="nm-preset-grid">
            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">1. bug</div>
                <span className="nm-preset-eyebrow">BUG REPORT</span>
                <h3 className="nm-preset-title">Bug 報告</h3>
                <p className="nm-preset-subtitle">
                  再現手順 + 期待動作 + 実際の挙動 を GitHub Issue (bug template) で起票。 minimal reproduction が付いていれば maintainer は素早く対応できる。
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
                  <span>File bug</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">2. feature</div>
                <span className="nm-preset-eyebrow">FEATURE REQUEST</span>
                <h3 className="nm-preset-title">Feature 提案</h3>
                <p className="nm-preset-subtitle">
                  新 DSL syntax / new preset / animation 機能などの提案。 use case + 期待動作を feature template で提出。 議論 →合意 → 実装 → PR の順で進む。
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
                  <span>Propose feature</span>
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
                  test 先行 (TDD 推奨、 動作証明なし PR は merge 対象外) + typecheck / build 緑必須 + 1 PR = 1 concern。 詳細は CONTRIBUTING.md § Pull request SSOT。
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
                  <span>Open PR</span>
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
