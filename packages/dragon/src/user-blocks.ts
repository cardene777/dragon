/**
 * 使う人が自分の手元で足すブロック (#3399)。
 *
 * 足すブロックは、今の箱 (`box`) と線 (`edge`) と箱に付く印 (`icon`) のどれかを元にして、形と色の役を替えた物にする。
 * 置き場所と動きと置ける図の種類は元のブロックのままなので、8 つの図の種類の並べ方を直さずに全ての図で使える。
 *
 * 定義はデータだけで、記法の行 (`blocks 1` の後の `block +<名前>` から `end` まで) か、同じ中身の JSON (`"format": 1`) で書く。
 * 書けるのは元のブロック、形 (基本の形の名前か SVG の path の文法の字)、色の役の名前、箱の絵柄の名前 (#3489) だけで、URL と code と SVG の要素は断る。
 * 定義が頁に外の物を読ませることは無く、他の人が書いた定義を読んでも何も実行されない。
 *
 * 記法の語は頭に `+` を付ける。後で本体が同じ名前のブロックを足しても、前に書いた図の意味が変わらないため。
 * 定義の頭に版を書かせ、知らない版は断る。形を変えた時に、古い定義を黙って読み違えないため。
 *
 * 皆で使える定義は共有のブロック集 (`packages/dragon/blocks/`、1 定義 1 file) に置き、図の頭に定義を書かずに `+名前` で使える (#3455)。
 * 集は build が読んで本体に埋める (`tsup.config.ts`)。図の頭の定義と引数で渡した定義が、同じ名前の共有の定義に勝つ。
 * 後から集に同じ名前が足されても、前に書いた図の意味が変わらないため。
 *
 * 定義の並びを読む処理と誤りの文の多くは `user-blocks-read.ts` に置き、軽い入口は定義を書いた図の時だけ後から読む。
 * 読む処理と描く処理は、読む間と描く間だけ定義を有効にする (`withUserBlocks`)。
 * 箱の描き方と線の描き方と印の描き方は、引数を増やさずにここから名前で引く。
 */
import type { Color } from "./blocks/color/block";
import type { BoxFit, Point, Rect, SlotRoom } from "./layout/scene";
import type { DiagramModel } from "./schema";
import type { SourceLine } from "./tokenize";
import type { NotationLang } from "./words";

/** 元にできるブロック。並び (`USER_BASES`) と、版と形の名前と名前の決まりは、定義を読む時だけ要るので `user-blocks-read.ts` に置く */
export type UserBase = "box" | "edge" | "icon";

/** path の文法の字。命令の字と数と区切りだけで、`<` も `(` も `:` も書けない */
const PATH_TEXT = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]+$/u;
/** path の長さの上限。1 つのブロックの形にこれより長い path は要らない */
const PATH_MAX = 2000;

/** 足したブロックの path として描いてよい字か。定義を読む時と、記法から読んだ図を読む時と、描く時に同じ決まりで確かめる (#3400) */
export const isUserPath = (value: string, max = PATH_MAX): boolean => value.length <= max && PATH_TEXT.test(value) && /^\s*[Mm]/u.test(value);

/** 色付きの絵柄の形 1 つ (#3633)。`color` で塗り、`rule` が `evenodd` なら偶奇の決まりで塗る。決まりと描き方は `blocks/icon/paint.ts` が持つ */
export interface UserPaint {
  color: string;
  rule?: "evenodd";
  path: string;
}

/** 足すブロックの定義 1 つ */
export interface UserBlock {
  /** `+` で始まる名前。記法では行の頭の語 (箱)、線の矢印の代わり (線)、`icon:` の値 (印) に書く */
  name: string;
  base: UserBase;
  /** 基本の形の名前。`path` と一緒には書けない */
  shape?: string;
  /** SVG の path の文法の字。箱は形を囲む最も小さい四角を箱の枠いっぱいに伸ばし (#3520)、印は (0, 0) を中心に 20 四方に描く */
  path?: string;
  /** 色の役の名前。色そのものは色味の表から読む */
  color?: Color;
  /** 箱の絵柄の枠に描く絵柄の名前 (#3489)。箱を元にしたブロックだけが持ち、箱の行に書いた `icon` が勝つ */
  icon?: string;
  /** 色付きの絵柄 (#3633) の、元の SVG の表示の枠 (`viewBox`) の左上と幅と高さ。印を元にしたブロックが `paints` と一緒に持つ */
  view?: [number, number, number, number];
  /** 色付きの絵柄の形の並び。書いた順に重ねて描く。`path` と一緒には書けない */
  paints?: UserPaint[];
}

/** 足すブロックの定義の並び。JSON の file と、原本の `define` の欄と、`parseNotation` と `renderDiagram` の引数 `blocks` の形 */
export interface UserBlocks {
  /** 定義の形の版 (`USER_BLOCKS_FORMAT`) */
  format: 1;
  blocks: UserBlock[];
}

export interface UserBlockError {
  line: number;
  column: number;
  message: string;
}

export type ReadBlocks = { ok: true; blocks: UserBlocks } | { ok: false; errors: UserBlockError[] };

/** 定義を読まずに図を読む時と描く時にも要る誤りの文。日英で持つ */
export interface UserBlockUseMessages {
  versionMissing: string;
  undefinedBlock: (name: string) => string;
  wrongBase: (name: string, base: UserBase, want: UserBase) => string;
  badPath: string;
}

const USE_MESSAGES: Readonly<Record<NotationLang, UserBlockUseMessages>> = {
  ja: {
    versionMissing: "ブロックの定義の前に、定義の形の版の行 (blocks 1) を書く",
    undefinedBlock: (name) => `${name} のブロックは定義されていない。図の頭の blocks 1 の後か、頁の link か、引数 blocks で定義する`,
    wrongBase: (name, base, want) => `${name} は ${base} を元にしたブロックで、${want} の所には書けない`,
    badPath: `path に書けるのは path の文法の字 (命令の字と数と区切り) だけで、${PATH_MAX} 字まで`,
  },
  en: {
    versionMissing: "Write the version line of the block definitions (blocks 1) before them",
    undefinedBlock: (name) => `The block ${name} is not defined. Define it after blocks 1 at the head of the diagram, in a page link, or in the blocks option`,
    wrongBase: (name, base, want) => `${name} is based on ${base} and cannot be written where a ${want} goes`,
    badPath: `A path takes only path syntax (commands, numbers and separators), up to ${PATH_MAX} characters`,
  },
};

export const userBlockUseMessages = (lang: NotationLang): UserBlockUseMessages => USE_MESSAGES[lang];

/** 定義の読み方の誤り。読む処理が行と列を付けて投げる */
export class UserBlockFailure extends Error {
  constructor(
    readonly line: number,
    readonly column: number,
    message: string,
  ) {
    super(message);
  }
}

/** `blocks <版>` の行か。版の字を返す */
export const versionLine = (source: SourceLine): string | undefined => {
  const m = /^blocks(?:\s+(.*))?$/u.exec(source.text);
  return m ? (m[1] ?? "").trim() : undefined;
};

/** 記法の字が、定義の並びの行 (`blocks <版>`) を持つか。軽い入口が、定義を読む処理を後から読むかを決める */
export const definesBlocks = (text: string): boolean => /^[ \t]*blocks(?:[ \t]|$)/mu.test(text);

/**
 * 足した箱のブロックの形を描いて測る処理 (#3520)。形を持つ箱は定義を読んだ図にしか無いので、定義を読む処理と一緒に後から読む (`blocks/box/fit.ts`)。
 * どれも名札 `id` の箱が形を持つ足した箱の時だけ値を返し、ほかの箱は `undefined` を返す。
 * 読む前に描いた足した箱は、今の箱の形で描き、中身を箱の真ん中に置き、番号を箱の四角の角に付ける
 */
export interface BoxShapes {
  /** 枠 `rect` に描く形の SVG の要素。地と縁と光の `cls` と、足す属性 `extra` を持つ */
  draw: (id: string, cls: string, extra: string, rect: Rect) => string | undefined;
  /** 枠 `rect` に描いた形の輪郭 */
  outline: (id: string, rect: Rect) => Point[][] | undefined;
  /** 箱の名前と下の字と絵柄の行が形の内に収まる箱の大きさ。幅は `w` から、高さは箱の高さから広げる */
  fit: (diagram: DiagramModel, id: string, w: number, withActions: boolean, rooms?: Map<string, SlotRoom>) => BoxFit | undefined;
  /** 枠 `rect` に描いた形の縁で、枠の左上の角に一番近い点 */
  corner: (id: string, rect: Rect) => Point | undefined;
}

/** 定義の並びを読む処理と書き戻す処理と、足した箱の形を測る処理と、色付きの絵柄を描く処理。最初に読む束を軽くするため別の file (`user-blocks-read.ts`) に置き、全部を持つ入口と軽い入口が登録する */
export interface UserBlockReader {
  readBlockLines: (lines: readonly SourceLine[], start: number, lang: NotationLang, known?: ReadonlySet<string>) => { blocks: UserBlock[]; next: number };
  shapes: BoxShapes;
  /** 定義の並びを記法の行に書き戻す処理。定義を持つ図にしか要らないので、最初に読む束に入れない (#3633) */
  print: (set: UserBlocks) => string;
  /** 名前 `name` の印のブロックの色付きの絵柄 (#3633) を描く処理 (`blocks/icon/paint.ts`)。`paint` の行を持たない定義と、描いてよい形でない定義は `undefined` を返す */
  paint: (name: string | undefined, x: number, y: number, scale: number) => string | undefined;
}

export { registerUserBlockReader, userBlockReader } from "./user-blocks-registry";

/** 共有のブロック集の定義。build が `packages/dragon/blocks/` の file を読んで入れる (`tsup.config.ts`) */
declare const __DRAGON_SHARED_BLOCKS__: readonly UserBlock[];

/** 共有のブロック集の定義を名前で引く表。build が集を読む時にもこの file を通るので、初めて引く時に作る */
let shared: ReadonlyMap<string, UserBlock> | undefined;
const sharedBlock = (name: string): UserBlock | undefined => (shared ??= new Map(__DRAGON_SHARED_BLOCKS__.map((b) => [b.name, b]))).get(name);

/** 読む間と描く間に有効な定義。名前から引く */
let active: Map<string, UserBlock> = new Map();
/** 読む間と描く間に、有効な定義に無く共有のブロック集から引いた定義。引いた順に持つ */
let usedShared: Map<string, UserBlock> = new Map();
/** 描く間に有効な、足した箱のブロックを持つ箱の名札と、足した線のブロックを持つ線 (`<段>:<出来事>`) */
let drawing: { boxes: Map<string, UserBlock>; edges: Map<string, UserBlock> } = { boxes: new Map(), edges: new Map() };

/**
 * 定義の並び `sets` を有効にして `run` を回し、終えたら前の定義に戻す。後ろの並びが同じ名前の定義を上書きする。
 * 読む処理と描く処理は同期で回るので、回している間だけ有効にすれば他の図に混ざらない
 */
export function withUserBlocks<T>(sets: readonly (UserBlocks | undefined)[], run: () => T): T {
  const before = active;
  const beforeDrawing = drawing;
  const beforeShared = usedShared;
  active = new Map(before);
  usedShared = new Map();
  for (const set of sets) for (const b of set?.blocks ?? []) active.set(b.name, b);
  try {
    return run();
  } finally {
    active = before;
    drawing = beforeDrawing;
    usedShared = beforeShared;
  }
}

/** 読んでいる間に、図の頭の定義を有効な定義に足す */
export function defineUserBlocks(blocks: readonly UserBlock[]): void {
  for (const b of blocks) active.set(b.name, b);
}

/** 有効な定義の名前 */
export const definedUserBlocks = (): ReadonlySet<string> => new Set(active.keys());

/**
 * 名前 `name` の有効な定義。有効な定義に無ければ共有のブロック集から引き、引いた定義を覚える (`sharedBlocksUsed`)。
 * `want` を渡すと、その元のブロックの定義だけを返す
 */
export function userBlock(name: string, want?: UserBase): UserBlock | undefined {
  let found = active.get(name);
  if (found === undefined) {
    found = sharedBlock(name);
    if (found !== undefined) usedShared.set(name, found);
  }
  return found !== undefined && (want === undefined || found.base === want) ? found : undefined;
}

/** 読んでいる間に共有のブロック集から引いた定義。読んだ図の `define` に入れ、原本だけを受け取った側でも同じ図を描けるようにする */
export const sharedBlocksUsed = (): UserBlock[] => [...usedShared.values()];

/** 描く間に、足した箱と線を名札と出来事の番号で引けるようにする */
export function drawUserBlocks(boxes: Map<string, UserBlock>, edges: Map<string, UserBlock>): void {
  drawing = { boxes, edges };
}

/** 描いている図で、名札 `id` の箱が足した箱のブロックなら、その定義 */
export const userBoxOf = (id: string): UserBlock | undefined => drawing.boxes.get(id);
/** 描いている図で、段 `step` の `event` 番目の線が足した線のブロックなら、その定義 */
export const userEdgeOf = (step: number, event: number): UserBlock | undefined => drawing.edges.get(`${step}:${event}`);
