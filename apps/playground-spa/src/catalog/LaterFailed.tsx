/**
 * 後から読む塊を読めなかった時に、図の枠に出す一言と読み直す釦 (#3246)。
 *
 * 新しい版を出した後に開いたままの古いタブは、前の版の塊を読みに行って失敗する。
 * 編集画面は書いた記法を残さないので、勝手に頁を読み直さず、人が釦を押した時だけ読み直す。
 */
import type { ReactElement } from "react";

import { type Lang, TEXT } from "../text";

export function LaterFailed({ lang }: { lang: Lang }): ReactElement {
  const c = TEXT[lang].site.catalog;
  return (
    <div className="catalog-later-failed" data-catalog="later-failed" role="alert">
      <p className="catalog-later-failed-text">{c.loadFailed}</p>
      <button type="button" className="catalog-later-reload" data-catalog="reload" onClick={() => location.reload()}>
        {c.reload}
      </button>
    </div>
  );
}
