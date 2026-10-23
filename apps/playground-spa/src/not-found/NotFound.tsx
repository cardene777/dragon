/**
 * 見つからない頁 (#3035)。0.35.0 より前のサイトの見つからない頁 (`pages/NotFoundPage.tsx`) と同じ並びにする。
 *
 * 大きな `404`、段の目盛りの飾り、見出し、説明、行き先の釦、開いた path を中央に縦に積む。
 * 段の目盛りは「まだ何も書かれていない」ことを図の言葉で言う飾りで、入口ではないので数に入れない。
 *
 * 説明が言う入口の数は `DESTINATIONS` の数を差し込む。
 * 前のサイトは数を字で書いており、4 と言いながら釦は 3 つだった (前のサイトの #2445)。
 * 見た目は前の `styles/home.css` の `.v4-404-*` を `not-found.css` に写した。
 */
import type { ReactElement } from "react";

import { follow, PATHS } from "../site/routes";
import { type Lang, TEXT } from "../text";
import "./not-found.css";

/** 行き先。釦の並びと、説明が言う入口の数の両方がここから出る。最初の 1 つを強い釦にする */
const DESTINATIONS = ["editor", "catalog", "docs"] as const;

/** 段の目盛りの飾りの数 */
const TICKS = 4;

export function NotFound({ lang, path }: { lang: Lang; path: string }): ReactElement {
  const t = TEXT[lang].site;
  const n = t.notFound;
  const title = t.screens["not-found"].title;
  const names = { editor: t.openEditor, catalog: n.catalog, docs: n.docs };
  return (
    <section className="not-found">
      <div className="not-found-code" data-not-found="code" aria-label="404">
        <span aria-hidden="true">4</span>
        <span className="not-found-zero" aria-hidden="true">
          0
        </span>
        <span aria-hidden="true">4</span>
      </div>
      <div className="not-found-ticks" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <h1>
        <em>{n.em}</em>
        {title.slice(n.em.length)}
      </h1>
      <p className="not-found-lead" data-not-found="lead">
        {n.lead(DESTINATIONS.length)}
      </p>
      <div className="not-found-cta" data-not-found="cta">
        {DESTINATIONS.map((to, i) => (
          <a key={to} className={i === 0 ? "not-found-btn-primary" : "not-found-btn-secondary"} href={PATHS[to]} onClick={(e) => follow(e)}>
            {names[to]}
          </a>
        ))}
      </div>
      <p className="not-found-path" data-not-found="path">
        {path}
      </p>
    </section>
  );
}
