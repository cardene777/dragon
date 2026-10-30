/**
 * カタログの一覧 (#3033、#3166)。
 *
 * 道筋、見出し、説明の下に、どの図でも使える部品、図の種類だけの部品、図の 3 段を並べる。
 * 部品の段の札は部品の表 (`parts.ts`) の並びで、部品の名前と受け持つ記法の語を出し、部品の頁へ向かう。
 * 図の段は 0.35.0 より前のサイトの一覧 (`pages/CatalogIndexPage.tsx`) と同じ分類の札 (番号、件数、見出し、説明、`開く →`) を並べる。
 * 説明の部品の数と分類の数と見本の数、札の件数は、表と分類に束ねた見本を数えて出す。
 */
import type { ReactElement } from "react";

import { EXAMPLE_KEYS, LATER_EXAMPLES } from "../examples";
import { useLater } from "../site/later";
import { follow, PATHS } from "../site/routes";
import { type Lang, TEXT } from "../text";
import { KINDS, samplesOf } from "./catalog";
import { isCommon, type Part, PARTS, wordLabel } from "./parts";

type Section = "parts" | "kind-parts" | "kinds";

export function CatalogIndex({ lang }: { lang: Lang }): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  // 札の件数は全ての見本を図の種類で数えるので、後から読む見本が届いてから出す (#3246)
  const arrived = useLater(LATER_EXAMPLES).status === "ready";
  const head = (section: Section): ReactElement => (
    <header className="catalog-section-head">
      <h2 className="catalog-section-title">{c.sections[section].title}</h2>
      <p className="catalog-section-lead">{c.sections[section].lead}</p>
    </header>
  );
  return (
    <div className="catalog-page" data-catalog="index">
      <div className="catalog-hero">
        <nav className="catalog-crumb" data-catalog="crumb" aria-label={c.crumb}>
          <a href={PATHS.home} onClick={(e) => follow(e)}>
            {t.site.nav.home}
          </a>
          <span aria-hidden="true">›</span>
          <span className="catalog-crumb-here" aria-current="page">
            {t.site.screens.catalog.title}
          </span>
        </nav>
        <h1 className="catalog-title">{t.site.screens.catalog.title}</h1>
        <p className="catalog-desc" data-catalog="desc">
          {c.lead(PARTS.length, KINDS.length, EXAMPLE_KEYS.length)}
        </p>
      </div>

      <section className="catalog-section" data-catalog="section" data-section="parts">
        {head("parts")}
        <div className="catalog-part-grid">
          {PARTS.filter(isCommon).map((part) => (
            <PartCard key={part.id} part={part} lang={lang} />
          ))}
        </div>
      </section>

      <section className="catalog-section" data-catalog="section" data-section="kind-parts">
        {head("kind-parts")}
        <div className="catalog-part-grid">
          {PARTS.filter((part) => !isCommon(part)).map((part) => (
            <PartCard key={part.id} part={part} lang={lang} />
          ))}
        </div>
      </section>

      <section className="catalog-section" data-catalog="section" data-section="kinds">
        {head("kinds")}
        <div className="catalog-index-grid">
          {KINDS.map((kind, i) => (
            <a key={kind} className="catalog-index-card" data-catalog="card" href={`${PATHS.catalog}/${kind}`} onClick={(e) => follow(e)}>
              <div className="catalog-index-card-top">
                <div className="catalog-index-card-head">
                  <span className="catalog-index-card-no" data-catalog="card-no">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {arrived ? (
                    <span className="catalog-index-card-count" data-catalog="card-count">
                      {c.count(samplesOf(kind).length)}
                    </span>
                  ) : (
                    <span className="catalog-index-card-count" aria-hidden="true" style={{ visibility: "hidden" }}>
                      {c.count(0)}
                    </span>
                  )}
                </div>
                <h2 className="catalog-index-card-title">{t.shelf.kinds[kind]}</h2>
                <p className="catalog-index-card-desc" data-catalog="card-desc">
                  {c.kinds[kind]}
                </p>
              </div>
              <span className="catalog-index-card-link" data-catalog="card-open">
                {c.open}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

/** 部品の札。名前と、図の種類だけの部品はその図の種類と、受け持つ記法の語を出し、部品の頁へ向かう */
export function PartCard({ part, lang, name = "part-card" }: { part: Part; lang: Lang; name?: string }): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  return (
    <a className="catalog-part-card" data-catalog={name} data-part={part.id} href={`${PATHS.catalog}/part/${part.id}`} onClick={(e) => follow(e)}>
      <span className="catalog-part-card-head">
        <span className="catalog-part-card-name">{c.parts[part.id].name}</span>
        {!isCommon(part) && <span className="catalog-part-card-kind">{c.kindOnly(part.kinds.map((kind) => t.shelf.kinds[kind]).join("、"))}</span>}
      </span>
      <span className="catalog-part-card-words">
        {part.words.map((word) => (
          <code key={word}>{wordLabel(word)}</code>
        ))}
      </span>
    </a>
  );
}
