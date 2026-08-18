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

import { PRESET_TYPES } from "./v05/parser";
import type { CompileToCdlOpts } from "./compile";
import type { CdlDiagram, NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import type { DslDocument, DslActor, DslStep, DslAnimate, DslPhase, DslState, PresetType, LayoutMode, LayoutPos } from "./types";
import { checkValueExpression, isValueName, valueNameIssue } from "./value-syntax";
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
  /**
   * 状態の初期値 (optional)。 記法の `states:` と同じ (#1181)。
   *
   * `{名前}` を箱の文字に置くと、ここに書いた値が描画側で置き換わる。 名前は英数字と `_`
   * だけ (描画側が置き換える時に見る範囲と揃える)。
   *
   * ここに書けるのは初期値まで。 段で動かすのは `animation[].tween` / `animation[].set`
   * (`#1186` で追加、記法の `tween:` / `set:` と同じ)。
   */
  states?: Record<string, number | string>;
  /**
   * 他の値から自動で決まる値 (optional)。 記法の `values:` と同じ (#1181)。
   *
   * 式には四則 (`+ - * /`) と括弧、比較 (`> >= < <= == !=`)、`min` / `max` が書ける。
   * 他の値は `{名前}` で読む。 解くのは描画側で、毎 frame 参照から順に決まる。
   */
  values?: Record<string, string>;
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
    /**
     * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` = auto layout offset。 未指定は
     * backward compat、 set 済は Phase 2 の applyPosOffset で lane 位置を shift する。
     */
    pos?: LayoutPos;
  }>;
  /** groups (optional): topology preset で使う group 宣言 */
  groups?: Record<string, {
    label?: string;
    lanes: string[];
  }>;
  /**
   * canvas pivot (CAR-1693 Phase 1) diagram-level layout mode。 "auto" (default) は catalog 100+
   * backward compat、 "manual" は Phase 4 で drag → pos: 保存の完全 manual mode として使う予定。
   */
  layout?: LayoutMode;
}

export interface JsonActor {
  name: string;
  /**
   * CAR-1657 unified syntax = 既存 NodeKind (28 個) に加えて parts identifier (arc-gauge 等) を
   * accept する。 未知 kind 値は parts 候補として partId に格納、 compile 側 partsCatalog で解決。
   * LLM structured output の typing 制約を緩めるため union に string 追加。
   * `string & {}` = NodeKind の候補を IDE 補完で提示しつつ任意 string も許容する idiom。
   * 素の `NodeKind | string` は no-redundant-type-constituents に抵触し補完も潰れる (#865)。
   */
  kind?: NodeKind | (string & {});
  subtitle?: string;
  eyebrow?: string;
  value?: string;
  rows?: string[];
  lane?: string;
  stack?: number;
  initial?: boolean;
  final?: boolean;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` = auto layout offset。 未指定は
   * backward compat、 set 済は Phase 2 の applyPosOffset で actor 由来 lane / node の位置を shift。
   */
  pos?: LayoutPos;
  /**
   * CAR-1657 parts state override (kind = parts identifier 時のみ有効)。
   * LLM JSON DSL では nested 明示 = `{ "state": { "v": 50 } }` が natural、 human 側の
   * inline 拡散 pattern (`- arc1: { kind: arc-gauge, v: 50 }`) とは記述形式が分岐する
   * (spec § 2.3 分岐設計、 human = YAML 手書き最適 / LLM = JSON structured 最適)。
   */
  state?: Record<string, number | string | boolean>;
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
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` = edge label offset。 未指定は
   * backward compat、 set 済は Phase 2 の applyPosOffset で edge label 位置を shift する。
   */
  pos?: LayoutPos;
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
  /**
   * 段の中で値を動かす (#1186)。 記法の `tween: name 100 -> 90` と同じ。
   *
   * 足すまで JSON の入口は `states:` で初期値を書けても **動かす手段が無かった** ため、
   * 同じ図を記法で書くと動き JSON で書くと静止する状態だった (#1181 で状態を足した時の残り)。
   */
  tween?: Record<string, readonly [number, number]>;
  /**
   * 段の切替で値を差し替える (#1186)。 記法の `set: name value` と同じ。
   *
   * `tween` が段の中を補間するのに対し、こちらは段の切替時に 1 度だけ変える。
   */
  set?: Record<string, number | string>;
}

/**
 * JSON DSL error。 line 概念がないため、 field path (JSON pointer style) で位置を示す。
 */
export interface JsonDslError {
  path: string;
  message: string;
  hint?: string;
}

/**
 * CAR-1657 = 既存 NodeKind list (v05/parser.ts の NODE_KIND_VALID と揃える必要あり)。
 * 未知 kind 値は parts identifier 候補として partId に格納する経路の判定基準。
 * v05 parser との drift 防止のため、 別 PR で共通化検討 (`packages/dragon/src/kinds.ts` etc)。
 */
const VALID_KIND_SET: ReadonlySet<string> = new Set([
  "actor", "function", "storage", "event", "cdn", "service", "database",
  "cache", "queue", "api", "person", "entity", "state", "container", "card",
  "lambda", "kms", "secret", "alb", "ecs", "rds", "s3", "iam", "user", "browser",
  "contract", "eoa", "multisig", "proxy", "library", "interface",
]);

/**
 * 受け付ける図種。 **記法側と同じ集合を使う** (`v05/parser.ts` の `PRESET_TYPES`)。
 *
 * 以前はここに一覧を写していたため、 記法に型を足しても JSON 経路が古い一覧のまま弾いた
 * (`bar` / `line` で実際に起きた)。 型が 3 箇所に散らばると、 必ずどれかが古くなる。
 */
const VALID_PRESETS: readonly PresetType[] = [...PRESET_TYPES];

/**
 * shape validation。 layer 1 = 必須 field + 型 check、 layer 2 は compile 側の validation に委譲。
 * fail-fast ではなく全 error 収集して返す (LLM に一括で修正させるため)。
 */
/**
 * CAR-1693 Phase 1: DSL 表面 `pos: {x, y}` の型 check helper。 finite number pair を必須にし、
 * `NaN` / `Infinity` / non-number は reject する (Phase 2 の applyPosOffset で数値演算するため)。
 */
function validateLayoutPos(v: unknown, path: string, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({ path, message: "pos must be an object with x and y numbers" });
    return;
  }
  const p = v as Record<string, unknown>;
  if (typeof p.x !== "number" || !Number.isFinite(p.x)) {
    errors.push({ path: `${path}.x`, message: "pos.x must be a finite number" });
  }
  if (typeof p.y !== "number" || !Number.isFinite(p.y)) {
    errors.push({ path: `${path}.y`, message: "pos.y must be a finite number" });
  }
}

/**
 * 写しを作る時の入れ子の深さの上限。
 *
 * 枠の並びの長さが入れ子の深さで決まる。 図の入れ子は深くても数段で、 64 に届く形は書けない。
 */
const 写しの最大の深さ = 64;

/**
 * 写しを作る時に触る値の数の上限。
 *
 * **書式の規則ではなく、 資源を使い切らないための歯止め**。 図の書式は値の数を制限していないので、
 * ここで拒むのは「構造としては正しいが大きすぎる」 入力になる。 だから **正当な入力が届かない
 * 高さ** に置く。
 *
 * 500 万は、 記法の入力の大きさの上限 (`input-size.ts` の 512KB) を全て 2 文字の値で埋めても
 * 届かない数になる。 JSON でも同じ規模の図が 500 万個の値を持つことはない。
 *
 * **数を数えないと守れない** (Round 4 の指摘)。 一度は「写しの大きさは元の入力の大きさで決まる
 * から数える意味が無い」 として外したが、 これは誤りだった。 Proxy は読まれるたびに新しい object
 * を返せるため、 **小さな入力から枝を生やせる** (実測 = 1 個の Proxy が深さ 6 / 6 分岐で
 * 55,987 個の object に膨らんだ)。 深さの上限だけでは横の広がりを止められない。
 */
const 写しの最大の項目数 = 5_000_000;

/** 写しを作れなかった理由 (path 付き) */
class 写せない extends Error {
  constructor(
    readonly path: string,
    readonly 理由: string,
  ) {
    super(`${path}: ${理由}`);
  }
}

/**
 * 検査の前に 1 度だけ読んで作る、 素のデータの複製 (#1217)。
 *
 * 入口は検査する時と図に写す時で同じ項目を 2 度読んでいた。 渡された object が値を返す関数
 * (getter) を持っていると、 2 度目の読み取りで別の値を返せる = **検査を通った値と図に届く値が
 * 別物になり、 検査が意味を持たない** (実測 = `animation[0].tween` を 6 回目から
 * `[NaN, Infinity]` を返す getter にすると、 検査を通って図に `from: null` が届いた)。
 *
 * ここで 1 度だけ読んで写しを作り、 以降は写しだけを読む。 各項目の読み取りは 1 回で、
 * 項目の名前も添字も同じ値を 2 度取りに行かない。
 *
 * **`structuredClone` は使わない**。 関数や symbol を含む入力で `DataCloneError` を投げるため、
 * `validateDragonJson` が約束している「誤りは `{ ok: false, errors }` で返す」 が破れる。
 * 自前で写せば、 写せない値もそのまま持ち越して検査側の型の判定に落とせる。
 *
 * **再帰では書かない** (Round 1 の指摘)。 検査が見ない項目も含めて写すため、 深い入れ子を渡すと
 * 呼び出しの積み上げが溢れる (実測 = 使わない項目に 20,000 段の入れ子を付けると
 * `RangeError: Maximum call stack size exceeded`)。 枠を自前で積んで回す。
 *
 * **読む順は書いた順のまま、 深さ優先で降りる** (Round 2 / 3 の指摘)。 値を返す関数が副作用を
 * 持つ入力では読む順が結果に出るため、 再帰で書いた時と同じ順を保つ。 幅優先で回すと、 先に
 * 書いた兄弟の深い所より後の兄弟の浅い所を先に読む。
 *
 * **読み取りの例外も外に出さない** (Round 1 の指摘)。 項目の名前を数える所も値を読む所も、
 * getter や Proxy が投げれば `validateDragonJson` 自体が throw して約束が破れる。 投げた場所を
 * path として拾い、 検査の誤りに変える。
 *
 * 書き込みは `Object.defineProperty` で行う = `__proto__` を項目名に持つ入力で代入が
 * prototype の setter に落ちるのを避ける (`JSON.parse` と同じく普通の項目として持つ)。
 * `__proto__` を書いた時の扱いそのものは `#1184` が持つ。
 *
 * 輪 (自分を指す入れ子) は同じ写しを返して止める。 JSON からは作れないが、 object を直接
 * 渡す経路では作れる。
 */
function 素のデータに写す(
  root: unknown,
): { ok: true; value: unknown } | { ok: false; error: JsonDslError } {
  const 写し済 = new WeakMap<object, unknown[] | Record<string, unknown>>();
  let 項目数 = 0;
  // 例外を拾った時に「どこを読んでいたか」 を言うために持つ。 投げるのは値を読む所と名前を
  // 数える所の両方で、 どちらも path を持たないまま外へ出ると `$` としか言えない
  let 読んでいる場所 = "$";

  /** まだ中身を埋めていない入れ物と、 その進み具合 */
  type 枠 = {
    元: object;
    器: unknown[] | Record<string, unknown>;
    名前の並び: string[];
    次: number;
    深さ: number;
    path: string;
  };

  /** 入れ物だけ作る (ここでは降りない)。 新しく作った時だけ枠を返す */
  const 器を作る = (
    v: unknown,
    深さ: number,
    path: string,
  ): { 値: unknown; 枠: 枠 | null } => {
    項目数 += 1;
    if (項目数 > 写しの最大の項目数) {
      throw new 写せない(path, `項目が多すぎる (上限 ${写しの最大の項目数})`);
    }
    if (v === null || typeof v !== "object") return { 値: v, 枠: null };

    const 既にある = 写し済.get(v);
    if (既にある !== undefined) return { 値: 既にある, 枠: null };

    if (深さ >= 写しの最大の深さ) {
      throw new 写せない(path, `入れ子が深すぎる (上限 ${写しの最大の深さ})`);
    }
    読んでいる場所 = path;
    const 並びか = Array.isArray(v);
    const 器: unknown[] | Record<string, unknown> = 並びか ? [] : {};
    写し済.set(v, 器);
    // 名前はここで 1 度だけ数える。 値は降りながら 1 つずつ読む
    const 名前の並び = 並びか
      ? Array.from({ length: (v as unknown[]).length }, (_, i) => String(i))
      : Object.keys(v as Record<string, unknown>);
    return { 値: 器, 枠: { 元: v, 器, 名前の並び, 次: 0, 深さ, path } };
  };

  try {
    const 先頭 = 器を作る(root, 0, "$");
    const 積み: 枠[] = 先頭.枠 ? [先頭.枠] : [];

    while (積み.length > 0) {
      const 今 = 積み[積み.length - 1]!;
      if (今.次 >= 今.名前の並び.length) {
        積み.pop();
        continue;
      }
      const key = 今.名前の並び[今.次]!;
      今.次 += 1;
      const 子のpath = Array.isArray(今.元) ? `${今.path}[${key}]` : `${今.path}.${key}`;

      // 読む直前に場所を控える = 値の読み取りそのものが投げるため、 読んだ後では遅い
      読んでいる場所 = 子のpath;
      const 生の値 = (今.元 as Record<string, unknown>)[key];

      const 子 = 器を作る(生の値, 今.深さ + 1, 子のpath);
      if (Array.isArray(今.器)) 今.器.push(子.値);
      else {
        Object.defineProperty(今.器, key, {
          value: 子.値,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      // 深さ優先で降りる = 次の兄弟を読む前に、 この子の中身を全部読む
      if (子.枠) 積み.push(子.枠);
    }
    return { ok: true, value: 先頭.値 };
  } catch (e) {
    if (e instanceof 写せない) {
      return { ok: false, error: { path: e.path, message: e.理由 } };
    }
    // getter / Proxy が投げた形。 約束どおり誤りとして返す (throw しない)
    return {
      ok: false,
      error: {
        path: 読んでいる場所,
        message: "入力を読み取れない",
        hint: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

function validateJson(json: unknown): { ok: true; data: DragonJson } | { ok: false; errors: JsonDslError[] } {
  const errors: JsonDslError[] = [];
  // root の形は写しより先に見る = 形が違う入力には従来どおり `root must be a JSON object` を
  // 返すため。 写した後に見ると、 root が配列の入力で中の getter が先に動き、 別の誤りに化ける
  // (Round 3 の指摘)。
  //
  // ただし `Array.isArray` は失効した Proxy で `TypeError` を投げる (Round 2 の指摘)。 判定
  // そのものを受けて、 投げた形は「読み取れない」 として返す。
  let rootがobjectか: boolean;
  try {
    rootがobjectか = !!json && typeof json === "object" && !Array.isArray(json);
  } catch (e) {
    return {
      ok: false,
      errors: [
        {
          path: "$",
          message: "入力を読み取れない",
          hint: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }
  if (!rootがobjectか) {
    return { ok: false, errors: [{ path: "$", message: "root must be a JSON object" }] };
  }

  // 以降は写しだけを読む。 元の object には二度と触らない (#1217)
  const 写し = 素のデータに写す(json);
  if (!写し.ok) return { ok: false, errors: [写し.error] };
  const j = 写し.value as Record<string, unknown>;

  if (typeof j.title !== "string" || j.title.length === 0) {
    errors.push({ path: "$.title", message: "title must be a non-empty string" });
  }
  // CAR-1693 Phase 1: diagram-level layout mode の validation (未指定 = auto default で backward compat)
  if (j.layout !== undefined && j.layout !== "auto" && j.layout !== "manual") {
    errors.push({ path: "$.layout", message: 'layout must be "auto" or "manual" if present' });
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
      // CAR-1657 (+ codex-review MAJOR fix) = kind の validation、 non-empty string 必須。
      // parts identifier or existing NodeKind のどちらかを想定、 空文字 or 非 string は reject。
      if (ao.kind !== undefined && (typeof ao.kind !== "string" || ao.kind.length === 0)) {
        errors.push({ path: `$.actors[${i}].kind`, message: "actor.kind must be a non-empty string" });
      }
      // codex-review MAJOR fix = state override は plain object + 値は primitive (number / string / boolean) 限定、
      // `{ v: {} }` 等 nested object や null が流入すると CdlState.initial に不正な型が入り compile 崩れる。
      if (ao.state !== undefined) {
        if (!ao.state || typeof ao.state !== "object" || Array.isArray(ao.state)) {
          errors.push({ path: `$.actors[${i}].state`, message: "actor.state must be a plain object" });
        } else {
          for (const [sk, sv] of Object.entries(ao.state as Record<string, unknown>)) {
            const svType = typeof sv;
            if (svType !== "number" && svType !== "string" && svType !== "boolean") {
              errors.push({
                path: `$.actors[${i}].state.${sk}`,
                message: `actor.state.${sk} must be number / string / boolean (got ${sv === null ? "null" : svType})`,
              });
            }
          }
        }
      }
      // CAR-1693 Phase 1: actor DSL 表面 pos の validation
      validateLayoutPos(ao.pos, `$.actors[${i}].pos`, errors);
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
      // CAR-1693 Phase 1: step DSL 表面 pos の validation
      validateLayoutPos(so.pos, `$.flow[${i}].pos`, errors);
    });
  }
  // CAR-1693 Phase 1: lane DSL 表面 pos の validation
  if (j.lanes !== undefined && j.lanes && typeof j.lanes === "object" && !Array.isArray(j.lanes)) {
    for (const [laneId, lane] of Object.entries(j.lanes as Record<string, unknown>)) {
      if (lane && typeof lane === "object" && !Array.isArray(lane)) {
        validateLayoutPos((lane as Record<string, unknown>).pos, `$.lanes.${laneId}.pos`, errors);
      }
    }
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
        validatePhaseMotion(po, i, errors);
      });
    }
  }
  validateStates(j.states, errors);
  validateValues(j.values, errors);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: j as unknown as DragonJson };
}

/**
 * 段の中で値を動かす指定を見る (#1186)。
 *
 * 状態名の記法は `states:` と同じ判定を使う。 参照先はこの JSON の `states` だけでは決めない。
 * 見本や preset が持つ状態を動かす指定もあるためで、記法側と同じく compile 後の図で解決する。
 */
function validatePhaseMotion(
  po: Record<string, unknown>,
  i: number,
  errors: JsonDslError[],
): void {
  if (po.tween !== undefined) {
    if (!po.tween || typeof po.tween !== "object" || Array.isArray(po.tween)) {
      errors.push({
        path: `$.animation[${i}].tween`,
        message: "tween must be a plain object of state -> [from, to]",
      });
    } else {
      for (const [name, range] of Object.entries(po.tween as Record<string, unknown>)) {
        const path = `$.animation[${i}].tween.${name}`;
        if (!isValueName(name)) errors.push({ path, ...valueNameIssue(name) });
        if (!Array.isArray(range) || range.length !== 2) {
          errors.push({ path, message: "tween value must be [from, to]" });
          continue;
        }
        // 補間は数どうしでしか成り立たない。 文字列を通すと描画側が数として読めず
        // 段の途中が壊れる (記法側も数だけを受ける)
        for (const v of range) {
          if (typeof v !== "number" || !Number.isFinite(v)) {
            errors.push({ path, message: "tween value must be finite numbers", hint: `got ${typeof v}` });
            break;
          }
        }
      }
    }
  }

  if (po.set !== undefined) {
    if (!po.set || typeof po.set !== "object" || Array.isArray(po.set)) {
      errors.push({
        path: `$.animation[${i}].set`,
        message: "set must be a plain object of state -> value",
      });
    } else {
      for (const [name, value] of Object.entries(po.set as Record<string, unknown>)) {
        const path = `$.animation[${i}].set.${name}`;
        if (!isValueName(name)) errors.push({ path, ...valueNameIssue(name) });
        const t = typeof value;
        if (t !== "number" && t !== "string") {
          errors.push({ path, message: "set value must be a number or string", hint: `got ${t}` });
        } else if (t === "number" && !Number.isFinite(value as number)) {
          errors.push({ path, message: "set value must be a finite number" });
        }
      }
    }
  }
}

/**
 * 状態の初期値を見る (#1181)。
 *
 * 名前の判定は記法と同じものを使う (`value-syntax.ts`)。 別々に持つと、YAML では弾かれる
 * 名前が JSON では通る形ができ、描画側が `{名前}` を置き換えられない図が生まれる。
 */
function validateStates(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({ path: "$.states", message: "states must be a plain object of name -> initial value" });
    return;
  }
  for (const [name, initial] of Object.entries(v as Record<string, unknown>)) {
    if (!isValueName(name)) {
      errors.push({ path: `$.states.${name}`, ...valueNameIssue(name) });
    }
    const t = typeof initial;
    if (t !== "number" && t !== "string") {
      errors.push({
        path: `$.states.${name}`,
        message: "state initial must be a number or string",
        hint: `got ${t}`,
      });
    } else if (t === "number" && !Number.isFinite(initial as number)) {
      // `NaN` / `Infinity` は JSON には書けないが、object を直接渡す経路では届く。
      // 描画側は文字列に直して式に流すため、そのまま通すと計算が全て壊れる
      errors.push({ path: `$.states.${name}`, message: "state initial must be a finite number" });
    }
  }
}

/**
 * 他の値から決まる値を見る (#1181)。
 *
 * 名前と式の判定は記法と同じものを使う。 式が文法として正しいかまでは見ない (描画側が
 * 評価する時に判定して、その値だけを止める = spec § 4.2)。
 */
function validateValues(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({ path: "$.values", message: "values must be a plain object of name -> expression" });
    return;
  }
  for (const [name, expression] of Object.entries(v as Record<string, unknown>)) {
    if (!isValueName(name)) {
      errors.push({ path: `$.values.${name}`, ...valueNameIssue(name) });
    }
    if (typeof expression !== "string" || expression.trim() === "") {
      errors.push({
        path: `$.values.${name}`,
        message: "value expression must be a non-empty string",
        hint: '`"{inflow} - {done}"` の形で書く',
      });
      continue;
    }
    for (const issue of checkValueExpression(expression, name)) {
      errors.push({ path: `$.values.${name}`, ...issue });
    }
  }
}

/**
 * JSON DSL → DslDocument (AST) 変換。 pos は JSON なので line 情報なし、 全て line 0。
 *
 * CAR-1693 Phase 1: DSL 表面 `pos: {x, y}` → 内部 AST `layoutPos:` の 2 層 mapping の実装 core。
 * test で mapping logic を実 execute するため export する (pos-field.test.ts の regression guard)。
 */
export function jsonToDoc(json: DragonJson): DslDocument {
  const p0 = { line: 0 };
  const actors: DslActor[] = json.actors.map((a) => {
    if (typeof a === "string") {
      return { name: a, kind: "actor" as NodeKind, kindWritten: false, pos: p0 };
    }
    // CAR-1657 = kind が既存 NodeKind に無い値なら parts identifier 候補、 partId に格納
    const kindStr = (a.kind ?? "actor") as string;
    const isPart = kindStr !== "actor" && !VALID_KIND_SET.has(kindStr);
    return {
      name: a.name,
      kind: isPart ? "actor" as NodeKind : (a.kind ?? "actor") as NodeKind,
      // parts 候補は `kind` を `actor` に倒して `partId` へ退避するため、 名札に載せる種類としては
      // 「書かなかった」 と同じ扱いにする (#1058)
      kindWritten: a.kind !== undefined && !isPart,
      subtitle: a.subtitle,
      eyebrow: a.eyebrow,
      value: a.value,
      rows: a.rows,
      lane: a.lane,
      stack: a.stack,
      initial: a.initial,
      final: a.final,
      partId: isPart ? kindStr : undefined,
      stateOverride: isPart ? a.state : undefined,
      // CAR-1693 Phase 1: DSL 表面 pos → 内部 AST layoutPos の 2 層 mapping (naming collision 回避)
      layoutPos: a.pos,
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
    // CAR-1693 Phase 1: DSL 表面 pos → 内部 AST layoutPos
    layoutPos: s.pos,
    pos: p0,
  }));
  // 状態は段が無くても図に載る (#1162 で組み立ての出口が載せる)。 **段の有無で分けない** =
  // 分けると `states` だけを書いた JSON で値が 1 つも届かない (記法側で起きていた形、 #1181)
  const states: DslState[] = Object.entries(json.states ?? {}).map(([name, initial]) => ({
    name,
    initial,
    pos: p0,
  }));
  const phases: DslPhase[] = (json.animation ?? []).map((p) => ({
    name: p.step,
    durationMs: Math.round((p.duration ?? 1.4) * 1000),
    highlight: p.focus,
    body: p.body,
    badge: p.badge,
    // 段の中で動かす分 (#1186)。 記法側の `tweens` / `sets` と同じ形に写す。
    // 空の配列を置かないのは、記法側が「無ければ field ごと持たない」 形だから
    ...(p.tween && Object.keys(p.tween).length > 0
      ? {
          tweens: Object.entries(p.tween).map(([state, [from, to]]) => ({ state, from, to, pos: p0 })),
        }
      : {}),
    ...(p.set && Object.keys(p.set).length > 0
      ? { sets: Object.entries(p.set).map(([state, value]) => ({ state, value, pos: p0 })) }
      : {}),
    pos: p0,
  }));
  const animate: DslAnimate | undefined =
    states.length > 0 || phases.length > 0 ? { states, phases, pos: p0 } : undefined;
  return {
    title: json.title,
    type: json.type,
    actors,
    flow,
    animate,
    // 他の値から決まる値 (#1181)。 書いた順に並べる = 解く順は参照から決まるので順序に
    // 意味は無いが、知らせの並びが書いた順になる
    values: json.values
      ? Object.entries(json.values).map(([name, expression]) => ({ name, expression, pos: p0 }))
      : undefined,
    viewport: json.viewport ? { ...json.viewport, pos: p0 } : undefined,
    lanes: json.lanes
      ? Object.fromEntries(
          Object.entries(json.lanes).map(([id, l]) => {
            // CAR-1693 Phase 1: DSL 表面 pos → 内部 AST layoutPos の 2 層 mapping。
            // JSON input の { pos, x, width, ... } を分離し、 pos のみ layoutPos に rename する。
            const { pos: layoutPos, ...laneRest } = l;
            return [id, { id, ...laneRest, layoutPos, pos: p0 }];
          }),
        )
      : undefined,
    groups: json.groups
      ? Object.fromEntries(
          Object.entries(json.groups).map(([id, g]) => [id, { id, label: g.label, lanes: g.lanes, pos: p0 }]),
        )
      : undefined,
    // CAR-1693 Phase 1: diagram-level layout mode (auto|manual)、 未指定は undefined = auto default
    layout: json.layout,
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
export function jsonToDiagram(
  json: unknown,
  // **`onNotice` も通す**。 記法経路だけに通知を付けていたため、 同じ型を受ける JSON / YAML
  // 経路では読めない値や捨てた矢印が利用者へ届かなかった (review 指摘)。 エディタの YAML タブは
  // ここを通る
  opts?: { partsCatalog?: Record<string, CdlDiagram>; onNotice?: CompileToCdlOpts["onNotice"] },
): CdlDiagram {
  const v = validateJson(json);
  if (!v.ok) {
    const msg = v.errors.map((e) => `  ${e.path}: ${e.message}${e.hint ? ` (${e.hint})` : ""}`).join("\n");
    throw new Error(`Dragon JSON DSL validation error:\n${msg}`);
  }
  const doc = jsonToDoc(v.data);
  return compileToCdl(doc, opts);
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
