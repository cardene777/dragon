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
  sequence: { columnGap: 40, labelRoom: 16, firstRow: 22, rowGap: 14, stepGap: 8, minPitch: 40, tail: 18, selfW: 34, selfH: 18 },
  edge: { inset: 3, arrow: 6, arrowHalf: 3.5, parallel: 5, ghostDash: 5, flowDash: 9 },
  label: { h: 20, padX: 9, radius: 10, offset: 22, side: 14, search: 4, searchMax: 400, soft: 6 },
  action: { h: 22, padX: 10, radius: 11 },
  badge: { r: 9.5, ring: 9, inset: 4, along: 14, short: 44 },
  carrier: { envW: 24, envH: 17, coinR: 6.5, coinIn: 3.8, tagH: 18, tagPadX: 8, samples: 16 },
  strip: { h: 72, line: 44, pad: 12, icon: 24, titleX: 44, fieldGap: 22, sepInset: 14, tagGap: 6, tagH: 15, tagPadX: 7, nameY: 22, valueY: 43 },
  stroke: { hair: 1, edge: 1.7, edgeOn: 2.25, arrow: 1.5, flow: 1.3, halo: 7, on: 1.75, glyph: 2, lifeline: 1.2, envelope: 1.5, badgeRing: 1.5 },
  shadow: { near: 0.8, far: 4, nearY: 1, farY: 3 },
  mini: { w: 168, pad: 8, title: 14, inset: 12, radius: 10 },
  /**
   * 寄って追う見せ方の窓の高さの、幅に対する割合と下限。
   * `fitMinH` は見える高さに収める時 (#3047) の窓の高さの下限で、これより低い枠では収めずに枠の中で送る。
   * `narrow` は縦長の全体図を出す枠の幅の下限で、これより狭い枠 (携帯の幅) では全体図を出さずに窓へ幅を渡す (#3055)
   */
  follow: { aspect: 0.75, minH: 320, fitMinH: 160, ease: 0.6, narrow: 440 },
  /** 色を混ぜる割合 (%) */
  mix: { icon: 14, regionIcon: 16, regionIconEdge: 34, cap: 12, capEdge: 42, badgePast: 14, badgePastEdge: 70, mini: 62, miniBand: 16, miniBandEdge: 36, view: 6 },
  /** 字の並びの基準線を、置きたい高さの真ん中からどれだけ下げるか */
  baseline: { label: 3.8, badge: 3.5, carrier: 3.7, stripTitle: 4.5, tag: 3.6, action: 3.8 },
  /** 浮いて出る物が下から上がる長さと、弾んで出る物の始まりの大きさ */
  rise: 5,
  popFrom: 0.4,
  /** 動きを嫌わない人の頁の部品 */
  player: { gap: 10, radius: 12, button: 36, hidden: 1, focus: 2 },
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
} as const;

/** 見せ方を決める字の大きさ。全体を枠に収めた時の箱の名前がこれを下回ると寄って追う。 */
export const READABLE_PX = 10.5;

/** 動きの緩急。 */
export const EASE = {
  inOut: "cubic-bezier(.65,0,.35,1)",
  out: "cubic-bezier(.22,1,.36,1)",
  pop: "cubic-bezier(.34,1.56,.64,1)",
} as const;
