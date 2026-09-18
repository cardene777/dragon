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
// parts 2: 縦に積んだ層の棒 (合計値の内訳)
// ============================================================
export const partsStackedLayer = diagram("parts-stacked-layer", {
  topic: "縦に積んだ層の棒 — 合計値の内訳",
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
// parts 3: 状態の指標 (色遷移する大 circle)
// ============================================================
export const partsStateIndicator = diagram("parts-state-indicator", {
  structuredData: "exclude",
  topic: "状態の指標 — 単一大 shape の色で状態表現",
})
  .lane("l", { x: 0, width: 380 })
  .state("stFill", { initial: "#22c55e" })
  .state("lvl", { initial: 0 })
  .node("ind", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "現在の状態",
    subtitle: "稼働中",
    w: 360,
    h: 380,
    shape: { kind: "circle", radius: 140, fillProgress: "{lvl}", fill: "{stFill}" },
  })
  .phase("p", { duration: 3000, title: "状態が立ち上がる", body: "" }, (p: PhaseBuilder) =>
    p.activate("ind").tween("lvl", 0, 1),
  )
  .build();

// ============================================================
// parts 4: 横に伸びる進捗の棒 (fill が左→右)
// ============================================================
export const partsHorizontalBar = diagram("parts-horizontal-bar", {
  structuredData: "exclude",
  topic: "横に伸びる進捗の棒 — 左→右に fill",
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
// parts 5: 円弧のゲージ (円弧 % 表現)
// ============================================================
export const partsArcGauge = diagram("parts-arc-gauge", {
  structuredData: "exclude",
  topic: "円弧のゲージ — 円弧で 0-100% 表現",
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
// parts 6: 件数の表示 (actor + subtitle template)
// ============================================================
export const partsCounterActor = diagram("parts-counter-actor", {
  structuredData: "exclude",
  topic: "件数の表示 — 数値 live",
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
// parts 7: 3灯の信号機 (縦積み 3 circle)
// ============================================================
export const partsTrafficLightStack = diagram("parts-traffic-light-stack", {
  topic: "3灯の信号機 — 縦積み circle で状態表示",
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
// parts 8: 円の大きさ比べ (radius が signal)
// ============================================================
export const partsCircleSizeRace = diagram("parts-circle-size-race", {
  topic: "円の大きさ比べ — radius で強さ比較",
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
    subtitle: "得点 {sa}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sa}", fill: "#a08870" },
  })
  .node("cB", {
    lane: "b",
    stack: 0,
    kind: "dyn-circle",
    title: "B",
    subtitle: "得点 {sb}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sb}", fill: "#22c55e" },
  })
  .node("cC", {
    lane: "c",
    stack: 0,
    kind: "dyn-circle",
    title: "C",
    subtitle: "得点 {sc}",
    w: 160,
    h: 200,
    shape: { kind: "circle", radius: "{sc}", fill: "#a08870" },
  })
  .phase("p", { duration: 3500, title: "競争", body: "" }, (p: PhaseBuilder) =>
    p.activate("cA", "cB", "cC").tween("sa", 20, 50).tween("sb", 20, 75).tween("sc", 20, 45),
  )
  .build();

// ============================================================
// parts 9: 割合の円 (readout)
// ============================================================
export const partsPercentRing = diagram("parts-percent-ring", {
  structuredData: "exclude",
  topic: "割合の円 — 0-100% を ring 表示",
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
// parts 10: 数え上げ (readout)
// ============================================================
export const partsCountup = diagram("parts-countup", {
  structuredData: "exclude",
  topic: "数え上げ — 数値 live 表示",
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
// parts 11: 矢印の連鎖 (3 node + 2 edge activate)
// ============================================================
export const partsEdgeChain = diagram("parts-edge-chain", {
  topic: "矢印の連鎖 — 3 node 順次 activate + edge",
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
// parts 12: 入れ物の水位 (大 wave rectangle)
// ============================================================
export const partsBucketReservoir = diagram("parts-bucket-reservoir", {
  structuredData: "exclude",
  topic: "入れ物の水位 — 大 wave rectangle 容器",
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
// parts 13: 小さな折れ線 (readout、 履歴 trend)
// ============================================================
export const partsSparkline = diagram("parts-sparkline", {
  structuredData: "exclude",
  topic: "小さな折れ線 — 数値履歴 trend",
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
// parts 14: 内訳の輪 (readout、 N segment pie)
// ============================================================
export const partsDonut = diagram("parts-donut", {
  structuredData: "exclude",
  topic: "内訳の輪 — N segment 割合表示",
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
// parts 16: 段取りの進捗 (readout、 wizard step)
// ============================================================
export const partsStepProgress = diagram("parts-step-progress", {
  structuredData: "exclude",
  topic: "段取りの進捗 — 番号付き wizard step",
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
// parts 17: 状態を示す点 (readout、 状態別色)
// ============================================================
export const partsStatusDot = diagram("parts-status-dot", {
  structuredData: "exclude",
  topic: "状態を示す点 — 小 dot で状態表示",
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
// parts 20: 時系列の帯 (readout、 時系列 status band)
// ============================================================
export const partsTimelineStrip = diagram("parts-timeline-strip", {
  structuredData: "exclude",
  topic: "時系列の帯 — 時系列 status band",
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
// parts 21: 電池残量 (dyn-rect + subtitle live)
// ============================================================
export const partsBatteryLevel = diagram("parts-battery-level", {
  structuredData: "exclude",
  topic: "電池残量 — 縦 fill で残量 metaphor",
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
// parts 24: 星の評価 (5 dyn-circle で 5 段階中 3 fill)
// ============================================================
export const partsRatingStars = diagram("parts-rating-stars", {
  topic: "星の評価 — 5 段階中 fill 表示",
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
// parts 25: 2つの値を比べる棒 (A vs B、 2 dyn-rect 横並び)
// ============================================================
export const partsComparisonBars = diagram("parts-comparison-bars", {
  structuredData: "exclude",
  topic: "2つの値を比べる棒 — A vs B の数値比較",
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
// parts 26: 入と切の切替 (2 state 色 + 位置 metaphor)
// ============================================================
export const partsToggleSwitch = diagram("parts-toggle-switch", {
  structuredData: "exclude",
  topic: "入と切の切替 — on/off 状態表示",
})
  .lane("l", { x: 0, width: 400 })
  .state("bg", { initial: "#22c55e" })
  .state("on", { initial: 0 })
  .node("track", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "",
    subtitle: "入",
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
// parts 27: 速度計 (dyn-arc で 0-180 km/h)
// ============================================================
export const partsSpeedometer = diagram("parts-speedometer", {
  structuredData: "exclude",
  topic: "速度計 — 円弧針で速度表示",
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
// parts 28: 未読数の印 (countup + 通知強調)
// ============================================================
export const partsBadgeCount = diagram("parts-badge-count", {
  structuredData: "exclude",
  topic: "未読数の印 — 未読数の visual 強調",
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
// parts 29: 毎秒の件数の指標 (rate の visual 表現)
// ============================================================
export const partsPulseIndicator = diagram("parts-pulse-indicator", {
  structuredData: "exclude",
  topic: "毎秒の件数の指標 — レート visualization",
})
  .lane("l", { x: 0, width: 400 })
  .state("rate", { initial: 5 })
  .node("pulse", {
    lane: "l",
    stack: 0,
    kind: "dyn-wave",
    title: "レート",
    subtitle: "{rate} 件/秒",
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
    title: "メモリ",
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
    title: "通信",
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
// parts 32: 残り時間の円弧 (dyn-arc 円弧が減少)
// ============================================================
export const partsCountdown = diagram("parts-countdown", {
  structuredData: "exclude",
  topic: "残り時間の円弧 — 減っていく秒数",
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
    title: "こんにちは!",
    subtitle: "午前 10:30",
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
// parts 34: 利用者のアイコン (大 dyn-circle)
// ============================================================
export const partsUserAvatar = diagram("parts-user-avatar", {
  structuredData: "exclude",
  topic: "利用者のアイコン — 大円で user icon",
})
  .lane("l", { x: 0, width: 380 })
  .state("bg", { initial: "#4e9dc4" })
  .state("r", { initial: 40 })
  .node("avatar", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "山田",
    subtitle: "山田 太郎",
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
    title: "上り",
    subtitle: "{up} Mbps",
    w: 220,
    h: 340,
    shape: { kind: "rect", source: "{up}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("dnBar", {
    lane: "lb",
    stack: 0,
    kind: "dyn-rect",
    title: "下り",
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
// parts 40: 進捗の点 (3 dot で完了 stage 表示)
// ============================================================
export const partsProgressDots = diagram("parts-progress-dots", {
  topic: "進捗の点 — 3 段階完了表示",
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
// parts 45: 虹色の5段 (5 stack rect で 5 tone tier)
// ============================================================
export const partsRainbowStack = diagram("parts-rainbow-stack", {
  topic: "虹色の5段 — 5 tone tier stack",
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
    title: "階層 1",
    subtitle: "S",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t1}", fillMax: 30, orient: "up", fill: "#dc2626", radius: 4 },
  })
  .node("tier2", {
    lane: "l",
    stack: 1,
    kind: "dyn-rect",
    title: "階層 2",
    subtitle: "A",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t2}", fillMax: 30, orient: "up", fill: "#f59e0b", radius: 4 },
  })
  .node("tier3", {
    lane: "l",
    stack: 2,
    kind: "dyn-rect",
    title: "階層 3",
    subtitle: "B",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t3}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 4 },
  })
  .node("tier4", {
    lane: "l",
    stack: 3,
    kind: "dyn-rect",
    title: "階層 4",
    subtitle: "C",
    w: 320,
    h: 90,
    shape: { kind: "rect", source: "{t4}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 4 },
  })
  .node("tier5", {
    lane: "l",
    stack: 4,
    kind: "dyn-rect",
    title: "階層 5",
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
// parts 46: 買い物かご (数量 subtitle live)
// ============================================================
export const partsShoppingCart = diagram("parts-shopping-cart", {
  structuredData: "exclude",
  topic: "買い物かご — 商品数 live",
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
// parts 48: 現在地の印 (map pin metaphor)
// ============================================================
export const partsLocationPin = diagram("parts-location-pin", {
  structuredData: "exclude",
  topic: "現在地の印 — 現在位置 metaphor",
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
// parts 50: 検索欄 (horizontal rect)
// ============================================================
export const partsSearchBar = diagram("parts-search-bar", {
  structuredData: "exclude",
  topic: "検索欄 — 入力域 metaphor",
})
  .lane("l", { x: 0, width: 700 })
  .state("typed", { initial: 0 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "🔍 検索",
    subtitle: "検索語を入力",
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
// parts 52: しおり (縦 fill)
// ============================================================
export const partsBookmark = diagram("parts-bookmark", {
  structuredData: "exclude",
  topic: "しおり — 保存済み metaphor",
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
// parts 53: 硬貨の残高 (currency countup)
// ============================================================
export const partsCoinBalance = diagram("parts-coin-balance", {
  structuredData: "exclude",
  topic: "硬貨の残高 — currency live",
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
// parts 54: 経験値の棒 (EXP progression)
// ============================================================
export const partsExpBar = diagram("parts-exp-bar", {
  structuredData: "exclude",
  topic: "経験値の棒 — XP progression",
})
  .lane("l", { x: 0, width: 700 })
  .state("xp", { initial: 20 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "経験値 レベル 12",
    subtitle: "{xp}/100 でレベル 13",
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
// parts 56: 割引の札 (割引 badge)
// ============================================================
export const partsSaleTag = diagram("parts-sale-tag", {
  structuredData: "exclude",
  topic: "割引の札 — 割引率 badge",
})
  .lane("l", { x: 0, width: 400 })
  .state("off", { initial: 30 })
  .node("tag", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "セール",
    subtitle: "{off}% 引き",
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
    title: "計数",
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
    title: "脈動",
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
    title: "読み込み",
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
    title: "上の区画",
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
    title: "下の区画",
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
    subtitle: "正常",
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
    title: "水槽",
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
  "水位の値と塗る色の値の 2 つを、1 つの波の絵に当てる";

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
    title: "警報レベル {level}",
    subtitle: "段階 {level}",
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
  "警報の段階の値を段ごとに 1 → 2 → 3 と置き、段階の数と色を切り替える";

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
    title: "要求数",
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
    title: "配色",
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
    title: "呼吸",
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
    title: "メモリ",
    subtitle: "{mem}%",
    w: 240,
    h: 380,
    shape: { kind: "rect", source: "{mem}", fillMax: 100, orient: "up", fill: "{memC}", radius: 8 },
  })
  .node("netG", {
    lane: "lc",
    stack: 0,
    kind: "dyn-rect",
    title: "通信",
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
// 繋ぎ方そのものを表す部品 (#2129)
// ============================================================
//
// ここからの節は **入口と出口を名前で選べる** 部品。 宿主の図から
// `{ toPartNode: <要素の名前> }` / `{ fromPartNode: <要素の名前> }` で繋ぎ先を指す (#1979)。
//
// 要素が 1 つの部品は矢印が自動でそこに付くが、2 つ以上ある部品は名指ししないと矢印が落ちる。
// ここより前の部品は「並べて見せる」 部品 (ゲージ 3 連 / 星 5 つ) で、入口と出口の区別を持たない。
//
// **要素の名前は英字で書く**。 宿主の段が `{部品の名前}__{値の名前}` で中の値を動かすとき、
// 値の名前は英字と `_` しか受け付けない (#2125)。 要素の名前も同じ綴りで書けるほうが、
// 繋ぐ時と動かす時で書き方が割れない。

// parts 81: 振り分け器 — 1 本の流れを 2 つへ分ける
export const partsSplitRouter = diagram("parts-split-router", {
  topic: "振り分け器 — 入口 1 つを 2 つの出口へ分ける",
})
  .lane("sl1", { x: 0, width: 200, label: "入口" })
  .lane("sl2", { x: 220, width: 200, label: "出口" })
  .state("inLv", { initial: 0 })
  .state("aLv", { initial: 0 })
  .state("bLv", { initial: 0 })
  // 入口を 2 つの出口の真ん中の段 (1) に置き、出口 A を 0、出口 B を 2 に置く (#2154)。 合流点も
  // 出口を真ん中に置くので、繋いだ時に出口 A と入口 A、出口 B と入口 B が同じ段に並び、部品どうしの
  // 矢印が真横に引ける。 3 段にして図が縦に伸びる分、箱を 180 から 150 にする (実測 = 繋いだ見本が
  // 1475 × 922 で、拡大の器で箱の題が 15.0px、一覧の器で 13.0px)
  .node("inP", {
    lane: "sl1",
    stack: 1,
    kind: "dyn-rect",
    title: "入口",
    subtitle: "{inLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{inLv}",
      fillMax: 100,
      orient: "up",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("outA", {
    lane: "sl2",
    stack: 0,
    kind: "dyn-rect",
    title: "出口 A",
    subtitle: "{aLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{aLv}",
      fillMax: 100,
      orient: "up",
      fill: "#22c55e",
      radius: 6,
    },
  })
  .node("outB", {
    lane: "sl2",
    stack: 2,
    kind: "dyn-rect",
    title: "出口 B",
    subtitle: "{bLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{bLv}",
      fillMax: 100,
      orient: "up",
      fill: "#f59e0b",
      radius: 6,
    },
  })
  // 札は割合の数字ではなく向きの言葉にする (#2149)。 繋いだ先の部品が別の割合で書いた札と
  // 食い違うため。 割合は箱の上の読み取り (`70 / 100`) に出る
  .edge("inP", "outA", { id: "sr-a", label: "A へ", tone: "success" })
  .edge("inP", "outB", { id: "sr-b", label: "B へ", tone: "warning" })
  .phase("p", { duration: 4000, title: "2 つへ分かれる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "outA", "outB", "sr-a", "sr-b")
      .tween("inLv", 0, 100)
      .tween("aLv", 0, 70)
      .tween("bLv", 0, 30),
  )
  .build();

export const subtitle__partsSplitRouter =
  "入口 1 つを 2 つの出口へ分ける。 分けた割合が両方の棒に出る";

// parts 82: 合流点 — 2 本の流れを 1 つへ集める
export const partsMergeJunction = diagram("parts-merge-junction", {
  topic: "合流点 — 入口 2 つを 1 つの出口へ集める",
})
  .lane("ml1", { x: 0, width: 200, label: "入口" })
  .lane("ml2", { x: 220, width: 200, label: "出口" })
  .state("aLv", { initial: 0 })
  .state("bLv", { initial: 0 })
  .state("sumLv", { initial: 0 })
  // 出口を 2 つの入口の真ん中の段 (1) に置く (#2154)。 入口 A と同じ段に置くと、描画側が同じ辺に入る
  // 2 本の終点を辺に沿って離すため、真横に入るはずの線が出口の手前で 28 の小さな段を作っていた
  // (実測 = `M 210 218 L 250 218 L 250 190 L 438 190`)。 真ん中に置けば 2 本が上下対称に折れて入る。
  // 箱の大きさは振り分け器と揃える
  .node("inA", {
    lane: "ml1",
    stack: 0,
    kind: "dyn-rect",
    title: "入口 A",
    subtitle: "{aLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{aLv}",
      fillMax: 100,
      orient: "up",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("inB", {
    lane: "ml1",
    stack: 2,
    kind: "dyn-rect",
    title: "入口 B",
    subtitle: "{bLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{bLv}",
      fillMax: 100,
      orient: "up",
      fill: "#8b5cf6",
      radius: 6,
    },
  })
  .node("outP", {
    lane: "ml2",
    stack: 1,
    kind: "dyn-rect",
    title: "出口",
    subtitle: "{sumLv}%",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{sumLv}",
      fillMax: 100,
      orient: "up",
      fill: "#22c55e",
      radius: 6,
    },
  })
  // 札は割合の数字ではなく働きの言葉にする (#2149)。 振り分け器と同じ理由。 「A から」 は
  // 3 字を超え、繋いだ図の縦列の間隔を全て広げて一覧の器で箱の題が 12px を割る (実測 11.6px)
  .edge("inA", "outP", { id: "mj-a", label: "足す", tone: "info" })
  .edge("inB", "outP", { id: "mj-b", label: "足す", tone: "info" })
  .phase("p", { duration: 4000, title: "1 つへ集まる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inA", "inB", "outP", "mj-a", "mj-b")
      .tween("aLv", 0, 60)
      .tween("bLv", 0, 40)
      .tween("sumLv", 0, 100),
  )
  .build();

export const subtitle__partsMergeJunction =
  "入口 2 つを 1 つの出口へ集める。 合計が出口の棒に出る";

// parts 83: 待ち行列の深さ — 入る量と出る量の差が溜まる
export const partsQueueDepth = diagram("parts-queue-depth", {
  topic: "待ち行列の深さ — 入る量と出る量の差が中央に溜まる",
})
  .lane("ql1", { x: 0, width: 180, label: "入る" })
  .lane("ql2", { x: 200, width: 200, label: "待ち" })
  .lane("ql3", { x: 420, width: 180, label: "出る" })
  .state("inRate", { initial: 12 })
  .state("depth", { initial: 0 })
  .state("outRate", { initial: 5 })
  .node("qIn", {
    lane: "ql1",
    stack: 0,
    kind: "dyn-rect",
    title: "入る",
    subtitle: "{inRate} 件/秒",
    w: 160,
    h: 320,
    shape: {
      kind: "rect",
      source: "{inRate}",
      fillMax: 20,
      orient: "up",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("qBody", {
    lane: "ql2",
    stack: 0,
    kind: "dyn-rect",
    title: "待ち行列",
    subtitle: "{depth} 件",
    w: 180,
    h: 320,
    shape: {
      kind: "rect",
      source: "{depth}",
      fillMax: 50,
      orient: "up",
      fill: "#f59e0b",
      radius: 6,
    },
  })
  .node("qOut", {
    lane: "ql3",
    stack: 0,
    kind: "dyn-rect",
    title: "出る",
    subtitle: "{outRate} 件/秒",
    w: 160,
    h: 320,
    shape: {
      kind: "rect",
      source: "{outRate}",
      fillMax: 20,
      orient: "up",
      fill: "#22c55e",
      radius: 6,
    },
  })
  .edge("qIn", "qBody", { id: "qd-in", label: "届く", tone: "info" })
  .edge("qBody", "qOut", { id: "qd-out", label: "捌く", tone: "success" })
  .phase("p", { duration: 4000, title: "捌ききれず溜まる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("qIn", "qBody", "qOut", "qd-in", "qd-out")
      .tween("depth", 0, 38)
      .tween("outRate", 5, 9),
  )
  .build();

export const subtitle__partsQueueDepth =
  "入る量と出る量の差が中央に溜まる。 捌く速さを上げても残りは増え続ける";

// parts 84: 弁の開き — 開度で通る量が決まる
export const partsValveFlow = diagram("parts-valve-flow", {
  topic: "弁の開き — 中央の開度で出口の量が決まる",
})
  .lane("vl1", { x: 0, width: 180, label: "元の流れ" })
  .lane("vl2", { x: 200, width: 220, label: "弁" })
  .lane("vl3", { x: 440, width: 180, label: "通った量" })
  .state("inF", { initial: 100 })
  .state("open", { initial: 0 })
  .state("outF", { initial: 0 })
  .node("vIn", {
    lane: "vl1",
    stack: 0,
    kind: "dyn-rect",
    title: "元の流れ",
    subtitle: "{inF}%",
    w: 160,
    h: 280,
    shape: {
      kind: "rect",
      source: "{inF}",
      fillMax: 100,
      orient: "up",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("vGate", {
    lane: "vl2",
    stack: 0,
    kind: "dyn-arc",
    title: "弁",
    subtitle: "開き {open}%",
    w: 200,
    h: 280,
    shape: {
      kind: "arc",
      angle: "{open}",
      sweepMax: 100,
      outerRadius: 90,
      innerRadius: 55,
      fill: "#f59e0b",
    },
  })
  .node("vOut", {
    lane: "vl3",
    stack: 0,
    kind: "dyn-rect",
    title: "通った量",
    subtitle: "{outF}%",
    w: 160,
    h: 280,
    shape: {
      kind: "rect",
      source: "{outF}",
      fillMax: 100,
      orient: "up",
      fill: "#22c55e",
      radius: 6,
    },
  })
  .edge("vIn", "vGate", { id: "vf-in", label: "押す", tone: "info" })
  .edge("vGate", "vOut", { id: "vf-out", label: "通る", tone: "success" })
  .phase("p", { duration: 4000, title: "弁を開ける", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("vIn", "vGate", "vOut", "vf-in", "vf-out")
      .tween("open", 0, 65)
      .tween("outF", 0, 65),
  )
  .build();

export const subtitle__partsValveFlow =
  "中央の弁の開きで、出口へ通る量が決まる";

// parts 85: 三段の漏斗 — 段ごとに幅と数が減る
export const partsFunnel3 = diagram("parts-funnel-3", {
  topic: "三段の漏斗 — 段ごとに幅が狭くなり残る数が減る",
})
  .lane("fl", { x: 0, width: 380, label: "訪問から購入まで" })
  .state("tN", { initial: 0 })
  .state("mN", { initial: 0 })
  .state("bN", { initial: 0 })
  .node("fTop", {
    lane: "fl",
    stack: 0,
    kind: "dyn-rect",
    title: "訪れた人",
    subtitle: "{tN}%",
    w: 360,
    h: 130,
    shape: {
      kind: "rect",
      source: "{tN}",
      fillMax: 100,
      orient: "right",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("fMid", {
    lane: "fl",
    stack: 1,
    kind: "dyn-rect",
    title: "登録した人",
    subtitle: "{mN}%",
    w: 260,
    h: 130,
    shape: {
      kind: "rect",
      source: "{mN}",
      fillMax: 100,
      orient: "right",
      fill: "#8b5cf6",
      radius: 6,
    },
  })
  .node("fBot", {
    lane: "fl",
    stack: 2,
    kind: "dyn-rect",
    title: "買った人",
    subtitle: "{bN}%",
    w: 160,
    h: 130,
    shape: {
      kind: "rect",
      source: "{bN}",
      fillMax: 100,
      orient: "right",
      fill: "#22c55e",
      radius: 6,
    },
  })
  .edge("fTop", "fMid", { id: "fn-1", label: "6 割が残る", tone: "info" })
  .edge("fMid", "fBot", { id: "fn-2", label: "4 割が残る", tone: "success" })
  .phase("p", { duration: 4000, title: "段ごとに絞られる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("fTop", "fMid", "fBot", "fn-1", "fn-2")
      .tween("tN", 0, 100)
      .tween("mN", 0, 62)
      .tween("bN", 0, 24),
  )
  .build();

export const subtitle__partsFunnel3 =
  "上から下へ 3 段で絞る。 段ごとに箱の幅と残る割合が減る";

// parts 86: 小さな網 — 2 つの経路で 4 点を結ぶ
export const partsMiniNetwork = diagram("parts-mini-network", {
  topic: "小さな網 — 起点から終点まで 2 つの経路が並ぶ",
})
  .lane("nl1", { x: 0, width: 200, label: "起点" })
  .lane("nl2", { x: 220, width: 200, label: "中継" })
  .lane("nl3", { x: 440, width: 200, label: "終点" })
  .state("p1", { initial: 0 })
  .state("p2", { initial: 0 })
  .state("p3", { initial: 0 })
  .state("p4", { initial: 0 })
  // 起点と終点を上下の中継の真ん中の段 (1) に置き、上の中継を 0、下の中継を 2 に置く (#2154)。
  // 終点を上の中継と同じ段に置くと、描画側が同じ辺に入る 2 本の終点を辺に沿って離すため、
  // 上の中継からの線が終点の手前で 28 の小さな段を作っていた (実測 = `M 642 218 L 682 218 L 682 190 L 894 190`)
  .node("nw1", {
    lane: "nl1",
    stack: 1,
    kind: "dyn-circle",
    title: "起点",
    subtitle: "{p1}",
    w: 180,
    h: 180,
    shape: { kind: "circle", radius: 70, fillProgress: "{p1}", fill: "#4e9dc4" },
  })
  .node("nw2", {
    lane: "nl2",
    stack: 0,
    kind: "dyn-circle",
    title: "上の中継",
    subtitle: "{p2}",
    w: 180,
    h: 180,
    shape: { kind: "circle", radius: 70, fillProgress: "{p2}", fill: "#8b5cf6" },
  })
  .node("nw3", {
    lane: "nl2",
    stack: 2,
    kind: "dyn-circle",
    title: "下の中継",
    subtitle: "{p3}",
    w: 180,
    h: 180,
    shape: { kind: "circle", radius: 70, fillProgress: "{p3}", fill: "#f59e0b" },
  })
  .node("nw4", {
    lane: "nl3",
    stack: 1,
    kind: "dyn-circle",
    title: "終点",
    subtitle: "{p4}",
    w: 180,
    h: 180,
    shape: { kind: "circle", radius: 70, fillProgress: "{p4}", fill: "#22c55e" },
  })
  .edge("nw1", "nw2", { id: "mn-12", label: "上の道", tone: "info" })
  .edge("nw1", "nw3", { id: "mn-13", label: "下の道", tone: "warning" })
  .edge("nw2", "nw4", { id: "mn-24", label: "合流", tone: "info" })
  .edge("nw3", "nw4", { id: "mn-34", label: "合流", tone: "warning" })
  .phase("p", { duration: 4000, title: "2 つの道を通る", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("nw1", "nw2", "nw3", "nw4", "mn-12", "mn-13", "mn-24", "mn-34")
      .tween("p1", 0, 1)
      .tween("p2", 0, 1)
      .tween("p3", 0, 1)
      .tween("p4", 0, 1),
  )
  .build();

export const subtitle__partsMiniNetwork =
  "起点から終点まで、上下 2 つの経路を並べて見せる";

// parts 87: 負荷分散器 — 1 本の流れを 3 つへ同じ量ずつ配る
export const partsLoadBalancer = diagram("parts-load-balancer", {
  topic: "負荷分散器 — 入口 1 つを 3 つの出口へ同じ量ずつ配る",
})
  .lane("lb1", { x: 0, width: 200, label: "入口" })
  .lane("lb2", { x: 220, width: 200, label: "配る先" })
  .state("inLv", { initial: 0 })
  .state("o1", { initial: 0 })
  .state("o2", { initial: 0 })
  .state("o3", { initial: 0 })
  // 入口を 3 つの出口の真ん中の段 (1) に置く (#2154)。 端の段に置くと 3 本のうち 2 本が同じ向きへ
  // 折れ、配る先が揃っていることが絵から読めない。 出口の目盛りは 3 つとも入口と同じ 90 にする =
  // 3 つの棒が入口の 3 分の 1 まで伸びる形で「同じ量ずつ」 が出る
  .node("inP", {
    lane: "lb1",
    stack: 1,
    kind: "dyn-rect",
    title: "入口",
    subtitle: "{inLv} 件/秒",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inLv}", fillMax: 90, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("out1", {
    lane: "lb2",
    stack: 0,
    kind: "dyn-rect",
    title: "出口 1",
    subtitle: "{o1} 件/秒",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{o1}", fillMax: 90, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("out2", {
    lane: "lb2",
    stack: 1,
    kind: "dyn-rect",
    title: "出口 2",
    subtitle: "{o2} 件/秒",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{o2}", fillMax: 90, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("out3", {
    lane: "lb2",
    stack: 2,
    kind: "dyn-rect",
    title: "出口 3",
    subtitle: "{o3} 件/秒",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{o3}", fillMax: 90, orient: "up", fill: "#22c55e", radius: 6 },
  })
  // 札は出口の番号ではなく向きの言葉にする (#2149)。 繋いで使う部品の中の札に数字を書くと、
  // 渡した先の部品が別の数字を書いた時に絵の中で食い違う。 どの出口かは箱の並びで読める
  .edge("inP", "out1", { id: "lb-1", label: "上へ", tone: "success" })
  .edge("inP", "out2", { id: "lb-2", label: "中へ", tone: "success" })
  .edge("inP", "out3", { id: "lb-3", label: "下へ", tone: "success" })
  .phase("p", { duration: 4000, title: "3 つへ同じ量ずつ配る", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "out1", "out2", "out3", "lb-1", "lb-2", "lb-3")
      .tween("inLv", 0, 90)
      .tween("o1", 0, 30)
      .tween("o2", 0, 30)
      .tween("o3", 0, 30),
  )
  .build();

export const subtitle__partsLoadBalancer =
  "入口の 90 件/秒を 3 つの出口へ 30 件/秒ずつ配る。 配った後も合計は変わらない";

// parts 88: 複製器 — 1 つの中身を 3 つの受け手へ同じまま写す
export const partsFanoutCopy = diagram("parts-fanout-copy", {
  topic: "複製器 — 発行した中身を 3 つの受け手へ同じまま写す",
})
  .lane("fc1", { x: 0, width: 200, label: "発行" })
  .lane("fc2", { x: 220, width: 200, label: "受け手" })
  .state("pub", { initial: 0 })
  .state("s1", { initial: 0 })
  .state("s2", { initial: 0 })
  .state("s3", { initial: 0 })
  // 配る部品 (`load-balancer`) と同じ並べ方にして、値だけを変える = 3 つの棒が発行と同じ高さまで
  // 伸びるので、「分ける」 と「写す」 の違いが 2 枚を見比べた時に値から読める
  .node("pubP", {
    lane: "fc1",
    stack: 1,
    kind: "dyn-rect",
    title: "発行",
    subtitle: "{pub} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{pub}", fillMax: 100, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .node("sub1", {
    lane: "fc2",
    stack: 0,
    kind: "dyn-rect",
    title: "受け手 1",
    subtitle: "{s1} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{s1}", fillMax: 100, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .node("sub2", {
    lane: "fc2",
    stack: 1,
    kind: "dyn-rect",
    title: "受け手 2",
    subtitle: "{s2} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{s2}", fillMax: 100, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .node("sub3", {
    lane: "fc2",
    stack: 2,
    kind: "dyn-rect",
    title: "受け手 3",
    subtitle: "{s3} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{s3}", fillMax: 100, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .edge("pubP", "sub1", { id: "fc-1", label: "写す", tone: "accent" })
  .edge("pubP", "sub2", { id: "fc-2", label: "写す", tone: "accent" })
  .edge("pubP", "sub3", { id: "fc-3", label: "写す", tone: "accent" })
  .phase("p", { duration: 4000, title: "全員へ同じものを写す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("pubP", "sub1", "sub2", "sub3", "fc-1", "fc-2", "fc-3")
      .tween("pub", 0, 100)
      .tween("s1", 0, 100)
      .tween("s2", 0, 100)
      .tween("s3", 0, 100),
  )
  .build();

export const subtitle__partsFanoutCopy =
  "発行した 100 件が 3 つの受け手へ 100 件ずつ届く。 配る部品と違い、受け手の数だけ合計が増える";

// parts 89: 流量制限 — 札の数だけ通し、超えた分を断る
export const partsRateLimiter = diagram("parts-rate-limiter", {
  topic: "流量制限 — 札の数だけ通し、札が尽きた分を断る",
})
  .lane("rl1", { x: 0, width: 200, label: "届く" })
  .lane("rl2", { x: 220, width: 200, label: "札" })
  .lane("rl3", { x: 440, width: 200, label: "行き先" })
  .state("inN", { initial: 0 })
  .state("tokens", { initial: 10 })
  .state("passN", { initial: 0 })
  .state("rejectN", { initial: 0 })
  // 通す先を届く箱と同じ段 (0) に置き、断る先だけを下の段に落とす。 通る道が真横の 1 本になり、
  // 断る道が本筋から外れる形で出る。 断る先へ入る線は 1 本だけなので終点は離れない (#2154)
  .node("inP", {
    lane: "rl1",
    stack: 0,
    kind: "dyn-rect",
    title: "届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 16, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("bucket", {
    lane: "rl2",
    stack: 0,
    kind: "dyn-rect",
    title: "札",
    subtitle: "残り {tokens} 枚",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{tokens}", fillMax: 10, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("pass", {
    lane: "rl3",
    stack: 0,
    kind: "dyn-rect",
    title: "通す",
    subtitle: "{passN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{passN}", fillMax: 16, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("reject", {
    lane: "rl3",
    stack: 1,
    kind: "dyn-rect",
    title: "断る",
    subtitle: "{rejectN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{rejectN}", fillMax: 16, orient: "up", fill: "#dc2626", radius: 6 },
  })
  .edge("inP", "bucket", { id: "rl-in", label: "1 枚ずつ", tone: "info" })
  .edge("bucket", "pass", { id: "rl-pass", label: "通す", tone: "success" })
  .edge("bucket", "reject", { id: "rl-reject", label: "断る", tone: "error" })
  .phase("p", { duration: 4000, title: "札の数だけ通す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "bucket", "pass", "reject", "rl-in", "rl-pass", "rl-reject")
      .tween("inN", 0, 16)
      .tween("tokens", 10, 0)
      .tween("passN", 0, 10)
      .tween("rejectN", 0, 6),
  )
  .build();

export const subtitle__partsRateLimiter =
  "届いた 16 件のうち、札 10 枚が尽きるまでの 10 件を通し、残る 6 件を断る";

// parts 90: 優先度の並べ替え — 急ぎと通常を 1 列に並べ、急ぎを先に出す
export const partsPriorityQueue = diagram("parts-priority-queue", {
  topic: "優先度の並べ替え — 急ぎと通常を 1 列に並べ、急ぎを先に出す",
})
  .lane("pq1", { x: 0, width: 200, label: "届く" })
  .lane("pq2", { x: 220, width: 200, label: "並べる" })
  .lane("pq3", { x: 440, width: 200, label: "出る" })
  .state("hiN", { initial: 0 })
  .state("loN", { initial: 0 })
  .state("depth", { initial: 0 })
  .state("outN", { initial: 0 })
  // 並べる箱を 2 つの入口の真ん中の段 (1) に置く (#2154)。 片方と同じ段に置くと、もう 1 本の線が
  // 並べる箱の手前で小さな段を作る
  .node("hiIn", {
    lane: "pq1",
    stack: 0,
    kind: "dyn-rect",
    title: "急ぎ",
    subtitle: "{hiN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{hiN}", fillMax: 10, orient: "up", fill: "#dc2626", radius: 6 },
  })
  .node("loIn", {
    lane: "pq1",
    stack: 2,
    kind: "dyn-rect",
    title: "通常",
    subtitle: "{loN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{loN}", fillMax: 10, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("queue", {
    lane: "pq2",
    stack: 1,
    kind: "dyn-rect",
    title: "並べる",
    subtitle: "{depth} 件待ち",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{depth}", fillMax: 14, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("outP", {
    lane: "pq3",
    stack: 1,
    kind: "dyn-rect",
    title: "出る",
    subtitle: "{outN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{outN}", fillMax: 14, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .edge("hiIn", "queue", { id: "pq-hi", label: "先に", tone: "error" })
  .edge("loIn", "queue", { id: "pq-lo", label: "後に", tone: "info" })
  .edge("queue", "outP", { id: "pq-out", label: "出す", tone: "success" })
  .phase("p", { duration: 4000, title: "急ぎを先に出す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("hiIn", "loIn", "queue", "outP", "pq-hi", "pq-lo", "pq-out")
      .tween("hiN", 0, 6)
      .tween("loN", 0, 8)
      .tween("depth", 0, 8)
      .tween("outN", 0, 6),
  )
  .build();

export const subtitle__partsPriorityQueue =
  "急ぎ 6 件と通常 8 件が 1 列に並び、急ぎが先に出る。 残る 8 件は通常の待ち";

// ============================================================
// 前へ進むだけではない繋ぎ方の部品 (#2171)
// ============================================================
//
// ここからの節は **入った分が前へ進むだけではない** 繋ぎ方を表す。 ここより前の繋ぎ方の部品は
// 割合を変えたり数を増やしたりしても、入口から出口へ一方向に流れる形だった。
//
// 倒す (どちらか一方だけへ流す) / 戻す (落ちた分が前の段へ返る) /
// 溜める (1 件ずつ入れて、まとまってから 1 回で出す) / 仕分ける (中身の種類で行き先が変わる)
// の 4 つは、どれも既存の部品では書けない。
//
// 要素と値の名前は繋ぎ方の他の部品と同じく英字で書く (#2125)。

// parts 91: 切替器 — 常用が落ちると予備へ倒れる
export const partsFailoverSwitch = diagram("parts-failover-switch", {
  topic: "切替器 — 常用が落ちると予備へ倒れる",
})
  .lane("fo1", { x: 0, width: 200, label: "入口" })
  .lane("fo2", { x: 220, width: 200, label: "行き先" })
  .state("inLv", { initial: 100 })
  .state("mainLv", { initial: 100 })
  .state("subLv", { initial: 0 })
  // 入口を 2 つの行き先の真ん中の段 (1) に置く (#2154)。 振り分け器と同じ置き方で、
  // 「両方へ分ける」 と「どちらか一方へ倒す」 の違いが棒の高さだけで見比べられる
  .node("inP", {
    lane: "fo1",
    stack: 1,
    kind: "dyn-rect",
    title: "入口",
    subtitle: "{inLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inLv}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("mainO", {
    lane: "fo2",
    stack: 0,
    kind: "dyn-rect",
    title: "常用",
    subtitle: "{mainLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{mainLv}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("subO", {
    lane: "fo2",
    stack: 2,
    kind: "dyn-rect",
    title: "予備",
    subtitle: "{subLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{subLv}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .edge("inP", "mainO", { id: "fo-main", label: "常用へ", tone: "success" })
  .edge("inP", "subO", { id: "fo-sub", label: "倒す", tone: "warning" })
  // 入口は 100% のまま動かさない = 入る量が減ったのではなく行き先が入れ替わったことを見せる
  .phase("p", { duration: 4000, title: "予備へ倒れる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "mainO", "subO", "fo-main", "fo-sub")
      .tween("mainLv", 100, 0)
      .tween("subLv", 0, 100),
  )
  .build();

export const subtitle__partsFailoverSwitch =
  "入口は 100% のまま、常用が 0% まで落ちて予備が 100% まで上がる。 分けるのではなく行き先が入れ替わる";

// parts 92: やり直しの輪 — 落ちた分をもう一度試す
export const partsRetryLoop = diagram("parts-retry-loop", {
  topic: "やり直しの輪 — 落ちた分をもう一度試して通す",
})
  .lane("rt1", { x: 0, width: 200, label: "試す" })
  .lane("rt2", { x: 220, width: 200, label: "結果" })
  .state("tryN", { initial: 0 })
  .state("okN", { initial: 0 })
  .state("ngN", { initial: 0 })
  .state("againN", { initial: 0 })
  // 戻す先を「やり直す」 という別の箱にする。 落ちる箱から試す箱へ直に戻すと、戻る線の名札が
  // 試す箱の 12px まで寄って重い指摘が出る (下限 32px、実測 2 件)。 落ちる箱を試す側の縦列へ
  // 移す形は指摘 0 件になるが、縦列の見出し「試す」 の下に「落ちる」 が並んで読み手が迷う。
  //
  // 通る箱には試す箱とやり直す箱の 2 本が入るので、2 つの出どころの真ん中の段 (1) に置く (#2154)。
  // 試すを段 0、やり直すを段 2 に置くと真ん中が段 1 になる。 段 0 と段 1 の 2 段で組むと真ん中が
  // 無く、線が通る箱の手前で長さ 28 の縦の段を作る (実測)。
  //
  // 落ちる箱は段 2 (やり直す箱と同じ高さ) に置く。 段 0 に置くと、試す箱から入る線と
  // やり直す箱へ出る線が同じ左の辺に並び、描画側が 2 本の端を 56 だけ離して段を作る (実測)。
  // 段 2 なら入る線は上の辺から、出る線は左の辺からになり、辺を分け合わない
  .node("tryP", {
    lane: "rt1",
    stack: 0,
    kind: "dyn-rect",
    title: "試す",
    subtitle: "{tryN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{tryN}", fillMax: 12, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("againP", {
    lane: "rt1",
    stack: 2,
    kind: "dyn-rect",
    title: "やり直す",
    subtitle: "{againN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{againN}", fillMax: 12, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("okP", {
    lane: "rt2",
    stack: 1,
    kind: "dyn-rect",
    title: "通る",
    subtitle: "{okN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{okN}", fillMax: 12, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("ngP", {
    lane: "rt2",
    stack: 2,
    kind: "dyn-rect",
    title: "落ちる",
    subtitle: "{ngN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{ngN}", fillMax: 12, orient: "up", fill: "#dc2626", radius: 6 },
  })
  .edge("tryP", "okP", { id: "rt-ok", label: "通る", tone: "success" })
  .edge("tryP", "ngP", { id: "rt-ng", label: "落ちる", tone: "error" })
  .edge("ngP", "againP", { id: "rt-back", label: "戻す", tone: "warning" })
  .edge("againP", "okP", { id: "rt-again", label: "通る", tone: "success" })
  // 12 件のうち 9 件が通り 3 件が落ちる。 落ちた 3 件をやり直すと通る側が 12 件になり、
  // 数が合う = 戻した分がどこへ行ったかを読み手が追える
  .phase("p", { duration: 4000, title: "落ちた分をもう一度試す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("tryP", "againP", "okP", "ngP", "rt-ok", "rt-ng", "rt-back", "rt-again")
      .tween("tryN", 0, 12)
      .tween("okN", 0, 12)
      .tween("ngN", 0, 3)
      .tween("againN", 0, 3),
  )
  .build();

export const subtitle__partsRetryLoop =
  "12 件のうち 3 件が落ち、その 3 件をやり直して通る側が 12 件に戻る。 落ちた分が前の段へ返る";

// parts 93: まとめ箱 — 1 件ずつ溜めてまとめて送る
export const partsBatchCollector = diagram("parts-batch-collector", {
  topic: "まとめ箱 — 1 件ずつ溜めて、満ちたらまとめて送る",
})
  .lane("bt1", { x: 0, width: 200, label: "溜める" })
  .lane("bt2", { x: 220, width: 200, label: "送る" })
  .state("inN", { initial: 0 })
  .state("poolN", { initial: 0 })
  .state("sendN", { initial: 0 })
  // 届く箱と溜まりを同じ縦列の上下に置く = 「1 件ずつ入る」 と「溜まっている」 が同じ場所で起きる
  .node("inP", {
    lane: "bt1",
    stack: 0,
    kind: "dyn-rect",
    title: "届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("pool", {
    lane: "bt1",
    stack: 1,
    kind: "dyn-rect",
    title: "溜まり",
    subtitle: "{poolN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{poolN}", fillMax: 10, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("sendP", {
    lane: "bt2",
    stack: 1,
    kind: "dyn-rect",
    title: "まとめて送る",
    subtitle: "{sendN} 回",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{sendN}", fillMax: 3, orient: "up", fill: "#22c55e", radius: 6 },
  })
  // 部品の中の線の札に数字を置かない (#2149)。 繋いだ先の部品が別の数を書くと絵の中で食い違う
  .edge("inP", "pool", { id: "bt-in", label: "ひとつずつ", tone: "info" })
  .edge("pool", "sendP", { id: "bt-send", label: "満ちたら", tone: "success" })
  // 出る側の単位は「件」 ではなく「回」。 30 件が 10 件ずつ 3 回で出ることを、右の棒が数える
  .phase("p", { duration: 4000, title: "満ちたら送る", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "pool", "sendP", "bt-in", "bt-send")
      .tween("inN", 0, 30)
      .tween("poolN", 0, 10)
      .tween("sendN", 0, 3),
  )
  .build();

export const subtitle__partsBatchCollector =
  "30 件が 1 件ずつ溜まり、10 件たまるごとに 1 回で出る。 右の棒は件数ではなく送った回数を数える";

// parts 94: 仕分け箱 — 中身の種類で行き先が変わる
export const partsContentSorter = diagram("parts-content-sorter", {
  topic: "仕分け箱 — 中身の種類で 3 つの行き先へ分ける",
})
  .lane("cs1", { x: 0, width: 200, label: "見る" })
  .lane("cs2", { x: 220, width: 200, label: "行き先" })
  .state("inN", { initial: 0 })
  .state("aN", { initial: 0 })
  .state("bN", { initial: 0 })
  .state("cN", { initial: 0 })
  // 見る箱を 3 つの行き先の真ん中の段 (1) に置く (#2154)。 負荷分散器は同じ量ずつ配るが、
  // こちらは種類ごとに数が違う = 3 本の棒の高さが揃わないことが図の中身
  .node("inP", {
    lane: "cs1",
    stack: 1,
    kind: "dyn-rect",
    title: "中身を見る",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 20, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("outA", {
    lane: "cs2",
    stack: 0,
    kind: "dyn-rect",
    title: "注文",
    subtitle: "{aN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{aN}", fillMax: 20, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("outB", {
    lane: "cs2",
    stack: 1,
    kind: "dyn-rect",
    title: "問い合わせ",
    subtitle: "{bN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{bN}", fillMax: 20, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .node("outC", {
    lane: "cs2",
    stack: 2,
    kind: "dyn-rect",
    title: "その他",
    subtitle: "{cN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{cN}", fillMax: 20, orient: "up", fill: "#94a3b8", radius: 6 },
  })
  .edge("inP", "outA", { id: "cs-a", label: "注文", tone: "success" })
  .edge("inP", "outB", { id: "cs-b", label: "問い", tone: "info" })
  .edge("inP", "outC", { id: "cs-c", label: "残り", tone: "warning" })
  .phase("p", { duration: 4000, title: "種類で分ける", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "outA", "outB", "outC", "cs-a", "cs-b", "cs-c")
      .tween("inN", 0, 20)
      .tween("aN", 0, 11)
      .tween("bN", 0, 6)
      .tween("cN", 0, 3),
  )
  .build();

export const subtitle__partsContentSorter =
  "20 件を中身の種類で 3 つへ分ける。 注文 11 件と問い合わせ 6 件とその他 3 件で、棒の高さが揃わない";

// ============================================================
// 入った分をそのまま出さない部品 (#2193)
// ============================================================
//
// ここからの節は **入った分がそのまま出てこない** 繋ぎ方を表す。 ここより前の繋ぎ方の部品は
// 行き先と割合が変わるだけで、入った分はいずれどこかへ出る形だった。
//
// 止める (落ちる分が増えたので送るのをやめる) / 省く (手元に写しがあるので奥まで行かない) /
// 待つ (相手が来るまで出さない) / 捨てる (同じものなので片方を捨てる) の 4 つは、
// どれも既存の部品では書けない。
//
// 要素と値の名前は繋ぎ方の他の部品と同じく英字で書く (#2125)。

// parts 95: 遮断器 — 落ちる分が増えると送るのをやめる
export const partsCircuitBreaker = diagram("parts-circuit-breaker", {
  topic: "遮断器 — 落ちる分が増えると送るのをやめる",
})
  .lane("cb1", { x: 0, width: 200, label: "入口" })
  .lane("cb2", { x: 220, width: 200, label: "結果" })
  .state("inN", { initial: 0 })
  .state("okN", { initial: 0 })
  .state("ngN", { initial: 0 })
  .state("cutN", { initial: 0 })
  // 行き先を 3 つにするのは本部品だけ。 通った分と落ちた分を並べて見せないと、
  // 「落ちる分が増えたから断りに回った」 という順番が図から読めない
  .node("inP", {
    lane: "cb1",
    stack: 1,
    kind: "dyn-rect",
    title: "送る",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 20, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("okP", {
    lane: "cb2",
    stack: 0,
    kind: "dyn-rect",
    title: "通る",
    subtitle: "{okN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{okN}", fillMax: 20, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("ngP", {
    lane: "cb2",
    stack: 1,
    kind: "dyn-rect",
    title: "落ちる",
    subtitle: "{ngN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{ngN}", fillMax: 20, orient: "up", fill: "#ef4444", radius: 6 },
  })
  .node("cutP", {
    lane: "cb2",
    stack: 2,
    kind: "dyn-rect",
    title: "断る",
    subtitle: "{cutN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{cutN}", fillMax: 20, orient: "up", fill: "#94a3b8", radius: 6 },
  })
  // 部品の中の線の札に数字を置かない (#2149)
  .edge("inP", "okP", { id: "cb-ok", label: "通る", tone: "success" })
  .edge("inP", "ngP", { id: "cb-ng", label: "落ちる", tone: "error" })
  .edge("inP", "cutP", { id: "cb-cut", label: "試さない", tone: "warning" })
  // 6 + 6 + 8 = 20 で入った分と合う。 断った 8 件は相手に届いていない = 落ちた分とは別物
  .phase("p", { duration: 4000, title: "落ちる分が増えて遮断する", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "okP", "ngP", "cutP", "cb-ok", "cb-ng", "cb-cut")
      .tween("inN", 0, 20)
      .tween("okN", 0, 6)
      .tween("ngN", 0, 6)
      .tween("cutN", 0, 8),
  )
  .build();

export const subtitle__partsCircuitBreaker =
  "20 件のうち 6 件が通り 6 件が落ちた所で遮断し、残る 8 件は試さずに断る。 断った分は相手に届かない";

// parts 96: 写し箱 — 手元に写しがある分は奥まで行かない
export const partsCacheBox = diagram("parts-cache-box", {
  topic: "写し箱 — 手元に写しがある分は奥まで行かない",
})
  .lane("ca1", { x: 0, width: 200, label: "問う" })
  .lane("ca2", { x: 220, width: 200, label: "返す" })
  .state("askN", { initial: 0 })
  .state("hitN", { initial: 0 })
  .state("missN", { initial: 0 })
  .node("askP", {
    lane: "ca1",
    stack: 1,
    kind: "dyn-rect",
    title: "問い合わせ",
    subtitle: "{askN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{askN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  // 手元から返す方を上に置く = 多い方が上に来て、奥へ行く分が少ないことが棒の高さで分かる
  .node("hitP", {
    lane: "ca2",
    stack: 0,
    kind: "dyn-rect",
    title: "手元から",
    subtitle: "{hitN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{hitN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("missP", {
    lane: "ca2",
    stack: 2,
    kind: "dyn-rect",
    title: "奥から",
    subtitle: "{missN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{missN}", fillMax: 24, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .edge("askP", "hitP", { id: "ca-hit", label: "写しあり", tone: "success" })
  .edge("askP", "missP", { id: "ca-miss", label: "写しなし", tone: "warning" })
  .phase("p", { duration: 4000, title: "写しで返す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("askP", "hitP", "missP", "ca-hit", "ca-miss")
      .tween("askN", 0, 24)
      .tween("hitN", 0, 18)
      .tween("missN", 0, 6),
  )
  .build();

export const subtitle__partsCacheBox =
  "24 件の問い合わせのうち 18 件が手元の写しで返り、奥まで行くのは 6 件だけ。 同じものを二度読まない";

// parts 97: 待ち合わせ箱 — 両方そろうまで出さない
export const partsBarrierBox = diagram("parts-barrier-box", {
  topic: "待ち合わせ箱 — 両方そろった分だけ出す",
})
  .lane("bw1", { x: 0, width: 200, label: "届く" })
  .lane("bw2", { x: 220, width: 200, label: "出す" })
  .state("aN", { initial: 0 })
  .state("bN", { initial: 0 })
  .state("outN", { initial: 0 })
  // 2 本の線を受ける箱は出どころの真ん中の段に置く (#2154)。 左を段 0、右を段 2 に離すと
  // 出る箱が段 1 に来て、線が他の箱を貫かない
  .node("aP", {
    lane: "bw1",
    stack: 0,
    kind: "dyn-rect",
    title: "左から",
    subtitle: "{aN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{aN}", fillMax: 12, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("bP", {
    lane: "bw1",
    stack: 2,
    kind: "dyn-rect",
    title: "右から",
    subtitle: "{bN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{bN}", fillMax: 12, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  // 単位は「件」 ではなく「組」。 左右の 1 件ずつが 1 組になる = 出る数は少ない方に合う
  .node("outP", {
    lane: "bw2",
    stack: 1,
    kind: "dyn-rect",
    title: "そろった分",
    subtitle: "{outN} 組",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{outN}", fillMax: 12, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .edge("aP", "outP", { id: "bw-a", label: "左が来る", tone: "info" })
  .edge("bP", "outP", { id: "bw-b", label: "右が来る", tone: "info" })
  // 左 12 と右 7 で出るのは 7 組。 左に残る 5 件は相手が来るまで出ないので、棒の高さが 3 つとも違う
  .phase("p", { duration: 4000, title: "そろった分だけ出す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("aP", "bP", "outP", "bw-a", "bw-b")
      .tween("aN", 0, 12)
      .tween("bN", 0, 7)
      .tween("outN", 0, 7),
  )
  .build();

export const subtitle__partsBarrierBox =
  "左から 12 件と右から 7 件が届き、両方そろった 7 組だけが出る。 左に残る 5 件は相手が来るまで出ない";

// parts 98: 重なり消し箱 — 二度目に来たものを捨てる
export const partsDedupeBox = diagram("parts-dedupe-box", {
  topic: "重なり消し箱 — 二度目に来たものを捨てる",
})
  .lane("dd1", { x: 0, width: 200, label: "入口" })
  .lane("dd2", { x: 220, width: 200, label: "行き先" })
  .state("inN", { initial: 0 })
  .state("keepN", { initial: 0 })
  .state("dropN", { initial: 0 })
  .node("inP", {
    lane: "dd1",
    stack: 1,
    kind: "dyn-rect",
    title: "届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("keepP", {
    lane: "dd2",
    stack: 0,
    kind: "dyn-rect",
    title: "残す",
    subtitle: "{keepN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{keepN}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("dropP", {
    lane: "dd2",
    stack: 2,
    kind: "dyn-rect",
    title: "捨てる",
    subtitle: "{dropN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{dropN}", fillMax: 30, orient: "up", fill: "#94a3b8", radius: 6 },
  })
  .edge("inP", "keepP", { id: "dd-keep", label: "初めて", tone: "success" })
  .edge("inP", "dropP", { id: "dd-drop", label: "二度目", tone: "warning" })
  // 捨てた 12 件はどこへも行かない = 遮断器と違い、断られた相手が居ない
  .phase("p", { duration: 4000, title: "重なりを消す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "keepP", "dropP", "dd-keep", "dd-drop")
      .tween("inN", 0, 30)
      .tween("keepN", 0, 18)
      .tween("dropN", 0, 12),
  )
  .build();

export const subtitle__partsDedupeBox =
  "30 件のうち初めて見る 18 件だけを残し、同じものが二度来た 12 件は捨てる。 出る数が入る数より少ない";

// ============================================================
// 入口の外側が出る分を決める部品 (#2199)
// ============================================================
//
// ここからの節は **入口に入れた数と割合では決まらない** 繋ぎ方を表す。 ここより前の繋ぎ方の部品は
// 「入口に何件入れたか」 が出発点で、そこから先の割合が図の中身だった。
//
// 置き場の大きさ (押し出し箱) / 置いてからの時間 (期限切れ箱) /
// 後ろの詰まり (押し戻し箱) / 中身の形 (割り箱) の 4 つは、
// どれも入口の外側が出る分を決めるので、既存の部品では書けない。
//
// 要素と値の名前は繋ぎ方の他の部品と同じく英字で書く (#2125)。

// parts 99: 押し出し箱 — 置き場が満ちると古いものから押し出される
export const partsEvictBox = diagram("parts-evict-box", {
  topic: "押し出し箱 — 置き場が満ちると古いものから押し出される",
})
  .lane("ev1", { x: 0, width: 200, label: "入口" })
  .lane("ev2", { x: 220, width: 200, label: "行き先" })
  .state("inN", { initial: 0 })
  .state("keepN", { initial: 0 })
  .state("pushN", { initial: 0 })
  .node("inP", {
    lane: "ev1",
    stack: 1,
    kind: "dyn-rect",
    title: "届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 30, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  // 置ける方を上に置く = 置き場より押し出す分が多いことが棒の高さで読める
  .node("keepP", {
    lane: "ev2",
    stack: 0,
    kind: "dyn-rect",
    title: "置ける",
    subtitle: "{keepN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{keepN}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("pushP", {
    lane: "ev2",
    stack: 2,
    kind: "dyn-rect",
    title: "押し出す",
    subtitle: "{pushN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{pushN}", fillMax: 30, orient: "up", fill: "#94a3b8", radius: 6 },
  })
  // 部品の中の線の札に数字を置かない (#2149)
  .edge("inP", "keepP", { id: "ev-keep", label: "置く", tone: "success" })
  .edge("inP", "pushP", { id: "ev-push", label: "古い順", tone: "warning" })
  // 10 + 20 = 30 で入った分と合う。 置き場が 10 しか無いことが、置ける棒の低さに出る
  .phase("p", { duration: 4000, title: "古いものから押し出す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "keepP", "pushP", "ev-keep", "ev-push")
      .tween("inN", 0, 30)
      .tween("keepN", 0, 10)
      .tween("pushN", 0, 20),
  )
  .build();

export const subtitle__partsEvictBox =
  "30 件が届いても置けるのは 10 件まで。 残る 20 件は古い順に押し出される。 新しい方が残る";

// parts 100: 期限切れ箱 — 置いてから時が過ぎたものが自分で消える
export const partsExpireBox = diagram("parts-expire-box", {
  topic: "期限切れ箱 — 置いてから時が過ぎたものが自分で消える",
})
  .lane("tt1", { x: 0, width: 200, label: "置く" })
  .lane("tt2", { x: 220, width: 200, label: "時が経つ" })
  .state("putN", { initial: 0 })
  .state("liveN", { initial: 0 })
  .state("goneN", { initial: 0 })
  .node("putP", {
    lane: "tt1",
    stack: 1,
    kind: "dyn-rect",
    title: "置く",
    subtitle: "{putN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{putN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("liveP", {
    lane: "tt2",
    stack: 0,
    kind: "dyn-rect",
    title: "まだ残る",
    subtitle: "{liveN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{liveN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("goneP", {
    lane: "tt2",
    stack: 2,
    kind: "dyn-rect",
    title: "消える",
    subtitle: "{goneN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{goneN}", fillMax: 24, orient: "up", fill: "#94a3b8", radius: 6 },
  })
  // 押し出し箱は場所が決め、こちらは時が決める。 消す側が居ない = 誰も消しに行かない
  .edge("putP", "liveP", { id: "tt-live", label: "新しい", tone: "success" })
  .edge("putP", "goneP", { id: "tt-gone", label: "時が来た", tone: "warning" })
  .phase("p", { duration: 4000, title: "時が過ぎた分が消える", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("putP", "liveP", "goneP", "tt-live", "tt-gone")
      .tween("putN", 0, 24)
      .tween("liveN", 0, 9)
      .tween("goneN", 0, 15),
  )
  .build();

export const subtitle__partsExpireBox =
  "24 件を置くと、時が過ぎた 15 件が自分で消えて 9 件だけ残る。 誰も消しに行かないのに減る";

// parts 101: 押し戻し箱 — 後ろが詰まると入口の勢いが絞られる
export const partsBackpressure = diagram("parts-backpressure", {
  topic: "押し戻し箱 — 後ろが詰まると入口の勢いが絞られる",
})
  .lane("bp1", { x: 0, width: 200, label: "送る" })
  .lane("bp2", { x: 220, width: 200, label: "受ける" })
  .state("inLv", { initial: 100 })
  .state("qLv", { initial: 0 })
  .state("outLv", { initial: 40 })
  // 送ると待ちの箱を同じ段に置く = 繋ぐ線が真横に引ける。 やり直しの輪 (#2171) は
  // 落ちた件数が前の段へ返る形だが、こちらは戻る線が入口の勢いそのものを変える。
  //
  // **戻る線は同じ 2 箱の間に引かない**。 送る → 待ち と 待ち → 送る の往復にすると、
  // 描画側が同じ 2 箱を結ぶ 2 本を離すため、記法と組み立て API で線の高さが 32 ずれる (実測)。
  // 戻る線は出す箱から出す。
  //
  // **戻る線がまたぐ帯は 1 つまで**。 3 つの帯に横 1 列で並べて 2 帯をまたがせると、
  // 板の高さが記法 372 と組み立て API 464 に割れる (実測)。
  //
  // 待ちと出すは同じ帯の上下に置く。 縦の矢印は受け手の読み取り値を割るが、
  // これはまとめ箱 (#2171) でも同じに出ている画面側の話で、本部品だけの形ではない (#2200)。
  .node("inP", {
    lane: "bp1",
    stack: 1,
    kind: "dyn-rect",
    title: "送る",
    subtitle: "{inLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inLv}", fillMax: 100, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("qP", {
    lane: "bp2",
    stack: 1,
    kind: "dyn-rect",
    title: "待ち",
    subtitle: "{qLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{qLv}", fillMax: 100, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("outP", {
    lane: "bp2",
    stack: 2,
    kind: "dyn-rect",
    title: "出す",
    subtitle: "{outLv}%",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{outLv}", fillMax: 100, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .edge("inP", "qP", { id: "bp-in", label: "積む", tone: "info" })
  .edge("qP", "outP", { id: "bp-out", label: "出す", tone: "success" })
  .edge("outP", "inP", { id: "bp-back", label: "絞る", tone: "warning" })
  // 出す側は 40% のまま動かない。 動くのは待ちと送る側だけ = 後ろの力が前を変える
  .phase("p", { duration: 4000, title: "詰まって入口が絞られる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "qP", "outP", "bp-in", "bp-out", "bp-back")
      .tween("qLv", 0, 100)
      .tween("inLv", 100, 40),
  )
  .build();

export const subtitle__partsBackpressure =
  "待ちが 100% まで積むと、送る側が 100% から 40% に絞られる。 出す側は 40% のまま動かない";

// parts 102: 割り箱 — 1 つの大きいものが多くの小さいものに割れる
export const partsSplitBox = diagram("parts-split-box", {
  topic: "割り箱 — 1 つの大きいものが多くの小さいものに割れる",
})
  .lane("sp1", { x: 0, width: 200, label: "届く" })
  .lane("sp2", { x: 220, width: 200, label: "割った後" })
  .state("bigN", { initial: 0 })
  .state("smallN", { initial: 0 })
  .state("tagN", { initial: 0 })
  // 3 つとも上限を 24 にそろえる。 大きい荷物だけ上限を 3 にすると棒が満杯になり、
  // 小さい荷物の満杯と見分けが付かず「3 個が 24 個になる」 が読めない (画面で確かめた)
  .node("bigP", {
    lane: "sp1",
    stack: 1,
    kind: "dyn-rect",
    title: "大きい荷物",
    subtitle: "{bigN} 個",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{bigN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("smallP", {
    lane: "sp2",
    stack: 0,
    kind: "dyn-rect",
    title: "小さい荷物",
    subtitle: "{smallN} 個",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{smallN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("tagP", {
    lane: "sp2",
    stack: 2,
    kind: "dyn-rect",
    title: "貼り直す札",
    subtitle: "{tagN} 枚",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{tagN}", fillMax: 24, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .edge("bigP", "smallP", { id: "sp-small", label: "割る", tone: "success" })
  .edge("smallP", "tagP", { id: "sp-tag", label: "札を貼る", tone: "info" })
  // 出る数が入る数より多い唯一の部品。 3 個が 24 個になり、札も 24 枚に増える
  .phase("p", { duration: 4000, title: "割って札を貼り直す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("bigP", "smallP", "tagP", "sp-small", "sp-tag")
      .tween("bigN", 0, 3)
      .tween("smallN", 0, 24)
      .tween("tagN", 0, 24),
  )
  .build();

export const subtitle__partsSplitBox =
  "3 個の大きな荷物が 24 個の小さな荷物に割れ、札も 24 枚に増える。 出る数が入る数より多い";

// ============================================================
// 他の件との関係で行き先が決まる部品 (#2206)
// ============================================================
//
// ここからの節は **1 件だけを見ても行き先が決まらない** 繋ぎ方を表す。 ここより前の繋ぎ方の部品は
// 入口に入れた数と割合か、入口の外側の事情 (#2199) で決まり、
// どちらも他の件を見ずに 1 件ごとに決まる。
//
// 前の件 (順番戻し箱) / 同じ鍵の件 (鍵割り箱) / 同時に来た件 (相乗り箱) /
// 他の送り主 (釣り合い箱) の 4 つは、隣の件を見ないと行き先も順番も決まらない。
//
// 要素と値の名前は繋ぎ方の他の部品と同じく英字で書く (#2125)。

// parts 103: 順番戻し箱 — 前の番が来るまで出せない
export const partsReorderBox = diagram("parts-reorder-box", {
  topic: "順番戻し箱 — ばらばらに届いた順を元に戻す",
})
  .lane("ro1", { x: 0, width: 200, label: "入口" })
  .lane("ro2", { x: 220, width: 200, label: "順に並べる" })
  .state("inN", { initial: 0 })
  .state("outN", { initial: 0 })
  .state("holdN", { initial: 0 })
  .node("inP", {
    lane: "ro1",
    stack: 1,
    kind: "dyn-rect",
    title: "ばらばらに届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 20, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  // 出せる方を上に置く = 出せない分が下に溜まることが棒の高さで読める
  .node("outP", {
    lane: "ro2",
    stack: 0,
    kind: "dyn-rect",
    title: "順に出せる",
    subtitle: "{outN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{outN}", fillMax: 20, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("holdP", {
    lane: "ro2",
    stack: 2,
    kind: "dyn-rect",
    title: "番を待つ",
    subtitle: "{holdN} 件",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{holdN}",
      fillMax: 20,
      orient: "up",
      fill: "#f59e0b",
      radius: 6,
    },
  })
  // 部品の中の線の札に数字を置かない (#2149)
  .edge("inP", "outP", { id: "ro-out", label: "出せる", tone: "success" })
  .edge("inP", "holdP", { id: "ro-hold", label: "出せない", tone: "warning" })
  // 12 + 8 = 20 で入った分と合う。 待つ 8 件は捨てられておらず、前の番が来れば出る
  .phase("p", { duration: 4000, title: "番が来た分だけ出す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "outP", "holdP", "ro-out", "ro-hold")
      .tween("inN", 0, 20)
      .tween("outN", 0, 12)
      .tween("holdN", 0, 8),
  )
  .build();

export const subtitle__partsReorderBox =
  "20 件が順ばらばらに届き、番が来た 12 件だけが出る。 前の番を待つ 8 件は捨てられずに残る";

// parts 104: 鍵割り箱 — 同じ鍵は必ず同じ行き先へ行く
export const partsKeyRouter = diagram("parts-key-router", {
  topic: "鍵割り箱 — 同じ鍵は必ず同じ行き先へ行く",
})
  .lane("kr1", { x: 0, width: 200, label: "入口" })
  .lane("kr2", { x: 220, width: 200, label: "鍵の先" })
  .state("inN", { initial: 0 })
  .state("aN", { initial: 0 })
  .state("bN", { initial: 0 })
  .node("inP", {
    lane: "kr1",
    stack: 1,
    kind: "dyn-rect",
    title: "届く",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("aP", {
    lane: "kr2",
    stack: 0,
    kind: "dyn-rect",
    title: "同じ鍵の先",
    subtitle: "{aN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{aN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("bP", {
    lane: "kr2",
    stack: 2,
    kind: "dyn-rect",
    title: "別の鍵の先",
    subtitle: "{bN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{bN}", fillMax: 24, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  // 振り分け器は割合を書き換えれば偏りを直せるが、こちらは鍵が決めるので直せない。
  // 18 と 6 の偏りは「鍵がそう分かれている」 ことそのもの
  .edge("inP", "aP", { id: "kr-a", label: "鍵が同じ", tone: "success" })
  .edge("inP", "bP", { id: "kr-b", label: "鍵が違う", tone: "info" })
  .phase("p", { duration: 4000, title: "鍵で行き先が決まる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "aP", "bP", "kr-a", "kr-b")
      .tween("inN", 0, 24)
      .tween("aN", 0, 18)
      .tween("bN", 0, 6),
  )
  .build();

export const subtitle__partsKeyRouter =
  "24 件が鍵で分かれ、18 件と 6 件に偏る。 鍵が行き先を決めるので、割合を変えても偏りは直らない";

// parts 105: 相乗り箱 — 同時に来た同じ問いを 1 本にまとめる
export const partsSingleFlight = diagram("parts-single-flight", {
  topic: "相乗り箱 — 同時に来た同じ問いを 1 本にまとめる",
})
  .lane("sf1", { x: 0, width: 200, label: "重なる問い" })
  .lane("sf2", { x: 220, width: 200, label: "返す" })
  .state("askN", { initial: 0 })
  .state("oneN", { initial: 0 })
  .state("allN", { initial: 0 })
  .node("askP", {
    lane: "sf1",
    stack: 1,
    kind: "dyn-rect",
    title: "同じ問い",
    subtitle: "{askN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{askN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  // 奥へ行く本数と配る件数を同じ上限にそろえる。 2 本と 24 件を同じ目盛りで見て初めて
  // 「24 件の問いが 2 本になった」 が棒の高さの差で読める
  .node("oneP", {
    lane: "sf2",
    stack: 0,
    kind: "dyn-rect",
    title: "奥へ行く",
    subtitle: "{oneN} 本",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{oneN}", fillMax: 24, orient: "up", fill: "#f59e0b", radius: 6 },
  })
  .node("allP", {
    lane: "sf2",
    stack: 2,
    kind: "dyn-rect",
    title: "皆へ配る",
    subtitle: "{allN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{allN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  // 重なり消し箱は二度目を捨てるが、こちらは捨てずに待たせて同じ答えを配る。
  // 入る件数と出る件数が同じで、減るのは奥へ行く本数だけ
  .edge("askP", "oneP", { id: "sf-one", label: "まとめる", tone: "success" })
  .edge("askP", "allP", { id: "sf-all", label: "同じ答え", tone: "info" })
  .phase("p", { duration: 4000, title: "1 本にまとめて皆へ配る", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("askP", "oneP", "allP", "sf-one", "sf-all")
      .tween("askN", 0, 24)
      .tween("oneN", 0, 2)
      .tween("allN", 0, 24),
  )
  .build();

export const subtitle__partsSingleFlight =
  "24 件の同じ問いが 2 本にまとまって奥へ行き、返った答えは 24 件へ配られる。 捨てずに待たせる";

// parts 106: 釣り合い箱 — 送り主ごとに順番に出す
export const partsFairQueue = diagram("parts-fair-queue", {
  topic: "釣り合い箱 — たくさん送る人が他の人を待たせない",
})
  .lane("fq1", { x: 0, width: 200, label: "送り主" })
  .lane("fq2", { x: 220, width: 200, label: "出口" })
  .state("bigN", { initial: 0 })
  .state("smallN", { initial: 0 })
  .state("outN", { initial: 0 })
  // 送り主 2 人を上下に置き、出口を真ん中の段に置く (#2154)。 2 本の線が上下対称に入る
  .node("bigP", {
    lane: "fq1",
    stack: 0,
    kind: "dyn-rect",
    title: "たくさん送る",
    subtitle: "{bigN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{bigN}", fillMax: 30, orient: "up", fill: "#8b5cf6", radius: 6 },
  })
  .node("smallP", {
    lane: "fq1",
    stack: 2,
    kind: "dyn-rect",
    title: "少しだけ送る",
    subtitle: "{smallN} 件",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{smallN}",
      fillMax: 30,
      orient: "up",
      fill: "#4e9dc4",
      radius: 6,
    },
  })
  .node("outP", {
    lane: "fq2",
    stack: 1,
    kind: "dyn-rect",
    title: "順に出す",
    subtitle: "{outN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{outN}", fillMax: 30, orient: "up", fill: "#22c55e", radius: 6 },
  })
  // 札は 2 本とも同じ言葉にする (合流点と同じ理由、#2149)。 送り主で扱いを変えないことが札の同じさに出る
  .edge("bigP", "outP", { id: "fq-big", label: "順番に", tone: "info" })
  .edge("smallP", "outP", { id: "fq-small", label: "順番に", tone: "info" })
  // 30 件送った人からも 6 件送った人からも 6 件ずつで、出るのは 12 件。
  // 多い方の棒は満杯のまま動かず、待っている 24 件がそこに残る
  .phase("p", { duration: 4000, title: "送り主ごとに同じだけ出す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("bigP", "smallP", "outP", "fq-big", "fq-small")
      .tween("bigN", 0, 30)
      .tween("smallN", 0, 6)
      .tween("outN", 0, 12),
  )
  .build();

export const subtitle__partsFairQueue =
  "30 件送った人も 6 件送った人も、出るのは同じ 6 件ずつ。 多く送る人の残り 24 件は次の順番まで待つ";

// ============================================================
// 同じ所を何度も通ってから行き先が決まる部品 (#2218)
// ============================================================
//
// ここからの節は **1 件が部品を 1 度通っただけでは行き先が決まらない** 繋ぎ方を表す。
// ここより前の繋ぎ方の部品は、入口に入れた数と割合か、入口の外側の事情 (#2199) か、
// 他の件との関係 (#2206) で決まるが、どれも 1 度通れば決まる。
//
// やり直し箱 (`parts-retry-loop`) は繰り返しを表す唯一の先例だが、落ちた分を入口へ戻す
// ところまでで、戻し続けても駄目だった分の行き止まりを持たない。 よけ道箱がその先を描く。
// 一人ずつ箱は、待つ理由が **中に他の件が居ること** である形を描く = 順番戻し箱が待つのは
// 前の番が来ていないからで、中に誰が居るかは見ていない。
//
// 要素と値の名前は繋ぎ方の他の部品と同じく英字で書く (#2125)。

// parts 107: よけ道箱 — やり直しても駄目な分を脇へ出す
export const partsDeadLetter = diagram("parts-dead-letter", {
  topic: "よけ道箱 — やり直しても駄目な分を脇へ出す",
})
  .lane("dl1", { x: 0, width: 200, label: "入口" })
  .lane("dl2", { x: 220, width: 200, label: "行き先" })
  .state("inN", { initial: 0 })
  .state("okN", { initial: 0 })
  .state("deadN", { initial: 0 })
  // 入口を 2 つの出口の真ん中の段 (1) に置く (#2154)。 端の段に置くと 2 本が同じ向きへ寄る
  .node("inP", {
    lane: "dl1",
    stack: 1,
    kind: "dyn-rect",
    title: "何度もやり直す",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 24, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("okP", {
    lane: "dl2",
    stack: 0,
    kind: "dyn-rect",
    title: "先へ進む",
    subtitle: "{okN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{okN}", fillMax: 24, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("deadP", {
    lane: "dl2",
    stack: 2,
    kind: "dyn-rect",
    title: "脇へ出す",
    subtitle: "{deadN} 件",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{deadN}",
      fillMax: 24,
      orient: "up",
      fill: "#dc2626",
      radius: 6,
    },
  })
  // 部品の中の線の札に数字を置かない (#2149)
  .edge("inP", "okP", { id: "dl-ok", label: "通った", tone: "success" })
  .edge("inP", "deadP", { id: "dl-dead", label: "諦めた", tone: "error" })
  // 21 + 3 = 24 で入った分と合う。 脇へ出た 3 件は入口へ戻らない = やり直し箱との違いがここに出る
  .phase("p", { duration: 4000, title: "やり直しの末に分かれる", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "okP", "deadP", "dl-ok", "dl-dead")
      .tween("inN", 0, 24)
      .tween("okN", 0, 21)
      .tween("deadN", 0, 3),
  )
  .build();

export const subtitle__partsDeadLetter =
  "24 件のうち 21 件はやり直して通り、3 件は脇へ出る。 やり直し箱と違い、諦めた分が入口へ戻らない";

// parts 108: 一人ずつ箱 — 中に入れるのは一度に一つだけ
export const partsLockGate = diagram("parts-lock-gate", {
  topic: "一人ずつ箱 — 中に入れるのは一度に一つだけ",
})
  .lane("lg1", { x: 0, width: 200, label: "入口" })
  .lane("lg2", { x: 220, width: 200, label: "戸の内と外" })
  .state("inN", { initial: 0 })
  .state("nowN", { initial: 0 })
  .state("waitN", { initial: 0 })
  .node("inP", {
    lane: "lg1",
    stack: 1,
    kind: "dyn-rect",
    title: "同時に来る",
    subtitle: "{inN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{inN}", fillMax: 18, orient: "up", fill: "#4e9dc4", radius: 6 },
  })
  .node("nowP", {
    lane: "lg2",
    stack: 0,
    kind: "dyn-rect",
    title: "中に入る",
    subtitle: "{nowN} 件",
    w: 150,
    h: 150,
    shape: { kind: "rect", source: "{nowN}", fillMax: 18, orient: "up", fill: "#22c55e", radius: 6 },
  })
  .node("waitP", {
    lane: "lg2",
    stack: 2,
    kind: "dyn-rect",
    title: "戸の前で待つ",
    subtitle: "{waitN} 件",
    w: 150,
    h: 150,
    shape: {
      kind: "rect",
      source: "{waitN}",
      fillMax: 18,
      orient: "up",
      fill: "#f59e0b",
      radius: 6,
    },
  })
  .edge("inP", "nowP", { id: "lg-now", label: "入れる", tone: "success" })
  .edge("inP", "waitP", { id: "lg-wait", label: "待つ", tone: "warning" })
  // 1 + 17 = 18 で入った分と合う。 中の 1 件が出れば次が入るので、待つ 17 件は捨てられていない
  .phase("p", { duration: 4000, title: "一度に一つだけ通す", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("inP", "nowP", "waitP", "lg-now", "lg-wait")
      .tween("inN", 0, 18)
      .tween("nowN", 0, 1)
      .tween("waitN", 0, 17),
  )
  .build();

export const subtitle__partsLockGate =
  "18 件が同時に来ても中に入れるのは 1 件だけ。 残る 17 件は捨てられず戸の前で待ち、順に入る";

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

export const sourceYaml__partsStackedLayer = `title: "縦に積んだ層の棒 — 合計値の内訳"
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
  "title": "縦に積んだ層の棒 — 合計値の内訳",
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

export const sourceYaml__partsStateIndicator = `title: "状態の指標 — 単一大 shape の色で状態表現"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  stFill: "#22c55e"
  lvl: 0

actors:
  - 現在の状態: { kind: dyn-circle, lane: l, stack: 0, subtitle: "稼働中", posW: 360, posH: 380, shape: { kind: circle, radius: 140, fillProgress: "{lvl}", fill: "{stFill}" } }

animation:
  - step: "状態が立ち上がる" 3s
    focus: ["現在の状態"]
    tween:
      lvl: 0 -> 1
`;

export const sourceJson__partsStateIndicator = `{
  "title": "状態の指標 — 単一大 shape の色で状態表現",
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
      "subtitle": "稼働中",
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

export const sourceYaml__partsHorizontalBar = `title: "横に伸びる進捗の棒 — 左→右に fill"
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
  "title": "横に伸びる進捗の棒 — 左→右に fill",
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

export const sourceYaml__partsArcGauge = `title: "円弧のゲージ — 円弧で 0-100% 表現"
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
  "title": "円弧のゲージ — 円弧で 0-100% 表現",
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

export const sourceYaml__partsCounterActor = `title: "件数の表示 — 数値 live"
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
  "title": "件数の表示 — 数値 live",
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

export const sourceYaml__partsTrafficLightStack = `title: "3灯の信号機 — 縦積み circle で状態表示"
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
  "title": "3灯の信号機 — 縦積み circle で状態表示",
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

export const sourceYaml__partsCircleSizeRace = `title: "円の大きさ比べ — radius で強さ比較"
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
  - A2: { kind: dyn-circle, lane: a, stack: 0, subtitle: "得点 {sa}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sa}", fill: "#a08870" }, title: "A" }
  - B2: { kind: dyn-circle, lane: b, stack: 0, subtitle: "得点 {sb}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sb}", fill: "#22c55e" }, title: "B" }
  - C2: { kind: dyn-circle, lane: c, stack: 0, subtitle: "得点 {sc}", posW: 160, posH: 200, shape: { kind: circle, radius: "{sc}", fill: "#a08870" }, title: "C" }

animation:
  - step: "競争" 3.5s
    focus: ["A2", "B2", "C2"]
    tween:
      sa: 20 -> 50
      sb: 20 -> 75
      sc: 20 -> 45
`;

export const sourceJson__partsCircleSizeRace = `{
  "title": "円の大きさ比べ — radius で強さ比較",
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
      "subtitle": "得点 {sa}",
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
      "subtitle": "得点 {sb}",
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
      "subtitle": "得点 {sc}",
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

export const sourceYaml__partsPercentRing = `title: "割合の円 — 0-100% を ring 表示"
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
  "title": "割合の円 — 0-100% を ring 表示",
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

export const sourceYaml__partsCountup = `title: "数え上げ — 数値 live 表示"
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
  "title": "数え上げ — 数値 live 表示",
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

export const sourceYaml__partsEdgeChain = `title: "矢印の連鎖 — 3 node 順次 activate + edge"
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
  "title": "矢印の連鎖 — 3 node 順次 activate + edge",
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

export const sourceYaml__partsBucketReservoir = `title: "入れ物の水位 — 大 wave rectangle 容器"
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
  "title": "入れ物の水位 — 大 wave rectangle 容器",
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

export const sourceYaml__partsSparkline = `title: "小さな折れ線 — 数値履歴 trend"
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
  "title": "小さな折れ線 — 数値履歴 trend",
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

export const sourceYaml__partsDonut = `title: "内訳の輪 — N segment 割合表示"
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
  "title": "内訳の輪 — N segment 割合表示",
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

export const sourceYaml__partsStepProgress = `title: "段取りの進捗 — 番号付き wizard step"
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
  "title": "段取りの進捗 — 番号付き wizard step",
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

export const sourceYaml__partsStatusDot = `title: "状態を示す点 — 小 dot で状態表示"
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
  "title": "状態を示す点 — 小 dot で状態表示",
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

export const sourceYaml__partsTimelineStrip = `title: "時系列の帯 — 時系列 status band"
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
  "title": "時系列の帯 — 時系列 status band",
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

export const sourceYaml__partsBatteryLevel = `title: "電池残量 — 縦 fill で残量 metaphor"
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
  "title": "電池残量 — 縦 fill で残量 metaphor",
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

export const sourceYaml__partsRatingStars = `title: "星の評価 — 5 段階中 fill 表示"
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
  "title": "星の評価 — 5 段階中 fill 表示",
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

export const sourceYaml__partsComparisonBars = `title: "2つの値を比べる棒 — A vs B の数値比較"
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
  "title": "2つの値を比べる棒 — A vs B の数値比較",
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

export const sourceYaml__partsToggleSwitch = `title: "入と切の切替 — on/off 状態表示"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  bg: "#22c55e"
  on: 0

actors:
  - track: { kind: dyn-rect, lane: l, stack: 0, subtitle: "入", posW: 320, posH: 160, shape: { kind: rect, source: "{on}", fillMax: 100, orient: right, fill: "{bg}", radius: 80 }, title: "" }

animation:
  - step: "切から入へ" 3s
    focus: ["track"]
    tween:
      on: 0 -> 100
`;

export const sourceJson__partsToggleSwitch = `{
  "title": "入と切の切替 — on/off 状態表示",
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
      "subtitle": "入",
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

export const sourceYaml__partsSpeedometer = `title: "速度計 — 円弧針で速度表示"
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
  "title": "速度計 — 円弧針で速度表示",
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

export const sourceYaml__partsBadgeCount = `title: "未読数の印 — 未読数の visual 強調"
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
  "title": "未読数の印 — 未読数の visual 強調",
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

export const sourceYaml__partsPulseIndicator = `title: "毎秒の件数の指標 — レート visualization"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  rate: 5

actors:
  - レート: { kind: dyn-wave, lane: l, stack: 0, subtitle: "{rate} 件/秒", posW: 380, posH: 380, shape: { kind: wave, level: "{rate}", amplitude: 50, frequency: 3, waveHeight: 15, fill: "#8b5cf6" } }

animation:
  - step: "毎秒の件数が増える" 4s
    focus: ["レート"]
    tween:
      rate: 5 -> 85
`;

export const sourceJson__partsPulseIndicator = `{
  "title": "毎秒の件数の指標 — レート visualization",
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
      "subtitle": "{rate} 件/秒",
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
  - メモリ: { kind: dyn-arc, lane: lb, stack: 0, subtitle: "{mem}%", posW: 200, posH: 200, shape: { kind: arc, angle: "{mem}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#22c55e" } }
  - 通信: { kind: dyn-arc, lane: lc, stack: 0, subtitle: "{net}%", posW: 200, posH: 200, shape: { kind: arc, angle: "{net}", sweepMax: 100, outerRadius: 80, innerRadius: 55, fill: "#f59e0b" } }

animation:
  - step: "負荷変動" 4s
    focus: ["CPU", "メモリ", "通信"]
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
      "name": "メモリ",
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
      "name": "通信",
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
      "focus": ["CPU", "メモリ", "通信"],
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

export const sourceYaml__partsCountdown = `title: "残り時間の円弧 — 減っていく秒数"
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
  "title": "残り時間の円弧 — 減っていく秒数",
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
  - こんにちは!: { kind: dyn-rect, lane: l, stack: 0, subtitle: "午前 10:30", posW: 460, posH: 200, shape: { kind: rect, source: "{pop}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 24 } }

animation:
  - step: "メッセージが届く" 3s
    focus: ["こんにちは!"]
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
      "name": "こんにちは!",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "午前 10:30",
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
      "focus": ["こんにちは!"],
      "tween": { "pop": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsUserAvatar = `title: "利用者のアイコン — 大円で user icon"
type: flow

lanes:
  l: { x: 0, width: 380 }

states:
  bg: "#4e9dc4"
  r: 40

actors:
  - 山田: { kind: dyn-circle, lane: l, stack: 0, subtitle: "山田 太郎", posW: 340, posH: 340, shape: { kind: circle, radius: "{r}", fill: "{bg}" } }

animation:
  - step: "人物の絵が現れる" 3s
    focus: ["山田"]
    tween:
      r: 40 -> 150
`;

export const sourceJson__partsUserAvatar = `{
  "title": "利用者のアイコン — 大円で user icon",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 380 }
  },
  "actors": [
    {
      "name": "山田",
      "kind": "dyn-circle",
      "lane": "l",
      "stack": 0,
      "subtitle": "山田 太郎",
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
      "focus": ["山田"],
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
  - 上り: { kind: dyn-rect, lane: la, stack: 0, subtitle: "{up} Mbps", posW: 220, posH: 340, shape: { kind: rect, source: "{up}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }
  - 下り: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{dn} Mbps", posW: 220, posH: 340, shape: { kind: rect, source: "{dn}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }

animation:
  - step: "帯域変動" 4s
    focus: ["上り", "下り"]
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
      "name": "上り",
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
      "name": "下り",
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
      "focus": ["上り", "下り"],
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

export const sourceYaml__partsProgressDots = `title: "進捗の点 — 3 段階完了表示"
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
  "title": "進捗の点 — 3 段階完了表示",
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

export const sourceYaml__partsRainbowStack = `title: "虹色の5段 — 5 tone tier stack"
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
  - 階層 1: { kind: dyn-rect, lane: l, stack: 0, subtitle: "S", posW: 320, posH: 90, shape: { kind: rect, source: "{t1}", fillMax: 30, orient: up, fill: "#dc2626", radius: 4 } }
  - 階層 2: { kind: dyn-rect, lane: l, stack: 1, subtitle: "A", posW: 320, posH: 90, shape: { kind: rect, source: "{t2}", fillMax: 30, orient: up, fill: "#f59e0b", radius: 4 } }
  - 階層 3: { kind: dyn-rect, lane: l, stack: 2, subtitle: "B", posW: 320, posH: 90, shape: { kind: rect, source: "{t3}", fillMax: 30, orient: up, fill: "#22c55e", radius: 4 } }
  - 階層 4: { kind: dyn-rect, lane: l, stack: 3, subtitle: "C", posW: 320, posH: 90, shape: { kind: rect, source: "{t4}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 4 } }
  - 階層 5: { kind: dyn-rect, lane: l, stack: 4, subtitle: "D", posW: 320, posH: 90, shape: { kind: rect, source: "{t5}", fillMax: 30, orient: up, fill: "#8b5cf6", radius: 4 } }

animation:
  - step: "全ての段が動く" 4s
    focus: ["階層 1", "階層 2", "階層 3", "階層 4", "階層 5"]
    tween:
      t1: 20 -> 28
      t2: 20 -> 28
      t3: 20 -> 28
      t4: 20 -> 28
      t5: 20 -> 28
`;

export const sourceJson__partsRainbowStack = `{
  "title": "虹色の5段 — 5 tone tier stack",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 340 }
  },
  "actors": [
    {
      "name": "階層 1",
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
      "name": "階層 2",
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
      "name": "階層 3",
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
      "name": "階層 4",
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
      "name": "階層 5",
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
      "focus": ["階層 1", "階層 2", "階層 3", "階層 4", "階層 5"],
      "tween": { "t1": [20, 28], "t2": [20, 28], "t3": [20, 28], "t4": [20, 28], "t5": [20, 28] }
    }
  ]
}`;

export const sourceYaml__partsShoppingCart = `title: "買い物かご — 商品数 live"
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
  "title": "買い物かご — 商品数 live",
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

export const sourceYaml__partsLocationPin = `title: "現在地の印 — 現在位置 metaphor"
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
  "title": "現在地の印 — 現在位置 metaphor",
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

export const sourceYaml__partsSearchBar = `title: "検索欄 — 入力域 metaphor"
type: flow

lanes:
  l: { x: 0, width: 700 }

states:
  typed: 0

actors:
  - 🔍 検索: { kind: dyn-rect, lane: l, stack: 0, subtitle: "検索語を入力", posW: 680, posH: 140, shape: { kind: rect, source: "{typed}", fillMax: 100, orient: right, fill: "#f5e6b8", radius: 70 } }

animation:
  - step: "入力が伸びる" 3s
    focus: ["🔍 検索"]
    tween:
      typed: 0 -> 100
`;

export const sourceJson__partsSearchBar = `{
  "title": "検索欄 — 入力域 metaphor",
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
      "subtitle": "検索語を入力",
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

export const sourceYaml__partsBookmark = `title: "しおり — 保存済み metaphor"
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
  "title": "しおり — 保存済み metaphor",
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

export const sourceYaml__partsCoinBalance = `title: "硬貨の残高 — currency live"
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
  "title": "硬貨の残高 — currency live",
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

export const sourceYaml__partsExpBar = `title: "経験値の棒 — XP progression"
type: flow

lanes:
  l: { x: 0, width: 700 }

states:
  xp: 20

actors:
  - 経験値 レベル 12: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{xp}/100 でレベル 13", posW: 680, posH: 120, shape: { kind: rect, source: "{xp}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 60 } }

animation:
  - step: "経験値が上がる" 4.5s
    focus: ["経験値 レベル 12"]
    tween:
      xp: 20 -> 95
`;

export const sourceJson__partsExpBar = `{
  "title": "経験値の棒 — XP progression",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 700 }
  },
  "actors": [
    {
      "name": "経験値 レベル 12",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{xp}/100 でレベル 13",
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
      "focus": ["経験値 レベル 12"],
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

export const sourceYaml__partsSaleTag = `title: "割引の札 — 割引率 badge"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  off: 30

actors:
  - セール: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{off}% 引き", posW: 360, posH: 200, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "#dc2626", radius: 12 } }

animation:
  - step: "割引拡大" 4s
    focus: ["セール"]
    tween:
      off: 30 -> 70
`;

export const sourceJson__partsSaleTag = `{
  "title": "割引の札 — 割引率 badge",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    {
      "name": "セール",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "{off}% 引き",
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
      "focus": ["セール"],
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
  - 計数: { kind: dyn-circle, lane: l, stack: 0, subtitle: "半径 {count}", posW: 380, posH: 380, shape: { kind: circle, radius: "{count}", fill: "#4e9dc4" } }

animation:
  - step: "半径拡大" 4s
    focus: ["計数"]
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
      "name": "計数",
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
      "focus": ["計数"],
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
  - 脈動: { kind: dyn-circle, lane: l, stack: 0, subtitle: "{pulse}", posW: 340, posH: 340, shape: { kind: circle, radius: "{pulse}", fill: "#dc2626" } }

animation:
  - step: "膨張" 0.8s
    focus: ["脈動"]
    tween:
      pulse: 20 -> 150
  - step: "収縮" 0.8s
    focus: ["脈動"]
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
      "name": "脈動",
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
      "focus": ["脈動"],
      "tween": { "pulse": [20, 150] }
    },
    {
      "step": "収縮",
      "duration": 0.8,
      "focus": ["脈動"],
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
  - 読み込み: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{deg}°", posW: 340, posH: 340, shape: { kind: arc, angle: "{deg}", sweepMax: 360, outerRadius: 140, innerRadius: 100, fill: "#f59e0b" } }

animation:
  - step: "1 周" 3s
    focus: ["読み込み"]
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
      "name": "読み込み",
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
      "focus": ["読み込み"],
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
  - 上の区画: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{up}%", posW: 380, posH: 180, shape: { kind: rect, source: "{up}", fillMax: 100, orient: down, fill: "#22c55e", radius: 4 } }
  - 下の区画: { kind: dyn-rect, lane: l, stack: 1, subtitle: "{dn}%", posW: 380, posH: 180, shape: { kind: rect, source: "{dn}", fillMax: 100, orient: up, fill: "#dc2626", radius: 4 } }

animation:
  - step: "上下逆転" 4s
    focus: ["上の区画", "下の区画"]
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
      "name": "上の区画",
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
      "name": "下の区画",
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
      "focus": ["上の区画", "下の区画"],
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
  - status: { kind: dyn-rect, lane: l, stack: 0, subtitle: "正常", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 12 } }

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
      "subtitle": "正常",
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
  - 水槽: { kind: dyn-wave, lane: l, stack: 0, subtitle: "{lvl}%", posW: 380, posH: 380, shape: { kind: wave, level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 10, fill: "{hue}" } }

animation:
  - step: "水位上昇" 2s
    focus: ["水槽"]
    tween:
      lvl: 30 -> 85
  - step: "警告色" 2s
    focus: ["水槽"]
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
      "name": "水槽",
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
      "focus": ["水槽"],
      "tween": { "lvl": [30, 85] }
    },
    {
      "step": "警告色",
      "duration": 2,
      "focus": ["水槽"],
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
  - 警報レベル {level}: { kind: dyn-rect, lane: l, stack: 0, subtitle: "段階 {level}", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 8 } }

animation:
  - step: "L1 = 平常" 1.5s
    focus: ["警報レベル {level}"]
    set:
      level: 1
      bg: "#22c55e"
  - step: "L2 = 注意" 1.5s
    focus: ["警報レベル {level}"]
    set:
      level: 2
      bg: "#f59e0b"
  - step: "L3 = 危険" 1.5s
    focus: ["警報レベル {level}"]
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
      "name": "警報レベル {level}",
      "kind": "dyn-rect",
      "lane": "l",
      "stack": 0,
      "subtitle": "段階 {level}",
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
      "focus": ["警報レベル {level}"],
      "set": { "level": 1, "bg": "#22c55e" }
    },
    {
      "step": "L2 = 注意",
      "duration": 1.5,
      "focus": ["警報レベル {level}"],
      "set": { "level": 2, "bg": "#f59e0b" }
    },
    {
      "step": "L3 = 危険",
      "duration": 1.5,
      "focus": ["警報レベル {level}"],
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
  - 要求数: { kind: dyn-arc, lane: l, stack: 0, subtitle: "{k}k / 1000k", posW: 380, posH: 380, shape: { kind: arc, angle: "{k}", sweepMax: 1000, outerRadius: 150, innerRadius: 100, fill: "#22c55e" } }

animation:
  - step: "1k 到達" 4s
    focus: ["要求数"]
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
      "name": "要求数",
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
      "focus": ["要求数"],
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
  - 配色: { kind: dyn-rect, lane: l, stack: 0, subtitle: "{txt}", posW: 340, posH: 340, shape: { kind: rect, source: 100, fillMax: 100, orient: up, fill: "{bg}", radius: 12 } }

animation:
  - step: "暗い配色へ" 1.5s
    focus: ["配色"]
    set:
      bg: "#1a1408"
      txt: "dark mode"
  - step: "明るい配色へ" 1.5s
    focus: ["配色"]
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
      "name": "配色",
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
      "focus": ["配色"],
      "set": { "bg": "#1a1408", "txt": "dark mode" }
    },
    {
      "step": "明るい配色へ",
      "duration": 1.5,
      "focus": ["配色"],
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
  - 呼吸: { kind: dyn-circle, lane: l, stack: 0, subtitle: "半径 {r}", posW: 340, posH: 340, shape: { kind: circle, radius: "{r}", fill: "#4e9dc4" } }

animation:
  - step: "吸う" 1.8s
    focus: ["呼吸"]
    tween:
      r: 40 -> 150
  - step: "吐く" 1.8s
    focus: ["呼吸"]
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
      "name": "呼吸",
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
      "focus": ["呼吸"],
      "tween": { "r": [40, 150] }
    },
    {
      "step": "吐く",
      "duration": 1.8,
      "focus": ["呼吸"],
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
  - メモリ: { kind: dyn-rect, lane: lb, stack: 0, subtitle: "{mem}%", posW: 240, posH: 380, shape: { kind: rect, source: "{mem}", fillMax: 100, orient: up, fill: "{memC}", radius: 8 } }
  - 通信: { kind: dyn-rect, lane: lc, stack: 0, subtitle: "{net} Mbps", posW: 240, posH: 380, shape: { kind: rect, source: "{net}", fillMax: 100, orient: up, fill: "{netC}", radius: 8 } }

animation:
  - step: "負荷が上がる" 1.2s
    focus: ["CPU", "メモリ", "通信"]
    tween:
      cpu: 15 -> 60
      mem: 30 -> 55
      net: 5 -> 40
  - step: "注意" 1.2s
    focus: ["CPU", "メモリ", "通信"]
    tween:
      cpu: 60 -> 82
    set:
      cpuC: "#f59e0b"
      status: "warning"
  - step: "危険" 1.2s
    focus: ["CPU", "メモリ", "通信"]
    tween:
      cpu: 82 -> 95
    set:
      cpuC: "#dc2626"
      memC: "#f59e0b"
      status: "critical"
  - step: "回復開始" 1.2s
    focus: ["CPU", "メモリ", "通信"]
    tween:
      cpu: 95 -> 40
      mem: 55 -> 35
    set:
      cpuC: "#22c55e"
      memC: "#22c55e"
      status: "recovering"
  - step: "平常復帰" 1.2s
    focus: ["CPU", "メモリ", "通信"]
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
      "name": "メモリ",
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
      "name": "通信",
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
      "focus": ["CPU", "メモリ", "通信"],
      "tween": { "cpu": [15, 60], "mem": [30, 55], "net": [5, 40] }
    },
    {
      "step": "注意",
      "duration": 1.2,
      "focus": ["CPU", "メモリ", "通信"],
      "tween": { "cpu": [60, 82] },
      "set": { "cpuC": "#f59e0b", "status": "warning" }
    },
    {
      "step": "危険",
      "duration": 1.2,
      "focus": ["CPU", "メモリ", "通信"],
      "tween": { "cpu": [82, 95] },
      "set": { "cpuC": "#dc2626", "memC": "#f59e0b", "status": "critical" }
    },
    {
      "step": "回復開始",
      "duration": 1.2,
      "focus": ["CPU", "メモリ", "通信"],
      "tween": { "cpu": [95, 40], "mem": [55, 35] },
      "set": { "cpuC": "#22c55e", "memC": "#22c55e", "status": "recovering" }
    },
    {
      "step": "平常復帰",
      "duration": 1.2,
      "focus": ["CPU", "メモリ", "通信"],
      "set": { "status": "healthy" }
    }
  ]
}`;

// ============================================================
// 繋ぎ方そのものを表す部品の記法 (#2129)
// ============================================================

export const sourceYaml__partsSplitRouter = `title: "振り分け器 — 入口 1 つを 2 つの出口へ分ける"
type: flow

lanes:
  sl1: { x: 0, width: 200, label: "入口" }
  sl2: { x: 220, width: 200, label: "出口" }

states:
  inLv: 0
  aLv: 0
  bLv: 0

actors:
  - 入口: { kind: dyn-rect, lane: sl1, stack: 1, subtitle: "{inLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{inLv}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 出口 A: { kind: dyn-rect, lane: sl2, stack: 0, subtitle: "{aLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{aLv}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }
  - 出口 B: { kind: dyn-rect, lane: sl2, stack: 2, subtitle: "{bLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{bLv}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 6 } }

flow:
  - 入口 -> 出口 A: "A へ" (success)
  - 入口 -> 出口 B: "B へ" (warning)

animation:
  - step: "2 つへ分かれる" 4s
    focus: ["入口", "出口 A", "出口 B", "入口 -> 出口 A", "入口 -> 出口 B"]
    tween:
      inLv: 0 -> 100
      aLv: 0 -> 70
      bLv: 0 -> 30
`;

export const sourceJson__partsSplitRouter = `{
  "title": "振り分け器 — 入口 1 つを 2 つの出口へ分ける",
  "type": "flow",
  "lanes": {
    "sl1": { "x": 0, "width": 200, "label": "入口" },
    "sl2": { "x": 220, "width": 200, "label": "出口" }
  },
  "actors": [
    {
      "name": "入口",
      "kind": "dyn-rect",
      "lane": "sl1",
      "stack": 1,
      "subtitle": "{inLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "出口 A",
      "kind": "dyn-rect",
      "lane": "sl2",
      "stack": 0,
      "subtitle": "{aLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{aLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "出口 B",
      "kind": "dyn-rect",
      "lane": "sl2",
      "stack": 2,
      "subtitle": "{bLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{bLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "入口", "to": "出口 A", "label": "A へ", "tone": "success" },
    { "from": "入口", "to": "出口 B", "label": "B へ", "tone": "warning" }
  ],
  "states": { "inLv": 0, "aLv": 0, "bLv": 0 },
  "animation": [
    {
      "step": "2 つへ分かれる",
      "duration": 4,
      "focus": ["入口", "出口 A", "出口 B", "入口 -> 出口 A", "入口 -> 出口 B"],
      "tween": { "inLv": [0, 100], "aLv": [0, 70], "bLv": [0, 30] }
    }
  ]
}`;

export const sourceYaml__partsMergeJunction = `title: "合流点 — 入口 2 つを 1 つの出口へ集める"
type: flow

lanes:
  ml1: { x: 0, width: 200, label: "入口" }
  ml2: { x: 220, width: 200, label: "出口" }

states:
  aLv: 0
  bLv: 0
  sumLv: 0

actors:
  - 入口 A: { kind: dyn-rect, lane: ml1, stack: 0, subtitle: "{aLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{aLv}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 入口 B: { kind: dyn-rect, lane: ml1, stack: 2, subtitle: "{bLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{bLv}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 6 } }
  - 出口: { kind: dyn-rect, lane: ml2, stack: 1, subtitle: "{sumLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{sumLv}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 入口 A -> 出口: "足す" (info)
  - 入口 B -> 出口: "足す" (info)

animation:
  - step: "1 つへ集まる" 4s
    focus: ["入口 A", "入口 B", "出口", "入口 A -> 出口", "入口 B -> 出口"]
    tween:
      aLv: 0 -> 60
      bLv: 0 -> 40
      sumLv: 0 -> 100
`;

export const sourceJson__partsMergeJunction = `{
  "title": "合流点 — 入口 2 つを 1 つの出口へ集める",
  "type": "flow",
  "lanes": {
    "ml1": { "x": 0, "width": 200, "label": "入口" },
    "ml2": { "x": 220, "width": 200, "label": "出口" }
  },
  "actors": [
    {
      "name": "入口 A",
      "kind": "dyn-rect",
      "lane": "ml1",
      "stack": 0,
      "subtitle": "{aLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{aLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "入口 B",
      "kind": "dyn-rect",
      "lane": "ml1",
      "stack": 2,
      "subtitle": "{bLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{bLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 6
      }
    },
    {
      "name": "出口",
      "kind": "dyn-rect",
      "lane": "ml2",
      "stack": 1,
      "subtitle": "{sumLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{sumLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "入口 A", "to": "出口", "label": "足す", "tone": "info" },
    { "from": "入口 B", "to": "出口", "label": "足す", "tone": "info" }
  ],
  "states": { "aLv": 0, "bLv": 0, "sumLv": 0 },
  "animation": [
    {
      "step": "1 つへ集まる",
      "duration": 4,
      "focus": ["入口 A", "入口 B", "出口", "入口 A -> 出口", "入口 B -> 出口"],
      "tween": { "aLv": [0, 60], "bLv": [0, 40], "sumLv": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsQueueDepth = `title: "待ち行列の深さ — 入る量と出る量の差が中央に溜まる"
type: flow

lanes:
  ql1: { x: 0, width: 180, label: "入る" }
  ql2: { x: 200, width: 200, label: "待ち" }
  ql3: { x: 420, width: 180, label: "出る" }

states:
  inRate: 12
  depth: 0
  outRate: 5

actors:
  - 入る: { kind: dyn-rect, lane: ql1, stack: 0, subtitle: "{inRate} 件/秒", posW: 160, posH: 320, shape: { kind: rect, source: "{inRate}", fillMax: 20, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 待ち行列: { kind: dyn-rect, lane: ql2, stack: 0, subtitle: "{depth} 件", posW: 180, posH: 320, shape: { kind: rect, source: "{depth}", fillMax: 50, orient: up, fill: "#f59e0b", radius: 6 } }
  - 出る: { kind: dyn-rect, lane: ql3, stack: 0, subtitle: "{outRate} 件/秒", posW: 160, posH: 320, shape: { kind: rect, source: "{outRate}", fillMax: 20, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 入る -> 待ち行列: "届く" (info)
  - 待ち行列 -> 出る: "捌く" (success)

animation:
  - step: "捌ききれず溜まる" 4s
    focus: ["入る", "待ち行列", "出る", "入る -> 待ち行列", "待ち行列 -> 出る"]
    tween:
      depth: 0 -> 38
      outRate: 5 -> 9
`;

export const sourceJson__partsQueueDepth = `{
  "title": "待ち行列の深さ — 入る量と出る量の差が中央に溜まる",
  "type": "flow",
  "lanes": {
    "ql1": { "x": 0, "width": 180, "label": "入る" },
    "ql2": { "x": 200, "width": 200, "label": "待ち" },
    "ql3": { "x": 420, "width": 180, "label": "出る" }
  },
  "actors": [
    {
      "name": "入る",
      "kind": "dyn-rect",
      "lane": "ql1",
      "stack": 0,
      "subtitle": "{inRate} 件/秒",
      "posW": 160,
      "posH": 320,
      "shape": {
        "kind": "rect",
        "source": "{inRate}",
        "fillMax": 20,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "待ち行列",
      "kind": "dyn-rect",
      "lane": "ql2",
      "stack": 0,
      "subtitle": "{depth} 件",
      "posW": 180,
      "posH": 320,
      "shape": {
        "kind": "rect",
        "source": "{depth}",
        "fillMax": 50,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    },
    {
      "name": "出る",
      "kind": "dyn-rect",
      "lane": "ql3",
      "stack": 0,
      "subtitle": "{outRate} 件/秒",
      "posW": 160,
      "posH": 320,
      "shape": {
        "kind": "rect",
        "source": "{outRate}",
        "fillMax": 20,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "入る", "to": "待ち行列", "label": "届く", "tone": "info" },
    { "from": "待ち行列", "to": "出る", "label": "捌く", "tone": "success" }
  ],
  "states": { "inRate": 12, "depth": 0, "outRate": 5 },
  "animation": [
    {
      "step": "捌ききれず溜まる",
      "duration": 4,
      "focus": ["入る", "待ち行列", "出る", "入る -> 待ち行列", "待ち行列 -> 出る"],
      "tween": { "depth": [0, 38], "outRate": [5, 9] }
    }
  ]
}`;

export const sourceYaml__partsValveFlow = `title: "弁の開き — 中央の開度で出口の量が決まる"
type: flow

lanes:
  vl1: { x: 0, width: 180, label: "元の流れ" }
  vl2: { x: 200, width: 220, label: "弁" }
  vl3: { x: 440, width: 180, label: "通った量" }

states:
  inF: 100
  open: 0
  outF: 0

actors:
  - 元の流れ: { kind: dyn-rect, lane: vl1, stack: 0, subtitle: "{inF}%", posW: 160, posH: 280, shape: { kind: rect, source: "{inF}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 弁: { kind: dyn-arc, lane: vl2, stack: 0, subtitle: "開き {open}%", posW: 200, posH: 280, shape: { kind: arc, angle: "{open}", sweepMax: 100, outerRadius: 90, innerRadius: 55, fill: "#f59e0b" } }
  - 通った量: { kind: dyn-rect, lane: vl3, stack: 0, subtitle: "{outF}%", posW: 160, posH: 280, shape: { kind: rect, source: "{outF}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 元の流れ -> 弁: "押す" (info)
  - 弁 -> 通った量: "通る" (success)

animation:
  - step: "弁を開ける" 4s
    focus: ["元の流れ", "弁", "通った量", "元の流れ -> 弁", "弁 -> 通った量"]
    tween:
      open: 0 -> 65
      outF: 0 -> 65
`;

export const sourceJson__partsValveFlow = `{
  "title": "弁の開き — 中央の開度で出口の量が決まる",
  "type": "flow",
  "lanes": {
    "vl1": { "x": 0, "width": 180, "label": "元の流れ" },
    "vl2": { "x": 200, "width": 220, "label": "弁" },
    "vl3": { "x": 440, "width": 180, "label": "通った量" }
  },
  "actors": [
    {
      "name": "元の流れ",
      "kind": "dyn-rect",
      "lane": "vl1",
      "stack": 0,
      "subtitle": "{inF}%",
      "posW": 160,
      "posH": 280,
      "shape": {
        "kind": "rect",
        "source": "{inF}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "弁",
      "kind": "dyn-arc",
      "lane": "vl2",
      "stack": 0,
      "subtitle": "開き {open}%",
      "posW": 200,
      "posH": 280,
      "shape": {
        "kind": "arc",
        "angle": "{open}",
        "sweepMax": 100,
        "outerRadius": 90,
        "innerRadius": 55,
        "fill": "#f59e0b"
      }
    },
    {
      "name": "通った量",
      "kind": "dyn-rect",
      "lane": "vl3",
      "stack": 0,
      "subtitle": "{outF}%",
      "posW": 160,
      "posH": 280,
      "shape": {
        "kind": "rect",
        "source": "{outF}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "元の流れ", "to": "弁", "label": "押す", "tone": "info" },
    { "from": "弁", "to": "通った量", "label": "通る", "tone": "success" }
  ],
  "states": { "inF": 100, "open": 0, "outF": 0 },
  "animation": [
    {
      "step": "弁を開ける",
      "duration": 4,
      "focus": ["元の流れ", "弁", "通った量", "元の流れ -> 弁", "弁 -> 通った量"],
      "tween": { "open": [0, 65], "outF": [0, 65] }
    }
  ]
}`;

export const sourceYaml__partsFunnel3 = `title: "三段の漏斗 — 段ごとに幅が狭くなり残る数が減る"
type: flow

lanes:
  fl: { x: 0, width: 380, label: "訪問から購入まで" }

states:
  tN: 0
  mN: 0
  bN: 0

actors:
  - 訪れた人: { kind: dyn-rect, lane: fl, stack: 0, subtitle: "{tN}%", posW: 360, posH: 130, shape: { kind: rect, source: "{tN}", fillMax: 100, orient: right, fill: "#4e9dc4", radius: 6 } }
  - 登録した人: { kind: dyn-rect, lane: fl, stack: 1, subtitle: "{mN}%", posW: 260, posH: 130, shape: { kind: rect, source: "{mN}", fillMax: 100, orient: right, fill: "#8b5cf6", radius: 6 } }
  - 買った人: { kind: dyn-rect, lane: fl, stack: 2, subtitle: "{bN}%", posW: 160, posH: 130, shape: { kind: rect, source: "{bN}", fillMax: 100, orient: right, fill: "#22c55e", radius: 6 } }

flow:
  - 訪れた人 -> 登録した人: "6 割が残る" (info)
  - 登録した人 -> 買った人: "4 割が残る" (success)

animation:
  - step: "段ごとに絞られる" 4s
    focus: ["訪れた人", "登録した人", "買った人", "訪れた人 -> 登録した人", "登録した人 -> 買った人"]
    tween:
      tN: 0 -> 100
      mN: 0 -> 62
      bN: 0 -> 24
`;

export const sourceJson__partsFunnel3 = `{
  "title": "三段の漏斗 — 段ごとに幅が狭くなり残る数が減る",
  "type": "flow",
  "lanes": {
    "fl": { "x": 0, "width": 380, "label": "訪問から購入まで" }
  },
  "actors": [
    {
      "name": "訪れた人",
      "kind": "dyn-rect",
      "lane": "fl",
      "stack": 0,
      "subtitle": "{tN}%",
      "posW": 360,
      "posH": 130,
      "shape": {
        "kind": "rect",
        "source": "{tN}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "登録した人",
      "kind": "dyn-rect",
      "lane": "fl",
      "stack": 1,
      "subtitle": "{mN}%",
      "posW": 260,
      "posH": 130,
      "shape": {
        "kind": "rect",
        "source": "{mN}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#8b5cf6",
        "radius": 6
      }
    },
    {
      "name": "買った人",
      "kind": "dyn-rect",
      "lane": "fl",
      "stack": 2,
      "subtitle": "{bN}%",
      "posW": 160,
      "posH": 130,
      "shape": {
        "kind": "rect",
        "source": "{bN}",
        "fillMax": 100,
        "orient": "right",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    { "from": "訪れた人", "to": "登録した人", "label": "6 割が残る", "tone": "info" },
    { "from": "登録した人", "to": "買った人", "label": "4 割が残る", "tone": "success" }
  ],
  "states": { "tN": 0, "mN": 0, "bN": 0 },
  "animation": [
    {
      "step": "段ごとに絞られる",
      "duration": 4,
      "focus": ["訪れた人", "登録した人", "買った人", "訪れた人 -> 登録した人", "登録した人 -> 買った人"],
      "tween": { "tN": [0, 100], "mN": [0, 62], "bN": [0, 24] }
    }
  ]
}`;

export const sourceYaml__partsMiniNetwork = `title: "小さな網 — 起点から終点まで 2 つの経路が並ぶ"
type: flow

lanes:
  nl1: { x: 0, width: 200, label: "起点" }
  nl2: { x: 220, width: 200, label: "中継" }
  nl3: { x: 440, width: 200, label: "終点" }

states:
  p1: 0
  p2: 0
  p3: 0
  p4: 0

actors:
  - 起点: { kind: dyn-circle, lane: nl1, stack: 1, subtitle: "{p1}", posW: 180, posH: 180, shape: { kind: circle, radius: 70, fillProgress: "{p1}", fill: "#4e9dc4" } }
  - 上の中継: { kind: dyn-circle, lane: nl2, stack: 0, subtitle: "{p2}", posW: 180, posH: 180, shape: { kind: circle, radius: 70, fillProgress: "{p2}", fill: "#8b5cf6" } }
  - 下の中継: { kind: dyn-circle, lane: nl2, stack: 2, subtitle: "{p3}", posW: 180, posH: 180, shape: { kind: circle, radius: 70, fillProgress: "{p3}", fill: "#f59e0b" } }
  - 終点: { kind: dyn-circle, lane: nl3, stack: 1, subtitle: "{p4}", posW: 180, posH: 180, shape: { kind: circle, radius: 70, fillProgress: "{p4}", fill: "#22c55e" } }

flow:
  - 起点 -> 上の中継: "上の道" (info)
  - 起点 -> 下の中継: "下の道" (warning)
  - 上の中継 -> 終点: "合流" (info)
  - 下の中継 -> 終点: "合流" (warning)

animation:
  - step: "2 つの道を通る" 4s
    focus: ["起点", "上の中継", "下の中継", "終点", "起点 -> 上の中継", "起点 -> 下の中継", "上の中継 -> 終点", "下の中継 -> 終点"]
    tween:
      p1: 0 -> 1
      p2: 0 -> 1
      p3: 0 -> 1
      p4: 0 -> 1
`;

export const sourceJson__partsMiniNetwork = `{
  "title": "小さな網 — 起点から終点まで 2 つの経路が並ぶ",
  "type": "flow",
  "lanes": {
    "nl1": { "x": 0, "width": 200, "label": "起点" },
    "nl2": { "x": 220, "width": 200, "label": "中継" },
    "nl3": { "x": 440, "width": 200, "label": "終点" }
  },
  "actors": [
    {
      "name": "起点",
      "kind": "dyn-circle",
      "lane": "nl1",
      "stack": 1,
      "subtitle": "{p1}",
      "posW": 180,
      "posH": 180,
      "shape": { "kind": "circle", "radius": 70, "fillProgress": "{p1}", "fill": "#4e9dc4" }
    },
    {
      "name": "上の中継",
      "kind": "dyn-circle",
      "lane": "nl2",
      "stack": 0,
      "subtitle": "{p2}",
      "posW": 180,
      "posH": 180,
      "shape": { "kind": "circle", "radius": 70, "fillProgress": "{p2}", "fill": "#8b5cf6" }
    },
    {
      "name": "下の中継",
      "kind": "dyn-circle",
      "lane": "nl2",
      "stack": 2,
      "subtitle": "{p3}",
      "posW": 180,
      "posH": 180,
      "shape": { "kind": "circle", "radius": 70, "fillProgress": "{p3}", "fill": "#f59e0b" }
    },
    {
      "name": "終点",
      "kind": "dyn-circle",
      "lane": "nl3",
      "stack": 1,
      "subtitle": "{p4}",
      "posW": 180,
      "posH": 180,
      "shape": { "kind": "circle", "radius": 70, "fillProgress": "{p4}", "fill": "#22c55e" }
    }
  ],
  "flow": [
    { "from": "起点", "to": "上の中継", "label": "上の道", "tone": "info" },
    { "from": "起点", "to": "下の中継", "label": "下の道", "tone": "warning" },
    { "from": "上の中継", "to": "終点", "label": "合流", "tone": "info" },
    { "from": "下の中継", "to": "終点", "label": "合流", "tone": "warning" }
  ],
  "states": { "p1": 0, "p2": 0, "p3": 0, "p4": 0 },
  "animation": [
    {
      "step": "2 つの道を通る",
      "duration": 4,
      "focus": ["起点", "上の中継", "下の中継", "終点", "起点 -> 上の中継", "起点 -> 下の中継", "上の中継 -> 終点", "下の中継 -> 終点"],
      "tween": { "p1": [0, 1], "p2": [0, 1], "p3": [0, 1], "p4": [0, 1] }
    }
  ]
}`;

export const sourceYaml__partsLoadBalancer = `title: "負荷分散器 — 入口 1 つを 3 つの出口へ同じ量ずつ配る"
type: flow

lanes:
  lb1: { x: 0, width: 200, label: "入口" }
  lb2: { x: 220, width: 200, label: "配る先" }

states:
  inLv: 0
  o1: 0
  o2: 0
  o3: 0

actors:
  - 入口: { kind: dyn-rect, lane: lb1, stack: 1, subtitle: "{inLv} 件/秒", posW: 150, posH: 150, shape: { kind: rect, source: "{inLv}", fillMax: 90, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 出口 1: { kind: dyn-rect, lane: lb2, stack: 0, subtitle: "{o1} 件/秒", posW: 150, posH: 150, shape: { kind: rect, source: "{o1}", fillMax: 90, orient: up, fill: "#22c55e", radius: 6 } }
  - 出口 2: { kind: dyn-rect, lane: lb2, stack: 1, subtitle: "{o2} 件/秒", posW: 150, posH: 150, shape: { kind: rect, source: "{o2}", fillMax: 90, orient: up, fill: "#22c55e", radius: 6 } }
  - 出口 3: { kind: dyn-rect, lane: lb2, stack: 2, subtitle: "{o3} 件/秒", posW: 150, posH: 150, shape: { kind: rect, source: "{o3}", fillMax: 90, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 入口 -> 出口 1: "上へ" (success)
  - 入口 -> 出口 2: "中へ" (success)
  - 入口 -> 出口 3: "下へ" (success)

animation:
  - step: "3 つへ同じ量ずつ配る" 4s
    focus: ["入口", "出口 1", "出口 2", "出口 3", "入口 -> 出口 1", "入口 -> 出口 2", "入口 -> 出口 3"]
    tween:
      inLv: 0 -> 90
      o1: 0 -> 30
      o2: 0 -> 30
      o3: 0 -> 30
`;

export const sourceJson__partsLoadBalancer = `{
  "title": "負荷分散器 — 入口 1 つを 3 つの出口へ同じ量ずつ配る",
  "type": "flow",
  "lanes": {
    "lb1": { "x": 0, "width": 200, "label": "入口" },
    "lb2": { "x": 220, "width": 200, "label": "配る先" }
  },
  "actors": [
    {
      "name": "入口",
      "kind": "dyn-rect",
      "lane": "lb1",
      "stack": 1,
      "subtitle": "{inLv} 件/秒",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inLv}", "fillMax": 90, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "出口 1",
      "kind": "dyn-rect",
      "lane": "lb2",
      "stack": 0,
      "subtitle": "{o1} 件/秒",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{o1}", "fillMax": 90, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "出口 2",
      "kind": "dyn-rect",
      "lane": "lb2",
      "stack": 1,
      "subtitle": "{o2} 件/秒",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{o2}", "fillMax": 90, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "出口 3",
      "kind": "dyn-rect",
      "lane": "lb2",
      "stack": 2,
      "subtitle": "{o3} 件/秒",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{o3}", "fillMax": 90, "orient": "up", "fill": "#22c55e", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "入口", "to": "出口 1", "label": "上へ", "tone": "success" },
    { "from": "入口", "to": "出口 2", "label": "中へ", "tone": "success" },
    { "from": "入口", "to": "出口 3", "label": "下へ", "tone": "success" }
  ],
  "states": { "inLv": 0, "o1": 0, "o2": 0, "o3": 0 },
  "animation": [
    {
      "step": "3 つへ同じ量ずつ配る",
      "duration": 4,
      "focus": ["入口", "出口 1", "出口 2", "出口 3", "入口 -> 出口 1", "入口 -> 出口 2", "入口 -> 出口 3"],
      "tween": { "inLv": [0, 90], "o1": [0, 30], "o2": [0, 30], "o3": [0, 30] }
    }
  ]
}`;

export const sourceYaml__partsFanoutCopy = `title: "複製器 — 発行した中身を 3 つの受け手へ同じまま写す"
type: flow

lanes:
  fc1: { x: 0, width: 200, label: "発行" }
  fc2: { x: 220, width: 200, label: "受け手" }

states:
  pub: 0
  s1: 0
  s2: 0
  s3: 0

actors:
  - 発行: { kind: dyn-rect, lane: fc1, stack: 1, subtitle: "{pub} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{pub}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 6 } }
  - 受け手 1: { kind: dyn-rect, lane: fc2, stack: 0, subtitle: "{s1} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{s1}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 6 } }
  - 受け手 2: { kind: dyn-rect, lane: fc2, stack: 1, subtitle: "{s2} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{s2}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 6 } }
  - 受け手 3: { kind: dyn-rect, lane: fc2, stack: 2, subtitle: "{s3} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{s3}", fillMax: 100, orient: up, fill: "#8b5cf6", radius: 6 } }

flow:
  - 発行 -> 受け手 1: "写す" (accent)
  - 発行 -> 受け手 2: "写す" (accent)
  - 発行 -> 受け手 3: "写す" (accent)

animation:
  - step: "全員へ同じものを写す" 4s
    focus: ["発行", "受け手 1", "受け手 2", "受け手 3", "発行 -> 受け手 1", "発行 -> 受け手 2", "発行 -> 受け手 3"]
    tween:
      pub: 0 -> 100
      s1: 0 -> 100
      s2: 0 -> 100
      s3: 0 -> 100
`;

export const sourceJson__partsFanoutCopy = `{
  "title": "複製器 — 発行した中身を 3 つの受け手へ同じまま写す",
  "type": "flow",
  "lanes": {
    "fc1": { "x": 0, "width": 200, "label": "発行" },
    "fc2": { "x": 220, "width": 200, "label": "受け手" }
  },
  "actors": [
    {
      "name": "発行",
      "kind": "dyn-rect",
      "lane": "fc1",
      "stack": 1,
      "subtitle": "{pub} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{pub}", "fillMax": 100, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    },
    {
      "name": "受け手 1",
      "kind": "dyn-rect",
      "lane": "fc2",
      "stack": 0,
      "subtitle": "{s1} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{s1}", "fillMax": 100, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    },
    {
      "name": "受け手 2",
      "kind": "dyn-rect",
      "lane": "fc2",
      "stack": 1,
      "subtitle": "{s2} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{s2}", "fillMax": 100, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    },
    {
      "name": "受け手 3",
      "kind": "dyn-rect",
      "lane": "fc2",
      "stack": 2,
      "subtitle": "{s3} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{s3}", "fillMax": 100, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "発行", "to": "受け手 1", "label": "写す", "tone": "accent" },
    { "from": "発行", "to": "受け手 2", "label": "写す", "tone": "accent" },
    { "from": "発行", "to": "受け手 3", "label": "写す", "tone": "accent" }
  ],
  "states": { "pub": 0, "s1": 0, "s2": 0, "s3": 0 },
  "animation": [
    {
      "step": "全員へ同じものを写す",
      "duration": 4,
      "focus": ["発行", "受け手 1", "受け手 2", "受け手 3", "発行 -> 受け手 1", "発行 -> 受け手 2", "発行 -> 受け手 3"],
      "tween": { "pub": [0, 100], "s1": [0, 100], "s2": [0, 100], "s3": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsRateLimiter = `title: "流量制限 — 札の数だけ通し、札が尽きた分を断る"
type: flow

lanes:
  rl1: { x: 0, width: 200, label: "届く" }
  rl2: { x: 220, width: 200, label: "札" }
  rl3: { x: 440, width: 200, label: "行き先" }

states:
  inN: 0
  tokens: 10
  passN: 0
  rejectN: 0

actors:
  - 届く: { kind: dyn-rect, lane: rl1, stack: 0, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 16, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 札: { kind: dyn-rect, lane: rl2, stack: 0, subtitle: "残り {tokens} 枚", posW: 150, posH: 150, shape: { kind: rect, source: "{tokens}", fillMax: 10, orient: up, fill: "#f59e0b", radius: 6 } }
  - 通す: { kind: dyn-rect, lane: rl3, stack: 0, subtitle: "{passN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{passN}", fillMax: 16, orient: up, fill: "#22c55e", radius: 6 } }
  - 断る: { kind: dyn-rect, lane: rl3, stack: 1, subtitle: "{rejectN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{rejectN}", fillMax: 16, orient: up, fill: "#dc2626", radius: 6 } }

flow:
  - 届く -> 札: "1 枚ずつ" (info)
  - 札 -> 通す: "通す" (success)
  - 札 -> 断る: "断る" (error)

animation:
  - step: "札の数だけ通す" 4s
    focus: ["届く", "札", "通す", "断る", "届く -> 札", "札 -> 通す", "札 -> 断る"]
    tween:
      inN: 0 -> 16
      tokens: 10 -> 0
      passN: 0 -> 10
      rejectN: 0 -> 6
`;

export const sourceJson__partsRateLimiter = `{
  "title": "流量制限 — 札の数だけ通し、札が尽きた分を断る",
  "type": "flow",
  "lanes": {
    "rl1": { "x": 0, "width": 200, "label": "届く" },
    "rl2": { "x": 220, "width": 200, "label": "札" },
    "rl3": { "x": 440, "width": 200, "label": "行き先" }
  },
  "actors": [
    {
      "name": "届く",
      "kind": "dyn-rect",
      "lane": "rl1",
      "stack": 0,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inN}", "fillMax": 16, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "札",
      "kind": "dyn-rect",
      "lane": "rl2",
      "stack": 0,
      "subtitle": "残り {tokens} 枚",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{tokens}", "fillMax": 10, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    },
    {
      "name": "通す",
      "kind": "dyn-rect",
      "lane": "rl3",
      "stack": 0,
      "subtitle": "{passN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{passN}", "fillMax": 16, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "断る",
      "kind": "dyn-rect",
      "lane": "rl3",
      "stack": 1,
      "subtitle": "{rejectN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{rejectN}", "fillMax": 16, "orient": "up", "fill": "#dc2626", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "届く", "to": "札", "label": "1 枚ずつ", "tone": "info" },
    { "from": "札", "to": "通す", "label": "通す", "tone": "success" },
    { "from": "札", "to": "断る", "label": "断る", "tone": "error" }
  ],
  "states": { "inN": 0, "tokens": 10, "passN": 0, "rejectN": 0 },
  "animation": [
    {
      "step": "札の数だけ通す",
      "duration": 4,
      "focus": ["届く", "札", "通す", "断る", "届く -> 札", "札 -> 通す", "札 -> 断る"],
      "tween": { "inN": [0, 16], "tokens": [10, 0], "passN": [0, 10], "rejectN": [0, 6] }
    }
  ]
}`;

export const sourceYaml__partsPriorityQueue = `title: "優先度の並べ替え — 急ぎと通常を 1 列に並べ、急ぎを先に出す"
type: flow

lanes:
  pq1: { x: 0, width: 200, label: "届く" }
  pq2: { x: 220, width: 200, label: "並べる" }
  pq3: { x: 440, width: 200, label: "出る" }

states:
  hiN: 0
  loN: 0
  depth: 0
  outN: 0

actors:
  - 急ぎ: { kind: dyn-rect, lane: pq1, stack: 0, subtitle: "{hiN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{hiN}", fillMax: 10, orient: up, fill: "#dc2626", radius: 6 } }
  - 通常: { kind: dyn-rect, lane: pq1, stack: 2, subtitle: "{loN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{loN}", fillMax: 10, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 並べる: { kind: dyn-rect, lane: pq2, stack: 1, subtitle: "{depth} 件待ち", posW: 150, posH: 150, shape: { kind: rect, source: "{depth}", fillMax: 14, orient: up, fill: "#f59e0b", radius: 6 } }
  - 出る: { kind: dyn-rect, lane: pq3, stack: 1, subtitle: "{outN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{outN}", fillMax: 14, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 急ぎ -> 並べる: "先に" (error)
  - 通常 -> 並べる: "後に" (info)
  - 並べる -> 出る: "出す" (success)

animation:
  - step: "急ぎを先に出す" 4s
    focus: ["急ぎ", "通常", "並べる", "出る", "急ぎ -> 並べる", "通常 -> 並べる", "並べる -> 出る"]
    tween:
      hiN: 0 -> 6
      loN: 0 -> 8
      depth: 0 -> 8
      outN: 0 -> 6
`;

export const sourceJson__partsPriorityQueue = `{
  "title": "優先度の並べ替え — 急ぎと通常を 1 列に並べ、急ぎを先に出す",
  "type": "flow",
  "lanes": {
    "pq1": { "x": 0, "width": 200, "label": "届く" },
    "pq2": { "x": 220, "width": 200, "label": "並べる" },
    "pq3": { "x": 440, "width": 200, "label": "出る" }
  },
  "actors": [
    {
      "name": "急ぎ",
      "kind": "dyn-rect",
      "lane": "pq1",
      "stack": 0,
      "subtitle": "{hiN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{hiN}", "fillMax": 10, "orient": "up", "fill": "#dc2626", "radius": 6 }
    },
    {
      "name": "通常",
      "kind": "dyn-rect",
      "lane": "pq1",
      "stack": 2,
      "subtitle": "{loN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{loN}", "fillMax": 10, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "並べる",
      "kind": "dyn-rect",
      "lane": "pq2",
      "stack": 1,
      "subtitle": "{depth} 件待ち",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{depth}", "fillMax": 14, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    },
    {
      "name": "出る",
      "kind": "dyn-rect",
      "lane": "pq3",
      "stack": 1,
      "subtitle": "{outN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{outN}", "fillMax": 14, "orient": "up", "fill": "#22c55e", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "急ぎ", "to": "並べる", "label": "先に", "tone": "error" },
    { "from": "通常", "to": "並べる", "label": "後に", "tone": "info" },
    { "from": "並べる", "to": "出る", "label": "出す", "tone": "success" }
  ],
  "states": { "hiN": 0, "loN": 0, "depth": 0, "outN": 0 },
  "animation": [
    {
      "step": "急ぎを先に出す",
      "duration": 4,
      "focus": ["急ぎ", "通常", "並べる", "出る", "急ぎ -> 並べる", "通常 -> 並べる", "並べる -> 出る"],
      "tween": { "hiN": [0, 6], "loN": [0, 8], "depth": [0, 8], "outN": [0, 6] }
    }
  ]
}`;

export const sourceYaml__partsFailoverSwitch = `title: "切替器 — 常用が落ちると予備へ倒れる"
type: flow

lanes:
  fo1: { x: 0, width: 200, label: "入口" }
  fo2: { x: 220, width: 200, label: "行き先" }

states:
  inLv: 100
  mainLv: 100
  subLv: 0

actors:
  - 入口: { kind: dyn-rect, lane: fo1, stack: 1, subtitle: "{inLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{inLv}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 常用: { kind: dyn-rect, lane: fo2, stack: 0, subtitle: "{mainLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{mainLv}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }
  - 予備: { kind: dyn-rect, lane: fo2, stack: 2, subtitle: "{subLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{subLv}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 6 } }

flow:
  - 入口 -> 常用: "常用へ" (success)
  - 入口 -> 予備: "倒す" (warning)

animation:
  - step: "予備へ倒れる" 4s
    focus: ["入口", "常用", "予備", "入口 -> 常用", "入口 -> 予備"]
    tween:
      mainLv: 100 -> 0
      subLv: 0 -> 100
`;

export const sourceJson__partsFailoverSwitch = `{
  "title": "切替器 — 常用が落ちると予備へ倒れる",
  "type": "flow",
  "lanes": {
    "fo1": { "x": 0, "width": 200, "label": "入口" },
    "fo2": { "x": 220, "width": 200, "label": "行き先" }
  },
  "actors": [
    {
      "name": "入口",
      "kind": "dyn-rect",
      "lane": "fo1",
      "stack": 1,
      "subtitle": "{inLv}%",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inLv}", "fillMax": 100, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "常用",
      "kind": "dyn-rect",
      "lane": "fo2",
      "stack": 0,
      "subtitle": "{mainLv}%",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{mainLv}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "予備",
      "kind": "dyn-rect",
      "lane": "fo2",
      "stack": 2,
      "subtitle": "{subLv}%",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{subLv}", "fillMax": 100, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "入口", "to": "常用", "label": "常用へ", "tone": "success" },
    { "from": "入口", "to": "予備", "label": "倒す", "tone": "warning" }
  ],
  "states": { "inLv": 100, "mainLv": 100, "subLv": 0 },
  "animation": [
    {
      "step": "予備へ倒れる",
      "duration": 4,
      "focus": ["入口", "常用", "予備", "入口 -> 常用", "入口 -> 予備"],
      "tween": { "mainLv": [100, 0], "subLv": [0, 100] }
    }
  ]
}`;

export const sourceYaml__partsRetryLoop = `title: "やり直しの輪 — 落ちた分をもう一度試して通す"
type: flow

lanes:
  rt1: { x: 0, width: 200, label: "試す" }
  rt2: { x: 220, width: 200, label: "結果" }

states:
  tryN: 0
  okN: 0
  ngN: 0
  againN: 0

actors:
  - 試す: { kind: dyn-rect, lane: rt1, stack: 0, subtitle: "{tryN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{tryN}", fillMax: 12, orient: up, fill: "#4e9dc4", radius: 6 } }
  - やり直す: { kind: dyn-rect, lane: rt1, stack: 2, subtitle: "{againN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{againN}", fillMax: 12, orient: up, fill: "#f59e0b", radius: 6 } }
  - 通る: { kind: dyn-rect, lane: rt2, stack: 1, subtitle: "{okN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{okN}", fillMax: 12, orient: up, fill: "#22c55e", radius: 6 } }
  - 落ちる: { kind: dyn-rect, lane: rt2, stack: 2, subtitle: "{ngN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{ngN}", fillMax: 12, orient: up, fill: "#dc2626", radius: 6 } }

flow:
  - 試す -> 通る: "通る" (success)
  - 試す -> 落ちる: "落ちる" (error)
  - 落ちる -> やり直す: "戻す" (warning)
  - やり直す -> 通る: "通る" (success)

animation:
  - step: "落ちた分をもう一度試す" 4s
    focus: ["試す", "やり直す", "通る", "落ちる", "試す -> 通る", "試す -> 落ちる", "落ちる -> やり直す", "やり直す -> 通る"]
    tween:
      tryN: 0 -> 12
      okN: 0 -> 12
      ngN: 0 -> 3
      againN: 0 -> 3
`;

export const sourceJson__partsRetryLoop = `{
  "title": "やり直しの輪 — 落ちた分をもう一度試して通す",
  "type": "flow",
  "lanes": {
    "rt1": { "x": 0, "width": 200, "label": "試す" },
    "rt2": { "x": 220, "width": 200, "label": "結果" }
  },
  "actors": [
    {
      "name": "試す",
      "kind": "dyn-rect",
      "lane": "rt1",
      "stack": 0,
      "subtitle": "{tryN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{tryN}", "fillMax": 12, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "やり直す",
      "kind": "dyn-rect",
      "lane": "rt1",
      "stack": 2,
      "subtitle": "{againN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{againN}", "fillMax": 12, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    },
    {
      "name": "通る",
      "kind": "dyn-rect",
      "lane": "rt2",
      "stack": 1,
      "subtitle": "{okN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{okN}", "fillMax": 12, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "落ちる",
      "kind": "dyn-rect",
      "lane": "rt2",
      "stack": 2,
      "subtitle": "{ngN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{ngN}", "fillMax": 12, "orient": "up", "fill": "#dc2626", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "試す", "to": "通る", "label": "通る", "tone": "success" },
    { "from": "試す", "to": "落ちる", "label": "落ちる", "tone": "error" },
    { "from": "落ちる", "to": "やり直す", "label": "戻す", "tone": "warning" },
    { "from": "やり直す", "to": "通る", "label": "通る", "tone": "success" }
  ],
  "states": { "tryN": 0, "okN": 0, "ngN": 0, "againN": 0 },
  "animation": [
    {
      "step": "落ちた分をもう一度試す",
      "duration": 4,
      "focus": ["試す", "やり直す", "通る", "落ちる", "試す -> 通る", "試す -> 落ちる", "落ちる -> やり直す", "やり直す -> 通る"],
      "tween": { "tryN": [0, 12], "okN": [0, 12], "ngN": [0, 3], "againN": [0, 3] }
    }
  ]
}`;

export const sourceYaml__partsBatchCollector = `title: "まとめ箱 — 1 件ずつ溜めて、満ちたらまとめて送る"
type: flow

lanes:
  bt1: { x: 0, width: 200, label: "溜める" }
  bt2: { x: 220, width: 200, label: "送る" }

states:
  inN: 0
  poolN: 0
  sendN: 0

actors:
  - 届く: { kind: dyn-rect, lane: bt1, stack: 0, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 溜まり: { kind: dyn-rect, lane: bt1, stack: 1, subtitle: "{poolN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{poolN}", fillMax: 10, orient: up, fill: "#f59e0b", radius: 6 } }
  - まとめて送る: { kind: dyn-rect, lane: bt2, stack: 1, subtitle: "{sendN} 回", posW: 150, posH: 150, shape: { kind: rect, source: "{sendN}", fillMax: 3, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 届く -> 溜まり: "ひとつずつ" (info)
  - 溜まり -> まとめて送る: "満ちたら" (success)

animation:
  - step: "満ちたら送る" 4s
    focus: ["届く", "溜まり", "まとめて送る", "届く -> 溜まり", "溜まり -> まとめて送る"]
    tween:
      inN: 0 -> 30
      poolN: 0 -> 10
      sendN: 0 -> 3
`;

export const sourceJson__partsBatchCollector = `{
  "title": "まとめ箱 — 1 件ずつ溜めて、満ちたらまとめて送る",
  "type": "flow",
  "lanes": {
    "bt1": { "x": 0, "width": 200, "label": "溜める" },
    "bt2": { "x": 220, "width": 200, "label": "送る" }
  },
  "actors": [
    {
      "name": "届く",
      "kind": "dyn-rect",
      "lane": "bt1",
      "stack": 0,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inN}", "fillMax": 30, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "溜まり",
      "kind": "dyn-rect",
      "lane": "bt1",
      "stack": 1,
      "subtitle": "{poolN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{poolN}", "fillMax": 10, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    },
    {
      "name": "まとめて送る",
      "kind": "dyn-rect",
      "lane": "bt2",
      "stack": 1,
      "subtitle": "{sendN} 回",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{sendN}", "fillMax": 3, "orient": "up", "fill": "#22c55e", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "届く", "to": "溜まり", "label": "ひとつずつ", "tone": "info" },
    { "from": "溜まり", "to": "まとめて送る", "label": "満ちたら", "tone": "success" }
  ],
  "states": { "inN": 0, "poolN": 0, "sendN": 0 },
  "animation": [
    {
      "step": "満ちたら送る",
      "duration": 4,
      "focus": ["届く", "溜まり", "まとめて送る", "届く -> 溜まり", "溜まり -> まとめて送る"],
      "tween": { "inN": [0, 30], "poolN": [0, 10], "sendN": [0, 3] }
    }
  ]
}`;

export const sourceYaml__partsContentSorter = `title: "仕分け箱 — 中身の種類で 3 つの行き先へ分ける"
type: flow

lanes:
  cs1: { x: 0, width: 200, label: "見る" }
  cs2: { x: 220, width: 200, label: "行き先" }

states:
  inN: 0
  aN: 0
  bN: 0
  cN: 0

actors:
  - 中身を見る: { kind: dyn-rect, lane: cs1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 20, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 注文: { kind: dyn-rect, lane: cs2, stack: 0, subtitle: "{aN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{aN}", fillMax: 20, orient: up, fill: "#22c55e", radius: 6 } }
  - 問い合わせ: { kind: dyn-rect, lane: cs2, stack: 1, subtitle: "{bN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{bN}", fillMax: 20, orient: up, fill: "#8b5cf6", radius: 6 } }
  - その他: { kind: dyn-rect, lane: cs2, stack: 2, subtitle: "{cN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{cN}", fillMax: 20, orient: up, fill: "#94a3b8", radius: 6 } }

flow:
  - 中身を見る -> 注文: "注文" (success)
  - 中身を見る -> 問い合わせ: "問い" (info)
  - 中身を見る -> その他: "残り" (warning)

animation:
  - step: "種類で分ける" 4s
    focus: ["中身を見る", "注文", "問い合わせ", "その他", "中身を見る -> 注文", "中身を見る -> 問い合わせ", "中身を見る -> その他"]
    tween:
      inN: 0 -> 20
      aN: 0 -> 11
      bN: 0 -> 6
      cN: 0 -> 3
`;

export const sourceJson__partsContentSorter = `{
  "title": "仕分け箱 — 中身の種類で 3 つの行き先へ分ける",
  "type": "flow",
  "lanes": {
    "cs1": { "x": 0, "width": 200, "label": "見る" },
    "cs2": { "x": 220, "width": 200, "label": "行き先" }
  },
  "actors": [
    {
      "name": "中身を見る",
      "kind": "dyn-rect",
      "lane": "cs1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inN}", "fillMax": 20, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "注文",
      "kind": "dyn-rect",
      "lane": "cs2",
      "stack": 0,
      "subtitle": "{aN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{aN}", "fillMax": 20, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "問い合わせ",
      "kind": "dyn-rect",
      "lane": "cs2",
      "stack": 1,
      "subtitle": "{bN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{bN}", "fillMax": 20, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    },
    {
      "name": "その他",
      "kind": "dyn-rect",
      "lane": "cs2",
      "stack": 2,
      "subtitle": "{cN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{cN}", "fillMax": 20, "orient": "up", "fill": "#94a3b8", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "中身を見る", "to": "注文", "label": "注文", "tone": "success" },
    { "from": "中身を見る", "to": "問い合わせ", "label": "問い", "tone": "info" },
    { "from": "中身を見る", "to": "その他", "label": "残り", "tone": "warning" }
  ],
  "states": { "inN": 0, "aN": 0, "bN": 0, "cN": 0 },
  "animation": [
    {
      "step": "種類で分ける",
      "duration": 4,
      "focus": ["中身を見る", "注文", "問い合わせ", "その他", "中身を見る -> 注文", "中身を見る -> 問い合わせ", "中身を見る -> その他"],
      "tween": { "inN": [0, 20], "aN": [0, 11], "bN": [0, 6], "cN": [0, 3] }
    }
  ]
}`;

// ============================================================
// 入った分をそのまま出さない部品の記法 (#2193)
// ============================================================

export const sourceYaml__partsCircuitBreaker = `title: "遮断器 — 落ちる分が増えると送るのをやめる"
type: flow

lanes:
  cb1: { x: 0, width: 200, label: "入口" }
  cb2: { x: 220, width: 200, label: "結果" }

states:
  inN: 0
  okN: 0
  ngN: 0
  cutN: 0

actors:
  - 送る: { kind: dyn-rect, lane: cb1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 20, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 通る: { kind: dyn-rect, lane: cb2, stack: 0, subtitle: "{okN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{okN}", fillMax: 20, orient: up, fill: "#22c55e", radius: 6 } }
  - 落ちる: { kind: dyn-rect, lane: cb2, stack: 1, subtitle: "{ngN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{ngN}", fillMax: 20, orient: up, fill: "#ef4444", radius: 6 } }
  - 断る: { kind: dyn-rect, lane: cb2, stack: 2, subtitle: "{cutN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{cutN}", fillMax: 20, orient: up, fill: "#94a3b8", radius: 6 } }

flow:
  - 送る -> 通る: "通る" (success)
  - 送る -> 落ちる: "落ちる" (error)
  - 送る -> 断る: "試さない" (warning)

animation:
  - step: "落ちる分が増えて遮断する" 4s
    focus: ["送る", "通る", "落ちる", "断る", "送る -> 通る", "送る -> 落ちる", "送る -> 断る"]
    tween:
      inN: 0 -> 20
      okN: 0 -> 6
      ngN: 0 -> 6
      cutN: 0 -> 8
`;

export const sourceJson__partsCircuitBreaker = `{
  "title": "遮断器 — 落ちる分が増えると送るのをやめる",
  "type": "flow",
  "lanes": {
    "cb1": { "x": 0, "width": 200, "label": "入口" },
    "cb2": { "x": 220, "width": 200, "label": "結果" }
  },
  "actors": [
    {
      "name": "送る",
      "kind": "dyn-rect",
      "lane": "cb1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inN}", "fillMax": 20, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "通る",
      "kind": "dyn-rect",
      "lane": "cb2",
      "stack": 0,
      "subtitle": "{okN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{okN}", "fillMax": 20, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "落ちる",
      "kind": "dyn-rect",
      "lane": "cb2",
      "stack": 1,
      "subtitle": "{ngN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{ngN}", "fillMax": 20, "orient": "up", "fill": "#ef4444", "radius": 6 }
    },
    {
      "name": "断る",
      "kind": "dyn-rect",
      "lane": "cb2",
      "stack": 2,
      "subtitle": "{cutN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{cutN}", "fillMax": 20, "orient": "up", "fill": "#94a3b8", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "送る", "to": "通る", "label": "通る", "tone": "success" },
    { "from": "送る", "to": "落ちる", "label": "落ちる", "tone": "error" },
    { "from": "送る", "to": "断る", "label": "試さない", "tone": "warning" }
  ],
  "states": { "inN": 0, "okN": 0, "ngN": 0, "cutN": 0 },
  "animation": [
    {
      "step": "落ちる分が増えて遮断する",
      "duration": 4,
      "focus": ["送る", "通る", "落ちる", "断る", "送る -> 通る", "送る -> 落ちる", "送る -> 断る"],
      "tween": { "inN": [0, 20], "okN": [0, 6], "ngN": [0, 6], "cutN": [0, 8] }
    }
  ]
}`;

export const sourceYaml__partsCacheBox = `title: "写し箱 — 手元に写しがある分は奥まで行かない"
type: flow

lanes:
  ca1: { x: 0, width: 200, label: "問う" }
  ca2: { x: 220, width: 200, label: "返す" }

states:
  askN: 0
  hitN: 0
  missN: 0

actors:
  - 問い合わせ: { kind: dyn-rect, lane: ca1, stack: 1, subtitle: "{askN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{askN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 手元から: { kind: dyn-rect, lane: ca2, stack: 0, subtitle: "{hitN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{hitN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }
  - 奥から: { kind: dyn-rect, lane: ca2, stack: 2, subtitle: "{missN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{missN}", fillMax: 24, orient: up, fill: "#f59e0b", radius: 6 } }

flow:
  - 問い合わせ -> 手元から: "写しあり" (success)
  - 問い合わせ -> 奥から: "写しなし" (warning)

animation:
  - step: "写しで返す" 4s
    focus: ["問い合わせ", "手元から", "奥から", "問い合わせ -> 手元から", "問い合わせ -> 奥から"]
    tween:
      askN: 0 -> 24
      hitN: 0 -> 18
      missN: 0 -> 6
`;

export const sourceJson__partsCacheBox = `{
  "title": "写し箱 — 手元に写しがある分は奥まで行かない",
  "type": "flow",
  "lanes": {
    "ca1": { "x": 0, "width": 200, "label": "問う" },
    "ca2": { "x": 220, "width": 200, "label": "返す" }
  },
  "actors": [
    {
      "name": "問い合わせ",
      "kind": "dyn-rect",
      "lane": "ca1",
      "stack": 1,
      "subtitle": "{askN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{askN}", "fillMax": 24, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "手元から",
      "kind": "dyn-rect",
      "lane": "ca2",
      "stack": 0,
      "subtitle": "{hitN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{hitN}", "fillMax": 24, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "奥から",
      "kind": "dyn-rect",
      "lane": "ca2",
      "stack": 2,
      "subtitle": "{missN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{missN}", "fillMax": 24, "orient": "up", "fill": "#f59e0b", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "問い合わせ", "to": "手元から", "label": "写しあり", "tone": "success" },
    { "from": "問い合わせ", "to": "奥から", "label": "写しなし", "tone": "warning" }
  ],
  "states": { "askN": 0, "hitN": 0, "missN": 0 },
  "animation": [
    {
      "step": "写しで返す",
      "duration": 4,
      "focus": ["問い合わせ", "手元から", "奥から", "問い合わせ -> 手元から", "問い合わせ -> 奥から"],
      "tween": { "askN": [0, 24], "hitN": [0, 18], "missN": [0, 6] }
    }
  ]
}`;

export const sourceYaml__partsBarrierBox = `title: "待ち合わせ箱 — 両方そろった分だけ出す"
type: flow

lanes:
  bw1: { x: 0, width: 200, label: "届く" }
  bw2: { x: 220, width: 200, label: "出す" }

states:
  aN: 0
  bN: 0
  outN: 0

actors:
  - 左から: { kind: dyn-rect, lane: bw1, stack: 0, subtitle: "{aN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{aN}", fillMax: 12, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 右から: { kind: dyn-rect, lane: bw1, stack: 2, subtitle: "{bN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{bN}", fillMax: 12, orient: up, fill: "#8b5cf6", radius: 6 } }
  - そろった分: { kind: dyn-rect, lane: bw2, stack: 1, subtitle: "{outN} 組", posW: 150, posH: 150, shape: { kind: rect, source: "{outN}", fillMax: 12, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 左から -> そろった分: "左が来る" (info)
  - 右から -> そろった分: "右が来る" (info)

animation:
  - step: "そろった分だけ出す" 4s
    focus: ["左から", "右から", "そろった分", "左から -> そろった分", "右から -> そろった分"]
    tween:
      aN: 0 -> 12
      bN: 0 -> 7
      outN: 0 -> 7
`;

export const sourceJson__partsBarrierBox = `{
  "title": "待ち合わせ箱 — 両方そろった分だけ出す",
  "type": "flow",
  "lanes": {
    "bw1": { "x": 0, "width": 200, "label": "届く" },
    "bw2": { "x": 220, "width": 200, "label": "出す" }
  },
  "actors": [
    {
      "name": "左から",
      "kind": "dyn-rect",
      "lane": "bw1",
      "stack": 0,
      "subtitle": "{aN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{aN}", "fillMax": 12, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "右から",
      "kind": "dyn-rect",
      "lane": "bw1",
      "stack": 2,
      "subtitle": "{bN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{bN}", "fillMax": 12, "orient": "up", "fill": "#8b5cf6", "radius": 6 }
    },
    {
      "name": "そろった分",
      "kind": "dyn-rect",
      "lane": "bw2",
      "stack": 1,
      "subtitle": "{outN} 組",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{outN}", "fillMax": 12, "orient": "up", "fill": "#22c55e", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "左から", "to": "そろった分", "label": "左が来る", "tone": "info" },
    { "from": "右から", "to": "そろった分", "label": "右が来る", "tone": "info" }
  ],
  "states": { "aN": 0, "bN": 0, "outN": 0 },
  "animation": [
    {
      "step": "そろった分だけ出す",
      "duration": 4,
      "focus": ["左から", "右から", "そろった分", "左から -> そろった分", "右から -> そろった分"],
      "tween": { "aN": [0, 12], "bN": [0, 7], "outN": [0, 7] }
    }
  ]
}`;

export const sourceYaml__partsDedupeBox = `title: "重なり消し箱 — 二度目に来たものを捨てる"
type: flow

lanes:
  dd1: { x: 0, width: 200, label: "入口" }
  dd2: { x: 220, width: 200, label: "行き先" }

states:
  inN: 0
  keepN: 0
  dropN: 0

actors:
  - 届く: { kind: dyn-rect, lane: dd1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 残す: { kind: dyn-rect, lane: dd2, stack: 0, subtitle: "{keepN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{keepN}", fillMax: 30, orient: up, fill: "#22c55e", radius: 6 } }
  - 捨てる: { kind: dyn-rect, lane: dd2, stack: 2, subtitle: "{dropN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{dropN}", fillMax: 30, orient: up, fill: "#94a3b8", radius: 6 } }

flow:
  - 届く -> 残す: "初めて" (success)
  - 届く -> 捨てる: "二度目" (warning)

animation:
  - step: "重なりを消す" 4s
    focus: ["届く", "残す", "捨てる", "届く -> 残す", "届く -> 捨てる"]
    tween:
      inN: 0 -> 30
      keepN: 0 -> 18
      dropN: 0 -> 12
`;

export const sourceJson__partsDedupeBox = `{
  "title": "重なり消し箱 — 二度目に来たものを捨てる",
  "type": "flow",
  "lanes": {
    "dd1": { "x": 0, "width": 200, "label": "入口" },
    "dd2": { "x": 220, "width": 200, "label": "行き先" }
  },
  "actors": [
    {
      "name": "届く",
      "kind": "dyn-rect",
      "lane": "dd1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{inN}", "fillMax": 30, "orient": "up", "fill": "#4e9dc4", "radius": 6 }
    },
    {
      "name": "残す",
      "kind": "dyn-rect",
      "lane": "dd2",
      "stack": 0,
      "subtitle": "{keepN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{keepN}", "fillMax": 30, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "捨てる",
      "kind": "dyn-rect",
      "lane": "dd2",
      "stack": 2,
      "subtitle": "{dropN} 件",
      "posW": 150,
      "posH": 150,
      "shape": { "kind": "rect", "source": "{dropN}", "fillMax": 30, "orient": "up", "fill": "#94a3b8", "radius": 6 }
    }
  ],
  "flow": [
    { "from": "届く", "to": "残す", "label": "初めて", "tone": "success" },
    { "from": "届く", "to": "捨てる", "label": "二度目", "tone": "warning" }
  ],
  "states": { "inN": 0, "keepN": 0, "dropN": 0 },
  "animation": [
    {
      "step": "重なりを消す",
      "duration": 4,
      "focus": ["届く", "残す", "捨てる", "届く -> 残す", "届く -> 捨てる"],
      "tween": { "inN": [0, 30], "keepN": [0, 18], "dropN": [0, 12] }
    }
  ]
}`;


// ============================================================
// 入口の外側が出る分を決める部品の記法 (#2199)
// ============================================================

export const sourceYaml__partsEvictBox = `title: "押し出し箱 — 置き場が満ちると古いものから押し出される"
type: flow

lanes:
  ev1: { x: 0, width: 200, label: "入口" }
  ev2: { x: 220, width: 200, label: "行き先" }

states:
  inN: 0
  keepN: 0
  pushN: 0

actors:
  - 届く: { kind: dyn-rect, lane: ev1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 置ける: { kind: dyn-rect, lane: ev2, stack: 0, subtitle: "{keepN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{keepN}", fillMax: 30, orient: up, fill: "#22c55e", radius: 6 } }
  - 押し出す: { kind: dyn-rect, lane: ev2, stack: 2, subtitle: "{pushN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{pushN}", fillMax: 30, orient: up, fill: "#94a3b8", radius: 6 } }

flow:
  - 届く -> 置ける: "置く" (success)
  - 届く -> 押し出す: "古い順" (warning)

animation:
  - step: "古いものから押し出す" 4s
    focus: ["届く", "置ける", "押し出す", "届く -> 置ける", "届く -> 押し出す"]
    tween:
      inN: 0 -> 30
      keepN: 0 -> 10
      pushN: 0 -> 20
`;

export const sourceJson__partsEvictBox = `{
  "title": "押し出し箱 — 置き場が満ちると古いものから押し出される",
  "type": "flow",
  "lanes": {
    "ev1": {
      "x": 0,
      "width": 200,
      "label": "入口"
    },
    "ev2": {
      "x": 220,
      "width": 200,
      "label": "行き先"
    }
  },
  "actors": [
    {
      "name": "届く",
      "kind": "dyn-rect",
      "lane": "ev1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "置ける",
      "kind": "dyn-rect",
      "lane": "ev2",
      "stack": 0,
      "subtitle": "{keepN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{keepN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "押し出す",
      "kind": "dyn-rect",
      "lane": "ev2",
      "stack": 2,
      "subtitle": "{pushN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{pushN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#94a3b8",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "届く",
      "to": "置ける",
      "label": "置く",
      "tone": "success"
    },
    {
      "from": "届く",
      "to": "押し出す",
      "label": "古い順",
      "tone": "warning"
    }
  ],
  "states": {
    "inN": 0,
    "keepN": 0,
    "pushN": 0
  },
  "animation": [
    {
      "step": "古いものから押し出す",
      "duration": 4,
      "focus": [
        "届く",
        "置ける",
        "押し出す",
        "届く -> 置ける",
        "届く -> 押し出す"
      ],
      "tween": {
        "inN": [
          0,
          30
        ],
        "keepN": [
          0,
          10
        ],
        "pushN": [
          0,
          20
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsExpireBox = `title: "期限切れ箱 — 置いてから時が過ぎたものが自分で消える"
type: flow

lanes:
  tt1: { x: 0, width: 200, label: "置く" }
  tt2: { x: 220, width: 200, label: "時が経つ" }

states:
  putN: 0
  liveN: 0
  goneN: 0

actors:
  - 置く: { kind: dyn-rect, lane: tt1, stack: 1, subtitle: "{putN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{putN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - まだ残る: { kind: dyn-rect, lane: tt2, stack: 0, subtitle: "{liveN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{liveN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }
  - 消える: { kind: dyn-rect, lane: tt2, stack: 2, subtitle: "{goneN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{goneN}", fillMax: 24, orient: up, fill: "#94a3b8", radius: 6 } }

flow:
  - 置く -> まだ残る: "新しい" (success)
  - 置く -> 消える: "時が来た" (warning)

animation:
  - step: "時が過ぎた分が消える" 4s
    focus: ["置く", "まだ残る", "消える", "置く -> まだ残る", "置く -> 消える"]
    tween:
      putN: 0 -> 24
      liveN: 0 -> 9
      goneN: 0 -> 15
`;

export const sourceJson__partsExpireBox = `{
  "title": "期限切れ箱 — 置いてから時が過ぎたものが自分で消える",
  "type": "flow",
  "lanes": {
    "tt1": {
      "x": 0,
      "width": 200,
      "label": "置く"
    },
    "tt2": {
      "x": 220,
      "width": 200,
      "label": "時が経つ"
    }
  },
  "actors": [
    {
      "name": "置く",
      "kind": "dyn-rect",
      "lane": "tt1",
      "stack": 1,
      "subtitle": "{putN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{putN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "まだ残る",
      "kind": "dyn-rect",
      "lane": "tt2",
      "stack": 0,
      "subtitle": "{liveN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{liveN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "消える",
      "kind": "dyn-rect",
      "lane": "tt2",
      "stack": 2,
      "subtitle": "{goneN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{goneN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#94a3b8",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "置く",
      "to": "まだ残る",
      "label": "新しい",
      "tone": "success"
    },
    {
      "from": "置く",
      "to": "消える",
      "label": "時が来た",
      "tone": "warning"
    }
  ],
  "states": {
    "putN": 0,
    "liveN": 0,
    "goneN": 0
  },
  "animation": [
    {
      "step": "時が過ぎた分が消える",
      "duration": 4,
      "focus": [
        "置く",
        "まだ残る",
        "消える",
        "置く -> まだ残る",
        "置く -> 消える"
      ],
      "tween": {
        "putN": [
          0,
          24
        ],
        "liveN": [
          0,
          9
        ],
        "goneN": [
          0,
          15
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsBackpressure = `title: "押し戻し箱 — 後ろが詰まると入口の勢いが絞られる"
type: flow

lanes:
  bp1: { x: 0, width: 200, label: "送る" }
  bp2: { x: 220, width: 200, label: "受ける" }

states:
  inLv: 100
  qLv: 0
  outLv: 40

actors:
  - 送る: { kind: dyn-rect, lane: bp1, stack: 1, subtitle: "{inLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{inLv}", fillMax: 100, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 待ち: { kind: dyn-rect, lane: bp2, stack: 1, subtitle: "{qLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{qLv}", fillMax: 100, orient: up, fill: "#f59e0b", radius: 6 } }
  - 出す: { kind: dyn-rect, lane: bp2, stack: 2, subtitle: "{outLv}%", posW: 150, posH: 150, shape: { kind: rect, source: "{outLv}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 送る -> 待ち: "積む" (info)
  - 待ち -> 出す: "出す" (success)
  - 出す -> 送る: "絞る" (warning)

animation:
  - step: "詰まって入口が絞られる" 4s
    focus: ["送る", "待ち", "出す", "送る -> 待ち", "待ち -> 出す", "出す -> 送る"]
    tween:
      qLv: 0 -> 100
      inLv: 100 -> 40
`;

export const sourceJson__partsBackpressure = `{
  "title": "押し戻し箱 — 後ろが詰まると入口の勢いが絞られる",
  "type": "flow",
  "lanes": {
    "bp1": {
      "x": 0,
      "width": 200,
      "label": "送る"
    },
    "bp2": {
      "x": 220,
      "width": 200,
      "label": "受ける"
    }
  },
  "actors": [
    {
      "name": "送る",
      "kind": "dyn-rect",
      "lane": "bp1",
      "stack": 1,
      "subtitle": "{inLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "待ち",
      "kind": "dyn-rect",
      "lane": "bp2",
      "stack": 1,
      "subtitle": "{qLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{qLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    },
    {
      "name": "出す",
      "kind": "dyn-rect",
      "lane": "bp2",
      "stack": 2,
      "subtitle": "{outLv}%",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{outLv}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "送る",
      "to": "待ち",
      "label": "積む",
      "tone": "info"
    },
    {
      "from": "待ち",
      "to": "出す",
      "label": "出す",
      "tone": "success"
    },
    {
      "from": "出す",
      "to": "送る",
      "label": "絞る",
      "tone": "warning"
    }
  ],
  "states": {
    "inLv": 100,
    "qLv": 0,
    "outLv": 40
  },
  "animation": [
    {
      "step": "詰まって入口が絞られる",
      "duration": 4,
      "focus": [
        "送る",
        "待ち",
        "出す",
        "送る -> 待ち",
        "待ち -> 出す",
        "出す -> 送る"
      ],
      "tween": {
        "qLv": [
          0,
          100
        ],
        "inLv": [
          100,
          40
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsSplitBox = `title: "割り箱 — 1 つの大きいものが多くの小さいものに割れる"
type: flow

lanes:
  sp1: { x: 0, width: 200, label: "届く" }
  sp2: { x: 220, width: 200, label: "割った後" }

states:
  bigN: 0
  smallN: 0
  tagN: 0

actors:
  - 大きい荷物: { kind: dyn-rect, lane: sp1, stack: 1, subtitle: "{bigN} 個", posW: 150, posH: 150, shape: { kind: rect, source: "{bigN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 小さい荷物: { kind: dyn-rect, lane: sp2, stack: 0, subtitle: "{smallN} 個", posW: 150, posH: 150, shape: { kind: rect, source: "{smallN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }
  - 貼り直す札: { kind: dyn-rect, lane: sp2, stack: 2, subtitle: "{tagN} 枚", posW: 150, posH: 150, shape: { kind: rect, source: "{tagN}", fillMax: 24, orient: up, fill: "#8b5cf6", radius: 6 } }

flow:
  - 大きい荷物 -> 小さい荷物: "割る" (success)
  - 小さい荷物 -> 貼り直す札: "札を貼る" (info)

animation:
  - step: "割って札を貼り直す" 4s
    focus: ["大きい荷物", "小さい荷物", "貼り直す札", "大きい荷物 -> 小さい荷物", "小さい荷物 -> 貼り直す札"]
    tween:
      bigN: 0 -> 3
      smallN: 0 -> 24
      tagN: 0 -> 24
`;

export const sourceJson__partsSplitBox = `{
  "title": "割り箱 — 1 つの大きいものが多くの小さいものに割れる",
  "type": "flow",
  "lanes": {
    "sp1": {
      "x": 0,
      "width": 200,
      "label": "届く"
    },
    "sp2": {
      "x": 220,
      "width": 200,
      "label": "割った後"
    }
  },
  "actors": [
    {
      "name": "大きい荷物",
      "kind": "dyn-rect",
      "lane": "sp1",
      "stack": 1,
      "subtitle": "{bigN} 個",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{bigN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "小さい荷物",
      "kind": "dyn-rect",
      "lane": "sp2",
      "stack": 0,
      "subtitle": "{smallN} 個",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{smallN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "貼り直す札",
      "kind": "dyn-rect",
      "lane": "sp2",
      "stack": 2,
      "subtitle": "{tagN} 枚",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{tagN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "大きい荷物",
      "to": "小さい荷物",
      "label": "割る",
      "tone": "success"
    },
    {
      "from": "小さい荷物",
      "to": "貼り直す札",
      "label": "札を貼る",
      "tone": "info"
    }
  ],
  "states": {
    "bigN": 0,
    "smallN": 0,
    "tagN": 0
  },
  "animation": [
    {
      "step": "割って札を貼り直す",
      "duration": 4,
      "focus": [
        "大きい荷物",
        "小さい荷物",
        "貼り直す札",
        "大きい荷物 -> 小さい荷物",
        "小さい荷物 -> 貼り直す札"
      ],
      "tween": {
        "bigN": [
          0,
          3
        ],
        "smallN": [
          0,
          24
        ],
        "tagN": [
          0,
          24
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsReorderBox = `title: "順番戻し箱 — ばらばらに届いた順を元に戻す"
type: flow

lanes:
  ro1: { x: 0, width: 200, label: "入口" }
  ro2: { x: 220, width: 200, label: "順に並べる" }

states:
  inN: 0
  outN: 0
  holdN: 0

actors:
  - ばらばらに届く: { kind: dyn-rect, lane: ro1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 20, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 順に出せる: { kind: dyn-rect, lane: ro2, stack: 0, subtitle: "{outN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{outN}", fillMax: 20, orient: up, fill: "#22c55e", radius: 6 } }
  - 番を待つ: { kind: dyn-rect, lane: ro2, stack: 2, subtitle: "{holdN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{holdN}", fillMax: 20, orient: up, fill: "#f59e0b", radius: 6 } }

flow:
  - ばらばらに届く -> 順に出せる: "出せる" (success)
  - ばらばらに届く -> 番を待つ: "出せない" (warning)

animation:
  - step: "番が来た分だけ出す" 4s
    focus: ["ばらばらに届く", "順に出せる", "番を待つ", "ばらばらに届く -> 順に出せる", "ばらばらに届く -> 番を待つ"]
    tween:
      inN: 0 -> 20
      outN: 0 -> 12
      holdN: 0 -> 8
`;

export const sourceJson__partsReorderBox = `{
  "title": "順番戻し箱 — ばらばらに届いた順を元に戻す",
  "type": "flow",
  "lanes": {
    "ro1": {
      "x": 0,
      "width": 200,
      "label": "入口"
    },
    "ro2": {
      "x": 220,
      "width": 200,
      "label": "順に並べる"
    }
  },
  "actors": [
    {
      "name": "ばらばらに届く",
      "kind": "dyn-rect",
      "lane": "ro1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inN}",
        "fillMax": 20,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "順に出せる",
      "kind": "dyn-rect",
      "lane": "ro2",
      "stack": 0,
      "subtitle": "{outN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{outN}",
        "fillMax": 20,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "番を待つ",
      "kind": "dyn-rect",
      "lane": "ro2",
      "stack": 2,
      "subtitle": "{holdN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{holdN}",
        "fillMax": 20,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "ばらばらに届く",
      "to": "順に出せる",
      "label": "出せる",
      "tone": "success"
    },
    {
      "from": "ばらばらに届く",
      "to": "番を待つ",
      "label": "出せない",
      "tone": "warning"
    }
  ],
  "states": {
    "inN": 0,
    "outN": 0,
    "holdN": 0
  },
  "animation": [
    {
      "step": "番が来た分だけ出す",
      "duration": 4,
      "focus": [
        "ばらばらに届く",
        "順に出せる",
        "番を待つ",
        "ばらばらに届く -> 順に出せる",
        "ばらばらに届く -> 番を待つ"
      ],
      "tween": {
        "inN": [
          0,
          20
        ],
        "outN": [
          0,
          12
        ],
        "holdN": [
          0,
          8
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsKeyRouter = `title: "鍵割り箱 — 同じ鍵は必ず同じ行き先へ行く"
type: flow

lanes:
  kr1: { x: 0, width: 200, label: "入口" }
  kr2: { x: 220, width: 200, label: "鍵の先" }

states:
  inN: 0
  aN: 0
  bN: 0

actors:
  - 届く: { kind: dyn-rect, lane: kr1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 同じ鍵の先: { kind: dyn-rect, lane: kr2, stack: 0, subtitle: "{aN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{aN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }
  - 別の鍵の先: { kind: dyn-rect, lane: kr2, stack: 2, subtitle: "{bN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{bN}", fillMax: 24, orient: up, fill: "#8b5cf6", radius: 6 } }

flow:
  - 届く -> 同じ鍵の先: "鍵が同じ" (success)
  - 届く -> 別の鍵の先: "鍵が違う" (info)

animation:
  - step: "鍵で行き先が決まる" 4s
    focus: ["届く", "同じ鍵の先", "別の鍵の先", "届く -> 同じ鍵の先", "届く -> 別の鍵の先"]
    tween:
      inN: 0 -> 24
      aN: 0 -> 18
      bN: 0 -> 6
`;

export const sourceJson__partsKeyRouter = `{
  "title": "鍵割り箱 — 同じ鍵は必ず同じ行き先へ行く",
  "type": "flow",
  "lanes": {
    "kr1": {
      "x": 0,
      "width": 200,
      "label": "入口"
    },
    "kr2": {
      "x": 220,
      "width": 200,
      "label": "鍵の先"
    }
  },
  "actors": [
    {
      "name": "届く",
      "kind": "dyn-rect",
      "lane": "kr1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "同じ鍵の先",
      "kind": "dyn-rect",
      "lane": "kr2",
      "stack": 0,
      "subtitle": "{aN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{aN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "別の鍵の先",
      "kind": "dyn-rect",
      "lane": "kr2",
      "stack": 2,
      "subtitle": "{bN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{bN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "届く",
      "to": "同じ鍵の先",
      "label": "鍵が同じ",
      "tone": "success"
    },
    {
      "from": "届く",
      "to": "別の鍵の先",
      "label": "鍵が違う",
      "tone": "info"
    }
  ],
  "states": {
    "inN": 0,
    "aN": 0,
    "bN": 0
  },
  "animation": [
    {
      "step": "鍵で行き先が決まる",
      "duration": 4,
      "focus": [
        "届く",
        "同じ鍵の先",
        "別の鍵の先",
        "届く -> 同じ鍵の先",
        "届く -> 別の鍵の先"
      ],
      "tween": {
        "inN": [
          0,
          24
        ],
        "aN": [
          0,
          18
        ],
        "bN": [
          0,
          6
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsSingleFlight = `title: "相乗り箱 — 同時に来た同じ問いを 1 本にまとめる"
type: flow

lanes:
  sf1: { x: 0, width: 200, label: "重なる問い" }
  sf2: { x: 220, width: 200, label: "返す" }

states:
  askN: 0
  oneN: 0
  allN: 0

actors:
  - 同じ問い: { kind: dyn-rect, lane: sf1, stack: 1, subtitle: "{askN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{askN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 奥へ行く: { kind: dyn-rect, lane: sf2, stack: 0, subtitle: "{oneN} 本", posW: 150, posH: 150, shape: { kind: rect, source: "{oneN}", fillMax: 24, orient: up, fill: "#f59e0b", radius: 6 } }
  - 皆へ配る: { kind: dyn-rect, lane: sf2, stack: 2, subtitle: "{allN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{allN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - 同じ問い -> 奥へ行く: "まとめる" (success)
  - 同じ問い -> 皆へ配る: "同じ答え" (info)

animation:
  - step: "1 本にまとめて皆へ配る" 4s
    focus: ["同じ問い", "奥へ行く", "皆へ配る", "同じ問い -> 奥へ行く", "同じ問い -> 皆へ配る"]
    tween:
      askN: 0 -> 24
      oneN: 0 -> 2
      allN: 0 -> 24
`;

export const sourceJson__partsSingleFlight = `{
  "title": "相乗り箱 — 同時に来た同じ問いを 1 本にまとめる",
  "type": "flow",
  "lanes": {
    "sf1": {
      "x": 0,
      "width": 200,
      "label": "重なる問い"
    },
    "sf2": {
      "x": 220,
      "width": 200,
      "label": "返す"
    }
  },
  "actors": [
    {
      "name": "同じ問い",
      "kind": "dyn-rect",
      "lane": "sf1",
      "stack": 1,
      "subtitle": "{askN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{askN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "奥へ行く",
      "kind": "dyn-rect",
      "lane": "sf2",
      "stack": 0,
      "subtitle": "{oneN} 本",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{oneN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    },
    {
      "name": "皆へ配る",
      "kind": "dyn-rect",
      "lane": "sf2",
      "stack": 2,
      "subtitle": "{allN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{allN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "同じ問い",
      "to": "奥へ行く",
      "label": "まとめる",
      "tone": "success"
    },
    {
      "from": "同じ問い",
      "to": "皆へ配る",
      "label": "同じ答え",
      "tone": "info"
    }
  ],
  "states": {
    "askN": 0,
    "oneN": 0,
    "allN": 0
  },
  "animation": [
    {
      "step": "1 本にまとめて皆へ配る",
      "duration": 4,
      "focus": [
        "同じ問い",
        "奥へ行く",
        "皆へ配る",
        "同じ問い -> 奥へ行く",
        "同じ問い -> 皆へ配る"
      ],
      "tween": {
        "askN": [
          0,
          24
        ],
        "oneN": [
          0,
          2
        ],
        "allN": [
          0,
          24
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsFairQueue = `title: "釣り合い箱 — たくさん送る人が他の人を待たせない"
type: flow

lanes:
  fq1: { x: 0, width: 200, label: "送り主" }
  fq2: { x: 220, width: 200, label: "出口" }

states:
  bigN: 0
  smallN: 0
  outN: 0

actors:
  - たくさん送る: { kind: dyn-rect, lane: fq1, stack: 0, subtitle: "{bigN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{bigN}", fillMax: 30, orient: up, fill: "#8b5cf6", radius: 6 } }
  - 少しだけ送る: { kind: dyn-rect, lane: fq1, stack: 2, subtitle: "{smallN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{smallN}", fillMax: 30, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 順に出す: { kind: dyn-rect, lane: fq2, stack: 1, subtitle: "{outN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{outN}", fillMax: 30, orient: up, fill: "#22c55e", radius: 6 } }

flow:
  - たくさん送る -> 順に出す: "順番に" (info)
  - 少しだけ送る -> 順に出す: "順番に" (info)

animation:
  - step: "送り主ごとに同じだけ出す" 4s
    focus: ["たくさん送る", "少しだけ送る", "順に出す", "たくさん送る -> 順に出す", "少しだけ送る -> 順に出す"]
    tween:
      bigN: 0 -> 30
      smallN: 0 -> 6
      outN: 0 -> 12
`;

export const sourceJson__partsFairQueue = `{
  "title": "釣り合い箱 — たくさん送る人が他の人を待たせない",
  "type": "flow",
  "lanes": {
    "fq1": {
      "x": 0,
      "width": 200,
      "label": "送り主"
    },
    "fq2": {
      "x": 220,
      "width": 200,
      "label": "出口"
    }
  },
  "actors": [
    {
      "name": "たくさん送る",
      "kind": "dyn-rect",
      "lane": "fq1",
      "stack": 0,
      "subtitle": "{bigN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{bigN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#8b5cf6",
        "radius": 6
      }
    },
    {
      "name": "少しだけ送る",
      "kind": "dyn-rect",
      "lane": "fq1",
      "stack": 2,
      "subtitle": "{smallN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{smallN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "順に出す",
      "kind": "dyn-rect",
      "lane": "fq2",
      "stack": 1,
      "subtitle": "{outN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{outN}",
        "fillMax": 30,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "たくさん送る",
      "to": "順に出す",
      "label": "順番に",
      "tone": "info"
    },
    {
      "from": "少しだけ送る",
      "to": "順に出す",
      "label": "順番に",
      "tone": "info"
    }
  ],
  "states": {
    "bigN": 0,
    "smallN": 0,
    "outN": 0
  },
  "animation": [
    {
      "step": "送り主ごとに同じだけ出す",
      "duration": 4,
      "focus": [
        "たくさん送る",
        "少しだけ送る",
        "順に出す",
        "たくさん送る -> 順に出す",
        "少しだけ送る -> 順に出す"
      ],
      "tween": {
        "bigN": [
          0,
          30
        ],
        "smallN": [
          0,
          6
        ],
        "outN": [
          0,
          12
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsDeadLetter = `title: "よけ道箱 — やり直しても駄目な分を脇へ出す"
type: flow

lanes:
  dl1: { x: 0, width: 200, label: "入口" }
  dl2: { x: 220, width: 200, label: "行き先" }

states:
  inN: 0
  okN: 0
  deadN: 0

actors:
  - 何度もやり直す: { kind: dyn-rect, lane: dl1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 24, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 先へ進む: { kind: dyn-rect, lane: dl2, stack: 0, subtitle: "{okN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{okN}", fillMax: 24, orient: up, fill: "#22c55e", radius: 6 } }
  - 脇へ出す: { kind: dyn-rect, lane: dl2, stack: 2, subtitle: "{deadN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{deadN}", fillMax: 24, orient: up, fill: "#dc2626", radius: 6 } }

flow:
  - 何度もやり直す -> 先へ進む: "通った" (success)
  - 何度もやり直す -> 脇へ出す: "諦めた" (error)

animation:
  - step: "やり直しの末に分かれる" 4s
    focus: ["何度もやり直す", "先へ進む", "脇へ出す", "何度もやり直す -> 先へ進む", "何度もやり直す -> 脇へ出す"]
    tween:
      inN: 0 -> 24
      okN: 0 -> 21
      deadN: 0 -> 3
`;

export const sourceJson__partsDeadLetter = `{
  "title": "よけ道箱 — やり直しても駄目な分を脇へ出す",
  "type": "flow",
  "lanes": {
    "dl1": {
      "x": 0,
      "width": 200,
      "label": "入口"
    },
    "dl2": {
      "x": 220,
      "width": 200,
      "label": "行き先"
    }
  },
  "actors": [
    {
      "name": "何度もやり直す",
      "kind": "dyn-rect",
      "lane": "dl1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "先へ進む",
      "kind": "dyn-rect",
      "lane": "dl2",
      "stack": 0,
      "subtitle": "{okN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{okN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "脇へ出す",
      "kind": "dyn-rect",
      "lane": "dl2",
      "stack": 2,
      "subtitle": "{deadN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{deadN}",
        "fillMax": 24,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "何度もやり直す",
      "to": "先へ進む",
      "label": "通った",
      "tone": "success"
    },
    {
      "from": "何度もやり直す",
      "to": "脇へ出す",
      "label": "諦めた",
      "tone": "error"
    }
  ],
  "states": {
    "inN": 0,
    "okN": 0,
    "deadN": 0
  },
  "animation": [
    {
      "step": "やり直しの末に分かれる",
      "duration": 4,
      "focus": [
        "何度もやり直す",
        "先へ進む",
        "脇へ出す",
        "何度もやり直す -> 先へ進む",
        "何度もやり直す -> 脇へ出す"
      ],
      "tween": {
        "inN": [
          0,
          24
        ],
        "okN": [
          0,
          21
        ],
        "deadN": [
          0,
          3
        ]
      }
    }
  ]
}`;

export const sourceYaml__partsLockGate = `title: "一人ずつ箱 — 中に入れるのは一度に一つだけ"
type: flow

lanes:
  lg1: { x: 0, width: 200, label: "入口" }
  lg2: { x: 220, width: 200, label: "戸の内と外" }

states:
  inN: 0
  nowN: 0
  waitN: 0

actors:
  - 同時に来る: { kind: dyn-rect, lane: lg1, stack: 1, subtitle: "{inN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{inN}", fillMax: 18, orient: up, fill: "#4e9dc4", radius: 6 } }
  - 中に入る: { kind: dyn-rect, lane: lg2, stack: 0, subtitle: "{nowN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{nowN}", fillMax: 18, orient: up, fill: "#22c55e", radius: 6 } }
  - 戸の前で待つ: { kind: dyn-rect, lane: lg2, stack: 2, subtitle: "{waitN} 件", posW: 150, posH: 150, shape: { kind: rect, source: "{waitN}", fillMax: 18, orient: up, fill: "#f59e0b", radius: 6 } }

flow:
  - 同時に来る -> 中に入る: "入れる" (success)
  - 同時に来る -> 戸の前で待つ: "待つ" (warning)

animation:
  - step: "一度に一つだけ通す" 4s
    focus: ["同時に来る", "中に入る", "戸の前で待つ", "同時に来る -> 中に入る", "同時に来る -> 戸の前で待つ"]
    tween:
      inN: 0 -> 18
      nowN: 0 -> 1
      waitN: 0 -> 17
`;

export const sourceJson__partsLockGate = `{
  "title": "一人ずつ箱 — 中に入れるのは一度に一つだけ",
  "type": "flow",
  "lanes": {
    "lg1": {
      "x": 0,
      "width": 200,
      "label": "入口"
    },
    "lg2": {
      "x": 220,
      "width": 200,
      "label": "戸の内と外"
    }
  },
  "actors": [
    {
      "name": "同時に来る",
      "kind": "dyn-rect",
      "lane": "lg1",
      "stack": 1,
      "subtitle": "{inN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{inN}",
        "fillMax": 18,
        "orient": "up",
        "fill": "#4e9dc4",
        "radius": 6
      }
    },
    {
      "name": "中に入る",
      "kind": "dyn-rect",
      "lane": "lg2",
      "stack": 0,
      "subtitle": "{nowN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{nowN}",
        "fillMax": 18,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 6
      }
    },
    {
      "name": "戸の前で待つ",
      "kind": "dyn-rect",
      "lane": "lg2",
      "stack": 2,
      "subtitle": "{waitN} 件",
      "posW": 150,
      "posH": 150,
      "shape": {
        "kind": "rect",
        "source": "{waitN}",
        "fillMax": 18,
        "orient": "up",
        "fill": "#f59e0b",
        "radius": 6
      }
    }
  ],
  "flow": [
    {
      "from": "同時に来る",
      "to": "中に入る",
      "label": "入れる",
      "tone": "success"
    },
    {
      "from": "同時に来る",
      "to": "戸の前で待つ",
      "label": "待つ",
      "tone": "warning"
    }
  ],
  "states": {
    "inN": 0,
    "nowN": 0,
    "waitN": 0
  },
  "animation": [
    {
      "step": "一度に一つだけ通す",
      "duration": 4,
      "focus": [
        "同時に来る",
        "中に入る",
        "戸の前で待つ",
        "同時に来る -> 中に入る",
        "同時に来る -> 戸の前で待つ"
      ],
      "tween": {
        "inN": [
          0,
          18
        ],
        "nowN": [
          0,
          1
        ],
        "waitN": [
          0,
          17
        ]
      }
    }
  ]
}`;
