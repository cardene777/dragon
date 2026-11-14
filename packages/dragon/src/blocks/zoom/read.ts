/**
 * `zoom` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type Attr, fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { range, rangeAt, unitAt } from "../scale/read";
import { TIME_EDGE_ATTRS } from "../definition-values";

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

export const reading: BlockReading<ZoomMessages> = {
  columns: readColumns,
  // 拡大の範囲の無い図の箱は誤り
  settle: (state) => {
    if (state.figure.firstBox && !state.figure.time.zoom) throw fail(state.figure.firstBox, 0, state.m.boxNeedsZoom);
  },
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
