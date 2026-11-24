/**
 * 原本の形の検査が出した ajv の誤りを、原本の欄の場所と誤りの文にする処理 (#2999、#3846)。
 *
 * 原本の JSON を読む時だけ要るので、原本の検査の塊 (`schemas/validator.ts`) と一緒に後から読み、最初に読む束に入れない
 */
import type { ErrorObject } from "ajv";
import { ICON_NAMES } from "../blocks/icon/block";
import type { Allowed, FieldMessages, Forbidden } from "../field-messages";
import { toVersion1Pointer, version1SectionOf } from "../model";
import { nearest } from "../nearest";
import { type DiagramEvent, type FieldError, PIPE_EVENTS, type TryPart } from "../schema";
import { STATE_ENDS } from "../words";

/** 段の中で起きることの種類。schema の event の `discriminator` が見る `type` の値 */
const EVENT_TYPES = ["edge", "action", "swap", "strip", "commit", "branch", "delete", "now", "mark", "span", "leaf", "node", "line", "seal", "open", "pick", "stamp", "ask", "press", "item", "call", "return", "revert", "move", "write", "check", "emit", "calc", "set", "lookup", "cell", "formula", "count", "none", "card", "card-move", "card-delete", "refuse"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図の部品の種類。schema の part の `discriminator` が見る `type` の値 (#3337) */
const PART_TYPES = ["route", "queue", "chain", "log", "ask", "press"] as const satisfies readonly TryPart["type"][];

/**
 * その種類の図に書けない根の欄を書いた時の決まりの場所 (#3164)。根の欄に `not: {}` を置く決まり (`absent`) を指し、
 * 誤りの場所の最後の欄が書いた欄になる。種類の欄は、その欄と同じ名前の図の種類だけが書ける
 */
const ABSENT = "#/definitions/absent/not";
/**
 * 種類の欄でない欄を書ける図の種類。区画は枝分かれの図と時間軸の図に書けない。
 * 線の列 (`at` と `into`)、節目の丸の色 (`color`)、物差し (`meters`) は時間軸の図だけが書ける (#3165)
 */
const ABSENT_KINDS: Record<string, string> = {
  regions: "sequence / architecture / state",
  group: "sequence / architecture / state",
  path: "state / flow",
  choice: "flow",
  branch: "git",
  scale: "time",
  period: "time",
  row: "time",
  task: "time",
  point: "time",
  zoom: "time",
  item: "lineup / try",
  role: "lineup",
  part: "try",
  check: "try",
  values: "try",
  hold: "pipe",
  box: "sequence / architecture / state / git / time / tree / lineup / pipe / flow / cycle / matrix / sankey / cards",
  order: "lineup",
  limit: "lineup",
  at: "time",
  into: "time",
  color: "time",
  meters: "time",
  region: "sequence / architecture / state",
  icon: "sequence / architecture / state / git / time / tree / pipe / flow / cycle",
  link: "sequence / architecture / state / git / time / tree / flow / cycle",
  gist: "pipe",
  chart: "chart",
  matrix: "matrix",
  table: "er",
  circle: "venn",
  card: "cards",
  mark: "cards",
};
/** 運ぶ物の書けない組み合わせ (`not: { required: [欄] }`)。誤りの場所の最後の欄で引く */
const NOT_ALLOWED: Record<string, Allowed> = {
  carry: { field: "text", kind: "tag" },
};

/** 状態遷移図と手順の図 (#3561) の箱と判断の名札に予約の名前を書いた時の決まりの場所 */
const RESERVED_ID = /\/(?:box|choice)\/items\/properties\/id\/not$/u;
/** 枝分かれの図でない図に、枝分かれの図だけの出来事を書いた時の決まりの場所 (#3164) */
const GIT_EVENT = /\/events\/items\/properties\/type\/not$/u;
/** 枝分かれの図だけが書ける出来事 */
const GIT_EVENTS = ["commit", "branch", "delete"] as const satisfies readonly DiagramEvent["type"][];
/** 時間軸の図でない図に、時間軸の図だけの出来事を書いた時の決まりの場所 (#3165)。出来事に `not` を置く */
const TIME_EVENT = /\/events\/items\/not$/u;
/** 時間軸の図だけが書ける出来事 */
const TIME_EVENTS = ["now", "mark", "span"] as const satisfies readonly DiagramEvent["type"][];
/** 木の図でない図に、木の図だけの出来事を書いた時の決まりの場所 (#3233)。出来事の `allOf` の中に `not` を置く */
const TREE_EVENT = /\/events\/items\/allOf\/0\/not$/u;
/** 木の図だけが書ける出来事 */
const TREE_EVENTS = ["leaf", "node"] as const satisfies readonly DiagramEvent["type"][];
/** 列の図でない図に、列の図だけの出来事を書いた時の決まりの場所 (#3239) */
const LINEUP_EVENT = "#/definitions/notLineupEvent/not";
/** 列の図だけが書ける出来事 */
const LINEUP_EVENTS = ["line", "seal", "open", "pick", "stamp", "role"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図でない図に、試す図だけの出来事を書いた時の決まりの場所 (#3337) */
const TRY_EVENT = "#/definitions/notTryEvent/not";
/** 試す図だけが書ける出来事 */
const TRY_EVENTS = ["ask", "press", "item"] as const satisfies readonly DiagramEvent["type"][];
/** 配管の図でない図に、配管の図だけの出来事を書いた時の決まりの場所 (#3389) */
const PIPE_EVENT = "#/definitions/notPipeEvent/not";
/** 量の図でない図に、量の図だけの出来事を書いた時の決まりの場所 (#3560) */
const CHART_EVENT = "#/definitions/notChartEvent/not";
/** 量の図だけが書ける出来事 */
const CHART_EVENTS = ["set"] as const satisfies readonly DiagramEvent["type"][];
/** 考えを広げる地図でない図に、考えを広げる地図だけの出来事を書いた時の決まりの場所 (#3619) */
const MIND_EVENT = "#/definitions/notMindEvent/not";
/** 考えを広げる地図だけが書ける出来事 */
const MIND_EVENTS = ["idea"] as const satisfies readonly DiagramEvent["type"][];
/** 表どうしの関係の図でない図に、表どうしの関係の図だけの出来事を書いた時の決まりの場所 (#3618) */
const ER_EVENT = "#/definitions/notErEvent/not";
/** 表どうしの関係の図だけが書ける出来事 */
const ER_EVENTS = ["lookup", "cell", "formula"] as const satisfies readonly DiagramEvent["type"][];
/** 集合の重なりの図でない図に、集合の重なりの図だけの出来事を書いた時の決まりの場所 (#3620) */
const VENN_EVENT = "#/definitions/notVennEvent/not";
/** 集合の重なりの図だけが書ける出来事 */
const VENN_EVENTS = ["count", "none"] as const satisfies readonly DiagramEvent["type"][];
/** 持ち主ごとのカードの図でない図に、持ち主ごとのカードの図だけの出来事を書いた時の決まりの場所 (#3846) */
const CARDS_EVENT = "#/definitions/notCardsEvent/not";
/** 持ち主ごとのカードの図だけが書ける出来事 */
const CARDS_EVENTS = ["card", "card-move", "card-delete", "refuse"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図の部品の種類の決まりの場所 (#3337) */
const PART_TAG = "#/definitions/part/discriminator";
/** 列の図に、線と処理の出来事を書いた時の決まりの場所 (#3239) */
const WIRED_EVENT = "#/definitions/notWiredEvent/not";
/** 列の図が書けない、箱と線の図の出来事 */
const WIRED_EVENTS = ["edge", "action"] as const satisfies readonly DiagramEvent["type"][];
/** 時間軸の図の目盛りの長さの決まり (`^[0-9]+(\.[0-9]+)?(<単位>|<単位>)$`)。書ける単位を読む */
const DURATION = /^\^\[0-9\]\+\(\\\.\[0-9\]\+\)\?\(([a-z|]+)\)\$$/u;
/** 割合の決まり。百分率の `%` を持つ */
const RATIO = /%\)\$$/u;

const escape = (key: string): string => key.replaceAll("~", "~0").replaceAll("/", "~1");

/** JSON Pointer `pointer` が指す `input` の中の値。辿れない時は `undefined` */
function valueAt(input: unknown, pointer: string): unknown {
  let value = input;
  for (const raw of pointer.split("/").slice(1)) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Record<string, unknown>)[raw.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  return value;
}

/** 箱の飛び先と段の出典の URL の決まりの場所 (#3199) */
const URL_RULE = "#/definitions/url/pattern";

/** 箱と区画のアイコン名の決まりの場所 (#3311)。近い名前が在れば一覧の代わりにそれを示す (#3315) */
const ICON_RULE = "#/definitions/icon/enum";

/** commit の hash の決まり (`^[0-9a-f]{<最小>,<最大>}$`)。字の数の幅を読む */
const HEX = /^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;

/** `^[^…]+$` の形の決まりから書けない字を読む。違う形の決まりでは `undefined` */
function forbiddenOf(pattern: string): Forbidden | undefined {
  const inside = /^\^\[\^(.+)\]\+\$$/u.exec(pattern)?.[1];
  if (inside === undefined) return undefined;
  const chars: string[] = inside.match(/\\.|[^\\]/gu) ?? [];
  return { space: chars.includes("\\s"), chars: chars.filter((char) => char !== "\\s").map((char) => char.replace(/^\\/u, "")) };
}

/** `anyOf` の中の決まりが出した誤り。`anyOf` の誤り 1 つにまとめて出す */
export const branchesOf = (anyOf: ErrorObject, errors: readonly ErrorObject[]): ErrorObject[] =>
  errors.filter(
    (error) =>
      error !== anyOf &&
      error.schemaPath.startsWith(`${anyOf.schemaPath}/`) &&
      (error.instancePath === anyOf.instancePath || error.instancePath.startsWith(`${anyOf.instancePath}/`)),
  );

export function toFieldError(error: ErrorObject, errors: readonly ErrorObject[], m: FieldMessages, input: unknown): FieldError {
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
      if (RESERVED_ID.test(error.schemaPath)) return { pointer: at, message: (input as { kind?: unknown }).kind === "flow" ? m.flowReserved(STATE_ENDS) : m.reserved(STATE_ENDS) };
      if (GIT_EVENT.test(error.schemaPath)) return { pointer: at, message: m.kindOnly(GIT_EVENTS, "git") };
      if (TIME_EVENT.test(error.schemaPath)) return { pointer: `${at}/type`, message: m.kindOnly(TIME_EVENTS, "time") };
      if (TREE_EVENT.test(error.schemaPath)) return { pointer: `${at}/type`, message: m.kindOnly(TREE_EVENTS, "tree") };
      if (error.schemaPath === LINEUP_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(LINEUP_EVENTS, "lineup") };
      if (error.schemaPath === TRY_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(TRY_EVENTS, "try") };
      if (error.schemaPath === PIPE_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(PIPE_EVENTS, "pipe") };
      if (error.schemaPath === CHART_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(CHART_EVENTS, "chart") };
      if (error.schemaPath === MIND_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(MIND_EVENTS, "mind") };
      if (error.schemaPath === ER_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(ER_EVENTS, "er") };
      if (error.schemaPath === VENN_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(VENN_EVENTS, "venn") };
      if (error.schemaPath === CARDS_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(CARDS_EVENTS, "cards") };
      if (error.schemaPath === WIRED_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(WIRED_EVENTS, "sequence / architecture / state / git / time / tree") };
      const last = at.slice(at.lastIndexOf("/") + 1);
      if (error.schemaPath === ABSENT) return { pointer: at, message: m.not({ field: last, kind: ABSENT_KINDS[last] ?? last }) };
      const allowed = NOT_ALLOWED[last];
      return { pointer: allowed ? `${at}/${allowed.field}` : at, message: m.not(allowed) };
    }
    case "anyOf": {
      const branches = branchesOf(error, errors);
      const missing = branches.every((branch) => branch.keyword === "required") ? branches.map((branch) => String(branch.params.missingProperty)) : [];
      return { pointer: at, message: m.anyOf(missing) };
    }
    case "discriminator": {
      const tag = String(params.tag);
      return { pointer: `${at}/${escape(tag)}`, message: m.discriminator(tag, error.schemaPath === PART_TAG ? PART_TYPES : EVENT_TYPES) };
    }
    case "enum": {
      const written = error.schemaPath === ICON_RULE ? valueAt(input, at) : undefined;
      const near = typeof written === "string" ? nearest(written, ICON_NAMES) : undefined;
      if (typeof written === "string" && near !== undefined) return { pointer: at, message: m.unknownIcon(written, near) };
      return { pointer: at, message: m.enum((params.allowedValues as unknown[]).map(String)) };
    }
    case "type":
      return { pointer: at, message: m.type(String(params.type)) };
    case "minLength":
      return { pointer: at, message: m.minLength(Number(params.limit)) };
    case "maxLength":
      return { pointer: at, message: m.maxLength(Number(params.limit)) };
    case "pattern": {
      if (error.schemaPath === URL_RULE) return { pointer: at, message: m.url };
      const pattern = String(params.pattern);
      const hex = HEX.exec(pattern);
      if (hex) return { pointer: at, message: m.hex(Number(hex[1]), Number(hex[2])) };
      const duration = DURATION.exec(pattern);
      if (duration) return { pointer: at, message: m.duration((duration[1] ?? "").split("|")) };
      if (RATIO.test(pattern)) return { pointer: at, message: m.ratio };
      return { pointer: at, message: m.pattern(forbiddenOf(pattern)) };
    }
    case "minItems":
      return { pointer: at, message: m.minItems(Number(params.limit)) };
    case "maxItems":
      return { pointer: at, message: m.maxItems(Number(params.limit)) };
    case "minimum":
      return { pointer: at, message: m.minimum(Number(params.limit)) };
    case "exclusiveMinimum":
      return { pointer: at, message: m.exclusiveMinimum(Number(params.limit)) };
    case "maximum":
      return { pointer: at, message: m.maximum(Number(params.limit)) };
    case "const":
      return { pointer: at, message: m.const(String(params.allowedValue)) };
    case "oneOf":
      return { pointer: at, message: m.oneOf };
    default:
      return { pointer: at, message: error.keyword };
  }
}

const unescape = (key: string): string => key.replaceAll("~1", "/").replaceAll("~0", "~");

/**
 * 版2へ移した版1の原本の誤りを、版1の欄の場所の誤りにする。図の種類が書けない欄は、版1の図の種類の欄 (`/git` など) の場所にする。
 * 欄が足りない時と知らない欄がある時は、欄の名前も版1の名前にする
 */
export function toVersion1Error(error: ErrorObject): ErrorObject {
  const section = error.schemaPath === ABSENT ? version1SectionOf(error.instancePath) : undefined;
  if (section !== undefined) return { ...error, instancePath: section };
  const param = error.keyword === "required" ? "missingProperty" : error.keyword === "additionalProperties" ? "additionalProperty" : undefined;
  if (param === undefined) return { ...error, instancePath: toVersion1Pointer(error.instancePath) };
  const full = toVersion1Pointer(`${error.instancePath}/${escape(String(error.params[param as keyof typeof error.params]))}`);
  const cut = full.lastIndexOf("/");
  return { ...error, instancePath: full.slice(0, cut), params: { ...error.params, [param]: unescape(full.slice(cut + 1)) } };
}
