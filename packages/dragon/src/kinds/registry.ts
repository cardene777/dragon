/**
 * 図の種類ごとの描く部品の登録簿 (#3248)。
 *
 * 描く所 (`render/draw.ts`) は flow、git、lineup、pipe、state、time、tree、try の部品をここから引く。
 * 全部入りの入口は読み込みの時に全ての種類を登録し (`all.ts`)、軽い入口は `loadKind` か `loadFor` が種類を読んだ時に登録する (`light.ts`)。
 * ブロックの読み方は別の登録簿 (`blocks/reading.ts`) が持ち、軽い入口は書いた図が使う個別ブロックの読み方を種類の部品と別に読む (#3349)。
 * 時系列図と構成図は図の種類の置き場 (`kinds/<種類>/`) に並べ方を持ち、登録せずに描く所が置き場の一覧 (`kinds/index.ts`) から引く (#3345)。
 */
import { FIGURE_TEXT } from "../figure-text";
import { DEFAULT_LANG, type NotationLang } from "../words";
import type * as flow from "./flow";
import type * as git from "./git";
import type * as lineup from "./lineup";
import type * as pipe from "./pipe";
import type * as state from "./state";
import type * as time from "./time";
import type * as tree from "./tree";
import type * as tryKind from "./try";

/** 後から読む種類の名前。部品の型から導くと、部品の型が軽い入口の型の file へ漏れるので字で書く */
export type LaterKind = "flow" | "git" | "lineup" | "pipe" | "state" | "time" | "tree" | "try";

export interface LaterKinds {
  flow: typeof flow;
  git: typeof git;
  lineup: typeof lineup;
  pipe: typeof pipe;
  state: typeof state;
  time: typeof time;
  tree: typeof tree;
  try: typeof tryKind;
}

/** 後から読む種類 */
export const LATER_KINDS: readonly LaterKind[] = ["flow", "git", "lineup", "pipe", "state", "time", "tree", "try"];

const registered: Partial<LaterKinds> = {};

export function registerKind<K extends LaterKind>(kind: K, parts: LaterKinds[K]): void {
  registered[kind] = parts;
}

/** 種類の部品を今すぐ描ける形で持っているか。時系列図と構成図は常に持つ */
export function kindLoaded(kind: string | undefined): boolean {
  return !(LATER_KINDS as readonly (string | undefined)[]).includes(kind) || registered[kind as LaterKind] !== undefined;
}

/** 種類の部品。読んでいない時は、種類の名前を含む誤りで止まる */
export function kindParts<K extends LaterKind>(kind: K, lang: NotationLang = DEFAULT_LANG): LaterKinds[K] {
  const parts = registered[kind];
  if (parts === undefined) throw new Error(FIGURE_TEXT[lang].kindNotLoaded(kind));
  return parts;
}
