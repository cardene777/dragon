/**
 * `edge` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type Attr, fail, readAttrs, skipSpaces } from "../../read-kit";
import { attrs, name, num } from "../../print-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { carryAttrs, readCarry } from "../carry/read";
import { readLabel, readSide } from "../edge-label/read";
import { CALL_ATTRS } from "../return/block";
import type { EdgeEvent } from "./block";

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
  // 配管の図の呼び出しの印 (#3389) は配管の図の呼び出しの管のブロックが読むので、ほかの種類の図の線に書いた印は断る
  for (const key of CALL_ATTRS) {
    const mark = attrs.get(key);
    if (mark) throw fail(source, mark.at, m.pipeOnlyAttr(key));
  }
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

export const reading: BlockReading<EdgeMessages> = {
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
