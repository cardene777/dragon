/**
 * 図の種類ごとの描く部品の登録簿 (#3248)。
 *
 * 描く所 (`render/draw.ts`) は後から読む種類の部品の組 (`kinds/parts.ts`) を、種類の名前でここから引く (`partsOf`、#3656)。
 * 再生の部品 (`player.ts`) は、試す図と配管の図の再生の部品を種類の名前を書いて引く。
 * 全部入りの入口は読み込みの時に全ての種類を登録し (`all.ts`)、軽い入口は `loadKind` か `loadFor` が種類を読んだ時に登録する (`light.ts`)。
 * ブロックの読み方は別の登録簿 (`blocks/reading.ts`) が持ち、軽い入口は書いた図が使う個別ブロックの読み方を種類の部品と別に読む (#3349)。
 * 時系列図と構成図の並べ方は、種類の登録の file (`kind-use/<種類>.ts`) がここへ登録し、描く所が名前で引く (`eagerLayout`、#3763)。
 *
 * この file は種類の file を読まない。種類の部品の型は、後から読む種類の file (`kinds/<種類>.ts`) が `LaterKinds` に足す (#3763)。
 * ここが種類の file を読むと、描く所を読む全ての検査が全ての種類の file へたどり着き、変更に関係する検査だけを選べなくなる
 */
import { FIGURE_TEXT } from "../figure-text";
import type { Layout } from "../layout/scene";
import type { DiagramModel } from "../schema";
import { DEFAULT_LANG, type NotationLang } from "../words";
import type { KindParts } from "./parts";

/** 後から読む種類の名前。部品の型から導くと、部品の型が軽い入口の型の file へ漏れるので字で書く */
export type LaterKind = "checkout" | "chart" | "cycle" | "er" | "flow" | "git" | "judge" | "lineup" | "matrix" | "mind" | "pipe" | "sankey" | "state" | "time" | "tree" | "try" | "venn";

/**
 * 後から読む種類の名前と、その種類の描く部品の file (`kinds/<種類>.ts`) が出す物の型。
 * 種類の file が `declare module "./registry"` で自分の行を足す。ここは行を持たず、種類の file を読まない (#3763)
 */
export interface LaterKinds {
  [kind: string]: { parts: KindParts } | undefined;
}

/** 後から読む種類 */
export const LATER_KINDS: readonly LaterKind[] = ["checkout", "chart", "cycle", "er", "flow", "git", "judge", "lineup", "matrix", "mind", "pipe", "sankey", "state", "time", "tree", "try", "venn"];

export function notationReader(text: string): KindParts["notation"] {
  return [...notations.values()].find(n => n.matches(text));
}

const registered: Partial<Record<LaterKind, { parts: KindParts }>> = {};
const notations = new Map<string, NonNullable<KindParts['notation']>>();

export function registerKind<K extends LaterKind>(kind: K, parts: NonNullable<LaterKinds[K]>): void {
  registered[kind] = parts;
  if (parts.parts.notation) notations.set(kind, parts.parts.notation);
}

/** 最初から読む種類の名前。既定の入口と軽い入口は、どちらも読み込みの時に並べ方を登録する */
export type EagerKindName = "architecture" | "sequence";

/** 最初から読む種類の並べ方。`lang` は並べ方が出す字 (断りの文など) の言葉 */
export type EagerLayout = (diagram: DiagramModel, lang: NotationLang) => Layout;

const EAGER_KINDS: readonly EagerKindName[] = ["architecture", "sequence"];
const eagerLayouts = new Map<string, EagerLayout>();

/** 最初から読む種類の並べ方を登録する。種類の登録の file (`kind-use/sequence.ts`、`kind-use/architecture.ts`) が呼ぶ (#3763) */
export function registerEagerLayout(kind: EagerKindName, layout: EagerLayout): void {
  eagerLayouts.set(kind, layout);
}

/** 最初から読む種類の並べ方。登録していない時は、種類の名前を含む誤りで止まる */
export function eagerLayout(kind: EagerKindName, lang: NotationLang = DEFAULT_LANG): EagerLayout {
  const layout = eagerLayouts.get(kind);
  if (layout === undefined) throw new Error(FIGURE_TEXT[lang].kindNotLoaded(kind));
  return layout;
}

/** 種類の部品を今すぐ描ける形で持っているか。時系列図と構成図は、既定の入口と軽い入口では常に持つ */
export function kindLoaded(kind: string | undefined): boolean {
  if ((EAGER_KINDS as readonly (string | undefined)[]).includes(kind)) return eagerLayouts.has(kind as string);
  return !(LATER_KINDS as readonly (string | undefined)[]).includes(kind) || registered[kind as LaterKind] !== undefined;
}

/** 種類の部品。読んでいない時は、種類の名前を含む誤りで止まる */
export function kindParts<K extends LaterKind>(kind: K, lang: NotationLang = DEFAULT_LANG): NonNullable<LaterKinds[K]> {
  const parts = registered[kind];
  if (parts === undefined) throw new Error(FIGURE_TEXT[lang].kindNotLoaded(kind));
  return parts as NonNullable<LaterKinds[K]>;
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
