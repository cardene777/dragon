/**
 * LLM 向け JSON DSL parser。
 *
 * dragon の YAML DSL と 1:1 対応する JSON 記法を提供する。
 * LLM (Anthropic Claude / OpenAI GPT) が structured output (tool call / response_format)
 * で確実に生成できるよう、 flat な object array を優先した shape になっている。
 *
 * 使い方 (LLM):
 *   1. `packages/dragon/schemas/diagram.json` の JSON Schema を LLM の tool schema に注入
 *   2. LLM が JSON を返す
 *   3. `jsonToDiagram(json)` で CdlDiagram に変換
 *   4. validation error は throw、 retry loop で LLM に修正させる
 *
 * YAML との対応:
 *   YAML `title: "..."` ⇔ JSON `{title: "..."}`
 *   YAML `actors: [A, B: kind]` ⇔ JSON `{actors: [{name: "A"}, {name: "B", kind: "storage"}]}`
 *   YAML `flow: [- A -> B: "label"]` ⇔ JSON `{flow: [{from: "A", to: "B", label: "label"}]}`
 *   YAML `animation: [step: "..."]` ⇔ JSON `{animation: [{step: "...", duration: 1.4, focus: [...]}]}`
 */

import type { CdlDiagram, NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import type { DslDocument, DslActor, DslStep, DslAnimate, DslPhase, PresetType } from "./types";
import { compileToCdl } from "./compile";

/**
 * LLM 向け JSON DSL の入力 shape。 YAML DSL と 1:1 対応、 top-level は flat な object。
 */
export interface DragonJson {
  /** 図の title (必須) */
  title: string;
  /** preset type (必須): sequence / flow / swimlane / er / state / topology / solidity / gantt / class / pie / c4 / mind */
  type: PresetType;
  /** 登場人物 (必須): 文字列 or { name, kind, ... } object */
  actors: (string | JsonActor)[];
  /** flow step 配列 (必須): { from, to, label, ... } */
  flow: JsonStep[];
  /** animation phase 配列 (optional) */
  animation?: JsonPhase[];
  /** viewport (optional): 全体 canvas size / gap */
  viewport?: {
    width?: number;
    height?: number;
    laneWidth?: number;
    gap?: number;
    laneGap?: number;
    nodeGap?: number;
    labelMargin?: number;
  };
  /** lanes (optional): topology / swimlane preset で使う lane 宣言 */
  lanes?: Record<string, {
    x?: number;
    width?: number;
    label?: string;
    contain?: boolean;
    lifeline?: boolean;
  }>;
  /** groups (optional): topology preset で使う group 宣言 */
  groups?: Record<string, {
    label?: string;
    lanes: string[];
  }>;
}

export interface JsonActor {
  name: string;
  kind?: NodeKind;
  subtitle?: string;
  eyebrow?: string;
  value?: string;
  rows?: string[];
  lane?: string;
  stack?: number;
  initial?: boolean;
  final?: boolean;
}

export interface JsonStep {
  from: string;
  to: string;
  label: string;
  sub?: string;
  tone?: Tone;
  style?: EdgeStyle;
  guard?: string;
  cardinality?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface JsonPhase {
  /** phase name (必須) */
  step: string;
  /** duration in seconds (default 1.4) */
  duration?: number;
  /** highlight 対象 (actor name / edge "A -> B") */
  focus?: string[];
  /** body 説明文 */
  body?: string;
  /** badge label */
  badge?: string;
}

/**
 * JSON DSL error。 line 概念がないため、 field path (JSON pointer style) で位置を示す。
 */
export interface JsonDslError {
  path: string;
  message: string;
  hint?: string;
}

const VALID_PRESETS: readonly PresetType[] = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "c4",
  "mind",
] as const;

/**
 * shape validation。 layer 1 = 必須 field + 型 check、 layer 2 は compile 側の validation に委譲。
 * fail-fast ではなく全 error 収集して返す (LLM に一括で修正させるため)。
 */
function validateJson(json: unknown): { ok: true; data: DragonJson } | { ok: false; errors: JsonDslError[] } {
  const errors: JsonDslError[] = [];
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { ok: false, errors: [{ path: "$", message: "root must be a JSON object" }] };
  }
  const j = json as Record<string, unknown>;

  if (typeof j.title !== "string" || j.title.length === 0) {
    errors.push({ path: "$.title", message: "title must be a non-empty string" });
  }
  if (typeof j.type !== "string" || !VALID_PRESETS.includes(j.type as PresetType)) {
    errors.push({
      path: "$.type",
      message: `type must be one of: ${VALID_PRESETS.join(", ")}`,
      hint: typeof j.type === "string" ? `got "${j.type}"` : undefined,
    });
  }
  if (!Array.isArray(j.actors) || j.actors.length === 0) {
    errors.push({ path: "$.actors", message: "actors must be a non-empty array" });
  } else {
    j.actors.forEach((a, i) => {
      if (typeof a === "string") return;
      if (!a || typeof a !== "object" || Array.isArray(a)) {
        errors.push({ path: `$.actors[${i}]`, message: "actor must be string or object" });
        return;
      }
      const ao = a as Record<string, unknown>;
      if (typeof ao.name !== "string" || ao.name.length === 0) {
        errors.push({ path: `$.actors[${i}].name`, message: "actor.name must be a non-empty string" });
      }
    });
  }
  if (!Array.isArray(j.flow)) {
    errors.push({ path: "$.flow", message: "flow must be an array" });
  } else {
    j.flow.forEach((s, i) => {
      if (!s || typeof s !== "object" || Array.isArray(s)) {
        errors.push({ path: `$.flow[${i}]`, message: "step must be an object" });
        return;
      }
      const so = s as Record<string, unknown>;
      if (typeof so.from !== "string") errors.push({ path: `$.flow[${i}].from`, message: "step.from must be a string" });
      if (typeof so.to !== "string") errors.push({ path: `$.flow[${i}].to`, message: "step.to must be a string" });
      if (typeof so.label !== "string") errors.push({ path: `$.flow[${i}].label`, message: "step.label must be a string" });
    });
  }
  if (j.animation !== undefined) {
    if (!Array.isArray(j.animation)) {
      errors.push({ path: "$.animation", message: "animation must be an array if present" });
    } else {
      j.animation.forEach((p, i) => {
        if (!p || typeof p !== "object" || Array.isArray(p)) {
          errors.push({ path: `$.animation[${i}]`, message: "phase must be an object" });
          return;
        }
        const po = p as Record<string, unknown>;
        if (typeof po.step !== "string" || po.step.length === 0) {
          errors.push({ path: `$.animation[${i}].step`, message: "phase.step must be a non-empty string" });
        }
      });
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: j as unknown as DragonJson };
}

/**
 * JSON DSL → DslDocument (AST) 変換。 pos は JSON なので line 情報なし、 全て line 0。
 */
function jsonToDoc(json: DragonJson): DslDocument {
  const p0 = { line: 0 };
  const actors: DslActor[] = json.actors.map((a) => {
    if (typeof a === "string") {
      return { name: a, kind: "actor" as NodeKind, pos: p0 };
    }
    return {
      name: a.name,
      kind: (a.kind ?? "actor"),
      subtitle: a.subtitle,
      eyebrow: a.eyebrow,
      value: a.value,
      rows: a.rows,
      lane: a.lane,
      stack: a.stack,
      initial: a.initial,
      final: a.final,
      pos: p0,
    };
  });
  const flow: DslStep[] = json.flow.map((s, i) => ({
    no: i + 1,
    from: s.from,
    to: s.to,
    label: s.label,
    sub: s.sub,
    tone: s.tone,
    style: s.style,
    guard: s.guard,
    cardinality: s.cardinality,
    labelOffsetX: s.labelOffsetX,
    labelOffsetY: s.labelOffsetY,
    pos: p0,
  }));
  let animate: DslAnimate | undefined;
  if (json.animation && json.animation.length > 0) {
    const phases: DslPhase[] = json.animation.map((p) => ({
      name: p.step,
      durationMs: Math.round((p.duration ?? 1.4) * 1000),
      highlight: p.focus,
      body: p.body,
      badge: p.badge,
      pos: p0,
    }));
    animate = { states: [], phases, pos: p0 };
  }
  return {
    title: json.title,
    type: json.type,
    actors,
    flow,
    animate,
    viewport: json.viewport ? { ...json.viewport, pos: p0 } : undefined,
    lanes: json.lanes
      ? Object.fromEntries(
          Object.entries(json.lanes).map(([id, l]) => [id, { id, ...l, pos: p0 }]),
        )
      : undefined,
    groups: json.groups
      ? Object.fromEntries(
          Object.entries(json.groups).map(([id, g]) => [id, { id, label: g.label, lanes: g.lanes, pos: p0 }]),
        )
      : undefined,
    pos: p0,
  };
}

/**
 * LLM 向け JSON DSL の parse + compile 一発変換。
 *
 * @param json - DragonJson shape の object (parsed JSON、 not string)
 * @returns CdlDiagram (@cardenelabs/cdl の CdlDiagramView 等に渡せる)
 * @throws Error - validation error + hint 付きの詳細メッセージ、 LLM に retry させるための情報を含む
 *
 * @example
 * const diagram = jsonToDiagram({
 *   title: "ログインAPI",
 *   type: "sequence",
 *   actors: ["User", "API", { name: "DB", kind: "storage" }],
 *   flow: [
 *     { from: "User", to: "API", label: "login" },
 *     { from: "API", to: "DB", label: "SELECT" },
 *   ],
 *   animation: [
 *     { step: "call", duration: 1.4, focus: ["User", "API"] },
 *   ],
 * });
 */
export function jsonToDiagram(json: unknown): CdlDiagram {
  const v = validateJson(json);
  if (!v.ok) {
    const msg = v.errors.map((e) => `  ${e.path}: ${e.message}${e.hint ? ` (${e.hint})` : ""}`).join("\n");
    throw new Error(`Dragon JSON DSL validation error:\n${msg}`);
  }
  const doc = jsonToDoc(v.data);
  return compileToCdl(doc);
}

/**
 * JSON DSL を validate だけ実施 (compile しない)。 error 詳細を配列で取得したい場合に使う。
 * LLM の structured output の retry loop で、 error path を prompt に注入する用途。
 */
export function validateDragonJson(
  json: unknown,
): { ok: true; data: DragonJson } | { ok: false; errors: JsonDslError[] } {
  return validateJson(json);
}
