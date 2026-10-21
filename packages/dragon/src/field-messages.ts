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
  /** 書けない字を読めない形の決まりでは `undefined` */
  pattern: (forbidden: Forbidden | undefined) => string;
  minItems: (limit: number) => string;
  minimum: (limit: number) => string;
  const: (value: string) => string;
  /** どの欄の組み合わせか判らない場所では `undefined` */
  not: (allowed: Allowed | undefined) => string;
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
  pattern: (forbidden) =>
    forbidden ? `${forbidden.space ? "空白と " : ""}${forbidden.chars.join(" ")} は使えない` : "使えない字が入っている",
  minItems: (limit) => `${limit} つ以上書く`,
  minimum: (limit) => `${limit} 以上にする`,
  const: (value) => `${value} にする`,
  not: (allowed) => (allowed ? `${allowed.field} の欄は kind が ${allowed.kind} の時だけ書ける` : "この欄の組み合わせは書けない"),
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
  pattern: (forbidden) =>
    forbidden
      ? `Cannot contain ${forbidden.space ? "spaces or " : ""}${forbidden.chars.join(" ")}`
      : "Contains characters that are not allowed",
  minItems: (limit) => `Write at least ${plural(limit, "item")}`,
  minimum: (limit) => `Use ${limit} or greater`,
  const: (value) => `Use ${value}`,
  not: (allowed) => (allowed ? `The ${allowed.field} field is allowed only when kind is ${allowed.kind}` : "This combination of fields is not allowed"),
  anyOf: (fields) => (fields.length > 0 ? `Write one of the ${fields.join(" or ")} fields` : "Does not match any of the allowed shapes"),
  oneOf: "Match exactly one of the allowed shapes",
  discriminator: (tag, values) => `${tag} is one of ${values.join(" / ")}`,
  newer: (version, tool) => `Version ${version} diagrams are newer than this tool (version ${tool}) and cannot be read. Update the tool`,
};

export const FIELD_MESSAGES: Record<NotationLang, FieldMessages> = { ja, en };
