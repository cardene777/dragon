/**
 * dragonの記法とHTMLの形を相互に変換する (#3908)。記法とHTMLの形の間には原本のJSONを挟む。
 *
 * 記法からは、記法を読んだ原本をHTMLの形に書く。HTMLの形からは、読んだ原本を記法へ書き戻し (`printNotation`)、その記法を読み直す。
 * 記法へ戻した字は整えた形で、書き手の行の並べ方と空行と字下げは残らない。戻した記法を読んだ原本は元の記法を読んだ原本と同じになる。
 *
 * HTMLの形には、記法へ書き戻して読み直すと同じ原本になる欄だけを書く。
 * 記法が既定の値を足す欄 (線の運ぶ物が封筒であることなど) は、HTMLの形に書かなくても同じ図になるので外す。
 * 外せるかは、書き戻した記法に値の字が出ない欄をまとめて外して読み直し、原本が変わる時は値ごとに確かめる。
 * 外した形は、書いたHTMLを読み直して記法へ書き戻した原本が元と同じ時だけ使い、違う時は外さずに書く。
 *
 * 記法の誤りは記法の行で返るので、その行に値の字が最も長く出る物を書いた要素へ戻し、HTMLの行と要素の名前で知らせる。
 */
import { type HtmlElement, parseHtml } from "./html";
import { FORM_MESSAGES } from "./messages";
import { figuresIn, type FormError, readFigure, writeFigure } from "./figure";
import { type LineError, type ParseOptions, parseNotation } from "../parser";
import { printNotation } from "../printer";
import type { Diagram } from "../schema";
import { DEFAULT_LANG, type NotationLang } from "../words";

export type { FormError };

/** 変換の設定。`lang`は誤りの文の言葉、`note`は1行目に`note`を書かない図の箱の説明の見せ方 (頁の頭の`note: pop`) */
export type ConvertOptions = Pick<ParseOptions, "lang" | "blocks" | "note">;

/** HTMLの形の図を読んだ結果。`steps`は段の要素を段の順に、`notices`は記法の知らせを要素へ戻した物 */
export type FigureRead =
  | { ok: true; diagram: Diagram; notation: string; root: HtmlElement; steps: HtmlElement[]; notices: FormError[] }
  | { ok: false; errors: FormError[] };

type Obj = Record<string, unknown>;

/** JSONにできる欄だけの写し */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** 2つのJSONの値が同じか。物の欄の並びは問わない */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === (b as unknown[]).length && a.every((item, i) => same(item, (b as unknown[])[i]));
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && same((a as Obj)[key], (b as Obj)[key]));
}

/** 記法へ書き戻して読み直した原本が、`target`と同じか */
function reads(candidate: Obj, target: unknown, options: ConvertOptions): boolean {
  try {
    const read = parseNotation(printNotation(candidate as unknown as Diagram), options);
    return read.ok && same(plain(read.diagram), target);
  } catch {
    return false;
  }
}

/** 原本から`paths`の欄を外した写し。外して空になった物も外す */
function without(source: Obj, paths: readonly (readonly (string | number)[])[]): Obj {
  const copy = plain(source);
  for (const path of paths) {
    const holders: unknown[] = [copy];
    for (const key of path.slice(0, -1)) holders.push((holders[holders.length - 1] as Obj)[key]);
    delete (holders[holders.length - 1] as Obj)[path[path.length - 1] as string];
    // 外して空になった物は、その物の欄も外す
    for (let depth = path.length - 1; depth > 0; depth--) {
      const holder = holders[depth] as Obj;
      if (Array.isArray(holder) || Array.isArray(holders[depth - 1]) || Object.keys(holder).length > 0) break;
      delete (holders[depth - 1] as Obj)[path[depth - 1] as string];
    }
  }
  return copy;
}

/** 書き戻した記法に値の字が出ない欄。値ごとにまとめる。図の種類と版と`type`と、並びの中の字と数は数えない */
function unseen(diagram: Obj, printed: string): Map<string, (string | number)[][]> {
  const groups = new Map<string, (string | number)[][]>();
  const walk = (value: Obj, path: (string | number)[]): void => {
    for (const [key, field] of Object.entries(value)) {
      if (path.length === 0 && (key === "version" || key === "kind")) continue;
      if (key === "type") continue;
      if (Array.isArray(field)) {
        field.forEach((item, i) => {
          if (typeof item === "object" && item !== null && !Array.isArray(item)) walk(item as Obj, [...path, key, i]);
        });
      } else if (typeof field === "object" && field !== null) walk(field as Obj, [...path, key]);
      else if (!printed.includes(String(field))) {
        const group = `${key}=${JSON.stringify(field)}`;
        groups.set(group, [...(groups.get(group) ?? []), [...path, key]]);
      }
    }
  };
  walk(diagram, []);
  return groups;
}

/** HTMLの形に書く原本。記法が足す既定の値の欄を外す。外せる欄が無い時は`whole`そのもの */
function trimmed(whole: Obj, options: ConvertOptions): Obj {
  let printed: string;
  try {
    printed = printNotation(whole as unknown as Diagram);
  } catch {
    return whole;
  }
  if (!reads(whole, whole, options)) return whole;
  const groups = unseen(whole, printed);
  const all = [...groups.values()].flat();
  if (all.length === 0) return whole;
  const bare = without(whole, all);
  if (reads(bare, whole, options)) return bare;
  let kept: (string | number)[][] = [];
  for (const paths of groups.values()) {
    const next = [...kept, ...paths];
    if (reads(without(whole, next), whole, options)) kept = next;
  }
  return without(whole, kept);
}

/** 書いたHTMLの形を読み直して記法へ書き戻した原本が、`target`と同じか */
function readsBack(html: string, target: unknown, options: ConvertOptions): boolean {
  const [root] = figuresIn(parseHtml(html));
  const read = root ? readFigure(root, options.lang ?? DEFAULT_LANG) : undefined;
  return read?.ok === true && reads(read.figure.diagram, target, options);
}

/** 原本のJSONの図をHTMLの形に書く */
export function diagramToHtml(diagram: Diagram, options: ConvertOptions = {}): string {
  const whole = plain(diagram) as unknown as Obj;
  const lean = trimmed(whole, options);
  if (lean !== whole) {
    const html = writeFigure(lean);
    if (readsBack(html, whole, options)) return html;
  }
  return writeFigure(whole);
}

/** dragonの記法の図をHTMLの形に書く。記法を読めない時は記法の誤りを返す */
export function notationToHtml(text: string, options: ConvertOptions = {}): { ok: true; html: string } | { ok: false; errors: LineError[] } {
  const read = parseNotation(text, options);
  if (!read.ok) return { ok: false, errors: read.errors };
  return { ok: true, html: diagramToHtml(read.diagram, options) };
}

/** 記法の行を作った要素。行に値の字が最も長く出る物を書いた要素で、どの物の字も出ない時は図の要素 */
function ownerOf(line: string, owners: Map<object, HtmlElement>, root: HtmlElement): HtmlElement {
  let best = root;
  let score = 0;
  for (const [obj, element] of owners) {
    let found = 0;
    for (const value of Object.values(obj)) {
      const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
      if (text !== "" && line.includes(text)) found += text.length;
    }
    if (found > score) {
      best = element;
      score = found;
    }
  }
  return best;
}

/** HTMLの形の図の要素を原本と記法に読む。読めない名前と値と、記法の誤りは、要素の行と名前を添えて返す */
export function readFigureElement(root: HtmlElement, options: ConvertOptions = {}): FigureRead {
  const lang: NotationLang = options.lang ?? DEFAULT_LANG;
  const read = readFigure(root, lang);
  if (!read.ok) return read;
  const { diagram, owners, steps } = read.figure;
  let notation: string;
  try {
    notation = printNotation(diagram as unknown as Diagram);
  } catch (error) {
    return { ok: false, errors: [{ line: root.line, column: root.column, element: root.name, message: FORM_MESSAGES[lang].cannotPrint(error instanceof Error ? error.message : String(error)) }] };
  }
  const rows = notation.split("\n");
  const located = (found: LineError): FormError => {
    const element = ownerOf(rows[found.line - 1] ?? "", owners, root);
    return { line: element.line, column: element.column, element: element.name, message: found.message };
  };
  const parsed = parseNotation(notation, options);
  if (!parsed.ok) return { ok: false, errors: parsed.errors.map(located) };
  return { ok: true, diagram: parsed.diagram, notation, root, steps, notices: (parsed.notices ?? []).map(located) };
}

/** HTMLの字の最初の図を原本と記法に読む */
function firstFigure(html: string, options: ConvertOptions): FigureRead {
  const [root] = figuresIn(parseHtml(html));
  if (!root) return { ok: false, errors: [{ line: 1, column: 1, element: "dg-", message: FORM_MESSAGES[options.lang ?? DEFAULT_LANG].noFigure }] };
  return readFigureElement(root, options);
}

/** HTMLの字の最初のHTMLの形の図をdragonの記法に書く。読めない時は要素の行と名前を添えた誤りを返す */
export function htmlToNotation(html: string, options: ConvertOptions = {}): { ok: true; notation: string; diagram: Diagram } | { ok: false; errors: FormError[] } {
  const read = firstFigure(html, options);
  return read.ok ? { ok: true, notation: read.notation, diagram: read.diagram } : read;
}

/** HTMLの字の最初のHTMLの形の図を原本のJSONに読む。読めない時は要素の行と名前を添えた誤りを返す */
export function htmlToDiagram(html: string, options: ConvertOptions = {}): { ok: true; diagram: Diagram } | { ok: false; errors: FormError[] } {
  const read = firstFigure(html, options);
  return read.ok ? { ok: true, diagram: read.diagram } : read;
}
