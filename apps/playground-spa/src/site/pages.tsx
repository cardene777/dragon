/**
 * 最初に読む script に入れず後から読む頁 (#3280)。
 *
 * 使い方の頁とカタログの頁は、編集画面や概要の頁を見る人の最初の表示に要らない。
 * 塊の読み方は見本と部品の図の記法と同じで (`site/later.ts`)、最初の画面を描いた後に裏で読み始め、
 * それより先に頁を開いた時はその時に読み始める。読めなかった時は読み直す釦を出し、上の帯は残す。
 */
import type { ReactElement } from "react";

import { LaterFailed } from "../catalog/LaterFailed";
import type { Lang } from "../text";
import { FigureWaiting } from "./KindState";
import { type LaterChunk, laterChunk, useLater } from "./later";

export const LATER_DOCS = laterChunk(() => import("../docs/Docs"));
export const LATER_CATALOG = laterChunk(() => import("../catalog/pages"));

interface LaterPageProps<T> {
  chunk: LaterChunk<T>;
  lang: Lang;
  children: (loaded: T) => ReactElement;
}

/** 塊が届いたら頁を描く。届くまでは待ちの一言を、読めなかった時は読み直す釦を出す */
export function LaterPage<T>({ chunk, lang, children }: LaterPageProps<T>): ReactElement {
  const later = useLater(chunk);
  if (later.status === "ready") return children(later.value);
  return later.status === "failed" ? <LaterFailed lang={lang} /> : <FigureWaiting lang={lang} />;
}
