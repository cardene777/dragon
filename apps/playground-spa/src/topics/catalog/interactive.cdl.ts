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
  .edge("sliderNode", "bar-node", { label: "signal bind", tone: "info" })
  .phase("p", {
    duration: 1500,
    title: "signal bind flow",
    body: "2-lane (Slider signal / Bar output) で input.slider bind の 2 step を分散、 bind edge (info tone) で signal 伝搬明示、 slider 変化で signal `value` 更新 → bar-node subtitle {value} 追随、 primitive signal binding を dataflow 化。",
  }, (p: PhaseBuilder) => p.activate("sliderNode", "bar-node").badge("bind: value"))
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
  .input.number("input", { defaultValue: 10, label: "Input" })
  .formula("doubled", "input * 2")
  .formula("halved", "input / 2")
  .state("input", { initial: 10 })
  .state("doubled", { initial: 20 })
  .state("halved", { initial: 5 })
  .node("in", { lane: "input", stack: 0, kind: "card", title: "Input", subtitle: "value = {input}" })
  .node("out1", { lane: "doubled", stack: 0, kind: "card", title: "Doubled", subtitle: "input * 2 = {doubled}" })
  .node("out2", { lane: "halved", stack: 0, kind: "card", title: "Halved", subtitle: "input / 2 = {halved}" })
  .edge("in", "out1", { label: "× 2", tone: "success" })
  .edge("in", "out2", { label: "÷ 2", tone: "info" })
  .phase("p", {
    duration: 1500,
    title: "formula dataflow",
    body: "3-lane (Input / Doubled / Halved) で formula chain を分散、 2 edge (× 2 success / ÷ 2 info) で dependency 明示、 input 変化で 2 formula reactive に再計算、 node subtitle {doubled} / {halved} 追随、 formula 依存の 2D dataflow view。",
  }, (p: PhaseBuilder) => p.activate("in", "out1", "out2").badge("formula bind"))
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
  .node("a", { lane: "s1", stack: 0, kind: "card", title: "Step 1", subtitle: "progress: {intro}" })
  .node("b", { lane: "s2", stack: 0, kind: "card", title: "Step 2", subtitle: "progress: {intro}" })
  .node("c", { lane: "s3", stack: 0, kind: "card", title: "Step 3", subtitle: "progress: {intro}" })
  .phase("p", {
    duration: 1500,
    title: "scroll narrative split",
    body: "3-lane (Step 1 / Step 2 / Step 3) で 3 narrative step を横並び分散、 wrapper element scroll → intro progress 0→1 変化 → 3 node subtitle が同時追随、 narrative 進行を lane 分割で可視化。",
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
  .input.toggle("active", { defaultValue: false, label: "Active" })
  .state("active", { initial: "off" })
  .node("btn", { lane: "trigger", stack: 0, kind: "card", title: "Button", subtitle: "click target" })
  .node("handlerNode", { lane: "handler", stack: 0, kind: "card", title: "Event handler", subtitle: "toggle-active + hover-state (consumer 実装)" })
  .node("signalNode", { lane: "signal", stack: 0, kind: "card", title: "Signal state", subtitle: "active = {active}" })
  .edge("btn", "handlerNode", { label: "click / hover", tone: "info" })
  .edge("handlerNode", "signalNode", { label: "toggle", tone: "success" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p", {
    duration: 1500,
    title: "event flow split",
    body: "3-lane (Trigger button / Event handler / Signal state) で click event flow の 3 step を分散、 2 edge (click info tone / toggle success tone) で dataflow 明示、 button click → consumer handler → active signal 反転 → signalNode subtitle 追随、 event 伝搬経路を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("btn", "handlerNode", "signalNode").badge("event bind"))
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
    subtitle: "wBind = {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .node("readoutNode", { lane: "readout", stack: 0, kind: "card", title: "Bar readout", subtitle: "readout.bar が signal を同時追随" })
  .edge("signalNode", "bar", { label: "wBind", tone: "info" })
  .edge("signalNode", "readoutNode", { label: "readout", tone: "success" })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "Width readout" })
  .phase("p", {
    duration: 1500,
    title: "visual bind fan-out",
    body: "3-lane (Signal / Bar / Readout) で wBind visual binding の 3 経路を分散、 2 edge (wBind info / readout success) で signal → 2 target の 1:N 分岐明示、 slider 変化で bar node SVG width + readout.bar が同時追随、 visual binding dataflow を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("signalNode", "bar", "readoutNode").badge("visual bind"))
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
  .edge("controlNode", "target", { label: "op bind", tone: "info" })
  .edge("controlNode", "ref", { label: "no bind", tone: "warning" })
  .readout.gauge("opGauge", { source: "fade", min: 0, max: 100, label: "Fade % gauge" })
  .phase("p", {
    duration: 1500,
    title: "opacity bind vs constant",
    body: "3-lane (Fade control / Target opacity bind / Reference constant) で opacity 追随の有無を対比、 2 edge (op bind info tone / no bind warning tone) で binding 有無を明示、 slider (0..100) 変化 → formula op (0..1) → target node opacity 追随、 ref は無反応 (constant)、 visual binding 効果を lane 対比で可視化。",
  }, (p: PhaseBuilder) => p.activate("controlNode", "target", "ref").badge("opacity bind"))
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
  .node("q2Node", { lane: "q2", stack: 0, kind: "card", title: "Q2 (x<50, y>50)", subtitle: "upper-left" })
  .node("q1Node", { lane: "q1", stack: 0, kind: "card", title: "Q1 (x>50, y>50)", subtitle: "upper-right" })
  .node("q3Node", { lane: "q3", stack: 0, kind: "card", title: "Q3 (x<50, y<50)", subtitle: "lower-left" })
  .node("q4Node", { lane: "q4", stack: 0, kind: "card", title: "Q4 (x>50, y<50)", subtitle: "lower-right" })
  .node("indicator", { lane: "q1", stack: 1, kind: "card", title: "◆ Current pos", subtitle: "{pos} (default center → Q1 boundary)" })
  .readout.stat("posStat", { source: "pos", label: "Selected", caption: "x,y in 0..100" })
  .phase("p", {
    duration: 1500,
    title: "quadrant map",
    body: "4-lane (Q2 左上 / Q1 右上 / Q3 左下 / Q4 右下) で 2D 座標空間を quadrant 分散、 各 quadrant 個別 card + 現在 pos indicator (default 50,50 = 中心)、 stat readout で pos 数値化、 座標分類と数値表示の 2 経路 view。",
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
  .input.stepper("count", { min: 0, max: 10, defaultValue: 3, label: "Count" })
  .state("count", { initial: 3 })
  .node("ctrlNode", { lane: "ctrl", stack: 0, kind: "card", title: "Stepper control", subtitle: "count = {count} (0-10 range)" })
  .node("barNode", { lane: "bar", stack: 0, kind: "card", title: "Bar visual", subtitle: "count 追随 progress bar (readout.bar)" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", title: "Stat readout", subtitle: "count 追随 number + unit (readout.stat)" })
  .edge("ctrlNode", "barNode", { label: "→ bar", tone: "info" })
  .edge("ctrlNode", "statNode", { label: "→ stat", tone: "success" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "Progress bar" })
  .readout.stat("countStat", { source: "count", label: "Total", unit: " items" })
  .phase("p", {
    duration: 1500,
    title: "control → visual fan-out",
    body: "3-lane (Control / Bar / Stat) で stepper と 2 readout を分散、 2 fan-out edge (→ bar info / → stat success) で 1 signal → N readout の bind 関係明示、 stepper +/- で count 変化 → bar + stat が同時追随、 signal 分岐 dataflow を可視化。",
  }, (p: PhaseBuilder) => p.activate("ctrlNode", "barNode", "statNode").badge("stepper"))
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
  .node("historyNode", { lane: "history", stack: 0, kind: "card", title: "History (15)", subtitle: "sparkline で直近 15 push 履歴" })
  .edge("currentNode", "historyNode", { label: "push", tone: "info" })
  .readout.sparkline("valHist", { source: "val", history: 15, color: "#e57373", label: "Sparkline history" })
  .readout.stat("valStat", { source: "val", label: "Latest", caption: "input 履歴の最新" })
  .phase("p", {
    duration: 1500,
    title: "current → history push",
    body: "2-lane (Current value / History sparkline 15) で number sparkline を分散、 current → history push edge (info tone) で履歴伝搬明示、 number 入力変化で sparkline に直近 15 履歴 push、 stat が最新値。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "historyNode").badge("sparkline"))
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
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "Low mode", subtitle: "option: low" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "Mid mode", subtitle: "option: mid (default)" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "High mode", subtitle: "option: high" })
  .node("currentMode", { lane: "mid", stack: 1, kind: "card", title: "◆ Current", subtitle: "mode = {mode}" })
  .readout.stat("modeStat", { source: "mode", label: "Current", caption: "選択中" })
  .phase("p", {
    duration: 1500,
    title: "radio option split",
    body: "3-lane (Low / Mid / High) で radio 3 option を排他分散、 各 option 個別 card + current indicator (default=mid lane)、 radio click で mode signal 更新 → subtitle と stat readout 追随、 排他選択構造を lane 分割で可視化。",
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
  .node("pickerNode", { lane: "picker", stack: 0, kind: "card", title: "Color picker", subtitle: "input.color widget · default #2d6a8f" })
  .node("swatch", { lane: "swatch", stack: 0, kind: "card", title: "Swatch preview", subtitle: "hex: {accent}" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", title: "Hex stat", subtitle: "readout.stat で hex 表示" })
  .edge("pickerNode", "swatch", { label: "select", tone: "info" })
  .edge("swatch", "statNode", { label: "display", tone: "success" })
  .readout.stat("hexReadout", { source: "accent", label: "Selected", caption: "hex color" })
  .phase("p", {
    duration: 1500,
    title: "color pipeline",
    body: "3-lane (Picker input / Swatch preview / Hex stat) で color 生成 pipeline を分散、 2 edge (select info tone / display success tone) で dataflow 明示、 color picker で hex 選択 → swatch subtitle + stat readout が追随、 color 選択の 3 step 経路を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("pickerNode", "swatch", "statNode").badge("color"))
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
    title: "Low 25%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{low25}", fillMax: 100, orient: "up", fill: "#94a3b8" },
  })
  .node("barMid", {
    lane: "mid",
    stack: 0,
    kind: "dyn-rect",
    title: "Mid 50%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{mid50}", fillMax: 100, orient: "up", fill: "#2563eb" },
  })
  .node("barHigh", {
    lane: "high",
    stack: 0,
    kind: "dyn-rect",
    title: "High 75%",
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
    body: "4-lane (Low 25% gray / Mid 50% blue / High 75% orange / Interactive slider teal) で dyn-rect fill を段階比較、 3 static + 1 reactive、 slider 変化で Interactive lane が追随、 fill range を横並び比較 view で明示。",
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
  .node("r1", { lane: "l1", stack: 0, kind: "dyn-rect", title: "Block 1", subtitle: "gas: {gas1}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas1}", fillMax: 150, orient: "up", fill: "#2d6a8f" } })
  .node("r2", { lane: "l2", stack: 0, kind: "dyn-rect", title: "Block 2", subtitle: "gas: {gas2}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" } })
  .node("r3", { lane: "l3", stack: 0, kind: "dyn-rect", title: "Block 3", subtitle: "gas: {gas3}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" } })
  .phase("p", { duration: 1500, title: "chain 追随 = 前値が formula で次を駆動", body: "base slider を動かすと gas1 = base、 gas2 = base*1.2、 gas3 = base*1.5 で連動、 3 rect の fill が同時に伸縮。" }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3").badge("chain fill"))
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
  .input.slider("p", { min: 0, max: 100, defaultValue: 60, label: "Progress" })
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
    title: "circle progress compare",
    body: "4-lane (0% gray / 33% blue / 66% orange / Interactive slider teal) で dyn-circle progress ring を段階比較、 3 static + 1 reactive、 slider 変化で Interactive lane が追随、 progress ring range を横並び比較 view で明示。",
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
  .node("gMin", { lane: "min", stack: 0, kind: "dyn-arc", title: "0°", subtitle: "min", w: 180, h: 180,
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
    body: "4-lane (0° gray / 90° blue / 180° orange / Interactive slider teal) で dyn-arc sweep を段階比較、 3 static + 1 reactive、 slider 変化で Interactive lane が追随、 arc angle range (0-270° 内 4 point) を横並び比較 view で明示。",
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
  .input.slider("lvl", { min: 0, max: 100, defaultValue: 55, label: "Level" })
  .state("lvl", { initial: 55 })
  .state("lvl25", { initial: 25 })
  .state("lvl50", { initial: 50 })
  .state("lvl75", { initial: 75 })
  .node("wLow", { lane: "low", stack: 0, kind: "dyn-wave", title: "Low 25%", subtitle: "25%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl25}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#94a3b8" } })
  .node("wHalf", { lane: "half", stack: 0, kind: "dyn-wave", title: "Half 50%", subtitle: "50%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl50}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#2563eb" } })
  .node("wHigh", { lane: "high", stack: 0, kind: "dyn-wave", title: "High 75%", subtitle: "75%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl75}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#f97316" } })
  .node("w", { lane: "interactive", stack: 0, kind: "dyn-wave", title: "Slider", subtitle: "{lvl}%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" } })
  .phase("p", {
    duration: 1500,
    title: "tank level compare",
    body: "4-lane (Low 25% gray / Half 50% blue / High 75% orange / Interactive slider teal) で dyn-wave tank level を段階比較、 3 static + 1 reactive、 slider 変化で Interactive lane が追随、 tank / battery level range を横並び比較 view で明示。",
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
    body: "4-lane (Triangle 3 sides gray / Hexagon 6 sides blue / Octagon 8 sides orange / Interactive hexagon slider teal) で dyn-polygon sides を段階比較、 3 static + 1 reactive、 rot/radius slider 変化で Interactive lane が追随 (回転 + 拡縮)、 polygon shape variety を横並び比較 view で明示。",
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
  .phase("p", { duration: 1500, title: "repeat + derive で 5 rect が chain 伝搬", body: "count=5、 base を動かすと gas1..gas5 が formula chain で連鎖伝搬、 5 rect の fill が同時追随。" }, (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3", "r4").badge("repeat + derive"))
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
  .input.slider("rev", { min: 0, max: 500, defaultValue: 250, label: "Revenue" })
  .input.dropdown("status", { options: ["active", "pending", "closed"], defaultValue: "active", label: "Status" })
  .state("rev", { initial: 250 })
  .state("status", { initial: "active" })
  .node("countNode", { lane: "count", stack: 0, kind: "card", title: "Countup", subtitle: "rev={rev} · animated $ counter" })
  .node("deltaNode", { lane: "delta", stack: 0, kind: "card", title: "Delta", subtitle: "rev={rev} · ↑↓ arrow" })
  .node("ringNode", { lane: "ring", stack: 0, kind: "card", title: "Percent ring", subtitle: "rev/500 = {rev} progress" })
  .node("textNode", { lane: "text", stack: 0, kind: "card", title: "Typewriter", subtitle: "status={status} · char reveal" })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "Revenue count" })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ delta" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "Progress ring" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "Status text" })
  .phase("p", {
    duration: 1500,
    title: "readout 4-way split",
    body: "4-lane (Countup / Delta / Percent ring / Typewriter) で 4 dynamic readout を機能別分散、 各 readout 個別 card + 対応 readout node、 revenue slider → 3 readout 追随 (countup/delta/ring)、 status dropdown → typewriter reveal、 1 signal → N readout の bind 関係を lane 分割で可視化。",
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
    title: "timeline fan-out",
    body: "3-lane (Timeline control / Rect shape / Arc shape) で time signal → 2 shape の 1:N fan-out を分散、 2 edge (t→bar info / t→angle accent) で formula dependency 明示、 play/pause/scrub で time 制御、 rect fill + arc angle が同時追随、 timeline dataflow を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("timeNode", "r", "a").badge("timeline"))
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
  .input.slider("flow", { min: 1, max: 15, defaultValue: 5, label: "Flow Width" })
  .input.timeline("t", { duration: 2000, autoplay: true, loop: true, label: "Timeline" })
  .formula("dash", "t * 24")
  .state("flow", { initial: 5 })
  .state("t", { initial: 0 })
  .state("dash", { initial: 0 })
  .node("a", { lane: "src", stack: 0, kind: "card", title: "Source", subtitle: "producer" })
  .node("pipeNode", { lane: "pipe", stack: 0, kind: "card", title: "Pipe", subtitle: "width={flow} · dash={dash}" })
  .node("b", { lane: "sink", stack: 0, kind: "card", title: "Sink", subtitle: "consumer" })
  .edge("a", "pipeNode", { label: "produce", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .edge("pipeNode", "b", { label: "consume", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .phase("p", {
    duration: 1500,
    title: "flow pipeline",
    body: "3-lane (Source / Pipe / Sink) で dataflow を横並び分散、 2 edge (Source→Pipe / Pipe→Sink) が widthBind + dashOffsetBind で slider/timeline 追随、 flow slider で太さ、 timeline で dashoffset 変化 → 破線が横 lane を流れる animation、 pipeline 構造と edge signal bind を同時可視化。",
  }, (p: PhaseBuilder) => p.activate("a", "pipeNode", "b").badge("edge bind"))
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
  .input.range("priceRange", { min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "Price Range" })
  .input.multiSelect("tags", { options: ["new", "sale", "hot", "featured"], defaultValues: ["new"], label: "Tags" })
  .input.tabs("view", { options: ["grid", "list", "compact"], defaultValue: "grid", label: "View" })
  .input.text("query", { defaultValue: "", placeholder: "Search...", maxLength: 50, label: "Query" })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "new" })
  .state("view", { initial: "grid" })
  .state("query", { initial: "" })
  .node("rangeNode", { lane: "range", stack: 0, kind: "card", title: "Range slider", subtitle: "price = {priceRange}" })
  .node("multiNode", { lane: "multi", stack: 0, kind: "card", title: "Multi-select", subtitle: "tags = {tags}" })
  .node("tabsNode", { lane: "tabs", stack: 0, kind: "card", title: "Tabs", subtitle: "view = {view}" })
  .node("textNode", { lane: "text", stack: 0, kind: "card", title: "Text input", subtitle: "query = {query}" })
  .phase("p", {
    duration: 1500,
    title: "input widget 4-way split",
    body: "4-lane (Range / MultiSelect / Tabs / Text) で 4 input widget を機能別分散、 各 widget 個別 card で bind signal 明示、 各 input が独立 signal を持つ複合入力構造を lane 分割で可視化。",
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
  .input.dropdown("state", { options: ["online", "offline", "error"], defaultValue: "online", label: "State" })
  .state("temp", { initial: 42 })
  .state("state", { initial: "online" })
  .node("heatNode", { lane: "heat", stack: 0, kind: "card", title: "Heat cell", subtitle: "temp = {temp} · 色 gradient" })
  .node("badgeNode", { lane: "badge", stack: 0, kind: "card", title: "Badge (pill)", subtitle: "temp = {temp} · number pill" })
  .node("dotNode", { lane: "dot", stack: 0, kind: "card", title: "Status dot", subtitle: "state = {state} · online/offline/error" })
  .readout.heatCell("tempHeat", { source: "temp", min: 0, max: 100, colors: ["#4e9dc4", "#e57373"], label: "Temp gradient" })
  .readout.badge("tempBadge", { source: "temp", label: "Value pill" })
  .readout.statusDot("statusRead", { source: "state", map: [
    { value: "online", color: "#22c55e", label: "Online" },
    { value: "offline", color: "#94a3b8", label: "Offline" },
    { value: "error", color: "#ef4444", label: "Error" },
  ], label: "State dot" })
  .phase("p", {
    duration: 1500,
    title: "readout variant split",
    body: "3-lane (Heat cell / Badge / Status dot) で 3 readout variant を機能別分散、 各 readout 個別 card で signal 明示、 temp slider → heat + badge / state dropdown → dot が追随、 readout 種別を lane 分割で可視化。",
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
  .node("btn1", { lane: "pointer", stack: 0, kind: "card", title: "Double Click", subtitle: "dblclick event" })
  .node("btn2", { lane: "keyboard", stack: 0, kind: "card", title: "Key Focus", subtitle: "focus + blur + keydown 3 event" })
  .node("btn3", { lane: "touch", stack: 0, kind: "card", title: "Long Press", subtitle: "longpress 500ms hold" })
  .on.doubleClick({ kind: "node", id: "btn1" }, "on-dbl")
  .on.focus({ kind: "node", id: "btn2" }, "on-focus")
  .on.blur({ kind: "node", id: "btn2" }, "on-blur")
  .on.keydown({ kind: "node", id: "btn2" }, "on-key")
  .on.longPress({ kind: "node", id: "btn3" }, "on-long")
  .phase("p", {
    duration: 1500,
    title: "event category split",
    body: "3-lane (Pointer=Double Click / Keyboard=Focus+Blur+Keydown / Touch=Long Press) で 5 event を category 別分散、 3 target node に 5 event bind、 consumer handler map で dbl/focus/blur/keydown/longpress を実装、 event 分類と bind の 2 経路 view。",
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
  .input.stepper("r", { min: 0, max: 2, defaultValue: 0, label: "Row" })
  .input.stepper("c", { min: 0, max: 3, defaultValue: 0, label: "Col" })
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
  .readout.stat("hover", { source: "r", label: "Row" })
  .readout.stat("hoverC", { source: "c", label: "Col" })
  .phase("p", {
    duration: 1200,
    title: "grid split by column",
    body: "4-lane (Col 0 / Col 1 / Col 2 / Col 3) で 12 cell を列別分散、 gridNodes(3,4,tpl) の template で lane を `col{c}` に動的割当、 各 lane に 3 row (stack 0-2)、 3×4 matrix を実 2D 配置 (col → lane、 row → stack) で明示化、 stat readout で row/col 座標追跡。",
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
  topic: "arraySignal 5 element を 2-lane (Aggregate stat / Individual items) 分散、 各 element 個別 card + 集約 card、 arrayBar/arrayList readout 併存",
})
  .lane("agg", { x: 0, width: 240 })
  .lane("items", { x: 300, width: 260 })
  .arraySignal("xs", [12, 34, 20, 45, 28])
  .input.slider("bump", { min: 0, max: 50, defaultValue: 20, label: "First bar" })
  .node("summary", {
    lane: "agg",
    stack: 0,
    kind: "card",
    title: "Array aggregate",
    subtitle: "count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}",
  })
  .node("bumpNode", { lane: "agg", stack: 1, kind: "card", title: "Bump control", subtitle: "first bar override = {bump}" })
  .node("i0", { lane: "items", stack: 0, kind: "card", title: "#0", subtitle: "xs[0] = 12" })
  .node("i1", { lane: "items", stack: 1, kind: "card", title: "#1", subtitle: "xs[1] = 34" })
  .node("i2", { lane: "items", stack: 2, kind: "card", title: "#2", subtitle: "xs[2] = 20" })
  .node("i3", { lane: "items", stack: 3, kind: "card", title: "#3", subtitle: "xs[3] = 45 (max)" })
  .node("i4", { lane: "items", stack: 4, kind: "card", title: "#4", subtitle: "xs[4] = 28" })
  .readout.arrayBar("hist", { source: "xs", min: 0, max: 50, color: "#2563eb", label: "Bars (histogram)" })
  .readout.arrayList("items", { source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "Items (bullet list)" })
  .readout.stat("first", { source: "bump", label: "Bump" })
  .phase("p", {
    duration: 1200,
    title: "array aggregate / element split",
    body: "2-lane (Aggregate stat + Bump control / Individual items 5 個) で arraySignal を集約と要素別に分散、 aggregate lane に summary + bump control、 items lane に 5 個別 element card、 arrayBar + arrayList readout も併存で histogram + bullet 表示、 集約と要素の 2 view。",
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
  .input.slider("progress", { min: 0, max: 100, defaultValue: 40, label: "Progress" })
  .state("progress", { initial: 40 })
  .state("done", { initial: 0 })
  .formula("done", "progress >= 100 ? 1 : 0")
  .node("main", { lane: "state", stack: 0, kind: "card", title: "Task state", subtitle: "{progress}% complete" })
  .node("pathNode", { lane: "visual", stack: 0, kind: "card", title: "Path visual", subtitle: "SVG stroke-dashoffset で進行" })
  .node("ringNode", { lane: "visual", stack: 1, kind: "card", title: "Percent ring", subtitle: "同時追随" })
  .node("ok", { lane: "done", stack: 0, kind: "card", title: "✓ Done", subtitle: "progress=100% で visibleIf 発動", visibleIf: "{done}" })
  .readout.pathProgress("pp", {
    source: "progress",
    pathD: "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10",
    viewW: 270,
    viewH: 40,
    strokeWidth: 5,
    color: "#22c55e",
    max: 100,
    label: "Path (zigzag)",
  })
  .readout.percentRing("ring", { source: "progress", max: 100, color: "#22c55e", label: "Ring" })
  .phase("p", {
    duration: 1200,
    title: "progress flow split",
    body: "3-lane (State / Visual / Completion) で path progress を機能別分散、 state lane に slider driven main、 visual lane に pathProgress + percentRing 2 readout node、 done lane に visibleIf で 100% 時のみ現れる ok badge、 progress signal → path 進行 → 完了 badge の flow を lane 分割で明示。",
  }, (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode", "ok").badge("progress + hide"))
  .build();

/**
 * 27. lineChart readout = array signal を折れ線 chart 表示 (時系列 like)。
 */
export const arrayLineChart = diagram("interactive-array-line-chart", {
  topic: "arraySignal line chart を 3-lane (Data source / Area chart fill / Line chart no-fill) 分散、 chart variant 別 lane 展開、 lineChart 2 種類併存",
})
  .lane("data", { x: 0, width: 200 })
  .lane("area", { x: 240, width: 280 })
  .lane("line", { x: 540, width: 280 })
  .arraySignal("series", [22, 35, 28, 42, 55, 48, 60, 72, 65, 80])
  .node("dataCard", { lane: "data", stack: 0, kind: "card", title: "Time series", subtitle: "n={series.length} · sum={series.sum} · avg={series.avg}" })
  .node("areaCard", { lane: "area", stack: 0, kind: "card", title: "Area chart (fill=true)", subtitle: "blue #2563eb · viewH=70" })
  .node("lineCard", { lane: "line", stack: 0, kind: "card", title: "Line chart (fill=false)", subtitle: "orange #f97316 · viewH=50" })
  .readout.lineChart("chart", { source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "Area chart" })
  .readout.lineChart("chartNoFill", { source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "Line chart" })
  .phase("p", {
    duration: 1200,
    title: "chart variant compare",
    body: "3-lane (Data source / Area chart fill=true / Line chart fill=false) で 10 point time series を chart variant 別分散、 同 data source を 2 種 lineChart readout (area/line) で並列比較、 fill option 差異を横並び view で明示。",
  }, (p: PhaseBuilder) => p.activate("dataCard", "areaCard", "lineCard").badge("line chart"))
  .build();

/**
 * 28. stackedBar readout = 2 array を並列 bar 比較、 A/B histogram の per-index 対比。
 */
export const arrayStackedBar = diagram("interactive-array-stacked-bar", {
  topic: "2 arraySignal (A/B) を 2-lane (Group A blue / Group B orange) 分散 + comparison edge、 各 group 個別 card + stackedBar readout 併存",
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
    subtitle: "sum={groupA.sum} · avg={groupA.avg} · max={groupA.max}",
  })
  .node("aDetail", { lane: "groupA", stack: 1, kind: "card", title: "A 5 element", subtitle: "[40, 55, 30, 65, 45]" })
  .node("bCard", {
    lane: "groupB",
    stack: 0,
    kind: "card",
    title: "Group B (orange)",
    subtitle: "sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}",
  })
  .node("bDetail", { lane: "groupB", stack: 1, kind: "card", title: "B 5 element", subtitle: "[25, 40, 50, 35, 60]" })
  .edge("aCard", "bCard", { label: "A vs B diff", tone: "warning" })
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
    body: "2-lane (Group A blue / Group B orange) で 2 arraySignal を group 別分散、 各 group に main card + detail element list、 comparison edge (warning tone) で A vs B diff 明示、 stackedBar readout も併存で per-index 隣接 bar 比較、 group 分類と bar 比較の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard", "bDetail").badge("stacked bar"))
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
  .node("hub", { lane: "hub", stack: 0, kind: "card", title: "Hub", subtitle: "center · 6 spoke に fan-out" })
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
    body: "radialNodes(6, 90) + hub → 6 spoke edge の 真の network diagram、 renderOffsetX/Y で spoke を円周上に配置、 6 edge で hub 中心の star topology を表現。",
  }, (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1", "spoke-2", "spoke-3", "spoke-4", "spoke-5").badge("hub-and-spoke"))
  .build();

/**
 * 30. waterfall readout = 5 element を左から累積、 正 / 負 で色分け (財務 waterfall chart)。
 */
export const arrayWaterfall = diagram("interactive-array-waterfall", {
  topic: "arraySignal waterfall 5 element を 2-lane (Positive changes / Negative changes) 分散、 各 element 個別 card、 waterfall readout 併存",
})
  .lane("pos", { x: 0, width: 300 })
  .lane("neg", { x: 340, width: 300 })
  .arraySignal("changes", [100, -30, 50, -20, 40])
  .node("pos1", { lane: "pos", stack: 0, kind: "card", title: "+100", subtitle: "step 0 (initial gain)" })
  .node("pos2", { lane: "pos", stack: 1, kind: "card", title: "+50", subtitle: "step 2 (recovery)" })
  .node("pos3", { lane: "pos", stack: 2, kind: "card", title: "+40", subtitle: "step 4 (final gain)" })
  .node("neg1", { lane: "neg", stack: 0, kind: "card", title: "-30", subtitle: "step 1 (loss)" })
  .node("neg2", { lane: "neg", stack: 1, kind: "card", title: "-20", subtitle: "step 3 (loss)" })
  .node("summary", { lane: "pos", stack: 3, kind: "card", title: "Waterfall summary", subtitle: "final = sum = {changes.sum}" })
  .readout.waterfall("wf", {
    source: "changes",
    min: -30,
    max: 150,
    viewW: 280,
    viewH: 90,
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "Changes (waterfall)",
  })
  .readout.arrayList("items", { source: "changes", itemTemplate: "step {i}: {item}", label: "Steps" })
  .phase("p", {
    duration: 1200,
    title: "positive vs negative split",
    body: "2-lane (Positive changes 3 個 / Negative changes 2 個) で 5 waterfall element を符号別分散、 各 element 個別 card + summary card (pos lane 内)、 waterfall readout も併存で累積 bar 表示、 正/負 分類と累積 chart の 2 経路 view。",
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
  .node("anchor", { lane: "anchor", stack: 0, kind: "card", title: "Anchor (constant)", subtitle: "固定位置、 signal bind なし" })
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
    body: "2-lane (Anchor / Floater) で renderOffset bind の有無を対比、 anchor は lane 固定位置、 floater は renderOffsetX/Y に signal template、 slider 変化で floater が実際に横 / 縦 drift、 lane 分割で reactive vs constant を可視化。",
  }, (p: PhaseBuilder) => p.activate("anchor", "floater").badge("offset bind"))
  .build();

/**
 * 32. matrix readout = 4×4 の 2D array を色 gradient で表示 (confusion matrix / heatmap 用)。
 */
export const matrixHeatmap = diagram("interactive-matrix-heatmap", {
  topic: "4×4 confusion matrix を 4-lane (class 0/1/2/3) 分散、 各 class の diagonal (correct) / off-diagonal (wrong) を個別 card 表示、 matrix readout 併存",
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
  .node("c0Wrong", { lane: "c0", stack: 1, kind: "card", title: "Class 0 ✕", subtitle: "wrong = 2 (row sum - diag)" })
  .node("c1Diag", { lane: "c1", stack: 0, kind: "card", title: "Class 1 ✓", subtitle: "correct = 7 (diagonal)" })
  .node("c1Wrong", { lane: "c1", stack: 1, kind: "card", title: "Class 1 ✕", subtitle: "wrong = 3 (row sum - diag)" })
  .node("c2Diag", { lane: "c2", stack: 0, kind: "card", title: "Class 2 ✓", subtitle: "correct = 9 (diagonal)" })
  .node("c2Wrong", { lane: "c2", stack: 1, kind: "card", title: "Class 2 ✕", subtitle: "wrong = 3 (row sum - diag)" })
  .node("c3Diag", { lane: "c3", stack: 0, kind: "card", title: "Class 3 ✓", subtitle: "correct = 6 (diagonal)" })
  .node("c3Wrong", { lane: "c3", stack: 1, kind: "card", title: "Class 3 ✕", subtitle: "wrong = 2 (row sum - diag)" })
  .readout.matrix("m", { source: "cm", min: 0, max: 10, cellSize: 30, showValue: true, colors: ["#f0f4f8", "#0369a1"] as const, label: "Predictions (4×4)" })
  .phase("p", {
    duration: 1200,
    title: "confusion split",
    body: "4-lane (Class 0/1/2/3) で 4×4 confusion matrix を class 別に分散、 各 lane 内で correct (diagonal) と wrong (off-diagonal) を個別 card、 matrix readout も併存で色 gradient cell 表示、 class 別精度と 2D 相関の 2 経路 view。",
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
  .node("implNode", { lane: "advanced", stack: 0, kind: "card", title: "Impl", subtitle: "75% (advanced)" })
  .node("docsNode", { lane: "advanced", stack: 1, kind: "card", title: "Docs", subtitle: "90% (advanced)" })
  .node("designNode", { lane: "behind", stack: 0, kind: "card", title: "Design", subtitle: "40% (behind)" })
  .node("testNode", { lane: "behind", stack: 1, kind: "card", title: "Test", subtitle: "20% (behind)" })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "Tasks (progressGroup)",
  })
  .phase("p", {
    duration: 1200,
    title: "sprint split",
    body: "2-lane (Advanced ≥50% / Behind <50%) で 4 task を進捗率別に分散、 各 task 個別 card で progress % 明示、 progressGroup readout も併存で per-row bar 表示、 sprint 進捗を lane 分割で visual triage。",
  }, (p: PhaseBuilder) => p.activate("implNode", "docsNode", "designNode", "testNode").badge("task list"))
  .build();

/**
 * 34. eip1559GasFlow v2 = Ethereum L1 で ETH 送金 tx を submit → mempool → 採掘 → 確定する EIP-1559 gas 動的計算シナリオ、 shape-wallet + shape-mobile-device + shape-stack (mempool) + shape-blockchain-block × 2 + shape-blockchain の 6 shape で visual scene 化、 4 phase (署名 → mempool 滞留 → 採掘 → 確定) + 4 readout (gauge baseFee 上昇 / bar totalGwei 伸長 / traffic-light tx status / countup blockNumber) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const eip1559GasFlow = diagram("interactive-eip1559", {
  topic: "Ethereum EIP-1559 gas 動的計算 = 4 phase (署名 → mempool → 採掘 → 確定) の flow を shape-* primitive 6 種で表現 + 4 readout (gauge baseFee / bar totalGwei / traffic-light status / countup block#) が tween で visually 連続変化",
})
  .lane("sender", { x: 0, width: 220 })
  .lane("mempool", { x: 240, width: 240 })
  .lane("chain", { x: 500, width: 280 })
  .state("baseFee", { initial: 30 })
  .state("totalGwei", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("blockNumber", { initial: 18543210 })
  .node("wallet", { lane: "sender", stack: 0, kind: "shape-wallet", title: "MetaMask EOA", eyebrow: "sender", subtitle: "0x742d...5a1f" })
  .node("mobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "user 端末", eyebrow: "device", subtitle: "0.5 ETH 送金 tx 署名" })
  .node("pool", { lane: "mempool", stack: 0, kind: "shape-stack", title: "mempool", eyebrow: "queue", subtitle: "pending 128 tx · fee 順 sort" })
  .node("blockN", { lane: "chain", stack: 0, kind: "shape-blockchain-block", title: "Block N", eyebrow: "block", subtitle: "gas 15M/30M · base {baseFee} gwei" })
  .node("blockN1", { lane: "chain", stack: 1, kind: "shape-blockchain-block", title: "Block N+1", eyebrow: "block", subtitle: "gas 22M/30M · base×1.05" })
  .node("chainNode", { lane: "chain", stack: 2, kind: "shape-blockchain", title: "Ethereum L1", eyebrow: "chain", subtitle: "block #{blockNumber} · finality 12+" })
  .edge("wallet", "mobile", { label: "秘密鍵署名", tone: "info" })
  .edge("mobile", "pool", { label: "eth_sendRawTransaction", tone: "info" })
  .edge("pool", "blockN", { label: "採掘 include", tone: "success" })
  .edge("blockN", "blockN1", { label: "次 block (fee ±12.5%)", tone: "warning" })
  .edge("blockN1", "chainNode", { label: "finality 確定", tone: "success" })
  .readout.gauge("baseFeeG", { source: "baseFee", min: 0, max: 100, color: "#f97316", label: "base fee (gwei)" })
  .readout.bar("totalBar", { source: "totalGwei", min: 0, max: 5000, color: "#22c55e", label: "総 gas コスト (gwei)" })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "tx status (0=pending / 1=mining / 2=confirmed)" })
  .readout.countup("blockCU", { source: "blockNumber", unit: "", label: "block #", decimals: 0 })
  .phase("p1", {
    duration: 2200,
    title: "tx 署名 + 送信",
    body: "MetaMask で 0.5 ETH 送金 tx を秘密鍵署名。 baseFee = 30 gwei (gauge 針中位)、 status 0 = pending (traffic-light 赤)、 totalGwei 0 (bar 空、 未 include)。 sender lane 全 active。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile").set("baseFee", 30).set("txStatus", 0).set("totalGwei", 0).badge("署名"))
  .phase("p2", {
    duration: 2400,
    title: "mempool 滞留",
    body: "128 pending tx が fee 優先度順にソート、 需要増で baseFee が 30 → 45 gwei tween (gauge 針が橙域まで上昇)、 totalGwei 0 → 940 tween (base×gasUsed 21000 で bar 半分伸長)、 status 0 のまま (traffic-light 赤 継続)。 mempool lane 追加 active。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool").tween("baseFee", 30, 45).tween("totalGwei", 0, 940).badge("mempool"))
  .phase("p3", {
    duration: 2200,
    title: "採掘 (Block N)",
    body: "Miner が Block N に tx を含める、 gas 15M/30M で採掘実行。 baseFee 45 → 47 tween (供給調整 +5%)、 status 0 → 1 tween (traffic-light 赤 → 黄 = mining)、 totalGwei 940 → 987 tween (base 微増で bar 追随)、 chain lane に blockN activate、 pool → blockN が success tone edge。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool", "blockN").tween("baseFee", 45, 47).tween("totalGwei", 940, 987).tween("txStatus", 0, 1).badge("採掘"))
  .phase("p4", {
    duration: 2000,
    title: "確定 (Block N+1)",
    body: "次 block も base ±12.5% 変動、 blockN+1 で 6-block confirmation 達成 → finality。 baseFee 47 → 50 tween (継続需要)、 status 1 → 2 tween (traffic-light 黄 → 緑 = confirmed)、 blockNumber 18543210 → 18543211 tween (countup 動的増加)、 全 6 shape active、 chain 確定 log。",
  }, (p: PhaseBuilder) => p.activate("wallet", "mobile", "pool", "blockN", "blockN1", "chainNode").tween("baseFee", 47, 50).tween("txStatus", 1, 2).tween("blockNumber", 18543210, 18543211).badge("確定"))
  .build();

/**
 * 36. oauthFlow v2 = 実 Google Sign-In (OAuth 2.0 Authorization Code + PKCE) シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 5 phase (login click → consent → code exchange → token 発行 → API call) + 4 readout (sequenceTimeline / gauge latency / countup token 発行数 / traffic-light state) が tween で visually 連続変化。 iteration 8 wave 8-B redesign。
 */
export const oauthFlow = diagram("interactive-oauth-flow", {
  topic: "実 OAuth 2.0 Authorization Code + PKCE (Google Sign-In) シナリオ = 5 phase (click → consent → code exchange → token → API) の flow を shape-* primitive 6 種で表現 + 4 readout (sequenceTimeline / gauge latency / countup / traffic-light) が tween で visually 連続変化",
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
  .node("shopper", { lane: "user", stack: 0, kind: "shape-person", title: "田中様", eyebrow: "user", subtitle: "Google Sign-In クリック" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone Safari", eyebrow: "device", subtitle: "PKCE code_verifier 保管" })
  .node("app", { lane: "app", stack: 0, kind: "shape-website", title: "MyApp SPA", eyebrow: "client", subtitle: "React app · client_id 公開" })
  .node("authServer", { lane: "google", stack: 0, kind: "shape-server-rack", title: "accounts.google.com", eyebrow: "authz-server", subtitle: "consent + code 発行 · latency {latency}ms" })
  .node("tokenEndpoint", { lane: "google", stack: 1, kind: "shape-hexagon", title: "token endpoint", eyebrow: "signer", subtitle: "RS256 · access + id_token" })
  .node("apiResource", { lane: "google", stack: 2, kind: "shape-cloud", title: "Gmail API", eyebrow: "resource", subtitle: "scope=gmail.readonly" })
  .edge("shopper", "mobile", { label: "1. click", tone: "info" })
  .edge("mobile", "app", { label: "2. PKCE gen", tone: "info" })
  .edge("app", "authServer", { label: "3. authorize", tone: "info" })
  .edge("authServer", "app", { label: "4. code + state", tone: "success", side: "left" })
  .edge("app", "tokenEndpoint", { label: "5. code exchange (with verifier)", tone: "accent" })
  .edge("tokenEndpoint", "app", { label: "6. tokens", tone: "success", side: "left" })
  .edge("app", "apiResource", { label: "7. GET (Bearer)", tone: "success" })
  .readout.sequenceTimeline("seq", { source: "events", min: 0, max: 800, viewW: 400, viewH: 70, color: "#2563eb", label: "OAuth timeline" })
  .readout.gauge("latencyG", { source: "latency", min: 0, max: 500, color: "#f97316", label: "server latency (ms)" })
  .readout.countup("tokenCU", { source: "tokenCount", unit: " 件", label: "本日 token 発行数", decimals: 0 })
  .readout.trafficLight("stateTL", { source: "flowState", label: "flow state" })
  .phase("p1", {
    duration: 1800,
    title: "click → redirect",
    body: "田中様が MyApp で Google Sign-In クリック、 PKCE code_verifier 生成 → code_challenge 送信。 latency 0 → 60ms tween、 flowState = 0 (traffic-light 赤)、 tokenCount 保持。 user + app lane active。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app").tween("latency", 0, 60).set("flowState", 0).badge("click"))
  .phase("p2", {
    duration: 2200,
    title: "consent (Google)",
    body: "Google accounts で consent 画面表示、 田中様が gmail.readonly scope 承認。 latency 60 → 180ms tween (gauge 針上昇、 対話 UI 表示時間)、 flowState 0 → 1 tween (traffic-light 赤 → 黄 = 認証中)、 authServer lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer").tween("latency", 60, 180).tween("flowState", 0, 1).badge("consent"))
  .phase("p3", {
    duration: 2200,
    title: "code exchange (PKCE)",
    body: "authorization code を token endpoint に POST、 code_verifier を PKCE 検証。 latency 180 → 240ms tween、 tokenEndpoint lane activate、 hexagon shape が signer role で強調。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint").tween("latency", 180, 240).badge("code"))
  .phase("p4", {
    duration: 2000,
    title: "token 発行",
    body: "access_token + id_token 発行 (RS256 署名)。 latency 240 → 120ms tween (bar 収縮)、 flowState 1 → 2 tween (traffic-light 黄 → 緑 = 認証済)、 tokenCount 45238 → 45239 tween (countup 加算 = 本日 1 件目)。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint").tween("latency", 240, 120).tween("flowState", 1, 2).tween("tokenCount", 45238, 45239).badge("token"))
  .phase("p5", {
    duration: 1800,
    title: "API call (Gmail)",
    body: "Bearer token で Gmail API に GET /me/messages、 protected data 取得。 latency 120 → 90ms tween、 apiResource lane activate、 6 shape 全 active、 SSO flow 完遂。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "app", "authServer", "tokenEndpoint", "apiResource").tween("latency", 120, 90).badge("API"))
  .build();

/**
 * 36. decisionTree v2 = 医療 triage システムの臨床決定木 シナリオ (発熱患者を 3 level 判定で ICU/一般病棟/帰宅の 4 経路に振り分け)、 shape-person + shape-mobile-device + shape-diamond × 3 + shape-server-rack + shape-cloud の 7 shape で visual scene 化、 4 phase (受付 → 一次判定 → 二次判定 → 転帰決定) + 4 readout (traffic-light 判定 status / countup 判定件数 / gauge 判定所要時間 / stat リスクスコア) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const decisionTree = diagram("interactive-decision-tree", {
  topic: "医療 triage 臨床決定木 シナリオ = 4 phase (受付 → 一次 → 二次 → 転帰) の flow を shape-* primitive 7 種で表現 + 4 readout (traffic-light / countup / gauge / stat) が tween で visually 連続変化",
})
  .lane("intake", { x: 0, width: 220 })
  .lane("triage", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("phaseStatus", { initial: 0 })
  .state("caseCount", { initial: 342 })
  .state("elapsedSec", { initial: 0 })
  .state("riskScore", { initial: 0 })
  .node("patient", { lane: "intake", stack: 0, kind: "shape-person", title: "受診者 山田様", eyebrow: "patient", subtitle: "発熱 39.2℃ · 来院時刻 21:14" })
  .node("nurse", { lane: "intake", stack: 1, kind: "shape-mobile-device", title: "看護師 tablet", eyebrow: "device", subtitle: "electronic triage form" })
  .node("qFever", { lane: "triage", stack: 0, kind: "shape-diamond", title: "Q1: 熱 ≥ 38℃?", eyebrow: "root", subtitle: "yes → Q2 · no → Q3" })
  .node("qBreath", { lane: "triage", stack: 1, kind: "shape-diamond", title: "Q2: 呼吸苦?", eyebrow: "mid-yes", subtitle: "yes → ICU · no → 一般病棟" })
  .node("qBloodTest", { lane: "triage", stack: 2, kind: "shape-diamond", title: "Q3: 血液検査 異常?", eyebrow: "mid-no", subtitle: "yes → 一般病棟 · no → 帰宅" })
  .node("emr", { lane: "outcome", stack: 0, kind: "shape-server-rack", title: "EMR system", eyebrow: "backend", subtitle: "判定 log 記録 · HL7 送信" })
  .node("board", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "転帰 board", eyebrow: "assignment", subtitle: "ICU / 一般病棟 / 帰宅 の振り分け" })
  .edge("patient", "nurse", { label: "問診", tone: "info" })
  .edge("nurse", "qFever", { label: "root 判定", tone: "info" })
  .edge("qFever", "qBreath", { label: "yes (発熱)", tone: "warning" })
  .edge("qFever", "qBloodTest", { label: "no (平熱)", tone: "success" })
  .edge("qBreath", "board", { label: "yes → ICU", tone: "error" })
  .edge("qBreath", "board", { label: "no → 一般", tone: "warning" })
  .edge("qBloodTest", "board", { label: "yes → 一般", tone: "warning" })
  .edge("qBloodTest", "board", { label: "no → 帰宅", tone: "success" })
  .edge("board", "emr", { label: "log 記録", tone: "accent" })
  .readout.trafficLight("statusTL", { source: "phaseStatus", label: "triage 進行状態" })
  .readout.countup("caseCU", { source: "caseCount", unit: " 件", label: "本日 triage 件数", decimals: 0 })
  .readout.gauge("timeG", { source: "elapsedSec", min: 0, max: 300, color: "#f97316", label: "所要時間 (秒)" })
  .readout.stat("riskStat", { source: "riskScore", unit: "/10", caption: "重症度 score", label: "risk" })
  .phase("p1", {
    duration: 1800,
    title: "受付",
    body: "山田様が来院、 看護師が電子 triage form 開始。 phaseStatus 0 (traffic-light 赤 = 未判定)、 elapsedSec 0 → 30 tween (bar 立上がり)、 riskScore = 0 (未評価)、 caseCount 342 保持。 intake lane full active。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse").set("phaseStatus", 0).tween("elapsedSec", 0, 30).set("riskScore", 0).badge("受付"))
  .phase("p2", {
    duration: 2200,
    title: "一次判定 (Q1: 発熱)",
    body: "root node で熱 39.2℃ 確認 → yes 経路。 phaseStatus 0 → 1 tween (traffic-light 赤 → 黄 = 判定中)、 elapsedSec 30 → 90 tween、 riskScore 0 → 3 tween (中等度リスク表示、 stat が動的加算)、 qFever diamond activate + qFever → qBreath の warning edge highlight。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath").tween("phaseStatus", 0, 1).tween("elapsedSec", 30, 90).tween("riskScore", 0, 3).badge("Q1"))
  .phase("p3", {
    duration: 2200,
    title: "二次判定 (Q2: 呼吸苦)",
    body: "呼吸苦の主訴なし → 一般病棟経路。 phaseStatus 1 保持 (traffic-light 黄)、 elapsedSec 90 → 180 tween (gauge 針半分)、 riskScore 3 → 6 tween (中重症、 stat 更新)、 qBloodTest も参照活性化 (対比表示)、 全 3 diamond active。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath", "qBloodTest").set("phaseStatus", 1).tween("elapsedSec", 90, 180).tween("riskScore", 3, 6).badge("Q2"))
  .phase("p4", {
    duration: 2000,
    title: "転帰決定",
    body: "一般病棟入院決定、 EMR に log 記録 + 病棟送信。 phaseStatus 1 → 2 tween (traffic-light 黄 → 緑 = 完了)、 elapsedSec 180 → 210 tween (gauge 針最終、 3.5 分)、 riskScore 6 → 7 tween (最終 score)、 caseCount 342 → 343 tween (countup +1 加算)、 7 shape 全 active、 emr + board activate。",
  }, (p: PhaseBuilder) => p.activate("patient", "nurse", "qFever", "qBreath", "qBloodTest", "emr", "board").tween("phaseStatus", 1, 2).tween("elapsedSec", 180, 210).tween("riskScore", 6, 7).tween("caseCount", 342, 343).badge("転帰"))
  .build();

/**
 * 37. skillRadar v2 = ソフトウェアエンジニア半年 skill 成長 review シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (初回査定 → 学習投資 → 中間確認 → 成長確認) + 4 readout (radar 5 次元 / gauge 総合スコア / countup 学習時間 / stat 成長ポイント) が tween で visually 連続変化。 iteration 8 wave 8-C redesign。
 */
export const skillRadar = diagram("interactive-skill-radar", {
  topic: "エンジニア半年 skill 成長 review シナリオ = 4 phase (初回 → 学習 → 中間 → 成長確認) の flow を shape-* primitive 6 種で表現 + 4 readout (radar / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("engineer", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("review", { x: 580, width: 220 })
  .arraySignal("skills", [3, 3, 3, 3, 3])
  .arraySignal("skillNames", ["Design", "Impl", "Test", "Docs", "Debug"])
  .state("overallScore", { initial: 30 })
  .state("learningHours", { initial: 0 })
  .state("gainedPoints", { initial: 0 })
  .node("engineer", { lane: "engineer", stack: 0, kind: "shape-person", title: "エンジニア 中山様", eyebrow: "engineer", subtitle: "半年 review 対象" })
  .node("laptop", { lane: "engineer", stack: 1, kind: "shape-mobile-device", title: "1on1 tablet", eyebrow: "device", subtitle: "skill assessment form" })
  .node("lms", { lane: "system", stack: 0, kind: "shape-server-rack", title: "LMS platform", eyebrow: "learning", subtitle: "オンライン講座 · 学習時間 tracking" })
  .node("skillDb", { lane: "system", stack: 1, kind: "shape-cylinder", title: "skill matrix DB", eyebrow: "database", subtitle: "5 次元評価履歴" })
  .node("badge", { lane: "system", stack: 2, kind: "shape-hexagon", title: "skill badge 発行", eyebrow: "certificate", subtitle: "レベル達成で自動発行" })
  .node("manager", { lane: "review", stack: 0, kind: "shape-cloud", title: "マネージャー review", eyebrow: "supervisor", subtitle: "成長 sign-off · キャリア判定" })
  .edge("engineer", "laptop", { label: "自己申告", tone: "info" })
  .edge("laptop", "lms", { label: "受講", tone: "success" })
  .edge("lms", "skillDb", { label: "評価反映", tone: "success" })
  .edge("skillDb", "badge", { label: "レベル判定", tone: "accent" })
  .edge("badge", "manager", { label: "承認要求", tone: "success" })
  .readout.radar("radar", { source: "skills", max: 10, labelSource: "skillNames", color: "#2563eb", viewW: 220, viewH: 220, label: "5 次元 skill radar" })
  .readout.gauge("scoreG", { source: "overallScore", min: 0, max: 100, color: "#22c55e", label: "総合スコア" })
  .readout.countup("hoursCU", { source: "learningHours", unit: " h", label: "累計学習時間", decimals: 0 })
  .readout.stat("gainStat", { source: "gainedPoints", unit: " pt", caption: "半年獲得 point", label: "成長" })
  .phase("p1", {
    duration: 2000,
    title: "初回査定",
    body: "中山様の 4 月時点 skill = 全 5 次元 3/10 (radar 星形が中心近く)。 overallScore 30 (gauge 針最下位 30%)、 learningHours 0 (未開始)、 gainedPoints 0。 engineer lane active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop").set("overallScore", 30).set("learningHours", 0).set("gainedPoints", 0).badge("初回"))
  .phase("p2", {
    duration: 2400,
    title: "学習投資",
    body: "LMS で React / TDD / Docs 講座受講、 skillDb に progress 記録。 overallScore 30 → 50 tween (gauge 針中位)、 learningHours 0 → 60 tween (countup 加速)、 gainedPoints 0 → 8 tween (stat 動的加算)、 lms + skillDb lane 追加 activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb").tween("overallScore", 30, 50).tween("learningHours", 0, 60).tween("gainedPoints", 0, 8).badge("学習"))
  .phase("p3", {
    duration: 2200,
    title: "中間確認",
    body: "8 月中間 review、 Design 3→5 / Impl 3→5 / Test 3→6 の伸びを確認 (radar 星形が外周へ拡大方向)。 overallScore 50 → 70 tween、 learningHours 60 → 120 tween、 gainedPoints 8 → 15 tween、 badge lane activate で認定 badge 発行。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb", "badge").tween("overallScore", 50, 70).tween("learningHours", 60, 120).tween("gainedPoints", 8, 15).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "成長確認",
    body: "10 月 final review、 全 5 次元 6-9 に成長 (radar 星形が最終形)。 overallScore 70 → 88 tween (gauge 針最終、 88%)、 learningHours 120 → 180 tween (countup 最終)、 gainedPoints 15 → 22 tween、 manager review + キャリア昇格判定、 6 shape 全 active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "lms", "skillDb", "badge", "manager").tween("overallScore", 70, 88).tween("learningHours", 120, 180).tween("gainedPoints", 15, 22).badge("成長"))
  .build();

/**
 * 38. perfBubbleChart v2 = production infra 週次 workload capacity planning シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-iot-sensor + shape-gear の 6 shape で visual scene 化、 4 phase (メトリクス取得 → workload 分析 → 需給判定 → 最適化) + 4 readout (bubbleChart / gauge 平均 CPU / countup total req / stat scaling 提案) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const perfBubbleChart = diagram("interactive-perf-bubble", {
  topic: "production infra 週次 capacity planning シナリオ = 4 phase (取得 → 分析 → 判定 → 最適化) の flow を shape-* primitive 6 種で表現 + 4 readout (bubbleChart / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "SRE 森様", eyebrow: "engineer", subtitle: "週次 capacity レビュー担当" })
  .node("laptop", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "Grafana dashboard", eyebrow: "ui", subtitle: "5 workload observability" })
  .node("cluster", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "K8s cluster", eyebrow: "compute", subtitle: "3 node · 5 workload · CPU {avgCpu}%" })
  .node("prometheus", { lane: "infra", stack: 1, kind: "shape-cloud", title: "Prometheus", eyebrow: "metrics", subtitle: "1s scrape · time-series DB" })
  .node("sensor", { lane: "infra", stack: 2, kind: "shape-iot-sensor", title: "node exporter", eyebrow: "agent", subtitle: "各 workload CPU / mem / req 収集" })
  .node("autoscaler", { lane: "action", stack: 0, kind: "shape-gear", title: "HPA autoscaler", eyebrow: "engine", subtitle: "target 70% · replicas 動的調整" })
  .edge("sre", "laptop", { label: "確認", tone: "info" })
  .edge("laptop", "prometheus", { label: "PromQL query", tone: "info" })
  .edge("cluster", "sensor", { label: "expose metric", tone: "success" })
  .edge("sensor", "prometheus", { label: "scrape 1s", tone: "success" })
  .edge("prometheus", "laptop", { label: "response", tone: "accent" })
  .edge("laptop", "autoscaler", { label: "scale 指示", tone: "warning" })
  .edge("autoscaler", "cluster", { label: "replicas ×2", tone: "warning" })
  .readout.bubbleChart("bubbles", { source: "perf", xMin: 0, xMax: 100, yMin: 0, yMax: 100, rMin: 0, rMax: 10, color: "#2563eb", viewW: 320, viewH: 200, label: "workloads (perf/cost/usage)" })
  .readout.gauge("cpuG", { source: "avgCpu", min: 0, max: 100, color: "#ef4444", label: "平均 CPU 使用率 %" })
  .readout.countup("reqCU", { source: "totalReq", unit: " req/s", label: "総 request 数", decimals: 0 })
  .readout.stat("scaleStat", { source: "scaleAction", unit: " pods", caption: "追加 pod 数", label: "scale" })
  .phase("p1", {
    duration: 2000,
    title: "メトリクス取得",
    body: "森様が Grafana で 5 workload の週次データ取得。 avgCpu 0 → 40 tween (gauge 針中位)、 totalReq 0 → 2400 tween (countup 加速)、 scaleAction = 0 (未実施)、 bubbleChart で 5 workload の 3 次元 (perf / cost / usage) plot 表示。 sre + prometheus lane active。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "prometheus").tween("avgCpu", 0, 40).tween("totalReq", 0, 2400).set("scaleAction", 0).badge("取得"))
  .phase("p2", {
    duration: 2400,
    title: "workload 分析",
    body: "5 workload 中 3 個 (B/C/E) が high usage、 workload C が bubble 最大 (perf 90 / cost 60 / usage 10 = 最上位)。 avgCpu 40 → 72 tween (gauge 針が赤域近くまで上昇 = 過負荷リスク)、 totalReq 2400 → 5800 tween (急増)、 cluster + sensor lane 追加 activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor").tween("avgCpu", 40, 72).tween("totalReq", 2400, 5800).badge("分析"))
  .phase("p3", {
    duration: 2200,
    title: "需給判定",
    body: "target 70% 超過検知、 HPA autoscaler 起動判定。 avgCpu 72 → 85 tween (更に上昇、 gauge 針赤域最深)、 totalReq 5800 → 7200 tween、 scaleAction 0 → 2 tween (stat が 2 pod 追加提案表示、 動的加算)、 autoscaler lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor", "autoscaler").tween("avgCpu", 72, 85).tween("totalReq", 5800, 7200).tween("scaleAction", 0, 2).badge("判定"))
  .phase("p4", {
    duration: 2000,
    title: "最適化 (scale out)",
    body: "HPA が cluster に replicas +2 適用、 workload B/C/E の負荷分散。 avgCpu 85 → 55 tween (gauge 針が緑域まで急降下 = 過負荷解消)、 totalReq 7200 → 7500 tween (捌ける)、 scaleAction 2 → 4 tween (更に 2 pod 追加で最終 4 pod)、 6 shape 全 active、 capacity 最適化完了。",
  }, (p: PhaseBuilder) => p.activate("sre", "laptop", "cluster", "prometheus", "sensor", "autoscaler").tween("avgCpu", 85, 55).tween("totalReq", 7200, 7500).tween("scaleAction", 2, 4).badge("最適化"))
  .build();

/**
 * 39. portfolioDonut v2 = 個人投資家の四半期リバランス シナリオ、 shape-person + shape-mobile-device + shape-brokerage + shape-trust-bank + shape-cylinder + shape-token の 6 shape で visual scene 化、 4 phase (現状確認 → リバランス判定 → 執行 → 反映) + 4 readout (donut allocation / gauge リスク偏差 / countup 総資産 / stat 執行額) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "四半期 portfolio リバランス シナリオ = 4 phase (現状 → 判定 → 執行 → 反映) の flow を shape-* primitive 6 種で表現 + 4 readout (donut / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("investor", { x: 0, width: 220 })
  .lane("advisor", { x: 240, width: 280 })
  .lane("markets", { x: 540, width: 240 })
  .arraySignal("assets", [45, 30, 15, 10])
  .state("riskGap", { initial: 8 })
  .state("totalValue", { initial: 8250000 })
  .state("orderAmount", { initial: 0 })
  .state("phase", { initial: 0 })
  .node("investor", { lane: "investor", stack: 0, kind: "shape-person", title: "投資家 佐藤様", eyebrow: "client", subtitle: "現金 15% + Alt 10%" })
  .node("mobile", { lane: "investor", stack: 1, kind: "shape-mobile-device", title: "証券 app", eyebrow: "device", subtitle: "portfolio 確認 · 執行 UI" })
  .node("advisor", { lane: "advisor", stack: 0, kind: "shape-brokerage", title: "証券会社", eyebrow: "advisor", subtitle: "リスク許容度診断 · 執行" })
  .node("trust", { lane: "advisor", stack: 1, kind: "shape-trust-bank", title: "信託銀行", eyebrow: "custodian", subtitle: "資産カストディ · 保管証明" })
  .node("holdings", { lane: "advisor", stack: 2, kind: "shape-cylinder", title: "保有 DB", eyebrow: "database", subtitle: "銘柄 × 数量 × 時価" })
  .node("token", { lane: "markets", stack: 0, kind: "shape-token", title: "市場価格", eyebrow: "quote", subtitle: "株式 · 債券 · 現金 · 暗号資産" })
  .edge("investor", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "advisor", { label: "診断 request", tone: "info" })
  .edge("advisor", "trust", { label: "執行指示", tone: "success" })
  .edge("trust", "holdings", { label: "残高更新", tone: "success" })
  .edge("holdings", "token", { label: "時価評価", tone: "accent" })
  .readout.donut("d", { source: "assets", innerRatio: 0.55, viewW: 180, viewH: 180, label: "配分 (donut)" })
  .readout.gauge("riskG", { source: "riskGap", min: 0, max: 20, color: "#ef4444", label: "リスク偏差 (%pt)" })
  .readout.countup("valueCU", { source: "totalValue", unit: " 円", label: "総資産評価額", decimals: 0 })
  .readout.stat("orderStat", { source: "orderAmount", unit: " 円", caption: "本日執行額", label: "執行" })
  .phase("p1", {
    duration: 2000,
    title: "現状確認",
    body: "佐藤様が四半期末に app で portfolio 確認、 Stocks 45% / Bonds 30% / Cash 15% / Crypto 10% を donut で visualize。 riskGap = 8%pt (許容 5% 超過、 gauge 針が橙域)、 totalValue 8,250,000 円 (countup 静止)、 orderAmount 0 (stat 未執行)。 investor lane 全 active。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile").set("riskGap", 8).set("orderAmount", 0).badge("現状"))
  .phase("p2", {
    duration: 2400,
    title: "リバランス判定",
    body: "証券会社が診断、 target 配分 (Stocks 40% / Bonds 35% / Cash 15% / Crypto 10%) との乖離を計算。 riskGap 8 → 12 tween (gauge 針が赤域まで上昇 = リバランス強推奨)、 totalValue 8,250,000 → 8,320,000 tween (再評価で微増)、 advisor + holdings lane 追加 activate。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "holdings").tween("riskGap", 8, 12).tween("totalValue", 8250000, 8320000).badge("判定"))
  .phase("p3", {
    duration: 2200,
    title: "執行",
    body: "Stocks を 5%pt 売却 (416,000 円) + Bonds を同額買付、 信託銀行がカストディで資産移動。 orderAmount 0 → 416000 tween (stat が動的増加)、 riskGap 12 → 4 tween (gauge 針が緑域まで急減)、 trust lane + token lane activate、 執行 edge が success tone で強調。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "trust", "holdings", "token").tween("orderAmount", 0, 416000).tween("riskGap", 12, 4).badge("執行"))
  .phase("p4", {
    duration: 2000,
    title: "反映",
    body: "T+2 決済完了、 保有 DB 更新 → 時価再評価。 riskGap 4 → 2 tween (gauge 針最下位、 target 内)、 totalValue 8,320,000 → 8,340,000 tween (countup が動的加算)、 orderAmount 保持、 6 shape 全 active、 四半期リバランス完了。",
  }, (p: PhaseBuilder) => p.activate("investor", "mobile", "advisor", "trust", "holdings", "token").tween("riskGap", 4, 2).tween("totalValue", 8320000, 8340000).badge("反映"))
  .build();

/**
 * 40. kpiDashboard v2 = 週次 CEO KPI dashboard レビュー シナリオ、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-cloud + shape-brokerage の 6 shape で visual scene 化、 4 phase (dashboard 表示 → 因果分析 → 目標対比 → 判断) + 4 readout (stat revenue / percentRing NPS / gauge Churn / countup users) が formula chain 経由 tween で visually 連続変化。 iteration 8 wave 8-B redesign。
 */
export const kpiDashboard = diagram("interactive-kpi-dashboard", {
  topic: "週次 CEO KPI レビュー シナリオ = 4 phase (表示 → 因果 → 目標対比 → 判断) の flow を shape-* primitive 6 種で表現 + 4 readout (stat / percentRing / gauge / countup) が tween で visually 連続変化",
})
  .lane("ceo", { x: 0, width: 220 })
  .lane("data", { x: 240, width: 320 })
  .lane("decision", { x: 580, width: 240 })
  .state("revenue", { initial: 120 })
  .state("users", { initial: 960 })
  .state("churn", { initial: 38 })
  .state("nps", { initial: 60 })
  .node("ceo", { lane: "ceo", stack: 0, kind: "shape-person", title: "CEO 高橋様", eyebrow: "executive", subtitle: "週次 KPI レビュー会議" })
  .node("mobile", { lane: "ceo", stack: 1, kind: "shape-mobile-device", title: "KPI dashboard", eyebrow: "ui", subtitle: "Looker mobile view" })
  .node("api", { lane: "data", stack: 0, kind: "shape-server-rack", title: "Analytics API", eyebrow: "server", subtitle: "revenue = ${revenue}k / mo" })
  .node("dwh", { lane: "data", stack: 1, kind: "shape-cylinder", title: "Snowflake DWH", eyebrow: "warehouse", subtitle: "fact_events × 20B rows" })
  .node("ml", { lane: "data", stack: 2, kind: "shape-cloud", title: "ML model", eyebrow: "prediction", subtitle: "revenue → users/churn/nps 因果推論" })
  .node("boardroom", { lane: "decision", stack: 0, kind: "shape-brokerage", title: "経営会議", eyebrow: "review", subtitle: "投資判断 · 予算配分" })
  .edge("ceo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "api", { label: "GET /kpi", tone: "info" })
  .edge("api", "dwh", { label: "SELECT", tone: "success" })
  .edge("dwh", "ml", { label: "特徴量", tone: "accent" })
  .edge("ml", "api", { label: "予測反映", tone: "accent" })
  .edge("api", "boardroom", { label: "insights", tone: "success" })
  .readout.stat("revStat", { source: "revenue", unit: "k$", caption: "月次 revenue", label: "Revenue" })
  .readout.percentRing("npsRing", { source: "nps", max: 100, color: "#22c55e", label: "NPS" })
  .readout.gauge("churnG", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "Churn % (低いほど良)" })
  .readout.countup("usersCU", { source: "users", unit: " 名", label: "Active users", decimals: 0 })
  .phase("p1", {
    duration: 2000,
    title: "dashboard 表示",
    body: "月曜朝、 高橋様が KPI dashboard 確認。 revenue $120k (stat 表示)、 NPS 60 (percentRing 針が緑域中位)、 churn 38% (gauge 針が赤域 = 悪化)、 users 960 名 (countup 静止)。 CEO + mobile lane active。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile").set("revenue", 120).set("nps", 60).set("churn", 38).set("users", 960).badge("表示"))
  .phase("p2", {
    duration: 2400,
    title: "因果分析 (ML)",
    body: "ML model が revenue 上昇 → users 増 + churn 減 + NPS 増の因果を予測。 revenue 120 → 180 tween (前週比 +50%)、 users 960 → 1440 tween (countup が加速的増加 = ×8 formula 相当)、 churn 38 → 32 tween (gauge 針が赤 → 橙域降下)、 nps 60 → 65 tween (percentRing 針上昇)、 data lane 全 activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml").tween("revenue", 120, 180).tween("users", 960, 1440).tween("churn", 38, 32).tween("nps", 60, 65).badge("因果"))
  .phase("p3", {
    duration: 2200,
    title: "目標対比",
    body: "四半期目標 (revenue $200k / churn <30% / NPS >70) と比較、 まだ gap あり。 revenue 180 → 200 tween (目標到達)、 churn 32 → 28 tween (gauge 針最終、 目標内)、 nps 65 → 72 tween (percentRing 針最高、 目標超過)、 users 1440 → 1600 tween。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml").tween("revenue", 180, 200).tween("churn", 32, 28).tween("nps", 65, 72).tween("users", 1440, 1600).badge("目標"))
  .phase("p4", {
    duration: 2000,
    title: "判断",
    body: "経営会議で来週の投資判断、 marketing 予算 +20% で全 KPI 押し上げ判断。 revenue 200 → 210 tween (見込み)、 users 1600 → 1680 tween、 churn 28 → 25 tween、 nps 72 → 75 tween、 6 shape 全 active、 boardroom 承認。",
  }, (p: PhaseBuilder) => p.activate("ceo", "mobile", "api", "dwh", "ml", "boardroom").tween("revenue", 200, 210).tween("users", 1600, 1680).tween("churn", 28, 25).tween("nps", 72, 75).badge("判断"))
  .build();

/**
 * 41. abTestResult v2 = EC checkout button 色変更 A/B test の 4 週実験シナリオ、 shape-online-shop + shape-diamond (split) + shape-cloud (analytics) + shape-cylinder (log) + shape-mobile-device × 2 + shape-brokerage (判定) の 7 shape で visual scene 化、 4 phase (実験開始 → traffic split → 中間集計 → 有意判定) + 4 readout (stackedBar convA/B / donut split / donut winner / gauge 有意水準) が tween で visually 連続変化。 iteration 8 wave 8-B2 redesign。
 */
export const abTestResult = diagram("interactive-ab-test", {
  topic: "EC checkout A/B test 4 週実験 = 4 phase (開始 → split → 集計 → 有意判定) の flow を shape-* primitive 7 種で表現 + 4 readout (stackedBar / donut × 2 / gauge) が tween で visually 連続変化",
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
  .node("visitorA", { lane: "users", stack: 0, kind: "shape-mobile-device", title: "訪問者 (Variant A)", eyebrow: "control", subtitle: "青ボタン · 現行版" })
  .node("visitorB", { lane: "users", stack: 1, kind: "shape-mobile-device", title: "訪問者 (Variant B)", eyebrow: "treatment", subtitle: "橙ボタン · 実験版" })
  .node("shop", { lane: "system", stack: 0, kind: "shape-online-shop", title: "EC checkout", eyebrow: "product", subtitle: "button color 実験" })
  .node("router", { lane: "system", stack: 1, kind: "shape-diamond", title: "traffic split", eyebrow: "router", subtitle: "user hash % 2 == 0 → A" })
  .node("analytics", { lane: "system", stack: 2, kind: "shape-cloud", title: "Amplitude", eyebrow: "analytics", subtitle: "conv event 収集" })
  .node("log", { lane: "system", stack: 3, kind: "shape-cylinder", title: "実験 log DB", eyebrow: "storage", subtitle: "27,000 events" })
  .node("committee", { lane: "decision", stack: 0, kind: "shape-brokerage", title: "実験判定会議", eyebrow: "review", subtitle: "有意水準 p<0.05" })
  .edge("visitorA", "shop", { label: "control 訪問", tone: "info" })
  .edge("visitorB", "shop", { label: "treatment 訪問", tone: "accent" })
  .edge("shop", "router", { label: "user hash 判定", tone: "info" })
  .edge("router", "analytics", { label: "purchase event", tone: "success" })
  .edge("analytics", "log", { label: "永続化", tone: "success" })
  .edge("log", "committee", { label: "集計結果", tone: "accent" })
  .readout.stackedBar("conv", { sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#94a3b8", colorB: "#22c55e", label: "日次 conv % (A=灰 / B=緑)" })
  .readout.donut("splitDonut", { source: "splitData", innerRatio: 0.5, viewW: 130, viewH: 130, label: "トラフィック split" })
  .readout.donut("winner", { source: "results", innerRatio: 0.6, viewW: 130, viewH: 130, colors: ["#22c55e", "#94a3b8"] as const, label: "winner share (B=緑)" })
  .readout.gauge("pG", { source: "pValue", min: 0, max: 100, color: "#ef4444", label: "p-value ×100 (低いほど有意)" })
  .phase("p1", {
    duration: 2000,
    title: "実験開始",
    body: "checkout button 色を A (青) / B (橙) で 4 週実験開始。 pValue = 100 (gauge 針最上位、 未判定)、 visitorCount 0 → 5000 tween (countup 加速)、 splitDonut 50/50、 users lane + shop + router active。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router").set("pValue", 100).tween("visitorCount", 0, 5000).badge("開始"))
  .phase("p2", {
    duration: 2400,
    title: "traffic 分割",
    body: "user hash mod 2 で公平分割、 A: 2493 人 / B: 2507 人。 pValue 100 → 60 tween (gauge 針中位、 収束開始)、 visitorCount 5000 → 15000 tween (加速)、 analytics lane activate、 event 収集加速。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics").tween("pValue", 100, 60).tween("visitorCount", 5000, 15000).badge("split"))
  .phase("p3", {
    duration: 2200,
    title: "中間集計",
    body: "Variant A avg conv 43.8% / Variant B avg conv 57.0% (+30% relative)。 pValue 60 → 15 tween (gauge 針急降下 = 有意近く)、 visitorCount 15000 → 24000 tween、 winner donut は暫定 B 優位 (58/42)、 log lane activate。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics", "log").tween("pValue", 60, 15).tween("visitorCount", 15000, 24000).badge("集計"))
  .phase("p4", {
    duration: 2000,
    title: "有意判定",
    body: "p<0.05 到達で有意差確定、 実験判定会議で Variant B 採用決定。 pValue 15 → 3 tween (gauge 針最下、 高有意)、 visitorCount 24000 → 27000 tween (最終)、 全 7 shape active、 committee lane で最終判断。",
  }, (p: PhaseBuilder) => p.activate("visitorA", "visitorB", "shop", "router", "analytics", "log", "committee").tween("pValue", 15, 3).tween("visitorCount", 24000, 27000).badge("有意"))
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
  .node("totalCard", { lane: "q4", stack: 1, kind: "card", title: "Year total", subtitle: "sum {commits.sum} · max {commits.max} · avg {commits.avg}" })
  .readout.calendarHeatmap("h", { source: "commits", max: 10, cellSize: 10, cellGap: 2, label: "1 year (53 週 × 7 日)" })
  .phase("p", {
    duration: 1200,
    title: "quarter split",
    body: "4-lane (Q1/Q2/Q3/Q4) で 365 day を quarter 別に分散、 各 quarter summary card + year total (Q4 lane 内)、 calendarHeatmap readout も併存で 53 週 × 7 日 gradient 表示、 quarter 単位 aggregate と日単位詳細の 2 経路 view。",
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
  .node("mapNode", { lane: "map", stack: 0, kind: "card", title: "Mini-map viewport", subtitle: "pan ({panX}, {panY}) view 400×300" })
  .readout.miniMap("map", { source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "Overview (mini-map)" })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "X stat" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "Y stat" })
  .phase("p", {
    duration: 1200,
    title: "axis split + viewport",
    body: "3-lane (X pan / Y pan / Mini-map viewport) で canvas 制御を axis 別分散、 X/Y 独立 slider control + viewport 集約 card、 miniMap readout も併存で 1000×800 canvas 縮小表示、 slider 変化で mini-map viewport rect が実座標追随、 axis 分離と全体 view の 2 経路。",
  }, (p: PhaseBuilder) => p.activate("xNode", "yNode", "mapNode").badge("mini-map"))
  .build();

/**
 * 44. revenueKpiCard v2 = SaaS 事業の月次 revenue クロージング 会議シナリオ、 shape-person + shape-mobile-device + shape-online-shop + shape-cylinder + shape-cloud + shape-brokerage の 6 shape で visual scene 化、 4 phase (前月値確認 → 当月確定 → 前年比較 → 経営判断) + 4 readout (kpiCard revenue trend / gauge YoY 成長率 / countup MRR / stat 目標達成率) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "SaaS 月次 revenue クロージング シナリオ = 4 phase (前月 → 当月確定 → 前年比較 → 判断) の flow を shape-* primitive 6 種で表現 + 4 readout (kpiCard / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("team", { x: 0, width: 220 })
  .lane("systems", { x: 240, width: 300 })
  .lane("insights", { x: 560, width: 260 })
  .state("current", { initial: 150 })
  .state("prev", { initial: 150 })
  .state("yoy", { initial: 0 })
  .state("achievement", { initial: 0 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("cfo", { lane: "team", stack: 0, kind: "shape-person", title: "CFO 佐々木様", eyebrow: "executive", subtitle: "月次締め責任者" })
  .node("dashboard", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "経営 dashboard", eyebrow: "ui", subtitle: "revenue KPI 表示" })
  .node("saas", { lane: "systems", stack: 0, kind: "shape-online-shop", title: "SaaS 本体", eyebrow: "product", subtitle: "MRR 集計 · サブスク管理" })
  .node("dwh", { lane: "systems", stack: 1, kind: "shape-cylinder", title: "DWH (Snowflake)", eyebrow: "warehouse", subtitle: "revenue fact テーブル · 月次 rollup" })
  .node("bi", { lane: "systems", stack: 2, kind: "shape-cloud", title: "BI (Looker)", eyebrow: "analytics", subtitle: "YoY 比較 · 目標追跡" })
  .node("board", { lane: "insights", stack: 0, kind: "shape-brokerage", title: "経営会議", eyebrow: "decision", subtitle: "$Current {current}k · 前年 {prev}k · YoY {yoy}%" })
  .edge("cfo", "dashboard", { label: "確認", tone: "info" })
  .edge("dashboard", "saas", { label: "MRR query", tone: "info" })
  .edge("saas", "dwh", { label: "月次 rollup", tone: "success" })
  .edge("dwh", "bi", { label: "YoY 集計", tone: "accent" })
  .edge("bi", "board", { label: "insights", tone: "success" })
  .readout.kpiCard("kpi", { source: "current", historySource: "history", comparisonSource: "prev", unit: "k$", colorPos: "#22c55e", colorNeg: "#ef4444", label: "月次 Revenue KPI" })
  .readout.gauge("yoyG", { source: "yoy", min: -20, max: 60, color: "#22c55e", label: "YoY 成長率 (%)" })
  .readout.countup("mrrCU", { source: "current", unit: "k$", label: "MRR", decimals: 0 })
  .readout.stat("achieveStat", { source: "achievement", unit: "%", caption: "目標 200k$ 対", label: "達成率" })
  .phase("p1", {
    duration: 2000,
    title: "前月値確認",
    body: "CFO 佐々木様が dashboard で前月値 150k を確認。 current = 150 (kpiCard 針動かず)、 yoy = 0 (gauge 針中位)、 achievement 0 (stat 空)、 sparkline 履歴 6 ヶ月表示。 team lane 全 active。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard").set("current", 150).set("prev", 150).set("yoy", 0).set("achievement", 0).badge("前月"))
  .phase("p2", {
    duration: 2400,
    title: "当月確定",
    body: "SaaS から DWH に月次 rollup、 current 150 → 195 tween (MRR countup が 45k$ 加算表示)、 kpiCard の spark が上向き変化、 achievement 0 → 97 tween (stat が動的加算、 200k$ 目標に対し 97.5%)、 saas + dwh lane activate。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh").tween("current", 150, 195).tween("achievement", 0, 97).badge("確定"))
  .phase("p3", {
    duration: 2200,
    title: "前年比較 (BI)",
    body: "Looker で前年同月 130k と比較、 yoy 0 → 50 tween (gauge 針が緑域まで急上昇 = +50% 成長)、 prev を 150 → 130 tween (前年値表示に更新)、 kpiCard 比較値変更で delta arrow 表示、 bi lane activate。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh", "bi").tween("yoy", 0, 50).tween("prev", 150, 130).badge("前年比"))
  .phase("p4", {
    duration: 2000,
    title: "経営判断",
    body: "経営会議で拡大投資判断、 achievement 97 → 100 tween (最終達成率、 stat 満点表示)、 current 195 → 200 tween (見込み調整で kpiCard 針最終)、 yoy 50 → 54 tween (最終値)、 全 6 shape active。",
  }, (p: PhaseBuilder) => p.activate("cfo", "dashboard", "saas", "dwh", "bi", "board").tween("achievement", 97, 100).tween("current", 195, 200).tween("yoy", 50, 54).badge("判断"))
  .build();

/**
 * 45. priceCandlestick v2 = 個人投資家の日次 trading シナリオ、 shape-trader + shape-mobile-device + shape-brokerage + shape-exchange + shape-blockchain-node の 5 shape で visual scene 化、 4 phase (寄り付き → 中盤上昇 → 押し目 → 引け高) + 4 readout (candlestick / gauge 値動き幅 / countup 出来高 / stat 現在価格) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const priceCandlestick = diagram("interactive-price-candlestick", {
  topic: "個人投資家 日次 trading シナリオ = 4 phase (寄り付き → 中盤 → 押し目 → 引け高) の flow を shape-* primitive 5 種で表現 + 4 readout (candlestick OHLC / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("trader", { lane: "trader", stack: 0, kind: "shape-trader", title: "トレーダー 松本様", eyebrow: "trader", subtitle: "個人 day trader" })
  .node("mobile", { lane: "trader", stack: 1, kind: "shape-mobile-device", title: "SBI アプリ", eyebrow: "app", subtitle: "chart + 発注 UI" })
  .node("brokerage", { lane: "markets", stack: 0, kind: "shape-brokerage", title: "SBI 証券", eyebrow: "broker", subtitle: "板寄せ + 執行" })
  .node("exchange", { lane: "markets", stack: 1, kind: "shape-exchange", title: "東証", eyebrow: "exchange", subtitle: "現物 · continuous" })
  .node("feed", { lane: "feed", stack: 0, kind: "shape-blockchain-node", title: "quote feed", eyebrow: "data", subtitle: "1s tick · WebSocket · 現在 ¥{price}" })
  .edge("trader", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "brokerage", { label: "発注", tone: "info" })
  .edge("brokerage", "exchange", { label: "取次", tone: "success" })
  .edge("exchange", "feed", { label: "約定 tick", tone: "success" })
  .edge("feed", "mobile", { label: "quote", tone: "accent" })
  .readout.candlestick("chart", { source: "ohlc", min: 95, max: 122, viewW: 320, viewH: 130, colorUp: "#22c55e", colorDown: "#ef4444", label: "8 日 OHLC" })
  .readout.gauge("rangeG", { source: "range", min: 0, max: 30, color: "#f97316", label: "値幅 (%)" })
  .readout.countup("volCU", { source: "volume", unit: " 万株", label: "出来高", decimals: 0 })
  .readout.stat("priceStat", { source: "price", unit: " 円", caption: "現在値", label: "株価" })
  .phase("p1", {
    duration: 2000,
    title: "寄り付き",
    body: "朝 9:00 寄り付き、 前日終値 118 → 寄値 100 (窓開け下落)。 price = 100 (stat 表示)、 range = 0 (gauge 針最下)、 volume 0 → 50 tween (寄り成 50 万株)、 trader + mobile lane active。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile").set("price", 100).set("range", 0).tween("volume", 0, 50).badge("寄付"))
  .phase("p2", {
    duration: 2400,
    title: "中盤 上昇",
    body: "午前中に売り玉こなし + 買い勢い、 price 100 → 111 tween (stat が動的更新)、 range 0 → 15 tween (gauge 針が上昇 = 変動 15%)、 volume 50 → 200 tween (countup が加速)、 brokerage lane activate。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage").tween("price", 100, 111).tween("range", 0, 15).tween("volume", 50, 200).badge("上昇"))
  .phase("p3", {
    duration: 2200,
    title: "押し目",
    body: "午後 short cover 一巡で押し目形成、 price 111 → 109 tween (少し下落、 candlestick で ▼ 表示)、 range 15 → 18 tween (幅拡大)、 volume 200 → 350 tween、 exchange + feed lane activate、 feed tick 反映。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage", "exchange", "feed").tween("price", 111, 109).tween("range", 15, 18).tween("volume", 200, 350).badge("押し目"))
  .phase("p4", {
    duration: 2000,
    title: "引け高",
    body: "大引け 15:00 で引成買い集中、 price 109 → 118 tween (前日並みまで回復、 stat 最終)、 range 18 → 22 tween (最終幅、 gauge 針最高)、 volume 350 → 480 tween、 5 shape 全 active、 前日終値回復。",
  }, (p: PhaseBuilder) => p.activate("trader", "mobile", "brokerage", "exchange", "feed").tween("price", 109, 118).tween("range", 18, 22).tween("volume", 350, 480).badge("引け"))
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
  .node("totalNode", { lane: "both", stack: 1, kind: "card", title: "Total universe", subtitle: "Users A=100 · Payers B=40" })
  .readout.venn("v", { source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "Users", labelB: "Payers", label: "Overlap (2-set Venn)" })
  .phase("p", {
    duration: 1200,
    title: "region split",
    body: "3-lane (Users only 75 / Both 25 / Payers only 15) で 2 set Venn の 3 領域を分散、 各 region 個別 card で内訳明示、 中央 lane に total universe summary、 venn readout も併存で 円 gap 表示、 領域分類と 図の 2 経路 view。",
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
  .node("carolNode", { lane: "up", stack: 1, kind: "card", title: "Carol ↑", subtitle: "55 → 78 (+23, max gain)" })
  .node("danNode", { lane: "up", stack: 2, kind: "card", title: "Dan ↑", subtitle: "80 → 88 (+8)" })
  .node("bobNode", { lane: "down", stack: 0, kind: "card", title: "Bob ↓", subtitle: "70 → 68 (-2)" })
  .node("eveNode", { lane: "down", stack: 1, kind: "card", title: "Eve ↓", subtitle: "60 → 55 (-5)" })
  .readout.slope("s", { source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "Score change (slope)" })
  .phase("p", {
    duration: 1200,
    title: "score direction split",
    body: "2-lane (Improved ↑ 3 個 / Declined ↓ 2 個) で 5 student score を変化方向別分散、 各 student 個別 card で before → after + delta 明示、 slope readout も併存で 2 column 折れ線表示、 direction 分類と slope chart の 2 経路 view。",
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
  .node("visitNode", { lane: "visit", stack: 0, kind: "card", title: "Visit", subtitle: "1000 (top)" })
  .node("signupNode", { lane: "signup", stack: 0, kind: "card", title: "Signup", subtitle: "400 (-60%)" })
  .node("trialNode", { lane: "trial", stack: 0, kind: "card", title: "Trial", subtitle: "150 (-62.5%)" })
  .node("paidNode", { lane: "paid", stack: 0, kind: "card", title: "Paid", subtitle: "40 (-73%, bottom)" })
  .edge("visitNode", "signupNode", { label: "40% conv", tone: "info" })
  .edge("signupNode", "trialNode", { label: "37.5% conv", tone: "warning" })
  .edge("trialNode", "paidNode", { label: "26.7% conv", tone: "error" })
  .readout.funnel("f", { source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#94a3b8", label: "Conversion (trapezoid)" })
  .phase("p", {
    duration: 1200,
    title: "funnel pipeline",
    body: "4-lane pipeline (Visit / Signup / Trial / Paid) + 3 conversion edge (40% info / 37.5% warning / 26.7% error で drop-off 深化 tone escalate)、 各 stage の count と conversion rate を明示、 funnel readout も併存で trapezoid 表示、 conversion 遷移を dataflow で可視化。",
  }, (p: PhaseBuilder) => p.activate("visitNode", "signupNode", "trialNode", "paidNode").badge("funnel"))
  .build();

/**
 * 49. projectGantt v2 = モバイルアプリ新機能開発 10 日 sprint シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (Design → Impl → Test → Ship) + 4 readout (gantt / gauge 進捗率 / countup 経過日数 / stat 完了タスク) が tween で visually 連続変化。 iteration 8 wave 8-C redesign。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "モバイル新機能 10 日 sprint シナリオ = 4 phase (Design → Impl → Test → Ship) の flow を shape-* primitive 6 種で表現 + 4 readout (gantt / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("designer", { lane: "team", stack: 0, kind: "shape-person", title: "デザイナー 松原様", eyebrow: "role", subtitle: "Figma で UI 設計" })
  .node("dev", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "iOS 開発端末", eyebrow: "device", subtitle: "Xcode + SwiftUI" })
  .node("repo", { lane: "work", stack: 0, kind: "shape-website", title: "GitHub repo", eyebrow: "vcs", subtitle: "feature/new-checkout branch" })
  .node("ci", { lane: "work", stack: 1, kind: "shape-server-rack", title: "CI (GitHub Actions)", eyebrow: "build", subtitle: "PR ごとに build + test" })
  .node("qa", { lane: "work", stack: 2, kind: "shape-hexagon", title: "QA test", eyebrow: "verify", subtitle: "Playwright e2e + 手動 QA" })
  .node("appstore", { lane: "release", stack: 0, kind: "shape-cloud", title: "App Store Connect", eyebrow: "distribution", subtitle: "TestFlight → production 配信" })
  .edge("designer", "dev", { label: "handover", tone: "info" })
  .edge("dev", "repo", { label: "commit", tone: "success" })
  .edge("repo", "ci", { label: "build", tone: "accent" })
  .edge("ci", "qa", { label: "test 配布", tone: "accent" })
  .edge("qa", "appstore", { label: "release", tone: "success" })
  .readout.gantt("g", { source: "tasks", min: 0, max: 10, viewW: 340, viewH: 140, color: "#2563eb", label: "10 日 timeline (gantt)" })
  .readout.gauge("progressG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "sprint 進捗率" })
  .readout.countup("dayCU", { source: "elapsedDay", unit: " 日", label: "経過日数", decimals: 0 })
  .readout.stat("doneStat", { source: "completedTasks", unit: "/4", caption: "完了タスク", label: "done" })
  .phase("p1", {
    duration: 2000,
    title: "Design (day 0-3)",
    body: "デザイナー松原様が Figma で UI 設計、 checkout flow の wireframe 完成。 progress 0 → 30 tween (gauge 針上昇)、 elapsedDay 0 → 3 tween (countup)、 completedTasks 0 → 1 tween (Design 完了)、 team lane active。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev").tween("progress", 0, 30).tween("elapsedDay", 0, 3).tween("completedTasks", 0, 1).badge("Design"))
  .phase("p2", {
    duration: 2400,
    title: "Impl (day 3-8)",
    body: "SwiftUI で実装 5 日、 daily commit。 progress 30 → 60 tween、 elapsedDay 3 → 8 tween、 completedTasks 1 → 2 tween、 repo + ci lane 追加 activate、 PR ごとに build 実行。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci").tween("progress", 30, 60).tween("elapsedDay", 3, 8).tween("completedTasks", 1, 2).badge("Impl"))
  .phase("p3", {
    duration: 2200,
    title: "Test (day 6-9、 Impl と overlap)",
    body: "QA が Playwright e2e + 手動 test。 progress 60 → 85 tween、 elapsedDay 8 → 9 tween、 completedTasks 2 → 3 tween、 qa lane activate、 bug 修正 loop で ci と往復。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci", "qa").tween("progress", 60, 85).tween("elapsedDay", 8, 9).tween("completedTasks", 2, 3).badge("Test"))
  .phase("p4", {
    duration: 2000,
    title: "Ship (day 9-10)",
    body: "TestFlight → production 配信、 App Store 審査 pass。 progress 85 → 100 tween (gauge 針最終)、 elapsedDay 9 → 10 tween (countup 10 日目)、 completedTasks 3 → 4 tween (全 4 task 完了)、 appstore lane activate、 6 shape 全 active、 リリース完遂。",
  }, (p: PhaseBuilder) => p.activate("designer", "dev", "repo", "ci", "qa", "appstore").tween("progress", 85, 100).tween("elapsedDay", 9, 10).tween("completedTasks", 3, 4).badge("Ship"))
  .build();

/**
 * 50. resourceTreemap v2 = 会社 CFO の年間予算配分レビュー シナリオ (期初計画 → Q1 実績 → 中期見直し → 期末着地)、 shape-person + shape-mobile-device + shape-brokerage + shape-cylinder + shape-server-rack + shape-cloud の 6 shape で visual scene 化、 4 phase (期初計画 → Q1 実績 → 中期見直し → 期末着地) + 4 readout (treemap / gauge 予算消化率 / countup 支出額 / stat 残予算) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const resourceTreemap = diagram("interactive-resource-treemap", {
  topic: "会社 CFO 年間予算配分レビュー 4 phase = (期初 → Q1 → 中期 → 期末) の flow を shape-* primitive 6 種で表現 + 4 readout (treemap / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("cfo", { lane: "cfo", stack: 0, kind: "shape-person", title: "CFO 森本様", eyebrow: "executive", subtitle: "年間 500M 予算責任" })
  .node("mobile", { lane: "cfo", stack: 1, kind: "shape-mobile-device", title: "予算 dashboard", eyebrow: "device", subtitle: "team 別配分 view + drilldown" })
  .node("finance", { lane: "data", stack: 0, kind: "shape-brokerage", title: "経理部門", eyebrow: "accounting", subtitle: "月次 rollup + 実績集計" })
  .node("ledger", { lane: "data", stack: 1, kind: "shape-cylinder", title: "General Ledger", eyebrow: "database", subtitle: "team × 費目 × 月次 fact table" })
  .node("erp", { lane: "data", stack: 2, kind: "shape-server-rack", title: "ERP system", eyebrow: "system", subtitle: "SAP · 会計仕訳集約" })
  .node("committee", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "経営委員会", eyebrow: "decision", subtitle: "配分再調整 · 承認判断" })
  .edge("cfo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "finance", { label: "実績 query", tone: "info" })
  .edge("finance", "ledger", { label: "集計", tone: "success" })
  .edge("ledger", "erp", { label: "同期", tone: "accent" })
  .edge("erp", "committee", { label: "予算再検討", tone: "warning" })
  .readout.treemap("t", { source: "teams", viewW: 300, viewH: 200, label: "team 別予算 (treemap)" })
  .readout.gauge("consG", { source: "consumptionPct", min: 0, max: 100, color: "#f97316", label: "予算消化率 %" })
  .readout.countup("spentCU", { source: "spentMm", unit: " M円", label: "支出累計", decimals: 0 })
  .readout.stat("remStat", { source: "remainingMm", unit: " M円", caption: "残予算", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "期初計画 (4/1)",
    body: "森本様が Q1 期初に 6 team 予算配分決定 (Eng 45% / Sales 20% / Mkt 15% / etc)。 consumptionPct 0、 spentMm 0、 remainingMm 500 保持、 cfo + mobile lane active。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile").set("consumptionPct", 0).set("spentMm", 0).set("remainingMm", 500).badge("期初"))
  .phase("p2", {
    duration: 2200,
    title: "Q1 実績 (7/1)",
    body: "3 ヶ月経過、 経理部門から実績集計。 consumptionPct 0 → 28 tween、 spentMm 0 → 140 tween (countup 加算)、 remainingMm 500 → 360 tween (stat 減少)、 finance + ledger lane activate、 順調 pace。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger").tween("consumptionPct", 0, 28).tween("spentMm", 0, 140).tween("remainingMm", 500, 360).badge("Q1"))
  .phase("p3", {
    duration: 2400,
    title: "中期見直し (10/1)",
    body: "半期経過、 Eng 部門超過傾向 + Legal 余剰、 予算再配分検討。 consumptionPct 28 → 62 tween、 spentMm 140 → 310 tween、 remainingMm 360 → 190 tween、 erp lane activate、 SAP に配分修正反映。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger", "erp").tween("consumptionPct", 28, 62).tween("spentMm", 140, 310).tween("remainingMm", 360, 190).badge("中期"))
  .phase("p4", {
    duration: 2000,
    title: "期末着地 (3/31)",
    body: "1 年経過、 経営委員会に最終報告。 consumptionPct 62 → 98 tween (gauge 針最上位、 予定通り 98%)、 spentMm 310 → 490 tween (最終)、 remainingMm 190 → 10 tween (ほぼゼロ)、 committee lane activate、 6 shape 全 active、 期末着地。",
  }, (p: PhaseBuilder) => p.activate("cfo", "mobile", "finance", "ledger", "erp", "committee").tween("consumptionPct", 62, 98).tween("spentMm", 310, 490).tween("remainingMm", 190, 10).badge("期末"))
  .build();

/**
 * 51. trafficSankey v2 = D2C EC の marketing 4 phase 施策 sankey (集客 → LP → conversion)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (施策開始 → 集客増 → CVR 上昇 → ROI 判定) + 4 readout (sankey / gauge CVR / countup 総訪問数 / stat 平均 CAC) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const trafficSankey = diagram("interactive-traffic-sankey", {
  topic: "D2C EC marketing 4 phase 施策 sankey = (開始 → 集客 → CVR → ROI) の flow を shape-* primitive 6 種で表現 + 4 readout (sankey / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("cmo", { lane: "marketer", stack: 0, kind: "shape-person", title: "CMO 池田様", eyebrow: "marketer", subtitle: "月次 marketing 責任者" })
  .node("mobile", { lane: "marketer", stack: 1, kind: "shape-mobile-device", title: "GA4 dashboard", eyebrow: "device", subtitle: "traffic 分析 + CV 追跡" })
  .node("landing", { lane: "traffic", stack: 0, kind: "shape-website", title: "landing page", eyebrow: "web", subtitle: "product ページ + Home" })
  .node("cdn", { lane: "traffic", stack: 1, kind: "shape-cdn-edge", title: "Cloudflare CDN", eyebrow: "cdn", subtitle: "全世界 edge 配信 + WAF" })
  .node("attribution", { lane: "traffic", stack: 2, kind: "shape-cloud", title: "GA4 attribution", eyebrow: "analytics", subtitle: "source → CV 帰属分析" })
  .node("cvDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "CV database", eyebrow: "storage", subtitle: "checkout 完了 event 蓄積" })
  .edge("cmo", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "attribution", { label: "分析", tone: "info" })
  .edge("landing", "cdn", { label: "配信", tone: "success" })
  .edge("cdn", "attribution", { label: "log 送信", tone: "success" })
  .edge("attribution", "cvDb", { label: "CV 記録", tone: "warning" })
  .readout.sankey("s", { source: "flows", viewW: 340, viewH: 220, label: "traffic 由来 (sankey)" })
  .readout.gauge("cvrG", { source: "cvr", min: 0, max: 10, color: "#22c55e", label: "CVR %" })
  .readout.countup("visCU", { source: "visitors", unit: " 訪問", label: "総訪問数", decimals: 0 })
  .readout.stat("cacStat", { source: "cac", unit: " 円", caption: "平均 CAC", label: "CAC" })
  .phase("p1", {
    duration: 1800,
    title: "施策開始 (月初)",
    body: "池田様が新規 marketing 施策開始 (Google Ads + LP 改善)。 cvr 0 → 0.8 tween、 visitors 0 → 5000 tween (countup 加速)、 cac 0 → 3200 tween、 marketer lane active。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile").tween("cvr", 0, 0.8).tween("visitors", 0, 5000).tween("cac", 0, 3200).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "集客増 (第 2 週)",
    body: "landing page 最適化で bounce rate 低下、 訪問数急増。 cvr 0.8 → 2.1 tween、 visitors 5000 → 22000 tween (countup dramatic)、 cac 3200 → 2400 tween (効率化)、 landing + cdn lane activate。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn").tween("cvr", 0.8, 2.1).tween("visitors", 5000, 22000).tween("cac", 3200, 2400).badge("集客"))
  .phase("p3", {
    duration: 2400,
    title: "CVR 上昇 (第 3 週)",
    body: "GA4 attribution で CVR 高い流入源特定、 予算再配分。 cvr 2.1 → 4.5 tween (gauge 針最上位)、 visitors 22000 → 42000 tween、 cac 2400 → 1800 tween、 attribution lane activate。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn", "attribution").tween("cvr", 2.1, 4.5).tween("visitors", 22000, 42000).tween("cac", 2400, 1800).badge("CVR"))
  .phase("p4", {
    duration: 2000,
    title: "ROI 判定 (月末)",
    body: "月末に CV database 集計、 ROI 320% 達成。 cvr 4.5 → 5.2 tween (最終)、 visitors 42000 → 58000 tween (最終)、 cac 1800 → 1450 tween (最終、 stat 更新)、 cvDb lane activate、 6 shape 全 active。",
  }, (p: PhaseBuilder) => p.activate("cmo", "mobile", "landing", "cdn", "attribution", "cvDb").tween("cvr", 4.5, 5.2).tween("visitors", 42000, 58000).tween("cac", 1800, 1450).badge("ROI"))
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
  .node("wedNode", { lane: "weekday", stack: 2, kind: "card", title: "Wed", subtitle: "8h (max)" })
  .node("thuNode", { lane: "weekday", stack: 3, kind: "card", title: "Thu", subtitle: "6h" })
  .node("friNode", { lane: "weekday", stack: 4, kind: "card", title: "Fri", subtitle: "7h" })
  .node("satNode", { lane: "weekend", stack: 0, kind: "card", title: "Sat", subtitle: "4h" })
  .node("sunNode", { lane: "weekend", stack: 1, kind: "card", title: "Sun", subtitle: "2h (min)" })
  .readout.polarArea("p", { source: "hours", max: 10, labelSource: "days", viewW: 220, viewH: 220, label: "Hours (polar sectors)" })
  .phase("p", {
    duration: 1200,
    title: "weekly split",
    body: "2-lane (Weekday 5 個 / Weekend 2 個) で 7 day を分散、 各 day 個別 card で hours 明示、 polarArea readout も併存で極座標 sector 表示、 平日/週末の作業量差を lane 分割で可視化。",
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
  .input.stepper("current", { min: 0, max: 4, defaultValue: 2, label: "Current step" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["Sign up", "Profile", "Preferences", "Verify", "Done"])
  .node("signupNode", { lane: "signup", stack: 0, kind: "card", title: "Sign up", subtitle: "step 0" })
  .node("profileNode", { lane: "profile", stack: 0, kind: "card", title: "Profile", subtitle: "step 1" })
  .node("prefsNode", { lane: "prefs", stack: 0, kind: "card", title: "Preferences", subtitle: "step 2 (current)" })
  .node("verifyNode", { lane: "verify", stack: 0, kind: "card", title: "Verify", subtitle: "step 3" })
  .node("doneNode", { lane: "done", stack: 0, kind: "card", title: "Done", subtitle: "step 4" })
  .edge("signupNode", "profileNode", { label: "next", tone: "info" })
  .edge("profileNode", "prefsNode", { label: "next", tone: "info" })
  .edge("prefsNode", "verifyNode", { label: "next", tone: "accent" })
  .edge("verifyNode", "doneNode", { label: "finish", tone: "success" })
  .readout.stepIndicator("wizard", { source: "current", stepsSource: "steps", viewW: 360, viewH: 60, colorActive: "#2563eb", colorPending: "#cbd5e1", label: "Progress (dot strip)" })
  .phase("p", {
    duration: 1200,
    title: "wizard pipeline",
    body: "5-lane pipeline (Sign up → Profile → Preferences → Verify → Done) + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。",
  }, (p: PhaseBuilder) => p.activate("signupNode", "profileNode", "prefsNode", "verifyNode", "doneNode").badge("wizard"))
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
  .node("avgRange", { lane: "avg", stack: 0, kind: "card", title: "Avg range", subtitle: "40-70 (yellow) · actual {actual} here" })
  .node("goodRange", { lane: "good", stack: 0, kind: "card", title: "Good range", subtitle: "70-100 (green) · target {target}" })
  .node("actualNode", { lane: "avg", stack: 1, kind: "card", title: "◆ Actual", subtitle: "{actual}" })
  .node("targetNode", { lane: "good", stack: 1, kind: "card", title: "▼ Target", subtitle: "{target}" })
  .edge("actualNode", "targetNode", { label: "gap = target - actual", tone: "warning" })
  .readout.bulletChart("b", { source: "actual", targetSource: "target", max: 100, rangeBad: 40, rangeAvg: 70, viewW: 320, viewH: 40, colorActual: "#0f172a", label: "Progress (bullet chart)" })
  .readout.stat("targetStat", { source: "target", label: "Target" })
  .phase("p", {
    duration: 1200,
    title: "KPI range map",
    body: "3-lane (bad 0-40 / avg 40-70 / good 70-100) range 分散、 actual (avg lane) + target (good lane) を個別 card で位置明示、 gap edge (warning tone) で actual→target の差を可視化、 bulletChart readout も併存で従来 chart 表示。",
  }, (p: PhaseBuilder) => p.activate("badRange", "avgRange", "goodRange", "actualNode", "targetNode").badge("KPI"))
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
  .input.slider("rev", { min: 0, max: 999, defaultValue: 234, label: "Revenue" })
  .state("rev", { initial: 234 })
  .node("currentNode", { lane: "current", stack: 0, kind: "card", title: "◆ Current", subtitle: "${rev}M (slider driven)" })
  .node("targetNode", { lane: "target", stack: 0, kind: "card", title: "Target", subtitle: "$500M (Q3 goal)" })
  .node("gapNode", { lane: "gap", stack: 0, kind: "card", title: "Gap", subtitle: "target - current (progress toward goal)" })
  .edge("currentNode", "targetNode", { label: "progress", tone: "info" })
  .edge("targetNode", "gapNode", { label: "delta", tone: "warning" })
  .readout.numberBoard("nb", { source: "rev", prefix: "$", suffix: "M", size: 56, color: "#0f172a", caption: "vs $500M target", label: "Revenue (scoreboard)" })
  .phase("p", {
    duration: 1200,
    title: "revenue progress flow",
    body: "3-lane (Current / Target / Gap) で revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "targetNode", "gapNode").badge("scoreboard"))
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
  .node("aliceNode", { lane: "top", stack: 0, kind: "card", title: "🥇 1st Alice", subtitle: "920 (gold, max)" })
  .node("eveNode", { lane: "top", stack: 1, kind: "card", title: "🥈 2nd Eve", subtitle: "890 (silver)" })
  .node("carolNode", { lane: "top", stack: 2, kind: "card", title: "🥉 3rd Carol", subtitle: "850 (bronze)" })
  .node("bobNode", { lane: "middle", stack: 0, kind: "card", title: "4th Bob", subtitle: "780" })
  .node("frankNode", { lane: "middle", stack: 1, kind: "card", title: "5th Frank", subtitle: "720 (last displayed)" })
  .node("danNode", { lane: "bottom", stack: 0, kind: "card", title: "6th Dan", subtitle: "680 (out of top 5)" })
  .readout.leaderboard("lb", { source: "players", max: 5, color: "#2563eb", label: "Ranking (top 5 leaderboard)" })
  .phase("p", {
    duration: 1200,
    title: "rank tier split",
    body: "3-lane (Top 3 medals gold/silver/bronze / Middle 2 rank 4-5 / Bottom 1 out of top) で 6 player を rank tier 別分散、 各 player 個別 card で score 明示、 leaderboard readout も併存で top 5 表示、 rank tier と leaderboard の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "eveNode", "carolNode", "bobNode", "frankNode", "danNode").badge("leaderboard"))
  .build();

/**
 * 57. buildStatusTrafficLight v2 = feature branch の CI build 進行 4 phase シナリオ (main merge 直前まで)、 shape-person + shape-mobile-device + shape-website (GitHub) + shape-server-rack (CI) + shape-hexagon (test runner) + shape-cloud の 6 shape で visual scene 化、 4 phase (commit → 実行中 → test 失敗 → 修正 pass) + 4 readout (trafficLight status / gauge coverage / countup build 試行数 / stat 実行時間) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "CI build 進行 4 phase シナリオ = (commit → 実行 → 失敗 → 修正 pass) の flow を shape-* primitive 6 種で表現 + 4 readout (trafficLight / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 220 })
  .state("statusNum", { initial: 0 })
  .state("coverage", { initial: 0 })
  .state("buildCount", { initial: 0 })
  .state("elapsedSec", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 加藤様", eyebrow: "author", subtitle: "feature/api-v3 修正中" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "IDE + git", eyebrow: "device", subtitle: "commit + push → CI 起動" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHub", eyebrow: "vcs", subtitle: "PR #482 · CI trigger" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI runner", eyebrow: "compute", subtitle: "3 stage: lint / test / build" })
  .node("testRunner", { lane: "system", stack: 2, kind: "shape-hexagon", title: "test runner", eyebrow: "verify", subtitle: "Vitest 384 test suite" })
  .node("deploy", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "deploy candidate", eyebrow: "release", subtitle: "green build のみ deploy 可" })
  .edge("dev", "laptop", { label: "code", tone: "info" })
  .edge("laptop", "github", { label: "git push", tone: "info" })
  .edge("github", "ci", { label: "trigger", tone: "accent" })
  .edge("ci", "testRunner", { label: "run test", tone: "warning" })
  .edge("testRunner", "deploy", { label: "green → deploy", tone: "success" })
  .readout.trafficLight("tl", { source: "statusNum", viewW: 80, viewH: 180, label: "build status" })
  .readout.gauge("covG", { source: "coverage", min: 0, max: 100, color: "#22c55e", label: "test coverage %" })
  .readout.countup("buildCU", { source: "buildCount", unit: " 回", label: "build 試行", decimals: 0 })
  .readout.stat("elapsedStat", { source: "elapsedSec", unit: " s", caption: "実行時間", label: "elapsed" })
  .phase("p1", {
    duration: 1800,
    title: "commit → CI 起動",
    body: "加藤様が feature branch に commit + push、 CI trigger。 statusNum 0 = yellow (waiting、 traffic-light 黄)、 coverage 0 → 20 tween、 buildCount 0 → 1 tween、 elapsedSec 0 → 15 tween。 dev + github lane active。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github").set("statusNum", 0).tween("coverage", 0, 20).tween("buildCount", 0, 1).tween("elapsedSec", 0, 15).badge("commit"))
  .phase("p2", {
    duration: 2200,
    title: "実行中 (lint + test)",
    body: "CI runner が lint pass → test 実行開始。 statusNum 0 → 1 tween (yellow → yellow 継続、 running 進行中)、 coverage 20 → 65 tween (gauge 針中位)、 buildCount 1 保持、 elapsedSec 15 → 90 tween、 ci + testRunner lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner").set("statusNum", 1).tween("coverage", 20, 65).tween("elapsedSec", 15, 90).badge("実行"))
  .phase("p3", {
    duration: 2400,
    title: "test 失敗",
    body: "384 test 中 3 test 失敗、 build 赤に。 statusNum 1 → 2 tween (traffic-light 黄 → 赤)、 coverage 65 → 78 tween (test 実行分は上昇)、 buildCount 1 → 2 tween (retry)、 elapsedSec 90 → 165 tween、 加藤様は再修正。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner").tween("statusNum", 1, 2).tween("coverage", 65, 78).tween("buildCount", 1, 2).tween("elapsedSec", 90, 165).badge("失敗"))
  .phase("p4", {
    duration: 2000,
    title: "修正 pass",
    body: "3 失敗を修正 commit、 CI 再実行で全 test pass。 statusNum 2 → 0 tween (traffic-light 赤 → 緑 相当、 status 表示切替)、 coverage 78 → 92 tween (gauge 針最上位)、 buildCount 2 → 3 tween、 elapsedSec 165 → 220 tween (合計)、 deploy lane activate、 6 shape 全 active、 green build 到達で deploy candidate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "testRunner", "deploy").set("statusNum", 0).tween("coverage", 78, 92).tween("buildCount", 2, 3).tween("elapsedSec", 165, 220).badge("pass"))
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
  .node("reactNode", { lane: "high", stack: 0, kind: "card", title: "React", subtitle: "weight=30 (max)" })
  .node("tsNode", { lane: "high", stack: 1, kind: "card", title: "TypeScript", subtitle: "weight=28" })
  .node("pyNode", { lane: "high", stack: 2, kind: "card", title: "Python", subtitle: "weight=22" })
  .node("rustNode", { lane: "mid", stack: 0, kind: "card", title: "Rust", subtitle: "weight=18" })
  .node("goNode", { lane: "mid", stack: 1, kind: "card", title: "Go", subtitle: "weight=15" })
  .node("svelteNode", { lane: "mid", stack: 2, kind: "card", title: "Svelte", subtitle: "weight=10" })
  .node("vueNode", { lane: "low", stack: 0, kind: "card", title: "Vue", subtitle: "weight=8" })
  .node("denoNode", { lane: "low", stack: 1, kind: "card", title: "Deno", subtitle: "weight=5 (min)" })
  .readout.tagCloud("tc", { source: "tags", minSize: 12, maxSize: 32, label: "Tech cloud (font-size 比例)" })
  .phase("p", {
    duration: 1200,
    title: "skill weight split",
    body: "3-lane (High weight ≥20 / Mid 10-19 / Low <10) で 8 tech skill を weight 別分散、 各 skill 個別 card で weight 明示、 tagCloud readout も併存で font-size 比例表示、 weight 分類と cloud 全体観の 2 経路 view。",
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
  .node("e1", { lane: "t1", stack: 0, kind: "card", title: "Alice", subtitle: "pushed to main · 2 min ago" })
  .node("e2", { lane: "t2", stack: 0, kind: "card", title: "Bob", subtitle: "opened PR #42 · 8 min ago" })
  .node("e3", { lane: "t3", stack: 0, kind: "card", title: "Carol", subtitle: "reviewed PR #40 · 15 min ago" })
  .node("e4", { lane: "t4", stack: 0, kind: "card", title: "Dan", subtitle: "merged PR #38 · 1 h ago" })
  .node("e5", { lane: "t5", stack: 0, kind: "card", title: "Eve", subtitle: "deployed v1.2 · 3 h ago" })
  .edge("e1", "e2", { label: "→", tone: "info" })
  .edge("e2", "e3", { label: "→", tone: "info" })
  .edge("e3", "e4", { label: "→", tone: "accent" })
  .edge("e4", "e5", { label: "→", tone: "accent" })
  .readout.activityFeed("af", { source: "events", max: 5, color: "#2563eb", label: "Recent (feed list)" })
  .phase("p", {
    duration: 1200,
    title: "activity timeline",
    body: "5-lane timeline (recent → old) で 5 event を横並び node network 化、 4 edge (時系列連結、 tone info/accent で新旧分類)、 activityFeed readout も併存で feed list 表示、 timeline 構造と feed 一覧の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("e1", "e2", "e3", "e4", "e5").badge("feed"))
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
  .input.slider("score", { min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "Score" })
  .state("score", { initial: 3.5 })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "Low range", subtitle: "0-1.5 stars · poor" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "Mid range", subtitle: "2-3.5 stars · average · default 3.5 here" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "High range", subtitle: "4-5 stars · excellent" })
  .node("currentNode", { lane: "mid", stack: 1, kind: "card", title: "◆ Current", subtitle: "{score} / 5" })
  .readout.rating("r", { source: "score", count: 5, color: "#eab308", label: "Rating (star display)" })
  .phase("p", {
    duration: 1200,
    title: "rating range map",
    body: "3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) で rating range を分散、 default 3.5 の位置 (mid lane) を currentNode で明示、 slider (0.5 刻み) 変化で rating readout 追随 (star display half-star 対応)、 range 分類と star 表示の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("lowNode", "midNode", "highNode", "currentNode").badge("rating"))
  .build();

/**
 * 61. alertNotification v2 = 本番 deploy 障害検知 → escalation 4 phase シナリオ、 shape-server-rack + shape-mobile-device + shape-iot-sensor + shape-cloud + shape-person × 2 の 6 shape で visual scene 化、 4 phase (deploy 開始 → 警告検知 → 障害エスカレ → 復旧成功) + 4 readout (notification / gauge severity / countup alert 数 / stat 対応時間) が tween で visually 連続変化。 iteration 8 wave 8-D2 redesign。
 */
export const alertNotification = diagram("interactive-alert-notification", {
  topic: "本番 deploy 障害検知 escalation = 4 phase (開始 → 警告 → 障害 → 復旧) の flow を shape-* primitive 6 種で表現 + 4 readout (notification / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("prod", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "prod cluster", eyebrow: "k8s", subtitle: "3 node · deploy v1.2.3 進行中" })
  .node("sensor", { lane: "infra", stack: 1, kind: "shape-iot-sensor", title: "監視 agent", eyebrow: "monitoring", subtitle: "1s scrape · CPU / mem / p99" })
  .node("pager", { lane: "channel", stack: 0, kind: "shape-cloud", title: "PagerDuty", eyebrow: "notification", subtitle: "severity 別 escalation policy" })
  .node("slack", { lane: "channel", stack: 1, kind: "shape-mobile-device", title: "Slack #alerts", eyebrow: "channel", subtitle: "on-call 通知 + reply" })
  .node("onCall", { lane: "responders", stack: 0, kind: "shape-person", title: "on-call 佐藤様", eyebrow: "sre", subtitle: "primary responder" })
  .node("manager", { lane: "responders", stack: 1, kind: "shape-person", title: "SRE lead 田中様", eyebrow: "escalation", subtitle: "secondary · 30 分以内対応" })
  .edge("prod", "sensor", { label: "expose metric", tone: "success" })
  .edge("sensor", "pager", { label: "threshold 超過", tone: "warning" })
  .edge("pager", "slack", { label: "notify", tone: "warning" })
  .edge("slack", "onCall", { label: "primary page", tone: "error" })
  .edge("onCall", "manager", { label: "escalate", tone: "error" })
  .readout.notification("nt", { kindSource: "kind", titleSource: "title", bodySource: "body", label: "現在 alert" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 100, color: "#ef4444", label: "severity score" })
  .readout.countup("alertCU", { source: "alertCount", unit: " 件", label: "累計 alert", decimals: 0 })
  .readout.stat("mttrStat", { source: "mttrMin", unit: " 分", caption: "対応時間", label: "MTTR" })
  .phase("p1", {
    duration: 1800,
    title: "deploy 開始",
    body: "v1.2.3 rolling deploy 開始、 canary 20%。 kind = info (青)、 title 'Deploy in progress'、 severity 0 → 15 tween、 alertCount 0 (info は count 外)、 mttrMin 0。 infra lane active。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor").set("kind", "info").set("title", "Deploy v1.2.3 in progress").set("body", "Canary 20% rolling out").tween("severity", 0, 15).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "警告検知",
    body: "canary で p99 latency 上昇検知、 warn threshold 超過。 kind = warn (橙)、 title 'p99 latency 620ms'、 severity 15 → 45 tween (gauge 針が橙域)、 alertCount 0 → 1 tween、 pager + slack lane activate。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack").set("kind", "warn").set("title", "⚠ p99 latency 620ms").set("body", "canary node-2 mem 90%").tween("severity", 15, 45).tween("alertCount", 0, 1).badge("警告"))
  .phase("p3", {
    duration: 2400,
    title: "障害エスカレ",
    body: "error rate 5% 超過、 primary page 発火。 kind = error (赤)、 title 'error rate 5.2% CRITICAL'、 severity 45 → 82 tween (gauge 針最上位、 深刻)、 alertCount 1 → 4 tween (加速)、 mttrMin 0 → 8 tween、 responders lane activate。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack", "onCall", "manager").set("kind", "error").set("title", "✕ error rate 5.2% CRITICAL").set("body", "canary rollback required").tween("severity", 45, 82).tween("alertCount", 1, 4).tween("mttrMin", 0, 8).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "復旧成功",
    body: "佐藤様が canary rollback 実行、 metric 正常化。 kind = success (緑)、 title 'canary rollback OK'、 severity 82 → 12 tween (gauge 針が急降下)、 alertCount 4 → 5 tween (resolved event 記録)、 mttrMin 8 → 14 tween (最終)、 6 shape 全 active、 復旧完遂。",
  }, (p: PhaseBuilder) => p.activate("prod", "sensor", "pager", "slack", "onCall", "manager").set("kind", "success").set("title", "✓ canary rollback OK").set("body", "metric back to normal · v1.2.2 stable").tween("severity", 82, 12).tween("alertCount", 4, 5).tween("mttrMin", 8, 14).badge("復旧"))
  .build();

/**
 * 62. commitDiffCounter v2 = feature branch の開発進行に伴う PR diff サイズ推移 4 phase シナリオ、 shape-person + shape-mobile-device + shape-website (GitHub) + shape-server-rack (CI) + shape-cylinder + shape-hexagon の 6 shape で visual scene 化、 4 phase (初期実装 → 拡張 → refactor → 最終整理) + 4 readout (diffCounter / gauge PR サイズ健全性 / countup commit 数 / stat net delta) が tween で visually 連続変化。 iteration 8 wave 8-D2 redesign。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "PR diff サイズ推移 4 phase = (初期 → 拡張 → refactor → 最終) の flow を shape-* primitive 6 種で表現 + 4 readout (diffCounter / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("review", { x: 580, width: 240 })
  .state("add", { initial: 0 })
  .state("del", { initial: 0 })
  .state("healthScore", { initial: 100 })
  .state("commitCount", { initial: 0 })
  .state("netDelta", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 藤田様", eyebrow: "author", subtitle: "feature/refactor-cart 担当" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "VS Code + Git", eyebrow: "device", subtitle: "commit → push loop" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHub PR", eyebrow: "vcs", subtitle: "+{add} / -{del} lines diff" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI (Actions)", eyebrow: "build", subtitle: "PR ごとに test + lint" })
  .node("db", { lane: "system", stack: 2, kind: "shape-cylinder", title: "commit history DB", eyebrow: "history", subtitle: "commit log + diff メタ" })
  .node("checker", { lane: "review", stack: 0, kind: "shape-hexagon", title: "PR size checker", eyebrow: "policy", subtitle: "500 行超で warning · 800 で block" })
  .edge("dev", "laptop", { label: "code", tone: "info" })
  .edge("laptop", "github", { label: "git push", tone: "info" })
  .edge("github", "ci", { label: "trigger", tone: "success" })
  .edge("github", "db", { label: "log", tone: "accent" })
  .edge("db", "checker", { label: "size check", tone: "warning" })
  .readout.diffCounter("dc", { additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "PR diff (+/-)" })
  .readout.gauge("healthG", { source: "healthScore", min: 0, max: 100, color: "#22c55e", label: "PR サイズ健全性 %" })
  .readout.countup("commCU", { source: "commitCount", unit: " 件", label: "累計 commit", decimals: 0 })
  .readout.stat("netStat", { source: "netDelta", unit: " line", caption: "net delta", label: "net" })
  .phase("p1", {
    duration: 1800,
    title: "初期実装",
    body: "藤田様が checkout refactor 開始、 skeleton 実装。 add 0 → 80 tween、 del 0 → 20 tween、 healthScore 100 (small PR)、 commitCount 0 → 3 tween、 netDelta 0 → 60 tween。 dev + github lane active。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github").tween("add", 0, 80).tween("del", 0, 20).tween("commitCount", 0, 3).tween("netDelta", 0, 60).badge("初期"))
  .phase("p2", {
    duration: 2200,
    title: "拡張実装",
    body: "追加機能実装で diff 膨張。 add 80 → 320 tween、 del 20 → 45 tween、 healthScore 100 → 70 tween (gauge 針が黄域降下 = size 警告)、 commitCount 3 → 8 tween、 netDelta 60 → 275 tween、 ci lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci").tween("add", 80, 320).tween("del", 20, 45).tween("healthScore", 100, 70).tween("commitCount", 3, 8).tween("netDelta", 60, 275).badge("拡張"))
  .phase("p3", {
    duration: 2200,
    title: "refactor (削除多)",
    body: "重複コード削除 + 抽象化。 add 320 → 380 tween (微増)、 del 45 → 180 tween (大量削除)、 healthScore 70 → 80 tween (health 回復)、 commitCount 8 → 14 tween、 netDelta 275 → 200 tween (削減効果)、 db + checker lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "db", "checker").tween("add", 320, 380).tween("del", 45, 180).tween("healthScore", 70, 80).tween("commitCount", 8, 14).tween("netDelta", 275, 200).badge("refactor"))
  .phase("p4", {
    duration: 2000,
    title: "最終整理",
    body: "test + docs 追加、 dead code cleanup。 add 380 → 420 tween、 del 180 → 220 tween、 healthScore 80 → 88 tween (最終、 gauge 針が緑域に戻る)、 commitCount 14 → 18 tween、 netDelta 200 → 200 保持 (バランス)、 6 shape 全 active、 PR ready for review。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "github", "ci", "db", "checker").tween("add", 380, 420).tween("del", 180, 220).tween("healthScore", 80, 88).tween("commitCount", 14, 18).badge("整理"))
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
  .node("cust1", { lane: "customer", stack: 0, kind: "card", title: "Alice #1", subtitle: "Hi, I need help with my order" })
  .node("cust2", { lane: "customer", stack: 1, kind: "card", title: "Alice #2", subtitle: "#12345" })
  .node("sup1", { lane: "support", stack: 0, kind: "card", title: "Support #1", subtitle: "Sure! What's the order ID?" })
  .node("sup2", { lane: "support", stack: 1, kind: "card", title: "Support #2", subtitle: "Checking..." })
  .node("sup3", { lane: "support", stack: 2, kind: "card", title: "Support #3", subtitle: "Refunded! 3-5 days." })
  .readout.chatBubble("cb", { source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#e2e8f0", label: "Conversation (bubbles)" })
  .phase("p", {
    duration: 1200,
    title: "speaker split",
    body: "2-lane (Customer 2 msg / Support 3 msg) で 5 message を speaker 別分散、 各 message 個別 card で内容明示、 chatBubble readout も併存で左右寄せ表示、 speaker 分類と thread 経路の 2 view。",
  }, (p: PhaseBuilder) => p.activate("cust1", "cust2", "sup1", "sup2", "sup3").badge("chat"))
  .build();

/**
 * 64. userAvatar v2 = SNS プラットフォーム 新規ユーザー onboarding avatar 選択シナリオ、 shape-person + shape-mobile-device + shape-website + shape-cylinder + shape-cloud + shape-warehouse の 6 shape で visual scene 化、 4 phase (アカウント作成 → デフォルト avatar → カスタム画像 upload → 反映) + 4 readout (avatar / gauge upload 進捗 / countup 新規登録数 / stat active user) が tween で visually 連続変化。 iteration 8 wave 8-D redesign。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "SNS 新規ユーザー onboarding avatar 選択 = 4 phase (作成 → デフォルト → upload → 反映) の flow を shape-* primitive 6 種で表現 + 4 readout (avatar / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("delivery", { x: 580, width: 220 })
  .state("uploadProgress", { initial: 0 })
  .state("newSignups", { initial: 12483 })
  .state("activeUsers", { initial: 0 })
  .state("displayName", { initial: "Alice Wonderland" })
  .node("newUser", { lane: "user", stack: 0, kind: "shape-person", title: "新規 Alice 様", eyebrow: "signup", subtitle: "アカウント作成中" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone", eyebrow: "device", subtitle: "SNS mobile app" })
  .node("app", { lane: "system", stack: 0, kind: "shape-website", title: "SNS webapp", eyebrow: "frontend", subtitle: "onboarding wizard · avatar step" })
  .node("db", { lane: "system", stack: 1, kind: "shape-cylinder", title: "users DB", eyebrow: "database", subtitle: "profile record · display_name + avatar_url" })
  .node("s3", { lane: "system", stack: 2, kind: "shape-cloud", title: "S3 bucket", eyebrow: "storage", subtitle: "avatar 画像 CDN 配信元" })
  .node("cdn", { lane: "delivery", stack: 0, kind: "shape-warehouse", title: "CloudFront CDN", eyebrow: "cdn", subtitle: "全世界 avatar 配信" })
  .edge("newUser", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "app", { label: "POST /signup", tone: "info" })
  .edge("app", "db", { label: "INSERT user", tone: "success" })
  .edge("app", "s3", { label: "PUT avatar", tone: "accent" })
  .edge("s3", "cdn", { label: "distribution", tone: "success" })
  .edge("cdn", "mobile", { label: "GET /avatar.jpg", tone: "success" })
  .readout.avatar("av", { source: "displayName", size: 72, color: "#2563eb", label: "avatar preview" })
  .readout.gauge("uploadG", { source: "uploadProgress", min: 0, max: 100, color: "#22c55e", label: "upload 進捗 %" })
  .readout.countup("signupsCU", { source: "newSignups", unit: " 名", label: "本日新規登録", decimals: 0 })
  .readout.stat("activeStat", { source: "activeUsers", unit: " 名", caption: "active users", label: "active" })
  .phase("p1", {
    duration: 1800,
    title: "アカウント作成",
    body: "Alice 様がメール + パスワード登録、 display_name = 'Alice Wonderland' 入力。 uploadProgress 0 (未開始)、 newSignups 12483 → 12484 tween (countup 加算)、 activeUsers 0、 avatar は initials 'AW' の default 青円表示。 user lane active。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile").tween("newSignups", 12483, 12484).set("uploadProgress", 0).set("displayName", "Alice Wonderland").badge("作成"))
  .phase("p2", {
    duration: 2000,
    title: "デフォルト avatar 表示",
    body: "onboarding wizard の avatar step、 initials 'AW' の default avatar 表示。 uploadProgress 0 (default 選択、 upload なし)、 activeUsers 0 → 1 tween (Alice が active に)、 app + db lane activate。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db").set("uploadProgress", 0).tween("activeUsers", 0, 1).badge("default"))
  .phase("p3", {
    duration: 2400,
    title: "カスタム画像 upload",
    body: "Alice がプロフィール写真選択 → S3 へ upload。 uploadProgress 0 → 100 tween (gauge 針が動的に上昇して満タンまで)、 s3 lane activate、 PUT 完了時に CDN へ distribution 開始。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db", "s3").tween("uploadProgress", 0, 100).badge("upload"))
  .phase("p4", {
    duration: 1800,
    title: "反映 (CDN 配信)",
    body: "CloudFront edge cache に配信、 全ユーザーが Alice の新 avatar を閲覧可能。 uploadProgress 100 保持、 activeUsers 1 → 2 tween (Alice + 閲覧者)、 6 shape 全 active、 avatar preview が initials → 実写真表示に切替。",
  }, (p: PhaseBuilder) => p.activate("newUser", "mobile", "app", "db", "s3", "cdn").set("uploadProgress", 100).tween("activeUsers", 1, 2).badge("反映"))
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
  .node("t1", { lane: "done", stack: 0, kind: "card", title: "✓ Setup CI", subtitle: "done" })
  .node("t2", { lane: "done", stack: 1, kind: "card", title: "✓ Write tests", subtitle: "done" })
  .node("t3", { lane: "todo", stack: 0, kind: "card", title: "Fix bug #42", subtitle: "todo (blocker)" })
  .node("t4", { lane: "todo", stack: 1, kind: "card", title: "Code review", subtitle: "todo (awaits reviewer)" })
  .node("t5", { lane: "todo", stack: 2, kind: "card", title: "Deploy staging", subtitle: "todo (depends on review)" })
  .node("t6", { lane: "todo", stack: 3, kind: "card", title: "Post-mortem", subtitle: "todo (last)" })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "Progress (2/6 = 33%)" })
  .phase("p", {
    duration: 1200,
    title: "sprint split",
    body: "2-lane (Done 2 item / Todo 4 item) で 6 sprint task を状態別分散、 各 task 個別 card で進捗 + note 明示、 checklist readout も併存で progress% (2/6 = 33%) 表示、 status 分類と check-list の 2 経路 view。",
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
    title: "rpm range map",
    body: "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("idleNode", "cruiseNode", "redlineNode", "currentRpm").badge("tachometer"))
  .build();

/**
 * 67. productPriceTag v2 = 大手 EC のブラックフライデー ダイナミック プライシング シナリオ、 shape-online-shop + shape-mobile-device + shape-storefront + shape-cylinder + shape-warehouse + shape-person の 6 shape で visual scene 化、 4 phase (通常価格 → セール開始 → 値下げ深化 → 在庫連動最終値) + 4 readout (priceTag / gauge 割引率 / countup 販売数 / bar 在庫残) が tween で visually 連続変化。 iteration 8 wave 8-A2 redesign。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "EC ブラックフライデー ダイナミック プライシング シナリオ = 4 phase (通常 → セール開始 → 深化 → 在庫連動) の flow を shape-* primitive 6 種で表現 + 4 readout (priceTag / gauge / countup / bar) が tween で visually 連続変化",
})
  .lane("customer", { x: 0, width: 200 })
  .lane("ec", { x: 220, width: 300 })
  .lane("supply", { x: 540, width: 240 })
  .state("newPrice", { initial: 100 })
  .state("oldPrice", { initial: 100 })
  .state("discount", { initial: 0 })
  .state("sold", { initial: 0 })
  .state("stock", { initial: 500 })
  .node("shopper", { lane: "customer", stack: 0, kind: "shape-person", title: "買い物客 中村様", eyebrow: "customer", subtitle: "セール watcher" })
  .node("mobile", { lane: "customer", stack: 1, kind: "shape-mobile-device", title: "Amazon app", eyebrow: "device", subtitle: "商品ページ · 価格 alert" })
  .node("shop", { lane: "ec", stack: 0, kind: "shape-online-shop", title: "Amazon.co.jp", eyebrow: "ec", subtitle: "商品 「掃除機 X」 · 価格 ¥{newPrice}" })
  .node("store", { lane: "ec", stack: 1, kind: "shape-storefront", title: "セール会場", eyebrow: "campaign", subtitle: "BF セール · 動的値付け engine" })
  .node("db", { lane: "ec", stack: 2, kind: "shape-cylinder", title: "価格履歴 DB", eyebrow: "database", subtitle: "1h ごと price snapshot" })
  .node("warehouse", { lane: "supply", stack: 0, kind: "shape-warehouse", title: "配送センター", eyebrow: "logistics", subtitle: "在庫 {stock} 個 · Fulfilled by Amazon" })
  .edge("shopper", "mobile", { label: "watch", tone: "info" })
  .edge("mobile", "shop", { label: "GET /product", tone: "info" })
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
    body: "セール前、 掃除機 X は定価 ¥12,800 販売中。 newPrice = 100 相当 (priceTag 定価表示、 割引なし)、 discount = 0 (gauge 針最下)、 sold = 0 (未売却)、 stock 500 (bar 満タン)。 customer + shop lane active。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop").set("newPrice", 100).set("oldPrice", 100).set("discount", 0).set("sold", 0).set("stock", 500).badge("通常"))
  .phase("p2", {
    duration: 2400,
    title: "セール開始",
    body: "BF 00:00 にセール開始、 store の値付け engine が発動。 newPrice 100 → 75 tween (priceTag が赤値下げ表示 + 打消し線)、 oldPrice = 100 (打消し線)、 discount 0 → 25 tween (gauge 針が赤域上昇 = 25% OFF)、 store lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store").tween("newPrice", 100, 75).set("oldPrice", 100).tween("discount", 0, 25).badge("セール"))
  .phase("p3", {
    duration: 2200,
    title: "値下げ深化 (競合対抗)",
    body: "競合が同時値下げで engine が再値下げ、 newPrice 75 → 65 tween (priceTag 数字が更新)、 discount 25 → 35 tween (gauge 針最高付近、 35% OFF)、 sold 0 → 180 tween (countup 加速 = 買い注文集中)、 stock 500 → 320 tween (bar 縮小)、 db lane activate 履歴保存。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store", "db").tween("newPrice", 75, 65).tween("discount", 25, 35).tween("sold", 0, 180).tween("stock", 500, 320).badge("深化"))
  .phase("p4", {
    duration: 2000,
    title: "在庫連動 最終値",
    body: "在庫 320 → 減少で engine が値上げ (在庫希少シグナル)、 newPrice 65 → 68 tween (少し戻す)、 discount 35 → 32 tween、 sold 180 → 380 tween (販売継続)、 stock 320 → 120 tween (bar 更に縮小)、 warehouse lane activate、 6 shape 全 active、 セール終盤の buy sell 均衡。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "shop", "store", "db", "warehouse").tween("newPrice", 65, 68).tween("discount", 35, 32).tween("sold", 180, 380).tween("stock", 320, 120).badge("在庫連動"))
  .build();

/**
 * 68. deploySpinner v2 = 金曜夜 production deploy 4 phase シナリオ (canary rollout → 全体展開)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-warehouse + shape-hexagon の 6 shape で visual scene 化、 4 phase (build 完了 → canary 20% → 全体 100% → 完了通知) + 4 readout (spinner / gauge rollout % / countup pod 数 / stat 経過時間) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "金曜夜 production deploy 4 phase シナリオ = (build → canary → 全体 → 完了) の flow を shape-* primitive 6 種で表現 + 4 readout (spinner / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("engineer", { x: 0, width: 220 })
  .lane("infra", { x: 240, width: 320 })
  .lane("notify", { x: 580, width: 240 })
  .state("status", { initial: "running" })
  .state("msg", { initial: "Building production bundle" })
  .state("rolloutPct", { initial: 0 })
  .state("readyPods", { initial: 0 })
  .state("elapsedMin", { initial: 0 })
  .node("engineer", { lane: "engineer", stack: 0, kind: "shape-person", title: "release engineer 岡田様", eyebrow: "engineer", subtitle: "金曜夜 21:00 deploy 担当" })
  .node("laptop", { lane: "engineer", stack: 1, kind: "shape-mobile-device", title: "kubectl + ArgoCD", eyebrow: "device", subtitle: "deploy コマンド + 進捗 watch" })
  .node("cluster", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "prod K8s cluster", eyebrow: "compute", subtitle: "30 pod target · rolling update" })
  .node("registry", { lane: "infra", stack: 1, kind: "shape-cloud", title: "container registry", eyebrow: "artifact", subtitle: "v2.5.0 image pull" })
  .node("cdn", { lane: "infra", stack: 2, kind: "shape-hexagon", title: "CDN cache invalidate", eyebrow: "purge", subtitle: "global edge purge · TTL 300s" })
  .node("slack", { lane: "notify", stack: 0, kind: "shape-warehouse", title: "Slack #release", eyebrow: "channel", subtitle: "deploy status 通知配信" })
  .edge("engineer", "laptop", { label: "kubectl apply", tone: "info" })
  .edge("laptop", "cluster", { label: "rollout start", tone: "warning" })
  .edge("cluster", "registry", { label: "image pull", tone: "info" })
  .edge("cluster", "cdn", { label: "purge", tone: "accent" })
  .edge("cluster", "slack", { label: "status 通知", tone: "success" })
  .readout.spinner("sp", { source: "status", textSource: "msg", color: "#2563eb", label: "deploy 進捗" })
  .readout.gauge("rolloutG", { source: "rolloutPct", min: 0, max: 100, color: "#22c55e", label: "rollout %" })
  .readout.countup("podsCU", { source: "readyPods", unit: "/30", label: "ready pods", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedMin", unit: " 分", caption: "経過時間", label: "elapsed" })
  .phase("p1", {
    duration: 2000,
    title: "build 完了",
    body: "岡田様が deploy コマンド実行、 registry から image pull 開始。 status = 'running' (spinner blue)、 msg = 'Pulling v2.5.0 image'、 rolloutPct 0 → 5 tween、 readyPods 0、 elapsedMin 0 → 2 tween。 engineer lane active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "registry").set("status", "running").set("msg", "Pulling v2.5.0 image").tween("rolloutPct", 0, 5).tween("elapsedMin", 0, 2).badge("build"))
  .phase("p2", {
    duration: 2400,
    title: "canary rollout (20%)",
    body: "3 pod (10%) → 6 pod (20%) と canary 展開、 metric 監視。 status = 'running' 継続、 msg = 'Canary 20% healthy'、 rolloutPct 5 → 20 tween、 readyPods 0 → 6 tween (countup 加算)、 elapsedMin 2 → 8 tween、 cluster lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry").set("status", "running").set("msg", "Canary 20% healthy").tween("rolloutPct", 5, 20).tween("readyPods", 0, 6).tween("elapsedMin", 2, 8).badge("canary"))
  .phase("p3", {
    duration: 2400,
    title: "全体展開 (100%)",
    body: "canary 正常確認 → 残 24 pod を rolling update。 status = 'running' 継続、 msg = 'Full rollout 60% → 100%'、 rolloutPct 20 → 100 tween (gauge 針最上位まで急上昇)、 readyPods 6 → 30 tween (countup dramatic)、 elapsedMin 8 → 18 tween、 cdn lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry", "cdn").set("msg", "Full rollout in progress").tween("rolloutPct", 20, 100).tween("readyPods", 6, 30).tween("elapsedMin", 8, 18).badge("展開"))
  .phase("p4", {
    duration: 1800,
    title: "完了通知",
    body: "全 30 pod v2.5.0 起動、 CDN purge 完了。 status = 'done' (spinner が緑 ✓ に変化)、 msg = 'Deploy complete v2.5.0'、 rolloutPct 100 保持、 readyPods 30 保持、 elapsedMin 18 → 22 tween、 slack lane activate で完了通知配信、 6 shape 全 active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "cluster", "registry", "cdn", "slack").set("status", "done").set("msg", "Deploy complete v2.5.0").tween("elapsedMin", 18, 22).badge("完了"))
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
  .input.slider("score", { min: 0, max: 100, defaultValue: 85, label: "Score" })
  .state("score", { initial: 85 })
  .node("aNode", { lane: "A", stack: 0, kind: "card", title: "A", subtitle: "≥ 90 (green)" })
  .node("bNode", { lane: "B", stack: 0, kind: "card", title: "B", subtitle: "80-89 (blue, default here)" })
  .node("cNode", { lane: "C", stack: 0, kind: "card", title: "C", subtitle: "70-79 (yellow)" })
  .node("dNode", { lane: "D", stack: 0, kind: "card", title: "D", subtitle: "60-69 (orange)" })
  .node("fNode", { lane: "F", stack: 0, kind: "card", title: "F", subtitle: "< 60 (red)" })
  .node("currentGrade", { lane: "B", stack: 1, kind: "card", title: "◆ Current", subtitle: "score = {score} / 100" })
  .readout.grade("g", { source: "score", max: 100, label: "Letter grade (band)" })
  .phase("p", {
    duration: 1200,
    title: "grade band split",
    body: "5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60) で 5 letter grade band を分散、 各 band 個別 card + current indicator (default score 85 → B lane)、 slider 変化で grade readout が letter + color 追随、 grade band 分類と current の 2 経路 view。",
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
  .input.stepper("sec", { min: 0, max: 3600, step: 5, defaultValue: 125, label: "Elapsed sec" })
  .input.toggle("running", { defaultValue: true, label: "Running" })
  .state("sec", { initial: 125 })
  .state("running", { initial: "true" })
  .state("elapsed", { initial: 125000 })
  .formula("elapsed", "sec * 1000")
  .node("secNode", { lane: "input", stack: 0, kind: "card", title: "Seconds", subtitle: "sec = {sec}s (0-3600)" })
  .node("runNode", { lane: "toggle", stack: 0, kind: "card", title: "Running toggle", subtitle: "running = {running}" })
  .node("displayNode", { lane: "display", stack: 0, kind: "card", title: "MM:SS.ms display", subtitle: "elapsed = sec × 1000 = {elapsed}ms" })
  .edge("secNode", "displayNode", { label: "× 1000", tone: "info" })
  .edge("runNode", "displayNode", { label: "color", tone: "success" })
  .readout.stopwatch("sw", { source: "elapsed", runningSource: "running", size: 40, color: "#0f172a", label: "Timer (MM:SS.ms)" })
  .phase("p", {
    duration: 1200,
    title: "timer signal flow",
    body: "3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。",
  }, (p: PhaseBuilder) => p.activate("secNode", "runNode", "displayNode").badge("timer"))
  .build();

/**
 * 71. mlConfidenceMeter v2 = 医療画像診断 AI の推論 confidence 判定 4 phase シナリオ (X線画像 → AI 推論 → 医師確認 → 診断確定)、 shape-person + shape-mobile-device + shape-server-rack + shape-hexagon + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (X 線撮影 → AI 推論 → 医師レビュー → 診断確定) + 4 readout (confidenceMeter / gauge 予測確率 / countup 処理画像数 / stat 誤判定率) が tween で visually 連続変化。 iteration 8 wave 8-F redesign。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "医療画像診断 AI 4 phase シナリオ = (撮影 → AI 推論 → 医師確認 → 診断確定) の flow を shape-* primitive 6 種で表現 + 4 readout (confidenceMeter / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("clinic", { x: 0, width: 240 })
  .lane("ai", { x: 260, width: 300 })
  .lane("outcome", { x: 580, width: 220 })
  .state("conf", { initial: 0 })
  .state("probability", { initial: 0 })
  .state("processedImg", { initial: 12483 })
  .state("errorRate", { initial: 0 })
  .node("patient", { lane: "clinic", stack: 0, kind: "shape-person", title: "患者 木下様", eyebrow: "patient", subtitle: "胸部 X線撮影対象" })
  .node("device", { lane: "clinic", stack: 1, kind: "shape-mobile-device", title: "撮影機 tablet UI", eyebrow: "device", subtitle: "DICOM 画像取得" })
  .node("gpu", { lane: "ai", stack: 0, kind: "shape-server-rack", title: "GPU 推論サーバ", eyebrow: "compute", subtitle: "NVIDIA A100 × 4 · TensorRT" })
  .node("model", { lane: "ai", stack: 1, kind: "shape-hexagon", title: "診断 model", eyebrow: "ml", subtitle: "ResNet-50 · 12 分類 · Top-1 conf" })
  .node("db", { lane: "ai", stack: 2, kind: "shape-cylinder", title: "電子カルテ DB", eyebrow: "storage", subtitle: "推論結果 + 医師 override 保存" })
  .node("doctor", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "放射線科医", eyebrow: "expert", subtitle: "AI 補助 → 最終診断確定" })
  .edge("patient", "device", { label: "撮影", tone: "info" })
  .edge("device", "gpu", { label: "画像送信", tone: "info" })
  .edge("gpu", "model", { label: "inference", tone: "accent" })
  .edge("model", "db", { label: "推論結果", tone: "success" })
  .edge("db", "doctor", { label: "レビュー要求", tone: "warning" })
  .edge("doctor", "db", { label: "最終診断", tone: "success" })
  .readout.confidenceMeter("cm", { source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 320, viewH: 40, label: "AI 推論 confidence" })
  .readout.gauge("probG", { source: "probability", min: 0, max: 100, color: "#22c55e", label: "top-1 予測確率 %" })
  .readout.countup("imgCU", { source: "processedImg", unit: " 枚", label: "本日推論画像", decimals: 0 })
  .readout.stat("errStat", { source: "errorRate", unit: " %", caption: "AI 誤判定率", label: "err" })
  .phase("p1", {
    duration: 1800,
    title: "X 線撮影",
    body: "木下様の胸部 X 線撮影、 DICOM 形式で送信。 conf 0 (未推論)、 probability 0、 processedImg 12483 保持、 errorRate 0。 patient + device lane active。",
  }, (p: PhaseBuilder) => p.activate("patient", "device").set("conf", 0).set("probability", 0).badge("撮影"))
  .phase("p2", {
    duration: 2400,
    title: "AI 推論 (ResNet-50)",
    body: "GPU サーバで inference、 12 病名 分類の top-1 = '正常' 推論。 conf 0 → 68 tween (confidenceMeter が黄域に移動)、 probability 0 → 78 tween (gauge 針上昇)、 processedImg 12483 → 12484 tween (countup +1)、 gpu + model lane activate。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model").tween("conf", 0, 68).tween("probability", 0, 78).tween("processedImg", 12483, 12484).badge("推論"))
  .phase("p3", {
    duration: 2200,
    title: "医師レビュー",
    body: "放射線科医が AI 推論結果を確認、 追加所見 (軽微な影) を加味。 conf 68 → 82 tween (confidenceMeter が緑域へ)、 probability 78 → 92 tween (医師 override で高精度化)、 errorRate 0 → 2 tween (誤判定率 sample 表示)、 db + doctor lane activate。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model", "db", "doctor").tween("conf", 68, 82).tween("probability", 78, 92).tween("errorRate", 0, 2).badge("医師"))
  .phase("p4", {
    duration: 2000,
    title: "診断確定",
    body: "最終診断 = '軽度肺炎'、 電子カルテに記録 + 木下様に説明。 conf 82 → 95 tween (confidenceMeter 最上位、 高信頼)、 probability 92 → 97 tween (gauge 最終)、 processedImg 12484 → 12485 tween、 errorRate 2 保持、 6 shape 全 active、 診断確定。",
  }, (p: PhaseBuilder) => p.activate("patient", "device", "gpu", "model", "db", "doctor").tween("conf", 82, 95).tween("probability", 92, 97).tween("processedImg", 12484, 12485).badge("確定"))
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
  .node("mobile", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "X app", eyebrow: "device", subtitle: "投稿作成 + reaction 確認" })
  .node("post", { lane: "platform", stack: 0, kind: "shape-message-bubble", title: "投稿 (140 字)", eyebrow: "content", subtitle: "'iOS 18 の新機能まとめ 🚀'" })
  .node("timeline", { lane: "platform", stack: 1, kind: "shape-cloud", title: "X timeline", eyebrow: "distribution", subtitle: "algorithm ranking + trending 判定" })
  .node("analytics", { lane: "platform", stack: 2, kind: "shape-cylinder", title: "X analytics DB", eyebrow: "database", subtitle: "engagement 集計 · reaction rollup" })
  .node("audience", { lane: "audience", stack: 0, kind: "shape-warehouse", title: "全世界 audience", eyebrow: "readers", subtitle: "impression {impressions} 名到達" })
  .edge("author", "mobile", { label: "投稿", tone: "info" })
  .edge("mobile", "post", { label: "publish", tone: "info" })
  .edge("post", "timeline", { label: "配信", tone: "success" })
  .edge("timeline", "audience", { label: "expose", tone: "success" })
  .edge("audience", "analytics", { label: "reaction event", tone: "accent" })
  .edge("analytics", "mobile", { label: "notif 通知", tone: "warning" })
  .readout.reactionBar("rb", { source: "reactions", color: "#2563eb", label: "reaction pill list" })
  .readout.gauge("engG", { source: "engagement", min: 0, max: 100, color: "#22c55e", label: "engagement rate %" })
  .readout.countup("reactCU", { source: "totalReactions", unit: " 件", label: "累計 reactions", decimals: 0 })
  .readout.stat("impStat", { source: "impressions", unit: " 名", caption: "到達数", label: "impressions" })
  .phase("p1", {
    duration: 1800,
    title: "投稿直後 (0-1h)",
    body: "木村様が iOS 18 まとめ post を publish、 follower に配信開始。 engagement 0 → 3 tween、 totalReactions 0 → 15 tween (countup 加算、 初動 reaction)、 impressions 0 → 800 tween、 author + post lane active。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post").tween("engagement", 0, 3).tween("totalReactions", 0, 15).tween("impressions", 0, 800).badge("投稿"))
  .phase("p2", {
    duration: 2200,
    title: "初動拡散 (1-4h)",
    body: "algorithm ranking で trending 候補入り、 timeline 露出増。 engagement 3 → 12 tween、 totalReactions 15 → 240 tween (加速、 リプライ + retweet 混合)、 impressions 800 → 15000 tween、 timeline + audience lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience").tween("engagement", 3, 12).tween("totalReactions", 15, 240).tween("impressions", 800, 15000).badge("初動"))
  .phase("p3", {
    duration: 2400,
    title: "バズ (4-12h)",
    body: "influencer 拡散でバズ、 trending topic 入り。 engagement 12 → 28 tween (gauge 針最上位)、 totalReactions 240 → 1850 tween (加速 max、 countup dramatic)、 impressions 15000 → 240000 tween (爆発的到達)、 analytics lane activate、 木村様 notif で盛り上がり通知。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience", "analytics").tween("engagement", 12, 28).tween("totalReactions", 240, 1850).tween("impressions", 15000, 240000).badge("バズ"))
  .phase("p4", {
    duration: 2000,
    title: "落ち着き (12-24h)",
    body: "24h 経過で reaction 頻度低下、 累計は継続増加。 engagement 28 → 18 tween (時間経過で低下)、 totalReactions 1850 → 2450 tween (最終)、 impressions 240000 → 380000 tween (継続露出)、 6 shape 全 active、 24h 累計固定。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "post", "timeline", "audience", "analytics").tween("engagement", 28, 18).tween("totalReactions", 1850, 2450).tween("impressions", 240000, 380000).badge("24h"))
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
  .node("cto", { lane: "cto", stack: 0, kind: "shape-person", title: "CTO 高山様", eyebrow: "engineer", subtitle: "SaaS 立上げ技術判断責任" })
  .node("laptop", { lane: "cto", stack: 1, kind: "shape-mobile-device", title: "評価 sheet", eyebrow: "device", subtitle: "候補 tech 5 個 × 4 軸評価" })
  .node("docs", { lane: "review", stack: 0, kind: "shape-website", title: "docs / benchmark", eyebrow: "reference", subtitle: "公式 docs + community 記事" })
  .node("pocServer", { lane: "review", stack: 1, kind: "shape-server-rack", title: "PoC 環境", eyebrow: "sandbox", subtitle: "検証 branch · CI 実行" })
  .node("advisor", { lane: "review", stack: 2, kind: "shape-hexagon", title: "technical advisor", eyebrow: "consultant", subtitle: "元 Google engineer 評価" })
  .node("finalStack", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "確定 tech stack", eyebrow: "decision", subtitle: "本番採用 · チーム展開" })
  .edge("cto", "laptop", { label: "評価", tone: "info" })
  .edge("laptop", "docs", { label: "調査", tone: "info" })
  .edge("laptop", "pocServer", { label: "PoC 実装", tone: "accent" })
  .edge("pocServer", "advisor", { label: "評価依頼", tone: "warning" })
  .edge("advisor", "finalStack", { label: "推奨", tone: "success" })
  .readout.pillGroup("pg", { source: "stack", label: "候補 tech stack (5)" })
  .readout.gauge("fitG", { source: "fitScore", min: 0, max: 100, color: "#22c55e", label: "要件適合度 %" })
  .readout.countup("hoursCU", { source: "pocHours", unit: " h", label: "PoC 累計時間", decimals: 0 })
  .readout.stat("adoptStat", { source: "adoptedCount", unit: "/5", caption: "採用決定", label: "選定" })
  .phase("p1", {
    duration: 2000,
    title: "要件整理",
    body: "SaaS の性能 + 開発効率 + community 3 軸で要件定義。 fitScore 0 → 20 tween、 pocHours 0、 adoptedCount 0、 pillGroup で 5 候補列挙。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop").tween("fitScore", 0, 20).badge("要件"))
  .phase("p2", {
    duration: 2400,
    title: "候補比較",
    body: "docs + benchmark で 5 候補の pros/cons 整理。 fitScore 20 → 45 tween、 pocHours 0 → 8 tween、 adoptedCount 0 → 2 tween (React + TS 即決)、 docs lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs").tween("fitScore", 20, 45).tween("pocHours", 0, 8).tween("adoptedCount", 0, 2).badge("候補"))
  .phase("p3", {
    duration: 2400,
    title: "PoC 検証",
    body: "残 3 候補 (Rust / Vite / Bun) を CI で PoC。 fitScore 45 → 78 tween、 pocHours 8 → 32 tween (24h 追加)、 adoptedCount 2 → 4 tween (Vite / Bun 追加)、 pocServer + advisor lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs", "pocServer", "advisor").tween("fitScore", 45, 78).tween("pocHours", 8, 32).tween("adoptedCount", 2, 4).badge("PoC"))
  .phase("p4", {
    duration: 2000,
    title: "選定確定",
    body: "advisor 推薦で Rust も採用、 5/5 全 tech 確定。 fitScore 78 → 92 tween (gauge 最上位)、 pocHours 32 → 40 tween、 adoptedCount 4 → 5 tween、 finalStack lane activate、 6 shape 全 active。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "docs", "pocServer", "advisor", "finalStack").tween("fitScore", 78, 92).tween("pocHours", 32, 40).tween("adoptedCount", 4, 5).badge("確定"))
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
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "Low band", subtitle: "< 20% (red · critical)" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "Mid band", subtitle: "20-60% (yellow · charge soon)" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "High band", subtitle: "≥ 60% (green · healthy)" })
  .node("currentBattery", { lane: "high", stack: 1, kind: "card", title: "◆ Current", subtitle: "battery = {battery}% (default 72 → high)" })
  .readout.fuelBar("fb", { source: "battery", segments: 10, lowThreshold: 20, highThreshold: 60, viewW: 240, viewH: 32, label: "Level (10 segment bar)" })
  .phase("p", {
    duration: 1200,
    title: "battery band split",
    body: "3-lane (Low <20 red / Mid 20-60 yellow / High ≥60 green) で battery 3 band を分散、 current indicator (default 72 → high lane)、 slider 変化で fuelBar readout の filled 数 + color 追随、 battery / fuel / stamina 状態を lane 分割で可視化。",
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
  .node("usersNode", { lane: "users", stack: 0, kind: "card", title: "Users", subtitle: "12.4k (active MAU)" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", title: "Revenue", subtitle: "$45k (MRR)" })
  .node("uptimeNode", { lane: "uptime", stack: 0, kind: "card", title: "Uptime", subtitle: "99.9% (SLA)" })
  .node("errorsNode", { lane: "errors", stack: 0, kind: "card", title: "Errors", subtitle: "12 (last 24h)" })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "Metrics (2×2 grid)" })
  .phase("p", {
    duration: 1200,
    title: "KPI 4-way split",
    body: "4-lane (Users / Revenue / Uptime / Errors) で SaaS 4 KPI を機能別分散、 各 KPI 個別 card で value + context 明示、 metricsGrid readout も併存で 2×2 grid 表示、 KPI 分類と dashboard 全体の 2 経路 view。",
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
    body: "3-lane (Cold <15 / Comfort 15-25 / Hot ≥25) で room 温度を band 別分散、 current indicator (default 24 → comfort lane)、 slider 変化で thermometer readout 縦 bar + 球部 追随、 温度帯分類と thermometer 表示の 2 経路 view。",
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
  .node("growthNode", { lane: "growth", stack: 0, kind: "card", title: "📈 Growth", subtitle: "+15% MoM" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", title: "💰 Revenue", subtitle: "$50k MRR" })
  .node("goalsNode", { lane: "goals", stack: 0, kind: "card", title: "🎯 Goals", subtitle: "8/10 achieved" })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "KPIs (icon tile)" })
  .phase("p", {
    duration: 1200,
    title: "KPI tile split",
    body: "3-lane (Growth / Revenue / Goals) で 3 KPI を機能別分散、 各 KPI 個別 card で emoji + value 明示、 iconTile readout も併存で colored icon square 表示、 KPI 分類と tile 一覧の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("growthNode", "revenueNode", "goalsNode").badge("tiles"))
  .build();

/**
 * 78. cryptoWallet v2 = 個人 DeFi 保有者の日次 portfolio モニター シナリオ、 shape-wallet + shape-token × 4 + shape-exchange + shape-blockchain-node + shape-ethereum-chain の 7 shape で visual scene 化、 4 phase (portfolio 確認 → 市場更新 → 個別詳細 → 集計) + 4 readout (tokenList / gauge 総資産変動 / bar 24h vol / countup 総評価額) が tween で visually 連続変化する高品質 pattern。 iteration 8 wave 8-A redesign。
 */
export const cryptoWallet = diagram("interactive-crypto-wallet", {
  topic: "個人 DeFi 保有者 日次 portfolio モニター = 4 phase (確認 → 市場更新 → 詳細 → 集計) の flow を shape-* primitive 7 種で表現 + 4 readout (tokenList / gauge / bar / countup) が tween で visually 連続変化",
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
  .node("wallet", { lane: "holder", stack: 0, kind: "shape-wallet", title: "MetaMask", eyebrow: "wallet", subtitle: "0xAbc9...defE · Ledger" })
  .node("btc", { lane: "tokens", stack: 0, kind: "shape-token", title: "₿ BTC", eyebrow: "token", subtitle: "0.42 BTC · +5.3% 24h" })
  .node("eth", { lane: "tokens", stack: 1, kind: "shape-token", title: "Ξ ETH", eyebrow: "token", subtitle: "12.5 ETH · -2.8% 24h" })
  .node("sol", { lane: "tokens", stack: 2, kind: "shape-token", title: "◎ SOL", eyebrow: "token", subtitle: "245 SOL · +8.1% 24h" })
  .node("doge", { lane: "tokens", stack: 3, kind: "shape-token", title: "Ð DOGE", eyebrow: "token", subtitle: "8500 DOGE · -1.4% 24h" })
  .node("exchange", { lane: "infra", stack: 0, kind: "shape-exchange", title: "CEX quote", eyebrow: "quote", subtitle: "Binance API · 1s tick" })
  .node("node", { lane: "infra", stack: 1, kind: "shape-blockchain-node", title: "RPC node", eyebrow: "rpc", subtitle: "Infura · eth_call balance" })
  .node("chain", { lane: "infra", stack: 2, kind: "shape-ethereum-chain", title: "Ethereum L1", eyebrow: "chain", subtitle: "block #{portfolioValue}" })
  .edge("wallet", "btc", { label: "holdings", tone: "info" })
  .edge("wallet", "eth", { label: "holdings", tone: "info" })
  .edge("wallet", "sol", { label: "holdings", tone: "info" })
  .edge("wallet", "doge", { label: "holdings", tone: "info" })
  .edge("btc", "exchange", { label: "price", tone: "success" })
  .edge("exchange", "node", { label: "USD quote", tone: "accent" })
  .edge("node", "chain", { label: "balance query", tone: "success" })
  .readout.tokenList("tl", { source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "Portfolio 詳細" })
  .readout.gauge("deltaG", { source: "dailyDelta", min: 0, max: 100, color: "#22c55e", label: "24h 変動 (%tile)" })
  .readout.bar("volBar", { source: "volume24h", min: 0, max: 1000000000, color: "#f97316", label: "24h vol (USD)" })
  .readout.countup("valueCU", { source: "portfolioValue", unit: " 円", label: "総評価額 (JPY)", decimals: 0 })
  .phase("p1", {
    duration: 2000,
    title: "portfolio 確認",
    body: "朝 8:00、 wallet で 4 token 保有確認。 portfolioValue 42,580,000 円 (countup 静止)、 dailyDelta = 50 (gauge 針中位、 前日比 flat)、 volume24h = 0 (bar 空)、 tokenList に 4 token 表示。 holder + tokens lane activate。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge").set("dailyDelta", 50).set("volume24h", 0).badge("確認"))
  .phase("p2", {
    duration: 2400,
    title: "市場更新 (CEX API)",
    body: "Binance API から 1s tick で価格更新、 BTC +5.3% / SOL +8.1% / ETH -2.8% / DOGE -1.4%。 dailyDelta 50 → 68 tween (gauge 針が緑域上昇 = 全体+)、 volume24h 0 → 780,000,000 tween (bar が右へ伸長 = 活発化)、 portfolioValue 42580000 → 43420000 tween (countup 加算 84 万円)、 infra lane の exchange 追加 activate。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange").tween("dailyDelta", 50, 68).tween("volume24h", 0, 780000000).tween("portfolioValue", 42580000, 43420000).badge("市場"))
  .phase("p3", {
    duration: 2200,
    title: "個別詳細 (RPC balance 照会)",
    body: "Infura RPC で eth_call balance query 実行、 on-chain 残高と wallet 表示を照合。 portfolioValue 43420000 → 43680000 tween (countup 微増 = 手数料調整反映)、 volume24h 780000000 → 920000000 tween (継続活発)、 node lane activate、 exchange → node の accent edge で照合 flow。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange", "node").tween("portfolioValue", 43420000, 43680000).tween("volume24h", 780000000, 920000000).badge("詳細"))
  .phase("p4", {
    duration: 1800,
    title: "集計完了",
    body: "chain (Ethereum L1) から最終 block 番号取得、 portfolio 評価完了。 dailyDelta 68 → 72 tween (gauge 針最高値、 +2.85% 上昇)、 portfolioValue 43680000 → 43810000 tween (最終 +230 万円)、 volume24h 920000000 → 985000000 tween (bar 最大付近)、 8 shape 全 active、 全 readout 最終値表示。",
  }, (p: PhaseBuilder) => p.activate("wallet", "btc", "eth", "sol", "doge", "exchange", "node", "chain").tween("dailyDelta", 68, 72).tween("portfolioValue", 43680000, 43810000).tween("volume24h", 920000000, 985000000).badge("集計"))
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
  .readout.mapPin("mp", { source: "cities", xMin: 0, xMax: 120, yMin: 0, yMax: 80, viewW: 300, viewH: 200, color: "#2563eb", label: "World map (2D coord)" })
  .phase("p", {
    duration: 1200,
    title: "city split",
    body: "2-lane (Asia-Pacific / America-Europe) で 5 city を地域別に分散、 各 city 個別 card + (x,y) 座標明示、 mapPin readout で 2D 地理配置も併存、 region 分類と地理位置の 2 経路 view。",
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
  .input.dropdown("prio", { options: ["high", "med", "low"], defaultValue: "high", label: "Priority" })
  .input.text("desc", { defaultValue: "Fix crash on startup", placeholder: "Issue description", maxLength: 60, label: "Description" })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "Fix crash on startup" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "▲ High priority", subtitle: "red · crash / regression" })
  .node("medNode", { lane: "med", stack: 0, kind: "card", title: "● Med priority", subtitle: "yellow · normal bug" })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "▼ Low priority", subtitle: "gray · nice-to-have" })
  .node("currentIssue", { lane: "high", stack: 1, kind: "card", title: "◆ Current Issue", subtitle: "prio: {prio} · {desc}" })
  .readout.priorityBadge("pb", { source: "prio", textSource: "desc", label: "Priority (badge + icon + text)" })
  .phase("p", {
    duration: 1200,
    title: "priority split",
    body: "3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。",
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
  .node("goldNode", { lane: "gold", stack: 0, kind: "card", title: "🥇 1st — Alice", subtitle: "1200 pts (gold champion)" })
  .node("bronzeNode", { lane: "bronze", stack: 0, kind: "card", title: "🥉 3rd — Carol", subtitle: "980 pts (bronze)" })
  .readout.podium("pod", { source: "winners", viewW: 280, viewH: 180, label: "Podium (3 縦 bar 表彰台)" })
  .phase("p", {
    duration: 1200,
    title: "podium split",
    body: "3-lane (Silver 左 / Gold 中央 / Bronze 右) で 3 winner を podium 実配置模倣、 中央=1 位を目立たせ、 各 winner 個別 card で名前 + score 明示、 podium readout も併存で従来 3 縦 bar 表示。",
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
  .node("pm", { lane: "pm", stack: 0, kind: "shape-person", title: "PM 中野様", eyebrow: "product", subtitle: "Q3 roadmap 決定担当" })
  .node("dashboard", { lane: "pm", stack: 1, kind: "shape-mobile-device", title: "PM 分析画面", eyebrow: "device", subtitle: "リアルタイム集計 view" })
  .node("app", { lane: "platform", stack: 0, kind: "shape-online-shop", title: "SaaS product", eyebrow: "product", subtitle: "in-app feature poll banner" })
  .node("db", { lane: "platform", stack: 1, kind: "shape-cylinder", title: "vote DB", eyebrow: "database", subtitle: "1 user 1 vote · unique 制約" })
  .node("email", { lane: "platform", stack: 2, kind: "shape-cloud", title: "email campaign", eyebrow: "outreach", subtitle: "既存ユーザーへ告知メール" })
  .node("users", { lane: "users", stack: 0, kind: "shape-warehouse", title: "全ユーザー 8500 名", eyebrow: "audience", subtitle: "投票対象母集団" })
  .edge("pm", "dashboard", { label: "モニター", tone: "info" })
  .edge("dashboard", "app", { label: "poll 起動", tone: "info" })
  .edge("app", "email", { label: "告知", tone: "warning" })
  .edge("email", "users", { label: "拡散", tone: "success" })
  .edge("users", "db", { label: "投票", tone: "accent" })
  .edge("db", "dashboard", { label: "集計", tone: "success" })
  .readout.pollBar("pb", { source: "options", color: "#94a3b8", colorWinner: "#2563eb", label: "投票結果" })
  .readout.gauge("partG", { source: "participation", min: 0, max: 100, color: "#22c55e", label: "参加率 %" })
  .readout.countup("voteCU", { source: "totalVotes", unit: " 票", label: "累計投票", decimals: 0 })
  .readout.stat("gapStat", { source: "leadGap", unit: " 票", caption: "1 位 vs 2 位", label: "gap" })
  .phase("p1", {
    duration: 1800,
    title: "投票開始",
    body: "PM 中野様が Q3 feature poll を app 内でスタート、 4 option 提示。 participation 0 → 5 tween、 totalVotes 0 → 120 tween、 leadGap 0 → 8 tween、 pm + app lane active。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app").tween("participation", 0, 5).tween("totalVotes", 0, 120).tween("leadGap", 0, 8).badge("開始"))
  .phase("p2", {
    duration: 2200,
    title: "拡散 (email 告知)",
    body: "既存 8500 ユーザーへ告知メール送信、 参加率上昇。 participation 5 → 25 tween、 totalVotes 120 → 850 tween (countup 加速)、 leadGap 8 → 22 tween (Dark mode リード拡大)、 email + users lane activate。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users").tween("participation", 5, 25).tween("totalVotes", 120, 850).tween("leadGap", 8, 22).badge("拡散"))
  .phase("p3", {
    duration: 2400,
    title: "中間集計",
    body: "1 週間経過、 3000 票達成。 participation 25 → 45 tween、 totalVotes 850 → 2400 tween、 leadGap 22 → 45 tween (Dark mode 圧倒的リード)、 db lane activate、 集計 dashboard に速報。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users", "db").tween("participation", 25, 45).tween("totalVotes", 850, 2400).tween("leadGap", 22, 45).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "最終集計 (winner 確定)",
    body: "2 週後 poll 終了、 Dark mode が winner。 participation 45 → 68 tween (gauge 針最上位)、 totalVotes 2400 → 5780 tween (最終)、 leadGap 45 → 63 tween (Dark 42% vs 2 位 28%)、 6 shape 全 active、 Q3 開発優先度確定。",
  }, (p: PhaseBuilder) => p.activate("pm", "dashboard", "app", "email", "users", "db").tween("participation", 45, 68).tween("totalVotes", 2400, 5780).tween("leadGap", 45, 63).badge("確定"))
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
  .node("author", { lane: "author", stack: 0, kind: "shape-person", title: "PR author 高橋様", eyebrow: "author", subtitle: "500 行変更 · feature/checkout-v2" })
  .node("laptop", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "GitHub mobile", eyebrow: "device", subtitle: "PR 状態確認 + 返信" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHub PR page", eyebrow: "vcs", subtitle: "PR #1247 · 7 reviewer 割当" })
  .node("api", { lane: "system", stack: 1, kind: "shape-server-rack", title: "GitHub API", eyebrow: "backend", subtitle: "review event 処理" })
  .node("db", { lane: "system", stack: 2, kind: "shape-cylinder", title: "review DB", eyebrow: "database", subtitle: "コメント + approve 記録" })
  .node("notif", { lane: "reviewers", stack: 0, kind: "shape-cloud", title: "Slack #team-eng", eyebrow: "notification", subtitle: "7 reviewer への PR 通知" })
  .edge("author", "laptop", { label: "PR open", tone: "info" })
  .edge("laptop", "github", { label: "POST /pulls", tone: "info" })
  .edge("github", "api", { label: "webhook", tone: "success" })
  .edge("api", "notif", { label: "reviewer 通知", tone: "warning" })
  .edge("notif", "db", { label: "review 提出", tone: "success" })
  .edge("db", "github", { label: "状態更新", tone: "accent" })
  .readout.userStack("us", { source: "reviewers", max: 5, size: 40, label: "reviewer 7 名 (5 表示 + +2 overflow)" })
  .readout.gauge("compG", { source: "completionRate", min: 0, max: 100, color: "#22c55e", label: "review 完了率 %" })
  .readout.countup("commCU", { source: "commentCount", unit: " 件", label: "累計コメント", decimals: 0 })
  .readout.stat("approveStat", { source: "approveCount", unit: "/7", caption: "approve 数", label: "approve" })
  .phase("p1", {
    duration: 1800,
    title: "PR open",
    body: "高橋様が feature/checkout-v2 の PR open、 500 行変更。 completionRate 0 (gauge 針最下)、 commentCount 0、 approveCount 0、 userStack で 7 名列挙。 author lane active。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop").set("completionRate", 0).set("commentCount", 0).set("approveCount", 0).badge("PR open"))
  .phase("p2", {
    duration: 2200,
    title: "reviewer 依頼",
    body: "GitHub が 7 reviewer 割当、 Slack で通知。 completionRate 0 → 15 tween、 commentCount 0 → 5 tween (初期質問)、 approveCount 0、 github + api + notif lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif").tween("completionRate", 0, 15).tween("commentCount", 0, 5).badge("依頼"))
  .phase("p3", {
    duration: 2400,
    title: "review 進行",
    body: "Alice + Bob + Carol が詳細 review、 Dan/Eve が軽 review。 completionRate 15 → 70 tween (gauge 針が緑域中位まで急上昇)、 commentCount 5 → 42 tween (countup 加速 = 白熱討議)、 approveCount 0 → 3 tween (stat 3 名承認)、 db lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif", "db").tween("completionRate", 15, 70).tween("commentCount", 5, 42).tween("approveCount", 0, 3).badge("review"))
  .phase("p4", {
    duration: 2000,
    title: "approve + merge",
    body: "残 Frank + Grace + Eve も approve、 全 7 名 sign-off で main merge。 completionRate 70 → 100 tween (gauge 最上位)、 commentCount 42 → 58 tween (最終 rollup)、 approveCount 3 → 7 tween (stat 満点)、 6 shape 全 active、 PR merged 到達。",
  }, (p: PhaseBuilder) => p.activate("author", "laptop", "github", "api", "notif", "db").tween("completionRate", 70, 100).tween("commentCount", 42, 58).tween("approveCount", 3, 7).badge("merge"))
  .build();

/**
 * 84. gitCommitList v2 = OSS プロジェクト 週次リリース 直前の commit review 4 phase シナリオ、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-hexagon の 6 shape で visual scene 化、 4 phase (週初 commit 発生 → 中盤集約 → release 直前 review → tag 発行) + 4 readout (commitList / gauge リリース準備度 / countup commit 数 / stat contributor 数) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const gitCommitList = diagram("interactive-git-commits", {
  topic: "OSS 週次リリース commit review 4 phase = (発生 → 集約 → review → tag) の flow を shape-* primitive 6 種で表現 + 4 readout (commitList / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("maintainer", { lane: "dev", stack: 0, kind: "shape-person", title: "maintainer 田村様", eyebrow: "lead", subtitle: "週次 release 責任者" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "GitHub CLI", eyebrow: "device", subtitle: "gh pr list + review" })
  .node("github", { lane: "system", stack: 0, kind: "shape-website", title: "GitHub repo", eyebrow: "vcs", subtitle: "PR 一覧 + commit history" })
  .node("ci", { lane: "system", stack: 1, kind: "shape-server-rack", title: "CI (Actions)", eyebrow: "build", subtitle: "全 PR で verify chain 実行" })
  .node("log", { lane: "system", stack: 2, kind: "shape-cylinder", title: "commit log DB", eyebrow: "storage", subtitle: "conventional commits 分類" })
  .node("release", { lane: "release", stack: 0, kind: "shape-hexagon", title: "release tag", eyebrow: "milestone", subtitle: "v0.42.0 tag 発行" })
  .edge("maintainer", "laptop", { label: "review", tone: "info" })
  .edge("laptop", "github", { label: "gh pr", tone: "info" })
  .edge("github", "ci", { label: "trigger", tone: "success" })
  .edge("ci", "log", { label: "分類記録", tone: "accent" })
  .edge("log", "release", { label: "changelog 生成", tone: "warning" })
  .readout.commitList("cl", { source: "commits", max: 5, color: "#2563eb", label: "recent commits 5 件" })
  .readout.gauge("readyG", { source: "readiness", min: 0, max: 100, color: "#22c55e", label: "release 準備度 %" })
  .readout.countup("commCU", { source: "commitCount", unit: " 件", label: "本週 commit 数", decimals: 0 })
  .readout.stat("contribStat", { source: "contributors", unit: " 名", caption: "contributor 数", label: "貢献" })
  .phase("p1", {
    duration: 1800,
    title: "週初 commit 発生 (月)",
    body: "月曜 8 名の contributor が feat / fix commit を push。 readiness 0 → 20 tween、 commitCount 0 → 12 tween (countup 加算)、 contributors 0 → 4 tween、 dev + github lane active。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github").tween("readiness", 0, 20).tween("commitCount", 0, 12).tween("contributors", 0, 4).badge("週初"))
  .phase("p2", {
    duration: 2200,
    title: "中盤集約 (水)",
    body: "水曜 CI が全 PR verify chain 実行、 rebase + squash 完了。 readiness 20 → 55 tween、 commitCount 12 → 28 tween、 contributors 4 → 7 tween、 ci lane activate、 test + docs commit 集約。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci").tween("readiness", 20, 55).tween("commitCount", 12, 28).tween("contributors", 4, 7).badge("集約"))
  .phase("p3", {
    duration: 2400,
    title: "release 直前 review (金)",
    body: "田村様が 5 recent commit を conventional commits 分類、 changelog draft 生成。 readiness 55 → 85 tween、 commitCount 28 → 42 tween、 contributors 7 → 8 tween、 log lane activate、 feat/fix/docs/refactor/test の 5 分類確定。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci", "log").tween("readiness", 55, 85).tween("commitCount", 28, 42).tween("contributors", 7, 8).badge("review"))
  .phase("p4", {
    duration: 2000,
    title: "tag 発行 (金曜夜)",
    body: "全 verify 通過 → v0.42.0 tag 発行 + release note 公開。 readiness 85 → 100 tween (gauge 針最上位、 release ready)、 commitCount 42 → 45 tween (最終)、 contributors 8 → 8 保持、 release lane activate、 6 shape 全 active、 週次 release 完遂。",
  }, (p: PhaseBuilder) => p.activate("maintainer", "laptop", "github", "ci", "log", "release").tween("readiness", 85, 100).tween("commitCount", 42, 45).badge("tag"))
  .build();

/**
 * 85. audioPlayer v2 = ポッドキャスト リスナーの朝の通勤時間 4 phase 聴取シナリオ (播放 → CM insert → skip → 完聴)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-warehouse + shape-hexagon の 6 shape で visual scene 化、 4 phase (再生開始 → CM 挿入 → 続き再生 → 完聴保存) + 4 readout (mediaPlayer / gauge 再生進捗 / countup total minutes / stat skip 数) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "ポッドキャスト通勤聴取 4 phase = (再生 → CM → skip → 完聴) の flow を shape-* primitive 6 種で表現 + 4 readout (mediaPlayer / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("listener", { lane: "listener", stack: 0, kind: "shape-person", title: "リスナー 齋藤様", eyebrow: "user", subtitle: "朝の通勤中に聴取" })
  .node("phone", { lane: "listener", stack: 1, kind: "shape-mobile-device", title: "iPhone Spotify", eyebrow: "device", subtitle: "streaming + offline" })
  .node("spotify", { lane: "platform", stack: 0, kind: "shape-cloud", title: "Spotify service", eyebrow: "streaming", subtitle: "podcast catalog + player API" })
  .node("cdn", { lane: "platform", stack: 1, kind: "shape-server-rack", title: "audio CDN", eyebrow: "cdn", subtitle: "AAC 128k stream 配信" })
  .node("adNet", { lane: "platform", stack: 2, kind: "shape-warehouse", title: "広告 network", eyebrow: "ad", subtitle: "dynamic CM 挿入 · 30s spot" })
  .node("analytics", { lane: "data", stack: 0, kind: "shape-hexagon", title: "listener analytics", eyebrow: "tracking", subtitle: "再生履歴 + skip 集計" })
  .edge("listener", "phone", { label: "操作", tone: "info" })
  .edge("phone", "spotify", { label: "GET stream", tone: "info" })
  .edge("spotify", "cdn", { label: "audio 配信", tone: "success" })
  .edge("spotify", "adNet", { label: "CM 要求", tone: "warning" })
  .edge("adNet", "cdn", { label: "CM insert", tone: "warning" })
  .edge("cdn", "phone", { label: "audio stream", tone: "success" })
  .edge("phone", "analytics", { label: "event 送信", tone: "accent" })
  .readout.mediaPlayer("mp", { source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 340, label: "podcast player" })
  .readout.gauge("progG", { source: "progressPct", min: 0, max: 100, color: "#22c55e", label: "再生進捗 %" })
  .readout.countup("minCU", { source: "totalMin", unit: " 分", label: "累計聴取時間", decimals: 0 })
  .readout.stat("skipStat", { source: "skipCount", unit: " 回", caption: "本 episode skip", label: "skip" })
  .phase("p1", {
    duration: 1800,
    title: "再生開始 (0-60s)",
    body: "齋藤様が iPhone で 4 分の podcast episode 再生開始。 current 0 → 60 tween、 progressPct 0 → 25 tween (gauge 針上昇)、 totalMin 4820 → 4821 tween (countup 加算)、 skipCount 0、 listener + phone + spotify + cdn lane active。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn").set("playing", "true").tween("current", 0, 60).tween("progressPct", 0, 25).tween("totalMin", 4820, 4821).badge("再生"))
  .phase("p2", {
    duration: 2200,
    title: "CM 挿入 (60-90s)",
    body: "60s で dynamic CM 30s 挿入、 listener やや不快。 current 60 → 90 tween、 progressPct 25 → 37 tween (CM 部分含む)、 totalMin 4821 保持、 skipCount 0、 adNet lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet").tween("current", 60, 90).tween("progressPct", 25, 37).badge("CM"))
  .phase("p3", {
    duration: 2400,
    title: "続き再生 + skip (90-180s)",
    body: "CM 終了 → 本編再開、 途中で興味薄い部分 15s skip。 current 90 → 180 tween、 progressPct 37 → 75 tween、 totalMin 4821 → 4823 tween (2 min 追加)、 skipCount 0 → 1 tween (stat 加算)、 analytics lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet", "analytics").tween("current", 90, 180).tween("progressPct", 37, 75).tween("totalMin", 4821, 4823).tween("skipCount", 0, 1).badge("skip"))
  .phase("p4", {
    duration: 2000,
    title: "完聴 (180-240s)",
    body: "残 60s 完聴、 episode 完了で lock screen 通知。 current 180 → 240 tween (mediaPlayer 100%)、 progressPct 75 → 100 tween (gauge 針最上位)、 playing = 'false' (再生停止)、 totalMin 4823 → 4824 tween (最終)、 skipCount 1 保持、 6 shape 全 active、 完聴 event 記録。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "spotify", "cdn", "adNet", "analytics").set("playing", "false").tween("current", 180, 240).tween("progressPct", 75, 100).tween("totalMin", 4823, 4824).badge("完聴"))
  .build();

/**
 * 86. serverEventLog v2 = production API サーバの朝ピーク時 incident 検知 4 phase シナリオ、 shape-server-rack + shape-cylinder + shape-iot-sensor + shape-cloud + shape-mobile-device + shape-person の 6 shape で visual scene 化、 4 phase (通常運転 → CPU 上昇 → DB エラー → 復旧) + 4 readout (eventLog / gauge severity / countup error 件数 / stat p99 latency) が tween で visually 連続変化。 iteration 8 wave 8-D3 redesign。
 */
export const serverEventLog = diagram("interactive-server-event-log", {
  topic: "production API 朝ピーク incident 検知 4 phase = (通常 → CPU 上昇 → DB エラー → 復旧) の flow を shape-* primitive 6 種で表現 + 4 readout (eventLog / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("api", { lane: "infra", stack: 0, kind: "shape-server-rack", title: "API server (prod-api-3)", eyebrow: "compute", subtitle: "Node.js 18 · 8 core · 32GB" })
  .node("db", { lane: "infra", stack: 1, kind: "shape-cylinder", title: "PostgreSQL", eyebrow: "database", subtitle: "primary + 2 replica" })
  .node("sensor", { lane: "infra", stack: 2, kind: "shape-iot-sensor", title: "監視 agent", eyebrow: "monitoring", subtitle: "1s scrape metric + log tail" })
  .node("logStream", { lane: "stream", stack: 0, kind: "shape-cloud", title: "log aggregator", eyebrow: "aggregation", subtitle: "Elasticsearch + Kibana" })
  .node("oncallDevice", { lane: "oncall", stack: 0, kind: "shape-mobile-device", title: "on-call スマホ", eyebrow: "device", subtitle: "PagerDuty push notif" })
  .node("engineer", { lane: "oncall", stack: 1, kind: "shape-person", title: "on-call 高橋様", eyebrow: "sre", subtitle: "prod incident response" })
  .edge("api", "sensor", { label: "expose", tone: "info" })
  .edge("db", "sensor", { label: "expose", tone: "info" })
  .edge("sensor", "logStream", { label: "log 送信", tone: "success" })
  .edge("logStream", "oncallDevice", { label: "alert push", tone: "error" })
  .edge("oncallDevice", "engineer", { label: "notify", tone: "warning" })
  .readout.eventLog("el", { source: "events", max: 10, label: "recent events (5 件)" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 100, color: "#ef4444", label: "システム severity" })
  .readout.countup("errCU", { source: "errorCount", unit: " 件", label: "error event 累計", decimals: 0 })
  .readout.stat("p99Stat", { source: "p99Ms", unit: " ms", caption: "p99 latency", label: "p99" })
  .phase("p1", {
    duration: 1800,
    title: "通常運転",
    body: "朝 10:23 API server 起動、 通常負荷。 severity 0 → 10 tween、 errorCount 0、 p99Ms 50 tween 保持、 eventLog に info + debug 表示。 infra lane active。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor").tween("severity", 0, 10).set("p99Ms", 50).badge("通常"))
  .phase("p2", {
    duration: 2200,
    title: "CPU 上昇 (warn)",
    body: "朝ピーク 10:24 でリクエスト急増、 CPU 82% 到達。 severity 10 → 45 tween (gauge 針が橙域上昇)、 errorCount 0 → 1 tween (最初の error は近い、 count 前提として 1 加算)、 p99Ms 50 → 180 tween (stat 動的上昇)、 logStream lane activate。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream").tween("severity", 10, 45).tween("errorCount", 0, 1).tween("p99Ms", 50, 180).badge("警告"))
  .phase("p3", {
    duration: 2400,
    title: "DB エラー",
    body: "10:25 DB connection timeout 発生、 error alert 発火。 severity 45 → 88 tween (gauge 針最上位近く、 critical)、 errorCount 1 → 5 tween (連続 error、 countup 加速)、 p99Ms 180 → 420 tween (激しく上昇)、 oncallDevice + engineer lane activate、 on-call ページング。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream", "oncallDevice", "engineer").tween("severity", 45, 88).tween("errorCount", 1, 5).tween("p99Ms", 180, 420).badge("DB error"))
  .phase("p4", {
    duration: 2000,
    title: "復旧",
    body: "10:26 高橋様が DB pool size 拡張 → 復旧、 retry 成功 log。 severity 88 → 20 tween (gauge 針が緑域に戻る)、 errorCount 5 → 5 保持 (resolved、 追加なし)、 p99Ms 420 → 80 tween (最終、 stat 正常値)、 6 shape 全 active、 復旧完遂 log 記録。",
  }, (p: PhaseBuilder) => p.activate("api", "db", "sensor", "logStream", "oncallDevice", "engineer").tween("severity", 88, 20).tween("p99Ms", 420, 80).badge("復旧"))
  .build();

/**
 * 87. searchResults v2 = エンジニア技術調査 4 phase シナリオ (Rust 学習調査 → 絞込 → 深掘り → 実行)、 shape-person + shape-mobile-device + shape-website × 2 + shape-cloud + shape-hexagon の 6 shape で visual scene 化、 4 phase (初回検索 → 絞込 → 深掘り選定 → 実装着手) + 4 readout (searchResult / gauge 関連度 / countup query 数 / stat click 数) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const searchResults = diagram("interactive-search-results", {
  topic: "エンジニア技術調査 4 phase = (初回 → 絞込 → 深掘り → 実行) の flow を shape-* primitive 6 種で表現 + 4 readout (searchResult / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("engineer", { lane: "user", stack: 0, kind: "shape-person", title: "engineer 藤井様", eyebrow: "developer", subtitle: "Rust 新規学習開始" })
  .node("laptop", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "Chrome browser", eyebrow: "device", subtitle: "検索 tab · 履歴保存" })
  .node("google", { lane: "engine", stack: 0, kind: "shape-website", title: "Google search", eyebrow: "engine", subtitle: "web search + snippet 表示" })
  .node("index", { lane: "engine", stack: 1, kind: "shape-cloud", title: "search index", eyebrow: "index", subtitle: "billions 経路 crawl + ranking" })
  .node("docSite", { lane: "engine", stack: 2, kind: "shape-website", title: "MDN / Rust docs", eyebrow: "reference", subtitle: "公式 doc site 群" })
  .node("playground", { lane: "outcome", stack: 0, kind: "shape-hexagon", title: "Rust playground", eyebrow: "sandbox", subtitle: "実装 + 実行 · online IDE" })
  .edge("engineer", "laptop", { label: "検索", tone: "info" })
  .edge("laptop", "google", { label: "GET /search", tone: "info" })
  .edge("google", "index", { label: "query", tone: "success" })
  .edge("index", "google", { label: "results", tone: "success" })
  .edge("google", "docSite", { label: "クリック", tone: "accent" })
  .edge("docSite", "playground", { label: "試行", tone: "warning" })
  .readout.searchResult("sr", { source: "hits", max: 5, color: "#2563eb", label: "検索結果 5 hit" })
  .readout.gauge("relG", { source: "relevance", min: 0, max: 100, color: "#22c55e", label: "関連度 %" })
  .readout.countup("qryCU", { source: "queryCount", unit: " 回", label: "累計 query", decimals: 0 })
  .readout.stat("clickStat", { source: "clickCount", unit: " 件", caption: "click 数", label: "click" })
  .phase("p1", {
    duration: 1800,
    title: "初回検索",
    body: "藤井様が 'Rust tutorial' で検索、 5 hit 表示。 relevance 0 → 40 tween、 queryCount 0 → 1 tween、 clickCount 0、 user + google + index lane active。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index").tween("relevance", 0, 40).tween("queryCount", 0, 1).badge("初回"))
  .phase("p2", {
    duration: 2200,
    title: "絞込 (2 回目 query)",
    body: "'Rust ownership tutorial' で絞込、 関連度上昇。 relevance 40 → 68 tween、 queryCount 1 → 3 tween、 clickCount 0 → 2 tween (docs 2 hit click)、 docSite lane activate。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite").tween("relevance", 40, 68).tween("queryCount", 1, 3).tween("clickCount", 0, 2).badge("絞込"))
  .phase("p3", {
    duration: 2200,
    title: "深掘り選定",
    body: "MDN + Rust docs で ownership 概念習得、 更に detail 確認。 relevance 68 → 85 tween (gauge 針最上位近く)、 queryCount 3 → 5 tween、 clickCount 2 → 4 tween、 docSite で深く閲覧。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite").tween("relevance", 68, 85).tween("queryCount", 3, 5).tween("clickCount", 2, 4).badge("深掘り"))
  .phase("p4", {
    duration: 2000,
    title: "実装着手 (playground)",
    body: "Rust playground で ownership sample 実装、 動作確認。 relevance 85 → 92 tween (最終、 gauge 針最上位)、 queryCount 5 → 6 tween、 clickCount 4 → 5 tween、 playground lane activate、 6 shape 全 active、 学習 loop 完成。",
  }, (p: PhaseBuilder) => p.activate("engineer", "laptop", "google", "index", "docSite", "playground").tween("relevance", 85, 92).tween("queryCount", 5, 6).tween("clickCount", 4, 5).badge("実装"))
  .build();

/**
 * 88. yearRoadmap v2 = スタートアップ CEO の 2026 年 4 phase 事業展開シナリオ (Q1 設計 → Q2 β → Q3 拡大 → Q4 GA + Series A)、 shape-person + shape-mobile-device + shape-brokerage + shape-online-shop + shape-warehouse + shape-cloud の 6 shape で visual scene 化、 4 phase (Q1 → Q2 → Q3 → Q4) + 4 readout (roadmap / gauge 進捗率 / countup 累計 MRR / stat funding 額) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const yearRoadmap = diagram("interactive-year-roadmap", {
  topic: "スタートアップ 2026 年事業展開 4 phase = (Q1 → Q2 → Q3 → Q4) の flow を shape-* primitive 6 種で表現 + 4 readout (roadmap / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("ceo", { lane: "ceo", stack: 0, kind: "shape-person", title: "CEO 神谷様", eyebrow: "founder", subtitle: "SaaS スタートアップ創業者" })
  .node("laptop", { lane: "ceo", stack: 1, kind: "shape-mobile-device", title: "OKR dashboard", eyebrow: "device", subtitle: "四半期 milestone tracking" })
  .node("product", { lane: "execution", stack: 0, kind: "shape-online-shop", title: "SaaS product", eyebrow: "product", subtitle: "MVP → Beta → GA へ進化" })
  .node("customers", { lane: "execution", stack: 1, kind: "shape-warehouse", title: "顧客基盤", eyebrow: "customers", subtitle: "MVP 10 名 → GA 500 名" })
  .node("infra", { lane: "execution", stack: 2, kind: "shape-cloud", title: "cloud infra", eyebrow: "infra", subtitle: "AWS · scale-up 段階" })
  .node("investors", { lane: "outcome", stack: 0, kind: "shape-brokerage", title: "VC 投資家", eyebrow: "capital", subtitle: "Seed → Series A へ" })
  .edge("ceo", "laptop", { label: "OKR", tone: "info" })
  .edge("laptop", "product", { label: "実装指示", tone: "info" })
  .edge("product", "customers", { label: "販売", tone: "success" })
  .edge("customers", "infra", { label: "負荷増", tone: "warning" })
  .edge("customers", "investors", { label: "traction 実績", tone: "success" })
  .edge("investors", "ceo", { label: "funding", tone: "accent" })
  .readout.roadmap("rm", { source: "plan", viewW: 420, viewH: 220, label: "2026 年 roadmap" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "年間進捗率 %" })
  .readout.countup("mrrCU", { source: "mrrK", unit: "k$ MRR", label: "月次売上", decimals: 0 })
  .readout.stat("fundStat", { source: "fundingM", unit: " M$", caption: "累計調達額", label: "funding" })
  .phase("p1", {
    duration: 2000,
    title: "Q1 (1-3 月) Design + MVP",
    body: "神谷様が Q1 に design system + MVP feature A 実装。 progress 0 → 25 tween、 mrrK 0 → 5 tween (α 顧客数名)、 fundingM 0 → 2 tween (Seed 200 万$)、 ceo + product lane active。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product").tween("progress", 0, 25).tween("mrrK", 0, 5).tween("fundingM", 0, 2).badge("Q1"))
  .phase("p2", {
    duration: 2200,
    title: "Q2 (4-6 月) Beta launch",
    body: "Q2 に public beta launch、 feature B 追加、 feedback loop 確立。 progress 25 → 50 tween、 mrrK 5 → 25 tween (countup 加速)、 fundingM 2 保持、 customers lane activate、 β user 50 名獲得。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers").tween("progress", 25, 50).tween("mrrK", 5, 25).badge("Q2"))
  .phase("p3", {
    duration: 2200,
    title: "Q3 (7-9 月) Scale + Enterprise",
    body: "infra 拡張 + B2B enterprise deals。 progress 50 → 75 tween、 mrrK 25 → 80 tween (enterprise で急増)、 fundingM 2 保持、 infra lane activate、 顧客 200 名到達。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers", "infra").tween("progress", 50, 75).tween("mrrK", 25, 80).badge("Q3"))
  .phase("p4", {
    duration: 2000,
    title: "Q4 (10-12 月) GA + Series A",
    body: "public GA release + Series A 調達 15M$。 progress 75 → 100 tween (gauge 針最上位)、 mrrK 80 → 150 tween (最終、 countup 最大)、 fundingM 2 → 17 tween (stat 大幅増、 Series A 15M$ 追加)、 investors lane activate、 6 shape 全 active、 事業展開完遂。",
  }, (p: PhaseBuilder) => p.activate("ceo", "laptop", "product", "customers", "infra", "investors").tween("progress", 75, 100).tween("mrrK", 80, 150).tween("fundingM", 2, 17).badge("Q4"))
  .build();

/**
 * 89. weekWeather v2 = 屋外イベント運営者の週次天気モニター判断シナリオ (週初め予測 → 悪化 → 中止判断 → 再開)、 shape-person + shape-mobile-device + shape-satellite + shape-cloud + shape-website + shape-warehouse の 6 shape で visual scene 化、 4 phase (週初 予測 → 週半ば悪化 → 木曜中止判断 → 金曜再開) + 4 readout (weatherForecast / gauge 降水確率 / countup 参加者予定 / stat 気温平均) が tween で visually 連続変化。 iteration 8 wave 8-E redesign。
 */
export const weekWeather = diagram("interactive-week-weather", {
  topic: "屋外イベント週次天気モニター 4 phase = (予測 → 悪化 → 中止 → 再開) の flow を shape-* primitive 6 種で表現 + 4 readout (weatherForecast / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("organizer", { lane: "organizer", stack: 0, kind: "shape-person", title: "運営 木村様", eyebrow: "planner", subtitle: "屋外音楽 fes 主催者" })
  .node("mobile", { lane: "organizer", stack: 1, kind: "shape-mobile-device", title: "天気 app", eyebrow: "device", subtitle: "気象庁 API + 予測 push" })
  .node("satellite", { lane: "data", stack: 0, kind: "shape-satellite", title: "気象衛星", eyebrow: "satellite", subtitle: "MTSAT · 10 分間隔観測" })
  .node("jma", { lane: "data", stack: 1, kind: "shape-cloud", title: "気象庁 API", eyebrow: "provider", subtitle: "週間予報 · 降水確率" })
  .node("eventSite", { lane: "data", stack: 2, kind: "shape-website", title: "event 予約サイト", eyebrow: "web", subtitle: "オンライン申込 · キャンセル対応" })
  .node("venue", { lane: "venue", stack: 0, kind: "shape-warehouse", title: "会場 (代々木公園)", eyebrow: "physical", subtitle: "屋外野外広場 · 5000 名収容" })
  .edge("organizer", "mobile", { label: "確認", tone: "info" })
  .edge("mobile", "jma", { label: "GET forecast", tone: "info" })
  .edge("satellite", "jma", { label: "観測 data", tone: "success" })
  .edge("jma", "eventSite", { label: "予報反映", tone: "accent" })
  .edge("eventSite", "venue", { label: "運営指示", tone: "warning" })
  .readout.weatherForecast("wf", { source: "forecast", label: "5 日予報" })
  .readout.gauge("rainG", { source: "rainPct", min: 0, max: 100, color: "#2563eb", label: "降水確率 %" })
  .readout.countup("attCU", { source: "attendees", unit: " 名", label: "参加予定者", decimals: 0 })
  .readout.stat("tempStat", { source: "avgTemp", unit: " °C", caption: "週間平均気温", label: "平均" })
  .phase("p1", {
    duration: 1800,
    title: "週初 予測",
    body: "月曜朝、 木村様が週間予報確認 (Mon 晴 → Fri 晴)。 rainPct 20 (gauge 針最下)、 attendees 0 → 3200 tween (申込加速)、 avgTemp 21 → 21 保持、 organizer + mobile lane active。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile").set("rainPct", 20).tween("attendees", 0, 3200).badge("週初"))
  .phase("p2", {
    duration: 2200,
    title: "水曜悪化 (雨予報)",
    body: "気象衛星から雨雲接近 detect、 週末雨予報。 rainPct 20 → 65 tween (gauge 針急上昇 = 高降水確率)、 attendees 3200 → 3800 tween (継続申込)、 avgTemp 21 → 19 tween、 satellite + jma lane activate。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma").tween("rainPct", 20, 65).tween("attendees", 3200, 3800).tween("avgTemp", 21, 19).badge("悪化"))
  .phase("p3", {
    duration: 2400,
    title: "木曜中止判断 (雷雨)",
    body: "木曜 ⚡ 雷雨予報、 event 中止判断 → 予約サイトで告知。 rainPct 65 → 90 tween (gauge 針最上位、 危険)、 attendees 3800 → 2100 tween (半数キャンセル)、 avgTemp 19 → 15 tween、 eventSite lane activate、 全員へ返金 process。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma", "eventSite").tween("rainPct", 65, 90).tween("attendees", 3800, 2100).tween("avgTemp", 19, 15).badge("中止"))
  .phase("p4", {
    duration: 2000,
    title: "金曜再開 (晴)",
    body: "金曜朝 ☀ 晴予報、 短縮版 event 再開 (規模半減)。 rainPct 90 → 15 tween (gauge 針急降下)、 attendees 2100 → 2400 tween (前日 walk-in 追加)、 avgTemp 15 → 22 tween、 venue lane activate、 6 shape 全 active、 event 再稼働。",
  }, (p: PhaseBuilder) => p.activate("organizer", "mobile", "satellite", "jma", "eventSite", "venue").tween("rainPct", 90, 15).tween("attendees", 2100, 2400).tween("avgTemp", 15, 22).badge("再開"))
  .build();

/**
 * 90. tutorialVideoCards v2 = YouTube educational クリエイター 4 phase 動画公開シナリオ (企画 → 撮影 → 公開 → viral)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-warehouse の 6 shape で visual scene 化、 4 phase (企画 → 撮影編集 → 公開 → viral 拡散) + 4 readout (videoCard / gauge CTR / countup views / stat sub 増数) が tween で visually 連続変化。 iteration 8 wave 8-H redesign。
 */
export const tutorialVideoCards = diagram("interactive-tutorial-videos", {
  topic: "YouTube 教育クリエイター動画公開 4 phase = (企画 → 撮影 → 公開 → viral) の flow を shape-* primitive 6 種で表現 + 4 readout (videoCard / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("creator", { lane: "creator", stack: 0, kind: "shape-person", title: "クリエイター 石田様", eyebrow: "youtuber", subtitle: "登録者 32k · 週次投稿" })
  .node("phone", { lane: "creator", stack: 1, kind: "shape-mobile-device", title: "YouTube Studio", eyebrow: "device", subtitle: "投稿 + 分析" })
  .node("youtube", { lane: "platform", stack: 0, kind: "shape-website", title: "YouTube platform", eyebrow: "distribution", subtitle: "algorithm ranking + 推薦" })
  .node("cdn", { lane: "platform", stack: 1, kind: "shape-cloud", title: "video CDN", eyebrow: "cdn", subtitle: "H.264/H.265 配信 · 全世界 edge" })
  .node("analytics", { lane: "platform", stack: 2, kind: "shape-cylinder", title: "YT analytics", eyebrow: "database", subtitle: "impression + click + watch time" })
  .node("viewers", { lane: "audience", stack: 0, kind: "shape-warehouse", title: "全世界視聴者", eyebrow: "audience", subtitle: "Rust / TS / React 学習者" })
  .edge("creator", "phone", { label: "アップロード", tone: "info" })
  .edge("phone", "youtube", { label: "publish", tone: "info" })
  .edge("youtube", "cdn", { label: "encode + 配信", tone: "success" })
  .edge("cdn", "viewers", { label: "stream", tone: "success" })
  .edge("viewers", "analytics", { label: "event", tone: "accent" })
  .edge("analytics", "youtube", { label: "ranking 反映", tone: "warning" })
  .readout.videoCard("vc", { source: "videos", max: 5, color: "#ef4444", label: "投稿動画 3 本" })
  .readout.gauge("ctrG", { source: "ctr", min: 0, max: 20, color: "#22c55e", label: "CTR %" })
  .readout.countup("viewCU", { source: "views", unit: " views", label: "動画 views", decimals: 0 })
  .readout.stat("subStat", { source: "subDelta", unit: " 名", caption: "登録者増加", label: "sub Δ" })
  .phase("p1", {
    duration: 1800,
    title: "企画",
    body: "石田様が 'React hooks explained' 動画企画、 台本作成。 ctr 0、 views 0、 subDelta 0、 creator + phone lane active。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone").set("ctr", 0).set("views", 0).set("subDelta", 0).badge("企画"))
  .phase("p2", {
    duration: 2000,
    title: "撮影 + 編集",
    body: "18 分の動画撮影 → 編集 → thumbnail 作成。 ctr 0、 views 0、 subDelta 0 保持、 phase 進行のみ (公開前は数値 0)。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone").badge("撮影"))
  .phase("p3", {
    duration: 2200,
    title: "公開 (24h)",
    body: "YouTube に publish、 推薦 algorithm に載る。 ctr 0 → 8 tween (gauge 針中位)、 views 0 → 25000 tween (countup 加速)、 subDelta 0 → 320 tween、 youtube + cdn + viewers lane activate。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "youtube", "cdn", "viewers").tween("ctr", 0, 8).tween("views", 0, 25000).tween("subDelta", 0, 320).badge("公開"))
  .phase("p4", {
    duration: 2000,
    title: "viral 拡散 (1 週間)",
    body: "trending 入りで views 急増、 登録者急伸。 ctr 8 → 14 tween (gauge 針最上位近く、 高 CTR)、 views 25000 → 156000 tween (countup dramatic)、 subDelta 320 → 1800 tween (1800 名登録)、 analytics lane activate、 6 shape 全 active、 viral 到達。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "youtube", "cdn", "viewers", "analytics").tween("ctr", 8, 14).tween("views", 25000, 156000).tween("subDelta", 320, 1800).badge("viral"))
  .build();

/**
 * 91. shippingOrderStatus v2 = EC 家具通販 (大型商品) の配送追跡 4 phase シナリオ (梱包 → 出荷 → 配達中 → 完了)、 shape-person + shape-mobile-device + shape-warehouse + shape-storefront + shape-satellite + shape-cloud の 6 shape で visual scene 化、 4 phase (梱包完了 → 出荷 → 配達中 → 配達完了) + 4 readout (orderStatus / gauge 進捗率 / countup 距離 km / stat ETA 分) が tween で visually 連続変化。 iteration 8 wave 8-E redesign。
 */
export const shippingOrderStatus = diagram("interactive-shipping-status", {
  topic: "EC 家具大型商品配送追跡 4 phase = (梱包 → 出荷 → 配達中 → 完了) の flow を shape-* primitive 6 種で表現 + 4 readout (orderStatus / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("origin", { x: 0, width: 240 })
  .lane("transit", { x: 260, width: 320 })
  .lane("destination", { x: 600, width: 240 })
  .arraySignal("steps", ["Packed", "Shipped", "Out for delivery", "Delivered"])
  .state("current", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("distanceKm", { initial: 0 })
  .state("etaMin", { initial: 0 })
  .node("warehouse", { lane: "origin", stack: 0, kind: "shape-warehouse", title: "配送 センター (川崎)", eyebrow: "origin", subtitle: "IKEA 大型家具在庫" })
  .node("dispatcher", { lane: "origin", stack: 1, kind: "shape-mobile-device", title: "配送指示 tablet", eyebrow: "device", subtitle: "route planner + 追跡" })
  .node("truck", { lane: "transit", stack: 0, kind: "shape-storefront", title: "配送トラック", eyebrow: "vehicle", subtitle: "route: 川崎 → 世田谷 (32 km)" })
  .node("gps", { lane: "transit", stack: 1, kind: "shape-satellite", title: "GPS tracking", eyebrow: "gps", subtitle: "1 分間隔位置更新" })
  .node("customerApp", { lane: "transit", stack: 2, kind: "shape-cloud", title: "顧客通知 (LINE)", eyebrow: "notification", subtitle: "step 遷移で自動通知" })
  .node("customer", { lane: "destination", stack: 0, kind: "shape-person", title: "顧客 中村様", eyebrow: "recipient", subtitle: "在宅受取 · サイン必要" })
  .edge("warehouse", "dispatcher", { label: "梱包完了", tone: "success" })
  .edge("dispatcher", "truck", { label: "load", tone: "info" })
  .edge("truck", "gps", { label: "expose 位置", tone: "success" })
  .edge("gps", "customerApp", { label: "位置 push", tone: "accent" })
  .edge("customerApp", "customer", { label: "到着通知", tone: "warning" })
  .edge("truck", "customer", { label: "配達", tone: "success" })
  .readout.orderStatus("os", { source: "current", stepsSource: "steps", color: "#2563eb", label: "配達 status (4 step)" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "配達進捗 %" })
  .readout.countup("distCU", { source: "distanceKm", unit: " km", label: "走行距離", decimals: 1 })
  .readout.stat("etaStat", { source: "etaMin", unit: " 分", caption: "到着まで", label: "ETA" })
  .phase("p1", {
    duration: 1800,
    title: "梱包完了",
    body: "配送センターで大型家具 (ソファ) 梱包完了、 出荷準備。 current = 0 (Packed)、 progress 0 → 10 tween、 distanceKm 0 tween 保持、 etaMin 0 → 90 tween (初期 ETA 表示)。 warehouse + dispatcher lane active。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher").set("current", 0).tween("progress", 0, 10).tween("etaMin", 0, 90).badge("梱包"))
  .phase("p2", {
    duration: 2200,
    title: "出荷 (truck 積載)",
    body: "trucks が家具を積載 → 発車。 current 0 → 1 tween (Packed → Shipped)、 progress 10 → 35 tween (gauge 針中位)、 distanceKm 0 → 8 tween (発進 8 km)、 etaMin 90 → 60 tween、 truck + gps lane activate。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps").tween("current", 0, 1).tween("progress", 10, 35).tween("distanceKm", 0, 8).tween("etaMin", 90, 60).badge("出荷"))
  .phase("p3", {
    duration: 2400,
    title: "配達中",
    body: "首都高速経由で世田谷へ向かう。 current 1 → 2 tween (Shipped → Out for delivery)、 progress 35 → 80 tween、 distanceKm 8 → 28 tween、 etaMin 60 → 12 tween (急接近)、 customerApp lane activate で「到着 15 分前通知」 push。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps", "customerApp").tween("current", 1, 2).tween("progress", 35, 80).tween("distanceKm", 8, 28).tween("etaMin", 60, 12).badge("配達中"))
  .phase("p4", {
    duration: 2000,
    title: "配達完了",
    body: "中村様宅到着、 玄関受取 + サイン。 current 2 → 3 tween (Out for delivery → Delivered)、 progress 80 → 100 tween (最終)、 distanceKm 28 → 32 tween (最終)、 etaMin 12 → 0 tween、 customer lane activate、 6 shape 全 active、 配達完了。",
  }, (p: PhaseBuilder) => p.activate("warehouse", "dispatcher", "truck", "gps", "customerApp", "customer").tween("current", 2, 3).tween("progress", 80, 100).tween("distanceKm", 28, 32).tween("etaMin", 12, 0).badge("完了"))
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
  .node("alice", { lane: "members", stack: 0, kind: "shape-person", title: "Alice (frontend)", eyebrow: "member", subtitle: "Tokyo · 4/5 出勤 (Thu 休)" })
  .node("bob", { lane: "members", stack: 1, kind: "shape-person", title: "Bob (backend)", eyebrow: "member", subtitle: "Osaka · 4/5 出勤 (Tue 休)" })
  .node("carol", { lane: "members", stack: 2, kind: "shape-person", title: "Carol (design)", eyebrow: "member", subtitle: "Fukuoka · 3/5 出勤 (Mon/Fri 休)" })
  .node("dan", { lane: "members", stack: 3, kind: "shape-person", title: "Dan (DevOps)", eyebrow: "member", subtitle: "Sapporo · 5/5 皆勤" })
  .node("attendanceApp", { lane: "system", stack: 0, kind: "shape-mobile-device", title: "打刻 mobile app", eyebrow: "device", subtitle: "GPS 位置 + timestamp 送信" })
  .node("payroll", { lane: "finance", stack: 0, kind: "shape-server-rack", title: "給与計算 system", eyebrow: "backend", subtitle: "月次 rollup · 支給額算出" })
  .edge("alice", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("bob", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("carol", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("dan", "attendanceApp", { label: "打刻", tone: "info" })
  .edge("attendanceApp", "payroll", { label: "週次 rollup", tone: "success" })
  .readout.attendanceGrid("ag", { source: "attendance", membersSource: "teamMembers", color: "#22c55e", label: "5 day × 4 member grid" })
  .readout.gauge("rateG", { source: "rate", min: 0, max: 100, color: "#22c55e", label: "週次出勤率 %" })
  .readout.countup("daysCU", { source: "totalDays", unit: " 日", label: "累計出勤日", decimals: 0 })
  .readout.stat("perfectStat", { source: "perfectCount", unit: " 名", caption: "皆勤者", label: "perfect" })
  .phase("p1", {
    duration: 1800,
    title: "月曜開始",
    body: "月曜 09:00、 4 名中 3 名打刻 (Carol 休)、 grid に緑 3 · 赤 1。 rate 0 → 75 tween (gauge 針が緑域上位)、 totalDays 0 → 3 tween、 perfectCount 0 (途中判定なし)、 members lane full + app active。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp").tween("rate", 0, 75).tween("totalDays", 0, 3).badge("Mon"))
  .phase("p2", {
    duration: 2200,
    title: "中間確認 (水)",
    body: "水曜まで、 Tue: Bob 休、 Wed: 全員出勤で total 累積 3+3+4 = 10 日。 rate 75 → 83 tween、 totalDays 3 → 10 tween (countup 加速)、 perfectCount 0 → 1 tween (Dan 暫定皆勤、 stat 表示)。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp").tween("rate", 75, 83).tween("totalDays", 3, 10).tween("perfectCount", 0, 1).badge("Wed"))
  .phase("p3", {
    duration: 2200,
    title: "週末集計 (金)",
    body: "Thu: Alice 休、 Fri: Carol 休 → 週次確定。 rate 83 → 80 tween (最終 16/20 = 80%)、 totalDays 10 → 16 tween (countup 最終)、 perfectCount 1 保持 (Dan のみ皆勤)、 attendance grid 完成。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp").tween("rate", 83, 80).tween("totalDays", 10, 16).badge("Fri"))
  .phase("p4", {
    duration: 2000,
    title: "給与連携",
    body: "月曜 payroll system に週次 rollup 送信、 皆勤 Dan にボーナス reflect。 rate 保持、 totalDays 保持、 perfectCount 1 保持、 payroll lane activate、 6 shape 全 active、 給与計算完遂。",
  }, (p: PhaseBuilder) => p.activate("alice", "bob", "carol", "dan", "attendanceApp", "payroll").set("rate", 80).badge("給与"))
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
  .readout.timezoneClock("tc", { source: "clocks", color: "#2563eb", label: "Cities (4-column grid)" })
  .phase("p", {
    duration: 1200,
    title: "city timezone split",
    body: "4-lane (Tokyo UTC+9 / London UTC±0 / NYC UTC-5 / Sydney UTC+11) で 4 city timezone を都市別分散、 各 city 個別 card で time + UTC offset 明示、 timezoneClock readout も併存で 4 column grid 表示、 city 分類と clock 一覧の 2 経路 view。",
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
  .node("emailNode", { lane: "contact", stack: 0, kind: "card", title: "Email", subtitle: "alice@example.com" })
  .node("countryNode", { lane: "contact", stack: 1, kind: "card", title: "Country", subtitle: "Japan" })
  .node("newsletterNode", { lane: "prefs", stack: 0, kind: "card", title: "Newsletter", subtitle: "Yes (opt-in)" })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "Submission (dl/dt/dd)" })
  .phase("p", {
    duration: 1200,
    title: "form category split",
    body: "3-lane (Personal Name+Age / Contact Email+Country / Prefs Newsletter) で 5 field を semantic 分類、 各 field 個別 card で key/value 明示、 formSummary readout も併存で dl/dt/dd 表示、 field 分類と summary の 2 経路 view。",
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
  .input.stepper("cur", { min: 0, max: 4, defaultValue: 1, label: "Current index" })
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
  .node("song3", { lane: "next", stack: 1, kind: "card", title: "Sweet Child O' Mine", subtitle: "Guns N' Roses · 5:56" })
  .node("song4", { lane: "next", stack: 2, kind: "card", title: "Imagine", subtitle: "John Lennon · 3:03" })
  .readout.songQueue("sq", { source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "Queue (current highlight)" })
  .phase("p", {
    duration: 1200,
    title: "playback split",
    body: "3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。",
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
  topic: "PM 月次スケジューリング (Q1 launch 前月) 4 phase = (計画 → 中間 → 週次 → 振返り) の flow を shape-* primitive 6 種で表現 + 4 readout (calendarMonth / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("pm", { x: 0, width: 220 })
  .lane("system", { x: 240, width: 320 })
  .lane("delivery", { x: 580, width: 220 })
  .arraySignal("days", generateCalendarDays())
  .state("fillRate", { initial: 0 })
  .state("doneEvents", { initial: 0 })
  .state("remainingEvents", { initial: 6 })
  .node("pm", { lane: "pm", stack: 0, kind: "shape-person", title: "PM 佐藤様", eyebrow: "manager", subtitle: "Q1 SaaS launch 前月" })
  .node("mobile", { lane: "pm", stack: 1, kind: "shape-mobile-device", title: "Calendar app", eyebrow: "device", subtitle: "予定確認 + reschedule" })
  .node("gcal", { lane: "system", stack: 0, kind: "shape-cloud", title: "Google Calendar", eyebrow: "calendar", subtitle: "team 予定 sync · 招待自動" })
  .node("db", { lane: "system", stack: 1, kind: "shape-cylinder", title: "event DB", eyebrow: "storage", subtitle: "milestone + review 記録" })
  .node("gateway", { lane: "system", stack: 2, kind: "shape-server-rack", title: "Zapier hub", eyebrow: "integration", subtitle: "Slack + Jira 連動" })
  .node("release", { lane: "delivery", stack: 0, kind: "shape-hexagon", title: "Q1 launch", eyebrow: "milestone", subtitle: "1/31 予定 · 全 event 集約" })
  .edge("pm", "mobile", { label: "予定管理", tone: "info" })
  .edge("mobile", "gcal", { label: "sync", tone: "info" })
  .edge("gcal", "db", { label: "永続化", tone: "success" })
  .edge("db", "gateway", { label: "trigger", tone: "accent" })
  .edge("gateway", "release", { label: "launch 準備", tone: "warning" })
  .readout.calendarMonth("cm", { source: "days", monthName: "2026 年 1 月", color: "#2563eb", label: "月間予定 view" })
  .readout.gauge("fillG", { source: "fillRate", min: 0, max: 100, color: "#22c55e", label: "予定埋まり率 %" })
  .readout.countup("doneCU", { source: "doneEvents", unit: " 件", label: "完了 event", decimals: 0 })
  .readout.stat("remStat", { source: "remainingEvents", unit: " 件", caption: "残 event", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "月初計画",
    body: "1/1 佐藤様が 1 月の event 6 件を Google Calendar に登録 (Jan 3/8/12/17/22/26)。 fillRate 0 → 25 tween、 doneEvents 0、 remainingEvents 6 保持、 pm + gcal lane active。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal").tween("fillRate", 0, 25).set("doneEvents", 0).set("remainingEvents", 6).badge("計画"))
  .phase("p2", {
    duration: 2200,
    title: "中間確認 (1/13 today)",
    body: "月中旬に進捗確認、 2 件完了 (Jan 3, 8)。 fillRate 25 → 50 tween、 doneEvents 0 → 2 tween (countup 加算)、 remainingEvents 6 → 4 tween (stat 減少)、 db lane activate、 calendar に today (13 日) highlight。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db").tween("fillRate", 25, 50).tween("doneEvents", 0, 2).tween("remainingEvents", 6, 4).badge("中間"))
  .phase("p3", {
    duration: 2200,
    title: "週次 review (1/22)",
    body: "第 3 週 review、 Jan 12/17 追加完了で 4 件済。 fillRate 50 → 75 tween、 doneEvents 2 → 4 tween、 remainingEvents 4 → 2 tween (Jan 22/26 のみ残)、 gateway lane activate、 Slack / Jira 連動。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db", "gateway").tween("fillRate", 50, 75).tween("doneEvents", 2, 4).tween("remainingEvents", 4, 2).badge("週次"))
  .phase("p4", {
    duration: 2000,
    title: "月末振返り (1/31 launch)",
    body: "1/31 に全 6 event 完遂 → Q1 launch。 fillRate 75 → 100 tween (gauge 針最上位)、 doneEvents 4 → 6 tween (countup 最終)、 remainingEvents 2 → 0 tween (stat 空)、 release lane activate、 6 shape 全 active、 launch 到達。",
  }, (p: PhaseBuilder) => p.activate("pm", "mobile", "gcal", "db", "gateway", "release").tween("fillRate", 75, 100).tween("doneEvents", 4, 6).tween("remainingEvents", 2, 0).badge("振返り"))
  .build();

/**
 * 97. cliTerminalSession v2 = 開発者 朝の start-up ritual 4 phase シナリオ (repo 更新 → status 確認 → test 実行 → container 起動)、 shape-person + shape-mobile-device + shape-terminal + shape-server-rack + shape-gear + shape-cloud の 6 shape で visual scene 化、 4 phase (repo 更新 → git status → pnpm test → docker up) + 4 readout (terminal / gauge 環境準備度 / countup 実行 cmd 数 / stat 起動時間) が tween で visually 連続変化。 iteration 8 wave 8-G redesign。
 */
export const cliTerminalSession = diagram("interactive-cli-terminal", {
  topic: "開発者朝 CLI ritual 4 phase = (repo 更新 → status → test → docker) の flow を shape-* primitive 6 種で表現 + 4 readout (terminal / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "developer 塩見様", eyebrow: "engineer", subtitle: "09:00 開発準備開始" })
  .node("laptop", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "MacBook Pro", eyebrow: "device", subtitle: "M3 Max · macOS Sonoma" })
  .node("terminal", { lane: "system", stack: 0, kind: "shape-terminal", title: "iTerm2 session", eyebrow: "shell", subtitle: "zsh + Oh My Zsh" })
  .node("repoServer", { lane: "system", stack: 1, kind: "shape-server-rack", title: "GitHub SSH", eyebrow: "vcs", subtitle: "git pull で最新反映" })
  .node("engine", { lane: "system", stack: 2, kind: "shape-gear", title: "pnpm engine", eyebrow: "runtime", subtitle: "workspace 依存解決" })
  .node("docker", { lane: "service", stack: 0, kind: "shape-cloud", title: "Docker Desktop", eyebrow: "container", subtitle: "local 開発 stack 3 container" })
  .edge("dev", "laptop", { label: "操作", tone: "info" })
  .edge("laptop", "terminal", { label: "shell 起動", tone: "info" })
  .edge("terminal", "repoServer", { label: "git pull", tone: "success" })
  .edge("terminal", "engine", { label: "pnpm exec", tone: "accent" })
  .edge("terminal", "docker", { label: "docker up", tone: "success" })
  .readout.terminal("tm", { source: "cmds", max: 10, color: "#22c55e", label: "shell session (CLI)" })
  .readout.gauge("readyG", { source: "readiness", min: 0, max: 100, color: "#22c55e", label: "環境準備度 %" })
  .readout.countup("cmdCU", { source: "cmdCount", unit: " 件", label: "実行 cmd", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedSec", unit: " 秒", caption: "起動から", label: "elapsed" })
  .phase("p1", {
    duration: 1800,
    title: "repo 更新 (ls + cd)",
    body: "塩見様が terminal 起動 → 作業 dir 移動。 readiness 0 → 15 tween、 cmdCount 0 → 2 tween (ls + cd)、 elapsedSec 0 → 5 tween、 dev + laptop + terminal lane active。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal").tween("readiness", 0, 15).tween("cmdCount", 0, 2).tween("elapsedSec", 0, 5).badge("repo"))
  .phase("p2", {
    duration: 2200,
    title: "git status (clean 確認)",
    body: "git status で main branch clean 確認、 SSH 経由で GitHub から latest 反映。 readiness 15 → 45 tween、 cmdCount 2 → 3 tween、 elapsedSec 5 → 15 tween、 repoServer lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer").tween("readiness", 15, 45).tween("cmdCount", 2, 3).tween("elapsedSec", 5, 15).badge("git"))
  .phase("p3", {
    duration: 2400,
    title: "pnpm test (verify 走行)",
    body: "全 114 test file 実行、 1649 test pass。 readiness 45 → 75 tween、 cmdCount 3 → 4 tween、 elapsedSec 15 → 90 tween (verify に 75s)、 engine lane activate、 pnpm workspace 依存解決。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer", "engine").tween("readiness", 45, 75).tween("cmdCount", 3, 4).tween("elapsedSec", 15, 90).badge("test"))
  .phase("p4", {
    duration: 2000,
    title: "docker up (local stack)",
    body: "docker-compose up で local stack 起動、 3 container ready。 readiness 75 → 100 tween (gauge 針最上位、 開発可能)、 cmdCount 4 → 5 tween (最終)、 elapsedSec 90 → 130 tween、 docker lane activate、 6 shape 全 active、 開発環境 ready。",
  }, (p: PhaseBuilder) => p.activate("dev", "laptop", "terminal", "repoServer", "engine", "docker").tween("readiness", 75, 100).tween("cmdCount", 4, 5).tween("elapsedSec", 90, 130).badge("docker"))
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
  .node("blackBackNode", { lane: "blackBack", stack: 0, kind: "card", title: "Black back (rank 8)", subtitle: "♜♞♝♛♚♝♞♜ · 8 pieces" })
  .node("blackPawnNode", { lane: "blackPawn", stack: 0, kind: "card", title: "Black pawns (rank 7)", subtitle: "♟×8" })
  .node("whitePawnNode", { lane: "whitePawn", stack: 0, kind: "card", title: "White pawns (rank 2)", subtitle: "♙×8" })
  .node("whiteBackNode", { lane: "whiteBack", stack: 0, kind: "card", title: "White back (rank 1)", subtitle: "♖♘♗♕♔♗♘♖ · 8 pieces" })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "Position (8×8 board)" })
  .phase("p", {
    duration: 1200,
    title: "chess rank split",
    body: "4-lane (Black back rank 8 / Black pawns rank 7 / White pawns rank 2 / White back rank 1) で 32 piece を rank 別分散、 各 rank 個別 card で piece 明示、 chessBoard readout も併存で 8×8 board 表示、 rank 分類と board 全体観の 2 経路 view。",
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
  .node("scrum", { lane: "team", stack: 0, kind: "shape-person", title: "スクラムマスター 井上様", eyebrow: "role", subtitle: "daily stand-up 主催" })
  .node("tablet", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "Jira mobile", eyebrow: "device", subtitle: "sprint board 確認" })
  .node("todoStack", { lane: "board", stack: 0, kind: "shape-kanban-card", title: "Todo column", eyebrow: "state", subtitle: "backlog · 2 task 残" })
  .node("progressStack", { lane: "board", stack: 1, kind: "shape-kanban-card", title: "In Progress", eyebrow: "state", subtitle: "WIP limit 3 · 2 task 進行中" })
  .node("doneStack", { lane: "board", stack: 2, kind: "shape-kanban-card", title: "Done column", eyebrow: "state", subtitle: "完了 {doneCount} task" })
  .node("api", { lane: "metrics", stack: 0, kind: "shape-server-rack", title: "Jira API", eyebrow: "backend", subtitle: "burndown chart 生成 · velocity 集計" })
  .edge("scrum", "tablet", { label: "確認", tone: "info" })
  .edge("tablet", "api", { label: "GET /sprint", tone: "info" })
  .edge("todoStack", "progressStack", { label: "pull", tone: "warning" })
  .edge("progressStack", "doneStack", { label: "complete", tone: "success" })
  .edge("doneStack", "api", { label: "velocity 記録", tone: "accent" })
  .readout.kanbanBoard("kb", { source: "tasks", columnWidth: 150, max: 5, label: "sprint kanban 3 列" })
  .readout.gauge("burndownG", { source: "burndown", min: 0, max: 100, color: "#22c55e", label: "消化率 %" })
  .readout.countup("doneCU", { source: "doneCount", unit: " task", label: "完了 task", decimals: 0 })
  .readout.stat("velStat", { source: "velocity", unit: " pt/wk", caption: "velocity", label: "velocity" })
  .phase("p1", {
    duration: 2000,
    title: "sprint start (day 1)",
    body: "sprint planning 完了、 6 task backlog に投入、 うち 2 task done (bootstrap)。 burndown 0 → 33 tween (gauge 針が緑域下位)、 doneCount 0 → 2 tween (setup 完了分)、 velocity 0 (初日未算出)、 team + Todo column active。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack").tween("burndown", 0, 33).tween("doneCount", 0, 2).badge("start"))
  .phase("p2", {
    duration: 2400,
    title: "daily (day 3)",
    body: "daily stand-up、 Impl auth flow / Migration script を In Progress へ pull。 burndown 33 → 50 tween、 doneCount 2 → 2 保持 (WIP 中)、 velocity 0 → 6 tween (stat 表示)、 progressStack lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack").tween("burndown", 33, 50).tween("velocity", 0, 6).badge("day 3"))
  .phase("p3", {
    duration: 2200,
    title: "daily (day 7)",
    body: "折り返し review、 Impl auth flow 完了で Done に move。 burndown 50 → 75 tween、 doneCount 2 → 3 tween (countup 加算)、 velocity 6 → 9 tween、 doneStack lane activate、 api 経由 metric 集計。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack", "doneStack", "api").tween("burndown", 50, 75).tween("doneCount", 2, 3).tween("velocity", 6, 9).badge("day 7"))
  .phase("p4", {
    duration: 2000,
    title: "sprint 完了 (day 14)",
    body: "全 6 task 完遂、 sprint retro 実施。 burndown 75 → 100 tween (gauge 針最上位)、 doneCount 3 → 6 tween (countup 最終、 全 task done)、 velocity 9 → 12 tween、 6 shape 全 active、 next sprint plan へ。",
  }, (p: PhaseBuilder) => p.activate("scrum", "tablet", "todoStack", "progressStack", "doneStack", "api").tween("burndown", 75, 100).tween("doneCount", 3, 6).tween("velocity", 9, 12).badge("完了"))
  .build();

/**
 * 101. docsBreadcrumb v2 = 新人エンジニア OSS docs 学習 4 phase シナリオ (入口 → docs 一覧 → API 詳細 → Reference 深掘り)、 shape-person + shape-mobile-device + shape-website × 2 + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Home 到着 → docs section → API page → Reference 深掘り) + 4 readout (breadcrumb / gauge 学習進度 / countup 訪問 page 数 / stat 滞在分) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const docsBreadcrumb = diagram("interactive-docs-breadcrumb", {
  topic: "新人 OSS docs 学習 4 phase = (Home → Docs → API → Reference) の flow を shape-* primitive 6 種で表現 + 4 readout (breadcrumb / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("newbie", { x: 0, width: 220 })
  .lane("docsSite", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("path", ["Home", "Docs", "API", "Reference"])
  .state("cur", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("pageCount", { initial: 0 })
  .state("dwellMin", { initial: 0 })
  .node("newbie", { lane: "newbie", stack: 0, kind: "shape-person", title: "新人 岸田様", eyebrow: "learner", subtitle: "OSS 初触りエンジニア" })
  .node("laptop", { lane: "newbie", stack: 1, kind: "shape-mobile-device", title: "Chrome browser", eyebrow: "device", subtitle: "docs tab 複数開き + 履歴" })
  .node("home", { lane: "docsSite", stack: 0, kind: "shape-website", title: "docs Home", eyebrow: "landing", subtitle: "product overview + Getting Started" })
  .node("apiPage", { lane: "docsSite", stack: 1, kind: "shape-website", title: "API リファレンス page", eyebrow: "api", subtitle: "endpoint 一覧 + interactive playground" })
  .node("cdn", { lane: "docsSite", stack: 2, kind: "shape-cloud", title: "docs CDN", eyebrow: "cdn", subtitle: "Vercel edge 配信 · caching" })
  .node("bookmarks", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "browser bookmark", eyebrow: "storage", subtitle: "頻用 page 保存 · 学習資産" })
  .edge("newbie", "laptop", { label: "検索", tone: "info" })
  .edge("laptop", "home", { label: "GET /", tone: "info" })
  .edge("home", "apiPage", { label: "navigate", tone: "success" })
  .edge("apiPage", "cdn", { label: "asset load", tone: "accent" })
  .edge("apiPage", "bookmarks", { label: "★ 保存", tone: "success" })
  .readout.breadcrumb("bc", { source: "path", currentSource: "cur", color: "#2563eb", label: "navigation breadcrumb" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "学習進度 %" })
  .readout.countup("pageCU", { source: "pageCount", unit: " page", label: "訪問 page", decimals: 0 })
  .readout.stat("dwellStat", { source: "dwellMin", unit: " 分", caption: "滞在時間", label: "dwell" })
  .phase("p1", {
    duration: 1800,
    title: "Home 到着",
    body: "岸田様が Google 検索から docs Home 到着。 cur = 0 (Home)、 progress 0 → 15 tween、 pageCount 0 → 1 tween、 dwellMin 0 → 3 tween、 newbie + laptop + home lane active。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home").set("cur", 0).tween("progress", 0, 15).tween("pageCount", 0, 1).tween("dwellMin", 0, 3).badge("Home"))
  .phase("p2", {
    duration: 2200,
    title: "docs section 移動",
    body: "Getting Started 読了 → Docs section へ。 cur 0 → 1 tween (breadcrumb 更新)、 progress 15 → 40 tween、 pageCount 1 → 5 tween、 dwellMin 3 → 12 tween、 引き続き docsSite lane 内で滞在。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home").tween("cur", 0, 1).tween("progress", 15, 40).tween("pageCount", 1, 5).tween("dwellMin", 3, 12).badge("Docs"))
  .phase("p3", {
    duration: 2200,
    title: "API page 到達",
    body: "API リファレンス到達、 endpoint 一覧確認 + interactive playground 試行。 cur 1 → 2 tween、 progress 40 → 68 tween、 pageCount 5 → 12 tween、 dwellMin 12 → 28 tween、 apiPage + cdn lane activate。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "apiPage", "cdn").tween("cur", 1, 2).tween("progress", 40, 68).tween("pageCount", 5, 12).tween("dwellMin", 12, 28).badge("API"))
  .phase("p4", {
    duration: 2000,
    title: "Reference 深掘り + bookmark",
    body: "Reference で全 endpoint 詳細確認 + 頻用 page 5 個 bookmark。 cur 2 → 3 tween (Reference)、 progress 68 → 92 tween (gauge 針最上位近く)、 pageCount 12 → 18 tween、 dwellMin 28 → 45 tween、 bookmarks lane activate、 6 shape 全 active、 学習資産構築。",
  }, (p: PhaseBuilder) => p.activate("newbie", "laptop", "home", "apiPage", "cdn", "bookmarks").tween("cur", 2, 3).tween("progress", 68, 92).tween("pageCount", 12, 18).tween("dwellMin", 28, 45).badge("Reference"))
  .build();

/**
 * 102. dayScheduleTimeline v2 = エンジニアリング マネージャー 1 日 4 phase シナリオ (朝の standup → 設計 review → deploy → 夜の retro)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-hexagon + shape-cloud の 6 shape で visual scene 化、 4 phase (Morning standup → Afternoon deploy → 1-on-1 → Evening retro) + 4 readout (timelineVertical / gauge task 消化率 / countup 参加会議数 / stat 残 task) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const dayScheduleTimeline = diagram("interactive-day-schedule", {
  topic: "エンジニアリング マネージャー 1 日 4 phase = (朝 standup → 設計 → deploy → 夜 retro) の flow を shape-* primitive 6 種で表現 + 4 readout (timelineVertical / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("manager", { lane: "manager", stack: 0, kind: "shape-person", title: "EM 大西様", eyebrow: "manager", subtitle: "8 名チームリード" })
  .node("laptop", { lane: "manager", stack: 1, kind: "shape-mobile-device", title: "MacBook + Google Cal", eyebrow: "device", subtitle: "5 event 予定 + Slack" })
  .node("meetingRoom", { lane: "work", stack: 0, kind: "shape-website", title: "Zoom / meeting room", eyebrow: "meeting", subtitle: "standup + design review + 1-on-1" })
  .node("staging", { lane: "work", stack: 1, kind: "shape-server-rack", title: "staging deploy", eyebrow: "ops", subtitle: "v1.2.0 rollout · pre-production" })
  .node("retroBoard", { lane: "work", stack: 2, kind: "shape-hexagon", title: "Miro retro board", eyebrow: "retro", subtitle: "sprint 42 振返り + アクション" })
  .node("summary", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "日次 summary", eyebrow: "log", subtitle: "Notion に成果 + 課題記録" })
  .edge("manager", "laptop", { label: "予定確認", tone: "info" })
  .edge("laptop", "meetingRoom", { label: "参加", tone: "info" })
  .edge("meetingRoom", "staging", { label: "承認 → deploy", tone: "success" })
  .edge("staging", "retroBoard", { label: "review", tone: "accent" })
  .edge("retroBoard", "summary", { label: "記録", tone: "success" })
  .readout.timelineVertical("tv", { source: "events", color: "#2563eb", max: 8, label: "1 日 5 event" })
  .readout.gauge("progG", { source: "taskDone", min: 0, max: 100, color: "#22c55e", label: "task 消化率 %" })
  .readout.countup("meetCU", { source: "meetingCount", unit: " 件", label: "参加会議", decimals: 0 })
  .readout.stat("remStat", { source: "taskRemain", unit: " 件", caption: "残 task", label: "残" })
  .phase("p1", {
    duration: 1800,
    title: "Morning standup (09:00)",
    body: "大西様が Zoom standup 主催、 8 名で 15 分 sync。 taskDone 0 → 20 tween、 meetingCount 0 → 1 tween、 taskRemain 5 → 4 tween、 manager + meetingRoom lane active。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom").tween("taskDone", 0, 20).tween("meetingCount", 0, 1).tween("taskRemain", 5, 4).badge("Standup"))
  .phase("p2", {
    duration: 2200,
    title: "Design review + Deploy (10:30-14:00)",
    body: "3 proposals review → 承認 → v1.2.0 staging deploy。 taskDone 20 → 55 tween、 meetingCount 1 → 2 tween、 taskRemain 4 → 2 tween、 staging lane activate。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging").tween("taskDone", 20, 55).tween("meetingCount", 1, 2).tween("taskRemain", 4, 2).badge("Deploy"))
  .phase("p3", {
    duration: 2200,
    title: "1-on-1 + Retro (16:00-19:30)",
    body: "member との career 1-on-1 → sprint 42 retro 主催。 taskDone 55 → 85 tween、 meetingCount 2 → 4 tween、 taskRemain 2 → 1 tween、 retroBoard lane activate、 Miro で振返り。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging", "retroBoard").tween("taskDone", 55, 85).tween("meetingCount", 2, 4).tween("taskRemain", 2, 1).badge("Retro"))
  .phase("p4", {
    duration: 2000,
    title: "日次 summary 記録",
    body: "22:00 帰宅前に Notion で 1 日成果 + 明日 task 準備。 taskDone 85 → 100 tween (gauge 針最上位)、 meetingCount 4 → 5 tween (最終)、 taskRemain 1 → 0 tween (stat 空)、 summary lane activate、 6 shape 全 active、 1 日完遂。",
  }, (p: PhaseBuilder) => p.activate("manager", "laptop", "meetingRoom", "staging", "retroBoard", "summary").tween("taskDone", 85, 100).tween("meetingCount", 4, 5).tween("taskRemain", 1, 0).badge("summary"))
  .build();

/**
 * 103. status-timeline = server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存。
 * iteration 6 wave 3、 pattern taxonomy § 4 pipeline flow + § 1 state-based split。
 */
export const serverUptimeStatus = diagram("interactive-server-uptime", {
  topic: "server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存",
})
  .lane("active", { x: 0, width: 240 })
  .lane("idle", { x: 280, width: 240 })
  .lane("error", { x: 560, width: 240 })
  .arraySignal("events", [
    ["09:00", "active"],
    ["09:15", "active"],
    ["10:30", "idle"],
    ["11:00", "error"],
    ["11:15", "active"],
    ["12:00", "active"],
  ] as unknown as (string | number)[])
  .node("activeCard", { lane: "active", stack: 0, kind: "card", title: "Active (4 events)", subtitle: "09:00 / 09:15 / 11:15 / 12:00 · green" })
  .node("idleCard", { lane: "idle", stack: 0, kind: "card", title: "Idle (1)", subtitle: "10:30 · gray" })
  .node("errorCard", { lane: "error", stack: 0, kind: "card", title: "Error (1)", subtitle: "11:00 · red" })
  .readout.statusTimeline("st", { source: "events", max: 8, label: "Server status" })
  .phase("p", {
    duration: 1200,
    title: "server status split",
    body: "3-lane (Active / Idle / Error) で 6 event を status 別分散、 statusTimeline readout も併存で strip 表示、 uptime monitoring 定番の pattern taxonomy 交差事例。",
  }, (p: PhaseBuilder) => p.activate("activeCard", "idleCard", "errorCard").badge("uptime"))
  .build();

/**
 * 104. weekCalendarView v2 = フリーランス デザイナーの週次予定管理 4 phase シナリオ (月曜計画 → 中盤商談 → 週末納品 → 集計)、 shape-person + shape-mobile-device + shape-online-shop + shape-website + shape-brokerage + shape-cylinder の 6 shape で visual scene 化、 4 phase (月曜計画 → 水曜商談 → 金曜納品 → 土日集計) + 4 readout (calendarWeek / gauge 稼働率 / countup work hours / stat 週次収入) が tween で visually 連続変化。 iteration 8 wave 8-I redesign。
 */
export const weekCalendarView = diagram("interactive-week-calendar", {
  topic: "フリーランス デザイナー週次予定管理 4 phase = (月曜 → 水曜 → 金曜 → 土日) の flow を shape-* primitive 6 種で表現 + 4 readout (calendarWeek / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("designer", { lane: "freelancer", stack: 0, kind: "shape-person", title: "デザイナー 早見様", eyebrow: "freelance", subtitle: "UI/UX 個人事業主" })
  .node("phone", { lane: "freelancer", stack: 1, kind: "shape-mobile-device", title: "iCloud Calendar", eyebrow: "device", subtitle: "予定管理 + 請求書 draft" })
  .node("clientA", { lane: "clients", stack: 0, kind: "shape-online-shop", title: "client A (SaaS)", eyebrow: "b2b", subtitle: "月曜 kickoff MTG · project 開始" })
  .node("clientB", { lane: "clients", stack: 1, kind: "shape-website", title: "client B (EC)", eyebrow: "b2b", subtitle: "水曜商談 + 金曜納品" })
  .node("agency", { lane: "clients", stack: 2, kind: "shape-brokerage", title: "紹介 agency", eyebrow: "broker", subtitle: "新規案件紹介元" })
  .node("invoice", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "請求書 DB", eyebrow: "invoicing", subtitle: "月末請求書生成用データ蓄積" })
  .edge("designer", "phone", { label: "予定確認", tone: "info" })
  .edge("phone", "clientA", { label: "月曜 MTG", tone: "success" })
  .edge("phone", "clientB", { label: "水曜商談", tone: "success" })
  .edge("agency", "designer", { label: "新規案件", tone: "accent" })
  .edge("clientA", "invoice", { label: "作業 log", tone: "success" })
  .edge("clientB", "invoice", { label: "納品 log", tone: "success" })
  .readout.calendarWeek("cw", { source: "week", cellSize: 40, color: "#2563eb", label: "今週予定" })
  .readout.gauge("rateG", { source: "workRate", min: 0, max: 100, color: "#22c55e", label: "週次稼働率 %" })
  .readout.countup("hoursCU", { source: "workHours", unit: " h", label: "作業時間", decimals: 0 })
  .readout.stat("revStat", { source: "revenue", unit: "k$", caption: "週次収入", label: "収入" })
  .phase("p1", {
    duration: 1800,
    title: "月曜計画 + kickoff",
    body: "早見様が iCloud で今週予定確認、 client A の kickoff MTG 参加。 workRate 0 → 15 tween、 workHours 0 → 4 tween、 revenue 0 → 8 tween、 freelancer + clientA lane active。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA").tween("workRate", 0, 15).tween("workHours", 0, 4).tween("revenue", 0, 8).badge("月曜"))
  .phase("p2", {
    duration: 2200,
    title: "水曜商談 + 集中作業",
    body: "水曜 client B と商談 + Figma 集中作業。 workRate 15 → 55 tween、 workHours 4 → 22 tween (countup 加速)、 revenue 8 → 28 tween、 clientB lane activate。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB").tween("workRate", 15, 55).tween("workHours", 4, 22).tween("revenue", 8, 28).badge("商談"))
  .phase("p3", {
    duration: 2200,
    title: "金曜納品",
    body: "client B に UI 最終納品、 検収完了。 workRate 55 → 82 tween、 workHours 22 → 38 tween、 revenue 28 → 52 tween (納品完了で入金確定)、 agency lane activate、 新規案件も紹介入り。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB", "agency").tween("workRate", 55, 82).tween("workHours", 22, 38).tween("revenue", 28, 52).badge("納品"))
  .phase("p4", {
    duration: 2000,
    title: "土日集計 + 請求書 draft",
    body: "土日で作業 log 集計 + 請求書 draft、 来週準備。 workRate 82 → 95 tween (gauge 針最上位)、 workHours 38 → 42 tween、 revenue 52 → 58 tween (最終)、 invoice lane activate、 6 shape 全 active、 週次完遂。",
  }, (p: PhaseBuilder) => p.activate("designer", "phone", "clientA", "clientB", "agency", "invoice").tween("workRate", 82, 95).tween("workHours", 38, 42).tween("revenue", 52, 58).badge("集計"))
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
  .node("leadA", { lane: "teamA", stack: 0, kind: "shape-person", title: "Team A lead 田中様", eyebrow: "frontend", subtitle: "React / Next.js 開発" })
  .node("appA", { lane: "teamA", stack: 1, kind: "shape-mobile-device", title: "Jira board A", eyebrow: "board", subtitle: "velocity {scoreA} pt/sprint" })
  .node("jira", { lane: "shared", stack: 0, kind: "shape-server-rack", title: "Jira platform", eyebrow: "system", subtitle: "sprint velocity 集計" })
  .node("dwh", { lane: "shared", stack: 1, kind: "shape-cylinder", title: "分析 DWH", eyebrow: "warehouse", subtitle: "四半期 rollup · 累計 {totalPoints} pt" })
  .node("dashboard", { lane: "shared", stack: 2, kind: "shape-cloud", title: "Grafana board", eyebrow: "dashboard", subtitle: "team 対比表示" })
  .node("leadB", { lane: "teamB", stack: 0, kind: "shape-person", title: "Team B lead 佐藤様", eyebrow: "backend", subtitle: "Go / gRPC 開発" })
  .edge("leadA", "appA", { label: "operate", tone: "info" })
  .edge("appA", "jira", { label: "sprint 記録", tone: "info" })
  .edge("leadB", "jira", { label: "sprint 記録", tone: "info" })
  .edge("jira", "dwh", { label: "rollup", tone: "success" })
  .edge("dwh", "dashboard", { label: "対比表示", tone: "accent" })
  .readout.kpiComparison("kc", { source: "teams", max: 100, colorA: "#2563eb", colorB: "#f97316", label: "sprint velocity 対比" })
  .readout.gauge("diffG", { source: "diffPct", min: 0, max: 50, color: "#22c55e", label: "A vs B 差 %" })
  .readout.countup("totalCU", { source: "totalPoints", unit: " pt", label: "四半期累計 pt", decimals: 0 })
  .readout.stat("winStat", { source: "scoreA", unit: " pt", caption: "Team A velocity", label: "A" })
  .phase("p1", {
    duration: 1800,
    title: "期首計測",
    body: "四半期開始、 前期実績値で計測。 scoreA 0 → 62 tween、 scoreB 0 → 55 tween (両 team 立ち上がり)、 diffPct 0 → 13 tween (A リード)、 totalPoints 0 → 117 tween。 team lane full active。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB").tween("scoreA", 0, 62).tween("scoreB", 0, 55).tween("diffPct", 0, 13).tween("totalPoints", 0, 117).badge("期首"))
  .phase("p2", {
    duration: 2200,
    title: "月次進捗",
    body: "1 ヶ月経過、 A は新機能着手で加速、 B は refactor 中心で保守。 scoreA 62 → 75 tween、 scoreB 55 → 60 tween、 diffPct 13 → 25 tween、 totalPoints 117 → 252 tween、 jira lane activate。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira").tween("scoreA", 62, 75).tween("scoreB", 55, 60).tween("diffPct", 13, 25).tween("totalPoints", 117, 252).badge("月次"))
  .phase("p3", {
    duration: 2200,
    title: "中間 review",
    body: "2 ヶ月折り返し、 dashboard で対比可視化。 scoreA 75 → 78 tween、 scoreB 60 → 62 tween、 diffPct 25 → 26 tween (A リード継続)、 totalPoints 252 → 392 tween、 dwh + dashboard lane activate。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira", "dwh", "dashboard").tween("scoreA", 75, 78).tween("scoreB", 60, 62).tween("diffPct", 25, 26).tween("totalPoints", 252, 392).badge("中間"))
  .phase("p4", {
    duration: 2000,
    title: "最終比較",
    body: "四半期終了、 Team A 82 pt vs Team B 65 pt で A 圧勝。 scoreA 78 → 82 tween (最終、 gauge 針最上位相当)、 scoreB 62 → 65 tween、 diffPct 26 → 26 tween、 totalPoints 392 → 539 tween (最終累計)、 6 shape 全 active、 kpiComparison が最終値表示。",
  }, (p: PhaseBuilder) => p.activate("leadA", "appA", "leadB", "jira", "dwh", "dashboard").tween("scoreA", 78, 82).tween("scoreB", 62, 65).tween("totalPoints", 392, 539).badge("最終"))
  .build();

/**
 * 106. publishWorkflowSteps v2 = マーケティング team 週次 blog 記事 publish workflow 4 phase シナリオ (writer 下書き → editor レビュー → lead 承認 → CDN 配信)、 shape-person × 2 (writer / editor) + shape-mobile-device + shape-website + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Draft → Review → Approve → Publish) + 4 readout (stepProgress / gauge 完成度 / countup 累計配信数 / stat 経過分) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const publishWorkflowSteps = diagram("interactive-publish-workflow", {
  topic: "マーケティング team blog 記事 publish workflow 4 phase = (Draft → Review → Approve → Publish) の flow を shape-* primitive 6 種で表現 + 4 readout (stepProgress / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("author", { x: 0, width: 220 })
  .lane("cms", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("steps", ["Draft", "Review", "Approve", "Publish"])
  .state("cur", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("publishedCount", { initial: 12 })
  .state("elapsedMin", { initial: 0 })
  .node("writer", { lane: "author", stack: 0, kind: "shape-person", title: "writer 岸田様", eyebrow: "author", subtitle: "週次 blog 担当 · SEO 記事" })
  .node("laptop", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "Notion draft", eyebrow: "device", subtitle: "見出し + 本文 + reference 準備" })
  .node("cmsSite", { lane: "cms", stack: 0, kind: "shape-website", title: "CMS (WordPress)", eyebrow: "cms", subtitle: "draft slot + reviewer assign" })
  .node("editor", { lane: "cms", stack: 1, kind: "shape-person", title: "editor 山田様", eyebrow: "reviewer", subtitle: "fact-check + tone 統一 + 校正" })
  .node("cdn", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "CloudFront CDN", eyebrow: "cdn", subtitle: "全国 edge cache + SEO index" })
  .node("archive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "記事 archive DB", eyebrow: "storage", subtitle: "public URL + タグ + 統計連携" })
  .edge("writer", "laptop", { label: "書く", tone: "info" })
  .edge("laptop", "cmsSite", { label: "submit", tone: "success" })
  .edge("cmsSite", "editor", { label: "assign", tone: "info" })
  .edge("editor", "cdn", { label: "approve → deploy", tone: "accent" })
  .edge("cdn", "archive", { label: "index", tone: "success" })
  .readout.stepProgress("sp", { source: "cur", stepsSource: "steps", color: "#2563eb", label: "Workflow" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "完成度 %" })
  .readout.countup("pubCU", { source: "publishedCount", unit: " 件", label: "累計配信", decimals: 0 })
  .readout.stat("timeStat", { source: "elapsedMin", unit: " 分", caption: "経過時間", label: "elapsed" })
  .phase("p1", {
    duration: 1800,
    title: "Draft 作成",
    body: "岸田様が Notion で下書き執筆、 見出し + 本文 + 引用 refs 揃える。 cur = 0 (Draft)、 progress 0 → 30 tween、 publishedCount 12 keep、 elapsedMin 0 → 25 tween、 writer + laptop lane active。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop").set("cur", 0).tween("progress", 0, 30).tween("elapsedMin", 0, 25).badge("Draft"))
  .phase("p2", {
    duration: 2200,
    title: "Review + fact-check",
    body: "CMS submit → 山田様アサイン、 fact-check + tone 統一 + 校正 3 pass。 cur 0 → 1 tween (Review)、 progress 30 → 60 tween、 elapsedMin 25 → 55 tween、 cmsSite + editor lane activate。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor").tween("cur", 0, 1).tween("progress", 30, 60).tween("elapsedMin", 25, 55).badge("Review"))
  .phase("p3", {
    duration: 2000,
    title: "Approve + SEO 最適化",
    body: "lead 承認 + SEO tag 追加、 title / description / OG 画像 fix。 cur 1 → 2 tween (Approve)、 progress 60 → 85 tween (gauge 針上振れ)、 elapsedMin 55 → 68 tween、 CMS lane で最終調整。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor").tween("cur", 1, 2).tween("progress", 60, 85).tween("elapsedMin", 55, 68).badge("Approve"))
  .phase("p4", {
    duration: 2000,
    title: "Publish + CDN 配信",
    body: "CMS → CDN deploy、 全国 edge cache + 記事 archive に URL + tag 登録、 SEO index キック。 cur 2 → 3 tween (Publish)、 progress 85 → 100 tween (gauge 針最上位)、 publishedCount 12 → 13 tween (累計 +1)、 elapsedMin 68 → 75 tween、 cdn + archive lane activate、 6 shape 全 active、 記事公開完遂。",
  }, (p: PhaseBuilder) => p.activate("writer", "laptop", "cmsSite", "editor", "cdn", "archive").tween("cur", 2, 3).tween("progress", 85, 100).tween("publishedCount", 12, 13).tween("elapsedMin", 68, 75).badge("Publish"))
  .build();

/**
 * 107. teamPresenceStatus v2 = リモート 5 名 team 1 日 presence 変化 4 phase シナリオ (朝 offline → 業務 online → 昼 away → 夕方 退勤)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-cylinder + shape-website の 6 shape で visual scene 化、 4 phase (09:00 出社 → 11:00 全員 online → 12:30 昼 away → 17:00 退勤) + 4 readout (userPresence / gauge online 率 / countup msg 数 / stat active 時間) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const teamPresenceStatus = diagram("interactive-team-presence", {
  topic: "リモート 5 名 team 1 日 presence 変化 4 phase = (朝 09:00 → 昼前 11:00 → 昼 12:30 → 夕方 17:00) の flow を shape-* primitive 6 種で表現 + 4 readout (userPresence / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("lead", { lane: "member", stack: 0, kind: "shape-person", title: "team lead Alice 様", eyebrow: "lead", subtitle: "5 名リモート team 主宰" })
  .node("slack", { lane: "member", stack: 1, kind: "shape-mobile-device", title: "Slack app", eyebrow: "device", subtitle: "presence 送信 + msg 受信" })
  .node("slackBackend", { lane: "service", stack: 0, kind: "shape-cloud", title: "Slack backend", eyebrow: "cloud", subtitle: "全 member presence event 集約" })
  .node("presenceSvr", { lane: "service", stack: 1, kind: "shape-server-rack", title: "presence server", eyebrow: "backend", subtitle: "WebSocket + heartbeat 30s" })
  .node("dashboard", { lane: "outcome", stack: 0, kind: "shape-website", title: "presence dashboard", eyebrow: "ui", subtitle: "team 一覧 dot 表示" })
  .node("auditLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "audit log DB", eyebrow: "storage", subtitle: "1 日の presence 履歴保存" })
  .edge("lead", "slack", { label: "起動", tone: "info" })
  .edge("slack", "slackBackend", { label: "presence", tone: "info" })
  .edge("slackBackend", "presenceSvr", { label: "route", tone: "accent" })
  .edge("presenceSvr", "dashboard", { label: "broadcast", tone: "success" })
  .edge("presenceSvr", "auditLog", { label: "persist", tone: "success" })
  .readout.userPresence("up", { source: "team", max: 6, label: "Team status" })
  .readout.gauge("onlineG", { source: "onlineRate", min: 0, max: 100, color: "#22c55e", label: "online 率 %" })
  .readout.countup("msgCU", { source: "msgCount", unit: " msg", label: "1 日 msg", decimals: 0 })
  .readout.stat("actStat", { source: "activeHours", unit: " h", caption: "active 時間", label: "active" })
  .phase("p1", {
    duration: 1800,
    title: "朝 09:00 出社",
    body: "team member 順次 Slack 起動、 Alice → Bob → Carol → Dan → Eve の順に online 遷移。 onlineRate 0 → 20 tween、 msgCount 0 → 5 tween、 activeHours 0 → 1 tween、 lead + slack lane active。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack").tween("onlineRate", 0, 20).tween("msgCount", 0, 5).tween("activeHours", 0, 1).badge("09:00"))
  .phase("p2", {
    duration: 2200,
    title: "11:00 全員 online",
    body: "10:00 台に全員 slack 起動、 全員 online 到達、 presence server broadcast 全端末に反映。 onlineRate 20 → 100 tween (gauge 針最上位)、 msgCount 5 → 32 tween、 activeHours 1 → 3 tween、 slackBackend + presenceSvr + dashboard lane activate。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard").tween("onlineRate", 20, 100).tween("msgCount", 5, 32).tween("activeHours", 1, 3).badge("11:00"))
  .phase("p3", {
    duration: 2000,
    title: "12:30 昼休憩 away",
    body: "Alice + Bob 昼休憩で away、 Carol / Dan / Eve は集中作業で online 継続。 onlineRate 100 → 60 tween (下降)、 msgCount 32 → 40 tween、 activeHours 3 → 4 tween、 dashboard 反映。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard").tween("onlineRate", 100, 60).tween("msgCount", 32, 40).tween("activeHours", 3, 4).badge("12:30"))
  .phase("p4", {
    duration: 2000,
    title: "17:00 退勤 mix",
    body: "Bob + Dan 退勤で offline、 Alice + Carol 業務終盤 away、 Eve 残業 online 継続。 team = [Alice away, Bob offline, Carol online, Dan offline, Eve online] スナップショット。 onlineRate 60 → 20 tween、 msgCount 40 → 58 tween (最終)、 activeHours 4 → 8 tween、 auditLog activate、 6 shape 全 active、 1 日 presence 履歴 flush。",
  }, (p: PhaseBuilder) => p.activate("lead", "slack", "slackBackend", "presenceSvr", "dashboard", "auditLog").tween("onlineRate", 60, 20).tween("msgCount", 40, 58).tween("activeHours", 4, 8).badge("17:00"))
  .build();

/**
 * 108. feedbackThumbRating v2 = SaaS 新機能 launch 1 週間 vote 集計 4 phase シナリオ (launch → 1 日目急増 → 3 日目 bug 発生 → 1 週間 fix 後安定)、 shape-person + shape-mobile-device + shape-website + shape-cylinder + shape-cloud + shape-server-rack の 6 shape で visual scene 化、 4 phase (launch 直後 → 1 日目 → 3 日目 down 発生 → 1 週間安定) + 4 readout (ratingThumb / gauge positive 率 / countup total votes / stat final score) が tween で visually 連続変化。 iteration 8 wave 8-J redesign。
 */
export const feedbackThumbRating = diagram("interactive-feedback-rating", {
  topic: "SaaS 新機能 launch 1 週間 vote 集計 4 phase = (launch → 1 日目 → 3 日目 → 1 週間) の flow を shape-* primitive 6 種で表現 + 4 readout (ratingThumb / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("votes", [128, 27])
  .state("positiveRate", { initial: 0 })
  .state("totalVotes", { initial: 0 })
  .state("finalScore", { initial: 0 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "早期利用者", eyebrow: "user", subtitle: "SaaS 新機能を試すアーリーアダプター" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SaaS mobile app", eyebrow: "device", subtitle: "新機能を利用 + feedback ボタン" })
  .node("form", { lane: "service", stack: 0, kind: "shape-website", title: "feedback form", eyebrow: "form", subtitle: "▲ Good / ▼ Bad + free text" })
  .node("backend", { lane: "service", stack: 1, kind: "shape-server-rack", title: "vote API", eyebrow: "backend", subtitle: "vote count + score 計算" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "analytics", eyebrow: "analytics", subtitle: "vote 集計 + ダッシュボード配信" })
  .node("voteDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "vote history DB", eyebrow: "storage", subtitle: "user 別 vote 記録 + audit" })
  .edge("user", "app", { label: "起動", tone: "info" })
  .edge("app", "form", { label: "▲ / ▼", tone: "info" })
  .edge("form", "backend", { label: "submit", tone: "success" })
  .edge("backend", "voteDb", { label: "persist", tone: "success" })
  .edge("backend", "analytics", { label: "aggregate", tone: "accent" })
  .readout.ratingThumb("rt", { source: "votes", colorUp: "#22c55e", colorDown: "#ef4444", label: "Review score" })
  .readout.gauge("posG", { source: "positiveRate", min: 0, max: 100, color: "#22c55e", label: "positive 率 %" })
  .readout.countup("totCU", { source: "totalVotes", unit: " 件", label: "累計 vote", decimals: 0 })
  .readout.stat("scoreStat", { source: "finalScore", unit: " pt", caption: "score", label: "score" })
  .phase("p1", {
    duration: 1800,
    title: "launch 直後 (Day 0)",
    body: "新機能 release 直後、 まず一握りのアーリーが試して feedback 送信。 positiveRate 0 → 83 tween、 totalVotes 0 → 6 tween、 finalScore 0 → 65 tween、 user + app + form lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form").tween("positiveRate", 0, 83).tween("totalVotes", 0, 6).tween("finalScore", 0, 65).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "1 日目 up vote 急増",
    body: "SNS シェアで爆発的に up vote 増加、 backend + voteDb で永続化キック。 positiveRate 83 → 93 tween (高値定着)、 totalVotes 6 → 45 tween、 finalScore 65 → 88 tween、 backend + voteDb + analytics activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics").tween("positiveRate", 83, 93).tween("totalVotes", 6, 45).tween("finalScore", 65, 88).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "3 日目 edge case bug 発生",
    body: "特定 iOS 端末で bug 発火、 down vote 相次ぐ。 positiveRate 93 → 72 tween (下降、 gauge 針落ち)、 totalVotes 45 → 80 tween、 finalScore 88 → 65 tween、 analytics で alert 発報。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics").tween("positiveRate", 93, 72).tween("totalVotes", 45, 80).tween("finalScore", 88, 65).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "1 週間 fix 後安定",
    body: "hotfix release → down vote 収束、 up vote が再び伸長、 最終 stable score に到達。 votes = [128, 27] スナップショット。 positiveRate 72 → 83 tween (回復)、 totalVotes 80 → 155 tween、 finalScore 65 → 82 tween、 6 shape 全 active、 1 週間集計完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "form", "backend", "voteDb", "analytics").tween("positiveRate", 72, 83).tween("totalVotes", 80, 155).tween("finalScore", 65, 82).badge("Day 7"))
  .build();

/**
 * 109. startupOrgChart v2 = seed → Series A 直前 startup の 6 ヶ月成長 4 phase シナリオ (CEO 単独 → 2 VP 採用 → 3 IC 採用 → 業務体制)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-server-rack の 6 shape で visual scene 化、 4 phase (Seed → VP 採用 → IC 採用 → 業務体制) + 4 readout (orgChartMini / gauge 採用充足率 / countup headcount / stat monthly burn) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const startupOrgChart = diagram("interactive-startup-org", {
  topic: "startup 6 ヶ月成長 4 phase = (Seed CEO 単独 → 2 VP 採用 → 3 IC 採用 → 業務体制) の flow を shape-* primitive 6 種で表現 + 4 readout (orgChartMini / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("ceo", { lane: "founder", stack: 0, kind: "shape-person", title: "founder Alice", eyebrow: "CEO", subtitle: "seed 資金調達 + 6 名採用計画" })
  .node("hrTool", { lane: "founder", stack: 1, kind: "shape-mobile-device", title: "Notion HR + Slack", eyebrow: "device", subtitle: "採用管理 + 社内コミュニケーション" })
  .node("jobBoard", { lane: "hr", stack: 0, kind: "shape-website", title: "LinkedIn 求人", eyebrow: "board", subtitle: "engineer / sales 6 slot 公開" })
  .node("hris", { lane: "hr", stack: 1, kind: "shape-cloud", title: "HRIS (Deel)", eyebrow: "hr", subtitle: "契約 + payroll + 労務" })
  .node("orgDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "org チャート DB", eyebrow: "storage", subtitle: "reporting line + level 履歴" })
  .node("dashboard", { lane: "outcome", stack: 1, kind: "shape-server-rack", title: "経営 dashboard", eyebrow: "board", subtitle: "headcount / burn rate / runway" })
  .edge("ceo", "hrTool", { label: "planning", tone: "info" })
  .edge("hrTool", "jobBoard", { label: "post", tone: "info" })
  .edge("jobBoard", "hris", { label: "hire", tone: "success" })
  .edge("hris", "orgDb", { label: "onboard", tone: "success" })
  .edge("hris", "dashboard", { label: "report", tone: "accent" })
  .readout.orgChartMini("oc", { source: "org", color: "#2563eb", label: "Org hierarchy" })
  .readout.gauge("hireG", { source: "hireRate", min: 0, max: 100, color: "#22c55e", label: "採用充足率 %" })
  .readout.countup("hcCU", { source: "headcount", unit: " 名", label: "headcount", decimals: 0 })
  .readout.stat("burnStat", { source: "monthlyBurn", unit: " 万円", caption: "月次 burn", label: "burn" })
  .phase("p1", {
    duration: 1800,
    title: "Seed 期 (CEO 単独)",
    body: "Alice が seed round 完了、 まず 1 名で会社立ち上げ。 hireRate 0 → 17 tween、 headcount 1 keep、 monthlyBurn 100 → 150 tween、 ceo + hrTool lane active。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool").tween("hireRate", 0, 17).tween("monthlyBurn", 100, 150).badge("Seed"))
  .phase("p2", {
    duration: 2200,
    title: "2 VP 採用",
    body: "LinkedIn 求人 → Bob VP Eng + Carol VP Sales 採用、 HRIS 契約完了。 hireRate 17 → 50 tween、 headcount 1 → 3 tween、 monthlyBurn 150 → 400 tween、 jobBoard + hris lane activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris").tween("hireRate", 17, 50).tween("headcount", 1, 3).tween("monthlyBurn", 150, 400).badge("VP"))
  .phase("p3", {
    duration: 2200,
    title: "3 IC 採用",
    body: "Bob + Carol が Dan / Eve / Frank を集中採用、 各 team に IC 配属。 hireRate 50 → 100 tween (gauge 針最上位)、 headcount 3 → 6 tween、 monthlyBurn 400 → 720 tween、 orgDb activate。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris", "orgDb").tween("hireRate", 50, 100).tween("headcount", 3, 6).tween("monthlyBurn", 400, 720).badge("IC"))
  .phase("p4", {
    duration: 2000,
    title: "業務体制確立",
    body: "6 名で reporting line 整備、 経営 dashboard に headcount / burn rate 反映、 Series A 準備開始。 hireRate 100 keep (充足)、 headcount 6 keep、 monthlyBurn 720 → 800 tween (安定期)、 dashboard activate、 6 shape 全 active、 業務体制完遂。",
  }, (p: PhaseBuilder) => p.activate("ceo", "hrTool", "jobBoard", "hris", "orgDb", "dashboard").tween("monthlyBurn", 720, 800).badge("体制"))
  .build();

/**
 * 110. npsTrendKpi v2 = SaaS CS チーム 半年 NPS 追跡 4 phase シナリオ (Q1 開始 → UX 改善リリース → 障害復旧 → 施策安定化)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-server-rack の 6 shape で visual scene 化、 4 phase (Q1 60 → Q2 70 → Q3 82 → Q4 82) + 4 readout (kpiTrendTile / gauge NPS ゾーン / countup 回答数 / stat delta) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const npsTrendKpi = diagram("interactive-nps-trend", {
  topic: "SaaS CS チーム半年 NPS 追跡 4 phase = (Q1 60 → Q2 UX 改善 70 → Q3 障害復旧 82 → Q4 施策安定 82) の flow を shape-* primitive 6 種で表現 + 4 readout (kpiTrendTile / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("csLead", { lane: "csLead", stack: 0, kind: "shape-person", title: "CS lead 篠原様", eyebrow: "customer success", subtitle: "NPS 主管 + 週次 review" })
  .node("surveyApp", { lane: "csLead", stack: 1, kind: "shape-mobile-device", title: "survey app", eyebrow: "device", subtitle: "四半期 email 配信 + 回答収集" })
  .node("feedbackForm", { lane: "service", stack: 0, kind: "shape-website", title: "feedback form", eyebrow: "form", subtitle: "10 段階 + 自由記述" })
  .node("analytics", { lane: "service", stack: 1, kind: "shape-cloud", title: "NPS analytics", eyebrow: "analytics", subtitle: "促進 - 批判 = NPS 計算" })
  .node("kpiDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "KPI history DB", eyebrow: "storage", subtitle: "6 ヶ月 trend 保存" })
  .node("execBoard", { lane: "outcome", stack: 1, kind: "shape-server-rack", title: "経営 board", eyebrow: "board", subtitle: "四半期報告 + 目標対比" })
  .edge("csLead", "surveyApp", { label: "配信", tone: "info" })
  .edge("surveyApp", "feedbackForm", { label: "回答", tone: "info" })
  .edge("feedbackForm", "analytics", { label: "集計", tone: "success" })
  .edge("analytics", "kpiDb", { label: "persist", tone: "success" })
  .edge("analytics", "execBoard", { label: "report", tone: "accent" })
  .readout.kpiTrendTile("kt", { source: "cur", prevSource: "prev", historySource: "hist", unit: "", colorPos: "#22c55e", colorNeg: "#ef4444", label: "NPS trend" })
  .readout.gauge("npsG", { source: "npsGauge", min: 0, max: 100, color: "#22c55e", label: "NPS ゾーン" })
  .readout.countup("respCU", { source: "respondents", unit: " 件", label: "回答数", decimals: 0 })
  .readout.stat("delStat", { source: "delta", unit: " pt", caption: "前四半期 delta", label: "delta" })
  .phase("p1", {
    duration: 1800,
    title: "Q1 開始 (NPS 60)",
    body: "1 月 email 配信、 Q1 初回計測。 cur 60 keep、 prev 55 keep、 npsGauge 0 → 60 tween、 respondents 0 → 100 tween、 delta 0 → 5 tween、 csLead + surveyApp lane active。",
  }, (p: PhaseBuilder) => p.activate("csLead", "surveyApp").tween("npsGauge", 0, 60).tween("respondents", 0, 100).tween("delta", 0, 5).badge("Q1 60"))
  .phase("p2", {
    duration: 2200,
    title: "Q2 UX 改善リリース (NPS 70)",
    body: "大型 UX 改善リリース → 回答 upvote 増。 cur 60 → 70 tween、 prev 60 keep、 npsGauge 60 → 70 tween、 respondents 100 → 250 tween、 delta 5 → 10 tween、 feedbackForm + analytics lane activate。",
  }, (p: PhaseBuilder) => p.activate("csLead", "surveyApp", "feedbackForm", "analytics").tween("cur", 60, 70).tween("npsGauge", 60, 70).tween("respondents", 100, 250).tween("delta", 5, 10).badge("Q2 70"))
  .phase("p3", {
    duration: 2200,
    title: "Q3 障害復旧 (NPS 82)",
    body: "6 月本番障害 → hotfix + 補償 → 顧客信頼回復で NPS 急伸。 cur 70 → 82 tween、 prev 70 keep、 npsGauge 70 → 82 tween、 respondents 250 → 400 tween、 delta 10 → 12 tween、 kpiDb activate。",
  }, (p: PhaseBuilder) => p.activate("csLead", "surveyApp", "feedbackForm", "analytics", "kpiDb").tween("cur", 70, 82).tween("npsGauge", 70, 82).tween("respondents", 250, 400).tween("delta", 10, 12).badge("Q3 82"))
  .phase("p4", {
    duration: 2000,
    title: "Q4 施策安定化 (NPS 82)",
    body: "Q4 で NPS 82 定着、 経営 board で年次 review、 目標 80 超え達成。 cur 82 keep、 prev 82 tween (更新)、 npsGauge 82 keep、 respondents 400 → 500 tween、 delta 12 → 7 tween、 execBoard activate、 6 shape 全 active、 半年 review 完遂。",
  }, (p: PhaseBuilder) => p.activate("csLead", "surveyApp", "feedbackForm", "analytics", "kpiDb", "execBoard").tween("prev", 75, 82).tween("respondents", 400, 500).tween("delta", 12, 7).badge("Q4 82"))
  .build();

/**
 * 111. postReactionPoll v2 = SNS 投稿 1 週間 reaction 集計 4 phase シナリオ (投稿直後 → 拡散 → エンゲージ → 週末 total)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (投稿 → viral → engage → 週末集計) + 4 readout (quickPollEmoji / gauge viral 度 / countup total reactions / stat top emoji) が tween で visually 連続変化。 iteration 8 wave 8-K redesign。
 */
export const postReactionPoll = diagram("interactive-post-reaction-poll", {
  topic: "SNS 投稿 1 週間 reaction 集計 4 phase = (投稿直後 → 拡散 → engagement → 週末 total) の flow を shape-* primitive 6 種で表現 + 4 readout (quickPollEmoji / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("poster", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("votes", [["👍", 42], ["❤️", 28], ["🎉", 15]] as unknown as (string | number)[])
  .state("viralRate", { initial: 0 })
  .state("totalReactions", { initial: 0 })
  .state("topCount", { initial: 0 })
  .node("poster", { lane: "poster", stack: 0, kind: "shape-person", title: "post 投稿者 岩本様", eyebrow: "author", subtitle: "フォロワー 3000 名 · 週次投稿" })
  .node("app", { lane: "poster", stack: 1, kind: "shape-mobile-device", title: "SNS mobile app", eyebrow: "device", subtitle: "投稿作成 + reaction 通知受信" })
  .node("feed", { lane: "service", stack: 0, kind: "shape-website", title: "SNS feed", eyebrow: "feed", subtitle: "タイムライン + reaction UI" })
  .node("backend", { lane: "service", stack: 1, kind: "shape-cloud", title: "feed backend", eyebrow: "cloud", subtitle: "reaction aggregate + notify" })
  .node("reactDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "reaction DB", eyebrow: "storage", subtitle: "user 別 emoji vote 履歴" })
  .node("cdn", { lane: "outcome", stack: 1, kind: "shape-cdn-edge", title: "feed CDN edge", eyebrow: "cdn", subtitle: "画像 + reaction pill 配信" })
  .edge("poster", "app", { label: "投稿", tone: "info" })
  .edge("app", "feed", { label: "publish", tone: "info" })
  .edge("feed", "backend", { label: "reaction", tone: "success" })
  .edge("backend", "reactDb", { label: "persist", tone: "success" })
  .edge("backend", "cdn", { label: "broadcast", tone: "accent" })
  .readout.quickPollEmoji("qp", { source: "votes", colorWinner: "#2563eb", label: "Reactions" })
  .readout.gauge("viralG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral 度 %" })
  .readout.countup("totCU", { source: "totalReactions", unit: " 件", label: "総 reaction", decimals: 0 })
  .readout.stat("topStat", { source: "topCount", unit: " 👍", caption: "top emoji", label: "top" })
  .phase("p1", {
    duration: 1800,
    title: "投稿直後 (Day 0)",
    body: "岩本様が投稿、 フォロワーの一部が即 reaction。 viralRate 0 → 10 tween、 totalReactions 0 → 8 tween、 topCount 0 → 5 tween、 poster + app + feed lane active。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed").tween("viralRate", 0, 10).tween("totalReactions", 0, 8).tween("topCount", 0, 5).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "拡散 (Day 1)",
    body: "フォロワーの拡散で 👍 急増、 backend + reactDb で永続化キック。 viralRate 10 → 55 tween、 totalReactions 8 → 45 tween、 topCount 5 → 25 tween、 backend + reactDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb").tween("viralRate", 10, 55).tween("totalReactions", 8, 45).tween("topCount", 5, 25).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "エンゲージ (Day 3)",
    body: "深いエンゲージメントで ❤️ + 🎉 増加、 CDN edge で全リージョン配信。 viralRate 55 → 82 tween、 totalReactions 45 → 78 tween、 topCount 25 → 40 tween、 cdn activate。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb", "cdn").tween("viralRate", 55, 82).tween("totalReactions", 45, 78).tween("topCount", 25, 40).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "週末 total (Day 7)",
    body: "週末に集計完了、 votes = [👍 42, ❤️ 28, 🎉 15] スナップショット。 viralRate 82 → 95 tween (バズ)、 totalReactions 78 → 85 tween、 topCount 40 → 42 tween、 6 shape 全 active、 1 週間集計完遂。",
  }, (p: PhaseBuilder) => p.activate("poster", "app", "feed", "backend", "reactDb", "cdn").tween("viralRate", 82, 95).tween("totalReactions", 78, 85).tween("topCount", 40, 42).badge("Day 7"))
  .build();

/**
 * 112. voiceMessagePlayback v2 = 通勤中の音声メモ受信 → 再生 4 phase シナリオ (電車内で通知 → 再生 → 巻戻し → 完了 + reply)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-cylinder + shape-cdn-edge の 6 shape で visual scene 化、 4 phase (受信 → 再生 → 巻戻し → 完了) + 4 readout (voiceMessage / gauge 再生率 / countup 累計 msg 数 / stat 再生秒) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const voiceMessagePlayback = diagram("interactive-voice-message-playback", {
  topic: "通勤中の音声メモ受信 → 再生 4 phase = (電車内通知 → 再生 → 巻戻し → 完了 + reply) の flow を shape-* primitive 6 種で表現 + 4 readout (voiceMessage / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("commuter", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("amps", [0.2, 0.4, 0.7, 0.9, 0.6, 0.3, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.4])
  .state("progress", { initial: 0 })
  .state("playRate", { initial: 0 })
  .state("msgCount", { initial: 12 })
  .state("playSec", { initial: 0 })
  .node("listener", { lane: "commuter", stack: 0, kind: "shape-person", title: "通勤者 池永様", eyebrow: "listener", subtitle: "電車内で音声メモ受信" })
  .node("phone", { lane: "commuter", stack: 1, kind: "shape-mobile-device", title: "iPhone + イヤホン", eyebrow: "device", subtitle: "受信通知 + 波形再生 UI" })
  .node("chatApp", { lane: "service", stack: 0, kind: "shape-website", title: "チャット app", eyebrow: "app", subtitle: "音声波形 15 バー + 再生 progress" })
  .node("audioBackend", { lane: "service", stack: 1, kind: "shape-cloud", title: "音声配信 backend", eyebrow: "cloud", subtitle: "波形解析 + streaming 配信" })
  .node("msgDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "message archive", eyebrow: "storage", subtitle: "音声 msg + 波形 + 既読 履歴" })
  .node("edge", { lane: "outcome", stack: 1, kind: "shape-cdn-edge", title: "音声 CDN edge", eyebrow: "cdn", subtitle: "近い基地局 cache + 低遅延" })
  .edge("listener", "phone", { label: "受信", tone: "info" })
  .edge("phone", "chatApp", { label: "起動", tone: "info" })
  .edge("chatApp", "audioBackend", { label: "stream", tone: "success" })
  .edge("audioBackend", "edge", { label: "cache", tone: "accent" })
  .edge("audioBackend", "msgDb", { label: "persist", tone: "success" })
  .readout.voiceMessage("vm", { source: "amps", progressSource: "progress", duration: 23, colorPlay: "#2563eb", colorBar: "#cbd5e1", label: "音声メモ" })
  .readout.gauge("playG", { source: "playRate", min: 0, max: 100, color: "#22c55e", label: "再生率 %" })
  .readout.countup("msgCU", { source: "msgCount", unit: " 件", label: "累計 msg", decimals: 0 })
  .readout.stat("secStat", { source: "playSec", unit: " 秒", caption: "再生 秒", label: "sec" })
  .phase("p1", {
    duration: 1800,
    title: "受信 (電車内)",
    body: "山手線内で Alice から音声メモ着信、 iPhone 通知バナー表示。 progress 0 keep、 playRate 0 keep、 msgCount 12 → 13 tween、 playSec 0 keep、 listener + phone lane active。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone").tween("msgCount", 12, 13).badge("受信"))
  .phase("p2", {
    duration: 2400,
    title: "再生開始",
    body: "イヤホン装着で再生タップ、 chatApp + audioBackend + edge で低遅延 stream 配信、 波形 15 バーが左から青くなっていく。 progress 0 → 0.7 tween、 playRate 0 → 70 tween、 playSec 0 → 16 tween、 chatApp + audioBackend + edge lane activate。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge").tween("progress", 0, 0.7).tween("playRate", 0, 70).tween("playSec", 0, 16).badge("再生"))
  .phase("p3", {
    duration: 2000,
    title: "巻戻し (聞き直し)",
    body: "重要ポイント聞き直しで progress 0.7 → 0.4 に巻戻し、 再生率一時的に下降、 波形の一部が再度 idle 色に。 playRate 70 → 40 tween、 playSec 16 → 9 tween。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge").tween("progress", 0.7, 0.4).tween("playRate", 70, 40).tween("playSec", 16, 9).badge("巻戻し"))
  .phase("p4", {
    duration: 2000,
    title: "再生完了 + 履歴保存",
    body: "最後まで再生、 msgDb に既読 flag + 波形 履歴保存。 progress 0.4 → 1 tween、 playRate 40 → 100 tween (gauge 針最上位)、 playSec 9 → 23 tween、 msgDb activate、 6 shape 全 active、 音声再生完遂。",
  }, (p: PhaseBuilder) => p.activate("listener", "phone", "chatApp", "audioBackend", "edge", "msgDb").tween("progress", 0.4, 1).tween("playRate", 40, 100).tween("playSec", 9, 23).badge("完了"))
  .build();

/**
 * 113. teamThreadSummary v2 = engineering team Slack チャンネル 1 日 会話量 4 phase シナリオ (朝静か → 昼のインシデント → 夕方の議論 → 夜の retro 引継)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (静か → インシデント → 議論 → retro 引継) + 4 readout (threadSummary / gauge burst 率 / countup 未読数 / stat 参加人数) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const teamThreadSummary = diagram("interactive-team-thread-summary", {
  topic: "eng team Slack チャンネル 1 日会話量 4 phase = (朝静か → 昼インシデント → 夕方議論 → 夜 retro) の flow を shape-* primitive 6 種で表現 + 4 readout (threadSummary / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("member", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("thread", [42, 12, "Bob", "5 分前"] as unknown as (string | number)[])
  .state("unreadCount", { initial: 0 })
  .state("burstRate", { initial: 0 })
  .state("participants", { initial: 0 })
  .node("dev", { lane: "member", stack: 0, kind: "shape-person", title: "eng team 12 名", eyebrow: "team", subtitle: "team-eng チャンネル参加者" })
  .node("slackApp", { lane: "member", stack: 1, kind: "shape-mobile-device", title: "Slack app", eyebrow: "device", subtitle: "通知 + 未読 badge + reply UI" })
  .node("channel", { lane: "service", stack: 0, kind: "shape-website", title: "team-eng channel", eyebrow: "channel", subtitle: "engineering 主戦場 · 12 名 subscribe" })
  .node("workerFleet", { lane: "service", stack: 1, kind: "shape-server-rack", title: "Slack worker fleet", eyebrow: "backend", subtitle: "msg fan-out + 通知 push" })
  .node("indexer", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "search indexer", eyebrow: "search", subtitle: "履歴 index + retro 用検索" })
  .node("archive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "channel archive", eyebrow: "storage", subtitle: "全 msg + thread ツリー保存" })
  .edge("dev", "slackApp", { label: "投稿", tone: "info" })
  .edge("slackApp", "channel", { label: "publish", tone: "info" })
  .edge("channel", "workerFleet", { label: "fan-out", tone: "success" })
  .edge("workerFleet", "archive", { label: "persist", tone: "success" })
  .edge("workerFleet", "indexer", { label: "index", tone: "accent" })
  .readout.threadSummary("ts", { source: "thread", colorUnread: "#ef4444", label: "スレッド概要" })
  .readout.gauge("burstG", { source: "burstRate", min: 0, max: 100, color: "#ef4444", label: "burst 率 %" })
  .readout.countup("unrCU", { source: "unreadCount", unit: " 未読", label: "未読数", decimals: 0 })
  .readout.stat("partStat", { source: "participants", unit: " 名", caption: "参加者", label: "part" })
  .phase("p1", {
    duration: 1500,
    title: "朝 静か",
    body: "朝 09:00、 team ゆっくり出社。 unreadCount 0 → 2 tween、 burstRate 0 → 10 tween、 participants 0 → 3 tween、 dev + slackApp lane active。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp").tween("unreadCount", 0, 2).tween("burstRate", 0, 10).tween("participants", 0, 3).badge("朝"))
  .phase("p2", {
    duration: 2200,
    title: "昼 インシデント発生",
    body: "13:00 本番障害検知、 team-eng 一斉招集、 msg 急増。 unreadCount 2 → 28 tween、 burstRate 10 → 85 tween (gauge 針上振れ、 赤ゾーン)、 participants 3 → 9 tween、 channel + workerFleet lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet").tween("unreadCount", 2, 28).tween("burstRate", 10, 85).tween("participants", 3, 9).badge("障害"))
  .phase("p3", {
    duration: 2200,
    title: "夕方 議論継続",
    body: "hotfix 後 root cause 議論継続、 thread が長く伸長。 unreadCount 28 → 42 tween、 burstRate 85 → 60 tween、 participants 9 → 12 tween、 indexer + archive lane activate、 履歴 index キック。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet", "indexer", "archive").tween("unreadCount", 28, 42).tween("burstRate", 85, 60).tween("participants", 9, 12).badge("議論"))
  .phase("p4", {
    duration: 2000,
    title: "夜 retro 引継ぎ",
    body: "20:00 retro チャンネルに要点 pin、 明日の action item リストアップ。 unreadCount 42 keep (retro 用に残置)、 burstRate 60 → 25 tween (収束)、 participants 12 keep、 6 shape 全 active、 1 日会話履歴 flush。",
  }, (p: PhaseBuilder) => p.activate("dev", "slackApp", "channel", "workerFleet", "indexer", "archive").tween("burstRate", 60, 25).badge("retro"))
  .build();

/**
 * 114. dmReadReceipt v2 = 商談 DM 既読 workflow 4 phase シナリオ (営業送信 → 配信 → 顧客既読 → reply)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (送信 → 配信 → 既読 → reply) + 4 readout (readReceipt / gauge 応答率 / countup 送信数 / stat 未読時間 min) が tween で visually 連続変化。 iteration 8 wave 8-L redesign。
 */
export const dmReadReceipt = diagram("interactive-dm-read-receipt", {
  topic: "商談 DM 既読 workflow 4 phase = (営業送信 → 配信 → 既読 → reply) の flow を shape-* primitive 6 種で表現 + 4 readout (readReceipt / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("sender", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("status", { initial: 0 })
  .state("responseRate", { initial: 0 })
  .state("sentCount", { initial: 0 })
  .state("unreadMin", { initial: 0 })
  .node("salesRep", { lane: "sender", stack: 0, kind: "shape-person", title: "営業 佐藤様", eyebrow: "sales", subtitle: "week 15 件顧客 DM 予定" })
  .node("crmMobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "CRM mobile app", eyebrow: "device", subtitle: "顧客リスト + DM 一括送信" })
  .node("chatSvc", { lane: "service", stack: 0, kind: "shape-website", title: "WhatsApp Business", eyebrow: "service", subtitle: "商談 DM 配信 + 既読フック" })
  .node("dmRouter", { lane: "service", stack: 1, kind: "shape-server-rack", title: "DM router", eyebrow: "backend", subtitle: "receipt event 集約 + 顧客 status" })
  .node("crmDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "CRM DB", eyebrow: "storage", subtitle: "顧客別 DM + receipt 履歴" })
  .node("insights", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "insights", eyebrow: "analytics", subtitle: "既読率 + reply 率 dashboard" })
  .edge("salesRep", "crmMobile", { label: "送信", tone: "info" })
  .edge("crmMobile", "chatSvc", { label: "publish", tone: "info" })
  .edge("chatSvc", "dmRouter", { label: "receipt", tone: "success" })
  .edge("dmRouter", "crmDb", { label: "persist", tone: "success" })
  .edge("dmRouter", "insights", { label: "aggregate", tone: "accent" })
  .readout.readReceipt("rr", { source: "status", colorRead: "#2563eb", colorPending: "#94a3b8", label: "既読状態" })
  .readout.gauge("resG", { source: "responseRate", min: 0, max: 100, color: "#22c55e", label: "応答率 %" })
  .readout.countup("sntCU", { source: "sentCount", unit: " 件", label: "送信数", decimals: 0 })
  .readout.stat("unrStat", { source: "unreadMin", unit: " 分", caption: "未読滞留", label: "unread" })
  .phase("p1", {
    duration: 1500,
    title: "09:42 送信",
    body: "佐藤様 15 件顧客に DM 一括送信、 status = 0 (単チェック 灰)。 responseRate 0 keep、 sentCount 0 → 15 tween、 unreadMin 0 keep、 salesRep + crmMobile lane active。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile").set("status", 0).tween("sentCount", 0, 15).badge("送信"))
  .phase("p2", {
    duration: 1800,
    title: "09:43 配信完了",
    body: "chatSvc + dmRouter で全 15 件配信、 status = 1 (二重チェック 灰)、 未読状態継続。 responseRate 0 keep、 unreadMin 0 → 15 tween、 chatSvc + dmRouter lane activate。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter").set("status", 1).tween("unreadMin", 0, 15).badge("配信"))
  .phase("p3", {
    duration: 2000,
    title: "09:45 顧客既読",
    body: "顧客 12 名が既読、 status = 2 (二重チェック 青)、 receipt event が CRM DB に集約。 responseRate 0 → 80 tween、 unreadMin 15 → 3 tween、 crmDb + insights lane activate。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter", "crmDb", "insights").set("status", 2).tween("responseRate", 0, 80).tween("unreadMin", 15, 3).badge("既読"))
  .phase("p4", {
    duration: 2000,
    title: "10:00 reply 受信",
    body: "顧客 8 名から reply、 insights で応答率グラフ更新、 佐藤様が次アクション決定。 status 2 keep、 responseRate 80 → 53 tween (reply 実数 8/15)、 sentCount 15 keep、 unreadMin 3 → 0 tween、 6 shape 全 active、 商談 DM cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("salesRep", "crmMobile", "chatSvc", "dmRouter", "crmDb", "insights").tween("responseRate", 80, 53).tween("unreadMin", 3, 0).badge("reply"))
  .build();

/**
 * 115. formPasswordCheck v2 = SaaS 新規サインアップの password 強化 4 phase シナリオ (弱 pw 入力 → 大小混合 → 数字追加 → 記号で 4 段階完成)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (弱 1 → 中 2 → 強 3 → 最強 4) + 4 readout (passwordStrength / gauge 強度 / countup 満たしたルール数 / stat 予想解読時間) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const formPasswordCheck = diagram("interactive-form-password-check", {
  topic: "SaaS 新規サインアップ password 強化 4 phase = (弱 1 → 中 2 → 強 3 → 最強 4) の flow を shape-* primitive 6 種で表現 + 4 readout (passwordStrength / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("pw", { initial: 1 })
  .state("strengthScore", { initial: 25 })
  .state("rulesPassed", { initial: 1 })
  .state("crackDays", { initial: 0 })
  .node("newuser", { lane: "user", stack: 0, kind: "shape-person", title: "新規登録者 山田様", eyebrow: "user", subtitle: "SaaS trial 登録中" })
  .node("browser", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "browser + 1Password", eyebrow: "device", subtitle: "signup form + 自動生成候補" })
  .node("signupPage", { lane: "service", stack: 0, kind: "shape-website", title: "サインアップ画面", eyebrow: "form", subtitle: "password 入力 + 強度メーター表示" })
  .node("authSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "認証 backend", eyebrow: "auth", subtitle: "強度評価 + bcrypt hash" })
  .node("secOps", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "SecOps 監視", eyebrow: "security", subtitle: "弱 password リスト照合 + 通知" })
  .node("userDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "user DB", eyebrow: "storage", subtitle: "hash + salt + 強度 metadata" })
  .edge("newuser", "browser", { label: "入力", tone: "info" })
  .edge("browser", "signupPage", { label: "submit", tone: "info" })
  .edge("signupPage", "authSvc", { label: "評価", tone: "success" })
  .edge("authSvc", "secOps", { label: "check", tone: "accent" })
  .edge("authSvc", "userDb", { label: "persist", tone: "success" })
  .readout.passwordStrength("ps", { source: "pw", colorStrong: "#22c55e", colorWeak: "#ef4444", label: "強度" })
  .readout.gauge("scoreG", { source: "strengthScore", min: 0, max: 100, color: "#22c55e", label: "強度スコア" })
  .readout.countup("rulesCU", { source: "rulesPassed", unit: " ルール", label: "満たしたルール", decimals: 0 })
  .readout.stat("crackStat", { source: "crackDays", unit: " 日", caption: "予想解読", label: "crack" })
  .phase("p1", {
    duration: 1500,
    title: "弱 pw 入力 (level 1)",
    body: "山田様が短い pw 入力、 メーター 1 セグメント赤。 pw = 1、 strengthScore 25 keep、 rulesPassed 1 → 1 keep、 crackDays 0 → 1 tween (実質 秒 order)、 newuser + browser + signupPage lane active。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage").set("pw", 1).tween("crackDays", 0, 1).badge("弱 1"))
  .phase("p2", {
    duration: 2000,
    title: "大小混合 (level 2)",
    body: "大小混合追加、 pw = 2、 メーター 2 セグメント橙。 strengthScore 25 → 50 tween、 rulesPassed 1 → 2 tween、 crackDays 1 → 30 tween、 authSvc lane activate、 強度評価 API call。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc").tween("pw", 1, 2).tween("strengthScore", 25, 50).tween("rulesPassed", 1, 2).tween("crackDays", 1, 30).badge("中 2"))
  .phase("p3", {
    duration: 2000,
    title: "数字追加 (level 3)",
    body: "数字混入、 pw = 3、 メーター 3 セグメント黄緑。 strengthScore 50 → 75 tween、 rulesPassed 2 → 3 tween、 crackDays 30 → 365 tween、 secOps activate、 弱 password リスト照合 pass。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc", "secOps").tween("pw", 2, 3).tween("strengthScore", 50, 75).tween("rulesPassed", 2, 3).tween("crackDays", 30, 365).badge("強 3"))
  .phase("p4", {
    duration: 2000,
    title: "記号追加 (level 4 最強)",
    body: "記号混入、 pw = 4、 メーター 4 セグメント全緑。 strengthScore 75 → 100 tween (gauge 針最上位)、 rulesPassed 3 → 4 tween、 crackDays 365 → 10000 tween、 userDb activate、 bcrypt hash 保存完了、 6 shape 全 active、 signup 完遂。",
  }, (p: PhaseBuilder) => p.activate("newuser", "browser", "signupPage", "authSvc", "secOps", "userDb").tween("pw", 3, 4).tween("strengthScore", 75, 100).tween("rulesPassed", 3, 4).tween("crackDays", 365, 10000).badge("最強 4"))
  .build();

/**
 * 116. loginOtpVerify v2 = 銀行アプリ 2 段階認証 OTP ログイン 4 phase シナリオ (SMS 送信 → ユーザ入力 → 検証 → ログイン成功)、 shape-person + shape-mobile-device + shape-website + shape-cloud + shape-server-rack + shape-cylinder の 6 shape で visual scene 化、 4 phase (SMS 送信 → 入力 → 検証 → 成功) + 4 readout (otpInput / gauge 入力進捗 / countup 累計成功回数 / stat 検証秒) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const loginOtpVerify = diagram("interactive-login-otp-verify", {
  topic: "銀行アプリ 2 段階認証 OTP ログイン 4 phase = (SMS 送信 → 入力 → 検証 → 成功) の flow を shape-* primitive 6 種で表現 + 4 readout (otpInput / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("otp", [4, 8, 2, 1, 5, 7])
  .state("entered", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("successCount", { initial: 145 })
  .state("verifySec", { initial: 0 })
  .node("customer", { lane: "user", stack: 0, kind: "shape-person", title: "銀行 online 利用者 森様", eyebrow: "customer", subtitle: "週次残高照会 + 送金" })
  .node("smartphone", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "iPhone banking app", eyebrow: "device", subtitle: "SMS 受信 + 6 桁入力 UI" })
  .node("bankApp", { lane: "service", stack: 0, kind: "shape-website", title: "banking app", eyebrow: "app", subtitle: "OTP 入力欄 + 2 段階検証" })
  .node("smsGateway", { lane: "service", stack: 1, kind: "shape-cloud", title: "SMS gateway", eyebrow: "sms", subtitle: "TTL 3 min + 送信履歴" })
  .node("authSvc", { lane: "outcome", stack: 0, kind: "shape-server-rack", title: "認証 backend", eyebrow: "auth", subtitle: "OTP 照合 + session token 発行" })
  .node("auditLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "監査 log", eyebrow: "audit", subtitle: "login 履歴 + 不審行動 flag" })
  .edge("customer", "smartphone", { label: "起動", tone: "info" })
  .edge("smartphone", "bankApp", { label: "login", tone: "info" })
  .edge("bankApp", "smsGateway", { label: "送信", tone: "info" })
  .edge("bankApp", "authSvc", { label: "検証", tone: "success" })
  .edge("authSvc", "auditLog", { label: "log", tone: "accent" })
  .readout.otpInput("oi", { source: "otp", colorFocus: "#2563eb", label: "OTP コード" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "入力進捗 %" })
  .readout.countup("sucCU", { source: "successCount", unit: " 回", label: "累計成功", decimals: 0 })
  .readout.stat("verStat", { source: "verifySec", unit: " 秒", caption: "検証所要", label: "sec" })
  .phase("p1", {
    duration: 1500,
    title: "SMS 送信",
    body: "森様が login 開始、 銀行アプリが SMS gateway 経由で 6 桁 OTP 送信。 entered 0 keep、 progress 0 → 10 tween、 successCount 145 keep、 verifySec 0 → 3 tween、 customer + smartphone + bankApp + smsGateway lane active。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway").tween("progress", 0, 10).tween("verifySec", 0, 3).badge("送信"))
  .phase("p2", {
    duration: 2200,
    title: "入力中",
    body: "SMS 到着 → 森様が 1 桁ずつ入力、 focus ボックス右移動。 entered 0 → 6 tween、 progress 10 → 90 tween、 verifySec 3 → 12 tween、 入力 UI で visible 進行。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway").tween("entered", 0, 6).tween("progress", 10, 90).tween("verifySec", 3, 12).badge("入力"))
  .phase("p3", {
    duration: 1800,
    title: "検証",
    body: "6 桁揃い自動送信、 authSvc で OTP 照合 + session token 発行。 progress 90 → 100 tween、 successCount 145 → 146 tween、 verifySec 12 → 14 tween、 authSvc lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "authSvc").tween("progress", 90, 100).tween("successCount", 145, 146).tween("verifySec", 12, 14).badge("検証"))
  .phase("p4", {
    duration: 2000,
    title: "ログイン成功",
    body: "session token 発行、 認証済状態で残高画面遷移、 監査 log 記録。 entered 6 keep、 progress 100 keep、 successCount 146 keep、 verifySec 14 → 15 tween、 auditLog lane activate、 6 shape 全 active、 2FA login 完遂。",
  }, (p: PhaseBuilder) => p.activate("customer", "smartphone", "bankApp", "smsGateway", "authSvc", "auditLog").tween("verifySec", 14, 15).badge("成功"))
  .build();

/**
 * 117. profileAvatarUpload v2 = SaaS profile 設定でアバター画像 upload 4 phase シナリオ (未選択 → ファイル選択 → upload → プレビュー確定)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (未選択 → 選択 → upload → プレビュー) + 4 readout (fileDropzone / gauge upload % / countup ファイルサイズ KB / stat 処理秒) が tween で visually 連続変化。 iteration 8 wave 8-M redesign。
 */
export const profileAvatarUpload = diagram("interactive-profile-avatar-upload", {
  topic: "SaaS profile アバター画像 upload 4 phase = (未選択 → 選択 → upload → プレビュー確定) の flow を shape-* primitive 6 種で表現 + 4 readout (fileDropzone / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("file", { initial: "" })
  .state("uploadPct", { initial: 0 })
  .state("fileSize", { initial: 0 })
  .state("procSec", { initial: 0 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "profile 更新者 花田様", eyebrow: "user", subtitle: "SaaS profile アバター更新中" })
  .node("laptop", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "MacBook + Finder", eyebrow: "device", subtitle: "avatar-2024.png (245 KB) 選択" })
  .node("uploadPage", { lane: "service", stack: 0, kind: "shape-website", title: "profile settings", eyebrow: "form", subtitle: "dropzone + 80×80 プレビュー" })
  .node("uploadSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "upload backend", eyebrow: "backend", subtitle: "resize + crop + AV scan" })
  .node("imgCdn", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "画像 CDN (S3 + CloudFront)", eyebrow: "cdn", subtitle: "80×80 / 200×200 / 512×512 3 size 配信" })
  .node("profileDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "profile DB", eyebrow: "storage", subtitle: "user_id → avatar_url map + 履歴" })
  .edge("user", "laptop", { label: "選択", tone: "info" })
  .edge("laptop", "uploadPage", { label: "drop", tone: "info" })
  .edge("uploadPage", "uploadSvc", { label: "POST", tone: "success" })
  .edge("uploadSvc", "imgCdn", { label: "publish", tone: "accent" })
  .edge("uploadSvc", "profileDb", { label: "persist url", tone: "success" })
  .readout.fileDropzone("fd", { source: "file", colorActive: "#2563eb", label: "アバター ファイル" })
  .readout.gauge("upG", { source: "uploadPct", min: 0, max: 100, color: "#22c55e", label: "upload %" })
  .readout.countup("sizeCU", { source: "fileSize", unit: " KB", label: "ファイルサイズ", decimals: 0 })
  .readout.stat("procStat", { source: "procSec", unit: " 秒", caption: "処理時間", label: "sec" })
  .phase("p1", {
    duration: 1500,
    title: "未選択",
    body: "花田様が profile 設定画面へ、 dropzone が破線枠 + '⬆ ここにドロップ' 表示。 file = ''、 uploadPct 0 keep、 fileSize 0 keep、 procSec 0 keep、 user + laptop + uploadPage lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage").set("file", "").badge("未選択"))
  .phase("p2", {
    duration: 1800,
    title: "ファイル選択",
    body: "Finder から avatar-2024.png ドラッグ、 dropzone が青枠 + ファイル名カード表示。 file → 'avatar-2024.png'、 uploadPct 0 → 15 tween、 fileSize 0 → 245 tween、 procSec 0 → 1 tween。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage").set("file", "avatar-2024.png").tween("uploadPct", 0, 15).tween("fileSize", 0, 245).tween("procSec", 0, 1).badge("選択"))
  .phase("p3", {
    duration: 2200,
    title: "upload 中",
    body: "uploadSvc へ POST、 AV scan + resize (80/200/512) 実行、 CDN へ publish キック。 uploadPct 15 → 90 tween、 procSec 1 → 4 tween、 uploadSvc + imgCdn lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "uploadSvc", "imgCdn").tween("uploadPct", 15, 90).tween("procSec", 1, 4).badge("upload"))
  .phase("p4", {
    duration: 2000,
    title: "プレビュー確定",
    body: "CDN 配信済、 profileDb に avatar_url 保存、 profile 画面に円形プレビュー表示。 uploadPct 90 → 100 tween (gauge 針最上位)、 procSec 4 → 5 tween、 profileDb lane activate、 6 shape 全 active、 アバター更新完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "laptop", "uploadPage", "uploadSvc", "imgCdn", "profileDb").tween("uploadPct", 90, 100).tween("procSec", 4, 5).badge("確定"))
  .build();

/**
 * 118. prodLogTail v2 = SRE on-call 深夜 production 障害対応 4 phase シナリオ (通常運転 → 警告検知 → 障害発火 → 復旧完了)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (通常 → 警告 → 障害 → 復旧) + 4 readout (logStream / gauge 重篤度 / countup log/min / stat MTTR 分) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const prodLogTail = diagram("interactive-prod-log-tail", {
  topic: "SRE on-call 深夜 production 障害対応 4 phase = (通常 → 警告 → 障害 → 復旧) の flow を shape-* primitive 6 種で表現 + 4 readout (logStream / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("oncall", { lane: "sre", stack: 0, kind: "shape-person", title: "on-call SRE 中野様", eyebrow: "SRE", subtitle: "深夜対応 · 2 週交代" })
  .node("pager", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "PagerDuty + Terminal", eyebrow: "device", subtitle: "SSH + kubectl + log tail" })
  .node("prodCluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "prod k8s cluster", eyebrow: "prod", subtitle: "worker pod × 20 + web × 8" })
  .node("logForwarder", { lane: "service", stack: 1, kind: "shape-iot-sensor", title: "log forwarder", eyebrow: "sensor", subtitle: "全 pod log 集約 + level 判定" })
  .node("logSink", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "log SaaS (Datadog)", eyebrow: "sink", subtitle: "tail 画面 + alert 発報" })
  .node("logArchive", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "log archive (S3)", eyebrow: "storage", subtitle: "30 日保持 + 分析クエリ" })
  .edge("oncall", "pager", { label: "受信", tone: "info" })
  .edge("pager", "prodCluster", { label: "SSH", tone: "info" })
  .edge("prodCluster", "logForwarder", { label: "stream", tone: "info" })
  .edge("logForwarder", "logSink", { label: "route", tone: "success" })
  .edge("logSink", "logArchive", { label: "persist", tone: "accent" })
  .readout.logStream("ls", { source: "logs", label: "ログ tail" })
  .readout.gauge("sevG", { source: "severity", min: 0, max: 3, color: "#ef4444", label: "重篤度" })
  .readout.countup("lpmCU", { source: "logsPerMin", unit: " /min", label: "log/min", decimals: 0 })
  .readout.stat("mttrStat", { source: "mttr", unit: " 分", caption: "MTTR", label: "mttr" })
  .phase("p1", {
    duration: 1800,
    title: "通常運転 (23:00)",
    body: "中野様は待機状態、 prod cluster が INF ログのみ流す。 severity 0 keep、 logsPerMin 200 keep、 mttr 0 keep、 prodCluster + logForwarder + logSink lane active。",
  }, (p: PhaseBuilder) => p.activate("prodCluster", "logForwarder", "logSink").set("severity", 0).badge("通常"))
  .phase("p2", {
    duration: 2000,
    title: "警告発生 (01:03)",
    body: "メモリ 82% 継続で WRN 発報、 中野様 PagerDuty で起床。 severity 0 → 2 tween、 logsPerMin 200 → 450 tween、 mttr 0 → 2 tween、 oncall + pager lane activate。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink").tween("severity", 0, 2).tween("logsPerMin", 200, 450).tween("mttr", 0, 2).badge("警告"))
  .phase("p3", {
    duration: 2200,
    title: "障害発火 (01:47)",
    body: "worker OOM で ERR 発生、 中野様 SSH で状況確認 + hotfix rollout。 severity 2 → 3 tween、 logsPerMin 450 → 850 tween、 mttr 2 → 10 tween、 logArchive activate、 全 lane full active。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink", "logArchive").tween("severity", 2, 3).tween("logsPerMin", 450, 850).tween("mttr", 2, 10).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "復旧完了 (02:02)",
    body: "worker 再起動 + memory limit 引き上げ、 INF ログに戻る。 severity 3 → 0 tween (グリーン復帰)、 logsPerMin 850 → 220 tween、 mttr 10 → 15 tween (最終)、 6 shape 全 active、 postmortem 起票。",
  }, (p: PhaseBuilder) => p.activate("oncall", "pager", "prodCluster", "logForwarder", "logSink", "logArchive").tween("severity", 3, 0).tween("logsPerMin", 850, 220).tween("mttr", 10, 15).badge("復旧"))
  .build();

/**
 * 119. opsAlertBanner v2 = SaaS 運用 CPU 継続超過 alert エスカレ 4 phase シナリオ (info 検知 → warn 継続 → error 逸脱 → 対応済み)、 shape-person + shape-mobile-device + shape-iot-sensor + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (info → warn → error → 対応済) + 4 readout (alertBanner / gauge 重要度 / countup Ack 数 / stat 対応秒) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const opsAlertBanner = diagram("interactive-ops-alert-banner", {
  topic: "SaaS 運用 CPU 継続超過 alert エスカレ 4 phase = (info → warn → error → 対応済) の flow を shape-* primitive 6 種で表現 + 4 readout (alertBanner / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("operator", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("alert", [3, "CPU 92% を 5 分継続 — 調査要"] as unknown as (string | number)[])
  .state("sev", { initial: 0 })
  .state("ackCount", { initial: 0 })
  .state("responseSec", { initial: 0 })
  .node("opsUser", { lane: "operator", stack: 0, kind: "shape-person", title: "運用 大野様", eyebrow: "ops", subtitle: "日勤当番 + PagerDuty 受信" })
  .node("phone", { lane: "operator", stack: 1, kind: "shape-mobile-device", title: "PagerDuty app", eyebrow: "device", subtitle: "banner 表示 + Ack ボタン" })
  .node("sensor", { lane: "service", stack: 0, kind: "shape-iot-sensor", title: "Prometheus exporter", eyebrow: "sensor", subtitle: "CPU / mem / disk 15s scrape" })
  .node("prodWeb", { lane: "service", stack: 1, kind: "shape-server-rack", title: "prod-web-3", eyebrow: "prod", subtitle: "対象 pod · CPU 逼迫中" })
  .node("alertMgr", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "AlertManager", eyebrow: "alert", subtitle: "sev エスカレ + Slack 通知" })
  .node("incDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "incident DB", eyebrow: "storage", subtitle: "履歴 + MTTA / MTTR 追跡" })
  .edge("opsUser", "phone", { label: "受信", tone: "info" })
  .edge("phone", "alertMgr", { label: "Ack", tone: "info" })
  .edge("sensor", "prodWeb", { label: "scrape", tone: "info" })
  .edge("sensor", "alertMgr", { label: "fire", tone: "warning" })
  .edge("alertMgr", "incDb", { label: "persist", tone: "accent" })
  .readout.alertBanner("ab", { source: "alert", label: "アラート" })
  .readout.gauge("sevG", { source: "sev", min: 0, max: 3, color: "#ef4444", label: "重要度" })
  .readout.countup("ackCU", { source: "ackCount", unit: " 件", label: "Ack 累計", decimals: 0 })
  .readout.stat("resStat", { source: "responseSec", unit: " 秒", caption: "対応時間", label: "res" })
  .phase("p1", {
    duration: 1500,
    title: "info 検知",
    body: "sensor で CPU 85% 検知、 alertMgr が info 発報、 大野様 dashboard で確認。 sev 0 keep、 ackCount 0 → 1 tween、 responseSec 0 → 5 tween、 sensor + prodWeb + alertMgr lane active。",
  }, (p: PhaseBuilder) => p.activate("sensor", "prodWeb", "alertMgr").set("sev", 0).tween("ackCount", 0, 1).tween("responseSec", 0, 5).badge("info"))
  .phase("p2", {
    duration: 1800,
    title: "warn 継続",
    body: "CPU 92% で 5 分継続、 alertMgr が warn エスカレ、 大野様 PagerDuty banner 受信。 sev 0 → 2 tween、 ackCount 1 → 2 tween、 responseSec 5 → 30 tween、 opsUser + phone lane activate。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr").tween("sev", 0, 2).tween("ackCount", 1, 2).tween("responseSec", 5, 30).badge("warn"))
  .phase("p3", {
    duration: 2000,
    title: "error 逸脱",
    body: "対応期限 15 分超過で error エスカレ、 上長召集 + hotfix 準備。 sev 2 → 3 tween、 ackCount 2 → 3 tween、 responseSec 30 → 120 tween、 incDb activate、 全 lane full。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr", "incDb").tween("sev", 2, 3).tween("ackCount", 2, 3).tween("responseSec", 30, 120).badge("error"))
  .phase("p4", {
    duration: 2000,
    title: "対応済み",
    body: "auto-scale 発火 + hotfix rollout、 CPU 65% に落着き alert 解除。 sev 3 → 0 tween (グリーン復帰)、 ackCount 3 → 4 tween、 responseSec 120 → 180 tween (最終)、 6 shape 全 active、 postmortem 予約。",
  }, (p: PhaseBuilder) => p.activate("opsUser", "phone", "sensor", "prodWeb", "alertMgr", "incDb").tween("sev", 3, 0).tween("ackCount", 3, 4).tween("responseSec", 120, 180).badge("対応済"))
  .build();

/**
 * 120. serviceHealthGrid v2 = SaaS platform 6 microservice health matrix 4 phase シナリオ (全稼働 → db 劣化 → queue 障害 → 復旧)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (全稼働 → 劣化 → 障害 → 復旧) + 4 readout (serviceHealth / gauge healthy 率 / countup incident 数 / stat uptime %) が tween で visually 連続変化。 iteration 8 wave 8-N redesign。
 */
export const serviceHealthGrid = diagram("interactive-service-health-grid", {
  topic: "SaaS platform 6 microservice health matrix 4 phase = (全稼働 → 劣化 → 障害 → 復旧) の flow を shape-* primitive 6 種で表現 + 4 readout (serviceHealth / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "SRE リーダー 江口様", eyebrow: "SRE", subtitle: "6 svc 監視 + on-call rotate" })
  .node("dash", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "status dashboard", eyebrow: "device", subtitle: "6 svc grid + health signal" })
  .node("cluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "prod k8s cluster", eyebrow: "prod", subtitle: "6 microservice deploy + ingress" })
  .node("healthSensor", { lane: "service", stack: 1, kind: "shape-iot-sensor", title: "healthcheck sensor", eyebrow: "sensor", subtitle: "各 svc /healthz 15s 判定" })
  .node("statusPage", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "public status page", eyebrow: "status", subtitle: "顧客向け uptime 表示" })
  .node("slaDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "SLA 履歴 DB", eyebrow: "storage", subtitle: "incident + downtime 集計" })
  .edge("sre", "dash", { label: "監視", tone: "info" })
  .edge("dash", "healthSensor", { label: "poll", tone: "info" })
  .edge("healthSensor", "cluster", { label: "probe", tone: "info" })
  .edge("healthSensor", "statusPage", { label: "publish", tone: "success" })
  .edge("healthSensor", "slaDb", { label: "log", tone: "accent" })
  .readout.serviceHealth("sh", { source: "svcs", label: "サービス (6)" })
  .readout.gauge("healthG", { source: "healthy", min: 0, max: 6, color: "#22c55e", label: "healthy 数" })
  .readout.countup("incCU", { source: "incidentCount", unit: " 件", label: "incident 累計", decimals: 0 })
  .readout.stat("uptStat", { source: "uptime", unit: " %", caption: "uptime", label: "up" })
  .phase("p1", {
    duration: 1500,
    title: "全稼働 (6/6 healthy)",
    body: "全 svc up、 status page green、 江口様待機。 healthy 6 keep、 incidentCount 0 keep、 uptime 100 keep、 sre + dash + cluster + healthSensor + statusPage lane active。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage").badge("全稼働"))
  .phase("p2", {
    duration: 1800,
    title: "db + cache 劣化",
    body: "db レプリカ遅延 + cache eviction 頻発、 2 svc が degraded。 healthy 6 → 4 tween、 incidentCount 0 → 1 tween、 uptime 100 → 99.5 tween、 status page yellow warning。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage").tween("healthy", 6, 4).tween("incidentCount", 0, 1).tween("uptime", 100, 99.5).badge("劣化"))
  .phase("p3", {
    duration: 2000,
    title: "queue 障害 (cascade)",
    body: "queue 完全 down、 db との cascade で status page red。 healthy 4 → 3 tween、 incidentCount 1 → 2 tween、 uptime 99.5 → 98 tween、 slaDb activate、 全 lane full。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "slaDb").tween("healthy", 4, 3).tween("incidentCount", 1, 2).tween("uptime", 99.5, 98).badge("障害"))
  .phase("p4", {
    duration: 2000,
    title: "全復旧",
    body: "hotfix rollout + queue 再起動で全 svc up、 status page green 復帰。 healthy 3 → 6 tween、 incidentCount 2 keep、 uptime 98 → 99.7 tween (下方修正)、 6 shape 全 active、 SLA report 生成。",
  }, (p: PhaseBuilder) => p.activate("sre", "dash", "cluster", "healthSensor", "statusPage", "slaDb").tween("healthy", 3, 6).tween("uptime", 98, 99.7).badge("復旧"))
  .build();

/**
 * 121. checkoutCartSummary v2 = EC ショッピングカート checkout 4 phase シナリオ (商品追加 → 送料計算 → クーポン → 決済確定)、 shape-person + shape-mobile-device + shape-online-shop + shape-warehouse + shape-brokerage + shape-cylinder の 6 shape で visual scene 化、 4 phase (商品追加 → 送料 → クーポン → 決済) + 4 readout (cartSummary / gauge 予算消費率 / countup 商品点数 / stat 節約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const checkoutCartSummary = diagram("interactive-checkout-cart-summary", {
  topic: "EC ショッピングカート checkout 4 phase = (商品追加 → 送料 → クーポン → 決済) の flow を shape-* primitive 6 種で表現 + 4 readout (cartSummary / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("cart", [3, 149.85, 8.5, 158.35])
  .state("total", { initial: 0 })
  .state("budgetPct", { initial: 0 })
  .state("itemCount", { initial: 0 })
  .state("savedAmt", { initial: 0 })
  .node("shopper", { lane: "buyer", stack: 0, kind: "shape-person", title: "shopper 木崎様", eyebrow: "buyer", subtitle: "夜のオンライン買い物中" })
  .node("mobile", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhone EC app", eyebrow: "device", subtitle: "カート + 決済 UI" })
  .node("ecSite", { lane: "service", stack: 0, kind: "shape-online-shop", title: "EC サイト", eyebrow: "shop", subtitle: "商品追加 + カート更新" })
  .node("warehouse", { lane: "service", stack: 1, kind: "shape-warehouse", title: "配送センター", eyebrow: "warehouse", subtitle: "在庫確認 + 送料計算" })
  .node("payment", { lane: "outcome", stack: 0, kind: "shape-brokerage", title: "決済 gateway", eyebrow: "payment", subtitle: "Stripe / PayPay / カード" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文 DB", eyebrow: "storage", subtitle: "確定注文 + 履歴保存" })
  .edge("shopper", "mobile", { label: "選ぶ", tone: "info" })
  .edge("mobile", "ecSite", { label: "add to cart", tone: "info" })
  .edge("ecSite", "warehouse", { label: "送料確認", tone: "success" })
  .edge("ecSite", "payment", { label: "決済", tone: "accent" })
  .edge("payment", "orderDb", { label: "confirm", tone: "success" })
  .readout.cartSummary("cs", { source: "cart", currency: "$", colorTotal: "#2563eb", label: "カート合計" })
  .readout.gauge("budG", { source: "budgetPct", min: 0, max: 100, color: "#22c55e", label: "予算消費率" })
  .readout.countup("itemCU", { source: "itemCount", unit: " 点", label: "商品点数", decimals: 0 })
  .readout.stat("savStat", { source: "savedAmt", unit: " $", caption: "節約額", label: "saved" })
  .phase("p1", {
    duration: 1800,
    title: "商品追加 (3 点 $149.85)",
    body: "木崎様がジャケット + 書籍 + ケーブルをカート追加、 EC サイトで小計反映。 total 0 → 149.85 tween、 budgetPct 0 → 75 tween、 itemCount 0 → 3 tween、 savedAmt 0 keep、 shopper + mobile + ecSite lane active。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite").tween("total", 0, 149.85).tween("budgetPct", 0, 75).tween("itemCount", 0, 3).badge("追加"))
  .phase("p2", {
    duration: 1800,
    title: "送料計算 (+$8.50)",
    body: "配送センター在庫確認 → 標準 3 日配送 $8.50 適用。 total 149.85 → 158.35 tween、 budgetPct 75 → 79 tween、 warehouse lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse").tween("total", 149.85, 158.35).tween("budgetPct", 75, 79).badge("送料"))
  .phase("p3", {
    duration: 1800,
    title: "クーポン (-$15)",
    body: "'SAVE15' クーポン適用、 割引反映。 total 158.35 → 143.35 tween、 budgetPct 79 → 72 tween、 savedAmt 0 → 15 tween、 割引効果 visible。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse").tween("total", 158.35, 143.35).tween("budgetPct", 79, 72).tween("savedAmt", 0, 15).badge("クーポン"))
  .phase("p4", {
    duration: 2000,
    title: "決済確定",
    body: "決済 gateway で Stripe 決済 → 注文 DB に確定注文 flush。 total 143.35 keep、 budgetPct 72 keep、 itemCount 3 keep、 savedAmt 15 keep、 payment + orderDb lane activate、 6 shape 全 active、 注文完遂。",
  }, (p: PhaseBuilder) => p.activate("shopper", "mobile", "ecSite", "warehouse", "payment", "orderDb").badge("決済"))
  .build();

/**
 * 122. saasPricingTier v2 = 中規模 startup CTO の SaaS プラン選定 4 phase シナリオ (Starter 検討 → チーム拡大 → Pro upgrade → Enterprise 見積)、 shape-person + shape-mobile-device + shape-website + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Starter → 拡大 → Pro → Enterprise) + 4 readout (pricingTier / gauge 席数消化 / countup 月額 / stat 年間契約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const saasPricingTier = diagram("interactive-saas-pricing-tier", {
  topic: "startup CTO の SaaS プラン選定 4 phase = (Starter → 拡大 → Pro → Enterprise) の flow を shape-* primitive 6 種で表現 + 4 readout (pricingTier / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("cto", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("plan", ["Pro", 29, "10 席", "優先サポート", "カスタムドメイン"] as unknown as (string | number)[])
  .state("selected", { initial: 0 })
  .state("seatUsage", { initial: 0 })
  .state("monthlyFee", { initial: 9 })
  .state("annualFee", { initial: 108 })
  .node("cto", { lane: "cto", stack: 0, kind: "shape-person", title: "startup CTO 千葉様", eyebrow: "cto", subtitle: "20 名 eng team + growth 中" })
  .node("laptop", { lane: "cto", stack: 1, kind: "shape-mobile-device", title: "MacBook + Notion", eyebrow: "device", subtitle: "SaaS ベンダー比較表" })
  .node("pricingPage", { lane: "service", stack: 0, kind: "shape-website", title: "SaaS pricing page", eyebrow: "pricing", subtitle: "3 tier + 機能比較 + 見積フォーム" })
  .node("billing", { lane: "service", stack: 1, kind: "shape-brokerage", title: "billing service", eyebrow: "billing", subtitle: "月次課金 + プロレート計算" })
  .node("invoiceMail", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "invoice email", eyebrow: "email", subtitle: "受領書 + 契約書 pdf 送付" })
  .node("contractDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "契約 DB", eyebrow: "storage", subtitle: "顧客別 subscription + 履歴" })
  .edge("cto", "laptop", { label: "調査", tone: "info" })
  .edge("laptop", "pricingPage", { label: "比較", tone: "info" })
  .edge("pricingPage", "billing", { label: "subscribe", tone: "success" })
  .edge("billing", "invoiceMail", { label: "receipt", tone: "info" })
  .edge("billing", "contractDb", { label: "persist", tone: "accent" })
  .readout.pricingTier("pt", { source: "plan", colorAccent: "#2563eb", currency: "$", label: "Pro プラン" })
  .readout.gauge("seatG", { source: "seatUsage", min: 0, max: 100, color: "#22c55e", label: "席数消化 %" })
  .readout.countup("feeCU", { source: "monthlyFee", unit: " $/月", label: "月額", decimals: 0 })
  .readout.stat("annStat", { source: "annualFee", unit: " $", caption: "年額", label: "annual" })
  .phase("p1", {
    duration: 1500,
    title: "Starter 検討 (3 席)",
    body: "team 3 名で Starter プラン ($9/月) 検討、 pricing page で機能表示確認。 selected 0 keep、 seatUsage 0 → 100 tween (3/3 満)、 monthlyFee 9 keep、 annualFee 108 keep、 cto + laptop + pricingPage lane active。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage").tween("seatUsage", 0, 100).badge("Starter"))
  .phase("p2", {
    duration: 2000,
    title: "チーム拡大 (席不足)",
    body: "採用で team 8 名に、 Starter 3 席では不足発生。 seatUsage 100 → 265 tween (超過)、 monthlyFee 9 keep、 alert 発報で upgrade 検討。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage").tween("seatUsage", 100, 265).badge("拡大"))
  .phase("p3", {
    duration: 2000,
    title: "Pro upgrade ($29/月)",
    body: "Pro plan (10 席 + 優先サポート) に upgrade、 billing で月次課金 + プロレート適用。 selected 0 → 1 tween、 seatUsage 265 → 80 tween (8/10)、 monthlyFee 9 → 29 tween、 annualFee 108 → 348 tween、 billing + invoiceMail lane activate。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "billing", "invoiceMail").tween("selected", 0, 1).tween("seatUsage", 265, 80).tween("monthlyFee", 9, 29).tween("annualFee", 108, 348).badge("Pro"))
  .phase("p4", {
    duration: 2000,
    title: "Enterprise 見積",
    body: "翌年 team 20 名到達で Enterprise 見積依頼、 CSM 経由でカスタム契約。 selected 1 → 2 tween、 seatUsage 80 → 100 tween、 monthlyFee 29 → 200 tween、 annualFee 348 → 2400 tween、 contractDb activate、 6 shape 全 active、 契約更新完遂。",
  }, (p: PhaseBuilder) => p.activate("cto", "laptop", "pricingPage", "billing", "invoiceMail", "contractDb").tween("selected", 1, 2).tween("seatUsage", 80, 100).tween("monthlyFee", 29, 200).tween("annualFee", 348, 2400).badge("Enterprise"))
  .build();

/**
 * 123. checkoutCouponApply v2 = EC ホリデー セール クーポン適用 4 phase シナリオ (キャンペーンメール → コード入力 → 適用 → 決済)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (メール受信 → 入力 → 適用 → 決済) + 4 readout (couponCode / gauge 割引 % / countup 適用回数 / stat 節約額) が tween で visually 連続変化。 iteration 8 wave 8-O redesign。
 */
export const checkoutCouponApply = diagram("interactive-checkout-coupon-apply", {
  topic: "EC ホリデー セール クーポン適用 4 phase = (メール受信 → 入力 → 適用 → 決済) の flow を shape-* primitive 6 種で表現 + 4 readout (couponCode / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("coupon", ["SAVE20", 20] as unknown as (string | number)[])
  .state("discount", { initial: 0 })
  .state("usageCount", { initial: 1245 })
  .state("savedAmt", { initial: 0 })
  .node("shopper", { lane: "buyer", stack: 0, kind: "shape-person", title: "shopper 藤田様", eyebrow: "buyer", subtitle: "ホリデーセール参加者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhone + Gmail", eyebrow: "device", subtitle: "キャンペーンメール受信" })
  .node("ecSite", { lane: "service", stack: 0, kind: "shape-online-shop", title: "EC checkout", eyebrow: "checkout", subtitle: "クーポンコード入力欄 + 割引反映" })
  .node("couponSvc", { lane: "service", stack: 1, kind: "shape-brokerage", title: "coupon 検証 svc", eyebrow: "coupon", subtitle: "有効期限 + 上限 + 割引率判定" })
  .node("marketing", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "marketing analytics", eyebrow: "analytics", subtitle: "usage 集計 + ROI 分析" })
  .node("couponDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "coupon DB", eyebrow: "storage", subtitle: "コード + 使用履歴 + 顧客別" })
  .edge("shopper", "phone", { label: "確認", tone: "info" })
  .edge("phone", "ecSite", { label: "適用", tone: "info" })
  .edge("ecSite", "couponSvc", { label: "検証", tone: "success" })
  .edge("couponSvc", "couponDb", { label: "persist", tone: "accent" })
  .edge("couponSvc", "marketing", { label: "aggregate", tone: "accent" })
  .readout.couponCode("cc", { source: "coupon", colorApplied: "#22c55e", label: "クーポン" })
  .readout.gauge("discG", { source: "discount", min: 0, max: 30, color: "#22c55e", label: "割引 %" })
  .readout.countup("usaCU", { source: "usageCount", unit: " 件", label: "累計適用", decimals: 0 })
  .readout.stat("savStat", { source: "savedAmt", unit: " $", caption: "節約額", label: "saved" })
  .phase("p1", {
    duration: 1500,
    title: "メール受信",
    body: "藤田様に SAVE20 キャンペーンメール到着。 discount 0 keep、 usageCount 1245 keep、 savedAmt 0 keep、 shopper + phone lane active、 checkout 未到達。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone").badge("メール"))
  .phase("p2", {
    duration: 1800,
    title: "コード入力",
    body: "EC 画面 checkout でコード欄に 'SAVE20' 入力、 適用ボタン待機。 discount 0 keep、 ecSite lane activate、 dropzone 実線化。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite").badge("入力"))
  .phase("p3", {
    duration: 2000,
    title: "適用",
    body: "coupon 検証 svc で有効期限 + 上限確認 → 20% 適用。 discount 0 → 20 tween (gauge 針上振れ)、 usageCount 1245 → 1246 tween、 savedAmt 0 → 32 tween、 couponSvc + couponDb + marketing lane activate。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite", "couponSvc", "couponDb", "marketing").tween("discount", 0, 20).tween("usageCount", 1245, 1246).tween("savedAmt", 0, 32).badge("適用"))
  .phase("p4", {
    duration: 1800,
    title: "決済確定",
    body: "割引反映後の合計で決済実行、 marketing analytics に用途 log 反映。 discount 20 keep、 usageCount 1246 keep、 savedAmt 32 keep、 6 shape 全 active、 clip 完了 + 顧客満足。",
  }, (p: PhaseBuilder) => p.activate("shopper", "phone", "ecSite", "couponSvc", "couponDb", "marketing").badge("決済"))
  .build();

/**
 * 124. blogArticlePreview v2 = 週末読書中の tech blog 閲覧 4 phase シナリオ (feed 一覧 → hover 興味 → クリック閲覧 → シェア)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (feed → hover → 閲覧 → シェア) + 4 readout (articlePreview / gauge engagement / countup 閲覧数 / stat 平均滞在秒) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。
 */
export const blogArticlePreview = diagram("interactive-blog-article-preview", {
  topic: "週末 tech blog 閲覧 4 phase = (feed → hover → 閲覧 → シェア) の flow を shape-* primitive 6 種で表現 + 4 readout (articlePreview / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("reader", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("article", ["dragon 入門", "dragon で interactive diagram を作る方法を解説", "Alice", "2 時間前"] as unknown as (string | number)[])
  .state("hovered", { initial: 0 })
  .state("engagement", { initial: 0 })
  .state("viewCount", { initial: 128 })
  .state("dwellSec", { initial: 0 })
  .node("reader", { lane: "reader", stack: 0, kind: "shape-person", title: "週末 reader 森本様", eyebrow: "reader", subtitle: "tech blog subscribe user" })
  .node("laptop", { lane: "reader", stack: 1, kind: "shape-mobile-device", title: "iPad browser", eyebrow: "device", subtitle: "feed reader + tab 複数" })
  .node("blog", { lane: "service", stack: 0, kind: "shape-website", title: "tech blog (Zenn 系)", eyebrow: "blog", subtitle: "記事 card feed + タグ検索" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "blog CDN edge", eyebrow: "cdn", subtitle: "近い edge から画像 + 本文配信" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "GA4 analytics", eyebrow: "analytics", subtitle: "view + engagement + dwell 集計" })
  .node("readerDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "reader DB", eyebrow: "storage", subtitle: "閲覧履歴 + like + save" })
  .edge("reader", "laptop", { label: "起動", tone: "info" })
  .edge("laptop", "blog", { label: "GET", tone: "info" })
  .edge("blog", "cdnEdge", { label: "cache", tone: "success" })
  .edge("blog", "analytics", { label: "track", tone: "accent" })
  .edge("analytics", "readerDb", { label: "persist", tone: "success" })
  .readout.articlePreview("ap", { source: "article", colorAccent: "#2563eb", label: "記事 card" })
  .readout.gauge("engG", { source: "engagement", min: 0, max: 100, color: "#22c55e", label: "engagement %" })
  .readout.countup("viewCU", { source: "viewCount", unit: " view", label: "累計閲覧", decimals: 0 })
  .readout.stat("dwellStat", { source: "dwellSec", unit: " 秒", caption: "滞在時間", label: "dwell" })
  .phase("p1", {
    duration: 1500,
    title: "feed 一覧 (初期表示)",
    body: "森本様が blog feed を開き、 記事 card 3 件が表示。 hovered 0 keep、 engagement 0 → 10 tween、 viewCount 128 keep、 dwellSec 0 → 2 tween、 reader + laptop + blog + cdnEdge lane active。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge").tween("engagement", 0, 10).tween("dwellSec", 0, 2).badge("feed"))
  .phase("p2", {
    duration: 1800,
    title: "hover (興味湧く)",
    body: "'dragon 入門' の card にマウス hover、 excerpt 拡大表示 + title 濃青。 hovered 0 → 1 tween、 engagement 10 → 35 tween、 dwellSec 2 → 8 tween、 analytics で hover event 記録。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics").tween("hovered", 0, 1).tween("engagement", 10, 35).tween("dwellSec", 2, 8).badge("hover"))
  .phase("p3", {
    duration: 2200,
    title: "クリック閲覧",
    body: "click で記事詳細ページ、 本文 + 図読解、 スクロール完読。 hovered 1 keep、 engagement 35 → 75 tween、 viewCount 128 → 129 tween、 dwellSec 8 → 120 tween、 readerDb 反映。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics", "readerDb").tween("engagement", 35, 75).tween("viewCount", 128, 129).tween("dwellSec", 8, 120).badge("閲覧"))
  .phase("p4", {
    duration: 2000,
    title: "シェア (共感)",
    body: "内容良かったので X + Slack でシェア、 engagement 高値到達。 engagement 75 → 92 tween、 viewCount 129 → 130 tween、 dwellSec 120 → 135 tween、 6 shape 全 active、 blog engagement loop 完遂。",
  }, (p: PhaseBuilder) => p.activate("reader", "laptop", "blog", "cdnEdge", "analytics", "readerDb").tween("engagement", 75, 92).tween("viewCount", 129, 130).tween("dwellSec", 120, 135).badge("シェア"))
  .build();

/**
 * 125. docsTocNav v2 = 新人エンジニア docs 深掘り学習 4 phase シナリオ (Intro → GS → Install → First diagram)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (H1 Intro → H2 GS → H3 Install → H3 First) + 4 readout (tocNav / gauge 学習進捗 / countup 訪問セクション / stat 学習分) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。
 */
export const docsTocNav = diagram("interactive-docs-toc-nav", {
  topic: "新人エンジニア docs 深掘り学習 4 phase = (Intro → GS → Install → First) の flow を shape-* primitive 6 種で表現 + 4 readout (tocNav / gauge / countup / stat) が tween で visually 連続変化",
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
  .node("newbie", { lane: "learner", stack: 0, kind: "shape-person", title: "新人 エンジニア山根様", eyebrow: "learner", subtitle: "dragon 初触り 学習中" })
  .node("browser", { lane: "learner", stack: 1, kind: "shape-mobile-device", title: "browser + タブ複数", eyebrow: "device", subtitle: "docs 検索 + サンプルコード試行" })
  .node("docsPage", { lane: "service", stack: 0, kind: "shape-website", title: "docs (dragon.dev)", eyebrow: "docs", subtitle: "階層 3 段 + アクティブ section 表示" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "docs CDN edge", eyebrow: "cdn", subtitle: "MDX ビルド後 + edge cache" })
  .node("learnAnalytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "learning analytics", eyebrow: "analytics", subtitle: "user 別進捗 + 完了率追跡" })
  .node("progressDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "progress DB", eyebrow: "storage", subtitle: "user_id → 訪問セクション + timestamp" })
  .edge("newbie", "browser", { label: "検索", tone: "info" })
  .edge("browser", "docsPage", { label: "GET", tone: "info" })
  .edge("docsPage", "cdnEdge", { label: "cache", tone: "success" })
  .edge("docsPage", "learnAnalytics", { label: "track", tone: "accent" })
  .edge("learnAnalytics", "progressDb", { label: "persist", tone: "success" })
  .readout.tocNav("tn", { source: "toc", colorActive: "#2563eb", label: "docs TOC" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "学習進捗 %" })
  .readout.countup("visCU", { source: "visitedCount", unit: " section", label: "訪問数", decimals: 0 })
  .readout.stat("learnStat", { source: "learnMin", unit: " 分", caption: "学習時間", label: "min" })
  .phase("p1", {
    duration: 1500,
    title: "Intro (H1)",
    body: "山根様が dragon docs Home 到達、 'はじめに' 読解。 activeIdx 0 keep、 progress 0 → 20 tween、 visitedCount 0 → 1 tween、 learnMin 0 → 5 tween、 newbie + browser + docsPage + cdnEdge lane active。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge").tween("progress", 0, 20).tween("visitedCount", 0, 1).tween("learnMin", 0, 5).badge("Intro"))
  .phase("p2", {
    duration: 2000,
    title: "GS (H2)",
    body: "スタートガイドへ移動、 概要 + 前提知識確認。 activeIdx 0 → 1 tween、 progress 20 → 45 tween、 visitedCount 1 → 2 tween、 learnMin 5 → 18 tween、 learnAnalytics + progressDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb").tween("activeIdx", 0, 1).tween("progress", 20, 45).tween("visitedCount", 1, 2).tween("learnMin", 5, 18).badge("GS"))
  .phase("p3", {
    duration: 2000,
    title: "Install (H3)",
    body: "GS 内 'インストール' サブセクションへ、 pnpm install + config 実行。 activeIdx 1 → 2 tween、 progress 45 → 72 tween、 visitedCount 2 → 3 tween、 learnMin 18 → 32 tween、 実サンプル動作確認。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb").tween("activeIdx", 1, 2).tween("progress", 45, 72).tween("visitedCount", 2, 3).tween("learnMin", 18, 32).badge("Install"))
  .phase("p4", {
    duration: 2200,
    title: "First diagram (H3)",
    body: "'最初の diagram' で実際に code 書いて動作確認、 progressDb に完了 flag 記録。 activeIdx 2 → 3 tween、 progress 72 → 95 tween (gauge 針最上位近く)、 visitedCount 3 → 4 tween、 learnMin 32 → 55 tween、 6 shape 全 active、 学習ゴール到達。",
  }, (p: PhaseBuilder) => p.activate("newbie", "browser", "docsPage", "cdnEdge", "learnAnalytics", "progressDb").tween("activeIdx", 2, 3).tween("progress", 72, 95).tween("visitedCount", 3, 4).tween("learnMin", 32, 55).badge("First"))
  .build();

/**
 * 126. socialShareButtons v2 = tech blog 記事シェア 1 週間拡散 4 phase シナリオ (投稿直後 → X 拡散 → FB / LinkedIn 追随 → Reddit バズ定着)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Day 0 → Day 1 → Day 3 → Day 7) + 4 readout (shareButtons / gauge viral / countup total shares / stat reach 万人) が tween で visually 連続変化。 iteration 8 wave 8-P redesign。 iteration 7 完遂。
 */
export const socialShareButtons = diagram("interactive-social-share-buttons", {
  topic: "tech blog 記事シェア 1 週間拡散 4 phase = (Day 0 → Day 1 → Day 3 → Day 7) の flow を shape-* primitive 6 種で表現 + 4 readout (shareButtons / gauge / countup / stat) が tween で visually 連続変化",
})
  .lane("author", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("shares", [["tw", 245], ["fb", 89], ["li", 32], ["rd", 18]] as unknown as (string | number)[])
  .state("totalShares", { initial: 0 })
  .state("viralRate", { initial: 0 })
  .state("reachTenK", { initial: 0 })
  .node("author", { lane: "author", stack: 0, kind: "shape-person", title: "tech blogger 綾瀬様", eyebrow: "author", subtitle: "月次 1 本 tech 記事執筆" })
  .node("mobile", { lane: "author", stack: 1, kind: "shape-mobile-device", title: "iPhone SNS + 通知", eyebrow: "device", subtitle: "share 通知 + 反応追跡" })
  .node("blog", { lane: "service", stack: 0, kind: "shape-website", title: "blog + share widget", eyebrow: "blog", subtitle: "4 SNS ボタン + OGP 画像" })
  .node("cdnEdge", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "OGP CDN edge", eyebrow: "cdn", subtitle: "OGP 画像 + snippet 配信" })
  .node("socialGraph", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "social graph API", eyebrow: "graph", subtitle: "SNS 各 platform share count 集計" })
  .node("statsDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "share stats DB", eyebrow: "storage", subtitle: "時系列 share 履歴 + platform 別" })
  .edge("author", "mobile", { label: "投稿", tone: "info" })
  .edge("mobile", "blog", { label: "publish", tone: "info" })
  .edge("blog", "cdnEdge", { label: "OGP", tone: "success" })
  .edge("blog", "socialGraph", { label: "poll", tone: "accent" })
  .edge("socialGraph", "statsDb", { label: "persist", tone: "success" })
  .readout.shareButtons("sb", { source: "shares", label: "シェア 累計" })
  .readout.gauge("virG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral 度 %" })
  .readout.countup("totCU", { source: "totalShares", unit: " shares", label: "総 shares", decimals: 0 })
  .readout.stat("reachStat", { source: "reachTenK", unit: " 万人", caption: "reach", label: "reach" })
  .phase("p1", {
    duration: 1500,
    title: "Day 0 投稿直後",
    body: "綾瀬様が記事公開、 blog に share widget 表示、 まず自分の X で share。 totalShares 0 → 50 tween、 viralRate 0 → 15 tween、 reachTenK 0 → 1 tween、 author + mobile + blog + cdnEdge lane active。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge").tween("totalShares", 0, 50).tween("viralRate", 0, 15).tween("reachTenK", 0, 1).badge("Day 0"))
  .phase("p2", {
    duration: 2000,
    title: "Day 1 X 拡散",
    body: "有名エンジニアが RT、 X で急速拡散。 totalShares 50 → 200 tween、 viralRate 15 → 55 tween、 reachTenK 1 → 5 tween、 socialGraph + statsDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb").tween("totalShares", 50, 200).tween("viralRate", 15, 55).tween("reachTenK", 1, 5).badge("Day 1"))
  .phase("p3", {
    duration: 2000,
    title: "Day 3 FB / LinkedIn 追随",
    body: "エンジニア界隈で FB + LinkedIn share 追随、 プロ層に拡がる。 totalShares 200 → 330 tween、 viralRate 55 → 78 tween、 reachTenK 5 → 12 tween、 statsDb で platform 別集計蓄積。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb").tween("totalShares", 200, 330).tween("viralRate", 55, 78).tween("reachTenK", 5, 12).badge("Day 3"))
  .phase("p4", {
    duration: 2000,
    title: "Day 7 Reddit バズ定着",
    body: "Reddit r/programming に投稿されバズ、 週末に拡散が国際化。 totalShares 330 → 384 tween、 viralRate 78 → 92 tween (gauge 針最上位近く)、 reachTenK 12 → 20 tween、 6 shape 全 active、 1 週間拡散 完遂。",
  }, (p: PhaseBuilder) => p.activate("author", "mobile", "blog", "cdnEdge", "socialGraph", "statsDb").tween("totalShares", 330, 384).tween("viralRate", 78, 92).tween("reachTenK", 12, 20).badge("Day 7"))
  .build();

/**
 * 127. exemplar-payment-flow v2 = EC 決済の実業務シナリオ、 shape-* primitive (person / mobile / credit-card / online-shop / payment-provider / api-gateway / bank / cylinder) で visual scene 化、 4 phase (商品購入 → 3DS 認証 → 銀行確定 → 記帳) + 4 readout (stat 金額 / gauge 3DS / traffic-light 状態 / countup 累計) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 1。
 */
export const exemplarPaymentFlow = diagram("interactive-exemplar-payment-flow", {
  topic: "EC 決済実業務シナリオ = 4 phase (購入 → 3DS 認証 → 銀行確定 → 記帳) の flow を shape-* primitive 8 種で表現 + 4 readout が state を consume して visually 連続変化",
})
  .lane("customer", { x: 0, width: 220 })
  .lane("processor", { x: 240, width: 280 })
  .lane("bank", { x: 540, width: 220 })
  .state("amount", { initial: 0 })
  .state("auth3ds", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("totalTx", { initial: 1247 })
  .node("customer", { lane: "customer", stack: 0, kind: "shape-person", title: "田中様", eyebrow: "customer", subtitle: "購入者" })
  .node("mobile", { lane: "customer", stack: 1, kind: "shape-mobile-device", title: "iPhone 15", eyebrow: "device", subtitle: "Safari / iOS 17" })
  .node("card", { lane: "customer", stack: 2, kind: "shape-credit-card", title: "VISA **1234", eyebrow: "card", subtitle: "MUFG 発行" })
  .node("shop", { lane: "processor", stack: 0, kind: "shape-online-shop", title: "BuyNow.com", eyebrow: "merchant", subtitle: "checkout · ¥{amount}" })
  .node("gateway", { lane: "processor", stack: 1, kind: "shape-api-gateway", title: "API Gateway", eyebrow: "gateway", subtitle: "認証 + rate limit" })
  .node("provider", { lane: "processor", stack: 2, kind: "shape-payment-provider", title: "Stripe", eyebrow: "provider", subtitle: "3DS {auth3ds}%" })
  .node("bankShape", { lane: "bank", stack: 0, kind: "shape-bank", title: "MUFG", eyebrow: "issuer", subtitle: "発行銀行 · 与信照会" })
  .node("ledger", { lane: "bank", stack: 1, kind: "shape-cylinder", title: "取引台帳", eyebrow: "database", subtitle: "記帳 + 監査 log" })
  .edge("customer", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "shop", { label: "購入", tone: "info" })
  .edge("shop", "gateway", { label: "POST /pay", tone: "info" })
  .edge("gateway", "provider", { label: "転送", tone: "info" })
  .edge("card", "provider", { label: "3DS 認証", tone: "accent" })
  .edge("provider", "bankShape", { label: "決済要求", tone: "success" })
  .edge("bankShape", "ledger", { label: "記帳", tone: "success" })
  .readout.stat("amountStat", { source: "amount", unit: " 円", caption: "決済金額", label: "金額" })
  .readout.gauge("authGauge", { source: "auth3ds", min: 0, max: 100, color: "#22c55e", label: "3DS 認証 %" })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "決済 status" })
  .readout.countup("totalCU", { source: "totalTx", unit: " 件", label: "本日累計 tx", decimals: 0 })
  .phase("p1", {
    duration: 2200,
    title: "商品購入",
    body: "田中様が iPhone で BuyNow.com にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop").tween("amount", 0, 12500).set("txStatus", 0).set("auth3ds", 0).badge("購入"))
  .phase("p2", {
    duration: 2500,
    title: "3DS 認証",
    body: "gateway 経由で Stripe に転送、 VISA カードの 3D-Secure 認証実行。 txStatus 0 → 1 tween (traffic-light 赤 → 黄)、 auth3ds 0 → 92% tween (gauge 針が緑域まで上昇)。 processor lane 全 activate、 card → provider の accent edge。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider").tween("txStatus", 0, 1).tween("auth3ds", 0, 92).badge("3DS 認証"))
  .phase("p3", {
    duration: 2000,
    title: "銀行確定",
    body: "認証通過、 発行銀行 MUFG に与信照会 + 決済確定。 txStatus 1 → 2 tween (traffic-light 黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 bank lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider", "bankShape").tween("txStatus", 1, 2).tween("auth3ds", 92, 98).badge("銀行確定"))
  .phase("p4", {
    duration: 1800,
    title: "記帳完了",
    body: "銀行が取引台帳に記帳 + 監査 log 記録、 totalTx 1247 → 1248 tween (countup が +1 加算表示、 800ms かけて動的 count up)、 全 8 shape active、 決済 flow 完遂。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "card", "shop", "gateway", "provider", "bankShape", "ledger").tween("totalTx", 1247, 1248).set("txStatus", 2).badge("記帳完了"))
  .build();

/**
 * 128. exemplar-login-flow v2 = 実 login 認証 + 2FA + セッション発行シナリオ、 shape-* primitive (mobile-device / person / server-rack / hexagon / diamond / cylinder / cloud) で visual scene 化、 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) + 4 readout (traffic-light / countup / gauge / bar) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 2。
 */
export const exemplarLoginFlow = diagram("interactive-exemplar-login-flow", {
  topic: "login + 2FA 実業務シナリオ = 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して visually 連続変化",
})
  .lane("user", { x: 0, width: 200 })
  .lane("auth", { x: 220, width: 300 })
  .lane("session", { x: 540, width: 220 })
  .state("authStatus", { initial: 0 })
  .state("successLogin", { initial: 8421 })
  .state("failRate", { initial: 100 })
  .state("latency", { initial: 0 })
  .node("customer", { lane: "user", stack: 0, kind: "shape-person", title: "山田様", eyebrow: "user", subtitle: "email + password 送信" })
  .node("mobile", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "Pixel 8", eyebrow: "device", subtitle: "Chrome / Android 14" })
  .node("authApi", { lane: "auth", stack: 0, kind: "shape-server-rack", title: "Auth API", eyebrow: "server", subtitle: "credential 一次検証" })
  .node("mfaCheck", { lane: "auth", stack: 1, kind: "shape-diamond", title: "2FA 要求?", eyebrow: "decision", subtitle: "TOTP 6 桁 or SMS" })
  .node("jwtSign", { lane: "auth", stack: 2, kind: "shape-hexagon", title: "JWT 発行器", eyebrow: "signer", subtitle: "RS256 · exp 1h" })
  .node("session", { lane: "session", stack: 0, kind: "shape-cylinder", title: "Redis Session", eyebrow: "cache", subtitle: "TTL 3600s" })
  .node("token", { lane: "session", stack: 1, kind: "shape-cloud", title: "JWT token", eyebrow: "response", subtitle: "Bearer · 302 redirect" })
  .edge("customer", "mobile", { label: "入力", tone: "info" })
  .edge("mobile", "authApi", { label: "POST /login", tone: "info" })
  .edge("authApi", "mfaCheck", { label: "一次 OK", tone: "success" })
  .edge("mfaCheck", "jwtSign", { label: "2FA OK", tone: "success" })
  .edge("jwtSign", "session", { label: "sid 保存", tone: "success" })
  .edge("session", "token", { label: "token 発行", tone: "success" })
  .readout.trafficLight("statusTL", { source: "authStatus", label: "認証 status (0/1/2)" })
  .readout.countup("successCU", { source: "successLogin", unit: " 回", label: "本日成功ログイン" })
  .readout.gauge("rateGauge", { source: "failRate", min: 0, max: 100, color: "#22c55e", label: "成功率 %" })
  .readout.bar("latencyBar", { source: "latency", min: 0, max: 500, color: "#f97316", label: "応答時間 ms" })
  .phase("p1", {
    duration: 1500,
    title: "認証要求",
    body: "山田様が Pixel でログイン画面に credential 送信。 authStatus = 0 (traffic-light 赤 = 未検証)、 latency 0 → 80ms tween (bar 立ち上がり)、 gauge 100%、 countup 保持。 user lane 全 active。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile").set("authStatus", 0).tween("latency", 0, 80).badge("要求"))
  .phase("p2", {
    duration: 2000,
    title: "一次検証",
    body: "Auth API が credential 照合、 hash 比較。 authStatus 0 → 1 tween (traffic-light 赤 → 黄)、 latency 80 → 220ms tween (bcrypt で bar 伸長)、 gauge 100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck").tween("authStatus", 0, 1).tween("latency", 80, 220).tween("failRate", 100, 99).badge("一次検証"))
  .phase("p3", {
    duration: 2200,
    title: "2FA 検証",
    body: "TOTP 6 桁認証、 認証サーバが time-window 比較。 authStatus 1 → 1 保持 (traffic-light 黄)、 latency 220 → 350ms tween (2FA overhead で bar さらに伸長)、 mfaCheck diamond が pending 状態。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck").set("authStatus", 1).tween("latency", 220, 350).badge("2FA"))
  .phase("p4", {
    duration: 2000,
    title: "セッション発行",
    body: "2FA 通過、 JWT 発行 + Redis に session 保存。 authStatus 1 → 2 tween (traffic-light 黄 → 緑)、 latency 350 → 180ms tween (bar 縮小)、 gauge 99 → 99% 維持、 jwtSign + session lane activate。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session").tween("authStatus", 1, 2).tween("latency", 350, 180).badge("発行"))
  .phase("p5", {
    duration: 1800,
    title: "応答返却",
    body: "JWT token を Bearer header で返却、 302 redirect。 successLogin 8421 → 8422 tween (countup が +1 加算表示、 900ms かけて動的)、 latency 180 → 50ms tween (最終)、 全 7 shape active。",
  }, (p: PhaseBuilder) => p.activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session", "token").tween("successLogin", 8421, 8422).tween("latency", 180, 50).set("authStatus", 2).badge("応答"))
  .build();

/**
 * 129. exemplar-notification-flow v2 = 実 push 通知配信 (message → queue → service → fan-out → device / retry) シナリオ、 shape-* primitive (message-bubble / stack / cloud / diamond / mobile-device × 3) で visual scene 化、 5 phase (event 発火 → キューイング → 配信中 → 到達 → リトライ) + 4 readout (bar / countup / gauge / stat) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 3。
 */
export const exemplarNotificationFlow = diagram("interactive-exemplar-notification-flow", {
  topic: "push 通知配信 + retry 実業務シナリオ = 5 phase (発火 → キュー → 配信 → 到達 → retry) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して visually 連続変化",
})
  .lane("origin", { x: 0, width: 200 })
  .lane("infra", { x: 220, width: 280 })
  .lane("devices", { x: 520, width: 240 })
  .state("queued", { initial: 0 })
  .state("delivered", { initial: 0 })
  .state("failed", { initial: 0 })
  .state("deliveryRate", { initial: 0 })
  .node("msg", { lane: "origin", stack: 0, kind: "shape-message-bubble", title: "新着 message", eyebrow: "trigger", subtitle: "\"注文が発送されました\"" })
  .node("kafka", { lane: "infra", stack: 0, kind: "shape-stack", title: "Kafka キュー", eyebrow: "queue", subtitle: "残 {queued} 件 · TTL 300s" })
  .node("fcm", { lane: "infra", stack: 1, kind: "shape-cloud", title: "FCM Service", eyebrow: "notification", subtitle: "配信 batch 処理" })
  .node("retryGate", { lane: "infra", stack: 2, kind: "shape-diamond", title: "retry 判定", eyebrow: "policy", subtitle: "指数 backoff · 最大 3 回" })
  .node("iphone", { lane: "devices", stack: 0, kind: "shape-mobile-device", title: "iPhone (A)", eyebrow: "device", subtitle: "APNs 経由 · foreground" })
  .node("pixel", { lane: "devices", stack: 1, kind: "shape-mobile-device", title: "Pixel (B)", eyebrow: "device", subtitle: "FCM 経由 · background" })
  .node("galaxy", { lane: "devices", stack: 2, kind: "shape-mobile-device", title: "Galaxy (C)", eyebrow: "device", subtitle: "圏外 → retry 対象" })
  .edge("msg", "kafka", { label: "enqueue", tone: "info" })
  .edge("kafka", "fcm", { label: "dequeue", tone: "info" })
  .edge("fcm", "iphone", { label: "APNs 配信", tone: "success" })
  .edge("fcm", "pixel", { label: "FCM 配信", tone: "success" })
  .edge("fcm", "galaxy", { label: "初回失敗", tone: "error" })
  .edge("galaxy", "retryGate", { label: "retry 要求", tone: "warning" })
  .edge("retryGate", "fcm", { label: "再送指示", tone: "warning" })
  .readout.bar("queuedBar", { source: "queued", min: 0, max: 1000, color: "#f97316", label: "queue 残" })
  .readout.countup("deliveredCU", { source: "delivered", unit: " 件", label: "配信成功", decimals: 0 })
  .readout.gauge("rateGauge", { source: "deliveryRate", min: 0, max: 100, color: "#22c55e", label: "配信成功率 %" })
  .readout.stat("failedStat", { source: "failed", unit: " 件", caption: "リトライ待ち", label: "失敗" })
  .phase("p1", {
    duration: 1800,
    title: "event 発火",
    body: "注文発送 event が発生、 message-bubble から Kafka キューに enqueue。 queued 0 → 1000 tween (bar が右に伸長)、 delivered = 0、 failed = 0、 deliveryRate = 0% (gauge 針最下)。 origin + queue が active。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka").tween("queued", 0, 1000).set("delivered", 0).set("failed", 0).set("deliveryRate", 0).badge("発火"))
  .phase("p2", {
    duration: 2000,
    title: "キューイング",
    body: "batch 化された 1000 件が処理待ち、 FCM Service が dequeue 開始。 queued 1000 → 800 tween (bar 縮小開始)、 fcm lane activate、 kafka → fcm edge が info tone で信号伝達。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm").tween("queued", 1000, 800).badge("キュー"))
  .phase("p3", {
    duration: 2500,
    title: "配信中",
    body: "FCM が iPhone / Pixel / Galaxy へ fan-out 配信。 queued 800 → 50 tween (bar 大幅縮小)、 delivered 0 → 920 tween (countup が加速的 count up、 500/s peak)、 failed 0 → 80 tween、 deliveryRate 0 → 92% tween (gauge 針上昇)。 3 device 全 activate、 Galaxy は失敗 edge (error tone)。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy").tween("queued", 800, 50).tween("delivered", 0, 920).tween("failed", 0, 80).tween("deliveryRate", 0, 92).badge("配信"))
  .phase("p4", {
    duration: 1800,
    title: "初回到達",
    body: "iPhone + Pixel は成功受信、 Galaxy は圏外で失敗。 queued 50 → 20 tween、 delivered 920 → 950 tween、 failed 80 → 50 tween、 deliveryRate 92 → 95% tween。 全 shape active。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy").tween("queued", 50, 20).tween("delivered", 920, 950).tween("failed", 80, 50).tween("deliveryRate", 92, 95).badge("到達"))
  .phase("p5", {
    duration: 2000,
    title: "リトライ",
    body: "失敗 50 件を retryGate が指数 backoff で再送、 Galaxy 圏内復帰後に配信成功。 queued 20 → 0 tween (bar 消失)、 delivered 950 → 992 tween (countup 最終)、 failed 50 → 8 tween (stat 減少)、 deliveryRate 95 → 99% tween (gauge 針最終)。 retryGate diamond が highlight。",
  }, (p: PhaseBuilder) => p.activate("msg", "kafka", "fcm", "retryGate", "iphone", "pixel", "galaxy").tween("queued", 20, 0).tween("delivered", 950, 992).tween("failed", 50, 8).tween("deliveryRate", 95, 99).badge("retry"))
  .build();
