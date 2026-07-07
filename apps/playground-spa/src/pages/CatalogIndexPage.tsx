import { Link } from "react-router";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * /catalog = 7 category 一覧 (旧 Astro /catalog/index.astro 相当)。
 * nm-hero + nm-stats + nm-cat-grid の 3 section。
 * ページ本体 root `/` は HomePage.tsx (旧 index.astro 相当) 側。
 */
export function CatalogIndexPage(): React.ReactElement {
  const totalItems = Object.values(CATALOG_ITEMS).reduce((sum, arr) => sum + arr.length, 0);
  const presetsCount = CATALOG_ITEMS.presets?.length ?? 0;

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label="パンくず" className="nm-crumb">
            <Link to="/">overview</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">catalog</span>
          </nav>
          <span className="nm-eyebrow">
            CATALOG · primitives · presets · animation · patterns
          </span>
          <h1 className="nm-hero-title">
            Text DSL × <span className="nm-gradient-accent">Animated SVG</span>
          </h1>
          <p className="nm-hero-subtitle">
            dragon DSL の primitives / styles / animation / patterns を {CATEGORIES.length} カテゴリで整理。 各カテゴリに小さい図を並べて、 1 概念ずつ動作確認できる。 engine 層は{" "}
            <code>@cardenelabs/cdl</code> が担う。
          </p>
          <div className="nm-hero-actions">
            <Link to="/catalog/presets" className="nm-hero-btn nm-hero-btn-primary">
              <span>Browse presets</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/editor" className="nm-hero-btn nm-hero-btn-secondary">
              <span>Open editor</span>
            </Link>
          </div>
        </section>

        <section className="nm-stats" aria-label="dragon catalog stats">
          <div className="nm-stat">
            <div className="nm-stat-num">{CATEGORIES.length}</div>
            <div className="nm-stat-label">categories</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">{presetsCount}</div>
            <div className="nm-stat-label">presets</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">{totalItems}</div>
            <div className="nm-stat-label">items</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">6</div>
            <div className="nm-stat-label">themes</div>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="category list">
          <div className="nm-section-head">
            <h2 className="nm-section-title">
              Categories{" "}
              <span className="nm-section-count">({CATEGORIES.length})</span>
            </h2>
            <p className="nm-section-desc">
              各カテゴリはそれぞれ独立したページを持ち、 中で小さい図を並べて 1 概念ずつ動作確認できる。 basic は日常最頻使用、 extended は応用向け。
            </p>
          </div>
          <div className="nm-cat-grid">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/catalog/${c.slug}`}
                className={`nm-cat-card nm-cat-${c.cluster}`}
              >
                <div className="nm-cat-card-head">
                  <span className="nm-cat-eyebrow">{c.eyebrow}</span>
                  <h3 className="nm-cat-title">{c.label}</h3>
                </div>
                <p className="nm-cat-desc">{c.desc}</p>
                <div className="nm-cat-chips">
                  {c.items.map((i) => (
                    <span key={i} className="nm-cat-chip">
                      {i}
                    </span>
                  ))}
                </div>
                <div className="nm-cat-go">
                  <span>open</span>
                  <span className="nm-cat-arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
