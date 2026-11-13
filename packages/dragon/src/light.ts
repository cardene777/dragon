/**
 * dragon の軽い入口 (`@cardenelabs/dragon/light`、#3248、#3349)。
 *
 * 既定の入口と同じ部品を出すが、chart、cycle、er、flow、git、lineup、matrix、mind、pipe、sankey、state、time、tree、try、venn の描く部品と、その図の種類だけの個別ブロックの読み方を持たない。
 * コアブロックと、時系列図と構成図の個別ブロックの読み方は初めから持つ。
 *
 * - `loadFor(<記法か原本>)` を待つと、書いた図の種類の描く部品と、書いた図が使う個別ブロックの読み方だけを読む。原本の JSON を渡した時だけ、原本の形の検査も読む (#3400)
 * - `loadKind(<種類>)` を待つと、その種類の描く部品と、その種類の個別ブロックの読み方と、原本の形の検査を全て読む (裏で先に読む時に使う)
 * - `loadReadings(<記法か原本>)` を待つと、書いた図が使う個別ブロックの読み方だけを読み、描く部品は読まない (題と種類だけを引く時に使う)
 * - `diagramKind(<記法か原本>)` は、読む前に図の種類を返す。どの種類の `loadKind` を待つかを決める時に使う
 * - `definesBlocks(<記法>)` は、記法が足すブロックの定義の行 (`blocks 1`) を持つかを返す。持つ記法は `loadReadings` か `loadFor` を待ってから読む (#3399、#3407)
 * - `loadLine(<線の描き方>)` を待つと、その描き方で描くのに要る部品を読む。手描きの線 (`pen`、#3643) の時だけ、描き替える処理を読む
 * - `loadValidator()` を待つと、原本の形の検査だけを読む。`parseNotation` で記法から読んだ図は描く時に検査を省くので、原本の JSON を読む頁だけが要る (#3400)
 * - 箱と区画の `icon` に絵柄集の絵柄 (`tabler:<名前>`) を書いた図は、`loadFor` と `loadReadings` が絵柄集の表も読む。`iconSetLoaded("tabler")` は読んだかを返す (#3493)
 *
 * 読んだ後は既定の入口と同じ関数で、待たずに同じ図を読み、描き、書き戻す。
 * 読んでいない種類を描くと種類の名前を含む誤りで、読んでいない個別ブロックの行を読むとブロックの名前を含む誤りで止まる。
 * 最初に読む量を抑えたい頁を束ねる時に使い、この入口と既定の入口を 1 つの頁で混ぜない (混ぜると全ての部品が頁に入る)。
 */
import { readingLoaded, registerReading } from "./blocks/reading";
import { KIND_FOLDERS } from "./kinds/index";
import { LATER_READINGS } from "./blocks/later-readings";
import { blockKinds } from "./blocks/usable";
import { blocksUsedBy, kindOf } from "./blocks/used";
import { kindLoaded, LATER_KINDS, type LaterKind, type LaterKinds, registerKind } from "./kinds/registry";
import { FORMAT_VERSION, isVersion1, upgrade } from "./model";
import { printNotation } from "./printer";
import { isParsed } from "./parsed";
import { type Diagram, registerValidator, validatorLoaded } from "./schema";
import { iconSetLoaded, registerTabler, usesTabler } from "./blocks/icon/sets";
import { definesBlocks, registerUserBlockReader, userBlockReader } from "./user-blocks";
import { type LineStyle, penLoaded, registerPen } from "./render/pen-store";

export * from "./api";
export { definesBlocks, iconSetLoaded, kindLoaded, LATER_KINDS, type LaterKind };

const LOADERS: { [K in LaterKind]: () => Promise<LaterKinds[K]> } = {
  checkout: () => import("./kinds/checkout"),
  chart: () => import("./kinds/chart"),
  cycle: () => import("./kinds/cycle"),
  er: () => import("./kinds/er"),
  flow: () => import("./kinds/flow"),
  git: () => import("./kinds/git"),
  lineup: () => import("./kinds/lineup"),
  matrix: () => import("./kinds/matrix"),
  mind: () => import("./kinds/mind"),
  pipe: () => import("./kinds/pipe"),
  sankey: () => import("./kinds/sankey"),
  state: () => import("./kinds/state"),
  time: () => import("./kinds/time"),
  tree: () => import("./kinds/tree"),
  try: () => import("./kinds/try"),
  venn: () => import("./kinds/venn"),
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
 * 種類の描く部品と、その種類の個別ブロックの読み方を全て読む。時系列図と構成図の部品は初めから持つ。
 * 読んだ後はその種類の原本の JSON も描けるよう、原本の形の検査も読む (#3400)。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadKind(kind: string | undefined): Promise<void> {
  if (!isLater(kind)) return loadValidator();
  await Promise.all([loadParts(kind), loadBlocks(LATER_BLOCKS.filter((name) => blockKinds(name).includes(kind))), loadValidator()]);
}

/** Tabler の絵柄を持つ共有のブロックの名前 (#3489)。build が共有のブロック集から選んで入れる (`tsup.config.ts`) */
declare const __DRAGON_SHARED_TABLER__: readonly string[];

/**
 * 記法か原本 `source` が絵柄集 Tabler の絵柄を書いていれば、絵柄集の表を読む (#3493)。読んでいれば何もしない。
 * Tabler の絵柄を持つ共有のブロック (`+bridge`、#3489) の名前を書いた図も読む。
 * 表は 5,000 を超える絵柄を持つ 1 つの塊で、書いた図の時だけ読む
 */
async function loadIconSets(source: string | object): Promise<void> {
  if (usesTabler(source, __DRAGON_SHARED_TABLER__) && !iconSetLoaded("tabler")) registerTabler((await import("./blocks/icon/tabler.js")).default);
}

/** 記法 `text` が足すブロックの定義の行を持てば、定義を読む処理を読む (#3399)。読んでいれば何もしない */
async function loadUserBlocks(text: string): Promise<void> {
  if (definesBlocks(text) && userBlockReader() === undefined) registerUserBlockReader((await import("./user-blocks-read")).USER_BLOCK_READER);
}

/**
 * 記法か原本 (版1か版2) の図を読んで書き戻すのに要る、個別ブロックの読み方だけを読む (#3349)。描く部品は読まない。
 * 原本を渡した時は、原本を書き戻した記法を読むのに要るブロックも読む (時間軸の図の線は、拡大の範囲のブロックが読む時に確かめる)。
 * 足すブロックの定義の行を持つ記法と、定義 (`define`) を持つ原本では、定義を読む処理も読む (#3399)。
 * 絵柄集の絵柄を書いた記法と原本では、絵柄集の表も読む (#3493)。
 * 記法の題と種類だけを引き、描くのは後の頁に任せる時に使う。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadReadings(source: string | object): Promise<void> {
  const diagram = current(source);
  const kind = diagramKind(diagram);
  if (kind && (KIND_FOLDERS as Readonly<Record<string, { fields?: readonly string[] }>>)[kind]?.fields) await loadParts(kind);
  if (typeof diagram === "string") {
    await Promise.all([loadBlocks(blocksUsedBy(diagram)), loadUserBlocks(diagram), loadIconSets(diagram)]);
    return;
  }
  await Promise.all([loadBlocks(blocksUsedBy(diagram)), loadIconSets(diagram)]);
  let printed: string;
  try {
    // 読むのに要るブロックを数えるだけなので、省かずに書く。省く形は読み直して確かめるので、まだ読んでいないブロックで落ちる
    printed = printNotation(diagram as Diagram, { short: false });
  } catch {
    // 書き戻せない原本は、読む処理 (`readDiagram`) がその誤りを返す
    return;
  }
  await Promise.all([loadBlocks(blocksUsedBy(printed)), loadUserBlocks(printed)]);
}

/**
 * 線の描き方 `line` (#3643) で描くのに要る部品を読む。手描きの線 (`pen`) の時だけ描き替える処理を読み、読んでいれば何もしない。
 * 描き替える処理は線を揺らす計算を持ち、最初に読む量に入れないため後から読む。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadLine(line: LineStyle | undefined): Promise<void> {
  if (line === "pen" && !penLoaded()) registerPen((await import("./render/pen")).penSvg);
}

/**
 * 原本の形の検査を読む (#3400)。読んでいれば何もしない。
 * 記法から読んだ図は検査を要らないので、`loadFor` は原本の JSON を渡した時だけこれを待つ。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadValidator(): Promise<void> {
  if (!validatorLoaded()) registerValidator((await import("./schemas/validator")).VALIDATOR);
}

/**
 * 記法か原本 (版1か版2) の図を読んで描くのに要る物だけを読む。書いた図の種類の描く部品と、書いた図が使う個別ブロックの読み方 (`loadReadings`、#3349)。
 * 図の種類が読めない記法や原本は何も読まずに終わり、読む処理がその誤りを返す。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadFor(source: string | object): Promise<void> {
  // 原本の JSON は、読む前に原本の形の検査も読む。記法と、記法から読んだ図は検査を要らない (#3400)
  const json = typeof source !== "string" && !isParsed(source);
  await Promise.all([loadParts(diagramKind(source)), loadReadings(source), json ? loadValidator() : undefined]);
}
