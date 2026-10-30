/**
 * 原本の JSON の誤りの文 (#2999)。
 *
 * JSON は語を持たず file から言葉を決められないので、呼ぶ側 (頁なら頁の言葉) が言葉を渡す。
 * 文は schema が使う決まり (JSON Schema の keyword) ごとに持ち、ajv の英語の文はそのまま出さない。
 * schema に決まりを足して文が無い時は、`every-schema-keyword-has-messages` の検査が落ちる。
 */
import type { NotationLang } from "./words";

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

export interface FieldMessages {
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
  const: (value: string) => string;
  /** どの欄の組み合わせか判らない場所では `undefined` */
  not: (allowed: Allowed | undefined) => string;
  /** 状態遷移図の箱の名札に、始まりと終わりの印の名前 (`names`) を書いた */
  reserved: (names: readonly string[]) => string;
  /** `kind` の図だけが書ける出来事の種類 (`types`) を、別の種類の図に書いた (#3164) */
  kindOnly: (types: readonly string[], kind: string) => string;
  /** 16 進の字を `min` から `max` 字で書く決まり (commit の hash、#3164) */
  hex: (min: number, max: number) => string;
  /** 数と単位 (`units`) の組で書く決まり (時間軸の図の目盛りの長さ、#3165) */
  duration: (units: readonly string[]) => string;
  /** 分数か百分率で書く決まり (物差しの線、#3165) */
  ratio: string;
  /** 頁を移る形だけを書ける決まり (箱の飛び先と段の出典の URL、#3199) */
  url: string;
  /** 選べる決まりがどれも欄が足りない時の、足りない欄。それ以外の時は空 */
  anyOf: (fields: readonly string[]) => string;
  oneOf: string;
  discriminator: (tag: string, values: readonly string[]) => string;
  /** 道具より新しい版の図 */
  newer: (version: number, tool: number) => string;
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

const ja: FieldMessages = {
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
  const: (value) => `${value} にする`,
  not: (allowed) => (allowed ? `${allowed.field} の欄は kind が ${allowed.kind} の時だけ書ける` : "この欄の組み合わせは書けない"),
  reserved: (names) => `${names.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,
  kindOnly: (types, kind) => `${types.join(" と ")} の出来事は kind が ${kind} の時だけ書ける`,
  hex: (min, max) => `0 から 9 と a から f の字で ${min} から ${max} 字にする`,
  duration: (units) => `数と単位 (${units.join(" / ")}) の組で書く (12s など)`,
  ratio: "分数 (2/3) か百分率 (97%) で書く",
  url: "/ で始まる path か、http:// か https:// で始まる URL にする",
  anyOf: (fields) =>
    fields.length > 0 ? `${fields.join(" か ")} の${fields.length === 2 ? "どちらか" : "どれか"}の欄が要る` : "書ける形のどれにも合わない",
  oneOf: "書ける形のどれか 1 つだけに合わせる",
  discriminator: (tag, values) => `${tag} は ${values.join(" / ")} のどれかにする`,
  newer: (version, tool) => `版 ${version} の図は、この道具 (版 ${tool}) より新しいので読めない。道具を新しくする`,
};

const en: FieldMessages = {
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
  const: (value) => `Use ${value}`,
  not: (allowed) => (allowed ? `The ${allowed.field} field is allowed only when kind is ${allowed.kind}` : "This combination of fields is not allowed"),
  reserved: (names) => `${names.join(" and ")} name the start and end marks of a state diagram and cannot be box ids`,
  kindOnly: (types, kind) => `${types.join(" and ")} events are allowed only when kind is ${kind}`,
  hex: (min, max) => `Use ${min} to ${max} characters of 0-9 and a-f`,
  duration: (units) => `Write a number and a unit (${units.join(" / ")}), such as 12s`,
  ratio: "Write a fraction (2/3) or a percentage (97%)",
  url: "Use a path that starts with / or a URL that starts with http:// or https://",
  anyOf: (fields) => (fields.length > 0 ? `Write one of the ${fields.join(" or ")} fields` : "Does not match any of the allowed shapes"),
  oneOf: "Match exactly one of the allowed shapes",
  discriminator: (tag, values) => `${tag} is one of ${values.join(" / ")}`,
  newer: (version, tool) => `Version ${version} diagrams are newer than this tool (version ${tool}) and cannot be read. Update the tool`,
};

export const FIELD_MESSAGES: Record<NotationLang, FieldMessages> = { ja, en };
