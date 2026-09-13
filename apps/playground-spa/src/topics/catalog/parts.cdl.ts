import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Parts ... rich exemplar 合成用 reusable な small parts library。
 *
 * 本 file の top-level export diagram 数は `catalog-items.ts` の `PARTS_COUNT_ESTIMATE` と
 * 揃える。 ずれると CatalogIndexPage の件数表示が実物と食い違う (CAR-1613)。
 * **覚えておく必要は無い** = ずれたら `parts-count.test.ts` が落ちる (#1341)。
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
 *
 * 各図の直後に置く `subtitle__<export 名>` は catalog 一覧に出す説明文。 `topic` は図の題名
 * (60 字以内) で、 長い説明はこちらに書く。 `sourceYaml__<key>` と同じ suffix pair 規約で、
 * `moduleToItems` が拾って一覧の subtitle にする。
 */

// ============================================================
// parts 1: 波打つ矩形ゲージ (dyn-wave)
// ============================================================
export const partsWaveGauge = diagram("parts-wave-gauge", {
  structuredData: "exclude",
  topic: "波打つ矩形ゲージ — 液面 metaphor",
})
  .lane("l", { x: 0, width: 400 })
  .state("lv", { initial: 0 })
  .node("gauge", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "波打つ矩形",
    subtitle: "水位 {lv}%",
    w: 380,
    h: 400,
    shape: {
      kind: "wave",
      level: "{lv}",
      amplitude: 100,
      frequency: 2.5,
      waveHeight: 10,
      fill: "#4e9dc4",
    },
  })
  .phase("p", { duration: 4000, title: "水位上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("gauge").tween("lv", 0, 90),
  )
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
  .node("topL", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "上層",
    subtitle: "+{top}",
    w: 300,
    h: 120,
    shape: { kind: "rect", source: "{top}", fillMax: 60, orient: "up", fill: "#a08870", radius: 4 },
  })
  .node("midL", {
    lane: "l",
    stack: 1,
    kind: "dyn-rect",
    title: "中層",
    subtitle: "+{mid}",
    w: 300,
    h: 120,
    shape: { kind: "rect", source: "{mid}", fillMax: 60, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("botL", {
    lane: "l",
    stack: 2,
    kind: "dyn-rect",
    title: "底層",
    subtitle: "{bot}",
    w: 300,
    h: 180,
    shape: {
      kind: "rect",
      source: "{bot}",
      fillMax: 100,
      orient: "up",
      fill: "#dc2626",
      radius: 4,
    },
  })
  .phase("p", { duration: 4000, title: "層拡大", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("topL", "midL", "botL")
      .tween("bot", 40, 90)
      .tween("mid", 15, 35)
      .tween("top", 20, 45),
  )
  .build();

// ============================================================
// parts 3: 状態インジケーター (色遷移する大 circle)
// ============================================================
export const partsStateIndicator = diagram("parts-state-indicator", {
  structuredData: "exclude",
  topic: "状態インジケーター — 単一大 shape の色で状態表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("stFill", { initial: "#22c55e" })
  .state("lvl", { initial: 0 })
  .node("ind", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "現在の状態",
    subtitle: "active",
    w: 360,
    h: 380,
    shape: { kind: "circle", radius: 140, fillProgress: "{lvl}", fill: "{stFill}" },
  })
  .phase("p", { duration: 3000, title: "状態が立ち上がる", body: "" }, (p: PhaseBuilder) =>
    p.activate("ind").tween("lvl", 0, 1),
  )
  .build();

// ============================================================
// parts 4: 横進捗バー (fill が左→右)
// ============================================================
export const partsHorizontalBar = diagram("parts-horizontal-bar", {
  structuredData: "exclude",
  topic: "横進捗バー — 左→右に fill",
})
  .lane("l", { x: 0, width: 600 })
  .state("pv", { initial: 0 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "進捗バー",
    subtitle: "{pv}%",
    w: 580,
    h: 100,
    shape: {
      kind: "rect",
      source: "{pv}",
      fillMax: 100,
      orient: "right",
      fill: "#22c55e",
      radius: 6,
    },
  })
  .phase("p", { duration: 4000, title: "満ちていく", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("pv", 0, 100),
  )
  .build();

// ============================================================
// parts 5: アークゲージ (円弧 % 表現)
// ============================================================
export const partsArcGauge = diagram("parts-arc-gauge", {
  structuredData: "exclude",
  topic: "アークゲージ — 円弧で 0-100% 表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("v", { initial: 0 })
  .node("arc", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "アークゲージ",
    subtitle: "{v}%",
    w: 360,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{v}",
      sweepMax: 100,
      outerRadius: 140,
      innerRadius: 100,
      fill: "#4e9dc4",
    },
  })
  .phase("p", { duration: 4000, title: "弧が伸びる", body: "" }, (p: PhaseBuilder) =>
    p.activate("arc").tween("v", 0, 95),
  )
  .build();

// ============================================================
// parts 6: カウンタ表示 (actor + subtitle template)
// ============================================================
export const partsCounterActor = diagram("parts-counter-actor", {
  structuredData: "exclude",
  topic: "カウンタ表示 — 数値 live",
})
  .lane("l", { x: 0, width: 320 })
  .state("n", { initial: 0 })
  .node("cnt", {
    lane: "l",
    stack: 0,
    kind: "actor",
    title: "カウント",
    subtitle: "{n} 件",
    w: 300,
    h: 200,
  })
  .phase("p", { duration: 3500, title: "カウント上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("cnt").tween("n", 0, 5000),
  )
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
  .state("gOn", { initial: 0 })
  .node("rC", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "赤",
    subtitle: "",
    w: 160,
    h: 160,
    shape: { kind: "circle", radius: 60, fill: "{rFill}" },
  })
  .node("yC", {
    lane: "l",
    stack: 1,
    kind: "dyn-circle",
    title: "黄",
    subtitle: "",
    w: 160,
    h: 160,
    shape: { kind: "circle", radius: 60, fill: "{yFill}" },
  })
  .node("gC", {
    lane: "l",
    stack: 2,
    kind: "dyn-circle",
    title: "緑",
    subtitle: "",
    w: 160,
    h: 160,
    shape: { kind: "circle", radius: 60, fillProgress: "{gOn}", fill: "{gFill}" },
  })
  .phase("p", { duration: 3000, title: "緑が点く", body: "" }, (p: PhaseBuilder) =>
    p.activate("rC", "yC", "gC").tween("gOn", 0, 1),
  )
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
  .node("cA", {
    lane: "a",
    stack: 0,
    kind: "dyn-circle",
    title: "A",
    subtitle: "score {sa}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sa}", fill: "#a08870" },
  })
  .node("cB", {
    lane: "b",
    stack: 0,
    kind: "dyn-circle",
    title: "B",
    subtitle: "score {sb}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sb}", fill: "#22c55e" },
  })
  .node("cC", {
    lane: "c",
    stack: 0,
    kind: "dyn-circle",
    title: "C",
    subtitle: "score {sc}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sc}", fill: "#a08870" },
  })
  .phase("p", { duration: 3500, title: "競争", body: "" }, (p: PhaseBuilder) =>
    p.activate("cA", "cB", "cC").tween("sa", 20, 50).tween("sb", 20, 75).tween("sc", 20, 45),
  )
  .build();

// ============================================================
// parts 9: パーセントリング (readout)
// ============================================================
export const partsPercentRing = diagram("parts-percent-ring", {
  structuredData: "exclude",
  topic: "パーセントリング — 0-100% を ring 表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("v", { initial: 0 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.percentRing("ring", { source: "v", max: 100, label: "達成率" })
  .phase("p", { duration: 4000, title: "輪が回る", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 0, 100),
  )
  .build();

// ============================================================
// parts 10: カウントアップ (readout)
// ============================================================
export const partsCountup = diagram("parts-countup", {
  structuredData: "exclude",
  topic: "カウントアップ — 数値 live 表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("n", { initial: 0 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.countup("cu", { source: "n", unit: " 件", label: "処理した件数", decimals: 0 })
  .phase("p", { duration: 4000, title: "カウント上昇", body: "" }, (p: PhaseBuilder) =>
    p.tween("n", 0, 15000),
  )
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
  .node("nA", {
    lane: "l1",
    stack: 0,
    kind: "dyn-rect",
    title: "step 1",
    subtitle: "{n1}%",
    w: 160,
    h: 200,
    shape: { kind: "rect", source: "{n1}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("nB", {
    lane: "l2",
    stack: 0,
    kind: "dyn-rect",
    title: "step 2",
    subtitle: "{n2}%",
    w: 160,
    h: 200,
    shape: { kind: "rect", source: "{n2}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("nC", {
    lane: "l3",
    stack: 0,
    kind: "dyn-rect",
    title: "step 3",
    subtitle: "{n3}%",
    w: 160,
    h: 200,
    shape: { kind: "rect", source: "{n3}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .edge("nA", "nB", { id: "e12", label: "→", tone: "info" })
  .edge("nB", "nC", { id: "e23", label: "→", tone: "success" })
  .phase("p", { duration: 4000, title: "流れが通る", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("nA", "nB", "nC", "e12", "e23")
      .tween("n1", 0, 100)
      .tween("n2", 0, 100)
      .tween("n3", 0, 100),
  )
  .build();

// ============================================================
// parts 12: バケット貯留 (大 wave rectangle)
// ============================================================
export const partsBucketReservoir = diagram("parts-bucket-reservoir", {
  structuredData: "exclude",
  topic: "バケット貯留 — 大 wave rectangle 容器",
})
  .lane("l", { x: 0, width: 440 })
  .state("water", { initial: 100 })
  .node("bkt", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "バケット",
    subtitle: "水位 {water}%",
    w: 420,
    h: 460,
    shape: {
      kind: "wave",
      level: "{water}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 12,
      fill: "#4e9dc4",
    },
  })
  .phase("p", { duration: 4000, title: "水位変動", body: "" }, (p: PhaseBuilder) =>
    p.activate("bkt").tween("water", 100, 30),
  )
  .build();

// ============================================================
// parts 13: スパークライン (readout、 履歴 trend)
// ============================================================
export const partsSparkline = diagram("parts-sparkline", {
  structuredData: "exclude",
  topic: "スパークライン — 数値履歴 trend",
})
  .lane("l", { x: 0, width: 400 })
  .state("v", { initial: 10 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("spk", {
    source: "v",
    history: 20,
    color: "#4e9dc4",
    label: "直近の推移",
  })
  .phase("p", { duration: 4000, title: "推移を描く", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 10, 80),
  )
  .build();

// ============================================================
// parts 14: ドーナツチャート (readout、 N segment pie)
// ============================================================
export const partsDonut = diagram("parts-donut", {
  structuredData: "exclude",
  topic: "ドーナツチャート — N segment 割合表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("seg", { initial: "[30, 25, 20, 25]" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.donut("dnt", { source: "seg", label: "4 区分の割合" })
  .phase("p", { duration: 3000, title: "分配表示", body: "" }, (p: PhaseBuilder) =>
    p.set("seg", "[30, 25, 20, 25]"),
  )
  .build();

// ============================================================
// parts 15: レーダー図 (readout、 複数の軸で偏りを見る)
// ============================================================
export const partsRadar = diagram("parts-radar", {
  structuredData: "exclude",
  topic: "レーダー図 — 複数の軸で強みの偏りを見る",
})
  .lane("l", { x: 0, width: 320 })
  .state("dims", { initial: "[3, 3, 3, 3, 3]" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.radar("rdr", { source: "dims", max: 10, color: "#4e9dc4", label: "5 つの軸の強み" })
  .phase("p", { duration: 3000, title: "釣り合いを見せる", body: "" }, (p: PhaseBuilder) =>
    p.set("dims", "[8, 3, 5, 2, 7]"),
  )
  .build();

// ============================================================
// parts 16: ステップ進捗 (readout、 wizard step)
// ============================================================
export const partsStepProgress = diagram("parts-step-progress", {
  structuredData: "exclude",
  topic: "ステップ進捗 — 番号付き wizard step",
})
  .lane("l", { x: 0, width: 500 })
  .state("cur", { initial: 1 })
  .state("steps", { initial: '["入力", "確認", "決済", "完了"]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.stepProgress("stp", {
    source: "cur",
    stepsSource: "steps",
    color: "#22c55e",
    label: "購入の 4 段階",
  })
  .phase("p", { duration: 3000, title: "段取りを見せる", body: "" }, (p: PhaseBuilder) =>
    p.set("cur", 1),
  )
  .build();

// ============================================================
// parts 17: ステータスドット (readout、 状態別色)
// ============================================================
export const partsStatusDot = diagram("parts-status-dot", {
  structuredData: "exclude",
  topic: "ステータスドット — 小 dot で状態表示",
})
  .lane("l", { x: 0, width: 300 })
  .state("st", { initial: "online" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusDot("dot", {
    source: "st",
    map: [
      { value: "online", color: "#22c55e", label: "オンライン" },
      { value: "away", color: "#f59e0b", label: "離席" },
      { value: "offline", color: "#a08870", label: "オフライン" },
    ] as const,
    label: "在席の状態",
  })
  .phase("p", { duration: 3000, title: "状態を見せる", body: "" }, (p: PhaseBuilder) =>
    p.set("st", "online"),
  )
  .build();

// ============================================================
// parts 18: 通知カード (readout、 4 kind alert)
// ============================================================
export const partsNotification = diagram("parts-notification", {
  structuredData: "exclude",
  topic: "通知カード — 4 kind (info/warn/error/success)",
})
  .lane("l", { x: 0, width: 500 })
  .state("nkind", { initial: "info" })
  .state("ntitle", { initial: "稼働状況" })
  .state("nbody", { initial: "すべて正常に動いています" })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.notification("nt", {
    kindSource: "nkind",
    titleSource: "ntitle",
    bodySource: "nbody",
    label: "お知らせ",
  })
  .phase("p", { duration: 3000, title: "通知表示", body: "" }, (p: PhaseBuilder) =>
    p.set("nkind", "info"),
  )
  .build();

// ============================================================
// parts 19: KPI カード (readout、 数値 + delta + sparkline)
// ============================================================
export const partsKpiCard = diagram("parts-kpi-card", {
  structuredData: "exclude",
  topic: "KPI カード — 数値 + delta + mini sparkline",
})
  .lane("l", { x: 0, width: 400 })
  .state("cur", { initial: 1000 })
  .state("prev", { initial: 800 })
  .state("hist", { initial: 500 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.kpiCard("kpi", {
    source: "cur",
    historySource: "hist",
    comparisonSource: "prev",
    unit: " 件",
    label: "売上件数",
  })
  .phase("p", { duration: 3500, title: "指標が上がる", body: "" }, (p: PhaseBuilder) =>
    p.tween("cur", 1000, 1500).tween("hist", 500, 1200).set("prev", 1000),
  )
  .build();

// ============================================================
// parts 20: タイムライン帯 (readout、 時系列 status band)
// ============================================================
export const partsTimelineStrip = diagram("parts-timeline-strip", {
  structuredData: "exclude",
  topic: "タイムライン帯 — 時系列 status band",
})
  .lane("l", { x: 0, width: 600 })
  .state("evt", {
    initial: '[["00:00","稼働"],["01:00","警告"],["02:00","異常"],["03:00","稼働"]]',
  })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusTimeline("stl", {
    source: "evt",
    // 状態の値は日本語で書くので、色の対応も同じ名前で渡す。 描画側の既定の対応は
    // 英語の `active` / `idle` / `error` しか知らず、日本語の値は全部灰色になる
    colorMap: [
      { status: "稼働", color: "#22c55e" },
      { status: "警告", color: "#f59e0b" },
      { status: "異常", color: "#ef4444" },
    ],
    max: 8,
    label: "4 時間の稼働状況",
  })
  .phase("p", { duration: 3000, title: "時間の並びを見せる", body: "" }, (p: PhaseBuilder) =>
    p.set("evt", '[["00:00","稼働"],["01:00","警告"],["02:00","異常"],["03:00","稼働"]]'),
  )
  .build();

// ============================================================
// parts 21: バッテリー残量 (dyn-rect + subtitle live)
// ============================================================
export const partsBatteryLevel = diagram("parts-battery-level", {
  structuredData: "exclude",
  topic: "バッテリー残量 — 縦 fill で残量 metaphor",
})
  .lane("l", { x: 0, width: 300 })
  .state("bat", { initial: 20 })
  .node("cell", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "バッテリー",
    subtitle: "{bat}%",
    w: 240,
    h: 380,
    shape: {
      kind: "rect",
      source: "{bat}",
      fillMax: 100,
      orient: "up",
      fill: "#22c55e",
      radius: 8,
    },
  })
  .phase("p", { duration: 4000, title: "充電中", body: "" }, (p: PhaseBuilder) =>
    p.activate("cell").tween("bat", 20, 95),
  )
  .build();

// ============================================================
// parts 22: 温度計 (dyn-rect vertical + 単位表示)
// ============================================================
export const partsThermometer = diagram("parts-thermometer", {
  structuredData: "exclude",
  topic: "温度計 — 縦棒温度で連続値 metaphor",
})
  .lane("l", { x: 0, width: 260 })
  .state("temp", { initial: 12 })
  .node("mercury", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "気温",
    subtitle: "{temp}°C",
    w: 220,
    h: 400,
    shape: {
      kind: "rect",
      source: "{temp}",
      fillMax: 40,
      orient: "up",
      fill: "#dc2626",
      radius: 12,
    },
  })
  .phase("p", { duration: 4500, title: "気温上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("mercury").tween("temp", 12, 32),
  )
  .build();

// ============================================================
// parts 23: 心拍波形 (readout sparkline + 単位)
// ============================================================
export const partsHeartbeat = diagram("parts-heartbeat", {
  structuredData: "exclude",
  topic: "心拍波形 — sparkline で pulse 表現",
})
  .lane("l", { x: 0, width: 500 })
  .state("bpm", { initial: 72 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("hb", { source: "bpm", history: 30, color: "#dc2626", label: "心拍の推移" })
  .readout.countup("v", { source: "bpm", unit: " 回/分", label: "現在の心拍", decimals: 0 })
  .phase("p", { duration: 4000, title: "心拍推移", body: "" }, (p: PhaseBuilder) =>
    p.tween("bpm", 72, 118),
  )
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
  .state("f1", { initial: 0 })
  .state("f2", { initial: 0 })
  .state("f3", { initial: 0 })
  .node("st1", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "★",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "circle", radius: 40, fillProgress: "{f1}", fill: "{s1}" },
  })
  .node("st2", {
    lane: "l",
    stack: 1,
    kind: "dyn-circle",
    title: "★",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "circle", radius: 40, fillProgress: "{f2}", fill: "{s2}" },
  })
  .node("st3", {
    lane: "l",
    stack: 2,
    kind: "dyn-circle",
    title: "★",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "circle", radius: 40, fillProgress: "{f3}", fill: "{s3}" },
  })
  .node("st4", {
    lane: "l",
    stack: 3,
    kind: "dyn-circle",
    title: "★",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s4}" },
  })
  .node("st5", {
    lane: "l",
    stack: 4,
    kind: "dyn-circle",
    title: "★",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "circle", radius: 40, fill: "{s5}" },
  })
  .phase("p", { duration: 3000, title: "3 つ点く", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1", "st2", "st3", "st4", "st5")
      .tween("f1", 0, 1)
      .tween("f2", 0, 1)
      .tween("f3", 0, 1),
  )
  .build();

// ============================================================
// parts 25: 対比バー (A vs B、 2 dyn-rect 横並び)
// ============================================================
export const partsComparisonBars = diagram("parts-comparison-bars", {
  structuredData: "exclude",
  topic: "対比バー — A vs B の数値比較",
})
  .lane("la", { x: 0, width: 260 })
  .lane("lb", { x: 300, width: 260 })
  .state("va", { initial: 30 })
  .state("vb", { initial: 20 })
  .node("barA", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "A",
    subtitle: "{va}",
    w: 240,
    h: 360,
    shape: { kind: "rect", source: "{va}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("barB", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "B",
    subtitle: "{vb}",
    w: 240,
    h: 360,
    shape: { kind: "rect", source: "{vb}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .phase("p", { duration: 4000, title: "対比", body: "" }, (p: PhaseBuilder) =>
    p.activate("barA", "barB").tween("va", 30, 85).tween("vb", 20, 60),
  )
  .build();

// ============================================================
// parts 26: トグルスイッチ (2 state 色 + 位置 metaphor)
// ============================================================
export const partsToggleSwitch = diagram("parts-toggle-switch", {
  structuredData: "exclude",
  topic: "トグルスイッチ — on/off 状態表示",
})
  .lane("l", { x: 0, width: 400 })
  .state("bg", { initial: "#22c55e" })
  .state("on", { initial: 0 })
  .node("track", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "ON",
    w: 320,
    h: 160,
    shape: {
      kind: "rect",
      source: "{on}",
      fillMax: 100,
      orient: "right",
      fill: "{bg}",
      radius: 80,
    },
  })
  .phase("p", { duration: 3000, title: "切から入へ", body: "" }, (p: PhaseBuilder) =>
    p.activate("track").tween("on", 0, 100),
  )
  .build();

// ============================================================
// parts 27: スピードメーター (dyn-arc で 0-180 km/h)
// ============================================================
export const partsSpeedometer = diagram("parts-speedometer", {
  structuredData: "exclude",
  topic: "スピードメーター — 円弧針で速度表示",
})
  .lane("l", { x: 0, width: 400 })
  .state("kph", { initial: 30 })
  .node("meter", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "速度",
    subtitle: "{kph} km/h",
    w: 380,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{kph}",
      sweepMax: 180,
      outerRadius: 150,
      innerRadius: 110,
      fill: "#dc2626",
    },
  })
  .phase("p", { duration: 4500, title: "加速", body: "" }, (p: PhaseBuilder) =>
    p.activate("meter").tween("kph", 30, 165),
  )
  .build();

// ============================================================
// parts 28: バッジカウント (countup + 通知強調)
// ============================================================
export const partsBadgeCount = diagram("parts-badge-count", {
  structuredData: "exclude",
  topic: "バッジカウント — 未読数の visual 強調",
})
  .lane("l", { x: 0, width: 380 })
  .state("cnt", { initial: 0 })
  .node("dot", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "受信",
    subtitle: "{cnt} 通",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 130, fill: "#dc2626" },
  })
  .phase("p", { duration: 3500, title: "受信増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot").tween("cnt", 0, 42),
  )
  .build();

// ============================================================
// parts 29: パルス指標 (rate の visual 表現)
// ============================================================
export const partsPulseIndicator = diagram("parts-pulse-indicator", {
  structuredData: "exclude",
  topic: "パルス指標 — レート visualization",
})
  .lane("l", { x: 0, width: 400 })
  .state("rate", { initial: 5 })
  .node("pulse", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "レート",
    subtitle: "{rate} req/s",
    w: 380,
    h: 380,
    shape: {
      kind: "wave",
      level: "{rate}",
      amplitude: 50,
      frequency: 3,
      waveHeight: 15,
      fill: "#8b5cf6",
    },
  })
  .phase("p", { duration: 4000, title: "毎秒の件数が増える", body: "" }, (p: PhaseBuilder) =>
    p.activate("pulse").tween("rate", 5, 85),
  )
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
  .node("gCpu", {
    lane: "la",
    stack: 0,
    kind: "dyn-arc",
    title: "CPU",
    subtitle: "{cpu}%",
    w: 200,
    h: 200,
    shape: {
      kind: "arc",
      angle: "{cpu}",
      sweepMax: 100,
      outerRadius: 80,
      innerRadius: 55,
      fill: "#4e9dc4",
    },
  })
  .node("gMem", {
    lane: "lb",
    stack: 0,
    kind: "dyn-arc",
    title: "MEM",
    subtitle: "{mem}%",
    w: 200,
    h: 200,
    shape: {
      kind: "arc",
      angle: "{mem}",
      sweepMax: 100,
      outerRadius: 80,
      innerRadius: 55,
      fill: "#22c55e",
    },
  })
  .node("gNet", {
    lane: "lc",
    stack: 0,
    kind: "dyn-arc",
    title: "NET",
    subtitle: "{net}%",
    w: 200,
    h: 200,
    shape: {
      kind: "arc",
      angle: "{net}",
      sweepMax: 100,
      outerRadius: 80,
      innerRadius: 55,
      fill: "#f59e0b",
    },
  })
  .phase("p", { duration: 4000, title: "負荷変動", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("gCpu", "gMem", "gNet")
      .tween("cpu", 20, 75)
      .tween("mem", 40, 85)
      .tween("net", 15, 60),
  )
  .build();

// ============================================================
// parts 31: デジタル時計 (countup HH:MM 表示)
// ============================================================
export const partsDigitalClock = diagram("parts-digital-clock", {
  structuredData: "exclude",
  topic: "デジタル時計 — 時分の数値 live 表示",
})
  .lane("l", { x: 0, width: 500 })
  .state("hh", { initial: 12 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.countup("hour", { source: "hh", unit: " 時", label: "現在時刻 (時)", decimals: 0 })
  .phase("p", { duration: 4000, title: "時刻更新", body: "" }, (p: PhaseBuilder) =>
    p.tween("hh", 12, 18),
  )
  .build();

// ============================================================
// parts 32: カウントダウン (dyn-arc 円弧が減少)
// ============================================================
export const partsCountdown = diagram("parts-countdown", {
  structuredData: "exclude",
  topic: "カウントダウン — 残り時間の円弧",
})
  .lane("l", { x: 0, width: 400 })
  .state("sec", { initial: 60 })
  .node("timer", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "残り",
    subtitle: "{sec} 秒",
    w: 380,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{sec}",
      sweepMax: 60,
      outerRadius: 150,
      innerRadius: 110,
      fill: "#f59e0b",
    },
  })
  .phase("p", { duration: 5000, title: "時間経過", body: "" }, (p: PhaseBuilder) =>
    p.activate("timer").tween("sec", 60, 0),
  )
  .build();

// ============================================================
// parts 33: メッセージ吹き出し (dyn-rect + subtitle)
// ============================================================
export const partsMessageBubble = diagram("parts-message-bubble", {
  structuredData: "exclude",
  topic: "メッセージ吹き出し — chat bubble",
})
  .lane("l", { x: 0, width: 500 })
  .state("pop", { initial: 0 })
  .node("bubble", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "Hi there!",
    subtitle: "10:30 AM",
    w: 460,
    h: 200,
    shape: {
      kind: "rect",
      source: "{pop}",
      fillMax: 100,
      orient: "up",
      fill: "#4e9dc4",
      radius: 24,
    },
  })
  .phase("p", { duration: 3000, title: "メッセージが届く", body: "" }, (p: PhaseBuilder) =>
    p.activate("bubble").tween("pop", 0, 100),
  )
  .build();

// ============================================================
// parts 34: ユーザーアバター (大 dyn-circle)
// ============================================================
export const partsUserAvatar = diagram("parts-user-avatar", {
  structuredData: "exclude",
  topic: "ユーザーアバター — 大円で user icon",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#4e9dc4" })
  .state("r", { initial: 40 })
  .node("avatar", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "JD",
    subtitle: "John Doe",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: "{r}", fill: "{bg}" },
  })
  .phase("p", { duration: 3000, title: "人物の絵が現れる", body: "" }, (p: PhaseBuilder) =>
    p.activate("avatar").tween("r", 40, 150),
  )
  .build();

// ============================================================
// parts 35: 料金カード (KPI card variant with unit)
// ============================================================
export const partsPriceCard = diagram("parts-price-card", {
  structuredData: "exclude",
  topic: "料金カード — 価格 + 単位",
})
  .lane("l", { x: 0, width: 500 })
  .state("price", { initial: 980 })
  .state("prev", { initial: 1200 })
  .state("hist", { initial: 1200 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.kpiCard("pc", {
    source: "price",
    historySource: "hist",
    comparisonSource: "prev",
    unit: " 円/月",
    label: "基本プラン",
  })
  .phase("p", { duration: 3500, title: "料金表示", body: "" }, (p: PhaseBuilder) =>
    p.tween("hist", 1200, 980).set("prev", 1200),
  )
  .build();

// ============================================================
// parts 36: ディスク使用率 (arc + %)
// ============================================================
export const partsDiskUsage = diagram("parts-disk-usage", {
  structuredData: "exclude",
  topic: "ディスク使用率 — 使用量の弧",
})
  .lane("l", { x: 0, width: 400 })
  .state("used", { initial: 30 })
  .node("disk", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "SSD",
    subtitle: "{used}% 使用中",
    w: 380,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{used}",
      sweepMax: 100,
      outerRadius: 150,
      innerRadius: 100,
      fill: "#8b5cf6",
    },
  })
  .phase("p", { duration: 4000, title: "使用量増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("disk").tween("used", 30, 78),
  )
  .build();

// ============================================================
// parts 37: 上下帯域 (2 dyn-rect で up/down 速度)
// ============================================================
export const partsBandwidthMeter = diagram("parts-bandwidth-meter", {
  structuredData: "exclude",
  topic: "上下帯域 — up/down 速度メーター",
})
  .lane("la", { x: 0, width: 240 })
  .lane("lb", { x: 280, width: 240 })
  .state("up", { initial: 20 })
  .state("dn", { initial: 30 })
  .node("upBar", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "UP",
    subtitle: "{up} Mbps",
    w: 220,
    h: 340,
    shape: { kind: "rect", source: "{up}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("dnBar", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "DOWN",
    subtitle: "{dn} Mbps",
    w: 220,
    h: 340,
    shape: { kind: "rect", source: "{dn}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .phase("p", { duration: 4000, title: "帯域変動", body: "" }, (p: PhaseBuilder) =>
    p.activate("upBar", "dnBar").tween("up", 20, 65).tween("dn", 30, 90),
  )
  .build();

// ============================================================
// parts 38: 天気アイコン (色付き大 circle で状態表現)
// ============================================================
export const partsWeatherIcon = diagram("parts-weather-icon", {
  structuredData: "exclude",
  topic: "天気アイコン — 天気状態を色で表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#f59e0b" })
  .state("shine", { initial: 0 })
  .node("sun", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "晴れ",
    subtitle: "☀ 24°C",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 140, fillProgress: "{shine}", fill: "{bg}" },
  })
  .phase("p", { duration: 3000, title: "日が差す", body: "" }, (p: PhaseBuilder) =>
    p.activate("sun").tween("shine", 0, 1),
  )
  .build();

// ============================================================
// parts 39: 波形 3 連 (3 sparkline 同時、 CPU/MEM/NET trend)
// ============================================================
export const partsMultiSparkline = diagram("parts-multi-sparkline", {
  structuredData: "exclude",
  topic: "波形 3 連 — 3 指標の trend 同時表示",
})
  .lane("l", { x: 0, width: 600 })
  .state("cpu", { initial: 20 })
  .state("mem", { initial: 40 })
  .state("net", { initial: 15 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.sparkline("sc", { source: "cpu", history: 30, color: "#dc2626", label: "CPU の推移" })
  .readout.sparkline("sm", { source: "mem", history: 30, color: "#22c55e", label: "メモリの推移" })
  .readout.sparkline("sn", { source: "net", history: 30, color: "#4e9dc4", label: "通信量の推移" })
  .phase("p", { duration: 4500, title: "3 指標推移", body: "" }, (p: PhaseBuilder) =>
    p.tween("cpu", 20, 78).tween("mem", 40, 65).tween("net", 15, 88),
  )
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
  .state("p1", { initial: 0 })
  .state("p2", { initial: 0 })
  .node("dot1", {
    lane: "la",
    stack: 0,
    kind: "dyn-circle",
    title: "1",
    subtitle: "受注",
    w: 140,
    h: 140,
    shape: { kind: "circle", radius: 55, fillProgress: "{p1}", fill: "{d1}" },
  })
  .node("dot2", {
    lane: "lb",
    stack: 0,
    kind: "dyn-circle",
    title: "2",
    subtitle: "処理中",
    w: 140,
    h: 140,
    shape: { kind: "circle", radius: 55, fillProgress: "{p2}", fill: "{d2}" },
  })
  .node("dot3", {
    lane: "lc",
    stack: 0,
    kind: "dyn-circle",
    title: "3",
    subtitle: "配送",
    w: 140,
    h: 140,
    shape: { kind: "circle", radius: 55, fill: "{d3}" },
  })
  .phase("p", { duration: 3000, title: "進捗が進む", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot1", "dot2", "dot3").tween("p1", 0, 1).tween("p2", 0, 1),
  )
  .build();

// ============================================================
// parts 41: 音量メーター (dyn-wave で音量 metaphor)
// ============================================================
export const partsVolumeMeter = diagram("parts-volume-meter", {
  structuredData: "exclude",
  topic: "音量メーター — 音量 metaphor",
})
  .lane("l", { x: 0, width: 400 })
  .state("vol", { initial: 30 })
  .node("volw", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "音量",
    subtitle: "{vol}",
    w: 380,
    h: 380,
    shape: {
      kind: "wave",
      level: "{vol}",
      amplitude: 80,
      frequency: 4,
      waveHeight: 20,
      fill: "#8b5cf6",
    },
  })
  .phase("p", { duration: 4500, title: "音量変化", body: "" }, (p: PhaseBuilder) =>
    p.activate("volw").tween("vol", 30, 95),
  )
  .build();

// ============================================================
// parts 42: 進捗 6 段階 (step progress 6 stage)
// ============================================================
export const partsProgressLong = diagram("parts-progress-long", {
  structuredData: "exclude",
  topic: "進捗 6 段階 — 長い wizard flow",
})
  .lane("l", { x: 0, width: 700 })
  .state("cur", { initial: 3 })
  .state("steps", { initial: '["受付", "審査", "承認", "処理", "配送", "完了"]' })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.stepProgress("stp", {
    source: "cur",
    stepsSource: "steps",
    color: "#22c55e",
    label: "申し込みの 6 段階",
  })
  .phase("p", { duration: 4000, title: "段取りが進む", body: "" }, (p: PhaseBuilder) =>
    p.tween("cur", 3, 6),
  )
  .build();

// ============================================================
// parts 43: 予算残り (dyn-rect + subtitle percent)
// ============================================================
export const partsBudgetUsage = diagram("parts-budget-usage", {
  structuredData: "exclude",
  topic: "予算消化率 — 使用量の visual",
})
  .lane("l", { x: 0, width: 500 })
  .state("used", { initial: 40 })
  .node("budget", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "予算消化",
    subtitle: "{used}% 使用",
    w: 480,
    h: 200,
    shape: {
      kind: "rect",
      source: "{used}",
      fillMax: 100,
      orient: "up",
      fill: "#dc2626",
      radius: 8,
    },
  })
  .phase("p", { duration: 4000, title: "予算消化", body: "" }, (p: PhaseBuilder) =>
    p.activate("budget").tween("used", 40, 82),
  )
  .build();

// ============================================================
// parts 44: ステータス timeline (statusTimeline readout)
// ============================================================
export const partsStatusTimelineWeek = diagram("parts-status-timeline-week", {
  structuredData: "exclude",
  topic: "週間 status timeline — 7 日分の状態帯",
})
  .lane("l", { x: 0, width: 700 })
  .state("evt", {
    initial:
      '[["月","稼働"],["火","稼働"],["水","警告"],["木","異常"],["金","警告"],["土","稼働"],["日","稼働"]]',
  })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.statusTimeline("stl", {
    source: "evt",
    // 状態の値は日本語で書くので、色の対応も同じ名前で渡す (`partsTimelineStrip` と同じ)
    colorMap: [
      { status: "稼働", color: "#22c55e" },
      { status: "警告", color: "#f59e0b" },
      { status: "異常", color: "#ef4444" },
    ],
    max: 8,
    label: "7 日間の稼働状況",
  })
  .phase("p", { duration: 3000, title: "週間表示", body: "" }, (p: PhaseBuilder) =>
    p.set(
      "evt",
      '[["月","稼働"],["火","稼働"],["水","警告"],["木","異常"],["金","警告"],["土","稼働"],["日","稼働"]]',
    ),
  )
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
  .node("tier1", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "Tier 1",
    subtitle: "S",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t1}", fillMax: 30, orient: "up", fill: "#dc2626", radius: 4 },
  })
  .node("tier2", {
    lane: "l",
    stack: 1,
    kind: "dyn-rect",
    title: "Tier 2",
    subtitle: "A",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t2}", fillMax: 30, orient: "up", fill: "#f59e0b", radius: 4 },
  })
  .node("tier3", {
    lane: "l",
    stack: 2,
    kind: "dyn-rect",
    title: "Tier 3",
    subtitle: "B",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t3}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("tier4", {
    lane: "l",
    stack: 3,
    kind: "dyn-rect",
    title: "Tier 4",
    subtitle: "C",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t4}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 4 },
  })
  .node("tier5", {
    lane: "l",
    stack: 4,
    kind: "dyn-rect",
    title: "Tier 5",
    subtitle: "D",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t5}", fillMax: 30, orient: "up", fill: "#8b5cf6", radius: 4 },
  })
  .phase("p", { duration: 4000, title: "全ての段が動く", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("tier1", "tier2", "tier3", "tier4", "tier5")
      .tween("t1", 20, 28)
      .tween("t2", 20, 28)
      .tween("t3", 20, 28)
      .tween("t4", 20, 28)
      .tween("t5", 20, 28),
  )
  .build();

// ============================================================
// parts 46: ショッピングカート (数量 subtitle live)
// ============================================================
export const partsShoppingCart = diagram("parts-shopping-cart", {
  structuredData: "exclude",
  topic: "ショッピングカート — 商品数 live",
})
  .lane("l", { x: 0, width: 400 })
  .state("cnt", { initial: 0 })
  .node("cart", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "カート",
    subtitle: "{cnt} 点",
    w: 360,
    h: 300,
    shape: { kind: "rect", source: 100, fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 16 },
  })
  .phase("p", { duration: 3500, title: "商品追加", body: "" }, (p: PhaseBuilder) =>
    p.activate("cart").tween("cnt", 0, 12),
  )
  .build();

// ============================================================
// parts 47: メール受信箱 (未読 badge)
// ============================================================
export const partsMailInbox = diagram("parts-mail-inbox", {
  structuredData: "exclude",
  topic: "メール受信箱 — 未読 badge",
})
  .lane("l", { x: 0, width: 380 })
  .state("unread", { initial: 0 })
  .node("inbox", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "受信箱",
    subtitle: "未読 {unread} 通",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 140, fill: "#dc2626" },
  })
  .phase("p", { duration: 4000, title: "受信増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("inbox").tween("unread", 0, 27),
  )
  .build();

// ============================================================
// parts 48: 位置ピン (map pin metaphor)
// ============================================================
export const partsLocationPin = diagram("parts-location-pin", {
  structuredData: "exclude",
  topic: "位置ピン — 現在位置 metaphor",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#dc2626" })
  .state("drop", { initial: 0 })
  .node("pin", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "現在地",
    subtitle: "東京駅",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 130, fillProgress: "{drop}", fill: "{bg}" },
  })
  .phase("p", { duration: 3000, title: "位置が定まる", body: "" }, (p: PhaseBuilder) =>
    p.activate("pin").tween("drop", 0, 1),
  )
  .build();

// ============================================================
// parts 49: 通知ベル (alert badge with pulse)
// ============================================================
export const partsBellNotification = diagram("parts-bell-notification", {
  structuredData: "exclude",
  topic: "通知ベル — 新着 alert",
})
  .lane("l", { x: 0, width: 400 })
  .state("alerts", { initial: 0 })
  .node("bell", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "🔔 通知",
    subtitle: "{alerts} 件",
    w: 360,
    h: 360,
    shape: { kind: "circle", radius: 140, fill: "#f59e0b" },
  })
  .phase("p", { duration: 3500, title: "通知増加", body: "" }, (p: PhaseBuilder) =>
    p.activate("bell").tween("alerts", 0, 15),
  )
  .build();

// ============================================================
// parts 50: 検索バー (horizontal rect)
// ============================================================
export const partsSearchBar = diagram("parts-search-bar", {
  structuredData: "exclude",
  topic: "検索バー — 入力域 metaphor",
})
  .lane("l", { x: 0, width: 700 })
  .state("typed", { initial: 0 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "🔍 検索",
    subtitle: "keyword を入力",
    w: 680,
    h: 140,
    shape: {
      kind: "rect",
      source: "{typed}",
      fillMax: 100,
      orient: "right",
      fill: "#f5e6b8",
      radius: 70,
    },
  })
  .phase("p", { duration: 3000, title: "入力が伸びる", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("typed", 0, 100),
  )
  .build();

// ============================================================
// parts 51: いいねボタン (like count + heart)
// ============================================================
export const partsLikeButton = diagram("parts-like-button", {
  structuredData: "exclude",
  topic: "いいねボタン — count live",
})
  .lane("l", { x: 0, width: 380 })
  .state("likes", { initial: 42 })
  .node("heart", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "♥",
    subtitle: "{likes} いいね",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 140, fill: "#dc2626" },
  })
  .phase("p", { duration: 4000, title: "いいね急増", body: "" }, (p: PhaseBuilder) =>
    p.activate("heart").tween("likes", 42, 158),
  )
  .build();

// ============================================================
// parts 52: ブックマーク (縦 fill)
// ============================================================
export const partsBookmark = diagram("parts-bookmark", {
  structuredData: "exclude",
  topic: "ブックマーク — 保存済み metaphor",
})
  .lane("l", { x: 0, width: 300 })
  .state("mark", { initial: 0 })
  .node("bm", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "🔖",
    subtitle: "保存済み",
    w: 240,
    h: 400,
    shape: {
      kind: "rect",
      source: "{mark}",
      fillMax: 100,
      orient: "down",
      fill: "#f59e0b",
      radius: 8,
    },
  })
  .phase("p", { duration: 3000, title: "しおりが挿さる", body: "" }, (p: PhaseBuilder) =>
    p.activate("bm").tween("mark", 0, 100),
  )
  .build();

// ============================================================
// parts 53: コイン残高 (currency countup)
// ============================================================
export const partsCoinBalance = diagram("parts-coin-balance", {
  structuredData: "exclude",
  topic: "コイン残高 — currency live",
})
  .lane("l", { x: 0, width: 500 })
  .state("coin", { initial: 1000 })
  .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1, visibleIf: "0" })
  .readout.countup("cb", { source: "coin", unit: " G", label: "所持ゴールド", decimals: 0 })
  .phase("p", { duration: 4000, title: "収入", body: "" }, (p: PhaseBuilder) =>
    p.tween("coin", 1000, 8500),
  )
  .build();

// ============================================================
// parts 54: 経験値バー (EXP progression)
// ============================================================
export const partsExpBar = diagram("parts-exp-bar", {
  structuredData: "exclude",
  topic: "経験値バー — XP progression",
})
  .lane("l", { x: 0, width: 700 })
  .state("xp", { initial: 20 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "EXP Lv.12",
    subtitle: "{xp}/100 to Lv.13",
    w: 680,
    h: 120,
    shape: {
      kind: "rect",
      source: "{xp}",
      fillMax: 100,
      orient: "up",
      fill: "#8b5cf6",
      radius: 60,
    },
  })
  .phase("p", { duration: 4500, title: "経験値が上がる", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("xp", 20, 95),
  )
  .build();

// ============================================================
// parts 55: 実績トロフィー (achievement)
// ============================================================
export const partsAchievement = diagram("parts-achievement", {
  structuredData: "exclude",
  topic: "実績トロフィー — achievement 解放",
})
  .lane("l", { x: 0, width: 400 })
  .state("bg", { initial: "#f59e0b" })
  .state("unlock", { initial: 0 })
  .node("trophy", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "🏆",
    subtitle: "初回達成",
    w: 380,
    h: 380,
    shape: { kind: "circle", radius: 150, fillProgress: "{unlock}", fill: "{bg}" },
  })
  .phase("p", { duration: 3000, title: "実績が解放される", body: "" }, (p: PhaseBuilder) =>
    p.activate("trophy").tween("unlock", 0, 1),
  )
  .build();

// ============================================================
// parts 56: セールタグ (割引 badge)
// ============================================================
export const partsSaleTag = diagram("parts-sale-tag", {
  structuredData: "exclude",
  topic: "セールタグ — 割引率 badge",
})
  .lane("l", { x: 0, width: 400 })
  .state("off", { initial: 30 })
  .node("tag", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "SALE",
    subtitle: "{off}% OFF",
    w: 360,
    h: 200,
    shape: { kind: "rect", source: 100, fillMax: 100, orient: "up", fill: "#dc2626", radius: 12 },
  })
  .phase("p", { duration: 4000, title: "割引拡大", body: "" }, (p: PhaseBuilder) =>
    p.activate("tag").tween("off", 30, 70),
  )
  .build();

// ============================================================
// parts 57: 再生ボタン (play triangle)
// ============================================================
export const partsPlayButton = diagram("parts-play-button", {
  structuredData: "exclude",
  topic: "再生ボタン — media play",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#22c55e" })
  .state("press", { initial: 0 })
  .node("play", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "▶",
    subtitle: "再生",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 140, fillProgress: "{press}", fill: "{bg}" },
  })
  .phase("p", { duration: 3000, title: "再生が始まる", body: "" }, (p: PhaseBuilder) =>
    p.activate("play").tween("press", 0, 1),
  )
  .build();

// ============================================================
// parts 58: クラウド同期 (sync progress arc)
// ============================================================
export const partsCloudSync = diagram("parts-cloud-sync", {
  structuredData: "exclude",
  topic: "クラウド同期 — sync 進捗",
})
  .lane("l", { x: 0, width: 400 })
  .state("sync", { initial: 15 })
  .node("cloud", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "☁ 同期",
    subtitle: "{sync}%",
    w: 380,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{sync}",
      sweepMax: 100,
      outerRadius: 150,
      innerRadius: 105,
      fill: "#4e9dc4",
    },
  })
  .phase("p", { duration: 4500, title: "同期進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("cloud").tween("sync", 15, 100),
  )
  .build();

// ============================================================
// parts 59: 目覚まし時計 (alarm circle)
// ============================================================
export const partsAlarmClock = diagram("parts-alarm-clock", {
  structuredData: "exclude",
  topic: "目覚まし時計 — alarm 表示",
})
  .lane("l", { x: 0, width: 380 })
  .state("tick", { initial: 0 })
  .node("alarm", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "⏰",
    subtitle: "07:00",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: 140, fillProgress: "{tick}", fill: "#f59e0b" },
  })
  .phase("p", { duration: 3000, title: "時刻が迫る", body: "" }, (p: PhaseBuilder) =>
    p.activate("alarm").tween("tick", 0, 1),
  )
  .build();

// ============================================================
// parts 60: Wi-Fi 信号 (5 段階 signal strength)
// ============================================================
export const partsWifiSignal = diagram("parts-wifi-signal", {
  structuredData: "exclude",
  topic: "Wi-Fi 信号 — 5 段階強度",
})
  .lane("la", { x: 0, width: 120 })
  .lane("lb", { x: 140, width: 120 })
  .lane("lc", { x: 280, width: 120 })
  .lane("ld", { x: 420, width: 120 })
  .lane("le", { x: 560, width: 120 })
  .state("s1", { initial: 0 })
  .state("s2", { initial: 0 })
  .state("s3", { initial: 0 })
  .node("b1", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 100,
    h: 100,
    shape: { kind: "rect", source: "{s1}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("b2", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 100,
    h: 160,
    shape: { kind: "rect", source: "{s2}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("b3", {
    lane: "lc",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{s3}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("b4", {
    lane: "ld",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 100,
    h: 280,
    shape: { kind: "rect", source: 0, fillMax: 100, orient: "up", fill: "#f5e6b8", radius: 4 },
  })
  .node("b5", {
    lane: "le",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "3/5 有り",
    w: 100,
    h: 340,
    shape: { kind: "rect", source: 0, fillMax: 100, orient: "up", fill: "#f5e6b8", radius: 4 },
  })
  .phase("p", { duration: 3000, title: "強度が上がる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("b1", "b2", "b3", "b4", "b5")
      .tween("s1", 0, 100)
      .tween("s2", 0, 100)
      .tween("s3", 0, 100),
  )
  .build();

// ============================================================
// Round 5 追加 = state bind pattern demo 20 個 (parts 61-80、 CAR-1646)
// ------------------------------------------------------------
// 目的 = 60 parts が state + tween を持ちつつ pattern は「1 state 単純 tween」 に偏る中、
// state bind の応用形 (multi-state relation / template chain / conditional / cascade /
// tween chain) を demo として並列可視化する。 editor drag-drop 導線と併せ、 user が
// 「state bind の書き方」 を検索的に見つけられるよう title を pattern 名で命名する。
// ============================================================

// parts 61: bind pattern = counter to circle radius (counter 0 → 100 で半径拡大)
export const partsBindCounterRadius = diagram("parts-bind-counter-radius", {
  structuredData: "exclude",
  topic: "bind: counter → 半径 — 1 state を shape.radius に直接 bind",
})
  .lane("l", { x: 0, width: 400 })
  .state("count", { initial: 30 })
  .node("circ", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "counter",
    subtitle: "半径 {count}",
    w: 380,
    h: 380,
    shape: { kind: "circle", radius: "{count}", fill: "#4e9dc4" },
  })
  .phase("p", { duration: 4000, title: "半径拡大", body: "" }, (p: PhaseBuilder) =>
    p.activate("circ").tween("count", 30, 150),
  )
  .build();

// parts 62: bind pattern = 2 state mirror (state 独立、 同じ target に反映)
export const partsBind2StateMirror = diagram("parts-bind-2state-mirror", {
  structuredData: "exclude",
  topic: "bind: 2 state mirror — 独立 state を左右 gauge に並列 bind",
})
  .lane("la", { x: 0, width: 300 })
  .lane("lb", { x: 320, width: 300 })
  .state("l", { initial: 0 })
  .state("r", { initial: 0 })
  .node("gL", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "左 gauge",
    subtitle: "{l}%",
    w: 280,
    h: 380,
    shape: { kind: "rect", source: "{l}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 8 },
  })
  .node("gR", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "右 gauge",
    subtitle: "{r}%",
    w: 280,
    h: 380,
    shape: { kind: "rect", source: "{r}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 8 },
  })
  .phase("p", { duration: 4000, title: "同期上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("gL", "gR").tween("l", 0, 90).tween("r", 0, 90),
  )
  .build();

// parts 63: bind pattern = cascade 3 states (state1 → state2 → state3 順次 tween)
export const partsBindCascade3 = diagram("parts-bind-cascade-3", {
  topic: "bind: cascade 3 states — phase 分割で state chain 順次進行",
})
  .lane("l", { x: 0, width: 400 })
  .state("s1", { initial: 0 })
  .state("s2", { initial: 0 })
  .state("s3", { initial: 0 })
  .node("a", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "step 1",
    subtitle: "{s1}%",
    w: 380,
    h: 100,
    shape: {
      kind: "rect",
      source: "{s1}",
      fillMax: 100,
      orient: "right",
      fill: "#f59e0b",
      radius: 4,
    },
  })
  .node("b", {
    lane: "l",
    stack: 1,
    kind: "dyn-rect",
    title: "step 2",
    subtitle: "{s2}%",
    w: 380,
    h: 100,
    shape: {
      kind: "rect",
      source: "{s2}",
      fillMax: 100,
      orient: "right",
      fill: "#a66a3d",
      radius: 4,
    },
  })
  .node("c", {
    lane: "l",
    stack: 2,
    kind: "dyn-rect",
    title: "step 3",
    subtitle: "{s3}%",
    w: 380,
    h: 100,
    shape: {
      kind: "rect",
      source: "{s3}",
      fillMax: 100,
      orient: "right",
      fill: "#22c55e",
      radius: 4,
    },
  })
  .phase("p1", { duration: 1500, title: "s1 進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("a", "b", "c").tween("s1", 0, 100),
  )
  .phase("p2", { duration: 1500, title: "s2 進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("a", "b", "c").tween("s2", 0, 100),
  )
  .phase("p3", { duration: 1500, title: "s3 進行", body: "" }, (p: PhaseBuilder) =>
    p.activate("a", "b", "c").tween("s3", 0, 100),
  )
  .build();

// parts 64: bind pattern = template chain (state 値を title / subtitle に埋込)
export const partsBindTemplateChain = diagram("parts-bind-template-chain", {
  structuredData: "exclude",
  topic: "bind: template chain — {state} を title と subtitle 両方に埋込",
})
  .lane("l", { x: 0, width: 400 })
  .state("rate", { initial: 42 })
  .node("card", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "成長率 {rate}%",
    subtitle: "現在 {rate}",
    w: 380,
    h: 300,
    shape: {
      kind: "rect",
      source: "{rate}",
      fillMax: 100,
      orient: "up",
      fill: "#4e9dc4",
      radius: 12,
    },
  })
  .phase("p", { duration: 4000, title: "ひな形の差し替え", body: "" }, (p: PhaseBuilder) =>
    p.activate("card").tween("rate", 42, 88),
  )
  .build();

// parts 65: bind pattern = pulse cycle (0 → 100 → 0 の 2 tween で 1 パルス)
export const partsBindPulseCycle = diagram("parts-bind-pulse-cycle", {
  structuredData: "exclude",
  topic: "bind: pulse cycle — 上下 tween chain で心拍表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("pulse", { initial: 0 })
  .node("dot", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "pulse",
    subtitle: "{pulse}",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: "{pulse}", fill: "#dc2626" },
  })
  .phase("p1", { duration: 800, title: "膨張", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot").tween("pulse", 20, 150),
  )
  .phase("p2", { duration: 800, title: "収縮", body: "" }, (p: PhaseBuilder) =>
    p.activate("dot").tween("pulse", 150, 20),
  )
  .build();

// parts 66: bind pattern = wave level 2-phase (満ちて引く 2 phase の水位変化)
export const partsBindWaveLevel2Phase = diagram("parts-bind-wave-level-2phase", {
  structuredData: "exclude",
  topic: "bind: wave level 2-phase — 水位を満ち→引きの 2 phase で bind",
})
  .lane("l", { x: 0, width: 400 })
  .state("lvl", { initial: 20 })
  .node("sea", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "海面",
    subtitle: "水位 {lvl}%",
    w: 380,
    h: 380,
    shape: {
      kind: "wave",
      level: "{lvl}",
      amplitude: 100,
      frequency: 2.2,
      waveHeight: 12,
      fill: "#4e9dc4",
    },
  })
  .phase("p1", { duration: 2200, title: "満潮", body: "" }, (p: PhaseBuilder) =>
    p.activate("sea").tween("lvl", 20, 90),
  )
  .phase("p2", { duration: 2200, title: "引き潮", body: "" }, (p: PhaseBuilder) =>
    p.activate("sea").tween("lvl", 90, 20),
  )
  .build();

// parts 67: bind pattern = 4 state independent grid (4 state → 2x2 grid tile 独立)
export const partsBindGrid4 = diagram("parts-bind-grid-4", {
  topic: "bind: 2x2 grid 4 state — lane × stack で独立 state 4 tile",
})
  .lane("la", { x: 0, width: 200 })
  .lane("lb", { x: 220, width: 200 })
  .state("q1", { initial: 20 })
  .state("q2", { initial: 40 })
  .state("q3", { initial: 60 })
  .state("q4", { initial: 80 })
  .node("t1", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "Q1",
    subtitle: "{q1}",
    w: 180,
    h: 180,
    shape: { kind: "rect", source: "{q1}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 8 },
  })
  .node("t2", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "Q2",
    subtitle: "{q2}",
    w: 180,
    h: 180,
    shape: { kind: "rect", source: "{q2}", fillMax: 100, orient: "up", fill: "#a66a3d", radius: 8 },
  })
  .node("t3", {
    lane: "la",
    stack: 1,
    kind: "dyn-rect",
    title: "Q3",
    subtitle: "{q3}",
    w: 180,
    h: 180,
    shape: { kind: "rect", source: "{q3}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 8 },
  })
  .node("t4", {
    lane: "lb",
    stack: 1,
    kind: "dyn-rect",
    title: "Q4",
    subtitle: "{q4}",
    w: 180,
    h: 180,
    shape: { kind: "rect", source: "{q4}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 8 },
  })
  .phase("p", { duration: 4000, title: "全ての枡が同時に動く", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("t1", "t2", "t3", "t4")
      .tween("q1", 20, 95)
      .tween("q2", 40, 85)
      .tween("q3", 60, 75)
      .tween("q4", 80, 65),
  )
  .build();

// parts 68: bind pattern = countdown (state 高値 → 低値、 subtitle で残数表示)
export const partsBindCountdown = diagram("parts-bind-countdown", {
  structuredData: "exclude",
  topic: "bind: countdown — state を高 → 低へ tween、 残り時間 subtitle",
})
  .lane("l", { x: 0, width: 380 })
  .state("sec", { initial: 60 })
  .node("clock", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "残り",
    subtitle: "{sec} 秒",
    w: 340,
    h: 340,
    shape: {
      kind: "arc",
      angle: "{sec}",
      sweepMax: 60,
      outerRadius: 140,
      innerRadius: 95,
      fill: "#dc2626",
    },
  })
  .phase("p", { duration: 5000, title: "残り時間が減る", body: "" }, (p: PhaseBuilder) =>
    p.activate("clock").tween("sec", 60, 0),
  )
  .build();

// parts 69: bind pattern = arc angle sweep (0 → 360 で 1 周)
export const partsBindArcSweep = diagram("parts-bind-arc-sweep", {
  structuredData: "exclude",
  topic: "bind: arc sweep — state 0 → 360 で 1 周 loading",
})
  .lane("l", { x: 0, width: 380 })
  .state("deg", { initial: 0 })
  .node("spin", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "loading",
    subtitle: "{deg}°",
    w: 340,
    h: 340,
    shape: {
      kind: "arc",
      angle: "{deg}",
      sweepMax: 360,
      outerRadius: 140,
      innerRadius: 100,
      fill: "#f59e0b",
    },
  })
  .phase("p", { duration: 3000, title: "1 周", body: "" }, (p: PhaseBuilder) =>
    p.activate("spin").tween("deg", 0, 360),
  )
  .build();

// parts 70: bind pattern = split fill (2 state で 1 rect を上下分割)
export const partsBindSplitFill = diagram("parts-bind-split-fill", {
  structuredData: "exclude",
  topic: "bind: split fill — 2 state 相補で 1 領域を上下分割",
})
  .lane("l", { x: 0, width: 400 })
  .state("up", { initial: 40 })
  .state("dn", { initial: 60 })
  .node("upBar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "上 zone",
    subtitle: "{up}%",
    w: 380,
    h: 180,
    shape: {
      kind: "rect",
      source: "{up}",
      fillMax: 100,
      orient: "down",
      fill: "#22c55e",
      radius: 4,
    },
  })
  .node("dnBar", {
    lane: "l",
    stack: 1,
    kind: "dyn-rect",
    title: "下 zone",
    subtitle: "{dn}%",
    w: 380,
    h: 180,
    shape: { kind: "rect", source: "{dn}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 4 },
  })
  .phase("p", { duration: 4000, title: "上下逆転", body: "" }, (p: PhaseBuilder) =>
    p.activate("upBar", "dnBar").tween("up", 40, 80).tween("dn", 60, 20),
  )
  .build();

// parts 71: bind pattern = 5 bar equalizer (5 state 独立 tween、 音楽 EQ 見立て)
//
// bar の幅 80 は node-visibility axis の下限 (80x40)。 これを下回ると「小さすぎて読めない node」
// として error になる (#944 で 70 → 80)。 幅を変えても bar 同士の間隔は 70 のまま = engine が
// lane 幅を node 幅 + 余白に自動拡張するため、 図全体が横に広がるだけで詰まらない。
export const partsBindEqualizer5 = diagram("parts-bind-equalizer-5", {
  structuredData: "exclude",
  topic: "bind: 5 bar equalizer — 独立 state 5 で音楽 EQ 見立て",
})
  .lane("l1", { x: 0, width: 80 })
  .lane("l2", { x: 100, width: 80 })
  .lane("l3", { x: 200, width: 80 })
  .lane("l4", { x: 300, width: 80 })
  .lane("l5", { x: 400, width: 80 })
  .state("e1", { initial: 30 })
  .state("e2", { initial: 60 })
  .state("e3", { initial: 90 })
  .state("e4", { initial: 60 })
  .state("e5", { initial: 30 })
  .node("bar1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 80,
    h: 300,
    shape: { kind: "rect", source: "{e1}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 4 },
  })
  .node("bar2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 80,
    h: 300,
    shape: { kind: "rect", source: "{e2}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("bar3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 80,
    h: 300,
    shape: { kind: "rect", source: "{e3}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 4 },
  })
  .node("bar4", {
    lane: "l4",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 80,
    h: 300,
    shape: { kind: "rect", source: "{e4}", fillMax: 100, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .node("bar5", {
    lane: "l5",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "",
    w: 80,
    h: 300,
    shape: { kind: "rect", source: "{e5}", fillMax: 100, orient: "up", fill: "#dc2626", radius: 4 },
  })
  .phase("p", { duration: 3500, title: "音の帯が揺れる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("bar1", "bar2", "bar3", "bar4", "bar5")
      .tween("e1", 30, 80)
      .tween("e2", 60, 40)
      .tween("e3", 90, 20)
      .tween("e4", 60, 70)
      .tween("e5", 30, 95),
  )
  .build();

// parts 72: bind pattern = string state (色 palette を state で切替、 fill: "{color}")
export const partsBindColorState = diagram("parts-bind-color-state", {
  structuredData: "exclude",
  topic: "bind: color state — 文字列 state で fill 直接切替",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#22c55e" })
  .node("tile", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "status",
    subtitle: "healthy",
    w: 340,
    h: 340,
    shape: { kind: "rect", source: 100, fillMax: 100, orient: "up", fill: "{bg}", radius: 12 },
  })
  .phase("p1", { duration: 1500, title: "注意", body: "" }, (p: PhaseBuilder) =>
    p.activate("tile").set("bg", "#f59e0b"),
  )
  .phase("p2", { duration: 1500, title: "危険", body: "" }, (p: PhaseBuilder) =>
    p.activate("tile").set("bg", "#dc2626"),
  )
  .phase("p3", { duration: 1500, title: "正常に戻る", body: "" }, (p: PhaseBuilder) =>
    p.activate("tile").set("bg", "#22c55e"),
  )
  .build();

// parts 73: bind pattern = level + fill color combo (2 state で level + fill 色同時 bind)
export const partsBindLevelColorCombo = diagram("parts-bind-level-color-combo", {
  structuredData: "exclude",
  topic: "bind: 水位と色を同じ波形に併用する",
})
  .lane("l", { x: 0, width: 400 })
  .state("lvl", { initial: 30 })
  .state("hue", { initial: "#4e9dc4" })
  .node("tank", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "tank",
    subtitle: "{lvl}%",
    w: 380,
    h: 380,
    shape: {
      kind: "wave",
      level: "{lvl}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 10,
      fill: "{hue}",
    },
  })
  .phase("p1", { duration: 2000, title: "水位上昇", body: "" }, (p: PhaseBuilder) =>
    p.activate("tank").tween("lvl", 30, 85),
  )
  .phase("p2", { duration: 2000, title: "警告色", body: "" }, (p: PhaseBuilder) =>
    p.activate("tank").set("hue", "#dc2626"),
  )
  .build();
export const subtitle__partsBindLevelColorCombo =
  "bind: level+color combo — 水位 state と fill 色 state を同 wave shape に併用";

// parts 74: bind pattern = 3 phase escalation (state 段階昇順、 各 phase で set)
export const partsBindEscalation3 = diagram("parts-bind-escalation-3", {
  structuredData: "exclude",
  topic: "bind: 3 段階で state を切り替える",
})
  .lane("l", { x: 0, width: 380 })
  .state("level", { initial: 1 })
  .state("bg", { initial: "#22c55e" })
  .node("badge", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "Alert Lv {level}",
    subtitle: "level: {level}",
    w: 340,
    h: 340,
    shape: { kind: "rect", source: 100, fillMax: 100, orient: "up", fill: "{bg}", radius: 8 },
  })
  .phase("p1", { duration: 1500, title: "L1 = 平常", body: "" }, (p: PhaseBuilder) =>
    p.activate("badge").set("level", 1).set("bg", "#22c55e"),
  )
  .phase("p2", { duration: 1500, title: "L2 = 注意", body: "" }, (p: PhaseBuilder) =>
    p.activate("badge").set("level", 2).set("bg", "#f59e0b"),
  )
  .phase("p3", { duration: 1500, title: "L3 = 危険", body: "" }, (p: PhaseBuilder) =>
    p.activate("badge").set("level", 3).set("bg", "#dc2626"),
  )
  .build();
// 動きの種類 (段階か連続か) は図から導いて画面に出るため、説明では言わない (#1043)
export const subtitle__partsBindEscalation3 =
  "bind: escalation 3 — 3 phase で state を段階ごとに set";

// parts 75: bind pattern = tween chain 4-hop (0→25→50→75→100 の 4 phase)
export const partsBindTweenChain4 = diagram("parts-bind-tween-chain-4", {
  structuredData: "exclude",
  topic: "bind: tween chain 4-hop — 4 phase で 25% ずつ chain tween",
})
  .lane("l", { x: 0, width: 400 })
  .state("v", { initial: 0 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "progress",
    subtitle: "{v}%",
    w: 380,
    h: 200,
    shape: {
      kind: "rect",
      source: "{v}",
      fillMax: 100,
      orient: "right",
      fill: "#4e9dc4",
      radius: 4,
    },
  })
  .phase("p1", { duration: 1000, title: "0 → 25", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("v", 0, 25),
  )
  .phase("p2", { duration: 1000, title: "25 → 50", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("v", 25, 50),
  )
  .phase("p3", { duration: 1000, title: "50 → 75", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("v", 50, 75),
  )
  .phase("p4", { duration: 1000, title: "75 → 100", body: "" }, (p: PhaseBuilder) =>
    p.activate("bar").tween("v", 75, 100),
  )
  .build();

// parts 76: bind pattern = ring counter (arc 内 counter を state で bind)
export const partsBindRingCounter = diagram("parts-bind-ring-counter", {
  structuredData: "exclude",
  topic: "bind: ring counter — arc + 中央 counter を同 state で表現",
})
  .lane("l", { x: 0, width: 400 })
  .state("k", { initial: 250 })
  .node("ring", {
    lane: "l",
    stack: 0,
    kind: "dyn-arc",
    title: "requests",
    subtitle: "{k}k / 1000k",
    w: 380,
    h: 380,
    shape: {
      kind: "arc",
      angle: "{k}",
      sweepMax: 1000,
      outerRadius: 150,
      innerRadius: 100,
      fill: "#22c55e",
    },
  })
  .phase("p", { duration: 4000, title: "1k 到達", body: "" }, (p: PhaseBuilder) =>
    p.activate("ring").tween("k", 250, 980),
  )
  .build();

// parts 77: bind pattern = 2 mode toggle (bg + label を同時 set で mode 切替)
export const partsBindModeToggle = diagram("parts-bind-mode-toggle", {
  structuredData: "exclude",
  topic: "bind: mode toggle — 2 state 同時 set で light/dark toggle",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#fcf8ee" })
  .state("txt", { initial: "light mode" })
  .node("card", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "theme",
    subtitle: "{txt}",
    w: 340,
    h: 340,
    shape: { kind: "rect", source: 100, fillMax: 100, orient: "up", fill: "{bg}", radius: 12 },
  })
  .phase("p1", { duration: 1500, title: "暗い配色へ", body: "" }, (p: PhaseBuilder) =>
    p.activate("card").set("bg", "#1a1408").set("txt", "dark mode"),
  )
  .phase("p2", { duration: 1500, title: "明るい配色へ", body: "" }, (p: PhaseBuilder) =>
    p.activate("card").set("bg", "#fcf8ee").set("txt", "light mode"),
  )
  .build();

// parts 78: bind pattern = seven-segment digit (5 state で 5 桁の counter 分解)
export const partsBind5DigitCounter = diagram("parts-bind-5-digit-counter", {
  topic: "bind: 5-digit counter — 5 state で桁ごと独立 tween",
})
  .lane("l1", { x: 0, width: 100 })
  .lane("l2", { x: 120, width: 100 })
  .lane("l3", { x: 240, width: 100 })
  .lane("l4", { x: 360, width: 100 })
  .lane("l5", { x: 480, width: 100 })
  .state("d1", { initial: 0 })
  .state("d2", { initial: 0 })
  .state("d3", { initial: 0 })
  .state("d4", { initial: 0 })
  .state("d5", { initial: 0 })
  .node("n1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-rect",
    title: "{d1}",
    subtitle: "万",
    w: 90,
    h: 200,
    shape: { kind: "rect", source: "{d1}", fillMax: 9, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .node("n2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-rect",
    title: "{d2}",
    subtitle: "千",
    w: 90,
    h: 200,
    shape: { kind: "rect", source: "{d2}", fillMax: 9, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .node("n3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-rect",
    title: "{d3}",
    subtitle: "百",
    w: 90,
    h: 200,
    shape: { kind: "rect", source: "{d3}", fillMax: 9, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .node("n4", {
    lane: "l4",
    stack: 0,
    kind: "dyn-rect",
    title: "{d4}",
    subtitle: "十",
    w: 90,
    h: 200,
    shape: { kind: "rect", source: "{d4}", fillMax: 9, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .node("n5", {
    lane: "l5",
    stack: 0,
    kind: "dyn-rect",
    title: "{d5}",
    subtitle: "一",
    w: 90,
    h: 200,
    shape: { kind: "rect", source: "{d5}", fillMax: 9, orient: "up", fill: "#a66a3d", radius: 4 },
  })
  .phase("p", { duration: 4000, title: "12345 到達", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("n1", "n2", "n3", "n4", "n5")
      .tween("d1", 0, 1)
      .tween("d2", 0, 2)
      .tween("d3", 0, 3)
      .tween("d4", 0, 4)
      .tween("d5", 0, 5),
  )
  .build();

// parts 79: bind pattern = growth+shrink combo (成長 → 縮小の反対方向 chain)
export const partsBindGrowShrink = diagram("parts-bind-grow-shrink", {
  structuredData: "exclude",
  topic: "bind: grow+shrink — 上昇 → 下降の逆向 chain (呼吸)",
})
  .lane("l", { x: 0, width: 380 })
  .state("r", { initial: 40 })
  .node("breath", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "breath",
    subtitle: "半径 {r}",
    w: 340,
    h: 340,
    shape: { kind: "circle", radius: "{r}", fill: "#4e9dc4" },
  })
  .phase("p1", { duration: 1800, title: "吸う", body: "" }, (p: PhaseBuilder) =>
    p.activate("breath").tween("r", 40, 150),
  )
  .phase("p2", { duration: 1800, title: "吐く", body: "" }, (p: PhaseBuilder) =>
    p.activate("breath").tween("r", 150, 40),
  )
  .build();

// parts 80: bind pattern = comprehensive multi-state story (7 state 5 phase 合成)
export const partsBindComprehensive = diagram("parts-bind-comprehensive", {
  topic: "bind: 総合 story — 7 state 5 phase を 3 shape に bind した完成形 demo",
})
  .lane("la", { x: 0, width: 260 })
  .lane("lb", { x: 280, width: 260 })
  .lane("lc", { x: 560, width: 260 })
  .state("cpu", { initial: 15 })
  .state("mem", { initial: 30 })
  .state("net", { initial: 5 })
  .state("cpuC", { initial: "#22c55e" })
  .state("memC", { initial: "#22c55e" })
  .state("netC", { initial: "#22c55e" })
  .state("status", { initial: "healthy" })
  .node("cpuG", {
    lane: "la",
    stack: 0,
    kind: "dyn-rect",
    title: "CPU",
    subtitle: "{cpu}% ({status})",
    w: 240,
    h: 380,
    shape: { kind: "rect", source: "{cpu}", fillMax: 100, orient: "up", fill: "{cpuC}", radius: 8 },
  })
  .node("memG", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "MEM",
    subtitle: "{mem}%",
    w: 240,
    h: 380,
    shape: { kind: "rect", source: "{mem}", fillMax: 100, orient: "up", fill: "{memC}", radius: 8 },
  })
  .node("netG", {
    lane: "lc",
    stack: 0,
    kind: "dyn-rect",
    title: "NET",
    subtitle: "{net} Mbps",
    w: 240,
    h: 380,
    shape: { kind: "rect", source: "{net}", fillMax: 100, orient: "up", fill: "{netC}", radius: 8 },
  })
  .phase("p1", { duration: 1200, title: "負荷が上がる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("cpuG", "memG", "netG")
      .tween("cpu", 15, 60)
      .tween("mem", 30, 55)
      .tween("net", 5, 40),
  )
  .phase("p2", { duration: 1200, title: "注意", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("cpuG", "memG", "netG")
      .tween("cpu", 60, 82)
      .set("cpuC", "#f59e0b")
      .set("status", "warning"),
  )
  .phase("p3", { duration: 1200, title: "危険", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("cpuG", "memG", "netG")
      .tween("cpu", 82, 95)
      .set("cpuC", "#dc2626")
      .set("memC", "#f59e0b")
      .set("status", "critical"),
  )
  .phase("p4", { duration: 1200, title: "回復開始", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("cpuG", "memG", "netG")
      .tween("cpu", 95, 40)
      .tween("mem", 55, 35)
      .set("cpuC", "#22c55e")
      .set("memC", "#22c55e")
      .set("status", "recovering"),
  )
  .phase("p5", { duration: 1200, title: "平常復帰", body: "" }, (p: PhaseBuilder) =>
    p.activate("cpuG", "memG", "netG").set("status", "healthy"),
  )
  .build();

// ============================================================
// 記法 (#1381)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **手で書かず、組み立て済みの図から機械で出した**。 80 件を手で写すと必ずずれる
// (#1376 で 30 件のずれを実際に踏んだ)。
//
// 出した記法は `textDslToDiagram` と `jsonToDiagram` の両方に通して、元の図と骨格が
// 一致することを確かめてから貼っている。 以降は一致検査
// (`lib/catalog-source-parity.test.tsx`) が骨格まで突き合わせる。
//
// 出す経路は repo に残していない。 1 度きりの生成で、残すべき成果物は記法そのものだから。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__partsWaveGauge = `title: "波打つ矩形ゲージ — 液面 metaphor"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  lv: 0

actors:
  - 波打つ矩形: { kind: dyn-wave, lane: l, stack: 0, subtitle: "水位 {lv}%", posW: 380, posH: 400, shape: { kind: wave, level: "{lv}", amplitude: 100, frequency: 2.5, waveHeight: 10, fill: "#4e9dc4" } }

animation:
  - step: "水位上昇" 4s
    focus: ["波打つ矩形"]
    tween:
      lv: 0 -> 90
`;

export const sourceJson__partsWaveGauge = `{
  "title": "波打つ矩形ゲージ — 液面 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "波打つ矩形",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "水位 {lv}%",
      "posW": 380,
      "posH": 400,
      "shape": {
        "kind": "wave",
        "level": "{lv}",
        "amplitude": 100,
        "frequency": 2.5,
        "waveHeight": 10,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [],
  "states": { "lv": 0 },
  "animation": [
    {
      "step": "水位上昇",
      "duration": 4,
      "focus": ["波打つ矩形"],
      "tween": { "lv": [0, 90] }
    }
  ]
}`;

export const sourceYaml__partsStackedLayer = `title: "縦積み層バー — 合計値の内訳"
type: flow

lanes:
  l: { x: 0, width: 320 }

states:
  top: 20
  mid: 15
  bot: 40

actors:
  - 上層: { kind: dyn-rect, lane: l, stack: 0, subtitle: "+{top}", posW: 300, posH: 120, shape: { kind: rect, source: "{top}", fillMax: 60, orient: up, fill: "#a08870", radius: 4 } }
  - 中層: { kind: dyn-rect, lane: l, stack: 1, subtitle: "+{mid}", posW: 300, posH: 120, shape: { kind: rect, source: "{mid}", fillMax: 60, orient: up, fill: "#22c55e", radius: 4 } }
  - 底層: { kind: dyn-rect, lane: l, stack: 2, subtitle: "{bot}", posW: 300, posH: 180, shape: { kind: rect, source: "{bot}", fillMax: 100, orient: up, fill: "#dc2626", radius: 4 } }

animation:
  - step: "層拡大" 4s
    focus: ["上層", "中層", "底層"]
    tween:
      bot: 40 -> 90
      mid: 15 -> 35
      top: 20 -> 45
`;

export const sourceJson__partsStackedLayer = `{
  "title": "縦積み層バー — 合計値の内訳",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 320 }
  },
  "actors": [
    {
      "name": "上層",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "+{top}",
      "posW": 300,
      "posH": 120,
      "shape": {
        "kind": "rect",
        "source": "{top}",
        "fillMax": 60,
        "orient": "up",
        "fill": "#a08870",
        "radius": 4
      }
    },
    {
      "name": "中層",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 1,
      "subtitle": "+{mid}",
      "posW": 300,
      "posH": 120,
      "shape": {
        "kind": "rect",
        "source": "{mid}",
        "fillMax": 60,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      }
    },
    {
      "name": "底層",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 2,
      "subtitle": "{bot}",
      "posW": 300,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{bot}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "top": 20, "mid": 15, "bot": 40 },
  "animation": [
    {
      "step": "層拡大",
      "duration": 4,
      "focus": ["上層", "中層", "底層"],
      "tween": { "bot": [40, 90], "mid": [15, 35], "top": [20, 45] }
    }
  ]
}`;

export const sourceYaml__partsStateIndicator = `title: "状態インジケーター — 単一大 shape の色で状態表現"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  stFill: "#22c55e"
  lvl: 0

actors:
  - 現在の状態: { kind: dyn-circle, lane: l, stack: 0, subtitle: "active", posW: 360, posH: 380, shape: { kind: circle, radius: 140, fillProgress: "{lvl}", fill: "{stFill}" } }

animation:
  - step: "状態が立ち上がる" 3s
    focus: ["現在の状態"]
    tween:
      lvl: 0 -> 1
`;

export const sourceJson__partsStateIndicator = `{
  "title": "状態インジケーター — 単一大 shape の色で状態表現",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "現在の状態",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "active",
      "posW": 360,
      "posH": 380,
      "shape": { "kind": "circle", "radius": 140, "fillProgress": "{lvl}", "fill": "{stFill}" }
    }
  ],
  "flow": [],
  "states": { "stFill": "#22c55e", "lvl": 0 },
  "animation": [
    {
      "step": "状態が立ち上がる",
      "duration": 3,
      "focus": ["現在の状態"],
      "tween": { "lvl": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsHorizontalBar = `title: "横進捗バー — 左→右に fill"
type: flow

lanes:
  l: { x: 0, width: 600 }

states:
  pv: 0

actors:
  - 進捗バー: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{pv}%", posW: 580, posH: 100, shape: { kind: rect, source: "{pv}", fillMax: 100, orient: right, fill: "#22c55e", radius: 6 } }

animation:
  - step: "満ちていく" 4s
    focus: ["進捗バー"]
    tween:
      pv: 0 -> 100
`;

export const sourceJson__partsHorizontalBar = `{
  "title": "横進捗バー — 左→右に fill",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 600 }
  },
  "actors": [
    {
      "name": "進捗バー",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{pv}%",
      "posW": 580,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{pv}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [],
  "states": { "pv": 0 },
  "animation": [
    {
      "step": "満ちていく",
      "duration": 4,
      "focus": ["進捗バー"],
      "tween": { "pv": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsArcGauge = `title: "アークゲージ — 円弧で 0-100% 表現"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  v: 0

actors:
  - アークゲージ: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{v}%", posW: 360, posH: 380, shape: { kind: arc, angle: "{v}", sweepMax: 100, outerRadius: 140, innerRadius: 100, fill: "#4e9dc4" } }

animation:
  - step: "弧が伸びる" 4s
    focus: ["アークゲージ"]
    tween:
      v: 0 -> 95
`;

export const sourceJson__partsArcGauge = `{
  "title": "アークゲージ — 円弧で 0-100% 表現",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "アークゲージ",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{v}%",
      "posW": 360,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{v}",
        "sweepMax": 100,
        "outerRadius": 140,
        "innerRadius": 100,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "弧が伸びる",
      "duration": 4,
      "focus": ["アークゲージ"],
      "tween": { "v": [0, 95] }
    }
  ]
}`;

export const sourceYaml__partsCounterActor = `title: "カウンタ表示 — 数値 live"
type: flow

lanes:
  l: { x: 0, width: 320 }

states:
  n: 0

actors:
  - カウント: { kind: actor, lane: l, stack: 0, subtitle: "{n} 件", posW: 300, posH: 200 }

animation:
  - step: "カウント上昇" 3.5s
    focus: ["カウント"]
    tween:
      n: 0 -> 5000
`;

export const sourceJson__partsCounterActor = `{
  "title": "カウンタ表示 — 数値 live",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 320 }
  },
  "actors": [
    {
      "name": "カウント",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "subtitle": "{n} 件",
      "posW": 300,
      "posH": 200
    }
  ],
  "flow": [],
  "states": { "n": 0 },
  "animation": [
    {
      "step": "カウント上昇",
      "duration": 3.5,
      "focus": ["カウント"],
      "tween": { "n": [0, 5000] }
    }
  ]
}`;

export const sourceYaml__partsTrafficLightStack = `title: "3灯シグナル — 縦積み circle で状態表示"
type: flow

lanes:
  l: { x: 0, width: 200 }

states:
  rFill: "#e5e7eb"
  yFill: "#e5e7eb"
  gFill: "#22c55e"
  gOn: 0

actors:
  - 赤: { kind: dyn-circle, lane: l, stack: 0, subtitle: "", posW: 160, posH: 160, shape: { kind: circle, radius: 60, fill: "{rFill}" } }
  - 黄: { kind: dyn-circle, lane: l, stack: 1, subtitle: "", posW: 160, posH: 160, shape: { kind: circle, radius: 60, fill: "{yFill}" } }
  - 緑: { kind: dyn-circle, lane: l, stack: 2, subtitle: "", posW: 160, posH: 160, shape: { kind: circle, radius: 60, fillProgress: "{gOn}", fill: "{gFill}" } }

animation:
  - step: "緑が点く" 3s
    focus: ["赤", "黄", "緑"]
    tween:
      gOn: 0 -> 1
`;

export const sourceJson__partsTrafficLightStack = `{
  "title": "3灯シグナル — 縦積み circle で状態表示",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 200 }
  },
  "actors": [
    {
      "name": "赤",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "",
      "posW": 160,
      "posH": 160,
      "shape": { "kind": "circle", "radius": 60, "fill": "{rFill}" }
    },
    {
      "name": "黄",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 1,
      "subtitle": "",
      "posW": 160,
      "posH": 160,
      "shape": { "kind": "circle", "radius": 60, "fill": "{yFill}" }
    },
    {
      "name": "緑",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 2,
      "subtitle": "",
      "posW": 160,
      "posH": 160,
      "shape": { "kind": "circle", "radius": 60, "fillProgress": "{gOn}", "fill": "{gFill}" }
    }
  ],
  "flow": [],
  "states": { "rFill": "#e5e7eb", "yFill": "#e5e7eb", "gFill": "#22c55e", "gOn": 0 },
  "animation": [
    {
      "step": "緑が点く",
      "duration": 3,
      "focus": ["赤", "黄", "緑"],
      "tween": { "gOn": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsCircleSizeRace = `title: "円サイズ競争 — radius で強さ比較"
type: flow

lanes:
  a: { x: 0, width: 180 }
  b: { x: 200, width: 180 }
  c: { x: 400, width: 180 }

states:
  sa: 20
  sb: 20
  sc: 20

actors:
  - A2: { kind: dyn-circle, lane: a, stack: 0, subtitle: "score {sa}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sa}", fill: "#a08870" }, title: "A" }
  - B2: { kind: dyn-circle, lane: b, stack: 0, subtitle: "score {sb}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sb}", fill: "#22c55e" }, title: "B" }
  - C2: { kind: dyn-circle, lane: c, stack: 0, subtitle: "score {sc}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sc}", fill: "#a08870" }, title: "C" }

animation:
  - step: "競争" 3.5s
    focus: ["A2", "B2", "C2"]
    tween:
      sa: 20 -> 50
      sb: 20 -> 75
      sc: 20 -> 45
`;

export const sourceJson__partsCircleSizeRace = `{
  "title": "円サイズ競争 — radius で強さ比較",
  "type": "flow",
  "lanes": {
    "a": { "x": 0, "width": 180 },
    "b": { "x": 200, "width": 180 },
    "c": { "x": 400, "width": 180 }
  },
  "actors": [
    {
      "name": "A2",
      "kind": "dyn-circle",
      "lane": "a",
      "stack": 0,
      "subtitle": "score {sa}",
      "posW": 160,
      "posH": 200,
      "shape": { "kind": "circle", "radius": "{sa}", "fill": "#a08870" },
      "title": "A"
    },
    {
      "name": "B2",
      "kind": "dyn-circle",
      "lane": "b",
      "stack": 0,
      "subtitle": "score {sb}",
      "posW": 160,
      "posH": 200,
      "shape": { "kind": "circle", "radius": "{sb}", "fill": "#22c55e" },
      "title": "B"
    },
    {
      "name": "C2",
      "kind": "dyn-circle",
      "lane": "c",
      "stack": 0,
      "subtitle": "score {sc}",
      "posW": 160,
      "posH": 200,
      "shape": { "kind": "circle", "radius": "{sc}", "fill": "#a08870" },
      "title": "C"
    }
  ],
  "flow": [],
  "states": { "sa": 20, "sb": 20, "sc": 20 },
  "animation": [
    {
      "step": "競争",
      "duration": 3.5,
      "focus": ["A2", "B2", "C2"],
      "tween": { "sa": [20, 50], "sb": [20, 75], "sc": [20, 45] }
    }
  ]
}`;

export const sourceYaml__partsPercentRing = `title: "パーセントリング — 0-100% を ring 表示"
type: flow

readouts:
  ring: { kind: percent-ring, source: "v", max: 100, label: "達成率" }

lanes:
  l: { x: 0, width: 300 }

states:
  v: 0

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "輪が回る" 4s
    tween:
      v: 0 -> 100
`;

export const sourceJson__partsPercentRing = `{
  "title": "パーセントリング — 0-100% を ring 表示",
  "type": "flow",
  "readouts": [
    { "id": "ring", "kind": "percent-ring", "source": "v", "max": 100, "label": "達成率" }
  ],
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "輪が回る",
      "duration": 4,
      "tween": { "v": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsCountup = `title: "カウントアップ — 数値 live 表示"
type: flow

readouts:
  cu: { kind: countup, source: "n", decimals: 0, unit: " 件", label: "処理した件数" }

lanes:
  l: { x: 0, width: 300 }

states:
  n: 0

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "カウント上昇" 4s
    tween:
      n: 0 -> 15000
`;

export const sourceJson__partsCountup = `{
  "title": "カウントアップ — 数値 live 表示",
  "type": "flow",
  "readouts": [
    {
      "id": "cu",
      "kind": "countup",
      "source": "n",
      "decimals": 0,
      "unit": " 件",
      "label": "処理した件数"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "n": 0 },
  "animation": [
    {
      "step": "カウント上昇",
      "duration": 4,
      "tween": { "n": [0, 15000] }
    }
  ]
}`;

export const sourceYaml__partsEdgeChain = `title: "エッジ連鎖 — 3 node 順次 activate + edge"
type: flow

lanes:
  l1: { x: 0, width: 180 }
  l2: { x: 200, width: 180 }
  l3: { x: 400, width: 180 }

states:
  n1: 0
  n2: 0
  n3: 0

actors:
  - step 1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "{n1}%", posW: 160, posH: 200, shape: { kind: rect, source: "{n1}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - step 2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "{n2}%", posW: 160, posH: 200, shape: { kind: rect, source: "{n2}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - step 3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "{n3}%", posW: 160, posH: 200, shape: { kind: rect, source: "{n3}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - step 1 -> step 2: "→" (info)
  - step 2 -> step 3: "→" (success)

animation:
  - step: "流れが通る" 4s
    focus: ["step 1", "step 2", "step 3", "step 1 -> step 2", "step 2 -> step 3"]
    tween:
      n1: 0 -> 100
      n2: 0 -> 100
      n3: 0 -> 100
`;

export const sourceJson__partsEdgeChain = `{
  "title": "エッジ連鎖 — 3 node 順次 activate + edge",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 180 },
    "l2": { "x": 200, "width": 180 },
    "l3": { "x": 400, "width": 180 }
  },
  "actors": [
    {
      "name": "step 1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "{n1}%",
      "posW": 160,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{n1}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "step 2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "{n2}%",
      "posW": 160,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{n2}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "step 3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "{n3}%",
      "posW": 160,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{n3}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "step 1", "to": "step 2", "label": "→", "tone": "info" },
    { "from": "step 2", "to": "step 3", "label": "→", "tone": "success" }
  ],
  "states": { "n1": 0, "n2": 0, "n3": 0 },
  "animation": [
    {
      "step": "流れが通る",
      "duration": 4,
      "focus": ["step 1", "step 2", "step 3", "step 1 -> step 2", "step 2 -> step 3"],
      "tween": { "n1": [0, 100], "n2": [0, 100], "n3": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsBucketReservoir = `title: "バケット貯留 — 大 wave rectangle 容器"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  water: 100

actors:
  - バケット: { kind: dyn-wave, lane: l, stack: 0, subtitle: "水位 {water}%", posW: 420, posH: 460, shape: { kind: wave, level: "{water}", amplitude: 100, frequency: 2, waveHeight: 12, fill: "#4e9dc4" } }

animation:
  - step: "水位変動" 4s
    focus: ["バケット"]
    tween:
      water: 100 -> 30
`;

export const sourceJson__partsBucketReservoir = `{
  "title": "バケット貯留 — 大 wave rectangle 容器",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "バケット",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "水位 {water}%",
      "posW": 420,
      "posH": 460,
      "shape": {
        "kind": "wave",
        "level": "{water}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 12,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [],
  "states": { "water": 100 },
  "animation": [
    {
      "step": "水位変動",
      "duration": 4,
      "focus": ["バケット"],
      "tween": { "water": [100, 30] }
    }
  ]
}`;

export const sourceYaml__partsSparkline = `title: "スパークライン — 数値履歴 trend"
type: flow

readouts:
  spk: { kind: sparkline, source: "v", history: 20, color: "#4e9dc4", label: "直近の推移" }

lanes:
  l: { x: 0, width: 400 }

states:
  v: 10

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "推移を描く" 4s
    tween:
      v: 10 -> 80
`;

export const sourceJson__partsSparkline = `{
  "title": "スパークライン — 数値履歴 trend",
  "type": "flow",
  "readouts": [
    {
      "id": "spk",
      "kind": "sparkline",
      "source": "v",
      "history": 20,
      "color": "#4e9dc4",
      "label": "直近の推移"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "v": 10 },
  "animation": [
    {
      "step": "推移を描く",
      "duration": 4,
      "tween": { "v": [10, 80] }
    }
  ]
}`;

export const sourceYaml__partsDonut = `title: "ドーナツチャート — N segment 割合表示"
type: flow

readouts:
  dnt: { kind: donut, source: "seg", label: "4 区分の割合" }

lanes:
  l: { x: 0, width: 300 }

states:
  seg: "[30, 25, 20, 25]"

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "分配表示" 3s
    set:
      seg: "[30, 25, 20, 25]"
`;

export const sourceJson__partsDonut = `{
  "title": "ドーナツチャート — N segment 割合表示",
  "type": "flow",
  "readouts": [
    { "id": "dnt", "kind": "donut", "source": "seg", "label": "4 区分の割合" }
  ],
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "seg": "[30, 25, 20, 25]" },
  "animation": [
    {
      "step": "分配表示",
      "duration": 3,
      "set": { "seg": "[30, 25, 20, 25]" }
    }
  ]
}`;

export const sourceYaml__partsRadar = `title: "レーダー図 — 複数の軸で強みの偏りを見る"
type: flow

readouts:
  rdr: { kind: radar, source: "dims", max: 10, color: "#4e9dc4", label: "5 つの軸の強み" }

lanes:
  l: { x: 0, width: 320 }

states:
  dims: "[3, 3, 3, 3, 3]"

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "釣り合いを見せる" 3s
    set:
      dims: "[8, 3, 5, 2, 7]"
`;

export const sourceJson__partsRadar = `{
  "title": "レーダー図 — 複数の軸で強みの偏りを見る",
  "type": "flow",
  "readouts": [
    {
      "id": "rdr",
      "kind": "radar",
      "source": "dims",
      "max": 10,
      "color": "#4e9dc4",
      "label": "5 つの軸の強み"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 320 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "dims": "[3, 3, 3, 3, 3]" },
  "animation": [
    {
      "step": "釣り合いを見せる",
      "duration": 3,
      "set": { "dims": "[8, 3, 5, 2, 7]" }
    }
  ]
}`;

export const sourceYaml__partsStepProgress = `title: "ステップ進捗 — 番号付き wizard step"
type: flow

readouts:
  stp: { kind: step-progress, source: "cur", stepsSource: "steps", color: "#22c55e", label: "購入の 4 段階" }

lanes:
  l: { x: 0, width: 500 }

states:
  cur: 1
  steps: '["入力", "確認", "決済", "完了"]'

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "段取りを見せる" 3s
    set:
      cur: 1
`;

export const sourceJson__partsStepProgress = `{
  "title": "ステップ進捗 — 番号付き wizard step",
  "type": "flow",
  "readouts": [
    {
      "id": "stp",
      "kind": "step-progress",
      "source": "cur",
      "stepsSource": "steps",
      "color": "#22c55e",
      "label": "購入の 4 段階"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "cur": 1, "steps": "[\\"入力\\", \\"確認\\", \\"決済\\", \\"完了\\"]" },
  "animation": [
    {
      "step": "段取りを見せる",
      "duration": 3,
      "set": { "cur": 1 }
    }
  ]
}`;

export const sourceYaml__partsStatusDot = `title: "ステータスドット — 小 dot で状態表示"
type: flow

readouts:
  dot: { kind: status-dot, source: "st", map: [{ value: "online", color: "#22c55e", label: "オンライン" }, { value: "away", color: "#f59e0b", label: "離席" }, { value: "offline", color: "#a08870", label: "オフライン" }], label: "在席の状態" }

lanes:
  l: { x: 0, width: 300 }

states:
  st: "online"

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "状態を見せる" 3s
    set:
      st: "online"
`;

export const sourceJson__partsStatusDot = `{
  "title": "ステータスドット — 小 dot で状態表示",
  "type": "flow",
  "readouts": [
    {
      "id": "dot",
      "kind": "status-dot",
      "source": "st",
      "map": [
        { "value": "online", "color": "#22c55e", "label": "オンライン" },
        { "value": "away", "color": "#f59e0b", "label": "離席" },
        { "value": "offline", "color": "#a08870", "label": "オフライン" }
      ],
      "label": "在席の状態"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "st": "online" },
  "animation": [
    {
      "step": "状態を見せる",
      "duration": 3,
      "set": { "st": "online" }
    }
  ]
}`;

export const sourceYaml__partsNotification = `title: "通知カード — 4 kind (info/warn/error/success)"
type: flow

readouts:
  nt: { kind: notification, kindSource: "nkind", titleSource: "ntitle", bodySource: "nbody", label: "お知らせ" }

lanes:
  l: { x: 0, width: 500 }

states:
  nkind: "info"
  ntitle: "稼働状況"
  nbody: "すべて正常に動いています"

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "通知表示" 3s
    set:
      nkind: "info"
`;

export const sourceJson__partsNotification = `{
  "title": "通知カード — 4 kind (info/warn/error/success)",
  "type": "flow",
  "readouts": [
    {
      "id": "nt",
      "kind": "notification",
      "kindSource": "nkind",
      "titleSource": "ntitle",
      "bodySource": "nbody",
      "label": "お知らせ"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "nkind": "info", "ntitle": "稼働状況", "nbody": "すべて正常に動いています" },
  "animation": [
    {
      "step": "通知表示",
      "duration": 3,
      "set": { "nkind": "info" }
    }
  ]
}`;

export const sourceYaml__partsKpiCard = `title: "KPI カード — 数値 + delta + mini sparkline"
type: flow

readouts:
  kpi: { kind: kpi-card, source: "cur", historySource: "hist", comparisonSource: "prev", unit: " 件", label: "売上件数" }

lanes:
  l: { x: 0, width: 400 }

states:
  cur: 1000
  prev: 800
  hist: 500

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "指標が上がる" 3.5s
    tween:
      cur: 1000 -> 1500
      hist: 500 -> 1200
    set:
      prev: 1000
`;

export const sourceJson__partsKpiCard = `{
  "title": "KPI カード — 数値 + delta + mini sparkline",
  "type": "flow",
  "readouts": [
    {
      "id": "kpi",
      "kind": "kpi-card",
      "source": "cur",
      "historySource": "hist",
      "comparisonSource": "prev",
      "unit": " 件",
      "label": "売上件数"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "cur": 1000, "prev": 800, "hist": 500 },
  "animation": [
    {
      "step": "指標が上がる",
      "duration": 3.5,
      "tween": { "cur": [1000, 1500], "hist": [500, 1200] },
      "set": { "prev": 1000 }
    }
  ]
}`;

export const sourceYaml__partsTimelineStrip = `title: "タイムライン帯 — 時系列 status band"
type: flow

readouts:
  stl: { kind: status-timeline, source: "evt", colorMap: [{ status: "稼働", color: "#22c55e" }, { status: "警告", color: "#f59e0b" }, { status: "異常", color: "#ef4444" }], max: 8, label: "4 時間の稼働状況" }

lanes:
  l: { x: 0, width: 600 }

states:
  evt: '[["00:00","稼働"],["01:00","警告"],["02:00","異常"],["03:00","稼働"]]'

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "時間の並びを見せる" 3s
    set:
      evt: '[["00:00","稼働"],["01:00","警告"],["02:00","異常"],["03:00","稼働"]]'
`;

export const sourceJson__partsTimelineStrip = `{
  "title": "タイムライン帯 — 時系列 status band",
  "type": "flow",
  "readouts": [
    {
      "id": "stl",
      "kind": "status-timeline",
      "source": "evt",
      "colorMap": [
        { "status": "稼働", "color": "#22c55e" },
        { "status": "警告", "color": "#f59e0b" },
        { "status": "異常", "color": "#ef4444" }
      ],
      "max": 8,
      "label": "4 時間の稼働状況"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 600 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": {
    "evt": "[[\\"00:00\\",\\"稼働\\"],[\\"01:00\\",\\"警告\\"],[\\"02:00\\",\\"異常\\"],[\\"03:00\\",\\"稼働\\"]]"
  },
  "animation": [
    {
      "step": "時間の並びを見せる",
      "duration": 3,
      "set": {
        "evt": "[[\\"00:00\\",\\"稼働\\"],[\\"01:00\\",\\"警告\\"],[\\"02:00\\",\\"異常\\"],[\\"03:00\\",\\"稼働\\"]]"
      }
    }
  ]
}`;

export const sourceYaml__partsBatteryLevel = `title: "バッテリー残量 — 縦 fill で残量 metaphor"
type: flow

lanes:
  l: { x: 0, width: 300 }

states:
  bat: 20

actors:
  - バッテリー: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{bat}%", posW: 240, posH: 380, shape: { kind: rect, source: "{bat}", fillMax: 100, orient: up, fill: "#22c55e", radius: 8 } }

animation:
  - step: "充電中" 4s
    focus: ["バッテリー"]
    tween:
      bat: 20 -> 95
`;

export const sourceJson__partsBatteryLevel = `{
  "title": "バッテリー残量 — 縦 fill で残量 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "バッテリー",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{bat}%",
      "posW": 240,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{bat}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "bat": 20 },
  "animation": [
    {
      "step": "充電中",
      "duration": 4,
      "focus": ["バッテリー"],
      "tween": { "bat": [20, 95] }
    }
  ]
}`;

export const sourceYaml__partsThermometer = `title: "温度計 — 縦棒温度で連続値 metaphor"
type: flow

lanes:
  l: { x: 0, width: 260 }

states:
  temp: 12

actors:
  - 気温: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{temp}°C", posW: 220, posH: 400, shape: { kind: rect, source: "{temp}", fillMax: 40, orient: up, fill: "#dc2626", radius: 12 } }

animation:
  - step: "気温上昇" 4.5s
    focus: ["気温"]
    tween:
      temp: 12 -> 32
`;

export const sourceJson__partsThermometer = `{
  "title": "温度計 — 縦棒温度で連続値 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 260 }
  },
  "actors": [
    {
      "name": "気温",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{temp}°C",
      "posW": 220,
      "posH": 400,
      "shape": {
        "kind": "rect",
        "source": "{temp}",
        "fillMax": 40,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 12
      }
    }
  ],
  "flow": [],
  "states": { "temp": 12 },
  "animation": [
    {
      "step": "気温上昇",
      "duration": 4.5,
      "focus": ["気温"],
      "tween": { "temp": [12, 32] }
    }
  ]
}`;

export const sourceYaml__partsHeartbeat = `title: "心拍波形 — sparkline で pulse 表現"
type: flow

readouts:
  hb: { kind: sparkline, source: "bpm", history: 30, color: "#dc2626", label: "心拍の推移" }
  v: { kind: countup, source: "bpm", decimals: 0, unit: " 回/分", label: "現在の心拍" }

lanes:
  l: { x: 0, width: 500 }

states:
  bpm: 72

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "心拍推移" 4s
    tween:
      bpm: 72 -> 118
`;

export const sourceJson__partsHeartbeat = `{
  "title": "心拍波形 — sparkline で pulse 表現",
  "type": "flow",
  "readouts": [
    {
      "id": "hb",
      "kind": "sparkline",
      "source": "bpm",
      "history": 30,
      "color": "#dc2626",
      "label": "心拍の推移"
    },
    {
      "id": "v",
      "kind": "countup",
      "source": "bpm",
      "decimals": 0,
      "unit": " 回/分",
      "label": "現在の心拍"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "bpm": 72 },
  "animation": [
    {
      "step": "心拍推移",
      "duration": 4,
      "tween": { "bpm": [72, 118] }
    }
  ]
}`;

export const sourceYaml__partsRatingStars = `title: "評価スター — 5 段階中 fill 表示"
type: flow

lanes:
  l: { x: 0, width: 600 }

states:
  s1: "#f59e0b"
  s2: "#f59e0b"
  s3: "#f59e0b"
  s4: "#f5e6b8"
  s5: "#f5e6b8"
  f1: 0
  f2: 0
  f3: 0

actors:
  - ★: { kind: dyn-circle, lane: l, stack: 0, subtitle: "", posW: 100, posH: 100, shape: { kind: circle, radius: 40, fillProgress: "{f1}", fill: "{s1}" } }
  - ★2: { kind: dyn-circle, lane: l, stack: 1, subtitle: "", posW: 100, posH: 100, shape: { kind: circle, radius: 40, fillProgress: "{f2}", fill: "{s2}" }, title: "★" }
  - ★3: { kind: dyn-circle, lane: l, stack: 2, subtitle: "", posW: 100, posH: 100, shape: { kind: circle, radius: 40, fillProgress: "{f3}", fill: "{s3}" }, title: "★" }
  - ★4: { kind: dyn-circle, lane: l, stack: 3, subtitle: "", posW: 100, posH: 100, shape: { kind: circle, radius: 40, fill: "{s4}" }, title: "★" }
  - ★5: { kind: dyn-circle, lane: l, stack: 4, subtitle: "", posW: 100, posH: 100, shape: { kind: circle, radius: 40, fill: "{s5}" }, title: "★" }

animation:
  - step: "3 つ点く" 3s
    focus: ["★", "★2", "★3", "★4", "★5"]
    tween:
      f1: 0 -> 1
      f2: 0 -> 1
      f3: 0 -> 1
`;

export const sourceJson__partsRatingStars = `{
  "title": "評価スター — 5 段階中 fill 表示",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 600 }
  },
  "actors": [
    {
      "name": "★",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": { "kind": "circle", "radius": 40, "fillProgress": "{f1}", "fill": "{s1}" }
    },
    {
      "name": "★2",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 1,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": { "kind": "circle", "radius": 40, "fillProgress": "{f2}", "fill": "{s2}" },
      "title": "★"
    },
    {
      "name": "★3",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 2,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": { "kind": "circle", "radius": 40, "fillProgress": "{f3}", "fill": "{s3}" },
      "title": "★"
    },
    {
      "name": "★4",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 3,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": { "kind": "circle", "radius": 40, "fill": "{s4}" },
      "title": "★"
    },
    {
      "name": "★5",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 4,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": { "kind": "circle", "radius": 40, "fill": "{s5}" },
      "title": "★"
    }
  ],
  "flow": [],
  "states": {
    "s1": "#f59e0b",
    "s2": "#f59e0b",
    "s3": "#f59e0b",
    "s4": "#f5e6b8",
    "s5": "#f5e6b8",
    "f1": 0,
    "f2": 0,
    "f3": 0
  },
  "animation": [
    {
      "step": "3 つ点く",
      "duration": 3,
      "focus": ["★", "★2", "★3", "★4", "★5"],
      "tween": { "f1": [0, 1], "f2": [0, 1], "f3": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsComparisonBars = `title: "対比バー — A vs B の数値比較"
type: flow

lanes:
  la: { x: 0, width: 260 }
  lb: { x: 300, width: 260 }

states:
  va: 30
  vb: 20

actors:
  - A: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{va}", posW: 240, posH: 360, shape: { kind: rect, source: "{va}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - B: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{vb}", posW: 240, posH: 360, shape: { kind: rect, source: "{vb}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 6 } }

animation:
  - step: "対比" 4s
    focus: ["A", "B"]
    tween:
      va: 30 -> 85
      vb: 20 -> 60
`;

export const sourceJson__partsComparisonBars = `{
  "title": "対比バー — A vs B の数値比較",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 260 },
    "lb": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "A",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "{va}",
      "posW": 240,
      "posH": 360,
      "shape": {
        "kind": "rect",
        "source": "{va}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "B",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{vb}",
      "posW": 240,
      "posH": 360,
      "shape": {
        "kind": "rect",
        "source": "{vb}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    }
  ],
  "flow": [],
  "states": { "va": 30, "vb": 20 },
  "animation": [
    {
      "step": "対比",
      "duration": 4,
      "focus": ["A", "B"],
      "tween": { "va": [30, 85], "vb": [20, 60] }
    }
  ]
}`;

export const sourceYaml__partsToggleSwitch = `title: "トグルスイッチ — on/off 状態表示"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  bg: "#22c55e"
  on: 0

actors:
  - track: { kind: dyn-rect, lane: l, stack: 0, subtitle: "ON", posW: 320, posH: 160, shape: { kind: rect, source: "{on}", fillMax: 100, orient: right, fill: "{bg}", radius: 80 }, title: "" }

animation:
  - step: "切から入へ" 3s
    focus: ["track"]
    tween:
      on: 0 -> 100
`;

export const sourceJson__partsToggleSwitch = `{
  "title": "トグルスイッチ — on/off 状態表示",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "track",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "ON",
      "posW": 320,
      "posH": 160,
      "shape": {
        "kind": "rect",
        "source": "{on}",
        "fillMax": 100,
        "orient": "right",
        "fill": "{bg}",
        "radius": 80
      },
      "title": ""
    }
  ],
  "flow": [],
  "states": { "bg": "#22c55e", "on": 0 },
  "animation": [
    {
      "step": "切から入へ",
      "duration": 3,
      "focus": ["track"],
      "tween": { "on": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsSpeedometer = `title: "スピードメーター — 円弧針で速度表示"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  kph: 30

actors:
  - 速度: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{kph} km/h", posW: 380, posH: 380, shape: { kind: arc, angle: "{kph}", sweepMax: 180, outerRadius: 150, innerRadius: 110, fill: "#dc2626" } }

animation:
  - step: "加速" 4.5s
    focus: ["速度"]
    tween:
      kph: 30 -> 165
`;

export const sourceJson__partsSpeedometer = `{
  "title": "スピードメーター — 円弧針で速度表示",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "速度",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{kph} km/h",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{kph}",
        "sweepMax": 180,
        "outerRadius": 150,
        "innerRadius": 110,
        "fill": "#dc2626"
      }
    }
  ],
  "flow": [],
  "states": { "kph": 30 },
  "animation": [
    {
      "step": "加速",
      "duration": 4.5,
      "focus": ["速度"],
      "tween": { "kph": [30, 165] }
    }
  ]
}`;

export const sourceYaml__partsBadgeCount = `title: "バッジカウント — 未読数の visual 強調"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  cnt: 0

actors:
  - 受信: { kind: dyn-circle, lane: l, stack: 0, subtitle: "{cnt} 通", posW: 340, posH: 340, shape: { kind: circle, radius: 130, fill: "#dc2626" } }

animation:
  - step: "受信増加" 3.5s
    focus: ["受信"]
    tween:
      cnt: 0 -> 42
`;

export const sourceJson__partsBadgeCount = `{
  "title": "バッジカウント — 未読数の visual 強調",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "受信",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "{cnt} 通",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 130, "fill": "#dc2626" }
    }
  ],
  "flow": [],
  "states": { "cnt": 0 },
  "animation": [
    {
      "step": "受信増加",
      "duration": 3.5,
      "focus": ["受信"],
      "tween": { "cnt": [0, 42] }
    }
  ]
}`;

export const sourceYaml__partsPulseIndicator = `title: "パルス指標 — レート visualization"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  rate: 5

actors:
  - レート: { kind: dyn-wave, lane: l, stack: 0, subtitle: "{rate} req/s", posW: 380, posH: 380, shape: { kind: wave, level: "{rate}", amplitude: 50, frequency: 3, waveHeight: 15, fill: "#8b5cf6" } }

animation:
  - step: "毎秒の件数が増える" 4s
    focus: ["レート"]
    tween:
      rate: 5 -> 85
`;

export const sourceJson__partsPulseIndicator = `{
  "title": "パルス指標 — レート visualization",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "レート",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "{rate} req/s",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "wave",
        "level": "{rate}",
        "amplitude": 50,
        "frequency": 3,
        "waveHeight": 15,
        "fill": "#8b5cf6"
      }
    }
  ],
  "flow": [],
  "states": { "rate": 5 },
  "animation": [
    {
      "step": "毎秒の件数が増える",
      "duration": 4,
      "focus": ["レート"],
      "tween": { "rate": [5, 85] }
    }
  ]
}`;

export const sourceYaml__partsGaugeCluster = `title: "ゲージ 3 連 — 複数指標の同時表示"
type: flow

lanes:
  la: { x: 0, width: 220 }
  lb: { x: 260, width: 220 }
  lc: { x: 520, width: 220 }

states:
  cpu: 20
  mem: 40
  net: 15

actors:
  - CPU: { kind: dyn-arc, lane: la, stack: 0, subtitle: "{cpu}%", posW: 200, posH: 200, shape: { kind: arc, angle: "{cpu}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#4e9dc4" } }
  - MEM: { kind: dyn-arc, lane: lb, stack: 0, subtitle: "{mem}%", posW: 200, posH: 200, shape: { kind: arc, angle: "{mem}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#22c55e" } }
  - NET: { kind: dyn-arc, lane: lc, stack: 0, subtitle: "{net}%", posW: 200, posH: 200, shape: { kind: arc, angle: "{net}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#f59e0b" } }

animation:
  - step: "負荷変動" 4s
    focus: ["CPU", "MEM", "NET"]
    tween:
      cpu: 20 -> 75
      mem: 40 -> 85
      net: 15 -> 60
`;

export const sourceJson__partsGaugeCluster = `{
  "title": "ゲージ 3 連 — 複数指標の同時表示",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 220 },
    "lb": { "x": 260, "width": 220 },
    "lc": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "CPU",
      "kind": "dyn-arc",
      "lane": "la",
      "stack": 0,
      "subtitle": "{cpu}%",
      "posW": 200,
      "posH": 200,
      "shape": {
        "kind": "arc",
        "angle": "{cpu}",
        "sweepMax": 100,
        "outerRadius": 80,
        "innerRadius": 55,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "MEM",
      "kind": "dyn-arc",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{mem}%",
      "posW": 200,
      "posH": 200,
      "shape": {
        "kind": "arc",
        "angle": "{mem}",
        "sweepMax": 100,
        "outerRadius": 80,
        "innerRadius": 55,
        "fill": "#22c55e"
      }
    },
    {
      "name": "NET",
      "kind": "dyn-arc",
      "lane": "lc",
      "stack": 0,
      "subtitle": "{net}%",
      "posW": 200,
      "posH": 200,
      "shape": {
        "kind": "arc",
        "angle": "{net}",
        "sweepMax": 100,
        "outerRadius": 80,
        "innerRadius": 55,
        "fill": "#f59e0b"
      }
    }
  ],
  "flow": [],
  "states": { "cpu": 20, "mem": 40, "net": 15 },
  "animation": [
    {
      "step": "負荷変動",
      "duration": 4,
      "focus": ["CPU", "MEM", "NET"],
      "tween": { "cpu": [20, 75], "mem": [40, 85], "net": [15, 60] }
    }
  ]
}`;

export const sourceYaml__partsDigitalClock = `title: "デジタル時計 — 時分の数値 live 表示"
type: flow

readouts:
  hour: { kind: countup, source: "hh", decimals: 0, unit: " 時", label: "現在時刻 (時)" }

lanes:
  l: { x: 0, width: 500 }

states:
  hh: 12

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "時刻更新" 4s
    tween:
      hh: 12 -> 18
`;

export const sourceJson__partsDigitalClock = `{
  "title": "デジタル時計 — 時分の数値 live 表示",
  "type": "flow",
  "readouts": [
    {
      "id": "hour",
      "kind": "countup",
      "source": "hh",
      "decimals": 0,
      "unit": " 時",
      "label": "現在時刻 (時)"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "hh": 12 },
  "animation": [
    {
      "step": "時刻更新",
      "duration": 4,
      "tween": { "hh": [12, 18] }
    }
  ]
}`;

export const sourceYaml__partsCountdown = `title: "カウントダウン — 残り時間の円弧"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  sec: 60

actors:
  - 残り: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{sec} 秒", posW: 380, posH: 380, shape: { kind: arc, angle: "{sec}", sweepMax: 60, outerRadius: 150, innerRadius: 110, fill: "#f59e0b" } }

animation:
  - step: "時間経過" 5s
    focus: ["残り"]
    tween:
      sec: 60 -> 0
`;

export const sourceJson__partsCountdown = `{
  "title": "カウントダウン — 残り時間の円弧",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "残り",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{sec} 秒",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{sec}",
        "sweepMax": 60,
        "outerRadius": 150,
        "innerRadius": 110,
        "fill": "#f59e0b"
      }
    }
  ],
  "flow": [],
  "states": { "sec": 60 },
  "animation": [
    {
      "step": "時間経過",
      "duration": 5,
      "focus": ["残り"],
      "tween": { "sec": [60, 0] }
    }
  ]
}`;

export const sourceYaml__partsMessageBubble = `title: "メッセージ吹き出し — chat bubble"
type: flow

lanes:
  l: { x: 0, width: 500 }

states:
  pop: 0

actors:
  - Hi there!: { kind: dyn-rect, lane: l, stack: 0, subtitle: "10:30 AM", posW: 460, posH: 200, shape: { kind: rect, source: "{pop}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 24 } }

animation:
  - step: "メッセージが届く" 3s
    focus: ["Hi there!"]
    tween:
      pop: 0 -> 100
`;

export const sourceJson__partsMessageBubble = `{
  "title": "メッセージ吹き出し — chat bubble",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "Hi there!",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "10:30 AM",
      "posW": 460,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{pop}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 24
      }
    }
  ],
  "flow": [],
  "states": { "pop": 0 },
  "animation": [
    {
      "step": "メッセージが届く",
      "duration": 3,
      "focus": ["Hi there!"],
      "tween": { "pop": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsUserAvatar = `title: "ユーザーアバター — 大円で user icon"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#4e9dc4"
  r: 40

actors:
  - JD: { kind: dyn-circle, lane: l, stack: 0, subtitle: "John Doe", posW: 340, posH: 340, shape: { kind: circle, radius: "{r}", fill: "{bg}" } }

animation:
  - step: "人物の絵が現れる" 3s
    focus: ["JD"]
    tween:
      r: 40 -> 150
`;

export const sourceJson__partsUserAvatar = `{
  "title": "ユーザーアバター — 大円で user icon",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "JD",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "John Doe",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": "{r}", "fill": "{bg}" }
    }
  ],
  "flow": [],
  "states": { "bg": "#4e9dc4", "r": 40 },
  "animation": [
    {
      "step": "人物の絵が現れる",
      "duration": 3,
      "focus": ["JD"],
      "tween": { "r": [40, 150] }
    }
  ]
}`;

export const sourceYaml__partsPriceCard = `title: "料金カード — 価格 + 単位"
type: flow

readouts:
  pc: { kind: kpi-card, source: "price", historySource: "hist", comparisonSource: "prev", unit: " 円/月", label: "基本プラン" }

lanes:
  l: { x: 0, width: 500 }

states:
  price: 980
  prev: 1200
  hist: 1200

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "料金表示" 3.5s
    tween:
      hist: 1200 -> 980
    set:
      prev: 1200
`;

export const sourceJson__partsPriceCard = `{
  "title": "料金カード — 価格 + 単位",
  "type": "flow",
  "readouts": [
    {
      "id": "pc",
      "kind": "kpi-card",
      "source": "price",
      "historySource": "hist",
      "comparisonSource": "prev",
      "unit": " 円/月",
      "label": "基本プラン"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "price": 980, "prev": 1200, "hist": 1200 },
  "animation": [
    {
      "step": "料金表示",
      "duration": 3.5,
      "tween": { "hist": [1200, 980] },
      "set": { "prev": 1200 }
    }
  ]
}`;

export const sourceYaml__partsDiskUsage = `title: "ディスク使用率 — 使用量の弧"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  used: 30

actors:
  - SSD: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{used}% 使用中", posW: 380, posH: 380, shape: { kind: arc, angle: "{used}", sweepMax: 100, outerRadius: 150, innerRadius: 100, fill: "#8b5cf6" } }

animation:
  - step: "使用量増加" 4s
    focus: ["SSD"]
    tween:
      used: 30 -> 78
`;

export const sourceJson__partsDiskUsage = `{
  "title": "ディスク使用率 — 使用量の弧",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "SSD",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{used}% 使用中",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{used}",
        "sweepMax": 100,
        "outerRadius": 150,
        "innerRadius": 100,
        "fill": "#8b5cf6"
      }
    }
  ],
  "flow": [],
  "states": { "used": 30 },
  "animation": [
    {
      "step": "使用量増加",
      "duration": 4,
      "focus": ["SSD"],
      "tween": { "used": [30, 78] }
    }
  ]
}`;

export const sourceYaml__partsBandwidthMeter = `title: "上下帯域 — up/down 速度メーター"
type: flow

lanes:
  la: { x: 0, width: 240 }
  lb: { x: 280, width: 240 }

states:
  up: 20
  dn: 30

actors:
  - UP: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{up} Mbps", posW: 220, posH: 340, shape: { kind: rect, source: "{up}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }
  - DOWN: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{dn} Mbps", posW: 220, posH: 340, shape: { kind: rect, source: "{dn}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }

animation:
  - step: "帯域変動" 4s
    focus: ["UP", "DOWN"]
    tween:
      up: 20 -> 65
      dn: 30 -> 90
`;

export const sourceJson__partsBandwidthMeter = `{
  "title": "上下帯域 — up/down 速度メーター",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 240 },
    "lb": { "x": 280, "width": 240 }
  },
  "actors": [
    {
      "name": "UP",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "{up} Mbps",
      "posW": 220,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": "{up}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "DOWN",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{dn} Mbps",
      "posW": 220,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": "{dn}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    }
  ],
  "flow": [],
  "states": { "up": 20, "dn": 30 },
  "animation": [
    {
      "step": "帯域変動",
      "duration": 4,
      "focus": ["UP", "DOWN"],
      "tween": { "up": [20, 65], "dn": [30, 90] }
    }
  ]
}`;

export const sourceYaml__partsWeatherIcon = `title: "天気アイコン — 天気状態を色で表現"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#f59e0b"
  shine: 0

actors:
  - 晴れ: { kind: dyn-circle, lane: l, stack: 0, subtitle: "☀ 24°C", posW: 340, posH: 340, shape: { kind: circle, radius: 140, fillProgress: "{shine}", fill: "{bg}" } }

animation:
  - step: "日が差す" 3s
    focus: ["晴れ"]
    tween:
      shine: 0 -> 1
`;

export const sourceJson__partsWeatherIcon = `{
  "title": "天気アイコン — 天気状態を色で表現",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "晴れ",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "☀ 24°C",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 140, "fillProgress": "{shine}", "fill": "{bg}" }
    }
  ],
  "flow": [],
  "states": { "bg": "#f59e0b", "shine": 0 },
  "animation": [
    {
      "step": "日が差す",
      "duration": 3,
      "focus": ["晴れ"],
      "tween": { "shine": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsMultiSparkline = `title: "波形 3 連 — 3 指標の trend 同時表示"
type: flow

readouts:
  sc: { kind: sparkline, source: "cpu", history: 30, color: "#dc2626", label: "CPU の推移" }
  sm: { kind: sparkline, source: "mem", history: 30, color: "#22c55e", label: "メモリの推移" }
  sn: { kind: sparkline, source: "net", history: 30, color: "#4e9dc4", label: "通信量の推移" }

lanes:
  l: { x: 0, width: 600 }

states:
  cpu: 20
  mem: 40
  net: 15

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "3 指標推移" 4.5s
    tween:
      cpu: 20 -> 78
      mem: 40 -> 65
      net: 15 -> 88
`;

export const sourceJson__partsMultiSparkline = `{
  "title": "波形 3 連 — 3 指標の trend 同時表示",
  "type": "flow",
  "readouts": [
    {
      "id": "sc",
      "kind": "sparkline",
      "source": "cpu",
      "history": 30,
      "color": "#dc2626",
      "label": "CPU の推移"
    },
    {
      "id": "sm",
      "kind": "sparkline",
      "source": "mem",
      "history": 30,
      "color": "#22c55e",
      "label": "メモリの推移"
    },
    {
      "id": "sn",
      "kind": "sparkline",
      "source": "net",
      "history": 30,
      "color": "#4e9dc4",
      "label": "通信量の推移"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 600 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "cpu": 20, "mem": 40, "net": 15 },
  "animation": [
    {
      "step": "3 指標推移",
      "duration": 4.5,
      "tween": { "cpu": [20, 78], "mem": [40, 65], "net": [15, 88] }
    }
  ]
}`;

export const sourceYaml__partsProgressDots = `title: "進捗ドット — 3 段階完了表示"
type: flow

lanes:
  la: { x: 0, width: 160 }
  lb: { x: 200, width: 160 }
  lc: { x: 400, width: 160 }

states:
  d1: "#22c55e"
  d2: "#22c55e"
  d3: "#f5e6b8"
  p1: 0
  p2: 0

actors:
  - 1: { kind: dyn-circle, lane: la, stack: 0, subtitle: "受注", posW: 140, posH: 140, shape: { kind: circle, radius: 55, fillProgress: "{p1}", fill: "{d1}" } }
  - 2: { kind: dyn-circle, lane: lb, stack: 0, subtitle: "処理中", posW: 140, posH: 140, shape: { kind: circle, radius: 55, fillProgress: "{p2}", fill: "{d2}" } }
  - 3: { kind: dyn-circle, lane: lc, stack: 0, subtitle: "配送", posW: 140, posH: 140, shape: { kind: circle, radius: 55, fill: "{d3}" } }

animation:
  - step: "進捗が進む" 3s
    focus: ["1", "2", "3"]
    tween:
      p1: 0 -> 1
      p2: 0 -> 1
`;

export const sourceJson__partsProgressDots = `{
  "title": "進捗ドット — 3 段階完了表示",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 160 },
    "lb": { "x": 200, "width": 160 },
    "lc": { "x": 400, "width": 160 }
  },
  "actors": [
    {
      "name": "1",
      "kind": "dyn-circle",
      "lane": "la",
      "stack": 0,
      "subtitle": "受注",
      "posW": 140,
      "posH": 140,
      "shape": { "kind": "circle", "radius": 55, "fillProgress": "{p1}", "fill": "{d1}" }
    },
    {
      "name": "2",
      "kind": "dyn-circle",
      "lane": "lb",
      "stack": 0,
      "subtitle": "処理中",
      "posW": 140,
      "posH": 140,
      "shape": { "kind": "circle", "radius": 55, "fillProgress": "{p2}", "fill": "{d2}" }
    },
    {
      "name": "3",
      "kind": "dyn-circle",
      "lane": "lc",
      "stack": 0,
      "subtitle": "配送",
      "posW": 140,
      "posH": 140,
      "shape": { "kind": "circle", "radius": 55, "fill": "{d3}" }
    }
  ],
  "flow": [],
  "states": { "d1": "#22c55e", "d2": "#22c55e", "d3": "#f5e6b8", "p1": 0, "p2": 0 },
  "animation": [
    {
      "step": "進捗が進む",
      "duration": 3,
      "focus": ["1", "2", "3"],
      "tween": { "p1": [0, 1], "p2": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsVolumeMeter = `title: "音量メーター — 音量 metaphor"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  vol: 30

actors:
  - 音量: { kind: dyn-wave, lane: l, stack: 0, subtitle: "{vol}", posW: 380, posH: 380, shape: { kind: wave, level: "{vol}", amplitude: 80, frequency: 4, waveHeight: 20, fill: "#8b5cf6" } }

animation:
  - step: "音量変化" 4.5s
    focus: ["音量"]
    tween:
      vol: 30 -> 95
`;

export const sourceJson__partsVolumeMeter = `{
  "title": "音量メーター — 音量 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "音量",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "{vol}",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "wave",
        "level": "{vol}",
        "amplitude": 80,
        "frequency": 4,
        "waveHeight": 20,
        "fill": "#8b5cf6"
      }
    }
  ],
  "flow": [],
  "states": { "vol": 30 },
  "animation": [
    {
      "step": "音量変化",
      "duration": 4.5,
      "focus": ["音量"],
      "tween": { "vol": [30, 95] }
    }
  ]
}`;

export const sourceYaml__partsProgressLong = `title: "進捗 6 段階 — 長い wizard flow"
type: flow

readouts:
  stp: { kind: step-progress, source: "cur", stepsSource: "steps", color: "#22c55e", label: "申し込みの 6 段階" }

lanes:
  l: { x: 0, width: 700 }

states:
  cur: 3
  steps: '["受付", "審査", "承認", "処理", "配送", "完了"]'

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "段取りが進む" 4s
    tween:
      cur: 3 -> 6
`;

export const sourceJson__partsProgressLong = `{
  "title": "進捗 6 段階 — 長い wizard flow",
  "type": "flow",
  "readouts": [
    {
      "id": "stp",
      "kind": "step-progress",
      "source": "cur",
      "stepsSource": "steps",
      "color": "#22c55e",
      "label": "申し込みの 6 段階"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 700 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "cur": 3, "steps": "[\\"受付\\", \\"審査\\", \\"承認\\", \\"処理\\", \\"配送\\", \\"完了\\"]" },
  "animation": [
    {
      "step": "段取りが進む",
      "duration": 4,
      "tween": { "cur": [3, 6] }
    }
  ]
}`;

export const sourceYaml__partsBudgetUsage = `title: "予算消化率 — 使用量の visual"
type: flow

lanes:
  l: { x: 0, width: 500 }

states:
  used: 40

actors:
  - 予算消化: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{used}% 使用", posW: 480, posH: 200, shape: { kind: rect, source: "{used}", fillMax: 100, orient: up, fill: "#dc2626", radius: 8 } }

animation:
  - step: "予算消化" 4s
    focus: ["予算消化"]
    tween:
      used: 40 -> 82
`;

export const sourceJson__partsBudgetUsage = `{
  "title": "予算消化率 — 使用量の visual",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "予算消化",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{used}% 使用",
      "posW": 480,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{used}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "used": 40 },
  "animation": [
    {
      "step": "予算消化",
      "duration": 4,
      "focus": ["予算消化"],
      "tween": { "used": [40, 82] }
    }
  ]
}`;

export const sourceYaml__partsStatusTimelineWeek = `title: "週間 status timeline — 7 日分の状態帯"
type: flow

readouts:
  stl: { kind: status-timeline, source: "evt", colorMap: [{ status: "稼働", color: "#22c55e" }, { status: "警告", color: "#f59e0b" }, { status: "異常", color: "#ef4444" }], max: 8, label: "7 日間の稼働状況" }

lanes:
  l: { x: 0, width: 700 }

states:
  evt: '[["月","稼働"],["火","稼働"],["水","警告"],["木","異常"],["金","警告"],["土","稼働"],["日","稼働"]]'

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "週間表示" 3s
    set:
      evt: '[["月","稼働"],["火","稼働"],["水","警告"],["木","異常"],["金","警告"],["土","稼働"],["日","稼働"]]'
`;

export const sourceJson__partsStatusTimelineWeek = `{
  "title": "週間 status timeline — 7 日分の状態帯",
  "type": "flow",
  "readouts": [
    {
      "id": "stl",
      "kind": "status-timeline",
      "source": "evt",
      "colorMap": [
        { "status": "稼働", "color": "#22c55e" },
        { "status": "警告", "color": "#f59e0b" },
        { "status": "異常", "color": "#ef4444" }
      ],
      "max": 8,
      "label": "7 日間の稼働状況"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 700 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": {
    "evt": "[[\\"月\\",\\"稼働\\"],[\\"火\\",\\"稼働\\"],[\\"水\\",\\"警告\\"],[\\"木\\",\\"異常\\"],[\\"金\\",\\"警告\\"],[\\"土\\",\\"稼働\\"],[\\"日\\",\\"稼働\\"]]"
  },
  "animation": [
    {
      "step": "週間表示",
      "duration": 3,
      "set": {
        "evt": "[[\\"月\\",\\"稼働\\"],[\\"火\\",\\"稼働\\"],[\\"水\\",\\"警告\\"],[\\"木\\",\\"異常\\"],[\\"金\\",\\"警告\\"],[\\"土\\",\\"稼働\\"],[\\"日\\",\\"稼働\\"]]"
      }
    }
  ]
}`;

export const sourceYaml__partsRainbowStack = `title: "レインボーゲージ — 5 tone tier stack"
type: flow

lanes:
  l: { x: 0, width: 340 }

states:
  t1: 20
  t2: 20
  t3: 20
  t4: 20
  t5: 20

actors:
  - Tier 1: { kind: dyn-rect, lane: l, stack: 0, subtitle: "S", posW: 320, posH: 90, shape: { kind: rect, source: "{t1}", fillMax: 30, orient: up, fill: "#dc2626", radius: 4 } }
  - Tier 2: { kind: dyn-rect, lane: l, stack: 1, subtitle: "A", posW: 320, posH: 90, shape: { kind: rect, source: "{t2}", fillMax: 30, orient: up, fill: "#f59e0b", radius: 4 } }
  - Tier 3: { kind: dyn-rect, lane: l, stack: 2, subtitle: "B", posW: 320, posH: 90, shape: { kind: rect, source: "{t3}", fillMax: 30, orient: up, fill: "#22c55e", radius: 4 } }
  - Tier 4: { kind: dyn-rect, lane: l, stack: 3, subtitle: "C", posW: 320, posH: 90, shape: { kind: rect, source: "{t4}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 4 } }
  - Tier 5: { kind: dyn-rect, lane: l, stack: 4, subtitle: "D", posW: 320, posH: 90, shape: { kind: rect, source: "{t5}", fillMax: 30, orient: up, fill: "#8b5cf6", radius: 4 } }

animation:
  - step: "全ての段が動く" 4s
    focus: ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"]
    tween:
      t1: 20 -> 28
      t2: 20 -> 28
      t3: 20 -> 28
      t4: 20 -> 28
      t5: 20 -> 28
`;

export const sourceJson__partsRainbowStack = `{
  "title": "レインボーゲージ — 5 tone tier stack",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 340 }
  },
  "actors": [
    {
      "name": "Tier 1",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "S",
      "posW": 320,
      "posH": 90,
      "shape": {
        "kind": "rect",
        "source": "{t1}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 4
      }
    },
    {
      "name": "Tier 2",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 1,
      "subtitle": "A",
      "posW": 320,
      "posH": 90,
      "shape": {
        "kind": "rect",
        "source": "{t2}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 4
      }
    },
    {
      "name": "Tier 3",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 2,
      "subtitle": "B",
      "posW": 320,
      "posH": 90,
      "shape": {
        "kind": "rect",
        "source": "{t3}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      }
    },
    {
      "name": "Tier 4",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 3,
      "subtitle": "C",
      "posW": 320,
      "posH": 90,
      "shape": {
        "kind": "rect",
        "source": "{t4}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 4
      }
    },
    {
      "name": "Tier 5",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 4,
      "subtitle": "D",
      "posW": 320,
      "posH": 90,
      "shape": {
        "kind": "rect",
        "source": "{t5}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "t1": 20, "t2": 20, "t3": 20, "t4": 20, "t5": 20 },
  "animation": [
    {
      "step": "全ての段が動く",
      "duration": 4,
      "focus": ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"],
      "tween": { "t1": [20, 28], "t2": [20, 28], "t3": [20, 28], "t4": [20, 28], "t5": [20, 28] }
    }
  ]
}`;

export const sourceYaml__partsShoppingCart = `title: "ショッピングカート — 商品数 live"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  cnt: 0

actors:
  - カート: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{cnt} 点", posW: 360, posH: 300, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "#4e9dc4", radius: 16 } }

animation:
  - step: "商品追加" 3.5s
    focus: ["カート"]
    tween:
      cnt: 0 -> 12
`;

export const sourceJson__partsShoppingCart = `{
  "title": "ショッピングカート — 商品数 live",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "カート",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{cnt} 点",
      "posW": 360,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": 100,
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 16
      }
    }
  ],
  "flow": [],
  "states": { "cnt": 0 },
  "animation": [
    {
      "step": "商品追加",
      "duration": 3.5,
      "focus": ["カート"],
      "tween": { "cnt": [0, 12] }
    }
  ]
}`;

export const sourceYaml__partsMailInbox = `title: "メール受信箱 — 未読 badge"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  unread: 0

actors:
  - 受信箱: { kind: dyn-circle, lane: l, stack: 0, subtitle: "未読 {unread} 通", posW: 340, posH: 340, shape: { kind: circle, radius: 140, fill: "#dc2626" } }

animation:
  - step: "受信増加" 4s
    focus: ["受信箱"]
    tween:
      unread: 0 -> 27
`;

export const sourceJson__partsMailInbox = `{
  "title": "メール受信箱 — 未読 badge",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "受信箱",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "未読 {unread} 通",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 140, "fill": "#dc2626" }
    }
  ],
  "flow": [],
  "states": { "unread": 0 },
  "animation": [
    {
      "step": "受信増加",
      "duration": 4,
      "focus": ["受信箱"],
      "tween": { "unread": [0, 27] }
    }
  ]
}`;

export const sourceYaml__partsLocationPin = `title: "位置ピン — 現在位置 metaphor"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#dc2626"
  drop: 0

actors:
  - 現在地: { kind: dyn-circle, lane: l, stack: 0, subtitle: "東京駅", posW: 340, posH: 340, shape: { kind: circle, radius: 130, fillProgress: "{drop}", fill: "{bg}" } }

animation:
  - step: "位置が定まる" 3s
    focus: ["現在地"]
    tween:
      drop: 0 -> 1
`;

export const sourceJson__partsLocationPin = `{
  "title": "位置ピン — 現在位置 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "現在地",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "東京駅",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 130, "fillProgress": "{drop}", "fill": "{bg}" }
    }
  ],
  "flow": [],
  "states": { "bg": "#dc2626", "drop": 0 },
  "animation": [
    {
      "step": "位置が定まる",
      "duration": 3,
      "focus": ["現在地"],
      "tween": { "drop": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsBellNotification = `title: "通知ベル — 新着 alert"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  alerts: 0

actors:
  - 🔔 通知: { kind: dyn-circle, lane: l, stack: 0, subtitle: "{alerts} 件", posW: 360, posH: 360, shape: { kind: circle, radius: 140, fill: "#f59e0b" } }

animation:
  - step: "通知増加" 3.5s
    focus: ["🔔 通知"]
    tween:
      alerts: 0 -> 15
`;

export const sourceJson__partsBellNotification = `{
  "title": "通知ベル — 新着 alert",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "🔔 通知",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "{alerts} 件",
      "posW": 360,
      "posH": 360,
      "shape": { "kind": "circle", "radius": 140, "fill": "#f59e0b" }
    }
  ],
  "flow": [],
  "states": { "alerts": 0 },
  "animation": [
    {
      "step": "通知増加",
      "duration": 3.5,
      "focus": ["🔔 通知"],
      "tween": { "alerts": [0, 15] }
    }
  ]
}`;

export const sourceYaml__partsSearchBar = `title: "検索バー — 入力域 metaphor"
type: flow

lanes:
  l: { x: 0, width: 700 }

states:
  typed: 0

actors:
  - 🔍 検索: { kind: dyn-rect, lane: l, stack: 0, subtitle: "keyword を入力", posW: 680, posH: 140, shape: { kind: rect, source: "{typed}", fillMax: 100, orient: right, fill: "#f5e6b8", radius: 70 } }

animation:
  - step: "入力が伸びる" 3s
    focus: ["🔍 検索"]
    tween:
      typed: 0 -> 100
`;

export const sourceJson__partsSearchBar = `{
  "title": "検索バー — 入力域 metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 700 }
  },
  "actors": [
    {
      "name": "🔍 検索",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "keyword を入力",
      "posW": 680,
      "posH": 140,
      "shape": {
        "kind": "rect",
        "source": "{typed}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#f5e6b8",
        "radius": 70
      }
    }
  ],
  "flow": [],
  "states": { "typed": 0 },
  "animation": [
    {
      "step": "入力が伸びる",
      "duration": 3,
      "focus": ["🔍 検索"],
      "tween": { "typed": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsLikeButton = `title: "いいねボタン — count live"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  likes: 42

actors:
  - ♥: { kind: dyn-circle, lane: l, stack: 0, subtitle: "{likes} いいね", posW: 340, posH: 340, shape: { kind: circle, radius: 140, fill: "#dc2626" } }

animation:
  - step: "いいね急増" 4s
    focus: ["♥"]
    tween:
      likes: 42 -> 158
`;

export const sourceJson__partsLikeButton = `{
  "title": "いいねボタン — count live",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "♥",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "{likes} いいね",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 140, "fill": "#dc2626" }
    }
  ],
  "flow": [],
  "states": { "likes": 42 },
  "animation": [
    {
      "step": "いいね急増",
      "duration": 4,
      "focus": ["♥"],
      "tween": { "likes": [42, 158] }
    }
  ]
}`;

export const sourceYaml__partsBookmark = `title: "ブックマーク — 保存済み metaphor"
type: flow

lanes:
  l: { x: 0, width: 300 }

states:
  mark: 0

actors:
  - 🔖: { kind: dyn-rect, lane: l, stack: 0, subtitle: "保存済み", posW: 240, posH: 400, shape: { kind: rect, source: "{mark}", fillMax: 100, orient: down, fill: "#f59e0b", radius: 8 } }

animation:
  - step: "しおりが挿さる" 3s
    focus: ["🔖"]
    tween:
      mark: 0 -> 100
`;

export const sourceJson__partsBookmark = `{
  "title": "ブックマーク — 保存済み metaphor",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 300 }
  },
  "actors": [
    {
      "name": "🔖",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "保存済み",
      "posW": 240,
      "posH": 400,
      "shape": {
        "kind": "rect",
        "source": "{mark}",
        "fillMax": 100,
        "orient": "down",
        "fill": "#f59e0b",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "mark": 0 },
  "animation": [
    {
      "step": "しおりが挿さる",
      "duration": 3,
      "focus": ["🔖"],
      "tween": { "mark": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsCoinBalance = `title: "コイン残高 — currency live"
type: flow

readouts:
  cb: { kind: countup, source: "coin", decimals: 0, unit: " G", label: "所持ゴールド" }

lanes:
  l: { x: 0, width: 500 }

states:
  coin: 1000

actors:
  - _h: { kind: actor, lane: l, stack: 0, posW: 1, posH: 1, visibleIf: "0", title: "" }

animation:
  - step: "収入" 4s
    tween:
      coin: 1000 -> 8500
`;

export const sourceJson__partsCoinBalance = `{
  "title": "コイン残高 — currency live",
  "type": "flow",
  "readouts": [
    {
      "id": "cb",
      "kind": "countup",
      "source": "coin",
      "decimals": 0,
      "unit": " G",
      "label": "所持ゴールド"
    }
  ],
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "_h",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "posW": 1,
      "posH": 1,
      "visibleIf": "0",
      "title": ""
    }
  ],
  "flow": [],
  "states": { "coin": 1000 },
  "animation": [
    {
      "step": "収入",
      "duration": 4,
      "tween": { "coin": [1000, 8500] }
    }
  ]
}`;

export const sourceYaml__partsExpBar = `title: "経験値バー — XP progression"
type: flow

lanes:
  l: { x: 0, width: 700 }

states:
  xp: 20

actors:
  - EXP Lv.12: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{xp}/100 to Lv.13", posW: 680, posH: 120, shape: { kind: rect, source: "{xp}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 60 } }

animation:
  - step: "経験値が上がる" 4.5s
    focus: ["EXP Lv.12"]
    tween:
      xp: 20 -> 95
`;

export const sourceJson__partsExpBar = `{
  "title": "経験値バー — XP progression",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 700 }
  },
  "actors": [
    {
      "name": "EXP Lv.12",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{xp}/100 to Lv.13",
      "posW": 680,
      "posH": 120,
      "shape": {
        "kind": "rect",
        "source": "{xp}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 60
      }
    }
  ],
  "flow": [],
  "states": { "xp": 20 },
  "animation": [
    {
      "step": "経験値が上がる",
      "duration": 4.5,
      "focus": ["EXP Lv.12"],
      "tween": { "xp": [20, 95] }
    }
  ]
}`;

export const sourceYaml__partsAchievement = `title: "実績トロフィー — achievement 解放"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  bg: "#f59e0b"
  unlock: 0

actors:
  - 🏆: { kind: dyn-circle, lane: l, stack: 0, subtitle: "初回達成", posW: 380, posH: 380, shape: { kind: circle, radius: 150, fillProgress: "{unlock}", fill: "{bg}" } }

animation:
  - step: "実績が解放される" 3s
    focus: ["🏆"]
    tween:
      unlock: 0 -> 1
`;

export const sourceJson__partsAchievement = `{
  "title": "実績トロフィー — achievement 解放",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "🏆",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "初回達成",
      "posW": 380,
      "posH": 380,
      "shape": { "kind": "circle", "radius": 150, "fillProgress": "{unlock}", "fill": "{bg}" }
    }
  ],
  "flow": [],
  "states": { "bg": "#f59e0b", "unlock": 0 },
  "animation": [
    {
      "step": "実績が解放される",
      "duration": 3,
      "focus": ["🏆"],
      "tween": { "unlock": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsSaleTag = `title: "セールタグ — 割引率 badge"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  off: 30

actors:
  - SALE: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{off}% OFF", posW: 360, posH: 200, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "#dc2626", radius: 12 } }

animation:
  - step: "割引拡大" 4s
    focus: ["SALE"]
    tween:
      off: 30 -> 70
`;

export const sourceJson__partsSaleTag = `{
  "title": "セールタグ — 割引率 badge",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "SALE",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{off}% OFF",
      "posW": 360,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": 100,
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 12
      }
    }
  ],
  "flow": [],
  "states": { "off": 30 },
  "animation": [
    {
      "step": "割引拡大",
      "duration": 4,
      "focus": ["SALE"],
      "tween": { "off": [30, 70] }
    }
  ]
}`;

export const sourceYaml__partsPlayButton = `title: "再生ボタン — media play"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#22c55e"
  press: 0

actors:
  - ▶: { kind: dyn-circle, lane: l, stack: 0, subtitle: "再生", posW: 340, posH: 340, shape: { kind: circle, radius: 140, fillProgress: "{press}", fill: "{bg}" } }

animation:
  - step: "再生が始まる" 3s
    focus: ["▶"]
    tween:
      press: 0 -> 1
`;

export const sourceJson__partsPlayButton = `{
  "title": "再生ボタン — media play",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "▶",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "再生",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 140, "fillProgress": "{press}", "fill": "{bg}" }
    }
  ],
  "flow": [],
  "states": { "bg": "#22c55e", "press": 0 },
  "animation": [
    {
      "step": "再生が始まる",
      "duration": 3,
      "focus": ["▶"],
      "tween": { "press": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsCloudSync = `title: "クラウド同期 — sync 進捗"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  sync: 15

actors:
  - ☁ 同期: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{sync}%", posW: 380, posH: 380, shape: { kind: arc, angle: "{sync}", sweepMax: 100, outerRadius: 150, innerRadius: 105, fill: "#4e9dc4" } }

animation:
  - step: "同期進行" 4.5s
    focus: ["☁ 同期"]
    tween:
      sync: 15 -> 100
`;

export const sourceJson__partsCloudSync = `{
  "title": "クラウド同期 — sync 進捗",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "☁ 同期",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{sync}%",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{sync}",
        "sweepMax": 100,
        "outerRadius": 150,
        "innerRadius": 105,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [],
  "states": { "sync": 15 },
  "animation": [
    {
      "step": "同期進行",
      "duration": 4.5,
      "focus": ["☁ 同期"],
      "tween": { "sync": [15, 100] }
    }
  ]
}`;

export const sourceYaml__partsAlarmClock = `title: "目覚まし時計 — alarm 表示"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  tick: 0

actors:
  - ⏰: { kind: dyn-circle, lane: l, stack: 0, subtitle: "07:00", posW: 340, posH: 340, shape: { kind: circle, radius: 140, fillProgress: "{tick}", fill: "#f59e0b" } }

animation:
  - step: "時刻が迫る" 3s
    focus: ["⏰"]
    tween:
      tick: 0 -> 1
`;

export const sourceJson__partsAlarmClock = `{
  "title": "目覚まし時計 — alarm 表示",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "⏰",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "07:00",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": 140, "fillProgress": "{tick}", "fill": "#f59e0b" }
    }
  ],
  "flow": [],
  "states": { "tick": 0 },
  "animation": [
    {
      "step": "時刻が迫る",
      "duration": 3,
      "focus": ["⏰"],
      "tween": { "tick": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsWifiSignal = `title: "Wi-Fi 信号 — 5 段階強度"
type: flow

lanes:
  la: { x: 0, width: 120 }
  lb: { x: 140, width: 120 }
  lc: { x: 280, width: 120 }
  ld: { x: 420, width: 120 }
  le: { x: 560, width: 120 }

states:
  s1: 0
  s2: 0
  s3: 0

actors:
  - b1: { kind: dyn-rect, lane: la, stack: 0, subtitle: "", posW: 100, posH: 100, shape: { kind: rect, source: "{s1}", fillMax: 100, orient: up, fill: "#22c55e", radius: 4 }, title: "" }
  - b2: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "", posW: 100, posH: 160, shape: { kind: rect, source: "{s2}", fillMax: 100, orient: up, fill: "#22c55e", radius: 4 }, title: "" }
  - b3: { kind: dyn-rect, lane: lc, stack: 0, subtitle: "", posW: 100, posH: 220, shape: { kind: rect, source: "{s3}", fillMax: 100, orient: up, fill: "#22c55e", radius: 4 }, title: "" }
  - b4: { kind: dyn-rect, lane: ld, stack: 0, subtitle: "", posW: 100, posH: 280, shape: { kind: rect, source: 0, fillMax: 100, orient: up, fill: "#f5e6b8", radius: 4 }, title: "" }
  - b5: { kind: dyn-rect, lane: le, stack: 0, subtitle: "3/5 有り", posW: 100, posH: 340, shape: { kind: rect, source: 0, fillMax: 100, orient: up, fill: "#f5e6b8", radius: 4 }, title: "" }

animation:
  - step: "強度が上がる" 3s
    focus: ["b1", "b2", "b3", "b4", "b5"]
    tween:
      s1: 0 -> 100
      s2: 0 -> 100
      s3: 0 -> 100
`;

export const sourceJson__partsWifiSignal = `{
  "title": "Wi-Fi 信号 — 5 段階強度",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 120 },
    "lb": { "x": 140, "width": 120 },
    "lc": { "x": 280, "width": 120 },
    "ld": { "x": 420, "width": 120 },
    "le": { "x": 560, "width": 120 }
  },
  "actors": [
    {
      "name": "b1",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "",
      "posW": 100,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{s1}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "b2",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "",
      "posW": 100,
      "posH": 160,
      "shape": {
        "kind": "rect",
        "source": "{s2}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "b3",
      "kind": "dyn-rect",
      "lane": "lc",
      "stack": 0,
      "subtitle": "",
      "posW": 100,
      "posH": 220,
      "shape": {
        "kind": "rect",
        "source": "{s3}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "b4",
      "kind": "dyn-rect",
      "lane": "ld",
      "stack": 0,
      "subtitle": "",
      "posW": 100,
      "posH": 280,
      "shape": {
        "kind": "rect",
        "source": 0,
        "fillMax": 100,
        "orient": "up",
        "fill": "#f5e6b8",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "b5",
      "kind": "dyn-rect",
      "lane": "le",
      "stack": 0,
      "subtitle": "3/5 有り",
      "posW": 100,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": 0,
        "fillMax": 100,
        "orient": "up",
        "fill": "#f5e6b8",
        "radius": 4
      },
      "title": ""
    }
  ],
  "flow": [],
  "states": { "s1": 0, "s2": 0, "s3": 0 },
  "animation": [
    {
      "step": "強度が上がる",
      "duration": 3,
      "focus": ["b1", "b2", "b3", "b4", "b5"],
      "tween": { "s1": [0, 100], "s2": [0, 100], "s3": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsBindCounterRadius = `title: "bind: counter → 半径 — 1 state を shape.radius に直接 bind"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  count: 30

actors:
  - counter: { kind: dyn-circle, lane: l, stack: 0, subtitle: "半径 {count}", posW: 380, posH: 380, shape: { kind: circle, radius: "{count}", fill: "#4e9dc4" } }

animation:
  - step: "半径拡大" 4s
    focus: ["counter"]
    tween:
      count: 30 -> 150
`;

export const sourceJson__partsBindCounterRadius = `{
  "title": "bind: counter → 半径 — 1 state を shape.radius に直接 bind",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "counter",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "半径 {count}",
      "posW": 380,
      "posH": 380,
      "shape": { "kind": "circle", "radius": "{count}", "fill": "#4e9dc4" }
    }
  ],
  "flow": [],
  "states": { "count": 30 },
  "animation": [
    {
      "step": "半径拡大",
      "duration": 4,
      "focus": ["counter"],
      "tween": { "count": [30, 150] }
    }
  ]
}`;

export const sourceYaml__partsBind2StateMirror = `title: "bind: 2 state mirror — 独立 state を左右 gauge に並列 bind"
type: flow

lanes:
  la: { x: 0, width: 300 }
  lb: { x: 320, width: 300 }

states:
  l: 0
  r: 0

actors:
  - 左 gauge: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{l}%", posW: 280, posH: 380, shape: { kind: rect, source: "{l}", fillMax: 100, orient: up, fill: "#22c55e", radius: 8 } }
  - 右 gauge: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{r}%", posW: 280, posH: 380, shape: { kind: rect, source: "{r}", fillMax: 100, orient: up, fill: "#dc2626", radius: 8 } }

animation:
  - step: "同期上昇" 4s
    focus: ["左 gauge", "右 gauge"]
    tween:
      l: 0 -> 90
      r: 0 -> 90
`;

export const sourceJson__partsBind2StateMirror = `{
  "title": "bind: 2 state mirror — 独立 state を左右 gauge に並列 bind",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 300 },
    "lb": { "x": 320, "width": 300 }
  },
  "actors": [
    {
      "name": "左 gauge",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "{l}%",
      "posW": 280,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{l}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 8
      }
    },
    {
      "name": "右 gauge",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{r}%",
      "posW": 280,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{r}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "l": 0, "r": 0 },
  "animation": [
    {
      "step": "同期上昇",
      "duration": 4,
      "focus": ["左 gauge", "右 gauge"],
      "tween": { "l": [0, 90], "r": [0, 90] }
    }
  ]
}`;

export const sourceYaml__partsBindCascade3 = `title: "bind: cascade 3 states — phase 分割で state chain 順次進行"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  s1: 0
  s2: 0
  s3: 0

actors:
  - step 1: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{s1}%", posW: 380, posH: 100, shape: { kind: rect, source: "{s1}", fillMax: 100, orient: right, fill: "#f59e0b", radius: 4 } }
  - step 2: { kind: dyn-rect, lane: l, stack: 1, subtitle: "{s2}%", posW: 380, posH: 100, shape: { kind: rect, source: "{s2}", fillMax: 100, orient: right, fill: "#a66a3d", radius: 4 } }
  - step 3: { kind: dyn-rect, lane: l, stack: 2, subtitle: "{s3}%", posW: 380, posH: 100, shape: { kind: rect, source: "{s3}", fillMax: 100, orient: right, fill: "#22c55e", radius: 4 } }

animation:
  - step: "s1 進行" 1.5s
    focus: ["step 1", "step 2", "step 3"]
    tween:
      s1: 0 -> 100
  - step: "s2 進行" 1.5s
    focus: ["step 1", "step 2", "step 3"]
    tween:
      s2: 0 -> 100
  - step: "s3 進行" 1.5s
    focus: ["step 1", "step 2", "step 3"]
    tween:
      s3: 0 -> 100
`;

export const sourceJson__partsBindCascade3 = `{
  "title": "bind: cascade 3 states — phase 分割で state chain 順次進行",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "step 1",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{s1}%",
      "posW": 380,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{s1}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#f59e0b",
        "radius": 4
      }
    },
    {
      "name": "step 2",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 1,
      "subtitle": "{s2}%",
      "posW": 380,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{s2}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#a66a3d",
        "radius": 4
      }
    },
    {
      "name": "step 3",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 2,
      "subtitle": "{s3}%",
      "posW": 380,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{s3}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#22c55e",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "s1": 0, "s2": 0, "s3": 0 },
  "animation": [
    {
      "step": "s1 進行",
      "duration": 1.5,
      "focus": ["step 1", "step 2", "step 3"],
      "tween": { "s1": [0, 100] }
    },
    {
      "step": "s2 進行",
      "duration": 1.5,
      "focus": ["step 1", "step 2", "step 3"],
      "tween": { "s2": [0, 100] }
    },
    {
      "step": "s3 進行",
      "duration": 1.5,
      "focus": ["step 1", "step 2", "step 3"],
      "tween": { "s3": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsBindTemplateChain = `title: "bind: template chain — {state} を title と subtitle 両方に埋込"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  rate: 42

actors:
  - 成長率 {rate}%: { kind: dyn-rect, lane: l, stack: 0, subtitle: "現在 {rate}", posW: 380, posH: 300, shape: { kind: rect, source: "{rate}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 12 } }

animation:
  - step: "ひな形の差し替え" 4s
    focus: ["成長率 {rate}%"]
    tween:
      rate: 42 -> 88
`;

export const sourceJson__partsBindTemplateChain = `{
  "title": "bind: template chain — {state} を title と subtitle 両方に埋込",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "成長率 {rate}%",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "現在 {rate}",
      "posW": 380,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{rate}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 12
      }
    }
  ],
  "flow": [],
  "states": { "rate": 42 },
  "animation": [
    {
      "step": "ひな形の差し替え",
      "duration": 4,
      "focus": ["成長率 {rate}%"],
      "tween": { "rate": [42, 88] }
    }
  ]
}`;

export const sourceYaml__partsBindPulseCycle = `title: "bind: pulse cycle — 上下 tween chain で心拍表現"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  pulse: 0

actors:
  - pulse: { kind: dyn-circle, lane: l, stack: 0, subtitle: "{pulse}", posW: 340, posH: 340, shape: { kind: circle, radius: "{pulse}", fill: "#dc2626" } }

animation:
  - step: "膨張" 0.8s
    focus: ["pulse"]
    tween:
      pulse: 20 -> 150
  - step: "収縮" 0.8s
    focus: ["pulse"]
    tween:
      pulse: 150 -> 20
`;

export const sourceJson__partsBindPulseCycle = `{
  "title": "bind: pulse cycle — 上下 tween chain で心拍表現",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "pulse",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "{pulse}",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": "{pulse}", "fill": "#dc2626" }
    }
  ],
  "flow": [],
  "states": { "pulse": 0 },
  "animation": [
    {
      "step": "膨張",
      "duration": 0.8,
      "focus": ["pulse"],
      "tween": { "pulse": [20, 150] }
    },
    {
      "step": "収縮",
      "duration": 0.8,
      "focus": ["pulse"],
      "tween": { "pulse": [150, 20] }
    }
  ]
}`;

export const sourceYaml__partsBindWaveLevel2Phase = `title: "bind: wave level 2-phase — 水位を満ち→引きの 2 phase で bind"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  lvl: 20

actors:
  - 海面: { kind: dyn-wave, lane: l, stack: 0, subtitle: "水位 {lvl}%", posW: 380, posH: 380, shape: { kind: wave, level: "{lvl}", amplitude: 100, frequency: 2.2, waveHeight: 12, fill: "#4e9dc4" } }

animation:
  - step: "満潮" 2.2s
    focus: ["海面"]
    tween:
      lvl: 20 -> 90
  - step: "引き潮" 2.2s
    focus: ["海面"]
    tween:
      lvl: 90 -> 20
`;

export const sourceJson__partsBindWaveLevel2Phase = `{
  "title": "bind: wave level 2-phase — 水位を満ち→引きの 2 phase で bind",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "海面",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "水位 {lvl}%",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "wave",
        "level": "{lvl}",
        "amplitude": 100,
        "frequency": 2.2,
        "waveHeight": 12,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [],
  "states": { "lvl": 20 },
  "animation": [
    {
      "step": "満潮",
      "duration": 2.2,
      "focus": ["海面"],
      "tween": { "lvl": [20, 90] }
    },
    {
      "step": "引き潮",
      "duration": 2.2,
      "focus": ["海面"],
      "tween": { "lvl": [90, 20] }
    }
  ]
}`;

export const sourceYaml__partsBindGrid4 = `title: "bind: 2x2 grid 4 state — lane × stack で独立 state 4 tile"
type: flow

lanes:
  la: { x: 0, width: 200 }
  lb: { x: 220, width: 200 }

states:
  q1: 20
  q2: 40
  q3: 60
  q4: 80

actors:
  - Q1: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{q1}", posW: 180, posH: 180, shape: { kind: rect, source: "{q1}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 8 } }
  - Q2: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{q2}", posW: 180, posH: 180, shape: { kind: rect, source: "{q2}", fillMax: 100, orient: up, fill: "#a66a3d", radius: 8 } }
  - Q3: { kind: dyn-rect, lane: la, stack: 1, subtitle: "{q3}", posW: 180, posH: 180, shape: { kind: rect, source: "{q3}", fillMax: 100, orient: up, fill: "#22c55e", radius: 8 } }
  - Q4: { kind: dyn-rect, lane: lb, stack: 1, subtitle: "{q4}", posW: 180, posH: 180, shape: { kind: rect, source: "{q4}", fillMax: 100, orient: up, fill: "#dc2626", radius: 8 } }

animation:
  - step: "全ての枡が同時に動く" 4s
    focus: ["Q1", "Q2", "Q3", "Q4"]
    tween:
      q1: 20 -> 95
      q2: 40 -> 85
      q3: 60 -> 75
      q4: 80 -> 65
`;

export const sourceJson__partsBindGrid4 = `{
  "title": "bind: 2x2 grid 4 state — lane × stack で独立 state 4 tile",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 200 },
    "lb": { "x": 220, "width": 200 }
  },
  "actors": [
    {
      "name": "Q1",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "{q1}",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{q1}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 8
      }
    },
    {
      "name": "Q2",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{q2}",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{q2}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 8
      }
    },
    {
      "name": "Q3",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 1,
      "subtitle": "{q3}",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{q3}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 8
      }
    },
    {
      "name": "Q4",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 1,
      "subtitle": "{q4}",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{q4}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "q1": 20, "q2": 40, "q3": 60, "q4": 80 },
  "animation": [
    {
      "step": "全ての枡が同時に動く",
      "duration": 4,
      "focus": ["Q1", "Q2", "Q3", "Q4"],
      "tween": { "q1": [20, 95], "q2": [40, 85], "q3": [60, 75], "q4": [80, 65] }
    }
  ]
}`;

export const sourceYaml__partsBindCountdown = `title: "bind: countdown — state を高 → 低へ tween、 残り時間 subtitle"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  sec: 60

actors:
  - 残り: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{sec} 秒", posW: 340, posH: 340, shape: { kind: arc, angle: "{sec}", sweepMax: 60, outerRadius: 140, innerRadius: 95, fill: "#dc2626" } }

animation:
  - step: "残り時間が減る" 5s
    focus: ["残り"]
    tween:
      sec: 60 -> 0
`;

export const sourceJson__partsBindCountdown = `{
  "title": "bind: countdown — state を高 → 低へ tween、 残り時間 subtitle",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "残り",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{sec} 秒",
      "posW": 340,
      "posH": 340,
      "shape": {
        "kind": "arc",
        "angle": "{sec}",
        "sweepMax": 60,
        "outerRadius": 140,
        "innerRadius": 95,
        "fill": "#dc2626"
      }
    }
  ],
  "flow": [],
  "states": { "sec": 60 },
  "animation": [
    {
      "step": "残り時間が減る",
      "duration": 5,
      "focus": ["残り"],
      "tween": { "sec": [60, 0] }
    }
  ]
}`;

export const sourceYaml__partsBindArcSweep = `title: "bind: arc sweep — state 0 → 360 で 1 周 loading"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  deg: 0

actors:
  - loading: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{deg}°", posW: 340, posH: 340, shape: { kind: arc, angle: "{deg}", sweepMax: 360, outerRadius: 140, innerRadius: 100, fill: "#f59e0b" } }

animation:
  - step: "1 周" 3s
    focus: ["loading"]
    tween:
      deg: 0 -> 360
`;

export const sourceJson__partsBindArcSweep = `{
  "title": "bind: arc sweep — state 0 → 360 で 1 周 loading",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "loading",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{deg}°",
      "posW": 340,
      "posH": 340,
      "shape": {
        "kind": "arc",
        "angle": "{deg}",
        "sweepMax": 360,
        "outerRadius": 140,
        "innerRadius": 100,
        "fill": "#f59e0b"
      }
    }
  ],
  "flow": [],
  "states": { "deg": 0 },
  "animation": [
    {
      "step": "1 周",
      "duration": 3,
      "focus": ["loading"],
      "tween": { "deg": [0, 360] }
    }
  ]
}`;

export const sourceYaml__partsBindSplitFill = `title: "bind: split fill — 2 state 相補で 1 領域を上下分割"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  up: 40
  dn: 60

actors:
  - 上 zone: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{up}%", posW: 380, posH: 180, shape: { kind: rect, source: "{up}", fillMax: 100, orient: down, fill: "#22c55e", radius: 4 } }
  - 下 zone: { kind: dyn-rect, lane: l, stack: 1, subtitle: "{dn}%", posW: 380, posH: 180, shape: { kind: rect, source: "{dn}", fillMax: 100, orient: up, fill: "#dc2626", radius: 4 } }

animation:
  - step: "上下逆転" 4s
    focus: ["上 zone", "下 zone"]
    tween:
      up: 40 -> 80
      dn: 60 -> 20
`;

export const sourceJson__partsBindSplitFill = `{
  "title": "bind: split fill — 2 state 相補で 1 領域を上下分割",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "上 zone",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{up}%",
      "posW": 380,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{up}",
        "fillMax": 100,
        "orient": "down",
        "fill": "#22c55e",
        "radius": 4
      }
    },
    {
      "name": "下 zone",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 1,
      "subtitle": "{dn}%",
      "posW": 380,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{dn}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "up": 40, "dn": 60 },
  "animation": [
    {
      "step": "上下逆転",
      "duration": 4,
      "focus": ["上 zone", "下 zone"],
      "tween": { "up": [40, 80], "dn": [60, 20] }
    }
  ]
}`;

export const sourceYaml__partsBindEqualizer5 = `title: "bind: 5 bar equalizer — 独立 state 5 で音楽 EQ 見立て"
type: flow

lanes:
  l1: { x: 0, width: 80 }
  l2: { x: 100, width: 80 }
  l3: { x: 200, width: 80 }
  l4: { x: 300, width: 80 }
  l5: { x: 400, width: 80 }

states:
  e1: 30
  e2: 60
  e3: 90
  e4: 60
  e5: 30

actors:
  - bar1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "", posW: 80, posH: 300, shape: { kind: rect, source: "{e1}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 4 }, title: "" }
  - bar2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "", posW: 80, posH: 300, shape: { kind: rect, source: "{e2}", fillMax: 100, orient: up, fill: "#22c55e", radius: 4 }, title: "" }
  - bar3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "", posW: 80, posH: 300, shape: { kind: rect, source: "{e3}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 4 }, title: "" }
  - bar4: { kind: dyn-rect, lane: l4, stack: 0, subtitle: "", posW: 80, posH: 300, shape: { kind: rect, source: "{e4}", fillMax: 100, orient: up, fill: "#a66a3d", radius: 4 }, title: "" }
  - bar5: { kind: dyn-rect, lane: l5, stack: 0, subtitle: "", posW: 80, posH: 300, shape: { kind: rect, source: "{e5}", fillMax: 100, orient: up, fill: "#dc2626", radius: 4 }, title: "" }

animation:
  - step: "音の帯が揺れる" 3.5s
    focus: ["bar1", "bar2", "bar3", "bar4", "bar5"]
    tween:
      e1: 30 -> 80
      e2: 60 -> 40
      e3: 90 -> 20
      e4: 60 -> 70
      e5: 30 -> 95
`;

export const sourceJson__partsBindEqualizer5 = `{
  "title": "bind: 5 bar equalizer — 独立 state 5 で音楽 EQ 見立て",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 80 },
    "l2": { "x": 100, "width": 80 },
    "l3": { "x": 200, "width": 80 },
    "l4": { "x": 300, "width": 80 },
    "l5": { "x": 400, "width": 80 }
  },
  "actors": [
    {
      "name": "bar1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "",
      "posW": 80,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{e1}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "bar2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "",
      "posW": 80,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{e2}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "bar3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "",
      "posW": 80,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{e3}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "bar4",
      "kind": "dyn-rect",
      "lane": "l4",
      "stack": 0,
      "subtitle": "",
      "posW": 80,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{e4}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      },
      "title": ""
    },
    {
      "name": "bar5",
      "kind": "dyn-rect",
      "lane": "l5",
      "stack": 0,
      "subtitle": "",
      "posW": 80,
      "posH": 300,
      "shape": {
        "kind": "rect",
        "source": "{e5}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 4
      },
      "title": ""
    }
  ],
  "flow": [],
  "states": { "e1": 30, "e2": 60, "e3": 90, "e4": 60, "e5": 30 },
  "animation": [
    {
      "step": "音の帯が揺れる",
      "duration": 3.5,
      "focus": ["bar1", "bar2", "bar3", "bar4", "bar5"],
      "tween": { "e1": [30, 80], "e2": [60, 40], "e3": [90, 20], "e4": [60, 70], "e5": [30, 95] }
    }
  ]
}`;

export const sourceYaml__partsBindColorState = `title: "bind: color state — 文字列 state で fill 直接切替"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#22c55e"

actors:
  - status: { kind: dyn-rect, lane: l, stack: 0, subtitle: "healthy", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 12 } }

animation:
  - step: "注意" 1.5s
    focus: ["status"]
    set:
      bg: "#f59e0b"
  - step: "危険" 1.5s
    focus: ["status"]
    set:
      bg: "#dc2626"
  - step: "正常に戻る" 1.5s
    focus: ["status"]
    set:
      bg: "#22c55e"
`;

export const sourceJson__partsBindColorState = `{
  "title": "bind: color state — 文字列 state で fill 直接切替",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "status",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "healthy",
      "posW": 340,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": 100,
        "fillMax": 100,
        "orient": "up",
        "fill": "{bg}",
        "radius": 12
      }
    }
  ],
  "flow": [],
  "states": { "bg": "#22c55e" },
  "animation": [
    {
      "step": "注意",
      "duration": 1.5,
      "focus": ["status"],
      "set": { "bg": "#f59e0b" }
    },
    {
      "step": "危険",
      "duration": 1.5,
      "focus": ["status"],
      "set": { "bg": "#dc2626" }
    },
    {
      "step": "正常に戻る",
      "duration": 1.5,
      "focus": ["status"],
      "set": { "bg": "#22c55e" }
    }
  ]
}`;

export const sourceYaml__partsBindLevelColorCombo = `title: "bind: 水位と色を同じ波形に併用する"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  lvl: 30
  hue: "#4e9dc4"

actors:
  - tank: { kind: dyn-wave, lane: l, stack: 0, subtitle: "{lvl}%", posW: 380, posH: 380, shape: { kind: wave, level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 10, fill: "{hue}" } }

animation:
  - step: "水位上昇" 2s
    focus: ["tank"]
    tween:
      lvl: 30 -> 85
  - step: "警告色" 2s
    focus: ["tank"]
    set:
      hue: "#dc2626"
`;

export const sourceJson__partsBindLevelColorCombo = `{
  "title": "bind: 水位と色を同じ波形に併用する",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "tank",
      "kind": "dyn-wave",
      "lane": "l",
      "stack": 0,
      "subtitle": "{lvl}%",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "wave",
        "level": "{lvl}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 10,
        "fill": "{hue}"
      }
    }
  ],
  "flow": [],
  "states": { "lvl": 30, "hue": "#4e9dc4" },
  "animation": [
    {
      "step": "水位上昇",
      "duration": 2,
      "focus": ["tank"],
      "tween": { "lvl": [30, 85] }
    },
    {
      "step": "警告色",
      "duration": 2,
      "focus": ["tank"],
      "set": { "hue": "#dc2626" }
    }
  ]
}`;

export const sourceYaml__partsBindEscalation3 = `title: "bind: 3 段階で state を切り替える"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  level: 1
  bg: "#22c55e"

actors:
  - Alert Lv {level}: { kind: dyn-rect, lane: l, stack: 0, subtitle: "level: {level}", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 8 } }

animation:
  - step: "L1 = 平常" 1.5s
    focus: ["Alert Lv {level}"]
    set:
      level: 1
      bg: "#22c55e"
  - step: "L2 = 注意" 1.5s
    focus: ["Alert Lv {level}"]
    set:
      level: 2
      bg: "#f59e0b"
  - step: "L3 = 危険" 1.5s
    focus: ["Alert Lv {level}"]
    set:
      level: 3
      bg: "#dc2626"
`;

export const sourceJson__partsBindEscalation3 = `{
  "title": "bind: 3 段階で state を切り替える",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "Alert Lv {level}",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "level: {level}",
      "posW": 340,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": 100,
        "fillMax": 100,
        "orient": "up",
        "fill": "{bg}",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": { "level": 1, "bg": "#22c55e" },
  "animation": [
    {
      "step": "L1 = 平常",
      "duration": 1.5,
      "focus": ["Alert Lv {level}"],
      "set": { "level": 1, "bg": "#22c55e" }
    },
    {
      "step": "L2 = 注意",
      "duration": 1.5,
      "focus": ["Alert Lv {level}"],
      "set": { "level": 2, "bg": "#f59e0b" }
    },
    {
      "step": "L3 = 危険",
      "duration": 1.5,
      "focus": ["Alert Lv {level}"],
      "set": { "level": 3, "bg": "#dc2626" }
    }
  ]
}`;

export const sourceYaml__partsBindTweenChain4 = `title: "bind: tween chain 4-hop — 4 phase で 25% ずつ chain tween"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  v: 0

actors:
  - progress: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{v}%", posW: 380, posH: 200, shape: { kind: rect, source: "{v}", fillMax: 100, orient: right, fill: "#4e9dc4", radius: 4 } }

animation:
  - step: "0 → 25" 1s
    focus: ["progress"]
    tween:
      v: 0 -> 25
  - step: "25 → 50" 1s
    focus: ["progress"]
    tween:
      v: 25 -> 50
  - step: "50 → 75" 1s
    focus: ["progress"]
    tween:
      v: 50 -> 75
  - step: "75 → 100" 1s
    focus: ["progress"]
    tween:
      v: 75 -> 100
`;

export const sourceJson__partsBindTweenChain4 = `{
  "title": "bind: tween chain 4-hop — 4 phase で 25% ずつ chain tween",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "progress",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{v}%",
      "posW": 380,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{v}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#4e9dc4",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "0 → 25",
      "duration": 1,
      "focus": ["progress"],
      "tween": { "v": [0, 25] }
    },
    {
      "step": "25 → 50",
      "duration": 1,
      "focus": ["progress"],
      "tween": { "v": [25, 50] }
    },
    {
      "step": "50 → 75",
      "duration": 1,
      "focus": ["progress"],
      "tween": { "v": [50, 75] }
    },
    {
      "step": "75 → 100",
      "duration": 1,
      "focus": ["progress"],
      "tween": { "v": [75, 100] }
    }
  ]
}`;

export const sourceYaml__partsBindRingCounter = `title: "bind: ring counter — arc + 中央 counter を同 state で表現"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  k: 250

actors:
  - requests: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{k}k / 1000k", posW: 380, posH: 380, shape: { kind: arc, angle: "{k}", sweepMax: 1000, outerRadius: 150, innerRadius: 100, fill: "#22c55e" } }

animation:
  - step: "1k 到達" 4s
    focus: ["requests"]
    tween:
      k: 250 -> 980
`;

export const sourceJson__partsBindRingCounter = `{
  "title": "bind: ring counter — arc + 中央 counter を同 state で表現",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "requests",
      "kind": "dyn-arc",
      "lane": "l",
      "stack": 0,
      "subtitle": "{k}k / 1000k",
      "posW": 380,
      "posH": 380,
      "shape": {
        "kind": "arc",
        "angle": "{k}",
        "sweepMax": 1000,
        "outerRadius": 150,
        "innerRadius": 100,
        "fill": "#22c55e"
      }
    }
  ],
  "flow": [],
  "states": { "k": 250 },
  "animation": [
    {
      "step": "1k 到達",
      "duration": 4,
      "focus": ["requests"],
      "tween": { "k": [250, 980] }
    }
  ]
}`;

export const sourceYaml__partsBindModeToggle = `title: "bind: mode toggle — 2 state 同時 set で light/dark toggle"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#fcf8ee"
  txt: "light mode"

actors:
  - theme: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{txt}", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 12 } }

animation:
  - step: "暗い配色へ" 1.5s
    focus: ["theme"]
    set:
      bg: "#1a1408"
      txt: "dark mode"
  - step: "明るい配色へ" 1.5s
    focus: ["theme"]
    set:
      bg: "#fcf8ee"
      txt: "light mode"
`;

export const sourceJson__partsBindModeToggle = `{
  "title": "bind: mode toggle — 2 state 同時 set で light/dark toggle",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "theme",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{txt}",
      "posW": 340,
      "posH": 340,
      "shape": {
        "kind": "rect",
        "source": 100,
        "fillMax": 100,
        "orient": "up",
        "fill": "{bg}",
        "radius": 12
      }
    }
  ],
  "flow": [],
  "states": { "bg": "#fcf8ee", "txt": "light mode" },
  "animation": [
    {
      "step": "暗い配色へ",
      "duration": 1.5,
      "focus": ["theme"],
      "set": { "bg": "#1a1408", "txt": "dark mode" }
    },
    {
      "step": "明るい配色へ",
      "duration": 1.5,
      "focus": ["theme"],
      "set": { "bg": "#fcf8ee", "txt": "light mode" }
    }
  ]
}`;

export const sourceYaml__partsBind5DigitCounter = `title: "bind: 5-digit counter — 5 state で桁ごと独立 tween"
type: flow

lanes:
  l1: { x: 0, width: 100 }
  l2: { x: 120, width: 100 }
  l3: { x: 240, width: 100 }
  l4: { x: 360, width: 100 }
  l5: { x: 480, width: 100 }

states:
  d1: 0
  d2: 0
  d3: 0
  d4: 0
  d5: 0

actors:
  - {d1}: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "万", posW: 90, posH: 200, shape: { kind: rect, source: "{d1}", fillMax: 9, orient: up, fill: "#a66a3d", radius: 4 } }
  - {d2}: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "千", posW: 90, posH: 200, shape: { kind: rect, source: "{d2}", fillMax: 9, orient: up, fill: "#a66a3d", radius: 4 } }
  - {d3}: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "百", posW: 90, posH: 200, shape: { kind: rect, source: "{d3}", fillMax: 9, orient: up, fill: "#a66a3d", radius: 4 } }
  - {d4}: { kind: dyn-rect, lane: l4, stack: 0, subtitle: "十", posW: 90, posH: 200, shape: { kind: rect, source: "{d4}", fillMax: 9, orient: up, fill: "#a66a3d", radius: 4 } }
  - {d5}: { kind: dyn-rect, lane: l5, stack: 0, subtitle: "一", posW: 90, posH: 200, shape: { kind: rect, source: "{d5}", fillMax: 9, orient: up, fill: "#a66a3d", radius: 4 } }

animation:
  - step: "12345 到達" 4s
    focus: ["{d1}", "{d2}", "{d3}", "{d4}", "{d5}"]
    tween:
      d1: 0 -> 1
      d2: 0 -> 2
      d3: 0 -> 3
      d4: 0 -> 4
      d5: 0 -> 5
`;

export const sourceJson__partsBind5DigitCounter = `{
  "title": "bind: 5-digit counter — 5 state で桁ごと独立 tween",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 100 },
    "l2": { "x": 120, "width": 100 },
    "l3": { "x": 240, "width": 100 },
    "l4": { "x": 360, "width": 100 },
    "l5": { "x": 480, "width": 100 }
  },
  "actors": [
    {
      "name": "{d1}",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "万",
      "posW": 90,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{d1}",
        "fillMax": 9,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      }
    },
    {
      "name": "{d2}",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "千",
      "posW": 90,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{d2}",
        "fillMax": 9,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      }
    },
    {
      "name": "{d3}",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "百",
      "posW": 90,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{d3}",
        "fillMax": 9,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      }
    },
    {
      "name": "{d4}",
      "kind": "dyn-rect",
      "lane": "l4",
      "stack": 0,
      "subtitle": "十",
      "posW": 90,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{d4}",
        "fillMax": 9,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      }
    },
    {
      "name": "{d5}",
      "kind": "dyn-rect",
      "lane": "l5",
      "stack": 0,
      "subtitle": "一",
      "posW": 90,
      "posH": 200,
      "shape": {
        "kind": "rect",
        "source": "{d5}",
        "fillMax": 9,
        "orient": "up",
        "fill": "#a66a3d",
        "radius": 4
      }
    }
  ],
  "flow": [],
  "states": { "d1": 0, "d2": 0, "d3": 0, "d4": 0, "d5": 0 },
  "animation": [
    {
      "step": "12345 到達",
      "duration": 4,
      "focus": ["{d1}", "{d2}", "{d3}", "{d4}", "{d5}"],
      "tween": { "d1": [0, 1], "d2": [0, 2], "d3": [0, 3], "d4": [0, 4], "d5": [0, 5] }
    }
  ]
}`;

export const sourceYaml__partsBindGrowShrink = `title: "bind: grow+shrink — 上昇 → 下降の逆向 chain (呼吸)"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  r: 40

actors:
  - breath: { kind: dyn-circle, lane: l, stack: 0, subtitle: "半径 {r}", posW: 340, posH: 340, shape: { kind: circle, radius: "{r}", fill: "#4e9dc4" } }

animation:
  - step: "吸う" 1.8s
    focus: ["breath"]
    tween:
      r: 40 -> 150
  - step: "吐く" 1.8s
    focus: ["breath"]
    tween:
      r: 150 -> 40
`;

export const sourceJson__partsBindGrowShrink = `{
  "title": "bind: grow+shrink — 上昇 → 下降の逆向 chain (呼吸)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "breath",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "半径 {r}",
      "posW": 340,
      "posH": 340,
      "shape": { "kind": "circle", "radius": "{r}", "fill": "#4e9dc4" }
    }
  ],
  "flow": [],
  "states": { "r": 40 },
  "animation": [
    {
      "step": "吸う",
      "duration": 1.8,
      "focus": ["breath"],
      "tween": { "r": [40, 150] }
    },
    {
      "step": "吐く",
      "duration": 1.8,
      "focus": ["breath"],
      "tween": { "r": [150, 40] }
    }
  ]
}`;

export const sourceYaml__partsBindComprehensive = `title: "bind: 総合 story — 7 state 5 phase を 3 shape に bind した完成形 demo"
type: flow

lanes:
  la: { x: 0, width: 260 }
  lb: { x: 280, width: 260 }
  lc: { x: 560, width: 260 }

states:
  cpu: 15
  mem: 30
  net: 5
  cpuC: "#22c55e"
  memC: "#22c55e"
  netC: "#22c55e"
  status: "healthy"

actors:
  - CPU: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{cpu}% ({status})", posW: 240, posH: 380, shape: { kind: rect, source: "{cpu}", fillMax: 100, orient: up, fill: "{cpuC}", radius: 8 } }
  - MEM: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{mem}%", posW: 240, posH: 380, shape: { kind: rect, source: "{mem}", fillMax: 100, orient: up, fill: "{memC}", radius: 8 } }
  - NET: { kind: dyn-rect, lane: lc, stack: 0, subtitle: "{net} Mbps", posW: 240, posH: 380, shape: { kind: rect, source: "{net}", fillMax: 100, orient: up, fill: "{netC}", radius: 8 } }

animation:
  - step: "負荷が上がる" 1.2s
    focus: ["CPU", "MEM", "NET"]
    tween:
      cpu: 15 -> 60
      mem: 30 -> 55
      net: 5 -> 40
  - step: "注意" 1.2s
    focus: ["CPU", "MEM", "NET"]
    tween:
      cpu: 60 -> 82
    set:
      cpuC: "#f59e0b"
      status: "warning"
  - step: "危険" 1.2s
    focus: ["CPU", "MEM", "NET"]
    tween:
      cpu: 82 -> 95
    set:
      cpuC: "#dc2626"
      memC: "#f59e0b"
      status: "critical"
  - step: "回復開始" 1.2s
    focus: ["CPU", "MEM", "NET"]
    tween:
      cpu: 95 -> 40
      mem: 55 -> 35
    set:
      cpuC: "#22c55e"
      memC: "#22c55e"
      status: "recovering"
  - step: "平常復帰" 1.2s
    focus: ["CPU", "MEM", "NET"]
    set:
      status: "healthy"
`;

export const sourceJson__partsBindComprehensive = `{
  "title": "bind: 総合 story — 7 state 5 phase を 3 shape に bind した完成形 demo",
  "type": "flow",
  "lanes": {
    "la": { "x": 0, "width": 260 },
    "lb": { "x": 280, "width": 260 },
    "lc": { "x": 560, "width": 260 }
  },
  "actors": [
    {
      "name": "CPU",
      "kind": "dyn-rect",
      "lane": "la",
      "stack": 0,
      "subtitle": "{cpu}% ({status})",
      "posW": 240,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{cpu}",
        "fillMax": 100,
        "orient": "up",
        "fill": "{cpuC}",
        "radius": 8
      }
    },
    {
      "name": "MEM",
      "kind": "dyn-rect",
      "lane": "lb",
      "stack": 0,
      "subtitle": "{mem}%",
      "posW": 240,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{mem}",
        "fillMax": 100,
        "orient": "up",
        "fill": "{memC}",
        "radius": 8
      }
    },
    {
      "name": "NET",
      "kind": "dyn-rect",
      "lane": "lc",
      "stack": 0,
      "subtitle": "{net} Mbps",
      "posW": 240,
      "posH": 380,
      "shape": {
        "kind": "rect",
        "source": "{net}",
        "fillMax": 100,
        "orient": "up",
        "fill": "{netC}",
        "radius": 8
      }
    }
  ],
  "flow": [],
  "states": {
    "cpu": 15,
    "mem": 30,
    "net": 5,
    "cpuC": "#22c55e",
    "memC": "#22c55e",
    "netC": "#22c55e",
    "status": "healthy"
  },
  "animation": [
    {
      "step": "負荷が上がる",
      "duration": 1.2,
      "focus": ["CPU", "MEM", "NET"],
      "tween": { "cpu": [15, 60], "mem": [30, 55], "net": [5, 40] }
    },
    {
      "step": "注意",
      "duration": 1.2,
      "focus": ["CPU", "MEM", "NET"],
      "tween": { "cpu": [60, 82] },
      "set": { "cpuC": "#f59e0b", "status": "warning" }
    },
    {
      "step": "危険",
      "duration": 1.2,
      "focus": ["CPU", "MEM", "NET"],
      "tween": { "cpu": [82, 95] },
      "set": { "cpuC": "#dc2626", "memC": "#f59e0b", "status": "critical" }
    },
    {
      "step": "回復開始",
      "duration": 1.2,
      "focus": ["CPU", "MEM", "NET"],
      "tween": { "cpu": [95, 40], "mem": [55, 35] },
      "set": { "cpuC": "#22c55e", "memC": "#22c55e", "status": "recovering" }
    },
    {
      "step": "平常復帰",
      "duration": 1.2,
      "focus": ["CPU", "MEM", "NET"],
      "set": { "status": "healthy" }
    }
  ]
}`;
