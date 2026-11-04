/**
 * 入力の帯のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `ask <欄>, <欄> [into: <待ち行列>, via: <網>]` の行で、欄ごとの入力と送る釦を持つ帯を宣言する。
 * 帯は図に 1 つまでで、欄は 2 つ以上。最初の欄の値が送ったチップの名前になる。段の中の `ask <値>, <値>` は書き手の例として送る。
 * 帯は図の上に置き場所を持たず、再生の部品 (`try-player.ts`) が描く。図の上には送ったチップを描く。
 * 試す図の `item` の行は列の図のチップでなく入力の帯の欄の値を持つチップなので、チップのブロックでなくこのブロックの読み方 (`readTryChip`) で読み、
 * 書き戻しもこのブロックが持つ (最初の段より前のチップの塊と、段の中の書き換えの `item` の出来事)。
 */
import { attrs, quote } from "../../print-kit";
import { type Attr, fail, ID, list, readAttrs, skipSpaces } from "../../read-kit";
import type { DiagramModel, TryItem } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { faultOf, fieldAt, needed, refer, valuesOf } from "../../try-read";
import { askFields } from "../../try-state";
import type { Block, ParseState } from "../block";
import { namesAt } from "../item/block";

/** 試す図の `item <名札>` の行の名札 */
const TRY_ITEM = /^item\s+([^\s[]+)/du;

export interface AskMessages {
  askShape: string;
  askTwice: string;
  fewFields: string;
  fieldTwice: (field: string) => string;
  /** `field` が入力の帯の欄 (最初の欄を除く) に無い。`fields` は書ける欄 */
  notAskField: (field: string, fields: readonly string[]) => string;
  /** 欄か値を書いたのに、入力の帯 (`ask`) の宣言が無い */
  noAsk: string;
  /** 段の中の `ask` の値の数が、欄の数 `count` と違う */
  askCount: (count: number) => string;
  tryItemShape: string;
}

/** 試す図の値。`,` で区切る並びと属性の中で読み直せるよう、`,` か `]` を含む値と、`"` で始まる値と、前後に空白を持つ値を囲む */
const tryValue = (text: string): string =>
  text.includes(",") || text.includes("]") || text.startsWith('"') || text !== text.trim() ? quote(text) : text;

/** 試す図のチップの欄の値の属性。入力の帯の欄の順に書き、欄に無い鍵はその後ろに原本の並びで書く */
function tryAttrs(values: Readonly<Record<string, string>>, fields: readonly string[]): string {
  const keys = [...fields.filter((f) => Object.hasOwn(values, f)), ...Object.keys(values).filter((k) => !fields.includes(k))];
  return keys.length === 0 ? "" : ` [${keys.map((k) => `${k}: ${tryValue(values[k] ?? "")}`).join(", ")}]`;
}

/** 最初の step より前の `ask <欄>, <欄> [into: <待ち行列>, via: <網>]` の行。図に 1 つまでで、欄は 2 つ以上 */
function readAsk(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const { parts } = state.figure.try;
  if (parts.some((p) => p.type === "ask")) throw fail(source, 0, m.askTwice);
  const text = source.text;
  const open = text.indexOf("[");
  const fields = namesAt(source, "ask".length, open < 0 ? text.length : open, m.askShape, state);
  if (fields.length < 2) throw fail(source, fields[0]?.at ?? 0, m.fewFields);
  fields.forEach(({ value, at }, k) => {
    if (fields.findIndex((f) => f.value === value) < k) throw fail(source, at, m.fieldTwice(value));
  });
  state.declare(source, "ask", 0);
  if (open < 0) throw fail(source, text.length, m.needsAttr("ask", "into"));
  const read = readAttrs(source, open, state.attrs.ask ?? [], m);
  const into = needed(source, read, "ask", "into", open, state);
  refer(source, into, ["queue"], state);
  const via = read.get("via");
  if (via) refer(source, via, ["route"], state);
  parts.push({ type: "ask", id: "ask", fields: fields.map((f) => f.value), into: into.value, ...(via ? { via: via.value } : {}) });
}

/** 段の中の `ask <値>, <値>` の行。値の数は入力の帯の欄の数と同じで、満杯の待ち行列へは送れない */
function readSend(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const ask = state.figure.try.parts.find((p) => p.type === "ask");
  if (!ask) throw fail(source, 0, m.noAsk);
  const values = valuesOf(source, "ask".length, state);
  if (values.length !== ask.fields.length) throw fail(source, 0, m.askCount(ask.fields.length));
  const fault = state.figure.try.run?.ask(values).fault;
  if (fault) throw faultOf(source, fault, state);
  step.events.push({ type: "ask", values });
}

/** `item` の行のチップの名札と属性。段の中の行は属性を 1 つ以上持つ */
function chipLine(source: SourceLine, inside: boolean, state: ParseState): { id: string; idAt: number; attrs: Map<string, Attr> } {
  const { m } = state;
  const text = source.text;
  const found = TRY_ITEM.exec(text);
  const id = found?.[1];
  if (!found || id === undefined || id.includes(",")) throw fail(source, 0, m.tryItemShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  const rest = skipSpaces(text, found[0].length);
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.tryItemShape);
  if (inside && rest >= text.length) throw fail(source, text.length, m.tryItemShape);
  return { id, idAt, attrs: rest < text.length ? readAttrs(source, rest, undefined, m) : new Map<string, Attr>() };
}

/**
 * 試す図の `item` の行。最初の step より前の `item <名札> [<欄>: <値>]` はチップを宣言し、鍵は入力の帯の欄 (最初の欄を除く) で、
 * 全ての宣言を読んでから確かめる。段の中の `item <チップ> [<欄>: <値>]` はチップの欄の値を書き換える
 */
export function readTryChip(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.current();
  const { id, idAt, attrs: read } = chipLine(source, step !== undefined, state);
  const values: Record<string, string> = {};
  if (!step) {
    state.declare(source, id, idAt);
    for (const [key, attr] of read) {
      values[key] = attr.value;
      state.figure.try.pending.push(() => fieldAt(source, key, attr.at, state));
    }
    state.figure.try.items.push({ id, values });
    return;
  }
  for (const [key, attr] of read) {
    fieldAt(source, key, attr.at, state);
    values[key] = attr.value;
  }
  const run = state.figure.try.run;
  if (!run?.has(id)) throw fail(source, idAt, m.noSuchItem(id));
  run.edit(id, values);
  step.events.push({ type: "item", item: id, values });
}

/** 試す図のチップの宣言の行。入力の帯の欄の順に欄の値を書く */
function chipLines(diagram: DiagramModel, items: readonly TryItem[]): string {
  const fields = askFields(diagram.try?.parts ?? []);
  return items.map((item) => `item ${item.id}${tryAttrs(item.values, fields)}`).join("\n");
}

export const block: Block<AskMessages> = {
  name: "ask",
  rank: 110,
  attach: { how: "attach-to-figure", only: "try" },
  words: { heads: ["ask"], attrs: { ask: ["into", "via"] } },
  read: {
    ask: (source, state) => (state.current() ? readSend(source, state) : readAsk(source, state)),
  },
  print: {
    // 試す図のチップの塊は、部品の塊の直ぐ後ろに書く
    lead: (diagram) => (diagram.try && diagram.try.items.length > 0 ? [chipLines(diagram, diagram.try.items)] : []),
    part: (part) =>
      part.type === "ask"
        ? `ask ${part.fields.join(", ")}${attrs([
            ["into", part.into],
            ["via", part.via],
          ])}`
        : "",
    events: {
      ask: (e) => `ask ${e.values.map(tryValue).join(", ")}`,
      item: (e, _kind, diagram) => `item ${e.item}${tryAttrs(e.values, askFields(diagram.try?.parts ?? []))}`,
    },
  },
  messages: {
    ja: {
      askShape: "ask は最初の step より前なら ask <欄>, <欄> [into: <待ち行列>, via: <網>]、step の中なら ask <値>, <値> の形で書く",
      askTwice: "ask の行は図に 1 つまで",
      fewFields: "ask の欄は , で区切って 2 つ以上書く",
      fieldTwice: (field) => `${field} の欄はもう書いた`,
      notAskField: (field, fields) => `${field} は ask の欄 (最初の欄を除く) に無い。書けるのは ${list(fields)}`,
      noAsk: "ask <欄>, <欄> [into: <待ち行列>] の行で入力の帯を宣言してから、欄と値を書く",
      askCount: (count) => `ask の値は欄と同じ ${count} つを , で区切って書く`,
      tryItemShape: "item は最初の step より前なら item <名札> [<欄>: <値>]、step の中なら item <チップ> [<欄>: <値>] の形で書く",
    },
    en: {
      askShape: "Write ask as ask <field>, <field> [into: <queue>, via: <route>] before the first step, or as ask <value>, <value> inside a step",
      askTwice: "A diagram takes at most one ask line",
      fewFields: "Write at least two ask fields, separated by ,",
      fieldTwice: (field) => `The field ${field} is already written`,
      notAskField: (field, fields) => `${field} is not an ask field other than the first. Write ${list(fields)}`,
      noAsk: "Declare the input strip with ask <field>, <field> [into: <queue>] before writing fields and values",
      askCount: (count) => `Write ${count} ask values separated by ,, one for each field`,
      tryItemShape: "Write item as item <id> [<field>: <value>] before the first step, or as item <chip> [<field>: <value>] inside a step",
    },
  },
};
