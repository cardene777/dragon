/**
 * 編集画面のほかの 6 画面 (#3030)。
 *
 * 経路と帯を先に立てるため、ここでは画面を見分けられる最小の形 (見出しと前置き) だけを置く。
 * 概要、カタログ、使い方、更新履歴、見つからない頁の中身は、#3029 を分けた後の課題で作る。
 */
import type { ReactElement } from "react";

import { type Lang, TEXT } from "../text";
import { follow, PATHS, type Route } from "./routes";

export function Screen({ route, lang }: { route: Route; lang: Lang }): ReactElement {
  const t = TEXT[lang].site;
  const text = t.screens[route.screen];
  return (
    <section className="site-screen">
      {route.screen === "not-found" && (
        <p className="site-code" aria-hidden="true">
          404
        </p>
      )}
      {route.category !== undefined && <p className="site-eyebrow">{route.category}</p>}
      <h1>{text.title}</h1>
      <p className="site-lead">{text.lead}</p>
      {route.screen === "not-found" && (
        <a className="site-back" href={PATHS.home} onClick={(e) => follow(e)}>
          {t.backHome}
        </a>
      )}
    </section>
  );
}
