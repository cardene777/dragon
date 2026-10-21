/**
 * 人が書く記法を、図の原本の JSON へ変える。
 *
 * 記法は 1 行が 1 本の線になる行ごとの文で、最初の段の見出しより前に図の種類と題と箱を宣言し、
 * 段ごとに見出し (`#`) と本文 (`>`) の下へ、その段で起きることを起きる順に 1 行ずつ並べる。
 *
 *   時系列図 <題>
 *   見せ方 <止める か 寄る>                            書かなければ字の大きさで選ぶ
 *   区画 <名札> = <名前>「<添え書き>」 [色 <色>] [印 <印>]
 *   <名札> = <名前>「<下の小さな字>」 [色 <色>] [印 <印>] [区画 <名札>]
 *   帯 <題> = <欄>, <欄>
 *   # <段の題>
 *   > <段の本文>
 *   `<段で打つ命令>`
 *   <名札> -> <名札> : <線の名前> [札 <値>] [名前 上]   線。運ぶ物を書かなければ封筒が走る
 *   <名札> : <処理の名前>                              箱の中の処理
 *   <名札>「<字>」                                     箱の下の小さな字の書き換え
 *   帯 <欄> = <値> [<札>]                              中身の帯の値
 *
 * 語は英語でも書ける (#2997)。`sequence` / `architecture` で始めた file は、語を `words.ts` の表の
 * 英語の語で書き、`「…」` の代わりに `"…"` でも囲める。1 つの file の言葉は最初の行の図の種類の語で
 * 決まり、違う言葉の語を書いた行は誤りにする。誤りの文も file の言葉で出す。
 *
 * 行の頭の語と同じ綴りの名札 (`帯` や `strip`) も書ける。行の頭の語と名札は行の形で見分け、
 * 名札の次に `->` か `:` か `=` か囲みが来る行は箱の行と読む。
 *
 * 誤りは最初の 1 つで止め、行と列を示す。
 */
import { type Messages, messagesFor } from "./messages";
import { type Box, type Carry, type Color, COLORS, type Diagram, type DiagramEvent, type LabelSide, type Region, type Step, type ViewMode } from "./schema";
import { columnOf, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION } from "./version";
import { languageOf, type NotationLang, otherLang, valueOf, wordOf, type WORDS } from "./words";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Parsed = { ok: true; diagram: Diagram } | { ok: false; errors: LineError[] };

export interface ParseOptions {
  /** 最初の行が読めず file の言葉が決まらない時に、誤りの文に使う言葉。既定は日本語 */
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

/** `[鍵 値]` の指定。`raw` は括弧の中身そのまま、`at` は `[` の位置。 */
interface Attr {
  raw: string;
  key: string;
  value: string;
  at: number;
}

/** 行の `start` から後ろの終わりに並ぶ `[...]` を外す。`end` は残った字の終わり。 */
function trailingAttrs(source: SourceLine, start: number): { end: number; attrs: Attr[] } {
  const attrs: Attr[] = [];
  let end = source.text.length;
  for (;;) {
    const found = /\s*\[([^[\]]*)\]$/.exec(source.text.slice(start, end));
    if (!found) break;
    const raw = (found[1] ?? "").trim();
    const [key = "", ...words] = raw.split(/\s+/);
    attrs.unshift({ raw, key, value: words.join(" "), at: start + found.index + found[0].indexOf("[") });
    end = start + found.index;
  }
  return { end, attrs };
}

const escape = (word: string): string => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 字を囲む形。日本語の語の file は「」だけ、英語の語の file は「」と "" を読む */
const QUOTES: Record<NotationLang, readonly (readonly [string, string])[]> = {
  ja: [["「", "」"]],
  en: [
    ["「", "」"],
    ['"', '"'],
  ],
};

/** `<名前>「<添え書き>」` を名前と添え書きに分ける。 */
function nameAndNote(text: string, lang: NotationLang): { name: string; note?: string } {
  for (const [open, close] of QUOTES[lang]) {
    const found = new RegExp(`^(.*?)\\s*${escape(open)}(.*)${escape(close)}$`).exec(text);
    if (found) return { name: (found[1] ?? "").trim(), note: found[2] ?? "" };
  }
  return { name: text.trim() };
}

/** `<名札>「<字>」` の書き換えの行。名札と字の位置を返す */
function swapLine(text: string, lang: NotationLang): RegExpExecArray | null {
  const opens = QUOTES[lang].map(([o]) => escape(o)).join("");
  for (const [open, close] of QUOTES[lang]) {
    const found = new RegExp(`^([^\\s${opens}]+)\\s*${escape(open)}(.*)${escape(close)}$`, "d").exec(text);
    if (found) return found;
  }
  return null;
}

/**
 * 1 つの言葉の、行の頭の語で始まる行の形。
 * `reading` は読んでいる file の言葉で、帯の値の行から外す箱の行 (名札の次に囲みが来る行) の形を決める。
 */
function headShapes(lang: NotationLang, reading: NotationLang) {
  const head = (key: keyof typeof WORDS.head): string => escape(wordOf("head", key, lang));
  const opens = QUOTES[reading].map(([open]) => `|${escape(open)}`).join("");
  return {
    view: new RegExp(`^${head("view")}\\s+(\\S+)$`),
    strip: new RegExp(`^${head("strip")}\\s+(.+?)\\s*=\\s*(.+)$`),
    region: new RegExp(`^${head("region")}\\s+([^\\s=]+)\\s*=\\s*`, "d"),
    // 空白を全部読んでから次の字を見る (`\s` を外すと、空白 2 つの `帯  -> 受け手` を帯の値と読む)
    stripValue: new RegExp(`^${head("strip")}\\s+(?!\\s|->|:|=${opens})`),
  };
}

interface Building {
  source: SourceLine;
  title: string;
  body: string[];
  code?: string;
  events: DiagramEvent[];
}

function parseLines(lines: SourceLine[], fallback: NotationLang): Diagram {
  const [head, ...rest] = lines;
  if (!head) throw new NotationError(1, 1, messagesFor(fallback).noHead);
  const found = languageOf(head.text);
  const m: Messages = messagesFor(found ?? fallback);
  const header = /^(\S+)\s+(.+)$/.exec(head.text);
  const kind = found && valueOf("kind", header?.[1] ?? "", found);
  if (!found || !header || !kind) throw fail(head, 0, m.badHead);
  const lang: NotationLang = found;
  const title = header[2] ?? "";

  const other = otherLang(lang);
  const own = headShapes(lang, lang);
  const foreign = headShapes(other, lang);
  /** 違う言葉の語を書いた行の誤り。`group` の役割の、この file の言葉の語を示す */
  const foreignWord = <G extends keyof typeof WORDS>(source: SourceLine, at: number, group: G, word: string): NotationError =>
    fail(source, at, m.otherLanguageWord(word, wordOf(group, valueOf(group, word, other) as keyof (typeof WORDS)[G], lang)));

  const regions: Region[] = [];
  const boxes: Box[] = [];
  const ids = new Set<string>();
  let strip: { title: string; fields: string[] } | undefined;
  let view: ViewMode | undefined;
  const steps: Step[] = [];
  let building: Building | undefined;

  const declare = (source: SourceLine, id: string, at: number): void => {
    if (ids.has(id)) throw fail(source, at, m.duplicate(id));
    ids.add(id);
  };
  const boxAt = (source: SourceLine, id: string, at: number): string => {
    if (!boxes.some((box) => box.id === id)) throw fail(source, at, m.undeclaredBox(id));
    return id;
  };
  const finish = (): void => {
    if (!building) return;
    if (building.body.length === 0) throw fail(building.source, 0, m.noBody(building.title));
    steps.push({
      title: building.title,
      body: building.body.join("\n"),
      ...(building.code !== undefined ? { code: building.code } : {}),
      events: building.events,
    });
  };

  for (const source of rest) {
    const text = source.text;
    if (text.startsWith("#")) {
      finish();
      const stepTitle = text.slice(1).trim();
      if (stepTitle === "") throw fail(source, 0, m.emptyStepTitle);
      building = { source, title: stepTitle, body: [], events: [] };
      continue;
    }
    if (!building) {
      parseDeclaration(source);
      continue;
    }
    building.events.push(...parseStepLine(source, building));
  }
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

  function parseDeclaration(source: SourceLine): void {
    const text = source.text;
    const viewDecl = own.view.exec(text);
    if (viewDecl) {
      if (view) throw fail(source, 0, m.viewTwice);
      const word = viewDecl[1] ?? "";
      const at = text.indexOf(word);
      const chosen = valueOf("view", word, lang);
      if (!chosen) {
        if (valueOf("view", word, other) !== undefined) throw foreignWord(source, at, "view", word);
        throw fail(source, at, m.badView);
      }
      view = chosen;
      return;
    }
    const stripDecl = own.strip.exec(text);
    if (stripDecl) {
      if (strip) throw fail(source, 0, m.stripTwice);
      const fields = (stripDecl[2] ?? "").split(",").map((field) => field.trim());
      if (fields.some((field) => field === "")) throw fail(source, 0, m.emptyStripField);
      strip = { title: stripDecl[1] ?? "", fields };
      return;
    }
    const regionDecl = own.region.exec(text);
    const boxDecl = regionDecl ? undefined : /^([^\s=]+)\s*=(?!>)\s*/d.exec(text);
    const decl = regionDecl ?? boxDecl;
    if (!decl?.indices?.[1]) {
      if (foreign.view.test(text) || foreign.strip.test(text) || foreign.region.test(text)) {
        throw foreignWord(source, 0, "head", text.split(/\s+/)[0] ?? "");
      }
      if (looksLikeStepLine(text, lang)) throw fail(source, 0, m.stepLineBeforeStep);
      throw fail(source, 0, m.unreadableDeclaration);
    }
    const id = decl[1] ?? "";
    declare(source, id, decl.indices[1][0]);
    const { end, attrs } = trailingAttrs(source, decl[0].length);
    const { name, note } = nameAndNote(text.slice(decl[0].length, end), lang);
    if (name === "") throw fail(source, decl[0].length, m.emptyName(id));
    const look: { color?: Color; icon?: string; region?: string } = {};
    for (const attr of attrs) {
      const key = valueOf("attr", attr.key, lang);
      if (key === "color") {
        if (!COLORS.includes(attr.value as Color)) throw fail(source, attr.at, m.badColor);
        look.color = attr.value as Color;
      } else if (key === "icon" && attr.value !== "") {
        look.icon = attr.value;
      } else if (key === "region" && !regionDecl) {
        if (!regions.some((region) => region.id === attr.value)) throw fail(source, attr.at, m.regionFirst(attr.value));
        look.region = attr.value;
      } else {
        if (valueOf("attr", attr.key, other) !== undefined) throw foreignWord(source, attr.at, "attr", attr.key);
        throw fail(source, attr.at, m.badAttr(attr.raw));
      }
    }
    if (regionDecl) {
      regions.push({
        id,
        name,
        ...(note !== undefined ? { note } : {}),
        ...(look.color ? { color: look.color } : {}),
        ...(look.icon ? { icon: look.icon } : {}),
      });
      return;
    }
    boxes.push({
      id,
      name,
      ...(note !== undefined ? { sub: note } : {}),
      ...(look.color ? { color: look.color } : {}),
      ...(look.icon ? { icon: look.icon } : {}),
      ...(look.region ? { region: look.region } : {}),
    });
  }

  function parseStepLine(source: SourceLine, step: Building): DiagramEvent[] {
    const text = source.text;
    if (text.startsWith(">")) {
      step.body.push(text.slice(1).trim());
      return [];
    }
    const code = /^`(.*)`$/.exec(text);
    if (code) {
      if (step.code !== undefined) throw fail(source, 0, m.codeTwice);
      step.code = code[1] ?? "";
      return [];
    }
    if (own.stripValue.test(text)) return [parseStripValue(source)];
    if (foreign.stripValue.test(text)) throw foreignWord(source, 0, "head", text.split(/\s+/)[0] ?? "");
    if (text.includes("->")) return [parseEdge(source)];
    if (/^[^\s=]+\s*=(?!>)/.test(text)) throw fail(source, 0, m.declarationInStep);
    const swap = swapLine(text, lang);
    if (swap?.indices?.[1]) {
      const box = boxAt(source, swap[1] ?? "", swap.indices[1][0]);
      if ((swap[2] ?? "") === "") throw fail(source, swap.indices[1][1], m.emptySwap);
      return [{ type: "swap", box, text: swap[2] ?? "" }];
    }
    const action = /^([^\s:]+)\s*:\s*(.+)$/d.exec(text);
    if (action?.indices?.[1]) return [{ type: "action", box: boxAt(source, action[1] ?? "", action.indices[1][0]), label: action[2] ?? "" }];
    throw fail(source, 0, m.unreadableStepLine);
  }

  function parseEdge(source: SourceLine): DiagramEvent {
    const { end, attrs } = trailingAttrs(source, 0);
    const edge = /^([^\s:]+)\s*->\s*([^\s:]+)(?:\s*:\s*(.+))?$/d.exec(source.text.slice(0, end));
    if (!edge?.indices?.[1] || !edge.indices[2]) throw fail(source, 0, m.edgeShape);
    const from = boxAt(source, edge[1] ?? "", edge.indices[1][0]);
    const to = boxAt(source, edge[2] ?? "", edge.indices[2][0]);
    let carry: Carry | undefined;
    let labelSide: LabelSide | undefined;
    for (const attr of attrs) {
      const kind = valueOf("carry", attr.key, lang);
      const label = valueOf("attr", attr.key, lang) === "label";
      if (kind !== undefined) {
        if (carry) throw fail(source, attr.at, m.carryTwice);
        if (kind === "tag") {
          if (attr.value === "") throw fail(source, attr.at, m.tagNeedsValue);
          carry = { kind, text: attr.value };
        } else {
          if (attr.value !== "") throw fail(source, attr.at, m.carryTakesNoValue(attr.key));
          carry = { kind };
        }
      } else if (label && valueOf("side", attr.value, lang) !== undefined) {
        labelSide = valueOf("side", attr.value, lang);
      } else {
        if (label && valueOf("side", attr.value, other) !== undefined) throw foreignWord(source, attr.at, "side", attr.value);
        if (valueOf("carry", attr.key, other) !== undefined) throw foreignWord(source, attr.at, "carry", attr.key);
        if (valueOf("attr", attr.key, other) !== undefined) throw foreignWord(source, attr.at, "attr", attr.key);
        throw fail(source, attr.at, m.badAttr(attr.raw));
      }
    }
    return {
      type: "edge",
      from,
      to,
      ...(edge[3] !== undefined ? { label: edge[3] } : {}),
      carry: carry ?? { kind: "envelope" },
      ...(labelSide ? { labelSide } : {}),
    };
  }

  function parseStripValue(source: SourceLine): DiagramEvent {
    if (!strip) throw fail(source, 0, m.stripUndeclared);
    const start = new RegExp(`^${escape(wordOf("head", "strip", lang))}\\s+`).exec(source.text)?.[0].length ?? 0;
    const { end, attrs } = trailingAttrs(source, start);
    if (attrs.length > 1) throw fail(source, attrs[1]?.at ?? 0, m.stripTagOnce);
    const rest = source.text.slice(start, end);
    const assigned = /^(.+?)\s*=\s*(.+)$/.exec(rest);
    const field = (assigned ? assigned[1] : rest)?.trim() ?? "";
    if (!strip.fields.includes(field)) throw fail(source, start, m.noSuchField(field));
    const tag = attrs[0]?.raw;
    if (!assigned && tag === undefined) throw fail(source, start, m.stripNeedsValue);
    return {
      type: "strip",
      field,
      ...(assigned ? { value: assigned[2] ?? "" } : {}),
      ...(tag !== undefined ? { tag } : {}),
    };
  }
}

function looksLikeStepLine(text: string, lang: NotationLang): boolean {
  return text.startsWith(">") || text.startsWith("`") || text.includes("->") || swapLine(text, lang) !== null;
}

export function parseNotation(notation: string, options: ParseOptions = {}): Parsed {
  try {
    return { ok: true, diagram: parseLines(tokenize(notation), options.lang ?? "ja") };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
