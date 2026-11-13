/**
 * 回り続ける図の輪のブロックの数の決まり (#3657) と、時計の文字盤の見た目 (#3638) と輪を開いた帯の見た目 (#3639) の書ける値。
 * 長さの単位と書き方と目盛りの間隔は、列の図の階段の見た目 (#3640) の層の時間も同じ物を使う。
 * 後から読む読み方 (`read.ts` と `blocks/item/layers.ts`) と並べ方 (`kinds/cycle/layout.ts` と `kinds/lineup/layout.ts`) と原本の形の欠片だけが読む。
 * 定義 (`block.ts`) に置くと、本体と後から読む塊の両方が定義の file を読み、1行の入口で定義が最初に読む別の file に分かれ、最初に読む量が増える
 */
import type { NotationLang } from "../../words";

/** 輪に置ける手順の数 */
export const RING_STEPS = { least: 2, most: 8 } as const;

/** 図の種類の行の `shape` に書ける見た目。`clock` は手順を長さの弧で置く時計の文字盤、`band` は手順を左から右へ山形で並べる輪を開いた帯 */
export const CYCLE_SHAPES = ["clock", "band"] as const;

export type CycleShape = (typeof CYCLE_SHAPES)[number];

/** 図の種類の行の `turn` に書ける向き。`left` は文字盤を左回りにする。書かない図は右回り */
export const CYCLE_TURNS = ["left"] as const;

/** 手順の長さの単位と、1 単位を秒で数えた値。小さい単位から並べる */
export const TIME_UNITS = { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400 } as const;

export type TimeUnit = keyof typeof TIME_UNITS;

/** 手順の長さの書き方。数と単位の組で、数は小数を書ける */
const TIME = /^([0-9]+(?:\.[0-9]+)?)(ms|s|min|h|d)$/u;

/** 手順の長さ `text` の数と単位。数と単位の組でない長さと、`zero` を渡さない時の 0 は `undefined` */
export function timeOf(text: string, zero = false): { value: number; unit: TimeUnit } | undefined {
  const found = TIME.exec(text);
  const value = Number(found?.[1]);
  return found && (value > 0 || zero) ? { value, unit: found[2] as TimeUnit } : undefined;
}

/** 目盛りの数字と経った時間に添える単位の字 */
export const UNIT_WORDS: Readonly<Record<NotationLang, Readonly<Record<TimeUnit, string>>>> = {
  ja: { ms: "ミリ秒", s: "秒", min: "分", h: "時間", d: "日" },
  en: { ms: "ms", s: "s", min: "min", h: "h", d: "d" },
};

/** 長さ `span` を、0 から 6 個以下の数字で区切る一番細かい切りのよい間隔 (1、2、5 に 10 の累乗を掛けた数) */
export function niceStep(span: number): number {
  for (let e = Math.floor(Math.log10(span)) - 2; ; e++)
    for (const m of [1, 2, 5]) {
      const step = m * 10 ** e;
      if (Math.ceil(span / step - 1e-9) <= 6) return step;
    }
}

/**
 * 秒で数えた長さ `seconds` を、単位 `most` から `least` までの単位に分けて書いた字 (`1分3秒`、英語は `1min 3s`)。
 * 0 の単位は書かず、全ての単位が 0 の時は `least` の単位で 0 と書く。`least` の単位は小数を 1 桁まで書く
 */
export function elapsedText(seconds: number, most: TimeUnit, least: TimeUnit, lang: NotationLang): string {
  const order = Object.keys(TIME_UNITS) as TimeUnit[];
  const units = order.slice(order.indexOf(least), order.indexOf(most) + 1).reverse();
  let rest = seconds;
  const parts = units.flatMap((unit) => {
    const size = TIME_UNITS[unit];
    const count = unit === least ? Math.round((rest / size) * 10) / 10 : Math.floor(rest / size + 1e-9);
    rest -= count * size;
    return count > 0 ? [`${String(count)}${UNIT_WORDS[lang][unit]}`] : [];
  });
  return parts.length === 0 ? `0${UNIT_WORDS[lang][least]}` : parts.join(lang === "ja" ? "" : " ");
}
