/**
 * 最初に読む script に入れず後から読む頁 (#3280)。
 *
 * 使い方の頁とカタログの頁は、編集画面や概要の頁を見る人の最初の表示に要らない。
 * 塊の読み方は見本と部品の図の記法と同じで (`site/later.ts`)、最初の画面を描いた後に裏で読み始め、
 * それより先に頁を開いた時はその時に読み始める。
 *
 * 読めなかった時は頁を 1 度だけ自動で読み直す (#3288)。
 * ネットワークが変わった瞬間に切れた `import` は、同じ URL では頁を読み直すまで落ち続ける (Chromium と WebKit で実測)。
 * この部品を描いている間は編集画面が閉じているので、読み直しても書いた記法を失わない。
 * 読み直しても読めない時は読み直す釦を出し、上の帯は残す。
 */
import { type ReactElement, useEffect, useState } from "react";

import { LaterFailed } from "../catalog/LaterFailed";
import { type Lang, TEXT } from "../text";
import { FigureWaiting } from "./KindState";
import { type LaterChunk, laterChunk, useLater } from "./later";

export const LATER_DOCS = laterChunk(() => import("../docs/Docs"));
export const LATER_CATALOG = laterChunk(() => import("../catalog/pages"));

/** 自動で読み直した印。読み直しの後も残る置き場に置き、頁が読み直しを繰り返さないようにする */
const RELOADED = "dragon-page-reloaded";

/** まだ自動で読み直していなければ印を置いて真を返す。印の置き場を使えない時は、読み直しを止められないので偽を返す */
function markReload(): boolean {
  try {
    if (sessionStorage.getItem(RELOADED) !== null) return false;
    sessionStorage.setItem(RELOADED, "1");
    return true;
  } catch {
    return false;
  }
}

/** 印を消す。置き場を使えない端末でも頁を描けるよう、消せなくても止まらない */
function forgetReload(): void {
  try {
    sessionStorage.removeItem(RELOADED);
  } catch {
    // 置けなかった印は消す物が無い
  }
}

interface LaterPageProps<T> {
  chunk: LaterChunk<T>;
  lang: Lang;
  children: (loaded: T) => ReactElement;
}

/** 塊を読めなかった頁。まだ読み直していなければ待ちの一言を出して読み直し、読み直した後なら読み直す釦を出す */
function PageFailed({ lang }: { lang: Lang }): ReactElement {
  const [reloading] = useState(markReload);
  useEffect(() => {
    if (reloading) location.reload();
  }, [reloading]);
  return reloading ? <FigureWaiting lang={lang} /> : <LaterFailed lang={lang} message={TEXT[lang].site.catalog.pageLoadFailed} />;
}

/** 塊が届いたら頁を描く。届くまでは待ちの一言を出す */
export function LaterPage<T>({ chunk, lang, children }: LaterPageProps<T>): ReactElement {
  const later = useLater(chunk);
  useEffect(() => {
    if (later.status === "ready") forgetReload();
  }, [later.status]);
  if (later.status === "ready") return children(later.value);
  return later.status === "failed" ? <PageFailed lang={lang} /> : <FigureWaiting lang={lang} />;
}
