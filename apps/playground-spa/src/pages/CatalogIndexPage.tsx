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

const CATEGORY_JA_LABEL: Record<string, string> = {
  presets: "プリセット",
  cookbook: "レシピ集",
  patterns: "パターン",
  primitives: "基本要素",
  "text-dsl": "テキスト DSL",
  animation: "アニメーション",
  parts: "パーツ",
  styles: "スタイル",
  interactive: "インタラクティブ",
};

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
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="catalog-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">カタログ</span>
          </nav>
          <h1 className="catalog-title">カタログ</h1>
          <p className="catalog-desc">
            dragon DSL の各要素を {CATEGORIES.length} カテゴリで整理。 各カテゴリのページで検索 + プレビュー + エディタで開く操作ができる。
            合計 {totalItems} 件の要素 + {CATEGORIES.length} カテゴリ。
          </p>
        </div>

        <div className="catalog-index-grid">
          {CATEGORIES.map((c) => {
            const jaLabel = CATEGORY_JA_LABEL[c.slug] ?? c.label;
            // parts は dynamic import で空 placeholder、 index page では estimate 表示
            const itemCount =
              c.slug === "parts"
                ? PARTS_COUNT_ESTIMATE
                : CATALOG_ITEMS[c.slug]?.length ?? 0;
            return (
              <Link key={c.slug} to={`/catalog/${c.slug}`} className="catalog-index-card">
                <div className="catalog-index-card-head">
                  <h2 className="catalog-index-card-title">{jaLabel}</h2>
                  <span className="catalog-index-card-count">{itemCount} 件</span>
                </div>
                <p className="catalog-index-card-desc">{c.desc}</p>
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
