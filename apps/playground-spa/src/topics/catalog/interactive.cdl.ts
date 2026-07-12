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
