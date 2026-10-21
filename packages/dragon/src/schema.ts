/**
 * 図の原本の形と、原本を JSON Schema で検査する命令。
 *
 * 形の正は `schemas/diagram.schema.json` の 1 本で、下の型はその写し。
 * 誤りは JSON Pointer で場所を示す。欄が足りない時と知らない欄がある時は、その欄の場所まで示す。
 */
import Ajv, { type ErrorObject } from "ajv";
import schema from "./schemas/diagram.schema.json";

export type Color = "blue" | "amber" | "green" | "violet" | "rose" | "slate" | "coin";

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

const validate = new Ajv({ allErrors: true, discriminator: true, strictTypes: false }).compile(schema);

const escape = (key: string): string => key.replaceAll("~", "~0").replaceAll("/", "~1");

function toFieldError(error: ErrorObject): FieldError {
  const params = error.params as Record<string, unknown>;
  if (error.keyword === "additionalProperties") {
    const key = String(params.additionalProperty);
    return { pointer: `${error.instancePath}/${escape(key)}`, message: `${key} という欄は書けない` };
  }
  if (error.keyword === "required") {
    const key = String(params.missingProperty);
    return { pointer: `${error.instancePath}/${escape(key)}`, message: `${key} の欄が要る` };
  }
  return { pointer: error.instancePath, message: error.message ?? error.keyword };
}

/** 原本の JSON を検査する。版が道具より新しいかは見ない (`readDiagram` が見る)。 */
export function validateDiagram(input: unknown): Checked {
  if (validate(input)) return { ok: true };
  // 条件付きの決まり (if / then) は中で落ちた決まりの誤りを別に出すので、包む側の if の誤りは出さない
  const errors = (validate.errors ?? []).filter((error) => error.keyword !== "if").map(toFieldError);
  return { ok: false, errors };
}
