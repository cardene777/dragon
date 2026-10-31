/**
 * 図の種類ごとの描く部品の登録簿 (#3248)。
 *
 * 描く所 (`render/draw.ts`) は git、lineup、state、time、tree の部品をここから引く。
 * 全部入りの入口は読み込みの時に全ての種類を登録し (`all.ts`)、軽い入口は `loadKind` が種類を読んだ時に登録する (`light.ts`)。
 * 時系列図と構成図の部品は登録せず、描く所が直に読む。
 */
import { FIGURE_TEXT } from "../figure-text";
import type { NotationLang } from "../words";
import type * as git from "./git";
import type * as lineup from "./lineup";
import type * as state from "./state";
import type * as time from "./time";
import type * as tree from "./tree";

/** 後から読む種類の名前。部品の型から導くと、部品の型が軽い入口の型の file へ漏れるので字で書く */
export type LaterKind = "git" | "lineup" | "state" | "time" | "tree";

export interface LaterKinds {
  git: typeof git;
  lineup: typeof lineup;
  state: typeof state;
  time: typeof time;
  tree: typeof tree;
}

/** 後から読む種類 */
export const LATER_KINDS: readonly LaterKind[] = ["git", "lineup", "state", "time", "tree"];

const registered: Partial<LaterKinds> = {};

export function registerKind<K extends LaterKind>(kind: K, parts: LaterKinds[K]): void {
  registered[kind] = parts;
}

/** 種類の部品を今すぐ描ける形で持っているか。時系列図と構成図は常に持つ */
export function kindLoaded(kind: string | undefined): boolean {
  return !(LATER_KINDS as readonly (string | undefined)[]).includes(kind) || registered[kind as LaterKind] !== undefined;
}

/** 種類の部品。読んでいない時は、種類の名前を含む誤りで止まる */
export function kindParts<K extends LaterKind>(kind: K, lang: NotationLang = "ja"): LaterKinds[K] {
  const parts = registered[kind];
  if (parts === undefined) throw new Error(FIGURE_TEXT[lang].kindNotLoaded(kind));
  return parts;
}
