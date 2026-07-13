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
  topic: "radialNodes(6, 90) で 6 spoke + hub → 6 spoke edge の 真の hub-and-spoke network diagram",
})
  .lane("l", { x: 0, width: 480 })
  .node("hub", { lane: "l", stack: 0, kind: "card", title: "Hub", subtitle: "center" })
  .radialNodes(6, 90, (i, angleDeg, ox, oy) => ({
    id: `spoke-{i}`,
    lane: "l",
    stack: i + 1,
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
 * 34. domain example = EIP-1559 gas cost model。
 *     slider で base fee → 3 block の実 gas cost が waterfall + stacked-bar で並列可視化。
 */
export const eip1559GasFlow = diagram("interactive-eip1559", {
  topic: "EIP-1559 gas cost model = 4-lane (Sender / Block1 / Block2 / Block3) を edge で gas propagation、 base fee slider で 3 block の total が chain 追随",
})
  .lane("sender", { x: 0, width: 180 })
  .lane("block1", { x: 260, width: 180 })
  .lane("block2", { x: 520, width: 180 })
  .lane("block3", { x: 780, width: 180 })
  .input.slider("baseFee", { min: 10, max: 200, defaultValue: 50, label: "Base fee (gwei)" })
  .input.slider("priority", { min: 1, max: 30, defaultValue: 5, label: "Priority tip" })
  .state("baseFee", { initial: 50 })
  .state("priority", { initial: 5 })
  .arraySignal("burned", [50, 60, 72])
  .arraySignal("tips", [5, 8, 10])
  .formula("total1", "baseFee + priority")
  .formula("total2", "(baseFee + priority) * 12 / 10")
  .formula("total3", "(baseFee + priority) * 15 / 10")
  .state("total1", { initial: 55 })
  .state("total2", { initial: 66 })
  .state("total3", { initial: 82 })
  .node("wallet", {
    lane: "sender",
    stack: 0,
    kind: "card",
    title: "Sender wallet",
    subtitle: "base {baseFee} + tip {priority} gwei",
  })
  .node("b1", {
    lane: "block1",
    stack: 0,
    kind: "card",
    title: "Block N",
    subtitle: "1.0x = {total1} gwei",
  })
  .node("b2", {
    lane: "block2",
    stack: 0,
    kind: "card",
    title: "Block N+1",
    subtitle: "1.2x = {total2} gwei",
  })
  .node("b3", {
    lane: "block3",
    stack: 0,
    kind: "card",
    title: "Block N+2",
    subtitle: "1.5x = {total3} gwei",
  })
  .edge("wallet", "b1", { label: "tx submit", sub: "base + tip", tone: "info" })
  .edge("b1", "b2", { label: "next block", sub: "+20% fee", tone: "warning" })
  .edge("b2", "b3", { label: "next block", sub: "+25% fee", tone: "error" })
  .readout.stackedBar("gas", { sourceA: "burned", sourceB: "tips", min: 0, max: 120, colorA: "#ef4444", colorB: "#22c55e", label: "Burned / Tip per block" })
  .phase("p", {
    duration: 1200,
    title: "EIP-1559 gas flow",
    body: "Sender → Block N → N+1 → N+2 の 4 lane、 slider で base + tip 変化 → formula chain で block2/3 の total gwei が逓増追随、 edge tone で cost escalation を可視化。",
  }, (p: PhaseBuilder) => p.activate("wallet", "b1", "b2", "b3").badge("EIP-1559"))
  .build();

/**
 * 35. domain example = OAuth 2.0 authorization code flow の sequence timeline。
 */
export const oauthFlow = diagram("interactive-oauth-flow", {
  topic: "OAuth 2.0 authorization code flow を 3-lane (User / Auth server / Resource server) + 6 event edge で node network 化、 latency は slider 追随",
})
  .lane("user", { x: 0, width: 220 })
  .lane("auth", { x: 320, width: 220 })
  .lane("resource", { x: 640, width: 220 })
  .input.slider("delay", { min: 0, max: 300, defaultValue: 50, label: "Server delay (ms)" })
  .state("delay", { initial: 50 })
  .arraySignal("events", [
    [0, "click"],
    [100, "redirect"],
    [200, "consent"],
    [350, "code"],
    [500, "token"],
    [650, "resp"],
  ] as unknown as (string | number)[])
  .node("client", {
    lane: "user",
    stack: 0,
    kind: "card",
    title: "Client browser",
    subtitle: "user agent",
  })
  .node("consent", {
    lane: "auth",
    stack: 0,
    kind: "card",
    title: "Auth server",
    subtitle: "delay {delay}ms",
  })
  .node("api", {
    lane: "resource",
    stack: 0,
    kind: "card",
    title: "Resource server",
    subtitle: "API endpoint",
  })
  .edge("client", "consent", { label: "1. redirect", sub: "with client_id", tone: "info" })
  .edge("consent", "client", { label: "2. consent screen", sub: "user approves", tone: "info", side: "left" })
  .edge("client", "consent", { id: "code-exchange", label: "3. code exchange", sub: "with code", tone: "accent" })
  .edge("consent", "client", { id: "token-issue", label: "4. token issued", sub: "access_token", tone: "success", side: "left" })
  .edge("client", "api", { label: "5. API call", sub: "Bearer token", tone: "accent" })
  .edge("api", "client", { label: "6. resp", sub: "protected data", tone: "success", side: "left" })
  .readout.sequenceTimeline("seq", { source: "events", min: 0, max: 700, viewW: 400, viewH: 60, color: "#2563eb", label: "Timeline" })
  .readout.stat("finalDelay", { source: "delay", unit: "ms", label: "Delay" })
  .phase("p", {
    duration: 1200,
    title: "OAuth flow",
    body: "3-lane (User / Auth / Resource) + 6 event edge で OAuth 2.0 code flow を node network 化、 sequence timeline と併記で時間軸 + 空間軸を dual 可視化。",
  }, (p: PhaseBuilder) => p.activate("client", "consent", "api").badge("OAuth"))
  .build();

/**
 * 36. domain example = tree diagram = decision tree 3 level (2^3 = 7 node)。
 */
export const decisionTree = diagram("interactive-decision-tree", {
  topic: "treeNodes(3, 2) で 7 node + 6 edge (parent → 2 children × 3 level) の 真の 2 分木 tree diagram",
})
  .lane("l", { x: 0, width: 480 })
  .treeNodes(3, 2, 70, 80, (level, pos, i, ox, oy) => ({
    id: `node-{i}`,
    lane: "l",
    stack: i,
    kind: "card" as const,
    title: `L{r}P{c}`,
    subtitle: `#{i}`,
    renderOffsetX: ox,
    renderOffsetY: oy - 100,
  }))
  // completely-binary tree: 0 -> 1,2 / 1 -> 3,4 / 2 -> 5,6
  .edge("node-0", "node-1", { label: "yes", tone: "success" })
  .edge("node-0", "node-2", { label: "no", tone: "error" })
  .edge("node-1", "node-3", { label: "yes", tone: "success" })
  .edge("node-1", "node-4", { label: "no", tone: "error" })
  .edge("node-2", "node-5", { label: "yes", tone: "success" })
  .edge("node-2", "node-6", { label: "no", tone: "error" })
  .phase("p", {
    duration: 1200,
    title: "decision tree",
    body: "treeNodes(3, 2) で 7 node + 6 edge の完全 2 分木、 parent → 2 children × 3 level を yes/no tone (success/error) 装飾で分岐を表現。",
  }, (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2", "node-3", "node-4", "node-5", "node-6").badge("decision tree"))
  .build();

/**
 * 37. radar chart = 5 skill dimensions を spider chart で表示。
 */
export const skillRadar = diagram("interactive-skill-radar", {
  topic: "5 skill を 3-lane (Strong ≥7 / Middle 5-6 / Weak <5) レベル別分散、 各 skill 個別 card + radar readout 併存",
})
  .lane("strong", { x: 0, width: 220 })
  .lane("middle", { x: 260, width: 220 })
  .lane("weak", { x: 520, width: 220 })
  .arraySignal("skills", [8, 5, 7, 3, 9])
  .arraySignal("skillNames", ["Design", "Impl", "Test", "Docs", "Debug"])
  .node("designNode", { lane: "strong", stack: 0, kind: "card", title: "Design", subtitle: "8/10 (strong)" })
  .node("testNode", { lane: "strong", stack: 1, kind: "card", title: "Test", subtitle: "7/10 (strong)" })
  .node("debugNode", { lane: "strong", stack: 2, kind: "card", title: "Debug", subtitle: "9/10 (max)" })
  .node("implNode", { lane: "middle", stack: 0, kind: "card", title: "Impl", subtitle: "5/10 (middle)" })
  .node("docsNode", { lane: "weak", stack: 0, kind: "card", title: "Docs", subtitle: "3/10 (weak, min)" })
  .readout.radar("radar", { source: "skills", max: 10, labelSource: "skillNames", color: "#2563eb", viewW: 200, viewH: 200, label: "Skills (polygon spider)" })
  .phase("p", {
    duration: 1200,
    title: "skill level split",
    body: "3-lane (Strong ≥7 / Middle 5-6 / Weak <5) で 5 skill をレベル別分散、 各 skill 個別 card で数値明示 (Design 8 / Test 7 / Debug 9 / Impl 5 / Docs 3)、 radar readout も併存で 5 次元 polygon 表示、 skill レベル分類と polygon 全体観の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("designNode", "testNode", "debugNode", "implNode", "docsNode").badge("radar"))
  .build();

/**
 * 38. bubble chart = 3D data (perf / cost / usage) の bubbles、 各点の size で 3 次元目を表現。
 */
export const perfBubbleChart = diagram("interactive-perf-bubble", {
  topic: "5 workload を 2-lane (High usage ≥7 / Low usage <7) usage size 別分散、 各 workload 個別 card + bubbleChart readout 併存",
})
  .lane("high", { x: 0, width: 300 })
  .lane("low", { x: 340, width: 300 })
  .arraySignal("perf", [
    [50, 20, 5],
    [70, 40, 8],
    [90, 60, 10],
    [30, 80, 3],
    [60, 50, 7],
  ] as unknown as (string | number)[])
  .node("w2", { lane: "high", stack: 0, kind: "card", title: "Workload B", subtitle: "perf 70 · cost 40 · usage 8 (high)" })
  .node("w3", { lane: "high", stack: 1, kind: "card", title: "Workload C", subtitle: "perf 90 · cost 60 · usage 10 (max)" })
  .node("w5", { lane: "high", stack: 2, kind: "card", title: "Workload E", subtitle: "perf 60 · cost 50 · usage 7 (boundary)" })
  .node("w1", { lane: "low", stack: 0, kind: "card", title: "Workload A", subtitle: "perf 50 · cost 20 · usage 5 (low)" })
  .node("w4", { lane: "low", stack: 1, kind: "card", title: "Workload D", subtitle: "perf 30 · cost 80 · usage 3 (min)" })
  .readout.bubbleChart("bubbles", {
    source: "perf",
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
    rMin: 0,
    rMax: 10,
    color: "#2563eb",
    viewW: 280,
    viewH: 180,
    label: "workloads (3D bubble)",
  })
  .phase("p", {
    duration: 1200,
    title: "usage size split",
    body: "2-lane (High usage ≥7 = 3 個 / Low usage <7 = 2 個) で 5 workload を usage 次元別分散、 各 workload 個別 card で (perf, cost, usage) 明示、 bubbleChart readout も併存で 3D bubble 表示、 usage 分類と 3D chart の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("w2", "w3", "w5", "w1", "w4").badge("3D bubble"))
  .build();

/**
 * 39. donut chart = portfolio share (asset allocation) を multi-segment donut 表示。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "portfolio 4 asset を 2-lane (Traditional Stocks+Bonds / Alternative Cash+Crypto) 分散、 各 asset 個別 card、 donut readout 併存",
})
  .lane("traditional", { x: 0, width: 300 })
  .lane("alternative", { x: 340, width: 300 })
  .arraySignal("assets", [45, 30, 15, 10])
  .arraySignal("assetNames", ["Stocks", "Bonds", "Cash", "Crypto"])
  .node("stocksNode", { lane: "traditional", stack: 0, kind: "card", title: "Stocks", subtitle: "45% (max)" })
  .node("bondsNode", { lane: "traditional", stack: 1, kind: "card", title: "Bonds", subtitle: "30%" })
  .node("cashNode", { lane: "alternative", stack: 0, kind: "card", title: "Cash", subtitle: "15%" })
  .node("cryptoNode", { lane: "alternative", stack: 1, kind: "card", title: "Crypto", subtitle: "10% (min)" })
  .node("totalNode", { lane: "traditional", stack: 2, kind: "card", title: "Portfolio total", subtitle: "sum = {assets.sum}%" })
  .readout.donut("d", { source: "assets", innerRatio: 0.55, viewW: 160, viewH: 160, label: "Allocation (donut)" })
  .readout.arrayList("legend", { source: "assetNames", itemTemplate: "● {item}", label: "Legend" })
  .phase("p", {
    duration: 1200,
    title: "asset category split",
    body: "2-lane (Traditional Stocks+Bonds = 75% / Alternative Cash+Crypto = 25%) で 4 asset を category 別分散、 各 asset 個別 card + total summary、 donut readout も併存で multi-segment 円表示、 category 分類と donut 全体観の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("stocksNode", "bondsNode", "cashNode", "cryptoNode", "totalNode").badge("donut"))
  .build();

/**
 * 40. domain KPI dashboard = 4 KPI (revenue / users / churn / NPS) を 4 readout 組合せで dashboard 化。
 */
export const kpiDashboard = diagram("interactive-kpi-dashboard", {
  topic: "SaaS KPI dashboard = 4-lane (Revenue / Users / Churn / NPS) node grid + revenue → users/churn/nps に因果関係 edge、 formula chain で 3 KPI が chain 追随",
})
  .lane("revenue", { x: 0, width: 200 })
  .lane("users", { x: 260, width: 200 })
  .lane("churn", { x: 520, width: 200 })
  .lane("nps", { x: 780, width: 200 })
  .input.slider("revenueInput", { min: 10, max: 500, defaultValue: 120, label: "Revenue (k)" })
  .state("revenueInput", { initial: 120 })
  .formula("users", "revenueInput * 8")
  .formula("churn", "50 - revenueInput / 10")
  .formula("nps", "revenueInput / 2 + 20")
  .state("users", { initial: 960 })
  .state("churn", { initial: 38 })
  .state("nps", { initial: 80 })
  .node("revCard", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    title: "Revenue",
    subtitle: "${revenueInput}k / month",
  })
  .node("usersCard", {
    lane: "users",
    stack: 0,
    kind: "card",
    title: "Users",
    subtitle: "{users} active",
  })
  .node("churnCard", {
    lane: "churn",
    stack: 0,
    kind: "card",
    title: "Churn",
    subtitle: "{churn}% / month",
  })
  .node("npsCard", {
    lane: "nps",
    stack: 0,
    kind: "card",
    title: "NPS",
    subtitle: "{nps} score",
  })
  .edge("revCard", "usersCard", { label: "×8", sub: "acquisition", tone: "info" })
  .edge("revCard", "churnCard", { label: "inverse", sub: "50 − rev/10", tone: "error" })
  .edge("revCard", "npsCard", { label: "correlate", sub: "rev/2 + 20", tone: "success" })
  .readout.stat("rev", { source: "revenueInput", unit: "k", label: "Revenue" })
  .readout.stat("usr", { source: "users", label: "Users" })
  .readout.gauge("chr", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "Churn %" })
  .readout.percentRing("np", { source: "nps", max: 100, color: "#22c55e", label: "NPS" })
  .phase("p", {
    duration: 1200,
    title: "KPI dashboard",
    body: "4-lane で Revenue driver + 3 downstream KPI を node grid、 因果関係を edge tone (info=acquisition / error=inverse churn / success=NPS correlate) で表現、 formula chain で 3 KPI 同時追随。",
  }, (p: PhaseBuilder) => p.activate("revCard", "usersCard", "churnCard", "npsCard").badge("KPI"))
  .build();

/**
 * 41. domain A/B test result = 2 variant の conversion rate + confidence を並列表示。
 */
export const abTestResult = diagram("interactive-ab-test", {
  topic: "A/B test を 3-lane (Variant A / Split / Variant B) + Split → A,B edge で experiment 構造を node network 化",
})
  .lane("varA", { x: 0, width: 200 })
  .lane("split", { x: 260, width: 200 })
  .lane("varB", { x: 520, width: 200 })
  .arraySignal("convA", [40, 45, 42, 48, 44])
  .arraySignal("convB", [50, 55, 58, 62, 60])
  .arraySignal("splitData", [50, 50])
  .arraySignal("results", [58, 42])
  .node("controlCard", {
    lane: "varA",
    stack: 0,
    kind: "card",
    title: "Variant A (Control)",
    subtitle: "avg {convA.avg}%",
  })
  .node("splitCard", {
    lane: "split",
    stack: 0,
    kind: "card",
    title: "Traffic split",
    subtitle: "50/50 randomize",
  })
  .node("treatmentCard", {
    lane: "varB",
    stack: 0,
    kind: "card",
    title: "Variant B (Treatment)",
    subtitle: "avg {convB.avg}%",
  })
  .edge("splitCard", "controlCard", { label: "50%", sub: "control", tone: "info", side: "left" })
  .edge("splitCard", "treatmentCard", { label: "50%", sub: "treatment", tone: "success" })
  .readout.stackedBar("conv", { sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#94a3b8", colorB: "#22c55e", label: "Daily conv % (A vs B)" })
  .readout.donut("splitDonut", { source: "splitData", innerRatio: 0.5, viewW: 120, viewH: 120, label: "Traffic split" })
  .readout.donut("winner", { source: "results", innerRatio: 0.6, viewW: 120, viewH: 120, colors: ["#22c55e", "#94a3b8"] as const, label: "Winner share (B=green)" })
  .phase("p", {
    duration: 1200,
    title: "A/B test",
    body: "3-lane (Variant A / Split / Variant B) + Split → 各 variant への 50/50 edge、 experiment 構造を node network で表現、 stackedBar + 2 donut で結果集約。",
  }, (p: PhaseBuilder) => p.activate("controlCard", "splitCard", "treatmentCard").badge("A/B test"))
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
 * 44. kpi-card = revenue の現在値 + 直前値との delta + 6 point history sparkline を composite。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "revenue KPI を 3-lane (Previous / Current / Trend) 分散 + prev→current delta edge、 kpiCard readout 併存",
})
  .lane("prevLane", { x: 0, width: 180 })
  .lane("currLane", { x: 220, width: 200 })
  .lane("trendLane", { x: 460, width: 220 })
  .input.slider("current", { min: 50, max: 300, defaultValue: 180, label: "Current revenue (k)" })
  .state("current", { initial: 180 })
  .state("prev", { initial: 150 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("prevNode", { lane: "prevLane", stack: 0, kind: "card", title: "Previous", subtitle: "{prev}k (baseline)" })
  .node("currNode", { lane: "currLane", stack: 0, kind: "card", title: "◆ Current", subtitle: "{current}k (slider driven)" })
  .node("trendNode", { lane: "trendLane", stack: 0, kind: "card", title: "Trend history", subtitle: "6 month sparkline (120-170k)" })
  .edge("prevNode", "currNode", { label: "delta = current - prev", tone: "success" })
  .edge("currNode", "trendNode", { label: "sparkline last", tone: "info" })
  .readout.kpiCard("kpi", { source: "current", historySource: "history", comparisonSource: "prev", unit: "k", colorPos: "#22c55e", colorNeg: "#ef4444", label: "Revenue KPI (composite)" })
  .readout.stat("prevStat", { source: "prev", unit: "k", label: "Prev stat" })
  .phase("p", {
    duration: 1200,
    title: "KPI delta flow",
    body: "3-lane (Previous / Current / Trend) で revenue KPI 3 component を分散、 prev→current delta edge (success tone) + current→trend sparkline edge (info tone)、 slider 操作で current lane が変化、 kpiCard readout も併存で composite 1 tile 表示。",
  }, (p: PhaseBuilder) => p.activate("prevNode", "currNode", "trendNode").badge("KPI card"))
  .build();

/**
 * 45. candlestick chart = 8 日分の OHLC を蝋燭足で表示 (finance chart)。
 */
export const priceCandlestick = diagram("interactive-price-candlestick", {
  topic: "OHLC 8 day を 2-lane (Up days close≥open / Down days close<open) 分散、 各 day 個別 card + candlestick readout 併存",
})
  .lane("up", { x: 0, width: 320 })
  .lane("down", { x: 360, width: 320 })
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
  .node("d1", { lane: "up", stack: 0, kind: "card", title: "Day 1 ▲", subtitle: "O=100 · C=105 (+5)" })
  .node("d3", { lane: "up", stack: 1, kind: "card", title: "Day 3 ▲", subtitle: "O=102 · C=104 (+2)" })
  .node("d4", { lane: "up", stack: 2, kind: "card", title: "Day 4 ▲", subtitle: "O=104 · C=111 (+7)" })
  .node("d6", { lane: "up", stack: 3, kind: "card", title: "Day 6 ▲", subtitle: "O=109 · C=112 (+3)" })
  .node("d7", { lane: "up", stack: 4, kind: "card", title: "Day 7 ▲", subtitle: "O=112 · C=116 (+4)" })
  .node("d8", { lane: "up", stack: 5, kind: "card", title: "Day 8 ▲", subtitle: "O=116 · C=118 (+2)" })
  .node("d2", { lane: "down", stack: 0, kind: "card", title: "Day 2 ▼", subtitle: "O=105 · C=102 (-3)" })
  .node("d5", { lane: "down", stack: 1, kind: "card", title: "Day 5 ▼", subtitle: "O=111 · C=109 (-2)" })
  .readout.candlestick("chart", { source: "ohlc", min: 95, max: 122, viewW: 300, viewH: 110, colorUp: "#22c55e", colorDown: "#ef4444", label: "OHLC (candlestick)" })
  .phase("p", {
    duration: 1200,
    title: "candle direction split",
    body: "2-lane (Up days ▲ 6 個 / Down days ▼ 2 個) で 8 day OHLC を close vs open 方向別分散、 各 day 個別 card で open/close/delta 明示、 candlestick readout も併存で緑/赤 蝋燭足 + wick 描画、 direction 分類と price chart の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("d1", "d3", "d4", "d6", "d7", "d8", "d2", "d5").badge("finance"))
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
 * 49. project gantt = 4 task を 10 day timeline 上に配置。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "project 4 task を 4-lane (Design / Impl / Test / Ship) task 別分散 + 3 handover edge、 gantt readout 併存",
})
  .lane("design", { x: 0, width: 160 })
  .lane("impl", { x: 180, width: 160 })
  .lane("test", { x: 360, width: 160 })
  .lane("ship", { x: 540, width: 160 })
  .arraySignal("tasks", [
    ["Design", 0, 3],
    ["Impl", 3, 5],
    ["Test", 6, 3],
    ["Ship", 9, 1],
  ] as unknown as (string | number)[])
  .node("designNode", { lane: "design", stack: 0, kind: "card", title: "Design", subtitle: "day 0-3 (3 day)" })
  .node("implNode", { lane: "impl", stack: 0, kind: "card", title: "Impl", subtitle: "day 3-8 (5 day, largest)" })
  .node("testNode", { lane: "test", stack: 0, kind: "card", title: "Test", subtitle: "day 6-9 (3 day, overlap w/ impl)" })
  .node("shipNode", { lane: "ship", stack: 0, kind: "card", title: "Ship", subtitle: "day 9-10 (1 day)" })
  .edge("designNode", "implNode", { label: "handover", tone: "info" })
  .edge("implNode", "testNode", { label: "test start", tone: "accent" })
  .edge("testNode", "shipNode", { label: "release", tone: "success" })
  .readout.gantt("g", { source: "tasks", min: 0, max: 10, viewW: 320, viewH: 140, color: "#2563eb", label: "Timeline (gantt)" })
  .phase("p", {
    duration: 1200,
    title: "task pipeline",
    body: "4-lane (Design / Impl / Test / Ship) で 10 day sprint 4 task を task 別分散 + 3 handover edge (info→accent→success で release 直前 escalate)、 各 task 個別 card で day range 明示、 gantt readout も併存で timeline bar 表示、 task 分類と timeline の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("designNode", "implNode", "testNode", "shipNode").badge("gantt"))
  .build();

/**
 * 50. resource treemap = 6 team の share 割合を hierarchical rectangles で表示。
 */
export const resourceTreemap = diagram("interactive-resource-treemap", {
  topic: "6 team budget を 3-lane (Major ≥15% / Mid 5-14% / Minor <5%) size 別分散、 各 team 個別 card、 treemap readout 併存",
})
  .lane("major", { x: 0, width: 220 })
  .lane("mid", { x: 260, width: 200 })
  .lane("minor", { x: 500, width: 200 })
  .arraySignal("teams", [
    ["Engineering", 45],
    ["Sales", 20],
    ["Marketing", 15],
    ["Support", 10],
    ["Ops", 6],
    ["Legal", 4],
  ] as unknown as (string | number)[])
  .node("engNode", { lane: "major", stack: 0, kind: "card", title: "Engineering", subtitle: "45% (dominant)" })
  .node("salesNode", { lane: "major", stack: 1, kind: "card", title: "Sales", subtitle: "20%" })
  .node("mktNode", { lane: "major", stack: 2, kind: "card", title: "Marketing", subtitle: "15% (boundary)" })
  .node("supportNode", { lane: "mid", stack: 0, kind: "card", title: "Support", subtitle: "10%" })
  .node("opsNode", { lane: "mid", stack: 1, kind: "card", title: "Ops", subtitle: "6%" })
  .node("legalNode", { lane: "minor", stack: 0, kind: "card", title: "Legal", subtitle: "4% (min)" })
  .readout.treemap("t", { source: "teams", viewW: 280, viewH: 200, label: "Budget (treemap)" })
  .phase("p", {
    duration: 1200,
    title: "budget size split",
    body: "3-lane (Major ≥15% = 3 team / Mid 5-14% = 2 team / Minor <5% = 1 team) で 6 team を budget size 別分散、 各 team 個別 card で % 明示、 treemap readout も併存で area 比例 hierarchical 表示、 size 分類と area chart の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("engNode", "salesNode", "mktNode", "supportNode", "opsNode", "legalNode").badge("treemap"))
  .build();

/**
 * 51. sankey flow = traffic source → landing → conversion の flow diagram。
 */
export const trafficSankey = diagram("interactive-traffic-sankey", {
  topic: "traffic source (3) → landing (2) → conversion (1) の 3-lane funnel を node network + edge で明示、 sankey readout 併存",
})
  .lane("src", { x: 0, width: 180 })
  .lane("land", { x: 260, width: 180 })
  .lane("cv", { x: 520, width: 180 })
  .arraySignal("flows", [
    ["Search", "Home", 40],
    ["Search", "Product", 30],
    ["Social", "Home", 25],
    ["Social", "Product", 15],
    ["Direct", "Home", 20],
    ["Direct", "Product", 10],
  ] as unknown as (string | number)[])
  .node("search", { lane: "src", stack: 0, kind: "card", title: "Search", subtitle: "40 + 30 = 70" })
  .node("social", { lane: "src", stack: 1, kind: "card", title: "Social", subtitle: "25 + 15 = 40" })
  .node("direct", { lane: "src", stack: 2, kind: "card", title: "Direct", subtitle: "20 + 10 = 30" })
  .node("home", { lane: "land", stack: 0, kind: "card", title: "Home", subtitle: "40 + 25 + 20 = 85" })
  .node("product", { lane: "land", stack: 1, kind: "card", title: "Product", subtitle: "30 + 15 + 10 = 55" })
  .node("checkout", { lane: "cv", stack: 0, kind: "card", title: "Checkout", subtitle: "conversion = 140" })
  .edge("search", "home", { label: "40", tone: "success" })
  .edge("search", "product", { label: "30", tone: "success" })
  .edge("social", "home", { label: "25", tone: "info" })
  .edge("social", "product", { label: "15", tone: "info" })
  .edge("direct", "home", { label: "20", tone: "accent" })
  .edge("direct", "product", { label: "10", tone: "accent" })
  .edge("home", "checkout", { label: "85", tone: "warning" })
  .edge("product", "checkout", { label: "55", tone: "warning" })
  .readout.sankey("s", { source: "flows", viewW: 340, viewH: 220, label: "Sources → Pages (sankey)" })
  .phase("p", {
    duration: 1200,
    title: "traffic funnel",
    body: "3-lane (Sources / Landings / Checkout) + 8 edge (source→landing 6 + landing→CV 2) で funnel 構造を node network 化、 tone で source 由来を分類 (success=Search / info=Social / accent=Direct / warning=to CV)、 sankey readout も併存。",
  }, (p: PhaseBuilder) => p.activate("search", "social", "direct", "home", "product", "checkout").badge("funnel"))
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
 * 57. traffic-light = 3-color status、 dropdown で red/yellow/green 選択 → active dot が glow 表示。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "build status 3 state (red/yellow/green) を 3-lane 分散、 各 state 個別 card + current indicator、 trafficLight readout 併存",
})
  .lane("red", { x: 0, width: 200 })
  .lane("yellow", { x: 240, width: 200 })
  .lane("green", { x: 480, width: 200 })
  .input.dropdown("status", { options: ["red", "yellow", "green"], defaultValue: "green", label: "Build status" })
  .state("status", { initial: "green" })
  .node("redNode", { lane: "red", stack: 0, kind: "card", title: "● Red (failed)", subtitle: "build broken · fix required" })
  .node("yellowNode", { lane: "yellow", stack: 0, kind: "card", title: "● Yellow (running)", subtitle: "build in progress · waiting" })
  .node("greenNode", { lane: "green", stack: 0, kind: "card", title: "● Green (passed)", subtitle: "build ok · ready to deploy" })
  .node("currentCI", { lane: "green", stack: 1, kind: "card", title: "◆ Current CI", subtitle: "status: {status}" })
  .readout.trafficLight("tl", { source: "status", viewW: 70, viewH: 180, label: "Status (3-color indicator)" })
  .phase("p", {
    duration: 1200,
    title: "status split",
    body: "3-lane (Red failed / Yellow running / Green passed) で build 3 state を分散、 各 state 個別 card + 現在 CI の位置 (default=green lane) を currentCI card で明示、 trafficLight readout も併存で glow filter 表示、 status 分類と現在 state の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("redNode", "yellowNode", "greenNode", "currentCI").badge("status"))
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
 * 61. notification = alert card、 dropdown で kind (info/warn/error/success) を切替。
 */
export const alertNotification = diagram("interactive-alert-notification", {
  topic: "alert kind 4 種 (info/warn/error/success) を 4-lane 分散 + current indicator、 各 kind 個別 card、 notification readout 併存",
})
  .lane("info", { x: 0, width: 170 })
  .lane("warn", { x: 190, width: 170 })
  .lane("error", { x: 380, width: 170 })
  .lane("success", { x: 570, width: 170 })
  .input.dropdown("kind", { options: ["info", "warn", "error", "success"], defaultValue: "warn", label: "Kind" })
  .state("kind", { initial: "warn" })
  .state("title", { initial: "Deploy in progress" })
  .state("body", { initial: "Building v1.2.3 for production" })
  .node("infoNode", { lane: "info", stack: 0, kind: "card", title: "ℹ Info", subtitle: "blue · 通知" })
  .node("warnNode", { lane: "warn", stack: 0, kind: "card", title: "⚠ Warn", subtitle: "yellow · 注意 (default)" })
  .node("errorNode", { lane: "error", stack: 0, kind: "card", title: "✕ Error", subtitle: "red · 失敗" })
  .node("successNode", { lane: "success", stack: 0, kind: "card", title: "✓ Success", subtitle: "green · 成功" })
  .node("currentAlert", { lane: "warn", stack: 1, kind: "card", title: "◆ Current", subtitle: "kind: {kind}" })
  .readout.notification("nt", { kindSource: "kind", titleSource: "title", bodySource: "body", label: "Alert (color + icon)" })
  .phase("p", {
    duration: 1200,
    title: "alert kind split",
    body: "4-lane (Info / Warn / Error / Success) で alert 4 kind を分散、 各 kind 個別 card + current indicator (default=warn lane)、 dropdown 切替で notification readout が color + icon (ℹ/⚠/✕/✓) 追随、 kind 分類と現在 state の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("infoNode", "warnNode", "errorNode", "successNode", "currentAlert").badge("alert"))
  .build();

/**
 * 62. diff-counter = git commit style +N/-N、 stepper で additions / deletions 変化。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "git PR diff を 2-lane (Additions +N / Deletions -N) 分散 + net delta edge、 diffCounter readout 併存",
})
  .lane("adds", { x: 0, width: 260 })
  .lane("dels", { x: 300, width: 260 })
  .input.stepper("add", { min: 0, max: 500, step: 10, defaultValue: 120, label: "Additions" })
  .input.stepper("del", { min: 0, max: 500, step: 10, defaultValue: 45, label: "Deletions" })
  .state("add", { initial: 120 })
  .state("del", { initial: 45 })
  .node("addCard", { lane: "adds", stack: 0, kind: "card", title: "+ Additions", subtitle: "+{add} lines (green)" })
  .node("addDetail", { lane: "adds", stack: 1, kind: "card", title: "adds/del ratio", subtitle: "add > del → net growth" })
  .node("delCard", { lane: "dels", stack: 0, kind: "card", title: "- Deletions", subtitle: "-{del} lines (red)" })
  .node("delDetail", { lane: "dels", stack: 1, kind: "card", title: "cleanup", subtitle: "remove obsolete code" })
  .edge("addCard", "delCard", { label: "net = add - del", tone: "info" })
  .readout.diffCounter("dc", { additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "Diff (+N/-N bar)" })
  .phase("p", {
    duration: 1200,
    title: "diff split",
    body: "2-lane (Additions +N green / Deletions -N red) で PR diff を符号別分散、 各 lane に main card + detail card、 net delta edge (info tone) で add - del の差を明示、 diffCounter readout も併存で proportion bar 表示、 diff 構造と bar の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("addCard", "addDetail", "delCard", "delDetail").badge("diff"))
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
 * 64. avatar = user profile avatar、 text input で name 変化 → initials + color circle 追随。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "user avatar generation pipeline を 3-lane (Input name / Initials extract / Circle render) + 2 edge で pipeline network 化、 avatar readout 併存",
})
  .lane("input", { x: 0, width: 240 })
  .lane("initials", { x: 280, width: 200 })
  .lane("circle", { x: 520, width: 200 })
  .input.text("user", { defaultValue: "Alice Wonderland", placeholder: "Full name", maxLength: 40, label: "User name" })
  .state("user", { initial: "Alice Wonderland" })
  .node("inputNode", { lane: "input", stack: 0, kind: "card", title: "Text input", subtitle: "user = {user}" })
  .node("initialsNode", { lane: "initials", stack: 0, kind: "card", title: "Initials extract", subtitle: "first 2 word head chars (Alice Wonderland → AW)" })
  .node("circleNode", { lane: "circle", stack: 0, kind: "card", title: "Colored circle", subtitle: "size 56 · blue #2563eb + AW text" })
  .edge("inputNode", "initialsNode", { label: "parse", tone: "info" })
  .edge("initialsNode", "circleNode", { label: "render", tone: "success" })
  .readout.avatar("av", { source: "user", size: 56, color: "#2563eb", label: "Avatar (rendered)" })
  .phase("p", {
    duration: 1200,
    title: "avatar pipeline",
    body: "3-lane (Input name / Initials extract / Circle render) で avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。",
  }, (p: PhaseBuilder) => p.activate("inputNode", "initialsNode", "circleNode").badge("avatar"))
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
 * 67. price-tag = e-commerce 商品価格、 stepper で newPrice 変化 → discount % 自動計算。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "e-commerce price tag を 3-lane (Old price / New price / Discount %) + 2 edge、 discount 計算経路可視化、 priceTag readout 併存",
})
  .lane("old", { x: 0, width: 200 })
  .lane("new", { x: 240, width: 200 })
  .lane("discount", { x: 480, width: 200 })
  .input.stepper("newPrice", { min: 0, max: 200, step: 5, defaultValue: 65, label: "New price" })
  .state("newPrice", { initial: 65 })
  .state("oldPrice", { initial: 100 })
  .node("oldNode", { lane: "old", stack: 0, kind: "card", title: "Old price", subtitle: "${oldPrice} (strikethrough)" })
  .node("newNode", { lane: "new", stack: 0, kind: "card", title: "New price", subtitle: "${newPrice} (stepper driven)" })
  .node("discountNode", { lane: "discount", stack: 0, kind: "card", title: "Discount %", subtitle: "(oldPrice - newPrice) / oldPrice · red badge" })
  .edge("oldNode", "newNode", { label: "sale", tone: "warning" })
  .edge("newNode", "discountNode", { label: "%", tone: "error" })
  .readout.priceTag("pt", { oldSource: "oldPrice", newSource: "newPrice", currency: "$", colorNew: "#0f172a", colorOld: "#94a3b8", colorDiscount: "#ef4444", label: "Price (composite tag)" })
  .phase("p", {
    duration: 1200,
    title: "price flow",
    body: "3-lane (Old / New / Discount) で price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。",
  }, (p: PhaseBuilder) => p.activate("oldNode", "newNode", "discountNode").badge("price"))
  .build();

/**
 * 68. spinner = deploy status、 dropdown で running/done/error 切替 → icon 変化。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "deploy 3 state (running/done/error) を 3-lane 分散 + current indicator、 spinner readout 併存",
})
  .lane("running", { x: 0, width: 220 })
  .lane("done", { x: 260, width: 220 })
  .lane("error", { x: 520, width: 220 })
  .input.dropdown("status", { options: ["running", "done", "error"], defaultValue: "running", label: "Status" })
  .input.text("msg", { defaultValue: "Building production bundle...", placeholder: "Status message", maxLength: 60, label: "Message" })
  .state("status", { initial: "running" })
  .state("msg", { initial: "Building production bundle..." })
  .node("runningNode", { lane: "running", stack: 0, kind: "card", title: "◐ Running", subtitle: "blue spinner · SMIL 回転 circle" })
  .node("doneNode", { lane: "done", stack: 0, kind: "card", title: "✓ Done", subtitle: "green · deploy success" })
  .node("errorNode", { lane: "error", stack: 0, kind: "card", title: "✕ Error", subtitle: "red · deploy failed" })
  .node("currentState", { lane: "running", stack: 1, kind: "card", title: "◆ Current deploy", subtitle: "status: {status} · msg: {msg}" })
  .readout.spinner("sp", { source: "status", textSource: "msg", color: "#2563eb", label: "Deploy (spinner + text)" })
  .phase("p",  {
    duration: 1200,
    title: "deploy state split",
    body: "3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("runningNode", "doneNode", "errorNode", "currentState").badge("loading"))
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
 * 71. confidence-meter = ML classification confidence を slider で操作 → 3 color band 追随。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "ML confidence を 3-lane (Low <40 / Mid 40-74 / High ≥75) band 別分散 + current indicator (default=high)、 confidenceMeter readout 併存",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 220 })
  .input.slider("conf", { min: 0, max: 100, defaultValue: 82, label: "Confidence %" })
  .state("conf", { initial: 82 })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "Low band", subtitle: "< 40% (red · uncertain)" })
  .node("midNode", { lane: "mid", stack: 0, kind: "card", title: "Mid band", subtitle: "40-74% (yellow · borderline)" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "High band", subtitle: "≥ 75% (green · confident)" })
  .node("currentConf", { lane: "high", stack: 1, kind: "card", title: "◆ Current", subtitle: "conf = {conf}% (default 82 → high)" })
  .readout.confidenceMeter("cm", { source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 280, viewH: 40, label: "Confidence (3-band bar)" })
  .phase("p", {
    duration: 1200,
    title: "confidence band split",
    body: "3-lane (Low <40 red / Mid 40-74 yellow / High ≥75 green) で 3 confidence band を分散、 current indicator (default 82 → high lane)、 slider 変化で confidenceMeter readout が band 色追随、 ML/AI classification band 分類と meter の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("lowNode", "midNode", "highNode", "currentConf").badge("ML conf"))
  .build();

/**
 * 72. reaction-bar = social post reactions、 4 emoji + count で pill 表示。
 */
export const postReactions = diagram("interactive-post-reactions", {
  topic: "social post 4 reaction を 4-lane emoji 別分散、 各 reaction 個別 card、 reactionBar readout 併存",
})
  .lane("thumb", { x: 0, width: 160 })
  .lane("heart", { x: 180, width: 160 })
  .lane("laugh", { x: 360, width: 160 })
  .lane("party", { x: 540, width: 160 })
  .arraySignal("reactions", [
    ["👍", 24],
    ["❤️", 12],
    ["😂", 8],
    ["🎉", 5],
  ] as unknown as (string | number)[])
  .node("thumbNode", { lane: "thumb", stack: 0, kind: "card", title: "👍 Thumbs up", subtitle: "24 (max)" })
  .node("heartNode", { lane: "heart", stack: 0, kind: "card", title: "❤️ Heart", subtitle: "12" })
  .node("laughNode", { lane: "laugh", stack: 0, kind: "card", title: "😂 Laugh", subtitle: "8" })
  .node("partyNode", { lane: "party", stack: 0, kind: "card", title: "🎉 Party", subtitle: "5 (min)" })
  .readout.reactionBar("rb", { source: "reactions", color: "#2563eb", label: "Reactions (pill list)" })
  .phase("p", {
    duration: 1200,
    title: "reaction emoji split",
    body: "4-lane (Thumbs / Heart / Laugh / Party) で 4 social reaction を emoji 別分散、 各 reaction 個別 card で count 明示、 reactionBar readout も併存で pill list 表示、 emoji 分類と reaction list の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("thumbNode", "heartNode", "laughNode", "partyNode").badge("social"))
  .build();

/**
 * 73. pill-group = tech skill 色付き pills、 [[label, colorHex], ...] で per-pill color。
 */
export const techPills = diagram("interactive-tech-pills", {
  topic: "tech stack 5 pill を 3-lane (Frontend / Systems / Build) category 別分散、 各 tool 個別 card、 pillGroup readout 併存",
})
  .lane("frontend", { x: 0, width: 220 })
  .lane("systems", { x: 260, width: 200 })
  .lane("build", { x: 480, width: 220 })
  .arraySignal("stack", [
    ["React", "#61dafb"],
    ["TypeScript", "#3178c6"],
    ["Rust", "#dea584"],
    ["Vite", "#646cff"],
    ["Bun", "#000000"],
  ] as unknown as (string | number)[])
  .node("reactNode", { lane: "frontend", stack: 0, kind: "card", title: "React", subtitle: "UI library · #61dafb" })
  .node("tsNode", { lane: "frontend", stack: 1, kind: "card", title: "TypeScript", subtitle: "typed JS · #3178c6" })
  .node("rustNode", { lane: "systems", stack: 0, kind: "card", title: "Rust", subtitle: "systems lang · #dea584" })
  .node("viteNode", { lane: "build", stack: 0, kind: "card", title: "Vite", subtitle: "dev server · #646cff" })
  .node("bunNode", { lane: "build", stack: 1, kind: "card", title: "Bun", subtitle: "runtime · #000000" })
  .readout.pillGroup("pg", { source: "stack", label: "Stack (pill group)" })
  .phase("p", {
    duration: 1200,
    title: "tech category split",
    body: "3-lane (Frontend React+TS / Systems Rust / Build Vite+Bun) で 5 tech tool を category 別分散、 各 tool 個別 card で用途 + hex 明示、 pillGroup readout も併存で per-pill color 表示、 tech 分類と pill list の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "rustNode", "viteNode", "bunNode").badge("pills"))
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
 * 78. token-list = crypto wallet の 4 token を icon + name + amount + delta% で表示。
 */
export const cryptoWallet = diagram("interactive-crypto-wallet", {
  topic: "crypto wallet 4 token を 2-lane (Gainers +% / Losers -%) に分散、 各 token を個別 card、 tokenList readout 併存",
})
  .lane("gainers", { x: 0, width: 220 })
  .lane("losers", { x: 300, width: 220 })
  .arraySignal("tokens", [
    ["₿", "BTC", "0.42", 5.3],
    ["Ξ", "ETH", "12.5", -2.8],
    ["◎", "SOL", "245", 8.1],
    ["Ð", "DOGE", "8500", -1.4],
  ] as unknown as (string | number)[])
  .node("btc", { lane: "gainers", stack: 0, kind: "card", title: "₿ BTC", subtitle: "0.42 · +5.3%" })
  .node("sol", { lane: "gainers", stack: 1, kind: "card", title: "◎ SOL", subtitle: "245 · +8.1%" })
  .node("eth", { lane: "losers", stack: 0, kind: "card", title: "Ξ ETH", subtitle: "12.5 · -2.8%" })
  .node("doge", { lane: "losers", stack: 1, kind: "card", title: "Ð DOGE", subtitle: "8500 · -1.4%" })
  .readout.tokenList("tl", { source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "Portfolio (aggregate)" })
  .phase("p", {
    duration: 1200,
    title: "portfolio split",
    body: "2-lane (Gainers +% / Losers -%) で 4 token を delta 符号別に分散、 各 token を個別 card で並列表示、 tokenList readout で aggregate 一覧も併存、 portfolio 構造を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("btc", "sol", "eth", "doge").badge("wallet"))
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
 * 82. poll-bar = feature poll、 4 option の投票 % 表示、 winner に ★ 装飾。
 */
export const featurePoll = diagram("interactive-feature-poll", {
  topic: "feature poll 4 option を 2-lane (Winner / Runners-up) に分散、 各 option 個別 card、 pollBar readout 併存",
})
  .lane("winner", { x: 0, width: 220 })
  .lane("runners", { x: 300, width: 220 })
  .arraySignal("options", [
    ["Dark mode", 42],
    ["Faster search", 28],
    ["Better API", 18],
    ["Nicer UI", 12],
  ] as unknown as (string | number)[])
  .node("dark", { lane: "winner", stack: 0, kind: "card", title: "★ Dark mode", subtitle: "42 votes (winner)" })
  .node("search", { lane: "runners", stack: 0, kind: "card", title: "Faster search", subtitle: "28 votes" })
  .node("api", { lane: "runners", stack: 1, kind: "card", title: "Better API", subtitle: "18 votes" })
  .node("ui", { lane: "runners", stack: 2, kind: "card", title: "Nicer UI", subtitle: "12 votes" })
  .readout.pollBar("pb", { source: "options", color: "#94a3b8", colorWinner: "#2563eb", label: "Results (aggregate)" })
  .phase("p", {
    duration: 1200,
    title: "vote split",
    body: "2-lane (Winner / Runners-up 3 個) で 4 option を投票結果別に分散、 winner lane は 1 位を目立たせる、 pollBar readout で aggregate 一覧も併存、 poll 構造を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("dark", "search", "api", "ui").badge("poll"))
  .build();

/**
 * 83. user-stack = code review reviewer 7 人 (max 5 表示 + overflow +2)。
 */
export const reviewerStack = diagram("interactive-reviewer-stack", {
  topic: "code review reviewer 7 人 を 2-lane (Displayed 5 / Overflow 2) 分散、 各 reviewer 個別 card、 userStack readout 併存",
})
  .lane("displayed", { x: 0, width: 340 })
  .lane("overflow", { x: 380, width: 200 })
  .arraySignal("reviewers", ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"])
  .node("r1", { lane: "displayed", stack: 0, kind: "card", title: "Alice", subtitle: "initials A · shown" })
  .node("r2", { lane: "displayed", stack: 1, kind: "card", title: "Bob Smith", subtitle: "initials BS · shown" })
  .node("r3", { lane: "displayed", stack: 2, kind: "card", title: "Carol", subtitle: "initials C · shown" })
  .node("r4", { lane: "displayed", stack: 3, kind: "card", title: "Dan Kim", subtitle: "initials DK · shown" })
  .node("r5", { lane: "displayed", stack: 4, kind: "card", title: "Eve", subtitle: "initials E · shown" })
  .node("r6", { lane: "overflow", stack: 0, kind: "card", title: "Frank Wu", subtitle: "initials FW · +2 overflow" })
  .node("r7", { lane: "overflow", stack: 1, kind: "card", title: "Grace Lee", subtitle: "initials GL · +2 overflow" })
  .readout.userStack("us", { source: "reviewers", max: 5, size: 36, label: "Reviewers (stacked avatars)" })
  .phase("p", {
    duration: 1200,
    title: "reviewer split",
    body: "2-lane (Displayed 5 avatar 表示分 / Overflow 2 +2 表示分) で 7 reviewer を max=5 境界別に分散、 各 reviewer 個別 card で initials + status 明示、 userStack readout も併存で overlap circle 表示、 表示 5 人と溢れ 2 人の構造を lane 分割で可視化。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "r4", "r5", "r6", "r7").badge("team"))
  .build();

/**
 * 84. commit-list = recent git commits を 5 rows 表示。
 */
export const gitCommitList = diagram("interactive-git-commits", {
  topic: "5 git commit を 5-lane (feat / fix / docs / refactor / test) commit type 別分散、 各 commit 個別 card、 commitList readout 併存",
})
  .lane("feat", { x: 0, width: 150 })
  .lane("fix", { x: 170, width: 150 })
  .lane("docs", { x: 340, width: 150 })
  .lane("refactor", { x: 510, width: 150 })
  .lane("test", { x: 680, width: 150 })
  .arraySignal("commits", [
    ["a1b2c3d", "feat: add sankey primitive", "Alice"],
    ["e5f6g7h", "fix: circular gauge angle bug", "Bob"],
    ["i9j0k1l", "docs: update SKILL.md", "Carol"],
    ["m3n4o5p", "refactor: extract widget dispatcher", "Dan"],
    ["q7r8s9t", "test: add builder chain coverage", "Eve"],
  ] as unknown as (string | number)[])
  .node("featNode", { lane: "feat", stack: 0, kind: "card", title: "feat", subtitle: "a1b2c3d · Alice · sankey" })
  .node("fixNode", { lane: "fix", stack: 0, kind: "card", title: "fix", subtitle: "e5f6g7h · Bob · gauge angle" })
  .node("docsNode", { lane: "docs", stack: 0, kind: "card", title: "docs", subtitle: "i9j0k1l · Carol · SKILL.md" })
  .node("refactorNode", { lane: "refactor", stack: 0, kind: "card", title: "refactor", subtitle: "m3n4o5p · Dan · dispatcher" })
  .node("testNode", { lane: "test", stack: 0, kind: "card", title: "test", subtitle: "q7r8s9t · Eve · builder" })
  .readout.commitList("cl", { source: "commits", max: 5, color: "#2563eb", label: "History (git log)" })
  .phase("p", {
    duration: 1200,
    title: "commit type split",
    body: "5-lane (feat / fix / docs / refactor / test) で 5 commit を type prefix 別分散、 各 commit 個別 card で sha + author + summary 明示、 commitList readout も併存で 3 column layout、 commit 分類と history の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("featNode", "fixNode", "docsNode", "refactorNode", "testNode").badge("git"))
  .build();

/**
 * 85. media-player = audio player、 slider で current time、 toggle で play/pause。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "audio player を 3-lane (Current time / Play toggle / Duration) + 2 edge、 signal 制御と mediaPlayer readout の bind 関係可視化",
})
  .lane("current", { x: 0, width: 220 })
  .lane("toggle", { x: 260, width: 200 })
  .lane("duration", { x: 500, width: 220 })
  .input.slider("current", { min: 0, max: 240, defaultValue: 65, label: "Current sec" })
  .input.toggle("playing", { defaultValue: true, label: "Playing" })
  .state("current", { initial: 65 })
  .state("duration", { initial: 240 })
  .state("playing", { initial: "true" })
  .node("currentNode", { lane: "current", stack: 0, kind: "card", title: "Current time", subtitle: "{current}s / 240s (slider driven)" })
  .node("toggleNode", { lane: "toggle", stack: 0, kind: "card", title: "Play toggle", subtitle: "playing = {playing} (▶/❚❚ icon)" })
  .node("durationNode", { lane: "duration", stack: 0, kind: "card", title: "Duration", subtitle: "240s total (fixed)" })
  .edge("currentNode", "durationNode", { label: "progress %", tone: "info" })
  .edge("toggleNode", "currentNode", { label: "advance/pause", tone: "success" })
  .readout.mediaPlayer("mp", { source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 320, label: "Player (icon + progress + MM:SS)" })
  .phase("p", {
    duration: 1200,
    title: "player signal flow",
    body: "3-lane (Current / Play toggle / Duration) で audio player 3 signal を分散、 2 edge (progress info / advance success) で 3 signal の相互関係明示、 slider + toggle 変化で mediaPlayer readout が icon + progress + MM:SS 追随、 player 構造を lane で可視化。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "toggleNode", "durationNode").badge("media"))
  .build();

/**
 * 86. event-log = server monitoring log、 4 severity (info/warn/error/debug) 表示。
 */
export const serverEventLog = diagram("interactive-server-event-log", {
  topic: "server monitoring event log 5 event を 4-lane (info / debug / warn / error) severity 別に分散、 eventLog readout 併存",
})
  .lane("info", { x: 0, width: 160 })
  .lane("debug", { x: 200, width: 160 })
  .lane("warn", { x: 400, width: 160 })
  .lane("error", { x: 600, width: 160 })
  .arraySignal("events", [
    ["10:23:45", "info", "Server started on port 3000"],
    ["10:24:12", "debug", "Loaded config from ~/.env"],
    ["10:24:58", "warn", "High CPU usage: 82%"],
    ["10:25:34", "error", "DB connection timeout after 5s"],
    ["10:26:01", "info", "Retry connection succeeded"],
  ] as unknown as (string | number)[])
  .node("info1", { lane: "info", stack: 0, kind: "card", title: "ℹ 10:23:45", subtitle: "Server started on port 3000" })
  .node("info2", { lane: "info", stack: 1, kind: "card", title: "ℹ 10:26:01", subtitle: "Retry connection succeeded" })
  .node("debug1", { lane: "debug", stack: 0, kind: "card", title: "· 10:24:12", subtitle: "Loaded config from ~/.env" })
  .node("warn1", { lane: "warn", stack: 0, kind: "card", title: "⚠ 10:24:58", subtitle: "High CPU usage: 82%" })
  .node("error1", { lane: "error", stack: 0, kind: "card", title: "✕ 10:25:34", subtitle: "DB connection timeout after 5s" })
  .readout.eventLog("el", { source: "events", max: 10, label: "Events (timeline)" })
  .phase("p", {
    duration: 1200,
    title: "severity split",
    body: "4-lane (info / debug / warn / error) で 5 event を severity 別に分散、 各 event 個別 card で timestamp + msg 明示、 eventLog readout で timeline 一覧も併存、 severity 分類と時系列の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("info1", "info2", "debug1", "warn1", "error1").badge("monitor"))
  .build();

/**
 * 87. search-result = 5 search hit を title + snippet + url で表示。
 */
export const searchResults = diagram("interactive-search-results", {
  topic: "search hit 5 を 2-lane (Docs 4 / Interactive tool 1) 分散、 各 hit 個別 card、 searchResult readout 併存",
})
  .lane("docs", { x: 0, width: 340 })
  .lane("tools", { x: 380, width: 300 })
  .arraySignal("hits", [
    ["Rust playground", "Interactive code sandbox for Rust programming language", "play.rust-lang.org"],
    ["MDN Web Docs", "Documentation for web technologies", "developer.mozilla.org"],
    ["TypeScript Handbook", "Official TS learning guide", "typescriptlang.org/docs"],
    ["React docs", "React reference documentation", "react.dev"],
    ["Vite guide", "Frontend build tool guide", "vitejs.dev"],
  ] as unknown as (string | number)[])
  .node("mdnNode", { lane: "docs", stack: 0, kind: "card", title: "MDN Web Docs", subtitle: "developer.mozilla.org" })
  .node("tsNode", { lane: "docs", stack: 1, kind: "card", title: "TypeScript Handbook", subtitle: "typescriptlang.org/docs" })
  .node("reactNode", { lane: "docs", stack: 2, kind: "card", title: "React docs", subtitle: "react.dev" })
  .node("viteNode", { lane: "docs", stack: 3, kind: "card", title: "Vite guide", subtitle: "vitejs.dev" })
  .node("rustNode", { lane: "tools", stack: 0, kind: "card", title: "Rust playground", subtitle: "play.rust-lang.org (interactive)" })
  .readout.searchResult("sr", { source: "hits", max: 5, color: "#2563eb", label: "Results (link + snippet + url)" })
  .phase("p", {
    duration: 1200,
    title: "result category split",
    body: "2-lane (Docs 4 hit / Interactive tool 1 hit) で 5 search result を category 別分散、 各 hit 個別 card で title + url 明示、 searchResult readout も併存で従来 list 表示、 category 分類と list 一覧の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("mdnNode", "tsNode", "reactNode", "viteNode", "rustNode").badge("search"))
  .build();

/**
 * 88. roadmap = 2026 year quarterly plan Q1-Q4。
 */
export const yearRoadmap = diagram("interactive-year-roadmap", {
  topic: "2026 yearly roadmap を 4-lane (Q1-Q4) 分散、 各 quarter items を stack 分散、 quarterly 遷移 3 edge、 roadmap readout 併存",
})
  .lane("q1", { x: 0, width: 150 })
  .lane("q2", { x: 170, width: 150 })
  .lane("q3", { x: 340, width: 150 })
  .lane("q4", { x: 510, width: 150 })
  .arraySignal("plan", [
    ["Q1", ["Design system", "MVP feature A"]],
    ["Q2", ["Beta launch", "Feature B", "Feedback loop"]],
    ["Q3", ["Scale infra", "Enterprise deals"]],
    ["Q4", ["Public GA", "Series A"]],
  ] as unknown as (string | number)[])
  .node("q1Head", { lane: "q1", stack: 0, kind: "card", title: "Q1 (Jan-Mar)", subtitle: "Design + MVP" })
  .node("q1Item1", { lane: "q1", stack: 1, kind: "card", title: "Design system", subtitle: "foundation" })
  .node("q1Item2", { lane: "q1", stack: 2, kind: "card", title: "MVP feature A", subtitle: "prototype" })
  .node("q2Head", { lane: "q2", stack: 0, kind: "card", title: "Q2 (Apr-Jun)", subtitle: "Beta + growth" })
  .node("q2Item1", { lane: "q2", stack: 1, kind: "card", title: "Beta launch", subtitle: "public beta" })
  .node("q2Item2", { lane: "q2", stack: 2, kind: "card", title: "Feature B", subtitle: "beta scope" })
  .node("q3Head", { lane: "q3", stack: 0, kind: "card", title: "Q3 (Jul-Sep)", subtitle: "Scale + enterprise" })
  .node("q3Item1", { lane: "q3", stack: 1, kind: "card", title: "Scale infra", subtitle: "capacity" })
  .node("q3Item2", { lane: "q3", stack: 2, kind: "card", title: "Enterprise deals", subtitle: "B2B revenue" })
  .node("q4Head", { lane: "q4", stack: 0, kind: "card", title: "Q4 (Oct-Dec)", subtitle: "GA + funding" })
  .node("q4Item1", { lane: "q4", stack: 1, kind: "card", title: "Public GA", subtitle: "general available" })
  .node("q4Item2", { lane: "q4", stack: 2, kind: "card", title: "Series A", subtitle: "growth capital" })
  .edge("q1Head", "q2Head", { label: "handover", tone: "info" })
  .edge("q2Head", "q3Head", { label: "scale", tone: "accent" })
  .edge("q3Head", "q4Head", { label: "GA", tone: "success" })
  .readout.roadmap("rm", { source: "plan", viewW: 400, viewH: 200, label: "Roadmap (4 column list)" })
  .phase("p", {
    duration: 1200,
    title: "yearly roadmap",
    body: "4-lane (Q1-Q4) で 12 item を quarterly 分散、 各 quarter に header + 2 item stack、 3 edge で quarterly handover 遷移 (info→accent→success で年後半に向け tone escalate)、 roadmap readout も併存で 4 column 一覧、 quarterly plan の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("q1Head", "q2Head", "q3Head", "q4Head").badge("plan"))
  .build();

/**
 * 89. weather-forecast = 5-day weather (Mon-Fri) with icon + high/low temp。
 */
export const weekWeather = diagram("interactive-week-weather", {
  topic: "5-day weather を 3-lane (Sunny ☀ / Cloudy/Rainy / Thunder ⚡) 天気別分散、 各 day 個別 card、 weatherForecast readout 併存",
})
  .lane("sunny", { x: 0, width: 220 })
  .lane("cloudy", { x: 260, width: 220 })
  .lane("thunder", { x: 520, width: 200 })
  .arraySignal("forecast", [
    ["Mon", "☀", 24, 18],
    ["Tue", "☁", 22, 17],
    ["Wed", "☂", 19, 15],
    ["Thu", "⚡", 17, 13],
    ["Fri", "☀", 25, 19],
  ] as unknown as (string | number)[])
  .node("monNode", { lane: "sunny", stack: 0, kind: "card", title: "☀ Mon", subtitle: "24°/18° (sunny)" })
  .node("friNode", { lane: "sunny", stack: 1, kind: "card", title: "☀ Fri", subtitle: "25°/19° (sunny, week high)" })
  .node("tueNode", { lane: "cloudy", stack: 0, kind: "card", title: "☁ Tue", subtitle: "22°/17° (cloudy)" })
  .node("wedNode", { lane: "cloudy", stack: 1, kind: "card", title: "☂ Wed", subtitle: "19°/15° (rainy)" })
  .node("thuNode", { lane: "thunder", stack: 0, kind: "card", title: "⚡ Thu", subtitle: "17°/13° (thunder, week low)" })
  .readout.weatherForecast("wf", { source: "forecast", label: "Week (5-day forecast)" })
  .phase("p", {
    duration: 1200,
    title: "weather split",
    body: "3-lane (Sunny 2 day / Cloudy or Rainy 2 day / Thunder 1 day) で 5-day weather を天気別分散、 各 day 個別 card で icon + 高低 temp 明示、 weatherForecast readout も併存で 5 column widget 表示、 天気分類と日別詳細の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("monNode", "friNode", "tueNode", "wedNode", "thuNode").badge("weather"))
  .build();

/**
 * 90. video-card = tutorial video 3 本 (title + duration + views)。
 */
export const tutorialVideoCards = diagram("interactive-tutorial-videos", {
  topic: "tutorial video 3 本 を 3-lane (Rust / TypeScript / React) topic 別分散、 各 video 個別 card、 videoCard readout 併存",
})
  .lane("rust", { x: 0, width: 220 })
  .lane("ts", { x: 260, width: 220 })
  .lane("react", { x: 520, width: 220 })
  .arraySignal("videos", [
    ["🎬", "Rust intro for beginners", "12:45", "24k"],
    ["🎥", "TypeScript deep dive", "45:20", "82k"],
    ["📺", "React hooks explained", "18:30", "156k"],
  ] as unknown as (string | number)[])
  .node("rustVideo", { lane: "rust", stack: 0, kind: "card", title: "🎬 Rust intro", subtitle: "12:45 · 24k views" })
  .node("tsVideo", { lane: "ts", stack: 0, kind: "card", title: "🎥 TypeScript deep dive", subtitle: "45:20 · 82k views" })
  .node("reactVideo", { lane: "react", stack: 0, kind: "card", title: "📺 React hooks", subtitle: "18:30 · 156k views (top view)" })
  .readout.videoCard("vc", { source: "videos", max: 5, color: "#ef4444", label: "Videos (thumbnail list)" })
  .phase("p", {
    duration: 1200,
    title: "video topic split",
    body: "3-lane (Rust / TypeScript / React) で 3 tutorial video を topic 別分散、 各 video 個別 card で title + duration + views 明示、 videoCard readout も併存で YouTube 定番 layout、 topic 分類と list 一覧の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("rustVideo", "tsVideo", "reactVideo").badge("video"))
  .build();

/**
 * 91. order-status = e-commerce 配送追跡、 stepper で current step 切替 → 4 icon step。
 */
export const shippingOrderStatus = diagram("interactive-shipping-status", {
  topic: "e-commerce 配送追跡 4 step (📦→🚚→🏠→✅) を 4-lane pipeline + 3 edge で状態遷移 network 化、 orderStatus readout 併存",
})
  .lane("packed", { x: 0, width: 160 })
  .lane("shipped", { x: 200, width: 160 })
  .lane("delivery", { x: 400, width: 160 })
  .lane("delivered", { x: 600, width: 160 })
  .input.stepper("current", { min: 0, max: 3, defaultValue: 2, label: "Step" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["Packed", "Shipped", "Out for delivery", "Delivered"])
  .node("packedNode", { lane: "packed", stack: 0, kind: "card", title: "📦 Packed", subtitle: "step 0" })
  .node("shippedNode", { lane: "shipped", stack: 0, kind: "card", title: "🚚 Shipped", subtitle: "step 1" })
  .node("deliveryNode", { lane: "delivery", stack: 0, kind: "card", title: "🏠 Out for delivery", subtitle: "step 2 (current)" })
  .node("deliveredNode", { lane: "delivered", stack: 0, kind: "card", title: "✅ Delivered", subtitle: "step 3" })
  .edge("packedNode", "shippedNode", { label: "handover", tone: "success" })
  .edge("shippedNode", "deliveryNode", { label: "in transit", tone: "info" })
  .edge("deliveryNode", "deliveredNode", { label: "arrived", tone: "warning" })
  .readout.orderStatus("os", { source: "current", stepsSource: "steps", color: "#2563eb", label: "Delivery status (icon strip)" })
  .phase("p", {
    duration: 1200,
    title: "delivery pipeline",
    body: "4-lane pipeline (Packed / Shipped / Out for delivery / Delivered) + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。",
  }, (p: PhaseBuilder) => p.activate("packedNode", "shippedNode", "deliveryNode", "deliveredNode").badge("tracking"))
  .build();

/**
 * 92. attendance-grid = チーム週間 attendance (5 day × 4 member)。
 */
export const teamAttendanceGrid = diagram("interactive-team-attendance", {
  topic: "5 day × 4 member attendance を 4-lane (Alice/Bob/Carol/Dan) member 別分散、 各 member weekly summary + attendanceGrid readout 併存",
})
  .lane("alice", { x: 0, width: 150 })
  .lane("bob", { x: 170, width: 150 })
  .lane("carol", { x: 340, width: 150 })
  .lane("dan", { x: 510, width: 150 })
  .arraySignal("attendance", [
    ["Mon", true, true, false, true],
    ["Tue", true, false, true, true],
    ["Wed", true, true, true, true],
    ["Thu", false, true, true, true],
    ["Fri", true, true, false, true],
  ] as unknown as (string | number)[])
  .arraySignal("members", ["Alice", "Bob", "Carol", "Dan"])
  .node("aliceCard", { lane: "alice", stack: 0, kind: "card", title: "Alice", subtitle: "4/5 present (Thu absent)" })
  .node("bobCard", { lane: "bob", stack: 0, kind: "card", title: "Bob", subtitle: "4/5 present (Tue absent)" })
  .node("carolCard", { lane: "carol", stack: 0, kind: "card", title: "Carol", subtitle: "3/5 present (Mon/Fri absent)" })
  .node("danCard", { lane: "dan", stack: 0, kind: "card", title: "Dan", subtitle: "5/5 present (perfect)" })
  .readout.attendanceGrid("ag", { source: "attendance", membersSource: "members", color: "#22c55e", label: "Attendance (5 day × 4 member grid)" })
  .phase("p", {
    duration: 1200,
    title: "member split",
    body: "4-lane (Alice/Bob/Carol/Dan) で 5 day × 4 member attendance を member 別に分散、 各 member weekly summary card で present/absent 数明示、 attendanceGrid readout も併存で 2D grid 表示、 member 別 aggregate と day 別詳細の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("aliceCard", "bobCard", "carolCard", "danCard").badge("attendance"))
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
export const monthCalendarView = diagram("interactive-month-calendar", {
  topic: "January 2026 calendar を 4-lane (Week 1 / Week 2 / Week 3 / Week 4-5) 週別分散、 各週 summary + calendarMonth readout 併存",
})
  .lane("w1", { x: 0, width: 150 })
  .lane("w2", { x: 170, width: 150 })
  .lane("w3", { x: 340, width: 150 })
  .lane("w4", { x: 510, width: 200 })
  .arraySignal("days", generateCalendarDays())
  .node("w1Card", { lane: "w1", stack: 0, kind: "card", title: "Week 1 (Jan 1-7)", subtitle: "1 event (Jan 3)" })
  .node("w2Card", { lane: "w2", stack: 0, kind: "card", title: "Week 2 (Jan 8-14)", subtitle: "2 events (Jan 8, 12) + today (13)" })
  .node("w3Card", { lane: "w3", stack: 0, kind: "card", title: "Week 3 (Jan 15-21)", subtitle: "1 event (Jan 17)" })
  .node("w4Card", { lane: "w4", stack: 0, kind: "card", title: "Week 4-5 (Jan 22-31)", subtitle: "2 events (Jan 22, 26)" })
  .node("monthSummary", { lane: "w4", stack: 1, kind: "card", title: "Month total", subtitle: "31 days · 6 events · today = Jan 13" })
  .readout.calendarMonth("cm", { source: "days", monthName: "January 2026", color: "#2563eb", label: "Month view (7 column grid)" })
  .phase("p", {
    duration: 1200,
    title: "week split",
    body: "4-lane (Week 1 / 2 / 3 / 4-5) で January 2026 を週別分散、 各週 event 数 + today 位置 (Week 2 = Jan 13) 明示、 month total summary (Week 4-5 lane 内)、 calendarMonth readout も併存で 7 column grid 表示、 週単位 aggregate と月 grid の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("w1Card", "w2Card", "w3Card", "w4Card", "monthSummary").badge("calendar"))
  .build();

/**
 * 97. terminal = CLI session output、 5 command history。
 */
export const cliTerminalSession = diagram("interactive-cli-terminal", {
  topic: "CLI 5 command を 3-lane (Filesystem / Git / Dev) tool category 別分散、 各 command 個別 card、 terminal readout 併存",
})
  .lane("fs", { x: 0, width: 220 })
  .lane("git", { x: 260, width: 220 })
  .lane("dev", { x: 520, width: 220 })
  .arraySignal("cmds", [
    ["$", "ls -la", "total 42\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"],
    ["$", "cd projects", ""],
    ["$", "git status", "On branch main\nnothing to commit, working tree clean"],
    ["$", "pnpm test", "Test Files  114 passed\nTests  1649 passed"],
    ["$", "docker ps", "CONTAINER ID   IMAGE\n8f3a2b1c9d   nginx:latest"],
  ] as unknown as (string | number)[])
  .node("lsNode", { lane: "fs", stack: 0, kind: "card", title: "ls -la", subtitle: "filesystem · list files" })
  .node("cdNode", { lane: "fs", stack: 1, kind: "card", title: "cd projects", subtitle: "filesystem · change dir" })
  .node("gitStatusNode", { lane: "git", stack: 0, kind: "card", title: "git status", subtitle: "git · branch state" })
  .node("pnpmNode", { lane: "dev", stack: 0, kind: "card", title: "pnpm test", subtitle: "dev · 114 files · 1649 tests" })
  .node("dockerNode", { lane: "dev", stack: 1, kind: "card", title: "docker ps", subtitle: "dev · container list" })
  .readout.terminal("tm", { source: "cmds", max: 10, color: "#22c55e", label: "Session (CLI window)" })
  .phase("p", {
    duration: 1200,
    title: "command category split",
    body: "3-lane (Filesystem ls+cd / Git status / Dev pnpm+docker) で 5 CLI command を tool category 別分散、 各 command 個別 card で用途 + summary 明示、 terminal readout も併存で CLI window 表示、 category 分類と session の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("lsNode", "cdNode", "gitStatusNode", "pnpmNode", "dockerNode").badge("CLI"))
  .build();

/**
 * 98. chess-board = 8×8 chess board with starting position。
 */
export const chessStartingBoard = diagram("interactive-chess-board", {
  topic: "8×8 chess board with 32 pieces starting position (unicode ♔♕♖♗♘♙ / ♚♛♜♝♞♟)",
})
  .lane("l", { x: 0, width: 480 })
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
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Chess board", subtitle: "32 pieces starting position" })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "Position" })
  .phase("p", { duration: 1200, title: "chess board", body: "8×8 square に 32 piece (starting position)、 light (cream) / dark (brown) square + unicode piece、 boardgame 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("chess"))
  .build();
