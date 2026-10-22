/**
 * カタログの一覧 (#3033)。0.35.0 より前のサイトの一覧 (`pages/CatalogIndexPage.tsx`) と同じ並びにする。
 *
 * 道筋、見出し、説明の下に、分類ごとの札 (番号、件数、見出し、説明、`開く →`) を並べる。
 * 説明の分類の数と見本の数、札の件数は、分類に束ねた見本を数えて出す。
 */
import type { ReactElement } from "react";

import { EXAMPLE_KEYS } from "../examples";
import { follow, PATHS } from "../site/routes";
import { type Lang, TEXT } from "../text";
import { KINDS, samplesOf } from "./catalog";

export function CatalogIndex({ lang }: { lang: Lang }): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
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
          {c.lead(KINDS.length, EXAMPLE_KEYS.length)}
        </p>
      </div>
      <div className="catalog-index-grid">
        {KINDS.map((kind, i) => (
          <a key={kind} className="catalog-index-card" data-catalog="card" href={`${PATHS.catalog}/${kind}`} onClick={(e) => follow(e)}>
            <div className="catalog-index-card-top">
              <div className="catalog-index-card-head">
                <span className="catalog-index-card-no" data-catalog="card-no">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="catalog-index-card-count" data-catalog="card-count">
                  {c.count(samplesOf(kind).length)}
                </span>
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
    </div>
  );
}
