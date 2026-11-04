/**
 * 拡大の帯のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `zoom <目盛り>-<目盛り>` の行で、上の帯にその範囲の目盛りを列にして並べ、
 * 宣言した箱を列ごとに繰り返す。帯は図に 1 つなので、付け方は図に付く。
 * 箱どうしの線は `[at: <目盛り>]` で帯の列を選び、受ける箱を別の列から選ぶ時は `[into: <目盛り>]` を足す。線の列を読む処理 (`readColumns`) は、
 * 線のブロックが線の行を読む時に parser の口 (`columns`) を通して呼ぶ。節目どうしの線は軸の上に引くので列を持たない。
 * 時間軸の図の箱を宣言したのに帯が無い誤りは、最初の段を始める時に parser が確かめ、その文をこのブロックが持つ。
 */
import { type Attr, fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { range, rangeAt, unitAt } from "../scale/block";

/** 線の属性のうち、時間軸の図だけが書ける鍵 */
export const TIME_EDGE_ATTRS = ["at", "into"] as const;

/** 時間軸の図の宣言の行 `zoom <範囲>` */
const ZOOM = /^zoom\s+(\S+)\s*$/du;

export interface ZoomMessages {
  zoomShape: string;
  /** 拡大の帯の外の列 */
  outOfZoom: (from: number, to: number) => string;
  noZoom: string;
  /** 時間軸の図の箱を宣言したのに、拡大の帯 (`zoom`) が無い */
  boxNeedsZoom: string;
  boxLineNeedsAt: string;
  pointLineNoAt: string;
  mixedLine: string;
}

/** `zoom <目盛り>-<目盛り>` の行。範囲は目盛りの数が決まってから確かめる */
function readZoom(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const time = state.figure.time;
  state.beforeSteps(source);
  if (time.zoom) throw fail(source, 0, m.timeTwice("zoom"));
  const found = ZOOM.exec(source.text);
  const span = found?.[1];
  if (!found || span === undefined) throw fail(source, 0, m.zoomShape);
  const rangeStart = found.indices?.[1]?.[0] ?? 0;
  const placed = { from: 0, to: 0 };
  time.zoom = placed;
  time.pending.push(() => {
    Object.assign(placed, rangeAt(source, rangeStart, span, state));
  });
}

/**
 * 線の列 (`at` と `into`)。時間軸の図の箱どうしの線は `at` で拡大の帯の列を選び、節目どうしの線は列を持たない。
 * ほかの図の種類には書けない。`end` は線の名前の後ろの位置で、書くべき列が無い時に誤りの位置として示す
 */
export function readColumns(source: SourceLine, from: string, to: string, attrs: Map<string, Attr>, end: number, state: ParseState): { at?: number; into?: number } {
  const { m } = state;
  const { zoom } = state.figure.time;
  const given = TIME_EDGE_ATTRS.flatMap((key) => {
    const attr = attrs.get(key);
    return attr ? [{ key, attr }] : [];
  });
  const first = given[0];
  if (state.kind !== "time") {
    if (first) throw fail(source, first.attr.at, m.timeOnly(first.key));
    return {};
  }
  const isBox = (id: string): boolean => state.figure.boxes.some((box) => box.id === id);
  if (isBox(from) !== isBox(to)) throw fail(source, 0, m.mixedLine);
  if (!isBox(from)) {
    if (first) throw fail(source, first.attr.at, zoom ? m.pointLineNoAt : m.noZoom);
    return {};
  }
  const column = (attr: Attr | undefined): number | undefined => {
    if (!attr) return undefined;
    const unit = unitAt(source, attr.at, attr.value, state);
    if (!zoom || unit < zoom.from || unit > zoom.to) throw fail(source, attr.at, zoom ? m.outOfZoom(zoom.from, zoom.to) : m.noZoom);
    return unit;
  };
  const at = column(attrs.get("at"));
  if (at === undefined) throw fail(source, end, m.boxLineNeedsAt);
  const into = column(attrs.get("into"));
  return { at, ...(into !== undefined ? { into } : {}) };
}

export const block: Block<ZoomMessages> = {
  name: "zoom",
  rank: 93,
  attach: { how: "attach-to-figure", only: "time" },
  words: { heads: ["zoom"], attrs: { edge: [...TIME_EDGE_ATTRS] } },
  read: { zoom: readZoom },
  print: {
    // 拡大の範囲の行は、節目の塊の後ろに書く。帯の無い図は書かない
    lead: (diagram) => (diagram.time?.zoom ? [`zoom ${range(diagram.time.zoom.from, diagram.time.zoom.to)}`] : []),
  },
  messages: {
    ja: {
      zoomShape: "zoom は zoom <目盛り>-<目盛り> の形で書く",
      outOfZoom: (from, to) => `拡大の帯の列は ${from} から ${to} の目盛りから選ぶ`,
      noZoom: "at と into は、zoom で拡大の帯を宣言した図の箱どうしの線にだけ書ける",
      boxNeedsZoom: "時間軸の図の箱は拡大の帯に置く。zoom <目盛り>-<目盛り> で拡大の範囲を書く",
      boxLineNeedsAt: "拡大の帯の箱どうしの線には [at: <目盛り>] で列を書く",
      pointLineNoAt: "節目どうしの線は軸の上に引くので、at と into を書けない",
      mixedLine: "線は箱どうしか、節目どうしで引く",
    },
    en: {
      zoomShape: "Write a zoom as zoom <unit>-<unit>",
      outOfZoom: (from, to) => `Pick a zoom column from units ${from} to ${to}`,
      noZoom: "at and into are allowed only on lines between boxes in a diagram that declares a zoom",
      boxNeedsZoom: "Boxes of a time diagram sit in the zoom band. Write the zoom range as zoom <unit>-<unit>",
      boxLineNeedsAt: "Write the column of a line between zoom boxes as [at: <unit>]",
      pointLineNoAt: "A line between points runs along the axis, so it takes no at or into",
      mixedLine: "Draw a line between two boxes or between two points",
    },
  },
};
