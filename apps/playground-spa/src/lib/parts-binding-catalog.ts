/**
 * canvas pivot parts binding catalog。
 * user 「パーツ同士を連動できるように、 カウンターの値でゲージが貯まる」 の実装 SSOT。
 *
 * ## 設計
 *
 * - **source** = 値を発行する parts (counter / countup 系、 単一 numeric state を持つ)
 * - **sink** = 値を受け取って visual 表現する parts (gauge / bar / ring / wave 等の 0-100% 系)
 * - **binding 経路** = drop 時に sink parts の binding target state を source parts の state と
 *   同名に rename → cdl compile 側で diagram-level state を共有 → source の value が sink に流れる
 *
 * ## 動作例
 *
 * 1. user が `partsCounterActor` を drop = actors: に `- counter1: { kind: counter-actor }` 追加
 * 2. counter1 の右上「⚡」 icon click → 連動可能 parts 一覧 (arc-gauge / percent-ring / etc)
 * 3. `partsArcGauge` を選択 → actors: に
 *    `- arc1: { kind: arc-gauge, bind: counter1.n }` 追加
 *    (bind field は「counter1 alias の state n を参照」)
 * 4. compile 側で arc1 の state `v` (default) を counter1 の state `n` と共有する経路に rename
 * 5. counter1 の n が 0→50 に animate すると arc1 も自動追従
 */

export type PartsRole = "source" | "sink" | "standalone";

export interface PartsBindingDef {
  /** parts identifier (parts-{name} prefix なし、 例 "arc-gauge") */
  kind: string;
  /** parts の role = source / sink / standalone (連動不可) */
  role: PartsRole;
  /**
   * source 側 = 発行 state 名 (単一)。 例 counter-actor の "n"。
   * sink 側 = binding 受信 state 名 (単一、 sink parts の visual を drive する主 state)。 例 arc-gauge の "v"。
   * standalone は null。
   */
  bindableState: string | null;
  /** 値域 (source / sink 互換性判定用)、 numeric 0-100 が既定 */
  valueRange: { min: number; max: number };
  /** UI 表示用の日本語 label */
  label: string;
}

/**
 * 全 parts の binding role 定義。 sink parts の bindableState を drop 時に
 * source parts の bindableState 名に rename する経路の SSOT。
 */
export const PARTS_BINDING_CATALOG: Record<string, PartsBindingDef> = {
  // source parts (numeric state 発行)
  "counter-actor": { kind: "counter-actor", role: "source", bindableState: "n", valueRange: { min: 0, max: 100 }, label: "カウンタ" },
  "countup": { kind: "countup", role: "source", bindableState: "n", valueRange: { min: 0, max: 100 }, label: "カウントアップ" },

  // sink parts (visual 0-100% を drive する parts)
  "arc-gauge": { kind: "arc-gauge", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "アークゲージ" },
  "percent-ring": { kind: "percent-ring", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "パーセントリング" },
  "horizontal-bar": { kind: "horizontal-bar", role: "sink", bindableState: "pv", valueRange: { min: 0, max: 100 }, label: "横進捗バー" },
  "wave-gauge": { kind: "wave-gauge", role: "sink", bindableState: "lv", valueRange: { min: 0, max: 100 }, label: "波打つ矩形ゲージ" },
  "bucket-reservoir": { kind: "bucket-reservoir", role: "sink", bindableState: "water", valueRange: { min: 0, max: 100 }, label: "バケット貯留" },
};

/**
 * 指定 kind の binding role を返す。 未登録 kind は standalone として扱う (連動不可)。
 */
export function getBindingDef(kind: string): PartsBindingDef {
  return PARTS_BINDING_CATALOG[kind] ?? {
    kind,
    role: "standalone",
    bindableState: null,
    valueRange: { min: 0, max: 100 },
    label: kind,
  };
}

/**
 * source parts に対して連動可能な sink parts の一覧を返す (UI popup 用)。
 * 現状は「全 sink parts が全 source parts と互換」 の単純 mapping (valueRange 統一)。
 * 将来 valueRange 制約が厳密化されたら本関数で filter する。
 */
export function listBindableSinks(sourceKind: string): PartsBindingDef[] {
  const source = getBindingDef(sourceKind);
  if (source.role !== "source") return [];
  return Object.values(PARTS_BINDING_CATALOG).filter((p) => p.role === "sink");
}

/**
 * 逆方向 = sink parts に対して 対応可能な source parts 一覧を返す (「この gauge を何と連動するか」 逆引き用)。
 */
export function listBindableSources(sinkKind: string): PartsBindingDef[] {
  const sink = getBindingDef(sinkKind);
  if (sink.role !== "sink") return [];
  return Object.values(PARTS_BINDING_CATALOG).filter((p) => p.role === "source");
}
