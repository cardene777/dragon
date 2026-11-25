/**
 * 原本の形 (`diagram.schema.json`) から、HTMLの形の名前の表 (`vocabulary.ts`) を組む (#3908)。
 *
 * buildの時に原本の検査を書き出すscript (`scripts/build-validator.mjs`) が、束ねた原本の形を渡して表のfileを書き出す。
 * 描く時と変換する時には要らないので、入口から読まない。名前の作り方は`shape.ts`の頭に在る。
 *
 * 原本の形は`$ref`と`properties`と`items`と`additionalProperties`と、`oneOf`と`anyOf`の選べる形を読む。
 * 図の種類ごとの決まり (`allOf`と、`if`の後ろの`then`と`else`) は、並びの1つずつの形 (列の図と試す図のチップ) を持つことがあるので、
 * 選べる形と同じく欄を足す。決まりの条件 (`if`) と、書けない欄の印 (`not`) は欄を足さない。
 * 欠かせない欄は、型 (`type`) を書いた物の形だけから決める。種類ごとの決まりの欠片は型を書かず、欠かせない欄を狭めない。
 * `type`の値で分ける選べる形 (`discriminator`か、全ての形が`type`に`const`を持つ`oneOf`) は、`type`の値ごとの要素にする。
 * 同じ所に同じ名前の要素か属性が2つできて、欄の名前のままでも分けられない時は、名前を決めずに止める。
 */
import { type ElementShape, kebab, type Kid, KEY_ATTR, LINE_FIELDS, singular, TEXT_FIELDS, type Value, type Vocabulary } from "./shape";

type Json = Record<string, unknown>;

/** 原本の形の欄の形。字と数と真偽、物、`type`で分ける物、並び、鍵を持つ表、それらのどれか */
type Ir =
  | { t: "scalar"; kinds: Set<string> }
  | { t: "object"; shape: IrShape }
  | { t: "variants"; variants: Map<string, IrShape> }
  | { t: "array"; item: Ir }
  | { t: "map"; value: Ir }
  | { t: "union"; parts: Ir[] };

interface IrShape {
  props: Map<string, Ir>;
  required: Set<string>;
}

const isJson = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

/** JSONの型の名前から値の形の字 */
const KIND_OF_TYPE: Readonly<Record<string, string>> = { string: "s", integer: "i", number: "n", boolean: "b" };

/** 値から値の形の字 */
function kindOfValue(value: unknown): string | undefined {
  if (typeof value === "string") return "s";
  if (typeof value === "boolean") return "b";
  if (typeof value === "number") return Number.isInteger(value) ? "i" : "n";
  return undefined;
}

/** 値の形の字を決まった順に並べる */
const kindsText = (kinds: Set<string>): string => ["s", "i", "n", "b"].filter((kind) => kinds.has(kind)).join("");

function buildVocabulary(schema: Json): Vocabulary {
  const lookup = (ref: string): unknown => {
    let at: unknown = schema;
    for (const key of ref.replace(/^#\//u, "").split("/")) at = isJson(at) ? at[key] : undefined;
    return at;
  };
  /** `$ref`をたどった先の形 */
  const resolve = (node: unknown): Json | undefined => {
    let at = node;
    for (let hops = 0; isJson(at) && typeof at.$ref === "string" && hops < 64; hops++) at = lookup(at.$ref);
    return isJson(at) ? at : undefined;
  };

  /** 全ての選べる形が`type`に`const`を持つなら、その形の並び */
  const variantsOf = (node: Json): Json[] | undefined => {
    const options = Array.isArray(node.oneOf) ? node.oneOf.map(resolve) : [];
    if (options.length === 0 || options.some((option) => option === undefined)) return undefined;
    const typed = options as Json[];
    const constOf = (option: Json): unknown => (isJson(option.properties) && isJson(option.properties.type) ? option.properties.type.const : undefined);
    if (!(isJson(node.discriminator) || typed.every((option) => typeof constOf(option) === "string"))) return undefined;
    return typed.every((option) => typeof constOf(option) === "string") ? typed : undefined;
  };

  /** 形の選べる物を平らに並べる。形そのものが欄や型を持てば、それも1つに数える */
  const alternatives = (node: Json): Json[] => {
    const own = ["type", "properties", "items", "additionalProperties", "patternProperties", "enum", "const"].some((key) => key in node) ? [node] : [];
    const options = [...(Array.isArray(node.oneOf) ? node.oneOf : []), ...(Array.isArray(node.anyOf) ? node.anyOf : []), ...(Array.isArray(node.allOf) ? node.allOf : []), node.then, node.else]
      .map(resolve)
      .filter((option): option is Json => option !== undefined);
    return [...own, ...options.flatMap((option) => (variantsOf(option) ? [option] : alternatives(option)))];
  };

  const types = (node: Json): string[] => (typeof node.type === "string" ? [node.type] : Array.isArray(node.type) ? (node.type as string[]) : []);
  const isObject = (node: Json): boolean => types(node).includes("object") || isJson(node.properties) || isJson(node.additionalProperties) || isJson(node.patternProperties);
  const isArray = (node: Json): boolean => types(node).includes("array") || node.items !== undefined;

  const memo = new Map<Json, Ir>();

  /** 形の並びを1つの欄の形にまとめる。1つの形は覚えておき、同じ形をもう1度組まない */
  function irOf(nodes: unknown[]): Ir {
    const resolved = nodes.map(resolve).filter((node): node is Json => node !== undefined);
    const single = resolved.length === 1 ? resolved[0] : undefined;
    const hit = single ? memo.get(single) : undefined;
    if (hit) return hit;
    const variants = single ? variantsOf(single) : undefined;
    if (single && variants) {
      const ir: Ir = { t: "variants", variants: new Map() };
      memo.set(single, ir);
      for (const variant of variants) {
        const name = ((variant.properties as Json).type as Json).const as string;
        ir.variants.set(name, shapeOf([variant]));
      }
      return ir;
    }
    const alts = resolved.flatMap((node) => (variantsOf(node) ? [node] : alternatives(node)));
    const parts: Ir[] = [];
    const kinds = new Set<string>();
    for (const alt of alts) {
      for (const type of types(alt)) if (KIND_OF_TYPE[type]) kinds.add(KIND_OF_TYPE[type]);
      for (const value of Array.isArray(alt.enum) ? alt.enum : []) {
        const kind = kindOfValue(value);
        if (kind) kinds.add(kind);
      }
      const constant = kindOfValue(alt.const);
      if (constant) kinds.add(constant);
    }
    if (kinds.size > 0) parts.push({ t: "scalar", kinds });
    const typedVariants = alts.filter((alt) => variantsOf(alt));
    for (const alt of typedVariants) parts.push(irOf([alt]));
    // `type`で分ける物を持つ時、型を書かない物の欠片は`type`の値を狭める決まりなので、欄に数えない
    const objects = alts.filter((alt) => !variantsOf(alt) && isObject(alt) && !(typedVariants.length > 0 && !types(alt).includes("object")));
    const shaped = objects.filter((alt) => isJson(alt.properties));
    const mapped = objects.filter((alt) => !isJson(alt.properties));
    if (shaped.length > 0) {
      const ir: Ir = { t: "object", shape: { props: new Map(), required: new Set() } };
      if (single && shaped.length === 1 && shaped[0] === single) memo.set(single, ir);
      ir.shape = shapeOf(shaped);
      parts.push(ir);
    }
    if (mapped.length > 0) {
      const values = mapped.flatMap((alt) => [...(isJson(alt.additionalProperties) ? [alt.additionalProperties] : []), ...(isJson(alt.patternProperties) ? Object.values(alt.patternProperties) : [])]);
      parts.push({ t: "map", value: irOf(values) });
    }
    const arrays = alts.filter((alt) => isArray(alt));
    if (arrays.length > 0) parts.push({ t: "array", item: irOf(arrays.map((alt) => (Array.isArray(alt.items) ? alt.items[0] : alt.items))) });
    const ir: Ir = parts.length === 1 ? (parts[0] as Ir) : parts.length === 0 ? { t: "scalar", kinds: new Set(["s"]) } : { t: "union", parts };
    if (single) memo.set(single, ir);
    return ir;
  }

  /** 欄を持つ形を1つの物の形にまとめる。欠かせない欄は全ての形が欠かせない欄 */
  function shapeOf(nodes: Json[]): IrShape {
    const fields = new Map<string, unknown[]>();
    for (const node of nodes) for (const [name, field] of Object.entries((node.properties ?? {}) as Json)) if (field !== false) fields.set(name, [...(fields.get(name) ?? []), field]);
    const typed = nodes.filter((node) => types(node).includes("object"));
    const required = (typed.length > 0 ? typed : nodes).map((node) => new Set(Array.isArray(node.required) ? (node.required as string[]) : []));
    const shape: IrShape = { props: new Map(), required: new Set([...(required[0] ?? [])].filter((name) => required.every((set) => set.has(name)))) };
    for (const [name, field] of fields) shape.props.set(name, irOf(field));
    return shape;
  }

  const shapes: ElementShape[] = [];
  const indexes = new Map<IrShape, number>();

  /** 物の形の要素の形の番号。同じ物の形は同じ番号 */
  function elementOf(shape: IrShape, root = false): number {
    const hit = indexes.get(shape);
    if (hit !== undefined) return hit;
    const index = shapes.length;
    const element: ElementShape = { a: {}, c: {} };
    shapes.push(element);
    indexes.set(shape, index);
    fill(element, shape, root);
    return index;
  }

  /** 子の要素が表す値 */
  function valueOf(ir: Ir, where: string): Value {
    if (ir.t === "scalar") return { s: kindsText(ir.kinds) };
    if (ir.t === "object") return { e: elementOf(ir.shape) };
    if (ir.t === "array") return { x: valueOf(ir.item, where) };
    if (ir.t === "union" && ir.parts.every((part) => part.t === "scalar")) return { s: kindsText(new Set(ir.parts.flatMap((part) => (part.t === "scalar" ? [...part.kinds] : [])))) };
    throw new Error(`HTMLの形の名前を決められない: ${where} は値の形が混ざる`);
  }

  function fill(element: ElementShape, shape: IrShape, root: boolean): void {
    /** 名前を決める前の子の要素。`rank`の小さい順に名前を取る */
    const pending: { name: string; plural?: string; kid: Kid; rank: number }[] = [];
    /** 欄の道 `path` の属性を足す。名前は欄の名前を小文字にして`-`でつなぐ */
    const attr = (path: string[], kinds: Set<string>): void => {
      const name = path.map(kebab).join("-");
      const before = element.p?.[name] ?? (name in element.a ? [name] : undefined);
      if (before && before.join("/") !== path.join("/")) throw new Error(`HTMLの形の属性 ${name} が2つできる (${before.join(".")} と ${path.join(".")})`);
      element.a[name] = kindsText(new Set([...(element.a[name] ?? ""), ...kinds]));
      if (path.length > 1 || name !== path[0]) element.p = { ...element.p, [name]: path };
    };
    const field = (name: string, ir: Ir, path: string[], declared: boolean): void => {
      for (const part of ir.t === "union" ? ir.parts : [ir]) {
        if (part.t === "scalar") {
          if (LINE_FIELDS.includes(name) && kindsText(part.kinds) === "s") pending.push({ name, kid: { f: path, h: "one", s: "s" }, rank: 2 });
          else attr([name], part.kinds);
        } else if (part.t === "object") {
          const flat = !declared && part.shape.props.size > 0 && [...part.shape.props.values()].every((sub) => sub.t === "scalar");
          if (flat) for (const [sub, subIr] of part.shape.props) attr([name, sub], (subIr as { kinds: Set<string> }).kinds);
          else pending.push({ name, kid: { f: path, h: "one", e: elementOf(part.shape) }, rank: declared ? 0 : 2 });
        } else if (part.t === "variants") {
          for (const [type, variant] of part.variants) pending.push({ name: type, kid: { f: path, h: "one", v: type, e: elementOf(variant) }, rank: 1 });
        } else if (part.t === "array" && part.item.t === "variants") {
          for (const [type, variant] of part.item.variants) pending.push({ name: type, kid: { f: path, h: "item", v: type, e: elementOf(variant) }, rank: declared ? 0 : 1 });
        } else if (part.t === "array") {
          pending.push({ name: singular(name), plural: name, kid: { f: path, h: "item", ...valueOf(part.item, path.join(".")) }, rank: declared ? 0 : 3 });
        } else if (part.t === "map") {
          const kid: Kid = { f: path, h: "entry", ...valueOf(part.value, path.join(".")) };
          if (kid.e !== undefined && KEY_ATTR in (shapes[kid.e] as ElementShape).a) throw new Error(`HTMLの形の表 ${path.join(".")} の物が属性 ${KEY_ATTR} を持つ`);
          pending.push({ name: singular(name), plural: name, kid, rank: 3 });
        } else {
          throw new Error(`HTMLの形の名前を決められない: ${path.join(".")}`);
        }
      }
    };
    for (const [name, ir] of shape.props) {
      // 図の宣言は図の要素の直ぐ下に、ブロックの名前の要素で並べる
      if (root && name === "blocks" && ir.t === "object") for (const [block, blockIr] of ir.shape.props) field(block, blockIr, ["blocks", block], true);
      else field(name, ir, [name], false);
    }
    for (const pend of pending.sort((a, b) => a.rank - b.rank)) {
      const { kid } = pend;
      const name = kebab(pend.name);
      const plural = pend.plural === undefined ? undefined : kebab(pend.plural);
      if (!(name in element.c)) element.c[name] = kid;
      else if (plural !== undefined && plural !== name && !(plural in element.c)) element.c[plural] = kid;
      else throw new Error(`HTMLの形の要素dg-${name} が同じ所に2つできる (${kid.f.join(".")})`);
    }
    const text = TEXT_FIELDS.find((name) => element.a[name] === "s" && element.p?.[name] === undefined);
    if (text !== undefined) element.t = text;
    if (shape.required.size > 0) element.r = [...shape.required];
  }

  const rootIr = irOf([schema]);
  if (rootIr.t !== "object") throw new Error("原本の形の根が物でない");
  const kindIr = rootIr.shape.props.get("kind");
  const kinds = isJson(schema.properties) && isJson(schema.properties.kind) && Array.isArray(schema.properties.kind.enum) ? (schema.properties.kind.enum as string[]) : [];
  if (!kindIr || kinds.length === 0) throw new Error("原本の形が図の種類を持たない");
  const root = elementOf(rootIr.shape, true);
  return { kinds, root, shapes };
}

/** 名前の表のfileの中身。原本の形が同じなら毎回同じ字の並びになる */
export function vocabularySource(schema: Json): string {
  return [
    "// packages/dragon/scripts/build-validator.mjsが原本の形 (diagram.schema.json) から書き出した。手で直さない",
    'import type { Vocabulary } from "./shape";',
    "",
    "/** HTMLの形の要素と属性の名前と、それが埋める原本の欄 (#3908)。名前の作り方はshape.tsの頭に在る */",
    `export const VOCABULARY: Vocabulary = ${JSON.stringify(buildVocabulary(schema))};`,
    "",
  ].join("\n");
}
