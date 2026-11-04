/**
 * 線のブロック (#3345)。
 *
 * 段の中の `<名札> -> <名札>: <線の名前> [<属性>]` の行で、送る側の箱から受ける側の箱へ線を引く。1 つの段に何本でも並べ、書いた順に引く。
 * 線の行は行の頭の語を持たず、名札の次に `->` が来る行を parser が見分けて `readEdgeLine` を呼ぶ。名札が行の頭の語と同じ綴りでも線と読む。
 * 線の端の名札の確かめ方と、時間軸の図の列 (`at` と `into`) は図の種類ごとに違うので、読んでいる記法の状態 (`ParseState`) から引く。
 * 線の名前は線の名前のブロック、運ぶ物は運ぶ物のブロックの下請けで読み書きする。列の図は線を持たないので、列の図の線の行は断る。
 */
import { type Attr, fail, readAttrs, skipSpaces } from "../../read-kit";
import { attrs, name, num } from "../../print-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type Block, none, type ParseState } from "../block";
import { carryAttrs, readCarry } from "../carry/block";
import { readLabel, readSide } from "../edge-label/block";

/** 線の出来事 */
export type EdgeEvent = Extract<DiagramEvent, { type: "edge" }>;

/** 線の行。名札、`->`、名札 */
export const EDGE = /^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du;

export interface EdgeMessages {
  edgeShape: string;
  lineupNoEdge: string;
}

/** 線の行の両端と、`:` の後ろの線の名前。`at` は名前の後ろの位置 */
export function readLine(source: SourceLine, edge: RegExpExecArray, state: ParseState): { from: string; to: string; label?: string; at: number } {
  const from = state.endAt(source, edge[1] ?? "", edge.indices?.[1]?.[0] ?? 0, "from");
  const to = state.endAt(source, edge[2] ?? "", edge.indices?.[2]?.[0] ?? 0, "to");
  return { from, to, ...readLabel(source, skipSpaces(source.text, edge[0].length), state.m) };
}

/** `<名札> -> <名札>: <線の名前> [<属性>]` の行 */
function readEdge(source: SourceLine, edge: RegExpExecArray, state: ParseState): EdgeEvent {
  const { m } = state;
  const text = source.text;
  const { from, to, label, at } = readLine(source, edge, state);
  if (at < text.length && text[at] !== "[") throw fail(source, at, m.edgeShape);
  const attrs = at < text.length ? readAttrs(source, at, state.attrs.edge ?? [], m) : new Map<string, Attr>();
  const carry = readCarry(source, attrs, from, state.kind, m);
  const side = readSide(source, attrs, m);
  const columns = state.columns(source, from, to, attrs, at);
  return {
    type: "edge",
    from,
    to,
    ...(label !== undefined ? { label } : {}),
    carry,
    ...(side ? { labelSide: side } : {}),
    ...columns,
  };
}

/** 段の中の線の行を読んで段に足し、読んだ線を返す。列の図の線の行と、最初の `step` より前の線の行は断る */
export function readEdgeLine(source: SourceLine, edge: RegExpExecArray, state: ParseState): EdgeEvent {
  if (state.kind === "lineup") throw fail(source, 0, state.m.lineupNoEdge);
  const step = state.inStep(source);
  const event = readEdge(source, edge, state);
  step.events.push(event);
  return event;
}

/** 線の行の両端と名前。名前は省ける */
export const line = (from: string, to: string, label: string | undefined): string => `${from} -> ${to}${label === undefined ? "" : `: ${name(label)}`}`;

export const block: Block<EdgeMessages> = {
  name: "edge",
  rank: 82,
  attach: { how: "connect" },
  words: {},
  read: none("線の行は行の頭の語を持たない。名札の次に -> が来る行を parser が見分けて readEdgeLine を呼ぶ"),
  print: {
    events: {
      // 枝分かれの図の線は、送る側の名前の札を書かない時の運ぶ物にする
      edge: (e, kind) => `${line(e.from, e.to, e.label)}${attrs([...carryAttrs(e, kind), ["side", e.labelSide], ["at", num(e.at)], ["into", num(e.into)]])}`,
    },
  },
  messages: {
    ja: {
      edgeShape: "線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",
      lineupNoEdge: "lineup (列の図) には線の行を書けない。チップは line の行で列の並びを書くと動く",
    },
    en: {
      edgeShape: "Write a line as <id> -> <id>: <label> [<attributes>]",
      lineupNoEdge: "A lineup diagram takes no edge lines. Chips move when a line line rewrites a lane",
    },
  },
};
