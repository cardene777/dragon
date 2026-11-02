/**
 * 更新履歴の頁 (#3035)。0.35.0 より前のサイトの更新履歴 (`pages/ReleaseNotesPage.tsx`) と同じ並びにする。
 *
 * 道筋、前置きの札 (版が最新)、見出し、説明、変更の記録を GitHub で見る釦 1 つを縦に積む。釦は日本語の頁では `CHANGELOG.ja.md` を、英語の頁では `CHANGELOG.md` を開く (#3321)。
 * 版は `site/version.ts` が `packages/dragon/package.json` の版から作る。版ごとの要約の札は置かない。
 * 釦は前の実物と同じ 1 つにした (本人の答え、2026-10-23)。repo の GitHub リリースは 0 件で、一覧の釦は空の頁へ行くため。
 * 見た目は前の `styles/compare.css` を `release-notes.css` に写した。
 */
import type { ReactElement } from "react";

import { follow, PATHS, REPO } from "../site/routes";
import { VERSION } from "../site/version";
import { type Lang, TEXT } from "../text";
import "./release-notes.css";

/** 変更の記録。repo の root の、日本語は `CHANGELOG.ja.md`、英語は `CHANGELOG.md` (#3321) */
const CHANGELOG: Record<Lang, string> = { ja: `${REPO}/blob/main/CHANGELOG.ja.md`, en: `${REPO}/blob/main/CHANGELOG.md` };

export function ReleaseNotes({ lang }: { lang: Lang }): ReactElement {
  const t = TEXT[lang].site;
  const r = t.releaseNotes;
  const title = t.screens["release-notes"].title;
  return (
    <section className="release" data-release="hero">
      <nav className="release-crumb" data-release="crumb" aria-label={r.crumb}>
        <a href={PATHS.home} onClick={(e) => follow(e)}>
          {t.nav.home}
        </a>
        <span aria-hidden="true">›</span>
        <span className="release-crumb-here" aria-current="page">
          {title}
        </span>
      </nav>
      <span className="release-eyebrow" data-release="eyebrow">
        {r.eyebrow(VERSION)}
      </span>
      <h1>
        {title.slice(0, title.length - r.accent.length)}
        <span className="release-accent">{r.accent}</span>
      </h1>
      <p className="release-lead" data-release="lead">
        {r.lead}
      </p>
      <div className="release-actions" data-release="actions">
        <a className="release-btn" href={CHANGELOG[lang]} target="_blank" rel="noopener noreferrer">
          <span>{r.changelog}</span>
          <span className="release-btn-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </section>
  );
}
