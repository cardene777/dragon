/**
 * 図の種類ごとの描く部品の登録簿 (#3248)。
 *
 * 描く所 (`render/draw.ts`) は後から読む種類の部品の組 (`kinds/parts.ts`) を、種類の名前でここから引く (`partsOf`、#3656)。
 * 再生の部品 (`player.ts`) は、試す図と配管の図の再生の部品を種類の名前を書いて引く。
 * 全部入りの入口は読み込みの時に全ての種類を登録し (`all.ts`)、軽い入口は `loadKind` か `loadFor` が種類を読んだ時に登録する (`light.ts`)。
 * ブロックの読み方は別の登録簿 (`blocks/reading.ts`) が持ち、軽い入口は書いた図が使う個別ブロックの読み方を種類の部品と別に読む (#3349)。
 * 時系列図と構成図は図の種類の置き場 (`kinds/<種類>/`) に並べ方を持ち、登録せずに描く所が置き場の一覧 (`kinds/index.ts`) から引く (#3345)。
 */
import { FIGURE_TEXT } from "../figure-text";
import { DEFAULT_LANG, type NotationLang } from "../words";
import type { KindParts } from "./parts";
import type * as checkout from "./checkout";
import type * as chart from "./chart";
import type * as cycle from "./cycle";
import type * as er from "./er";
import type * as flow from "./flow";
import type * as git from "./git";
import type * as lineup from "./lineup";
import type * as matrix from "./matrix";
import type * as mind from "./mind";
import type * as pipe from "./pipe";
import type * as sankey from "./sankey";
import type * as state from "./state";
import type * as time from "./time";
import type * as tree from "./tree";
import type * as tryKind from "./try";
import type * as venn from "./venn";

/** 後から読む種類の名前。部品の型から導くと、部品の型が軽い入口の型の file へ漏れるので字で書く */
export type LaterKind = "checkout" | "chart" | "cycle" | "er" | "flow" | "git" | "lineup" | "matrix" | "mind" | "pipe" | "sankey" | "state" | "time" | "tree" | "try" | "venn";

export interface LaterKinds {
  checkout: typeof checkout;
  chart: typeof chart;
  cycle: typeof cycle;
  er: typeof er;
  flow: typeof flow;
  git: typeof git;
  lineup: typeof lineup;
  matrix: typeof matrix;
  mind: typeof mind;
  pipe: typeof pipe;
  sankey: typeof sankey;
  state: typeof state;
  time: typeof time;
  tree: typeof tree;
  try: typeof tryKind;
  venn: typeof venn;
}

/** 後から読む種類 */
export const LATER_KINDS: readonly LaterKind[] = ["checkout", "chart", "cycle", "er", "flow", "git", "lineup", "matrix", "mind", "pipe", "sankey", "state", "time", "tree", "try", "venn"];

export function notationReader(text: string): KindParts["notation"] {
  return [...notations.values()].find(n => n.matches(text));
}

const registered: Partial<LaterKinds> = {};
const notations = new Map<string, NonNullable<KindParts['notation']>>();

export function registerKind<K extends LaterKind>(kind: K, parts: LaterKinds[K]): void {
  registered[kind] = parts;
  if (parts.parts.notation) notations.set(kind, parts.parts.notation);
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

/**
 * 図の種類の名前で引く、並べ方と札の時刻の直しと描き方の組 (#3656)。最初から読む種類 (時系列図と構成図) は組を持たないので `undefined` を返す。
 * 後から読む種類を読んでいない時は、種類の名前を含む誤りで止まる
 */
export function partsOf(kind: string, lang: NotationLang = DEFAULT_LANG): KindParts | undefined {
  return (LATER_KINDS as readonly string[]).includes(kind) ? kindParts(kind as LaterKind, lang).parts : undefined;
}

/** Optional notation/validation hooks must not load drawing parts for other kinds. */
export function readyParts(kind: string): KindParts | undefined {
  return registered[kind as LaterKind]?.parts;
}
