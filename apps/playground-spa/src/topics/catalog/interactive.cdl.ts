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
  topic: "input.slider を signal に bind、 node subtitle が signal 変化にリアルタイム追随",
})
  .lane("l", { x: 0, width: W })
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "Value" })
  .state("value", { initial: 50 })
  .node("bar-node", { lane: "l", stack: 0, kind: "card", title: "Bar", subtitle: "value: {value}" })
  .phase("p", { duration: 1500, title: "input.slider → signal → node subtitle", body: "slider を動かすと signal 'value' が更新、 node subtitle {value} が追随。" }, (p: PhaseBuilder) => p.activate("bar-node").badge("bind: value"))
  .build();

/**
 * 2. formula → text bind (formula primitive + reactive computed)。
 */
export const formulaTextBind = diagram("interactive-formula-text", {
  topic: "formula (algebraic mini-DSL) で derived value を宣言、 number 入力変化で自動再計算",
})
  .lane("l", { x: 0, width: W })
  .input.number("input", { defaultValue: 10, label: "Input" })
  .formula("doubled", "input * 2")
  .formula("halved", "input / 2")
  .state("input", { initial: 10 })
  .state("doubled", { initial: 20 })
  .state("halved", { initial: 5 })
  .node("in", { lane: "l", stack: 0, kind: "card", title: "Input", subtitle: "value: {input}" })
  .node("out1", { lane: "l", stack: 1, kind: "card", title: "Doubled", subtitle: "input * 2 = {doubled}" })
  .node("out2", { lane: "l", stack: 2, kind: "card", title: "Halved", subtitle: "input / 2 = {halved}" })
  .phase("p", { duration: 1500, title: "formula は signal 変化で自動再計算", body: "input を変えると formula 'doubled' / 'halved' が computed として reactive に再評価、 node subtitle {doubled} / {halved} も追随。" }, (p: PhaseBuilder) => p.activate("in", "out1", "out2").badge("formula bind"))
  .build();

/**
 * 3. scroll → progress readout (scroll-driven trigger)。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "scroll 位置に応じて 0..1 progress を signal に反映、 node subtitle が progress を追随",
})
  .lane("l", { x: 0, width: W })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "Intro reveal" })
  .state("intro", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "card", title: "Step 1", subtitle: "progress: {intro}" })
  .node("b", { lane: "l", stack: 1, kind: "card", title: "Step 2", subtitle: "progress: {intro}" })
  .node("c", { lane: "l", stack: 2, kind: "card", title: "Step 3", subtitle: "progress: {intro}" })
  .phase("p", { duration: 1500, title: "scroll → 0..1 progress → node subtitle", body: "wrapper element を scroll すると 'intro' progress が 0→1 に変化、 3 node の subtitle も追随。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("scroll bind"))
  .build();

/**
 * 4. click → toggle (event handler + hover)。
 */
export const clickToggle = diagram("interactive-click-toggle", {
  topic: "click event → handler → signal toggle → node subtitle 切替",
})
  .lane("l", { x: 0, width: W })
  .input.toggle("active", { defaultValue: false, label: "Active" })
  .state("active", { initial: "off" })
  .node("btn", { lane: "l", stack: 0, kind: "card", title: "Button", subtitle: "state: {active}" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p", { duration: 1500, title: "click → handler → signal → SVG update", body: "consumer が 'toggle-active' handler を実装、 button click で active signal を反転、 subtitle が追随。" }, (p: PhaseBuilder) => p.activate("btn").badge("event bind"))
  .build();

/**
 * 5. visual binding = slider → node 実 width 変化 (arc-intro 相当の core UX)。
 * slider を drag すると bar node の SVG width が実際に伸縮、 subtitle だけでなく図形が動く。
 */
export const visualBindBar = diagram("interactive-visual-bar", {
  topic: "wBind template で slider → node 実 width、 図形が伸縮する visual binding",
})
  .lane("l", { x: 0, width: W })
  .input.slider("barW", { min: 40, max: 320, defaultValue: 160, label: "Bar width" })
  .state("barW", { initial: 160 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "Dynamic Bar",
    subtitle: "w = {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "Width readout" })
  .phase("p", { duration: 1500, title: "signal → node.w、 図形が実際に伸縮", body: "slider を動かすと bar node の SVG width 属性が signal 'barW' で書換わる、 subtitle だけでなく実描画が動く。" }, (p: PhaseBuilder) => p.activate("bar").badge("visual bind"))
  .build();

/**
 * 6. visual binding = slider → node opacity で fade in/out。
 */
export const visualBindOpacity = diagram("interactive-visual-opacity", {
  topic: "opacity template で 0..1 signal → node fade in/out",
})
  .lane("l", { x: 0, width: W })
  .input.slider("fade", { min: 0, max: 100, defaultValue: 100, label: "Opacity" })
  .formula("op", "fade / 100")
  .state("fade", { initial: 100 })
  .state("op", { initial: 1 })
  .node("target", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "Target",
    subtitle: "opacity: {op}",
    opacity: "{op}",
  })
  .node("ref", { lane: "l", stack: 1, kind: "card", title: "Reference", subtitle: "always visible" })
  .readout.gauge("opGauge", { source: "fade", min: 0, max: 100, label: "Fade %" })
  .phase("p", { duration: 1500, title: "opacity で fade in/out", body: "slider (0..100) で formula 'op' が 0..1 に、 target node opacity が signal に追随する。" }, (p: PhaseBuilder) => p.activate("target", "ref").badge("opacity bind"))
  .build();

/**
 * 7. XY pad = 2 軸選択、 stat readout で x/y を表示。
 */
export const xypadNavigate = diagram("interactive-xypad-nav", {
  topic: "XY pad で 2 軸座標を単一 signal に保持、 stat readout で数値化",
})
  .lane("l", { x: 0, width: W })
  .input.xypad("pos", {
    xMin: 0, xMax: 100, yMin: 0, yMax: 100,
    defaultX: 50, defaultY: 50,
    label: "Position",
  })
  .state("pos", { initial: "50,50" })
  .node("indicator", { lane: "l", stack: 0, kind: "card", title: "Position", subtitle: "{pos}" })
  .readout.stat("posStat", { source: "pos", label: "Selected", caption: "x,y in 0..100" })
  .phase("p", { duration: 1500, title: "XY pad = 2 軸 pointer 選択", body: "pad 内をクリック / drag すると x,y 座標が単一 signal に保持される、 stat readout に反映。" }, (p: PhaseBuilder) => p.activate("indicator").badge("xypad"))
  .build();

/**
 * 8. stepper で phase 相当の値を細かく調整、 bar readout に反映。
 */
export const stepperControl = diagram("interactive-stepper", {
  topic: "stepper で integer 値の細かい増減、 bar readout で可視化",
})
  .lane("l", { x: 0, width: W })
  .input.stepper("count", { min: 0, max: 10, defaultValue: 3, label: "Count" })
  .state("count", { initial: 3 })
  .node("n", { lane: "l", stack: 0, kind: "card", title: "Counter", subtitle: "count = {count}" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "Progress" })
  .readout.stat("countStat", { source: "count", label: "Total", unit: " items" })
  .phase("p", { duration: 1500, title: "+/- ボタンで 1 ずつ増減", body: "stepper の +/- で integer 値を細かく調整、 bar と stat の 2 readout に同時反映。" }, (p: PhaseBuilder) => p.activate("n").badge("stepper"))
  .build();

/**
 * 9. number → sparkline = number 入力の履歴を line chart で。
 */
export const numberSparkline = diagram("interactive-number-spark", {
  topic: "number 入力の変化を sparkline で履歴表示、 直近 15 値を折れ線化",
})
  .lane("l", { x: 0, width: W })
  .input.number("val", { defaultValue: 20, label: "Value" })
  .state("val", { initial: 20 })
  .node("m", { lane: "l", stack: 0, kind: "card", title: "Current", subtitle: "val = {val}" })
  .readout.sparkline("valHist", { source: "val", history: 15, color: "#e57373", label: "History" })
  .readout.stat("valStat", { source: "val", label: "Latest", caption: "input 履歴の最新" })
  .phase("p", { duration: 1500, title: "number 変更で sparkline に履歴 push", body: "number 入力を変えると sparkline が直近 15 変化を保持して line 化、 stat が最新値。" }, (p: PhaseBuilder) => p.activate("m").badge("sparkline"))
  .build();

/**
 * 9b. radio + stat = 選択肢と現在値。 radio で option 切替、 stat で文字列表示。
 */
export const radioSelect = diagram("interactive-radio-select", {
  topic: "radio で排他選択、 stat readout で選択中の option 表示",
})
  .lane("l", { x: 0, width: W })
  .input.radio("mode", { options: ["low", "mid", "high"], defaultValue: "mid", label: "Mode" })
  .state("mode", { initial: "mid" })
  .node("m", { lane: "l", stack: 0, kind: "card", title: "Mode", subtitle: "mode = {mode}" })
  .readout.stat("modeStat", { source: "mode", label: "Current", caption: "選択中" })
  .phase("p", { duration: 1500, title: "radio 選択肢を切替", body: "radio button を click すると mode signal が更新、 subtitle と stat readout が追随。" }, (p: PhaseBuilder) => p.activate("m").badge("radio"))
  .build();

/**
 * 10. color picker で node stroke を変える (theme 実験)。
 */
export const colorPickerTheme = diagram("interactive-color-theme", {
  topic: "color picker で hex color 選択、 node の視覚に反映 (stat で hex 表示)",
})
  .lane("l", { x: 0, width: W })
  .input.color("accent", { defaultValue: "#2d6a8f", label: "Accent" })
  .state("accent", { initial: "#2d6a8f" })
  .node("swatch", { lane: "l", stack: 0, kind: "card", title: "Swatch", subtitle: "hex: {accent}" })
  .readout.stat("hexReadout", { source: "accent", label: "Selected", caption: "hex color" })
  .phase("p", { duration: 1500, title: "color picker → hex signal", body: "color picker で色を選ぶと signal に hex が保持、 subtitle と stat readout に表示。" }, (p: PhaseBuilder) => p.activate("swatch").badge("color"))
  .build();

/**
 * 11. shape primitive = rect fill、 signal で内部が実際に伸縮する汎用 container。
 */
export const shapeRectFill = diagram("interactive-shape-rect", {
  topic: "dyn-rect = 汎用 container、 signal 値で内部 fill 高さが変化",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("v", { min: 0, max: 100, defaultValue: 40, label: "Value" })
  .state("v", { initial: 40 })
  .node("bar", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "Bar Fill",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{v}", fillMax: 100, orient: "up", fill: "#2d6a8f" },
  })
  .phase("p", { duration: 1500, title: "rect の中身が signal に追随", body: "slider を動かすと rect 内部の fill 高さが 0..100 に応じて変化。" }, (p: PhaseBuilder) => p.activate("bar").badge("shape.rect"))
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
  topic: "dyn-circle = 半径 / fillProgress を signal で駆動、 progress ring / pulse を組める",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("p", { min: 0, max: 100, defaultValue: 60, label: "Progress" })
  .formula("prog", "p / 100")
  .state("p", { initial: 60 })
  .state("prog", { initial: 0.6 })
  .node("c", { lane: "l", stack: 0, kind: "dyn-circle", title: "Ring", subtitle: "{p}%", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog}", fill: "#2d6a8f" } })
  .phase("p", { duration: 1500, title: "circle の中央 fill が progress で伸縮", body: "slider を動かすと inner circle radius が 0..outer に応じて変化。" }, (p: PhaseBuilder) => p.activate("c").badge("shape.circle"))
  .build();

/**
 * 14. dyn-arc = 角度で fill sweep、 gauge や circular progress の汎用形。
 */
export const shapeArcSweep = diagram("interactive-shape-arc", {
  topic: "dyn-arc = 角度で fill sweep、 gauge / circular progress を組める",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("a", { min: 0, max: 270, defaultValue: 180, label: "Angle" })
  .state("a", { initial: 180 })
  .node("g", { lane: "l", stack: 0, kind: "dyn-arc", title: "Arc", subtitle: "{a}°", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#2d6a8f" } })
  .phase("p", { duration: 1500, title: "arc の sweep が angle 変化", body: "slider の値 (0..270 度) で arc の描画角度が変化、 gauge の汎用形。" }, (p: PhaseBuilder) => p.activate("g").badge("shape.arc"))
  .build();

/**
 * 15. dyn-wave = 水位表示、 tank / battery / liquid level の汎用形。
 */
export const shapeWaveTank = diagram("interactive-shape-wave", {
  topic: "dyn-wave = 水位 (0..amplitude) を signal で駆動、 tank / battery を組める",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("lvl", { min: 0, max: 100, defaultValue: 55, label: "Level" })
  .state("lvl", { initial: 55 })
  .node("w", { lane: "l", stack: 0, kind: "dyn-wave", title: "Tank", subtitle: "{lvl}%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" } })
  .phase("p", { duration: 1500, title: "wave の水位が signal で変化", body: "slider を動かすと水位が変化、 波の form は amplitude / frequency / waveHeight で調整可。" }, (p: PhaseBuilder) => p.activate("w").badge("shape.wave"))
  .build();

/**
 * 16. dyn-polygon = 頂点数 + 回転を signal で駆動、 badge / medal / spinner の汎用形。
 */
export const shapePolyRotate = diagram("interactive-shape-polygon", {
  topic: "dyn-polygon = 頂点数 3-12 と回転を signal で駆動、 badge / spinner を組める",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("rot", { min: 0, max: 360, defaultValue: 0, label: "Rotation" })
  .input.slider("radius", { min: 20, max: 80, defaultValue: 60, label: "Radius" })
  .state("rot", { initial: 0 })
  .state("radius", { initial: 60 })
  .node("p", { lane: "l", stack: 0, kind: "dyn-polygon", title: "Hexagon", subtitle: "{rot}°", w: 200, h: 200,
    shape: { kind: "polygon", sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#2d6a8f" } })
  .phase("p", { duration: 1500, title: "polygon が回転 + 半径変化", body: "rot slider で hexagon が回転、 radius slider で大きさ変化。 sides を 3-12 で他形状にも。" }, (p: PhaseBuilder) => p.activate("p").badge("shape.polygon"))
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
  topic: "countup / delta / percent-ring / typewriter の 4 新 readout を KPI 風に組合わせ",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("rev", { min: 0, max: 500, defaultValue: 250, label: "Revenue" })
  .input.dropdown("status", { options: ["active", "pending", "closed"], defaultValue: "active", label: "Status" })
  .state("rev", { initial: 250 })
  .state("status", { initial: "active" })
  .node("n", { lane: "l", stack: 0, kind: "card", title: "Dashboard", subtitle: "revenue: {rev} / status: {status}" })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "Revenue", durationMs: 700 })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "Progress" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "Status" })
  .phase("p", { duration: 1500, title: "signal → 4 readout 同時追随", body: "revenue slider で count up + delta ↑↓ + ring 追随、 status dropdown で typewriter reveal。" }, (p: PhaseBuilder) => p.activate("n").badge("dashboard"))
  .build();

/**
 * 19. timeline = 時間軸を signal 化、 play/pause/scrub/speed で phase 相当を手動制御。
 *     time signal 経由で dyn-* shape を動的に駆動。
 */
export const timelineDrive = diagram("interactive-timeline-drive", {
  topic: "timeline (play/pause/scrub/speed) で時間軸 signal、 shape を time で駆動",
})
  .lane("l", { x: 0, width: 400 })
  .input.timeline("t", { duration: 3000, autoplay: true, loop: true, label: "Timeline" })
  .formula("bar", "t * 100")
  .formula("angle", "t * 270")
  .state("t", { initial: 0 })
  .state("bar", { initial: 0 })
  .state("angle", { initial: 0 })
  .node("r", { lane: "l", stack: 0, kind: "dyn-rect", title: "Bar", w: 60, h: 200,
    shape: { kind: "rect", source: "{bar}", fillMax: 100, orient: "up", fill: "#2d6a8f" } })
  .node("a", { lane: "l", stack: 1, kind: "dyn-arc", title: "Arc", w: 140, h: 140,
    shape: { kind: "arc", angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" } })
  .readout.countup("timeCu", { source: "bar", unit: "%", label: "Time %" })
  .phase("p", { duration: 1500, title: "timeline signal で shape 駆動", body: "play / pause / scrub / speed で time を制御、 formula 経由で rect fill / arc angle が同時追随。" }, (p: PhaseBuilder) => p.activate("r", "a").badge("timeline"))
  .build();

/**
 * 20. edge signal binding = 太さ / 色 / dashoffset を signal 追随、 chain の流れを animate。
 */
export const edgeFlowBind = diagram("interactive-edge-flow", {
  topic: "edge の太さ・色・dashoffset を signal で駆動、 chain の流れを animate",
})
  .lane("l", { x: 0, width: 500 })
  .input.slider("flow", { min: 1, max: 15, defaultValue: 5, label: "Flow Width" })
  .input.timeline("t", { duration: 2000, autoplay: true, loop: true, label: "Timeline" })
  .formula("dash", "t * 24")
  .state("flow", { initial: 5 })
  .state("t", { initial: 0 })
  .state("dash", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "card", title: "Source", subtitle: "from" })
  .node("b", { lane: "l", stack: 1, kind: "card", title: "Sink", subtitle: "to" })
  .edge("a", "b", { label: "flow", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .phase("p", { duration: 1500, title: "edge が signal で伸縮 + 流れる", body: "flow slider で太さ、 timeline で dashoffset が更新 → 破線が流れる animation。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("edge bind"))
  .build();

/**
 * 21. new input widgets = range / multi-select / tabs / text の合わせ技。
 */
export const inputVariety = diagram("interactive-input-variety", {
  topic: "range slider + multi-select + tabs + text で複雑な入力を宣言的に組合わせ",
})
  .lane("l", { x: 0, width: 400 })
  .input.range("priceRange", { min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "Price Range" })
  .input.multiSelect("tags", { options: ["new", "sale", "hot", "featured"], defaultValues: ["new"], label: "Tags" })
  .input.tabs("view", { options: ["grid", "list", "compact"], defaultValue: "grid", label: "View" })
  .input.text("query", { defaultValue: "", placeholder: "Search...", maxLength: 50, label: "Query" })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "new" })
  .state("view", { initial: "grid" })
  .state("query", { initial: "" })
  .node("n", { lane: "l", stack: 0, kind: "card", title: "Filter", subtitle: "price {priceRange} / view {view}" })
  .phase("p", { duration: 1500, title: "input 系 4 種", body: "range / multi-select / tabs / text の複合入力、 全て signal で bind。" }, (p: PhaseBuilder) => p.activate("n").badge("input variety"))
  .build();

/**
 * 22. new readouts = heat cell + badge + status dot の合わせ技。
 */
export const readoutVariety = diagram("interactive-readout-variety", {
  topic: "heat cell + badge + status dot で 3 種類の状態表示",
})
  .lane("l", { x: 0, width: 400 })
  .input.slider("temp", { min: 0, max: 100, defaultValue: 42, label: "Temp" })
  .input.dropdown("state", { options: ["online", "offline", "error"], defaultValue: "online", label: "State" })
  .state("temp", { initial: 42 })
  .state("state", { initial: "online" })
  .node("n", { lane: "l", stack: 0, kind: "card", title: "Server", subtitle: "temp {temp} state {state}" })
  .readout.heatCell("tempHeat", { source: "temp", min: 0, max: 100, colors: ["#4e9dc4", "#e57373"], label: "Temp" })
  .readout.badge("tempBadge", { source: "temp", label: "Value" })
  .readout.statusDot("statusRead", { source: "state", map: [
    { value: "online", color: "#22c55e", label: "Online" },
    { value: "offline", color: "#94a3b8", label: "Offline" },
    { value: "error", color: "#ef4444", label: "Error" },
  ], label: "State" })
  .phase("p", { duration: 1500, title: "readout 系 3 種", body: "heat cell で色 gradient、 badge で pill、 status dot で state 表示。" }, (p: PhaseBuilder) => p.activate("n").badge("readout variety"))
  .build();

/**
 * 23. event 拡張 = double-click / keydown / focus / blur を network 化。
 *     signal update は consumer handler 側で実装、 catalog では primitive 存在確認のみ。
 */
export const eventVariety = diagram("interactive-event-variety", {
  topic: "double-click / keydown / focus / blur / longpress の 5 種 event を diagram 内 node に bind",
})
  .lane("l", { x: 0, width: 400 })
  .node("btn1", { lane: "l", stack: 0, kind: "card", title: "Double Click", subtitle: "dblclick 用" })
  .node("btn2", { lane: "l", stack: 1, kind: "card", title: "Key Focus", subtitle: "focus + keydown 用" })
  .node("btn3", { lane: "l", stack: 2, kind: "card", title: "Long Press", subtitle: "500ms hold" })
  .on.doubleClick({ kind: "node", id: "btn1" }, "on-dbl")
  .on.focus({ kind: "node", id: "btn2" }, "on-focus")
  .on.blur({ kind: "node", id: "btn2" }, "on-blur")
  .on.keydown({ kind: "node", id: "btn2" }, "on-key")
  .on.longPress({ kind: "node", id: "btn3" }, "on-long")
  .phase("p", { duration: 1500, title: "5 種 event kind を 3 node に bind", body: "consumer が handler map で dbl / focus / blur / keydown / longpress を実装、 signal 更新経由で reactive 反映。" }, (p: PhaseBuilder) => p.activate("btn1", "btn2", "btn3").badge("event bind"))
  .build();

/**
 * 24. gridNodes = 2D grid layout。 rows × cols の matrix を宣言的に生成、
 *     signal で個別 cell の hover 状態を bind。
 */
export const gridLayoutMatrix = diagram("interactive-grid-matrix", {
  topic: "gridNodes(3, 4) で 3 行 4 列の cell を宣言的生成、 hover cell の座標 (r, c) を signal で追跡",
})
  .lane("l", { x: 0, width: 480 })
  .input.stepper("r", { min: 0, max: 2, defaultValue: 0, label: "Row" })
  .input.stepper("c", { min: 0, max: 3, defaultValue: 0, label: "Col" })
  .state("r", { initial: 0 })
  .state("c", { initial: 0 })
  .gridNodes(3, 4, (r, c, i) => ({
    id: `cell-{r}-{c}`,
    lane: "l",
    stack: i,
    kind: "card" as const,
    title: `r{r} c{c}`,
    subtitle: `#${i + 1}`,
  }))
  .readout.stat("hover", { source: "r", label: "Row" })
  .readout.stat("hoverC", { source: "c", label: "Col" })
  .phase("p", { duration: 1200, title: "3×4 grid、 12 cell 一括宣言", body: "gridNodes(3,4,tpl) で 12 cell を生成、 template `{r}` / `{c}` / `{i}` で id と subtitle 化。" }, (p: PhaseBuilder) => p.activate(
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
  topic: "arraySignal([12,34,20,45,28]) を bar histogram + bullet list で見せる、 {xs.sum} / {xs.avg} も node subtitle 化",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("xs", [12, 34, 20, 45, 28])
  .input.slider("bump", { min: 0, max: 50, defaultValue: 20, label: "First bar" })
  .node("summary", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "Array signal",
    subtitle: "count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}",
  })
  .readout.arrayBar("hist", { source: "xs", min: 0, max: 50, color: "#2563eb", label: "Bars" })
  .readout.arrayList("items", { source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "Items" })
  .readout.stat("first", { source: "bump", label: "Bump" })
  .phase("p", { duration: 1200, title: "array を 1 signal で持つ", body: "arraySignal(id, initial) で JSON 格納、 template で `{sig[0]}` / `{sig.length}` / `{sig.sum}` / `{sig.avg}` / `{sig.max}` access。" }, (p: PhaseBuilder) => p.activate("summary").badge("array signal"))
  .build();

/**
 * 26. pathProgress readout + visibleIf。 slider で progress、 完了時 badge を visibleIf 経由で表示。
 */
export const pathProgressDemo = diagram("interactive-path-progress", {
  topic: "SVG path 上を signal 0-100 進行 (stroke-dashoffset) + 完了時 badge 表示 (visibleIf)",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("progress", { min: 0, max: 100, defaultValue: 40, label: "Progress" })
  .state("progress", { initial: 40 })
  .state("done", { initial: 0 })
  .formula("done", "progress >= 100 ? 1 : 0")
  .node("main", { lane: "l", stack: 0, kind: "card", title: "Task", subtitle: "{progress}% complete" })
  .node("ok", { lane: "l", stack: 1, kind: "card", title: "Done", subtitle: "全部完了", visibleIf: "{done}" })
  .readout.pathProgress("pp", {
    source: "progress",
    pathD: "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10",
    viewW: 270,
    viewH: 40,
    strokeWidth: 5,
    color: "#22c55e",
    max: 100,
    label: "Path",
  })
  .readout.percentRing("ring", { source: "progress", max: 100, color: "#22c55e", label: "Ring" })
  .phase("p", { duration: 1200, title: "path 上を進行 + 条件表示", body: "pathProgress で SVG path の stroke-dashoffset を signal 追随、 visibleIf で完了時 node 表示。" }, (p: PhaseBuilder) => p.activate("main", "ok").badge("progress + hide"))
  .build();

/**
 * 27. lineChart readout = array signal を折れ線 chart 表示 (時系列 like)。
 */
export const arrayLineChart = diagram("interactive-array-line-chart", {
  topic: "arraySignal を line chart readout で時系列的に表示、 fill=true で area chart 化",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("series", [22, 35, 28, 42, 55, 48, 60, 72, 65, 80])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Time series", subtitle: "n={series.length} · sum={series.sum} · avg={series.avg}" })
  .readout.lineChart("chart", { source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "Series" })
  .readout.lineChart("chartNoFill", { source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "No fill" })
  .phase("p", { duration: 1200, title: "array → 折れ線", body: "lineChart で array element を x=index / y=value に mapping、 fill=true で area 化。" }, (p: PhaseBuilder) => p.activate("card").badge("line chart"))
  .build();

/**
 * 28. stackedBar readout = 2 array を並列 bar 比較、 A/B histogram の per-index 対比。
 */
export const arrayStackedBar = diagram("interactive-array-stacked-bar", {
  topic: "2 arraySignal (A/B) を stackedBar で並列表示、 各 index で A/B を隣接 bar 比較",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("groupA", [40, 55, 30, 65, 45])
  .arraySignal("groupB", [25, 40, 50, 35, 60])
  .node("card", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "A vs B",
    subtitle: "sumA={groupA.sum} · sumB={groupB.sum} · diff={groupA.sum}-{groupB.sum}",
  })
  .readout.stackedBar("cmp", {
    sourceA: "groupA",
    sourceB: "groupB",
    min: 0,
    max: 80,
    colorA: "#2563eb",
    colorB: "#f97316",
    label: "A / B",
  })
  .phase("p", { duration: 1200, title: "2 系列 の bar 比較", body: "stackedBar で sourceA / sourceB を並列 bar、 A/B の各 index 比較。" }, (p: PhaseBuilder) => p.activate("card").badge("stacked bar"))
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
  topic: "arraySignal([100,-30,50,-20,40]) を waterfall readout で累積 bar chart 化",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("changes", [100, -30, 50, -20, 40])
  .node("card", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "Waterfall",
    subtitle: "final = start(0) + sum({changes.sum}) = {changes.sum}",
  })
  .readout.waterfall("wf", {
    source: "changes",
    min: -30,
    max: 150,
    viewW: 280,
    viewH: 90,
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "Changes",
  })
  .readout.arrayList("items", { source: "changes", itemTemplate: "step {i}: {item}", label: "Steps" })
  .phase("p", { duration: 1200, title: "累積 bar", body: "waterfall で array を左から累積、 正 / 負 で色分け、 connector line で連続表示。" }, (p: PhaseBuilder) => p.activate("card").badge("waterfall"))
  .build();

/**
 * 31. renderOffset signal binding = slider で node が動く、 renderOffsetX/Y に signal template。
 */
export const renderOffsetDrift = diagram("interactive-render-offset", {
  topic: "slider で renderOffsetX の signal を変えると node が横に drift、 signal 変化に追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("dx", { min: -80, max: 80, defaultValue: 0, label: "Drift X" })
  .input.slider("dy", { min: -40, max: 40, defaultValue: 0, label: "Drift Y" })
  .state("dx", { initial: 0 })
  .state("dy", { initial: 0 })
  .node("anchor", { lane: "l", stack: 0, kind: "card", title: "Anchor", subtitle: "固定" })
  .node("floater", {
    lane: "l",
    stack: 1,
    kind: "card",
    title: "Floater",
    subtitle: "dx={dx} · dy={dy}",
    renderOffsetX: "{dx}",
    renderOffsetY: "{dy}",
  })
  .phase("p", { duration: 1200, title: "reactive 位置", body: "renderOffsetX/Y に signal template、 slider 変化で node が実際に横 / 縦に drift。" }, (p: PhaseBuilder) => p.activate("anchor", "floater").badge("offset bind"))
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
  topic: "arraySignal 2 種 (values + labels) を progress-group で task list として並列表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("progress", [40, 75, 20, 90])
  .arraySignal("names", ["Design", "Impl", "Test", "Docs"])
  .node("card", {
    lane: "l",
    stack: 0,
    kind: "card",
    title: "Sprint progress",
    subtitle: "avg={progress.avg}% · max={progress.max}%",
  })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "Tasks",
  })
  .phase("p", { duration: 1200, title: "task list", body: "progressGroup で per-row progress bar + label 表示、 2 arraySignal (value / name) を combined 表示。" }, (p: PhaseBuilder) => p.activate("card").badge("task list"))
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
  topic: "5 次元 skill を radar (polygon spider chart) で可視化、 labelSource で軸名も同時表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("skills", [8, 5, 7, 3, 9])
  .arraySignal("skillNames", ["Design", "Impl", "Test", "Docs", "Debug"])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Skill profile", subtitle: "avg={skills.avg} · max={skills.max}" })
  .readout.radar("radar", { source: "skills", max: 10, labelSource: "skillNames", color: "#2563eb", viewW: 200, viewH: 200, label: "Skills" })
  .phase("p", { duration: 1200, title: "5-dim skill", body: "radar で 5 次元 array を polygon chart 化、 labelSource で軸名 (Design/Impl/Test/Docs/Debug)。" }, (p: PhaseBuilder) => p.activate("card").badge("radar"))
  .build();

/**
 * 38. bubble chart = 3D data (perf / cost / usage) の bubbles、 各点の size で 3 次元目を表現。
 */
export const perfBubbleChart = diagram("interactive-perf-bubble", {
  topic: "perf (x) × cost (y) × usage (bubble size) の 3D data を bubble chart で可視化",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("perf", [
    [50, 20, 5],
    [70, 40, 8],
    [90, 60, 10],
    [30, 80, 3],
    [60, 50, 7],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Perf vs Cost", subtitle: "5 workloads の 3D data" })
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
    label: "workloads",
  })
  .phase("p", { duration: 1200, title: "3D bubble", body: "5 workload の (perf, cost, usage) を bubble chart で可視化、 bubble 半径 = usage 次元。" }, (p: PhaseBuilder) => p.activate("card").badge("3D bubble"))
  .build();

/**
 * 39. donut chart = portfolio share (asset allocation) を multi-segment donut 表示。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "portfolio allocation を multi-segment donut chart で表示、 6 色 palette で自動着色",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("assets", [45, 30, 15, 10])
  .arraySignal("assetNames", ["Stocks", "Bonds", "Cash", "Crypto"])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Portfolio", subtitle: "total={assets.sum}% · 4 assets" })
  .readout.donut("d", { source: "assets", innerRatio: 0.55, viewW: 160, viewH: 160, label: "Allocation" })
  .readout.arrayList("legend", { source: "assetNames", itemTemplate: "● {item}", label: "Legend" })
  .phase("p", { duration: 1200, title: "donut", body: "arraySignal を donut で per-segment 分割、 arrayList で legend も並列表示。" }, (p: PhaseBuilder) => p.activate("card").badge("donut"))
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
  topic: "1000×800 canvas 上の viewport rect (400×300) を slider で移動、 mini-map で 縮小表示",
})
  .lane("l", { x: 0, width: 500 })
  .input.slider("panX", { min: 0, max: 600, defaultValue: 300, label: "Pan X" })
  .input.slider("panY", { min: 0, max: 500, defaultValue: 250, label: "Pan Y" })
  .state("panX", { initial: 300 })
  .state("panY", { initial: 250 })
  .arraySignal("viewport", [300, 250, 400, 300])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Canvas overview", subtitle: "pan ({panX}, {panY}) view 400×300" })
  .readout.miniMap("map", { source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "Overview" })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "X" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "Y" })
  .phase("p", { duration: 1200, title: "canvas mini-map", body: "大 canvas 上の viewport を縮小表示、 slider で座標変化 → mini-map の viewport rect が動く経路。" }, (p: PhaseBuilder) => p.activate("card").badge("mini-map"))
  .build();

/**
 * 44. kpi-card = revenue の現在値 + 直前値との delta + 6 point history sparkline を composite。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "revenue KPI を slider で操作、 kpi-card で 現在値 + 前月比 + 6 month sparkline を 1 tile 表示",
})
  .lane("l", { x: 0, width: 500 })
  .input.slider("current", { min: 50, max: 300, defaultValue: 180, label: "Current revenue (k)" })
  .state("current", { initial: 180 })
  .state("prev", { initial: 150 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Revenue KPI", subtitle: "current {current}k · previous {prev}k" })
  .readout.kpiCard("kpi", { source: "current", historySource: "history", comparisonSource: "prev", unit: "k", colorPos: "#22c55e", colorNeg: "#ef4444", label: "Revenue" })
  .readout.stat("prevStat", { source: "prev", unit: "k", label: "Prev" })
  .phase("p", { duration: 1200, title: "KPI card", body: "slider で current 変化 → kpi-card の 数字 + delta arrow + sparkline が同時追随、 前月比 % change 表示。" }, (p: PhaseBuilder) => p.activate("card").badge("KPI card"))
  .build();

/**
 * 45. candlestick chart = 8 日分の OHLC を蝋燭足で表示 (finance chart)。
 */
export const priceCandlestick = diagram("interactive-price-candlestick", {
  topic: "8 day の OHLC array を candlestick chart で表示、 up/down 色分け + wick + body + title tooltip",
})
  .lane("l", { x: 0, width: 480 })
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
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Price 8d", subtitle: "OHLC candles" })
  .readout.candlestick("chart", { source: "ohlc", min: 95, max: 122, viewW: 300, viewH: 110, colorUp: "#22c55e", colorDown: "#ef4444", label: "OHLC" })
  .phase("p", { duration: 1200, title: "candlestick", body: "8 day の OHLC (open, high, low, close) を蝋燭足で描画、 close>=open で緑 / down で赤、 wick で high-low レンジ。" }, (p: PhaseBuilder) => p.activate("card").badge("finance"))
  .build();

/**
 * 46. Venn diagram = 2 set (Users / Payers) の intersection を可視化。
 */
export const userVenn = diagram("interactive-user-venn", {
  topic: "2 set (Users 100 / Payers 40 / intersection 25) の Venn diagram、 intersection ratio で 円間隔調整",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("sets", [100, 40, 25])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Overlap", subtitle: "A=100 · B=40 · A∩B=25" })
  .readout.venn("v", { source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "Users", labelB: "Payers", label: "Overlap" })
  .phase("p", { duration: 1200, title: "Venn 2-set", body: "|A|, |B|, |A∩B| の 3-tuple を 2-set Venn で表示、 intersection 比で 円 gap を自動調整。" }, (p: PhaseBuilder) => p.activate("card").badge("Venn"))
  .build();

/**
 * 47. slope chart = 5 student の test score before/after 変化を slope で表示。
 */
export const scoreSlope = diagram("interactive-score-slope", {
  topic: "5 student の test score の before → after 変化を slope chart で表示、 up/down 色分け",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("scores", [
    [65, 82, "Alice"],
    [70, 68, "Bob"],
    [55, 78, "Carol"],
    [80, 88, "Dan"],
    [60, 55, "Eve"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Test scores", subtitle: "5 students の before/after" })
  .readout.slope("s", { source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "Score change" })
  .phase("p", { duration: 1200, title: "slope chart", body: "[before, after, name] tuple array を 2 column slope で表示、 上昇=緑 / 下降=赤、 dot + 学生名 label。" }, (p: PhaseBuilder) => p.activate("card").badge("slope"))
  .build();

/**
 * 48. sales funnel = 4 stage の conversion funnel (Visit → Signup → Trial → Paid)。
 */
export const salesFunnel = diagram("interactive-sales-funnel", {
  topic: "sales conversion funnel を 4 stage で可視化、 [stage, count] tuple array を trapezoid で描画",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("stages", [
    ["Visit", 1000],
    ["Signup", 400],
    ["Trial", 150],
    ["Paid", 40],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Sales funnel", subtitle: "Visit → Paid の 4 stage" })
  .readout.funnel("f", { source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#94a3b8", label: "Conversion" })
  .phase("p", { duration: 1200, title: "sales funnel", body: "[[stage, count], ...] を trapezoid で描画、 gradient color で top=blue → bottom=gray に変化、 各 stage の count 表示。" }, (p: PhaseBuilder) => p.activate("card").badge("funnel"))
  .build();

/**
 * 49. project gantt = 4 task を 10 day timeline 上に配置。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "project 4 task (Design/Impl/Test/Ship) を 10 day timeline 上に gantt 表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("tasks", [
    ["Design", 0, 3],
    ["Impl", 3, 5],
    ["Test", 6, 3],
    ["Ship", 9, 1],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Sprint gantt", subtitle: "10 day sprint、 4 task" })
  .readout.gantt("g", { source: "tasks", min: 0, max: 10, viewW: 320, viewH: 140, color: "#2563eb", label: "Timeline" })
  .phase("p", { duration: 1200, title: "gantt", body: "[[name, start, duration], ...] を横 timeline bar で描画、 start-x / duration-w で position。" }, (p: PhaseBuilder) => p.activate("card").badge("gantt"))
  .build();

/**
 * 50. resource treemap = 6 team の share 割合を hierarchical rectangles で表示。
 */
export const resourceTreemap = diagram("interactive-resource-treemap", {
  topic: "6 team の budget share を treemap で hierarchical rectangles 表示、 area 比例配置",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("teams", [
    ["Engineering", 45],
    ["Sales", 20],
    ["Marketing", 15],
    ["Support", 10],
    ["Ops", 6],
    ["Legal", 4],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Budget share", subtitle: "6 team の budget を area 比例" })
  .readout.treemap("t", { source: "teams", viewW: 280, viewH: 200, label: "Budget" })
  .phase("p", { duration: 1200, title: "treemap", body: "[[name, size], ...] を area 比例配置、 単純 squarified 風 layout で 6 team を 6 色 palette で分割表示。" }, (p: PhaseBuilder) => p.activate("card").badge("treemap"))
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
  topic: "revenue を 大 numeric display (scoreboard) で表示、 slider で $/M prefix/suffix 付き 動的更新",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("rev", { min: 0, max: 999, defaultValue: 234, label: "Revenue" })
  .state("rev", { initial: 234 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Q3 revenue", subtitle: "target: $500M" })
  .readout.numberBoard("nb", { source: "rev", prefix: "$", suffix: "M", size: 56, color: "#0f172a", caption: "vs $500M target", label: "Revenue" })
  .phase("p", { duration: 1200, title: "score board", body: "slider で revenue 変化 → 56px 大 数字 + $ prefix + M suffix + caption で表示、 dashboard header 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("scoreboard"))
  .build();

/**
 * 56. leaderboard = 6 player の score ranking を top 5 表示 (medal 色 + bar + value)。
 */
export const playerLeaderboard = diagram("interactive-player-leaderboard", {
  topic: "6 player の score ranking を leaderboard で top 5 表示、 top 3 に medal 色 (gold/silver/bronze)",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("players", [
    ["Alice", 920],
    ["Bob", 780],
    ["Carol", 850],
    ["Dan", 680],
    ["Eve", 890],
    ["Frank", 720],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Player ranking", subtitle: "top 5 of 6" })
  .readout.leaderboard("lb", { source: "players", max: 5, color: "#2563eb", label: "Ranking" })
  .phase("p", { duration: 1200, title: "leaderboard", body: "6 player の score を desc sort、 top 5 に rank + name + bar + value を表示、 top 3 に medal 色 (gold/silver/bronze) 装飾。" }, (p: PhaseBuilder) => p.activate("card").badge("leaderboard"))
  .build();

/**
 * 57. traffic-light = 3-color status、 dropdown で red/yellow/green 選択 → active dot が glow 表示。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "build status を traffic light で表示、 dropdown で red (failed) / yellow (running) / green (passed) 選択",
})
  .lane("l", { x: 0, width: 480 })
  .input.dropdown("status", { options: ["red", "yellow", "green"], defaultValue: "green", label: "Build status" })
  .state("status", { initial: "green" })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "CI build", subtitle: "current: {status}" })
  .readout.trafficLight("tl", { source: "status", viewW: 70, viewH: 180, label: "Status" })
  .phase("p", { duration: 1200, title: "traffic light", body: "dropdown で red/yellow/green 選択 → 該当色 dot に glow filter、 CI/deploy status の定番 3-color indicator。" }, (p: PhaseBuilder) => p.activate("card").badge("status"))
  .build();

/**
 * 58. tag-cloud = tech skill 8 種を weight 比例 font-size で表示。
 */
export const techTagCloud = diagram("interactive-tech-tagcloud", {
  topic: "tech skill 8 種を weight 比例 font-size (12-32px) で並列表示、 色 palette rotate",
})
  .lane("l", { x: 0, width: 480 })
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
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Skills", subtitle: "8 tech + weight" })
  .readout.tagCloud("tc", { source: "tags", minSize: 12, maxSize: 32, label: "Tech cloud" })
  .phase("p", { duration: 1200, title: "tag cloud", body: "[[tag, weight], ...] を weight 比例 font-size で表示、 minSize=12 / maxSize=32 の範囲で正規化、 keyword prominence 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("tags"))
  .build();

/**
 * 59. activity-feed = team activity 5 event を feed list で表示。
 */
export const teamActivityFeed = diagram("interactive-team-activity", {
  topic: "team activity 5 event を feed list で表示 (actor + action + time)、 recent-first",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("events", [
    ["Alice", "pushed to main", "2 min ago"],
    ["Bob", "opened PR #42", "8 min ago"],
    ["Carol", "reviewed PR #40", "15 min ago"],
    ["Dan", "merged PR #38", "1 h ago"],
    ["Eve", "deployed v1.2", "3 h ago"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Team activity", subtitle: "5 recent events" })
  .readout.activityFeed("af", { source: "events", max: 5, color: "#2563eb", label: "Recent" })
  .phase("p", { duration: 1200, title: "activity feed", body: "[[actor, action, time], ...] を feed list で表示、 bullet + actor(強調) + action + time の 3 column layout、 team stream 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("feed"))
  .build();

/**
 * 60. rating = 5 star rating を slider (0-5) で表示、 half-star 対応。
 */
export const productRating = diagram("interactive-product-rating", {
  topic: "product rating を slider (0-5) で操作、 star display で half-star 対応表示",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("score", { min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "Score" })
  .state("score", { initial: 3.5 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Product review", subtitle: "current: {score} / 5" })
  .readout.rating("r", { source: "score", count: 5, color: "#eab308", label: "Rating" })
  .phase("p", { duration: 1200, title: "star rating", body: "slider で 0.5 刻み score 変化 → star display の 5 star が full/half/empty で表示、 SVG linearGradient で half-star 実装。" }, (p: PhaseBuilder) => p.activate("card").badge("rating"))
  .build();

/**
 * 61. notification = alert card、 dropdown で kind (info/warn/error/success) を切替。
 */
export const alertNotification = diagram("interactive-alert-notification", {
  topic: "alert notification card、 dropdown で kind (info/warn/error/success) 切替 → color + icon 変化",
})
  .lane("l", { x: 0, width: 480 })
  .input.dropdown("kind", { options: ["info", "warn", "error", "success"], defaultValue: "warn", label: "Kind" })
  .state("kind", { initial: "warn" })
  .state("title", { initial: "Deploy in progress" })
  .state("body", { initial: "Building v1.2.3 for production" })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Alert center", subtitle: "kind: {kind}" })
  .readout.notification("nt", { kindSource: "kind", titleSource: "title", bodySource: "body", label: "Alert" })
  .phase("p", { duration: 1200, title: "notification", body: "kind 4 種を dropdown で切替 → color + icon (ℹ/⚠/✕/✓) が動的更新、 title + body 2 段表示。" }, (p: PhaseBuilder) => p.activate("card").badge("alert"))
  .build();

/**
 * 62. diff-counter = git commit style +N/-N、 stepper で additions / deletions 変化。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "git commit style +N/-N counter、 stepper で additions/deletions 変化 → 比率 bar 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.stepper("add", { min: 0, max: 500, step: 10, defaultValue: 120, label: "Additions" })
  .input.stepper("del", { min: 0, max: 500, step: 10, defaultValue: 45, label: "Deletions" })
  .state("add", { initial: 120 })
  .state("del", { initial: 45 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "PR diff", subtitle: "+{add} / -{del} lines" })
  .readout.diffCounter("dc", { additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "Diff" })
  .phase("p", { duration: 1200, title: "diff counter", body: "stepper で additions/deletions 変化 → +N / -N text + proportion bar が同時追随、 git PR diff 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("diff"))
  .build();

/**
 * 63. chat-bubble = customer support conversation 5 message、 self/other 左右寄せ表示。
 */
export const supportChat = diagram("interactive-support-chat", {
  topic: "customer support conversation 5 message を chat-bubble で左右寄せ表示 (self/other)",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("thread", [
    ["Alice", "Hi, I need help with my order", false],
    ["Support", "Sure! What's the order ID?", true],
    ["Alice", "#12345", false],
    ["Support", "Checking...", true],
    ["Support", "Refunded! You'll see it in 3-5 days.", true],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Support chat", subtitle: "5 messages" })
  .readout.chatBubble("cb", { source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#e2e8f0", label: "Conversation" })
  .phase("p", { duration: 1200, title: "chat bubble", body: "[[author, text, isSelf], ...] の 5 message を isSelf=true で右寄せ + blue / false で左寄せ + gray、 chat thread 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("chat"))
  .build();

/**
 * 64. avatar = user profile avatar、 text input で name 変化 → initials + color circle 追随。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "user profile avatar、 text input で name 変化 → initials 2 char + color circle が動的更新",
})
  .lane("l", { x: 0, width: 480 })
  .input.text("user", { defaultValue: "Alice Wonderland", placeholder: "Full name", maxLength: 40, label: "User name" })
  .state("user", { initial: "Alice Wonderland" })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Profile", subtitle: "current: {user}" })
  .readout.avatar("av", { source: "user", size: 56, color: "#2563eb", label: "Avatar" })
  .phase("p", { duration: 1200, title: "avatar", body: "text input で name 変化 → 最初 2 word の頭文字を抽出 (Alice Wonderland → AW)、 colored circle + name text を表示。" }, (p: PhaseBuilder) => p.activate("card").badge("avatar"))
  .build();

/**
 * 65. checklist = sprint task list 6 item、 progress% 表示。
 */
export const sprintChecklist = diagram("interactive-sprint-checklist", {
  topic: "sprint 6 task を checklist で表示、 progress% (2/6 = 33%) と併記",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("tasks", [
    ["Setup CI", true],
    ["Write tests", true],
    ["Fix bug #42", false],
    ["Code review", false],
    ["Deploy staging", false],
    ["Post-mortem", false],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Sprint tasks", subtitle: "6 items、 2 done" })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "Progress" })
  .phase("p", { duration: 1200, title: "checklist", body: "[[label, checked], ...] を 6 checkbox + progress% (2/6 = 33%) で表示、 done は green box + checkmark、 unchecked は border only。" }, (p: PhaseBuilder) => p.activate("card").badge("checklist"))
  .build();

/**
 * 66. circular-gauge = engine RPM を 270° dial で表示、 slider で 0-8000 rpm 制御。
 */
export const engineTachometer = diagram("interactive-engine-tachometer", {
  topic: "engine RPM を 270° circular gauge で表示、 slider で 0-8000 rpm 制御 → needle + arc 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("rpm", { min: 0, max: 8000, defaultValue: 3500, label: "RPM" })
  .state("rpm", { initial: 3500 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Engine tach", subtitle: "current: {rpm} rpm" })
  .readout.circularGauge("g", { source: "rpm", min: 0, max: 8000, unit: "rpm", color: "#f97316", viewW: 200, viewH: 160, label: "Tachometer" })
  .phase("p", { duration: 1200, title: "270° dial", body: "slider で rpm 変化 → 270° arc + needle + center value + unit の全要素が同時追随、 speedometer / tachometer 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("tachometer"))
  .build();

/**
 * 67. price-tag = e-commerce 商品価格、 stepper で newPrice 変化 → discount % 自動計算。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "e-commerce 商品価格、 stepper で newPrice 変化 → discount % + savings が自動計算追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.stepper("newPrice", { min: 0, max: 200, step: 5, defaultValue: 65, label: "New price" })
  .state("newPrice", { initial: 65 })
  .state("oldPrice", { initial: 100 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Product", subtitle: "was ${oldPrice}、 now ${newPrice}" })
  .readout.priceTag("pt", { oldSource: "oldPrice", newSource: "newPrice", currency: "$", colorNew: "#0f172a", colorOld: "#94a3b8", colorDiscount: "#ef4444", label: "Price" })
  .phase("p", { duration: 1200, title: "price tag", body: "stepper で new price 変化 → 大 数字 (new) + strikethrough (old) + discount % (red badge) + savings text が同時追随、 e-commerce 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("price"))
  .build();

/**
 * 68. spinner = deploy status、 dropdown で running/done/error 切替 → icon 変化。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "deploy status を dropdown で切替、 running=animate spinner / done=green ✓ / error=red ✕ + text",
})
  .lane("l", { x: 0, width: 480 })
  .input.dropdown("status", { options: ["running", "done", "error"], defaultValue: "running", label: "Status" })
  .input.text("msg", { defaultValue: "Building production bundle...", placeholder: "Status message", maxLength: 60, label: "Message" })
  .state("status", { initial: "running" })
  .state("msg", { initial: "Building production bundle..." })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Deploy state", subtitle: "{status}: {msg}" })
  .readout.spinner("sp", { source: "status", textSource: "msg", color: "#2563eb", label: "Deploy" })
  .phase("p", { duration: 1200, title: "spinner", body: "dropdown で 3 state 切替 → running は SMIL 回転 circle、 done は green ✓、 error は red ✕ に icon が変わる、 loading state 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("loading"))
  .build();

/**
 * 69. grade = exam score を slider で操作 → A/B/C/D/F letter grade + color 追随。
 */
export const examGrade = diagram("interactive-exam-grade", {
  topic: "exam score (0-100) を slider で操作 → letter grade (A/B/C/D/F) + color band 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("score", { min: 0, max: 100, defaultValue: 85, label: "Score" })
  .state("score", { initial: 85 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Exam grade", subtitle: "score: {score} / 100" })
  .readout.grade("g", { source: "score", max: 100, label: "Letter grade" })
  .phase("p", { duration: 1200, title: "letter grade", body: "slider で score 変化 → A(≥90)/B(≥80)/C(≥70)/D(≥60)/F(<60) の 5 color band で letter が動的更新。" }, (p: PhaseBuilder) => p.activate("card").badge("grade"))
  .build();

/**
 * 70. stopwatch = ms 数値 (stepper で秒指定) を MM:SS.ms display で表示。
 */
export const timerStopwatch = diagram("interactive-timer-stopwatch", {
  topic: "elapsed ms を stepper で操作 → MM:SS.ms 形式 stopwatch display で表示、 running toggle も",
})
  .lane("l", { x: 0, width: 480 })
  .input.stepper("sec", { min: 0, max: 3600, step: 5, defaultValue: 125, label: "Elapsed sec" })
  .input.toggle("running", { defaultValue: true, label: "Running" })
  .state("sec", { initial: 125 })
  .state("running", { initial: "true" })
  .state("elapsed", { initial: 125000 })
  .formula("elapsed", "sec * 1000")
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Timer", subtitle: "elapsed: {sec}s, running: {running}" })
  .readout.stopwatch("sw", { source: "elapsed", runningSource: "running", size: 40, color: "#0f172a", label: "Timer" })
  .phase("p", { duration: 1200, title: "stopwatch", body: "stepper で sec 変化 → formula で ms 変換 → MM:SS.ms display 表示、 running toggle で色が green ↔ dark 切替。" }, (p: PhaseBuilder) => p.activate("card").badge("timer"))
  .build();

/**
 * 71. confidence-meter = ML classification confidence を slider で操作 → 3 color band 追随。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "ML classification confidence 0-100 % を slider で操作 → low/mid/high 3 color band 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("conf", { min: 0, max: 100, defaultValue: 82, label: "Confidence %" })
  .state("conf", { initial: 82 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "AI prediction", subtitle: "confidence: {conf}%" })
  .readout.confidenceMeter("cm", { source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 280, viewH: 40, label: "Confidence" })
  .phase("p", { duration: 1200, title: "confidence meter", body: "slider で confidence % 変化 → 3 range band (low<40=red / mid=yellow / high≥75=green) で bar 色 + band label が動的更新、 ML/AI 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("ML conf"))
  .build();

/**
 * 72. reaction-bar = social post reactions、 4 emoji + count で pill 表示。
 */
export const postReactions = diagram("interactive-post-reactions", {
  topic: "social post reactions を 4 emoji + count の pill list で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("reactions", [
    ["👍", 24],
    ["❤️", 12],
    ["😂", 8],
    ["🎉", 5],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Post reactions", subtitle: "4 emoji type" })
  .readout.reactionBar("rb", { source: "reactions", color: "#2563eb", label: "Reactions" })
  .phase("p", { duration: 1200, title: "reactions", body: "[[emoji, count], ...] を pill (border color) + emoji + count で並列表示、 social media 定番の reaction UI。" }, (p: PhaseBuilder) => p.activate("card").badge("social"))
  .build();

/**
 * 73. pill-group = tech skill 色付き pills、 [[label, colorHex], ...] で per-pill color。
 */
export const techPills = diagram("interactive-tech-pills", {
  topic: "tech skill を 色付き pill list で表示、 [[label, colorHex], ...] で per-pill color 制御",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("stack", [
    ["React", "#61dafb"],
    ["TypeScript", "#3178c6"],
    ["Rust", "#dea584"],
    ["Vite", "#646cff"],
    ["Bun", "#000000"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Tech stack", subtitle: "5 pills" })
  .readout.pillGroup("pg", { source: "stack", label: "Stack" })
  .phase("p", { duration: 1200, title: "pill group", body: "[[label, colorHex], ...] の 2-tuple で per-pill color 制御、 tech stack / tag list 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("pills"))
  .build();

/**
 * 74. fuel-bar = device battery、 slider で 0-100% 変化 → 10 segment + 3 color band 追随。
 */
export const deviceBattery = diagram("interactive-device-battery", {
  topic: "device battery を slider で操作 → 10 segment fuel bar + 3 color band (red/yellow/green)",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("battery", { min: 0, max: 100, defaultValue: 72, label: "Battery %" })
  .state("battery", { initial: 72 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Battery", subtitle: "{battery}%" })
  .readout.fuelBar("fb", { source: "battery", segments: 10, lowThreshold: 20, highThreshold: 60, viewW: 240, viewH: 32, label: "Level" })
  .phase("p", { duration: 1200, title: "fuel bar", body: "slider で battery % 変化 → 10 segment horizontal bar が filled 数追随 + 3 color band で色切替 (低=red / 中=yellow / 高=green)、 battery / fuel / stamina 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("battery"))
  .build();

/**
 * 75. metrics-grid = SaaS dashboard の 4 KPI を 2×2 grid 表示。
 */
export const dashboardMetricsGrid = diagram("interactive-metrics-grid", {
  topic: "SaaS dashboard の 4 KPI (Users / Revenue / Uptime / Errors) を 2×2 grid で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("kpis", [
    ["Users", "12.4k"],
    ["Revenue", "$45k"],
    ["Uptime", "99.9", "%"],
    ["Errors", 12],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Dashboard", subtitle: "4 KPI 2×2 grid" })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "Metrics" })
  .phase("p", { duration: 1200, title: "metrics grid", body: "[[name, value, unit?], ...] を 2×2 grid で 4 stat 並列表示、 dashboard header 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("grid"))
  .build();

/**
 * 76. thermometer = 室温 24°C を slider で操作 → 縦 bar + 球部 で温度表示。
 */
export const roomThermometer = diagram("interactive-room-thermometer", {
  topic: "室温 24°C を slider で操作 → thermometer readout の 縦 bar + 球部が追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("temp", { min: 0, max: 40, defaultValue: 24, label: "Temp °C" })
  .state("temp", { initial: 24 })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Room temp", subtitle: "{temp}°C" })
  .readout.thermometer("th", { source: "temp", min: 0, max: 40, viewW: 70, viewH: 180, color: "#ef4444", unit: "°C", label: "Temp" })
  .phase("p", { duration: 1200, title: "thermometer", body: "slider で 0-40°C 変化 → 縦 bar 上部の fill 位置 + 球部 color、 3 tick marks で目盛表示、 温度計定番。" }, (p: PhaseBuilder) => p.activate("card").badge("temp"))
  .build();

/**
 * 77. icon-tile = 3 KPI を emoji icon + label + value tile で表示。
 */
export const kpiIconTile = diagram("interactive-kpi-icon-tile", {
  topic: "3 KPI (Growth / Revenue / Goals) を emoji icon + label + value tile で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("kpis", [
    ["📈", "Growth", "+15%"],
    ["💰", "Revenue", "$50k"],
    ["🎯", "Goals", "8/10"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "KPI overview", subtitle: "3 tile" })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "KPIs" })
  .phase("p", { duration: 1200, title: "icon tile", body: "[[icon, label, value], ...] を colored icon square + value + label の tile で並列表示、 dashboard の visual stat 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("tiles"))
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
  topic: "issue priority を dropdown で high/med/low 切替 → badge の色 + icon + label 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.dropdown("prio", { options: ["high", "med", "low"], defaultValue: "high", label: "Priority" })
  .input.text("desc", { defaultValue: "Fix crash on startup", placeholder: "Issue description", maxLength: 60, label: "Description" })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "Fix crash on startup" })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Issue", subtitle: "priority: {prio}" })
  .readout.priorityBadge("pb", { source: "prio", textSource: "desc", label: "Priority" })
  .phase("p", { duration: 1200, title: "priority badge", body: "dropdown で high/med/low 切替 → badge の 色 (red/yellow/gray) + icon (▲/●/▼) + text がリアルタイム追随、 issue tracker 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("issue"))
  .build();

/**
 * 81. podium = tournament の 1st/2nd/3rd 表彰台。
 */
export const tournamentPodium = diagram("interactive-tournament-podium", {
  topic: "tournament の 1st/2nd/3rd を表彰台 (gold/silver/bronze) で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("winners", [
    ["Alice", "1200 pts"],
    ["Bob", "1050 pts"],
    ["Carol", "980 pts"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Tournament", subtitle: "top 3" })
  .readout.podium("pod", { source: "winners", viewW: 280, viewH: 180, label: "Podium" })
  .phase("p", { duration: 1200, title: "podium", body: "[[1st_name, 1st_score], [2nd, 2nd], [3rd, 3rd]] を金/銀/銅の 3 縦 bar 表彰台で表示、 中央=1st の順で配置。" }, (p: PhaseBuilder) => p.activate("card").badge("winners"))
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
  topic: "code review reviewer 7 人 を stacked avatars (max 5 + overflow +2) で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("reviewers", ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "PR reviewers", subtitle: "7 reviewers、 top 5 表示" })
  .readout.userStack("us", { source: "reviewers", max: 5, size: 36, label: "Reviewers" })
  .phase("p", { duration: 1200, title: "user stack", body: "名前 array から initials 抽出 (Alice → A、 Bob Smith → BS) を 6 色 palette で overlap circle、 5 人超過分は +2 表示。" }, (p: PhaseBuilder) => p.activate("card").badge("team"))
  .build();

/**
 * 84. commit-list = recent git commits を 5 rows 表示。
 */
export const gitCommitList = diagram("interactive-git-commits", {
  topic: "recent git commit history 5 rows (sha + msg + author) を表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("commits", [
    ["a1b2c3d", "feat: add sankey primitive", "Alice"],
    ["e5f6g7h", "fix: circular gauge angle bug", "Bob"],
    ["i9j0k1l", "docs: update SKILL.md", "Carol"],
    ["m3n4o5p", "refactor: extract widget dispatcher", "Dan"],
    ["q7r8s9t", "test: add builder chain coverage", "Eve"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Recent commits", subtitle: "5 rows" })
  .readout.commitList("cl", { source: "commits", max: 5, color: "#2563eb", label: "History" })
  .phase("p", { duration: 1200, title: "commit list", body: "[[sha, msg, author], ...] の 5 commit を short-sha (blue) + msg + author の 3 column layout で表示、 git log 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("git"))
  .build();

/**
 * 85. media-player = audio player、 slider で current time、 toggle で play/pause。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "audio mini player、 slider で current time + toggle で play/pause、 progress bar 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.slider("current", { min: 0, max: 240, defaultValue: 65, label: "Current sec" })
  .input.toggle("playing", { defaultValue: true, label: "Playing" })
  .state("current", { initial: 65 })
  .state("duration", { initial: 240 })
  .state("playing", { initial: "true" })
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Media player", subtitle: "{current}s / 240s" })
  .readout.mediaPlayer("mp", { source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 320, label: "Player" })
  .phase("p", { duration: 1200, title: "media player", body: "slider + toggle で current sec + playing state を制御、 icon (▶/❚❚) + MM:SS current + progress + thumb + MM:SS duration が同時追随。" }, (p: PhaseBuilder) => p.activate("card").badge("media"))
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
  topic: "search hit 5 rows を title + snippet + url で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("hits", [
    ["Rust playground", "Interactive code sandbox for Rust programming language", "play.rust-lang.org"],
    ["MDN Web Docs", "Documentation for web technologies", "developer.mozilla.org"],
    ["TypeScript Handbook", "Official TS learning guide", "typescriptlang.org/docs"],
    ["React docs", "React reference documentation", "react.dev"],
    ["Vite guide", "Frontend build tool guide", "vitejs.dev"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Search results", subtitle: "5 hits" })
  .readout.searchResult("sr", { source: "hits", max: 5, color: "#2563eb", label: "Results" })
  .phase("p", { duration: 1200, title: "search hits", body: "[[title, snippet, url], ...] の 5 hit を title (blue link style) + snippet + url の layout で表示、 検索結果 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("search"))
  .build();

/**
 * 88. roadmap = 2026 year quarterly plan Q1-Q4。
 */
export const yearRoadmap = diagram("interactive-year-roadmap", {
  topic: "2026 year quarterly roadmap を Q1-Q4 4 column で task list 表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("plan", [
    ["Q1", ["Design system", "MVP feature A"]],
    ["Q2", ["Beta launch", "Feature B", "Feedback loop"]],
    ["Q3", ["Scale infra", "Enterprise deals"]],
    ["Q4", ["Public GA", "Series A"]],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "2026 roadmap", subtitle: "Q1-Q4 planning" })
  .readout.roadmap("rm", { source: "plan", viewW: 400, viewH: 200, label: "Roadmap" })
  .phase("p", { duration: 1200, title: "quarterly roadmap", body: "[[quarter, [items]], ...] を 4 column (Q1 blue / Q2 green / Q3 yellow / Q4 purple) で quarterly task list 表示。" }, (p: PhaseBuilder) => p.activate("card").badge("plan"))
  .build();

/**
 * 89. weather-forecast = 5-day weather (Mon-Fri) with icon + high/low temp。
 */
export const weekWeather = diagram("interactive-week-weather", {
  topic: "5-day weather forecast (Mon-Fri) を icon + 高低 temp で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("forecast", [
    ["Mon", "☀", 24, 18],
    ["Tue", "☁", 22, 17],
    ["Wed", "☂", 19, 15],
    ["Thu", "⚡", 17, 13],
    ["Fri", "☀", 25, 19],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Weather", subtitle: "5-day forecast" })
  .readout.weatherForecast("wf", { source: "forecast", label: "Week" })
  .phase("p", { duration: 1200, title: "5-day forecast", body: "[[day, icon, high, low], ...] を 5 column (day + emoji icon + high° + low°) の weather widget layout で表示。" }, (p: PhaseBuilder) => p.activate("card").badge("weather"))
  .build();

/**
 * 90. video-card = tutorial video 3 本 (title + duration + views)。
 */
export const tutorialVideoCards = diagram("interactive-tutorial-videos", {
  topic: "tutorial video 3 本 (emoji thumbnail + title + duration + views) を list 表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("videos", [
    ["🎬", "Rust intro for beginners", "12:45", "24k"],
    ["🎥", "TypeScript deep dive", "45:20", "82k"],
    ["📺", "React hooks explained", "18:30", "156k"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Tutorials", subtitle: "3 videos" })
  .readout.videoCard("vc", { source: "videos", max: 5, color: "#ef4444", label: "Videos" })
  .phase("p", { duration: 1200, title: "video card", body: "[[emoji, title, duration, views], ...] を thumbnail (colored + emoji + duration badge) + title + views 表示、 YouTube 定番 layout。" }, (p: PhaseBuilder) => p.activate("card").badge("video"))
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
  topic: "4 city (Tokyo/London/NYC/Sydney) の multi-timezone clock、 city + time + UTC offset 表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("clocks", [
    ["Tokyo", 9, "22:30"],
    ["London", 0, "13:30"],
    ["NYC", -5, "08:30"],
    ["Sydney", 11, "00:30"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "World clock", subtitle: "4 timezones" })
  .readout.timezoneClock("tc", { source: "clocks", color: "#2563eb", label: "Cities" })
  .phase("p", { duration: 1200, title: "world clock", body: "[[city, offsetHours, HH:MM], ...] を 4 column grid で city name + 大 time + UTC±N offset、 global team 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("clock"))
  .build();

/**
 * 94. form-summary = signup form の 5 field 送信内容 summary。
 */
export const signupFormSummary = diagram("interactive-signup-form", {
  topic: "signup form の 5 field 送信内容を dl / dt / dd form summary で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("fields", [
    ["Name", "Alice Wonderland"],
    ["Email", "alice@example.com"],
    ["Age", "28"],
    ["Country", "Japan"],
    ["Newsletter", "Yes"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Signup summary", subtitle: "5 fields" })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "Submission" })
  .phase("p", { duration: 1200, title: "form summary", body: "[[fieldName, value], ...] を dl / dt (key) / dd (value) semantic markup で 2 column layout 表示、 form confirmation 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("form"))
  .build();

/**
 * 95. song-queue = playlist queue 5 song、 stepper で current index。
 */
export const playlistSongQueue = diagram("interactive-playlist-queue", {
  topic: "playlist queue 5 song、 stepper で current index → ▶ icon + highlight 追随",
})
  .lane("l", { x: 0, width: 480 })
  .input.stepper("cur", { min: 0, max: 4, defaultValue: 1, label: "Current index" })
  .state("cur", { initial: 1 })
  .arraySignal("queue", [
    ["Bohemian Rhapsody", "Queen", "5:55"],
    ["Hotel California", "Eagles", "6:30"],
    ["Stairway to Heaven", "Led Zeppelin", "8:02"],
    ["Sweet Child O' Mine", "Guns N' Roses", "5:56"],
    ["Imagine", "John Lennon", "3:03"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Now playing", subtitle: "index {cur} of 5" })
  .readout.songQueue("sq", { source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "Queue" })
  .phase("p", { duration: 1200, title: "song queue", body: "stepper で current index 変化 → 該当 row の icon が ▶ + title 色 + background highlight、 pending row は 番号表示、 playlist 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("music"))
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
  topic: "January 2026 calendar view、 6 event day + today (13 日) を marker で強調表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("days", generateCalendarDays())
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Calendar", subtitle: "January 2026" })
  .readout.calendarMonth("cm", { source: "days", monthName: "January 2026", color: "#2563eb", label: "Month view" })
  .phase("p", { duration: 1200, title: "calendar month", body: "31 day を 7 column grid で表示、 event 6 day は blue dot、 today (13) は blue border + color 強調、 schedule / calendar 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("calendar"))
  .build();

/**
 * 97. terminal = CLI session output、 5 command history。
 */
export const cliTerminalSession = diagram("interactive-cli-terminal", {
  topic: "CLI terminal session の 5 command history を prompt + cmd + output で表示",
})
  .lane("l", { x: 0, width: 480 })
  .arraySignal("cmds", [
    ["$", "ls -la", "total 42\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"],
    ["$", "cd projects", ""],
    ["$", "git status", "On branch main\nnothing to commit, working tree clean"],
    ["$", "pnpm test", "Test Files  114 passed\nTests  1649 passed"],
    ["$", "docker ps", "CONTAINER ID   IMAGE\n8f3a2b1c9d   nginx:latest"],
  ] as unknown as (string | number)[])
  .node("card", { lane: "l", stack: 0, kind: "card", title: "Terminal", subtitle: "5 commands" })
  .readout.terminal("tm", { source: "cmds", max: 10, color: "#22c55e", label: "Session" })
  .phase("p", { duration: 1200, title: "terminal", body: "[[prompt, cmd, output], ...] を title bar (3 dots) + mono cmdline (green $ + white cmd) + output preformatted の CLI window 表示、 dev tool 定番。" }, (p: PhaseBuilder) => p.activate("card").badge("CLI"))
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
