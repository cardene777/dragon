/**
 * 人が書く dragon記法を、図の原本の JSON へ変える (#3137)。
 *
 * 行の種類は行の頭の英語の語で決まり、線の行だけは箱の名札から始まる。最初の `step` より前に
 * 図の種類と題と区画と箱と帯を宣言し、`step` ごとに、その段で起きることを起きる順に並べる。
 *
 *   sequence <題> [view: fixed か follow]                書かなければ字の大きさで選ぶ
 *   group <名札> as <名前> [note: <添え書き>, color: <色>, icon: <印>]
 *     box <名札> as <名前> [note: <下の小さな字>, color: <色>, icon: <印>]
 *   end                                                  同じ名札の group はもう一度開ける
 *   box <名札> as <名前> [...]                           as が無ければ名札を名前にする
 *   strip <題>: <欄>, <欄>
 *   step <段の題>
 *     say <段の本文>                                     say の下に字下げした行は本文の続き
 *     code <段で打つ命令>
 *     <名札> -> <名札>: <線の名前> [carry: <運ぶ物>, tag: <値>, side: <側>]
 *     act <名札>: <処理の名前>                           箱の中の処理
 *     note <名札>: <字>                                   箱の下の小さな字の書き換え
 *     set <欄>: <値> [tag: <札>]                          中身の帯の値
 *
 * 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べて行の終わりに置く。
 * 空白を含む名前と文は行の終わりか `[` の前に置き、`[` を含む名前と `,` か `]` を含む属性の値だけを
 * `"` で囲む。囲みの中では `\"` が `"`、`\\` が `\` になる。字下げは `say` の続きの行を見分ける時だけ意味を持つ。
 *
 * 行の頭の語と同じ綴りの名札 (`end` や `step`) も書ける。名札の次に `->` が来る行は線と読む。
 * 誤りは最初の 1 つで止め、行と列を示す。誤りの文の言葉は呼ぶ側が渡す。
 */
import { type Messages, messagesFor, type Shape } from "./messages";
import { type Box, type Carry, type Color, COLORS, type Diagram, type DiagramEvent, type LabelSide, type Region, type Step, type ViewMode } from "./schema";
import { columnOf, isBlankOrComment, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION } from "./version";
import { AS, ATTRS, CARRIES, HEADS, KINDS, type NotationLang, OLD_HEADS, SIDES, VIEWS } from "./words";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Parsed = { ok: true; diagram: Diagram } | { ok: false; errors: LineError[] };

export interface ParseOptions {
  /** 誤りの文の言葉。既定は日本語 */
  lang?: NotationLang;
}

class NotationError extends Error {
  constructor(
    readonly line: number,
    readonly column: number,
    message: string,
  ) {
    super(message);
  }
}

const fail = (source: SourceLine, index: number, message: string): NotationError =>
  new NotationError(source.line, columnOf(source, index), message);

/** 名札に使える字。原本の JSON の名札の形と同じ */
const ID = /^[^\s[\]「」=:]+$/u;
/** 線の行。名札、`->`、名札 */
const EDGE = /^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du;

const isOneOf = <T extends string>(list: readonly T[], word: string): word is T => (list as readonly string[]).includes(word);

/** `at` から空白を飛ばした位置 */
function skipSpaces(text: string, at: number): number {
  let i = at;
  while (i < text.length && /\s/u.test(text[i] ?? "")) i++;
  return i;
}

/** `[<鍵>: <値>]` の 1 つ。`at` は鍵の位置 */
interface Attr {
  value: string;
  at: number;
}

/** `at` の `"` から閉じる `"` までを読む。`end` は閉じた `"` の次 */
function readQuoted(source: SourceLine, at: number, m: Messages): { value: string; end: number } {
  const text = source.text;
  let value = "";
  for (let i = at + 1; i < text.length; i++) {
    const c = text[i] ?? "";
    const next = text[i + 1] ?? "";
    if (c === "\\" && (next === '"' || next === "\\")) {
      value += next;
      i++;
    } else if (c === '"') {
      return { value, end: i + 1 };
    } else {
      value += c;
    }
  }
  throw fail(source, at, m.quoteUnclosed);
}

/**
 * `at` から名前か文を読む。`"` で始まれば囲みの中、そうでなければ `[` の前か行の終わりまで。
 * `rest` は名前の後ろの位置で、行の終わりか属性の `[` を指す。
 */
function readName(source: SourceLine, at: number, m: Messages): { value: string; rest: number } {
  const text = source.text;
  const start = skipSpaces(text, at);
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    const rest = skipSpaces(text, quoted.end);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterQuote);
    return { value: quoted.value, rest };
  }
  const open = text.indexOf("[", start);
  const rest = open < 0 ? text.length : open;
  return { value: text.slice(start, rest).trim(), rest };
}

/** `at` の `[` から行の終わりの `]` までの属性を読む。`allowed` に無い鍵は誤り */
function readAttrs(source: SourceLine, at: number, allowed: readonly string[], m: Messages): Map<string, Attr> {
  const text = source.text;
  if (!text.endsWith("]")) throw fail(source, at, m.attrUnclosed);
  const close = text.length - 1;
  const attrs = new Map<string, Attr>();
  for (let i = at + 1; ; ) {
    const start = skipSpaces(text, i);
    let colon = start;
    while (colon < close && text[colon] !== ":" && text[colon] !== ",") colon++;
    if (colon >= close || text[colon] !== ":") throw fail(source, start, m.attrNoColon(text.slice(start, colon).trim()));
    const key = text.slice(start, colon).trim();
    if (!allowed.includes(key)) throw fail(source, start, m.badAttr(key, allowed));
    if (attrs.has(key)) throw fail(source, start, m.attrTwice(key));
    let end = skipSpaces(text, colon + 1);
    let value: string;
    if (text[end] === '"') {
      const quoted = readQuoted(source, end, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
      if (end < close && text[end] !== ",") throw fail(source, end, m.afterQuote);
    } else {
      const comma = text.indexOf(",", end);
      const stop = comma < 0 || comma > close ? close : comma;
      value = text.slice(end, stop).trim();
      end = stop;
    }
    if (value === "") throw fail(source, start, m.attrNoValue(key));
    attrs.set(key, { value, at: start });
    if (end >= close) return attrs;
    i = end + 1;
  }
}

/** `at` から `,` で区切った字の並びを行の終わりまで読む */
function readList(source: SourceLine, at: number, m: Messages): string[] {
  const text = source.text;
  const items: string[] = [];
  for (let i = at; ; ) {
    const start = skipSpaces(text, i);
    let value: string;
    let end: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
      if (end < text.length && text[end] !== ",") throw fail(source, end, m.afterQuote);
    } else {
      const comma = text.indexOf(",", start);
      end = comma < 0 ? text.length : comma;
      value = text.slice(start, end).trim();
    }
    if (value === "") throw fail(source, start, m.emptyStripField);
    items.push(value);
    if (end >= text.length) return items;
    i = end + 1;
  }
}

/** `group` と `box` の行の、名札と `as` の後ろの名前と属性 */
interface Declared {
  id: string;
  idAt: number;
  name?: string;
  attrs: Map<string, Attr>;
}

function readDeclared(source: SourceLine, word: string, allowed: readonly string[], m: Messages): Declared {
  const text = source.text;
  const start = skipSpaces(text, word.length);
  const id = /^[^\s[]+/u.exec(text.slice(start))?.[0];
  if (id === undefined) throw fail(source, 0, m.needsId(word));
  if (!ID.test(id)) throw fail(source, start, m.badId(id));
  let rest = skipSpaces(text, start + id.length);
  let name: string | undefined;
  if (text.startsWith(AS, rest) && /^(\s|$)/u.test(text.slice(rest + AS.length, rest + AS.length + 1))) {
    const named = readName(source, rest + AS.length, m);
    if (named.value === "") throw fail(source, rest, m.emptyName(id));
    name = named.value;
    rest = named.rest;
  }
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterId);
  const attrs = rest < text.length ? readAttrs(source, rest, allowed, m) : new Map<string, Attr>();
  return { id, idAt: start, ...(name !== undefined ? { name } : {}), attrs };
}

/** 区画と箱の属性 (`note` と `color` と `icon`) */
function lookOf(source: SourceLine, attrs: Map<string, Attr>, m: Messages): { note?: string; color?: Color; icon?: string } {
  const color = attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const note = attrs.get("note")?.value;
  const icon = attrs.get("icon")?.value;
  return {
    ...(note !== undefined ? { note } : {}),
    ...(color ? { color: color.value as Color } : {}),
    ...(icon !== undefined ? { icon } : {}),
  };
}

/**
 * 前の形 (#2997 まで) の行なら、その印と、新しい形で書く行の形。`inStep` は段の中の行か。
 * 新しい形で読めない行の誤りの文で、書き直し方を示すために引く。
 */
function oldForm(text: string, inStep: boolean): { word: string; shape: Shape } | undefined {
  const first = text.split(/\s/u)[0] ?? "";
  if (first === "帯") return { word: first, shape: inStep ? "set" : "strip" };
  if (Object.hasOwn(OLD_HEADS, first)) return { word: first, shape: OLD_HEADS[first as keyof typeof OLD_HEADS] };
  if (text.startsWith("#")) return { word: "#", shape: "step" };
  if (text.startsWith(">")) return { word: ">", shape: "say" };
  if (text.startsWith("`")) return { word: "`", shape: "code" };
  if (text.includes("「")) return { word: "「」", shape: inStep ? "note" : "box" };
  if (/^[^\s=:]+\s*=(?!>)/u.test(text)) return { word: "=", shape: "box" };
  if (inStep && /^[^\s:]+\s*:/u.test(text)) return { word: ":", shape: "act" };
  return undefined;
}

/** 読んでいる段。`body` は `say` を読むまで無い */
interface Building {
  source: SourceLine;
  title: string;
  body?: string[];
  code?: string;
  events: DiagramEvent[];
}

function parseLines(lines: SourceLine[], m: Messages): Diagram {
  const headAt = lines.findIndex((source) => !isBlankOrComment(source));
  const head = lines[headAt];
  if (!head) throw new NotationError(1, 1, m.noHead);
  const kind = head.text.split(/\s/u)[0] ?? "";
  if (!isOneOf(KINDS, kind)) {
    const old = oldForm(head.text, false);
    throw fail(head, 0, old ? m.oldForm(old.word, old.shape) : m.badHead);
  }
  const titled = readName(head, kind.length, m);
  if (titled.value === "") throw fail(head, 0, m.badHead);
  const title = titled.value;
  const shown = titled.rest < head.text.length ? readAttrs(head, titled.rest, ATTRS.diagram, m).get("view") : undefined;
  if (shown && !isOneOf(VIEWS, shown.value)) throw fail(head, shown.at, m.badView);
  const view = shown?.value as ViewMode | undefined;

  const regions: Region[] = [];
  const boxes: Box[] = [];
  const ids = new Set<string>();
  let strip: { title: string; fields: string[] } | undefined;
  const steps: Step[] = [];
  let building: Building | undefined;
  /** 開いている `group` */
  let group: { source: SourceLine; id: string } | undefined;

  const declare = (source: SourceLine, id: string, at: number): void => {
    if (ids.has(id)) throw fail(source, at, m.duplicate(id));
    ids.add(id);
  };
  const boxAt = (source: SourceLine, id: string, at: number): string => {
    if (!boxes.some((box) => box.id === id)) throw fail(source, at, m.undeclaredBox(id));
    return id;
  };
  /** 段の中に書く行の、書き先の段。最初の `step` より前なら誤り */
  const inStep = (source: SourceLine): Building => {
    if (!building) throw fail(source, 0, m.stepLineBeforeStep);
    return building;
  };
  /** 宣言の行。最初の `step` より後なら誤り */
  const beforeSteps = (source: SourceLine): void => {
    if (building) throw fail(source, 0, m.declarationInStep);
  };
  const finish = (): void => {
    if (!building) return;
    if (building.body === undefined) throw fail(building.source, 0, m.noBody(building.title));
    steps.push({
      title: building.title,
      body: building.body.join("\n"),
      ...(building.code !== undefined ? { code: building.code } : {}),
      events: building.events,
    });
  };

  const rest = lines.slice(headAt + 1);
  for (let i = 0; i < rest.length; i++) {
    const source = rest[i];
    if (!source || isBlankOrComment(source)) continue;
    const text = source.text;
    // 名札の次に `->` が来る行は、名札が行の頭の語と同じ綴りでも線と読む
    const edge = EDGE.exec(text);
    if (edge) {
      inStep(source).events.push(readEdge(source, edge));
      continue;
    }
    const word = text.split(/\s/u)[0] ?? "";
    if (!isOneOf(HEADS, word)) {
      const old = oldForm(text, building !== undefined);
      throw fail(source, 0, old ? m.oldForm(old.word, old.shape) : m.unknownHead(word));
    }
    switch (word) {
      case "group":
        readGroup(source);
        break;
      case "end":
        if (text !== word) throw fail(source, word.length, m.endTakesNothing);
        if (!group) throw fail(source, 0, m.strayEnd);
        group = undefined;
        break;
      case "box":
        readBox(source);
        break;
      case "strip":
        readStrip(source);
        break;
      case "step": {
        if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
        finish();
        const stepTitle = text.slice(word.length).trim();
        if (stepTitle === "") throw fail(source, 0, m.emptyStepTitle);
        building = { source, title: stepTitle, events: [] };
        break;
      }
      case "say":
        i = readSay(source, i);
        break;
      case "code": {
        const step = inStep(source);
        if (step.code !== undefined) throw fail(source, 0, m.codeTwice);
        const command = text.slice(word.length).trim();
        if (command === "") throw fail(source, 0, m.emptyCode);
        step.code = command;
        break;
      }
      case "act": {
        const step = inStep(source);
        const on = readOnBox(source, word, m.actShape);
        step.events.push({ type: "action", box: on.box, label: on.text });
        break;
      }
      case "note": {
        const step = inStep(source);
        const on = readOnBox(source, word, m.noteShape);
        step.events.push({ type: "swap", box: on.box, text: on.text });
        break;
      }
      case "set":
        inStep(source).events.push(readSet(source));
        break;
    }
  }
  if (group) throw fail(group.source, 0, m.unclosedGroup(group.id));
  finish();

  if (boxes.length === 0) throw fail(head, 0, m.noBoxes);
  if (steps.length === 0) throw fail(head, 0, m.noSteps);

  return {
    version: FORMAT_VERSION,
    kind,
    title,
    ...(view ? { view } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(strip ? { strip } : {}),
    steps,
    ...(kind === "sequence" ? { sequence: { lifelines: boxes.map((box) => box.id) } } : {}),
  };

  /** `group` の行。同じ名札をもう一度開いた時は、名前も属性も書かない */
  function readGroup(source: SourceLine): void {
    beforeSteps(source);
    if (group) throw fail(source, 0, m.nestedGroup);
    const declared = readDeclared(source, "group", ATTRS.group, m);
    if (regions.some((region) => region.id === declared.id)) {
      if (declared.name !== undefined || declared.attrs.size > 0) throw fail(source, 0, m.regionReopened(declared.id));
    } else {
      declare(source, declared.id, declared.idAt);
      regions.push({ id: declared.id, name: declared.name ?? declared.id, ...lookOf(source, declared.attrs, m) });
    }
    group = { source, id: declared.id };
  }

  /** `box` の行。開いている `group` の中なら、その区画に置く */
  function readBox(source: SourceLine): void {
    beforeSteps(source);
    const declared = readDeclared(source, "box", ATTRS.box, m);
    declare(source, declared.id, declared.idAt);
    const { note, ...look } = lookOf(source, declared.attrs, m);
    boxes.push({
      id: declared.id,
      name: declared.name ?? declared.id,
      ...(note !== undefined ? { sub: note } : {}),
      ...look,
      ...(group ? { region: group.id } : {}),
    });
  }

  /** `strip <題>: <欄>, <欄>` の行 */
  function readStrip(source: SourceLine): void {
    beforeSteps(source);
    if (strip) throw fail(source, 0, m.stripTwice);
    const text = source.text;
    const start = skipSpaces(text, "strip".length);
    let stripTitle: string;
    let colon: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      stripTitle = quoted.value;
      colon = skipSpaces(text, quoted.end);
    } else {
      colon = text.indexOf(":", start);
      stripTitle = colon < 0 ? "" : text.slice(start, colon).trim();
    }
    if (stripTitle === "" || text[colon] !== ":") throw fail(source, 0, m.stripShape);
    strip = { title: stripTitle, fields: readList(source, colon + 1, m) };
  }

  /**
   * `say` の行と、その下に `say` より深く字下げして続けた行を段の本文にする。
   * 続きの行の間の空行は本文の空の行になる。返すのは読み終えた最後の行の番号。
   */
  function readSay(source: SourceLine, index: number): number {
    const step = inStep(source);
    if (step.body !== undefined) throw fail(source, 0, m.sayTwice);
    const inline = source.text.slice("say".length).trim();
    const body = inline === "" ? [] : [inline];
    let blanks = 0;
    let last = index;
    for (let j = index + 1; j < rest.length; j++) {
      const next = rest[j];
      if (!next) break;
      if (next.text === "") {
        blanks++;
        continue;
      }
      if (next.indent <= source.indent) break;
      body.push(...Array.from({ length: blanks }, () => ""), next.text);
      blanks = 0;
      last = j;
    }
    if (body.length === 0) throw fail(source, 0, m.emptySay);
    step.body = body;
    return last;
  }

  /** `act <名札>: <字>` と `note <名札>: <字>` の行の、箱と字 */
  function readOnBox(source: SourceLine, word: "act" | "note", shape: string): { box: string; text: string } {
    const found = new RegExp(`^${word}\\s+([^\\s:]+)\\s*:\\s*(.*)$`, "du").exec(source.text);
    const idAt = found?.indices?.[1]?.[0];
    if (!found || idAt === undefined || (found[2] ?? "") === "") throw fail(source, 0, shape);
    return { box: boxAt(source, found[1] ?? "", idAt), text: found[2] ?? "" };
  }

  /** `<名札> -> <名札>: <線の名前> [<属性>]` の行 */
  function readEdge(source: SourceLine, edge: RegExpExecArray): DiagramEvent {
    const text = source.text;
    const from = boxAt(source, edge[1] ?? "", edge.indices?.[1]?.[0] ?? 0);
    const to = boxAt(source, edge[2] ?? "", edge.indices?.[2]?.[0] ?? 0);
    let at = skipSpaces(text, edge[0].length);
    let label: string | undefined;
    if (text[at] === ":") {
      const named = readName(source, at + 1, m);
      if (named.value === "") throw fail(source, at, m.emptyLabel);
      label = named.value;
      at = named.rest;
    }
    if (at < text.length && text[at] !== "[") throw fail(source, at, m.edgeShape);
    const attrs = at < text.length ? readAttrs(source, at, ATTRS.edge, m) : new Map<string, Attr>();
    const tag = attrs.get("tag");
    const carried = attrs.get("carry");
    if (tag && carried) throw fail(source, Math.max(tag.at, carried.at), m.carryTwice);
    if (carried && !isOneOf(CARRIES, carried.value)) throw fail(source, carried.at, m.badCarry);
    const side = attrs.get("side");
    if (side && !isOneOf(SIDES, side.value)) throw fail(source, side.at, m.badSide);
    let carry: Carry = { kind: "envelope" };
    if (tag) carry = { kind: "tag", text: tag.value };
    else if (carried) carry = carried.value === "coin" ? { kind: "coin" } : { kind: "none" };
    return {
      type: "edge",
      from,
      to,
      ...(label !== undefined ? { label } : {}),
      carry,
      ...(side ? { labelSide: side.value as LabelSide } : {}),
    };
  }

  /** `set <欄>: <値> [tag: <札>]` か `set <欄> [tag: <札>]` の行 */
  function readSet(source: SourceLine): DiagramEvent {
    const declared = strip;
    if (!declared) throw fail(source, 0, m.stripUndeclared);
    const text = source.text;
    const start = skipSpaces(text, "set".length);
    let field: string;
    let at: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      field = quoted.value;
      at = skipSpaces(text, quoted.end);
    } else {
      at = start;
      while (at < text.length && text[at] !== ":" && text[at] !== "[") at++;
      field = text.slice(start, at).trim();
    }
    if (!declared.fields.includes(field)) throw fail(source, start, m.noSuchField(field));
    let value: string | undefined;
    if (text[at] === ":") {
      const named = readName(source, at + 1, m);
      if (named.value === "") throw fail(source, at, m.stripNeedsValue);
      value = named.value;
      at = named.rest;
    }
    if (at < text.length && text[at] !== "[") throw fail(source, at, m.stripNeedsValue);
    const tag = at < text.length ? readAttrs(source, at, ATTRS.set, m).get("tag")?.value : undefined;
    if (value === undefined && tag === undefined) throw fail(source, 0, m.stripNeedsValue);
    return {
      type: "strip",
      field,
      ...(value !== undefined ? { value } : {}),
      ...(tag !== undefined ? { tag } : {}),
    };
  }
}

export function parseNotation(notation: string, options: ParseOptions = {}): Parsed {
  try {
    return { ok: true, diagram: parseLines(tokenize(notation), messagesFor(options.lang ?? "ja")) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
