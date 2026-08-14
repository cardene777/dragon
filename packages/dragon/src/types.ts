/**
 * Text DSL の AST 型定義
 * docs/cdl/text-dsl-spec.md の文法を AST に変換した中間表現
 */

import type { NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import type { RelativePos } from "./relative-pos";

export type PresetType =
  | "sequence"
  | "flow"
  | "swimlane"
  | "er"
  | "state"
  | "topology"
  | "solidity"
  | "gantt"
  | "class"
  | "pie"
  | "bar"
  | "line"
  | "c4"
  | "mind";

export type Position = {
  line: number;
  column?: number;
};

/**
 * canvas pivot (CAR-1693 Phase 1) の DSL 表面 `pos: {x, y}` を保持する型。
 * auto layout の compute value からの offset (dx, dy) を表す。 element の `layoutPos:` が
 * undefined なら auto layout の値をそのまま採用 (catalog 100+ backward compat)、 set 済なら
 * Phase 2 の applyPosOffset pass が offset として適用する。
 *
 * naming = DSL 表面 syntax は user 提案 wording (`pos:`) を維持、 内部 AST は既存 `pos: Position`
 * (source line/column) との collision 回避のため `layoutPos:` に rename する 2 層設計。
 */
export type LayoutPos = {
  x: number;
  y: number;
};

/**
 * diagram-level layout mode (CAR-1693 Phase 1)。 未指定は "auto" default で catalog 100+ は
 * byte-identical 動作。 "manual" は Phase 4 で drag interaction が「auto layout を skip して
 * pos: 値をそのまま採用する」 mode として使う予定。
 */
export type LayoutMode = "auto" | "manual";

/** トップレベル AST */
export type DslDocument = {
  title: string;
  type: PresetType;
  actors: DslActor[];
  flow: DslStep[];
  animate?: DslAnimate;
  /** v0.5+ 拡張 ... viewport / lanes / groups */
  viewport?: DslViewport;
  lanes?: Record<string, DslLane>;
  groups?: Record<string, DslGroup>;
  /**
   * canvas pivot (CAR-1693 Phase 1) diagram-level layout mode。 未指定は "auto" default で
   * catalog 100+ backward compat。 "manual" は Phase 4 で drag → pos: 保存の完全 manual mode。
   */
  layout?: LayoutMode;
  pos: Position;
};

/** 登場人物 (v0.5+ ... inline option 拡張) */
export type DslActor = {
  name: string;
  kind: NodeKind;
  /**
   * 著者が種類を書いたか。 書かなかった時 `kind` には既定の `actor` が入るため、
   * `kind` の値だけでは「書いた `actor`」 と「書かなかった」 を区別できない。
   *
   * 順序図の名札は小型の箱 (`h: 72`) で作られる。 描画側は `card` に小型用の分岐を持つが
   * `actor` には無く、 名札の文字が箱の下端をはみ出す。 書いた時だけ種類を名札に載せ、
   * 書かなかった時は小型に耐える形のまま残すために、 この 2 つを区別する (#1058)。
   */
  kindWritten?: boolean;
  /** v0.5+ inline option */
  subtitle?: string;
  eyebrow?: string;
  value?: string;
  rows?: string[];
  lane?: string;
  stack?: number;
  initial?: boolean;
  final?: boolean;
  /**
   * 箱の色。 未指定なら種類ごとの既定色。
   *
   * 矢印 (`DslStep.tone`) と同じ名前と別名を受け付ける (`成功` / `success` 等)。
   * 効く種類は cdl 側の 26 種で、 それ以外は指定しても色が変わらない。
   */
  tone?: Tone;
  /**
   * CAR-1657 parts unified syntax = kind が既存 NODE_KIND_VALID に無い値 (parts identifier 候補)
   * だった時、 parser は partId に格納して compile 側に委譲する。 compile 時に partsCatalog から
   * 対応する CdlDiagram を lookup + merge する経路。 partId set 時は kind = "actor" (default) fallback。
   */
  partId?: string;
  /**
   * `色:` に色番号を書いた時の値。 どの状態に入れるかは組み立て時に決める。
   *
   * 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など 17 種)。
   * 解析の時点ではパーツの定義を知らないため、 名前を決めずに持っておく。
   */
  colorHex?: string;
  /**
   * parts state override (partId set 時のみ有効)。 kind + 既存 reserved fields を除いた
   * inline option の残り (`v: 50` / `count: 100` 等) を state 名 → initial 値 map として保持。
   * compile 時に parts.states[i].initial を上書きする。
   */
  stateOverride?: Record<string, number | string | boolean>;
  /**
   * canvas pivot 新 spec (dragon canvas pivot spec §layout-role-conversion)。
   * user drag / resize で明示的に固定した絶対座標 / サイズ。 4 field set 済なら CDL layout が
   * 該当 actor 由来 lane / node の位置計算を skip、 posX / posY / posW / posH をそのまま採用する。
   * 未指定なら従来の auto layout (catalog 100+ backward compat 保証)。
   */
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
  /**
   * 見本を何倍で描くか (`倍率: 2` / `scale: 2`、 #1026)。 partId set 時のみ有効。
   *
   * `大きさ:` (`posW` / `posH`) とは掛け合わさる。 画面側も同じ意味で読むため、
   * `scale` は状態の名前としては使えない (予約語)。 状態を上書きしたい時は
   * `state: { scale: 2 }` と明示するか、別の名前を使う。
   */
  scale?: number;
  /**
   * 倍率として書かれた項目名 (`scale` / `倍率`、 #1026)。
   *
   * 値が読めない形 (`scale: x`) と書いていない形を見分けるために持つ。 見本が同じ名前の
   * 状態を持つ時の知らせ (`scale-reserved`) が、値の読めなさに左右されないようにする。
   */
  scaleKeys?: string[];
  /**
   * 位置を他の要素からの相対で書いた時の指定 (`位置: Web の右 200`)。
   *
   * 組み立ての段階で 1 度配置を計算し、 基準の実座標から `posX` / `posY` に直す。 解決後は
   * 座標を直接書いた時と同じ経路を通るため、 効き方は書き方によって変わらない。
   */
  posRel?: RelativePos;
  /**
   * canvas pivot UX 修正 (B1 individual node isolation)。 actor 1 件が生成する複数 sub-node
   * (sequence の header / spacer / footer / s{N} 等) の中で「特定 sub-node だけを固定 / resize」
   * するための nested override map。 key = sub-node id 相当の short key (`header` / `footer` /
   * `spacer` / `s0` 等)、 value = posX/Y/W/H の 4 field。 compile 側は対応 CDL node に単独反映、
   * 同 actor の他 sub-node は影響を受けない (lane 全体 posX とは独立経路)。
   */
  nodes?: Record<string, DslActorNodeOverride>;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 未指定は auto
   * layout の compute value そのまま (backward compat)、 set 済なら Phase 2 の applyPosOffset で
   * (auto x + layoutPos.x, auto y + layoutPos.y) に shift される。 既存 posX/posY (絶対座標) は
   * 別 mechanism で、 layoutPos は auto layout からの nudge (dx, dy)。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/**
 * canvas pivot UX 修正 (B1) = actor 内 sub-node 単位で「絶対座標 / サイズ」 を固定するための
 * override 値。 全 field optional、 posX / posY が両方 set 済なら CDL 側で該当 sub-node の
 * auto layout を skip、 明示座標をそのまま採用する。 posW / posH は width / height の上書き。
 */
export type DslActorNodeOverride = {
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
};

/** 流れ (1 行 = 1 step) (v0.5+ ... inline option 拡張) */
export type DslStep = {
  no: number;
  from: string;
  to: string;
  label: string;
  sub?: string;
  tone?: Tone;
  style?: EdgeStyle;
  /** v0.5+ inline option */
  guard?: string;
  cardinality?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 step の edge
   * label 位置を auto layout compute から (dx, dy) shift する。 未指定は auto、 set 済は Phase 2 で適用。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/** lane 宣言 (v0.5+ top-level lanes section) */
export type DslLane = {
  id: string;
  x?: number;
  width?: number;
  label?: string;
  contain?: boolean;
  lifeline?: boolean;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 lane の x 座標を
   * auto layout compute から (dx, dy) shift する。 未指定は auto、 set 済は Phase 2 で適用。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/** group 宣言 (v0.5+ top-level groups section、 topology preset 専用) */
export type DslGroup = {
  id: string;
  label?: string;
  lanes: string[]; // 内包する lane id
  pos: Position;
};

/** viewport 全体仕様 (v0.5+ top-level viewport section) */
export type DslViewport = {
  width?: number;
  height?: number;
  /**
   * 図全体の倍率 (default 1)。 箱 / 文字 / 線 / 間隔のすべてが等比で拡大縮小される。
   *
   * `laneWidth` / `laneGap` / `nodeGap` は **間隔だけ**を動かすため、 箱の大きさは変わらず
   * 図に占める割合はむしろ下がる。 本 field は cdl 側で座標系ごと拡大するので、
   * 見た目の比率が完全に保たれる (SVG user unit 固定の font-size も追従する)。
   */
  scale?: number;
  laneWidth?: number;
  /** 全体 default gap (互換維持、 個別 laneGap / nodeGap / labelMargin の fallback) */
  gap?: number;
  /** lanes 間 horizontal gap */
  laneGap?: number;
  /** nodes 間 vertical gap within lane */
  nodeGap?: number;
  /** edge label 周辺余白 */
  labelMargin?: number;
  pos: Position;
};

/** アニメーション ブロック */
export type DslAnimate = {
  states: DslState[];
  phases: DslPhase[];
  pos: Position;
};

/** 状態宣言 */
export type DslState = {
  name: string;
  initial: number | string;
  pos: Position;
};

/** ステップ (phase) */
export type DslPhase = {
  name: string;
  durationMs: number;
  highlight?: string[]; // active 化対象 (node 名 / edge 名)
  tweens?: DslTween[]; // state lerp
  sets?: DslSet[]; // state 即時遷移
  body?: string;
  badge?: string;
  pos: Position;
};

/** state lerp (遷移) */
export type DslTween = {
  state: string;
  from: number;
  to: number;
  pos: Position;
};

/** state 即時遷移 (切替) */
export type DslSet = {
  state: string;
  value: string | number;
  pos: Position;
};

/** Parser error (行番号付き) */
export type DslError = {
  line: number;
  message: string;
  hint?: string;
};
