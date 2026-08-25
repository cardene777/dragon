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
  .node("sliderNode", {
    lane: "slider",
    stack: 0,
    kind: "card",
    title: "Slider",
    subtitle: "value = {value}",
  })
  .node("bar-node", {
    lane: "output",
    stack: 0,
    kind: "card",
    title: "Bar",
    subtitle: "value: {value}",
  })
  .edge("sliderNode", "bar-node", { label: "signal bind", tone: "info" })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "つまみを持つ",
      body: "左の縦列だけを見る。 つまみが `value` という値を握っていて、動かすとこの値が変わる。 まだ右の棒には届いていない。",
    },
    (p: PhaseBuilder) => p.activate("sliderNode"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "値が渡る",
      body: "つまみと右の箱を結ぶ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。",
    },
    (p: PhaseBuilder) => p.activate("sliderNode", "bar-node"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "説明欄に出る",
      body: "渡った値が右の箱の説明欄に出る。 図形の大きさは変わらず、文字として反映される経路。",
    },
    (p: PhaseBuilder) => p.activate("bar-node"),
  )
  .build();
export const subtitle__inputSliderBar =
  "input.slider bind の 2-lane (Slider signal / Bar node) + bind edge、 signal → subtitle 反映経路を可視化";

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
  .node("in", {
    lane: "input",
    stack: 0,
    kind: "card",
    title: "Input",
    subtitle: "value = {input}",
  })
  .node("out1", {
    lane: "doubled",
    stack: 0,
    kind: "card",
    title: "Doubled",
    subtitle: "input * 2 = {doubled}",
  })
  .node("out2", {
    lane: "halved",
    stack: 0,
    kind: "card",
    title: "Halved",
    subtitle: "input / 2 = {halved}",
  })
  .edge("in", "out1", { label: "× 2", tone: "success" })
  .edge("in", "out2", { label: "÷ 2", tone: "info" })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "元の値を置く",
      body: "左の箱に入力値を置く。 まだ計算式は動いていない。",
    },
    (p: PhaseBuilder) => p.activate("in"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "2 倍を出す",
      body: "1 つ目の計算式が元の値を 2 倍にして、右上の箱に書き出す。 元の値を変えると追いかける。",
    },
    (p: PhaseBuilder) => p.activate("in", "out1"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "半分も出す",
      body: "2 つ目の計算式が同じ元の値を半分にする。 元が 1 つ、そこから出る値が 2 つ。",
    },
    (p: PhaseBuilder) => p.activate("in", "out1", "out2"),
  )
  .build();
export const subtitle__formulaTextBind =
  "formula chain を 3-lane (Input / Doubled / Halved) 分散 + 2 dependency edge で dataflow network 化、 formula reactive を可視化";

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
  .phase(
    "p1",
    {
      duration: 1600,
      title: "1 箱で見る",
      body: "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。",
    },
    (p: PhaseBuilder) => p.activate("a"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "2 箱で見る",
      body: "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。",
    },
    (p: PhaseBuilder) => p.activate("a", "b"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "3 箱が同時に追う",
      body: "3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。",
    },
    (p: PhaseBuilder) => p.activate("a", "b", "c"),
  )
  .build();
export const subtitle__scrollNarrative =
  "scroll 0..1 progress を 3-lane (Step 1 / Step 2 / Step 3) step 別分散、 各 step 個別 lane、 scroll 進行が全 lane 同時追随";

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
  .node("btn", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Button",
    subtitle: "click target",
  })
  .node("handlerNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Handler",
    subtitle: "押した時と触れた時の受け取り手",
  })
  .node("signalNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 310,
    title: "Signal state",
    subtitle: "active = {active}",
  })
  .edge("btn", "handlerNode", { label: "click / hover", tone: "info" })
  .edge("handlerNode", "signalNode", { label: "toggle", tone: "success" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase(
    "p1",
    {
      duration: 1600,
      title: "押す前",
      body: "ボタンだけがある状態。 まだ何も起きていない。",
    },
    (p: PhaseBuilder) => p.activate("btn"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "受け取り手に結ぶ",
      body: "押した時に呼ぶ受け取り手を結び付ける。 受け取り手の中身は使う側が渡す。",
    },
    (p: PhaseBuilder) => p.activate("btn", "handlerNode"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "押すと値が変わる",
      body: "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。",
    },
    (p: PhaseBuilder) => p.activate("btn", "handlerNode", "signalNode"),
  )
  .build();
export const subtitle__clickToggle =
  "click event flow を 3 区画 (Trigger button / Event handler / Signal state) 2 列 2 段 + 2 edge、 click→handler→signal の 3 step dataflow";

/**
 * 5. visual binding = slider → node 実 width 変化 (arc-intro 相当の core UX)。
 * slider を drag すると bar node の SVG width が実際に伸縮、 subtitle だけでなく図形が動く。
 */
export const visualBindBar = diagram("interactive-visual-bar", {
  topic: "信号の値が棒の実際の幅に反映される",
})
  .lane("signal", { x: 0, width: 200 })
  .lane("bar-lane", { x: 240, width: 340 })
  .lane("readout", { x: 600, width: 220 })
  .input.slider("barW", { min: 40, max: 320, defaultValue: 160, label: "Bar width" })
  .state("barW", { initial: 160 })
  .node("signalNode", {
    lane: "signal",
    stack: 0,
    kind: "card",
    title: "Signal",
    subtitle: "barW = {barW}",
  })
  .node("bar", {
    lane: "bar-lane",
    stack: 0,
    kind: "card",
    title: "Bar",
    subtitle: "wBind = {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .node("readoutNode", {
    lane: "readout",
    stack: 0,
    kind: "card",
    title: "Bar readout",
    subtitle: "readout.bar が signal を同時追随",
  })
  .edge("signalNode", "bar", { label: "wBind", tone: "info" })
  .edge("signalNode", "readoutNode", { label: "readout", tone: "success" })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "Width readout" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "信号を見る",
      body: "左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。",
    },
    (p: PhaseBuilder) => p.activate("signalNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "棒に届く",
      body: "信号が棒の幅として束ねられている。 つまみを動かすとこの棒が追いかける。",
    },
    (p: PhaseBuilder) => p.activate("signalNode", "bar"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "数でも読む",
      body: "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。",
    },
    (p: PhaseBuilder) => p.activate("signalNode", "bar", "readoutNode"),
  )
  .build();
export const subtitle__visualBindBar =
  "wBind visual binding を 3-lane (Signal source / Dynamic bar / Bar readout) + 2 edge、 signal → 実 SVG width の反映経路を可視化";

/**
 * 6. visual binding = slider → node opacity で fade in/out。
 */
export const visualBindOpacity = diagram("interactive-visual-opacity", {
  topic: "信号に追随する濃さと固定の濃さを並べる",
})
  .lane("control", { x: 0, width: 200 })
  .lane("target-lane", { x: 240, width: 220 })
  .lane("ref-lane", { x: 500, width: 200 })
  .input.slider("fade", { min: 0, max: 100, defaultValue: 100, label: "Opacity" })
  .formula("op", "fade / 100")
  .state("fade", { initial: 100 })
  .state("op", { initial: 1 })
  .node("controlNode", {
    lane: "control",
    stack: 0,
    kind: "card",
    title: "Fade control",
    subtitle: "fade = {fade} · op = {op}",
  })
  .node("target", {
    lane: "target-lane",
    stack: 0,
    kind: "card",
    title: "Target",
    subtitle: "opacity: {op}",
    opacity: "{op}",
  })
  .node("ref", {
    lane: "ref-lane",
    stack: 0,
    kind: "card",
    title: "Reference",
    subtitle: "always visible (opacity=1)",
  })
  .edge("controlNode", "target", { label: "op bind", tone: "info" })
  .edge("controlNode", "ref", { label: "no bind", tone: "warning" })
  .readout.gauge("opGauge", { source: "fade", min: 0, max: 100, label: "Fade % gauge" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "動かす側を見る",
      body: "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。",
    },
    (p: PhaseBuilder) => p.activate("controlNode", "ref"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "追随する側",
      body: "追随する側は信号に束ねられている。 つまみを動かすとここだけが変わる。",
    },
    (p: PhaseBuilder) => p.activate("controlNode", "target", "ref"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "固定の側と比べる",
      body: "固定側は束ねられていないので動かない。 2 つを並べると束ねの有無が見える。",
    },
    (p: PhaseBuilder) => p.activate("target", "ref"),
  )
  .build();
export const subtitle__visualBindOpacity =
  "opacity visual bind を 3-lane (Fade control / Target opacity / Reference constant) + 2 edge、 signal 追随 vs 固定の対比可視化";

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
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
    defaultX: 50,
    defaultY: 50,
    label: "Position",
  })
  .state("pos", { initial: "50,50" })
  .node("q2Node", { lane: "q2", stack: 0, kind: "card", title: "Q2", subtitle: "upper-left" })
  .node("q1Node", { lane: "q1", stack: 0, kind: "card", title: "Q1", subtitle: "upper-right" })
  .node("q3Node", { lane: "q3", stack: 0, kind: "card", title: "Q3", subtitle: "lower-left" })
  .node("q4Node", { lane: "q4", stack: 0, kind: "card", title: "Q4", subtitle: "lower-right" })
  .node("indicator", {
    lane: "q1",
    stack: 1,
    kind: "card",
    title: "◆ Position",
    subtitle: "{pos} (default center → Q1 boundary)",
  })
  .readout.stat("posStat", { source: "pos", label: "Selected", caption: "x,y in 0..100" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "左下の区画",
      body: "4 つに区切った左下。 座標はつまみで決まり、入った区画の箱が光る。",
    },
    (p: PhaseBuilder) => p.activate("q3Node", "indicator"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "右上の区画",
      body: "右上の区画。 つまみを動かして境界をまたぐと、光る箱が入れ替わる。",
    },
    (p: PhaseBuilder) => p.activate("q1Node", "indicator"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "4 区画を見る",
      body: "4 つの区画が同じ大きさで並ぶ。 座標 1 組がどれか 1 つを指す。",
    },
    (p: PhaseBuilder) => p.activate("q1Node", "q2Node", "q3Node", "q4Node", "indicator"),
  )
  .build();
export const subtitle__xypadNavigate =
  "XY pad 2D 座標を 4-lane quadrant (Q1/Q2/Q3/Q4) 分散、 現在 pos を center indicator + stat readout で数値化";

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
  .node("ctrlNode", {
    lane: "ctrl",
    stack: 0,
    kind: "card",
    title: "Stepper",
    subtitle: "count = {count} (0-10 range)",
  })
  .node("barNode", {
    lane: "bar",
    stack: 0,
    kind: "card",
    title: "Bar visual",
    subtitle: "count 追随 progress bar (readout.bar)",
  })
  .node("statNode", {
    lane: "stat",
    stack: 0,
    kind: "card",
    title: "Stat readout",
    subtitle: "count 追随 number + unit (readout.stat)",
  })
  .edge("ctrlNode", "barNode", { label: "→ bar", tone: "info" })
  .edge("ctrlNode", "statNode", { label: "→ stat", tone: "success" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "Progress bar" })
  .readout.stat("countStat", { source: "count", label: "Total", unit: " items" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "3 個",
      body: "初期の 3 個。 棒の長さと数字が同じ値を見ている。",
    },
    (p: PhaseBuilder) => p.activate("ctrlNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "増やす",
      body: "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。",
    },
    (p: PhaseBuilder) => p.activate("ctrlNode", "barNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "読み取る",
      body: "右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。",
    },
    (p: PhaseBuilder) => p.activate("ctrlNode", "barNode", "statNode"),
  )
  .build();
export const subtitle__stepperControl =
  "stepper control を 3-lane (Control input / Bar visualization / Stat readout) 分散 + 2 fan-out edge、 signal → 2 readout の 1:N 経路可視化";

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
  .node("currentNode", {
    lane: "current",
    stack: 0,
    kind: "card",
    title: "Current",
    subtitle: "val = {val}",
  })
  .node("historyNode", {
    lane: "history",
    stack: 0,
    kind: "card",
    title: "History (15)",
    subtitle: "sparkline で直近 15 push 履歴",
  })
  .edge("currentNode", "historyNode", { label: "push", tone: "info" })
  .readout.sparkline("valHist", {
    source: "val",
    history: 15,
    color: "#e57373",
    label: "Sparkline history",
  })
  .readout.stat("valStat", { source: "val", label: "Latest", caption: "input 履歴の最新" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "現在値を見る",
      body: "つまみが持つ今の値。 数字と折れ線の右端が同じ値を指す。",
    },
    (p: PhaseBuilder) => p.activate("currentNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "履歴と並べる",
      body: "折れ線は過去の値を並べたもの。 現在値だけが右端で動く。",
    },
    (p: PhaseBuilder) => p.activate("currentNode", "historyNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "形で読む",
      body: "上下の動きは折れ線の形に残る。 数字 1 つでは分からない推移が読める。",
    },
    (p: PhaseBuilder) => p.activate("historyNode"),
  )
  .build();
export const subtitle__numberSparkline =
  "number sparkline を 2-lane (Current value / History sparkline) 分散 + push edge、 現在値と履歴の関係を可視化";

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
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "Low mode",
    subtitle: "option: low",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "Mid mode",
    subtitle: "option: mid (default)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "High mode",
    subtitle: "option: high",
  })
  .node("currentMode", {
    lane: "mid",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "mode = {mode}",
  })
  .readout.stat("modeStat", { source: "mode", label: "Current", caption: "選択中" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "低の札",
      body: "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。",
    },
    (p: PhaseBuilder) => p.activate("lowNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "中の札",
      body: "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。",
    },
    (p: PhaseBuilder) => p.activate("midNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "高の札",
      body: "3 つ目の札。 選んだ値は右の箱にも文字で出る。",
    },
    (p: PhaseBuilder) => p.activate("highNode", "currentMode"),
  )
  .build();
export const subtitle__radioSelect =
  "radio 3 option (low/mid/high) を 3-lane 排他分散 + current indicator、 現在選択 mode 位置を明示";

/**
 * 10. color picker で node stroke を変える (theme 実験)。
 */
export const colorPickerTheme = diagram("interactive-color-theme", {
  topic: "選んだ色が見本と 16 進表記に伝わる",
})
  .lane("picker", { x: 0, width: 370 })
  .lane("swatch-lane", { x: 410, width: 230 })
  .lane("stat", { x: 680, width: 320 })
  .input.color("accent", { defaultValue: "#8a5a2a", label: "Accent" })
  .state("accent", { initial: "#8a5a2a" })
  .node("pickerNode", {
    lane: "picker",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Color picker",
    subtitle: "input.color widget · default #8a5a2a",
  })
  .node("swatch", {
    lane: "swatch-lane",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Swatch",
    subtitle: "hex: {accent}",
  })
  .node("statNode", {
    lane: "stat",
    stack: 0,
    kind: "card",
    w: 270,
    title: "Hex stat",
    subtitle: "readout.stat で hex 表示",
  })
  .edge("pickerNode", "swatch", { label: "select", tone: "info" })
  .edge("swatch", "statNode", { label: "display", tone: "success" })
  .readout.stat("hexReadout", { source: "accent", label: "Selected", caption: "hex color" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "色を選ぶ",
      body: "選んだ色が左の箱に入る。 まだ見本には伝わっていない。",
    },
    (p: PhaseBuilder) => p.activate("pickerNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "見本に伝わる",
      body: "選んだ色の 16 進表記が中央に出る。 箱の塗り自体には束ねていないので、色は変わらない。",
    },
    (p: PhaseBuilder) => p.activate("pickerNode", "swatch"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "表記も揃う",
      body: "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。",
    },
    (p: PhaseBuilder) => p.activate("pickerNode", "swatch", "statNode"),
  )
  .build();
export const subtitle__colorPickerTheme =
  "color picker pipeline を 3-lane (Picker input / Swatch preview / Hex stat) + 2 edge、 hex signal 生成 dataflow を可視化";

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
  .phase(
    "p1",
    {
      duration: 1600,
      title: "25% を見る",
      body: "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。",
    },
    (p: PhaseBuilder) => p.activate("barLow"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "50% と並べる",
      body: "半分の状態を隣に置く。 25% との差が高さで分かる。",
    },
    (p: PhaseBuilder) => p.activate("barLow", "barMid"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "75% まで並べる",
      body: "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。",
    },
    (p: PhaseBuilder) => p.activate("barLow", "barMid", "barHigh"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
    },
    (p: PhaseBuilder) => p.activate("barLow", "barMid", "barHigh", "bar"),
  )
  .build();
export const subtitle__shapeRectFill =
  "dyn-rect fill を 4-lane (Low 25% / Mid 50% / High 75% / Interactive slider) 分散、 3 static + 1 reactive rect 並列比較";

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
  .node("r1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-rect",
    title: "Block 1",
    subtitle: "gas: {gas1}",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{gas1}", fillMax: 150, orient: "up", fill: "#8a5a2a" },
  })
  .node("r2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-rect",
    title: "Block 2",
    subtitle: "gas: {gas2}",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" },
  })
  .node("r3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-rect",
    title: "Block 3",
    subtitle: "gas: {gas3}",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" },
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "等倍で見る",
      body: "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。",
    },
    (p: PhaseBuilder) => p.activate("r1"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "1.2 倍で見る",
      body: "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。",
    },
    (p: PhaseBuilder) => p.activate("r1", "r2"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "1.5 倍で見る",
      body: "3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。",
    },
    (p: PhaseBuilder) => p.activate("r1", "r2", "r3"),
  )
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
  .node("cEmpty", {
    lane: "empty",
    stack: 0,
    kind: "dyn-circle",
    title: "0%",
    subtitle: "empty",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog0}", fill: "#a08870" },
  })
  .node("cThird", {
    lane: "third",
    stack: 0,
    kind: "dyn-circle",
    title: "33%",
    subtitle: "one-third",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog33}", fill: "#2563eb" },
  })
  .node("cTwoThird", {
    lane: "twothird",
    stack: 0,
    kind: "dyn-circle",
    title: "66%",
    subtitle: "two-third",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog66}", fill: "#f97316" },
  })
  .node("c", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-circle",
    title: "Ring",
    subtitle: "{p}%",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog}", fill: "#8a5a2a" },
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "0% を見る",
      body: "輪がまだ描かれていない状態。 ここが目盛りの始まりで、右へ行くほど輪が伸びる。",
    },
    (p: PhaseBuilder) => p.activate("cEmpty"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "33% と並べる",
      body: "3 分の 1 まで描いた輪を隣に置く。 0% との差が、輪の長さの違いとして読み取れる。",
    },
    (p: PhaseBuilder) => p.activate("cEmpty", "cThird"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "66% まで並べる",
      body: "3 分の 2 まで並べる。 角度の差が輪の長さで分かる。",
    },
    (p: PhaseBuilder) => p.activate("cEmpty", "cThird", "cTwoThird"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
    },
    (p: PhaseBuilder) => p.activate("cEmpty", "cThird", "cTwoThird", "c"),
  )
  .build();
export const subtitle__shapeCirclePulse =
  "dyn-circle progress ring を 4-lane (0% / 33% / 66% / Interactive) 分散、 3 static + 1 reactive circle 並列比較";

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
  .node("gMin", {
    lane: "min",
    stack: 0,
    kind: "dyn-arc",
    title: "0°",
    subtitle: "min",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#a08870" },
  })
  .node("gQuarter", {
    lane: "quarter",
    stack: 0,
    kind: "dyn-arc",
    title: "90°",
    subtitle: "quarter",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" },
  })
  .node("gHalf", {
    lane: "half",
    stack: 0,
    kind: "dyn-arc",
    title: "180°",
    subtitle: "half",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" },
  })
  .node("g", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-arc",
    title: "Slider",
    subtitle: "{a}°",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#8a5a2a" },
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "0 度を見る",
      body: "針が振れていない状態。 ここが目盛りの始まりで、右へ行くほど弧が長くなる。",
    },
    (p: PhaseBuilder) => p.activate("gMin"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "90 度と並べる",
      body: "4 分の 1 まで振れた状態を隣に置く。",
    },
    (p: PhaseBuilder) => p.activate("gMin", "gQuarter"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "180 度まで並べる",
      body: "半周まで並べる。 角度の差が弧の長さで分かる。",
    },
    (p: PhaseBuilder) => p.activate("gMin", "gQuarter", "gHalf"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
    },
    (p: PhaseBuilder) => p.activate("gMin", "gQuarter", "gHalf", "g"),
  )
  .build();
export const subtitle__shapeArcSweep =
  "dyn-arc gauge sweep を 4-lane (Min 0° / Quarter 90° / Half 180° / Interactive) 分散、 3 static + 1 reactive arc 並列比較";

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
  .node("wLow", {
    lane: "low",
    stack: 0,
    kind: "dyn-wave",
    title: "Low",
    subtitle: "25%",
    w: 140,
    h: 220,
    shape: {
      kind: "wave",
      level: "{lvl25}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 5,
      fill: "#a08870",
    },
  })
  .node("wHalf", {
    lane: "half",
    stack: 0,
    kind: "dyn-wave",
    title: "Half",
    subtitle: "50%",
    w: 140,
    h: 220,
    shape: {
      kind: "wave",
      level: "{lvl50}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 5,
      fill: "#2563eb",
    },
  })
  .node("wHigh", {
    lane: "high",
    stack: 0,
    kind: "dyn-wave",
    title: "High",
    subtitle: "75%",
    w: 140,
    h: 220,
    shape: {
      kind: "wave",
      level: "{lvl75}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 5,
      fill: "#f97316",
    },
  })
  .node("w", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-wave",
    title: "Wave",
    subtitle: "{lvl}%",
    w: 140,
    h: 220,
    shape: {
      kind: "wave",
      level: "{lvl}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 5,
      fill: "#4e9dc4",
    },
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "25% を見る",
      body: "水位が低い状態。 波の線が下の方にあり、上に空きが多く残っている。",
    },
    (p: PhaseBuilder) => p.activate("wLow"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "50% と並べる",
      body: "半分まで入った状態を隣に置く。 25% との差が、線の高さの違いとして読み取れる。",
    },
    (p: PhaseBuilder) => p.activate("wLow", "wHalf"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "75% まで並べる",
      body: "4 分の 3 まで並べる。 水位の差が線の高さで分かる。",
    },
    (p: PhaseBuilder) => p.activate("wLow", "wHalf", "wHigh"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。",
    },
    (p: PhaseBuilder) => p.activate("wLow", "wHalf", "wHigh", "w"),
  )
  .build();
export const subtitle__shapeWaveTank =
  "dyn-wave tank level を 4-lane (Low 25 / Half 50 / High 75 / Interactive slider) 分散、 3 static + 1 reactive tank 並列比較";

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
  .node("polyTri", {
    lane: "triangle",
    stack: 0,
    kind: "dyn-polygon",
    title: "Tri",
    subtitle: "sides=3",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#a08870" },
  })
  .node("polyHex", {
    lane: "hexagon",
    stack: 0,
    kind: "dyn-polygon",
    title: "Hex",
    subtitle: "sides=6",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" },
  })
  .node("polyOct", {
    lane: "octagon",
    stack: 0,
    kind: "dyn-polygon",
    title: "Oct",
    subtitle: "sides=8",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" },
  })
  .node("p", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-polygon",
    title: "Hexagon",
    subtitle: "{rot}° · r={radius}",
    w: 200,
    h: 200,
    shape: { kind: "polygon", sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#8a5a2a" },
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "3 角を見る",
      body: "角が 3 つの状態。 これが最も少ない形で、角を増やすほど丸に近づいていく。",
    },
    (p: PhaseBuilder) => p.activate("polyTri"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "6 角と並べる",
      body: "角を 6 つにした形を隣に置く。 丸みが増す。",
    },
    (p: PhaseBuilder) => p.activate("polyTri", "polyHex"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "8 角まで並べる",
      body: "角を 8 つまで増やす。 角の数と丸みの関係が分かる。",
    },
    (p: PhaseBuilder) => p.activate("polyTri", "polyHex", "polyOct"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "右端はつまみで回転角と大きさを変えられる。 角の数は固定で、3 つの見本と見比べる。",
    },
    (p: PhaseBuilder) => p.activate("polyTri", "polyHex", "polyOct", "p"),
  )
  .build();
export const subtitle__shapePolyRotate =
  "dyn-polygon sides を 4-lane (Triangle 3 / Hexagon 6 / Octagon 8 / Interactive hexagon slider) 分散、 3 static + 1 reactive polygon 並列比較";

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
    shape: {
      kind: "rect" as const,
      source: "{gas{i+1}}",
      fillMax: 130,
      orient: "up" as const,
      fill: "#8a5a2a",
    },
  }))
  .phase(
    "p1",
    {
      duration: 1600,
      title: "起点を置く",
      body: "元の値が 1 つ目の四角に入る。 ここが連なりの起点。",
    },
    (p: PhaseBuilder) => p.activate("r0"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "2 つ目まで伝わる",
      body: "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。",
    },
    (p: PhaseBuilder) => p.activate("r0", "r1"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "4 つ目まで伝わる",
      body: "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。",
    },
    (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "端まで届く",
      body: "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。",
    },
    (p: PhaseBuilder) => p.activate("r0", "r1", "r2", "r3", "r4"),
  )
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
  .input.dropdown("status", {
    options: ["active", "pending", "closed"],
    defaultValue: "active",
    label: "Status",
  })
  .state("rev", { initial: 250 })
  .state("status", { initial: "active" })
  .node("countNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Countup",
    subtitle: "rev={rev} · animated $ counter",
  })
  .node("deltaNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 240,
    title: "Delta",
    subtitle: "rev={rev} · ↑↓ arrow",
  })
  .node("ringNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 310,
    title: "Percent ring",
    subtitle: "rev/500 = {rev} progress",
  })
  .node("textNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Typewriter",
    subtitle: "status={status} · char reveal",
  })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "Revenue count" })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ delta" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "Progress ring" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "Status text" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "数え上げを見る",
      body: "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。",
    },
    (p: PhaseBuilder) => p.activate("countNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "増減と円を見る",
      body: "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。",
    },
    (p: PhaseBuilder) => p.activate("countNode", "deltaNode", "ringNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "文字でも出す",
      body: "状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。",
    },
    (p: PhaseBuilder) => p.activate("countNode", "deltaNode", "ringNode", "textNode"),
  )
  .build();
export const subtitle__dynamicReadouts =
  "4 dynamic readout (countup/delta/percent-ring/typewriter) を 2 列 2 段に分散、 各 readout 個別区画、 signal → 4 readout の 1:N 経路可視化";

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
  .node("timeNode", {
    lane: "time",
    stack: 0,
    kind: "card",
    title: "Timeline",
    subtitle: "t (0-1 loop 3s autoplay)",
  })
  .node("r", {
    lane: "bar",
    stack: 0,
    kind: "dyn-rect",
    title: "Bar (rect)",
    subtitle: "bar = t * 100",
    w: 80,
    h: 200,
    shape: { kind: "rect", source: "{bar}", fillMax: 100, orient: "up", fill: "#8a5a2a" },
  })
  .node("a", {
    lane: "arc",
    stack: 0,
    kind: "dyn-arc",
    title: "Arc",
    subtitle: "angle = t * 270",
    w: 140,
    h: 140,
    shape: { kind: "arc", angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" },
  })
  .edge("timeNode", "r", { label: "→ bar", tone: "info" })
  // timeNode→a は bar lane を跨ぐ長い edge。 label を bar lane 中央へ寄せて左右余白を確保し、
  // 非発着 lane bar の border 貫通 (lane-border-clearance) を font metric 変動にも耐える形で防ぐ。
  .edge("timeNode", "a", { label: "→ angle", tone: "accent", labelOffsetX: -45 })
  .readout.countup("timeCu", { source: "bar", unit: "%", label: "Time %" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "時間の元を見る",
      body: "時間の入力が元になる。 この値から計算式で図形の値を導く。",
    },
    (p: PhaseBuilder) => p.activate("timeNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "四角に届く",
      body: "計算式の値が四角に束ねられている。 時間が進むと自動で変わる。",
    },
    (p: PhaseBuilder) => p.activate("timeNode", "r"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "弧にも届く",
      body: "弧には別の計算式 (時間の 270 倍) が束ねられている。 同じ時間から別々の値を導く。",
    },
    (p: PhaseBuilder) => p.activate("timeNode", "r", "a"),
  )
  .build();
export const subtitle__timelineDrive =
  "timeline signal fan-out を 3-lane (Timeline control / Rect shape / Arc shape) + 2 fan-out edge、 time → 2 shape 同時追随";

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
  .node("pipeNode", {
    lane: "pipe",
    stack: 0,
    kind: "card",
    w: 300,
    title: "Pipe",
    subtitle: "width={flow} · dash={dash}",
  })
  .node("b", { lane: "sink", stack: 0, kind: "card", w: 140, title: "Sink", subtitle: "consumer" })
  .edge("a", "pipeNode", { label: "produce", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .edge("pipeNode", "b", { label: "consume", widthBind: "{flow}", dashOffsetBind: "{dash}" })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "送り手を見る",
      body: "左の箱が信号を持つ。 まだ線には出ていない。",
    },
    (p: PhaseBuilder) => p.activate("a"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "線に出る",
      body: "信号の大きさが線の太さになる。 太いほど多く流れている。",
    },
    (p: PhaseBuilder) => p.activate("a", "pipeNode"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "受け手まで届く",
      body: "線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。",
    },
    (p: PhaseBuilder) => p.activate("a", "pipeNode", "b"),
  )
  .build();
export const subtitle__edgeFlowBind =
  "edge signal bind (太さ/dashoffset) を 3-lane (Source / Pipe / Sink) 分散、 Source→Sink flow を横断 edge で animate";

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
  .input.range("priceRange", {
    min: 0,
    max: 1000,
    defaultLo: 200,
    defaultHi: 700,
    label: "Price Range",
  })
  .input.multiSelect("tags", {
    options: ["new", "sale", "hot", "featured"],
    defaultValues: ["new"],
    label: "Tags",
  })
  .input.tabs("view", { options: ["grid", "list", "compact"], defaultValue: "grid", label: "View" })
  .input.text("query", {
    defaultValue: "",
    placeholder: "Search...",
    maxLength: 50,
    label: "Query",
  })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "new" })
  .state("view", { initial: "grid" })
  .state("query", { initial: "" })
  .node("rangeNode", {
    lane: "range",
    stack: 0,
    kind: "card",
    w: 310,
    title: "Range slider",
    subtitle: "price = {priceRange}",
  })
  .node("multiNode", {
    lane: "multi",
    stack: 0,
    kind: "card",
    w: 310,
    title: "Multi-select",
    subtitle: "tags = {tags}",
  })
  .node("tabsNode", {
    lane: "tabs",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Tabs",
    subtitle: "view = {view}",
  })
  .node("textNode", {
    lane: "text",
    stack: 0,
    kind: "card",
    w: 270,
    title: "Text input",
    subtitle: "query = {query}",
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "数を選ぶ",
      body: "つまみで数の範囲を選ぶ。 4 種類の入力のうち 1 つ目。",
    },
    (p: PhaseBuilder) => p.activate("rangeNode"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "複数選ぶ",
      body: "札を複数選べる入力を加える。 選んだ数だけ値が増える。",
    },
    (p: PhaseBuilder) => p.activate("rangeNode", "multiNode"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "切り替える",
      body: "タブで表示を切り替える入力を加える。 1 つだけ選ぶ形。",
    },
    (p: PhaseBuilder) => p.activate("rangeNode", "multiNode", "tabsNode"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "文字を打つ",
      body: "文字を打つ入力まで並ぶ。 4 種類が同じ図の中で動く。",
    },
    (p: PhaseBuilder) => p.activate("rangeNode", "multiNode", "tabsNode", "textNode"),
  )
  .build();
export const subtitle__inputVariety =
  "4 input widget (range/multiSelect/tabs/text) を 4-lane 分散、 各 widget 個別 lane + input signal 表示";

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
  .input.dropdown("state", {
    options: ["online", "offline", "error"],
    defaultValue: "online",
    label: "State",
  })
  .state("temp", { initial: 42 })
  .state("state", { initial: "online" })
  .node("heatNode", {
    lane: "heat",
    stack: 0,
    kind: "card",
    title: "Heat cell",
    subtitle: "temp = {temp} · 色 gradient",
  })
  .node("badgeNode", {
    lane: "badge",
    stack: 0,
    kind: "card",
    title: "Badge (pill)",
    subtitle: "temp = {temp} · number pill",
  })
  .node("dotNode", {
    lane: "dot",
    stack: 0,
    kind: "card",
    title: "Status dot",
    subtitle: "state = {state} · online/offline/error",
  })
  .readout.heatCell("tempHeat", {
    source: "temp",
    min: 0,
    max: 100,
    colors: ["#4e9dc4", "#e57373"],
    label: "Temp gradient",
  })
  .readout.badge("tempBadge", { source: "temp", label: "Value pill" })
  .readout.statusDot("statusRead", {
    source: "state",
    map: [
      { value: "online", color: "#22c55e", label: "Online" },
      { value: "offline", color: "#a08870", label: "Offline" },
      { value: "error", color: "#ef4444", label: "Error" },
    ],
    label: "State dot",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "熱の升目を見る",
      body: "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。",
    },
    (p: PhaseBuilder) => p.activate("heatNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "札でも出す",
      body: "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。",
    },
    (p: PhaseBuilder) => p.activate("heatNode", "badgeNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "状態の点を見る",
      body: "別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。",
    },
    (p: PhaseBuilder) => p.activate("heatNode", "badgeNode", "dotNode"),
  )
  .build();
export const subtitle__readoutVariety =
  "3 readout variant (heatCell/badge/statusDot) を 3-lane 分散、 各 readout 個別 lane + temp/state signal 追随";

/**
 * 23. event 拡張 = double-click / keydown / focus / blur を network 化。
 *     signal update は consumer handler 側で実装、 catalog では primitive 存在確認のみ。
 */
export const eventVariety = diagram("interactive-event-variety", {
  topic: "5 種の操作イベントを受け取り分ける",
})
  .lane("pointer", { x: 0, width: 200 })
  .lane("keyboard", { x: 240, width: 240 })
  .lane("touch", { x: 500, width: 240 })
  // 受け取った結果を画面に出すための入力欄。 `on.*` は受け取り手の名前しか持たないため、
  // 使う側 (`catalog-handlers.ts`) がこの 2 つを書き換える。
  // 受け取り手が触るのは入力欄で、別に `state` を置くと参照されず警告になる
  .input.dropdown("lastEvent", {
    options: ["まだ無し", "2 回押し", "選ばれた", "外れた", "キー入力", "長押し"],
    defaultValue: "まだ無し",
    label: "直近に受け取った操作",
  })
  .input.stepper("received", { min: 0, max: 99, defaultValue: 0, label: "受け取った回数" })
  .node("btn1", {
    lane: "pointer",
    stack: 0,
    kind: "card",
    title: "Double Click",
    subtitle: "2 回続けて押す",
  })
  .node("btn2", {
    lane: "keyboard",
    stack: 0,
    kind: "card",
    title: "Key Focus",
    subtitle: "選ぶ / 外れる / キーを押す",
  })
  .node("btn3", {
    lane: "touch",
    stack: 0,
    kind: "card",
    title: "Long Press",
    subtitle: "押したまま 500 ミリ秒",
  })
  .node("receiver", {
    lane: "touch",
    stack: 1,
    kind: "card",
    w: 220,
    title: "受け取った結果",
    subtitle: "{lastEvent} · 累計 {received} 回",
  })
  .on.doubleClick({ kind: "node", id: "btn1" }, "on-dbl")
  .on.focus({ kind: "node", id: "btn2" }, "on-focus")
  .on.blur({ kind: "node", id: "btn2" }, "on-blur")
  .on.keydown({ kind: "node", id: "btn2" }, "on-key")
  .on.longPress({ kind: "node", id: "btn3" }, "on-long")
  .phase(
    "p1",
    {
      duration: 1600,
      title: "2 回押す",
      body: "1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。",
    },
    (p: PhaseBuilder) => p.activate("btn1", "receiver"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "選ぶ / キーを押す",
      body: "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。",
    },
    (p: PhaseBuilder) => p.activate("btn1", "btn2", "receiver"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "長く押す",
      body: "3 つ目は押したまま一定時間たつと受け取る。 5 つの操作はどれも同じ箱に結果を書く。",
    },
    (p: PhaseBuilder) => p.activate("btn1", "btn2", "btn3", "receiver"),
  )
  .build();
export const subtitle__eventVariety =
  "5 event kind (dbl/focus/blur/keydown/longpress) を 3-lane (Pointer / Keyboard / Touch) event category 別分散、 3 target node + 5 event bind";

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
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 行目を見る",
      body: "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。",
    },
    (p: PhaseBuilder) => p.activate("cell-0-0", "cell-0-1", "cell-0-2", "cell-0-3"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "2 行目を見る",
      body: "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。",
    },
    (p: PhaseBuilder) => p.activate("cell-1-0", "cell-1-1", "cell-1-2", "cell-1-3"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "3 行目を見る",
      body: "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。",
    },
    (p: PhaseBuilder) => p.activate("cell-2-0", "cell-2-1", "cell-2-2", "cell-2-3"),
  )
  .build();
export const subtitle__gridLayoutMatrix =
  "gridNodes(3, 4) 12 cell を 4-lane (Col 0-3) 列別分散、 gridNodes template で lane 動的割当、 各 lane 3 cell (Row 0-2) stack";

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
  .node("bumpNode", {
    lane: "agg",
    stack: 1,
    kind: "card",
    title: "Bump control",
    subtitle: "1 本目だけを上書きするつまみ",
  })
  .node("i0", { lane: "items", stack: 0, kind: "card", title: "#0", subtitle: "xs[0] = {xs[0]}" })
  .node("i1", { lane: "items", stack: 1, kind: "card", title: "#1", subtitle: "xs[1] = {xs[1]}" })
  .node("i2", { lane: "items", stack: 2, kind: "card", title: "#2", subtitle: "xs[2] = {xs[2]}" })
  .node("i3", { lane: "items", stack: 3, kind: "card", title: "#3", subtitle: "xs[3] = {xs[3]}" })
  .node("i4", { lane: "items", stack: 4, kind: "card", title: "#4", subtitle: "xs[4] = {xs[4]}" })
  .readout.arrayBar("hist", {
    source: "xs",
    min: 0,
    max: 50,
    color: "#2563eb",
    label: "Bars (histogram)",
  })
  .readout.arrayList("items", {
    source: "xs",
    itemTemplate: "#{i} → {item}",
    max: 6,
    label: "Items (bullet list)",
  })
  .readout.stat("first", { source: "bump", label: "Bump" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "初期の並び",
      body: "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。",
    },
    (p: PhaseBuilder) => p.activate("summary", "i0").set("xs", "[12,34,20,45,28]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "山が右へ移る",
      body: "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。",
    },
    (p: PhaseBuilder) => p.activate("summary", "i0", "i1", "i2").set("xs", "[40,18,30,26,48]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "右上がりに整う",
      body: "右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。",
    },
    (p: PhaseBuilder) =>
      p.activate("summary", "i0", "i1", "i2", "i3", "i4").set("xs", "[15,22,30,38,48]"),
  )
  .build();
export const subtitle__arraySignalHistogram =
  "arraySignal 5 element を 2-lane (Aggregate stat / Individual items) 分散、 各 element 個別 card + 集約 card、 arrayBar/arrayList readout 併存";

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
  .node("main", {
    lane: "state",
    stack: 0,
    kind: "card",
    title: "Task state",
    subtitle: "{progress}% complete",
  })
  .node("pathNode", {
    lane: "visual",
    stack: 0,
    kind: "card",
    title: "Path visual",
    subtitle: "SVG stroke-dashoffset で進行",
  })
  .node("ringNode", {
    lane: "visual",
    stack: 1,
    kind: "card",
    title: "Percent ring",
    subtitle: "同時追随",
  })
  .node("ok", {
    lane: "done",
    stack: 0,
    kind: "card",
    title: "✓ Done",
    subtitle: "progress=100% で visibleIf 発動",
    visibleIf: "{done}",
  })
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
  .phase(
    "p1",
    {
      duration: 1800,
      title: "元の値を見る",
      body: "進捗の値をつまみが持つ。 この 1 つの値から 2 つの表示を作る。",
    },
    (p: PhaseBuilder) => p.activate("main"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "経路と円に届く",
      body: "同じ進捗が経路の塗りと円の角度になる。 つまみを動かすと両方が動く。",
    },
    (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "完了の印",
      body: "進捗が満ちた時だけ出る印。 条件付きの表示で、満たない間は隠れている。",
    },
    (p: PhaseBuilder) => p.activate("main", "pathNode", "ringNode", "ok"),
  )
  .build();
export const subtitle__pathProgressDemo =
  "path progress を 3-lane (State / Path visual / Completion) 分散、 progress state + path readout + 完了 badge を lane 別展開";

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
  .node("dataCard", {
    lane: "data",
    stack: 0,
    kind: "card",
    title: "Time series",
    subtitle: "n={series.length} · sum={series.sum} · avg={series.avg}",
  })
  .node("areaCard", {
    lane: "area",
    stack: 0,
    kind: "card",
    title: "Area chart",
    subtitle: "blue #2563eb · viewH=70",
  })
  .node("lineCard", {
    lane: "line",
    stack: 0,
    kind: "card",
    title: "Line chart",
    subtitle: "orange #f97316 · viewH=50",
  })
  .readout.lineChart("chart", {
    source: "series",
    min: 0,
    max: 100,
    viewW: 260,
    viewH: 70,
    color: "#2563eb",
    fill: true,
    label: "Area chart",
  })
  .readout.lineChart("chartNoFill", {
    source: "series",
    min: 0,
    max: 100,
    viewW: 260,
    viewH: 50,
    color: "#f97316",
    fill: false,
    label: "Line chart",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "序盤の値",
      body: "前半の値だけを持つ。 折れ線が左半分に収まる。",
    },
    (p: PhaseBuilder) => p.activate("dataCard").set("series", "[22,35,28,42,55]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "伸びる",
      body: "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。",
    },
    (p: PhaseBuilder) =>
      p.activate("dataCard", "areaCard").set("series", "[22,35,28,42,55,48,60,72]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "全体が揃う",
      body: "10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("dataCard", "areaCard", "lineCard")
        .set("series", "[22,35,28,42,55,48,60,72,65,80]"),
  )
  .build();
export const subtitle__arrayLineChart =
  "arraySignal line chart を 3-lane (Data source / Area chart fill / Line chart no-fill) 分散、 chart variant 別 lane 展開、 lineChart 2 種類併存";

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
  .node("aDetail", {
    lane: "groupA",
    stack: 1,
    kind: "card",
    title: "A 5 element",
    subtitle: "系列 A",
  })
  .node("bCard", {
    lane: "groupB",
    stack: 0,
    kind: "card",
    title: "Group B",
    subtitle: "sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}",
  })
  .node("bDetail", {
    lane: "groupB",
    stack: 1,
    kind: "card",
    title: "B 5 element",
    subtitle: "系列 B",
  })
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
  .phase(
    "p1",
    {
      duration: 1800,
      title: "A だけ",
      body: "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。",
    },
    (p: PhaseBuilder) =>
      p.activate("aCard", "aDetail").set("groupA", "[40,55,30,65,45]").set("groupB", "[0,0,0,0,0]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "B を並べる",
      body: "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。",
    },
    (p: PhaseBuilder) => p.activate("aCard", "aDetail", "bCard").set("groupB", "[25,40,50,35,60]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "高さが入れ替わる",
      body: "2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aCard", "aDetail", "bCard", "bDetail")
        .set("groupA", "[30,35,25,40,30]")
        .set("groupB", "[45,60,70,55,80]"),
  )
  .build();
export const subtitle__arrayStackedBar =
  "2 arraySignal (A/B) を 2-lane (Group A blue / Group B orange) 分散 + comparison edge、 各 group 個別 card + stackedBar readout 併存";

/**
 * 29. radialNodes + renderOffset = hub-and-spoke architecture 図、
 *     中心 node に対して 6 spoke node を円周上に配置。 layout の stack で並べつつ
 *     renderOffsetX/Y で見た目上の円周配置に。
 */
export const radialHubAndSpoke = diagram("interactive-radial-hub", {
  topic: "中心から放射状に 4 本が伸びる",
})
  .lane("spokesTop", { x: -300, width: 200 })
  .lane("hub-lane", { x: 0, width: 200 })
  .lane("spokesBottom", { x: 300, width: 200 })
  .node("hub", {
    lane: "hub-lane",
    stack: 0,
    kind: "card",
    title: "Hub",
    subtitle: "center · 4 spoke に fan-out",
  })
  .node("spoke-0", { lane: "spokesTop", stack: 0, kind: "card", title: "#0", subtitle: "0°" })
  .node("spoke-1", { lane: "spokesTop", stack: 1, kind: "card", title: "#1", subtitle: "90°" })
  .node("spoke-2", { lane: "spokesBottom", stack: 0, kind: "card", title: "#2", subtitle: "180°" })
  .node("spoke-3", { lane: "spokesBottom", stack: 1, kind: "card", title: "#3", subtitle: "270°" })
  .edge("hub", "spoke-0", { label: "0°", tone: "info" })
  .edge("hub", "spoke-1", { label: "90°", tone: "info" })
  .edge("hub", "spoke-2", { label: "180°", tone: "info" })
  .edge("hub", "spoke-3", { label: "270°", tone: "info" })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "中心を置く",
      body: "真ん中の箱が起点。 ここから外へ伸びる。",
    },
    (p: PhaseBuilder) => p.activate("hub"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "2 本伸ばす",
      body: "中心から 2 本が外へ伸びる。 向きが 2 方向に分かれる。",
    },
    (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "4 本に広げる",
      body: "4 本すべてが放射状に広がる。 中心 1 つに対して外が 4 つ。",
    },
    (p: PhaseBuilder) => p.activate("hub", "spoke-0", "spoke-1", "spoke-2", "spoke-3"),
  )
  .build();
export const subtitle__radialHubAndSpoke =
  "hub-and-spoke を 3-lane (Spokes 上 / Hub center / Spokes 下) 分散、 4 spoke を上下 lane に振り分けて edge-node-cross を回避、 hub → 4 spoke edge の star topology";

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
  .node("summary", {
    lane: "pos",
    stack: 3,
    kind: "card",
    title: "Waterfall",
    subtitle: "final = sum = {changes.sum}",
  })
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
  .readout.arrayList("items", {
    source: "changes",
    itemTemplate: "step {i}: {item}",
    label: "Steps",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "増える分",
      body: "正の増減だけを置く。 滝が右上がりに積み上がる。",
    },
    (p: PhaseBuilder) => p.activate("pos1", "pos2").set("changes", "[60,30,25]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "減る分が入る",
      body: "負の増減が混ざる。 積み上がった分から下がる段が現れ、途中の落ち込みが見える。",
    },
    (p: PhaseBuilder) => p.activate("pos1", "pos2", "neg1").set("changes", "[100,-30,50,-20,40]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "収支が出る",
      body: "増減を通した合計が出る。 一覧と滝が同じ配列を見ている。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("pos1", "pos2", "pos3", "neg1", "neg2", "summary")
        .set("changes", "[60,-20,40,-15,30]"),
  )
  .build();
export const subtitle__arrayWaterfall =
  "arraySignal waterfall 5 element を 2-lane (Positive changes / Negative changes) 分散、 各 element 個別 card、 waterfall readout 併存";

/**
 * 31. renderOffset signal binding = slider で node が動く、 renderOffsetX/Y に signal template。
 */
// 2 要素の対比が主題の最小例なので抽出対象外 (#970)。 固定と追随の 2 つで完結する。
export const renderOffsetDrift = diagram("interactive-render-offset", {
  structuredData: "exclude",
  topic: "固定点に対して浮遊点がずれて動く",
})
  .lane("anchor-lane", { x: 0, width: 240 })
  .lane("floater-lane", { x: 300, width: 300 })
  .input.slider("dx", { min: -80, max: 80, defaultValue: 0, label: "Drift X" })
  .input.slider("dy", { min: -40, max: 40, defaultValue: 0, label: "Drift Y" })
  .state("dx", { initial: 0 })
  .state("dy", { initial: 0 })
  .node("anchor", {
    lane: "anchor-lane",
    stack: 0,
    kind: "card",
    title: "Anchor",
    subtitle: "固定位置、 signal bind なし",
  })
  .node("floater", {
    lane: "floater-lane",
    stack: 0,
    kind: "card",
    title: "Floater",
    subtitle: "dx={dx} · dy={dy}",
    renderOffsetX: "{dx}",
    renderOffsetY: "{dy}",
  })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "基準を置く",
      body: "動かない点を先に置く。 ここが位置の基準になる。",
    },
    (p: PhaseBuilder) => p.activate("anchor"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "ずれを見る",
      body: "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。",
    },
    (p: PhaseBuilder) => p.activate("anchor", "floater"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "つまみで動かす",
      body: "つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。",
    },
    (p: PhaseBuilder) => p.activate("floater"),
  )
  .build();
export const subtitle__renderOffsetDrift =
  "renderOffset bind を 2-lane (Anchor fixed / Floater drift) 分散、 anchor は固定、 floater は renderOffset signal 追随";

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
  .node("c0Diag", {
    lane: "c0",
    stack: 0,
    kind: "card",
    title: "Class 0 ✓",
    subtitle: "上段の正解",
  })
  .node("c0Wrong", {
    lane: "c0",
    stack: 1,
    kind: "card",
    title: "Class 0 ✕",
    subtitle: "上段の取り違え",
  })
  .node("c1Diag", {
    lane: "c1",
    stack: 0,
    kind: "card",
    title: "Class 1 ✓",
    subtitle: "中上段の正解",
  })
  .node("c1Wrong", {
    lane: "c1",
    stack: 1,
    kind: "card",
    title: "Class 1 ✕",
    subtitle: "中上段の取り違え",
  })
  .node("c2Diag", {
    lane: "c2",
    stack: 0,
    kind: "card",
    title: "Class 2 ✓",
    subtitle: "中下段の正解",
  })
  .node("c2Wrong", {
    lane: "c2",
    stack: 1,
    kind: "card",
    title: "Class 2 ✕",
    subtitle: "中下段の取り違え",
  })
  .node("c3Diag", {
    lane: "c3",
    stack: 0,
    kind: "card",
    title: "Class 3 ✓",
    subtitle: "下段の正解",
  })
  .node("c3Wrong", {
    lane: "c3",
    stack: 1,
    kind: "card",
    title: "Class 3 ✕",
    subtitle: "下段の取り違え",
  })
  .readout.matrix("m", {
    source: "cm",
    min: 0,
    max: 10,
    cellSize: 30,
    showValue: true,
    colors: ["#f0f4f8", "#0369a1"] as const,
    label: "Predictions (4×4)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "対角だけ",
      body: "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。",
    },
    (p: PhaseBuilder) =>
      p.activate("c0Diag", "c1Diag").set("cm", "[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "誤りが混ざる",
      body: "取り違えた数が対角の外に現れる。 色が対角から散らばる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("c0Diag", "c0Wrong", "c1Diag", "c1Wrong")
        .set("cm", "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "偏りが出る",
      body: "特定の組合せに誤りが集中する。 濃い升目の位置で癖が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate(
          "c0Diag",
          "c0Wrong",
          "c1Diag",
          "c1Wrong",
          "c2Diag",
          "c2Wrong",
          "c3Diag",
          "c3Wrong",
        )
        .set("cm", "[[6,3,0,1],[4,5,1,0],[0,1,8,1],[0,0,5,3]]"),
  )
  .build();
export const subtitle__matrixHeatmap =
  "4×4 confusion matrix を 4-lane (class 0/1/2/3) 分散、 各 class の diagonal (correct) / off-diagonal (wrong) を個別 card 表示、 matrix readout 併存";

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
  .node("implNode", {
    lane: "advanced",
    stack: 0,
    kind: "card",
    title: "Impl",
    subtitle: "{progress[1]}%",
  })
  .node("docsNode", {
    lane: "advanced",
    stack: 1,
    kind: "card",
    title: "Docs",
    subtitle: "{progress[3]}%",
  })
  .node("designNode", {
    lane: "behind",
    stack: 0,
    kind: "card",
    title: "Design",
    subtitle: "{progress[0]}%",
  })
  .node("testNode", {
    lane: "behind",
    stack: 1,
    kind: "card",
    title: "Test",
    subtitle: "{progress[2]}%",
  })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "Tasks (progressGroup)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "着手前",
      body: "4 件とも進捗が低い。 帯がどれも短い。",
    },
    (p: PhaseBuilder) => p.activate("implNode").set("progress", "[10,20,5,15]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "ばらつく",
      body: "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。",
    },
    (p: PhaseBuilder) => p.activate("implNode", "docsNode").set("progress", "[40,75,20,90]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "追いつく",
      body: "遅れていた項目が追いつく。 4 本の帯が揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("implNode", "docsNode", "designNode", "testNode")
        .set("progress", "[85,95,80,100]"),
  )
  .build();
export const subtitle__taskProgressGroup =
  "4 task の progress を 2-lane (Advanced ≥50% / Behind <50%) に分散、 各 task 個別 card + progressGroup readout 併存";

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
    kind: "card",
    w: 320,
    title: "Wallet",
    subtitle: "base {baseFee} + tip {priority} gwei",
  })
  .node("b1", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 240,
    title: "Block N",
    subtitle: "1.0x = {total1} gwei",
  })
  .node("b2", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 250,
    title: "Block N+1",
    subtitle: "1.2x = {total2} gwei",
  })
  .node("b3", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 250,
    title: "Block N+2",
    subtitle: "1.5x = {total3} gwei",
  })
  .edge("wallet", "b1", { label: "tx submit", sub: "base + tip", tone: "info" })
  .edge("b1", "b2", { label: "next block", sub: "+20% fee", tone: "warning" })
  .edge("b2", "b3", { label: "next block", sub: "+25% fee", tone: "error" })
  .readout.stackedBar("gas", {
    sourceA: "burned",
    sourceB: "tips",
    min: 0,
    max: 120,
    colorA: "#ef4444",
    colorB: "#22c55e",
    label: "Burned / Tip per block",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 ブロック目",
      body: "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。",
    },
    (p: PhaseBuilder) =>
      p.activate("wallet", "b1").set("burned", "[50,0,0]").set("tips", "[5,0,0]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "2 ブロック目",
      body: "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。",
    },
    (p: PhaseBuilder) =>
      p.activate("wallet", "b1", "b2").set("burned", "[50,60,0]").set("tips", "[5,8,0]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "3 ブロック目",
      body: "さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。",
    },
    (p: PhaseBuilder) =>
      p.activate("wallet", "b1", "b2", "b3").set("burned", "[50,60,72]").set("tips", "[5,8,10]"),
  )
  .build();
export const subtitle__eip1559GasFlow =
  "EIP-1559 gas cost model = 4 区画 (Sender / Block1 / Block2 / Block3) 2 列 2 段を edge で gas propagation、 base fee slider で 3 block の total が chain 追随";

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
  .edge("consent", "client", {
    label: "2. consent screen (user approves)",
    tone: "info",
    side: "left",
  })
  .edge("client", "consent", {
    id: "code-exchange",
    label: "3. code exchange (with code)",
    tone: "accent",
  })
  .edge("consent", "client", {
    id: "token-issue",
    label: "4. token issued (access_token)",
    tone: "success",
    side: "left",
  })
  // 5-6 は Auth server を跨いで Browser ↔ Resource を結ぶ。 どちらも迂回するため、 何もしないと
  // 2 本の迂回が同じ高さで重なり label も同じ点に乗る (実測 = 重なり面積 12215)。 6 を下
  // (side: "bottom") に回して迂回の向きを分け、 6 の label だけ下へ 120 離す。 5 側にも offset を
  // 足すと label が path から 170 離れて edge-label-proximity warn が出て、 図の高さが 19% 増える。
  .edge("client", "api", { label: "5. API call", sub: "Bearer token", tone: "accent" })
  .edge("api", "client", {
    label: "6. resp",
    sub: "protected data",
    tone: "success",
    side: "bottom",
    labelOffsetY: 120,
  })
  .readout.sequenceTimeline("seq", {
    source: "events",
    min: 0,
    max: 700,
    viewW: 400,
    viewH: 60,
    color: "#2563eb",
    label: "Timeline",
  })
  .readout.stat("finalDelay", { source: "delay", unit: "ms", label: "Delay" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "認可を求める",
      body: "利用者が認可画面に進む。 やり取りの 1 つ目が記録される。",
    },
    (p: PhaseBuilder) => p.activate("client").set("events", '[[0,"認可要求"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "コードを受け取る",
      body: "認可コードが返る。 やり取りが 2 つに増える。",
    },
    (p: PhaseBuilder) =>
      p.activate("client", "consent").set("events", '[[0,"認可要求"],[120,"コード発行"]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "引き換える",
      body: "コードを token に引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("client", "consent", "api")
        .set(
          "events",
          '[[0,"認可要求"],[120,"コード発行"],[260,"token 交換"],[380,"token 発行"],[500,"資源要求"],[620,"資源応答"]]',
        ),
  )
  .build();
export const subtitle__interactiveOauthFlow =
  "OAuth 2.0 authorization code flow を 3-lane (User / Auth server / Resource server) + 6 event edge で node network 化、 latency は slider 追随";

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
  .phase(
    "p1",
    {
      duration: 1600,
      title: "入口に立つ",
      body: "一番上の分かれ道から始まる。 まだどちらにも進んでいない。",
    },
    (p: PhaseBuilder) => p.activate("node-0"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "1 段目で分かれる",
      body: "最初の判断で左右に分かれる。 2 つの道ができる。",
    },
    (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2"),
  )
  .phase(
    "p3",
    {
      duration: 1600,
      title: "左の枝が分かれる",
      body: "左側だけがもう一度分かれて 2 つの葉になる。 右側はまだ 1 本のまま。",
    },
    (p: PhaseBuilder) => p.activate("node-0", "node-1", "node-2", "node-3", "node-4"),
  )
  .phase(
    "p4",
    {
      duration: 1600,
      title: "右の枝も分かれる",
      body: "右側も分かれて 4 つの終点すべてに届く。 2 段の判断で 4 通りの結果になる。",
    },
    (p: PhaseBuilder) =>
      p.activate("node-0", "node-1", "node-2", "node-3", "node-4", "node-5", "node-6"),
  )
  .build();
export const subtitle__decisionTree =
  "decision tree 3 level (2^2 = 4 leaf) を 3-lane (Root / Mid / Leaf) tree depth 別分散、 stack を parent-child alignment で edge-node-cross 回避、 6 edge で 2 分木構造明示";

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
  .node("designNode", {
    lane: "strong",
    stack: 0,
    kind: "card",
    title: "Design",
    subtitle: "{skills[0]}/10",
  })
  .node("testNode", {
    lane: "strong",
    stack: 1,
    kind: "card",
    title: "Test",
    subtitle: "{skills[2]}/10",
  })
  .node("debugNode", {
    lane: "strong",
    stack: 2,
    kind: "card",
    title: "Debug",
    subtitle: "{skills[4]}/10",
  })
  .node("implNode", {
    lane: "middle",
    stack: 0,
    kind: "card",
    title: "Impl",
    subtitle: "{skills[1]}/10",
  })
  .node("docsNode", {
    lane: "weak",
    stack: 0,
    kind: "card",
    title: "Docs",
    subtitle: "{skills[3]}/10",
  })
  .readout.radar("radar", {
    source: "skills",
    max: 10,
    labelSource: "skillNames",
    color: "#2563eb",
    viewW: 200,
    viewH: 200,
    label: "Skills (polygon spider)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "偏った形",
      body: "1 つの技能だけが高い。 図形が一方向に伸びる。",
    },
    (p: PhaseBuilder) => p.activate("designNode").set("skills", "[9,2,3,2,3]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "広がる",
      body: "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。",
    },
    (p: PhaseBuilder) =>
      p.activate("designNode", "testNode", "debugNode").set("skills", "[8,5,7,3,9]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "形が整う",
      body: "5 技能が近い値になり、図形が正多角形に近づく。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("designNode", "testNode", "debugNode", "implNode", "docsNode")
        .set("skills", "[7,7,8,6,8]"),
  )
  .build();
export const subtitle__skillRadar =
  "5 skill を 3-lane (Strong ≥7 / Middle 5-6 / Weak <5) レベル別分散、 各 skill 個別 card + radar readout 併存";

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
  .node("w2", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "Workload B",
    subtitle: "中央寄りの処理",
  })
  .node("w3", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "Workload C",
    subtitle: "右上に位置する処理",
  })
  .node("w5", {
    lane: "high",
    stack: 2,
    kind: "card",
    title: "Workload E",
    subtitle: "左上に位置する処理",
  })
  .node("w1", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "Workload A",
    subtitle: "左下に位置する処理",
  })
  .node("w4", {
    lane: "low",
    stack: 1,
    kind: "card",
    title: "Workload D",
    subtitle: "右寄りの処理",
  })
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
  .phase(
    "p1",
    {
      duration: 1800,
      title: "軽い処理",
      body: "負荷の小さい処理だけを置く。 円が小さくまとまる。",
    },
    (p: PhaseBuilder) => p.activate("w2").set("perf", "[[50,20,3],[70,40,4],[90,60,3]]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "重い処理が入る",
      body: "負荷の大きい処理が加わる。 円の大小差が開く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("w2", "w3", "w5")
        .set("perf", "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "偏りが出る",
      body: "右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("w2", "w3", "w5", "w1", "w4")
        .set("perf", "[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]"),
  )
  .build();
export const subtitle__perfBubbleChart =
  "5 workload を 2-lane (High usage ≥7 / Low usage <7) usage size 別分散、 各 workload 個別 card + bubbleChart readout 併存";

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
  .node("stocksNode", {
    lane: "traditional",
    stack: 0,
    kind: "card",
    title: "Stocks",
    subtitle: "{assets[0]}%",
  })
  .node("bondsNode", {
    lane: "traditional",
    stack: 1,
    kind: "card",
    title: "Bonds",
    subtitle: "{assets[1]}%",
  })
  .node("cashNode", {
    lane: "alternative",
    stack: 0,
    kind: "card",
    title: "Cash",
    subtitle: "{assets[2]}%",
  })
  .node("cryptoNode", {
    lane: "alternative",
    stack: 1,
    kind: "card",
    title: "Crypto",
    subtitle: "{assets[3]}%",
  })
  .node("totalNode", {
    lane: "traditional",
    stack: 2,
    kind: "card",
    title: "Portfolio",
    subtitle: "合計 {assets.sum}% · 最大 {assets.max}%",
  })
  .readout.donut("d", {
    source: "assets",
    innerRatio: 0.55,
    viewW: 160,
    viewH: 160,
    label: "Allocation (donut)",
  })
  .readout.arrayList("legend", { source: "assetNames", itemTemplate: "● {item}", label: "Legend" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "株式に寄る",
      body: "株式の比重が大きい配分。 円の 1 区画が広い。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("stocksNode")
        .set("assets", "[60,20,15,5]")
        .set("assetNames", '["Stocks","Bonds","Cash","Crypto"]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "債券を増やす",
      body: "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("stocksNode", "bondsNode")
        .set("assets", "[45,30,15,10]")
        .set("assetNames", '["Stocks","Bonds","Crypto","Cash"]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "分散する",
      body: "4 種に近い比率で分散する。 区画の差が小さくなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("stocksNode", "bondsNode", "cashNode", "cryptoNode", "totalNode")
        .set("assets", "[30,28,22,20]")
        .set("assetNames", '["Stocks","Bonds","Cash","Crypto"]'),
  )
  .build();
export const subtitle__portfolioDonut =
  "portfolio 4 asset を 2-lane (Traditional Stocks+Bonds / Alternative Cash+Crypto) 分散、 各 asset 個別 card、 donut readout 併存";

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
  .edge("revCard", "npsCard", {
    label: "correlate",
    sub: "rev/2 + 20",
    tone: "success",
    side: "bottom",
  })
  .readout.stat("rev", { source: "revenueInput", unit: "k", label: "Revenue" })
  .readout.stat("usr", { source: "users", label: "Users" })
  .readout.gauge("chr", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "Churn %" })
  .readout.percentRing("np", { source: "nps", max: 100, color: "#22c55e", label: "NPS" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "利用者を見る",
      body: "売上のつまみから計算式で利用者数を導く。 4 指標のうち 1 つ目。",
    },
    (p: PhaseBuilder) => p.activate("usersCard"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "解約率も導く",
      body: "同じ元の値から解約率を導く。 売上を動かすと 2 つが同時に変わる。",
    },
    (p: PhaseBuilder) => p.activate("usersCard", "churnCard"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "4 指標が揃う",
      body: "推奨度まで並ぶ。 つまみが持つ 1 指標と、そこから導く 3 指標の組になっている。",
    },
    (p: PhaseBuilder) => p.activate("revCard", "usersCard", "churnCard", "npsCard"),
  )
  .build();
export const subtitle__kpiDashboard =
  "SaaS KPI dashboard = 4-lane (Revenue / Users / Churn / NPS) node grid + revenue → users/churn/nps に因果関係 edge、 formula chain で 3 KPI が chain 追随";

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
    kind: "card",
    w: 250,
    title: "Variant A",
    subtitle: "avg {convA.avg}%",
  })
  .node("splitCard", {
    lane: "split",
    stack: 0,
    kind: "card",
    w: 200,
    title: "Split",
    subtitle: "振り分け {splitData[0]} / {splitData[1]}",
  })
  .node("treatmentCard", {
    lane: "varB",
    stack: 0,
    kind: "card",
    w: 250,
    title: "Variant B",
    subtitle: "avg {convB.avg}%",
  })
  .edge("splitCard", "controlCard", { label: "50%", sub: "control", tone: "info", side: "left" })
  .edge("splitCard", "treatmentCard", { label: "50%", sub: "treatment", tone: "success" })
  .readout.stackedBar("conv", {
    sourceA: "convA",
    sourceB: "convB",
    min: 30,
    max: 70,
    colorA: "#a08870",
    colorB: "#22c55e",
    label: "Daily conv % (A vs B)",
  })
  .readout.donut("splitDonut", {
    source: "splitData",
    innerRatio: 0.5,
    viewW: 120,
    viewH: 120,
    label: "Traffic split",
  })
  .readout.donut("winner", {
    source: "results",
    innerRatio: 0.6,
    viewW: 120,
    viewH: 120,
    colors: ["#22c55e", "#a08870"] as const,
    label: "Winner share (B=green)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "振り分け",
      body: "利用者を半々に分ける。 振り分けの円が 2 等分になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("controlCard", "splitCard")
        .set("splitData", "[50,50]")
        .set("results", "[50,50]")
        .set("convA", "[48,50,49,51,50]")
        .set("convB", "[49,50,51,50,52]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "差が出る",
      body: "試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("controlCard", "splitCard", "treatmentCard")
        .set("splitData", "[60,40]")
        .set("results", "[55,45]")
        .set("convA", "[48,49,50,48,49]")
        .set("convB", "[52,55,57,56,58]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "差が確定する",
      body: "振り分けを半々に戻しても差が残る。 振り分けと結果を分けて見られる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("splitCard", "treatmentCard")
        .set("splitData", "[50,50]")
        .set("results", "[62,38]")
        .set("convA", "[47,48,49,47,48]")
        .set("convB", "[58,61,63,62,65]"),
  )
  .build();
export const subtitle__abTestResult =
  "A/B test を 3-lane (Variant A / Split / Variant B) + Split → A,B edge で experiment 構造を node network 化";

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
  .node("q1Card", {
    lane: "q1",
    stack: 0,
    kind: "card",
    title: "Q1 (Jan-Mar)",
    subtitle: "静かな期間",
  })
  .node("q2Card", {
    lane: "q2",
    stack: 0,
    kind: "card",
    title: "Q2 (Apr-Jun)",
    subtitle: "活発な期間",
  })
  .node("q3Card", {
    lane: "q3",
    stack: 0,
    kind: "card",
    title: "Q3 (Jul-Sep)",
    subtitle: "落ち着く期間",
  })
  .node("q4Card", {
    lane: "q4",
    stack: 0,
    kind: "card",
    title: "Q4 (Oct-Dec)",
    subtitle: "全体の推移",
  })
  .node("totalCard", {
    lane: "q4",
    stack: 1,
    kind: "card",
    title: "Year total",
    subtitle: "sum {commits.sum} · max {commits.max} · avg {commits.avg}",
  })
  .readout.calendarHeatmap("h", {
    source: "commits",
    max: 10,
    cellSize: 10,
    cellGap: 2,
    label: "1 year (53 週 × 7 日)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "静かな期間",
      body: "書き込みが少ない期間。 濃い升目がまばら。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Card")
        .set("commits", "[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "活発になる",
      body: "書き込みが増えて濃い升目が続く。 帯のように連なる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Card", "q2Card")
        .set("commits", "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "落ち着く",
      body: "終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Card", "q2Card", "q3Card", "q4Card", "totalCard")
        .set("commits", "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]"),
  )
  .build();
export const subtitle__contributionHeatmap =
  "365 day contribution を 4-lane (Q1/Q2/Q3/Q4 quarter) 分散、 各 quarter summary card + total/max、 calendarHeatmap readout 併存";

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
  .node("xNode", {
    lane: "xpan",
    stack: 0,
    kind: "card",
    title: "Pan X",
    subtitle: "panX = {panX}px (0-600)",
  })
  .node("yNode", {
    lane: "ypan",
    stack: 0,
    kind: "card",
    title: "Pan Y",
    subtitle: "panY = {panY}px (0-500)",
  })
  .node("mapNode", {
    lane: "map",
    stack: 0,
    kind: "card",
    title: "Mini-map",
    subtitle: "pan ({panX}, {panY}) view 400×300",
  })
  .readout.miniMap("map", {
    source: "viewport",
    canvasW: 1000,
    canvasH: 800,
    viewW: 200,
    viewH: 160,
    color: "#2563eb",
    label: "Overview (mini-map)",
  })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "X stat" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "Y stat" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "左上を見る",
      body: "全体図の左上を見ている状態。 小窓の枠が左上にある。",
    },
    (p: PhaseBuilder) => p.activate("xNode").set("viewport", "[0,0,400,300]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "右へ移る",
      body: "見ている範囲が右へ移る。 小窓の枠も追いかける。",
    },
    (p: PhaseBuilder) => p.activate("xNode", "yNode").set("viewport", "[500,0,400,300]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "下へ移る",
      body: "さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。",
    },
    (p: PhaseBuilder) =>
      p.activate("xNode", "yNode", "mapNode").set("viewport", "[500,400,400,300]"),
  )
  .build();
export const subtitle__canvasMiniMap =
  "canvas mini-map を 3-lane (X pan / Y pan / Mini-map viewport) 分散、 axis 別 control + viewport 集約、 miniMap readout 併存";

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
  .node("prevNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 220,
    title: "Previous",
    subtitle: "{prev}k (baseline)",
  })
  .node("currNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 300,
    title: "◆ Current",
    subtitle: "{current}k (slider driven)",
  })
  .node("trendNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Trend",
    subtitle: "6 month sparkline (120-170k)",
  })
  .edge("prevNode", "currNode", { label: "delta = current - prev", tone: "success" })
  .edge("currNode", "trendNode", { label: "sparkline last", tone: "info" })
  .readout.kpiCard("kpi", {
    source: "current",
    historySource: "history",
    comparisonSource: "prev",
    unit: "k",
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "Revenue KPI (composite)",
  })
  .readout.stat("prevStat", { source: "prev", unit: "k", label: "Prev stat" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "前期を見る",
      body: "比べる相手になる前期の値。 これは固定で動かない。",
    },
    (p: PhaseBuilder) => p.activate("prevNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "今期を見る",
      body: "今期の値はつまみで動く。 前期との差がその場で出る。",
    },
    (p: PhaseBuilder) => p.activate("prevNode", "currNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "推移で読む",
      body: "推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。",
    },
    (p: PhaseBuilder) => p.activate("prevNode", "currNode", "trendNode"),
  )
  .build();
export const subtitle__revenueKpiCard =
  "revenue KPI を 3 区画 (Previous / Current / Trend) 2 列 2 段に分散 + prev→current delta edge、 kpiCard readout 併存";

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
  .node("d1", {
    lane: "up",
    stack: 0,
    kind: "card",
    title: "Day 1 ▲",
    subtitle: "O=100 · C=105 (+5)",
  })
  .node("d3", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "Day 3 ▲",
    subtitle: "O=102 · C=104 (+2)",
  })
  .node("d4", {
    lane: "up",
    stack: 2,
    kind: "card",
    title: "Day 4 ▲",
    subtitle: "O=104 · C=111 (+7)",
  })
  .node("d6", {
    lane: "up",
    stack: 3,
    kind: "card",
    title: "Day 6 ▲",
    subtitle: "O=109 · C=112 (+3)",
  })
  .node("d7", {
    lane: "up",
    stack: 4,
    kind: "card",
    title: "Day 7 ▲",
    subtitle: "O=112 · C=116 (+4)",
  })
  .node("d8", {
    lane: "up",
    stack: 5,
    kind: "card",
    title: "Day 8 ▲",
    subtitle: "O=116 · C=118 (+2)",
  })
  .node("d2", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "Day 2 ▼",
    subtitle: "O=105 · C=102 (-3)",
  })
  .node("d5", {
    lane: "down",
    stack: 1,
    kind: "card",
    title: "Day 5 ▼",
    subtitle: "O=111 · C=109 (-2)",
  })
  .readout.candlestick("chart", {
    source: "ohlc",
    min: 95,
    max: 122,
    viewW: 300,
    viewH: 110,
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "OHLC (candlestick)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "横ばい",
      body: "始値と終値が近い日が続く。 実体の短い足が並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("d1", "d2")
        .set("ohlc", "[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "上がる",
      body: "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("d1", "d2", "d3", "d4")
        .set(
          "ohlc",
          "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]",
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "振れる",
      body: "上下の幅が大きい日が混ざる。 ヒゲの長さで振れ幅が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8")
        .set(
          "ohlc",
          "[[100,108,96,105],[105,118,95,102],[102,106,97,104],[104,120,103,111],[111,115,98,109],[109,121,106,112],[112,118,101,116],[116,122,113,118]]",
        ),
  )
  .build();
export const subtitle__priceCandlestick =
  "OHLC 8 day を 2-lane (Up days close≥open / Down days close<open) 分散、 各 day 個別 card + candlestick readout 併存";

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
  .node("usersOnlyNode", {
    lane: "usersOnly",
    stack: 0,
    kind: "card",
    title: "Users total",
    subtitle: "A 全体 {sets[0]} · 共通 {sets[2]}",
  })
  .node("bothNode", {
    lane: "both",
    stack: 0,
    kind: "card",
    title: "Both (A ∩ B)",
    subtitle: "共通 = {sets[2]}",
  })
  .node("payersOnlyNode", {
    lane: "payersOnly",
    stack: 0,
    kind: "card",
    title: "Payers total",
    subtitle: "B 全体 = {sets[1]}",
  })
  .node("totalNode", {
    lane: "both",
    stack: 1,
    kind: "card",
    title: "Universe",
    subtitle: "A={sets[0]} · B={sets[1]}",
  })
  .readout.venn("v", {
    source: "sets",
    viewW: 220,
    viewH: 140,
    colorA: "#2563eb",
    colorB: "#f97316",
    labelA: "Users",
    labelB: "Payers",
    label: "Overlap (2-set Venn)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "重なりなし",
      body: "2 つの集まりが離れている。 共通する人が居ない。",
    },
    (p: PhaseBuilder) => p.activate("usersOnlyNode").set("sets", "[100,40,0]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "重なる",
      body: "共通する人が現れて 2 つの円が重なる。",
    },
    (p: PhaseBuilder) => p.activate("usersOnlyNode", "bothNode").set("sets", "[100,40,25]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "大きく重なる",
      body: "共通部分が広がる。 重なりの面積で関係の強さが読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("usersOnlyNode", "bothNode", "payersOnlyNode", "totalNode")
        .set("sets", "[100,60,45]"),
  )
  .build();
export const subtitle__userVenn =
  "2 set Venn を 3-lane (Users only / Both / Payers only) 領域別分散、 各 region 個別 card、 venn readout 併存";

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
  .readout.slope("s", {
    source: "scores",
    min: 40,
    max: 100,
    viewW: 260,
    viewH: 160,
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "Score change (slope)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "横並び",
      body: "前後で点数が変わらない状態。 線が水平に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p.activate("aliceNode").set("scores", '[[65,65,"Alice"],[70,70,"Bob"],[55,55,"Carol"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "差が出る",
      body: "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceNode", "carolNode", "danNode")
        .set(
          "scores",
          '[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "順位が入れ替わる",
      body: "前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceNode", "carolNode", "danNode", "bobNode", "eveNode")
        .set(
          "scores",
          '[[65,72,"Alice"],[70,60,"Bob"],[55,90,"Carol"],[80,75,"Dan"],[60,85,"Eve"]]',
        ),
  )
  .build();
export const subtitle__scoreSlope =
  "5 student score change を 2-lane (Improved up ↑ / Declined down ↓) 分散、 各 student 個別 card、 slope readout 併存";

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
  .node("visitNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 160,
    title: "Visit",
    subtitle: "漏斗の入口",
  })
  .node("signupNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Signup",
    subtitle: "登録に進む段",
  })
  .node("trialNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 170,
    title: "Trial",
    subtitle: "試用に進む段",
  })
  .node("paidNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 220,
    title: "Paid",
    subtitle: "購入に至る段",
  })
  .edge("visitNode", "signupNode", { label: "登録へ", tone: "info" })
  .edge("signupNode", "trialNode", { label: "試用へ", tone: "warning" })
  .edge("trialNode", "paidNode", { label: "購入へ", tone: "error" })
  .readout.funnel("f", {
    source: "stages",
    viewW: 280,
    viewH: 200,
    colorTop: "#2563eb",
    colorBottom: "#a08870",
    label: "Conversion (trapezoid)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "入口だけ",
      body: "訪問だけがある状態。 漏斗の一番上が広い。",
    },
    (p: PhaseBuilder) =>
      p.activate("visitNode").set("stages", '[["Visit",1000],["Signup",0],["Trial",0],["Paid",0]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "絞られる",
      body: "登録と試用に進む人が現れる。 段ごとに幅が細くなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("visitNode", "signupNode", "trialNode")
        .set("stages", '[["Visit",1000],["Signup",400],["Trial",150],["Paid",40]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "歩留まりが上がる",
      body: "各段の残る割合が改善する。 漏斗の細まり方が緩くなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("visitNode", "signupNode", "trialNode", "paidNode")
        .set("stages", '[["Visit",1000],["Signup",620],["Trial",340],["Paid",130]]'),
  )
  .build();
export const subtitle__salesFunnel =
  "sales funnel 4 stage を 2 列 2 段の pipeline + 3 drop-off edge、 Visit → Signup → Trial → Paid の conversion 遷移 network 化";

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
  .node("designNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 200,
    title: "Design",
    subtitle: "day 0-3 (3 day)",
  })
  .node("implNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 280,
    title: "Impl",
    subtitle: "day 3-8 (5 day, largest)",
  })
  .node("testNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Test",
    subtitle: "day 6-9 (3 day, overlap w/ impl)",
  })
  .node("shipNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 210,
    title: "Ship",
    subtitle: "day 9-10 (1 day)",
  })
  .edge("designNode", "implNode", { label: "handover", tone: "info" })
  .edge("implNode", "testNode", { label: "test start", tone: "accent" })
  .edge("testNode", "shipNode", { label: "release", tone: "success" })
  .readout.gantt("g", {
    source: "tasks",
    min: 0,
    max: 10,
    viewW: 320,
    viewH: 140,
    color: "#2563eb",
    label: "Timeline (gantt)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "設計だけ",
      body: "最初の作業だけが置かれた状態。 帯が 1 本。",
    },
    (p: PhaseBuilder) => p.activate("designNode").set("tasks", '[["Design",0,3]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "連なる",
      body: "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("designNode", "implNode", "testNode")
        .set("tasks", '[["Design",0,3],["Impl",3,5],["Test",6,3]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "重なる",
      body: "作業が並行して重なる期間が出る。 帯の重なりで山場が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("designNode", "implNode", "testNode", "shipNode")
        .set("tasks", '[["Design",0,3],["Impl",2,6],["Test",6,4],["Ship",9,1]]'),
  )
  .build();
export const subtitle__projectGantt =
  "project 4 task を 4 区画 (Design / Impl / Test / Ship) 2 列 2 段で task 別分散 + 3 handover edge、 gantt readout 併存";

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
  .node("engNode", {
    lane: "major",
    stack: 0,
    kind: "card",
    title: "Engineering",
    subtitle: "最も大きい区画",
  })
  .node("salesNode", {
    lane: "major",
    stack: 1,
    kind: "card",
    title: "Sales",
    subtitle: "2 番目に大きい",
  })
  .node("mktNode", {
    lane: "major",
    stack: 2,
    kind: "card",
    title: "Marketing",
    subtitle: "中位の区画",
  })
  .node("supportNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "Support",
    subtitle: "小さめの区画",
  })
  .node("opsNode", { lane: "mid", stack: 1, kind: "card", title: "Ops", subtitle: "小さい区画" })
  .node("legalNode", {
    lane: "minor",
    stack: 0,
    kind: "card",
    title: "Legal",
    subtitle: "最も小さい区画",
  })
  .readout.treemap("t", { source: "teams", viewW: 280, viewH: 200, label: "Budget (treemap)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "均等に分ける",
      body: "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("engNode")
        .set(
          "teams",
          '[["Engineering",19],["Sales",18],["Marketing",17],["Support",16],["Ops",15],["Legal",14]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "1 つに寄る",
      body: "1 つに配分が寄る。 大きな区画が場所を占める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("engNode", "salesNode", "mktNode")
        .set(
          "teams",
          '[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "分け直す",
      body: "配分を組み替える。 区画の大小と位置が同時に変わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("engNode", "salesNode", "mktNode", "supportNode", "opsNode", "legalNode")
        .set(
          "teams",
          '[["Engineering",30],["Sales",28],["Marketing",18],["Support",12],["Ops",8],["Legal",4]]',
        ),
  )
  .build();
export const subtitle__resourceTreemap =
  "6 team budget を 3-lane (Major ≥15% / Mid 5-14% / Minor <5%) size 別分散、 各 team 個別 card、 treemap readout 併存";

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
  .node("search", {
    lane: "src",
    stack: 0,
    kind: "card",
    title: "Search",
    subtitle: "検索からの流入",
  })
  .node("social", {
    lane: "src",
    stack: 1,
    kind: "card",
    title: "Social",
    subtitle: "SNS からの流入",
  })
  .node("direct", { lane: "src", stack: 2, kind: "card", title: "Direct", subtitle: "直接の流入" })
  .node("home", { lane: "land", stack: 0, kind: "card", title: "Home", subtitle: "入口ページ" })
  .node("product", {
    lane: "land",
    stack: 1,
    kind: "card",
    title: "Product",
    subtitle: "商品ページ",
  })
  .node("checkout", {
    lane: "cv",
    stack: 0,
    kind: "card",
    title: "Checkout",
    subtitle: "成果ページ",
  })
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
  .readout.sankey("s", {
    source: "flows",
    viewW: 340,
    viewH: 220,
    label: "Sources → Pages (sankey)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 経路",
      body: "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。",
    },
    (p: PhaseBuilder) => p.activate("search", "home").set("flows", '[["Search","Home",40]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "枝分かれ",
      body: "流入元が増え、行き先も分かれる。 帯が交差する。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("search", "social", "home", "product")
        .set(
          "flows",
          '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "流入元が増える",
      body: "3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("search", "social", "direct", "home", "product", "checkout")
        .set(
          "flows",
          '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]',
        ),
  )
  .build();
export const subtitle__trafficSankey =
  "traffic source (3) → landing (2) → conversion (1) の 3-lane funnel を node network + edge で明示、 sankey readout 併存";

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
  .node("monNode", {
    lane: "weekday",
    stack: 0,
    kind: "card",
    title: "Mon",
    subtitle: "{hours[0]}h",
  })
  .node("tueNode", {
    lane: "weekday",
    stack: 1,
    kind: "card",
    title: "Tue",
    subtitle: "{hours[1]}h",
  })
  .node("wedNode", {
    lane: "weekday",
    stack: 2,
    kind: "card",
    title: "Wed",
    subtitle: "{hours[2]}h",
  })
  .node("thuNode", {
    lane: "weekday",
    stack: 3,
    kind: "card",
    title: "Thu",
    subtitle: "{hours[3]}h",
  })
  .node("friNode", {
    lane: "weekday",
    stack: 4,
    kind: "card",
    title: "Fri",
    subtitle: "{hours[4]}h",
  })
  .node("satNode", {
    lane: "weekend",
    stack: 0,
    kind: "card",
    title: "Sat",
    subtitle: "{hours[5]}h",
  })
  .node("sunNode", {
    lane: "weekend",
    stack: 1,
    kind: "card",
    title: "Sun",
    subtitle: "{hours[6]}h",
  })
  .readout.polarArea("p", {
    source: "hours",
    max: 10,
    labelSource: "days",
    viewW: 220,
    viewH: 220,
    label: "Hours (polar sectors)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "平日だけ",
      body: "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。",
    },
    (p: PhaseBuilder) => p.activate("monNode", "tueNode").set("hours", "[6,7,8,6,7,0,0]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "週末も入る",
      body: "週末にも時間が入る。 扇形が一周に広がる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "tueNode", "wedNode", "thuNode", "friNode")
        .set("hours", "[3,5,8,6,7,4,2]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "差を均す",
      body: "曜日ごとの差が縮まる。 扇形の長さが揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "tueNode", "wedNode", "thuNode", "friNode", "satNode", "sunNode")
        .set("hours", "[5,5,6,5,6,4,4]"),
  )
  .build();
export const subtitle__activityPolar =
  "weekly activity 7 day を 2-lane (Weekday / Weekend) に分散、 各 day 個別 card + hours、 polarArea readout 併存";

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
  .node("signupNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 200,
    title: "Sign up",
    subtitle: "アカウント作成",
  })
  .node("profileNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 200,
    title: "Profile",
    subtitle: "プロフィール記入",
  })
  .node("prefsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 290,
    title: "Preferences",
    subtitle: "設定選択 (現在地)",
  })
  .node("verifyNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 180,
    title: "Verify",
    subtitle: "認証確認",
  })
  .node("doneNode", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 140,
    title: "Done",
    subtitle: "完了",
  })
  .edge("signupNode", "profileNode", { label: "next", tone: "info" })
  .edge("profileNode", "prefsNode", { label: "next", tone: "info" })
  .edge("prefsNode", "verifyNode", { label: "next", tone: "accent" })
  .edge("verifyNode", "doneNode", { label: "finish", tone: "success" })
  .readout.stepIndicator("wizard", {
    source: "current",
    stepsSource: "steps",
    viewW: 360,
    viewH: 60,
    colorActive: "#2563eb",
    colorPending: "#cbd5e1",
    label: "Progress (dot strip)",
  })
  .phase("p1", { duration: 1200, title: "最初の 2 段", body: "" }, (p: PhaseBuilder) =>
    p.activate("signupNode").badge("wizard"),
  )
  .phase("p2", { duration: 1200, title: "中ほどまで", body: "" }, (p: PhaseBuilder) =>
    p.activate("signupNode", "profileNode", "prefsNode").badge("wizard"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "最後まで",
      body: "5 区画 pipeline (Sign up → Profile → Preferences → Verify → Done) を 3 列 2 段に置いて + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("signupNode", "profileNode", "prefsNode", "verifyNode", "doneNode")
        .badge("wizard"),
  )
  .build();
export const subtitle__onboardingStepper =
  "onboarding 5 step wizard を 3 列 2 段の pipeline + 4 edge で wizard 遷移を node network 化、 stepIndicator readout 併存";

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
  .node("badRange", {
    lane: "bad",
    stack: 0,
    kind: "card",
    title: "Bad range",
    subtitle: "0-40 (red)",
  })
  .node("avgRange", {
    lane: "avg",
    stack: 0,
    kind: "card",
    title: "Avg range",
    subtitle: "40-70 (yellow) · actual {actual} here",
  })
  .node("goodRange", {
    lane: "good",
    stack: 0,
    kind: "card",
    title: "Good range",
    subtitle: "70-100 (green) · target {target}",
  })
  .node("actualNode", {
    lane: "avg",
    stack: 1,
    kind: "card",
    title: "◆ Actual",
    subtitle: "{actual}",
  })
  .node("targetNode", {
    lane: "good",
    stack: 1,
    kind: "card",
    title: "▼ Target",
    subtitle: "{target}",
  })
  .edge("actualNode", "targetNode", { label: "gap = target - actual", tone: "warning" })
  .readout.bulletChart("b", {
    source: "actual",
    targetSource: "target",
    max: 100,
    rangeBad: 40,
    rangeAvg: 70,
    viewW: 320,
    viewH: 40,
    colorActual: "#241c14",
    label: "Progress (bullet chart)",
  })
  .readout.stat("targetStat", { source: "target", label: "Target" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "悪い帯を見る",
      body: "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。",
    },
    (p: PhaseBuilder) => p.activate("badRange", "actualNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "並の帯を見る",
      body: "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。",
    },
    (p: PhaseBuilder) => p.activate("badRange", "avgRange", "actualNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "良い帯と目標",
      body: "一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。",
    },
    (p: PhaseBuilder) =>
      p.activate("badRange", "avgRange", "goodRange", "actualNode", "targetNode"),
  )
  .build();
export const subtitle__kpiBullet =
  "KPI bullet chart を 3-lane (bad / avg / good) range 分散 + actual/target 個別 card、 bulletChart readout 併存";

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
  .node("currentNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 270,
    title: "◆ Current",
    subtitle: "${rev}M (slider driven)",
  })
  .node("targetNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 200,
    title: "Target",
    subtitle: "$500M (Q3 goal)",
  })
  .node("gapNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Gap",
    subtitle: "target - current (progress toward goal)",
  })
  .edge("currentNode", "targetNode", { label: "progress", tone: "info" })
  .edge("targetNode", "gapNode", { label: "delta", tone: "warning" })
  .readout.numberBoard("nb", {
    source: "rev",
    prefix: "$",
    suffix: "M",
    size: 56,
    color: "#241c14",
    caption: "vs $500M target",
    label: "Revenue (scoreboard)",
  })
  .phase("p1", { duration: 1200, title: "現在を見る", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode").badge("scoreboard"),
  )
  .phase("p2", { duration: 1200, title: "目標を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode", "targetNode").badge("scoreboard"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "差を出す",
      body: "3 区画 (Current / Target / Gap) を 2 列 2 段に置いて revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。",
    },
    (p: PhaseBuilder) => p.activate("currentNode", "targetNode", "gapNode").badge("scoreboard"),
  )
  .build();
export const subtitle__revenueScoreboard =
  "revenue Q3 status を 3 区画 (Current / Target / Gap) 2 列 2 段 + 2 edge、 scoreboard display に加え target との差を可視化";

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
  .node("aliceNode", {
    lane: "top",
    stack: 0,
    kind: "card",
    title: "🥇 1st Alice",
    subtitle: "首位",
  })
  .node("eveNode", { lane: "top", stack: 1, kind: "card", title: "🥈 2nd Eve", subtitle: "2 位" })
  .node("carolNode", {
    lane: "top",
    stack: 2,
    kind: "card",
    title: "🥉 3rd Carol",
    subtitle: "3 位",
  })
  .node("bobNode", { lane: "middle", stack: 0, kind: "card", title: "4th Bob", subtitle: "中位" })
  .node("frankNode", {
    lane: "middle",
    stack: 1,
    kind: "card",
    title: "5th Frank",
    subtitle: "表示の末尾",
  })
  .node("danNode", { lane: "bottom", stack: 0, kind: "card", title: "6th Dan", subtitle: "圏外" })
  .readout.leaderboard("lb", {
    source: "players",
    max: 5,
    color: "#2563eb",
    label: "Ranking (top 5 leaderboard)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "接戦の状態",
      body: "上位の点差が小さい状態。 並びが僅差で決まる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceNode")
        .set("players", '[["Alice",920],["Bob",915],["Carol",910],["Dan",905],["Eve",900]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "差が開く",
      body: "首位が抜ける。 上位と下位の点差が大きくなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceNode", "eveNode")
        .set("players", '[["Alice",1180],["Eve",890],["Carol",850],["Bob",780],["Frank",720]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "順位が入れ替わる",
      body: "別の人が首位に立つ。 並びが上下ごと組み替わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceNode", "eveNode", "carolNode", "bobNode", "frankNode", "danNode")
        .set(
          "players",
          '[["Carol",1240],["Alice",1180],["Frank",1050],["Eve",890],["Bob",780],["Dan",680]]',
        ),
  )
  .build();
export const subtitle__playerLeaderboard =
  "6 player を 3-lane (Top 3 medals / Middle 2 / Bottom 1 out of top) rank 別分散、 各 player 個別 card、 leaderboard readout 併存";

/**
 * 57. traffic-light = 3-color status、 dropdown で red/yellow/green 選択 → active dot が glow 表示。
 */
export const buildStatusTrafficLight = diagram("interactive-build-traffic-light", {
  topic: "ビルド状態を信号機の 3 色で見せる",
})
  .lane("red", { x: 0, width: 200 })
  .lane("yellow", { x: 240, width: 200 })
  .lane("green", { x: 480, width: 200 })
  .input.dropdown("status", {
    options: ["red", "yellow", "green"],
    defaultValue: "green",
    label: "Build status",
  })
  .state("status", { initial: "green" })
  .node("redNode", {
    lane: "red",
    stack: 0,
    kind: "card",
    title: "● Red",
    subtitle: "ビルド失敗 · 要修正",
  })
  .node("yellowNode", {
    lane: "yellow",
    stack: 0,
    kind: "card",
    title: "● Yellow",
    subtitle: "ビルド実行中 · 待機",
  })
  .node("greenNode", {
    lane: "green",
    stack: 0,
    kind: "card",
    title: "● Green",
    subtitle: "ビルド成功 · deploy 可",
  })
  .node("currentCI", {
    lane: "green",
    stack: 1,
    kind: "card",
    title: "◆ Current CI",
    subtitle: "status: {status}",
  })
  .readout.trafficLight("tl", {
    source: "status",
    viewW: 70,
    viewH: 180,
    label: "Status (3-color indicator)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "赤を見る",
      body: "止まっている時に点く色。 3 色のうち 1 つ目で、状態はつまみで選ぶ。",
    },
    (p: PhaseBuilder) => p.activate("redNode"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "黄を見る",
      body: "走っている間の色。 選んだ状態に応じて 1 つだけが点く。",
    },
    (p: PhaseBuilder) => p.activate("redNode", "yellowNode"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "緑を見る",
      body: "通った時の色。 3 色で状態を読み分ける形になっている。",
    },
    (p: PhaseBuilder) => p.activate("redNode", "yellowNode", "greenNode", "currentCI"),
  )
  .build();
export const subtitle__buildStatusTrafficLight =
  "build status 3 state (red/yellow/green) を 3-lane 分散、 各 state 個別 card + current indicator、 trafficLight readout 併存";

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
  .node("reactNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "React",
    subtitle: "最も大きい語",
  })
  .node("tsNode", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "TypeScript",
    subtitle: "大きい語",
  })
  .node("pyNode", {
    lane: "high",
    stack: 2,
    kind: "card",
    title: "Python",
    subtitle: "やや大きい語",
  })
  .node("rustNode", { lane: "mid", stack: 0, kind: "card", title: "Rust", subtitle: "中位の語" })
  .node("goNode", { lane: "mid", stack: 1, kind: "card", title: "Go", subtitle: "やや小さい語" })
  .node("svelteNode", {
    lane: "mid",
    stack: 2,
    kind: "card",
    title: "Svelte",
    subtitle: "小さい語",
  })
  .node("vueNode", { lane: "low", stack: 0, kind: "card", title: "Vue", subtitle: "より小さい語" })
  .node("denoNode", {
    lane: "low",
    stack: 1,
    kind: "card",
    title: "Deno",
    subtitle: "最も小さい語",
  })
  .readout.tagCloud("tc", {
    source: "tags",
    minSize: 12,
    maxSize: 32,
    label: "Tech cloud (font-size 比例)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "少ない語",
      body: "語が 3 つだけの状態。 大きさの差が読み取りやすい。",
    },
    (p: PhaseBuilder) =>
      p.activate("reactNode").set("tags", '[["React",30],["TypeScript",28],["Python",22]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "語が増える",
      body: "語が 8 つに増える。 大小の幅が広がる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("reactNode", "tsNode", "pyNode")
        .set(
          "tags",
          '[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "重みの幅が広がる",
      body: "大小の順はそのままで、上と下の差が開く。 文字の大きさの幅が最大まで使われる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate(
          "reactNode",
          "tsNode",
          "pyNode",
          "rustNode",
          "goNode",
          "svelteNode",
          "vueNode",
          "denoNode",
        )
        .set(
          "tags",
          '[["React",32],["TypeScript",29],["Python",24],["Rust",18],["Go",14],["Svelte",9],["Vue",6],["Deno",3]]',
        ),
  )
  .build();
export const subtitle__techTagCloud =
  "8 tech skill を 3-lane (High ≥20 / Mid 10-19 / Low <10) weight 別分散、 各 skill 個別 card、 tagCloud readout 併存";

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
  .node("e1", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 300,
    title: "Alice",
    subtitle: "最新の出来事",
  })
  .node("e2", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 290,
    title: "Bob",
    subtitle: "次に新しい出来事",
  })
  .node("e3", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Carol",
    subtitle: "中ほどの出来事",
  })
  .node("e4", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 270,
    title: "Dan",
    subtitle: "やや古い出来事",
  })
  .node("e5", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 270,
    title: "Eve",
    subtitle: "最も古い出来事",
  })
  .edge("e1", "e2", { label: "→", tone: "info" })
  .edge("e2", "e3", { label: "→", tone: "info" })
  .edge("e3", "e4", { label: "→", tone: "accent" })
  .edge("e4", "e5", { label: "→", tone: "accent" })
  .readout.activityFeed("af", {
    source: "events",
    max: 5,
    color: "#2563eb",
    label: "Recent (feed list)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 件だけ",
      body: "出来事が 1 件だけある状態。 一覧の先頭に入る。",
    },
    (p: PhaseBuilder) => p.activate("e1").set("events", '[["Alice","pushed to main","2 min ago"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "積み上がる",
      body: "出来事が増えて一覧が伸びる。 新しいものが上に来る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("e1", "e2", "e3")
        .set(
          "events",
          '[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "押し出される",
      body: "件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("e1", "e2", "e3", "e4", "e5")
        .set(
          "events",
          '[["Dan","released v2.0","1 min ago"],["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Eve","merged PR #38","1 h ago"]]',
        ),
  )
  .build();
export const subtitle__teamActivityFeed =
  "team activity 5 event を 3 列 2 段の timeline (recent → old) で個別 card 分散、 activityFeed readout 併存";

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
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "Low range",
    subtitle: "0-1.5 stars · poor",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "Mid range",
    subtitle: "2-3.5 stars · average · default 3.5 here",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "High range",
    subtitle: "4-5 stars · excellent",
  })
  .node("currentNode", {
    lane: "mid",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "{score} / 5",
  })
  .readout.rating("r", {
    source: "score",
    count: 5,
    color: "#eab308",
    label: "Rating (star display)",
  })
  .phase("p1", { duration: 1200, title: "帯を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("rating"),
  )
  .phase("p2", { duration: 1200, title: "現在の帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("rating"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの評価",
      body: "3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) で rating range を分散、 default 3.5 の位置 (mid lane) を currentNode で明示、 slider (0.5 刻み) 変化で rating readout 追随 (star display half-star 対応)、 range 分類と star 表示の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentNode").badge("rating"),
  )
  .build();
export const subtitle__productRating =
  "product rating を 3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) range 別分散 + current indicator、 rating readout 併存";

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
  .input.dropdown("kind", {
    options: ["info", "warn", "error", "success"],
    defaultValue: "warn",
    label: "Kind",
  })
  .state("kind", { initial: "warn" })
  .state("title", { initial: "Deploy in progress" })
  // 値の名前に `body` を使わない (#1389)。 段の項目 (`body:`) と同じ語で、記法に写すと
  // 1 つの図に `body:` が 2 つの意味で並ぶ (`lib/catalog-state-names.test.ts` が止める)
  .state("alertBody", { initial: "Building v1.2.3 for production" })
  .node("infoNode", {
    lane: "info",
    stack: 0,
    kind: "card",
    title: "ℹ Info",
    subtitle: "blue · 通知",
  })
  .node("warnNode", {
    lane: "warn",
    stack: 0,
    kind: "card",
    title: "⚠ Warn",
    subtitle: "yellow · 注意 (default)",
  })
  .node("errorNode", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "✕ Error",
    subtitle: "red · 失敗",
  })
  .node("successNode", {
    lane: "success",
    stack: 0,
    kind: "card",
    title: "✓ Success",
    subtitle: "green · 成功",
  })
  .node("currentAlert", {
    lane: "warn",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "kind: {kind}",
  })
  .readout.notification("nt", {
    kindSource: "kind",
    titleSource: "title",
    bodySource: "alertBody",
    label: "Alert (color + icon)",
  })
  .phase("p1", { duration: 1200, title: "情報と注意", body: "" }, (p: PhaseBuilder) =>
    p.activate("infoNode").badge("alert"),
  )
  .phase("p2", { duration: 1200, title: "異常と成功", body: "" }, (p: PhaseBuilder) =>
    p.activate("infoNode", "warnNode", "errorNode").badge("alert"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの通知",
      body: "4-lane (Info / Warn / Error / Success) で alert 4 kind を分散、 各 kind 個別 card + current indicator (default=warn lane)、 dropdown 切替で notification readout が color + icon (ℹ/⚠/✕/✓) 追随、 kind 分類と現在 state の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("infoNode", "warnNode", "errorNode", "successNode", "currentAlert").badge("alert"),
  )
  .build();
export const subtitle__alertNotification =
  "alert kind 4 種 (info/warn/error/success) を 4-lane 分散 + current indicator、 各 kind 個別 card、 notification readout 併存";

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
  .node("addCard", {
    lane: "adds",
    stack: 0,
    kind: "card",
    title: "+ Additions",
    subtitle: "+{add} lines (green)",
  })
  .node("addDetail", {
    lane: "adds",
    stack: 1,
    kind: "card",
    title: "adds/del",
    subtitle: "add > del → net growth",
  })
  .node("delCard", {
    lane: "dels",
    stack: 0,
    kind: "card",
    title: "- Deletions",
    subtitle: "-{del} lines (red)",
  })
  .node("delDetail", {
    lane: "dels",
    stack: 1,
    kind: "card",
    title: "cleanup",
    subtitle: "remove obsolete code",
  })
  .edge("addCard", "delCard", { label: "net = add - del", tone: "info" })
  .readout.diffCounter("dc", {
    additionsSource: "add",
    deletionsSource: "del",
    colorAdd: "#22c55e",
    colorDel: "#ef4444",
    label: "Diff (+N/-N bar)",
  })
  .phase("p1", { duration: 1200, title: "追加を見る", body: "" }, (p: PhaseBuilder) =>
    p.activate("addCard").badge("diff"),
  )
  .phase("p2", { duration: 1200, title: "削除を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("addCard", "addDetail").badge("diff"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "差し引き",
      body: "2-lane (Additions +N green / Deletions -N red) で PR diff を符号別分散、 各 lane に main card + detail card、 net delta edge (info tone) で add - del の差を明示、 diffCounter readout も併存で proportion bar 表示、 diff 構造と bar の 2 経路 view。",
    },
    (p: PhaseBuilder) => p.activate("addCard", "addDetail", "delCard", "delDetail").badge("diff"),
  )
  .build();
export const subtitle__commitDiffCounter =
  "git PR diff を 2-lane (Additions +N / Deletions -N) 分散 + net delta edge、 diffCounter readout 併存";

/**
 * 63. chat-bubble = customer support conversation 5 message、 self/other 左右寄せ表示。
 */
export const supportChat = diagram("interactive-support-chat", {
  topic: "問い合わせ 5 通を客 / 担当で分ける",
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
  .node("cust1", {
    lane: "customer",
    stack: 0,
    kind: "card",
    title: "Alice #1",
    subtitle: "利用者の 1 通目",
  })
  .node("cust2", {
    lane: "customer",
    stack: 1,
    kind: "card",
    title: "Alice #2",
    subtitle: "利用者の 2 通目",
  })
  .node("sup1", {
    lane: "support",
    stack: 0,
    kind: "card",
    title: "Support #1",
    subtitle: "応対側の 1 通目",
  })
  .node("sup2", {
    lane: "support",
    stack: 1,
    kind: "card",
    title: "Support #2",
    subtitle: "確認中の返答",
  })
  .node("sup3", {
    lane: "support",
    stack: 2,
    kind: "card",
    title: "Support #3",
    subtitle: "解決の返答",
  })
  .readout.chatBubble("cb", {
    source: "thread",
    max: 6,
    colorSelf: "#2563eb",
    colorOther: "#f0e0b8",
    label: "Conversation (bubbles)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "問い合わせ",
      body: "利用者からの 1 通目。 左側に吹き出しが出る。",
    },
    (p: PhaseBuilder) =>
      p.activate("cust1").set("thread", '[["Alice","Hi, I need help with my order",false]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "やり取りが続く",
      body: "応対側が返し、利用者が答える。 左右に交互に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("cust1", "sup1", "cust2")
        .set(
          "thread",
          '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "解決する",
      body: "確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("cust1", "sup1", "cust2", "sup2", "sup3")
        .set(
          "thread",
          '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false],["Support","Checking...",true],["Support","Refunded! 3-5 days.",true]]',
        ),
  )
  .build();
export const subtitle__supportChat =
  "customer support 5 message を 2-lane (Customer / Support) speaker 別分散、 各 message 個別 card、 chatBubble readout 併存";

/**
 * 64. avatar = user profile avatar、 text input で name 変化 → initials + color circle 追随。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "名前からアイコン画像を組み立てる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.text("user", {
    defaultValue: "Alice Wonderland",
    placeholder: "Full name",
    maxLength: 40,
    label: "User name",
  })
  .state("user", { initial: "Alice Wonderland" })
  .node("inputNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 270,
    title: "Text input",
    subtitle: "user = {user}",
  })
  .node("initialsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Initials",
    subtitle: "first 2 word head chars (Alice Wonderland → AW)",
  })
  .node("circleNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Circle",
    subtitle: "size 56 · blue #2563eb + AW text",
  })
  .edge("inputNode", "initialsNode", { label: "parse", tone: "info" })
  .edge("initialsNode", "circleNode", { label: "render", tone: "success" })
  .readout.avatar("av", { source: "user", size: 56, color: "#2563eb", label: "Avatar (rendered)" })
  .phase("p1", { duration: 1200, title: "名前を受ける", body: "" }, (p: PhaseBuilder) =>
    p.activate("inputNode").badge("avatar"),
  )
  .phase("p2", { duration: 1200, title: "頭文字を取る", body: "" }, (p: PhaseBuilder) =>
    p.activate("inputNode", "initialsNode").badge("avatar"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "絵にする",
      body: "3 区画 (Input name / Initials extract / Circle render) を 2 列 2 段に置いて avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。",
    },
    (p: PhaseBuilder) => p.activate("inputNode", "initialsNode", "circleNode").badge("avatar"),
  )
  .build();
export const subtitle__userAvatar =
  "user avatar generation pipeline を 3 区画 (Input name / Initials extract / Circle render) 2 列 2 段 + 2 edge で pipeline network 化、 avatar readout 併存";

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
  .node("t3", {
    lane: "todo",
    stack: 0,
    kind: "card",
    title: "Fix bug #42",
    subtitle: "todo (blocker)",
  })
  .node("t4", {
    lane: "todo",
    stack: 1,
    kind: "card",
    title: "Code review",
    subtitle: "todo (awaits reviewer)",
  })
  .node("t5", {
    lane: "todo",
    stack: 2,
    kind: "card",
    title: "Deploy",
    subtitle: "todo (depends on review)",
  })
  .node("t6", {
    lane: "todo",
    stack: 3,
    kind: "card",
    title: "Post-mortem",
    subtitle: "todo (last)",
  })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "Progress (2/6 = 33%)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "着手前",
      body: "どれも未完了の状態。 印が 1 つも付いていない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("t1")
        .set(
          "tasks",
          '[["Setup CI",false],["Write tests",false],["Fix bug #42",false],["Code review",false],["Deploy",false],["Retro",false]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "半分進む",
      body: "前半が終わる。 印の付いた項目が上に集まる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("t1", "t2", "t3")
        .set(
          "tasks",
          '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",false],["Deploy",false],["Retro",false]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "残り 1 件",
      body: "最後の 1 件を残して終わる。 未完了がどれか一目で分かる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("t1", "t2", "t3", "t4", "t5", "t6")
        .set(
          "tasks",
          '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",true],["Deploy",true],["Retro",false]]',
        ),
  )
  .build();
export const subtitle__sprintChecklist =
  "sprint 6 task を 2-lane (Done ✓ / Todo) 状態別分散、 各 task 個別 card、 checklist readout 併存";

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
  .node("idleNode", {
    lane: "idle",
    stack: 0,
    kind: "card",
    title: "Idle range",
    subtitle: "0-2000 rpm (green)",
  })
  .node("cruiseNode", {
    lane: "cruise",
    stack: 0,
    kind: "card",
    title: "Cruise range",
    subtitle: "2000-5000 rpm (yellow) · normal driving",
  })
  .node("redlineNode", {
    lane: "redline",
    stack: 0,
    kind: "card",
    title: "Redline",
    subtitle: "5000-8000 rpm (red) · caution",
  })
  .node("currentRpm", {
    lane: "cruise",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "{rpm} rpm (default 3500 = cruise)",
  })
  .readout.circularGauge("g", {
    source: "rpm",
    min: 0,
    max: 8000,
    unit: "rpm",
    color: "#f97316",
    viewW: 200,
    viewH: 160,
    label: "Tachometer (270° dial)",
  })
  .phase("p1", { duration: 1200, title: "通常と巡航", body: "" }, (p: PhaseBuilder) =>
    p.activate("idleNode").badge("tachometer"),
  )
  .phase("p2", { duration: 1200, title: "過回転まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("idleNode", "cruiseNode").badge("tachometer"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの回転数",
      body: "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("idleNode", "cruiseNode", "redlineNode", "currentRpm").badge("tachometer"),
  )
  .build();
export const subtitle__engineTachometer =
  "engine RPM を 3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) 領域別分散 + current rpm indicator、 circularGauge readout 併存";

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
  .node("oldNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 310,
    title: "Old price",
    subtitle: "${oldPrice} (strikethrough)",
  })
  .node("newNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "New price",
    subtitle: "${newPrice} (stepper driven)",
  })
  .node("discountNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "Discount %",
    subtitle: "(oldPrice - newPrice) / oldPrice · red badge",
  })
  .edge("oldNode", "newNode", { label: "sale", tone: "warning" })
  .edge("newNode", "discountNode", { label: "%", tone: "error" })
  .readout.priceTag("pt", {
    oldSource: "oldPrice",
    newSource: "newPrice",
    currency: "$",
    colorNew: "#241c14",
    colorOld: "#a08870",
    colorDiscount: "#ef4444",
    label: "Price (composite tag)",
  })
  .phase("p1", { duration: 1200, title: "旧価格", body: "" }, (p: PhaseBuilder) =>
    p.activate("oldNode").badge("price"),
  )
  .phase("p2", { duration: 1200, title: "新価格", body: "" }, (p: PhaseBuilder) =>
    p.activate("oldNode", "newNode").badge("price"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "割引率",
      body: "3 区画 (Old / New / Discount) を 2 列 2 段に置いて price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。",
    },
    (p: PhaseBuilder) => p.activate("oldNode", "newNode", "discountNode").badge("price"),
  )
  .build();
export const subtitle__productPriceTag =
  "e-commerce price tag を 3 区画 (Old price / New price / Discount %) 2 列 2 段 + 2 edge、 discount 計算経路可視化、 priceTag readout 併存";

/**
 * 68. spinner = deploy status、 dropdown で running/done/error 切替 → icon 変化。
 */
export const deploySpinner = diagram("interactive-deploy-spinner", {
  topic: "配備状態を実行中 / 完了 / 失敗で見せる",
})
  .lane("running", { x: 0, width: 220 })
  .lane("done", { x: 260, width: 220 })
  .lane("error", { x: 520, width: 220 })
  .input.dropdown("status", {
    options: ["running", "done", "error"],
    defaultValue: "running",
    label: "Status",
  })
  .input.text("msg", {
    defaultValue: "Building production bundle...",
    placeholder: "Status message",
    maxLength: 60,
    label: "Message",
  })
  .state("status", { initial: "running" })
  .state("msg", { initial: "Building production bundle..." })
  .node("runningNode", {
    lane: "running",
    stack: 0,
    kind: "card",
    title: "◐ Running",
    subtitle: "blue spinner · SMIL 回転 circle",
  })
  .node("doneNode", {
    lane: "done",
    stack: 0,
    kind: "card",
    title: "✓ Done",
    subtitle: "green · deploy success",
  })
  .node("errorNode", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "✕ Error",
    subtitle: "red · deploy failed",
  })
  .node("currentState", {
    lane: "running",
    stack: 1,
    kind: "card",
    title: "◆ Deploy",
    subtitle: "status: {status} · msg: {msg}",
  })
  .readout.spinner("sp", {
    source: "status",
    textSource: "msg",
    color: "#2563eb",
    label: "Deploy (spinner + text)",
  })
  .phase("p1", { duration: 1200, title: "実行中", body: "" }, (p: PhaseBuilder) =>
    p.activate("runningNode").badge("loading"),
  )
  .phase("p2", { duration: 1200, title: "完了と失敗", body: "" }, (p: PhaseBuilder) =>
    p.activate("runningNode", "doneNode").badge("loading"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの状態",
      body: "3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("runningNode", "doneNode", "errorNode", "currentState").badge("loading"),
  )
  .build();
export const subtitle__deploySpinner =
  "deploy 3 state (running/done/error) を 3-lane 分散 + current indicator、 spinner readout 併存";

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
  .node("bNode", {
    lane: "B",
    stack: 0,
    kind: "card",
    title: "B",
    subtitle: "80-89 (blue, default here)",
  })
  .node("cNode", { lane: "C", stack: 0, kind: "card", title: "C", subtitle: "70-79 (yellow)" })
  .node("dNode", { lane: "D", stack: 0, kind: "card", title: "D", subtitle: "60-69 (orange)" })
  .node("fNode", { lane: "F", stack: 0, kind: "card", title: "F", subtitle: "< 60 (red)" })
  .node("currentGrade", {
    lane: "B",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "score = {score} / 100",
  })
  .readout.grade("g", { source: "score", max: 100, label: "Letter grade (band)" })
  .phase("p1", { duration: 1200, title: "上の 2 段階", body: "" }, (p: PhaseBuilder) =>
    p.activate("aNode", "bNode").badge("grade"),
  )
  .phase("p2", { duration: 1200, title: "下の 3 段階", body: "" }, (p: PhaseBuilder) =>
    p.activate("aNode", "bNode", "cNode", "dNode").badge("grade"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの成績",
      body: "5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60) で 5 letter grade band を分散、 各 band 個別 card + current indicator (default score 85 → B lane)、 slider 変化で grade readout が letter + color 追随、 grade band 分類と current の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("aNode", "bNode", "cNode", "dNode", "fNode", "currentGrade").badge("grade"),
  )
  .build();
export const subtitle__examGrade =
  "exam grade 5 letter (A/B/C/D/F) を 5-lane band 分散 + current indicator (default=B lane)、 grade readout 併存";

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
  .node("secNode", {
    lane: "input",
    stack: 0,
    kind: "card",
    title: "Seconds",
    subtitle: "sec = {sec}s (0-3600)",
  })
  .node("runNode", {
    lane: "toggle",
    stack: 0,
    kind: "card",
    title: "Running",
    subtitle: "running = {running}",
  })
  .node("displayNode", {
    lane: "display",
    stack: 0,
    kind: "card",
    title: "MM:SS.ms",
    subtitle: "elapsed = sec × 1000 = {elapsed}ms",
  })
  .edge("secNode", "displayNode", { label: "× 1000", tone: "info" })
  .edge("runNode", "displayNode", { label: "color", tone: "success" })
  .readout.stopwatch("sw", {
    source: "elapsed",
    runningSource: "running",
    size: 40,
    color: "#241c14",
    label: "Timer (MM:SS.ms)",
  })
  .phase("p1", { duration: 1200, title: "秒数", body: "" }, (p: PhaseBuilder) =>
    p.activate("secNode").badge("timer"),
  )
  .phase("p2", { duration: 1200, title: "実行状態", body: "" }, (p: PhaseBuilder) =>
    p.activate("secNode", "runNode").badge("timer"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "時計表示",
      body: "3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。",
    },
    (p: PhaseBuilder) => p.activate("secNode", "runNode", "displayNode").badge("timer"),
  )
  .build();
export const subtitle__timerStopwatch =
  "stopwatch control を 3-lane (Seconds input / Running toggle / MM:SS.ms display) + 2 edge、 stepper + toggle → display fan-out、 stopwatch readout 併存";

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
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "Low band",
    subtitle: "< 40% (red · uncertain)",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "Mid band",
    subtitle: "40-74% (yellow · borderline)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "High band",
    subtitle: "≥ 75% (green · confident)",
  })
  .node("currentConf", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "conf = {conf}% (default 82 → high)",
  })
  .readout.confidenceMeter("cm", {
    source: "conf",
    lowThreshold: 40,
    highThreshold: 75,
    viewW: 280,
    viewH: 40,
    label: "Confidence (3-band bar)",
  })
  .phase("p1", { duration: 1200, title: "低い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("ML conf"),
  )
  .phase("p2", { duration: 1200, title: "高い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("ML conf"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの確信度",
      body: "3-lane (Low <40 red / Mid 40-74 yellow / High ≥75 green) で 3 confidence band を分散、 current indicator (default 82 → high lane)、 slider 変化で confidenceMeter readout が band 色追随、 ML/AI classification band 分類と meter の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentConf").badge("ML conf"),
  )
  .build();
export const subtitle__mlConfidenceMeter =
  "ML confidence を 3-lane (Low <40 / Mid 40-74 / High ≥75) band 別分散 + current indicator (default=high)、 confidenceMeter readout 併存";

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
  .node("thumbNode", {
    lane: "thumb",
    stack: 0,
    kind: "card",
    w: 310,
    title: "👍 Thumbs up",
    subtitle: "最も多く付く反応",
  })
  .node("heartNode", {
    lane: "heart",
    stack: 0,
    kind: "card",
    w: 220,
    title: "❤️ Heart",
    subtitle: "次に多い反応",
  })
  .node("laughNode", {
    lane: "laugh",
    stack: 0,
    kind: "card",
    w: 220,
    title: "😂 Laugh",
    subtitle: "中ほどの反応",
  })
  .node("partyNode", {
    lane: "party",
    stack: 0,
    kind: "card",
    w: 220,
    title: "🎉 Party",
    subtitle: "最も少ない反応",
  })
  .readout.reactionBar("rb", {
    source: "reactions",
    color: "#2563eb",
    label: "Reactions (pill list)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "投稿した直後",
      body: "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。",
    },
    (p: PhaseBuilder) =>
      p.activate("thumbNode").set("reactions", '[["👍",5],["❤️",3],["😂",2],["🎉",1]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "広まる",
      body: "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbNode", "heartNode")
        .set("reactions", '[["👍",14],["❤️",7],["😂",4],["🎉",2]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "落ち着く",
      body: "伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbNode", "heartNode", "laughNode", "partyNode")
        .set("reactions", '[["👍",24],["❤️",12],["😂",8],["🎉",5]]'),
  )
  .build();
export const subtitle__postReactions =
  "social post 4 reaction を 4-lane emoji 別分散、 各 reaction 個別 card、 reactionBar readout 併存";

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
  .node("reactNode", {
    lane: "frontend",
    stack: 0,
    kind: "card",
    title: "React",
    subtitle: "画面を組み立てる部品",
  })
  .node("tsNode", {
    lane: "frontend",
    stack: 1,
    kind: "card",
    title: "TypeScript",
    subtitle: "型の付いた書き方",
  })
  .node("rustNode", {
    lane: "systems",
    stack: 0,
    kind: "card",
    title: "Rust",
    subtitle: "土台を書く言語",
  })
  .node("viteNode", {
    lane: "build",
    stack: 0,
    kind: "card",
    title: "Vite",
    subtitle: "開発中の配信役",
  })
  .node("bunNode", { lane: "build", stack: 1, kind: "card", title: "Bun", subtitle: "実行の土台" })
  .readout.pillGroup("pg", { source: "stack", label: "Stack (pill group)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "画面から始める",
      body: "画面周りの 2 つだけを使う。 札はその 2 色しか出ず、横の並びが短い。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("reactNode", "tsNode")
        .set("stack", '[["React","#61dafb"],["TypeScript","#3178c6"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "土台を足す",
      body: "土台を書く言語が加わる。 札が 1 つ増え、系統の違う色が並びに混じる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("reactNode", "tsNode", "rustNode")
        .set("stack", '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "組み立てまで揃う",
      body: "組み立てと実行の土台が揃う。 札は 5 枚になり、色が札ごとに違うことが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("reactNode", "tsNode", "rustNode", "viteNode", "bunNode")
        .set(
          "stack",
          '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]',
        ),
  )
  .build();
export const subtitle__techPills =
  "tech stack 5 pill を 3-lane (Frontend / Systems / Build) category 別分散、 各 tool 個別 card、 pillGroup readout 併存";

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
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "Low band",
    subtitle: "< 20% (red · critical)",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "Mid band",
    subtitle: "20-60% (yellow · charge soon)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "High band",
    subtitle: "≥ 60% (green · healthy)",
  })
  .node("currentBattery", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "battery = {battery}% (default 72 → high)",
  })
  .readout.fuelBar("fb", {
    source: "battery",
    segments: 10,
    lowThreshold: 20,
    highThreshold: 60,
    viewW: 240,
    viewH: 32,
    label: "Level (10 segment bar)",
  })
  .phase("p1", { duration: 1200, title: "低い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("battery"),
  )
  .phase("p2", { duration: 1200, title: "高い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("battery"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの残量",
      body: "3-lane (Low <20 red / Mid 20-60 yellow / High ≥60 green) で battery 3 band を分散、 current indicator (default 72 → high lane)、 slider 変化で fuelBar readout の filled 数 + color 追随、 battery / fuel / stamina 状態を lane 分割で可視化。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentBattery").badge("battery"),
  )
  .build();
export const subtitle__deviceBattery =
  "battery level を 3-lane (Low <20 / Mid 20-60 / High ≥60) band 別分散 + current indicator (default=high)、 fuelBar readout 併存";

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
  .node("usersNode", {
    lane: "users",
    stack: 0,
    kind: "card",
    w: 220,
    title: "Users",
    subtitle: "月あたりの利用者",
  })
  .node("revenueNode", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    w: 200,
    title: "Revenue",
    subtitle: "月ごとの売上",
  })
  .node("uptimeNode", {
    lane: "uptime",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Uptime",
    subtitle: "動き続けた割合",
  })
  .node("errorsNode", {
    lane: "errors",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Errors",
    subtitle: "異常の件数 (直近)",
  })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "Metrics (2×2 grid)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "立ち上げ",
      body: "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("usersNode", "errorsNode")
        .set("kpis", '[["Users","3.1k"],["Revenue","$9k"],["Uptime","98.2","%"],["Errors",47]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "伸びる",
      body: "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("usersNode", "revenueNode", "errorsNode")
        .set("kpis", '[["Users","7.8k"],["Revenue","$26k"],["Uptime","99.4","%"],["Errors",23]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "落ち着く",
      body: "4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("usersNode", "revenueNode", "uptimeNode", "errorsNode")
        .set("kpis", '[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]'),
  )
  .build();
export const subtitle__dashboardMetricsGrid =
  "SaaS 4 KPI を 4-lane (Users / Revenue / Uptime / Errors) 分散、 各 KPI 個別 card、 metricsGrid readout 併存";

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
  .node("coldNode", {
    lane: "cold",
    stack: 0,
    kind: "card",
    title: "Cold band",
    subtitle: "< 15°C (blue · heating)",
  })
  .node("comfortNode", {
    lane: "comfort",
    stack: 0,
    kind: "card",
    title: "Comfort band",
    subtitle: "15-25°C (green · default range)",
  })
  .node("hotNode", {
    lane: "hot",
    stack: 0,
    kind: "card",
    title: "Hot band",
    subtitle: "≥ 25°C (red · cooling)",
  })
  .node("currentTemp", {
    lane: "comfort",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "temp = {temp}°C (default 24 → comfort)",
  })
  .readout.thermometer("th", {
    source: "temp",
    min: 0,
    max: 40,
    viewW: 70,
    viewH: 180,
    color: "#ef4444",
    unit: "°C",
    label: "Temp (vertical bar)",
  })
  .phase("p1", { duration: 1200, title: "寒い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("coldNode").badge("temp"),
  )
  .phase("p2", { duration: 1200, title: "暑い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("coldNode", "comfortNode").badge("temp"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの室温",
      body: "3-lane (Cold <15 / Comfort 15-25 / Hot ≥25) で room 温度を band 別分散、 current indicator (default 24 → comfort lane)、 slider 変化で thermometer readout 縦 bar + 球部 追随、 温度帯分類と thermometer 表示の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("coldNode", "comfortNode", "hotNode", "currentTemp").badge("temp"),
  )
  .build();
export const subtitle__roomThermometer =
  "室温を 3-lane (Cold <15°C / Comfort 15-25°C / Hot ≥25°C) 温度帯別分散 + current indicator、 thermometer readout 併存";

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
  .node("growthNode", {
    lane: "growth",
    stack: 0,
    kind: "card",
    title: "📈 Growth",
    subtitle: "前の月からの伸び",
  })
  .node("revenueNode", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    title: "💰 Revenue",
    subtitle: "月ごとの売上",
  })
  .node("goalsNode", {
    lane: "goals",
    stack: 0,
    kind: "card",
    title: "🎯 Goals",
    subtitle: "達成した目標の数",
  })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "KPIs (icon tile)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "期の始め",
      body: "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("growthNode")
        .set("kpis", '[["📈","Growth","+2%"],["💰","Revenue","$18k"],["🎯","Goals","2/10"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "期の半ば",
      body: "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("growthNode", "revenueNode")
        .set("kpis", '[["📈","Growth","+9%"],["💰","Revenue","$33k"],["🎯","Goals","5/10"]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "期の終わり",
      body: "目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("growthNode", "revenueNode", "goalsNode")
        .set("kpis", '[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]'),
  )
  .build();
export const subtitle__kpiIconTile =
  "3 KPI (Growth / Revenue / Goals) を 3-lane 個別 tile 分散、 iconTile readout 併存";

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
  .node("btc", {
    lane: "gainers",
    stack: 0,
    kind: "card",
    title: "₿ BTC",
    subtitle: "上げ幅が中くらい",
  })
  .node("sol", {
    lane: "gainers",
    stack: 1,
    kind: "card",
    title: "◎ SOL",
    subtitle: "上げ幅が最も大きい",
  })
  .node("eth", {
    lane: "losers",
    stack: 0,
    kind: "card",
    title: "Ξ ETH",
    subtitle: "下げ幅が大きい",
  })
  .node("doge", {
    lane: "losers",
    stack: 1,
    kind: "card",
    title: "Ð DOGE",
    subtitle: "下げ幅が小さい",
  })
  .readout.tokenList("tl", {
    source: "tokens",
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "Portfolio (aggregate)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "朝の値動き",
      body: "値動きがどれも小さい。 上げ下げの色は付くが、幅の差はまだ読み取りにくい。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("btc", "eth")
        .set(
          "tokens",
          '[["₿","BTC","0.42",0.6],["Ξ","ETH","12.5",-0.4],["◎","SOL","245",1.1],["Ð","DOGE","8500",-0.3]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "昼の値動き",
      body: "値動きが広がる。 保有量は変わらず、増減の割合だけが動くことが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("btc", "sol", "eth")
        .set(
          "tokens",
          '[["₿","BTC","0.42",2.7],["Ξ","ETH","12.5",-1.5],["◎","SOL","245",4.2],["Ð","DOGE","8500",-0.8]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "引けの値動き",
      body: "上げ 2 銘柄と下げ 2 銘柄の差が最も開く。 緑と赤の対比で組の性格が分かれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("btc", "sol", "eth", "doge")
        .set(
          "tokens",
          '[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]',
        ),
  )
  .build();
export const subtitle__cryptoWallet =
  "crypto wallet 4 token を 2-lane (Gainers +% / Losers -%) に分散、 各 token を個別 card、 tokenList readout 併存";

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
  .node("tokyo", {
    lane: "apac",
    stack: 0,
    kind: "card",
    title: "Tokyo",
    subtitle: "最初の拠点 (右寄り・やや下)",
  })
  .node("sydney", {
    lane: "apac",
    stack: 1,
    kind: "card",
    title: "Sydney",
    subtitle: "最も下に出る点",
  })
  .node("nyc", { lane: "amea", stack: 0, kind: "card", title: "NYC", subtitle: "最も左に出る点" })
  .node("paris", {
    lane: "amea",
    stack: 1,
    kind: "card",
    title: "Paris",
    subtitle: "最も上に出る点",
  })
  .node("rio", { lane: "amea", stack: 2, kind: "card", title: "Rio", subtitle: "左下に出る点" })
  .readout.mapPin("mp", {
    source: "cities",
    xMin: 0,
    xMax: 120,
    yMin: 0,
    yMax: 80,
    viewW: 300,
    viewH: 200,
    color: "#2563eb",
    label: "World map (2D coord)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "拠点は 1 つ",
      body: "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。",
    },
    (p: PhaseBuilder) => p.activate("tokyo").set("cities", '[["Tokyo",100,60]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "西へ広がる",
      body: "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tokyo", "nyc", "paris")
        .set("cities", '[["Tokyo",100,60],["NYC",30,40],["Paris",60,30]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "南半球まで",
      body: "下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tokyo", "sydney", "nyc", "paris", "rio")
        .set(
          "cities",
          '[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]',
        ),
  )
  .build();
export const subtitle__worldMapPins =
  "world map 5 city を 2-lane (Asia-Pacific / America-Europe) に分散、 各 city 個別 node + 座標表記、 mapPin readout 併存";

/**
 * 80. priority-badge = issue priority、 dropdown で high/med/low 切替 → badge + text 追随。
 */
export const issuePriorityBadge = diagram("interactive-issue-priority", {
  topic: "課題の優先度を高 / 中 / 低で見せる",
})
  .lane("high", { x: 0, width: 200 })
  .lane("med", { x: 240, width: 200 })
  .lane("low", { x: 480, width: 200 })
  .input.dropdown("prio", {
    options: ["high", "med", "low"],
    defaultValue: "high",
    label: "Priority",
  })
  .input.text("desc", {
    defaultValue: "Fix crash on startup",
    placeholder: "Issue description",
    maxLength: 60,
    label: "Description",
  })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "Fix crash on startup" })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "▲ High",
    subtitle: "red · crash / regression",
  })
  .node("medNode", {
    lane: "med",
    stack: 0,
    kind: "card",
    title: "● Med",
    subtitle: "yellow · normal bug",
  })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "▼ Low",
    subtitle: "gray · nice-to-have",
  })
  .node("currentIssue", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ Current",
    subtitle: "prio: {prio} · {desc}",
  })
  .readout.priorityBadge("pb", {
    source: "prio",
    textSource: "desc",
    label: "Priority (badge + icon + text)",
  })
  .phase("p1", { duration: 1200, title: "高い優先度", body: "" }, (p: PhaseBuilder) =>
    p.activate("highNode").badge("issue"),
  )
  .phase("p2", { duration: 1200, title: "低い優先度まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("highNode", "medNode").badge("issue"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの課題",
      body: "3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。",
    },
    (p: PhaseBuilder) =>
      p.activate("highNode", "medNode", "lowNode", "currentIssue").badge("issue"),
  )
  .build();
export const subtitle__issuePriorityBadge =
  "issue priority を 3-lane (High ▲ / Med ● / Low ▼) 分散、 現在選択 priority を currentIssue node で明示、 priorityBadge readout 併存";

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
  .node("silverNode", {
    lane: "silver",
    stack: 0,
    kind: "card",
    title: "🥈 2nd Bob",
    subtitle: "銀 · 中央のすぐ左",
  })
  .node("goldNode", {
    lane: "gold",
    stack: 0,
    kind: "card",
    title: "🥇 1st Alice",
    subtitle: "金 · 中央で最も高い",
  })
  .node("bronzeNode", {
    lane: "bronze",
    stack: 0,
    kind: "card",
    title: "🥉 3rd Carol",
    subtitle: "銅 · 中央のすぐ右",
  })
  .readout.podium("pod", {
    source: "winners",
    viewW: 280,
    viewH: 180,
    label: "Podium (3 縦 bar 表彰台)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "予選の点",
      body: "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("goldNode")
        .set("winners", '[["Alice","400 pts"],["Bob","380 pts"],["Carol","350 pts"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "準決勝",
      body: "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("goldNode", "silverNode")
        .set("winners", '[["Alice","800 pts"],["Bob","700 pts"],["Carol","640 pts"]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "決勝の点",
      body: "最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("goldNode", "silverNode", "bronzeNode")
        .set("winners", '[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]'),
  )
  .build();
export const subtitle__tournamentPodium =
  "tournament 1st/2nd/3rd を 3-lane (Silver/Gold/Bronze、 中央=Gold の podium 配列) 分散、 各 winner 個別 card、 podium readout 併存";

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
  .node("dark", {
    lane: "winner",
    stack: 0,
    kind: "card",
    title: "★ Dark mode",
    subtitle: "票が最も多い案",
  })
  .node("search", {
    lane: "runners",
    stack: 0,
    kind: "card",
    title: "Search",
    subtitle: "次に多い案",
  })
  .node("api", {
    lane: "runners",
    stack: 1,
    kind: "card",
    title: "Better API",
    subtitle: "中ほどの案",
  })
  .node("ui", {
    lane: "runners",
    stack: 2,
    kind: "card",
    title: "Nicer UI",
    subtitle: "最も少ない案",
  })
  .readout.pollBar("pb", {
    source: "options",
    color: "#a08870",
    colorWinner: "#2563eb",
    label: "Results (aggregate)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "票が割れる",
      body: "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("dark")
        .set("options", '[["Dark mode",7],["Faster search",6],["Better API",5],["Nicer UI",4]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "1 案に集まる",
      body: "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("dark", "search")
        .set("options", '[["Dark mode",40],["Faster search",13],["Better API",8],["Nicer UI",5]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "締め切り",
      body: "他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("dark", "search", "api", "ui")
        .set(
          "options",
          '[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]',
        ),
  )
  .build();
export const subtitle__featurePoll =
  "feature poll 4 option を 2-lane (Winner / Runners-up) に分散、 各 option 個別 card、 pollBar readout 併存";

/**
 * 83. user-stack = code review reviewer 7 人 (max 5 表示 + overflow +2)。
 */
export const reviewerStack = diagram("interactive-reviewer-stack", {
  topic: "レビュアー 7 人を 5 人表示と残りで見せる",
})
  .lane("displayed", { x: 0, width: 340 })
  .lane("overflow", { x: 380, width: 200 })
  .arraySignal("reviewers", [
    "Alice",
    "Bob Smith",
    "Carol",
    "Dan Kim",
    "Eve",
    "Frank Wu",
    "Grace Lee",
  ])
  .node("r1", {
    lane: "displayed",
    stack: 0,
    kind: "card",
    title: "Alice",
    subtitle: "頭文字 A · はじめから居る",
  })
  .node("r2", {
    lane: "displayed",
    stack: 1,
    kind: "card",
    title: "Bob Smith",
    subtitle: "頭文字 BS · はじめから居る",
  })
  .node("r3", {
    lane: "displayed",
    stack: 2,
    kind: "card",
    title: "Carol",
    subtitle: "頭文字 C · はじめから居る",
  })
  .node("r4", {
    lane: "displayed",
    stack: 3,
    kind: "card",
    title: "Dan Kim",
    subtitle: "頭文字 DK · 途中で加わる",
  })
  .node("r5", {
    lane: "displayed",
    stack: 4,
    kind: "card",
    title: "Eve",
    subtitle: "頭文字 E · 上限ちょうど",
  })
  .node("r6", {
    lane: "overflow",
    stack: 0,
    kind: "card",
    title: "Frank Wu",
    subtitle: "頭文字 FW · 上限を超える",
  })
  .node("r7", {
    lane: "overflow",
    stack: 1,
    kind: "card",
    title: "Grace Lee",
    subtitle: "頭文字 GL · 上限を超える",
  })
  .readout.userStack("us", {
    source: "reviewers",
    max: 5,
    size: 36,
    label: "Reviewers (stacked avatars)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "依頼した直後",
      body: "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。",
    },
    (p: PhaseBuilder) =>
      p.activate("r1", "r2", "r3").set("reviewers", '["Alice","Bob Smith","Carol"]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "上限ちょうど",
      body: "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("r1", "r2", "r3", "r4", "r5")
        .set("reviewers", '["Alice","Bob Smith","Carol","Dan Kim","Eve"]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "上限を超える",
      body: "上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("r1", "r2", "r3", "r4", "r5", "r6", "r7")
        .set("reviewers", '["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]'),
  )
  .build();
export const subtitle__reviewerStack =
  "code review reviewer 7 人 を 2-lane (Displayed 5 / Overflow 2) 分散、 各 reviewer 個別 card、 userStack readout 併存";

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
  .node("featNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 280,
    title: "feat",
    subtitle: "機能を足す (Alice)",
  })
  .node("fixNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 310,
    title: "fix",
    subtitle: "不具合を直す (Bob)",
  })
  .node("docsNode", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 300,
    title: "docs",
    subtitle: "説明を書く (Carol)",
  })
  .node("refactorNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 300,
    title: "refactor",
    subtitle: "構造を整える (Dan)",
  })
  .node("testNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 270,
    title: "test",
    subtitle: "検査を足す (Eve)",
  })
  .readout.commitList("cl", {
    source: "commits",
    max: 5,
    color: "#2563eb",
    label: "History (git log)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 件目",
      body: "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("featNode").set("commits", '[["a1b2c3d","feat: add sankey primitive","Alice"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "積み上がる",
      body: "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("featNode", "fixNode", "docsNode")
        .set(
          "commits",
          '[["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "表示の上限",
      body: "表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("featNode", "fixNode", "docsNode", "refactorNode", "testNode")
        .set(
          "commits",
          '[["q7r8s9t","test: add builder chain coverage","Eve"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]',
        ),
  )
  .build();
export const subtitle__gitCommitList =
  "5 git commit を 5 区画 (feat / fix / docs / refactor / test) 3 列 2 段で commit type 別分散、 各 commit 個別 card、 commitList readout 併存";

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
  .node("currentNode", {
    lane: "current",
    stack: 0,
    kind: "card",
    title: "Current time",
    subtitle: "{current}s / 240s (slider driven)",
  })
  .node("toggleNode", {
    lane: "toggle",
    stack: 0,
    kind: "card",
    title: "Play toggle",
    subtitle: "playing = {playing} (▶/❚❚ icon)",
  })
  .node("durationNode", {
    lane: "duration",
    stack: 0,
    kind: "card",
    title: "Duration",
    subtitle: "240s total (fixed)",
  })
  .edge("currentNode", "durationNode", { label: "progress %", tone: "info" })
  .edge("toggleNode", "currentNode", { label: "advance/pause", tone: "success" })
  .readout.mediaPlayer("mp", {
    source: "current",
    durationSource: "duration",
    playingSource: "playing",
    color: "#2563eb",
    viewW: 320,
    label: "Player (icon + progress + MM:SS)",
  })
  .phase("p1", { duration: 1200, title: "再生位置", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode").badge("media"),
  )
  .phase("p2", { duration: 1200, title: "再生状態", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode", "toggleNode").badge("media"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "時間表示",
      body: "3-lane (Current / Play toggle / Duration) で audio player 3 signal を分散、 2 edge (progress info / advance success) で 3 signal の相互関係明示、 slider + toggle 変化で mediaPlayer readout が icon + progress + MM:SS 追随、 player 構造を lane で可視化。",
    },
    (p: PhaseBuilder) => p.activate("currentNode", "toggleNode", "durationNode").badge("media"),
  )
  .build();
export const subtitle__audioPlayer =
  "audio player を 3-lane (Current time / Play toggle / Duration) + 2 edge、 signal 制御と mediaPlayer readout の bind 関係可視化";

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
  .node("info1", {
    lane: "info",
    stack: 0,
    kind: "card",
    title: "ℹ 起動",
    subtitle: "待ち受けを始めた知らせ",
  })
  .node("info2", {
    lane: "info",
    stack: 1,
    kind: "card",
    title: "ℹ 復帰",
    subtitle: "つなぎ直しに成功した知らせ",
  })
  .node("debug1", {
    lane: "debug",
    stack: 0,
    kind: "card",
    title: "· 設定",
    subtitle: "設定を読んだ記録",
  })
  .node("warn1", {
    lane: "warn",
    stack: 0,
    kind: "card",
    title: "⚠ 負荷",
    subtitle: "計算資源の使い過ぎ",
  })
  .node("error1", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "✕ 切断",
    subtitle: "つなぎ先が応じない",
  })
  .readout.eventLog("el", { source: "events", max: 10, label: "Events (timeline)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "平常の記録",
      body: "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("info1", "debug1")
        .set(
          "events",
          '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "異常が出る",
      body: "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("info1", "debug1", "warn1", "error1")
        .set(
          "events",
          '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "復帰する",
      body: "最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("info1", "info2", "debug1", "warn1", "error1")
        .set(
          "events",
          '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]',
        ),
  )
  .build();
export const subtitle__serverEventLog =
  "server monitoring event log 5 event を 4-lane (info / debug / warn / error) severity 別に分散、 eventLog readout 併存";

/**
 * 87. search-result = 5 search hit を title + snippet + url で表示。
 */
export const searchResults = diagram("interactive-search-results", {
  topic: "検索結果を文書 / ツールに分ける",
})
  .lane("docs", { x: 0, width: 340 })
  .lane("tools", { x: 380, width: 300 })
  .arraySignal("hits", [
    [
      "Rust playground",
      "Interactive code sandbox for Rust programming language",
      "play.rust-lang.org",
    ],
    ["MDN Web Docs", "Documentation for web technologies", "developer.mozilla.org"],
    ["TypeScript Handbook", "Official TS learning guide", "typescriptlang.org/docs"],
    ["React docs", "React reference documentation", "react.dev"],
    ["Vite guide", "Frontend build tool guide", "vitejs.dev"],
  ] as unknown as (string | number)[])
  .node("mdnNode", {
    lane: "docs",
    stack: 0,
    kind: "card",
    title: "MDN Web Docs",
    subtitle: "developer.mozilla.org",
  })
  .node("tsNode", {
    lane: "docs",
    stack: 1,
    kind: "card",
    title: "TS Handbook",
    subtitle: "typescriptlang.org/docs",
  })
  .node("reactNode", {
    lane: "docs",
    stack: 2,
    kind: "card",
    title: "React docs",
    subtitle: "react.dev",
  })
  .node("viteNode", {
    lane: "docs",
    stack: 3,
    kind: "card",
    title: "Vite guide",
    subtitle: "vitejs.dev",
  })
  .node("rustNode", {
    lane: "tools",
    stack: 0,
    kind: "card",
    title: "Rust",
    subtitle: "play.rust-lang.org (interactive)",
  })
  .readout.searchResult("sr", {
    source: "hits",
    max: 5,
    color: "#2563eb",
    label: "Results (link + snippet + url)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "広い語で引く",
      body: "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("mdnNode", "tsNode", "reactNode", "viteNode", "rustNode")
        .set(
          "hits",
          '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "語を足す",
      body: "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("mdnNode", "tsNode", "reactNode")
        .set(
          "hits",
          '[["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "絞り切る",
      body: "当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("rustNode")
        .set(
          "hits",
          '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"]]',
        ),
  )
  .build();
export const subtitle__searchResults =
  "search hit 5 を 2-lane (Docs 4 / Interactive tool 1) 分散、 各 hit 個別 card、 searchResult readout 併存";

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
  .node("q1Head", {
    lane: "q1",
    stack: 0,
    kind: "card",
    title: "Q1 (Jan-Mar)",
    subtitle: "Design + MVP",
  })
  .node("q1Item1", { lane: "q1", stack: 1, kind: "card", title: "Design", subtitle: "foundation" })
  .node("q1Item2", {
    lane: "q1",
    stack: 2,
    kind: "card",
    title: "MVP feature",
    subtitle: "prototype",
  })
  .node("q2Head", {
    lane: "q2",
    stack: 0,
    kind: "card",
    title: "Q2 (Apr-Jun)",
    subtitle: "Beta + growth",
  })
  .node("q2Item1", {
    lane: "q2",
    stack: 1,
    kind: "card",
    title: "Beta launch",
    subtitle: "public beta",
  })
  .node("q2Item2", {
    lane: "q2",
    stack: 2,
    kind: "card",
    title: "Feature B",
    subtitle: "beta scope",
  })
  .node("q3Head", {
    lane: "q3",
    stack: 0,
    kind: "card",
    title: "Q3 (Jul-Sep)",
    subtitle: "Scale + enterprise",
  })
  .node("q3Item1", {
    lane: "q3",
    stack: 1,
    kind: "card",
    title: "Scale infra",
    subtitle: "capacity",
  })
  .node("q3Item2", {
    lane: "q3",
    stack: 2,
    kind: "card",
    title: "Enterprise",
    subtitle: "企業向けの売上",
  })
  .node("q4Head", {
    lane: "q4",
    stack: 0,
    kind: "card",
    title: "Q4 (Oct-Dec)",
    subtitle: "GA + funding",
  })
  .node("q4Item1", {
    lane: "q4",
    stack: 1,
    kind: "card",
    title: "Public GA",
    subtitle: "general available",
  })
  .node("q4Item2", {
    lane: "q4",
    stack: 2,
    kind: "card",
    title: "Series A",
    subtitle: "growth capital",
  })
  .edge("q1Head", "q2Head", { label: "handover", tone: "info" })
  .edge("q2Head", "q3Head", { label: "scale", tone: "accent" })
  .edge("q3Head", "q4Head", { label: "GA", tone: "success" })
  .readout.roadmap("rm", {
    source: "plan",
    viewW: 400,
    viewH: 200,
    label: "Roadmap (4 column list)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "手前だけ決まる",
      body: "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Head", "q1Item1", "q1Item2")
        .set("plan", '[["Q1",["Design system","MVP feature A"]],["Q2",[]],["Q3",[]],["Q4",[]]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "半年先まで",
      body: "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Head", "q2Head", "q2Item1", "q2Item2")
        .set(
          "plan",
          '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",[]],["Q4",[]]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "年内が揃う",
      body: "4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("q1Head", "q2Head", "q3Head", "q4Head")
        .set(
          "plan",
          '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]',
        ),
  )
  .build();
export const subtitle__yearRoadmap =
  "2026 yearly roadmap を 4-lane (Q1-Q4) 分散、 各 quarter items を stack 分散、 quarterly 遷移 3 edge、 roadmap readout 併存";

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
  .node("monNode", {
    lane: "sunny",
    stack: 0,
    kind: "card",
    title: "☀ Mon",
    subtitle: "晴れ · 週の始まり",
  })
  .node("friNode", {
    lane: "sunny",
    stack: 1,
    kind: "card",
    title: "☀ Fri",
    subtitle: "晴れ · 週で最も暖かい",
  })
  .node("tueNode", {
    lane: "cloudy",
    stack: 0,
    kind: "card",
    title: "☁ Tue",
    subtitle: "曇り · 下り坂の入口",
  })
  .node("wedNode", {
    lane: "cloudy",
    stack: 1,
    kind: "card",
    title: "☂ Wed",
    subtitle: "雨 · 気温が下がる",
  })
  .node("thuNode", {
    lane: "thunder",
    stack: 0,
    kind: "card",
    title: "⚡ Thu",
    subtitle: "雷 · 週で最も寒い",
  })
  .readout.weatherForecast("wf", { source: "forecast", label: "Week (5-day forecast)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "3 日前の予報",
      body: "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "tueNode")
        .set(
          "forecast",
          '[["Mon","☀",21,16],["Tue","☁",20,15],["Wed","☂",18,14],["Thu","⚡",16,12],["Fri","☀",22,17]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "前日の予報",
      body: "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "tueNode", "wedNode")
        .set(
          "forecast",
          '[["Mon","☀",23,17],["Tue","☁",21,16],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",24,18]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "当日の予報",
      body: "最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "friNode", "tueNode", "wedNode", "thuNode")
        .set(
          "forecast",
          '[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]',
        ),
  )
  .build();
export const subtitle__weekWeather =
  "5-day weather を 3-lane (Sunny ☀ / Cloudy/Rainy / Thunder ⚡) 天気別分散、 各 day 個別 card、 weatherForecast readout 併存";

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
  .node("rustVideo", {
    lane: "rust",
    stack: 0,
    kind: "card",
    title: "🎬 Rust",
    subtitle: "最初に出す 1 本",
  })
  .node("tsVideo", {
    lane: "ts",
    stack: 0,
    kind: "card",
    title: "🎥 TS deep",
    subtitle: "最も長い 1 本",
  })
  .node("reactVideo", {
    lane: "react",
    stack: 0,
    kind: "card",
    title: "📺 React",
    subtitle: "最も見られている 1 本",
  })
  .readout.videoCard("vc", {
    source: "videos",
    max: 5,
    color: "#ef4444",
    label: "Videos (thumbnail list)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 本だけ出す",
      body: "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("rustVideo").set("videos", '[["🎬","Rust intro for beginners","12:45","24k"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "2 本に増える",
      body: "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("rustVideo", "tsVideo")
        .set(
          "videos",
          '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "3 本が揃う",
      body: "3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("rustVideo", "tsVideo", "reactVideo")
        .set(
          "videos",
          '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]',
        ),
  )
  .build();
export const subtitle__tutorialVideoCards =
  "tutorial video 3 本 を 3-lane (Rust / TypeScript / React) topic 別分散、 各 video 個別 card、 videoCard readout 併存";

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
  .node("packedNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 250,
    title: "📦 Packed",
    subtitle: "梱包完了",
  })
  .node("shippedNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 270,
    title: "🚚 Shipped",
    subtitle: "配送開始",
  })
  .node("deliveryNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 290,
    title: "🏠 Delivery",
    subtitle: "配達中 (現在地)",
  })
  .node("deliveredNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 290,
    title: "✅ Delivered",
    subtitle: "配達完了",
  })
  .edge("packedNode", "shippedNode", { label: "handover", tone: "success" })
  .edge("shippedNode", "deliveryNode", { label: "in transit", tone: "info" })
  .edge("deliveryNode", "deliveredNode", { label: "arrived", tone: "warning" })
  .readout.orderStatus("os", {
    source: "current",
    stepsSource: "steps",
    color: "#2563eb",
    label: "Delivery status (icon strip)",
  })
  .phase("p1", { duration: 1200, title: "梱包と発送", body: "" }, (p: PhaseBuilder) =>
    p.activate("packedNode").badge("tracking"),
  )
  .phase("p2", { duration: 1200, title: "配達中まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("packedNode", "shippedNode").badge("tracking"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "配達完了",
      body: "4 区画 pipeline (Packed / Shipped / Out for delivery / Delivered) を 2 列 2 段に置いて + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。",
    },
    (p: PhaseBuilder) =>
      p.activate("packedNode", "shippedNode", "deliveryNode", "deliveredNode").badge("tracking"),
  )
  .build();
export const subtitle__shippingOrderStatus =
  "e-commerce 配送追跡 4 step (📦→🚚→🏠→✅) を 2 列 2 段の pipeline + 3 edge で状態遷移 network 化、 orderStatus readout 併存";

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
  .node("aliceCard", {
    lane: "alice",
    stack: 0,
    kind: "card",
    w: 280,
    title: "Alice",
    subtitle: "1 列目の人",
  })
  .node("bobCard", {
    lane: "bob",
    stack: 0,
    kind: "card",
    w: 280,
    title: "Bob",
    subtitle: "2 列目の人",
  })
  .node("carolCard", {
    lane: "carol",
    stack: 0,
    kind: "card",
    w: 320,
    title: "Carol",
    subtitle: "3 列目の人",
  })
  .node("danCard", {
    lane: "dan",
    stack: 0,
    kind: "card",
    w: 250,
    title: "Dan",
    subtitle: "4 列目の人 (欠けが無い)",
  })
  .readout.attendanceGrid("ag", {
    source: "attendance",
    membersSource: "members",
    color: "#22c55e",
    label: "Attendance (5 day × 4 member grid)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "週の初め",
      body: "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("aliceCard").set("attendance", '[["Mon",true,true,false,true]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "週の半ば",
      body: "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceCard", "bobCard")
        .set(
          "attendance",
          '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "週の終わり",
      body: "5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceCard", "bobCard", "carolCard", "danCard")
        .set(
          "attendance",
          '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true],["Thu",false,true,true,true],["Fri",true,true,false,true]]',
        ),
  )
  .build();
export const subtitle__teamAttendanceGrid =
  "5 day × 4 member attendance を 4-lane (Alice/Bob/Carol/Dan) member 別分散、 各 member weekly summary + attendanceGrid readout 併存";

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
  .node("tokyoNode", {
    lane: "tokyo",
    stack: 0,
    kind: "card",
    w: 180,
    title: "Tokyo",
    subtitle: "時差が進んでいる側の都市",
  })
  .node("londonNode", {
    lane: "london",
    stack: 0,
    kind: "card",
    w: 180,
    title: "London",
    subtitle: "時差の基準となる都市",
  })
  .node("nycNode", {
    lane: "nyc",
    stack: 0,
    kind: "card",
    w: 180,
    title: "NYC",
    subtitle: "時差が最も遅れている都市",
  })
  .node("sydneyNode", {
    lane: "sydney",
    stack: 0,
    kind: "card",
    w: 190,
    title: "Sydney",
    subtitle: "時差が最も進んでいる都市",
  })
  .readout.timezoneClock("tc", {
    source: "clocks",
    color: "#2563eb",
    label: "Cities (4-column grid)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "朝の会",
      body: "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("londonNode")
        .set(
          "clocks",
          '[["Tokyo",9,"17:00"],["London",0,"08:00"],["NYC",-5,"03:00"],["Sydney",11,"19:00"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "昼の会",
      body: "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("londonNode", "nycNode")
        .set(
          "clocks",
          '[["Tokyo",9,"22:00"],["London",0,"13:00"],["NYC",-5,"08:00"],["Sydney",11,"00:00"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "夜の会",
      body: "先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tokyoNode", "londonNode", "nycNode", "sydneyNode")
        .set(
          "clocks",
          '[["Tokyo",9,"01:30"],["London",0,"16:30"],["NYC",-5,"11:30"],["Sydney",11,"03:30"]]',
        ),
  )
  .build();
export const subtitle__globalTimezoneClock =
  "4 city timezone を 4-lane (Tokyo / London / NYC / Sydney) 都市別分散、 各 city 個別 card、 timezoneClock readout 併存";

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
  .node("nameNode", {
    lane: "personal",
    stack: 0,
    kind: "card",
    title: "Name",
    subtitle: "本人を表す項目",
  })
  .node("ageNode", {
    lane: "personal",
    stack: 1,
    kind: "card",
    title: "Age",
    subtitle: "本人を表す項目 (数)",
  })
  .node("emailNode", {
    lane: "contact",
    stack: 0,
    kind: "card",
    title: "Email",
    subtitle: "連絡先の項目",
  })
  .node("countryNode", {
    lane: "contact",
    stack: 1,
    kind: "card",
    title: "Country",
    subtitle: "連絡先の項目 (所在)",
  })
  .node("newsletterNode", {
    lane: "prefs",
    stack: 0,
    kind: "card",
    title: "Newsletter",
    subtitle: "希望を表す項目",
  })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "Submission (dl/dt/dd)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "入力の途中",
      body: "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("nameNode", "ageNode").set("fields", '[["Name","Alice Wonderland"],["Age","28"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "連絡先まで",
      body: "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("nameNode", "ageNode", "emailNode", "countryNode")
        .set(
          "fields",
          '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "送信の直前",
      body: "希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("nameNode", "ageNode", "emailNode", "countryNode", "newsletterNode")
        .set(
          "fields",
          '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"],["Newsletter","Yes"]]',
        ),
  )
  .build();
export const subtitle__signupFormSummary =
  "signup form 5 field を 3-lane (Personal / Contact / Prefs) semantic 分類、 各 field 個別 card、 formSummary readout 併存";

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
  .node("song0", {
    lane: "played",
    stack: 0,
    kind: "card",
    title: "✓ Bohemian",
    subtitle: "Queen · 5:55 (played)",
  })
  .node("song1", {
    lane: "now",
    stack: 0,
    kind: "card",
    title: "▶ Hotel",
    subtitle: "Eagles · 6:30 (now playing)",
  })
  .node("song2", {
    lane: "next",
    stack: 0,
    kind: "card",
    title: "Stairway",
    subtitle: "Led Zeppelin · 8:02",
  })
  .node("song3", {
    lane: "next",
    stack: 1,
    kind: "card",
    title: "Sweet Child",
    subtitle: "Guns N' Roses · 5:56",
  })
  .node("song4", {
    lane: "next",
    stack: 2,
    kind: "card",
    title: "Imagine",
    subtitle: "John Lennon · 3:03",
  })
  .readout.songQueue("sq", {
    source: "queue",
    currentSource: "cur",
    max: 8,
    color: "#2563eb",
    label: "Queue (current highlight)",
  })
  .phase("p1", { duration: 1200, title: "再生済", body: "" }, (p: PhaseBuilder) =>
    p.activate("song0").badge("music"),
  )
  .phase("p2", { duration: 1200, title: "再生中", body: "" }, (p: PhaseBuilder) =>
    p.activate("song0", "song1", "song2").badge("music"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "次に続く",
      body: "3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。",
    },
    (p: PhaseBuilder) => p.activate("song0", "song1", "song2", "song3", "song4").badge("music"),
  )
  .build();
export const subtitle__playlistSongQueue =
  "playlist queue 5 song を 3-lane (Played / Now Playing / Up Next) 状態別分散、 各 song 個別 card、 songQueue readout 併存";

/**
 * 96. calendar-month = January 2026 calendar with event marks + today highlight。
 */
function generateCalendarDays(
  eventDays: number[] = [3, 8, 12, 17, 22, 26],
  today = 13,
): (string | number)[] {
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
  .node("w4Card", {
    lane: "w4",
    stack: 0,
    kind: "card",
    title: "Week 4-5",
    subtitle: "月の終わりの週",
  })
  .node("monthSummary", {
    lane: "w4",
    stack: 1,
    kind: "card",
    title: "Month total",
    subtitle: "月ぜんたいのまとめ",
  })
  .readout.calendarMonth("cm", {
    source: "days",
    monthName: "January 2026",
    color: "#2563eb",
    label: "Month view (7 column grid)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "月の初め",
      body: "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("w1Card", "w2Card").set("days", JSON.stringify(generateCalendarDays([3, 8]))),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "月の半ば",
      body: "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("w1Card", "w2Card", "w3Card")
        .set("days", JSON.stringify(generateCalendarDays([3, 8, 12, 17]))),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "月の終わり",
      body: "印が月の終わりまで並ぶ。 7 列の格子に予定の散らばりが読める形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("w1Card", "w2Card", "w3Card", "w4Card", "monthSummary")
        .set("days", JSON.stringify(generateCalendarDays([3, 8, 12, 17, 22, 26]))),
  )
  .build();
export const subtitle__monthCalendarView =
  "January 2026 calendar を 4-lane (Week 1 / Week 2 / Week 3 / Week 4-5) 週別分散、 各週 summary + calendarMonth readout 併存";

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
    [
      "$",
      "ls -la",
      "total 42\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md",
    ],
    ["$", "cd projects", ""],
    ["$", "git status", "On branch main\nnothing to commit, working tree clean"],
    ["$", "pnpm test", "Test Files  114 passed\nTests  1649 passed"],
    ["$", "docker ps", "CONTAINER ID   IMAGE\n8f3a2b1c9d   nginx:latest"],
  ] as unknown as (string | number)[])
  .node("lsNode", {
    lane: "fs",
    stack: 0,
    kind: "card",
    title: "ls -la",
    subtitle: "file を見る · 出力が長い",
  })
  .node("cdNode", {
    lane: "fs",
    stack: 1,
    kind: "card",
    title: "cd projects",
    subtitle: "場所を移る · 出力が無い",
  })
  .node("gitStatusNode", {
    lane: "git",
    stack: 0,
    kind: "card",
    title: "git status",
    subtitle: "履歴の状態を見る",
  })
  .node("pnpmNode", {
    lane: "dev",
    stack: 0,
    kind: "card",
    title: "pnpm test",
    subtitle: "検査を回す",
  })
  .node("dockerNode", {
    lane: "dev",
    stack: 1,
    kind: "card",
    title: "docker ps",
    subtitle: "動いている入れ物を見る",
  })
  .readout.terminal("tm", {
    source: "cmds",
    max: 10,
    color: "var(--d-dg-2)",
    label: "Session (CLI window)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "打ち始め",
      body: "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("lsNode")
        .set(
          "cmds",
          '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "場所を移る",
      body: "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("lsNode", "cdNode", "gitStatusNode")
        .set(
          "cmds",
          '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "作業が進む",
      body: "組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("lsNode", "cdNode", "gitStatusNode", "pnpmNode", "dockerNode")
        .set(
          "cmds",
          '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"],["$","pnpm test","Test Files  114 passed\\nTests  1649 passed"],["$","docker ps","CONTAINER ID   IMAGE\\n8f3a2b1c9d   nginx:latest"]]',
        ),
  )
  .build();
export const subtitle__cliTerminalSession =
  "CLI 5 command を 3-lane (Filesystem / Git / Dev) tool category 別分散、 各 command 個別 card、 terminal readout 併存";

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
    ["a", 8, "♜"],
    ["b", 8, "♞"],
    ["c", 8, "♝"],
    ["d", 8, "♛"],
    ["e", 8, "♚"],
    ["f", 8, "♝"],
    ["g", 8, "♞"],
    ["h", 8, "♜"],
    // Black pawns (rank 7)
    ["a", 7, "♟"],
    ["b", 7, "♟"],
    ["c", 7, "♟"],
    ["d", 7, "♟"],
    ["e", 7, "♟"],
    ["f", 7, "♟"],
    ["g", 7, "♟"],
    ["h", 7, "♟"],
    // White pawns (rank 2)
    ["a", 2, "♙"],
    ["b", 2, "♙"],
    ["c", 2, "♙"],
    ["d", 2, "♙"],
    ["e", 2, "♙"],
    ["f", 2, "♙"],
    ["g", 2, "♙"],
    ["h", 2, "♙"],
    // White back rank (rank 1)
    ["a", 1, "♖"],
    ["b", 1, "♘"],
    ["c", 1, "♗"],
    ["d", 1, "♕"],
    ["e", 1, "♔"],
    ["f", 1, "♗"],
    ["g", 1, "♘"],
    ["h", 1, "♖"],
  ] as unknown as (string | number)[])
  .node("blackBackNode", {
    lane: "blackBack",
    stack: 0,
    kind: "card",
    w: 270,
    title: "Black back",
    subtitle: "黒の奥の列 (♜♞♝♛♚♝♞♜)",
  })
  .node("blackPawnNode", {
    lane: "blackPawn",
    stack: 0,
    kind: "card",
    w: 290,
    title: "Black pawns",
    subtitle: "黒の手前の列 (♟)",
  })
  .node("whitePawnNode", {
    lane: "whitePawn",
    stack: 0,
    kind: "card",
    w: 290,
    title: "White pawns",
    subtitle: "白の手前の列 (♙)",
  })
  .node("whiteBackNode", {
    lane: "whiteBack",
    stack: 0,
    kind: "card",
    w: 270,
    title: "White back",
    subtitle: "白の奥の列 (♖♘♗♕♔♗♘♖)",
  })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "Position (8×8 board)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "白を並べる",
      body: "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("whiteBackNode", "whitePawnNode")
        .set(
          "pieces",
          '[["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "黒の手前を置く",
      body: "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("whiteBackNode", "whitePawnNode", "blackPawnNode")
        .set(
          "pieces",
          '[["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "開始の形",
      body: "上下の端 2 列ずつが埋まり、中央 4 列が空く。 開始の形が盤の上に揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("blackBackNode", "blackPawnNode", "whitePawnNode", "whiteBackNode")
        .set(
          "pieces",
          '[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]',
        ),
  )
  .build();
export const subtitle__chessStartingBoard =
  "32 chess piece を 4-lane (Black back rank / Black pawns / White pawns / White back rank) rank 別分散、 chessBoard readout 併存";

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
  .node("todoCard", {
    lane: "todo",
    stack: 0,
    kind: "card",
    title: "Todo",
    subtitle: "まだ手を付けていない列",
  })
  .node("inprogressCard", {
    lane: "inprogress",
    stack: 0,
    kind: "card",
    title: "In Progress",
    subtitle: "いま進めている列",
  })
  .node("doneCard", { lane: "done", stack: 0, kind: "card", title: "Done", subtitle: "終わった列" })
  .readout.kanbanBoard("kb", { source: "tasks", columnWidth: 140, max: 5, label: "Sprint kanban" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "着手前",
      body: "札がすべて左の列に積まれる。 重さの違いは札の色として出る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("todoCard")
        .set(
          "tasks",
          '[["todo","Design API schema","high"],["todo","Write docs","low"],["todo","Impl auth flow","high"],["todo","Migration script","med"],["todo","Setup CI","med"],["todo","Repo bootstrap","low"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "動き出す",
      body: "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("todoCard", "inprogressCard")
        .set(
          "tasks",
          '[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["todo","Repo bootstrap","low"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "終盤に入る",
      body: "右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("todoCard", "inprogressCard", "doneCard")
        .set(
          "tasks",
          '[["todo","Design API schema","high"],["inprogress","Write docs","low"],["inprogress","Impl auth flow","high"],["done","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]',
        ),
  )
  .build();
export const subtitle__sprintKanbanBoard =
  "sprint 6 task を 3-lane (Todo / In Progress / Done) 状態別分散、 kanban readout 併存";

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
  .node("homeNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 190,
    title: "Home",
    subtitle: "最上位の階層",
  })
  .node("docsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 140,
    title: "Docs",
    subtitle: "Home の下にある階層",
  })
  .node("apiNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 220,
    title: "API",
    subtitle: "Reference の上にある階層",
  })
  .node("refNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 250,
    title: "Reference",
    subtitle: "最も深い階層",
  })
  .edge("homeNode", "docsNode", { label: "→", tone: "info" })
  .edge("docsNode", "apiNode", { label: "→", tone: "accent" })
  .edge("apiNode", "refNode", { label: "→", tone: "info" })
  .readout.breadcrumb("bc", {
    source: "path",
    currentSource: "cur",
    color: "#2563eb",
    label: "Path",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "最上位に居る",
      body: "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。",
    },
    (p: PhaseBuilder) => p.activate("homeNode").set("cur", 0),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "中ほどへ降りる",
      body: "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。",
    },
    (p: PhaseBuilder) => p.activate("homeNode", "docsNode", "apiNode").set("cur", 2),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "最も深い階層",
      body: "末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。",
    },
    (p: PhaseBuilder) => p.activate("homeNode", "docsNode", "apiNode", "refNode").set("cur", 3),
  )
  .build();
export const subtitle__docsBreadcrumb =
  "docs navigation 4 crumb を 2 列 2 段の pipeline (Home → Docs → API → Reference) + 3 next edge + breadcrumb readout 併存";

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
  .node("morningCard", {
    lane: "morning",
    stack: 0,
    kind: "card",
    title: "Morning",
    subtitle: "午前の時間帯",
  })
  .node("afternoonCard", {
    lane: "afternoon",
    stack: 0,
    kind: "card",
    title: "Afternoon",
    subtitle: "午後の時間帯",
  })
  .node("eveningCard", {
    lane: "evening",
    stack: 0,
    kind: "card",
    title: "Evening",
    subtitle: "夜の時間帯",
  })
  .readout.timelineVertical("tv", {
    source: "events",
    color: "#2563eb",
    max: 8,
    label: "Day events",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "午前の予定",
      body: "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("morningCard")
        .set("events", '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "午後まで",
      body: "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("morningCard", "afternoonCard")
        .set(
          "events",
          '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging"],["16:00","1-on-1","career discussion"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "1 日ぶん",
      body: "点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("morningCard", "afternoonCard", "eveningCard")
        .set(
          "events",
          '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]',
        ),
  )
  .build();
export const subtitle__dayScheduleTimeline =
  "day schedule 5 event を 3-lane (Morning / Afternoon / Evening) 時間帯別分散 + timelineVertical readout 併存";

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
  .node("activeCard", {
    lane: "active",
    stack: 0,
    kind: "card",
    title: "Active",
    subtitle: "稼働している区間 (緑)",
  })
  .node("idleCard", {
    lane: "idle",
    stack: 0,
    kind: "card",
    title: "Idle",
    subtitle: "待機している区間 (灰)",
  })
  .node("errorCard", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "Error",
    subtitle: "異常が出た区間 (赤)",
  })
  .readout.statusTimeline("st", { source: "events", max: 8, label: "Server status" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "平常の稼働",
      body: "同じ色の区間が続く。 状態の名は 4 文字までに切って大文字で出ることが読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("activeCard").set("events", '[["09:00","active"],["09:15","active"]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "異常が出る",
      body: "灰と赤の区間が混じる。 色の切り替わりで、いつ状態が変わったかが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("activeCard", "idleCard", "errorCard")
        .set(
          "events",
          '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "復帰する",
      body: "末尾がまた緑に戻る。 赤が 1 区間だけであることが、帯の中の面積として読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("activeCard", "errorCard")
        .set(
          "events",
          '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]',
        ),
  )
  .build();
export const subtitle__serverUptimeStatus =
  "server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存";

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
  .node("monNode", {
    lane: "mon",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Mon",
    subtitle: "予定を持つ日",
  })
  .node("tueNode", {
    lane: "tue",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Tue",
    subtitle: "予定を持たない日",
  })
  .node("wedNode", {
    lane: "wed",
    stack: 0,
    kind: "card",
    w: 160,
    title: "Wed",
    subtitle: "予定を持つ日",
  })
  .node("thuNode", {
    lane: "thu",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Thu",
    subtitle: "予定を持たない日",
  })
  .node("friNode", {
    lane: "fri",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Fri",
    subtitle: "予定を持つ日",
  })
  .node("satNode", {
    lane: "sat",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Sat",
    subtitle: "予定を持たない日 (週末)",
  })
  .node("sunNode", {
    lane: "sun",
    stack: 0,
    kind: "card",
    w: 110,
    title: "Sun",
    subtitle: "予定を持たない日 (週明け前)",
  })
  .readout.calendarWeek("cw", {
    source: "week",
    cellSize: 40,
    color: "#2563eb",
    label: "This week",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "週の始まり",
      body: "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode")
        .set(
          "week",
          '[["Mon",true,true],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "週の半ば",
      body: "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "wedNode")
        .set(
          "week",
          '[["Mon",true,false],["Tue",false,false],["Wed",true,true],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "週の終わり",
      body: "塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("monNode", "wedNode", "friNode", "satNode", "sunNode")
        .set(
          "week",
          '[["Mon",true,false],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,true],["Sat",false,false],["Sun",false,false]]',
        ),
  )
  .build();
export const subtitle__weekCalendarView =
  "7-day week calendar を 7-lane 個別 day 分散 + calendarWeek readout 併存";

/**
 * 105. kpi-comparison = A/B team score 比較を 2-lane 分散 + kpiComparison readout 併存。 iteration 6 wave 3、 pattern taxonomy § 3 category split。
 */
export const teamKpiComparison = diagram("interactive-team-kpi-compare", {
  topic: "2 チームの成績を並べて比べる",
})
  .lane("teamA", { x: 0, width: 340 })
  .lane("teamB", { x: 380, width: 340 })
  .arraySignal("teams", [
    ["Team A", 82],
    ["Team B", 65],
  ] as unknown as (string | number)[])
  .node("aCard", {
    lane: "teamA",
    stack: 0,
    kind: "card",
    title: "Team A",
    subtitle: "上の帯 (青)",
  })
  .node("aDetail", {
    lane: "teamA",
    stack: 1,
    kind: "card",
    title: "Velocity",
    subtitle: "上の帯が表す量",
  })
  .node("bCard", {
    lane: "teamB",
    stack: 0,
    kind: "card",
    title: "Team B",
    subtitle: "下の帯 (橙)",
  })
  .node("bDetail", {
    lane: "teamB",
    stack: 1,
    kind: "card",
    title: "Velocity",
    subtitle: "下の帯が表す量",
  })
  .edge("aCard", "bCard", { label: "差", tone: "warning" })
  .readout.kpiComparison("kc", {
    source: "teams",
    max: 100,
    colorA: "#2563eb",
    colorB: "#f97316",
    label: "Score compare",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "差が大きい",
      body: "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。",
    },
    (p: PhaseBuilder) => p.activate("aCard", "bCard").set("teams", '[["Team A",82],["Team B",41]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "追い上げる",
      body: "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("aCard", "aDetail", "bCard").set("teams", '[["Team A",82],["Team B",65]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "ほぼ並ぶ",
      body: "2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aCard", "aDetail", "bCard", "bDetail")
        .set("teams", '[["Team A",84],["Team B",80]]'),
  )
  .build();
export const subtitle__teamKpiComparison =
  "Team A vs Team B の score を 2-lane 分散 + kpiComparison readout 併存";

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
  .node("draftNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 190,
    title: "Draft",
    subtitle: "最初の工程",
  })
  .node("reviewNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 190,
    title: "Review",
    subtitle: "Draft の次の工程",
  })
  .node("approveNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 250,
    title: "Approve",
    subtitle: "Publish の直前の工程",
  })
  .node("publishNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 220,
    title: "Publish",
    subtitle: "最後の工程",
  })
  .edge("draftNode", "reviewNode", { label: "submit", tone: "success" })
  .edge("reviewNode", "approveNode", { label: "reviewed", tone: "info" })
  .edge("approveNode", "publishNode", { label: "publish", tone: "accent" })
  .readout.stepProgress("sp", {
    source: "cur",
    stepsSource: "steps",
    color: "#2563eb",
    label: "Workflow",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "書き始め",
      body: "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。",
    },
    (p: PhaseBuilder) => p.activate("draftNode").set("cur", 0),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "確認を経る",
      body: "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。",
    },
    (p: PhaseBuilder) => p.activate("draftNode", "reviewNode", "approveNode").set("cur", 2),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "公開する",
      body: "末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。",
    },
    (p: PhaseBuilder) =>
      p.activate("draftNode", "reviewNode", "approveNode", "publishNode").set("cur", 3),
  )
  .build();
export const subtitle__publishWorkflowSteps =
  "content publish workflow 4 step を 2 列 2 段の pipeline + 3 next edge + stepProgress readout 併存";

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
  .node("aliceCard", {
    lane: "online",
    stack: 0,
    kind: "card",
    title: "Alice",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("carolCard", {
    lane: "online",
    stack: 1,
    kind: "card",
    title: "Carol",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("eveCard", {
    lane: "online",
    stack: 2,
    kind: "card",
    title: "Eve",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("bobCard", {
    lane: "away",
    stack: 0,
    kind: "card",
    title: "Bob",
    subtitle: "離席の人 (黄の丸)",
  })
  .node("danCard", {
    lane: "offline",
    stack: 0,
    kind: "card",
    title: "Dan",
    subtitle: "不在の人 (灰の丸)",
  })
  .readout.userPresence("up", { source: "team", max: 6, label: "Team status" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "朝の在席",
      body: "全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("danCard")
        .set(
          "team",
          '[["Alice","offline"],["Bob","offline"],["Carol","offline"],["Dan","offline"],["Eve","offline"]]',
        ),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "上限ちょうど",
      body: "6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceCard", "bobCard", "danCard")
        .set(
          "team",
          '[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"]]',
        ),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "上限を超える",
      body: "7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("aliceCard", "carolCard", "eveCard", "bobCard", "danCard")
        .set(
          "team",
          '[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"],["Grace","away"]]',
        ),
  )
  .build();
export const subtitle__teamPresenceStatus =
  "5 team member を 3-lane (Online / Away / Offline) status 別分散 + userPresence readout 併存";

/**
 * 108. rating-thumb = review vote 2 category (up / down) を 2-lane + ratingThumb readout 併存。 iteration 6 wave 4、 pattern taxonomy § 3 category split。
 */
export const feedbackThumbRating = diagram("interactive-feedback-rating", {
  topic: "賛成票と反対票を並べて見せる",
})
  .lane("up", { x: 0, width: 340 })
  .lane("down", { x: 380, width: 340 })
  .arraySignal("votes", [24, 3])
  .node("upCard", {
    lane: "up",
    stack: 0,
    kind: "card",
    title: "▲ Up votes",
    subtitle: "帯の緑の側を決める票",
  })
  .node("upDetail", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "Positive",
    subtitle: "帯の緑の部分",
  })
  .node("downCard", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "▼ Down votes",
    subtitle: "帯の赤の側を決める票",
  })
  .node("downDetail", {
    lane: "down",
    stack: 1,
    kind: "card",
    title: "Negative",
    subtitle: "帯の赤の部分",
  })
  .edge("upCard", "downCard", { label: "割合", tone: "warning" })
  .readout.ratingThumb("rt", {
    source: "votes",
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "Review score",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "票が割れる",
      body: "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。",
    },
    (p: PhaseBuilder) => p.activate("upCard", "downCard").set("votes", "[12,10]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "賛成が増える",
      body: "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。",
    },
    (p: PhaseBuilder) => p.activate("upCard", "upDetail", "downCard").set("votes", "[20,10]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "賛成に寄る",
      body: "賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。",
    },
    (p: PhaseBuilder) =>
      p.activate("upCard", "upDetail", "downCard", "downDetail").set("votes", "[24,3]"),
  )
  .build();
export const subtitle__feedbackThumbRating =
  "review 24 up / 3 down vote を 2-lane (Up / Down) 分散 + ratingThumb readout 併存";

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
  .node("ceoCard", {
    lane: "ceo",
    stack: 0,
    kind: "card",
    title: "Alice CEO",
    subtitle: "最上位の階層",
  })
  .node("vpEng", {
    lane: "vp",
    stack: 0,
    kind: "card",
    title: "Bob VP Eng",
    subtitle: "中間の階層",
  })
  .node("vpSales", {
    lane: "vp",
    stack: 1,
    kind: "card",
    title: "Carol Sales",
    subtitle: "中間の階層",
  })
  .node("icDan", { lane: "ic", stack: 0, kind: "card", title: "Dan Eng", subtitle: "最下位の階層" })
  .node("icEve", { lane: "ic", stack: 1, kind: "card", title: "Eve Eng", subtitle: "最下位の階層" })
  .node("icFrank", {
    lane: "ic",
    stack: 2,
    kind: "card",
    title: "Frank Sales",
    subtitle: "最下位の階層",
  })
  .edge("ceoCard", "vpEng", { label: "reports", tone: "info" })
  .edge("ceoCard", "vpSales", { label: "reports", tone: "info" })
  .edge("vpEng", "icDan", { label: "manages", tone: "accent" })
  .edge("vpEng", "icEve", { label: "manages", tone: "accent" })
  .edge("vpSales", "icFrank", { label: "manages", tone: "accent" })
  .readout.orgChartMini("oc", { source: "org", color: "#2563eb", label: "Org hierarchy" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "創業した頃",
      body: "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。",
    },
    (p: PhaseBuilder) => p.activate("ceoCard").set("org", '[["Alice CEO",0]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "役員を置く",
      body: "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("ceoCard", "vpEng", "vpSales")
        .set("org", '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "現場が増える",
      body: "3 段目まで揃う。 名前が 10 文字を超える箱は末尾を省いて出ることが読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("ceoCard", "vpEng", "vpSales", "icDan", "icEve", "icFrank")
        .set(
          "org",
          '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]',
        ),
  )
  .build();
export const subtitle__startupOrgChart =
  "startup 3-level org (CEO / 2 VP / 3 IC) を 3-lane tree depth 別分散 + orgChartMini readout 併存";

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
  .node("prevCard", {
    lane: "delta",
    stack: 0,
    kind: "card",
    title: "Previous",
    subtitle: "先月の値",
  })
  .node("deltaCard", {
    lane: "delta",
    stack: 1,
    kind: "card",
    title: "Delta",
    subtitle: "今月 - 先月の差",
  })
  .node("histCard", {
    lane: "hist",
    stack: 0,
    kind: "card",
    title: "History",
    subtitle: "折れ線のもとになる並び",
  })
  .edge("curCard", "prevCard", { label: "比べる", tone: "info" })
  .edge("curCard", "histCard", { label: "並べる", tone: "success" })
  .readout.kpiTrendTile("kt", {
    source: "cur",
    prevSource: "prev",
    historySource: "hist",
    unit: "",
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "NPS trend",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "下がった月",
      body: "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("curCard", "prevCard")
        .set("cur", 58)
        .set("prev", 64)
        .set("hist", "[70,68,66,64,60,58]"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "底を打つ",
      body: "今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("curCard", "prevCard", "deltaCard")
        .set("cur", 64)
        .set("prev", 64)
        .set("hist", "[68,66,64,60,58,64]"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "持ち直す",
      body: "今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("curCard", "prevCard", "deltaCard", "histCard")
        .set("cur", 82)
        .set("prev", 75)
        .set("hist", "[60,65,70,75,80,82]"),
  )
  .build();
export const subtitle__npsTrendKpi =
  "NPS current + delta + sparkline を 3-lane (Current / Delta / History) 分散 + kpiTrendTile readout 併存";

/**
 * 111. quick-poll-emoji = 3 emoji reaction poll を 3-lane 分散 + quickPollEmoji readout 併存。 iteration 6 wave 5、 pattern taxonomy § 3 category split。
 */
export const postReactionPoll = diagram("interactive-post-reaction-poll", {
  topic: "絵文字 3 種の投票を並べる",
})
  .lane("thumbs", { x: 0, width: 240 })
  .lane("heart", { x: 280, width: 240 })
  .lane("party", { x: 560, width: 240 })
  .arraySignal("votes", [
    ["👍", 42],
    ["❤️", 28],
    ["🎉", 15],
  ] as unknown as (string | number)[])
  .node("thumbsCard", {
    lane: "thumbs",
    stack: 0,
    kind: "card",
    title: "👍 Thumbs",
    subtitle: "票が最も多い絵文字",
  })
  .node("heartCard", {
    lane: "heart",
    stack: 0,
    kind: "card",
    title: "❤️ Heart",
    subtitle: "次に多い絵文字",
  })
  .node("partyCard", {
    lane: "party",
    stack: 0,
    kind: "card",
    title: "🎉 Party",
    subtitle: "票が最も少ない絵文字",
  })
  .readout.quickPollEmoji("qp", { source: "votes", colorWinner: "#2563eb", label: "Reactions" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "票が入り始める",
      body: "票がまだ少ない。 最も多いものに枠が付き、他の 2 つとは色が変わる。",
    },
    (p: PhaseBuilder) => p.activate("thumbsCard").set("votes", '[["👍",3],["❤️",2],["🎉",1]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "票が集まる",
      body: "差が開く。 枠が付くのは最も多い 1 つだけで、位置は動かない。",
    },
    (p: PhaseBuilder) =>
      p.activate("thumbsCard", "heartCard").set("votes", '[["👍",12],["❤️",7],["🎉",4]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "締め切り",
      body: "3 種の差が最も開く。 枠の位置は動かず、中の数だけが上がる形で落ち着く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbsCard", "heartCard", "partyCard")
        .set("votes", '[["👍",42],["❤️",28],["🎉",15]]'),
  )
  .build();
export const subtitle__postReactionPoll =
  "3 emoji reaction poll (👍/❤️/🎉) を 3-lane 分散 + quickPollEmoji readout 併存";

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
  .node("senderCard", {
    lane: "sender",
    stack: 0,
    kind: "card",
    title: "送り主",
    subtitle: "録音した人",
  })
  .node("waveCard", {
    lane: "wave",
    stack: 0,
    kind: "card",
    title: "波形",
    subtitle: "音の大小が棒の高さになる",
  })
  .node("playCard", {
    lane: "play",
    stack: 0,
    kind: "card",
    title: "再生",
    subtitle: "左から順に色が付く波形",
  })
  .node("progressCard", {
    lane: "play",
    stack: 1,
    kind: "card",
    title: "進み具合",
    subtitle: "色の付いた本数を決める割合",
  })
  .edge("senderCard", "waveCard", { label: "録音", tone: "info" })
  .edge("waveCard", "playCard", { label: "再生", tone: "success" })
  .readout.voiceMessage("vm", {
    source: "amps",
    progressSource: "progress",
    duration: 23,
    colorPlay: "#2563eb",
    colorBar: "#cbd5e1",
    label: "音声メモ",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "受信した直後",
      body: "棒が 15 本並ぶが、どれも灰のまま。 進み具合が 0 の間は色が 1 本も付かない。",
    },
    (p: PhaseBuilder) => p.activate("senderCard", "waveCard").set("progress", 0).badge("受信"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "半ばまで再生",
      body: "左から半分の棒に色が付く。 棒の高さは変わらず、色の境目だけが右へ動く。",
    },
    (p: PhaseBuilder) =>
      p.activate("senderCard", "waveCard", "playCard").set("progress", 0.5).badge("再生中"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "再生完了",
      body: "15 本すべてに色が付く。 進み具合が 1 になると境目が右端まで届く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("senderCard", "waveCard", "playCard", "progressCard")
        .set("progress", 1)
        .badge("完了"),
  )
  .build();
export const subtitle__voiceMessagePlayback =
  "音声メッセージ再生 (波形 15 バー + 再生 progress) を 3-lane 分散 + voiceMessage readout 併存、 3 phase で受信 → 半ばまで再生 → 完了の変化を可視化";

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
  .node("unreadCard", {
    lane: "unread",
    stack: 0,
    kind: "card",
    title: "未読",
    subtitle: "赤い丸の中に出る数",
  })
  .node("partCard", {
    lane: "participants",
    stack: 0,
    kind: "card",
    title: "参加者",
    subtitle: "話している人数",
  })
  .node("authorCard", {
    lane: "activity",
    stack: 0,
    kind: "card",
    title: "直近の発言者",
    subtitle: "最後に書いた人の名前",
  })
  .node("timeCard", {
    lane: "activity",
    stack: 1,
    kind: "card",
    title: "経過",
    subtitle: "最後の書き込みからの経過",
  })
  .edge("unreadCard", "authorCard", { label: "帰属", tone: "info" })
  .edge("partCard", "authorCard", { label: "所属", tone: "teal" })
  .readout.threadSummary("ts", { source: "thread", colorUnread: "#ef4444", label: "スレッド概要" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "静かなスレッド",
      body: "未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。",
    },
    (p: PhaseBuilder) =>
      p.activate("partCard").set("thread", '[0,4,"Bob","2 時間前"]').badge("静か"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "新着が付く",
      body: "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("unreadCard", "partCard", "authorCard")
        .set("thread", '[3,6,"Carol","25 分前"]')
        .badge("新着"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "混雑する",
      body: "未読が 5 件に増える。 丸の大きさは変わらず、中の数と 3 行の文字だけが動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("unreadCard", "partCard", "authorCard", "timeCard")
        .set("thread", '[5,8,"Alice","12 分前"]')
        .badge("混雑"),
  )
  .build();
export const subtitle__teamThreadSummary =
  "チームスレッド概要 (未読 / 参加者 / 直近 author / 経過時間) を 3-lane 分散 + threadSummary readout 併存、 3 phase で静か → 新着 → 混雑の変化を可視化";

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
  .node("sentCard", {
    lane: "sent",
    stack: 0,
    kind: "card",
    w: 250,
    title: "▶ 送信 (0)",
    subtitle: "単チェック · 灰 · 09:42",
  })
  .node("deliveredCard", {
    lane: "delivered",
    stack: 0,
    kind: "card",
    w: 270,
    title: "▶▶ 配信 (1)",
    subtitle: "二重チェック · 灰 · 09:43",
  })
  .node("readCard", {
    lane: "read",
    stack: 0,
    kind: "card",
    w: 270,
    title: "◆ 既読 (2)",
    subtitle: "二重チェック · 青 · 09:45",
  })
  .edge("sentCard", "deliveredCard", { label: "配信完了", tone: "info" })
  .edge("deliveredCard", "readCard", { label: "既読", tone: "success" })
  .readout.readReceipt("rr", {
    source: "status",
    colorRead: "#2563eb",
    colorPending: "#a08870",
    label: "既読状態",
  })
  .phase(
    "p1",
    {
      duration: 1500,
      title: "送信",
      body: "status = 0、 送信 lane のみ active、 readout に灰の単チェック表示 (送信済 but 未配信)。",
    },
    (p: PhaseBuilder) => p.activate("sentCard").set("status", 0).badge("送信"),
  )
  .phase(
    "p2",
    {
      duration: 1500,
      title: "配信完了",
      body: "status = 1 に切替、 配信 lane 追加 activate、 readout が灰の二重チェックに変化 (配信 but 未読)。",
    },
    (p: PhaseBuilder) => p.activate("sentCard", "deliveredCard").set("status", 1).badge("配信"),
  )
  .phase(
    "p3",
    {
      duration: 1500,
      title: "既読",
      body: "status = 2 に切替、 既読 lane 追加 activate、 readout の二重チェックが青に変化 (既読確認)。",
    },
    (p: PhaseBuilder) =>
      p.activate("sentCard", "deliveredCard", "readCard").set("status", 2).badge("既読"),
  )
  .build();
export const subtitle__dmReadReceipt =
  "DM 既読状態 (0=送信 / 1=配信 / 2=既読) を 3-lane state 別分散 + readReceipt readout 併存、 3 phase で状態遷移の動きを可視化";

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
  .node("pwField", {
    lane: "input",
    stack: 0,
    kind: "card",
    title: "◆ password",
    subtitle: "現在 level {pw} · マスク表示",
  })
  .node("meterBars", {
    lane: "meter",
    stack: 0,
    kind: "card",
    title: "4 セグメント メーター",
    subtitle: "level {pw} 分だけ着色",
  })
  .node("levelLabel", {
    lane: "meter",
    stack: 1,
    kind: "card",
    title: "level ラベル",
    subtitle: "メーター色と同色 tint",
  })
  .node("rule1", {
    lane: "rules",
    stack: 0,
    kind: "card",
    title: "✓ 8 文字以上",
    subtitle: "level ≥ 1 で pass",
  })
  .node("rule2", {
    lane: "rules",
    stack: 1,
    kind: "card",
    title: "✓ 大小混合",
    subtitle: "level ≥ 2 で pass",
  })
  .node("rule3", {
    lane: "rules",
    stack: 2,
    kind: "card",
    title: "✓ 数字 + 記号",
    subtitle: "level ≥ 3 で pass",
  })
  .edge("pwField", "meterBars", { label: "評価", tone: "info" })
  .edge("meterBars", "levelLabel", { label: "注釈", tone: "success" })
  .readout.passwordStrength("ps", {
    source: "pw",
    colorStrong: "#22c55e",
    colorWeak: "#ef4444",
    label: "強度",
  })
  .phase(
    "p1",
    {
      duration: 1500,
      title: "弱い (level 1)",
      body: "初期入力、 pw = 1、 meter 1 セグメント赤、 rule1 のみ pass、 入力 + メーター lane が active。",
    },
    (p: PhaseBuilder) => p.activate("pwField", "meterBars", "rule1").set("pw", 1).badge("弱い"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "改善中 (level 1 → 3)",
      body: "文字追加 + 大小混合、 pw を 1 → 3 まで tween、 meter が赤 → 橙 → 黄 → 黄緑と連続変化、 rule2 + rule3 追加 activate。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("pwField", "meterBars", "levelLabel", "rule1", "rule2", "rule3")
        .tween("pw", 1, 3)
        .badge("改善中"),
  )
  .phase(
    "p3",
    {
      duration: 1500,
      title: "強い (level 4)",
      body: "数字 + 記号追加で pw = 4、 meter 全 4 セグメント緑、 全 rule pass、 6 node 全 active。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("pwField", "meterBars", "levelLabel", "rule1", "rule2", "rule3")
        .set("pw", 4)
        .badge("強い"),
  )
  .build();
export const subtitle__formPasswordCheck =
  "サインアップ画面の password 強度 5 段階を 3-lane 分散 + passwordStrength readout 併存、 3 phase で弱 → 中 → 強の 3 段階を可視化";

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
  .node("sentCard", {
    lane: "sent",
    stack: 0,
    kind: "card",
    title: "SMS 送信",
    subtitle: "6 桁の符号を送る",
  })
  .node("entryCard", {
    lane: "entry",
    stack: 0,
    kind: "card",
    title: "6 つの枠",
    subtitle: "0-9 以外は空欄になる",
  })
  .node("focusHint", {
    lane: "entry",
    stack: 1,
    kind: "card",
    title: "次に入れる枠",
    subtitle: "空欄の先頭が青枠になる",
  })
  .node("verifyCard", {
    lane: "verify",
    stack: 0,
    kind: "card",
    title: "検証",
    subtitle: "6 つ埋まると送る",
  })
  .edge("sentCard", "entryCard", { label: "ユーザ入力", tone: "info" })
  .edge("entryCard", "verifyCard", { label: "自動送信", tone: "success" })
  .readout.otpInput("oi", { source: "otp", colorFocus: "#2563eb", label: "OTP コード" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "送った直後",
      body: "6 つの枠がすべて空。 0-9 の外の値は空欄として描かれるため、-1 を並べると空になる。",
    },
    (p: PhaseBuilder) => p.activate("sentCard").set("otp", "[-1,-1,-1,-1,-1,-1]").badge("送信"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "3 つ入れる",
      body: "左から 3 つが埋まる。 埋まった枠に数が出て、次に入れる枠が青枠で示される。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("sentCard", "entryCard", "focusHint")
        .set("otp", "[4,8,2,-1,-1,-1]")
        .badge("入力中"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "6 つ揃う",
      body: "6 つとも埋まる。 空欄が無くなり青枠も消え、そのまま送る形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("sentCard", "entryCard", "focusHint", "verifyCard")
        .set("otp", "[4,8,2,1,5,7]")
        .badge("検証完了"),
  )
  .build();
export const subtitle__loginOtpVerify =
  "OTP ログイン 6 桁検証を 3-lane 分散 + otpInput readout 併存、 3 phase で空欄 → 3 桁 → 6 桁の入力状態を可視化";

/**
 * 117. file-dropzone = プロフィール画像アップロードを 3 区画 (未選択 / アップロード / プレビュー) 2 列 2 段の state-driven visibility 分散 + fileDropzone readout 併存 + 3 phase 動き (未選択 → drop → プレビュー)。 iteration 7 wave 2、 pattern taxonomy § 2 state-driven visibility。
 */
export const profileAvatarUpload = diagram("interactive-profile-avatar-upload", {
  topic: "画像の選択から反映までを追う",
})
  .lane("col1", { x: 0, width: 330 })
  .lane("col2", { x: 370, width: 360 })
  .state("file", { initial: "" })
  .node("emptyCard", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 280,
    title: "未選択",
    subtitle: "破線枠 · '⬆ ここにドロップ'",
  })
  .node("uploadedCard", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 310,
    title: "◆ avatar.png",
    subtitle: "実線枠 · ファイル名カード",
  })
  .node("previewCard", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 220,
    title: "▶ 円形アバター",
    subtitle: "80×80 クロップ表示",
  })
  .edge("emptyCard", "uploadedCard", { label: "drop", tone: "info" })
  .edge("uploadedCard", "previewCard", { label: "プレビュー", tone: "success" })
  .readout.fileDropzone("fd", {
    source: "file",
    colorActive: "#2563eb",
    label: "アバター ファイル",
  })
  .phase(
    "p1",
    {
      duration: 1500,
      title: "未選択",
      body: "file = ''、 未選択の card のみ active、 dropzone は破線枠 + '⬆ ここにドロップ' のプロンプト表示。",
    },
    (p: PhaseBuilder) => p.activate("emptyCard").set("file", "").badge("未選択"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "ドロップ受信",
      body: "file を空 → 'avatar.png' に切替、 アップロードの card を追加 activate、 dropzone が実線枠 + ファイル名カード表示に変化。",
    },
    (p: PhaseBuilder) =>
      p.activate("emptyCard", "uploadedCard").set("file", "avatar.png").badge("アップロード"),
  )
  .phase(
    "p3",
    {
      duration: 1500,
      title: "プレビュー表示",
      body: "アップロード完了、 プレビューの card を追加 activate、 円形クロップされたアバターが表示、 3 node 全 highlight。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("emptyCard", "uploadedCard", "previewCard")
        .set("file", "avatar.png")
        .badge("完了"),
  )
  .build();
export const subtitle__profileAvatarUpload =
  "プロフィール画像アップロードを 3 区画 2 列 2 段に分散 + fileDropzone readout 併存、 3 phase で未選択 → drop → プレビュー表示の状態遷移を可視化";

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
  .node("tsCard", {
    lane: "ts",
    stack: 0,
    kind: "card",
    title: "時刻列",
    subtitle: "行の左端に出る時刻",
  })
  .node("levelCard", {
    lane: "level",
    stack: 0,
    kind: "card",
    title: "レベル列",
    subtitle: "札の色を決める重さ",
  })
  .node("infoRow", {
    lane: "msg",
    stack: 0,
    kind: "card",
    title: "情報の行",
    subtitle: "情報を表す札 (青)",
  })
  .node("warnRow", {
    lane: "msg",
    stack: 1,
    kind: "card",
    title: "注意の行",
    subtitle: "注意を表す札 (橙)",
  })
  .node("errRow", {
    lane: "msg",
    stack: 2,
    kind: "card",
    title: "異常の行",
    subtitle: "異常を表す札 (赤)",
  })
  .edge("tsCard", "levelCard", { label: "分類", tone: "info" })
  .edge("levelCard", "errRow", { label: "重篤化", tone: "error" })
  .readout.logStream("ls", { source: "logs", label: "ログ tail" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "通常運転",
      body: "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tsCard", "levelCard", "infoRow")
        .set("logs", '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"]]')
        .badge("通常"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "注意が出る",
      body: "橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tsCard", "levelCard", "infoRow", "warnRow")
        .set(
          "logs",
          '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"]]',
        )
        .badge("警告"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "異常が出る",
      body: "行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("tsCard", "levelCard", "infoRow", "warnRow", "errRow")
        .set(
          "logs",
          '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"],["09:02:30",1,"health check ok"]]',
        )
        .badge("障害"),
  )
  .build();
export const subtitle__prodLogTail =
  "本番ログ tail (直近 5 行 + レベル別 pill) を 3-lane 分散 + logStream readout 併存、 3 phase で通常 → 警告 → 障害の重篤度昇華を可視化";

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
  .node("triggerCard", {
    lane: "trigger",
    stack: 0,
    kind: "card",
    title: "きっかけ",
    subtitle: "本文になる出来事",
  })
  .node("sevCard", {
    lane: "severity",
    stack: 0,
    kind: "card",
    title: "重要度",
    subtitle: "帯の色を決める重さ",
  })
  .node("iconCard", {
    lane: "severity",
    stack: 1,
    kind: "card",
    title: "重要度の印",
    subtitle: "重要度で ℹ / ⚠ / ✕ が変わる",
  })
  .node("actionCard", {
    lane: "action",
    stack: 0,
    kind: "card",
    title: "対応",
    subtitle: "受け取った人が動く",
  })
  .edge("triggerCard", "sevCard", { label: "分類", tone: "info" })
  .edge("sevCard", "actionCard", { label: "通知", tone: "warning" })
  .readout.alertBanner("ab", { source: "alert", label: "アラート" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "軽微な知らせ",
      body: "重要度が最も低い。 帯は青で、印は情報を表す形になる。",
    },
    (p: PhaseBuilder) =>
      p.activate("triggerCard", "sevCard").set("alert", '[0,"CPU 68% — 通常の範囲"]').badge("info"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "注意に上がる",
      body: "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("triggerCard", "sevCard", "iconCard")
        .set("alert", '[2,"CPU 92% を 5 分継続 — 調査要"]')
        .badge("warn"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "異常に上がる",
      body: "重要度が最大になり帯が赤くなる。 本文と印も異常を表す内容に入れ替わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("triggerCard", "sevCard", "iconCard", "actionCard")
        .set("alert", '[3,"prod-web-3 応答なし — 全系統の切替が要る"]')
        .badge("error"),
  )
  .build();
export const subtitle__opsAlertBanner =
  "運用 alert 重要度別 banner (info / warn / error) を 3-lane 分散 + alertBanner readout 併存、 3 phase で info → warn → error のエスカレーションを可視化";

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
  .node("apiCard", {
    lane: "up",
    stack: 0,
    kind: "card",
    title: "api",
    subtitle: "稼働を表す緑のマス",
  })
  .node("webCard", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "web",
    subtitle: "稼働を表す緑のマス",
  })
  .node("authCard", {
    lane: "up",
    stack: 2,
    kind: "card",
    title: "auth",
    subtitle: "稼働を表す緑のマス",
  })
  .node("dbCard", {
    lane: "deg",
    stack: 0,
    kind: "card",
    title: "db",
    subtitle: "劣化を表す黄のマス",
  })
  .node("cacheCard", {
    lane: "deg",
    stack: 1,
    kind: "card",
    title: "cache",
    subtitle: "劣化を表す黄のマス",
  })
  .node("queueCard", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "queue",
    subtitle: "停止を表す赤のマス",
  })
  .edge("dbCard", "queueCard", { label: "波及", tone: "error" })
  .readout.serviceHealth("sh", { source: "svcs", label: "サービス (6)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "全て稼働",
      body: "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("apiCard", "webCard", "authCard")
        .set("svcs", '[["api",2],["web",2],["auth",2],["db",2],["cache",2],["queue",2]]')
        .badge("全稼働"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "一部が劣化",
      body: "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("apiCard", "webCard", "authCard", "dbCard", "cacheCard")
        .set("svcs", '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",2]]')
        .badge("劣化"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "1 つが停止",
      body: "最後の 1 つが赤になる。 緑 3 と黄 2 と赤 1 の内訳が、色を数えて読み取れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("apiCard", "webCard", "authCard", "dbCard", "cacheCard", "queueCard")
        .set("svcs", '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]')
        .badge("障害"),
  )
  .build();
export const subtitle__serviceHealthGrid =
  "microservice health matrix (up/degraded/down status per service) を 3-lane (Up / Degraded / Down) category split 分散 + serviceHealth readout 併存";

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
  .node("itemsCard", {
    lane: "items",
    stack: 0,
    kind: "card",
    title: "商品数",
    subtitle: "カートに入れた点数",
  })
  .node("subtotalCard", {
    lane: "costs",
    stack: 0,
    kind: "card",
    title: "小計",
    subtitle: "商品の金額を足した値",
  })
  .node("shippingCard", {
    lane: "costs",
    stack: 1,
    kind: "card",
    title: "送料",
    subtitle: "小計に加える配送費",
  })
  .node("totalCard", {
    lane: "total",
    stack: 0,
    kind: "card",
    title: "合計",
    subtitle: "末尾の行 · 太字と青で出る",
  })
  .edge("itemsCard", "subtotalCard", { label: "集計", tone: "info" })
  .edge("subtotalCard", "totalCard", { label: "+送料", tone: "success" })
  .edge("shippingCard", "totalCard", { label: "加算", tone: "info" })
  .readout.cartSummary("cs", {
    source: "cart",
    currency: "$",
    colorTotal: "#2563eb",
    label: "カート合計",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 点だけ入れる",
      body: "4 行が並ぶ。 金額はどれも小数 2 桁で出るため、整数を渡しても末尾が 0 で揃う。",
    },
    (p: PhaseBuilder) =>
      p.activate("itemsCard", "subtotalCard").set("cart", "[1,49.9,8.5,58.4]").badge("小計"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "点数を増やす",
      body: "小計が上がり合計も動く。 送料は変わらないため、3 行目だけが同じ値のまま残る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("itemsCard", "subtotalCard", "shippingCard")
        .set("cart", "[2,99.9,8.5,108.4]")
        .badge("送料"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "確定する",
      body: "合計が最も大きくなる。 最後の行だけ太字と青で出て、他の 3 行と区別される。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("itemsCard", "subtotalCard", "shippingCard", "totalCard")
        .set("cart", "[3,149.85,8.5,158.35]")
        .badge("合計"),
  )
  .build();
export const subtitle__checkoutCartSummary =
  "ショッピングカート小計 (商品 / 小計 / 送料 / 合計) を 3-lane 分散 + cartSummary readout 併存、 3 phase で 1 点 → 2 点 → 確定の金額変化を可視化";

/**
 * 122. pricing-tier = SaaS 料金プラン (3 tier 比較) を 3-lane (Starter / Pro / Enterprise) category split 分散 + pricingTier readout 併存 + 3 phase 動き (Starter → Pro tween → Enterprise 検討)。 iteration 7 wave 4、 pattern taxonomy § 3 category split。
 */
export const saasPricingTier = diagram("interactive-saas-pricing-tier", {
  topic: "料金 3 プランを並べて比べる",
})
  .lane("starter", { x: 0, width: 240 })
  .lane("pro", { x: 280, width: 240 })
  .lane("enterprise", { x: 560, width: 260 })
  .arraySignal("plan", ["Pro", 29, "10 席", "優先サポート", "カスタムドメイン"] as unknown as (
    string | number
  )[])
  .node("starterCard", {
    lane: "starter",
    stack: 0,
    kind: "card",
    title: "Starter",
    subtitle: "最も安いプラン",
  })
  .node("proCard", { lane: "pro", stack: 0, kind: "card", title: "Pro", subtitle: "中間のプラン" })
  .node("proBadge", {
    lane: "pro",
    stack: 1,
    kind: "card",
    title: "特典の欄",
    subtitle: "名前と価格の後に並ぶ特典",
  })
  .node("enterpriseCard", {
    lane: "enterprise",
    stack: 0,
    kind: "card",
    title: "Enterprise",
    subtitle: "最も高いプラン",
  })
  .edge("starterCard", "proCard", { label: "アップグレード", tone: "info" })
  .edge("proCard", "enterpriseCard", { label: "アップグレード", tone: "success" })
  .readout.pricingTier("pt", {
    source: "plan",
    colorAccent: "#2563eb",
    currency: "$",
    label: "プラン",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "最も安いプラン",
      body: "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("starterCard").set("plan", '["Starter",9,"3 席"]').badge("Starter"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "中間のプラン",
      body: "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("starterCard", "proCard", "proBadge")
        .set("plan", '["Pro",29,"10 席","優先サポート","カスタムドメイン"]')
        .badge("Pro"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "最も高いプラン",
      body: "特典を 5 つ渡しても出るのは **先頭 3 つ** まで。 4 つ目以降は表示に載らない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("starterCard", "proCard", "proBadge", "enterpriseCard")
        .set("plan", '["Enterprise",99,"無制限の席","専任の担当","監査ログ","SSO 連携","SLA 保証"]')
        .badge("比較"),
  )
  .build();
export const subtitle__saasPricingTier =
  "SaaS 料金 3 tier (Starter / Pro / Enterprise) を 3-lane 分散 + pricingTier readout 併存、 3 phase で Starter → Pro → Enterprise の表示差を可視化";

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
  .node("emptyCard", {
    lane: "empty",
    stack: 0,
    kind: "card",
    title: "未入力",
    subtitle: "符号が空の状態",
  })
  .node("enteredCard", {
    lane: "entered",
    stack: 0,
    kind: "card",
    title: "入力済",
    subtitle: "符号は入ったが割引がまだ無い",
  })
  .node("applyBtn", {
    lane: "entered",
    stack: 1,
    kind: "card",
    title: "適用ボタン",
    subtitle: "押すと割引が入る",
  })
  .node("appliedCard", {
    lane: "applied",
    stack: 0,
    kind: "card",
    title: "適用済",
    subtitle: "割引が正になり緑の札が出る",
  })
  .edge("emptyCard", "enteredCard", { label: "コード入力", tone: "info" })
  .edge("enteredCard", "appliedCard", { label: "適用", tone: "success" })
  .readout.couponCode("cc", { source: "coupon", colorApplied: "#22c55e", label: "クーポン" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "未入力",
      body: "符号が空で割引も 0。 入力を促す表示だけが出て、割引の札は現れない。",
    },
    (p: PhaseBuilder) => p.activate("emptyCard").set("coupon", '["",0]').badge("未入力"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "符号を入れる",
      body: "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("emptyCard", "enteredCard", "applyBtn")
        .set("coupon", '["SAVE20",0]')
        .badge("入力済"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "適用する",
      body: "割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("emptyCard", "enteredCard", "applyBtn", "appliedCard")
        .set("coupon", '["SAVE20",20]')
        .badge("適用"),
  )
  .build();
export const subtitle__checkoutCouponApply =
  "チェックアウト クーポン適用フロー (未入力 → 入力 → 適用) を 3-lane state 分散 + couponCode readout 併存、 3 phase で未入力 → 符号入力 → 適用の状態変化を可視化";

/**
 * 124. article-preview = ブログ記事プレビュー card を 3-lane (サムネ / 本文 / メタ) category split 分散 + articlePreview readout 併存 + 3 phase 動き (初期表示 → hover tween → クリック)。 iteration 7 wave 5、 pattern taxonomy § 3 category split。
 */
export const blogArticlePreview = diagram("interactive-blog-article-preview", {
  topic: "記事カードの見出しと抜粋と著者を並べる",
})
  .lane("thumb", { x: 0, width: 200 })
  .lane("content", { x: 220, width: 320 })
  .lane("meta", { x: 560, width: 220 })
  .arraySignal("article", [
    "dragon 入門",
    "dragon で interactive diagram を作る方法を解説",
    "Alice",
    "2 時間前",
  ] as unknown as (string | number)[])
  .node("thumbCard", {
    lane: "thumb",
    stack: 0,
    kind: "card",
    title: "サムネイル",
    subtitle: "配列の値に依らず固定",
  })
  .node("titleCard", {
    lane: "content",
    stack: 0,
    kind: "card",
    title: "タイトル",
    subtitle: "長いと末尾を省いて出る見出し",
  })
  .node("excerptCard", {
    lane: "content",
    stack: 1,
    kind: "card",
    title: "抜粋",
    subtitle: "折り返して出る本文",
  })
  .node("authorCard", {
    lane: "meta",
    stack: 0,
    kind: "card",
    title: "著者",
    subtitle: "記事を書いた人の名前",
  })
  .node("timeCard", {
    lane: "meta",
    stack: 1,
    kind: "card",
    title: "経過",
    subtitle: "記事の公開からの経過",
  })
  .edge("thumbCard", "titleCard", { label: "視線", tone: "info" })
  .edge("titleCard", "authorCard", { label: "帰属", tone: "success" })
  .readout.articlePreview("ap", { source: "article", colorAccent: "#2563eb", label: "記事 card" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "短い記事",
      body: "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbCard", "titleCard")
        .set("article", '["入門","はじめの一歩","Bob","5 分前"]')
        .badge("初期"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "抜粋が伸びる",
      body: "抜粋が 2 行に分かれる。 1 行目は 28 文字で切れて省略記号が付き、残りが 2 行目に出る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbCard", "titleCard", "excerptCard")
        .set(
          "article",
          '["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]',
        )
        .badge("hover"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "題も伸びる",
      body: "題が 26 文字を超える。 題も末尾を省いて出るため、1 行に収まる形が保たれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbCard", "titleCard", "excerptCard", "authorCard", "timeCard")
        .set(
          "article",
          '["dragon で作る interactive diagram の完全ガイド 2026 年版","段ごとの変化と表示部品の連動を実例つきで最初から順に解説する長い記事","Carol","3 日前"]',
        )
        .badge("click"),
  )
  .build();
export const subtitle__blogArticlePreview =
  "ブログ記事プレビュー card (タイトル / 抜粋 / 著者 / 経過) を 3-lane 分散 + articlePreview readout 併存、 3 phase で短い記事 → 抜粋が伸びる → 題も伸びるの表示差を可視化";

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
  .node("introCard", {
    lane: "lvl0",
    stack: 0,
    kind: "card",
    title: "はじめに",
    subtitle: "最も浅い階層 · 字下げなし",
  })
  .node("apiCard", {
    lane: "lvl0",
    stack: 1,
    kind: "card",
    title: "API リファレンス",
    subtitle: "最も浅い階層 · 字下げなし",
  })
  .node("gsCard", {
    lane: "lvl1",
    stack: 0,
    kind: "card",
    title: "スタートガイド",
    subtitle: "中間の階層 · 少し字下げ",
  })
  .node("advCard", {
    lane: "lvl1",
    stack: 1,
    kind: "card",
    title: "高度な使い方",
    subtitle: "中間の階層 · 少し字下げ",
  })
  .node("installCard", {
    lane: "lvl2",
    stack: 0,
    kind: "card",
    title: "インストール",
    subtitle: "最も深い階層 · 大きく字下げ",
  })
  .node("firstCard", {
    lane: "lvl2",
    stack: 1,
    kind: "card",
    title: "最初の図",
    subtitle: "最も深い階層 · 大きく字下げ",
  })
  .edge("introCard", "gsCard", { label: "次へ", tone: "info" })
  .edge("gsCard", "installCard", { label: "子", tone: "accent" })
  .edge("gsCard", "firstCard", { label: "現在", tone: "success" })
  .readout.tocNav("tn", { source: "toc", colorActive: "#2563eb", label: "ドキュメント TOC" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "先頭を読む",
      body: "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("introCard")
        .set(
          "toc",
          '[[0,"はじめに",1],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]',
        )
        .badge("Intro"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "下へ進む",
      body: "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("introCard", "gsCard")
        .set(
          "toc",
          '[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]',
        )
        .badge("GS"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "さらに下へ",
      body: "最も深い階層の行が青くなる。 6 行のうち出るのは先頭 6 行までで、字下げが 3 段に分かれる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("introCard", "apiCard", "gsCard", "advCard", "installCard", "firstCard")
        .set(
          "toc",
          '[[0,"はじめに",0],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]',
        )
        .badge("First"),
  )
  .build();
export const subtitle__docsTocNav =
  "docs TOC (階層 3 段 + アクティブセクション) を 3-lane 分散 + tocNav readout 併存、 3 phase でスクロール進行によるアクティブセクション遷移を可視化";

/**
 * 126. share-buttons = ブログ記事 SNS シェアボタンを 3-lane (Twitter / Facebook / LinkedIn) dense sequence 分散 + shareButtons readout 併存 + 3 phase 動き (投稿直後 → 拡散 tween → バズ)。 iteration 7 wave 5、 iteration 完遂。 pattern taxonomy § 7 dense sequence。
 */
export const socialShareButtons = diagram("interactive-social-share-buttons", {
  topic: "SNS 4 種の共有ボタンを並べる",
})
  .lane("tw", { x: 0, width: 200 })
  .lane("fb", { x: 220, width: 200 })
  .lane("li", { x: 440, width: 200 })
  .arraySignal("shares", [
    ["tw", 245],
    ["fb", 89],
    ["li", 32],
    ["rd", 18],
  ] as unknown as (string | number)[])
  .node("twCard", { lane: "tw", stack: 0, kind: "card", title: "tw", subtitle: "共有が最も多い先" })
  .node("fbCard", { lane: "fb", stack: 0, kind: "card", title: "fb", subtitle: "次に多い先" })
  .node("liCard", { lane: "li", stack: 0, kind: "card", title: "li", subtitle: "中ほどの先" })
  .node("rdCard", {
    lane: "li",
    stack: 1,
    kind: "card",
    title: "rd",
    subtitle: "共有が最も少ない先",
  })
  .edge("twCard", "fbCard", { label: "拡散", tone: "info" })
  .edge("fbCard", "liCard", { label: "拡散", tone: "info" })
  .edge("liCard", "rdCard", { label: "拡散", tone: "info" })
  .readout.shareButtons("sb", { source: "shares", label: "シェア" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "投稿した直後",
      body: "4 つのボタンが並び、数はどれも小さい。 ボタンの大きさは数に依らず一定。",
    },
    (p: PhaseBuilder) =>
      p.activate("twCard").set("shares", '[["tw",12],["fb",5],["li",3],["rd",1]]').badge("開始"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "広まる",
      body: "数が桁 1 つぶん増える。 並びと色は変わらず、ボタンの中の数だけが上がる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("twCard", "fbCard", "liCard")
        .set("shares", '[["tw",98],["fb",41],["li",17],["rd",8]]')
        .badge("拡散"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "落ち着く",
      body: "4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("twCard", "fbCard", "liCard", "rdCard")
        .set("shares", '[["tw",245],["fb",89],["li",32],["rd",18],["hn",6]]')
        .badge("バズ"),
  )
  .build();
export const subtitle__socialShareButtons =
  "ブログ記事 SNS シェア (Twitter / Facebook / LinkedIn / Reddit) を 3-lane 分散 + shareButtons readout 併存、 3 phase で投稿直後 → 広まる → 落ち着くの共有数変化を可視化";

/**
 * 127. exemplar-payment-flow v2 = EC 決済の実業務シナリオ、 shape-* primitive (person / mobile / credit-card / online-shop / payment-provider / api-gateway / bank / cylinder) で visual scene 化、 4 phase (商品購入 → 3DS 認証 → 銀行確定 → 記帳) + 4 readout (stat 金額 / gauge 3DS / traffic-light 状態 / countup 累計) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 1。
 */
export const exemplarPaymentFlow = diagram("interactive-exemplar-payment-flow", {
  topic: "EC 決済を購入から記帳まで 4 段階で追う",
})
  .lane("customer-lane", { x: 0, width: 220 })
  .lane("processor", { x: 240, width: 280 })
  .lane("bank", { x: 540, width: 220 })
  .state("amount", { initial: 0 })
  .state("auth3ds", { initial: 0 })
  .state("txStatus", { initial: 0 })
  .state("totalTx", { initial: 1247 })
  .node("customer", {
    lane: "customer-lane",
    stack: 0,
    kind: "shape-person",
    title: "田中様",
    eyebrow: "customer",
    subtitle: "購入者",
  })
  .node("mobile", {
    lane: "customer-lane",
    stack: 1,
    kind: "shape-mobile-device",
    title: "iPhone",
    eyebrow: "device",
    subtitle: "Safari / iOS 17",
  })
  .node("card", {
    lane: "customer-lane",
    stack: 2,
    kind: "shape-credit-card",
    title: "VISA **1234",
    eyebrow: "card",
    subtitle: "MUFG 発行",
  })
  .node("shop", {
    lane: "processor",
    stack: 0,
    kind: "shape-online-shop",
    title: "BuyNow",
    eyebrow: "merchant",
    subtitle: "checkout · ¥{amount}",
  })
  .node("gateway", {
    lane: "processor",
    stack: 1,
    kind: "shape-api-gateway",
    title: "API Gateway",
    eyebrow: "gateway",
    subtitle: "認証 + rate limit",
  })
  .node("provider", {
    lane: "processor",
    stack: 2,
    kind: "shape-payment-provider",
    title: "Stripe",
    eyebrow: "provider",
    subtitle: "3DS {auth3ds}%",
  })
  .node("bankShape", {
    lane: "bank",
    stack: 0,
    kind: "shape-bank",
    title: "MUFG",
    eyebrow: "issuer",
    subtitle: "発行銀行 · 与信照会",
  })
  .node("ledger", {
    lane: "bank",
    stack: 1,
    kind: "shape-cylinder",
    title: "取引台帳",
    eyebrow: "database",
    subtitle: "記帳 + 監査 log",
  })
  .edge("customer", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "shop", { label: "購入", tone: "info" })
  .edge("shop", "gateway", { label: "POST /pay", tone: "info" })
  .edge("gateway", "provider", { label: "転送", tone: "info" })
  .edge("card", "provider", { label: "3DS 認証", tone: "accent" })
  .edge("provider", "bankShape", { label: "決済要求", tone: "success" })
  .edge("bankShape", "ledger", { label: "記帳", tone: "success" })
  .readout.stat("amountStat", { source: "amount", unit: " 円", caption: "決済金額", label: "金額" })
  .readout.gauge("authGauge", {
    source: "auth3ds",
    min: 0,
    max: 100,
    color: "#22c55e",
    label: "3DS 認証 %",
  })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "決済 status" })
  .readout.countup("totalCU", { source: "totalTx", unit: " 件", label: "本日累計 tx", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2200,
      title: "商品購入",
      body: "田中様が iPhone で BuyNow にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "card", "shop")
        .tween("amount", 0, 12500)
        .set("txStatus", 0)
        .set("auth3ds", 0)
        .badge("購入"),
  )
  .phase(
    "p2",
    {
      duration: 2500,
      title: "3DS 認証",
      body: "gateway 経由で Stripe に転送、 VISA カードの 3D-Secure 認証実行。 txStatus 0 → 1 tween (traffic-light 赤 → 黄)、 auth3ds 0 → 92% tween (gauge 針が緑域まで上昇)。 processor lane 全 activate、 card → provider の accent edge。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "card", "shop", "gateway", "provider")
        .tween("txStatus", 0, 1)
        .tween("auth3ds", 0, 92)
        .badge("3DS 認証"),
  )
  .phase(
    "p3",
    {
      duration: 2000,
      title: "銀行確定",
      body: "認証通過、 発行銀行 MUFG に与信照会 + 決済確定。 txStatus 1 → 2 tween (traffic-light 黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 bank lane activate。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "card", "shop", "gateway", "provider", "bankShape")
        .tween("txStatus", 1, 2)
        .tween("auth3ds", 92, 98)
        .badge("銀行確定"),
  )
  .phase(
    "p4",
    {
      duration: 1800,
      title: "記帳完了",
      body: "銀行が取引台帳に記帳 + 監査 log 記録、 totalTx 1247 → 1248 tween (countup が +1 加算表示、 800ms かけて動的 count up)、 全 8 shape active、 決済 flow 完遂。",
    },
    (p: PhaseBuilder) =>
      p
        .activate(
          "customer",
          "mobile",
          "card",
          "shop",
          "gateway",
          "provider",
          "bankShape",
          "ledger",
        )
        .tween("totalTx", 1247, 1248)
        .set("txStatus", 2)
        .badge("記帳完了"),
  )
  .build();
export const subtitle__exemplarPaymentFlow =
  "EC 決済実業務シナリオ = 4 phase (購入 → 3DS 認証 → 銀行確定 → 記帳) の flow を shape-* primitive 8 種で表現 + 4 readout が state を consume して表示に反映";

/**
 * 128. exemplar-login-flow v2 = 実 login 認証 + 2FA + セッション発行シナリオ、 shape-* primitive (mobile-device / person / server-rack / hexagon / diamond / cylinder / cloud) で visual scene 化、 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) + 4 readout (traffic-light / countup / gauge / bar) が state を consume して visually 連続変化する高品質 pattern SSOT。 iteration 7 catalog redesign § PR-B exemplar 2。
 */
export const exemplarLoginFlow = diagram("interactive-exemplar-login-flow", {
  topic: "ログインと 2 要素認証を 5 段階で追う",
})
  .lane("user", { x: 0, width: 200 })
  .lane("auth", { x: 220, width: 300 })
  .lane("session-lane", { x: 540, width: 220 })
  .state("authStatus", { initial: 0 })
  .state("successLogin", { initial: 8421 })
  .state("failRate", { initial: 100 })
  .state("latency", { initial: 0 })
  .node("customer", {
    lane: "user",
    stack: 0,
    kind: "shape-person",
    title: "山田様",
    eyebrow: "user",
    subtitle: "email + password 送信",
  })
  .node("mobile", {
    lane: "user",
    stack: 1,
    kind: "shape-mobile-device",
    title: "Pixel 8",
    eyebrow: "device",
    subtitle: "Chrome / Android 14",
  })
  .node("authApi", {
    lane: "auth",
    stack: 0,
    kind: "shape-server-rack",
    title: "Auth API",
    eyebrow: "server",
    subtitle: "credential 一次検証",
  })
  .node("mfaCheck", {
    lane: "auth",
    stack: 1,
    kind: "shape-diamond",
    title: "2FA 要求?",
    eyebrow: "decision",
    subtitle: "TOTP 6 桁 or SMS",
  })
  .node("jwtSign", {
    lane: "auth",
    stack: 2,
    kind: "shape-hexagon",
    title: "JWT 発行器",
    eyebrow: "signer",
    subtitle: "RS256 · exp 1h",
  })
  .node("session", {
    lane: "session-lane",
    stack: 0,
    kind: "shape-cylinder",
    title: "Redis",
    eyebrow: "cache",
    subtitle: "TTL 3600s",
  })
  .node("token", {
    lane: "session-lane",
    stack: 1,
    kind: "shape-cloud",
    title: "JWT token",
    eyebrow: "response",
    subtitle: "Bearer · 302 redirect",
  })
  .edge("customer", "mobile", { label: "入力", tone: "info" })
  .edge("mobile", "authApi", { label: "POST /login", tone: "info" })
  .edge("authApi", "mfaCheck", { label: "一次 OK", tone: "success" })
  .edge("mfaCheck", "jwtSign", { label: "2FA OK", tone: "success" })
  .edge("jwtSign", "session", { label: "sid 保存", tone: "success" })
  .edge("session", "token", { label: "token 発行", tone: "success" })
  .readout.trafficLight("statusTL", { source: "authStatus", label: "認証 status (0/1/2)" })
  .readout.countup("successCU", { source: "successLogin", unit: " 回", label: "本日成功ログイン" })
  .readout.gauge("rateGauge", {
    source: "failRate",
    min: 0,
    max: 100,
    color: "#22c55e",
    label: "成功率 %",
  })
  .readout.bar("latencyBar", {
    source: "latency",
    min: 0,
    max: 500,
    color: "#f97316",
    label: "応答時間 ms",
  })
  .phase(
    "p1",
    {
      duration: 1500,
      title: "認証要求",
      body: "山田様が Pixel でログイン画面に credential 送信。 authStatus = 0 (traffic-light 赤 = 未検証)、 latency 0 → 80ms tween (bar 立ち上がり)、 gauge 100%、 countup 保持。 user lane 全 active。",
    },
    (p: PhaseBuilder) =>
      p.activate("customer", "mobile").set("authStatus", 0).tween("latency", 0, 80).badge("要求"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "一次検証",
      body: "Auth API が credential 照合、 hash 比較。 authStatus 0 → 1 tween (traffic-light 赤 → 黄)、 latency 80 → 220ms tween (bcrypt で bar 伸長)、 gauge 100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "authApi", "mfaCheck")
        .tween("authStatus", 0, 1)
        .tween("latency", 80, 220)
        .tween("failRate", 100, 99)
        .badge("一次検証"),
  )
  .phase(
    "p3",
    {
      duration: 2200,
      title: "2FA 検証",
      body: "TOTP 6 桁認証、 認証サーバが time-window 比較。 authStatus 1 → 1 保持 (traffic-light 黄)、 latency 220 → 350ms tween (2FA overhead で bar さらに伸長)、 mfaCheck diamond が pending 状態。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "authApi", "mfaCheck")
        .set("authStatus", 1)
        .tween("latency", 220, 350)
        .badge("2FA"),
  )
  .phase(
    "p4",
    {
      duration: 2000,
      title: "セッション発行",
      body: "2FA 通過、 JWT 発行 + Redis に session 保存。 authStatus 1 → 2 tween (traffic-light 黄 → 緑)、 latency 350 → 180ms tween (bar 縮小)、 gauge 99 → 99% 維持、 jwtSign + session lane activate。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session")
        .tween("authStatus", 1, 2)
        .tween("latency", 350, 180)
        .badge("発行"),
  )
  .phase(
    "p5",
    {
      duration: 1800,
      title: "応答返却",
      body: "JWT token を Bearer header で返却、 302 redirect。 successLogin 8421 → 8422 tween (countup が +1 加算表示、 900ms かけて動的)、 latency 180 → 50ms tween (最終)、 全 7 shape active。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "authApi", "mfaCheck", "jwtSign", "session", "token")
        .tween("successLogin", 8421, 8422)
        .tween("latency", 180, 50)
        .set("authStatus", 2)
        .badge("応答"),
  )
  .build();
export const subtitle__exemplarLoginFlow =
  "login + 2FA 実業務シナリオ = 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して表示に反映";

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
  .node("msg", {
    lane: "origin",
    stack: 0,
    kind: "shape-message-bubble",
    title: "新着 message",
    eyebrow: "trigger",
    subtitle: '"注文が発送されました"',
  })
  .node("kafka", {
    lane: "infra",
    stack: 0,
    kind: "shape-stack",
    title: "Kafka キュー",
    eyebrow: "queue",
    subtitle: "残 {queued} 件 · TTL 300s",
  })
  .node("fcm", {
    lane: "infra",
    stack: 1,
    kind: "shape-cloud",
    title: "FCM Service",
    eyebrow: "notification",
    subtitle: "配信 batch 処理",
  })
  .node("retryGate", {
    lane: "infra",
    stack: 2,
    kind: "shape-diamond",
    title: "retry 判定",
    eyebrow: "policy",
    subtitle: "指数 backoff · 最大 3 回",
  })
  .node("iphone", {
    lane: "devices",
    stack: 0,
    kind: "shape-mobile-device",
    title: "iPhone",
    eyebrow: "device",
    subtitle: "APNs 経由 · foreground",
  })
  .node("pixel", {
    lane: "devices",
    stack: 1,
    kind: "shape-mobile-device",
    title: "Pixel",
    eyebrow: "device",
    subtitle: "FCM 経由 · background",
  })
  .node("galaxy", {
    lane: "devices",
    stack: 2,
    kind: "shape-mobile-device",
    title: "Galaxy",
    eyebrow: "device",
    subtitle: "圏外 → retry 対象",
  })
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
  .readout.bar("queuedBar", {
    source: "queued",
    min: 0,
    max: 1000,
    color: "#f97316",
    label: "queue 残",
  })
  .readout.countup("deliveredCU", {
    source: "delivered",
    unit: " 件",
    label: "配信成功",
    decimals: 0,
  })
  .readout.gauge("rateGauge", {
    source: "deliveryRate",
    min: 0,
    max: 100,
    color: "#22c55e",
    label: "配信成功率 %",
  })
  .readout.stat("failedStat", {
    source: "failed",
    unit: " 件",
    caption: "リトライ待ち",
    label: "失敗",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "event 発火",
      body: "注文発送 event が発生、 message-bubble から Kafka キューに enqueue。 queued 0 → 1000 tween (bar が右に伸長)、 delivered = 0、 failed = 0、 deliveryRate = 0% (gauge 針最下)。 origin + queue が active。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("msg", "kafka")
        .tween("queued", 0, 1000)
        .set("delivered", 0)
        .set("failed", 0)
        .set("deliveryRate", 0)
        .badge("発火"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "キューイング",
      body: "batch 化された 1000 件が処理待ち、 FCM Service が dequeue 開始。 queued 1000 → 800 tween (bar 縮小開始)、 fcm lane activate、 kafka → fcm edge が info tone で信号伝達。",
    },
    (p: PhaseBuilder) =>
      p.activate("msg", "kafka", "fcm").tween("queued", 1000, 800).badge("キュー"),
  )
  .phase(
    "p3",
    {
      duration: 2500,
      title: "配信中",
      body: "FCM が iPhone / Pixel / Galaxy へ fan-out 配信。 queued 800 → 50 tween (bar 大幅縮小)、 delivered 0 → 920 tween (countup が加速的 count up、 500/s peak)、 failed 0 → 80 tween、 deliveryRate 0 → 92% tween (gauge 針上昇)。 3 device 全 activate、 Galaxy は失敗 edge (error tone)。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy")
        .tween("queued", 800, 50)
        .tween("delivered", 0, 920)
        .tween("failed", 0, 80)
        .tween("deliveryRate", 0, 92)
        .badge("配信"),
  )
  .phase(
    "p4",
    {
      duration: 1800,
      title: "初回到達",
      body: "iPhone + Pixel は成功受信、 Galaxy は圏外で失敗。 queued 50 → 20 tween、 delivered 920 → 950 tween、 failed 80 → 50 tween、 deliveryRate 92 → 95% tween。 全 shape active。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("msg", "kafka", "fcm", "iphone", "pixel", "galaxy")
        .tween("queued", 50, 20)
        .tween("delivered", 920, 950)
        .tween("failed", 80, 50)
        .tween("deliveryRate", 92, 95)
        .badge("到達"),
  )
  .phase(
    "p5",
    {
      duration: 2000,
      title: "リトライ",
      body: "失敗 50 件を retryGate が指数 backoff で再送、 Galaxy 圏内復帰後に配信成功。 queued 20 → 0 tween (bar 消失)、 delivered 950 → 992 tween (countup 最終)、 failed 50 → 8 tween (stat 減少)、 deliveryRate 95 → 99% tween (gauge 針最終)。 retryGate diamond が highlight。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("msg", "kafka", "fcm", "retryGate", "iphone", "pixel", "galaxy")
        .tween("queued", 20, 0)
        .tween("delivered", 950, 992)
        .tween("failed", 50, 8)
        .tween("deliveryRate", 95, 99)
        .badge("retry"),
  )
  .build();
export const subtitle__exemplarNotificationFlow =
  "push 通知配信 + retry 実業務シナリオ = 5 phase (発火 → キュー → 配信 → 到達 → retry) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して表示に反映";

// ============================================================
// 記法 (#1385 / #1389 / #1391 / #1392 / #1393 / #1396)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **手で書かず、組み立て済みの図から機械で出した**。 出した記法は `textDslToDiagram` と
// `jsonToDiagram` の両方に通して、元の図と骨格が一致することを確かめてから貼っている。
//
// **このページは全件が持つわけではない**。 #1389 でつまみ (`inputs:`)、#1392 で箱の欄、
// #1391 で式 (`formulas:`)、#1396 で矢印の欄、#1393 で押下 (`events:`) と巻き上げ
// (`scrolls:`) を書けるようにした。 残るのは記法の作りに由来する 2 件だけで、
// 内訳は台帳 (`lib/catalog-notation-coverage.test.ts`) の「一部のページ」 が持つ。

export const sourceYaml__arrayLineChart = `title: "配列の値から面グラフを描く"
type: flow

readouts:
  chart: { kind: line-chart, source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "Area chart" }
  chartNoFill: { kind: line-chart, source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "Line chart" }

lanes:
  data: { x: 0, width: 200 }
  area: { x: 240, width: 280 }
  line: { x: 540, width: 280 }

states:
  series: "[22,35,28,42,55,48,60,72,65,80]"

actors:
  - Time series: { kind: card, lane: data, stack: 0, subtitle: "n={series.length} · sum={series.sum} · avg={series.avg}" }
  - Area chart: { kind: card, lane: area, stack: 0, subtitle: "blue #2563eb · viewH=70" }
  - Line chart: { kind: card, lane: line, stack: 0, subtitle: "orange #f97316 · viewH=50" }

animation:
  - step: "序盤の値" 1.8s
    focus: ["Time series"]
    set:
      series: "[22,35,28,42,55]"
    description: "前半の値だけを持つ。 折れ線が左半分に収まる。"
  - step: "伸びる" 1.8s
    focus: ["Time series", "Area chart"]
    set:
      series: "[22,35,28,42,55,48,60,72]"
    description: "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。"
  - step: "全体が揃う" 1.8s
    focus: ["Time series", "Area chart", "Line chart"]
    set:
      series: "[22,35,28,42,55,48,60,72,65,80]"
    description: "10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。"
`;

export const sourceJson__arrayLineChart = `{
  "title": "配列の値から面グラフを描く",
  "type": "flow",
  "readouts": [
    {
      "id": "chart",
      "kind": "line-chart",
      "source": "series",
      "min": 0,
      "max": 100,
      "viewW": 260,
      "viewH": 70,
      "color": "#2563eb",
      "fill": true,
      "label": "Area chart"
    },
    {
      "id": "chartNoFill",
      "kind": "line-chart",
      "source": "series",
      "min": 0,
      "max": 100,
      "viewW": 260,
      "viewH": 50,
      "color": "#f97316",
      "fill": false,
      "label": "Line chart"
    }
  ],
  "lanes": {
    "data": { "x": 0, "width": 200 },
    "area": { "x": 240, "width": 280 },
    "line": { "x": 540, "width": 280 }
  },
  "actors": [
    {
      "name": "Time series",
      "kind": "card",
      "lane": "data",
      "stack": 0,
      "subtitle": "n={series.length} · sum={series.sum} · avg={series.avg}"
    },
    {
      "name": "Area chart",
      "kind": "card",
      "lane": "area",
      "stack": 0,
      "subtitle": "blue #2563eb · viewH=70"
    },
    {
      "name": "Line chart",
      "kind": "card",
      "lane": "line",
      "stack": 0,
      "subtitle": "orange #f97316 · viewH=50"
    }
  ],
  "flow": [],
  "states": { "series": "[22,35,28,42,55,48,60,72,65,80]" },
  "animation": [
    {
      "step": "序盤の値",
      "duration": 1.8,
      "focus": ["Time series"],
      "set": { "series": "[22,35,28,42,55]" },
      "body": "前半の値だけを持つ。 折れ線が左半分に収まる。"
    },
    {
      "step": "伸びる",
      "duration": 1.8,
      "focus": ["Time series", "Area chart"],
      "set": { "series": "[22,35,28,42,55,48,60,72]" },
      "body": "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。"
    },
    {
      "step": "全体が揃う",
      "duration": 1.8,
      "focus": ["Time series", "Area chart", "Line chart"],
      "set": { "series": "[22,35,28,42,55,48,60,72,65,80]" },
      "body": "10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。"
    }
  ]
}`;

export const sourceYaml__arrayStackedBar = `title: "2 系列の配列を積み上げ棒で比べる"
type: flow

readouts:
  cmp: { kind: stacked-bar, sourceA: "groupA", sourceB: "groupB", min: 0, max: 80, colorA: "#2563eb", colorB: "#f97316", label: "A / B (side-by-side bar)" }

lanes:
  groupA: { x: 0, width: 300 }
  groupB: { x: 340, width: 300 }

states:
  groupA: "[40,55,30,65,45]"
  groupB: "[25,40,50,35,60]"

actors:
  - Group A: { kind: card, lane: groupA, stack: 0, subtitle: "sum={groupA.sum} · avg={groupA.avg} · max={groupA.max}" }
  - A 5 element: { kind: card, lane: groupA, stack: 1, subtitle: "系列 A" }
  - Group B: { kind: card, lane: groupB, stack: 0, subtitle: "sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}" }
  - B 5 element: { kind: card, lane: groupB, stack: 1, subtitle: "系列 B" }

flow:
  - Group A -> Group B: "A vs B diff" (warning)

animation:
  - step: "A だけ" 1.8s
    focus: ["Group A", "A 5 element"]
    set:
      groupA: "[40,55,30,65,45]"
      groupB: "[0,0,0,0,0]"
    description: "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。"
  - step: "B を並べる" 1.8s
    focus: ["Group A", "A 5 element", "Group B"]
    set:
      groupB: "[25,40,50,35,60]"
    description: "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。"
  - step: "高さが入れ替わる" 1.8s
    focus: ["Group A", "A 5 element", "Group B", "B 5 element"]
    set:
      groupA: "[30,35,25,40,30]"
      groupB: "[45,60,70,55,80]"
    description: "2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。"
`;

export const sourceJson__arrayStackedBar = `{
  "title": "2 系列の配列を積み上げ棒で比べる",
  "type": "flow",
  "readouts": [
    {
      "id": "cmp",
      "kind": "stacked-bar",
      "sourceA": "groupA",
      "sourceB": "groupB",
      "min": 0,
      "max": 80,
      "colorA": "#2563eb",
      "colorB": "#f97316",
      "label": "A / B (side-by-side bar)"
    }
  ],
  "lanes": {
    "groupA": { "x": 0, "width": 300 },
    "groupB": { "x": 340, "width": 300 }
  },
  "actors": [
    {
      "name": "Group A",
      "kind": "card",
      "lane": "groupA",
      "stack": 0,
      "subtitle": "sum={groupA.sum} · avg={groupA.avg} · max={groupA.max}"
    },
    { "name": "A 5 element", "kind": "card", "lane": "groupA", "stack": 1, "subtitle": "系列 A" },
    {
      "name": "Group B",
      "kind": "card",
      "lane": "groupB",
      "stack": 0,
      "subtitle": "sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}"
    },
    { "name": "B 5 element", "kind": "card", "lane": "groupB", "stack": 1, "subtitle": "系列 B" }
  ],
  "flow": [
    { "from": "Group A", "to": "Group B", "label": "A vs B diff", "tone": "warning" }
  ],
  "states": { "groupA": "[40,55,30,65,45]", "groupB": "[25,40,50,35,60]" },
  "animation": [
    {
      "step": "A だけ",
      "duration": 1.8,
      "focus": ["Group A", "A 5 element"],
      "set": { "groupA": "[40,55,30,65,45]", "groupB": "[0,0,0,0,0]" },
      "body": "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。"
    },
    {
      "step": "B を並べる",
      "duration": 1.8,
      "focus": ["Group A", "A 5 element", "Group B"],
      "set": { "groupB": "[25,40,50,35,60]" },
      "body": "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。"
    },
    {
      "step": "高さが入れ替わる",
      "duration": 1.8,
      "focus": ["Group A", "A 5 element", "Group B", "B 5 element"],
      "set": { "groupA": "[30,35,25,40,30]", "groupB": "[45,60,70,55,80]" },
      "body": "2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。"
    }
  ]
}`;

export const sourceYaml__arrayWaterfall = `title: "増減を滝グラフで正負に分けて見せる"
type: flow

readouts:
  wf: { kind: waterfall, source: "changes", min: -30, max: 150, viewW: 280, viewH: 90, colorPos: "#22c55e", colorNeg: "#ef4444", label: "Changes (waterfall)" }
  items: { kind: array-list, source: "changes", itemTemplate: "step {i}: {item}", label: "Steps" }

lanes:
  pos: { x: 0, width: 300 }
  neg: { x: 340, width: 300 }

states:
  changes: "[100,-30,50,-20,40]"

actors:
  - +100: { kind: card, lane: pos, stack: 0, subtitle: "初期上昇" }
  - +50: { kind: card, lane: pos, stack: 1, subtitle: "回復" }
  - +40: { kind: card, lane: pos, stack: 2, subtitle: "最終利益" }
  - -30: { kind: card, lane: neg, stack: 0, subtitle: "小損失" }
  - -20: { kind: card, lane: neg, stack: 1, subtitle: "追加損失" }
  - Waterfall: { kind: card, lane: pos, stack: 3, subtitle: "final = sum = {changes.sum}" }

animation:
  - step: "増える分" 1.8s
    focus: ["+100", "+50"]
    set:
      changes: "[60,30,25]"
    description: "正の増減だけを置く。 滝が右上がりに積み上がる。"
  - step: "減る分が入る" 1.8s
    focus: ["+100", "+50", "-30"]
    set:
      changes: "[100,-30,50,-20,40]"
    description: "負の増減が混ざる。 積み上がった分から下がる段が現れ、途中の落ち込みが見える。"
  - step: "収支が出る" 1.8s
    focus: ["+100", "+50", "+40", "-30", "-20", "Waterfall"]
    set:
      changes: "[60,-20,40,-15,30]"
    description: "増減を通した合計が出る。 一覧と滝が同じ配列を見ている。"
`;

export const sourceJson__arrayWaterfall = `{
  "title": "増減を滝グラフで正負に分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "wf",
      "kind": "waterfall",
      "source": "changes",
      "min": -30,
      "max": 150,
      "viewW": 280,
      "viewH": 90,
      "colorPos": "#22c55e",
      "colorNeg": "#ef4444",
      "label": "Changes (waterfall)"
    },
    {
      "id": "items",
      "kind": "array-list",
      "source": "changes",
      "itemTemplate": "step {i}: {item}",
      "label": "Steps"
    }
  ],
  "lanes": {
    "pos": { "x": 0, "width": 300 },
    "neg": { "x": 340, "width": 300 }
  },
  "actors": [
    { "name": "+100", "kind": "card", "lane": "pos", "stack": 0, "subtitle": "初期上昇" },
    { "name": "+50", "kind": "card", "lane": "pos", "stack": 1, "subtitle": "回復" },
    { "name": "+40", "kind": "card", "lane": "pos", "stack": 2, "subtitle": "最終利益" },
    { "name": "-30", "kind": "card", "lane": "neg", "stack": 0, "subtitle": "小損失" },
    { "name": "-20", "kind": "card", "lane": "neg", "stack": 1, "subtitle": "追加損失" },
    {
      "name": "Waterfall",
      "kind": "card",
      "lane": "pos",
      "stack": 3,
      "subtitle": "final = sum = {changes.sum}"
    }
  ],
  "flow": [],
  "states": { "changes": "[100,-30,50,-20,40]" },
  "animation": [
    {
      "step": "増える分",
      "duration": 1.8,
      "focus": ["+100", "+50"],
      "set": { "changes": "[60,30,25]" },
      "body": "正の増減だけを置く。 滝が右上がりに積み上がる。"
    },
    {
      "step": "減る分が入る",
      "duration": 1.8,
      "focus": ["+100", "+50", "-30"],
      "set": { "changes": "[100,-30,50,-20,40]" },
      "body": "負の増減が混ざる。 積み上がった分から下がる段が現れ、途中の落ち込みが見える。"
    },
    {
      "step": "収支が出る",
      "duration": 1.8,
      "focus": ["+100", "+50", "+40", "-30", "-20", "Waterfall"],
      "set": { "changes": "[60,-20,40,-15,30]" },
      "body": "増減を通した合計が出る。 一覧と滝が同じ配列を見ている。"
    }
  ]
}`;

export const sourceYaml__matrixHeatmap = `title: "4×4 の混同行列を熱の色で見せる"
type: flow

readouts:
  m: { kind: matrix, source: "cm", min: 0, max: 10, cellSize: 30, colors: ["#f0f4f8", "#0369a1"], showValue: true, label: "Predictions (4×4)" }

lanes:
  c0: { x: 0, width: 150 }
  c1: { x: 170, width: 150 }
  c2: { x: 340, width: 150 }
  c3: { x: 510, width: 150 }

states:
  cm: "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]"

actors:
  - Class 0 ✓: { kind: card, lane: c0, stack: 0, subtitle: "上段の正解" }
  - Class 0 ✕2: { kind: card, lane: c0, stack: 1, subtitle: "上段の取り違え", title: "Class 0 ✕" }
  - Class 1 ✓: { kind: card, lane: c1, stack: 0, subtitle: "中上段の正解" }
  - Class 1 ✕2: { kind: card, lane: c1, stack: 1, subtitle: "中上段の取り違え", title: "Class 1 ✕" }
  - Class 2 ✓: { kind: card, lane: c2, stack: 0, subtitle: "中下段の正解" }
  - Class 2 ✕2: { kind: card, lane: c2, stack: 1, subtitle: "中下段の取り違え", title: "Class 2 ✕" }
  - Class 3 ✓: { kind: card, lane: c3, stack: 0, subtitle: "下段の正解" }
  - Class 3 ✕2: { kind: card, lane: c3, stack: 1, subtitle: "下段の取り違え", title: "Class 3 ✕" }

animation:
  - step: "対角だけ" 1.8s
    focus: ["Class 0 ✓", "Class 1 ✓"]
    set:
      cm: "[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]"
    description: "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。"
  - step: "誤りが混ざる" 1.8s
    focus: ["Class 0 ✓", "Class 0 ✕2", "Class 1 ✓", "Class 1 ✕2"]
    set:
      cm: "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]"
    description: "取り違えた数が対角の外に現れる。 色が対角から散らばる。"
  - step: "偏りが出る" 1.8s
    focus: ["Class 0 ✓", "Class 0 ✕2", "Class 1 ✓", "Class 1 ✕2", "Class 2 ✓", "Class 2 ✕2", "Class 3 ✓", "Class 3 ✕2"]
    set:
      cm: "[[6,3,0,1],[4,5,1,0],[0,1,8,1],[0,0,5,3]]"
    description: "特定の組合せに誤りが集中する。 濃い升目の位置で癖が読める。"
`;

export const sourceJson__matrixHeatmap = `{
  "title": "4×4 の混同行列を熱の色で見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "m",
      "kind": "matrix",
      "source": "cm",
      "min": 0,
      "max": 10,
      "cellSize": 30,
      "colors": ["#f0f4f8", "#0369a1"],
      "showValue": true,
      "label": "Predictions (4×4)"
    }
  ],
  "lanes": {
    "c0": { "x": 0, "width": 150 },
    "c1": { "x": 170, "width": 150 },
    "c2": { "x": 340, "width": 150 },
    "c3": { "x": 510, "width": 150 }
  },
  "actors": [
    { "name": "Class 0 ✓", "kind": "card", "lane": "c0", "stack": 0, "subtitle": "上段の正解" },
    {
      "name": "Class 0 ✕2",
      "kind": "card",
      "lane": "c0",
      "stack": 1,
      "subtitle": "上段の取り違え",
      "title": "Class 0 ✕"
    },
    { "name": "Class 1 ✓", "kind": "card", "lane": "c1", "stack": 0, "subtitle": "中上段の正解" },
    {
      "name": "Class 1 ✕2",
      "kind": "card",
      "lane": "c1",
      "stack": 1,
      "subtitle": "中上段の取り違え",
      "title": "Class 1 ✕"
    },
    { "name": "Class 2 ✓", "kind": "card", "lane": "c2", "stack": 0, "subtitle": "中下段の正解" },
    {
      "name": "Class 2 ✕2",
      "kind": "card",
      "lane": "c2",
      "stack": 1,
      "subtitle": "中下段の取り違え",
      "title": "Class 2 ✕"
    },
    { "name": "Class 3 ✓", "kind": "card", "lane": "c3", "stack": 0, "subtitle": "下段の正解" },
    {
      "name": "Class 3 ✕2",
      "kind": "card",
      "lane": "c3",
      "stack": 1,
      "subtitle": "下段の取り違え",
      "title": "Class 3 ✕"
    }
  ],
  "flow": [],
  "states": { "cm": "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]" },
  "animation": [
    {
      "step": "対角だけ",
      "duration": 1.8,
      "focus": ["Class 0 ✓", "Class 1 ✓"],
      "set": { "cm": "[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]" },
      "body": "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。"
    },
    {
      "step": "誤りが混ざる",
      "duration": 1.8,
      "focus": ["Class 0 ✓", "Class 0 ✕2", "Class 1 ✓", "Class 1 ✕2"],
      "set": { "cm": "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]" },
      "body": "取り違えた数が対角の外に現れる。 色が対角から散らばる。"
    },
    {
      "step": "偏りが出る",
      "duration": 1.8,
      "focus": [
        "Class 0 ✓",
        "Class 0 ✕2",
        "Class 1 ✓",
        "Class 1 ✕2",
        "Class 2 ✓",
        "Class 2 ✕2",
        "Class 3 ✓",
        "Class 3 ✕2"
      ],
      "set": { "cm": "[[6,3,0,1],[4,5,1,0],[0,1,8,1],[0,0,5,3]]" },
      "body": "特定の組合せに誤りが集中する。 濃い升目の位置で癖が読める。"
    }
  ]
}`;

export const sourceYaml__taskProgressGroup = `title: "4 件の進捗を達成 / 遅れで分けて見せる"
type: flow

readouts:
  tasks: { kind: progress-group, source: "progress", max: 100, labelSource: "names", color: "#2563eb", label: "Tasks (progressGroup)" }

lanes:
  advanced: { x: 0, width: 240 }
  behind: { x: 300, width: 240 }

states:
  progress: "[40,75,20,90]"
  names: '["Design","Impl","Test","Docs"]'

actors:
  - Impl: { kind: card, lane: advanced, stack: 0, subtitle: "{progress[1]}%" }
  - Docs: { kind: card, lane: advanced, stack: 1, subtitle: "{progress[3]}%" }
  - Design: { kind: card, lane: behind, stack: 0, subtitle: "{progress[0]}%" }
  - Test: { kind: card, lane: behind, stack: 1, subtitle: "{progress[2]}%" }

animation:
  - step: "着手前" 1.8s
    focus: ["Impl"]
    set:
      progress: "[10,20,5,15]"
    description: "4 件とも進捗が低い。 帯がどれも短い。"
  - step: "ばらつく" 1.8s
    focus: ["Impl", "Docs"]
    set:
      progress: "[40,75,20,90]"
    description: "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。"
  - step: "追いつく" 1.8s
    focus: ["Impl", "Docs", "Design", "Test"]
    set:
      progress: "[85,95,80,100]"
    description: "遅れていた項目が追いつく。 4 本の帯が揃う。"
`;

export const sourceJson__taskProgressGroup = `{
  "title": "4 件の進捗を達成 / 遅れで分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "tasks",
      "kind": "progress-group",
      "source": "progress",
      "max": 100,
      "labelSource": "names",
      "color": "#2563eb",
      "label": "Tasks (progressGroup)"
    }
  ],
  "lanes": {
    "advanced": { "x": 0, "width": 240 },
    "behind": { "x": 300, "width": 240 }
  },
  "actors": [
    {
      "name": "Impl",
      "kind": "card",
      "lane": "advanced",
      "stack": 0,
      "subtitle": "{progress[1]}%"
    },
    {
      "name": "Docs",
      "kind": "card",
      "lane": "advanced",
      "stack": 1,
      "subtitle": "{progress[3]}%"
    },
    {
      "name": "Design",
      "kind": "card",
      "lane": "behind",
      "stack": 0,
      "subtitle": "{progress[0]}%"
    },
    {
      "name": "Test",
      "kind": "card",
      "lane": "behind",
      "stack": 1,
      "subtitle": "{progress[2]}%"
    }
  ],
  "flow": [],
  "states": { "progress": "[40,75,20,90]", "names": "[\\"Design\\",\\"Impl\\",\\"Test\\",\\"Docs\\"]" },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["Impl"],
      "set": { "progress": "[10,20,5,15]" },
      "body": "4 件とも進捗が低い。 帯がどれも短い。"
    },
    {
      "step": "ばらつく",
      "duration": 1.8,
      "focus": ["Impl", "Docs"],
      "set": { "progress": "[40,75,20,90]" },
      "body": "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。"
    },
    {
      "step": "追いつく",
      "duration": 1.8,
      "focus": ["Impl", "Docs", "Design", "Test"],
      "set": { "progress": "[85,95,80,100]" },
      "body": "遅れていた項目が追いつく。 4 本の帯が揃う。"
    }
  ]
}`;

export const sourceYaml__skillRadar = `title: "5 技能を強 / 中 / 弱に分けて見せる"
type: flow

readouts:
  radar: { kind: radar, source: "skills", max: 10, viewW: 200, viewH: 200, color: "#2563eb", labelSource: "skillNames", label: "Skills (polygon spider)" }

lanes:
  strong: { x: 0, width: 220 }
  middle: { x: 260, width: 220 }
  weak: { x: 520, width: 220 }

states:
  skills: "[8,5,7,3,9]"
  skillNames: '["Design","Impl","Test","Docs","Debug"]'

actors:
  - Design: { kind: card, lane: strong, stack: 0, subtitle: "{skills[0]}/10" }
  - Test: { kind: card, lane: strong, stack: 1, subtitle: "{skills[2]}/10" }
  - Debug: { kind: card, lane: strong, stack: 2, subtitle: "{skills[4]}/10" }
  - Impl: { kind: card, lane: middle, stack: 0, subtitle: "{skills[1]}/10" }
  - Docs: { kind: card, lane: weak, stack: 0, subtitle: "{skills[3]}/10" }

animation:
  - step: "偏った形" 1.8s
    focus: ["Design"]
    set:
      skills: "[9,2,3,2,3]"
    description: "1 つの技能だけが高い。 図形が一方向に伸びる。"
  - step: "広がる" 1.8s
    focus: ["Design", "Test", "Debug"]
    set:
      skills: "[8,5,7,3,9]"
    description: "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。"
  - step: "形が整う" 1.8s
    focus: ["Design", "Test", "Debug", "Impl", "Docs"]
    set:
      skills: "[7,7,8,6,8]"
    description: "5 技能が近い値になり、図形が正多角形に近づく。"
`;

export const sourceJson__skillRadar = `{
  "title": "5 技能を強 / 中 / 弱に分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "radar",
      "kind": "radar",
      "source": "skills",
      "max": 10,
      "viewW": 200,
      "viewH": 200,
      "color": "#2563eb",
      "labelSource": "skillNames",
      "label": "Skills (polygon spider)"
    }
  ],
  "lanes": {
    "strong": { "x": 0, "width": 220 },
    "middle": { "x": 260, "width": 220 },
    "weak": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "Design",
      "kind": "card",
      "lane": "strong",
      "stack": 0,
      "subtitle": "{skills[0]}/10"
    },
    {
      "name": "Test",
      "kind": "card",
      "lane": "strong",
      "stack": 1,
      "subtitle": "{skills[2]}/10"
    },
    {
      "name": "Debug",
      "kind": "card",
      "lane": "strong",
      "stack": 2,
      "subtitle": "{skills[4]}/10"
    },
    {
      "name": "Impl",
      "kind": "card",
      "lane": "middle",
      "stack": 0,
      "subtitle": "{skills[1]}/10"
    },
    { "name": "Docs", "kind": "card", "lane": "weak", "stack": 0, "subtitle": "{skills[3]}/10" }
  ],
  "flow": [],
  "states": { "skills": "[8,5,7,3,9]", "skillNames": "[\\"Design\\",\\"Impl\\",\\"Test\\",\\"Docs\\",\\"Debug\\"]" },
  "animation": [
    {
      "step": "偏った形",
      "duration": 1.8,
      "focus": ["Design"],
      "set": { "skills": "[9,2,3,2,3]" },
      "body": "1 つの技能だけが高い。 図形が一方向に伸びる。"
    },
    {
      "step": "広がる",
      "duration": 1.8,
      "focus": ["Design", "Test", "Debug"],
      "set": { "skills": "[8,5,7,3,9]" },
      "body": "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。"
    },
    {
      "step": "形が整う",
      "duration": 1.8,
      "focus": ["Design", "Test", "Debug", "Impl", "Docs"],
      "set": { "skills": "[7,7,8,6,8]" },
      "body": "5 技能が近い値になり、図形が正多角形に近づく。"
    }
  ]
}`;

export const sourceYaml__perfBubbleChart = `title: "5 種の処理の負荷を大きさで比べる"
type: flow

readouts:
  bubbles: { kind: bubble-chart, source: "perf", xMin: 0, xMax: 100, yMin: 0, yMax: 100, rMin: 0, rMax: 10, viewW: 280, viewH: 180, color: "#2563eb", label: "workloads (3D bubble)" }

lanes:
  high: { x: 0, width: 300 }
  low: { x: 340, width: 300 }

states:
  perf: "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]"

actors:
  - Workload B: { kind: card, lane: high, stack: 0, subtitle: "中央寄りの処理" }
  - Workload C: { kind: card, lane: high, stack: 1, subtitle: "右上に位置する処理" }
  - Workload E: { kind: card, lane: high, stack: 2, subtitle: "左上に位置する処理" }
  - Workload A: { kind: card, lane: low, stack: 0, subtitle: "左下に位置する処理" }
  - Workload D: { kind: card, lane: low, stack: 1, subtitle: "右寄りの処理" }

animation:
  - step: "軽い処理" 1.8s
    focus: ["Workload B"]
    set:
      perf: "[[50,20,3],[70,40,4],[90,60,3]]"
    description: "負荷の小さい処理だけを置く。 円が小さくまとまる。"
  - step: "重い処理が入る" 1.8s
    focus: ["Workload B", "Workload C", "Workload E"]
    set:
      perf: "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]"
    description: "負荷の大きい処理が加わる。 円の大小差が開く。"
  - step: "偏りが出る" 1.8s
    focus: ["Workload B", "Workload C", "Workload E", "Workload A", "Workload D"]
    set:
      perf: "[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]"
    description: "右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。"
`;

export const sourceJson__perfBubbleChart = `{
  "title": "5 種の処理の負荷を大きさで比べる",
  "type": "flow",
  "readouts": [
    {
      "id": "bubbles",
      "kind": "bubble-chart",
      "source": "perf",
      "xMin": 0,
      "xMax": 100,
      "yMin": 0,
      "yMax": 100,
      "rMin": 0,
      "rMax": 10,
      "viewW": 280,
      "viewH": 180,
      "color": "#2563eb",
      "label": "workloads (3D bubble)"
    }
  ],
  "lanes": {
    "high": { "x": 0, "width": 300 },
    "low": { "x": 340, "width": 300 }
  },
  "actors": [
    { "name": "Workload B", "kind": "card", "lane": "high", "stack": 0, "subtitle": "中央寄りの処理" },
    {
      "name": "Workload C",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "右上に位置する処理"
    },
    {
      "name": "Workload E",
      "kind": "card",
      "lane": "high",
      "stack": 2,
      "subtitle": "左上に位置する処理"
    },
    { "name": "Workload A", "kind": "card", "lane": "low", "stack": 0, "subtitle": "左下に位置する処理" },
    { "name": "Workload D", "kind": "card", "lane": "low", "stack": 1, "subtitle": "右寄りの処理" }
  ],
  "flow": [],
  "states": { "perf": "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]" },
  "animation": [
    {
      "step": "軽い処理",
      "duration": 1.8,
      "focus": ["Workload B"],
      "set": { "perf": "[[50,20,3],[70,40,4],[90,60,3]]" },
      "body": "負荷の小さい処理だけを置く。 円が小さくまとまる。"
    },
    {
      "step": "重い処理が入る",
      "duration": 1.8,
      "focus": ["Workload B", "Workload C", "Workload E"],
      "set": { "perf": "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]" },
      "body": "負荷の大きい処理が加わる。 円の大小差が開く。"
    },
    {
      "step": "偏りが出る",
      "duration": 1.8,
      "focus": ["Workload B", "Workload C", "Workload E", "Workload A", "Workload D"],
      "set": { "perf": "[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]" },
      "body": "右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。"
    }
  ]
}`;

export const sourceYaml__portfolioDonut = `title: "資産 4 種を伝統 / 代替に分けて見せる"
type: flow

readouts:
  d: { kind: donut, source: "assets", viewW: 160, viewH: 160, innerRatio: 0.55, label: "Allocation (donut)" }
  legend: { kind: array-list, source: "assetNames", itemTemplate: "● {item}", label: "Legend" }

lanes:
  traditional: { x: 0, width: 300 }
  alternative: { x: 340, width: 300 }

states:
  assets: "[45,30,15,10]"
  assetNames: '["Stocks","Bonds","Cash","Crypto"]'

actors:
  - Stocks: { kind: card, lane: traditional, stack: 0, subtitle: "{assets[0]}%" }
  - Bonds: { kind: card, lane: traditional, stack: 1, subtitle: "{assets[1]}%" }
  - Cash: { kind: card, lane: alternative, stack: 0, subtitle: "{assets[2]}%" }
  - Crypto: { kind: card, lane: alternative, stack: 1, subtitle: "{assets[3]}%" }
  - Portfolio: { kind: card, lane: traditional, stack: 2, subtitle: "合計 {assets.sum}% · 最大 {assets.max}%" }

animation:
  - step: "株式に寄る" 1.8s
    focus: ["Stocks"]
    set:
      assets: "[60,20,15,5]"
      assetNames: '["Stocks","Bonds","Cash","Crypto"]'
    description: "株式の比重が大きい配分。 円の 1 区画が広い。"
  - step: "債券を増やす" 1.8s
    focus: ["Stocks", "Bonds"]
    set:
      assets: "[45,30,15,10]"
      assetNames: '["Stocks","Bonds","Crypto","Cash"]'
    description: "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。"
  - step: "分散する" 1.8s
    focus: ["Stocks", "Bonds", "Cash", "Crypto", "Portfolio"]
    set:
      assets: "[30,28,22,20]"
      assetNames: '["Stocks","Bonds","Cash","Crypto"]'
    description: "4 種に近い比率で分散する。 区画の差が小さくなる。"
`;

export const sourceJson__portfolioDonut = `{
  "title": "資産 4 種を伝統 / 代替に分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "d",
      "kind": "donut",
      "source": "assets",
      "viewW": 160,
      "viewH": 160,
      "innerRatio": 0.55,
      "label": "Allocation (donut)"
    },
    {
      "id": "legend",
      "kind": "array-list",
      "source": "assetNames",
      "itemTemplate": "● {item}",
      "label": "Legend"
    }
  ],
  "lanes": {
    "traditional": { "x": 0, "width": 300 },
    "alternative": { "x": 340, "width": 300 }
  },
  "actors": [
    {
      "name": "Stocks",
      "kind": "card",
      "lane": "traditional",
      "stack": 0,
      "subtitle": "{assets[0]}%"
    },
    {
      "name": "Bonds",
      "kind": "card",
      "lane": "traditional",
      "stack": 1,
      "subtitle": "{assets[1]}%"
    },
    {
      "name": "Cash",
      "kind": "card",
      "lane": "alternative",
      "stack": 0,
      "subtitle": "{assets[2]}%"
    },
    {
      "name": "Crypto",
      "kind": "card",
      "lane": "alternative",
      "stack": 1,
      "subtitle": "{assets[3]}%"
    },
    {
      "name": "Portfolio",
      "kind": "card",
      "lane": "traditional",
      "stack": 2,
      "subtitle": "合計 {assets.sum}% · 最大 {assets.max}%"
    }
  ],
  "flow": [],
  "states": { "assets": "[45,30,15,10]", "assetNames": "[\\"Stocks\\",\\"Bonds\\",\\"Cash\\",\\"Crypto\\"]" },
  "animation": [
    {
      "step": "株式に寄る",
      "duration": 1.8,
      "focus": ["Stocks"],
      "set": { "assets": "[60,20,15,5]", "assetNames": "[\\"Stocks\\",\\"Bonds\\",\\"Cash\\",\\"Crypto\\"]" },
      "body": "株式の比重が大きい配分。 円の 1 区画が広い。"
    },
    {
      "step": "債券を増やす",
      "duration": 1.8,
      "focus": ["Stocks", "Bonds"],
      "set": { "assets": "[45,30,15,10]", "assetNames": "[\\"Stocks\\",\\"Bonds\\",\\"Crypto\\",\\"Cash\\"]" },
      "body": "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。"
    },
    {
      "step": "分散する",
      "duration": 1.8,
      "focus": ["Stocks", "Bonds", "Cash", "Crypto", "Portfolio"],
      "set": { "assets": "[30,28,22,20]", "assetNames": "[\\"Stocks\\",\\"Bonds\\",\\"Cash\\",\\"Crypto\\"]" },
      "body": "4 種に近い比率で分散する。 区画の差が小さくなる。"
    }
  ]
}`;

export const sourceYaml__abTestResult = `title: "A/B テストの振り分けと結果を見せる"
type: flow

readouts:
  conv: { kind: stacked-bar, sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#a08870", colorB: "#22c55e", label: "Daily conv % (A vs B)" }
  splitDonut: { kind: donut, source: "splitData", viewW: 120, viewH: 120, innerRatio: 0.5, label: "Traffic split" }
  winner: { kind: donut, source: "results", viewW: 120, viewH: 120, colors: ["#22c55e", "#a08870"], innerRatio: 0.6, label: "Winner share (B=green)" }

lanes:
  varA: { x: 0, width: 300 }
  split: { x: 360, width: 250 }
  varB: { x: 670, width: 300 }

states:
  convA: "[40,45,42,48,44]"
  convB: "[50,55,58,62,60]"
  splitData: "[50,50]"
  results: "[58,42]"

actors:
  - Variant A: { kind: card, lane: varA, stack: 0, subtitle: "avg {convA.avg}%", posW: 250 }
  - Split2: { kind: card, lane: split, stack: 0, subtitle: "振り分け {splitData[0]} / {splitData[1]}", posW: 200, title: "Split" }
  - Variant B: { kind: card, lane: varB, stack: 0, subtitle: "avg {convB.avg}%", posW: 250 }

flow:
  - Split2 -> Variant A: "50%" (info) { sub: "control", side: "left" }
  - Split2 -> Variant B: "50%" (success) { sub: "treatment" }

animation:
  - step: "振り分け" 1.8s
    focus: ["Variant A", "Split2"]
    set:
      splitData: "[50,50]"
      results: "[50,50]"
      convA: "[48,50,49,51,50]"
      convB: "[49,50,51,50,52]"
    description: "利用者を半々に分ける。 振り分けの円が 2 等分になる。"
  - step: "差が出る" 1.8s
    focus: ["Variant A", "Split2", "Variant B"]
    set:
      splitData: "[60,40]"
      results: "[55,45]"
      convA: "[48,49,50,48,49]"
      convB: "[52,55,57,56,58]"
    description: "試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。"
  - step: "差が確定する" 1.8s
    focus: ["Split2", "Variant B"]
    set:
      splitData: "[50,50]"
      results: "[62,38]"
      convA: "[47,48,49,47,48]"
      convB: "[58,61,63,62,65]"
    description: "振り分けを半々に戻しても差が残る。 振り分けと結果を分けて見られる。"
`;

export const sourceJson__abTestResult = `{
  "title": "A/B テストの振り分けと結果を見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "conv",
      "kind": "stacked-bar",
      "sourceA": "convA",
      "sourceB": "convB",
      "min": 30,
      "max": 70,
      "colorA": "#a08870",
      "colorB": "#22c55e",
      "label": "Daily conv % (A vs B)"
    },
    {
      "id": "splitDonut",
      "kind": "donut",
      "source": "splitData",
      "viewW": 120,
      "viewH": 120,
      "innerRatio": 0.5,
      "label": "Traffic split"
    },
    {
      "id": "winner",
      "kind": "donut",
      "source": "results",
      "viewW": 120,
      "viewH": 120,
      "colors": ["#22c55e", "#a08870"],
      "innerRatio": 0.6,
      "label": "Winner share (B=green)"
    }
  ],
  "lanes": {
    "varA": { "x": 0, "width": 300 },
    "split": { "x": 360, "width": 250 },
    "varB": { "x": 670, "width": 300 }
  },
  "actors": [
    {
      "name": "Variant A",
      "kind": "card",
      "lane": "varA",
      "stack": 0,
      "subtitle": "avg {convA.avg}%",
      "posW": 250
    },
    {
      "name": "Split2",
      "kind": "card",
      "lane": "split",
      "stack": 0,
      "subtitle": "振り分け {splitData[0]} / {splitData[1]}",
      "posW": 200,
      "title": "Split"
    },
    {
      "name": "Variant B",
      "kind": "card",
      "lane": "varB",
      "stack": 0,
      "subtitle": "avg {convB.avg}%",
      "posW": 250
    }
  ],
  "flow": [
    {
      "from": "Split2",
      "to": "Variant A",
      "label": "50%",
      "tone": "info",
      "sub": "control",
      "side": "left"
    },
    {
      "from": "Split2",
      "to": "Variant B",
      "label": "50%",
      "tone": "success",
      "sub": "treatment"
    }
  ],
  "states": {
    "convA": "[40,45,42,48,44]",
    "convB": "[50,55,58,62,60]",
    "splitData": "[50,50]",
    "results": "[58,42]"
  },
  "animation": [
    {
      "step": "振り分け",
      "duration": 1.8,
      "focus": ["Variant A", "Split2"],
      "set": {
        "splitData": "[50,50]",
        "results": "[50,50]",
        "convA": "[48,50,49,51,50]",
        "convB": "[49,50,51,50,52]"
      },
      "body": "利用者を半々に分ける。 振り分けの円が 2 等分になる。"
    },
    {
      "step": "差が出る",
      "duration": 1.8,
      "focus": ["Variant A", "Split2", "Variant B"],
      "set": {
        "splitData": "[60,40]",
        "results": "[55,45]",
        "convA": "[48,49,50,48,49]",
        "convB": "[52,55,57,56,58]"
      },
      "body": "試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。"
    },
    {
      "step": "差が確定する",
      "duration": 1.8,
      "focus": ["Split2", "Variant B"],
      "set": {
        "splitData": "[50,50]",
        "results": "[62,38]",
        "convA": "[47,48,49,47,48]",
        "convB": "[58,61,63,62,65]"
      },
      "body": "振り分けを半々に戻しても差が残る。 振り分けと結果を分けて見られる。"
    }
  ]
}`;

export const sourceYaml__contributionHeatmap = `title: "30 日の活動量を升目の濃さで見せる"
type: flow

readouts:
  h: { kind: calendar-heatmap, source: "commits", max: 10, cellSize: 10, cellGap: 2, label: "1 year (53 週 × 7 日)" }

lanes:
  q1: { x: 0, width: 160 }
  q2: { x: 180, width: 160 }
  q3: { x: 360, width: 160 }
  q4: { x: 540, width: 160 }

states:
  commits: "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0]"

actors:
  - Q1 (Jan-Mar): { kind: card, lane: q1, stack: 0, subtitle: "静かな期間" }
  - Q2 (Apr-Jun): { kind: card, lane: q2, stack: 0, subtitle: "活発な期間" }
  - Q3 (Jul-Sep): { kind: card, lane: q3, stack: 0, subtitle: "落ち着く期間" }
  - Q4 (Oct-Dec): { kind: card, lane: q4, stack: 0, subtitle: "全体の推移" }
  - Year total: { kind: card, lane: q4, stack: 1, subtitle: "sum {commits.sum} · max {commits.max} · avg {commits.avg}" }

animation:
  - step: "静かな期間" 1.8s
    focus: ["Q1 (Jan-Mar)"]
    set:
      commits: "[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]"
    description: "書き込みが少ない期間。 濃い升目がまばら。"
  - step: "活発になる" 1.8s
    focus: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)"]
    set:
      commits: "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]"
    description: "書き込みが増えて濃い升目が続く。 帯のように連なる。"
  - step: "落ち着く" 1.8s
    focus: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)", "Year total"]
    set:
      commits: "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]"
    description: "終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。"
`;

export const sourceJson__contributionHeatmap = `{
  "title": "30 日の活動量を升目の濃さで見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "h",
      "kind": "calendar-heatmap",
      "source": "commits",
      "max": 10,
      "cellSize": 10,
      "cellGap": 2,
      "label": "1 year (53 週 × 7 日)"
    }
  ],
  "lanes": {
    "q1": { "x": 0, "width": 160 },
    "q2": { "x": 180, "width": 160 },
    "q3": { "x": 360, "width": 160 },
    "q4": { "x": 540, "width": 160 }
  },
  "actors": [
    { "name": "Q1 (Jan-Mar)", "kind": "card", "lane": "q1", "stack": 0, "subtitle": "静かな期間" },
    { "name": "Q2 (Apr-Jun)", "kind": "card", "lane": "q2", "stack": 0, "subtitle": "活発な期間" },
    { "name": "Q3 (Jul-Sep)", "kind": "card", "lane": "q3", "stack": 0, "subtitle": "落ち着く期間" },
    { "name": "Q4 (Oct-Dec)", "kind": "card", "lane": "q4", "stack": 0, "subtitle": "全体の推移" },
    {
      "name": "Year total",
      "kind": "card",
      "lane": "q4",
      "stack": 1,
      "subtitle": "sum {commits.sum} · max {commits.max} · avg {commits.avg}"
    }
  ],
  "flow": [],
  "states": {
    "commits": "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0]"
  },
  "animation": [
    {
      "step": "静かな期間",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)"],
      "set": { "commits": "[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]" },
      "body": "書き込みが少ない期間。 濃い升目がまばら。"
    },
    {
      "step": "活発になる",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)"],
      "set": { "commits": "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]" },
      "body": "書き込みが増えて濃い升目が続く。 帯のように連なる。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)", "Year total"],
      "set": { "commits": "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]" },
      "body": "終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。"
    }
  ]
}`;

export const sourceYaml__priceCandlestick = `title: "8 日分の値動きを陽線 / 陰線で見せる"
type: flow

readouts:
  chart: { kind: candlestick, source: "ohlc", min: 95, max: 122, viewW: 300, viewH: 110, colorUp: "#22c55e", colorDown: "#ef4444", label: "OHLC (candlestick)" }

lanes:
  up: { x: 0, width: 320 }
  down: { x: 360, width: 320 }

states:
  ohlc: "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109],[109,113,106,112],[112,118,111,116],[116,120,113,118]]"

actors:
  - Day 1 ▲: { kind: card, lane: up, stack: 0, subtitle: "O=100 · C=105 (+5)" }
  - Day 3 ▲: { kind: card, lane: up, stack: 1, subtitle: "O=102 · C=104 (+2)" }
  - Day 4 ▲: { kind: card, lane: up, stack: 2, subtitle: "O=104 · C=111 (+7)" }
  - Day 6 ▲: { kind: card, lane: up, stack: 3, subtitle: "O=109 · C=112 (+3)" }
  - Day 7 ▲: { kind: card, lane: up, stack: 4, subtitle: "O=112 · C=116 (+4)" }
  - Day 8 ▲: { kind: card, lane: up, stack: 5, subtitle: "O=116 · C=118 (+2)" }
  - Day 2 ▼: { kind: card, lane: down, stack: 0, subtitle: "O=105 · C=102 (-3)" }
  - Day 5 ▼: { kind: card, lane: down, stack: 1, subtitle: "O=111 · C=109 (-2)" }

animation:
  - step: "横ばい" 1.8s
    focus: ["Day 1 ▲", "Day 2 ▼"]
    set:
      ohlc: "[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]"
    description: "始値と終値が近い日が続く。 実体の短い足が並ぶ。"
  - step: "上がる" 1.8s
    focus: ["Day 1 ▲", "Day 2 ▼", "Day 3 ▲", "Day 4 ▲"]
    set:
      ohlc: "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]"
    description: "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。"
  - step: "振れる" 1.8s
    focus: ["Day 1 ▲", "Day 2 ▼", "Day 3 ▲", "Day 4 ▲", "Day 5 ▼", "Day 6 ▲", "Day 7 ▲", "Day 8 ▲"]
    set:
      ohlc: "[[100,108,96,105],[105,118,95,102],[102,106,97,104],[104,120,103,111],[111,115,98,109],[109,121,106,112],[112,118,101,116],[116,122,113,118]]"
    description: "上下の幅が大きい日が混ざる。 ヒゲの長さで振れ幅が読める。"
`;

export const sourceJson__priceCandlestick = `{
  "title": "8 日分の値動きを陽線 / 陰線で見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "chart",
      "kind": "candlestick",
      "source": "ohlc",
      "min": 95,
      "max": 122,
      "viewW": 300,
      "viewH": 110,
      "colorUp": "#22c55e",
      "colorDown": "#ef4444",
      "label": "OHLC (candlestick)"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 320 },
    "down": { "x": 360, "width": 320 }
  },
  "actors": [
    {
      "name": "Day 1 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 0,
      "subtitle": "O=100 · C=105 (+5)"
    },
    {
      "name": "Day 3 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 1,
      "subtitle": "O=102 · C=104 (+2)"
    },
    {
      "name": "Day 4 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 2,
      "subtitle": "O=104 · C=111 (+7)"
    },
    {
      "name": "Day 6 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 3,
      "subtitle": "O=109 · C=112 (+3)"
    },
    {
      "name": "Day 7 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 4,
      "subtitle": "O=112 · C=116 (+4)"
    },
    {
      "name": "Day 8 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 5,
      "subtitle": "O=116 · C=118 (+2)"
    },
    {
      "name": "Day 2 ▼",
      "kind": "card",
      "lane": "down",
      "stack": 0,
      "subtitle": "O=105 · C=102 (-3)"
    },
    {
      "name": "Day 5 ▼",
      "kind": "card",
      "lane": "down",
      "stack": 1,
      "subtitle": "O=111 · C=109 (-2)"
    }
  ],
  "flow": [],
  "states": {
    "ohlc": "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109],[109,113,106,112],[112,118,111,116],[116,120,113,118]]"
  },
  "animation": [
    {
      "step": "横ばい",
      "duration": 1.8,
      "focus": ["Day 1 ▲", "Day 2 ▼"],
      "set": { "ohlc": "[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]" },
      "body": "始値と終値が近い日が続く。 実体の短い足が並ぶ。"
    },
    {
      "step": "上がる",
      "duration": 1.8,
      "focus": ["Day 1 ▲", "Day 2 ▼", "Day 3 ▲", "Day 4 ▲"],
      "set": {
        "ohlc": "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]"
      },
      "body": "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。"
    },
    {
      "step": "振れる",
      "duration": 1.8,
      "focus": ["Day 1 ▲", "Day 2 ▼", "Day 3 ▲", "Day 4 ▲", "Day 5 ▼", "Day 6 ▲", "Day 7 ▲", "Day 8 ▲"],
      "set": {
        "ohlc": "[[100,108,96,105],[105,118,95,102],[102,106,97,104],[104,120,103,111],[111,115,98,109],[109,121,106,112],[112,118,101,116],[116,122,113,118]]"
      },
      "body": "上下の幅が大きい日が混ざる。 ヒゲの長さで振れ幅が読める。"
    }
  ]
}`;

export const sourceYaml__userVenn = `title: "2 つの集合の重なりを 3 領域で見せる"
type: flow

readouts:
  v: { kind: venn, source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "Users", labelB: "Payers", label: "Overlap (2-set Venn)" }

lanes:
  usersOnly: { x: 0, width: 220 }
  both: { x: 260, width: 200 }
  payersOnly: { x: 500, width: 200 }

states:
  sets: "[100,40,25]"

actors:
  - Users total: { kind: card, lane: usersOnly, stack: 0, subtitle: "A 全体 {sets[0]} · 共通 {sets[2]}" }
  - Both (A ∩ B): { kind: card, lane: both, stack: 0, subtitle: "共通 = {sets[2]}" }
  - Payers total: { kind: card, lane: payersOnly, stack: 0, subtitle: "B 全体 = {sets[1]}" }
  - Universe: { kind: card, lane: both, stack: 1, subtitle: "A={sets[0]} · B={sets[1]}" }

animation:
  - step: "重なりなし" 1.8s
    focus: ["Users total"]
    set:
      sets: "[100,40,0]"
    description: "2 つの集まりが離れている。 共通する人が居ない。"
  - step: "重なる" 1.8s
    focus: ["Users total", "Both (A ∩ B)"]
    set:
      sets: "[100,40,25]"
    description: "共通する人が現れて 2 つの円が重なる。"
  - step: "大きく重なる" 1.8s
    focus: ["Users total", "Both (A ∩ B)", "Payers total", "Universe"]
    set:
      sets: "[100,60,45]"
    description: "共通部分が広がる。 重なりの面積で関係の強さが読める。"
`;

export const sourceJson__userVenn = `{
  "title": "2 つの集合の重なりを 3 領域で見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "v",
      "kind": "venn",
      "source": "sets",
      "viewW": 220,
      "viewH": 140,
      "colorA": "#2563eb",
      "colorB": "#f97316",
      "labelA": "Users",
      "labelB": "Payers",
      "label": "Overlap (2-set Venn)"
    }
  ],
  "lanes": {
    "usersOnly": { "x": 0, "width": 220 },
    "both": { "x": 260, "width": 200 },
    "payersOnly": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "Users total",
      "kind": "card",
      "lane": "usersOnly",
      "stack": 0,
      "subtitle": "A 全体 {sets[0]} · 共通 {sets[2]}"
    },
    {
      "name": "Both (A ∩ B)",
      "kind": "card",
      "lane": "both",
      "stack": 0,
      "subtitle": "共通 = {sets[2]}"
    },
    {
      "name": "Payers total",
      "kind": "card",
      "lane": "payersOnly",
      "stack": 0,
      "subtitle": "B 全体 = {sets[1]}"
    },
    {
      "name": "Universe",
      "kind": "card",
      "lane": "both",
      "stack": 1,
      "subtitle": "A={sets[0]} · B={sets[1]}"
    }
  ],
  "flow": [],
  "states": { "sets": "[100,40,25]" },
  "animation": [
    {
      "step": "重なりなし",
      "duration": 1.8,
      "focus": ["Users total"],
      "set": { "sets": "[100,40,0]" },
      "body": "2 つの集まりが離れている。 共通する人が居ない。"
    },
    {
      "step": "重なる",
      "duration": 1.8,
      "focus": ["Users total", "Both (A ∩ B)"],
      "set": { "sets": "[100,40,25]" },
      "body": "共通する人が現れて 2 つの円が重なる。"
    },
    {
      "step": "大きく重なる",
      "duration": 1.8,
      "focus": ["Users total", "Both (A ∩ B)", "Payers total", "Universe"],
      "set": { "sets": "[100,60,45]" },
      "body": "共通部分が広がる。 重なりの面積で関係の強さが読める。"
    }
  ]
}`;

export const sourceYaml__scoreSlope = `title: "5 人の点数変化を上昇 / 下降で分ける"
type: flow

readouts:
  s: { kind: slope, source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "Score change (slope)" }

lanes:
  up: { x: 0, width: 300 }
  down: { x: 340, width: 300 }

states:
  scores: '[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]'

actors:
  - Alice ↑: { kind: card, lane: up, stack: 0, subtitle: "1 人目" }
  - Carol ↑: { kind: card, lane: up, stack: 1, subtitle: "3 人目" }
  - Dan ↑: { kind: card, lane: up, stack: 2, subtitle: "4 人目" }
  - Bob ↓: { kind: card, lane: down, stack: 0, subtitle: "2 人目" }
  - Eve ↓: { kind: card, lane: down, stack: 1, subtitle: "5 人目" }

animation:
  - step: "横並び" 1.8s
    focus: ["Alice ↑"]
    set:
      scores: '[[65,65,"Alice"],[70,70,"Bob"],[55,55,"Carol"]]'
    description: "前後で点数が変わらない状態。 線が水平に並ぶ。"
  - step: "差が出る" 1.8s
    focus: ["Alice ↑", "Carol ↑", "Dan ↑"]
    set:
      scores: '[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]'
    description: "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。"
  - step: "順位が入れ替わる" 1.8s
    focus: ["Alice ↑", "Carol ↑", "Dan ↑", "Bob ↓", "Eve ↓"]
    set:
      scores: '[[65,72,"Alice"],[70,60,"Bob"],[55,90,"Carol"],[80,75,"Dan"],[60,85,"Eve"]]'
    description: "前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。"
`;

export const sourceJson__scoreSlope = `{
  "title": "5 人の点数変化を上昇 / 下降で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "s",
      "kind": "slope",
      "source": "scores",
      "min": 40,
      "max": 100,
      "viewW": 260,
      "viewH": 160,
      "colorUp": "#22c55e",
      "colorDown": "#ef4444",
      "label": "Score change (slope)"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 300 },
    "down": { "x": 340, "width": 300 }
  },
  "actors": [
    { "name": "Alice ↑", "kind": "card", "lane": "up", "stack": 0, "subtitle": "1 人目" },
    { "name": "Carol ↑", "kind": "card", "lane": "up", "stack": 1, "subtitle": "3 人目" },
    { "name": "Dan ↑", "kind": "card", "lane": "up", "stack": 2, "subtitle": "4 人目" },
    { "name": "Bob ↓", "kind": "card", "lane": "down", "stack": 0, "subtitle": "2 人目" },
    { "name": "Eve ↓", "kind": "card", "lane": "down", "stack": 1, "subtitle": "5 人目" }
  ],
  "flow": [],
  "states": {
    "scores": "[[65,82,\\"Alice\\"],[70,68,\\"Bob\\"],[55,78,\\"Carol\\"],[80,88,\\"Dan\\"],[60,55,\\"Eve\\"]]"
  },
  "animation": [
    {
      "step": "横並び",
      "duration": 1.8,
      "focus": ["Alice ↑"],
      "set": { "scores": "[[65,65,\\"Alice\\"],[70,70,\\"Bob\\"],[55,55,\\"Carol\\"]]" },
      "body": "前後で点数が変わらない状態。 線が水平に並ぶ。"
    },
    {
      "step": "差が出る",
      "duration": 1.8,
      "focus": ["Alice ↑", "Carol ↑", "Dan ↑"],
      "set": {
        "scores": "[[65,82,\\"Alice\\"],[70,68,\\"Bob\\"],[55,78,\\"Carol\\"],[80,88,\\"Dan\\"],[60,55,\\"Eve\\"]]"
      },
      "body": "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。"
    },
    {
      "step": "順位が入れ替わる",
      "duration": 1.8,
      "focus": ["Alice ↑", "Carol ↑", "Dan ↑", "Bob ↓", "Eve ↓"],
      "set": {
        "scores": "[[65,72,\\"Alice\\"],[70,60,\\"Bob\\"],[55,90,\\"Carol\\"],[80,75,\\"Dan\\"],[60,85,\\"Eve\\"]]"
      },
      "body": "前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。"
    }
  ]
}`;

export const sourceYaml__salesFunnel = `title: "訪問から購入までの絞り込みを追う"
type: flow

readouts:
  f: { kind: funnel, source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#a08870", label: "Conversion (trapezoid)" }

lanes:
  col1: { x: 0, width: 220 }
  col2: { x: 260, width: 270 }

states:
  stages: '[["Visit",1000],["Signup",400],["Trial",150],["Paid",40]]'

actors:
  - Visit: { kind: card, lane: col1, stack: 0, subtitle: "漏斗の入口", posW: 160 }
  - Signup: { kind: card, lane: col2, stack: 0, subtitle: "登録に進む段", posW: 180 }
  - Trial: { kind: card, lane: col1, stack: 1, subtitle: "試用に進む段", posW: 170 }
  - Paid: { kind: card, lane: col2, stack: 1, subtitle: "購入に至る段", posW: 220 }

flow:
  - Visit -> Signup: "登録へ" (info)
  - Signup -> Trial: "試用へ" (warning)
  - Trial -> Paid: "購入へ" (error)

animation:
  - step: "入口だけ" 1.8s
    focus: ["Visit"]
    set:
      stages: '[["Visit",1000],["Signup",0],["Trial",0],["Paid",0]]'
    description: "訪問だけがある状態。 漏斗の一番上が広い。"
  - step: "絞られる" 1.8s
    focus: ["Visit", "Signup", "Trial"]
    set:
      stages: '[["Visit",1000],["Signup",400],["Trial",150],["Paid",40]]'
    description: "登録と試用に進む人が現れる。 段ごとに幅が細くなる。"
  - step: "歩留まりが上がる" 1.8s
    focus: ["Visit", "Signup", "Trial", "Paid"]
    set:
      stages: '[["Visit",1000],["Signup",620],["Trial",340],["Paid",130]]'
    description: "各段の残る割合が改善する。 漏斗の細まり方が緩くなる。"
`;

export const sourceJson__salesFunnel = `{
  "title": "訪問から購入までの絞り込みを追う",
  "type": "flow",
  "readouts": [
    {
      "id": "f",
      "kind": "funnel",
      "source": "stages",
      "viewW": 280,
      "viewH": 200,
      "colorTop": "#2563eb",
      "colorBottom": "#a08870",
      "label": "Conversion (trapezoid)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 220 },
    "col2": { "x": 260, "width": 270 }
  },
  "actors": [
    {
      "name": "Visit",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "漏斗の入口",
      "posW": 160
    },
    {
      "name": "Signup",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "登録に進む段",
      "posW": 180
    },
    {
      "name": "Trial",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "試用に進む段",
      "posW": 170
    },
    {
      "name": "Paid",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "購入に至る段",
      "posW": 220
    }
  ],
  "flow": [
    { "from": "Visit", "to": "Signup", "label": "登録へ", "tone": "info" },
    { "from": "Signup", "to": "Trial", "label": "試用へ", "tone": "warning" },
    { "from": "Trial", "to": "Paid", "label": "購入へ", "tone": "error" }
  ],
  "states": { "stages": "[[\\"Visit\\",1000],[\\"Signup\\",400],[\\"Trial\\",150],[\\"Paid\\",40]]" },
  "animation": [
    {
      "step": "入口だけ",
      "duration": 1.8,
      "focus": ["Visit"],
      "set": { "stages": "[[\\"Visit\\",1000],[\\"Signup\\",0],[\\"Trial\\",0],[\\"Paid\\",0]]" },
      "body": "訪問だけがある状態。 漏斗の一番上が広い。"
    },
    {
      "step": "絞られる",
      "duration": 1.8,
      "focus": ["Visit", "Signup", "Trial"],
      "set": { "stages": "[[\\"Visit\\",1000],[\\"Signup\\",400],[\\"Trial\\",150],[\\"Paid\\",40]]" },
      "body": "登録と試用に進む人が現れる。 段ごとに幅が細くなる。"
    },
    {
      "step": "歩留まりが上がる",
      "duration": 1.8,
      "focus": ["Visit", "Signup", "Trial", "Paid"],
      "set": { "stages": "[[\\"Visit\\",1000],[\\"Signup\\",620],[\\"Trial\\",340],[\\"Paid\\",130]]" },
      "body": "各段の残る割合が改善する。 漏斗の細まり方が緩くなる。"
    }
  ]
}`;

export const sourceYaml__projectGantt = `title: "4 工程の期間を横棒で並べる"
type: flow

readouts:
  g: { kind: gantt, source: "tasks", min: 0, max: 10, viewW: 320, viewH: 140, color: "#2563eb", label: "Timeline (gantt)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 330 }

states:
  tasks: '[["Design",0,3],["Impl",3,5],["Test",6,3],["Ship",9,1]]'

actors:
  - Design: { kind: card, lane: col1, stack: 0, subtitle: "day 0-3 (3 day)", posW: 200 }
  - Impl: { kind: card, lane: col2, stack: 0, subtitle: "day 3-8 (5 day, largest)", posW: 280 }
  - Test: { kind: card, lane: col1, stack: 1, subtitle: "day 6-9 (3 day, overlap w/ impl)", posW: 320 }
  - Ship: { kind: card, lane: col2, stack: 1, subtitle: "day 9-10 (1 day)", posW: 210 }

flow:
  - Design -> Impl: "handover" (info)
  - Impl -> Test: "test start" (accent)
  - Test -> Ship: "release" (success)

animation:
  - step: "設計だけ" 1.8s
    focus: ["Design"]
    set:
      tasks: '[["Design",0,3]]'
    description: "最初の作業だけが置かれた状態。 帯が 1 本。"
  - step: "連なる" 1.8s
    focus: ["Design", "Impl", "Test"]
    set:
      tasks: '[["Design",0,3],["Impl",3,5],["Test",6,3]]'
    description: "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。"
  - step: "重なる" 1.8s
    focus: ["Design", "Impl", "Test", "Ship"]
    set:
      tasks: '[["Design",0,3],["Impl",2,6],["Test",6,4],["Ship",9,1]]'
    description: "作業が並行して重なる期間が出る。 帯の重なりで山場が読める。"
`;

export const sourceJson__projectGantt = `{
  "title": "4 工程の期間を横棒で並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "g",
      "kind": "gantt",
      "source": "tasks",
      "min": 0,
      "max": 10,
      "viewW": 320,
      "viewH": 140,
      "color": "#2563eb",
      "label": "Timeline (gantt)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 330 }
  },
  "actors": [
    {
      "name": "Design",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "day 0-3 (3 day)",
      "posW": 200
    },
    {
      "name": "Impl",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "day 3-8 (5 day, largest)",
      "posW": 280
    },
    {
      "name": "Test",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "day 6-9 (3 day, overlap w/ impl)",
      "posW": 320
    },
    {
      "name": "Ship",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "day 9-10 (1 day)",
      "posW": 210
    }
  ],
  "flow": [
    { "from": "Design", "to": "Impl", "label": "handover", "tone": "info" },
    { "from": "Impl", "to": "Test", "label": "test start", "tone": "accent" },
    { "from": "Test", "to": "Ship", "label": "release", "tone": "success" }
  ],
  "states": { "tasks": "[[\\"Design\\",0,3],[\\"Impl\\",3,5],[\\"Test\\",6,3],[\\"Ship\\",9,1]]" },
  "animation": [
    {
      "step": "設計だけ",
      "duration": 1.8,
      "focus": ["Design"],
      "set": { "tasks": "[[\\"Design\\",0,3]]" },
      "body": "最初の作業だけが置かれた状態。 帯が 1 本。"
    },
    {
      "step": "連なる",
      "duration": 1.8,
      "focus": ["Design", "Impl", "Test"],
      "set": { "tasks": "[[\\"Design\\",0,3],[\\"Impl\\",3,5],[\\"Test\\",6,3]]" },
      "body": "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。"
    },
    {
      "step": "重なる",
      "duration": 1.8,
      "focus": ["Design", "Impl", "Test", "Ship"],
      "set": { "tasks": "[[\\"Design\\",0,3],[\\"Impl\\",2,6],[\\"Test\\",6,4],[\\"Ship\\",9,1]]" },
      "body": "作業が並行して重なる期間が出る。 帯の重なりで山場が読める。"
    }
  ]
}`;

export const sourceYaml__resourceTreemap = `title: "6 チームの予算を面積で比べる"
type: flow

readouts:
  t: { kind: treemap, source: "teams", viewW: 280, viewH: 200, label: "Budget (treemap)" }

lanes:
  major: { x: 0, width: 220 }
  mid: { x: 260, width: 200 }
  minor: { x: 500, width: 200 }

states:
  teams: '[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]'

actors:
  - Engineering: { kind: card, lane: major, stack: 0, subtitle: "最も大きい区画" }
  - Sales: { kind: card, lane: major, stack: 1, subtitle: "2 番目に大きい" }
  - Marketing: { kind: card, lane: major, stack: 2, subtitle: "中位の区画" }
  - Support: { kind: card, lane: mid, stack: 0, subtitle: "小さめの区画" }
  - Ops: { kind: card, lane: mid, stack: 1, subtitle: "小さい区画" }
  - Legal: { kind: card, lane: minor, stack: 0, subtitle: "最も小さい区画" }

animation:
  - step: "均等に分ける" 1.8s
    focus: ["Engineering"]
    set:
      teams: '[["Engineering",19],["Sales",18],["Marketing",17],["Support",16],["Ops",15],["Legal",14]]'
    description: "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。"
  - step: "1 つに寄る" 1.8s
    focus: ["Engineering", "Sales", "Marketing"]
    set:
      teams: '[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]'
    description: "1 つに配分が寄る。 大きな区画が場所を占める。"
  - step: "分け直す" 1.8s
    focus: ["Engineering", "Sales", "Marketing", "Support", "Ops", "Legal"]
    set:
      teams: '[["Engineering",30],["Sales",28],["Marketing",18],["Support",12],["Ops",8],["Legal",4]]'
    description: "配分を組み替える。 区画の大小と位置が同時に変わる。"
`;

export const sourceJson__resourceTreemap = `{
  "title": "6 チームの予算を面積で比べる",
  "type": "flow",
  "readouts": [
    {
      "id": "t",
      "kind": "treemap",
      "source": "teams",
      "viewW": 280,
      "viewH": 200,
      "label": "Budget (treemap)"
    }
  ],
  "lanes": {
    "major": { "x": 0, "width": 220 },
    "mid": { "x": 260, "width": 200 },
    "minor": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "Engineering",
      "kind": "card",
      "lane": "major",
      "stack": 0,
      "subtitle": "最も大きい区画"
    },
    { "name": "Sales", "kind": "card", "lane": "major", "stack": 1, "subtitle": "2 番目に大きい" },
    { "name": "Marketing", "kind": "card", "lane": "major", "stack": 2, "subtitle": "中位の区画" },
    { "name": "Support", "kind": "card", "lane": "mid", "stack": 0, "subtitle": "小さめの区画" },
    { "name": "Ops", "kind": "card", "lane": "mid", "stack": 1, "subtitle": "小さい区画" },
    { "name": "Legal", "kind": "card", "lane": "minor", "stack": 0, "subtitle": "最も小さい区画" }
  ],
  "flow": [],
  "states": {
    "teams": "[[\\"Engineering\\",45],[\\"Sales\\",20],[\\"Marketing\\",15],[\\"Support\\",10],[\\"Ops\\",6],[\\"Legal\\",4]]"
  },
  "animation": [
    {
      "step": "均等に分ける",
      "duration": 1.8,
      "focus": ["Engineering"],
      "set": {
        "teams": "[[\\"Engineering\\",19],[\\"Sales\\",18],[\\"Marketing\\",17],[\\"Support\\",16],[\\"Ops\\",15],[\\"Legal\\",14]]"
      },
      "body": "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。"
    },
    {
      "step": "1 つに寄る",
      "duration": 1.8,
      "focus": ["Engineering", "Sales", "Marketing"],
      "set": {
        "teams": "[[\\"Engineering\\",45],[\\"Sales\\",20],[\\"Marketing\\",15],[\\"Support\\",10],[\\"Ops\\",6],[\\"Legal\\",4]]"
      },
      "body": "1 つに配分が寄る。 大きな区画が場所を占める。"
    },
    {
      "step": "分け直す",
      "duration": 1.8,
      "focus": ["Engineering", "Sales", "Marketing", "Support", "Ops", "Legal"],
      "set": {
        "teams": "[[\\"Engineering\\",30],[\\"Sales\\",28],[\\"Marketing\\",18],[\\"Support\\",12],[\\"Ops\\",8],[\\"Legal\\",4]]"
      },
      "body": "配分を組み替える。 区画の大小と位置が同時に変わる。"
    }
  ]
}`;

export const sourceYaml__trafficSankey = `title: "流入 3 経路が 1 つの成果に合流する"
type: flow

readouts:
  s: { kind: sankey, source: "flows", viewW: 340, viewH: 220, label: "Sources → Pages (sankey)" }

lanes:
  src: { x: 0, width: 180 }
  land: { x: 260, width: 180 }
  cv: { x: 520, width: 180 }

states:
  flows: '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]'

actors:
  - Search: { kind: card, lane: src, stack: 0, subtitle: "検索からの流入" }
  - Social: { kind: card, lane: src, stack: 1, subtitle: "SNS からの流入" }
  - Direct: { kind: card, lane: src, stack: 2, subtitle: "直接の流入" }
  - Home: { kind: card, lane: land, stack: 0, subtitle: "入口ページ" }
  - Product: { kind: card, lane: land, stack: 1, subtitle: "商品ページ" }
  - Checkout: { kind: card, lane: cv, stack: 0, subtitle: "成果ページ" }

flow:
  - Search -> Home: "40" (success)
  - Search -> Product: "30" (success) { labelOffsetX: 90 }
  - Social -> Home: "25" (info)
  - Social -> Product: "15" (info)
  - Direct -> Home: "20" (accent)
  - Direct -> Product: "10" (accent)
  - Home -> Checkout: "85" (warning)
  - Product -> Checkout: "55" (warning)

animation:
  - step: "1 経路" 1.8s
    focus: ["Search", "Home"]
    set:
      flows: '[["Search","Home",40]]'
    description: "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。"
  - step: "枝分かれ" 1.8s
    focus: ["Search", "Social", "Home", "Product"]
    set:
      flows: '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15]]'
    description: "流入元が増え、行き先も分かれる。 帯が交差する。"
  - step: "流入元が増える" 1.8s
    focus: ["Search", "Social", "Direct", "Home", "Product", "Checkout"]
    set:
      flows: '[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]'
    description: "3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。"
`;

export const sourceJson__trafficSankey = `{
  "title": "流入 3 経路が 1 つの成果に合流する",
  "type": "flow",
  "readouts": [
    {
      "id": "s",
      "kind": "sankey",
      "source": "flows",
      "viewW": 340,
      "viewH": 220,
      "label": "Sources → Pages (sankey)"
    }
  ],
  "lanes": {
    "src": { "x": 0, "width": 180 },
    "land": { "x": 260, "width": 180 },
    "cv": { "x": 520, "width": 180 }
  },
  "actors": [
    { "name": "Search", "kind": "card", "lane": "src", "stack": 0, "subtitle": "検索からの流入" },
    { "name": "Social", "kind": "card", "lane": "src", "stack": 1, "subtitle": "SNS からの流入" },
    { "name": "Direct", "kind": "card", "lane": "src", "stack": 2, "subtitle": "直接の流入" },
    { "name": "Home", "kind": "card", "lane": "land", "stack": 0, "subtitle": "入口ページ" },
    { "name": "Product", "kind": "card", "lane": "land", "stack": 1, "subtitle": "商品ページ" },
    { "name": "Checkout", "kind": "card", "lane": "cv", "stack": 0, "subtitle": "成果ページ" }
  ],
  "flow": [
    { "from": "Search", "to": "Home", "label": "40", "tone": "success" },
    { "from": "Search", "to": "Product", "label": "30", "tone": "success", "labelOffsetX": 90 },
    { "from": "Social", "to": "Home", "label": "25", "tone": "info" },
    { "from": "Social", "to": "Product", "label": "15", "tone": "info" },
    { "from": "Direct", "to": "Home", "label": "20", "tone": "accent" },
    { "from": "Direct", "to": "Product", "label": "10", "tone": "accent" },
    { "from": "Home", "to": "Checkout", "label": "85", "tone": "warning" },
    { "from": "Product", "to": "Checkout", "label": "55", "tone": "warning" }
  ],
  "states": {
    "flows": "[[\\"Search\\",\\"Home\\",40],[\\"Search\\",\\"Product\\",30],[\\"Social\\",\\"Home\\",25],[\\"Social\\",\\"Product\\",15],[\\"Direct\\",\\"Home\\",20],[\\"Direct\\",\\"Product\\",10]]"
  },
  "animation": [
    {
      "step": "1 経路",
      "duration": 1.8,
      "focus": ["Search", "Home"],
      "set": { "flows": "[[\\"Search\\",\\"Home\\",40]]" },
      "body": "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。"
    },
    {
      "step": "枝分かれ",
      "duration": 1.8,
      "focus": ["Search", "Social", "Home", "Product"],
      "set": {
        "flows": "[[\\"Search\\",\\"Home\\",40],[\\"Search\\",\\"Product\\",30],[\\"Social\\",\\"Home\\",25],[\\"Social\\",\\"Product\\",15]]"
      },
      "body": "流入元が増え、行き先も分かれる。 帯が交差する。"
    },
    {
      "step": "流入元が増える",
      "duration": 1.8,
      "focus": ["Search", "Social", "Direct", "Home", "Product", "Checkout"],
      "set": {
        "flows": "[[\\"Search\\",\\"Home\\",40],[\\"Search\\",\\"Product\\",30],[\\"Social\\",\\"Home\\",25],[\\"Social\\",\\"Product\\",15],[\\"Direct\\",\\"Home\\",20],[\\"Direct\\",\\"Product\\",10]]"
      },
      "body": "3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。"
    }
  ]
}`;

export const sourceYaml__activityPolar = `title: "1 週間の活動を平日 / 週末に分ける"
type: flow

readouts:
  p: { kind: polar-area, source: "hours", max: 10, viewW: 220, viewH: 220, labelSource: "days", label: "Hours (polar sectors)" }

lanes:
  weekday: { x: 0, width: 300 }
  weekend: { x: 380, width: 220 }

states:
  hours: "[3,5,8,6,7,4,2]"
  days: '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'

actors:
  - Mon: { kind: card, lane: weekday, stack: 0, subtitle: "{hours[0]}h" }
  - Tue: { kind: card, lane: weekday, stack: 1, subtitle: "{hours[1]}h" }
  - Wed: { kind: card, lane: weekday, stack: 2, subtitle: "{hours[2]}h" }
  - Thu: { kind: card, lane: weekday, stack: 3, subtitle: "{hours[3]}h" }
  - Fri: { kind: card, lane: weekday, stack: 4, subtitle: "{hours[4]}h" }
  - Sat: { kind: card, lane: weekend, stack: 0, subtitle: "{hours[5]}h" }
  - Sun: { kind: card, lane: weekend, stack: 1, subtitle: "{hours[6]}h" }

animation:
  - step: "平日だけ" 1.8s
    focus: ["Mon", "Tue"]
    set:
      hours: "[6,7,8,6,7,0,0]"
    description: "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。"
  - step: "週末も入る" 1.8s
    focus: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    set:
      hours: "[3,5,8,6,7,4,2]"
    description: "週末にも時間が入る。 扇形が一周に広がる。"
  - step: "差を均す" 1.8s
    focus: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    set:
      hours: "[5,5,6,5,6,4,4]"
    description: "曜日ごとの差が縮まる。 扇形の長さが揃う。"
`;

export const sourceJson__activityPolar = `{
  "title": "1 週間の活動を平日 / 週末に分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "p",
      "kind": "polar-area",
      "source": "hours",
      "max": 10,
      "viewW": 220,
      "viewH": 220,
      "labelSource": "days",
      "label": "Hours (polar sectors)"
    }
  ],
  "lanes": {
    "weekday": { "x": 0, "width": 300 },
    "weekend": { "x": 380, "width": 220 }
  },
  "actors": [
    { "name": "Mon", "kind": "card", "lane": "weekday", "stack": 0, "subtitle": "{hours[0]}h" },
    { "name": "Tue", "kind": "card", "lane": "weekday", "stack": 1, "subtitle": "{hours[1]}h" },
    { "name": "Wed", "kind": "card", "lane": "weekday", "stack": 2, "subtitle": "{hours[2]}h" },
    { "name": "Thu", "kind": "card", "lane": "weekday", "stack": 3, "subtitle": "{hours[3]}h" },
    { "name": "Fri", "kind": "card", "lane": "weekday", "stack": 4, "subtitle": "{hours[4]}h" },
    { "name": "Sat", "kind": "card", "lane": "weekend", "stack": 0, "subtitle": "{hours[5]}h" },
    { "name": "Sun", "kind": "card", "lane": "weekend", "stack": 1, "subtitle": "{hours[6]}h" }
  ],
  "flow": [],
  "states": {
    "hours": "[3,5,8,6,7,4,2]",
    "days": "[\\"Mon\\",\\"Tue\\",\\"Wed\\",\\"Thu\\",\\"Fri\\",\\"Sat\\",\\"Sun\\"]"
  },
  "animation": [
    {
      "step": "平日だけ",
      "duration": 1.8,
      "focus": ["Mon", "Tue"],
      "set": { "hours": "[6,7,8,6,7,0,0]" },
      "body": "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。"
    },
    {
      "step": "週末も入る",
      "duration": 1.8,
      "focus": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "set": { "hours": "[3,5,8,6,7,4,2]" },
      "body": "週末にも時間が入る。 扇形が一周に広がる。"
    },
    {
      "step": "差を均す",
      "duration": 1.8,
      "focus": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "set": { "hours": "[5,5,6,5,6,4,4]" },
      "body": "曜日ごとの差が縮まる。 扇形の長さが揃う。"
    }
  ]
}`;

export const sourceYaml__playerLeaderboard = `title: "6 人の順位を上位 / 中位 / 下位に分ける"
type: flow

readouts:
  lb: { kind: leaderboard, source: "players", max: 5, color: "#2563eb", label: "Ranking (top 5 leaderboard)" }

lanes:
  top: { x: 0, width: 260 }
  middle: { x: 300, width: 220 }
  bottom: { x: 540, width: 200 }

states:
  players: '[["Alice",920],["Bob",780],["Carol",850],["Dan",680],["Eve",890],["Frank",720]]'

actors:
  - 🥇 1st Alice: { kind: card, lane: top, stack: 0, subtitle: "首位" }
  - 🥈 2nd Eve: { kind: card, lane: top, stack: 1, subtitle: "2 位" }
  - 🥉 3rd Carol: { kind: card, lane: top, stack: 2, subtitle: "3 位" }
  - 4th Bob: { kind: card, lane: middle, stack: 0, subtitle: "中位" }
  - 5th Frank: { kind: card, lane: middle, stack: 1, subtitle: "表示の末尾" }
  - 6th Dan: { kind: card, lane: bottom, stack: 0, subtitle: "圏外" }

animation:
  - step: "接戦の状態" 1.8s
    focus: ["🥇 1st Alice"]
    set:
      players: '[["Alice",920],["Bob",915],["Carol",910],["Dan",905],["Eve",900]]'
    description: "上位の点差が小さい状態。 並びが僅差で決まる。"
  - step: "差が開く" 1.8s
    focus: ["🥇 1st Alice", "🥈 2nd Eve"]
    set:
      players: '[["Alice",1180],["Eve",890],["Carol",850],["Bob",780],["Frank",720]]'
    description: "首位が抜ける。 上位と下位の点差が大きくなる。"
  - step: "順位が入れ替わる" 1.8s
    focus: ["🥇 1st Alice", "🥈 2nd Eve", "🥉 3rd Carol", "4th Bob", "5th Frank", "6th Dan"]
    set:
      players: '[["Carol",1240],["Alice",1180],["Frank",1050],["Eve",890],["Bob",780],["Dan",680]]'
    description: "別の人が首位に立つ。 並びが上下ごと組み替わる。"
`;

export const sourceJson__playerLeaderboard = `{
  "title": "6 人の順位を上位 / 中位 / 下位に分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "lb",
      "kind": "leaderboard",
      "source": "players",
      "max": 5,
      "color": "#2563eb",
      "label": "Ranking (top 5 leaderboard)"
    }
  ],
  "lanes": {
    "top": { "x": 0, "width": 260 },
    "middle": { "x": 300, "width": 220 },
    "bottom": { "x": 540, "width": 200 }
  },
  "actors": [
    { "name": "🥇 1st Alice", "kind": "card", "lane": "top", "stack": 0, "subtitle": "首位" },
    { "name": "🥈 2nd Eve", "kind": "card", "lane": "top", "stack": 1, "subtitle": "2 位" },
    { "name": "🥉 3rd Carol", "kind": "card", "lane": "top", "stack": 2, "subtitle": "3 位" },
    { "name": "4th Bob", "kind": "card", "lane": "middle", "stack": 0, "subtitle": "中位" },
    { "name": "5th Frank", "kind": "card", "lane": "middle", "stack": 1, "subtitle": "表示の末尾" },
    { "name": "6th Dan", "kind": "card", "lane": "bottom", "stack": 0, "subtitle": "圏外" }
  ],
  "flow": [],
  "states": {
    "players": "[[\\"Alice\\",920],[\\"Bob\\",780],[\\"Carol\\",850],[\\"Dan\\",680],[\\"Eve\\",890],[\\"Frank\\",720]]"
  },
  "animation": [
    {
      "step": "接戦の状態",
      "duration": 1.8,
      "focus": ["🥇 1st Alice"],
      "set": {
        "players": "[[\\"Alice\\",920],[\\"Bob\\",915],[\\"Carol\\",910],[\\"Dan\\",905],[\\"Eve\\",900]]"
      },
      "body": "上位の点差が小さい状態。 並びが僅差で決まる。"
    },
    {
      "step": "差が開く",
      "duration": 1.8,
      "focus": ["🥇 1st Alice", "🥈 2nd Eve"],
      "set": {
        "players": "[[\\"Alice\\",1180],[\\"Eve\\",890],[\\"Carol\\",850],[\\"Bob\\",780],[\\"Frank\\",720]]"
      },
      "body": "首位が抜ける。 上位と下位の点差が大きくなる。"
    },
    {
      "step": "順位が入れ替わる",
      "duration": 1.8,
      "focus": ["🥇 1st Alice", "🥈 2nd Eve", "🥉 3rd Carol", "4th Bob", "5th Frank", "6th Dan"],
      "set": {
        "players": "[[\\"Carol\\",1240],[\\"Alice\\",1180],[\\"Frank\\",1050],[\\"Eve\\",890],[\\"Bob\\",780],[\\"Dan\\",680]]"
      },
      "body": "別の人が首位に立つ。 並びが上下ごと組み替わる。"
    }
  ]
}`;

export const sourceYaml__techTagCloud = `title: "8 技術を使用量の大小で分けて見せる"
type: flow

readouts:
  tc: { kind: tag-cloud, source: "tags", minSize: 12, maxSize: 32, label: "Tech cloud (font-size 比例)" }

lanes:
  high: { x: 0, width: 220 }
  mid: { x: 260, width: 220 }
  low: { x: 520, width: 220 }

states:
  tags: '[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]'

actors:
  - React: { kind: card, lane: high, stack: 0, subtitle: "最も大きい語" }
  - TypeScript: { kind: card, lane: high, stack: 1, subtitle: "大きい語" }
  - Python: { kind: card, lane: high, stack: 2, subtitle: "やや大きい語" }
  - Rust: { kind: card, lane: mid, stack: 0, subtitle: "中位の語" }
  - Go: { kind: card, lane: mid, stack: 1, subtitle: "やや小さい語" }
  - Svelte: { kind: card, lane: mid, stack: 2, subtitle: "小さい語" }
  - Vue: { kind: card, lane: low, stack: 0, subtitle: "より小さい語" }
  - Deno: { kind: card, lane: low, stack: 1, subtitle: "最も小さい語" }

animation:
  - step: "少ない語" 1.8s
    focus: ["React"]
    set:
      tags: '[["React",30],["TypeScript",28],["Python",22]]'
    description: "語が 3 つだけの状態。 大きさの差が読み取りやすい。"
  - step: "語が増える" 1.8s
    focus: ["React", "TypeScript", "Python"]
    set:
      tags: '[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]'
    description: "語が 8 つに増える。 大小の幅が広がる。"
  - step: "重みの幅が広がる" 1.8s
    focus: ["React", "TypeScript", "Python", "Rust", "Go", "Svelte", "Vue", "Deno"]
    set:
      tags: '[["React",32],["TypeScript",29],["Python",24],["Rust",18],["Go",14],["Svelte",9],["Vue",6],["Deno",3]]'
    description: "大小の順はそのままで、上と下の差が開く。 文字の大きさの幅が最大まで使われる。"
`;

export const sourceJson__techTagCloud = `{
  "title": "8 技術を使用量の大小で分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "tc",
      "kind": "tag-cloud",
      "source": "tags",
      "minSize": 12,
      "maxSize": 32,
      "label": "Tech cloud (font-size 比例)"
    }
  ],
  "lanes": {
    "high": { "x": 0, "width": 220 },
    "mid": { "x": 260, "width": 220 },
    "low": { "x": 520, "width": 220 }
  },
  "actors": [
    { "name": "React", "kind": "card", "lane": "high", "stack": 0, "subtitle": "最も大きい語" },
    { "name": "TypeScript", "kind": "card", "lane": "high", "stack": 1, "subtitle": "大きい語" },
    { "name": "Python", "kind": "card", "lane": "high", "stack": 2, "subtitle": "やや大きい語" },
    { "name": "Rust", "kind": "card", "lane": "mid", "stack": 0, "subtitle": "中位の語" },
    { "name": "Go", "kind": "card", "lane": "mid", "stack": 1, "subtitle": "やや小さい語" },
    { "name": "Svelte", "kind": "card", "lane": "mid", "stack": 2, "subtitle": "小さい語" },
    { "name": "Vue", "kind": "card", "lane": "low", "stack": 0, "subtitle": "より小さい語" },
    { "name": "Deno", "kind": "card", "lane": "low", "stack": 1, "subtitle": "最も小さい語" }
  ],
  "flow": [],
  "states": {
    "tags": "[[\\"React\\",30],[\\"TypeScript\\",28],[\\"Python\\",22],[\\"Rust\\",18],[\\"Go\\",15],[\\"Svelte\\",10],[\\"Vue\\",8],[\\"Deno\\",5]]"
  },
  "animation": [
    {
      "step": "少ない語",
      "duration": 1.8,
      "focus": ["React"],
      "set": { "tags": "[[\\"React\\",30],[\\"TypeScript\\",28],[\\"Python\\",22]]" },
      "body": "語が 3 つだけの状態。 大きさの差が読み取りやすい。"
    },
    {
      "step": "語が増える",
      "duration": 1.8,
      "focus": ["React", "TypeScript", "Python"],
      "set": {
        "tags": "[[\\"React\\",30],[\\"TypeScript\\",28],[\\"Python\\",22],[\\"Rust\\",18],[\\"Go\\",15],[\\"Svelte\\",10],[\\"Vue\\",8],[\\"Deno\\",5]]"
      },
      "body": "語が 8 つに増える。 大小の幅が広がる。"
    },
    {
      "step": "重みの幅が広がる",
      "duration": 1.8,
      "focus": ["React", "TypeScript", "Python", "Rust", "Go", "Svelte", "Vue", "Deno"],
      "set": {
        "tags": "[[\\"React\\",32],[\\"TypeScript\\",29],[\\"Python\\",24],[\\"Rust\\",18],[\\"Go\\",14],[\\"Svelte\\",9],[\\"Vue\\",6],[\\"Deno\\",3]]"
      },
      "body": "大小の順はそのままで、上と下の差が開く。 文字の大きさの幅が最大まで使われる。"
    }
  ]
}`;

export const sourceYaml__teamActivityFeed = `title: "チームの動きを新しい順に 5 件並べる"
type: flow

readouts:
  af: { kind: activity-feed, source: "events", max: 5, color: "#2563eb", label: "Recent (feed list)" }

lanes:
  col1: { x: 0, width: 350 }
  col2: { x: 390, width: 370 }
  col3: { x: 800, width: 320 }

states:
  events: '[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Dan","merged PR #38","1 h ago"],["Eve","deployed v1.2","3 h ago"]]'

actors:
  - Alice: { kind: card, lane: col1, stack: 0, subtitle: "最新の出来事", posW: 300 }
  - Bob: { kind: card, lane: col1, stack: 1, subtitle: "次に新しい出来事", posW: 290 }
  - Carol: { kind: card, lane: col2, stack: 0, subtitle: "中ほどの出来事", posW: 320 }
  - Dan: { kind: card, lane: col2, stack: 1, subtitle: "やや古い出来事", posW: 270 }
  - Eve: { kind: card, lane: col3, stack: 0, subtitle: "最も古い出来事", posW: 270 }

flow:
  - Alice -> Bob: "→" (info)
  - Bob -> Carol: "→" (info)
  - Carol -> Dan: "→" (accent)
  - Dan -> Eve: "→" (accent)

animation:
  - step: "1 件だけ" 1.8s
    focus: ["Alice"]
    set:
      events: '[["Alice","pushed to main","2 min ago"]]'
    description: "出来事が 1 件だけある状態。 一覧の先頭に入る。"
  - step: "積み上がる" 1.8s
    focus: ["Alice", "Bob", "Carol"]
    set:
      events: '[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"]]'
    description: "出来事が増えて一覧が伸びる。 新しいものが上に来る。"
  - step: "押し出される" 1.8s
    focus: ["Alice", "Bob", "Carol", "Dan", "Eve"]
    set:
      events: '[["Dan","released v2.0","1 min ago"],["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Eve","merged PR #38","1 h ago"]]'
    description: "件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。"
`;

export const sourceJson__teamActivityFeed = `{
  "title": "チームの動きを新しい順に 5 件並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "af",
      "kind": "activity-feed",
      "source": "events",
      "max": 5,
      "color": "#2563eb",
      "label": "Recent (feed list)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 350 },
    "col2": { "x": 390, "width": 370 },
    "col3": { "x": 800, "width": 320 }
  },
  "actors": [
    {
      "name": "Alice",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最新の出来事",
      "posW": 300
    },
    {
      "name": "Bob",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "次に新しい出来事",
      "posW": 290
    },
    {
      "name": "Carol",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "中ほどの出来事",
      "posW": 320
    },
    {
      "name": "Dan",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "やや古い出来事",
      "posW": 270
    },
    {
      "name": "Eve",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "最も古い出来事",
      "posW": 270
    }
  ],
  "flow": [
    { "from": "Alice", "to": "Bob", "label": "→", "tone": "info" },
    { "from": "Bob", "to": "Carol", "label": "→", "tone": "info" },
    { "from": "Carol", "to": "Dan", "label": "→", "tone": "accent" },
    { "from": "Dan", "to": "Eve", "label": "→", "tone": "accent" }
  ],
  "states": {
    "events": "[[\\"Alice\\",\\"pushed to main\\",\\"2 min ago\\"],[\\"Bob\\",\\"opened PR #42\\",\\"8 min ago\\"],[\\"Carol\\",\\"reviewed PR #40\\",\\"15 min ago\\"],[\\"Dan\\",\\"merged PR #38\\",\\"1 h ago\\"],[\\"Eve\\",\\"deployed v1.2\\",\\"3 h ago\\"]]"
  },
  "animation": [
    {
      "step": "1 件だけ",
      "duration": 1.8,
      "focus": ["Alice"],
      "set": { "events": "[[\\"Alice\\",\\"pushed to main\\",\\"2 min ago\\"]]" },
      "body": "出来事が 1 件だけある状態。 一覧の先頭に入る。"
    },
    {
      "step": "積み上がる",
      "duration": 1.8,
      "focus": ["Alice", "Bob", "Carol"],
      "set": {
        "events": "[[\\"Alice\\",\\"pushed to main\\",\\"2 min ago\\"],[\\"Bob\\",\\"opened PR #42\\",\\"8 min ago\\"],[\\"Carol\\",\\"reviewed PR #40\\",\\"15 min ago\\"]]"
      },
      "body": "出来事が増えて一覧が伸びる。 新しいものが上に来る。"
    },
    {
      "step": "押し出される",
      "duration": 1.8,
      "focus": ["Alice", "Bob", "Carol", "Dan", "Eve"],
      "set": {
        "events": "[[\\"Dan\\",\\"released v2.0\\",\\"1 min ago\\"],[\\"Alice\\",\\"pushed to main\\",\\"2 min ago\\"],[\\"Bob\\",\\"opened PR #42\\",\\"8 min ago\\"],[\\"Carol\\",\\"reviewed PR #40\\",\\"15 min ago\\"],[\\"Eve\\",\\"merged PR #38\\",\\"1 h ago\\"]]"
      },
      "body": "件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。"
    }
  ]
}`;

export const sourceYaml__sprintChecklist = `title: "6 タスクを完了 / 未完了で分ける"
type: flow

readouts:
  cl: { kind: checklist, source: "tasks", color: "#22c55e", label: "Progress (2/6 = 33%)" }

lanes:
  done: { x: 0, width: 240 }
  todo: { x: 300, width: 240 }

states:
  tasks: '[["Setup CI",true],["Write tests",true],["Fix bug #42",false],["Code review",false],["Deploy staging",false],["Post-mortem",false]]'

actors:
  - ✓ Setup CI: { kind: card, lane: done, stack: 0, subtitle: "done" }
  - ✓ Tests: { kind: card, lane: done, stack: 1, subtitle: "done" }
  - Fix bug #42: { kind: card, lane: todo, stack: 0, subtitle: "todo (blocker)" }
  - Code review: { kind: card, lane: todo, stack: 1, subtitle: "todo (awaits reviewer)" }
  - Deploy: { kind: card, lane: todo, stack: 2, subtitle: "todo (depends on review)" }
  - Post-mortem: { kind: card, lane: todo, stack: 3, subtitle: "todo (last)" }

animation:
  - step: "着手前" 1.8s
    focus: ["✓ Setup CI"]
    set:
      tasks: '[["Setup CI",false],["Write tests",false],["Fix bug #42",false],["Code review",false],["Deploy",false],["Retro",false]]'
    description: "どれも未完了の状態。 印が 1 つも付いていない。"
  - step: "半分進む" 1.8s
    focus: ["✓ Setup CI", "✓ Tests", "Fix bug #42"]
    set:
      tasks: '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",false],["Deploy",false],["Retro",false]]'
    description: "前半が終わる。 印の付いた項目が上に集まる。"
  - step: "残り 1 件" 1.8s
    focus: ["✓ Setup CI", "✓ Tests", "Fix bug #42", "Code review", "Deploy", "Post-mortem"]
    set:
      tasks: '[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",true],["Deploy",true],["Retro",false]]'
    description: "最後の 1 件を残して終わる。 未完了がどれか一目で分かる。"
`;

export const sourceJson__sprintChecklist = `{
  "title": "6 タスクを完了 / 未完了で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "cl",
      "kind": "checklist",
      "source": "tasks",
      "color": "#22c55e",
      "label": "Progress (2/6 = 33%)"
    }
  ],
  "lanes": {
    "done": { "x": 0, "width": 240 },
    "todo": { "x": 300, "width": 240 }
  },
  "actors": [
    { "name": "✓ Setup CI", "kind": "card", "lane": "done", "stack": 0, "subtitle": "done" },
    { "name": "✓ Tests", "kind": "card", "lane": "done", "stack": 1, "subtitle": "done" },
    {
      "name": "Fix bug #42",
      "kind": "card",
      "lane": "todo",
      "stack": 0,
      "subtitle": "todo (blocker)"
    },
    {
      "name": "Code review",
      "kind": "card",
      "lane": "todo",
      "stack": 1,
      "subtitle": "todo (awaits reviewer)"
    },
    {
      "name": "Deploy",
      "kind": "card",
      "lane": "todo",
      "stack": 2,
      "subtitle": "todo (depends on review)"
    },
    {
      "name": "Post-mortem",
      "kind": "card",
      "lane": "todo",
      "stack": 3,
      "subtitle": "todo (last)"
    }
  ],
  "flow": [],
  "states": {
    "tasks": "[[\\"Setup CI\\",true],[\\"Write tests\\",true],[\\"Fix bug #42\\",false],[\\"Code review\\",false],[\\"Deploy staging\\",false],[\\"Post-mortem\\",false]]"
  },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["✓ Setup CI"],
      "set": {
        "tasks": "[[\\"Setup CI\\",false],[\\"Write tests\\",false],[\\"Fix bug #42\\",false],[\\"Code review\\",false],[\\"Deploy\\",false],[\\"Retro\\",false]]"
      },
      "body": "どれも未完了の状態。 印が 1 つも付いていない。"
    },
    {
      "step": "半分進む",
      "duration": 1.8,
      "focus": ["✓ Setup CI", "✓ Tests", "Fix bug #42"],
      "set": {
        "tasks": "[[\\"Setup CI\\",true],[\\"Write tests\\",true],[\\"Fix bug #42\\",true],[\\"Code review\\",false],[\\"Deploy\\",false],[\\"Retro\\",false]]"
      },
      "body": "前半が終わる。 印の付いた項目が上に集まる。"
    },
    {
      "step": "残り 1 件",
      "duration": 1.8,
      "focus": ["✓ Setup CI", "✓ Tests", "Fix bug #42", "Code review", "Deploy", "Post-mortem"],
      "set": {
        "tasks": "[[\\"Setup CI\\",true],[\\"Write tests\\",true],[\\"Fix bug #42\\",true],[\\"Code review\\",true],[\\"Deploy\\",true],[\\"Retro\\",false]]"
      },
      "body": "最後の 1 件を残して終わる。 未完了がどれか一目で分かる。"
    }
  ]
}`;

export const sourceYaml__postReactions = `title: "投稿への 4 種の反応を並べる"
type: flow

readouts:
  rb: { kind: reaction-bar, source: "reactions", color: "#2563eb", label: "Reactions (pill list)" }

lanes:
  thumb: { x: 0, width: 360 }
  heart: { x: 380, width: 270 }
  laugh: { x: 670, width: 270 }
  party: { x: 960, width: 270 }

states:
  reactions: '[["👍",24],["❤️",12],["😂",8],["🎉",5]]'

actors:
  - 👍 Thumbs up: { kind: card, lane: thumb, stack: 0, subtitle: "最も多く付く反応", posW: 310 }
  - ❤️ Heart2: { kind: card, lane: heart, stack: 0, subtitle: "次に多い反応", posW: 220, title: "❤️ Heart" }
  - 😂 Laugh2: { kind: card, lane: laugh, stack: 0, subtitle: "中ほどの反応", posW: 220, title: "😂 Laugh" }
  - 🎉 Party2: { kind: card, lane: party, stack: 0, subtitle: "最も少ない反応", posW: 220, title: "🎉 Party" }

animation:
  - step: "投稿した直後" 1.8s
    focus: ["👍 Thumbs up"]
    set:
      reactions: '[["👍",5],["❤️",3],["😂",2],["🎉",1]]'
    description: "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。"
  - step: "広まる" 1.8s
    focus: ["👍 Thumbs up", "❤️ Heart2"]
    set:
      reactions: '[["👍",14],["❤️",7],["😂",4],["🎉",2]]'
    description: "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。"
  - step: "落ち着く" 1.8s
    focus: ["👍 Thumbs up", "❤️ Heart2", "😂 Laugh2", "🎉 Party2"]
    set:
      reactions: '[["👍",24],["❤️",12],["😂",8],["🎉",5]]'
    description: "伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。"
`;

export const sourceJson__postReactions = `{
  "title": "投稿への 4 種の反応を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "rb",
      "kind": "reaction-bar",
      "source": "reactions",
      "color": "#2563eb",
      "label": "Reactions (pill list)"
    }
  ],
  "lanes": {
    "thumb": { "x": 0, "width": 360 },
    "heart": { "x": 380, "width": 270 },
    "laugh": { "x": 670, "width": 270 },
    "party": { "x": 960, "width": 270 }
  },
  "actors": [
    {
      "name": "👍 Thumbs up",
      "kind": "card",
      "lane": "thumb",
      "stack": 0,
      "subtitle": "最も多く付く反応",
      "posW": 310
    },
    {
      "name": "❤️ Heart2",
      "kind": "card",
      "lane": "heart",
      "stack": 0,
      "subtitle": "次に多い反応",
      "posW": 220,
      "title": "❤️ Heart"
    },
    {
      "name": "😂 Laugh2",
      "kind": "card",
      "lane": "laugh",
      "stack": 0,
      "subtitle": "中ほどの反応",
      "posW": 220,
      "title": "😂 Laugh"
    },
    {
      "name": "🎉 Party2",
      "kind": "card",
      "lane": "party",
      "stack": 0,
      "subtitle": "最も少ない反応",
      "posW": 220,
      "title": "🎉 Party"
    }
  ],
  "flow": [],
  "states": { "reactions": "[[\\"👍\\",24],[\\"❤️\\",12],[\\"😂\\",8],[\\"🎉\\",5]]" },
  "animation": [
    {
      "step": "投稿した直後",
      "duration": 1.8,
      "focus": ["👍 Thumbs up"],
      "set": { "reactions": "[[\\"👍\\",5],[\\"❤️\\",3],[\\"😂\\",2],[\\"🎉\\",1]]" },
      "body": "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。"
    },
    {
      "step": "広まる",
      "duration": 1.8,
      "focus": ["👍 Thumbs up", "❤️ Heart2"],
      "set": { "reactions": "[[\\"👍\\",14],[\\"❤️\\",7],[\\"😂\\",4],[\\"🎉\\",2]]" },
      "body": "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["👍 Thumbs up", "❤️ Heart2", "😂 Laugh2", "🎉 Party2"],
      "set": { "reactions": "[[\\"👍\\",24],[\\"❤️\\",12],[\\"😂\\",8],[\\"🎉\\",5]]" },
      "body": "伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。"
    }
  ]
}`;

export const sourceYaml__techPills = `title: "技術 5 つを画面 / 基盤 / 構築で分ける"
type: flow

readouts:
  pg: { kind: pill-group, source: "stack", label: "Stack (pill group)" }

lanes:
  frontend: { x: 0, width: 220 }
  systems: { x: 260, width: 200 }
  build: { x: 480, width: 220 }

states:
  stack: '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]'

actors:
  - React: { kind: card, lane: frontend, stack: 0, subtitle: "画面を組み立てる部品" }
  - TypeScript: { kind: card, lane: frontend, stack: 1, subtitle: "型の付いた書き方" }
  - Rust: { kind: card, lane: systems, stack: 0, subtitle: "土台を書く言語" }
  - Vite: { kind: card, lane: build, stack: 0, subtitle: "開発中の配信役" }
  - Bun: { kind: card, lane: build, stack: 1, subtitle: "実行の土台" }

animation:
  - step: "画面から始める" 1.8s
    focus: ["React", "TypeScript"]
    set:
      stack: '[["React","#61dafb"],["TypeScript","#3178c6"]]'
    description: "画面周りの 2 つだけを使う。 札はその 2 色しか出ず、横の並びが短い。"
  - step: "土台を足す" 1.8s
    focus: ["React", "TypeScript", "Rust"]
    set:
      stack: '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"]]'
    description: "土台を書く言語が加わる。 札が 1 つ増え、系統の違う色が並びに混じる。"
  - step: "組み立てまで揃う" 1.8s
    focus: ["React", "TypeScript", "Rust", "Vite", "Bun"]
    set:
      stack: '[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]'
    description: "組み立てと実行の土台が揃う。 札は 5 枚になり、色が札ごとに違うことが読み取れる。"
`;

export const sourceJson__techPills = `{
  "title": "技術 5 つを画面 / 基盤 / 構築で分ける",
  "type": "flow",
  "readouts": [
    { "id": "pg", "kind": "pill-group", "source": "stack", "label": "Stack (pill group)" }
  ],
  "lanes": {
    "frontend": { "x": 0, "width": 220 },
    "systems": { "x": 260, "width": 200 },
    "build": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "React",
      "kind": "card",
      "lane": "frontend",
      "stack": 0,
      "subtitle": "画面を組み立てる部品"
    },
    {
      "name": "TypeScript",
      "kind": "card",
      "lane": "frontend",
      "stack": 1,
      "subtitle": "型の付いた書き方"
    },
    { "name": "Rust", "kind": "card", "lane": "systems", "stack": 0, "subtitle": "土台を書く言語" },
    { "name": "Vite", "kind": "card", "lane": "build", "stack": 0, "subtitle": "開発中の配信役" },
    { "name": "Bun", "kind": "card", "lane": "build", "stack": 1, "subtitle": "実行の土台" }
  ],
  "flow": [],
  "states": {
    "stack": "[[\\"React\\",\\"#61dafb\\"],[\\"TypeScript\\",\\"#3178c6\\"],[\\"Rust\\",\\"#dea584\\"],[\\"Vite\\",\\"#646cff\\"],[\\"Bun\\",\\"#000000\\"]]"
  },
  "animation": [
    {
      "step": "画面から始める",
      "duration": 1.8,
      "focus": ["React", "TypeScript"],
      "set": { "stack": "[[\\"React\\",\\"#61dafb\\"],[\\"TypeScript\\",\\"#3178c6\\"]]" },
      "body": "画面周りの 2 つだけを使う。 札はその 2 色しか出ず、横の並びが短い。"
    },
    {
      "step": "土台を足す",
      "duration": 1.8,
      "focus": ["React", "TypeScript", "Rust"],
      "set": {
        "stack": "[[\\"React\\",\\"#61dafb\\"],[\\"TypeScript\\",\\"#3178c6\\"],[\\"Rust\\",\\"#dea584\\"]]"
      },
      "body": "土台を書く言語が加わる。 札が 1 つ増え、系統の違う色が並びに混じる。"
    },
    {
      "step": "組み立てまで揃う",
      "duration": 1.8,
      "focus": ["React", "TypeScript", "Rust", "Vite", "Bun"],
      "set": {
        "stack": "[[\\"React\\",\\"#61dafb\\"],[\\"TypeScript\\",\\"#3178c6\\"],[\\"Rust\\",\\"#dea584\\"],[\\"Vite\\",\\"#646cff\\"],[\\"Bun\\",\\"#000000\\"]]"
      },
      "body": "組み立てと実行の土台が揃う。 札は 5 枚になり、色が札ごとに違うことが読み取れる。"
    }
  ]
}`;

export const sourceYaml__dashboardMetricsGrid = `title: "SaaS の 4 指標を並べて見せる"
type: flow

readouts:
  mg: { kind: metrics-grid, source: "kpis", color: "#2563eb", label: "Metrics (2×2 grid)" }

lanes:
  users: { x: 0, width: 270 }
  revenue: { x: 290, width: 250 }
  uptime: { x: 560, width: 230 }
  errors: { x: 810, width: 230 }

states:
  kpis: '[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]'

actors:
  - Users2: { kind: card, lane: users, stack: 0, subtitle: "月あたりの利用者", posW: 220, title: "Users" }
  - Revenue2: { kind: card, lane: revenue, stack: 0, subtitle: "月ごとの売上", posW: 200, title: "Revenue" }
  - Uptime2: { kind: card, lane: uptime, stack: 0, subtitle: "動き続けた割合", posW: 180, title: "Uptime" }
  - Errors2: { kind: card, lane: errors, stack: 0, subtitle: "異常の件数 (直近)", posW: 180, title: "Errors" }

animation:
  - step: "立ち上げ" 1.8s
    focus: ["Users2", "Errors2"]
    set:
      kpis: '[["Users","3.1k"],["Revenue","$9k"],["Uptime","98.2","%"],["Errors",47]]'
    description: "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。"
  - step: "伸びる" 1.8s
    focus: ["Users2", "Revenue2", "Errors2"]
    set:
      kpis: '[["Users","7.8k"],["Revenue","$26k"],["Uptime","99.4","%"],["Errors",23]]'
    description: "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。"
  - step: "落ち着く" 1.8s
    focus: ["Users2", "Revenue2", "Uptime2", "Errors2"]
    set:
      kpis: '[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]'
    description: "4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。"
`;

export const sourceJson__dashboardMetricsGrid = `{
  "title": "SaaS の 4 指標を並べて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "mg",
      "kind": "metrics-grid",
      "source": "kpis",
      "color": "#2563eb",
      "label": "Metrics (2×2 grid)"
    }
  ],
  "lanes": {
    "users": { "x": 0, "width": 270 },
    "revenue": { "x": 290, "width": 250 },
    "uptime": { "x": 560, "width": 230 },
    "errors": { "x": 810, "width": 230 }
  },
  "actors": [
    {
      "name": "Users2",
      "kind": "card",
      "lane": "users",
      "stack": 0,
      "subtitle": "月あたりの利用者",
      "posW": 220,
      "title": "Users"
    },
    {
      "name": "Revenue2",
      "kind": "card",
      "lane": "revenue",
      "stack": 0,
      "subtitle": "月ごとの売上",
      "posW": 200,
      "title": "Revenue"
    },
    {
      "name": "Uptime2",
      "kind": "card",
      "lane": "uptime",
      "stack": 0,
      "subtitle": "動き続けた割合",
      "posW": 180,
      "title": "Uptime"
    },
    {
      "name": "Errors2",
      "kind": "card",
      "lane": "errors",
      "stack": 0,
      "subtitle": "異常の件数 (直近)",
      "posW": 180,
      "title": "Errors"
    }
  ],
  "flow": [],
  "states": {
    "kpis": "[[\\"Users\\",\\"12.4k\\"],[\\"Revenue\\",\\"$45k\\"],[\\"Uptime\\",\\"99.9\\",\\"%\\"],[\\"Errors\\",12]]"
  },
  "animation": [
    {
      "step": "立ち上げ",
      "duration": 1.8,
      "focus": ["Users2", "Errors2"],
      "set": {
        "kpis": "[[\\"Users\\",\\"3.1k\\"],[\\"Revenue\\",\\"$9k\\"],[\\"Uptime\\",\\"98.2\\",\\"%\\"],[\\"Errors\\",47]]"
      },
      "body": "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。"
    },
    {
      "step": "伸びる",
      "duration": 1.8,
      "focus": ["Users2", "Revenue2", "Errors2"],
      "set": {
        "kpis": "[[\\"Users\\",\\"7.8k\\"],[\\"Revenue\\",\\"$26k\\"],[\\"Uptime\\",\\"99.4\\",\\"%\\"],[\\"Errors\\",23]]"
      },
      "body": "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["Users2", "Revenue2", "Uptime2", "Errors2"],
      "set": {
        "kpis": "[[\\"Users\\",\\"12.4k\\"],[\\"Revenue\\",\\"$45k\\"],[\\"Uptime\\",\\"99.9\\",\\"%\\"],[\\"Errors\\",12]]"
      },
      "body": "4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。"
    }
  ]
}`;

export const sourceYaml__kpiIconTile = `title: "3 つの指標をアイコン付きのタイルで並べる"
type: flow

readouts:
  it: { kind: icon-tile, source: "kpis", color: "#2563eb", label: "KPIs (icon tile)" }

lanes:
  growth: { x: 0, width: 220 }
  revenue: { x: 260, width: 220 }
  goals: { x: 520, width: 220 }

states:
  kpis: '[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]'

actors:
  - 📈 Growth2: { kind: card, lane: growth, stack: 0, subtitle: "前の月からの伸び", title: "📈 Growth" }
  - 💰 Revenue2: { kind: card, lane: revenue, stack: 0, subtitle: "月ごとの売上", title: "💰 Revenue" }
  - 🎯 Goals2: { kind: card, lane: goals, stack: 0, subtitle: "達成した目標の数", title: "🎯 Goals" }

animation:
  - step: "期の始め" 1.8s
    focus: ["📈 Growth2"]
    set:
      kpis: '[["📈","Growth","+2%"],["💰","Revenue","$18k"],["🎯","Goals","2/10"]]'
    description: "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。"
  - step: "期の半ば" 1.8s
    focus: ["📈 Growth2", "💰 Revenue2"]
    set:
      kpis: '[["📈","Growth","+9%"],["💰","Revenue","$33k"],["🎯","Goals","5/10"]]'
    description: "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。"
  - step: "期の終わり" 1.8s
    focus: ["📈 Growth2", "💰 Revenue2", "🎯 Goals2"]
    set:
      kpis: '[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]'
    description: "目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。"
`;

export const sourceJson__kpiIconTile = `{
  "title": "3 つの指標をアイコン付きのタイルで並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "it",
      "kind": "icon-tile",
      "source": "kpis",
      "color": "#2563eb",
      "label": "KPIs (icon tile)"
    }
  ],
  "lanes": {
    "growth": { "x": 0, "width": 220 },
    "revenue": { "x": 260, "width": 220 },
    "goals": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "📈 Growth2",
      "kind": "card",
      "lane": "growth",
      "stack": 0,
      "subtitle": "前の月からの伸び",
      "title": "📈 Growth"
    },
    {
      "name": "💰 Revenue2",
      "kind": "card",
      "lane": "revenue",
      "stack": 0,
      "subtitle": "月ごとの売上",
      "title": "💰 Revenue"
    },
    {
      "name": "🎯 Goals2",
      "kind": "card",
      "lane": "goals",
      "stack": 0,
      "subtitle": "達成した目標の数",
      "title": "🎯 Goals"
    }
  ],
  "flow": [],
  "states": {
    "kpis": "[[\\"📈\\",\\"Growth\\",\\"+15%\\"],[\\"💰\\",\\"Revenue\\",\\"$50k\\"],[\\"🎯\\",\\"Goals\\",\\"8/10\\"]]"
  },
  "animation": [
    {
      "step": "期の始め",
      "duration": 1.8,
      "focus": ["📈 Growth2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"Growth\\",\\"+2%\\"],[\\"💰\\",\\"Revenue\\",\\"$18k\\"],[\\"🎯\\",\\"Goals\\",\\"2/10\\"]]"
      },
      "body": "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。"
    },
    {
      "step": "期の半ば",
      "duration": 1.8,
      "focus": ["📈 Growth2", "💰 Revenue2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"Growth\\",\\"+9%\\"],[\\"💰\\",\\"Revenue\\",\\"$33k\\"],[\\"🎯\\",\\"Goals\\",\\"5/10\\"]]"
      },
      "body": "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。"
    },
    {
      "step": "期の終わり",
      "duration": 1.8,
      "focus": ["📈 Growth2", "💰 Revenue2", "🎯 Goals2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"Growth\\",\\"+15%\\"],[\\"💰\\",\\"Revenue\\",\\"$50k\\"],[\\"🎯\\",\\"Goals\\",\\"8/10\\"]]"
      },
      "body": "目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。"
    }
  ]
}`;

export const sourceYaml__cryptoWallet = `title: "保有 4 銘柄を値上がり / 値下がりで分ける"
type: flow

readouts:
  tl: { kind: token-list, source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "Portfolio (aggregate)" }

lanes:
  gainers: { x: 0, width: 220 }
  losers: { x: 300, width: 220 }

states:
  tokens: '[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]'

actors:
  - ₿ BTC: { kind: card, lane: gainers, stack: 0, subtitle: "上げ幅が中くらい" }
  - ◎ SOL: { kind: card, lane: gainers, stack: 1, subtitle: "上げ幅が最も大きい" }
  - Ξ ETH: { kind: card, lane: losers, stack: 0, subtitle: "下げ幅が大きい" }
  - Ð DOGE: { kind: card, lane: losers, stack: 1, subtitle: "下げ幅が小さい" }

animation:
  - step: "朝の値動き" 1.8s
    focus: ["₿ BTC", "Ξ ETH"]
    set:
      tokens: '[["₿","BTC","0.42",0.6],["Ξ","ETH","12.5",-0.4],["◎","SOL","245",1.1],["Ð","DOGE","8500",-0.3]]'
    description: "値動きがどれも小さい。 上げ下げの色は付くが、幅の差はまだ読み取りにくい。"
  - step: "昼の値動き" 1.8s
    focus: ["₿ BTC", "◎ SOL", "Ξ ETH"]
    set:
      tokens: '[["₿","BTC","0.42",2.7],["Ξ","ETH","12.5",-1.5],["◎","SOL","245",4.2],["Ð","DOGE","8500",-0.8]]'
    description: "値動きが広がる。 保有量は変わらず、増減の割合だけが動くことが読み取れる。"
  - step: "引けの値動き" 1.8s
    focus: ["₿ BTC", "◎ SOL", "Ξ ETH", "Ð DOGE"]
    set:
      tokens: '[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]'
    description: "上げ 2 銘柄と下げ 2 銘柄の差が最も開く。 緑と赤の対比で組の性格が分かれる。"
`;

export const sourceJson__cryptoWallet = `{
  "title": "保有 4 銘柄を値上がり / 値下がりで分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "tl",
      "kind": "token-list",
      "source": "tokens",
      "colorUp": "#22c55e",
      "colorDown": "#ef4444",
      "label": "Portfolio (aggregate)"
    }
  ],
  "lanes": {
    "gainers": { "x": 0, "width": 220 },
    "losers": { "x": 300, "width": 220 }
  },
  "actors": [
    { "name": "₿ BTC", "kind": "card", "lane": "gainers", "stack": 0, "subtitle": "上げ幅が中くらい" },
    { "name": "◎ SOL", "kind": "card", "lane": "gainers", "stack": 1, "subtitle": "上げ幅が最も大きい" },
    { "name": "Ξ ETH", "kind": "card", "lane": "losers", "stack": 0, "subtitle": "下げ幅が大きい" },
    { "name": "Ð DOGE", "kind": "card", "lane": "losers", "stack": 1, "subtitle": "下げ幅が小さい" }
  ],
  "flow": [],
  "states": {
    "tokens": "[[\\"₿\\",\\"BTC\\",\\"0.42\\",5.3],[\\"Ξ\\",\\"ETH\\",\\"12.5\\",-2.8],[\\"◎\\",\\"SOL\\",\\"245\\",8.1],[\\"Ð\\",\\"DOGE\\",\\"8500\\",-1.4]]"
  },
  "animation": [
    {
      "step": "朝の値動き",
      "duration": 1.8,
      "focus": ["₿ BTC", "Ξ ETH"],
      "set": {
        "tokens": "[[\\"₿\\",\\"BTC\\",\\"0.42\\",0.6],[\\"Ξ\\",\\"ETH\\",\\"12.5\\",-0.4],[\\"◎\\",\\"SOL\\",\\"245\\",1.1],[\\"Ð\\",\\"DOGE\\",\\"8500\\",-0.3]]"
      },
      "body": "値動きがどれも小さい。 上げ下げの色は付くが、幅の差はまだ読み取りにくい。"
    },
    {
      "step": "昼の値動き",
      "duration": 1.8,
      "focus": ["₿ BTC", "◎ SOL", "Ξ ETH"],
      "set": {
        "tokens": "[[\\"₿\\",\\"BTC\\",\\"0.42\\",2.7],[\\"Ξ\\",\\"ETH\\",\\"12.5\\",-1.5],[\\"◎\\",\\"SOL\\",\\"245\\",4.2],[\\"Ð\\",\\"DOGE\\",\\"8500\\",-0.8]]"
      },
      "body": "値動きが広がる。 保有量は変わらず、増減の割合だけが動くことが読み取れる。"
    },
    {
      "step": "引けの値動き",
      "duration": 1.8,
      "focus": ["₿ BTC", "◎ SOL", "Ξ ETH", "Ð DOGE"],
      "set": {
        "tokens": "[[\\"₿\\",\\"BTC\\",\\"0.42\\",5.3],[\\"Ξ\\",\\"ETH\\",\\"12.5\\",-2.8],[\\"◎\\",\\"SOL\\",\\"245\\",8.1],[\\"Ð\\",\\"DOGE\\",\\"8500\\",-1.4]]"
      },
      "body": "上げ 2 銘柄と下げ 2 銘柄の差が最も開く。 緑と赤の対比で組の性格が分かれる。"
    }
  ]
}`;

export const sourceYaml__worldMapPins = `title: "5 都市をアジア / 欧米に分けて見せる"
type: flow

readouts:
  mp: { kind: map-pin, source: "cities", xMin: 0, xMax: 120, yMin: 0, yMax: 80, viewW: 300, viewH: 200, color: "#2563eb", label: "World map (2D coord)" }

lanes:
  apac: { x: 0, width: 220 }
  amea: { x: 300, width: 220 }

states:
  cities: '[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]'

actors:
  - Tokyo: { kind: card, lane: apac, stack: 0, subtitle: "最初の拠点 (右寄り・やや下)" }
  - Sydney: { kind: card, lane: apac, stack: 1, subtitle: "最も下に出る点" }
  - NYC: { kind: card, lane: amea, stack: 0, subtitle: "最も左に出る点" }
  - Paris: { kind: card, lane: amea, stack: 1, subtitle: "最も上に出る点" }
  - Rio: { kind: card, lane: amea, stack: 2, subtitle: "左下に出る点" }

animation:
  - step: "拠点は 1 つ" 1.8s
    focus: ["Tokyo"]
    set:
      cities: '[["Tokyo",100,60]]'
    description: "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。"
  - step: "西へ広がる" 1.8s
    focus: ["Tokyo", "NYC", "Paris"]
    set:
      cities: '[["Tokyo",100,60],["NYC",30,40],["Paris",60,30]]'
    description: "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。"
  - step: "南半球まで" 1.8s
    focus: ["Tokyo", "Sydney", "NYC", "Paris", "Rio"]
    set:
      cities: '[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]'
    description: "下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。"
`;

export const sourceJson__worldMapPins = `{
  "title": "5 都市をアジア / 欧米に分けて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "mp",
      "kind": "map-pin",
      "source": "cities",
      "xMin": 0,
      "xMax": 120,
      "yMin": 0,
      "yMax": 80,
      "viewW": 300,
      "viewH": 200,
      "color": "#2563eb",
      "label": "World map (2D coord)"
    }
  ],
  "lanes": {
    "apac": { "x": 0, "width": 220 },
    "amea": { "x": 300, "width": 220 }
  },
  "actors": [
    {
      "name": "Tokyo",
      "kind": "card",
      "lane": "apac",
      "stack": 0,
      "subtitle": "最初の拠点 (右寄り・やや下)"
    },
    { "name": "Sydney", "kind": "card", "lane": "apac", "stack": 1, "subtitle": "最も下に出る点" },
    { "name": "NYC", "kind": "card", "lane": "amea", "stack": 0, "subtitle": "最も左に出る点" },
    { "name": "Paris", "kind": "card", "lane": "amea", "stack": 1, "subtitle": "最も上に出る点" },
    { "name": "Rio", "kind": "card", "lane": "amea", "stack": 2, "subtitle": "左下に出る点" }
  ],
  "flow": [],
  "states": {
    "cities": "[[\\"Tokyo\\",100,60],[\\"Paris\\",60,30],[\\"NYC\\",30,40],[\\"Sydney\\",105,75],[\\"Rio\\",40,65]]"
  },
  "animation": [
    {
      "step": "拠点は 1 つ",
      "duration": 1.8,
      "focus": ["Tokyo"],
      "set": { "cities": "[[\\"Tokyo\\",100,60]]" },
      "body": "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。"
    },
    {
      "step": "西へ広がる",
      "duration": 1.8,
      "focus": ["Tokyo", "NYC", "Paris"],
      "set": { "cities": "[[\\"Tokyo\\",100,60],[\\"NYC\\",30,40],[\\"Paris\\",60,30]]" },
      "body": "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。"
    },
    {
      "step": "南半球まで",
      "duration": 1.8,
      "focus": ["Tokyo", "Sydney", "NYC", "Paris", "Rio"],
      "set": {
        "cities": "[[\\"Tokyo\\",100,60],[\\"Paris\\",60,30],[\\"NYC\\",30,40],[\\"Sydney\\",105,75],[\\"Rio\\",40,65]]"
      },
      "body": "下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。"
    }
  ]
}`;

export const sourceYaml__tournamentPodium = `title: "表彰台を中央が 1 位になる並びで見せる"
type: flow

readouts:
  pod: { kind: podium, source: "winners", viewW: 280, viewH: 180, label: "Podium (3 縦 bar 表彰台)" }

lanes:
  silver: { x: 0, width: 200 }
  gold: { x: 220, width: 220 }
  bronze: { x: 460, width: 200 }

states:
  winners: '[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]'

actors:
  - 🥈 2nd Bob: { kind: card, lane: silver, stack: 0, subtitle: "銀 · 中央のすぐ左" }
  - 🥇 1st Alice: { kind: card, lane: gold, stack: 0, subtitle: "金 · 中央で最も高い" }
  - 🥉 3rd Carol: { kind: card, lane: bronze, stack: 0, subtitle: "銅 · 中央のすぐ右" }

animation:
  - step: "予選の点" 1.8s
    focus: ["🥇 1st Alice"]
    set:
      winners: '[["Alice","400 pts"],["Bob","380 pts"],["Carol","350 pts"]]'
    description: "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。"
  - step: "準決勝" 1.8s
    focus: ["🥇 1st Alice", "🥈 2nd Bob"]
    set:
      winners: '[["Alice","800 pts"],["Bob","700 pts"],["Carol","640 pts"]]'
    description: "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。"
  - step: "決勝の点" 1.8s
    focus: ["🥇 1st Alice", "🥈 2nd Bob", "🥉 3rd Carol"]
    set:
      winners: '[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]'
    description: "最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。"
`;

export const sourceJson__tournamentPodium = `{
  "title": "表彰台を中央が 1 位になる並びで見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "pod",
      "kind": "podium",
      "source": "winners",
      "viewW": 280,
      "viewH": 180,
      "label": "Podium (3 縦 bar 表彰台)"
    }
  ],
  "lanes": {
    "silver": { "x": 0, "width": 200 },
    "gold": { "x": 220, "width": 220 },
    "bronze": { "x": 460, "width": 200 }
  },
  "actors": [
    {
      "name": "🥈 2nd Bob",
      "kind": "card",
      "lane": "silver",
      "stack": 0,
      "subtitle": "銀 · 中央のすぐ左"
    },
    {
      "name": "🥇 1st Alice",
      "kind": "card",
      "lane": "gold",
      "stack": 0,
      "subtitle": "金 · 中央で最も高い"
    },
    {
      "name": "🥉 3rd Carol",
      "kind": "card",
      "lane": "bronze",
      "stack": 0,
      "subtitle": "銅 · 中央のすぐ右"
    }
  ],
  "flow": [],
  "states": { "winners": "[[\\"Alice\\",\\"1200 pts\\"],[\\"Bob\\",\\"1050 pts\\"],[\\"Carol\\",\\"980 pts\\"]]" },
  "animation": [
    {
      "step": "予選の点",
      "duration": 1.8,
      "focus": ["🥇 1st Alice"],
      "set": { "winners": "[[\\"Alice\\",\\"400 pts\\"],[\\"Bob\\",\\"380 pts\\"],[\\"Carol\\",\\"350 pts\\"]]" },
      "body": "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。"
    },
    {
      "step": "準決勝",
      "duration": 1.8,
      "focus": ["🥇 1st Alice", "🥈 2nd Bob"],
      "set": { "winners": "[[\\"Alice\\",\\"800 pts\\"],[\\"Bob\\",\\"700 pts\\"],[\\"Carol\\",\\"640 pts\\"]]" },
      "body": "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。"
    },
    {
      "step": "決勝の点",
      "duration": 1.8,
      "focus": ["🥇 1st Alice", "🥈 2nd Bob", "🥉 3rd Carol"],
      "set": { "winners": "[[\\"Alice\\",\\"1200 pts\\"],[\\"Bob\\",\\"1050 pts\\"],[\\"Carol\\",\\"980 pts\\"]]" },
      "body": "最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。"
    }
  ]
}`;

export const sourceYaml__featurePoll = `title: "投票結果を 1 位とその他に分ける"
type: flow

readouts:
  pb: { kind: poll-bar, source: "options", color: "#a08870", colorWinner: "#2563eb", label: "Results (aggregate)" }

lanes:
  winner: { x: 0, width: 220 }
  runners: { x: 300, width: 220 }

states:
  options: '[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]'

actors:
  - ★ Dark mode: { kind: card, lane: winner, stack: 0, subtitle: "票が最も多い案" }
  - Search: { kind: card, lane: runners, stack: 0, subtitle: "次に多い案" }
  - Better API: { kind: card, lane: runners, stack: 1, subtitle: "中ほどの案" }
  - Nicer UI: { kind: card, lane: runners, stack: 2, subtitle: "最も少ない案" }

animation:
  - step: "票が割れる" 1.8s
    focus: ["★ Dark mode"]
    set:
      options: '[["Dark mode",7],["Faster search",6],["Better API",5],["Nicer UI",4]]'
    description: "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。"
  - step: "1 案に集まる" 1.8s
    focus: ["★ Dark mode", "Search"]
    set:
      options: '[["Dark mode",40],["Faster search",13],["Better API",8],["Nicer UI",5]]'
    description: "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。"
  - step: "締め切り" 1.8s
    focus: ["★ Dark mode", "Search", "Better API", "Nicer UI"]
    set:
      options: '[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]'
    description: "他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。"
`;

export const sourceJson__featurePoll = `{
  "title": "投票結果を 1 位とその他に分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "pb",
      "kind": "poll-bar",
      "source": "options",
      "color": "#a08870",
      "colorWinner": "#2563eb",
      "label": "Results (aggregate)"
    }
  ],
  "lanes": {
    "winner": { "x": 0, "width": 220 },
    "runners": { "x": 300, "width": 220 }
  },
  "actors": [
    {
      "name": "★ Dark mode",
      "kind": "card",
      "lane": "winner",
      "stack": 0,
      "subtitle": "票が最も多い案"
    },
    { "name": "Search", "kind": "card", "lane": "runners", "stack": 0, "subtitle": "次に多い案" },
    { "name": "Better API", "kind": "card", "lane": "runners", "stack": 1, "subtitle": "中ほどの案" },
    { "name": "Nicer UI", "kind": "card", "lane": "runners", "stack": 2, "subtitle": "最も少ない案" }
  ],
  "flow": [],
  "states": {
    "options": "[[\\"Dark mode\\",42],[\\"Faster search\\",28],[\\"Better API\\",18],[\\"Nicer UI\\",12]]"
  },
  "animation": [
    {
      "step": "票が割れる",
      "duration": 1.8,
      "focus": ["★ Dark mode"],
      "set": {
        "options": "[[\\"Dark mode\\",7],[\\"Faster search\\",6],[\\"Better API\\",5],[\\"Nicer UI\\",4]]"
      },
      "body": "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。"
    },
    {
      "step": "1 案に集まる",
      "duration": 1.8,
      "focus": ["★ Dark mode", "Search"],
      "set": {
        "options": "[[\\"Dark mode\\",40],[\\"Faster search\\",13],[\\"Better API\\",8],[\\"Nicer UI\\",5]]"
      },
      "body": "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。"
    },
    {
      "step": "締め切り",
      "duration": 1.8,
      "focus": ["★ Dark mode", "Search", "Better API", "Nicer UI"],
      "set": {
        "options": "[[\\"Dark mode\\",42],[\\"Faster search\\",28],[\\"Better API\\",18],[\\"Nicer UI\\",12]]"
      },
      "body": "他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。"
    }
  ]
}`;

export const sourceYaml__reviewerStack = `title: "レビュアー 7 人を 5 人表示と残りで見せる"
type: flow

readouts:
  us: { kind: user-stack, source: "reviewers", max: 5, size: 36, label: "Reviewers (stacked avatars)" }

lanes:
  displayed: { x: 0, width: 340 }
  overflow: { x: 380, width: 200 }

states:
  reviewers: '["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]'

actors:
  - Alice: { kind: card, lane: displayed, stack: 0, subtitle: "頭文字 A · はじめから居る" }
  - Bob Smith: { kind: card, lane: displayed, stack: 1, subtitle: "頭文字 BS · はじめから居る" }
  - Carol: { kind: card, lane: displayed, stack: 2, subtitle: "頭文字 C · はじめから居る" }
  - Dan Kim: { kind: card, lane: displayed, stack: 3, subtitle: "頭文字 DK · 途中で加わる" }
  - Eve: { kind: card, lane: displayed, stack: 4, subtitle: "頭文字 E · 上限ちょうど" }
  - Frank Wu: { kind: card, lane: overflow, stack: 0, subtitle: "頭文字 FW · 上限を超える" }
  - Grace Lee: { kind: card, lane: overflow, stack: 1, subtitle: "頭文字 GL · 上限を超える" }

animation:
  - step: "依頼した直後" 1.8s
    focus: ["Alice", "Bob Smith", "Carol"]
    set:
      reviewers: '["Alice","Bob Smith","Carol"]'
    description: "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。"
  - step: "上限ちょうど" 1.8s
    focus: ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve"]
    set:
      reviewers: '["Alice","Bob Smith","Carol","Dan Kim","Eve"]'
    description: "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。"
  - step: "上限を超える" 1.8s
    focus: ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"]
    set:
      reviewers: '["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]'
    description: "上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。"
`;

export const sourceJson__reviewerStack = `{
  "title": "レビュアー 7 人を 5 人表示と残りで見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "us",
      "kind": "user-stack",
      "source": "reviewers",
      "max": 5,
      "size": 36,
      "label": "Reviewers (stacked avatars)"
    }
  ],
  "lanes": {
    "displayed": { "x": 0, "width": 340 },
    "overflow": { "x": 380, "width": 200 }
  },
  "actors": [
    {
      "name": "Alice",
      "kind": "card",
      "lane": "displayed",
      "stack": 0,
      "subtitle": "頭文字 A · はじめから居る"
    },
    {
      "name": "Bob Smith",
      "kind": "card",
      "lane": "displayed",
      "stack": 1,
      "subtitle": "頭文字 BS · はじめから居る"
    },
    {
      "name": "Carol",
      "kind": "card",
      "lane": "displayed",
      "stack": 2,
      "subtitle": "頭文字 C · はじめから居る"
    },
    {
      "name": "Dan Kim",
      "kind": "card",
      "lane": "displayed",
      "stack": 3,
      "subtitle": "頭文字 DK · 途中で加わる"
    },
    {
      "name": "Eve",
      "kind": "card",
      "lane": "displayed",
      "stack": 4,
      "subtitle": "頭文字 E · 上限ちょうど"
    },
    {
      "name": "Frank Wu",
      "kind": "card",
      "lane": "overflow",
      "stack": 0,
      "subtitle": "頭文字 FW · 上限を超える"
    },
    {
      "name": "Grace Lee",
      "kind": "card",
      "lane": "overflow",
      "stack": 1,
      "subtitle": "頭文字 GL · 上限を超える"
    }
  ],
  "flow": [],
  "states": {
    "reviewers": "[\\"Alice\\",\\"Bob Smith\\",\\"Carol\\",\\"Dan Kim\\",\\"Eve\\",\\"Frank Wu\\",\\"Grace Lee\\"]"
  },
  "animation": [
    {
      "step": "依頼した直後",
      "duration": 1.8,
      "focus": ["Alice", "Bob Smith", "Carol"],
      "set": { "reviewers": "[\\"Alice\\",\\"Bob Smith\\",\\"Carol\\"]" },
      "body": "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。"
    },
    {
      "step": "上限ちょうど",
      "duration": 1.8,
      "focus": ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve"],
      "set": { "reviewers": "[\\"Alice\\",\\"Bob Smith\\",\\"Carol\\",\\"Dan Kim\\",\\"Eve\\"]" },
      "body": "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。"
    },
    {
      "step": "上限を超える",
      "duration": 1.8,
      "focus": ["Alice", "Bob Smith", "Carol", "Dan Kim", "Eve", "Frank Wu", "Grace Lee"],
      "set": {
        "reviewers": "[\\"Alice\\",\\"Bob Smith\\",\\"Carol\\",\\"Dan Kim\\",\\"Eve\\",\\"Frank Wu\\",\\"Grace Lee\\"]"
      },
      "body": "上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。"
    }
  ]
}`;

export const sourceYaml__gitCommitList = `title: "5 つのコミットを種別ごとに並べる"
type: flow

readouts:
  cl: { kind: commit-list, source: "commits", max: 5, color: "#2563eb", label: "History (git log)" }

lanes:
  col1: { x: 0, width: 350 }
  col2: { x: 390, width: 360 }
  col3: { x: 790, width: 350 }

states:
  commits: '[["a1b2c3d","feat: add sankey primitive","Alice"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["i9j0k1l","docs: update SKILL.md","Carol"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["q7r8s9t","test: add builder chain coverage","Eve"]]'

actors:
  - feat: { kind: card, lane: col1, stack: 0, subtitle: "機能を足す (Alice)", posW: 280 }
  - fix: { kind: card, lane: col2, stack: 0, subtitle: "不具合を直す (Bob)", posW: 310 }
  - docs: { kind: card, lane: col3, stack: 0, subtitle: "説明を書く (Carol)", posW: 300 }
  - refactor: { kind: card, lane: col1, stack: 1, subtitle: "構造を整える (Dan)", posW: 300 }
  - test: { kind: card, lane: col2, stack: 1, subtitle: "検査を足す (Eve)", posW: 270 }

animation:
  - step: "1 件目" 1.8s
    focus: ["feat"]
    set:
      commits: '[["a1b2c3d","feat: add sankey primitive","Alice"]]'
    description: "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。"
  - step: "積み上がる" 1.8s
    focus: ["feat", "fix", "docs"]
    set:
      commits: '[["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]'
    description: "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。"
  - step: "表示の上限" 1.8s
    focus: ["feat", "fix", "docs", "refactor", "test"]
    set:
      commits: '[["q7r8s9t","test: add builder chain coverage","Eve"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]'
    description: "表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。"
`;

export const sourceJson__gitCommitList = `{
  "title": "5 つのコミットを種別ごとに並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "cl",
      "kind": "commit-list",
      "source": "commits",
      "max": 5,
      "color": "#2563eb",
      "label": "History (git log)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 350 },
    "col2": { "x": 390, "width": 360 },
    "col3": { "x": 790, "width": 350 }
  },
  "actors": [
    {
      "name": "feat",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "機能を足す (Alice)",
      "posW": 280
    },
    {
      "name": "fix",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "不具合を直す (Bob)",
      "posW": 310
    },
    {
      "name": "docs",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "説明を書く (Carol)",
      "posW": 300
    },
    {
      "name": "refactor",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "構造を整える (Dan)",
      "posW": 300
    },
    {
      "name": "test",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "検査を足す (Eve)",
      "posW": 270
    }
  ],
  "flow": [],
  "states": {
    "commits": "[[\\"a1b2c3d\\",\\"feat: add sankey primitive\\",\\"Alice\\"],[\\"e5f6g7h\\",\\"fix: circular gauge angle bug\\",\\"Bob\\"],[\\"i9j0k1l\\",\\"docs: update SKILL.md\\",\\"Carol\\"],[\\"m3n4o5p\\",\\"refactor: extract widget dispatcher\\",\\"Dan\\"],[\\"q7r8s9t\\",\\"test: add builder chain coverage\\",\\"Eve\\"]]"
  },
  "animation": [
    {
      "step": "1 件目",
      "duration": 1.8,
      "focus": ["feat"],
      "set": { "commits": "[[\\"a1b2c3d\\",\\"feat: add sankey primitive\\",\\"Alice\\"]]" },
      "body": "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。"
    },
    {
      "step": "積み上がる",
      "duration": 1.8,
      "focus": ["feat", "fix", "docs"],
      "set": {
        "commits": "[[\\"i9j0k1l\\",\\"docs: update SKILL.md\\",\\"Carol\\"],[\\"e5f6g7h\\",\\"fix: circular gauge angle bug\\",\\"Bob\\"],[\\"a1b2c3d\\",\\"feat: add sankey primitive\\",\\"Alice\\"]]"
      },
      "body": "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。"
    },
    {
      "step": "表示の上限",
      "duration": 1.8,
      "focus": ["feat", "fix", "docs", "refactor", "test"],
      "set": {
        "commits": "[[\\"q7r8s9t\\",\\"test: add builder chain coverage\\",\\"Eve\\"],[\\"m3n4o5p\\",\\"refactor: extract widget dispatcher\\",\\"Dan\\"],[\\"i9j0k1l\\",\\"docs: update SKILL.md\\",\\"Carol\\"],[\\"e5f6g7h\\",\\"fix: circular gauge angle bug\\",\\"Bob\\"],[\\"a1b2c3d\\",\\"feat: add sankey primitive\\",\\"Alice\\"]]"
      },
      "body": "表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。"
    }
  ]
}`;

export const sourceYaml__serverEventLog = `title: "サーバのログ 5 件を重要度で分ける"
type: flow

readouts:
  el: { kind: event-log, source: "events", max: 10, label: "Events (timeline)" }

lanes:
  info: { x: 0, width: 160 }
  debug: { x: 200, width: 160 }
  warn: { x: 400, width: 160 }
  error: { x: 600, width: 160 }

states:
  events: '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]'

actors:
  - ℹ 起動: { kind: card, lane: info, stack: 0, subtitle: "待ち受けを始めた知らせ" }
  - ℹ 復帰: { kind: card, lane: info, stack: 1, subtitle: "つなぎ直しに成功した知らせ" }
  - · 設定: { kind: card, lane: debug, stack: 0, subtitle: "設定を読んだ記録" }
  - ⚠ 負荷: { kind: card, lane: warn, stack: 0, subtitle: "計算資源の使い過ぎ" }
  - ✕ 切断: { kind: card, lane: error, stack: 0, subtitle: "つなぎ先が応じない" }

animation:
  - step: "平常の記録" 1.8s
    focus: ["ℹ 起動", "· 設定"]
    set:
      events: '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"]]'
    description: "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。"
  - step: "異常が出る" 1.8s
    focus: ["ℹ 起動", "· 設定", "⚠ 負荷", "✕ 切断"]
    set:
      events: '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"]]'
    description: "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。"
  - step: "復帰する" 1.8s
    focus: ["ℹ 起動", "ℹ 復帰", "· 設定", "⚠ 負荷", "✕ 切断"]
    set:
      events: '[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]'
    description: "最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。"
`;

export const sourceJson__serverEventLog = `{
  "title": "サーバのログ 5 件を重要度で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "el",
      "kind": "event-log",
      "source": "events",
      "max": 10,
      "label": "Events (timeline)"
    }
  ],
  "lanes": {
    "info": { "x": 0, "width": 160 },
    "debug": { "x": 200, "width": 160 },
    "warn": { "x": 400, "width": 160 },
    "error": { "x": 600, "width": 160 }
  },
  "actors": [
    { "name": "ℹ 起動", "kind": "card", "lane": "info", "stack": 0, "subtitle": "待ち受けを始めた知らせ" },
    { "name": "ℹ 復帰", "kind": "card", "lane": "info", "stack": 1, "subtitle": "つなぎ直しに成功した知らせ" },
    { "name": "· 設定", "kind": "card", "lane": "debug", "stack": 0, "subtitle": "設定を読んだ記録" },
    { "name": "⚠ 負荷", "kind": "card", "lane": "warn", "stack": 0, "subtitle": "計算資源の使い過ぎ" },
    { "name": "✕ 切断", "kind": "card", "lane": "error", "stack": 0, "subtitle": "つなぎ先が応じない" }
  ],
  "flow": [],
  "states": {
    "events": "[[\\"10:23:45\\",\\"info\\",\\"Server started on port 3000\\"],[\\"10:24:12\\",\\"debug\\",\\"Loaded config from ~/.env\\"],[\\"10:24:58\\",\\"warn\\",\\"High CPU usage: 82%\\"],[\\"10:25:34\\",\\"error\\",\\"DB connection timeout after 5s\\"],[\\"10:26:01\\",\\"info\\",\\"Retry connection succeeded\\"]]"
  },
  "animation": [
    {
      "step": "平常の記録",
      "duration": 1.8,
      "focus": ["ℹ 起動", "· 設定"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"Server started on port 3000\\"],[\\"10:24:12\\",\\"debug\\",\\"Loaded config from ~/.env\\"]]"
      },
      "body": "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。"
    },
    {
      "step": "異常が出る",
      "duration": 1.8,
      "focus": ["ℹ 起動", "· 設定", "⚠ 負荷", "✕ 切断"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"Server started on port 3000\\"],[\\"10:24:12\\",\\"debug\\",\\"Loaded config from ~/.env\\"],[\\"10:24:58\\",\\"warn\\",\\"High CPU usage: 82%\\"],[\\"10:25:34\\",\\"error\\",\\"DB connection timeout after 5s\\"]]"
      },
      "body": "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。"
    },
    {
      "step": "復帰する",
      "duration": 1.8,
      "focus": ["ℹ 起動", "ℹ 復帰", "· 設定", "⚠ 負荷", "✕ 切断"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"Server started on port 3000\\"],[\\"10:24:12\\",\\"debug\\",\\"Loaded config from ~/.env\\"],[\\"10:24:58\\",\\"warn\\",\\"High CPU usage: 82%\\"],[\\"10:25:34\\",\\"error\\",\\"DB connection timeout after 5s\\"],[\\"10:26:01\\",\\"info\\",\\"Retry connection succeeded\\"]]"
      },
      "body": "最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。"
    }
  ]
}`;

export const sourceYaml__searchResults = `title: "検索結果を文書 / ツールに分ける"
type: flow

readouts:
  sr: { kind: search-result, source: "hits", max: 5, color: "#2563eb", label: "Results (link + snippet + url)" }

lanes:
  docs: { x: 0, width: 340 }
  tools: { x: 380, width: 300 }

states:
  hits: '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]'

actors:
  - MDN Web Docs: { kind: card, lane: docs, stack: 0, subtitle: "developer.mozilla.org" }
  - TS Handbook: { kind: card, lane: docs, stack: 1, subtitle: "typescriptlang.org/docs" }
  - React docs: { kind: card, lane: docs, stack: 2, subtitle: "react.dev" }
  - Vite guide: { kind: card, lane: docs, stack: 3, subtitle: "vitejs.dev" }
  - Rust: { kind: card, lane: tools, stack: 0, subtitle: "play.rust-lang.org (interactive)" }

animation:
  - step: "広い語で引く" 1.8s
    focus: ["MDN Web Docs", "TS Handbook", "React docs", "Vite guide", "Rust"]
    set:
      hits: '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]'
    description: "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。"
  - step: "語を足す" 1.8s
    focus: ["MDN Web Docs", "TS Handbook", "React docs"]
    set:
      hits: '[["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"]]'
    description: "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。"
  - step: "絞り切る" 1.8s
    focus: ["Rust"]
    set:
      hits: '[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"]]'
    description: "当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。"
`;

export const sourceJson__searchResults = `{
  "title": "検索結果を文書 / ツールに分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "sr",
      "kind": "search-result",
      "source": "hits",
      "max": 5,
      "color": "#2563eb",
      "label": "Results (link + snippet + url)"
    }
  ],
  "lanes": {
    "docs": { "x": 0, "width": 340 },
    "tools": { "x": 380, "width": 300 }
  },
  "actors": [
    {
      "name": "MDN Web Docs",
      "kind": "card",
      "lane": "docs",
      "stack": 0,
      "subtitle": "developer.mozilla.org"
    },
    {
      "name": "TS Handbook",
      "kind": "card",
      "lane": "docs",
      "stack": 1,
      "subtitle": "typescriptlang.org/docs"
    },
    {
      "name": "React docs",
      "kind": "card",
      "lane": "docs",
      "stack": 2,
      "subtitle": "react.dev"
    },
    {
      "name": "Vite guide",
      "kind": "card",
      "lane": "docs",
      "stack": 3,
      "subtitle": "vitejs.dev"
    },
    {
      "name": "Rust",
      "kind": "card",
      "lane": "tools",
      "stack": 0,
      "subtitle": "play.rust-lang.org (interactive)"
    }
  ],
  "flow": [],
  "states": {
    "hits": "[[\\"Rust playground\\",\\"Interactive code sandbox for Rust programming language\\",\\"play.rust-lang.org\\"],[\\"MDN Web Docs\\",\\"Documentation for web technologies\\",\\"developer.mozilla.org\\"],[\\"TypeScript Handbook\\",\\"Official TS learning guide\\",\\"typescriptlang.org/docs\\"],[\\"React docs\\",\\"React reference documentation\\",\\"react.dev\\"],[\\"Vite guide\\",\\"Frontend build tool guide\\",\\"vitejs.dev\\"]]"
  },
  "animation": [
    {
      "step": "広い語で引く",
      "duration": 1.8,
      "focus": ["MDN Web Docs", "TS Handbook", "React docs", "Vite guide", "Rust"],
      "set": {
        "hits": "[[\\"Rust playground\\",\\"Interactive code sandbox for Rust programming language\\",\\"play.rust-lang.org\\"],[\\"MDN Web Docs\\",\\"Documentation for web technologies\\",\\"developer.mozilla.org\\"],[\\"TypeScript Handbook\\",\\"Official TS learning guide\\",\\"typescriptlang.org/docs\\"],[\\"React docs\\",\\"React reference documentation\\",\\"react.dev\\"],[\\"Vite guide\\",\\"Frontend build tool guide\\",\\"vitejs.dev\\"]]"
      },
      "body": "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。"
    },
    {
      "step": "語を足す",
      "duration": 1.8,
      "focus": ["MDN Web Docs", "TS Handbook", "React docs"],
      "set": {
        "hits": "[[\\"MDN Web Docs\\",\\"Documentation for web technologies\\",\\"developer.mozilla.org\\"],[\\"TypeScript Handbook\\",\\"Official TS learning guide\\",\\"typescriptlang.org/docs\\"],[\\"React docs\\",\\"React reference documentation\\",\\"react.dev\\"]]"
      },
      "body": "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。"
    },
    {
      "step": "絞り切る",
      "duration": 1.8,
      "focus": ["Rust"],
      "set": {
        "hits": "[[\\"Rust playground\\",\\"Interactive code sandbox for Rust programming language\\",\\"play.rust-lang.org\\"]]"
      },
      "body": "当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。"
    }
  ]
}`;

export const sourceYaml__yearRoadmap = `title: "年間の計画を四半期ごとに並べる"
type: flow

readouts:
  rm: { kind: roadmap, source: "plan", viewW: 400, viewH: 200, label: "Roadmap (4 column list)" }

lanes:
  q1: { x: 0, width: 150 }
  q2: { x: 170, width: 150 }
  q3: { x: 340, width: 150 }
  q4: { x: 510, width: 150 }

states:
  plan: '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]'

actors:
  - Q1 (Jan-Mar): { kind: card, lane: q1, stack: 0, subtitle: "Design + MVP" }
  - Design: { kind: card, lane: q1, stack: 1, subtitle: "foundation" }
  - MVP feature: { kind: card, lane: q1, stack: 2, subtitle: "prototype" }
  - Q2 (Apr-Jun): { kind: card, lane: q2, stack: 0, subtitle: "Beta + growth" }
  - Beta launch: { kind: card, lane: q2, stack: 1, subtitle: "public beta" }
  - Feature B: { kind: card, lane: q2, stack: 2, subtitle: "beta scope" }
  - Q3 (Jul-Sep): { kind: card, lane: q3, stack: 0, subtitle: "Scale + enterprise" }
  - Scale infra: { kind: card, lane: q3, stack: 1, subtitle: "capacity" }
  - Enterprise: { kind: card, lane: q3, stack: 2, subtitle: "企業向けの売上" }
  - Q4 (Oct-Dec): { kind: card, lane: q4, stack: 0, subtitle: "GA + funding" }
  - Public GA: { kind: card, lane: q4, stack: 1, subtitle: "general available" }
  - Series A: { kind: card, lane: q4, stack: 2, subtitle: "growth capital" }

flow:
  - Q1 (Jan-Mar) -> Q2 (Apr-Jun): "handover" (info)
  - Q2 (Apr-Jun) -> Q3 (Jul-Sep): "scale" (accent)
  - Q3 (Jul-Sep) -> Q4 (Oct-Dec): "GA" (success)

animation:
  - step: "手前だけ決まる" 1.8s
    focus: ["Q1 (Jan-Mar)", "Design", "MVP feature"]
    set:
      plan: '[["Q1",["Design system","MVP feature A"]],["Q2",[]],["Q3",[]],["Q4",[]]]'
    description: "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。"
  - step: "半年先まで" 1.8s
    focus: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Beta launch", "Feature B"]
    set:
      plan: '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",[]],["Q4",[]]]'
    description: "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。"
  - step: "年内が揃う" 1.8s
    focus: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"]
    set:
      plan: '[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]'
    description: "4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。"
`;

export const sourceJson__yearRoadmap = `{
  "title": "年間の計画を四半期ごとに並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "rm",
      "kind": "roadmap",
      "source": "plan",
      "viewW": 400,
      "viewH": 200,
      "label": "Roadmap (4 column list)"
    }
  ],
  "lanes": {
    "q1": { "x": 0, "width": 150 },
    "q2": { "x": 170, "width": 150 },
    "q3": { "x": 340, "width": 150 },
    "q4": { "x": 510, "width": 150 }
  },
  "actors": [
    {
      "name": "Q1 (Jan-Mar)",
      "kind": "card",
      "lane": "q1",
      "stack": 0,
      "subtitle": "Design + MVP"
    },
    { "name": "Design", "kind": "card", "lane": "q1", "stack": 1, "subtitle": "foundation" },
    { "name": "MVP feature", "kind": "card", "lane": "q1", "stack": 2, "subtitle": "prototype" },
    {
      "name": "Q2 (Apr-Jun)",
      "kind": "card",
      "lane": "q2",
      "stack": 0,
      "subtitle": "Beta + growth"
    },
    {
      "name": "Beta launch",
      "kind": "card",
      "lane": "q2",
      "stack": 1,
      "subtitle": "public beta"
    },
    { "name": "Feature B", "kind": "card", "lane": "q2", "stack": 2, "subtitle": "beta scope" },
    {
      "name": "Q3 (Jul-Sep)",
      "kind": "card",
      "lane": "q3",
      "stack": 0,
      "subtitle": "Scale + enterprise"
    },
    { "name": "Scale infra", "kind": "card", "lane": "q3", "stack": 1, "subtitle": "capacity" },
    { "name": "Enterprise", "kind": "card", "lane": "q3", "stack": 2, "subtitle": "企業向けの売上" },
    {
      "name": "Q4 (Oct-Dec)",
      "kind": "card",
      "lane": "q4",
      "stack": 0,
      "subtitle": "GA + funding"
    },
    {
      "name": "Public GA",
      "kind": "card",
      "lane": "q4",
      "stack": 1,
      "subtitle": "general available"
    },
    {
      "name": "Series A",
      "kind": "card",
      "lane": "q4",
      "stack": 2,
      "subtitle": "growth capital"
    }
  ],
  "flow": [
    { "from": "Q1 (Jan-Mar)", "to": "Q2 (Apr-Jun)", "label": "handover", "tone": "info" },
    { "from": "Q2 (Apr-Jun)", "to": "Q3 (Jul-Sep)", "label": "scale", "tone": "accent" },
    { "from": "Q3 (Jul-Sep)", "to": "Q4 (Oct-Dec)", "label": "GA", "tone": "success" }
  ],
  "states": {
    "plan": "[[\\"Q1\\",[\\"Design system\\",\\"MVP feature A\\"]],[\\"Q2\\",[\\"Beta launch\\",\\"Feature B\\",\\"Feedback loop\\"]],[\\"Q3\\",[\\"Scale infra\\",\\"Enterprise deals\\"]],[\\"Q4\\",[\\"Public GA\\",\\"Series A\\"]]]"
  },
  "animation": [
    {
      "step": "手前だけ決まる",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)", "Design", "MVP feature"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"Design system\\",\\"MVP feature A\\"]],[\\"Q2\\",[]],[\\"Q3\\",[]],[\\"Q4\\",[]]]"
      },
      "body": "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。"
    },
    {
      "step": "半年先まで",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Beta launch", "Feature B"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"Design system\\",\\"MVP feature A\\"]],[\\"Q2\\",[\\"Beta launch\\",\\"Feature B\\",\\"Feedback loop\\"]],[\\"Q3\\",[]],[\\"Q4\\",[]]]"
      },
      "body": "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。"
    },
    {
      "step": "年内が揃う",
      "duration": 1.8,
      "focus": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"Design system\\",\\"MVP feature A\\"]],[\\"Q2\\",[\\"Beta launch\\",\\"Feature B\\",\\"Feedback loop\\"]],[\\"Q3\\",[\\"Scale infra\\",\\"Enterprise deals\\"]],[\\"Q4\\",[\\"Public GA\\",\\"Series A\\"]]]"
      },
      "body": "4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。"
    }
  ]
}`;

export const sourceYaml__weekWeather = `title: "5 日間の天気を晴 / 曇雨 / 雷で分ける"
type: flow

readouts:
  wf: { kind: weather-forecast, source: "forecast", label: "Week (5-day forecast)" }

lanes:
  sunny: { x: 0, width: 220 }
  cloudy: { x: 260, width: 220 }
  thunder: { x: 520, width: 200 }

states:
  forecast: '[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]'

actors:
  - ☀ Mon: { kind: card, lane: sunny, stack: 0, subtitle: "晴れ · 週の始まり" }
  - ☀ Fri: { kind: card, lane: sunny, stack: 1, subtitle: "晴れ · 週で最も暖かい" }
  - ☁ Tue: { kind: card, lane: cloudy, stack: 0, subtitle: "曇り · 下り坂の入口" }
  - ☂ Wed: { kind: card, lane: cloudy, stack: 1, subtitle: "雨 · 気温が下がる" }
  - ⚡ Thu: { kind: card, lane: thunder, stack: 0, subtitle: "雷 · 週で最も寒い" }

animation:
  - step: "3 日前の予報" 1.8s
    focus: ["☀ Mon", "☁ Tue"]
    set:
      forecast: '[["Mon","☀",21,16],["Tue","☁",20,15],["Wed","☂",18,14],["Thu","⚡",16,12],["Fri","☀",22,17]]'
    description: "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。"
  - step: "前日の予報" 1.8s
    focus: ["☀ Mon", "☁ Tue", "☂ Wed"]
    set:
      forecast: '[["Mon","☀",23,17],["Tue","☁",21,16],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",24,18]]'
    description: "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。"
  - step: "当日の予報" 1.8s
    focus: ["☀ Mon", "☀ Fri", "☁ Tue", "☂ Wed", "⚡ Thu"]
    set:
      forecast: '[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]'
    description: "最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。"
`;

export const sourceJson__weekWeather = `{
  "title": "5 日間の天気を晴 / 曇雨 / 雷で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "wf",
      "kind": "weather-forecast",
      "source": "forecast",
      "label": "Week (5-day forecast)"
    }
  ],
  "lanes": {
    "sunny": { "x": 0, "width": 220 },
    "cloudy": { "x": 260, "width": 220 },
    "thunder": { "x": 520, "width": 200 }
  },
  "actors": [
    { "name": "☀ Mon", "kind": "card", "lane": "sunny", "stack": 0, "subtitle": "晴れ · 週の始まり" },
    { "name": "☀ Fri", "kind": "card", "lane": "sunny", "stack": 1, "subtitle": "晴れ · 週で最も暖かい" },
    { "name": "☁ Tue", "kind": "card", "lane": "cloudy", "stack": 0, "subtitle": "曇り · 下り坂の入口" },
    { "name": "☂ Wed", "kind": "card", "lane": "cloudy", "stack": 1, "subtitle": "雨 · 気温が下がる" },
    { "name": "⚡ Thu", "kind": "card", "lane": "thunder", "stack": 0, "subtitle": "雷 · 週で最も寒い" }
  ],
  "flow": [],
  "states": {
    "forecast": "[[\\"Mon\\",\\"☀\\",24,18],[\\"Tue\\",\\"☁\\",22,17],[\\"Wed\\",\\"☂\\",19,15],[\\"Thu\\",\\"⚡\\",17,13],[\\"Fri\\",\\"☀\\",25,19]]"
  },
  "animation": [
    {
      "step": "3 日前の予報",
      "duration": 1.8,
      "focus": ["☀ Mon", "☁ Tue"],
      "set": {
        "forecast": "[[\\"Mon\\",\\"☀\\",21,16],[\\"Tue\\",\\"☁\\",20,15],[\\"Wed\\",\\"☂\\",18,14],[\\"Thu\\",\\"⚡\\",16,12],[\\"Fri\\",\\"☀\\",22,17]]"
      },
      "body": "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。"
    },
    {
      "step": "前日の予報",
      "duration": 1.8,
      "focus": ["☀ Mon", "☁ Tue", "☂ Wed"],
      "set": {
        "forecast": "[[\\"Mon\\",\\"☀\\",23,17],[\\"Tue\\",\\"☁\\",21,16],[\\"Wed\\",\\"☂\\",19,15],[\\"Thu\\",\\"⚡\\",17,13],[\\"Fri\\",\\"☀\\",24,18]]"
      },
      "body": "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。"
    },
    {
      "step": "当日の予報",
      "duration": 1.8,
      "focus": ["☀ Mon", "☀ Fri", "☁ Tue", "☂ Wed", "⚡ Thu"],
      "set": {
        "forecast": "[[\\"Mon\\",\\"☀\\",24,18],[\\"Tue\\",\\"☁\\",22,17],[\\"Wed\\",\\"☂\\",19,15],[\\"Thu\\",\\"⚡\\",17,13],[\\"Fri\\",\\"☀\\",25,19]]"
      },
      "body": "最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。"
    }
  ]
}`;

export const sourceYaml__tutorialVideoCards = `title: "解説動画 3 本を言語ごとに分ける"
type: flow

readouts:
  vc: { kind: video-card, source: "videos", max: 5, color: "#ef4444", label: "Videos (thumbnail list)" }

lanes:
  rust: { x: 0, width: 220 }
  ts: { x: 260, width: 220 }
  react: { x: 520, width: 220 }

states:
  videos: '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]'

actors:
  - 🎬 Rust2: { kind: card, lane: rust, stack: 0, subtitle: "最初に出す 1 本", title: "🎬 Rust" }
  - 🎥 TS deep: { kind: card, lane: ts, stack: 0, subtitle: "最も長い 1 本" }
  - 📺 React2: { kind: card, lane: react, stack: 0, subtitle: "最も見られている 1 本", title: "📺 React" }

animation:
  - step: "1 本だけ出す" 1.8s
    focus: ["🎬 Rust2"]
    set:
      videos: '[["🎬","Rust intro for beginners","12:45","24k"]]'
    description: "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。"
  - step: "2 本に増える" 1.8s
    focus: ["🎬 Rust2", "🎥 TS deep"]
    set:
      videos: '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"]]'
    description: "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。"
  - step: "3 本が揃う" 1.8s
    focus: ["🎬 Rust2", "🎥 TS deep", "📺 React2"]
    set:
      videos: '[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]'
    description: "3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。"
`;

export const sourceJson__tutorialVideoCards = `{
  "title": "解説動画 3 本を言語ごとに分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "vc",
      "kind": "video-card",
      "source": "videos",
      "max": 5,
      "color": "#ef4444",
      "label": "Videos (thumbnail list)"
    }
  ],
  "lanes": {
    "rust": { "x": 0, "width": 220 },
    "ts": { "x": 260, "width": 220 },
    "react": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "🎬 Rust2",
      "kind": "card",
      "lane": "rust",
      "stack": 0,
      "subtitle": "最初に出す 1 本",
      "title": "🎬 Rust"
    },
    { "name": "🎥 TS deep", "kind": "card", "lane": "ts", "stack": 0, "subtitle": "最も長い 1 本" },
    {
      "name": "📺 React2",
      "kind": "card",
      "lane": "react",
      "stack": 0,
      "subtitle": "最も見られている 1 本",
      "title": "📺 React"
    }
  ],
  "flow": [],
  "states": {
    "videos": "[[\\"🎬\\",\\"Rust intro for beginners\\",\\"12:45\\",\\"24k\\"],[\\"🎥\\",\\"TypeScript deep dive\\",\\"45:20\\",\\"82k\\"],[\\"📺\\",\\"React hooks explained\\",\\"18:30\\",\\"156k\\"]]"
  },
  "animation": [
    {
      "step": "1 本だけ出す",
      "duration": 1.8,
      "focus": ["🎬 Rust2"],
      "set": { "videos": "[[\\"🎬\\",\\"Rust intro for beginners\\",\\"12:45\\",\\"24k\\"]]" },
      "body": "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。"
    },
    {
      "step": "2 本に増える",
      "duration": 1.8,
      "focus": ["🎬 Rust2", "🎥 TS deep"],
      "set": {
        "videos": "[[\\"🎬\\",\\"Rust intro for beginners\\",\\"12:45\\",\\"24k\\"],[\\"🎥\\",\\"TypeScript deep dive\\",\\"45:20\\",\\"82k\\"]]"
      },
      "body": "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。"
    },
    {
      "step": "3 本が揃う",
      "duration": 1.8,
      "focus": ["🎬 Rust2", "🎥 TS deep", "📺 React2"],
      "set": {
        "videos": "[[\\"🎬\\",\\"Rust intro for beginners\\",\\"12:45\\",\\"24k\\"],[\\"🎥\\",\\"TypeScript deep dive\\",\\"45:20\\",\\"82k\\"],[\\"📺\\",\\"React hooks explained\\",\\"18:30\\",\\"156k\\"]]"
      },
      "body": "3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。"
    }
  ]
}`;

export const sourceYaml__teamAttendanceGrid = `title: "4 人 × 5 日の出欠を並べる"
type: flow

readouts:
  ag: { kind: attendance-grid, source: "attendance", membersSource: "members", color: "#22c55e", label: "Attendance (5 day × 4 member grid)" }

lanes:
  alice: { x: 0, width: 330 }
  bob: { x: 350, width: 330 }
  carol: { x: 700, width: 370 }
  dan: { x: 1090, width: 300 }

states:
  attendance: '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true],["Thu",false,true,true,true],["Fri",true,true,false,true]]'
  members: '["Alice","Bob","Carol","Dan"]'

actors:
  - Alice2: { kind: card, lane: alice, stack: 0, subtitle: "1 列目の人", posW: 280, title: "Alice" }
  - Bob2: { kind: card, lane: bob, stack: 0, subtitle: "2 列目の人", posW: 280, title: "Bob" }
  - Carol2: { kind: card, lane: carol, stack: 0, subtitle: "3 列目の人", posW: 320, title: "Carol" }
  - Dan2: { kind: card, lane: dan, stack: 0, subtitle: "4 列目の人 (欠けが無い)", posW: 250, title: "Dan" }

animation:
  - step: "週の初め" 1.8s
    focus: ["Alice2"]
    set:
      attendance: '[["Mon",true,true,false,true]]'
    description: "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。"
  - step: "週の半ば" 1.8s
    focus: ["Alice2", "Bob2"]
    set:
      attendance: '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true]]'
    description: "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。"
  - step: "週の終わり" 1.8s
    focus: ["Alice2", "Bob2", "Carol2", "Dan2"]
    set:
      attendance: '[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true],["Thu",false,true,true,true],["Fri",true,true,false,true]]'
    description: "5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。"
`;

export const sourceJson__teamAttendanceGrid = `{
  "title": "4 人 × 5 日の出欠を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "ag",
      "kind": "attendance-grid",
      "source": "attendance",
      "membersSource": "members",
      "color": "#22c55e",
      "label": "Attendance (5 day × 4 member grid)"
    }
  ],
  "lanes": {
    "alice": { "x": 0, "width": 330 },
    "bob": { "x": 350, "width": 330 },
    "carol": { "x": 700, "width": 370 },
    "dan": { "x": 1090, "width": 300 }
  },
  "actors": [
    {
      "name": "Alice2",
      "kind": "card",
      "lane": "alice",
      "stack": 0,
      "subtitle": "1 列目の人",
      "posW": 280,
      "title": "Alice"
    },
    {
      "name": "Bob2",
      "kind": "card",
      "lane": "bob",
      "stack": 0,
      "subtitle": "2 列目の人",
      "posW": 280,
      "title": "Bob"
    },
    {
      "name": "Carol2",
      "kind": "card",
      "lane": "carol",
      "stack": 0,
      "subtitle": "3 列目の人",
      "posW": 320,
      "title": "Carol"
    },
    {
      "name": "Dan2",
      "kind": "card",
      "lane": "dan",
      "stack": 0,
      "subtitle": "4 列目の人 (欠けが無い)",
      "posW": 250,
      "title": "Dan"
    }
  ],
  "flow": [],
  "states": {
    "attendance": "[[\\"Mon\\",true,true,false,true],[\\"Tue\\",true,false,true,true],[\\"Wed\\",true,true,true,true],[\\"Thu\\",false,true,true,true],[\\"Fri\\",true,true,false,true]]",
    "members": "[\\"Alice\\",\\"Bob\\",\\"Carol\\",\\"Dan\\"]"
  },
  "animation": [
    {
      "step": "週の初め",
      "duration": 1.8,
      "focus": ["Alice2"],
      "set": { "attendance": "[[\\"Mon\\",true,true,false,true]]" },
      "body": "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。"
    },
    {
      "step": "週の半ば",
      "duration": 1.8,
      "focus": ["Alice2", "Bob2"],
      "set": {
        "attendance": "[[\\"Mon\\",true,true,false,true],[\\"Tue\\",true,false,true,true],[\\"Wed\\",true,true,true,true]]"
      },
      "body": "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。"
    },
    {
      "step": "週の終わり",
      "duration": 1.8,
      "focus": ["Alice2", "Bob2", "Carol2", "Dan2"],
      "set": {
        "attendance": "[[\\"Mon\\",true,true,false,true],[\\"Tue\\",true,false,true,true],[\\"Wed\\",true,true,true,true],[\\"Thu\\",false,true,true,true],[\\"Fri\\",true,true,false,true]]"
      },
      "body": "5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。"
    }
  ]
}`;

export const sourceYaml__globalTimezoneClock = `title: "4 都市の現地時刻を並べる"
type: flow

readouts:
  tc: { kind: timezone-clock, source: "clocks", color: "#2563eb", label: "Cities (4-column grid)" }

lanes:
  tokyo: { x: 0, width: 230 }
  london: { x: 250, width: 230 }
  nyc: { x: 500, width: 230 }
  sydney: { x: 750, width: 240 }

states:
  clocks: '[["Tokyo",9,"22:30"],["London",0,"13:30"],["NYC",-5,"08:30"],["Sydney",11,"00:30"]]'

actors:
  - Tokyo2: { kind: card, lane: tokyo, stack: 0, subtitle: "時差が進んでいる側の都市", posW: 180, title: "Tokyo" }
  - London2: { kind: card, lane: london, stack: 0, subtitle: "時差の基準となる都市", posW: 180, title: "London" }
  - NYC2: { kind: card, lane: nyc, stack: 0, subtitle: "時差が最も遅れている都市", posW: 180, title: "NYC" }
  - Sydney2: { kind: card, lane: sydney, stack: 0, subtitle: "時差が最も進んでいる都市", posW: 190, title: "Sydney" }

animation:
  - step: "朝の会" 1.8s
    focus: ["London2"]
    set:
      clocks: '[["Tokyo",9,"17:00"],["London",0,"08:00"],["NYC",-5,"03:00"],["Sydney",11,"19:00"]]'
    description: "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。"
  - step: "昼の会" 1.8s
    focus: ["London2", "NYC2"]
    set:
      clocks: '[["Tokyo",9,"22:00"],["London",0,"13:00"],["NYC",-5,"08:00"],["Sydney",11,"00:00"]]'
    description: "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。"
  - step: "夜の会" 1.8s
    focus: ["Tokyo2", "London2", "NYC2", "Sydney2"]
    set:
      clocks: '[["Tokyo",9,"01:30"],["London",0,"16:30"],["NYC",-5,"11:30"],["Sydney",11,"03:30"]]'
    description: "先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。"
`;

export const sourceJson__globalTimezoneClock = `{
  "title": "4 都市の現地時刻を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "tc",
      "kind": "timezone-clock",
      "source": "clocks",
      "color": "#2563eb",
      "label": "Cities (4-column grid)"
    }
  ],
  "lanes": {
    "tokyo": { "x": 0, "width": 230 },
    "london": { "x": 250, "width": 230 },
    "nyc": { "x": 500, "width": 230 },
    "sydney": { "x": 750, "width": 240 }
  },
  "actors": [
    {
      "name": "Tokyo2",
      "kind": "card",
      "lane": "tokyo",
      "stack": 0,
      "subtitle": "時差が進んでいる側の都市",
      "posW": 180,
      "title": "Tokyo"
    },
    {
      "name": "London2",
      "kind": "card",
      "lane": "london",
      "stack": 0,
      "subtitle": "時差の基準となる都市",
      "posW": 180,
      "title": "London"
    },
    {
      "name": "NYC2",
      "kind": "card",
      "lane": "nyc",
      "stack": 0,
      "subtitle": "時差が最も遅れている都市",
      "posW": 180,
      "title": "NYC"
    },
    {
      "name": "Sydney2",
      "kind": "card",
      "lane": "sydney",
      "stack": 0,
      "subtitle": "時差が最も進んでいる都市",
      "posW": 190,
      "title": "Sydney"
    }
  ],
  "flow": [],
  "states": {
    "clocks": "[[\\"Tokyo\\",9,\\"22:30\\"],[\\"London\\",0,\\"13:30\\"],[\\"NYC\\",-5,\\"08:30\\"],[\\"Sydney\\",11,\\"00:30\\"]]"
  },
  "animation": [
    {
      "step": "朝の会",
      "duration": 1.8,
      "focus": ["London2"],
      "set": {
        "clocks": "[[\\"Tokyo\\",9,\\"17:00\\"],[\\"London\\",0,\\"08:00\\"],[\\"NYC\\",-5,\\"03:00\\"],[\\"Sydney\\",11,\\"19:00\\"]]"
      },
      "body": "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。"
    },
    {
      "step": "昼の会",
      "duration": 1.8,
      "focus": ["London2", "NYC2"],
      "set": {
        "clocks": "[[\\"Tokyo\\",9,\\"22:00\\"],[\\"London\\",0,\\"13:00\\"],[\\"NYC\\",-5,\\"08:00\\"],[\\"Sydney\\",11,\\"00:00\\"]]"
      },
      "body": "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。"
    },
    {
      "step": "夜の会",
      "duration": 1.8,
      "focus": ["Tokyo2", "London2", "NYC2", "Sydney2"],
      "set": {
        "clocks": "[[\\"Tokyo\\",9,\\"01:30\\"],[\\"London\\",0,\\"16:30\\"],[\\"NYC\\",-5,\\"11:30\\"],[\\"Sydney\\",11,\\"03:30\\"]]"
      },
      "body": "先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。"
    }
  ]
}`;

export const sourceYaml__signupFormSummary = `title: "登録項目 5 つを意味ごとに分ける"
type: flow

readouts:
  fs: { kind: form-summary, source: "fields", color: "#2563eb", label: "Submission (dl/dt/dd)" }

lanes:
  personal: { x: 0, width: 220 }
  contact: { x: 260, width: 220 }
  prefs: { x: 520, width: 200 }

states:
  fields: '[["Name","Alice Wonderland"],["Email","alice@example.com"],["Age","28"],["Country","Japan"],["Newsletter","Yes"]]'

actors:
  - Name: { kind: card, lane: personal, stack: 0, subtitle: "本人を表す項目" }
  - Age: { kind: card, lane: personal, stack: 1, subtitle: "本人を表す項目 (数)" }
  - Email: { kind: card, lane: contact, stack: 0, subtitle: "連絡先の項目" }
  - Country: { kind: card, lane: contact, stack: 1, subtitle: "連絡先の項目 (所在)" }
  - Newsletter: { kind: card, lane: prefs, stack: 0, subtitle: "希望を表す項目" }

animation:
  - step: "入力の途中" 1.8s
    focus: ["Name", "Age"]
    set:
      fields: '[["Name","Alice Wonderland"],["Age","28"]]'
    description: "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。"
  - step: "連絡先まで" 1.8s
    focus: ["Name", "Age", "Email", "Country"]
    set:
      fields: '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"]]'
    description: "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。"
  - step: "送信の直前" 1.8s
    focus: ["Name", "Age", "Email", "Country", "Newsletter"]
    set:
      fields: '[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"],["Newsletter","Yes"]]'
    description: "希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。"
`;

export const sourceJson__signupFormSummary = `{
  "title": "登録項目 5 つを意味ごとに分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "fs",
      "kind": "form-summary",
      "source": "fields",
      "color": "#2563eb",
      "label": "Submission (dl/dt/dd)"
    }
  ],
  "lanes": {
    "personal": { "x": 0, "width": 220 },
    "contact": { "x": 260, "width": 220 },
    "prefs": { "x": 520, "width": 200 }
  },
  "actors": [
    { "name": "Name", "kind": "card", "lane": "personal", "stack": 0, "subtitle": "本人を表す項目" },
    { "name": "Age", "kind": "card", "lane": "personal", "stack": 1, "subtitle": "本人を表す項目 (数)" },
    { "name": "Email", "kind": "card", "lane": "contact", "stack": 0, "subtitle": "連絡先の項目" },
    {
      "name": "Country",
      "kind": "card",
      "lane": "contact",
      "stack": 1,
      "subtitle": "連絡先の項目 (所在)"
    },
    { "name": "Newsletter", "kind": "card", "lane": "prefs", "stack": 0, "subtitle": "希望を表す項目" }
  ],
  "flow": [],
  "states": {
    "fields": "[[\\"Name\\",\\"Alice Wonderland\\"],[\\"Email\\",\\"alice@example.com\\"],[\\"Age\\",\\"28\\"],[\\"Country\\",\\"Japan\\"],[\\"Newsletter\\",\\"Yes\\"]]"
  },
  "animation": [
    {
      "step": "入力の途中",
      "duration": 1.8,
      "focus": ["Name", "Age"],
      "set": { "fields": "[[\\"Name\\",\\"Alice Wonderland\\"],[\\"Age\\",\\"28\\"]]" },
      "body": "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。"
    },
    {
      "step": "連絡先まで",
      "duration": 1.8,
      "focus": ["Name", "Age", "Email", "Country"],
      "set": {
        "fields": "[[\\"Name\\",\\"Alice Wonderland\\"],[\\"Age\\",\\"28\\"],[\\"Email\\",\\"alice@example.com\\"],[\\"Country\\",\\"Japan\\"]]"
      },
      "body": "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。"
    },
    {
      "step": "送信の直前",
      "duration": 1.8,
      "focus": ["Name", "Age", "Email", "Country", "Newsletter"],
      "set": {
        "fields": "[[\\"Name\\",\\"Alice Wonderland\\"],[\\"Age\\",\\"28\\"],[\\"Email\\",\\"alice@example.com\\"],[\\"Country\\",\\"Japan\\"],[\\"Newsletter\\",\\"Yes\\"]]"
      },
      "body": "希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。"
    }
  ]
}`;

export const sourceYaml__monthCalendarView = `title: "1 か月を週ごとに並べる"
type: flow

readouts:
  cm: { kind: calendar-month, source: "days", monthName: "January 2026", color: "#2563eb", label: "Month view (7 column grid)" }

lanes:
  w1: { x: 0, width: 150 }
  w2: { x: 170, width: 150 }
  w3: { x: 340, width: 150 }
  w4: { x: 510, width: 200 }

states:
  days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"

actors:
  - Week 1: { kind: card, lane: w1, stack: 0, subtitle: "月の最初の週" }
  - Week 2: { kind: card, lane: w2, stack: 0, subtitle: "今日を含む週" }
  - Week 3: { kind: card, lane: w3, stack: 0, subtitle: "月の半ばの週" }
  - Week 4-5: { kind: card, lane: w4, stack: 0, subtitle: "月の終わりの週" }
  - Month total: { kind: card, lane: w4, stack: 1, subtitle: "月ぜんたいのまとめ" }

animation:
  - step: "月の初め" 1.8s
    focus: ["Week 1", "Week 2"]
    set:
      days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,false,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,false,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
    description: "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。"
  - step: "月の半ば" 1.8s
    focus: ["Week 1", "Week 2", "Week 3"]
    set:
      days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
    description: "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。"
  - step: "月の終わり" 1.8s
    focus: ["Week 1", "Week 2", "Week 3", "Week 4-5", "Month total"]
    set:
      days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
    description: "印が月の終わりまで並ぶ。 7 列の格子に予定の散らばりが読める形になる。"
`;

export const sourceJson__monthCalendarView = `{
  "title": "1 か月を週ごとに並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "cm",
      "kind": "calendar-month",
      "source": "days",
      "monthName": "January 2026",
      "color": "#2563eb",
      "label": "Month view (7 column grid)"
    }
  ],
  "lanes": {
    "w1": { "x": 0, "width": 150 },
    "w2": { "x": 170, "width": 150 },
    "w3": { "x": 340, "width": 150 },
    "w4": { "x": 510, "width": 200 }
  },
  "actors": [
    { "name": "Week 1", "kind": "card", "lane": "w1", "stack": 0, "subtitle": "月の最初の週" },
    { "name": "Week 2", "kind": "card", "lane": "w2", "stack": 0, "subtitle": "今日を含む週" },
    { "name": "Week 3", "kind": "card", "lane": "w3", "stack": 0, "subtitle": "月の半ばの週" },
    { "name": "Week 4-5", "kind": "card", "lane": "w4", "stack": 0, "subtitle": "月の終わりの週" },
    { "name": "Month total", "kind": "card", "lane": "w4", "stack": 1, "subtitle": "月ぜんたいのまとめ" }
  ],
  "flow": [],
  "states": {
    "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
  },
  "animation": [
    {
      "step": "月の初め",
      "duration": 1.8,
      "focus": ["Week 1", "Week 2"],
      "set": {
        "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,false,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,false,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
      },
      "body": "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。"
    },
    {
      "step": "月の半ば",
      "duration": 1.8,
      "focus": ["Week 1", "Week 2", "Week 3"],
      "set": {
        "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
      },
      "body": "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。"
    },
    {
      "step": "月の終わり",
      "duration": 1.8,
      "focus": ["Week 1", "Week 2", "Week 3", "Week 4-5", "Month total"],
      "set": {
        "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
      },
      "body": "印が月の終わりまで並ぶ。 7 列の格子に予定の散らばりが読める形になる。"
    }
  ]
}`;

export const sourceYaml__cliTerminalSession = `title: "コマンド 5 つを用途ごとに分ける"
type: flow

readouts:
  tm: { kind: terminal, source: "cmds", max: 10, color: "var(--d-dg-2)", label: "Session (CLI window)" }

lanes:
  fs: { x: 0, width: 220 }
  git: { x: 260, width: 220 }
  dev: { x: 520, width: 220 }

states:
  cmds: '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"],["$","pnpm test","Test Files  114 passed\\nTests  1649 passed"],["$","docker ps","CONTAINER ID   IMAGE\\n8f3a2b1c9d   nginx:latest"]]'

actors:
  - ls -la: { kind: card, lane: fs, stack: 0, subtitle: "file を見る · 出力が長い" }
  - cd projects: { kind: card, lane: fs, stack: 1, subtitle: "場所を移る · 出力が無い" }
  - git status: { kind: card, lane: git, stack: 0, subtitle: "履歴の状態を見る" }
  - pnpm test: { kind: card, lane: dev, stack: 0, subtitle: "検査を回す" }
  - docker ps: { kind: card, lane: dev, stack: 1, subtitle: "動いている入れ物を見る" }

animation:
  - step: "打ち始め" 1.8s
    focus: ["ls -la"]
    set:
      cmds: '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"]]'
    description: "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。"
  - step: "場所を移る" 1.8s
    focus: ["ls -la", "cd projects", "git status"]
    set:
      cmds: '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"]]'
    description: "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。"
  - step: "作業が進む" 1.8s
    focus: ["ls -la", "cd projects", "git status", "pnpm test", "docker ps"]
    set:
      cmds: '[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"],["$","pnpm test","Test Files  114 passed\\nTests  1649 passed"],["$","docker ps","CONTAINER ID   IMAGE\\n8f3a2b1c9d   nginx:latest"]]'
    description: "組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。"
`;

export const sourceJson__cliTerminalSession = `{
  "title": "コマンド 5 つを用途ごとに分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "tm",
      "kind": "terminal",
      "source": "cmds",
      "max": 10,
      "color": "var(--d-dg-2)",
      "label": "Session (CLI window)"
    }
  ],
  "lanes": {
    "fs": { "x": 0, "width": 220 },
    "git": { "x": 260, "width": 220 },
    "dev": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "ls -la",
      "kind": "card",
      "lane": "fs",
      "stack": 0,
      "subtitle": "file を見る · 出力が長い"
    },
    {
      "name": "cd projects",
      "kind": "card",
      "lane": "fs",
      "stack": 1,
      "subtitle": "場所を移る · 出力が無い"
    },
    { "name": "git status", "kind": "card", "lane": "git", "stack": 0, "subtitle": "履歴の状態を見る" },
    { "name": "pnpm test", "kind": "card", "lane": "dev", "stack": 0, "subtitle": "検査を回す" },
    {
      "name": "docker ps",
      "kind": "card",
      "lane": "dev",
      "stack": 1,
      "subtitle": "動いている入れ物を見る"
    }
  ],
  "flow": [],
  "states": {
    "cmds": "[[\\"$\\",\\"ls -la\\",\\"total 42\\\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md\\"],[\\"$\\",\\"cd projects\\",\\"\\"],[\\"$\\",\\"git status\\",\\"On branch main\\\\nnothing to commit, working tree clean\\"],[\\"$\\",\\"pnpm test\\",\\"Test Files  114 passed\\\\nTests  1649 passed\\"],[\\"$\\",\\"docker ps\\",\\"CONTAINER ID   IMAGE\\\\n8f3a2b1c9d   nginx:latest\\"]]"
  },
  "animation": [
    {
      "step": "打ち始め",
      "duration": 1.8,
      "focus": ["ls -la"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -la\\",\\"total 42\\\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md\\"]]"
      },
      "body": "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。"
    },
    {
      "step": "場所を移る",
      "duration": 1.8,
      "focus": ["ls -la", "cd projects", "git status"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -la\\",\\"total 42\\\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\"],[\\"$\\",\\"cd projects\\",\\"\\"],[\\"$\\",\\"git status\\",\\"On branch main\\\\nnothing to commit, working tree clean\\"]]"
      },
      "body": "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。"
    },
    {
      "step": "作業が進む",
      "duration": 1.8,
      "focus": ["ls -la", "cd projects", "git status", "pnpm test", "docker ps"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -la\\",\\"total 42\\\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\"],[\\"$\\",\\"cd projects\\",\\"\\"],[\\"$\\",\\"git status\\",\\"On branch main\\\\nnothing to commit, working tree clean\\"],[\\"$\\",\\"pnpm test\\",\\"Test Files  114 passed\\\\nTests  1649 passed\\"],[\\"$\\",\\"docker ps\\",\\"CONTAINER ID   IMAGE\\\\n8f3a2b1c9d   nginx:latest\\"]]"
      },
      "body": "組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。"
    }
  ]
}`;

export const sourceYaml__chessStartingBoard = `title: "駒 32 個を白黒と前後列で並べる"
type: flow

readouts:
  cb: { kind: chess-board, source: "pieces", cellSize: 28, label: "Position (8×8 board)" }

lanes:
  blackBack: { x: 0, width: 320 }
  blackPawn: { x: 340, width: 340 }
  whitePawn: { x: 700, width: 340 }
  whiteBack: { x: 1060, width: 320 }

states:
  pieces: '[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'

actors:
  - Black back: { kind: card, lane: blackBack, stack: 0, subtitle: "黒の奥の列 (♜♞♝♛♚♝♞♜)", posW: 270 }
  - Black pawns: { kind: card, lane: blackPawn, stack: 0, subtitle: "黒の手前の列 (♟)", posW: 290 }
  - White pawns: { kind: card, lane: whitePawn, stack: 0, subtitle: "白の手前の列 (♙)", posW: 290 }
  - White back: { kind: card, lane: whiteBack, stack: 0, subtitle: "白の奥の列 (♖♘♗♕♔♗♘♖)", posW: 270 }

animation:
  - step: "白を並べる" 1.8s
    focus: ["White back", "White pawns"]
    set:
      pieces: '[["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'
    description: "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。"
  - step: "黒の手前を置く" 1.8s
    focus: ["White back", "White pawns", "Black pawns"]
    set:
      pieces: '[["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'
    description: "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。"
  - step: "開始の形" 1.8s
    focus: ["Black back", "Black pawns", "White pawns", "White back"]
    set:
      pieces: '[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'
    description: "上下の端 2 列ずつが埋まり、中央 4 列が空く。 開始の形が盤の上に揃う。"
`;

export const sourceJson__chessStartingBoard = `{
  "title": "駒 32 個を白黒と前後列で並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "cb",
      "kind": "chess-board",
      "source": "pieces",
      "cellSize": 28,
      "label": "Position (8×8 board)"
    }
  ],
  "lanes": {
    "blackBack": { "x": 0, "width": 320 },
    "blackPawn": { "x": 340, "width": 340 },
    "whitePawn": { "x": 700, "width": 340 },
    "whiteBack": { "x": 1060, "width": 320 }
  },
  "actors": [
    {
      "name": "Black back",
      "kind": "card",
      "lane": "blackBack",
      "stack": 0,
      "subtitle": "黒の奥の列 (♜♞♝♛♚♝♞♜)",
      "posW": 270
    },
    {
      "name": "Black pawns",
      "kind": "card",
      "lane": "blackPawn",
      "stack": 0,
      "subtitle": "黒の手前の列 (♟)",
      "posW": 290
    },
    {
      "name": "White pawns",
      "kind": "card",
      "lane": "whitePawn",
      "stack": 0,
      "subtitle": "白の手前の列 (♙)",
      "posW": 290
    },
    {
      "name": "White back",
      "kind": "card",
      "lane": "whiteBack",
      "stack": 0,
      "subtitle": "白の奥の列 (♖♘♗♕♔♗♘♖)",
      "posW": 270
    }
  ],
  "flow": [],
  "states": {
    "pieces": "[[\\"a\\",8,\\"♜\\"],[\\"b\\",8,\\"♞\\"],[\\"c\\",8,\\"♝\\"],[\\"d\\",8,\\"♛\\"],[\\"e\\",8,\\"♚\\"],[\\"f\\",8,\\"♝\\"],[\\"g\\",8,\\"♞\\"],[\\"h\\",8,\\"♜\\"],[\\"a\\",7,\\"♟\\"],[\\"b\\",7,\\"♟\\"],[\\"c\\",7,\\"♟\\"],[\\"d\\",7,\\"♟\\"],[\\"e\\",7,\\"♟\\"],[\\"f\\",7,\\"♟\\"],[\\"g\\",7,\\"♟\\"],[\\"h\\",7,\\"♟\\"],[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
  },
  "animation": [
    {
      "step": "白を並べる",
      "duration": 1.8,
      "focus": ["White back", "White pawns"],
      "set": {
        "pieces": "[[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
      },
      "body": "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。"
    },
    {
      "step": "黒の手前を置く",
      "duration": 1.8,
      "focus": ["White back", "White pawns", "Black pawns"],
      "set": {
        "pieces": "[[\\"a\\",7,\\"♟\\"],[\\"b\\",7,\\"♟\\"],[\\"c\\",7,\\"♟\\"],[\\"d\\",7,\\"♟\\"],[\\"e\\",7,\\"♟\\"],[\\"f\\",7,\\"♟\\"],[\\"g\\",7,\\"♟\\"],[\\"h\\",7,\\"♟\\"],[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
      },
      "body": "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。"
    },
    {
      "step": "開始の形",
      "duration": 1.8,
      "focus": ["Black back", "Black pawns", "White pawns", "White back"],
      "set": {
        "pieces": "[[\\"a\\",8,\\"♜\\"],[\\"b\\",8,\\"♞\\"],[\\"c\\",8,\\"♝\\"],[\\"d\\",8,\\"♛\\"],[\\"e\\",8,\\"♚\\"],[\\"f\\",8,\\"♝\\"],[\\"g\\",8,\\"♞\\"],[\\"h\\",8,\\"♜\\"],[\\"a\\",7,\\"♟\\"],[\\"b\\",7,\\"♟\\"],[\\"c\\",7,\\"♟\\"],[\\"d\\",7,\\"♟\\"],[\\"e\\",7,\\"♟\\"],[\\"f\\",7,\\"♟\\"],[\\"g\\",7,\\"♟\\"],[\\"h\\",7,\\"♟\\"],[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
      },
      "body": "上下の端 2 列ずつが埋まり、中央 4 列が空く。 開始の形が盤の上に揃う。"
    }
  ]
}`;

export const sourceYaml__sprintKanbanBoard = `title: "6 タスクを未着手 / 進行中 / 完了で分ける"
type: flow

readouts:
  kb: { kind: kanban-board, source: "tasks", columnWidth: 140, max: 5, label: "Sprint kanban" }

lanes:
  todo: { x: 0, width: 220 }
  inprogress: { x: 260, width: 220 }
  done: { x: 520, width: 220 }

states:
  tasks: '[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]'

actors:
  - Todo2: { kind: card, lane: todo, stack: 0, subtitle: "まだ手を付けていない列", title: "Todo" }
  - In Progress: { kind: card, lane: inprogress, stack: 0, subtitle: "いま進めている列" }
  - Done2: { kind: card, lane: done, stack: 0, subtitle: "終わった列", title: "Done" }

animation:
  - step: "着手前" 1.8s
    focus: ["Todo2"]
    set:
      tasks: '[["todo","Design API schema","high"],["todo","Write docs","low"],["todo","Impl auth flow","high"],["todo","Migration script","med"],["todo","Setup CI","med"],["todo","Repo bootstrap","low"]]'
    description: "札がすべて左の列に積まれる。 重さの違いは札の色として出る。"
  - step: "動き出す" 1.8s
    focus: ["Todo2", "In Progress"]
    set:
      tasks: '[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["todo","Repo bootstrap","low"]]'
    description: "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。"
  - step: "終盤に入る" 1.8s
    focus: ["Todo2", "In Progress", "Done2"]
    set:
      tasks: '[["todo","Design API schema","high"],["inprogress","Write docs","low"],["inprogress","Impl auth flow","high"],["done","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]'
    description: "右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。"
`;

export const sourceJson__sprintKanbanBoard = `{
  "title": "6 タスクを未着手 / 進行中 / 完了で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "kb",
      "kind": "kanban-board",
      "source": "tasks",
      "columnWidth": 140,
      "max": 5,
      "label": "Sprint kanban"
    }
  ],
  "lanes": {
    "todo": { "x": 0, "width": 220 },
    "inprogress": { "x": 260, "width": 220 },
    "done": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "Todo2",
      "kind": "card",
      "lane": "todo",
      "stack": 0,
      "subtitle": "まだ手を付けていない列",
      "title": "Todo"
    },
    {
      "name": "In Progress",
      "kind": "card",
      "lane": "inprogress",
      "stack": 0,
      "subtitle": "いま進めている列"
    },
    {
      "name": "Done2",
      "kind": "card",
      "lane": "done",
      "stack": 0,
      "subtitle": "終わった列",
      "title": "Done"
    }
  ],
  "flow": [],
  "states": {
    "tasks": "[[\\"todo\\",\\"Design API schema\\",\\"high\\"],[\\"todo\\",\\"Write docs\\",\\"low\\"],[\\"inprogress\\",\\"Impl auth flow\\",\\"high\\"],[\\"inprogress\\",\\"Migration script\\",\\"med\\"],[\\"done\\",\\"Setup CI\\",\\"med\\"],[\\"done\\",\\"Repo bootstrap\\",\\"low\\"]]"
  },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["Todo2"],
      "set": {
        "tasks": "[[\\"todo\\",\\"Design API schema\\",\\"high\\"],[\\"todo\\",\\"Write docs\\",\\"low\\"],[\\"todo\\",\\"Impl auth flow\\",\\"high\\"],[\\"todo\\",\\"Migration script\\",\\"med\\"],[\\"todo\\",\\"Setup CI\\",\\"med\\"],[\\"todo\\",\\"Repo bootstrap\\",\\"low\\"]]"
      },
      "body": "札がすべて左の列に積まれる。 重さの違いは札の色として出る。"
    },
    {
      "step": "動き出す",
      "duration": 1.8,
      "focus": ["Todo2", "In Progress"],
      "set": {
        "tasks": "[[\\"todo\\",\\"Design API schema\\",\\"high\\"],[\\"todo\\",\\"Write docs\\",\\"low\\"],[\\"inprogress\\",\\"Impl auth flow\\",\\"high\\"],[\\"inprogress\\",\\"Migration script\\",\\"med\\"],[\\"done\\",\\"Setup CI\\",\\"med\\"],[\\"todo\\",\\"Repo bootstrap\\",\\"low\\"]]"
      },
      "body": "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。"
    },
    {
      "step": "終盤に入る",
      "duration": 1.8,
      "focus": ["Todo2", "In Progress", "Done2"],
      "set": {
        "tasks": "[[\\"todo\\",\\"Design API schema\\",\\"high\\"],[\\"inprogress\\",\\"Write docs\\",\\"low\\"],[\\"inprogress\\",\\"Impl auth flow\\",\\"high\\"],[\\"done\\",\\"Migration script\\",\\"med\\"],[\\"done\\",\\"Setup CI\\",\\"med\\"],[\\"done\\",\\"Repo bootstrap\\",\\"low\\"]]"
      },
      "body": "右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。"
    }
  ]
}`;

export const sourceYaml__docsBreadcrumb = `title: "階層 4 段のパンくずを順に辿る"
type: flow

readouts:
  bc: { kind: breadcrumb, source: "path", currentSource: "cur", color: "#2563eb", label: "Path" }

lanes:
  col1: { x: 0, width: 270 }
  col2: { x: 310, width: 300 }

states:
  path: '["Home","Docs","API","Reference"]'
  cur: 2

actors:
  - Home: { kind: card, lane: col1, stack: 0, subtitle: "最上位の階層", posW: 190 }
  - Docs: { kind: card, lane: col2, stack: 0, subtitle: "Home の下にある階層", posW: 140 }
  - API: { kind: card, lane: col1, stack: 1, subtitle: "Reference の上にある階層", posW: 220 }
  - Reference: { kind: card, lane: col2, stack: 1, subtitle: "最も深い階層", posW: 250 }

flow:
  - Home -> Docs: "→" (info)
  - Docs -> API: "→" (accent)
  - API -> Reference: "→" (info)

animation:
  - step: "最上位に居る" 1.8s
    focus: ["Home"]
    set:
      cur: 0
    description: "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。"
  - step: "中ほどへ降りる" 1.8s
    focus: ["Home", "Docs", "API"]
    set:
      cur: 2
    description: "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。"
  - step: "最も深い階層" 1.8s
    focus: ["Home", "Docs", "API", "Reference"]
    set:
      cur: 3
    description: "末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。"
`;

export const sourceJson__docsBreadcrumb = `{
  "title": "階層 4 段のパンくずを順に辿る",
  "type": "flow",
  "readouts": [
    {
      "id": "bc",
      "kind": "breadcrumb",
      "source": "path",
      "currentSource": "cur",
      "color": "#2563eb",
      "label": "Path"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 270 },
    "col2": { "x": 310, "width": 300 }
  },
  "actors": [
    {
      "name": "Home",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最上位の階層",
      "posW": 190
    },
    {
      "name": "Docs",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "Home の下にある階層",
      "posW": 140
    },
    {
      "name": "API",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "Reference の上にある階層",
      "posW": 220
    },
    {
      "name": "Reference",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "最も深い階層",
      "posW": 250
    }
  ],
  "flow": [
    { "from": "Home", "to": "Docs", "label": "→", "tone": "info" },
    { "from": "Docs", "to": "API", "label": "→", "tone": "accent" },
    { "from": "API", "to": "Reference", "label": "→", "tone": "info" }
  ],
  "states": { "path": "[\\"Home\\",\\"Docs\\",\\"API\\",\\"Reference\\"]", "cur": 2 },
  "animation": [
    {
      "step": "最上位に居る",
      "duration": 1.8,
      "focus": ["Home"],
      "set": { "cur": 0 },
      "body": "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。"
    },
    {
      "step": "中ほどへ降りる",
      "duration": 1.8,
      "focus": ["Home", "Docs", "API"],
      "set": { "cur": 2 },
      "body": "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。"
    },
    {
      "step": "最も深い階層",
      "duration": 1.8,
      "focus": ["Home", "Docs", "API", "Reference"],
      "set": { "cur": 3 },
      "body": "末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。"
    }
  ]
}`;

export const sourceYaml__dayScheduleTimeline = `title: "1 日の予定を朝 / 昼 / 夜で分ける"
type: flow

readouts:
  tv: { kind: timeline-vertical, source: "events", color: "#2563eb", max: 8, label: "Day events" }

lanes:
  morning: { x: 0, width: 240 }
  afternoon: { x: 280, width: 240 }
  evening: { x: 560, width: 240 }

states:
  events: '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]'

actors:
  - Morning2: { kind: card, lane: morning, stack: 0, subtitle: "午前の時間帯", title: "Morning" }
  - Afternoon2: { kind: card, lane: afternoon, stack: 0, subtitle: "午後の時間帯", title: "Afternoon" }
  - Evening2: { kind: card, lane: evening, stack: 0, subtitle: "夜の時間帯", title: "Evening" }

animation:
  - step: "午前の予定" 1.8s
    focus: ["Morning2"]
    set:
      events: '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"]]'
    description: "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。"
  - step: "午後まで" 1.8s
    focus: ["Morning2", "Afternoon2"]
    set:
      events: '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging"],["16:00","1-on-1","career discussion"]]'
    description: "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。"
  - step: "1 日ぶん" 1.8s
    focus: ["Morning2", "Afternoon2", "Evening2"]
    set:
      events: '[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]'
    description: "点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。"
`;

export const sourceJson__dayScheduleTimeline = `{
  "title": "1 日の予定を朝 / 昼 / 夜で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "tv",
      "kind": "timeline-vertical",
      "source": "events",
      "color": "#2563eb",
      "max": 8,
      "label": "Day events"
    }
  ],
  "lanes": {
    "morning": { "x": 0, "width": 240 },
    "afternoon": { "x": 280, "width": 240 },
    "evening": { "x": 560, "width": 240 }
  },
  "actors": [
    {
      "name": "Morning2",
      "kind": "card",
      "lane": "morning",
      "stack": 0,
      "subtitle": "午前の時間帯",
      "title": "Morning"
    },
    {
      "name": "Afternoon2",
      "kind": "card",
      "lane": "afternoon",
      "stack": 0,
      "subtitle": "午後の時間帯",
      "title": "Afternoon"
    },
    {
      "name": "Evening2",
      "kind": "card",
      "lane": "evening",
      "stack": 0,
      "subtitle": "夜の時間帯",
      "title": "Evening"
    }
  ],
  "flow": [],
  "states": {
    "events": "[[\\"09:00\\",\\"Standup\\",\\"team sync\\"],[\\"10:30\\",\\"Design review\\",\\"3 proposals\\"],[\\"14:00\\",\\"Deploy staging\\",\\"v1.2.0\\"],[\\"16:00\\",\\"1-on-1\\",\\"career discussion\\"],[\\"19:30\\",\\"Retrospective\\",\\"sprint 42 close\\"]]"
  },
  "animation": [
    {
      "step": "午前の予定",
      "duration": 1.8,
      "focus": ["Morning2"],
      "set": {
        "events": "[[\\"09:00\\",\\"Standup\\",\\"team sync\\"],[\\"10:30\\",\\"Design review\\",\\"3 proposals\\"]]"
      },
      "body": "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。"
    },
    {
      "step": "午後まで",
      "duration": 1.8,
      "focus": ["Morning2", "Afternoon2"],
      "set": {
        "events": "[[\\"09:00\\",\\"Standup\\",\\"team sync\\"],[\\"10:30\\",\\"Design review\\",\\"3 proposals\\"],[\\"14:00\\",\\"Deploy staging\\"],[\\"16:00\\",\\"1-on-1\\",\\"career discussion\\"]]"
      },
      "body": "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。"
    },
    {
      "step": "1 日ぶん",
      "duration": 1.8,
      "focus": ["Morning2", "Afternoon2", "Evening2"],
      "set": {
        "events": "[[\\"09:00\\",\\"Standup\\",\\"team sync\\"],[\\"10:30\\",\\"Design review\\",\\"3 proposals\\"],[\\"14:00\\",\\"Deploy staging\\",\\"v1.2.0\\"],[\\"16:00\\",\\"1-on-1\\",\\"career discussion\\"],[\\"19:30\\",\\"Retrospective\\",\\"sprint 42 close\\"]]"
      },
      "body": "点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。"
    }
  ]
}`;

export const sourceYaml__serverUptimeStatus = `title: "稼働 6 区間を稼働 / 待機 / 異常で分ける"
type: flow

readouts:
  st: { kind: status-timeline, source: "events", max: 8, label: "Server status" }

lanes:
  active: { x: 0, width: 240 }
  idle: { x: 280, width: 240 }
  error: { x: 560, width: 240 }

states:
  events: '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]'

actors:
  - Active2: { kind: card, lane: active, stack: 0, subtitle: "稼働している区間 (緑)", title: "Active" }
  - Idle2: { kind: card, lane: idle, stack: 0, subtitle: "待機している区間 (灰)", title: "Idle" }
  - Error2: { kind: card, lane: error, stack: 0, subtitle: "異常が出た区間 (赤)", title: "Error" }

animation:
  - step: "平常の稼働" 1.8s
    focus: ["Active2"]
    set:
      events: '[["09:00","active"],["09:15","active"]]'
    description: "同じ色の区間が続く。 状態の名は 4 文字までに切って大文字で出ることが読める。"
  - step: "異常が出る" 1.8s
    focus: ["Active2", "Idle2", "Error2"]
    set:
      events: '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"]]'
    description: "灰と赤の区間が混じる。 色の切り替わりで、いつ状態が変わったかが読み取れる。"
  - step: "復帰する" 1.8s
    focus: ["Active2", "Error2"]
    set:
      events: '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]'
    description: "末尾がまた緑に戻る。 赤が 1 区間だけであることが、帯の中の面積として読める。"
`;

export const sourceJson__serverUptimeStatus = `{
  "title": "稼働 6 区間を稼働 / 待機 / 異常で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "st",
      "kind": "status-timeline",
      "source": "events",
      "max": 8,
      "label": "Server status"
    }
  ],
  "lanes": {
    "active": { "x": 0, "width": 240 },
    "idle": { "x": 280, "width": 240 },
    "error": { "x": 560, "width": 240 }
  },
  "actors": [
    {
      "name": "Active2",
      "kind": "card",
      "lane": "active",
      "stack": 0,
      "subtitle": "稼働している区間 (緑)",
      "title": "Active"
    },
    {
      "name": "Idle2",
      "kind": "card",
      "lane": "idle",
      "stack": 0,
      "subtitle": "待機している区間 (灰)",
      "title": "Idle"
    },
    {
      "name": "Error2",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "異常が出た区間 (赤)",
      "title": "Error"
    }
  ],
  "flow": [],
  "states": {
    "events": "[[\\"09:00\\",\\"active\\"],[\\"09:15\\",\\"active\\"],[\\"10:30\\",\\"idle\\"],[\\"11:00\\",\\"error\\"],[\\"11:15\\",\\"active\\"],[\\"12:00\\",\\"active\\"]]"
  },
  "animation": [
    {
      "step": "平常の稼働",
      "duration": 1.8,
      "focus": ["Active2"],
      "set": { "events": "[[\\"09:00\\",\\"active\\"],[\\"09:15\\",\\"active\\"]]" },
      "body": "同じ色の区間が続く。 状態の名は 4 文字までに切って大文字で出ることが読める。"
    },
    {
      "step": "異常が出る",
      "duration": 1.8,
      "focus": ["Active2", "Idle2", "Error2"],
      "set": {
        "events": "[[\\"09:00\\",\\"active\\"],[\\"09:15\\",\\"active\\"],[\\"10:30\\",\\"idle\\"],[\\"11:00\\",\\"error\\"]]"
      },
      "body": "灰と赤の区間が混じる。 色の切り替わりで、いつ状態が変わったかが読み取れる。"
    },
    {
      "step": "復帰する",
      "duration": 1.8,
      "focus": ["Active2", "Error2"],
      "set": {
        "events": "[[\\"09:00\\",\\"active\\"],[\\"09:15\\",\\"active\\"],[\\"10:30\\",\\"idle\\"],[\\"11:00\\",\\"error\\"],[\\"11:15\\",\\"active\\"],[\\"12:00\\",\\"active\\"]]"
      },
      "body": "末尾がまた緑に戻る。 赤が 1 区間だけであることが、帯の中の面積として読める。"
    }
  ]
}`;

export const sourceYaml__weekCalendarView = `title: "1 週間を曜日ごとに並べる"
type: flow

readouts:
  cw: { kind: calendar-week, source: "week", cellSize: 40, color: "#2563eb", label: "This week" }

lanes:
  mon: { x: 0, width: 160 }
  tue: { x: 185, width: 160 }
  wed: { x: 370, width: 210 }
  thu: { x: 605, width: 160 }
  fri: { x: 790, width: 160 }
  sat: { x: 975, width: 160 }
  sun: { x: 1160, width: 160 }

states:
  week: '[["Mon",true,false],["Tue",false,false],["Wed",true,true],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]'

actors:
  - Mon2: { kind: card, lane: mon, stack: 0, subtitle: "予定を持つ日", posW: 110, title: "Mon" }
  - Tue2: { kind: card, lane: tue, stack: 0, subtitle: "予定を持たない日", posW: 110, title: "Tue" }
  - Wed2: { kind: card, lane: wed, stack: 0, subtitle: "予定を持つ日", posW: 160, title: "Wed" }
  - Thu2: { kind: card, lane: thu, stack: 0, subtitle: "予定を持たない日", posW: 110, title: "Thu" }
  - Fri2: { kind: card, lane: fri, stack: 0, subtitle: "予定を持つ日", posW: 110, title: "Fri" }
  - Sat2: { kind: card, lane: sat, stack: 0, subtitle: "予定を持たない日 (週末)", posW: 110, title: "Sat" }
  - Sun2: { kind: card, lane: sun, stack: 0, subtitle: "予定を持たない日 (週明け前)", posW: 110, title: "Sun" }

animation:
  - step: "週の始まり" 1.8s
    focus: ["Mon2"]
    set:
      week: '[["Mon",true,true],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]'
    description: "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。"
  - step: "週の半ば" 1.8s
    focus: ["Mon2", "Wed2"]
    set:
      week: '[["Mon",true,false],["Tue",false,false],["Wed",true,true],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]'
    description: "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。"
  - step: "週の終わり" 1.8s
    focus: ["Mon2", "Wed2", "Fri2", "Sat2", "Sun2"]
    set:
      week: '[["Mon",true,false],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,true],["Sat",false,false],["Sun",false,false]]'
    description: "塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。"
`;

export const sourceJson__weekCalendarView = `{
  "title": "1 週間を曜日ごとに並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "cw",
      "kind": "calendar-week",
      "source": "week",
      "cellSize": 40,
      "color": "#2563eb",
      "label": "This week"
    }
  ],
  "lanes": {
    "mon": { "x": 0, "width": 160 },
    "tue": { "x": 185, "width": 160 },
    "wed": { "x": 370, "width": 210 },
    "thu": { "x": 605, "width": 160 },
    "fri": { "x": 790, "width": 160 },
    "sat": { "x": 975, "width": 160 },
    "sun": { "x": 1160, "width": 160 }
  },
  "actors": [
    {
      "name": "Mon2",
      "kind": "card",
      "lane": "mon",
      "stack": 0,
      "subtitle": "予定を持つ日",
      "posW": 110,
      "title": "Mon"
    },
    {
      "name": "Tue2",
      "kind": "card",
      "lane": "tue",
      "stack": 0,
      "subtitle": "予定を持たない日",
      "posW": 110,
      "title": "Tue"
    },
    {
      "name": "Wed2",
      "kind": "card",
      "lane": "wed",
      "stack": 0,
      "subtitle": "予定を持つ日",
      "posW": 160,
      "title": "Wed"
    },
    {
      "name": "Thu2",
      "kind": "card",
      "lane": "thu",
      "stack": 0,
      "subtitle": "予定を持たない日",
      "posW": 110,
      "title": "Thu"
    },
    {
      "name": "Fri2",
      "kind": "card",
      "lane": "fri",
      "stack": 0,
      "subtitle": "予定を持つ日",
      "posW": 110,
      "title": "Fri"
    },
    {
      "name": "Sat2",
      "kind": "card",
      "lane": "sat",
      "stack": 0,
      "subtitle": "予定を持たない日 (週末)",
      "posW": 110,
      "title": "Sat"
    },
    {
      "name": "Sun2",
      "kind": "card",
      "lane": "sun",
      "stack": 0,
      "subtitle": "予定を持たない日 (週明け前)",
      "posW": 110,
      "title": "Sun"
    }
  ],
  "flow": [],
  "states": {
    "week": "[[\\"Mon\\",true,false],[\\"Tue\\",false,false],[\\"Wed\\",true,true],[\\"Thu\\",false,false],[\\"Fri\\",true,false],[\\"Sat\\",false,false],[\\"Sun\\",false,false]]"
  },
  "animation": [
    {
      "step": "週の始まり",
      "duration": 1.8,
      "focus": ["Mon2"],
      "set": {
        "week": "[[\\"Mon\\",true,true],[\\"Tue\\",false,false],[\\"Wed\\",true,false],[\\"Thu\\",false,false],[\\"Fri\\",true,false],[\\"Sat\\",false,false],[\\"Sun\\",false,false]]"
      },
      "body": "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。"
    },
    {
      "step": "週の半ば",
      "duration": 1.8,
      "focus": ["Mon2", "Wed2"],
      "set": {
        "week": "[[\\"Mon\\",true,false],[\\"Tue\\",false,false],[\\"Wed\\",true,true],[\\"Thu\\",false,false],[\\"Fri\\",true,false],[\\"Sat\\",false,false],[\\"Sun\\",false,false]]"
      },
      "body": "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。"
    },
    {
      "step": "週の終わり",
      "duration": 1.8,
      "focus": ["Mon2", "Wed2", "Fri2", "Sat2", "Sun2"],
      "set": {
        "week": "[[\\"Mon\\",true,false],[\\"Tue\\",false,false],[\\"Wed\\",true,false],[\\"Thu\\",false,false],[\\"Fri\\",true,true],[\\"Sat\\",false,false],[\\"Sun\\",false,false]]"
      },
      "body": "塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。"
    }
  ]
}`;

export const sourceYaml__teamKpiComparison = `title: "2 チームの成績を並べて比べる"
type: flow

readouts:
  kc: { kind: kpi-comparison, source: "teams", max: 100, colorA: "#2563eb", colorB: "#f97316", label: "Score compare" }

lanes:
  teamA: { x: 0, width: 340 }
  teamB: { x: 380, width: 340 }

states:
  teams: '[["Team A",82],["Team B",65]]'

actors:
  - Team A: { kind: card, lane: teamA, stack: 0, subtitle: "上の帯 (青)" }
  - Velocity: { kind: card, lane: teamA, stack: 1, subtitle: "上の帯が表す量" }
  - Team B: { kind: card, lane: teamB, stack: 0, subtitle: "下の帯 (橙)" }
  - Velocity2: { kind: card, lane: teamB, stack: 1, subtitle: "下の帯が表す量", title: "Velocity" }

flow:
  - Team A -> Team B: "差" (warning)

animation:
  - step: "差が大きい" 1.8s
    focus: ["Team A", "Team B"]
    set:
      teams: '[["Team A",82],["Team B",41]]'
    description: "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。"
  - step: "追い上げる" 1.8s
    focus: ["Team A", "Velocity", "Team B"]
    set:
      teams: '[["Team A",82],["Team B",65]]'
    description: "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。"
  - step: "ほぼ並ぶ" 1.8s
    focus: ["Team A", "Velocity", "Team B", "Velocity2"]
    set:
      teams: '[["Team A",84],["Team B",80]]'
    description: "2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。"
`;

export const sourceJson__teamKpiComparison = `{
  "title": "2 チームの成績を並べて比べる",
  "type": "flow",
  "readouts": [
    {
      "id": "kc",
      "kind": "kpi-comparison",
      "source": "teams",
      "max": 100,
      "colorA": "#2563eb",
      "colorB": "#f97316",
      "label": "Score compare"
    }
  ],
  "lanes": {
    "teamA": { "x": 0, "width": 340 },
    "teamB": { "x": 380, "width": 340 }
  },
  "actors": [
    { "name": "Team A", "kind": "card", "lane": "teamA", "stack": 0, "subtitle": "上の帯 (青)" },
    { "name": "Velocity", "kind": "card", "lane": "teamA", "stack": 1, "subtitle": "上の帯が表す量" },
    { "name": "Team B", "kind": "card", "lane": "teamB", "stack": 0, "subtitle": "下の帯 (橙)" },
    {
      "name": "Velocity2",
      "kind": "card",
      "lane": "teamB",
      "stack": 1,
      "subtitle": "下の帯が表す量",
      "title": "Velocity"
    }
  ],
  "flow": [
    { "from": "Team A", "to": "Team B", "label": "差", "tone": "warning" }
  ],
  "states": { "teams": "[[\\"Team A\\",82],[\\"Team B\\",65]]" },
  "animation": [
    {
      "step": "差が大きい",
      "duration": 1.8,
      "focus": ["Team A", "Team B"],
      "set": { "teams": "[[\\"Team A\\",82],[\\"Team B\\",41]]" },
      "body": "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。"
    },
    {
      "step": "追い上げる",
      "duration": 1.8,
      "focus": ["Team A", "Velocity", "Team B"],
      "set": { "teams": "[[\\"Team A\\",82],[\\"Team B\\",65]]" },
      "body": "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。"
    },
    {
      "step": "ほぼ並ぶ",
      "duration": 1.8,
      "focus": ["Team A", "Velocity", "Team B", "Velocity2"],
      "set": { "teams": "[[\\"Team A\\",84],[\\"Team B\\",80]]" },
      "body": "2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。"
    }
  ]
}`;

export const sourceYaml__publishWorkflowSteps = `title: "記事公開の 4 工程を順に追う"
type: flow

readouts:
  sp: { kind: step-progress, source: "cur", stepsSource: "steps", color: "#2563eb", label: "Workflow" }

lanes:
  col1: { x: 0, width: 300 }
  col2: { x: 340, width: 270 }

states:
  steps: '["Draft","Review","Approve","Publish"]'
  cur: 2

actors:
  - Draft: { kind: card, lane: col1, stack: 0, subtitle: "最初の工程", posW: 190 }
  - Review: { kind: card, lane: col2, stack: 0, subtitle: "Draft の次の工程", posW: 190 }
  - Approve: { kind: card, lane: col1, stack: 1, subtitle: "Publish の直前の工程", posW: 250 }
  - Publish: { kind: card, lane: col2, stack: 1, subtitle: "最後の工程", posW: 220 }

flow:
  - Draft -> Review: "submit" (success)
  - Review -> Approve: "reviewed" (info)
  - Approve -> Publish: "publish" (accent)

animation:
  - step: "書き始め" 1.8s
    focus: ["Draft"]
    set:
      cur: 0
    description: "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。"
  - step: "確認を経る" 1.8s
    focus: ["Draft", "Review", "Approve"]
    set:
      cur: 2
    description: "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。"
  - step: "公開する" 1.8s
    focus: ["Draft", "Review", "Approve", "Publish"]
    set:
      cur: 3
    description: "末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。"
`;

export const sourceJson__publishWorkflowSteps = `{
  "title": "記事公開の 4 工程を順に追う",
  "type": "flow",
  "readouts": [
    {
      "id": "sp",
      "kind": "step-progress",
      "source": "cur",
      "stepsSource": "steps",
      "color": "#2563eb",
      "label": "Workflow"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 300 },
    "col2": { "x": 340, "width": 270 }
  },
  "actors": [
    {
      "name": "Draft",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最初の工程",
      "posW": 190
    },
    {
      "name": "Review",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "Draft の次の工程",
      "posW": 190
    },
    {
      "name": "Approve",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "Publish の直前の工程",
      "posW": 250
    },
    {
      "name": "Publish",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "最後の工程",
      "posW": 220
    }
  ],
  "flow": [
    { "from": "Draft", "to": "Review", "label": "submit", "tone": "success" },
    { "from": "Review", "to": "Approve", "label": "reviewed", "tone": "info" },
    { "from": "Approve", "to": "Publish", "label": "publish", "tone": "accent" }
  ],
  "states": { "steps": "[\\"Draft\\",\\"Review\\",\\"Approve\\",\\"Publish\\"]", "cur": 2 },
  "animation": [
    {
      "step": "書き始め",
      "duration": 1.8,
      "focus": ["Draft"],
      "set": { "cur": 0 },
      "body": "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。"
    },
    {
      "step": "確認を経る",
      "duration": 1.8,
      "focus": ["Draft", "Review", "Approve"],
      "set": { "cur": 2 },
      "body": "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。"
    },
    {
      "step": "公開する",
      "duration": 1.8,
      "focus": ["Draft", "Review", "Approve", "Publish"],
      "set": { "cur": 3 },
      "body": "末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。"
    }
  ]
}`;

export const sourceYaml__teamPresenceStatus = `title: "5 人の在席を在席 / 離席 / 不在で分ける"
type: flow

readouts:
  up: { kind: user-presence, source: "team", max: 6, label: "Team status" }

lanes:
  online: { x: 0, width: 240 }
  away: { x: 280, width: 240 }
  offline: { x: 560, width: 240 }

states:
  team: '[["Alice","online"],["Bob","away"],["Carol","online"],["Dan","offline"],["Eve","online"]]'

actors:
  - Alice: { kind: card, lane: online, stack: 0, subtitle: "在席の人 (緑の丸)" }
  - Carol: { kind: card, lane: online, stack: 1, subtitle: "在席の人 (緑の丸)" }
  - Eve: { kind: card, lane: online, stack: 2, subtitle: "在席の人 (緑の丸)" }
  - Bob: { kind: card, lane: away, stack: 0, subtitle: "離席の人 (黄の丸)" }
  - Dan: { kind: card, lane: offline, stack: 0, subtitle: "不在の人 (灰の丸)" }

animation:
  - step: "朝の在席" 1.8s
    focus: ["Dan"]
    set:
      team: '[["Alice","offline"],["Bob","offline"],["Carol","offline"],["Dan","offline"],["Eve","offline"]]'
    description: "全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。"
  - step: "上限ちょうど" 1.8s
    focus: ["Alice", "Bob", "Dan"]
    set:
      team: '[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"]]'
    description: "6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。"
  - step: "上限を超える" 1.8s
    focus: ["Alice", "Carol", "Eve", "Bob", "Dan"]
    set:
      team: '[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"],["Grace","away"]]'
    description: "7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。"
`;

export const sourceJson__teamPresenceStatus = `{
  "title": "5 人の在席を在席 / 離席 / 不在で分ける",
  "type": "flow",
  "readouts": [
    { "id": "up", "kind": "user-presence", "source": "team", "max": 6, "label": "Team status" }
  ],
  "lanes": {
    "online": { "x": 0, "width": 240 },
    "away": { "x": 280, "width": 240 },
    "offline": { "x": 560, "width": 240 }
  },
  "actors": [
    { "name": "Alice", "kind": "card", "lane": "online", "stack": 0, "subtitle": "在席の人 (緑の丸)" },
    { "name": "Carol", "kind": "card", "lane": "online", "stack": 1, "subtitle": "在席の人 (緑の丸)" },
    { "name": "Eve", "kind": "card", "lane": "online", "stack": 2, "subtitle": "在席の人 (緑の丸)" },
    { "name": "Bob", "kind": "card", "lane": "away", "stack": 0, "subtitle": "離席の人 (黄の丸)" },
    { "name": "Dan", "kind": "card", "lane": "offline", "stack": 0, "subtitle": "不在の人 (灰の丸)" }
  ],
  "flow": [],
  "states": {
    "team": "[[\\"Alice\\",\\"online\\"],[\\"Bob\\",\\"away\\"],[\\"Carol\\",\\"online\\"],[\\"Dan\\",\\"offline\\"],[\\"Eve\\",\\"online\\"]]"
  },
  "animation": [
    {
      "step": "朝の在席",
      "duration": 1.8,
      "focus": ["Dan"],
      "set": {
        "team": "[[\\"Alice\\",\\"offline\\"],[\\"Bob\\",\\"offline\\"],[\\"Carol\\",\\"offline\\"],[\\"Dan\\",\\"offline\\"],[\\"Eve\\",\\"offline\\"]]"
      },
      "body": "全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。"
    },
    {
      "step": "上限ちょうど",
      "duration": 1.8,
      "focus": ["Alice", "Bob", "Dan"],
      "set": {
        "team": "[[\\"Alice\\",\\"online\\"],[\\"Bob\\",\\"away\\"],[\\"Carol\\",\\"offline\\"],[\\"Dan\\",\\"offline\\"],[\\"Eve\\",\\"online\\"],[\\"Frank\\",\\"online\\"]]"
      },
      "body": "6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。"
    },
    {
      "step": "上限を超える",
      "duration": 1.8,
      "focus": ["Alice", "Carol", "Eve", "Bob", "Dan"],
      "set": {
        "team": "[[\\"Alice\\",\\"online\\"],[\\"Bob\\",\\"away\\"],[\\"Carol\\",\\"offline\\"],[\\"Dan\\",\\"offline\\"],[\\"Eve\\",\\"online\\"],[\\"Frank\\",\\"online\\"],[\\"Grace\\",\\"away\\"]]"
      },
      "body": "7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。"
    }
  ]
}`;

export const sourceYaml__feedbackThumbRating = `title: "賛成票と反対票を並べて見せる"
type: flow

readouts:
  rt: { kind: rating-thumb, source: "votes", colorUp: "#22c55e", colorDown: "#ef4444", label: "Review score" }

lanes:
  up: { x: 0, width: 340 }
  down: { x: 380, width: 340 }

states:
  votes: "[24,3]"

actors:
  - ▲ Up votes: { kind: card, lane: up, stack: 0, subtitle: "帯の緑の側を決める票" }
  - Positive: { kind: card, lane: up, stack: 1, subtitle: "帯の緑の部分" }
  - ▼ Down votes: { kind: card, lane: down, stack: 0, subtitle: "帯の赤の側を決める票" }
  - Negative: { kind: card, lane: down, stack: 1, subtitle: "帯の赤の部分" }

flow:
  - ▲ Up votes -> ▼ Down votes: "割合" (warning)

animation:
  - step: "票が割れる" 1.8s
    focus: ["▲ Up votes", "▼ Down votes"]
    set:
      votes: "[12,10]"
    description: "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。"
  - step: "賛成が増える" 1.8s
    focus: ["▲ Up votes", "Positive", "▼ Down votes"]
    set:
      votes: "[20,10]"
    description: "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。"
  - step: "賛成に寄る" 1.8s
    focus: ["▲ Up votes", "Positive", "▼ Down votes", "Negative"]
    set:
      votes: "[24,3]"
    description: "賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。"
`;

export const sourceJson__feedbackThumbRating = `{
  "title": "賛成票と反対票を並べて見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "rt",
      "kind": "rating-thumb",
      "source": "votes",
      "colorUp": "#22c55e",
      "colorDown": "#ef4444",
      "label": "Review score"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 340 },
    "down": { "x": 380, "width": 340 }
  },
  "actors": [
    { "name": "▲ Up votes", "kind": "card", "lane": "up", "stack": 0, "subtitle": "帯の緑の側を決める票" },
    { "name": "Positive", "kind": "card", "lane": "up", "stack": 1, "subtitle": "帯の緑の部分" },
    {
      "name": "▼ Down votes",
      "kind": "card",
      "lane": "down",
      "stack": 0,
      "subtitle": "帯の赤の側を決める票"
    },
    { "name": "Negative", "kind": "card", "lane": "down", "stack": 1, "subtitle": "帯の赤の部分" }
  ],
  "flow": [
    { "from": "▲ Up votes", "to": "▼ Down votes", "label": "割合", "tone": "warning" }
  ],
  "states": { "votes": "[24,3]" },
  "animation": [
    {
      "step": "票が割れる",
      "duration": 1.8,
      "focus": ["▲ Up votes", "▼ Down votes"],
      "set": { "votes": "[12,10]" },
      "body": "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。"
    },
    {
      "step": "賛成が増える",
      "duration": 1.8,
      "focus": ["▲ Up votes", "Positive", "▼ Down votes"],
      "set": { "votes": "[20,10]" },
      "body": "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。"
    },
    {
      "step": "賛成に寄る",
      "duration": 1.8,
      "focus": ["▲ Up votes", "Positive", "▼ Down votes", "Negative"],
      "set": { "votes": "[24,3]" },
      "body": "賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。"
    }
  ]
}`;

export const sourceYaml__startupOrgChart = `title: "3 階層の組織図を階層ごとに並べる"
type: flow

readouts:
  oc: { kind: org-chart-mini, source: "org", color: "#2563eb", label: "Org hierarchy" }

lanes:
  ceo: { x: 0, width: 220 }
  vp: { x: 260, width: 220 }
  ic: { x: 520, width: 260 }

states:
  org: '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]'

actors:
  - Alice CEO: { kind: card, lane: ceo, stack: 0, subtitle: "最上位の階層" }
  - Bob VP Eng: { kind: card, lane: vp, stack: 0, subtitle: "中間の階層" }
  - Carol Sales: { kind: card, lane: vp, stack: 1, subtitle: "中間の階層" }
  - Dan Eng: { kind: card, lane: ic, stack: 0, subtitle: "最下位の階層" }
  - Eve Eng: { kind: card, lane: ic, stack: 1, subtitle: "最下位の階層" }
  - Frank Sales: { kind: card, lane: ic, stack: 2, subtitle: "最下位の階層" }

flow:
  - Alice CEO -> Bob VP Eng: "reports" (info)
  - Alice CEO -> Carol Sales: "reports" (info)
  - Bob VP Eng -> Dan Eng: "manages" (accent)
  - Bob VP Eng -> Eve Eng: "manages" (accent)
  - Carol Sales -> Frank Sales: "manages" (accent)

animation:
  - step: "創業した頃" 1.8s
    focus: ["Alice CEO"]
    set:
      org: '[["Alice CEO",0]]'
    description: "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。"
  - step: "役員を置く" 1.8s
    focus: ["Alice CEO", "Bob VP Eng", "Carol Sales"]
    set:
      org: '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1]]'
    description: "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。"
  - step: "現場が増える" 1.8s
    focus: ["Alice CEO", "Bob VP Eng", "Carol Sales", "Dan Eng", "Eve Eng", "Frank Sales"]
    set:
      org: '[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]'
    description: "3 段目まで揃う。 名前が 10 文字を超える箱は末尾を省いて出ることが読み取れる。"
`;

export const sourceJson__startupOrgChart = `{
  "title": "3 階層の組織図を階層ごとに並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "oc",
      "kind": "org-chart-mini",
      "source": "org",
      "color": "#2563eb",
      "label": "Org hierarchy"
    }
  ],
  "lanes": {
    "ceo": { "x": 0, "width": 220 },
    "vp": { "x": 260, "width": 220 },
    "ic": { "x": 520, "width": 260 }
  },
  "actors": [
    { "name": "Alice CEO", "kind": "card", "lane": "ceo", "stack": 0, "subtitle": "最上位の階層" },
    { "name": "Bob VP Eng", "kind": "card", "lane": "vp", "stack": 0, "subtitle": "中間の階層" },
    { "name": "Carol Sales", "kind": "card", "lane": "vp", "stack": 1, "subtitle": "中間の階層" },
    { "name": "Dan Eng", "kind": "card", "lane": "ic", "stack": 0, "subtitle": "最下位の階層" },
    { "name": "Eve Eng", "kind": "card", "lane": "ic", "stack": 1, "subtitle": "最下位の階層" },
    { "name": "Frank Sales", "kind": "card", "lane": "ic", "stack": 2, "subtitle": "最下位の階層" }
  ],
  "flow": [
    { "from": "Alice CEO", "to": "Bob VP Eng", "label": "reports", "tone": "info" },
    { "from": "Alice CEO", "to": "Carol Sales", "label": "reports", "tone": "info" },
    { "from": "Bob VP Eng", "to": "Dan Eng", "label": "manages", "tone": "accent" },
    { "from": "Bob VP Eng", "to": "Eve Eng", "label": "manages", "tone": "accent" },
    { "from": "Carol Sales", "to": "Frank Sales", "label": "manages", "tone": "accent" }
  ],
  "states": {
    "org": "[[\\"Alice CEO\\",0],[\\"Bob VP Eng\\",1],[\\"Carol VP Sales\\",1],[\\"Dan Eng\\",2],[\\"Eve Eng\\",2],[\\"Frank Sales\\",2]]"
  },
  "animation": [
    {
      "step": "創業した頃",
      "duration": 1.8,
      "focus": ["Alice CEO"],
      "set": { "org": "[[\\"Alice CEO\\",0]]" },
      "body": "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。"
    },
    {
      "step": "役員を置く",
      "duration": 1.8,
      "focus": ["Alice CEO", "Bob VP Eng", "Carol Sales"],
      "set": { "org": "[[\\"Alice CEO\\",0],[\\"Bob VP Eng\\",1],[\\"Carol VP Sales\\",1]]" },
      "body": "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。"
    },
    {
      "step": "現場が増える",
      "duration": 1.8,
      "focus": ["Alice CEO", "Bob VP Eng", "Carol Sales", "Dan Eng", "Eve Eng", "Frank Sales"],
      "set": {
        "org": "[[\\"Alice CEO\\",0],[\\"Bob VP Eng\\",1],[\\"Carol VP Sales\\",1],[\\"Dan Eng\\",2],[\\"Eve Eng\\",2],[\\"Frank Sales\\",2]]"
      },
      "body": "3 段目まで揃う。 名前が 10 文字を超える箱は末尾を省いて出ることが読み取れる。"
    }
  ]
}`;

export const sourceYaml__npsTrendKpi = `title: "NPS の現在値と増減と推移を並べる"
type: flow

readouts:
  kt: { kind: kpi-trend-tile, source: "cur", prevSource: "prev", historySource: "hist", unit: "", colorPos: "#22c55e", colorNeg: "#ef4444", label: "NPS trend" }

lanes:
  cur: { x: 0, width: 220 }
  delta: { x: 260, width: 220 }
  hist: { x: 520, width: 260 }

states:
  cur: 82
  prev: 75
  hist: "[60,65,70,75,80,82]"

actors:
  - Current: { kind: card, lane: cur, stack: 0, subtitle: "今月の値" }
  - Previous: { kind: card, lane: delta, stack: 0, subtitle: "先月の値" }
  - Delta2: { kind: card, lane: delta, stack: 1, subtitle: "今月 - 先月の差", title: "Delta" }
  - History: { kind: card, lane: hist, stack: 0, subtitle: "折れ線のもとになる並び" }

flow:
  - Current -> Previous: "比べる" (info)
  - Current -> History: "並べる" (success)

animation:
  - step: "下がった月" 1.8s
    focus: ["Current", "Previous"]
    set:
      cur: 58
      prev: 64
      hist: "[70,68,66,64,60,58]"
    description: "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。"
  - step: "底を打つ" 1.8s
    focus: ["Current", "Previous", "Delta2"]
    set:
      cur: 64
      prev: 64
      hist: "[68,66,64,60,58,64]"
    description: "今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。"
  - step: "持ち直す" 1.8s
    focus: ["Current", "Previous", "Delta2", "History"]
    set:
      cur: 82
      prev: 75
      hist: "[60,65,70,75,80,82]"
    description: "今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。"
`;

export const sourceJson__npsTrendKpi = `{
  "title": "NPS の現在値と増減と推移を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "kt",
      "kind": "kpi-trend-tile",
      "source": "cur",
      "prevSource": "prev",
      "historySource": "hist",
      "unit": "",
      "colorPos": "#22c55e",
      "colorNeg": "#ef4444",
      "label": "NPS trend"
    }
  ],
  "lanes": {
    "cur": { "x": 0, "width": 220 },
    "delta": { "x": 260, "width": 220 },
    "hist": { "x": 520, "width": 260 }
  },
  "actors": [
    { "name": "Current", "kind": "card", "lane": "cur", "stack": 0, "subtitle": "今月の値" },
    { "name": "Previous", "kind": "card", "lane": "delta", "stack": 0, "subtitle": "先月の値" },
    {
      "name": "Delta2",
      "kind": "card",
      "lane": "delta",
      "stack": 1,
      "subtitle": "今月 - 先月の差",
      "title": "Delta"
    },
    { "name": "History", "kind": "card", "lane": "hist", "stack": 0, "subtitle": "折れ線のもとになる並び" }
  ],
  "flow": [
    { "from": "Current", "to": "Previous", "label": "比べる", "tone": "info" },
    { "from": "Current", "to": "History", "label": "並べる", "tone": "success" }
  ],
  "states": { "cur": 82, "prev": 75, "hist": "[60,65,70,75,80,82]" },
  "animation": [
    {
      "step": "下がった月",
      "duration": 1.8,
      "focus": ["Current", "Previous"],
      "set": { "cur": 58, "prev": 64, "hist": "[70,68,66,64,60,58]" },
      "body": "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。"
    },
    {
      "step": "底を打つ",
      "duration": 1.8,
      "focus": ["Current", "Previous", "Delta2"],
      "set": { "cur": 64, "prev": 64, "hist": "[68,66,64,60,58,64]" },
      "body": "今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。"
    },
    {
      "step": "持ち直す",
      "duration": 1.8,
      "focus": ["Current", "Previous", "Delta2", "History"],
      "set": { "cur": 82, "prev": 75, "hist": "[60,65,70,75,80,82]" },
      "body": "今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。"
    }
  ]
}`;

export const sourceYaml__postReactionPoll = `title: "絵文字 3 種の投票を並べる"
type: flow

readouts:
  qp: { kind: quick-poll-emoji, source: "votes", colorWinner: "#2563eb", label: "Reactions" }

lanes:
  thumbs: { x: 0, width: 240 }
  heart: { x: 280, width: 240 }
  party: { x: 560, width: 240 }

states:
  votes: '[["👍",42],["❤️",28],["🎉",15]]'

actors:
  - 👍 Thumbs2: { kind: card, lane: thumbs, stack: 0, subtitle: "票が最も多い絵文字", title: "👍 Thumbs" }
  - ❤️ Heart2: { kind: card, lane: heart, stack: 0, subtitle: "次に多い絵文字", title: "❤️ Heart" }
  - 🎉 Party2: { kind: card, lane: party, stack: 0, subtitle: "票が最も少ない絵文字", title: "🎉 Party" }

animation:
  - step: "票が入り始める" 1.8s
    focus: ["👍 Thumbs2"]
    set:
      votes: '[["👍",3],["❤️",2],["🎉",1]]'
    description: "票がまだ少ない。 最も多いものに枠が付き、他の 2 つとは色が変わる。"
  - step: "票が集まる" 1.8s
    focus: ["👍 Thumbs2", "❤️ Heart2"]
    set:
      votes: '[["👍",12],["❤️",7],["🎉",4]]'
    description: "差が開く。 枠が付くのは最も多い 1 つだけで、位置は動かない。"
  - step: "締め切り" 1.8s
    focus: ["👍 Thumbs2", "❤️ Heart2", "🎉 Party2"]
    set:
      votes: '[["👍",42],["❤️",28],["🎉",15]]'
    description: "3 種の差が最も開く。 枠の位置は動かず、中の数だけが上がる形で落ち着く。"
`;

export const sourceJson__postReactionPoll = `{
  "title": "絵文字 3 種の投票を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "qp",
      "kind": "quick-poll-emoji",
      "source": "votes",
      "colorWinner": "#2563eb",
      "label": "Reactions"
    }
  ],
  "lanes": {
    "thumbs": { "x": 0, "width": 240 },
    "heart": { "x": 280, "width": 240 },
    "party": { "x": 560, "width": 240 }
  },
  "actors": [
    {
      "name": "👍 Thumbs2",
      "kind": "card",
      "lane": "thumbs",
      "stack": 0,
      "subtitle": "票が最も多い絵文字",
      "title": "👍 Thumbs"
    },
    {
      "name": "❤️ Heart2",
      "kind": "card",
      "lane": "heart",
      "stack": 0,
      "subtitle": "次に多い絵文字",
      "title": "❤️ Heart"
    },
    {
      "name": "🎉 Party2",
      "kind": "card",
      "lane": "party",
      "stack": 0,
      "subtitle": "票が最も少ない絵文字",
      "title": "🎉 Party"
    }
  ],
  "flow": [],
  "states": { "votes": "[[\\"👍\\",42],[\\"❤️\\",28],[\\"🎉\\",15]]" },
  "animation": [
    {
      "step": "票が入り始める",
      "duration": 1.8,
      "focus": ["👍 Thumbs2"],
      "set": { "votes": "[[\\"👍\\",3],[\\"❤️\\",2],[\\"🎉\\",1]]" },
      "body": "票がまだ少ない。 最も多いものに枠が付き、他の 2 つとは色が変わる。"
    },
    {
      "step": "票が集まる",
      "duration": 1.8,
      "focus": ["👍 Thumbs2", "❤️ Heart2"],
      "set": { "votes": "[[\\"👍\\",12],[\\"❤️\\",7],[\\"🎉\\",4]]" },
      "body": "差が開く。 枠が付くのは最も多い 1 つだけで、位置は動かない。"
    },
    {
      "step": "締め切り",
      "duration": 1.8,
      "focus": ["👍 Thumbs2", "❤️ Heart2", "🎉 Party2"],
      "set": { "votes": "[[\\"👍\\",42],[\\"❤️\\",28],[\\"🎉\\",15]]" },
      "body": "3 種の差が最も開く。 枠の位置は動かず、中の数だけが上がる形で落ち着く。"
    }
  ]
}`;

export const sourceYaml__voiceMessagePlayback = `title: "音声メッセージの波形と再生位置を見せる"
type: flow

readouts:
  vm: { kind: voice-message, source: "amps", progressSource: "progress", duration: 23, colorPlay: "#2563eb", colorBar: "#cbd5e1", label: "音声メモ" }

lanes:
  sender: { x: 0, width: 200 }
  wave: { x: 240, width: 260 }
  play: { x: 540, width: 220 }

states:
  amps: "[0.2,0.4,0.7,0.9,0.6,0.3,0.5,0.8,0.4,0.6,0.3,0.7,0.5,0.2,0.4]"
  progress: 0

actors:
  - 送り主: { kind: card, lane: sender, stack: 0, subtitle: "録音した人" }
  - 波形: { kind: card, lane: wave, stack: 0, subtitle: "音の大小が棒の高さになる" }
  - 再生: { kind: card, lane: play, stack: 0, subtitle: "左から順に色が付く波形" }
  - 進み具合: { kind: card, lane: play, stack: 1, subtitle: "色の付いた本数を決める割合" }

flow:
  - 送り主 -> 波形: "録音" (info)
  - 波形 -> 再生: "再生" (success)

animation:
  - step: "受信した直後" 1.8s
    focus: ["送り主", "波形"]
    set:
      progress: 0
    badge: "受信"
    description: "棒が 15 本並ぶが、どれも灰のまま。 進み具合が 0 の間は色が 1 本も付かない。"
  - step: "半ばまで再生" 1.8s
    focus: ["送り主", "波形", "再生"]
    set:
      progress: 0.5
    badge: "再生中"
    description: "左から半分の棒に色が付く。 棒の高さは変わらず、色の境目だけが右へ動く。"
  - step: "再生完了" 1.8s
    focus: ["送り主", "波形", "再生", "進み具合"]
    set:
      progress: 1
    badge: "完了"
    description: "15 本すべてに色が付く。 進み具合が 1 になると境目が右端まで届く。"
`;

export const sourceJson__voiceMessagePlayback = `{
  "title": "音声メッセージの波形と再生位置を見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "vm",
      "kind": "voice-message",
      "source": "amps",
      "progressSource": "progress",
      "duration": 23,
      "colorPlay": "#2563eb",
      "colorBar": "#cbd5e1",
      "label": "音声メモ"
    }
  ],
  "lanes": {
    "sender": { "x": 0, "width": 200 },
    "wave": { "x": 240, "width": 260 },
    "play": { "x": 540, "width": 220 }
  },
  "actors": [
    { "name": "送り主", "kind": "card", "lane": "sender", "stack": 0, "subtitle": "録音した人" },
    { "name": "波形", "kind": "card", "lane": "wave", "stack": 0, "subtitle": "音の大小が棒の高さになる" },
    { "name": "再生", "kind": "card", "lane": "play", "stack": 0, "subtitle": "左から順に色が付く波形" },
    { "name": "進み具合", "kind": "card", "lane": "play", "stack": 1, "subtitle": "色の付いた本数を決める割合" }
  ],
  "flow": [
    { "from": "送り主", "to": "波形", "label": "録音", "tone": "info" },
    { "from": "波形", "to": "再生", "label": "再生", "tone": "success" }
  ],
  "states": { "amps": "[0.2,0.4,0.7,0.9,0.6,0.3,0.5,0.8,0.4,0.6,0.3,0.7,0.5,0.2,0.4]", "progress": 0 },
  "animation": [
    {
      "step": "受信した直後",
      "duration": 1.8,
      "focus": ["送り主", "波形"],
      "set": { "progress": 0 },
      "badge": "受信",
      "body": "棒が 15 本並ぶが、どれも灰のまま。 進み具合が 0 の間は色が 1 本も付かない。"
    },
    {
      "step": "半ばまで再生",
      "duration": 1.8,
      "focus": ["送り主", "波形", "再生"],
      "set": { "progress": 0.5 },
      "badge": "再生中",
      "body": "左から半分の棒に色が付く。 棒の高さは変わらず、色の境目だけが右へ動く。"
    },
    {
      "step": "再生完了",
      "duration": 1.8,
      "focus": ["送り主", "波形", "再生", "進み具合"],
      "set": { "progress": 1 },
      "badge": "完了",
      "body": "15 本すべてに色が付く。 進み具合が 1 になると境目が右端まで届く。"
    }
  ]
}`;

export const sourceYaml__teamThreadSummary = `title: "スレッドの未読 / 参加者 / 経過をまとめる"
type: flow

readouts:
  ts: { kind: thread-summary, source: "thread", colorUnread: "#ef4444", label: "スレッド概要" }

lanes:
  unread: { x: 0, width: 220 }
  participants: { x: 260, width: 220 }
  activity: { x: 520, width: 260 }

states:
  thread: '[5,8,"Alice","12 分前"]'

actors:
  - 未読: { kind: card, lane: unread, stack: 0, subtitle: "赤い丸の中に出る数" }
  - 参加者: { kind: card, lane: participants, stack: 0, subtitle: "話している人数" }
  - 直近の発言者: { kind: card, lane: activity, stack: 0, subtitle: "最後に書いた人の名前" }
  - 経過: { kind: card, lane: activity, stack: 1, subtitle: "最後の書き込みからの経過" }

flow:
  - 未読 -> 直近の発言者: "帰属" (info)
  - 参加者 -> 直近の発言者: "所属" (teal)

animation:
  - step: "静かなスレッド" 1.8s
    focus: ["参加者"]
    set:
      thread: '[0,4,"Bob","2 時間前"]'
    badge: "静か"
    description: "未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。"
  - step: "新着が付く" 1.8s
    focus: ["未読", "参加者", "直近の発言者"]
    set:
      thread: '[3,6,"Carol","25 分前"]'
    badge: "新着"
    description: "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。"
  - step: "混雑する" 1.8s
    focus: ["未読", "参加者", "直近の発言者", "経過"]
    set:
      thread: '[5,8,"Alice","12 分前"]'
    badge: "混雑"
    description: "未読が 5 件に増える。 丸の大きさは変わらず、中の数と 3 行の文字だけが動く。"
`;

export const sourceJson__teamThreadSummary = `{
  "title": "スレッドの未読 / 参加者 / 経過をまとめる",
  "type": "flow",
  "readouts": [
    {
      "id": "ts",
      "kind": "thread-summary",
      "source": "thread",
      "colorUnread": "#ef4444",
      "label": "スレッド概要"
    }
  ],
  "lanes": {
    "unread": { "x": 0, "width": 220 },
    "participants": { "x": 260, "width": 220 },
    "activity": { "x": 520, "width": 260 }
  },
  "actors": [
    { "name": "未読", "kind": "card", "lane": "unread", "stack": 0, "subtitle": "赤い丸の中に出る数" },
    { "name": "参加者", "kind": "card", "lane": "participants", "stack": 0, "subtitle": "話している人数" },
    {
      "name": "直近の発言者",
      "kind": "card",
      "lane": "activity",
      "stack": 0,
      "subtitle": "最後に書いた人の名前"
    },
    { "name": "経過", "kind": "card", "lane": "activity", "stack": 1, "subtitle": "最後の書き込みからの経過" }
  ],
  "flow": [
    { "from": "未読", "to": "直近の発言者", "label": "帰属", "tone": "info" },
    { "from": "参加者", "to": "直近の発言者", "label": "所属", "tone": "teal" }
  ],
  "states": { "thread": "[5,8,\\"Alice\\",\\"12 分前\\"]" },
  "animation": [
    {
      "step": "静かなスレッド",
      "duration": 1.8,
      "focus": ["参加者"],
      "set": { "thread": "[0,4,\\"Bob\\",\\"2 時間前\\"]" },
      "badge": "静か",
      "body": "未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。"
    },
    {
      "step": "新着が付く",
      "duration": 1.8,
      "focus": ["未読", "参加者", "直近の発言者"],
      "set": { "thread": "[3,6,\\"Carol\\",\\"25 分前\\"]" },
      "badge": "新着",
      "body": "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。"
    },
    {
      "step": "混雑する",
      "duration": 1.8,
      "focus": ["未読", "参加者", "直近の発言者", "経過"],
      "set": { "thread": "[5,8,\\"Alice\\",\\"12 分前\\"]" },
      "badge": "混雑",
      "body": "未読が 5 件に増える。 丸の大きさは変わらず、中の数と 3 行の文字だけが動く。"
    }
  ]
}`;

export const sourceYaml__dmReadReceipt = `title: "DM の送信 / 配信 / 既読を段階で見せる"
type: flow

readouts:
  rr: { kind: read-receipt, source: "status", colorRead: "#2563eb", colorPending: "#a08870", label: "既読状態" }

lanes:
  sent: { x: 0, width: 300 }
  delivered: { x: 340, width: 320 }
  read: { x: 700, width: 320 }

states:
  status: 0

actors:
  - ▶ 送信 (0): { kind: card, lane: sent, stack: 0, subtitle: "単チェック · 灰 · 09:42", posW: 250 }
  - ▶▶ 配信 (1): { kind: card, lane: delivered, stack: 0, subtitle: "二重チェック · 灰 · 09:43", posW: 270 }
  - ◆ 既読 (2): { kind: card, lane: read, stack: 0, subtitle: "二重チェック · 青 · 09:45", posW: 270 }

flow:
  - ▶ 送信 (0) -> ▶▶ 配信 (1): "配信完了" (info)
  - ▶▶ 配信 (1) -> ◆ 既読 (2): "既読" (success)

animation:
  - step: "送信" 1.5s
    focus: ["▶ 送信 (0)"]
    set:
      status: 0
    badge: "送信"
    description: "status = 0、 送信 lane のみ active、 readout に灰の単チェック表示 (送信済 but 未配信)。"
  - step: "配信完了" 1.5s
    focus: ["▶ 送信 (0)", "▶▶ 配信 (1)"]
    set:
      status: 1
    badge: "配信"
    description: "status = 1 に切替、 配信 lane 追加 activate、 readout が灰の二重チェックに変化 (配信 but 未読)。"
  - step: "既読" 1.5s
    focus: ["▶ 送信 (0)", "▶▶ 配信 (1)", "◆ 既読 (2)"]
    set:
      status: 2
    badge: "既読"
    description: "status = 2 に切替、 既読 lane 追加 activate、 readout の二重チェックが青に変化 (既読確認)。"
`;

export const sourceJson__dmReadReceipt = `{
  "title": "DM の送信 / 配信 / 既読を段階で見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "rr",
      "kind": "read-receipt",
      "source": "status",
      "colorRead": "#2563eb",
      "colorPending": "#a08870",
      "label": "既読状態"
    }
  ],
  "lanes": {
    "sent": { "x": 0, "width": 300 },
    "delivered": { "x": 340, "width": 320 },
    "read": { "x": 700, "width": 320 }
  },
  "actors": [
    {
      "name": "▶ 送信 (0)",
      "kind": "card",
      "lane": "sent",
      "stack": 0,
      "subtitle": "単チェック · 灰 · 09:42",
      "posW": 250
    },
    {
      "name": "▶▶ 配信 (1)",
      "kind": "card",
      "lane": "delivered",
      "stack": 0,
      "subtitle": "二重チェック · 灰 · 09:43",
      "posW": 270
    },
    {
      "name": "◆ 既読 (2)",
      "kind": "card",
      "lane": "read",
      "stack": 0,
      "subtitle": "二重チェック · 青 · 09:45",
      "posW": 270
    }
  ],
  "flow": [
    { "from": "▶ 送信 (0)", "to": "▶▶ 配信 (1)", "label": "配信完了", "tone": "info" },
    { "from": "▶▶ 配信 (1)", "to": "◆ 既読 (2)", "label": "既読", "tone": "success" }
  ],
  "states": { "status": 0 },
  "animation": [
    {
      "step": "送信",
      "duration": 1.5,
      "focus": ["▶ 送信 (0)"],
      "set": { "status": 0 },
      "badge": "送信",
      "body": "status = 0、 送信 lane のみ active、 readout に灰の単チェック表示 (送信済 but 未配信)。"
    },
    {
      "step": "配信完了",
      "duration": 1.5,
      "focus": ["▶ 送信 (0)", "▶▶ 配信 (1)"],
      "set": { "status": 1 },
      "badge": "配信",
      "body": "status = 1 に切替、 配信 lane 追加 activate、 readout が灰の二重チェックに変化 (配信 but 未読)。"
    },
    {
      "step": "既読",
      "duration": 1.5,
      "focus": ["▶ 送信 (0)", "▶▶ 配信 (1)", "◆ 既読 (2)"],
      "set": { "status": 2 },
      "badge": "既読",
      "body": "status = 2 に切替、 既読 lane 追加 activate、 readout の二重チェックが青に変化 (既読確認)。"
    }
  ]
}`;

export const sourceYaml__formPasswordCheck = `title: "パスワードの強度を 5 段階で見せる"
type: flow

readouts:
  ps: { kind: password-strength, source: "pw", colorStrong: "#22c55e", colorWeak: "#ef4444", label: "強度" }

lanes:
  input: { x: 0, width: 220 }
  meter: { x: 260, width: 260 }
  rules: { x: 560, width: 260 }

states:
  pw: 1

actors:
  - ◆ password: { kind: card, lane: input, stack: 0, subtitle: "現在 level {pw} · マスク表示" }
  - 4 セグメント メーター: { kind: card, lane: meter, stack: 0, subtitle: "level {pw} 分だけ着色" }
  - level ラベル: { kind: card, lane: meter, stack: 1, subtitle: "メーター色と同色 tint" }
  - ✓ 8 文字以上: { kind: card, lane: rules, stack: 0, subtitle: "level ≥ 1 で pass" }
  - ✓ 大小混合: { kind: card, lane: rules, stack: 1, subtitle: "level ≥ 2 で pass" }
  - ✓ 数字 + 記号: { kind: card, lane: rules, stack: 2, subtitle: "level ≥ 3 で pass" }

flow:
  - ◆ password -> 4 セグメント メーター: "評価" (info)
  - 4 セグメント メーター -> level ラベル: "注釈" (success)

animation:
  - step: "弱い (level 1)" 1.5s
    focus: ["◆ password", "4 セグメント メーター", "✓ 8 文字以上"]
    set:
      pw: 1
    badge: "弱い"
    description: "初期入力、 pw = 1、 meter 1 セグメント赤、 rule1 のみ pass、 入力 + メーター lane が active。"
  - step: "改善中 (level 1 → 3)" 2s
    focus: ["◆ password", "4 セグメント メーター", "level ラベル", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"]
    tween:
      pw: 1 -> 3
    badge: "改善中"
    description: "文字追加 + 大小混合、 pw を 1 → 3 まで tween、 meter が赤 → 橙 → 黄 → 黄緑と連続変化、 rule2 + rule3 追加 activate。"
  - step: "強い (level 4)" 1.5s
    focus: ["◆ password", "4 セグメント メーター", "level ラベル", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"]
    set:
      pw: 4
    badge: "強い"
    description: "数字 + 記号追加で pw = 4、 meter 全 4 セグメント緑、 全 rule pass、 6 node 全 active。"
`;

export const sourceJson__formPasswordCheck = `{
  "title": "パスワードの強度を 5 段階で見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "ps",
      "kind": "password-strength",
      "source": "pw",
      "colorStrong": "#22c55e",
      "colorWeak": "#ef4444",
      "label": "強度"
    }
  ],
  "lanes": {
    "input": { "x": 0, "width": 220 },
    "meter": { "x": 260, "width": 260 },
    "rules": { "x": 560, "width": 260 }
  },
  "actors": [
    {
      "name": "◆ password",
      "kind": "card",
      "lane": "input",
      "stack": 0,
      "subtitle": "現在 level {pw} · マスク表示"
    },
    {
      "name": "4 セグメント メーター",
      "kind": "card",
      "lane": "meter",
      "stack": 0,
      "subtitle": "level {pw} 分だけ着色"
    },
    {
      "name": "level ラベル",
      "kind": "card",
      "lane": "meter",
      "stack": 1,
      "subtitle": "メーター色と同色 tint"
    },
    {
      "name": "✓ 8 文字以上",
      "kind": "card",
      "lane": "rules",
      "stack": 0,
      "subtitle": "level ≥ 1 で pass"
    },
    {
      "name": "✓ 大小混合",
      "kind": "card",
      "lane": "rules",
      "stack": 1,
      "subtitle": "level ≥ 2 で pass"
    },
    {
      "name": "✓ 数字 + 記号",
      "kind": "card",
      "lane": "rules",
      "stack": 2,
      "subtitle": "level ≥ 3 で pass"
    }
  ],
  "flow": [
    { "from": "◆ password", "to": "4 セグメント メーター", "label": "評価", "tone": "info" },
    { "from": "4 セグメント メーター", "to": "level ラベル", "label": "注釈", "tone": "success" }
  ],
  "states": { "pw": 1 },
  "animation": [
    {
      "step": "弱い (level 1)",
      "duration": 1.5,
      "focus": ["◆ password", "4 セグメント メーター", "✓ 8 文字以上"],
      "set": { "pw": 1 },
      "badge": "弱い",
      "body": "初期入力、 pw = 1、 meter 1 セグメント赤、 rule1 のみ pass、 入力 + メーター lane が active。"
    },
    {
      "step": "改善中 (level 1 → 3)",
      "duration": 2,
      "focus": ["◆ password", "4 セグメント メーター", "level ラベル", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"],
      "tween": { "pw": [1, 3] },
      "badge": "改善中",
      "body": "文字追加 + 大小混合、 pw を 1 → 3 まで tween、 meter が赤 → 橙 → 黄 → 黄緑と連続変化、 rule2 + rule3 追加 activate。"
    },
    {
      "step": "強い (level 4)",
      "duration": 1.5,
      "focus": ["◆ password", "4 セグメント メーター", "level ラベル", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"],
      "set": { "pw": 4 },
      "badge": "強い",
      "body": "数字 + 記号追加で pw = 4、 meter 全 4 セグメント緑、 全 rule pass、 6 node 全 active。"
    }
  ]
}`;

export const sourceYaml__loginOtpVerify = `title: "OTP 6 桁の入力から検証までを追う"
type: flow

readouts:
  oi: { kind: otp-input, source: "otp", colorFocus: "#2563eb", label: "OTP コード" }

lanes:
  sent: { x: 0, width: 220 }
  entry: { x: 260, width: 260 }
  verify: { x: 560, width: 220 }

states:
  otp: "[4,8,2,1,5,7]"

actors:
  - SMS 送信: { kind: card, lane: sent, stack: 0, subtitle: "6 桁の符号を送る" }
  - 6 つの枠: { kind: card, lane: entry, stack: 0, subtitle: "0-9 以外は空欄になる" }
  - 次に入れる枠: { kind: card, lane: entry, stack: 1, subtitle: "空欄の先頭が青枠になる" }
  - 検証: { kind: card, lane: verify, stack: 0, subtitle: "6 つ埋まると送る" }

flow:
  - SMS 送信 -> 6 つの枠: "ユーザ入力" (info)
  - 6 つの枠 -> 検証: "自動送信" (success)

animation:
  - step: "送った直後" 1.8s
    focus: ["SMS 送信"]
    set:
      otp: "[-1,-1,-1,-1,-1,-1]"
    badge: "送信"
    description: "6 つの枠がすべて空。 0-9 の外の値は空欄として描かれるため、-1 を並べると空になる。"
  - step: "3 つ入れる" 1.8s
    focus: ["SMS 送信", "6 つの枠", "次に入れる枠"]
    set:
      otp: "[4,8,2,-1,-1,-1]"
    badge: "入力中"
    description: "左から 3 つが埋まる。 埋まった枠に数が出て、次に入れる枠が青枠で示される。"
  - step: "6 つ揃う" 1.8s
    focus: ["SMS 送信", "6 つの枠", "次に入れる枠", "検証"]
    set:
      otp: "[4,8,2,1,5,7]"
    badge: "検証完了"
    description: "6 つとも埋まる。 空欄が無くなり青枠も消え、そのまま送る形になる。"
`;

export const sourceJson__loginOtpVerify = `{
  "title": "OTP 6 桁の入力から検証までを追う",
  "type": "flow",
  "readouts": [
    {
      "id": "oi",
      "kind": "otp-input",
      "source": "otp",
      "colorFocus": "#2563eb",
      "label": "OTP コード"
    }
  ],
  "lanes": {
    "sent": { "x": 0, "width": 220 },
    "entry": { "x": 260, "width": 260 },
    "verify": { "x": 560, "width": 220 }
  },
  "actors": [
    { "name": "SMS 送信", "kind": "card", "lane": "sent", "stack": 0, "subtitle": "6 桁の符号を送る" },
    { "name": "6 つの枠", "kind": "card", "lane": "entry", "stack": 0, "subtitle": "0-9 以外は空欄になる" },
    { "name": "次に入れる枠", "kind": "card", "lane": "entry", "stack": 1, "subtitle": "空欄の先頭が青枠になる" },
    { "name": "検証", "kind": "card", "lane": "verify", "stack": 0, "subtitle": "6 つ埋まると送る" }
  ],
  "flow": [
    { "from": "SMS 送信", "to": "6 つの枠", "label": "ユーザ入力", "tone": "info" },
    { "from": "6 つの枠", "to": "検証", "label": "自動送信", "tone": "success" }
  ],
  "states": { "otp": "[4,8,2,1,5,7]" },
  "animation": [
    {
      "step": "送った直後",
      "duration": 1.8,
      "focus": ["SMS 送信"],
      "set": { "otp": "[-1,-1,-1,-1,-1,-1]" },
      "badge": "送信",
      "body": "6 つの枠がすべて空。 0-9 の外の値は空欄として描かれるため、-1 を並べると空になる。"
    },
    {
      "step": "3 つ入れる",
      "duration": 1.8,
      "focus": ["SMS 送信", "6 つの枠", "次に入れる枠"],
      "set": { "otp": "[4,8,2,-1,-1,-1]" },
      "badge": "入力中",
      "body": "左から 3 つが埋まる。 埋まった枠に数が出て、次に入れる枠が青枠で示される。"
    },
    {
      "step": "6 つ揃う",
      "duration": 1.8,
      "focus": ["SMS 送信", "6 つの枠", "次に入れる枠", "検証"],
      "set": { "otp": "[4,8,2,1,5,7]" },
      "badge": "検証完了",
      "body": "6 つとも埋まる。 空欄が無くなり青枠も消え、そのまま送る形になる。"
    }
  ]
}`;

export const sourceYaml__profileAvatarUpload = `title: "画像の選択から反映までを追う"
type: flow

readouts:
  fd: { kind: file-dropzone, source: "file", colorActive: "#2563eb", label: "アバター ファイル" }

lanes:
  col1: { x: 0, width: 330 }
  col2: { x: 370, width: 360 }

states:
  file: ""

actors:
  - 未選択: { kind: card, lane: col1, stack: 0, subtitle: "破線枠 · '⬆ ここにドロップ'", posW: 280 }
  - ◆ avatar.png: { kind: card, lane: col2, stack: 0, subtitle: "実線枠 · ファイル名カード", posW: 310 }
  - ▶ 円形アバター: { kind: card, lane: col1, stack: 1, subtitle: "80×80 クロップ表示", posW: 220 }

flow:
  - 未選択 -> ◆ avatar.png: "drop" (info)
  - ◆ avatar.png -> ▶ 円形アバター: "プレビュー" (success)

animation:
  - step: "未選択" 1.5s
    focus: ["未選択"]
    set:
      file: ""
    badge: "未選択"
    description: "file = ''、 未選択の card のみ active、 dropzone は破線枠 + '⬆ ここにドロップ' のプロンプト表示。"
  - step: "ドロップ受信" 2s
    focus: ["未選択", "◆ avatar.png"]
    set:
      file: "avatar.png"
    badge: "アップロード"
    description: "file を空 → 'avatar.png' に切替、 アップロードの card を追加 activate、 dropzone が実線枠 + ファイル名カード表示に変化。"
  - step: "プレビュー表示" 1.5s
    focus: ["未選択", "◆ avatar.png", "▶ 円形アバター"]
    set:
      file: "avatar.png"
    badge: "完了"
    description: "アップロード完了、 プレビューの card を追加 activate、 円形クロップされたアバターが表示、 3 node 全 highlight。"
`;

export const sourceJson__profileAvatarUpload = `{
  "title": "画像の選択から反映までを追う",
  "type": "flow",
  "readouts": [
    {
      "id": "fd",
      "kind": "file-dropzone",
      "source": "file",
      "colorActive": "#2563eb",
      "label": "アバター ファイル"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 330 },
    "col2": { "x": 370, "width": 360 }
  },
  "actors": [
    {
      "name": "未選択",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "破線枠 · '⬆ ここにドロップ'",
      "posW": 280
    },
    {
      "name": "◆ avatar.png",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "実線枠 · ファイル名カード",
      "posW": 310
    },
    {
      "name": "▶ 円形アバター",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "80×80 クロップ表示",
      "posW": 220
    }
  ],
  "flow": [
    { "from": "未選択", "to": "◆ avatar.png", "label": "drop", "tone": "info" },
    { "from": "◆ avatar.png", "to": "▶ 円形アバター", "label": "プレビュー", "tone": "success" }
  ],
  "states": { "file": "" },
  "animation": [
    {
      "step": "未選択",
      "duration": 1.5,
      "focus": ["未選択"],
      "set": { "file": "" },
      "badge": "未選択",
      "body": "file = ''、 未選択の card のみ active、 dropzone は破線枠 + '⬆ ここにドロップ' のプロンプト表示。"
    },
    {
      "step": "ドロップ受信",
      "duration": 2,
      "focus": ["未選択", "◆ avatar.png"],
      "set": { "file": "avatar.png" },
      "badge": "アップロード",
      "body": "file を空 → 'avatar.png' に切替、 アップロードの card を追加 activate、 dropzone が実線枠 + ファイル名カード表示に変化。"
    },
    {
      "step": "プレビュー表示",
      "duration": 1.5,
      "focus": ["未選択", "◆ avatar.png", "▶ 円形アバター"],
      "set": { "file": "avatar.png" },
      "badge": "完了",
      "body": "アップロード完了、 プレビューの card を追加 activate、 円形クロップされたアバターが表示、 3 node 全 highlight。"
    }
  ]
}`;

export const sourceYaml__prodLogTail = `title: "本番ログ直近 5 行を重要度付きで流す"
type: flow

readouts:
  ls: { kind: log-stream, source: "logs", label: "ログ tail" }

lanes:
  ts: { x: 0, width: 180 }
  level: { x: 200, width: 140 }
  msg: { x: 360, width: 340 }

states:
  logs: '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"]]'

actors:
  - 時刻列: { kind: card, lane: ts, stack: 0, subtitle: "行の左端に出る時刻" }
  - レベル列: { kind: card, lane: level, stack: 0, subtitle: "札の色を決める重さ" }
  - 情報の行: { kind: card, lane: msg, stack: 0, subtitle: "情報を表す札 (青)" }
  - 注意の行: { kind: card, lane: msg, stack: 1, subtitle: "注意を表す札 (橙)" }
  - 異常の行: { kind: card, lane: msg, stack: 2, subtitle: "異常を表す札 (赤)" }

flow:
  - 時刻列 -> レベル列: "分類" (info)
  - レベル列 -> 異常の行: "重篤化" (error)

animation:
  - step: "通常運転" 1.8s
    focus: ["時刻列", "レベル列", "情報の行"]
    set:
      logs: '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"]]'
    badge: "通常"
    description: "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。"
  - step: "注意が出る" 1.8s
    focus: ["時刻列", "レベル列", "情報の行", "注意の行"]
    set:
      logs: '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"]]'
    badge: "警告"
    description: "橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。"
  - step: "異常が出る" 1.8s
    focus: ["時刻列", "レベル列", "情報の行", "注意の行", "異常の行"]
    set:
      logs: '[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"],["09:02:30",1,"health check ok"]]'
    badge: "障害"
    description: "行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。"
`;

export const sourceJson__prodLogTail = `{
  "title": "本番ログ直近 5 行を重要度付きで流す",
  "type": "flow",
  "readouts": [
    { "id": "ls", "kind": "log-stream", "source": "logs", "label": "ログ tail" }
  ],
  "lanes": {
    "ts": { "x": 0, "width": 180 },
    "level": { "x": 200, "width": 140 },
    "msg": { "x": 360, "width": 340 }
  },
  "actors": [
    { "name": "時刻列", "kind": "card", "lane": "ts", "stack": 0, "subtitle": "行の左端に出る時刻" },
    { "name": "レベル列", "kind": "card", "lane": "level", "stack": 0, "subtitle": "札の色を決める重さ" },
    { "name": "情報の行", "kind": "card", "lane": "msg", "stack": 0, "subtitle": "情報を表す札 (青)" },
    { "name": "注意の行", "kind": "card", "lane": "msg", "stack": 1, "subtitle": "注意を表す札 (橙)" },
    { "name": "異常の行", "kind": "card", "lane": "msg", "stack": 2, "subtitle": "異常を表す札 (赤)" }
  ],
  "flow": [
    { "from": "時刻列", "to": "レベル列", "label": "分類", "tone": "info" },
    { "from": "レベル列", "to": "異常の行", "label": "重篤化", "tone": "error" }
  ],
  "states": {
    "logs": "[[\\"09:00:12\\",1,\\"server 起動完了\\"],[\\"09:00:15\\",1,\\"db connection pool 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"],[\\"09:01:47\\",3,\\"worker crash: OOM\\"],[\\"09:02:02\\",1,\\"worker 再起動 ok\\"]]"
  },
  "animation": [
    {
      "step": "通常運転",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"server 起動完了\\"],[\\"09:00:15\\",1,\\"db connection pool 20\\"]]"
      },
      "badge": "通常",
      "body": "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。"
    },
    {
      "step": "注意が出る",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行", "注意の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"server 起動完了\\"],[\\"09:00:15\\",1,\\"db connection pool 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"]]"
      },
      "badge": "警告",
      "body": "橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。"
    },
    {
      "step": "異常が出る",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行", "注意の行", "異常の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"server 起動完了\\"],[\\"09:00:15\\",1,\\"db connection pool 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"],[\\"09:01:47\\",3,\\"worker crash: OOM\\"],[\\"09:02:02\\",1,\\"worker 再起動 ok\\"],[\\"09:02:30\\",1,\\"health check ok\\"]]"
      },
      "badge": "障害",
      "body": "行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。"
    }
  ]
}`;

export const sourceYaml__opsAlertBanner = `title: "運用通知を情報 / 注意 / 異常で出し分ける"
type: flow

readouts:
  ab: { kind: alert-banner, source: "alert", label: "アラート" }

lanes:
  trigger: { x: 0, width: 240 }
  severity: { x: 280, width: 240 }
  action: { x: 560, width: 220 }

states:
  alert: '[2,"CPU 92% を 5 分継続 — 調査要"]'

actors:
  - きっかけ: { kind: card, lane: trigger, stack: 0, subtitle: "本文になる出来事" }
  - 重要度: { kind: card, lane: severity, stack: 0, subtitle: "帯の色を決める重さ" }
  - 重要度の印: { kind: card, lane: severity, stack: 1, subtitle: "重要度で ℹ / ⚠ / ✕ が変わる" }
  - 対応: { kind: card, lane: action, stack: 0, subtitle: "受け取った人が動く" }

flow:
  - きっかけ -> 重要度: "分類" (info)
  - 重要度 -> 対応: "通知" (warning)

animation:
  - step: "軽微な知らせ" 1.8s
    focus: ["きっかけ", "重要度"]
    set:
      alert: '[0,"CPU 68% — 通常の範囲"]'
    badge: "info"
    description: "重要度が最も低い。 帯は青で、印は情報を表す形になる。"
  - step: "注意に上がる" 1.8s
    focus: ["きっかけ", "重要度", "重要度の印"]
    set:
      alert: '[2,"CPU 92% を 5 分継続 — 調査要"]'
    badge: "warn"
    description: "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。"
  - step: "異常に上がる" 1.8s
    focus: ["きっかけ", "重要度", "重要度の印", "対応"]
    set:
      alert: '[3,"prod-web-3 応答なし — 全系統の切替が要る"]'
    badge: "error"
    description: "重要度が最大になり帯が赤くなる。 本文と印も異常を表す内容に入れ替わる。"
`;

export const sourceJson__opsAlertBanner = `{
  "title": "運用通知を情報 / 注意 / 異常で出し分ける",
  "type": "flow",
  "readouts": [
    { "id": "ab", "kind": "alert-banner", "source": "alert", "label": "アラート" }
  ],
  "lanes": {
    "trigger": { "x": 0, "width": 240 },
    "severity": { "x": 280, "width": 240 },
    "action": { "x": 560, "width": 220 }
  },
  "actors": [
    { "name": "きっかけ", "kind": "card", "lane": "trigger", "stack": 0, "subtitle": "本文になる出来事" },
    { "name": "重要度", "kind": "card", "lane": "severity", "stack": 0, "subtitle": "帯の色を決める重さ" },
    {
      "name": "重要度の印",
      "kind": "card",
      "lane": "severity",
      "stack": 1,
      "subtitle": "重要度で ℹ / ⚠ / ✕ が変わる"
    },
    { "name": "対応", "kind": "card", "lane": "action", "stack": 0, "subtitle": "受け取った人が動く" }
  ],
  "flow": [
    { "from": "きっかけ", "to": "重要度", "label": "分類", "tone": "info" },
    { "from": "重要度", "to": "対応", "label": "通知", "tone": "warning" }
  ],
  "states": { "alert": "[2,\\"CPU 92% を 5 分継続 — 調査要\\"]" },
  "animation": [
    {
      "step": "軽微な知らせ",
      "duration": 1.8,
      "focus": ["きっかけ", "重要度"],
      "set": { "alert": "[0,\\"CPU 68% — 通常の範囲\\"]" },
      "badge": "info",
      "body": "重要度が最も低い。 帯は青で、印は情報を表す形になる。"
    },
    {
      "step": "注意に上がる",
      "duration": 1.8,
      "focus": ["きっかけ", "重要度", "重要度の印"],
      "set": { "alert": "[2,\\"CPU 92% を 5 分継続 — 調査要\\"]" },
      "badge": "warn",
      "body": "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。"
    },
    {
      "step": "異常に上がる",
      "duration": 1.8,
      "focus": ["きっかけ", "重要度", "重要度の印", "対応"],
      "set": { "alert": "[3,\\"prod-web-3 応答なし — 全系統の切替が要る\\"]" },
      "badge": "error",
      "body": "重要度が最大になり帯が赤くなる。 本文と印も異常を表す内容に入れ替わる。"
    }
  ]
}`;

export const sourceYaml__serviceHealthGrid = `title: "各サービスの稼働状態を一覧で見せる"
type: flow

readouts:
  sh: { kind: service-health, source: "svcs", label: "サービス (6)" }

lanes:
  up: { x: 0, width: 240 }
  deg: { x: 280, width: 240 }
  down: { x: 560, width: 240 }

states:
  svcs: '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]'

actors:
  - api: { kind: card, lane: up, stack: 0, subtitle: "稼働を表す緑のマス" }
  - web: { kind: card, lane: up, stack: 1, subtitle: "稼働を表す緑のマス" }
  - auth: { kind: card, lane: up, stack: 2, subtitle: "稼働を表す緑のマス" }
  - db: { kind: card, lane: deg, stack: 0, subtitle: "劣化を表す黄のマス" }
  - cache: { kind: card, lane: deg, stack: 1, subtitle: "劣化を表す黄のマス" }
  - queue: { kind: card, lane: down, stack: 0, subtitle: "停止を表す赤のマス" }

flow:
  - db -> queue: "波及" (error)

animation:
  - step: "全て稼働" 1.8s
    focus: ["api", "web", "auth"]
    set:
      svcs: '[["api",2],["web",2],["auth",2],["db",2],["cache",2],["queue",2]]'
    badge: "全稼働"
    description: "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。"
  - step: "一部が劣化" 1.8s
    focus: ["api", "web", "auth", "db", "cache"]
    set:
      svcs: '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",2]]'
    badge: "劣化"
    description: "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。"
  - step: "1 つが停止" 1.8s
    focus: ["api", "web", "auth", "db", "cache", "queue"]
    set:
      svcs: '[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]'
    badge: "障害"
    description: "最後の 1 つが赤になる。 緑 3 と黄 2 と赤 1 の内訳が、色を数えて読み取れる。"
`;

export const sourceJson__serviceHealthGrid = `{
  "title": "各サービスの稼働状態を一覧で見せる",
  "type": "flow",
  "readouts": [
    { "id": "sh", "kind": "service-health", "source": "svcs", "label": "サービス (6)" }
  ],
  "lanes": {
    "up": { "x": 0, "width": 240 },
    "deg": { "x": 280, "width": 240 },
    "down": { "x": 560, "width": 240 }
  },
  "actors": [
    { "name": "api", "kind": "card", "lane": "up", "stack": 0, "subtitle": "稼働を表す緑のマス" },
    { "name": "web", "kind": "card", "lane": "up", "stack": 1, "subtitle": "稼働を表す緑のマス" },
    { "name": "auth", "kind": "card", "lane": "up", "stack": 2, "subtitle": "稼働を表す緑のマス" },
    { "name": "db", "kind": "card", "lane": "deg", "stack": 0, "subtitle": "劣化を表す黄のマス" },
    { "name": "cache", "kind": "card", "lane": "deg", "stack": 1, "subtitle": "劣化を表す黄のマス" },
    { "name": "queue", "kind": "card", "lane": "down", "stack": 0, "subtitle": "停止を表す赤のマス" }
  ],
  "flow": [
    { "from": "db", "to": "queue", "label": "波及", "tone": "error" }
  ],
  "states": { "svcs": "[[\\"api\\",2],[\\"web\\",2],[\\"auth\\",2],[\\"db\\",1],[\\"cache\\",1],[\\"queue\\",0]]" },
  "animation": [
    {
      "step": "全て稼働",
      "duration": 1.8,
      "focus": ["api", "web", "auth"],
      "set": {
        "svcs": "[[\\"api\\",2],[\\"web\\",2],[\\"auth\\",2],[\\"db\\",2],[\\"cache\\",2],[\\"queue\\",2]]"
      },
      "badge": "全稼働",
      "body": "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。"
    },
    {
      "step": "一部が劣化",
      "duration": 1.8,
      "focus": ["api", "web", "auth", "db", "cache"],
      "set": {
        "svcs": "[[\\"api\\",2],[\\"web\\",2],[\\"auth\\",2],[\\"db\\",1],[\\"cache\\",1],[\\"queue\\",2]]"
      },
      "badge": "劣化",
      "body": "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。"
    },
    {
      "step": "1 つが停止",
      "duration": 1.8,
      "focus": ["api", "web", "auth", "db", "cache", "queue"],
      "set": {
        "svcs": "[[\\"api\\",2],[\\"web\\",2],[\\"auth\\",2],[\\"db\\",1],[\\"cache\\",1],[\\"queue\\",0]]"
      },
      "badge": "障害",
      "body": "最後の 1 つが赤になる。 緑 3 と黄 2 と赤 1 の内訳が、色を数えて読み取れる。"
    }
  ]
}`;

export const sourceYaml__checkoutCartSummary = `title: "カートの小計から合計までを積み上げる"
type: flow

readouts:
  cs: { kind: cart-summary, source: "cart", currency: "$", colorTotal: "#2563eb", label: "カート合計" }

lanes:
  items: { x: 0, width: 220 }
  costs: { x: 260, width: 260 }
  total: { x: 560, width: 240 }

states:
  cart: "[3,149.85,8.5,158.35]"

actors:
  - 商品数: { kind: card, lane: items, stack: 0, subtitle: "カートに入れた点数" }
  - 小計: { kind: card, lane: costs, stack: 0, subtitle: "商品の金額を足した値" }
  - 送料: { kind: card, lane: costs, stack: 1, subtitle: "小計に加える配送費" }
  - 合計: { kind: card, lane: total, stack: 0, subtitle: "末尾の行 · 太字と青で出る" }

flow:
  - 商品数 -> 小計: "集計" (info)
  - 小計 -> 合計: "+送料" (success)
  - 送料 -> 合計: "加算" (info)

animation:
  - step: "1 点だけ入れる" 1.8s
    focus: ["商品数", "小計"]
    set:
      cart: "[1,49.9,8.5,58.4]"
    badge: "小計"
    description: "4 行が並ぶ。 金額はどれも小数 2 桁で出るため、整数を渡しても末尾が 0 で揃う。"
  - step: "点数を増やす" 1.8s
    focus: ["商品数", "小計", "送料"]
    set:
      cart: "[2,99.9,8.5,108.4]"
    badge: "送料"
    description: "小計が上がり合計も動く。 送料は変わらないため、3 行目だけが同じ値のまま残る。"
  - step: "確定する" 1.8s
    focus: ["商品数", "小計", "送料", "合計"]
    set:
      cart: "[3,149.85,8.5,158.35]"
    badge: "合計"
    description: "合計が最も大きくなる。 最後の行だけ太字と青で出て、他の 3 行と区別される。"
`;

export const sourceJson__checkoutCartSummary = `{
  "title": "カートの小計から合計までを積み上げる",
  "type": "flow",
  "readouts": [
    {
      "id": "cs",
      "kind": "cart-summary",
      "source": "cart",
      "currency": "$",
      "colorTotal": "#2563eb",
      "label": "カート合計"
    }
  ],
  "lanes": {
    "items": { "x": 0, "width": 220 },
    "costs": { "x": 260, "width": 260 },
    "total": { "x": 560, "width": 240 }
  },
  "actors": [
    { "name": "商品数", "kind": "card", "lane": "items", "stack": 0, "subtitle": "カートに入れた点数" },
    { "name": "小計", "kind": "card", "lane": "costs", "stack": 0, "subtitle": "商品の金額を足した値" },
    { "name": "送料", "kind": "card", "lane": "costs", "stack": 1, "subtitle": "小計に加える配送費" },
    { "name": "合計", "kind": "card", "lane": "total", "stack": 0, "subtitle": "末尾の行 · 太字と青で出る" }
  ],
  "flow": [
    { "from": "商品数", "to": "小計", "label": "集計", "tone": "info" },
    { "from": "小計", "to": "合計", "label": "+送料", "tone": "success" },
    { "from": "送料", "to": "合計", "label": "加算", "tone": "info" }
  ],
  "states": { "cart": "[3,149.85,8.5,158.35]" },
  "animation": [
    {
      "step": "1 点だけ入れる",
      "duration": 1.8,
      "focus": ["商品数", "小計"],
      "set": { "cart": "[1,49.9,8.5,58.4]" },
      "badge": "小計",
      "body": "4 行が並ぶ。 金額はどれも小数 2 桁で出るため、整数を渡しても末尾が 0 で揃う。"
    },
    {
      "step": "点数を増やす",
      "duration": 1.8,
      "focus": ["商品数", "小計", "送料"],
      "set": { "cart": "[2,99.9,8.5,108.4]" },
      "badge": "送料",
      "body": "小計が上がり合計も動く。 送料は変わらないため、3 行目だけが同じ値のまま残る。"
    },
    {
      "step": "確定する",
      "duration": 1.8,
      "focus": ["商品数", "小計", "送料", "合計"],
      "set": { "cart": "[3,149.85,8.5,158.35]" },
      "badge": "合計",
      "body": "合計が最も大きくなる。 最後の行だけ太字と青で出て、他の 3 行と区別される。"
    }
  ]
}`;

export const sourceYaml__saasPricingTier = `title: "料金 3 プランを並べて比べる"
type: flow

readouts:
  pt: { kind: pricing-tier, source: "plan", colorAccent: "#2563eb", currency: "$", label: "プラン" }

lanes:
  starter: { x: 0, width: 240 }
  pro: { x: 280, width: 240 }
  enterprise: { x: 560, width: 260 }

states:
  plan: '["Pro",29,"10 席","優先サポート","カスタムドメイン"]'

actors:
  - Starter2: { kind: card, lane: starter, stack: 0, subtitle: "最も安いプラン", title: "Starter" }
  - Pro2: { kind: card, lane: pro, stack: 0, subtitle: "中間のプラン", title: "Pro" }
  - 特典の欄: { kind: card, lane: pro, stack: 1, subtitle: "名前と価格の後に並ぶ特典" }
  - Enterprise2: { kind: card, lane: enterprise, stack: 0, subtitle: "最も高いプラン", title: "Enterprise" }

flow:
  - Starter2 -> Pro2: "アップグレード" (info)
  - Pro2 -> Enterprise2: "アップグレード" (success)

animation:
  - step: "最も安いプラン" 1.8s
    focus: ["Starter2"]
    set:
      plan: '["Starter",9,"3 席"]'
    badge: "Starter"
    description: "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。"
  - step: "中間のプラン" 1.8s
    focus: ["Starter2", "Pro2", "特典の欄"]
    set:
      plan: '["Pro",29,"10 席","優先サポート","カスタムドメイン"]'
    badge: "Pro"
    description: "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。"
  - step: "最も高いプラン" 1.8s
    focus: ["Starter2", "Pro2", "特典の欄", "Enterprise2"]
    set:
      plan: '["Enterprise",99,"無制限の席","専任の担当","監査ログ","SSO 連携","SLA 保証"]'
    badge: "比較"
    description: "特典を 5 つ渡しても出るのは **先頭 3 つ** まで。 4 つ目以降は表示に載らない。"
`;

export const sourceJson__saasPricingTier = `{
  "title": "料金 3 プランを並べて比べる",
  "type": "flow",
  "readouts": [
    {
      "id": "pt",
      "kind": "pricing-tier",
      "source": "plan",
      "colorAccent": "#2563eb",
      "currency": "$",
      "label": "プラン"
    }
  ],
  "lanes": {
    "starter": { "x": 0, "width": 240 },
    "pro": { "x": 280, "width": 240 },
    "enterprise": { "x": 560, "width": 260 }
  },
  "actors": [
    {
      "name": "Starter2",
      "kind": "card",
      "lane": "starter",
      "stack": 0,
      "subtitle": "最も安いプラン",
      "title": "Starter"
    },
    {
      "name": "Pro2",
      "kind": "card",
      "lane": "pro",
      "stack": 0,
      "subtitle": "中間のプラン",
      "title": "Pro"
    },
    { "name": "特典の欄", "kind": "card", "lane": "pro", "stack": 1, "subtitle": "名前と価格の後に並ぶ特典" },
    {
      "name": "Enterprise2",
      "kind": "card",
      "lane": "enterprise",
      "stack": 0,
      "subtitle": "最も高いプラン",
      "title": "Enterprise"
    }
  ],
  "flow": [
    { "from": "Starter2", "to": "Pro2", "label": "アップグレード", "tone": "info" },
    { "from": "Pro2", "to": "Enterprise2", "label": "アップグレード", "tone": "success" }
  ],
  "states": { "plan": "[\\"Pro\\",29,\\"10 席\\",\\"優先サポート\\",\\"カスタムドメイン\\"]" },
  "animation": [
    {
      "step": "最も安いプラン",
      "duration": 1.8,
      "focus": ["Starter2"],
      "set": { "plan": "[\\"Starter\\",9,\\"3 席\\"]" },
      "badge": "Starter",
      "body": "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。"
    },
    {
      "step": "中間のプラン",
      "duration": 1.8,
      "focus": ["Starter2", "Pro2", "特典の欄"],
      "set": { "plan": "[\\"Pro\\",29,\\"10 席\\",\\"優先サポート\\",\\"カスタムドメイン\\"]" },
      "badge": "Pro",
      "body": "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。"
    },
    {
      "step": "最も高いプラン",
      "duration": 1.8,
      "focus": ["Starter2", "Pro2", "特典の欄", "Enterprise2"],
      "set": { "plan": "[\\"Enterprise\\",99,\\"無制限の席\\",\\"専任の担当\\",\\"監査ログ\\",\\"SSO 連携\\",\\"SLA 保証\\"]" },
      "badge": "比較",
      "body": "特典を 5 つ渡しても出るのは **先頭 3 つ** まで。 4 つ目以降は表示に載らない。"
    }
  ]
}`;

export const sourceYaml__checkoutCouponApply = `title: "クーポンの未入力から適用までを追う"
type: flow

readouts:
  cc: { kind: coupon-code, source: "coupon", colorApplied: "#22c55e", label: "クーポン" }

lanes:
  empty: { x: 0, width: 240 }
  entered: { x: 280, width: 240 }
  applied: { x: 560, width: 240 }

states:
  coupon: '["SAVE20",20]'

actors:
  - 未入力: { kind: card, lane: empty, stack: 0, subtitle: "符号が空の状態" }
  - 入力済: { kind: card, lane: entered, stack: 0, subtitle: "符号は入ったが割引がまだ無い" }
  - 適用ボタン: { kind: card, lane: entered, stack: 1, subtitle: "押すと割引が入る" }
  - 適用済: { kind: card, lane: applied, stack: 0, subtitle: "割引が正になり緑の札が出る" }

flow:
  - 未入力 -> 入力済: "コード入力" (info)
  - 入力済 -> 適用済: "適用" (success)

animation:
  - step: "未入力" 1.8s
    focus: ["未入力"]
    set:
      coupon: '["",0]'
    badge: "未入力"
    description: "符号が空で割引も 0。 入力を促す表示だけが出て、割引の札は現れない。"
  - step: "符号を入れる" 1.8s
    focus: ["未入力", "入力済", "適用ボタン"]
    set:
      coupon: '["SAVE20",0]'
    badge: "入力済"
    description: "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。"
  - step: "適用する" 1.8s
    focus: ["未入力", "入力済", "適用ボタン", "適用済"]
    set:
      coupon: '["SAVE20",20]'
    badge: "適用"
    description: "割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。"
`;

export const sourceJson__checkoutCouponApply = `{
  "title": "クーポンの未入力から適用までを追う",
  "type": "flow",
  "readouts": [
    {
      "id": "cc",
      "kind": "coupon-code",
      "source": "coupon",
      "colorApplied": "#22c55e",
      "label": "クーポン"
    }
  ],
  "lanes": {
    "empty": { "x": 0, "width": 240 },
    "entered": { "x": 280, "width": 240 },
    "applied": { "x": 560, "width": 240 }
  },
  "actors": [
    { "name": "未入力", "kind": "card", "lane": "empty", "stack": 0, "subtitle": "符号が空の状態" },
    {
      "name": "入力済",
      "kind": "card",
      "lane": "entered",
      "stack": 0,
      "subtitle": "符号は入ったが割引がまだ無い"
    },
    { "name": "適用ボタン", "kind": "card", "lane": "entered", "stack": 1, "subtitle": "押すと割引が入る" },
    {
      "name": "適用済",
      "kind": "card",
      "lane": "applied",
      "stack": 0,
      "subtitle": "割引が正になり緑の札が出る"
    }
  ],
  "flow": [
    { "from": "未入力", "to": "入力済", "label": "コード入力", "tone": "info" },
    { "from": "入力済", "to": "適用済", "label": "適用", "tone": "success" }
  ],
  "states": { "coupon": "[\\"SAVE20\\",20]" },
  "animation": [
    {
      "step": "未入力",
      "duration": 1.8,
      "focus": ["未入力"],
      "set": { "coupon": "[\\"\\",0]" },
      "badge": "未入力",
      "body": "符号が空で割引も 0。 入力を促す表示だけが出て、割引の札は現れない。"
    },
    {
      "step": "符号を入れる",
      "duration": 1.8,
      "focus": ["未入力", "入力済", "適用ボタン"],
      "set": { "coupon": "[\\"SAVE20\\",0]" },
      "badge": "入力済",
      "body": "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。"
    },
    {
      "step": "適用する",
      "duration": 1.8,
      "focus": ["未入力", "入力済", "適用ボタン", "適用済"],
      "set": { "coupon": "[\\"SAVE20\\",20]" },
      "badge": "適用",
      "body": "割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。"
    }
  ]
}`;

export const sourceYaml__blogArticlePreview = `title: "記事カードの見出しと抜粋と著者を並べる"
type: flow

readouts:
  ap: { kind: article-preview, source: "article", colorAccent: "#2563eb", label: "記事 card" }

lanes:
  thumb: { x: 0, width: 200 }
  content: { x: 220, width: 320 }
  meta: { x: 560, width: 220 }

states:
  article: '["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]'

actors:
  - サムネイル: { kind: card, lane: thumb, stack: 0, subtitle: "配列の値に依らず固定" }
  - タイトル: { kind: card, lane: content, stack: 0, subtitle: "長いと末尾を省いて出る見出し" }
  - 抜粋: { kind: card, lane: content, stack: 1, subtitle: "折り返して出る本文" }
  - 著者: { kind: card, lane: meta, stack: 0, subtitle: "記事を書いた人の名前" }
  - 経過: { kind: card, lane: meta, stack: 1, subtitle: "記事の公開からの経過" }

flow:
  - サムネイル -> タイトル: "視線" (info)
  - タイトル -> 著者: "帰属" (success)

animation:
  - step: "短い記事" 1.8s
    focus: ["サムネイル", "タイトル"]
    set:
      article: '["入門","はじめの一歩","Bob","5 分前"]'
    badge: "初期"
    description: "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。"
  - step: "抜粋が伸びる" 1.8s
    focus: ["サムネイル", "タイトル", "抜粋"]
    set:
      article: '["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]'
    badge: "hover"
    description: "抜粋が 2 行に分かれる。 1 行目は 28 文字で切れて省略記号が付き、残りが 2 行目に出る。"
  - step: "題も伸びる" 1.8s
    focus: ["サムネイル", "タイトル", "抜粋", "著者", "経過"]
    set:
      article: '["dragon で作る interactive diagram の完全ガイド 2026 年版","段ごとの変化と表示部品の連動を実例つきで最初から順に解説する長い記事","Carol","3 日前"]'
    badge: "click"
    description: "題が 26 文字を超える。 題も末尾を省いて出るため、1 行に収まる形が保たれる。"
`;

export const sourceJson__blogArticlePreview = `{
  "title": "記事カードの見出しと抜粋と著者を並べる",
  "type": "flow",
  "readouts": [
    {
      "id": "ap",
      "kind": "article-preview",
      "source": "article",
      "colorAccent": "#2563eb",
      "label": "記事 card"
    }
  ],
  "lanes": {
    "thumb": { "x": 0, "width": 200 },
    "content": { "x": 220, "width": 320 },
    "meta": { "x": 560, "width": 220 }
  },
  "actors": [
    { "name": "サムネイル", "kind": "card", "lane": "thumb", "stack": 0, "subtitle": "配列の値に依らず固定" },
    {
      "name": "タイトル",
      "kind": "card",
      "lane": "content",
      "stack": 0,
      "subtitle": "長いと末尾を省いて出る見出し"
    },
    { "name": "抜粋", "kind": "card", "lane": "content", "stack": 1, "subtitle": "折り返して出る本文" },
    { "name": "著者", "kind": "card", "lane": "meta", "stack": 0, "subtitle": "記事を書いた人の名前" },
    { "name": "経過", "kind": "card", "lane": "meta", "stack": 1, "subtitle": "記事の公開からの経過" }
  ],
  "flow": [
    { "from": "サムネイル", "to": "タイトル", "label": "視線", "tone": "info" },
    { "from": "タイトル", "to": "著者", "label": "帰属", "tone": "success" }
  ],
  "states": { "article": "[\\"dragon 入門\\",\\"dragon で interactive diagram を作る方法を解説\\",\\"Alice\\",\\"2 時間前\\"]" },
  "animation": [
    {
      "step": "短い記事",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル"],
      "set": { "article": "[\\"入門\\",\\"はじめの一歩\\",\\"Bob\\",\\"5 分前\\"]" },
      "badge": "初期",
      "body": "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。"
    },
    {
      "step": "抜粋が伸びる",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル", "抜粋"],
      "set": {
        "article": "[\\"dragon 入門\\",\\"dragon で interactive diagram を作る方法を解説\\",\\"Alice\\",\\"2 時間前\\"]"
      },
      "badge": "hover",
      "body": "抜粋が 2 行に分かれる。 1 行目は 28 文字で切れて省略記号が付き、残りが 2 行目に出る。"
    },
    {
      "step": "題も伸びる",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル", "抜粋", "著者", "経過"],
      "set": {
        "article": "[\\"dragon で作る interactive diagram の完全ガイド 2026 年版\\",\\"段ごとの変化と表示部品の連動を実例つきで最初から順に解説する長い記事\\",\\"Carol\\",\\"3 日前\\"]"
      },
      "badge": "click",
      "body": "題が 26 文字を超える。 題も末尾を省いて出るため、1 行に収まる形が保たれる。"
    }
  ]
}`;

export const sourceYaml__docsTocNav = `title: "3 段の目次と現在位置を見せる"
type: flow

readouts:
  tn: { kind: toc-nav, source: "toc", colorActive: "#2563eb", label: "ドキュメント TOC" }

lanes:
  lvl0: { x: 0, width: 240 }
  lvl1: { x: 280, width: 260 }
  lvl2: { x: 560, width: 260 }

states:
  toc: '[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
  activeIdx: 0

actors:
  - はじめに: { kind: card, lane: lvl0, stack: 0, subtitle: "最も浅い階層 · 字下げなし" }
  - API リファレンス: { kind: card, lane: lvl0, stack: 1, subtitle: "最も浅い階層 · 字下げなし" }
  - スタートガイド: { kind: card, lane: lvl1, stack: 0, subtitle: "中間の階層 · 少し字下げ" }
  - 高度な使い方: { kind: card, lane: lvl1, stack: 1, subtitle: "中間の階層 · 少し字下げ" }
  - インストール: { kind: card, lane: lvl2, stack: 0, subtitle: "最も深い階層 · 大きく字下げ" }
  - 最初の図: { kind: card, lane: lvl2, stack: 1, subtitle: "最も深い階層 · 大きく字下げ" }

flow:
  - はじめに -> スタートガイド: "次へ" (info)
  - スタートガイド -> インストール: "子" (accent)
  - スタートガイド -> 最初の図: "現在" (success)

animation:
  - step: "先頭を読む" 1.8s
    focus: ["はじめに"]
    set:
      toc: '[[0,"はじめに",1],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
    badge: "Intro"
    description: "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。"
  - step: "下へ進む" 1.8s
    focus: ["はじめに", "スタートガイド"]
    set:
      toc: '[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
    badge: "GS"
    description: "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。"
  - step: "さらに下へ" 1.8s
    focus: ["はじめに", "API リファレンス", "スタートガイド", "高度な使い方", "インストール", "最初の図"]
    set:
      toc: '[[0,"はじめに",0],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
    badge: "First"
    description: "最も深い階層の行が青くなる。 6 行のうち出るのは先頭 6 行までで、字下げが 3 段に分かれる。"
`;

export const sourceJson__docsTocNav = `{
  "title": "3 段の目次と現在位置を見せる",
  "type": "flow",
  "readouts": [
    {
      "id": "tn",
      "kind": "toc-nav",
      "source": "toc",
      "colorActive": "#2563eb",
      "label": "ドキュメント TOC"
    }
  ],
  "lanes": {
    "lvl0": { "x": 0, "width": 240 },
    "lvl1": { "x": 280, "width": 260 },
    "lvl2": { "x": 560, "width": 260 }
  },
  "actors": [
    { "name": "はじめに", "kind": "card", "lane": "lvl0", "stack": 0, "subtitle": "最も浅い階層 · 字下げなし" },
    {
      "name": "API リファレンス",
      "kind": "card",
      "lane": "lvl0",
      "stack": 1,
      "subtitle": "最も浅い階層 · 字下げなし"
    },
    {
      "name": "スタートガイド",
      "kind": "card",
      "lane": "lvl1",
      "stack": 0,
      "subtitle": "中間の階層 · 少し字下げ"
    },
    {
      "name": "高度な使い方",
      "kind": "card",
      "lane": "lvl1",
      "stack": 1,
      "subtitle": "中間の階層 · 少し字下げ"
    },
    {
      "name": "インストール",
      "kind": "card",
      "lane": "lvl2",
      "stack": 0,
      "subtitle": "最も深い階層 · 大きく字下げ"
    },
    {
      "name": "最初の図",
      "kind": "card",
      "lane": "lvl2",
      "stack": 1,
      "subtitle": "最も深い階層 · 大きく字下げ"
    }
  ],
  "flow": [
    { "from": "はじめに", "to": "スタートガイド", "label": "次へ", "tone": "info" },
    { "from": "スタートガイド", "to": "インストール", "label": "子", "tone": "accent" },
    { "from": "スタートガイド", "to": "最初の図", "label": "現在", "tone": "success" }
  ],
  "states": {
    "toc": "[[0,\\"はじめに\\",0],[1,\\"スタートガイド\\",1],[2,\\"インストール\\",0],[2,\\"最初の図\\",1],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]",
    "activeIdx": 0
  },
  "animation": [
    {
      "step": "先頭を読む",
      "duration": 1.8,
      "focus": ["はじめに"],
      "set": {
        "toc": "[[0,\\"はじめに\\",1],[1,\\"スタートガイド\\",0],[2,\\"インストール\\",0],[2,\\"最初の図\\",0],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]"
      },
      "badge": "Intro",
      "body": "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。"
    },
    {
      "step": "下へ進む",
      "duration": 1.8,
      "focus": ["はじめに", "スタートガイド"],
      "set": {
        "toc": "[[0,\\"はじめに\\",0],[1,\\"スタートガイド\\",1],[2,\\"インストール\\",0],[2,\\"最初の図\\",0],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]"
      },
      "badge": "GS",
      "body": "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。"
    },
    {
      "step": "さらに下へ",
      "duration": 1.8,
      "focus": ["はじめに", "API リファレンス", "スタートガイド", "高度な使い方", "インストール", "最初の図"],
      "set": {
        "toc": "[[0,\\"はじめに\\",0],[1,\\"スタートガイド\\",0],[2,\\"インストール\\",0],[2,\\"最初の図\\",1],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]"
      },
      "badge": "First",
      "body": "最も深い階層の行が青くなる。 6 行のうち出るのは先頭 6 行までで、字下げが 3 段に分かれる。"
    }
  ]
}`;

export const sourceYaml__socialShareButtons = `title: "SNS 4 種の共有ボタンを並べる"
type: flow

readouts:
  sb: { kind: share-buttons, source: "shares", label: "シェア" }

lanes:
  tw: { x: 0, width: 200 }
  fb: { x: 220, width: 200 }
  li: { x: 440, width: 200 }

states:
  shares: '[["tw",245],["fb",89],["li",32],["rd",18]]'

actors:
  - tw2: { kind: card, lane: tw, stack: 0, subtitle: "共有が最も多い先", title: "tw" }
  - fb2: { kind: card, lane: fb, stack: 0, subtitle: "次に多い先", title: "fb" }
  - li2: { kind: card, lane: li, stack: 0, subtitle: "中ほどの先", title: "li" }
  - rd: { kind: card, lane: li, stack: 1, subtitle: "共有が最も少ない先" }

flow:
  - tw2 -> fb2: "拡散" (info)
  - fb2 -> li2: "拡散" (info)
  - li2 -> rd: "拡散" (info)

animation:
  - step: "投稿した直後" 1.8s
    focus: ["tw2"]
    set:
      shares: '[["tw",12],["fb",5],["li",3],["rd",1]]'
    badge: "開始"
    description: "4 つのボタンが並び、数はどれも小さい。 ボタンの大きさは数に依らず一定。"
  - step: "広まる" 1.8s
    focus: ["tw2", "fb2", "li2"]
    set:
      shares: '[["tw",98],["fb",41],["li",17],["rd",8]]'
    badge: "拡散"
    description: "数が桁 1 つぶん増える。 並びと色は変わらず、ボタンの中の数だけが上がる。"
  - step: "落ち着く" 1.8s
    focus: ["tw2", "fb2", "li2", "rd"]
    set:
      shares: '[["tw",245],["fb",89],["li",32],["rd",18],["hn",6]]'
    badge: "バズ"
    description: "4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。"
`;

export const sourceJson__socialShareButtons = `{
  "title": "SNS 4 種の共有ボタンを並べる",
  "type": "flow",
  "readouts": [
    { "id": "sb", "kind": "share-buttons", "source": "shares", "label": "シェア" }
  ],
  "lanes": {
    "tw": { "x": 0, "width": 200 },
    "fb": { "x": 220, "width": 200 },
    "li": { "x": 440, "width": 200 }
  },
  "actors": [
    {
      "name": "tw2",
      "kind": "card",
      "lane": "tw",
      "stack": 0,
      "subtitle": "共有が最も多い先",
      "title": "tw"
    },
    {
      "name": "fb2",
      "kind": "card",
      "lane": "fb",
      "stack": 0,
      "subtitle": "次に多い先",
      "title": "fb"
    },
    {
      "name": "li2",
      "kind": "card",
      "lane": "li",
      "stack": 0,
      "subtitle": "中ほどの先",
      "title": "li"
    },
    { "name": "rd", "kind": "card", "lane": "li", "stack": 1, "subtitle": "共有が最も少ない先" }
  ],
  "flow": [
    { "from": "tw2", "to": "fb2", "label": "拡散", "tone": "info" },
    { "from": "fb2", "to": "li2", "label": "拡散", "tone": "info" },
    { "from": "li2", "to": "rd", "label": "拡散", "tone": "info" }
  ],
  "states": { "shares": "[[\\"tw\\",245],[\\"fb\\",89],[\\"li\\",32],[\\"rd\\",18]]" },
  "animation": [
    {
      "step": "投稿した直後",
      "duration": 1.8,
      "focus": ["tw2"],
      "set": { "shares": "[[\\"tw\\",12],[\\"fb\\",5],[\\"li\\",3],[\\"rd\\",1]]" },
      "badge": "開始",
      "body": "4 つのボタンが並び、数はどれも小さい。 ボタンの大きさは数に依らず一定。"
    },
    {
      "step": "広まる",
      "duration": 1.8,
      "focus": ["tw2", "fb2", "li2"],
      "set": { "shares": "[[\\"tw\\",98],[\\"fb\\",41],[\\"li\\",17],[\\"rd\\",8]]" },
      "badge": "拡散",
      "body": "数が桁 1 つぶん増える。 並びと色は変わらず、ボタンの中の数だけが上がる。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["tw2", "fb2", "li2", "rd"],
      "set": { "shares": "[[\\"tw\\",245],[\\"fb\\",89],[\\"li\\",32],[\\"rd\\",18],[\\"hn\\",6]]" },
      "badge": "バズ",
      "body": "4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。"
    }
  ]
}`;

export const sourceYaml__exemplarPaymentFlow = `title: "EC 決済を購入から記帳まで 4 段階で追う"
type: flow

readouts:
  amountStat: { kind: stat, source: "amount", caption: "決済金額", unit: " 円", label: "金額" }
  authGauge: { kind: gauge, source: "auth3ds", min: 0, max: 100, color: "#22c55e", label: "3DS 認証 %" }
  statusTL: { kind: traffic-light, source: "txStatus", label: "決済 status" }
  totalCU: { kind: countup, source: "totalTx", decimals: 0, unit: " 件", label: "本日累計 tx" }

lanes:
  customer-lane: { x: 0, width: 220 }
  processor: { x: 240, width: 280 }
  bank: { x: 540, width: 220 }

states:
  amount: 0
  auth3ds: 0
  txStatus: 0
  totalTx: 1247

actors:
  - 田中様: { kind: shape-person, lane: customer-lane, stack: 0, eyebrow: "customer", subtitle: "購入者" }
  - iPhone: { kind: shape-mobile-device, lane: customer-lane, stack: 1, eyebrow: "device", subtitle: "Safari / iOS 17" }
  - VISA **1234: { kind: shape-credit-card, lane: customer-lane, stack: 2, eyebrow: "card", subtitle: "MUFG 発行" }
  - BuyNow: { kind: shape-online-shop, lane: processor, stack: 0, eyebrow: "merchant", subtitle: "checkout · ¥{amount}" }
  - API Gateway: { kind: shape-api-gateway, lane: processor, stack: 1, eyebrow: "gateway", subtitle: "認証 + rate limit" }
  - Stripe: { kind: shape-payment-provider, lane: processor, stack: 2, eyebrow: "provider", subtitle: "3DS {auth3ds}%" }
  - MUFG: { kind: shape-bank, lane: bank, stack: 0, eyebrow: "issuer", subtitle: "発行銀行 · 与信照会" }
  - 取引台帳: { kind: shape-cylinder, lane: bank, stack: 1, eyebrow: "database", subtitle: "記帳 + 監査 log" }

flow:
  - 田中様 -> iPhone: "操作" (info)
  - iPhone -> BuyNow: "購入" (info)
  - BuyNow -> API Gateway: "POST /pay" (info)
  - API Gateway -> Stripe: "転送" (info)
  - VISA **1234 -> Stripe: "3DS 認証" (accent)
  - Stripe -> MUFG: "決済要求" (success)
  - MUFG -> 取引台帳: "記帳" (success)

animation:
  - step: "商品購入" 2.2s
    focus: ["田中様", "iPhone", "VISA **1234", "BuyNow"]
    tween:
      amount: 0 -> 12500
    set:
      txStatus: 0
      auth3ds: 0
    badge: "購入"
    description: "田中様が iPhone で BuyNow にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。"
  - step: "3DS 認証" 2.5s
    focus: ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe"]
    tween:
      txStatus: 0 -> 1
      auth3ds: 0 -> 92
    badge: "3DS 認証"
    description: "gateway 経由で Stripe に転送、 VISA カードの 3D-Secure 認証実行。 txStatus 0 → 1 tween (traffic-light 赤 → 黄)、 auth3ds 0 → 92% tween (gauge 針が緑域まで上昇)。 processor lane 全 activate、 card → provider の accent edge。"
  - step: "銀行確定" 2s
    focus: ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe", "MUFG"]
    tween:
      txStatus: 1 -> 2
      auth3ds: 92 -> 98
    badge: "銀行確定"
    description: "認証通過、 発行銀行 MUFG に与信照会 + 決済確定。 txStatus 1 → 2 tween (traffic-light 黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 bank lane activate。"
  - step: "記帳完了" 1.8s
    focus: ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe", "MUFG", "取引台帳"]
    tween:
      totalTx: 1247 -> 1248
    set:
      txStatus: 2
    badge: "記帳完了"
    description: "銀行が取引台帳に記帳 + 監査 log 記録、 totalTx 1247 → 1248 tween (countup が +1 加算表示、 800ms かけて動的 count up)、 全 8 shape active、 決済 flow 完遂。"
`;

export const sourceJson__exemplarPaymentFlow = `{
  "title": "EC 決済を購入から記帳まで 4 段階で追う",
  "type": "flow",
  "readouts": [
    {
      "id": "amountStat",
      "kind": "stat",
      "source": "amount",
      "caption": "決済金額",
      "unit": " 円",
      "label": "金額"
    },
    {
      "id": "authGauge",
      "kind": "gauge",
      "source": "auth3ds",
      "min": 0,
      "max": 100,
      "color": "#22c55e",
      "label": "3DS 認証 %"
    },
    { "id": "statusTL", "kind": "traffic-light", "source": "txStatus", "label": "決済 status" },
    {
      "id": "totalCU",
      "kind": "countup",
      "source": "totalTx",
      "decimals": 0,
      "unit": " 件",
      "label": "本日累計 tx"
    }
  ],
  "lanes": {
    "customer-lane": { "x": 0, "width": 220 },
    "processor": { "x": 240, "width": 280 },
    "bank": { "x": 540, "width": 220 }
  },
  "actors": [
    {
      "name": "田中様",
      "kind": "shape-person",
      "lane": "customer-lane",
      "stack": 0,
      "eyebrow": "customer",
      "subtitle": "購入者"
    },
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "customer-lane",
      "stack": 1,
      "eyebrow": "device",
      "subtitle": "Safari / iOS 17"
    },
    {
      "name": "VISA **1234",
      "kind": "shape-credit-card",
      "lane": "customer-lane",
      "stack": 2,
      "eyebrow": "card",
      "subtitle": "MUFG 発行"
    },
    {
      "name": "BuyNow",
      "kind": "shape-online-shop",
      "lane": "processor",
      "stack": 0,
      "eyebrow": "merchant",
      "subtitle": "checkout · ¥{amount}"
    },
    {
      "name": "API Gateway",
      "kind": "shape-api-gateway",
      "lane": "processor",
      "stack": 1,
      "eyebrow": "gateway",
      "subtitle": "認証 + rate limit"
    },
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "processor",
      "stack": 2,
      "eyebrow": "provider",
      "subtitle": "3DS {auth3ds}%"
    },
    {
      "name": "MUFG",
      "kind": "shape-bank",
      "lane": "bank",
      "stack": 0,
      "eyebrow": "issuer",
      "subtitle": "発行銀行 · 与信照会"
    },
    {
      "name": "取引台帳",
      "kind": "shape-cylinder",
      "lane": "bank",
      "stack": 1,
      "eyebrow": "database",
      "subtitle": "記帳 + 監査 log"
    }
  ],
  "flow": [
    { "from": "田中様", "to": "iPhone", "label": "操作", "tone": "info" },
    { "from": "iPhone", "to": "BuyNow", "label": "購入", "tone": "info" },
    { "from": "BuyNow", "to": "API Gateway", "label": "POST /pay", "tone": "info" },
    { "from": "API Gateway", "to": "Stripe", "label": "転送", "tone": "info" },
    { "from": "VISA **1234", "to": "Stripe", "label": "3DS 認証", "tone": "accent" },
    { "from": "Stripe", "to": "MUFG", "label": "決済要求", "tone": "success" },
    { "from": "MUFG", "to": "取引台帳", "label": "記帳", "tone": "success" }
  ],
  "states": { "amount": 0, "auth3ds": 0, "txStatus": 0, "totalTx": 1247 },
  "animation": [
    {
      "step": "商品購入",
      "duration": 2.2,
      "focus": ["田中様", "iPhone", "VISA **1234", "BuyNow"],
      "tween": { "amount": [0, 12500] },
      "set": { "txStatus": 0, "auth3ds": 0 },
      "badge": "購入",
      "body": "田中様が iPhone で BuyNow にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。"
    },
    {
      "step": "3DS 認証",
      "duration": 2.5,
      "focus": ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe"],
      "tween": { "txStatus": [0, 1], "auth3ds": [0, 92] },
      "badge": "3DS 認証",
      "body": "gateway 経由で Stripe に転送、 VISA カードの 3D-Secure 認証実行。 txStatus 0 → 1 tween (traffic-light 赤 → 黄)、 auth3ds 0 → 92% tween (gauge 針が緑域まで上昇)。 processor lane 全 activate、 card → provider の accent edge。"
    },
    {
      "step": "銀行確定",
      "duration": 2,
      "focus": ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe", "MUFG"],
      "tween": { "txStatus": [1, 2], "auth3ds": [92, 98] },
      "badge": "銀行確定",
      "body": "認証通過、 発行銀行 MUFG に与信照会 + 決済確定。 txStatus 1 → 2 tween (traffic-light 黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 bank lane activate。"
    },
    {
      "step": "記帳完了",
      "duration": 1.8,
      "focus": ["田中様", "iPhone", "VISA **1234", "BuyNow", "API Gateway", "Stripe", "MUFG", "取引台帳"],
      "tween": { "totalTx": [1247, 1248] },
      "set": { "txStatus": 2 },
      "badge": "記帳完了",
      "body": "銀行が取引台帳に記帳 + 監査 log 記録、 totalTx 1247 → 1248 tween (countup が +1 加算表示、 800ms かけて動的 count up)、 全 8 shape active、 決済 flow 完遂。"
    }
  ]
}`;

export const sourceYaml__exemplarLoginFlow = `title: "ログインと 2 要素認証を 5 段階で追う"
type: flow

readouts:
  statusTL: { kind: traffic-light, source: "authStatus", label: "認証 status (0/1/2)" }
  successCU: { kind: countup, source: "successLogin", unit: " 回", label: "本日成功ログイン" }
  rateGauge: { kind: gauge, source: "failRate", min: 0, max: 100, color: "#22c55e", label: "成功率 %" }
  latencyBar: { kind: bar, source: "latency", min: 0, max: 500, color: "#f97316", label: "応答時間 ms" }

lanes:
  user: { x: 0, width: 200 }
  auth: { x: 220, width: 300 }
  session-lane: { x: 540, width: 220 }

states:
  authStatus: 0
  successLogin: 8421
  failRate: 100
  latency: 0

actors:
  - 山田様: { kind: shape-person, lane: user, stack: 0, eyebrow: "user", subtitle: "email + password 送信" }
  - Pixel 8: { kind: shape-mobile-device, lane: user, stack: 1, eyebrow: "device", subtitle: "Chrome / Android 14" }
  - Auth API: { kind: shape-server-rack, lane: auth, stack: 0, eyebrow: "server", subtitle: "credential 一次検証" }
  - 2FA 要求?: { kind: shape-diamond, lane: auth, stack: 1, eyebrow: "decision", subtitle: "TOTP 6 桁 or SMS" }
  - JWT 発行器: { kind: shape-hexagon, lane: auth, stack: 2, eyebrow: "signer", subtitle: "RS256 · exp 1h" }
  - Redis: { kind: shape-cylinder, lane: session-lane, stack: 0, eyebrow: "cache", subtitle: "TTL 3600s" }
  - JWT token: { kind: shape-cloud, lane: session-lane, stack: 1, eyebrow: "response", subtitle: "Bearer · 302 redirect" }

flow:
  - 山田様 -> Pixel 8: "入力" (info)
  - Pixel 8 -> Auth API: "POST /login" (info)
  - Auth API -> 2FA 要求?: "一次 OK" (success)
  - 2FA 要求? -> JWT 発行器: "2FA OK" (success)
  - JWT 発行器 -> Redis: "sid 保存" (success)
  - Redis -> JWT token: "token 発行" (success)

animation:
  - step: "認証要求" 1.5s
    focus: ["山田様", "Pixel 8"]
    tween:
      latency: 0 -> 80
    set:
      authStatus: 0
    badge: "要求"
    description: "山田様が Pixel でログイン画面に credential 送信。 authStatus = 0 (traffic-light 赤 = 未検証)、 latency 0 → 80ms tween (bar 立ち上がり)、 gauge 100%、 countup 保持。 user lane 全 active。"
  - step: "一次検証" 2s
    focus: ["山田様", "Pixel 8", "Auth API", "2FA 要求?"]
    tween:
      authStatus: 0 -> 1
      latency: 80 -> 220
      failRate: 100 -> 99
    badge: "一次検証"
    description: "Auth API が credential 照合、 hash 比較。 authStatus 0 → 1 tween (traffic-light 赤 → 黄)、 latency 80 → 220ms tween (bcrypt で bar 伸長)、 gauge 100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。"
  - step: "2FA 検証" 2.2s
    focus: ["山田様", "Pixel 8", "Auth API", "2FA 要求?"]
    tween:
      latency: 220 -> 350
    set:
      authStatus: 1
    badge: "2FA"
    description: "TOTP 6 桁認証、 認証サーバが time-window 比較。 authStatus 1 → 1 保持 (traffic-light 黄)、 latency 220 → 350ms tween (2FA overhead で bar さらに伸長)、 mfaCheck diamond が pending 状態。"
  - step: "セッション発行" 2s
    focus: ["山田様", "Pixel 8", "Auth API", "2FA 要求?", "JWT 発行器", "Redis"]
    tween:
      authStatus: 1 -> 2
      latency: 350 -> 180
    badge: "発行"
    description: "2FA 通過、 JWT 発行 + Redis に session 保存。 authStatus 1 → 2 tween (traffic-light 黄 → 緑)、 latency 350 → 180ms tween (bar 縮小)、 gauge 99 → 99% 維持、 jwtSign + session lane activate。"
  - step: "応答返却" 1.8s
    focus: ["山田様", "Pixel 8", "Auth API", "2FA 要求?", "JWT 発行器", "Redis", "JWT token"]
    tween:
      successLogin: 8421 -> 8422
      latency: 180 -> 50
    set:
      authStatus: 2
    badge: "応答"
    description: "JWT token を Bearer header で返却、 302 redirect。 successLogin 8421 → 8422 tween (countup が +1 加算表示、 900ms かけて動的)、 latency 180 → 50ms tween (最終)、 全 7 shape active。"
`;

export const sourceJson__exemplarLoginFlow = `{
  "title": "ログインと 2 要素認証を 5 段階で追う",
  "type": "flow",
  "readouts": [
    {
      "id": "statusTL",
      "kind": "traffic-light",
      "source": "authStatus",
      "label": "認証 status (0/1/2)"
    },
    {
      "id": "successCU",
      "kind": "countup",
      "source": "successLogin",
      "unit": " 回",
      "label": "本日成功ログイン"
    },
    {
      "id": "rateGauge",
      "kind": "gauge",
      "source": "failRate",
      "min": 0,
      "max": 100,
      "color": "#22c55e",
      "label": "成功率 %"
    },
    {
      "id": "latencyBar",
      "kind": "bar",
      "source": "latency",
      "min": 0,
      "max": 500,
      "color": "#f97316",
      "label": "応答時間 ms"
    }
  ],
  "lanes": {
    "user": { "x": 0, "width": 200 },
    "auth": { "x": 220, "width": 300 },
    "session-lane": { "x": 540, "width": 220 }
  },
  "actors": [
    {
      "name": "山田様",
      "kind": "shape-person",
      "lane": "user",
      "stack": 0,
      "eyebrow": "user",
      "subtitle": "email + password 送信"
    },
    {
      "name": "Pixel 8",
      "kind": "shape-mobile-device",
      "lane": "user",
      "stack": 1,
      "eyebrow": "device",
      "subtitle": "Chrome / Android 14"
    },
    {
      "name": "Auth API",
      "kind": "shape-server-rack",
      "lane": "auth",
      "stack": 0,
      "eyebrow": "server",
      "subtitle": "credential 一次検証"
    },
    {
      "name": "2FA 要求?",
      "kind": "shape-diamond",
      "lane": "auth",
      "stack": 1,
      "eyebrow": "decision",
      "subtitle": "TOTP 6 桁 or SMS"
    },
    {
      "name": "JWT 発行器",
      "kind": "shape-hexagon",
      "lane": "auth",
      "stack": 2,
      "eyebrow": "signer",
      "subtitle": "RS256 · exp 1h"
    },
    {
      "name": "Redis",
      "kind": "shape-cylinder",
      "lane": "session-lane",
      "stack": 0,
      "eyebrow": "cache",
      "subtitle": "TTL 3600s"
    },
    {
      "name": "JWT token",
      "kind": "shape-cloud",
      "lane": "session-lane",
      "stack": 1,
      "eyebrow": "response",
      "subtitle": "Bearer · 302 redirect"
    }
  ],
  "flow": [
    { "from": "山田様", "to": "Pixel 8", "label": "入力", "tone": "info" },
    { "from": "Pixel 8", "to": "Auth API", "label": "POST /login", "tone": "info" },
    { "from": "Auth API", "to": "2FA 要求?", "label": "一次 OK", "tone": "success" },
    { "from": "2FA 要求?", "to": "JWT 発行器", "label": "2FA OK", "tone": "success" },
    { "from": "JWT 発行器", "to": "Redis", "label": "sid 保存", "tone": "success" },
    { "from": "Redis", "to": "JWT token", "label": "token 発行", "tone": "success" }
  ],
  "states": { "authStatus": 0, "successLogin": 8421, "failRate": 100, "latency": 0 },
  "animation": [
    {
      "step": "認証要求",
      "duration": 1.5,
      "focus": ["山田様", "Pixel 8"],
      "tween": { "latency": [0, 80] },
      "set": { "authStatus": 0 },
      "badge": "要求",
      "body": "山田様が Pixel でログイン画面に credential 送信。 authStatus = 0 (traffic-light 赤 = 未検証)、 latency 0 → 80ms tween (bar 立ち上がり)、 gauge 100%、 countup 保持。 user lane 全 active。"
    },
    {
      "step": "一次検証",
      "duration": 2,
      "focus": ["山田様", "Pixel 8", "Auth API", "2FA 要求?"],
      "tween": { "authStatus": [0, 1], "latency": [80, 220], "failRate": [100, 99] },
      "badge": "一次検証",
      "body": "Auth API が credential 照合、 hash 比較。 authStatus 0 → 1 tween (traffic-light 赤 → 黄)、 latency 80 → 220ms tween (bcrypt で bar 伸長)、 gauge 100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。"
    },
    {
      "step": "2FA 検証",
      "duration": 2.2,
      "focus": ["山田様", "Pixel 8", "Auth API", "2FA 要求?"],
      "tween": { "latency": [220, 350] },
      "set": { "authStatus": 1 },
      "badge": "2FA",
      "body": "TOTP 6 桁認証、 認証サーバが time-window 比較。 authStatus 1 → 1 保持 (traffic-light 黄)、 latency 220 → 350ms tween (2FA overhead で bar さらに伸長)、 mfaCheck diamond が pending 状態。"
    },
    {
      "step": "セッション発行",
      "duration": 2,
      "focus": ["山田様", "Pixel 8", "Auth API", "2FA 要求?", "JWT 発行器", "Redis"],
      "tween": { "authStatus": [1, 2], "latency": [350, 180] },
      "badge": "発行",
      "body": "2FA 通過、 JWT 発行 + Redis に session 保存。 authStatus 1 → 2 tween (traffic-light 黄 → 緑)、 latency 350 → 180ms tween (bar 縮小)、 gauge 99 → 99% 維持、 jwtSign + session lane activate。"
    },
    {
      "step": "応答返却",
      "duration": 1.8,
      "focus": ["山田様", "Pixel 8", "Auth API", "2FA 要求?", "JWT 発行器", "Redis", "JWT token"],
      "tween": { "successLogin": [8421, 8422], "latency": [180, 50] },
      "set": { "authStatus": 2 },
      "badge": "応答",
      "body": "JWT token を Bearer header で返却、 302 redirect。 successLogin 8421 → 8422 tween (countup が +1 加算表示、 900ms かけて動的)、 latency 180 → 50ms tween (最終)、 全 7 shape active。"
    }
  ]
}`;

export const sourceYaml__exemplarNotificationFlow = `title: "通知配信を発火から再送まで 5 段階で追う"
type: flow

readouts:
  queuedBar: { kind: bar, source: "queued", min: 0, max: 1000, color: "#f97316", label: "queue 残" }
  deliveredCU: { kind: countup, source: "delivered", decimals: 0, unit: " 件", label: "配信成功" }
  rateGauge: { kind: gauge, source: "deliveryRate", min: 0, max: 100, color: "#22c55e", label: "配信成功率 %" }
  failedStat: { kind: stat, source: "failed", caption: "リトライ待ち", unit: " 件", label: "失敗" }

lanes:
  origin: { x: 0, width: 200 }
  infra: { x: 220, width: 280 }
  devices: { x: 520, width: 240 }

states:
  queued: 0
  delivered: 0
  failed: 0
  deliveryRate: 0

actors:
  - 新着 message: { kind: shape-message-bubble, lane: origin, stack: 0, eyebrow: "trigger", subtitle: '"注文が発送されました"' }
  - Kafka キュー: { kind: shape-stack, lane: infra, stack: 0, eyebrow: "queue", subtitle: "残 {queued} 件 · TTL 300s" }
  - FCM Service: { kind: shape-cloud, lane: infra, stack: 1, eyebrow: "notification", subtitle: "配信 batch 処理" }
  - retry 判定: { kind: shape-diamond, lane: infra, stack: 2, eyebrow: "policy", subtitle: "指数 backoff · 最大 3 回" }
  - iPhone: { kind: shape-mobile-device, lane: devices, stack: 0, eyebrow: "device", subtitle: "APNs 経由 · foreground" }
  - Pixel: { kind: shape-mobile-device, lane: devices, stack: 1, eyebrow: "device", subtitle: "FCM 経由 · background" }
  - Galaxy: { kind: shape-mobile-device, lane: devices, stack: 2, eyebrow: "device", subtitle: "圏外 → retry 対象" }

flow:
  - 新着 message -> Kafka キュー: "enqueue" (info)
  - Kafka キュー -> FCM Service: "dequeue" (info)
  - FCM Service -> iPhone: "APNs 配信" (success) { labelOffsetY: -120 }
  - FCM Service -> Pixel: "FCM 配信" (success)
  - FCM Service -> Galaxy: "初回失敗" (error)
  - Galaxy -> retry 判定: "retry 要求" (warning)
  - retry 判定 -> FCM Service: "再送指示" (warning)

animation:
  - step: "event 発火" 1.8s
    focus: ["新着 message", "Kafka キュー"]
    tween:
      queued: 0 -> 1000
    set:
      delivered: 0
      failed: 0
      deliveryRate: 0
    badge: "発火"
    description: "注文発送 event が発生、 message-bubble から Kafka キューに enqueue。 queued 0 → 1000 tween (bar が右に伸長)、 delivered = 0、 failed = 0、 deliveryRate = 0% (gauge 針最下)。 origin + queue が active。"
  - step: "キューイング" 2s
    focus: ["新着 message", "Kafka キュー", "FCM Service"]
    tween:
      queued: 1000 -> 800
    badge: "キュー"
    description: "batch 化された 1000 件が処理待ち、 FCM Service が dequeue 開始。 queued 1000 → 800 tween (bar 縮小開始)、 fcm lane activate、 kafka → fcm edge が info tone で信号伝達。"
  - step: "配信中" 2.5s
    focus: ["新着 message", "Kafka キュー", "FCM Service", "iPhone", "Pixel", "Galaxy"]
    tween:
      queued: 800 -> 50
      delivered: 0 -> 920
      failed: 0 -> 80
      deliveryRate: 0 -> 92
    badge: "配信"
    description: "FCM が iPhone / Pixel / Galaxy へ fan-out 配信。 queued 800 → 50 tween (bar 大幅縮小)、 delivered 0 → 920 tween (countup が加速的 count up、 500/s peak)、 failed 0 → 80 tween、 deliveryRate 0 → 92% tween (gauge 針上昇)。 3 device 全 activate、 Galaxy は失敗 edge (error tone)。"
  - step: "初回到達" 1.8s
    focus: ["新着 message", "Kafka キュー", "FCM Service", "iPhone", "Pixel", "Galaxy"]
    tween:
      queued: 50 -> 20
      delivered: 920 -> 950
      failed: 80 -> 50
      deliveryRate: 92 -> 95
    badge: "到達"
    description: "iPhone + Pixel は成功受信、 Galaxy は圏外で失敗。 queued 50 → 20 tween、 delivered 920 → 950 tween、 failed 80 → 50 tween、 deliveryRate 92 → 95% tween。 全 shape active。"
  - step: "リトライ" 2s
    focus: ["新着 message", "Kafka キュー", "FCM Service", "retry 判定", "iPhone", "Pixel", "Galaxy"]
    tween:
      queued: 20 -> 0
      delivered: 950 -> 992
      failed: 50 -> 8
      deliveryRate: 95 -> 99
    badge: "retry"
    description: "失敗 50 件を retryGate が指数 backoff で再送、 Galaxy 圏内復帰後に配信成功。 queued 20 → 0 tween (bar 消失)、 delivered 950 → 992 tween (countup 最終)、 failed 50 → 8 tween (stat 減少)、 deliveryRate 95 → 99% tween (gauge 針最終)。 retryGate diamond が highlight。"
`;

export const sourceJson__exemplarNotificationFlow = `{
  "title": "通知配信を発火から再送まで 5 段階で追う",
  "type": "flow",
  "readouts": [
    {
      "id": "queuedBar",
      "kind": "bar",
      "source": "queued",
      "min": 0,
      "max": 1000,
      "color": "#f97316",
      "label": "queue 残"
    },
    {
      "id": "deliveredCU",
      "kind": "countup",
      "source": "delivered",
      "decimals": 0,
      "unit": " 件",
      "label": "配信成功"
    },
    {
      "id": "rateGauge",
      "kind": "gauge",
      "source": "deliveryRate",
      "min": 0,
      "max": 100,
      "color": "#22c55e",
      "label": "配信成功率 %"
    },
    {
      "id": "failedStat",
      "kind": "stat",
      "source": "failed",
      "caption": "リトライ待ち",
      "unit": " 件",
      "label": "失敗"
    }
  ],
  "lanes": {
    "origin": { "x": 0, "width": 200 },
    "infra": { "x": 220, "width": 280 },
    "devices": { "x": 520, "width": 240 }
  },
  "actors": [
    {
      "name": "新着 message",
      "kind": "shape-message-bubble",
      "lane": "origin",
      "stack": 0,
      "eyebrow": "trigger",
      "subtitle": "\\"注文が発送されました\\""
    },
    {
      "name": "Kafka キュー",
      "kind": "shape-stack",
      "lane": "infra",
      "stack": 0,
      "eyebrow": "queue",
      "subtitle": "残 {queued} 件 · TTL 300s"
    },
    {
      "name": "FCM Service",
      "kind": "shape-cloud",
      "lane": "infra",
      "stack": 1,
      "eyebrow": "notification",
      "subtitle": "配信 batch 処理"
    },
    {
      "name": "retry 判定",
      "kind": "shape-diamond",
      "lane": "infra",
      "stack": 2,
      "eyebrow": "policy",
      "subtitle": "指数 backoff · 最大 3 回"
    },
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 0,
      "eyebrow": "device",
      "subtitle": "APNs 経由 · foreground"
    },
    {
      "name": "Pixel",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 1,
      "eyebrow": "device",
      "subtitle": "FCM 経由 · background"
    },
    {
      "name": "Galaxy",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 2,
      "eyebrow": "device",
      "subtitle": "圏外 → retry 対象"
    }
  ],
  "flow": [
    { "from": "新着 message", "to": "Kafka キュー", "label": "enqueue", "tone": "info" },
    { "from": "Kafka キュー", "to": "FCM Service", "label": "dequeue", "tone": "info" },
    {
      "from": "FCM Service",
      "to": "iPhone",
      "label": "APNs 配信",
      "tone": "success",
      "labelOffsetY": -120
    },
    { "from": "FCM Service", "to": "Pixel", "label": "FCM 配信", "tone": "success" },
    { "from": "FCM Service", "to": "Galaxy", "label": "初回失敗", "tone": "error" },
    { "from": "Galaxy", "to": "retry 判定", "label": "retry 要求", "tone": "warning" },
    { "from": "retry 判定", "to": "FCM Service", "label": "再送指示", "tone": "warning" }
  ],
  "states": { "queued": 0, "delivered": 0, "failed": 0, "deliveryRate": 0 },
  "animation": [
    {
      "step": "event 発火",
      "duration": 1.8,
      "focus": ["新着 message", "Kafka キュー"],
      "tween": { "queued": [0, 1000] },
      "set": { "delivered": 0, "failed": 0, "deliveryRate": 0 },
      "badge": "発火",
      "body": "注文発送 event が発生、 message-bubble から Kafka キューに enqueue。 queued 0 → 1000 tween (bar が右に伸長)、 delivered = 0、 failed = 0、 deliveryRate = 0% (gauge 針最下)。 origin + queue が active。"
    },
    {
      "step": "キューイング",
      "duration": 2,
      "focus": ["新着 message", "Kafka キュー", "FCM Service"],
      "tween": { "queued": [1000, 800] },
      "badge": "キュー",
      "body": "batch 化された 1000 件が処理待ち、 FCM Service が dequeue 開始。 queued 1000 → 800 tween (bar 縮小開始)、 fcm lane activate、 kafka → fcm edge が info tone で信号伝達。"
    },
    {
      "step": "配信中",
      "duration": 2.5,
      "focus": ["新着 message", "Kafka キュー", "FCM Service", "iPhone", "Pixel", "Galaxy"],
      "tween": { "queued": [800, 50], "delivered": [0, 920], "failed": [0, 80], "deliveryRate": [0, 92] },
      "badge": "配信",
      "body": "FCM が iPhone / Pixel / Galaxy へ fan-out 配信。 queued 800 → 50 tween (bar 大幅縮小)、 delivered 0 → 920 tween (countup が加速的 count up、 500/s peak)、 failed 0 → 80 tween、 deliveryRate 0 → 92% tween (gauge 針上昇)。 3 device 全 activate、 Galaxy は失敗 edge (error tone)。"
    },
    {
      "step": "初回到達",
      "duration": 1.8,
      "focus": ["新着 message", "Kafka キュー", "FCM Service", "iPhone", "Pixel", "Galaxy"],
      "tween": {
        "queued": [50, 20],
        "delivered": [920, 950],
        "failed": [80, 50],
        "deliveryRate": [92, 95]
      },
      "badge": "到達",
      "body": "iPhone + Pixel は成功受信、 Galaxy は圏外で失敗。 queued 50 → 20 tween、 delivered 920 → 950 tween、 failed 80 → 50 tween、 deliveryRate 92 → 95% tween。 全 shape active。"
    },
    {
      "step": "リトライ",
      "duration": 2,
      "focus": ["新着 message", "Kafka キュー", "FCM Service", "retry 判定", "iPhone", "Pixel", "Galaxy"],
      "tween": {
        "queued": [20, 0],
        "delivered": [950, 992],
        "failed": [50, 8],
        "deliveryRate": [95, 99]
      },
      "badge": "retry",
      "body": "失敗 50 件を retryGate が指数 backoff で再送、 Galaxy 圏内復帰後に配信成功。 queued 20 → 0 tween (bar 消失)、 delivered 950 → 992 tween (countup 最終)、 failed 50 → 8 tween (stat 減少)、 deliveryRate 95 → 99% tween (gauge 針最終)。 retryGate diamond が highlight。"
    }
  ]
}`;

export const sourceYaml__alertNotification = `title: "通知 4 種を情報 / 注意 / 異常 / 成功で分ける"
type: flow

inputs:
  kind: { kind: dropdown, options: ["info", "warn", "error", "success"], defaultValue: "warn", label: "Kind" }

readouts:
  nt: { kind: notification, kindSource: "kind", titleSource: "title", bodySource: "alertBody", label: "Alert (color + icon)" }

lanes:
  info: { x: 0, width: 170 }
  warn: { x: 190, width: 170 }
  error: { x: 380, width: 170 }
  success: { x: 570, width: 170 }

states:
  kind: "warn"
  title: "Deploy in progress"
  alertBody: "Building v1.2.3 for production"

actors:
  - infoNode: { kind: card, lane: info, stack: 0, subtitle: "blue · 通知", title: "ℹ Info" }
  - warnNode: { kind: card, lane: warn, stack: 0, subtitle: "yellow · 注意 (default)", title: "⚠ Warn" }
  - errorNode: { kind: card, lane: error, stack: 0, subtitle: "red · 失敗", title: "✕ Error" }
  - successNode: { kind: card, lane: success, stack: 0, subtitle: "green · 成功", title: "✓ Success" }
  - currentAlert: { kind: card, lane: warn, stack: 1, subtitle: "kind: {kind}", title: "◆ Current" }

animation:
  - step: "情報と注意" 1.2s
    focus: ["infoNode"]
    badge: "alert"
  - step: "異常と成功" 1.2s
    focus: ["infoNode", "warnNode", "errorNode"]
    badge: "alert"
  - step: "いまの通知" 1.2s
    focus: ["infoNode", "warnNode", "errorNode", "successNode", "currentAlert"]
    badge: "alert"
    description: "4-lane (Info / Warn / Error / Success) で alert 4 kind を分散、 各 kind 個別 card + current indicator (default=warn lane)、 dropdown 切替で notification readout が color + icon (ℹ/⚠/✕/✓) 追随、 kind 分類と現在 state の 2 経路 view。"
`;

export const sourceJson__alertNotification = `{
  "title": "通知 4 種を情報 / 注意 / 異常 / 成功で分ける",
  "type": "flow",
  "inputs": [
    {
      "id": "kind",
      "kind": "dropdown",
      "options": ["info", "warn", "error", "success"],
      "defaultValue": "warn",
      "label": "Kind"
    }
  ],
  "readouts": [
    {
      "id": "nt",
      "kind": "notification",
      "kindSource": "kind",
      "titleSource": "title",
      "bodySource": "alertBody",
      "label": "Alert (color + icon)"
    }
  ],
  "lanes": {
    "info": { "x": 0, "width": 170 },
    "warn": { "x": 190, "width": 170 },
    "error": { "x": 380, "width": 170 },
    "success": { "x": 570, "width": 170 }
  },
  "actors": [
    {
      "name": "infoNode",
      "kind": "card",
      "lane": "info",
      "stack": 0,
      "subtitle": "blue · 通知",
      "title": "ℹ Info"
    },
    {
      "name": "warnNode",
      "kind": "card",
      "lane": "warn",
      "stack": 0,
      "subtitle": "yellow · 注意 (default)",
      "title": "⚠ Warn"
    },
    {
      "name": "errorNode",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "red · 失敗",
      "title": "✕ Error"
    },
    {
      "name": "successNode",
      "kind": "card",
      "lane": "success",
      "stack": 0,
      "subtitle": "green · 成功",
      "title": "✓ Success"
    },
    {
      "name": "currentAlert",
      "kind": "card",
      "lane": "warn",
      "stack": 1,
      "subtitle": "kind: {kind}",
      "title": "◆ Current"
    }
  ],
  "flow": [],
  "states": {
    "kind": "warn",
    "title": "Deploy in progress",
    "alertBody": "Building v1.2.3 for production"
  },
  "animation": [
    { "step": "情報と注意", "duration": 1.2, "focus": ["infoNode"], "badge": "alert" },
    {
      "step": "異常と成功",
      "duration": 1.2,
      "focus": ["infoNode", "warnNode", "errorNode"],
      "badge": "alert"
    },
    {
      "step": "いまの通知",
      "duration": 1.2,
      "focus": ["infoNode", "warnNode", "errorNode", "successNode", "currentAlert"],
      "badge": "alert",
      "body": "4-lane (Info / Warn / Error / Success) で alert 4 kind を分散、 各 kind 個別 card + current indicator (default=warn lane)、 dropdown 切替で notification readout が color + icon (ℹ/⚠/✕/✓) 追随、 kind 分類と現在 state の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__arraySignalHistogram = `title: "配列 5 要素の合計と個別値を並べる"
type: flow

inputs:
  bump: { kind: slider, min: 0, max: 50, defaultValue: 20, label: "First bar" }

readouts:
  hist: { kind: array-bar, source: "xs", min: 0, max: 50, color: "#2563eb", label: "Bars (histogram)" }
  items: { kind: array-list, source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "Items (bullet list)" }
  first: { kind: stat, source: "bump", label: "Bump" }

lanes:
  agg: { x: 0, width: 240 }
  items: { x: 300, width: 260 }

states:
  xs: "[12,34,20,45,28]"

actors:
  - Aggregate: { kind: card, lane: agg, stack: 0, subtitle: "count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}" }
  - Bump control: { kind: card, lane: agg, stack: 1, subtitle: "1 本目だけを上書きするつまみ" }
  - #0: { kind: card, lane: items, stack: 0, subtitle: "xs[0] = {xs[0]}" }
  - #1: { kind: card, lane: items, stack: 1, subtitle: "xs[1] = {xs[1]}" }
  - #2: { kind: card, lane: items, stack: 2, subtitle: "xs[2] = {xs[2]}" }
  - #3: { kind: card, lane: items, stack: 3, subtitle: "xs[3] = {xs[3]}" }
  - #4: { kind: card, lane: items, stack: 4, subtitle: "xs[4] = {xs[4]}" }

animation:
  - step: "初期の並び" 1.8s
    focus: ["Aggregate", "#0"]
    set:
      xs: "[12,34,20,45,28]"
    description: "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。"
  - step: "山が右へ移る" 1.8s
    focus: ["Aggregate", "#0", "#1", "#2"]
    set:
      xs: "[40,18,30,26,48]"
    description: "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。"
  - step: "右上がりに整う" 1.8s
    focus: ["Aggregate", "#0", "#1", "#2", "#3", "#4"]
    set:
      xs: "[15,22,30,38,48]"
    description: "右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。"
`;

export const sourceJson__arraySignalHistogram = `{
  "title": "配列 5 要素の合計と個別値を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "bump",
      "kind": "slider",
      "min": 0,
      "max": 50,
      "defaultValue": 20,
      "label": "First bar"
    }
  ],
  "readouts": [
    {
      "id": "hist",
      "kind": "array-bar",
      "source": "xs",
      "min": 0,
      "max": 50,
      "color": "#2563eb",
      "label": "Bars (histogram)"
    },
    {
      "id": "items",
      "kind": "array-list",
      "source": "xs",
      "itemTemplate": "#{i} → {item}",
      "max": 6,
      "label": "Items (bullet list)"
    },
    { "id": "first", "kind": "stat", "source": "bump", "label": "Bump" }
  ],
  "lanes": {
    "agg": { "x": 0, "width": 240 },
    "items": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "Aggregate",
      "kind": "card",
      "lane": "agg",
      "stack": 0,
      "subtitle": "count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}"
    },
    {
      "name": "Bump control",
      "kind": "card",
      "lane": "agg",
      "stack": 1,
      "subtitle": "1 本目だけを上書きするつまみ"
    },
    { "name": "#0", "kind": "card", "lane": "items", "stack": 0, "subtitle": "xs[0] = {xs[0]}" },
    { "name": "#1", "kind": "card", "lane": "items", "stack": 1, "subtitle": "xs[1] = {xs[1]}" },
    { "name": "#2", "kind": "card", "lane": "items", "stack": 2, "subtitle": "xs[2] = {xs[2]}" },
    { "name": "#3", "kind": "card", "lane": "items", "stack": 3, "subtitle": "xs[3] = {xs[3]}" },
    { "name": "#4", "kind": "card", "lane": "items", "stack": 4, "subtitle": "xs[4] = {xs[4]}" }
  ],
  "flow": [],
  "states": { "xs": "[12,34,20,45,28]" },
  "animation": [
    {
      "step": "初期の並び",
      "duration": 1.8,
      "focus": ["Aggregate", "#0"],
      "set": { "xs": "[12,34,20,45,28]" },
      "body": "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。"
    },
    {
      "step": "山が右へ移る",
      "duration": 1.8,
      "focus": ["Aggregate", "#0", "#1", "#2"],
      "set": { "xs": "[40,18,30,26,48]" },
      "body": "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。"
    },
    {
      "step": "右上がりに整う",
      "duration": 1.8,
      "focus": ["Aggregate", "#0", "#1", "#2", "#3", "#4"],
      "set": { "xs": "[15,22,30,38,48]" },
      "body": "右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。"
    }
  ]
}`;

export const sourceYaml__audioPlayer = `title: "再生位置と再生状態から時間表示を作る"
type: flow

inputs:
  current: { kind: slider, min: 0, max: 240, defaultValue: 65, label: "Current sec" }
  playing: { kind: toggle, defaultValue: true, label: "Playing" }

readouts:
  mp: { kind: media-player, source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 320, label: "Player (icon + progress + MM:SS)" }

lanes:
  current: { x: 0, width: 220 }
  toggle: { x: 260, width: 200 }
  duration: { x: 500, width: 220 }

states:
  current: 65
  duration: 240
  playing: "true"

actors:
  - currentNode: { kind: card, lane: current, stack: 0, subtitle: "{current}s / 240s (slider driven)", title: "Current time" }
  - toggleNode: { kind: card, lane: toggle, stack: 0, subtitle: "playing = {playing} (▶/❚❚ icon)", title: "Play toggle" }
  - durationNode: { kind: card, lane: duration, stack: 0, subtitle: "240s total (fixed)", title: "Duration" }

flow:
  - currentNode -> durationNode: "progress %" (info)
  - toggleNode -> currentNode: "advance/pause" (success)

animation:
  - step: "再生位置" 1.2s
    focus: ["currentNode"]
    badge: "media"
  - step: "再生状態" 1.2s
    focus: ["currentNode", "toggleNode"]
    badge: "media"
  - step: "時間表示" 1.2s
    focus: ["currentNode", "toggleNode", "durationNode"]
    badge: "media"
    description: "3-lane (Current / Play toggle / Duration) で audio player 3 signal を分散、 2 edge (progress info / advance success) で 3 signal の相互関係明示、 slider + toggle 変化で mediaPlayer readout が icon + progress + MM:SS 追随、 player 構造を lane で可視化。"
`;

export const sourceJson__audioPlayer = `{
  "title": "再生位置と再生状態から時間表示を作る",
  "type": "flow",
  "inputs": [
    {
      "id": "current",
      "kind": "slider",
      "min": 0,
      "max": 240,
      "defaultValue": 65,
      "label": "Current sec"
    },
    { "id": "playing", "kind": "toggle", "defaultValue": true, "label": "Playing" }
  ],
  "readouts": [
    {
      "id": "mp",
      "kind": "media-player",
      "source": "current",
      "durationSource": "duration",
      "playingSource": "playing",
      "color": "#2563eb",
      "viewW": 320,
      "label": "Player (icon + progress + MM:SS)"
    }
  ],
  "lanes": {
    "current": { "x": 0, "width": 220 },
    "toggle": { "x": 260, "width": 200 },
    "duration": { "x": 500, "width": 220 }
  },
  "actors": [
    {
      "name": "currentNode",
      "kind": "card",
      "lane": "current",
      "stack": 0,
      "subtitle": "{current}s / 240s (slider driven)",
      "title": "Current time"
    },
    {
      "name": "toggleNode",
      "kind": "card",
      "lane": "toggle",
      "stack": 0,
      "subtitle": "playing = {playing} (▶/❚❚ icon)",
      "title": "Play toggle"
    },
    {
      "name": "durationNode",
      "kind": "card",
      "lane": "duration",
      "stack": 0,
      "subtitle": "240s total (fixed)",
      "title": "Duration"
    }
  ],
  "flow": [
    { "from": "currentNode", "to": "durationNode", "label": "progress %", "tone": "info" },
    { "from": "toggleNode", "to": "currentNode", "label": "advance/pause", "tone": "success" }
  ],
  "states": { "current": 65, "duration": 240, "playing": "true" },
  "animation": [
    { "step": "再生位置", "duration": 1.2, "focus": ["currentNode"], "badge": "media" },
    {
      "step": "再生状態",
      "duration": 1.2,
      "focus": ["currentNode", "toggleNode"],
      "badge": "media"
    },
    {
      "step": "時間表示",
      "duration": 1.2,
      "focus": ["currentNode", "toggleNode", "durationNode"],
      "badge": "media",
      "body": "3-lane (Current / Play toggle / Duration) で audio player 3 signal を分散、 2 edge (progress info / advance success) で 3 signal の相互関係明示、 slider + toggle 変化で mediaPlayer readout が icon + progress + MM:SS 追随、 player 構造を lane で可視化。"
    }
  ]
}`;

export const sourceYaml__buildStatusTrafficLight = `title: "ビルド状態を信号機の 3 色で見せる"
type: flow

inputs:
  status: { kind: dropdown, options: ["red", "yellow", "green"], defaultValue: "green", label: "Build status" }

readouts:
  tl: { kind: traffic-light, source: "status", viewW: 70, viewH: 180, label: "Status (3-color indicator)" }

lanes:
  red: { x: 0, width: 200 }
  yellow: { x: 240, width: 200 }
  green: { x: 480, width: 200 }

states:
  status: "green"

actors:
  - redNode: { kind: card, lane: red, stack: 0, subtitle: "ビルド失敗 · 要修正", title: "● Red" }
  - yellowNode: { kind: card, lane: yellow, stack: 0, subtitle: "ビルド実行中 · 待機", title: "● Yellow" }
  - greenNode: { kind: card, lane: green, stack: 0, subtitle: "ビルド成功 · deploy 可", title: "● Green" }
  - currentCI: { kind: card, lane: green, stack: 1, subtitle: "status: {status}", title: "◆ Current CI" }

animation:
  - step: "赤を見る" 1.8s
    focus: ["redNode"]
    description: "止まっている時に点く色。 3 色のうち 1 つ目で、状態はつまみで選ぶ。"
  - step: "黄を見る" 1.8s
    focus: ["redNode", "yellowNode"]
    description: "走っている間の色。 選んだ状態に応じて 1 つだけが点く。"
  - step: "緑を見る" 1.8s
    focus: ["redNode", "yellowNode", "greenNode", "currentCI"]
    description: "通った時の色。 3 色で状態を読み分ける形になっている。"
`;

export const sourceJson__buildStatusTrafficLight = `{
  "title": "ビルド状態を信号機の 3 色で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "status",
      "kind": "dropdown",
      "options": ["red", "yellow", "green"],
      "defaultValue": "green",
      "label": "Build status"
    }
  ],
  "readouts": [
    {
      "id": "tl",
      "kind": "traffic-light",
      "source": "status",
      "viewW": 70,
      "viewH": 180,
      "label": "Status (3-color indicator)"
    }
  ],
  "lanes": {
    "red": { "x": 0, "width": 200 },
    "yellow": { "x": 240, "width": 200 },
    "green": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "redNode",
      "kind": "card",
      "lane": "red",
      "stack": 0,
      "subtitle": "ビルド失敗 · 要修正",
      "title": "● Red"
    },
    {
      "name": "yellowNode",
      "kind": "card",
      "lane": "yellow",
      "stack": 0,
      "subtitle": "ビルド実行中 · 待機",
      "title": "● Yellow"
    },
    {
      "name": "greenNode",
      "kind": "card",
      "lane": "green",
      "stack": 0,
      "subtitle": "ビルド成功 · deploy 可",
      "title": "● Green"
    },
    {
      "name": "currentCI",
      "kind": "card",
      "lane": "green",
      "stack": 1,
      "subtitle": "status: {status}",
      "title": "◆ Current CI"
    }
  ],
  "flow": [],
  "states": { "status": "green" },
  "animation": [
    {
      "step": "赤を見る",
      "duration": 1.8,
      "focus": ["redNode"],
      "body": "止まっている時に点く色。 3 色のうち 1 つ目で、状態はつまみで選ぶ。"
    },
    {
      "step": "黄を見る",
      "duration": 1.8,
      "focus": ["redNode", "yellowNode"],
      "body": "走っている間の色。 選んだ状態に応じて 1 つだけが点く。"
    },
    {
      "step": "緑を見る",
      "duration": 1.8,
      "focus": ["redNode", "yellowNode", "greenNode", "currentCI"],
      "body": "通った時の色。 3 色で状態を読み分ける形になっている。"
    }
  ]
}`;

export const sourceYaml__canvasMiniMap = `title: "全体図の中で今見ている範囲を示す"
type: flow

inputs:
  panX: { kind: slider, min: 0, max: 600, defaultValue: 300, label: "Pan X" }
  panY: { kind: slider, min: 0, max: 500, defaultValue: 250, label: "Pan Y" }

readouts:
  map: { kind: mini-map, source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "Overview (mini-map)" }
  panXStat: { kind: stat, source: "panX", unit: "px", label: "X stat" }
  panYStat: { kind: stat, source: "panY", unit: "px", label: "Y stat" }

lanes:
  xpan: { x: 0, width: 200 }
  ypan: { x: 240, width: 200 }
  map: { x: 480, width: 260 }

states:
  panX: 300
  panY: 250
  viewport: "[300,250,400,300]"

actors:
  - Pan X: { kind: card, lane: xpan, stack: 0, subtitle: "panX = {panX}px (0-600)" }
  - Pan Y: { kind: card, lane: ypan, stack: 0, subtitle: "panY = {panY}px (0-500)" }
  - Mini-map: { kind: card, lane: map, stack: 0, subtitle: "pan ({panX}, {panY}) view 400×300" }

animation:
  - step: "左上を見る" 1.8s
    focus: ["Pan X"]
    set:
      viewport: "[0,0,400,300]"
    description: "全体図の左上を見ている状態。 小窓の枠が左上にある。"
  - step: "右へ移る" 1.8s
    focus: ["Pan X", "Pan Y"]
    set:
      viewport: "[500,0,400,300]"
    description: "見ている範囲が右へ移る。 小窓の枠も追いかける。"
  - step: "下へ移る" 1.8s
    focus: ["Pan X", "Pan Y", "Mini-map"]
    set:
      viewport: "[500,400,400,300]"
    description: "さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。"
`;

export const sourceJson__canvasMiniMap = `{
  "title": "全体図の中で今見ている範囲を示す",
  "type": "flow",
  "inputs": [
    {
      "id": "panX",
      "kind": "slider",
      "min": 0,
      "max": 600,
      "defaultValue": 300,
      "label": "Pan X"
    },
    {
      "id": "panY",
      "kind": "slider",
      "min": 0,
      "max": 500,
      "defaultValue": 250,
      "label": "Pan Y"
    }
  ],
  "readouts": [
    {
      "id": "map",
      "kind": "mini-map",
      "source": "viewport",
      "canvasW": 1000,
      "canvasH": 800,
      "viewW": 200,
      "viewH": 160,
      "color": "#2563eb",
      "label": "Overview (mini-map)"
    },
    { "id": "panXStat", "kind": "stat", "source": "panX", "unit": "px", "label": "X stat" },
    { "id": "panYStat", "kind": "stat", "source": "panY", "unit": "px", "label": "Y stat" }
  ],
  "lanes": {
    "xpan": { "x": 0, "width": 200 },
    "ypan": { "x": 240, "width": 200 },
    "map": { "x": 480, "width": 260 }
  },
  "actors": [
    {
      "name": "Pan X",
      "kind": "card",
      "lane": "xpan",
      "stack": 0,
      "subtitle": "panX = {panX}px (0-600)"
    },
    {
      "name": "Pan Y",
      "kind": "card",
      "lane": "ypan",
      "stack": 0,
      "subtitle": "panY = {panY}px (0-500)"
    },
    {
      "name": "Mini-map",
      "kind": "card",
      "lane": "map",
      "stack": 0,
      "subtitle": "pan ({panX}, {panY}) view 400×300"
    }
  ],
  "flow": [],
  "states": { "panX": 300, "panY": 250, "viewport": "[300,250,400,300]" },
  "animation": [
    {
      "step": "左上を見る",
      "duration": 1.8,
      "focus": ["Pan X"],
      "set": { "viewport": "[0,0,400,300]" },
      "body": "全体図の左上を見ている状態。 小窓の枠が左上にある。"
    },
    {
      "step": "右へ移る",
      "duration": 1.8,
      "focus": ["Pan X", "Pan Y"],
      "set": { "viewport": "[500,0,400,300]" },
      "body": "見ている範囲が右へ移る。 小窓の枠も追いかける。"
    },
    {
      "step": "下へ移る",
      "duration": 1.8,
      "focus": ["Pan X", "Pan Y", "Mini-map"],
      "set": { "viewport": "[500,400,400,300]" },
      "body": "さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。"
    }
  ]
}`;

export const sourceYaml__colorPickerTheme = `title: "選んだ色が見本と 16 進表記に伝わる"
type: flow

inputs:
  accent: { kind: color, defaultValue: "#8a5a2a", label: "Accent" }

readouts:
  hexReadout: { kind: stat, source: "accent", caption: "hex color", label: "Selected" }

lanes:
  picker: { x: 0, width: 370 }
  swatch-lane: { x: 410, width: 230 }
  stat: { x: 680, width: 320 }

states:
  accent: "#8a5a2a"

actors:
  - Color picker: { kind: card, lane: picker, stack: 0, subtitle: "input.color widget · default #8a5a2a", posW: 320 }
  - Swatch: { kind: card, lane: swatch-lane, stack: 0, subtitle: "hex: {accent}", posW: 180 }
  - Hex stat: { kind: card, lane: stat, stack: 0, subtitle: "readout.stat で hex 表示", posW: 270 }

flow:
  - Color picker -> Swatch: "select" (info)
  - Swatch -> Hex stat: "display" (success)

animation:
  - step: "色を選ぶ" 1.8s
    focus: ["Color picker"]
    description: "選んだ色が左の箱に入る。 まだ見本には伝わっていない。"
  - step: "見本に伝わる" 1.8s
    focus: ["Color picker", "Swatch"]
    description: "選んだ色の 16 進表記が中央に出る。 箱の塗り自体には束ねていないので、色は変わらない。"
  - step: "表記も揃う" 1.8s
    focus: ["Color picker", "Swatch", "Hex stat"]
    description: "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。"
`;

export const sourceJson__colorPickerTheme = `{
  "title": "選んだ色が見本と 16 進表記に伝わる",
  "type": "flow",
  "inputs": [
    { "id": "accent", "kind": "color", "defaultValue": "#8a5a2a", "label": "Accent" }
  ],
  "readouts": [
    {
      "id": "hexReadout",
      "kind": "stat",
      "source": "accent",
      "caption": "hex color",
      "label": "Selected"
    }
  ],
  "lanes": {
    "picker": { "x": 0, "width": 370 },
    "swatch-lane": { "x": 410, "width": 230 },
    "stat": { "x": 680, "width": 320 }
  },
  "actors": [
    {
      "name": "Color picker",
      "kind": "card",
      "lane": "picker",
      "stack": 0,
      "subtitle": "input.color widget · default #8a5a2a",
      "posW": 320
    },
    {
      "name": "Swatch",
      "kind": "card",
      "lane": "swatch-lane",
      "stack": 0,
      "subtitle": "hex: {accent}",
      "posW": 180
    },
    {
      "name": "Hex stat",
      "kind": "card",
      "lane": "stat",
      "stack": 0,
      "subtitle": "readout.stat で hex 表示",
      "posW": 270
    }
  ],
  "flow": [
    { "from": "Color picker", "to": "Swatch", "label": "select", "tone": "info" },
    { "from": "Swatch", "to": "Hex stat", "label": "display", "tone": "success" }
  ],
  "states": { "accent": "#8a5a2a" },
  "animation": [
    {
      "step": "色を選ぶ",
      "duration": 1.8,
      "focus": ["Color picker"],
      "body": "選んだ色が左の箱に入る。 まだ見本には伝わっていない。"
    },
    {
      "step": "見本に伝わる",
      "duration": 1.8,
      "focus": ["Color picker", "Swatch"],
      "body": "選んだ色の 16 進表記が中央に出る。 箱の塗り自体には束ねていないので、色は変わらない。"
    },
    {
      "step": "表記も揃う",
      "duration": 1.8,
      "focus": ["Color picker", "Swatch", "Hex stat"],
      "body": "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。"
    }
  ]
}`;

export const sourceYaml__commitDiffCounter = `title: "追加行と削除行から差し引きを出す"
type: flow

inputs:
  add: { kind: stepper, min: 0, max: 500, step: 10, defaultValue: 120, label: "Additions" }
  del: { kind: stepper, min: 0, max: 500, step: 10, defaultValue: 45, label: "Deletions" }

readouts:
  dc: { kind: diff-counter, additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "Diff (+N/-N bar)" }

lanes:
  adds: { x: 0, width: 260 }
  dels: { x: 300, width: 260 }

states:
  add: 120
  del: 45

actors:
  - + Additions: { kind: card, lane: adds, stack: 0, subtitle: "+{add} lines (green)" }
  - adds/del: { kind: card, lane: adds, stack: 1, subtitle: "add > del → net growth" }
  - - Deletions: { kind: card, lane: dels, stack: 0, subtitle: "-{del} lines (red)" }
  - cleanup: { kind: card, lane: dels, stack: 1, subtitle: "remove obsolete code" }

flow:
  - + Additions -> - Deletions: "net = add - del" (info)

animation:
  - step: "追加を見る" 1.2s
    focus: ["+ Additions"]
    badge: "diff"
  - step: "削除を並べる" 1.2s
    focus: ["+ Additions", "adds/del"]
    badge: "diff"
  - step: "差し引き" 1.2s
    focus: ["+ Additions", "adds/del", "- Deletions", "cleanup"]
    badge: "diff"
    description: "2-lane (Additions +N green / Deletions -N red) で PR diff を符号別分散、 各 lane に main card + detail card、 net delta edge (info tone) で add - del の差を明示、 diffCounter readout も併存で proportion bar 表示、 diff 構造と bar の 2 経路 view。"
`;

export const sourceJson__commitDiffCounter = `{
  "title": "追加行と削除行から差し引きを出す",
  "type": "flow",
  "inputs": [
    {
      "id": "add",
      "kind": "stepper",
      "min": 0,
      "max": 500,
      "step": 10,
      "defaultValue": 120,
      "label": "Additions"
    },
    {
      "id": "del",
      "kind": "stepper",
      "min": 0,
      "max": 500,
      "step": 10,
      "defaultValue": 45,
      "label": "Deletions"
    }
  ],
  "readouts": [
    {
      "id": "dc",
      "kind": "diff-counter",
      "additionsSource": "add",
      "deletionsSource": "del",
      "colorAdd": "#22c55e",
      "colorDel": "#ef4444",
      "label": "Diff (+N/-N bar)"
    }
  ],
  "lanes": {
    "adds": { "x": 0, "width": 260 },
    "dels": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "+ Additions",
      "kind": "card",
      "lane": "adds",
      "stack": 0,
      "subtitle": "+{add} lines (green)"
    },
    {
      "name": "adds/del",
      "kind": "card",
      "lane": "adds",
      "stack": 1,
      "subtitle": "add > del → net growth"
    },
    {
      "name": "- Deletions",
      "kind": "card",
      "lane": "dels",
      "stack": 0,
      "subtitle": "-{del} lines (red)"
    },
    {
      "name": "cleanup",
      "kind": "card",
      "lane": "dels",
      "stack": 1,
      "subtitle": "remove obsolete code"
    }
  ],
  "flow": [
    { "from": "+ Additions", "to": "- Deletions", "label": "net = add - del", "tone": "info" }
  ],
  "states": { "add": 120, "del": 45 },
  "animation": [
    { "step": "追加を見る", "duration": 1.2, "focus": ["+ Additions"], "badge": "diff" },
    { "step": "削除を並べる", "duration": 1.2, "focus": ["+ Additions", "adds/del"], "badge": "diff" },
    {
      "step": "差し引き",
      "duration": 1.2,
      "focus": ["+ Additions", "adds/del", "- Deletions", "cleanup"],
      "badge": "diff",
      "body": "2-lane (Additions +N green / Deletions -N red) で PR diff を符号別分散、 各 lane に main card + detail card、 net delta edge (info tone) で add - del の差を明示、 diffCounter readout も併存で proportion bar 表示、 diff 構造と bar の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__deploySpinner = `title: "配備状態を実行中 / 完了 / 失敗で見せる"
type: flow

inputs:
  status: { kind: dropdown, options: ["running", "done", "error"], defaultValue: "running", label: "Status" }
  msg: { kind: text, defaultValue: "Building production bundle...", placeholder: "Status message", maxLength: 60, label: "Message" }

readouts:
  sp: { kind: spinner, source: "status", textSource: "msg", color: "#2563eb", label: "Deploy (spinner + text)" }

lanes:
  running: { x: 0, width: 220 }
  done: { x: 260, width: 220 }
  error: { x: 520, width: 220 }

states:
  status: "running"
  msg: "Building production bundle..."

actors:
  - runningNode: { kind: card, lane: running, stack: 0, subtitle: "blue spinner · SMIL 回転 circle", title: "◐ Running" }
  - doneNode: { kind: card, lane: done, stack: 0, subtitle: "green · deploy success", title: "✓ Done" }
  - errorNode: { kind: card, lane: error, stack: 0, subtitle: "red · deploy failed", title: "✕ Error" }
  - currentState: { kind: card, lane: running, stack: 1, subtitle: "status: {status} · msg: {msg}", title: "◆ Deploy" }

animation:
  - step: "実行中" 1.2s
    focus: ["runningNode"]
    badge: "loading"
  - step: "完了と失敗" 1.2s
    focus: ["runningNode", "doneNode"]
    badge: "loading"
  - step: "いまの状態" 1.2s
    focus: ["runningNode", "doneNode", "errorNode", "currentState"]
    badge: "loading"
    description: "3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。"
`;

export const sourceJson__deploySpinner = `{
  "title": "配備状態を実行中 / 完了 / 失敗で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "status",
      "kind": "dropdown",
      "options": ["running", "done", "error"],
      "defaultValue": "running",
      "label": "Status"
    },
    {
      "id": "msg",
      "kind": "text",
      "defaultValue": "Building production bundle...",
      "placeholder": "Status message",
      "maxLength": 60,
      "label": "Message"
    }
  ],
  "readouts": [
    {
      "id": "sp",
      "kind": "spinner",
      "source": "status",
      "textSource": "msg",
      "color": "#2563eb",
      "label": "Deploy (spinner + text)"
    }
  ],
  "lanes": {
    "running": { "x": 0, "width": 220 },
    "done": { "x": 260, "width": 220 },
    "error": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "runningNode",
      "kind": "card",
      "lane": "running",
      "stack": 0,
      "subtitle": "blue spinner · SMIL 回転 circle",
      "title": "◐ Running"
    },
    {
      "name": "doneNode",
      "kind": "card",
      "lane": "done",
      "stack": 0,
      "subtitle": "green · deploy success",
      "title": "✓ Done"
    },
    {
      "name": "errorNode",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "red · deploy failed",
      "title": "✕ Error"
    },
    {
      "name": "currentState",
      "kind": "card",
      "lane": "running",
      "stack": 1,
      "subtitle": "status: {status} · msg: {msg}",
      "title": "◆ Deploy"
    }
  ],
  "flow": [],
  "states": { "status": "running", "msg": "Building production bundle..." },
  "animation": [
    { "step": "実行中", "duration": 1.2, "focus": ["runningNode"], "badge": "loading" },
    {
      "step": "完了と失敗",
      "duration": 1.2,
      "focus": ["runningNode", "doneNode"],
      "badge": "loading"
    },
    {
      "step": "いまの状態",
      "duration": 1.2,
      "focus": ["runningNode", "doneNode", "errorNode", "currentState"],
      "badge": "loading",
      "body": "3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__deviceBattery = `title: "電池残量を低 / 中 / 高で見せる"
type: flow

inputs:
  battery: { kind: slider, min: 0, max: 100, defaultValue: 72, label: "Battery %" }

readouts:
  fb: { kind: fuel-bar, source: "battery", segments: 10, lowThreshold: 20, highThreshold: 60, viewW: 240, viewH: 32, label: "Level (10 segment bar)" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 220 }

states:
  battery: 72

actors:
  - Low band: { kind: card, lane: low, stack: 0, subtitle: "< 20% (red · critical)" }
  - Mid band: { kind: card, lane: mid, stack: 0, subtitle: "20-60% (yellow · charge soon)" }
  - High band: { kind: card, lane: high, stack: 0, subtitle: "≥ 60% (green · healthy)" }
  - ◆ Current: { kind: card, lane: high, stack: 1, subtitle: "battery = {battery}% (default 72 → high)" }

animation:
  - step: "低い帯" 1.2s
    focus: ["Low band"]
    badge: "battery"
  - step: "高い帯まで" 1.2s
    focus: ["Low band", "Mid band"]
    badge: "battery"
  - step: "いまの残量" 1.2s
    focus: ["Low band", "Mid band", "High band", "◆ Current"]
    badge: "battery"
    description: "3-lane (Low <20 red / Mid 20-60 yellow / High ≥60 green) で battery 3 band を分散、 current indicator (default 72 → high lane)、 slider 変化で fuelBar readout の filled 数 + color 追随、 battery / fuel / stamina 状態を lane 分割で可視化。"
`;

export const sourceJson__deviceBattery = `{
  "title": "電池残量を低 / 中 / 高で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "battery",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 72,
      "label": "Battery %"
    }
  ],
  "readouts": [
    {
      "id": "fb",
      "kind": "fuel-bar",
      "source": "battery",
      "segments": 10,
      "lowThreshold": 20,
      "highThreshold": 60,
      "viewW": 240,
      "viewH": 32,
      "label": "Level (10 segment bar)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "Low band",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "< 20% (red · critical)"
    },
    {
      "name": "Mid band",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "20-60% (yellow · charge soon)"
    },
    {
      "name": "High band",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "≥ 60% (green · healthy)"
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "battery = {battery}% (default 72 → high)"
    }
  ],
  "flow": [],
  "states": { "battery": 72 },
  "animation": [
    { "step": "低い帯", "duration": 1.2, "focus": ["Low band"], "badge": "battery" },
    { "step": "高い帯まで", "duration": 1.2, "focus": ["Low band", "Mid band"], "badge": "battery" },
    {
      "step": "いまの残量",
      "duration": 1.2,
      "focus": ["Low band", "Mid band", "High band", "◆ Current"],
      "badge": "battery",
      "body": "3-lane (Low <20 red / Mid 20-60 yellow / High ≥60 green) で battery 3 band を分散、 current indicator (default 72 → high lane)、 slider 変化で fuelBar readout の filled 数 + color 追随、 battery / fuel / stamina 状態を lane 分割で可視化。"
    }
  ]
}`;

export const sourceYaml__dynamicReadouts = `title: "数え上げ / 増減 / 円 / 打字の 4 表示を並べる"
type: flow

inputs:
  rev: { kind: slider, min: 0, max: 500, defaultValue: 250, label: "Revenue" }
  status: { kind: dropdown, options: ["active", "pending", "closed"], defaultValue: "active", label: "Status" }

readouts:
  revCount: { kind: countup, source: "rev", unit: "$", label: "Revenue count" }
  revDelta: { kind: delta, source: "rev", unit: "$", label: "Δ delta" }
  revPct: { kind: percent-ring, source: "rev", max: 500, label: "Progress ring" }
  statusText: { kind: typewriter, source: "status", charMs: 50, label: "Status text" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  rev: 250
  status: "active"

actors:
  - Countup: { kind: card, lane: col1, stack: 0, subtitle: "rev={rev} · animated $ counter", posW: 320 }
  - Delta: { kind: card, lane: col2, stack: 0, subtitle: "rev={rev} · ↑↓ arrow", posW: 240 }
  - Percent ring: { kind: card, lane: col1, stack: 1, subtitle: "rev/500 = {rev} progress", posW: 310 }
  - Typewriter: { kind: card, lane: col2, stack: 1, subtitle: "status={status} · char reveal", posW: 320 }

animation:
  - step: "数え上げを見る" 1.8s
    focus: ["Countup"]
    description: "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。"
  - step: "増減と円を見る" 1.8s
    focus: ["Countup", "Delta", "Percent ring"]
    description: "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。"
  - step: "文字でも出す" 1.8s
    focus: ["Countup", "Delta", "Percent ring", "Typewriter"]
    description: "状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。"
`;

export const sourceJson__dynamicReadouts = `{
  "title": "数え上げ / 増減 / 円 / 打字の 4 表示を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "rev",
      "kind": "slider",
      "min": 0,
      "max": 500,
      "defaultValue": 250,
      "label": "Revenue"
    },
    {
      "id": "status",
      "kind": "dropdown",
      "options": ["active", "pending", "closed"],
      "defaultValue": "active",
      "label": "Status"
    }
  ],
  "readouts": [
    {
      "id": "revCount",
      "kind": "countup",
      "source": "rev",
      "unit": "$",
      "label": "Revenue count"
    },
    { "id": "revDelta", "kind": "delta", "source": "rev", "unit": "$", "label": "Δ delta" },
    {
      "id": "revPct",
      "kind": "percent-ring",
      "source": "rev",
      "max": 500,
      "label": "Progress ring"
    },
    {
      "id": "statusText",
      "kind": "typewriter",
      "source": "status",
      "charMs": 50,
      "label": "Status text"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "Countup",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "rev={rev} · animated $ counter",
      "posW": 320
    },
    {
      "name": "Delta",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "rev={rev} · ↑↓ arrow",
      "posW": 240
    },
    {
      "name": "Percent ring",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "rev/500 = {rev} progress",
      "posW": 310
    },
    {
      "name": "Typewriter",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "status={status} · char reveal",
      "posW": 320
    }
  ],
  "flow": [],
  "states": { "rev": 250, "status": "active" },
  "animation": [
    {
      "step": "数え上げを見る",
      "duration": 1.8,
      "focus": ["Countup"],
      "body": "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。"
    },
    {
      "step": "増減と円を見る",
      "duration": 1.8,
      "focus": ["Countup", "Delta", "Percent ring"],
      "body": "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。"
    },
    {
      "step": "文字でも出す",
      "duration": 1.8,
      "focus": ["Countup", "Delta", "Percent ring", "Typewriter"],
      "body": "状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。"
    }
  ]
}`;

export const sourceYaml__engineTachometer = `title: "回転数を通常 / 巡航 / 過回転で見せる"
type: flow

inputs:
  rpm: { kind: slider, min: 0, max: 8000, defaultValue: 3500, label: "RPM" }

readouts:
  g: { kind: circular-gauge, source: "rpm", min: 0, max: 8000, viewW: 200, viewH: 160, color: "#f97316", unit: "rpm", label: "Tachometer (270° dial)" }

lanes:
  idle: { x: 0, width: 200 }
  cruise: { x: 240, width: 200 }
  redline: { x: 480, width: 200 }

states:
  rpm: 3500

actors:
  - idleNode: { kind: card, lane: idle, stack: 0, subtitle: "0-2000 rpm (green)", title: "Idle range" }
  - cruiseNode: { kind: card, lane: cruise, stack: 0, subtitle: "2000-5000 rpm (yellow) · normal driving", title: "Cruise range" }
  - redlineNode: { kind: card, lane: redline, stack: 0, subtitle: "5000-8000 rpm (red) · caution", title: "Redline" }
  - currentRpm: { kind: card, lane: cruise, stack: 1, subtitle: "{rpm} rpm (default 3500 = cruise)", title: "◆ Current" }

animation:
  - step: "通常と巡航" 1.2s
    focus: ["idleNode"]
    badge: "tachometer"
  - step: "過回転まで" 1.2s
    focus: ["idleNode", "cruiseNode"]
    badge: "tachometer"
  - step: "いまの回転数" 1.2s
    focus: ["idleNode", "cruiseNode", "redlineNode", "currentRpm"]
    badge: "tachometer"
    description: "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。"
`;

export const sourceJson__engineTachometer = `{
  "title": "回転数を通常 / 巡航 / 過回転で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "rpm",
      "kind": "slider",
      "min": 0,
      "max": 8000,
      "defaultValue": 3500,
      "label": "RPM"
    }
  ],
  "readouts": [
    {
      "id": "g",
      "kind": "circular-gauge",
      "source": "rpm",
      "min": 0,
      "max": 8000,
      "viewW": 200,
      "viewH": 160,
      "color": "#f97316",
      "unit": "rpm",
      "label": "Tachometer (270° dial)"
    }
  ],
  "lanes": {
    "idle": { "x": 0, "width": 200 },
    "cruise": { "x": 240, "width": 200 },
    "redline": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "idleNode",
      "kind": "card",
      "lane": "idle",
      "stack": 0,
      "subtitle": "0-2000 rpm (green)",
      "title": "Idle range"
    },
    {
      "name": "cruiseNode",
      "kind": "card",
      "lane": "cruise",
      "stack": 0,
      "subtitle": "2000-5000 rpm (yellow) · normal driving",
      "title": "Cruise range"
    },
    {
      "name": "redlineNode",
      "kind": "card",
      "lane": "redline",
      "stack": 0,
      "subtitle": "5000-8000 rpm (red) · caution",
      "title": "Redline"
    },
    {
      "name": "currentRpm",
      "kind": "card",
      "lane": "cruise",
      "stack": 1,
      "subtitle": "{rpm} rpm (default 3500 = cruise)",
      "title": "◆ Current"
    }
  ],
  "flow": [],
  "states": { "rpm": 3500 },
  "animation": [
    { "step": "通常と巡航", "duration": 1.2, "focus": ["idleNode"], "badge": "tachometer" },
    {
      "step": "過回転まで",
      "duration": 1.2,
      "focus": ["idleNode", "cruiseNode"],
      "badge": "tachometer"
    },
    {
      "step": "いまの回転数",
      "duration": 1.2,
      "focus": ["idleNode", "cruiseNode", "redlineNode", "currentRpm"],
      "badge": "tachometer",
      "body": "3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__examGrade = `title: "成績を A から F の 5 段階で見せる"
type: flow

inputs:
  score: { kind: slider, min: 0, max: 100, defaultValue: 85, label: "Score" }

readouts:
  g: { kind: grade, source: "score", max: 100, label: "Letter grade (band)" }

lanes:
  A: { x: 0, width: 130 }
  B: { x: 150, width: 130 }
  C: { x: 300, width: 130 }
  D: { x: 450, width: 130 }
  F: { x: 600, width: 130 }

states:
  score: 85

actors:
  - A: { kind: card, lane: A, stack: 0, subtitle: "≥ 90 (green)" }
  - B: { kind: card, lane: B, stack: 0, subtitle: "80-89 (blue, default here)" }
  - C: { kind: card, lane: C, stack: 0, subtitle: "70-79 (yellow)" }
  - D: { kind: card, lane: D, stack: 0, subtitle: "60-69 (orange)" }
  - F: { kind: card, lane: F, stack: 0, subtitle: "< 60 (red)" }
  - ◆ Current: { kind: card, lane: B, stack: 1, subtitle: "score = {score} / 100" }

animation:
  - step: "上の 2 段階" 1.2s
    focus: ["A", "B"]
    badge: "grade"
  - step: "下の 3 段階" 1.2s
    focus: ["A", "B", "C", "D"]
    badge: "grade"
  - step: "いまの成績" 1.2s
    focus: ["A", "B", "C", "D", "F", "◆ Current"]
    badge: "grade"
    description: "5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60) で 5 letter grade band を分散、 各 band 個別 card + current indicator (default score 85 → B lane)、 slider 変化で grade readout が letter + color 追随、 grade band 分類と current の 2 経路 view。"
`;

export const sourceJson__examGrade = `{
  "title": "成績を A から F の 5 段階で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "score",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 85,
      "label": "Score"
    }
  ],
  "readouts": [
    {
      "id": "g",
      "kind": "grade",
      "source": "score",
      "max": 100,
      "label": "Letter grade (band)"
    }
  ],
  "lanes": {
    "A": { "x": 0, "width": 130 },
    "B": { "x": 150, "width": 130 },
    "C": { "x": 300, "width": 130 },
    "D": { "x": 450, "width": 130 },
    "F": { "x": 600, "width": 130 }
  },
  "actors": [
    { "name": "A", "kind": "card", "lane": "A", "stack": 0, "subtitle": "≥ 90 (green)" },
    {
      "name": "B",
      "kind": "card",
      "lane": "B",
      "stack": 0,
      "subtitle": "80-89 (blue, default here)"
    },
    { "name": "C", "kind": "card", "lane": "C", "stack": 0, "subtitle": "70-79 (yellow)" },
    { "name": "D", "kind": "card", "lane": "D", "stack": 0, "subtitle": "60-69 (orange)" },
    { "name": "F", "kind": "card", "lane": "F", "stack": 0, "subtitle": "< 60 (red)" },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "B",
      "stack": 1,
      "subtitle": "score = {score} / 100"
    }
  ],
  "flow": [],
  "states": { "score": 85 },
  "animation": [
    { "step": "上の 2 段階", "duration": 1.2, "focus": ["A", "B"], "badge": "grade" },
    { "step": "下の 3 段階", "duration": 1.2, "focus": ["A", "B", "C", "D"], "badge": "grade" },
    {
      "step": "いまの成績",
      "duration": 1.2,
      "focus": ["A", "B", "C", "D", "F", "◆ Current"],
      "badge": "grade",
      "body": "5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60) で 5 letter grade band を分散、 各 band 個別 card + current indicator (default score 85 → B lane)、 slider 変化で grade readout が letter + color 追随、 grade band 分類と current の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__gridLayoutMatrix = `title: "3 行 4 列の格子を列ごとに並べる"
type: flow

inputs:
  r: { kind: stepper, min: 0, max: 2, defaultValue: 0, label: "Row" }
  c: { kind: stepper, min: 0, max: 3, defaultValue: 0, label: "Col" }

readouts:
  hover: { kind: stat, source: "r", label: "Row" }
  hoverC: { kind: stat, source: "c", label: "Col" }

lanes:
  col0: { x: 0, width: 150 }
  col1: { x: 170, width: 150 }
  col2: { x: 340, width: 150 }
  col3: { x: 510, width: 150 }

states:
  r: 0
  c: 0

actors:
  - r0 c0: { kind: card, lane: col0, stack: 0, subtitle: "col0 lane · row0 stack" }
  - r0 c1: { kind: card, lane: col1, stack: 0, subtitle: "col1 lane · row0 stack" }
  - r0 c2: { kind: card, lane: col2, stack: 0, subtitle: "col2 lane · row0 stack" }
  - r0 c3: { kind: card, lane: col3, stack: 0, subtitle: "col3 lane · row0 stack" }
  - r1 c0: { kind: card, lane: col0, stack: 1, subtitle: "col0 lane · row1 stack" }
  - r1 c1: { kind: card, lane: col1, stack: 1, subtitle: "col1 lane · row1 stack" }
  - r1 c2: { kind: card, lane: col2, stack: 1, subtitle: "col2 lane · row1 stack" }
  - r1 c3: { kind: card, lane: col3, stack: 1, subtitle: "col3 lane · row1 stack" }
  - r2 c0: { kind: card, lane: col0, stack: 2, subtitle: "col0 lane · row2 stack" }
  - r2 c1: { kind: card, lane: col1, stack: 2, subtitle: "col1 lane · row2 stack" }
  - r2 c2: { kind: card, lane: col2, stack: 2, subtitle: "col2 lane · row2 stack" }
  - r2 c3: { kind: card, lane: col3, stack: 2, subtitle: "col3 lane · row2 stack" }

animation:
  - step: "1 行目を見る" 1.8s
    focus: ["r0 c0", "r0 c1", "r0 c2", "r0 c3"]
    description: "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。"
  - step: "2 行目を見る" 1.8s
    focus: ["r1 c0", "r1 c1", "r1 c2", "r1 c3"]
    description: "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。"
  - step: "3 行目を見る" 1.8s
    focus: ["r2 c0", "r2 c1", "r2 c2", "r2 c3"]
    description: "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。"
`;

export const sourceJson__gridLayoutMatrix = `{
  "title": "3 行 4 列の格子を列ごとに並べる",
  "type": "flow",
  "inputs": [
    { "id": "r", "kind": "stepper", "min": 0, "max": 2, "defaultValue": 0, "label": "Row" },
    { "id": "c", "kind": "stepper", "min": 0, "max": 3, "defaultValue": 0, "label": "Col" }
  ],
  "readouts": [
    { "id": "hover", "kind": "stat", "source": "r", "label": "Row" },
    { "id": "hoverC", "kind": "stat", "source": "c", "label": "Col" }
  ],
  "lanes": {
    "col0": { "x": 0, "width": 150 },
    "col1": { "x": 170, "width": 150 },
    "col2": { "x": 340, "width": 150 },
    "col3": { "x": 510, "width": 150 }
  },
  "actors": [
    {
      "name": "r0 c0",
      "kind": "card",
      "lane": "col0",
      "stack": 0,
      "subtitle": "col0 lane · row0 stack"
    },
    {
      "name": "r0 c1",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "col1 lane · row0 stack"
    },
    {
      "name": "r0 c2",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "col2 lane · row0 stack"
    },
    {
      "name": "r0 c3",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "col3 lane · row0 stack"
    },
    {
      "name": "r1 c0",
      "kind": "card",
      "lane": "col0",
      "stack": 1,
      "subtitle": "col0 lane · row1 stack"
    },
    {
      "name": "r1 c1",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "col1 lane · row1 stack"
    },
    {
      "name": "r1 c2",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "col2 lane · row1 stack"
    },
    {
      "name": "r1 c3",
      "kind": "card",
      "lane": "col3",
      "stack": 1,
      "subtitle": "col3 lane · row1 stack"
    },
    {
      "name": "r2 c0",
      "kind": "card",
      "lane": "col0",
      "stack": 2,
      "subtitle": "col0 lane · row2 stack"
    },
    {
      "name": "r2 c1",
      "kind": "card",
      "lane": "col1",
      "stack": 2,
      "subtitle": "col1 lane · row2 stack"
    },
    {
      "name": "r2 c2",
      "kind": "card",
      "lane": "col2",
      "stack": 2,
      "subtitle": "col2 lane · row2 stack"
    },
    {
      "name": "r2 c3",
      "kind": "card",
      "lane": "col3",
      "stack": 2,
      "subtitle": "col3 lane · row2 stack"
    }
  ],
  "flow": [],
  "states": { "r": 0, "c": 0 },
  "animation": [
    {
      "step": "1 行目を見る",
      "duration": 1.8,
      "focus": ["r0 c0", "r0 c1", "r0 c2", "r0 c3"],
      "body": "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。"
    },
    {
      "step": "2 行目を見る",
      "duration": 1.8,
      "focus": ["r1 c0", "r1 c1", "r1 c2", "r1 c3"],
      "body": "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。"
    },
    {
      "step": "3 行目を見る",
      "duration": 1.8,
      "focus": ["r2 c0", "r2 c1", "r2 c2", "r2 c3"],
      "body": "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。"
    }
  ]
}`;

export const sourceYaml__inputSliderBar = `title: "スライダーの値が右の箱の説明欄に届く"
type: flow

inputs:
  value: { kind: slider, min: 0, max: 100, defaultValue: 50, label: "Value" }

lanes:
  slider: { x: 0, width: 260 }
  output: { x: 300, width: 260 }

states:
  value: 50

actors:
  - sliderNode: { kind: card, lane: slider, stack: 0, subtitle: "value = {value}", title: "Slider" }
  - bar-node: { kind: card, lane: output, stack: 0, subtitle: "value: {value}", title: "Bar" }

flow:
  - sliderNode -> bar-node: "signal bind" (info)

animation:
  - step: "つまみを持つ" 1.6s
    focus: ["sliderNode"]
    description: "左の縦列だけを見る。 つまみが \`value\` という値を握っていて、動かすとこの値が変わる。 まだ右の棒には届いていない。"
  - step: "値が渡る" 1.6s
    focus: ["sliderNode", "bar-node"]
    description: "つまみと右の箱を結ぶ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。"
  - step: "説明欄に出る" 1.6s
    focus: ["bar-node"]
    description: "渡った値が右の箱の説明欄に出る。 図形の大きさは変わらず、文字として反映される経路。"
`;

export const sourceJson__inputSliderBar = `{
  "title": "スライダーの値が右の箱の説明欄に届く",
  "type": "flow",
  "inputs": [
    {
      "id": "value",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 50,
      "label": "Value"
    }
  ],
  "lanes": {
    "slider": { "x": 0, "width": 260 },
    "output": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "sliderNode",
      "kind": "card",
      "lane": "slider",
      "stack": 0,
      "subtitle": "value = {value}",
      "title": "Slider"
    },
    {
      "name": "bar-node",
      "kind": "card",
      "lane": "output",
      "stack": 0,
      "subtitle": "value: {value}",
      "title": "Bar"
    }
  ],
  "flow": [
    { "from": "sliderNode", "to": "bar-node", "label": "signal bind", "tone": "info" }
  ],
  "states": { "value": 50 },
  "animation": [
    {
      "step": "つまみを持つ",
      "duration": 1.6,
      "focus": ["sliderNode"],
      "body": "左の縦列だけを見る。 つまみが \`value\` という値を握っていて、動かすとこの値が変わる。 まだ右の棒には届いていない。"
    },
    {
      "step": "値が渡る",
      "duration": 1.6,
      "focus": ["sliderNode", "bar-node"],
      "body": "つまみと右の箱を結ぶ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。"
    },
    {
      "step": "説明欄に出る",
      "duration": 1.6,
      "focus": ["bar-node"],
      "body": "渡った値が右の箱の説明欄に出る。 図形の大きさは変わらず、文字として反映される経路。"
    }
  ]
}`;

export const sourceYaml__inputVariety = `title: "スライダー / 複数選択 / タブ / 文字の 4 入力を並べる"
type: flow

inputs:
  priceRange: { kind: range, min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "Price Range" }
  tags: { kind: multi-select, options: ["new", "sale", "hot", "featured"], defaultValues: ["new"], label: "Tags" }
  view: { kind: tabs, options: ["grid", "list", "compact"], defaultValue: "grid", label: "View" }
  query: { kind: text, defaultValue: "", placeholder: "Search...", maxLength: 50, label: "Query" }

lanes:
  range: { x: 0, width: 360 }
  multi: { x: 380, width: 360 }
  tabs: { x: 760, width: 230 }
  text: { x: 1010, width: 320 }

states:
  priceRange: "200,700"
  tags: "new"
  view: "grid"
  query: ""

actors:
  - rangeNode: { kind: card, lane: range, stack: 0, subtitle: "price = {priceRange}", posW: 310, title: "Range slider" }
  - multiNode: { kind: card, lane: multi, stack: 0, subtitle: "tags = {tags}", posW: 310, title: "Multi-select" }
  - tabsNode: { kind: card, lane: tabs, stack: 0, subtitle: "view = {view}", posW: 180, title: "Tabs" }
  - textNode: { kind: card, lane: text, stack: 0, subtitle: "query = {query}", posW: 270, title: "Text input" }

animation:
  - step: "数を選ぶ" 1.6s
    focus: ["rangeNode"]
    description: "つまみで数の範囲を選ぶ。 4 種類の入力のうち 1 つ目。"
  - step: "複数選ぶ" 1.6s
    focus: ["rangeNode", "multiNode"]
    description: "札を複数選べる入力を加える。 選んだ数だけ値が増える。"
  - step: "切り替える" 1.6s
    focus: ["rangeNode", "multiNode", "tabsNode"]
    description: "タブで表示を切り替える入力を加える。 1 つだけ選ぶ形。"
  - step: "文字を打つ" 1.6s
    focus: ["rangeNode", "multiNode", "tabsNode", "textNode"]
    description: "文字を打つ入力まで並ぶ。 4 種類が同じ図の中で動く。"
`;

export const sourceJson__inputVariety = `{
  "title": "スライダー / 複数選択 / タブ / 文字の 4 入力を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "priceRange",
      "kind": "range",
      "min": 0,
      "max": 1000,
      "defaultLo": 200,
      "defaultHi": 700,
      "label": "Price Range"
    },
    {
      "id": "tags",
      "kind": "multi-select",
      "options": ["new", "sale", "hot", "featured"],
      "defaultValues": ["new"],
      "label": "Tags"
    },
    {
      "id": "view",
      "kind": "tabs",
      "options": ["grid", "list", "compact"],
      "defaultValue": "grid",
      "label": "View"
    },
    {
      "id": "query",
      "kind": "text",
      "defaultValue": "",
      "placeholder": "Search...",
      "maxLength": 50,
      "label": "Query"
    }
  ],
  "lanes": {
    "range": { "x": 0, "width": 360 },
    "multi": { "x": 380, "width": 360 },
    "tabs": { "x": 760, "width": 230 },
    "text": { "x": 1010, "width": 320 }
  },
  "actors": [
    {
      "name": "rangeNode",
      "kind": "card",
      "lane": "range",
      "stack": 0,
      "subtitle": "price = {priceRange}",
      "posW": 310,
      "title": "Range slider"
    },
    {
      "name": "multiNode",
      "kind": "card",
      "lane": "multi",
      "stack": 0,
      "subtitle": "tags = {tags}",
      "posW": 310,
      "title": "Multi-select"
    },
    {
      "name": "tabsNode",
      "kind": "card",
      "lane": "tabs",
      "stack": 0,
      "subtitle": "view = {view}",
      "posW": 180,
      "title": "Tabs"
    },
    {
      "name": "textNode",
      "kind": "card",
      "lane": "text",
      "stack": 0,
      "subtitle": "query = {query}",
      "posW": 270,
      "title": "Text input"
    }
  ],
  "flow": [],
  "states": { "priceRange": "200,700", "tags": "new", "view": "grid", "query": "" },
  "animation": [
    {
      "step": "数を選ぶ",
      "duration": 1.6,
      "focus": ["rangeNode"],
      "body": "つまみで数の範囲を選ぶ。 4 種類の入力のうち 1 つ目。"
    },
    {
      "step": "複数選ぶ",
      "duration": 1.6,
      "focus": ["rangeNode", "multiNode"],
      "body": "札を複数選べる入力を加える。 選んだ数だけ値が増える。"
    },
    {
      "step": "切り替える",
      "duration": 1.6,
      "focus": ["rangeNode", "multiNode", "tabsNode"],
      "body": "タブで表示を切り替える入力を加える。 1 つだけ選ぶ形。"
    },
    {
      "step": "文字を打つ",
      "duration": 1.6,
      "focus": ["rangeNode", "multiNode", "tabsNode", "textNode"],
      "body": "文字を打つ入力まで並ぶ。 4 種類が同じ図の中で動く。"
    }
  ]
}`;

export const sourceYaml__interactiveOauthFlow = `title: "OAuth 認可コードの往復を追う"
type: flow

inputs:
  delay: { kind: slider, min: 0, max: 300, defaultValue: 50, label: "Server delay (ms)" }

readouts:
  seq: { kind: sequence-timeline, source: "events", min: 0, max: 700, viewW: 400, viewH: 60, color: "#2563eb", label: "Timeline" }
  finalDelay: { kind: stat, source: "delay", unit: "ms", label: "Delay" }

lanes:
  user: { x: 0, width: 220 }
  auth: { x: 320, width: 220 }
  resource: { x: 640, width: 220 }

states:
  delay: 50
  events: '[[0,"click"],[100,"redirect"],[200,"consent"],[350,"code"],[500,"token"],[650,"resp"]]'

actors:
  - client: { kind: card, lane: user, stack: 0, subtitle: "user agent", title: "Browser" }
  - consent: { kind: card, lane: auth, stack: 0, subtitle: "delay {delay}ms", title: "Auth server" }
  - api: { kind: card, lane: resource, stack: 0, subtitle: "API endpoint", title: "Resource" }

flow:
  - client -> consent: "1. redirect (with client_id)" (info)
  - consent -> client: "2. consent screen (user approves)" (info) { side: "left" }
  - client -> consent: "3. code exchange (with code)" (accent)
  - consent -> client: "4. token issued (access_token)" (success) { side: "left" }
  - client -> api: "5. API call" (accent) { sub: "Bearer token" }
  - api -> client: "6. resp" (success) { sub: "protected data", side: "bottom", labelOffsetY: 120 }

animation:
  - step: "認可を求める" 1.8s
    focus: ["client"]
    set:
      events: '[[0,"認可要求"]]'
    description: "利用者が認可画面に進む。 やり取りの 1 つ目が記録される。"
  - step: "コードを受け取る" 1.8s
    focus: ["client", "consent"]
    set:
      events: '[[0,"認可要求"],[120,"コード発行"]]'
    description: "認可コードが返る。 やり取りが 2 つに増える。"
  - step: "引き換える" 1.8s
    focus: ["client", "consent", "api"]
    set:
      events: '[[0,"認可要求"],[120,"コード発行"],[260,"token 交換"],[380,"token 発行"],[500,"資源要求"],[620,"資源応答"]]'
    description: "コードを token に引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。"
`;

export const sourceJson__interactiveOauthFlow = `{
  "title": "OAuth 認可コードの往復を追う",
  "type": "flow",
  "inputs": [
    {
      "id": "delay",
      "kind": "slider",
      "min": 0,
      "max": 300,
      "defaultValue": 50,
      "label": "Server delay (ms)"
    }
  ],
  "readouts": [
    {
      "id": "seq",
      "kind": "sequence-timeline",
      "source": "events",
      "min": 0,
      "max": 700,
      "viewW": 400,
      "viewH": 60,
      "color": "#2563eb",
      "label": "Timeline"
    },
    { "id": "finalDelay", "kind": "stat", "source": "delay", "unit": "ms", "label": "Delay" }
  ],
  "lanes": {
    "user": { "x": 0, "width": 220 },
    "auth": { "x": 320, "width": 220 },
    "resource": { "x": 640, "width": 220 }
  },
  "actors": [
    {
      "name": "client",
      "kind": "card",
      "lane": "user",
      "stack": 0,
      "subtitle": "user agent",
      "title": "Browser"
    },
    {
      "name": "consent",
      "kind": "card",
      "lane": "auth",
      "stack": 0,
      "subtitle": "delay {delay}ms",
      "title": "Auth server"
    },
    {
      "name": "api",
      "kind": "card",
      "lane": "resource",
      "stack": 0,
      "subtitle": "API endpoint",
      "title": "Resource"
    }
  ],
  "flow": [
    {
      "from": "client",
      "to": "consent",
      "label": "1. redirect (with client_id)",
      "tone": "info"
    },
    {
      "from": "consent",
      "to": "client",
      "label": "2. consent screen (user approves)",
      "tone": "info",
      "side": "left"
    },
    {
      "from": "client",
      "to": "consent",
      "label": "3. code exchange (with code)",
      "tone": "accent"
    },
    {
      "from": "consent",
      "to": "client",
      "label": "4. token issued (access_token)",
      "tone": "success",
      "side": "left"
    },
    {
      "from": "client",
      "to": "api",
      "label": "5. API call",
      "sub": "Bearer token",
      "tone": "accent"
    },
    {
      "from": "api",
      "to": "client",
      "label": "6. resp",
      "sub": "protected data",
      "tone": "success",
      "side": "bottom",
      "labelOffsetY": 120
    }
  ],
  "states": {
    "delay": 50,
    "events": "[[0,\\"click\\"],[100,\\"redirect\\"],[200,\\"consent\\"],[350,\\"code\\"],[500,\\"token\\"],[650,\\"resp\\"]]"
  },
  "animation": [
    {
      "step": "認可を求める",
      "duration": 1.8,
      "focus": ["client"],
      "set": { "events": "[[0,\\"認可要求\\"]]" },
      "body": "利用者が認可画面に進む。 やり取りの 1 つ目が記録される。"
    },
    {
      "step": "コードを受け取る",
      "duration": 1.8,
      "focus": ["client", "consent"],
      "set": { "events": "[[0,\\"認可要求\\"],[120,\\"コード発行\\"]]" },
      "body": "認可コードが返る。 やり取りが 2 つに増える。"
    },
    {
      "step": "引き換える",
      "duration": 1.8,
      "focus": ["client", "consent", "api"],
      "set": {
        "events": "[[0,\\"認可要求\\"],[120,\\"コード発行\\"],[260,\\"token 交換\\"],[380,\\"token 発行\\"],[500,\\"資源要求\\"],[620,\\"資源応答\\"]]"
      },
      "body": "コードを token に引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。"
    }
  ]
}`;

export const sourceYaml__issuePriorityBadge = `title: "課題の優先度を高 / 中 / 低で見せる"
type: flow

inputs:
  prio: { kind: dropdown, options: ["high", "med", "low"], defaultValue: "high", label: "Priority" }
  desc: { kind: text, defaultValue: "Fix crash on startup", placeholder: "Issue description", maxLength: 60, label: "Description" }

readouts:
  pb: { kind: priority-badge, source: "prio", textSource: "desc", label: "Priority (badge + icon + text)" }

lanes:
  high: { x: 0, width: 200 }
  med: { x: 240, width: 200 }
  low: { x: 480, width: 200 }

states:
  prio: "high"
  desc: "Fix crash on startup"

actors:
  - highNode: { kind: card, lane: high, stack: 0, subtitle: "red · crash / regression", title: "▲ High" }
  - medNode: { kind: card, lane: med, stack: 0, subtitle: "yellow · normal bug", title: "● Med" }
  - lowNode: { kind: card, lane: low, stack: 0, subtitle: "gray · nice-to-have", title: "▼ Low" }
  - currentIssue: { kind: card, lane: high, stack: 1, subtitle: "prio: {prio} · {desc}", title: "◆ Current" }

animation:
  - step: "高い優先度" 1.2s
    focus: ["highNode"]
    badge: "issue"
  - step: "低い優先度まで" 1.2s
    focus: ["highNode", "medNode"]
    badge: "issue"
  - step: "いまの課題" 1.2s
    focus: ["highNode", "medNode", "lowNode", "currentIssue"]
    badge: "issue"
    description: "3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。"
`;

export const sourceJson__issuePriorityBadge = `{
  "title": "課題の優先度を高 / 中 / 低で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "prio",
      "kind": "dropdown",
      "options": ["high", "med", "low"],
      "defaultValue": "high",
      "label": "Priority"
    },
    {
      "id": "desc",
      "kind": "text",
      "defaultValue": "Fix crash on startup",
      "placeholder": "Issue description",
      "maxLength": 60,
      "label": "Description"
    }
  ],
  "readouts": [
    {
      "id": "pb",
      "kind": "priority-badge",
      "source": "prio",
      "textSource": "desc",
      "label": "Priority (badge + icon + text)"
    }
  ],
  "lanes": {
    "high": { "x": 0, "width": 200 },
    "med": { "x": 240, "width": 200 },
    "low": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "highNode",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "red · crash / regression",
      "title": "▲ High"
    },
    {
      "name": "medNode",
      "kind": "card",
      "lane": "med",
      "stack": 0,
      "subtitle": "yellow · normal bug",
      "title": "● Med"
    },
    {
      "name": "lowNode",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "gray · nice-to-have",
      "title": "▼ Low"
    },
    {
      "name": "currentIssue",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "prio: {prio} · {desc}",
      "title": "◆ Current"
    }
  ],
  "flow": [],
  "states": { "prio": "high", "desc": "Fix crash on startup" },
  "animation": [
    { "step": "高い優先度", "duration": 1.2, "focus": ["highNode"], "badge": "issue" },
    { "step": "低い優先度まで", "duration": 1.2, "focus": ["highNode", "medNode"], "badge": "issue" },
    {
      "step": "いまの課題",
      "duration": 1.2,
      "focus": ["highNode", "medNode", "lowNode", "currentIssue"],
      "badge": "issue",
      "body": "3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__kpiBullet = `title: "実績と目標を良 / 並 / 悪の帯で見せる"
type: flow

inputs:
  actual: { kind: slider, min: 0, max: 100, defaultValue: 55, label: "Actual" }

readouts:
  b: { kind: bullet-chart, source: "actual", targetSource: "target", max: 100, rangeBad: 40, rangeAvg: 70, viewW: 320, viewH: 40, colorActual: "#241c14", label: "Progress (bullet chart)" }
  targetStat: { kind: stat, source: "target", label: "Target" }

lanes:
  bad: { x: 0, width: 180 }
  avg: { x: 220, width: 180 }
  good: { x: 440, width: 220 }

states:
  actual: 55
  target: 80

actors:
  - Bad range: { kind: card, lane: bad, stack: 0, subtitle: "0-40 (red)" }
  - Avg range: { kind: card, lane: avg, stack: 0, subtitle: "40-70 (yellow) · actual {actual} here" }
  - Good range: { kind: card, lane: good, stack: 0, subtitle: "70-100 (green) · target {target}" }
  - ◆ Actual: { kind: card, lane: avg, stack: 1, subtitle: "{actual}" }
  - ▼ Target: { kind: card, lane: good, stack: 1, subtitle: "{target}" }

flow:
  - ◆ Actual -> ▼ Target: "gap = target - actual" (warning)

animation:
  - step: "悪い帯を見る" 1.8s
    focus: ["Bad range", "◆ Actual"]
    description: "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。"
  - step: "並の帯を見る" 1.8s
    focus: ["Bad range", "Avg range", "◆ Actual"]
    description: "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。"
  - step: "良い帯と目標" 1.8s
    focus: ["Bad range", "Avg range", "Good range", "◆ Actual", "▼ Target"]
    description: "一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。"
`;

export const sourceJson__kpiBullet = `{
  "title": "実績と目標を良 / 並 / 悪の帯で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "actual",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 55,
      "label": "Actual"
    }
  ],
  "readouts": [
    {
      "id": "b",
      "kind": "bullet-chart",
      "source": "actual",
      "targetSource": "target",
      "max": 100,
      "rangeBad": 40,
      "rangeAvg": 70,
      "viewW": 320,
      "viewH": 40,
      "colorActual": "#241c14",
      "label": "Progress (bullet chart)"
    },
    { "id": "targetStat", "kind": "stat", "source": "target", "label": "Target" }
  ],
  "lanes": {
    "bad": { "x": 0, "width": 180 },
    "avg": { "x": 220, "width": 180 },
    "good": { "x": 440, "width": 220 }
  },
  "actors": [
    { "name": "Bad range", "kind": "card", "lane": "bad", "stack": 0, "subtitle": "0-40 (red)" },
    {
      "name": "Avg range",
      "kind": "card",
      "lane": "avg",
      "stack": 0,
      "subtitle": "40-70 (yellow) · actual {actual} here"
    },
    {
      "name": "Good range",
      "kind": "card",
      "lane": "good",
      "stack": 0,
      "subtitle": "70-100 (green) · target {target}"
    },
    { "name": "◆ Actual", "kind": "card", "lane": "avg", "stack": 1, "subtitle": "{actual}" },
    { "name": "▼ Target", "kind": "card", "lane": "good", "stack": 1, "subtitle": "{target}" }
  ],
  "flow": [
    {
      "from": "◆ Actual",
      "to": "▼ Target",
      "label": "gap = target - actual",
      "tone": "warning"
    }
  ],
  "states": { "actual": 55, "target": 80 },
  "animation": [
    {
      "step": "悪い帯を見る",
      "duration": 1.8,
      "focus": ["Bad range", "◆ Actual"],
      "body": "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。"
    },
    {
      "step": "並の帯を見る",
      "duration": 1.8,
      "focus": ["Bad range", "Avg range", "◆ Actual"],
      "body": "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。"
    },
    {
      "step": "良い帯と目標",
      "duration": 1.8,
      "focus": ["Bad range", "Avg range", "Good range", "◆ Actual", "▼ Target"],
      "body": "一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。"
    }
  ]
}`;

export const sourceYaml__mlConfidenceMeter = `title: "推論の確信度を低 / 中 / 高で見せる"
type: flow

inputs:
  conf: { kind: slider, min: 0, max: 100, defaultValue: 82, label: "Confidence %" }

readouts:
  cm: { kind: confidence-meter, source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 280, viewH: 40, label: "Confidence (3-band bar)" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 220 }

states:
  conf: 82

actors:
  - Low band: { kind: card, lane: low, stack: 0, subtitle: "< 40% (red · uncertain)" }
  - Mid band: { kind: card, lane: mid, stack: 0, subtitle: "40-74% (yellow · borderline)" }
  - High band: { kind: card, lane: high, stack: 0, subtitle: "≥ 75% (green · confident)" }
  - ◆ Current: { kind: card, lane: high, stack: 1, subtitle: "conf = {conf}% (default 82 → high)" }

animation:
  - step: "低い帯" 1.2s
    focus: ["Low band"]
    badge: "ML conf"
  - step: "高い帯まで" 1.2s
    focus: ["Low band", "Mid band"]
    badge: "ML conf"
  - step: "いまの確信度" 1.2s
    focus: ["Low band", "Mid band", "High band", "◆ Current"]
    badge: "ML conf"
    description: "3-lane (Low <40 red / Mid 40-74 yellow / High ≥75 green) で 3 confidence band を分散、 current indicator (default 82 → high lane)、 slider 変化で confidenceMeter readout が band 色追随、 ML/AI classification band 分類と meter の 2 経路 view。"
`;

export const sourceJson__mlConfidenceMeter = `{
  "title": "推論の確信度を低 / 中 / 高で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "conf",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 82,
      "label": "Confidence %"
    }
  ],
  "readouts": [
    {
      "id": "cm",
      "kind": "confidence-meter",
      "source": "conf",
      "lowThreshold": 40,
      "highThreshold": 75,
      "viewW": 280,
      "viewH": 40,
      "label": "Confidence (3-band bar)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "Low band",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "< 40% (red · uncertain)"
    },
    {
      "name": "Mid band",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "40-74% (yellow · borderline)"
    },
    {
      "name": "High band",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "≥ 75% (green · confident)"
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "conf = {conf}% (default 82 → high)"
    }
  ],
  "flow": [],
  "states": { "conf": 82 },
  "animation": [
    { "step": "低い帯", "duration": 1.2, "focus": ["Low band"], "badge": "ML conf" },
    { "step": "高い帯まで", "duration": 1.2, "focus": ["Low band", "Mid band"], "badge": "ML conf" },
    {
      "step": "いまの確信度",
      "duration": 1.2,
      "focus": ["Low band", "Mid band", "High band", "◆ Current"],
      "badge": "ML conf",
      "body": "3-lane (Low <40 red / Mid 40-74 yellow / High ≥75 green) で 3 confidence band を分散、 current indicator (default 82 → high lane)、 slider 変化で confidenceMeter readout が band 色追随、 ML/AI classification band 分類と meter の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__numberSparkline = `title: "現在値と履歴のミニ折れ線を並べる"
type: flow

inputs:
  val: { kind: number, defaultValue: 20, label: "Value" }

readouts:
  valHist: { kind: sparkline, source: "val", history: 15, color: "#e57373", label: "Sparkline history" }
  valStat: { kind: stat, source: "val", caption: "input 履歴の最新", label: "Latest" }

lanes:
  current: { x: 0, width: 220 }
  history: { x: 260, width: 320 }

states:
  val: 20

actors:
  - currentNode: { kind: card, lane: current, stack: 0, subtitle: "val = {val}", title: "Current" }
  - historyNode: { kind: card, lane: history, stack: 0, subtitle: "sparkline で直近 15 push 履歴", title: "History (15)" }

flow:
  - currentNode -> historyNode: "push" (info)

animation:
  - step: "現在値を見る" 1.8s
    focus: ["currentNode"]
    description: "つまみが持つ今の値。 数字と折れ線の右端が同じ値を指す。"
  - step: "履歴と並べる" 1.8s
    focus: ["currentNode", "historyNode"]
    description: "折れ線は過去の値を並べたもの。 現在値だけが右端で動く。"
  - step: "形で読む" 1.8s
    focus: ["historyNode"]
    description: "上下の動きは折れ線の形に残る。 数字 1 つでは分からない推移が読める。"
`;

export const sourceJson__numberSparkline = `{
  "title": "現在値と履歴のミニ折れ線を並べる",
  "type": "flow",
  "inputs": [
    { "id": "val", "kind": "number", "defaultValue": 20, "label": "Value" }
  ],
  "readouts": [
    {
      "id": "valHist",
      "kind": "sparkline",
      "source": "val",
      "history": 15,
      "color": "#e57373",
      "label": "Sparkline history"
    },
    {
      "id": "valStat",
      "kind": "stat",
      "source": "val",
      "caption": "input 履歴の最新",
      "label": "Latest"
    }
  ],
  "lanes": {
    "current": { "x": 0, "width": 220 },
    "history": { "x": 260, "width": 320 }
  },
  "actors": [
    {
      "name": "currentNode",
      "kind": "card",
      "lane": "current",
      "stack": 0,
      "subtitle": "val = {val}",
      "title": "Current"
    },
    {
      "name": "historyNode",
      "kind": "card",
      "lane": "history",
      "stack": 0,
      "subtitle": "sparkline で直近 15 push 履歴",
      "title": "History (15)"
    }
  ],
  "flow": [
    { "from": "currentNode", "to": "historyNode", "label": "push", "tone": "info" }
  ],
  "states": { "val": 20 },
  "animation": [
    {
      "step": "現在値を見る",
      "duration": 1.8,
      "focus": ["currentNode"],
      "body": "つまみが持つ今の値。 数字と折れ線の右端が同じ値を指す。"
    },
    {
      "step": "履歴と並べる",
      "duration": 1.8,
      "focus": ["currentNode", "historyNode"],
      "body": "折れ線は過去の値を並べたもの。 現在値だけが右端で動く。"
    },
    {
      "step": "形で読む",
      "duration": 1.8,
      "focus": ["historyNode"],
      "body": "上下の動きは折れ線の形に残る。 数字 1 つでは分からない推移が読める。"
    }
  ]
}`;

export const sourceYaml__onboardingStepper = `title: "5 段の初期設定ウィザードを追う"
type: flow

inputs:
  current: { kind: stepper, min: 0, max: 4, defaultValue: 2, label: "Current step" }

readouts:
  wizard: { kind: step-indicator, source: "current", stepsSource: "steps", viewW: 360, viewH: 60, colorActive: "#2563eb", colorPending: "#cbd5e1", label: "Progress (dot strip)" }

lanes:
  col1: { x: 0, width: 250 }
  col2: { x: 290, width: 340 }
  col3: { x: 670, width: 190 }

states:
  current: 2
  steps: '["Sign up","Profile","Preferences","Verify","Done"]'

actors:
  - Sign up: { kind: card, lane: col1, stack: 0, subtitle: "アカウント作成", posW: 200 }
  - Profile: { kind: card, lane: col1, stack: 1, subtitle: "プロフィール記入", posW: 200 }
  - Preferences: { kind: card, lane: col2, stack: 0, subtitle: "設定選択 (現在地)", posW: 290 }
  - Verify: { kind: card, lane: col2, stack: 1, subtitle: "認証確認", posW: 180 }
  - Done: { kind: card, lane: col3, stack: 0, subtitle: "完了", posW: 140 }

flow:
  - Sign up -> Profile: "next" (info)
  - Profile -> Preferences: "next" (info)
  - Preferences -> Verify: "next" (accent)
  - Verify -> Done: "finish" (success)

animation:
  - step: "最初の 2 段" 1.2s
    focus: ["Sign up"]
    badge: "wizard"
  - step: "中ほどまで" 1.2s
    focus: ["Sign up", "Profile", "Preferences"]
    badge: "wizard"
  - step: "最後まで" 1.2s
    focus: ["Sign up", "Profile", "Preferences", "Verify", "Done"]
    badge: "wizard"
    description: "5 区画 pipeline (Sign up → Profile → Preferences → Verify → Done) を 3 列 2 段に置いて + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。"
`;

export const sourceJson__onboardingStepper = `{
  "title": "5 段の初期設定ウィザードを追う",
  "type": "flow",
  "inputs": [
    {
      "id": "current",
      "kind": "stepper",
      "min": 0,
      "max": 4,
      "defaultValue": 2,
      "label": "Current step"
    }
  ],
  "readouts": [
    {
      "id": "wizard",
      "kind": "step-indicator",
      "source": "current",
      "stepsSource": "steps",
      "viewW": 360,
      "viewH": 60,
      "colorActive": "#2563eb",
      "colorPending": "#cbd5e1",
      "label": "Progress (dot strip)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 250 },
    "col2": { "x": 290, "width": 340 },
    "col3": { "x": 670, "width": 190 }
  },
  "actors": [
    {
      "name": "Sign up",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "アカウント作成",
      "posW": 200
    },
    {
      "name": "Profile",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "プロフィール記入",
      "posW": 200
    },
    {
      "name": "Preferences",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "設定選択 (現在地)",
      "posW": 290
    },
    {
      "name": "Verify",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "認証確認",
      "posW": 180
    },
    {
      "name": "Done",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "完了",
      "posW": 140
    }
  ],
  "flow": [
    { "from": "Sign up", "to": "Profile", "label": "next", "tone": "info" },
    { "from": "Profile", "to": "Preferences", "label": "next", "tone": "info" },
    { "from": "Preferences", "to": "Verify", "label": "next", "tone": "accent" },
    { "from": "Verify", "to": "Done", "label": "finish", "tone": "success" }
  ],
  "states": { "current": 2, "steps": "[\\"Sign up\\",\\"Profile\\",\\"Preferences\\",\\"Verify\\",\\"Done\\"]" },
  "animation": [
    { "step": "最初の 2 段", "duration": 1.2, "focus": ["Sign up"], "badge": "wizard" },
    {
      "step": "中ほどまで",
      "duration": 1.2,
      "focus": ["Sign up", "Profile", "Preferences"],
      "badge": "wizard"
    },
    {
      "step": "最後まで",
      "duration": 1.2,
      "focus": ["Sign up", "Profile", "Preferences", "Verify", "Done"],
      "badge": "wizard",
      "body": "5 区画 pipeline (Sign up → Profile → Preferences → Verify → Done) を 3 列 2 段に置いて + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。"
    }
  ]
}`;

export const sourceYaml__playlistSongQueue = `title: "再生待ち 5 曲を再生済 / 再生中 / 次にで分ける"
type: flow

inputs:
  cur: { kind: stepper, min: 0, max: 4, defaultValue: 1, label: "Current index" }

readouts:
  sq: { kind: song-queue, source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "Queue (current highlight)" }

lanes:
  played: { x: 0, width: 200 }
  now: { x: 240, width: 220 }
  next: { x: 500, width: 220 }

states:
  cur: 1
  queue: [["Bohemian Rhapsody","Queen","5:55"],["Hotel California","Eagles","6:30"],["Stairway to Heaven","Led Zeppelin","8:02"],["Sweet Child O' Mine","Guns N' Roses","5:56"],["Imagine","John Lennon","3:03"]]

actors:
  - ✓ Bohemian: { kind: card, lane: played, stack: 0, subtitle: "Queen · 5:55 (played)" }
  - ▶ Hotel: { kind: card, lane: now, stack: 0, subtitle: "Eagles · 6:30 (now playing)" }
  - Stairway: { kind: card, lane: next, stack: 0, subtitle: "Led Zeppelin · 8:02" }
  - Sweet Child: { kind: card, lane: next, stack: 1, subtitle: "Guns N' Roses · 5:56" }
  - Imagine: { kind: card, lane: next, stack: 2, subtitle: "John Lennon · 3:03" }

animation:
  - step: "再生済" 1.2s
    focus: ["✓ Bohemian"]
    badge: "music"
  - step: "再生中" 1.2s
    focus: ["✓ Bohemian", "▶ Hotel", "Stairway"]
    badge: "music"
  - step: "次に続く" 1.2s
    focus: ["✓ Bohemian", "▶ Hotel", "Stairway", "Sweet Child", "Imagine"]
    badge: "music"
    description: "3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。"
`;

export const sourceJson__playlistSongQueue = `{
  "title": "再生待ち 5 曲を再生済 / 再生中 / 次にで分ける",
  "type": "flow",
  "inputs": [
    {
      "id": "cur",
      "kind": "stepper",
      "min": 0,
      "max": 4,
      "defaultValue": 1,
      "label": "Current index"
    }
  ],
  "readouts": [
    {
      "id": "sq",
      "kind": "song-queue",
      "source": "queue",
      "currentSource": "cur",
      "max": 8,
      "color": "#2563eb",
      "label": "Queue (current highlight)"
    }
  ],
  "lanes": {
    "played": { "x": 0, "width": 200 },
    "now": { "x": 240, "width": 220 },
    "next": { "x": 500, "width": 220 }
  },
  "actors": [
    {
      "name": "✓ Bohemian",
      "kind": "card",
      "lane": "played",
      "stack": 0,
      "subtitle": "Queen · 5:55 (played)"
    },
    {
      "name": "▶ Hotel",
      "kind": "card",
      "lane": "now",
      "stack": 0,
      "subtitle": "Eagles · 6:30 (now playing)"
    },
    {
      "name": "Stairway",
      "kind": "card",
      "lane": "next",
      "stack": 0,
      "subtitle": "Led Zeppelin · 8:02"
    },
    {
      "name": "Sweet Child",
      "kind": "card",
      "lane": "next",
      "stack": 1,
      "subtitle": "Guns N' Roses · 5:56"
    },
    {
      "name": "Imagine",
      "kind": "card",
      "lane": "next",
      "stack": 2,
      "subtitle": "John Lennon · 3:03"
    }
  ],
  "flow": [],
  "states": {
    "cur": 1,
    "queue": "[[\\"Bohemian Rhapsody\\",\\"Queen\\",\\"5:55\\"],[\\"Hotel California\\",\\"Eagles\\",\\"6:30\\"],[\\"Stairway to Heaven\\",\\"Led Zeppelin\\",\\"8:02\\"],[\\"Sweet Child O' Mine\\",\\"Guns N' Roses\\",\\"5:56\\"],[\\"Imagine\\",\\"John Lennon\\",\\"3:03\\"]]"
  },
  "animation": [
    { "step": "再生済", "duration": 1.2, "focus": ["✓ Bohemian"], "badge": "music" },
    {
      "step": "再生中",
      "duration": 1.2,
      "focus": ["✓ Bohemian", "▶ Hotel", "Stairway"],
      "badge": "music"
    },
    {
      "step": "次に続く",
      "duration": 1.2,
      "focus": ["✓ Bohemian", "▶ Hotel", "Stairway", "Sweet Child", "Imagine"],
      "badge": "music",
      "body": "3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__productPriceTag = `title: "旧価格 / 新価格 / 割引率を並べる"
type: flow

inputs:
  newPrice: { kind: stepper, min: 0, max: 200, step: 5, defaultValue: 65, label: "New price" }

readouts:
  pt: { kind: price-tag, oldSource: "oldPrice", newSource: "newPrice", currency: "$", colorNew: "#241c14", colorOld: "#a08870", colorDiscount: "#ef4444", label: "Price (composite tag)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  newPrice: 65
  oldPrice: 100

actors:
  - Old price: { kind: card, lane: col1, stack: 0, subtitle: "\${oldPrice} (strikethrough)", posW: 310 }
  - New price: { kind: card, lane: col2, stack: 0, subtitle: "\${newPrice} (stepper driven)", posW: 320 }
  - Discount %: { kind: card, lane: col1, stack: 1, subtitle: "(oldPrice - newPrice) / oldPrice · red badge", posW: 320 }

flow:
  - Old price -> New price: "sale" (warning)
  - New price -> Discount %: "%" (error)

animation:
  - step: "旧価格" 1.2s
    focus: ["Old price"]
    badge: "price"
  - step: "新価格" 1.2s
    focus: ["Old price", "New price"]
    badge: "price"
  - step: "割引率" 1.2s
    focus: ["Old price", "New price", "Discount %"]
    badge: "price"
    description: "3 区画 (Old / New / Discount) を 2 列 2 段に置いて price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。"
`;

export const sourceJson__productPriceTag = `{
  "title": "旧価格 / 新価格 / 割引率を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "newPrice",
      "kind": "stepper",
      "min": 0,
      "max": 200,
      "step": 5,
      "defaultValue": 65,
      "label": "New price"
    }
  ],
  "readouts": [
    {
      "id": "pt",
      "kind": "price-tag",
      "oldSource": "oldPrice",
      "newSource": "newPrice",
      "currency": "$",
      "colorNew": "#241c14",
      "colorOld": "#a08870",
      "colorDiscount": "#ef4444",
      "label": "Price (composite tag)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "Old price",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "\${oldPrice} (strikethrough)",
      "posW": 310
    },
    {
      "name": "New price",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "\${newPrice} (stepper driven)",
      "posW": 320
    },
    {
      "name": "Discount %",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "(oldPrice - newPrice) / oldPrice · red badge",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "Old price", "to": "New price", "label": "sale", "tone": "warning" },
    { "from": "New price", "to": "Discount %", "label": "%", "tone": "error" }
  ],
  "states": { "newPrice": 65, "oldPrice": 100 },
  "animation": [
    { "step": "旧価格", "duration": 1.2, "focus": ["Old price"], "badge": "price" },
    { "step": "新価格", "duration": 1.2, "focus": ["Old price", "New price"], "badge": "price" },
    {
      "step": "割引率",
      "duration": 1.2,
      "focus": ["Old price", "New price", "Discount %"],
      "badge": "price",
      "body": "3 区画 (Old / New / Discount) を 2 列 2 段に置いて price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。"
    }
  ]
}`;

export const sourceYaml__productRating = `title: "商品評価を低 / 中 / 高の帯で見せる"
type: flow

inputs:
  score: { kind: slider, min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "Score" }

readouts:
  r: { kind: rating, source: "score", count: 5, color: "#eab308", label: "Rating (star display)" }

lanes:
  low: { x: 0, width: 220 }
  mid: { x: 260, width: 220 }
  high: { x: 520, width: 220 }

states:
  score: 3.5

actors:
  - Low range: { kind: card, lane: low, stack: 0, subtitle: "0-1.5 stars · poor" }
  - Mid range: { kind: card, lane: mid, stack: 0, subtitle: "2-3.5 stars · average · default 3.5 here" }
  - High range: { kind: card, lane: high, stack: 0, subtitle: "4-5 stars · excellent" }
  - ◆ Current: { kind: card, lane: mid, stack: 1, subtitle: "{score} / 5" }

animation:
  - step: "帯を並べる" 1.2s
    focus: ["Low range"]
    badge: "rating"
  - step: "現在の帯" 1.2s
    focus: ["Low range", "Mid range"]
    badge: "rating"
  - step: "いまの評価" 1.2s
    focus: ["Low range", "Mid range", "High range", "◆ Current"]
    badge: "rating"
    description: "3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) で rating range を分散、 default 3.5 の位置 (mid lane) を currentNode で明示、 slider (0.5 刻み) 変化で rating readout 追随 (star display half-star 対応)、 range 分類と star 表示の 2 経路 view。"
`;

export const sourceJson__productRating = `{
  "title": "商品評価を低 / 中 / 高の帯で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "score",
      "kind": "slider",
      "min": 0,
      "max": 5,
      "step": 0.5,
      "defaultValue": 3.5,
      "label": "Score"
    }
  ],
  "readouts": [
    {
      "id": "r",
      "kind": "rating",
      "source": "score",
      "count": 5,
      "color": "#eab308",
      "label": "Rating (star display)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 220 },
    "mid": { "x": 260, "width": 220 },
    "high": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "Low range",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "0-1.5 stars · poor"
    },
    {
      "name": "Mid range",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "2-3.5 stars · average · default 3.5 here"
    },
    {
      "name": "High range",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "4-5 stars · excellent"
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "mid",
      "stack": 1,
      "subtitle": "{score} / 5"
    }
  ],
  "flow": [],
  "states": { "score": 3.5 },
  "animation": [
    { "step": "帯を並べる", "duration": 1.2, "focus": ["Low range"], "badge": "rating" },
    { "step": "現在の帯", "duration": 1.2, "focus": ["Low range", "Mid range"], "badge": "rating" },
    {
      "step": "いまの評価",
      "duration": 1.2,
      "focus": ["Low range", "Mid range", "High range", "◆ Current"],
      "badge": "rating",
      "body": "3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) で rating range を分散、 default 3.5 の位置 (mid lane) を currentNode で明示、 slider (0.5 刻み) 変化で rating readout 追随 (star display half-star 対応)、 range 分類と star 表示の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__radioSelect = `title: "3 択のラジオで選んだ 1 つだけが光る"
type: flow

inputs:
  mode: { kind: radio, options: ["low", "mid", "high"], defaultValue: "mid", label: "Mode" }

readouts:
  modeStat: { kind: stat, source: "mode", caption: "選択中", label: "Current" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 200 }

states:
  mode: "mid"

actors:
  - Low mode: { kind: card, lane: low, stack: 0, subtitle: "option: low" }
  - Mid mode: { kind: card, lane: mid, stack: 0, subtitle: "option: mid (default)" }
  - High mode: { kind: card, lane: high, stack: 0, subtitle: "option: high" }
  - ◆ Current: { kind: card, lane: mid, stack: 1, subtitle: "mode = {mode}" }

animation:
  - step: "低の札" 1.8s
    focus: ["Low mode"]
    description: "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。"
  - step: "中の札" 1.8s
    focus: ["Mid mode"]
    description: "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。"
  - step: "高の札" 1.8s
    focus: ["High mode", "◆ Current"]
    description: "3 つ目の札。 選んだ値は右の箱にも文字で出る。"
`;

export const sourceJson__radioSelect = `{
  "title": "3 択のラジオで選んだ 1 つだけが光る",
  "type": "flow",
  "inputs": [
    {
      "id": "mode",
      "kind": "radio",
      "options": ["low", "mid", "high"],
      "defaultValue": "mid",
      "label": "Mode"
    }
  ],
  "readouts": [
    { "id": "modeStat", "kind": "stat", "source": "mode", "caption": "選択中", "label": "Current" }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 200 }
  },
  "actors": [
    { "name": "Low mode", "kind": "card", "lane": "low", "stack": 0, "subtitle": "option: low" },
    {
      "name": "Mid mode",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "option: mid (default)"
    },
    {
      "name": "High mode",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "option: high"
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "mid",
      "stack": 1,
      "subtitle": "mode = {mode}"
    }
  ],
  "flow": [],
  "states": { "mode": "mid" },
  "animation": [
    {
      "step": "低の札",
      "duration": 1.8,
      "focus": ["Low mode"],
      "body": "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。"
    },
    {
      "step": "中の札",
      "duration": 1.8,
      "focus": ["Mid mode"],
      "body": "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。"
    },
    {
      "step": "高の札",
      "duration": 1.8,
      "focus": ["High mode", "◆ Current"],
      "body": "3 つ目の札。 選んだ値は右の箱にも文字で出る。"
    }
  ]
}`;

export const sourceYaml__readoutVariety = `title: "熱セル / バッジ / 状態点の 3 表示を並べる"
type: flow

inputs:
  temp: { kind: slider, min: 0, max: 100, defaultValue: 42, label: "Temp" }
  state: { kind: dropdown, options: ["online", "offline", "error"], defaultValue: "online", label: "State" }

readouts:
  tempHeat: { kind: heat-cell, source: "temp", min: 0, max: 100, colors: ["#4e9dc4", "#e57373"], label: "Temp gradient" }
  tempBadge: { kind: badge, source: "temp", label: "Value pill" }
  statusRead: { kind: status-dot, source: "state", map: [{ value: "online", color: "#22c55e", label: "Online" }, { value: "offline", color: "#a08870", label: "Offline" }, { value: "error", color: "#ef4444", label: "Error" }], label: "State dot" }

lanes:
  heat: { x: 0, width: 220 }
  badge: { x: 260, width: 220 }
  dot: { x: 520, width: 220 }

states:
  temp: 42
  state: "online"

actors:
  - Heat cell: { kind: card, lane: heat, stack: 0, subtitle: "temp = {temp} · 色 gradient" }
  - Badge (pill): { kind: card, lane: badge, stack: 0, subtitle: "temp = {temp} · number pill" }
  - Status dot: { kind: card, lane: dot, stack: 0, subtitle: "state = {state} · online/offline/error" }

animation:
  - step: "熱の升目を見る" 1.8s
    focus: ["Heat cell"]
    description: "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。"
  - step: "札でも出す" 1.8s
    focus: ["Heat cell", "Badge (pill)"]
    description: "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。"
  - step: "状態の点を見る" 1.8s
    focus: ["Heat cell", "Badge (pill)", "Status dot"]
    description: "別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。"
`;

export const sourceJson__readoutVariety = `{
  "title": "熱セル / バッジ / 状態点の 3 表示を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "temp",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 42,
      "label": "Temp"
    },
    {
      "id": "state",
      "kind": "dropdown",
      "options": ["online", "offline", "error"],
      "defaultValue": "online",
      "label": "State"
    }
  ],
  "readouts": [
    {
      "id": "tempHeat",
      "kind": "heat-cell",
      "source": "temp",
      "min": 0,
      "max": 100,
      "colors": ["#4e9dc4", "#e57373"],
      "label": "Temp gradient"
    },
    { "id": "tempBadge", "kind": "badge", "source": "temp", "label": "Value pill" },
    {
      "id": "statusRead",
      "kind": "status-dot",
      "source": "state",
      "map": [
        { "value": "online", "color": "#22c55e", "label": "Online" },
        { "value": "offline", "color": "#a08870", "label": "Offline" },
        { "value": "error", "color": "#ef4444", "label": "Error" }
      ],
      "label": "State dot"
    }
  ],
  "lanes": {
    "heat": { "x": 0, "width": 220 },
    "badge": { "x": 260, "width": 220 },
    "dot": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "Heat cell",
      "kind": "card",
      "lane": "heat",
      "stack": 0,
      "subtitle": "temp = {temp} · 色 gradient"
    },
    {
      "name": "Badge (pill)",
      "kind": "card",
      "lane": "badge",
      "stack": 0,
      "subtitle": "temp = {temp} · number pill"
    },
    {
      "name": "Status dot",
      "kind": "card",
      "lane": "dot",
      "stack": 0,
      "subtitle": "state = {state} · online/offline/error"
    }
  ],
  "flow": [],
  "states": { "temp": 42, "state": "online" },
  "animation": [
    {
      "step": "熱の升目を見る",
      "duration": 1.8,
      "focus": ["Heat cell"],
      "body": "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。"
    },
    {
      "step": "札でも出す",
      "duration": 1.8,
      "focus": ["Heat cell", "Badge (pill)"],
      "body": "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。"
    },
    {
      "step": "状態の点を見る",
      "duration": 1.8,
      "focus": ["Heat cell", "Badge (pill)", "Status dot"],
      "body": "別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。"
    }
  ]
}`;

export const sourceYaml__revenueKpiCard = `title: "前期と今期の売上を推移付きで比べる"
type: flow

inputs:
  current: { kind: slider, min: 50, max: 300, defaultValue: 180, label: "Current revenue (k)" }

readouts:
  kpi: { kind: kpi-card, source: "current", historySource: "history", comparisonSource: "prev", unit: "k", colorPos: "#22c55e", colorNeg: "#ef4444", label: "Revenue KPI (composite)" }
  prevStat: { kind: stat, source: "prev", unit: "k", label: "Prev stat" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 350 }

states:
  current: 180
  prev: 150
  history: "[120,135,148,152,165,170]"

actors:
  - Previous: { kind: card, lane: col1, stack: 0, subtitle: "{prev}k (baseline)", posW: 220 }
  - ◆ Current: { kind: card, lane: col2, stack: 0, subtitle: "{current}k (slider driven)", posW: 300 }
  - Trend: { kind: card, lane: col1, stack: 1, subtitle: "6 month sparkline (120-170k)", posW: 320 }

flow:
  - Previous -> ◆ Current: "delta = current - prev" (success)
  - ◆ Current -> Trend: "sparkline last" (info)

animation:
  - step: "前期を見る" 1.8s
    focus: ["Previous"]
    description: "比べる相手になる前期の値。 これは固定で動かない。"
  - step: "今期を見る" 1.8s
    focus: ["Previous", "◆ Current"]
    description: "今期の値はつまみで動く。 前期との差がその場で出る。"
  - step: "推移で読む" 1.8s
    focus: ["Previous", "◆ Current", "Trend"]
    description: "推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。"
`;

export const sourceJson__revenueKpiCard = `{
  "title": "前期と今期の売上を推移付きで比べる",
  "type": "flow",
  "inputs": [
    {
      "id": "current",
      "kind": "slider",
      "min": 50,
      "max": 300,
      "defaultValue": 180,
      "label": "Current revenue (k)"
    }
  ],
  "readouts": [
    {
      "id": "kpi",
      "kind": "kpi-card",
      "source": "current",
      "historySource": "history",
      "comparisonSource": "prev",
      "unit": "k",
      "colorPos": "#22c55e",
      "colorNeg": "#ef4444",
      "label": "Revenue KPI (composite)"
    },
    { "id": "prevStat", "kind": "stat", "source": "prev", "unit": "k", "label": "Prev stat" }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 350 }
  },
  "actors": [
    {
      "name": "Previous",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "{prev}k (baseline)",
      "posW": 220
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "{current}k (slider driven)",
      "posW": 300
    },
    {
      "name": "Trend",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "6 month sparkline (120-170k)",
      "posW": 320
    }
  ],
  "flow": [
    {
      "from": "Previous",
      "to": "◆ Current",
      "label": "delta = current - prev",
      "tone": "success"
    },
    { "from": "◆ Current", "to": "Trend", "label": "sparkline last", "tone": "info" }
  ],
  "states": { "current": 180, "prev": 150, "history": "[120,135,148,152,165,170]" },
  "animation": [
    {
      "step": "前期を見る",
      "duration": 1.8,
      "focus": ["Previous"],
      "body": "比べる相手になる前期の値。 これは固定で動かない。"
    },
    {
      "step": "今期を見る",
      "duration": 1.8,
      "focus": ["Previous", "◆ Current"],
      "body": "今期の値はつまみで動く。 前期との差がその場で出る。"
    },
    {
      "step": "推移で読む",
      "duration": 1.8,
      "focus": ["Previous", "◆ Current", "Trend"],
      "body": "推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。"
    }
  ]
}`;

export const sourceYaml__revenueScoreboard = `title: "売上の現在 / 目標 / 差分を並べる"
type: flow

inputs:
  rev: { kind: slider, min: 0, max: 999, defaultValue: 234, label: "Revenue" }

readouts:
  nb: { kind: number-board, source: "rev", prefix: "$", suffix: "M", size: 56, color: "#241c14", caption: "vs $500M target", label: "Revenue (scoreboard)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 250 }

states:
  rev: 234

actors:
  - ◆ Current: { kind: card, lane: col1, stack: 0, subtitle: "\${rev}M (slider driven)", posW: 270 }
  - Target: { kind: card, lane: col2, stack: 0, subtitle: "$500M (Q3 goal)", posW: 200 }
  - Gap: { kind: card, lane: col1, stack: 1, subtitle: "target - current (progress toward goal)", posW: 320 }

flow:
  - ◆ Current -> Target: "progress" (info)
  - Target -> Gap: "delta" (warning)

animation:
  - step: "現在を見る" 1.2s
    focus: ["◆ Current"]
    badge: "scoreboard"
  - step: "目標を並べる" 1.2s
    focus: ["◆ Current", "Target"]
    badge: "scoreboard"
  - step: "差を出す" 1.2s
    focus: ["◆ Current", "Target", "Gap"]
    badge: "scoreboard"
    description: "3 区画 (Current / Target / Gap) を 2 列 2 段に置いて revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。"
`;

export const sourceJson__revenueScoreboard = `{
  "title": "売上の現在 / 目標 / 差分を並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "rev",
      "kind": "slider",
      "min": 0,
      "max": 999,
      "defaultValue": 234,
      "label": "Revenue"
    }
  ],
  "readouts": [
    {
      "id": "nb",
      "kind": "number-board",
      "source": "rev",
      "prefix": "$",
      "suffix": "M",
      "size": 56,
      "color": "#241c14",
      "caption": "vs $500M target",
      "label": "Revenue (scoreboard)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 250 }
  },
  "actors": [
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "\${rev}M (slider driven)",
      "posW": 270
    },
    {
      "name": "Target",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "$500M (Q3 goal)",
      "posW": 200
    },
    {
      "name": "Gap",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "target - current (progress toward goal)",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "◆ Current", "to": "Target", "label": "progress", "tone": "info" },
    { "from": "Target", "to": "Gap", "label": "delta", "tone": "warning" }
  ],
  "states": { "rev": 234 },
  "animation": [
    { "step": "現在を見る", "duration": 1.2, "focus": ["◆ Current"], "badge": "scoreboard" },
    {
      "step": "目標を並べる",
      "duration": 1.2,
      "focus": ["◆ Current", "Target"],
      "badge": "scoreboard"
    },
    {
      "step": "差を出す",
      "duration": 1.2,
      "focus": ["◆ Current", "Target", "Gap"],
      "badge": "scoreboard",
      "body": "3 区画 (Current / Target / Gap) を 2 列 2 段に置いて revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。"
    }
  ]
}`;

export const sourceYaml__roomThermometer = `title: "室温を寒い / 快適 / 暑いで分ける"
type: flow

inputs:
  temp: { kind: slider, min: 0, max: 40, defaultValue: 24, label: "Temp °C" }

readouts:
  th: { kind: thermometer, source: "temp", min: 0, max: 40, viewW: 70, viewH: 180, color: "#ef4444", unit: "°C", label: "Temp (vertical bar)" }

lanes:
  cold: { x: 0, width: 200 }
  comfort: { x: 240, width: 220 }
  hot: { x: 500, width: 200 }

states:
  temp: 24

actors:
  - Cold band: { kind: card, lane: cold, stack: 0, subtitle: "< 15°C (blue · heating)" }
  - Comfort band: { kind: card, lane: comfort, stack: 0, subtitle: "15-25°C (green · default range)" }
  - Hot band: { kind: card, lane: hot, stack: 0, subtitle: "≥ 25°C (red · cooling)" }
  - ◆ Current: { kind: card, lane: comfort, stack: 1, subtitle: "temp = {temp}°C (default 24 → comfort)" }

animation:
  - step: "寒い帯" 1.2s
    focus: ["Cold band"]
    badge: "temp"
  - step: "暑い帯まで" 1.2s
    focus: ["Cold band", "Comfort band"]
    badge: "temp"
  - step: "いまの室温" 1.2s
    focus: ["Cold band", "Comfort band", "Hot band", "◆ Current"]
    badge: "temp"
    description: "3-lane (Cold <15 / Comfort 15-25 / Hot ≥25) で room 温度を band 別分散、 current indicator (default 24 → comfort lane)、 slider 変化で thermometer readout 縦 bar + 球部 追随、 温度帯分類と thermometer 表示の 2 経路 view。"
`;

export const sourceJson__roomThermometer = `{
  "title": "室温を寒い / 快適 / 暑いで分ける",
  "type": "flow",
  "inputs": [
    {
      "id": "temp",
      "kind": "slider",
      "min": 0,
      "max": 40,
      "defaultValue": 24,
      "label": "Temp °C"
    }
  ],
  "readouts": [
    {
      "id": "th",
      "kind": "thermometer",
      "source": "temp",
      "min": 0,
      "max": 40,
      "viewW": 70,
      "viewH": 180,
      "color": "#ef4444",
      "unit": "°C",
      "label": "Temp (vertical bar)"
    }
  ],
  "lanes": {
    "cold": { "x": 0, "width": 200 },
    "comfort": { "x": 240, "width": 220 },
    "hot": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "Cold band",
      "kind": "card",
      "lane": "cold",
      "stack": 0,
      "subtitle": "< 15°C (blue · heating)"
    },
    {
      "name": "Comfort band",
      "kind": "card",
      "lane": "comfort",
      "stack": 0,
      "subtitle": "15-25°C (green · default range)"
    },
    {
      "name": "Hot band",
      "kind": "card",
      "lane": "hot",
      "stack": 0,
      "subtitle": "≥ 25°C (red · cooling)"
    },
    {
      "name": "◆ Current",
      "kind": "card",
      "lane": "comfort",
      "stack": 1,
      "subtitle": "temp = {temp}°C (default 24 → comfort)"
    }
  ],
  "flow": [],
  "states": { "temp": 24 },
  "animation": [
    { "step": "寒い帯", "duration": 1.2, "focus": ["Cold band"], "badge": "temp" },
    {
      "step": "暑い帯まで",
      "duration": 1.2,
      "focus": ["Cold band", "Comfort band"],
      "badge": "temp"
    },
    {
      "step": "いまの室温",
      "duration": 1.2,
      "focus": ["Cold band", "Comfort band", "Hot band", "◆ Current"],
      "badge": "temp",
      "body": "3-lane (Cold <15 / Comfort 15-25 / Hot ≥25) で room 温度を band 別分散、 current indicator (default 24 → comfort lane)、 slider 変化で thermometer readout 縦 bar + 球部 追随、 温度帯分類と thermometer 表示の 2 経路 view。"
    }
  ]
}`;

export const sourceYaml__shapeArcSweep = `title: "弧のゲージ角度を 4 段階で見せる"
type: flow

inputs:
  a: { kind: slider, min: 0, max: 270, defaultValue: 180, label: "Angle" }

lanes:
  min: { x: 0, width: 180 }
  quarter: { x: 205, width: 180 }
  half: { x: 410, width: 180 }
  interactive: { x: 615, width: 200 }

states:
  a: 180
  a0: 0
  a90: 90
  a180: 180

actors:
  - 0°: { kind: dyn-arc, lane: min, stack: 0, subtitle: "min", shape: { kind: arc, angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#a08870" }, posW: 180, posH: 180 }
  - 90°: { kind: dyn-arc, lane: quarter, stack: 0, subtitle: "quarter", shape: { kind: arc, angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" }, posW: 180, posH: 180 }
  - 180°: { kind: dyn-arc, lane: half, stack: 0, subtitle: "half", shape: { kind: arc, angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" }, posW: 180, posH: 180 }
  - Slider: { kind: dyn-arc, lane: interactive, stack: 0, subtitle: "{a}°", shape: { kind: arc, angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#8a5a2a" }, posW: 180, posH: 180 }

animation:
  - step: "0 度を見る" 1.6s
    focus: ["0°"]
    description: "針が振れていない状態。 ここが目盛りの始まりで、右へ行くほど弧が長くなる。"
  - step: "90 度と並べる" 1.6s
    focus: ["0°", "90°"]
    description: "4 分の 1 まで振れた状態を隣に置く。"
  - step: "180 度まで並べる" 1.6s
    focus: ["0°", "90°", "180°"]
    description: "半周まで並べる。 角度の差が弧の長さで分かる。"
  - step: "つまみで動かす" 1.6s
    focus: ["0°", "90°", "180°", "Slider"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeArcSweep = `{
  "title": "弧のゲージ角度を 4 段階で見せる",
  "type": "flow",
  "inputs": [
    { "id": "a", "kind": "slider", "min": 0, "max": 270, "defaultValue": 180, "label": "Angle" }
  ],
  "lanes": {
    "min": { "x": 0, "width": 180 },
    "quarter": { "x": 205, "width": 180 },
    "half": { "x": 410, "width": 180 },
    "interactive": { "x": 615, "width": 200 }
  },
  "actors": [
    {
      "name": "0°",
      "kind": "dyn-arc",
      "lane": "min",
      "stack": 0,
      "subtitle": "min",
      "shape": { "kind": "arc", "angle": "{a0}", "startAngle": -135, "sweepMax": 270, "fill": "#a08870" },
      "posW": 180,
      "posH": 180
    },
    {
      "name": "90°",
      "kind": "dyn-arc",
      "lane": "quarter",
      "stack": 0,
      "subtitle": "quarter",
      "shape": {
        "kind": "arc",
        "angle": "{a90}",
        "startAngle": -135,
        "sweepMax": 270,
        "fill": "#2563eb"
      },
      "posW": 180,
      "posH": 180
    },
    {
      "name": "180°",
      "kind": "dyn-arc",
      "lane": "half",
      "stack": 0,
      "subtitle": "half",
      "shape": {
        "kind": "arc",
        "angle": "{a180}",
        "startAngle": -135,
        "sweepMax": 270,
        "fill": "#f97316"
      },
      "posW": 180,
      "posH": 180
    },
    {
      "name": "Slider",
      "kind": "dyn-arc",
      "lane": "interactive",
      "stack": 0,
      "subtitle": "{a}°",
      "shape": { "kind": "arc", "angle": "{a}", "startAngle": -135, "sweepMax": 270, "fill": "#8a5a2a" },
      "posW": 180,
      "posH": 180
    }
  ],
  "flow": [],
  "states": { "a": 180, "a0": 0, "a90": 90, "a180": 180 },
  "animation": [
    {
      "step": "0 度を見る",
      "duration": 1.6,
      "focus": ["0°"],
      "body": "針が振れていない状態。 ここが目盛りの始まりで、右へ行くほど弧が長くなる。"
    },
    {
      "step": "90 度と並べる",
      "duration": 1.6,
      "focus": ["0°", "90°"],
      "body": "4 分の 1 まで振れた状態を隣に置く。"
    },
    {
      "step": "180 度まで並べる",
      "duration": 1.6,
      "focus": ["0°", "90°", "180°"],
      "body": "半周まで並べる。 角度の差が弧の長さで分かる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["0°", "90°", "180°", "Slider"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shapePolyRotate = `title: "多角形の角数を 3 / 6 / 8 で見せる"
type: flow

inputs:
  rot: { kind: slider, min: 0, max: 360, defaultValue: 0, label: "Rotation" }
  radius: { kind: slider, min: 20, max: 80, defaultValue: 60, label: "Radius" }

lanes:
  triangle: { x: 0, width: 180 }
  hexagon: { x: 200, width: 180 }
  octagon: { x: 400, width: 180 }
  interactive: { x: 600, width: 200 }

states:
  rot: 0
  radius: 60
  rot0: 0
  radius60: 60

actors:
  - polyTri: { kind: dyn-polygon, lane: triangle, stack: 0, subtitle: "sides=3", shape: { kind: polygon, sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#a08870" }, posW: 180, posH: 180, title: "Tri" }
  - polyHex: { kind: dyn-polygon, lane: hexagon, stack: 0, subtitle: "sides=6", shape: { kind: polygon, sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" }, posW: 180, posH: 180, title: "Hex" }
  - polyOct: { kind: dyn-polygon, lane: octagon, stack: 0, subtitle: "sides=8", shape: { kind: polygon, sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" }, posW: 180, posH: 180, title: "Oct" }
  - p: { kind: dyn-polygon, lane: interactive, stack: 0, subtitle: "{rot}° · r={radius}", shape: { kind: polygon, sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#8a5a2a" }, posW: 200, posH: 200, title: "Hexagon" }

animation:
  - step: "3 角を見る" 1.6s
    focus: ["polyTri"]
    description: "角が 3 つの状態。 これが最も少ない形で、角を増やすほど丸に近づいていく。"
  - step: "6 角と並べる" 1.6s
    focus: ["polyTri", "polyHex"]
    description: "角を 6 つにした形を隣に置く。 丸みが増す。"
  - step: "8 角まで並べる" 1.6s
    focus: ["polyTri", "polyHex", "polyOct"]
    description: "角を 8 つまで増やす。 角の数と丸みの関係が分かる。"
  - step: "つまみで動かす" 1.6s
    focus: ["polyTri", "polyHex", "polyOct", "p"]
    description: "右端はつまみで回転角と大きさを変えられる。 角の数は固定で、3 つの見本と見比べる。"
`;

export const sourceJson__shapePolyRotate = `{
  "title": "多角形の角数を 3 / 6 / 8 で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "rot",
      "kind": "slider",
      "min": 0,
      "max": 360,
      "defaultValue": 0,
      "label": "Rotation"
    },
    {
      "id": "radius",
      "kind": "slider",
      "min": 20,
      "max": 80,
      "defaultValue": 60,
      "label": "Radius"
    }
  ],
  "lanes": {
    "triangle": { "x": 0, "width": 180 },
    "hexagon": { "x": 200, "width": 180 },
    "octagon": { "x": 400, "width": 180 },
    "interactive": { "x": 600, "width": 200 }
  },
  "actors": [
    {
      "name": "polyTri",
      "kind": "dyn-polygon",
      "lane": "triangle",
      "stack": 0,
      "subtitle": "sides=3",
      "shape": {
        "kind": "polygon",
        "sides": 3,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#a08870"
      },
      "posW": 180,
      "posH": 180,
      "title": "Tri"
    },
    {
      "name": "polyHex",
      "kind": "dyn-polygon",
      "lane": "hexagon",
      "stack": 0,
      "subtitle": "sides=6",
      "shape": {
        "kind": "polygon",
        "sides": 6,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#2563eb"
      },
      "posW": 180,
      "posH": 180,
      "title": "Hex"
    },
    {
      "name": "polyOct",
      "kind": "dyn-polygon",
      "lane": "octagon",
      "stack": 0,
      "subtitle": "sides=8",
      "shape": {
        "kind": "polygon",
        "sides": 8,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#f97316"
      },
      "posW": 180,
      "posH": 180,
      "title": "Oct"
    },
    {
      "name": "p",
      "kind": "dyn-polygon",
      "lane": "interactive",
      "stack": 0,
      "subtitle": "{rot}° · r={radius}",
      "shape": {
        "kind": "polygon",
        "sides": 6,
        "radius": "{radius}",
        "rotation": "{rot}",
        "fill": "#8a5a2a"
      },
      "posW": 200,
      "posH": 200,
      "title": "Hexagon"
    }
  ],
  "flow": [],
  "states": { "rot": 0, "radius": 60, "rot0": 0, "radius60": 60 },
  "animation": [
    {
      "step": "3 角を見る",
      "duration": 1.6,
      "focus": ["polyTri"],
      "body": "角が 3 つの状態。 これが最も少ない形で、角を増やすほど丸に近づいていく。"
    },
    {
      "step": "6 角と並べる",
      "duration": 1.6,
      "focus": ["polyTri", "polyHex"],
      "body": "角を 6 つにした形を隣に置く。 丸みが増す。"
    },
    {
      "step": "8 角まで並べる",
      "duration": 1.6,
      "focus": ["polyTri", "polyHex", "polyOct"],
      "body": "角を 8 つまで増やす。 角の数と丸みの関係が分かる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["polyTri", "polyHex", "polyOct", "p"],
      "body": "右端はつまみで回転角と大きさを変えられる。 角の数は固定で、3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shapeRectFill = `title: "四角の塗り割合を 4 段階で見せる"
type: flow

inputs:
  v: { kind: slider, min: 0, max: 100, defaultValue: 40, label: "Value" }

lanes:
  low: { x: 0, width: 130 }
  mid: { x: 150, width: 130 }
  high: { x: 300, width: 130 }
  interactive: { x: 450, width: 160 }

states:
  v: 40
  low25: 25
  mid50: 50
  high75: 75

actors:
  - Low 25%: { kind: dyn-rect, lane: low, stack: 0, shape: { kind: rect, source: "{low25}", fillMax: 100, orient: "up", fill: "#a08870" }, posW: 100, posH: 240 }
  - Mid 50%: { kind: dyn-rect, lane: mid, stack: 0, shape: { kind: rect, source: "{mid50}", fillMax: 100, orient: "up", fill: "#2563eb" }, posW: 100, posH: 240 }
  - High 75%: { kind: dyn-rect, lane: high, stack: 0, shape: { kind: rect, source: "{high75}", fillMax: 100, orient: "up", fill: "#f97316" }, posW: 100, posH: 240 }
  - Slider ({v}%): { kind: dyn-rect, lane: interactive, stack: 0, shape: { kind: rect, source: "{v}", fillMax: 100, orient: "up", fill: "#8a5a2a" }, posW: 100, posH: 240 }

animation:
  - step: "25% を見る" 1.6s
    focus: ["Low 25%"]
    description: "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。"
  - step: "50% と並べる" 1.6s
    focus: ["Low 25%", "Mid 50%"]
    description: "半分の状態を隣に置く。 25% との差が高さで分かる。"
  - step: "75% まで並べる" 1.6s
    focus: ["Low 25%", "Mid 50%", "High 75%"]
    description: "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。"
  - step: "つまみで動かす" 1.6s
    focus: ["Low 25%", "Mid 50%", "High 75%", "Slider ({v}%)"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeRectFill = `{
  "title": "四角の塗り割合を 4 段階で見せる",
  "type": "flow",
  "inputs": [
    { "id": "v", "kind": "slider", "min": 0, "max": 100, "defaultValue": 40, "label": "Value" }
  ],
  "lanes": {
    "low": { "x": 0, "width": 130 },
    "mid": { "x": 150, "width": 130 },
    "high": { "x": 300, "width": 130 },
    "interactive": { "x": 450, "width": 160 }
  },
  "actors": [
    {
      "name": "Low 25%",
      "kind": "dyn-rect",
      "lane": "low",
      "stack": 0,
      "shape": { "kind": "rect", "source": "{low25}", "fillMax": 100, "orient": "up", "fill": "#a08870" },
      "posW": 100,
      "posH": 240
    },
    {
      "name": "Mid 50%",
      "kind": "dyn-rect",
      "lane": "mid",
      "stack": 0,
      "shape": { "kind": "rect", "source": "{mid50}", "fillMax": 100, "orient": "up", "fill": "#2563eb" },
      "posW": 100,
      "posH": 240
    },
    {
      "name": "High 75%",
      "kind": "dyn-rect",
      "lane": "high",
      "stack": 0,
      "shape": {
        "kind": "rect",
        "source": "{high75}",
        "fillMax": 100,
        "orient": "up",
        "fill": "#f97316"
      },
      "posW": 100,
      "posH": 240
    },
    {
      "name": "Slider ({v}%)",
      "kind": "dyn-rect",
      "lane": "interactive",
      "stack": 0,
      "shape": { "kind": "rect", "source": "{v}", "fillMax": 100, "orient": "up", "fill": "#8a5a2a" },
      "posW": 100,
      "posH": 240
    }
  ],
  "flow": [],
  "states": { "v": 40, "low25": 25, "mid50": 50, "high75": 75 },
  "animation": [
    {
      "step": "25% を見る",
      "duration": 1.6,
      "focus": ["Low 25%"],
      "body": "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。"
    },
    {
      "step": "50% と並べる",
      "duration": 1.6,
      "focus": ["Low 25%", "Mid 50%"],
      "body": "半分の状態を隣に置く。 25% との差が高さで分かる。"
    },
    {
      "step": "75% まで並べる",
      "duration": 1.6,
      "focus": ["Low 25%", "Mid 50%", "High 75%"],
      "body": "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["Low 25%", "Mid 50%", "High 75%", "Slider ({v}%)"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shapeWaveTank = `title: "波の水位を 4 段階で見せる"
type: flow

inputs:
  lvl: { kind: slider, min: 0, max: 100, defaultValue: 55, label: "Level" }

lanes:
  low: { x: 0, width: 160 }
  half: { x: 180, width: 160 }
  high: { x: 360, width: 160 }
  interactive: { x: 540, width: 180 }

states:
  lvl: 55
  lvl25: 25
  lvl50: 50
  lvl75: 75

actors:
  - wLow: { kind: dyn-wave, lane: low, stack: 0, subtitle: "25%", shape: { kind: wave, level: "{lvl25}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#a08870" }, posW: 140, posH: 220, title: "Low" }
  - wHalf: { kind: dyn-wave, lane: half, stack: 0, subtitle: "50%", shape: { kind: wave, level: "{lvl50}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#2563eb" }, posW: 140, posH: 220, title: "Half" }
  - wHigh: { kind: dyn-wave, lane: high, stack: 0, subtitle: "75%", shape: { kind: wave, level: "{lvl75}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#f97316" }, posW: 140, posH: 220, title: "High" }
  - w: { kind: dyn-wave, lane: interactive, stack: 0, subtitle: "{lvl}%", shape: { kind: wave, level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" }, posW: 140, posH: 220, title: "Wave" }

animation:
  - step: "25% を見る" 1.6s
    focus: ["wLow"]
    description: "水位が低い状態。 波の線が下の方にあり、上に空きが多く残っている。"
  - step: "50% と並べる" 1.6s
    focus: ["wLow", "wHalf"]
    description: "半分まで入った状態を隣に置く。 25% との差が、線の高さの違いとして読み取れる。"
  - step: "75% まで並べる" 1.6s
    focus: ["wLow", "wHalf", "wHigh"]
    description: "4 分の 3 まで並べる。 水位の差が線の高さで分かる。"
  - step: "つまみで動かす" 1.6s
    focus: ["wLow", "wHalf", "wHigh", "w"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeWaveTank = `{
  "title": "波の水位を 4 段階で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "lvl",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 55,
      "label": "Level"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 160 },
    "half": { "x": 180, "width": 160 },
    "high": { "x": 360, "width": 160 },
    "interactive": { "x": 540, "width": 180 }
  },
  "actors": [
    {
      "name": "wLow",
      "kind": "dyn-wave",
      "lane": "low",
      "stack": 0,
      "subtitle": "25%",
      "shape": {
        "kind": "wave",
        "level": "{lvl25}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 5,
        "fill": "#a08870"
      },
      "posW": 140,
      "posH": 220,
      "title": "Low"
    },
    {
      "name": "wHalf",
      "kind": "dyn-wave",
      "lane": "half",
      "stack": 0,
      "subtitle": "50%",
      "shape": {
        "kind": "wave",
        "level": "{lvl50}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 5,
        "fill": "#2563eb"
      },
      "posW": 140,
      "posH": 220,
      "title": "Half"
    },
    {
      "name": "wHigh",
      "kind": "dyn-wave",
      "lane": "high",
      "stack": 0,
      "subtitle": "75%",
      "shape": {
        "kind": "wave",
        "level": "{lvl75}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 5,
        "fill": "#f97316"
      },
      "posW": 140,
      "posH": 220,
      "title": "High"
    },
    {
      "name": "w",
      "kind": "dyn-wave",
      "lane": "interactive",
      "stack": 0,
      "subtitle": "{lvl}%",
      "shape": {
        "kind": "wave",
        "level": "{lvl}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 5,
        "fill": "#4e9dc4"
      },
      "posW": 140,
      "posH": 220,
      "title": "Wave"
    }
  ],
  "flow": [],
  "states": { "lvl": 55, "lvl25": 25, "lvl50": 50, "lvl75": 75 },
  "animation": [
    {
      "step": "25% を見る",
      "duration": 1.6,
      "focus": ["wLow"],
      "body": "水位が低い状態。 波の線が下の方にあり、上に空きが多く残っている。"
    },
    {
      "step": "50% と並べる",
      "duration": 1.6,
      "focus": ["wLow", "wHalf"],
      "body": "半分まで入った状態を隣に置く。 25% との差が、線の高さの違いとして読み取れる。"
    },
    {
      "step": "75% まで並べる",
      "duration": 1.6,
      "focus": ["wLow", "wHalf", "wHigh"],
      "body": "4 分の 3 まで並べる。 水位の差が線の高さで分かる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["wLow", "wHalf", "wHigh", "w"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shippingOrderStatus = `title: "配送状況を 4 段階で追う"
type: flow

inputs:
  current: { kind: stepper, min: 0, max: 3, defaultValue: 2, label: "Step" }

readouts:
  os: { kind: order-status, source: "current", stepsSource: "steps", color: "#2563eb", label: "Delivery status (icon strip)" }

lanes:
  col1: { x: 0, width: 340 }
  col2: { x: 380, width: 340 }

states:
  current: 2
  steps: '["Packed","Shipped","Out for delivery","Delivered"]'

actors:
  - 📦 Packed: { kind: card, lane: col1, stack: 0, subtitle: "梱包完了", posW: 250 }
  - 🚚 Shipped: { kind: card, lane: col2, stack: 0, subtitle: "配送開始", posW: 270 }
  - 🏠 Delivery: { kind: card, lane: col1, stack: 1, subtitle: "配達中 (現在地)", posW: 290 }
  - ✅ Delivered: { kind: card, lane: col2, stack: 1, subtitle: "配達完了", posW: 290 }

flow:
  - 📦 Packed -> 🚚 Shipped: "handover" (success)
  - 🚚 Shipped -> 🏠 Delivery: "in transit" (info)
  - 🏠 Delivery -> ✅ Delivered: "arrived" (warning)

animation:
  - step: "梱包と発送" 1.2s
    focus: ["📦 Packed"]
    badge: "tracking"
  - step: "配達中まで" 1.2s
    focus: ["📦 Packed", "🚚 Shipped"]
    badge: "tracking"
  - step: "配達完了" 1.2s
    focus: ["📦 Packed", "🚚 Shipped", "🏠 Delivery", "✅ Delivered"]
    badge: "tracking"
    description: "4 区画 pipeline (Packed / Shipped / Out for delivery / Delivered) を 2 列 2 段に置いて + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。"
`;

export const sourceJson__shippingOrderStatus = `{
  "title": "配送状況を 4 段階で追う",
  "type": "flow",
  "inputs": [
    {
      "id": "current",
      "kind": "stepper",
      "min": 0,
      "max": 3,
      "defaultValue": 2,
      "label": "Step"
    }
  ],
  "readouts": [
    {
      "id": "os",
      "kind": "order-status",
      "source": "current",
      "stepsSource": "steps",
      "color": "#2563eb",
      "label": "Delivery status (icon strip)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 340 },
    "col2": { "x": 380, "width": 340 }
  },
  "actors": [
    {
      "name": "📦 Packed",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "梱包完了",
      "posW": 250
    },
    {
      "name": "🚚 Shipped",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "配送開始",
      "posW": 270
    },
    {
      "name": "🏠 Delivery",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "配達中 (現在地)",
      "posW": 290
    },
    {
      "name": "✅ Delivered",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "配達完了",
      "posW": 290
    }
  ],
  "flow": [
    { "from": "📦 Packed", "to": "🚚 Shipped", "label": "handover", "tone": "success" },
    { "from": "🚚 Shipped", "to": "🏠 Delivery", "label": "in transit", "tone": "info" },
    { "from": "🏠 Delivery", "to": "✅ Delivered", "label": "arrived", "tone": "warning" }
  ],
  "states": { "current": 2, "steps": "[\\"Packed\\",\\"Shipped\\",\\"Out for delivery\\",\\"Delivered\\"]" },
  "animation": [
    { "step": "梱包と発送", "duration": 1.2, "focus": ["📦 Packed"], "badge": "tracking" },
    {
      "step": "配達中まで",
      "duration": 1.2,
      "focus": ["📦 Packed", "🚚 Shipped"],
      "badge": "tracking"
    },
    {
      "step": "配達完了",
      "duration": 1.2,
      "focus": ["📦 Packed", "🚚 Shipped", "🏠 Delivery", "✅ Delivered"],
      "badge": "tracking",
      "body": "4 区画 pipeline (Packed / Shipped / Out for delivery / Delivered) を 2 列 2 段に置いて + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。"
    }
  ]
}`;

export const sourceYaml__stepperControl = `title: "増減ボタンで棒と数値が動く"
type: flow

inputs:
  count: { kind: stepper, min: 0, max: 10, defaultValue: 3, label: "Count" }

readouts:
  countBar: { kind: bar, source: "count", min: 0, max: 10, label: "Progress bar" }
  countStat: { kind: stat, source: "count", unit: " items", label: "Total" }

lanes:
  ctrl: { x: 0, width: 200 }
  bar: { x: 240, width: 220 }
  stat: { x: 480, width: 200 }

states:
  count: 3

actors:
  - Stepper: { kind: card, lane: ctrl, stack: 0, subtitle: "count = {count} (0-10 range)" }
  - Bar visual: { kind: card, lane: bar, stack: 0, subtitle: "count 追随 progress bar (readout.bar)" }
  - Stat readout: { kind: card, lane: stat, stack: 0, subtitle: "count 追随 number + unit (readout.stat)" }

flow:
  - Stepper -> Bar visual: "→ bar" (info)
  - Stepper -> Stat readout: "→ stat" (success)

animation:
  - step: "3 個" 1.8s
    focus: ["Stepper"]
    description: "初期の 3 個。 棒の長さと数字が同じ値を見ている。"
  - step: "増やす" 1.8s
    focus: ["Stepper", "Bar visual"]
    description: "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。"
  - step: "読み取る" 1.8s
    focus: ["Stepper", "Bar visual", "Stat readout"]
    description: "右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。"
`;

export const sourceJson__stepperControl = `{
  "title": "増減ボタンで棒と数値が動く",
  "type": "flow",
  "inputs": [
    {
      "id": "count",
      "kind": "stepper",
      "min": 0,
      "max": 10,
      "defaultValue": 3,
      "label": "Count"
    }
  ],
  "readouts": [
    {
      "id": "countBar",
      "kind": "bar",
      "source": "count",
      "min": 0,
      "max": 10,
      "label": "Progress bar"
    },
    { "id": "countStat", "kind": "stat", "source": "count", "unit": " items", "label": "Total" }
  ],
  "lanes": {
    "ctrl": { "x": 0, "width": 200 },
    "bar": { "x": 240, "width": 220 },
    "stat": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "Stepper",
      "kind": "card",
      "lane": "ctrl",
      "stack": 0,
      "subtitle": "count = {count} (0-10 range)"
    },
    {
      "name": "Bar visual",
      "kind": "card",
      "lane": "bar",
      "stack": 0,
      "subtitle": "count 追随 progress bar (readout.bar)"
    },
    {
      "name": "Stat readout",
      "kind": "card",
      "lane": "stat",
      "stack": 0,
      "subtitle": "count 追随 number + unit (readout.stat)"
    }
  ],
  "flow": [
    { "from": "Stepper", "to": "Bar visual", "label": "→ bar", "tone": "info" },
    { "from": "Stepper", "to": "Stat readout", "label": "→ stat", "tone": "success" }
  ],
  "states": { "count": 3 },
  "animation": [
    {
      "step": "3 個",
      "duration": 1.8,
      "focus": ["Stepper"],
      "body": "初期の 3 個。 棒の長さと数字が同じ値を見ている。"
    },
    {
      "step": "増やす",
      "duration": 1.8,
      "focus": ["Stepper", "Bar visual"],
      "body": "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。"
    },
    {
      "step": "読み取る",
      "duration": 1.8,
      "focus": ["Stepper", "Bar visual", "Stat readout"],
      "body": "右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。"
    }
  ]
}`;

export const sourceYaml__userAvatar = `title: "名前からアイコン画像を組み立てる"
type: flow

inputs:
  user: { kind: text, defaultValue: "Alice Wonderland", placeholder: "Full name", maxLength: 40, label: "User name" }

readouts:
  av: { kind: avatar, source: "user", size: 56, color: "#2563eb", label: "Avatar (rendered)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  user: "Alice Wonderland"

actors:
  - Text input: { kind: card, lane: col1, stack: 0, subtitle: "user = {user}", posW: 270 }
  - Initials: { kind: card, lane: col2, stack: 0, subtitle: "first 2 word head chars (Alice Wonderland → AW)", posW: 320 }
  - Circle: { kind: card, lane: col1, stack: 1, subtitle: "size 56 · blue #2563eb + AW text", posW: 320 }

flow:
  - Text input -> Initials: "parse" (info)
  - Initials -> Circle: "render" (success)

animation:
  - step: "名前を受ける" 1.2s
    focus: ["Text input"]
    badge: "avatar"
  - step: "頭文字を取る" 1.2s
    focus: ["Text input", "Initials"]
    badge: "avatar"
  - step: "絵にする" 1.2s
    focus: ["Text input", "Initials", "Circle"]
    badge: "avatar"
    description: "3 区画 (Input name / Initials extract / Circle render) を 2 列 2 段に置いて avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。"
`;

export const sourceJson__userAvatar = `{
  "title": "名前からアイコン画像を組み立てる",
  "type": "flow",
  "inputs": [
    {
      "id": "user",
      "kind": "text",
      "defaultValue": "Alice Wonderland",
      "placeholder": "Full name",
      "maxLength": 40,
      "label": "User name"
    }
  ],
  "readouts": [
    {
      "id": "av",
      "kind": "avatar",
      "source": "user",
      "size": 56,
      "color": "#2563eb",
      "label": "Avatar (rendered)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "Text input",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "user = {user}",
      "posW": 270
    },
    {
      "name": "Initials",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "first 2 word head chars (Alice Wonderland → AW)",
      "posW": 320
    },
    {
      "name": "Circle",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "size 56 · blue #2563eb + AW text",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "Text input", "to": "Initials", "label": "parse", "tone": "info" },
    { "from": "Initials", "to": "Circle", "label": "render", "tone": "success" }
  ],
  "states": { "user": "Alice Wonderland" },
  "animation": [
    { "step": "名前を受ける", "duration": 1.2, "focus": ["Text input"], "badge": "avatar" },
    {
      "step": "頭文字を取る",
      "duration": 1.2,
      "focus": ["Text input", "Initials"],
      "badge": "avatar"
    },
    {
      "step": "絵にする",
      "duration": 1.2,
      "focus": ["Text input", "Initials", "Circle"],
      "badge": "avatar",
      "body": "3 区画 (Input name / Initials extract / Circle render) を 2 列 2 段に置いて avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。"
    }
  ]
}`;

export const sourceYaml__xypadNavigate = `title: "XY パッドの座標が 4 象限のどこかを示す"
type: flow

inputs:
  pos: { kind: xypad, xMin: 0, xMax: 100, yMin: 0, yMax: 100, defaultX: 50, defaultY: 50, label: "Position" }

readouts:
  posStat: { kind: stat, source: "pos", caption: "x,y in 0..100", label: "Selected" }

lanes:
  q2: { x: 0, width: 160 }
  q1: { x: 180, width: 160 }
  q3: { x: 360, width: 160 }
  q4: { x: 540, width: 160 }

states:
  pos: "50,50"

actors:
  - q2Node: { kind: card, lane: q2, stack: 0, subtitle: "upper-left", title: "Q2" }
  - q1Node: { kind: card, lane: q1, stack: 0, subtitle: "upper-right", title: "Q1" }
  - q3Node: { kind: card, lane: q3, stack: 0, subtitle: "lower-left", title: "Q3" }
  - q4Node: { kind: card, lane: q4, stack: 0, subtitle: "lower-right", title: "Q4" }
  - indicator: { kind: card, lane: q1, stack: 1, subtitle: "{pos} (default center → Q1 boundary)", title: "◆ Position" }

animation:
  - step: "左下の区画" 1.8s
    focus: ["q3Node", "indicator"]
    description: "4 つに区切った左下。 座標はつまみで決まり、入った区画の箱が光る。"
  - step: "右上の区画" 1.8s
    focus: ["q1Node", "indicator"]
    description: "右上の区画。 つまみを動かして境界をまたぐと、光る箱が入れ替わる。"
  - step: "4 区画を見る" 1.8s
    focus: ["q1Node", "q2Node", "q3Node", "q4Node", "indicator"]
    description: "4 つの区画が同じ大きさで並ぶ。 座標 1 組がどれか 1 つを指す。"
`;

export const sourceJson__xypadNavigate = `{
  "title": "XY パッドの座標が 4 象限のどこかを示す",
  "type": "flow",
  "inputs": [
    {
      "id": "pos",
      "kind": "xypad",
      "xMin": 0,
      "xMax": 100,
      "yMin": 0,
      "yMax": 100,
      "defaultX": 50,
      "defaultY": 50,
      "label": "Position"
    }
  ],
  "readouts": [
    {
      "id": "posStat",
      "kind": "stat",
      "source": "pos",
      "caption": "x,y in 0..100",
      "label": "Selected"
    }
  ],
  "lanes": {
    "q2": { "x": 0, "width": 160 },
    "q1": { "x": 180, "width": 160 },
    "q3": { "x": 360, "width": 160 },
    "q4": { "x": 540, "width": 160 }
  },
  "actors": [
    {
      "name": "q2Node",
      "kind": "card",
      "lane": "q2",
      "stack": 0,
      "subtitle": "upper-left",
      "title": "Q2"
    },
    {
      "name": "q1Node",
      "kind": "card",
      "lane": "q1",
      "stack": 0,
      "subtitle": "upper-right",
      "title": "Q1"
    },
    {
      "name": "q3Node",
      "kind": "card",
      "lane": "q3",
      "stack": 0,
      "subtitle": "lower-left",
      "title": "Q3"
    },
    {
      "name": "q4Node",
      "kind": "card",
      "lane": "q4",
      "stack": 0,
      "subtitle": "lower-right",
      "title": "Q4"
    },
    {
      "name": "indicator",
      "kind": "card",
      "lane": "q1",
      "stack": 1,
      "subtitle": "{pos} (default center → Q1 boundary)",
      "title": "◆ Position"
    }
  ],
  "flow": [],
  "states": { "pos": "50,50" },
  "animation": [
    {
      "step": "左下の区画",
      "duration": 1.8,
      "focus": ["q3Node", "indicator"],
      "body": "4 つに区切った左下。 座標はつまみで決まり、入った区画の箱が光る。"
    },
    {
      "step": "右上の区画",
      "duration": 1.8,
      "focus": ["q1Node", "indicator"],
      "body": "右上の区画。 つまみを動かして境界をまたぐと、光る箱が入れ替わる。"
    },
    {
      "step": "4 区画を見る",
      "duration": 1.8,
      "focus": ["q1Node", "q2Node", "q3Node", "q4Node", "indicator"],
      "body": "4 つの区画が同じ大きさで並ぶ。 座標 1 組がどれか 1 つを指す。"
    }
  ]
}`;

export const sourceYaml__renderOffsetDrift = `title: "固定点に対して浮遊点がずれて動く"
type: flow

inputs:
  dx: { kind: slider, min: -80, max: 80, defaultValue: 0, label: "Drift X" }
  dy: { kind: slider, min: -40, max: 40, defaultValue: 0, label: "Drift Y" }

lanes:
  anchor-lane: { x: 0, width: 240 }
  floater-lane: { x: 300, width: 300 }

states:
  dx: 0
  dy: 0

actors:
  - Anchor: { kind: card, lane: anchor-lane, stack: 0, subtitle: "固定位置、 signal bind なし" }
  - Floater: { kind: card, lane: floater-lane, stack: 0, subtitle: "dx={dx} · dy={dy}", renderOffsetX: "{dx}", renderOffsetY: "{dy}" }

animation:
  - step: "基準を置く" 1.6s
    focus: ["Anchor"]
    description: "動かない点を先に置く。 ここが位置の基準になる。"
  - step: "ずれを見る" 1.6s
    focus: ["Anchor", "Floater"]
    description: "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。"
  - step: "つまみで動かす" 1.6s
    focus: ["Floater"]
    description: "つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。"
`;

export const sourceJson__renderOffsetDrift = `{
  "title": "固定点に対して浮遊点がずれて動く",
  "type": "flow",
  "inputs": [
    {
      "id": "dx",
      "kind": "slider",
      "min": -80,
      "max": 80,
      "defaultValue": 0,
      "label": "Drift X"
    },
    {
      "id": "dy",
      "kind": "slider",
      "min": -40,
      "max": 40,
      "defaultValue": 0,
      "label": "Drift Y"
    }
  ],
  "lanes": {
    "anchor-lane": { "x": 0, "width": 240 },
    "floater-lane": { "x": 300, "width": 300 }
  },
  "actors": [
    {
      "name": "Anchor",
      "kind": "card",
      "lane": "anchor-lane",
      "stack": 0,
      "subtitle": "固定位置、 signal bind なし"
    },
    {
      "name": "Floater",
      "kind": "card",
      "lane": "floater-lane",
      "stack": 0,
      "subtitle": "dx={dx} · dy={dy}",
      "renderOffsetX": "{dx}",
      "renderOffsetY": "{dy}"
    }
  ],
  "flow": [],
  "states": { "dx": 0, "dy": 0 },
  "animation": [
    {
      "step": "基準を置く",
      "duration": 1.6,
      "focus": ["Anchor"],
      "body": "動かない点を先に置く。 ここが位置の基準になる。"
    },
    {
      "step": "ずれを見る",
      "duration": 1.6,
      "focus": ["Anchor", "Floater"],
      "body": "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["Floater"],
      "body": "つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。"
    }
  ]
}`;

export const sourceYaml__visualBindBar = `title: "信号の値が棒の実際の幅に反映される"
type: flow

inputs:
  barW: { kind: slider, min: 40, max: 320, defaultValue: 160, label: "Bar width" }

readouts:
  barMon: { kind: bar, source: "barW", min: 40, max: 320, label: "Width readout" }

lanes:
  signal: { x: 0, width: 200 }
  bar-lane: { x: 240, width: 340 }
  readout: { x: 600, width: 220 }

states:
  barW: 160

actors:
  - signalNode: { kind: card, lane: signal, stack: 0, subtitle: "barW = {barW}", title: "Signal" }
  - bar: { kind: card, lane: bar-lane, stack: 0, subtitle: "wBind = {barW}px", wBind: "{barW}", posW: 160, title: "Bar" }
  - readoutNode: { kind: card, lane: readout, stack: 0, subtitle: "readout.bar が signal を同時追随", title: "Bar readout" }

flow:
  - signalNode -> bar: "wBind" (info)
  - signalNode -> readoutNode: "readout" (success)

animation:
  - step: "信号を見る" 1.8s
    focus: ["signalNode"]
    description: "左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。"
  - step: "棒に届く" 1.8s
    focus: ["signalNode", "bar"]
    description: "信号が棒の幅として束ねられている。 つまみを動かすとこの棒が追いかける。"
  - step: "数でも読む" 1.8s
    focus: ["signalNode", "bar", "readoutNode"]
    description: "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。"
`;

export const sourceJson__visualBindBar = `{
  "title": "信号の値が棒の実際の幅に反映される",
  "type": "flow",
  "inputs": [
    {
      "id": "barW",
      "kind": "slider",
      "min": 40,
      "max": 320,
      "defaultValue": 160,
      "label": "Bar width"
    }
  ],
  "readouts": [
    {
      "id": "barMon",
      "kind": "bar",
      "source": "barW",
      "min": 40,
      "max": 320,
      "label": "Width readout"
    }
  ],
  "lanes": {
    "signal": { "x": 0, "width": 200 },
    "bar-lane": { "x": 240, "width": 340 },
    "readout": { "x": 600, "width": 220 }
  },
  "actors": [
    {
      "name": "signalNode",
      "kind": "card",
      "lane": "signal",
      "stack": 0,
      "subtitle": "barW = {barW}",
      "title": "Signal"
    },
    {
      "name": "bar",
      "kind": "card",
      "lane": "bar-lane",
      "stack": 0,
      "subtitle": "wBind = {barW}px",
      "wBind": "{barW}",
      "posW": 160,
      "title": "Bar"
    },
    {
      "name": "readoutNode",
      "kind": "card",
      "lane": "readout",
      "stack": 0,
      "subtitle": "readout.bar が signal を同時追随",
      "title": "Bar readout"
    }
  ],
  "flow": [
    { "from": "signalNode", "to": "bar", "label": "wBind", "tone": "info" },
    { "from": "signalNode", "to": "readoutNode", "label": "readout", "tone": "success" }
  ],
  "states": { "barW": 160 },
  "animation": [
    {
      "step": "信号を見る",
      "duration": 1.8,
      "focus": ["signalNode"],
      "body": "左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。"
    },
    {
      "step": "棒に届く",
      "duration": 1.8,
      "focus": ["signalNode", "bar"],
      "body": "信号が棒の幅として束ねられている。 つまみを動かすとこの棒が追いかける。"
    },
    {
      "step": "数でも読む",
      "duration": 1.8,
      "focus": ["signalNode", "bar", "readoutNode"],
      "body": "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。"
    }
  ]
}`;

export const sourceYaml__eip1559GasFlow = `title: "EIP-1559 の手数料が 3 ブロックで変わる"
type: flow

inputs:
  baseFee: { kind: slider, min: 10, max: 200, defaultValue: 50, label: "Base fee (gwei)" }
  priority: { kind: slider, min: 1, max: 30, defaultValue: 5, label: "Priority tip" }

readouts:
  gas: { kind: stacked-bar, sourceA: "burned", sourceB: "tips", min: 0, max: 120, colorA: "#ef4444", colorB: "#22c55e", label: "Burned / Tip per block" }

formulas:
  total1: "baseFee + priority"
  total2: "(baseFee + priority) * 12 / 10"
  total3: "(baseFee + priority) * 15 / 10"

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 300 }

states:
  baseFee: 50
  priority: 5
  burned: "[50,60,72]"
  tips: "[5,8,10]"
  total1: 55
  total2: 66
  total3: 82

actors:
  - Wallet: { kind: card, lane: col1, stack: 0, subtitle: "base {baseFee} + tip {priority} gwei", posW: 320 }
  - Block N: { kind: card, lane: col1, stack: 1, subtitle: "1.0x = {total1} gwei", posW: 240 }
  - Block N+1: { kind: card, lane: col2, stack: 0, subtitle: "1.2x = {total2} gwei", posW: 250 }
  - Block N+2: { kind: card, lane: col2, stack: 1, subtitle: "1.5x = {total3} gwei", posW: 250 }

flow:
  - Wallet -> Block N: "tx submit" (info) { sub: "base + tip" }
  - Block N -> Block N+1: "next block" (warning) { sub: "+20% fee" }
  - Block N+1 -> Block N+2: "next block" (error) { sub: "+25% fee" }

animation:
  - step: "1 ブロック目" 1.8s
    focus: ["Wallet", "Block N"]
    set:
      burned: "[50,0,0]"
      tips: "[5,0,0]"
    description: "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。"
  - step: "2 ブロック目" 1.8s
    focus: ["Wallet", "Block N", "Block N+1"]
    set:
      burned: "[50,60,0]"
      tips: "[5,8,0]"
    description: "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。"
  - step: "3 ブロック目" 1.8s
    focus: ["Wallet", "Block N", "Block N+1", "Block N+2"]
    set:
      burned: "[50,60,72]"
      tips: "[5,8,10]"
    description: "さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。"
`;

export const sourceJson__eip1559GasFlow = `{
  "title": "EIP-1559 の手数料が 3 ブロックで変わる",
  "type": "flow",
  "inputs": [
    {
      "id": "baseFee",
      "kind": "slider",
      "min": 10,
      "max": 200,
      "defaultValue": 50,
      "label": "Base fee (gwei)"
    },
    {
      "id": "priority",
      "kind": "slider",
      "min": 1,
      "max": 30,
      "defaultValue": 5,
      "label": "Priority tip"
    }
  ],
  "readouts": [
    {
      "id": "gas",
      "kind": "stacked-bar",
      "sourceA": "burned",
      "sourceB": "tips",
      "min": 0,
      "max": 120,
      "colorA": "#ef4444",
      "colorB": "#22c55e",
      "label": "Burned / Tip per block"
    }
  ],
  "formulas": {
    "total1": "baseFee + priority",
    "total2": "(baseFee + priority) * 12 / 10",
    "total3": "(baseFee + priority) * 15 / 10"
  },
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 300 }
  },
  "actors": [
    {
      "name": "Wallet",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "base {baseFee} + tip {priority} gwei",
      "posW": 320
    },
    {
      "name": "Block N",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "1.0x = {total1} gwei",
      "posW": 240
    },
    {
      "name": "Block N+1",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "1.2x = {total2} gwei",
      "posW": 250
    },
    {
      "name": "Block N+2",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "1.5x = {total3} gwei",
      "posW": 250
    }
  ],
  "flow": [
    {
      "from": "Wallet",
      "to": "Block N",
      "label": "tx submit",
      "sub": "base + tip",
      "tone": "info"
    },
    {
      "from": "Block N",
      "to": "Block N+1",
      "label": "next block",
      "sub": "+20% fee",
      "tone": "warning"
    },
    {
      "from": "Block N+1",
      "to": "Block N+2",
      "label": "next block",
      "sub": "+25% fee",
      "tone": "error"
    }
  ],
  "states": {
    "baseFee": 50,
    "priority": 5,
    "burned": "[50,60,72]",
    "tips": "[5,8,10]",
    "total1": 55,
    "total2": 66,
    "total3": 82
  },
  "animation": [
    {
      "step": "1 ブロック目",
      "duration": 1.8,
      "focus": ["Wallet", "Block N"],
      "set": { "burned": "[50,0,0]", "tips": "[5,0,0]" },
      "body": "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。"
    },
    {
      "step": "2 ブロック目",
      "duration": 1.8,
      "focus": ["Wallet", "Block N", "Block N+1"],
      "set": { "burned": "[50,60,0]", "tips": "[5,8,0]" },
      "body": "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。"
    },
    {
      "step": "3 ブロック目",
      "duration": 1.8,
      "focus": ["Wallet", "Block N", "Block N+1", "Block N+2"],
      "set": { "burned": "[50,60,72]", "tips": "[5,8,10]" },
      "body": "さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。"
    }
  ]
}`;

export const sourceYaml__formulaTextBind = `title: "入力値から 2 倍と半分を自動計算する"
type: flow

inputs:
  input: { kind: number, defaultValue: 10, label: "Input" }

formulas:
  doubled: "input * 2"
  halved: "input / 2"

lanes:
  input: { x: 0, width: 200 }
  doubled: { x: 240, width: 200 }
  halved: { x: 480, width: 200 }

states:
  input: 10
  doubled: 20
  halved: 5

actors:
  - in: { kind: card, lane: input, stack: 0, subtitle: "value = {input}", title: "Input" }
  - out1: { kind: card, lane: doubled, stack: 0, subtitle: "input * 2 = {doubled}", title: "Doubled" }
  - out2: { kind: card, lane: halved, stack: 0, subtitle: "input / 2 = {halved}", title: "Halved" }

flow:
  - in -> out1: "× 2" (success)
  - in -> out2: "÷ 2" (info)

animation:
  - step: "元の値を置く" 1.6s
    focus: ["in"]
    description: "左の箱に入力値を置く。 まだ計算式は動いていない。"
  - step: "2 倍を出す" 1.6s
    focus: ["in", "out1"]
    description: "1 つ目の計算式が元の値を 2 倍にして、右上の箱に書き出す。 元の値を変えると追いかける。"
  - step: "半分も出す" 1.6s
    focus: ["in", "out1", "out2"]
    description: "2 つ目の計算式が同じ元の値を半分にする。 元が 1 つ、そこから出る値が 2 つ。"
`;

export const sourceJson__formulaTextBind = `{
  "title": "入力値から 2 倍と半分を自動計算する",
  "type": "flow",
  "inputs": [
    { "id": "input", "kind": "number", "defaultValue": 10, "label": "Input" }
  ],
  "formulas": { "doubled": "input * 2", "halved": "input / 2" },
  "lanes": {
    "input": { "x": 0, "width": 200 },
    "doubled": { "x": 240, "width": 200 },
    "halved": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "in",
      "kind": "card",
      "lane": "input",
      "stack": 0,
      "subtitle": "value = {input}",
      "title": "Input"
    },
    {
      "name": "out1",
      "kind": "card",
      "lane": "doubled",
      "stack": 0,
      "subtitle": "input * 2 = {doubled}",
      "title": "Doubled"
    },
    {
      "name": "out2",
      "kind": "card",
      "lane": "halved",
      "stack": 0,
      "subtitle": "input / 2 = {halved}",
      "title": "Halved"
    }
  ],
  "flow": [
    { "from": "in", "to": "out1", "label": "× 2", "tone": "success" },
    { "from": "in", "to": "out2", "label": "÷ 2", "tone": "info" }
  ],
  "states": { "input": 10, "doubled": 20, "halved": 5 },
  "animation": [
    { "step": "元の値を置く", "duration": 1.6, "focus": ["in"], "body": "左の箱に入力値を置く。 まだ計算式は動いていない。" },
    {
      "step": "2 倍を出す",
      "duration": 1.6,
      "focus": ["in", "out1"],
      "body": "1 つ目の計算式が元の値を 2 倍にして、右上の箱に書き出す。 元の値を変えると追いかける。"
    },
    {
      "step": "半分も出す",
      "duration": 1.6,
      "focus": ["in", "out1", "out2"],
      "body": "2 つ目の計算式が同じ元の値を半分にする。 元が 1 つ、そこから出る値が 2 つ。"
    }
  ]
}`;

export const sourceYaml__kpiDashboard = `title: "SaaS の主要指標 4 つを 1 画面に並べる"
type: flow

inputs:
  revenueInput: { kind: slider, min: 10, max: 500, defaultValue: 120, label: "Revenue (k)" }

readouts:
  rev: { kind: stat, source: "revenueInput", unit: "k", label: "Revenue" }
  usr: { kind: stat, source: "users", label: "Users" }
  chr: { kind: gauge, source: "churn", min: 0, max: 60, color: "#ef4444", label: "Churn %" }
  np: { kind: percent-ring, source: "nps", max: 100, color: "#22c55e", label: "NPS" }

formulas:
  users: "revenueInput * 8"
  churn: "50 - revenueInput / 10"
  nps: "revenueInput / 2 + 20"

lanes:
  revenue: { x: 0, width: 200 }
  users: { x: 260, width: 200 }
  churn: { x: 520, width: 200 }
  nps: { x: 780, width: 200 }

states:
  revenueInput: 120
  users: 960
  churn: 38
  nps: 80

actors:
  - revCard: { kind: card, lane: revenue, stack: 0, subtitle: "\${revenueInput}k / month", title: "Revenue" }
  - usersCard: { kind: card, lane: users, stack: 0, subtitle: "{users} active", title: "Users" }
  - churnCard: { kind: card, lane: churn, stack: 0, subtitle: "{churn}% / month", title: "Churn" }
  - npsCard: { kind: card, lane: nps, stack: 0, subtitle: "{nps} score", title: "NPS" }

flow:
  - revCard -> usersCard: "×8" (info) { sub: "acquisition" }
  - revCard -> churnCard: "inverse" (error) { sub: "50 − rev/10" }
  - revCard -> npsCard: "correlate" (success) { sub: "rev/2 + 20", side: "bottom" }

animation:
  - step: "利用者を見る" 1.8s
    focus: ["usersCard"]
    description: "売上のつまみから計算式で利用者数を導く。 4 指標のうち 1 つ目。"
  - step: "解約率も導く" 1.8s
    focus: ["usersCard", "churnCard"]
    description: "同じ元の値から解約率を導く。 売上を動かすと 2 つが同時に変わる。"
  - step: "4 指標が揃う" 1.8s
    focus: ["revCard", "usersCard", "churnCard", "npsCard"]
    description: "推奨度まで並ぶ。 つまみが持つ 1 指標と、そこから導く 3 指標の組になっている。"
`;

export const sourceJson__kpiDashboard = `{
  "title": "SaaS の主要指標 4 つを 1 画面に並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "revenueInput",
      "kind": "slider",
      "min": 10,
      "max": 500,
      "defaultValue": 120,
      "label": "Revenue (k)"
    }
  ],
  "readouts": [
    { "id": "rev", "kind": "stat", "source": "revenueInput", "unit": "k", "label": "Revenue" },
    { "id": "usr", "kind": "stat", "source": "users", "label": "Users" },
    {
      "id": "chr",
      "kind": "gauge",
      "source": "churn",
      "min": 0,
      "max": 60,
      "color": "#ef4444",
      "label": "Churn %"
    },
    {
      "id": "np",
      "kind": "percent-ring",
      "source": "nps",
      "max": 100,
      "color": "#22c55e",
      "label": "NPS"
    }
  ],
  "formulas": {
    "users": "revenueInput * 8",
    "churn": "50 - revenueInput / 10",
    "nps": "revenueInput / 2 + 20"
  },
  "lanes": {
    "revenue": { "x": 0, "width": 200 },
    "users": { "x": 260, "width": 200 },
    "churn": { "x": 520, "width": 200 },
    "nps": { "x": 780, "width": 200 }
  },
  "actors": [
    {
      "name": "revCard",
      "kind": "card",
      "lane": "revenue",
      "stack": 0,
      "subtitle": "\${revenueInput}k / month",
      "title": "Revenue"
    },
    {
      "name": "usersCard",
      "kind": "card",
      "lane": "users",
      "stack": 0,
      "subtitle": "{users} active",
      "title": "Users"
    },
    {
      "name": "churnCard",
      "kind": "card",
      "lane": "churn",
      "stack": 0,
      "subtitle": "{churn}% / month",
      "title": "Churn"
    },
    {
      "name": "npsCard",
      "kind": "card",
      "lane": "nps",
      "stack": 0,
      "subtitle": "{nps} score",
      "title": "NPS"
    }
  ],
  "flow": [
    {
      "from": "revCard",
      "to": "usersCard",
      "label": "×8",
      "sub": "acquisition",
      "tone": "info"
    },
    {
      "from": "revCard",
      "to": "churnCard",
      "label": "inverse",
      "sub": "50 − rev/10",
      "tone": "error"
    },
    {
      "from": "revCard",
      "to": "npsCard",
      "label": "correlate",
      "sub": "rev/2 + 20",
      "tone": "success",
      "side": "bottom"
    }
  ],
  "states": { "revenueInput": 120, "users": 960, "churn": 38, "nps": 80 },
  "animation": [
    {
      "step": "利用者を見る",
      "duration": 1.8,
      "focus": ["usersCard"],
      "body": "売上のつまみから計算式で利用者数を導く。 4 指標のうち 1 つ目。"
    },
    {
      "step": "解約率も導く",
      "duration": 1.8,
      "focus": ["usersCard", "churnCard"],
      "body": "同じ元の値から解約率を導く。 売上を動かすと 2 つが同時に変わる。"
    },
    {
      "step": "4 指標が揃う",
      "duration": 1.8,
      "focus": ["revCard", "usersCard", "churnCard", "npsCard"],
      "body": "推奨度まで並ぶ。 つまみが持つ 1 指標と、そこから導く 3 指標の組になっている。"
    }
  ]
}`;

export const sourceYaml__pathProgressDemo = `title: "経路の進捗と完了状態を連動させる"
type: flow

inputs:
  progress: { kind: slider, min: 0, max: 100, defaultValue: 40, label: "Progress" }

readouts:
  pp: { kind: path-progress, source: "progress", pathD: "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10", viewW: 270, viewH: 40, strokeWidth: 5, color: "#22c55e", max: 100, label: "Path (zigzag)" }
  ring: { kind: percent-ring, source: "progress", max: 100, color: "#22c55e", label: "Ring" }

formulas:
  done: "progress >= 100 ? 1 : 0"

lanes:
  state: { x: 0, width: 200 }
  visual: { x: 240, width: 300 }
  done: { x: 560, width: 200 }

states:
  progress: 40
  done: 0

actors:
  - main: { kind: card, lane: state, stack: 0, subtitle: "{progress}% complete", title: "Task state" }
  - pathNode: { kind: card, lane: visual, stack: 0, subtitle: "SVG stroke-dashoffset で進行", title: "Path visual" }
  - ringNode: { kind: card, lane: visual, stack: 1, subtitle: "同時追随", title: "Percent ring" }
  - ok: { kind: card, lane: done, stack: 0, subtitle: "progress=100% で visibleIf 発動", visibleIf: "{done}", title: "✓ Done" }

animation:
  - step: "元の値を見る" 1.8s
    focus: ["main"]
    description: "進捗の値をつまみが持つ。 この 1 つの値から 2 つの表示を作る。"
  - step: "経路と円に届く" 1.8s
    focus: ["main", "pathNode", "ringNode"]
    description: "同じ進捗が経路の塗りと円の角度になる。 つまみを動かすと両方が動く。"
  - step: "完了の印" 1.8s
    focus: ["main", "pathNode", "ringNode", "ok"]
    description: "進捗が満ちた時だけ出る印。 条件付きの表示で、満たない間は隠れている。"
`;

export const sourceJson__pathProgressDemo = `{
  "title": "経路の進捗と完了状態を連動させる",
  "type": "flow",
  "inputs": [
    {
      "id": "progress",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 40,
      "label": "Progress"
    }
  ],
  "readouts": [
    {
      "id": "pp",
      "kind": "path-progress",
      "source": "progress",
      "pathD": "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10",
      "viewW": 270,
      "viewH": 40,
      "strokeWidth": 5,
      "color": "#22c55e",
      "max": 100,
      "label": "Path (zigzag)"
    },
    {
      "id": "ring",
      "kind": "percent-ring",
      "source": "progress",
      "max": 100,
      "color": "#22c55e",
      "label": "Ring"
    }
  ],
  "formulas": { "done": "progress >= 100 ? 1 : 0" },
  "lanes": {
    "state": { "x": 0, "width": 200 },
    "visual": { "x": 240, "width": 300 },
    "done": { "x": 560, "width": 200 }
  },
  "actors": [
    {
      "name": "main",
      "kind": "card",
      "lane": "state",
      "stack": 0,
      "subtitle": "{progress}% complete",
      "title": "Task state"
    },
    {
      "name": "pathNode",
      "kind": "card",
      "lane": "visual",
      "stack": 0,
      "subtitle": "SVG stroke-dashoffset で進行",
      "title": "Path visual"
    },
    {
      "name": "ringNode",
      "kind": "card",
      "lane": "visual",
      "stack": 1,
      "subtitle": "同時追随",
      "title": "Percent ring"
    },
    {
      "name": "ok",
      "kind": "card",
      "lane": "done",
      "stack": 0,
      "subtitle": "progress=100% で visibleIf 発動",
      "visibleIf": "{done}",
      "title": "✓ Done"
    }
  ],
  "flow": [],
  "states": { "progress": 40, "done": 0 },
  "animation": [
    {
      "step": "元の値を見る",
      "duration": 1.8,
      "focus": ["main"],
      "body": "進捗の値をつまみが持つ。 この 1 つの値から 2 つの表示を作る。"
    },
    {
      "step": "経路と円に届く",
      "duration": 1.8,
      "focus": ["main", "pathNode", "ringNode"],
      "body": "同じ進捗が経路の塗りと円の角度になる。 つまみを動かすと両方が動く。"
    },
    {
      "step": "完了の印",
      "duration": 1.8,
      "focus": ["main", "pathNode", "ringNode", "ok"],
      "body": "進捗が満ちた時だけ出る印。 条件付きの表示で、満たない間は隠れている。"
    }
  ]
}`;

export const sourceYaml__repeatDeriveChain = `title: "repeatNodes + deriveChain で N 個の rect を宣言的に生成、 前値連鎖で伝搬"
type: flow

inputs:
  base: { kind: slider, min: 0, max: 60, defaultValue: 20, label: "Base" }

formulas:
  gas1: "base"
  gas2: "gas1 * 1.2"
  gas3: "gas2 * 1.2"
  gas4: "gas3 * 1.2"
  gas5: "gas4 * 1.2"

lanes:
  l1: { x: 0, width: 100 }
  l2: { x: 120, width: 100 }
  l3: { x: 240, width: 100 }
  l4: { x: 360, width: 100 }
  l5: { x: 480, width: 100 }

states:
  base: 20
  gas1: 20
  gas2: 24
  gas3: 28.8
  gas4: 34.56
  gas5: 41.472

actors:
  - Block 1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "gas: {gas1}", shape: { kind: rect, source: "{gas1}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - Block 2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "gas: {gas2}", shape: { kind: rect, source: "{gas2}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - Block 3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "gas: {gas3}", shape: { kind: rect, source: "{gas3}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - Block 4: { kind: dyn-rect, lane: l4, stack: 0, subtitle: "gas: {gas4}", shape: { kind: rect, source: "{gas4}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - Block 5: { kind: dyn-rect, lane: l5, stack: 0, subtitle: "gas: {gas5}", shape: { kind: rect, source: "{gas5}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }

animation:
  - step: "起点を置く" 1.6s
    focus: ["Block 1"]
    description: "元の値が 1 つ目の四角に入る。 ここが連なりの起点。"
  - step: "2 つ目まで伝わる" 1.6s
    focus: ["Block 1", "Block 2"]
    description: "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。"
  - step: "4 つ目まで伝わる" 1.6s
    focus: ["Block 1", "Block 2", "Block 3", "Block 4"]
    description: "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。"
  - step: "端まで届く" 1.6s
    focus: ["Block 1", "Block 2", "Block 3", "Block 4", "Block 5"]
    description: "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。"
`;

export const sourceJson__repeatDeriveChain = `{
  "title": "repeatNodes + deriveChain で N 個の rect を宣言的に生成、 前値連鎖で伝搬",
  "type": "flow",
  "inputs": [
    { "id": "base", "kind": "slider", "min": 0, "max": 60, "defaultValue": 20, "label": "Base" }
  ],
  "formulas": {
    "gas1": "base",
    "gas2": "gas1 * 1.2",
    "gas3": "gas2 * 1.2",
    "gas4": "gas3 * 1.2",
    "gas5": "gas4 * 1.2"
  },
  "lanes": {
    "l1": { "x": 0, "width": 100 },
    "l2": { "x": 120, "width": 100 },
    "l3": { "x": 240, "width": 100 },
    "l4": { "x": 360, "width": 100 },
    "l5": { "x": 480, "width": 100 }
  },
  "actors": [
    {
      "name": "Block 1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "gas: {gas1}",
      "shape": { "kind": "rect", "source": "{gas1}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "Block 2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "gas: {gas2}",
      "shape": { "kind": "rect", "source": "{gas2}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "Block 3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "gas: {gas3}",
      "shape": { "kind": "rect", "source": "{gas3}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "Block 4",
      "kind": "dyn-rect",
      "lane": "l4",
      "stack": 0,
      "subtitle": "gas: {gas4}",
      "shape": { "kind": "rect", "source": "{gas4}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "Block 5",
      "kind": "dyn-rect",
      "lane": "l5",
      "stack": 0,
      "subtitle": "gas: {gas5}",
      "shape": { "kind": "rect", "source": "{gas5}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    }
  ],
  "flow": [],
  "states": { "base": 20, "gas1": 20, "gas2": 24, "gas3": 28.8, "gas4": 34.56, "gas5": 41.472 },
  "animation": [
    {
      "step": "起点を置く",
      "duration": 1.6,
      "focus": ["Block 1"],
      "body": "元の値が 1 つ目の四角に入る。 ここが連なりの起点。"
    },
    {
      "step": "2 つ目まで伝わる",
      "duration": 1.6,
      "focus": ["Block 1", "Block 2"],
      "body": "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。"
    },
    {
      "step": "4 つ目まで伝わる",
      "duration": 1.6,
      "focus": ["Block 1", "Block 2", "Block 3", "Block 4"],
      "body": "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。"
    },
    {
      "step": "端まで届く",
      "duration": 1.6,
      "focus": ["Block 1", "Block 2", "Block 3", "Block 4", "Block 5"],
      "body": "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。"
    }
  ]
}`;

export const sourceYaml__shapeChainFill = `title: "3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化"
type: flow

inputs:
  base: { kind: slider, min: 0, max: 100, defaultValue: 30, label: "Base" }

formulas:
  gas1: "base"
  gas2: "base * 1.2"
  gas3: "base * 1.5"

lanes:
  l1: { x: 0, width: 130 }
  l2: { x: 150, width: 130 }
  l3: { x: 300, width: 130 }

states:
  base: 30
  gas1: 30
  gas2: 36
  gas3: 45

actors:
  - Block 1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "gas: {gas1}", shape: { kind: rect, source: "{gas1}", fillMax: 150, orient: "up", fill: "#8a5a2a" }, posW: 100, posH: 220 }
  - Block 2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "gas: {gas2}", shape: { kind: rect, source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" }, posW: 100, posH: 220 }
  - Block 3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "gas: {gas3}", shape: { kind: rect, source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" }, posW: 100, posH: 220 }

animation:
  - step: "等倍で見る" 1.6s
    focus: ["Block 1"]
    description: "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。"
  - step: "1.2 倍で見る" 1.6s
    focus: ["Block 1", "Block 2"]
    description: "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。"
  - step: "1.5 倍で見る" 1.6s
    focus: ["Block 1", "Block 2", "Block 3"]
    description: "3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。"
`;

export const sourceJson__shapeChainFill = `{
  "title": "3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化",
  "type": "flow",
  "inputs": [
    {
      "id": "base",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 30,
      "label": "Base"
    }
  ],
  "formulas": { "gas1": "base", "gas2": "base * 1.2", "gas3": "base * 1.5" },
  "lanes": {
    "l1": { "x": 0, "width": 130 },
    "l2": { "x": 150, "width": 130 },
    "l3": { "x": 300, "width": 130 }
  },
  "actors": [
    {
      "name": "Block 1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "gas: {gas1}",
      "shape": { "kind": "rect", "source": "{gas1}", "fillMax": 150, "orient": "up", "fill": "#8a5a2a" },
      "posW": 100,
      "posH": 220
    },
    {
      "name": "Block 2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "gas: {gas2}",
      "shape": { "kind": "rect", "source": "{gas2}", "fillMax": 150, "orient": "up", "fill": "#4e9dc4" },
      "posW": 100,
      "posH": 220
    },
    {
      "name": "Block 3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "gas: {gas3}",
      "shape": { "kind": "rect", "source": "{gas3}", "fillMax": 150, "orient": "up", "fill": "#7ec4dd" },
      "posW": 100,
      "posH": 220
    }
  ],
  "flow": [],
  "states": { "base": 30, "gas1": 30, "gas2": 36, "gas3": 45 },
  "animation": [
    {
      "step": "等倍で見る",
      "duration": 1.6,
      "focus": ["Block 1"],
      "body": "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。"
    },
    {
      "step": "1.2 倍で見る",
      "duration": 1.6,
      "focus": ["Block 1", "Block 2"],
      "body": "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。"
    },
    {
      "step": "1.5 倍で見る",
      "duration": 1.6,
      "focus": ["Block 1", "Block 2", "Block 3"],
      "body": "3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。"
    }
  ]
}`;

export const sourceYaml__shapeCirclePulse = `title: "円の進捗リングを 4 段階で見せる"
type: flow

inputs:
  p: { kind: slider, min: 0, max: 100, defaultValue: 60, label: "Progress" }

formulas:
  prog: "p / 100"

lanes:
  empty: { x: 0, width: 170 }
  third: { x: 195, width: 170 }
  twothird: { x: 390, width: 170 }
  interactive: { x: 585, width: 180 }

states:
  p: 60
  prog: 0.6
  prog0: 0
  prog33: 0.33
  prog66: 0.66

actors:
  - 0%: { kind: dyn-circle, lane: empty, stack: 0, subtitle: "empty", shape: { kind: circle, fillProgress: "{prog0}", fill: "#a08870" }, posW: 160, posH: 160 }
  - 33%: { kind: dyn-circle, lane: third, stack: 0, subtitle: "one-third", shape: { kind: circle, fillProgress: "{prog33}", fill: "#2563eb" }, posW: 160, posH: 160 }
  - 66%: { kind: dyn-circle, lane: twothird, stack: 0, subtitle: "two-third", shape: { kind: circle, fillProgress: "{prog66}", fill: "#f97316" }, posW: 160, posH: 160 }
  - Ring: { kind: dyn-circle, lane: interactive, stack: 0, subtitle: "{p}%", shape: { kind: circle, fillProgress: "{prog}", fill: "#8a5a2a" }, posW: 160, posH: 160 }

animation:
  - step: "0% を見る" 1.6s
    focus: ["0%"]
    description: "輪がまだ描かれていない状態。 ここが目盛りの始まりで、右へ行くほど輪が伸びる。"
  - step: "33% と並べる" 1.6s
    focus: ["0%", "33%"]
    description: "3 分の 1 まで描いた輪を隣に置く。 0% との差が、輪の長さの違いとして読み取れる。"
  - step: "66% まで並べる" 1.6s
    focus: ["0%", "33%", "66%"]
    description: "3 分の 2 まで並べる。 角度の差が輪の長さで分かる。"
  - step: "つまみで動かす" 1.6s
    focus: ["0%", "33%", "66%", "Ring"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeCirclePulse = `{
  "title": "円の進捗リングを 4 段階で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "p",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 60,
      "label": "Progress"
    }
  ],
  "formulas": { "prog": "p / 100" },
  "lanes": {
    "empty": { "x": 0, "width": 170 },
    "third": { "x": 195, "width": 170 },
    "twothird": { "x": 390, "width": 170 },
    "interactive": { "x": 585, "width": 180 }
  },
  "actors": [
    {
      "name": "0%",
      "kind": "dyn-circle",
      "lane": "empty",
      "stack": 0,
      "subtitle": "empty",
      "shape": { "kind": "circle", "fillProgress": "{prog0}", "fill": "#a08870" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "33%",
      "kind": "dyn-circle",
      "lane": "third",
      "stack": 0,
      "subtitle": "one-third",
      "shape": { "kind": "circle", "fillProgress": "{prog33}", "fill": "#2563eb" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "66%",
      "kind": "dyn-circle",
      "lane": "twothird",
      "stack": 0,
      "subtitle": "two-third",
      "shape": { "kind": "circle", "fillProgress": "{prog66}", "fill": "#f97316" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "Ring",
      "kind": "dyn-circle",
      "lane": "interactive",
      "stack": 0,
      "subtitle": "{p}%",
      "shape": { "kind": "circle", "fillProgress": "{prog}", "fill": "#8a5a2a" },
      "posW": 160,
      "posH": 160
    }
  ],
  "flow": [],
  "states": { "p": 60, "prog": 0.6, "prog0": 0, "prog33": 0.33, "prog66": 0.66 },
  "animation": [
    {
      "step": "0% を見る",
      "duration": 1.6,
      "focus": ["0%"],
      "body": "輪がまだ描かれていない状態。 ここが目盛りの始まりで、右へ行くほど輪が伸びる。"
    },
    {
      "step": "33% と並べる",
      "duration": 1.6,
      "focus": ["0%", "33%"],
      "body": "3 分の 1 まで描いた輪を隣に置く。 0% との差が、輪の長さの違いとして読み取れる。"
    },
    {
      "step": "66% まで並べる",
      "duration": 1.6,
      "focus": ["0%", "33%", "66%"],
      "body": "3 分の 2 まで並べる。 角度の差が輪の長さで分かる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["0%", "33%", "66%", "Ring"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__timelineDrive = `title: "1 つの時間信号が図形 2 種を同時に動かす"
type: flow

inputs:
  t: { kind: timeline, duration: 3000, autoplay: true, loop: true, label: "Timeline" }

readouts:
  timeCu: { kind: countup, source: "bar", unit: "%", label: "Time %" }

formulas:
  bar: "t * 100"
  angle: "t * 270"

lanes:
  time: { x: 0, width: 200 }
  bar: { x: 240, width: 180 }
  arc: { x: 440, width: 220 }

states:
  t: 0
  bar: 0
  angle: 0

actors:
  - timeNode: { kind: card, lane: time, stack: 0, subtitle: "t (0-1 loop 3s autoplay)", title: "Timeline" }
  - r: { kind: dyn-rect, lane: bar, stack: 0, subtitle: "bar = t * 100", shape: { kind: rect, source: "{bar}", fillMax: 100, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 200, title: "Bar (rect)" }
  - a: { kind: dyn-arc, lane: arc, stack: 0, subtitle: "angle = t * 270", shape: { kind: arc, angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" }, posW: 140, posH: 140, title: "Arc" }

flow:
  - timeNode -> r: "→ bar" (info)
  - timeNode -> a: "→ angle" (accent) { labelOffsetX: -45 }

animation:
  - step: "時間の元を見る" 1.8s
    focus: ["timeNode"]
    description: "時間の入力が元になる。 この値から計算式で図形の値を導く。"
  - step: "四角に届く" 1.8s
    focus: ["timeNode", "r"]
    description: "計算式の値が四角に束ねられている。 時間が進むと自動で変わる。"
  - step: "弧にも届く" 1.8s
    focus: ["timeNode", "r", "a"]
    description: "弧には別の計算式 (時間の 270 倍) が束ねられている。 同じ時間から別々の値を導く。"
`;

export const sourceJson__timelineDrive = `{
  "title": "1 つの時間信号が図形 2 種を同時に動かす",
  "type": "flow",
  "inputs": [
    {
      "id": "t",
      "kind": "timeline",
      "duration": 3000,
      "autoplay": true,
      "loop": true,
      "label": "Timeline"
    }
  ],
  "readouts": [
    { "id": "timeCu", "kind": "countup", "source": "bar", "unit": "%", "label": "Time %" }
  ],
  "formulas": { "bar": "t * 100", "angle": "t * 270" },
  "lanes": {
    "time": { "x": 0, "width": 200 },
    "bar": { "x": 240, "width": 180 },
    "arc": { "x": 440, "width": 220 }
  },
  "actors": [
    {
      "name": "timeNode",
      "kind": "card",
      "lane": "time",
      "stack": 0,
      "subtitle": "t (0-1 loop 3s autoplay)",
      "title": "Timeline"
    },
    {
      "name": "r",
      "kind": "dyn-rect",
      "lane": "bar",
      "stack": 0,
      "subtitle": "bar = t * 100",
      "shape": { "kind": "rect", "source": "{bar}", "fillMax": 100, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 200,
      "title": "Bar (rect)"
    },
    {
      "name": "a",
      "kind": "dyn-arc",
      "lane": "arc",
      "stack": 0,
      "subtitle": "angle = t * 270",
      "shape": {
        "kind": "arc",
        "angle": "{angle}",
        "startAngle": -135,
        "sweepMax": 270,
        "fill": "#4e9dc4"
      },
      "posW": 140,
      "posH": 140,
      "title": "Arc"
    }
  ],
  "flow": [
    { "from": "timeNode", "to": "r", "label": "→ bar", "tone": "info" },
    { "from": "timeNode", "to": "a", "label": "→ angle", "tone": "accent", "labelOffsetX": -45 }
  ],
  "states": { "t": 0, "bar": 0, "angle": 0 },
  "animation": [
    {
      "step": "時間の元を見る",
      "duration": 1.8,
      "focus": ["timeNode"],
      "body": "時間の入力が元になる。 この値から計算式で図形の値を導く。"
    },
    {
      "step": "四角に届く",
      "duration": 1.8,
      "focus": ["timeNode", "r"],
      "body": "計算式の値が四角に束ねられている。 時間が進むと自動で変わる。"
    },
    {
      "step": "弧にも届く",
      "duration": 1.8,
      "focus": ["timeNode", "r", "a"],
      "body": "弧には別の計算式 (時間の 270 倍) が束ねられている。 同じ時間から別々の値を導く。"
    }
  ]
}`;

export const sourceYaml__timerStopwatch = `title: "秒数と実行状態から時計表示を作る"
type: flow

inputs:
  sec: { kind: stepper, min: 0, max: 3600, step: 5, defaultValue: 125, label: "Elapsed sec" }
  running: { kind: toggle, defaultValue: true, label: "Running" }

readouts:
  sw: { kind: stopwatch, source: "elapsed", runningSource: "running", size: 40, color: "#241c14", label: "Timer (MM:SS.ms)" }

formulas:
  elapsed: "sec * 1000"

lanes:
  input: { x: 0, width: 200 }
  toggle: { x: 240, width: 200 }
  display: { x: 480, width: 220 }

states:
  sec: 125
  running: "true"
  elapsed: 125000

actors:
  - secNode: { kind: card, lane: input, stack: 0, subtitle: "sec = {sec}s (0-3600)", title: "Seconds" }
  - runNode: { kind: card, lane: toggle, stack: 0, subtitle: "running = {running}", title: "Running" }
  - displayNode: { kind: card, lane: display, stack: 0, subtitle: "elapsed = sec × 1000 = {elapsed}ms", title: "MM:SS.ms" }

flow:
  - secNode -> displayNode: "× 1000" (info)
  - runNode -> displayNode: "color" (success)

animation:
  - step: "秒数" 1.2s
    focus: ["secNode"]
    badge: "timer"
  - step: "実行状態" 1.2s
    focus: ["secNode", "runNode"]
    badge: "timer"
  - step: "時計表示" 1.2s
    focus: ["secNode", "runNode", "displayNode"]
    badge: "timer"
    description: "3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。"
`;

export const sourceJson__timerStopwatch = `{
  "title": "秒数と実行状態から時計表示を作る",
  "type": "flow",
  "inputs": [
    {
      "id": "sec",
      "kind": "stepper",
      "min": 0,
      "max": 3600,
      "step": 5,
      "defaultValue": 125,
      "label": "Elapsed sec"
    },
    { "id": "running", "kind": "toggle", "defaultValue": true, "label": "Running" }
  ],
  "readouts": [
    {
      "id": "sw",
      "kind": "stopwatch",
      "source": "elapsed",
      "runningSource": "running",
      "size": 40,
      "color": "#241c14",
      "label": "Timer (MM:SS.ms)"
    }
  ],
  "formulas": { "elapsed": "sec * 1000" },
  "lanes": {
    "input": { "x": 0, "width": 200 },
    "toggle": { "x": 240, "width": 200 },
    "display": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "secNode",
      "kind": "card",
      "lane": "input",
      "stack": 0,
      "subtitle": "sec = {sec}s (0-3600)",
      "title": "Seconds"
    },
    {
      "name": "runNode",
      "kind": "card",
      "lane": "toggle",
      "stack": 0,
      "subtitle": "running = {running}",
      "title": "Running"
    },
    {
      "name": "displayNode",
      "kind": "card",
      "lane": "display",
      "stack": 0,
      "subtitle": "elapsed = sec × 1000 = {elapsed}ms",
      "title": "MM:SS.ms"
    }
  ],
  "flow": [
    { "from": "secNode", "to": "displayNode", "label": "× 1000", "tone": "info" },
    { "from": "runNode", "to": "displayNode", "label": "color", "tone": "success" }
  ],
  "states": { "sec": 125, "running": "true", "elapsed": 125000 },
  "animation": [
    { "step": "秒数", "duration": 1.2, "focus": ["secNode"], "badge": "timer" },
    { "step": "実行状態", "duration": 1.2, "focus": ["secNode", "runNode"], "badge": "timer" },
    {
      "step": "時計表示",
      "duration": 1.2,
      "focus": ["secNode", "runNode", "displayNode"],
      "badge": "timer",
      "body": "3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。"
    }
  ]
}`;

export const sourceYaml__visualBindOpacity = `title: "信号に追随する濃さと固定の濃さを並べる"
type: flow

inputs:
  fade: { kind: slider, min: 0, max: 100, defaultValue: 100, label: "Opacity" }

readouts:
  opGauge: { kind: gauge, source: "fade", min: 0, max: 100, label: "Fade % gauge" }

formulas:
  op: "fade / 100"

lanes:
  control: { x: 0, width: 200 }
  target-lane: { x: 240, width: 220 }
  ref-lane: { x: 500, width: 200 }

states:
  fade: 100
  op: 1

actors:
  - Fade control: { kind: card, lane: control, stack: 0, subtitle: "fade = {fade} · op = {op}" }
  - Target: { kind: card, lane: target-lane, stack: 0, subtitle: "opacity: {op}", opacity: "{op}" }
  - Reference: { kind: card, lane: ref-lane, stack: 0, subtitle: "always visible (opacity=1)" }

flow:
  - Fade control -> Target: "op bind" (info)
  - Fade control -> Reference: "no bind" (warning)

animation:
  - step: "動かす側を見る" 1.8s
    focus: ["Fade control", "Reference"]
    description: "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。"
  - step: "追随する側" 1.8s
    focus: ["Fade control", "Target", "Reference"]
    description: "追随する側は信号に束ねられている。 つまみを動かすとここだけが変わる。"
  - step: "固定の側と比べる" 1.8s
    focus: ["Target", "Reference"]
    description: "固定側は束ねられていないので動かない。 2 つを並べると束ねの有無が見える。"
`;

export const sourceJson__visualBindOpacity = `{
  "title": "信号に追随する濃さと固定の濃さを並べる",
  "type": "flow",
  "inputs": [
    {
      "id": "fade",
      "kind": "slider",
      "min": 0,
      "max": 100,
      "defaultValue": 100,
      "label": "Opacity"
    }
  ],
  "readouts": [
    {
      "id": "opGauge",
      "kind": "gauge",
      "source": "fade",
      "min": 0,
      "max": 100,
      "label": "Fade % gauge"
    }
  ],
  "formulas": { "op": "fade / 100" },
  "lanes": {
    "control": { "x": 0, "width": 200 },
    "target-lane": { "x": 240, "width": 220 },
    "ref-lane": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "Fade control",
      "kind": "card",
      "lane": "control",
      "stack": 0,
      "subtitle": "fade = {fade} · op = {op}"
    },
    {
      "name": "Target",
      "kind": "card",
      "lane": "target-lane",
      "stack": 0,
      "subtitle": "opacity: {op}",
      "opacity": "{op}"
    },
    {
      "name": "Reference",
      "kind": "card",
      "lane": "ref-lane",
      "stack": 0,
      "subtitle": "always visible (opacity=1)"
    }
  ],
  "flow": [
    { "from": "Fade control", "to": "Target", "label": "op bind", "tone": "info" },
    { "from": "Fade control", "to": "Reference", "label": "no bind", "tone": "warning" }
  ],
  "states": { "fade": 100, "op": 1 },
  "animation": [
    {
      "step": "動かす側を見る",
      "duration": 1.8,
      "focus": ["Fade control", "Reference"],
      "body": "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。"
    },
    {
      "step": "追随する側",
      "duration": 1.8,
      "focus": ["Fade control", "Target", "Reference"],
      "body": "追随する側は信号に束ねられている。 つまみを動かすとここだけが変わる。"
    },
    {
      "step": "固定の側と比べる",
      "duration": 1.8,
      "focus": ["Target", "Reference"],
      "body": "固定側は束ねられていないので動かない。 2 つを並べると束ねの有無が見える。"
    }
  ]
}`;

export const sourceYaml__edgeFlowBind = `title: "信号で線の太さと流れる点が変わる"
type: flow

inputs:
  flow: { kind: slider, min: 1, max: 15, defaultValue: 5, label: "Flow Width" }
  t: { kind: timeline, duration: 2000, autoplay: true, loop: true, label: "Timeline" }

formulas:
  dash: "t * 24"

lanes:
  src: { x: 0, width: 230 }
  pipe: { x: 270, width: 350 }
  sink: { x: 660, width: 190 }

states:
  flow: 5
  t: 0
  dash: 0

actors:
  - a: { kind: card, lane: src, stack: 0, subtitle: "producer", posW: 180, title: "Source" }
  - pipeNode: { kind: card, lane: pipe, stack: 0, subtitle: "width={flow} · dash={dash}", posW: 300, title: "Pipe" }
  - b: { kind: card, lane: sink, stack: 0, subtitle: "consumer", posW: 140, title: "Sink" }

flow:
  - a -> pipeNode: "produce" (accent) { widthBind: "{flow}", dashOffsetBind: "{dash}" }
  - pipeNode -> b: "consume" (accent) { widthBind: "{flow}", dashOffsetBind: "{dash}" }

animation:
  - step: "送り手を見る" 1.6s
    focus: ["a"]
    description: "左の箱が信号を持つ。 まだ線には出ていない。"
  - step: "線に出る" 1.6s
    focus: ["a", "pipeNode"]
    description: "信号の大きさが線の太さになる。 太いほど多く流れている。"
  - step: "受け手まで届く" 1.6s
    focus: ["a", "pipeNode", "b"]
    description: "線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。"
`;

export const sourceJson__edgeFlowBind = `{
  "title": "信号で線の太さと流れる点が変わる",
  "type": "flow",
  "inputs": [
    {
      "id": "flow",
      "kind": "slider",
      "min": 1,
      "max": 15,
      "defaultValue": 5,
      "label": "Flow Width"
    },
    {
      "id": "t",
      "kind": "timeline",
      "duration": 2000,
      "autoplay": true,
      "loop": true,
      "label": "Timeline"
    }
  ],
  "formulas": { "dash": "t * 24" },
  "lanes": {
    "src": { "x": 0, "width": 230 },
    "pipe": { "x": 270, "width": 350 },
    "sink": { "x": 660, "width": 190 }
  },
  "actors": [
    {
      "name": "a",
      "kind": "card",
      "lane": "src",
      "stack": 0,
      "subtitle": "producer",
      "posW": 180,
      "title": "Source"
    },
    {
      "name": "pipeNode",
      "kind": "card",
      "lane": "pipe",
      "stack": 0,
      "subtitle": "width={flow} · dash={dash}",
      "posW": 300,
      "title": "Pipe"
    },
    {
      "name": "b",
      "kind": "card",
      "lane": "sink",
      "stack": 0,
      "subtitle": "consumer",
      "posW": 140,
      "title": "Sink"
    }
  ],
  "flow": [
    {
      "from": "a",
      "to": "pipeNode",
      "label": "produce",
      "tone": "accent",
      "widthBind": "{flow}",
      "dashOffsetBind": "{dash}"
    },
    {
      "from": "pipeNode",
      "to": "b",
      "label": "consume",
      "tone": "accent",
      "widthBind": "{flow}",
      "dashOffsetBind": "{dash}"
    }
  ],
  "states": { "flow": 5, "t": 0, "dash": 0 },
  "animation": [
    { "step": "送り手を見る", "duration": 1.6, "focus": ["a"], "body": "左の箱が信号を持つ。 まだ線には出ていない。" },
    {
      "step": "線に出る",
      "duration": 1.6,
      "focus": ["a", "pipeNode"],
      "body": "信号の大きさが線の太さになる。 太いほど多く流れている。"
    },
    {
      "step": "受け手まで届く",
      "duration": 1.6,
      "focus": ["a", "pipeNode", "b"],
      "body": "線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。"
    }
  ]
}`;

export const sourceYaml__clickToggle = `title: "クリックが handler を通って状態に届く"
type: flow

inputs:
  active: { kind: toggle, defaultValue: false, label: "Active" }

lanes:
  col1: { x: 0, width: 360 }
  col2: { x: 400, width: 370 }

states:
  active: "off"

actors:
  - Button: { kind: card, lane: col1, stack: 0, subtitle: "click target", posW: 180 }
  - Handler: { kind: card, lane: col2, stack: 0, subtitle: "押した時と触れた時の受け取り手", posW: 320 }
  - Signal state: { kind: card, lane: col1, stack: 1, subtitle: "active = {active}", posW: 310 }

flow:
  - Button -> Handler: "click / hover" (info)
  - Handler -> Signal state: "toggle" (success)

events:
  - { on: click, box: "Button", handler: "toggle-active" }
  - { on: hover, box: "Button", handler: "hover-state" }

animation:
  - step: "押す前" 1.6s
    focus: ["Button"]
    description: "ボタンだけがある状態。 まだ何も起きていない。"
  - step: "受け取り手に結ぶ" 1.6s
    focus: ["Button", "Handler"]
    description: "押した時に呼ぶ受け取り手を結び付ける。 受け取り手の中身は使う側が渡す。"
  - step: "押すと値が変わる" 1.6s
    focus: ["Button", "Handler", "Signal state"]
    description: "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"
`;

export const sourceJson__clickToggle = `{
  "title": "クリックが handler を通って状態に届く",
  "type": "flow",
  "inputs": [
    { "id": "active", "kind": "toggle", "defaultValue": false, "label": "Active" }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 360 },
    "col2": { "x": 400, "width": 370 }
  },
  "actors": [
    {
      "name": "Button",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "click target",
      "posW": 180
    },
    {
      "name": "Handler",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "押した時と触れた時の受け取り手",
      "posW": 320
    },
    {
      "name": "Signal state",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "active = {active}",
      "posW": 310
    }
  ],
  "flow": [
    { "from": "Button", "to": "Handler", "label": "click / hover", "tone": "info" },
    { "from": "Handler", "to": "Signal state", "label": "toggle", "tone": "success" }
  ],
  "states": { "active": "off" },
  "events": [
    { "on": "click", "box": "Button", "handler": "toggle-active" },
    { "on": "hover", "box": "Button", "handler": "hover-state" }
  ],
  "animation": [
    { "step": "押す前", "duration": 1.6, "focus": ["Button"], "body": "ボタンだけがある状態。 まだ何も起きていない。" },
    {
      "step": "受け取り手に結ぶ",
      "duration": 1.6,
      "focus": ["Button", "Handler"],
      "body": "押した時に呼ぶ受け取り手を結び付ける。 受け取り手の中身は使う側が渡す。"
    },
    {
      "step": "押すと値が変わる",
      "duration": 1.6,
      "focus": ["Button", "Handler", "Signal state"],
      "body": "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"
    }
  ]
}`;

export const sourceYaml__eventVariety = `title: "5 種の操作イベントを受け取り分ける"
type: flow

inputs:
  lastEvent: { kind: dropdown, options: ["まだ無し", "2 回押し", "選ばれた", "外れた", "キー入力", "長押し"], defaultValue: "まだ無し", label: "直近に受け取った操作" }
  received: { kind: stepper, min: 0, max: 99, defaultValue: 0, label: "受け取った回数" }

lanes:
  pointer: { x: 0, width: 200 }
  keyboard: { x: 240, width: 240 }
  touch: { x: 500, width: 240 }

actors:
  - Double Click: { kind: card, lane: pointer, stack: 0, subtitle: "2 回続けて押す" }
  - Key Focus: { kind: card, lane: keyboard, stack: 0, subtitle: "選ぶ / 外れる / キーを押す" }
  - Long Press: { kind: card, lane: touch, stack: 0, subtitle: "押したまま 500 ミリ秒" }
  - 受け取った結果: { kind: card, lane: touch, stack: 1, subtitle: "{lastEvent} · 累計 {received} 回", posW: 220 }

events:
  - { on: double-click, box: "Double Click", handler: "on-dbl" }
  - { on: focus, box: "Key Focus", handler: "on-focus" }
  - { on: blur, box: "Key Focus", handler: "on-blur" }
  - { on: keydown, box: "Key Focus", handler: "on-key" }
  - { on: long-press, box: "Long Press", handler: "on-long" }

animation:
  - step: "2 回押す" 1.6s
    focus: ["Double Click", "受け取った結果"]
    description: "1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。"
  - step: "選ぶ / キーを押す" 1.6s
    focus: ["Double Click", "Key Focus", "受け取った結果"]
    description: "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。"
  - step: "長く押す" 1.6s
    focus: ["Double Click", "Key Focus", "Long Press", "受け取った結果"]
    description: "3 つ目は押したまま一定時間たつと受け取る。 5 つの操作はどれも同じ箱に結果を書く。"
`;

export const sourceJson__eventVariety = `{
  "title": "5 種の操作イベントを受け取り分ける",
  "type": "flow",
  "inputs": [
    {
      "id": "lastEvent",
      "kind": "dropdown",
      "options": ["まだ無し", "2 回押し", "選ばれた", "外れた", "キー入力", "長押し"],
      "defaultValue": "まだ無し",
      "label": "直近に受け取った操作"
    },
    {
      "id": "received",
      "kind": "stepper",
      "min": 0,
      "max": 99,
      "defaultValue": 0,
      "label": "受け取った回数"
    }
  ],
  "lanes": {
    "pointer": { "x": 0, "width": 200 },
    "keyboard": { "x": 240, "width": 240 },
    "touch": { "x": 500, "width": 240 }
  },
  "actors": [
    {
      "name": "Double Click",
      "kind": "card",
      "lane": "pointer",
      "stack": 0,
      "subtitle": "2 回続けて押す"
    },
    {
      "name": "Key Focus",
      "kind": "card",
      "lane": "keyboard",
      "stack": 0,
      "subtitle": "選ぶ / 外れる / キーを押す"
    },
    {
      "name": "Long Press",
      "kind": "card",
      "lane": "touch",
      "stack": 0,
      "subtitle": "押したまま 500 ミリ秒"
    },
    {
      "name": "受け取った結果",
      "kind": "card",
      "lane": "touch",
      "stack": 1,
      "subtitle": "{lastEvent} · 累計 {received} 回",
      "posW": 220
    }
  ],
  "flow": [],
  "events": [
    { "on": "double-click", "box": "Double Click", "handler": "on-dbl" },
    { "on": "focus", "box": "Key Focus", "handler": "on-focus" },
    { "on": "blur", "box": "Key Focus", "handler": "on-blur" },
    { "on": "keydown", "box": "Key Focus", "handler": "on-key" },
    { "on": "long-press", "box": "Long Press", "handler": "on-long" }
  ],
  "animation": [
    {
      "step": "2 回押す",
      "duration": 1.6,
      "focus": ["Double Click", "受け取った結果"],
      "body": "1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。"
    },
    {
      "step": "選ぶ / キーを押す",
      "duration": 1.6,
      "focus": ["Double Click", "Key Focus", "受け取った結果"],
      "body": "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。"
    },
    {
      "step": "長く押す",
      "duration": 1.6,
      "focus": ["Double Click", "Key Focus", "Long Press", "受け取った結果"],
      "body": "3 つ目は押したまま一定時間たつと受け取る。 5 つの操作はどれも同じ箱に結果を書く。"
    }
  ]
}`;

export const sourceYaml__scrollNarrative = `title: "スクロール進行に 3 つの段が同時に追随する"
type: flow

lanes:
  s1: { x: 0, width: 220 }
  s2: { x: 260, width: 220 }
  s3: { x: 520, width: 220 }

states:
  intro: 0

actors:
  - Step 1: { kind: card, lane: s1, stack: 0, subtitle: "progress: {intro}" }
  - Step 2: { kind: card, lane: s2, stack: 0, subtitle: "progress: {intro}" }
  - Step 3: { kind: card, lane: s3, stack: 0, subtitle: "progress: {intro}" }

scrolls:
  intro: { start: 0.9, end: 0.1, scrub: 1, label: "Intro reveal" }

animation:
  - step: "1 箱で見る" 1.6s
    focus: ["Step 1"]
    description: "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。"
  - step: "2 箱で見る" 1.6s
    focus: ["Step 1", "Step 2"]
    description: "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。"
  - step: "3 箱が同時に追う" 1.6s
    focus: ["Step 1", "Step 2", "Step 3"]
    description: "3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。"
`;

export const sourceJson__scrollNarrative = `{
  "title": "スクロール進行に 3 つの段が同時に追随する",
  "type": "flow",
  "lanes": {
    "s1": { "x": 0, "width": 220 },
    "s2": { "x": 260, "width": 220 },
    "s3": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "Step 1",
      "kind": "card",
      "lane": "s1",
      "stack": 0,
      "subtitle": "progress: {intro}"
    },
    {
      "name": "Step 2",
      "kind": "card",
      "lane": "s2",
      "stack": 0,
      "subtitle": "progress: {intro}"
    },
    {
      "name": "Step 3",
      "kind": "card",
      "lane": "s3",
      "stack": 0,
      "subtitle": "progress: {intro}"
    }
  ],
  "flow": [],
  "states": { "intro": 0 },
  "scrolls": {
    "intro": { "start": 0.9, "end": 0.1, "scrub": 1, "label": "Intro reveal" }
  },
  "animation": [
    {
      "step": "1 箱で見る",
      "duration": 1.6,
      "focus": ["Step 1"],
      "body": "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。"
    },
    {
      "step": "2 箱で見る",
      "duration": 1.6,
      "focus": ["Step 1", "Step 2"],
      "body": "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。"
    },
    {
      "step": "3 箱が同時に追う",
      "duration": 1.6,
      "focus": ["Step 1", "Step 2", "Step 3"],
      "body": "3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。"
    }
  ]
}`;

export const sourceYaml__supportChat = `title: "問い合わせ 5 通を客 / 担当で分ける"
type: flow

readouts:
  cb: { kind: chat-bubble, source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#f0e0b8", label: "Conversation (bubbles)" }

lanes:
  customer: { x: 0, width: 280 }
  support: { x: 320, width: 320 }

states:
  thread: [["Alice","Hi, I need help with my order",false],["Support","Sure! What's the order ID?",true],["Alice","#12345",false],["Support","Checking...",true],["Support","Refunded! You'll see it in 3-5 days.",true]]

actors:
  - Alice #1: { kind: card, lane: customer, stack: 0, subtitle: "利用者の 1 通目" }
  - Alice #2: { kind: card, lane: customer, stack: 1, subtitle: "利用者の 2 通目" }
  - Support #1: { kind: card, lane: support, stack: 0, subtitle: "応対側の 1 通目" }
  - Support #2: { kind: card, lane: support, stack: 1, subtitle: "確認中の返答" }
  - Support #3: { kind: card, lane: support, stack: 2, subtitle: "解決の返答" }

animation:
  - step: "問い合わせ" 1.8s
    focus: ["Alice #1"]
    set:
      thread: '[["Alice","Hi, I need help with my order",false]]'
    description: "利用者からの 1 通目。 左側に吹き出しが出る。"
  - step: "やり取りが続く" 1.8s
    focus: ["Alice #1", "Support #1", "Alice #2"]
    set:
      thread: '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false]]'
    description: "応対側が返し、利用者が答える。 左右に交互に並ぶ。"
  - step: "解決する" 1.8s
    focus: ["Alice #1", "Support #1", "Alice #2", "Support #2", "Support #3"]
    set:
      thread: '[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false],["Support","Checking...",true],["Support","Refunded! 3-5 days.",true]]'
    description: "確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。"
`;

export const sourceJson__supportChat = `{
  "title": "問い合わせ 5 通を客 / 担当で分ける",
  "type": "flow",
  "readouts": [
    {
      "id": "cb",
      "kind": "chat-bubble",
      "source": "thread",
      "max": 6,
      "colorSelf": "#2563eb",
      "colorOther": "#f0e0b8",
      "label": "Conversation (bubbles)"
    }
  ],
  "lanes": {
    "customer": { "x": 0, "width": 280 },
    "support": { "x": 320, "width": 320 }
  },
  "actors": [
    {
      "name": "Alice #1",
      "kind": "card",
      "lane": "customer",
      "stack": 0,
      "subtitle": "利用者の 1 通目"
    },
    {
      "name": "Alice #2",
      "kind": "card",
      "lane": "customer",
      "stack": 1,
      "subtitle": "利用者の 2 通目"
    },
    {
      "name": "Support #1",
      "kind": "card",
      "lane": "support",
      "stack": 0,
      "subtitle": "応対側の 1 通目"
    },
    {
      "name": "Support #2",
      "kind": "card",
      "lane": "support",
      "stack": 1,
      "subtitle": "確認中の返答"
    },
    { "name": "Support #3", "kind": "card", "lane": "support", "stack": 2, "subtitle": "解決の返答" }
  ],
  "flow": [],
  "states": {
    "thread": "[[\\"Alice\\",\\"Hi, I need help with my order\\",false],[\\"Support\\",\\"Sure! What's the order ID?\\",true],[\\"Alice\\",\\"#12345\\",false],[\\"Support\\",\\"Checking...\\",true],[\\"Support\\",\\"Refunded! You'll see it in 3-5 days.\\",true]]"
  },
  "animation": [
    {
      "step": "問い合わせ",
      "duration": 1.8,
      "focus": ["Alice #1"],
      "set": { "thread": "[[\\"Alice\\",\\"Hi, I need help with my order\\",false]]" },
      "body": "利用者からの 1 通目。 左側に吹き出しが出る。"
    },
    {
      "step": "やり取りが続く",
      "duration": 1.8,
      "focus": ["Alice #1", "Support #1", "Alice #2"],
      "set": {
        "thread": "[[\\"Alice\\",\\"Hi, I need help with my order\\",false],[\\"Support\\",\\"Sure! What is the order ID?\\",true],[\\"Alice\\",\\"#12345\\",false]]"
      },
      "body": "応対側が返し、利用者が答える。 左右に交互に並ぶ。"
    },
    {
      "step": "解決する",
      "duration": 1.8,
      "focus": ["Alice #1", "Support #1", "Alice #2", "Support #2", "Support #3"],
      "set": {
        "thread": "[[\\"Alice\\",\\"Hi, I need help with my order\\",false],[\\"Support\\",\\"Sure! What is the order ID?\\",true],[\\"Alice\\",\\"#12345\\",false],[\\"Support\\",\\"Checking...\\",true],[\\"Support\\",\\"Refunded! 3-5 days.\\",true]]"
      },
      "body": "確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。"
    }
  ]
}`;
