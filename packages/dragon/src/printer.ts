/**
 * 図の原本の JSON を、人が書く dragon記法へ書き戻す (#3137)。
 *
 * 並べ方は決まった形に整える。JSON の欄の並び順は見ず、欄の名前で読むので、
 * 同じ内容の JSON からは毎回同じ文字列になる。書き手の行の並べ方とコメントは保たない。
 * 段の中で起きることは JSON の並び順 (起きる順) のまま書く。
 * 状態遷移図の移れる道 (`state.paths`) は、帯の宣言の後、最初の `step` より前に JSON の並びのまま、脇道のブロックの書き戻す処理 (`print.figure`) が書く (#3163、#3347)。
 *
 * `"` で囲むのは要る時だけにする。`[` を含む名前と、`,` か `]` を含む属性の値と、`"` で始まる字を囲む。
 * 区画と箱の宣言の塊は箱のブロックの書き戻す処理 (`print.declare`) が書く (#3345)。
 * 枝分かれの図 (#3164) は、枝の `branch` の行を箱より前に枝のブロックの書き戻す処理 (`print.declare`) が書き、札を動かす線の運ぶ物が送る側の名前の札なら書かない。
 * commit の行と枝を切る行は、commit と枝のブロックの書き戻す処理 (`print.events`) が書く (#3347)。
 * 時間軸の図 (#3165) は、目盛りと区切りと印の列と節目と拡大の範囲の行を、各ブロックの書き戻す処理 (`print.lead`) が箱より前に書く (#3348)。
 * 中身の帯の物差しの欄の後ろには `[meter: <割合>]` を書く。
 * 時間軸の図の `note` は属性を持てるので、`[` を含む字を `"` で囲む。
 * 木の図 (#3233) の葉と親は、段の中に `leaf` と `node … of …` の行で、葉と組んだ親のブロックが書く (#3348)。
 * 列の図 (#3239) のチップは箱の後ろに `item` の行でチップのブロックが書き、色が同じで字を持たないチップが続く所は 1 行に並べる。
 * 列の図の役は、図の種類の行の直ぐ後ろに役のブロックが書く (#3348)。
 * 段の中でブロックが受け持つ行は、段の区切りの `step` の行の後ろ、段の中で起きることより前に、ブロックの並び (`rank`) の順に書く (#3345)。
 * 段の本文の `say` と命令の `code` の行は段のブロックが、段の出典 (#3199) は出典のブロックが書く。
 * 段の中で起きることのうちブロックが持つ種類は、そのブロックの書き戻す処理 (`print.events`) が起きた順に 1 行ずつ書く (#3345)。
 * ブロックが持つ宣言の塊 (中身の帯の `strip` の行) は、区画と箱とチップの宣言の後ろに、ブロックの書き戻す処理 (`print.figure`) が書く。
 */
import { type EventPrinter, ranked } from "./blocks/block";
import { BLOCKS } from "./blocks/index";
import { attrs, name } from "./print-kit";
import { FORMAT_VERSION, isVersion1, toModel, upgrade } from "./model";
import type { Diagram, DiagramEvent, DiagramModel, Step } from "./schema";

/** 段の中でブロックが受け持つ行を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const STEP_PRINTERS: readonly ((step: Step) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.step === undefined ? [] : [block.print.step],
);

/**
 * 段の中で起きることの種類ごとの、ブロックが持つ書き戻す処理 (#3345)。
 * ブロックは自分の出来事の種類の処理だけを持つので、種類で引いた処理には同じ種類の出来事だけを渡す
 */
const EVENT_PRINTERS: ReadonlyMap<string, EventPrinter> = new Map(
  ranked(BLOCKS).flatMap((block) => ("none" in block.print ? [] : (Object.entries(block.print.events ?? {}) as [string, EventPrinter][]))),
);

/**
 * 図の種類の行の直ぐ後ろに書く、ブロックが持つ図の種類の宣言の塊 (時間軸の図の目盛りなど、列の図の役) を書き戻す処理。
 * ブロックの並び (`rank`) の順 (#3348)
 */
const LEAD_PRINTERS: readonly ((diagram: DiagramModel) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.lead === undefined ? [] : [block.print.lead],
);

/** 図の種類の宣言の直ぐ後ろに書く、ブロックが持つ宣言の塊 (枝分かれの図の枝と、区画と箱) を書き戻す処理。ブロックの並び (`rank`) の順 (#3345、#3347) */
const DECLARE_PRINTERS: readonly ((diagram: DiagramModel) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.declare === undefined ? [] : [block.print.declare],
);

/** 最初の `step` より前に書く、ブロックが持つ宣言の塊を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const FIGURE_PRINTERS: readonly ((diagram: DiagramModel) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.figure === undefined ? [] : [block.print.figure],
);

/** 段の中の 1 行。出来事の種類を持つブロックの書き戻す処理が書く。`kind` は図の種類 */
function event(e: DiagramEvent, kind: DiagramModel["kind"]): string {
  const print = EVENT_PRINTERS.get(e.type);
  if (!print) throw new Error(`${e.type} を書き戻す処理が無い`);
  return print(e, kind);
}

/**
 * 原本を記法に書き戻す。描く処理の形 (版1と同じ欄) に組み直して書く (#3346)。
 * 版1の原本も、読む時と同じく版2の形へ移してから書く
 */
export function printNotation(source: Diagram): string {
  const diagram = toModel(isVersion1(source) ? (upgrade(source, FORMAT_VERSION) as unknown as Diagram) : source);
  const blocks = [
    `${diagram.kind} ${name(diagram.title)}${attrs([["view", diagram.view]])}`,
    ...LEAD_PRINTERS.flatMap((print) => print(diagram)),
    ...DECLARE_PRINTERS.flatMap((print) => print(diagram)),
    ...FIGURE_PRINTERS.flatMap((print) => print(diagram)),
  ];
  // 段の区切りの `step` の行の下に、段の中でブロックが受け持つ行を字下げして書く。空の行 (本文の空の行) は字下げしない
  for (const step of diagram.steps) {
    blocks.push(
      [
        `step ${step.title}`,
        ...STEP_PRINTERS.flatMap((print) => print(step)).map((line) => (line === "" ? "" : `  ${line}`)),
        ...step.events.map((e) => `  ${event(e, diagram.kind)}`),
      ].join("\n"),
    );
  }
  return `${blocks.join("\n\n")}\n`;
}
