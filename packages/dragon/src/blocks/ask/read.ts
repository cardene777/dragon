/**
 * `ask` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, quote } from "../../print-kit";
import { type Attr, fail, ID, list, readAttrs, skipSpaces } from "../../read-kit";
import type { DiagramModel, TryItem, TryPart } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { faultOf, fieldAt, needed, refer, valueAt, valuesOf } from "../../try-read";
import { askFields } from "../../try-state";
import type { BlockReading, ParseState } from "../block";
import { namesAt } from "../item/read";

const TRY_ITEM = /^item\s+([^\s[]+)/du;
/** `choose <欄>:` の頭。欄の名札を捕まえる (#3422) */
const CHOOSE = /^choose\s+([^\s:,[]+)\s*:/du;

type AskPart = Extract<TryPart, { type: "ask" }>;

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
  chooseShape: string;
  /** `choose` の欄 `field` が入力の帯の欄 `fields` に無い */
  notChooseField: (field: string, fields: readonly string[]) => string;
  chooseTwice: (field: string) => string;
  fewChoices: string;
  choiceTwice: (value: string) => string;
  /** 欄 `field` の値 `value` が、その欄の選択肢 `choices` に無い */
  notChoice: (field: string, value: string, choices: readonly string[]) => string;
  /** `into` に書いた欄 `field` が選択肢を持たない (#3441) */
  intoNoChoices: (field: string) => string;
  /** `into` に書いた欄 `field` の選択肢 `value` と同じ名札の待ち行列が無い (#3441) */
  choiceNoQueue: (value: string, field: string) => string;
}

/** 試す図の値。`,` で区切る並びと属性の中で読み直せるよう、`,` か `]` を含む値と、`"` で始まる値と、前後に空白を持つ値を囲む */
const tryValue = (text: string): string =>
  text.includes(",") || text.includes("]") || text.startsWith('"') || text !== text.trim() ? quote(text) : text;

/** 試す図のチップの欄の値の属性。入力の帯の欄の順に書き、欄に無い鍵はその後ろに原本の並びで書く */
function tryAttrs(values: Readonly<Record<string, string>>, fields: readonly string[]): string {
  const keys = [...fields.filter((f) => Object.hasOwn(values, f)), ...Object.keys(values).filter((k) => !fields.includes(k))];
  return keys.length === 0 ? "" : ` [${keys.map((k) => `${k}: ${tryValue(values[k] ?? "")}`).join(", ")}]`;
}

/**
 * 最初の step より前の `ask <欄>, <欄> [into: <待ち行列か欄>, via: <網>]` の行。図に 1 つまでで、欄は 2 つ以上。
 * `into` は同じ名札の部品が在ればその待ち行列で、無ければ入力の帯の欄 (#3441)。欄を書いた時は、送ったチップをその欄の値と同じ名札の待ち行列へ送るので、
 * その欄は選択肢を持つ。部品と選択肢の行は入力の帯の行より後ろにも書けるので、全ての宣言を読んでから確かめる
 */
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
  state.figure.try.pending.push(() => {
    const at = valueAt(source, into);
    const part = state.figure.try.parts.find((p) => p.id === into.value);
    if (part) {
      if (part.type !== "queue") throw fail(source, at, m.wrongPart(into.value, ["queue"]));
      return;
    }
    if (!fields.some((f) => f.value === into.value)) throw fail(source, at, m.undeclaredPart(into.value));
    if (!askOf(state)?.choices?.[into.value]) throw fail(source, at, m.intoNoChoices(into.value));
  });
  const via = read.get("via");
  if (via) refer(source, via, ["route"], state);
  parts.push({ type: "ask", id: "ask", fields: fields.map((f) => f.value), into: into.value, ...(via ? { via: via.value } : {}) });
}

/** 入力の帯の部品。まだ宣言していなければ `undefined` */
const askOf = (state: ParseState): AskPart | undefined => state.figure.try.parts.find((p): p is AskPart => p.type === "ask");

/**
 * 最初の step より前の `choose <欄>: <値>, <値>` の行 (#3422)。欄は入力の帯の欄 (最初の欄も書ける) で、欄ごとに 1 行まで、
 * 選択肢は重ならない値を 2 つ以上。書いた順に選択肢を持ち、読み手はその順に並ぶ選択肢から選ぶ
 */
function readChoose(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const ask = askOf(state);
  if (!ask) throw fail(source, 0, m.noAsk);
  const text = source.text;
  const found = CHOOSE.exec(text);
  const field = found?.[1];
  if (!found || field === undefined) throw fail(source, 0, m.chooseShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  if (!ask.fields.includes(field)) throw fail(source, at, m.notChooseField(field, ask.fields));
  const choices = ask.choices ?? {};
  if (Object.hasOwn(choices, field)) throw fail(source, at, m.chooseTwice(field));
  const start = skipSpaces(text, found[0].length);
  if (start >= text.length) throw fail(source, start, m.fewChoices);
  const values = valuesOf(source, found[0].length, state);
  if (values.length < 2) throw fail(source, start, m.fewChoices);
  const valueAts = values.map((value, k) => {
    const where = Math.max(text.indexOf(value, start), start);
    if (values.indexOf(value) < k) throw fail(source, where, m.choiceTwice(value));
    return where;
  });
  ask.choices = { ...choices, [field]: values };
  // into に書いた欄の選択肢は、送ったチップの行き先の待ち行列の名札 (#3441)。同じ名札の部品が在れば into はその待ち行列なので確かめない
  if (field === ask.into)
    state.figure.try.pending.push(() => {
      const { parts } = state.figure.try;
      if (parts.some((p) => p.id === ask.into)) return;
      values.forEach((value, k) => {
        const part = parts.find((p) => p.id === value);
        if (!part) throw fail(source, valueAts[k] ?? start, m.choiceNoQueue(value, field));
        if (part.type !== "queue") throw fail(source, valueAts[k] ?? start, m.wrongPart(value, ["queue"]));
      });
    });
}

/** 欄 `field` が選択肢を持つ時、値 `value` がその選択肢のどれかか。`at` は誤りを出す位置 */
function choiceAt(source: SourceLine, field: string, value: string, at: number, state: ParseState): void {
  const choices = askOf(state)?.choices?.[field];
  if (choices && !choices.includes(value)) throw fail(source, at, state.m.notChoice(field, value, choices));
}

/** 段の中の `ask <値>, <値>` の行。値の数は入力の帯の欄の数と同じで、満杯の待ち行列へは送れない。選択肢を持つ欄の値は選択肢のどれか */
function readSend(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const ask = askOf(state);
  if (!ask) throw fail(source, 0, m.noAsk);
  const values = valuesOf(source, "ask".length, state);
  if (values.length !== ask.fields.length) throw fail(source, 0, m.askCount(ask.fields.length));
  let from = "ask".length;
  values.forEach((value, k) => {
    const at = source.text.indexOf(value, from);
    if (at >= 0) from = at + value.length;
    choiceAt(source, ask.fields[k] ?? "", value, Math.max(at, 0), state);
  });
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
      // 選択肢の行はチップの行より後ろにも書けるので、全ての宣言を読んでから確かめる
      state.figure.try.pending.push(() => {
        fieldAt(source, key, attr.at, state);
        choiceAt(source, key, attr.value, valueAt(source, attr), state);
      });
    }
    state.figure.try.items.push({ id, values });
    return;
  }
  for (const [key, attr] of read) {
    fieldAt(source, key, attr.at, state);
    choiceAt(source, key, attr.value, valueAt(source, attr), state);
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

export const reading: BlockReading<AskMessages> = {
  // 試す図の `item` の行はチップの欄の値を書くので、列の図のブロックでなく入力の帯のブロックが読む
  take: (source, state) => {
    readTryChip(source, state);
    return true;
  },
  read: {
    ask: (source, state) => (state.current() ? readSend(source, state) : readAsk(source, state)),
    choose: (source, state) => {
      if (state.current()) throw fail(source, 0, state.m.tryPartInStep("choose"));
      readChoose(source, state);
    },
  },
  print: {
    // 試す図のチップの塊は、部品の塊の直ぐ後ろに書く
    lead: (diagram) => (diagram.try && diagram.try.items.length > 0 ? [chipLines(diagram, diagram.try.items)] : []),
    // 選択肢の行は、入力の帯の行の直ぐ後ろに書いた順で書く
    part: (part) =>
      part.type === "ask"
        ? [
            `ask ${part.fields.join(", ")}${attrs([
              ["into", part.into],
              ["via", part.via],
            ])}`,
            ...Object.entries(part.choices ?? {}).map(([field, values]) => `choose ${field}: ${values.map(tryValue).join(", ")}`),
          ].join("\n")
        : "",
    events: {
      ask: (e) => `ask ${e.values.map(tryValue).join(", ")}`,
      item: (e, _kind, diagram) => `item ${e.item}${tryAttrs(e.values, askFields(diagram.try?.parts ?? []))}`,
    },
  },
  messages: {
    ja: {
      askShape: "ask は最初の step より前なら ask <欄>, <欄> [into: <待ち行列か欄>, via: <網>]、step の中なら ask <値>, <値> の形で書く",
      askTwice: "ask の行は図に 1 つまで",
      fewFields: "ask の欄は , で区切って 2 つ以上書く",
      fieldTwice: (field) => `${field} の欄はもう書いた`,
      notAskField: (field, fields) => `${field} は ask の欄 (最初の欄を除く) に無い。書けるのは ${list(fields)}`,
      noAsk: "ask <欄>, <欄> [into: <待ち行列>] の行で入力の帯を宣言してから、欄と値を書く",
      askCount: (count) => `ask の値は欄と同じ ${count} つを , で区切って書く`,
      tryItemShape: "item は最初の step より前なら item <名札> [<欄>: <値>]、step の中なら item <チップ> [<欄>: <値>] の形で書く",
      chooseShape: "choose は最初の step より前に choose <欄>: <値>, <値> の形で書く",
      notChooseField: (field, fields) => `${field} は ask の欄に無い。choose に書けるのは ${list(fields)}`,
      // 見本帳が切り出した字に「択」と「肢」が無いので、誤りの文は選択肢を「choose の値」と呼ぶ
      chooseTwice: (field) => `${field} の choose の行はもう書いた`,
      fewChoices: "choose の値は , で区切って 2 つ以上書く",
      choiceTwice: (value) => `${value} は choose の値にもう書いた`,
      notChoice: (field, value, choices) => `${value} は ${field} の choose の値に無い。書けるのは ${list(choices)}`,
      intoNoChoices: (field) => `into に書いた ${field} の欄は choose の値を持たない。choose ${field}: <待ち行列>, <待ち行列> の行を書く`,
      choiceNoQueue: (value, field) => `${value} という待ち行列が無いので、into に書いた ${field} の choose の値にできない`,
    },
    en: {
      askShape: "Write ask as ask <field>, <field> [into: <queue or field>, via: <route>] before the first step, or as ask <value>, <value> inside a step",
      askTwice: "A diagram takes at most one ask line",
      fewFields: "Write at least two ask fields, separated by ,",
      fieldTwice: (field) => `The field ${field} is already written`,
      notAskField: (field, fields) => `${field} is not an ask field other than the first. Write ${list(fields)}`,
      noAsk: "Declare the input strip with ask <field>, <field> [into: <queue>] before writing fields and values",
      askCount: (count) => `Write ${count} ask values separated by ,, one for each field`,
      tryItemShape: "Write item as item <id> [<field>: <value>] before the first step, or as item <chip> [<field>: <value>] inside a step",
      chooseShape: "Write choose as choose <field>: <value>, <value> before the first step",
      notChooseField: (field, fields) => `${field} is not an ask field. choose takes ${list(fields)}`,
      chooseTwice: (field) => `The choices for ${field} are already written`,
      fewChoices: "Write at least two choices, separated by ,",
      choiceTwice: (value) => `${value} is already a choice`,
      notChoice: (field, value, choices) => `${value} is not a choice for ${field}. Write ${list(choices)}`,
      intoNoChoices: (field) => `The field ${field} named by into has no choices. Write choose ${field}: <queue>, <queue>`,
      choiceNoQueue: (value, field) => `No queue named ${value}, so it cannot be a choice for ${field}, the field named by into`,
    },
  },
};
