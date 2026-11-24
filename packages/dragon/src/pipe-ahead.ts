/**
 * jsDelivr の入口 (`script.ts`) が配管の図を描いた後の空いた時間に、畳んだ箱を 1 つだけ開いた形を先に組む (#3753)。
 *
 * 頁で箱を押すと、再生の部品はその箱を開いた形の並べ方を組み、道を探す処理 (`Router.route`) が描く本体の thread を止める。
 * 最初の図を描いた後の空いた時間に同じ形を組むと、組んだ並べ方は `layoutPipe` の覚えに入り、箱を押した時は覚えに当たって道を探さない。
 * 端末には覚えないので、頁を閉じると消える。2 つ以上の箱を開いた組は先に組まない (箱が N 個の図で N 通り、#3748 と同じ)。
 *
 * 並べ方だけを組み、描く仕事 (`drawPipe`) はしない。描く流れ (`renderDiagram`) と同じ順に、原本を読み、図の形へ直し、箱を畳んでから並べる。
 * 足したブロック (`[block: +名前]`) を使う箱を持つ図は、描く流れがブロックの絵柄を箱に入れてから並べるので鍵が合わず、先に組まない。
 *
 * 入口が最初に読む量に入れないため、配管の図を描いた時だけ後から読む塊に置く。
 * 原本を読む部品と種類の部品の組は呼ぶ側 (`Composers`) から受け取り、この塊は型のほかに何も読まない。
 * 読むと、esbuild が入口と分け合う部品を塊に分け直し、最初に読む量が増える (分け直した塊の継ぎ目の分、#3753 で 1 回目に組んだ時に約 500 byte)
 */
import type { KindParts } from "./kinds/parts";
import type { RenderOptions } from "./render/draw";
import type { Diagram, DiagramModel } from "./schema";
import type { UserBlocks } from "./user-blocks";
import type { NotationLang } from "./words";

/** 空いた時間に `run` を回す */
export type Idle = (run: () => void) => void;

/** 描く流れが使う部品。呼ぶ側が読んだ物を渡す */
export interface Composers {
  readDiagram: (input: unknown, options: { lang: NotationLang }) => { ok: true; diagram: Diagram } | { ok: false };
  toModel: (diagram: Diagram) => DiagramModel;
  partsOf: (kind: string, lang: NotationLang) => KindParts | undefined;
  withUserBlocks: <T>(sets: readonly (UserBlocks | undefined)[], run: () => T) => T;
}

/** 頁の空いた時間。`requestIdleCallback` を持たない環境 (Safari の古い版) では次の番に回す */
const pageIdle: Idle = (run) => {
  const page = globalThis as { requestIdleCallback?: (run: () => void) => unknown };
  if (typeof page.requestIdleCallback === "function") page.requestIdleCallback(() => run());
  else setTimeout(run, 0);
};

/**
 * 原本 `source` を `options` で描いた配管の図の、畳んだ箱を 1 つだけ開いた形を、空いた時間に 1 つずつ組む。
 * `options` には頁が図を描いた時と同じ設定を渡す。言葉と語が違うと覚えの鍵が合わない。配管の図でない原本は何もしない
 */
export function composeAhead(source: unknown, options: RenderOptions & { lang: NotationLang }, use: Composers, idle: Idle = pageIdle): void {
  const { lang } = options;
  const read = use.readDiagram(source, { lang });
  if (!read.ok || read.diagram.kind !== "pipe" || read.diagram.blocks.box?.some((box) => box.block !== undefined)) return;
  const diagram = read.diagram;
  const model = use.toModel(diagram);
  const parts = use.partsOf(model.kind, lang);
  if (!parts?.fold) return;
  const { fold } = parts;
  const opened = options.open ?? [];
  /** 開いた箱の組 `open` の形を、描く流れと同じく足したブロックの定義を有効にして並べる */
  const compose = (open: readonly number[]): { folds?: { call: number }[] } => {
    const drawn = { ...options, open };
    return use.withUserBlocks([options.blocks, diagram.define], () => parts.layout(fold(model, drawn, lang), lang, drawn)) as { folds?: { call: number }[] };
  };
  idle(() => {
    // 最初の図の並べ方は頁が組んだばかりなので覚えに当たり、畳んだ箱の一覧だけを引く
    for (const { call } of compose(opened).folds ?? []) if (!opened.includes(call)) idle(() => void compose([...opened, call]));
  });
}
