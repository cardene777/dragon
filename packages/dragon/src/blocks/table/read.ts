/**
 * 表のブロックの読み方 (#3618)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 表どうしの関係の図の `table` と `field` の宣言の行と、段の中の `pick` と `set` と `note` の行を、行の形 (`take`) で読む。
 * 結びの先は後ろの表も指せるので、全ての宣言を読んでから (`settle`) 表の数と一緒に確かめる。
 * 線の端は `<表>.<項目>` の項目だけを受け (`endAt`)、結んでいない項目どうしの線と線の名前は線を読んだ後 (`afterEdge`) に止める。
 * 表どうしの関係の図に書ける行は、表と項目と段の中の 3 つの行と、線と段の行だけで、ほかの行の頭の語 (`checkHead`) は止める
 */
import { name as named } from "../../print-kit";
import { type Attr, fail, isOneOf, readAttrs, readDeclared, readName, skipSpaces } from "../../read-kit";
import type { DiagramModel } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { EDGE } from "../edge/block";
import { ER_TABLES, type ErField, type ErTable } from "./block";

/** 表どうしの関係の図の `table` の行に書ける属性の鍵 */
const TABLE_ATTRS: readonly string[] = ["color"];
/** 表どうしの関係の図に書ける行の頭の語。表と項目の行と、段の行 */
const ER_LINES: readonly string[] = ["table", "field", "step", "say", "code", "source"];
/** `field <名前>: <値>` の行。名前の位置を取る */
const FIELD = /^field\s+([^\s:]+)\s*:/du;
/** 項目の名前。`<表>.<項目>` の字で名指すので `.` を持たない */
const FIELD_NAME = /^[^\s[\]「」=:.,"]+$/u;
/** 結びの先と線の端の `<表>.<項目>` */
const FIELD_REF = /^([^\s[\]「」=:.]+)\.([^\s[\]「」=:.,"]+)$/u;
/** 段の中の `pick <表>.<項目>` と `set <表>.<項目>: <値>` と `note <表>.<項目>: <文>` の行 */
const STEP_LINE = /^(pick|set|note)\s+([^\s:]+)(\s*:\s*(.*))?$/du;

export interface TableMessages {
  /** 表どうしの関係の図に書けない行 (箱、区画、帯など) を書いた */
  erNoLine: (word: string) => string;
  /** 表の数が `least` から `most` までに収まらない */
  erTables: (least: number, most: number) => string;
  /** 最初の `table` の行より前に `field` の行を書いた */
  erFieldBeforeTable: string;
  /** `field` の行の形 */
  erFieldShape: string;
  /** 項目の名前 `name` に使えない字がある */
  erFieldName: (name: string) => string;
  /** 表 `table` に同じ名前 `name` の項目を 2 つ書いた */
  erFieldTwice: (name: string, table: string) => string;
  /** 項目を 1 つも持たない表 `table` */
  erEmptyTable: (table: string) => string;
  /** 表の名札 `id` に `.` がある */
  erTableId: (id: string) => string;
  /** 結びの先 `ref` が `<表>.<項目>` の形でない */
  erRefShape: (ref: string) => string;
  /** 結びの先 `ref` の表 `table` を宣言していない */
  erNoTable: (ref: string, table: string) => string;
  /** `<表>.<項目>` の項目 `ref` が無い */
  erNoField: (ref: string) => string;
  /** 結びの先 `ref` が結びを書いた項目と同じ表の項目 */
  erRefSame: (ref: string) => string;
  /** 結んでいない項目 `from` と `to` を線で繋いだ */
  erUnlinked: (from: string, to: string) => string;
  /** 表どうしの関係の図の線に、線の名前か名前の向きを書いた */
  erNamed: string;
  /** 段の中の `pick` か `set` か `note` の行の形 */
  erStepShape: (word: string) => string;
}

/** 読んでいる記法の、表どうしの関係の図の欄 */
const erOf = (state: ParseState) => state.figure.er;

/** `<表>.<項目>` の表と項目。形が合わなければ `undefined` */
function splitRef(ref: string): { table: string; field: string } | undefined {
  const found = FIELD_REF.exec(ref);
  return found ? { table: found[1] ?? "", field: found[2] ?? "" } : undefined;
}

/** `<表>.<項目>` の項目が宣言した表に在るか */
const hasField = (tables: readonly ErTable[], ref: string): boolean => {
  const at = splitRef(ref);
  return at !== undefined && tables.some((t) => t.id === at.table && t.fields.some((f) => f.name === at.field));
};

/** `<表>.<項目>` の項目。在る項目でなければ `at` の字を指して止める */
function fieldAt(source: SourceLine, ref: string, at: number, state: ParseState): string {
  if (!hasField(erOf(state).tables, ref)) throw fail(source, at, state.m.erNoField(ref));
  return ref;
}

/** `table <名札> as <名前> [color: <色>]` の行。名前を書かない表は名札を名前にする */
function readTable(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const declared = readDeclared(source, "table", TABLE_ATTRS, m);
  if (declared.id.includes(".")) throw fail(source, declared.idAt, m.erTableId(declared.id));
  const color = declared.attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  state.claim(source, declared.id, declared.idAt);
  const er = erOf(state);
  er.tables.push({ id: declared.id, name: declared.name ?? declared.id, ...(color ? { color: color.value as Color } : {}), fields: [] });
  er.lines.push(source);
}

/** `field <名前>: <値> [key, ref: <表>.<項目>]` の行。結びの先は全ての表を読んでから確かめる */
function readField(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const er = erOf(state);
  const table = er.tables.at(-1);
  if (!table) throw fail(source, 0, m.erFieldBeforeTable);
  const found = FIELD.exec(source.text);
  const fieldName = found?.[1];
  const nameAt = found?.indices?.[1]?.[0];
  if (!found || fieldName === undefined || nameAt === undefined) throw fail(source, 0, m.erFieldShape);
  if (!FIELD_NAME.test(fieldName)) throw fail(source, nameAt, m.erFieldName(fieldName));
  if (table.fields.some((f) => f.name === fieldName)) throw fail(source, nameAt, m.erFieldTwice(fieldName, table.id));
  const value = readName(source, found[0].length, m);
  if (value.value === "") throw fail(source, skipSpaces(source.text, found[0].length), m.erFieldShape);
  const attrs = value.rest < source.text.length ? readAttrs(source, value.rest, ["ref"], m, ["key"]) : new Map<string, Attr>();
  const ref = attrs.get("ref");
  const field: ErField = { name: fieldName, value: value.value, ...(attrs.has("key") ? { key: true as const } : {}) };
  if (ref) {
    const at = source.text.indexOf(ref.value, ref.at);
    if (!splitRef(ref.value)) throw fail(source, at, m.erRefShape(ref.value));
    field.ref = ref.value;
    er.refs.push({ source, at, from: table.id, ref: ref.value });
  }
  table.fields.push(field);
}

/** 段の中の `pick` と `set` と `note` の行 */
function readStepLine(source: SourceLine, state: ParseState, word: string): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = STEP_LINE.exec(source.text);
  const ref = found?.[2];
  const refAt = found?.indices?.[2]?.[0];
  const rest = (found?.[4] ?? "").trim();
  const shaped = word === "pick" ? found?.[3] === undefined : rest !== "";
  if (!found || ref === undefined || refAt === undefined || !shaped) throw fail(source, 0, m.erStepShape(word));
  const field = fieldAt(source, ref, refAt, state);
  if (word === "pick") step.events.push({ type: "lookup", field });
  else if (word === "set") step.events.push({ type: "cell", field, value: rest });
  else step.events.push({ type: "formula", field, text: rest });
}

/** 項目の行。鍵の印を結びより先に書く */
const fieldLine = (f: ErField): string => {
  const marks = [...(f.key ? ["key"] : []), ...(f.ref !== undefined ? [`ref: ${f.ref}`] : [])];
  return `  field ${f.name}: ${named(f.value)}${marks.length > 0 ? ` [${marks.join(", ")}]` : ""}`;
};

/** 表の宣言の塊。名前が名札と同じ表は `as` を書かない */
const tableChunk = (t: ErTable): string =>
  [`table ${t.id}${t.name === t.id ? "" : ` as ${named(t.name)}`}${t.color ? ` [color: ${t.color}]` : ""}`, ...t.fields.map(fieldLine)].join("\n");

/** 原本の表 */
const tablesOf = (diagram: DiagramModel): ErTable[] => diagram.er?.tables ?? [];

export const reading: BlockReading<TableMessages> = {
  take: (source, state, view) => {
    const { word } = view;
    if (word === "table") readTable(source, state);
    else if (word === "field") readField(source, state);
    else readStepLine(source, state, word);
    return true;
  },
  checkHead: (source, word, state) => {
    if (!ER_LINES.includes(word)) throw fail(source, 0, state.m.erNoLine(word));
  },
  settle: (state, head) => {
    const { m } = state;
    const er = erOf(state);
    if (er.tables.length < ER_TABLES.least || er.tables.length > ER_TABLES.most) throw fail(head, 0, m.erTables(ER_TABLES.least, ER_TABLES.most));
    er.tables.forEach((table, i) => {
      const line = er.lines[i];
      if (line && table.fields.length === 0) throw fail(line, 0, m.erEmptyTable(table.id));
    });
    for (const { source, at, from, ref } of er.refs) {
      const target = splitRef(ref);
      if (!target) continue;
      if (!er.tables.some((t) => t.id === target.table)) throw fail(source, at, m.erNoTable(ref, target.table));
      if (!hasField(er.tables, ref)) throw fail(source, at, m.erNoField(ref));
      if (target.table === from) throw fail(source, at, m.erRefSame(ref));
    }
  },
  endAt: (source, id, at, _side, state) => fieldAt(source, id, at, state),
  afterEdge: (edge, state, source) => {
    const { m } = state;
    const toAt = EDGE.exec(source.text)?.indices?.[2]?.[0] ?? 0;
    const refOf = (ref: string): string | undefined => {
      const at = splitRef(ref);
      return erOf(state)
        .tables.find((t) => t.id === at?.table)
        ?.fields.find((f) => f.name === at?.field)?.ref;
    };
    if (refOf(edge.from) !== edge.to && refOf(edge.to) !== edge.from) throw fail(source, toAt, m.erUnlinked(edge.from, edge.to));
    const side = (edge as { labelSide?: string }).labelSide;
    if (edge.label !== undefined || side !== undefined) throw fail(source, toAt, m.erNamed);
  },
  read: none("表どうしの関係の図の table と field と、段の中の pick と set と note の行は、行の形 (take) で読む"),
  print: {
    // 図の種類の行の直ぐ後ろ、最初の step より前に、宣言した順に表を 1 つずつ塊にして書く
    declare: (diagram) => tablesOf(diagram).map(tableChunk),
    events: {
      lookup: (e) => `pick ${e.field}`,
      cell: (e) => `set ${e.field}: ${e.value}`,
      formula: (e) => `note ${e.field}: ${e.text}`,
    },
  },
  messages: {
    ja: {
      erNoLine: (word) => `er (表どうしの関係の図) には ${word} の行を書けない。表は table の行、項目は field の行、段の中は pick と set と note と線の行で書く`,
      erTables: (least, most) => `er (表どうしの関係の図) の表は table の行で ${least} つから ${most} つまで宣言する`,
      erFieldBeforeTable: "field の行は table の行の下に書く。項目は直ぐ上の table の行の表に入る",
      erFieldShape: "項目は field <名前>: <値> [key, ref: <表>.<項目>] の形で書く",
      erFieldName: (name) => `${name} は項目の名前に使えない。項目は <表>.<項目> で名指すので、名前に . と空白と [ ] と : を入れない`,
      erFieldTwice: (name, table) => `${table} の表に ${name} の項目が 2 つある。1 つの表の項目の名前は重ねない`,
      erEmptyTable: (table) => `${table} の表に項目が無い。table の行の下に field の行を 1 つ以上書く`,
      erTableId: (id) => `${id} は表の名札に使えない。項目は <表>.<項目> で名指すので、表の名札に . を入れない`,
      erRefShape: (ref) => `結びの先 ${ref} は ref: <表>.<項目> の形で書く`,
      erNoTable: (ref, table) => `結びの先 ${ref} の ${table} という表は宣言していない。table ${table} の行で宣言する`,
      erNoField: (ref) => `${ref} という項目は無い。<表>.<項目> は宣言した表の field の行の名前で書く`,
      erRefSame: (ref) => `結びの先 ${ref} は同じ表の項目なので結べない。結びは別の表の項目を指す`,
      erUnlinked: (from, to) => `${from} と ${to} は結んでいないので線を引けない。線は ref で結んだ項目どうしに引く`,
      erNamed: "er (表どうしの関係の図) の線には名前を書けない。走る値は [tag: <値>] で書く",
      erStepShape: (word) => (word === "pick" ? "行を選ぶ段の行は pick <表>.<項目> の形で書く" : `段の中の ${word} の行は ${word} <表>.<項目>: <${word === "set" ? "値" : "文"}> の形で書く`),
    },
    en: {
      erNoLine: (word) => `A table relation diagram (er) takes no ${word} lines. Write tables with table lines, fields with field lines, and pick, set, note and edge lines inside steps`,
      erTables: (least, most) => `A table relation diagram (er) declares ${least} to ${most} tables with table lines`,
      erFieldBeforeTable: "Write a field line under a table line. The field goes into the table of the nearest table line above",
      erFieldShape: "Write a field as field <name>: <value> [key, ref: <table>.<field>]",
      erFieldName: (name) => `${name} cannot be a field name. Fields are named as <table>.<field>, so a name takes no dot, space, brackets or colon`,
      erFieldTwice: (name, table) => `The table ${table} has two fields named ${name}. Give each field of a table its own name`,
      erEmptyTable: (table) => `The table ${table} has no fields. Write one or more field lines under the table line`,
      erTableId: (id) => `${id} cannot be a table id. Fields are named as <table>.<field>, so a table id takes no dot`,
      erRefShape: (ref) => `Write the link target ${ref} as ref: <table>.<field>`,
      erNoTable: (ref, table) => `The link target ${ref} names no declared table ${table}. Declare it with a table ${table} line`,
      erNoField: (ref) => `There is no field ${ref}. Write <table>.<field> with the name of a field line of a declared table`,
      erRefSame: (ref) => `The link target ${ref} is a field of the same table. A link points at a field of another table`,
      erUnlinked: (from, to) => `${from} and ${to} are not linked, so no line runs between them. Draw lines between fields linked with ref`,
      erNamed: "A line of a table relation diagram (er) takes no label. Write the value that runs as [tag: <value>]",
      erStepShape: (word) => (word === "pick" ? "Write a pick line inside a step as pick <table>.<field>" : `Write a ${word} line inside a step as ${word} <table>.<field>: <${word === "set" ? "value" : "text"}>`),
    },
  },
};
