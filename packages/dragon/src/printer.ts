/**
 * 図の原本の JSON を、人が書く dragon記法へ書き戻す (#3137)。
 *
 * 並べ方は決まった形に整える。JSON の欄の並び順は見ず、欄の名前で読むので、
 * 同じ内容の JSON からは毎回同じ文字列になる。書き手の行の並べ方とコメントは保たない。
 * 段の中で起きることは JSON の並び順 (起きる順) のまま書く。
 * 状態遷移図の移れる道 (`state.paths`) は、帯の宣言の後、最初の `step` より前に JSON の並びのまま書く (#3163)。
 *
 * `"` で囲むのは要る時だけにする。`[` を含む名前と、`,` か `]` を含む属性の値と、`"` で始まる字を囲む。
 * 区画と箱の宣言の塊は箱のブロックの書き戻す処理 (`print.declare`) が書く (#3345)。
 * 枝分かれの図 (#3164) は、枝の `branch` の行を箱より前に書き、札を動かす線の運ぶ物が送る側の名前の札なら書かない。
 * 時間軸の図 (#3165) は、目盛りと区切りと印の列と節目と拡大の範囲の行を箱より前に書き、物差しの欄の後ろに `[meter: <割合>]` を書く。
 * 時間軸の図の `note` は属性を持てるので、`[` を含む字を `"` で囲む。
 * 木の図 (#3233) の葉と親は、段の中に `leaf` と `node … of …` の行で書く。
 * 列の図 (#3239) のチップは箱の後ろに `item` の行で書き、色が同じで字を持たないチップが続く所は 1 行に並べる。
 * 段の中でブロックが受け持つ行は、段の区切りの `step` の行の後ろ、段の中で起きることより前に、ブロックの並び (`rank`) の順に書く (#3345)。
 * 段の本文の `say` と命令の `code` の行は段のブロックが、段の出典 (#3199) は出典のブロックが書く。
 * 段の中で起きることのうちブロックが持つ種類は、そのブロックの書き戻す処理 (`print.events`) が起きた順に 1 行ずつ書く (#3345)。
 * ブロックが持つ宣言の塊 (中身の帯の `strip` の行) は、区画と箱とチップの宣言の後ろに、ブロックの書き戻す処理 (`print.figure`) が書く。
 */
import { type EventPrinter, ranked } from "./blocks/block";
import { line } from "./blocks/edge/block";
import { BLOCKS } from "./blocks/index";
import { attrs, name, num, shown } from "./print-kit";
import type { Diagram, DiagramEvent, LineupItem, Step, TimeSpec } from "./schema";
import { AT, COPY, FROM, MERGE, NOW, OF, ON } from "./words";

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

/** 図の種類の宣言の直ぐ後ろに書く、ブロックが持つ宣言の塊 (区画と箱) を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const DECLARE_PRINTERS: readonly ((diagram: Diagram) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.declare === undefined ? [] : [block.print.declare],
);

/** 最初の `step` より前に書く、ブロックが持つ宣言の塊を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const FIGURE_PRINTERS: readonly ((diagram: Diagram) => string[])[] = ranked(BLOCKS).flatMap((block) =>
  "none" in block.print || block.print.figure === undefined ? [] : [block.print.figure],
);

/** 目盛りの範囲。1 つの目盛りは番号だけを書く */
const range = (from: number, to: number): string => (from === to ? `${from}` : `${from}-${to}`);

/** 段の中の 1 行。`kind` は図の種類 */
function event(e: DiagramEvent, kind: Diagram["kind"]): string {
  switch (e.type) {
    case "now":
      return `${NOW} -> ${e.to}`;
    case "mark":
      return `mark ${e.row} ${range(e.from, e.to)}${attrs([["color", e.color]])}`;
    case "span":
      return `span ${range(e.from, e.to)}: ${name(e.text)}${attrs([
        ["shape", e.shape],
        ["color", e.color],
      ])}`;
    case "commit":
      return `commit ${e.id} ${ON} ${e.branch}${e.copy === undefined ? "" : ` ${COPY} ${e.copy}`}${e.merge === undefined ? "" : ` ${MERGE} ${e.merge}`}${attrs([
        ["hash", e.hash],
        ["note", e.note],
      ])}`;
    case "branch":
      return `${e.branch} ${FROM} ${e.from}`;
    case "leaf":
      return `leaf ${e.id}${attrs([["hash", e.hash]])}`;
    case "node":
      return `node ${e.id} ${OF} ${e.children.join(", ")}${attrs([["hash", e.hash]])}`;
    case "line":
      return `line ${e.box}: ${e.items.join(", ")}`;
    case "seal":
    case "open":
    case "pick":
      return `${e.type} ${e.box}`;
    case "stamp":
      return `stamp ${e.box}: ${name(e.text)}`;
    default: {
      const print = EVENT_PRINTERS.get(e.type);
      if (!print) throw new Error(`${e.type} を書き戻す処理が無い`);
      return print(e, kind);
    }
  }
}

/** 列の図のチップの宣言の行。色が同じで字を持たないチップが続く所は 1 行に並べる */
function itemLines(items: LineupItem[]): string {
  const rows: LineupItem[][] = [];
  for (const item of items) {
    const row = rows.at(-1);
    if (row && item.label === undefined && row[0]?.label === undefined && row[0]?.color === item.color) row.push(item);
    else rows.push([item]);
  }
  return rows
    .map(
      (row) =>
        `item ${row.map((item) => item.id).join(", ")}${attrs([
          ["color", row[0]?.color],
          ["label", row[0]?.label],
        ])}`,
    )
    .join("\n");
}

/** 時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲の宣言の塊 */
function timeBlocks(time: TimeSpec): string[] {
  const head = [
    `scale ${time.scale.unit} ${time.scale.length} ${time.scale.count}${attrs([["from", num(time.scale.from)]])}`,
    ...(time.period ? [`period ${time.period.name} ${time.period.length}${attrs([["from", num(time.period.from)]])}`] : []),
  ];
  const rows = time.rows.map(
    (r) =>
      `row ${r.id}${shown(r.id, r.name)}${attrs([
        ["color", r.color],
        ["empty", r.empty && r.empty.length > 0 ? r.empty.join(" ") : undefined],
      ])}`,
  );
  const points = (time.points ?? []).map((p) => `point ${p.id} ${AT} ${p.at}`);
  return [head.join("\n"), rows.join("\n"), ...(points.length > 0 ? [points.join("\n")] : []), ...(time.zoom ? [`zoom ${range(time.zoom.from, time.zoom.to)}`] : [])];
}

export function printNotation(diagram: Diagram): string {
  const branches = (diagram.git?.branches ?? []).map((b) => `branch ${b.id}${attrs([["note", b.note]])}`);
  const blocks = [
    `${diagram.kind} ${name(diagram.title)}${attrs([["view", diagram.view]])}`,
    ...(branches.length > 0 ? [branches.join("\n")] : []),
    ...(diagram.time ? timeBlocks(diagram.time) : []),
    ...DECLARE_PRINTERS.flatMap((print) => print(diagram)),
    ...(diagram.lineup && diagram.lineup.items.length > 0 ? [itemLines(diagram.lineup.items)] : []),
    ...FIGURE_PRINTERS.flatMap((print) => print(diagram)),
  ];
  if (diagram.state) blocks.push(diagram.state.paths.map((p) => line(p.from, p.to, p.label)).join("\n"));
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
