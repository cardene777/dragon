/**
 * 概要と編集画面のほかの 5 画面 (#3030)。
 *
 * 経路と帯を先に立てるため、ここでは画面を見分けられる最小の形 (見出しと前置き) だけを置く。
 * カタログ、使い方、更新履歴、見つからない頁の中身は、#3029 を分けた後の課題で作る。
 * 概要は `home/Home.tsx` (#3032)、編集画面は `Playground.tsx` が持つ。
 */
import type { ReactElement } from "react";

import { type Lang, TEXT } from "../text";
import { follow, PATHS, type Screen as ScreenName } from "./routes";

interface Props {
  screen: Exclude<ScreenName, "home" | "editor">;
  /** カタログの分類の頁が出す分類の名前 */
  category?: string;
  lang: Lang;
}

export function Screen({ screen, category, lang }: Props): ReactElement {
  const t = TEXT[lang].site;
  const text = t.screens[screen];
  return (
    <section className="site-screen">
      {screen === "not-found" && (
        <p className="site-code" aria-hidden="true">
          404
        </p>
      )}
      {category !== undefined && <p className="site-eyebrow">{category}</p>}
      <h1>{text.title}</h1>
      <p className="site-lead">{text.lead}</p>
      {screen === "not-found" && (
        <a className="site-back" href={PATHS.home} onClick={(e) => follow(e)}>
          {t.backHome}
        </a>
      )}
    </section>
  );
}
