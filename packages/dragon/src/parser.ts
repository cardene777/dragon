/**
 * 人が書く記法を、図の原本の JSON へ変える。
 *
 * 記法は 1 行が 1 本の線になる行ごとの文で、最初の段の見出しより前に図の種類と題と箱を宣言し、
 * 段ごとに見出し (`#`) と本文 (`>`) の下へ、その段で起きることを起きる順に 1 行ずつ並べる。
 *
 *   時系列図 <題>
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
 * 誤りは最初の 1 つで止め、行と列を示す。
 */
import type { Box, Carry, Color, Diagram, DiagramEvent, LabelSide, Region, Step } from "./schema";
import { columnOf, type SourceLine, tokenize } from "./tokenize";
import { FORMAT_VERSION } from "./version";

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Parsed = { ok: true; diagram: Diagram } | { ok: false; errors: LineError[] };

export const KINDS = { 時系列図: "sequence", 構成図: "architecture" } as const;
const COLORS: readonly Color[] = ["blue", "amber", "green", "violet", "rose", "slate", "coin"];
export const SIDES: Readonly<Record<string, LabelSide>> = { 上: "above", 下: "below", 左: "left", 右: "right" };
export const CARRIES: Readonly<Record<string, Carry["kind"]>> = { 封筒: "envelope", 札: "tag", 硬貨: "coin", なし: "none" };

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

/** `<名前>「<添え書き>」` を名前と添え書きに分ける。 */
function nameAndNote(text: string): { name: string; note?: string } {
  const found = /^(.*?)\s*「(.*)」$/.exec(text);
  if (!found) return { name: text.trim() };
  return { name: (found[1] ?? "").trim(), note: found[2] ?? "" };
}

interface Building {
  source: SourceLine;
  title: string;
  body: string[];
  code?: string;
  events: DiagramEvent[];
}

function parseLines(lines: SourceLine[]): Diagram {
  const [head, ...rest] = lines;
  if (!head) throw new NotationError(1, 1, "最初の行に図の種類 (時系列図 か 構成図) と題を書く");
  const header = /^(時系列図|構成図)\s+(.+)$/.exec(head.text);
  if (!header) throw fail(head, 0, "最初の行は 時系列図 か 構成図 で始め、続けて題を書く");
  const kind = KINDS[header[1] as keyof typeof KINDS];
  const title = header[2] ?? "";

  const regions: Region[] = [];
  const boxes: Box[] = [];
  const ids = new Set<string>();
  let strip: { title: string; fields: string[] } | undefined;
  const steps: Step[] = [];
  let building: Building | undefined;

  const declare = (source: SourceLine, id: string, at: number): void => {
    if (ids.has(id)) throw fail(source, at, `${id} は既に宣言した名札`);
    ids.add(id);
  };
  const boxAt = (source: SourceLine, id: string, at: number): string => {
    if (!boxes.some((box) => box.id === id)) throw fail(source, at, `${id} という箱は宣言していない`);
    return id;
  };
  const finish = (): void => {
    if (!building) return;
    if (building.body.length === 0) throw fail(building.source, 0, `段「${building.title}」に本文 (> で始まる行) が要る`);
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
      if (stepTitle === "") throw fail(source, 0, "段の見出し (#) に題を書く");
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

  if (boxes.length === 0) throw fail(head, 0, "箱を 1 つ以上宣言する");
  if (steps.length === 0) throw fail(head, 0, "段 (# で始まる行) を 1 つ以上書く");

  return {
    version: FORMAT_VERSION,
    kind,
    title,
    ...(regions.length > 0 ? { regions } : {}),
    boxes,
    ...(strip ? { strip } : {}),
    steps,
    ...(kind === "sequence" ? { sequence: { lifelines: boxes.map((box) => box.id) } } : {}),
  };

  function parseDeclaration(source: SourceLine): void {
    const text = source.text;
    const stripDecl = /^帯\s+(.+?)\s*=\s*(.+)$/.exec(text);
    if (stripDecl) {
      if (strip) throw fail(source, 0, "中身の帯は 1 つだけ宣言する");
      const fields = (stripDecl[2] ?? "").split(",").map((field) => field.trim());
      if (fields.some((field) => field === "")) throw fail(source, 0, "帯の欄の名前が空");
      strip = { title: stripDecl[1] ?? "", fields };
      return;
    }
    const regionDecl = /^区画\s+([^\s=]+)\s*=\s*/d.exec(text);
    const boxDecl = regionDecl ? undefined : /^([^\s=]+)\s*=(?!>)\s*/d.exec(text);
    const decl = regionDecl ?? boxDecl;
    if (!decl?.indices?.[1]) {
      if (looksLikeStepLine(text)) throw fail(source, 0, "線や処理は段の見出し (#) の下に書く");
      throw fail(source, 0, "読めない行。箱の宣言は <名札> = <名前>「<下の小さな字>」 の形で書く");
    }
    const id = decl[1] ?? "";
    declare(source, id, decl.indices[1][0]);
    const { end, attrs } = trailingAttrs(source, decl[0].length);
    const { name, note } = nameAndNote(text.slice(decl[0].length, end));
    if (name === "") throw fail(source, decl[0].length, `${id} の名前が空`);
    const look: { color?: Color; icon?: string; region?: string } = {};
    for (const attr of attrs) {
      if (attr.key === "色") {
        if (!COLORS.includes(attr.value as Color)) throw fail(source, attr.at, `色は ${COLORS.join(" / ")} のどれか`);
        look.color = attr.value as Color;
      } else if (attr.key === "印" && attr.value !== "") {
        look.icon = attr.value;
      } else if (attr.key === "区画" && !regionDecl) {
        if (!regions.some((region) => region.id === attr.value)) throw fail(source, attr.at, `区画 ${attr.value} を先に宣言する`);
        look.region = attr.value;
      } else {
        throw fail(source, attr.at, `[${attr.raw}] は書けない指定`);
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
      if (step.code !== undefined) throw fail(source, 0, "1 つの段に命令 (` で囲んだ行) は 1 行まで");
      step.code = code[1] ?? "";
      return [];
    }
    if (/^帯\s/.test(text)) return [parseStripValue(source)];
    if (text.includes("->")) return [parseEdge(source)];
    if (/^[^\s=]+\s*=(?!>)/.test(text)) throw fail(source, 0, "箱の宣言は最初の段の見出し (#) より前に書く");
    const swap = /^([^\s「]+)\s*「(.*)」$/d.exec(text);
    if (swap?.indices?.[1]) {
      const box = boxAt(source, swap[1] ?? "", swap.indices[1][0]);
      if ((swap[2] ?? "") === "") throw fail(source, swap.indices[1][1], "「」の中に書き換える字を書く");
      return [{ type: "swap", box, text: swap[2] ?? "" }];
    }
    const action = /^([^\s:]+)\s*:\s*(.+)$/d.exec(text);
    if (action?.indices?.[1]) return [{ type: "action", box: boxAt(source, action[1] ?? "", action.indices[1][0]), label: action[2] ?? "" }];
    throw fail(source, 0, "読めない行。線は <名札> -> <名札> : <線の名前>、処理は <名札> : <処理の名前> の形で書く");
  }

  function parseEdge(source: SourceLine): DiagramEvent {
    const { end, attrs } = trailingAttrs(source, 0);
    const edge = /^([^\s:]+)\s*->\s*([^\s:]+)(?:\s*:\s*(.+))?$/d.exec(source.text.slice(0, end));
    if (!edge?.indices?.[1] || !edge.indices[2]) throw fail(source, 0, "線は <名札> -> <名札> : <線の名前> の形で書く");
    const from = boxAt(source, edge[1] ?? "", edge.indices[1][0]);
    const to = boxAt(source, edge[2] ?? "", edge.indices[2][0]);
    let carry: Carry | undefined;
    let labelSide: LabelSide | undefined;
    for (const attr of attrs) {
      const kind = CARRIES[attr.key];
      if (kind !== undefined) {
        if (carry) throw fail(source, attr.at, "運ぶ物は 1 本の線に 1 つまで");
        if (kind === "tag") {
          if (attr.value === "") throw fail(source, attr.at, "札には値を書く ([札 <値>])");
          carry = { kind, text: attr.value };
        } else {
          if (attr.value !== "") throw fail(source, attr.at, `[${attr.key}] には値を書かない`);
          carry = { kind };
        }
      } else if (attr.key === "名前" && SIDES[attr.value] !== undefined) {
        labelSide = SIDES[attr.value];
      } else {
        throw fail(source, attr.at, `[${attr.raw}] は書けない指定`);
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
    if (!strip) throw fail(source, 0, "帯の値を書く前に、帯を宣言する (帯 <題> = <欄>, <欄>)");
    const start = /^帯\s+/.exec(source.text)?.[0].length ?? 0;
    const { end, attrs } = trailingAttrs(source, start);
    if (attrs.length > 1) throw fail(source, attrs[1]?.at ?? 0, "帯の札は 1 つまで");
    const rest = source.text.slice(start, end);
    const assigned = /^(.+?)\s*=\s*(.+)$/.exec(rest);
    const field = (assigned ? assigned[1] : rest)?.trim() ?? "";
    if (!strip.fields.includes(field)) throw fail(source, start, `${field} という欄は帯に無い`);
    const tag = attrs[0]?.raw;
    if (!assigned && tag === undefined) throw fail(source, start, "帯の欄には = <値> か [<札>] を書く");
    return {
      type: "strip",
      field,
      ...(assigned ? { value: assigned[2] ?? "" } : {}),
      ...(tag !== undefined ? { tag } : {}),
    };
  }
}

function looksLikeStepLine(text: string): boolean {
  return text.startsWith(">") || text.startsWith("`") || text.includes("->") || /^[^\s「]+\s*「.*」$/.test(text);
}

export function parseNotation(notation: string): Parsed {
  try {
    return { ok: true, diagram: parseLines(tokenize(notation)) };
  } catch (error) {
    if (!(error instanceof NotationError)) throw error;
    return { ok: false, errors: [{ line: error.line, column: error.column, message: error.message }] };
  }
}
