/**
 * カタログの部品の頁 (#3166)。
 *
 * 道筋、部品の名前と説明、使える図の種類 (その図の頁への飛び先) と受け持つ記法の語の下に、
 * 部品を図の種類ごとに描いた図を並べる。どの図でも使える部品は時系列図と構成図の 2 つ、図の種類だけの部品は 1 つ。
 * 図はどれも部品の記法の file (`parts/<名札>.<図の種類>.dragon`) を再生の部品で描き、記法の本文と編集画面で開くを添える。
 * 部品の図は箱 2 つから 4 つの小さな図なので、使い方の頁の記法の例と同じく全体を止めて見せる。
 * 図の下には、その部品の語を使う見本の札を並べ、押すと図の頁でその見本を選んだ状態で開く (#3167)。
 * 部品「絵」の頁だけは、図の下に使える絵柄を全て形と名前で並べる。一覧は package の絵柄の表 (`ICONS`) から作り、形は package の `iconSvg` が描く (#3172)。
 */
import { ICONS, iconSvg, type Theme } from "@cardenelabs/dragon";
import type { ReactElement } from "react";

import { exampleInfo } from "../examples";
import { toHash } from "../share";
import { LiveFigure } from "../site/LiveFigure";
import { follow, PATHS } from "../site/routes";
import { type Lang, TEXT } from "../text";
import type { Kind } from "./catalog";
import { type Part, samplesUsing, snippetOf, wordLabel } from "./parts";

interface Props {
  part: Part;
  lang: Lang;
  theme: Theme;
  /** 上の帯で選んだ色味 */
  palette: string;
}

export function PartPage({ part, lang, theme, palette }: Props): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  const text = c.parts[part.id];
  return (
    <div className="catalog-page" data-catalog="part">
      <div className="catalog-hero">
        <nav className="catalog-crumb" data-catalog="crumb" aria-label={c.crumb}>
          <a href={PATHS.home} onClick={(e) => follow(e)}>
            {t.site.nav.home}
          </a>
          <span aria-hidden="true">›</span>
          <a href={PATHS.catalog} onClick={(e) => follow(e)}>
            {t.site.screens.catalog.title}
          </a>
          <span aria-hidden="true">›</span>
          <span className="catalog-crumb-here" aria-current="page">
            {text.name}
          </span>
        </nav>
        <h1 className="catalog-title">{text.name}</h1>
        <p className="catalog-desc" data-catalog="desc">
          {text.desc}
        </p>
        <dl className="catalog-part-facts">
          <div className="catalog-part-fact">
            <dt>{c.partKinds}</dt>
            <dd className="catalog-part-kinds" data-catalog="part-kinds">
              {part.kinds.map((kind) => (
                <a key={kind} href={`${PATHS.catalog}/${kind}`} onClick={(e) => follow(e)}>
                  {t.shelf.kinds[kind]}
                </a>
              ))}
            </dd>
          </div>
          <div className="catalog-part-fact">
            <dt>{c.words}</dt>
            <dd className="catalog-part-words" data-catalog="part-words">
              {part.words.map((word) => (
                <code key={word}>{wordLabel(word)}</code>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="catalog-part-figures" data-count={part.kinds.length}>
        {part.kinds.map((kind) => (
          <PartFigure key={kind} part={part} kind={kind} lang={lang} theme={theme} palette={palette} />
        ))}
      </div>

      {part.id === "icon" && <IconList lang={lang} />}

      <section className="catalog-section" data-catalog="part-samples" aria-label={c.partSamples}>
        <header className="catalog-section-head">
          <h2 className="catalog-section-title">{c.partSamples}</h2>
          <p className="catalog-section-lead">{c.partSamplesLead}</p>
        </header>
        <div className="catalog-part-grid">
          {samplesUsing(part).map(({ key, kind }) => (
            <a
              key={key}
              className="catalog-part-card"
              data-catalog="part-sample"
              data-sample={key}
              href={`${PATHS.catalog}/${kind}#${key}`}
              onClick={(e) => follow(e)}
            >
              <span className="catalog-part-card-head">
                <span className="catalog-part-card-name">{exampleInfo(key, lang)?.title ?? key}</span>
                <span className="catalog-part-card-kind">{t.shelf.kinds[kind]}</span>
              </span>
              <span className="catalog-part-sample-about">{exampleInfo(key, lang)?.about}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * 使える絵柄の一覧。名前の順に並べ、形は図の中の印と同じ道筋と太さで package が描く。
 * 頁に差し込む字は package の絵柄の表から作った SVG だけで、人が書いた字を含まない
 */
function IconList({ lang }: { lang: Lang }): ReactElement {
  const c = TEXT[lang].site.catalog;
  const names = Object.keys(ICONS).sort();
  return (
    <section className="catalog-section" data-catalog="part-icons" aria-label={c.partIcons}>
      <header className="catalog-section-head">
        <h2 className="catalog-section-title">{c.partIcons}</h2>
        <p className="catalog-section-lead">{c.partIconsLead(names.length)}</p>
      </header>
      <ul className="catalog-icon-grid">
        {names.map((name) => (
          <li key={name} className="catalog-icon" data-icon={name}>
            <span className="catalog-icon-chip" dangerouslySetInnerHTML={{ __html: iconSvg(name) ?? "" }} />
            <code className="catalog-icon-name">{name}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 部品を 1 つの図の種類で描いた図と、その記法と、編集画面で開く */
function PartFigure({ part, kind, lang, theme, palette }: Props & { kind: Kind }): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  const notation = snippetOf(part.id, kind, lang);
  return (
    <section className="catalog-part-figure" data-catalog="part-figure" data-kind={kind} aria-label={t.shelf.kinds[kind]}>
      <h2 className="catalog-part-figure-title">{t.shelf.kinds[kind]}</h2>
      <LiveFigure className="catalog-part-stage" notation={notation} lang={lang} theme={theme} palette={palette} whole />
      <pre className="catalog-part-source" data-catalog="part-source" aria-label={c.source}>
        <code>{notation}</code>
      </pre>
      <a className="catalog-preview-link catalog-part-open" data-catalog="part-open-editor" href={`${PATHS.editor}${toHash(notation)}`} onClick={(e) => follow(e)}>
        {c.openEditor}
      </a>
    </section>
  );
}
