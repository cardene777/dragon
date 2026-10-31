/**
 * 図の見た目の値の表。色、字の大きさ、余白、動きの長さをここに 1 つにまとめる。
 *
 * 描く file (`layout/`、`render/`、`timeline.ts`、`view.ts`、`player.ts`) は色の値と字の大きさを
 * 直接書かず、この表から読む。値は見本帳 (`docs/design/base/`) の部品と同じにしてある。
 * 色味の値は見本帳の `palettes.json` の写しで、色味ごとに明るい背景と暗い背景で別の値を持つ。
 */
import palettes from "./palettes.json";
import { FONTS, type Family } from "./fonts";

export type Theme = "light" | "dark";

export interface Palette {
  id: string;
  name: string;
  note: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** 色味を指定しない時と、知らない名前を渡した時に使う色味。 */
export const DEFAULT_PALETTE = "paper";

export const PALETTES: Readonly<Record<string, Palette>> = Object.fromEntries(
  Object.entries(palettes as Record<string, Omit<Palette, "id">>).map(([id, p]) => [id, { id, ...p }]),
);

/** 名前から色味を引く。指定が無いか、知らない名前 (外した墨と朱の `ink` を含む) なら紙と墨。 */
export function resolvePalette(id?: string): Palette {
  const found = id !== undefined && Object.hasOwn(PALETTES, id) ? PALETTES[id] : undefined;
  return found ?? (PALETTES[DEFAULT_PALETTE] as Palette);
}

/**
 * 色味が持つ色の変数の名前 (#3198)。呼ぶ側が `colors` で値を渡せる鍵。
 * 外へ出す型を `palettes.json` から作ると、束ねた型の file に JSON の中身が初期値付きで写り、型の検査を通らなくなるため、名前を並べて作る。
 * 並びが `palettes.json` の明るい背景の名前と食い違うと、下の 2 つの `_` で始まる型が、余る名前か足りない名前を挙げて型の検査で落ちる
 */
const COLOR_NAMES = ["page", "bg", "surf", "sunk", "ink", "ink2", "mute", "hair", "line", "sh", "on-c", "c-blue", "t-blue", "c-amber", "t-amber", "c-green", "t-green", "c-violet", "t-violet", "c-rose", "t-rose", "c-slate", "t-slate", "coin", "coint", "coinin", "tint", "edge", "shA", "shB", "carry"] as const;
export type ColorName = (typeof COLOR_NAMES)[number];
type Never<T extends never> = T;
type PaletteColor = keyof (typeof palettes)[typeof DEFAULT_PALETTE]["light"];
type _NotInPalette = Never<Exclude<ColorName, PaletteColor>>;
type _NotListed = Never<Exclude<PaletteColor, ColorName>>;

/** 名前で選んだ色味に重ねる色の値。渡さない色は色味の値のまま残る (#3198) */
export type Colors = Partial<Record<ColorName, string>>;

const COLOR_NAME_SET: ReadonlySet<string> = new Set(COLOR_NAMES);

/** 色味が持つ色の変数の名前か。 */
export const isColorName = (name: string): name is ColorName => COLOR_NAME_SET.has(name);

/**
 * 色の値として読めるか。値は CSS の変数として SVG の style と頁の要素の style にそのまま入るので、
 * 宣言と要素から抜け出す字 (`;`、`{`、`}`、`"`、`'`、`<`、`>`、`&`、`\`、`:` など) を持たない字の並びで、
 * 括弧が閉じていて (閉じない括弧は後ろの宣言を呑む)、外の file を読む `url(` を持たない値だけを通す
 */
export function isColorValue(value: unknown): value is string {
  if (typeof value !== "string" || !/^[\w\s#%.,()/+-]+$/u.test(value) || /url\(/iu.test(value)) return false;
  let depth = 0;
  for (const char of value) {
    depth += char === "(" ? 1 : char === ")" ? -1 : 0;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/** 色味の値を CSS の変数として並べる。 */
export function paletteVars(palette: Palette, theme: Theme): string {
  return Object.entries(palette[theme])
    .map(([key, value]) => `--${key}:${value}`)
    .join(";");
}

/** 字の変数。同梱した 2 つの字を 1 度だけ名指し、字を使う所はどれもこの変数を読む。 */
export const FONT_VARS = `--sans:"${FONTS.sans}";--mono:"${FONTS.mono}"`;

/** 区画や箱を分ける色の役。灰 (slate) と硬貨 (coin) は分類の色として順に配らない。 */
export const COLOR_ORDER = ["blue", "amber", "green", "violet", "rose"] as const;
export type ColorKey = (typeof COLOR_ORDER)[number] | "slate" | "coin";

export interface TextStyle {
  size: number;
  weight: number;
  family: Family;
}

const text = (size: number, weight: number, family: Family = "sans"): TextStyle => ({ size, weight, family });

/** 字の大きさと太さ。どれも 10.5 以上にする。 */
export const TYPE = {
  boxName: text(13, 650),
  boxSub: text(11, 500),
  boxSubStrong: text(11, 700),
  regionName: text(12.5, 700),
  regionNote: text(11, 500),
  label: text(11, 600, "mono"),
  labelJa: text(11, 650),
  action: text(11, 650),
  badge: text(10.5, 700, "mono"),
  carrier: text(10.5, 700, "mono"),
  carrierJa: text(10.5, 700),
  stripTitle: text(12.5, 700),
  fieldName: text(10.5, 600),
  fieldValue: text(12, 600, "mono"),
  fieldValueJa: text(12, 600),
  tag: text(10.5, 700),
  miniTitle: text(10.5, 700),
  stepTitle: text(15, 700),
  stepBody: text(13.5, 500),
  stepNo: text(13, 700, "mono"),
  button: text(14, 700),
  /** 枝分かれの図 (#3164) の、丸の中の commit の名札と、丸の外に添える hash と一言 */
  gitId: text(11, 700),
  gitHash: text(10.5, 600, "mono"),
  gitNote: text(10.5, 650),
  /**
   * 木の図 (#3233) の、箱の中の値 (hash) と名札、根の箱の値と名札、葉の下の札の字。
   * 値を持たない箱の名札は箱の名前 (`boxName`) の字で描く
   */
  treeHash: text(13.5, 700, "mono"),
  treeName: text(10.5, 600),
  rootHash: text(15, 700, "mono"),
  rootName: text(11, 700),
  treeCard: text(11.5, 650),
  /** 列の図 (#3239) の、チップの字と札の字 */
  chip: text(10.5, 700, "mono"),
  stamp: text(11, 700),
  /**
   * 時間軸の図 (#3165)。拡大の帯の列の上の字、印の列の名前、時刻の字、区切りの名前と目盛りの番号の範囲、
   * 節目の名札と状態、範囲の括弧の字、空きの枠の字、物差しの線の字。和文を含む字は同じ大きさと太さの和文の字で描く
   */
  timeHead: text(11, 650, "mono"),
  timeRow: text(11, 600),
  timeTick: text(10.5, 600, "mono"),
  timePeriod: text(11.5, 650),
  timeRange: text(10.5, 500, "mono"),
  pointName: text(11, 700, "mono"),
  pointState: text(11.5, 700),
  spanText: text(11, 650),
  emptyText: text(11, 700),
  meterLine: text(10.5, 700, "mono"),
} as const;

/** 置き場所と部品の大きさ。単位は図の座標 (字が原寸の時の px)。 */
export const LOOK = {
  /** 部品どうしの最小の隙間 */
  gap: 10,
  /** 図の外周の余白 */
  margin: 14,
  box: { h: 72, minW: 92, padX: 12, radius: 12, icon: 24, iconRadius: 7, iconY: -16, iconScale: 0.74, nameY: 12, subY: 27 },
  region: { pad: 18, gap: 10, radius: 14, inset: 14, icon: 24, iconRadius: 7, iconScale: 0.68, nameY: 58, line: 16, minH: 108 },
  architecture: { columns: 4, columnGap: 56, maxColumnGap: 160, rowGap: 44, labelRoom: 16 },
  /**
   * 時系列図。線の名前の札は、構成図と状態遷移図より線に寄せる (`labelOffset` は線から札の真ん中まで)。
   * 札と線の離れが図の他の空きと同じ 6 になり、行を詰めても札がどの線の名前かが分かる (#3177)。
   */
  sequence: { columnGap: 40, labelRoom: 16, labelOffset: 16, firstRow: 10, rowGap: 6, stepGap: 6, minPitch: 32, tail: 10, selfW: 34, selfH: 18 },
  /**
   * 状態遷移図 (#3163)。状態は `columns` つずつ並べて次の段へ折り返し、段の間 (`rowGap`) の真ん中を、段をまたぐ線が通る。
   * `start` と `end` は始まりと終わりの印の半径と、印の中の丸の半径。`drop` は最初の状態の上端から始まりの印の中心まで、
   * `below` は状態の下端から終わりの印の中心まで、`beside` は状態の右端から右に置く終わりの印の中心まで、`text` は印の中心から字の左端まで。
   * `loop` は同じ状態へ戻る輪の幅と深さ。`side` は脇道の囲みの内側の余白、1 段目の上端との間、脇道へ入る線が横に通る所の囲みの下端からの離れ、
   * 点線の線が箱へ入る所を箱の端から離す幅。
   * `ghost` は脇道の点線の札で、絵柄を左に、名前と下の字を右に並べる (#3171)。`h` は札の高さ、`pad` は左右の余白、`gap` は絵柄と字の間、
   * `nameY` と `subY` は札の真ん中から名前と下の字の基準線まで。
   * `done` は出た状態の右上の済んだ印の半径と、箱の右上の角からの離れ。
   * `loop` の `samples` は同じ状態へ戻る弧を区切る点の数、`badgeAt` は弧の段の番号を弧の上端から深さのどこに置くかの割合。
   * `pastLabel` は段が終わった後に薄く残す線の名前の濃さ (#3171)
   */
  state: {
    columns: 4,
    columnGap: 64,
    rowGap: 108,
    labelRoom: 16,
    start: 7,
    end: { r: 9, inner: 5 },
    drop: 56,
    below: 64,
    beside: 38,
    text: 16,
    loop: { w: 24, h: 34, samples: 12, badgeAt: 0.6 },
    side: { pad: 16, gap: 76, lane: 30, entry: 28 },
    ghost: { h: 52, pad: 12, gap: 10, nameY: -2, subY: 14 },
    done: { r: 6.5, inset: 13 },
    pastLabel: 0.85,
  },
  /**
   * 枝分かれの図 (#3164)。見本帳の試作 (`scenes/git.js`) の寸法を写す。
   * commit は列ごとに `pitch` ずつ右へ並べ、一番上でない帯の commit は列の半分だけ右へずらす。`x0` は最初の列の真ん中の x の下限、
   * `textGap` は隣の列の hash と一言の間に空ける最小の隙間。`r` は丸の半径、`orphan` はどの札からも辿れなくなった commit の点線の丸の半径。
   * `topLine` と `line` は帯の上端から丸を並べる線まで (一番上の帯と、それより下の帯)、`topBelow` と `below` は線から帯の下端まで。
   * `bare` は線の名前を下に置かない帯の、線から帯の下端まで。
   * hash と一言は一番上の帯では丸の上に、ほかの帯では丸の下に置き、`above` と `under` は丸の真ん中から丸に近い行の基準線まで、`lineStep` は行の間。
   * 札は丸の上に段を重ねて置き、`tagTop` と `tag` は丸の真ん中から 1 段目の札の真ん中まで (一番上の帯と、ほかの帯)、`row` は札の段の間。
   * 札の段が 2 段より多い commit がある帯は、多い段の分だけ線を下げる。
   * `turn` は枝へ分かれる線と枝から入る線が曲がり終えて横へ進むまでの長さ、`samples` は曲がりを区切る点の数、`boxGap` は commit の並びと箱の間。
   * `labelUnder` はほかの帯で、丸の真ん中から線の名前の札の上端まで。`colors` は帯の色を上から配る順
   */
  git: {
    x0: 120,
    pitch: 90,
    textGap: 12,
    r: 12,
    orphan: 13.5,
    topLine: 120,
    line: 90,
    topBelow: 30,
    below: 82,
    bare: 62,
    above: 18,
    under: 27,
    lineStep: 13,
    tagTop: 58,
    tag: 30,
    row: 22,
    turn: 60,
    samples: 12,
    boxGap: 24,
    labelUnder: 50,
    colors: ["blue", "violet", "green", "amber", "rose"],
  },
  /**
   * 木の図 (#3233)。step 2 で本人が選んだ「根を上」の試作 (`.context/propose/merkle-look/`) の寸法を写す。
   * 木の箱は幅の下限 `w`、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`。根の箱は `root` の幅の下限と高さと角の丸みを持ち、
   * 左に絵柄を置いて (`iconX` は箱の左端から絵柄の左端まで)、`textX` から字を左に揃えて並べ、右に `padR` を空ける。
   * `nameY` と `hashY` は根の箱の真ん中から名札と値の基準線まで。ほかの箱の値と名札は `hashY` と `nameY`、1 行の字は `oneY` に置く。
   * 葉は書いた順に横に並べ、隣の葉の箱の間を `slotGap` 空ける。根の上端は図の上の余白から `top` 下げ、深さの段の真ん中どうしは `row` 離す。
   * `card` は値を持つ葉の下の名札の札で、葉の真ん中から札の真ん中まで `drop`、高さ `h`、幅の下限 `minW`、
   * 字の左右の余白 `padX`、絵柄の幅 `icon` と絵柄と字の間 `gap`、絵柄の縮み `glyph`、角の丸み `radius`。
   * `boxGap` は木と木でない箱の列の間、`badgeAlong` は木の線を走る段の番号を、曲がり角から横の線に沿って進める長さ。
   * `faint` は木の線を運ぶ物が通った段から後に、運ぶ物を送りも受けもしていない木の箱を薄く出す濃さ。`color` と `rootColor` は木の箱と根の箱の色
   */
  tree: {
    w: 74,
    h: 44,
    padX: 10,
    radius: 10,
    root: { w: 112, h: 54, radius: 13, iconX: 10, textX: 46, padR: 14, nameY: -4, hashY: 14 },
    hashY: -1,
    nameY: 14,
    oneY: 4.5,
    slotGap: 12,
    top: 16,
    row: 102,
    card: { drop: 78, h: 30, minW: 70, padX: 10, icon: 12, gap: 6, glyph: 0.62, radius: 9 },
    boxGap: 24,
    badgeAlong: 22,
    faint: 0.42,
    color: "violet",
    rootColor: "green",
  },
  /**
   * 列の図 (#3239)。step 2 で本人が選んだ見本の「列の図」の形で、1 列 12 枚の図の幅が携帯の幅で全体を見せられる 400 に収まる寸法にする。
   * 列は左右の余白 `padX`、高さ `h`、角の丸み `radius`。列の名前と右上の字の基準線は列の上端から `textY`、チップの上端は列の上端から `trackY`、
   * 名前と右上の字の間の下限は `textGap`、選ばなかった列の濃さは `faint`。
   * `chip` はチップの幅の下限 `w`、高さ `h`、隣のチップとの間 `gap`、角の丸み `radius`、字の左右の余白 `padX`。字が幅を超える図は全てのチップの幅を広げる。
   * `seal` は封で、チップの並びの外へ `over` 広げ、角の丸み `radius`、縞の幅 `stripe`。
   * `stamp` は札で、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`、傾き `tilt`、色 `color`
   */
  lineup: {
    padX: 12,
    h: 61,
    radius: 10,
    textY: 20,
    trackY: 33,
    textGap: 10,
    faint: 0.35,
    chip: { w: 25, h: 18, gap: 4, radius: 4, padX: 3 },
    seal: { over: 3, radius: 5, stripe: 7 },
    stamp: { h: 22, padX: 8, radius: 5, tilt: -4, color: "green" },
  },
  /**
   * 時間軸の図 (#3165)。見本帳の試作 (`scenes/finality.js`) の寸法を写す。
   * 図の幅は `width` で、時間軸は左の `axisX` から右の余白 `right` の手前まで。印の列の名前が長い時は、名前の右に `gutterGap` を空けて軸を右へ寄せる。
   * 拡大の帯は列ごとに、上端から `head` に列の上の字の基準線を、`boxTop` に最初の箱の上端を置き、箱を `boxGap` ずつ空けて縦に並べ、
   * 最後の箱の下に `zoomBottom` を空ける。`sep` は列の区切りの点線を帯の上下から縮める長さ、`zoomGap` は拡大の帯と時間軸の帯の間。
   * 時間軸の帯は、上端から `rowsTop` に最初の印の列を置き、列の高さ `row` と間 `rowGap` で並べる。
   * 印の幅は目盛りの幅の `markRatio` で、`markMin` と `markMax` の間に収める。`shade` は区切りの地を印の列の上下へ広げる長さ、
   * `frame` は拡大した目盛りを囲む枠を印の外へ広げる長さ、`emptyR` は空きの印の点の半径。
   * `point` は節目で、印の下端から丸の真ん中まで `drop`、丸の半径 `r`、丸の真ん中から字の左端まで `text`、名札と状態の基準線の高さ `nameY` と `stateY`。
   * 節目どうしの線は名札の右から `link` 空けて引き始め、次の丸の手前 `end` で止める。`room` は線の名前を下に置く時に丸の下に空ける高さ、`plain` は置かない時。
   * `bracket` は範囲の括弧で、上の物から `gap` 空けて置き、`tick` は括弧の足の長さ、`text` は足の先から字の基準線まで、`lane` は括弧を重ねる時の間。
   * `box` は範囲の囲みで、`pad` は印の列の外へ広げる長さ、`tagX` は左端から縁の札まで、`tagH` と `tagPadX` は札の高さと字の左右の余白。
   * `axisGap` は上の物から時刻の目盛りの線まで、`major` と `minor` は目盛りの線の長さ、`minorPx` は細かい目盛りの間の下限、
   * `tickY` は目盛りの線から時刻の字の基準線まで、`rangeY` は区切りの名前の基準線から目盛りの番号の範囲の基準線まで、`nameGap` は時刻の字と区切りの名前の間の下限、
   * `ticks` は区切りの無い図の時刻の字の数の上限、`bottom` は時刻の字の下の余白。
   * `needle` は針で、印の列の上下へ `over` だけ伸ばし、`head` は上の三角の高さ、`dot` は目盛りの線の上の点の半径。
   * `meter` は中身の帯の物差しで、幅 `w`、高さ `h`、欄の上端から棒の上端まで `y`、線の印を棒の上下へ伸ばす長さ `mark`、欄の上端から線の字の基準線まで `textY`。色は `color`
   */
  time: {
    width: 728,
    axisX: 118,
    right: 16,
    gutterGap: 12,
    head: 22,
    boxTop: 34,
    boxGap: 36,
    zoomBottom: 14,
    sep: 12,
    zoomGap: 12,
    rowsTop: 24,
    row: 20,
    rowGap: 6,
    markRatio: 0.5,
    markMin: 1.5,
    markMax: 18,
    markRadius: 1.5,
    shade: 8,
    frame: 2.5,
    emptyR: 1.7,
    point: { drop: 40, r: 9, text: 15, nameY: -2, stateY: 12, link: 10, end: 6, room: 30, plain: 12, glyph: 0.62 },
    bracket: { gap: 12, tick: 6, text: 16, lane: 34 },
    box: { pad: 6, tagX: 12, tagH: 16, tagPadX: 7 },
    axisGap: 18,
    major: 12,
    minor: 6,
    minorPx: 40,
    tickY: 18,
    rangeY: 14,
    nameGap: 8,
    ticks: 6,
    bottom: 12,
    needle: { over: 8, head: 6, dot: 3.5 },
    meter: { w: 150, h: 6, y: 36, mark: 5, textY: 59, color: "amber" },
  },
  /** `bend` は線の曲がりを丸める半径 (#3171) */
  edge: { inset: 3, arrow: 6, arrowHalf: 3.5, parallel: 5, ghostDash: 5, flowDash: 9, bend: 12 },
  /** `touch` は線の名前と、同じ時刻に見えている段の番号の丸の間に空ける最小の隙間 (#3175) */
  label: { h: 20, padX: 9, radius: 10, offset: 22, side: 14, search: 4, searchMax: 400, soft: 6, touch: 2 },
  action: { h: 22, padX: 10, radius: 11 },
  badge: { r: 9.5, ring: 9, inset: 4, along: 14, short: 44 },
  carrier: { envW: 24, envH: 17, coinR: 6.5, coinIn: 3.8, tagH: 18, tagPadX: 8, samples: 16 },
  /**
   * 運ぶ物の置き場 (#3176)。運ぶ物を出し入れする箱は、絵柄の右に点線の枠を持ち、運ぶ物は着いた後と走り出す前にそこで待つ。
   * `gap` は絵柄と枠の間、`pad` は枠と運ぶ物の間、`spread` は枠の中に横に並べた運ぶ物の間、`h` と `radius` は枠の高さと角の丸み。
   * `clear` は状態遷移図の右上の済んだ印と枠の間に空ける最小の隙間。`lifeline` は時系列図で生存線と運ぶ物の間、
   * `mark` は状態遷移図の始まりの印と、その左で走り出しを待つ運ぶ物の間
   */
  slot: { gap: 6, pad: 3, spread: 4, h: 24, radius: 7, clear: 2, lifeline: 5, mark: 4 },
  /** 編集画面が重なる字を囲む点線の四角 (#3178)。`pad` は字の四角の外へ広げる幅、`dash` と `gap` は点線の線と隙間の長さ */
  mark: { pad: 3, radius: 5, dash: 4, gap: 3 },
  /**
   * `trail` は状態遷移図の帯の最後の、通った状態の点 (#3171)。`r` は点の半径、`step` は点の中心どうしの間、`now` は変わった値の欄の名前の横の点の半径と、名前からの離れ
   */
  strip: { h: 72, line: 44, titleRow: 40, pad: 12, icon: 24, titleX: 44, fieldGap: 22, sepInset: 14, tagGap: 6, tagH: 15, tagPadX: 7, nameY: 22, valueY: 43, trail: { r: 5.4, step: 16 }, now: { r: 3, gap: 7 } },
  /** `time` から始まる値は時間軸の図 (#3165) の、目盛りの印の枠、拡大の枠、時刻の線、範囲の括弧と囲み、節目へ下ろす点線、節目の丸、針、物差しの線の印 */
  stroke: {
    git: 2.25,
    gitOrphan: 1.5,
    mark: 1.6,
    slot: 1.2,
    hair: 1,
    edge: 1.7,
    edgeOn: 2.25,
    arrow: 1.5,
    flow: 1.3,
    halo: 7,
    on: 1.75,
    glyph: 2,
    lifeline: 1.2,
    envelope: 1.5,
    badgeRing: 1.5,
    path: 1.6,
    end: 1.6,
    done: 1.2,
    trail: 1.2,
    timeSlot: 0.6,
    timeFrame: 1.25,
    timeAxis: 1,
    timeSpan: 1.5,
    timeDrop: 1.4,
    timePoint: 1.75,
    timeFlag: 1.8,
    timeNeedle: 1.25,
    timeMeter: 1.25,
    tree: 1.5,
    treeTrail: 2.6,
    treeCon: 1.3,
    stamp: 2,
  },
  shadow: { near: 0.8, far: 4, nearY: 1, farY: 3 },
  mini: { w: 168, pad: 8, title: 14, inset: 12, radius: 10 },
  /**
   * 寄って追う見せ方の窓の高さの、幅に対する割合と下限。
   * `fitMinH` は見える高さに収める時 (#3047) の窓の高さの下限で、これより低い枠では収めずに枠の中で送る。
   * `narrow` は縦長の全体図を出す枠の幅の下限で、これより狭い枠 (携帯の幅) では全体図を出さずに窓へ幅を渡す (#3055)。
   * `badgeRoom` は番号の丸が窓から外れる段で窓を寄せ直す時に、丸の周りに空ける幅 (#3046)。
   * `headRoom` は時系列図の図の頭の箱の下端から、窓に線を見せ始める所までの幅 (#3118)。
   * `head` は時系列図の窓の上端に貼る頭の列の頭の箱で、アイコンを外した名前と下の字の 2 段 (#3120)。
   * `pad` は頭の列の上下の余白、`h` は箱の高さ、`nameY` と `subY` は箱の上端から名前と下の字の基準線まで
   */
  follow: { aspect: 0.75, minH: 320, fitMinH: 160, ease: 0.6, narrow: 440, badgeRoom: 8, headRoom: 10, head: { pad: 8, h: 40, nameY: 17, subY: 31 } },
  /** 色を混ぜる割合 (%) */
  /** `time` から始まる値は時間軸の図 (#3165) の、区切りの地、範囲の囲みの地、空きの枠の地、拡大の点線の濃さ。`chip` と `seal` から始まる値は列の図 (#3239) の、色を持たないチップの地と封の縞の濃さ */
  mix: { slot: 45, icon: 14, regionIcon: 16, regionIconEdge: 34, cap: 12, capEdge: 42, badgePast: 14, badgePastEdge: 70, mini: 62, miniBand: 16, miniBandEdge: 36, view: 6, side: 4, sideEdge: 36, ghostEdge: 60, path: 55, past: 72, timeShade: 3.5, timeSpan: 6, timeEmpty: 8, timeGuide: 50, chipPlain: 34, sealDark: 60, sealLight: 34 },
  /** 字の並びの基準線を、置きたい高さの真ん中からどれだけ下げるか */
  baseline: { label: 3.8, badge: 3.5, carrier: 3.7, stripTitle: 4.5, tag: 3.6, action: 3.8, mark: 4 },
  /** 浮いて出る物が下から上がる長さと、弾んで出る物の始まりの大きさ */
  rise: 5,
  popFrom: 0.4,
  /**
   * 動きを嫌わない人の頁の部品。
   * `narrow` は段の本文の帯を横 1 列に並べる帯の中身の幅の下限で、これより狭い帯 (携帯の幅) では題と本文を釦と番号の段の下に置く (#3057、#3069)。
   * `touch` はその狭い帯で段を送る釦の縦横で、指で押せる大きさにする (#3069)
   */
  player: { gap: 10, radius: 12, button: 36, touch: 44, hidden: 1, focus: 2, narrow: 440 },
} as const;

/** 動きの長さ (秒)。 */
export const MOTION = {
  /** 最初の段の前に全体を見せる長さ */
  intro: 1.4,
  /** 最後の段の後に全体を見せる長さ */
  outro: 4.6,
  /** 繰り返す前に消えていく長さ */
  tail: 0.6,
  /** 段の長さ。本文の字数で伸ばし、段で起きることが全部見えてから dwell 秒は留める */
  stepBase: 1.2,
  perChar: 0.025,
  stepMin: 2.2,
  stepMax: 5,
  dwell: 1.2,
  /** 段の中で最初の線を引き始めるまでと、続く線を引き始める間 */
  edgeAt: 0.1,
  stagger: 0.5,
  /** 線を引く長さ。運ぶ物を載せた線は運ぶ物が走るので長い */
  draw: 0.55,
  drawCarry: 0.9,
  /** 処理を読む間 (次の線と書き換えはこれだけ待つ) と、書き換えが続く間 */
  action: 0.9,
  change: 0.12,
  /** 箱の下の字が見えている短さの下限。これより早く次の字に替わる字は出さない */
  minShow: 0.8,
  /** 線の名前が線より遅れて出る長さと、出入りの長さ */
  labelDelay: 0.15,
  fade: 0.3,
  popFade: 0.4,
  untilFade: 0.2,
  /** 段の止め絵を撮る時刻を、段の終わりからどれだけ前にするか */
  still: 0.45,
  /** 状態遷移図で、札が状態を出てから済んだ印が出るまで */
  done: 0.3,
  /**
   * 時間軸の図 (#3165) の針。目盛り 1 つを進む長さは、軸の端から端までを `axis` 秒で進む長さを `unitMin` と `unitMax` の間に収めた値で、どの段でも同じ。
   * 拡大した目盛りでは、その段のその列の線を引き終えてから `wait` 秒待って次の目盛りへ進む。
   * `after` は針が止まってから次の出来事を起こすまで、`reset` は区切りが替わって物差しが 0 に戻る長さ
   */
  time: { axis: 11.5, unitMin: 0.12, unitMax: 0.4, wait: 0.15, after: 0.15, reset: 0.05 },
  /**
   * 列の図 (#3239)。`slide` はチップが滑る長さ、`seal` は封が列を覆う長さ、`stagger` は同じ段の出来事を起こす間、
   * `cut` はチップと封が一瞬で入れ替わる長さ
   */
  lineup: { slide: 0.7, seal: 0.6, stagger: 0.2, cut: 0.01 },
} as const;

/** 見せ方を決める字の大きさ。全体を枠に収めた時の箱の名前がこれを下回ると寄って追う。 */
export const READABLE_PX = 10.5;

/** 動きの緩急。 */
export const EASE = {
  inOut: "cubic-bezier(.65,0,.35,1)",
  out: "cubic-bezier(.22,1,.36,1)",
  pop: "cubic-bezier(.34,1.56,.64,1)",
} as const;
