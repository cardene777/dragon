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
  /**
   * `trail` は状態遷移図の帯の最後の、通った状態の点 (#3171)。`r` は点の半径、`step` は点の中心どうしの間、`now` は変わった値の欄の名前の横の点の半径と、名前からの離れ
   */
  strip: { h: 72, line: 44, pad: 12, icon: 24, titleX: 44, fieldGap: 22, sepInset: 14, tagGap: 6, tagH: 15, tagPadX: 7, nameY: 22, valueY: 43, trail: { r: 5.4, step: 16 }, now: { r: 3, gap: 7 } },
  stroke: { slot: 1.2, hair: 1, edge: 1.7, edgeOn: 2.25, arrow: 1.5, flow: 1.3, halo: 7, on: 1.75, glyph: 2, lifeline: 1.2, envelope: 1.5, badgeRing: 1.5, path: 1.6, end: 1.6, done: 1.2, trail: 1.2 },
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
  mix: { slot: 45, icon: 14, regionIcon: 16, regionIconEdge: 34, cap: 12, capEdge: 42, badgePast: 14, badgePastEdge: 70, mini: 62, miniBand: 16, miniBandEdge: 36, view: 6, side: 4, sideEdge: 36, ghostEdge: 60, path: 55, past: 72 },
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
} as const;

/** 見せ方を決める字の大きさ。全体を枠に収めた時の箱の名前がこれを下回ると寄って追う。 */
export const READABLE_PX = 10.5;

/** 動きの緩急。 */
export const EASE = {
  inOut: "cubic-bezier(.65,0,.35,1)",
  out: "cubic-bezier(.22,1,.36,1)",
  pop: "cubic-bezier(.34,1.56,.64,1)",
} as const;
