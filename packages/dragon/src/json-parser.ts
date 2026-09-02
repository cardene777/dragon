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

import {
  DRAW_WORDS,
  EDGE_SIDE_VALUES,
  EDGE_HEAD_VALUES,
  NODE_KIND_VALID,
  PRESET_TYPES,
  STYLE_VALID,
  resolveNodeKind,
  resolveTone,
  splitColorValue,
  書ける色名,
  図形の表,
  部品の表,
  部品の組の表,
  つまみの表,
  EVENT_KINDS,
  type 図形の定義,
} from "./v05/parser";
import type { CompileToCdlOpts } from "./compile";
import type {
  CdlDiagram,
  NodeKind,
  Tone,
  EdgeStyle,
  EdgeHead,
  EdgeHeadFill,
  EdgeReveal,
  ClassRelationType,
  SequenceMessageKind,
} from "@cardenelabs/cdl";
import { extractIdentifiers, parseFormula } from "@cardenelabs/cdl";
import type {
  DslDocument,
  DslActor,
  DslStep,
  DslAnimate,
  DslPhase,
  DslState,
  PresetType,
  LayoutPos,
  DslReadout,
  DslInput,
  DslFormula,
  DslEventBinding,
  DslScrollTrigger,
  DslDynShape,
} from "./types";
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
  /**
   * 図表の箱の上に出す小見出し (optional)。 記法の最上位 `eyebrow:` と同じ (#1247)。
   *
   * 効くのは図全体を 1 箱にする図種 (`pie` / `bar` / `line` / `funnel` / `tree` / `journey` /
   * `quadrant` / `mind` / `gantt`) だけ。 箱ごとに分かれる図種では相手が決まらないため、
   * 組み立て側が知らせを出す。 そちらは `actors[].eyebrow` に書く。
   */
  eyebrow?: string;
  /**
   * 2 軸で仕分ける図 (`type: quadrant`) の軸の名前 (#1294)。 記法の `axes:` と同じ。
   *
   * 書かないと「小さい / 大きい」 のままになり、何を判断する図か読めない。 区画の名前
   * (`右上` 等) は軸の名前から決まる。
   *
   * 他の図種には軸が無いため、書かれていたら組み立て側が知らせる。
   */
  axes?: JsonAxes;
  /** 登場人物 (必須): 文字列 or { name, kind, ... } object */
  actors: (string | JsonActor)[];
  /** flow step 配列 (必須): { from, to, label, ... } */
  flow: JsonStep[];
  /**
   * 値を見せる部品 (optional、 #1374)。 記法の最上位 `readouts:` と同じ。
   *
   * 箱ではないので縦列に載らない。 図全体に 1 つの並びとして持つ。
   */
  readouts?: DslReadout[];
  /**
   * 読む人が動かすつまみ (optional、 #1389)。 記法の最上位 `inputs:` と同じ。
   *
   * 部品と同じく箱ではないので縦列に載らない。 図全体に 1 つの並びとして持つ。
   */
  inputs?: DslInput[];
  /**
   * つまみの値から決まる値 (optional、 #1391)。 記法の最上位 `formulas:` と同じ。
   *
   * 形は `{ 名前: "式" }`。 `values:` と経路が別で、式は名前を中括弧で囲わない。
   */
  formulas?: Record<string, string>;
  /**
   * 押下などの出来事で動く仕掛け (optional、 #1393)。 記法の最上位 `events:` と同じ。
   *
   * 相手は名前で指す (`box` / `lane` / `arrow` / `diagram` のどれか 1 つ)。
   */
  events?: {
    on: string;
    handler: string;
    box?: string;
    lane?: string;
    arrow?: string;
    diagram?: boolean;
  }[];
  /** 巻き上げに応じて進む値 (optional、 #1393)。 記法の最上位 `scrolls:` と同じ */
  scrolls?: Record<string, { start?: number; end?: number; scrub?: number; label?: string }>;
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
  lanes?: Record<
    string,
    {
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
    }
  >;
  /** groups (optional): topology preset で使う group 宣言 */
  groups?: Record<
    string,
    {
      label?: string;
      lanes: string[];
    }
  >;
  /** 順序図で面が動いている間の帯 (#1466)。 記法の最上位 `bands:` と同じ */
  bands?: { actor: string; from: number; to: number }[];
  /** 矢印をいつ出すか (#1470)。 記法の最上位 `reveal:` と同じ */
  reveal?: EdgeReveal;
  /** 図の並ぶ向き (#1494)。 記法の最上位 `direction:` と同じ。 JSON は英語の語で書く */
  direction?: "vertical" | "horizontal";
}

export interface JsonActor {
  name: string;
  /**
   * 箱の中に描く図形 (optional、 #1374)。 記法の `shape:` と同じ。
   *
   * 水位や角度を状態で動かす。 形は描画側の型が縛る。
   */
  shape?: DslDynShape;
  /**
   * その箱を出すかどうかの条件 (optional、 #1381)。 記法の `visibleIf:` と同じ。
   */
  visibleIf?: string;
  /**
   * 箱に出す題 (optional、 #1381)。 記法の `title:` と同じ。
   */
  title?: string;
  /**
   * 値に追随する 5 欄 (optional、 #1392)。 記法の `wBind:` / `hBind:` / `opacity:` /
   * `renderOffsetX:` / `renderOffsetY:` と同じ。
   *
   * 大きさは文字列だけ (数を書いても追随のしようが無い)、濃さとずらしは数も受ける。
   */
  wBind?: string;
  hBind?: string;
  opacity?: number | string;
  renderOffsetX?: number | string;
  renderOffsetY?: number | string;
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
  /**
   * 前の時点の値 (#1450)。 記法の `{ value: "320", previous: "280" }` と同じ。
   *
   * 内訳の変化を帯で示す図 (`type: stacked`) が 2 本目の帯として描き、
   * 値 1 つを大きく示す図 (`type: stat`) が差として出す。 書かない図は 1 本のまま。
   */
  previous?: string;
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
   *
   * 見本でない箱に書くと誤りとして返す (#1294)。 記法側は読めない項目名として行番号付きで
   * 知らせるため、黙って捨てると入口によって扱いが変わる。
   */
  state?: Record<string, number | string | boolean>;
  /**
   * 箱の色 (#1294)。 記法の `tone:` と同じ。
   *
   * 色の名前と別名 (`成功` / `success` 等) を受ける。 見本 (parts) では色ではなく状態の
   * 上書きとして意味を持つため、記法と同じく見本の箱には効かない。
   */
  tone?: Tone | (string & {});
  /**
   * 色番号または色の名前 (#1294)。 記法の `色:` / `color:` と同じ。
   *
   * `#` で始まる値は色番号として `colorHex` に入り、見本の絵の色を変える。 それ以外は
   * 色の名前として読む (記法の `splitColorValue` と同じ振り分け)。
   */
  color?: string;
  /**
   * 工程の並び (`type: gantt`) で、その工程の担当 (#1294)。 記法の `owner:` と同じ。
   */
  owner?: string;
  /**
   * 工程の並び (`type: gantt`) で、その工程が終わる時期 (#1294)。 記法の `end:` と同じ。
   *
   * 値は他の工程が書いた時期のどれかに一致させる。 一致しない値は始まりと同じ位置に落ちる
   * (記法側と同じ扱い)。
   */
  end?: string;
  /**
   * 体験の道筋 (`type: journey`) で、その段階が起きる場所 (#1294)。 記法の `touchpoint:` と同じ。
   */
  touchpoint?: string;
  /**
   * 体験の道筋 (`type: journey`) で、その段階の改善の余地 (#1294)。 記法の `opportunity:` と同じ。
   */
  opportunity?: string;
  /**
   * 箱を置く絶対座標と大きさ (#1294)。 記法の `posX:` / `posY:` / `posW:` / `posH:` と同じ。
   *
   * `pos` (ずらし幅) とは別物。 こちらは auto layout を使わずに位置そのものを決める。
   */
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
  /**
   * 箱の中の要素ごとに位置と大きさを固定する (#1294)。 記法の `nodes:` と同じ。
   *
   * key は箱が作る要素の名前 (`header` / `footer` / `spacer` / `s0` 等)。
   */
  nodes?: Record<string, JsonActorNodeOverride>;
  /**
   * 見本を何倍で描くか (#1294)。 記法の `scale:` / `倍率:` と同じ。
   *
   * 見本 (parts) にしか効かない。 見本でない箱に書くと誤りとして返す (記法側も同じく
   * 読めない項目名として知らせる)。
   */
  scale?: number;
  /** 行頭の印 (#1466)。 行と対で読む。 語の意味は図の種類が決める */
  marks?: string[];
}

/** 2 軸で仕分ける図の軸の名前 (#1294)。 記法の `axes:` と同じ形 */
export interface JsonAxes {
  x?: { left?: string; right?: string };
  y?: { bottom?: string; top?: string };
}

/** 箱の中の要素 1 つ分の位置と大きさ (#1294)。 記法の `nodes: { header: { ... } }` と同じ */
export interface JsonActorNodeOverride {
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
}

export interface JsonStep {
  from: string;
  to: string;
  label: string;
  sub?: string;
  /** 矢印がどの辺から出るか (#1385)。 記法の `side:` と同じ */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * 矢印の先の形 (#1462)。 記法の `{ head: triangle }` と同じ。
   *
   * 三角 (継ぐ) / 菱 (持つ) / 開いた矢 (使う) / 鳥の足 (多)。
   * 書かなければ従来どおり塗った三角になる。
   */
  head?: EdgeHead;
  /** 出どころ側の端の形と、両端の塗り (#1466)。 記法の `{ tailHead: diamond }` 等と同じ */
  tailHead?: EdgeHead;
  headFill?: EdgeHeadFill;
  tailHeadFill?: EdgeHeadFill;
  /**
   * 辺の役目 (cdl#618)。 記法の `{ role: main }` と同じ。
   *
   * `main` を書いた辺だけ「いま」 の色で引く。 主となる 1 本 (または 1 続き) にだけ書く。
   */
  role?: "main";
  /** 名前の下地を敷くか (cdl#618)。 記法の `{ labelPlate: false }` と同じ。 既定は敷く */
  labelPlate?: boolean;
  /** クラス図の関係の語 (#1466)。 書くと端の形 / 塗り / 線種がまとめて決まる */
  relation?: ClassRelationType;
  /** 順序図の言づての種類 (#1466)。 `call` / `return` / `fire` */
  kind?: SequenceMessageKind;
  /**
   * 矢印の色 (#1304)。 記法の `(成功)` と同じく別名 (`成功` / `neutral` 等) も受ける。
   *
   * `string & {}` は箱の `tone` と同じ idiom = 正規の色名を補完に出しつつ別名も通す。
   */
  tone?: Tone | (string & {});
  style?: EdgeStyle;
  guard?: string;
  cardinality?: string;
  /**
   * 矢印を値に追随させる 3 欄 (optional、 #1396)。 記法の `widthBind:` / `strokeBind:` /
   * `dashOffsetBind:` と同じ。 描画側は文字列だけを取る。
   */
  widthBind?: string;
  strokeBind?: string;
  dashOffsetBind?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  /** true で説明文を矢印の線の上に重ねる。 分岐図の条件ラベル用。 */
  overlay?: boolean;
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
   * その段で起点から描くもの (#1312 / #1314 / #1318)。 記法の `draw:` と同じ。
   *
   * 受ける 8 語は `DRAW_WORDS` が持つ。 語と同じ図種で、その段の間に図が起点から現れる。
   */
  draw?: string;
  /**
   * 描き終えるまでに段の何割を使うか (#1441)。 記法の `draw: line 0.4` の後半と同じ。
   *
   * 0 より大きく 1 以下。 書かなければ段の終わりに描き終わる。 `draw` が無い段に書いても
   * 何も起きない (描く相手が決まらないため、写す時に外す)。
   */
  drawRatio?: number;
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
 * 受け付ける種類 (`kind`)。 **記法側と同じ集合を使う** (`v05/parser.ts` の `NODE_KIND_VALID`)。
 *
 * ここに無い値は見本 (parts) の名前とみなし、`partId` へ退避して箱を `actor` に倒す
 * (CAR-1657 の unified syntax)。 つまりこの集合が小さいほど、**書いた種類が黙って消える**。
 *
 * 以前はここに一覧を写していたため、記法に種類が増えても JSON 経路が古い一覧のまま
 * 見本の名前として扱った (実測 = 記法が知る 108 種のうち 77 種が該当、`shape-*` は全滅)。
 * 見本帳に無い名前は `console.warn` にしか残らず `onNotice` を呼ばないため、
 * 画面には何も出ないまま `actor` の箱が描かれていた (#1293)。
 *
 * 型が 2 箇所に散らばると、必ずどちらかが古くなる。 `VALID_PRESETS` (図種) と同じ扱いにする。
 */
const VALID_KIND_SET: ReadonlySet<string> = NODE_KIND_VALID;

/**
 * 受け付ける図種。 **記法側と同じ集合を使う** (`v05/parser.ts` の `PRESET_TYPES`)。
 *
 * 以前はここに一覧を写していたため、 記法に型を足しても JSON 経路が古い一覧のまま弾いた
 * (`bar` / `line` で実際に起きた)。 型が 3 箇所に散らばると、 必ずどれかが古くなる。
 */
const VALID_PRESETS: readonly PresetType[] = [...PRESET_TYPES];

/**
 * 受け付ける項目の一覧 (#1295)。 **知らない項目を誤りにする判定と、公開 schema との
 * 突き合わせが、どちらもここを見る**。
 *
 * 一覧を型 / 検査 / schema の 3 箇所に手で置くと必ずどれかが古くなる。 型は TypeScript が
 * 見る宣言で実行時には残らないため、実行時の判定と schema はこの表を出どころにする。
 *
 * 公開している JSON Schema は元から全階層で `additionalProperties: false` を宣言していた。
 * 知らない項目を弾くのは新しい方針ではなく、parser が自分の契約に追いついていなかった。
 *
 * `states` / `values` / `tween` / `set` / `lanes` / `groups` の **鍵は利用者が決める**
 * (状態の名前 / 縦列の id)。 表が縛るのはその中の値の形で、鍵そのものではない。
 */
export const ACCEPTED_KEYS = {
  root: [
    "title",
    "type",
    "eyebrow",
    "axes",
    "actors",
    "flow",
    "states",
    "values",
    "animation",
    "viewport",
    "lanes",
    "groups",
    // 値を見せる部品 (#1374)
    "readouts",
    // 読む人が動かすつまみ (#1389)
    "inputs",
    // つまみの値から決まる値 (#1391)
    "formulas",
    // 押下などの出来事で動く仕掛けと、巻き上げに応じて進む値 (#1393)
    "events",
    "scrolls",
    // 順序図で面が動いている間の帯 (#1466)
    "bands",
    // 矢印をいつ出すか (#1470)
    "reveal",
    // 図の並ぶ向き (#1494)
    "direction",
  ],
  actor: [
    "name",
    "kind",
    "subtitle",
    "eyebrow",
    "value",
    // 前の時点の値 (#1450)。 内訳の変化を帯で示す図と、値 1 つを大きく示す図が読む
    "previous",
    "rows",
    "lane",
    "stack",
    "initial",
    "final",
    "tone",
    "color",
    "owner",
    "end",
    "touchpoint",
    "opportunity",
    "posX",
    "posY",
    "posW",
    "posH",
    "nodes",
    "scale",
    "state",
    "pos",
    // 箱の中に描く図形 (#1374)
    "shape",
    // その箱を出すかどうかの条件 (#1381)
    "visibleIf",
    // 箱に出す題 (#1381)
    "title",
    // 値に追随する 5 欄 (#1392)
    "wBind",
    "hBind",
    "opacity",
    "renderOffsetX",
    "renderOffsetY",
    // 行頭の印 (#1466)。 行ごとに 1 つ、図の種類ごとの語で書く
    "marks",
  ],
  step: [
    "from",
    "to",
    "label",
    "sub",
    // 矢印がどの辺から出るか (#1385)
    "side",
    // 矢印の先の形 (#1462)
    "head",
    // 端の印の残り 3 欄と、関係の語 / 言づての種類 (#1466)
    "tailHead",
    "headFill",
    "tailHeadFill",
    "relation",
    // 辺の役目と名前の下地 (cdl#618)
    "role",
    "labelPlate",
    "kind",
    "tone",
    "style",
    "guard",
    "cardinality",
    // 値に追随する 3 欄 (#1396)
    "widthBind",
    "strokeBind",
    "dashOffsetBind",
    "labelOffsetX",
    "labelOffsetY",
    "overlay",
    "pos",
  ],
  phase: ["step", "duration", "focus", "body", "badge", "tween", "set", "draw", "drawRatio"],
  viewport: ["width", "height", "scale", "laneWidth", "gap", "laneGap", "nodeGap", "labelMargin"],
  lane: ["x", "width", "label", "contain", "lifeline", "pos"],
  group: ["label", "lanes"],
  actorNode: ["posX", "posY", "posW", "posH"],
  axes: ["x", "y"],
  axesX: ["left", "right"],
  axesY: ["bottom", "top"],
  layoutPos: ["x", "y"],
} as const satisfies Record<string, readonly string[]>;

/** 受ける項目を持つ階層の名前 */
export type 階層 = keyof typeof ACCEPTED_KEYS;

/**
 * 欄ごとの値の型 (#1304)。 **`ACCEPTED_KEYS` と同じ欄を必ず持つ**。
 *
 * 項目名の側は `#1295` で閉じたが、値の側は一部の欄にしか検査が無かった。 実測すると
 * 20 欄が型違いの値をそのまま通し、`type: sequence` では 17 欄の値が図まで届いていた
 * (`labelOffsetX: "q"` が矢印の中に `"q"` のまま入る、`tone: "bogus"` がそのまま色として載る)。
 *
 * 表を `ACCEPTED_KEYS` の隣に置き、下の `satisfies` で **欄が 1 つでも欠けたら型検査が落ちる**
 * ようにする。 欄を足した時に「名前は受けるが値は見ない」 状態が作れない。
 *
 * ## 誰がどの欄を見るか
 *
 * | 型 | 見る場所 |
 * |---|---|
 * | 値そのものの型 (文字列 / 数 / 真偽 / 色 / 線種 等) | 本 file の `表で検査` |
 * | `object` / `並び` | 欄ごとの専用の検査 (`validateViewport` 等) |
 *
 * 分けるのは、中身の形が欄ごとに違うから。 外側の形だけを表で見ても中身は見られないので、
 * 専用の検査に任せて二重に誤りを出さない。 **専用の検査が抜けても表からは分からない** ため、
 * 検査 (`test/json-value-types.test.ts`) が全欄に型違いの値を入れて誤りが返ることを確かめる。
 */
export type 欄の型 =
  | "必須の非空文字列"
  | "必須の文字列"
  | "非空の文字列"
  | "文字列"
  | "文字列の並び"
  | "数"
  | "必須の数"
  // 値に追随する欄 (#1392)。 数を直に書く形と、状態の名前を書く形の両方を受ける
  | "数か文字列"
  | "真偽"
  | "色"
  | "線種"
  | "辺"
  | "端の形"
  | "色か色番号"
  | "描くもの"
  | "必須の図種"
  | "object"
  | "並び"
  | "必須の並び"
  | "必須の非空の並び";

export const 欄の型表 = {
  root: {
    title: "必須の非空文字列",
    type: "必須の図種",
    eyebrow: "文字列",
    axes: "object",
    actors: "必須の非空の並び",
    flow: "必須の並び",
    states: "object",
    values: "object",
    animation: "並び",
    viewport: "object",
    lanes: "object",
    groups: "object",
    // 値を見せる部品 (#1374)。 中身は下の検査が種類ごとに見る
    readouts: "並び",
    // 読む人が動かすつまみ (#1389)。 部品と同じく中身は下の検査が種類ごとに見る
    inputs: "並び",
    // つまみの値から決まる値 (#1391)。 中身は下の検査が式ごとに見る
    formulas: "object",
    // 押下と巻き上げ (#1393)。 中身は下の検査が 1 件ずつ見る
    events: "並び",
    scrolls: "object",
    // 順序図で面が動いている間の帯 (#1466)
    bands: "並び",
    // 矢印をいつ出すか (#1470)
    reveal: "非空の文字列",
    // 図の並ぶ向き (#1494)
    direction: "非空の文字列",
  },
  actor: {
    name: "必須の非空文字列",
    kind: "非空の文字列",
    subtitle: "文字列",
    eyebrow: "文字列",
    value: "文字列",
    previous: "文字列",
    rows: "文字列の並び",
    lane: "文字列",
    stack: "数",
    initial: "真偽",
    final: "真偽",
    tone: "色",
    color: "色か色番号",
    owner: "文字列",
    end: "文字列",
    touchpoint: "文字列",
    opportunity: "文字列",
    posX: "数",
    posY: "数",
    posW: "数",
    posH: "数",
    nodes: "object",
    scale: "数",
    state: "object",
    pos: "object",
    // 箱の中に描く図形 (#1374)。 中身は下の検査が種類ごとに見る
    shape: "object",
    // その箱を出すかどうかの条件 (#1381)
    visibleIf: "文字列",
    // 箱に出す題 (#1381)
    title: "文字列",
    // 値に追随する 5 欄 (#1392)。 大きさは文字列だけ、濃さとずらしは数も受ける
    wBind: "非空の文字列",
    hBind: "非空の文字列",
    opacity: "数か文字列",
    renderOffsetX: "数か文字列",
    renderOffsetY: "数か文字列",
    // 行頭の印 (#1466)
    marks: "文字列の並び",
  },
  step: {
    from: "必須の文字列",
    to: "必須の文字列",
    label: "必須の文字列",
    sub: "文字列",
    // 矢印がどの辺から出るか (#1385)
    side: "辺",
    head: "端の形",
    // 端の印の残り 3 欄と、関係の語 / 言づての種類 (#1466)
    tailHead: "端の形",
    headFill: "非空の文字列",
    tailHeadFill: "非空の文字列",
    relation: "非空の文字列",
    // 辺の役目と名前の下地 (cdl#618)
    role: "非空の文字列",
    labelPlate: "真偽",
    kind: "非空の文字列",
    tone: "色",
    style: "線種",
    guard: "文字列",
    cardinality: "文字列",
    // 値に追随する 3 欄 (#1396)。 描画側は文字列だけを取る
    widthBind: "非空の文字列",
    strokeBind: "非空の文字列",
    dashOffsetBind: "非空の文字列",
    labelOffsetX: "数",
    labelOffsetY: "数",
    overlay: "真偽",
    pos: "object",
  },
  phase: {
    step: "必須の非空文字列",
    duration: "数",
    focus: "文字列の並び",
    body: "文字列",
    badge: "文字列",
    tween: "object",
    set: "object",
    draw: "描くもの",
    drawRatio: "数",
  },
  viewport: {
    width: "数",
    height: "数",
    scale: "数",
    laneWidth: "数",
    gap: "数",
    laneGap: "数",
    nodeGap: "数",
    labelMargin: "数",
  },
  lane: {
    x: "数",
    width: "数",
    label: "文字列",
    contain: "真偽",
    lifeline: "真偽",
    pos: "object",
  },
  group: { label: "文字列", lanes: "文字列の並び" },
  actorNode: { posX: "数", posY: "数", posW: "数", posH: "数" },
  axes: { x: "object", y: "object" },
  axesX: { left: "文字列", right: "文字列" },
  axesY: { bottom: "文字列", top: "文字列" },
  // 位置は書けば x と y の両方が要る。 片方だけでは寄せ幅が決まらない
  layoutPos: { x: "必須の数", y: "必須の数" },
} as const satisfies {
  [層 in 階層]: { [欄 in (typeof ACCEPTED_KEYS)[層][number]]: 欄の型 };
};

/**
 * 色番号の形 (#1304)。 公開 schema の `pattern` と同じ形を実装側でも 1 箇所に持つ。
 *
 * 受けるのは 3 / 4 / 6 / 8 桁 (`#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa`)。 5 桁や 7 桁は
 * CSS の色として成立しないため通さない。
 */
const 色番号の形 = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * JSON で色名として受ける値か (#1304、 review Round 2 の指摘)。
 *
 * **記法の `resolveTone` は通さない**。 あちらは前後の空白と引用符を落として小文字に寄せるが、
 * それは記法の本文から語を切り出すために要る処理で、JSON には要らない。 JSON の値は既に
 * 切り出された文字列なので、`" success "` や `"\"success\""` は書き手の意図ではなく
 * 記法の癖が漏れた形になる。
 *
 * 公開 schema は色名を `enum` で宣言する。 `enum` は完全一致なので、**parser 側も完全一致に
 * 揃える**。 揃えないと「schema が拒む値を parser が受ける」 ずれが残り、本 file が閉じようと
 * している宣言と実装の食い違いを別の形で作ることになる。
 *
 * 揃え方は 2 通りあった。 schema を parser に合わせて広げる案は、大文字小文字と空白と引用符を
 * `pattern` で書くことになり、**色名の一覧が `enum` と `pattern` の 2 か所に写る**。 色が増えた
 * 時に片方だけ直る形を作るため採らなかった。 同じ理由で、この判定は `tone` (箱と矢印) と
 * `color` の 3 欄すべてが共有する。
 */
function JSONの色名か(v: string): boolean {
  return 書ける色名().includes(v);
}

/**
 * 見本 (parts) にしか効かない欄 (#1294)。
 *
 * 普通の箱に書くと `jsonToDoc` が落とすため、書いても何も起きない。 #1294 で誤りにした。
 *
 * `見本に効かない欄` (#1308) と対になる。 2 つの表で「どちらの箱にしか効かないか」 を
 * 両方向から宣言する = 片方だけ増えると鏡の関係が崩れる。
 */
export const 見本にしか効かない欄 = [
  "state",
  "scale",
] as const satisfies readonly (typeof ACCEPTED_KEYS.actor)[number][];

/**
 * 普通の箱にしか効かない欄 (#1308)。
 *
 * 見本 (parts) の箱に書くと `jsonToDoc` が丸ごと落とす。 検査を通ったうえで値が消えるため、
 * 書いた人には「書いたのに図が変わらない」 としか見えない (実測 = 5 欄すべてが消えていた)。
 *
 * 記法では同じ本文が状態の上書きに入る。 特別扱いしているのではなく、見本の中括弧に書いた
 * 名前を **すべて** 状態の上書きとして読むため、結果として届いている。 JSON は欄ごとに型を
 * 宣言する形なので同じ設計を持ち込めない。
 *
 * したがって **誤りとして返す**。 #1294 が決めた向き (見本にしか効かない `state` / `scale` を
 * 普通の箱に書いたら誤り) の鏡になる。 効く書き方は `state` が既に持つため、誤りにしても
 * 利用者の手段は失われない。
 *
 * **この表は検査と組み立ての両方が見る**。 落とす欄と誤りにする欄が別々に並ぶと、片方だけ
 * 増えた時に「検査は通すが組み立てが捨てる」 状態が戻る。
 */
export const 見本に効かない欄 = [
  "tone",
  "owner",
  "end",
  "touchpoint",
  "opportunity",
  // 箱の中に描く図形 (#1374)。 見本は自分の形を持つため、外から図形を差し替えられない
  "shape",
  // その箱を出すかどうかの条件 (#1381)。 見本は自分の出方を持つ
  "visibleIf",
  // 箱に出す題 (#1381)。 見本は自分の題を持つ
  "title",
  // 値に追随する 5 欄 (#1392)。 見本は自分の大きさと出方を持つ
  "wBind",
  "hBind",
  "opacity",
  "renderOffsetX",
  "renderOffsetY",
] as const satisfies readonly (typeof ACCEPTED_KEYS.actor)[number][];

/**
 * 表に沿って 1 つの欄の値を見る (#1304)。
 *
 * `名前` は知らせの文に出す欄の呼び名 (`actor.tone` / `viewport.width`)。 `path` は直す場所を
 * 指す JSON pointer 風の文字列で、この 2 つは役割が違う (前者は「何の欄か」、後者は「どこか」)。
 */
function 値を検査(
  v: unknown,
  型: 欄の型,
  path: string,
  名前: string,
  errors: JsonDslError[],
): void {
  const 型違い = (期待: string, 補足?: string): void => {
    errors.push({
      path,
      message: `${名前} must be ${期待}`,
      hint: 補足 ?? `got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`,
    });
  };
  switch (型) {
    case "必須の非空文字列":
      if (typeof v !== "string" || v.length === 0) 型違い("a non-empty string");
      return;
    case "必須の文字列":
      if (typeof v !== "string") 型違い("a string");
      return;
    case "非空の文字列":
      if (v === undefined) return;
      if (typeof v !== "string" || v.trim().length === 0) 型違い("a non-empty string if present");
      return;
    case "文字列":
      if (v === undefined) return;
      if (typeof v !== "string") 型違い("a string if present");
      return;
    case "文字列の並び":
      if (v === undefined) return;
      if (!Array.isArray(v)) {
        型違い("an array of strings if present");
        return;
      }
      // 要素の場所まで指す。 並び全体を指すと、どれを直せばよいか読めない
      v.forEach((要素, i) => {
        if (typeof 要素 !== "string") {
          errors.push({
            path: `${path}[${i}]`,
            message: `${名前}[${i}] must be a string`,
            hint: `got ${要素 === null ? "null" : typeof 要素}`,
          });
        }
      });
      return;
    case "数":
      if (v === undefined) return;
      if (typeof v !== "number" || !Number.isFinite(v)) {
        型違い(
          "a finite number if present",
          typeof v === "number" ? `got ${String(v)}` : undefined,
        );
      }
      return;
    case "必須の数":
      if (typeof v !== "number" || !Number.isFinite(v)) {
        型違い("a finite number", typeof v === "number" ? `got ${String(v)}` : undefined);
      }
      return;
    case "数か文字列":
      if (v === undefined) return;
      // 空文字は受けない。 描画側は 0 として読むため、書き忘れが「箱が消える」 形で出る
      if (typeof v === "string") {
        if (v.trim().length === 0) 型違い("a non-empty string if present");
        return;
      }
      if (typeof v !== "number" || !Number.isFinite(v)) {
        型違い(
          "a finite number or a non-empty string if present",
          typeof v === "number" ? `got ${String(v)}` : undefined,
        );
      }
      return;
    case "真偽":
      if (v === undefined) return;
      if (typeof v !== "boolean") 型違い("true or false if present");
      return;
    case "色":
      if (v === undefined) return;
      if (typeof v !== "string") {
        型違い("a color name if present");
        return;
      }
      // 別名 (`成功` / `neutral`) も受ける。 一覧は engine から取る
      if (!JSONの色名か(v)) {
        errors.push({
          path,
          message: `${名前} must be a known color name`,
          hint: `使える値 = ${書ける色名().join(", ")} (got ${JSON.stringify(v)})`,
        });
      }
      return;
    case "線種":
      if (v === undefined) return;
      if (typeof v !== "string" || !STYLE_VALID.has(v)) {
        errors.push({
          path,
          message: `${名前} must be one of: ${[...STYLE_VALID].join(", ")}`,
          hint: typeof v === "string" ? `got "${v}"` : `got ${typeof v}`,
        });
      }
      return;
    case "辺":
      if (v === undefined) return;
      if (typeof v !== "string" || !(EDGE_SIDE_VALUES as readonly string[]).includes(v)) {
        errors.push({
          path,
          message: `${名前} must be one of: ${EDGE_SIDE_VALUES.join(", ")}`,
          hint: typeof v === "string" ? `got "${v}"` : `got ${typeof v}`,
        });
      }
      return;
    case "端の形":
      if (v === undefined) return;
      // 受ける語は記法と同じ一覧を見る (`EDGE_HEAD_VALUES`)。 写すと描画側が形を増やした時に
      // 片方だけ古くなる
      if (typeof v !== "string" || !EDGE_HEAD_VALUES.includes(v)) {
        errors.push({
          path,
          message: `${名前} must be one of: ${EDGE_HEAD_VALUES.join(", ")}`,
          hint: typeof v === "string" ? `got "${v}"` : `got ${typeof v}`,
        });
      }
      return;
    case "描くもの":
      if (v === undefined) return;
      // 受ける語は記法と同じ一覧を見る (`DRAW_WORDS`)。 写すと語が増えた時に片方だけ古くなる
      if (typeof v !== "string" || !DRAW_WORDS.has(v)) {
        errors.push({
          path,
          message: `${名前} must be one of: ${[...DRAW_WORDS].join(", ")}`,
          hint: typeof v === "string" ? `got "${v}"` : `got ${typeof v}`,
        });
      }
      return;
    case "色か色番号":
      if (v === undefined) return;
      if (typeof v !== "string") {
        型違い("a color name or a #hex value if present");
        return;
      }
      // 振り分けは記法と同じ (`splitColorValue`)。 `#` で始まれば色番号、それ以外は色の名前
      if (v.startsWith("#")) {
        if (!色番号の形.test(v)) {
          errors.push({
            path,
            message: `${名前} must be a #hex color`,
            hint: `\`#f59e0b\` の形で書く (got ${JSON.stringify(v)})`,
          });
        }
        return;
      }
      if (!JSONの色名か(v)) {
        errors.push({
          path,
          message: `${名前} must be a known color name or a #hex value`,
          hint: `使える値 = ${書ける色名().join(", ")} / \`#f59e0b\` (got ${JSON.stringify(v)})`,
        });
      }
      return;
    case "必須の図種":
      if (typeof v !== "string" || !VALID_PRESETS.includes(v as PresetType)) {
        errors.push({
          path,
          message: `${名前} must be one of: ${VALID_PRESETS.join(", ")}`,
          hint: typeof v === "string" ? `got "${v}"` : undefined,
        });
      }
      return;
    case "object":
    case "並び":
    case "必須の並び":
    case "必須の非空の並び":
      // 中身の形が欄ごとに違うため専用の検査が見る (`validateViewport` / `validateStates` 等)。
      // ここで外側の形も見ると、同じ入力に 2 つ誤りが出てどちらを直せばよいか読めなくなる
      return;
  }
  // 型を足して `case` を書き忘れると、その型の欄が黙って素通りする。 網羅を型検査で固定する
  型 satisfies never;
}

/**
 * 1 つの階層の欄をまとめて見る (#1304)。
 *
 * `名前接頭` は知らせの文に出す呼び名の前半 (`actor` / `viewport` / `lanes.web`)。 空文字なら
 * 欄名だけを出す (最上位の `title` 等)。
 */
function 表で検査(
  o: Record<string, unknown>,
  層: 階層,
  path: string,
  名前接頭: string,
  errors: JsonDslError[],
): void {
  // 表が `ACCEPTED_KEYS` と同じ欄を持つことは `欄の型表` の `satisfies` が固定する。 欄を
  // 足して型を書き忘れると型検査が落ちるため、ここでは欠落を扱わない
  for (const [欄, 型] of Object.entries<欄の型>(欄の型表[層])) {
    値を検査(o[欄], 型, `${path}.${欄}`, 名前接頭 === "" ? 欄 : `${名前接頭}.${欄}`, errors);
  }
}

/**
 * 綴り違いの候補を返す (#1295)。
 *
 * 「知らない項目です」 だけだと、`animations` と書いた人は正しい綴りを探しに行く必要がある。
 * 1 文字の違い (足りない / 多い / 入れ替わり / 別の字) までを候補とする。
 *
 * 遠い名前は勧めない。 無関係な項目名を勧めると、書いた人がそちらへ直して二度手間になる。
 */
function 近い項目名(key: string, 候補: readonly string[]): string | undefined {
  const 小文字 = key.toLowerCase();
  let 最短: { 名: string; 距離: number } | undefined;
  for (const c of 候補) {
    const d = 編集距離(小文字, c.toLowerCase(), 2);
    if (d <= 2 && (最短 === undefined || d < 最短.距離)) 最短 = { 名: c, 距離: d };
  }
  return 最短?.名;
}

/**
 * 2 つの語の編集距離 (上限付き)。
 *
 * 上限を持つのは、長い語どうしで表を全部埋めないため。 上限を超えた時点で打ち切る。
 */
function 編集距離(a: string, b: string, 上限: number): number {
  if (Math.abs(a.length - b.length) > 上限) return 上限 + 1;
  let 前 = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const 今: number[] = [i];
    let 行の最小 = i;
    for (let j = 1; j <= b.length; j += 1) {
      const 費用 = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(今[j - 1]! + 1, 前[j]! + 1, 前[j - 1]! + 費用);
      今.push(v);
      if (v < 行の最小) 行の最小 = v;
    }
    // その行の最小が上限を超えたら、以降どう進んでも上限以下にはならない
    if (行の最小 > 上限) return 上限 + 1;
    前 = 今;
  }
  return 前[b.length]!;
}

/**
 * 知らない項目を誤りとして積む (#1295)。
 *
 * 対象は plain object だけ。 形が違う入力は呼出側が別に誤りを積むため、ここでは何もしない
 * (同じ入力に 2 つの誤りを出すと、どちらを直せばよいか読めなくなる)。
 */
function checkUnknownKeys(v: unknown, 層: 階層, path: string, errors: JsonDslError[]): void {
  if (!v || typeof v !== "object" || Array.isArray(v)) return;
  const 受ける = ACCEPTED_KEYS[層] as readonly string[];
  for (const key of Object.keys(v as Record<string, unknown>)) {
    if (受ける.includes(key)) continue;
    const 候補 = 近い項目名(key, 受ける);
    errors.push({
      path: `${path}.${key}`,
      message: `unknown key "${key}"`,
      hint: 候補 !== undefined ? `"${候補}" のことですか` : `使える項目 = ${受ける.join(", ")}`,
    });
  }
}

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
  checkUnknownKeys(p, "layoutPos", path, errors);
  表で検査(p, "layoutPos", path, "pos", errors);
}

/**
 * 見本 (parts) の名前として扱う値かどうか (#1294)。
 *
 * 判定は `jsonToDoc` と同じにする。 別々に書くと、検査が「見本でない」 と見た箱を
 * 組み立て側が見本として扱う形ができ、見本にしか効かない項目の誤り判定がずれる。
 */
function 見本の名前か(kind: unknown): boolean {
  if (typeof kind !== "string" || kind.length === 0) return false;
  return kind !== "actor" && !VALID_KIND_SET.has(kind);
}

/** 箱の中の要素ごとの位置と大きさを見る (#1294) */
function validateActorNodes(v: unknown, path: string, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path,
      message: "actor.nodes must be a plain object of name -> { posX, posY, posW, posH }",
    });
    return;
  }
  for (const [name, o] of Object.entries(v as Record<string, unknown>)) {
    const nodePath = `${path}.${name}`;
    if (!o || typeof o !== "object" || Array.isArray(o)) {
      errors.push({ path: nodePath, message: "actor.nodes entry must be a plain object" });
      continue;
    }
    const n = o as Record<string, unknown>;
    checkUnknownKeys(n, "actorNode", nodePath, errors);
    表で検査(n, "actorNode", nodePath, `nodes.${name}`, errors);
  }
}

/**
 * 図全体の大きさと間隔を見る (#1295)。
 *
 * これまで `viewport` は検査そのものが無く、中身を丸ごと写していた
 * (`{ ...json.viewport }`)。 型にも schema にも無い `scale` が素通しで効いていた一方、
 * 数でない値を書いても誰も止めなかった。
 */
function validateViewport(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({ path: "$.viewport", message: "viewport must be a plain object" });
    return;
  }
  checkUnknownKeys(v, "viewport", "$.viewport", errors);
  表で検査(v as Record<string, unknown>, "viewport", "$.viewport", "viewport", errors);
}

/**
 * 鍵を利用者が決める入れ物 (縦列 / 群) を見る (#1304)。
 *
 * `lanes` / `groups` は id を鍵に持つため、鍵そのものは縛れない。 縛れるのは
 * 「入れ物が plain object か」 と「各 id の中身の項目名と値の型」 の 2 つ。
 *
 * #1304 まで外側の形が違う入力 (`lanes: 5`) は走査ごと飛ばされ、誤りが 1 件も返らなかった。
 * 形が違うものを黙って捨てると、書いた縦列が 1 つも効かない図が知らせなしで出る。
 */
/**
 * 図形と部品の中身を、記法と **同じ表** で検査する (#1374)。
 *
 * 表を 2 つ持つと片方だけ直してずれる。 記法側 (`v05/parser.ts`) が持つ表をそのまま引く。
 *
 * 記法は値が全て文字列で届くため読み替えが要るが、JSON は型のまま届く。 ここでは
 * 「知らない種類」 「知らない欄」 「足りない必須の欄」 「欄の型違い」 の 4 つを見る。
 */
function 表で中身を検査する(
  o: Record<string, unknown>,
  表: Record<string, 図形の定義>,
  path: string,
  何: string,
  errors: JsonDslError[],
): void {
  // JSON は公開 schema の enum と同じ正規名だけを受ける。 ここだけ小文字化すると、
  // schema が拒む種類を validator が通した上、種類別の追加検査も回避できてしまう。
  const kind = typeof o.kind === "string" ? o.kind : "";
  // 通常の object を表に使うため、継承した名前を own kind として扱わない。
  const 定義 = Object.hasOwn(表, kind) ? 表[kind] : undefined;
  if (定義 === undefined) {
    errors.push({
      path: `${path}.kind`,
      // **文字列でない値をそのまま文にしない**。 object を混ぜると `[object Object]` になり、
      // 何を書いたのかが読み手に届かない
      message: `unknown ${何} kind ${typeof o.kind === "string" ? `"${o.kind}"` : JSON.stringify(o.kind ?? null)}`,
      hint: `使える種類 = ${Object.keys(表).join(", ")}`,
    });
    return;
  }
  for (const [欄, 値] of Object.entries(o)) {
    if (欄 === "kind" || 欄 === "id") continue;
    const 形 = 定義.欄[欄];
    if (形 === undefined) {
      errors.push({
        path: `${path}.${欄}`,
        message: `unknown key "${欄}"`,
        hint: `使える項目 = ${Object.keys(定義.欄).join(", ")}`,
      });
      continue;
    }
    const 型が合う =
      形 === "数"
        ? typeof 値 === "number" && Number.isFinite(値)
        : 形 === "数か文字列"
          ? (typeof 値 === "number" && Number.isFinite(値)) || typeof 値 === "string"
          : 形 === "文字列の並び"
            ? Array.isArray(値) && 値.every((x) => typeof x === "string")
            : 形 === "数の並び"
              ? Array.isArray(値) && 値.every((x) => typeof x === "number" && Number.isFinite(x))
              : 形 === "真偽"
                ? typeof 値 === "boolean"
                : 形 === "組の並び"
                  ? Array.isArray(値) &&
                    値.length > 0 &&
                    値.every(
                      (x) =>
                        typeof x === "object" &&
                        x !== null &&
                        !Array.isArray(x) &&
                        Object.keys(x as object).length > 0 &&
                        Object.values(x as object).every(
                          (y) =>
                            typeof y === "string" || (typeof y === "number" && Number.isFinite(y)),
                        ),
                    )
                  : 形 === "向き"
                    ? typeof 値 === "string" && ["up", "down", "left", "right"].includes(値)
                    : typeof 値 === "string";
    if (!型が合う) {
      errors.push({
        path: `${path}.${欄}`,
        message: `${欄} must be ${形}`,
        hint: `got ${Array.isArray(値) ? "array" : 値 === null ? "null" : typeof 値}`,
      });
    }
  }
  for (const 欄 of 定義.必須) {
    if (o[欄] === undefined) {
      errors.push({
        path: `${path}.${欄}`,
        message: `${欄} is required for ${何} kind "${kind}"`,
        hint: `必須の項目 = ${定義.必須.join(", ")}`,
      });
    }
  }
}

/**
 * 値を見せる部品の並びを検査する (#1374)。
 *
 * **外側の形もここで見る**。 `欄の型表` は「並び」 とだけ宣言し、中身の検査は専用の検査に
 * 委ねる作りなので (`checkFieldType` の `case "並び"`)、ここで見ないと `readouts: 1` が
 * 素通りする。
 */
/**
 * 順序図の帯の並びを検査する (#1466)。
 *
 * **外側の形もここで見る**。 `欄の型表` は「並び」 とだけ宣言し、中身の検査は専用の検査に
 * 委ねる作りなので、ここで見ないと `bands: 1` が素通りする。
 */
function validateBands(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!Array.isArray(v)) {
    errors.push({
      path: "$.bands",
      message: "bands must be an array of band objects",
      hint: `got ${v === null ? "null" : typeof v}`,
    });
    return;
  }
  v.forEach((b, i) => {
    const path = `$.bands[${i}]`;
    if (typeof b !== "object" || b === null || Array.isArray(b)) {
      errors.push({ path, message: "band must be an object", hint: "{ actor, from, to } の形で書く" });
      return;
    }
    const o = b as Record<string, unknown>;
    if (typeof o.actor !== "string" || o.actor === "") {
      errors.push({ path: `${path}.actor`, message: "band.actor must be a non-empty string" });
    }
    for (const k of ["from", "to"] as const) {
      if (typeof o[k] !== "number" || !Number.isInteger(o[k]) || (o[k] as number) < 0) {
        errors.push({ path: `${path}.${k}`, message: `band.${k} must be a non-negative integer` });
      }
    }
  });
}

function validateReadouts(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!Array.isArray(v)) {
    errors.push({
      path: "$.readouts",
      message: "readouts must be an array of readout objects",
      hint: `got ${v === null ? "null" : typeof v}`,
    });
    return;
  }
  v.forEach((r, i) => {
    const path = `$.readouts[${i}]`;
    if (!r || typeof r !== "object" || Array.isArray(r)) {
      errors.push({ path, message: "readout must be a plain object", hint: `got ${typeof r}` });
      return;
    }
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string" || o.id === "") {
      errors.push({ path: `${path}.id`, message: "id is required", hint: "空でない文字列で書く" });
    }
    表で中身を検査する(o, 部品の表, path, "readout", errors);

    /*
     * 組の並びを取る欄の中身を、記法と同じ表で見る (#1385)。
     *
     * **種類を手で並べない**。 元は `status-dot` と `status-timeline` を直書きしていたが、
     * 表は描画側の型定義から生成しており、種類が増えるたびに書き足す形になる。
     */
    const 組の定義 = 部品の組の表[String(o.kind)];
    for (const [欄名, 定義] of Object.entries(組の定義 ?? {})) {
      if (!Array.isArray(o[欄名])) continue;
      (o[欄名] as unknown[]).forEach((entry, j) => {
        const entryPath = `${path}.${欄名}[${j}]`;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
        const item = entry as Record<string, unknown>;
        for (const key of Object.keys(item)) {
          if (key in 定義.欄) continue;
          errors.push({
            path: `${entryPath}.${key}`,
            message: `${key} is not allowed for readout kind "${String(o.kind)}"`,
            hint: `使える項目 = ${Object.keys(定義.欄).join(", ")}`,
          });
        }
        for (const key of 定義.必須) {
          if (item[key] !== undefined) continue;
          errors.push({
            path: `${entryPath}.${key}`,
            message: `${key} is required for readout kind "${String(o.kind)}"`,
          });
        }
        for (const [key, 形] of Object.entries(定義.欄)) {
          const 値 = item[key];
          if (値 === undefined) continue;
          const 合う =
            形 === "数" ? typeof 値 === "number" && Number.isFinite(値) : typeof 値 === "string";
          if (合う) continue;
          errors.push({
            path: `${entryPath}.${key}`,
            message: `${key} must be ${形}`,
            hint: `got ${Array.isArray(値) ? "array" : 値 === null ? "null" : typeof 値}`,
          });
        }
      });
    }
  });
}

/**
 * 読む人が動かすつまみの並びを検査する (#1389)。
 *
 * **外側の形もここで見る**。 `欄の型表` は「並び」 とだけ宣言し、中身の検査は専用の検査に
 * 委ねる作りなので (`checkFieldType` の `case "並び"`)、ここで見ないと `inputs: 1` が
 * 素通りする。
 *
 * 種類ごとの欄は記法と同じ表 (`つまみの表`) で見る。 表は描画側の型定義から生成しており、
 * 種類が増えても書き足す場所が増えない。
 */
function validateInputs(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!Array.isArray(v)) {
    errors.push({
      path: "$.inputs",
      message: "inputs must be an array of input objects",
      hint: `got ${v === null ? "null" : typeof v}`,
    });
    return;
  }
  v.forEach((r, i) => {
    const path = `$.inputs[${i}]`;
    if (!r || typeof r !== "object" || Array.isArray(r)) {
      errors.push({ path, message: "input must be a plain object", hint: `got ${typeof r}` });
      return;
    }
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string" || o.id === "") {
      errors.push({ path: `${path}.id`, message: "id is required", hint: "空でない文字列で書く" });
    }
    表で中身を検査する(o, つまみの表, path, "input", errors);
  });
}

/**
 * つまみの値から決まる値を検査する (#1391)。
 *
 * **外側の形もここで見る**。 `欄の型表` は「object」 とだけ宣言するため、
 * ここで見ないと `formulas: { a: 1 }` が素通りする。
 *
 * 式そのものは描画側の parser に通す = 自前で書き方を決めると、通ったのに描画側が
 * 解けない式を受けてしまう。
 */
function validateFormulas(v: unknown, inputs: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path: "$.formulas",
      message: "formulas must be an object of name to expression",
      hint: `got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`,
    });
    return;
  }
  const つまみ = new Map<string, string>();
  if (Array.isArray(inputs)) {
    for (const input of inputs) {
      if (input && typeof input === "object" && !Array.isArray(input)) {
        const candidate = input as { id?: unknown; kind?: unknown };
        if (typeof candidate.id === "string" && typeof candidate.kind === "string") {
          つまみ.set(candidate.id, candidate.kind);
        }
      }
    }
  }
  const 先に書かれた式 = new Set<string>();
  for (const [名前, 式] of Object.entries(v as Record<string, unknown>)) {
    const path = `$.formulas.${名前}`;
    if (!isValueName(名前)) {
      errors.push({ path, ...valueNameIssue(名前) });
      continue;
    }
    if (typeof 式 !== "string" || 式.trim() === "") {
      errors.push({
        path,
        message: `${名前} must be a non-empty expression string`,
        hint: `got ${Array.isArray(式) ? "array" : 式 === null ? "null" : typeof 式}`,
      });
      continue;
    }
    try {
      const names = extractIdentifiers(parseFormula(式));
      if (つまみ.has(名前) || 先に書かれた式.has(名前)) {
        errors.push({
          path,
          message: `${名前} collides with an input or an earlier formula`,
          hint: "inputs と formulas では重ならない名前を使う",
        });
        continue;
      }
      let valid = true;
      for (const name of names) {
        if (先に書かれた式.has(name)) continue;
        const kind = つまみ.get(name);
        if (["slider", "number", "stepper", "timeline", "toggle"].includes(kind ?? "")) continue;
        valid = false;
        errors.push({
          path,
          message: `${名前} references an unavailable formula identifier`,
          hint: `${name} は数値/真偽の input にするか、この式より前の formula に書く`,
        });
      }
      if (valid) 先に書かれた式.add(名前);
    } catch (e) {
      errors.push({
        path,
        message: `${名前} is not a readable expression`,
        hint: (e as Error).message,
      });
    }
  }
}

/**
 * 押下などの出来事で動く仕掛けを検査する (#1393)。
 *
 * 相手の指し方は 4 つあり、**ちょうど 1 つだけ書く**。 2 つ書くとどちらを指したのか
 * 決まらず、0 なら相手がいない。 記法側の読み取りと同じ規則にする。
 */
function validateEvents(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!Array.isArray(v)) {
    errors.push({
      path: "$.events",
      message: "events must be an array of event objects",
      hint: `got ${v === null ? "null" : typeof v}`,
    });
    return;
  }
  const 相手の鍵 = ["box", "lane", "arrow", "diagram"];
  v.forEach((e, i) => {
    const path = `$.events[${i}]`;
    if (!e || typeof e !== "object" || Array.isArray(e)) {
      errors.push({ path, message: "event must be a plain object", hint: `got ${typeof e}` });
      return;
    }
    const o = e as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (k === "on" || k === "handler" || 相手の鍵.includes(k)) continue;
      errors.push({
        path: `${path}.${k}`,
        message: `unknown key "${k}"`,
        hint: `使える項目 = on, handler, ${相手の鍵.join(", ")}`,
      });
    }
    if (typeof o.on !== "string" || !(EVENT_KINDS as readonly string[]).includes(o.on)) {
      errors.push({
        path: `${path}.on`,
        message: "on must be a known event kind",
        hint: `使える種類 = ${EVENT_KINDS.join(", ")}`,
      });
    }
    if (typeof o.handler !== "string" || o.handler.trim() === "") {
      errors.push({
        path: `${path}.handler`,
        message: "handler is required",
        hint: "空でない文字列で書く",
      });
    }
    const 書いた = 相手の鍵.filter((k) => o[k] !== undefined);
    if (書いた.length !== 1) {
      errors.push({
        path,
        message:
          書いた.length === 0 ? "event target is required" : "event target must be written once",
        hint: `${相手の鍵.join(" / ")} のどれか 1 つだけを書く`,
      });
      return;
    }
    const 鍵 = 書いた[0]!;
    if (鍵 === "diagram") {
      if (o.diagram !== true) {
        errors.push({
          path: `${path}.diagram`,
          message: "diagram must be true",
          hint: "図全体を指す時だけ書く",
        });
      }
      return;
    }
    if (typeof o[鍵] !== "string" || (o[鍵] as string).trim() === "") {
      errors.push({ path: `${path}.${鍵}`, message: `${鍵} must be a non-empty string` });
      return;
    }
    if (鍵 === "arrow") {
      const 両端 = (o.arrow as string).split("->");
      if (両端.length !== 2 || 両端.some((x) => x.trim() === "")) {
        errors.push({
          path: `${path}.arrow`,
          message: "arrow must be `A -> B`",
          hint: "矢印の両端の名前を書く",
        });
      }
    }
  });
}

/**
 * 巻き上げに応じて進む値を検査する (#1393)。
 *
 * 形は `{ 名前: { start, end, scrub, label } }`。 名前の規則は状態と揃える。
 */
function validateScrolls(
  v: unknown,
  inputs: unknown,
  formulas: unknown,
  errors: JsonDslError[],
): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path: "$.scrolls",
      message: "scrolls must be an object of name to spec",
      hint: `got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`,
    });
    return;
  }
  const 既に値を作る名前 = new Set<string>();
  if (Array.isArray(inputs)) {
    for (const input of inputs) {
      if (!input || typeof input !== "object" || Array.isArray(input)) continue;
      const id = (input as { id?: unknown }).id;
      if (typeof id === "string") 既に値を作る名前.add(id);
    }
  }
  if (formulas && typeof formulas === "object" && !Array.isArray(formulas)) {
    for (const id of Object.keys(formulas)) 既に値を作る名前.add(id);
  }
  for (const [名前, spec] of Object.entries(v as Record<string, unknown>)) {
    const path = `$.scrolls.${名前}`;
    if (!isValueName(名前)) {
      errors.push({ path, ...valueNameIssue(名前) });
      continue;
    }
    if (既に値を作る名前.has(名前)) {
      errors.push({
        path,
        message: `${名前} collides with an input or formula`,
        hint: "inputs / formulas / scrolls では重ならない名前を使う",
      });
    }
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
      errors.push({ path, message: `${名前} must be a plain object`, hint: `got ${typeof spec}` });
      continue;
    }
    for (const [k, x] of Object.entries(spec as Record<string, unknown>)) {
      if (k === "label") {
        if (typeof x !== "string") {
          errors.push({ path: `${path}.label`, message: "label must be a string" });
        }
        continue;
      }
      if (k !== "start" && k !== "end" && k !== "scrub") {
        errors.push({
          path: `${path}.${k}`,
          message: `unknown key "${k}"`,
          hint: "使える項目 = start, end, scrub, label",
        });
        continue;
      }
      if (typeof x !== "number" || !Number.isFinite(x)) {
        errors.push({ path: `${path}.${k}`, message: `${k} must be a finite number` });
      } else if (x < 0 || x > 1) {
        errors.push({
          path: `${path}.${k}`,
          message: `${k} must be between 0 and 1`,
          hint: "0 と 1 を含む範囲で書く",
        });
      }
    }
  }
}

/**
 * 箱の中に描く図形を検査する (#1374)。
 *
 * `validateReadouts` と同じ理由で外側の形もここで見る。
 */
function validateActorShape(v: unknown, path: string, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path,
      message: "shape must be a plain object",
      hint: `got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`,
    });
    return;
  }
  表で中身を検査する(v as Record<string, unknown>, 図形の表, path, "shape", errors);
}

function validateIdMap(
  v: unknown,
  欄: "lanes" | "groups",
  層: 階層,
  errors: JsonDslError[],
  中身を見る: (o: Record<string, unknown>, id: string, path: string) => void,
): void {
  if (v === undefined) return;
  const path = `$.${欄}`;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path,
      message: `${欄} must be a plain object of id -> settings`,
      hint: `got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`,
    });
    return;
  }
  for (const [id, 中] of Object.entries(v as Record<string, unknown>)) {
    const idPath = `${path}.${id}`;
    if (!中 || typeof 中 !== "object" || Array.isArray(中)) {
      errors.push({
        path: idPath,
        message: `${欄}.${id} must be a plain object`,
        hint: `got ${中 === null ? "null" : Array.isArray(中) ? "array" : typeof 中}`,
      });
      continue;
    }
    const o = 中 as Record<string, unknown>;
    checkUnknownKeys(o, 層, idPath, errors);
    中身を見る(o, id, idPath);
  }
}

/** 2 軸で仕分ける図の軸の名前を見る (#1294) */
function validateAxes(v: unknown, errors: JsonDslError[]): void {
  if (v === undefined) return;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    errors.push({
      path: "$.axes",
      message: "axes must be a plain object like { x: { left, right }, y: { bottom, top } }",
    });
    return;
  }
  const 軸 = v as Record<string, unknown>;
  checkUnknownKeys(軸, "axes", "$.axes", errors);
  const 層の名 = { x: "axesX", y: "axesY" } as const;
  for (const 名 of ["x", "y"] as const) {
    const 一方 = 軸[名];
    if (一方 === undefined) continue;
    if (!一方 || typeof 一方 !== "object" || Array.isArray(一方)) {
      errors.push({ path: `$.axes.${名}`, message: `axes.${名} must be a plain object` });
      continue;
    }
    const o = 一方 as Record<string, unknown>;
    checkUnknownKeys(o, 層の名[名], `$.axes.${名}`, errors);
    表で検査(o, 層の名[名], `$.axes.${名}`, `axes.${名}`, errors);
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
 *
 * ## 守る範囲 (Round 6 で線を引いた)
 *
 * この関数が守るのは **自分が確保する量** = 写しの入れ物と、 名前の一覧と、 枠の並び。 いずれも
 * 上限 (深さ / 数) を見てから作る。
 *
 * **渡された側が自分で確保する量は守れない**。 Proxy の `ownKeys` は「名前の並びを返す」 のが
 * 仕事で、 その並びは trap の中で作られる。 こちらが受け取った時点で既に在るため、 長さを見て
 * 拒んでも確保そのものは起きた後になる。 これは呼ぶ側の code が確保するもので、 同じ process に
 * 任意の object を渡せる相手は、 この関数を通さずに同じことができる。
 *
 * 線を引くのは、 5 round にわたって「読む前に量を作れる経路」 を潰し続けた末に、 残りが
 * 呼ぶ側の code の中に移ったため。 潰す対象が自分の外に出た時点で、 この関数の責務ではない。
 *
 * **test のために export する** (#1295)。 写しの性質 (深さ / 数の上限 / 読む順 / 値を返す
 * 関数の扱い) を確かめる検査は、以前は「検査が見ない項目」 に構造をぶら下げて
 * `validateDragonJson` 越しに見ていた。 知らない項目を誤りにしたことでその足場が無くなり、
 * かつ写しは検査より前に走るため、検査の結果からは写しの中身を取り出せない。
 * 検査の対象そのものを直接呼ぶ形にする。
 */
export function 素のデータに写す(
  root: unknown,
): { ok: true; value: unknown } | { ok: false; error: JsonDslError } {
  const 写し済 = new WeakMap<object, unknown[] | Record<string, unknown>>();
  let 項目数 = 0;
  // 例外を拾った時に「どこを読んでいたか」 を言うために持つ。 投げるのは値を読む所と名前を
  // 数える所の両方で、 どちらも path を持たないまま外へ出ると `$` としか言えない
  let 読んでいる場所 = "$";

  /**
   * まだ中身を埋めていない入れ物と、 その進み具合。
   *
   * 配列は名前の並びを持たず長さだけを持つ (Round 6 の指摘)。 添字を文字の並びとして実体化すると、
   * **上限を見る前にその並びを作ってしまう** (実測 = `new Array(5_000_001)` で 500 万個の添字を
   * 作ろうとした)。 添字は数から導けるので持つ必要がない。
   */
  type 枠 = {
    元: object;
    器: unknown[] | Record<string, unknown>;
    /** object の時だけ持つ。 配列は `長さ` を使う */
    名前の並び: string[] | null;
    長さ: number;
    次: number;
    深さ: number;
    path: string;
  };

  /** 入れ物だけ作る (ここでは降りない)。 新しく作った時だけ枠を返す */
  const 器を作る = (v: unknown, 深さ: number, path: string): { 値: unknown; 枠: 枠 | null } => {
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

    if (並びか) {
      // **長さを先に見てから降りる** (Round 6 の指摘)。 添字を文字の並びとして作ると、 上限を
      // 見る前にその並びを作ってしまう。 長さは数を読むだけなので何も作らない。
      //
      // **長さは正規化してから使う** (Round 7 の指摘)。 `Array.from({ length })` は仕様の
      // `ToLength` を通しており、 生の値をそのまま使うと 2 つの形で壊れる。
      //
      // | `length` が返す値 | 正規化しないと |
      // |---|---|
      // | `2.5` | 3 回読む (`Array.from` は 2 要素) |
      // | `NaN` | 数の合計が `NaN` になり、 上限も終わりも判定できず読み続ける |
      //
      // `ToLength` と同じく 0 へ丸め、 0 以上 2^53-1 以下に収める。
      //
      // **数に直すのは単項 `+`** (Round 8 の指摘)。 `Number()` は `BigInt` を通してしまうが、
      // 仕様の `ToNumber` は `TypeError` を投げる = `Array.from({ length: 2n })` は投げる。
      // 単項 `+` は `ToNumber` そのものなので、 投げる形も含めて元の挙動と揃う (投げた分は
      // 下の `catch` が検査の誤りに変える)。
      const 生の長さ = +(v as unknown[]).length;
      const 長さ = Number.isNaN(生の長さ)
        ? 0
        : Math.min(Math.max(Math.trunc(生の長さ), 0), Number.MAX_SAFE_INTEGER);
      項目数 += 長さ;
      if (項目数 > 写しの最大の項目数) {
        throw new 写せない(path, `項目が多すぎる (上限 ${写しの最大の項目数})`);
      }
      return { 値: 器, 枠: { 元: v, 器, 名前の並び: null, 長さ, 次: 0, 深さ, path } };
    }

    // **名前も数に入れる** (Round 5 の指摘)。 値を読む前に名前の一覧を作るため、 値だけを
    // 数えると「名前が 20,000 個ある段を 63 回降りる」 形で 126 万個を並べられる = 上限を
    // 見る前に資源を使い切れる
    const 名前の並び = Object.keys(v as Record<string, unknown>);
    項目数 += 名前の並び.length;
    if (項目数 > 写しの最大の項目数) {
      throw new 写せない(path, `項目が多すぎる (上限 ${写しの最大の項目数})`);
    }
    return { 値: 器, 枠: { 元: v, 器, 名前の並び, 長さ: 名前の並び.length, 次: 0, 深さ, path } };
  };

  try {
    const 先頭 = 器を作る(root, 0, "$");
    const 積み: 枠[] = 先頭.枠 ? [先頭.枠] : [];

    while (積み.length > 0) {
      const 今 = 積み[積み.length - 1]!;
      if (今.次 >= 今.長さ) {
        積み.pop();
        continue;
      }
      // 配列は添字をその場で作る (並びとして持たない)
      const key = 今.名前の並び === null ? String(今.次) : 今.名前の並び[今.次]!;
      今.次 += 1;
      const 子のpath = 今.名前の並び === null ? `${今.path}[${key}]` : `${今.path}.${key}`;

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

function validateJson(
  json: unknown,
): { ok: true; data: DragonJson } | { ok: false; errors: JsonDslError[] } {
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

  // 知らない項目を先に見る (#1295)。 綴り違いは「書いた項目が効かない」 形で表に出るため、
  // 個々の型の誤りより先に伝える方が直しやすい
  checkUnknownKeys(j, "root", "$", errors);
  // 値を見せる部品の中身を、記法と同じ表で見る (#1374)
  validateReadouts(j.readouts, errors);
  validateBands(j.bands, errors);
  // 読む人が動かすつまみの中身も、記法と同じ表で見る (#1389)
  validateInputs(j.inputs, errors);
  // 式は描画側の parser に通す (#1391)
  validateFormulas(j.formulas, j.inputs, errors);
  // 押下と巻き上げ (#1393)
  validateEvents(j.events, errors);
  validateScrolls(j.scrolls, j.inputs, j.formulas, errors);

  // 値そのものの型は表が見る (#1304)。 図表の箱の上の小見出し (#1247) の空文字は
  // 「書かなかった」 と同じ扱いにするため通す (記法側の `eyebrow:` と揃える。 落とすのは `jsonToDoc`)
  表で検査(j, "root", "$", "", errors);

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
      checkUnknownKeys(ao, "actor", `$.actors[${i}]`, errors);
      // 値そのものの型は表が見る (#1304)。 `kind` は見本 (parts) の名前も受けるため
      // 非空の文字列までしか縛らない (CAR-1657 の unified syntax)
      表で検査(ao, "actor", `$.actors[${i}]`, "actor", errors);
      // 箱の中に描く図形の中身を、記法と同じ表で見る (#1374)
      validateActorShape(ao.shape, `$.actors[${i}].shape`, errors);
      // 見本 (parts) にしか効かない項目は、見本でない箱に書かれたら誤りにする (#1294)。
      // 記法側は読めない項目名として行番号付きで知らせるため、黙って捨てると入口で扱いが変わる。
      const 見本か = 見本の名前か(ao.kind);
      // 見本にしか効かない欄を普通の箱に書いた形 (#1294)。 一覧は表が持つ
      const 代わりに使う欄: Record<(typeof 見本にしか効かない欄)[number], string> = {
        state: "箱の見た目を変えるなら tone / color を使う",
        scale: "大きさを変えるなら posW / posH を使う",
      };
      if (!見本か) {
        for (const 欄 of 見本にしか効かない欄) {
          if (ao[欄] === undefined) continue;
          errors.push({
            path: `$.actors[${i}].${欄}`,
            message: `actor.${欄} is only for parts (kind must be a parts identifier)`,
            hint: 代わりに使う欄[欄],
          });
        }
      }
      // 逆向きも同じく誤りにする (#1308)。 普通の箱にしか効かない欄を見本に書くと、
      // `jsonToDoc` が丸ごと落として何も起きない
      if (見本か) {
        for (const 欄 of 見本に効かない欄) {
          if (ao[欄] === undefined) continue;
          errors.push({
            path: `$.actors[${i}].${欄}`,
            message: `actor.${欄} is not for parts (kind is a parts identifier)`,
            hint: `見本の状態を変えるなら state を使う (\`"state": { "${欄}": ... }\`)`,
          });
        }
      }
      validateActorNodes(ao.nodes, `$.actors[${i}].nodes`, errors);
      // codex-review MAJOR fix = state override は plain object + 値は primitive (number / string / boolean) 限定、
      // `{ v: {} }` 等 nested object や null が流入すると CdlState.initial に不正な型が入り compile 崩れる。
      if (ao.state !== undefined) {
        if (!ao.state || typeof ao.state !== "object" || Array.isArray(ao.state)) {
          errors.push({
            path: `$.actors[${i}].state`,
            message: "actor.state must be a plain object",
          });
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
      checkUnknownKeys(so, "step", `$.flow[${i}]`, errors);
      // 値そのものの型は表が見る (#1304)。 色と線種は engine の一覧と突き合わせる
      表で検査(so, "step", `$.flow[${i}]`, "step", errors);
      // CAR-1693 Phase 1: step DSL 表面 pos の validation
      validateLayoutPos(so.pos, `$.flow[${i}].pos`, errors);
    });
  }
  validateViewport(j.viewport, errors);
  // 縦列と群は **鍵を利用者が決める** (id)。 表が縛るのはその中の項目
  //
  // #1304 まで外側の形すら見ておらず、`lanes: 5` のような値が誤りにならないまま素通りしていた
  // (形が違えば中の走査ごと飛ばす書き方だったため)。 形が違う値は黙って捨てない
  validateIdMap(j.lanes, "lanes", "lane", errors, (lane, laneId, path) => {
    表で検査(lane, "lane", path, `lanes.${laneId}`, errors);
    // CAR-1693 Phase 1: lane DSL 表面 pos の validation
    validateLayoutPos(lane.pos, `${path}.pos`, errors);
  });
  validateIdMap(j.groups, "groups", "group", errors, (group, groupId, path) => {
    表で検査(group, "group", path, `groups.${groupId}`, errors);
  });
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
        checkUnknownKeys(po, "phase", `$.animation[${i}]`, errors);
        // 値そのものの型は表が見る (#1304)
        表で検査(po, "phase", `$.animation[${i}]`, "phase", errors);
        validatePhaseMotion(po, i, errors);
      });
    }
  }
  validateStates(j.states, errors);
  validateValues(j.values, errors);
  validateAxes(j.axes, errors);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: j as unknown as DragonJson };
}

/**
 * 段の中で値を動かす指定を見る (#1186)。
 *
 * 状態名の記法は `states:` と同じ判定を使う。 参照先はこの JSON の `states` だけでは決めない。
 * 見本や preset が持つ状態を動かす指定もあるためで、記法側と同じく compile 後の図で解決する。
 */
function validatePhaseMotion(po: Record<string, unknown>, i: number, errors: JsonDslError[]): void {
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
            errors.push({
              path,
              message: "tween value must be finite numbers",
              hint: `got ${typeof v}`,
            });
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
    errors.push({
      path: "$.states",
      message: "states must be a plain object of name -> initial value",
    });
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
    errors.push({
      path: "$.values",
      message: "values must be a plain object of name -> expression",
    });
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
/**
 * 図表の箱の上の小見出しを、 記法側と同じ形に整える (#1247)。
 *
 * 記法は値を `trim()` してから空かどうかを見る。 JSON でも同じ順で見ないと、 空白だけの値が
 * 入口によって別の意味になる (記法は書かなかった扱い、 JSON は中身のない帯)。
 */
function 整えた小見出し(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export function jsonToDoc(json: DragonJson): DslDocument {
  const p0 = { line: 0 };
  const actors: DslActor[] = json.actors.map((a) => {
    if (typeof a === "string") {
      return { name: a, kind: "actor" as NodeKind, kindWritten: false, pos: p0 };
    }
    // CAR-1657 = kind が既存 NodeKind に無い値なら parts identifier 候補、 partId に格納
    const kindStr = (a.kind ?? "actor") as string;
    const isPart = kindStr !== "actor" && !VALID_KIND_SET.has(kindStr);
    // 色は記法と同じ振り分けを通す (#1294)。 `#` で始まれば色番号、それ以外は色の名前。
    // 別々に書くと、同じ値が入口によって色番号にも色名にもなる
    const 色 = a.color !== undefined ? splitColorValue(a.color) : {};
    return {
      name: a.name,
      kind: isPart ? "actor" : resolveNodeKind(kindStr),
      // parts 候補は `kind` を `actor` に倒して `partId` へ退避するため、 名札に載せる種類としては
      // 「書かなかった」 と同じ扱いにする (#1058)
      kindWritten: a.kind !== undefined && !isPart,
      subtitle: a.subtitle,
      eyebrow: a.eyebrow,
      value: a.value,
      previous: a.previous,
      rows: a.rows,
      // 行頭の印 (#1466)。 行と対で読む
      marks: a.marks,
      lane: a.lane,
      stack: a.stack,
      initial: a.initial,
      final: a.final,
      // 箱の中に描く図形 (#1374)。 見本では状態の上書きが効くため、通常の箱にだけ渡す
      shape: isPart ? undefined : a.shape,
      visibleIf: isPart ? undefined : a.visibleIf,
      title: isPart ? undefined : a.title,
      // 値に追随する 5 欄 (#1392)。 記法と同じく見本には渡さない
      wBind: isPart ? undefined : a.wBind,
      hBind: isPart ? undefined : a.hBind,
      opacity: isPart ? undefined : a.opacity,
      renderOffsetX: isPart ? undefined : a.renderOffsetX,
      renderOffsetY: isPart ? undefined : a.renderOffsetY,
      // 普通の箱にしか効かない欄は見本では落とす。 落とす欄の一覧は `見本に効かない欄` が
      // 唯一の出どころで、検査 (#1308) も同じ表を見る = 「検査は通すが組み立てが捨てる」
      // 状態が作れない
      ...(isPart
        ? {}
        : {
            tone: resolveTone(a.tone) ?? 色.tone,
            owner: a.owner,
            end: a.end,
            touchpoint: a.touchpoint,
            opportunity: a.opportunity,
          }),
      colorHex: 色.hex,
      // 絶対座標と大きさ (#1294)。 `pos` (ずらし幅) とは別経路
      posX: a.posX,
      posY: a.posY,
      posW: a.posW,
      posH: a.posH,
      // 箱の中の要素ごとの固定 (#1294)。 写しを作って外から書き換えられないようにする
      nodes: a.nodes
        ? Object.fromEntries(
            Object.entries(a.nodes).map(([id, o]) => [
              id,
              { posX: o.posX, posY: o.posY, posW: o.posW, posH: o.posH },
            ]),
          )
        : undefined,
      // 倍率は見本にしか効かない (検査が見本でない箱を弾く)。 書かれた名前は JSON では
      // 常に `scale` で、記法の別名 (`倍率`) は JSON に持ち込まない
      scale: isPart ? a.scale : undefined,
      scaleKeys: isPart && a.scale !== undefined ? ["scale"] : undefined,
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
    side: s.side as "top" | "right" | "bottom" | "left" | undefined,
    // 矢印の先の形 (#1462)。 読めない語は組み立てが落とす
    head: s.head,
    // 端の印の残り 3 欄と、関係の語 / 言づての種類 (#1466)
    tailHead: s.tailHead,
    headFill: s.headFill,
    tailHeadFill: s.tailHeadFill,
    relation: s.relation,
    // 辺の役目と名前の下地 (cdl#618)
    role: s.role,
    labelPlate: s.labelPlate,
    msgKind: s.kind,
    // 箱と同じ読み替えを通す (#1304)。 通さないと `tone: "成功"` が色名として解決されないまま
    // 図に届き、同じ値が箱では色になり矢印では色にならない
    tone: resolveTone(s.tone),
    style: s.style,
    guard: s.guard,
    cardinality: s.cardinality,
    // 値に追随する 3 欄 (#1396)
    widthBind: s.widthBind,
    strokeBind: s.strokeBind,
    dashOffsetBind: s.dashOffsetBind,
    labelOffsetX: s.labelOffsetX,
    labelOffsetY: s.labelOffsetY,
    overlay: s.overlay,
    // CAR-1693 Phase 1: DSL 表面 pos → 内部 AST layoutPos
    layoutPos: s.pos,
    pos: p0,
  }));
  // 状態は段が無くても図に載る (#1162 で組み立ての出口が載せる)。 **段の有無で分けない** =
  // 分けると `states` だけを書いた JSON で値が 1 つも届かない (記法側で起きていた形、 #1181)
  // 値を見せる部品はそのまま渡す (#1374)。 形は描画側の型が縛る
  const readouts: DslReadout[] | undefined = json.readouts ? [...json.readouts] : undefined;
  // つまみもそのまま渡す (#1389)。 形は描画側の型が縛る
  const inputs: DslInput[] | undefined = json.inputs ? [...json.inputs] : undefined;
  /*
   * 押下と巻き上げも記法側と同じ形へ写す (#1393)。
   *
   * 相手は名前のまま持ち、識別子への読み替えは組み立てが行う = 2 つの入口で同じ経路を通る。
   */
  const events: DslEventBinding[] | undefined = json.events?.map((e) => ({
    event: e.on as DslEventBinding["event"],
    target:
      e.diagram === true
        ? ({ kind: "diagram" } as const)
        : e.arrow !== undefined
          ? ({
              kind: "edge" as const,
              from: e.arrow.split("->")[0]?.trim() ?? "",
              to: e.arrow.split("->")[1]?.trim() ?? "",
            } as const)
          : e.lane !== undefined
            ? ({ kind: "lane" as const, name: e.lane } as const)
            : ({ kind: "node" as const, name: e.box ?? "" } as const),
    handlerId: e.handler.trim(),
    pos: p0,
  }));
  const scrolls: DslScrollTrigger[] | undefined = json.scrolls
    ? Object.entries(json.scrolls).map(([id, spec]) => ({ id, ...spec }))
    : undefined;
  // 式は `{ 名前: "式" }` から並びへ写す (#1391)。 記法側と同じ形にして組み立てを 1 本にする
  const formulas: DslFormula[] | undefined = json.formulas
    ? Object.entries(json.formulas).map(([id, expression]) => ({ id, expression, pos: p0 }))
    : undefined;
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
    // 書いた段だけが欄を持つ。 空文字を置くと「書いた」 と「書いていない」 が同じ形になる
    ...(p.draw !== undefined ? { draw: p.draw, drawPos: p0 } : {}),
    // 割合は `draw` がある段にだけ写す。 単独で書いても描く相手が決まらず何も起きないので、
    // 記法側 (同じ行に書かせる形) と同じ状態に揃える
    ...(p.draw !== undefined && p.drawRatio !== undefined ? { drawRatio: p.drawRatio } : {}),
    // 段の中で動かす分 (#1186)。 記法側の `tweens` / `sets` と同じ形に写す。
    // 空の配列を置かないのは、記法側が「無ければ field ごと持たない」 形だから
    ...(p.tween && Object.keys(p.tween).length > 0
      ? {
          tweens: Object.entries(p.tween).map(([state, [from, to]]) => ({
            state,
            from,
            to,
            pos: p0,
          })),
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
    // 前後の空白を落としてから見る。 記法側 (`v05/parser.ts`) が `trim()` してから
    // 空かどうかを判定するため、 揃えないと **空白だけの値で入口ごとに図が変わる**
    // (記法は書かなかった扱い、 JSON は中身のない帯を描く。 Round 2 の指摘で実測)
    ...(整えた小見出し(json.eyebrow) !== undefined
      ? { eyebrow: 整えた小見出し(json.eyebrow), eyebrowPos: p0 }
      : {}),
    // 2 軸で仕分ける図の軸の名前 (#1294)。 中身の無い形は「書かなかった」 と同じにする =
    // 空の軸を渡すと、書いていない側の名前が空文字で描かれる (記法側と同じ扱い)
    ...(json.axes && (json.axes.x !== undefined || json.axes.y !== undefined)
      ? { axes: json.axes, axesPos: p0 }
      : {}),
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
          Object.entries(json.groups).map(([id, g]) => [
            id,
            { id, label: g.label, lanes: g.lanes, pos: p0 },
          ]),
        )
      : undefined,
    readouts,
    inputs,
    formulas,
    events,
    scrolls,
    // 順序図で面が動いている間の帯 (#1466)
    bands: json.bands,
    // 矢印をいつ出すか (#1470)
    reveal: json.reveal,
    // 図の並ぶ向き (#1494)。 JSON は英語で書くので、記法と同じ語に直してから渡す
    ...(json.direction !== undefined ? { direction: json.direction === "horizontal" ? ("横" as const) : ("縦" as const) } : {}),
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
    const msg = v.errors
      .map((e) => `  ${e.path}: ${e.message}${e.hint ? ` (${e.hint})` : ""}`)
      .join("\n");
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
