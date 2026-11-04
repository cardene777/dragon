/**
 * 脇道のブロック (#3163、#3171、#3347)。
 *
 * 状態遷移図の部品 (`only: state`)。最初の `step` より前に書いた線 (`<名札> -> <名札>: <線の名前>`) は、移れるが今回は通らない道になる。
 * 道は点線で引き、運ぶ物を走らせず、属性 (`carry`、`tag`、`side`) を持たない。どの段も辿り着かない状態は薄い箱にし、図の右上の脇道の囲みに入れる。
 * 道の行は線の行と同じ形なので行の頭の語を持たず、parser が最初の `step` より前の線の行を見分けて `readPath` を呼ぶ。
 * 原本の欄は `blocks.path` で、欄の名前は道の行の呼び名のまま骨組み (`schemas/base.schema.json`) が持つ。このブロックは道 1 本の形 (`path`) を持つ。
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none, type ParseState } from "../block";
import { line, readLine } from "../edge/block";

/** 状態遷移図の、最初の段より前に書いた移れる道。`from` に `start`、`to` に `finish` を書ける */
export interface StatePath {
  from: string;
  to: string;
  label?: string;
}

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

export const block: Block<SidePathMessages> = {
  name: "side-path",
  rank: 35,
  attach: { how: "connect", only: "state" },
  words: {},
  shape: {
    definitions: {
      path: {
        description: "移れる道。送る側に始まりの印 start、受ける側に終わりの印 finish を書ける。どの段にも出ない道は点線で描き、運ぶ物を走らせない",
        type: "object",
        additionalProperties: false,
        required: ["from", "to"],
        properties: {
          from: { $ref: "#/definitions/id" },
          to: { $ref: "#/definitions/id" },
          label: { $ref: "#/definitions/text" },
        },
      },
    },
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
