/**
 * 目盛りと針のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `scale <単位> <長さ> <数> [from: <最初の番号>]` の行で時間軸に目盛りを並べ、
 * `period <名前> <目盛りの数> [from: <最初の番号>]` の行で区切りの境ごとに名前と番号を置く。目盛りは図に 1 つなので、付け方は図に付く。
 * 段の中の `now -> <目盛り>` の行で針をその目盛りの終わりまで進め、`span <範囲>: <字> [shape: box, color: <色>]` の行で範囲に括弧か囲みを出す。
 * 目盛りは 0 から数え、範囲は `0-31` か `0` と書く。目盛りの位置を読む下請け (`unitAt`、`rangeAt`) は、印の列と節目と拡大の帯のブロックも使う。
 * 針を進める行は線の行と同じ形なので、定義の `lines` (送る側が `now` の線) で名指し、読み方 (`read.ts`) の `take` が線より先に `readNow` で読む。時間軸の図では `now` を名札に使えない。
 * 原本の `blocks.period` の欄は、欄の鍵がブロックの名前から作られるので骨組み (`schemas/base.schema.json`) に残し、区切りの形をこのブロックが持つ。
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

export const NOW = "now";

/** `span` の行の `shape` に書ける形。書かなければ括弧 */
export const SPAN_SHAPES = ["box"] as const;

/** 時間軸の図の目盛りの長さに書ける単位 */
export const DURATION_UNITS = ["ms", "s", "min", "h", "d"] as const;

/** 時間軸の図の目盛り。`unit` の名前の目盛りを `length` の長さ (`12s` など) で `count` 個並べ、最初の目盛りの番号を `from` にする */
export interface TimeScale {
  unit: string;
  length: string;
  count: number;
  from?: number;
}

/** 時間軸の図の区切り。目盛り `length` 個ごとに `name` の区切りを置き、最初の区切りの番号を `from` にする */
export interface TimePeriod {
  name: string;
  length: number;
  from?: number;
}

/** 時間軸の図の、`from` から `to` の目盛りの括弧と字。`shape` が `box` なら印の列を囲み、字を縁の札にする */
export interface TimeSpanEvent {
  type: "span";
  from: number;
  to: number;
  text: string;
  shape?: "box";
  color?: Color;
}

export interface ScaleFieldMessages {
  /** 原本の目盛りの長さが、数と単位 (`units`) の組でない */
  duration: (units: readonly string[]) => string;
}

export const block: Block<ScaleFieldMessages> = {
  name: "scale",
  rank: 90,
  attach: { how: "attach-to-figure", only: "time" },
  words: { heads: ["scale", "period", "span"], headRanks: { span: 96 }, attrs: { scale: ["from"], period: ["from"], span: ["shape", "color"] } },
  // 時間軸の図の決まり (目盛りが要る、`now` を名札に使えない) を持ち、針を進める行 (`now -> <目盛り>`) は線と同じ形なので、行の形で読む
  always: true,
  fields: ["period"],
  lines: [{ edges: "any", from: NOW }],
  fieldMessages: {
    ja: { duration: (units) => `数と単位 (${units.join(" / ")}) の組で書く (12s など)` },
    en: { duration: (units) => `Write a number and a unit (${units.join(" / ")}), such as 12s` },
  },
};
