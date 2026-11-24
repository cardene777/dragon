/**
 * 押すと出る札の層 (#3877) を作る処理の置き場。
 *
 * 札の層を作る処理 (`cards.ts`) は札で見せる図だけが使うので、軽い入口が最初に読む量に入れず、置き場だけを最初から持つ。
 * 全部を持つ入口と頁の再生の script は読み込みの時に処理を置き (`cards-all.ts`)、軽い入口は読む処理だけを置き (`light-load.ts`)、
 * 再生の部品が札で見せる図を置いた時に後から読む。読み終わる前に印を押しても札は開かず、読み終わった後に押すと開く
 */
import type { FigureText } from "../../figure-text";
import type { Layout } from "../../layout/scene";

export interface NoteCards {
  /** 札の層。置く側が図の枠の図の後ろに置く。頁が枠の中の `svg` を探した時に、札の閉じるのアイコンでなく図を見つけるため */
  layer: HTMLElement;
  /** 箱 `box` の札を、押した箱の要素 `anchor` のすぐ下に開く。開いている同じ箱の札は閉じる。段 `step` で開いたことを覚える */
  open(box: string, anchor: Element, step: number): void;
  /** 開いている札を閉じる */
  close(): void;
  /** 段が替わった時に呼ぶ。開いた時と違う段なら札を閉じる */
  stepped(step: number): void;
  /** 頁から外す */
  destroy(): void;
}

/** 図の枠 `frame` の札の層を作る処理。`controls` は押しても札を閉じない再生の操作の列 */
export type MountNoteCards = (doc: Document, frame: HTMLElement, controls: Element, layout: Layout, words: FigureText) => NoteCards | undefined;

let mount: MountNoteCards | undefined;
let load: (() => Promise<MountNoteCards>) | undefined;

/** 札の層を作る処理を置く。全部を持つ入口が読み込みの時に呼ぶ */
export function registerNoteCards(made: MountNoteCards): void {
  mount = made;
}

/** 札の層を作る処理を後から読む処理を置く。軽い入口が読み込みの時に呼ぶ */
export function registerNoteCardsLoader(loader: () => Promise<MountNoteCards>): void {
  load = loader;
}

/**
 * 札の層を作る処理を `ready` に渡す。持っていればその場で渡し、持たなければ読んでから渡す。
 * 読めなかった時は渡さず、印を押しても札は開かない。次に札で見せる図を置いた時に読み直す
 */
export function withNoteCards(ready: (made: MountNoteCards) => void): void {
  if (mount) {
    ready(mount);
    return;
  }
  load?.().then(
    (made) => {
      mount = made;
      ready(made);
    },
    () => undefined,
  );
}
