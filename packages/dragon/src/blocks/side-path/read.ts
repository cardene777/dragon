/**
 * `side-path` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { line, readLine } from "../edge/read";
import type { StatePath } from "./block";
import { EDGE } from "../definition-values";

export interface SidePathMessages {
  /** 状態遷移図の最初の step より前の線に、属性を書いた */
  pathNoAttrs: string;
}

/** 状態遷移図の最初の `step` より前の `<名札> -> <名札>: <線の名前>` の行。属性は書けない */
export function readPath(source: SourceLine, edge: RegExpExecArray, state: ParseState): StatePath {
  const { from, to, label, at } = readLine(source, edge, state);
  if (at < source.text.length) throw fail(source, at, source.text[at] === "[" ? state.m.pathNoAttrs : state.m.edgeShape);
  return { from, to, ...(label !== undefined ? { label } : {}) };
}

export const reading: BlockReading<SidePathMessages> = {
  // 最初の段より前の線は、移れるが段で通るとは限らない道
  take: (source, state) => {
    const edge = EDGE.exec(source.text);
    if (!edge) return false;
    state.figure.paths.push(readPath(source, edge, state));
    return true;
  },
  read: none("道の行は線の行と同じ形で行の頭の語を持たない。parser が最初の step より前の線の行を見分けて readPath を呼ぶ"),
  print: {
    // 道は中身の帯の宣言の後ろ、最初の `step` より前に、原本の並びのまま書く
    figure: (diagram) => (diagram.state ? [diagram.state.paths.map((p) => line(p.from, p.to, p.label)).join("\n")] : []),
  },
  messages: {
    ja: { pathNoAttrs: "最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない" },
    en: { pathNoAttrs: "A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)" },
  },
};
