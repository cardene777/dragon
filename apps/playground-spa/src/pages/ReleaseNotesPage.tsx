import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { 画面の名前を引く } from "@/lib/site-destinations";
import { useLocale } from "@/lib/useLocale";
import { CATEGORIES, categoryLabel } from "@/lib/catalog";
import { PRESETS } from "@/lib/presets";
import "@/styles/compare.css";

/**
 * 版の札が指す分類 (#1805)。 出どころは `CATEGORIES` 1 つ (#1788)。
 *
 * 呼び名は言語で引き分ける (#2455) = 画面側に字を持つと、英語の画面だけ日本語の呼び名で
 * 分類を指す形になる。
 */
const 指す分類 = CATEGORIES.find((c) => c.slug === "presets");

/**
 * /release-notes = 旧 release-notes.astro placeholder。 旧版は CHANGELOG.md parse で
 * releases data を build 時生成、 SPA では GitHub 上の CHANGELOG.md への link で代替。
 */
export function ReleaseNotesPage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  const 分類の呼び名 = 指す分類 === undefined ? "" : categoryLabel(指す分類, locale);
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <Breadcrumb 段={[{ 行き先: "/" }, { 字: 画面の名前を引く("/release-notes", locale) }]} />
          {/* 区切りの中黒は英語の側で `•` にする (#2455)。 `·` は片仮名の中黒の代わりに
              使われる字なので、画面を描く browser は日本語として数える */}
          <span className="nm-eyebrow">
            {isJa ? "公開の記録 · v0.5 が最新" : "Release log • v0.5 is current"}
          </span>
          {/* 色を付ける語が言語で入れ替わるので、並びごと分ける */}
          <h1 className="nm-hero-title">
            {isJa ? (
              <>
                更新<span className="nm-gradient-accent">履歴</span>
              </>
            ) : (
              <>
                Release <span className="nm-gradient-accent">notes</span>
              </>
            )}
          </h1>
          <p className="nm-hero-subtitle">
            {isJa
              ? "dragon の版ごとの主な変更を要約して並べる。 くわしい記録は GitHub 上の CHANGELOG.md にある。"
              : "A summary of the main changes in each version of dragon. The full record lives in CHANGELOG.md on GitHub."}
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>{isJa ? "変更の記録を GitHub で見る" : "See the change log on GitHub"}</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>{isJa ? "GitHub リリース一覧" : "GitHub releases"}</span>
            </a>
          </div>
        </section>

        <section
          className="nm-presets-section"
          aria-label={isJa ? "最新リリース概要" : "Latest release overview"}
        >
          <div className="nm-section-head">
            <h2 className="nm-section-title">{isJa ? "最新リリース" : "Latest release"}</h2>
            <p className="nm-section-desc">
              {isJa
                ? "いまの最新は v0.5 (テキスト記法と動く SVG)。 版ごとの記録は GitHub で読む。"
                : "The current release is v0.5 — text notation and animated SVG. The per-version record is on GitHub."}
            </p>
          </div>
          <article className="nm-preset-card">
            <header className="nm-preset-card-head">
              <div className="nm-preset-id">v0.5</div>
              <span className="nm-preset-eyebrow">
                {isJa ? "テキスト記法 × 動く SVG" : "Text notation × animated SVG"}
              </span>
              <h3 className="nm-preset-title">{isJa ? "v0.5 (最新)" : "v0.5 (current)"}</h3>
              {/* 描ける図の種類は一覧が持つ (#1806)。 ここに名前を並べると、図を足した日から古くなる。
                  一覧への案内は文の途中に入るので、言語ごとに並びを分ける (#2455) */}
              <p className="nm-preset-subtitle">
                {isJa ? (
                  <>
                    テキスト記法の読み取りと、明暗 2 通りの表示。 どんな図が描けるかは{" "}
                    <Link to="/catalog/presets">{分類の呼び名}の一覧</Link> で確かめられる。
                  </>
                ) : (
                  <>
                    Reading the text notation, plus light and dark display. To see what can be
                    drawn, browse{" "}
                    <Link to="/catalog/presets">the {分類の呼び名} list</Link>.
                  </>
                )}
              </p>
            </header>
            <footer className="nm-preset-card-foot">
              <div className="nm-preset-tags">
                <span className="nm-preset-tag">v0.5</span>
                {/* 数は実物から出す (#1806)。 字で書くと見本を足した日から古くなる */}
                <span className="nm-preset-tag">
                  {PRESETS.length} {分類の呼び名}
                </span>
                <span className="nm-preset-tag">{isJa ? "明暗 2 表示" : "Light and dark"}</span>
              </div>
              <a
                href="https://github.com/cardene777/dragon/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="nm-preset-docs"
                aria-label={
                  isJa
                    ? "v0.5 の変更の記録を GitHub で読む"
                    : "Read the v0.5 change log on GitHub"
                }
              >
                <span>{isJa ? "GitHub で読む" : "Read on GitHub"}</span>
                <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
              </a>
            </footer>
          </article>
        </section>
      </main>
    </div>
  );
}
