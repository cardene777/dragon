/**
 * dragon の軽い入口 (`@cardenelabs/dragon/light`、#3248、#3349)。
 *
 * 既定の入口と同じ部品を出すが、git、lineup、pipe、state、time、tree、try の描く部品と、その図の種類だけの個別ブロックの読み方を持たない。
 * コアブロックと、時系列図と構成図の個別ブロックの読み方は初めから持つ。
 *
 * - `loadFor(<記法か原本>)` を待つと、書いた図の種類の描く部品と、書いた図が使う個別ブロックの読み方だけを読む
 * - `loadKind(<種類>)` を待つと、その種類の描く部品と、その種類の個別ブロックの読み方を全て読む (裏で先に読む時に使う)
 * - `loadReadings(<記法か原本>)` を待つと、書いた図が使う個別ブロックの読み方だけを読み、描く部品は読まない (題と種類だけを引く時に使う)
 * - `diagramKind(<記法か原本>)` は、読む前に図の種類を返す。どの種類の `loadKind` を待つかを決める時に使う
 *
 * 読んだ後は既定の入口と同じ関数で、待たずに同じ図を読み、描き、書き戻す。
 * 読んでいない種類を描くと種類の名前を含む誤りで、読んでいない個別ブロックの行を読むとブロックの名前を含む誤りで止まる。
 * 最初に読む量を抑えたい頁を束ねる時に使い、この入口と既定の入口を 1 つの頁で混ぜない (混ぜると全ての部品が頁に入る)。
 */
import { readingLoaded, registerReading } from "./blocks/reading";
import { LATER_READINGS } from "./blocks/later-readings";
import { blockKinds } from "./blocks/usable";
import { blocksUsedBy, kindOf } from "./blocks/used";
import { kindLoaded, LATER_KINDS, type LaterKind, type LaterKinds, registerKind } from "./kinds/registry";
import { FORMAT_VERSION, isVersion1, upgrade } from "./model";
import { printNotation } from "./printer";
import type { Diagram } from "./schema";

export * from "./api";
export { kindLoaded, LATER_KINDS, type LaterKind };

const LOADERS: { [K in LaterKind]: () => Promise<LaterKinds[K]> } = {
  git: () => import("./kinds/git"),
  lineup: () => import("./kinds/lineup"),
  pipe: () => import("./kinds/pipe"),
  state: () => import("./kinds/state"),
  time: () => import("./kinds/time"),
  tree: () => import("./kinds/tree"),
  try: () => import("./kinds/try"),
};

/** 後から読む個別ブロックの名前。書いた図が使う時か、その種類を `loadKind` で読んだ時に読む (#3349) */
export const LATER_BLOCKS: readonly string[] = Object.keys(LATER_READINGS);

/** 個別ブロック `name` の読み方を今すぐ使える形で持っているか。コアブロックと、時系列図と構成図の個別ブロックは常に持つ */
export const blockLoaded = (name: string): boolean => readingLoaded(name);

const isLater = (kind: string | undefined): kind is LaterKind => (LATER_KINDS as readonly (string | undefined)[]).includes(kind);

/** 版1の原本を版2へ移す。記法と版2の原本はそのまま */
const current = (source: string | object): string | object => (typeof source === "string" || !isVersion1(source) ? source : upgrade(source, FORMAT_VERSION));

/**
 * 記法か原本 (版1か版2) の図の種類 (#3349)。記法は最初の空でない行の頭の語、原本は `kind` の欄。読めなければ `undefined`。
 * 読む前に、どの種類を待つかを決める時に使う
 */
export function diagramKind(source: string | object): string | undefined {
  const diagram = current(source);
  const kind = typeof diagram === "string" ? kindOf(diagram) : (diagram as { kind?: unknown }).kind;
  return typeof kind === "string" && kind !== "" ? kind : undefined;
}

async function registerParts<K extends LaterKind>(kind: K): Promise<void> {
  registerKind(kind, await LOADERS[kind]());
}

/** 種類の描く部品を読む。読んでいれば何もしない */
async function loadParts(kind: string | undefined): Promise<void> {
  if (isLater(kind) && !kindLoaded(kind)) await registerParts(kind);
}

/** 個別ブロックの読み方を読む。読んでいるか、後から読むブロックでなければ何もしない */
async function loadBlocks(names: readonly string[]): Promise<void> {
  await Promise.all(
    names.map(async (name) => {
      const load = LATER_READINGS[name];
      if (load !== undefined && !readingLoaded(name)) registerReading(name, await load());
    }),
  );
}

/**
 * 種類の描く部品と、その種類の個別ブロックの読み方を全て読む。時系列図と構成図は初めから持つので何もしない。
 * 読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadKind(kind: string | undefined): Promise<void> {
  if (!isLater(kind)) return;
  await Promise.all([loadParts(kind), loadBlocks(LATER_BLOCKS.filter((name) => blockKinds(name).includes(kind)))]);
}

/**
 * 記法か原本 (版1か版2) の図を読んで書き戻すのに要る、個別ブロックの読み方だけを読む (#3349)。描く部品は読まない。
 * 原本を渡した時は、原本を書き戻した記法を読むのに要るブロックも読む (時間軸の図の線は、拡大の範囲のブロックが読む時に確かめる)。
 * 記法の題と種類だけを引き、描くのは後の頁に任せる時に使う。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadReadings(source: string | object): Promise<void> {
  const diagram = current(source);
  await loadBlocks(blocksUsedBy(diagram));
  if (typeof diagram === "string") return;
  let printed: string;
  try {
    printed = printNotation(diagram as Diagram);
  } catch {
    // 書き戻せない原本は、読む処理 (`readDiagram`) がその誤りを返す
    return;
  }
  await loadBlocks(blocksUsedBy(printed));
}

/**
 * 記法か原本 (版1か版2) の図を読んで描くのに要る物だけを読む。書いた図の種類の描く部品と、書いた図が使う個別ブロックの読み方 (`loadReadings`、#3349)。
 * 図の種類が読めない記法や原本は何も読まずに終わり、読む処理がその誤りを返す。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadFor(source: string | object): Promise<void> {
  await Promise.all([loadParts(diagramKind(source)), loadReadings(source)]);
}
