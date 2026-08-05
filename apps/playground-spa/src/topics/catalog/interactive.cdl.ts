import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Interactive ... input widget / reactive state + formula / scroll-driven trigger /
 * event handler の 4 primitive の使い方 tour + visual binding (signal → node.w/h/opacity で
 * 実際に図形が動く) + 拡張 widget (xypad / stepper / radio / color) + readout widget
 * (bar / gauge / stat / sparkline) の 9 例。 全て抽象例のみで特定分野固有の題材は含まず、
 * library は汎用 primitive を提供、 domain 応用は consumer app 側の責務。
 *
 * 帯 id が `col1` から始まる図 (`col1` / `col2` …) は、 横 1 列だと縦横比 6:1 を超えて画面上で
 * 帯状に潰れるため 2 段に折り返してある。 1 つの帯に別の役割の節が縦に並ぶので、 帯 id は
 * 内容ではなく位置を表す (意味を名前にすると内容について嘘をつく)。 各節の役割は `title` が持つ。
 *
 * `col0` から始まる図 (grid-matrix 等) は別用途で、 元から格子の列を表す。 折り返しとは無関係。
 *
 * 各図の直後に置く `subtitle__<export 名>` は catalog 一覧に出す説明文。 `topic` は図の題名
 * (60 字以内) で、 長い説明はこちらに書く。 `sourceYaml__<key>` と同じ suffix pair 規約で、
 * `moduleToItems` が拾って一覧の subtitle にする。
 */

/**
 * 1. slider → node value bind (input widget primitive + reactive state)。
 */
// 2 要素の関係を 1 つだけ見せる最小例なので、 構造化データの抽出対象から外す (#970)。
// 3 つ目の節を足すと「1 つの仕組みを最小の形で見せる」 という目的が崩れる。
export const inputSliderBar = diagram("interactive-slider-bar", {
  structuredData: "exclude",
  topic: "スライダーの値が右の箱の説明欄に届く",
})
  .lane("slider", { x: 0, width: 260 })
  .lane("output", { x: 300, width: 260 })
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "Value" })
  .state("value", { initial: 50 })
  .node("sliderNode", { lane: "slider", stack: 0, kind: "card", title: "Slider", subtitle: "value = {value}" })
  .node("bar-node", { lane: "output", stack: 0, kind: "card", title: "Bar", subtitle: "value: {value}" })
  .edge("sliderNode", "bar-node", { label: "signal bind", tone: "info" })
  .phase("p1", {
    duration: 1600,
    title: "つまみを持つ",
    body: "左の縦列だけを見る。 つまみが `value` という値を握っていて、動かすとこの値が変わる。 まだ右の棒には届いていない。",
  }, (p: PhaseBuilder) => p.activate("sliderNode"))
  .phase("p2", {
    duration: 1600,
    title: "値が渡る",
    body: "つまみと右の箱を結ぶ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。",
  }, (p: PhaseBuilder) => p.activate("sliderNode", "bar-node"))
  .phase("p3", {
    duration: 1600,
    title: "説明欄に出る",
    body: "渡った値が右の箱の説明欄に出る。 図形の大きさは変わらず、文字として反映される経路。",
  }, (p: PhaseBuilder) => p.activate("bar-node"))
.build();
export const subtitle__inputSliderBar = "input.slider bind の 2-lane (Slider signal / Bar node) + bind edge、 signal → subtitle 反映経路を可視化";

/**
 * 2. formula → text bind (formula primitive + reactive computed)。
 */
export const formulaTextBind = diagram("interactive-formula-text", {
  topic: "入力値から 2 倍と半分を自動計算する",
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
  .phase("p1", {
    duration: 1600,
    title: "元の値を置く",
    body: "左の箱に入力値を置く。 まだ計算式は動いていない。",
  }, (p: PhaseBuilder) => p.activate("in"))
  .phase("p2", {
    duration: 1600,
    title: "2 倍を出す",
    body: "1 つ目の計算式が元の値を 2 倍にして、右上の箱に書き出す。 元の値を変えると追いかける。",
  }, (p: PhaseBuilder) => p.activate("in", "out1"))
  .phase("p3", {
    duration: 1600,
    title: "半分も出す",
    body: "2 つ目の計算式が同じ元の値を半分にする。 元が 1 つ、そこから出る値が 2 つ。",
  }, (p: PhaseBuilder) => p.activate("in", "out1", "out2"))
.build();
export const subtitle__formulaTextBind = "formula chain を 3-lane (Input / Doubled / Halved) 分散 + 2 dependency edge で dataflow network 化、 formula reactive を可視化";

/**
 * 3. scroll → progress readout (scroll-driven trigger)。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "スクロール進行に 3 つの段が同時に追随する",
})
  .lane("s1", { x: 0, width: 220 })
  .lane("s2", { x: 260, width: 220 })
  .lane("s3", { x: 520, width: 220 })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "Intro reveal" })
  .state("intro", { initial: 0 })
  .node("a", { lane: "s1", stack: 0, kind: "card", title: "Step 1", subtitle: "progress: {intro}" })
  .node("b", { lane: "s2", stack: 0, kind: "card", title: "Step 2", subtitle: "progress: {intro}" })
  .node("c", { lane: "s3", stack: 0, kind: "card", title: "Step 3", subtitle: "progress: {intro}" })
  .phase("p1", {
    duration: 1600,
    title: "1 箱で見る",
    body: "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。",
  }, (p: PhaseBuilder) => p.activate("a"))
  .phase("p2", {
    duration: 1600,
    title: "2 箱で見る",
    body: "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。",
  }, (p: PhaseBuilder) => p.activate("a", "b"))
  .phase("p3", {
    duration: 1600,
    title: "3 箱が同時に追う",
    body: "3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。",
  }, (p: PhaseBuilder) => p.activate("a", "b", "c"))
.build();
export const subtitle__scrollNarrative = "scroll 0..1 progress を 3-lane (Step 1 / Step 2 / Step 3) step 別分散、 各 step 個別 lane、 scroll 進行が全 lane 同時追随";

/**
 * 4. click → toggle (event handler + hover)。
 */
export const clickToggle = diagram("interactive-click-toggle", {
  topic: "クリックが handler を通って状態に届く",
})
  .lane("col1", { x: 0, width: 360 })
  .lane("col2", { x: 400, width: 370 })
  .input.toggle("active", { defaultValue: false, label: "Active" })
  .state("active", { initial: "off" })
  .node("btn", { lane: "col1", stack: 0, kind: "card", w: 180, title: "Button", subtitle: "click target" })
  .node("handlerNode", { lane: "col2", stack: 0, kind: "card", w: 320, title: "Handler", subtitle: "toggle-active + hover-state (consumer 実装)" })
  .node("signalNode", { lane: "col1", stack: 1, kind: "card", w: 310, title: "Signal state", subtitle: "active = {active}" })
  .edge("btn", "handlerNode", { label: "click / hover", tone: "info" })
  .edge("handlerNode", "signalNode", { label: "toggle", tone: "success" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p1", {
    duration: 1600,
    title: "押す前",
    body: "ボタンだけがある状態。 まだ何も起きていない。",
  }, (p: PhaseBuilder) => p.activate("btn"))
  .phase("p2", {
    duration: 1600,
    title: "受け取り手に結ぶ",
    body: "押した時に呼ぶ受け取り手を結び付ける宣言。 結び付けを書くところまでがこの図の範囲。",
  }, (p: PhaseBuilder) => p.activate("btn", "handlerNode"))
  .phase("p3", {
    duration: 1600,
    title: "書き換えを宣言する",
    body: "受け取り手が値を書き換える宣言。 実際に動かすには使う側が受け取り手を渡す必要があり、この見本では宣言の形だけを示す。",
  }, (p: PhaseBuilder) => p.activate("btn", "handlerNode", "signalNode"))
.build();
export const subtitle__clickToggle = "click event flow を 3 区画 (Trigger button / Event handler / Signal state) 2 列 2 段 + 2 edge、 click→handler→signal の 3 step dataflow";

/**
 * 5. visual binding = slider → node 実 width 変化 (arc-intro 相当の core UX)。
 * slider を drag すると bar node の SVG width が実際に伸縮、 subtitle だけでなく図形が動く。
 */
export const visualBindBar = diagram("interactive-visual-bar", {
  topic: "信号の値が棒の実際の幅に反映される",
})
  .lane("signal", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 340 })
  .lane("readout", { x: 600, width: 220 })
  .input.slider("barW", { min: 40, max: 320, defaultValue: 160, label: "Bar width" })
  .state("barW", { initial: 160 })
  .node("signalNode", { lane: "signal", stack: 0, kind: "card", title: "Signal", subtitle: "barW = {barW}" })
  .node("bar", {
    lane: "bar",
    stack: 0,
    kind: "card",
    title: "Bar",
    subtitle: "wBind = {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .node("readoutNode", { lane: "readout", stack: 0, kind: "card", title: "Bar readout", subtitle: "readout.bar が signal を同時追随" })
  .edge("signalNode", "bar", { label: "wBind", tone: "info" })
  .edge("signalNode", "readoutNode", { label: "readout", tone: "success" })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "Width readout" })
  .phase("p1", {
    duration: 1800,
    title: "信号を見る",
    body: "左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。",
  }, (p: PhaseBuilder) => p.activate("signalNode"))
  .phase("p2", {
    duration: 1800,
    title: "棒に届く",
    body: "信号が棒の幅として束ねられている。 つまみを動かすとこの棒が追いかける。",
  }, (p: PhaseBuilder) => p.activate("signalNode", "bar"))
  .phase("p3", {
    duration: 1800,
    title: "数でも読む",
    body: "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。",
  }, (p: PhaseBuilder) => p.activate("signalNode", "bar", "readoutNode"))
.build();
export const subtitle__visualBindBar = "wBind visual binding を 3-lane (Signal source / Dynamic bar / Bar readout) + 2 edge、 signal → 実 SVG width の反映経路を可視化";

/**
 * 6. visual binding = slider → node opacity で fade in/out。
 */
export const visualBindOpacity = diagram("interactive-visual-opacity", {
  topic: "信号に追随する濃さと固定の濃さを並べる",
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
  .phase("p1", {
    duration: 1800,
    title: "動かす側を見る",
    body: "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。",
  }, (p: PhaseBuilder) => p.activate("controlNode", "ref"))
  .phase("p2", {
    duration: 1800,
    title: "追随する側",
    body: "追随する側は信号に束ねられている。 つまみを動かすとここだけが変わる。",
  }, (p: PhaseBuilder) => p.activate("controlNode", "target", "ref"))
  .phase("p3", {
    duration: 1800,
    title: "固定の側と比べる",
    body: "固定側は束ねられていないので動かない。 2 つを並べると束ねの有無が見える。",
  }, (p: PhaseBuilder) => p.activate("target", "ref"))
.build();
export const subtitle__visualBindOpacity = "opacity visual bind を 3-lane (Fade control / Target opacity / Reference constant) + 2 edge、 signal 追随 vs 固定の対比可視化";

/**
 * 7. XY pad = 2 軸選択、 stat readout で x/y を表示。
 */
export const xypadNavigate = diagram("interactive-xypad-nav", {
  topic: "XY パッドの座標が 4 象限のどこかを示す",
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
  .node("q2Node", { lane: "q2", stack: 0, kind: "card", title: "Q2", subtitle: "upper-left" })
  .node("q1Node", { lane: "q1", stack: 0, kind: "card", title: "Q1", subtitle: "upper-right" })
  .node("q3Node", { lane: "q3", stack: 0, kind: "card", title: "Q3", subtitle: "lower-left" })
  .node("q4Node", { lane: "q4", stack: 0, kind: "card", title: "Q4", subtitle: "lower-right" })
  .node("indicator", { lane: "q1", stack: 1, kind: "card", title: "◆ Position", subtitle: "{pos} (default center → Q1 boundary)" })
  .readout.stat("posStat", { source: "pos", label: "Selected", caption: "x,y in 0..100" })
  .phase("p1", {
    duration: 1800,
    title: "左下の区画",
    body: "4 つに区切った左下。 座標はつまみで決まり、入った区画の箱が光る。",
  }, (p: PhaseBuilder) => p.activate("q3Node", "indicator"))
  .phase("p2", {
    duration: 1800,
    title: "右上の区画",
    body: "右上の区画。 つまみを動かして境界をまたぐと、光る箱が入れ替わる。",
  }, (p: PhaseBuilder) => p.activate("q1Node", "indicator"))
  .phase("p3", {
    duration: 1800,
    title: "4 区画を見る",
    body: "4 つの区画が同じ大きさで並ぶ。 座標 1 組がどれか 1 つを指す。",
  }, (p: PhaseBuilder) => p.activate("q1Node", "q2Node", "q3Node", "q4Node", "indicator"))
.build();
export const subtitle__xypadNavigate = "XY pad 2D 座標を 4-lane quadrant (Q1/Q2/Q3/Q4) 分散、 現在 pos を center indicator + stat readout で数値化";

/**
 * 8. stepper で phase 相当の値を細かく調整、 bar readout に反映。
 */
export const stepperControl = diagram("interactive-stepper", {
  topic: "増減ボタンで棒と数値が動く",
})
  .lane("ctrl", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 220 })
  .lane("stat", { x: 480, width: 200 })
  .input.stepper("count", { min: 0, max: 10, defaultValue: 3, label: "Count" })
  .state("count", { initial: 3 })
  .node("ctrlNode", { lane: "ctrl", stack: 0, kind: "card", title: "Stepper", subtitle: "count = {count} (0-10 range)" })
  .node("barNode", { lane: "bar", stack: 0, kind: "card", title: "Bar visual", subtitle: "count 追随 progress bar (readout.bar)" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", title: "Stat readout", subtitle: "count 追随 number + unit (readout.stat)" })
  .edge("ctrlNode", "barNode", { label: "→ bar", tone: "info" })
  .edge("ctrlNode", "statNode", { label: "→ stat", tone: "success" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "Progress bar" })
  .readout.stat("countStat", { source: "count", label: "Total", unit: " items" })
  .phase("p1", {
    duration: 1800,
    title: "3 個",
    body: "初期の 3 個。 棒の長さと数字が同じ値を見ている。",
  }, (p: PhaseBuilder) => p.activate("ctrlNode"))
  .phase("p2", {
    duration: 1800,
    title: "増やす",
    body: "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。",
  }, (p: PhaseBuilder) => p.activate("ctrlNode", "barNode"))
  .phase("p3", {
    duration: 1800,
    title: "読み取る",
    body: "右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。",
  }, (p: PhaseBuilder) => p.activate("ctrlNode", "barNode", "statNode"))
.build();
export const subtitle__stepperControl = "stepper control を 3-lane (Control input / Bar visualization / Stat readout) 分散 + 2 fan-out edge、 signal → 2 readout の 1:N 経路可視化";

/**
 * 9. number → sparkline = number 入力の履歴を line chart で。
 */
// 2 要素の最小例なので抽出対象外 (#970、 `interactive-slider-bar` と同じ理由)。
export const numberSparkline = diagram("interactive-number-spark", {
  structuredData: "exclude",
  topic: "現在値と履歴のミニ折れ線を並べる",
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
  .phase("p1", {
    duration: 1800,
    title: "現在値を見る",
    body: "つまみが持つ今の値。 数字と折れ線の右端が同じ値を指す。",
  }, (p: PhaseBuilder) => p.activate("currentNode"))
  .phase("p2", {
    duration: 1800,
    title: "履歴と並べる",
    body: "折れ線は過去の値を並べたもの。 現在値だけが右端で動く。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "historyNode"))
  .phase("p3", {
    duration: 1800,
    title: "形で読む",
    body: "上下の動きは折れ線の形に残る。 数字 1 つでは分からない推移が読める。",
  }, (p: PhaseBuilder) => p.activate("historyNode"))
.build();
export const subtitle__numberSparkline = "number sparkline を 2-lane (Current value / History sparkline) 分散 + push edge、 現在値と履歴の関係を可視化";

/**
 * 9b. radio + stat = 選択肢と現在値。 radio で option 切替、 stat で文字列表示。
 */
export const radioSelect = diagram("interactive-radio-select", {
  topic: "3 択のラジオで選んだ 1 つだけが光る",
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
  .phase("p1", {
    duration: 1800,
    title: "低の札",
    body: "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。",
  }, (p: PhaseBuilder) => p.activate("lowNode"))
  .phase("p2", {
    duration: 1800,
    title: "中の札",
    body: "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。",
  }, (p: PhaseBuilder) => p.activate("midNode"))
  .phase("p3", {
    duration: 1800,
    title: "高の札",
    body: "3 つ目の札。 選んだ値は右の箱にも文字で出る。",
  }, (p: PhaseBuilder) => p.activate("highNode", "currentMode"))
.build();
export const subtitle__radioSelect = "radio 3 option (low/mid/high) を 3-lane 排他分散 + current indicator、 現在選択 mode 位置を明示";

/**
 * 10. color picker で node stroke を変える (theme 実験)。
 */
export const colorPickerTheme = diagram("interactive-color-theme", {
  topic: "選んだ色が見本と 16 進表記に伝わる",
})
  .lane("picker", { x: 0, width: 370 })
  .lane("swatch", { x: 410, width: 230 })
  .lane("stat", { x: 680, width: 320 })
  .input.color("accent", { defaultValue: "#8a5a2a", label: "Accent" })
  .state("accent", { initial: "#8a5a2a" })
  .node("pickerNode", { lane: "picker", stack: 0, kind: "card", w: 320, title: "Color picker", subtitle: "input.color widget · default #8a5a2a" })
  .node("swatch", { lane: "swatch", stack: 0, kind: "card", w: 180, title: "Swatch", subtitle: "hex: {accent}" })
  .node("statNode", { lane: "stat", stack: 0, kind: "card", w: 270, title: "Hex stat", subtitle: "readout.stat で hex 表示" })
  .edge("pickerNode", "swatch", { label: "select", tone: "info" })
  .edge("swatch", "statNode", { label: "display", tone: "success" })
  .readout.stat("hexReadout", { source: "accent", label: "Selected", caption: "hex color" })
  .phase("p1", {
    duration: 1800,
    title: "色を選ぶ",
    body: "選んだ色が左の箱に入る。 まだ見本には伝わっていない。",
  }, (p: PhaseBuilder) => p.activate("pickerNode"))
  .phase("p2", {
    duration: 1800,
    title: "見本に伝わる",
    body: "選んだ色の 16 進表記が中央に出る。 箱の塗り自体には束ねていないので、色は変わらない。",
  }, (p: PhaseBuilder) => p.activate("pickerNode", "swatch"))
  .phase("p3", {
    duration: 1800,
    title: "表記も揃う",
    body: "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。",
  }, (p: PhaseBuilder) => p.activate("pickerNode", "swatch", "statNode"))
.build();
export const subtitle__colorPickerTheme = "color picker pipeline を 3-lane (Picker input / Swatch preview / Hex stat) + 2 edge、 hex signal 生成 dataflow を可視化";

/**
 * 11. shape primitive = rect fill、 signal で内部が実際に伸縮する汎用 container。
 */
export const shapeRectFill = diagram("interactive-shape-rect", {
  topic: "四角の塗り割合を 4 段階で見せる",
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
    shape: { kind: "rect", source: "{low25}", fillMax: 100, orient: "up", fill: "#a08870" },
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
    shape: { kind: "rect", source: "{v}", fillMax: 100, orient: "up", fill: "#8a5a2a" },
  })
  .phase("p1", {
    duration: 1600,
    title: "25% を見る",
    body: "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。",
  }, (p: PhaseBuilder) => p.activate("barLow"))
  .phase("p2", {
    duration: 1600,
    title: "50% と並べる",
    body: "半分の状態を隣に置く。 25% との差が高さで分かる。",
  }, (p: PhaseBuilder) => p.activate("barLow", "barMid"))
  .phase("p3", {
    duration: 1600,
    title: "75% まで並べる",
    body: "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。",
  }, (p: PhaseBuilder) => p.activate("barLow", "barMid", "barHigh"))
  .phase("p4", {
    duration: 1600,
    title: "つまみで動かす",
    body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
  }, (p: PhaseBuilder) => p.activate("barLow", "barMid", "barHigh", "bar"))
.build();
export const subtitle__shapeRectFill = "dyn-rect fill を 4-lane (Low 25% / Mid 50% / High 75% / Interactive slider) 分散、 3 static + 1 reactive rect 並列比較";

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
    shape: { kind: "rect", source: "{gas1}", fillMax: 150, orient: "up", fill: "#8a5a2a" } })
  .node("r2", { lane: "l2", stack: 0, kind: "dyn-rect", title: "Block 2", subtitle: "gas: {gas2}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" } })
  .node("r3", { lane: "l3", stack: 0, kind: "dyn-rect", title: "Block 3", subtitle: "gas: {gas3}", w: 100, h: 220,
    shape: { kind: "rect", source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" } })
  .phase("p1", {
    duration: 1600,
    title: "等倍で見る",
    body: "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。",
  }, (p: PhaseBuilder) => p.activate("r1"))
  .phase("p2", {
    duration: 1600,
    title: "1.2 倍で見る",
    body: "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2"))
  .phase("p3", {
    duration: 1600,
    title: "1.5 倍で見る",
    body: "3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3"))
.build();

/**
 * 13. dyn-circle = radius / progress を signal で駆動、 progress ring の汎用版。
 */
export const shapeCirclePulse = diagram("interactive-shape-circle", {
  topic: "円の進捗リングを 4 段階で見せる",
})
  .lane("empty", { x: 0, width: 170 })
  .lane("third", { x: 195, width: 170 })
  .lane("twothird", { x: 390, width: 170 })
  .lane("interactive", { x: 585, width: 180 })
  .input.slider("p", { min: 0, max: 100, defaultValue: 60, label: "Progress" })
  .formula("prog", "p / 100")
  .state("p", { initial: 60 })
  .state("prog", { initial: 0.6 })
  .state("prog0", { initial: 0.0 })
  .state("prog33", { initial: 0.33 })
  .state("prog66", { initial: 0.66 })
  .node("cEmpty", { lane: "empty", stack: 0, kind: "dyn-circle", title: "0%", subtitle: "empty", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog0}", fill: "#a08870" } })
  .node("cThird", { lane: "third", stack: 0, kind: "dyn-circle", title: "33%", subtitle: "one-third", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog33}", fill: "#2563eb" } })
  .node("cTwoThird", { lane: "twothird", stack: 0, kind: "dyn-circle", title: "66%", subtitle: "two-third", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog66}", fill: "#f97316" } })
  .node("c", { lane: "interactive", stack: 0, kind: "dyn-circle", title: "Ring", subtitle: "{p}%", w: 160, h: 160,
    shape: { kind: "circle", fillProgress: "{prog}", fill: "#8a5a2a" } })
  .phase("p1", {
    duration: 1600,
    title: "0% を見る",
    body: "輪がまだ描かれていない状態。 ここが目盛りの始まりで、右へ行くほど輪が伸びる。",
  }, (p: PhaseBuilder) => p.activate("cEmpty"))
  .phase("p2", {
    duration: 1600,
    title: "33% と並べる",
    body: "3 分の 1 まで描いた輪を隣に置く。 0% との差が、輪の長さの違いとして読み取れる。",
  }, (p: PhaseBuilder) => p.activate("cEmpty", "cThird"))
  .phase("p3", {
    duration: 1600,
    title: "66% まで並べる",
    body: "3 分の 2 まで並べる。 角度の差が輪の長さで分かる。",
  }, (p: PhaseBuilder) => p.activate("cEmpty", "cThird", "cTwoThird"))
  .phase("p4", {
    duration: 1600,
    title: "つまみで動かす",
    body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
  }, (p: PhaseBuilder) => p.activate("cEmpty", "cThird", "cTwoThird", "c"))
.build();
export const subtitle__shapeCirclePulse = "dyn-circle progress ring を 4-lane (0% / 33% / 66% / Interactive) 分散、 3 static + 1 reactive circle 並列比較";

/**
 * 14. dyn-arc = 角度で fill sweep、 gauge や circular progress の汎用形。
 */
export const shapeArcSweep = diagram("interactive-shape-arc", {
  topic: "弧のゲージ角度を 4 段階で見せる",
})
  .lane("min", { x: 0, width: 180 })
  .lane("quarter", { x: 205, width: 180 })
  .lane("half", { x: 410, width: 180 })
  .lane("interactive", { x: 615, width: 200 })
  .input.slider("a", { min: 0, max: 270, defaultValue: 180, label: "Angle" })
  .state("a", { initial: 180 })
  .state("a0", { initial: 0 })
  .state("a90", { initial: 90 })
  .state("a180", { initial: 180 })
  .node("gMin", { lane: "min", stack: 0, kind: "dyn-arc", title: "0°", subtitle: "min", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#a08870" } })
  .node("gQuarter", { lane: "quarter", stack: 0, kind: "dyn-arc", title: "90°", subtitle: "quarter", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" } })
  .node("gHalf", { lane: "half", stack: 0, kind: "dyn-arc", title: "180°", subtitle: "half", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" } })
  .node("g", { lane: "interactive", stack: 0, kind: "dyn-arc", title: "Slider", subtitle: "{a}°", w: 180, h: 180,
    shape: { kind: "arc", angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#8a5a2a" } })
  .phase("p1", {
    duration: 1600,
    title: "0 度を見る",
    body: "針が振れていない状態。 ここが目盛りの始まりで、右へ行くほど弧が長くなる。",
  }, (p: PhaseBuilder) => p.activate("gMin"))
  .phase("p2", {
    duration: 1600,
    title: "90 度と並べる",
    body: "4 分の 1 まで振れた状態を隣に置く。",
  }, (p: PhaseBuilder) => p.activate("gMin", "gQuarter"))
  .phase("p3", {
    duration: 1600,
    title: "180 度まで並べる",
    body: "半周まで並べる。 角度の差が弧の長さで分かる。",
  }, (p: PhaseBuilder) => p.activate("gMin", "gQuarter", "gHalf"))
  .phase("p4", {
    duration: 1600,
    title: "つまみで動かす",
    body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
  }, (p: PhaseBuilder) => p.activate("gMin", "gQuarter", "gHalf", "g"))
.build();
export const subtitle__shapeArcSweep = "dyn-arc gauge sweep を 4-lane (Min 0° / Quarter 90° / Half 180° / Interactive) 分散、 3 static + 1 reactive arc 並列比較";

/**
 * 15. dyn-wave = 水位表示、 tank / battery / liquid level の汎用形。
 */
export const shapeWaveTank = diagram("interactive-shape-wave", {
  topic: "波の水位を 4 段階で見せる",
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
  .node("wLow", { lane: "low", stack: 0, kind: "dyn-wave", title: "Low", subtitle: "25%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl25}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#a08870" } })
  .node("wHalf", { lane: "half", stack: 0, kind: "dyn-wave", title: "Half", subtitle: "50%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl50}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#2563eb" } })
  .node("wHigh", { lane: "high", stack: 0, kind: "dyn-wave", title: "High", subtitle: "75%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl75}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#f97316" } })
  .node("w", { lane: "interactive", stack: 0, kind: "dyn-wave", title: "Wave", subtitle: "{lvl}%", w: 140, h: 220,
    shape: { kind: "wave", level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" } })
  .phase("p1", {
    duration: 1600,
    title: "25% を見る",
    body: "水位が低い状態。 波の線が下の方にあり、上に空きが多く残っている。",
  }, (p: PhaseBuilder) => p.activate("wLow"))
  .phase("p2", {
    duration: 1600,
    title: "50% と並べる",
    body: "半分まで入った状態を隣に置く。 25% との差が、線の高さの違いとして読み取れる。",
  }, (p: PhaseBuilder) => p.activate("wLow", "wHalf"))
  .phase("p3", {
    duration: 1600,
    title: "75% まで並べる",
    body: "4 分の 3 まで並べる。 水位の差が線の高さで分かる。",
  }, (p: PhaseBuilder) => p.activate("wLow", "wHalf", "wHigh"))
  .phase("p4", {
    duration: 1600,
    title: "つまみで動かす",
    body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
  }, (p: PhaseBuilder) => p.activate("wLow", "wHalf", "wHigh", "w"))
.build();
export const subtitle__shapeWaveTank = "dyn-wave tank level を 4-lane (Low 25 / Half 50 / High 75 / Interactive slider) 分散、 3 static + 1 reactive tank 並列比較";

/**
 * 16. dyn-polygon = 頂点数 + 回転を signal で駆動、 badge / medal / spinner の汎用形。
 */
export const shapePolyRotate = diagram("interactive-shape-polygon", {
  topic: "多角形の角数を 3 / 6 / 8 で見せる",
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
  .node("polyTri", { lane: "triangle", stack: 0, kind: "dyn-polygon", title: "Tri", subtitle: "sides=3", w: 180, h: 180,
    shape: { kind: "polygon", sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#a08870" } })
  .node("polyHex", { lane: "hexagon", stack: 0, kind: "dyn-polygon", title: "Hex", subtitle: "sides=6", w: 180, h: 180,
    shape: { kind: "polygon", sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" } })
  .node("polyOct", { lane: "octagon", stack: 0, kind: "dyn-polygon", title: "Oct", subtitle: "sides=8", w: 180, h: 180,
    shape: { kind: "polygon", sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" } })
  .node("p", { lane: "interactive", stack: 0, kind: "dyn-polygon", title: "Hexagon", subtitle: "{rot}° · r={radius}", w: 200, h: 200,
    shape: { kind: "polygon", sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#8a5a2a" } })
  .phase("p1", {
    duration: 1600,
    title: "3 角を見る",
    body: "角が 3 つの状態。 これが最も少ない形で、角を増やすほど丸に近づいていく。",
  }, (p: PhaseBuilder) => p.activate("polyTri"))
  .phase("p2", {
    duration: 1600,
    title: "6 角と並べる",
    body: "角を 6 つにした形を隣に置く。 丸みが増す。",
  }, (p: PhaseBuilder) => p.activate("polyTri", "polyHex"))
  .phase("p3", {
    duration: 1600,
    title: "8 角まで並べる",
    body: "角を 8 つまで増やす。 角の数と丸みの関係が分かる。",
  }, (p: PhaseBuilder) => p.activate("polyTri", "polyHex", "polyOct"))
  .phase("p4", {
    duration: 1600,
    title: "つまみで動かす",
    body: "右端はつまみで回転角と大きさを変えられる。 角の数は固定で、3 つの見本と見比べる。",
  }, (p: PhaseBuilder) => p.activate("polyTri", "polyHex", "polyOct", "p"))
.build();
export const subtitle__shapePolyRotate = "dyn-polygon sides を 4-lane (Triangle 3 / Hexagon 6 / Octagon 8 / Interactive hexagon slider) 分散、 3 static + 1 reactive polygon 並列比較";

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
  .repeatNodes(5, (_i) => ({
    id: `r{i}`,
    lane: `l{i+1}`,
    stack: 0,
    kind: "dyn-rect" as const,
    title: `Block {i+1}`,
    subtitle: "gas: {gas{i+1}}",
    w: 80,
    h: 220,
    shape: { kind: "rect" as const, source: "{gas{i+1}}", fillMax: 130, orient: "up" as const, fill: "#8a5a2a" },
  }))
  .phase("p1", {
    duration: 1600,
    title: "起点を置く",
    body: "元の値が 1 つ目の四角に入る。 ここが連なりの起点。",
  }, (p: PhaseBuilder) => p.activate("r0"))
  .phase("p2", {
    duration: 1600,
    title: "2 つ目まで伝わる",
    body: "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。",
  }, (p: PhaseBuilder) => p.activate("r0", "r1"))
  .phase("p3", {
    duration: 1600,
    title: "4 つ目まで伝わる",
    body: "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。",
  }, (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3"))
  .phase("p4", {
    duration: 1600,
    title: "端まで届く",
    body: "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。",
  }, (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3", "r4"))
.build();

/**
 * 18. dynamic readouts = countup / delta / percent-ring / typewriter を組合わせて KPI dashboard。
 */
export const dynamicReadouts = diagram("interactive-dynamic-readouts", {
  topic: "数え上げ / 増減 / 円 / 打字の 4 表示を並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.slider("rev", { min: 0, max: 500, defaultValue: 250, label: "Revenue" })
  .input.dropdown("status", { options: ["active", "pending", "closed"], defaultValue: "active", label: "Status" })
  .state("rev", { initial: 250 })
  .state("status", { initial: "active" })
  .node("countNode", { lane: "col1", stack: 0, kind: "card", w: 320, title: "Countup", subtitle: "rev={rev} · animated $ counter" })
  .node("deltaNode", { lane: "col2", stack: 0, kind: "card", w: 240, title: "Delta", subtitle: "rev={rev} · ↑↓ arrow" })
  .node("ringNode", { lane: "col1", stack: 1, kind: "card", w: 310, title: "Percent ring", subtitle: "rev/500 = {rev} progress" })
  .node("textNode", { lane: "col2", stack: 1, kind: "card", w: 320, title: "Typewriter", subtitle: "status={status} · char reveal" })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "Revenue count" })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ delta" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "Progress ring" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "Status text" })
  .phase("p1", {
    duration: 1800,
    title: "数え上げを見る",
    body: "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。",
  }, (p: PhaseBuilder) => p.activate("countNode"))
  .phase("p2", {
    duration: 1800,
    title: "増減と円を見る",
    body: "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。",
  }, (p: PhaseBuilder) => p.activate("countNode", "deltaNode", "ringNode"))
  .phase("p3", {
    duration: 1800,
    title: "文字でも出す",
    body: "状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。",
  }, (p: PhaseBuilder) => p.activate("countNode", "deltaNode", "ringNode", "textNode"))
.build();
export const subtitle__dynamicReadouts = "4 dynamic readout (countup/delta/percent-ring/typewriter) を 2 列 2 段に分散、 各 readout 個別区画、 signal → 4 readout の 1:N 経路可視化";

/**
 * 19. timeline = 時間軸を signal 化、 play/pause/scrub/speed で phase 相当を手動制御。
 *     time signal 経由で dyn-* shape を動的に駆動。
 */
export const timelineDrive = diagram("interactive-timeline-drive", {
  topic: "1 つの時間信号が図形 2 種を同時に動かす",
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
  .node("timeNode", { lane: "time", stack: 0, kind: "card", title: "Timeline", subtitle: "t (0-1 loop 3s autoplay)" })
  .node("r", { lane: "bar", stack: 0, kind: "dyn-rect", title: "Bar (rect)", subtitle: "bar = t * 100", w: 80, h: 200,
    shape: { kind: "rect", source: "{bar}", fillMax: 100, orient: "up", fill: "#8a5a2a" } })
  .node("a", { lane: "arc", stack: 0, kind: "dyn-arc", title: "Arc", subtitle: "angle = t * 270", w: 140, h: 140,
    shape: { kind: "arc", angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" } })
  .edge("timeNode", "r", { label: "→ bar", tone: "info" })
  // timeNode→a は bar lane を跨ぐ長い edge。 label を bar lane 中央へ寄せて左右余白を確保し、
  // 非発着 lane bar の border 貫通 (lane-border-clearance) を font metric 変動にも耐える形で防ぐ。
  .edge("timeNode", "a", { label: "→ angle", tone: "accent", labelOffsetX: -45 })
  .readout.countup("timeCu", { source: "bar", unit: "%", label: "Time %" })
  .phase("p1", {
    duration: 1800,
    title: "時間の元を見る",
    body: "時間の入力が元になる。 この値から計算式で図形の値を導く。",
  }, (p: PhaseBuilder) => p.activate("timeNode"))
  .phase("p2", {
    duration: 1800,
    title: "四角に届く",
    body: "計算式の値が四角に束ねられている。 時間が進むと自動で変わる。",
  }, (p: PhaseBuilder) => p.activate("timeNode", "r"))
  .phase("p3", {
    duration: 1800,
    title: "弧にも届く",
    body: "弧には別の計算式 (時間の 270 倍) が束ねられている。 同じ時間から別々の値を導く。",
  }, (p: PhaseBuilder) => p.activate("timeNode", "r", "a"))
.build();
export const subtitle__timelineDrive = "timeline signal fan-out を 3-lane (Timeline control / Rect shape / Arc shape) + 2 fan-out edge、 time → 2 shape 同時追随";

/**
 * 20. edge signal binding = 太さ / 色 / dashoffset を signal 追随、 chain の流れを animate。
 */
export const edgeFlowBind = diagram("interactive-edge-flow", {
  topic: "信号で線の太さと流れる点が変わる",
})
  .lane("src", { x: 0, width: 230 })
  .lane("pipe", { x: 270, width: 350 })
  .lane("sink", { x: 660, width: 190 })
  .input.slider("flow", { min: 1, max: 15, defaultValue: 5, label: "Flow Width" })
  .input.timeline("t", { duration: 2000, autoplay: true, loop: true, label: "Timeline" })
  .formula("dash", "t * 24")
  .state("flow", { initial: 5 })
  .state("t", { initial: 0 })
  .state("dash", { initial: 0 })
  .node("a", { lane: "src", stack: 0, kind: "card", w: 180, title: "Source", subtitle: "producer" })
  .node("pipeNode", { lane: "pipe", stack: 0, kind: "card", w: 300, title: "Pipe", subtitle: "width={flow} · dash={dash}" })
  .node("b", { lane: "sink", stack: 0, kind: "card", w: 140, title: "Sink", subtitle: "consumer" })
  .edge("a", "pipeNode", { label: "produce", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .edge("pipeNode", "b", { label: "consume", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .phase("p1", {
    duration: 1600,
    title: "送り手を見る",
    body: "左の箱が信号を持つ。 まだ線には出ていない。",
  }, (p: PhaseBuilder) => p.activate("a"))
  .phase("p2", {
    duration: 1600,
    title: "線に出る",
    body: "信号の大きさが線の太さになる。 太いほど多く流れている。",
  }, (p: PhaseBuilder) => p.activate("a", "pipeNode"))
  .phase("p3", {
    duration: 1600,
    title: "受け手まで届く",
    body: "線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。",
  }, (p: PhaseBuilder) => p.activate("a", "pipeNode", "b"))
.build();
export const subtitle__edgeFlowBind = "edge signal bind (太さ/dashoffset) を 3-lane (Source / Pipe / Sink) 分散、 Source→Sink flow を横断 edge で animate";

/**
 * 21. new input widgets = range / multi-select / tabs / text の合わせ技。
 */
export const inputVariety = diagram("interactive-input-variety", {
  topic: "スライダー / 複数選択 / タブ / 文字の 4 入力を並べる",
})
  .lane("range", { x: 0, width: 360 })
  .lane("multi", { x: 380, width: 360 })
  .lane("tabs", { x: 760, width: 230 })
  .lane("text", { x: 1010, width: 320 })
  .input.range("priceRange", { min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "Price Range" })
  .input.multiSelect("tags", { options: ["new", "sale", "hot", "featured"], defaultValues: ["new"], label: "Tags" })
  .input.tabs("view", { options: ["grid", "list", "compact"], defaultValue: "grid", label: "View" })
  .input.text("query", { defaultValue: "", placeholder: "Search...", maxLength: 50, label: "Query" })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "new" })
  .state("view", { initial: "grid" })
  .state("query", { initial: "" })
  .node("rangeNode", { lane: "range", stack: 0, kind: "card", w: 310, title: "Range slider", subtitle: "price = {priceRange}" })
  .node("multiNode", { lane: "multi", stack: 0, kind: "card", w: 310, title: "Multi-select", subtitle: "tags = {tags}" })
  .node("tabsNode", { lane: "tabs", stack: 0, kind: "card", w: 180, title: "Tabs", subtitle: "view = {view}" })
  .node("textNode", { lane: "text", stack: 0, kind: "card", w: 270, title: "Text input", subtitle: "query = {query}" })
  .phase("p1", {
    duration: 1600,
    title: "数を選ぶ",
    body: "つまみで数の範囲を選ぶ。 4 種類の入力のうち 1 つ目。",
  }, (p: PhaseBuilder) => p.activate("rangeNode"))
  .phase("p2", {
    duration: 1600,
    title: "複数選ぶ",
    body: "札を複数選べる入力を加える。 選んだ数だけ値が増える。",
  }, (p: PhaseBuilder) => p.activate("rangeNode", "multiNode"))
  .phase("p3", {
    duration: 1600,
    title: "切り替える",
    body: "タブで表示を切り替える入力を加える。 1 つだけ選ぶ形。",
  }, (p: PhaseBuilder) => p.activate("rangeNode", "multiNode", "tabsNode"))
  .phase("p4", {
    duration: 1600,
    title: "文字を打つ",
    body: "文字を打つ入力まで並ぶ。 4 種類が同じ図の中で動く。",
  }, (p: PhaseBuilder) => p.activate("rangeNode", "multiNode", "tabsNode", "textNode"))
.build();
export const subtitle__inputVariety = "4 input widget (range/multiSelect/tabs/text) を 4-lane 分散、 各 widget 個別 lane + input signal 表示";

/**
 * 22. new readouts = heat cell + badge + status dot の合わせ技。
 */
export const readoutVariety = diagram("interactive-readout-variety", {
  topic: "熱セル / バッジ / 状態点の 3 表示を並べる",
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
    { value: "offline", color: "#a08870", label: "Offline" },
    { value: "error", color: "#ef4444", label: "Error" },
  ], label: "State dot" })
  .phase("p1", {
    duration: 1800,
    title: "熱の升目を見る",
    body: "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。",
  }, (p: PhaseBuilder) => p.activate("heatNode"))
  .phase("p2", {
    duration: 1800,
    title: "札でも出す",
    body: "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。",
  }, (p: PhaseBuilder) => p.activate("heatNode", "badgeNode"))
  .phase("p3", {
    duration: 1800,
    title: "状態の点を見る",
    body: "別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。",
  }, (p: PhaseBuilder) => p.activate("heatNode", "badgeNode", "dotNode"))
.build();
export const subtitle__readoutVariety = "3 readout variant (heatCell/badge/statusDot) を 3-lane 分散、 各 readout 個別 lane + temp/state signal 追随";

/**
 * 23. event 拡張 = double-click / keydown / focus / blur を network 化。
 *     signal update は consumer handler 側で実装、 catalog では primitive 存在確認のみ。
 */
export const eventVariety = diagram("interactive-event-variety", {
  topic: "5 種の操作イベントを受け取り分ける",
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
  .phase("p1", {
    duration: 1600,
    title: "2 回押す",
    body: "1 つ目は 2 回続けて押した時だけ反応する。 1 回では動かない。",
  }, (p: PhaseBuilder) => p.activate("btn1"))
  .phase("p2", {
    duration: 1600,
    title: "文字を打つ",
    body: "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。",
  }, (p: PhaseBuilder) => p.activate("btn1", "btn2"))
  .phase("p3", {
    duration: 1600,
    title: "長く押す",
    body: "3 つ目は押したまま一定時間たつと反応する。 2 回押す / 文字を打つ と並べると、受け取り方の幅が分かる。",
  }, (p: PhaseBuilder) => p.activate("btn1", "btn2", "btn3"))
.build();
export const subtitle__eventVariety = "5 event kind (dbl/focus/blur/keydown/longpress) を 3-lane (Pointer / Keyboard / Touch) event category 別分散、 3 target node + 5 event bind";

/**
 * 24. gridNodes = 2D grid layout。 rows × cols の matrix を宣言的に生成、
 *     signal で個別 cell の hover 状態を bind。
 */
export const gridLayoutMatrix = diagram("interactive-grid-matrix", {
  topic: "3 行 4 列の格子を列ごとに並べる",
})
  .lane("col0", { x: 0, width: 150 })
  .lane("col1", { x: 170, width: 150 })
  .lane("col2", { x: 340, width: 150 })
  .lane("col3", { x: 510, width: 150 })
  .input.stepper("r", { min: 0, max: 2, defaultValue: 0, label: "Row" })
  .input.stepper("c", { min: 0, max: 3, defaultValue: 0, label: "Col" })
  .state("r", { initial: 0 })
  .state("c", { initial: 0 })
  .gridNodes(3, 4, (r, _c) => ({
    id: `cell-{r}-{c}`,
    lane: `col{c}`,
    stack: r,
    kind: "card" as const,
    title: `r{r} c{c}`,
    subtitle: `col{c} lane · row{r} stack`,
  }))
  .readout.stat("hover", { source: "r", label: "Row" })
  .readout.stat("hoverC", { source: "c", label: "Col" })
  .phase("p1", {
    duration: 1800,
    title: "1 行目を見る",
    body: "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。",
  }, (p: PhaseBuilder) => p.activate("cell-0-0", "cell-0-1", "cell-0-2", "cell-0-3"))
  .phase("p2", {
    duration: 1800,
    title: "2 行目を見る",
    body: "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。",
  }, (p: PhaseBuilder) => p.activate("cell-1-0", "cell-1-1", "cell-1-2", "cell-1-3"))
  .phase("p3", {
    duration: 1800,
    title: "3 行目を見る",
    body: "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("cell-2-0", "cell-2-1", "cell-2-2", "cell-2-3"))
.build();
export const subtitle__gridLayoutMatrix = "gridNodes(3, 4) 12 cell を 4-lane (Col 0-3) 列別分散、 gridNodes template で lane 動的割当、 各 lane 3 cell (Row 0-2) stack";

/**
 * 25. arraySignal = array を単一 signal に格納、 template で index / length / sum / avg access。
 *     readout.arrayBar で histogram、 readout.arrayList で bullet list 表示。
 */
export const arraySignalHistogram = diagram("interactive-array-signal", {
  topic: "配列 5 要素の合計と個別値を並べる",
})
  .lane("agg", { x: 0, width: 240 })
  .lane("items", { x: 300, width: 260 })
  .arraySignal("xs", [12, 34, 20, 45, 28])
  .input.slider("bump", { min: 0, max: 50, defaultValue: 20, label: "First bar" })
  .node("summary", {
    lane: "agg",
    stack: 0,
    kind: "card",
    title: "Aggregate",
    subtitle: "count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}",
  })
  .node("bumpNode", { lane: "agg", stack: 1, kind: "card", title: "Bump control", subtitle: "1 本目だけを上書きするつまみ" })
  .node("i0", { lane: "items", stack: 0, kind: "card", title: "#0", subtitle: "xs[0] = {xs[0]}" })
  .node("i1", { lane: "items", stack: 1, kind: "card", title: "#1", subtitle: "xs[1] = {xs[1]}" })
  .node("i2", { lane: "items", stack: 2, kind: "card", title: "#2", subtitle: "xs[2] = {xs[2]}" })
  .node("i3", { lane: "items", stack: 3, kind: "card", title: "#3", subtitle: "xs[3] = {xs[3]}" })
  .node("i4", { lane: "items", stack: 4, kind: "card", title: "#4", subtitle: "xs[4] = {xs[4]}" })
  .readout.arrayBar("hist", { source: "xs", min: 0, max: 50, color: "#2563eb", label: "Bars (histogram)" })
  .readout.arrayList("items", { source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "Items (bullet list)" })
  .readout.stat("first", { source: "bump", label: "Bump" })
  .phase("p1", {
    duration: 1800,
    title: "初期の並び",
    body: "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。",
  }, (p: PhaseBuilder) => p.activate("summary", "i0").set("xs", '[12,34,20,45,28]'))
  .phase("p2", {
    duration: 1800,
    title: "山が右へ移る",
    body: "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。",
  }, (p: PhaseBuilder) => p.activate("summary", "i0", "i1", "i2").set("xs", '[40,18,30,26,48]'))
  .phase("p3", {
    duration: 1800,
    title: "右上がりに整う",
    body: "右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。",
  }, (p: PhaseBuilder) => p.activate("summary", "i0", "i1", "i2", "i3", "i4").set("xs", '[15,22,30,38,48]'))
.build();
export const subtitle__arraySignalHistogram = "arraySignal 5 element を 2-lane (Aggregate stat / Individual items) 分散、 各 element 個別 card + 集約 card、 arrayBar/arrayList readout 併存";

/**
 * 26. pathProgress readout + visibleIf。 slider で progress、 完了時 badge を visibleIf 経由で表示。
 */
export const pathProgressDemo = diagram("interactive-path-progress", {
  topic: "経路の進捗と完了状態を連動させる",
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
  .phase("p1", {
    duration: 1800,
    title: "元の値を見る",
    body: "進捗の値をつまみが持つ。 この 1 つの値から 2 つの表示を作る。",
  }, (p: PhaseBuilder) => p.activate("main"))
  .phase("p2", {
    duration: 1800,
    title: "経路と円に届く",
    body: "同じ進捗が経路の塗りと円の角度になる。 つまみを動かすと両方が動く。",
  }, (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode"))
  .phase("p3", {
    duration: 1800,
    title: "完了の印",
    body: "進捗が満ちた時だけ出る印。 条件付きの表示で、満たない間は隠れている。",
  }, (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode", "ok"))
.build();
export const subtitle__pathProgressDemo = "path progress を 3-lane (State / Path visual / Completion) 分散、 progress state + path readout + 完了 badge を lane 別展開";

/**
 * 27. lineChart readout = array signal を折れ線 chart 表示 (時系列 like)。
 */
export const arrayLineChart = diagram("interactive-array-line-chart", {
  topic: "配列の値から面グラフを描く",
})
  .lane("data", { x: 0, width: 200 })
  .lane("area", { x: 240, width: 280 })
  .lane("line", { x: 540, width: 280 })
  .arraySignal("series", [22, 35, 28, 42, 55, 48, 60, 72, 65, 80])
  .node("dataCard", { lane: "data", stack: 0, kind: "card", title: "Time series", subtitle: "n={series.length} · sum={series.sum} · avg={series.avg}" })
  .node("areaCard", { lane: "area", stack: 0, kind: "card", title: "Area chart", subtitle: "blue #2563eb · viewH=70" })
  .node("lineCard", { lane: "line", stack: 0, kind: "card", title: "Line chart", subtitle: "orange #f97316 · viewH=50" })
  .readout.lineChart("chart", { source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "Area chart" })
  .readout.lineChart("chartNoFill", { source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "Line chart" })
  .phase("p1", {
    duration: 1800,
    title: "序盤の値",
    body: "前半の値だけを持つ。 折れ線が左半分に収まる。",
  }, (p: PhaseBuilder) => p.activate("dataCard").set("series", '[22,35,28,42,55]'))
  .phase("p2", {
    duration: 1800,
    title: "伸びる",
    body: "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。",
  }, (p: PhaseBuilder) => p.activate("dataCard", "areaCard").set("series", '[22,35,28,42,55,48,60,72]'))
  .phase("p3", {
    duration: 1800,
    title: "全体が揃う",
    body: "10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。",
  }, (p: PhaseBuilder) => p.activate("dataCard", "areaCard", "lineCard").set("series", '[22,35,28,42,55,48,60,72,65,80]'))
.build();
export const subtitle__arrayLineChart = "arraySignal line chart を 3-lane (Data source / Area chart fill / Line chart no-fill) 分散、 chart variant 別 lane 展開、 lineChart 2 種類併存";

/**
 * 28. stackedBar readout = 2 array を並列 bar 比較、 A/B histogram の per-index 対比。
 */
export const arrayStackedBar = diagram("interactive-array-stacked-bar", {
  topic: "2 系列の配列を積み上げ棒で比べる",
})
  .lane("groupA", { x: 0, width: 300 })
  .lane("groupB", { x: 340, width: 300 })
  .arraySignal("groupA", [40, 55, 30, 65, 45])
  .arraySignal("groupB", [25, 40, 50, 35, 60])
  .node("aCard", {
    lane: "groupA",
    stack: 0,
    kind: "card",
    title: "Group A",
    subtitle: "sum={groupA.sum} · avg={groupA.avg} · max={groupA.max}",
  })
  .node("aDetail", { lane: "groupA", stack: 1, kind: "card", title: "A 5 element", subtitle: "系列 A" })
  .node("bCard", {
    lane: "groupB",
    stack: 0,
    kind: "card",
    title: "Group B",
    subtitle: "sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}",
  })
  .node("bDetail", { lane: "groupB", stack: 1, kind: "card", title: "B 5 element", subtitle: "系列 B" })
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
  .phase("p1", {
    duration: 1800,
    title: "A だけ",
    body: "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail").set("groupA", '[40,55,30,65,45]').set("groupB", '[0,0,0,0,0]'))
  .phase("p2", {
    duration: 1800,
    title: "B を並べる",
    body: "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard").set("groupB", '[25,40,50,35,60]'))
  .phase("p3", {
    duration: 1800,
    title: "高さが入れ替わる",
    body: "2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard", "bDetail").set("groupA", '[30,35,25,40,30]').set("groupB", '[45,60,70,55,80]'))
.build();
export const subtitle__arrayStackedBar = "2 arraySignal (A/B) を 2-lane (Group A blue / Group B orange) 分散 + comparison edge、 各 group 個別 card + stackedBar readout 併存";

/**
 * 29. radialNodes + renderOffset = hub-and-spoke architecture 図、
 *     中心 node に対して 6 spoke node を円周上に配置。 layout の stack で並べつつ
 *     renderOffsetX/Y で見た目上の円周配置に。
 */
export const radialHubAndSpoke = diagram("interactive-radial-hub", {
  topic: "中心から放射状に 4 本が伸びる",
})
  .lane("spokesTop", { x: -300, width: 200 })
  .lane("hub", { x: 0, width: 200 })
  .lane("spokesBottom", { x: 300, width: 200 })
  .node("hub", { lane: "hub", stack: 0, kind: "card", title: "Hub", subtitle: "center · 4 spoke に fan-out" })
  .node("spoke-0", { lane: "spokesTop", stack: 0, kind: "card", title: "#0", subtitle: "0°" })
  .node("spoke-1", { lane: "spokesTop", stack: 1, kind: "card", title: "#1", subtitle: "90°" })
  .node("spoke-2", { lane: "spokesBottom", stack: 0, kind: "card", title: "#2", subtitle: "180°" })
  .node("spoke-3", { lane: "spokesBottom", stack: 1, kind: "card", title: "#3", subtitle: "270°" })
  .edge("hub", "spoke-0", { label: "0°", tone: "info" })
  .edge("hub", "spoke-1", { label: "90°", tone: "info" })
  .edge("hub", "spoke-2", { label: "180°", tone: "info" })
  .edge("hub", "spoke-3", { label: "270°", tone: "info" })
  .phase("p1", {
    duration: 1600,
    title: "中心を置く",
    body: "真ん中の箱が起点。 ここから外へ伸びる。",
  }, (p: PhaseBuilder) => p.activate("hub"))
  .phase("p2", {
    duration: 1600,
    title: "2 本伸ばす",
    body: "中心から 2 本が外へ伸びる。 向きが 2 方向に分かれる。",
  }, (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1"))
  .phase("p3", {
    duration: 1600,
    title: "4 本に広げる",
    body: "4 本すべてが放射状に広がる。 中心 1 つに対して外が 4 つ。",
  }, (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1", "spoke-2", "spoke-3"))
.build();
export const subtitle__radialHubAndSpoke = "hub-and-spoke を 3-lane (Spokes 上 / Hub center / Spokes 下) 分散、 4 spoke を上下 lane に振り分けて edge-node-cross を回避、 hub → 4 spoke edge の star topology";

/**
 * 30. waterfall readout = 5 element を左から累積、 正 / 負 で色分け (財務 waterfall chart)。
 */
export const arrayWaterfall = diagram("interactive-array-waterfall", {
  topic: "増減を滝グラフで正負に分けて見せる",
})
  .lane("pos", { x: 0, width: 300 })
  .lane("neg", { x: 340, width: 300 })
  .arraySignal("changes", [100, -30, 50, -20, 40])
  .node("pos1", { lane: "pos", stack: 0, kind: "card", title: "+100", subtitle: "初期上昇" })
  .node("pos2", { lane: "pos", stack: 1, kind: "card", title: "+50", subtitle: "回復" })
  .node("pos3", { lane: "pos", stack: 2, kind: "card", title: "+40", subtitle: "最終利益" })
  .node("neg1", { lane: "neg", stack: 0, kind: "card", title: "-30", subtitle: "小損失" })
  .node("neg2", { lane: "neg", stack: 1, kind: "card", title: "-20", subtitle: "追加損失" })
  .node("summary", { lane: "pos", stack: 3, kind: "card", title: "Waterfall", subtitle: "final = sum = {changes.sum}" })
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
  .phase("p1", {
    duration: 1800,
    title: "増える分",
    body: "正の増減だけを置く。 滝が右上がりに積み上がる。",
  }, (p: PhaseBuilder) => p.activate("pos1", "pos2").set("changes", '[60,30,25]'))
  .phase("p2", {
    duration: 1800,
    title: "減る分が入る",
    body: "負の増減が混ざる。 積み上がった分から下がる段が現れ、途中の落ち込みが見える。",
  }, (p: PhaseBuilder) => p.activate("pos1", "pos2", "neg1").set("changes", '[100,-30,50,-20,40]'))
  .phase("p3", {
    duration: 1800,
    title: "収支が出る",
    body: "増減を通した合計が出る。 一覧と滝が同じ配列を見ている。",
  }, (p: PhaseBuilder) => p.activate("pos1", "pos2", "pos3", "neg1", "neg2", "summary").set("changes", '[60,-20,40,-15,30]'))
.build();
export const subtitle__arrayWaterfall = "arraySignal waterfall 5 element を 2-lane (Positive changes / Negative changes) 分散、 各 element 個別 card、 waterfall readout 併存";

/**
 * 31. renderOffset signal binding = slider で node が動く、 renderOffsetX/Y に signal template。
 */
// 2 要素の対比が主題の最小例なので抽出対象外 (#970)。 固定と追随の 2 つで完結する。
export const renderOffsetDrift = diagram("interactive-render-offset", {
  structuredData: "exclude",
  topic: "固定点に対して浮遊点がずれて動く",
})
  .lane("anchor", { x: 0, width: 240 })
  .lane("floater", { x: 300, width: 300 })
  .input.slider("dx", { min: -80, max: 80, defaultValue: 0, label: "Drift X" })
  .input.slider("dy", { min: -40, max: 40, defaultValue: 0, label: "Drift Y" })
  .state("dx", { initial: 0 })
  .state("dy", { initial: 0 })
  .node("anchor", { lane: "anchor", stack: 0, kind: "card", title: "Anchor", subtitle: "固定位置、 signal bind なし" })
  .node("floater", {
    lane: "floater",
    stack: 0,
    kind: "card",
    title: "Floater",
    subtitle: "dx={dx} · dy={dy}",
    renderOffsetX: "{dx}",
    renderOffsetY: "{dy}",
  })
  .phase("p1", {
    duration: 1600,
    title: "基準を置く",
    body: "動かない点を先に置く。 ここが位置の基準になる。",
  }, (p: PhaseBuilder) => p.activate("anchor"))
  .phase("p2", {
    duration: 1600,
    title: "ずれを見る",
    body: "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。",
  }, (p: PhaseBuilder) => p.activate("anchor", "floater"))
  .phase("p3", {
    duration: 1600,
    title: "つまみで動かす",
    body: "つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。",
  }, (p: PhaseBuilder) => p.activate("floater"))
.build();
export const subtitle__renderOffsetDrift = "renderOffset bind を 2-lane (Anchor fixed / Floater drift) 分散、 anchor は固定、 floater は renderOffset signal 追随";

/**
 * 32. matrix readout = 4×4 の 2D array を色 gradient で表示 (confusion matrix / heatmap 用)。
 */
export const matrixHeatmap = diagram("interactive-matrix-heatmap", {
  topic: "4×4 の混同行列を熱の色で見せる",
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
  .node("c0Diag", { lane: "c0", stack: 0, kind: "card", title: "Class 0 ✓", subtitle: "上段の正解" })
  .node("c0Wrong", { lane: "c0", stack: 1, kind: "card", title: "Class 0 ✕", subtitle: "上段の取り違え" })
  .node("c1Diag", { lane: "c1", stack: 0, kind: "card", title: "Class 1 ✓", subtitle: "中上段の正解" })
  .node("c1Wrong", { lane: "c1", stack: 1, kind: "card", title: "Class 1 ✕", subtitle: "中上段の取り違え" })
  .node("c2Diag", { lane: "c2", stack: 0, kind: "card", title: "Class 2 ✓", subtitle: "中下段の正解" })
  .node("c2Wrong", { lane: "c2", stack: 1, kind: "card", title: "Class 2 ✕", subtitle: "中下段の取り違え" })
  .node("c3Diag", { lane: "c3", stack: 0, kind: "card", title: "Class 3 ✓", subtitle: "下段の正解" })
  .node("c3Wrong", { lane: "c3", stack: 1, kind: "card", title: "Class 3 ✕", subtitle: "下段の取り違え" })
  .readout.matrix("m", { source: "cm", min: 0, max: 10, cellSize: 30, showValue: true, colors: ["#f0f4f8", "#0369a1"] as const, label: "Predictions (4×4)" })
  .phase("p1", {
    duration: 1800,
    title: "対角だけ",
    body: "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。",
  }, (p: PhaseBuilder) => p.activate("c0Diag", "c1Diag").set("cm", '[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]'))
  .phase("p2", {
    duration: 1800,
    title: "誤りが混ざる",
    body: "取り違えた数が対角の外に現れる。 色が対角から散らばる。",
  }, (p: PhaseBuilder) => p.activate("c0Diag", "c0Wrong", "c1Diag", "c1Wrong").set("cm", '[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]'))
  .phase("p3", {
    duration: 1800,
    title: "偏りが出る",
    body: "特定の組合せに誤りが集中する。 濃い升目の位置で癖が読める。",
  }, (p: PhaseBuilder) => p.activate("c0Diag", "c0Wrong", "c1Diag", "c1Wrong", "c2Diag", "c2Wrong", "c3Diag", "c3Wrong").set("cm", '[[6,3,0,1],[4,5,1,0],[0,1,8,1],[0,0,5,3]]'))
.build();
export const subtitle__matrixHeatmap = "4×4 confusion matrix を 4-lane (class 0/1/2/3) 分散、 各 class の diagonal (correct) / off-diagonal (wrong) を個別 card 表示、 matrix readout 併存";

/**
 * 33. progress-group readout = 4 task の progress を label + bar list で表示。
 */
export const taskProgressGroup = diagram("interactive-progress-group", {
  topic: "4 件の進捗を達成 / 遅れで分けて見せる",
})
  .lane("advanced", { x: 0, width: 240 })
  .lane("behind", { x: 300, width: 240 })
  .arraySignal("progress", [40, 75, 20, 90])
  .arraySignal("names", ["Design", "Impl", "Test", "Docs"])
  .node("implNode", { lane: "advanced", stack: 0, kind: "card", title: "Impl", subtitle: "{progress[1]}%" })
  .node("docsNode", { lane: "advanced", stack: 1, kind: "card", title: "Docs", subtitle: "{progress[3]}%" })
  .node("designNode", { lane: "behind", stack: 0, kind: "card", title: "Design", subtitle: "{progress[0]}%" })
  .node("testNode", { lane: "behind", stack: 1, kind: "card", title: "Test", subtitle: "{progress[2]}%" })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "Tasks (progressGroup)",
  })
  .phase("p1", {
    duration: 1800,
    title: "着手前",
    body: "4 件とも進捗が低い。 帯がどれも短い。",
  }, (p: PhaseBuilder) => p.activate("implNode").set("progress", '[10,20,5,15]'))
  .phase("p2", {
    duration: 1800,
    title: "ばらつく",
    body: "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。",
  }, (p: PhaseBuilder) => p.activate("implNode", "docsNode").set("progress", '[40,75,20,90]'))
  .phase("p3", {
    duration: 1800,
    title: "追いつく",
    body: "遅れていた項目が追いつく。 4 本の帯が揃う。",
  }, (p: PhaseBuilder) => p.activate("implNode", "docsNode", "designNode", "testNode").set("progress", '[85,95,80,100]'))
.build();
export const subtitle__taskProgressGroup = "4 task の progress を 2-lane (Advanced ≥50% / Behind <50%) に分散、 各 task 個別 card + progressGroup readout 併存";

/**
 * 34. domain example = EIP-1559 gas cost model。
 *     slider で base fee → 3 block の実 gas cost が waterfall + stacked-bar で並列可視化。
 */
export const eip1559GasFlow = diagram("interactive-eip1559", {
  topic: "EIP-1559 の手数料が 3 ブロックで変わる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 300 })
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
    lane: "col1",
    stack: 0,
    kind: "card", w: 320,
    title: "Wallet",
    subtitle: "base {baseFee} + tip {priority} gwei",
  })
  .node("b1", {
    lane: "col1",
    stack: 1,
    kind: "card", w: 240,
    title: "Block N",
    subtitle: "1.0x = {total1} gwei",
  })
  .node("b2", {
    lane: "col2",
    stack: 0,
    kind: "card", w: 250,
    title: "Block N+1",
    subtitle: "1.2x = {total2} gwei",
  })
  .node("b3", {
    lane: "col2",
    stack: 1,
    kind: "card", w: 250,
    title: "Block N+2",
    subtitle: "1.5x = {total3} gwei",
  })
  .edge("wallet", "b1", { label: "tx submit", sub: "base + tip", tone: "info" })
  .edge("b1", "b2", { label: "next block", sub: "+20% fee", tone: "warning" })
  .edge("b2", "b3", { label: "next block", sub: "+25% fee", tone: "error" })
  .readout.stackedBar("gas", { sourceA: "burned", sourceB: "tips", min: 0, max: 120, colorA: "#ef4444", colorB: "#22c55e", label: "Burned / Tip per block" })
  .phase("p1", {
    duration: 1800,
    title: "1 ブロック目",
    body: "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。",
  }, (p: PhaseBuilder) => p.activate("wallet", "b1").set("burned", '[50,0,0]').set("tips", '[5,0,0]'))
  .phase("p2", {
    duration: 1800,
    title: "2 ブロック目",
    body: "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。",
  }, (p: PhaseBuilder) => p.activate("wallet", "b1", "b2").set("burned", '[50,60,0]').set("tips", '[5,8,0]'))
  .phase("p3", {
    duration: 1800,
    title: "3 ブロック目",
    body: "さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。",
  }, (p: PhaseBuilder) => p.activate("wallet", "b1", "b2", "b3").set("burned", '[50,60,72]').set("tips", '[5,8,10]'))
.build();
export const subtitle__eip1559GasFlow = "EIP-1559 gas cost model = 4 区画 (Sender / Block1 / Block2 / Block3) 2 列 2 段を edge で gas propagation、 base fee slider で 3 block の total が chain 追随";

/**
 * 35. domain example = OAuth 2.0 authorization code flow の sequence timeline。
 */
export const interactiveOauthFlow = diagram("interactive-oauth-flow", {
  topic: "OAuth 認可コードの往復を追う",
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
    title: "Browser",
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
    title: "Resource",
    subtitle: "API endpoint",
  })
  // 1-4 は Browser ↔ Auth server の往復 4 本。 label の位置は engine に任せる。
  //
  // 元は engine が 3 と 4 の label を完全に同じ点に置いていたため、 `labelOffsetX` /
  // `labelOffsetY` を手で与えて 2 列 × 2 段に散らしていた。 cdl#372 / cdl#374 / cdl#376 で
  // engine が重ねず・線を跨がず・弧と同じ並び順に置くようになり、 手作業が要らなくなった。
  //
  // **4 本の説明文 (`sub`) は label 本体に畳んだ**。 2 行 pill は高さ 68 で、 4 本を縦に並べる
  // には 312 の縦幅が要る。 一方 4 本の弧は 96 しか広がらないため、 外側の label が弧から
  // 200 以上離れて `edge-label-proximity` の破綻になる (実測 = 222)。 1 行 pill (36) なら
  // 必要な縦幅が 216 に減り、 全ての label が自分の弧から 86 以内に収まる。
  //
  // 情報は落としていない = `with client_id` 等の文言をそのまま括弧で label 本体に入れた。 pill は
  // 横に伸びるが縦には伸びないので、 束の縦幅は変わらない。
  //
  // lane 間隔は関係しない = cdl が label 幅に合わせて自動で広げるため、 宣言値を変えても実配置は
  // 変わらない (実測 = 320/640 と 620/1240 のどちらでも lane x が 0/1008/2016)。
  .edge("client", "consent", { label: "1. redirect (with client_id)", tone: "info" })
  .edge("consent", "client", { label: "2. consent screen (user approves)", tone: "info", side: "left" })
  .edge("client", "consent", { id: "code-exchange", label: "3. code exchange (with code)", tone: "accent" })
  .edge("consent", "client", { id: "token-issue", label: "4. token issued (access_token)", tone: "success", side: "left" })
  // 5-6 は Auth server を跨いで Browser ↔ Resource を結ぶ。 どちらも迂回するため、 何もしないと
  // 2 本の迂回が同じ高さで重なり label も同じ点に乗る (実測 = 重なり面積 12215)。 6 を下
  // (side: "bottom") に回して迂回の向きを分け、 6 の label だけ下へ 120 離す。 5 側にも offset を
  // 足すと label が path から 170 離れて edge-label-proximity warn が出て、 図の高さが 19% 増える。
  .edge("client", "api", { label: "5. API call", sub: "Bearer token", tone: "accent" })
  .edge("api", "client", { label: "6. resp", sub: "protected data", tone: "success", side: "bottom", labelOffsetY: 120 })
  .readout.sequenceTimeline("seq", { source: "events", min: 0, max: 700, viewW: 400, viewH: 60, color: "#2563eb", label: "Timeline" })
  .readout.stat("finalDelay", { source: "delay", unit: "ms", label: "Delay" })
  .phase("p1", {
    duration: 1800,
    title: "認可を求める",
    body: "利用者が認可画面に進む。 やり取りの 1 つ目が記録される。",
  }, (p: PhaseBuilder) => p.activate("client").set("events", '[[0,"認可要求"]]'))
  .phase("p2", {
    duration: 1800,
    title: "コードを受け取る",
    body: "認可コードが返る。 やり取りが 2 つに増える。",
  }, (p: PhaseBuilder) => p.activate("client", "consent").set("events", '[[0,"認可要求"],[120,"コード発行"]]'))
  .phase("p3", {
    duration: 1800,
    title: "引き換える",
    body: "コードを token に引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。",
  }, (p: PhaseBuilder) => p.activate("client", "consent", "api").set("events", '[[0,"認可要求"],[120,"コード発行"],[260,"token 交換"],[380,"token 発行"],[500,"資源要求"],[620,"資源応答"]]'))
.build();
export const subtitle__interactiveOauthFlow = "OAuth 2.0 authorization code flow を 3-lane (User / Auth server / Resource server) + 6 event edge で node network 化、 latency は slider 追随";

/**
 * 36. domain example = tree diagram = decision tree 3 level (2^3 = 7 node)。
 */
export const decisionTree = diagram("interactive-decision-tree", {
  topic: "3 段の決定木が 4 つの葉に分岐する",
})
  .lane("root", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("leaf", { x: 480, width: 240 })
  .node("node-0", { lane: "root", stack: 1, kind: "card", title: "L0P0", subtitle: "#0 (root)" })
  .node("node-1", { lane: "mid", stack: 0, kind: "card", title: "L1P0", subtitle: "#1" })
  .node("node-2", { lane: "mid", stack: 2, kind: "card", title: "L1P1", subtitle: "#2" })
  .node("node-3", { lane: "leaf", stack: 0, kind: "card", title: "L2P0", subtitle: "#3" })
  .node("node-4", { lane: "leaf", stack: 1, kind: "card", title: "L2P1", subtitle: "#4" })
  .node("node-5", { lane: "leaf", stack: 2, kind: "card", title: "L2P2", subtitle: "#5" })
  .node("node-6", { lane: "leaf", stack: 3, kind: "card", title: "L2P3", subtitle: "#6" })
  // completely-binary tree: 0 -> 1,2 / 1 -> 3,4 / 2 -> 5,6
  .edge("node-0", "node-1", { label: "yes", tone: "success" })
  .edge("node-0", "node-2", { label: "no", tone: "error" })
  .edge("node-1", "node-3", { label: "yes", tone: "success" })
  .edge("node-1", "node-4", { label: "no", tone: "error" })
  .edge("node-2", "node-5", { label: "yes", tone: "success" })
  .edge("node-2", "node-6", { label: "no", tone: "error" })
  .phase("p1", {
    duration: 1600,
    title: "入口に立つ",
    body: "一番上の分かれ道から始まる。 まだどちらにも進んでいない。",
  }, (p: PhaseBuilder) => p.activate("node-0"))
  .phase("p2", {
    duration: 1600,
    title: "1 段目で分かれる",
    body: "最初の判断で左右に分かれる。 2 つの道ができる。",
  }, (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2"))
  .phase("p3", {
    duration: 1600,
    title: "左の枝が分かれる",
    body: "左側だけがもう一度分かれて 2 つの葉になる。 右側はまだ 1 本のまま。",
  }, (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2", "node-3", "node-4"))
  .phase("p4", {
    duration: 1600,
    title: "右の枝も分かれる",
    body: "右側も分かれて 4 つの終点すべてに届く。 2 段の判断で 4 通りの結果になる。",
  }, (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2", "node-3", "node-4", "node-5", "node-6"))
.build();
export const subtitle__decisionTree = "decision tree 3 level (2^2 = 4 leaf) を 3-lane (Root / Mid / Leaf) tree depth 別分散、 stack を parent-child alignment で edge-node-cross 回避、 6 edge で 2 分木構造明示";

/**
 * 37. radar chart = 5 skill dimensions を spider chart で表示。
 */
export const skillRadar = diagram("interactive-skill-radar", {
  topic: "5 技能を強 / 中 / 弱に分けて見せる",
})
  .lane("strong", { x: 0, width: 220 })
  .lane("middle", { x: 260, width: 220 })
  .lane("weak", { x: 520, width: 220 })
  .arraySignal("skills", [8, 5, 7, 3, 9])
  .arraySignal("skillNames", ["Design", "Impl", "Test", "Docs", "Debug"])
  .node("designNode", { lane: "strong", stack: 0, kind: "card", title: "Design", subtitle: "{skills[0]}/10" })
  .node("testNode", { lane: "strong", stack: 1, kind: "card", title: "Test", subtitle: "{skills[2]}/10" })
  .node("debugNode", { lane: "strong", stack: 2, kind: "card", title: "Debug", subtitle: "{skills[4]}/10" })
  .node("implNode", { lane: "middle", stack: 0, kind: "card", title: "Impl", subtitle: "{skills[1]}/10" })
  .node("docsNode", { lane: "weak", stack: 0, kind: "card", title: "Docs", subtitle: "{skills[3]}/10" })
  .readout.radar("radar", { source: "skills", max: 10, labelSource: "skillNames", color: "#2563eb", viewW: 200, viewH: 200, label: "Skills (polygon spider)" })
  .phase("p1", {
    duration: 1800,
    title: "偏った形",
    body: "1 つの技能だけが高い。 図形が一方向に伸びる。",
  }, (p: PhaseBuilder) => p.activate("designNode").set("skills", '[9,2,3,2,3]'))
  .phase("p2", {
    duration: 1800,
    title: "広がる",
    body: "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。",
  }, (p: PhaseBuilder) => p.activate("designNode", "testNode", "debugNode").set("skills", '[8,5,7,3,9]'))
  .phase("p3", {
    duration: 1800,
    title: "形が整う",
    body: "5 技能が近い値になり、図形が正多角形に近づく。",
  }, (p: PhaseBuilder) => p.activate("designNode", "testNode", "debugNode", "implNode", "docsNode").set("skills", '[7,7,8,6,8]'))
.build();
export const subtitle__skillRadar = "5 skill を 3-lane (Strong ≥7 / Middle 5-6 / Weak <5) レベル別分散、 各 skill 個別 card + radar readout 併存";

/**
 * 38. bubble chart = 3D data (perf / cost / usage) の bubbles、 各点の size で 3 次元目を表現。
 */
export const perfBubbleChart = diagram("interactive-perf-bubble", {
  topic: "5 種の処理の負荷を大きさで比べる",
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
  .node("w2", { lane: "high", stack: 0, kind: "card", title: "Workload B", subtitle: "中央寄りの処理" })
  .node("w3", { lane: "high", stack: 1, kind: "card", title: "Workload C", subtitle: "右上に位置する処理" })
  .node("w5", { lane: "high", stack: 2, kind: "card", title: "Workload E", subtitle: "左上に位置する処理" })
  .node("w1", { lane: "low", stack: 0, kind: "card", title: "Workload A", subtitle: "左下に位置する処理" })
  .node("w4", { lane: "low", stack: 1, kind: "card", title: "Workload D", subtitle: "右寄りの処理" })
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
  .phase("p1", {
    duration: 1800,
    title: "軽い処理",
    body: "負荷の小さい処理だけを置く。 円が小さくまとまる。",
  }, (p: PhaseBuilder) => p.activate("w2").set("perf", '[[50,20,3],[70,40,4],[90,60,3]]'))
  .phase("p2", {
    duration: 1800,
    title: "重い処理が入る",
    body: "負荷の大きい処理が加わる。 円の大小差が開く。",
  }, (p: PhaseBuilder) => p.activate("w2", "w3", "w5").set("perf", '[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]'))
  .phase("p3", {
    duration: 1800,
    title: "偏りが出る",
    body: "右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。",
  }, (p: PhaseBuilder) => p.activate("w2", "w3", "w5", "w1", "w4").set("perf", '[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]'))
.build();
export const subtitle__perfBubbleChart = "5 workload を 2-lane (High usage ≥7 / Low usage <7) usage size 別分散、 各 workload 個別 card + bubbleChart readout 併存";

/**
 * 39. donut chart = portfolio share (asset allocation) を multi-segment donut 表示。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "資産 4 種を伝統 / 代替に分けて見せる",
})
  .lane("traditional", { x: 0, width: 300 })
  .lane("alternative", { x: 340, width: 300 })
  .arraySignal("assets", [45, 30, 15, 10])
  .arraySignal("assetNames", ["Stocks", "Bonds", "Cash", "Crypto"])
  .node("stocksNode", { lane: "traditional", stack: 0, kind: "card", title: "Stocks", subtitle: "{assets[0]}%" })
  .node("bondsNode", { lane: "traditional", stack: 1, kind: "card", title: "Bonds", subtitle: "{assets[1]}%" })
  .node("cashNode", { lane: "alternative", stack: 0, kind: "card", title: "Cash", subtitle: "{assets[2]}%" })
  .node("cryptoNode", { lane: "alternative", stack: 1, kind: "card", title: "Crypto", subtitle: "{assets[3]}%" })
  .node("totalNode", { lane: "traditional", stack: 2, kind: "card", title: "Portfolio", subtitle: "合計 {assets.sum}% · 最大 {assets.max}%" })
  .readout.donut("d", { source: "assets", innerRatio: 0.55, viewW: 160, viewH: 160, label: "Allocation (donut)" })
  .readout.arrayList("legend", { source: "assetNames", itemTemplate: "● {item}", label: "Legend" })
  .phase("p1", {
    duration: 1800,
    title: "株式に寄る",
    body: "株式の比重が大きい配分。 円の 1 区画が広い。",
  }, (p: PhaseBuilder) => p.activate("stocksNode").set("assets", '[60,20,15,5]').set("assetNames", '["Stocks","Bonds","Cash","Crypto"]'))
  .phase("p2", {
    duration: 1800,
    title: "債券を増やす",
    body: "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。",
  }, (p: PhaseBuilder) => p.activate("stocksNode", "bondsNode").set("assets", '[45,30,15,10]').set("assetNames", '["Stocks","Bonds","Crypto","Cash"]'))
  .phase("p3", {
    duration: 1800,
    title: "分散する",
    body: "4 種に近い比率で分散する。 区画の差が小さくなる。",
  }, (p: PhaseBuilder) => p.activate("stocksNode", "bondsNode", "cashNode", "cryptoNode", "totalNode").set("assets", '[30,28,22,20]').set("assetNames", '["Stocks","Bonds","Cash","Crypto"]'))
.build();
export const subtitle__portfolioDonut = "portfolio 4 asset を 2-lane (Traditional Stocks+Bonds / Alternative Cash+Crypto) 分散、 各 asset 個別 card、 donut readout 併存";

/**
 * 40. domain KPI dashboard = 4 KPI (revenue / users / churn / NPS) を 4 readout 組合せで dashboard 化。
 */
export const kpiDashboard = diagram("interactive-kpi-dashboard", {
  topic: "SaaS の主要指標 4 つを 1 画面に並べる",
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
  .edge("revCard", "npsCard", { label: "correlate", sub: "rev/2 + 20", tone: "success", side: "bottom" })
  .readout.stat("rev", { source: "revenueInput", unit: "k", label: "Revenue" })
  .readout.stat("usr", { source: "users", label: "Users" })
  .readout.gauge("chr", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "Churn %" })
  .readout.percentRing("np", { source: "nps", max: 100, color: "#22c55e", label: "NPS" })
  .phase("p1", {
    duration: 1800,
    title: "利用者を見る",
    body: "売上のつまみから計算式で利用者数を導く。 4 指標のうち 1 つ目。",
  }, (p: PhaseBuilder) => p.activate("usersCard"))
  .phase("p2", {
    duration: 1800,
    title: "解約率も導く",
    body: "同じ元の値から解約率を導く。 売上を動かすと 2 つが同時に変わる。",
  }, (p: PhaseBuilder) => p.activate("usersCard", "churnCard"))
  .phase("p3", {
    duration: 1800,
    title: "4 指標が揃う",
    body: "推奨度まで並ぶ。 つまみが持つ 1 指標と、そこから導く 3 指標の組になっている。",
  }, (p: PhaseBuilder) => p.activate("revCard", "usersCard", "churnCard", "npsCard"))
.build();
export const subtitle__kpiDashboard = "SaaS KPI dashboard = 4-lane (Revenue / Users / Churn / NPS) node grid + revenue → users/churn/nps に因果関係 edge、 formula chain で 3 KPI が chain 追随";

/**
 * 41. domain A/B test result = 2 variant の conversion rate + confidence を並列表示。
 */
export const abTestResult = diagram("interactive-ab-test", {
  topic: "A/B テストの振り分けと結果を見せる",
})
  .lane("varA", { x: 0, width: 300 })
  .lane("split", { x: 360, width: 250 })
  .lane("varB", { x: 670, width: 300 })
  .arraySignal("convA", [40, 45, 42, 48, 44])
  .arraySignal("convB", [50, 55, 58, 62, 60])
  .arraySignal("splitData", [50, 50])
  .arraySignal("results", [58, 42])
  .node("controlCard", {
    lane: "varA",
    stack: 0,
    kind: "card", w: 250,
    title: "Variant A",
    subtitle: "avg {convA.avg}%",
  })
  .node("splitCard", {
    lane: "split",
    stack: 0,
    kind: "card", w: 200,
    title: "Split",
    subtitle: "振り分け {splitData[0]} / {splitData[1]}",
  })
  .node("treatmentCard", {
    lane: "varB",
    stack: 0,
    kind: "card", w: 250,
    title: "Variant B",
    subtitle: "avg {convB.avg}%",
  })
  .edge("splitCard", "controlCard", { label: "50%", sub: "control", tone: "info", side: "left" })
  .edge("splitCard", "treatmentCard", { label: "50%", sub: "treatment", tone: "success" })
  .readout.stackedBar("conv", { sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#a08870", colorB: "#22c55e", label: "Daily conv % (A vs B)" })
  .readout.donut("splitDonut", { source: "splitData", innerRatio: 0.5, viewW: 120, viewH: 120, label: "Traffic split" })
  .readout.donut("winner", { source: "results", innerRatio: 0.6, viewW: 120, viewH: 120, colors: ["#22c55e", "#a08870"] as const, label: "Winner share (B=green)" })
  .phase("p1", {
    duration: 1800,
    title: "振り分け",
    body: "利用者を半々に分ける。 振り分けの円が 2 等分になる。",
  }, (p: PhaseBuilder) => p.activate("controlCard", "splitCard").set("splitData", '[50,50]').set("results", '[50,50]').set("convA", '[48,50,49,51,50]').set("convB", '[49,50,51,50,52]'))
  .phase("p2", {
    duration: 1800,
    title: "差が出る",
    body: "試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。",
  }, (p: PhaseBuilder) => p.activate("controlCard", "splitCard", "treatmentCard").set("splitData", '[60,40]').set("results", '[55,45]').set("convA", '[48,49,50,48,49]').set("convB", '[52,55,57,56,58]'))
  .phase("p3", {
    duration: 1800,
    title: "差が確定する",
    body: "振り分けを半々に戻しても差が残る。 振り分けと結果を分けて見られる。",
  }, (p: PhaseBuilder) => p.activate("splitCard", "treatmentCard").set("splitData", '[50,50]').set("results", '[62,38]').set("convA", '[47,48,49,47,48]').set("convB", '[58,61,63,62,65]'))
.build();
export const subtitle__abTestResult = "A/B test を 3-lane (Variant A / Split / Variant B) + Split → A,B edge で experiment 構造を node network 化";

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
  topic: "30 日の活動量を升目の濃さで見せる",
})
  .lane("q1", { x: 0, width: 160 })
  .lane("q2", { x: 180, width: 160 })
  .lane("q3", { x: 360, width: 160 })
  .lane("q4", { x: 540, width: 160 })
  .arraySignal("commits", generateCommits())
  .node("q1Card", { lane: "q1", stack: 0, kind: "card", title: "Q1 (Jan-Mar)", subtitle: "静かな期間" })
  .node("q2Card", { lane: "q2", stack: 0, kind: "card", title: "Q2 (Apr-Jun)", subtitle: "活発な期間" })
  .node("q3Card", { lane: "q3", stack: 0, kind: "card", title: "Q3 (Jul-Sep)", subtitle: "落ち着く期間" })
  .node("q4Card", { lane: "q4", stack: 0, kind: "card", title: "Q4 (Oct-Dec)", subtitle: "全体の推移" })
  .node("totalCard", { lane: "q4", stack: 1, kind: "card", title: "Year total", subtitle: "sum {commits.sum} · max {commits.max} · avg {commits.avg}" })
  .readout.calendarHeatmap("h", { source: "commits", max: 10, cellSize: 10, cellGap: 2, label: "1 year (53 週 × 7 日)" })
  .phase("p1", {
    duration: 1800,
    title: "静かな期間",
    body: "書き込みが少ない期間。 濃い升目がまばら。",
  }, (p: PhaseBuilder) => p.activate("q1Card").set("commits", '[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]'))
  .phase("p2", {
    duration: 1800,
    title: "活発になる",
    body: "書き込みが増えて濃い升目が続く。 帯のように連なる。",
  }, (p: PhaseBuilder) => p.activate("q1Card", "q2Card").set("commits", '[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]'))
  .phase("p3", {
    duration: 1800,
    title: "落ち着く",
    body: "終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。",
  }, (p: PhaseBuilder) => p.activate("q1Card", "q2Card", "q3Card", "q4Card", "totalCard").set("commits", '[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]'))
.build();
export const subtitle__contributionHeatmap = "365 day contribution を 4-lane (Q1/Q2/Q3/Q4 quarter) 分散、 各 quarter summary card + total/max、 calendarHeatmap readout 併存";

/**
 * 43. mini-map = 大 canvas 1000×800 上の 400×300 viewport を slider で移動、 mini-map で追従。
 */
export const canvasMiniMap = diagram("interactive-canvas-minimap", {
  topic: "全体図の中で今見ている範囲を示す",
})
  .lane("xpan", { x: 0, width: 200 })
  .lane("ypan", { x: 240, width: 200 })
  .lane("map", { x: 480, width: 260 })
  .input.slider("panX", { min: 0, max: 600, defaultValue: 300, label: "Pan X" })
  .input.slider("panY", { min: 0, max: 500, defaultValue: 250, label: "Pan Y" })
  .state("panX", { initial: 300 })
  .state("panY", { initial: 250 })
  .arraySignal("viewport", [300, 250, 400, 300])
  .node("xNode", { lane: "xpan", stack: 0, kind: "card", title: "Pan X", subtitle: "panX = {panX}px (0-600)" })
  .node("yNode", { lane: "ypan", stack: 0, kind: "card", title: "Pan Y", subtitle: "panY = {panY}px (0-500)" })
  .node("mapNode", { lane: "map", stack: 0, kind: "card", title: "Mini-map", subtitle: "pan ({panX}, {panY}) view 400×300" })
  .readout.miniMap("map", { source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "Overview (mini-map)" })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "X stat" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "Y stat" })
  .phase("p1", {
    duration: 1800,
    title: "左上を見る",
    body: "全体図の左上を見ている状態。 小窓の枠が左上にある。",
  }, (p: PhaseBuilder) => p.activate("xNode").set("viewport", '[0,0,400,300]'))
  .phase("p2", {
    duration: 1800,
    title: "右へ移る",
    body: "見ている範囲が右へ移る。 小窓の枠も追いかける。",
  }, (p: PhaseBuilder) => p.activate("xNode", "yNode").set("viewport", '[500,0,400,300]'))
  .phase("p3", {
    duration: 1800,
    title: "下へ移る",
    body: "さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。",
  }, (p: PhaseBuilder) => p.activate("xNode", "yNode", "mapNode").set("viewport", '[500,400,400,300]'))
.build();
export const subtitle__canvasMiniMap = "canvas mini-map を 3-lane (X pan / Y pan / Mini-map viewport) 分散、 axis 別 control + viewport 集約、 miniMap readout 併存";

/**
 * 44. kpi-card = revenue の現在値 + 直前値との delta + 6 point history sparkline を composite。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "前期と今期の売上を推移付きで比べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 350 })
  .input.slider("current", { min: 50, max: 300, defaultValue: 180, label: "Current revenue (k)" })
  .state("current", { initial: 180 })
  .state("prev", { initial: 150 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("prevNode", { lane: "col1", stack: 0, kind: "card", w: 220, title: "Previous", subtitle: "{prev}k (baseline)" })
  .node("currNode", { lane: "col2", stack: 0, kind: "card", w: 300, title: "◆ Current", subtitle: "{current}k (slider driven)" })
  .node("trendNode", { lane: "col1", stack: 1, kind: "card", w: 320, title: "Trend", subtitle: "6 month sparkline (120-170k)" })
  .edge("prevNode", "currNode", { label: "delta = current - prev", tone: "success" })
  .edge("currNode", "trendNode", { label: "sparkline last", tone: "info" })
  .readout.kpiCard("kpi", { source: "current", historySource: "history", comparisonSource: "prev", unit: "k", colorPos: "#22c55e", colorNeg: "#ef4444", label: "Revenue KPI (composite)" })
  .readout.stat("prevStat", { source: "prev", unit: "k", label: "Prev stat" })
  .phase("p1", {
    duration: 1800,
    title: "前期を見る",
    body: "比べる相手になる前期の値。 これは固定で動かない。",
  }, (p: PhaseBuilder) => p.activate("prevNode"))
  .phase("p2", {
    duration: 1800,
    title: "今期を見る",
    body: "今期の値はつまみで動く。 前期との差がその場で出る。",
  }, (p: PhaseBuilder) => p.activate("prevNode", "currNode"))
  .phase("p3", {
    duration: 1800,
    title: "推移で読む",
    body: "推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。",
  }, (p: PhaseBuilder) => p.activate("prevNode", "currNode", "trendNode"))
.build();
export const subtitle__revenueKpiCard = "revenue KPI を 3 区画 (Previous / Current / Trend) 2 列 2 段に分散 + prev→current delta edge、 kpiCard readout 併存";

/**
 * 45. candlestick chart = 8 日分の OHLC を蝋燭足で表示 (finance chart)。
 */
export const priceCandlestick = diagram("interactive-price-candlestick", {
  topic: "8 日分の値動きを陽線 / 陰線で見せる",
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
  .phase("p1", {
    duration: 1800,
    title: "横ばい",
    body: "始値と終値が近い日が続く。 実体の短い足が並ぶ。",
  }, (p: PhaseBuilder) => p.activate("d1", "d2").set("ohlc", '[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]'))
  .phase("p2", {
    duration: 1800,
    title: "上がる",
    body: "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("d1", "d2", "d3", "d4").set("ohlc", '[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]'))
  .phase("p3", {
    duration: 1800,
    title: "振れる",
    body: "上下の幅が大きい日が混ざる。 ヒゲの長さで振れ幅が読める。",
  }, (p: PhaseBuilder) => p.activate("d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8").set("ohlc", '[[100,108,96,105],[105,118,95,102],[102,106,97,104],[104,120,103,111],[111,115,98,109],[109,121,106,112],[112,118,101,116],[116,122,113,118]]'))
.build();
export const subtitle__priceCandlestick = "OHLC 8 day を 2-lane (Up days close≥open / Down days close<open) 分散、 各 day 個別 card + candlestick readout 併存";

/**
 * 46. Venn diagram = 2 set (Users / Payers) の intersection を可視化。
 */
export const userVenn = diagram("interactive-user-venn", {
  topic: "2 つの集合の重なりを 3 領域で見せる",
})
  .lane("usersOnly", { x: 0, width: 220 })
  .lane("both", { x: 260, width: 200 })
  .lane("payersOnly", { x: 500, width: 200 })
  .arraySignal("sets", [100, 40, 25])
  .node("usersOnlyNode", { lane: "usersOnly", stack: 0, kind: "card", title: "Users total", subtitle: "A 全体 {sets[0]} · 共通 {sets[2]}" })
  .node("bothNode", { lane: "both", stack: 0, kind: "card", title: "Both (A ∩ B)", subtitle: "共通 = {sets[2]}" })
  .node("payersOnlyNode", { lane: "payersOnly", stack: 0, kind: "card", title: "Payers total", subtitle: "B 全体 = {sets[1]}" })
  .node("totalNode", { lane: "both", stack: 1, kind: "card", title: "Universe", subtitle: "A={sets[0]} · B={sets[1]}" })
  .readout.venn("v", { source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "Users", labelB: "Payers", label: "Overlap (2-set Venn)" })
  .phase("p1", {
    duration: 1800,
    title: "重なりなし",
    body: "2 つの集まりが離れている。 共通する人が居ない。",
  }, (p: PhaseBuilder) => p.activate("usersOnlyNode").set("sets", '[100,40,0]'))
  .phase("p2", {
    duration: 1800,
    title: "重なる",
    body: "共通する人が現れて 2 つの円が重なる。",
  }, (p: PhaseBuilder) => p.activate("usersOnlyNode", "bothNode").set("sets", '[100,40,25]'))
  .phase("p3", {
    duration: 1800,
    title: "大きく重なる",
    body: "共通部分が広がる。 重なりの面積で関係の強さが読める。",
  }, (p: PhaseBuilder) => p.activate("usersOnlyNode", "bothNode", "payersOnlyNode", "totalNode").set("sets", '[100,60,45]'))
.build();
export const subtitle__userVenn = "2 set Venn を 3-lane (Users only / Both / Payers only) 領域別分散、 各 region 個別 card、 venn readout 併存";

/**
 * 47. slope chart = 5 student の test score before/after 変化を slope で表示。
 */
export const scoreSlope = diagram("interactive-score-slope", {
  topic: "5 人の点数変化を上昇 / 下降で分ける",
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
  .node("aliceNode", { lane: "up", stack: 0, kind: "card", title: "Alice ↑", subtitle: "1 人目" })
  .node("carolNode", { lane: "up", stack: 1, kind: "card", title: "Carol ↑", subtitle: "3 人目" })
  .node("danNode", { lane: "up", stack: 2, kind: "card", title: "Dan ↑", subtitle: "4 人目" })
  .node("bobNode", { lane: "down", stack: 0, kind: "card", title: "Bob ↓", subtitle: "2 人目" })
  .node("eveNode", { lane: "down", stack: 1, kind: "card", title: "Eve ↓", subtitle: "5 人目" })
  .readout.slope("s", { source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "Score change (slope)" })
  .phase("p1", {
    duration: 1800,
    title: "横並び",
    body: "前後で点数が変わらない状態。 線が水平に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("aliceNode").set("scores", '[[65,65,"Alice"],[70,70,"Bob"],[55,55,"Carol"]]'))
  .phase("p2", {
    duration: 1800,
    title: "差が出る",
    body: "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "carolNode", "danNode").set("scores", '[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]'))
  .phase("p3", {
    duration: 1800,
    title: "順位が入れ替わる",
    body: "前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "carolNode", "danNode", "bobNode", "eveNode").set("scores", '[[65,72,"Alice"],[70,60,"Bob"],[55,90,"Carol"],[80,75,"Dan"],[60,85,"Eve"]]'))
.build();
export const subtitle__scoreSlope = "5 student score change を 2-lane (Improved up ↑ / Declined down ↓) 分散、 各 student 個別 card、 slope readout 併存";

/**
 * 48. sales funnel = 4 stage の conversion funnel (Visit → Signup → Trial → Paid)。
 */
export const salesFunnel = diagram("interactive-sales-funnel", {
  topic: "訪問から購入までの絞り込みを追う",
})
  .lane("col1", { x: 0, width: 220 })
  .lane("col2", { x: 260, width: 270 })
  .arraySignal("stages", [
    ["Visit", 1000],
    ["Signup", 400],
    ["Trial", 150],
    ["Paid", 40],
  ] as unknown as (string | number)[])
  .node("visitNode", { lane: "col1", stack: 0, kind: "card", w: 160, title: "Visit", subtitle: "漏斗の入口" })
  .node("signupNode", { lane: "col2", stack: 0, kind: "card", w: 180, title: "Signup", subtitle: "登録に進む段" })
  .node("trialNode", { lane: "col1", stack: 1, kind: "card", w: 170, title: "Trial", subtitle: "試用に進む段" })
  .node("paidNode", { lane: "col2", stack: 1, kind: "card", w: 220, title: "Paid", subtitle: "購入に至る段" })
  .edge("visitNode", "signupNode", { label: "登録へ", tone: "info" })
  .edge("signupNode", "trialNode", { label: "試用へ", tone: "warning" })
  .edge("trialNode", "paidNode", { label: "購入へ", tone: "error" })
  .readout.funnel("f", { source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#a08870", label: "Conversion (trapezoid)" })
  .phase("p1", {
    duration: 1800,
    title: "入口だけ",
    body: "訪問だけがある状態。 漏斗の一番上が広い。",
  }, (p: PhaseBuilder) => p.activate("visitNode").set("stages", '[["Visit",1000],["Signup",0],["Trial",0],["Paid",0]]'))
  .phase("p2", {
    duration: 1800,
    title: "絞られる",
    body: "登録と試用に進む人が現れる。 段ごとに幅が細くなる。",
  }, (p: PhaseBuilder) => p.activate("visitNode", "signupNode", "trialNode").set("stages", '[["Visit",1000],["Signup",400],["Trial",150],["Paid",40]]'))
  .phase("p3", {
    duration: 1800,
    title: "歩留まりが上がる",
    body: "各段の残る割合が改善する。 漏斗の細まり方が緩くなる。",
  }, (p: PhaseBuilder) => p.activate("visitNode", "signupNode", "trialNode", "paidNode").set("stages", '[["Visit",1000],["Signup",620],["Trial",340],["Paid",130]]'))
.build();
export const subtitle__salesFunnel = "sales funnel 4 stage を 2 列 2 段の pipeline + 3 drop-off edge、 Visit → Signup → Trial → Paid の conversion 遷移 network 化";

/**
 * 49. project gantt = 4 task を 10 day timeline 上に配置。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "4 工程の期間を横棒で並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 330 })
  .arraySignal("tasks", [
    ["Design", 0, 3],
    ["Impl", 3, 5],
    ["Test", 6, 3],
    ["Ship", 9, 1],
  ] as unknown as (string | number)[])
  .node("designNode", { lane: "col1", stack: 0, kind: "card", w: 200, title: "Design", subtitle: "day 0-3 (3 day)" })
  .node("implNode", { lane: "col2", stack: 0, kind: "card", w: 280, title: "Impl", subtitle: "day 3-8 (5 day, largest)" })
  .node("testNode", { lane: "col1", stack: 1, kind: "card", w: 320, title: "Test", subtitle: "day 6-9 (3 day, overlap w/ impl)" })
  .node("shipNode", { lane: "col2", stack: 1, kind: "card", w: 210, title: "Ship", subtitle: "day 9-10 (1 day)" })
  .edge("designNode", "implNode", { label: "handover", tone: "info" })
  .edge("implNode", "testNode", { label: "test start", tone: "accent" })
  .edge("testNode", "shipNode", { label: "release", tone: "success" })
  .readout.gantt("g", { source: "tasks", min: 0, max: 10, viewW: 320, viewH: 140, color: "#2563eb", label: "Timeline (gantt)" })
  .phase("p1", {
    duration: 1800,
    title: "設計だけ",
    body: "最初の作業だけが置かれた状態。 帯が 1 本。",
  }, (p: PhaseBuilder) => p.activate("designNode").set("tasks", '[["Design",0,3]]'))
  .phase("p2", {
    duration: 1800,
    title: "連なる",
    body: "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("designNode", "implNode", "testNode").set("tasks", '[["Design",0,3],["Impl",3,5],["Test",6,3]]'))
  .phase("p3", {
    duration: 1800,
    title: "重なる",
    body: "作業が並行して重なる期間が出る。 帯の重なりで山場が読める。",
  }, (p: PhaseBuilder) => p.activate("designNode", "implNode", "testNode", "shipNode").set("tasks", '[["Design",0,3],["Impl",2,6],["Test",6,4],["Ship",9,1]]'))
.build();
export const subtitle__projectGantt = "project 4 task を 4 区画 (Design / Impl / Test / Ship) 2 列 2 段で task 別分散 + 3 handover edge、 gantt readout 併存";

/**
 * 50. resource treemap = 6 team の share 割合を hierarchical rectangles で表示。
 */
export const resourceTreemap = diagram("interactive-resource-treemap", {
  topic: "6 チームの予算を面積で比べる",
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
  .node("engNode", { lane: "major", stack: 0, kind: "card", title: "Engineering", subtitle: "最も大きい区画" })
  .node("salesNode", { lane: "major", stack: 1, kind: "card", title: "Sales", subtitle: "2 番目に大きい" })
  .node("mktNode", { lane: "major", stack: 2, kind: "card", title: "Marketing", subtitle: "中位の区画" })
  .node("supportNode", { lane: "mid", stack: 0, kind: "card", title: "Support", subtitle: "小さめの区画" })
  .node("opsNode", { lane: "mid", stack: 1, kind: "card", title: "Ops", subtitle: "小さい区画" })
  .node("legalNode", { lane: "minor", stack: 0, kind: "card", title: "Legal", subtitle: "最も小さい区画" })
  .readout.treemap("t", { source: "teams", viewW: 280, viewH: 200, label: "Budget (treemap)" })
  .phase("p1", {
    duration: 1800,
    title: "均等に分ける",
    body: "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。",
  }, (p: PhaseBuilder) => p.activate("engNode").set("teams", '[["Engineering",19],["Sales",18],["Marketing",17],["Support",16],["Ops",15],["Legal",14]]'))
  .phase("p2", {
    duration: 1800,
    title: "1 つに寄る",
    body: "1 つに配分が寄る。 大きな区画が場所を占める。",
  }, (p: PhaseBuilder) => p.activate("engNode", "salesNode", "mktNode").set("teams", '[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]'))
  .phase("p3", {
    duration: 1800,
    title: "分け直す",
    body: "配分を組み替える。 区画の大小と位置が同時に変わる。",
  }, (p: PhaseBuilder) => p.activate("engNode", "salesNode", "mktNode", "supportNode", "opsNode", "legalNode").set("teams", '[["Engineering",30],["Sales",28],["Marketing",18],["Support",12],["Ops",8],["Legal",4]]'))
.build();
export const subtitle__resourceTreemap = "6 team budget を 3-lane (Major ≥15% / Mid 5-14% / Minor <5%) size 別分散、 各 team 個別 card、 treemap readout 併存";

/**
 * 51. sankey flow = traffic source → landing → conversion の flow diagram。
 */
export const trafficSankey = diagram("interactive-traffic-sankey", {
  topic: "流入 3 経路が 1 つの成果に合流する",
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
  .node("search", { lane: "src", stack: 0, kind: "card", title: "Search", subtitle: "検索からの流入" })
  .node("social", { lane: "src", stack: 1, kind: "card", title: "Social", subtitle: "SNS からの流入" })
  .node("direct", { lane: "src", stack: 2, kind: "card", title: "Direct", subtitle: "直接の流入" })
  .node("home", { lane: "land", stack: 0, kind: "card", title: "Home", subtitle: "入口ページ" })
  .node("product", { lane: "land", stack: 1, kind: "card", title: "Product", subtitle: "商品ページ" })
  .node("checkout", { lane: "cv", stack: 0, kind: "card", title: "Checkout", subtitle: "成果ページ" })
  .edge("search", "home", { label: "40", tone: "success" })
  .edge("search", "product", {
    label: "30",
    tone: "success",
    // 縦に降りる区間 (x=540) の中点に置くと、 direct → home の縦区間 (x=507) と 33px しか離れず
    // 互いの pill が path を貫く。 右へ寄せて縦区間 2 本の間から外す。 60 では足りず (error 1)、
    // 90 で解消する。
    labelOffsetX: 90,
  })
  .edge("social", "home", { label: "25", tone: "info" })
  .edge("social", "product", { label: "15", tone: "info" })
  .edge("direct", "home", { label: "20", tone: "accent" })
  .edge("direct", "product", { label: "10", tone: "accent" })
  .edge("home", "checkout", { label: "85", tone: "warning" })
  .edge("product", "checkout", { label: "55", tone: "warning" })
  .readout.sankey("s", { source: "flows", viewW: 340, viewH: 220, label: "Sources → Pages (sankey)" })
  .phase("p1", {
    duration: 1800,
    title: "1 経路",
    body: "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。",
  }, (p: PhaseBuilder) => p.activate("search", "home").set("flows", '[["Search","Home",40]]'))
  .phase("p2", {
    duration: 1800,
    title: "枝分かれ",
    body: "流入元が増え、行き先も分かれる。 帯が交差する。",
  }, (p: PhaseBuilder) => p.activate("search", "social", "home", "product").set("flows", '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15]]'))
  .phase("p3", {
    duration: 1800,
    title: "流入元が増える",
    body: "3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。",
  }, (p: PhaseBuilder) => p.activate("search", "social", "direct", "home", "product", "checkout").set("flows", '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]'))
.build();
export const subtitle__trafficSankey = "traffic source (3) → landing (2) → conversion (1) の 3-lane funnel を node network + edge で明示、 sankey readout 併存";

/**
 * 52. polar-area = 7 day activity distribution。
 */
export const activityPolar = diagram("interactive-activity-polar", {
  topic: "1 週間の活動を平日 / 週末に分ける",
})
  .lane("weekday", { x: 0, width: 300 })
  .lane("weekend", { x: 380, width: 220 })
  .arraySignal("hours", [3, 5, 8, 6, 7, 4, 2])
  .arraySignal("days", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  .node("monNode", { lane: "weekday", stack: 0, kind: "card", title: "Mon", subtitle: "{hours[0]}h" })
  .node("tueNode", { lane: "weekday", stack: 1, kind: "card", title: "Tue", subtitle: "{hours[1]}h" })
  .node("wedNode", { lane: "weekday", stack: 2, kind: "card", title: "Wed", subtitle: "{hours[2]}h" })
  .node("thuNode", { lane: "weekday", stack: 3, kind: "card", title: "Thu", subtitle: "{hours[3]}h" })
  .node("friNode", { lane: "weekday", stack: 4, kind: "card", title: "Fri", subtitle: "{hours[4]}h" })
  .node("satNode", { lane: "weekend", stack: 0, kind: "card", title: "Sat", subtitle: "{hours[5]}h" })
  .node("sunNode", { lane: "weekend", stack: 1, kind: "card", title: "Sun", subtitle: "{hours[6]}h" })
  .readout.polarArea("p", { source: "hours", max: 10, labelSource: "days", viewW: 220, viewH: 220, label: "Hours (polar sectors)" })
  .phase("p1", {
    duration: 1800,
    title: "平日だけ",
    body: "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode").set("hours", '[6,7,8,6,7,0,0]'))
  .phase("p2", {
    duration: 1800,
    title: "週末も入る",
    body: "週末にも時間が入る。 扇形が一周に広がる。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode", "wedNode", "thuNode", "friNode").set("hours", '[3,5,8,6,7,4,2]'))
  .phase("p3", {
    duration: 1800,
    title: "差を均す",
    body: "曜日ごとの差が縮まる。 扇形の長さが揃う。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode", "wedNode", "thuNode", "friNode", "satNode", "sunNode").set("hours", '[5,5,6,5,6,4,4]'))
.build();
export const subtitle__activityPolar = "weekly activity 7 day を 2-lane (Weekday / Weekend) に分散、 各 day 個別 card + hours、 polarArea readout 併存";

/**
 * 53. step-indicator = onboarding 5 step wizard、 slider で current step を切替。
 */
export const onboardingStepper = diagram("interactive-onboarding-stepper", {
  topic: "5 段の初期設定ウィザードを追う",
})
  .lane("col1", { x: 0, width: 250 })
  .lane("col2", { x: 290, width: 340 })
  .lane("col3", { x: 670, width: 190 })
  .input.stepper("current", { min: 0, max: 4, defaultValue: 2, label: "Current step" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["Sign up", "Profile", "Preferences", "Verify", "Done"])
  .node("signupNode", { lane: "col1", stack: 0, kind: "card", w: 200, title: "Sign up", subtitle: "アカウント作成" })
  .node("profileNode", { lane: "col1", stack: 1, kind: "card", w: 200, title: "Profile", subtitle: "プロフィール記入" })
  .node("prefsNode", { lane: "col2", stack: 0, kind: "card", w: 290, title: "Preferences", subtitle: "設定選択 (現在地)" })
  .node("verifyNode", { lane: "col2", stack: 1, kind: "card", w: 180, title: "Verify", subtitle: "認証確認" })
  .node("doneNode", { lane: "col3", stack: 0, kind: "card", w: 140, title: "Done", subtitle: "完了" })
  .edge("signupNode", "profileNode", { label: "next", tone: "info" })
  .edge("profileNode", "prefsNode", { label: "next", tone: "info" })
  .edge("prefsNode", "verifyNode", { label: "next", tone: "accent" })
  .edge("verifyNode", "doneNode", { label: "finish", tone: "success" })
  .readout.stepIndicator("wizard", { source: "current", stepsSource: "steps", viewW: 360, viewH: 60, colorActive: "#2563eb", colorPending: "#cbd5e1", label: "Progress (dot strip)" })
  .phase("p", {
    duration: 1200,
    title: "wizard pipeline",
    body: "5 区画 pipeline (Sign up → Profile → Preferences → Verify → Done) を 3 列 2 段に置いて + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。",
  }, (p: PhaseBuilder) => p.activate("signupNode", "profileNode", "prefsNode", "verifyNode", "doneNode").badge("wizard"))
  .build();
export const subtitle__onboardingStepper = "onboarding 5 step wizard を 3 列 2 段の pipeline + 4 edge で wizard 遷移を node network 化、 stepIndicator readout 併存";

/**
 * 54. bullet-chart = KPI actual vs target + 3 range、 slider で actual 変化 → 3 range のどこにいるか可視化。
 */
export const kpiBullet = diagram("interactive-kpi-bullet", {
  topic: "実績と目標を良 / 並 / 悪の帯で見せる",
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
  .readout.bulletChart("b", { source: "actual", targetSource: "target", max: 100, rangeBad: 40, rangeAvg: 70, viewW: 320, viewH: 40, colorActual: "#241c14", label: "Progress (bullet chart)" })
  .readout.stat("targetStat", { source: "target", label: "Target" })
  .phase("p1", {
    duration: 1800,
    title: "悪い帯を見る",
    body: "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。",
  }, (p: PhaseBuilder) => p.activate("badRange", "actualNode"))
  .phase("p2", {
    duration: 1800,
    title: "並の帯を見る",
    body: "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。",
  }, (p: PhaseBuilder) => p.activate("badRange", "avgRange", "actualNode"))
  .phase("p3", {
    duration: 1800,
    title: "良い帯と目標",
    body: "一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。",
  }, (p: PhaseBuilder) => p.activate("badRange", "avgRange", "goodRange", "actualNode", "targetNode"))
.build();
export const subtitle__kpiBullet = "KPI bullet chart を 3-lane (bad / avg / good) range 分散 + actual/target 個別 card、 bulletChart readout 併存";

/**
 * 55. number-board = 大 numeric display、 slider で revenue を score board 表示。
 */
export const revenueScoreboard = diagram("interactive-revenue-scoreboard", {
  topic: "売上の現在 / 目標 / 差分を並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 250 })
  .input.slider("rev", { min: 0, max: 999, defaultValue: 234, label: "Revenue" })
  .state("rev", { initial: 234 })
  .node("currentNode", { lane: "col1", stack: 0, kind: "card", w: 270, title: "◆ Current", subtitle: "${rev}M (slider driven)" })
  .node("targetNode", { lane: "col2", stack: 0, kind: "card", w: 200, title: "Target", subtitle: "$500M (Q3 goal)" })
  .node("gapNode", { lane: "col1", stack: 1, kind: "card", w: 320, title: "Gap", subtitle: "target - current (progress toward goal)" })
  .edge("currentNode", "targetNode", { label: "progress", tone: "info" })
  .edge("targetNode", "gapNode", { label: "delta", tone: "warning" })
  .readout.numberBoard("nb", { source: "rev", prefix: "$", suffix: "M", size: 56, color: "#241c14", caption: "vs $500M target", label: "Revenue (scoreboard)" })
  .phase("p", {
    duration: 1200,
    title: "revenue progress flow",
    body: "3 区画 (Current / Target / Gap) を 2 列 2 段に置いて revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。",
  }, (p: PhaseBuilder) => p.activate("currentNode", "targetNode", "gapNode").badge("scoreboard"))
  .build();
export const subtitle__revenueScoreboard = "revenue Q3 status を 3 区画 (Current / Target / Gap) 2 列 2 段 + 2 edge、 scoreboard display に加え target との差を可視化";

/**
 * 56. leaderboard = 6 player の score ranking を top 5 表示 (medal 色 + bar + value)。
 */
export const playerLeaderboard = diagram("interactive-player-leaderboard", {
  topic: "6 人の順位を上位 / 中位 / 下位に分ける",
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
  .node("aliceNode", { lane: "top", stack: 0, kind: "card", title: "🥇 1st Alice", subtitle: "首位" })
  .node("eveNode", { lane: "top", stack: 1, kind: "card", title: "🥈 2nd Eve", subtitle: "2 位" })
  .node("carolNode", { lane: "top", stack: 2, kind: "card", title: "🥉 3rd Carol", subtitle: "3 位" })
  .node("bobNode", { lane: "middle", stack: 0, kind: "card", title: "4th Bob", subtitle: "中位" })
  .node("frankNode", { lane: "middle", stack: 1, kind: "card", title: "5th Frank", subtitle: "表示の末尾" })
  .node("danNode", { lane: "bottom", stack: 0, kind: "card", title: "6th Dan", subtitle: "圏外" })
  .readout.leaderboard("lb", { source: "players", max: 5, color: "#2563eb", label: "Ranking (top 5 leaderboard)" })
  .phase("p1", {
    duration: 1800,
    title: "接戦の状態",
    body: "上位の点差が小さい状態。 並びが僅差で決まる。",
  }, (p: PhaseBuilder) => p.activate("aliceNode").set("players", '[["Alice",920],["Bob",915],["Carol",910],["Dan",905],["Eve",900]]'))
  .phase("p2", {
    duration: 1800,
    title: "差が開く",
    body: "首位が抜ける。 上位と下位の点差が大きくなる。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "eveNode").set("players", '[["Alice",1180],["Eve",890],["Carol",850],["Bob",780],["Frank",720]]'))
  .phase("p3", {
    duration: 1800,
    title: "順位が入れ替わる",
    body: "別の人が首位に立つ。 並びが上下ごと組み替わる。",
  }, (p: PhaseBuilder) => p.activate("aliceNode", "eveNode", "carolNode", "bobNode", "frankNode", "danNode").set("players", '[["Carol",1240],["Alice",1180],["Frank",1050],["Eve",890],["Bob",780],["Dan",680]]'))
.build();
export const subtitle__playerLeaderboard = "6 player を 3-lane (Top 3 medals / Middle 2 / Bottom 1 out of top) rank 別分散、 各 player 個別 card、 leaderboard readout 併存";

/**
 * 57. traffic-light = 3-color status、 dropdown で red/yellow/green 選択 → active dot が glow 表示。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "ビルド状態を信号機の 3 色で見せる",
})
  .lane("red", { x: 0, width: 200 })
  .lane("yellow", { x: 240, width: 200 })
  .lane("green", { x: 480, width: 200 })
  .input.dropdown("status", { options: ["red", "yellow", "green"], defaultValue: "green", label: "Build status" })
  .state("status", { initial: "green" })
  .node("redNode", { lane: "red", stack: 0, kind: "card", title: "● Red", subtitle: "ビルド失敗 · 要修正" })
  .node("yellowNode", { lane: "yellow", stack: 0, kind: "card", title: "● Yellow", subtitle: "ビルド実行中 · 待機" })
  .node("greenNode", { lane: "green", stack: 0, kind: "card", title: "● Green", subtitle: "ビルド成功 · deploy 可" })
  .node("currentCI", { lane: "green", stack: 1, kind: "card", title: "◆ Current CI", subtitle: "status: {status}" })
  .readout.trafficLight("tl", { source: "status", viewW: 70, viewH: 180, label: "Status (3-color indicator)" })
  .phase("p1", {
    duration: 1800,
    title: "赤を見る",
    body: "止まっている時に点く色。 3 色のうち 1 つ目で、状態はつまみで選ぶ。",
  }, (p: PhaseBuilder) => p.activate("redNode"))
  .phase("p2", {
    duration: 1800,
    title: "黄を見る",
    body: "走っている間の色。 選んだ状態に応じて 1 つだけが点く。",
  }, (p: PhaseBuilder) => p.activate("redNode", "yellowNode"))
  .phase("p3", {
    duration: 1800,
    title: "緑を見る",
    body: "通った時の色。 3 色で状態を読み分ける形になっている。",
  }, (p: PhaseBuilder) => p.activate("redNode", "yellowNode", "greenNode", "currentCI"))
.build();
export const subtitle__buildStatusTrafficLight = "build status 3 state (red/yellow/green) を 3-lane 分散、 各 state 個別 card + current indicator、 trafficLight readout 併存";

/**
 * 58. tag-cloud = tech skill 8 種を weight 比例 font-size で表示。
 */
export const techTagCloud = diagram("interactive-tech-tagcloud", {
  topic: "8 技術を使用量の大小で分けて見せる",
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
  .node("reactNode", { lane: "high", stack: 0, kind: "card", title: "React", subtitle: "最も大きい語" })
  .node("tsNode", { lane: "high", stack: 1, kind: "card", title: "TypeScript", subtitle: "大きい語" })
  .node("pyNode", { lane: "high", stack: 2, kind: "card", title: "Python", subtitle: "やや大きい語" })
  .node("rustNode", { lane: "mid", stack: 0, kind: "card", title: "Rust", subtitle: "中位の語" })
  .node("goNode", { lane: "mid", stack: 1, kind: "card", title: "Go", subtitle: "やや小さい語" })
  .node("svelteNode", { lane: "mid", stack: 2, kind: "card", title: "Svelte", subtitle: "小さい語" })
  .node("vueNode", { lane: "low", stack: 0, kind: "card", title: "Vue", subtitle: "より小さい語" })
  .node("denoNode", { lane: "low", stack: 1, kind: "card", title: "Deno", subtitle: "最も小さい語" })
  .readout.tagCloud("tc", { source: "tags", minSize: 12, maxSize: 32, label: "Tech cloud (font-size 比例)" })
  .phase("p1", {
    duration: 1800,
    title: "少ない語",
    body: "語が 3 つだけの状態。 大きさの差が読み取りやすい。",
  }, (p: PhaseBuilder) => p.activate("reactNode").set("tags", '[["React",30],["TypeScript",28],["Python",22]]'))
  .phase("p2", {
    duration: 1800,
    title: "語が増える",
    body: "語が 8 つに増える。 大小の幅が広がる。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "pyNode").set("tags", '[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]'))
  .phase("p3", {
    duration: 1800,
    title: "重みの幅が広がる",
    body: "大小の順はそのままで、上と下の差が開く。 文字の大きさの幅が最大まで使われる。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "pyNode", "rustNode", "goNode", "svelteNode", "vueNode", "denoNode").set("tags", '[["React",32],["TypeScript",29],["Python",24],["Rust",18],["Go",14],["Svelte",9],["Vue",6],["Deno",3]]'))
.build();
export const subtitle__techTagCloud = "8 tech skill を 3-lane (High ≥20 / Mid 10-19 / Low <10) weight 別分散、 各 skill 個別 card、 tagCloud readout 併存";

/**
 * 59. activity-feed = team activity 5 event を feed list で表示。
 */
export const teamActivityFeed = diagram("interactive-team-activity", {
  topic: "チームの動きを新しい順に 5 件並べる",
})
  .lane("col1", { x: 0, width: 350 })
  .lane("col2", { x: 390, width: 370 })
  .lane("col3", { x: 800, width: 320 })
  .arraySignal("events", [
    ["Alice", "pushed to main", "2 min ago"],
    ["Bob", "opened PR #42", "8 min ago"],
    ["Carol", "reviewed PR #40", "15 min ago"],
    ["Dan", "merged PR #38", "1 h ago"],
    ["Eve", "deployed v1.2", "3 h ago"],
  ] as unknown as (string | number)[])
  .node("e1", { lane: "col1", stack: 0, kind: "card", w: 300, title: "Alice", subtitle: "最新の出来事" })
  .node("e2", { lane: "col1", stack: 1, kind: "card", w: 290, title: "Bob", subtitle: "次に新しい出来事" })
  .node("e3", { lane: "col2", stack: 0, kind: "card", w: 320, title: "Carol", subtitle: "中ほどの出来事" })
  .node("e4", { lane: "col2", stack: 1, kind: "card", w: 270, title: "Dan", subtitle: "やや古い出来事" })
  .node("e5", { lane: "col3", stack: 0, kind: "card", w: 270, title: "Eve", subtitle: "最も古い出来事" })
  .edge("e1", "e2", { label: "→", tone: "info" })
  .edge("e2", "e3", { label: "→", tone: "info" })
  .edge("e3", "e4", { label: "→", tone: "accent" })
  .edge("e4", "e5", { label: "→", tone: "accent" })
  .readout.activityFeed("af", { source: "events", max: 5, color: "#2563eb", label: "Recent (feed list)" })
  .phase("p1", {
    duration: 1800,
    title: "1 件だけ",
    body: "出来事が 1 件だけある状態。 一覧の先頭に入る。",
  }, (p: PhaseBuilder) => p.activate("e1").set("events", '[["Alice","pushed to main","2 min ago"]]'))
  .phase("p2", {
    duration: 1800,
    title: "積み上がる",
    body: "出来事が増えて一覧が伸びる。 新しいものが上に来る。",
  }, (p: PhaseBuilder) => p.activate("e1", "e2", "e3").set("events", '[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"]]'))
  .phase("p3", {
    duration: 1800,
    title: "押し出される",
    body: "件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。",
  }, (p: PhaseBuilder) => p.activate("e1", "e2", "e3", "e4", "e5").set("events", '[["Dan","released v2.0","1 min ago"],["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Eve","merged PR #38","1 h ago"]]'))
.build();
export const subtitle__teamActivityFeed = "team activity 5 event を 3 列 2 段の timeline (recent → old) で個別 card 分散、 activityFeed readout 併存";

/**
 * 60. rating = 5 star rating を slider (0-5) で表示、 half-star 対応。
 */
export const productRating = diagram("interactive-product-rating", {
  topic: "商品評価を低 / 中 / 高の帯で見せる",
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
export const subtitle__productRating = "product rating を 3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) range 別分散 + current indicator、 rating readout 併存";

/**
 * 61. notification = alert card、 dropdown で kind (info/warn/error/success) を切替。
 */
export const alertNotification = diagram("interactive-alert-notification", {
  topic: "通知 4 種を情報 / 注意 / 異常 / 成功で分ける",
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
export const subtitle__alertNotification = "alert kind 4 種 (info/warn/error/success) を 4-lane 分散 + current indicator、 各 kind 個別 card、 notification readout 併存";

/**
 * 62. diff-counter = git commit style +N/-N、 stepper で additions / deletions 変化。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "追加行と削除行から差し引きを出す",
})
  .lane("adds", { x: 0, width: 260 })
  .lane("dels", { x: 300, width: 260 })
  .input.stepper("add", { min: 0, max: 500, step: 10, defaultValue: 120, label: "Additions" })
  .input.stepper("del", { min: 0, max: 500, step: 10, defaultValue: 45, label: "Deletions" })
  .state("add", { initial: 120 })
  .state("del", { initial: 45 })
  .node("addCard", { lane: "adds", stack: 0, kind: "card", title: "+ Additions", subtitle: "+{add} lines (green)" })
  .node("addDetail", { lane: "adds", stack: 1, kind: "card", title: "adds/del", subtitle: "add > del → net growth" })
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
export const subtitle__commitDiffCounter = "git PR diff を 2-lane (Additions +N / Deletions -N) 分散 + net delta edge、 diffCounter readout 併存";

/**
 * 63. chat-bubble = customer support conversation 5 message、 self/other 左右寄せ表示。
 */
export const supportChat = diagram("interactive-support-chat", {
  topic: "問い合わせ 5 往復を客 / 担当で分ける",
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
  .node("cust1", { lane: "customer", stack: 0, kind: "card", title: "Alice #1", subtitle: "利用者の 1 通目" })
  .node("cust2", { lane: "customer", stack: 1, kind: "card", title: "Alice #2", subtitle: "利用者の 2 通目" })
  .node("sup1", { lane: "support", stack: 0, kind: "card", title: "Support #1", subtitle: "応対側の 1 通目" })
  .node("sup2", { lane: "support", stack: 1, kind: "card", title: "Support #2", subtitle: "確認中の返答" })
  .node("sup3", { lane: "support", stack: 2, kind: "card", title: "Support #3", subtitle: "解決の返答" })
  .readout.chatBubble("cb", { source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#f0e0b8", label: "Conversation (bubbles)" })
  .phase("p1", {
    duration: 1800,
    title: "問い合わせ",
    body: "利用者からの 1 通目。 左側に吹き出しが出る。",
  }, (p: PhaseBuilder) => p.activate("cust1").set("thread", '[["Alice","Hi, I need help with my order",false]]'))
  .phase("p2", {
    duration: 1800,
    title: "やり取りが続く",
    body: "応対側が返し、利用者が答える。 左右に交互に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("cust1", "sup1", "cust2").set("thread", '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false]]'))
  .phase("p3", {
    duration: 1800,
    title: "解決する",
    body: "確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。",
  }, (p: PhaseBuilder) => p.activate("cust1", "sup1", "cust2", "sup2", "sup3").set("thread", '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false],["Support","Checking...",true],["Support","Refunded! 3-5 days.",true]]'))
.build();
export const subtitle__supportChat = "customer support 5 message を 2-lane (Customer / Support) speaker 別分散、 各 message 個別 card、 chatBubble readout 併存";

/**
 * 64. avatar = user profile avatar、 text input で name 変化 → initials + color circle 追随。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "名前からアイコン画像を組み立てる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.text("user", { defaultValue: "Alice Wonderland", placeholder: "Full name", maxLength: 40, label: "User name" })
  .state("user", { initial: "Alice Wonderland" })
  .node("inputNode", { lane: "col1", stack: 0, kind: "card", w: 270, title: "Text input", subtitle: "user = {user}" })
  .node("initialsNode", { lane: "col2", stack: 0, kind: "card", w: 320, title: "Initials", subtitle: "first 2 word head chars (Alice Wonderland → AW)" })
  .node("circleNode", { lane: "col1", stack: 1, kind: "card", w: 320, title: "Circle", subtitle: "size 56 · blue #2563eb + AW text" })
  .edge("inputNode", "initialsNode", { label: "parse", tone: "info" })
  .edge("initialsNode", "circleNode", { label: "render", tone: "success" })
  .readout.avatar("av", { source: "user", size: 56, color: "#2563eb", label: "Avatar (rendered)" })
  .phase("p", {
    duration: 1200,
    title: "avatar pipeline",
    body: "3 区画 (Input name / Initials extract / Circle render) を 2 列 2 段に置いて avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。",
  }, (p: PhaseBuilder) => p.activate("inputNode", "initialsNode", "circleNode").badge("avatar"))
  .build();
export const subtitle__userAvatar = "user avatar generation pipeline を 3 区画 (Input name / Initials extract / Circle render) 2 列 2 段 + 2 edge で pipeline network 化、 avatar readout 併存";

/**
 * 65. checklist = sprint task list 6 item、 progress% 表示。
 */
export const sprintChecklist = diagram("interactive-sprint-checklist", {
  topic: "6 タスクを完了 / 未完了で分ける",
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
  .node("t2", { lane: "done", stack: 1, kind: "card", title: "✓ Tests", subtitle: "done" })
  .node("t3", { lane: "todo", stack: 0, kind: "card", title: "Fix bug #42", subtitle: "todo (blocker)" })
  .node("t4", { lane: "todo", stack: 1, kind: "card", title: "Code review", subtitle: "todo (awaits reviewer)" })
  .node("t5", { lane: "todo", stack: 2, kind: "card", title: "Deploy", subtitle: "todo (depends on review)" })
  .node("t6", { lane: "todo", stack: 3, kind: "card", title: "Post-mortem", subtitle: "todo (last)" })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "Progress (2/6 = 33%)" })
  .phase("p1", {
    duration: 1800,
    title: "着手前",
    body: "どれも未完了の状態。 印が 1 つも付いていない。",
  }, (p: PhaseBuilder) => p.activate("t1").set("tasks", '[["Setup CI",false],["Write tests",false],["Fix bug #42",false],["Code review",false],["Deploy",false],["Retro",false]]'))
  .phase("p2", {
    duration: 1800,
    title: "半分進む",
    body: "前半が終わる。 印の付いた項目が上に集まる。",
  }, (p: PhaseBuilder) => p.activate("t1", "t2", "t3").set("tasks", '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",false],["Deploy",false],["Retro",false]]'))
  .phase("p3", {
    duration: 1800,
    title: "残り 1 件",
    body: "最後の 1 件を残して終わる。 未完了がどれか一目で分かる。",
  }, (p: PhaseBuilder) => p.activate("t1", "t2", "t3", "t4", "t5", "t6").set("tasks", '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",true],["Deploy",true],["Retro",false]]'))
.build();
export const subtitle__sprintChecklist = "sprint 6 task を 2-lane (Done ✓ / Todo) 状態別分散、 各 task 個別 card、 checklist readout 併存";

/**
 * 66. circular-gauge = engine RPM を 270° dial で表示、 slider で 0-8000 rpm 制御。
 */
export const engineTachometer = diagram("interactive-engine-tachometer", {
  topic: "回転数を通常 / 巡航 / 過回転で見せる",
})
  .lane("idle", { x: 0, width: 200 })
  .lane("cruise", { x: 240, width: 200 })
  .lane("redline", { x: 480, width: 200 })
  .input.slider("rpm", { min: 0, max: 8000, defaultValue: 3500, label: "RPM" })
  .state("rpm", { initial: 3500 })
  .node("idleNode", { lane: "idle", stack: 0, kind: "card", title: "Idle range", subtitle: "0-2000 rpm (green)" })
  .node("cruiseNode", { lane: "cruise", stack: 0, kind: "card", title: "Cruise range", subtitle: "2000-5000 rpm (yellow) · normal driving" })
  .node("redlineNode", { lane: "redline", stack: 0, kind: "card", title: "Redline", subtitle: "5000-8000 rpm (red) · caution" })
  .node("currentRpm", { lane: "cruise", stack: 1, kind: "card", title: "◆ Current", subtitle: "{rpm} rpm (default 3500 = cruise)" })
  .readout.circularGauge("g", { source: "rpm", min: 0, max: 8000, unit: "rpm", color: "#f97316", viewW: 200, viewH: 160, label: "Tachometer (270° dial)" })
  .phase("p", {
    duration: 1200,
    title: "rpm range map",
    body: "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("idleNode", "cruiseNode", "redlineNode", "currentRpm").badge("tachometer"))
  .build();
export const subtitle__engineTachometer = "engine RPM を 3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) 領域別分散 + current rpm indicator、 circularGauge readout 併存";

/**
 * 67. price-tag = e-commerce 商品価格、 stepper で newPrice 変化 → discount % 自動計算。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "旧価格 / 新価格 / 割引率を並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.stepper("newPrice", { min: 0, max: 200, step: 5, defaultValue: 65, label: "New price" })
  .state("newPrice", { initial: 65 })
  .state("oldPrice", { initial: 100 })
  .node("oldNode", { lane: "col1", stack: 0, kind: "card", w: 310, title: "Old price", subtitle: "${oldPrice} (strikethrough)" })
  .node("newNode", { lane: "col2", stack: 0, kind: "card", w: 320, title: "New price", subtitle: "${newPrice} (stepper driven)" })
  .node("discountNode", { lane: "col1", stack: 1, kind: "card", w: 320, title: "Discount %", subtitle: "(oldPrice - newPrice) / oldPrice · red badge" })
  .edge("oldNode", "newNode", { label: "sale", tone: "warning" })
  .edge("newNode", "discountNode", { label: "%", tone: "error" })
  .readout.priceTag("pt", { oldSource: "oldPrice", newSource: "newPrice", currency: "$", colorNew: "#241c14", colorOld: "#a08870", colorDiscount: "#ef4444", label: "Price (composite tag)" })
  .phase("p", {
    duration: 1200,
    title: "price flow",
    body: "3 区画 (Old / New / Discount) を 2 列 2 段に置いて price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。",
  }, (p: PhaseBuilder) => p.activate("oldNode", "newNode", "discountNode").badge("price"))
  .build();
export const subtitle__productPriceTag = "e-commerce price tag を 3 区画 (Old price / New price / Discount %) 2 列 2 段 + 2 edge、 discount 計算経路可視化、 priceTag readout 併存";

/**
 * 68. spinner = deploy status、 dropdown で running/done/error 切替 → icon 変化。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "配備状態を実行中 / 完了 / 失敗で見せる",
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
  .node("currentState", { lane: "running", stack: 1, kind: "card", title: "◆ Deploy", subtitle: "status: {status} · msg: {msg}" })
  .readout.spinner("sp", { source: "status", textSource: "msg", color: "#2563eb", label: "Deploy (spinner + text)" })
  .phase("p",  {
    duration: 1200,
    title: "deploy state split",
    body: "3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("runningNode", "doneNode", "errorNode", "currentState").badge("loading"))
  .build();
export const subtitle__deploySpinner = "deploy 3 state (running/done/error) を 3-lane 分散 + current indicator、 spinner readout 併存";

/**
 * 69. grade = exam score を slider で操作 → A/B/C/D/F letter grade + color 追随。
 */
export const examGrade = diagram("interactive-exam-grade", {
  topic: "成績を A から F の 5 段階で見せる",
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
export const subtitle__examGrade = "exam grade 5 letter (A/B/C/D/F) を 5-lane band 分散 + current indicator (default=B lane)、 grade readout 併存";

/**
 * 70. stopwatch = ms 数値 (stepper で秒指定) を MM:SS.ms display で表示。
 */
export const timerStopwatch = diagram("interactive-timer-stopwatch", {
  topic: "秒数と実行状態から時計表示を作る",
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
  .node("runNode", { lane: "toggle", stack: 0, kind: "card", title: "Running", subtitle: "running = {running}" })
  .node("displayNode", { lane: "display", stack: 0, kind: "card", title: "MM:SS.ms", subtitle: "elapsed = sec × 1000 = {elapsed}ms" })
  .edge("secNode", "displayNode", { label: "× 1000", tone: "info" })
  .edge("runNode", "displayNode", { label: "color", tone: "success" })
  .readout.stopwatch("sw", { source: "elapsed", runningSource: "running", size: 40, color: "#241c14", label: "Timer (MM:SS.ms)" })
  .phase("p", {
    duration: 1200,
    title: "timer signal flow",
    body: "3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。",
  }, (p: PhaseBuilder) => p.activate("secNode", "runNode", "displayNode").badge("timer"))
  .build();
export const subtitle__timerStopwatch = "stopwatch control を 3-lane (Seconds input / Running toggle / MM:SS.ms display) + 2 edge、 stepper + toggle → display fan-out、 stopwatch readout 併存";

/**
 * 71. confidence-meter = ML classification confidence を slider で操作 → 3 color band 追随。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "推論の確信度を低 / 中 / 高で見せる",
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
export const subtitle__mlConfidenceMeter = "ML confidence を 3-lane (Low <40 / Mid 40-74 / High ≥75) band 別分散 + current indicator (default=high)、 confidenceMeter readout 併存";

/**
 * 72. reaction-bar = social post reactions、 4 emoji + count で pill 表示。
 */
export const postReactions = diagram("interactive-post-reactions", {
  topic: "投稿への 4 種の反応を並べる",
})
  .lane("thumb", { x: 0, width: 360 })
  .lane("heart", { x: 380, width: 270 })
  .lane("laugh", { x: 670, width: 270 })
  .lane("party", { x: 960, width: 270 })
  .arraySignal("reactions", [
    ["👍", 24],
    ["❤️", 12],
    ["😂", 8],
    ["🎉", 5],
  ] as unknown as (string | number)[])
  .node("thumbNode", { lane: "thumb", stack: 0, kind: "card", w: 310, title: "👍 Thumbs up", subtitle: "最も多く付く反応" })
  .node("heartNode", { lane: "heart", stack: 0, kind: "card", w: 220, title: "❤️ Heart", subtitle: "次に多い反応" })
  .node("laughNode", { lane: "laugh", stack: 0, kind: "card", w: 220, title: "😂 Laugh", subtitle: "中ほどの反応" })
  .node("partyNode", { lane: "party", stack: 0, kind: "card", w: 220, title: "🎉 Party", subtitle: "最も少ない反応" })
  .readout.reactionBar("rb", { source: "reactions", color: "#2563eb", label: "Reactions (pill list)" })
  .phase("p1", {
    duration: 1800,
    title: "投稿した直後",
    body: "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。",
  }, (p: PhaseBuilder) => p.activate("thumbNode").set("reactions", '[["👍",5],["❤️",3],["😂",2],["🎉",1]]'))
  .phase("p2", {
    duration: 1800,
    title: "広まる",
    body: "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。",
  }, (p: PhaseBuilder) => p.activate("thumbNode", "heartNode").set("reactions", '[["👍",14],["❤️",7],["😂",4],["🎉",2]]'))
  .phase("p3", {
    duration: 1800,
    title: "落ち着く",
    body: "伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。",
  }, (p: PhaseBuilder) => p.activate("thumbNode", "heartNode", "laughNode", "partyNode").set("reactions", '[["👍",24],["❤️",12],["😂",8],["🎉",5]]'))
  .build();
export const subtitle__postReactions = "social post 4 reaction を 4-lane emoji 別分散、 各 reaction 個別 card、 reactionBar readout 併存";

/**
 * 73. pill-group = tech skill 色付き pills、 [[label, colorHex], ...] で per-pill color。
 */
export const techPills = diagram("interactive-tech-pills", {
  topic: "技術 5 つを画面 / 基盤 / 構築で分ける",
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
  .node("reactNode", { lane: "frontend", stack: 0, kind: "card", title: "React", subtitle: "画面を組み立てる部品" })
  .node("tsNode", { lane: "frontend", stack: 1, kind: "card", title: "TypeScript", subtitle: "型の付いた書き方" })
  .node("rustNode", { lane: "systems", stack: 0, kind: "card", title: "Rust", subtitle: "土台を書く言語" })
  .node("viteNode", { lane: "build", stack: 0, kind: "card", title: "Vite", subtitle: "開発中の配信役" })
  .node("bunNode", { lane: "build", stack: 1, kind: "card", title: "Bun", subtitle: "実行の土台" })
  .readout.pillGroup("pg", { source: "stack", label: "Stack (pill group)" })
  .phase("p1", {
    duration: 1800,
    title: "画面から始める",
    body: "画面周りの 2 つだけを使う。 札はその 2 色しか出ず、横の並びが短い。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode").set("stack", '[["React","#61dafb"],["TypeScript","#3178c6"]]'))
  .phase("p2", {
    duration: 1800,
    title: "土台を足す",
    body: "土台を書く言語が加わる。 札が 1 つ増え、系統の違う色が並びに混じる。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "rustNode").set("stack", '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"]]'))
  .phase("p3", {
    duration: 1800,
    title: "組み立てまで揃う",
    body: "組み立てと実行の土台が揃う。 札は 5 枚になり、色が札ごとに違うことが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("reactNode", "tsNode", "rustNode", "viteNode", "bunNode").set("stack", '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]'))
  .build();
export const subtitle__techPills = "tech stack 5 pill を 3-lane (Frontend / Systems / Build) category 別分散、 各 tool 個別 card、 pillGroup readout 併存";

/**
 * 74. fuel-bar = device battery、 slider で 0-100% 変化 → 10 segment + 3 color band 追随。
 */
export const deviceBattery = diagram("interactive-device-battery", {
  topic: "電池残量を低 / 中 / 高で見せる",
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
export const subtitle__deviceBattery = "battery level を 3-lane (Low <20 / Mid 20-60 / High ≥60) band 別分散 + current indicator (default=high)、 fuelBar readout 併存";

/**
 * 75. metrics-grid = SaaS dashboard の 4 KPI を 2×2 grid 表示。
 */
export const dashboardMetricsGrid = diagram("interactive-metrics-grid", {
  topic: "SaaS の 4 指標を並べて見せる",
})
  .lane("users", { x: 0, width: 270 })
  .lane("revenue", { x: 290, width: 250 })
  .lane("uptime", { x: 560, width: 230 })
  .lane("errors", { x: 810, width: 230 })
  .arraySignal("kpis", [
    ["Users", "12.4k"],
    ["Revenue", "$45k"],
    ["Uptime", "99.9", "%"],
    ["Errors", 12],
  ] as unknown as (string | number)[])
  .node("usersNode", { lane: "users", stack: 0, kind: "card", w: 220, title: "Users", subtitle: "月あたりの利用者" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", w: 200, title: "Revenue", subtitle: "月ごとの売上" })
  .node("uptimeNode", { lane: "uptime", stack: 0, kind: "card", w: 180, title: "Uptime", subtitle: "動き続けた割合" })
  .node("errorsNode", { lane: "errors", stack: 0, kind: "card", w: 180, title: "Errors", subtitle: "異常の件数 (直近)" })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "Metrics (2×2 grid)" })
  .phase("p1", {
    duration: 1800,
    title: "立ち上げ",
    body: "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。",
  }, (p: PhaseBuilder) => p.activate("usersNode", "errorsNode").set("kpis", '[["Users","3.1k"],["Revenue","$9k"],["Uptime","98.2","%"],["Errors",47]]'))
  .phase("p2", {
    duration: 1800,
    title: "伸びる",
    body: "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。",
  }, (p: PhaseBuilder) => p.activate("usersNode", "revenueNode", "errorsNode").set("kpis", '[["Users","7.8k"],["Revenue","$26k"],["Uptime","99.4","%"],["Errors",23]]'))
  .phase("p3", {
    duration: 1800,
    title: "落ち着く",
    body: "4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("usersNode", "revenueNode", "uptimeNode", "errorsNode").set("kpis", '[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]'))
  .build();
export const subtitle__dashboardMetricsGrid = "SaaS 4 KPI を 4-lane (Users / Revenue / Uptime / Errors) 分散、 各 KPI 個別 card、 metricsGrid readout 併存";

/**
 * 76. thermometer = 室温 24°C を slider で操作 → 縦 bar + 球部 で温度表示。
 */
export const roomThermometer = diagram("interactive-room-thermometer", {
  topic: "室温を寒い / 快適 / 暑いで分ける",
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
export const subtitle__roomThermometer = "室温を 3-lane (Cold <15°C / Comfort 15-25°C / Hot ≥25°C) 温度帯別分散 + current indicator、 thermometer readout 併存";

/**
 * 77. icon-tile = 3 KPI を emoji icon + label + value tile で表示。
 */
export const kpiIconTile = diagram("interactive-kpi-icon-tile", {
  topic: "3 つの指標をアイコン付きのタイルで並べる",
})
  .lane("growth", { x: 0, width: 220 })
  .lane("revenue", { x: 260, width: 220 })
  .lane("goals", { x: 520, width: 220 })
  .arraySignal("kpis", [
    ["📈", "Growth", "+15%"],
    ["💰", "Revenue", "$50k"],
    ["🎯", "Goals", "8/10"],
  ] as unknown as (string | number)[])
  .node("growthNode", { lane: "growth", stack: 0, kind: "card", title: "📈 Growth", subtitle: "前の月からの伸び" })
  .node("revenueNode", { lane: "revenue", stack: 0, kind: "card", title: "💰 Revenue", subtitle: "月ごとの売上" })
  .node("goalsNode", { lane: "goals", stack: 0, kind: "card", title: "🎯 Goals", subtitle: "達成した目標の数" })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "KPIs (icon tile)" })
  .phase("p1", {
    duration: 1800,
    title: "期の始め",
    body: "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。",
  }, (p: PhaseBuilder) => p.activate("growthNode").set("kpis", '[["📈","Growth","+2%"],["💰","Revenue","$18k"],["🎯","Goals","2/10"]]'))
  .phase("p2", {
    duration: 1800,
    title: "期の半ば",
    body: "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("growthNode", "revenueNode").set("kpis", '[["📈","Growth","+9%"],["💰","Revenue","$33k"],["🎯","Goals","5/10"]]'))
  .phase("p3", {
    duration: 1800,
    title: "期の終わり",
    body: "目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。",
  }, (p: PhaseBuilder) => p.activate("growthNode", "revenueNode", "goalsNode").set("kpis", '[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]'))
  .build();
export const subtitle__kpiIconTile = "3 KPI (Growth / Revenue / Goals) を 3-lane 個別 tile 分散、 iconTile readout 併存";

/**
 * 78. token-list = crypto wallet の 4 token を icon + name + amount + delta% で表示。
 */
export const cryptoWallet = diagram("interactive-crypto-wallet", {
  topic: "保有 4 銘柄を値上がり / 値下がりで分ける",
})
  .lane("gainers", { x: 0, width: 220 })
  .lane("losers", { x: 300, width: 220 })
  .arraySignal("tokens", [
    ["₿", "BTC", "0.42", 5.3],
    ["Ξ", "ETH", "12.5", -2.8],
    ["◎", "SOL", "245", 8.1],
    ["Ð", "DOGE", "8500", -1.4],
  ] as unknown as (string | number)[])
  .node("btc", { lane: "gainers", stack: 0, kind: "card", title: "₿ BTC", subtitle: "上げ幅が中くらい" })
  .node("sol", { lane: "gainers", stack: 1, kind: "card", title: "◎ SOL", subtitle: "上げ幅が最も大きい" })
  .node("eth", { lane: "losers", stack: 0, kind: "card", title: "Ξ ETH", subtitle: "下げ幅が大きい" })
  .node("doge", { lane: "losers", stack: 1, kind: "card", title: "Ð DOGE", subtitle: "下げ幅が小さい" })
  .readout.tokenList("tl", { source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "Portfolio (aggregate)" })
  .phase("p1", {
    duration: 1800,
    title: "朝の値動き",
    body: "値動きがどれも小さい。 上げ下げの色は付くが、幅の差はまだ読み取りにくい。",
  }, (p: PhaseBuilder) => p.activate("btc", "eth").set("tokens", '[["₿","BTC","0.42",0.6],["Ξ","ETH","12.5",-0.4],["◎","SOL","245",1.1],["Ð","DOGE","8500",-0.3]]'))
  .phase("p2", {
    duration: 1800,
    title: "昼の値動き",
    body: "値動きが広がる。 保有量は変わらず、増減の割合だけが動くことが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("btc", "sol", "eth").set("tokens", '[["₿","BTC","0.42",2.7],["Ξ","ETH","12.5",-1.5],["◎","SOL","245",4.2],["Ð","DOGE","8500",-0.8]]'))
  .phase("p3", {
    duration: 1800,
    title: "引けの値動き",
    body: "上げ 2 銘柄と下げ 2 銘柄の差が最も開く。 緑と赤の対比で組の性格が分かれる。",
  }, (p: PhaseBuilder) => p.activate("btc", "sol", "eth", "doge").set("tokens", '[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]'))
  .build();
export const subtitle__cryptoWallet = "crypto wallet 4 token を 2-lane (Gainers +% / Losers -%) に分散、 各 token を個別 card、 tokenList readout 併存";

/**
 * 79. map-pin = world map (地図座標) 上の 5 city を pin 表示。
 */
export const worldMapPins = diagram("interactive-world-map", {
  topic: "5 都市をアジア / 欧米に分けて見せる",
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
  .node("tokyo", { lane: "apac", stack: 0, kind: "card", title: "Tokyo", subtitle: "最初の拠点 (右寄り・やや下)" })
  .node("sydney", { lane: "apac", stack: 1, kind: "card", title: "Sydney", subtitle: "最も下に出る点" })
  .node("nyc", { lane: "amea", stack: 0, kind: "card", title: "NYC", subtitle: "最も左に出る点" })
  .node("paris", { lane: "amea", stack: 1, kind: "card", title: "Paris", subtitle: "最も上に出る点" })
  .node("rio", { lane: "amea", stack: 2, kind: "card", title: "Rio", subtitle: "左下に出る点" })
  .readout.mapPin("mp", { source: "cities", xMin: 0, xMax: 120, yMin: 0, yMax: 80, viewW: 300, viewH: 200, color: "#2563eb", label: "World map (2D coord)" })
  .phase("p1", {
    duration: 1800,
    title: "拠点は 1 つ",
    body: "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("tokyo").set("cities", '[["Tokyo",100,60]]'))
  .phase("p2", {
    duration: 1800,
    title: "西へ広がる",
    body: "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。",
  }, (p: PhaseBuilder) => p.activate("tokyo", "nyc", "paris").set("cities", '[["Tokyo",100,60],["NYC",30,40],["Paris",60,30]]'))
  .phase("p3", {
    duration: 1800,
    title: "南半球まで",
    body: "下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。",
  }, (p: PhaseBuilder) => p.activate("tokyo", "sydney", "nyc", "paris", "rio").set("cities", '[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]'))
  .build();
export const subtitle__worldMapPins = "world map 5 city を 2-lane (Asia-Pacific / America-Europe) に分散、 各 city 個別 node + 座標表記、 mapPin readout 併存";

/**
 * 80. priority-badge = issue priority、 dropdown で high/med/low 切替 → badge + text 追随。
 */
export const issuePriorityBadge = diagram("interactive-issue-priority", {
  topic: "課題の優先度を高 / 中 / 低で見せる",
})
  .lane("high", { x: 0, width: 200 })
  .lane("med", { x: 240, width: 200 })
  .lane("low", { x: 480, width: 200 })
  .input.dropdown("prio", { options: ["high", "med", "low"], defaultValue: "high", label: "Priority" })
  .input.text("desc", { defaultValue: "Fix crash on startup", placeholder: "Issue description", maxLength: 60, label: "Description" })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "Fix crash on startup" })
  .node("highNode", { lane: "high", stack: 0, kind: "card", title: "▲ High", subtitle: "red · crash / regression" })
  .node("medNode", { lane: "med", stack: 0, kind: "card", title: "● Med", subtitle: "yellow · normal bug" })
  .node("lowNode", { lane: "low", stack: 0, kind: "card", title: "▼ Low", subtitle: "gray · nice-to-have" })
  .node("currentIssue", { lane: "high", stack: 1, kind: "card", title: "◆ Current", subtitle: "prio: {prio} · {desc}" })
  .readout.priorityBadge("pb", { source: "prio", textSource: "desc", label: "Priority (badge + icon + text)" })
  .phase("p", {
    duration: 1200,
    title: "priority split",
    body: "3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("highNode", "medNode", "lowNode", "currentIssue").badge("issue"))
  .build();
export const subtitle__issuePriorityBadge = "issue priority を 3-lane (High ▲ / Med ● / Low ▼) 分散、 現在選択 priority を currentIssue node で明示、 priorityBadge readout 併存";

/**
 * 81. podium = tournament の 1st/2nd/3rd 表彰台。
 */
export const tournamentPodium = diagram("interactive-tournament-podium", {
  topic: "表彰台を中央が 1 位になる並びで見せる",
})
  .lane("silver", { x: 0, width: 200 })
  .lane("gold", { x: 220, width: 220 })
  .lane("bronze", { x: 460, width: 200 })
  .arraySignal("winners", [
    ["Alice", "1200 pts"],
    ["Bob", "1050 pts"],
    ["Carol", "980 pts"],
  ] as unknown as (string | number)[])
  .node("silverNode", { lane: "silver", stack: 0, kind: "card", title: "🥈 2nd Bob", subtitle: "銀 · 中央のすぐ左" })
  .node("goldNode", { lane: "gold", stack: 0, kind: "card", title: "🥇 1st Alice", subtitle: "金 · 中央で最も高い" })
  .node("bronzeNode", { lane: "bronze", stack: 0, kind: "card", title: "🥉 3rd Carol", subtitle: "銅 · 中央のすぐ右" })
  .readout.podium("pod", { source: "winners", viewW: 280, viewH: 180, label: "Podium (3 縦 bar 表彰台)" })
  .phase("p1", {
    duration: 1800,
    title: "予選の点",
    body: "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。",
  }, (p: PhaseBuilder) => p.activate("goldNode").set("winners", '[["Alice","400 pts"],["Bob","380 pts"],["Carol","350 pts"]]'))
  .phase("p2", {
    duration: 1800,
    title: "準決勝",
    body: "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。",
  }, (p: PhaseBuilder) => p.activate("goldNode", "silverNode").set("winners", '[["Alice","800 pts"],["Bob","700 pts"],["Carol","640 pts"]]'))
  .phase("p3", {
    duration: 1800,
    title: "決勝の点",
    body: "最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。",
  }, (p: PhaseBuilder) => p.activate("goldNode", "silverNode", "bronzeNode").set("winners", '[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]'))
  .build();
export const subtitle__tournamentPodium = "tournament 1st/2nd/3rd を 3-lane (Silver/Gold/Bronze、 中央=Gold の podium 配列) 分散、 各 winner 個別 card、 podium readout 併存";

/**
 * 82. poll-bar = feature poll、 4 option の投票 % 表示、 winner に ★ 装飾。
 */
export const featurePoll = diagram("interactive-feature-poll", {
  topic: "投票結果を 1 位とその他に分ける",
})
  .lane("winner", { x: 0, width: 220 })
  .lane("runners", { x: 300, width: 220 })
  .arraySignal("options", [
    ["Dark mode", 42],
    ["Faster search", 28],
    ["Better API", 18],
    ["Nicer UI", 12],
  ] as unknown as (string | number)[])
  .node("dark", { lane: "winner", stack: 0, kind: "card", title: "★ Dark mode", subtitle: "票が最も多い案" })
  .node("search", { lane: "runners", stack: 0, kind: "card", title: "Search", subtitle: "次に多い案" })
  .node("api", { lane: "runners", stack: 1, kind: "card", title: "Better API", subtitle: "中ほどの案" })
  .node("ui", { lane: "runners", stack: 2, kind: "card", title: "Nicer UI", subtitle: "最も少ない案" })
  .readout.pollBar("pb", { source: "options", color: "#a08870", colorWinner: "#2563eb", label: "Results (aggregate)" })
  .phase("p1", {
    duration: 1800,
    title: "票が割れる",
    body: "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。",
  }, (p: PhaseBuilder) => p.activate("dark").set("options", '[["Dark mode",7],["Faster search",6],["Better API",5],["Nicer UI",4]]'))
  .phase("p2", {
    duration: 1800,
    title: "1 案に集まる",
    body: "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。",
  }, (p: PhaseBuilder) => p.activate("dark", "search").set("options", '[["Dark mode",40],["Faster search",13],["Better API",8],["Nicer UI",5]]'))
  .phase("p3", {
    duration: 1800,
    title: "締め切り",
    body: "他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。",
  }, (p: PhaseBuilder) => p.activate("dark", "search", "api", "ui").set("options", '[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]'))
  .build();
export const subtitle__featurePoll = "feature poll 4 option を 2-lane (Winner / Runners-up) に分散、 各 option 個別 card、 pollBar readout 併存";

/**
 * 83. user-stack = code review reviewer 7 人 (max 5 表示 + overflow +2)。
 */
export const reviewerStack = diagram("interactive-reviewer-stack", {
  topic: "レビュアー 7 人を 5 人表示と残りで見せる",
})
  .lane("displayed", { x: 0, width: 340 })
  .lane("overflow", { x: 380, width: 200 })
  .arraySignal("reviewers", ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"])
  .node("r1", { lane: "displayed", stack: 0, kind: "card", title: "Alice", subtitle: "頭文字 A · はじめから居る" })
  .node("r2", { lane: "displayed", stack: 1, kind: "card", title: "Bob Smith", subtitle: "頭文字 BS · はじめから居る" })
  .node("r3", { lane: "displayed", stack: 2, kind: "card", title: "Carol", subtitle: "頭文字 C · はじめから居る" })
  .node("r4", { lane: "displayed", stack: 3, kind: "card", title: "Dan Kim", subtitle: "頭文字 DK · 途中で加わる" })
  .node("r5", { lane: "displayed", stack: 4, kind: "card", title: "Eve", subtitle: "頭文字 E · 上限ちょうど" })
  .node("r6", { lane: "overflow", stack: 0, kind: "card", title: "Frank Wu", subtitle: "頭文字 FW · 上限を超える" })
  .node("r7", { lane: "overflow", stack: 1, kind: "card", title: "Grace Lee", subtitle: "頭文字 GL · 上限を超える" })
  .readout.userStack("us", { source: "reviewers", max: 5, size: 36, label: "Reviewers (stacked avatars)" })
  .phase("p1", {
    duration: 1800,
    title: "依頼した直後",
    body: "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3").set("reviewers", '["Alice","Bob Smith","Carol"]'))
  .phase("p2", {
    duration: 1800,
    title: "上限ちょうど",
    body: "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "r4", "r5").set("reviewers", '["Alice","Bob Smith","Carol","Dan Kim","Eve"]'))
  .phase("p3", {
    duration: 1800,
    title: "上限を超える",
    body: "上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。",
  }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "r4", "r5", "r6", "r7").set("reviewers", '["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]'))
  .build();
export const subtitle__reviewerStack = "code review reviewer 7 人 を 2-lane (Displayed 5 / Overflow 2) 分散、 各 reviewer 個別 card、 userStack readout 併存";

/**
 * 84. commit-list = recent git commits を 5 rows 表示。
 */
export const gitCommitList = diagram("interactive-git-commits", {
  topic: "5 つのコミットを種別ごとに並べる",
})
  .lane("col1", { x: 0, width: 350 })
  .lane("col2", { x: 390, width: 360 })
  .lane("col3", { x: 790, width: 350 })
  .arraySignal("commits", [
    ["a1b2c3d", "feat: add sankey primitive", "Alice"],
    ["e5f6g7h", "fix: circular gauge angle bug", "Bob"],
    ["i9j0k1l", "docs: update SKILL.md", "Carol"],
    ["m3n4o5p", "refactor: extract widget dispatcher", "Dan"],
    ["q7r8s9t", "test: add builder chain coverage", "Eve"],
  ] as unknown as (string | number)[])
  .node("featNode", { lane: "col1", stack: 0, kind: "card", w: 280, title: "feat", subtitle: "機能を足す (Alice)" })
  .node("fixNode", { lane: "col2", stack: 0, kind: "card", w: 310, title: "fix", subtitle: "不具合を直す (Bob)" })
  .node("docsNode", { lane: "col3", stack: 0, kind: "card", w: 300, title: "docs", subtitle: "説明を書く (Carol)" })
  .node("refactorNode", { lane: "col1", stack: 1, kind: "card", w: 300, title: "refactor", subtitle: "構造を整える (Dan)" })
  .node("testNode", { lane: "col2", stack: 1, kind: "card", w: 270, title: "test", subtitle: "検査を足す (Eve)" })
  .readout.commitList("cl", { source: "commits", max: 5, color: "#2563eb", label: "History (git log)" })
  .phase("p1", {
    duration: 1800,
    title: "1 件目",
    body: "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。",
  }, (p: PhaseBuilder) => p.activate("featNode").set("commits", '[["a1b2c3d","feat: add sankey primitive","Alice"]]'))
  .phase("p2", {
    duration: 1800,
    title: "積み上がる",
    body: "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("featNode", "fixNode", "docsNode").set("commits", '[["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]'))
  .phase("p3", {
    duration: 1800,
    title: "表示の上限",
    body: "表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。",
  }, (p: PhaseBuilder) => p.activate("featNode", "fixNode", "docsNode", "refactorNode", "testNode").set("commits", '[["q7r8s9t","test: add builder chain coverage","Eve"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]'))
  .build();
export const subtitle__gitCommitList = "5 git commit を 5 区画 (feat / fix / docs / refactor / test) 3 列 2 段で commit type 別分散、 各 commit 個別 card、 commitList readout 併存";

/**
 * 85. media-player = audio player、 slider で current time、 toggle で play/pause。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "再生位置と再生状態から時間表示を作る",
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
export const subtitle__audioPlayer = "audio player を 3-lane (Current time / Play toggle / Duration) + 2 edge、 signal 制御と mediaPlayer readout の bind 関係可視化";

/**
 * 86. event-log = server monitoring log、 4 severity (info/warn/error/debug) 表示。
 */
export const serverEventLog = diagram("interactive-server-event-log", {
  topic: "サーバのログ 5 件を重要度で分ける",
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
  .node("info1", { lane: "info", stack: 0, kind: "card", title: "ℹ 起動", subtitle: "待ち受けを始めた知らせ" })
  .node("info2", { lane: "info", stack: 1, kind: "card", title: "ℹ 復帰", subtitle: "つなぎ直しに成功した知らせ" })
  .node("debug1", { lane: "debug", stack: 0, kind: "card", title: "· 設定", subtitle: "設定を読んだ記録" })
  .node("warn1", { lane: "warn", stack: 0, kind: "card", title: "⚠ 負荷", subtitle: "計算資源の使い過ぎ" })
  .node("error1", { lane: "error", stack: 0, kind: "card", title: "✕ 切断", subtitle: "つなぎ先が応じない" })
  .readout.eventLog("el", { source: "events", max: 10, label: "Events (timeline)" })
  .phase("p1", {
    duration: 1800,
    title: "平常の記録",
    body: "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("info1", "debug1").set("events", '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"]]'))
  .phase("p2", {
    duration: 1800,
    title: "異常が出る",
    body: "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。",
  }, (p: PhaseBuilder) => p.activate("info1", "debug1", "warn1", "error1").set("events", '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"]]'))
  .phase("p3", {
    duration: 1800,
    title: "復帰する",
    body: "最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。",
  }, (p: PhaseBuilder) => p.activate("info1", "info2", "debug1", "warn1", "error1").set("events", '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]'))
  .build();
export const subtitle__serverEventLog = "server monitoring event log 5 event を 4-lane (info / debug / warn / error) severity 別に分散、 eventLog readout 併存";

/**
 * 87. search-result = 5 search hit を title + snippet + url で表示。
 */
export const searchResults = diagram("interactive-search-results", {
  topic: "検索結果を文書 / ツールに分ける",
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
  .node("tsNode", { lane: "docs", stack: 1, kind: "card", title: "TS Handbook", subtitle: "typescriptlang.org/docs" })
  .node("reactNode", { lane: "docs", stack: 2, kind: "card", title: "React docs", subtitle: "react.dev" })
  .node("viteNode", { lane: "docs", stack: 3, kind: "card", title: "Vite guide", subtitle: "vitejs.dev" })
  .node("rustNode", { lane: "tools", stack: 0, kind: "card", title: "Rust", subtitle: "play.rust-lang.org (interactive)" })
  .readout.searchResult("sr", { source: "hits", max: 5, color: "#2563eb", label: "Results (link + snippet + url)" })
  .phase("p1", {
    duration: 1800,
    title: "広い語で引く",
    body: "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。",
  }, (p: PhaseBuilder) => p.activate("mdnNode", "tsNode", "reactNode", "viteNode", "rustNode").set("hits", '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]'))
  .phase("p2", {
    duration: 1800,
    title: "語を足す",
    body: "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("mdnNode", "tsNode", "reactNode").set("hits", '[["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"]]'))
  .phase("p3", {
    duration: 1800,
    title: "絞り切る",
    body: "当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。",
  }, (p: PhaseBuilder) => p.activate("rustNode").set("hits", '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"]]'))
  .build();
export const subtitle__searchResults = "search hit 5 を 2-lane (Docs 4 / Interactive tool 1) 分散、 各 hit 個別 card、 searchResult readout 併存";

/**
 * 88. roadmap = 2026 year quarterly plan Q1-Q4。
 */
export const yearRoadmap = diagram("interactive-year-roadmap", {
  topic: "年間の計画を四半期ごとに並べる",
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
  .node("q1Item1", { lane: "q1", stack: 1, kind: "card", title: "Design", subtitle: "foundation" })
  .node("q1Item2", { lane: "q1", stack: 2, kind: "card", title: "MVP feature", subtitle: "prototype" })
  .node("q2Head", { lane: "q2", stack: 0, kind: "card", title: "Q2 (Apr-Jun)", subtitle: "Beta + growth" })
  .node("q2Item1", { lane: "q2", stack: 1, kind: "card", title: "Beta launch", subtitle: "public beta" })
  .node("q2Item2", { lane: "q2", stack: 2, kind: "card", title: "Feature B", subtitle: "beta scope" })
  .node("q3Head", { lane: "q3", stack: 0, kind: "card", title: "Q3 (Jul-Sep)", subtitle: "Scale + enterprise" })
  .node("q3Item1", { lane: "q3", stack: 1, kind: "card", title: "Scale infra", subtitle: "capacity" })
  .node("q3Item2", { lane: "q3", stack: 2, kind: "card", title: "Enterprise", subtitle: "企業向けの売上" })
  .node("q4Head", { lane: "q4", stack: 0, kind: "card", title: "Q4 (Oct-Dec)", subtitle: "GA + funding" })
  .node("q4Item1", { lane: "q4", stack: 1, kind: "card", title: "Public GA", subtitle: "general available" })
  .node("q4Item2", { lane: "q4", stack: 2, kind: "card", title: "Series A", subtitle: "growth capital" })
  .edge("q1Head", "q2Head", { label: "handover", tone: "info" })
  .edge("q2Head", "q3Head", { label: "scale", tone: "accent" })
  .edge("q3Head", "q4Head", { label: "GA", tone: "success" })
  .readout.roadmap("rm", { source: "plan", viewW: 400, viewH: 200, label: "Roadmap (4 column list)" })
  .phase("p1", {
    duration: 1800,
    title: "手前だけ決まる",
    body: "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。",
  }, (p: PhaseBuilder) => p.activate("q1Head", "q1Item1", "q1Item2").set("plan", '[["Q1",["Design system","MVP feature A"]],["Q2",[]],["Q3",[]],["Q4",[]]]'))
  .phase("p2", {
    duration: 1800,
    title: "半年先まで",
    body: "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。",
  }, (p: PhaseBuilder) => p.activate("q1Head", "q2Head", "q2Item1", "q2Item2").set("plan", '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",[]],["Q4",[]]]'))
  .phase("p3", {
    duration: 1800,
    title: "年内が揃う",
    body: "4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。",
  }, (p: PhaseBuilder) => p.activate("q1Head", "q2Head", "q3Head", "q4Head").set("plan", '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]'))
  .build();
export const subtitle__yearRoadmap = "2026 yearly roadmap を 4-lane (Q1-Q4) 分散、 各 quarter items を stack 分散、 quarterly 遷移 3 edge、 roadmap readout 併存";

/**
 * 89. weather-forecast = 5-day weather (Mon-Fri) with icon + high/low temp。
 */
export const weekWeather = diagram("interactive-week-weather", {
  topic: "5 日間の天気を晴 / 曇雨 / 雷で分ける",
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
  .node("monNode", { lane: "sunny", stack: 0, kind: "card", title: "☀ Mon", subtitle: "晴れ · 週の始まり" })
  .node("friNode", { lane: "sunny", stack: 1, kind: "card", title: "☀ Fri", subtitle: "晴れ · 週で最も暖かい" })
  .node("tueNode", { lane: "cloudy", stack: 0, kind: "card", title: "☁ Tue", subtitle: "曇り · 下り坂の入口" })
  .node("wedNode", { lane: "cloudy", stack: 1, kind: "card", title: "☂ Wed", subtitle: "雨 · 気温が下がる" })
  .node("thuNode", { lane: "thunder", stack: 0, kind: "card", title: "⚡ Thu", subtitle: "雷 · 週で最も寒い" })
  .readout.weatherForecast("wf", { source: "forecast", label: "Week (5-day forecast)" })
  .phase("p1", {
    duration: 1800,
    title: "3 日前の予報",
    body: "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode").set("forecast", '[["Mon","☀",21,16],["Tue","☁",20,15],["Wed","☂",18,14],["Thu","⚡",16,12],["Fri","☀",22,17]]'))
  .phase("p2", {
    duration: 1800,
    title: "前日の予報",
    body: "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("monNode", "tueNode", "wedNode").set("forecast", '[["Mon","☀",23,17],["Tue","☁",21,16],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",24,18]]'))
  .phase("p3", {
    duration: 1800,
    title: "当日の予報",
    body: "最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。",
  }, (p: PhaseBuilder) => p.activate("monNode", "friNode", "tueNode", "wedNode", "thuNode").set("forecast", '[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]'))
  .build();
export const subtitle__weekWeather = "5-day weather を 3-lane (Sunny ☀ / Cloudy/Rainy / Thunder ⚡) 天気別分散、 各 day 個別 card、 weatherForecast readout 併存";

/**
 * 90. video-card = tutorial video 3 本 (title + duration + views)。
 */
export const tutorialVideoCards = diagram("interactive-tutorial-videos", {
  topic: "解説動画 3 本を言語ごとに分ける",
})
  .lane("rust", { x: 0, width: 220 })
  .lane("ts", { x: 260, width: 220 })
  .lane("react", { x: 520, width: 220 })
  .arraySignal("videos", [
    ["🎬", "Rust intro for beginners", "12:45", "24k"],
    ["🎥", "TypeScript deep dive", "45:20", "82k"],
    ["📺", "React hooks explained", "18:30", "156k"],
  ] as unknown as (string | number)[])
  .node("rustVideo", { lane: "rust", stack: 0, kind: "card", title: "🎬 Rust", subtitle: "最初に出す 1 本" })
  .node("tsVideo", { lane: "ts", stack: 0, kind: "card", title: "🎥 TS deep", subtitle: "最も長い 1 本" })
  .node("reactVideo", { lane: "react", stack: 0, kind: "card", title: "📺 React", subtitle: "最も見られている 1 本" })
  .readout.videoCard("vc", { source: "videos", max: 5, color: "#ef4444", label: "Videos (thumbnail list)" })
  .phase("p1", {
    duration: 1800,
    title: "1 本だけ出す",
    body: "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。",
  }, (p: PhaseBuilder) => p.activate("rustVideo").set("videos", '[["🎬","Rust intro for beginners","12:45","24k"]]'))
  .phase("p2", {
    duration: 1800,
    title: "2 本に増える",
    body: "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。",
  }, (p: PhaseBuilder) => p.activate("rustVideo", "tsVideo").set("videos", '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"]]'))
  .phase("p3", {
    duration: 1800,
    title: "3 本が揃う",
    body: "3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。",
  }, (p: PhaseBuilder) => p.activate("rustVideo", "tsVideo", "reactVideo").set("videos", '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]'))
  .build();
export const subtitle__tutorialVideoCards = "tutorial video 3 本 を 3-lane (Rust / TypeScript / React) topic 別分散、 各 video 個別 card、 videoCard readout 併存";

/**
 * 91. order-status = e-commerce 配送追跡、 stepper で current step 切替 → 4 icon step。
 */
export const shippingOrderStatus = diagram("interactive-shipping-status", {
  topic: "配送状況を 4 段階で追う",
})
  .lane("col1", { x: 0, width: 340 })
  .lane("col2", { x: 380, width: 340 })
  .input.stepper("current", { min: 0, max: 3, defaultValue: 2, label: "Step" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["Packed", "Shipped", "Out for delivery", "Delivered"])
  .node("packedNode", { lane: "col1", stack: 0, kind: "card", w: 250, title: "📦 Packed", subtitle: "梱包完了" })
  .node("shippedNode", { lane: "col2", stack: 0, kind: "card", w: 270, title: "🚚 Shipped", subtitle: "配送開始" })
  .node("deliveryNode", { lane: "col1", stack: 1, kind: "card", w: 290, title: "🏠 Delivery", subtitle: "配達中 (現在地)" })
  .node("deliveredNode", { lane: "col2", stack: 1, kind: "card", w: 290, title: "✅ Delivered", subtitle: "配達完了" })
  .edge("packedNode", "shippedNode", { label: "handover", tone: "success" })
  .edge("shippedNode", "deliveryNode", { label: "in transit", tone: "info" })
  .edge("deliveryNode", "deliveredNode", { label: "arrived", tone: "warning" })
  .readout.orderStatus("os", { source: "current", stepsSource: "steps", color: "#2563eb", label: "Delivery status (icon strip)" })
  .phase("p", {
    duration: 1200,
    title: "delivery pipeline",
    body: "4 区画 pipeline (Packed / Shipped / Out for delivery / Delivered) を 2 列 2 段に置いて + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。",
  }, (p: PhaseBuilder) => p.activate("packedNode", "shippedNode", "deliveryNode", "deliveredNode").badge("tracking"))
  .build();
export const subtitle__shippingOrderStatus = "e-commerce 配送追跡 4 step (📦→🚚→🏠→✅) を 2 列 2 段の pipeline + 3 edge で状態遷移 network 化、 orderStatus readout 併存";

/**
 * 92. attendance-grid = チーム週間 attendance (5 day × 4 member)。
 */
export const teamAttendanceGrid = diagram("interactive-team-attendance", {
  topic: "4 人 × 5 日の出欠を並べる",
})
  .lane("alice", { x: 0, width: 330 })
  .lane("bob", { x: 350, width: 330 })
  .lane("carol", { x: 700, width: 370 })
  .lane("dan", { x: 1090, width: 300 })
  .arraySignal("attendance", [
    ["Mon", true, true, false, true],
    ["Tue", true, false, true, true],
    ["Wed", true, true, true, true],
    ["Thu", false, true, true, true],
    ["Fri", true, true, false, true],
  ] as unknown as (string | number)[])
  .arraySignal("members", ["Alice", "Bob", "Carol", "Dan"])
  .node("aliceCard", { lane: "alice", stack: 0, kind: "card", w: 280, title: "Alice", subtitle: "1 列目の人" })
  .node("bobCard", { lane: "bob", stack: 0, kind: "card", w: 280, title: "Bob", subtitle: "2 列目の人" })
  .node("carolCard", { lane: "carol", stack: 0, kind: "card", w: 320, title: "Carol", subtitle: "3 列目の人" })
  .node("danCard", { lane: "dan", stack: 0, kind: "card", w: 250, title: "Dan", subtitle: "4 列目の人 (欠けが無い)" })
  .readout.attendanceGrid("ag", { source: "attendance", membersSource: "members", color: "#22c55e", label: "Attendance (5 day × 4 member grid)" })
  .phase("p1", {
    duration: 1800,
    title: "週の初め",
    body: "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。",
  }, (p: PhaseBuilder) => p.activate("aliceCard").set("attendance", '[["Mon",true,true,false,true]]'))
  .phase("p2", {
    duration: 1800,
    title: "週の半ば",
    body: "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。",
  }, (p: PhaseBuilder) => p.activate("aliceCard", "bobCard").set("attendance", '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true]]'))
  .phase("p3", {
    duration: 1800,
    title: "週の終わり",
    body: "5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。",
  }, (p: PhaseBuilder) => p.activate("aliceCard", "bobCard", "carolCard", "danCard").set("attendance", '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true],["Thu",false,true,true,true],["Fri",true,true,false,true]]'))
  .build();
export const subtitle__teamAttendanceGrid = "5 day × 4 member attendance を 4-lane (Alice/Bob/Carol/Dan) member 別分散、 各 member weekly summary + attendanceGrid readout 併存";

/**
 * 93. timezone-clock = 4 city の multi-timezone clock (Tokyo / London / NYC / Sydney)。
 */
export const globalTimezoneClock = diagram("interactive-timezone-clock", {
  topic: "4 都市の現地時刻を並べる",
})
  .lane("tokyo", { x: 0, width: 230 })
  .lane("london", { x: 250, width: 230 })
  .lane("nyc", { x: 500, width: 230 })
  .lane("sydney", { x: 750, width: 240 })
  .arraySignal("clocks", [
    ["Tokyo", 9, "22:30"],
    ["London", 0, "13:30"],
    ["NYC", -5, "08:30"],
    ["Sydney", 11, "00:30"],
  ] as unknown as (string | number)[])
  .node("tokyoNode", { lane: "tokyo", stack: 0, kind: "card", w: 180, title: "Tokyo", subtitle: "時差が進んでいる側の都市" })
  .node("londonNode", { lane: "london", stack: 0, kind: "card", w: 180, title: "London", subtitle: "時差の基準となる都市" })
  .node("nycNode", { lane: "nyc", stack: 0, kind: "card", w: 180, title: "NYC", subtitle: "時差が最も遅れている都市" })
  .node("sydneyNode", { lane: "sydney", stack: 0, kind: "card", w: 190, title: "Sydney", subtitle: "時差が最も進んでいる都市" })
  .readout.timezoneClock("tc", { source: "clocks", color: "#2563eb", label: "Cities (4-column grid)" })
  .phase("p1", {
    duration: 1800,
    title: "朝の会",
    body: "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。",
  }, (p: PhaseBuilder) => p.activate("londonNode").set("clocks", '[["Tokyo",9,"17:00"],["London",0,"08:00"],["NYC",-5,"03:00"],["Sydney",11,"19:00"]]'))
  .phase("p2", {
    duration: 1800,
    title: "昼の会",
    body: "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。",
  }, (p: PhaseBuilder) => p.activate("londonNode", "nycNode").set("clocks", '[["Tokyo",9,"22:00"],["London",0,"13:00"],["NYC",-5,"08:00"],["Sydney",11,"00:00"]]'))
  .phase("p3", {
    duration: 1800,
    title: "夜の会",
    body: "先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。",
  }, (p: PhaseBuilder) => p.activate("tokyoNode", "londonNode", "nycNode", "sydneyNode").set("clocks", '[["Tokyo",9,"01:30"],["London",0,"16:30"],["NYC",-5,"11:30"],["Sydney",11,"03:30"]]'))
  .build();
export const subtitle__globalTimezoneClock = "4 city timezone を 4-lane (Tokyo / London / NYC / Sydney) 都市別分散、 各 city 個別 card、 timezoneClock readout 併存";

/**
 * 94. form-summary = signup form の 5 field 送信内容 summary。
 */
export const signupFormSummary = diagram("interactive-signup-form", {
  topic: "登録項目 5 つを意味ごとに分ける",
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
  .node("nameNode", { lane: "personal", stack: 0, kind: "card", title: "Name", subtitle: "本人を表す項目" })
  .node("ageNode", { lane: "personal", stack: 1, kind: "card", title: "Age", subtitle: "本人を表す項目 (数)" })
  .node("emailNode", { lane: "contact", stack: 0, kind: "card", title: "Email", subtitle: "連絡先の項目" })
  .node("countryNode", { lane: "contact", stack: 1, kind: "card", title: "Country", subtitle: "連絡先の項目 (所在)" })
  .node("newsletterNode", { lane: "prefs", stack: 0, kind: "card", title: "Newsletter", subtitle: "希望を表す項目" })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "Submission (dl/dt/dd)" })
  .phase("p1", {
    duration: 1800,
    title: "入力の途中",
    body: "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。",
  }, (p: PhaseBuilder) => p.activate("nameNode", "ageNode").set("fields", '[["Name","Alice Wonderland"],["Age","28"]]'))
  .phase("p2", {
    duration: 1800,
    title: "連絡先まで",
    body: "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("nameNode", "ageNode", "emailNode", "countryNode").set("fields", '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"]]'))
  .phase("p3", {
    duration: 1800,
    title: "送信の直前",
    body: "希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。",
  }, (p: PhaseBuilder) => p.activate("nameNode", "ageNode", "emailNode", "countryNode", "newsletterNode").set("fields", '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"],["Newsletter","Yes"]]'))
  .build();
export const subtitle__signupFormSummary = "signup form 5 field を 3-lane (Personal / Contact / Prefs) semantic 分類、 各 field 個別 card、 formSummary readout 併存";

/**
 * 95. song-queue = playlist queue 5 song、 stepper で current index。
 */
export const playlistSongQueue = diagram("interactive-playlist-queue", {
  topic: "再生待ち 5 曲を再生済 / 再生中 / 次にで分ける",
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
  .node("song0", { lane: "played", stack: 0, kind: "card", title: "✓ Bohemian", subtitle: "Queen · 5:55 (played)" })
  .node("song1", { lane: "now", stack: 0, kind: "card", title: "▶ Hotel", subtitle: "Eagles · 6:30 (now playing)" })
  .node("song2", { lane: "next", stack: 0, kind: "card", title: "Stairway", subtitle: "Led Zeppelin · 8:02" })
  .node("song3", { lane: "next", stack: 1, kind: "card", title: "Sweet Child", subtitle: "Guns N' Roses · 5:56" })
  .node("song4", { lane: "next", stack: 2, kind: "card", title: "Imagine", subtitle: "John Lennon · 3:03" })
  .readout.songQueue("sq", { source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "Queue (current highlight)" })
  .phase("p", {
    duration: 1200,
    title: "playback split",
    body: "3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。",
  }, (p: PhaseBuilder) => p.activate("song0", "song1", "song2", "song3", "song4").badge("music"))
  .build();
export const subtitle__playlistSongQueue = "playlist queue 5 song を 3-lane (Played / Now Playing / Up Next) 状態別分散、 各 song 個別 card、 songQueue readout 併存";

/**
 * 96. calendar-month = January 2026 calendar with event marks + today highlight。
 */
function generateCalendarDays(eventDays: number[] = [3, 8, 12, 17, 22, 26], today = 13): (string | number)[] {
  const days: [number, boolean, boolean][] = [];
  const events = new Set(eventDays);
  for (let d = 1; d <= 31; d++) {
    days.push([d, events.has(d), d === today]);
  }
  return days as unknown as (string | number)[];
}
export const monthCalendarView = diagram("interactive-month-calendar", {
  topic: "1 か月を週ごとに並べる",
})
  .lane("w1", { x: 0, width: 150 })
  .lane("w2", { x: 170, width: 150 })
  .lane("w3", { x: 340, width: 150 })
  .lane("w4", { x: 510, width: 200 })
  .arraySignal("days", generateCalendarDays())
  .node("w1Card", { lane: "w1", stack: 0, kind: "card", title: "Week 1", subtitle: "月の最初の週" })
  .node("w2Card", { lane: "w2", stack: 0, kind: "card", title: "Week 2", subtitle: "今日を含む週" })
  .node("w3Card", { lane: "w3", stack: 0, kind: "card", title: "Week 3", subtitle: "月の半ばの週" })
  .node("w4Card", { lane: "w4", stack: 0, kind: "card", title: "Week 4-5", subtitle: "月の終わりの週" })
  .node("monthSummary", { lane: "w4", stack: 1, kind: "card", title: "Month total", subtitle: "月ぜんたいのまとめ" })
  .readout.calendarMonth("cm", { source: "days", monthName: "January 2026", color: "#2563eb", label: "Month view (7 column grid)" })
  .phase("p1", {
    duration: 1800,
    title: "月の初め",
    body: "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。",
  }, (p: PhaseBuilder) => p.activate("w1Card", "w2Card").set("days", JSON.stringify(generateCalendarDays([3, 8]))))
  .phase("p2", {
    duration: 1800,
    title: "月の半ば",
    body: "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("w1Card", "w2Card", "w3Card").set("days", JSON.stringify(generateCalendarDays([3, 8, 12, 17]))))
  .phase("p3", {
    duration: 1800,
    title: "月の終わり",
    body: "印が月の終わりまで並ぶ。 7 列の格子に予定の散らばりが読める形になる。",
  }, (p: PhaseBuilder) => p.activate("w1Card", "w2Card", "w3Card", "w4Card", "monthSummary").set("days", JSON.stringify(generateCalendarDays([3, 8, 12, 17, 22, 26]))))
  .build();
export const subtitle__monthCalendarView = "January 2026 calendar を 4-lane (Week 1 / Week 2 / Week 3 / Week 4-5) 週別分散、 各週 summary + calendarMonth readout 併存";

/**
 * 97. terminal = CLI session output、 5 command history。
 */
export const cliTerminalSession = diagram("interactive-cli-terminal", {
  topic: "コマンド 5 つを用途ごとに分ける",
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
  .node("lsNode", { lane: "fs", stack: 0, kind: "card", title: "ls -la", subtitle: "file を見る · 出力が長い" })
  .node("cdNode", { lane: "fs", stack: 1, kind: "card", title: "cd projects", subtitle: "場所を移る · 出力が無い" })
  .node("gitStatusNode", { lane: "git", stack: 0, kind: "card", title: "git status", subtitle: "履歴の状態を見る" })
  .node("pnpmNode", { lane: "dev", stack: 0, kind: "card", title: "pnpm test", subtitle: "検査を回す" })
  .node("dockerNode", { lane: "dev", stack: 1, kind: "card", title: "docker ps", subtitle: "動いている入れ物を見る" })
  .readout.terminal("tm", { source: "cmds", max: 10, color: "#22c55e", label: "Session (CLI window)" })
  .phase("p1", {
    duration: 1800,
    title: "打ち始め",
    body: "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。",
  }, (p: PhaseBuilder) => p.activate("lsNode").set("cmds", '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"]]'))
  .phase("p2", {
    duration: 1800,
    title: "場所を移る",
    body: "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("lsNode", "cdNode", "gitStatusNode").set("cmds", '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"]]'))
  .phase("p3", {
    duration: 1800,
    title: "作業が進む",
    body: "組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。",
  }, (p: PhaseBuilder) => p.activate("lsNode", "cdNode", "gitStatusNode", "pnpmNode", "dockerNode").set("cmds", '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"],["$","pnpm test","Test Files  114 passed\\nTests  1649 passed"],["$","docker ps","CONTAINER ID   IMAGE\\n8f3a2b1c9d   nginx:latest"]]'))
  .build();
export const subtitle__cliTerminalSession = "CLI 5 command を 3-lane (Filesystem / Git / Dev) tool category 別分散、 各 command 個別 card、 terminal readout 併存";

/**
 * 98. chess-board = 8×8 chess board with starting position。
 */
export const chessStartingBoard = diagram("interactive-chess-board", {
  topic: "駒 32 個を白黒と前後列で並べる",
})
  .lane("blackBack", { x: 0, width: 320 })
  .lane("blackPawn", { x: 340, width: 340 })
  .lane("whitePawn", { x: 700, width: 340 })
  .lane("whiteBack", { x: 1060, width: 320 })
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
  .node("blackBackNode", { lane: "blackBack", stack: 0, kind: "card", w: 270, title: "Black back", subtitle: "黒の奥の列 (♜♞♝♛♚♝♞♜)" })
  .node("blackPawnNode", { lane: "blackPawn", stack: 0, kind: "card", w: 290, title: "Black pawns", subtitle: "黒の手前の列 (♟)" })
  .node("whitePawnNode", { lane: "whitePawn", stack: 0, kind: "card", w: 290, title: "White pawns", subtitle: "白の手前の列 (♙)" })
  .node("whiteBackNode", { lane: "whiteBack", stack: 0, kind: "card", w: 270, title: "White back", subtitle: "白の奥の列 (♖♘♗♕♔♗♘♖)" })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "Position (8×8 board)" })
  .phase("p1", {
    duration: 1800,
    title: "白を並べる",
    body: "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。",
  }, (p: PhaseBuilder) => p.activate("whiteBackNode", "whitePawnNode").set("pieces", '[["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'))
  .phase("p2", {
    duration: 1800,
    title: "黒の手前を置く",
    body: "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。",
  }, (p: PhaseBuilder) => p.activate("whiteBackNode", "whitePawnNode", "blackPawnNode").set("pieces", '[["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'))
  .phase("p3", {
    duration: 1800,
    title: "開始の形",
    body: "上下の端 2 列ずつが埋まり、中央 4 列が空く。 開始の形が盤の上に揃う。",
  }, (p: PhaseBuilder) => p.activate("blackBackNode", "blackPawnNode", "whitePawnNode", "whiteBackNode").set("pieces", '[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'))
  .build();
export const subtitle__chessStartingBoard = "32 chess piece を 4-lane (Black back rank / Black pawns / White pawns / White back rank) rank 別分散、 chessBoard readout 併存";

/**
 * 100. kanban-board = sprint task board、 3-lane (Todo / In Progress / Done) state 別分散 + kanban readout 併存。
 * cdl primitive iteration 6 の最初の readout、 layout diversity pattern taxonomy § 1 state-based split と直接共鳴。
 */
export const sprintKanbanBoard = diagram("interactive-sprint-kanban", {
  topic: "6 タスクを未着手 / 進行中 / 完了で分ける",
})
  .lane("todo", { x: 0, width: 220 })
  .lane("inprogress", { x: 260, width: 220 })
  .lane("done", { x: 520, width: 220 })
  .arraySignal("tasks", [
    ["todo", "Design API schema", "high"],
    ["todo", "Write docs", "low"],
    ["inprogress", "Impl auth flow", "high"],
    ["inprogress", "Migration script", "med"],
    ["done", "Setup CI", "med"],
    ["done", "Repo bootstrap", "low"],
  ] as unknown as (string | number)[])
  .node("todoCard", { lane: "todo", stack: 0, kind: "card", title: "Todo", subtitle: "まだ手を付けていない列" })
  .node("inprogressCard", { lane: "inprogress", stack: 0, kind: "card", title: "In Progress", subtitle: "いま進めている列" })
  .node("doneCard", { lane: "done", stack: 0, kind: "card", title: "Done", subtitle: "終わった列" })
  .readout.kanbanBoard("kb", { source: "tasks", columnWidth: 140, max: 5, label: "Sprint kanban" })
  .phase("p1", {
    duration: 1800,
    title: "着手前",
    body: "札がすべて左の列に積まれる。 重さの違いは札の色として出る。",
  }, (p: PhaseBuilder) => p.activate("todoCard").set("tasks", '[["todo","Design API schema","high"],["todo","Write docs","low"],["todo","Impl auth flow","high"],["todo","Migration script","med"],["todo","Setup CI","med"],["todo","Repo bootstrap","low"]]'))
  .phase("p2", {
    duration: 1800,
    title: "動き出す",
    body: "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。",
  }, (p: PhaseBuilder) => p.activate("todoCard", "inprogressCard").set("tasks", '[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["todo","Repo bootstrap","low"]]'))
  .phase("p3", {
    duration: 1800,
    title: "終盤に入る",
    body: "右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。",
  }, (p: PhaseBuilder) => p.activate("todoCard", "inprogressCard", "doneCard").set("tasks", '[["todo","Design API schema","high"],["inprogress","Write docs","low"],["inprogress","Impl auth flow","high"],["done","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]'))
  .build();
export const subtitle__sprintKanbanBoard = "sprint 6 task を 3-lane (Todo / In Progress / Done) 状態別分散、 kanban readout 併存";

/**
 * 101. breadcrumb = navigation path、 4 区画 (Home / Docs / API / Reference) を 2 列 2 段に置いた pipeline + 3 next edge + breadcrumb readout 併存。
 * cdl primitive iteration 6 の 2 番目、 pattern taxonomy § 4 pipeline flow と直接共鳴。
 */
export const docsBreadcrumb = diagram("interactive-docs-breadcrumb", {
  topic: "階層 4 段のパンくずを順に辿る",
})
  .lane("col1", { x: 0, width: 270 })
  .lane("col2", { x: 310, width: 300 })
  .arraySignal("path", ["Home", "Docs", "API", "Reference"])
  .state("cur", { initial: 2 })
  .node("homeNode", { lane: "col1", stack: 0, kind: "card", w: 190, title: "Home", subtitle: "最上位の階層" })
  .node("docsNode", { lane: "col2", stack: 0, kind: "card", w: 140, title: "Docs", subtitle: "Home の下にある階層" })
  .node("apiNode", { lane: "col1", stack: 1, kind: "card", w: 220, title: "API", subtitle: "Reference の上にある階層" })
  .node("refNode", { lane: "col2", stack: 1, kind: "card", w: 250, title: "Reference", subtitle: "最も深い階層" })
  .edge("homeNode", "docsNode", { label: "→", tone: "info" })
  .edge("docsNode", "apiNode", { label: "→", tone: "accent" })
  .edge("apiNode", "refNode", { label: "→", tone: "info" })
  .readout.breadcrumb("bc", { source: "path", currentSource: "cur", color: "#2563eb", label: "Path" })
  .phase("p1", {
    duration: 1800,
    title: "最上位に居る",
    body: "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。",
  }, (p: PhaseBuilder) => p.activate("homeNode").set("cur", 0))
  .phase("p2", {
    duration: 1800,
    title: "中ほどへ降りる",
    body: "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。",
  }, (p: PhaseBuilder) => p.activate("homeNode", "docsNode", "apiNode").set("cur", 2))
  .phase("p3", {
    duration: 1800,
    title: "最も深い階層",
    body: "末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。",
  }, (p: PhaseBuilder) => p.activate("homeNode", "docsNode", "apiNode", "refNode").set("cur", 3))
  .build();
export const subtitle__docsBreadcrumb = "docs navigation 4 crumb を 2 列 2 段の pipeline (Home → Docs → API → Reference) + 3 next edge + breadcrumb readout 併存";

/**
 * 102. timeline-vertical = day schedule 5 event を縦 timeline で表示、 3-lane (Morning / Afternoon / Evening) 時間帯別分散 + timelineVertical readout 併存。
 * cdl primitive iteration 6 の 3 番目、 pattern taxonomy § 7 individual element split と共鳴。
 */
export const dayScheduleTimeline = diagram("interactive-day-schedule", {
  topic: "1 日の予定を朝 / 昼 / 夜で分ける",
})
  .lane("morning", { x: 0, width: 240 })
  .lane("afternoon", { x: 280, width: 240 })
  .lane("evening", { x: 560, width: 240 })
  .arraySignal("events", [
    ["09:00", "Standup", "team sync"],
    ["10:30", "Design review", "3 proposals"],
    ["14:00", "Deploy staging", "v1.2.0"],
    ["16:00", "1-on-1", "career discussion"],
    ["19:30", "Retrospective", "sprint 42 close"],
  ] as unknown as (string | number)[])
  .node("morningCard", { lane: "morning", stack: 0, kind: "card", title: "Morning", subtitle: "午前の時間帯" })
  .node("afternoonCard", { lane: "afternoon", stack: 0, kind: "card", title: "Afternoon", subtitle: "午後の時間帯" })
  .node("eveningCard", { lane: "evening", stack: 0, kind: "card", title: "Evening", subtitle: "夜の時間帯" })
  .readout.timelineVertical("tv", { source: "events", color: "#2563eb", max: 8, label: "Day events" })
  .phase("p1", {
    duration: 1800,
    title: "午前の予定",
    body: "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。",
  }, (p: PhaseBuilder) => p.activate("morningCard").set("events", '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"]]'))
  .phase("p2", {
    duration: 1800,
    title: "午後まで",
    body: "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。",
  }, (p: PhaseBuilder) => p.activate("morningCard", "afternoonCard").set("events", '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging"],["16:00","1-on-1","career discussion"]]'))
  .phase("p3", {
    duration: 1800,
    title: "1 日ぶん",
    body: "点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。",
  }, (p: PhaseBuilder) => p.activate("morningCard", "afternoonCard", "eveningCard").set("events", '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]'))
  .build();
export const subtitle__dayScheduleTimeline = "day schedule 5 event を 3-lane (Morning / Afternoon / Evening) 時間帯別分散 + timelineVertical readout 併存";

/**
 * 103. status-timeline = server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存。
 * iteration 6 wave 3、 pattern taxonomy § 4 pipeline flow + § 1 state-based split。
 */
export const serverUptimeStatus = diagram("interactive-server-uptime", {
  topic: "稼働 6 区間を稼働 / 待機 / 異常で分ける",
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
  .node("activeCard", { lane: "active", stack: 0, kind: "card", title: "Active", subtitle: "稼働している区間 (緑)" })
  .node("idleCard", { lane: "idle", stack: 0, kind: "card", title: "Idle", subtitle: "待機している区間 (灰)" })
  .node("errorCard", { lane: "error", stack: 0, kind: "card", title: "Error", subtitle: "異常が出た区間 (赤)" })
  .readout.statusTimeline("st", { source: "events", max: 8, label: "Server status" })
  .phase("p1", {
    duration: 1800,
    title: "平常の稼働",
    body: "同じ色の区間が続く。 状態の名は 4 文字までに切って大文字で出ることが読める。",
  }, (p: PhaseBuilder) => p.activate("activeCard").set("events", '[["09:00","active"],["09:15","active"]]'))
  .phase("p2", {
    duration: 1800,
    title: "異常が出る",
    body: "灰と赤の区間が混じる。 色の切り替わりで、いつ状態が変わったかが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("activeCard", "idleCard", "errorCard").set("events", '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"]]'))
  .phase("p3", {
    duration: 1800,
    title: "復帰する",
    body: "末尾がまた緑に戻る。 赤が 1 区間だけであることが、帯の中の面積として読める。",
  }, (p: PhaseBuilder) => p.activate("activeCard", "errorCard").set("events", '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]'))
  .build();
export const subtitle__serverUptimeStatus = "server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存";

/**
 * 104. calendar-week = 週間 mini calendar、 7-lane 分散 + calendarWeek readout 併存。 iteration 6 wave 3、 pattern taxonomy § 7 individual element split。
 */
export const weekCalendarView = diagram("interactive-week-calendar", {
  topic: "1 週間を曜日ごとに並べる",
})
  .lane("mon", { x: 0, width: 160 })
  .lane("tue", { x: 185, width: 160 })
  .lane("wed", { x: 370, width: 210 })
  .lane("thu", { x: 605, width: 160 })
  .lane("fri", { x: 790, width: 160 })
  .lane("sat", { x: 975, width: 160 })
  .lane("sun", { x: 1160, width: 160 })
  .arraySignal("week", [
    ["Mon", true, false],
    ["Tue", false, false],
    ["Wed", true, true],
    ["Thu", false, false],
    ["Fri", true, false],
    ["Sat", false, false],
    ["Sun", false, false],
  ] as unknown as (string | number)[])
  .node("monNode", { lane: "mon", stack: 0, kind: "card", w: 110, title: "Mon", subtitle: "予定を持つ日" })
  .node("tueNode", { lane: "tue", stack: 0, kind: "card", w: 110, title: "Tue", subtitle: "予定を持たない日" })
  .node("wedNode", { lane: "wed", stack: 0, kind: "card", w: 160, title: "Wed", subtitle: "予定を持つ日" })
  .node("thuNode", { lane: "thu", stack: 0, kind: "card", w: 110, title: "Thu", subtitle: "予定を持たない日" })
  .node("friNode", { lane: "fri", stack: 0, kind: "card", w: 110, title: "Fri", subtitle: "予定を持つ日" })
  .node("satNode", { lane: "sat", stack: 0, kind: "card", w: 110, title: "Sat", subtitle: "予定を持たない日 (週末)" })
  .node("sunNode", { lane: "sun", stack: 0, kind: "card", w: 110, title: "Sun", subtitle: "予定を持たない日 (週明け前)" })
  .readout.calendarWeek("cw", { source: "week", cellSize: 40, color: "#2563eb", label: "This week" })
  .phase("p1", {
    duration: 1800,
    title: "週の始まり",
    body: "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。",
  }, (p: PhaseBuilder) => p.activate("monNode").set("week", '[["Mon",true,true],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]'))
  .phase("p2", {
    duration: 1800,
    title: "週の半ば",
    body: "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。",
  }, (p: PhaseBuilder) => p.activate("monNode", "wedNode").set("week", '[["Mon",true,false],["Tue",false,false],["Wed",true,true],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]'))
  .phase("p3", {
    duration: 1800,
    title: "週の終わり",
    body: "塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。",
  }, (p: PhaseBuilder) => p.activate("monNode", "wedNode", "friNode", "satNode", "sunNode").set("week", '[["Mon",true,false],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,true],["Sat",false,false],["Sun",false,false]]'))
  .build();
export const subtitle__weekCalendarView = "7-day week calendar を 7-lane 個別 day 分散 + calendarWeek readout 併存";

/**
 * 105. kpi-comparison = A/B team score 比較を 2-lane 分散 + kpiComparison readout 併存。 iteration 6 wave 3、 pattern taxonomy § 3 category split。
 */
export const teamKpiComparison = diagram("interactive-team-kpi-compare", {
  topic: "2 チームの成績を並べて比べる",
})
  .lane("teamA", { x: 0, width: 340 })
  .lane("teamB", { x: 380, width: 340 })
  .arraySignal("teams", [["Team A", 82], ["Team B", 65]] as unknown as (string | number)[])
  .node("aCard", { lane: "teamA", stack: 0, kind: "card", title: "Team A", subtitle: "上の帯 (青)" })
  .node("aDetail", { lane: "teamA", stack: 1, kind: "card", title: "Velocity", subtitle: "上の帯が表す量" })
  .node("bCard", { lane: "teamB", stack: 0, kind: "card", title: "Team B", subtitle: "下の帯 (橙)" })
  .node("bDetail", { lane: "teamB", stack: 1, kind: "card", title: "Velocity", subtitle: "下の帯が表す量" })
  .edge("aCard", "bCard", { label: "差", tone: "warning" })
  .readout.kpiComparison("kc", { source: "teams", max: 100, colorA: "#2563eb", colorB: "#f97316", label: "Score compare" })
  .phase("p1", {
    duration: 1800,
    title: "差が大きい",
    body: "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。",
  }, (p: PhaseBuilder) => p.activate("aCard", "bCard").set("teams", '[["Team A",82],["Team B",41]]'))
  .phase("p2", {
    duration: 1800,
    title: "追い上げる",
    body: "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard").set("teams", '[["Team A",82],["Team B",65]]'))
  .phase("p3", {
    duration: 1800,
    title: "ほぼ並ぶ",
    body: "2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。",
  }, (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard", "bDetail").set("teams", '[["Team A",84],["Team B",80]]'))
  .build();
export const subtitle__teamKpiComparison = "Team A vs Team B の score を 2-lane 分散 + kpiComparison readout 併存";

/**
 * 106. step-progress = 4 step wizard を 4 区画 2 列 2 段の pipeline + 3 next edge + stepProgress readout 併存。 iteration 6 wave 4、 pattern taxonomy § 4 pipeline flow + § 5 fan-out。
 */
export const publishWorkflowSteps = diagram("interactive-publish-workflow", {
  topic: "記事公開の 4 工程を順に追う",
})
  .lane("col1", { x: 0, width: 300 })
  .lane("col2", { x: 340, width: 270 })
  .arraySignal("steps", ["Draft", "Review", "Approve", "Publish"])
  .state("cur", { initial: 2 })
  .node("draftNode", { lane: "col1", stack: 0, kind: "card", w: 190, title: "Draft", subtitle: "最初の工程" })
  .node("reviewNode", { lane: "col2", stack: 0, kind: "card", w: 190, title: "Review", subtitle: "Draft の次の工程" })
  .node("approveNode", { lane: "col1", stack: 1, kind: "card", w: 250, title: "Approve", subtitle: "Publish の直前の工程" })
  .node("publishNode", { lane: "col2", stack: 1, kind: "card", w: 220, title: "Publish", subtitle: "最後の工程" })
  .edge("draftNode", "reviewNode", { label: "submit", tone: "success" })
  .edge("reviewNode", "approveNode", { label: "reviewed", tone: "info" })
  .edge("approveNode", "publishNode", { label: "publish", tone: "accent" })
  .readout.stepProgress("sp", { source: "cur", stepsSource: "steps", color: "#2563eb", label: "Workflow" })
  .phase("p1", {
    duration: 1800,
    title: "書き始め",
    body: "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。",
  }, (p: PhaseBuilder) => p.activate("draftNode").set("cur", 0))
  .phase("p2", {
    duration: 1800,
    title: "確認を経る",
    body: "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。",
  }, (p: PhaseBuilder) => p.activate("draftNode", "reviewNode", "approveNode").set("cur", 2))
  .phase("p3", {
    duration: 1800,
    title: "公開する",
    body: "末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。",
  }, (p: PhaseBuilder) => p.activate("draftNode", "reviewNode", "approveNode", "publishNode").set("cur", 3))
  .build();
export const subtitle__publishWorkflowSteps = "content publish workflow 4 step を 2 列 2 段の pipeline + 3 next edge + stepProgress readout 併存";

/**
 * 107. user-presence = 5 team member を 3-lane (Online / Away / Offline) + userPresence readout 併存。 iteration 6 wave 4、 pattern taxonomy § 1 state-based split。
 */
export const teamPresenceStatus = diagram("interactive-team-presence", {
  topic: "5 人の在席を在席 / 離席 / 不在で分ける",
})
  .lane("online", { x: 0, width: 240 })
  .lane("away", { x: 280, width: 240 })
  .lane("offline", { x: 560, width: 240 })
  .arraySignal("team", [
    ["Alice", "online"],
    ["Bob", "away"],
    ["Carol", "online"],
    ["Dan", "offline"],
    ["Eve", "online"],
  ] as unknown as (string | number)[])
  .node("aliceCard", { lane: "online", stack: 0, kind: "card", title: "Alice", subtitle: "在席の人 (緑の丸)" })
  .node("carolCard", { lane: "online", stack: 1, kind: "card", title: "Carol", subtitle: "在席の人 (緑の丸)" })
  .node("eveCard", { lane: "online", stack: 2, kind: "card", title: "Eve", subtitle: "在席の人 (緑の丸)" })
  .node("bobCard", { lane: "away", stack: 0, kind: "card", title: "Bob", subtitle: "離席の人 (黄の丸)" })
  .node("danCard", { lane: "offline", stack: 0, kind: "card", title: "Dan", subtitle: "不在の人 (灰の丸)" })
  .readout.userPresence("up", { source: "team", max: 6, label: "Team status" })
  .phase("p1", {
    duration: 1800,
    title: "朝の在席",
    body: "全員が不在。 名前の左の丸がすべて灰で、状態が色だけで表される形が読める。",
  }, (p: PhaseBuilder) => p.activate("danCard").set("team", '[["Alice","offline"],["Bob","offline"],["Carol","offline"],["Dan","offline"],["Eve","offline"]]'))
  .phase("p2", {
    duration: 1800,
    title: "始業した後",
    body: "在席と離席が混じる。 並びは変わらず、丸の色だけが人ごとに分かれる。",
  }, (p: PhaseBuilder) => p.activate("aliceCard", "bobCard", "danCard").set("team", '[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"]]'))
  .phase("p3", {
    duration: 1800,
    title: "日中の在席",
    body: "在席が 3 人になる。 緑 3 と黄 1 と灰 1 の内訳が、丸の色だけで数えられる。",
  }, (p: PhaseBuilder) => p.activate("aliceCard", "carolCard", "eveCard", "bobCard", "danCard").set("team", '[["Alice","online"],["Bob","away"],["Carol","online"],["Dan","offline"],["Eve","online"]]'))
  .build();
export const subtitle__teamPresenceStatus = "5 team member を 3-lane (Online / Away / Offline) status 別分散 + userPresence readout 併存";

/**
 * 108. rating-thumb = review vote 2 category (up / down) を 2-lane + ratingThumb readout 併存。 iteration 6 wave 4、 pattern taxonomy § 3 category split。
 */
export const feedbackThumbRating = diagram("interactive-feedback-rating", {
  topic: "賛成票と反対票を並べて見せる",
})
  .lane("up", { x: 0, width: 340 })
  .lane("down", { x: 380, width: 340 })
  .arraySignal("votes", [24, 3])
  .node("upCard", { lane: "up", stack: 0, kind: "card", title: "▲ Up votes", subtitle: "帯の緑の側を決める票" })
  .node("upDetail", { lane: "up", stack: 1, kind: "card", title: "Positive", subtitle: "帯の緑の部分" })
  .node("downCard", { lane: "down", stack: 0, kind: "card", title: "▼ Down votes", subtitle: "帯の赤の側を決める票" })
  .node("downDetail", { lane: "down", stack: 1, kind: "card", title: "Negative", subtitle: "帯の赤の部分" })
  .edge("upCard", "downCard", { label: "割合", tone: "warning" })
  .readout.ratingThumb("rt", { source: "votes", colorUp: "#22c55e", colorDown: "#ef4444", label: "Review score" })
  .phase("p1", {
    duration: 1800,
    title: "票が割れる",
    body: "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。",
  }, (p: PhaseBuilder) => p.activate("upCard", "downCard").set("votes", '[12,10]'))
  .phase("p2", {
    duration: 1800,
    title: "賛成が増える",
    body: "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。",
  }, (p: PhaseBuilder) => p.activate("upCard", "upDetail", "downCard").set("votes", '[20,10]'))
  .phase("p3", {
    duration: 1800,
    title: "賛成に寄る",
    body: "賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。",
  }, (p: PhaseBuilder) => p.activate("upCard", "upDetail", "downCard", "downDetail").set("votes", '[24,3]'))
  .build();
export const subtitle__feedbackThumbRating = "review 24 up / 3 down vote を 2-lane (Up / Down) 分散 + ratingThumb readout 併存";

/**
 * 109. org-chart-mini = 3-level org hierarchy を 3-lane (CEO / VP / IC) tree depth 別分散 + orgChartMini readout 併存。 iteration 6 wave 5、 pattern taxonomy § 8 tree depth split。
 */
export const startupOrgChart = diagram("interactive-startup-org", {
  topic: "3 階層の組織図を階層ごとに並べる",
})
  .lane("ceo", { x: 0, width: 220 })
  .lane("vp", { x: 260, width: 220 })
  .lane("ic", { x: 520, width: 260 })
  .arraySignal("org", [
    ["Alice CEO", 0],
    ["Bob VP Eng", 1],
    ["Carol VP Sales", 1],
    ["Dan Eng", 2],
    ["Eve Eng", 2],
    ["Frank Sales", 2],
  ] as unknown as (string | number)[])
  .node("ceoCard", { lane: "ceo", stack: 0, kind: "card", title: "Alice CEO", subtitle: "最上位の階層" })
  .node("vpEng", { lane: "vp", stack: 0, kind: "card", title: "Bob VP Eng", subtitle: "中間の階層" })
  .node("vpSales", { lane: "vp", stack: 1, kind: "card", title: "Carol Sales", subtitle: "中間の階層" })
  .node("icDan", { lane: "ic", stack: 0, kind: "card", title: "Dan Eng", subtitle: "最下位の階層" })
  .node("icEve", { lane: "ic", stack: 1, kind: "card", title: "Eve Eng", subtitle: "最下位の階層" })
  .node("icFrank", { lane: "ic", stack: 2, kind: "card", title: "Frank Sales", subtitle: "最下位の階層" })
  .edge("ceoCard", "vpEng", { label: "reports", tone: "info" })
  .edge("ceoCard", "vpSales", { label: "reports", tone: "info" })
  .edge("vpEng", "icDan", { label: "manages", tone: "accent" })
  .edge("vpEng", "icEve", { label: "manages", tone: "accent" })
  .edge("vpSales", "icFrank", { label: "manages", tone: "accent" })
  .readout.orgChartMini("oc", { source: "org", color: "#2563eb", label: "Org hierarchy" })
  .phase("p1", {
    duration: 1800,
    title: "創業した頃",
    body: "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。",
  }, (p: PhaseBuilder) => p.activate("ceoCard").set("org", '[["Alice CEO",0]]'))
  .phase("p2", {
    duration: 1800,
    title: "役員を置く",
    body: "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。",
  }, (p: PhaseBuilder) => p.activate("ceoCard", "vpEng", "vpSales").set("org", '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1]]'))
  .phase("p3", {
    duration: 1800,
    title: "現場が増える",
    body: "3 段目まで揃う。 名前が 10 文字を超える箱は末尾を省いて出ることが読み取れる。",
  }, (p: PhaseBuilder) => p.activate("ceoCard", "vpEng", "vpSales", "icDan", "icEve", "icFrank").set("org", '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]'))
  .build();
export const subtitle__startupOrgChart = "startup 3-level org (CEO / 2 VP / 3 IC) を 3-lane tree depth 別分散 + orgChartMini readout 併存";

/**
 * 110. kpi-trend-tile = NPS current + delta + sparkline を 3-lane (Current / Delta / History) fan-out + kpiTrendTile readout 併存。 iteration 6 wave 5、 pattern taxonomy § 5 fan-out。
 */
export const npsTrendKpi = diagram("interactive-nps-trend", {
  topic: "NPS の現在値と増減と推移を並べる",
})
  .lane("cur", { x: 0, width: 220 })
  .lane("delta", { x: 260, width: 220 })
  .lane("hist", { x: 520, width: 260 })
  .state("cur", { initial: 82 })
  .state("prev", { initial: 75 })
  .arraySignal("hist", [60, 65, 70, 75, 80, 82])
  .node("curCard", { lane: "cur", stack: 0, kind: "card", title: "Current", subtitle: "今月の値" })
  .node("prevCard", { lane: "delta", stack: 0, kind: "card", title: "Previous", subtitle: "先月の値" })
  .node("deltaCard", { lane: "delta", stack: 1, kind: "card", title: "Delta", subtitle: "今月 - 先月の差" })
  .node("histCard", { lane: "hist", stack: 0, kind: "card", title: "History", subtitle: "折れ線のもとになる並び" })
  .edge("curCard", "prevCard", { label: "比べる", tone: "info" })
  .edge("curCard", "histCard", { label: "並べる", tone: "success" })
  .readout.kpiTrendTile("kt", { source: "cur", prevSource: "prev", historySource: "hist", unit: "", colorPos: "#22c55e", colorNeg: "#ef4444", label: "NPS trend" })
  .phase("p1", {
    duration: 1800,
    title: "下がった月",
    body: "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。",
  }, (p: PhaseBuilder) => p.activate("curCard", "prevCard").set("cur", 58).set("prev", 64).set("hist", '[70,68,66,64,60,58]'))
  .phase("p2", {
    duration: 1800,
    title: "底を打つ",
    body: "今月が先月と並ぶ。 差が 0 になり、折れ線の右端が水平に寝る。",
  }, (p: PhaseBuilder) => p.activate("curCard", "prevCard", "deltaCard").set("cur", 64).set("prev", 64).set("hist", '[68,66,64,60,58,64]'))
  .phase("p3", {
    duration: 1800,
    title: "持ち直す",
    body: "今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。",
  }, (p: PhaseBuilder) => p.activate("curCard", "prevCard", "deltaCard", "histCard").set("cur", 82).set("prev", 75).set("hist", '[60,65,70,75,80,82]'))
  .build();
export const subtitle__npsTrendKpi = "NPS current + delta + sparkline を 3-lane (Current / Delta / History) 分散 + kpiTrendTile readout 併存";

/**
 * 111. quick-poll-emoji = 3 emoji reaction poll を 3-lane 分散 + quickPollEmoji readout 併存。 iteration 6 wave 5、 pattern taxonomy § 3 category split。
 */
export const postReactionPoll = diagram("interactive-post-reaction-poll", {
  topic: "絵文字 3 種の投票を並べる",
})
  .lane("thumbs", { x: 0, width: 240 })
  .lane("heart", { x: 280, width: 240 })
  .lane("party", { x: 560, width: 240 })
  .arraySignal("votes", [["👍", 42], ["❤️", 28], ["🎉", 15]] as unknown as (string | number)[])
  .node("thumbsCard", { lane: "thumbs", stack: 0, kind: "card", title: "👍 Thumbs", subtitle: "票が最も多い絵文字" })
  .node("heartCard", { lane: "heart", stack: 0, kind: "card", title: "❤️ Heart", subtitle: "次に多い絵文字" })
  .node("partyCard", { lane: "party", stack: 0, kind: "card", title: "🎉 Party", subtitle: "票が最も少ない絵文字" })
  .readout.quickPollEmoji("qp", { source: "votes", colorWinner: "#2563eb", label: "Reactions" })
  .phase("p1", {
    duration: 1800,
    title: "票が入り始める",
    body: "票がまだ少ない。 最も多いものに枠が付き、他の 2 つとは色が変わる。",
  }, (p: PhaseBuilder) => p.activate("thumbsCard").set("votes", '[["👍",3],["❤️",2],["🎉",1]]'))
  .phase("p2", {
    duration: 1800,
    title: "票が集まる",
    body: "差が開く。 枠が付くのは最も多い 1 つだけで、位置は動かない。",
  }, (p: PhaseBuilder) => p.activate("thumbsCard", "heartCard").set("votes", '[["👍",12],["❤️",7],["🎉",4]]'))
  .phase("p3", {
    duration: 1800,
    title: "締め切り",
    body: "3 種の差が最も開く。 枠の位置は動かず、中の数だけが上がる形で落ち着く。",
  }, (p: PhaseBuilder) => p.activate("thumbsCard", "heartCard", "partyCard").set("votes", '[["👍",42],["❤️",28],["🎉",15]]'))
  .build();
export const subtitle__postReactionPoll = "3 emoji reaction poll (👍/❤️/🎉) を 3-lane 分散 + quickPollEmoji readout 併存";

/**
 * 112. voice-message = 音声メッセージ再生 UI を 3-lane (送信者 / 波形 / 再生) dense sequence 分散 + voiceMessage readout 併存 + 3 phase 動き (受信 → 再生中 tween → 完了)。 iteration 7 wave 1、 pattern taxonomy § 7 dense sequence。
 */
export const voiceMessagePlayback = diagram("interactive-voice-message-playback", {
  topic: "音声メッセージの波形と再生位置を見せる",
})
  .lane("sender", { x: 0, width: 200 })
  .lane("wave", { x: 240, width: 260 })
  .lane("play", { x: 540, width: 220 })
  .arraySignal("amps", [0.2, 0.4, 0.7, 0.9, 0.6, 0.3, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.4])
  .state("progress", { initial: 0 })
  .node("senderCard", { lane: "sender", stack: 0, kind: "card", title: "送り主", subtitle: "録音した人" })
  .node("waveCard", { lane: "wave", stack: 0, kind: "card", title: "波形", subtitle: "音の大小が棒の高さになる" })
  .node("playCard", { lane: "play", stack: 0, kind: "card", title: "再生", subtitle: "左から順に色が付く波形" })
  .node("progressCard", { lane: "play", stack: 1, kind: "card", title: "進み具合", subtitle: "色の付いた本数を決める割合" })
  .edge("senderCard", "waveCard", { label: "録音", tone: "info" })
  .edge("waveCard", "playCard", { label: "再生", tone: "success" })
  .readout.voiceMessage("vm", { source: "amps", progressSource: "progress", duration: 23, colorPlay: "#2563eb", colorBar: "#cbd5e1", label: "音声メモ" })
  .phase("p1", {
    duration: 1800,
    title: "受信した直後",
    body: "棒が 15 本並ぶが、どれも灰のまま。 進み具合が 0 の間は色が 1 本も付かない。",
  }, (p: PhaseBuilder) => p.activate("senderCard", "waveCard").set("progress", 0).badge("受信"))
  .phase("p2", {
    duration: 1800,
    title: "半ばまで再生",
    body: "左から半分の棒に色が付く。 棒の高さは変わらず、色の境目だけが右へ動く。",
  }, (p: PhaseBuilder) => p.activate("senderCard", "waveCard", "playCard").set("progress", 0.5).badge("再生中"))
  .phase("p3", {
    duration: 1800,
    title: "再生完了",
    body: "15 本すべてに色が付く。 進み具合が 1 になると境目が右端まで届く。",
  }, (p: PhaseBuilder) => p.activate("senderCard", "waveCard", "playCard", "progressCard").set("progress", 1).badge("完了"))
  .build();
export const subtitle__voiceMessagePlayback = "音声メッセージ再生 (波形 15 バー + 再生 progress) を 3-lane 分散 + voiceMessage readout 併存、 3 phase で受信 → 再生中 tween → 完了の動きを可視化";

/**
 * 113. thread-summary = 会話スレッド概要を 3-lane (未読 / 参加者 / 直近) category split 分散 + threadSummary readout 併存 + 3 phase 動き (静か → 新着 tween → 混雑)。 iteration 7 wave 1、 pattern taxonomy § 3 category split。
 */
export const teamThreadSummary = diagram("interactive-team-thread-summary", {
  topic: "スレッドの未読 / 参加者 / 経過をまとめる",
})
  .lane("unread", { x: 0, width: 220 })
  .lane("participants", { x: 260, width: 220 })
  .lane("activity", { x: 520, width: 260 })
  .arraySignal("thread", [5, 8, "Alice", "12 分前"] as unknown as (string | number)[])
  .node("unreadCard", { lane: "unread", stack: 0, kind: "card", title: "未読", subtitle: "赤い丸の中に出る数" })
  .node("partCard", { lane: "participants", stack: 0, kind: "card", title: "参加者", subtitle: "話している人数" })
  .node("authorCard", { lane: "activity", stack: 0, kind: "card", title: "直近の発言者", subtitle: "最後に書いた人の名前" })
  .node("timeCard", { lane: "activity", stack: 1, kind: "card", title: "経過", subtitle: "最後の書き込みからの経過" })
  .edge("unreadCard", "authorCard", { label: "帰属", tone: "info" })
  .edge("partCard", "authorCard", { label: "所属", tone: "teal" })
  .readout.threadSummary("ts", { source: "thread", colorUnread: "#ef4444", label: "スレッド概要" })
  .phase("p1", {
    duration: 1800,
    title: "静かなスレッド",
    body: "未読が 0。 未読が 0 の間は赤い丸そのものが出ないため、人数と経過だけが並ぶ。",
  }, (p: PhaseBuilder) => p.activate("partCard").set("thread", '[0,4,"Bob","2 時間前"]').badge("静か"))
  .phase("p2", {
    duration: 1800,
    title: "新着が付く",
    body: "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。",
  }, (p: PhaseBuilder) => p.activate("unreadCard", "partCard", "authorCard").set("thread", '[3,6,"Carol","25 分前"]').badge("新着"))
  .phase("p3", {
    duration: 1800,
    title: "混雑する",
    body: "未読が 5 件に増える。 丸の大きさは変わらず、中の数と 3 行の文字だけが動く。",
  }, (p: PhaseBuilder) => p.activate("unreadCard", "partCard", "authorCard", "timeCard").set("thread", '[5,8,"Alice","12 分前"]').badge("混雑"))
  .build();
export const subtitle__teamThreadSummary = "チームスレッド概要 (未読 / 参加者 / 直近 author / 経過時間) を 3-lane 分散 + threadSummary readout 併存、 3 phase で静か → 新着 tween → 混雑の動きを可視化";

/**
 * 114. read-receipt = message 既読状態遷移を 3-lane (送信 / 配信 / 既読) state-driven visibility 分散 + readReceipt readout 併存 + 3 phase 動き (送信 → 配信 → 既読 の状態切替)。 iteration 7 wave 1、 pattern taxonomy § 2 state-driven visibility。
 */
export const dmReadReceipt = diagram("interactive-dm-read-receipt", {
  topic: "DM の送信 / 配信 / 既読を段階で見せる",
})
  .lane("sent", { x: 0, width: 300 })
  .lane("delivered", { x: 340, width: 320 })
  .lane("read", { x: 700, width: 320 })
  .state("status", { initial: 0 })
  .node("sentCard", { lane: "sent", stack: 0, kind: "card", w: 250, title: "▶ 送信 (0)", subtitle: "単チェック · 灰 · 09:42" })
  .node("deliveredCard", { lane: "delivered", stack: 0, kind: "card", w: 270, title: "▶▶ 配信 (1)", subtitle: "二重チェック · 灰 · 09:43" })
  .node("readCard", { lane: "read", stack: 0, kind: "card", w: 270, title: "◆ 既読 (2)", subtitle: "二重チェック · 青 · 09:45" })
  .edge("sentCard", "deliveredCard", { label: "配信完了", tone: "info" })
  .edge("deliveredCard", "readCard", { label: "既読", tone: "success" })
  .readout.readReceipt("rr", { source: "status", colorRead: "#2563eb", colorPending: "#a08870", label: "既読状態" })
  .phase("p1", {
    duration: 1500,
    title: "送信",
    body: "status = 0、 送信 lane のみ active、 readout に灰の単チェック表示 (送信済 but 未配信)。",
  }, (p: PhaseBuilder) => p.activate("sentCard").set("status", 0).badge("送信"))
  .phase("p2", {
    duration: 1500,
    title: "配信完了",
    body: "status = 1 に切替、 配信 lane 追加 activate、 readout が灰の二重チェックに変化 (配信 but 未読)。",
  }, (p: PhaseBuilder) => p.activate("sentCard", "deliveredCard").set("status", 1).badge("配信"))
  .phase("p3", {
    duration: 1500,
    title: "既読",
    body: "status = 2 に切替、 既読 lane 追加 activate、 readout の二重チェックが青に変化 (既読確認)。",
  }, (p: PhaseBuilder) => p.activate("sentCard", "deliveredCard", "readCard").set("status", 2).badge("既読"))
  .build();
export const subtitle__dmReadReceipt = "DM 既読状態 (0=送信 / 1=配信 / 2=既読) を 3-lane state 別分散 + readReceipt readout 併存、 3 phase で状態遷移の動きを可視化";

/**
 * 115. password-strength = パスワード強度 5 段階を 3-lane (入力 / メーター / ルール) rank-based split 分散 + passwordStrength readout 併存 + 3 phase 動き (弱 → tween → 強)。 iteration 7 wave 2、 pattern taxonomy § 4 rank-based split。
 */
export const formPasswordCheck = diagram("interactive-form-password-check", {
  topic: "パスワードの強度を 5 段階で見せる",
})
  .lane("input", { x: 0, width: 220 })
  .lane("meter", { x: 260, width: 260 })
  .lane("rules", { x: 560, width: 260 })
  .state("pw", { initial: 1 })
  .node("pwField", { lane: "input", stack: 0, kind: "card", title: "◆ password", subtitle: "現在 level {pw} · マスク表示" })
  .node("meterBars", { lane: "meter", stack: 0, kind: "card", title: "4 セグメント メーター", subtitle: "level {pw} 分だけ着色" })
  .node("levelLabel", { lane: "meter", stack: 1, kind: "card", title: "level ラベル", subtitle: "メーター色と同色 tint" })
  .node("rule1", { lane: "rules", stack: 0, kind: "card", title: "✓ 8 文字以上", subtitle: "level ≥ 1 で pass" })
  .node("rule2", { lane: "rules", stack: 1, kind: "card", title: "✓ 大小混合", subtitle: "level ≥ 2 で pass" })
  .node("rule3", { lane: "rules", stack: 2, kind: "card", title: "✓ 数字 + 記号", subtitle: "level ≥ 3 で pass" })
  .edge("pwField", "meterBars", { label: "評価", tone: "info" })
  .edge("meterBars", "levelLabel", { label: "注釈", tone: "success" })
  .readout.passwordStrength("ps", { source: "pw", colorStrong: "#22c55e", colorWeak: "#ef4444", label: "強度" })
  .phase("p1", {
    duration: 1500,
    title: "弱い (level 1)",
    body: "初期入力、 pw = 1、 meter 1 セグメント赤、 rule1 のみ pass、 入力 + メーター lane が active。",
  }, (p: PhaseBuilder) => p.activate("pwField", "meterBars", "rule1").set("pw", 1).badge("弱い"))
  .phase("p2", {
    duration: 2000,
    title: "改善中 (level 1 → 3)",
    body: "文字追加 + 大小混合、 pw を 1 → 3 まで tween、 meter が赤 → 橙 → 黄 → 黄緑と連続変化、 rule2 + rule3 追加 activate。",
  }, (p: PhaseBuilder) => p.activate("pwField", "meterBars", "levelLabel", "rule1", "rule2", "rule3").tween("pw", 1, 3).badge("改善中"))
  .phase("p3", {
    duration: 1500,
    title: "強い (level 4)",
    body: "数字 + 記号追加で pw = 4、 meter 全 4 セグメント緑、 全 rule pass、 6 node 全 active。",
  }, (p: PhaseBuilder) => p.activate("pwField", "meterBars", "levelLabel", "rule1", "rule2", "rule3").set("pw", 4).badge("強い"))
  .build();
export const subtitle__formPasswordCheck = "サインアップ画面の password 強度 5 段階を 3-lane 分散 + passwordStrength readout 併存、 3 phase で弱 → 中 tween → 強の連続改善を可視化";

/**
 * 116. otp-input = ログイン OTP 6 桁検証を 3-lane (SMS / 入力 / 検証) dense sequence 分散 + otpInput readout 併存 + 3 phase 動き (送信 → 入力 tween → 検証)。 iteration 7 wave 2、 pattern taxonomy § 7 dense sequence。
 */
export const loginOtpVerify = diagram("interactive-login-otp-verify", {
  topic: "OTP 6 桁の入力から検証までを追う",
})
  .lane("sent", { x: 0, width: 220 })
  .lane("entry", { x: 260, width: 260 })
  .lane("verify", { x: 560, width: 220 })
  .arraySignal("otp", [4, 8, 2, 1, 5, 7])
  .node("sentCard", { lane: "sent", stack: 0, kind: "card", title: "SMS 送信", subtitle: "6 桁の符号を送る" })
  .node("entryCard", { lane: "entry", stack: 0, kind: "card", title: "6 つの枠", subtitle: "0-9 以外は空欄になる" })
  .node("focusHint", { lane: "entry", stack: 1, kind: "card", title: "次に入れる枠", subtitle: "空欄の先頭が青枠になる" })
  .node("verifyCard", { lane: "verify", stack: 0, kind: "card", title: "検証", subtitle: "6 つ埋まると送る" })
  .edge("sentCard", "entryCard", { label: "ユーザ入力", tone: "info" })
  .edge("entryCard", "verifyCard", { label: "自動送信", tone: "success" })
  .readout.otpInput("oi", { source: "otp", colorFocus: "#2563eb", label: "OTP コード" })
  .phase("p1", {
    duration: 1800,
    title: "送った直後",
    body: "6 つの枠がすべて空。 0-9 の外の値は空欄として描かれるため、-1 を並べると空になる。",
  }, (p: PhaseBuilder) => p.activate("sentCard").set("otp", '[-1,-1,-1,-1,-1,-1]').badge("送信"))
  .phase("p2", {
    duration: 1800,
    title: "3 つ入れる",
    body: "左から 3 つが埋まる。 埋まった枠に数が出て、次に入れる枠が青枠で示される。",
  }, (p: PhaseBuilder) => p.activate("sentCard", "entryCard", "focusHint").set("otp", '[4,8,2,-1,-1,-1]').badge("入力中"))
  .phase("p3", {
    duration: 1800,
    title: "6 つ揃う",
    body: "6 つとも埋まる。 空欄が無くなり青枠も消え、そのまま送る形になる。",
  }, (p: PhaseBuilder) => p.activate("sentCard", "entryCard", "focusHint", "verifyCard").set("otp", '[4,8,2,1,5,7]').badge("検証完了"))
  .build();
export const subtitle__loginOtpVerify = "OTP ログイン 6 桁検証を 3-lane 分散 + otpInput readout 併存、 3 phase で SMS 送信 → 入力 tween → 自動送信の連続動作を可視化";

/**
 * 117. file-dropzone = プロフィール画像アップロードを 3 区画 (未選択 / アップロード / プレビュー) 2 列 2 段の state-driven visibility 分散 + fileDropzone readout 併存 + 3 phase 動き (未選択 → drop → プレビュー)。 iteration 7 wave 2、 pattern taxonomy § 2 state-driven visibility。
 */
export const profileAvatarUpload = diagram("interactive-profile-avatar-upload", {
  topic: "画像の選択から反映までを追う",
})
  .lane("col1", { x: 0, width: 330 })
  .lane("col2", { x: 370, width: 360 })
  .state("file", { initial: "" })
  .node("emptyCard", { lane: "col1", stack: 0, kind: "card", w: 280, title: "未選択", subtitle: "破線枠 · '⬆ ここにドロップ'" })
  .node("uploadedCard", { lane: "col2", stack: 0, kind: "card", w: 310, title: "◆ avatar.png", subtitle: "実線枠 · ファイル名カード" })
  .node("previewCard", { lane: "col1", stack: 1, kind: "card", w: 220, title: "▶ 円形アバター", subtitle: "80×80 クロップ表示" })
  .edge("emptyCard", "uploadedCard", { label: "drop", tone: "info" })
  .edge("uploadedCard", "previewCard", { label: "プレビュー", tone: "success" })
  .readout.fileDropzone("fd", { source: "file", colorActive: "#2563eb", label: "アバター ファイル" })
  .phase("p1", {
    duration: 1500,
    title: "未選択",
    body: "file = ''、 未選択の card のみ active、 dropzone は破線枠 + '⬆ ここにドロップ' のプロンプト表示。",
  }, (p: PhaseBuilder) => p.activate("emptyCard").set("file", "").badge("未選択"))
  .phase("p2", {
    duration: 2000,
    title: "ドロップ受信",
    body: "file を空 → 'avatar.png' に切替、 アップロードの card を追加 activate、 dropzone が実線枠 + ファイル名カード表示に変化。",
  }, (p: PhaseBuilder) => p.activate("emptyCard", "uploadedCard").set("file", "avatar.png").badge("アップロード"))
  .phase("p3", {
    duration: 1500,
    title: "プレビュー表示",
    body: "アップロード完了、 プレビューの card を追加 activate、 円形クロップされたアバターが表示、 3 node 全 highlight。",
  }, (p: PhaseBuilder) => p.activate("emptyCard", "uploadedCard", "previewCard").set("file", "avatar.png").badge("完了"))
  .build();
export const subtitle__profileAvatarUpload = "プロフィール画像アップロードを 3 区画 2 列 2 段に分散 + fileDropzone readout 併存、 3 phase で未選択 → drop → プレビュー表示の状態遷移を可視化";

/**
 * 118. log-stream = 本番ログ tail を 3-lane (時刻 / レベル / メッセージ) dense sequence 分散 + logStream readout 併存 + 3 phase 動き (通常 → 警告 tween → 障害)。 iteration 7 wave 3、 pattern taxonomy § 7 dense sequence。
 */
export const prodLogTail = diagram("interactive-prod-log-tail", {
  topic: "本番ログ直近 5 行を重要度付きで流す",
})
  .lane("ts", { x: 0, width: 180 })
  .lane("level", { x: 200, width: 140 })
  .lane("msg", { x: 360, width: 340 })
  .arraySignal("logs", [
    ["09:00:12", 1, "server 起動完了"],
    ["09:00:15", 1, "db connection pool 20"],
    ["09:01:03", 2, "メモリ使用率 82%"],
    ["09:01:47", 3, "worker crash: OOM"],
    ["09:02:02", 1, "worker 再起動 ok"],
  ] as unknown as (string | number)[])
  .node("tsCard", { lane: "ts", stack: 0, kind: "card", title: "時刻列", subtitle: "行の左端に出る時刻" })
  .node("levelCard", { lane: "level", stack: 0, kind: "card", title: "レベル列", subtitle: "札の色を決める重さ" })
  .node("infoRow", { lane: "msg", stack: 0, kind: "card", title: "情報の行", subtitle: "情報を表す札 (青)" })
  .node("warnRow", { lane: "msg", stack: 1, kind: "card", title: "注意の行", subtitle: "注意を表す札 (橙)" })
  .node("errRow", { lane: "msg", stack: 2, kind: "card", title: "異常の行", subtitle: "異常を表す札 (赤)" })
  .edge("tsCard", "levelCard", { label: "分類", tone: "info" })
  .edge("levelCard", "errRow", { label: "重篤化", tone: "error" })
  .readout.logStream("ls", { source: "logs", label: "ログ tail" })
  .phase("p1", {
    duration: 1800,
    title: "通常運転",
    body: "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。",
  }, (p: PhaseBuilder) => p.activate("tsCard", "levelCard", "infoRow").set("logs", '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"]]').badge("通常"))
  .phase("p2", {
    duration: 1800,
    title: "注意が出る",
    body: "橙の札が付いた行が混じる。 本文が 24 文字を超える行は末尾を省いて出る。",
  }, (p: PhaseBuilder) => p.activate("tsCard", "levelCard", "infoRow", "warnRow").set("logs", '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"]]').badge("警告"))
  .phase("p3", {
    duration: 1800,
    title: "異常が出る",
    body: "行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。",
  }, (p: PhaseBuilder) => p.activate("tsCard", "levelCard", "infoRow", "warnRow", "errRow").set("logs", '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"],["09:02:30",1,"health check ok"]]').badge("障害"))
  .build();
export const subtitle__prodLogTail = "本番ログ tail (直近 5 行 + レベル別 pill) を 3-lane 分散 + logStream readout 併存、 3 phase で通常 → 警告 tween → 障害の重篤度昇華を可視化";

/**
 * 119. alert-banner = 重要度別 alert banner を 3-lane (トリガー / 重要度 / アクション) state-driven visibility 分散 + alertBanner readout 併存 + 3 phase 動き (info → warn tween → error エスカレーション)。 iteration 7 wave 3、 pattern taxonomy § 2 state-driven visibility。
 */
export const opsAlertBanner = diagram("interactive-ops-alert-banner", {
  topic: "運用通知を情報 / 注意 / 異常で出し分ける",
})
  .lane("trigger", { x: 0, width: 240 })
  .lane("severity", { x: 280, width: 240 })
  .lane("action", { x: 560, width: 220 })
  .arraySignal("alert", [2, "CPU 92% を 5 分継続 — 調査要"] as unknown as (string | number)[])
  .node("triggerCard", { lane: "trigger", stack: 0, kind: "card", title: "きっかけ", subtitle: "本文になる出来事" })
  .node("sevCard", { lane: "severity", stack: 0, kind: "card", title: "重要度", subtitle: "帯の色を決める重さ" })
  .node("iconCard", { lane: "severity", stack: 1, kind: "card", title: "重要度の印", subtitle: "重要度で ℹ / ⚠ / ✕ が変わる" })
  .node("actionCard", { lane: "action", stack: 0, kind: "card", title: "対応", subtitle: "受け取った人が動く" })
  .edge("triggerCard", "sevCard", { label: "分類", tone: "info" })
  .edge("sevCard", "actionCard", { label: "通知", tone: "warning" })
  .readout.alertBanner("ab", { source: "alert", label: "アラート" })
  .phase("p1", {
    duration: 1800,
    title: "軽微な知らせ",
    body: "重要度が最も低い。 帯は青で、印は情報を表す形になる。",
  }, (p: PhaseBuilder) => p.activate("triggerCard", "sevCard").set("alert", '[0,"CPU 68% — 通常の範囲"]').badge("info"))
  .phase("p2", {
    duration: 1800,
    title: "注意に上がる",
    body: "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。",
  }, (p: PhaseBuilder) => p.activate("triggerCard", "sevCard", "iconCard").set("alert", '[2,"CPU 92% を 5 分継続 — 調査要"]').badge("warn"))
  .phase("p3", {
    duration: 1800,
    title: "異常に上がる",
    body: "重要度が最大になり帯が赤くなる。 本文が 32 文字を超えると末尾を省いて出る。",
  }, (p: PhaseBuilder) => p.activate("triggerCard", "sevCard", "iconCard", "actionCard").set("alert", '[3,"prod-web-3 応答なし — 全系統の切替が要る"]').badge("error"))
  .build();
export const subtitle__opsAlertBanner = "運用 alert 重要度別 banner (info / warn / error) を 3-lane 分散 + alertBanner readout 併存、 3 phase で info → warn tween → error のエスカレーションを可視化";

/**
 * 120. service-health = microservice health matrix を 3-lane (Up / Degraded / Down) category split 分散 + serviceHealth readout 併存。 iteration 7 wave 3、 pattern taxonomy § 3 category split。
 */
export const serviceHealthGrid = diagram("interactive-service-health-grid", {
  topic: "各サービスの稼働状態を一覧で見せる",
})
  .lane("up", { x: 0, width: 240 })
  .lane("deg", { x: 280, width: 240 })
  .lane("down", { x: 560, width: 240 })
  .arraySignal("svcs", [
    ["api", 2],
    ["web", 2],
    ["auth", 2],
    ["db", 1],
    ["cache", 1],
    ["queue", 0],
  ] as unknown as (string | number)[])
  .node("apiCard", { lane: "up", stack: 0, kind: "card", title: "api", subtitle: "稼働を表す緑のマス" })
  .node("webCard", { lane: "up", stack: 1, kind: "card", title: "web", subtitle: "稼働を表す緑のマス" })
  .node("authCard", { lane: "up", stack: 2, kind: "card", title: "auth", subtitle: "稼働を表す緑のマス" })
  .node("dbCard", { lane: "deg", stack: 0, kind: "card", title: "db", subtitle: "劣化を表す黄のマス" })
  .node("cacheCard", { lane: "deg", stack: 1, kind: "card", title: "cache", subtitle: "劣化を表す黄のマス" })
  .node("queueCard", { lane: "down", stack: 0, kind: "card", title: "queue", subtitle: "停止を表す赤のマス" })
  .edge("dbCard", "queueCard", { label: "波及", tone: "error" })
  .readout.serviceHealth("sh", { source: "svcs", label: "サービス (6)" })
  .phase("p1", {
    duration: 1800,
    title: "全て稼働",
    body: "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。",
  }, (p: PhaseBuilder) => p.activate("apiCard", "webCard", "authCard").set("svcs", '[["api",2],["web",2],["auth",2],["db",2],["cache",2],["queue",2]]').badge("全稼働"))
  .phase("p2", {
    duration: 1800,
    title: "一部が劣化",
    body: "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。",
  }, (p: PhaseBuilder) => p.activate("apiCard", "webCard", "authCard", "dbCard", "cacheCard").set("svcs", '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",2]]').badge("劣化"))
  .phase("p3", {
    duration: 1800,
    title: "1 つが停止",
    body: "最後の 1 つが赤になる。 緑 3 と黄 2 と赤 1 の内訳が、色を数えて読み取れる。",
  }, (p: PhaseBuilder) => p.activate("apiCard", "webCard", "authCard", "dbCard", "cacheCard", "queueCard").set("svcs", '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]').badge("障害"))
  .build();
export const subtitle__serviceHealthGrid = "microservice health matrix (up/degraded/down status per service) を 3-lane (Up / Degraded / Down) category split 分散 + serviceHealth readout 併存";

/**
 * 121. cart-summary = ショッピングカート小計を 3-lane (商品 / 内訳 / 合計) rank-based split 分散 + cartSummary readout 併存 + 3 phase 動き (商品追加 tween → 送料計算 → 合計確定)。 iteration 7 wave 4、 pattern taxonomy § 4 rank-based split。
 */
export const checkoutCartSummary = diagram("interactive-checkout-cart-summary", {
  topic: "カートの小計から合計までを積み上げる",
})
  .lane("items", { x: 0, width: 220 })
  .lane("costs", { x: 260, width: 260 })
  .lane("total", { x: 560, width: 240 })
  .arraySignal("cart", [3, 149.85, 8.5, 158.35])
  .node("itemsCard", { lane: "items", stack: 0, kind: "card", title: "商品数", subtitle: "カートに入れた点数" })
  .node("subtotalCard", { lane: "costs", stack: 0, kind: "card", title: "小計", subtitle: "話している人数" })
  .node("shippingCard", { lane: "costs", stack: 1, kind: "card", title: "送料", subtitle: "最後に書いた人の名前" })
  .node("totalCard", { lane: "total", stack: 0, kind: "card", title: "合計", subtitle: "末尾の行 · 太字と青で出る" })
  .edge("itemsCard", "subtotalCard", { label: "集計", tone: "info" })
  .edge("subtotalCard", "totalCard", { label: "+送料", tone: "success" })
  .edge("shippingCard", "totalCard", { label: "加算", tone: "info" })
  .readout.cartSummary("cs", { source: "cart", currency: "$", colorTotal: "#2563eb", label: "カート合計" })
  .phase("p1", {
    duration: 1800,
    title: "1 点だけ入れる",
    body: "4 行が並ぶ。 金額はどれも小数 2 桁で出るため、整数を渡しても末尾が 0 で揃う。",
  }, (p: PhaseBuilder) => p.activate("itemsCard", "subtotalCard").set("cart", '[1,49.9,8.5,58.4]').badge("小計"))
  .phase("p2", {
    duration: 1800,
    title: "点数を増やす",
    body: "小計が上がり合計も動く。 送料は変わらないため、3 行目だけが同じ値のまま残る。",
  }, (p: PhaseBuilder) => p.activate("itemsCard", "subtotalCard", "shippingCard").set("cart", '[2,99.9,8.5,108.4]').badge("送料"))
  .phase("p3", {
    duration: 1800,
    title: "確定する",
    body: "合計が最も大きくなる。 最後の行だけ太字と青で出て、他の 3 行と区別される。",
  }, (p: PhaseBuilder) => p.activate("itemsCard", "subtotalCard", "shippingCard", "totalCard").set("cart", '[3,149.85,8.5,158.35]').badge("合計"))
  .build();
export const subtitle__checkoutCartSummary = "ショッピングカート小計 (商品 / 小計 / 送料 / 合計) を 3-lane 分散 + cartSummary readout 併存、 3 phase で商品追加 tween → 送料計算 → 合計確定の連続動作を可視化";

/**
 * 122. pricing-tier = SaaS 料金プラン (3 tier 比較) を 3-lane (Starter / Pro / Enterprise) category split 分散 + pricingTier readout 併存 + 3 phase 動き (Starter → Pro tween → Enterprise 検討)。 iteration 7 wave 4、 pattern taxonomy § 3 category split。
 */
export const saasPricingTier = diagram("interactive-saas-pricing-tier", {
  topic: "料金 3 プランを並べて比べる",
})
  .lane("starter", { x: 0, width: 240 })
  .lane("pro", { x: 280, width: 240 })
  .lane("enterprise", { x: 560, width: 260 })
  .arraySignal("plan", ["Pro", 29, "10 席", "優先サポート", "カスタムドメイン"] as unknown as (string | number)[])
  .node("starterCard", { lane: "starter", stack: 0, kind: "card", title: "Starter", subtitle: "最も安いプラン" })
  .node("proCard", { lane: "pro", stack: 0, kind: "card", title: "Pro", subtitle: "中間のプラン" })
  .node("proBadge", { lane: "pro", stack: 1, kind: "card", title: "特典の欄", subtitle: "名前と価格の後に並ぶ特典" })
  .node("enterpriseCard", { lane: "enterprise", stack: 0, kind: "card", title: "Enterprise", subtitle: "最も高いプラン" })
  .edge("starterCard", "proCard", { label: "アップグレード", tone: "info" })
  .edge("proCard", "enterpriseCard", { label: "アップグレード", tone: "success" })
  .readout.pricingTier("pt", { source: "plan", colorAccent: "#2563eb", currency: "$", label: "プラン" })
  .phase("p1", {
    duration: 1800,
    title: "最も安いプラン",
    body: "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。",
  }, (p: PhaseBuilder) => p.activate("starterCard").set("plan", '["Starter",9,"3 席"]').badge("Starter"))
  .phase("p2", {
    duration: 1800,
    title: "中間のプラン",
    body: "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。",
  }, (p: PhaseBuilder) => p.activate("starterCard", "proCard", "proBadge").set("plan", '["Pro",29,"10 席","優先サポート","カスタムドメイン"]').badge("Pro"))
  .phase("p3", {
    duration: 1800,
    title: "最も高いプラン",
    body: "特典を 5 つ渡しても出るのは **先頭 3 つ** まで。 4 つ目以降は表示に載らない。",
  }, (p: PhaseBuilder) => p.activate("starterCard", "proCard", "proBadge", "enterpriseCard").set("plan", '["Enterprise",99,"無制限の席","専任の担当","監査ログ","SSO 連携","SLA 保証"]').badge("比較"))
  .build();
export const subtitle__saasPricingTier = "SaaS 料金 3 tier (Starter / Pro / Enterprise) を 3-lane 分散 + pricingTier readout 併存、 3 phase で Starter 検討 → Pro 選択 tween → 比較完了の動きを可視化";

/**
 * 123. coupon-code = チェックアウト クーポン適用フローを 3-lane (未入力 / 入力済 / 適用済) state-driven visibility 分散 + couponCode readout 併存 + 3 phase 動き (未入力 → 入力 → 適用 tween)。 iteration 7 wave 4、 pattern taxonomy § 2 state-driven visibility。
 */
export const checkoutCouponApply = diagram("interactive-checkout-coupon-apply", {
  topic: "クーポンの未入力から適用までを追う",
})
  .lane("empty", { x: 0, width: 240 })
  .lane("entered", { x: 280, width: 240 })
  .lane("applied", { x: 560, width: 240 })
  .arraySignal("coupon", ["SAVE20", 20] as unknown as (string | number)[])
  .node("emptyCard", { lane: "empty", stack: 0, kind: "card", title: "未入力", subtitle: "符号が空の状態" })
  .node("enteredCard", { lane: "entered", stack: 0, kind: "card", title: "入力済", subtitle: "符号は入ったが割引がまだ無い" })
  .node("applyBtn", { lane: "entered", stack: 1, kind: "card", title: "適用ボタン", subtitle: "押すと割引が入る" })
  .node("appliedCard", { lane: "applied", stack: 0, kind: "card", title: "適用済", subtitle: "割引が正になり緑の札が出る" })
  .edge("emptyCard", "enteredCard", { label: "コード入力", tone: "info" })
  .edge("enteredCard", "appliedCard", { label: "適用", tone: "success" })
  .readout.couponCode("cc", { source: "coupon", colorApplied: "#22c55e", label: "クーポン" })
  .phase("p1", {
    duration: 1800,
    title: "未入力",
    body: "符号が空で割引も 0。 入力を促す表示だけが出て、割引の札は現れない。",
  }, (p: PhaseBuilder) => p.activate("emptyCard").set("coupon", '["",0]').badge("未入力"))
  .phase("p2", {
    duration: 1800,
    title: "符号を入れる",
    body: "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。",
  }, (p: PhaseBuilder) => p.activate("emptyCard", "enteredCard", "applyBtn").set("coupon", '["SAVE20",0]').badge("入力済"))
  .phase("p3", {
    duration: 1800,
    title: "適用する",
    body: "割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。",
  }, (p: PhaseBuilder) => p.activate("emptyCard", "enteredCard", "applyBtn", "appliedCard").set("coupon", '["SAVE20",20]').badge("適用"))
  .build();
export const subtitle__checkoutCouponApply = "チェックアウト クーポン適用フロー (未入力 → 入力 → 適用) を 3-lane state 分散 + couponCode readout 併存、 3 phase で discount 0 → 20% tween を可視化";

/**
 * 124. article-preview = ブログ記事プレビュー card を 3-lane (サムネ / 本文 / メタ) category split 分散 + articlePreview readout 併存 + 3 phase 動き (初期表示 → hover tween → クリック)。 iteration 7 wave 5、 pattern taxonomy § 3 category split。
 */
export const blogArticlePreview = diagram("interactive-blog-article-preview", {
  topic: "記事カードの見出しと抜粋と著者を並べる",
})
  .lane("thumb", { x: 0, width: 200 })
  .lane("content", { x: 220, width: 320 })
  .lane("meta", { x: 560, width: 220 })
  .arraySignal("article", ["dragon 入門", "dragon で interactive diagram を作る方法を解説", "Alice", "2 時間前"] as unknown as (string | number)[])
  .node("thumbCard", { lane: "thumb", stack: 0, kind: "card", title: "サムネイル", subtitle: "配列の値に依らず固定" })
  .node("titleCard", { lane: "content", stack: 0, kind: "card", title: "タイトル", subtitle: "長いと末尾を省いて出る見出し" })
  .node("excerptCard", { lane: "content", stack: 1, kind: "card", title: "抜粋", subtitle: "折り返して出る本文" })
  .node("authorCard", { lane: "meta", stack: 0, kind: "card", title: "著者", subtitle: "最後に書いた人の名前" })
  .node("timeCard", { lane: "meta", stack: 1, kind: "card", title: "経過", subtitle: "最後の書き込みからの経過" })
  .edge("thumbCard", "titleCard", { label: "視線", tone: "info" })
  .edge("titleCard", "authorCard", { label: "帰属", tone: "success" })
  .readout.articlePreview("ap", { source: "article", colorAccent: "#2563eb", label: "記事 card" })
  .phase("p1", {
    duration: 1800,
    title: "短い記事",
    body: "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。",
  }, (p: PhaseBuilder) => p.activate("thumbCard", "titleCard").set("article", '["入門","はじめの一歩","Bob","5 分前"]').badge("初期"))
  .phase("p2", {
    duration: 1800,
    title: "抜粋が伸びる",
    body: "抜粋が 2 行に折り返す。 28 文字ごとに区切られ、2 行目の末尾が省略される。",
  }, (p: PhaseBuilder) => p.activate("thumbCard", "titleCard", "excerptCard").set("article", '["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]').badge("hover"))
  .phase("p3", {
    duration: 1800,
    title: "題も伸びる",
    body: "題が 26 文字を超える。 題も末尾を省いて出るため、1 行に収まる形が保たれる。",
  }, (p: PhaseBuilder) => p.activate("thumbCard", "titleCard", "excerptCard", "authorCard", "timeCard").set("article", '["dragon で作る interactive diagram の完全ガイド 2026 年版","段ごとの変化と表示部品の連動を実例つきで最初から順に解説する長い記事","Carol","3 日前"]').badge("click"))
  .build();
export const subtitle__blogArticlePreview = "ブログ記事プレビュー card (タイトル / 抜粋 / 著者 / 経過) を 3-lane 分散 + articlePreview readout 併存、 3 phase で初期 → hover tween → 続きを読むの動きを可視化";

/**
 * 125. toc-nav = ドキュメント TOC (階層 3 段 + アクティブセクション) を 3-lane (H1 / H2 / H3) tree depth split 分散 + tocNav readout 併存 + 3 phase 動き (Intro → GS → First tween スクロール)。 iteration 7 wave 5、 pattern taxonomy § 8 tree depth split。
 */
export const docsTocNav = diagram("interactive-docs-toc-nav", {
  topic: "3 段の目次と現在位置を見せる",
})
  .lane("lvl0", { x: 0, width: 240 })
  .lane("lvl1", { x: 280, width: 260 })
  .lane("lvl2", { x: 560, width: 260 })
  .arraySignal("toc", [
    [0, "はじめに", 0],
    [1, "スタートガイド", 1],
    [2, "インストール", 0],
    [2, "最初の図", 1],
    [1, "高度な使い方", 0],
    [0, "API リファレンス", 0],
  ] as unknown as (string | number)[])
  .state("activeIdx", { initial: 0 })
  .node("introCard", { lane: "lvl0", stack: 0, kind: "card", title: "はじめに", subtitle: "最も浅い階層 · 字下げなし" })
  .node("apiCard", { lane: "lvl0", stack: 1, kind: "card", title: "API リファレンス", subtitle: "最も浅い階層 · 字下げなし" })
  .node("gsCard", { lane: "lvl1", stack: 0, kind: "card", title: "スタートガイド", subtitle: "中間の階層 · 少し字下げ" })
  .node("advCard", { lane: "lvl1", stack: 1, kind: "card", title: "高度な使い方", subtitle: "中間の階層 · 少し字下げ" })
  .node("installCard", { lane: "lvl2", stack: 0, kind: "card", title: "インストール", subtitle: "最も深い階層 · 大きく字下げ" })
  .node("firstCard", { lane: "lvl2", stack: 1, kind: "card", title: "最初の図", subtitle: "最も深い階層 · 大きく字下げ" })
  .edge("introCard", "gsCard", { label: "次へ", tone: "info" })
  .edge("gsCard", "installCard", { label: "子", tone: "accent" })
  .edge("gsCard", "firstCard", { label: "現在", tone: "success" })
  .readout.tocNav("tn", { source: "toc", colorActive: "#2563eb", label: "ドキュメント TOC" })
  .phase("p1", {
    duration: 1800,
    title: "先頭を読む",
    body: "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。",
  }, (p: PhaseBuilder) => p.activate("introCard").set("toc", '[[0,"はじめに",1],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("Intro"))
  .phase("p2", {
    duration: 1800,
    title: "下へ進む",
    body: "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。",
  }, (p: PhaseBuilder) => p.activate("introCard", "gsCard").set("toc", '[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("GS"))
  .phase("p3", {
    duration: 1800,
    title: "さらに下へ",
    body: "最も深い階層の行が青くなる。 6 行のうち出るのは先頭 6 行までで、字下げが 3 段に分かれる。",
  }, (p: PhaseBuilder) => p.activate("introCard", "apiCard", "gsCard", "advCard", "installCard", "firstCard").set("toc", '[[0,"はじめに",0],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("First"))
  .build();
export const subtitle__docsTocNav = "docs TOC (階層 3 段 + アクティブセクション) を 3-lane 分散 + tocNav readout 併存、 3 phase でスクロール進行によるアクティブセクション遷移を可視化";

/**
 * 126. share-buttons = ブログ記事 SNS シェアボタンを 3-lane (Twitter / Facebook / LinkedIn) dense sequence 分散 + shareButtons readout 併存 + 3 phase 動き (投稿直後 → 拡散 tween → バズ)。 iteration 7 wave 5、 iteration 完遂。 pattern taxonomy § 7 dense sequence。
 */
export const socialShareButtons = diagram("interactive-social-share-buttons", {
  topic: "SNS 4 種の共有ボタンを並べる",
})
  .lane("tw", { x: 0, width: 200 })
  .lane("fb", { x: 220, width: 200 })
  .lane("li", { x: 440, width: 200 })
  .arraySignal("shares", [["tw", 245], ["fb", 89], ["li", 32], ["rd", 18]] as unknown as (string | number)[])
  .node("twCard", { lane: "tw", stack: 0, kind: "card", title: "tw", subtitle: "共有が最も多い先" })
  .node("fbCard", { lane: "fb", stack: 0, kind: "card", title: "fb", subtitle: "次に多い先" })
  .node("liCard", { lane: "li", stack: 0, kind: "card", title: "li", subtitle: "中ほどの先" })
  .node("rdCard", { lane: "li", stack: 1, kind: "card", title: "rd", subtitle: "共有が最も少ない先" })
  .edge("twCard", "fbCard", { label: "拡散", tone: "info" })
  .edge("fbCard", "liCard", { label: "拡散", tone: "info" })
  .edge("liCard", "rdCard", { label: "拡散", tone: "info" })
  .readout.shareButtons("sb", { source: "shares", label: "シェア" })
  .phase("p1", {
    duration: 1800,
    title: "投稿した直後",
    body: "4 つのボタンが並び、数はどれも小さい。 ボタンの大きさは数に依らず一定。",
  }, (p: PhaseBuilder) => p.activate("twCard").set("shares", '[["tw",12],["fb",5],["li",3],["rd",1]]').badge("開始"))
  .phase("p2", {
    duration: 1800,
    title: "広まる",
    body: "数が桁 1 つぶん増える。 並びと色は変わらず、ボタンの中の数だけが上がる。",
  }, (p: PhaseBuilder) => p.activate("twCard", "fbCard", "liCard").set("shares", '[["tw",98],["fb",41],["li",17],["rd",8]]').badge("拡散"))
  .phase("p3", {
    duration: 1800,
    title: "落ち着く",
    body: "4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。",
  }, (p: PhaseBuilder) => p.activate("twCard", "fbCard", "liCard", "rdCard").set("shares", '[["tw",245],["fb",89],["li",32],["rd",18],["hn",6]]').badge("バズ"))
  .build();
export const subtitle__socialShareButtons = "ブログ記事 SNS シェア (Twitter / Facebook / LinkedIn / Reddit) を 3-lane 分散 + shareButtons readout 併存、 3 phase で拡散カウント 0 → 384 tween を可視化";

/**
 * 127. exemplar-payment-flow v2 = EC 決済の実業務シナリオ、 shape-* primitive (person / mobile / credit-card / online-shop / payment-provider / api-gateway / bank / cylinder) で visual scene 化、 4 phase (商品購入 → 3DS 認証 → 銀行確定 → 記帳) + 4 readout (stat 金額 / gauge 3DS / traffic-light 状態 / countup 累計) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 1。
 */
export const exemplarPaymentFlow = diagram("interactive-exemplar-payment-flow", {
  topic: "EC 決済を購入から記帳まで 4 段階で追う",
})
  .lane("customer", { x: 0, width: 220 })
  .lane("processor", { x: 240, width: 280 })
  .lane("bank", { x: 540, width: 220 })
  .state("amount", { initial: 0 })
  .state("auth3ds", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("totalTx", { initial: 1247 })
  .node("customer", { lane: "customer", stack: 0, kind: "shape-person", title: "田中様", eyebrow: "customer", subtitle: "購入者" })
  .node("mobile", { lane: "customer", stack: 1, kind: "shape-mobile-device", title: "iPhone", eyebrow: "device", subtitle: "Safari / iOS 17" })
  .node("card", { lane: "customer", stack: 2, kind: "shape-credit-card", title: "VISA **1234", eyebrow: "card", subtitle: "MUFG 発行" })
  .node("shop", { lane: "processor", stack: 0, kind: "shape-online-shop", title: "BuyNow", eyebrow: "merchant", subtitle: "checkout · ¥{amount}" })
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
    body: "田中様が iPhone で BuyNow にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。",
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
export const subtitle__exemplarPaymentFlow = "EC 決済実業務シナリオ = 4 phase (購入 → 3DS 認証 → 銀行確定 → 記帳) の flow を shape-* primitive 8 種で表現 + 4 readout が state を consume して visually 連続変化";

/**
 * 128. exemplar-login-flow v2 = 実 login 認証 + 2FA + セッション発行シナリオ、 shape-* primitive (mobile-device / person / server-rack / hexagon / diamond / cylinder / cloud) で visual scene 化、 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) + 4 readout (traffic-light / countup / gauge / bar) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 2。
 */
export const exemplarLoginFlow = diagram("interactive-exemplar-login-flow", {
  topic: "ログインと 2 要素認証を 5 段階で追う",
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
  .node("session", { lane: "session", stack: 0, kind: "shape-cylinder", title: "Redis", eyebrow: "cache", subtitle: "TTL 3600s" })
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
export const subtitle__exemplarLoginFlow = "login + 2FA 実業務シナリオ = 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して visually 連続変化";

/**
 * 129. exemplar-notification-flow v2 = 実 push 通知配信 (message → queue → service → fan-out → device / retry) シナリオ、 shape-* primitive (message-bubble / stack / cloud / diamond / mobile-device × 3) で visual scene 化、 5 phase (event 発火 → キューイング → 配信中 → 到達 → リトライ) + 4 readout (bar / countup / gauge / stat) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 3。
 */
export const exemplarNotificationFlow = diagram("interactive-exemplar-notification-flow", {
  topic: "通知配信を発火から再送まで 5 段階で追う",
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
  .node("iphone", { lane: "devices", stack: 0, kind: "shape-mobile-device", title: "iPhone", eyebrow: "device", subtitle: "APNs 経由 · foreground" })
  .node("pixel", { lane: "devices", stack: 1, kind: "shape-mobile-device", title: "Pixel", eyebrow: "device", subtitle: "FCM 経由 · background" })
  .node("galaxy", { lane: "devices", stack: 2, kind: "shape-mobile-device", title: "Galaxy", eyebrow: "device", subtitle: "圏外 → retry 対象" })
  .edge("msg", "kafka", { label: "enqueue", tone: "info" })
  .edge("kafka", "fcm", { label: "dequeue", tone: "info" })
  .edge("fcm", "iphone", {
    label: "APNs 配信",
    tone: "success",
    // 縦に走る区間の中点だと、 kafka → fcm の label と同じ高さ (y=438) に並んで 12px しか離れない。
    // 縦区間は y=272-604 と長いので上へ寄せる。 -160 まで動かすと折れ角に乗って自 path と接する。
    labelOffsetY: -120,
  })
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
export const subtitle__exemplarNotificationFlow = "push 通知配信 + retry 実業務シナリオ = 5 phase (発火 → キュー → 配信 → 到達 → retry) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して visually 連続変化";
