import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Parts ... rich exemplar 合成用 reusable な small parts library。
 *
 * 位置付け:
 *   - primitives = cdl kind 単体 demo (教育目的、 kind とは何か)
 *   - parts = 「composite exemplar を組立てる完成 visual unit」 (実用、 使い回す部品)
 *
 * 規約:
 *   - 各 parts は 1 phase 化 (story は composite 側で、 parts は「何を描くか」 だけ)
 *   - rectangle 内 gauge = dyn-wave (波打つ) default、 orient fill は意図的選択のみ
 *   - state indicator は 1 大 shape で状態を主張、 複数並列は避ける
 *   - metaphor は 1 parts = 1 concept、 混在禁止
 *   - name / label は日本語 (JA page 前提)
 */

// ============================================================
// parts 1: 波打つ矩形ゲージ (dyn-wave)
// ============================================================
export const partsWaveGauge = diagram("parts-wave-gauge", {
  topic: "波打つ矩形ゲージ — 液面 metaphor",
})
  .lane("l", { x: 0, width: 400 })
  .state("lv", { initial: 0 })
  .node("gauge", { lane: "l", stack: 0, kind: "dyn-wave", title: "波打つ矩形", subtitle: "水位 {lv}%", w: 380, h: 400,
    shape: { kind: "wave", level: "{lv}", amplitude: 100, frequency: 2.5, waveHeight: 10, fill: "#4e9dc4" } })
  .phase("p", { duration: 4000, title: "水位上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("gauge").tween("lv", 0, 90))
  .build();

// ============================================================
// parts 2: 縦積み層バー (合計値の内訳)
// ============================================================
export const partsStackedLayer = diagram("parts-stacked-layer", {
  topic: "縦積み層バー — 合計値の内訳",
})
  .lane("l", { x: 0, width: 320 })
  .state("top", { initial: 20 })
  .state("mid", { initial: 15 })
  .state("bot", { initial: 40 })
  .node("topL", { lane: "l", stack: 0, kind: "dyn-rect", title: "上層", subtitle: "+{top}", w: 300, h: 120,
    shape: { kind: "rect", source: "{top}", fillMax: 60, orient: "up", fill: "#94a3b8", radius: 4 } })
  .node("midL", { lane: "l", stack: 1, kind: "dyn-rect", title: "中層", subtitle: "+{mid}", w: 300, h: 120,
    shape: { kind: "rect", source: "{mid}", fillMax: 60, orient: "up", fill: "#22c55e", radius: 4 } })
  .node("botL", { lane: "l", stack: 2, kind: "dyn-rect", title: "底層", subtitle: "{bot}", w: 300, h: 180,
    shape: { kind: "rect", source: "{bot}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 4 } })
  .phase("p", { duration: 4000, title: "層拡大", body: "" }, (p: PhaseBuilder) =>
    p.activate("topL", "midL", "botL")
      .tween("bot", 40, 90).tween("mid", 15, 35).tween("top", 20, 45))
  .build();

// ============================================================
// parts 3: 状態インジケーター (色遷移する大 circle)
// ============================================================
export const partsStateIndicator = diagram("parts-state-indicator", {
  topic: "状態インジケーター — 単一大 shape の色で状態表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("stFill", { initial: "#22c55e" })
  .node("ind", { lane: "l", stack: 0, kind: "dyn-circle", title: "現在の状態", subtitle: "active", w: 360, h: 380,
    shape: { kind: "circle", radius: 140, fill: "{stFill}" } })
  .phase("p", { duration: 3000, title: "状態表示", body: "" }, (p: PhaseBuilder) =>
    p.activate("ind"))
  .build();

// ============================================================
// parts 4: 横進捗バー (fill が左→右)
// ============================================================
export const partsHorizontalBar = diagram("parts-horizontal-bar", {
  topic: "横進捗バー — 左→右に fill",
})
  .lane("l", { x: 0, width: 600 })
  .state("pv", { initial: 0 })
  .node("bar", { lane: "l", stack: 0, kind: "dyn-rect", title: "進捗バー", subtitle: "{pv}%", w: 580, h: 100,
    shape: { kind: "rect", source: "{pv}", fillMax: 100, orient: "right", fill: "#22c55e", radius: 6 } })
  .phase("p", { duration: 4000, title: "fill 進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("pv", 0, 100))
  .build();

// ============================================================
// parts 5: アークゲージ (円弧 % 表現)
// ============================================================
export const partsArcGauge = diagram("parts-arc-gauge", {
  topic: "アークゲージ — 円弧で 0-100% 表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("v", { initial: 0 })
  .node("arc", { lane: "l", stack: 0, kind: "dyn-arc", title: "アークゲージ", subtitle: "{v}%", w: 360, h: 380,
    shape: { kind: "arc", angle: "{v}", sweepMax: 100, outerRadius: 140, innerRadius: 100, fill: "#4e9dc4" } })
  .phase("p", { duration: 4000, title: "sweep 進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("arc").tween("v", 0, 95))
  .build();

// ============================================================
// parts 6: カウンタ表示 (actor + subtitle template)
// ============================================================
export const partsCounterActor = diagram("parts-counter-actor", {
  topic: "カウンタ表示 — 数値 live",
})
  .lane("l", { x: 0, width: 320 })
  .state("n", { initial: 0 })
  .node("cnt", { lane: "l", stack: 0, kind: "actor", title: "カウント", subtitle: "{n} 件", w: 300, h: 200 })
  .phase("p", { duration: 3500, title: "カウント上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("cnt").tween("n", 0, 5000))
  .build();

// ============================================================
// parts 7: 3灯シグナル (縦積み 3 circle)
// ============================================================
export const partsTrafficLightStack = diagram("parts-traffic-light-stack", {
  topic: "3灯シグナル — 縦積み circle で状態表示",
})
  .lane("l", { x: 0, width: 200 })
  .state("rFill", { initial: "#e5e7eb" })
  .state("yFill", { initial: "#e5e7eb" })
  .state("gFill", { initial: "#22c55e" })
  .node("rC", { lane: "l", stack: 0, kind: "dyn-circle", title: "赤", subtitle: "", w: 160, h: 160,
    shape: { kind: "circle", radius: 60, fill: "{rFill}" } })
  .node("yC", { lane: "l", stack: 1, kind: "dyn-circle", title: "黄", subtitle: "", w: 160, h: 160,
    shape: { kind: "circle", radius: 60, fill: "{yFill}" } })
  .node("gC", { lane: "l", stack: 2, kind: "dyn-circle", title: "緑", subtitle: "", w: 160, h: 160,
    shape: { kind: "circle", radius: 60, fill: "{gFill}" } })
  .phase("p", { duration: 3000, title: "signal 表示", body: "" }, (p: PhaseBuilder) =>
    p.activate("rC", "yC", "gC"))
  .build();

// ============================================================
// parts 8: 円サイズ競争 (radius が signal)
// ============================================================
export const partsCircleSizeRace = diagram("parts-circle-size-race", {
  topic: "円サイズ競争 — radius で強さ比較",
})
  .lane("a", { x: 0, width: 180 })
  .lane("b", { x: 200, width: 180 })
  .lane("c", { x: 400, width: 180 })
  .state("sa", { initial: 20 })
  .state("sb", { initial: 20 })
  .state("sc", { initial: 20 })
  .node("cA", { lane: "a", stack: 0, kind: "dyn-circle", title: "A", subtitle: "score {sa}", w: 160, h: 200,
    shape: { kind: "circle", radius: "{sa}", fill: "#94a3b8" } })
  .node("cB", { lane: "b", stack: 0, kind: "dyn-circle", title: "B", subtitle: "score {sb}", w: 160, h: 200,
    shape: { kind: "circle", radius: "{sb}", fill: "#22c55e" } })
  .node("cC", { lane: "c", stack: 0, kind: "dyn-circle", title: "C", subtitle: "score {sc}", w: 160, h: 200,
    shape: { kind: "circle", radius: "{sc}", fill: "#94a3b8" } })
  .phase("p", { duration: 3500, title: "競争", body: "" }, (p: PhaseBuilder) =>
    p.activate("cA", "cB", "cC")
      .tween("sa", 20, 50).tween("sb", 20, 75).tween("sc", 20, 45))
  .build();

// ============================================================
// parts 9: パーセントリング (readout)
// ============================================================
export const partsPercentRing = diagram("parts-percent-ring", {
  topic: "パーセントリング — 0-100% を ring 表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("v", { initial: 0 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.percentRing("ring", { source: "v", max: 100, label: "percent ring" })
  .phase("p", { duration: 4000, title: "ring 進行", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 0, 100))
  .build();

// ============================================================
// parts 10: カウントアップ (readout)
// ============================================================
export const partsCountup = diagram("parts-countup", {
  topic: "カウントアップ — 数値 live 表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("n", { initial: 0 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.countup("cu", { source: "n", unit: " 件", label: "count up", decimals: 0 })
  .phase("p", { duration: 4000, title: "カウント上昇", body: "" }, (p: PhaseBuilder) =>
    p.tween("n", 0, 15000))
  .build();

// ============================================================
// parts 11: エッジ連鎖 (3 node + 2 edge activate)
// ============================================================
export const partsEdgeChain = diagram("parts-edge-chain", {
  topic: "エッジ連鎖 — 3 node 順次 activate + edge",
})
  .lane("l1", { x: 0, width: 180 })
  .lane("l2", { x: 200, width: 180 })
  .lane("l3", { x: 400, width: 180 })
  .state("n1", { initial: 0 })
  .state("n2", { initial: 0 })
  .state("n3", { initial: 0 })
  .node("nA", { lane: "l1", stack: 0, kind: "dyn-rect", title: "step 1", subtitle: "{n1}%", w: 160, h: 200,
    shape: { kind: "rect", source: "{n1}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 } })
  .node("nB", { lane: "l2", stack: 0, kind: "dyn-rect", title: "step 2", subtitle: "{n2}%", w: 160, h: 200,
    shape: { kind: "rect", source: "{n2}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 } })
  .node("nC", { lane: "l3", stack: 0, kind: "dyn-rect", title: "step 3", subtitle: "{n3}%", w: 160, h: 200,
    shape: { kind: "rect", source: "{n3}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 } })
  .edge("nA", "nB", { id: "e12", label: "→", tone: "info" })
  .edge("nB", "nC", { id: "e23", label: "→", tone: "success" })
  .phase("p", { duration: 4000, title: "flow 通過", body: "" }, (p: PhaseBuilder) =>
    p.activate("nA", "nB", "nC", "e12", "e23")
      .tween("n1", 0, 100).tween("n2", 0, 100).tween("n3", 0, 100))
  .build();

// ============================================================
// parts 12: バケット貯留 (大 wave rectangle)
// ============================================================
export const partsBucketReservoir = diagram("parts-bucket-reservoir", {
  topic: "バケット貯留 — 大 wave rectangle 容器",
})
  .lane("l", { x: 0, width: 440 })
  .state("water", { initial: 100 })
  .node("bkt", { lane: "l", stack: 0, kind: "dyn-wave", title: "バケット", subtitle: "水位 {water}%", w: 420, h: 460,
    shape: { kind: "wave", level: "{water}", amplitude: 100, frequency: 2, waveHeight: 12, fill: "#4e9dc4" } })
  .phase("p", { duration: 4000, title: "水位変動", body: "" }, (p: PhaseBuilder) =>
    p.activate("bkt").tween("water", 100, 30))
  .build();

// ============================================================
// parts 13: スパークライン (readout、 履歴 trend)
// ============================================================
export const partsSparkline = diagram("parts-sparkline", {
  topic: "スパークライン — 数値履歴 trend",
})
  .lane("l", { x: 0, width: 400 })
  .state("v", { initial: 10 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("spk", { source: "v", history: 20, color: "#4e9dc4", label: "trend sparkline" })
  .phase("p", { duration: 4000, title: "trend 描画", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 10, 80))
  .build();

// ============================================================
// parts 14: ドーナツチャート (readout、 N segment pie)
// ============================================================
export const partsDonut = diagram("parts-donut", {
  topic: "ドーナツチャート — N segment 割合表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("seg", { initial: "[30, 25, 20, 25]" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.donut("dnt", { source: "seg", label: "donut 4 segment" })
  .phase("p", { duration: 3000, title: "分配表示", body: "" }, (p: PhaseBuilder) =>
    p.set("seg", "[30, 25, 20, 25]"))
  .build();

// ============================================================
// parts 15: レーダーポリゴン (readout、 N 軸 polygon)
// ============================================================
export const partsRadar = diagram("parts-radar", {
  topic: "レーダーポリゴン — N 軸 polygon balance",
})
  .lane("l", { x: 0, width: 320 })
  .state("dims", { initial: "[3, 3, 3, 3, 3]" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.radar("rdr", { source: "dims", max: 10, color: "#4e9dc4", label: "5 軸 radar" })
  .phase("p", { duration: 3000, title: "balance 表示", body: "" }, (p: PhaseBuilder) =>
    p.set("dims", "[8, 3, 5, 2, 7]"))
  .build();

// ============================================================
// parts 16: ステップ進捗 (readout、 wizard step)
// ============================================================
export const partsStepProgress = diagram("parts-step-progress", {
  topic: "ステップ進捗 — 番号付き wizard step",
})
  .lane("l", { x: 0, width: 500 })
  .state("cur", { initial: 1 })
  .state("steps", { initial: '["入力", "確認", "決済", "完了"]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.stepProgress("stp", { source: "cur", stepsSource: "steps", color: "#22c55e", label: "wizard 4 step" })
  .phase("p", { duration: 3000, title: "step 表示", body: "" }, (p: PhaseBuilder) =>
    p.set("cur", 1))
  .build();

// ============================================================
// parts 17: ステータスドット (readout、 状態別色)
// ============================================================
export const partsStatusDot = diagram("parts-status-dot", {
  topic: "ステータスドット — 小 dot で状態表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("st", { initial: "online" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusDot("dot", { source: "st", map: [
    { value: "online", color: "#22c55e", label: "オンライン" },
    { value: "away", color: "#f59e0b", label: "離席" },
    { value: "offline", color: "#94a3b8", label: "オフライン" },
  ] as const, label: "status dot" })
  .phase("p", { duration: 3000, title: "state 表示", body: "" }, (p: PhaseBuilder) =>
    p.set("st", "online"))
  .build();

// ============================================================
// parts 18: 通知カード (readout、 4 kind alert)
// ============================================================
export const partsNotification = diagram("parts-notification", {
  topic: "通知カード — 4 kind (info/warn/error/success)",
})
  .lane("l", { x: 0, width: 500 })
  .state("nkind", { initial: "info" })
  .state("ntitle", { initial: "system status" })
  .state("nbody", { initial: "all systems operational" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.notification("nt", { kindSource: "nkind", titleSource: "ntitle", bodySource: "nbody", label: "notification card" })
  .phase("p", { duration: 3000, title: "通知表示", body: "" }, (p: PhaseBuilder) =>
    p.set("nkind", "info"))
  .build();

// ============================================================
// parts 19: KPI カード (readout、 数値 + delta + sparkline)
// ============================================================
export const partsKpiCard = diagram("parts-kpi-card", {
  topic: "KPI カード — 数値 + delta + mini sparkline",
})
  .lane("l", { x: 0, width: 400 })
  .state("cur", { initial: 1000 })
  .state("prev", { initial: 800 })
  .state("hist", { initial: 500 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.kpiCard("kpi", { source: "cur", historySource: "hist", comparisonSource: "prev", unit: " 件", label: "KPI 売上件数" })
  .phase("p", { duration: 3500, title: "KPI 上昇", body: "" }, (p: PhaseBuilder) =>
    p.tween("cur", 1000, 1500).tween("hist", 500, 1200).set("prev", 1000))
  .build();

// ============================================================
// parts 20: タイムライン帯 (readout、 時系列 status band)
// ============================================================
export const partsTimelineStrip = diagram("parts-timeline-strip", {
  topic: "タイムライン帯 — 時系列 status band",
})
  .lane("l", { x: 0, width: 600 })
  .state("evt", { initial: '[["00:00","active"],["01:00","warning"],["02:00","error"],["03:00","active"]]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusTimeline("stl", { source: "evt", max: 8, label: "timeline 4 event" })
  .phase("p", { duration: 3000, title: "timeline 表示", body: "" }, (p: PhaseBuilder) =>
    p.set("evt", '[["00:00","active"],["01:00","warning"],["02:00","error"],["03:00","active"]]'))
  .build();
