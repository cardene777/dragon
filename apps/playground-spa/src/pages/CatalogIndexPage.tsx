import { Link } from "react-router";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, PARTS_COUNT_ESTIMATE } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/lib/useLocale";

/**
 * /catalog = 全 カテゴリ一覧 (CATEGORIES SSOT、 React docs 風の簡潔な list 構成)。
 * 各カテゴリ = 日本語ラベル + 説明 + 件数 + open button。
 * ページ本体 root `/` は HomePage 側。
 */

export function CatalogIndexPage(): React.ReactElement {
  const [locale] = useLocale();
  // parts は CATALOG_ITEMS で空 placeholder (CAR-1613 dynamic import)、 集計時に estimate を加算
  const totalItems =
    Object.values(CATALOG_ITEMS).reduce((sum, arr) => sum + arr.length, 0) +
    PARTS_COUNT_ESTIMATE;

  return (
    <div>
      <SiteHeader />
      <div className="catalog-page">
        <div className="catalog-hero">
          <nav aria-label={locale === "ja" ? "道筋" : "Breadcrumb"} className="catalog-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">カタログ</span>
          </nav>
          <h1 className="catalog-title">カタログ</h1>
          <p className="catalog-desc">
            dragon のテキスト記法の各要素を {CATEGORIES.length} の分類で整理。 各分類のページで検索 + 図の表示 + 編集画面で開く操作ができる。
            合計 {totalItems} 件の要素 + {CATEGORIES.length} 分類。
          </p>
        </div>

        <div className="catalog-index-grid">
          {CATEGORIES.map((c, i) => {
            // parts は dynamic import で空 placeholder、 index page では estimate 表示
            const itemCount =
              c.slug === "parts"
                ? PARTS_COUNT_ESTIMATE
                : CATALOG_ITEMS[c.slug]?.length ?? 0;
            return (
              <Link key={c.slug} to={`/catalog/${c.slug}`} className="catalog-index-card">
                <div className="catalog-index-card-top">
                  <div className="catalog-index-card-head">
                    {/* 連番は分類の並び順そのもの。 目で追う手がかりとして先頭に置く */}
                    <span className="catalog-index-card-no">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="catalog-index-card-count">{itemCount} 件</span>
                  </div>
                  {/* 呼び名の出どころは `CATEGORIES[].label` 1 つ (#1788)。 画面側で上書きしない */}
                  <h2 className="catalog-index-card-title">{c.label}</h2>
                  <p className="catalog-index-card-desc">{c.desc}</p>
                </div>
                <div className="catalog-index-card-foot">
                  <span className="catalog-index-card-link">開く →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
