/**
 * 回り続ける図の輪のブロックの数の決まり (#3657) と、時計の文字盤の見た目 (#3638) と輪を開いた帯の見た目 (#3639) の書ける値。後から読む読み方 (`read.ts`) と並べ方 (`kinds/cycle/layout.ts`) だけが読む。
 * 定義 (`block.ts`) に置くと、本体と後から読む塊の両方が定義の file を読み、1行の入口で定義が最初に読む別の file に分かれ、最初に読む量が増える
 */

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

/** 手順の長さ `text` の数と単位。0 か、数と単位の組でない長さは `undefined` */
export function timeOf(text: string): { value: number; unit: TimeUnit } | undefined {
  const found = TIME.exec(text);
  const value = Number(found?.[1]);
  return found && value > 0 ? { value, unit: found[2] as TimeUnit } : undefined;
}
