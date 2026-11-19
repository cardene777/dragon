/**
 * 書き出した頁と見本帳に収める、配管の図の並べ方を組む (#3748)。
 *
 * 頁で最初に描く時は、並べ方を組むと道を探す処理 (`Router.route`) が描く本体の thread を止める。
 * build の時に組んでおけば、頁は収めた並べ方を渡して道を探さずに描ける。
 * 収めるのは最初に見える形と、畳んだ箱を 1 つだけ開いた形 (箱が N 個なら N+1 通り)。2 つ以上を開いた組はその場で組む。
 * ブラウザの書き出す入口も読むので、Node の組み込みの module を読まない。
 */
import { collectPipeLayouts, type StoredPipeLayout } from "../kinds/pipe/layout";
import { type DiagramWords, renderDiagram } from "../render/svg";
import type { UserBlocks } from "../user-blocks";
import type { NotationLang } from "../words";

export interface PipeLayoutsOptions {
  /** 頁が描く言葉。頁が描く時と同じ言葉を渡す */
  lang?: NotationLang;
  /** 頁が描く時に渡す語 */
  words?: DiagramWords;
  /** 原本の頭に書かずに渡す、使う人が足すブロックの定義 */
  blocks?: UserBlocks;
}

/** 原本 `input` を頁と同じ設定で描き、収める並べ方を返す。配管の図でない原本は空 */
export function pipeLayouts(input: unknown, options: PipeLayoutsOptions = {}): StoredPipeLayout[] {
  const base = {
    ...(options.lang === undefined ? {} : { lang: options.lang }),
    ...(options.words === undefined ? {} : { words: options.words }),
    ...(options.blocks === undefined ? {} : { blocks: options.blocks }),
  };
  return collectPipeLayouts(() => {
    const closed = renderDiagram(input, base);
    if (closed.layout.kind !== "pipe") return;
    for (const { call } of (closed.layout as { folds?: { call: number }[] }).folds ?? []) renderDiagram(input, { ...base, open: [call] });
  }).layouts;
}
