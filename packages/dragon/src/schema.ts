/**
 * 図の原本の形と、原本を JSON Schema で検査する命令。
 *
 * 形の正は `schemas/diagram.schema.json` の 1 本で、下の型はその写し。
 * 誤りは JSON Pointer で場所を示す。欄が足りない時と知らない欄がある時は、その欄の場所まで示す。
 * 誤りの文は呼ぶ側が渡した言葉 (渡さなければ日本語) で出す。文の表は `field-messages.ts` が持つ (#2999)。
 *
 * 検査の関数は schema から前もって書き出した物 (`schemas/validate-diagram.js`) を使う。
 * ajv に schema をその場で組み立てさせると `new Function` を使い、`eval` を許さない頁の CSP で止まる。
 * 書き出しは `scripts/build-validator.mjs` が ajv の設定 `{ allErrors: true, discriminator: true, strictTypes: false }` で行う。
 */
import type { ErrorObject } from "ajv";
import { type Allowed, FIELD_MESSAGES, type FieldMessages, type Forbidden } from "./field-messages";
import validate from "./schemas/validate-diagram.js";
import type { NotationLang } from "./words";

export type Color = "blue" | "amber" | "green" | "violet" | "rose" | "slate" | "coin";
/** 色の役の一覧。記法の `color:` に書ける値と、誤りの文に並べる値 */
export const COLORS: readonly Color[] = ["blue", "amber", "green", "violet", "rose", "slate", "coin"];

export interface Region {
  id: string;
  name: string;
  note?: string;
  color?: Color;
  icon?: string;
}

export interface Box {
  id: string;
  name: string;
  sub?: string;
  color?: Color;
  icon?: string;
  region?: string;
}

export type Carry = { kind: "envelope" } | { kind: "tag"; text: string } | { kind: "coin" } | { kind: "none" };

export type LabelSide = "above" | "below" | "left" | "right";

/** 見せ方。`fixed` は全体を止めて中だけ動かし、`follow` は寄って動かし全体図で今どこかを示す。 */
export type ViewMode = "fixed" | "follow";

export type DiagramEvent =
  | { type: "edge"; from: string; to: string; label?: string; carry: Carry; labelSide?: LabelSide }
  | { type: "action"; box: string; label: string }
  | { type: "swap"; box: string; text: string }
  | { type: "strip"; field: string; value?: string; tag?: string };

export interface Step {
  title: string;
  body: string;
  code?: string;
  events: DiagramEvent[];
}

export interface Diagram {
  version: number;
  kind: "sequence" | "architecture";
  title: string;
  view?: ViewMode;
  regions?: Region[];
  boxes: Box[];
  strip?: { title: string; fields: string[] };
  steps: Step[];
  sequence?: { lifelines: string[] };
}

export interface FieldError {
  /** 誤った欄の場所 (JSON Pointer) */
  pointer: string;
  message: string;
}

export type Checked = { ok: true } | { ok: false; errors: FieldError[] };

export interface CheckOptions {
  /** 誤りの文の言葉。渡さなければ日本語 */
  lang?: NotationLang;
}

/** 段の中で起きることの種類。schema の event の `discriminator` が見る `type` の値 */
const EVENT_TYPES = ["edge", "action", "swap", "strip"] as const satisfies readonly DiagramEvent["type"][];

/**
 * schema の書けない組み合わせ (`else: { not: { required: [欄] } }`) の 2 か所。誤りの場所の最後の欄で引き、根は "" で引く。
 * 2 か所とも ajv の誤りでは決まりの場所 (`#/else/not`) が同じになるので、誤りの場所で分ける
 */
const NOT_ALLOWED: Record<string, Allowed> = {
  "": { field: "sequence", kind: "sequence" },
  carry: { field: "text", kind: "tag" },
};

const escape = (key: string): string => key.replaceAll("~", "~0").replaceAll("/", "~1");

/** `^[^…]+$` の形の決まりから書けない字を読む。違う形の決まりでは `undefined` */
function forbiddenOf(pattern: string): Forbidden | undefined {
  const inside = /^\^\[\^(.+)\]\+\$$/u.exec(pattern)?.[1];
  if (inside === undefined) return undefined;
  const chars: string[] = inside.match(/\\.|[^\\]/gu) ?? [];
  return { space: chars.includes("\\s"), chars: chars.filter((char) => char !== "\\s").map((char) => char.replace(/^\\/u, "")) };
}

/** `anyOf` の中の決まりが出した誤り。`anyOf` の誤り 1 つにまとめて出す */
const branchesOf = (anyOf: ErrorObject, errors: readonly ErrorObject[]): ErrorObject[] =>
  errors.filter(
    (error) =>
      error !== anyOf &&
      error.schemaPath.startsWith(`${anyOf.schemaPath}/`) &&
      (error.instancePath === anyOf.instancePath || error.instancePath.startsWith(`${anyOf.instancePath}/`)),
  );

function toFieldError(error: ErrorObject, errors: readonly ErrorObject[], m: FieldMessages): FieldError {
  const params = error.params as Record<string, unknown>;
  const at = error.instancePath;
  switch (error.keyword) {
    case "additionalProperties": {
      const key = String(params.additionalProperty);
      return { pointer: `${at}/${escape(key)}`, message: m.additionalProperties(key) };
    }
    case "required": {
      const key = String(params.missingProperty);
      return { pointer: `${at}/${escape(key)}`, message: m.required(key) };
    }
    case "not": {
      const allowed = NOT_ALLOWED[at.slice(at.lastIndexOf("/") + 1)];
      return { pointer: allowed ? `${at}/${allowed.field}` : at, message: m.not(allowed) };
    }
    case "anyOf": {
      const branches = branchesOf(error, errors);
      const missing = branches.every((branch) => branch.keyword === "required") ? branches.map((branch) => String(branch.params.missingProperty)) : [];
      return { pointer: at, message: m.anyOf(missing) };
    }
    case "discriminator": {
      const tag = String(params.tag);
      return { pointer: `${at}/${escape(tag)}`, message: m.discriminator(tag, EVENT_TYPES) };
    }
    case "enum":
      return { pointer: at, message: m.enum((params.allowedValues as unknown[]).map(String)) };
    case "type":
      return { pointer: at, message: m.type(String(params.type)) };
    case "minLength":
      return { pointer: at, message: m.minLength(Number(params.limit)) };
    case "pattern":
      return { pointer: at, message: m.pattern(forbiddenOf(String(params.pattern))) };
    case "minItems":
      return { pointer: at, message: m.minItems(Number(params.limit)) };
    case "minimum":
      return { pointer: at, message: m.minimum(Number(params.limit)) };
    case "const":
      return { pointer: at, message: m.const(String(params.allowedValue)) };
    case "oneOf":
      return { pointer: at, message: m.oneOf };
    default:
      return { pointer: at, message: error.message ?? error.keyword };
  }
}

/** 原本の JSON を検査する。版が道具より新しいかは見ない (`readDiagram` が見る)。 */
export function validateDiagram(input: unknown, options: CheckOptions = {}): Checked {
  if (validate(input)) return { ok: true };
  const all = validate.errors ?? [];
  const inBranch = new Set(all.filter((error) => error.keyword === "anyOf").flatMap((anyOf) => branchesOf(anyOf, all)));
  const m = FIELD_MESSAGES[options.lang ?? "ja"];
  // 条件付きの決まり (if / then) は中で落ちた決まりの誤りを別に出すので、包む側の if の誤りは出さない
  const errors = all.filter((error) => error.keyword !== "if" && !inBranch.has(error)).map((error) => toFieldError(error, all, m));
  return { ok: false, errors };
}
