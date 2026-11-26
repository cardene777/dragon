/**
 * 軽い入口と script の1行の入口が使う、図を描く前に要る部品を読む処理 (#3782)。
 *
 * 軽い入口 (`light.ts`) はこの file の関数をそのまま出す。script の1行の入口 (`script.ts`) は、軽い入口を通らずにこの file を直に読む。
 * 軽い入口は既定の入口と同じ部品 (`api.ts`) も出すので、通ると 1 行の入口が使わない部品 (エディタの URL など) まで最初に読む file に入る。
 *
 * この file は種類の登録の file (`kind-use/<種類>.ts`) を読み込みの時に読まない。
 * 軽い入口は時系列図と構成図の並べ方を初めから登録し、script の1行の入口は時系列図だけを初めから登録して構成図の登録の file を自分で後から読む。
 * この file は構成図の登録の file を後から読まない。読むと esbuild が軽い入口の build で構成図の登録を入口の外の塊へ分け、
 * 軽い入口を束ねる見本帳の build が副作用だけの import を外し、構成図を登録しないまま描いて落ちるため。
 */
import { registerNoteCardsLoader } from "./blocks/pop/cards-store";
import { readingLoaded, registerReading } from "./blocks/reading";
import { KIND_FOLDERS } from "./kinds/index";
import { LATER_READINGS } from "./blocks/later-readings";
import { blockKinds } from "./blocks/usable";
import { blocksUsedBy, kindOf } from "./blocks/used";
import { kindLoaded, LATER_KINDS, type LaterKind, type LaterKinds, registerKind } from "./kinds/registry";
import { FORMAT_VERSION, isVersion1, upgrade } from "./model";
import { printNotation } from "./printer";
import { isParsed } from "./parsed";
import { type Diagram, registerValidator, type SequenceShape, validatorLoaded } from "./schema";
import { iconSetLoaded, registerTabler, usesTabler } from "./blocks/icon/sets";
import { definesBlocks, registerUserBlockReader, userBlockReader } from "./user-blocks";
import { architectureEnds, registerArchitectureEnds } from "./render/follow-ends-store";
import { lookOf, registerSequenceLook, sequenceLookLoaded } from "./render/look-store";
import { type LineStyle, penLoaded, registerPen } from "./render/pen-store";

export { definesBlocks, iconSetLoaded, kindLoaded, LATER_KINDS, type LaterKind };

// 押すと出る札の層を作る処理 (#3877) は札で見せる図だけが使うので、最初に読む量に入れず、再生の部品が札で見せる図を置いた時に後から読む
registerNoteCardsLoader(async () => (await import("./blocks/pop/cards")).mountNoteCards);

const LOADERS: { [K in LaterKind]: () => Promise<LaterKinds[K]> } = {
  cards: () => import("./kinds/cards"),
  checkout: () => import("./kinds/checkout"),
  chart: () => import("./kinds/chart"),
  cycle: () => import("./kinds/cycle"),
  er: () => import("./kinds/er"),
  flow: () => import("./kinds/flow"),
  git: () => import("./kinds/git"),
  judge: () => import("./kinds/judge"),
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

/** 足すブロックの定義を持つ図 (`defines`) なら、定義を読む処理を読む (#3399)。読んでいれば何もしない */
async function loadUserBlocks(defines: boolean): Promise<void> {
  if (defines && userBlockReader() === undefined) registerUserBlockReader((await import("./user-blocks-read")).USER_BLOCK_READER);
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
    await Promise.all([loadBlocks(blocksUsedBy(diagram)), loadUserBlocks(definesBlocks(diagram)), loadIconSets(diagram)]);
    return;
  }
  // 定義 (`define`) を書き戻す処理は定義を読む処理と一緒に読むので、書き戻す前に読む (#3633)
  await Promise.all([loadBlocks(blocksUsedBy(diagram)), loadIconSets(diagram), loadUserBlocks((diagram as Diagram).define !== undefined)]);
  let printed: string;
  try {
    // 読むのに要るブロックを数えるだけなので、省かずに書く。省く形は読み直して確かめるので、まだ読んでいないブロックで落ちる
    printed = printNotation(diagram as Diagram, { short: false });
  } catch {
    // 書き戻せない原本は、読む処理 (`readDiagram`) がその誤りを返す
    return;
  }
  await loadBlocks(blocksUsedBy(printed));
}

/**
 * 線の描き方 `line` (#3643) で描くのに要る部品を読む。手描きの線 (`pen`) の時だけ描き替える処理を読み、読んでいれば何もしない。
 * 描き替える処理は線を揺らす計算を持ち、最初に読む量に入れないため後から読む。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadLine(line: LineStyle | undefined): Promise<void> {
  if (line === "pen" && !penLoaded()) registerPen((await import("./render/pen")).penSvg);
}

/**
 * 時系列図の見た目 `shape` (#3720) で並べて描くのに要る部品を読む。パイプ図の部品で描く見た目 (`pipe`) の時だけ読み、読んでいれば何もしない。
 * 並べ方と描き方はパイプ図の部品を使って大きいので、最初に読む量に入れず後から読む。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadLook(shape: SequenceShape | undefined): Promise<void> {
  if (shape === "pipe" && !sequenceLookLoaded()) registerSequenceLook((await import("./render/sequence")).SEQUENCE_PIPE);
}

/**
 * 構成図 `kind` を寄って追う窓で描く時に、窓の端で切れる箱に名前の札を出す部品 (#3871) を読む。読んでいれば何もしない。
 * 札は寄って追う窓でだけ出すので、最初に読む量に入れず後から読む。読み込みが落ちると拒否され、次に呼ぶと読み直す
 */
export async function loadEnds(kind: string | undefined): Promise<void> {
  if (kind === "architecture" && !architectureEnds()) registerArchitectureEnds((await import("./render/architecture-ends")).ARCHITECTURE_ENDS);
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
  // 種類の行に `[shape: pipe]` を書いた時系列図は、その見た目で並べて描く部品も読む (#3720)
  // 構成図は、寄って追う窓の端で切れる箱に出す名前の札の部品も読む (#3871)
  const kind = diagramKind(source);
  await Promise.all([loadParts(kind), loadEnds(kind), loadReadings(source), loadLook(lookOf(current(source))), json ? loadValidator() : undefined]);
}
