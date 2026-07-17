/**
 * Text DSL の AST 型定義
 * docs/cdl/text-dsl-spec.md の文法を AST に変換した中間表現
 */

import type { NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";

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
  | "c4"
  | "mind";

export type Position = {
  line: number;
  column?: number;
};

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
  pos: Position;
};

/** 登場人物 (v0.5+ ... inline option 拡張) */
export type DslActor = {
  name: string;
  kind: NodeKind;
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
   * CAR-1657 parts unified syntax = kind が既存 NODE_KIND_VALID に無い値 (parts identifier 候補)
   * だった時、 parser は partId に格納して compile 側に委譲する。 compile 時に partsCatalog から
   * 対応する CdlDiagram を lookup + merge する経路。 partId set 時は kind = "actor" (default) fallback。
   */
  partId?: string;
  /**
   * parts state override (partId set 時のみ有効)。 kind + 既存 reserved fields を除いた
   * inline option の残り (`v: 50` / `count: 100` 等) を state 名 → initial 値 map として保持。
   * compile 時に parts.states[i].initial を上書きする。
   */
  stateOverride?: Record<string, number | string | boolean>;
  /**
   * canvas pivot Phase 1 (CAR-1693) = per-element auto layout offset。
   * drop / drag で mouse 位置に置いた時の auto 計算位置からの pixel offset を保存する。
   * (posX, posY) が undefined = auto layout そのまま render (現状 catalog 100+ 互換)、
   * set 済 = renderer 側で CSS transform で offset 適用する。
   */
  posX?: number;
  posY?: number;
  pos: Position;
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
