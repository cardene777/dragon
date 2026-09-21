import { Link } from "react-router";
import { CATEGORIES, categoryLabel, categoryDesc } from "@/lib/catalog";
import { CATALOG_ITEMS, PARTS_COUNT_ESTIMATE } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocale } from "@/lib/useLocale";

/**
 * /catalog = 全 カテゴリ一覧 (CATEGORIES SSOT、 React docs 風の簡潔な list 構成)。
 * 各カテゴリ = 名前 + 説明 + 件数 + 開く button。
 * ページ本体 root `/` は HomePage 側。
 *
 * 字は言語で選ぶ (#2453)。 分類の名前と説明は `CATEGORIES` が 2 言語とも持つ。
 */

interface 説明の数 {
  分類数: number;
  総数: number;
}

/**
 * 一覧の説明文 (#2453)。 **言語ごとに部品へ分ける**。
 *
 * 1 つの `<p>` の中で `{言語 ? "…" : "…"}` と書くと、画面の文を数える検査
 * (`screen-text.test.ts`) の母集団から丸ごと外れる = その文を「1 件も見ていない」 状態になる。
 * 検査が見るのは要素の間に置いた地の字なので、地の字のまま置ける形にする。
 */
function 日本語の説明({ 分類数, 総数 }: 説明の数): React.ReactElement {
  return (
    <>
      dragon のテキスト記法の各要素を {分類数} の分類で整理。 各分類のページで検索 + 図の表示 +
      編集画面で開く操作ができる。 合計 {総数} 件の要素 + {分類数} 分類。
    </>
  );
}

function 英語の説明({ 分類数, 総数 }: 説明の数): React.ReactElement {
  return (
    <>
      Every piece of dragon&apos;s text notation, sorted into {分類数} groups. Each group page lets
      you search, show the diagram, and open it in the editor. {総数} entries across {分類数} groups.
    </>
  );
}

export function CatalogIndexPage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  // parts は CATALOG_ITEMS で空 placeholder (CAR-1613 dynamic import)、 集計時に estimate を加算
  const totalItems =
    Object.values(CATALOG_ITEMS).reduce((sum, arr) => sum + arr.length, 0) +
    PARTS_COUNT_ESTIMATE;

  return (
    <div>
      <SiteHeader />
      <div className="catalog-page">
        <div className="catalog-hero">
          <Breadcrumb 見た目="catalog-crumb" 段={[{ 行き先: "/" }, { 行き先: "/catalog" }]} />
          <h1 className="catalog-title">{isJa ? "カタログ" : "Catalog"}</h1>
          <p className="catalog-desc">
            {isJa ? (
              <日本語の説明 分類数={CATEGORIES.length} 総数={totalItems} />
            ) : (
              <英語の説明 分類数={CATEGORIES.length} 総数={totalItems} />
            )}
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
                    <span className="catalog-index-card-count">
                      {isJa ? `${itemCount} 件` : `${itemCount} entries`}
                    </span>
                  </div>
                  {/* 呼び名の出どころは `CATEGORIES[]` 1 つ (#1788)。 画面側で上書きしない */}
                  <h2 className="catalog-index-card-title">{categoryLabel(c, locale)}</h2>
                  <p className="catalog-index-card-desc">{categoryDesc(c, locale)}</p>
                </div>
                <div className="catalog-index-card-foot">
                  <span className="catalog-index-card-link">{isJa ? "開く →" : "Open →"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
