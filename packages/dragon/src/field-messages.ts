/**
 * 原本の JSON の誤りの文 (#2999)。
 *
 * JSON は語を持たず file から言葉を決められないので、呼ぶ側 (頁なら頁の言葉) が言葉を渡す。
 * 文は schema が使う決まり (JSON Schema の keyword) ごとに持ち、ajv の英語の文はそのまま出さない。
 * schema に決まりを足して文が無い時は、`every-schema-keyword-has-messages` の検査が落ちる。
 * ブロックの形の決まりに当てる文はブロックが日英で持ち (`blocks/<名前>/block.ts` の `fieldMessages`)、ここで 1 つの表に束ねる (#3345)。
 */
import { ranked } from "./blocks/block";
import { BLOCKS } from "./blocks/index";
import type { NotationLang } from "./words";

type Blocks = typeof BLOCKS;
/** 日英の誤りの文の、日本語の表の型。原本の誤りの文を持たないブロックは何も足さない */
type JaOf<X> = X extends { ja: infer M } ? M : never;
type Intersect<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;
/** ブロックが持つ原本の誤りの文の表 */
export type BlockFieldMessages = Intersect<JaOf<Blocks[keyof Blocks]["fieldMessages"]>>;

/** 原本の誤りの文の表。決まりごとの文と、ブロックが持つ文 */
export type FieldMessages = CoreFieldMessages & BlockFieldMessages;

/** `^[^…]+$` の形の決まりが書けないとする字。`space` は空白 (`\s`) */
export interface Forbidden {
  space: boolean;
  chars: string[];
}

/** 書けない組み合わせ (`not`) の欄と、その欄を書ける時の `kind` の値 */
export interface Allowed {
  field: string;
  kind: string;
}

/** schema が使う決まりごとの、ブロックが持たない誤りの文 */
export interface CoreFieldMessages {
  additionalProperties: (key: string) => string;
  required: (key: string) => string;
  enum: (values: readonly string[]) => string;
  type: (type: string) => string;
  minLength: (limit: number) => string;
  maxLength: (limit: number) => string;
  /** 書けない字を読めない形の決まりでは `undefined` */
  pattern: (forbidden: Forbidden | undefined) => string;
  minItems: (limit: number) => string;
  maxItems: (limit: number) => string;
  minimum: (limit: number) => string;
  /** `limit` ちょうどは書けず、それより大きい数だけを書ける決まり (点の見た目の 1 点の件数、#3635) */
  exclusiveMinimum: (limit: number) => string;
  maximum: (limit: number) => string;
  const: (value: string) => string;
  /** どの欄の組み合わせか判らない場所では `undefined` */
  not: (allowed: Allowed | undefined) => string;
  /** `kind` の図だけが書ける出来事の種類 (`types`) を、別の種類の図に書いた (#3164) */
  kindOnly: (types: readonly string[], kind: string) => string;
  /** 16 進の字を `min` から `max` 字で書く決まり (commit の hash、#3164) */
  hex: (min: number, max: number) => string;
  /** 分数か百分率で書く決まり (物差しの線、#3165) */
  ratio: string;
  /** 選べる決まりがどれも欄が足りない時の、足りない欄。それ以外の時は空 */
  anyOf: (fields: readonly string[]) => string;
  oneOf: string;
  discriminator: (tag: string, values: readonly string[]) => string;
  /** 道具より新しい版の図 */
  newer: (version: number, tool: number) => string;
  /** 古い版の図を今の版の形に移して読んだ時の警告 (#3346) */
  upgraded: (version: number, tool: number) => string;
  /** 軽い入口で原本の形の検査を読む前に原本を読んだ時 (#3400) */
  validatorNotLoaded: string;
}

const TYPES_JA: Record<string, string> = {
  string: "文字列にする",
  integer: "整数にする",
  number: "数にする",
  object: "オブジェクトにする",
  array: "配列にする",
  boolean: "true か false にする",
  null: "null にする",
};

const TYPES_EN: Record<string, string> = {
  string: "Use a string",
  integer: "Use an integer",
  number: "Use a number",
  object: "Use an object",
  array: "Use an array",
  boolean: "Use true or false",
  null: "Use null",
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

const ja: CoreFieldMessages = {
  additionalProperties: (key) => `${key} という欄は書けない`,
  required: (key) => `${key} の欄が要る`,
  enum: (values) => `${values.join(" / ")} のどれかにする`,
  type: (type) => TYPES_JA[type] ?? `${type} にする`,
  minLength: (limit) => `${limit} 字以上書く`,
  maxLength: (limit) => `${limit} 字までにする`,
  pattern: (forbidden) =>
    forbidden ? `${forbidden.space ? "空白と " : ""}${forbidden.chars.join(" ")} は使えない` : "使えない字が入っている",
  minItems: (limit) => `${limit} つ以上書く`,
  maxItems: (limit) => `${limit} つまでにする`,
  minimum: (limit) => `${limit} 以上にする`,
  exclusiveMinimum: (limit) => `${limit} より大きい数にする`,
  maximum: (limit) => `${limit} 以下にする`,
  const: (value) => `${value} にする`,
  not: (allowed) => (allowed ? `${allowed.field} の欄は kind が ${allowed.kind} の時だけ書ける` : "この欄の組み合わせは書けない"),
  kindOnly: (types, kind) => `${types.join(" と ")} の出来事は kind が ${kind} の時だけ書ける`,
  hex: (min, max) => `0 から 9 と a から f の字で ${min} から ${max} 字にする`,
  ratio: "分数 (2/3) か百分率 (97%) で書く",
  anyOf: (fields) =>
    fields.length > 0 ? `${fields.join(" か ")} の${fields.length === 2 ? "どちらか" : "どれか"}の欄が要る` : "書ける形のどれにも合わない",
  oneOf: "書ける形のどれか 1 つだけに合わせる",
  discriminator: (tag, values) => `${tag} は ${values.join(" / ")} のどれかにする`,
  newer: (version, tool) => `版 ${version} の図は、この道具 (版 ${tool}) より新しいので読めない。道具を新しくする`,
  upgraded: (version, tool) => `版 ${version} の図を版 ${tool} の形に移して読んだ。file を書き換えるには migrateFile を使う`,
  validatorNotLoaded: "原本の形の検査 (schema check) を読んでいない。原本の JSON を読む前に、loadFor にその原本を渡して待つ",
};

const en: CoreFieldMessages = {
  additionalProperties: (key) => `The ${key} field is not allowed`,
  required: (key) => `The ${key} field is required`,
  enum: (values) => `Use one of ${values.join(" / ")}`,
  type: (type) => TYPES_EN[type] ?? `Use ${type}`,
  minLength: (limit) => `Write at least ${plural(limit, "character")}`,
  maxLength: (limit) => `Write at most ${plural(limit, "character")}`,
  pattern: (forbidden) =>
    forbidden
      ? `Cannot contain ${forbidden.space ? "spaces or " : ""}${forbidden.chars.join(" ")}`
      : "Contains characters that are not allowed",
  minItems: (limit) => `Write at least ${plural(limit, "item")}`,
  maxItems: (limit) => `Write at most ${plural(limit, "item")}`,
  minimum: (limit) => `Use ${limit} or greater`,
  exclusiveMinimum: (limit) => `Use a number greater than ${limit}`,
  maximum: (limit) => `Use ${limit} or less`,
  const: (value) => `Use ${value}`,
  not: (allowed) => (allowed ? `The ${allowed.field} field is allowed only when kind is ${allowed.kind}` : "This combination of fields is not allowed"),
  kindOnly: (types, kind) => `${types.join(" and ")} events are allowed only when kind is ${kind}`,
  hex: (min, max) => `Use ${min} to ${max} characters of 0-9 and a-f`,
  ratio: "Write a fraction (2/3) or a percentage (97%)",
  anyOf: (fields) => (fields.length > 0 ? `Write one of the ${fields.join(" or ")} fields` : "Does not match any of the allowed shapes"),
  oneOf: "Match exactly one of the allowed shapes",
  discriminator: (tag, values) => `${tag} is one of ${values.join(" / ")}`,
  newer: (version, tool) => `Version ${version} diagrams are newer than this tool (version ${tool}) and cannot be read. Update the tool`,
  upgraded: (version, tool) => `Read a version ${version} diagram by moving it to the version ${tool} shape. Use migrateFile to rewrite the file`,
  validatorNotLoaded: "The schema check for diagram JSON is not loaded. Await loadFor with the JSON before reading it",
};

/** ブロックが持つ `lang` の原本の誤りの文を 1 つの表に束ねる */
const fromBlocks = (lang: NotationLang): BlockFieldMessages => Object.assign({}, ...ranked(BLOCKS).map((block) => block.fieldMessages?.[lang] ?? {})) as BlockFieldMessages;

export const FIELD_MESSAGES: Record<NotationLang, FieldMessages> = { ja: { ...ja, ...fromBlocks("ja") }, en: { ...en, ...fromBlocks("en") } };
