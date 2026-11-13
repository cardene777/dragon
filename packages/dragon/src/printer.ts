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
 * 試す図 (#3337) の部品の行は、部品の種類と同じ名前のブロックの書き戻す処理 (`print.part`) が書き、原本の並びのまま 1 つの塊にする (#3348)。
 * 量の図 (#3560) の見た目は図の種類の行の `[shape: ]` に書き、項目の `item` の行は項目のブロックが、段の中の `set` の行は値のブロックが書く。
 * その後ろのチップの `item` の行は入力の帯のブロックが書き、欄の値と段の中の書き換えの鍵を入力の帯の欄の順に書く。
 * 段の中でブロックが受け持つ行は、段の区切りの `step` の行の後ろ、段の中で起きることより前に、ブロックの並び (`rank`) の順に書く (#3345)。
 * 段の本文の `say` と命令の `code` の行は段のブロックが、段の出典 (#3199) は出典のブロックが、配管の図の段の要点 (#3464) は要点のブロックが書く。
 * 段の中で起きることのうちブロックが持つ種類は、そのブロックの書き戻す処理 (`print.events`) が起きた順に 1 行ずつ書く (#3345)。
 * ブロックが持つ宣言の塊 (中身の帯の `strip` の行) は、区画と箱とチップの宣言の後ろに、ブロックの書き戻す処理 (`print.figure`) が書く。
 * 書き戻す処理はブロックの読み方 (`blocks/<名前>/read.ts`) が持ち、登録簿 (`blocks/reading.ts`) が持つ読み方から引く (#3349)。
 *
 * 宣言と段を省いた短い記法を読む図の種類 (#3438) は、省ける物を省いて書く。原本に省いた印は持たない。
 * 題が図の種類の語なら 1 行目に題を書かず、段の本文が段の線から導く字と同じなら `say` を書かず、
 * どの段も線 1 本で題と本文が線から導く字と同じなら `step` の行を書かずに線だけを並べる (導き方は `short-form.ts`)。
 * 名前が名札と同じ箱だけを持つ図は、箱の宣言を省いた記法を読み直して同じ原本になる時だけ宣言を省く。箱の並びが線に出た順と違う時は宣言を書いて並びを残す。
 * 省いた記法を読み直して原本と違う時は、省かずに書く。
 * 足す前と後の図の書き方の差を取る所 (見本帳の棚の部品) は、`short: false` を渡して省かずに書く。省くと、箱を 1 つ足しただけで宣言の行が全て現れ、差が足した行だけにならない。
 */
import type { Block, BlockPrint, EventPrinter } from "./blocks/block";
import { cachedByReadings, loadedReadings, readingLoaded } from "./blocks/reading";
import { fits } from "./blocks/usable";
import { blocksUsedBy, eventOwners } from "./blocks/used";
import { KIND_FOLDERS } from "./kinds/index";
import type { Kind } from "./kinds/kind";
import { messagesFor } from "./messages";
import { attrs, name, num } from "./print-kit";
import { FORMAT_VERSION, isVersion1, toModel, upgrade } from "./model";
import type { Diagram, DiagramEvent, DiagramModel, Step, TryPart } from "./schema";
import { parseNotation } from "./parser";
import { derivedBody, lineText, type NameOf } from "./short-form";
import { printBlocks } from "./user-blocks";
import { DEFAULT_LANG } from "./words";

/** 持っている読み方の書き戻す処理を、ブロックの並び (`rank`) の順に引く (#3349) */
const printsOf = <K extends keyof BlockPrint>(key: K): NonNullable<BlockPrint[K]>[] =>
  loadedReadings().flatMap(({ reading }) => ("none" in reading.print || reading.print[key] === undefined ? [] : [reading.print[key] as NonNullable<BlockPrint[K]>]));

/** 段の中でブロックが受け持つ行を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const stepPrinters = cachedByReadings((): readonly ((step: Step) => string[])[] => printsOf("step"));

/**
 * 段の中で起きることの種類ごとの、ブロックが持つ書き戻す処理と、そのブロック (#3345、#3349)。
 * ブロックは自分の出来事の種類の処理だけを持つので、種類で引いた処理には同じ種類の出来事だけを渡す。
 * 同じ種類の出来事を 2 つのブロックが書き戻す時 (列の図と試す図の `line`) は、書き戻す図の種類で使えるブロックの処理を使う
 */
const eventPrinters = cachedByReadings(
  (): ReadonlyMap<string, { block: Block; print: EventPrinter }[]> => {
    const out = new Map<string, { block: Block; print: EventPrinter }[]>();
    for (const { block, reading } of loadedReadings()) {
      if ("none" in reading.print) continue;
      for (const [type, print] of Object.entries(reading.print.events ?? {}) as [string, EventPrinter][]) out.set(type, [...(out.get(type) ?? []), { block, print }]);
    }
    return out;
  },
);

/** 図の種類 `kind` の図の、種類 `type` の出来事を書き戻す処理。使える種類のブロックの処理を先に引く */
function eventPrinter(type: string, kind: string): EventPrinter | undefined {
  const found = eventPrinters().get(type) ?? [];
  const folder = (KIND_FOLDERS as unknown as Readonly<Record<string, Kind>>)[kind];
  return (found.find(({ block }) => folder !== undefined && fits(block, folder)) ?? found[0])?.print;
}

/**
 * 図の種類の行の直ぐ後ろに書く、ブロックが持つ図の種類の宣言の塊 (時間軸の図の目盛りなど、列の図の役) を書き戻す処理。
 * ブロックの並び (`rank`) の順 (#3348)
 */
const leadPrinters = cachedByReadings((): readonly ((diagram: DiagramModel) => string[])[] => printsOf("lead"));

/** 図の種類の宣言の直ぐ後ろに書く、ブロックが持つ宣言の塊 (枝分かれの図の枝と、区画と箱) を書き戻す処理。ブロックの並び (`rank`) の順 (#3345、#3347) */
const declarePrinters = cachedByReadings((): readonly ((diagram: DiagramModel) => string[])[] => printsOf("declare"));

/** 最初の `step` より前に書く、ブロックが持つ宣言の塊を書き戻す処理。ブロックの並び (`rank`) の順 (#3345) */
const figurePrinters = cachedByReadings((): readonly ((diagram: DiagramModel) => string[])[] => printsOf("figure"));

/** 試す図の部品の種類ごとの、部品の種類と同じ名前のブロックが持つ書き戻す処理 (#3337、#3348) */
const partPrinters = cachedByReadings(
  (): ReadonlyMap<string, (part: TryPart) => string> =>
    new Map(loadedReadings().flatMap(({ block, reading }) => ("none" in reading.print || reading.print.part === undefined ? [] : [[block.name, reading.print.part] as const]))),
);

/** 書き戻す処理を持つはずのブロック `owner` の読み方を読んでいない時の誤り。読んでいれば、書き戻す処理が無いことを示す */
function missingPrinter(what: string, owner: string | undefined): Error {
  if (owner !== undefined && !readingLoaded(owner)) return new Error(messagesFor(DEFAULT_LANG).blockNotLoaded(owner));
  return new Error(`${what} を書き戻す処理が無い`);
}

/** 試す図の部品の塊。部品の行を原本の並びのまま 1 つの塊に書く */
function tryParts(parts: readonly TryPart[]): string {
  return parts
    .map((part) => {
      const print = partPrinters().get(part.type);
      if (!print) throw missingPrinter(`${part.type} の部品`, part.type);
      return print(part);
    })
    .join("\n");
}

/** 段の中の 1 行。出来事の種類を持つブロックの書き戻す処理が書く。`kind` は図の種類、`diagram` は書き戻す図 */
function event(e: DiagramEvent, kind: DiagramModel["kind"], diagram: DiagramModel): string {
  const print = eventPrinter(e.type, kind);
  if (!print) throw missingPrinter(e.type, eventOwners(e.type, kind).find((name) => !readingLoaded(name)));
  return print(e, kind, diagram);
}

/**
 * 原本を記法に書き戻す。描く処理の形 (版1と同じ欄) に組み直して書く (#3346)。
 * 版1の原本も、読む時と同じく版2の形へ移してから書く。
 * 軽い入口では、書き戻す図が使うブロックの読み方を `loadFor` で読んでから呼ぶ。読んでいない時は、ブロックの名前を名指す誤りで止める (#3349)
 */
/** 書き戻す時の指定 */
export interface PrintOptions {
  /** 短い記法を読む図で、省ける物を省いて書くか (#3438)。既定は省く */
  short?: boolean;
}

import { readyParts } from "./kinds/registry";
export function printNotation(source: Diagram, options: PrintOptions = {}): string {
  const current = isVersion1(source) ? (upgrade(source, FORMAT_VERSION) as unknown as Diagram) : source;
  const native = readyParts(current.kind)?.notation?.print;
  if (native) return native(current);
  // 書き戻す処理は読んだブロックの物だけを回すので、読んでいないブロックの欄は黙って落ちる。書く前に、原本が使う全てのブロックを読んだかを見る
  const missing = blocksUsedBy(current).find((name) => !readingLoaded(name));
  if (missing !== undefined) throw new Error(messagesFor(DEFAULT_LANG).blockNotLoaded(missing));
  const diagram = toModel(current);
  if (options.short === false || (KIND_FOLDERS as unknown as Readonly<Record<string, Kind | undefined>>)[diagram.kind]?.short !== true) return printModel(diagram, KEEP_ALL);
  const nameOf: NameOf = (id) => diagram.boxes.find((box) => box.id === id)?.name ?? id;
  const omit: Omissions = {
    title: diagram.title === diagram.kind,
    boxes: false,
    lineSteps: lineStepsOnly(diagram, nameOf),
    say: (step) => step.body === derivedBody(step.events, nameOf)?.join("\n"),
  };
  // 省いた記法を読み直し、同じ原本になる形を返す。箱の宣言を省く形を先に試す
  const candidates = bareBoxes(diagram) ? [{ ...omit, boxes: true }, omit] : [omit];
  for (const tried of candidates) {
    const text = printModel(diagram, tried);
    const again = parseNotation(text);
    if (again.ok && sameJson(again.diagram, current)) return text;
  }
  return printModel(diagram, KEEP_ALL);
}

/** 短い記法で省く物 (#3438) */
interface Omissions {
  /** 1 行目の題 */
  title: boolean;
  /** 箱の宣言 */
  boxes: boolean;
  /** `step` の行。段ごとに線 1 本だけを並べる */
  lineSteps: boolean;
  /** その段の `say` の行 */
  say: (step: Step) => boolean;
}

/** 何も省かずに書く */
const KEEP_ALL: Omissions = { title: false, boxes: false, lineSteps: false, say: () => false };

/** 区画を持たず、どの箱も名前が名札と同じで、ほかの欄を持たないか */
function bareBoxes(diagram: DiagramModel): boolean {
  return (diagram.regions ?? []).length === 0 && diagram.boxes.length > 0 && diagram.boxes.every((box) => box.name === box.id && Object.keys(box).every((key) => key === "id" || key === "name"));
}

/** 状態遷移図の道を持たず、どの段も線 1 本だけで、題と本文がその線から導く字と同じで、命令と出典と要点を持たないか */
function lineStepsOnly(diagram: DiagramModel, nameOf: NameOf): boolean {
  if (diagram.steps.length === 0 || (diagram.state?.paths ?? []).length > 0) return false;
  return diagram.steps.every((step) => {
    const [only, ...more] = step.events;
    if (only?.type !== "edge" || more.length > 0) return false;
    const text = lineText(only, nameOf);
    return step.title === text && step.body === text && step.code === undefined && (step.sources ?? []).length === 0 && step.gist === undefined;
  });
}

/** 2 つの JSON の値が、欄の並び順を除いて同じか */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((key) => left[key] !== undefined);
  if (keys.length !== Object.keys(right).filter((key) => right[key] !== undefined).length) return false;
  return keys.every((key) => sameJson(left[key], right[key]));
}

/** 描く処理の形の図を、`omit` の物を省いて記法に書く */
function printModel(diagram: DiagramModel, omit: Omissions): string {
  const blocks = [
    // 量の図 (#3560) と列の図 (#3625) と集合の重なりの図 (#3635) の見た目と、点で数える見た目の 1 点の件数は図の種類の行の属性なので、見た目のブロックでなくここで書く
    `${omit.title ? diagram.kind : `${diagram.kind} ${name(diagram.title)}`}${attrs([
      ["shape", diagram.chart?.shape ?? diagram.lineup?.shape ?? diagram.venn?.shape],
      ["unit", num(diagram.chart?.unit ?? diagram.venn?.unit)],
      ["view", diagram.view],
    ])}`,
    // 図の頭に書いた、使う人が足すブロックの定義は、図の種類の行の直ぐ後ろに書く (#3399)
    ...(diagram.define ? [printBlocks(diagram.define)] : []),
    ...(diagram.try ? [tryParts(diagram.try.parts)] : []),
    ...leadPrinters().flatMap((print) => print(diagram)),
    ...declarePrinters().flatMap((print) => print(omit.boxes ? { ...diagram, boxes: [] } : diagram)),
    ...figurePrinters().flatMap((print) => print(diagram)),
  ];
  // 段を書かない図は、段の線を 1 つの塊に並べる
  if (omit.lineSteps) blocks.push(diagram.steps.flatMap((step) => step.events.map((e) => event(e, diagram.kind, diagram))).join("\n"));
  // 段の区切りの `step` の行の下に、段の中でブロックが受け持つ行を字下げして書く。空の行 (本文の空の行) は字下げしない
  // 本文を省く段は、本文を空にして段のブロックに渡す。段のブロックは本文が空の段の `say` を書かない
  for (const step of omit.lineSteps ? [] : diagram.steps) {
    const written = omit.say(step) ? { ...step, body: "" } : step;
    blocks.push(
      [
        `step ${step.title}`,
        ...stepPrinters()
          .flatMap((print) => print(written))
          .map((line) => (line === "" ? "" : `  ${line}`)),
        ...step.events.map((e) => `  ${event(e, diagram.kind, diagram)}`),
      ].join("\n"),
    );
  }
  return `${blocks.join("\n\n")}\n`;
}
