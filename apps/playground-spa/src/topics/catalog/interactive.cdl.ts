import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Interactive ... input widget / reactive state + formula / scroll-driven trigger /
 * event handler の 4 primitive の使い方 tour + visual binding (signal → node.w/h/opacity で
 * 実際に図形が動く) + 拡張 widget (xypad / stepper / radio / color) + readout widget
 * (bar / gauge / stat / sparkline) の 9 例。 全て抽象例のみで特定分野固有の題材は含まず、
 * library は汎用 primitive を提供、 domain 応用は consumer app 側の責務。
 */

const W = 480;

/**
 * 1. slider → node value bind (input widget primitive + reactive state)。
 */
export const inputSliderBar = diagram("interactive-slider-bar", {
  topic: "input.slider bind の 2-lane (Slider signal / Bar node) + bind edge、 signal → subtitle 反映経路を可視化",
})
  .lane("slider", { x: 0, width: 260 })
  .lane("output", { x: 300, width: 260 })
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "Value" })
  .state("value", { initial: 50 })
  .node("sliderNode", { lane: "slider", stack: 0, kind: "card", title: "Slider signal", subtitle: "value = {value}" })
  .node("bar-node", { lane: "output", stack: 0, kind: "card", title: "Bar", subtitle: "value: {value}" })
  .edge("sliderNode", "bar-node", { label: "signalバインド", tone: "info" })
  .phase("p", {
    duration: 1500,
    title: "signal bindフロー",
    body: "2-lane (Slider signal / Bar output)で 入力.slider bindの2ステップ を分散、 バインドedge (情報tone)でsignal伝搬明示、 slider変化でsignal `value` 更新 → bar-node subtitle {value} 追随、 primitive signal bindingをdataflow化。",
  }, (p: PhaseBuilder) => p.activate("sliderNode", "bar-node", "sliderNode-bar-node").badge("bind: value"))
  .build();

/**
 * 2. formula → text bind (formula primitive + reactive computed)。
 */
export const formulaTextBind = diagram("interactive-formula-text", {
  topic: "formula chain を 3-lane (Input / Doubled / Halved) 分散 + 2 dependency edge で dataflow network 化、 formula reactive を可視化",
})
  .lane("input", { x: 0, width: 200 })
  .lane("doubled", { x: 240, width: 200 })
  .lane("halved", { x: 480, width: 200 })
  .input.number("input", { defaultValue: 10, label: "入力" })
  .formula("doubled", "input * 2")
  .formula("halved", "input / 2")
  .state("input", { initial: 10 })
  .state("doubled", { initial: 20 })
  .state("halved", { initial: 5 })
  .node("in", { lane: "input", stack: 0, kind: "card", title: "入力", subtitle: "value = {入力}" })
  .node("out1", { lane: "doubled", stack: 0, kind: "card", title: "Doubled", subtitle: "入力 * 2 = {doubled}" })
  .node("out2", { lane: "halved", stack: 0, kind: "card", title: "Halved", subtitle: "入力 / 2 = {halved}" })
  .edge("in", "out1", { label: "× 2", tone: "success" })
  .edge("in", "out2", { label: "÷ 2", tone: "info" })
  .phase("p", {
    duration: 1500,
    title: "formula dataflow",
    body: "3-lane (入力 / Doubled / Halved)でformula chainを分散、 2 edge (× 2成功 / ÷ 2情報)でdependency明示、 入力 変化で2 formula reactiveに再計算、 node subtitle {doubled} / {halved} 追随、 formula依存の2D dataflow表示。",
  }, (p: PhaseBuilder) => p.activate("in", "out1", "out2", "in-out1", "in-out2").badge("formula bind"))
  .build();

/**
 * 3. scroll → progress readout (scroll-driven trigger)。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "scroll 0..1 progress を 3-lane (Step 1 / Step 2 / Step 3) step 別分散、 各 step 個別 lane、 scroll 進行が全 lane 同時追随",
})
  .lane("s1", { x: 0, width: 220 })
  .lane("s2", { x: 260, width: 220 })
  .lane("s3", { x: 520, width: 220 })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "Intro reveal" })
  .state("intro", { initial: 0 })
  .node("a", { lane: "s1", stack: 0, kind: "card", title: "ステップ1", subtitle: "進捗: {intro}" })
  .node("b", { lane: "s2", stack: 0, kind: "card", title: "ステップ2", subtitle: "進捗: {intro}" })
  .node("c", { lane: "s3", stack: 0, kind: "card", title: "ステップ3", subtitle: "進捗: {intro}" })
  .phase("p", {
    duration: 1500,
    title: "スクロールnarrative split",
    body: "3-lane (ステップ1 / ステップ2 / ステップ3)で3 narrativeステップ を横並び分散、 wrapper elementスクロール → intro進捗0→1変化 → 3 node subtitleが同時追随、 narrative進行をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("scroll bind"))
  .build();

/**
 * 4. click → toggle (event handler + hover)。
 */
export const clickToggle = diagram("interactive-click-toggle", {
  topic: "click event flow を 3-lane (Trigger button / Event handler / Signal state) + 2 edge、 click→handler→signal の 3 step dataflow",
})
  .lane("trigger", { x: 0, width: 200 })
  .lane("handler", { x: 240, width: 220 })
  .lane("signal", { x: 480, width: 200 })
  .input.toggle("active", { defaultValue: false, label: "有効" })
  .state("active", { initial: "off" })
  .node("btn", { lane: "trigger", stack: 0, kind: "card", title: "ボタン", subtitle: "クリックtarget" })
  .node("handlerNode", { lane: "handler", stack: 0, kind: "card", title: "Eventハンドラ", subtitle: "切替-有効 + hover-状態(消費者 実装)" })
  .node("signalNode", { lane: "signal", stack: 0, kind: "card", title: "Signal状態", subtitle: "有効 = {有効}" })
  .edge("btn", "handlerNode", { label: "クリック / hover", tone: "info" })
  .edge("handlerNode", "signalNode", { label: "切替", tone: "success" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p", {
    duration: 1500,
    title: "イベント フロー split",
    body: "3-lane (起動 ボタン / イベント ハンドラ / Signal状態)で クリック イベント フロー の3ステップ を分散、 2 edge (クリック 情報tone / 切替 成功tone)でdataflow明示、 ボタン クリック → 消費者 ハンドラ → 有効signal反転 → signalNode subtitle追随、 イベント 伝搬経路をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("btn", "handlerNode", "signalNode", "btn-handlerNode", "handlerNode-signalNode").badge("event bind"))
  .build();

/**
 * 5. visual binding = slider → node 実 width 変化 (arc-intro 相当の core UX)。
 * slider を drag すると bar node の SVG width が実際に伸縮、 subtitle だけでなく図形が動く。
 */
export const visualBindBar = diagram("interactive-visual-bar", {
  topic: "wBind visual binding を 3-lane (Signal source / Dynamic bar / Bar readout) + 2 edge、 signal → 実 SVG width の反映経路を可視化",
})
  .lane("signal", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 340 })
  .lane("readout", { x: 600, width: 220 })
  .input.slider("barW", { min: 40, max: 320, defaultValue: 160, label: "Bar width" })
  .state("barW", { initial: 160 })
  .node("signalNode", { lane: "signal", stack: 0, kind: "card", title: "Signal source", subtitle: "barW = {barW}" })
  .node("bar", {
    lane: "bar",
    stack: 0,
    kind: "card",
    title: "Dynamic Bar",
    subtitle: "幅Bind = {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .node("readoutNode", { lane: "readout", stack: 0, kind: "card", title: "Bar表示", subtitle: "表示.barがsignalを同時追随" })
  .edge("signalNode", "bar", { label: "幅Bind", tone: "info" })
  .edge("signalNode", "readoutNode", { label: "表示", tone: "success" })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "Width表示" })
  .phase("p", {
    duration: 1500,
    title: "visualバインドfan-外",
    body: "3-lane (Signal / Bar / 表示)でwBind visual bindingの3経路を分散、 2 edge (wBind情報 / readout成功)でsignal → 2 targetの1:N分岐明示、 slider変化でbar node SVG width + 表示.barが同時追随、 visual binding dataflowをlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("signalNode", "bar", "readoutNode", "signalNode-bar", "signalNode-readoutNode").badge("visual bind"))
  .build();

/**
 * 6. visual binding = slider → node opacity で fade in/out。
 */
export const visualBindOpacity = diagram("interactive-visual-opacity", {
  topic: "opacity visual bind を 3-lane (Fade control / Target opacity / Reference constant) + 2 edge、 signal 追随 vs 固定の対比可視化",
})
  .lane("control", { x: 0, width: 200 })
  .lane("target", { x: 240, width: 220 })
  .lane("ref", { x: 500, width: 200 })
  .input.slider("fade", { min: 0, max: 100, defaultValue: 100, label: "Opacity" })
  .formula("op", "fade / 100")
  .state("fade", { initial: 100 })
  .state("op", { initial: 1 })
  .node("controlNode", { lane: "control", stack: 0, kind: "card", title: "Fade control", subtitle: "fade = {fade} · op = {op}" })
  .node("target", {
    lane: "target",
    stack: 0,
    kind: "card",
    title: "Target",
    subtitle: "opacity: {op}",
    opacity: "{op}",
  })
  .node("ref", { lane: "ref", stack: 0, kind: "card", title: "Reference", subtitle: "always visible (opacity=1)" })
  .edge("controlNode", "target", { label: "opバインド", tone: "info" })
  .edge("controlNode", "ref", { label: "NOバインド", tone: "warning" })
  .readout.gauge("opGauge", { source: "fade", min: 0, max: 100, label: "Fade % ゲージ" })
  .phase("p", {
    duration: 1500,
    title: "opacityバインドvs constant",
    body: "3-lane (Fade control / Target opacityバインド / Reference constant)でopacity追随の有無を対比、 2 edge (op bind情報tone / NO bind警告tone)でbinding有無を明示、 slider (0..100)変化 → formula op (0..1) → target node opacity追随、 refは無反応(constant)、 visual binding効果をlane対比で可視化。",
  }, (p: PhaseBuilder) => p.activate("controlNode", "target", "ref", "controlNode-target", "controlNode-ref").badge("opacity bind"))
  .build();

/**
 * 7. XY pad = 2 軸選択、 stat readout で x/y を表示。
 */
export const xypadNavigate = diagram("interactive-xypad-nav", {
  topic: "XY pad 2D 座標を 4-lane quadrant (Q1/Q2/Q3/Q4) 分散、 現在 pos を center indicator + stat readout で数値化",
})
  .lane("q2", { x: 0, width: 160 })
  .lane("q1", { x: 180, width: 160 })
  .lane("q3", { x: 360, width: 160 })
  .lane("q4", { x: 540, width: 160 })
  .input.xypad("pos", {
    xMin: 0, xMax: 100, yMin: 0, yMax: 100,
    defaultX: 50, defaultY: 50,
    label: "Position",
  })
  .state("pos", { initial: "50,50" })
  .node("q2Node", { lane: "q2", stack: 0, kind: "card", title: "Q2 (x<50, y>50)", subtitle: "upper-左" })
  .node("q1Node", { lane: "q1", stack: 0, kind: "card", title: "Q1 (x>50, y>50)", subtitle: "upper-右" })
  .node("q3Node", { lane: "q3", stack: 0, kind: "card", title: "Q3 (x<50, y<50)", subtitle: "lower-左" })
  .node("q4Node", { lane: "q4", stack: 0, kind: "card", title: "Q4 (x>50, y<50)", subtitle: "lower-右" })
  .node("indicator", { lane: "q1", stack: 1, kind: "card", title: "◆ Current pos", subtitle: "{pos} (default中央 → Q1 boundary)" })
  .readout.stat("posStat", { source: "pos", label: "Selected", caption: "x,y内0..100" })
  .phase("p", {
    duration: 1500,
    title: "quadrant地図",
    body: "4-lane (Q2左上 / Q1右上 / Q3左下 / Q4右下)で2D座標空間をquadrant分散、 各quadrant個別 カード + 現在pos indicator (default 50,50 = 中心)、 stat readoutでpos数値化、 座標分類と数値表示の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("q2Node", "q1Node", "q3Node", "q4Node", "indicator").badge("xypad"))
  .build();

/**
 * 8. stepper で phase 相当の値を細かく調整、 bar readout に反映。
 */
export const stepperControl = diagram("interactive-stepper", {
  topic: "stepper control を 3-lane (Control input / Bar visualization / Stat readout) 分散 + 2 fan-out edge、 signal → 2 readout の 1:N 経路可視化",
})
  .lane("ctrl", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 220 })
  .lane("stat", { x: 480, width: 200 })
  .input.stepper("count", { min: 0, max: 10, defaultValue: 3, label: "数" })
  .state("count", { initial: 3 })
  .node("ctrlNode", { lane: "ctrl", stack: 0, kind: "card", title: "Stepper control", subtitle: "数 = {数} (0-10 range)" })
  .node("barNode", { lane: "bar", stack: 0, kind: "card", title: "Bar visual", subtitle: "count追随progress bar (表示.bar)" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", title: "Stat表示", subtitle: "count追随number + unit (表示.stat)" })
  .edge("ctrlNode", "barNode", { label: "→ bar", tone: "info" })
  .edge("ctrlNode", "statNode", { label: "→ stat", tone: "success" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "進捗bar" })
  .readout.stat("countStat", { source: "count", label: "合計", unit: " 項目" })
  .phase("p", {
    duration: 1500,
    title: "control → visual fan-外",
    body: "3-lane (Control / Bar / Stat)でstepperと2 readoutを分散、 2 fan-外edge (→ bar情報 / → stat成功)で1 signal → 数readoutのbind関係明示、 stepper +/- で 数 変化 → bar + statが同時追随、 signal分岐dataflowを可視化。",
  }, (p: PhaseBuilder) => p.activate("ctrlNode", "barNode", "statNode", "ctrlNode-barNode", "ctrlNode-statNode").badge("stepper"))
  .build();

/**
 * 9. number → sparkline = number 入力の履歴を line chart で。
 */
export const numberSparkline = diagram("interactive-number-spark", {
  topic: "number sparkline を 2-lane (Current value / History sparkline) 分散 + push edge、 現在値と履歴の関係を可視化",
})
  .lane("current", { x: 0, width: 220 })
  .lane("history", { x: 260, width: 320 })
  .input.number("val", { defaultValue: 20, label: "Value" })
  .state("val", { initial: 20 })
  .node("currentNode", { lane: "current", stack: 0, kind: "card", title: "Current", subtitle: "val = {val}" })
  .node("historyNode", { lane: "history", stack: 0, kind: "card", title: "履歴(15)", subtitle: "sparklineで直近15 push履歴" })
  .edge("currentNode", "historyNode", { label: "プッシュ", tone: "info" })
  .readout.sparkline("valHist", { source: "val", history: 15, color: "#e57373", label: "スパークライン 履歴" })
  .readout.stat("valStat", { source: "val", label: "Latest", caption: "入力 履歴の最新" })
  .phase("p", {
    duration: 1500,
    title: "current → 履歴push",
    body: "2-lane (Current value / 履歴 スパークライン15)でnumberスパークライン を分散、 current → 履歴 プッシュedge (情報tone)で履歴伝搬明示、 number入力変化で スパークライン に直近15履歴 プッシュ、 statが最新値。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "historyNode", "currentNode-historyNode").badge("sparkline"))
  .build();

/**
 * 9b. radio + stat = 選択肢と現在値。 radio で option 切替、 stat で文字列表示。
 */
export const radioSelect = diagram("interactive-radio-select", {
  topic: "radio 3 option (low/mid/high) を 3-lane 排他分散 + current indicator、 現在選択 mode 位置を明示",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 200 })
  .input.radio("mode", { options: ["low", "mid", "high"], defaultValue: "mid", label: "Mode" })
  .state("mode", { initial: "mid" })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "低mode", subtitle: "option: 低" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "中mode", subtitle: "option: 中(default)" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "高mode", subtitle: "option: 高" })
  .node("currentMode", { lane: "mid", stack: 1, kind: "card", title: "◆ Current", subtitle: "mode = {mode}" })
  .readout.stat("modeStat", { source: "mode", label: "Current", caption: "選択中" })
  .phase("p", {
    duration: 1500,
    title: "radio option split",
    body: "3-lane (低 / 中 / 高)でradio 3 optionを排他分散、 各option個別 カード + current indicator (default=中lane)、 radioクリック でmode signal更新 → subtitleとstat readout追随、 排他選択構造をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("lowNode", "midNode", "highNode", "currentMode").badge("radio"))
  .build();

/**
 * 10. color picker で node stroke を変える (theme 実験)。
 */
export const colorPickerTheme = diagram("interactive-color-theme", {
  topic: "color picker pipeline を 3-lane (Picker input / Swatch preview / Hex stat) + 2 edge、 hex signal 生成 dataflow を可視化",
})
  .lane("picker", { x: 0, width: 220 })
  .lane("swatch", { x: 260, width: 220 })
  .lane("stat", { x: 520, width: 220 })
  .input.color("accent", { defaultValue: "#2d6a8f", label: "Accent" })
  .state("accent", { initial: "#2d6a8f" })
  .node("pickerNode", { lane: "picker", stack: 0, kind: "card", title: "色picker", subtitle: "入力.colorウィジェット · default #2d6a8f" })
  .node("swatch", { lane: "swatch", stack: 0, kind: "card", title: "Swatchプレビュー", subtitle: "hex: {accent}" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", title: "Hex stat", subtitle: "表示.statでhex表示" })
  .edge("pickerNode", "swatch", { label: "選択", tone: "info" })
  .edge("swatch", "statNode", { label: "表示", tone: "success" })
  .readout.stat("hexReadout", { source: "accent", label: "Selected", caption: "hex色" })
  .phase("p", {
    duration: 1500,
    title: "colorパイプライン",
    body: "3-lane (Picker入力 / Swatchプレビュー / Hex stat)でcolor生成 パイプライン を分散、 2 edge (選択 情報tone / display成功tone)でdataflow明示、 色pickerでhex選択 → swatch subtitle + stat readoutが追随、 color選択の3ステップ 経路をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("pickerNode", "swatch", "statNode", "pickerNode-swatch", "swatch-statNode").badge("color"))
  .build();

/**
 * 11. shape primitive = rect fill、 signal で内部が実際に伸縮する汎用 container。
 */
export const shapeRectFill = diagram("interactive-shape-rect", {
  topic: "dyn-rect fill を 4-lane (Low 25% / Mid 50% / High 75% / Interactive slider) 分散、 3 static + 1 reactive rect 並列比較",
})
  .lane("low", { x: 0, width: 130 })
  .lane("mid", { x: 150, width: 130 })
  .lane("high", { x: 300, width: 130 })
  .lane("interactive", { x: 450, width: 160 })
  .input.slider("v", { min: 0, max: 100, defaultValue: 40, label: "Value" })
  .state("v", { initial: 40 })
  .state("low25", { initial: 25 })
  .state("mid50", { initial: 50 })
  .state("high75", { initial: 75 })
  .node("barLow", {
    lane: "low",
    stack: 0,
    kind: "dyn-rect",
    title: "低25%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{low25}", fillMax: 100, orient: "up", fill: "#94a3b8" },
  })
  .node("barMid", {
    lane: "mid",
    stack: 0,
    kind: "dyn-rect",
    title: "中50%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{mid50}", fillMax: 100, orient: "up", fill: "#2563eb" },
  })
  .node("barHigh", {
    lane: "high",
    stack: 0,
    kind: "dyn-rect",
    title: "高75%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{high75}", fillMax: 100, orient: "up", fill: "#f97316" },
  })
  .node("bar", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-rect",
    title: "Slider ({v}%)",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{v}", fillMax: 100, orient: "up", fill: "#2d6a8f" },
  })
  .phase("p", {
    duration: 1500,
    title: "rect fill range compare",
    body: "4-lane (低25% gray / 中50% blue / 高75% orange / Interactive slider teal)でdyn-rect fillを段階比較、 3 static + 1 reactive、 slider変化でInteractive laneが追随、 fill rangeを横並び比較 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("barLow", "barMid", "barHigh", "bar").badge("shape.rect"))
  .build();

/**
 * 12. chain fill = 3 個の rect を並列、 base 値の伝搬で各 fill が連動 (EIP1559 相当)。
 */
export const shapeChainFill = diagram("interactive-shape-chain", {
  topic: "3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化",
})
  .lane("l1", { x: 0, width: 130 })
  .lane("l2", { x: 150, width: 130 })
  .lane("l3", { x: 300, width: 130 })
  .input.slider("base", { min: 0, max: 100, defaultValue: 30, label: "Base" })
  .formula("gas1", "base")
  .formula("gas2", "base * 1.2")
  .formula("gas3", "base * 1.5")
  .state("base", { initial: 30 })
  .state("gas1", { initial: 30 })
  .state("gas2", { initial: 36 })
  .state("gas3", { initial: 45 })
  .node("r1", { lane: "l1", stack: 0, kind: "dyn-rect", title: "遮断1", subtitle: "gas: {gas1}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas1}", fillMax: 150, orient: "up", fill: "#2d6a8f" } })
  .node("r2", { lane: "l2", stack: 0, kind: "dyn-rect", title: "遮断2", subtitle: "gas: {gas2}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" } })
  .node("r3", { lane: "l3", stack: 0, kind: "dyn-rect", title: "遮断3", subtitle: "gas: {gas3}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" } })
  .phase("p", { duration: 1500, title: "chain追随 = 前値がformulaで次を駆動", body: "base sliderを動かすとgas1 = base、 gas2 = base*1.2、 gas3 = base*1.5で連動、 3 rectのfillが同時に伸縮。" }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3").badge("chain fill"))
  .build();

/**
 * 13. dyn-circle = radius / progress を signal で駆動、 progress ring の汎用版。
 */
export const shapeCirclePulse = diagram("interactive-shape-circle", {
  topic: "dyn-circle progress ring を 4-lane (0% / 33% / 66% / Interactive) 分散、 3 static + 1 reactive circle 並列比較",
})
  .lane("empty", { x: 0, width: 170 })
  .lane("third", { x: 180, width: 170 })
  .lane("twothird", { x: 360, width: 170 })
  .lane("interactive", { x: 540, width: 180 })
  .input.slider("p", { min: 0, max: 100, defaultValue: 60, label: "進捗" })
  .formula("prog", "p / 100")
  .state("p", { initial: 60 })
  .state("prog", { initial: 0.6 })
  .state("prog0", { initial: 0.0 })
  .state("prog33", { initial: 0.33 })
  .state("prog66", { initial: 0.66 })
  .node("cEmpty", { lane: "empty", stack: 0, kind: "dyn-circle", title: "0%", subtitle: "empty", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog0}", fill: "#94a3b8" } })
  .node("cThird", { lane: "third", stack: 0, kind: "dyn-circle", title: "33%", subtitle: "one-third", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog33}", fill: "#2563eb" } })
  .node("cTwoThird", { lane: "twothird", stack: 0, kind: "dyn-circle", title: "66%", subtitle: "two-third", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog66}", fill: "#f97316" } })
  .node("c", { lane: "interactive", stack: 0, kind: "dyn-circle", title: "Slider", subtitle: "{p}%", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog}", fill: "#2d6a8f" } })
  .phase("p", {
    duration: 1500,
    title: "circle進捗compare",
    body: "4-lane (0% gray / 33% blue / 66% orange / Interactive slider teal)でdyn-circle進捗ringを段階比較、 3 static + 1 reactive、 slider変化でInteractive laneが追随、 進捗ring rangeを横並び比較 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("cEmpty", "cThird", "cTwoThird", "c").badge("shape.circle"))
  .build();

/**
 * 14. dyn-arc = 角度で fill sweep、 gauge や circular progress の汎用形。
 */
export const shapeArcSweep = diagram("interactive-shape-arc", {
  topic: "dyn-arc gauge sweep を 4-lane (Min 0° / Quarter 90° / Half 180° / Interactive) 分散、 3 static + 1 reactive arc 並列比較",
})
  .lane("min", { x: 0, width: 180 })
  .lane("quarter", { x: 190, width: 180 })
  .lane("half", { x: 380, width: 180 })
  .lane("interactive", { x: 570, width: 200 })
  .input.slider("a", { min: 0, max: 270, defaultValue: 180, label: "Angle" })
  .state("a", { initial: 180 })
  .state("a0", { initial: 0 })
  .state("a90", { initial: 90 })
  .state("a180", { initial: 180 })
  .node("gMin", { lane: "min", stack: 0, kind: "dyn-arc", title: "0°", subtitle: "最小", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#94a3b8" } })
  .node("gQuarter", { lane: "quarter", stack: 0, kind: "dyn-arc", title: "90°", subtitle: "quarter", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" } })
  .node("gHalf", { lane: "half", stack: 0, kind: "dyn-arc", title: "180°", subtitle: "half", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" } })
  .node("g", { lane: "interactive", stack: 0, kind: "dyn-arc", title: "Slider", subtitle: "{a}°", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#2d6a8f" } })
  .phase("p", {
    duration: 1500,
    title: "arc sweep compare",
    body: "4-lane (0° gray / 90° blue / 180° orange / Interactive slider teal)でdyn-arc sweepを段階比較、 3 static + 1 reactive、 slider変化でInteractive laneが追随、 arc angle range (0-270° 内4 point)を横並び比較 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("gMin", "gQuarter", "gHalf", "g").badge("shape.arc"))
  .build();

/**
 * 15. dyn-wave = 水位表示、 tank / battery / liquid level の汎用形。
 */
export const shapeWaveTank = diagram("interactive-shape-wave", {
  topic: "dyn-wave tank level を 4-lane (Low 25 / Half 50 / High 75 / Interactive slider) 分散、 3 static + 1 reactive tank 並列比較",
})
  .lane("low", { x: 0, width: 160 })
  .lane("half", { x: 180, width: 160 })
  .lane("high", { x: 360, width: 160 })
  .lane("interactive", { x: 540, width: 180 })
  .input.slider("lvl", { min: 0, max: 100, defaultValue: 55, label: "レベル" })
  .state("lvl", { initial: 55 })
  .state("lvl25", { initial: 25 })
  .state("lvl50", { initial: 50 })
  .state("lvl75", { initial: 75 })
  .node("wLow", { lane: "low", stack: 0, kind: "dyn-wave", title: "低25%", subtitle: "25%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl25}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#94a3b8" } })
  .node("wHalf", { lane: "half", stack: 0, kind: "dyn-wave", title: "Half 50%", subtitle: "50%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl50}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#2563eb" } })
  .node("wHigh", { lane: "high", stack: 0, kind: "dyn-wave", title: "高75%", subtitle: "75%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl75}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#f97316" } })
  .node("w", { lane: "interactive", stack: 0, kind: "dyn-wave", title: "Slider", subtitle: "{lvl}%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" } })
  .phase("p", {
    duration: 1500,
    title: "tankレベルcompare",
    body: "4-lane (低25% gray / Half 50% blue / 高75% orange / Interactive slider teal)でdyn-wave tankレベル を段階比較、 3 static + 1 reactive、 slider変化でInteractive laneが追随、 tank / batteryレベルrangeを横並び比較 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("wLow", "wHalf", "wHigh", "w").badge("shape.wave"))
  .build();

/**
 * 16. dyn-polygon = 頂点数 + 回転を signal で駆動、 badge / medal / spinner の汎用形。
 */
export const shapePolyRotate = diagram("interactive-shape-polygon", {
  topic: "dyn-polygon sides を 4-lane (Triangle 3 / Hexagon 6 / Octagon 8 / Interactive hexagon slider) 分散、 3 static + 1 reactive polygon 並列比較",
})
  .lane("triangle", { x: 0, width: 180 })
  .lane("hexagon", { x: 200, width: 180 })
  .lane("octagon", { x: 400, width: 180 })
  .lane("interactive", { x: 600, width: 200 })
  .input.slider("rot", { min: 0, max: 360, defaultValue: 0, label: "Rotation" })
  .input.slider("radius", { min: 20, max: 80, defaultValue: 60, label: "Radius" })
  .state("rot", { initial: 0 })
  .state("radius", { initial: 60 })
  .state("rot0", { initial: 0 })
  .state("radius60", { initial: 60 })
  .node("polyTri", { lane: "triangle", stack: 0, kind: "dyn-polygon", title: "Triangle", subtitle: "sides=3", w: 180, h: 180,
    shape: { kind: "polygon", sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#94a3b8" } })
  .node("polyHex", { lane: "hexagon", stack: 0, kind: "dyn-polygon", title: "Hexagon", subtitle: "sides=6", w: 180, h: 180,
    shape: { kind: "polygon", sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" } })
  .node("polyOct", { lane: "octagon", stack: 0, kind: "dyn-polygon", title: "Octagon", subtitle: "sides=8", w: 180, h: 180,
    shape: { kind: "polygon", sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" } })
  .node("p", { lane: "interactive", stack: 0, kind: "dyn-polygon", title: "Hexagon slider", subtitle: "{rot}° · r={radius}", w: 200, h: 200,
    shape: { kind: "polygon", sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#2d6a8f" } })
  .phase("p", {
    duration: 1500,
    title: "polygon sides compare",
    body: "4-lane (Triangle 3 sides gray / Hexagon 6 sides blue / Octagon 8 sides orange / Interactive hexagon slider teal)でdyn-polygon sidesを段階比較、 3 static + 1 reactive、 rot/radius slider変化でInteractive laneが追随(回転 + 拡縮)、 polygon shape varietyを横並び比較 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("polyTri", "polyHex", "polyOct", "p").badge("shape.polygon"))
  .build();

/**
 * 17. repeat + derive chain = N 個の shape を宣言的に生成、 前値参照で連鎖伝搬。
 *     EIP1559 相当を 数行で書ける、 count を変えれば 3 → 5 → 10 個への拡張が同 template で成立。
 */
export const repeatDeriveChain = diagram("interactive-repeat-chain", {
  topic: "repeatNodes + deriveChain で N 個の rect を宣言的に生成、 前値連鎖で伝搬",
})
  .lane("l1", { x: 0, width: 100 })
  .lane("l2", { x: 120, width: 100 })
  .lane("l3", { x: 240, width: 100 })
  .lane("l4", { x: 360, width: 100 })
  .lane("l5", { x: 480, width: 100 })
  .input.slider("base", { min: 0, max: 60, defaultValue: 20, label: "Base" })
  // formula chain: gas1 = base、 gas2 = gas1*1.2、 gas3 = gas2*1.2、 gas4 = gas3*1.2、 gas5 = gas4*1.2
  .deriveChain("gas", 5, (i, prev) => (i === 0 ? "base" : `${prev} * 1.2`))
  .state("base", { initial: 20 })
  .state("gas1", { initial: 20 })
  .state("gas2", { initial: 24 })
  .state("gas3", { initial: 28.8 })
  .state("gas4", { initial: 34.56 })
  .state("gas5", { initial: 41.472 })
  // repeat 5 nodes: 各 rect は gas{i+1} を source、 lane l{i+1} に配置
  .repeatNodes(5, (i) => ({
    id: `r{i}`,
    lane: `l{i+1}`,
    stack: 0,
    kind: "dyn-rect" as const,
    title: `Block {i+1}`,
    subtitle: "gas: {gas{i+1}}",
    w: 80,
    h: 220,
    shape: { kind: "rect" as const, source: "{gas{i+1}}", fillMax: 130, orient: "up" as const, fill: "#2d6a8f" },
  }))
  .phase("p", { duration: 1500, title: "repeat + deriveで5 rectがchain伝搬", body: "数=5、 baseを動かすとgas1..gas5がformula chainで連鎖伝搬、 5 rectのfillが同時追随。" }, (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3", "r4").badge("repeat + derive"))
  .build();

/**
 * 18. dynamic readouts = countup / delta / percent-ring / typewriter を組合わせて KPI dashboard。
 */
export const dynamicReadouts = diagram("interactive-dynamic-readouts", {
  topic: "4 dynamic readout (countup/delta/percent-ring/typewriter) を 4-lane 分散、 各 readout 個別 lane、 signal → 4 readout の 1:N 経路可視化",
})
  .lane("count", { x: 0, width: 180 })
  .lane("delta", { x: 200, width: 180 })
  .lane("ring", { x: 400, width: 180 })
  .lane("text", { x: 600, width: 180 })
  .input.slider("rev", { min: 0, max: 500, defaultValue: 250, label: "売上" })
  .input.dropdown("status", { options: ["active", "pending", "closed"], defaultValue: "active", label: "状態" })
  .state("rev", { initial: 250 })
  .state("status", { initial: "active" })
  .node("countNode", { lane: "count", stack: 0, kind: "card", title: "Countup", subtitle: "rev={rev} · animated $ カウンター" })
  .node("deltaNode", { lane: "delta", stack: 0, kind: "card", title: "変化量", subtitle: "rev={rev} · ↑↓ arrow" })
  .node("ringNode", { lane: "ring", stack: 0, kind: "card", title: "パーセントring", subtitle: "rev/500 = {rev} 進捗" })
  .node("textNode", { lane: "text", stack: 0, kind: "card", title: "Typewriter", subtitle: "状態={状態} · 文字reveal" })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "売上 数" })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ 変化量" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "進捗ring" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "状態text" })
  .phase("p", {
    duration: 1500,
    title: "表示4-way split",
    body: "4-lane (Countup / 変化量 / パーセントring / Typewriter)で4 dynamic readoutを機能別分散、 各readout個別 カード + 対応readout node、 売上slider → 3 readout追随(countup/変化量/ring)、 状態dropdown → typewriter reveal、 1 signal → 数readoutのbind関係をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("countNode", "deltaNode", "ringNode", "textNode").badge("dashboard"))
  .build();

/**
 * 19. timeline = 時間軸を signal 化、 play/pause/scrub/speed で phase 相当を手動制御。
 *     time signal 経由で dyn-* shape を動的に駆動。
 */
export const timelineDrive = diagram("interactive-timeline-drive", {
  topic: "timeline signal fan-out を 3-lane (Timeline control / Rect shape / Arc shape) + 2 fan-out edge、 time → 2 shape 同時追随",
})
  .lane("time", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 180 })
  .lane("arc", { x: 440, width: 220 })
  .input.timeline("t", { duration: 3000, autoplay: true, loop: true, label: "Timeline" })
  .formula("bar", "t * 100")
  .formula("angle", "t * 270")
  .state("t", { initial: 0 })
  .state("bar", { initial: 0 })
  .state("angle", { initial: 0 })
  .node("timeNode", { lane: "time", stack: 0, kind: "card", title: "Timeline signal", subtitle: "t (0-1 loop 3s autoplay)" })
  .node("r", { lane: "bar", stack: 0, kind: "dyn-rect", title: "Bar (rect)", subtitle: "bar = t * 100", w: 60, h: 200,
    shape: { kind: "rect", source: "{bar}", fillMax: 100, orient: "up", fill: "#2d6a8f" } })
  .node("a", { lane: "arc", stack: 0, kind: "dyn-arc", title: "Arc (dial)", subtitle: "angle = t * 270", w: 140, h: 140,
    shape: { kind: "arc", angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" } })
  .edge("timeNode", "r", { label: "t → bar (*100)", tone: "info" })
  .edge("timeNode", "a", { label: "t → angle (*270)", tone: "accent" })
  .readout.countup("timeCu", { source: "bar", unit: "%", label: "Time %" })
  .phase("p", {
    duration: 1500,
    title: "timeline fan-外",
    body: "3-lane (Timeline control / Rect shape / Arc shape)でtime signal → 2 shapeの1:数fan-外 を分散、 2 edge (t→bar情報 / t→angle accent)でformula dependency明示、 play/一時停止/scrubでtime制御、 rect fill + arc angleが同時追随、 timeline dataflowをlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("timeNode", "r", "a", "timeNode-r", "timeNode-a").badge("timeline"))
  .build();

/**
 * 20. edge signal binding = 太さ / 色 / dashoffset を signal 追随、 chain の流れを animate。
 */
export const edgeFlowBind = diagram("interactive-edge-flow", {
  topic: "edge signal bind (太さ/dashoffset) を 3-lane (Source / Pipe / Sink) 分散、 Source→Sink flow を横断 edge で animate",
})
  .lane("src", { x: 0, width: 180 })
  .lane("pipe", { x: 220, width: 180 })
  .lane("sink", { x: 440, width: 180 })
  .input.slider("flow", { min: 1, max: 15, defaultValue: 5, label: "フロー Width" })
  .input.timeline("t", { duration: 2000, autoplay: true, loop: true, label: "Timeline" })
  .formula("dash", "t * 24")
  .state("flow", { initial: 5 })
  .state("t", { initial: 0 })
  .state("dash", { initial: 0 })
  .node("a", { lane: "src", stack: 0, kind: "card", title: "Source", subtitle: "生産者" })
  .node("pipeNode", { lane: "pipe", stack: 0, kind: "card", title: "Pipe", subtitle: "width={フロー} · dash={dash}" })
  .node("b", { lane: "sink", stack: 0, kind: "card", title: "Sink", subtitle: "消費者" })
  .edge("a", "pipeNode", { label: "生成", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .edge("pipeNode", "b", { label: "消費", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .phase("p", {
    duration: 1500,
    title: "flowパイプライン",
    body: "3-lane (Source / Pipe / Sink)でdataflowを横並び分散、 2 edge (Source→Pipe / Pipe→Sink)がwidthBind + dashOffsetBindでslider/timeline追随、 フロー sliderで太さ、 timelineでdashoffset変化 → 破線が横laneを流れるanimation、 パイプライン 構造とedge signal bindを同時可視化。",
  }, (p: PhaseBuilder) => p.activate("a", "pipeNode", "b", "a-pipeNode", "pipeNode-b").badge("edge bind"))
  .build();

/**
 * 21. new input widgets = range / multi-select / tabs / text の合わせ技。
 */
export const inputVariety = diagram("interactive-input-variety", {
  topic: "4 input widget (range/multiSelect/tabs/text) を 4-lane 分散、 各 widget 個別 lane + input signal 表示",
})
  .lane("range", { x: 0, width: 180 })
  .lane("multi", { x: 200, width: 180 })
  .lane("tabs", { x: 400, width: 180 })
  .lane("text", { x: 600, width: 180 })
  .input.range("priceRange", { min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "価格Range" })
  .input.multiSelect("tags", { options: ["new", "sale", "hot", "featured"], defaultValues: ["new"], label: "Tags" })
  .input.tabs("view", { options: ["grid", "list", "compact"], defaultValue: "grid", label: "表示" })
  .input.text("query", { defaultValue: "", placeholder: "Search...", maxLength: 50, label: "クエリ" })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "new" })
  .state("view", { initial: "grid" })
  .state("query", { initial: "" })
  .node("rangeNode", { lane: "range", stack: 0, kind: "card", title: "Range slider", subtitle: "価格 = {priceRange}" })
  .node("multiNode", { lane: "multi", stack: 0, kind: "card", title: "Multi-選択", subtitle: "tags = {tags}" })
  .node("tabsNode", { lane: "tabs", stack: 0, kind: "card", title: "Tabs", subtitle: "表示 = {表示}" })
  .node("textNode", { lane: "text", stack: 0, kind: "card", title: "Text入力", subtitle: "クエリ = {クエリ}" })
  .phase("p", {
    duration: 1500,
    title: "入力 ウィジェット4-way split",
    body: "4-lane (Range / MultiSelect / Tabs / Text)で4入力 ウィジェット を機能別分散、 各 ウィジェット 個別 カード でbind signal明示、 各 入力 が独立signalを持つ複合入力構造をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("rangeNode", "multiNode", "tabsNode", "textNode").badge("input variety"))
  .build();

/**
 * 22. new readouts = heat cell + badge + status dot の合わせ技。
 */
export const readoutVariety = diagram("interactive-readout-variety", {
  topic: "3 readout variant (heatCell/badge/statusDot) を 3-lane 分散、 各 readout 個別 lane + temp/state signal 追随",
})
  .lane("heat", { x: 0, width: 220 })
  .lane("badge", { x: 260, width: 220 })
  .lane("dot", { x: 520, width: 220 })
  .input.slider("temp", { min: 0, max: 100, defaultValue: 42, label: "Temp" })
  .input.dropdown("state", { options: ["online", "offline", "error"], defaultValue: "online", label: "状態" })
  .state("temp", { initial: 42 })
  .state("state", { initial: "online" })
  .node("heatNode", { lane: "heat", stack: 0, kind: "card", title: "Heatセル", subtitle: "temp = {temp} · 色gradient" })
  .node("badgeNode", { lane: "badge", stack: 0, kind: "card", title: "バッジ(pill)", subtitle: "temp = {temp} · number pill" })
  .node("dotNode", { lane: "dot", stack: 0, kind: "card", title: "状態dot", subtitle: "状態 = {状態} · online/offline/エラー" })
  .readout.heatCell("tempHeat", { source: "temp", min: 0, max: 100, colors: ["#4e9dc4", "#e57373"], label: "Temp gradient" })
  .readout.badge("tempBadge", { source: "temp", label: "Value pill" })
  .readout.statusDot("statusRead", { source: "state", map: [
    { value: "online", color: "#22c55e", label: "Online" },
    { value: "offline", color: "#94a3b8", label: "Offline" },
    { value: "error", color: "#ef4444", label: "エラー" },
  ], label: "状態dot" })
  .phase("p", {
    duration: 1500,
    title: "表示variant split",
    body: "3-lane (Heatセル / バッジ / 状態dot)で3表示variantを機能別分散、 各readout個別 カード でsignal明示、 temp slider → heat + バッジ / 状態dropdown → dotが追随、 readout種別をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("heatNode", "badgeNode", "dotNode").badge("readout variety"))
  .build();

/**
 * 23. event 拡張 = double-click / keydown / focus / blur を network 化。
 *     signal update は consumer handler 側で実装、 catalog では primitive 存在確認のみ。
 */
export const eventVariety = diagram("interactive-event-variety", {
  topic: "5 event kind (dbl/focus/blur/keydown/longpress) を 3-lane (Pointer / Keyboard / Touch) event category 別分散、 3 target node + 5 event bind",
})
  .lane("pointer", { x: 0, width: 200 })
  .lane("keyboard", { x: 240, width: 240 })
  .lane("touch", { x: 500, width: 200 })
  .node("btn1", { lane: "pointer", stack: 0, kind: "card", title: "Doubleクリック", subtitle: "dblclickイベント" })
  .node("btn2", { lane: "keyboard", stack: 0, kind: "card", title: "Key Focus", subtitle: "focus + blur + keydown 3イベント" })
  .node("btn3", { lane: "touch", stack: 0, kind: "card", title: "Long Press", subtitle: "longpress 500ms hold" })
  .on.doubleClick({ kind: "node", id: "btn1" }, "on-dbl")
  .on.focus({ kind: "node", id: "btn2" }, "on-focus")
  .on.blur({ kind: "node", id: "btn2" }, "on-blur")
  .on.keydown({ kind: "node", id: "btn2" }, "on-key")
  .on.longPress({ kind: "node", id: "btn3" }, "on-long")
  .phase("p", {
    duration: 1500,
    title: "イベントcategory split",
    body: "3-lane (Pointer=Doubleクリック / Keyboard=Focus+Blur+Keydown / Touch=Long Press)で5イベント をcategory別分散、 3 target nodeに5イベントbind、 消費者 ハンドラ 地図 でdbl/focus/blur/keydown/longpressを実装、 イベント 分類とbindの2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("btn1", "btn2", "btn3").badge("event bind"))
  .build();

/**
 * 24. gridNodes = 2D grid layout。 rows × cols の matrix を宣言的に生成、
 *     signal で個別 cell の hover 状態を bind。
 */
export const gridLayoutMatrix = diagram("interactive-grid-matrix", {
  topic: "gridNodes(3, 4) 12 cell を 4-lane (Col 0-3) 列別分散、 gridNodes template で lane 動的割当、 各 lane 3 cell (Row 0-2) stack",
})
  .lane("col0", { x: 0, width: 150 })
  .lane("col1", { x: 170, width: 150 })
  .lane("col2", { x: 340, width: 150 })
  .lane("col3", { x: 510, width: 150 })
  .input.stepper("r", { min: 0, max: 2, defaultValue: 0, label: "行" })
  .input.stepper("c", { min: 0, max: 3, defaultValue: 0, label: "列" })
  .state("r", { initial: 0 })
  .state("c", { initial: 0 })
  .gridNodes(3, 4, (r, c) => ({
    id: `cell-{r}-{c}`,
    lane: `col{c}`,
    stack: r,
    kind: "card" as const,
    title: `r{r} c{c}`,
    subtitle: `col{c} lane · row{r} stack`,
  }))
  .readout.stat("hover", { source: "r", label: "行" })
  .readout.stat("hoverC", { source: "c", label: "列" })
  .phase("p", {
    duration: 1200,
    title: "グリッドsplit by列",
    body: "4-lane (列0 / 列1 / 列2 / 列3)で12セル を列別分散、 gridNodes(3,4,tpl)のtemplateでlaneを `列{c}` に動的割当、 各laneに3行(stack 0-2)、 3×4 matrixを実2D配置(列 → lane、 行 → stack)で明示化、 stat readoutで 行/列 座標追跡。",
  }, (p: PhaseBuilder) => p.activate(
    "cell-0-0", "cell-0-1", "cell-0-2", "cell-0-3",
    "cell-1-0", "cell-1-1", "cell-1-2", "cell-1-3",
    "cell-2-0", "cell-2-1", "cell-2-2", "cell-2-3",
  ).badge("2D grid"))
  .build();

/**
 * 25. arraySignal = array を単一 signal に格納、 template で index / length / sum / avg access。
 *     readout.arrayBar で histogram、 readout.arrayList で bullet list 表示。
 */
export const arraySignalHistogram = diagram("interactive-array-signal", {
  topic: "5要素の配列を棒グラフで表示、合計と平均、最大を自動集計する配列signalの使い方",
})
  .lane("agg", { x: 0, width: 240 })
  .lane("items", { x: 300, width: 260 })
  .arraySignal("xs", [12, 34, 20, 45, 28])
  .input.slider("bump", { min: 0, max: 50, defaultValue: 20, label: "First bar" })
  .node("summary", {
    lane: "agg",
    stack: 0,
    kind: "card",
    title: "Array集約",
    subtitle: "数 {xs.length} · 合計 {xs.合計} · 平均 {xs.平均} · 最大 {xs.最大}",
  })
  .node("bumpNode", { lane: "agg", stack: 1, kind: "card", title: "Bump control", subtitle: "first bar override = {bump}" })
  .node("i0", { lane: "items", stack: 0, kind: "card", title: "#0", subtitle: "xs[0] = 12" })
  .node("i1", { lane: "items", stack: 1, kind: "card", title: "#1", subtitle: "xs[1] = 34" })
  .node("i2", { lane: "items", stack: 2, kind: "card", title: "#2", subtitle: "xs[2] = 20" })
  .node("i3", { lane: "items", stack: 3, kind: "card", title: "#3", subtitle: "xs[3] = 45 (最大)" })
  .node("i4", { lane: "items", stack: 4, kind: "card", title: "#4", subtitle: "xs[4] = 28" })
  .readout.arrayBar("hist", { source: "xs", min: 0, max: 50, color: "#2563eb", label: "Bars (histogram)" })
  .readout.arrayList("items", { source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "項目(bullet一覧)" })
  .readout.stat("first", { source: "bump", label: "Bump" })
  .phase("p", {
    duration: 1200,
    title: "array集約 / element split",
    body: "2-lane (集約stat + Bump control / Individual項目5個)でarraySignalを集約と要素別に分散、 集約laneに 概要 + bump control、 項目laneに5個別elementカード、 arrayBar + arrayList readoutも併存でhistogram + bullet表示、 集約と要素の2表示。",
  }, (p: PhaseBuilder) => p.activate("summary", "bumpNode", "i0", "i1", "i2", "i3", "i4").badge("array signal"))
  .build();

/**
 * 26. pathProgress readout + visibleIf。 slider で progress、 完了時 badge を visibleIf 経由で表示。
 */
export const pathProgressDemo = diagram("interactive-path-progress", {
  topic: "path progress を 3-lane (State / Path visual / Completion) 分散、 progress state + path readout + 完了 badge を lane 別展開",
})
  .lane("state", { x: 0, width: 200 })
  .lane("visual", { x: 240, width: 300 })
  .lane("done", { x: 560, width: 200 })
  .input.slider("progress", { min: 0, max: 100, defaultValue: 40, label: "進捗" })
  .state("progress", { initial: 40 })
  .state("done", { initial: 0 })
  .formula("done", "progress >= 100 ? 1 : 0")
  .node("main", { lane: "state", stack: 0, kind: "card", title: "タスク 状態", subtitle: "{進捗}% 完了" })
  .node("pathNode", { lane: "visual", stack: 0, kind: "card", title: "パスvisual", subtitle: "SVG stroke-dashoffsetで進行" })
  .node("ringNode", { lane: "visual", stack: 1, kind: "card", title: "パーセントring", subtitle: "同時追随" })
  .node("ok", { lane: "done", stack: 0, kind: "card", title: "✓ 完了", subtitle: "進捗=100% でvisibleIf発動", visibleIf: "{done}" })
  .readout.pathProgress("pp", {
    source: "progress",
    pathD: "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10",
    viewW: 270,
    viewH: 40,
    strokeWidth: 5,
    color: "#22c55e",
    max: 100,
    label: "パス(zigzag)",
  })
  .readout.percentRing("ring", { source: "progress", max: 100, color: "#22c55e", label: "Ring" })
  .phase("p", {
    duration: 1200,
    title: "progressフロー split",
    body: "3-lane (状態 / Visual / Completion)で パスprogressを機能別分散、 状態laneにslider driven main、 visual laneにpathProgress + percentRing 2表示node、 完了laneにvisibleIfで100% 時のみ現れるOKバッジ、 進捗signal → パス 進行 → 完了 バッジ の フロー をlane分割で明示。",
  }, (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode", "ok").badge("progress + hide"))
  .build();

/**
 * 27. lineChart readout = array signal を折れ線 chart 表示 (時系列 like)。
 */
export const arrayLineChart = diagram("interactive-array-line-chart", {
  topic: "配列signalを折れ線チャートで時系列可視化する使い方",
})
  .lane("data", { x: 0, width: 200 })
  .lane("area", { x: 240, width: 280 })
  .lane("line", { x: 540, width: 280 })
  .arraySignal("series", [22, 35, 28, 42, 55, 48, 60, 72, 65, 80])
  .node("dataCard", { lane: "data", stack: 0, kind: "card", title: "Time series", subtitle: "数={series.length} · 合計={series.合計} · 平均={series.平均}" })
  .node("areaCard", { lane: "area", stack: 0, kind: "card", title: "Areaチャート(fill=真)", subtitle: "blue #2563eb · viewH=70" })
  .node("lineCard", { lane: "line", stack: 0, kind: "card", title: "Lineチャート(fill=偽)", subtitle: "orange #f97316 · viewH=50" })
  .readout.lineChart("chart", { source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "Areaチャート" })
  .readout.lineChart("chartNoFill", { source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "Lineチャート" })
  .phase("p", {
    duration: 1200,
    title: "チャートvariant compare",
    body: "3-lane (Data source / Areaチャートfill=真 / Lineチャートfill=偽)で10 point time seriesを チャートvariant別分散、 同data sourceを2種lineChart表示(area/行)で並列比較、 fill option差異を横並び 表示 で明示。",
  }, (p: PhaseBuilder) => p.activate("dataCard", "areaCard", "lineCard").badge("line chart"))
  .build();

/**
 * 28. stackedBar readout = 2 array を並列 bar 比較、 A/B histogram の per-index 対比。
 */
export const arrayStackedBar = diagram("interactive-array-stacked-bar", {
  topic: "2つの配列を並列棒グラフでA/Bヒストグラム比較する使い方",
})
  .lane("groupA", { x: 0, width: 300 })
  .lane("groupB", { x: 340, width: 300 })
  .arraySignal("groupA", [40, 55, 30, 65, 45])
  .arraySignal("groupB", [25, 40, 50, 35, 60])
  .node("aCard", {
    lane: "groupA",
    stack: 0,
    kind: "card",
    title: "Group A (blue)",
    subtitle: "合計={groupA.合計} · 平均={groupA.平均} · 最大={groupA.最大}",
  })
  .node("aDetail", { lane: "groupA", stack: 1, kind: "card", title: "A 5 element", subtitle: "[40, 55, 30, 65, 45]" })
  .node("bCard", {
    lane: "groupB",
    stack: 0,
    kind: "card",
    title: "Group B (orange)",
    subtitle: "合計={groupB.合計} · 平均={groupB.平均} · 最大={groupB.最大}",
  })
  .node("bDetail", { lane: "groupB", stack: 1, kind: "card", title: "B 5 element", subtitle: "[25, 40, 50, 35, 60]" })
  .edge("aCard", "bCard", { label: "A vs B差分", tone: "warning" })
  .readout.stackedBar("cmp", {
    sourceA: "groupA",
    sourceB: "groupB",
    min: 0,
    max: 80,
    colorA: "#2563eb",
    colorB: "#f97316",
    label: "A / B (side-by-side bar)",
  })
  .phase("p", {
    duration: 1200,
    title: "group split",
    body: "2-lane (Group A blue / Group B orange)で2 arraySignalをgroup別分散、 各groupにmainカード + 詳細element一覧、 comparison edge (警告tone)でA vs B差分 明示、 stackedBar readoutも併存でper-インデックス 隣接bar比較、 group分類とbar比較の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard", "bDetail", "aCard-bCard").badge("stacked bar"))
  .build();

/**
 * 29. radialNodes + renderOffset = hub-and-spoke architecture 図、
 *     中心 node に対して 6 spoke node を円周上に配置。 layout の stack で並べつつ
 *     renderOffsetX/Y で見た目上の円周配置に。
 */
export const radialHubAndSpoke = diagram("interactive-radial-hub", {
  topic: "hub-and-spoke を 2-lane (Hub center / Spokes 周辺 6) 分散、 radialNodes + hub → 6 spoke edge の 真の network diagram",
})
  .lane("hub", { x: 0, width: 200 })
  .lane("spokes", { x: 240, width: 480 })
  .node("hub", { lane: "hub", stack: 0, kind: "card", title: "Hub", subtitle: "中央 · 6 spokeにfan-外" })
  .radialNodes(6, 90, (i, angleDeg, ox, oy) => ({
    id: `spoke-{i}`,
    lane: "spokes",
    stack: i,
    kind: "card" as const,
    title: `#{i}`,
    subtitle: `deg={r}°`,
    renderOffsetX: ox,
    renderOffsetY: oy - 40,
  }))
  .edge("hub", "spoke-0", { label: "0°", tone: "info" })
  .edge("hub", "spoke-1", { label: "60°", tone: "info" })
  .edge("hub", "spoke-2", { label: "120°", tone: "info" })
  .edge("hub", "spoke-3", { label: "180°", tone: "info" })
  .edge("hub", "spoke-4", { label: "240°", tone: "info" })
  .edge("hub", "spoke-5", { label: "300°", tone: "info" })
  .phase("p", {
    duration: 1200,
    title: "hub-and-spoke 6",
    body: "radialNodes(6, 90) + hub → 6 spoke edgeの 真のnetwork diagram、 renderOffsetX/Yでspokeを円周上に配置、 6 edgeでhub中心の スター topologyを表現。",
  }, (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1", "spoke-2", "spoke-3", "spoke-4", "spoke-5", "hub-spoke-0", "hub-spoke-1", "hub-spoke-2", "hub-spoke-3", "hub-spoke-4", "hub-spoke-5").badge("hub-and-spoke"))
  .build();

/**
 * 30. waterfall readout = 5 element を左から累積、 正 / 負 で色分け (財務 waterfall chart)。
 */
export const arrayWaterfall = diagram("interactive-array-waterfall", {
  topic: "5要素の増減を左から累積、正負で色分けするwaterfallチャート",
})
  .lane("pos", { x: 0, width: 300 })
  .lane("neg", { x: 340, width: 300 })
  .arraySignal("changes", [100, -30, 50, -20, 40])
  .node("pos1", { lane: "pos", stack: 0, kind: "card", title: "+100", subtitle: "ステップ0 (initial gain)" })
  .node("pos2", { lane: "pos", stack: 1, kind: "card", title: "+50", subtitle: "ステップ2 (recovery)" })
  .node("pos3", { lane: "pos", stack: 2, kind: "card", title: "+40", subtitle: "ステップ4 (最終gain)" })
  .node("neg1", { lane: "neg", stack: 0, kind: "card", title: "-30", subtitle: "ステップ1 (損失)" })
  .node("neg2", { lane: "neg", stack: 1, kind: "card", title: "-20", subtitle: "ステップ3 (損失)" })
  .node("summary", { lane: "pos", stack: 3, kind: "card", title: "ウォーターフォール 概要", subtitle: "最終 = 合計 = {changes.合計}" })
  .readout.waterfall("wf", {
    source: "changes",
    min: -30,
    max: 150,
    viewW: 280,
    viewH: 90,
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "Changes (ウォーターフォール)",
  })
  .readout.arrayList("items", { source: "changes", itemTemplate: "step {i}: {item}", label: "ステップ" })
  .phase("p", {
    duration: 1200,
    title: "positive vs negative split",
    body: "2-lane (Positive changes 3個 / Negative changes 2個)で5ウォーターフォールelementを符号別分散、 各element個別 カード + 概要 カード(pos lane内)、 ウォーターフォールreadoutも併存で累積bar表示、 正/負 分類と累積 チャート の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("pos1", "pos2", "pos3", "neg1", "neg2", "summary").badge("waterfall"))
  .build();

/**
 * 31. renderOffset signal binding = slider で node が動く、 renderOffsetX/Y に signal template。
 */
export const renderOffsetDrift = diagram("interactive-render-offset", {
  topic: "renderOffset bind を 2-lane (Anchor fixed / Floater drift) 分散、 anchor は固定、 floater は renderOffset signal 追随",
})
  .lane("anchor", { x: 0, width: 240 })
  .lane("floater", { x: 300, width: 300 })
  .input.slider("dx", { min: -80, max: 80, defaultValue: 0, label: "Drift X" })
  .input.slider("dy", { min: -40, max: 40, defaultValue: 0, label: "Drift Y" })
  .state("dx", { initial: 0 })
  .state("dy", { initial: 0 })
  .node("anchor", { lane: "anchor", stack: 0, kind: "card", title: "Anchor (constant)", subtitle: "固定位置、 signal bindなし" })
  .node("floater", {
    lane: "floater",
    stack: 0,
    kind: "card",
    title: "Floater (drift)",
    subtitle: "dx={dx} · dy={dy}",
    renderOffsetX: "{dx}",
    renderOffsetY: "{dy}",
  })
  .phase("p", {
    duration: 1200,
    title: "fixed vs drift",
    body: "2-lane (Anchor / Floater)でrenderOffset bindの有無を対比、 anchorはlane固定位置、 floaterはrenderOffsetX/Yにsignal template、 slider変化でfloaterが実際に横 / 縦drift、 lane分割でreactive vs constantを可視化。",
  }, (p: PhaseBuilder) => p.activate("anchor", "floater").badge("offset bind"))
  .build();

/**
 * 32. matrix readout = 4×4 の 2D array を色 gradient で表示 (confusion matrix / heatmap 用)。
 */
export const matrixHeatmap = diagram("interactive-matrix-heatmap", {
  topic: "4x4の混同行列を色グラデーションでヒートマップ表示する使い方",
})
  .lane("c0", { x: 0, width: 150 })
  .lane("c1", { x: 170, width: 150 })
  .lane("c2", { x: 340, width: 150 })
  .lane("c3", { x: 510, width: 150 })
  .arraySignal("cm", [
    [8, 1, 0, 1],
    [2, 7, 1, 0],
    [0, 1, 9, 0],
    [0, 0, 2, 6],
  ] as unknown as (string | number)[])
  .node("c0Diag", { lane: "c0", stack: 0, kind: "card", title: "Class 0 ✓", subtitle: "correct = 8 (diagonal)" })
  .node("c0Wrong", { lane: "c0", stack: 1, kind: "card", title: "Class 0 ✕", subtitle: "wrong = 2 (行 合計 - diag)" })
  .node("c1Diag", { lane: "c1", stack: 0, kind: "card", title: "Class 1 ✓", subtitle: "correct = 7 (diagonal)" })
  .node("c1Wrong", { lane: "c1", stack: 1, kind: "card", title: "Class 1 ✕", subtitle: "wrong = 3 (行 合計 - diag)" })
  .node("c2Diag", { lane: "c2", stack: 0, kind: "card", title: "Class 2 ✓", subtitle: "correct = 9 (diagonal)" })
  .node("c2Wrong", { lane: "c2", stack: 1, kind: "card", title: "Class 2 ✕", subtitle: "wrong = 3 (行 合計 - diag)" })
  .node("c3Diag", { lane: "c3", stack: 0, kind: "card", title: "Class 3 ✓", subtitle: "correct = 6 (diagonal)" })
  .node("c3Wrong", { lane: "c3", stack: 1, kind: "card", title: "Class 3 ✕", subtitle: "wrong = 2 (行 合計 - diag)" })
  .readout.matrix("m", { source: "cm", min: 0, max: 10, cellSize: 30, showValue: true, colors: ["#f0f4f8", "#0369a1"] as const, label: "Predictions (4×4)" })
  .phase("p", {
    duration: 1200,
    title: "confusion split",
    body: "4-lane (Class 0/1/2/3)で4×4混同行列 をclass別に分散、 各lane内でcorrect (diagonal)とwrong (オフ-diagonal)を個別 カード、 matrix readoutも併存で色gradientセル 表示、 class別精度と2D相関の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("c0Diag", "c0Wrong", "c1Diag", "c1Wrong", "c2Diag", "c2Wrong", "c3Diag", "c3Wrong").badge("2D matrix"))
  .build();

/**
 * 33. progress-group readout = 4 task の progress を label + bar list で表示。
 */
export const taskProgressGroup = diagram("interactive-progress-group", {
  topic: "4 task の progress を 2-lane (Advanced ≥50% / Behind <50%) に分散、 各 task 個別 card + progressGroup readout 併存",
})
  .lane("advanced", { x: 0, width: 240 })
  .lane("behind", { x: 300, width: 240 })
  .arraySignal("progress", [40, 75, 20, 90])
  .arraySignal("names", ["Design", "Impl", "Test", "Docs"])
  .node("implNode", { lane: "advanced", stack: 0, kind: "card", title: "Impl", subtitle: "75% (上級)" })
  .node("docsNode", { lane: "advanced", stack: 1, kind: "card", title: "Docs", subtitle: "90% (上級)" })
  .node("designNode", { lane: "behind", stack: 0, kind: "card", title: "Design", subtitle: "40% (behind)" })
  .node("testNode", { lane: "behind", stack: 1, kind: "card", title: "テスト", subtitle: "20% (behind)" })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "Tasks (progressGroup)",
  })
  .phase("p", {
    duration: 1200,
    title: "スプリントsplit",
    body: "2-lane (上級 ≥50% / Behind <50%)で4タスク を進捗率別に分散、 各 タスク 個別 カード でprogress % 明示、 progressGroup readoutも併存でper-行bar表示、 スプリント 進捗をlane分割でvisual triage。",
  }, (p: PhaseBuilder) => p.activate("implNode", "docsNode", "designNode", "testNode").badge("task list"))
  .build();

/**
 * 34. eip1559GasFlow v2 = Ethereum L1 で ETH 送金 tx を submit → mempool → 採掘 → 確定する EIP-1559 gas 動的計算シナリオ、 shape-wallet + shape-mobile-device + shape-stack (mempool) + shape-blockchain-block × 2 + shape-blockchain の 6 shape で visual scene 化、 4 phase (署名 → mempool 滞留 → 採掘 → 確定) + 4 readout (gauge baseFee 上昇 / bar totalGwei 伸長 / traffic-light tx status / countup blockNumber) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const eip1559GasFlow = diagram("interactive-eip1559", {
  topic: "EthereumでETH送金トランザクションが署名からmempool、採掘、確定するEIP-1559ガス計算",
})
  .lane("sender", { x: 0, width: 220 })
  .lane("mempool", { x: 240, width: 240 })
  .lane("chain", { x: 500, width: 280 })
  .state("baseFee", { initial: 30 })
  .state("totalGwei", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("blockNumber", { initial: 18543210 })
  .node("wallet", { lane: "sender", stack: 0, kind: "shape-wallet", title: "MetaMask EOA", eyebrow: "送信者", subtitle: "0x742d...5a1f" })
  .node("mobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "利用者 端末", eyebrow: "端末", subtitle: "0.5 ETH送金tx署名" })
  .node("pool", { lane: "mempool", stack: 0, kind: "shape-stack", title: "mempool", eyebrow: "キュー", subtitle: "保留128 tx · fee順sort" })
  .node("blockN", { lane: "chain", stack: 0, kind: "shape-blockchain-block", title: "Block数", eyebrow: "遮断", subtitle: "gas 15M/30M · base {baseFee} gwei" })
  .node("blockN1", { lane: "chain", stack: 1, kind: "shape-blockchain-block", title: "Block数+1", eyebrow: "遮断", subtitle: "gas 22M/30M · base×1.05" })
  .node("chainNode", { lane: "chain", stack: 2, kind: "shape-blockchain", title: "Ethereum L1", eyebrow: "chain", subtitle: "遮断 #{blockNumber} · finality 12+" })
  .edge("wallet", "mobile", { label: "秘密鍵署名", tone: "info" })
  .edge("mobile", "pool", { label: "eth_sendRawTransaction", tone: "info" })
  .edge("pool", "blockN", { label: "採掘include", tone: "success" })
  .edge("blockN", "blockN1", { label: "次block (fee ±12.5%)", tone: "warning" })
  .edge("blockN1", "chainNode", { label: "finality確定", tone: "success" })
  .readout.gauge("baseFeeG", { source: "baseFee", min: 0, max: 100, color: "#f97316", label: "base fee (gwei)" })
  .readout.bar("totalBar", { source: "totalGwei", min: 0, max: 5000, color: "#22c55e", label: "総gasコスト(gwei)" })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "tx状態(0=保留 / 1=mining / 2=confirmed)" })
  .readout.countup("blockCU", { source: "blockNumber", unit: "", label: "遮断 #", decimals: 0 })
  .phase("p1", {
    duration: 2200,
    title: "tx署名 + 送信",
    body: "MetaMaskで0.5 ETH送金txを秘密鍵署名。 baseFee = 30 gwei (ゲージ 針中位)、 状態0 = 保留(トラフィック-light赤)、 totalGwei 0 (bar空、 未include)。 送信者lane全active。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "wallet-mobile").set("baseFee", 30).set("txStatus", 0).set("totalGwei", 0).badge("署名"))
  .phase("p2", {
    duration: 2400,
    title: "mempool滞留",
    body: "128保留txがfee優先度順にソート、 需要増でbaseFeeが30 → 45 gwei tween (ゲージ 針が橙域まで上昇)、 totalGwei 0 → 940 tween (base×gasUsed 21000でbar半分伸長)、 状態0のまま(トラフィック-light赤 継続)。 mempool lane追加active。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool", "wallet-mobile", "mobile-pool").tween("baseFee", 30, 45).tween("totalGwei", 0, 940).badge("mempool"))
  .phase("p3", {
    duration: 2200,
    title: "採掘(Block数)",
    body: "MinerがBlock Nにtxを含める、 gas 15M/30Mで採掘実行。 baseFee 45 → 47 tween (供給調整 +5%)、 状態0 → 1 tween (トラフィック-light赤 → 黄 = mining)、 totalGwei 940 → 987 tween (base微増でbar追随)、 chain laneにblockN activate、 pool → blockNが 成功tone edge。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool", "blockN", "wallet-mobile", "mobile-pool", "pool-blockN").tween("baseFee", 45, 47).tween("totalGwei", 940, 987).tween("txStatus", 0, 1).badge("採掘"))
  .phase("p4", {
    duration: 2000,
    title: "確定(Block数+1)",
    body: "次blockもbase ±12.5% 変動、 blockN+1で6-遮断confirmation達成 → finality。 baseFee 47 → 50 tween (継続需要)、 状態1 → 2 tween (トラフィック-light黄 → 緑 = confirmed)、 blockNumber 18543210 → 18543211 tween (countup動的増加)、 全6 shape有効、 chain確定 ログ。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool", "blockN", "blockN1", "chainNode", "wallet-mobile", "mobile-pool", "pool-blockN", "blockN-blockN1", "blockN1-chainNode").tween("baseFee", 47, 50).tween("txStatus", 1, 2).tween("blockNumber", 18543210, 18543211).badge("確定"))
  .build();

/**
 * 36. oauthFlow v2 = 実 Google Sign-In (OAuth 2.0 Authorization Code + PKCE) シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 5 phase (login click → consent → code exchange → token 発行 → API call) + 4 readout (sequenceTimeline / gauge latency / countup token 発行数 / traffic-light state) が tween で visually 連続変化。 iteration 8 wave 8-B redesign。
 */
export const oauthFlow = diagram("interactive-oauth-flow", {
  topic: "Google Sign-Inでログインボタン押下から同意、認可コード交換、トークン発行、API呼出まで",
})
  .lane("user", { x: 0, width: 220 })
  .lane("app", { x: 240, width: 260 })
  .lane("google", { x: 520, width: 280 })
  .state("latency", { initial: 0 })
  .state("tokenCount", { initial: 45238 })
  .state("flowState", { initial: 0 })
  .arraySignal("events", [
    [0, "click"],
    [80, "redirect"],
    [220, "consent"],
    [400, "code"],
    [550, "token"],
    [700, "api"],
  ] as unknown as (string | number)[])
  .node("shopper", { lane: "user", stack: 0, kind: "shape-person", title: "田中様", eyebrow: "利用者", subtitle: "Google署名-Inクリック" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone Safari", eyebrow: "端末", subtitle: "PKCE code_verifier保管" })
  .node("app", { lane: "app", stack: 0, kind: "shape-website", title: "MyApp SPA", eyebrow: "クライアント", subtitle: "Reactアプリ · client_id公開" })
  .node("authServer", { lane: "google", stack: 0, kind: "shape-server-rack", title: "accounts.google.com", eyebrow: "認可-サーバー", subtitle: "同意 + code発行 · latency {latency}ミリ秒" })
  .node("tokenEndpoint", { lane: "google", stack: 1, kind: "shape-hexagon", title: "tokenエンドポイント", eyebrow: "signer", subtitle: "RS256 · access + id_token" })
  .node("apiResource", { lane: "google", stack: 2, kind: "shape-cloud", title: "Gmail API", eyebrow: "resource", subtitle: "scope=gmail.readonly" })
  .edge("shopper", "mobile", { label: "1. クリック", tone: "info" })
  .edge("mobile", "app", { label: "2. PKCE gen", tone: "info" })
  .edge("app", "authServer", { label: "3. 認可", tone: "info" })
  .edge("authServer", "app", { label: "4. コード + 状態", tone: "success", side: "left" })
  .edge("app", "tokenEndpoint", { label: "5. コードexchange (with verifier)", tone: "accent" })
  .edge("tokenEndpoint", "app", { label: "6. tokens", tone: "success", side: "left" })
  .edge("app", "apiResource", { label: "7. 取得(Bearer)", tone: "success" })
  .readout.sequenceTimeline("seq", { source: "events", min: 0, max: 800, viewW: 400, viewH: 70, color: "#2563eb", label: "OAuth timeline" })
  .readout.gauge("latencyG", { source: "latency", min: 0, max: 500, color: "#f97316", label: "サーバー latency (ミリ秒)" })
  .readout.countup("tokenCU", { source: "tokenCount", unit: " 件", label: "本日 トークン 発行数", decimals: 0 })
  .readout.trafficLight("stateTL", { source: "flowState", label: "フロー 状態" })
  .phase("p1", {
    duration: 1800,
    title: "クリック → リダイレクト",
    body: "田中様がMyAppでGoogle署名-内 クリック、 PKCE code_verifier生成 → code_challenge送信。 latency 0 → 60ms tween、 flowState = 0 (トラフィック-light赤)、 tokenCount保持。 利用者 + アプリlane有効。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "shopper-mobile", "mobile-app").tween("latency", 0, 60).set("flowState", 0).badge("click"))
  .phase("p2", {
    duration: 2200,
    title: "同意(Google)",
    body: "Google accountsでconsent画面表示、 田中様がgmail.readonly scope承認。 latency 60 → 180ms tween (ゲージ 針上昇、 対話UI表示時間)、 flowState 0 → 1 tween (トラフィック-light赤 → 黄 = 認証中)、 authServer lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "shopper-mobile", "mobile-app", "app-authServer", "authServer-app").tween("latency", 60, 180).tween("flowState", 0, 1).badge("consent"))
  .phase("p3", {
    duration: 2200,
    title: "コードexchange (PKCE)",
    body: "authorization codeを トークン エンドポイント に 投稿、 code_verifierをPKCE検証。 latency 180 → 240ms tween、 tokenEndpoint lane activate、 hexagon shapeがsignerロール で強調。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint", "shopper-mobile", "mobile-app", "app-authServer", "authServer-app", "app-tokenEndpoint", "tokenEndpoint-app").tween("latency", 180, 240).badge("code"))
  .phase("p4", {
    duration: 2000,
    title: "token発行",
    body: "access_token + id_token発行(RS256署名)。 latency 240 → 120ms tween (bar収縮)、 flowState 1 → 2 tween (トラフィック-light黄 → 緑 = 認証済)、 tokenCount 45238 → 45239 tween (countup加算 = 本日1件目)。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint", "shopper-mobile", "mobile-app", "app-authServer", "authServer-app", "app-tokenEndpoint", "tokenEndpoint-app").tween("latency", 240, 120).tween("flowState", 1, 2).tween("tokenCount", 45238, 45239).badge("token"))
  .phase("p5", {
    duration: 1800,
    title: "API呼出(Gmail)",
    body: "Bearerトークン でGmail APIに 取得 /me/メッセージ、 protected data取得。 latency 120 → 90ms tween、 apiResource lane activate、 6 shape全active、 SSOフロー 完遂。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint", "apiResource", "shopper-mobile", "mobile-app", "app-authServer", "authServer-app", "app-tokenEndpoint", "tokenEndpoint-app", "app-apiResource").tween("latency", 120, 90).badge("API"))
  .build();

/**
 * 36. decisionTree v2 = 医療 triage システムの臨床決定木 シナリオ (発熱患者を 3 level 判定で ICU/一般病棟/帰宅の 4 経路に振り分け)、 shape-person + shape-mobile-device + shape-diamond × 3 + shape-server-rack + shape-cloud の 7 shape で visual scene 化、 4 phase (受付 → 一次判定 → 二次判定 → 転帰決定) + 4 readout (traffic-light 判定 status / countup 判定件数 / gauge 判定所要時間 / stat リスクスコア) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const decisionTree = diagram("interactive-decision-tree", {
  topic: "医療トリアージで発熱患者を3段階判定してICU、一般病棟、帰宅に振り分ける",
})
  .lane("intake", { x: 0, width: 220 })
  .lane("triage", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("phaseStatus", { initial: 0 })
  .state("caseCount", { initial: 342 })
  .state("elapsedSec", { initial: 0 })
  .state("riskScore", { initial: 0 })
  .node("patient", { lane: "intake", stack: 0, kind: "shape-person", title: "受診者 山田様", eyebrow: "patient", subtitle: "発熱 39.2℃ · 来院時刻 21:14" })
  .node("nurse", { lane: "intake", stack: 1, kind: "shape-mobile-device", title: "看護師tablet", eyebrow: "端末", subtitle: "electronic triageフォーム" })
  .node("qFever", { lane: "triage", stack: 0, kind: "shape-diamond", title: "Q1: 熱 ≥ 38℃?", eyebrow: "root", subtitle: "YES → Q2 · NO → Q3" })
  .node("qBreath", { lane: "triage", stack: 1, kind: "shape-diamond", title: "Q2: 呼吸苦?", eyebrow: "中-YES", subtitle: "YES → ICU · NO → 一般病棟" })
  .node("qBloodTest", { lane: "triage", stack: 2, kind: "shape-diamond", title: "Q3: 血液検査 異常?", eyebrow: "中-NO", subtitle: "YES → 一般病棟 · NO → 帰宅" })
  .node("emr", { lane: "outcome", stack: 0, kind: "shape-server-rack", title: "EMR system", eyebrow: "バックエンド", subtitle: "判定 ログ 記録 · HL7送信" })
  .node("board", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "転帰 ボード", eyebrow: "assignment", subtitle: "ICU / 一般病棟 / 帰宅 の振り分け" })
  .edge("patient", "nurse", { label: "問診", tone: "info" })
  .edge("nurse", "qFever", { label: "root判定", tone: "info" })
  .edge("qFever", "qBreath", { label: "YES (発熱)", tone: "warning" })
  .edge("qFever", "qBloodTest", { label: "NO (平熱)", tone: "success" })
  .edge("qBreath", "board", { label: "YES → ICU", tone: "error" })
  .edge("qBreath", "board", { label: "NO → 一般", tone: "warning" })
  .edge("qBloodTest", "board", { label: "YES → 一般", tone: "warning" })
  .edge("qBloodTest", "board", { label: "NO → 帰宅", tone: "success" })
  .edge("board", "emr", { label: "ログ 記録", tone: "accent" })
  .readout.trafficLight("statusTL", { source: "phaseStatus", label: "triage進行状態" })
  .readout.countup("caseCU", { source: "caseCount", unit: " 件", label: "本日triage件数", decimals: 0 })
  .readout.gauge("timeG", { source: "elapsedSec", min: 0, max: 300, color: "#f97316", label: "所要時間 (秒)" })
  .readout.stat("riskStat", { source: "riskScore", unit: "/10", caption: "重症度 スコア", label: "リスク" })
  .phase("p1", {
    duration: 1800,
    title: "受付",
    body: "山田様が来院、 看護師が電子triageフォーム 開始。 phaseStatus 0 (トラフィック-light赤 = 未判定)、 elapsedSec 0 → 30 tween (bar立上がり)、 riskScore = 0 (未評価)、 caseCount 342保持。 intake lane full有効。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "patient-nurse").set("phaseStatus", 0).tween("elapsedSec", 0, 30).set("riskScore", 0).badge("受付"))
  .phase("p2", {
    duration: 2200,
    title: "一次判定(Q1: 発熱)",
    body: "root nodeで熱39.2℃ 確認 → YES経路。 phaseStatus 0 → 1 tween (トラフィック-light赤 → 黄 = 判定中)、 elapsedSec 30 → 90 tween、 riskScore 0 → 3 tween (中等度リスク表示、 statが動的加算)、 qFever diamond activate + qFever → qBreathの 警告edge highlight。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath", "patient-nurse", "nurse-qFever", "qFever-qBreath").tween("phaseStatus", 0, 1).tween("elapsedSec", 30, 90).tween("riskScore", 0, 3).badge("Q1"))
  .phase("p3", {
    duration: 2200,
    title: "二次判定(Q2: 呼吸苦)",
    body: "呼吸苦の主訴なし → 一般病棟経路。 phaseStatus 1保持(トラフィック-light黄)、 elapsedSec 90 → 180 tween (ゲージ 針半分)、 riskScore 3 → 6 tween (中重症、 stat更新)、 qBloodTestも参照活性化(対比表示)、 全3 diamond有効。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath", "qBloodTest", "patient-nurse", "nurse-qFever", "qFever-qBreath", "qFever-qBloodTest").set("phaseStatus", 1).tween("elapsedSec", 90, 180).tween("riskScore", 3, 6).badge("Q2"))
  .phase("p4", {
    duration: 2000,
    title: "転帰決定",
    body: "一般病棟入院決定、 EMRに ログ 記録 + 病棟送信。 phaseStatus 1 → 2 tween (トラフィック-light黄 → 緑 = 完了)、 elapsedSec 180 → 210 tween (ゲージ 針最終、 3.5分)、 riskScore 6 → 7 tween (最終 スコア)、 caseCount 342 → 343 tween (countup +1加算)、 7 shape全active、 emr + ボードactivate。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath", "qBloodTest", "emr", "board", "patient-nurse", "nurse-qFever", "qFever-qBreath", "qFever-qBloodTest", "qBreath-board", "qBloodTest-board", "board-emr").tween("phaseStatus", 1, 2).tween("elapsedSec", 180, 210).tween("riskScore", 6, 7).tween("caseCount", 342, 343).badge("転帰"))
  .build();

/**
 * 37. skillRadar v2 = ソフトウェアエンジニア半年 skill 成長 review シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (初回査定 → 学習投資 → 中間確認 → 成長確認) + 4 readout (radar 5 次元 / gauge 総合スコア / countup 学習時間 / stat 成長ポイント) が tween で visually 連続変化。 iteration 8 wave 8-C redesign。
 */
export const skillRadar = diagram("interactive-skill-radar", {
  topic: "エンジニアの半年間スキル成長レビューで初回査定から学習投資、中間確認、成長確認まで",
})
  .lane("engineer", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("review", { x: 580, width: 220 })
  .arraySignal("skills", [3, 3, 3, 3, 3])
  .arraySignal("skillNames", ["Design", "Impl", "Test", "Docs", "Debug"])
  .state("overallScore", { initial: 30 })
  .state("learningHours", { initial: 0 })
  .state("gainedPoints", { initial: 0 })
  .node("engineer", { lane: "engineer", stack: 0, kind: "shape-person", title: "エンジニア 中山様", eyebrow: "エンジニア", subtitle: "半年review対象" })
  .node("laptop", { lane: "engineer", stack: 1, kind: "shape-mobile-device", title: "1on1 tablet", eyebrow: "端末", subtitle: "skill assessmentフォーム" })
  .node("lms", { lane: "system", stack: 0, kind: "shape-server-rack", title: "LMS platform", eyebrow: "learning", subtitle: "オンライン講座 · 学習時間tracking" })
  .node("skillDb", { lane: "system", stack: 1, kind: "shape-cylinder", title: "skill matrix DB", eyebrow: "データベース", subtitle: "5 次元評価履歴" })
  .node("badge", { lane: "system", stack: 2, kind: "shape-hexagon", title: "skill badge発行", eyebrow: "certificate", subtitle: "レベル達成で自動発行" })
  .node("manager", { lane: "review", stack: 0, kind: "shape-cloud", title: "マネージャー レビュー", eyebrow: "supervisor", subtitle: "成長sign-オフ · キャリア判定" })
  .edge("engineer", "laptop", { label: "自己申告", tone: "info" })
  .edge("laptop", "lms", { label: "受講", tone: "success" })
  .edge("lms", "skillDb", { label: "評価反映", tone: "success" })
  .edge("skillDb", "badge", { label: "レベル判定", tone: "accent" })
  .edge("badge", "manager", { label: "承認要求", tone: "success" })
  .readout.radar("radar", { source: "skills", max: 10, labelSource: "skillNames", color: "#2563eb", viewW: 220, viewH: 220, label: "5次元skillレーダー" })
  .readout.gauge("scoreG", { source: "overallScore", min: 0, max: 100, color: "#22c55e", label: "総合スコア" })
  .readout.countup("hoursCU", { source: "learningHours", unit: " h", label: "累計学習時間", decimals: 0 })
  .readout.stat("gainStat", { source: "gainedPoints", unit: " pt", caption: "半年獲得point", label: "成長" })
  .phase("p1", {
    duration: 2000,
    title: "初回査定",
    body: "中山様の4月時点skill = 全5次元3/10 (レーダー 星形が中心近く)。 overallScore 30 (ゲージ 針最下位30%)、 learningHours 0 (未開始)、 gainedPoints 0。 エンジニアlane有効。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "engineer-laptop").set("overallScore", 30).set("learningHours", 0).set("gainedPoints", 0).badge("初回"))
  .phase("p2", {
    duration: 2400,
    title: "学習投資",
    body: "LMSでReact / TDD / Docs講座受講、 skillDbにprogress記録。 overallScore 30 → 50 tween (ゲージ 針中位)、 learningHours 0 → 60 tween (countup加速)、 gainedPoints 0 → 8 tween (stat動的加算)、 lms + skillDb lane追加activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb", "engineer-laptop", "laptop-lms", "lms-skillDb").tween("overallScore", 30, 50).tween("learningHours", 0, 60).tween("gainedPoints", 0, 8).badge("学習"))
  .phase("p3", {
    duration: 2200,
    title: "中間確認",
    body: "8月中間 レビュー、 Design 3→5 / Impl 3→5 / テスト3→6の伸びを確認(レーダー 星形が外周へ拡大方向)。 overallScore 50 → 70 tween、 learningHours 60 → 120 tween、 gainedPoints 8 → 15 tween、 バッジlane activateで認定 バッジ 発行。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb", "badge", "engineer-laptop", "laptop-lms", "lms-skillDb", "skillDb-badge").tween("overallScore", 50, 70).tween("learningHours", 60, 120).tween("gainedPoints", 8, 15).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "成長確認",
    body: "10月finalレビュー、 全5次元6-9に成長(レーダー 星形が最終形)。 overallScore 70 → 88 tween (ゲージ 針最終、 88%)、 learningHours 120 → 180 tween (countup最終)、 gainedPoints 15 → 22 tween、 マネージャー レビュー + キャリア昇格判定、 6 shape全active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb", "badge", "manager", "engineer-laptop", "laptop-lms", "lms-skillDb", "skillDb-badge", "badge-manager").tween("overallScore", 70, 88).tween("learningHours", 120, 180).tween("gainedPoints", 15, 22).badge("成長"))
  .build();

/**
 * 38. perfBubbleChart v2 = production infra 週次 workload capacity planning シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-iot-sensor + shape-gear の 6 shape で visual scene 化、 4 phase (メトリクス取得 → workload 分析 → 需給判定 → 最適化) + 4 readout (bubbleChart / gauge 平均 CPU / countup total req / stat scaling 提案) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const perfBubbleChart = diagram("interactive-perf-bubble", {
  topic: "本番インフラの週次キャパシティ計画でメトリクス取得から分析、判定、最適化まで",
})
  .lane("sre", { x: 0, width: 220 })
  .lane("infra", { x: 240, width: 320 })
  .lane("action", { x: 580, width: 240 })
  .arraySignal("perf", [
    [50, 20, 5],
    [70, 40, 8],
    [90, 60, 10],
    [30, 80, 3],
    [60, 50, 7],
  ] as unknown as (string | number)[])
  .state("avgCpu", { initial: 0 })
  .state("totalReq", { initial: 0 })
  .state("scaleAction", { initial: 0 })
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "SRE森様", eyebrow: "エンジニア", subtitle: "週次capacityレビュー担当" })
  .node("laptop", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "Grafanaダッシュボード", eyebrow: "UI", subtitle: "5 workload observability" })
  .node("cluster", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "K8sクラスター", eyebrow: "計算", subtitle: "3 node · 5 workload · CPU {avgCpu}%" })
  .node("prometheus", { lane: "infra", stack: 1, kind: "shape-cloud", title: "Prometheus", eyebrow: "指標", subtitle: "1s抽出 · time-series DB" })
  .node("sensor", { lane: "infra", stack: 2, kind: "shape-iot-sensor", title: "node exporter", eyebrow: "agent", subtitle: "各workload CPU / mem / req収集" })
  .node("autoscaler", { lane: "action", stack: 0, kind: "shape-gear", title: "HPA autoscaler", eyebrow: "engine", subtitle: "target 70% · replicas動的調整" })
  .edge("sre", "laptop", { label: "確認", tone: "info" })
  .edge("laptop", "prometheus", { label: "PromQLクエリ", tone: "info" })
  .edge("cluster", "sensor", { label: "expose指標", tone: "success" })
  .edge("sensor", "prometheus", { label: "抽出1s", tone: "success" })
  .edge("prometheus", "laptop", { label: "応答", tone: "accent" })
  .edge("laptop", "autoscaler", { label: "scale指示", tone: "warning" })
  .edge("autoscaler", "cluster", { label: "replicas ×2", tone: "warning" })
  .readout.bubbleChart("bubbles", { source: "perf", xMin: 0, xMax: 100, yMin: 0, yMax: 100, rMin: 0, rMax: 10, color: "#2563eb", viewW: 320, viewH: 200, label: "workloads (perf/コスト/usage)" })
  .readout.gauge("cpuG", { source: "avgCpu", min: 0, max: 100, color: "#ef4444", label: "平均CPU使用率 %" })
  .readout.countup("reqCU", { source: "totalReq", unit: " req/s", label: "総 要求 数", decimals: 0 })
  .readout.stat("scaleStat", { source: "scaleAction", unit: " pods", caption: "追加Pod数", label: "拡大" })
  .phase("p1", {
    duration: 2000,
    title: "メトリクス取得",
    body: "森様がGrafanaで5 workloadの週次データ取得。 avgCpu 0 → 40 tween (ゲージ 針中位)、 totalReq 0 → 2400 tween (countup加速)、 scaleAction = 0 (未実施)、 bubbleChartで5 workloadの3次元(perf / コスト / usage) plot表示。 SRE + prometheus lane有効。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "prometheus", "sre-laptop", "laptop-prometheus", "prometheus-laptop").tween("avgCpu", 0, 40).tween("totalReq", 0, 2400).set("scaleAction", 0).badge("取得"))
  .phase("p2", {
    duration: 2400,
    title: "workload分析",
    body: "5 workload中3個(B/C/E)が 高usage、 workload Cがbubble最大(perf 90 / コスト60 / usage 10 = 最上位)。 avgCpu 40 → 72 tween (ゲージ 針が赤域近くまで上昇 = 過負荷リスク)、 totalReq 2400 → 5800 tween (急増)、 クラスター + sensor lane追加activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor", "sre-laptop", "laptop-prometheus", "cluster-sensor", "sensor-prometheus", "prometheus-laptop").tween("avgCpu", 40, 72).tween("totalReq", 2400, 5800).badge("分析"))
  .phase("p3", {
    duration: 2200,
    title: "需給判定",
    body: "target 70% 超過検知、 HPA autoscaler起動判定。 avgCpu 72 → 85 tween (更に上昇、 ゲージ 針赤域最深)、 totalReq 5800 → 7200 tween、 scaleAction 0 → 2 tween (statが2 Pod追加提案表示、 動的加算)、 autoscaler lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor", "autoscaler", "sre-laptop", "laptop-prometheus", "cluster-sensor", "sensor-prometheus", "prometheus-laptop", "laptop-autoscaler", "autoscaler-cluster").tween("avgCpu", 72, 85).tween("totalReq", 5800, 7200).tween("scaleAction", 0, 2).badge("判定"))
  .phase("p4", {
    duration: 2000,
    title: "最適化(scale外)",
    body: "HPAが クラスター にreplicas +2適用、 workload B/C/Eの負荷分散。 avgCpu 85 → 55 tween (ゲージ 針が緑域まで急降下 = 過負荷解消)、 totalReq 7200 → 7500 tween (捌ける)、 scaleAction 2 → 4 tween (更に2 Pod追加で最終4 Pod)、 6 shape全active、 キャパシティ 最適化完了。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor", "autoscaler", "sre-laptop", "laptop-prometheus", "cluster-sensor", "sensor-prometheus", "prometheus-laptop", "laptop-autoscaler", "autoscaler-cluster").tween("avgCpu", 85, 55).tween("totalReq", 7200, 7500).tween("scaleAction", 2, 4).badge("最適化"))
  .build();

/**
 * 39. portfolioDonut v2 = 個人投資家の四半期リバランス シナリオ、 shape-person + shape-mobile-device + shape-brokerage + shape-trust-bank + shape-cylinder + shape-token の 6 shape で visual scene 化、 4 phase (現状確認 → リバランス判定 → 執行 → 反映) + 4 readout (donut allocation / gauge リスク偏差 / countup 総資産 / stat 執行額) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "個人投資家の四半期リバランスで現状確認から判定、執行、反映まで",
})
  .lane("investor", { x: 0, width: 220 })
  .lane("advisor", { x: 240, width: 280 })
  .lane("markets", { x: 540, width: 240 })
  .arraySignal("assets", [45, 30, 15, 10])
  .state("riskGap", { initial: 8 })
  .state("totalValue", { initial: 8250000 })
  .state("orderAmount", { initial: 0 })
  .state("phase", { initial: 0 })
  .node("investor", { lane: "investor", stack: 0, kind: "shape-person", title: "投資家 佐藤様", eyebrow: "クライアント", subtitle: "現金15% + Alt 10%" })
  .node("mobile", { lane: "investor", stack: 1, kind: "shape-mobile-device", title: "証券 アプリ", eyebrow: "端末", subtitle: "portfolio確認 · 執行UI" })
  .node("advisor", { lane: "advisor", stack: 0, kind: "shape-brokerage", title: "証券会社", eyebrow: "アドバイザー", subtitle: "リスク許容度診断 · 執行" })
  .node("trust", { lane: "advisor", stack: 1, kind: "shape-trust-bank", title: "信託銀行", eyebrow: "custodian", subtitle: "資産カストディ · 保管証明" })
  .node("holdings", { lane: "advisor", stack: 2, kind: "shape-cylinder", title: "保有DB", eyebrow: "データベース", subtitle: "銘柄 × 数量 × 時価" })
  .node("token", { lane: "markets", stack: 0, kind: "shape-token", title: "市場価格", eyebrow: "見積", subtitle: "株式 · 債券 · 現金 · 暗号資産" })
  .edge("investor", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "advisor", { label: "診断 要求", tone: "info" })
  .edge("advisor", "trust", { label: "執行指示", tone: "success" })
  .edge("trust", "holdings", { label: "残高更新", tone: "success" })
  .edge("holdings", "token", { label: "時価評価", tone: "accent" })
  .readout.donut("d", { source: "assets", innerRatio: 0.55, viewW: 180, viewH: 180, label: "配分(ドーナツ)" })
  .readout.gauge("riskG", { source: "riskGap", min: 0, max: 20, color: "#ef4444", label: "リスク偏差(%pt)" })
  .readout.countup("valueCU", { source: "totalValue", unit: " 円", label: "総資産評価額", decimals: 0 })
  .readout.stat("orderStat", { source: "orderAmount", unit: " 円", caption: "本日執行額", label: "執行" })
  .phase("p1", {
    duration: 2000,
    title: "現状確認",
    body: "佐藤様が四半期末に アプリ でportfolio確認、 Stocks 45% / Bonds 30% / 現金15% / Crypto 10% を ドーナツ でvisualize。 riskGap = 8%pt (許容5% 超過、 ゲージ 針が橙域)、 totalValue 8,250,000円(countup静止)、 orderAmount 0 (stat未執行)。 investor lane全active。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "investor-mobile").set("riskGap", 8).set("orderAmount", 0).badge("現状"))
  .phase("p2", {
    duration: 2400,
    title: "リバランス判定",
    body: "証券会社が診断、 target配分(Stocks 40% / Bonds 35% / 現金15% / Crypto 10%)との乖離を計算。 riskGap 8 → 12 tween (ゲージ 針が赤域まで上昇 = リバランス強推奨)、 totalValue 8,250,000 → 8,320,000 tween (再評価で微増)、 アドバイザー + 保有lane追加activate。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "holdings", "investor-mobile", "mobile-advisor").tween("riskGap", 8, 12).tween("totalValue", 8250000, 8320000).badge("判定"))
  .phase("p3", {
    duration: 2200,
    title: "執行",
    body: "Stocksを5%pt売却(416,000円) + Bondsを同額買付、 信託銀行がカストディで資産移動。 orderAmount 0 → 416000 tween (statが動的増加)、 riskGap 12 → 4 tween (ゲージ 針が緑域まで急減)、 信託lane + トークンlane activate、 執行edgeが 成功toneで強調。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "trust", "holdings", "token", "investor-mobile", "mobile-advisor", "advisor-trust", "trust-holdings", "holdings-token").tween("orderAmount", 0, 416000).tween("riskGap", 12, 4).badge("執行"))
  .phase("p4", {
    duration: 2000,
    title: "反映",
    body: "T+2決済完了、 保有DB更新 → 時価再評価。 riskGap 4 → 2 tween (ゲージ 針最下位、 target内)、 totalValue 8,320,000 → 8,340,000 tween (countupが動的加算)、 orderAmount保持、 6 shape全active、 四半期リバランス完了。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "trust", "holdings", "token", "investor-mobile", "mobile-advisor", "advisor-trust", "trust-holdings", "holdings-token").tween("riskGap", 4, 2).tween("totalValue", 8320000, 8340000).badge("反映"))
  .build();

/**
 * 40. kpiDashboard v2 = 週次 CEO KPI dashboard レビュー シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-cloud + shape-brokerage の 6 shape で visual scene 化、 4 phase (dashboard 表示 → 因果分析 → 目標対比 → 判断) + 4 readout (stat revenue / percentRing NPS / gauge Churn / countup users) が formula chain 経由 tween で visually 連続変化。 iteration 8 wave 8-B redesign。
 */
export const kpiDashboard = diagram("interactive-kpi-dashboard", {
  topic: "週次CEO KPIダッシュボードレビューで表示から因果分析、目標対比、判断まで",
})
  .lane("ceo", { x: 0, width: 220 })
  .lane("data", { x: 240, width: 320 })
  .lane("decision", { x: 580, width: 240 })
  .state("revenue", { initial: 120 })
  .state("users", { initial: 960 })
  .state("churn", { initial: 38 })
  .state("nps", { initial: 60 })
  .node("ceo", { lane: "ceo", stack: 0, kind: "shape-person", title: "CEO高橋様", eyebrow: "executive", subtitle: "週次KPIレビュー会議" })
  .node("mobile", { lane: "ceo", stack: 1, kind: "shape-mobile-device", title: "KPIダッシュボード", eyebrow: "UI", subtitle: "Lookerモバイルview" })
  .node("api", { lane: "data", stack: 0, kind: "shape-server-rack", title: "分析API", eyebrow: "サーバー", subtitle: "売上 = ${売上}k / mo" })
  .node("dwh", { lane: "data", stack: 1, kind: "shape-cylinder", title: "Snowflake DWH", eyebrow: "warehouse", subtitle: "fact_events × 20B行" })
  .node("ml", { lane: "data", stack: 2, kind: "shape-cloud", title: "ML model", eyebrow: "prediction", subtitle: "売上 → users/解約/nps因果推論" })
  .node("boardroom", { lane: "decision", stack: 0, kind: "shape-brokerage", title: "経営会議", eyebrow: "レビュー", subtitle: "投資判断 · 予算配分" })
  .edge("ceo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "api", { label: "取得 /KPI", tone: "info" })
  .edge("api", "dwh", { label: "選択", tone: "success" })
  .edge("dwh", "ml", { label: "特徴量", tone: "accent" })
  .edge("ml", "api", { label: "予測反映", tone: "accent" })
  .edge("api", "boardroom", { label: "洞察", tone: "success" })
  .readout.stat("revStat", { source: "revenue", unit: "k$", caption: "月次 売上", label: "売上" })
  .readout.percentRing("npsRing", { source: "nps", max: 100, color: "#22c55e", label: "NPS" })
  .readout.gauge("churnG", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "解約 % (低いほど良)" })
  .readout.countup("usersCU", { source: "users", unit: " 名", label: "有効users", decimals: 0 })
  .phase("p1", {
    duration: 2000,
    title: "dashboard表示",
    body: "月曜朝、 高橋様がKPIダッシュボード 確認。 売上 $120k (stat表示)、 NPS 60 (percentRing針が緑域中位)、 解約38% (ゲージ 針が赤域 = 悪化)、 users 960名(countup静止)。 CEO + モバイルlane有効。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "ceo-mobile").set("revenue", 120).set("nps", 60).set("churn", 38).set("users", 960).badge("表示"))
  .phase("p2", {
    duration: 2400,
    title: "因果分析(ML)",
    body: "ML modelが 売上 上昇 → users増 + churn減 + NPS増の因果を予測。 売上120 → 180 tween (前週比 +50%)、 users 960 → 1440 tween (countupが加速的増加 = ×8 formula相当)、 解約38 → 32 tween (ゲージ 針が赤 → 橙域降下)、 NPS 60 → 65 tween (percentRing針上昇)、 data lane全activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml", "ceo-mobile", "mobile-api", "api-dwh", "dwh-ml", "ml-api").tween("revenue", 120, 180).tween("users", 960, 1440).tween("churn", 38, 32).tween("nps", 60, 65).badge("因果"))
  .phase("p3", {
    duration: 2200,
    title: "目標対比",
    body: "四半期目標(売上 $200k / 解約 <30% / NPS >70)と比較、 まだgapあり。 売上180 → 200 tween (目標到達)、 解約32 → 28 tween (ゲージ 針最終、 目標内)、 NPS 65 → 72 tween (percentRing針最高、 目標超過)、 users 1440 → 1600 tween。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml", "ceo-mobile", "mobile-api", "api-dwh", "dwh-ml", "ml-api").tween("revenue", 180, 200).tween("churn", 32, 28).tween("nps", 65, 72).tween("users", 1440, 1600).badge("目標"))
  .phase("p4", {
    duration: 2000,
    title: "判断",
    body: "経営会議で来週の投資判断、 marketing予算 +20% で全KPI押し上げ判断。 売上200 → 210 tween (見込み)、 users 1600 → 1680 tween、 解約28 → 25 tween、 NPS 72 → 75 tween、 6 shape全active、 boardroom承認。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml", "boardroom", "ceo-mobile", "mobile-api", "api-dwh", "dwh-ml", "ml-api", "api-boardroom").tween("revenue", 200, 210).tween("users", 1600, 1680).tween("churn", 28, 25).tween("nps", 72, 75).badge("判断"))
  .build();

/**
 * 41. abTestResult v2 = EC checkout button 色変更 A/B test の 4 週実験シナリオ、 shape-online-shop + shape-diamond (split) + shape-cloud (analytics) + shape-cylinder (log) + shape-mobile-device × 2 + shape-brokerage (判定) の 7 shape で visual scene 化、 4 phase (実験開始 → traffic split → 中間集計 → 有意判定) + 4 readout (stackedBar convA/B / donut split / donut winner / gauge 有意水準) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const abTestResult = diagram("interactive-ab-test", {
  topic: "ECチェックアウトのボタン色変更A/Bテスト4週間実験、開始から分割、中間集計、有意判定",
})
  .lane("users", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 340 })
  .lane("decision", { x: 600, width: 220 })
  .arraySignal("convA", [40, 45, 42, 48, 44])
  .arraySignal("convB", [50, 55, 58, 62, 60])
  .arraySignal("splitData", [50, 50])
  .arraySignal("results", [58, 42])
  .state("pValue", { initial: 100 })
  .state("visitorCount", { initial: 0 })
  .node("visitorA", { lane: "users", stack: 0, kind: "shape-mobile-device", title: "訪問者(Variant A)", eyebrow: "control", subtitle: "青ボタン · 現行版" })
  .node("visitorB", { lane: "users", stack: 1, kind: "shape-mobile-device", title: "訪問者(Variant B)", eyebrow: "treatment", subtitle: "橙ボタン · 実験版" })
  .node("shop", { lane: "system", stack: 0, kind: "shape-online-shop", title: "ECチェックアウト", eyebrow: "商品", subtitle: "ボタンcolor実験" })
  .node("router", { lane: "system", stack: 1, kind: "shape-diamond", title: "トラフィックsplit", eyebrow: "router", subtitle: "利用者hash % 2 == 0 → A" })
  .node("analytics", { lane: "system", stack: 2, kind: "shape-cloud", title: "Amplitude", eyebrow: "分析", subtitle: "conv event収集" })
  .node("log", { lane: "system", stack: 3, kind: "shape-cylinder", title: "実験 ログDB", eyebrow: "保存", subtitle: "27,000 events" })
  .node("committee", { lane: "decision", stack: 0, kind: "shape-brokerage", title: "実験判定会議", eyebrow: "レビュー", subtitle: "有意水準p<0.05" })
  .edge("visitorA", "shop", { label: "control訪問", tone: "info" })
  .edge("visitorB", "shop", { label: "treatment訪問", tone: "accent" })
  .edge("shop", "router", { label: "利用者 ハッシュ 判定", tone: "info" })
  .edge("router", "analytics", { label: "purchaseイベント", tone: "success" })
  .edge("analytics", "log", { label: "永続化", tone: "success" })
  .edge("log", "committee", { label: "集計結果", tone: "accent" })
  .readout.stackedBar("conv", { sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#94a3b8", colorB: "#22c55e", label: "日次conv % (A=灰 / B=緑)" })
  .readout.donut("splitDonut", { source: "splitData", innerRatio: 0.5, viewW: 130, viewH: 130, label: "トラフィックsplit" })
  .readout.donut("winner", { source: "results", innerRatio: 0.6, viewW: 130, viewH: 130, colors: ["#22c55e", "#94a3b8"] as const, label: "winner共有(B=緑)" })
  .readout.gauge("pG", { source: "pValue", min: 0, max: 100, color: "#ef4444", label: "p-value ×100 (低いほど有意)" })
  .phase("p1", {
    duration: 2000,
    title: "実験開始",
    body: "チェックアウト ボタン 色をA (青) / B (橙)で4週実験開始。 pValue = 100 (ゲージ 針最上位、 未判定)、 visitorCount 0 → 5000 tween (countup加速)、 splitDonut 50/50、 users lane + ショップ + router有効。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "visitorA-shop", "visitorB-shop", "shop-router").set("pValue", 100).tween("visitorCount", 0, 5000).badge("開始"))
  .phase("p2", {
    duration: 2400,
    title: "traffic分割",
    body: "利用者 ハッシュmod 2で公平分割、 A: 2493人 / B: 2507人。 pValue 100 → 60 tween (ゲージ 針中位、 収束開始)、 visitorCount 5000 → 15000 tween (加速)、 分析lane activate、 イベント 収集加速。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics", "visitorA-shop", "visitorB-shop", "shop-router", "router-analytics").tween("pValue", 100, 60).tween("visitorCount", 5000, 15000).badge("split"))
  .phase("p3", {
    duration: 2200,
    title: "中間集計",
    body: "Variant A平均conv 43.8% / Variant B平均conv 57.0% (+30% relative)。 pValue 60 → 15 tween (ゲージ 針急降下 = 有意近く)、 visitorCount 15000 → 24000 tween、 winnerドーナツ は暫定B優位(58/42)、 ログlane activate。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics", "log", "visitorA-shop", "visitorB-shop", "shop-router", "router-analytics", "analytics-log").tween("pValue", 60, 15).tween("visitorCount", 15000, 24000).badge("集計"))
  .phase("p4", {
    duration: 2000,
    title: "有意判定",
    body: "p<0.05到達で有意差確定、 実験判定会議でVariant B採用決定。 pValue 15 → 3 tween (ゲージ 針最下、 高有意)、 visitorCount 24000 → 27000 tween (最終)、 全7 shape有効、 committee laneで最終判断。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics", "log", "committee", "visitorA-shop", "visitorB-shop", "shop-router", "router-analytics", "analytics-log", "log-committee").tween("pValue", 15, 3).tween("visitorCount", 24000, 27000).badge("有意"))
  .build();

/**
 * 42. calendar heatmap = 1 年分の日次 commit を GitHub-style で表示 (365 day、 53 週 × 7 日)。
 */
function generateCommits(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 371; i++) {
    // pseudo-random deterministic 分布 (曜日で bias)
    const day = i % 7;
    const seed = (i * 31 + day * 17) % 13;
    arr.push(day === 0 || day === 6 ? Math.max(0, seed - 4) : Math.min(10, seed));
  }
  return arr;
}

export const contributionHeatmap = diagram("interactive-contribution-heatmap", {
  topic: "365 day contribution を 4-lane (Q1/Q2/Q3/Q4 quarter) 分散、 各 quarter summary card + total/max、 calendarHeatmap readout 併存",
})
  .lane("q1", { x: 0, width: 160 })
  .lane("q2", { x: 180, width: 160 })
  .lane("q3", { x: 360, width: 160 })
  .lane("q4", { x: 540, width: 160 })
  .arraySignal("commits", generateCommits())
  .node("q1Card", { lane: "q1", stack: 0, kind: "card", title: "Q1 (Jan-Mar)", subtitle: "90 days · winter" })
  .node("q2Card", { lane: "q2", stack: 0, kind: "card", title: "Q2 (Apr-Jun)", subtitle: "91 days · spring" })
  .node("q3Card", { lane: "q3", stack: 0, kind: "card", title: "Q3 (Jul-Sep)", subtitle: "92 days · summer" })
  .node("q4Card", { lane: "q4", stack: 0, kind: "card", title: "Q4 (Oct-Dec)", subtitle: "92 days · autumn" })
  .node("totalCard", { lane: "q4", stack: 1, kind: "card", title: "Year合計", subtitle: "合計 {コミット.合計} · 最大 {コミット.最大} · 平均 {コミット.平均}" })
  .readout.calendarHeatmap("h", { source: "commits", max: 10, cellSize: 10, cellGap: 2, label: "1 year (53週 × 7日)" })
  .phase("p", {
    duration: 1200,
    title: "quarter split",
    body: "4-lane (Q1/Q2/Q3/Q4)で365 dayをquarter別に分散、 各quarter概要 カード + year合計(Q4 lane内)、 calendarHeatmap readoutも併存で53週 × 7日gradient表示、 quarter単位aggregateと日単位詳細の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("q1Card", "q2Card", "q3Card", "q4Card", "totalCard").badge("contributions"))
  .build();

/**
 * 43. mini-map = 大 canvas 1000×800 上の 400×300 viewport を slider で移動、 mini-map で追従。
 */
export const canvasMiniMap = diagram("interactive-canvas-minimap", {
  topic: "canvas mini-map を 3-lane (X pan / Y pan / Mini-map viewport) 分散、 axis 別 control + viewport 集約、 miniMap readout 併存",
})
  .lane("xpan", { x: 0, width: 200 })
  .lane("ypan", { x: 240, width: 200 })
  .lane("map", { x: 480, width: 260 })
  .input.slider("panX", { min: 0, max: 600, defaultValue: 300, label: "Pan X" })
  .input.slider("panY", { min: 0, max: 500, defaultValue: 250, label: "Pan Y" })
  .state("panX", { initial: 300 })
  .state("panY", { initial: 250 })
  .arraySignal("viewport", [300, 250, 400, 300])
  .node("xNode", { lane: "xpan", stack: 0, kind: "card", title: "Pan X control", subtitle: "panX = {panX}px (0-600)" })
  .node("yNode", { lane: "ypan", stack: 0, kind: "card", title: "Pan Y control", subtitle: "panY = {panY}px (0-500)" })
  .node("mapNode", { lane: "map", stack: 0, kind: "card", title: "Mini-地図viewport", subtitle: "pan ({panX}, {panY})表示400×300" })
  .readout.miniMap("map", { source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "Overview (mini-地図)" })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "X stat" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "Y stat" })
  .phase("p", {
    duration: 1200,
    title: "axis split + viewport",
    body: "3-lane (X pan / Y pan / Mini-地図viewport)でcanvas制御をaxis別分散、 X/Y独立slider control + viewport集約 カード、 miniMap readoutも併存で1000×800 canvas縮小表示、 slider変化でmini-地図viewport rectが実座標追随、 axis分離と全体 表示 の2経路。",
  }, (p: PhaseBuilder) => p.activate("xNode", "yNode", "mapNode").badge("mini-map"))
  .build();

/**
 * 44. revenueKpiCard v2 = SaaS 事業の月次 revenue クロージング 会議シナリオ、 shape-person + shape-mobile-device + shape-online-shop + shape-cylinder + shape-cloud + shape-brokerage の 6 shape で visual scene 化、 4 phase (前月値確認 → 当月確定 → 前年比較 → 経営判断) + 4 readout (kpiCard revenue trend / gauge YoY 成長率 / countup MRR / stat 目標達成率) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "SaaS事業の月次売上クロージング会議で前月確認から当月確定、前年比較、経営判断まで",
})
  .lane("team", { x: 0, width: 220 })
  .lane("systems", { x: 240, width: 300 })
  .lane("insights", { x: 560, width: 260 })
  .state("current", { initial: 150 })
  .state("prev", { initial: 150 })
  .state("yoy", { initial: 0 })
  .state("achievement", { initial: 0 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("cfo", { lane: "team", stack: 0, kind: "shape-person", title: "CFO佐々木様", eyebrow: "executive", subtitle: "月次締め責任者" })
  .node("dashboard", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "経営dashboard", eyebrow: "UI", subtitle: "売上KPI表示" })
  .node("saas", { lane: "systems", stack: 0, kind: "shape-online-shop", title: "SaaS本体", eyebrow: "商品", subtitle: "MRR集計 · サブスク管理" })
  .node("dwh", { lane: "systems", stack: 1, kind: "shape-cylinder", title: "DWH (Snowflake)", eyebrow: "warehouse", subtitle: "売上factテーブル · 月次rollup" })
  .node("bi", { lane: "systems", stack: 2, kind: "shape-cloud", title: "BI (Looker)", eyebrow: "分析", subtitle: "YoY比較 · 目標追跡" })
  .node("board", { lane: "insights", stack: 0, kind: "shape-brokerage", title: "経営会議", eyebrow: "decision", subtitle: "$Current {current}k · 前年 {前}k · YoY {yoy}%" })
  .edge("cfo", "dashboard", { label: "確認", tone: "info" })
  .edge("dashboard", "saas", { label: "MRRクエリ", tone: "info" })
  .edge("saas", "dwh", { label: "月次rollup", tone: "success" })
  .edge("dwh", "bi", { label: "YoY集計", tone: "accent" })
  .edge("bi", "board", { label: "洞察", tone: "success" })
  .readout.kpiCard("kpi", { source: "current", historySource: "history", comparisonSource: "prev", unit: "k$", colorPos: "#22c55e", colorNeg: "#ef4444", label: "月次 売上KPI" })
  .readout.gauge("yoyG", { source: "yoy", min: -20, max: 60, color: "#22c55e", label: "YoY成長率(%)" })
  .readout.countup("mrrCU", { source: "current", unit: "k$", label: "MRR", decimals: 0 })
  .readout.stat("achieveStat", { source: "achievement", unit: "%", caption: "目標200k$ 対", label: "達成率" })
  .phase("p1", {
    duration: 2000,
    title: "前月値確認",
    body: "CFO佐々木様が ダッシュボード で前月値150kを確認。 current = 150 (kpiCard針動かず)、 yoy = 0 (ゲージ 針中位)、 achievement 0 (stat空)、 スパークライン 履歴6ヶ月表示。 チームlane全active。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "cfo-dashboard").set("current", 150).set("prev", 150).set("yoy", 0).set("achievement", 0).badge("前月"))
  .phase("p2", {
    duration: 2400,
    title: "当月確定",
    body: "SaaSからDWHに月次rollup、 current 150 → 195 tween (MRR countupが45k$ 加算表示)、 kpiCardの スパーク が上向き変化、 achievement 0 → 97 tween (statが動的加算、 200k$ 目標に対し97.5%)、 saas + dwh lane activate。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh", "cfo-dashboard", "dashboard-saas", "saas-dwh").tween("current", 150, 195).tween("achievement", 0, 97).badge("確定"))
  .phase("p3", {
    duration: 2200,
    title: "前年比較(BI)",
    body: "Lookerで前年同月130kと比較、 yoy 0 → 50 tween (ゲージ 針が緑域まで急上昇 = +50% 成長)、 前 を150 → 130 tween (前年値表示に更新)、 kpiCard比較値変更で 変化量arrow表示、 bi lane activate。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh", "bi", "cfo-dashboard", "dashboard-saas", "saas-dwh", "dwh-bi").tween("yoy", 0, 50).tween("prev", 150, 130).badge("前年比"))
  .phase("p4", {
    duration: 2000,
    title: "経営判断",
    body: "経営会議で拡大投資判断、 achievement 97 → 100 tween (最終達成率、 stat満点表示)、 current 195 → 200 tween (見込み調整でkpiCard針最終)、 yoy 50 → 54 tween (最終値)、 全6 shape有効。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh", "bi", "board", "cfo-dashboard", "dashboard-saas", "saas-dwh", "dwh-bi", "bi-board").tween("achievement", 97, 100).tween("current", 195, 200).tween("yoy", 50, 54).badge("判断"))
  .build();

/**
 * 45. priceCandlestick v2 = 個人投資家の日次 trading シナリオ、 shape-trader + shape-mobile-device + shape-brokerage + shape-exchange + shape-blockchain-node の 5 shape で visual scene 化、 4 phase (寄り付き → 中盤上昇 → 押し目 → 引け高) + 4 readout (candlestick / gauge 値動き幅 / countup 出来高 / stat 現在価格) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const priceCandlestick = diagram("interactive-price-candlestick", {
  topic: "個人投資家の日次トレードで寄付から中盤上昇、押し目、引け高まで",
})
  .lane("trader", { x: 0, width: 220 })
  .lane("markets", { x: 240, width: 340 })
  .lane("feed", { x: 600, width: 240 })
  .arraySignal("ohlc", [
    [100, 108, 96, 105],
    [105, 110, 100, 102],
    [102, 106, 98, 104],
    [104, 112, 103, 111],
    [111, 115, 108, 109],
    [109, 113, 106, 112],
    [112, 118, 111, 116],
    [116, 120, 113, 118],
  ] as unknown as (string | number)[])
  .state("price", { initial: 100 })
  .state("range", { initial: 0 })
  .state("volume", { initial: 0 })
  .node("trader", { lane: "trader", stack: 0, kind: "shape-trader", title: "トレーダー 松本様", eyebrow: "トレーダー", subtitle: "個人dayトレーダー" })
  .node("mobile", { lane: "trader", stack: 1, kind: "shape-mobile-device", title: "SBIアプリ", eyebrow: "アプリ", subtitle: "チャート + 発注UI" })
  .node("brokerage", { lane: "markets", stack: 0, kind: "shape-brokerage", title: "SBI証券", eyebrow: "broker", subtitle: "板寄せ + 執行" })
  .node("exchange", { lane: "markets", stack: 1, kind: "shape-exchange", title: "東証", eyebrow: "exchange", subtitle: "現物 · continuous" })
  .node("feed", { lane: "feed", stack: 0, kind: "shape-blockchain-node", title: "quoteフィード", eyebrow: "data", subtitle: "1s拍動 · WebSocket · 現在 ¥{価格}" })
  .edge("trader", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "brokerage", { label: "発注", tone: "info" })
  .edge("brokerage", "exchange", { label: "取次", tone: "success" })
  .edge("exchange", "feed", { label: "約定tick", tone: "success" })
  .edge("feed", "mobile", { label: "見積", tone: "accent" })
  .readout.candlestick("chart", { source: "ohlc", min: 95, max: 122, viewW: 320, viewH: 130, colorUp: "#22c55e", colorDown: "#ef4444", label: "8日OHLC" })
  .readout.gauge("rangeG", { source: "range", min: 0, max: 30, color: "#f97316", label: "値幅 (%)" })
  .readout.countup("volCU", { source: "volume", unit: " 万株", label: "出来高", decimals: 0 })
  .readout.stat("priceStat", { source: "price", unit: " 円", caption: "現在値", label: "株価" })
  .phase("p1", {
    duration: 2000,
    title: "寄り付き",
    body: "朝9:00寄り付き、 前日終値118 → 寄値100 (窓開け下落)。 価格 = 100 (stat表示)、 range = 0 (ゲージ 針最下)、 volume 0 → 50 tween (寄り成50万株)、 トレーダー + モバイルlane有効。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "trader-mobile").set("price", 100).set("range", 0).tween("volume", 0, 50).badge("寄付"))
  .phase("p2", {
    duration: 2400,
    title: "中盤 上昇",
    body: "午前中に売り玉こなし + 買い勢い、 価格100 → 111 tween (statが動的更新)、 range 0 → 15 tween (ゲージ 針が上昇 = 変動15%)、 volume 50 → 200 tween (countupが加速)、 brokerage lane activate。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage", "trader-mobile", "mobile-brokerage").tween("price", 100, 111).tween("range", 0, 15).tween("volume", 50, 200).badge("上昇"))
  .phase("p3", {
    duration: 2200,
    title: "押し目",
    body: "午後short cover一巡で押し目形成、 価格111 → 109 tween (少し下落、 ローソク足 で ▼ 表示)、 range 15 → 18 tween (幅拡大)、 volume 200 → 350 tween、 exchange + フィードlane activate、 フィードtick反映。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage", "exchange", "feed", "trader-mobile", "mobile-brokerage", "brokerage-exchange", "exchange-feed", "feed-mobile").tween("price", 111, 109).tween("range", 15, 18).tween("volume", 200, 350).badge("押し目"))
  .phase("p4", {
    duration: 2000,
    title: "引け高",
    body: "大引け15:00で引成買い集中、 価格109 → 118 tween (前日並みまで回復、 stat最終)、 range 18 → 22 tween (最終幅、 ゲージ 針最高)、 volume 350 → 480 tween、 5 shape全active、 前日終値回復。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage", "exchange", "feed", "trader-mobile", "mobile-brokerage", "brokerage-exchange", "exchange-feed", "feed-mobile").tween("price", 109, 118).tween("range", 18, 22).tween("volume", 350, 480).badge("引け"))
  .build();

/**
 * 46. Venn diagram = 2 set (Users / Payers) の intersection を可視化。
 */
export const userVenn = diagram("interactive-user-venn", {
  topic: "2 set Venn を 3-lane (Users only / Both / Payers only) 領域別分散、 各 region 個別 card、 venn readout 併存",
})
  .lane("usersOnly", { x: 0, width: 220 })
  .lane("both", { x: 260, width: 200 })
  .lane("payersOnly", { x: 500, width: 200 })
  .arraySignal("sets", [100, 40, 25])
  .node("usersOnlyNode", { lane: "usersOnly", stack: 0, kind: "card", title: "Users only", subtitle: "75 users (A - A∩B)" })
  .node("bothNode", { lane: "both", stack: 0, kind: "card", title: "Both (A ∩ B)", subtitle: "25 users (intersection)" })
  .node("payersOnlyNode", { lane: "payersOnly", stack: 0, kind: "card", title: "Payers only", subtitle: "15 users (B - A∩B)" })
  .node("totalNode", { lane: "both", stack: 1, kind: "card", title: "合計universe", subtitle: "Users A=100 · Payers B=40" })
  .readout.venn("v", { source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "Users", labelB: "Payers", label: "Overlap (2-setベン図)" })
  .phase("p", {
    duration: 1200,
    title: "リージョンsplit",
    body: "3-lane (Users only 75 / Both 25 / Payers only 15)で2 setベン図 の3領域を分散、 各 リージョン 個別 カード で内訳明示、 中央laneに 合計universe概要、 ベン図readoutも併存で 円gap表示、 領域分類と 図の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("usersOnlyNode", "bothNode", "payersOnlyNode", "totalNode").badge("Venn"))
  .build();

/**
 * 47. slope chart = 5 student の test score before/after 変化を slope で表示。
 */
export const scoreSlope = diagram("interactive-score-slope", {
  topic: "5 student score change を 2-lane (Improved up ↑ / Declined down ↓) 分散、 各 student 個別 card、 slope readout 併存",
})
  .lane("up", { x: 0, width: 300 })
  .lane("down", { x: 340, width: 300 })
  .arraySignal("scores", [
    [65, 82, "Alice"],
    [70, 68, "Bob"],
    [55, 78, "Carol"],
    [80, 88, "Dan"],
    [60, 55, "Eve"],
  ] as unknown as (string | number)[])
  .node("aliceNode", { lane: "up", stack: 0, kind: "card", title: "Alice ↑", subtitle: "65 → 82 (+17)" })
  .node("carolNode", { lane: "up", stack: 1, kind: "card", title: "Carol ↑", subtitle: "55 → 78 (+23, 最大gain)" })
  .node("danNode", { lane: "up", stack: 2, kind: "card", title: "Dan ↑", subtitle: "80 → 88 (+8)" })
  .node("bobNode", { lane: "down", stack: 0, kind: "card", title: "Bob ↓", subtitle: "70 → 68 (-2)" })
  .node("eveNode", { lane: "down", stack: 1, kind: "card", title: "Eve ↓", subtitle: "60 → 55 (-5)" })
  .readout.slope("s", { source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "スコアchange (slope)" })
  .phase("p", {
    duration: 1200,
    title: "スコアdirection split",
    body: "2-lane (Improved ↑ 3個 / Declined ↓ 2個)で5 studentスコア を変化方向別分散、 各student個別 カード でbefore → after + 変化量 明示、 slope readoutも併存で2列 折れ線表示、 direction分類とslopeチャート の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "carolNode", "danNode", "bobNode", "eveNode").badge("slope"))
  .build();

/**
 * 48. sales funnel = 4 stage の conversion funnel (Visit → Signup → Trial → Paid)。
 */
export const salesFunnel = diagram("interactive-sales-funnel", {
  topic: "sales funnel 4 stage を 4-lane pipeline + 3 drop-off edge、 Visit → Signup → Trial → Paid の conversion 遷移 network 化",
})
  .lane("visit", { x: 0, width: 160 })
  .lane("signup", { x: 180, width: 160 })
  .lane("trial", { x: 360, width: 160 })
  .lane("paid", { x: 540, width: 160 })
  .arraySignal("stages", [
    ["Visit", 1000],
    ["Signup", 400],
    ["Trial", 150],
    ["Paid", 40],
  ] as unknown as (string | number)[])
  .node("visitNode", { lane: "visit", stack: 0, kind: "card", title: "Visit", subtitle: "1000 (上位)" })
  .node("signupNode", { lane: "signup", stack: 0, kind: "card", title: "サインアップ", subtitle: "400 (-60%)" })
  .node("trialNode", { lane: "trial", stack: 0, kind: "card", title: "Trial", subtitle: "150 (-62.5%)" })
  .node("paidNode", { lane: "paid", stack: 0, kind: "card", title: "Paid", subtitle: "40 (-73%, 下位)" })
  .edge("visitNode", "signupNode", { label: "40% conv", tone: "info" })
  .edge("signupNode", "trialNode", { label: "37.5% conv", tone: "warning" })
  .edge("trialNode", "paidNode", { label: "26.7% conv", tone: "error" })
  .readout.funnel("f", { source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#94a3b8", label: "Conversion (trapezoid)" })
  .phase("p", {
    duration: 1200,
    title: "funnelパイプライン",
    body: "4-laneパイプライン(Visit / サインアップ / Trial / Paid) + 3 conversion edge (40% 情報 / 37.5% 警告 / 26.7% エラー でdrop-オフ 深化tone昇格)、 各stageの 数 とconversion rateを明示、 ファネルreadoutも併存でtrapezoid表示、 conversion遷移をdataflowで可視化。",
  }, (p: PhaseBuilder) => p.activate("visitNode", "signupNode", "trialNode", "paidNode", "visitNode-signupNode", "signupNode-trialNode", "trialNode-paidNode").badge("funnel"))
  .build();

/**
 * 49. projectGantt v2 = モバイルアプリ新機能開発 10 日 sprint シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (Design → Impl → Test → Ship) + 4 readout (gantt / gauge 進捗率 / countup 経過日数 / stat 完了タスク) が tween で visually 連続変化。 iteration 8 wave 8-C redesign。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "モバイル新機能開発の10日スプリントで設計から実装、テスト、リリースまで",
})
  .lane("team", { x: 0, width: 220 })
  .lane("work", { x: 240, width: 320 })
  .lane("release", { x: 580, width: 220 })
  .arraySignal("tasks", [
    ["Design", 0, 3],
    ["Impl", 3, 5],
    ["Test", 6, 3],
    ["Ship", 9, 1],
  ] as unknown as (string | number)[])
  .state("progress", { initial: 0 })
  .state("elapsedDay", { initial: 0 })
  .state("completedTasks", { initial: 0 })
  .node("designer", { lane: "team", stack: 0, kind: "shape-person", title: "デザイナー 松原様", eyebrow: "ロール", subtitle: "FigmaでUI設計" })
  .node("dev", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "iOS開発端末", eyebrow: "端末", subtitle: "Xcode + SwiftUI" })
  .node("repo", { lane: "work", stack: 0, kind: "shape-website", title: "GitHubリポジトリ", eyebrow: "vcs", subtitle: "feature/new-チェックアウト ブランチ" })
  .node("ci", { lane: "work", stack: 1, kind: "shape-server-rack", title: "CI (GitHub Actions)", eyebrow: "ビルド", subtitle: "PRごとにbuild + テスト" })
  .node("qa", { lane: "work", stack: 2, kind: "shape-hexagon", title: "QAテスト", eyebrow: "検証", subtitle: "Playwright E2E + 手動QA" })
  .node("appstore", { lane: "release", stack: 0, kind: "shape-cloud", title: "アプリStore接続", eyebrow: "配分", subtitle: "TestFlight → production配信" })
  .edge("designer", "dev", { label: "引継", tone: "info" })
  .edge("dev", "repo", { label: "コミット", tone: "success" })
  .edge("repo", "ci", { label: "ビルド", tone: "accent" })
  .edge("ci", "qa", { label: "テスト 配布", tone: "accent" })
  .edge("qa", "appstore", { label: "リリース", tone: "success" })
  .readout.gantt("g", { source: "tasks", min: 0, max: 10, viewW: 340, viewH: 140, color: "#2563eb", label: "10日timeline (gantt)" })
  .readout.gauge("progressG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "スプリント 進捗率" })
  .readout.countup("dayCU", { source: "elapsedDay", unit: " 日", label: "経過日数", decimals: 0 })
  .readout.stat("doneStat", { source: "completedTasks", unit: "/4", caption: "完了タスク", label: "完了" })
  .phase("p1", {
    duration: 2000,
    title: "Design (day 0-3)",
    body: "デザイナー松原様がFigmaでUI設計、 チェックアウト フロー のwireframe完成。 進捗0 → 30 tween (ゲージ 針上昇)、 elapsedDay 0 → 3 tween (countup)、 completedTasks 0 → 1 tween (Design完了)、 チームlane有効。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "designer-dev").tween("progress", 0, 30).tween("elapsedDay", 0, 3).tween("completedTasks", 0, 1).badge("Design"))
  .phase("p2", {
    duration: 2400,
    title: "Impl (day 3-8)",
    body: "SwiftUIで実装5日、 dailyコミット。 進捗30 → 60 tween、 elapsedDay 3 → 8 tween、 completedTasks 1 → 2 tween、 リポジトリ + ci lane追加activate、 PRごとに ビルド 実行。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci", "designer-dev", "dev-repo", "repo-ci").tween("progress", 30, 60).tween("elapsedDay", 3, 8).tween("completedTasks", 1, 2).badge("Impl"))
  .phase("p3", {
    duration: 2200,
    title: "テスト(day 6-9、 Implとoverlap)",
    body: "QAがPlaywright E2E + 手動 テスト。 進捗60 → 85 tween、 elapsedDay 8 → 9 tween、 completedTasks 2 → 3 tween、 QA lane activate、 バグ 修正loopでciと往復。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci", "qa", "designer-dev", "dev-repo", "repo-ci", "ci-qa").tween("progress", 60, 85).tween("elapsedDay", 8, 9).tween("completedTasks", 2, 3).badge("Test"))
  .phase("p4", {
    duration: 2000,
    title: "Ship (day 9-10)",
    body: "TestFlight → production配信、 アプリStore審査pass。 進捗85 → 100 tween (ゲージ 針最終)、 elapsedDay 9 → 10 tween (countup 10日目)、 completedTasks 3 → 4 tween (全4タスク 完了)、 appstore lane activate、 6 shape全active、 リリース完遂。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci", "qa", "appstore", "designer-dev", "dev-repo", "repo-ci", "ci-qa", "qa-appstore").tween("progress", 85, 100).tween("elapsedDay", 9, 10).tween("completedTasks", 3, 4).badge("Ship"))
  .build();

/**
 * 50. resourceTreemap v2 = 会社 CFO の年間予算配分レビュー シナリオ (期初計画 → Q1 実績 → 中期見直し → 期末着地)、 shape-person + shape-mobile-device + shape-brokerage + shape-cylinder + shape-server-rack + shape-cloud の 6 shape で visual scene 化、 4 phase (期初計画 → Q1 実績 → 中期見直し → 期末着地) + 4 readout (treemap / gauge 予算消化率 / countup 支出額 / stat 残予算) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const resourceTreemap = diagram("interactive-resource-treemap", {
  topic: "CFOの年間予算配分レビューで期初計画からQ1、中期見直し、期末着地まで",
})
  .lane("cfo", { x: 0, width: 220 })
  .lane("data", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .arraySignal("teams", [
    ["Engineering", 45],
    ["Sales", 20],
    ["Marketing", 15],
    ["Support", 10],
    ["Ops", 6],
    ["Legal", 4],
  ] as unknown as (string | number)[])
  .state("consumptionPct", { initial: 0 })
  .state("spentMm", { initial: 0 })
  .state("remainingMm", { initial: 500 })
  .node("cfo", { lane: "cfo", stack: 0, kind: "shape-person", title: "CFO森本様", eyebrow: "executive", subtitle: "年間500M予算責任" })
  .node("mobile", { lane: "cfo", stack: 1, kind: "shape-mobile-device", title: "予算dashboard", eyebrow: "端末", subtitle: "チーム 別配分view + drilldown" })
  .node("finance", { lane: "data", stack: 0, kind: "shape-brokerage", title: "経理部門", eyebrow: "accounting", subtitle: "月次rollup + 実績集計" })
  .node("ledger", { lane: "data", stack: 1, kind: "shape-cylinder", title: "General Ledger", eyebrow: "データベース", subtitle: "チーム × 費目 × 月次factテーブル" })
  .node("erp", { lane: "data", stack: 2, kind: "shape-server-rack", title: "ERP system", eyebrow: "system", subtitle: "SAP · 会計仕訳集約" })
  .node("committee", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "経営委員会", eyebrow: "decision", subtitle: "配分再調整 · 承認判断" })
  .edge("cfo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "finance", { label: "実績 クエリ", tone: "info" })
  .edge("finance", "ledger", { label: "集計", tone: "success" })
  .edge("ledger", "erp", { label: "同期", tone: "accent" })
  .edge("erp", "committee", { label: "予算再検討", tone: "warning" })
  .readout.treemap("t", { source: "teams", viewW: 300, viewH: 200, label: "チーム 別予算(ツリーマップ)" })
  .readout.gauge("consG", { source: "consumptionPct", min: 0, max: 100, color: "#f97316", label: "予算消化率 %" })
  .readout.countup("spentCU", { source: "spentMm", unit: " M円", label: "支出累計", decimals: 0 })
  .readout.stat("remStat", { source: "remainingMm", unit: " M円", caption: "残予算", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "期初計画 (4/1)",
    body: "森本様がQ1期初に6チーム 予算配分決定(Eng 45% / Sales 20% / Mkt 15% / etc)。 consumptionPct 0、 spentMm 0、 remainingMm 500保持、 CFO + モバイルlane有効。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "cfo-mobile").set("consumptionPct", 0).set("spentMm", 0).set("remainingMm", 500).badge("期初"))
  .phase("p2", {
    duration: 2200,
    title: "Q1実績(7/1)",
    body: "3ヶ月経過、 経理部門から実績集計。 consumptionPct 0 → 28 tween、 spentMm 0 → 140 tween (countup加算)、 remainingMm 500 → 360 tween (stat減少)、 finance + ledger lane activate、 順調pace。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger", "cfo-mobile", "mobile-finance", "finance-ledger").tween("consumptionPct", 0, 28).tween("spentMm", 0, 140).tween("remainingMm", 500, 360).badge("Q1"))
  .phase("p3", {
    duration: 2400,
    title: "中期見直し (10/1)",
    body: "半期経過、 Eng部門超過傾向 + Legal余剰、 予算再配分検討。 consumptionPct 28 → 62 tween、 spentMm 140 → 310 tween、 remainingMm 360 → 190 tween、 ERP lane activate、 SAPに配分修正反映。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger", "erp", "cfo-mobile", "mobile-finance", "finance-ledger", "ledger-erp").tween("consumptionPct", 28, 62).tween("spentMm", 140, 310).tween("remainingMm", 360, 190).badge("中期"))
  .phase("p4", {
    duration: 2000,
    title: "期末着地 (3/31)",
    body: "1年経過、 経営委員会に最終報告。 consumptionPct 62 → 98 tween (ゲージ 針最上位、 予定通り98%)、 spentMm 310 → 490 tween (最終)、 remainingMm 190 → 10 tween (ほぼゼロ)、 committee lane activate、 6 shape全active、 期末着地。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger", "erp", "committee", "cfo-mobile", "mobile-finance", "finance-ledger", "ledger-erp", "erp-committee").tween("consumptionPct", 62, 98).tween("spentMm", 310, 490).tween("remainingMm", 190, 10).badge("期末"))
  .build();

/**
 * 51. trafficSankey v2 = D2C EC の marketing 4 phase 施策 sankey (集客 → LP → conversion)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (施策開始 → 集客増 → CVR 上昇 → ROI 判定) + 4 readout (sankey / gauge CVR / countup 総訪問数 / stat 平均 CAC) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const trafficSankey = diagram("interactive-traffic-sankey", {
  topic: "D2C ECのマーケティング4施策で集客からLPコンバージョン、ROI判定まで",
})
  .lane("marketer", { x: 0, width: 220 })
  .lane("traffic", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .arraySignal("flows", [
    ["Search", "Home", 40],
    ["Search", "Product", 30],
    ["Social", "Home", 25],
    ["Social", "Product", 15],
    ["Direct", "Home", 20],
    ["Direct", "Product", 10],
  ] as unknown as (string | number)[])
  .state("cvr", { initial: 0 })
  .state("visitors", { initial: 0 })
  .state("cac", { initial: 0 })
  .node("cmo", { lane: "marketer", stack: 0, kind: "shape-person", title: "CMO池田様", eyebrow: "marketer", subtitle: "月次marketing責任者" })
  .node("mobile", { lane: "marketer", stack: 1, kind: "shape-mobile-device", title: "GA4ダッシュボード", eyebrow: "端末", subtitle: "traffic分析 + CV追跡" })
  .node("landing", { lane: "traffic", stack: 0, kind: "shape-website", title: "landingページ", eyebrow: "Web", subtitle: "productページ + Home" })
  .node("cdn", { lane: "traffic", stack: 1, kind: "shape-cdn-edge", title: "Cloudflare CDN", eyebrow: "CDN", subtitle: "全世界edge配信 + WAF" })
  .node("attribution", { lane: "traffic", stack: 2, kind: "shape-cloud", title: "GA4 attribution", eyebrow: "分析", subtitle: "source → CV帰属分析" })
  .node("cvDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "CVデータベース", eyebrow: "保存", subtitle: "checkout完了event蓄積" })
  .edge("cmo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "attribution", { label: "分析", tone: "info" })
  .edge("landing", "cdn", { label: "配信", tone: "success" })
  .edge("cdn", "attribution", { label: "ログ 送信", tone: "success" })
  .edge("attribution", "cvDb", { label: "CV記録", tone: "warning" })
  .readout.sankey("s", { source: "flows", viewW: 340, viewH: 220, label: "トラフィック 由来(サンキー)" })
  .readout.gauge("cvrG", { source: "cvr", min: 0, max: 10, color: "#22c55e", label: "CVR %" })
  .readout.countup("visCU", { source: "visitors", unit: " 訪問", label: "総訪問数", decimals: 0 })
  .readout.stat("cacStat", { source: "cac", unit: " 円", caption: "平均CAC", label: "CAC" })
  .phase("p1", {
    duration: 1800,
    title: "施策開始 (月初)",
    body: "池田様が新規marketing施策開始(Google Ads + LP改善)。 CVR 0 → 0.8 tween、 visitors 0 → 5000 tween (countup加速)、 CAC 0 → 3200 tween、 marketer lane有効。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "cmo-mobile").tween("cvr", 0, 0.8).tween("visitors", 0, 5000).tween("cac", 0, 3200).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "集客増 (第 2 週)",
    body: "landing page最適化でbounce rate低下、 訪問数急増。 CVR 0.8 → 2.1 tween、 visitors 5000 → 22000 tween (countup dramatic)、 CAC 3200 → 2400 tween (効率化)、 landing + CDN lane activate。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn", "cmo-mobile", "landing-cdn").tween("cvr", 0.8, 2.1).tween("visitors", 5000, 22000).tween("cac", 3200, 2400).badge("集客"))
  .phase("p3", {
    duration: 2400,
    title: "CVR上昇(第3週)",
    body: "GA4 attributionでCVR高い流入源特定、 予算再配分。 CVR 2.1 → 4.5 tween (ゲージ 針最上位)、 visitors 22000 → 42000 tween、 CAC 2400 → 1800 tween、 attribution lane activate。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn", "attribution", "cmo-mobile", "mobile-attribution", "landing-cdn", "cdn-attribution").tween("cvr", 2.1, 4.5).tween("visitors", 22000, 42000).tween("cac", 2400, 1800).badge("CVR"))
  .phase("p4", {
    duration: 2000,
    title: "ROI判定(月末)",
    body: "月末にCVデータベース 集計、 ROI 320% 達成。 CVR 4.5 → 5.2 tween (最終)、 visitors 42000 → 58000 tween (最終)、 CAC 1800 → 1450 tween (最終、 stat更新)、 cvDb lane activate、 6 shape全active。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn", "attribution", "cvDb", "cmo-mobile", "mobile-attribution", "landing-cdn", "cdn-attribution", "attribution-cvDb").tween("cvr", 4.5, 5.2).tween("visitors", 42000, 58000).tween("cac", 1800, 1450).badge("ROI"))
  .build();

/**
 * 52. polar-area = 7 day activity distribution。
 */
export const activityPolar = diagram("interactive-activity-polar", {
  topic: "weekly activity 7 day を 2-lane (Weekday / Weekend) に分散、 各 day 個別 card + hours、 polarArea readout 併存",
})
  .lane("weekday", { x: 0, width: 300 })
  .lane("weekend", { x: 380, width: 220 })
  .arraySignal("hours", [3, 5, 8, 6, 7, 4, 2])
  .arraySignal("days", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  .node("monNode", { lane: "weekday", stack: 0, kind: "card", title: "Mon", subtitle: "3h" })
  .node("tueNode", { lane: "weekday", stack: 1, kind: "card", title: "Tue", subtitle: "5h" })
  .node("wedNode", { lane: "weekday", stack: 2, kind: "card", title: "Wed", subtitle: "8h (最大)" })
  .node("thuNode", { lane: "weekday", stack: 3, kind: "card", title: "Thu", subtitle: "6h" })
  .node("friNode", { lane: "weekday", stack: 4, kind: "card", title: "Fri", subtitle: "7h" })
  .node("satNode", { lane: "weekend", stack: 0, kind: "card", title: "Sat", subtitle: "4h" })
  .node("sunNode", { lane: "weekend", stack: 1, kind: "card", title: "Sun", subtitle: "2h (最小)" })
  .readout.polarArea("p", { source: "hours", max: 10, labelSource: "days", viewW: 220, viewH: 220, label: "Hours (極座標sectors)" })
  .phase("p", {
    duration: 1200,
    title: "週次split",
    body: "2-lane (Weekday 5個 / Weekend 2個)で7 dayを分散、 各day個別 カード でhours明示、 polarArea readoutも併存で極座標sector表示、 平日/週末の作業量差をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode", "wedNode", "thuNode", "friNode", "satNode", "sunNode").badge("polar"))
  .build();

/**
 * 53. step-indicator = onboarding 5 step wizard、 slider で current step を切替。
 */
export const onboardingStepper = diagram("interactive-onboarding-stepper", {
  topic: "onboarding 5 step wizard を 5-lane pipeline + 4 edge で wizard 遷移を node network 化、 stepIndicator readout 併存",
})
  .lane("signup", { x: 0, width: 140 })
  .lane("profile", { x: 160, width: 140 })
  .lane("prefs", { x: 320, width: 140 })
  .lane("verify", { x: 480, width: 140 })
  .lane("done", { x: 640, width: 140 })
  .input.stepper("current", { min: 0, max: 4, defaultValue: 2, label: "Currentステップ" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["Sign up", "Profile", "Preferences", "Verify", "Done"])
  .node("signupNode", { lane: "signup", stack: 0, kind: "card", title: "署名 上", subtitle: "ステップ0" })
  .node("profileNode", { lane: "profile", stack: 0, kind: "card", title: "プロファイル", subtitle: "ステップ1" })
  .node("prefsNode", { lane: "prefs", stack: 0, kind: "card", title: "Preferences", subtitle: "ステップ2 (current)" })
  .node("verifyNode", { lane: "verify", stack: 0, kind: "card", title: "検証", subtitle: "ステップ3" })
  .node("doneNode", { lane: "done", stack: 0, kind: "card", title: "完了", subtitle: "ステップ4" })
  .edge("signupNode", "profileNode", { label: "次", tone: "info" })
  .edge("profileNode", "prefsNode", { label: "次", tone: "info" })
  .edge("prefsNode", "verifyNode", { label: "次", tone: "accent" })
  .edge("verifyNode", "doneNode", { label: "完了", tone: "success" })
  .readout.stepIndicator("wizard", { source: "current", stepsSource: "steps", viewW: 360, viewH: 60, colorActive: "#2563eb", colorPending: "#cbd5e1", label: "進捗(dot strip)" })
  .phase("p", {
    duration: 1200,
    title: "wizardパイプライン",
    body: "5-laneパイプライン(署名 上 → プロファイル → Preferences → 検証 → 完了) + 4 edgeで オンボーディング 遷移をnode network化、 toneで段階分類(情報=前半 / accent=検証 直前 / 成功=完了)、 stepIndicator readoutも併存でdot strip表示。",
  }, (p: PhaseBuilder) => p.activate("signupNode", "profileNode", "prefsNode", "verifyNode", "doneNode", "signupNode-profileNode", "profileNode-prefsNode", "prefsNode-verifyNode", "verifyNode-doneNode").badge("wizard"))
  .build();

/**
 * 54. bullet-chart = KPI actual vs target + 3 range、 slider で actual 変化 → 3 range のどこにいるか可視化。
 */
export const kpiBullet = diagram("interactive-kpi-bullet", {
  topic: "KPI bullet chart を 3-lane (bad / avg / good) range 分散 + actual/target 個別 card、 bulletChart readout 併存",
})
  .lane("bad", { x: 0, width: 180 })
  .lane("avg", { x: 220, width: 180 })
  .lane("good", { x: 440, width: 220 })
  .input.slider("actual", { min: 0, max: 100, defaultValue: 55, label: "Actual" })
  .state("actual", { initial: 55 })
  .state("target", { initial: 80 })
  .node("badRange", { lane: "bad", stack: 0, kind: "card", title: "Bad range", subtitle: "0-40 (red)" })
  .node("avgRange", { lane: "avg", stack: 0, kind: "card", title: "平均range", subtitle: "40-70 (yellow) · actual {actual} here" })
  .node("goodRange", { lane: "good", stack: 0, kind: "card", title: "Good range", subtitle: "70-100 (green) · target {target}" })
  .node("actualNode", { lane: "avg", stack: 1, kind: "card", title: "◆ Actual", subtitle: "{actual}" })
  .node("targetNode", { lane: "good", stack: 1, kind: "card", title: "▼ Target", subtitle: "{target}" })
  .edge("actualNode", "targetNode", { label: "差 = target - actual", tone: "warning" })
  .readout.bulletChart("b", { source: "actual", targetSource: "target", max: 100, rangeBad: 40, rangeAvg: 70, viewW: 320, viewH: 40, colorActual: "#0f172a", label: "進捗(bulletチャート)" })
  .readout.stat("targetStat", { source: "target", label: "Target" })
  .phase("p", {
    duration: 1200,
    title: "KPI range地図",
    body: "3-lane (bad 0-40 / 平均40-70 / good 70-100) range分散、 actual (平均lane) + target (good lane)を個別 カード で位置明示、 差edge (警告tone)でactual→targetの差を可視化、 bulletChart readoutも併存で従来 チャート 表示。",
  }, (p: PhaseBuilder) => p.activate("badRange", "avgRange", "goodRange", "actualNode", "targetNode", "actualNode-targetNode").badge("KPI"))
  .build();

/**
 * 55. number-board = 大 numeric display、 slider で revenue を score board 表示。
 */
export const revenueScoreboard = diagram("interactive-revenue-scoreboard", {
  topic: "revenue Q3 status を 3-lane (Current / Target / Gap) + 2 edge、 scoreboard display に加え target との差を可視化",
})
  .lane("current", { x: 0, width: 220 })
  .lane("target", { x: 260, width: 200 })
  .lane("gap", { x: 480, width: 220 })
  .input.slider("rev", { min: 0, max: 999, defaultValue: 234, label: "売上" })
  .state("rev", { initial: 234 })
  .node("currentNode", { lane: "current", stack: 0, kind: "card", title: "◆ Current", subtitle: "${rev}M (slider driven)" })
  .node("targetNode", { lane: "target", stack: 0, kind: "card", title: "Target", subtitle: "$500M (Q3 goal)" })
  .node("gapNode", { lane: "gap", stack: 0, kind: "card", title: "差", subtitle: "target - current (進捗toward goal)" })
  .edge("currentNode", "targetNode", { label: "進捗", tone: "info" })
  .edge("targetNode", "gapNode", { label: "変化量", tone: "warning" })
  .readout.numberBoard("nb", { source: "rev", prefix: "$", suffix: "M", size: 56, color: "#0f172a", caption: "vs $500M target", label: "売上(scoreboard)" })
  .phase("p", {
    duration: 1200,
    title: "売上progressフロー",
    body: "3-lane (Current / Target / 差)で 売上Q3状態 を分散、 2 edge (progress情報 / 変化量 警告)でtarget達成経路明示、 slider変化でcurrent lane追随、 scoreboard readoutも併存で56px大数字 表示、 progressダッシュボード 構造をlaneで可視化。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "targetNode", "gapNode", "currentNode-targetNode", "targetNode-gapNode").badge("scoreboard"))
  .build();

/**
 * 56. leaderboard = 6 player の score ranking を top 5 表示 (medal 色 + bar + value)。
 */
export const playerLeaderboard = diagram("interactive-player-leaderboard", {
  topic: "6 player を 3-lane (Top 3 medals / Middle 2 / Bottom 1 out of top) rank 別分散、 各 player 個別 card、 leaderboard readout 併存",
})
  .lane("top", { x: 0, width: 260 })
  .lane("middle", { x: 300, width: 220 })
  .lane("bottom", { x: 540, width: 200 })
  .arraySignal("players", [
    ["Alice", 920],
    ["Bob", 780],
    ["Carol", 850],
    ["Dan", 680],
    ["Eve", 890],
    ["Frank", 720],
  ] as unknown as (string | number)[])
  .node("aliceNode", { lane: "top", stack: 0, kind: "card", title: "🥇 1st Alice", subtitle: "920 (gold, 最大)" })
  .node("eveNode", { lane: "top", stack: 1, kind: "card", title: "🥈 2nd Eve", subtitle: "890 (silver)" })
  .node("carolNode", { lane: "top", stack: 2, kind: "card", title: "🥉 3rd Carol", subtitle: "850 (bronze)" })
  .node("bobNode", { lane: "middle", stack: 0, kind: "card", title: "4th Bob", subtitle: "780" })
  .node("frankNode", { lane: "middle", stack: 1, kind: "card", title: "5th Frank", subtitle: "720 (last displayed)" })
  .node("danNode", { lane: "bottom", stack: 0, kind: "card", title: "6th Dan", subtitle: "680 (外of上位5)" })
  .readout.leaderboard("lb", { source: "players", max: 5, color: "#2563eb", label: "順位(上位5リーダーボード)" })
  .phase("p", {
    duration: 1200,
    title: "順位tier split",
    body: "3-lane (上位3 medals gold/silver/bronze / Middle 2順位4-5 / 下位1外of上位)で6プレイヤー を 順位tier別分散、 各 プレイヤー 個別 カード で スコア 明示、 リーダーボードreadoutも併存で 上位5表示、 順位tierと リーダーボード の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "eveNode", "carolNode", "bobNode", "frankNode", "danNode").badge("leaderboard"))
  .build();

/**
 * 57. buildStatusTrafficLight v2 = feature branch の CI build 進行 4 phase シナリオ (main merge 直前まで)、 shape-person + shape-mobile-device + shape-website (GitHub) + shape-server-rack (CI) + shape-hexagon (test runner) + shape-cloud の 6 shape で visual scene 化、 4 phase (commit → 実行中 → test 失敗 → 修正 pass) + 4 readout (trafficLight status / gauge coverage / countup build 試行数 / stat 実行時間) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "feature branchのCI build進行、コミットから実行中、テスト失敗、修正パスまで",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .state("statusNum", { initial: 0 })
  .state("coverage", { initial: 0 })
  .state("buildCount", { initial: 0 })
  .state("elapsedSec", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 加藤様", eyebrow: "author", subtitle: "feature/API-v3修正中" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "IDE + git", eyebrow: "端末", subtitle: "コミット + プッシュ → CI起動" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHub", eyebrow: "vcs", subtitle: "PR #482 · CI起動" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI実行環境", eyebrow: "計算", subtitle: "3 stage: Lint / テスト / ビルド" })
  .node("testRunner", { lane: "system", stack: 2, kind: "shape-hexagon", title: "test実行環境", eyebrow: "検証", subtitle: "Vitest 384テストスイート" })
  .node("deploy", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "デプロイcandidate", eyebrow: "リリース", subtitle: "green buildのみdeploy可" })
  .edge("dev", "laptop", { label: "コード", tone: "info" })
  .edge("laptop", "github", { label: "gitプッシュ", tone: "info" })
  .edge("github", "ci", { label: "起動", tone: "accent" })
  .edge("ci", "testRunner", { label: "runテスト", tone: "warning" })
  .edge("testRunner", "deploy", { label: "green → デプロイ", tone: "success" })
  .readout.trafficLight("tl", { source: "statusNum", viewW: 80, viewH: 180, label: "ビルド状態" })
  .readout.gauge("covG", { source: "coverage", min: 0, max: 100, color: "#22c55e", label: "テストカバレッジ %" })
  .readout.countup("buildCU", { source: "buildCount", unit: " 回", label: "ビルド 試行", decimals: 0 })
  .readout.stat("elapsedStat", { source: "elapsedSec", unit: " s", caption: "実行時間", label: "経過" })
  .phase("p1", {
    duration: 1800,
    title: "コミット → CI起動",
    body: "加藤様がfeatureブランチ に コミット + プッシュ、 CI起動。 statusNum 0 = yellow (waiting、 トラフィック-light黄)、 カバレッジ0 → 20 tween、 buildCount 0 → 1 tween、 elapsedSec 0 → 15 tween。 開発 + github lane有効。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "dev-laptop", "laptop-github").set("statusNum", 0).tween("coverage", 0, 20).tween("buildCount", 0, 1).tween("elapsedSec", 0, 15).badge("commit"))
  .phase("p2", {
    duration: 2200,
    title: "実行中(Lint + テスト)",
    body: "CI実行環境 がLint pass → テスト 実行開始。 statusNum 0 → 1 tween (yellow → yellow継続、 実行中 進行中)、 カバレッジ20 → 65 tween (ゲージ 針中位)、 buildCount 1保持、 elapsedSec 15 → 90 tween、 ci + testRunner lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner", "dev-laptop", "laptop-github", "github-ci", "ci-testRunner").set("statusNum", 1).tween("coverage", 20, 65).tween("elapsedSec", 15, 90).badge("実行"))
  .phase("p3", {
    duration: 2400,
    title: "test失敗",
    body: "384テスト 中3テスト 失敗、 ビルド 赤に。 statusNum 1 → 2 tween (トラフィック-light黄 → 赤)、 カバレッジ65 → 78 tween (テスト 実行分は上昇)、 buildCount 1 → 2 tween (再試行)、 elapsedSec 90 → 165 tween、 加藤様は再修正。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner", "dev-laptop", "laptop-github", "github-ci", "ci-testRunner").tween("statusNum", 1, 2).tween("coverage", 65, 78).tween("buildCount", 1, 2).tween("elapsedSec", 90, 165).badge("失敗"))
  .phase("p4", {
    duration: 2000,
    title: "修正pass",
    body: "3失敗を修正 コミット、 CI再実行で全 テストpass。 statusNum 2 → 0 tween (トラフィック-light赤 → 緑 相当、 状態 表示切替)、 カバレッジ78 → 92 tween (ゲージ 針最上位)、 buildCount 2 → 3 tween、 elapsedSec 165 → 220 tween (合計)、 デプロイlane activate、 6 shape全active、 greenビルド 到達で デプロイcandidate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner", "deploy", "dev-laptop", "laptop-github", "github-ci", "ci-testRunner", "testRunner-deploy").set("statusNum", 0).tween("coverage", 78, 92).tween("buildCount", 2, 3).tween("elapsedSec", 165, 220).badge("pass"))
  .build();

/**
 * 58. tag-cloud = tech skill 8 種を weight 比例 font-size で表示。
 */
export const techTagCloud = diagram("interactive-tech-tagcloud", {
  topic: "8 tech skill を 3-lane (High ≥20 / Mid 10-19 / Low <10) weight 別分散、 各 skill 個別 card、 tagCloud readout 併存",
})
  .lane("high", { x: 0, width: 220 })
  .lane("mid", { x: 260, width: 220 })
  .lane("low", { x: 520, width: 220 })
  .arraySignal("tags", [
    ["React", 30],
    ["TypeScript", 28],
    ["Python", 22],
    ["Rust", 18],
    ["Go", 15],
    ["Svelte", 10],
    ["Vue", 8],
    ["Deno", 5],
  ] as unknown as (string | number)[])
  .node("reactNode", { lane: "high", stack: 0, kind: "card", title: "React", subtitle: "weight=30 (最大)" })
  .node("tsNode", { lane: "high", stack: 1, kind: "card", title: "TypeScript", subtitle: "weight=28" })
  .node("pyNode", { lane: "high", stack: 2, kind: "card", title: "Python", subtitle: "weight=22" })
  .node("rustNode", { lane: "mid", stack: 0, kind: "card", title: "Rust", subtitle: "weight=18" })
  .node("goNode", { lane: "mid", stack: 1, kind: "card", title: "Go", subtitle: "weight=15" })
  .node("svelteNode", { lane: "mid", stack: 2, kind: "card", title: "Svelte", subtitle: "weight=10" })
  .node("vueNode", { lane: "low", stack: 0, kind: "card", title: "Vue", subtitle: "weight=8" })
  .node("denoNode", { lane: "low", stack: 1, kind: "card", title: "Deno", subtitle: "weight=5 (最小)" })
  .readout.tagCloud("tc", { source: "tags", minSize: 12, maxSize: 32, label: "Tech cloud (font-size比例)" })
  .phase("p", {
    duration: 1200,
    title: "skill weight split",
    body: "3-lane (高weight ≥20 / 中10-19 / 低 <10)で8 tech skillをweight別分散、 各skill個別 カード でweight明示、 tagCloud readoutも併存でfont-size比例表示、 weight分類とcloud全体観の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "pyNode", "rustNode", "goNode", "svelteNode", "vueNode", "denoNode").badge("tags"))
  .build();

/**
 * 59. activity-feed = team activity 5 event を feed list で表示。
 */
export const teamActivityFeed = diagram("interactive-team-activity", {
  topic: "team activity 5 event を 5-lane timeline (recent → old) で個別 card 分散、 activityFeed readout 併存",
})
  .lane("t1", { x: 0, width: 140 })
  .lane("t2", { x: 160, width: 140 })
  .lane("t3", { x: 320, width: 140 })
  .lane("t4", { x: 480, width: 140 })
  .lane("t5", { x: 640, width: 140 })
  .arraySignal("events", [
    ["Alice", "pushed to main", "2 min ago"],
    ["Bob", "opened PR #42", "8 min ago"],
    ["Carol", "reviewed PR #40", "15 min ago"],
    ["Dan", "merged PR #38", "1 h ago"],
    ["Eve", "deployed v1.2", "3 h ago"],
  ] as unknown as (string | number)[])
  .node("e1", { lane: "t1", stack: 0, kind: "card", title: "Alice", subtitle: "pushed to main · 2最小ago" })
  .node("e2", { lane: "t2", stack: 0, kind: "card", title: "Bob", subtitle: "opened PR #42 · 8最小ago" })
  .node("e3", { lane: "t3", stack: 0, kind: "card", title: "Carol", subtitle: "reviewed PR #40 · 15最小ago" })
  .node("e4", { lane: "t4", stack: 0, kind: "card", title: "Dan", subtitle: "merged PR #38 · 1 h ago" })
  .node("e5", { lane: "t5", stack: 0, kind: "card", title: "Eve", subtitle: "deployed v1.2 · 3 h ago" })
  .edge("e1", "e2", { label: "→", tone: "info" })
  .edge("e2", "e3", { label: "→", tone: "info" })
  .edge("e3", "e4", { label: "→", tone: "accent" })
  .edge("e4", "e5", { label: "→", tone: "accent" })
  .readout.activityFeed("af", { source: "events", max: 5, color: "#2563eb", label: "Recent (フィード 一覧)" })
  .phase("p", {
    duration: 1200,
    title: "activity timeline",
    body: "5-lane timeline (recent → old)で5イベント を横並びnode network化、 4 edge (時系列連結、 tone情報/accentで新旧分類)、 activityFeed readoutも併存で フィード 一覧 表示、 timeline構造と フィード 一覧の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("e1", "e2", "e3", "e4", "e5", "e1-e2", "e2-e3", "e3-e4", "e4-e5").badge("feed"))
  .build();

/**
 * 60. rating = 5 star rating を slider (0-5) で表示、 half-star 対応。
 */
export const productRating = diagram("interactive-product-rating", {
  topic: "product rating を 3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) range 別分散 + current indicator、 rating readout 併存",
})
  .lane("low", { x: 0, width: 220 })
  .lane("mid", { x: 260, width: 220 })
  .lane("high", { x: 520, width: 220 })
  .input.slider("score", { min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "スコア" })
  .state("score", { initial: 3.5 })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "低range", subtitle: "0-1.5 stars · poor" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "中range", subtitle: "2-3.5 stars · average · default 3.5 here" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "高range", subtitle: "4-5 stars · excellent" })
  .node("currentNode", { lane: "mid", stack: 1, kind: "card", title: "◆ Current", subtitle: "{スコア} / 5" })
  .readout.rating("r", { source: "score", count: 5, color: "#eab308", label: "評価(スター 表示)" })
  .phase("p", {
    duration: 1200,
    title: "評価range地図",
    body: "3-lane (低0-1.5 / 中2-3.5 / 高4-5)で 評価rangeを分散、 default 3.5の位置(中lane)をcurrentNodeで明示、 slider (0.5刻み)変化で 評価readout追随(スター 表示half-スター 対応)、 range分類と スター 表示の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("lowNode", "midNode", "highNode", "currentNode").badge("rating"))
  .build();

/**
 * 61. alertNotification v2 = 本番 deploy 障害検知 → escalation 4 phase シナリオ、 shape-server-rack + shape-mobile-device + shape-iot-sensor + shape-cloud + shape-person × 2 の 6 shape で visual scene 化、 4 phase (deploy 開始 → 警告検知 → 障害エスカレ → 復旧成功) + 4 readout (notification / gauge severity / countup alert 数 / stat 対応時間) が tween で visually 連続変化。 iteration 8 wave 8-D2 redesign。
 */
export const alertNotification = diagram("interactive-alert-notification", {
  topic: "本番デプロイ障害検知エスカレーション、デプロイ開始から警告、障害、復旧まで",
})
  .lane("infra", { x: 0, width: 260 })
  .lane("channel", { x: 280, width: 280 })
  .lane("responders", { x: 580, width: 240 })
  .state("kind", { initial: "info" })
  .state("title", { initial: "Deploy v1.2.3 in progress" })
  .state("body", { initial: "Building production bundle" })
  .state("severity", { initial: 10 })
  .state("alertCount", { initial: 0 })
  .state("mttrMin", { initial: 0 })
  .node("prod", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "本番クラスター", eyebrow: "K8s", subtitle: "3 node · デプロイv1.2.3進行中" })
  .node("sensor", { lane: "infra", stack: 1, kind: "shape-iot-sensor", title: "監視agent", eyebrow: "monitoring", subtitle: "1s抽出 · CPU / mem / p99" })
  .node("pager", { lane: "channel", stack: 0, kind: "shape-cloud", title: "PagerDuty", eyebrow: "通知", subtitle: "severity別escalationポリシー" })
  .node("slack", { lane: "channel", stack: 1, kind: "shape-mobile-device", title: "Slack #alerts", eyebrow: "channel", subtitle: "オン-call通知 + 返信" })
  .node("onCall", { lane: "responders", stack: 0, kind: "shape-person", title: "オン-call佐藤様", eyebrow: "SRE", subtitle: "プライマリresponder" })
  .node("manager", { lane: "responders", stack: 1, kind: "shape-person", title: "SRE lead田中様", eyebrow: "escalation", subtitle: "セカンダリ · 30分以内対応" })
  .edge("prod", "sensor", { label: "expose指標", tone: "success" })
  .edge("sensor", "pager", { label: "threshold超過", tone: "warning" })
  .edge("pager", "slack", { label: "通知", tone: "warning" })
  .edge("slack", "onCall", { label: "プライマリpage", tone: "error" })
  .edge("onCall", "manager", { label: "昇格", tone: "error" })
  .readout.notification("nt", { kindSource: "kind", titleSource: "title", bodySource: "body", label: "現在 アラート" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 100, color: "#ef4444", label: "深刻度 スコア" })
  .readout.countup("alertCU", { source: "alertCount", unit: " 件", label: "累計 アラート", decimals: 0 })
  .readout.stat("mttrStat", { source: "mttrMin", unit: " 分", caption: "対応時間", label: "MTTR" })
  .phase("p1", {
    duration: 1800,
    title: "deploy開始",
    body: "v1.2.3 rollingデプロイ 開始、 カナリア20%。 kind = 情報(青)、 title 'デプロイ 内progress'、 深刻度0 → 15 tween、 alertCount 0 (情報 は 数 外)、 mttrMin 0。 infra lane有効。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "prod-sensor").set("kind", "info").set("title", "Deploy v1.2.3 in progress").set("body", "Canary 20% rolling out").tween("severity", 0, 15).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "警告検知",
    body: "カナリア でp99 latency上昇検知、 警告threshold超過。 kind = 警告(橙)、 title 'p99 latency 620ms'、 深刻度15 → 45 tween (ゲージ 針が橙域)、 alertCount 0 → 1 tween、 pager + slack lane activate。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack", "prod-sensor", "sensor-pager", "pager-slack").set("kind", "warn").set("title", "⚠ p99 latency 620ms").set("body", "canary node-2 mem 90%").tween("severity", 15, 45).tween("alertCount", 0, 1).badge("警告"))
  .phase("p3", {
    duration: 2400,
    title: "障害エスカレ",
    body: "エラー rate 5% 超過、 プライマリpage発火。 kind = エラー (赤)、 title 'エラー rate 5.2% 重大'、 深刻度45 → 82 tween (ゲージ 針最上位、 深刻)、 alertCount 1 → 4 tween (加速)、 mttrMin 0 → 8 tween、 responders lane activate。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack", "onCall", "manager", "prod-sensor", "sensor-pager", "pager-slack", "slack-onCall", "onCall-manager").set("kind", "error").set("title", "✕ error rate 5.2% CRITICAL").set("body", "canary rollback required").tween("severity", 45, 82).tween("alertCount", 1, 4).tween("mttrMin", 0, 8).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "復旧成功",
    body: "佐藤様が カナリアrollback実行、 指標 正常化。 kind = 成功(緑)、 title 'カナリアrollback OK'、 深刻度82 → 12 tween (ゲージ 針が急降下)、 alertCount 4 → 5 tween (resolvedイベント 記録)、 mttrMin 8 → 14 tween (最終)、 6 shape全active、 復旧完遂。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack", "onCall", "manager", "prod-sensor", "sensor-pager", "pager-slack", "slack-onCall", "onCall-manager").set("kind", "success").set("title", "✓ canary rollback OK").set("body", "metric back to normal · v1.2.2 stable").tween("severity", 82, 12).tween("alertCount", 4, 5).tween("mttrMin", 8, 14).badge("復旧"))
  .build();

/**
 * 62. commitDiffCounter v2 = feature branch の開発進行に伴う PR diff サイズ推移 4 phase シナリオ、 shape-person + shape-mobile-device + shape-website (GitHub) + shape-server-rack (CI) + shape-cylinder + shape-hexagon の 6 shape で visual scene 化、 4 phase (初期実装 → 拡張 → refactor → 最終整理) + 4 readout (diffCounter / gauge PR サイズ健全性 / countup commit 数 / stat net delta) が tween で visually 連続変化。 iteration 8 wave 8-D2 redesign。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "feature branchのPR差分サイズ推移、初期実装から拡張、リファクタリング、最終整理まで",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("review", { x: 580, width: 240 })
  .state("add", { initial: 0 })
  .state("del", { initial: 0 })
  .state("healthScore", { initial: 100 })
  .state("commitCount", { initial: 0 })
  .state("netDelta", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 藤田様", eyebrow: "author", subtitle: "feature/refactor-cart担当" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "VSコード + Git", eyebrow: "端末", subtitle: "コミット → プッシュloop" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHubのPR", eyebrow: "vcs", subtitle: "+{追加} / -{del} lines差分" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI (Actions)", eyebrow: "ビルド", subtitle: "PRごとにtest + Lint" })
  .node("db", { lane: "system", stack: 2, kind: "shape-cylinder", title: "commit履歴DB", eyebrow: "履歴", subtitle: "commitログ + diffメタ" })
  .node("checker", { lane: "review", stack: 0, kind: "shape-hexagon", title: "PR size checker", eyebrow: "ポリシー", subtitle: "500行超でwarning · 800でblock" })
  .edge("dev", "laptop", { label: "コード", tone: "info" })
  .edge("laptop", "github", { label: "gitプッシュ", tone: "info" })
  .edge("github", "ci", { label: "起動", tone: "success" })
  .edge("github", "db", { label: "ログ", tone: "accent" })
  .edge("db", "checker", { label: "sizeチェック", tone: "warning" })
  .readout.diffCounter("dc", { additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "PR差分(+/-)" })
  .readout.gauge("healthG", { source: "healthScore", min: 0, max: 100, color: "#22c55e", label: "PRサイズ健全性 %" })
  .readout.countup("commCU", { source: "commitCount", unit: " 件", label: "累計 コミット", decimals: 0 })
  .readout.stat("netStat", { source: "netDelta", unit: " 行", caption: "net変化量", label: "純" })
  .phase("p1", {
    duration: 1800,
    title: "初期実装",
    body: "藤田様が チェックアウトrefactor開始、 skeleton実装。 追加0 → 80 tween、 del 0 → 20 tween、 healthScore 100 (小PR)、 commitCount 0 → 3 tween、 netDelta 0 → 60 tween。 開発 + github lane有効。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "dev-laptop", "laptop-github").tween("add", 0, 80).tween("del", 0, 20).tween("commitCount", 0, 3).tween("netDelta", 0, 60).badge("初期"))
  .phase("p2", {
    duration: 2200,
    title: "拡張実装",
    body: "追加機能実装で 差分 膨張。 追加80 → 320 tween、 del 20 → 45 tween、 healthScore 100 → 70 tween (ゲージ 針が黄域降下 = size警告)、 commitCount 3 → 8 tween、 netDelta 60 → 275 tween、 ci lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "dev-laptop", "laptop-github", "github-ci").tween("add", 80, 320).tween("del", 20, 45).tween("healthScore", 100, 70).tween("commitCount", 3, 8).tween("netDelta", 60, 275).badge("拡張"))
  .phase("p3", {
    duration: 2200,
    title: "refactor (削除多)",
    body: "重複コード削除 + 抽象化。 追加320 → 380 tween (微増)、 del 45 → 180 tween (大量削除)、 healthScore 70 → 80 tween (health回復)、 commitCount 8 → 14 tween、 netDelta 275 → 200 tween (削減効果)、 DB + checker lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "db", "checker", "dev-laptop", "laptop-github", "github-ci", "github-db", "db-checker").tween("add", 320, 380).tween("del", 45, 180).tween("healthScore", 70, 80).tween("commitCount", 8, 14).tween("netDelta", 275, 200).badge("refactor"))
  .phase("p4", {
    duration: 2000,
    title: "最終整理",
    body: "テスト + docs追加、 deadコードcleanup。 追加380 → 420 tween、 del 180 → 220 tween、 healthScore 80 → 88 tween (最終、 ゲージ 針が緑域に戻る)、 commitCount 14 → 18 tween、 netDelta 200 → 200保持(バランス)、 6 shape全active、 PR ready forレビュー。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "db", "checker", "dev-laptop", "laptop-github", "github-ci", "github-db", "db-checker").tween("add", 380, 420).tween("del", 180, 220).tween("healthScore", 80, 88).tween("commitCount", 14, 18).badge("整理"))
  .build();

/**
 * 63. chat-bubble = customer support conversation 5 message、 self/other 左右寄せ表示。
 */
export const supportChat = diagram("interactive-support-chat", {
  topic: "customer support 5 message を 2-lane (Customer / Support) speaker 別分散、 各 message 個別 card、 chatBubble readout 併存",
})
  .lane("customer", { x: 0, width: 280 })
  .lane("support", { x: 320, width: 320 })
  .arraySignal("thread", [
    ["Alice", "Hi, I need help with my order", false],
    ["Support", "Sure! What's the order ID?", true],
    ["Alice", "#12345", false],
    ["Support", "Checking...", true],
    ["Support", "Refunded! You'll see it in 3-5 days.", true],
  ] as unknown as (string | number)[])
  .node("cust1", { lane: "customer", stack: 0, kind: "card", title: "Alice #1", subtitle: "Hi, I need help with my注文" })
  .node("cust2", { lane: "customer", stack: 1, kind: "card", title: "Alice #2", subtitle: "#12345" })
  .node("sup1", { lane: "support", stack: 0, kind: "card", title: "Support #1", subtitle: "Sure! What's the注文ID?" })
  .node("sup2", { lane: "support", stack: 1, kind: "card", title: "Support #2", subtitle: "Checking..." })
  .node("sup3", { lane: "support", stack: 2, kind: "card", title: "Support #3", subtitle: "Refunded! 3-5 days." })
  .readout.chatBubble("cb", { source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#e2e8f0", label: "Conversation (bubbles)" })
  .phase("p", {
    duration: 1200,
    title: "スピーカー split",
    body: "2-lane (顧客2メッセージ / Support 3メッセージ)で5 messageをspeaker別分散、 各message個別 カード で内容明示、 chatBubble readoutも併存で左右寄せ表示、 speaker分類とthread経路の2表示。",
  }, (p: PhaseBuilder) => p.activate("cust1", "cust2", "sup1", "sup2", "sup3").badge("chat"))
  .build();

/**
 * 64. userAvatar v2 = SNS プラットフォーム 新規ユーザー onboarding avatar 選択シナリオ、 shape-person + shape-mobile-device + shape-website + shape-cylinder + shape-cloud + shape-warehouse の 6 shape で visual scene 化、 4 phase (アカウント作成 → デフォルト avatar → カスタム画像 upload → 反映) + 4 readout (avatar / gauge upload 進捗 / countup 新規登録数 / stat active user) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "SNS新規ユーザーのオンボーディングでアバター選択、アカウント作成からデフォルト、アップロード、反映まで",
})
  .lane("user", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("delivery", { x: 580, width: 220 })
  .state("uploadProgress", { initial: 0 })
  .state("newSignups", { initial: 12483 })
  .state("activeUsers", { initial: 0 })
  .state("displayName", { initial: "Alice Wonderland" })
  .node("newUser", { lane: "user", stack: 0, kind: "shape-person", title: "新規Alice様", eyebrow: "サインアップ", subtitle: "アカウント作成中" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone", eyebrow: "端末", subtitle: "SNSモバイル アプリ" })
  .node("app", { lane: "system", stack: 0, kind: "shape-website", title: "SNS webapp", eyebrow: "フロントエンド", subtitle: "オンボーディングwizard · アバター ステップ" })
  .node("db", { lane: "system", stack: 1, kind: "shape-cylinder", title: "users DB", eyebrow: "データベース", subtitle: "profileレコード · display_name + avatar_url" })
  .node("s3", { lane: "system", stack: 2, kind: "shape-cloud", title: "S3 bucket", eyebrow: "保存", subtitle: "avatar画像CDN配信元" })
  .node("cdn", { lane: "delivery", stack: 0, kind: "shape-warehouse", title: "CloudFront CDN", eyebrow: "CDN", subtitle: "全世界avatar配信" })
  .edge("newUser", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "app", { label: "投稿 /サインアップ", tone: "info" })
  .edge("app", "db", { label: "挿入 利用者", tone: "success" })
  .edge("app", "s3", { label: "更新 アバター", tone: "accent" })
  .edge("s3", "cdn", { label: "配分", tone: "success" })
  .edge("cdn", "mobile", { label: "取得 /アバター.jpg", tone: "success" })
  .readout.avatar("av", { source: "displayName", size: 72, color: "#2563eb", label: "アバター プレビュー" })
  .readout.gauge("uploadG", { source: "uploadProgress", min: 0, max: 100, color: "#22c55e", label: "upload進捗 %" })
  .readout.countup("signupsCU", { source: "newSignups", unit: " 名", label: "本日新規登録", decimals: 0 })
  .readout.stat("activeStat", { source: "activeUsers", unit: " 名", caption: "有効users", label: "有効" })
  .phase("p1", {
    duration: 1800,
    title: "アカウント作成",
    body: "Alice様がメール + パスワード登録、 display_name = 'Alice Wonderland' 入力。 uploadProgress 0 (未開始)、 newSignups 12483 → 12484 tween (countup加算)、 activeUsers 0、 アバター はinitials 'AW' のdefault青円表示。 利用者lane有効。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "newUser-mobile").tween("newSignups", 12483, 12484).set("uploadProgress", 0).set("displayName", "Alice Wonderland").badge("作成"))
  .phase("p2", {
    duration: 2000,
    title: "デフォルトavatar表示",
    body: "オンボーディングwizardの アバター ステップ、 initials 'AW' のdefaultアバター 表示。 uploadProgress 0 (default選択、 uploadなし)、 activeUsers 0 → 1 tween (Aliceがactiveに)、 アプリ + DB lane activate。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db", "newUser-mobile", "mobile-app", "app-db").set("uploadProgress", 0).tween("activeUsers", 0, 1).badge("default"))
  .phase("p3", {
    duration: 2400,
    title: "カスタム画像upload",
    body: "Aliceがプロフィール写真選択 → S3へupload。 uploadProgress 0 → 100 tween (ゲージ 針が動的に上昇して満タンまで)、 s3 lane activate、 更新 完了時にCDNへdistribution開始。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db", "s3", "newUser-mobile", "mobile-app", "app-db", "app-s3").tween("uploadProgress", 0, 100).badge("upload"))
  .phase("p4", {
    duration: 1800,
    title: "反映(CDN配信)",
    body: "CloudFront edgeキャッシュ に配信、 全ユーザーがAliceの新 アバター を閲覧可能。 uploadProgress 100保持、 activeUsers 1 → 2 tween (Alice + 閲覧者)、 6 shape全active、 アバター プレビュー がinitials → 実写真表示に切替。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db", "s3", "cdn", "newUser-mobile", "mobile-app", "app-db", "app-s3", "s3-cdn", "cdn-mobile").set("uploadProgress", 100).tween("activeUsers", 1, 2).badge("反映"))
  .build();

/**
 * 65. checklist = sprint task list 6 item、 progress% 表示。
 */
export const sprintChecklist = diagram("interactive-sprint-checklist", {
  topic: "sprint 6 task を 2-lane (Done ✓ / Todo) 状態別分散、 各 task 個別 card、 checklist readout 併存",
})
  .lane("done", { x: 0, width: 240 })
  .lane("todo", { x: 300, width: 240 })
  .arraySignal("tasks", [
    ["Setup CI", true],
    ["Write tests", true],
    ["Fix bug #42", false],
    ["Code review", false],
    ["Deploy staging", false],
    ["Post-mortem", false],
  ] as unknown as (string | number)[])
  .node("t1", { lane: "done", stack: 0, kind: "card", title: "✓ Setup CI", subtitle: "完了" })
  .node("t2", { lane: "done", stack: 1, kind: "card", title: "✓ Writeテスト", subtitle: "完了" })
  .node("t3", { lane: "todo", stack: 0, kind: "card", title: "Fixバグ #42", subtitle: "todo (blocker)" })
  .node("t4", { lane: "todo", stack: 1, kind: "card", title: "Codeレビュー", subtitle: "todo (awaitsレビュアー)" })
  .node("t5", { lane: "todo", stack: 2, kind: "card", title: "デプロイ ステージング", subtitle: "todo (dependsオン レビュー)" })
  .node("t6", { lane: "todo", stack: 3, kind: "card", title: "投稿-mortem", subtitle: "todo (last)" })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "進捗(2/6 = 33%)" })
  .phase("p", {
    duration: 1200,
    title: "スプリントsplit",
    body: "2-lane (完了2項目 / Todo 4項目)で6スプリント タスク を状態別分散、 各 タスク 個別 カード で進捗 + note明示、 checklist readoutも併存でprogress% (2/6 = 33%)表示、 状態 分類と チェック-一覧 の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("t1", "t2", "t3", "t4", "t5", "t6").badge("checklist"))
  .build();

/**
 * 66. circular-gauge = engine RPM を 270° dial で表示、 slider で 0-8000 rpm 制御。
 */
export const engineTachometer = diagram("interactive-engine-tachometer", {
  topic: "engine RPM を 3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) 領域別分散 + current rpm indicator、 circularGauge readout 併存",
})
  .lane("idle", { x: 0, width: 200 })
  .lane("cruise", { x: 240, width: 200 })
  .lane("redline", { x: 480, width: 200 })
  .input.slider("rpm", { min: 0, max: 8000, defaultValue: 3500, label: "RPM" })
  .state("rpm", { initial: 3500 })
  .node("idleNode", { lane: "idle", stack: 0, kind: "card", title: "Idle range", subtitle: "0-2000 rpm (green)" })
  .node("cruiseNode", { lane: "cruise", stack: 0, kind: "card", title: "Cruise range", subtitle: "2000-5000 rpm (yellow) · normal driving" })
  .node("redlineNode", { lane: "redline", stack: 0, kind: "card", title: "Redline range", subtitle: "5000-8000 rpm (red) · caution" })
  .node("currentRpm", { lane: "cruise", stack: 1, kind: "card", title: "◆ Current", subtitle: "{rpm} rpm (default 3500 = cruise)" })
  .readout.circularGauge("g", { source: "rpm", min: 0, max: 8000, unit: "rpm", color: "#f97316", viewW: 200, viewH: 160, label: "Tachometer (270° dial)" })
  .phase("p", {
    duration: 1200,
    title: "rpm range地図",
    body: "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000)でrpm範囲を領域別分散、 各range個別 カード + 現在rpm indicator (default 3500 = cruise lane)、 circularGauge readoutも併存で270° dial表示、 range分類とneedle表示の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("idleNode", "cruiseNode", "redlineNode", "currentRpm").badge("tachometer"))
  .build();

/**
 * 67. productPriceTag v2 = 大手 EC のブラックフライデー ダイナミック プライシング シナリオ、 shape-online-shop + shape-mobile-device + shape-storefront + shape-cylinder + shape-warehouse + shape-person の 6 shape で visual scene 化、 4 phase (通常価格 → セール開始 → 値下げ深化 → 在庫連動最終値) + 4 readout (priceTag / gauge 割引率 / countup 販売数 / bar 在庫残) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "ECブラックフライデーでダイナミック値付け、通常価格からセール、深化、在庫連動まで",
})
  .lane("customer", { x: 0, width: 200 })
  .lane("ec", { x: 220, width: 300 })
  .lane("supply", { x: 540, width: 240 })
  .state("newPrice", { initial: 100 })
  .state("oldPrice", { initial: 100 })
  .state("discount", { initial: 0 })
  .state("sold", { initial: 0 })
  .state("stock", { initial: 500 })
  .node("shopper", { lane: "customer", stack: 0, kind: "shape-person", title: "買い物客 中村様", eyebrow: "顧客", subtitle: "セールwatcher" })
  .node("mobile", { lane: "customer", stack: 1, kind: "shape-mobile-device", title: "Amazonアプリ", eyebrow: "端末", subtitle: "商品ページ · 価格 アラート" })
  .node("shop", { lane: "ec", stack: 0, kind: "shape-online-shop", title: "Amazon.co.jp", eyebrow: "ec", subtitle: "商品 「掃除機X」 · 価格 ¥{newPrice}" })
  .node("store", { lane: "ec", stack: 1, kind: "shape-storefront", title: "セール会場", eyebrow: "campaign", subtitle: "BFセール · 動的値付けengine" })
  .node("db", { lane: "ec", stack: 2, kind: "shape-cylinder", title: "価格履歴DB", eyebrow: "データベース", subtitle: "1hごとpriceスナップショット" })
  .node("warehouse", { lane: "supply", stack: 0, kind: "shape-warehouse", title: "配送センター", eyebrow: "logistics", subtitle: "在庫 {在庫} 個 · Fulfilled by Amazon" })
  .edge("shopper", "mobile", { label: "監視", tone: "info" })
  .edge("mobile", "shop", { label: "取得 /商品", tone: "info" })
  .edge("shop", "store", { label: "セール適用", tone: "warning" })
  .edge("store", "db", { label: "履歴保存", tone: "accent" })
  .edge("shop", "warehouse", { label: "在庫照会", tone: "success" })
  .readout.priceTag("pt", { oldSource: "oldPrice", newSource: "newPrice", currency: "¥", colorNew: "#0f172a", colorOld: "#94a3b8", colorDiscount: "#ef4444", label: "商品価格" })
  .readout.gauge("discountG", { source: "discount", min: 0, max: 50, color: "#ef4444", label: "割引率 (%)" })
  .readout.countup("soldCU", { source: "sold", unit: " 個", label: "販売数", decimals: 0 })
  .readout.bar("stockBar", { source: "stock", min: 0, max: 500, color: "#22c55e", label: "在庫残" })
  .phase("p1", {
    duration: 2000,
    title: "通常価格",
    body: "セール前、 掃除機Xは定価 ¥12,800販売中。 newPrice = 100相当(priceTag定価表示、 割引なし)、 割引 = 0 (ゲージ 針最下)、 sold = 0 (未売却)、 在庫500 (bar満タン)。 顧客 + ショップlane有効。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "shopper-mobile", "mobile-shop").set("newPrice", 100).set("oldPrice", 100).set("discount", 0).set("sold", 0).set("stock", 500).badge("通常"))
  .phase("p2", {
    duration: 2400,
    title: "セール開始",
    body: "BF 00:00にセール開始、 storeの値付けengineが発動。 newPrice 100 → 75 tween (priceTagが赤値下げ表示 + 打消し線)、 oldPrice = 100 (打消し線)、 割引0 → 25 tween (ゲージ 針が赤域上昇 = 25% オフ)、 store lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store", "shopper-mobile", "mobile-shop", "shop-store").tween("newPrice", 100, 75).set("oldPrice", 100).tween("discount", 0, 25).badge("セール"))
  .phase("p3", {
    duration: 2200,
    title: "値下げ深化 (競合対抗)",
    body: "競合が同時値下げでengineが再値下げ、 newPrice 75 → 65 tween (priceTag数字が更新)、 割引25 → 35 tween (ゲージ 針最高付近、 35% オフ)、 sold 0 → 180 tween (countup加速 = 買い注文集中)、 在庫500 → 320 tween (bar縮小)、 DB lane activate履歴保存。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store", "db", "shopper-mobile", "mobile-shop", "shop-store", "store-db").tween("newPrice", 75, 65).tween("discount", 25, 35).tween("sold", 0, 180).tween("stock", 500, 320).badge("深化"))
  .phase("p4", {
    duration: 2000,
    title: "在庫連動 最終値",
    body: "在庫320 → 減少でengineが値上げ(在庫希少シグナル)、 newPrice 65 → 68 tween (少し戻す)、 割引35 → 32 tween、 sold 180 → 380 tween (販売継続)、 在庫320 → 120 tween (bar更に縮小)、 warehouse lane activate、 6 shape全active、 セール終盤のbuy sell均衡。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store", "db", "warehouse", "shopper-mobile", "mobile-shop", "shop-store", "store-db", "shop-warehouse").tween("newPrice", 65, 68).tween("discount", 35, 32).tween("sold", 180, 380).tween("stock", 320, 120).badge("在庫連動"))
  .build();

/**
 * 68. deploySpinner v2 = 金曜夜 production deploy 4 phase シナリオ (canary rollout → 全体展開)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-warehouse + shape-hexagon の 6 shape で visual scene 化、 4 phase (build 完了 → canary 20% → 全体 100% → 完了通知) + 4 readout (spinner / gauge rollout % / countup pod 数 / stat 経過時間) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "金曜夜の本番デプロイ、ビルド完了から段階的リリース、全体展開、完了通知まで",
})
  .lane("engineer", { x: 0, width: 220 })
  .lane("infra", { x: 240, width: 320 })
  .lane("notify", { x: 580, width: 240 })
  .state("status", { initial: "running" })
  .state("msg", { initial: "Building production bundle" })
  .state("rolloutPct", { initial: 0 })
  .state("readyPods", { initial: 0 })
  .state("elapsedMin", { initial: 0 })
  .node("engineer", { lane: "engineer", stack: 0, kind: "shape-person", title: "releaseエンジニア 岡田様", eyebrow: "エンジニア", subtitle: "金曜夜21:00 deploy担当" })
  .node("laptop", { lane: "engineer", stack: 1, kind: "shape-mobile-device", title: "kubectl + ArgoCD", eyebrow: "端末", subtitle: "deployコマンド + 進捗watch" })
  .node("cluster", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "本番K8sクラスター", eyebrow: "計算", subtitle: "30 Pod target · ローリング更新" })
  .node("registry", { lane: "infra", stack: 1, kind: "shape-cloud", title: "コンテナ レジストリ", eyebrow: "artifact", subtitle: "v2.5.0イメージ プル" })
  .node("cdn", { lane: "infra", stack: 2, kind: "shape-hexagon", title: "CDNキャッシュinvalidate", eyebrow: "パージ", subtitle: "global edgeパージ · TTL 300s" })
  .node("slack", { lane: "notify", stack: 0, kind: "shape-warehouse", title: "Slack #リリース", eyebrow: "channel", subtitle: "デプロイ状態 通知配信" })
  .edge("engineer", "laptop", { label: "kubectl apply", tone: "info" })
  .edge("laptop", "cluster", { label: "rollout開始", tone: "warning" })
  .edge("cluster", "registry", { label: "イメージ プル", tone: "info" })
  .edge("cluster", "cdn", { label: "パージ", tone: "accent" })
  .edge("cluster", "slack", { label: "状態 通知", tone: "success" })
  .readout.spinner("sp", { source: "status", textSource: "msg", color: "#2563eb", label: "デプロイ 進捗" })
  .readout.gauge("rolloutG", { source: "rolloutPct", min: 0, max: 100, color: "#22c55e", label: "展開 %" })
  .readout.countup("podsCU", { source: "readyPods", unit: "/30", label: "ready pods", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedMin", unit: " 分", caption: "経過時間", label: "経過" })
  .phase("p1", {
    duration: 2000,
    title: "build完了",
    body: "岡田様が デプロイ コマンド実行、 レジストリ から イメージ プル 開始。 状態 = '実行中' (spinner blue)、 メッセージ = 'Pulling v2.5.0イメージ'、 rolloutPct 0 → 5 tween、 readyPods 0、 elapsedMin 0 → 2 tween。 エンジニアlane有効。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "registry", "engineer-laptop").set("status", "running").set("msg", "Pulling v2.5.0 image").tween("rolloutPct", 0, 5).tween("elapsedMin", 0, 2).badge("build"))
  .phase("p2", {
    duration: 2400,
    title: "カナリアrollout (20%)",
    body: "3 Pod (10%) → 6 Pod (20%)と カナリア 展開、 指標 監視。 状態 = '実行中' 継続、 メッセージ = 'Canary 20% healthy'、 rolloutPct 5 → 20 tween、 readyPods 0 → 6 tween (countup加算)、 elapsedMin 2 → 8 tween、 クラスター lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry", "engineer-laptop", "laptop-cluster", "cluster-registry").set("status", "running").set("msg", "Canary 20% healthy").tween("rolloutPct", 5, 20).tween("readyPods", 0, 6).tween("elapsedMin", 2, 8).badge("canary"))
  .phase("p3", {
    duration: 2400,
    title: "全体展開 (100%)",
    body: "カナリア 正常確認 → 残24 Podを ローリング更新。 状態 = '実行中' 継続、 メッセージ = 'Full展開60% → 100%'、 rolloutPct 20 → 100 tween (ゲージ 針最上位まで急上昇)、 readyPods 6 → 30 tween (countup dramatic)、 elapsedMin 8 → 18 tween、 CDN lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry", "cdn", "engineer-laptop", "laptop-cluster", "cluster-registry", "cluster-cdn").set("msg", "Full rollout in progress").tween("rolloutPct", 20, 100).tween("readyPods", 6, 30).tween("elapsedMin", 8, 18).badge("展開"))
  .phase("p4", {
    duration: 1800,
    title: "完了通知",
    body: "全30 Pod v2.5.0起動、 CDNパージ 完了。 状態 = '完了' (spinnerが緑 ✓ に変化)、 メッセージ = 'デプロイcomplete v2.5.0'、 rolloutPct 100保持、 readyPods 30保持、 elapsedMin 18 → 22 tween、 slack lane activateで完了通知配信、 6 shape全active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry", "cdn", "slack", "engineer-laptop", "laptop-cluster", "cluster-registry", "cluster-cdn", "cluster-slack").set("status", "done").set("msg", "Deploy complete v2.5.0").tween("elapsedMin", 18, 22).badge("完了"))
  .build();

/**
 * 69. grade = exam score を slider で操作 → A/B/C/D/F letter grade + color 追随。
 */
export const examGrade = diagram("interactive-exam-grade", {
  topic: "exam grade 5 letter (A/B/C/D/F) を 5-lane band 分散 + current indicator (default=B lane)、 grade readout 併存",
})
  .lane("A", { x: 0, width: 130 })
  .lane("B", { x: 150, width: 130 })
  .lane("C", { x: 300, width: 130 })
  .lane("D", { x: 450, width: 130 })
  .lane("F", { x: 600, width: 130 })
  .input.slider("score", { min: 0, max: 100, defaultValue: 85, label: "スコア" })
  .state("score", { initial: 85 })
  .node("aNode", { lane: "A", stack: 0, kind: "card", title: "A", subtitle: "≥ 90 (green)" })
  .node("bNode", { lane: "B", stack: 0, kind: "card", title: "B", subtitle: "80-89 (blue, default here)" })
  .node("cNode", { lane: "C", stack: 0, kind: "card", title: "C", subtitle: "70-79 (yellow)" })
  .node("dNode", { lane: "D", stack: 0, kind: "card", title: "D", subtitle: "60-69 (orange)" })
  .node("fNode", { lane: "F", stack: 0, kind: "card", title: "F", subtitle: "< 60 (red)" })
  .node("currentGrade", { lane: "B", stack: 1, kind: "card", title: "◆ Current", subtitle: "スコア = {スコア} / 100" })
  .readout.grade("g", { source: "score", max: 100, label: "Letter成績(band)" })
  .phase("p", {
    duration: 1200,
    title: "成績band split",
    body: "5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60)で5 letter成績bandを分散、 各band個別 カード + current indicator (defaultスコア85 → B lane)、 slider変化で 成績readoutがletter + color追随、 成績band分類とcurrentの2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("aNode", "bNode", "cNode", "dNode", "fNode", "currentGrade").badge("grade"))
  .build();

/**
 * 70. stopwatch = ms 数値 (stepper で秒指定) を MM:SS.ms display で表示。
 */
export const timerStopwatch = diagram("interactive-timer-stopwatch", {
  topic: "stopwatch control を 3-lane (Seconds input / Running toggle / MM:SS.ms display) + 2 edge、 stepper + toggle → display fan-out、 stopwatch readout 併存",
})
  .lane("input", { x: 0, width: 200 })
  .lane("toggle", { x: 240, width: 200 })
  .lane("display", { x: 480, width: 220 })
  .input.stepper("sec", { min: 0, max: 3600, step: 5, defaultValue: 125, label: "Elapsed秒" })
  .input.toggle("running", { defaultValue: true, label: "実行中" })
  .state("sec", { initial: 125 })
  .state("running", { initial: "true" })
  .state("elapsed", { initial: 125000 })
  .formula("elapsed", "sec * 1000")
  .node("secNode", { lane: "input", stack: 0, kind: "card", title: "Seconds", subtitle: "秒 = {秒}s (0-3600)" })
  .node("runNode", { lane: "toggle", stack: 0, kind: "card", title: "実行中 切替", subtitle: "実行中 = {実行中}" })
  .node("displayNode", { lane: "display", stack: 0, kind: "card", title: "MM:SS.ミリ秒display", subtitle: "経過 = 秒 × 1000 = {経過}ミリ秒" })
  .edge("secNode", "displayNode", { label: "× 1000", tone: "info" })
  .edge("runNode", "displayNode", { label: "色", tone: "success" })
  .readout.stopwatch("sw", { source: "elapsed", runningSource: "running", size: 40, color: "#0f172a", label: "タイマー (MM:SS.ミリ秒)" })
  .phase("p", {
    duration: 1200,
    title: "タイマー signalフロー",
    body: "3-lane (Seconds / 実行中 / 表示)で ストップウォッチ3 componentを分散、 2 edge (× 1000情報tone / color成功tone)で2 signal → 1 displayのfan-内 明示、 stepper + 切替 変化で ストップウォッチreadoutのtime + colorが同時追随。",
  }, (p: PhaseBuilder) => p.activate("secNode", "runNode", "displayNode", "secNode-displayNode", "runNode-displayNode").badge("timer"))
  .build();

/**
 * 71. mlConfidenceMeter v2 = 医療画像診断 AI の推論 confidence 判定 4 phase シナリオ (X線画像 → AI 推論 → 医師確認 → 診断確定)、 shape-person + shape-mobile-device + shape-server-rack + shape-hexagon + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (X 線撮影 → AI 推論 → 医師レビュー → 診断確定) + 4 readout (confidenceMeter / gauge 予測確率 / countup 処理画像数 / stat 誤判定率) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "医療画像診断AIの4ステップ、X線撮影からAI推論、医師レビュー、診断確定まで",
})
  .lane("clinic", { x: 0, width: 240 })
  .lane("ai", { x: 260, width: 300 })
  .lane("outcome", { x: 580, width: 220 })
  .state("conf", { initial: 0 })
  .state("probability", { initial: 0 })
  .state("processedImg", { initial: 12483 })
  .state("errorRate", { initial: 0 })
  .node("patient", { lane: "clinic", stack: 0, kind: "shape-person", title: "患者 木下様", eyebrow: "patient", subtitle: "胸部X線撮影対象" })
  .node("device", { lane: "clinic", stack: 1, kind: "shape-mobile-device", title: "撮影機tablet UI", eyebrow: "端末", subtitle: "DICOM画像取得" })
  .node("gpu", { lane: "ai", stack: 0, kind: "shape-server-rack", title: "GPU推論サーバ", eyebrow: "計算", subtitle: "NVIDIA A100 × 4 · TensorRT" })
  .node("model", { lane: "ai", stack: 1, kind: "shape-hexagon", title: "診断model", eyebrow: "ML", subtitle: "ResNet-50 · 12分類 · 上位-1 conf" })
  .node("db", { lane: "ai", stack: 2, kind: "shape-cylinder", title: "電子カルテDB", eyebrow: "保存", subtitle: "推論結果 + 医師override保存" })
  .node("doctor", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "放射線科医", eyebrow: "熟練", subtitle: "AI補助 → 最終診断確定" })
  .edge("patient", "device", { label: "撮影", tone: "info" })
  .edge("device", "gpu", { label: "画像送信", tone: "info" })
  .edge("gpu", "model", { label: "推論", tone: "accent" })
  .edge("model", "db", { label: "推論結果", tone: "success" })
  .edge("db", "doctor", { label: "レビュー要求", tone: "warning" })
  .edge("doctor", "db", { label: "最終診断", tone: "success" })
  .readout.confidenceMeter("cm", { source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 320, viewH: 40, label: "AI推論confidence" })
  .readout.gauge("probG", { source: "probability", min: 0, max: 100, color: "#22c55e", label: "上位-1予測確率 %" })
  .readout.countup("imgCU", { source: "processedImg", unit: " 枚", label: "本日推論画像", decimals: 0 })
  .readout.stat("errStat", { source: "errorRate", unit: " %", caption: "AI誤判定率", label: "エラー" })
  .phase("p1", {
    duration: 1800,
    title: "X線撮影",
    body: "木下様の胸部X線撮影、 DICOM形式で送信。 conf 0 (未推論)、 probability 0、 processedImg 12483保持、 errorRate 0。 patient + 端末lane有効。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "patient-device").set("conf", 0).set("probability", 0).badge("撮影"))
  .phase("p2", {
    duration: 2400,
    title: "AI推論(ResNet-50)",
    body: "GPUサーバでinference、 12病名 分類の 上位-1 = '正常' 推論。 conf 0 → 68 tween (confidenceMeterが黄域に移動)、 probability 0 → 78 tween (ゲージ 針上昇)、 processedImg 12483 → 12484 tween (countup +1)、 GPU + model lane activate。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model", "patient-device", "device-gpu", "gpu-model").tween("conf", 0, 68).tween("probability", 0, 78).tween("processedImg", 12483, 12484).badge("推論"))
  .phase("p3", {
    duration: 2200,
    title: "医師レビュー",
    body: "放射線科医がAI推論結果を確認、 追加所見(軽微な影)を加味。 conf 68 → 82 tween (confidenceMeterが緑域へ)、 probability 78 → 92 tween (医師overrideで高精度化)、 errorRate 0 → 2 tween (誤判定率sample表示)、 DB + doctor lane activate。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model", "db", "doctor", "patient-device", "device-gpu", "gpu-model", "model-db", "db-doctor", "doctor-db").tween("conf", 68, 82).tween("probability", 78, 92).tween("errorRate", 0, 2).badge("医師"))
  .phase("p4", {
    duration: 2000,
    title: "診断確定",
    body: "最終診断 = '軽度肺炎'、 電子カルテに記録 + 木下様に説明。 conf 82 → 95 tween (confidenceMeter最上位、 高信頼)、 probability 92 → 97 tween (ゲージ 最終)、 processedImg 12484 → 12485 tween、 errorRate 2保持、 6 shape全active、 診断確定。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model", "db", "doctor", "patient-device", "device-gpu", "gpu-model", "model-db", "db-doctor", "doctor-db").tween("conf", 82, 95).tween("probability", 92, 97).tween("processedImg", 12484, 12485).badge("確定"))
  .build();

/**
 * 72. postReactions v2 = X (旧 Twitter) バズ投稿の 24 時間 reaction 時系列シナリオ、 shape-person + shape-mobile-device + shape-message-bubble + shape-cloud + shape-cylinder + shape-warehouse の 6 shape で visual scene 化、 4 phase (投稿直後 → 初動拡散 → バズ → 落ち着き) + 4 readout (reactionBar / gauge engagement / countup 総 reaction / stat impression) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const postReactions = diagram("interactive-post-reactions", {
  topic: "X バズ投稿 24h reaction 時系列 = 4 phase (投稿 → 初動 → バズ → 落ち着き) の flow を shape-* primitive 6 種で表現 + 4 readout (reactionBar / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("author", { x: 0, width: 220 })
  .lane("platform", { x: 240, width: 300 })
  .lane("audience", { x: 560, width: 240 })
  .arraySignal("reactions", [
    ["👍", 24],
    ["❤️", 12],
    ["😂", 8],
    ["🎉", 5],
  ] as unknown as (string | number)[])
  .state("engagement", { initial: 0 })
  .state("totalReactions", { initial: 0 })
  .state("impressions", { initial: 0 })
  .node("author", { lane: "author", stack: 0, kind: "shape-person", title: "投稿者 木村様", eyebrow: "creator", subtitle: "@kimura_dev · 3.2k followers" })
  .node("mobile", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "Xアプリ", eyebrow: "端末", subtitle: "投稿作成 + reaction確認" })
  .node("post", { lane: "platform", stack: 0, kind: "shape-message-bubble", title: "投稿 (140 字)", eyebrow: "content", subtitle: "'iOS 18の新機能まとめ 🚀'" })
  .node("timeline", { lane: "platform", stack: 1, kind: "shape-cloud", title: "X timeline", eyebrow: "配分", subtitle: "algorithm順位 + trending判定" })
  .node("analytics", { lane: "platform", stack: 2, kind: "shape-cylinder", title: "X分析DB", eyebrow: "データベース", subtitle: "engagement集計 · 反応rollup" })
  .node("audience", { lane: "audience", stack: 0, kind: "shape-warehouse", title: "全世界audience", eyebrow: "readers", subtitle: "impression {表示回数} 名到達" })
  .edge("author", "mobile", { label: "投稿", tone: "info" })
  .edge("mobile", "post", { label: "発行", tone: "info" })
  .edge("post", "timeline", { label: "配信", tone: "success" })
  .edge("timeline", "audience", { label: "公開", tone: "success" })
  .edge("audience", "analytics", { label: "reactionイベント", tone: "accent" })
  .edge("analytics", "mobile", { label: "通知 通知", tone: "warning" })
  .readout.reactionBar("rb", { source: "reactions", color: "#2563eb", label: "反応pill一覧" })
  .readout.gauge("engG", { source: "engagement", min: 0, max: 100, color: "#22c55e", label: "エンゲージメントrate %" })
  .readout.countup("reactCU", { source: "totalReactions", unit: " 件", label: "累計reactions", decimals: 0 })
  .readout.stat("impStat", { source: "impressions", unit: " 名", caption: "到達数", label: "表示回数" })
  .phase("p1", {
    duration: 1800,
    title: "投稿直後(0-1h)",
    body: "木村様がiOS 18まとめ 投稿 を 発行、 followerに配信開始。 エンゲージメント0 → 3 tween、 totalReactions 0 → 15 tween (countup加算、 初動reaction)、 表示回数0 → 800 tween、 author + 投稿lane有効。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "author-mobile", "mobile-post").tween("engagement", 0, 3).tween("totalReactions", 0, 15).tween("impressions", 0, 800).badge("投稿"))
  .phase("p2", {
    duration: 2200,
    title: "初動拡散(1-4h)",
    body: "algorithm順位 でtrending候補入り、 timeline露出増。 エンゲージメント3 → 12 tween、 totalReactions 15 → 240 tween (加速、 リプライ + retweet混合)、 表示回数800 → 15000 tween、 timeline + 観衆lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience", "author-mobile", "mobile-post", "post-timeline", "timeline-audience").tween("engagement", 3, 12).tween("totalReactions", 15, 240).tween("impressions", 800, 15000).badge("初動"))
  .phase("p3", {
    duration: 2400,
    title: "バズ(4-12h)",
    body: "influencer拡散でバズ、 trending topic入り。 エンゲージメント12 → 28 tween (ゲージ 針最上位)、 totalReactions 240 → 1850 tween (加速 最大、 countup dramatic)、 表示回数15000 → 240000 tween (爆発的到達)、 分析lane activate、 木村様 通知 で盛り上がり通知。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience", "analytics", "author-mobile", "mobile-post", "post-timeline", "timeline-audience", "audience-analytics", "analytics-mobile").tween("engagement", 12, 28).tween("totalReactions", 240, 1850).tween("impressions", 15000, 240000).badge("バズ"))
  .phase("p4", {
    duration: 2000,
    title: "落ち着き(12-24h)",
    body: "24h経過でreaction頻度低下、 累計は継続増加。 エンゲージメント28 → 18 tween (時間経過で低下)、 totalReactions 1850 → 2450 tween (最終)、 表示回数240000 → 380000 tween (継続露出)、 6 shape全active、 24h累計固定。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience", "analytics", "author-mobile", "mobile-post", "post-timeline", "timeline-audience", "audience-analytics", "analytics-mobile").tween("engagement", 28, 18).tween("totalReactions", 1850, 2450).tween("impressions", 240000, 380000).badge("24h"))
  .build();

/**
 * 73. techPills v2 = スタートアップ CTO 技術選定 4 phase 判断シナリオ (SaaS project の tech stack 決定)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (要件整理 → 候補比較 → PoC 検証 → 選定確定) + 4 readout (pillGroup / gauge 適合度 / countup PoC 時間 / stat 採用数) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const techPills = diagram("interactive-tech-pills", {
  topic: "CTO 技術選定 4 phase = (要件 → 候補 → PoC → 確定) の flow を shape-* primitive 6 種で表現 + 4 readout (pillGroup / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("cto", { x: 0, width: 220 })
  .lane("review", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .arraySignal("stack", [
    ["React", "#61dafb"],
    ["TypeScript", "#3178c6"],
    ["Rust", "#dea584"],
    ["Vite", "#646cff"],
    ["Bun", "#000000"],
  ] as unknown as (string | number)[])
  .state("fitScore", { initial: 0 })
  .state("pocHours", { initial: 0 })
  .state("adoptedCount", { initial: 0 })
  .node("cto", { lane: "cto", stack: 0, kind: "shape-person", title: "CTO高山様", eyebrow: "エンジニア", subtitle: "SaaS立上げ技術判断責任" })
  .node("laptop", { lane: "cto", stack: 1, kind: "shape-mobile-device", title: "評価sheet", eyebrow: "端末", subtitle: "候補tech 5個 × 4軸評価" })
  .node("docs", { lane: "review", stack: 0, kind: "shape-website", title: "docs / ベンチマーク", eyebrow: "reference", subtitle: "公式docs + community記事" })
  .node("pocServer", { lane: "review", stack: 1, kind: "shape-server-rack", title: "PoC環境", eyebrow: "サンドボックス", subtitle: "検証branch · CI実行" })
  .node("advisor", { lane: "review", stack: 2, kind: "shape-hexagon", title: "technicalアドバイザー", eyebrow: "コンサル", subtitle: "元Googleエンジニア 評価" })
  .node("finalStack", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "確定tech stack", eyebrow: "decision", subtitle: "本番採用 · チーム展開" })
  .edge("cto", "laptop", { label: "評価", tone: "info" })
  .edge("laptop", "docs", { label: "調査", tone: "info" })
  .edge("laptop", "pocServer", { label: "PoC実装", tone: "accent" })
  .edge("pocServer", "advisor", { label: "評価依頼", tone: "warning" })
  .edge("advisor", "finalStack", { label: "推奨", tone: "success" })
  .readout.pillGroup("pg", { source: "stack", label: "候補tech stack (5)" })
  .readout.gauge("fitG", { source: "fitScore", min: 0, max: 100, color: "#22c55e", label: "要件適合度 %" })
  .readout.countup("hoursCU", { source: "pocHours", unit: " h", label: "PoC累計時間", decimals: 0 })
  .readout.stat("adoptStat", { source: "adoptedCount", unit: "/5", caption: "採用決定", label: "選定" })
  .phase("p1", {
    duration: 2000,
    title: "要件整理",
    body: "SaaSの性能 + 開発効率 + community 3軸で要件定義。 fitScore 0 → 20 tween、 pocHours 0、 adoptedCount 0、 pillGroupで5候補列挙。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "cto-laptop").tween("fitScore", 0, 20).badge("要件"))
  .phase("p2", {
    duration: 2400,
    title: "候補比較",
    body: "docs + ベンチマーク で5候補のpros/cons整理。 fitScore 20 → 45 tween、 pocHours 0 → 8 tween、 adoptedCount 0 → 2 tween (React + TS即決)、 docs lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs", "cto-laptop", "laptop-docs").tween("fitScore", 20, 45).tween("pocHours", 0, 8).tween("adoptedCount", 0, 2).badge("候補"))
  .phase("p3", {
    duration: 2400,
    title: "PoC検証",
    body: "残3候補(Rust / Vite / Bun)をCIでPoC。 fitScore 45 → 78 tween、 pocHours 8 → 32 tween (24h追加)、 adoptedCount 2 → 4 tween (Vite / Bun追加)、 pocServer + アドバイザー lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs", "pocServer", "advisor", "cto-laptop", "laptop-docs", "laptop-pocServer", "pocServer-advisor").tween("fitScore", 45, 78).tween("pocHours", 8, 32).tween("adoptedCount", 2, 4).badge("PoC"))
  .phase("p4", {
    duration: 2000,
    title: "選定確定",
    body: "advisor推薦でRustも採用、 5/5全tech確定。 fitScore 78 → 92 tween (ゲージ 最上位)、 pocHours 32 → 40 tween、 adoptedCount 4 → 5 tween、 finalStack lane activate、 6 shape全active。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs", "pocServer", "advisor", "finalStack", "cto-laptop", "laptop-docs", "laptop-pocServer", "pocServer-advisor", "advisor-finalStack").tween("fitScore", 78, 92).tween("pocHours", 32, 40).tween("adoptedCount", 4, 5).badge("確定"))
  .build();

/**
 * 74. fuel-bar = device battery、 slider で 0-100% 変化 → 10 segment + 3 color band 追随。
 */
export const deviceBattery = diagram("interactive-device-battery", {
  topic: "battery level を 3-lane (Low <20 / Mid 20-60 / High ≥60) band 別分散 + current indicator (default=high)、 fuelBar readout 併存",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 220 })
  .input.slider("battery", { min: 0, max: 100, defaultValue: 72, label: "Battery %" })
  .state("battery", { initial: 72 })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "低band", subtitle: "< 20% (red · 重大)" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "中band", subtitle: "20-60% (yellow · 課金soon)" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "高band", subtitle: "≥ 60% (green · healthy)" })
  .node("currentBattery", { lane: "high", stack: 1, kind: "card", title: "◆ Current", subtitle: "battery = {battery}% (default 72 → 高)" })
  .readout.fuelBar("fb", { source: "battery", segments: 10, lowThreshold: 20, highThreshold: 60, viewW: 240, viewH: 32, label: "レベル(10 segment bar)" })
  .phase("p", {
    duration: 1200,
    title: "battery band split",
    body: "3-lane (低 <20 red / 中20-60 yellow / 高 ≥60 green)でbattery 3 bandを分散、 current indicator (default 72 → 高lane)、 slider変化でfuelBar readoutのfilled数 + color追随、 battery / fuel / stamina状態をlane分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("lowNode", "midNode", "highNode", "currentBattery").badge("battery"))
  .build();

/**
 * 75. metrics-grid = SaaS dashboard の 4 KPI を 2×2 grid 表示。
 */
export const dashboardMetricsGrid = diagram("interactive-metrics-grid", {
  topic: "SaaS 4 KPI を 4-lane (Users / Revenue / Uptime / Errors) 分散、 各 KPI 個別 card、 metricsGrid readout 併存",
})
  .lane("users", { x: 0, width: 180 })
  .lane("revenue", { x: 200, width: 180 })
  .lane("uptime", { x: 400, width: 180 })
  .lane("errors", { x: 600, width: 180 })
  .arraySignal("kpis", [
    ["Users", "12.4k"],
    ["Revenue", "$45k"],
    ["Uptime", "99.9", "%"],
    ["Errors", 12],
  ] as unknown as (string | number)[])
  .node("usersNode", { lane: "users", stack: 0, kind: "card", title: "Users", subtitle: "12.4k (有効MAU)" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", title: "売上", subtitle: "$45k (MRR)" })
  .node("uptimeNode", { lane: "uptime", stack: 0, kind: "card", title: "稼働", subtitle: "99.9% (SLA)" })
  .node("errorsNode", { lane: "errors", stack: 0, kind: "card", title: "Errors", subtitle: "12 (last 24h)" })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "指標(2×2グリッド)" })
  .phase("p", {
    duration: 1200,
    title: "KPI 4-way split",
    body: "4-lane (Users / 売上 / 稼働 / Errors)でSaaS 4 KPIを機能別分散、 各KPI個別 カード でvalue + context明示、 metricsGrid readoutも併存で2×2グリッド 表示、 KPI分類と ダッシュボード 全体の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("usersNode", "revenueNode", "uptimeNode", "errorsNode").badge("grid"))
  .build();

/**
 * 76. thermometer = 室温 24°C を slider で操作 → 縦 bar + 球部 で温度表示。
 */
export const roomThermometer = diagram("interactive-room-thermometer", {
  topic: "室温を 3-lane (Cold <15°C / Comfort 15-25°C / Hot ≥25°C) 温度帯別分散 + current indicator、 thermometer readout 併存",
})
  .lane("cold", { x: 0, width: 200 })
  .lane("comfort", { x: 240, width: 220 })
  .lane("hot", { x: 500, width: 200 })
  .input.slider("temp", { min: 0, max: 40, defaultValue: 24, label: "Temp °C" })
  .state("temp", { initial: 24 })
  .node("coldNode", { lane: "cold", stack: 0, kind: "card", title: "Cold band", subtitle: "< 15°C (blue · heating)" })
  .node("comfortNode", { lane: "comfort", stack: 0, kind: "card", title: "Comfort band", subtitle: "15-25°C (green · default range)" })
  .node("hotNode", { lane: "hot", stack: 0, kind: "card", title: "Hot band", subtitle: "≥ 25°C (red · cooling)" })
  .node("currentTemp", { lane: "comfort", stack: 1, kind: "card", title: "◆ Current", subtitle: "temp = {temp}°C (default 24 → comfort)" })
  .readout.thermometer("th", { source: "temp", min: 0, max: 40, viewW: 70, viewH: 180, color: "#ef4444", unit: "°C", label: "Temp (vertical bar)" })
  .phase("p", {
    duration: 1200,
    title: "temperature band split",
    body: "3-lane (Cold <15 / Comfort 15-25 / Hot ≥25)でroom温度をband別分散、 current indicator (default 24 → comfort lane)、 slider変化でthermometer readout縦bar + 球部 追随、 温度帯分類とthermometer表示の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("coldNode", "comfortNode", "hotNode", "currentTemp").badge("temp"))
  .build();

/**
 * 77. icon-tile = 3 KPI を emoji icon + label + value tile で表示。
 */
export const kpiIconTile = diagram("interactive-kpi-icon-tile", {
  topic: "3 KPI (Growth / Revenue / Goals) を 3-lane 個別 tile 分散、 iconTile readout 併存",
})
  .lane("growth", { x: 0, width: 220 })
  .lane("revenue", { x: 260, width: 220 })
  .lane("goals", { x: 520, width: 220 })
  .arraySignal("kpis", [
    ["📈", "Growth", "+15%"],
    ["💰", "Revenue", "$50k"],
    ["🎯", "Goals", "8/10"],
  ] as unknown as (string | number)[])
  .node("growthNode", { lane: "growth", stack: 0, kind: "card", title: "📈 成長", subtitle: "+15% MoM" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", title: "💰 売上", subtitle: "$50k MRR" })
  .node("goalsNode", { lane: "goals", stack: 0, kind: "card", title: "🎯 Goals", subtitle: "8/10 achieved" })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "KPIs (アイコンtile)" })
  .phase("p", {
    duration: 1200,
    title: "KPI tile split",
    body: "3-lane (成長 / 売上 / Goals)で3 KPIを機能別分散、 各KPI個別 カード でemoji + value明示、 iconTile readoutも併存でcoloredアイコンsquare表示、 KPI分類とtile一覧の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("growthNode", "revenueNode", "goalsNode").badge("tiles"))
  .build();

/**
 * 78. cryptoWallet v2 = 個人 DeFi 保有者の日次 portfolio モニター シナリオ、 shape-wallet + shape-token × 4 + shape-exchange + shape-blockchain-node + shape-ethereum-chain の 7 shape で visual scene 化、 4 phase (portfolio 確認 → 市場更新 → 個別詳細 → 集計) + 4 readout (tokenList / gauge 総資産変動 / bar 24h vol / countup 総評価額) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const cryptoWallet = diagram("interactive-crypto-wallet", {
  topic: "個人DeFi保有者の日次ポートフォリオモニターで確認から市場更新、詳細、集計まで",
})
  .lane("holder", { x: 0, width: 200 })
  .lane("tokens", { x: 220, width: 340 })
  .lane("infra", { x: 580, width: 240 })
  .arraySignal("tokens", [
    ["₿", "BTC", "0.42", 5.3],
    ["Ξ", "ETH", "12.5", -2.8],
    ["◎", "SOL", "245", 8.1],
    ["Ð", "DOGE", "8500", -1.4],
  ] as unknown as (string | number)[])
  .state("portfolioValue", { initial: 42580000 })
  .state("volume24h", { initial: 0 })
  .state("dailyDelta", { initial: 50 })
  .node("wallet", { lane: "holder", stack: 0, kind: "shape-wallet", title: "MetaMask", eyebrow: "ウォレット", subtitle: "0xAbc9...defE · Ledger" })
  .node("btc", { lane: "tokens", stack: 0, kind: "shape-token", title: "₿ BTC", eyebrow: "トークン", subtitle: "0.42 BTC · +5.3% 24h" })
  .node("eth", { lane: "tokens", stack: 1, kind: "shape-token", title: "Ξ ETH", eyebrow: "トークン", subtitle: "12.5 ETH · -2.8% 24h" })
  .node("sol", { lane: "tokens", stack: 2, kind: "shape-token", title: "◎ SOL", eyebrow: "トークン", subtitle: "245 SOL · +8.1% 24h" })
  .node("doge", { lane: "tokens", stack: 3, kind: "shape-token", title: "Ð DOGE", eyebrow: "トークン", subtitle: "8500 DOGE · -1.4% 24h" })
  .node("exchange", { lane: "infra", stack: 0, kind: "shape-exchange", title: "CEX見積", eyebrow: "見積", subtitle: "Binance API · 1s拍動" })
  .node("node", { lane: "infra", stack: 1, kind: "shape-blockchain-node", title: "RPC node", eyebrow: "RPC", subtitle: "Infura · eth_call balance" })
  .node("chain", { lane: "infra", stack: 2, kind: "shape-ethereum-chain", title: "Ethereum L1", eyebrow: "chain", subtitle: "遮断 #{portfolioValue}" })
  .edge("wallet", "btc", { label: "保有", tone: "info" })
  .edge("wallet", "eth", { label: "保有", tone: "info" })
  .edge("wallet", "sol", { label: "保有", tone: "info" })
  .edge("wallet", "doge", { label: "保有", tone: "info" })
  .edge("btc", "exchange", { label: "価格", tone: "success" })
  .edge("exchange", "node", { label: "USD見積", tone: "accent" })
  .edge("node", "chain", { label: "balanceクエリ", tone: "success" })
  .readout.tokenList("tl", { source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "Portfolio詳細" })
  .readout.gauge("deltaG", { source: "dailyDelta", min: 0, max: 100, color: "#22c55e", label: "24h変動(%tile)" })
  .readout.bar("volBar", { source: "volume24h", min: 0, max: 1000000000, color: "#f97316", label: "24h vol (USD)" })
  .readout.countup("valueCU", { source: "portfolioValue", unit: " 円", label: "総評価額(JPY)", decimals: 0 })
  .phase("p1", {
    duration: 2000,
    title: "portfolio確認",
    body: "朝8:00、 ウォレット で4トークン 保有確認。 portfolioValue 42,580,000円(countup静止)、 dailyDelta = 50 (ゲージ 針中位、 前日比flat)、 volume24h = 0 (bar空)、 tokenListに4トークン 表示。 holder + tokens lane activate。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "wallet-btc", "wallet-eth", "wallet-sol", "wallet-doge").set("dailyDelta", 50).set("volume24h", 0).badge("確認"))
  .phase("p2", {
    duration: 2400,
    title: "市場更新(CEX API)",
    body: "Binance APIから1s tickで価格更新、 BTC +5.3% / SOL +8.1% / ETH -2.8% / DOGE -1.4%。 dailyDelta 50 → 68 tween (ゲージ 針が緑域上昇 = 全体+)、 volume24h 0 → 780,000,000 tween (barが右へ伸長 = 活発化)、 portfolioValue 42580000 → 43420000 tween (countup加算84万円)、 infra laneのexchange追加activate。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange", "wallet-btc", "wallet-eth", "wallet-sol", "wallet-doge", "btc-exchange").tween("dailyDelta", 50, 68).tween("volume24h", 0, 780000000).tween("portfolioValue", 42580000, 43420000).badge("市場"))
  .phase("p3", {
    duration: 2200,
    title: "個別詳細(RPC balance照会)",
    body: "Infura RPCでeth_call balanceクエリ 実行、 オン-chain残高と ウォレット 表示を照合。 portfolioValue 43420000 → 43680000 tween (countup微増 = 手数料調整反映)、 volume24h 780000000 → 920000000 tween (継続活発)、 node lane activate、 exchange → nodeのaccent edgeで照合 フロー。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange", "node", "wallet-btc", "wallet-eth", "wallet-sol", "wallet-doge", "btc-exchange", "exchange-node").tween("portfolioValue", 43420000, 43680000).tween("volume24h", 780000000, 920000000).badge("詳細"))
  .phase("p4", {
    duration: 1800,
    title: "集計完了",
    body: "chain (Ethereum L1)から最終block番号取得、 portfolio評価完了。 dailyDelta 68 → 72 tween (ゲージ 針最高値、 +2.85% 上昇)、 portfolioValue 43680000 → 43810000 tween (最終 +230万円)、 volume24h 920000000 → 985000000 tween (bar最大付近)、 8 shape全active、 全readout最終値表示。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange", "node", "chain", "wallet-btc", "wallet-eth", "wallet-sol", "wallet-doge", "btc-exchange", "exchange-node", "node-chain").tween("dailyDelta", 68, 72).tween("portfolioValue", 43680000, 43810000).tween("volume24h", 920000000, 985000000).badge("集計"))
  .build();

/**
 * 79. map-pin = world map (地図座標) 上の 5 city を pin 表示。
 */
export const worldMapPins = diagram("interactive-world-map", {
  topic: "world map 5 city を 2-lane (Asia-Pacific / America-Europe) に分散、 各 city 個別 node + 座標表記、 mapPin readout 併存",
})
  .lane("apac", { x: 0, width: 220 })
  .lane("amea", { x: 300, width: 220 })
  .arraySignal("cities", [
    ["Tokyo", 100, 60],
    ["Paris", 60, 30],
    ["NYC", 30, 40],
    ["Sydney", 105, 75],
    ["Rio", 40, 65],
  ] as unknown as (string | number)[])
  .node("tokyo", { lane: "apac", stack: 0, kind: "card", title: "Tokyo", subtitle: "(100, 60)" })
  .node("sydney", { lane: "apac", stack: 1, kind: "card", title: "Sydney", subtitle: "(105, 75)" })
  .node("nyc", { lane: "amea", stack: 0, kind: "card", title: "NYC", subtitle: "(30, 40)" })
  .node("paris", { lane: "amea", stack: 1, kind: "card", title: "Paris", subtitle: "(60, 30)" })
  .node("rio", { lane: "amea", stack: 2, kind: "card", title: "Rio", subtitle: "(40, 65)" })
  .readout.mapPin("mp", { source: "cities", xMin: 0, xMax: 120, yMin: 0, yMax: 80, viewW: 300, viewH: 200, color: "#2563eb", label: "World地図(2D座標)" })
  .phase("p", {
    duration: 1200,
    title: "city split",
    body: "2-lane (Asia-Pacific / America-Europe)で5 cityを地域別に分散、 各city個別 カード + (x,y)座標明示、 mapPin readoutで2D地理配置も併存、 リージョン 分類と地理位置の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("tokyo", "sydney", "nyc", "paris", "rio").badge("map"))
  .build();

/**
 * 80. priority-badge = issue priority、 dropdown で high/med/low 切替 → badge + text 追随。
 */
export const issuePriorityBadge = diagram("interactive-issue-priority", {
  topic: "issue priority を 3-lane (High ▲ / Med ● / Low ▼) 分散、 現在選択 priority を currentIssue node で明示、 priorityBadge readout 併存",
})
  .lane("high", { x: 0, width: 200 })
  .lane("med", { x: 240, width: 200 })
  .lane("low", { x: 480, width: 200 })
  .input.dropdown("prio", { options: ["high", "med", "low"], defaultValue: "high", label: "優先度" })
  .input.text("desc", { defaultValue: "Fix crash on startup", placeholder: "Issue description", maxLength: 60, label: "Description" })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "Fix crash on startup" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "▲ 高 優先度", subtitle: "red · crash / 回帰" })
  .node("medNode", { lane: "med", stack: 0, kind: "card", title: "● Med優先度", subtitle: "yellow · normalバグ" })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "▼ 低 優先度", subtitle: "gray · nice-to-have" })
  .node("currentIssue", { lane: "high", stack: 1, kind: "card", title: "◆ Current課題", subtitle: "prio: {prio} · {desc}" })
  .readout.priorityBadge("pb", { source: "prio", textSource: "desc", label: "優先度(バッジ + アイコン + text)" })
  .phase("p", {
    duration: 1200,
    title: "優先度split",
    body: "3-lane (高red ▲ / Med yellow ● / 低gray ▼)で3優先度 レベル を分散、 各 レベル 個別 カード + 現在 課題 の位置(default=高lane)をcurrentIssueカード で明示、 priorityBadge readoutも併存でdropdown追随 バッジ 表示、 優先度 分類と現在 状態 の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("highNode", "medNode", "lowNode", "currentIssue").badge("issue"))
  .build();

/**
 * 81. podium = tournament の 1st/2nd/3rd 表彰台。
 */
export const tournamentPodium = diagram("interactive-tournament-podium", {
  topic: "tournament 1st/2nd/3rd を 3-lane (Silver/Gold/Bronze、 中央=Gold の podium 配列) 分散、 各 winner 個別 card、 podium readout 併存",
})
  .lane("silver", { x: 0, width: 200 })
  .lane("gold", { x: 220, width: 220 })
  .lane("bronze", { x: 460, width: 200 })
  .arraySignal("winners", [
    ["Alice", "1200 pts"],
    ["Bob", "1050 pts"],
    ["Carol", "980 pts"],
  ] as unknown as (string | number)[])
  .node("silverNode", { lane: "silver", stack: 0, kind: "card", title: "🥈 2nd — Bob", subtitle: "1050 pts (silver)" })
  .node("goldNode", { lane: "gold", stack: 0, kind: "card", title: "🥇 1st — Alice", subtitle: "1200 pts (goldチャンピオン)" })
  .node("bronzeNode", { lane: "bronze", stack: 0, kind: "card", title: "🥉 3rd — Carol", subtitle: "980 pts (bronze)" })
  .readout.podium("pod", { source: "winners", viewW: 280, viewH: 180, label: "表彰台(3縦bar表彰台)" })
  .phase("p", {
    duration: 1200,
    title: "表彰台split",
    body: "3-lane (Silver左 / Gold中央 / Bronze右)で3 winnerを 表彰台 実配置模倣、 中央=1位を目立たせ、 各winner個別 カード で名前 + スコア 明示、 表彰台readoutも併存で従来3縦bar表示。",
  }, (p: PhaseBuilder) => p.activate("silverNode", "goldNode", "bronzeNode").badge("winners"))
  .build();

/**
 * 82. featurePoll v2 = SaaS product manager によるユーザー機能要望投票キャンペーン 4 phase シナリオ、 shape-person + shape-mobile-device + shape-online-shop + shape-cylinder + shape-cloud + shape-warehouse の 6 shape で visual scene 化、 4 phase (投票開始 → 拡散 → 中間集計 → 最終集計) + 4 readout (pollBar / gauge 参加率 / countup 投票数 / stat 差) が tween で visually 連続変化。 iteration 8 wave 8-D2 redesign。
 */
export const featurePoll = diagram("interactive-feature-poll", {
  topic: "SaaS ユーザー機能要望投票 4 phase = (開始 → 拡散 → 中間 → 最終) の flow を shape-* primitive 6 種で表現 + 4 readout (pollBar / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("pm", { x: 0, width: 220 })
  .lane("platform", { x: 240, width: 320 })
  .lane("users", { x: 580, width: 240 })
  .arraySignal("options", [
    ["Dark mode", 42],
    ["Faster search", 28],
    ["Better API", 18],
    ["Nicer UI", 12],
  ] as unknown as (string | number)[])
  .state("participation", { initial: 0 })
  .state("totalVotes", { initial: 0 })
  .state("leadGap", { initial: 0 })
  .node("pm", { lane: "pm", stack: 0, kind: "shape-person", title: "PM中野様", eyebrow: "商品", subtitle: "Q3 roadmap決定担当" })
  .node("dashboard", { lane: "pm", stack: 1, kind: "shape-mobile-device", title: "PM分析画面", eyebrow: "端末", subtitle: "リアルタイム集計view" })
  .node("app", { lane: "platform", stack: 0, kind: "shape-online-shop", title: "SaaS商品", eyebrow: "商品", subtitle: "内-アプリfeatureポーリング バナー" })
  .node("db", { lane: "platform", stack: 1, kind: "shape-cylinder", title: "投票DB", eyebrow: "データベース", subtitle: "1利用者1投票 · unique制約" })
  .node("email", { lane: "platform", stack: 2, kind: "shape-cloud", title: "メールcampaign", eyebrow: "outreach", subtitle: "既存ユーザーへ告知メール" })
  .node("users", { lane: "users", stack: 0, kind: "shape-warehouse", title: "全ユーザー 8500 名", eyebrow: "観衆", subtitle: "投票対象母集団" })
  .edge("pm", "dashboard", { label: "モニター", tone: "info" })
  .edge("dashboard", "app", { label: "ポーリング 起動", tone: "info" })
  .edge("app", "email", { label: "告知", tone: "warning" })
  .edge("email", "users", { label: "拡散", tone: "success" })
  .edge("users", "db", { label: "投票", tone: "accent" })
  .edge("db", "dashboard", { label: "集計", tone: "success" })
  .readout.pollBar("pb", { source: "options", color: "#94a3b8", colorWinner: "#2563eb", label: "投票結果" })
  .readout.gauge("partG", { source: "participation", min: 0, max: 100, color: "#22c55e", label: "参加率 %" })
  .readout.countup("voteCU", { source: "totalVotes", unit: " 票", label: "累計投票", decimals: 0 })
  .readout.stat("gapStat", { source: "leadGap", unit: " 票", caption: "1位vs 2位", label: "差" })
  .phase("p1", {
    duration: 1800,
    title: "投票開始",
    body: "PM中野様がQ3 featureポーリング を アプリ 内でスタート、 4 option提示。 participation 0 → 5 tween、 totalVotes 0 → 120 tween、 leadGap 0 → 8 tween、 PM + アプリlane有効。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "pm-dashboard", "dashboard-app").tween("participation", 0, 5).tween("totalVotes", 0, 120).tween("leadGap", 0, 8).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "拡散(email告知)",
    body: "既存8500ユーザーへ告知メール送信、 参加率上昇。 participation 5 → 25 tween、 totalVotes 120 → 850 tween (countup加速)、 leadGap 8 → 22 tween (Dark modeリード拡大)、 メール + users lane activate。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users", "pm-dashboard", "dashboard-app", "app-email", "email-users").tween("participation", 5, 25).tween("totalVotes", 120, 850).tween("leadGap", 8, 22).badge("拡散"))
  .phase("p3", {
    duration: 2400,
    title: "中間集計",
    body: "1週間経過、 3000票達成。 participation 25 → 45 tween、 totalVotes 850 → 2400 tween、 leadGap 22 → 45 tween (Dark mode圧倒的リード)、 DB lane activate、 集計 ダッシュボード に速報。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users", "db", "pm-dashboard", "dashboard-app", "app-email", "email-users", "users-db", "db-dashboard").tween("participation", 25, 45).tween("totalVotes", 850, 2400).tween("leadGap", 22, 45).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "最終集計(winner確定)",
    body: "2週後 ポーリング 終了、 Dark modeがwinner。 participation 45 → 68 tween (ゲージ 針最上位)、 totalVotes 2400 → 5780 tween (最終)、 leadGap 45 → 63 tween (Dark 42% vs 2位28%)、 6 shape全active、 Q3開発優先度確定。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users", "db", "pm-dashboard", "dashboard-app", "app-email", "email-users", "users-db", "db-dashboard").tween("participation", 45, 68).tween("totalVotes", 2400, 5780).tween("leadGap", 45, 63).badge("確定"))
  .build();

/**
 * 83. reviewerStack v2 = 大規模 PR (500 行変更) の code review 依頼シナリオ、 shape-person + shape-website (GitHub) + shape-cloud (notif) + shape-mobile-device + shape-server-rack + shape-cylinder の 6 shape で visual scene 化、 4 phase (PR open → reviewer 依頼 → review 進行 → approve merge) + 4 readout (userStack / gauge review 完了率 / countup 累計コメント数 / stat approve 数) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const reviewerStack = diagram("interactive-reviewer-stack", {
  topic: "大規模 PR code review 依頼シナリオ = 4 phase (PR open → 依頼 → review → merge) の flow を shape-* primitive 6 種で表現 + 4 readout (userStack / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("author", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("reviewers", { x: 580, width: 260 })
  .arraySignal("reviewers", ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"])
  .state("completionRate", { initial: 0 })
  .state("commentCount", { initial: 0 })
  .state("approveCount", { initial: 0 })
  .node("author", { lane: "author", stack: 0, kind: "shape-person", title: "PR author高橋様", eyebrow: "author", subtitle: "500行変更 · feature/チェックアウト-v2" })
  .node("laptop", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "GitHubモバイル", eyebrow: "端末", subtitle: "PR状態確認 + 返信" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHubのPRページ", eyebrow: "vcs", subtitle: "PR #1247 · 7レビュアー 割当" })
  .node("api", { lane: "system", stack: 1, kind: "shape-server-rack", title: "GitHub API", eyebrow: "バックエンド", subtitle: "レビュー event処理" })
  .node("db", { lane: "system", stack: 2, kind: "shape-cylinder", title: "レビュー DB", eyebrow: "データベース", subtitle: "コメント + approve記録" })
  .node("notif", { lane: "reviewers", stack: 0, kind: "shape-cloud", title: "Slack #チーム-eng", eyebrow: "通知", subtitle: "7レビュアー へのPR通知" })
  .edge("author", "laptop", { label: "PR開く", tone: "info" })
  .edge("laptop", "github", { label: "投稿 /pulls", tone: "info" })
  .edge("github", "api", { label: "Webhook", tone: "success" })
  .edge("api", "notif", { label: "レビュアー 通知", tone: "warning" })
  .edge("notif", "db", { label: "レビュー 提出", tone: "success" })
  .edge("db", "github", { label: "状態更新", tone: "accent" })
  .readout.userStack("us", { source: "reviewers", max: 5, size: 40, label: "レビュアー 7名(5表示 + +2 overflow)" })
  .readout.gauge("compG", { source: "completionRate", min: 0, max: 100, color: "#22c55e", label: "レビュー 完了率 %" })
  .readout.countup("commCU", { source: "commentCount", unit: " 件", label: "累計コメント", decimals: 0 })
  .readout.stat("approveStat", { source: "approveCount", unit: "/7", caption: "承認 数", label: "承認" })
  .phase("p1", {
    duration: 1800,
    title: "PR開く",
    body: "高橋様がfeature/チェックアウト-v2のPR開く、 500行変更。 completionRate 0 (ゲージ 針最下)、 commentCount 0、 approveCount 0、 userStackで7名列挙。 author lane有効。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "author-laptop").set("completionRate", 0).set("commentCount", 0).set("approveCount", 0).badge("PR open"))
  .phase("p2", {
    duration: 2200,
    title: "レビュアー 依頼",
    body: "GitHubが7レビュアー 割当、 Slackで通知。 completionRate 0 → 15 tween、 commentCount 0 → 5 tween (初期質問)、 approveCount 0、 github + API + 通知lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif", "author-laptop", "laptop-github", "github-api", "api-notif").tween("completionRate", 0, 15).tween("commentCount", 0, 5).badge("依頼"))
  .phase("p3", {
    duration: 2400,
    title: "review進行",
    body: "Alice + Bob + Carolが詳細 レビュー、 Dan/Eveが軽 レビュー。 completionRate 15 → 70 tween (ゲージ 針が緑域中位まで急上昇)、 commentCount 5 → 42 tween (countup加速 = 白熱討議)、 approveCount 0 → 3 tween (stat 3名承認)、 DB lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif", "db", "author-laptop", "laptop-github", "github-api", "api-notif", "notif-db", "db-github").tween("completionRate", 15, 70).tween("commentCount", 5, 42).tween("approveCount", 0, 3).badge("review"))
  .phase("p4", {
    duration: 2000,
    title: "承認 + マージ",
    body: "残Frank + Grace + Eveも 承認、 全7名 署名-オフ でmainマージ。 completionRate 70 → 100 tween (ゲージ 最上位)、 commentCount 42 → 58 tween (最終rollup)、 approveCount 3 → 7 tween (stat満点)、 6 shape全active、 PRマージd到達。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif", "db", "author-laptop", "laptop-github", "github-api", "api-notif", "notif-db", "db-github").tween("completionRate", 70, 100).tween("commentCount", 42, 58).tween("approveCount", 3, 7).badge("merge"))
  .build();

/**
 * 84. gitCommitList v2 = OSS プロジェクト 週次リリース 直前の commit review 4 phase シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-hexagon の 6 shape で visual scene 化、 4 phase (週初 commit 発生 → 中盤集約 → release 直前 review → tag 発行) + 4 readout (commitList / gauge リリース準備度 / countup commit 数 / stat contributor 数) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const gitCommitList = diagram("interactive-git-commits", {
  topic: "OSSの週次リリースコミットレビューで発生から集約、レビュー、タグ付けまで",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("release", { x: 580, width: 220 })
  .arraySignal("commits", [
    ["a1b2c3d", "feat: add sankey primitive", "Alice"],
    ["e5f6g7h", "fix: circular gauge angle bug", "Bob"],
    ["i9j0k1l", "docs: update SKILL.md", "Carol"],
    ["m3n4o5p", "refactor: extract widget dispatcher", "Dan"],
    ["q7r8s9t", "test: add builder chain coverage", "Eve"],
  ] as unknown as (string | number)[])
  .state("readiness", { initial: 0 })
  .state("commitCount", { initial: 0 })
  .state("contributors", { initial: 0 })
  .node("maintainer", { lane: "dev", stack: 0, kind: "shape-person", title: "maintainer田村様", eyebrow: "lead", subtitle: "週次release責任者" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "GitHub CLI", eyebrow: "端末", subtitle: "gh PR一覧 + レビュー" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHubリポジトリ", eyebrow: "vcs", subtitle: "PR一覧 + commit履歴" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI (Actions)", eyebrow: "ビルド", subtitle: "全PRでverify chain実行" })
  .node("log", { lane: "system", stack: 2, kind: "shape-cylinder", title: "commitログDB", eyebrow: "保存", subtitle: "conventional commits分類" })
  .node("release", { lane: "release", stack: 0, kind: "shape-hexagon", title: "リリース タグ", eyebrow: "マイルストーン", subtitle: "v0.42.0 tag発行" })
  .edge("maintainer", "laptop", { label: "レビュー", tone: "info" })
  .edge("laptop", "github", { label: "gh PR", tone: "info" })
  .edge("github", "ci", { label: "起動", tone: "success" })
  .edge("ci", "log", { label: "分類記録", tone: "accent" })
  .edge("log", "release", { label: "changelog生成", tone: "warning" })
  .readout.commitList("cl", { source: "commits", max: 5, color: "#2563eb", label: "recentコミット5件" })
  .readout.gauge("readyG", { source: "readiness", min: 0, max: 100, color: "#22c55e", label: "リリース 準備度 %" })
  .readout.countup("commCU", { source: "commitCount", unit: " 件", label: "本週 コミット 数", decimals: 0 })
  .readout.stat("contribStat", { source: "contributors", unit: " 名", caption: "contributor数", label: "貢献" })
  .phase("p1", {
    duration: 1800,
    title: "週初commit発生(月)",
    body: "月曜8名のcontributorがfeat / fixコミット を プッシュ。 readiness 0 → 20 tween、 commitCount 0 → 12 tween (countup加算)、 contributors 0 → 4 tween、 開発 + github lane有効。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "maintainer-laptop", "laptop-github").tween("readiness", 0, 20).tween("commitCount", 0, 12).tween("contributors", 0, 4).badge("週初"))
  .phase("p2", {
    duration: 2200,
    title: "中盤集約 (水)",
    body: "水曜CIが全PR検証chain実行、 リベース + squash完了。 readiness 20 → 55 tween、 commitCount 12 → 28 tween、 contributors 4 → 7 tween、 ci lane activate、 テスト + docsコミット 集約。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci", "maintainer-laptop", "laptop-github", "github-ci").tween("readiness", 20, 55).tween("commitCount", 12, 28).tween("contributors", 4, 7).badge("集約"))
  .phase("p3", {
    duration: 2400,
    title: "release直前review (金)",
    body: "田村様が5 recentコミット をconventionalコミット 分類、 changelog draft生成。 readiness 55 → 85 tween、 commitCount 28 → 42 tween、 contributors 7 → 8 tween、 ログlane activate、 feat/fix/docs/refactor/テスト の5分類確定。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci", "log", "maintainer-laptop", "laptop-github", "github-ci", "ci-log").tween("readiness", 55, 85).tween("commitCount", 28, 42).tween("contributors", 7, 8).badge("review"))
  .phase("p4", {
    duration: 2000,
    title: "tag発行(金曜夜)",
    body: "全 検証 通過 → v0.42.0タグ 発行 + リリースnote公開。 readiness 85 → 100 tween (ゲージ 針最上位、 リリースready)、 commitCount 42 → 45 tween (最終)、 contributors 8 → 8保持、 リリースlane activate、 6 shape全active、 週次 リリース 完遂。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci", "log", "release", "maintainer-laptop", "laptop-github", "github-ci", "ci-log", "log-release").tween("readiness", 85, 100).tween("commitCount", 42, 45).badge("tag"))
  .build();

/**
 * 85. audioPlayer v2 = ポッドキャスト リスナーの朝の通勤時間 4 phase 聴取シナリオ (播放 → CM insert → skip → 完聴)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-warehouse + shape-hexagon の 6 shape で visual scene 化、 4 phase (再生開始 → CM 挿入 → 続き再生 → 完聴保存) + 4 readout (mediaPlayer / gauge 再生進捗 / countup total minutes / stat skip 数) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "ポッドキャストの通勤聴取で再生から広告、スキップ、完聴まで",
})
  .lane("listener", { x: 0, width: 220 })
  .lane("platform", { x: 240, width: 320 })
  .lane("data", { x: 580, width: 220 })
  .state("current", { initial: 0 })
  .state("duration", { initial: 240 })
  .state("playing", { initial: "true" })
  .state("progressPct", { initial: 0 })
  .state("totalMin", { initial: 4820 })
  .state("skipCount", { initial: 0 })
  .node("listener", { lane: "listener", stack: 0, kind: "shape-person", title: "リスナー 齋藤様", eyebrow: "利用者", subtitle: "朝の通勤中に聴取" })
  .node("phone", { lane: "listener", stack: 1, kind: "shape-mobile-device", title: "iPhone Spotify", eyebrow: "端末", subtitle: "streaming + offline" })
  .node("spotify", { lane: "platform", stack: 0, kind: "shape-cloud", title: "Spotifyサービス", eyebrow: "streaming", subtitle: "ポッドキャストcatalog + プレイヤー API" })
  .node("cdn", { lane: "platform", stack: 1, kind: "shape-server-rack", title: "audio CDN", eyebrow: "CDN", subtitle: "AAC 128k stream配信" })
  .node("adNet", { lane: "platform", stack: 2, kind: "shape-warehouse", title: "広告network", eyebrow: "ad", subtitle: "dynamic CM挿入 · 30s spot" })
  .node("analytics", { lane: "data", stack: 0, kind: "shape-hexagon", title: "リスナー 分析", eyebrow: "追跡", subtitle: "再生履歴 + skip集計" })
  .edge("listener", "phone", { label: "操作", tone: "info" })
  .edge("phone", "spotify", { label: "取得 ストリーム", tone: "info" })
  .edge("spotify", "cdn", { label: "audio配信", tone: "success" })
  .edge("spotify", "adNet", { label: "CM要求", tone: "warning" })
  .edge("adNet", "cdn", { label: "CM挿入", tone: "warning" })
  .edge("cdn", "phone", { label: "audioストリーム", tone: "success" })
  .edge("phone", "analytics", { label: "イベント 送信", tone: "accent" })
  .readout.mediaPlayer("mp", { source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 340, label: "ポッドキャスト プレイヤー" })
  .readout.gauge("progG", { source: "progressPct", min: 0, max: 100, color: "#22c55e", label: "再生進捗 %" })
  .readout.countup("minCU", { source: "totalMin", unit: " 分", label: "累計聴取時間", decimals: 0 })
  .readout.stat("skipStat", { source: "skipCount", unit: " 回", caption: "本 エピソードskip", label: "スキップ" })
  .phase("p1", {
    duration: 1800,
    title: "再生開始(0-60s)",
    body: "齋藤様がiPhoneで4分の ポッドキャスト エピソード 再生開始。 current 0 → 60 tween、 progressPct 0 → 25 tween (ゲージ 針上昇)、 totalMin 4820 → 4821 tween (countup加算)、 skipCount 0、 リスナー + スマホ + spotify + CDN lane有効。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "listener-phone", "phone-spotify", "spotify-cdn", "cdn-phone").set("playing", "true").tween("current", 0, 60).tween("progressPct", 0, 25).tween("totalMin", 4820, 4821).badge("再生"))
  .phase("p2", {
    duration: 2200,
    title: "CM挿入(60-90s)",
    body: "60sでdynamic CM 30s挿入、 リスナー やや不快。 current 60 → 90 tween、 progressPct 25 → 37 tween (CM部分含む)、 totalMin 4821保持、 skipCount 0、 adNet lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet", "listener-phone", "phone-spotify", "spotify-cdn", "spotify-adNet", "adNet-cdn", "cdn-phone").tween("current", 60, 90).tween("progressPct", 25, 37).badge("CM"))
  .phase("p3", {
    duration: 2400,
    title: "続き再生 + スキップ(90-180s)",
    body: "CM終了 → 本編再開、 途中で興味薄い部分15sスキップ。 current 90 → 180 tween、 progressPct 37 → 75 tween、 totalMin 4821 → 4823 tween (2最小 追加)、 skipCount 0 → 1 tween (stat加算)、 分析lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet", "analytics", "listener-phone", "phone-spotify", "spotify-cdn", "spotify-adNet", "adNet-cdn", "cdn-phone", "phone-analytics").tween("current", 90, 180).tween("progressPct", 37, 75).tween("totalMin", 4821, 4823).tween("skipCount", 0, 1).badge("skip"))
  .phase("p4", {
    duration: 2000,
    title: "完聴(180-240s)",
    body: "残60s完聴、 エピソード 完了でlock screen通知。 current 180 → 240 tween (mediaPlayer 100%)、 progressPct 75 → 100 tween (ゲージ 針最上位)、 playing = '偽' (再生停止)、 totalMin 4823 → 4824 tween (最終)、 skipCount 1保持、 6 shape全active、 完聴 イベント 記録。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet", "analytics", "listener-phone", "phone-spotify", "spotify-cdn", "spotify-adNet", "adNet-cdn", "cdn-phone", "phone-analytics").set("playing", "false").tween("current", 180, 240).tween("progressPct", 75, 100).tween("totalMin", 4823, 4824).badge("完聴"))
  .build();

/**
 * 86. serverEventLog v2 = production API サーバの朝ピーク時 incident 検知 4 phase シナリオ、 shape-server-rack + shape-cylinder + shape-iot-sensor + shape-cloud + shape-mobile-device + shape-person の 6 shape で visual scene 化、 4 phase (通常運転 → CPU 上昇 → DB エラー → 復旧) + 4 readout (eventLog / gauge severity / countup error 件数 / stat p99 latency) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const serverEventLog = diagram("interactive-server-event-log", {
  topic: "朝ピークのインシデント検知、通常からCPU上昇、DBエラー、復旧まで",
})
  .lane("infra", { x: 0, width: 280 })
  .lane("stream", { x: 300, width: 300 })
  .lane("oncall", { x: 620, width: 220 })
  .arraySignal("events", [
    ["10:23:45", "info", "Server started on port 3000"],
    ["10:24:12", "debug", "Loaded config from ~/.env"],
    ["10:24:58", "warn", "High CPU usage: 82%"],
    ["10:25:34", "error", "DB connection timeout after 5s"],
    ["10:26:01", "info", "Retry connection succeeded"],
  ] as unknown as (string | number)[])
  .state("severity", { initial: 0 })
  .state("errorCount", { initial: 0 })
  .state("p99Ms", { initial: 50 })
  .node("api", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "APIサーバー (本番-API-3)", eyebrow: "計算", subtitle: "Node.js 18 · 8 core · 32GB" })
  .node("db", { lane: "infra", stack: 1, kind: "shape-cylinder", title: "PostgreSQL", eyebrow: "データベース", subtitle: "プライマリ + 2レプリカ" })
  .node("sensor", { lane: "infra", stack: 2, kind: "shape-iot-sensor", title: "監視agent", eyebrow: "monitoring", subtitle: "1s scrape指標 + ログtail" })
  .node("logStream", { lane: "stream", stack: 0, kind: "shape-cloud", title: "ログ 集約器", eyebrow: "aggregation", subtitle: "Elasticsearch + Kibana" })
  .node("oncallDevice", { lane: "oncall", stack: 0, kind: "shape-mobile-device", title: "オン-callスマホ", eyebrow: "端末", subtitle: "PagerDuty push通知" })
  .node("engineer", { lane: "oncall", stack: 1, kind: "shape-person", title: "オン-call高橋様", eyebrow: "SRE", subtitle: "本番incident応答" })
  .edge("api", "sensor", { label: "公開", tone: "info" })
  .edge("db", "sensor", { label: "公開", tone: "info" })
  .edge("sensor", "logStream", { label: "ログ 送信", tone: "success" })
  .edge("logStream", "oncallDevice", { label: "アラート プッシュ", tone: "error" })
  .edge("oncallDevice", "engineer", { label: "通知", tone: "warning" })
  .readout.eventLog("el", { source: "events", max: 10, label: "recent events (5件)" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 100, color: "#ef4444", label: "システム 深刻度" })
  .readout.countup("errCU", { source: "errorCount", unit: " 件", label: "エラー イベント 累計", decimals: 0 })
  .readout.stat("p99Stat", { source: "p99Ms", unit: " ミリ秒", caption: "p99 latency", label: "p99" })
  .phase("p1", {
    duration: 1800,
    title: "通常運転",
    body: "朝10:23 APIサーバー 起動、 通常負荷。 深刻度0 → 10 tween、 errorCount 0、 p99Ms 50 tween保持、 eventLogに 情報 + デバッグ 表示。 infra lane有効。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "api-sensor", "db-sensor").tween("severity", 0, 10).set("p99Ms", 50).badge("通常"))
  .phase("p2", {
    duration: 2200,
    title: "CPU上昇(警告)",
    body: "朝ピーク10:24でリクエスト急増、 CPU 82% 到達。 深刻度10 → 45 tween (ゲージ 針が橙域上昇)、 errorCount 0 → 1 tween (最初の エラー は近い、 数 前提として1加算)、 p99Ms 50 → 180 tween (stat動的上昇)、 logStream lane activate。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream", "api-sensor", "db-sensor", "sensor-logStream").tween("severity", 10, 45).tween("errorCount", 0, 1).tween("p99Ms", 50, 180).badge("警告"))
  .phase("p3", {
    duration: 2400,
    title: "DBエラー",
    body: "10:25 DB connectionタイムアウト 発生、 エラー アラート 発火。 深刻度45 → 88 tween (ゲージ 針最上位近く、 重大)、 errorCount 1 → 5 tween (連続 エラー、 countup加速)、 p99Ms 180 → 420 tween (激しく上昇)、 oncallDevice + エンジニアlane activate、 オン-呼出 ページング。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream", "oncallDevice", "engineer", "api-sensor", "db-sensor", "sensor-logStream", "logStream-oncallDevice", "oncallDevice-engineer").tween("severity", 45, 88).tween("errorCount", 1, 5).tween("p99Ms", 180, 420).badge("DB error"))
  .phase("p4", {
    duration: 2000,
    title: "復旧",
    body: "10:26高橋様がDB pool size拡張 → 復旧、 再試行 成功 ログ。 深刻度88 → 20 tween (ゲージ 針が緑域に戻る)、 errorCount 5 → 5保持(resolved、 追加なし)、 p99Ms 420 → 80 tween (最終、 stat正常値)、 6 shape全active、 復旧完遂 ログ 記録。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream", "oncallDevice", "engineer", "api-sensor", "db-sensor", "sensor-logStream", "logStream-oncallDevice", "oncallDevice-engineer").tween("severity", 88, 20).tween("p99Ms", 420, 80).badge("復旧"))
  .build();

/**
 * 87. searchResults v2 = エンジニア技術調査 4 phase シナリオ (Rust 学習調査 → 絞込 → 深掘り → 実行)、 shape-person + shape-mobile-device + shape-website × 2 + shape-cloud + shape-hexagon の 6 shape で visual scene 化、 4 phase (初回検索 → 絞込 → 深掘り選定 → 実装着手) + 4 readout (searchResult / gauge 関連度 / countup query 数 / stat click 数) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const searchResults = diagram("interactive-search-results", {
  topic: "エンジニアの技術調査、初回検索から絞込、深掘り、実行まで",
})
  .lane("user", { x: 0, width: 220 })
  .lane("engine", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .arraySignal("hits", [
    ["Rust playground", "Interactive code sandbox for Rust programming language", "play.rust-lang.org"],
    ["MDN Web Docs", "Documentation for web technologies", "developer.mozilla.org"],
    ["TypeScript Handbook", "Official TS learning guide", "typescriptlang.org/docs"],
    ["React docs", "React reference documentation", "react.dev"],
    ["Vite guide", "Frontend build tool guide", "vitejs.dev"],
  ] as unknown as (string | number)[])
  .state("relevance", { initial: 0 })
  .state("queryCount", { initial: 0 })
  .state("clickCount", { initial: 0 })
  .node("engineer", { lane: "user", stack: 0, kind: "shape-person", title: "エンジニア 藤井様", eyebrow: "開発者", subtitle: "Rust新規学習開始" })
  .node("laptop", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "Chromeブラウザ", eyebrow: "端末", subtitle: "検索tab · 履歴保存" })
  .node("google", { lane: "engine", stack: 0, kind: "shape-website", title: "Google検索", eyebrow: "engine", subtitle: "Web検索 + snippet表示" })
  .node("index", { lane: "engine", stack: 1, kind: "shape-cloud", title: "検索 インデックス", eyebrow: "インデックス", subtitle: "billions経路crawl + 順位" })
  .node("docSite", { lane: "engine", stack: 2, kind: "shape-website", title: "MDN / Rust docs", eyebrow: "reference", subtitle: "公式docサイト 群" })
  .node("playground", { lane: "outcome", stack: 0, kind: "shape-hexagon", title: "Rust playground", eyebrow: "サンドボックス", subtitle: "実装 + 実行 · online IDE" })
  .edge("engineer", "laptop", { label: "検索", tone: "info" })
  .edge("laptop", "google", { label: "取得 /検索", tone: "info" })
  .edge("google", "index", { label: "クエリ", tone: "success" })
  .edge("index", "google", { label: "結果", tone: "success" })
  .edge("google", "docSite", { label: "クリック", tone: "accent" })
  .edge("docSite", "playground", { label: "試行", tone: "warning" })
  .readout.searchResult("sr", { source: "hits", max: 5, color: "#2563eb", label: "検索結果5ヒット" })
  .readout.gauge("relG", { source: "relevance", min: 0, max: 100, color: "#22c55e", label: "関連度 %" })
  .readout.countup("qryCU", { source: "queryCount", unit: " 回", label: "累計 クエリ", decimals: 0 })
  .readout.stat("clickStat", { source: "clickCount", unit: " 件", caption: "クリック 数", label: "クリック" })
  .phase("p1", {
    duration: 1800,
    title: "初回検索",
    body: "藤井様が 'Rust tutorial' で検索、 5 hit表示。 relevance 0 → 40 tween、 queryCount 0 → 1 tween、 clickCount 0、 利用者 + google + インデックスlane有効。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "engineer-laptop", "laptop-google", "google-index", "index-google").tween("relevance", 0, 40).tween("queryCount", 0, 1).badge("初回"))
  .phase("p2", {
    duration: 2200,
    title: "絞込(2回目query)",
    body: "'Rust ownership tutorial' で絞込、 関連度上昇。 relevance 40 → 68 tween、 queryCount 1 → 3 tween、 clickCount 0 → 2 tween (docs 2 hitクリック)、 docSite lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite", "engineer-laptop", "laptop-google", "google-index", "index-google", "google-docSite").tween("relevance", 40, 68).tween("queryCount", 1, 3).tween("clickCount", 0, 2).badge("絞込"))
  .phase("p3", {
    duration: 2200,
    title: "深掘り選定",
    body: "MDN + Rust docsでownership概念習得、 更に 詳細 確認。 relevance 68 → 85 tween (ゲージ 針最上位近く)、 queryCount 3 → 5 tween、 clickCount 2 → 4 tween、 docSiteで深く閲覧。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite", "engineer-laptop", "laptop-google", "google-index", "index-google", "google-docSite").tween("relevance", 68, 85).tween("queryCount", 3, 5).tween("clickCount", 2, 4).badge("深掘り"))
  .phase("p4", {
    duration: 2000,
    title: "実装着手(playground)",
    body: "Rust playgroundでownership sample実装、 動作確認。 relevance 85 → 92 tween (最終、 ゲージ 針最上位)、 queryCount 5 → 6 tween、 clickCount 4 → 5 tween、 playground lane activate、 6 shape全active、 学習loop完成。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite", "playground", "engineer-laptop", "laptop-google", "google-index", "index-google", "google-docSite", "docSite-playground").tween("relevance", 85, 92).tween("queryCount", 5, 6).tween("clickCount", 4, 5).badge("実装"))
  .build();

/**
 * 88. yearRoadmap v2 = スタートアップ CEO の 2026 年 4 phase 事業展開シナリオ (Q1 設計 → Q2 β → Q3 拡大 → Q4 GA + Series A)、 shape-person + shape-mobile-device + shape-brokerage + shape-online-shop + shape-warehouse + shape-cloud の 6 shape で visual scene 化、 4 phase (Q1 → Q2 → Q3 → Q4) + 4 readout (roadmap / gauge 進捗率 / countup 累計 MRR / stat funding 額) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const yearRoadmap = diagram("interactive-year-roadmap", {
  topic: "スタートアップの2026年事業展開計画、Q1からQ4までのロードマップ",
})
  .lane("ceo", { x: 0, width: 220 })
  .lane("execution", { x: 240, width: 340 })
  .lane("outcome", { x: 600, width: 240 })
  .arraySignal("plan", [
    ["Q1", ["Design system", "MVP feature A"]],
    ["Q2", ["Beta launch", "Feature B", "Feedback loop"]],
    ["Q3", ["Scale infra", "Enterprise deals"]],
    ["Q4", ["Public GA", "Series A"]],
  ] as unknown as (string | number)[])
  .state("progress", { initial: 0 })
  .state("mrrK", { initial: 0 })
  .state("fundingM", { initial: 0 })
  .node("ceo", { lane: "ceo", stack: 0, kind: "shape-person", title: "CEO神谷様", eyebrow: "創業者", subtitle: "SaaSスタートアップ創業者" })
  .node("laptop", { lane: "ceo", stack: 1, kind: "shape-mobile-device", title: "OKRダッシュボード", eyebrow: "端末", subtitle: "四半期milestone追跡" })
  .node("product", { lane: "execution", stack: 0, kind: "shape-online-shop", title: "SaaS商品", eyebrow: "商品", subtitle: "MVP → Beta → GAへ進化" })
  .node("customers", { lane: "execution", stack: 1, kind: "shape-warehouse", title: "顧客基盤", eyebrow: "customers", subtitle: "MVP 10名 → GA 500名" })
  .node("infra", { lane: "execution", stack: 2, kind: "shape-cloud", title: "cloud infra", eyebrow: "infra", subtitle: "AWS · 拡大-up段階" })
  .node("investors", { lane: "outcome", stack: 0, kind: "shape-brokerage", title: "VC投資家", eyebrow: "capital", subtitle: "Seed → Series Aへ" })
  .edge("ceo", "laptop", { label: "OKR", tone: "info" })
  .edge("laptop", "product", { label: "実装指示", tone: "info" })
  .edge("product", "customers", { label: "販売", tone: "success" })
  .edge("customers", "infra", { label: "負荷増", tone: "warning" })
  .edge("customers", "investors", { label: "traction実績", tone: "success" })
  .edge("investors", "ceo", { label: "資金", tone: "accent" })
  .readout.roadmap("rm", { source: "plan", viewW: 420, viewH: 220, label: "2026年 ロードマップ" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "年間進捗率 %" })
  .readout.countup("mrrCU", { source: "mrrK", unit: "k$ MRR", label: "月次売上", decimals: 0 })
  .readout.stat("fundStat", { source: "fundingM", unit: " M$", caption: "累計調達額", label: "資金" })
  .phase("p1", {
    duration: 2000,
    title: "Q1 (1-3月) Design + MVP",
    body: "神谷様がQ1にdesign system + MVP feature A実装。 進捗0 → 25 tween、 mrrK 0 → 5 tween (α 顧客数名)、 fundingM 0 → 2 tween (Seed 200万$)、 CEO + 商品lane有効。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "ceo-laptop", "laptop-product").tween("progress", 0, 25).tween("mrrK", 0, 5).tween("fundingM", 0, 2).badge("Q1"))
  .phase("p2", {
    duration: 2200,
    title: "Q2 (4-6月) Beta launch",
    body: "Q2にpublic beta launch、 feature B追加、 feedback loop確立。 進捗25 → 50 tween、 mrrK 5 → 25 tween (countup加速)、 fundingM 2保持、 customers lane activate、 β 利用者50名獲得。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers", "ceo-laptop", "laptop-product", "product-customers").tween("progress", 25, 50).tween("mrrK", 5, 25).badge("Q2"))
  .phase("p3", {
    duration: 2200,
    title: "Q3 (7-9月)拡大 + Enterprise",
    body: "infra拡張 + B2B enterprise deals。 進捗50 → 75 tween、 mrrK 25 → 80 tween (enterpriseで急増)、 fundingM 2保持、 infra lane activate、 顧客200名到達。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers", "infra", "ceo-laptop", "laptop-product", "product-customers", "customers-infra").tween("progress", 50, 75).tween("mrrK", 25, 80).badge("Q3"))
  .phase("p4", {
    duration: 2000,
    title: "Q4 (10-12月) GA + Series A",
    body: "public GAリリース + Series A調達15M$。 進捗75 → 100 tween (ゲージ 針最上位)、 mrrK 80 → 150 tween (最終、 countup最大)、 fundingM 2 → 17 tween (stat大幅増、 Series A 15M$ 追加)、 investors lane activate、 6 shape全active、 事業展開完遂。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers", "infra", "investors", "ceo-laptop", "laptop-product", "product-customers", "customers-infra", "customers-investors", "investors-ceo").tween("progress", 75, 100).tween("mrrK", 80, 150).tween("fundingM", 2, 17).badge("Q4"))
  .build();

/**
 * 89. weekWeather v2 = 屋外イベント運営者の週次天気モニター判断シナリオ (週初め予測 → 悪化 → 中止判断 → 再開)、 shape-person + shape-mobile-device + shape-satellite + shape-cloud + shape-website + shape-warehouse の 6 shape で visual scene 化、 4 phase (週初 予測 → 週半ば悪化 → 木曜中止判断 → 金曜再開) + 4 readout (weatherForecast / gauge 降水確率 / countup 参加者予定 / stat 気温平均) が tween で visually 連続変化。 iteration 8 wave 8-E redesign。
 */
export const weekWeather = diagram("interactive-week-weather", {
  topic: "屋外イベントの週次天気モニター、予測から悪化、中止、再開まで",
})
  .lane("organizer", { x: 0, width: 220 })
  .lane("data", { x: 240, width: 320 })
  .lane("venue", { x: 580, width: 220 })
  .arraySignal("forecast", [
    ["Mon", "☀", 24, 18],
    ["Tue", "☁", 22, 17],
    ["Wed", "☂", 19, 15],
    ["Thu", "⚡", 17, 13],
    ["Fri", "☀", 25, 19],
  ] as unknown as (string | number)[])
  .state("rainPct", { initial: 20 })
  .state("attendees", { initial: 0 })
  .state("avgTemp", { initial: 21 })
  .node("organizer", { lane: "organizer", stack: 0, kind: "shape-person", title: "運営 木村様", eyebrow: "planner", subtitle: "屋外音楽fes主催者" })
  .node("mobile", { lane: "organizer", stack: 1, kind: "shape-mobile-device", title: "天気 アプリ", eyebrow: "端末", subtitle: "気象庁API + 予測push" })
  .node("satellite", { lane: "data", stack: 0, kind: "shape-satellite", title: "気象衛星", eyebrow: "satellite", subtitle: "MTSAT · 10分間隔観測" })
  .node("jma", { lane: "data", stack: 1, kind: "shape-cloud", title: "気象庁API", eyebrow: "提供者", subtitle: "週間予報 · 降水確率" })
  .node("eventSite", { lane: "data", stack: 2, kind: "shape-website", title: "event予約サイト", eyebrow: "Web", subtitle: "オンライン申込 · キャンセル対応" })
  .node("venue", { lane: "venue", stack: 0, kind: "shape-warehouse", title: "会場 (代々木公園)", eyebrow: "physical", subtitle: "屋外野外広場 · 5000 名収容" })
  .edge("organizer", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "jma", { label: "取得forecast", tone: "info" })
  .edge("satellite", "jma", { label: "観測data", tone: "success" })
  .edge("jma", "eventSite", { label: "予報反映", tone: "accent" })
  .edge("eventSite", "venue", { label: "運営指示", tone: "warning" })
  .readout.weatherForecast("wf", { source: "forecast", label: "5 日予報" })
  .readout.gauge("rainG", { source: "rainPct", min: 0, max: 100, color: "#2563eb", label: "降水確率 %" })
  .readout.countup("attCU", { source: "attendees", unit: " 名", label: "参加予定者", decimals: 0 })
  .readout.stat("tempStat", { source: "avgTemp", unit: " °C", caption: "週間平均気温", label: "平均" })
  .phase("p1", {
    duration: 1800,
    title: "週初 予測",
    body: "月曜朝、 木村様が週間予報確認(Mon晴 → Fri晴)。 rainPct 20 (ゲージ 針最下)、 attendees 0 → 3200 tween (申込加速)、 avgTemp 21 → 21保持、 主催 + モバイルlane有効。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "organizer-mobile").set("rainPct", 20).tween("attendees", 0, 3200).badge("週初"))
  .phase("p2", {
    duration: 2200,
    title: "水曜悪化 (雨予報)",
    body: "気象衛星から雨雲接近detect、 週末雨予報。 rainPct 20 → 65 tween (ゲージ 針急上昇 = 高降水確率)、 attendees 3200 → 3800 tween (継続申込)、 avgTemp 21 → 19 tween、 satellite + jma lane activate。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma", "organizer-mobile", "mobile-jma", "satellite-jma").tween("rainPct", 20, 65).tween("attendees", 3200, 3800).tween("avgTemp", 21, 19).badge("悪化"))
  .phase("p3", {
    duration: 2400,
    title: "木曜中止判断 (雷雨)",
    body: "木曜 ⚡ 雷雨予報、 イベント 中止判断 → 予約サイトで告知。 rainPct 65 → 90 tween (ゲージ 針最上位、 危険)、 attendees 3800 → 2100 tween (半数キャンセル)、 avgTemp 19 → 15 tween、 eventSite lane activate、 全員へ返金 処理。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma", "eventSite", "organizer-mobile", "mobile-jma", "satellite-jma", "jma-eventSite").tween("rainPct", 65, 90).tween("attendees", 3800, 2100).tween("avgTemp", 19, 15).badge("中止"))
  .phase("p4", {
    duration: 2000,
    title: "金曜再開 (晴)",
    body: "金曜朝 ☀ 晴予報、 短縮版 イベント 再開(規模半減)。 rainPct 90 → 15 tween (ゲージ 針急降下)、 attendees 2100 → 2400 tween (前日walk-内 追加)、 avgTemp 15 → 22 tween、 venue lane activate、 6 shape全active、 イベント 再稼働。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma", "eventSite", "venue", "organizer-mobile", "mobile-jma", "satellite-jma", "jma-eventSite", "eventSite-venue").tween("rainPct", 90, 15).tween("attendees", 2100, 2400).tween("avgTemp", 15, 22).badge("再開"))
  .build();

/**
 * 90. tutorialVideoCards v2 = YouTube educational クリエイター 4 phase 動画公開シナリオ (企画 → 撮影 → 公開 → viral)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-warehouse の 6 shape で visual scene 化、 4 phase (企画 → 撮影編集 → 公開 → viral 拡散) + 4 readout (videoCard / gauge CTR / countup views / stat sub 増数) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const tutorialVideoCards = diagram("interactive-tutorial-videos", {
  topic: "YouTube教育クリエイターの動画公開、企画から撮影、公開、バズまで",
})
  .lane("creator", { x: 0, width: 220 })
  .lane("platform", { x: 240, width: 320 })
  .lane("audience", { x: 580, width: 240 })
  .arraySignal("videos", [
    ["🎬", "Rust intro for beginners", "12:45", "24k"],
    ["🎥", "TypeScript deep dive", "45:20", "82k"],
    ["📺", "React hooks explained", "18:30", "156k"],
  ] as unknown as (string | number)[])
  .state("ctr", { initial: 0 })
  .state("views", { initial: 0 })
  .state("subDelta", { initial: 0 })
  .node("creator", { lane: "creator", stack: 0, kind: "shape-person", title: "クリエイター 石田様", eyebrow: "youtuber", subtitle: "登録者32k · 週次投稿" })
  .node("phone", { lane: "creator", stack: 1, kind: "shape-mobile-device", title: "YouTube Studio", eyebrow: "端末", subtitle: "投稿 + 分析" })
  .node("youtube", { lane: "platform", stack: 0, kind: "shape-website", title: "YouTube platform", eyebrow: "配分", subtitle: "algorithm順位 + 推薦" })
  .node("cdn", { lane: "platform", stack: 1, kind: "shape-cloud", title: "動画CDN", eyebrow: "CDN", subtitle: "H.264/H.265配信 · 全世界edge" })
  .node("analytics", { lane: "platform", stack: 2, kind: "shape-cylinder", title: "YT分析", eyebrow: "データベース", subtitle: "impression + クリック + 監視time" })
  .node("viewers", { lane: "audience", stack: 0, kind: "shape-warehouse", title: "全世界視聴者", eyebrow: "観衆", subtitle: "Rust / TS / React学習者" })
  .edge("creator", "phone", { label: "アップロード", tone: "info" })
  .edge("phone", "youtube", { label: "発行", tone: "info" })
  .edge("youtube", "cdn", { label: "encode + 配信", tone: "success" })
  .edge("cdn", "viewers", { label: "ストリーム", tone: "success" })
  .edge("viewers", "analytics", { label: "イベント", tone: "accent" })
  .edge("analytics", "youtube", { label: "順位 反映", tone: "warning" })
  .readout.videoCard("vc", { source: "videos", max: 5, color: "#ef4444", label: "投稿動画 3 本" })
  .readout.gauge("ctrG", { source: "ctr", min: 0, max: 20, color: "#22c55e", label: "CTR %" })
  .readout.countup("viewCU", { source: "views", unit: " 表示", label: "動画views", decimals: 0 })
  .readout.stat("subStat", { source: "subDelta", unit: " 名", caption: "登録者増加", label: "購読 Δ" })
  .phase("p1", {
    duration: 1800,
    title: "企画",
    body: "石田様が 'React hooks explained' 動画企画、 台本作成。 CTR 0、 表示0、 subDelta 0、 creator + スマホlane有効。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "creator-phone").set("ctr", 0).set("views", 0).set("subDelta", 0).badge("企画"))
  .phase("p2", {
    duration: 2000,
    title: "撮影 + 編集",
    body: "18分の動画撮影 → 編集 → thumbnail作成。 CTR 0、 表示0、 subDelta 0保持、 フェーズ 進行のみ(公開前は数値0)。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "creator-phone").badge("撮影"))
  .phase("p3", {
    duration: 2200,
    title: "公開(24h)",
    body: "YouTubeに 発行、 推薦algorithmに載る。 CTR 0 → 8 tween (ゲージ 針中位)、 表示0 → 25000 tween (countup加速)、 subDelta 0 → 320 tween、 youtube + CDN + viewers lane activate。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "youtube", "cdn", "viewers", "creator-phone", "phone-youtube", "youtube-cdn", "cdn-viewers").tween("ctr", 0, 8).tween("views", 0, 25000).tween("subDelta", 0, 320).badge("公開"))
  .phase("p4", {
    duration: 2000,
    title: "viral拡散(1週間)",
    body: "trending入りでviews急増、 登録者急伸。 CTR 8 → 14 tween (ゲージ 針最上位近く、 高CTR)、 表示25000 → 156000 tween (countup dramatic)、 subDelta 320 → 1800 tween (1800名登録)、 分析lane activate、 6 shape全active、 viral到達。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "youtube", "cdn", "viewers", "analytics", "creator-phone", "phone-youtube", "youtube-cdn", "cdn-viewers", "viewers-analytics", "analytics-youtube").tween("ctr", 8, 14).tween("views", 25000, 156000).tween("subDelta", 320, 1800).badge("viral"))
  .build();

/**
 * 91. shippingOrderStatus v2 = EC 家具通販 (大型商品) の配送追跡 4 phase シナリオ (梱包 → 出荷 → 配達中 → 完了)、 shape-person + shape-mobile-device + shape-warehouse + shape-storefront + shape-satellite + shape-cloud の 6 shape で visual scene 化、 4 phase (梱包完了 → 出荷 → 配達中 → 配達完了) + 4 readout (orderStatus / gauge 進捗率 / countup 距離 km / stat ETA 分) が tween で visually 連続変化。 iteration 8 wave 8-E redesign。
 */
export const shippingOrderStatus = diagram("interactive-shipping-status", {
  topic: "EC家具の配送追跡、梱包から出荷、配達中、完了まで",
})
  .lane("origin", { x: 0, width: 240 })
  .lane("transit", { x: 260, width: 320 })
  .lane("destination", { x: 600, width: 240 })
  .arraySignal("steps", ["Packed", "Shipped", "Out for delivery", "Delivered"])
  .state("current", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("distanceKm", { initial: 0 })
  .state("etaMin", { initial: 0 })
  .node("warehouse", { lane: "origin", stack: 0, kind: "shape-warehouse", title: "配送 センター (川崎)", eyebrow: "origin", subtitle: "IKEA大型家具在庫" })
  .node("dispatcher", { lane: "origin", stack: 1, kind: "shape-mobile-device", title: "配送指示tablet", eyebrow: "端末", subtitle: "経路planner + 追跡" })
  .node("truck", { lane: "transit", stack: 0, kind: "shape-storefront", title: "配送トラック", eyebrow: "vehicle", subtitle: "経路: 川崎 → 世田谷(32 km)" })
  .node("gps", { lane: "transit", stack: 1, kind: "shape-satellite", title: "GPS追跡", eyebrow: "gps", subtitle: "1 分間隔位置更新" })
  .node("customerApp", { lane: "transit", stack: 2, kind: "shape-cloud", title: "顧客通知(行)", eyebrow: "通知", subtitle: "step遷移で自動通知" })
  .node("customer", { lane: "destination", stack: 0, kind: "shape-person", title: "顧客 中村様", eyebrow: "recipient", subtitle: "在宅受取 · サイン必要" })
  .edge("warehouse", "dispatcher", { label: "梱包完了", tone: "success" })
  .edge("dispatcher", "truck", { label: "読込", tone: "info" })
  .edge("truck", "gps", { label: "expose位置", tone: "success" })
  .edge("gps", "customerApp", { label: "位置 プッシュ", tone: "accent" })
  .edge("customerApp", "customer", { label: "到着通知", tone: "warning" })
  .edge("truck", "customer", { label: "配達", tone: "success" })
  .readout.orderStatus("os", { source: "current", stepsSource: "steps", color: "#2563eb", label: "配達 状態(4ステップ)" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "配達進捗 %" })
  .readout.countup("distCU", { source: "distanceKm", unit: " km", label: "走行距離", decimals: 1 })
  .readout.stat("etaStat", { source: "etaMin", unit: " 分", caption: "到着まで", label: "ETA" })
  .phase("p1", {
    duration: 1800,
    title: "梱包完了",
    body: "配送センターで大型家具(ソファ)梱包完了、 出荷準備。 current = 0 (Packed)、 進捗0 → 10 tween、 distanceKm 0 tween保持、 etaMin 0 → 90 tween (初期ETA表示)。 warehouse + dispatcher lane有効。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "warehouse-dispatcher").set("current", 0).tween("progress", 0, 10).tween("etaMin", 0, 90).badge("梱包"))
  .phase("p2", {
    duration: 2200,
    title: "出荷(truck積載)",
    body: "trucksが家具を積載 → 発車。 current 0 → 1 tween (Packed → Shipped)、 進捗10 → 35 tween (ゲージ 針中位)、 distanceKm 0 → 8 tween (発進8 km)、 etaMin 90 → 60 tween、 truck + gps lane activate。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps", "warehouse-dispatcher", "dispatcher-truck", "truck-gps").tween("current", 0, 1).tween("progress", 10, 35).tween("distanceKm", 0, 8).tween("etaMin", 90, 60).badge("出荷"))
  .phase("p3", {
    duration: 2400,
    title: "配達中",
    body: "首都高速経由で世田谷へ向かう。 current 1 → 2 tween (Shipped → 外for配達)、 進捗35 → 80 tween、 distanceKm 8 → 28 tween、 etaMin 60 → 12 tween (急接近)、 customerApp lane activateで「到着15分前通知」 プッシュ。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps", "customerApp", "warehouse-dispatcher", "dispatcher-truck", "truck-gps", "gps-customerApp").tween("current", 1, 2).tween("progress", 35, 80).tween("distanceKm", 8, 28).tween("etaMin", 60, 12).badge("配達中"))
  .phase("p4", {
    duration: 2000,
    title: "配達完了",
    body: "中村様宅到着、 玄関受取 + サイン。 current 2 → 3 tween (外for配達 → 配達済)、 進捗80 → 100 tween (最終)、 distanceKm 28 → 32 tween (最終)、 etaMin 12 → 0 tween、 顧客lane activate、 6 shape全active、 配達完了。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps", "customerApp", "customer", "warehouse-dispatcher", "dispatcher-truck", "truck-gps", "gps-customerApp", "customerApp-customer", "truck-customer").tween("current", 2, 3).tween("progress", 80, 100).tween("distanceKm", 28, 32).tween("etaMin", 12, 0).badge("完了"))
  .build();

/**
 * 92. teamAttendanceGrid v2 = リモートワークチーム週次出勤集計 シナリオ、 shape-person × 4 + shape-mobile-device + shape-server-rack の 6 shape で visual scene 化、 4 phase (月曜開始 → 中間確認 → 週末集計 → 給与連携) + 4 readout (attendanceGrid / gauge 出勤率 / countup 累計出勤日 / stat 皆勤者数) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const teamAttendanceGrid = diagram("interactive-team-attendance", {
  topic: "リモートチーム週次出勤集計 = 4 phase (月曜 → 中間 → 週末 → 給与連携) の flow を shape-* primitive 6 種で表現 + 4 readout (attendanceGrid / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("members", { x: 0, width: 240 })
  .lane("system", { x: 260, width: 260 })
  .lane("finance", { x: 540, width: 260 })
  .arraySignal("attendance", [
    ["Mon", true, true, false, true],
    ["Tue", true, false, true, true],
    ["Wed", true, true, true, true],
    ["Thu", false, true, true, true],
    ["Fri", true, true, false, true],
  ] as unknown as (string | number)[])
  .arraySignal("teamMembers", ["Alice", "Bob", "Carol", "Dan"])
  .state("rate", { initial: 0 })
  .state("totalDays", { initial: 0 })
  .state("perfectCount", { initial: 0 })
  .node("alice", { lane: "members", stack: 0, kind: "shape-person", title: "Alice (フロントエンド)", eyebrow: "メンバー", subtitle: "Tokyo · 4/5出勤(Thu休)" })
  .node("bob", { lane: "members", stack: 1, kind: "shape-person", title: "Bob (バックエンド)", eyebrow: "メンバー", subtitle: "Osaka · 4/5出勤(Tue休)" })
  .node("carol", { lane: "members", stack: 2, kind: "shape-person", title: "Carol (design)", eyebrow: "メンバー", subtitle: "Fukuoka · 3/5出勤(Mon/Fri休)" })
  .node("dan", { lane: "members", stack: 3, kind: "shape-person", title: "Dan (DevOps)", eyebrow: "メンバー", subtitle: "Sapporo · 5/5皆勤" })
  .node("attendanceApp", { lane: "system", stack: 0, kind: "shape-mobile-device", title: "打刻 モバイル アプリ", eyebrow: "端末", subtitle: "GPS位置 + timestamp送信" })
  .node("payroll", { lane: "finance", stack: 0, kind: "shape-server-rack", title: "給与計算system", eyebrow: "バックエンド", subtitle: "月次rollup · 支給額算出" })
  .edge("alice", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("bob", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("carol", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("dan", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("attendanceApp", "payroll", { label: "週次rollup", tone: "success" })
  .readout.attendanceGrid("ag", { source: "attendance", membersSource: "teamMembers", color: "#22c55e", label: "5 day × 4メンバー グリッド" })
  .readout.gauge("rateG", { source: "rate", min: 0, max: 100, color: "#22c55e", label: "週次出勤率 %" })
  .readout.countup("daysCU", { source: "totalDays", unit: " 日", label: "累計出勤日", decimals: 0 })
  .readout.stat("perfectStat", { source: "perfectCount", unit: " 名", caption: "皆勤者", label: "完全" })
  .phase("p1", {
    duration: 1800,
    title: "月曜開始",
    body: "月曜09:00、 4名中3名打刻(Carol休)、 グリッド に緑3 · 赤1。 rate 0 → 75 tween (ゲージ 針が緑域上位)、 totalDays 0 → 3 tween、 perfectCount 0 (途中判定なし)、 members lane full + アプリactive。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp", "alice-attendanceApp", "bob-attendanceApp", "carol-attendanceApp", "dan-attendanceApp").tween("rate", 0, 75).tween("totalDays", 0, 3).badge("Mon"))
  .phase("p2", {
    duration: 2200,
    title: "中間確認 (水)",
    body: "水曜まで、 Tue: Bob休、 Wed: 全員出勤で 合計 累積3+3+4 = 10日。 rate 75 → 83 tween、 totalDays 3 → 10 tween (countup加速)、 perfectCount 0 → 1 tween (Dan暫定皆勤、 stat表示)。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp", "alice-attendanceApp", "bob-attendanceApp", "carol-attendanceApp", "dan-attendanceApp").tween("rate", 75, 83).tween("totalDays", 3, 10).tween("perfectCount", 0, 1).badge("Wed"))
  .phase("p3", {
    duration: 2200,
    title: "週末集計 (金)",
    body: "Thu: Alice休、 Fri: Carol休 → 週次確定。 rate 83 → 80 tween (最終16/20 = 80%)、 totalDays 10 → 16 tween (countup最終)、 perfectCount 1保持(Danのみ皆勤)、 attendanceグリッド 完成。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp", "alice-attendanceApp", "bob-attendanceApp", "carol-attendanceApp", "dan-attendanceApp").tween("rate", 83, 80).tween("totalDays", 10, 16).badge("Fri"))
  .phase("p4", {
    duration: 2000,
    title: "給与連携",
    body: "月曜payroll systemに週次rollup送信、 皆勤Danにボーナスreflect。 rate保持、 totalDays保持、 perfectCount 1保持、 payroll lane activate、 6 shape全active、 給与計算完遂。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp", "payroll", "alice-attendanceApp", "bob-attendanceApp", "carol-attendanceApp", "dan-attendanceApp", "attendanceApp-payroll").set("rate", 80).badge("給与"))
  .build();

/**
 * 93. timezone-clock = 4 city の multi-timezone clock (Tokyo / London / NYC / Sydney)。
 */
export const globalTimezoneClock = diagram("interactive-timezone-clock", {
  topic: "4 city timezone を 4-lane (Tokyo / London / NYC / Sydney) 都市別分散、 各 city 個別 card、 timezoneClock readout 併存",
})
  .lane("tokyo", { x: 0, width: 180 })
  .lane("london", { x: 200, width: 180 })
  .lane("nyc", { x: 400, width: 180 })
  .lane("sydney", { x: 600, width: 180 })
  .arraySignal("clocks", [
    ["Tokyo", 9, "22:30"],
    ["London", 0, "13:30"],
    ["NYC", -5, "08:30"],
    ["Sydney", 11, "00:30"],
  ] as unknown as (string | number)[])
  .node("tokyoNode", { lane: "tokyo", stack: 0, kind: "card", title: "Tokyo", subtitle: "22:30 · UTC+9" })
  .node("londonNode", { lane: "london", stack: 0, kind: "card", title: "London", subtitle: "13:30 · UTC±0" })
  .node("nycNode", { lane: "nyc", stack: 0, kind: "card", title: "NYC", subtitle: "08:30 · UTC-5" })
  .node("sydneyNode", { lane: "sydney", stack: 0, kind: "card", title: "Sydney", subtitle: "00:30 · UTC+11" })
  .readout.timezoneClock("tc", { source: "clocks", color: "#2563eb", label: "Cities (4-列 グリッド)" })
  .phase("p", {
    duration: 1200,
    title: "cityタイムゾーンsplit",
    body: "4-lane (Tokyo UTC+9 / London UTC±0 / NYC UTC-5 / Sydney UTC+11)で4 cityタイムゾーン を都市別分散、 各city個別 カード でtime + UTC offset明示、 timezoneClock readoutも併存で4列 グリッド 表示、 city分類と 時計 一覧の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("tokyoNode", "londonNode", "nycNode", "sydneyNode").badge("clock"))
  .build();

/**
 * 94. form-summary = signup form の 5 field 送信内容 summary。
 */
export const signupFormSummary = diagram("interactive-signup-form", {
  topic: "signup form 5 field を 3-lane (Personal / Contact / Prefs) semantic 分類、 各 field 個別 card、 formSummary readout 併存",
})
  .lane("personal", { x: 0, width: 220 })
  .lane("contact", { x: 260, width: 220 })
  .lane("prefs", { x: 520, width: 200 })
  .arraySignal("fields", [
    ["Name", "Alice Wonderland"],
    ["Email", "alice@example.com"],
    ["Age", "28"],
    ["Country", "Japan"],
    ["Newsletter", "Yes"],
  ] as unknown as (string | number)[])
  .node("nameNode", { lane: "personal", stack: 0, kind: "card", title: "Name", subtitle: "Alice Wonderland" })
  .node("ageNode", { lane: "personal", stack: 1, kind: "card", title: "Age", subtitle: "28" })
  .node("emailNode", { lane: "contact", stack: 0, kind: "card", title: "メール", subtitle: "alice@example.com" })
  .node("countryNode", { lane: "contact", stack: 1, kind: "card", title: "Country", subtitle: "Japan" })
  .node("newsletterNode", { lane: "prefs", stack: 0, kind: "card", title: "Newsletter", subtitle: "YES (opt-内)" })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "Submission (dl/dt/dd)" })
  .phase("p", {
    duration: 1200,
    title: "フォームcategory split",
    body: "3-lane (Personal Name+Age / Contactメール+Country / Prefs Newsletter)で5 fieldをsemantic分類、 各field個別 カード でkey/value明示、 formSummary readoutも併存でdl/dt/dd表示、 field分類と 概要 の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("nameNode", "ageNode", "emailNode", "countryNode", "newsletterNode").badge("form"))
  .build();

/**
 * 95. song-queue = playlist queue 5 song、 stepper で current index。
 */
export const playlistSongQueue = diagram("interactive-playlist-queue", {
  topic: "playlist queue 5 song を 3-lane (Played / Now Playing / Up Next) 状態別分散、 各 song 個別 card、 songQueue readout 併存",
})
  .lane("played", { x: 0, width: 200 })
  .lane("now", { x: 240, width: 220 })
  .lane("next", { x: 500, width: 220 })
  .input.stepper("cur", { min: 0, max: 4, defaultValue: 1, label: "Currentインデックス" })
  .state("cur", { initial: 1 })
  .arraySignal("queue", [
    ["Bohemian Rhapsody", "Queen", "5:55"],
    ["Hotel California", "Eagles", "6:30"],
    ["Stairway to Heaven", "Led Zeppelin", "8:02"],
    ["Sweet Child O' Mine", "Guns N' Roses", "5:56"],
    ["Imagine", "John Lennon", "3:03"],
  ] as unknown as (string | number)[])
  .node("song0", { lane: "played", stack: 0, kind: "card", title: "✓ Bohemian Rhapsody", subtitle: "Queen · 5:55 (played)" })
  .node("song1", { lane: "now", stack: 0, kind: "card", title: "▶ Hotel California", subtitle: "Eagles · 6:30 (now playing)" })
  .node("song2", { lane: "next", stack: 0, kind: "card", title: "Stairway to Heaven", subtitle: "Led Zeppelin · 8:02" })
  .node("song3", { lane: "next", stack: 1, kind: "card", title: "Sweet Child O' Mine", subtitle: "Guns数' Roses · 5:56" })
  .node("song4", { lane: "next", stack: 2, kind: "card", title: "Imagine", subtitle: "John Lennon · 3:03" })
  .readout.songQueue("sq", { source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "キュー (current highlight)" })
  .phase("p", {
    duration: 1200,
    title: "playback split",
    body: "3-lane (Played過去 / Now Playing現在 / 上 次 未来)で5楽曲 をplayback状態 別分散、 default current=1の状態をlane配置で明示、 各 楽曲 個別 カード、 songQueue readoutも併存でhighlight追随、 timeline状態と キュー の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("song0", "song1", "song2", "song3", "song4").badge("music"))
  .build();

/**
 * 96. calendar-month = January 2026 calendar with event marks + today highlight。
 */
function generateCalendarDays(): (string | number)[] {
  const days: [number, boolean, boolean][] = [];
  const events = new Set([3, 8, 12, 17, 22, 26]);
  const today = 13;
  for (let d = 1; d <= 31; d++) {
    days.push([d, events.has(d), d === today]);
  }
  return days as unknown as (string | number)[];
}
/**
 * 96. monthCalendarView v2 = プロジェクトマネージャー月次スケジューリング シナリオ (Q1 launch 前月の管理)、 shape-person + shape-mobile-device + shape-cloud (Google Calendar) + shape-cylinder + shape-server-rack + shape-hexagon の 6 shape で visual scene 化、 4 phase (月初計画 → 中間確認 → 週次 review → 月末振返り) + 4 readout (calendarMonth / gauge 埋まり率 / countup 完了 event / stat 残 event) が tween で visually 連続変化。 iteration 8 wave 8-E redesign。
 */
export const monthCalendarView = diagram("interactive-month-calendar", {
  topic: "PMの月次スケジューリング、Q1ローンチ前月の計画から中間、週次、ふりかえりまで",
})
  .lane("pm", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("delivery", { x: 580, width: 220 })
  .arraySignal("days", generateCalendarDays())
  .state("fillRate", { initial: 0 })
  .state("doneEvents", { initial: 0 })
  .state("remainingEvents", { initial: 6 })
  .node("pm", { lane: "pm", stack: 0, kind: "shape-person", title: "PM佐藤様", eyebrow: "マネージャー", subtitle: "Q1 SaaS launch前月" })
  .node("mobile", { lane: "pm", stack: 1, kind: "shape-mobile-device", title: "Calendarアプリ", eyebrow: "端末", subtitle: "予定確認 + reschedule" })
  .node("gcal", { lane: "system", stack: 0, kind: "shape-cloud", title: "Google Calendar", eyebrow: "calendar", subtitle: "チーム 予定sync · 招待自動" })
  .node("db", { lane: "system", stack: 1, kind: "shape-cylinder", title: "イベントDB", eyebrow: "保存", subtitle: "マイルストーン + review記録" })
  .node("gateway", { lane: "system", stack: 2, kind: "shape-server-rack", title: "Zapier hub", eyebrow: "integration", subtitle: "Slack + Jira連動" })
  .node("release", { lane: "delivery", stack: 0, kind: "shape-hexagon", title: "Q1 launch", eyebrow: "マイルストーン", subtitle: "1/31予定 · 全event集約" })
  .edge("pm", "mobile", { label: "予定管理", tone: "info" })
  .edge("mobile", "gcal", { label: "同期", tone: "info" })
  .edge("gcal", "db", { label: "永続化", tone: "success" })
  .edge("db", "gateway", { label: "起動", tone: "accent" })
  .edge("gateway", "release", { label: "launch準備", tone: "warning" })
  .readout.calendarMonth("cm", { source: "days", monthName: "2026 年 1 月", color: "#2563eb", label: "月間予定 表示" })
  .readout.gauge("fillG", { source: "fillRate", min: 0, max: 100, color: "#22c55e", label: "予定埋まり率 %" })
  .readout.countup("doneCU", { source: "doneEvents", unit: " 件", label: "完了 イベント", decimals: 0 })
  .readout.stat("remStat", { source: "remainingEvents", unit: " 件", caption: "残 イベント", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "月初計画",
    body: "1/1佐藤様が1月の イベント6件をGoogle Calendarに登録(Jan 3/8/12/17/22/26)。 fillRate 0 → 25 tween、 doneEvents 0、 remainingEvents 6保持、 PM + gcal lane有効。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "pm-mobile", "mobile-gcal").tween("fillRate", 0, 25).set("doneEvents", 0).set("remainingEvents", 6).badge("計画"))
  .phase("p2", {
    duration: 2200,
    title: "中間確認(1/13 today)",
    body: "月中旬に進捗確認、 2件完了(Jan 3, 8)。 fillRate 25 → 50 tween、 doneEvents 0 → 2 tween (countup加算)、 remainingEvents 6 → 4 tween (stat減少)、 DB lane activate、 calendarにtoday (13日) highlight。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db", "pm-mobile", "mobile-gcal", "gcal-db").tween("fillRate", 25, 50).tween("doneEvents", 0, 2).tween("remainingEvents", 6, 4).badge("中間"))
  .phase("p3", {
    duration: 2200,
    title: "週次review (1/22)",
    body: "第3週 レビュー、 Jan 12/17追加完了で4件済。 fillRate 50 → 75 tween、 doneEvents 2 → 4 tween、 remainingEvents 4 → 2 tween (Jan 22/26のみ残)、 ゲートウェイlane activate、 Slack / Jira連動。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db", "gateway", "pm-mobile", "mobile-gcal", "gcal-db", "db-gateway").tween("fillRate", 50, 75).tween("doneEvents", 2, 4).tween("remainingEvents", 4, 2).badge("週次"))
  .phase("p4", {
    duration: 2000,
    title: "月末振返り(1/31 launch)",
    body: "1/31に全6イベント 完遂 → Q1 launch。 fillRate 75 → 100 tween (ゲージ 針最上位)、 doneEvents 4 → 6 tween (countup最終)、 remainingEvents 2 → 0 tween (stat空)、 リリースlane activate、 6 shape全active、 launch到達。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db", "gateway", "release", "pm-mobile", "mobile-gcal", "gcal-db", "db-gateway", "gateway-release").tween("fillRate", 75, 100).tween("doneEvents", 4, 6).tween("remainingEvents", 2, 0).badge("振返り"))
  .build();

/**
 * 97. cliTerminalSession v2 = 開発者 朝の start-up ritual 4 phase シナリオ (repo 更新 → status 確認 → test 実行 → container 起動)、 shape-person + shape-mobile-device + shape-terminal + shape-server-rack + shape-gear + shape-cloud の 6 shape で visual scene 化、 4 phase (repo 更新 → git status → pnpm test → docker up) + 4 readout (terminal / gauge 環境準備度 / countup 実行 cmd 数 / stat 起動時間) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const cliTerminalSession = diagram("interactive-cli-terminal", {
  topic: "開発者の朝のCLI習慣、リポジトリ確認からgit操作、テスト、docker起動まで",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 340 })
  .lane("service", { x: 600, width: 220 })
  .arraySignal("cmds", [
    ["$", "ls -la", "total 42\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"],
    ["$", "cd projects", ""],
    ["$", "git status", "On branch main\nnothing to commit, working tree clean"],
    ["$", "pnpm test", "Test Files  114 passed\nTests  1649 passed"],
    ["$", "docker ps", "CONTAINER ID   IMAGE\n8f3a2b1c9d   nginx:latest"],
  ] as unknown as (string | number)[])
  .state("readiness", { initial: 0 })
  .state("cmdCount", { initial: 0 })
  .state("elapsedSec", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 塩見様", eyebrow: "エンジニア", subtitle: "09:00 開発準備開始" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "MacBook Pro", eyebrow: "端末", subtitle: "M3最大 · macOS Sonoma" })
  .node("terminal", { lane: "system", stack: 0, kind: "shape-terminal", title: "iTerm2セッション", eyebrow: "shell", subtitle: "zsh + Oh My Zsh" })
  .node("repoServer", { lane: "system", stack: 1, kind: "shape-server-rack", title: "GitHub SSH", eyebrow: "vcs", subtitle: "git pullで最新反映" })
  .node("engine", { lane: "system", stack: 2, kind: "shape-gear", title: "pnpm engine", eyebrow: "runtime", subtitle: "workspace依存解決" })
  .node("docker", { lane: "service", stack: 0, kind: "shape-cloud", title: "Dockerデスクトップ", eyebrow: "コンテナ", subtitle: "local開発stack 3コンテナ" })
  .edge("dev", "laptop", { label: "操作", tone: "info" })
  .edge("laptop", "terminal", { label: "shell起動", tone: "info" })
  .edge("terminal", "repoServer", { label: "gitプル", tone: "success" })
  .edge("terminal", "engine", { label: "pnpm exec", tone: "accent" })
  .edge("terminal", "docker", { label: "Docker上", tone: "success" })
  .readout.terminal("tm", { source: "cmds", max: 10, color: "#22c55e", label: "shellセッション(CLI)" })
  .readout.gauge("readyG", { source: "readiness", min: 0, max: 100, color: "#22c55e", label: "環境準備度 %" })
  .readout.countup("cmdCU", { source: "cmdCount", unit: " 件", label: "実行cmd", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedSec", unit: " 秒", caption: "起動から", label: "経過" })
  .phase("p1", {
    duration: 1800,
    title: "repo更新(ls + cd)",
    body: "塩見様がterminal起動 → 作業dir移動。 readiness 0 → 15 tween、 cmdCount 0 → 2 tween (ls + cd)、 elapsedSec 0 → 5 tween、 開発 + ノートPC + terminal lane有効。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "dev-laptop", "laptop-terminal").tween("readiness", 0, 15).tween("cmdCount", 0, 2).tween("elapsedSec", 0, 5).badge("repo"))
  .phase("p2", {
    duration: 2200,
    title: "git状態(clean確認)",
    body: "git状態 でmainブランチ クリーンアップ 確認、 SSH経由でGitHubからlatest反映。 readiness 15 → 45 tween、 cmdCount 2 → 3 tween、 elapsedSec 5 → 15 tween、 repoServer lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer", "dev-laptop", "laptop-terminal", "terminal-repoServer").tween("readiness", 15, 45).tween("cmdCount", 2, 3).tween("elapsedSec", 5, 15).badge("git"))
  .phase("p3", {
    duration: 2400,
    title: "pnpmテスト(verify走行)",
    body: "全114テストfile実行、 1649テストpass。 readiness 45 → 75 tween、 cmdCount 3 → 4 tween、 elapsedSec 15 → 90 tween (検証 に75s)、 engine lane activate、 pnpm workspace依存解決。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer", "engine", "dev-laptop", "laptop-terminal", "terminal-repoServer", "terminal-engine").tween("readiness", 45, 75).tween("cmdCount", 3, 4).tween("elapsedSec", 15, 90).badge("test"))
  .phase("p4", {
    duration: 2000,
    title: "Docker上(local stack)",
    body: "Docker-compose上 でlocal stack起動、 3コンテナready。 readiness 75 → 100 tween (ゲージ 針最上位、 開発可能)、 cmdCount 4 → 5 tween (最終)、 elapsedSec 90 → 130 tween、 Docker lane activate、 6 shape全active、 開発環境ready。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer", "engine", "docker", "dev-laptop", "laptop-terminal", "terminal-repoServer", "terminal-engine", "terminal-docker").tween("readiness", 75, 100).tween("cmdCount", 4, 5).tween("elapsedSec", 90, 130).badge("docker"))
  .build();

/**
 * 98. chess-board = 8×8 chess board with starting position。
 */
export const chessStartingBoard = diagram("interactive-chess-board", {
  topic: "32 chess piece を 4-lane (Black back rank / Black pawns / White pawns / White back rank) rank 別分散、 chessBoard readout 併存",
})
  .lane("blackBack", { x: 0, width: 180 })
  .lane("blackPawn", { x: 200, width: 180 })
  .lane("whitePawn", { x: 400, width: 180 })
  .lane("whiteBack", { x: 600, width: 180 })
  .arraySignal("pieces", [
    // Black back rank (rank 8)
    ["a", 8, "♜"], ["b", 8, "♞"], ["c", 8, "♝"], ["d", 8, "♛"], ["e", 8, "♚"], ["f", 8, "♝"], ["g", 8, "♞"], ["h", 8, "♜"],
    // Black pawns (rank 7)
    ["a", 7, "♟"], ["b", 7, "♟"], ["c", 7, "♟"], ["d", 7, "♟"], ["e", 7, "♟"], ["f", 7, "♟"], ["g", 7, "♟"], ["h", 7, "♟"],
    // White pawns (rank 2)
    ["a", 2, "♙"], ["b", 2, "♙"], ["c", 2, "♙"], ["d", 2, "♙"], ["e", 2, "♙"], ["f", 2, "♙"], ["g", 2, "♙"], ["h", 2, "♙"],
    // White back rank (rank 1)
    ["a", 1, "♖"], ["b", 1, "♘"], ["c", 1, "♗"], ["d", 1, "♕"], ["e", 1, "♔"], ["f", 1, "♗"], ["g", 1, "♘"], ["h", 1, "♖"],
  ] as unknown as (string | number)[])
  .node("blackBackNode", { lane: "blackBack", stack: 0, kind: "card", title: "Black後(順位8)", subtitle: "♜♞♝♛♚♝♞♜ · 8 pieces" })
  .node("blackPawnNode", { lane: "blackPawn", stack: 0, kind: "card", title: "Black pawns (順位7)", subtitle: "♟×8" })
  .node("whitePawnNode", { lane: "whitePawn", stack: 0, kind: "card", title: "White pawns (順位2)", subtitle: "♙×8" })
  .node("whiteBackNode", { lane: "whiteBack", stack: 0, kind: "card", title: "White後(順位1)", subtitle: "♖♘♗♕♔♗♘♖ · 8 pieces" })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "Position (8×8ボード)" })
  .phase("p", {
    duration: 1200,
    title: "チェス 順位split",
    body: "4-lane (Black戻る 順位8 / Black pawns順位7 / White pawns順位2 / White戻る 順位1)で32 pieceを 順位 別分散、 各 順位 個別 カード でpiece明示、 chessBoard readoutも併存で8×8ボード 表示、 順位 分類と ボード 全体観の2経路 表示。",
  }, (p: PhaseBuilder) => p.activate("blackBackNode", "blackPawnNode", "whitePawnNode", "whiteBackNode").badge("chess"))
  .build();

/**
 * 100. sprintKanbanBoard v2 = 2 週 sprint daily stand-up シナリオ、 shape-person + shape-mobile-device + shape-kanban-card × 3 + shape-server-rack の 6 shape で visual scene 化、 4 phase (sprint start → daily 3 日目 → 7 日目 → sprint 完了) + 4 readout (kanbanBoard / gauge burndown 消化率 / countup done タスク / stat velocity) が tween で visually 連続変化。 iteration 8 wave 8-C redesign。
 */
export const sprintKanbanBoard = diagram("interactive-sprint-kanban", {
  topic: "2 週 sprint daily stand-up シナリオ = 4 phase (start → 3 日目 → 7 日目 → 完了) の flow を shape-* primitive 6 種で表現 + 4 readout (kanbanBoard / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("team", { x: 0, width: 220 })
  .lane("board", { x: 240, width: 340 })
  .lane("metrics", { x: 600, width: 220 })
  .arraySignal("tasks", [
    ["todo", "Design API schema", "high"],
    ["todo", "Write docs", "low"],
    ["inprogress", "Impl auth flow", "high"],
    ["inprogress", "Migration script", "med"],
    ["done", "Setup CI", "med"],
    ["done", "Repo bootstrap", "low"],
  ] as unknown as (string | number)[])
  .state("burndown", { initial: 0 })
  .state("doneCount", { initial: 0 })
  .state("velocity", { initial: 0 })
  .node("scrum", { lane: "team", stack: 0, kind: "shape-person", title: "スクラムマスター 井上様", eyebrow: "ロール", subtitle: "日次stand-up主催" })
  .node("tablet", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "Jiraモバイル", eyebrow: "端末", subtitle: "スプリントボード 確認" })
  .node("todoStack", { lane: "board", stack: 0, kind: "shape-kanban-card", title: "Todo列", eyebrow: "状態", subtitle: "バックログ · 2 task残" })
  .node("progressStack", { lane: "board", stack: 1, kind: "shape-kanban-card", title: "内Progress", eyebrow: "状態", subtitle: "WIP制限3 · 2 task進行中" })
  .node("doneStack", { lane: "board", stack: 2, kind: "shape-kanban-card", title: "Done列", eyebrow: "状態", subtitle: "完了 {doneCount} タスク" })
  .node("api", { lane: "metrics", stack: 0, kind: "shape-server-rack", title: "Jira API", eyebrow: "バックエンド", subtitle: "バーンダウンchart生成 · velocity集計" })
  .edge("scrum", "tablet", { label: "確認", tone: "info" })
  .edge("tablet", "api", { label: "取得 /スプリント", tone: "info" })
  .edge("todoStack", "progressStack", { label: "プル", tone: "warning" })
  .edge("progressStack", "doneStack", { label: "完了", tone: "success" })
  .edge("doneStack", "api", { label: "ベロシティ 記録", tone: "accent" })
  .readout.kanbanBoard("kb", { source: "tasks", columnWidth: 150, max: 5, label: "スプリント かんばん3列" })
  .readout.gauge("burndownG", { source: "burndown", min: 0, max: 100, color: "#22c55e", label: "消化率 %" })
  .readout.countup("doneCU", { source: "doneCount", unit: " タスク", label: "完了 タスク", decimals: 0 })
  .readout.stat("velStat", { source: "velocity", unit: " pt/wk", caption: "速度", label: "ベロシティ" })
  .phase("p1", {
    duration: 2000,
    title: "スプリントstart (day 1)",
    body: "スプリント 計画 完了、 6タスク バックログ に投入、 うち2タスク 完了(bootstrap)。 バーンダウン0 → 33 tween (ゲージ 針が緑域下位)、 doneCount 0 → 2 tween (setup完了分)、 ベロシティ0 (初日未算出)、 チーム + Todo列active。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "scrum-tablet").tween("burndown", 0, 33).tween("doneCount", 0, 2).badge("start"))
  .phase("p2", {
    duration: 2400,
    title: "日次(day 3)",
    body: "日次stand-上、 Impl認証 フロー / マイグレーションscriptを 内Progressへ プル。 バーンダウン33 → 50 tween、 doneCount 2 → 2保持(WIP中)、 ベロシティ0 → 6 tween (stat表示)、 progressStack lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack", "scrum-tablet", "todoStack-progressStack").tween("burndown", 33, 50).tween("velocity", 0, 6).badge("day 3"))
  .phase("p3", {
    duration: 2200,
    title: "日次(day 7)",
    body: "折り返し レビュー、 Impl認証 フロー 完了で 完了 にmove。 バーンダウン50 → 75 tween、 doneCount 2 → 3 tween (countup加算)、 ベロシティ6 → 9 tween、 doneStack lane activate、 API経由 指標 集計。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack", "doneStack", "api", "scrum-tablet", "tablet-api", "todoStack-progressStack", "progressStack-doneStack", "doneStack-api").tween("burndown", 50, 75).tween("doneCount", 2, 3).tween("velocity", 6, 9).badge("day 7"))
  .phase("p4", {
    duration: 2000,
    title: "スプリント 完了(day 14)",
    body: "全6タスク 完遂、 スプリント ふりかえり 実施。 バーンダウン75 → 100 tween (ゲージ 針最上位)、 doneCount 3 → 6 tween (countup最終、 全 タスク 完了)、 ベロシティ9 → 12 tween、 6 shape全active、 次 スプリントplanへ。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack", "doneStack", "api", "scrum-tablet", "tablet-api", "todoStack-progressStack", "progressStack-doneStack", "doneStack-api").tween("burndown", 75, 100).tween("doneCount", 3, 6).tween("velocity", 9, 12).badge("完了"))
  .build();

/**
 * 101. docsBreadcrumb v2 = 新人エンジニア OSS docs 学習 4 phase シナリオ (入口 → docs 一覧 → API 詳細 → Reference 深掘り)、 shape-person + shape-mobile-device + shape-website × 2 + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Home 到着 → docs section → API page → Reference 深掘り) + 4 readout (breadcrumb / gauge 学習進度 / countup 訪問 page 数 / stat 滞在分) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const docsBreadcrumb = diagram("interactive-docs-breadcrumb", {
  topic: "新人エンジニアがOSSドキュメントをホームから、ドキュメント、API、リファレンスまで深掘り学習",
})
  .lane("newbie", { x: 0, width: 220 })
  .lane("docsSite", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("path", ["Home", "Docs", "API", "Reference"])
  .state("cur", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("pageCount", { initial: 0 })
  .state("dwellMin", { initial: 0 })
  .node("newbie", { lane: "newbie", stack: 0, kind: "shape-person", title: "新人 岸田様", eyebrow: "learner", subtitle: "OSS初触りエンジニア" })
  .node("laptop", { lane: "newbie", stack: 1, kind: "shape-mobile-device", title: "Chromeブラウザ", eyebrow: "端末", subtitle: "docs tab複数開き + 履歴" })
  .node("home", { lane: "docsSite", stack: 0, kind: "shape-website", title: "docs Home", eyebrow: "landing", subtitle: "商品overview + Getting Started" })
  .node("apiPage", { lane: "docsSite", stack: 1, kind: "shape-website", title: "APIリファレンスpage", eyebrow: "API", subtitle: "エンドポイント 一覧 + interactive playground" })
  .node("cdn", { lane: "docsSite", stack: 2, kind: "shape-cloud", title: "docs CDN", eyebrow: "CDN", subtitle: "Vercel edge配信 · caching" })
  .node("bookmarks", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "ブラウザbookmark", eyebrow: "保存", subtitle: "頻用page保存 · 学習資産" })
  .edge("newbie", "laptop", { label: "検索", tone: "info" })
  .edge("laptop", "home", { label: "取得 /", tone: "info" })
  .edge("home", "apiPage", { label: "ナビ", tone: "success" })
  .edge("apiPage", "cdn", { label: "asset読込", tone: "accent" })
  .edge("apiPage", "bookmarks", { label: "★ 保存", tone: "success" })
  .readout.breadcrumb("bc", { source: "path", currentSource: "cur", color: "#2563eb", label: "navigation breadcrumb" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "学習進度 %" })
  .readout.countup("pageCU", { source: "pageCount", unit: " ページ", label: "訪問page", decimals: 0 })
  .readout.stat("dwellStat", { source: "dwellMin", unit: " 分", caption: "滞在時間", label: "滞留" })
  .phase("p1", {
    duration: 1800,
    title: "Home到着",
    body: "岸田様がGoogle検索からdocs Home到着。 cur = 0 (Home)、 進捗0 → 15 tween、 pageCount 0 → 1 tween、 dwellMin 0 → 3 tween、 newbie + ノートPC + home lane有効。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "newbie-laptop", "laptop-home").set("cur", 0).tween("progress", 0, 15).tween("pageCount", 0, 1).tween("dwellMin", 0, 3).badge("Home"))
  .phase("p2", {
    duration: 2200,
    title: "docs section移動",
    body: "Getting Started読了 → Docs sectionへ。 cur 0 → 1 tween (breadcrumb更新)、 進捗15 → 40 tween、 pageCount 1 → 5 tween、 dwellMin 3 → 12 tween、 引き続きdocsSite lane内で滞在。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "newbie-laptop", "laptop-home").tween("cur", 0, 1).tween("progress", 15, 40).tween("pageCount", 1, 5).tween("dwellMin", 3, 12).badge("Docs"))
  .phase("p3", {
    duration: 2200,
    title: "API page到達",
    body: "APIリファレンス到達、 エンドポイント 一覧確認 + interactive playground試行。 cur 1 → 2 tween、 進捗40 → 68 tween、 pageCount 5 → 12 tween、 dwellMin 12 → 28 tween、 apiPage + CDN lane activate。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "apiPage", "cdn", "newbie-laptop", "laptop-home", "home-apiPage", "apiPage-cdn").tween("cur", 1, 2).tween("progress", 40, 68).tween("pageCount", 5, 12).tween("dwellMin", 12, 28).badge("API"))
  .phase("p4", {
    duration: 2000,
    title: "Reference深掘り + ブックマーク",
    body: "Referenceで全 エンドポイント 詳細確認 + 頻用page 5個bookmark。 cur 2 → 3 tween (Reference)、 進捗68 → 92 tween (ゲージ 針最上位近く)、 pageCount 12 → 18 tween、 dwellMin 28 → 45 tween、 bookmarks lane activate、 6 shape全active、 学習資産構築。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "apiPage", "cdn", "bookmarks", "newbie-laptop", "laptop-home", "home-apiPage", "apiPage-cdn", "apiPage-bookmarks").tween("cur", 2, 3).tween("progress", 68, 92).tween("pageCount", 12, 18).tween("dwellMin", 28, 45).badge("Reference"))
  .build();

/**
 * 102. dayScheduleTimeline v2 = エンジニアリング マネージャー 1 日 4 phase シナリオ (朝の standup → 設計 review → deploy → 夜の retro)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (Morning standup → Afternoon deploy → 1-on-1 → Evening retro) + 4 readout (timelineVertical / gauge task 消化率 / countup 参加会議数 / stat 残 task) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const dayScheduleTimeline = diagram("interactive-day-schedule", {
  topic: "エンジニアリングマネージャーの1日、朝のstandupから昼のデプロイ、1on1、夜のふりかえりまで",
})
  .lane("manager", { x: 0, width: 220 })
  .lane("work", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("events", [
    ["09:00", "Standup", "team sync"],
    ["10:30", "Design review", "3 proposals"],
    ["14:00", "Deploy staging", "v1.2.0"],
    ["16:00", "1-on-1", "career discussion"],
    ["19:30", "Retrospective", "sprint 42 close"],
  ] as unknown as (string | number)[])
  .state("taskDone", { initial: 0 })
  .state("meetingCount", { initial: 0 })
  .state("taskRemain", { initial: 5 })
  .node("manager", { lane: "manager", stack: 0, kind: "shape-person", title: "EM大西様", eyebrow: "マネージャー", subtitle: "8 名チームリード" })
  .node("laptop", { lane: "manager", stack: 1, kind: "shape-mobile-device", title: "MacBook + Google Cal", eyebrow: "端末", subtitle: "5 event予定 + Slack" })
  .node("meetingRoom", { lane: "work", stack: 0, kind: "shape-website", title: "Zoom / 会議room", eyebrow: "会議", subtitle: "スタンドアップ + designレビュー + 1-オン-1" })
  .node("staging", { lane: "work", stack: 1, kind: "shape-server-rack", title: "ステージング デプロイ", eyebrow: "運用", subtitle: "v1.2.0展開 · pre-production" })
  .node("retroBoard", { lane: "work", stack: 2, kind: "shape-hexagon", title: "Miroふりかえりボード", eyebrow: "ふりかえり", subtitle: "スプリント42振返り + アクション" })
  .node("summary", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "日次summary", eyebrow: "ログ", subtitle: "Notionに成果 + 課題記録" })
  .edge("manager", "laptop", { label: "予定確認", tone: "info" })
  .edge("laptop", "meetingRoom", { label: "参加", tone: "info" })
  .edge("meetingRoom", "staging", { label: "承認 → デプロイ", tone: "success" })
  .edge("staging", "retroBoard", { label: "レビュー", tone: "accent" })
  .edge("retroBoard", "summary", { label: "記録", tone: "success" })
  .readout.timelineVertical("tv", { source: "events", color: "#2563eb", max: 8, label: "1日5イベント" })
  .readout.gauge("progG", { source: "taskDone", min: 0, max: 100, color: "#22c55e", label: "タスク 消化率 %" })
  .readout.countup("meetCU", { source: "meetingCount", unit: " 件", label: "参加会議", decimals: 0 })
  .readout.stat("remStat", { source: "taskRemain", unit: " 件", caption: "残 タスク", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "Morningスタンドアップ(09:00)",
    body: "大西様がZoomスタンドアップ 主催、 8名で15分 同期。 taskDone 0 → 20 tween、 meetingCount 0 → 1 tween、 taskRemain 5 → 4 tween、 マネージャー + meetingRoom lane有効。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "manager-laptop", "laptop-meetingRoom").tween("taskDone", 0, 20).tween("meetingCount", 0, 1).tween("taskRemain", 5, 4).badge("Standup"))
  .phase("p2", {
    duration: 2200,
    title: "Designレビュー + デプロイ(10:30-14:00)",
    body: "3 proposalsレビュー → 承認 → v1.2.0ステージング デプロイ。 taskDone 20 → 55 tween、 meetingCount 1 → 2 tween、 taskRemain 4 → 2 tween、 ステージングlane activate。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging", "manager-laptop", "laptop-meetingRoom", "meetingRoom-staging").tween("taskDone", 20, 55).tween("meetingCount", 1, 2).tween("taskRemain", 4, 2).badge("Deploy"))
  .phase("p3", {
    duration: 2200,
    title: "1-オン-1 + ふりかえり(16:00-19:30)",
    body: "メンバー とのcareer 1-オン-1 → スプリント42ふりかえり 主催。 taskDone 55 → 85 tween、 meetingCount 2 → 4 tween、 taskRemain 2 → 1 tween、 retroBoard lane activate、 Miroで振返り。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging", "retroBoard", "manager-laptop", "laptop-meetingRoom", "meetingRoom-staging", "staging-retroBoard").tween("taskDone", 55, 85).tween("meetingCount", 2, 4).tween("taskRemain", 2, 1).badge("Retro"))
  .phase("p4", {
    duration: 2000,
    title: "日次summary記録",
    body: "22:00帰宅前にNotionで1日成果 + 明日 タスク 準備。 taskDone 85 → 100 tween (ゲージ 針最上位)、 meetingCount 4 → 5 tween (最終)、 taskRemain 1 → 0 tween (stat空)、 概要lane activate、 6 shape全active、 1日完遂。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging", "retroBoard", "summary", "manager-laptop", "laptop-meetingRoom", "meetingRoom-staging", "staging-retroBoard", "retroBoard-summary").tween("taskDone", 85, 100).tween("meetingCount", 4, 5).tween("taskRemain", 1, 0).badge("summary"))
  .build();

/**
 * 103. serverUptimeStatus v2 = production web サーバー 3 時間 (09:00 - 12:00) uptime 監視 4 phase シナリオ (通常運転 → idle 検知 → error 発生 → 復旧安定)、 shape-person + shape-mobile-device + shape-server-rack + shape-iot-sensor + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Active → Idle → Error → 復旧) + 4 readout (statusTimeline / gauge availability % / countup incident 数 / stat MTTR 分) が tween で visually 連続変化。 iteration 8 wave 8-Q redesign、 iter 6 wave 3 完遂。
 */
export const serverUptimeStatus = diagram("interactive-server-uptime", {
  topic: "本番Webサーバーの3時間監視でアクティブからアイドル、エラー、復旧まで状態遷移",
})
  .lane("sre", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("events", [
    ["09:00", "active"],
    ["09:15", "active"],
    ["10:30", "idle"],
    ["11:00", "error"],
    ["11:15", "active"],
    ["12:00", "active"],
  ] as unknown as (string | number)[])
  .state("availability", { initial: 100 })
  .state("incidentCount", { initial: 0 })
  .state("mttr", { initial: 0 })
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "SRE平岡様", eyebrow: "SRE", subtitle: "日勤当番 · uptime責任者" })
  .node("dash", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "状態 ダッシュボード", eyebrow: "端末", subtitle: "3 lane状態timeline + アラート" })
  .node("webSvr", { lane: "service", stack: 0, kind: "shape-server-rack", title: "本番-Web-1", eyebrow: "本番", subtitle: "アクセス受付 + business logic" })
  .node("healthCheck", { lane: "service", stack: 1, kind: "shape-iot-sensor", title: "ヘルスチェックprobe", eyebrow: "sensor", subtitle: "/healthz 15s判定 + 状態 イベント" })
  .node("statusPage", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "publicステータスページ", eyebrow: "状態", subtitle: "顧客向けuptime + 現在status" })
  .node("uptimeDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "稼働DB", eyebrow: "保存", subtitle: "24h event履歴 + SLA集計" })
  .edge("sre", "dash", { label: "監視", tone: "info" })
  .edge("dash", "webSvr", { label: "SSH", tone: "info" })
  .edge("healthCheck", "webSvr", { label: "探査", tone: "info" })
  .edge("healthCheck", "statusPage", { label: "発行", tone: "success" })
  .edge("healthCheck", "uptimeDb", { label: "ログ", tone: "accent" })
  .readout.statusTimeline("st", { source: "events", max: 8, label: "サーバー 状態" })
  .readout.gauge("avG", { source: "availability", min: 0, max: 100, color: "#22c55e", label: "availability %" })
  .readout.countup("incCU", { source: "incidentCount", unit: " 件", label: "incident累計", decimals: 0 })
  .readout.stat("mttrStat", { source: "mttr", unit: " 分", caption: "MTTR", label: "MTTR" })
  .phase("p1", {
    duration: 1500,
    title: "09:00通常運転(有効)",
    body: "全 要求 正常応答、 healthy状態、 平岡様待機。 availability 100 keep、 incidentCount 0 keep、 MTTR 0 keep、 webSvr + ヘルスチェック + statusPage lane有効。",
  }, (p: PhaseBuilder) => p.activate("webSvr", "healthCheck", "statusPage", "healthCheck-webSvr", "healthCheck-statusPage").badge("Active"))
  .phase("p2", {
    duration: 2000,
    title: "10:30 idle検知",
    body: "アクセス減少でidle状態、 状態timelineにgrayイベント。 availability 100 → 96 tween、 incidentCount 0 → 1 tween、 MTTR 0 → 3 tween、 SRE + dash lane activate、 統計anomaly検知。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "webSvr", "healthCheck", "statusPage", "sre-dash", "dash-webSvr", "healthCheck-webSvr", "healthCheck-statusPage").tween("availability", 100, 96).tween("incidentCount", 0, 1).tween("mttr", 0, 3).badge("Idle"))
  .phase("p3", {
    duration: 2200,
    title: "11:00 error発生",
    body: "Webサーバー 一時応答不能、 timelineに赤 イベント、 平岡様がSSHで状況確認。 availability 96 → 82 tween、 incidentCount 1 → 2 tween、 MTTR 3 → 8 tween、 uptimeDb lane activate、 全lane full。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "webSvr", "healthCheck", "statusPage", "uptimeDb", "sre-dash", "dash-webSvr", "healthCheck-webSvr", "healthCheck-statusPage", "healthCheck-uptimeDb").tween("availability", 96, 82).tween("incidentCount", 1, 2).tween("mttr", 3, 8).badge("Error"))
  .phase("p4", {
    duration: 2000,
    title: "11:15 復旧 → 12:00 安定",
    body: "ホットフィックスrollout + auto-restartでactive状態に戻る、 uptimeDbで3時間SLA集計。 availability 82 → 98 tween、 incidentCount 2 keep、 MTTR 8 → 15 tween (最終)、 6 shape全active、 postmortem起票 + ステータスページ 復帰。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "webSvr", "healthCheck", "statusPage", "uptimeDb", "sre-dash", "dash-webSvr", "healthCheck-webSvr", "healthCheck-statusPage", "healthCheck-uptimeDb").tween("availability", 82, 98).tween("mttr", 8, 15).badge("復旧"))
  .build();

/**
 * 104. weekCalendarView v2 = フリーランス デザイナーの週次予定管理 4 phase シナリオ (月曜計画 → 中盤商談 → 週末納品 → 集計)、 shape-person + shape-mobile-device + shape-online-shop + shape-website + shape-brokerage + shape-cylinder の 6 shape で visual scene 化、 4 phase (月曜計画 → 水曜商談 → 金曜納品 → 土日集計) + 4 readout (calendarWeek / gauge 稼働率 / countup work hours / stat 週次収入) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const weekCalendarView = diagram("interactive-week-calendar", {
  topic: "フリーランスデザイナーの週次予定管理、月曜計画から水曜商談、金曜納品、土日集計まで",
})
  .lane("freelancer", { x: 0, width: 220 })
  .lane("clients", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("week", [
    ["Mon", true, false],
    ["Tue", false, false],
    ["Wed", true, true],
    ["Thu", false, false],
    ["Fri", true, false],
    ["Sat", false, false],
    ["Sun", false, false],
  ] as unknown as (string | number)[])
  .state("workRate", { initial: 0 })
  .state("workHours", { initial: 0 })
  .state("revenue", { initial: 0 })
  .node("designer", { lane: "freelancer", stack: 0, kind: "shape-person", title: "デザイナー 早見様", eyebrow: "freelance", subtitle: "UI/UX個人事業主" })
  .node("phone", { lane: "freelancer", stack: 1, kind: "shape-mobile-device", title: "iCloud Calendar", eyebrow: "端末", subtitle: "予定管理 + 請求書draft" })
  .node("clientA", { lane: "clients", stack: 0, kind: "shape-online-shop", title: "クライアントA (SaaS)", eyebrow: "b2b", subtitle: "月曜kickoff MTG · project開始" })
  .node("clientB", { lane: "clients", stack: 1, kind: "shape-website", title: "クライアントB (EC)", eyebrow: "b2b", subtitle: "水曜商談 + 金曜納品" })
  .node("agency", { lane: "clients", stack: 2, kind: "shape-brokerage", title: "紹介agency", eyebrow: "broker", subtitle: "新規案件紹介元" })
  .node("invoice", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "請求書DB", eyebrow: "invoicing", subtitle: "月末請求書生成用データ蓄積" })
  .edge("designer", "phone", { label: "予定確認", tone: "info" })
  .edge("phone", "clientA", { label: "月曜MTG", tone: "success" })
  .edge("phone", "clientB", { label: "水曜商談", tone: "success" })
  .edge("agency", "designer", { label: "新規案件", tone: "accent" })
  .edge("clientA", "invoice", { label: "作業 ログ", tone: "success" })
  .edge("clientB", "invoice", { label: "納品 ログ", tone: "success" })
  .readout.calendarWeek("cw", { source: "week", cellSize: 40, color: "#2563eb", label: "今週予定" })
  .readout.gauge("rateG", { source: "workRate", min: 0, max: 100, color: "#22c55e", label: "週次稼働率 %" })
  .readout.countup("hoursCU", { source: "workHours", unit: " h", label: "作業時間", decimals: 0 })
  .readout.stat("revStat", { source: "revenue", unit: "k$", caption: "週次収入", label: "収入" })
  .phase("p1", {
    duration: 1800,
    title: "月曜計画 + kickoff",
    body: "早見様がiCloudで今週予定確認、 クライアントAのkickoff MTG参加。 workRate 0 → 15 tween、 workHours 0 → 4 tween、 売上0 → 8 tween、 フリーランサー + clientA lane有効。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "designer-phone", "phone-clientA").tween("workRate", 0, 15).tween("workHours", 0, 4).tween("revenue", 0, 8).badge("月曜"))
  .phase("p2", {
    duration: 2200,
    title: "水曜商談 + 集中作業",
    body: "水曜 クライアントBと商談 + Figma集中作業。 workRate 15 → 55 tween、 workHours 4 → 22 tween (countup加速)、 売上8 → 28 tween、 clientB lane activate。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB", "designer-phone", "phone-clientA", "phone-clientB").tween("workRate", 15, 55).tween("workHours", 4, 22).tween("revenue", 8, 28).badge("商談"))
  .phase("p3", {
    duration: 2200,
    title: "金曜納品",
    body: "クライアントBにUI最終納品、 検収完了。 workRate 55 → 82 tween、 workHours 22 → 38 tween、 売上28 → 52 tween (納品完了で入金確定)、 agency lane activate、 新規案件も紹介入り。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB", "agency", "designer-phone", "phone-clientA", "phone-clientB", "agency-designer").tween("workRate", 55, 82).tween("workHours", 22, 38).tween("revenue", 28, 52).badge("納品"))
  .phase("p4", {
    duration: 2000,
    title: "土日集計 + 請求書draft",
    body: "土日で作業 ログ 集計 + 請求書draft、 来週準備。 workRate 82 → 95 tween (ゲージ 針最上位)、 workHours 38 → 42 tween、 売上52 → 58 tween (最終)、 請求書lane activate、 6 shape全active、 週次完遂。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB", "agency", "invoice", "designer-phone", "phone-clientA", "phone-clientB", "agency-designer", "clientA-invoice", "clientB-invoice").tween("workRate", 82, 95).tween("workHours", 38, 42).tween("revenue", 52, 58).badge("集計"))
  .build();

/**
 * 105. teamKpiComparison v2 = 2 チーム四半期対決 sprint velocity 比較シナリオ (Team A frontend vs Team B backend)、 shape-person × 2 + shape-mobile-device + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (期首計測 → 月次進捗 → 中間 review → 最終比較) + 4 readout (kpiComparison / gauge diff / countup total points / stat winner) が tween で visually 連続変化。 iteration 8 wave 8-C2 redesign。
 */
export const teamKpiComparison = diagram("interactive-team-kpi-compare", {
  topic: "2 チーム四半期 sprint velocity 対決 = 4 phase (期首 → 月次 → 中間 → 最終) の flow を shape-* primitive 6 種で表現 + 4 readout (kpiComparison / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("teamA", { x: 0, width: 260 })
  .lane("shared", { x: 280, width: 280 })
  .lane("teamB", { x: 580, width: 260 })
  .arraySignal("teams", [["Team A frontend", 82], ["Team B backend", 65]] as unknown as (string | number)[])
  .state("scoreA", { initial: 0 })
  .state("scoreB", { initial: 0 })
  .state("diffPct", { initial: 0 })
  .state("totalPoints", { initial: 0 })
  .node("leadA", { lane: "teamA", stack: 0, kind: "shape-person", title: "チームA lead田中様", eyebrow: "フロントエンド", subtitle: "React / 次.js開発" })
  .node("appA", { lane: "teamA", stack: 1, kind: "shape-mobile-device", title: "JiraボードA", eyebrow: "ボード", subtitle: "ベロシティ {scoreA} pt/スプリント" })
  .node("jira", { lane: "shared", stack: 0, kind: "shape-server-rack", title: "Jira platform", eyebrow: "system", subtitle: "スプリントvelocity集計" })
  .node("dwh", { lane: "shared", stack: 1, kind: "shape-cylinder", title: "分析DWH", eyebrow: "warehouse", subtitle: "四半期rollup · 累計 {totalPoints} pt" })
  .node("dashboard", { lane: "shared", stack: 2, kind: "shape-cloud", title: "Grafanaボード", eyebrow: "ダッシュボード", subtitle: "チーム 対比表示" })
  .node("leadB", { lane: "teamB", stack: 0, kind: "shape-person", title: "チームB lead佐藤様", eyebrow: "バックエンド", subtitle: "Go / gRPC開発" })
  .edge("leadA", "appA", { label: "運用", tone: "info" })
  .edge("appA", "jira", { label: "スプリント 記録", tone: "info" })
  .edge("leadB", "jira", { label: "スプリント 記録", tone: "info" })
  .edge("jira", "dwh", { label: "集計", tone: "success" })
  .edge("dwh", "dashboard", { label: "対比表示", tone: "accent" })
  .readout.kpiComparison("kc", { source: "teams", max: 100, colorA: "#2563eb", colorB: "#f97316", label: "スプリント ベロシティ 対比" })
  .readout.gauge("diffG", { source: "diffPct", min: 0, max: 50, color: "#22c55e", label: "A vs B差 %" })
  .readout.countup("totalCU", { source: "totalPoints", unit: " pt", label: "四半期累計pt", decimals: 0 })
  .readout.stat("winStat", { source: "scoreA", unit: " pt", caption: "チームA速度", label: "A" })
  .phase("p1", {
    duration: 1800,
    title: "期首計測",
    body: "四半期開始、 前期実績値で計測。 scoreA 0 → 62 tween、 scoreB 0 → 55 tween (両 チーム 立ち上がり)、 diffPct 0 → 13 tween (Aリード)、 totalPoints 0 → 117 tween。 チームlane full有効。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "leadA-appA").tween("scoreA", 0, 62).tween("scoreB", 0, 55).tween("diffPct", 0, 13).tween("totalPoints", 0, 117).badge("期首"))
  .phase("p2", {
    duration: 2200,
    title: "月次進捗",
    body: "1ヶ月経過、 Aは新機能着手で加速、 Bはrefactor中心で保守。 scoreA 62 → 75 tween、 scoreB 55 → 60 tween、 diffPct 13 → 25 tween、 totalPoints 117 → 252 tween、 jira lane activate。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira", "leadA-appA", "appA-jira", "leadB-jira").tween("scoreA", 62, 75).tween("scoreB", 55, 60).tween("diffPct", 13, 25).tween("totalPoints", 117, 252).badge("月次"))
  .phase("p3", {
    duration: 2200,
    title: "中間review",
    body: "2ヶ月折り返し、 ダッシュボード で対比可視化。 scoreA 75 → 78 tween、 scoreB 60 → 62 tween、 diffPct 25 → 26 tween (Aリード継続)、 totalPoints 252 → 392 tween、 dwh + ダッシュボードlane activate。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira", "dwh", "dashboard", "leadA-appA", "appA-jira", "leadB-jira", "jira-dwh", "dwh-dashboard").tween("scoreA", 75, 78).tween("scoreB", 60, 62).tween("diffPct", 25, 26).tween("totalPoints", 252, 392).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "最終比較",
    body: "四半期終了、 チームA 82 pt vsチームB 65 ptでA圧勝。 scoreA 78 → 82 tween (最終、 ゲージ 針最上位相当)、 scoreB 62 → 65 tween、 diffPct 26 → 26 tween、 totalPoints 392 → 539 tween (最終累計)、 6 shape全active、 kpiComparisonが最終値表示。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira", "dwh", "dashboard", "leadA-appA", "appA-jira", "leadB-jira", "jira-dwh", "dwh-dashboard").tween("scoreA", 78, 82).tween("scoreB", 62, 65).tween("totalPoints", 392, 539).badge("最終"))
  .build();

/**
 * 106. publishWorkflowSteps v2 = マーケティング team 週次 blog 記事 publish workflow 4 phase シナリオ (writer 下書き → editor レビュー → lead 承認 → CDN 配信)、 shape-person × 2 (writer / editor) + shape-mobile-device + shape-website + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Draft → Review → Approve → Publish) + 4 readout (stepProgress / gauge 完成度 / countup 累計配信数 / stat 経過分) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const publishWorkflowSteps = diagram("interactive-publish-workflow", {
  topic: "マーケティングチームがブログ記事を下書きから公開するまでの4ステップワークフロー",
})
  .lane("author", { x: 0, width: 220 })
  .lane("cms", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("steps", ["Draft", "Review", "Approve", "Publish"])
  .state("cur", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("publishedCount", { initial: 12 })
  .state("elapsedMin", { initial: 0 })
  .node("writer", { lane: "author", stack: 0, kind: "shape-person", title: "writer岸田様", eyebrow: "author", subtitle: "週次blog担当 · SEO記事" })
  .node("laptop", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "Notion下書き", eyebrow: "端末", subtitle: "見出し + 本文 + reference準備" })
  .node("cmsSite", { lane: "cms", stack: 0, kind: "shape-website", title: "CMS (WordPress)", eyebrow: "CMS", subtitle: "下書きslot + レビュアー 割当" })
  .node("editor", { lane: "cms", stack: 1, kind: "shape-person", title: "編集者 山田様", eyebrow: "レビュアー", subtitle: "fact-チェック + tone統一 + 校正" })
  .node("cdn", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "CloudFront CDN", eyebrow: "CDN", subtitle: "全国edgeキャッシュ + SEOインデックス" })
  .node("archive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "記事archive DB", eyebrow: "保存", subtitle: "public URL + タグ + 統計連携" })
  .edge("writer", "laptop", { label: "書く", tone: "info" })
  .edge("laptop", "cmsSite", { label: "送信", tone: "success" })
  .edge("cmsSite", "editor", { label: "割当", tone: "info" })
  .edge("editor", "cdn", { label: "承認 → デプロイ", tone: "accent" })
  .edge("cdn", "archive", { label: "インデックス", tone: "success" })
  .readout.stepProgress("sp", { source: "cur", stepsSource: "steps", color: "#2563eb", label: "ワークフロー" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "完成度 %" })
  .readout.countup("pubCU", { source: "publishedCount", unit: " 件", label: "累計配信", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedMin", unit: " 分", caption: "経過時間", label: "経過" })
  .phase("p1", {
    duration: 1800,
    title: "Draft作成",
    body: "岸田様がNotionで下書き執筆、 見出し + 本文 + 引用refs揃える。 cur = 0 (下書き)、 進捗0 → 30 tween、 publishedCount 12 keep、 elapsedMin 0 → 25 tween、 writer + ノートPC lane有効。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "writer-laptop").set("cur", 0).tween("progress", 0, 30).tween("elapsedMin", 0, 25).badge("Draft"))
  .phase("p2", {
    duration: 2200,
    title: "レビュー + fact-チェック",
    body: "CMS送信 → 山田様アサイン、 fact-チェック + tone統一 + 校正3 pass。 cur 0 → 1 tween (レビュー)、 進捗30 → 60 tween、 elapsedMin 25 → 55 tween、 cmsSite + 編集者lane activate。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor", "writer-laptop", "laptop-cmsSite", "cmsSite-editor").tween("cur", 0, 1).tween("progress", 30, 60).tween("elapsedMin", 25, 55).badge("Review"))
  .phase("p3", {
    duration: 2000,
    title: "承認 + SEO最適化",
    body: "lead承認 + SEOタグ 追加、 title / description / OG画像fix。 cur 1 → 2 tween (承認)、 進捗60 → 85 tween (ゲージ 針上振れ)、 elapsedMin 55 → 68 tween、 CMS laneで最終調整。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor", "writer-laptop", "laptop-cmsSite", "cmsSite-editor").tween("cur", 1, 2).tween("progress", 60, 85).tween("elapsedMin", 55, 68).badge("Approve"))
  .phase("p4", {
    duration: 2000,
    title: "発行 + CDN配信",
    body: "CMS → CDNデプロイ、 全国edgeキャッシュ + 記事 アーカイブ にURL + タグ 登録、 SEOインデックス キック。 cur 2 → 3 tween (発行)、 進捗85 → 100 tween (ゲージ 針最上位)、 publishedCount 12 → 13 tween (累計 +1)、 elapsedMin 68 → 75 tween、 CDN + アーカイブlane activate、 6 shape全active、 記事公開完遂。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor", "cdn", "archive", "writer-laptop", "laptop-cmsSite", "cmsSite-editor", "editor-cdn", "cdn-archive").tween("cur", 2, 3).tween("progress", 85, 100).tween("publishedCount", 12, 13).tween("elapsedMin", 68, 75).badge("Publish"))
  .build();

/**
 * 107. teamPresenceStatus v2 = リモート 5 名 team 1 日 presence 変化 4 phase シナリオ (朝 offline → 業務 online → 昼 away → 夕方 退勤)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-cylinder + shape-website の 6 shape で visual scene 化、 4 phase (09:00 出社 → 11:00 全員 online → 12:30 昼 away → 17:00 退勤) + 4 readout (userPresence / gauge online 率 / countup msg 数 / stat active 時間) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const teamPresenceStatus = diagram("interactive-team-presence", {
  topic: "リモートワーク5名チームの1日の在席状態変化",
})
  .lane("member", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("team", [
    ["Alice", "away"],
    ["Bob", "offline"],
    ["Carol", "online"],
    ["Dan", "offline"],
    ["Eve", "online"],
  ] as unknown as (string | number)[])
  .state("onlineRate", { initial: 0 })
  .state("msgCount", { initial: 0 })
  .state("activeHours", { initial: 0 })
  .node("lead", { lane: "member", stack: 0, kind: "shape-person", title: "チームlead Alice様", eyebrow: "lead", subtitle: "5名リモート チーム 主宰" })
  .node("slack", { lane: "member", stack: 1, kind: "shape-mobile-device", title: "Slackアプリ", eyebrow: "端末", subtitle: "presence送信 + msg受信" })
  .node("slackBackend", { lane: "service", stack: 0, kind: "shape-cloud", title: "Slackバックエンド", eyebrow: "cloud", subtitle: "全 メンバー 在席event集約" })
  .node("presenceSvr", { lane: "service", stack: 1, kind: "shape-server-rack", title: "presenceサーバー", eyebrow: "バックエンド", subtitle: "WebSocket + ハートビート30s" })
  .node("dashboard", { lane: "outcome", stack: 0, kind: "shape-website", title: "presenceダッシュボード", eyebrow: "UI", subtitle: "チーム 一覧dot表示" })
  .node("auditLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "auditログDB", eyebrow: "保存", subtitle: "1日のpresence履歴保存" })
  .edge("lead", "slack", { label: "起動", tone: "info" })
  .edge("slack", "slackBackend", { label: "在席", tone: "info" })
  .edge("slackBackend", "presenceSvr", { label: "ルーティング", tone: "accent" })
  .edge("presenceSvr", "dashboard", { label: "配信", tone: "success" })
  .edge("presenceSvr", "auditLog", { label: "保存", tone: "success" })
  .readout.userPresence("up", { source: "team", max: 6, label: "チーム 状態" })
  .readout.gauge("onlineG", { source: "onlineRate", min: 0, max: 100, color: "#22c55e", label: "online率 %" })
  .readout.countup("msgCU", { source: "msgCount", unit: " メッセージ", label: "1日msg", decimals: 0 })
  .readout.stat("actStat", { source: "activeHours", unit: " h", caption: "active時間", label: "有効" })
  .phase("p1", {
    duration: 1800,
    title: "朝 09:00 出社",
    body: "チーム メンバー 順次Slack起動、 Alice → Bob → Carol → Dan → Eveの順にonline遷移。 onlineRate 0 → 20 tween、 msgCount 0 → 5 tween、 activeHours 0 → 1 tween、 lead + slack lane有効。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "lead-slack").tween("onlineRate", 0, 20).tween("msgCount", 0, 5).tween("activeHours", 0, 1).badge("09:00"))
  .phase("p2", {
    duration: 2200,
    title: "11:00全員online",
    body: "10:00台に全員slack起動、 全員online到達、 presenceサーバー broadcast全端末に反映。 onlineRate 20 → 100 tween (ゲージ 針最上位)、 msgCount 5 → 32 tween、 activeHours 1 → 3 tween、 slackBackend + presenceSvr + ダッシュボードlane activate。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard", "lead-slack", "slack-slackBackend", "slackBackend-presenceSvr", "presenceSvr-dashboard").tween("onlineRate", 20, 100).tween("msgCount", 5, 32).tween("activeHours", 1, 3).badge("11:00"))
  .phase("p3", {
    duration: 2000,
    title: "12:30昼休憩away",
    body: "Alice + Bob昼休憩でaway、 Carol / Dan / Eveは集中作業でonline継続。 onlineRate 100 → 60 tween (下降)、 msgCount 32 → 40 tween、 activeHours 3 → 4 tween、 ダッシュボード 反映。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard", "lead-slack", "slack-slackBackend", "slackBackend-presenceSvr", "presenceSvr-dashboard").tween("onlineRate", 100, 60).tween("msgCount", 32, 40).tween("activeHours", 3, 4).badge("12:30"))
  .phase("p4", {
    duration: 2000,
    title: "17:00退勤mix",
    body: "Bob + Dan退勤でoffline、 Alice + Carol業務終盤away、 Eve残業online継続。 チーム = [Alice away, Bob offline, Carol online, Dan offline, Eve online] スナップショット。 onlineRate 60 → 20 tween、 msgCount 40 → 58 tween (最終)、 activeHours 4 → 8 tween、 auditLog activate、 6 shape全active、 1日presence履歴flush。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard", "auditLog", "lead-slack", "slack-slackBackend", "slackBackend-presenceSvr", "presenceSvr-dashboard", "presenceSvr-auditLog").tween("onlineRate", 60, 20).tween("msgCount", 40, 58).tween("activeHours", 4, 8).badge("17:00"))
  .build();

/**
 * 108. feedbackThumbRating v2 = SaaS 新機能 launch 1 週間 vote 集計 4 phase シナリオ (launch → 1 日目急増 → 3 日目 bug 発生 → 1 週間 fix 後安定)、 shape-person + shape-mobile-device + shape-website + shape-cylinder + shape-cloud + shape-server-rack の 6 shape で visual scene 化、 4 phase (launch 直後 → 1 日目 → 3 日目 down 発生 → 1 週間安定) + 4 readout (ratingThumb / gauge positive 率 / countup total votes / stat final score) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const feedbackThumbRating = diagram("interactive-feedback-rating", {
  topic: "SaaS新機能リリース後1週間の高評価と低評価の投票集計推移",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("votes", [128, 27])
  .state("positiveRate", { initial: 0 })
  .state("totalVotes", { initial: 0 })
  .state("finalScore", { initial: 0 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "早期利用者", eyebrow: "利用者", subtitle: "SaaS新機能を試すアーリーアダプター" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SaaSモバイル アプリ", eyebrow: "端末", subtitle: "新機能を利用 + feedbackボタン" })
  .node("form", { lane: "service", stack: 0, kind: "shape-website", title: "feedbackフォーム", eyebrow: "フォーム", subtitle: "▲ Good / ▼ Bad + free text" })
  .node("backend", { lane: "service", stack: 1, kind: "shape-server-rack", title: "投票API", eyebrow: "バックエンド", subtitle: "vote数 + score計算" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "分析", eyebrow: "分析", subtitle: "vote集計 + ダッシュボード配信" })
  .node("voteDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "vote履歴DB", eyebrow: "保存", subtitle: "利用者 別vote記録 + 監査" })
  .edge("user", "app", { label: "起動", tone: "info" })
  .edge("app", "form", { label: "▲ / ▼", tone: "info" })
  .edge("form", "backend", { label: "送信", tone: "success" })
  .edge("backend", "voteDb", { label: "保存", tone: "success" })
  .edge("backend", "analytics", { label: "集約", tone: "accent" })
  .readout.ratingThumb("rt", { source: "votes", colorUp: "#22c55e", colorDown: "#ef4444", label: "レビュー スコア" })
  .readout.gauge("posG", { source: "positiveRate", min: 0, max: 100, color: "#22c55e", label: "positive率 %" })
  .readout.countup("totCU", { source: "totalVotes", unit: " 件", label: "累計vote", decimals: 0 })
  .readout.stat("scoreStat", { source: "finalScore", unit: " pt", caption: "スコア", label: "スコア" })
  .phase("p1", {
    duration: 1800,
    title: "launch直後(Day 0)",
    body: "新機能 リリース 直後、 まず一握りのアーリーが試してfeedback送信。 positiveRate 0 → 83 tween、 totalVotes 0 → 6 tween、 finalScore 0 → 65 tween、 利用者 + アプリ + フォームlane有効。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "user-app", "app-form").tween("positiveRate", 0, 83).tween("totalVotes", 0, 6).tween("finalScore", 0, 65).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "1日目up vote急増",
    body: "SNSシェアで爆発的に 上vote増加、 バックエンド + voteDbで永続化キック。 positiveRate 83 → 93 tween (高値定着)、 totalVotes 6 → 45 tween、 finalScore 65 → 88 tween、 バックエンド + voteDb + 分析activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics", "user-app", "app-form", "form-backend", "backend-voteDb", "backend-analytics").tween("positiveRate", 83, 93).tween("totalVotes", 6, 45).tween("finalScore", 65, 88).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "3日目edge case bug発生",
    body: "特定iOS端末で バグ 発火、 下vote相次ぐ。 positiveRate 93 → 72 tween (下降、 ゲージ 針落ち)、 totalVotes 45 → 80 tween、 finalScore 88 → 65 tween、 分析 で アラート 発報。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics", "user-app", "app-form", "form-backend", "backend-voteDb", "backend-analytics").tween("positiveRate", 93, 72).tween("totalVotes", 45, 80).tween("finalScore", 88, 65).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "1週間fix後安定",
    body: "ホットフィックス リリース → 下vote収束、 上voteが再び伸長、 最終stableスコア に到達。 投票 = [128, 27] スナップショット。 positiveRate 72 → 83 tween (回復)、 totalVotes 80 → 155 tween、 finalScore 65 → 82 tween、 6 shape全active、 1週間集計完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics", "user-app", "app-form", "form-backend", "backend-voteDb", "backend-analytics").tween("positiveRate", 72, 83).tween("totalVotes", 80, 155).tween("finalScore", 65, 82).badge("Day 7"))
  .build();

/**
 * 109. startupOrgChart v2 = seed → Series A 直前 startup の 6 ヶ月成長 4 phase シナリオ (CEO 単独 → 2 VP 採用 → 3 IC 採用 → 業務体制)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-server-rack の 6 shape で visual scene 化、 4 phase (Seed → VP 採用 → IC 採用 → 業務体制) + 4 readout (orgChartMini / gauge 採用充足率 / countup headcount / stat monthly burn) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const startupOrgChart = diagram("interactive-startup-org", {
  topic: "seed期スタートアップが6ヶ月でCEO単独から6名体制まで拡大する組織成長",
})
  .lane("founder", { x: 0, width: 220 })
  .lane("hr", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("org", [
    ["Alice CEO", 0],
    ["Bob VP Eng", 1],
    ["Carol VP Sales", 1],
    ["Dan Eng", 2],
    ["Eve Eng", 2],
    ["Frank Sales", 2],
  ] as unknown as (string | number)[])
  .state("hireRate", { initial: 0 })
  .state("headcount", { initial: 1 })
  .state("monthlyBurn", { initial: 100 })
  .node("ceo", { lane: "founder", stack: 0, kind: "shape-person", title: "創業者Alice", eyebrow: "CEO", subtitle: "seed資金調達 + 6名採用計画" })
  .node("hrTool", { lane: "founder", stack: 1, kind: "shape-mobile-device", title: "Notion HR + Slack", eyebrow: "端末", subtitle: "採用管理 + 社内コミュニケーション" })
  .node("jobBoard", { lane: "hr", stack: 0, kind: "shape-website", title: "LinkedIn求人", eyebrow: "ボード", subtitle: "エンジニア / sales 6 slot公開" })
  .node("hris", { lane: "hr", stack: 1, kind: "shape-cloud", title: "HRIS (Deel)", eyebrow: "HR", subtitle: "契約 + payroll + 労務" })
  .node("orgDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "orgチャートDB", eyebrow: "保存", subtitle: "reporting行 + level履歴" })
  .node("dashboard", { lane: "outcome", stack: 1, kind: "shape-server-rack", title: "経営dashboard", eyebrow: "ボード", subtitle: "人数 / 消化rate / runway" })
  .edge("ceo", "hrTool", { label: "計画", tone: "info" })
  .edge("hrTool", "jobBoard", { label: "投稿", tone: "info" })
  .edge("jobBoard", "hris", { label: "採用", tone: "success" })
  .edge("hris", "orgDb", { label: "参加", tone: "success" })
  .edge("hris", "dashboard", { label: "報告", tone: "accent" })
  .readout.orgChartMini("oc", { source: "org", color: "#2563eb", label: "Org hierarchy" })
  .readout.gauge("hireG", { source: "hireRate", min: 0, max: 100, color: "#22c55e", label: "採用充足率 %" })
  .readout.countup("hcCU", { source: "headcount", unit: " 名", label: "人数", decimals: 0 })
  .readout.stat("burnStat", { source: "monthlyBurn", unit: " 万円", caption: "月次burn", label: "消化" })
  .phase("p1", {
    duration: 1800,
    title: "Seed期(CEO単独)",
    body: "Aliceがseed round完了、 まず1名で会社立ち上げ。 hireRate 0 → 17 tween、 人数1 keep、 monthlyBurn 100 → 150 tween、 CEO + hrTool lane有効。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "ceo-hrTool").tween("hireRate", 0, 17).tween("monthlyBurn", 100, 150).badge("Seed"))
  .phase("p2", {
    duration: 2200,
    title: "2 VP採用",
    body: "LinkedIn求人 → Bob VP Eng + Carol VP Sales採用、 HRIS契約完了。 hireRate 17 → 50 tween、 人数1 → 3 tween、 monthlyBurn 150 → 400 tween、 jobBoard + hris lane activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris", "ceo-hrTool", "hrTool-jobBoard", "jobBoard-hris").tween("hireRate", 17, 50).tween("headcount", 1, 3).tween("monthlyBurn", 150, 400).badge("VP"))
  .phase("p3", {
    duration: 2200,
    title: "3 IC採用",
    body: "Bob + CarolがDan / Eve / Frankを集中採用、 各 チーム にIC配属。 hireRate 50 → 100 tween (ゲージ 針最上位)、 人数3 → 6 tween、 monthlyBurn 400 → 720 tween、 orgDb activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris", "orgDb", "ceo-hrTool", "hrTool-jobBoard", "jobBoard-hris", "hris-orgDb").tween("hireRate", 50, 100).tween("headcount", 3, 6).tween("monthlyBurn", 400, 720).badge("IC"))
  .phase("p4", {
    duration: 2000,
    title: "業務体制確立",
    body: "6名でreporting line整備、 経営 ダッシュボード にheadcount / 消化rate反映、 Series A準備開始。 hireRate 100 keep (充足)、 人数6 keep、 monthlyBurn 720 → 800 tween (安定期)、 ダッシュボードactivate、 6 shape全active、 業務体制完遂。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris", "orgDb", "dashboard", "ceo-hrTool", "hrTool-jobBoard", "jobBoard-hris", "hris-orgDb", "hris-dashboard").tween("monthlyBurn", 720, 800).badge("体制"))
  .build();

/**
 * 110. npsTrendKpi v2 = SaaS CS チーム 半年 NPS 追跡 4 phase シナリオ (Q1 開始 → UX 改善リリース → 障害復旧 → 施策安定化)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-server-rack の 6 shape で visual scene 化、 4 phase (Q1 60 → Q2 70 → Q3 82 → Q4 82) + 4 readout (kpiTrendTile / gauge NPS ゾーン / countup 回答数 / stat delta) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const npsTrendKpi = diagram("interactive-nps-trend", {
  topic: "SaaSカスタマーサクセスチームが半年間でNPSを60から82に改善する軌跡",
})
  .lane("csLead", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("cur", { initial: 60 })
  .state("prev", { initial: 55 })
  .arraySignal("hist", [55, 60, 65, 70, 75, 82])
  .state("npsGauge", { initial: 60 })
  .state("respondents", { initial: 100 })
  .state("delta", { initial: 0 })
  .node("csLeadPerson", { lane: "csLead", stack: 0, kind: "shape-person", title: "CS lead篠原様", eyebrow: "顧客success", subtitle: "NPS主管 + 週次review" })
  .node("surveyApp", { lane: "csLead", stack: 1, kind: "shape-mobile-device", title: "surveyアプリ", eyebrow: "端末", subtitle: "四半期email配信 + 回答収集" })
  .node("feedbackForm", { lane: "service", stack: 0, kind: "shape-website", title: "feedbackフォーム", eyebrow: "フォーム", subtitle: "10 段階 + 自由記述" })
  .node("analytics", { lane: "service", stack: 1, kind: "shape-cloud", title: "NPS分析", eyebrow: "分析", subtitle: "促進 - 批判 = NPS計算" })
  .node("kpiDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "KPI履歴DB", eyebrow: "保存", subtitle: "6ヶ月trend保存" })
  .node("execBoard", { lane: "outcome", stack: 1, kind: "shape-server-rack", title: "経営 ボード", eyebrow: "ボード", subtitle: "四半期報告 + 目標対比" })
  .edge("csLeadPerson", "surveyApp", { label: "配信", tone: "info" })
  .edge("surveyApp", "feedbackForm", { label: "回答", tone: "info" })
  .edge("feedbackForm", "analytics", { label: "集計", tone: "success" })
  .edge("analytics", "kpiDb", { label: "保存", tone: "success" })
  .edge("analytics", "execBoard", { label: "報告", tone: "accent" })
  .readout.kpiTrendTile("kt", { source: "cur", prevSource: "prev", historySource: "hist", unit: "", colorPos: "#22c55e", colorNeg: "#ef4444", label: "NPS傾向" })
  .readout.gauge("npsG", { source: "npsGauge", min: 0, max: 100, color: "#22c55e", label: "NPSゾーン" })
  .readout.countup("respCU", { source: "respondents", unit: " 件", label: "回答数", decimals: 0 })
  .readout.stat("delStat", { source: "delta", unit: " pt", caption: "前四半期 変化量", label: "変化量" })
  .phase("p1", {
    duration: 1800,
    title: "Q1開始(NPS 60)",
    body: "1月email配信、 Q1初回計測。 cur 60 keep、 前55 keep、 npsGauge 0 → 60 tween、 respondents 0 → 100 tween、 変化量0 → 5 tween、 csLead + surveyApp lane有効。",
  }, (p: PhaseBuilder) => p.activate("csLeadPerson", "surveyApp", "csLeadPerson-surveyApp").tween("npsGauge", 0, 60).tween("respondents", 0, 100).tween("delta", 0, 5).badge("Q1 60"))
  .phase("p2", {
    duration: 2200,
    title: "Q2 UX改善リリース(NPS 70)",
    body: "大型UX改善リリース → 回答upvote増。 cur 60 → 70 tween、 前60 keep、 npsGauge 60 → 70 tween、 respondents 100 → 250 tween、 変化量5 → 10 tween、 feedbackForm + 分析lane activate。",
  }, (p: PhaseBuilder) => p.activate("csLeadPerson", "surveyApp", "feedbackForm", "analytics", "csLeadPerson-surveyApp", "surveyApp-feedbackForm", "feedbackForm-analytics").tween("cur", 60, 70).tween("npsGauge", 60, 70).tween("respondents", 100, 250).tween("delta", 5, 10).badge("Q2 70"))
  .phase("p3", {
    duration: 2200,
    title: "Q3障害復旧(NPS 82)",
    body: "6月本番障害 → ホットフィックス + 補償 → 顧客信頼回復でNPS急伸。 cur 70 → 82 tween、 前70 keep、 npsGauge 70 → 82 tween、 respondents 250 → 400 tween、 変化量10 → 12 tween、 kpiDb activate。",
  }, (p: PhaseBuilder) => p.activate("csLeadPerson", "surveyApp", "feedbackForm", "analytics", "kpiDb", "csLeadPerson-surveyApp", "surveyApp-feedbackForm", "feedbackForm-analytics", "analytics-kpiDb").tween("cur", 70, 82).tween("npsGauge", 70, 82).tween("respondents", 250, 400).tween("delta", 10, 12).badge("Q3 82"))
  .phase("p4", {
    duration: 2000,
    title: "Q4施策安定化(NPS 82)",
    body: "Q4でNPS 82定着、 経営 ボード で年次 レビュー、 目標80超え達成。 cur 82 keep、 前82 tween (更新)、 npsGauge 82 keep、 respondents 400 → 500 tween、 変化量12 → 7 tween、 execBoard activate、 6 shape全active、 半年 レビュー 完遂。",
  }, (p: PhaseBuilder) => p.activate("csLeadPerson", "surveyApp", "feedbackForm", "analytics", "kpiDb", "execBoard", "csLeadPerson-surveyApp", "surveyApp-feedbackForm", "feedbackForm-analytics", "analytics-kpiDb", "analytics-execBoard").tween("prev", 75, 82).tween("respondents", 400, 500).tween("delta", 12, 7).badge("Q4 82"))
  .build();

/**
 * 111. postReactionPoll v2 = SNS 投稿 1 週間 reaction 集計 4 phase シナリオ (投稿直後 → 拡散 → エンゲージ → 週末 total)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (投稿 → viral → engage → 週末集計) + 4 readout (quickPollEmoji / gauge viral 度 / countup total reactions / stat top emoji) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const postReactionPoll = diagram("interactive-post-reaction-poll", {
  topic: "SNS投稿の1週間で拡散、エンゲージメント、週末集計と進む反応の推移",
})
  .lane("poster", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("votes", [["👍", 42], ["❤️", 28], ["🎉", 15]] as unknown as (string | number)[])
  .state("viralRate", { initial: 0 })
  .state("totalReactions", { initial: 0 })
  .state("topCount", { initial: 0 })
  .node("poster", { lane: "poster", stack: 0, kind: "shape-person", title: "post投稿者 岩本様", eyebrow: "author", subtitle: "フォロワー 3000 名 · 週次投稿" })
  .node("app", { lane: "poster", stack: 1, kind: "shape-mobile-device", title: "SNSモバイル アプリ", eyebrow: "端末", subtitle: "投稿作成 + reaction通知受信" })
  .node("feed", { lane: "service", stack: 0, kind: "shape-website", title: "SNSフィード", eyebrow: "フィード", subtitle: "タイムライン + 反応UI" })
  .node("backend", { lane: "service", stack: 1, kind: "shape-cloud", title: "feedバックエンド", eyebrow: "cloud", subtitle: "反応 集約 + 通知" })
  .node("reactDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "反応DB", eyebrow: "保存", subtitle: "利用者 別emoji vote履歴" })
  .node("cdn", { lane: "outcome", stack: 1, kind: "shape-cdn-edge", title: "フィードCDN edge", eyebrow: "CDN", subtitle: "画像 + 反応pill配信" })
  .edge("poster", "app", { label: "投稿", tone: "info" })
  .edge("app", "feed", { label: "発行", tone: "info" })
  .edge("feed", "backend", { label: "反応", tone: "success" })
  .edge("backend", "reactDb", { label: "保存", tone: "success" })
  .edge("backend", "cdn", { label: "配信", tone: "accent" })
  .readout.quickPollEmoji("qp", { source: "votes", colorWinner: "#2563eb", label: "Reactions" })
  .readout.gauge("viralG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral度 %" })
  .readout.countup("totCU", { source: "totalReactions", unit: " 件", label: "総reaction", decimals: 0 })
  .readout.stat("topStat", { source: "topCount", unit: " 👍", caption: "上位emoji", label: "上位" })
  .phase("p1", {
    duration: 1800,
    title: "投稿直後(Day 0)",
    body: "岩本様が投稿、 フォロワーの一部が即reaction。 viralRate 0 → 10 tween、 totalReactions 0 → 8 tween、 topCount 0 → 5 tween、 poster + アプリ + フィードlane有効。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "poster-app", "app-feed").tween("viralRate", 0, 10).tween("totalReactions", 0, 8).tween("topCount", 0, 5).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "拡散(Day 1)",
    body: "フォロワーの拡散で 👍 急増、 バックエンド + reactDbで永続化キック。 viralRate 10 → 55 tween、 totalReactions 8 → 45 tween、 topCount 5 → 25 tween、 バックエンド + reactDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb", "poster-app", "app-feed", "feed-backend", "backend-reactDb").tween("viralRate", 10, 55).tween("totalReactions", 8, 45).tween("topCount", 5, 25).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "エンゲージ(Day 3)",
    body: "深いエンゲージメントで ❤️ + 🎉 増加、 CDN edgeで全リージョン配信。 viralRate 55 → 82 tween、 totalReactions 45 → 78 tween、 topCount 25 → 40 tween、 CDN activate。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb", "cdn", "poster-app", "app-feed", "feed-backend", "backend-reactDb", "backend-cdn").tween("viralRate", 55, 82).tween("totalReactions", 45, 78).tween("topCount", 25, 40).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "週末total (Day 7)",
    body: "週末に集計完了、 投票 = [👍 42, ❤️ 28, 🎉 15] スナップショット。 viralRate 82 → 95 tween (バズ)、 totalReactions 78 → 85 tween、 topCount 40 → 42 tween、 6 shape全active、 1週間集計完遂。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb", "cdn", "poster-app", "app-feed", "feed-backend", "backend-reactDb", "backend-cdn").tween("viralRate", 82, 95).tween("totalReactions", 78, 85).tween("topCount", 40, 42).badge("Day 7"))
  .build();

/**
 * 112. voiceMessagePlayback v2 = 通勤中の音声メモ受信 → 再生 4 phase シナリオ (電車内で通知 → 再生 → 巻戻し → 完了 + reply)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (受信 → 再生 → 巻戻し → 完了) + 4 readout (voiceMessage / gauge 再生率 / countup 累計 msg 数 / stat 再生秒) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const voiceMessagePlayback = diagram("interactive-voice-message-playback", {
  topic: "通勤中に受信した音声メモを再生、巻き戻し、完了して返信するまでの4ステップ",
})
  .lane("commuter", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("amps", [0.2, 0.4, 0.7, 0.9, 0.6, 0.3, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.4])
  .state("progress", { initial: 0 })
  .state("playRate", { initial: 0 })
  .state("msgCount", { initial: 12 })
  .state("playSec", { initial: 0 })
  .node("listener", { lane: "commuter", stack: 0, kind: "shape-person", title: "通勤者 池永様", eyebrow: "リスナー", subtitle: "電車内で音声メモ受信" })
  .node("phone", { lane: "commuter", stack: 1, kind: "shape-mobile-device", title: "iPhone + イヤホン", eyebrow: "端末", subtitle: "受信通知 + 波形再生UI" })
  .node("chatApp", { lane: "service", stack: 0, kind: "shape-website", title: "チャット アプリ", eyebrow: "アプリ", subtitle: "音声波形15バー + 再生progress" })
  .node("audioBackend", { lane: "service", stack: 1, kind: "shape-cloud", title: "音声配信 バックエンド", eyebrow: "cloud", subtitle: "波形解析 + streaming配信" })
  .node("msgDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "messageアーカイブ", eyebrow: "保存", subtitle: "音声msg + 波形 + 既読 履歴" })
  .node("edge", { lane: "outcome", stack: 1, kind: "shape-cdn-edge", title: "音声CDN edge", eyebrow: "CDN", subtitle: "近い基地局 キャッシュ + 低遅延" })
  .edge("listener", "phone", { label: "受信", tone: "info" })
  .edge("phone", "chatApp", { label: "起動", tone: "info" })
  .edge("chatApp", "audioBackend", { label: "ストリーム", tone: "success" })
  .edge("audioBackend", "edge", { label: "キャッシュ", tone: "accent" })
  .edge("audioBackend", "msgDb", { label: "保存", tone: "success" })
  .readout.voiceMessage("vm", { source: "amps", progressSource: "progress", duration: 23, colorPlay: "#2563eb", colorBar: "#cbd5e1", label: "音声メモ" })
  .readout.gauge("playG", { source: "playRate", min: 0, max: 100, color: "#22c55e", label: "再生率 %" })
  .readout.countup("msgCU", { source: "msgCount", unit: " 件", label: "累計msg", decimals: 0 })
  .readout.stat("secStat", { source: "playSec", unit: " 秒", caption: "再生 秒", label: "秒" })
  .phase("p1", {
    duration: 1800,
    title: "受信 (電車内)",
    body: "山手線内でAliceから音声メモ着信、 iPhone通知バナー表示。 進捗0 keep、 playRate 0 keep、 msgCount 12 → 13 tween、 playSec 0 keep、 リスナー + スマホlane有効。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "listener-phone").tween("msgCount", 12, 13).badge("受信"))
  .phase("p2", {
    duration: 2400,
    title: "再生開始",
    body: "イヤホン装着で再生タップ、 chatApp + audioBackend + edgeで低遅延 ストリーム 配信、 波形15バーが左から青くなっていく。 進捗0 → 0.7 tween、 playRate 0 → 70 tween、 playSec 0 → 16 tween、 chatApp + audioBackend + edge lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge", "listener-phone", "phone-chatApp", "chatApp-audioBackend", "audioBackend-edge").tween("progress", 0, 0.7).tween("playRate", 0, 70).tween("playSec", 0, 16).badge("再生"))
  .phase("p3", {
    duration: 2000,
    title: "巻戻し (聞き直し)",
    body: "重要ポイント聞き直しでprogress 0.7 → 0.4に巻戻し、 再生率一時的に下降、 波形の一部が再度idle色に。 playRate 70 → 40 tween、 playSec 16 → 9 tween。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge", "listener-phone", "phone-chatApp", "chatApp-audioBackend", "audioBackend-edge").tween("progress", 0.7, 0.4).tween("playRate", 70, 40).tween("playSec", 16, 9).badge("巻戻し"))
  .phase("p4", {
    duration: 2000,
    title: "再生完了 + 履歴保存",
    body: "最後まで再生、 msgDbに既読 フラグ + 波形 履歴保存。 進捗0.4 → 1 tween、 playRate 40 → 100 tween (ゲージ 針最上位)、 playSec 9 → 23 tween、 msgDb activate、 6 shape全active、 音声再生完遂。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge", "msgDb", "listener-phone", "phone-chatApp", "chatApp-audioBackend", "audioBackend-edge", "audioBackend-msgDb").tween("progress", 0.4, 1).tween("playRate", 40, 100).tween("playSec", 9, 23).badge("完了"))
  .build();

/**
 * 113. teamThreadSummary v2 = engineering team Slack チャンネル 1 日 会話量 4 phase シナリオ (朝静か → 昼のインシデント → 夕方の議論 → 夜の retro 引継)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (静か → インシデント → 議論 → retro 引継) + 4 readout (threadSummary / gauge burst 率 / countup 未読数 / stat 参加人数) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const teamThreadSummary = diagram("interactive-team-thread-summary", {
  topic: "エンジニアリングチームSlackの1日の会話量変化、朝の静けさから昼のインシデント、夕方の議論、夜のふりかえりまで",
})
  .lane("member", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("thread", [42, 12, "Bob", "5 分前"] as unknown as (string | number)[])
  .state("unreadCount", { initial: 0 })
  .state("burstRate", { initial: 0 })
  .state("participants", { initial: 0 })
  .node("dev", { lane: "member", stack: 0, kind: "shape-person", title: "engチーム12名", eyebrow: "チーム", subtitle: "チーム-engチャンネル参加者" })
  .node("slackApp", { lane: "member", stack: 1, kind: "shape-mobile-device", title: "Slackアプリ", eyebrow: "端末", subtitle: "通知 + 未読badge + 返信UI" })
  .node("channel", { lane: "service", stack: 0, kind: "shape-website", title: "チーム-eng channel", eyebrow: "channel", subtitle: "engineering主戦場 · 12名subscribe" })
  .node("workerFleet", { lane: "service", stack: 1, kind: "shape-server-rack", title: "Slackワーカー fleet", eyebrow: "バックエンド", subtitle: "メッセージfan-外 + 通知push" })
  .node("indexer", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "検索indexer", eyebrow: "検索", subtitle: "履歴index + ふりかえり 用検索" })
  .node("archive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "channelアーカイブ", eyebrow: "保存", subtitle: "全msg + threadツリー保存" })
  .edge("dev", "slackApp", { label: "投稿", tone: "info" })
  .edge("slackApp", "channel", { label: "発行", tone: "info" })
  .edge("channel", "workerFleet", { label: "fan-外", tone: "success" })
  .edge("workerFleet", "archive", { label: "保存", tone: "success" })
  .edge("workerFleet", "indexer", { label: "インデックス", tone: "accent" })
  .readout.threadSummary("ts", { source: "thread", colorUnread: "#ef4444", label: "スレッド概要" })
  .readout.gauge("burstG", { source: "burstRate", min: 0, max: 100, color: "#ef4444", label: "burst率 %" })
  .readout.countup("unrCU", { source: "unreadCount", unit: " 未読", label: "未読数", decimals: 0 })
  .readout.stat("partStat", { source: "participants", unit: " 名", caption: "参加者", label: "部品" })
  .phase("p1", {
    duration: 1500,
    title: "朝 静か",
    body: "朝09:00、 チーム ゆっくり出社。 unreadCount 0 → 2 tween、 burstRate 0 → 10 tween、 participants 0 → 3 tween、 開発 + slackApp lane有効。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "dev-slackApp").tween("unreadCount", 0, 2).tween("burstRate", 0, 10).tween("participants", 0, 3).badge("朝"))
  .phase("p2", {
    duration: 2200,
    title: "昼 インシデント発生",
    body: "13:00本番障害検知、 チーム-eng一斉招集、 msg急増。 unreadCount 2 → 28 tween、 burstRate 10 → 85 tween (ゲージ 針上振れ、 赤ゾーン)、 participants 3 → 9 tween、 channel + workerFleet lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet", "dev-slackApp", "slackApp-channel", "channel-workerFleet").tween("unreadCount", 2, 28).tween("burstRate", 10, 85).tween("participants", 3, 9).badge("障害"))
  .phase("p3", {
    duration: 2200,
    title: "夕方 議論継続",
    body: "ホットフィックス 後root cause議論継続、 threadが長く伸長。 unreadCount 28 → 42 tween、 burstRate 85 → 60 tween、 participants 9 → 12 tween、 indexer + アーカイブlane activate、 履歴 インデックス キック。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet", "indexer", "archive", "dev-slackApp", "slackApp-channel", "channel-workerFleet", "workerFleet-archive", "workerFleet-indexer").tween("unreadCount", 28, 42).tween("burstRate", 85, 60).tween("participants", 9, 12).badge("議論"))
  .phase("p4", {
    duration: 2000,
    title: "夜 ふりかえり 引継ぎ",
    body: "20:00ふりかえり チャンネルに要点 ピン、 明日の アクション項目 リストアップ。 unreadCount 42 keep (ふりかえり 用に残置)、 burstRate 60 → 25 tween (収束)、 participants 12 keep、 6 shape全active、 1日会話履歴flush。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet", "indexer", "archive", "dev-slackApp", "slackApp-channel", "channel-workerFleet", "workerFleet-archive", "workerFleet-indexer").tween("burstRate", 60, 25).badge("retro"))
  .build();

/**
 * 114. dmReadReceipt v2 = 商談 DM 既読 workflow 4 phase シナリオ (営業送信 → 配信 → 顧客既読 → reply)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (送信 → 配信 → 既読 → reply) + 4 readout (readReceipt / gauge 応答率 / countup 送信数 / stat 未読時間 min) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const dmReadReceipt = diagram("interactive-dm-read-receipt", {
  topic: "営業担当が顧客に一斉DMを送信、既読と返信が返るまでのフロー",
})
  .lane("sender", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("status", { initial: 0 })
  .state("responseRate", { initial: 0 })
  .state("sentCount", { initial: 0 })
  .state("unreadMin", { initial: 0 })
  .node("salesRep", { lane: "sender", stack: 0, kind: "shape-person", title: "営業 佐藤様", eyebrow: "sales", subtitle: "week 15件顧客DM予定" })
  .node("crmMobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "CRMモバイル アプリ", eyebrow: "端末", subtitle: "顧客リスト + DM一括送信" })
  .node("chatSvc", { lane: "service", stack: 0, kind: "shape-website", title: "WhatsApp Business", eyebrow: "サービス", subtitle: "商談DM配信 + 既読フック" })
  .node("dmRouter", { lane: "service", stack: 1, kind: "shape-server-rack", title: "DM router", eyebrow: "バックエンド", subtitle: "領収書event集約 + 顧客status" })
  .node("crmDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "CRM DB", eyebrow: "保存", subtitle: "顧客別DM + receipt履歴" })
  .node("insights", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "洞察", eyebrow: "分析", subtitle: "既読率 + reply率dashboard" })
  .edge("salesRep", "crmMobile", { label: "送信", tone: "info" })
  .edge("crmMobile", "chatSvc", { label: "発行", tone: "info" })
  .edge("chatSvc", "dmRouter", { label: "領収書", tone: "success" })
  .edge("dmRouter", "crmDb", { label: "保存", tone: "success" })
  .edge("dmRouter", "insights", { label: "集約", tone: "accent" })
  .readout.readReceipt("rr", { source: "status", colorRead: "#2563eb", colorPending: "#94a3b8", label: "既読状態" })
  .readout.gauge("resG", { source: "responseRate", min: 0, max: 100, color: "#22c55e", label: "応答率 %" })
  .readout.countup("sntCU", { source: "sentCount", unit: " 件", label: "送信数", decimals: 0 })
  .readout.stat("unrStat", { source: "unreadMin", unit: " 分", caption: "未読滞留", label: "未読" })
  .phase("p1", {
    duration: 1500,
    title: "09:42 送信",
    body: "佐藤様15件顧客にDM一括送信、 状態 = 0 (単チェック 灰)。 responseRate 0 keep、 sentCount 0 → 15 tween、 unreadMin 0 keep、 salesRep + crmMobile lane有効。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "salesRep-crmMobile").set("status", 0).tween("sentCount", 0, 15).badge("送信"))
  .phase("p2", {
    duration: 1800,
    title: "09:43 配信完了",
    body: "chatSvc + dmRouterで全15件配信、 状態 = 1 (二重チェック 灰)、 未読状態継続。 responseRate 0 keep、 unreadMin 0 → 15 tween、 chatSvc + dmRouter lane activate。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter", "salesRep-crmMobile", "crmMobile-chatSvc", "chatSvc-dmRouter").set("status", 1).tween("unreadMin", 0, 15).badge("配信"))
  .phase("p3", {
    duration: 2000,
    title: "09:45 顧客既読",
    body: "顧客12名が既読、 状態 = 2 (二重チェック 青)、 領収書 イベント がCRM DBに集約。 responseRate 0 → 80 tween、 unreadMin 15 → 3 tween、 crmDb + 洞察lane activate。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter", "crmDb", "insights", "salesRep-crmMobile", "crmMobile-chatSvc", "chatSvc-dmRouter", "dmRouter-crmDb", "dmRouter-insights").set("status", 2).tween("responseRate", 0, 80).tween("unreadMin", 15, 3).badge("既読"))
  .phase("p4", {
    duration: 2000,
    title: "10:00 reply受信",
    body: "顧客8名からreply、 insightsで応答率グラフ更新、 佐藤様が次アクション決定。 状態2 keep、 responseRate 80 → 53 tween (reply実数8/15)、 sentCount 15 keep、 unreadMin 3 → 0 tween、 6 shape全active、 商談DM cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter", "crmDb", "insights", "salesRep-crmMobile", "crmMobile-chatSvc", "chatSvc-dmRouter", "dmRouter-crmDb", "dmRouter-insights").tween("responseRate", 80, 53).tween("unreadMin", 3, 0).badge("reply"))
  .build();

/**
 * 115. formPasswordCheck v2 = SaaS 新規サインアップの password 強化 4 phase シナリオ (弱 pw 入力 → 大小混合 → 数字追加 → 記号で 4 段階完成)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (弱 1 → 中 2 → 強 3 → 最強 4) + 4 readout (passwordStrength / gauge 強度 / countup 満たしたルール数 / stat 予想解読時間) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const formPasswordCheck = diagram("interactive-form-password-check", {
  topic: "サインアップフォームでパスワード強度が弱から最強まで4レベル遷移",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("pw", { initial: 1 })
  .state("strengthScore", { initial: 25 })
  .state("rulesPassed", { initial: 1 })
  .state("crackDays", { initial: 0 })
  .node("newuser", { lane: "user", stack: 0, kind: "shape-person", title: "新規登録者 山田様", eyebrow: "利用者", subtitle: "SaaS trial登録中" })
  .node("browser", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "ブラウザ + 1Password", eyebrow: "端末", subtitle: "サインアップ フォーム + 自動生成候補" })
  .node("signupPage", { lane: "service", stack: 0, kind: "shape-website", title: "サインアップ画面", eyebrow: "フォーム", subtitle: "password入力 + 強度メーター表示" })
  .node("authSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "認証 バックエンド", eyebrow: "認証", subtitle: "強度評価 + bcryptハッシュ" })
  .node("secOps", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "SecOps監視", eyebrow: "security", subtitle: "弱passwordリスト照合 + 通知" })
  .node("userDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "利用者DB", eyebrow: "保存", subtitle: "ハッシュ + salt + 強度metadata" })
  .edge("newuser", "browser", { label: "入力", tone: "info" })
  .edge("browser", "signupPage", { label: "送信", tone: "info" })
  .edge("signupPage", "authSvc", { label: "評価", tone: "success" })
  .edge("authSvc", "secOps", { label: "チェック", tone: "accent" })
  .edge("authSvc", "userDb", { label: "保存", tone: "success" })
  .readout.passwordStrength("ps", { source: "pw", colorStrong: "#22c55e", colorWeak: "#ef4444", label: "強度" })
  .readout.gauge("scoreG", { source: "strengthScore", min: 0, max: 100, color: "#22c55e", label: "強度スコア" })
  .readout.countup("rulesCU", { source: "rulesPassed", unit: " ルール", label: "満たしたルール", decimals: 0 })
  .readout.stat("crackStat", { source: "crackDays", unit: " 日", caption: "予想解読", label: "解読" })
  .phase("p1", {
    duration: 1500,
    title: "弱pw入力(レベル1)",
    body: "山田様が短いpw入力、 メーター 1セグメント赤。 pw = 1、 strengthScore 25 keep、 rulesPassed 1 → 1 keep、 crackDays 0 → 1 tween (実質 秒 注文)、 newuser + ブラウザ + signupPage lane有効。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "newuser-browser", "browser-signupPage").set("pw", 1).tween("crackDays", 0, 1).badge("弱 1"))
  .phase("p2", {
    duration: 2000,
    title: "大小混合(レベル2)",
    body: "大小混合追加、 pw = 2、 メーター 2セグメント橙。 strengthScore 25 → 50 tween、 rulesPassed 1 → 2 tween、 crackDays 1 → 30 tween、 authSvc lane activate、 強度評価API呼出。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc", "newuser-browser", "browser-signupPage", "signupPage-authSvc").tween("pw", 1, 2).tween("strengthScore", 25, 50).tween("rulesPassed", 1, 2).tween("crackDays", 1, 30).badge("中 2"))
  .phase("p3", {
    duration: 2000,
    title: "数字追加(レベル3)",
    body: "数字混入、 pw = 3、 メーター 3セグメント黄緑。 strengthScore 50 → 75 tween、 rulesPassed 2 → 3 tween、 crackDays 30 → 365 tween、 secOps activate、 弱 パスワード リスト照合pass。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc", "secOps", "newuser-browser", "browser-signupPage", "signupPage-authSvc", "authSvc-secOps").tween("pw", 2, 3).tween("strengthScore", 50, 75).tween("rulesPassed", 2, 3).tween("crackDays", 30, 365).badge("強 3"))
  .phase("p4", {
    duration: 2000,
    title: "記号追加(レベル4最強)",
    body: "記号混入、 pw = 4、 メーター 4セグメント全緑。 strengthScore 75 → 100 tween (ゲージ 針最上位)、 rulesPassed 3 → 4 tween、 crackDays 365 → 10000 tween、 userDb activate、 bcryptハッシュ 保存完了、 6 shape全active、 サインアップ 完遂。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc", "secOps", "userDb", "newuser-browser", "browser-signupPage", "signupPage-authSvc", "authSvc-secOps", "authSvc-userDb").tween("pw", 3, 4).tween("strengthScore", 75, 100).tween("rulesPassed", 3, 4).tween("crackDays", 365, 10000).badge("最強 4"))
  .build();

/**
 * 116. loginOtpVerify v2 = 銀行アプリ 2 段階認証 OTP ログイン 4 phase シナリオ (SMS 送信 → ユーザ入力 → 検証 → ログイン成功)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-server-rack + shape-cylinder の 6 shape で visual scene 化、 4 phase (SMS 送信 → 入力 → 検証 → 成功) + 4 readout (otpInput / gauge 入力進捗 / countup 累計成功回数 / stat 検証秒) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const loginOtpVerify = diagram("interactive-login-otp-verify", {
  topic: "銀行アプリの2段階認証でSMS OTPを受信して入力、検証してログイン成功するまで",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("otp", [4, 8, 2, 1, 5, 7])
  .state("entered", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("successCount", { initial: 145 })
  .state("verifySec", { initial: 0 })
  .node("customer", { lane: "user", stack: 0, kind: "shape-person", title: "銀行online利用者 森様", eyebrow: "顧客", subtitle: "週次残高照会 + 送金" })
  .node("smartphone", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone bankingアプリ", eyebrow: "端末", subtitle: "SMS受信 + 6桁入力UI" })
  .node("bankApp", { lane: "service", stack: 0, kind: "shape-website", title: "bankingアプリ", eyebrow: "アプリ", subtitle: "OTP入力欄 + 2段階検証" })
  .node("smsGateway", { lane: "service", stack: 1, kind: "shape-cloud", title: "SMSゲートウェイ", eyebrow: "SMS", subtitle: "TTL 3最小 + 送信履歴" })
  .node("authSvc", { lane: "outcome", stack: 0, kind: "shape-server-rack", title: "認証 バックエンド", eyebrow: "認証", subtitle: "OTP照合 + セッションtoken発行" })
  .node("auditLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "監査 ログ", eyebrow: "監査", subtitle: "login履歴 + 不審行動flag" })
  .edge("customer", "smartphone", { label: "起動", tone: "info" })
  .edge("smartphone", "bankApp", { label: "ログイン", tone: "info" })
  .edge("bankApp", "smsGateway", { label: "送信", tone: "info" })
  .edge("bankApp", "authSvc", { label: "検証", tone: "success" })
  .edge("authSvc", "auditLog", { label: "ログ", tone: "accent" })
  .readout.otpInput("oi", { source: "otp", colorFocus: "#2563eb", label: "OTPコード" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "入力進捗 %" })
  .readout.countup("sucCU", { source: "successCount", unit: " 回", label: "累計成功", decimals: 0 })
  .readout.stat("verStat", { source: "verifySec", unit: " 秒", caption: "検証所要", label: "秒" })
  .phase("p1", {
    duration: 1500,
    title: "SMS送信",
    body: "森様が ログイン 開始、 銀行アプリがSMSゲートウェイ 経由で6桁OTP送信。 entered 0 keep、 進捗0 → 10 tween、 successCount 145 keep、 verifySec 0 → 3 tween、 顧客 + smartphone + bankApp + smsGateway lane有効。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "customer-smartphone", "smartphone-bankApp", "bankApp-smsGateway").tween("progress", 0, 10).tween("verifySec", 0, 3).badge("送信"))
  .phase("p2", {
    duration: 2200,
    title: "入力中",
    body: "SMS到着 → 森様が1桁ずつ入力、 focusボックス右移動。 entered 0 → 6 tween、 進捗10 → 90 tween、 verifySec 3 → 12 tween、 入力UIでvisible進行。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "customer-smartphone", "smartphone-bankApp", "bankApp-smsGateway").tween("entered", 0, 6).tween("progress", 10, 90).tween("verifySec", 3, 12).badge("入力"))
  .phase("p3", {
    duration: 1800,
    title: "検証",
    body: "6桁揃い自動送信、 authSvcでOTP照合 + セッション トークン 発行。 進捗90 → 100 tween、 successCount 145 → 146 tween、 verifySec 12 → 14 tween、 authSvc lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "authSvc", "customer-smartphone", "smartphone-bankApp", "bankApp-smsGateway", "bankApp-authSvc").tween("progress", 90, 100).tween("successCount", 145, 146).tween("verifySec", 12, 14).badge("検証"))
  .phase("p4", {
    duration: 2000,
    title: "ログイン成功",
    body: "セッション トークン 発行、 認証済状態で残高画面遷移、 監査 ログ 記録。 entered 6 keep、 進捗100 keep、 successCount 146 keep、 verifySec 14 → 15 tween、 auditLog lane activate、 6 shape全active、 2FAログイン 完遂。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "authSvc", "auditLog", "customer-smartphone", "smartphone-bankApp", "bankApp-smsGateway", "bankApp-authSvc", "authSvc-auditLog").tween("verifySec", 14, 15).badge("成功"))
  .build();

/**
 * 117. profileAvatarUpload v2 = SaaS profile 設定でアバター画像 upload 4 phase シナリオ (未選択 → ファイル選択 → upload → プレビュー確定)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (未選択 → 選択 → upload → プレビュー) + 4 readout (fileDropzone / gauge upload % / countup ファイルサイズ KB / stat 処理秒) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const profileAvatarUpload = diagram("interactive-profile-avatar-upload", {
  topic: "SaaSプロフィール画像をドロップ、アップロード、CDN配信、プレビュー確定するまで",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("file", { initial: "" })
  .state("uploadPct", { initial: 0 })
  .state("fileSize", { initial: 0 })
  .state("procSec", { initial: 0 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "profile更新者 花田様", eyebrow: "利用者", subtitle: "SaaS profileアバター更新中" })
  .node("laptop", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "MacBook + Finder", eyebrow: "端末", subtitle: "アバター-2024.png (245 KB)選択" })
  .node("uploadPage", { lane: "service", stack: 0, kind: "shape-website", title: "profile設定", eyebrow: "フォーム", subtitle: "dropzone + 80×80プレビュー" })
  .node("uploadSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "uploadバックエンド", eyebrow: "バックエンド", subtitle: "resize + crop + AV scan" })
  .node("imgCdn", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "画像CDN (S3 + CloudFront)", eyebrow: "CDN", subtitle: "80×80 / 200×200 / 512×512 3 size配信" })
  .node("profileDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "プロフィールDB", eyebrow: "保存", subtitle: "user_id → avatar_url地図 + 履歴" })
  .edge("user", "laptop", { label: "選択", tone: "info" })
  .edge("laptop", "uploadPage", { label: "低下", tone: "info" })
  .edge("uploadPage", "uploadSvc", { label: "投稿", tone: "success" })
  .edge("uploadSvc", "imgCdn", { label: "発行", tone: "accent" })
  .edge("uploadSvc", "profileDb", { label: "保存URL", tone: "success" })
  .readout.fileDropzone("fd", { source: "file", colorActive: "#2563eb", label: "アバター ファイル" })
  .readout.gauge("upG", { source: "uploadPct", min: 0, max: 100, color: "#22c55e", label: "upload %" })
  .readout.countup("sizeCU", { source: "fileSize", unit: " KB", label: "ファイルサイズ", decimals: 0 })
  .readout.stat("procStat", { source: "procSec", unit: " 秒", caption: "処理時間", label: "秒" })
  .phase("p1", {
    duration: 1500,
    title: "未選択",
    body: "花田様が プロファイル 設定画面へ、 dropzoneが破線枠 + '⬆ ここにドロップ' 表示。 file = ''、 uploadPct 0 keep、 fileSize 0 keep、 procSec 0 keep、 利用者 + ノートPC + uploadPage lane有効。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "user-laptop", "laptop-uploadPage").set("file", "").badge("未選択"))
  .phase("p2", {
    duration: 1800,
    title: "ファイル選択",
    body: "Finderから アバター-2024.pngドラッグ、 dropzoneが青枠 + ファイル名カード表示。 file → 'アバター-2024.png'、 uploadPct 0 → 15 tween、 fileSize 0 → 245 tween、 procSec 0 → 1 tween。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "user-laptop", "laptop-uploadPage").set("file", "avatar-2024.png").tween("uploadPct", 0, 15).tween("fileSize", 0, 245).tween("procSec", 0, 1).badge("選択"))
  .phase("p3", {
    duration: 2200,
    title: "upload中",
    body: "uploadSvcへ 投稿、 AV scan + resize (80/200/512)実行、 CDNへ 発行 キック。 uploadPct 15 → 90 tween、 procSec 1 → 4 tween、 uploadSvc + imgCdn lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "uploadSvc", "imgCdn", "user-laptop", "laptop-uploadPage", "uploadPage-uploadSvc", "uploadSvc-imgCdn").tween("uploadPct", 15, 90).tween("procSec", 1, 4).badge("upload"))
  .phase("p4", {
    duration: 2000,
    title: "プレビュー確定",
    body: "CDN配信済、 profileDbにavatar_url保存、 プロファイル 画面に円形プレビュー表示。 uploadPct 90 → 100 tween (ゲージ 針最上位)、 procSec 4 → 5 tween、 profileDb lane activate、 6 shape全active、 アバター更新完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "uploadSvc", "imgCdn", "profileDb", "user-laptop", "laptop-uploadPage", "uploadPage-uploadSvc", "uploadSvc-imgCdn", "uploadSvc-profileDb").tween("uploadPct", 90, 100).tween("procSec", 4, 5).badge("確定"))
  .build();

/**
 * 118. prodLogTail v2 = SRE on-call 深夜 production 障害対応 4 phase シナリオ (通常運転 → 警告検知 → 障害発火 → 復旧完了)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (通常 → 警告 → 障害 → 復旧) + 4 readout (logStream / gauge 重篤度 / countup log/min / stat MTTR 分) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const prodLogTail = diagram("interactive-prod-log-tail", {
  topic: "SRE深夜対応で本番障害のログを追跡する4段階、通常から警告、障害、復旧まで",
})
  .lane("sre", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("logs", [
    ["09:00:12", 1, "server 起動完了"],
    ["09:00:15", 1, "db connection pool 20"],
    ["09:01:03", 2, "メモリ使用率 82%"],
    ["09:01:47", 3, "worker crash: OOM"],
    ["09:02:02", 1, "worker 再起動 ok"],
  ] as unknown as (string | number)[])
  .state("severity", { initial: 0 })
  .state("logsPerMin", { initial: 200 })
  .state("mttr", { initial: 0 })
  .node("oncall", { lane: "sre", stack: 0, kind: "shape-person", title: "オン-呼出SRE中野様", eyebrow: "SRE", subtitle: "深夜対応 · 2 週交代" })
  .node("pager", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "PagerDuty + Terminal", eyebrow: "端末", subtitle: "SSH + kubectl + ログtail" })
  .node("prodCluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "本番K8sクラスター", eyebrow: "本番", subtitle: "ワーカー Pod × 20 + Web × 8" })
  .node("logForwarder", { lane: "service", stack: 1, kind: "shape-iot-sensor", title: "ログforwarder", eyebrow: "sensor", subtitle: "全podログ 集約 + level判定" })
  .node("logSink", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "ログSaaS (Datadog)", eyebrow: "sink", subtitle: "tail画面 + アラート 発報" })
  .node("logArchive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "ログarchive (S3)", eyebrow: "保存", subtitle: "30 日保持 + 分析クエリ" })
  .edge("oncall", "pager", { label: "受信", tone: "info" })
  .edge("pager", "prodCluster", { label: "SSH", tone: "info" })
  .edge("prodCluster", "logForwarder", { label: "ストリーム", tone: "info" })
  .edge("logForwarder", "logSink", { label: "ルーティング", tone: "success" })
  .edge("logSink", "logArchive", { label: "保存", tone: "accent" })
  .readout.logStream("ls", { source: "logs", label: "ログtail" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 3, color: "#ef4444", label: "重篤度" })
  .readout.countup("lpmCU", { source: "logsPerMin", unit: " /分", label: "ログ/最小", decimals: 0 })
  .readout.stat("mttrStat", { source: "mttr", unit: " 分", caption: "MTTR", label: "MTTR" })
  .phase("p1", {
    duration: 1800,
    title: "通常運転 (23:00)",
    body: "中野様は待機状態、 本番クラスター がINFログのみ流す。 深刻度0 keep、 logsPerMin 200 keep、 MTTR 0 keep、 prodCluster + logForwarder + logSink lane有効。",
  }, (p: PhaseBuilder) => p.activate("prodCluster", "logForwarder", "logSink", "prodCluster-logForwarder", "logForwarder-logSink").set("severity", 0).badge("通常"))
  .phase("p2", {
    duration: 2000,
    title: "警告発生 (01:03)",
    body: "メモリ82% 継続でWRN発報、 中野様PagerDutyで起床。 深刻度0 → 2 tween、 logsPerMin 200 → 450 tween、 MTTR 0 → 2 tween、 oncall + pager lane activate。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink", "oncall-pager", "pager-prodCluster", "prodCluster-logForwarder", "logForwarder-logSink").tween("severity", 0, 2).tween("logsPerMin", 200, 450).tween("mttr", 0, 2).badge("警告"))
  .phase("p3", {
    duration: 2200,
    title: "障害発火 (01:47)",
    body: "ワーカー OOMでERR発生、 中野様SSHで状況確認 + ホットフィックスrollout。 深刻度2 → 3 tween、 logsPerMin 450 → 850 tween、 MTTR 2 → 10 tween、 logArchive activate、 全lane full有効。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink", "logArchive", "oncall-pager", "pager-prodCluster", "prodCluster-logForwarder", "logForwarder-logSink", "logSink-logArchive").tween("severity", 2, 3).tween("logsPerMin", 450, 850).tween("mttr", 2, 10).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "復旧完了 (02:02)",
    body: "ワーカー 再起動 + memory制限 引き上げ、 INFログに戻る。 深刻度3 → 0 tween (グリーン復帰)、 logsPerMin 850 → 220 tween、 MTTR 10 → 15 tween (最終)、 6 shape全active、 postmortem起票。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink", "logArchive", "oncall-pager", "pager-prodCluster", "prodCluster-logForwarder", "logForwarder-logSink", "logSink-logArchive").tween("severity", 3, 0).tween("logsPerMin", 850, 220).tween("mttr", 10, 15).badge("復旧"))
  .build();

/**
 * 119. opsAlertBanner v2 = SaaS 運用 CPU 継続超過 alert エスカレ 4 phase シナリオ (info 検知 → warn 継続 → error 逸脱 → 対応済み)、 shape-person + shape-mobile-device + shape-iot-sensor + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (info → warn → error → 対応済) + 4 readout (alertBanner / gauge 重要度 / countup Ack 数 / stat 対応秒) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const opsAlertBanner = diagram("interactive-ops-alert-banner", {
  topic: "SaaSのCPU継続超過が情報通知から警告、エラーへエスカレーションする対応フロー",
})
  .lane("operator", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("alert", [3, "CPU 92% を 5 分継続 — 調査要"] as unknown as (string | number)[])
  .state("sev", { initial: 0 })
  .state("ackCount", { initial: 0 })
  .state("responseSec", { initial: 0 })
  .node("opsUser", { lane: "operator", stack: 0, kind: "shape-person", title: "運用 大野様", eyebrow: "運用", subtitle: "日勤当番 + PagerDuty受信" })
  .node("phone", { lane: "operator", stack: 1, kind: "shape-mobile-device", title: "PagerDutyアプリ", eyebrow: "端末", subtitle: "banner表示 + Ackボタン" })
  .node("sensor", { lane: "service", stack: 0, kind: "shape-iot-sensor", title: "Prometheus exporter", eyebrow: "sensor", subtitle: "CPU / mem / disk 15s抽出" })
  .node("prodWeb", { lane: "service", stack: 1, kind: "shape-server-rack", title: "本番-Web-3", eyebrow: "本番", subtitle: "対象pod · CPU逼迫中" })
  .node("alertMgr", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "AlertManager", eyebrow: "アラート", subtitle: "sevエスカレ + Slack通知" })
  .node("incDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "incident DB", eyebrow: "保存", subtitle: "履歴 + MTTA / MTTR追跡" })
  .edge("opsUser", "phone", { label: "受信", tone: "info" })
  .edge("phone", "alertMgr", { label: "Ack", tone: "info" })
  .edge("sensor", "prodWeb", { label: "抽出", tone: "info" })
  .edge("sensor", "alertMgr", { label: "発火", tone: "warning" })
  .edge("alertMgr", "incDb", { label: "保存", tone: "accent" })
  .readout.alertBanner("ab", { source: "alert", label: "アラート" })
  .readout.gauge("sevG", { source: "sev", min: 0, max: 3, color: "#ef4444", label: "重要度" })
  .readout.countup("ackCU", { source: "ackCount", unit: " 件", label: "Ack累計", decimals: 0 })
  .readout.stat("resStat", { source: "responseSec", unit: " 秒", caption: "対応時間", label: "結果" })
  .phase("p1", {
    duration: 1500,
    title: "info検知",
    body: "sensorでCPU 85% 検知、 alertMgrが 情報 発報、 大野様 ダッシュボード で確認。 sev 0 keep、 ackCount 0 → 1 tween、 responseSec 0 → 5 tween、 sensor + prodWeb + alertMgr lane有効。",
  }, (p: PhaseBuilder) => p.activate("sensor", "prodWeb", "alertMgr", "sensor-prodWeb", "sensor-alertMgr").set("sev", 0).tween("ackCount", 0, 1).tween("responseSec", 0, 5).badge("info"))
  .phase("p2", {
    duration: 1800,
    title: "warn継続",
    body: "CPU 92% で5分継続、 alertMgrが 警告 エスカレ、 大野様PagerDutyバナー 受信。 sev 0 → 2 tween、 ackCount 1 → 2 tween、 responseSec 5 → 30 tween、 opsUser + スマホlane activate。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr", "opsUser-phone", "phone-alertMgr", "sensor-prodWeb", "sensor-alertMgr").tween("sev", 0, 2).tween("ackCount", 1, 2).tween("responseSec", 5, 30).badge("warn"))
  .phase("p3", {
    duration: 2000,
    title: "error逸脱",
    body: "対応期限15分超過で エラー エスカレ、 上長召集 + ホットフィックス 準備。 sev 2 → 3 tween、 ackCount 2 → 3 tween、 responseSec 30 → 120 tween、 incDb activate、 全lane full。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr", "incDb", "opsUser-phone", "phone-alertMgr", "sensor-prodWeb", "sensor-alertMgr", "alertMgr-incDb").tween("sev", 2, 3).tween("ackCount", 2, 3).tween("responseSec", 30, 120).badge("error"))
  .phase("p4", {
    duration: 2000,
    title: "対応済み",
    body: "auto-scale発火 + ホットフィックスrollout、 CPU 65% に落着き アラート 解除。 sev 3 → 0 tween (グリーン復帰)、 ackCount 3 → 4 tween、 responseSec 120 → 180 tween (最終)、 6 shape全active、 postmortem予約。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr", "incDb", "opsUser-phone", "phone-alertMgr", "sensor-prodWeb", "sensor-alertMgr", "alertMgr-incDb").tween("sev", 3, 0).tween("ackCount", 3, 4).tween("responseSec", 120, 180).badge("対応済"))
  .build();

/**
 * 120. serviceHealthGrid v2 = SaaS platform 6 microservice health matrix 4 phase シナリオ (全稼働 → db 劣化 → queue 障害 → 復旧)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (全稼働 → 劣化 → 障害 → 復旧) + 4 readout (serviceHealth / gauge healthy 率 / countup incident 数 / stat uptime %) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const serviceHealthGrid = diagram("interactive-service-health-grid", {
  topic: "6つのマイクロサービスの健全性が全稼働から劣化、障害、復旧まで変化する",
})
  .lane("sre", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("svcs", [
    ["api", 2],
    ["web", 2],
    ["auth", 2],
    ["db", 1],
    ["cache", 1],
    ["queue", 0],
  ] as unknown as (string | number)[])
  .state("healthy", { initial: 6 })
  .state("incidentCount", { initial: 0 })
  .state("uptime", { initial: 100 })
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "SREリーダー 江口様", eyebrow: "SRE", subtitle: "6 svc監視 + オン-呼出rotate" })
  .node("dash", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "状態 ダッシュボード", eyebrow: "端末", subtitle: "6 svcグリッド + health signal" })
  .node("cluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "本番K8sクラスター", eyebrow: "本番", subtitle: "6マイクロサービスdeploy + ingress" })
  .node("healthSensor", { lane: "service", stack: 1, kind: "shape-iot-sensor", title: "ヘルスチェックsensor", eyebrow: "sensor", subtitle: "各svc /healthz 15s判定" })
  .node("statusPage", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "publicステータスページ", eyebrow: "状態", subtitle: "顧客向けuptime表示" })
  .node("slaDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "SLA履歴DB", eyebrow: "保存", subtitle: "incident + downtime集計" })
  .edge("sre", "dash", { label: "監視", tone: "info" })
  .edge("dash", "healthSensor", { label: "ポーリング", tone: "info" })
  .edge("healthSensor", "cluster", { label: "探査", tone: "info" })
  .edge("healthSensor", "statusPage", { label: "発行", tone: "success" })
  .edge("healthSensor", "slaDb", { label: "ログ", tone: "accent" })
  .readout.serviceHealth("sh", { source: "svcs", label: "サービス (6)" })
  .readout.gauge("healthG", { source: "healthy", min: 0, max: 6, color: "#22c55e", label: "healthy数" })
  .readout.countup("incCU", { source: "incidentCount", unit: " 件", label: "incident累計", decimals: 0 })
  .readout.stat("uptStat", { source: "uptime", unit: " %", caption: "稼働", label: "上" })
  .phase("p1", {
    duration: 1500,
    title: "全稼働(6/6 healthy)",
    body: "全svc上、 ステータスページgreen、 江口様待機。 healthy 6 keep、 incidentCount 0 keep、 稼働100 keep、 SRE + dash + クラスター + healthSensor + statusPage lane有効。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "sre-dash", "dash-healthSensor", "healthSensor-cluster", "healthSensor-statusPage").badge("全稼働"))
  .phase("p2", {
    duration: 1800,
    title: "DB + キャッシュ 劣化",
    body: "DBレプリカ遅延 + キャッシュeviction頻発、 2 svcがdegraded。 healthy 6 → 4 tween、 incidentCount 0 → 1 tween、 稼働100 → 99.5 tween、 ステータスページyellow警告。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "sre-dash", "dash-healthSensor", "healthSensor-cluster", "healthSensor-statusPage").tween("healthy", 6, 4).tween("incidentCount", 0, 1).tween("uptime", 100, 99.5).badge("劣化"))
  .phase("p3", {
    duration: 2000,
    title: "キュー 障害(cascade)",
    body: "キュー 完全 下、 DBとのcascadeで ステータスページred。 healthy 4 → 3 tween、 incidentCount 1 → 2 tween、 稼働99.5 → 98 tween、 slaDb activate、 全lane full。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "slaDb", "sre-dash", "dash-healthSensor", "healthSensor-cluster", "healthSensor-statusPage", "healthSensor-slaDb").tween("healthy", 4, 3).tween("incidentCount", 1, 2).tween("uptime", 99.5, 98).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "全復旧",
    body: "ホットフィックスrollout + キュー 再起動で全svc上、 ステータスページgreen復帰。 healthy 3 → 6 tween、 incidentCount 2 keep、 稼働98 → 99.7 tween (下方修正)、 6 shape全active、 SLA report生成。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "slaDb", "sre-dash", "dash-healthSensor", "healthSensor-cluster", "healthSensor-statusPage", "healthSensor-slaDb").tween("healthy", 3, 6).tween("uptime", 98, 99.7).badge("復旧"))
  .build();

/**
 * 121. checkoutCartSummary v2 = EC ショッピングカート checkout 4 phase シナリオ (商品追加 → 送料計算 → クーポン → 決済確定)、 shape-person + shape-mobile-device + shape-online-shop + shape-warehouse + shape-brokerage + shape-cylinder の 6 shape で visual scene 化、 4 phase (商品追加 → 送料 → クーポン → 決済) + 4 readout (cartSummary / gauge 予算消費率 / countup 商品点数 / stat 節約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const checkoutCartSummary = diagram("interactive-checkout-cart-summary", {
  topic: "ECショッピングカートに商品追加、送料計算、クーポン適用、決済確定までの4ステップ",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("cart", [3, 149.85, 8.5, 158.35])
  .state("total", { initial: 0 })
  .state("budgetPct", { initial: 0 })
  .state("itemCount", { initial: 0 })
  .state("savedAmt", { initial: 0 })
  .node("shopper", { lane: "buyer", stack: 0, kind: "shape-person", title: "shopper木崎様", eyebrow: "購入者", subtitle: "夜のオンライン買い物中" })
  .node("mobile", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhoneのECアプリ", eyebrow: "端末", subtitle: "カート + 決済UI" })
  .node("ecSite", { lane: "service", stack: 0, kind: "shape-online-shop", title: "ECサイト", eyebrow: "ショップ", subtitle: "商品追加 + カート更新" })
  .node("warehouse", { lane: "service", stack: 1, kind: "shape-warehouse", title: "配送センター", eyebrow: "warehouse", subtitle: "在庫確認 + 送料計算" })
  .node("payment", { lane: "outcome", stack: 0, kind: "shape-brokerage", title: "決済 ゲートウェイ", eyebrow: "決済", subtitle: "Stripe / PayPay / カード" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文DB", eyebrow: "保存", subtitle: "確定注文 + 履歴保存" })
  .edge("shopper", "mobile", { label: "選ぶ", tone: "info" })
  .edge("mobile", "ecSite", { label: "追加toカート", tone: "info" })
  .edge("ecSite", "warehouse", { label: "送料確認", tone: "success" })
  .edge("ecSite", "payment", { label: "決済", tone: "accent" })
  .edge("payment", "orderDb", { label: "確認", tone: "success" })
  .readout.cartSummary("cs", { source: "cart", currency: "$", colorTotal: "#2563eb", label: "カート合計" })
  .readout.gauge("budG", { source: "budgetPct", min: 0, max: 100, color: "#22c55e", label: "予算消費率" })
  .readout.countup("itemCU", { source: "itemCount", unit: " 点", label: "商品点数", decimals: 0 })
  .readout.stat("savStat", { source: "savedAmt", unit: " $", caption: "節約額", label: "保存済" })
  .phase("p1", {
    duration: 1800,
    title: "商品追加 (3 点 $149.85)",
    body: "木崎様がジャケット + 書籍 + ケーブルをカート追加、 ECサイトで小計反映。 合計0 → 149.85 tween、 budgetPct 0 → 75 tween、 itemCount 0 → 3 tween、 savedAmt 0 keep、 shopper + モバイル + ecSite lane有効。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "shopper-mobile", "mobile-ecSite").tween("total", 0, 149.85).tween("budgetPct", 0, 75).tween("itemCount", 0, 3).badge("追加"))
  .phase("p2", {
    duration: 1800,
    title: "送料計算 (+$8.50)",
    body: "配送センター在庫確認 → 標準3日配送 $8.50適用。 合計149.85 → 158.35 tween、 budgetPct 75 → 79 tween、 warehouse lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse", "shopper-mobile", "mobile-ecSite", "ecSite-warehouse").tween("total", 149.85, 158.35).tween("budgetPct", 75, 79).badge("送料"))
  .phase("p3", {
    duration: 1800,
    title: "クーポン (-$15)",
    body: "'SAVE15' クーポン適用、 割引反映。 合計158.35 → 143.35 tween、 budgetPct 79 → 72 tween、 savedAmt 0 → 15 tween、 割引効果visible。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse", "shopper-mobile", "mobile-ecSite", "ecSite-warehouse").tween("total", 158.35, 143.35).tween("budgetPct", 79, 72).tween("savedAmt", 0, 15).badge("クーポン"))
  .phase("p4", {
    duration: 2000,
    title: "決済確定",
    body: "決済 ゲートウェイ でStripe決済 → 注文DBに確定注文flush。 合計143.35 keep、 budgetPct 72 keep、 itemCount 3 keep、 savedAmt 15 keep、 決済 + orderDb lane activate、 6 shape全active、 注文完遂。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse", "payment", "orderDb", "shopper-mobile", "mobile-ecSite", "ecSite-warehouse", "ecSite-payment", "payment-orderDb").badge("決済"))
  .build();

/**
 * 122. saasPricingTier v2 = 中規模 startup CTO の SaaS プラン選定 4 phase シナリオ (Starter 検討 → チーム拡大 → Pro upgrade → Enterprise 見積)、 shape-person + shape-mobile-device + shape-website + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Starter → 拡大 → Pro → Enterprise) + 4 readout (pricingTier / gauge 席数消化 / countup 月額 / stat 年間契約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const saasPricingTier = diagram("interactive-saas-pricing-tier", {
  topic: "スタートアップCTOがStarterからPro、Enterpriseへとプラン選定する4段階",
})
  .lane("cto", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("plan", ["Pro", 29, "10 席", "優先サポート", "カスタムドメイン"] as unknown as (string | number)[])
  .state("selected", { initial: 0 })
  .state("seatUsage", { initial: 0 })
  .state("monthlyFee", { initial: 9 })
  .state("annualFee", { initial: 108 })
  .node("cto", { lane: "cto", stack: 0, kind: "shape-person", title: "startup CTO千葉様", eyebrow: "CTO", subtitle: "20名engチーム + growth中" })
  .node("laptop", { lane: "cto", stack: 1, kind: "shape-mobile-device", title: "MacBook + Notion", eyebrow: "端末", subtitle: "SaaSベンダー比較表" })
  .node("pricingPage", { lane: "service", stack: 0, kind: "shape-website", title: "SaaS pricingページ", eyebrow: "pricing", subtitle: "3 tier + 機能比較 + 見積フォーム" })
  .node("billing", { lane: "service", stack: 1, kind: "shape-brokerage", title: "billingサービス", eyebrow: "billing", subtitle: "月次課金 + プロレート計算" })
  .node("invoiceMail", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "請求書email", eyebrow: "メール", subtitle: "受領書 + 契約書pdf送付" })
  .node("contractDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "契約DB", eyebrow: "保存", subtitle: "顧客別subscription + 履歴" })
  .edge("cto", "laptop", { label: "調査", tone: "info" })
  .edge("laptop", "pricingPage", { label: "比較", tone: "info" })
  .edge("pricingPage", "billing", { label: "購読", tone: "success" })
  .edge("billing", "invoiceMail", { label: "領収書", tone: "info" })
  .edge("billing", "contractDb", { label: "保存", tone: "accent" })
  .readout.pricingTier("pt", { source: "plan", colorAccent: "#2563eb", currency: "$", label: "Proプラン" })
  .readout.gauge("seatG", { source: "seatUsage", min: 0, max: 100, color: "#22c55e", label: "席数消化 %" })
  .readout.countup("feeCU", { source: "monthlyFee", unit: " $/月", label: "月額", decimals: 0 })
  .readout.stat("annStat", { source: "annualFee", unit: " $", caption: "年額", label: "年次" })
  .phase("p1", {
    duration: 1500,
    title: "Starter検討(3席)",
    body: "チーム3名でStarterプラン($9/月)検討、 pricing pageで機能表示確認。 selected 0 keep、 seatUsage 0 → 100 tween (3/3満)、 monthlyFee 9 keep、 annualFee 108 keep、 CTO + ノートPC + pricingPage lane有効。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "cto-laptop", "laptop-pricingPage").tween("seatUsage", 0, 100).badge("Starter"))
  .phase("p2", {
    duration: 2000,
    title: "チーム拡大 (席不足)",
    body: "採用で チーム8名に、 Starter 3席では不足発生。 seatUsage 100 → 265 tween (超過)、 monthlyFee 9 keep、 アラート 発報でupgrade検討。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "cto-laptop", "laptop-pricingPage").tween("seatUsage", 100, 265).badge("拡大"))
  .phase("p3", {
    duration: 2000,
    title: "Proアップグレード($29/月)",
    body: "Pro plan (10席 + 優先サポート)にupgrade、 billingで月次課金 + プロレート適用。 selected 0 → 1 tween、 seatUsage 265 → 80 tween (8/10)、 monthlyFee 9 → 29 tween、 annualFee 108 → 348 tween、 billing + invoiceMail lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "billing", "invoiceMail", "cto-laptop", "laptop-pricingPage", "pricingPage-billing", "billing-invoiceMail").tween("selected", 0, 1).tween("seatUsage", 265, 80).tween("monthlyFee", 9, 29).tween("annualFee", 108, 348).badge("Pro"))
  .phase("p4", {
    duration: 2000,
    title: "Enterprise見積",
    body: "翌年 チーム20名到達でEnterprise見積依頼、 CSM経由でカスタム契約。 selected 1 → 2 tween、 seatUsage 80 → 100 tween、 monthlyFee 29 → 200 tween、 annualFee 348 → 2400 tween、 contractDb activate、 6 shape全active、 契約更新完遂。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "billing", "invoiceMail", "contractDb", "cto-laptop", "laptop-pricingPage", "pricingPage-billing", "billing-invoiceMail", "billing-contractDb").tween("selected", 1, 2).tween("seatUsage", 80, 100).tween("monthlyFee", 29, 200).tween("annualFee", 348, 2400).badge("Enterprise"))
  .build();

/**
 * 123. checkoutCouponApply v2 = EC ホリデー セール クーポン適用 4 phase シナリオ (キャンペーンメール → コード入力 → 適用 → 決済)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (メール受信 → 入力 → 適用 → 決済) + 4 readout (couponCode / gauge 割引 % / countup 適用回数 / stat 節約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const checkoutCouponApply = diagram("interactive-checkout-coupon-apply", {
  topic: "ECホリデーセールでクーポンコードを入力して適用、決済完了までのフロー",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("coupon", ["SAVE20", 20] as unknown as (string | number)[])
  .state("discount", { initial: 0 })
  .state("usageCount", { initial: 1245 })
  .state("savedAmt", { initial: 0 })
  .node("shopper", { lane: "buyer", stack: 0, kind: "shape-person", title: "shopper藤田様", eyebrow: "購入者", subtitle: "ホリデーセール参加者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhone + Gmail", eyebrow: "端末", subtitle: "キャンペーンメール受信" })
  .node("ecSite", { lane: "service", stack: 0, kind: "shape-online-shop", title: "ECチェックアウト", eyebrow: "チェックアウト", subtitle: "クーポンコード入力欄 + 割引反映" })
  .node("couponSvc", { lane: "service", stack: 1, kind: "shape-brokerage", title: "coupon検証svc", eyebrow: "クーポン", subtitle: "有効期限 + 上限 + 割引率判定" })
  .node("marketing", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "marketing分析", eyebrow: "分析", subtitle: "usage集計 + ROI分析" })
  .node("couponDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "クーポンDB", eyebrow: "保存", subtitle: "コード + 使用履歴 + 顧客別" })
  .edge("shopper", "phone", { label: "確認", tone: "info" })
  .edge("phone", "ecSite", { label: "適用", tone: "info" })
  .edge("ecSite", "couponSvc", { label: "検証", tone: "success" })
  .edge("couponSvc", "couponDb", { label: "保存", tone: "accent" })
  .edge("couponSvc", "marketing", { label: "集約", tone: "accent" })
  .readout.couponCode("cc", { source: "coupon", colorApplied: "#22c55e", label: "クーポン" })
  .readout.gauge("discG", { source: "discount", min: 0, max: 30, color: "#22c55e", label: "割引 %" })
  .readout.countup("usaCU", { source: "usageCount", unit: " 件", label: "累計適用", decimals: 0 })
  .readout.stat("savStat", { source: "savedAmt", unit: " $", caption: "節約額", label: "保存済" })
  .phase("p1", {
    duration: 1500,
    title: "メール受信",
    body: "藤田様にSAVE20キャンペーンメール到着。 割引0 keep、 usageCount 1245 keep、 savedAmt 0 keep、 shopper + スマホlane有効、 チェックアウト 未到達。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "shopper-phone").badge("メール"))
  .phase("p2", {
    duration: 1800,
    title: "コード入力",
    body: "EC画面 チェックアウト でコード欄に 'SAVE20' 入力、 適用ボタン待機。 割引0 keep、 ecSite lane activate、 dropzone実線化。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite", "shopper-phone", "phone-ecSite").badge("入力"))
  .phase("p3", {
    duration: 2000,
    title: "適用",
    body: "クーポン 検証svcで有効期限 + 上限確認 → 20% 適用。 割引0 → 20 tween (ゲージ 針上振れ)、 usageCount 1245 → 1246 tween、 savedAmt 0 → 32 tween、 couponSvc + couponDb + marketing lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite", "couponSvc", "couponDb", "marketing", "shopper-phone", "phone-ecSite", "ecSite-couponSvc", "couponSvc-couponDb", "couponSvc-marketing").tween("discount", 0, 20).tween("usageCount", 1245, 1246).tween("savedAmt", 0, 32).badge("適用"))
  .phase("p4", {
    duration: 1800,
    title: "決済確定",
    body: "割引反映後の合計で決済実行、 marketing分析 に用途 ログ 反映。 割引20 keep、 usageCount 1246 keep、 savedAmt 32 keep、 6 shape全active、 clip完了 + 顧客満足。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite", "couponSvc", "couponDb", "marketing", "shopper-phone", "phone-ecSite", "ecSite-couponSvc", "couponSvc-couponDb", "couponSvc-marketing").badge("決済"))
  .build();

/**
 * 124. blogArticlePreview v2 = 週末読書中の tech blog 閲覧 4 phase シナリオ (feed 一覧 → hover 興味 → クリック閲覧 → シェア)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (feed → hover → 閲覧 → シェア) + 4 readout (articlePreview / gauge engagement / countup 閲覧数 / stat 平均滞在秒) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。
 */
export const blogArticlePreview = diagram("interactive-blog-article-preview", {
  topic: "週末にテックブログを閲覧するユーザーのフィード、ホバー、閲覧、シェアまでの体験",
})
  .lane("reader", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("article", ["dragon 入門", "dragon で interactive diagram を作る方法を解説", "Alice", "2 時間前"] as unknown as (string | number)[])
  .state("hovered", { initial: 0 })
  .state("engagement", { initial: 0 })
  .state("viewCount", { initial: 128 })
  .state("dwellSec", { initial: 0 })
  .node("reader", { lane: "reader", stack: 0, kind: "shape-person", title: "週末reader森本様", eyebrow: "reader", subtitle: "tech blog subscribe利用者" })
  .node("laptop", { lane: "reader", stack: 1, kind: "shape-mobile-device", title: "iPadブラウザ", eyebrow: "端末", subtitle: "フィードreader + tab複数" })
  .node("blog", { lane: "service", stack: 0, kind: "shape-website", title: "tech blog (Zenn系)", eyebrow: "blog", subtitle: "記事cardフィード + タグ検索" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "blog CDN edge", eyebrow: "CDN", subtitle: "近いedgeから画像 + 本文配信" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "GA4分析", eyebrow: "分析", subtitle: "表示 + エンゲージメント + dwell集計" })
  .node("readerDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "reader DB", eyebrow: "保存", subtitle: "閲覧履歴 + いいね + 保存" })
  .edge("reader", "laptop", { label: "起動", tone: "info" })
  .edge("laptop", "blog", { label: "取得", tone: "info" })
  .edge("blog", "cdnEdge", { label: "キャッシュ", tone: "success" })
  .edge("blog", "analytics", { label: "追跡", tone: "accent" })
  .edge("analytics", "readerDb", { label: "保存", tone: "success" })
  .readout.articlePreview("ap", { source: "article", colorAccent: "#2563eb", label: "記事 カード" })
  .readout.gauge("engG", { source: "engagement", min: 0, max: 100, color: "#22c55e", label: "エンゲージメント %" })
  .readout.countup("viewCU", { source: "viewCount", unit: " 表示", label: "累計閲覧", decimals: 0 })
  .readout.stat("dwellStat", { source: "dwellSec", unit: " 秒", caption: "滞在時間", label: "滞留" })
  .phase("p1", {
    duration: 1500,
    title: "feed一覧(初期表示)",
    body: "森本様がblogフィード を開き、 記事 カード3件が表示。 hovered 0 keep、 エンゲージメント0 → 10 tween、 viewCount 128 keep、 dwellSec 0 → 2 tween、 reader + ノートPC + blog + cdnEdge lane有効。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "reader-laptop", "laptop-blog", "blog-cdnEdge").tween("engagement", 0, 10).tween("dwellSec", 0, 2).badge("feed"))
  .phase("p2", {
    duration: 1800,
    title: "hover (興味湧く)",
    body: "'dragon入門' の カード にマウスhover、 excerpt拡大表示 + title濃青。 hovered 0 → 1 tween、 エンゲージメント10 → 35 tween、 dwellSec 2 → 8 tween、 分析 でhoverイベント 記録。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics", "reader-laptop", "laptop-blog", "blog-cdnEdge", "blog-analytics").tween("hovered", 0, 1).tween("engagement", 10, 35).tween("dwellSec", 2, 8).badge("hover"))
  .phase("p3", {
    duration: 2200,
    title: "クリック閲覧",
    body: "クリック で記事詳細ページ、 本文 + 図読解、 スクロール完読。 hovered 1 keep、 エンゲージメント35 → 75 tween、 viewCount 128 → 129 tween、 dwellSec 8 → 120 tween、 readerDb反映。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics", "readerDb", "reader-laptop", "laptop-blog", "blog-cdnEdge", "blog-analytics", "analytics-readerDb").tween("engagement", 35, 75).tween("viewCount", 128, 129).tween("dwellSec", 8, 120).badge("閲覧"))
  .phase("p4", {
    duration: 2000,
    title: "シェア (共感)",
    body: "内容良かったのでX + Slackでシェア、 エンゲージメント 高値到達。 エンゲージメント75 → 92 tween、 viewCount 129 → 130 tween、 dwellSec 120 → 135 tween、 6 shape全active、 blogエンゲージメントloop完遂。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics", "readerDb", "reader-laptop", "laptop-blog", "blog-cdnEdge", "blog-analytics", "analytics-readerDb").tween("engagement", 75, 92).tween("viewCount", 129, 130).tween("dwellSec", 120, 135).badge("シェア"))
  .build();

/**
 * 125. docsTocNav v2 = 新人エンジニア docs 深掘り学習 4 phase シナリオ (Intro → GS → Install → First diagram)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (H1 Intro → H2 GS → H3 Install → H3 First) + 4 readout (tocNav / gauge 学習進捗 / countup 訪問セクション / stat 学習分) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。
 */
export const docsTocNav = diagram("interactive-docs-toc-nav", {
  topic: "新人エンジニアがドキュメントを導入からガイド、インストール、初回diagramまで学ぶナビゲーション",
})
  .lane("learner", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("toc", [
    [0, "はじめに", 0],
    [1, "スタートガイド", 1],
    [2, "インストール", 0],
    [2, "最初の diagram", 1],
    [1, "高度な使い方", 0],
    [0, "API リファレンス", 0],
  ] as unknown as (string | number)[])
  .state("activeIdx", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("visitedCount", { initial: 0 })
  .state("learnMin", { initial: 0 })
  .node("newbie", { lane: "learner", stack: 0, kind: "shape-person", title: "新人 エンジニア山根様", eyebrow: "learner", subtitle: "dragon初触り 学習中" })
  .node("browser", { lane: "learner", stack: 1, kind: "shape-mobile-device", title: "ブラウザ + タブ複数", eyebrow: "端末", subtitle: "docs検索 + サンプルコード試行" })
  .node("docsPage", { lane: "service", stack: 0, kind: "shape-website", title: "docs (dragon.開発)", eyebrow: "docs", subtitle: "階層3段 + アクティブsection表示" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "docs CDN edge", eyebrow: "CDN", subtitle: "MDXビルド後 + edgeキャッシュ" })
  .node("learnAnalytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "learning分析", eyebrow: "分析", subtitle: "利用者 別進捗 + 完了率追跡" })
  .node("progressDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "進捗DB", eyebrow: "保存", subtitle: "user_id → 訪問セクション + timestamp" })
  .edge("newbie", "browser", { label: "検索", tone: "info" })
  .edge("browser", "docsPage", { label: "取得", tone: "info" })
  .edge("docsPage", "cdnEdge", { label: "キャッシュ", tone: "success" })
  .edge("docsPage", "learnAnalytics", { label: "追跡", tone: "accent" })
  .edge("learnAnalytics", "progressDb", { label: "保存", tone: "success" })
  .readout.tocNav("tn", { source: "toc", colorActive: "#2563eb", label: "docs TOC" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "学習進捗 %" })
  .readout.countup("visCU", { source: "visitedCount", unit: " 節", label: "訪問数", decimals: 0 })
  .readout.stat("learnStat", { source: "learnMin", unit: " 分", caption: "学習時間", label: "最小" })
  .phase("p1", {
    duration: 1500,
    title: "Intro (H1)",
    body: "山根様がdragon docs Home到達、 'はじめに' 読解。 activeIdx 0 keep、 進捗0 → 20 tween、 visitedCount 0 → 1 tween、 learnMin 0 → 5 tween、 newbie + ブラウザ + docsPage + cdnEdge lane有効。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "newbie-browser", "browser-docsPage", "docsPage-cdnEdge").tween("progress", 0, 20).tween("visitedCount", 0, 1).tween("learnMin", 0, 5).badge("Intro"))
  .phase("p2", {
    duration: 2000,
    title: "GS (H2)",
    body: "スタートガイドへ移動、 概要 + 前提知識確認。 activeIdx 0 → 1 tween、 進捗20 → 45 tween、 visitedCount 1 → 2 tween、 learnMin 5 → 18 tween、 learnAnalytics + progressDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb", "newbie-browser", "browser-docsPage", "docsPage-cdnEdge", "docsPage-learnAnalytics", "learnAnalytics-progressDb").tween("activeIdx", 0, 1).tween("progress", 20, 45).tween("visitedCount", 1, 2).tween("learnMin", 5, 18).badge("GS"))
  .phase("p3", {
    duration: 2000,
    title: "インストール(H3)",
    body: "GS内 'インストール' サブセクションへ、 pnpmインストール + 設定 実行。 activeIdx 1 → 2 tween、 進捗45 → 72 tween、 visitedCount 2 → 3 tween、 learnMin 18 → 32 tween、 実サンプル動作確認。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb", "newbie-browser", "browser-docsPage", "docsPage-cdnEdge", "docsPage-learnAnalytics", "learnAnalytics-progressDb").tween("activeIdx", 1, 2).tween("progress", 45, 72).tween("visitedCount", 2, 3).tween("learnMin", 18, 32).badge("Install"))
  .phase("p4", {
    duration: 2200,
    title: "First diagram (H3)",
    body: "'最初のdiagram' で実際にcode書いて動作確認、 progressDbに完了 フラグ 記録。 activeIdx 2 → 3 tween、 進捗72 → 95 tween (ゲージ 針最上位近く)、 visitedCount 3 → 4 tween、 learnMin 32 → 55 tween、 6 shape全active、 学習ゴール到達。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb", "newbie-browser", "browser-docsPage", "docsPage-cdnEdge", "docsPage-learnAnalytics", "learnAnalytics-progressDb").tween("activeIdx", 2, 3).tween("progress", 72, 95).tween("visitedCount", 3, 4).tween("learnMin", 32, 55).badge("First"))
  .build();

/**
 * 126. socialShareButtons v2 = tech blog 記事シェア 1 週間拡散 4 phase シナリオ (投稿直後 → X 拡散 → FB / LinkedIn 追随 → Reddit バズ定着)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Day 0 → Day 1 → Day 3 → Day 7) + 4 readout (shareButtons / gauge viral / countup total shares / stat reach 万人) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。 iteration 7 完遂。
 */
export const socialShareButtons = diagram("interactive-social-share-buttons", {
  topic: "テックブログ記事が投稿からX拡散、FBとLinkedIn、Redditで1週間拡散する軌跡",
})
  .lane("author", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("shares", [["tw", 245], ["fb", 89], ["li", 32], ["rd", 18]] as unknown as (string | number)[])
  .state("totalShares", { initial: 0 })
  .state("viralRate", { initial: 0 })
  .state("reachTenK", { initial: 0 })
  .node("author", { lane: "author", stack: 0, kind: "shape-person", title: "tech blogger綾瀬様", eyebrow: "author", subtitle: "月次1本tech記事執筆" })
  .node("mobile", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "iPhone SNS + 通知", eyebrow: "端末", subtitle: "share通知 + 反応追跡" })
  .node("blog", { lane: "service", stack: 0, kind: "shape-website", title: "blog + 共有 ウィジェット", eyebrow: "blog", subtitle: "4 SNSボタン + OGP画像" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "OGP CDN edge", eyebrow: "CDN", subtitle: "OGP画像 + snippet配信" })
  .node("socialGraph", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "socialグラフAPI", eyebrow: "グラフ", subtitle: "SNS各platform共有count集計" })
  .node("statsDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "共有stats DB", eyebrow: "保存", subtitle: "時系列share履歴 + platform別" })
  .edge("author", "mobile", { label: "投稿", tone: "info" })
  .edge("mobile", "blog", { label: "発行", tone: "info" })
  .edge("blog", "cdnEdge", { label: "OGP", tone: "success" })
  .edge("blog", "socialGraph", { label: "ポーリング", tone: "accent" })
  .edge("socialGraph", "statsDb", { label: "保存", tone: "success" })
  .readout.shareButtons("sb", { source: "shares", label: "シェア 累計" })
  .readout.gauge("virG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral度 %" })
  .readout.countup("totCU", { source: "totalShares", unit: " 共有", label: "総shares", decimals: 0 })
  .readout.stat("reachStat", { source: "reachTenK", unit: " 万人", caption: "到達", label: "到達" })
  .phase("p1", {
    duration: 1500,
    title: "Day 0投稿直後",
    body: "綾瀬様が記事公開、 blogに 共有 ウィジェット 表示、 まず自分のXで 共有。 totalShares 0 → 50 tween、 viralRate 0 → 15 tween、 reachTenK 0 → 1 tween、 author + モバイル + blog + cdnEdge lane有効。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "author-mobile", "mobile-blog", "blog-cdnEdge").tween("totalShares", 0, 50).tween("viralRate", 0, 15).tween("reachTenK", 0, 1).badge("Day 0"))
  .phase("p2", {
    duration: 2000,
    title: "Day 1 X拡散",
    body: "有名エンジニアがRT、 Xで急速拡散。 totalShares 50 → 200 tween、 viralRate 15 → 55 tween、 reachTenK 1 → 5 tween、 socialGraph + statsDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb", "author-mobile", "mobile-blog", "blog-cdnEdge", "blog-socialGraph", "socialGraph-statsDb").tween("totalShares", 50, 200).tween("viralRate", 15, 55).tween("reachTenK", 1, 5).badge("Day 1"))
  .phase("p3", {
    duration: 2000,
    title: "Day 3 FB / LinkedIn追随",
    body: "エンジニア界隈でFB + LinkedIn共有 追随、 プロ層に拡がる。 totalShares 200 → 330 tween、 viralRate 55 → 78 tween、 reachTenK 5 → 12 tween、 statsDbでplatform別集計蓄積。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb", "author-mobile", "mobile-blog", "blog-cdnEdge", "blog-socialGraph", "socialGraph-statsDb").tween("totalShares", 200, 330).tween("viralRate", 55, 78).tween("reachTenK", 5, 12).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "Day 7 Redditバズ定着",
    body: "Reddit r/programmingに投稿されバズ、 週末に拡散が国際化。 totalShares 330 → 384 tween、 viralRate 78 → 92 tween (ゲージ 針最上位近く)、 reachTenK 12 → 20 tween、 6 shape全active、 1週間拡散 完遂。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb", "author-mobile", "mobile-blog", "blog-cdnEdge", "blog-socialGraph", "socialGraph-statsDb").tween("totalShares", 330, 384).tween("viralRate", 78, 92).tween("reachTenK", 12, 20).badge("Day 7"))
  .build();

/**
 * 127. exemplar-payment-flow v2 = EC 決済の実業務シナリオ、 shape-* primitive (person / mobile / credit-card / online-shop / payment-provider / api-gateway / bank / cylinder) で visual scene 化、 4 phase (商品購入 → 3DS 認証 → 銀行確定 → 記帳) + 4 readout (stat 金額 / gauge 3DS / traffic-light 状態 / countup 累計) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 1。
 */
export const exemplarPaymentFlow = diagram("interactive-exemplar-payment-flow", {
  topic: "EC決済の商品購入から3DS認証、銀行確定、記帳までの4ステップ",
})
  .lane("customer", { x: 0, width: 220 })
  .lane("processor", { x: 240, width: 280 })
  .lane("bank", { x: 540, width: 220 })
  .state("amount", { initial: 0 })
  .state("auth3ds", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("totalTx", { initial: 1247 })
  .node("customer", { lane: "customer", stack: 0, kind: "shape-person", title: "田中様", eyebrow: "顧客", subtitle: "購入者" })
  .node("mobile", { lane: "customer", stack: 1, kind: "shape-mobile-device", title: "iPhone 15", eyebrow: "端末", subtitle: "Safari / iOS 17" })
  .node("card", { lane: "customer", stack: 2, kind: "shape-credit-card", title: "VISA **1234", eyebrow: "カード", subtitle: "MUFG発行" })
  .node("shop", { lane: "processor", stack: 0, kind: "shape-online-shop", title: "BuyNow.com", eyebrow: "merchant", subtitle: "チェックアウト · ¥{金額}" })
  .node("gateway", { lane: "processor", stack: 1, kind: "shape-api-gateway", title: "APIゲートウェイ", eyebrow: "ゲートウェイ", subtitle: "認証 + rate制限" })
  .node("provider", { lane: "processor", stack: 2, kind: "shape-payment-provider", title: "Stripe", eyebrow: "提供者", subtitle: "3DS {auth3ds}%" })
  .node("bankShape", { lane: "bank", stack: 0, kind: "shape-bank", title: "MUFG", eyebrow: "issuer", subtitle: "発行銀行 · 与信照会" })
  .node("ledger", { lane: "bank", stack: 1, kind: "shape-cylinder", title: "取引台帳", eyebrow: "データベース", subtitle: "記帳 + 監査 ログ" })
  .edge("customer", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "shop", { label: "購入", tone: "info" })
  .edge("shop", "gateway", { label: "投稿 /pay", tone: "info" })
  .edge("gateway", "provider", { label: "転送", tone: "info" })
  .edge("card", "provider", { label: "3DS認証", tone: "accent" })
  .edge("provider", "bankShape", { label: "決済要求", tone: "success" })
  .edge("bankShape", "ledger", { label: "記帳", tone: "success" })
  .readout.stat("amountStat", { source: "amount", unit: " 円", caption: "決済金額", label: "金額" })
  .readout.gauge("authGauge", { source: "auth3ds", min: 0, max: 100, color: "#22c55e", label: "3DS認証 %" })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "決済 状態" })
  .readout.countup("totalCU", { source: "totalTx", unit: " 件", label: "本日累計tx", decimals: 0 })
  .phase("p1", {
    duration: 2200,
    title: "商品購入",
    body: "田中様がiPhoneでBuyNow.comにアクセス、 チェックアウト で購入決定。 金額0 → 12500 tween (stat金額上昇)、 txStatus = 0 (トラフィック-light赤)、 auth3ds = 0 (ゲージ 針最下)。 顧客 + ショップlaneがactive。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "customer-mobile", "mobile-shop").tween("amount", 0, 12500).set("txStatus", 0).set("auth3ds", 0).badge("購入"))
  .phase("p2", {
    duration: 2500,
    title: "3DS認証",
    body: "ゲートウェイ 経由でStripeに転送、 VISAカードの3D-Secure認証実行。 txStatus 0 → 1 tween (トラフィック-light赤 → 黄)、 auth3ds 0 → 92% tween (ゲージ 針が緑域まで上昇)。 processor lane全activate、 カード → 提供者 のaccent edge。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider", "customer-mobile", "mobile-shop", "shop-gateway", "gateway-provider", "card-provider").tween("txStatus", 0, 1).tween("auth3ds", 0, 92).badge("3DS 認証"))
  .phase("p3", {
    duration: 2000,
    title: "銀行確定",
    body: "認証通過、 発行銀行MUFGに与信照会 + 決済確定。 txStatus 1 → 2 tween (トラフィック-light黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 銀行lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider", "bankShape", "customer-mobile", "mobile-shop", "shop-gateway", "gateway-provider", "card-provider", "provider-bankShape").tween("txStatus", 1, 2).tween("auth3ds", 92, 98).badge("銀行確定"))
  .phase("p4", {
    duration: 1800,
    title: "記帳完了",
    body: "銀行が取引台帳に記帳 + 監査 ログ 記録、 totalTx 1247 → 1248 tween (countupが +1加算表示、 800msかけて動的 数 上)、 全8 shape有効、 決済 フロー 完遂。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider", "bankShape", "ledger", "customer-mobile", "mobile-shop", "shop-gateway", "gateway-provider", "card-provider", "provider-bankShape", "bankShape-ledger").tween("totalTx", 1247, 1248).set("txStatus", 2).badge("記帳完了"))
  .build();

/**
 * 128. exemplar-login-flow v2 = 実 login 認証 + 2FA + セッション発行シナリオ、 shape-* primitive (mobile-device / person / server-rack / hexagon / diamond / cylinder / cloud) で visual scene 化、 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) + 4 readout (traffic-light / countup / gauge / bar) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 2。
 */
export const exemplarLoginFlow = diagram("interactive-exemplar-login-flow", {
  topic: "ログインと2段階認証で要求、一次検証、2FA、セッション発行、応答の5ステップ",
})
  .lane("user", { x: 0, width: 200 })
  .lane("auth", { x: 220, width: 300 })
  .lane("session", { x: 540, width: 220 })
  .state("authStatus", { initial: 0 })
  .state("successLogin", { initial: 8421 })
  .state("failRate", { initial: 100 })
  .state("latency", { initial: 0 })
  .node("customer", { lane: "user", stack: 0, kind: "shape-person", title: "山田様", eyebrow: "利用者", subtitle: "メール + password送信" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "Pixel 8", eyebrow: "端末", subtitle: "Chrome / Android 14" })
  .node("authApi", { lane: "auth", stack: 0, kind: "shape-server-rack", title: "認証API", eyebrow: "サーバー", subtitle: "credential一次検証" })
  .node("mfaCheck", { lane: "auth", stack: 1, kind: "shape-diamond", title: "2FA要求?", eyebrow: "decision", subtitle: "TOTP 6桁or SMS" })
  .node("jwtSign", { lane: "auth", stack: 2, kind: "shape-hexagon", title: "JWT発行器", eyebrow: "signer", subtitle: "RS256 · exp 1h" })
  .node("session", { lane: "session", stack: 0, kind: "shape-cylinder", title: "Redisセッション", eyebrow: "キャッシュ", subtitle: "TTL 3600s" })
  .node("token", { lane: "session", stack: 1, kind: "shape-cloud", title: "JWTトークン", eyebrow: "応答", subtitle: "Bearer · 302リダイレクト" })
  .edge("customer", "mobile", { label: "入力", tone: "info" })
  .edge("mobile", "authApi", { label: "投稿 /ログイン", tone: "info" })
  .edge("authApi", "mfaCheck", { label: "一次OK", tone: "success" })
  .edge("mfaCheck", "jwtSign", { label: "2FA OK", tone: "success" })
  .edge("jwtSign", "session", { label: "sid保存", tone: "success" })
  .edge("session", "token", { label: "トークン 発行", tone: "success" })
  .readout.trafficLight("statusTL", { source: "authStatus", label: "認証 状態(0/1/2)" })
  .readout.countup("successCU", { source: "successLogin", unit: " 回", label: "本日成功ログイン" })
  .readout.gauge("rateGauge", { source: "failRate", min: 0, max: 100, color: "#22c55e", label: "成功率 %" })
  .readout.bar("latencyBar", { source: "latency", min: 0, max: 500, color: "#f97316", label: "応答時間ms" })
  .phase("p1", {
    duration: 1500,
    title: "認証要求",
    body: "山田様がPixelでログイン画面にcredential送信。 authStatus = 0 (トラフィック-light赤 = 未検証)、 latency 0 → 80ms tween (bar立ち上がり)、 ゲージ100%、 countup保持。 利用者lane全active。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "customer-mobile").set("authStatus", 0).tween("latency", 0, 80).badge("要求"))
  .phase("p2", {
    duration: 2000,
    title: "一次検証",
    body: "認証APIがcredential照合、 ハッシュ 比較。 authStatus 0 → 1 tween (トラフィック-light赤 → 黄)、 latency 80 → 220ms tween (bcryptでbar伸長)、 ゲージ100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "customer-mobile", "mobile-authApi", "authApi-mfaCheck").tween("authStatus", 0, 1).tween("latency", 80, 220).tween("failRate", 100, 99).badge("一次検証"))
  .phase("p3", {
    duration: 2200,
    title: "2FA検証",
    body: "TOTP 6桁認証、 認証サーバがtime-window比較。 authStatus 1 → 1保持(トラフィック-light黄)、 latency 220 → 350ms tween (2FA overheadでbarさらに伸長)、 mfaCheck diamondが 保留 状態。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "customer-mobile", "mobile-authApi", "authApi-mfaCheck").set("authStatus", 1).tween("latency", 220, 350).badge("2FA"))
  .phase("p4", {
    duration: 2000,
    title: "セッション発行",
    body: "2FA通過、 JWT発行 + Redisに セッション 保存。 authStatus 1 → 2 tween (トラフィック-light黄 → 緑)、 latency 350 → 180ms tween (bar縮小)、 ゲージ99 → 99% 維持、 jwtSign + セッションlane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session", "customer-mobile", "mobile-authApi", "authApi-mfaCheck", "mfaCheck-jwtSign", "jwtSign-session").tween("authStatus", 1, 2).tween("latency", 350, 180).badge("発行"))
  .phase("p5", {
    duration: 1800,
    title: "応答返却",
    body: "JWTトークン をBearerヘッダー で返却、 302リダイレクト。 successLogin 8421 → 8422 tween (countupが +1加算表示、 900msかけて動的)、 latency 180 → 50ms tween (最終)、 全7 shape有効。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session", "token", "customer-mobile", "mobile-authApi", "authApi-mfaCheck", "mfaCheck-jwtSign", "jwtSign-session", "session-token").tween("successLogin", 8421, 8422).tween("latency", 180, 50).set("authStatus", 2).badge("応答"))
  .build();

/**
 * 129. exemplar-notification-flow v2 = 実 push 通知配信 (message → queue → service → fan-out → device / retry) シナリオ、 shape-* primitive (message-bubble / stack / cloud / diamond / mobile-device × 3) で visual scene 化、 5 phase (event 発火 → キューイング → 配信中 → 到達 → リトライ) + 4 readout (bar / countup / gauge / stat) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 3。
 */
export const exemplarNotificationFlow = diagram("interactive-exemplar-notification-flow", {
  topic: "プッシュ通知配信のイベント発火からキュー、配信、到達、再試行まで",
})
  .lane("origin", { x: 0, width: 200 })
  .lane("infra", { x: 220, width: 280 })
  .lane("devices", { x: 520, width: 240 })
  .state("queued", { initial: 0 })
  .state("delivered", { initial: 0 })
  .state("failed", { initial: 0 })
  .state("deliveryRate", { initial: 0 })
  .node("msg", { lane: "origin", stack: 0, kind: "shape-message-bubble", title: "新着message", eyebrow: "起動", subtitle: "\"注文が発送されました\"" })
  .node("kafka", { lane: "infra", stack: 0, kind: "shape-stack", title: "Kafkaキュー", eyebrow: "キュー", subtitle: "残 {キュー投入} 件 · TTL 300s" })
  .node("fcm", { lane: "infra", stack: 1, kind: "shape-cloud", title: "FCMサービス", eyebrow: "通知", subtitle: "配信 バッチ 処理" })
  .node("retryGate", { lane: "infra", stack: 2, kind: "shape-diamond", title: "retry判定", eyebrow: "ポリシー", subtitle: "指数backoff · 最大3回" })
  .node("iphone", { lane: "devices", stack: 0, kind: "shape-mobile-device", title: "iPhone (A)", eyebrow: "端末", subtitle: "APNs経由 · foreground" })
  .node("pixel", { lane: "devices", stack: 1, kind: "shape-mobile-device", title: "Pixel (B)", eyebrow: "端末", subtitle: "FCM経由 · background" })
  .node("galaxy", { lane: "devices", stack: 2, kind: "shape-mobile-device", title: "Galaxy (C)", eyebrow: "端末", subtitle: "圏外 → retry対象" })
  .edge("msg", "kafka", { label: "追加", tone: "info" })
  .edge("kafka", "fcm", { label: "取出", tone: "info" })
  .edge("fcm", "iphone", { label: "APNs配信", tone: "success" })
  .edge("fcm", "pixel", { label: "FCM配信", tone: "success" })
  .edge("fcm", "galaxy", { label: "初回失敗", tone: "error" })
  .edge("galaxy", "retryGate", { label: "再試行 要求", tone: "warning" })
  .edge("retryGate", "fcm", { label: "再送指示", tone: "warning" })
  .readout.bar("queuedBar", { source: "queued", min: 0, max: 1000, color: "#f97316", label: "キュー 残" })
  .readout.countup("deliveredCU", { source: "delivered", unit: " 件", label: "配信成功", decimals: 0 })
  .readout.gauge("rateGauge", { source: "deliveryRate", min: 0, max: 100, color: "#22c55e", label: "配信成功率 %" })
  .readout.stat("failedStat", { source: "failed", unit: " 件", caption: "リトライ待ち", label: "失敗" })
  .phase("p1", {
    duration: 1800,
    title: "event発火",
    body: "注文発送 イベント が発生、 メッセージ-bubbleからKafkaキューにenqueue。 キュー投入0 → 1000 tween (barが右に伸長)、 配達済 = 0、 失敗 = 0、 deliveryRate = 0% (ゲージ 針最下)。 origin + キュー がactive。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "msg-kafka").tween("queued", 0, 1000).set("delivered", 0).set("failed", 0).set("deliveryRate", 0).badge("発火"))
  .phase("p2", {
    duration: 2000,
    title: "キューイング",
    body: "バッチ 化された1000件が処理待ち、 FCMサービス がdequeue開始。 キュー投入1000 → 800 tween (bar縮小開始)、 fcm lane activate、 kafka → fcm edgeが 情報toneで信号伝達。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "msg-kafka", "kafka-fcm").tween("queued", 1000, 800).badge("キュー"))
  .phase("p3", {
    duration: 2500,
    title: "配信中",
    body: "FCMがiPhone / Pixel / Galaxyへfan-外 配信。 キュー投入800 → 50 tween (bar大幅縮小)、 配達済0 → 920 tween (countupが加速的 数 上、 500/sピーク)、 失敗0 → 80 tween、 deliveryRate 0 → 92% tween (ゲージ 針上昇)。 3端末 全activate、 Galaxyは失敗edge (エラー tone)。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy", "msg-kafka", "kafka-fcm", "fcm-iphone", "fcm-pixel", "fcm-galaxy").tween("queued", 800, 50).tween("delivered", 0, 920).tween("failed", 0, 80).tween("deliveryRate", 0, 92).badge("配信"))
  .phase("p4", {
    duration: 1800,
    title: "初回到達",
    body: "iPhone + Pixelは成功受信、 Galaxyは圏外で失敗。 キュー投入50 → 20 tween、 配達済920 → 950 tween、 失敗80 → 50 tween、 deliveryRate 92 → 95% tween。 全shape有効。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy", "msg-kafka", "kafka-fcm", "fcm-iphone", "fcm-pixel", "fcm-galaxy").tween("queued", 50, 20).tween("delivered", 920, 950).tween("failed", 80, 50).tween("deliveryRate", 92, 95).badge("到達"))
  .phase("p5", {
    duration: 2000,
    title: "リトライ",
    body: "失敗50件をretryGateが指数 バックオフ で再送、 Galaxy圏内復帰後に配信成功。 キュー投入20 → 0 tween (bar消失)、 配達済950 → 992 tween (countup最終)、 失敗50 → 8 tween (stat減少)、 deliveryRate 95 → 99% tween (ゲージ 針最終)。 retryGate diamondがhighlight。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "retryGate", "iphone", "pixel", "galaxy", "msg-kafka", "kafka-fcm", "fcm-iphone", "fcm-pixel", "fcm-galaxy", "galaxy-retryGate", "retryGate-fcm").tween("queued", 20, 0).tween("delivered", 950, 992).tween("failed", 50, 8).tween("deliveryRate", 95, 99).badge("retry"))
  .build();
