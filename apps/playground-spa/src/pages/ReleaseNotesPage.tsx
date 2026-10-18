import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { 画面の名前を引く } from "@/lib/site-destinations";
import { useLocale } from "@/lib/useLocale";
import "@/styles/compare.css";

/**
 * /release-notes = 旧 release-notes.astro placeholder。 旧版は CHANGELOG.md parse で
 * releases data を build 時生成、 SPA では GitHub 上の CHANGELOG.md への link で代替。
 */
export function ReleaseNotesPage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  const 版 = __DRAGON_VERSION__.split(".").slice(0, 2).join(".");
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <Breadcrumb 段={[{ 行き先: "/" }, { 字: 画面の名前を引く("/release-notes", locale) }]} />
          {/* 区切りの中黒は英語の側で `•` にする (#2455)。 `·` は片仮名の中黒の代わりに
              使われる字なので、画面を描く browser は日本語として数える */}
          <span className="nm-eyebrow">
            {isJa ? "公開の記録 · v" + 版 + " が最新" : "Release log • v" + 版 + " is current"}
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
              ? "dragon の現在の版を示す。 版ごとの詳しい変更は GitHub 上の CHANGELOG.md で読める。"
              : "Shows the current dragon version. The detailed record for each version is available in CHANGELOG.md on GitHub."}
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
          </div>
        </section>
      </main>
    </div>
  );
}
