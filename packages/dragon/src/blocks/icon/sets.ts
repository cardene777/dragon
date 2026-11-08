/**
 * 絵柄集 Tabler の登録簿 (#3493)。箱と区画の `icon` に `tabler:<名前>` で書く、Tabler (MIT) の線の絵柄の形を持つ。
 *
 * 形の表は build の時に `scripts/build-tabler.mjs` が手描きの絵柄と同じ 20 四方の格子へ移して `tabler.js` に書き出す。
 * 既定の入口は読み込みの時に表を全て登録し (`sets-all.ts`)、軽い入口は `tabler:` を書いた図の時だけ表を後から読んで登録する。
 * 書き出した HTML の頁と `dragon embed` の頁は、図が使った絵柄だけを頁に収め、頁を開いた時にそれを登録する (`page-icons.ts`)。
 * 表は大きいので、この file は表を読まず、登録された表を引くだけにする。
 * 原本の欄を辿る処理 (`set-fields.ts`) は、原本の検査と一緒に後から読む塊に置く。軽い入口の最初に読む量を抑えるため。
 * 絵柄集は Tabler だけなので、絵柄集を見分ける仕組みを持たず、頭の `tabler:` だけを見る。
 */
import { nearest } from "../../nearest";

/** Tabler の絵柄の名前の頭 */
const HEAD = "tabler:";

let table: Readonly<Record<string, string>> | undefined;

/** Tabler の形の表を登録する。登録し直すと、前の表に足す (頁は使った絵柄だけを登録する) */
export function registerTabler(given: Readonly<Record<string, string>>): void {
  table = { ...table, ...given };
}

/** 絵柄集 `set` (今は `tabler` だけ) の形の表を今すぐ引ける形で持っているか */
export const iconSetLoaded = (set: string): boolean => set === "tabler" && table !== undefined;

/** Tabler の絵柄の名前 (`tabler:<名前>`) か */
export const isTabler = (value: string): boolean => value.startsWith(HEAD);

/** Tabler の絵柄の path。Tabler の名前でないか、表を読んでいないか、表に無い名前は `undefined` */
export const tablerPath = (value: string): string | undefined => {
  const name = value.slice(HEAD.length);
  return isTabler(value) && table && Object.hasOwn(table, name) ? table[name] : undefined;
};

/** Tabler の絵柄の誤りの文。読む処理 (`readIcon`) と原本の検査 (`validateDiagram`) が同じ文を使う */
export interface TablerMessages {
  /** Tabler の絵柄 `value` を書いたが、表を読んでいない */
  tablerNotLoaded: (value: string) => string;
  /** Tabler に無い名前 `value`。近い名前 `near` が在ればそれを挙げる */
  unknownTabler: (value: string, near: string | undefined) => string;
}

export const TABLER_MESSAGES: { ja: TablerMessages; en: TablerMessages } = {
  ja: {
    tablerNotLoaded: (value) => `${value} は Tabler の絵柄。先に loadFor を待つ`,
    unknownTabler: (value, near) => `${value} という icon は Tabler に無い${near ? `。近い名前は ${near}` : ""}`,
  },
  en: {
    tablerNotLoaded: (value) => `${value} is a Tabler icon. Await loadFor first`,
    unknownTabler: (value, near) => `Tabler has no icon named ${value}${near ? `. The closest is ${near}` : ""}`,
  },
};

/** Tabler の絵柄 `value` の誤りの文。Tabler の名前でないか、表に在る名前なら `undefined` */
export function tablerError(value: string, m: TablerMessages): string | undefined {
  if (!isTabler(value) || tablerPath(value)) return undefined;
  if (!table) return m.tablerNotLoaded(value);
  const near = nearest(value.slice(HEAD.length), Object.keys(table));
  return m.unknownTabler(value, near && HEAD + near);
}

/**
 * 記法か原本が、Tabler の絵柄を書いているか。箱の行の `icon:` の属性と定義の `icon` の行と原本の値の頭の `tabler:` を探す。
 * `names` は Tabler の絵柄を持つ共有のブロックの名前で、名前を書いた図も絵柄を描く (#3489)。
 * 欄を辿らずに字で探すので、ほかの欄の字に当たると要らない表まで読むが、描く図は変わらない
 */
export const usesTabler = (source: string | object, names: readonly string[]): boolean => {
  const text = typeof source === "string" ? source : JSON.stringify(source);
  return [HEAD, ...names].some((name) => text.includes(name));
};
