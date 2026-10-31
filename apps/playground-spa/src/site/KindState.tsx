/**
 * 図の種類の部品が届くまで、図の場所に出す枠 (#3248)。
 *
 * 図の高さは部品を読むまで分からないので、決まった高さの枠に「読み込み中」を出す。読めなかった時は読み直す釦を出す。
 * 部品が届いている種類では何も出さない。
 */
import type { ReactElement } from "react";

import { LaterFailed } from "../catalog/LaterFailed";
import { type Lang, TEXT } from "../text";
import { useKind } from "./kinds";

export function FigureWaiting({ lang }: { lang: Lang }): ReactElement {
  return (
    <p className="figure-waiting" data-figure="waiting" role="status">
      {TEXT[lang].site.catalog.loading}
    </p>
  );
}

export function KindState({ kind, lang }: { kind: string | undefined; lang: Lang }): ReactElement | null {
  const state = useKind(kind);
  if (state.status === "ready") return null;
  return state.status === "failed" ? <LaterFailed lang={lang} /> : <FigureWaiting lang={lang} />;
}
