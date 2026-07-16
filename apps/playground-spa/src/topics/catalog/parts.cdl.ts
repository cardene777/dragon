import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Parts ... rich exemplar 合成用 reusable な small parts library。
 *
 * ⚠️ SYNC REQUIRED = 本 file の top-level export diagram 数を変更する時は
 * `apps/playground-spa/src/lib/catalog-items.ts` の `PARTS_COUNT_ESTIMATE` も同期更新する。
 * drift すると CatalogIndexPage で itemCount 誤表示 + total 集計もズレる (CAR-1613)。
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
    shape: { kind: "rect", source: "{top}", fillMax: 60, orient: "up", fill: "#a08870", radius: 4 } })
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
    shape: { kind: "circle", radius: "{sa}", fill: "#a08870" } })
  .node("cB", { lane: "b", stack: 0, kind: "dyn-circle", title: "B", subtitle: "score {sb}", w: 160, h: 200,
    shape: { kind: "circle", radius: "{sb}", fill: "#22c55e" } })
  .node("cC", { lane: "c", stack: 0, kind: "dyn-circle", title: "C", subtitle: "score {sc}", w: 160, h: 200,
    shape: { kind: "circle", radius: "{sc}", fill: "#a08870" } })
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
    { value: "offline", color: "#a08870", label: "オフライン" },
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

// ============================================================
// parts 21: バッテリー残量 (dyn-rect + subtitle live)
// ============================================================
export const partsBatteryLevel = diagram("parts-battery-level", {
  topic: "バッテリー残量 — 縦 fill で残量 metaphor",
})
  .lane("l", { x: 0, width: 300 })
  .state("bat", { initial: 20 })
  .node("cell", { lane: "l", stack: 0, kind: "dyn-rect", title: "バッテリー", subtitle: "{bat}%", w: 240, h: 380,
    shape: { kind: "rect", source: "{bat}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 8 } })
  .phase("p", { duration: 4000, title: "充電中", body: "" }, (p: PhaseBuilder) =>
    p.activate("cell").tween("bat", 20, 95))
  .build();

// ============================================================
// parts 22: 温度計 (dyn-rect vertical + 単位表示)
// ============================================================
export const partsThermometer = diagram("parts-thermometer", {
  topic: "温度計 — 縦棒温度で連続値 metaphor",
})
  .lane("l", { x: 0, width: 260 })
  .state("temp", { initial: 12 })
  .node("mercury", { lane: "l", stack: 0, kind: "dyn-rect", title: "気温", subtitle: "{temp}°C", w: 220, h: 400,
    shape: { kind: "rect", source: "{temp}", fillMax: 40, orient: "up", fill: "#dc2626", radius: 12 } })
  .phase("p", { duration: 4500, title: "気温上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("mercury").tween("temp", 12, 32))
  .build();

// ============================================================
// parts 23: 心拍波形 (readout sparkline + 単位)
// ============================================================
export const partsHeartbeat = diagram("parts-heartbeat", {
  topic: "心拍波形 — sparkline で pulse 表現",
})
  .lane("l", { x: 0, width: 500 })
  .state("bpm", { initial: 72 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("hb", { source: "bpm", history: 30, color: "#dc2626", label: "heart beat" })
  .readout.countup("v", { source: "bpm", unit: " bpm", label: "現在の心拍", decimals: 0 })
  .phase("p", { duration: 4000, title: "心拍推移", body: "" }, (p: PhaseBuilder) =>
    p.tween("bpm", 72, 118))
  .build();

// ============================================================
// parts 24: 評価スター (5 dyn-circle で 5 段階中 3 fill)
// ============================================================
export const partsRatingStars = diagram("parts-rating-stars", {
  topic: "評価スター — 5 段階中 fill 表示",
})
  .lane("l", { x: 0, width: 600 })
  .state("s1", { initial: "#f59e0b" })
  .state("s2", { initial: "#f59e0b" })
  .state("s3", { initial: "#f59e0b" })
  .state("s4", { initial: "#f5e6b8" })
  .state("s5", { initial: "#f5e6b8" })
  .node("st1", { lane: "l", stack: 0, kind: "dyn-circle", title: "★", subtitle: "", w: 100, h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s1}" } })
  .node("st2", { lane: "l", stack: 1, kind: "dyn-circle", title: "★", subtitle: "", w: 100, h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s2}" } })
  .node("st3", { lane: "l", stack: 2, kind: "dyn-circle", title: "★", subtitle: "", w: 100, h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s3}" } })
  .node("st4", { lane: "l", stack: 3, kind: "dyn-circle", title: "★", subtitle: "", w: 100, h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s4}" } })
  .node("st5", { lane: "l", stack: 4, kind: "dyn-circle", title: "★", subtitle: "", w: 100, h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s5}" } })
  .phase("p", { duration: 3000, title: "3/5 表示", body: "" }, (p: PhaseBuilder) =>
    p.activate("st1", "st2", "st3", "st4", "st5"))
  .build();

// ============================================================
// parts 25: 対比バー (A vs B、 2 dyn-rect 横並び)
// ============================================================
export const partsComparisonBars = diagram("parts-comparison-bars", {
  topic: "対比バー — A vs B の数値比較",
})
  .lane("la", { x: 0, width: 260 })
  .lane("lb", { x: 300, width: 260 })
  .state("va", { initial: 30 })
  .state("vb", { initial: 20 })
  .node("barA", { lane: "la", stack: 0, kind: "dyn-rect", title: "A", subtitle: "{va}", w: 240, h: 360,
    shape: { kind: "rect", source: "{va}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 } })
  .node("barB", { lane: "lb", stack: 0, kind: "dyn-rect", title: "B", subtitle: "{vb}", w: 240, h: 360,
    shape: { kind: "rect", source: "{vb}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 6 } })
  .phase("p", { duration: 4000, title: "対比", body: "" }, (p: PhaseBuilder) =>
    p.activate("barA", "barB").tween("va", 30, 85).tween("vb", 20, 60))
  .build();

// ============================================================
// parts 26: トグルスイッチ (2 state 色 + 位置 metaphor)
// ============================================================
export const partsToggleSwitch = diagram("parts-toggle-switch", {
  topic: "トグルスイッチ — on/off 状態表示",
})
  .lane("l", { x: 0, width: 400 })
  .state("bg", { initial: "#22c55e" })
  .node("track", { lane: "l", stack: 0, kind: "dyn-rect", title: "", subtitle: "ON", w: 320, h: 160,
    shape: { kind: "rect", source: "100", fillMax: 100, orient: "up", fill: "{bg}", radius: 80 } })
  .phase("p", { duration: 3000, title: "on 状態", body: "" }, (p: PhaseBuilder) =>
    p.activate("track"))
  .build();

// ============================================================
// parts 27: スピードメーター (dyn-arc で 0-180 km/h)
// ============================================================
export const partsSpeedometer = diagram("parts-speedometer", {
  topic: "スピードメーター — 円弧針で速度表示",
})
  .lane("l", { x: 0, width: 400 })
  .state("kph", { initial: 30 })
  .node("meter", { lane: "l", stack: 0, kind: "dyn-arc", title: "速度", subtitle: "{kph} km/h", w: 380, h: 380,
    shape: { kind: "arc", angle: "{kph}", sweepMax: 180, outerRadius: 150, innerRadius: 110, fill: "#dc2626" } })
  .phase("p", { duration: 4500, title: "加速", body: "" }, (p: PhaseBuilder) =>
    p.activate("meter").tween("kph", 30, 165))
  .build();

// ============================================================
// parts 28: バッジカウント (countup + 通知強調)
// ============================================================
export const partsBadgeCount = diagram("parts-badge-count", {
  topic: "バッジカウント — 未読数の visual 強調",
})
  .lane("l", { x: 0, width: 380 })
  .state("cnt", { initial: 0 })
  .node("dot", { lane: "l", stack: 0, kind: "dyn-circle", title: "受信", subtitle: "{cnt} 通", w: 340, h: 340,
    shape: { kind: "circle", radius: 130, fill: "#dc2626" } })
  .phase("p", { duration: 3500, title: "受信増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot").tween("cnt", 0, 42))
  .build();

// ============================================================
// parts 29: パルス指標 (rate の visual 表現)
// ============================================================
export const partsPulseIndicator = diagram("parts-pulse-indicator", {
  topic: "パルス指標 — レート visualization",
})
  .lane("l", { x: 0, width: 400 })
  .state("rate", { initial: 5 })
  .node("pulse", { lane: "l", stack: 0, kind: "dyn-wave", title: "レート", subtitle: "{rate} req/s", w: 380, h: 380,
    shape: { kind: "wave", level: "{rate}", amplitude: 50, frequency: 3, waveHeight: 15, fill: "#8b5cf6" } })
  .phase("p", { duration: 4000, title: "rate 上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("pulse").tween("rate", 5, 85))
  .build();

// ============================================================
// parts 30: ゲージ 3 連 (3 mini gauge cluster)
// ============================================================
export const partsGaugeCluster = diagram("parts-gauge-cluster", {
  topic: "ゲージ 3 連 — 複数指標の同時表示",
})
  .lane("la", { x: 0, width: 220 })
  .lane("lb", { x: 260, width: 220 })
  .lane("lc", { x: 520, width: 220 })
  .state("cpu", { initial: 20 })
  .state("mem", { initial: 40 })
  .state("net", { initial: 15 })
  .node("gCpu", { lane: "la", stack: 0, kind: "dyn-arc", title: "CPU", subtitle: "{cpu}%", w: 200, h: 200,
    shape: { kind: "arc", angle: "{cpu}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#4e9dc4" } })
  .node("gMem", { lane: "lb", stack: 0, kind: "dyn-arc", title: "MEM", subtitle: "{mem}%", w: 200, h: 200,
    shape: { kind: "arc", angle: "{mem}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#22c55e" } })
  .node("gNet", { lane: "lc", stack: 0, kind: "dyn-arc", title: "NET", subtitle: "{net}%", w: 200, h: 200,
    shape: { kind: "arc", angle: "{net}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#f59e0b" } })
  .phase("p", { duration: 4000, title: "負荷変動", body: "" }, (p: PhaseBuilder) =>
    p.activate("gCpu", "gMem", "gNet")
      .tween("cpu", 20, 75).tween("mem", 40, 85).tween("net", 15, 60))
  .build();

// ============================================================
// parts 31: デジタル時計 (countup HH:MM 表示)
// ============================================================
export const partsDigitalClock = diagram("parts-digital-clock", {
  topic: "デジタル時計 — 時分の数値 live 表示",
})
  .lane("l", { x: 0, width: 500 })
  .state("hh", { initial: 12 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.countup("hour", { source: "hh", unit: " 時", label: "現在時刻 (時)", decimals: 0 })
  .phase("p", { duration: 4000, title: "時刻更新", body: "" }, (p: PhaseBuilder) =>
    p.tween("hh", 12, 18))
  .build();

// ============================================================
// parts 32: カウントダウン (dyn-arc 円弧が減少)
// ============================================================
export const partsCountdown = diagram("parts-countdown", {
  topic: "カウントダウン — 残り時間の円弧",
})
  .lane("l", { x: 0, width: 400 })
  .state("sec", { initial: 60 })
  .node("timer", { lane: "l", stack: 0, kind: "dyn-arc", title: "残り", subtitle: "{sec} 秒", w: 380, h: 380,
    shape: { kind: "arc", angle: "{sec}", sweepMax: 60, outerRadius: 150, innerRadius: 110, fill: "#f59e0b" } })
  .phase("p", { duration: 5000, title: "時間経過", body: "" }, (p: PhaseBuilder) =>
    p.activate("timer").tween("sec", 60, 0))
  .build();

// ============================================================
// parts 33: メッセージ吹き出し (dyn-rect + subtitle)
// ============================================================
export const partsMessageBubble = diagram("parts-message-bubble", {
  topic: "メッセージ吹き出し — chat bubble",
})
  .lane("l", { x: 0, width: 500 })
  .node("bubble", { lane: "l", stack: 0, kind: "dyn-rect", title: "Hi there!", subtitle: "10:30 AM", w: 460, h: 200,
    shape: { kind: "rect", source: "100", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 24 } })
  .phase("p", { duration: 3000, title: "メッセージ受信", body: "" }, (p: PhaseBuilder) =>
    p.activate("bubble"))
  .build();

// ============================================================
// parts 34: ユーザーアバター (大 dyn-circle)
// ============================================================
export const partsUserAvatar = diagram("parts-user-avatar", {
  topic: "ユーザーアバター — 大円で user icon",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#4e9dc4" })
  .node("avatar", { lane: "l", stack: 0, kind: "dyn-circle", title: "JD", subtitle: "John Doe", w: 340, h: 340,
    shape: { kind: "circle", radius: 150, fill: "{bg}" } })
  .phase("p", { duration: 3000, title: "avatar 表示", body: "" }, (p: PhaseBuilder) =>
    p.activate("avatar"))
  .build();

// ============================================================
// parts 35: 料金カード (KPI card variant with unit)
// ============================================================
export const partsPriceCard = diagram("parts-price-card", {
  topic: "料金カード — 価格 + 単位",
})
  .lane("l", { x: 0, width: 500 })
  .state("price", { initial: 980 })
  .state("prev", { initial: 1200 })
  .state("hist", { initial: 1200 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.kpiCard("pc", { source: "price", historySource: "hist", comparisonSource: "prev", unit: " 円/月", label: "Basic プラン" })
  .phase("p", { duration: 3500, title: "料金表示", body: "" }, (p: PhaseBuilder) =>
    p.tween("hist", 1200, 980).set("prev", 1200))
  .build();

// ============================================================
// parts 36: ディスク使用率 (arc + %)
// ============================================================
export const partsDiskUsage = diagram("parts-disk-usage", {
  topic: "ディスク使用率 — 使用量の弧",
})
  .lane("l", { x: 0, width: 400 })
  .state("used", { initial: 30 })
  .node("disk", { lane: "l", stack: 0, kind: "dyn-arc", title: "SSD", subtitle: "{used}% 使用中", w: 380, h: 380,
    shape: { kind: "arc", angle: "{used}", sweepMax: 100, outerRadius: 150, innerRadius: 100, fill: "#8b5cf6" } })
  .phase("p", { duration: 4000, title: "使用量増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("disk").tween("used", 30, 78))
  .build();

// ============================================================
// parts 37: 上下帯域 (2 dyn-rect で up/down 速度)
// ============================================================
export const partsBandwidthMeter = diagram("parts-bandwidth-meter", {
  topic: "上下帯域 — up/down 速度メーター",
})
  .lane("la", { x: 0, width: 240 })
  .lane("lb", { x: 280, width: 240 })
  .state("up", { initial: 20 })
  .state("dn", { initial: 30 })
  .node("upBar", { lane: "la", stack: 0, kind: "dyn-rect", title: "UP", subtitle: "{up} Mbps", w: 220, h: 340,
    shape: { kind: "rect", source: "{up}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 } })
  .node("dnBar", { lane: "lb", stack: 0, kind: "dyn-rect", title: "DOWN", subtitle: "{dn} Mbps", w: 220, h: 340,
    shape: { kind: "rect", source: "{dn}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 } })
  .phase("p", { duration: 4000, title: "帯域変動", body: "" }, (p: PhaseBuilder) =>
    p.activate("upBar", "dnBar").tween("up", 20, 65).tween("dn", 30, 90))
  .build();

// ============================================================
// parts 38: 天気アイコン (色付き大 circle で状態表現)
// ============================================================
export const partsWeatherIcon = diagram("parts-weather-icon", {
  topic: "天気アイコン — 天気状態を色で表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#f59e0b" })
  .node("sun", { lane: "l", stack: 0, kind: "dyn-circle", title: "晴れ", subtitle: "☀ 24°C", w: 340, h: 340,
    shape: { kind: "circle", radius: 140, fill: "{bg}" } })
  .phase("p", { duration: 3000, title: "天気表示", body: "" }, (p: PhaseBuilder) =>
    p.activate("sun"))
  .build();

// ============================================================
// parts 39: 波形 3 連 (3 sparkline 同時、 CPU/MEM/NET trend)
// ============================================================
export const partsMultiSparkline = diagram("parts-multi-sparkline", {
  topic: "波形 3 連 — 3 指標の trend 同時表示",
})
  .lane("l", { x: 0, width: 600 })
  .state("cpu", { initial: 20 })
  .state("mem", { initial: 40 })
  .state("net", { initial: 15 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("sc", { source: "cpu", history: 30, color: "#dc2626", label: "CPU trend" })
  .readout.sparkline("sm", { source: "mem", history: 30, color: "#22c55e", label: "MEM trend" })
  .readout.sparkline("sn", { source: "net", history: 30, color: "#4e9dc4", label: "NET trend" })
  .phase("p", { duration: 4500, title: "3 指標推移", body: "" }, (p: PhaseBuilder) =>
    p.tween("cpu", 20, 78).tween("mem", 40, 65).tween("net", 15, 88))
  .build();

// ============================================================
// parts 40: 進捗ドット (3 dot で完了 stage 表示)
// ============================================================
export const partsProgressDots = diagram("parts-progress-dots", {
  topic: "進捗ドット — 3 段階完了表示",
})
  .lane("la", { x: 0, width: 160 })
  .lane("lb", { x: 200, width: 160 })
  .lane("lc", { x: 400, width: 160 })
  .state("d1", { initial: "#22c55e" })
  .state("d2", { initial: "#22c55e" })
  .state("d3", { initial: "#f5e6b8" })
  .node("dot1", { lane: "la", stack: 0, kind: "dyn-circle", title: "1", subtitle: "受注", w: 140, h: 140,
    shape: { kind: "circle", radius: 55, fill: "{d1}" } })
  .node("dot2", { lane: "lb", stack: 0, kind: "dyn-circle", title: "2", subtitle: "処理中", w: 140, h: 140,
    shape: { kind: "circle", radius: 55, fill: "{d2}" } })
  .node("dot3", { lane: "lc", stack: 0, kind: "dyn-circle", title: "3", subtitle: "配送", w: 140, h: 140,
    shape: { kind: "circle", radius: 55, fill: "{d3}" } })
  .phase("p", { duration: 3000, title: "進捗", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot1", "dot2", "dot3"))
  .build();

// ============================================================
// parts 41: 音量メーター (dyn-wave で音量 metaphor)
// ============================================================
export const partsVolumeMeter = diagram("parts-volume-meter", {
  topic: "音量メーター — 音量 metaphor",
})
  .lane("l", { x: 0, width: 400 })
  .state("vol", { initial: 30 })
  .node("volw", { lane: "l", stack: 0, kind: "dyn-wave", title: "音量", subtitle: "{vol}", w: 380, h: 380,
    shape: { kind: "wave", level: "{vol}", amplitude: 80, frequency: 4, waveHeight: 20, fill: "#8b5cf6" } })
  .phase("p", { duration: 4500, title: "音量変化", body: "" }, (p: PhaseBuilder) =>
    p.activate("volw").tween("vol", 30, 95))
  .build();

// ============================================================
// parts 42: 進捗 6 段階 (step progress 6 stage)
// ============================================================
export const partsProgressLong = diagram("parts-progress-long", {
  topic: "進捗 6 段階 — 長い wizard flow",
})
  .lane("l", { x: 0, width: 700 })
  .state("cur", { initial: 3 })
  .state("steps", { initial: '["受付", "審査", "承認", "処理", "配送", "完了"]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.stepProgress("stp", { source: "cur", stepsSource: "steps", color: "#22c55e", label: "6 stage wizard" })
  .phase("p", { duration: 4000, title: "step 進行", body: "" }, (p: PhaseBuilder) =>
    p.tween("cur", 3, 6))
  .build();

// ============================================================
// parts 43: 予算残り (dyn-rect + subtitle percent)
// ============================================================
export const partsBudgetUsage = diagram("parts-budget-usage", {
  topic: "予算消化率 — 使用量の visual",
})
  .lane("l", { x: 0, width: 500 })
  .state("used", { initial: 40 })
  .node("budget", { lane: "l", stack: 0, kind: "dyn-rect", title: "予算消化", subtitle: "{used}% 使用", w: 480, h: 200,
    shape: { kind: "rect", source: "{used}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 8 } })
  .phase("p", { duration: 4000, title: "予算消化", body: "" }, (p: PhaseBuilder) =>
    p.activate("budget").tween("used", 40, 82))
  .build();

// ============================================================
// parts 44: ステータス timeline (statusTimeline readout)
// ============================================================
export const partsStatusTimelineWeek = diagram("parts-status-timeline-week", {
  topic: "週間 status timeline — 7 日分の状態帯",
})
  .lane("l", { x: 0, width: 700 })
  .state("evt", { initial: '[["月","active"],["火","active"],["水","warning"],["木","error"],["金","warning"],["土","active"],["日","active"]]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusTimeline("stl", { source: "evt", max: 8, label: "7 day status" })
  .phase("p", { duration: 3000, title: "週間表示", body: "" }, (p: PhaseBuilder) =>
    p.set("evt", '[["月","active"],["火","active"],["水","warning"],["木","error"],["金","warning"],["土","active"],["日","active"]]'))
  .build();

// ============================================================
// parts 45: レインボーゲージ (5 stack rect で 5 tone tier)
// ============================================================
export const partsRainbowStack = diagram("parts-rainbow-stack", {
  topic: "レインボーゲージ — 5 tone tier stack",
})
  .lane("l", { x: 0, width: 340 })
  .state("t1", { initial: 20 })
  .state("t2", { initial: 20 })
  .state("t3", { initial: 20 })
  .state("t4", { initial: 20 })
  .state("t5", { initial: 20 })
  .node("tier1", { lane: "l", stack: 0, kind: "dyn-rect", title: "Tier 1", subtitle: "S", w: 320, h: 90,
    shape: { kind: "rect", source: "{t1}", fillMax: 30, orient: "up", fill: "#dc2626", radius: 4 } })
  .node("tier2", { lane: "l", stack: 1, kind: "dyn-rect", title: "Tier 2", subtitle: "A", w: 320, h: 90,
    shape: { kind: "rect", source: "{t2}", fillMax: 30, orient: "up", fill: "#f59e0b", radius: 4 } })
  .node("tier3", { lane: "l", stack: 2, kind: "dyn-rect", title: "Tier 3", subtitle: "B", w: 320, h: 90,
    shape: { kind: "rect", source: "{t3}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 4 } })
  .node("tier4", { lane: "l", stack: 3, kind: "dyn-rect", title: "Tier 4", subtitle: "C", w: 320, h: 90,
    shape: { kind: "rect", source: "{t4}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 4 } })
  .node("tier5", { lane: "l", stack: 4, kind: "dyn-rect", title: "Tier 5", subtitle: "D", w: 320, h: 90,
    shape: { kind: "rect", source: "{t5}", fillMax: 30, orient: "up", fill: "#8b5cf6", radius: 4 } })
  .phase("p", { duration: 4000, title: "全 tier active", body: "" }, (p: PhaseBuilder) =>
    p.activate("tier1", "tier2", "tier3", "tier4", "tier5")
      .tween("t1", 20, 28).tween("t2", 20, 28).tween("t3", 20, 28).tween("t4", 20, 28).tween("t5", 20, 28))
  .build();
