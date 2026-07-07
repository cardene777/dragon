import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * /release-notes = 旧 release-notes.astro placeholder。 旧版は CHANGELOG.md parse で
 * releases data を build 時生成、 SPA では GitHub 上の CHANGELOG.md への link で代替。
 */
export function ReleaseNotesPage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label="パンくず" className="nm-crumb">
            <Link to="/">overview</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">release notes</span>
          </nav>
          <span className="nm-eyebrow">RELEASE · v0.5 CURRENT</span>
          <h1 className="nm-hero-title">
            Release <span className="nm-gradient-accent">Notes</span>
          </h1>
          <p className="nm-hero-subtitle">
            dragon DSL の release ごとの主要変更を要約表示。 詳細な release note は GitHub 上の CHANGELOG.md を参照。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>CHANGELOG on GitHub</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>GitHub Releases</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="latest release summary">
          <div className="nm-section-head">
            <h2 className="nm-section-title">Latest release</h2>
            <p className="nm-section-desc">
              現時点の最新 release は v0.5 (Text DSL × SVG animation)。 個別 release note は GitHub 経由で参照する。
            </p>
          </div>
          <article className="nm-preset-card">
            <header className="nm-preset-card-head">
              <div className="nm-preset-id">v0.5</div>
              <span className="nm-preset-eyebrow">TEXT DSL × SVG ANIMATION</span>
              <h3 className="nm-preset-title">v0.5 (current)</h3>
              <p className="nm-preset-subtitle">
                Text DSL parser + 12 preset (sequence / flow / topology / er / state / class / mind / pie / c4 / gantt / code / chart) + 6 theme (blueprint / neumorphism / circuit / handdrawn / pinboard / isometric)。
              </p>
            </header>
            <footer className="nm-preset-card-foot">
              <div className="nm-preset-tags">
                <span className="nm-preset-tag">v0.5</span>
                <span className="nm-preset-tag">12 presets</span>
                <span className="nm-preset-tag">6 themes</span>
              </div>
              <a
                href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="nm-preset-docs"
                aria-label="v0.5 の changelog を GitHub で読む"
              >
                <span>Read on GitHub</span>
                <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
              </a>
            </footer>
          </article>
        </section>
      </main>
    </div>
  );
}
