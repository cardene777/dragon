/**
 * 中身をまだ作っていない画面 (#3030)。更新履歴と見つからない頁。
 *
 * 経路と帯を先に立てるため、ここでは画面を見分けられる最小の形 (見出しと前置き) だけを置く。
 * 更新履歴の中身は、#3029 を分けた後の課題で作る。
 * 概要は `home/Home.tsx` (#3032)、カタログは `catalog/` (#3033)、使い方は `docs/Docs.tsx` (#3034)、編集画面は `Playground.tsx` が持つ。
 */
import type { ReactElement } from "react";

import { type Lang, TEXT } from "../text";
import { follow, PATHS } from "./routes";

interface Props {
  screen: "release-notes" | "not-found";
  lang: Lang;
}

export function Screen({ screen, lang }: Props): ReactElement {
  const t = TEXT[lang].site;
  const text = t.screens[screen];
  return (
    <section className="site-screen">
      {screen === "not-found" && (
        <p className="site-code" aria-hidden="true">
          404
        </p>
      )}
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
