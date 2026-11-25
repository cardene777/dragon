/**
 * HTMLの形の図と原本のJSONを行き来する (#3908)。要素と属性の名前は名前の表 (`vocabulary.ts`) から引き、作り方は`shape.ts`の頭に在る。
 *
 * 読む時は、表に無い名前の要素と属性と、書けない形の値を、要素の行と列と名前を添えた誤りにする。
 * 読んだ原本は記法へ書き戻す前の形で、記法が既定の値を足す欄 (線の運ぶ物など) を持たないことがある。
 * 原本の物ごとに、それを書いた要素を覚え、記法の誤りを要素へ戻す時に使う。
 * 図の要素の`class`と`style`と`data-`で始まる属性は頁が見た目と描き方 (`data-header`など) に使う属性で、原本には読まない。
 */
import { escapeAttr, escapeText, type HtmlElement, ownText } from "./html";
import { FORM_MESSAGES } from "./messages";
import { type ElementShape, type Kid, type Kinds, KEY_ATTR, PREFIX, type Value } from "./shape";
import { VOCABULARY } from "./vocabulary";
import { FORMAT_VERSION } from "../model";
import type { NotationLang } from "../words";

/** HTMLの形の誤り。`element`は名指す要素の名前 (`dg-box`など) */
export interface FormError {
  line: number;
  column: number;
  element: string;
  message: string;
}

type Obj = Record<string, unknown>;

/** 誤りの文。要素の名前 (`<dg-box>`) で始まらない文は、頭に要素の名前を付ける */
export const formMessage = (error: FormError): string => (error.element === "" || error.message.startsWith(`<${error.element}`) ? error.message : `<${error.element}> ${error.message}`);

/** 図の要素の名前か (`dg-<種類>`) */
export const isFigureTag = (name: string): boolean => name.startsWith(PREFIX) && VOCABULARY.kinds.includes(name.slice(PREFIX.length));

/** 木の中の図の要素。図の要素の中に在る図の要素 (図の部品の同じ名前の要素) は数えない */
export function figuresIn(node: HtmlElement): HtmlElement[] {
  if (isFigureTag(node.name)) return [node];
  return node.children.flatMap((child) => (child.type === "element" ? figuresIn(child) : []));
}

/** 読んだ図。`owners`は原本の物ごとの、それを書いた要素。`steps`は段の要素を段の順に */
export interface ReadFigure {
  diagram: Obj;
  owners: Map<object, HtmlElement>;
  steps: HtmlElement[];
}

/** 図の要素に頁が付ける属性。原本には読まない */
const isPageAttr = (name: string): boolean => name === "class" || name === "style" || name.startsWith("data-");

const isScalar = (value: unknown): value is string | number | boolean => typeof value === "string" || typeof value === "number" || typeof value === "boolean";

/** 属性か字の値を、値の形に合わせて読む。読めない時はundefined */
function typed(value: string, kinds: Kinds): string | number | boolean | undefined {
  if (kinds.includes("b") && (value === "true" || value === "false")) return value === "true";
  if (kinds.includes("i") && /^-?\d+$/u.test(value)) return Number(value);
  if (kinds.includes("n") && /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/iu.test(value)) return Number(value);
  return kinds.includes("s") ? value : undefined;
}

/** 値の形の言い方 */
function expected(kinds: Kinds, lang: NotationLang): string {
  const words = FORM_MESSAGES[lang].kinds;
  return [...kinds].map((kind) => words[kind as "s" | "i" | "n" | "b"]).join(words.or);
}

/** 子の要素の名前の並び。誤りの文で書ける名前を示す */
const kidNames = (shape: ElementShape): string => Object.keys(shape.c).map((name) => `${PREFIX}${name}`).join(", ");

/** HTMLの形の図の要素を原本へ読む。図の要素でない時と、読めない名前と値を持つ時は誤りを返す */
export function readFigure(root: HtmlElement, lang: NotationLang): { ok: true; figure: ReadFigure } | { ok: false; errors: FormError[] } {
  const m = FORM_MESSAGES[lang];
  const errors: FormError[] = [];
  const owners = new Map<object, HtmlElement>();
  const steps: HtmlElement[] = [];
  const fail = (element: HtmlElement, message: string): void => void errors.push({ line: element.line, column: element.column, element: element.name, message });
  if (!isFigureTag(root.name)) return { ok: false, errors: [{ line: root.line, column: root.column, element: root.name, message: m.noFigure }] };

  function readElement(element: HtmlElement, shape: ElementShape, options: { root?: boolean; entry?: boolean } = {}): Obj {
    const obj: Obj = {};
    owners.set(obj, element);
    if (element.selfClosed) fail(element, m.selfClosed(element.name));
    for (const [name, value] of element.attrs) {
      if (options.entry && name === KEY_ATTR) continue;
      if (options.root && isPageAttr(name)) continue;
      const kinds = shape.a[name];
      if (kinds === undefined) {
        fail(element, m.unknownAttribute(name, element.name, Object.keys(shape.a).filter((key) => !(options.root && key === "kind")).join(", ")));
        continue;
      }
      const read = typed(value, kinds);
      if (read === undefined) {
        fail(element, m.badValue(name, element.name, value, expected(kinds, lang)));
        continue;
      }
      const path = shape.p?.[name] ?? [name];
      let holder = obj;
      for (const key of path.slice(0, -1)) holder = (holder[key] ??= {}) as Obj;
      holder[path[path.length - 1] as string] = read;
    }
    const text = ownText(element);
    if (text !== "") {
      if (shape.t !== undefined) obj[shape.t] = text;
      else fail(element, m.noText(element.name));
    }
    for (const child of element.children) {
      if (child.type !== "element") continue;
      const kid = child.name.startsWith(PREFIX) ? shape.c[child.name.slice(PREFIX.length)] : undefined;
      if (!kid || !Object.hasOwn(shape.c, child.name.slice(PREFIX.length))) {
        fail(child, m.unknownElement(child.name, element.name, kidNames(shape)));
        continue;
      }
      if (kid.f[0] === "steps") steps.push(child);
      const value = readValue(child, kid, kid.h === "entry");
      if (value === undefined) continue;
      let holder = obj;
      for (const key of kid.f.slice(0, -1)) holder = (holder[key] ??= {}) as Obj;
      const last = kid.f[kid.f.length - 1] as string;
      if (kid.h === "item") holder[last] = [...((holder[last] as unknown[] | undefined) ?? []), value];
      else if (kid.h === "one") {
        if (holder[last] !== undefined) fail(child, m.twice(child.name));
        else holder[last] = value;
      } else {
        const key = child.attrs.find(([name]) => name === KEY_ATTR)?.[1];
        if (key === undefined) fail(child, m.noKey(child.name));
        else holder[last] = { ...(holder[last] as Obj | undefined), [key]: value };
      }
    }
    // 欠かせない並びを書かない時は、空の並びにする
    for (const name of shape.r ?? []) {
      if (obj[name] !== undefined) continue;
      const kids = Object.values(shape.c).filter((kid) => kid.f[0] === name);
      if (kids.some((kid) => kid.f.length === 1 && kid.h === "item")) obj[name] = [];
      else if (kids.some((kid) => kid.f.length > 1)) obj[name] = {};
    }
    return obj;
  }

  function readValue(element: HtmlElement, value: Value & { v?: string }, entry: boolean): unknown {
    if (value.e !== undefined) {
      const read = readElement(element, VOCABULARY.shapes[value.e] as ElementShape, { entry });
      return value.v === undefined ? read : { ...read, type: value.v };
    }
    if (value.s !== undefined) {
      if (element.selfClosed) fail(element, m.selfClosed(element.name));
      for (const [name] of element.attrs) if (!(entry && name === KEY_ATTR)) fail(element, m.unknownAttribute(name, element.name, entry ? KEY_ATTR : ""));
      const nested = element.children.find((child) => child.type === "element");
      if (nested && nested.type === "element") fail(nested, m.unknownElement(nested.name, element.name, ""));
      const text = ownText(element);
      const read = typed(text, value.s);
      if (read === undefined) fail(element, m.badValue(element.name, element.name, text, expected(value.s, lang)));
      return read;
    }
    if (value.x !== undefined) {
      const items: unknown[] = [];
      for (const child of element.children) {
        if (child.type !== "element") continue;
        if (child.name !== element.name) {
          fail(child, m.unknownElement(child.name, element.name, element.name));
          continue;
        }
        const read = readValue(child, value.x, false);
        if (read !== undefined) items.push(read);
      }
      return items;
    }
    return undefined;
  }

  const diagram = readElement(root, VOCABULARY.shapes[VOCABULARY.root] as ElementShape, { root: true });
  if (errors.length > 0) return { ok: false, errors };
  // 図の種類は要素の名前から、形式の版は書かなければ今の版にする
  const rest = Object.fromEntries(Object.entries(diagram).filter(([key]) => key !== "version" && key !== "kind"));
  const ordered: Obj = { version: diagram.version ?? FORMAT_VERSION, kind: root.name.slice(PREFIX.length), ...rest };
  owners.delete(diagram);
  owners.set(ordered, root);
  return { ok: true, figure: { diagram: ordered, owners, steps } };
}

type FieldKids = Map<string, { name: string; kid: Kid }[]>;
// 名前の表から作る物は使う時に作り、変換を使わない入口のbuildが表を残さないようにする
let fieldKids: FieldKids[] | undefined;

/** 要素の形ごとの、原本の欄の道ごとの、それを書く子の要素。`type`で分ける並びは同じ道に2つ以上の子の要素を持つ */
function fieldKidsOf(index: number): FieldKids {
  fieldKids ??= VOCABULARY.shapes.map((shape) => {
    const table: FieldKids = new Map();
    for (const [name, kid] of Object.entries(shape.c)) {
      const key = kid.f.join("/");
      table.set(key, [...(table.get(key) ?? []), { name, kid }]);
    }
    return table;
  });
  return fieldKids[index] as FieldKids;
}

/** 原本のJSONの図をHTMLの形に書く。要素は1つずつ行を分け、2つの空白で字下げする */
export function writeFigure(diagram: Obj): string {
  const lines: string[] = [];
  writeElement(lines, `${PREFIX}${String(diagram.kind)}`, diagram, VOCABULARY.root, 0, { root: true });
  return `${lines.join("\n")}\n`;
}

/** 物を表す要素を書く */
function writeElement(lines: string[], tag: string, value: Obj, index: number, depth: number, options: { root?: boolean; type?: boolean; key?: string } = {}): void {
  const shape = VOCABULARY.shapes[index] as ElementShape;
  const fields = fieldKidsOf(index);
  const pad = "  ".repeat(depth);
  const attrs: [string, string][] = options.key === undefined ? [] : [[KEY_ATTR, options.key]];
  let text: string | undefined;
  const kids: ((into: string[]) => void)[] = [];
  // 欄の道ごとの属性の名前。欄の名前と同じ名前の属性は表に載らない
  const named = new Map(Object.entries(shape.p ?? {}).map(([attr, path]) => [path.join("/"), attr]));
  const attrOf = (path: string): string | undefined => named.get(path) ?? (path in shape.a && shape.p?.[path] === undefined ? path : undefined);
  for (const [key, field] of Object.entries(value)) {
    if (field === undefined) continue;
    if (options.root && (key === "version" || key === "kind")) continue;
    if (options.type && key === "type") continue;
    if (options.root && key === "blocks" && typeof field === "object" && field !== null) {
      for (const [block, declared] of Object.entries(field as Obj)) kids.push(...writeKids(fields.get(`blocks/${block}`), declared, depth + 1, `blocks.${block}`));
      continue;
    }
    const attr = attrOf(key);
    if (isScalar(field) && attr !== undefined) {
      if (key === shape.t && typeof field === "string") text = field;
      else attrs.push([attr, String(field)]);
      continue;
    }
    if (typeof field === "object" && field !== null && !Array.isArray(field) && Object.keys(field).length > 0 && Object.entries(field).every(([sub, inner]) => isScalar(inner) && attrOf(`${key}/${sub}`) !== undefined)) {
      for (const [sub, inner] of Object.entries(field as Obj)) attrs.push([attrOf(`${key}/${sub}`) as string, String(inner)]);
      continue;
    }
    kids.push(...writeKids(fields.get(key), field, depth + 1, key));
  }
  // 子の要素を持つ時は、名前の字も属性に書く
  if (text !== undefined && kids.length > 0 && shape.t !== undefined) {
    attrs.push([shape.t, text]);
    text = undefined;
  }
  const open = `${pad}<${tag}${attrs.map(([name, attr]) => ` ${name}="${escapeAttr(attr)}"`).join("")}>`;
  if (kids.length === 0) {
    lines.push(`${open}${escapeText(text ?? "")}</${tag}>`);
    return;
  }
  lines.push(open);
  for (const kid of kids) kid(lines);
  lines.push(`${pad}</${tag}>`);
}

/** 欄の値を書く子の要素を、書く処理の並びで返す */
function writeKids(choices: { name: string; kid: Kid }[] | undefined, field: unknown, depth: number, where: string): ((into: string[]) => void)[] {
  if (!choices || choices.length === 0) throw new Error(`HTMLの形に書けない欄: ${where}`);
  const first = choices[0] as { name: string; kid: Kid };
  const pick = (item: unknown): { name: string; kid: Kid } => {
    if (first.kid.v === undefined) return first;
    const type = typeof item === "object" && item !== null ? (item as Obj).type : undefined;
    const found = choices.find((choice) => choice.kid.v === type);
    if (!found) throw new Error(`HTMLの形に書けない種類: ${where} の ${String(type)}`);
    return found;
  };
  if (first.kid.h === "item") {
    if (!Array.isArray(field)) throw new Error(`HTMLの形に書けない欄: ${where} が並びでない`);
    return field.map((item) => (into: string[]) => {
      const chosen = pick(item);
      // 段は前の要素から1行空けて、記法の段の区切りと同じく見分けやすくする
      if (chosen.kid.f[0] === "steps" && depth === 1) into.push("");
      writeValue(into, `${PREFIX}${chosen.name}`, item, chosen.kid, depth, { type: chosen.kid.v !== undefined });
    });
  }
  if (first.kid.h === "entry") {
    return Object.entries(field as Obj).map(([key, item]) => (into: string[]) => writeValue(into, `${PREFIX}${first.name}`, item, first.kid, depth, { key }));
  }
  const chosen = pick(field);
  return [(into: string[]) => writeValue(into, `${PREFIX}${chosen.name}`, field, chosen.kid, depth, { type: chosen.kid.v !== undefined })];
}

/** 子の要素が表す値を書く */
function writeValue(lines: string[], tag: string, field: unknown, value: Value, depth: number, options: { type?: boolean; key?: string } = {}): void {
  const pad = "  ".repeat(depth);
  if (value.e !== undefined) {
    writeElement(lines, tag, field as Obj, value.e, depth, options);
    return;
  }
  const key = options.key === undefined ? "" : ` ${KEY_ATTR}="${escapeAttr(options.key)}"`;
  if (value.s !== undefined) {
    lines.push(`${pad}<${tag}${key}>${escapeText(String(field))}</${tag}>`);
    return;
  }
  if (value.x !== undefined) {
    lines.push(`${pad}<${tag}${key}>`);
    for (const item of field as unknown[]) writeValue(lines, tag, item, value.x, depth + 1);
    lines.push(`${pad}</${tag}>`);
  }
}
