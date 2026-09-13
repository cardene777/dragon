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
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "値" })
  .state("value", { initial: 50 })
  .node("sliderNode", {
    lane: "slider",
    stack: 0,
    kind: "card",
    title: "つまみ",
    subtitle: "値 = {value}",
  })
  .node("bar-node", {
    lane: "output",
    stack: 0,
    kind: "card",
    title: "受け手",
    subtitle: "受け取った値: {value}",
  })
  .edge("sliderNode", "bar-node", { label: "値を渡す", tone: "info" })
  .phase(
    "p1",
    {
      duration: 1600,
      title: "つまみを持つ",
      body: "左の縦列だけを見る。 つまみを動かすと値が変わる。 まだ右の箱には届いていない。",
    },
    (p: PhaseBuilder) => p.activate("sliderNode"),
  )
  .phase(
    "p2",
    {
      duration: 1600,
      title: "値が渡る",
      body: "つまみと右の箱をつなぐ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。",
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
  "つまみ (slider) で動かした値が、矢印の先の箱の説明欄にそのまま届く最小の見本";

/**
 * 2. formula → text bind (formula primitive + reactive computed)。
 *
 * 式の名札 (`label`) の有無を変種で見比べる (#1916)。 名札を書くと操作部が式の名前と中身を
 * 名札で描き、書かないと式の名前 (`doubled` / `halved`) をそのまま描く。
 * 名札の有無のほかは同じ図なので、組み立てを 1 本にして 2 度書かない。
 */
function 二倍と半分の図(id: string, 名札: boolean) {
  return diagram(id, {
    topic: "入力値から 2 倍と半分を自動計算する",
  })
    .lane("input", { x: 0, width: 200 })
    .lane("doubled", { x: 240, width: 200 })
    .lane("halved", { x: 480, width: 200 })
    .input.number("input", { defaultValue: 10, label: "元の値" })
    .formula("doubled", "input * 2", 名札 ? { label: "2 倍" } : undefined)
    .formula("halved", "input / 2", 名札 ? { label: "半分" } : undefined)
    .state("input", { initial: 10 })
    .state("doubled", { initial: 20 })
    .state("halved", { initial: 5 })
    .node("in", {
      lane: "input",
      stack: 0,
      kind: "card",
      title: "元の値",
      subtitle: "値 = {input}",
    })
    .node("out1", {
      lane: "doubled",
      stack: 0,
      kind: "card",
      title: "2 倍",
      subtitle: "元の値 × 2 = {doubled}",
    })
    .node("out2", {
      lane: "halved",
      stack: 0,
      kind: "card",
      title: "半分",
      subtitle: "元の値 ÷ 2 = {halved}",
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
}
export const formulaTextBind = 二倍と半分の図("interactive-formula-text", true);
export const patternBase__formulaTextBind = "名札で描く";
export const pattern__formulaTextBind__名前のまま描く = 二倍と半分の図(
  "interactive-formula-text-bare",
  false,
);
export const subtitle__formulaTextBind =
  "入力欄に入れた元の値から、式で 2 倍と半分を求めて隣の縦列の箱に出す";

/**
 * 3. scroll → progress readout (scroll-driven trigger)。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "スクロール進行に 3 つの段が同時に追随する",
})
  .lane("s1", { x: 0, width: 220 })
  .lane("s2", { x: 260, width: 220 })
  .lane("s3", { x: 520, width: 220 })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "スクロールの進み具合" })
  .state("intro", { initial: 0 })
  .node("a", { lane: "s1", stack: 0, kind: "card", title: "段 1", subtitle: "進み具合: {intro}" })
  .node("b", { lane: "s2", stack: 0, kind: "card", title: "段 2", subtitle: "進み具合: {intro}" })
  .node("c", { lane: "s3", stack: 0, kind: "card", title: "段 3", subtitle: "進み具合: {intro}" })
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
  "画面を送った量 (scroll) を 1 つの値にして、3 つの箱が同じ進み具合を出す";

/**
 * 4. click → toggle (event handler + hover)。
 *
 * 切り替えの名前 (`onLabel` / `offLabel`) の有無を変種で見比べる (#1920)。 名前を書くと箱の
 * `{active}` を `押していない` / `押した` と描き、書かないと値 (`false` / `true`) をそのまま描く。
 * 名前の有無のほかは同じ図なので、組み立てを 1 本にして 2 度書かない。
 */
function 押すと切り替わる図(id: string, 名前: boolean) {
  return (
    diagram(id, {
      topic: "クリックが handler を通って状態に届く",
    })
      .lane("col1", { x: 0, width: 360 })
      .lane("col2", { x: 400, width: 370 })
      // 押した状態は入力欄が持つ。 別に `state` を置いても入力欄の初期値が勝ち、その値は画面に出ない
      .input.toggle("active", {
        defaultValue: false,
        label: "押した状態",
        ...(名前 ? { onLabel: "押した", offLabel: "押していない" } : {}),
      })
      .node("btn", {
        lane: "col1",
        stack: 0,
        kind: "card",
        w: 180,
        title: "ボタン",
        subtitle: "押す先",
      })
      .node("handlerNode", {
        lane: "col2",
        stack: 0,
        kind: "card",
        w: 320,
        title: "受け取り手",
        subtitle: "押した時と触れた時に呼ばれる",
      })
      .node("signalNode", {
        lane: "col1",
        stack: 1,
        kind: "card",
        w: 310,
        title: "値の状態",
        subtitle: "押した状態 = {active}",
      })
      .edge("btn", "handlerNode", { label: "押す / 触れる", tone: "info" })
      .edge("handlerNode", "signalNode", { label: "切り替え", tone: "success" })
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
          title: "受け取り手を決める",
          body: "押した時に呼ぶ受け取り手を決める。 受け取り手の中身は使う側が渡す。",
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
      .build()
  );
}
export const clickToggle = 押すと切り替わる図("interactive-click-toggle", true);
export const patternBase__clickToggle = "名前で描く";
export const pattern__clickToggle__値のまま描く = 押すと切り替わる図("interactive-click-toggle-bare", false);
export const subtitle__clickToggle =
  "押す先を押すと受け取り手を通って、押した状態の値が切り替わる";

/**
 * 5. visual binding = slider → node 実 width 変化 (arc-intro 相当の core UX)。
 * slider を drag すると bar node の SVG width が実際に伸縮、 subtitle だけでなく図形が動く。
 */
export const visualBindBar = diagram("interactive-visual-bar", {
  topic: "信号の値が棒の実際の幅と高さに反映される",
})
  .lane("signal", { x: 0, width: 200 })
  .lane("bar-lane", { x: 240, width: 340 })
  .lane("readout", { x: 600, width: 220 })
  .input.slider("barW", { min: 40, max: 320, defaultValue: 160, label: "棒の幅" })
  .state("barW", { initial: 160 })
  .node("signalNode", {
    lane: "signal",
    stack: 0,
    kind: "card",
    title: "信号",
    subtitle: "幅 = {barW}",
  })
  .node("bar", {
    lane: "bar-lane",
    stack: 0,
    kind: "card",
    title: "横の棒",
    subtitle: "幅 {barW}px",
    w: 160,
    wBind: "{barW}",
  })
  .node("barTall", {
    lane: "bar-lane",
    stack: 1,
    kind: "card",
    title: "縦の棒",
    subtitle: "高さ {barW}px",
    h: 96,
    hBind: "{barW}",
  })
  .node("readoutNode", {
    lane: "readout",
    stack: 0,
    kind: "card",
    title: "数の表示",
    subtitle: "同じ信号を数でも出す",
  })
  .edge("signalNode", "bar", { label: "幅に使う", tone: "info" })
  .edge("signalNode", "barTall", { label: "高さに使う", tone: "warning" })
  .edge("signalNode", "readoutNode", { label: "数で出す", tone: "success" })
  .readout.bar("barMon", { source: "barW", min: 40, max: 320, label: "いまの幅" })
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
      body: "同じ信号が、上の棒では幅に、下の棒では高さになる。 つまみを動かすと両方が追いかける。",
    },
    (p: PhaseBuilder) => p.activate("signalNode", "bar", "barTall"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "数でも読む",
      body: "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。",
    },
    (p: PhaseBuilder) => p.activate("signalNode", "bar", "barTall", "readoutNode"),
  )
  .build();
export const subtitle__visualBindBar =
  "1 つの値を横の棒の幅と縦の棒の高さに当て、同じ値を数でも出す (wBind / hBind)";

/**
 * 6. visual binding = slider → node opacity で fade in/out。
 */
export const visualBindOpacity = diagram("interactive-visual-opacity", {
  topic: "信号に追随する濃さと固定の濃さを並べる",
})
  .lane("control", { x: 0, width: 200 })
  .lane("target-lane", { x: 240, width: 220 })
  .lane("ref-lane", { x: 500, width: 200 })
  .input.slider("fade", { min: 0, max: 100, defaultValue: 100, label: "濃さ" })
  .formula("op", "fade / 100", { label: "不透明度" })
  .state("fade", { initial: 100 })
  .state("op", { initial: 1 })
  .node("controlNode", {
    lane: "control",
    stack: 0,
    kind: "card",
    title: "濃さの操作",
    subtitle: "濃さ {fade} · 不透明度 {op}",
  })
  .node("target", {
    lane: "target-lane",
    stack: 0,
    kind: "card",
    title: "追随する側",
    subtitle: "不透明度 {op}",
    opacity: "{op}",
  })
  .node("ref", {
    lane: "ref-lane",
    stack: 0,
    kind: "card",
    title: "固定の側",
    subtitle: "いつも見える (不透明度 1)",
  })
  .edge("controlNode", "target", { label: "濃さを渡す", tone: "info" })
  .edge("controlNode", "ref", { label: "渡さない", tone: "warning" })
  .readout.gauge("opGauge", { source: "fade", min: 0, max: 100, label: "濃さ (%)" })
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
      body: "追随する側は信号の値で濃さが決まる。 つまみを動かすとここだけが変わる。",
    },
    (p: PhaseBuilder) => p.activate("controlNode", "target", "ref"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "固定の側と比べる",
      body: "固定の側は信号を見ていないので動かない。 2 つを並べると、追随するかどうかの違いが見える。",
    },
    (p: PhaseBuilder) => p.activate("target", "ref"),
  )
  .build();
export const subtitle__visualBindOpacity =
  "つまみの値で濃さが変わる箱と、値を渡さず濃さが変わらない箱を並べて比べる (opacity)";

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
    label: "位置",
  })
  .state("pos", { initial: "50,50" })
  .node("q2Node", { lane: "q2", stack: 0, kind: "card", title: "左上", subtitle: "第 2 象限" })
  .node("q1Node", { lane: "q1", stack: 0, kind: "card", title: "右上", subtitle: "第 1 象限" })
  .node("q3Node", { lane: "q3", stack: 0, kind: "card", title: "左下", subtitle: "第 3 象限" })
  .node("q4Node", { lane: "q4", stack: 0, kind: "card", title: "右下", subtitle: "第 4 象限" })
  .node("indicator", {
    lane: "q1",
    stack: 1,
    kind: "card",
    title: "◆ いまの位置",
    subtitle: "{pos} (初期値は中央で、右上との境目)",
  })
  .readout.stat("posStat", { source: "pos", label: "選んだ座標", caption: "横, 縦 の順に 0〜100" })
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
  "平面のつまみ (xypad) で選んだ位置が、左上 / 右上 / 左下 / 右下のどの区画に入るかを示す";

/**
 * 8. stepper で phase 相当の値を細かく調整、 bar readout に反映。
 */
export const stepperControl = diagram("interactive-stepper", {
  topic: "増減ボタンで棒と数値が動く",
})
  .lane("ctrl", { x: 0, width: 200 })
  .lane("bar", { x: 240, width: 220 })
  .lane("stat", { x: 480, width: 200 })
  .input.stepper("count", { min: 0, max: 10, defaultValue: 3, label: "個数" })
  .state("count", { initial: 3 })
  .node("ctrlNode", {
    lane: "ctrl",
    stack: 0,
    kind: "card",
    title: "増減ボタン",
    subtitle: "個数 = {count} (0〜10)",
  })
  .node("barNode", {
    lane: "bar",
    stack: 0,
    kind: "card",
    title: "棒で見る",
    subtitle: "個数に追随する棒",
  })
  .node("statNode", {
    lane: "stat",
    stack: 0,
    kind: "card",
    title: "数で見る",
    subtitle: "個数に追随する数と単位",
  })
  .edge("ctrlNode", "barNode", { label: "→ 棒", tone: "info" })
  .edge("ctrlNode", "statNode", { label: "→ 数", tone: "success" })
  .readout.bar("countBar", { source: "count", min: 0, max: 10, label: "進み具合の棒" })
  .readout.stat("countStat", { source: "count", label: "合計", unit: " 個" })
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
  "増減の入力欄 (stepper) で決めた個数を、棒と数の 2 か所に出す";

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
  .input.number("val", { defaultValue: 20, label: "値" })
  .state("val", { initial: 20 })
  .node("currentNode", {
    lane: "current",
    stack: 0,
    kind: "card",
    title: "いまの値",
    subtitle: "値 = {val}",
  })
  .node("historyNode", {
    lane: "history",
    stack: 0,
    kind: "card",
    title: "履歴 (15 件)",
    subtitle: "直近 15 回の値を折れ線で残す",
  })
  .edge("currentNode", "historyNode", { label: "履歴に足す", tone: "info" })
  .readout.sparkline("valHist", {
    source: "val",
    history: 15,
    color: "#e57373",
    label: "履歴の折れ線",
  })
  .readout.stat("valStat", { source: "val", label: "最新の値", caption: "入力の履歴の最新" })
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
  "入力欄に入れた値を、いまの値と直近 15 回の小さな折れ線の 2 つで出す (sparkline)";

/**
 * 9b. radio + stat = 選択肢と現在値。 radio で option 切替、 stat で文字列表示。
 */
export const radioSelect = diagram("interactive-radio-select", {
  topic: "3 択のラジオで選んだ 1 つだけが光る",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 200 })
  .input.radio("mode", { options: ["低", "中", "高"], defaultValue: "中", label: "段階" })
  .state("mode", { initial: "中" })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "低",
    subtitle: "選択肢: 低",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "中",
    subtitle: "選択肢: 中 (初期値)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "高",
    subtitle: "選択肢: 高",
  })
  .node("currentMode", {
    lane: "mid",
    stack: 1,
    kind: "card",
    title: "◆ 選択中",
    subtitle: "段階 = {mode}",
  })
  .readout.stat("modeStat", { source: "mode", label: "いまの段階", caption: "選択中" })
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
  "低 / 中 / 高から 1 つだけ選ぶ入力欄 (radio) で、選んだ段階を箱と数で示す";

/**
 * 10. color picker で node stroke を変える (theme 実験)。
 */
export const colorPickerTheme = diagram("interactive-color-theme", {
  topic: "選んだ色が見本と 16 進表記に伝わる",
})
  .lane("picker", { x: 0, width: 370 })
  .lane("swatch-lane", { x: 410, width: 230 })
  .lane("stat", { x: 680, width: 320 })
  .input.color("accent", { defaultValue: "#8a5a2a", label: "差し色" })
  .state("accent", { initial: "#8a5a2a" })
  .node("pickerNode", {
    lane: "picker",
    stack: 0,
    kind: "card",
    w: 320,
    title: "色の選択",
    subtitle: "色の入力欄 · 初期値 #8a5a2a",
  })
  .node("swatch", {
    lane: "swatch-lane",
    stack: 0,
    kind: "card",
    w: 180,
    title: "色見本",
    subtitle: "{accent}",
  })
  .node("statNode", {
    lane: "stat",
    stack: 0,
    kind: "card",
    w: 270,
    title: "16 進の表示",
    subtitle: "選んだ色を 16 進で出す",
  })
  .edge("pickerNode", "swatch", { label: "選ぶ", tone: "info" })
  .edge("swatch", "statNode", { label: "表示する", tone: "success" })
  .readout.stat("hexReadout", { source: "accent", label: "選んだ色", caption: "16 進の色" })
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
      body: "選んだ色の 16 進表記が中央に出る。 箱の塗りは選んだ色を見ていないので、色は変わらない。",
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
  "色の入力欄 (color) で選んだ色が、色見本の箱と 16 進の表記に届く";

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
  .input.slider("v", { min: 0, max: 100, defaultValue: 40, label: "値" })
  .state("v", { initial: 40 })
  .state("low25", { initial: 25 })
  .state("mid50", { initial: 50 })
  .state("high75", { initial: 75 })
  .node("barLow", {
    lane: "low",
    stack: 0,
    kind: "dyn-rect",
    title: "低 25%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{low25}", fillMax: 100, orient: "up", fill: "#a08870" },
  })
  .node("barMid", {
    lane: "mid",
    stack: 0,
    kind: "dyn-rect",
    title: "中 50%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{mid50}", fillMax: 100, orient: "up", fill: "#2563eb" },
  })
  .node("barHigh", {
    lane: "high",
    stack: 0,
    kind: "dyn-rect",
    title: "高 75%",
    w: 100,
    h: 240,
    shape: { kind: "rect", source: "{high75}", fillMax: 100, orient: "up", fill: "#f97316" },
  })
  .node("bar", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-rect",
    title: "つまみ ({v}%)",
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
  "塗り割合が 25% / 50% / 75% の四角を並べ、4 つ目だけをつまみで動かして比べる (dyn-rect)";

/**
 * 12. chain fill = 3 個の rect を並列、 base 値の伝搬で各 fill が連動 (EIP1559 相当)。
 */
export const shapeChainFill = diagram("interactive-shape-chain", {
  topic: "3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化",
})
  .lane("l1", { x: 0, width: 130 })
  .lane("l2", { x: 150, width: 130 })
  .lane("l3", { x: 300, width: 130 })
  .input.slider("base", { min: 0, max: 100, defaultValue: 30, label: "元の値" })
  .formula("gas1", "base", { label: "ブロック 1 の手数料" })
  .formula("gas2", "base * 1.2", { label: "ブロック 2 の手数料" })
  .formula("gas3", "base * 1.5", { label: "ブロック 3 の手数料" })
  .state("base", { initial: 30 })
  .state("gas1", { initial: 30 })
  .state("gas2", { initial: 36 })
  .state("gas3", { initial: 45 })
  .node("r1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-rect",
    title: "ブロック 1",
    subtitle: "手数料: {gas1}",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{gas1}", fillMax: 150, orient: "up", fill: "#8a5a2a" },
  })
  .node("r2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-rect",
    title: "ブロック 2",
    subtitle: "手数料: {gas2}",
    w: 100,
    h: 220,
    shape: { kind: "rect", source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" },
  })
  .node("r3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-rect",
    title: "ブロック 3",
    subtitle: "手数料: {gas3}",
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
  .input.slider("p", { min: 0, max: 100, defaultValue: 60, label: "進み具合" })
  .formula("prog", "p / 100", { label: "塗る割合" })
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
    subtitle: "空",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog0}", fill: "#a08870" },
  })
  .node("cThird", {
    lane: "third",
    stack: 0,
    kind: "dyn-circle",
    title: "33%",
    subtitle: "3 分の 1",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog33}", fill: "#2563eb" },
  })
  .node("cTwoThird", {
    lane: "twothird",
    stack: 0,
    kind: "dyn-circle",
    title: "66%",
    subtitle: "3 分の 2",
    w: 160,
    h: 160,
    shape: { kind: "circle", fillProgress: "{prog66}", fill: "#f97316" },
  })
  .node("c", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-circle",
    title: "輪",
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
  "進み具合が 0% / 33% / 66% の輪を並べ、4 つ目だけをつまみで動かして比べる (dyn-circle)";

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
  .input.slider("a", { min: 0, max: 270, defaultValue: 180, label: "角度" })
  .state("a", { initial: 180 })
  .state("a0", { initial: 0 })
  .state("a90", { initial: 90 })
  .state("a180", { initial: 180 })
  .node("gMin", {
    lane: "min",
    stack: 0,
    kind: "dyn-arc",
    title: "0°",
    subtitle: "最小",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#a08870" },
  })
  .node("gQuarter", {
    lane: "quarter",
    stack: 0,
    kind: "dyn-arc",
    title: "90°",
    subtitle: "4 分の 1 周",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" },
  })
  .node("gHalf", {
    lane: "half",
    stack: 0,
    kind: "dyn-arc",
    title: "180°",
    subtitle: "半周",
    w: 180,
    h: 180,
    shape: { kind: "arc", angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" },
  })
  .node("g", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-arc",
    title: "つまみ",
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
  "角度が 0° / 90° / 180° の弧を並べ、4 つ目だけをつまみで動かして比べる (dyn-arc)";

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
  .input.slider("lvl", { min: 0, max: 100, defaultValue: 55, label: "水位" })
  .state("lvl", { initial: 55 })
  .state("lvl25", { initial: 25 })
  .state("lvl50", { initial: 50 })
  .state("lvl75", { initial: 75 })
  .node("wLow", {
    lane: "low",
    stack: 0,
    kind: "dyn-wave",
    title: "低",
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
    title: "半分",
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
    title: "高",
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
    title: "波",
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
  "水位が 25% / 50% / 75% の波を並べ、4 つ目だけをつまみで動かして比べる (dyn-wave)";

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
  .input.slider("rot", { min: 0, max: 360, defaultValue: 0, label: "回転" })
  .input.slider("radius", { min: 20, max: 80, defaultValue: 60, label: "大きさ" })
  .state("rot", { initial: 0 })
  .state("radius", { initial: 60 })
  .state("rot0", { initial: 0 })
  .state("radius60", { initial: 60 })
  .node("polyTri", {
    lane: "triangle",
    stack: 0,
    kind: "dyn-polygon",
    title: "三角形",
    subtitle: "角 3 つ",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#a08870" },
  })
  .node("polyHex", {
    lane: "hexagon",
    stack: 0,
    kind: "dyn-polygon",
    title: "六角形",
    subtitle: "角 6 つ",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" },
  })
  .node("polyOct", {
    lane: "octagon",
    stack: 0,
    kind: "dyn-polygon",
    title: "八角形",
    subtitle: "角 8 つ",
    w: 180,
    h: 180,
    shape: { kind: "polygon", sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" },
  })
  .node("p", {
    lane: "interactive",
    stack: 0,
    kind: "dyn-polygon",
    title: "動かす六角形",
    subtitle: "{rot}° · 大きさ {radius}",
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
  "角が 3 つ / 6 つ / 8 つの多角形を並べ、4 つ目の六角形だけをつまみで回して大きさも変える (dyn-polygon)";

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
  .input.slider("base", { min: 0, max: 60, defaultValue: 20, label: "元の値" })
  // formula chain: gas1 = base、 gas2 = gas1*1.2、 gas3 = gas2*1.2、 gas4 = gas3*1.2、 gas5 = gas4*1.2
  .deriveChain("gas", 5, (i, prev) => (i === 0 ? "base" : `${prev} * 1.2`), {
    label: (i) => `ブロック ${i + 1} の手数料`,
  })
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
    title: `ブロック {i+1}`,
    subtitle: "手数料: {gas{i+1}}",
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
  .input.slider("rev", { min: 0, max: 500, defaultValue: 250, label: "売上" })
  .input.dropdown("status", {
    options: ["受付中", "保留", "終了"],
    defaultValue: "受付中",
    label: "状態",
  })
  .state("rev", { initial: 250 })
  .state("status", { initial: "受付中" })
  .node("countNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 320,
    title: "数え上げ",
    subtitle: "売上 {rev} · ドルで数え上げる",
  })
  .node("deltaNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 240,
    title: "増減",
    subtitle: "売上 {rev} · 矢印で出す",
  })
  .node("ringNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 310,
    title: "割合の円",
    subtitle: "売上 {rev} ÷ 500 の割合",
  })
  .node("textNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 320,
    title: "打ち出し",
    subtitle: "状態 {status} · 1 文字ずつ出す",
  })
  .readout.countup("revCount", { source: "rev", unit: "$", label: "売上の数え上げ" })
  .readout.delta("revDelta", { source: "rev", unit: "$", label: "Δ 増減" })
  .readout.percentRing("revPct", { source: "rev", max: 500, label: "進み具合の円" })
  .readout.typewriter("statusText", { source: "status", charMs: 50, label: "状態の文字" })
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
  "売上と状態の値を、数え上げ / 増減 / 割合の円 / 打ち出す字の 4 つの部品で見せる (countup / delta / percent-ring / typewriter)";

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
  .input.timeline("t", { duration: 3000, autoplay: true, loop: true, label: "時間" })
  .formula("bar", "t * 100", { label: "棒の長さ" })
  .formula("angle", "t * 270", { label: "弧の角度" })
  .state("t", { initial: 0 })
  .state("bar", { initial: 0 })
  .state("angle", { initial: 0 })
  .node("timeNode", {
    lane: "time",
    stack: 0,
    kind: "card",
    title: "時間",
    subtitle: "t は 0〜1 を 3 秒でくり返す",
  })
  .node("r", {
    lane: "bar",
    stack: 0,
    kind: "dyn-rect",
    title: "棒 (四角)",
    subtitle: "棒 = t × 100",
    w: 80,
    h: 200,
    shape: { kind: "rect", source: "{bar}", fillMax: 100, orient: "up", fill: "#8a5a2a" },
  })
  .node("a", {
    lane: "arc",
    stack: 0,
    kind: "dyn-arc",
    title: "弧",
    subtitle: "角度 = t × 270",
    w: 140,
    h: 140,
    shape: { kind: "arc", angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" },
  })
  .edge("timeNode", "r", { label: "→ 棒", tone: "info" })
  // timeNode→a は bar lane を跨ぐ長い edge。 label を bar lane 中央へ寄せて左右余白を確保し、
  // 非発着 lane bar の border 貫通 (lane-border-clearance) を font metric 変動にも耐える形で防ぐ。
  .edge("timeNode", "a", { label: "→ 角度", tone: "accent", labelOffsetX: -45 })
  .readout.countup("timeCu", { source: "bar", unit: "%", label: "時間 (%)" })
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
      body: "計算式の値で四角の高さが決まる。 時間が進むと自動で変わる。",
    },
    (p: PhaseBuilder) => p.activate("timeNode", "r"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "弧にも届く",
      body: "弧の角度は別の計算式 (時間の 270 倍) で決まる。 同じ時間から別々の値を導く。",
    },
    (p: PhaseBuilder) => p.activate("timeNode", "r", "a"),
  )
  .build();
export const subtitle__timelineDrive =
  "3 秒ごとにくり返す時間の値 1 つから、四角の棒の長さと弧の角度を式で求める (timeline)";

/**
 * 20. edge signal binding = 太さ / 色 / dashoffset を signal 追随、 chain の流れを animate。
 */
export const edgeFlowBind = diagram("interactive-edge-flow", {
  topic: "信号で線の太さと色と流れる点が変わる",
})
  .lane("src", { x: 0, width: 230 })
  .lane("pipe", { x: 270, width: 350 })
  .lane("sink", { x: 660, width: 190 })
  .input.slider("flow", { min: 1, max: 15, defaultValue: 5, label: "流れの太さ" })
  .input.timeline("t", { duration: 2000, autoplay: true, loop: true, label: "時間" })
  .input.dropdown("flowColor", {
    options: ["#38bdf8", "#f472b6", "#facc15"],
    defaultValue: "#38bdf8",
    label: "線の色",
  })
  .formula("dash", "t * 24", { label: "点の位置" })
  .state("flow", { initial: 5 })
  .state("t", { initial: 0 })
  .state("dash", { initial: 0 })
  .state("flowColor", { initial: "#38bdf8" })
  .node("a", { lane: "src", stack: 0, kind: "card", w: 180, title: "送り手", subtitle: "作る側" })
  .node("pipeNode", {
    lane: "pipe",
    stack: 0,
    kind: "card",
    w: 300,
    title: "管",
    subtitle: "太さ {flow} · 点の位置 {dash} · 色 {flowColor}",
  })
  .node("b", { lane: "sink", stack: 0, kind: "card", w: 140, title: "受け手", subtitle: "使う側" })
  .edge("a", "pipeNode", {
    label: "送る",
    widthBind: "{flow}",
    strokeBind: "{flowColor}",
    dashOffsetBind: "{dash}",
  })
  .edge("pipeNode", "b", {
    label: "受け取る",
    widthBind: "{flow}",
    strokeBind: "{flowColor}",
    dashOffsetBind: "{dash}",
  })
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
      body: "信号の大きさが線の太さになり、選んだ色が線の色になる。 太いほど多く流れている。",
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
  "送り手から受け手への矢印の太さと色と流れる点の位置を、つまみ / 時間 / 選択の 3 つの入力欄で決める";

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
    label: "価格の範囲",
  })
  .input.multiSelect("tags", {
    options: ["新着", "値下げ", "人気", "おすすめ"],
    defaultValues: ["新着"],
    label: "札",
  })
  .input.tabs("view", { options: ["格子", "一覧", "詰めた一覧"], defaultValue: "格子", label: "表示の形" })
  .input.text("query", {
    defaultValue: "",
    placeholder: "検索する言葉",
    maxLength: 50,
    label: "検索語",
  })
  .state("priceRange", { initial: "200,700" })
  .state("tags", { initial: "新着" })
  .state("view", { initial: "格子" })
  .state("query", { initial: "" })
  .node("rangeNode", {
    lane: "range",
    stack: 0,
    kind: "card",
    w: 310,
    title: "範囲のつまみ",
    subtitle: "価格 = {priceRange}",
  })
  .node("multiNode", {
    lane: "multi",
    stack: 0,
    kind: "card",
    w: 310,
    title: "複数選択",
    subtitle: "札 = {tags}",
  })
  .node("tabsNode", {
    lane: "tabs",
    stack: 0,
    kind: "card",
    w: 180,
    title: "タブ",
    subtitle: "表示 = {view}",
  })
  .node("textNode", {
    lane: "text",
    stack: 0,
    kind: "card",
    w: 270,
    title: "文字の入力",
    subtitle: "検索語 = {query}",
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
  "範囲のつまみ / 複数選択 / 切り替え / 文字の 4 種の入力欄を並べ、入れた値を箱に出す (range / multi-select / tabs / text)";

/**
 * 22. new readouts = heat cell + badge + status dot の合わせ技。
 */
export const readoutVariety = diagram("interactive-readout-variety", {
  topic: "熱セル / バッジ / 状態点の 3 表示を並べる",
})
  .lane("heat", { x: 0, width: 220 })
  .lane("badge", { x: 260, width: 220 })
  .lane("dot", { x: 520, width: 220 })
  .input.slider("temp", { min: 0, max: 100, defaultValue: 42, label: "温度" })
  .input.dropdown("state", {
    options: ["稼働", "停止", "異常"],
    defaultValue: "稼働",
    label: "状態",
  })
  .state("temp", { initial: 42 })
  .state("state", { initial: "稼働" })
  .node("heatNode", {
    lane: "heat",
    stack: 0,
    kind: "card",
    title: "熱の升目",
    subtitle: "温度 {temp} · 色の濃淡",
  })
  .node("badgeNode", {
    lane: "badge",
    stack: 0,
    kind: "card",
    title: "札",
    subtitle: "温度 {temp} · 数字を札で出す",
  })
  .node("dotNode", {
    lane: "dot",
    stack: 0,
    kind: "card",
    title: "状態の点",
    subtitle: "状態 {state} · 色で出す",
  })
  .readout.heatCell("tempHeat", {
    source: "temp",
    min: 0,
    max: 100,
    colors: ["#4e9dc4", "#e57373"],
    label: "温度の濃淡",
  })
  .readout.badge("tempBadge", { source: "temp", label: "値の札" })
  .readout.statusDot("statusRead", {
    source: "state",
    map: [
      { value: "稼働", color: "#22c55e", label: "稼働" },
      { value: "停止", color: "#a08870", label: "停止" },
      { value: "異常", color: "#ef4444", label: "異常" },
    ],
    label: "状態の点",
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
  "温度と状態の値を、色の濃さの升目 / 数の札 / 色の点の 3 つの部品で見せる (heat-cell / badge / status-dot)";

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
    title: "2 回押し",
    subtitle: "2 回続けて押す",
  })
  .node("btn2", {
    lane: "keyboard",
    stack: 0,
    kind: "card",
    title: "選択とキー入力",
    subtitle: "選ぶ / 外れる / キーを押す",
  })
  .node("btn3", {
    lane: "touch",
    stack: 0,
    kind: "card",
    title: "長押し",
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
  "2 回押す / 選ぶ / 外れる / 鍵盤を押す / 長く押すの 5 種の操作を、押す・打つ・触れるの縦列に分けて受け取る";

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
  .input.stepper("r", { min: 0, max: 2, defaultValue: 0, label: "行" })
  .input.stepper("c", { min: 0, max: 3, defaultValue: 0, label: "列" })
  .state("r", { initial: 0 })
  .state("c", { initial: 0 })
  .gridNodes(3, 4, (r, _c) => ({
    id: `cell-{r}-{c}`,
    lane: `col{c}`,
    stack: r,
    kind: "card" as const,
    title: `行 {r} · 列 {c}`,
    subtitle: `縦列 {c} · 段 {r}`,
  }))
  .readout.stat("hover", { source: "r", label: "行" })
  .readout.stat("hoverC", { source: "c", label: "列" })
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
  "3 行 4 列の格子の箱 12 個をまとめて作り、列ごとの縦列に並べる (gridNodes)";

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
  .input.slider("bump", { min: 0, max: 50, defaultValue: 20, label: "1 本目を上書き" })
  .node("summary", {
    lane: "agg",
    stack: 0,
    kind: "card",
    title: "集計",
    subtitle: "件数 {xs.length} · 合計 {xs.sum} · 平均 {xs.avg} · 最大 {xs.max}",
  })
  .node("bumpNode", {
    lane: "agg",
    stack: 1,
    kind: "card",
    title: "上書きのつまみ",
    subtitle: "1 本目だけを上書きするつまみ",
  })
  .node("i0", { lane: "items", stack: 0, kind: "card", title: "#0", subtitle: "値 {xs[0]}" })
  .node("i1", { lane: "items", stack: 1, kind: "card", title: "#1", subtitle: "値 {xs[1]}" })
  .node("i2", { lane: "items", stack: 2, kind: "card", title: "#2", subtitle: "値 {xs[2]}" })
  .node("i3", { lane: "items", stack: 3, kind: "card", title: "#3", subtitle: "値 {xs[3]}" })
  .node("i4", { lane: "items", stack: 4, kind: "card", title: "#4", subtitle: "値 {xs[4]}" })
  .readout.arrayBar("hist", {
    source: "xs",
    min: 0,
    max: 50,
    color: "#2563eb",
    label: "棒グラフ",
  })
  .readout.arrayList("items", {
    source: "xs",
    itemTemplate: "#{i} → {item}",
    max: 6,
    label: "一覧 (箇条書き)",
  })
  .readout.stat("first", { source: "bump", label: "1 本目の値" })
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
  "5 つの数の並びを集計の箱と 1 つずつの箱に分け、棒と一覧の部品でも見せる (array-bar / array-list)";

/**
 * 26. pathProgress readout + visibleIf。 slider で progress、 完了時 badge を visibleIf 経由で表示。
 */
export const pathProgressDemo = diagram("interactive-path-progress", {
  topic: "経路の進捗と完了状態を連動させる",
})
  .lane("state", { x: 0, width: 200 })
  .lane("visual", { x: 240, width: 300 })
  .lane("done", { x: 560, width: 200 })
  .input.slider("progress", { min: 0, max: 100, defaultValue: 40, label: "進み具合" })
  .state("progress", { initial: 40 })
  .state("done", { initial: 0 })
  .formula("done", "progress >= 100 ? 1 : 0", { label: "完了したか" })
  .node("main", {
    lane: "state",
    stack: 0,
    kind: "card",
    title: "作業の状態",
    subtitle: "{progress}% 完了",
  })
  .node("pathNode", {
    lane: "visual",
    stack: 0,
    kind: "card",
    title: "経路の表示",
    subtitle: "線を塗る位置で進みを出す",
  })
  .node("ringNode", {
    lane: "visual",
    stack: 1,
    kind: "card",
    title: "割合の円",
    subtitle: "同時追随",
  })
  .node("ok", {
    lane: "done",
    stack: 0,
    kind: "card",
    title: "✓ 完了",
    subtitle: "100% に達すると表示される",
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
    label: "経路 (ジグザグ)",
  })
  .readout.percentRing("ring", { source: "progress", max: 100, color: "#22c55e", label: "円" })
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
  "つまみの進み具合を折れ曲がった線を塗る位置と割合の円で見せ、100% で完了の印を出す (path-progress)";

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
    title: "時系列",
    subtitle: "{series.length} 件 · 計 {series.sum} · 平均 {series.avg}",
  })
  .node("areaCard", {
    lane: "area",
    stack: 0,
    kind: "card",
    title: "面グラフ",
    subtitle: "青 #2563eb · 高さ 70",
  })
  .node("lineCard", {
    lane: "line",
    stack: 0,
    kind: "card",
    title: "折れ線グラフ",
    subtitle: "橙 #f97316 · 高さ 50",
  })
  .readout.lineChart("chart", {
    source: "series",
    min: 0,
    max: 100,
    viewW: 260,
    viewH: 70,
    color: "#2563eb",
    fill: true,
    label: "面グラフ",
  })
  .readout.lineChart("chartNoFill", {
    source: "series",
    min: 0,
    max: 100,
    viewW: 260,
    viewH: 50,
    color: "#f97316",
    fill: false,
    label: "折れ線グラフ",
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
  "同じ数の並びから、塗りのある折れ線と塗りの無い折れ線の 2 つを描き分ける (line-chart)";

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
    title: "A 群",
    subtitle: "合計 {groupA.sum} · 平均 {groupA.avg} · 最大 {groupA.max}",
  })
  .node("aDetail", {
    lane: "groupA",
    stack: 1,
    kind: "card",
    title: "A の 5 要素",
    subtitle: "系列 A",
  })
  .node("bCard", {
    lane: "groupB",
    stack: 0,
    kind: "card",
    title: "B 群",
    subtitle: "合計 {groupB.sum} · 平均 {groupB.avg} · 最大 {groupB.max}",
  })
  .node("bDetail", {
    lane: "groupB",
    stack: 1,
    kind: "card",
    title: "B の 5 要素",
    subtitle: "系列 B",
  })
  .edge("aCard", "bCard", { label: "A と B の差", tone: "warning" })
  .readout.stackedBar("cmp", {
    sourceA: "groupA",
    sourceB: "groupB",
    min: 0,
    max: 80,
    colorA: "#2563eb",
    colorB: "#f97316",
    label: "A / B (横に並べた棒)",
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
  "A 群と B 群の 2 つの数の並びを、合計と平均の箱と横に並べた棒で比べる (stacked-bar)";

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
    title: "中心",
    subtitle: "ここから 4 本に分かれる",
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
  "中心の箱から 0° / 90° / 180° / 270° の 4 方向へ矢印を伸ばし、上下の縦列に分けて矢印が箱を横切らないように置く";

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
    title: "収支",
    subtitle: "最終 = 合計 = {changes.sum}",
  })
  .readout.waterfall("wf", {
    source: "changes",
    min: -30,
    max: 150,
    viewW: 280,
    viewH: 90,
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "増減 (滝グラフ)",
  })
  .readout.arrayList("items", {
    source: "changes",
    itemTemplate: "段 {i}: {item}",
    label: "各段",
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
  "増えた分と減った分を別の縦列に分け、積み上がって最後の収支に至るまでを段の図で見せる (waterfall)";

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
  .input.slider("dx", { min: -80, max: 80, defaultValue: 0, label: "横のずれ" })
  .input.slider("dy", { min: -40, max: 40, defaultValue: 0, label: "縦のずれ" })
  .state("dx", { initial: 0 })
  .state("dy", { initial: 0 })
  .node("anchor", {
    lane: "anchor-lane",
    stack: 0,
    kind: "card",
    title: "基準の点",
    subtitle: "つまみに追随しない",
  })
  .node("floater", {
    lane: "floater-lane",
    stack: 0,
    kind: "card",
    title: "ずれる点",
    subtitle: "横 {dx} · 縦 {dy}",
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
  "動かない基準の点と、横と縦のつまみで描く位置だけがずれる点を並べる (renderOffset)";

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
    title: "区分 0 ✓",
    subtitle: "上段の正解",
  })
  .node("c0Wrong", {
    lane: "c0",
    stack: 1,
    kind: "card",
    title: "区分 0 ✕",
    subtitle: "上段の取り違え",
  })
  .node("c1Diag", {
    lane: "c1",
    stack: 0,
    kind: "card",
    title: "区分 1 ✓",
    subtitle: "中上段の正解",
  })
  .node("c1Wrong", {
    lane: "c1",
    stack: 1,
    kind: "card",
    title: "区分 1 ✕",
    subtitle: "中上段の取り違え",
  })
  .node("c2Diag", {
    lane: "c2",
    stack: 0,
    kind: "card",
    title: "区分 2 ✓",
    subtitle: "中下段の正解",
  })
  .node("c2Wrong", {
    lane: "c2",
    stack: 1,
    kind: "card",
    title: "区分 2 ✕",
    subtitle: "中下段の取り違え",
  })
  .node("c3Diag", {
    lane: "c3",
    stack: 0,
    kind: "card",
    title: "区分 3 ✓",
    subtitle: "下段の正解",
  })
  .node("c3Wrong", {
    lane: "c3",
    stack: 1,
    kind: "card",
    title: "区分 3 ✕",
    subtitle: "下段の取り違え",
  })
  .readout.matrix("m", {
    source: "cm",
    min: 0,
    max: 10,
    cellSize: 30,
    showValue: true,
    colors: ["#f0f4f8", "#0369a1"] as const,
    label: "予測の結果 (4×4)",
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
  "4 つの区分ごとに正解と取り違えを箱に分け、4×4 の升目を色の濃さで見せる (matrix)";

/**
 * 33. progress-group readout = 4 task の progress を label + bar list で表示。
 */
export const taskProgressGroup = diagram("interactive-progress-group", {
  topic: "4 件の進捗を達成 / 遅れで分けて見せる",
})
  .lane("advanced", { x: 0, width: 240 })
  .lane("behind", { x: 300, width: 240 })
  .arraySignal("progress", [40, 75, 20, 90])
  .arraySignal("names", ["設計", "実装", "テスト", "文書"])
  .node("implNode", {
    lane: "advanced",
    stack: 0,
    kind: "card",
    title: "実装",
    subtitle: "{progress[1]}%",
  })
  .node("docsNode", {
    lane: "advanced",
    stack: 1,
    kind: "card",
    title: "文書",
    subtitle: "{progress[3]}%",
  })
  .node("designNode", {
    lane: "behind",
    stack: 0,
    kind: "card",
    title: "設計",
    subtitle: "{progress[0]}%",
  })
  .node("testNode", {
    lane: "behind",
    stack: 1,
    kind: "card",
    title: "テスト",
    subtitle: "{progress[2]}%",
  })
  .readout.progressGroup("tasks", {
    source: "progress",
    max: 100,
    labelSource: "names",
    color: "#2563eb",
    label: "作業ごとの進み具合",
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
  "4 件の作業を 50% 以上と未満の縦列に分け、進み具合をまとめて出す部品で並べる (progress-group)";

/**
 * 34. domain example = EIP-1559 gas cost model。
 *     slider で base fee → 3 block の実 gas cost が waterfall + stacked-bar で並列可視化。
 */
export const eip1559GasFlow = diagram("interactive-eip1559", {
  topic: "EIP-1559 の手数料が 3 ブロックで変わる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 300 })
  .input.slider("baseFee", { min: 10, max: 200, defaultValue: 50, label: "基準手数料 (gwei)" })
  .input.slider("priority", { min: 1, max: 30, defaultValue: 5, label: "優先手数料" })
  .state("baseFee", { initial: 50 })
  .state("priority", { initial: 5 })
  .arraySignal("burned", [50, 60, 72])
  .arraySignal("tips", [5, 8, 10])
  .formula("total1", "baseFee + priority", { label: "ブロック N の手数料" })
  .formula("total2", "(baseFee + priority) * 12 / 10", { label: "ブロック N+1 の手数料" })
  .formula("total3", "(baseFee + priority) * 15 / 10", { label: "ブロック N+2 の手数料" })
  .state("total1", { initial: 55 })
  .state("total2", { initial: 66 })
  .state("total3", { initial: 82 })
  .node("wallet", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 320,
    title: "財布",
    subtitle: "基準 {baseFee} + 優先 {priority} gwei",
  })
  .node("b1", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 240,
    title: "ブロック N",
    subtitle: "×1.0 = {total1} gwei",
  })
  .node("b2", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 250,
    title: "ブロック N+1",
    subtitle: "×1.2 = {total2} gwei",
  })
  .node("b3", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 250,
    title: "ブロック N+2",
    subtitle: "×1.5 = {total3} gwei",
  })
  .edge("wallet", "b1", { label: "取引を送る", sub: "基準 + 優先", tone: "info" })
  .edge("b1", "b2", { label: "次のブロック", sub: "手数料 +20%", tone: "warning" })
  .edge("b2", "b3", { label: "次のブロック", sub: "手数料 +25%", tone: "error" })
  .readout.stackedBar("gas", {
    sourceA: "burned",
    sourceB: "tips",
    min: 0,
    max: 120,
    colorA: "#ef4444",
    colorB: "#22c55e",
    label: "ブロックごとの焼却分 / 優先分",
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
  "基準と優先の手数料のつまみから 3 つのブロックの手数料を式で求め、焼却分と優先分を積み上げた棒で見せる";

/**
 * 35. domain example = OAuth 2.0 authorization code flow の sequence timeline。
 */
export const interactiveOauthFlow = diagram("interactive-oauth-flow", {
  topic: "OAuth 認可コードの往復を追う",
})
  .lane("user", { x: 0, width: 220 })
  .lane("auth", { x: 320, width: 220 })
  .lane("resource", { x: 640, width: 220 })
  .input.slider("delay", { min: 0, max: 300, defaultValue: 50, label: "サーバーの遅れ (ms)" })
  .state("delay", { initial: 50 })
  .arraySignal("events", [
    [0, "押す"],
    [100, "認可画面へ"],
    [200, "同意"],
    [350, "コード発行"],
    [500, "トークン発行"],
    [650, "資源応答"],
  ] as unknown as (string | number)[])
  .node("client", {
    lane: "user",
    stack: 0,
    kind: "card",
    title: "閲覧ソフト",
    subtitle: "利用者が操作する",
  })
  .node("consent", {
    lane: "auth",
    stack: 0,
    kind: "card",
    title: "認可サーバー",
    subtitle: "遅れ {delay}ms",
  })
  .node("api", {
    lane: "resource",
    stack: 0,
    kind: "card",
    title: "資源サーバー",
    subtitle: "API の窓口",
  })
  // 1-4 は閲覧ソフトと認可サーバーの往復 4 本。 label の位置は engine に任せる。
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
  // 情報は落としていない = 送る値 (識別子 / 認可コード) と承認する人を label 本体に書き込んだ。 pill は
  // 横に伸びるが縦には伸びないので、 束の縦幅は変わらない。
  //
  // lane 間隔は関係しない = cdl が label 幅に合わせて自動で広げるため、 宣言値を変えても実配置は
  // 変わらない (実測 = 320/640 と 620/1240 のどちらでも lane x が 0/1008/2016)。
  .edge("client", "consent", { label: "1. 認可画面へ移す (識別子付き)", tone: "info" })
  .edge("consent", "client", {
    label: "2. 同意画面 (利用者が承認)",
    tone: "info",
    side: "left",
  })
  .edge("client", "consent", {
    id: "code-exchange",
    label: "3. 認可コードを引き換える",
    tone: "accent",
  })
  .edge("consent", "client", {
    id: "token-issue",
    label: "4. アクセストークンを発行",
    tone: "success",
    side: "left",
  })
  // 5-6 は認可サーバーを跨いで閲覧ソフトと資源サーバーをつなぐ。 どちらも迂回するため、 何もしないと
  // 2 本の迂回が同じ高さで重なり label も同じ点に乗る (実測 = 重なり面積 12215)。 6 を下
  // (side: "bottom") に回して迂回の向きを分け、 6 の label だけ下へ 120 離す。 5 側にも offset を
  // 足すと label が path から 170 離れて edge-label-proximity warn が出て、 図の高さが 19% 増える。
  .edge("client", "api", { label: "5. API を呼ぶ", sub: "トークンを添える", tone: "accent" })
  .edge("api", "client", {
    label: "6. 応答",
    sub: "保護された情報",
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
    label: "やり取りの時刻",
  })
  .readout.stat("finalDelay", { source: "delay", unit: "ms", label: "遅れ" })
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
      body: "コードをトークンに引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("client", "consent", "api")
        .set(
          "events",
          '[[0,"認可要求"],[120,"コード発行"],[260,"トークン交換"],[380,"トークン発行"],[500,"資源要求"],[620,"資源応答"]]',
        ),
  )
  .build();
export const subtitle__interactiveOauthFlow =
  "利用者 / 認可サーバー / 資源サーバーの間を 6 本の矢印で往復し、サーバーの遅れをつまみで変える (OAuth)";

/**
 * 36. domain example = tree diagram = decision tree 3 level (2^3 = 7 node)。
 */
export const decisionTree = diagram("interactive-decision-tree", {
  topic: "3 段の決定木が 4 つの葉に分岐する",
})
  .lane("root", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("leaf", { x: 480, width: 240 })
  .node("node-0", { lane: "root", stack: 1, kind: "card", title: "問い 1", subtitle: "#0 (起点)" })
  .node("node-1", { lane: "mid", stack: 0, kind: "card", title: "問い 2", subtitle: "#1" })
  .node("node-2", { lane: "mid", stack: 2, kind: "card", title: "問い 3", subtitle: "#2" })
  .node("node-3", { lane: "leaf", stack: 0, kind: "card", title: "結果 1", subtitle: "#3" })
  .node("node-4", { lane: "leaf", stack: 1, kind: "card", title: "結果 2", subtitle: "#4" })
  .node("node-5", { lane: "leaf", stack: 2, kind: "card", title: "結果 3", subtitle: "#5" })
  .node("node-6", { lane: "leaf", stack: 3, kind: "card", title: "結果 4", subtitle: "#6" })
  // completely-binary tree: 0 -> 1,2 / 1 -> 3,4 / 2 -> 5,6
  .edge("node-0", "node-1", { label: "○", tone: "success" })
  .edge("node-0", "node-2", { label: "×", tone: "error" })
  .edge("node-1", "node-3", { label: "○", tone: "success" })
  .edge("node-1", "node-4", { label: "×", tone: "error" })
  .edge("node-2", "node-5", { label: "○", tone: "success" })
  .edge("node-2", "node-6", { label: "×", tone: "error" })
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
  "問いの答え (○ / ×) で 2 つずつ枝分かれして 4 つの結果に至り、親と子の高さを揃えて矢印が箱を横切らないように置く";

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
  .arraySignal("skillNames", ["設計", "実装", "テスト", "文書", "不具合の調査"])
  .node("designNode", {
    lane: "strong",
    stack: 0,
    kind: "card",
    title: "設計",
    subtitle: "{skills[0]}/10",
  })
  .node("testNode", {
    lane: "strong",
    stack: 1,
    kind: "card",
    title: "テスト",
    subtitle: "{skills[2]}/10",
  })
  .node("debugNode", {
    lane: "strong",
    stack: 2,
    kind: "card",
    title: "不具合の調査",
    subtitle: "{skills[4]}/10",
  })
  .node("implNode", {
    lane: "middle",
    stack: 0,
    kind: "card",
    title: "実装",
    subtitle: "{skills[1]}/10",
  })
  .node("docsNode", {
    lane: "weak",
    stack: 0,
    kind: "card",
    title: "文書",
    subtitle: "{skills[3]}/10",
  })
  .readout.radar("radar", {
    source: "skills",
    max: 10,
    labelSource: "skillNames",
    color: "#2563eb",
    viewW: 200,
    viewH: 200,
    label: "5 技能の多角形",
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
  "5 つの技能を 7 以上 / 5〜6 / 5 未満の縦列に分け、多角形の部品で形を見せる (radar)";

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
    title: "処理 B",
    subtitle: "中央寄りの処理",
  })
  .node("w3", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "処理 C",
    subtitle: "右上に位置する処理",
  })
  .node("w5", {
    lane: "high",
    stack: 2,
    kind: "card",
    title: "処理 E",
    subtitle: "左上に位置する処理",
  })
  .node("w1", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "処理 A",
    subtitle: "左下に位置する処理",
  })
  .node("w4", {
    lane: "low",
    stack: 1,
    kind: "card",
    title: "処理 D",
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
    label: "処理ごとの負荷 (3 軸の円)",
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
  "5 種の処理を負荷 7 以上と未満の縦列に分け、3 つの軸を持つ円の大きさで比べる (bubble-chart)";

/**
 * 39. donut chart = portfolio share (asset allocation) を multi-segment donut 表示。
 */
export const portfolioDonut = diagram("interactive-portfolio-donut", {
  topic: "資産 4 種を伝統 / 代替に分けて見せる",
})
  .lane("traditional", { x: 0, width: 300 })
  .lane("alternative", { x: 340, width: 300 })
  .arraySignal("assets", [45, 30, 15, 10])
  .arraySignal("assetNames", ["株式", "債券", "現金", "暗号資産"])
  .node("stocksNode", {
    lane: "traditional",
    stack: 0,
    kind: "card",
    title: "株式",
    subtitle: "{assets[0]}%",
  })
  .node("bondsNode", {
    lane: "traditional",
    stack: 1,
    kind: "card",
    title: "債券",
    subtitle: "{assets[1]}%",
  })
  .node("cashNode", {
    lane: "alternative",
    stack: 0,
    kind: "card",
    title: "現金",
    subtitle: "{assets[2]}%",
  })
  .node("cryptoNode", {
    lane: "alternative",
    stack: 1,
    kind: "card",
    title: "暗号資産",
    subtitle: "{assets[3]}%",
  })
  .node("totalNode", {
    lane: "traditional",
    stack: 2,
    kind: "card",
    title: "資産全体",
    subtitle: "合計 {assets.sum}% · 最大 {assets.max}%",
  })
  .readout.donut("d", {
    source: "assets",
    innerRatio: 0.55,
    viewW: 160,
    viewH: 160,
    label: "配分の円",
  })
  .readout.arrayList("legend", { source: "assetNames", itemTemplate: "● {item}", label: "凡例" })
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
        .set("assetNames", '["株式","債券","現金","暗号資産"]'),
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
        .set("assetNames", '["株式","債券","暗号資産","現金"]'),
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
        .set("assetNames", '["株式","債券","現金","暗号資産"]'),
  )
  .build();
export const subtitle__portfolioDonut =
  "株式と債券を伝統的な資産、現金と暗号資産を代替の資産に分け、配分を輪の部品で見せる (donut)";

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
  .input.slider("revenueInput", { min: 10, max: 500, defaultValue: 120, label: "月の売上 (千ドル)" })
  .state("revenueInput", { initial: 120 })
  .formula("users", "revenueInput * 8", { label: "利用者" })
  .formula("churn", "50 - revenueInput / 10", { label: "解約率" })
  .formula("nps", "revenueInput / 2 + 20", { label: "推奨度" })
  .state("users", { initial: 960 })
  .state("churn", { initial: 38 })
  .state("nps", { initial: 80 })
  .node("revCard", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    title: "売上",
    subtitle: "月 {revenueInput} 千ドル",
  })
  .node("usersCard", {
    lane: "users",
    stack: 0,
    kind: "card",
    title: "利用者",
    subtitle: "{users} 人が利用中",
  })
  .node("churnCard", {
    lane: "churn",
    stack: 0,
    kind: "card",
    title: "解約率",
    subtitle: "月 {churn}%",
  })
  .node("npsCard", {
    lane: "nps",
    stack: 0,
    kind: "card",
    title: "推奨度",
    subtitle: "{nps} 点",
  })
  .edge("revCard", "usersCard", { label: "×8", sub: "獲得", tone: "info" })
  .edge("revCard", "churnCard", { label: "逆に動く", sub: "50 − 売上/10", tone: "error" })
  .edge("revCard", "npsCard", {
    label: "同じ向きに動く",
    sub: "売上/2 + 20",
    tone: "success",
    side: "bottom",
  })
  .readout.stat("rev", { source: "revenueInput", unit: " 千ドル", label: "売上" })
  .readout.stat("usr", { source: "users", label: "利用者" })
  .readout.gauge("chr", { source: "churn", min: 0, max: 60, color: "#ef4444", label: "解約率 (%)" })
  .readout.percentRing("np", { source: "nps", max: 100, color: "#22c55e", label: "推奨度" })
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
  "月の売上をつまみで動かすと利用者 / 解約率 / 推奨度の 3 指標が式で決まり、4 つの指標を並べて見せる";

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
    title: "A 案",
    subtitle: "平均 {convA.avg}%",
  })
  .node("splitCard", {
    lane: "split",
    stack: 0,
    kind: "card",
    w: 200,
    title: "振り分け",
    subtitle: "割合 {splitData[0]} / {splitData[1]}",
  })
  .node("treatmentCard", {
    lane: "varB",
    stack: 0,
    kind: "card",
    w: 250,
    title: "B 案",
    subtitle: "平均 {convB.avg}%",
  })
  .edge("splitCard", "controlCard", { label: "50%", sub: "対照群", tone: "info", side: "left" })
  .edge("splitCard", "treatmentCard", { label: "50%", sub: "試験群", tone: "success" })
  .readout.stackedBar("conv", {
    sourceA: "convA",
    sourceB: "convB",
    min: 30,
    max: 70,
    colorA: "#a08870",
    colorB: "#22c55e",
    label: "日ごとの成約率 (A と B)",
  })
  .readout.donut("splitDonut", {
    source: "splitData",
    innerRatio: 0.5,
    viewW: 120,
    viewH: 120,
    label: "振り分けの割合",
  })
  .readout.donut("winner", {
    source: "results",
    innerRatio: 0.6,
    viewW: 120,
    viewH: 120,
    colors: ["#22c55e", "#a08870"] as const,
    label: "勝った割合 (緑が B)",
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
  "振り分けから A 案と B 案へ半分ずつ矢印を引き、日ごとの成約率と勝った割合を部品で並べる (stacked-bar / donut)";

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
    title: "1〜3 月",
    subtitle: "静かな期間",
  })
  .node("q2Card", {
    lane: "q2",
    stack: 0,
    kind: "card",
    title: "4〜6 月",
    subtitle: "活発な期間",
  })
  .node("q3Card", {
    lane: "q3",
    stack: 0,
    kind: "card",
    title: "7〜9 月",
    subtitle: "落ち着く期間",
  })
  .node("q4Card", {
    lane: "q4",
    stack: 0,
    kind: "card",
    title: "10〜12 月",
    subtitle: "全体の推移",
  })
  .node("totalCard", {
    lane: "q4",
    stack: 1,
    kind: "card",
    title: "1 年の合計",
    subtitle: "合計 {commits.sum} · 最大 {commits.max} · 平均 {commits.avg}",
  })
  .readout.calendarHeatmap("h", {
    source: "commits",
    max: 10,
    cellSize: 10,
    cellGap: 2,
    label: "1 年 (53 週 × 7 日)",
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
  "1 年の活動を 3 か月ごとの箱に分けて合計と最大を出し、53 週 × 7 日の升目を色の濃さで見せる (calendar-heatmap)";

/**
 * 43. mini-map = 大 canvas 1000×800 上の 400×300 viewport を slider で移動、 mini-map で追従。
 */
export const canvasMiniMap = diagram("interactive-canvas-minimap", {
  topic: "全体図の中で今見ている範囲を示す",
})
  .lane("xpan", { x: 0, width: 200 })
  .lane("ypan", { x: 240, width: 200 })
  .lane("map", { x: 480, width: 260 })
  .input.slider("panX", { min: 0, max: 600, defaultValue: 300, label: "横の移動" })
  .input.slider("panY", { min: 0, max: 500, defaultValue: 250, label: "縦の移動" })
  .state("panX", { initial: 300 })
  .state("panY", { initial: 250 })
  .arraySignal("viewport", [300, 250, 400, 300])
  .node("xNode", {
    lane: "xpan",
    stack: 0,
    kind: "card",
    title: "横の移動",
    subtitle: "{panX}px (0〜600)",
  })
  .node("yNode", {
    lane: "ypan",
    stack: 0,
    kind: "card",
    title: "縦の移動",
    subtitle: "{panY}px (0〜500)",
  })
  .node("mapNode", {
    lane: "map",
    stack: 0,
    kind: "card",
    title: "小窓",
    subtitle: "({panX}, {panY}) から 400×300",
  })
  .readout.miniMap("map", {
    source: "viewport",
    canvasW: 1000,
    canvasH: 800,
    viewW: 200,
    viewH: 160,
    color: "#2563eb",
    label: "全体図 (小窓)",
  })
  .readout.stat("panXStat", { source: "panX", unit: "px", label: "横の移動量" })
  .readout.stat("panYStat", { source: "panY", unit: "px", label: "縦の移動量" })
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
  "横と縦の移動のつまみで、全体図の中の小窓の位置を動かす (mini-map)";

/**
 * 44. kpi-card = revenue の現在値 + 直前値との delta + 6 point history sparkline を composite。
 */
export const revenueKpiCard = diagram("interactive-revenue-kpi", {
  topic: "前期と今期の売上を推移付きで比べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 350 })
  .input.slider("current", { min: 50, max: 300, defaultValue: 180, label: "今期の売上 (千ドル)" })
  .state("current", { initial: 180 })
  .state("prev", { initial: 150 })
  .arraySignal("history", [120, 135, 148, 152, 165, 170])
  .node("prevNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 220,
    title: "前期",
    subtitle: "{prev} 千ドル (基準)",
  })
  .node("currNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 300,
    title: "◆ 今期",
    subtitle: "{current} 千ドル (つまみで動く)",
  })
  .node("trendNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "推移",
    subtitle: "6 か月の折れ線 (120〜170 千ドル)",
  })
  .edge("prevNode", "currNode", { label: "差 = 今期 − 前期", tone: "success" })
  .edge("currNode", "trendNode", { label: "折れ線の右端", tone: "info" })
  .readout.kpiCard("kpi", {
    source: "current",
    historySource: "history",
    comparisonSource: "prev",
    unit: " 千ドル",
    colorPos: "#22c55e",
    colorNeg: "#ef4444",
    label: "売上の指標 (まとめ表示)",
  })
  .readout.stat("prevStat", { source: "prev", unit: " 千ドル", label: "前期の値" })
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
  "前期と今期の売上の差を矢印で示し、6 か月の推移とまとめて 1 枚の部品で見せる (kpi-card)";

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
    title: "1 日目 ▲",
    subtitle: "始 100 → 終 105 (+5)",
  })
  .node("d3", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "3 日目 ▲",
    subtitle: "始 102 → 終 104 (+2)",
  })
  .node("d4", {
    lane: "up",
    stack: 2,
    kind: "card",
    title: "4 日目 ▲",
    subtitle: "始 104 → 終 111 (+7)",
  })
  .node("d6", {
    lane: "up",
    stack: 3,
    kind: "card",
    title: "6 日目 ▲",
    subtitle: "始 109 → 終 112 (+3)",
  })
  .node("d7", {
    lane: "up",
    stack: 4,
    kind: "card",
    title: "7 日目 ▲",
    subtitle: "始 112 → 終 116 (+4)",
  })
  .node("d8", {
    lane: "up",
    stack: 5,
    kind: "card",
    title: "8 日目 ▲",
    subtitle: "始 116 → 終 118 (+2)",
  })
  .node("d2", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "2 日目 ▼",
    subtitle: "始 105 → 終 102 (-3)",
  })
  .node("d5", {
    lane: "down",
    stack: 1,
    kind: "card",
    title: "5 日目 ▼",
    subtitle: "始 111 → 終 109 (-2)",
  })
  .readout.candlestick("chart", {
    source: "ohlc",
    min: 95,
    max: 122,
    viewW: 300,
    viewH: 110,
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "ろうそく足 (4 本値)",
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
  "8 日分の始値と終値を上がった日と下がった日の縦列に分け、ろうそく足の部品で見せる (candlestick)";

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
    title: "利用者の全体",
    subtitle: "A 全体 {sets[0]} · 共通 {sets[2]}",
  })
  .node("bothNode", {
    lane: "both",
    stack: 0,
    kind: "card",
    title: "両方 (A ∩ B)",
    subtitle: "共通 = {sets[2]}",
  })
  .node("payersOnlyNode", {
    lane: "payersOnly",
    stack: 0,
    kind: "card",
    title: "支払う人の全体",
    subtitle: "B 全体 = {sets[1]}",
  })
  .node("totalNode", {
    lane: "both",
    stack: 1,
    kind: "card",
    title: "全体",
    subtitle: "A={sets[0]} · B={sets[1]}",
  })
  .readout.venn("v", {
    source: "sets",
    viewW: 220,
    viewH: 140,
    colorA: "#2563eb",
    colorB: "#f97316",
    labelA: "利用者",
    labelB: "支払う人",
    label: "重なり (2 つの集まり)",
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
  "利用者と支払う人の 2 つの集まりを、利用者だけ / 両方 / 支払う人だけの 3 つの領域に分けて重なりを見せる (venn)";

/**
 * 47. slope chart = 5 student の test score before/after 変化を slope で表示。
 */
export const scoreSlope = diagram("interactive-score-slope", {
  topic: "5 人の点数変化を上昇 / 下降で分ける",
})
  .lane("up", { x: 0, width: 300 })
  .lane("down", { x: 340, width: 300 })
  .arraySignal("scores", [
    [65, 82, "佐藤"],
    [70, 68, "鈴木"],
    [55, 78, "高橋"],
    [80, 88, "田中"],
    [60, 55, "伊藤"],
  ] as unknown as (string | number)[])
  .node("aliceNode", { lane: "up", stack: 0, kind: "card", title: "佐藤 ↑", subtitle: "1 人目" })
  .node("carolNode", { lane: "up", stack: 1, kind: "card", title: "高橋 ↑", subtitle: "3 人目" })
  .node("danNode", { lane: "up", stack: 2, kind: "card", title: "田中 ↑", subtitle: "4 人目" })
  .node("bobNode", { lane: "down", stack: 0, kind: "card", title: "鈴木 ↓", subtitle: "2 人目" })
  .node("eveNode", { lane: "down", stack: 1, kind: "card", title: "伊藤 ↓", subtitle: "5 人目" })
  .readout.slope("s", {
    source: "scores",
    min: 40,
    max: 100,
    viewW: 260,
    viewH: 160,
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "点数の変化 (傾き)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "横並び",
      body: "前後で点数が変わらない状態。 線が水平に並ぶ。",
    },
    (p: PhaseBuilder) =>
      p.activate("aliceNode").set("scores", '[[65,65,"佐藤"],[70,70,"鈴木"],[55,55,"高橋"]]'),
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
          '[[65,82,"佐藤"],[70,68,"鈴木"],[55,78,"高橋"],[80,88,"田中"],[60,55,"伊藤"]]',
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
          '[[65,72,"佐藤"],[70,60,"鈴木"],[55,90,"高橋"],[80,75,"田中"],[60,85,"伊藤"]]',
        ),
  )
  .build();
export const subtitle__scoreSlope =
  "5 人の点数を上がった人と下がった人の縦列に分け、前後の点を結ぶ傾きで見せる (slope)";

/**
 * 48. sales funnel = 4 stage の conversion funnel (Visit → Signup → Trial → Paid)。
 */
export const salesFunnel = diagram("interactive-sales-funnel", {
  topic: "訪問から購入までの絞り込みを追う",
})
  .lane("col1", { x: 0, width: 220 })
  .lane("col2", { x: 260, width: 270 })
  .arraySignal("stages", [
    ["訪問", 1000],
    ["登録", 400],
    ["試用", 150],
    ["購入", 40],
  ] as unknown as (string | number)[])
  .node("visitNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 160,
    title: "訪問",
    subtitle: "漏斗の入口",
  })
  .node("signupNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 180,
    title: "登録",
    subtitle: "登録に進む段",
  })
  .node("trialNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 170,
    title: "試用",
    subtitle: "試用に進む段",
  })
  .node("paidNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 220,
    title: "購入",
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
    label: "歩留まり (台形)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "入口だけ",
      body: "訪問だけがある状態。 漏斗の一番上が広い。",
    },
    (p: PhaseBuilder) =>
      p.activate("visitNode").set("stages", '[["訪問",1000],["登録",0],["試用",0],["購入",0]]'),
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
        .set("stages", '[["訪問",1000],["登録",400],["試用",150],["購入",40]]'),
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
        .set("stages", '[["訪問",1000],["登録",620],["試用",340],["購入",130]]'),
  )
  .build();
export const subtitle__salesFunnel =
  "訪問 → 登録 → 試用 → 購入の 4 段を矢印でつなぎ、進むほど減る人数を台形の部品で見せる (funnel)";

/**
 * 49. project gantt = 4 task を 10 day timeline 上に配置。
 */
export const projectGantt = diagram("interactive-project-gantt", {
  topic: "4 工程の期間を横棒で並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 330 })
  .arraySignal("tasks", [
    ["設計", 0, 3],
    ["実装", 3, 5],
    ["テスト", 6, 3],
    ["公開", 9, 1],
  ] as unknown as (string | number)[])
  .node("designNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 200,
    title: "設計",
    subtitle: "最初の工程",
  })
  .node("implNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 280,
    title: "実装",
    subtitle: "最も長い工程",
  })
  .node("testNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "テスト",
    subtitle: "実装と重なる工程",
  })
  .node("shipNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 210,
    title: "公開",
    subtitle: "最後の工程",
  })
  .edge("designNode", "implNode", { label: "引き継ぐ", tone: "info" })
  .edge("implNode", "testNode", { label: "テスト開始", tone: "accent" })
  .edge("testNode", "shipNode", { label: "公開する", tone: "success" })
  .readout.gantt("g", {
    source: "tasks",
    min: 0,
    max: 10,
    viewW: 320,
    viewH: 140,
    color: "#2563eb",
    label: "工程表 (横棒)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "設計だけ",
      body: "最初の作業だけが置かれた状態。 帯が 1 本。",
    },
    (p: PhaseBuilder) => p.activate("designNode").set("tasks", '[["設計",0,3]]'),
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
        .set("tasks", '[["設計",0,3],["実装",3,5],["テスト",6,3]]'),
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
        .set("tasks", '[["設計",0,3],["実装",2,6],["テスト",6,4],["公開",9,1]]'),
  )
  .build();
export const subtitle__projectGantt =
  "設計 → 実装 → テスト → 公開の 4 工程を矢印で引き継ぎ、期間を横棒の工程表で見せる (gantt)";

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
    ["開発", 45],
    ["営業", 20],
    ["宣伝", 15],
    ["窓口", 10],
    ["運用", 6],
    ["法務", 4],
  ] as unknown as (string | number)[])
  .node("engNode", {
    lane: "major",
    stack: 0,
    kind: "card",
    title: "開発",
    subtitle: "最も大きい区画",
  })
  .node("salesNode", {
    lane: "major",
    stack: 1,
    kind: "card",
    title: "営業",
    subtitle: "2 番目に大きい",
  })
  .node("mktNode", {
    lane: "major",
    stack: 2,
    kind: "card",
    title: "宣伝",
    subtitle: "中位の区画",
  })
  .node("supportNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "窓口",
    subtitle: "小さめの区画",
  })
  .node("opsNode", { lane: "mid", stack: 1, kind: "card", title: "運用", subtitle: "小さい区画" })
  .node("legalNode", {
    lane: "minor",
    stack: 0,
    kind: "card",
    title: "法務",
    subtitle: "最も小さい区画",
  })
  .readout.treemap("t", { source: "teams", viewW: 280, viewH: 200, label: "予算 (面積)" })
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
          '[["開発",19],["営業",18],["宣伝",17],["窓口",16],["運用",15],["法務",14]]',
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
          '[["開発",45],["営業",20],["宣伝",15],["窓口",10],["運用",6],["法務",4]]',
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
          '[["開発",30],["営業",28],["宣伝",18],["窓口",12],["運用",8],["法務",4]]',
        ),
  )
  .build();
export const subtitle__resourceTreemap =
  "6 つの部署の予算を 15% 以上 / 5〜14% / 5% 未満の縦列に分け、面積の大きさで比べる (treemap)";

/**
 * 51. sankey flow = traffic source → landing → conversion の flow diagram。
 */
export const trafficSankey = diagram("interactive-traffic-sankey", {
  topic: "流入 3 経路が 1 つの成果に合流する",
})
  // 帯の間隔を書いておく理由 (cdl#789)。
  // engine は「名札 1 枚が入る隙間」 しか確保しない。 この図は 3 本の流入が 2 つの行き先へ
  // 合流し、1 つの隙間に名札を 3 枚並べるので元から足りておらず、engine が余分に広げていた分が
  // それを隠していた。 その余分が無くなったので、必要な間隔をここで書く。
  // 392 刻みは engine が `0.42.0` まで実際に取っていた間隔 (582) に戻す値で、
  // 図の幅も当時と同じ 1656 になる。 260 のままだと 3 件出る =
  // `search-product` と `social-product` の名札が 476 重なり、`search-product` の名札が
  // 線から 85px 離れ (閾値 80px)、経路の交差が 3 件になる。
  .lane("src", { x: 0, width: 180 })
  .lane("land", { x: 392, width: 180 })
  .lane("cv", { x: 784, width: 180 })
  .arraySignal("flows", [
    ["検索", "入口", 40],
    ["検索", "商品", 30],
    ["SNS", "入口", 25],
    ["SNS", "商品", 15],
    ["直接", "入口", 20],
    ["直接", "商品", 10],
  ] as unknown as (string | number)[])
  .node("search", {
    lane: "src",
    stack: 0,
    kind: "card",
    title: "検索",
    subtitle: "検索からの流入",
  })
  .node("social", {
    lane: "src",
    stack: 1,
    kind: "card",
    title: "SNS",
    subtitle: "SNS からの流入",
  })
  .node("direct", { lane: "src", stack: 2, kind: "card", title: "直接", subtitle: "直接の流入" })
  .node("home", { lane: "land", stack: 0, kind: "card", title: "入口", subtitle: "入口ページ" })
  .node("product", {
    lane: "land",
    stack: 1,
    kind: "card",
    title: "商品",
    subtitle: "商品ページ",
  })
  .node("checkout", {
    lane: "cv",
    stack: 0,
    kind: "card",
    title: "購入",
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
  .edge("social", "home", {
    label: "25",
    tone: "info",
    // 縦に降りる区間 (x=412) の中点に置くと、 direct → home の縦区間 (x=438) と 26 しか
    // 離れず pill が貫く (cdl 0.23.0 で通り道が 26 ずれた結果)。 左へ寄せて 2 本の間から外す。
    labelOffsetX: -40,
  })
  .edge("social", "product", { label: "15", tone: "info" })
  .edge("direct", "home", { label: "20", tone: "accent" })
  .edge("direct", "product", { label: "10", tone: "accent" })
  .edge("home", "checkout", { label: "85", tone: "warning" })
  .edge("product", "checkout", { label: "55", tone: "warning" })
  .readout.sankey("s", {
    source: "flows",
    viewW: 340,
    viewH: 220,
    label: "流入元 → ページ (帯の太さ)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 経路",
      body: "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。",
    },
    (p: PhaseBuilder) => p.activate("search", "home").set("flows", '[["検索","入口",40]]'),
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
          '[["検索","入口",40],["検索","商品",30],["SNS","入口",25],["SNS","商品",15]]',
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
          '[["検索","入口",40],["検索","商品",30],["SNS","入口",25],["SNS","商品",15],["直接","入口",20],["直接","商品",10]]',
        ),
  )
  .build();
export const subtitle__trafficSankey =
  "検索 / SNS / 直接の 3 つの流入元から入口と商品の画面を経て購入に至る人数を、帯の太さで見せる (sankey)";

/**
 * 52. polar-area = 7 day activity distribution。
 */
export const activityPolar = diagram("interactive-activity-polar", {
  topic: "1 週間の活動を平日 / 週末に分ける",
})
  .lane("weekday", { x: 0, width: 300 })
  .lane("weekend", { x: 380, width: 220 })
  .arraySignal("hours", [3, 5, 8, 6, 7, 4, 2])
  .arraySignal("days", ["月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"])
  .node("monNode", {
    lane: "weekday",
    stack: 0,
    kind: "card",
    title: "月曜",
    subtitle: "{hours[0]} 時間",
  })
  .node("tueNode", {
    lane: "weekday",
    stack: 1,
    kind: "card",
    title: "火曜",
    subtitle: "{hours[1]} 時間",
  })
  .node("wedNode", {
    lane: "weekday",
    stack: 2,
    kind: "card",
    title: "水曜",
    subtitle: "{hours[2]} 時間",
  })
  .node("thuNode", {
    lane: "weekday",
    stack: 3,
    kind: "card",
    title: "木曜",
    subtitle: "{hours[3]} 時間",
  })
  .node("friNode", {
    lane: "weekday",
    stack: 4,
    kind: "card",
    title: "金曜",
    subtitle: "{hours[4]} 時間",
  })
  .node("satNode", {
    lane: "weekend",
    stack: 0,
    kind: "card",
    title: "土曜",
    subtitle: "{hours[5]} 時間",
  })
  .node("sunNode", {
    lane: "weekend",
    stack: 1,
    kind: "card",
    title: "日曜",
    subtitle: "{hours[6]} 時間",
  })
  .readout.polarArea("p", {
    source: "hours",
    max: 10,
    labelSource: "days",
    viewW: 220,
    viewH: 220,
    label: "時間 (扇形)",
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
  "曜日ごとの活動時間を平日と週末の縦列に分け、扇形の部品で見せる (polar-area)";

/**
 * 53. step-indicator = onboarding 5 step wizard、 slider で current step を切替。
 */
export const onboardingStepper = diagram("interactive-onboarding-stepper", {
  topic: "5 段の初期設定ウィザードを追う",
})
  .lane("col1", { x: 0, width: 250 })
  .lane("col2", { x: 290, width: 340 })
  .lane("col3", { x: 670, width: 190 })
  .input.stepper("current", { min: 0, max: 4, defaultValue: 2, label: "いまの段" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["登録", "自己紹介", "好みの設定", "本人確認", "完了"])
  .node("signupNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 200,
    title: "登録",
    subtitle: "アカウント作成",
  })
  .node("profileNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 200,
    title: "自己紹介",
    subtitle: "名前と写真",
  })
  .node("prefsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 290,
    title: "好みの設定",
    subtitle: "設定選択 (現在地)",
  })
  .node("verifyNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 180,
    title: "本人確認",
    subtitle: "認証確認",
  })
  .node("doneNode", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 140,
    title: "完了",
    subtitle: "利用開始",
  })
  .edge("signupNode", "profileNode", { label: "次へ", tone: "info" })
  .edge("profileNode", "prefsNode", { label: "次へ", tone: "info" })
  .edge("prefsNode", "verifyNode", { label: "次へ", tone: "accent" })
  .edge("verifyNode", "doneNode", { label: "終える", tone: "success" })
  .readout.stepIndicator("wizard", {
    source: "current",
    stepsSource: "steps",
    viewW: 360,
    viewH: 60,
    colorActive: "#2563eb",
    colorPending: "#cbd5e1",
    label: "進み具合 (点の並び)",
  })
  .phase("p1", { duration: 1200, title: "最初の 2 段", body: "" }, (p: PhaseBuilder) =>
    p.activate("signupNode").badge("手順"),
  )
  .phase("p2", { duration: 1200, title: "中ほどまで", body: "" }, (p: PhaseBuilder) =>
    p.activate("signupNode", "profileNode", "prefsNode").badge("手順"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "最後まで",
      body: "5 段がすべて並び、最後の完了まで線でつながる。 線の色は前半 (青)、本人確認の手前 (強調)、完了 (緑) で分けてある。 下の点の並びは、いまの段までを塗る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("signupNode", "profileNode", "prefsNode", "verifyNode", "doneNode")
        .badge("手順"),
  )
  .build();
export const subtitle__onboardingStepper =
  "登録から利用開始までの 5 段を矢印でつなぎ、いまの段を点の並びで示す (step-indicator)";

/**
 * 54. bullet-chart = KPI actual vs target + 3 range、 slider で actual 変化 → 3 range のどこにいるか可視化。
 */
export const kpiBullet = diagram("interactive-kpi-bullet", {
  topic: "実績と目標を良 / 並 / 悪の帯で見せる",
})
  .lane("bad", { x: 0, width: 180 })
  .lane("avg", { x: 220, width: 180 })
  .lane("good", { x: 440, width: 220 })
  .input.slider("actual", { min: 0, max: 100, defaultValue: 55, label: "実績" })
  .state("actual", { initial: 55 })
  .state("target", { initial: 80 })
  .node("badRange", {
    lane: "bad",
    stack: 0,
    kind: "card",
    title: "悪い帯",
    subtitle: "0〜40 (赤)",
  })
  .node("avgRange", {
    lane: "avg",
    stack: 0,
    kind: "card",
    title: "並の帯",
    subtitle: "40〜70 (黄) · 実績 {actual} はここ",
  })
  .node("goodRange", {
    lane: "good",
    stack: 0,
    kind: "card",
    title: "良い帯",
    subtitle: "70〜100 (緑) · 目標 {target}",
  })
  .node("actualNode", {
    lane: "avg",
    stack: 1,
    kind: "card",
    title: "◆ 実績",
    subtitle: "{actual}",
  })
  .node("targetNode", {
    lane: "good",
    stack: 1,
    kind: "card",
    title: "▼ 目標",
    subtitle: "{target}",
  })
  .edge("actualNode", "targetNode", { label: "差 = 目標 - 実績", tone: "warning" })
  .readout.bulletChart("b", {
    source: "actual",
    targetSource: "target",
    max: 100,
    rangeBad: 40,
    rangeAvg: 70,
    viewW: 320,
    viewH: 40,
    colorActual: "#241c14",
    label: "進み具合 (帯と目標線)",
  })
  .readout.stat("targetStat", { source: "target", label: "目標" })
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
  "実績が悪い / 並 / 良いの 3 つの帯のどこに入るかを示し、目標との差を矢印で出す (bullet-chart)";

/**
 * 55. number-board = 大 numeric display、 slider で revenue を score board 表示。
 */
export const revenueScoreboard = diagram("interactive-revenue-scoreboard", {
  topic: "売上の現在 / 目標 / 差分を並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 250 })
  .input.slider("rev", { min: 0, max: 999, defaultValue: 234, label: "売上" })
  .state("rev", { initial: 234 })
  .node("currentNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 270,
    title: "◆ いまの売上",
    subtitle: "${rev}M (つまみで変わる)",
  })
  .node("targetNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 200,
    title: "目標",
    subtitle: "$500M (第 3 四半期の目標)",
  })
  .node("gapNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "差",
    subtitle: "目標 - いまの売上",
  })
  .edge("currentNode", "targetNode", { label: "進み具合", tone: "info" })
  .edge("targetNode", "gapNode", { label: "差", tone: "warning" })
  .readout.numberBoard("nb", {
    source: "rev",
    prefix: "$",
    suffix: "M",
    size: 56,
    color: "#241c14",
    caption: "目標 $500M と比べる",
    label: "売上 (大きな数字)",
  })
  .phase("p1", { duration: 1200, title: "現在を見る", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode").badge("大きな数字"),
  )
  .phase("p2", { duration: 1200, title: "目標を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode", "targetNode").badge("大きな数字"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "差を出す",
      body: "いまの売上、目標、目標までの差の 3 つが並ぶ。 つまみで売上を動かすと、いまの売上の箱と下の大きな数字が一緒に変わる。",
    },
    (p: PhaseBuilder) => p.activate("currentNode", "targetNode", "gapNode").badge("大きな数字"),
  )
  .build();
export const subtitle__revenueScoreboard =
  "いまの売上をつまみで動かし、第 3 四半期の目標との差を大きな数字の部品で見せる (number-board)";

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
    ["佐藤", 920],
    ["鈴木", 780],
    ["高橋", 850],
    ["田中", 680],
    ["伊藤", 890],
    ["渡辺", 720],
  ] as unknown as (string | number)[])
  .node("aliceNode", {
    lane: "top",
    stack: 0,
    kind: "card",
    title: "🥇 1 位 佐藤",
    subtitle: "首位",
  })
  .node("eveNode", { lane: "top", stack: 1, kind: "card", title: "🥈 2 位 伊藤", subtitle: "上位" })
  .node("carolNode", {
    lane: "top",
    stack: 2,
    kind: "card",
    title: "🥉 3 位 高橋",
    subtitle: "上位",
  })
  .node("bobNode", { lane: "middle", stack: 0, kind: "card", title: "4 位 鈴木", subtitle: "中位" })
  .node("frankNode", {
    lane: "middle",
    stack: 1,
    kind: "card",
    title: "5 位 渡辺",
    subtitle: "表示の末尾",
  })
  .node("danNode", { lane: "bottom", stack: 0, kind: "card", title: "6 位 田中", subtitle: "表示の外 (上位 5 人まで)" })
  .readout.leaderboard("lb", {
    source: "players",
    max: 5,
    color: "#2563eb",
    label: "順位 (上位 5 人)",
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
        .set("players", '[["佐藤",920],["鈴木",915],["高橋",910],["田中",905],["伊藤",900]]'),
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
        .set("players", '[["佐藤",1180],["伊藤",890],["高橋",850],["鈴木",780],["渡辺",720]]'),
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
          '[["高橋",1240],["佐藤",1180],["渡辺",1050],["伊藤",890],["鈴木",780],["田中",680]]',
        ),
  )
  .build();
export const subtitle__playerLeaderboard =
  "6 人を上位 3 人 / 中位 2 人 / 表示の外の 1 人に分け、上位 5 人までを順位の部品で見せる (leaderboard)";

/**
 * 57. traffic-light = 3-color status、 dropdown で red/yellow/green 選択 → active dot が glow 表示。
 *
 * 選択肢の名前 (`label`) の有無を変種で見比べる (#1920)。 名前を書くと選択肢と箱の `{status}` を
 * `失敗` / `実行中` / `成功` と描き、書かないと値 (`red` / `yellow` / `green`) をそのまま描く。
 * 信号の灯りはどちらも値を綴りで読むので、同じ灯りが点く。
 * 名前の有無のほかは同じ図なので、組み立てを 1 本にして 2 度書かない。
 */
function ビルドの信号の図(id: string, 名前: boolean) {
  const 選択肢 = (value: string, label: string) => (名前 ? { value, label } : value);
  return diagram(id, {
    topic: "ビルド状態を信号機の 3 色で見せる",
  })
    .lane("red", { x: 0, width: 200 })
    .lane("yellow", { x: 240, width: 200 })
    .lane("green", { x: 480, width: 200 })
    .input.dropdown("status", {
      options: [選択肢("red", "失敗"), 選択肢("yellow", "実行中"), 選択肢("green", "成功")],
      defaultValue: "green",
      label: "ビルドの状態",
    })
    .state("status", { initial: "green" })
    .node("redNode", {
      lane: "red",
      stack: 0,
      kind: "card",
      title: "● 赤",
      subtitle: "ビルド失敗 · 要修正",
    })
    .node("yellowNode", {
      lane: "yellow",
      stack: 0,
      kind: "card",
      title: "● 黄",
      subtitle: "ビルド実行中 · 待機",
    })
    .node("greenNode", {
      lane: "green",
      stack: 0,
      kind: "card",
      title: "● 緑",
      subtitle: "ビルド成功 · 配備できる",
    })
    .node("currentCI", {
      lane: "green",
      stack: 1,
      kind: "card",
      title: "◆ いまのビルド",
      subtitle: "状態: {status}",
    })
    .readout.trafficLight("tl", {
      source: "status",
      viewW: 70,
      viewH: 180,
      label: "状態 (3 色の灯り)",
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
}
export const buildStatusTrafficLight = ビルドの信号の図("interactive-build-traffic-light", true);
export const patternBase__buildStatusTrafficLight = "名前で描く";
export const pattern__buildStatusTrafficLight__値のまま描く = ビルドの信号の図(
  "interactive-build-traffic-light-bare",
  false,
);
export const subtitle__buildStatusTrafficLight =
  "ビルドの状態を赤 / 黄 / 緑の縦列に分け、選んだ状態を信号機の 3 色の灯りで示す (traffic-light)";

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
    label: "技術の語 (大きさ = 使用量)",
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
  "8 つの技術を使用量 20 以上 / 10〜19 / 10 未満の縦列に分け、語の大きさで重みを見せる (tag-cloud)";

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
    ["佐藤", "変更を送った", "2 分前"],
    ["鈴木", "変更依頼 #42 を出した", "8 分前"],
    ["高橋", "変更依頼 #40 を確かめた", "15 分前"],
    ["田中", "変更依頼 #38 を取り込んだ", "1 時間前"],
    ["伊藤", "v1.2 を配備した", "3 時間前"],
  ] as unknown as (string | number)[])
  .node("e1", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 300,
    title: "佐藤",
    subtitle: "最新の出来事",
  })
  .node("e2", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 290,
    title: "鈴木",
    subtitle: "次に新しい出来事",
  })
  .node("e3", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "高橋",
    subtitle: "中ほどの出来事",
  })
  .node("e4", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 270,
    title: "田中",
    subtitle: "やや古い出来事",
  })
  .node("e5", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 270,
    title: "伊藤",
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
    label: "最近の出来事 (新しい順)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 件だけ",
      body: "出来事が 1 件だけある状態。 一覧の先頭に入る。",
    },
    (p: PhaseBuilder) => p.activate("e1").set("events", '[["佐藤","変更を送った","2 分前"]]'),
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
          '[["佐藤","変更を送った","2 分前"],["鈴木","変更依頼 #42 を出した","8 分前"],["高橋","変更依頼 #40 を確かめた","15 分前"]]',
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
          '[["田中","v2.0 を公開した","1 分前"],["佐藤","変更を送った","2 分前"],["鈴木","変更依頼 #42 を出した","8 分前"],["高橋","変更依頼 #40 を確かめた","15 分前"],["伊藤","変更依頼 #38 を取り込んだ","1 時間前"]]',
        ),
  )
  .build();
export const subtitle__teamActivityFeed =
  "5 人の出来事を新しい順に矢印でつなぎ、最近の出来事の一覧で見せる (activity-feed)";

/**
 * 60. rating = 5 star rating を slider (0-5) で表示、 half-star 対応。
 */
export const productRating = diagram("interactive-product-rating", {
  topic: "商品評価を低 / 中 / 高の帯で見せる",
})
  .lane("low", { x: 0, width: 220 })
  .lane("mid", { x: 260, width: 220 })
  .lane("high", { x: 520, width: 220 })
  .input.slider("score", { min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "評価" })
  .state("score", { initial: 3.5 })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "低い帯",
    subtitle: "星 0〜1.5 · 不満",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "中の帯",
    subtitle: "星 2〜3.5 · ふつう",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "高い帯",
    subtitle: "星 4〜5 · とても良い",
  })
  .node("currentNode", {
    lane: "mid",
    stack: 1,
    kind: "card",
    title: "◆ いまの評価",
    subtitle: "{score} / 5",
  })
  .readout.rating("r", {
    source: "score",
    count: 5,
    color: "#eab308",
    label: "評価 (星の数)",
  })
  .phase("p1", { duration: 1200, title: "帯を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("評価"),
  )
  .phase("p2", { duration: 1200, title: "現在の帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("評価"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの評価",
      body: "低 / 中 / 高の 3 つの帯と、いまの評価が並ぶ。 つまみを 0.5 刻みで動かすと、下の星の数が半分の星まで含めて変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentNode").badge("評価"),
  )
  .build();
export const subtitle__productRating =
  "商品の評価を星 0〜1.5 / 2〜3.5 / 4〜5 の帯に分け、つまみで決めた評価を星の数で示す (rating)";

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
    // 値は通知の色を綴りで選ぶので英語のまま。 選択肢と箱の {kind} は名前で描く (#1920)
    options: [
      { value: "info", label: "情報" },
      { value: "warn", label: "注意" },
      { value: "error", label: "異常" },
      { value: "success", label: "成功" },
    ],
    defaultValue: "warn",
    label: "種類",
  })
  .state("kind", { initial: "warn" })
  .state("title", { initial: "配備しています" })
  // 値の名前に `body` を使わない (#1389)。 段の項目 (`body:`) と同じ語で、記法に写すと
  // 1 つの図に `body:` が 2 つの意味で並ぶ (`lib/catalog-state-names.test.ts` が止める)
  .state("alertBody", { initial: "本番用に v1.2.3 を組み立て中" })
  .node("infoNode", {
    lane: "info",
    stack: 0,
    kind: "card",
    title: "ℹ 情報",
    subtitle: "青 · お知らせ",
  })
  .node("warnNode", {
    lane: "warn",
    stack: 0,
    kind: "card",
    title: "⚠ 注意",
    subtitle: "黄 · 気を付ける (初期値)",
  })
  .node("errorNode", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "✕ 異常",
    subtitle: "赤 · 失敗した",
  })
  .node("successNode", {
    lane: "success",
    stack: 0,
    kind: "card",
    title: "✓ 成功",
    subtitle: "緑 · 終わった",
  })
  .node("currentAlert", {
    lane: "warn",
    stack: 1,
    kind: "card",
    title: "◆ いまの通知",
    subtitle: "種類: {kind}",
  })
  .readout.notification("nt", {
    kindSource: "kind",
    titleSource: "title",
    bodySource: "alertBody",
    label: "通知 (色と記号)",
  })
  .phase("p1", { duration: 1200, title: "情報と注意", body: "" }, (p: PhaseBuilder) =>
    p.activate("infoNode").badge("通知"),
  )
  .phase("p2", { duration: 1200, title: "異常と成功", body: "" }, (p: PhaseBuilder) =>
    p.activate("infoNode", "warnNode", "errorNode").badge("通知"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの通知",
      body: "4 種の通知が並び、いま選んでいる種類を下の箱が示す。 選択欄で種類を変えると、通知の色と記号 (ℹ / ⚠ / ✕ / ✓) が変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("infoNode", "warnNode", "errorNode", "successNode", "currentAlert").badge("通知"),
  )
  .build();
export const subtitle__alertNotification =
  "知らせを情報 / 注意 / 異常 / 成功の 4 種に分け、選んだ種類を色と記号の部品で示す (notification)";

/**
 * 62. diff-counter = git commit style +N/-N、 stepper で additions / deletions 変化。
 */
export const commitDiffCounter = diagram("interactive-commit-diff", {
  topic: "追加行と削除行から差し引きを出す",
})
  .lane("adds", { x: 0, width: 260 })
  .lane("dels", { x: 300, width: 260 })
  .input.stepper("add", { min: 0, max: 500, step: 10, defaultValue: 120, label: "追加した行" })
  .input.stepper("del", { min: 0, max: 500, step: 10, defaultValue: 45, label: "削除した行" })
  .state("add", { initial: 120 })
  .state("del", { initial: 45 })
  .node("addCard", {
    lane: "adds",
    stack: 0,
    kind: "card",
    title: "+ 追加",
    subtitle: "+{add} 行 (緑)",
  })
  .node("addDetail", {
    lane: "adds",
    stack: 1,
    kind: "card",
    title: "追加が多い時",
    subtitle: "追加 > 削除 → 行が増える",
  })
  .node("delCard", {
    lane: "dels",
    stack: 0,
    kind: "card",
    title: "- 削除",
    subtitle: "-{del} 行 (赤)",
  })
  .node("delDetail", {
    lane: "dels",
    stack: 1,
    kind: "card",
    title: "片付け",
    subtitle: "使わないコードを消す",
  })
  .edge("addCard", "delCard", { label: "差し引き = 追加 - 削除", tone: "info" })
  .readout.diffCounter("dc", {
    additionsSource: "add",
    deletionsSource: "del",
    colorAdd: "#22c55e",
    colorDel: "#ef4444",
    label: "差分 (+N / -N の棒)",
  })
  .phase("p1", { duration: 1200, title: "追加を見る", body: "" }, (p: PhaseBuilder) =>
    p.activate("addCard").badge("差分"),
  )
  .phase("p2", { duration: 1200, title: "削除を並べる", body: "" }, (p: PhaseBuilder) =>
    p.activate("addCard", "addDetail").badge("差分"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "差し引き",
      body: "追加を左、削除を右に分け、差し引きを線で示す。 増減の操作で行数を変えると、下の棒の緑と赤の比率が変わる。",
    },
    (p: PhaseBuilder) => p.activate("addCard", "addDetail", "delCard", "delDetail").badge("差分"),
  )
  .build();
export const subtitle__commitDiffCounter =
  "追加した行と削除した行の数を増減の入力欄で決め、差し引きを +N / -N の棒で見せる (diff-counter)";

/**
 * 63. chat-bubble = customer support conversation 5 message、 self/other 左右寄せ表示。
 */
export const supportChat = diagram("interactive-support-chat", {
  topic: "問い合わせ 5 通を客 / 担当で分ける",
})
  .lane("customer", { x: 0, width: 280 })
  .lane("support", { x: 320, width: 320 })
  .arraySignal("thread", [
    ["佐藤", "注文のことで困っています", false],
    ["窓口", "承知しました。 注文番号を教えてください", true],
    ["佐藤", "#12345", false],
    ["窓口", "確認しています…", true],
    ["窓口", "返金しました。 3〜5 日で反映されます", true],
  ] as unknown as (string | number)[])
  .node("cust1", {
    lane: "customer",
    stack: 0,
    kind: "card",
    title: "佐藤 #1",
    subtitle: "利用者の 1 通目",
  })
  .node("cust2", {
    lane: "customer",
    stack: 1,
    kind: "card",
    title: "佐藤 #2",
    subtitle: "利用者の 2 通目",
  })
  .node("sup1", {
    lane: "support",
    stack: 0,
    kind: "card",
    title: "窓口 #1",
    subtitle: "応対側の 1 通目",
  })
  .node("sup2", {
    lane: "support",
    stack: 1,
    kind: "card",
    title: "窓口 #2",
    subtitle: "確認中の返答",
  })
  .node("sup3", {
    lane: "support",
    stack: 2,
    kind: "card",
    title: "窓口 #3",
    subtitle: "解決の返答",
  })
  .readout.chatBubble("cb", {
    source: "thread",
    max: 6,
    colorSelf: "#2563eb",
    colorOther: "#f0e0b8",
    label: "やり取り (吹き出し)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "問い合わせ",
      body: "利用者からの 1 通目。 左側に吹き出しが出る。",
    },
    (p: PhaseBuilder) =>
      p.activate("cust1").set("thread", '[["佐藤","注文のことで困っています",false]]'),
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
          '[["佐藤","注文のことで困っています",false],["窓口","承知しました。 注文番号を教えてください",true],["佐藤","#12345",false]]',
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
          '[["佐藤","注文のことで困っています",false],["窓口","承知しました。 注文番号を教えてください",true],["佐藤","#12345",false],["窓口","確認しています…",true],["窓口","返金しました。 3〜5 日で反映されます",true]]',
        ),
  )
  .build();
export const subtitle__supportChat =
  "問い合わせの 5 通を利用者と窓口の縦列に分け、吹き出しのやり取りで見せる (chat-bubble)";

/**
 * 64. avatar = user profile avatar、 text input で name 変化 → initials + color circle 追随。
 */
export const userAvatar = diagram("interactive-user-avatar", {
  topic: "名前からアイコン画像を組み立てる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.text("user", {
    defaultValue: "佐藤 花子",
    placeholder: "氏名",
    maxLength: 40,
    label: "名前",
  })
  .state("user", { initial: "佐藤 花子" })
  .node("inputNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 270,
    title: "文字の入力",
    subtitle: "名前 = {user}",
  })
  .node("initialsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "頭文字",
    subtitle: "語ごとの頭の 1 字を 2 つまで (佐藤 花子 → 佐花)",
  })
  .node("circleNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "丸",
    subtitle: "大きさ 56 · 青い丸に頭文字",
  })
  .edge("inputNode", "initialsNode", { label: "切り出す", tone: "info" })
  .edge("initialsNode", "circleNode", { label: "描く", tone: "success" })
  .readout.avatar("av", { source: "user", size: 56, color: "#2563eb", label: "アイコン (描いた結果)" })
  .phase("p1", { duration: 1200, title: "名前を受ける", body: "" }, (p: PhaseBuilder) =>
    p.activate("inputNode").badge("アイコン"),
  )
  .phase("p2", { duration: 1200, title: "頭文字を取る", body: "" }, (p: PhaseBuilder) =>
    p.activate("inputNode", "initialsNode").badge("アイコン"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "絵にする",
      body: "名前を受け、頭文字を取り、丸に描くまでの 3 段が並ぶ。 入力欄の名前を書き換えると、3 つの箱と下のアイコンが一緒に変わる。",
    },
    (p: PhaseBuilder) => p.activate("inputNode", "initialsNode", "circleNode").badge("アイコン"),
  )
  .build();
export const subtitle__userAvatar =
  "入力した名前から語ごとの頭文字を取り出し、青い丸に描いて利用者の印にする (avatar)";

/**
 * 65. checklist = sprint task list 6 item、 progress% 表示。
 */
export const sprintChecklist = diagram("interactive-sprint-checklist", {
  topic: "6 タスクを完了 / 未完了で分ける",
})
  .lane("done", { x: 0, width: 240 })
  .lane("todo", { x: 300, width: 240 })
  .arraySignal("tasks", [
    ["自動検査を整える", true],
    ["テストを書く", true],
    ["不具合 #42 を直す", false],
    ["変更を確かめる", false],
    ["配備", false],
    ["振り返り", false],
  ] as unknown as (string | number)[])
  .node("t1", { lane: "done", stack: 0, kind: "card", title: "✓ 自動検査を整える", subtitle: "完了" })
  .node("t2", { lane: "done", stack: 1, kind: "card", title: "✓ テストを書く", subtitle: "完了" })
  .node("t3", {
    lane: "todo",
    stack: 0,
    kind: "card",
    title: "不具合 #42 を直す",
    subtitle: "未完了 (他を止める)",
  })
  .node("t4", {
    lane: "todo",
    stack: 1,
    kind: "card",
    title: "変更を確かめる",
    subtitle: "未完了 (確かめる人を待つ)",
  })
  .node("t5", {
    lane: "todo",
    stack: 2,
    kind: "card",
    title: "配備",
    subtitle: "未完了 (確かめた後)",
  })
  .node("t6", {
    lane: "todo",
    stack: 3,
    kind: "card",
    title: "振り返り",
    subtitle: "未完了 (最後)",
  })
  .readout.checklist("cl", { source: "tasks", color: "#22c55e", label: "進み具合" })
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
          '[["自動検査を整える",false],["テストを書く",false],["不具合 #42 を直す",false],["変更を確かめる",false],["配備",false],["振り返り",false]]',
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
          '[["自動検査を整える",true],["テストを書く",true],["不具合 #42 を直す",true],["変更を確かめる",false],["配備",false],["振り返り",false]]',
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
          '[["自動検査を整える",true],["テストを書く",true],["不具合 #42 を直す",true],["変更を確かめる",true],["配備",true],["振り返り",false]]',
        ),
  )
  .build();
export const subtitle__sprintChecklist =
  "6 件の作業を完了と未完了の縦列に分け、進み具合を印の付いた一覧で見せる (checklist)";

/**
 * 66. circular-gauge = engine RPM を 270° dial で表示、 slider で 0-8000 rpm 制御。
 */
export const engineTachometer = diagram("interactive-engine-tachometer", {
  topic: "回転数を通常 / 巡航 / 過回転で見せる",
})
  .lane("idle", { x: 0, width: 200 })
  .lane("cruise", { x: 240, width: 200 })
  .lane("redline", { x: 480, width: 200 })
  .input.slider("rpm", { min: 0, max: 8000, defaultValue: 3500, label: "回転数" })
  .state("rpm", { initial: 3500 })
  .node("idleNode", {
    lane: "idle",
    stack: 0,
    kind: "card",
    title: "通常の帯",
    subtitle: "0〜2000 rpm (緑)",
  })
  .node("cruiseNode", {
    lane: "cruise",
    stack: 0,
    kind: "card",
    title: "巡航の帯",
    subtitle: "2000〜5000 rpm (黄)",
  })
  .node("redlineNode", {
    lane: "redline",
    stack: 0,
    kind: "card",
    title: "過回転",
    subtitle: "5000〜8000 rpm (赤) · 注意",
  })
  .node("currentRpm", {
    lane: "cruise",
    stack: 1,
    kind: "card",
    title: "◆ いまの回転数",
    subtitle: "{rpm} rpm (初期値 3500 = 巡航)",
  })
  .readout.circularGauge("g", {
    source: "rpm",
    min: 0,
    max: 8000,
    unit: "rpm",
    color: "#f97316",
    viewW: 200,
    viewH: 160,
    label: "回転計 (270° の目盛盤)",
  })
  .phase("p1", { duration: 1200, title: "通常と巡航", body: "" }, (p: PhaseBuilder) =>
    p.activate("idleNode").badge("回転計"),
  )
  .phase("p2", { duration: 1200, title: "過回転まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("idleNode", "cruiseNode").badge("回転計"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの回転数",
      body: "通常 / 巡航 / 過回転の 3 つの帯と、いまの回転数が並ぶ。 つまみで回転数を動かすと、下の目盛盤の針が動く。",
    },
    (p: PhaseBuilder) =>
      p.activate("idleNode", "cruiseNode", "redlineNode", "currentRpm").badge("回転計"),
  )
  .build();
export const subtitle__engineTachometer =
  "回転数を通常 / 巡航 / 過回転の帯に分け、つまみで決めた回転数を 270° の目盛盤で示す (circular-gauge)";

/**
 * 67. price-tag = e-commerce 商品価格、 stepper で newPrice 変化 → discount % 自動計算。
 */
export const productPriceTag = diagram("interactive-product-price-tag", {
  topic: "旧価格 / 新価格 / 割引率を並べる",
})
  .lane("col1", { x: 0, width: 370 })
  .lane("col2", { x: 410, width: 370 })
  .input.stepper("newPrice", { min: 0, max: 200, step: 5, defaultValue: 65, label: "新価格" })
  .state("newPrice", { initial: 65 })
  .state("oldPrice", { initial: 100 })
  .node("oldNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 310,
    title: "旧価格",
    subtitle: "${oldPrice} (取り消し線)",
  })
  .node("newNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 320,
    title: "新価格",
    subtitle: "${newPrice} (増減で変わる)",
  })
  .node("discountNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 320,
    title: "割引率 (%)",
    subtitle: "(旧 - 新) / 旧 · 赤い札",
  })
  .edge("oldNode", "newNode", { label: "値下げ", tone: "warning" })
  .edge("newNode", "discountNode", { label: "%", tone: "error" })
  .readout.priceTag("pt", {
    oldSource: "oldPrice",
    newSource: "newPrice",
    currency: "$",
    colorNew: "#241c14",
    colorOld: "#a08870",
    colorDiscount: "#ef4444",
    label: "値札 (3 つの値)",
  })
  .phase("p1", { duration: 1200, title: "旧価格", body: "" }, (p: PhaseBuilder) =>
    p.activate("oldNode").badge("値札"),
  )
  .phase("p2", { duration: 1200, title: "新価格", body: "" }, (p: PhaseBuilder) =>
    p.activate("oldNode", "newNode").badge("値札"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "割引率",
      body: "旧価格、新価格、割引率の 3 つが並ぶ。 増減の操作で新価格を変えると、下の値札の取り消し線と大きな数字と赤い札が一緒に変わる。",
    },
    (p: PhaseBuilder) => p.activate("oldNode", "newNode", "discountNode").badge("値札"),
  )
  .build();
export const subtitle__productPriceTag =
  "新価格を増減の入力欄で決めて旧価格からの割引率を求め、3 つの値を値札の部品にまとめる (price-tag)";

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
    // 値は回る印を綴りで選ぶので英語のまま。 選択肢と箱の {status} は名前で描く (#1920)
    options: [
      { value: "running", label: "実行中" },
      { value: "done", label: "完了" },
      { value: "error", label: "失敗" },
    ],
    defaultValue: "running",
    label: "状態",
  })
  .input.text("msg", {
    defaultValue: "本番用に組み立てています",
    placeholder: "状態の説明",
    maxLength: 60,
    label: "知らせる文",
  })
  .state("status", { initial: "running" })
  .state("msg", { initial: "本番用に組み立てています" })
  .node("runningNode", {
    lane: "running",
    stack: 0,
    kind: "card",
    title: "◐ 実行中",
    subtitle: "青 · 回る輪",
  })
  .node("doneNode", {
    lane: "done",
    stack: 0,
    kind: "card",
    title: "✓ 完了",
    subtitle: "緑 · 配備に成功",
  })
  .node("errorNode", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "✕ 失敗",
    subtitle: "赤 · 配備に失敗",
  })
  .node("currentState", {
    lane: "running",
    stack: 1,
    kind: "card",
    title: "◆ いまの配備",
    subtitle: "状態: {status} · {msg}",
  })
  .readout.spinner("sp", {
    source: "status",
    textSource: "msg",
    color: "#2563eb",
    label: "配備 (回る輪と文)",
  })
  .phase("p1", { duration: 1200, title: "実行中", body: "" }, (p: PhaseBuilder) =>
    p.activate("runningNode").badge("配備中"),
  )
  .phase("p2", { duration: 1200, title: "完了と失敗", body: "" }, (p: PhaseBuilder) =>
    p.activate("runningNode", "doneNode").badge("配備中"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの状態",
      body: "実行中 / 完了 / 失敗の 3 列と、いまの配備の箱が並ぶ。 状態を選ぶと、下の輪の形と色が選んだ状態に変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("runningNode", "doneNode", "errorNode", "currentState").badge("配備中"),
  )
  .build();
export const subtitle__deploySpinner =
  "配備の状態を実行中 / 完了 / 失敗に分け、選んだ状態と知らせる文を回る輪で示す (spinner)";

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
  .input.slider("score", { min: 0, max: 100, defaultValue: 85, label: "点数" })
  .state("score", { initial: 85 })
  .node("aNode", { lane: "A", stack: 0, kind: "card", title: "A", subtitle: "90 以上 (緑)" })
  .node("bNode", {
    lane: "B",
    stack: 0,
    kind: "card",
    title: "B",
    subtitle: "80〜89 (青、初期値はここ)",
  })
  .node("cNode", { lane: "C", stack: 0, kind: "card", title: "C", subtitle: "70〜79 (黄)" })
  .node("dNode", { lane: "D", stack: 0, kind: "card", title: "D", subtitle: "60〜69 (橙)" })
  .node("fNode", { lane: "F", stack: 0, kind: "card", title: "F", subtitle: "60 未満 (赤)" })
  .node("currentGrade", {
    lane: "B",
    stack: 1,
    kind: "card",
    title: "◆ いまの成績",
    subtitle: "点数 = {score} / 100",
  })
  .readout.grade("g", { source: "score", max: 100, label: "成績 (A〜F の帯)" })
  .phase("p1", { duration: 1200, title: "上の 2 段階", body: "" }, (p: PhaseBuilder) =>
    p.activate("aNode", "bNode").badge("成績"),
  )
  .phase("p2", { duration: 1200, title: "下の 3 段階", body: "" }, (p: PhaseBuilder) =>
    p.activate("aNode", "bNode", "cNode", "dNode").badge("成績"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの成績",
      body: "A〜F の 5 段階と、いまの成績の箱が並ぶ。 点数を動かすと、下の成績の字と色が点数の入る段階に変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("aNode", "bNode", "cNode", "dNode", "fNode", "currentGrade").badge("成績"),
  )
  .build();
export const subtitle__examGrade =
  "点数を A〜F の 5 段階の帯に分け、つまみで決めた点数がどの段階かを示す (grade)";

/**
 * 70. stopwatch = ms 数値 (stepper で秒指定) を MM:SS.ms display で表示。
 */
export const timerStopwatch = diagram("interactive-timer-stopwatch", {
  topic: "秒数と実行状態から時計表示を作る",
})
  .lane("input", { x: 0, width: 200 })
  .lane("toggle", { x: 240, width: 200 })
  .lane("display", { x: 480, width: 220 })
  .input.stepper("sec", { min: 0, max: 3600, step: 5, defaultValue: 125, label: "経過した秒数" })
  .input.toggle("running", { defaultValue: true, label: "動作中" })
  .state("sec", { initial: 125 })
  .state("running", { initial: "true" })
  .state("elapsed", { initial: 125000 })
  .formula("elapsed", "sec * 1000", { label: "経過 (ms)" })
  .node("secNode", {
    lane: "input",
    stack: 0,
    kind: "card",
    title: "秒数",
    subtitle: "秒数 = {sec} (0〜3600)",
  })
  .node("runNode", {
    lane: "toggle",
    stack: 0,
    kind: "card",
    title: "動作中",
    subtitle: "時計を動かすか止めるか",
  })
  .node("displayNode", {
    lane: "display",
    stack: 0,
    kind: "card",
    title: "分:秒.ms",
    subtitle: "経過 = 秒数 × 1000 = {elapsed}ms",
  })
  .edge("secNode", "displayNode", { label: "× 1000", tone: "info" })
  .edge("runNode", "displayNode", { label: "色", tone: "success" })
  .readout.stopwatch("sw", {
    source: "elapsed",
    runningSource: "running",
    size: 40,
    color: "#241c14",
    label: "時計 (分:秒.ms)",
  })
  .phase("p1", { duration: 1200, title: "秒数", body: "" }, (p: PhaseBuilder) =>
    p.activate("secNode").badge("時計"),
  )
  .phase("p2", { duration: 1200, title: "実行状態", body: "" }, (p: PhaseBuilder) =>
    p.activate("secNode", "runNode").badge("時計"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "時計表示",
      body: "秒数と動作中の 2 つが矢印で時計の表示に集まる。 秒数を変えると下の時計の時刻が、動作中を切り替えると時計の色が変わる。",
    },
    (p: PhaseBuilder) => p.activate("secNode", "runNode", "displayNode").badge("時計"),
  )
  .build();
export const subtitle__timerStopwatch =
  "経過した秒数と動作中かどうかの 2 つから、分:秒.ms の時計表示を作る (stopwatch)";

/**
 * 71. confidence-meter = ML classification confidence を slider で操作 → 3 color band 追随。
 */
export const mlConfidenceMeter = diagram("interactive-ml-confidence", {
  topic: "推論の確信度を低 / 中 / 高で見せる",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 220 })
  .input.slider("conf", { min: 0, max: 100, defaultValue: 82, label: "確信度 %" })
  .state("conf", { initial: 82 })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "低い帯",
    subtitle: "40% 未満 (赤 · 迷っている)",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "中の帯",
    subtitle: "40〜74% (黄 · 境目)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "高い帯",
    subtitle: "75% 以上 (緑 · 自信がある)",
  })
  .node("currentConf", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ いまの確信度",
    subtitle: "確信度 = {conf}% (初期値 82 → 高い帯)",
  })
  .readout.confidenceMeter("cm", {
    source: "conf",
    lowThreshold: 40,
    highThreshold: 75,
    viewW: 280,
    viewH: 40,
    label: "確信度 (3 つの帯)",
  })
  .phase("p1", { duration: 1200, title: "低い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("確信度"),
  )
  .phase("p2", { duration: 1200, title: "高い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("確信度"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの確信度",
      body: "低い / 中 / 高い帯と、いまの確信度の箱が並ぶ。 確信度を動かすと、下の帯の色が値の入る帯の色に変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentConf").badge("確信度"),
  )
  .build();
export const subtitle__mlConfidenceMeter =
  "推論の確信度を 40% 未満 / 40〜74% / 75% 以上の帯に分け、つまみで決めた値がどの帯かを示す (confidence-meter)";

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
    title: "👍 いいね",
    subtitle: "最も多く付く反応",
  })
  .node("heartNode", {
    lane: "heart",
    stack: 0,
    kind: "card",
    w: 220,
    title: "❤️ 好き",
    subtitle: "次に多い反応",
  })
  .node("laughNode", {
    lane: "laugh",
    stack: 0,
    kind: "card",
    w: 220,
    title: "😂 笑い",
    subtitle: "中ほどの反応",
  })
  .node("partyNode", {
    lane: "party",
    stack: 0,
    kind: "card",
    w: 220,
    title: "🎉 お祝い",
    subtitle: "最も少ない反応",
  })
  .readout.reactionBar("rb", {
    source: "reactions",
    color: "#2563eb",
    label: "反応 (札の並び)",
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
  "投稿に付いた 4 種の反応を絵文字ごとの縦列に分け、札の並びで見せる (reaction-bar)";

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
  .readout.pillGroup("pg", { source: "stack", label: "使う技術 (札の並び)" })
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
  "5 つの技術を画面 / 基盤 / 組み立ての縦列に分け、札の並びで見せる (pill-group)";

/**
 * 74. fuel-bar = device battery、 slider で 0-100% 変化 → 10 segment + 3 color band 追随。
 */
export const deviceBattery = diagram("interactive-device-battery", {
  topic: "電池残量を低 / 中 / 高で見せる",
})
  .lane("low", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("high", { x: 480, width: 220 })
  .input.slider("battery", { min: 0, max: 100, defaultValue: 72, label: "残量 %" })
  .state("battery", { initial: 72 })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "低い帯",
    subtitle: "20% 未満 (赤 · 危うい)",
  })
  .node("midNode", {
    lane: "mid",
    stack: 0,
    kind: "card",
    title: "中の帯",
    subtitle: "20〜60% (黄 · そろそろ充電)",
  })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "高い帯",
    subtitle: "60% 以上 (緑 · 十分)",
  })
  .node("currentBattery", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ いまの残量",
    subtitle: "残量 = {battery}% (初期値 72 → 高い帯)",
  })
  .readout.fuelBar("fb", {
    source: "battery",
    segments: 10,
    lowThreshold: 20,
    highThreshold: 60,
    viewW: 240,
    viewH: 32,
    label: "残量 (10 区切りの棒)",
  })
  .phase("p1", { duration: 1200, title: "低い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode").badge("電池"),
  )
  .phase("p2", { duration: 1200, title: "高い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("lowNode", "midNode").badge("電池"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの残量",
      body: "低い / 中 / 高い帯と、いまの残量の箱が並ぶ。 残量を動かすと、下の棒の埋まる区切りの数と色が変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("lowNode", "midNode", "highNode", "currentBattery").badge("電池"),
  )
  .build();
export const subtitle__deviceBattery =
  "電池残量を 20% 未満 / 20〜60% / 60% 以上の帯に分け、つまみで決めた残量を 10 区切りの棒で示す (fuel-bar)";

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
    ["利用者", "12.4k"],
    ["売上", "$45k"],
    ["稼働率", "99.9", "%"],
    ["異常", 12],
  ] as unknown as (string | number)[])
  .node("usersNode", {
    lane: "users",
    stack: 0,
    kind: "card",
    w: 220,
    title: "利用者",
    subtitle: "月あたりの利用者",
  })
  .node("revenueNode", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    w: 200,
    title: "売上",
    subtitle: "月ごとの売上",
  })
  .node("uptimeNode", {
    lane: "uptime",
    stack: 0,
    kind: "card",
    w: 180,
    title: "稼働率",
    subtitle: "動き続けた割合",
  })
  .node("errorsNode", {
    lane: "errors",
    stack: 0,
    kind: "card",
    w: 180,
    title: "異常",
    subtitle: "異常の件数 (直近)",
  })
  .readout.metricsGrid("mg", { source: "kpis", color: "#2563eb", label: "指標 (2×2 の升目)" })
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
        .set("kpis", '[["利用者","3.1k"],["売上","$9k"],["稼働率","98.2","%"],["異常",47]]'),
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
        .set("kpis", '[["利用者","7.8k"],["売上","$26k"],["稼働率","99.4","%"],["異常",23]]'),
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
        .set("kpis", '[["利用者","12.4k"],["売上","$45k"],["稼働率","99.9","%"],["異常",12]]'),
  )
  .build();
export const subtitle__dashboardMetricsGrid =
  "利用者 / 売上 / 稼働率 / 異常の件数の 4 指標を縦列に分け、2×2 の升目の部品で見せる (metrics-grid)";

/**
 * 76. thermometer = 室温 24°C を slider で操作 → 縦 bar + 球部 で温度表示。
 */
export const roomThermometer = diagram("interactive-room-thermometer", {
  topic: "室温を寒い / 快適 / 暑いで分ける",
})
  .lane("cold", { x: 0, width: 200 })
  .lane("comfort", { x: 240, width: 220 })
  .lane("hot", { x: 500, width: 200 })
  .input.slider("temp", { min: 0, max: 40, defaultValue: 24, label: "室温 °C" })
  .state("temp", { initial: 24 })
  .node("coldNode", {
    lane: "cold",
    stack: 0,
    kind: "card",
    title: "寒い帯",
    subtitle: "15°C 未満 (青 · 暖房)",
  })
  .node("comfortNode", {
    lane: "comfort",
    stack: 0,
    kind: "card",
    title: "快適な帯",
    subtitle: "15〜25°C (緑 · 初期値の帯)",
  })
  .node("hotNode", {
    lane: "hot",
    stack: 0,
    kind: "card",
    title: "暑い帯",
    subtitle: "25°C 以上 (赤 · 冷房)",
  })
  .node("currentTemp", {
    lane: "comfort",
    stack: 1,
    kind: "card",
    title: "◆ いまの室温",
    subtitle: "室温 = {temp}°C (初期値 24 → 快適)",
  })
  .readout.thermometer("th", {
    source: "temp",
    min: 0,
    max: 40,
    viewW: 70,
    viewH: 180,
    color: "#ef4444",
    unit: "°C",
    label: "室温 (縦の棒)",
  })
  .phase("p1", { duration: 1200, title: "寒い帯", body: "" }, (p: PhaseBuilder) =>
    p.activate("coldNode").badge("室温"),
  )
  .phase("p2", { duration: 1200, title: "暑い帯まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("coldNode", "comfortNode").badge("室温"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの室温",
      body: "寒い / 快適 / 暑い帯と、いまの室温の箱が並ぶ。 室温を動かすと、下の温度計の棒の高さが変わる。",
    },
    (p: PhaseBuilder) =>
      p.activate("coldNode", "comfortNode", "hotNode", "currentTemp").badge("室温"),
  )
  .build();
export const subtitle__roomThermometer =
  "室温を 15°C 未満 / 15〜25°C / 25°C 以上の帯に分け、つまみで決めた室温を縦の棒で示す (thermometer)";

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
    ["📈", "伸び", "+15%"],
    ["💰", "売上", "$50k"],
    ["🎯", "目標", "8/10"],
  ] as unknown as (string | number)[])
  .node("growthNode", {
    lane: "growth",
    stack: 0,
    kind: "card",
    title: "📈 伸び",
    subtitle: "前の月からの伸び",
  })
  .node("revenueNode", {
    lane: "revenue",
    stack: 0,
    kind: "card",
    title: "💰 売上",
    subtitle: "月ごとの売上",
  })
  .node("goalsNode", {
    lane: "goals",
    stack: 0,
    kind: "card",
    title: "🎯 目標",
    subtitle: "達成した目標の数",
  })
  .readout.iconTile("it", { source: "kpis", color: "#2563eb", label: "指標 (絵記号の札)" })
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
        .set("kpis", '[["📈","伸び","+2%"],["💰","売上","$18k"],["🎯","目標","2/10"]]'),
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
        .set("kpis", '[["📈","伸び","+9%"],["💰","売上","$33k"],["🎯","目標","5/10"]]'),
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
        .set("kpis", '[["📈","伸び","+15%"],["💰","売上","$50k"],["🎯","目標","8/10"]]'),
  )
  .build();
export const subtitle__kpiIconTile =
  "伸び / 売上 / 目標の 3 指標を縦列に分け、絵記号の付いた札で見せる (icon-tile)";

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
    label: "保有 (合計)",
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
  "保有する 4 銘柄を値上がりと値下がりの縦列に分け、合計付きの一覧で見せる (token-list)";

/**
 * 79. map-pin = world map (地図座標) 上の 5 city を pin 表示。
 */
export const worldMapPins = diagram("interactive-world-map", {
  topic: "5 都市をアジア / 欧米に分けて見せる",
})
  .lane("apac", { x: 0, width: 220 })
  .lane("amea", { x: 300, width: 220 })
  .arraySignal("cities", [
    ["東京", 100, 60],
    ["パリ", 60, 30],
    ["ニューヨーク", 30, 40],
    ["シドニー", 105, 75],
    ["リオ", 40, 65],
  ] as unknown as (string | number)[])
  .node("tokyo", {
    lane: "apac",
    stack: 0,
    kind: "card",
    title: "東京",
    subtitle: "最初の拠点 (右寄り・やや下)",
  })
  .node("sydney", {
    lane: "apac",
    stack: 1,
    kind: "card",
    title: "シドニー",
    subtitle: "最も下に出る点",
  })
  .node("nyc", { lane: "amea", stack: 0, kind: "card", title: "ニューヨーク", subtitle: "最も左に出る点" })
  .node("paris", {
    lane: "amea",
    stack: 1,
    kind: "card",
    title: "パリ",
    subtitle: "最も上に出る点",
  })
  .node("rio", { lane: "amea", stack: 2, kind: "card", title: "リオ", subtitle: "左下に出る点" })
  .readout.mapPin("mp", {
    source: "cities",
    xMin: 0,
    xMax: 120,
    yMin: 0,
    yMax: 80,
    viewW: 300,
    viewH: 200,
    color: "#2563eb",
    label: "世界地図 (平面の座標)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "拠点は 1 つ",
      body: "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。",
    },
    (p: PhaseBuilder) => p.activate("tokyo").set("cities", '[["東京",100,60]]'),
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
        .set("cities", '[["東京",100,60],["ニューヨーク",30,40],["パリ",60,30]]'),
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
          '[["東京",100,60],["パリ",60,30],["ニューヨーク",30,40],["シドニー",105,75],["リオ",40,65]]',
        ),
  )
  .build();
export const subtitle__worldMapPins =
  "5 都市をアジアと太平洋 / 欧州と米州の縦列に分け、平面の世界地図に点で置く (map-pin)";

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
    // 値は優先度の札が綴りで読むので英語のまま。 選択肢と箱の {prio} は名前で描く (#1920)
    options: [
      { value: "high", label: "高" },
      { value: "med", label: "中" },
      { value: "low", label: "低" },
    ],
    defaultValue: "high",
    label: "優先度",
  })
  .input.text("desc", {
    defaultValue: "起動で落ちる不具合",
    placeholder: "課題の説明",
    maxLength: 60,
    label: "説明",
  })
  .state("prio", { initial: "high" })
  .state("desc", { initial: "起動で落ちる不具合" })
  .node("highNode", {
    lane: "high",
    stack: 0,
    kind: "card",
    title: "▲ 高",
    subtitle: "赤 · 落ちる / 戻った不具合",
  })
  .node("medNode", {
    lane: "med",
    stack: 0,
    kind: "card",
    title: "● 中",
    subtitle: "黄 · ふつうの不具合",
  })
  .node("lowNode", {
    lane: "low",
    stack: 0,
    kind: "card",
    title: "▼ 低",
    subtitle: "灰 · あると良い",
  })
  .node("currentIssue", {
    lane: "high",
    stack: 1,
    kind: "card",
    title: "◆ いまの課題",
    subtitle: "優先度: {prio} · {desc}",
  })
  .readout.priorityBadge("pb", {
    source: "prio",
    textSource: "desc",
    label: "優先度 (札と記号と文)",
  })
  .phase("p1", { duration: 1200, title: "高い優先度", body: "" }, (p: PhaseBuilder) =>
    p.activate("highNode").badge("課題"),
  )
  .phase("p2", { duration: 1200, title: "低い優先度まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("highNode", "medNode").badge("課題"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "いまの課題",
      body: "高 / 中 / 低の 3 列と、いまの課題の箱が並ぶ。 優先度を選ぶと、下の札の色と記号が変わり、説明の文が札に添えられる。",
    },
    (p: PhaseBuilder) =>
      p.activate("highNode", "medNode", "lowNode", "currentIssue").badge("課題"),
  )
  .build();
export const subtitle__issuePriorityBadge =
  "課題の優先度を高 / 中 / 低に分け、選んだ優先度と説明を札と記号で示す (priority-badge)";

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
    ["佐藤", "1200 点"],
    ["鈴木", "1050 点"],
    ["高橋", "980 点"],
  ] as unknown as (string | number)[])
  .node("silverNode", {
    lane: "silver",
    stack: 0,
    kind: "card",
    title: "🥈 2 位 鈴木",
    subtitle: "銀 · 中央のすぐ左",
  })
  .node("goldNode", {
    lane: "gold",
    stack: 0,
    kind: "card",
    title: "🥇 1 位 佐藤",
    subtitle: "金 · 中央で最も高い",
  })
  .node("bronzeNode", {
    lane: "bronze",
    stack: 0,
    kind: "card",
    title: "🥉 3 位 高橋",
    subtitle: "銅 · 中央のすぐ右",
  })
  .readout.podium("pod", {
    source: "winners",
    viewW: 280,
    viewH: 180,
    label: "表彰台 (3 本の縦の台)",
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
        .set("winners", '[["佐藤","400 点"],["鈴木","380 点"],["高橋","350 点"]]'),
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
        .set("winners", '[["佐藤","800 点"],["鈴木","700 点"],["高橋","640 点"]]'),
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
        .set("winners", '[["佐藤","1200 点"],["鈴木","1050 点"],["高橋","980 点"]]'),
  )
  .build();
export const subtitle__tournamentPodium =
  "1 位を中央、2 位を左、3 位を右に置き、高さの違う 3 本の台で表彰台を見せる (podium)";

/**
 * 82. poll-bar = feature poll、 4 option の投票 % 表示、 winner に ★ 装飾。
 */
export const featurePoll = diagram("interactive-feature-poll", {
  topic: "投票結果を 1 位とその他に分ける",
})
  .lane("winner", { x: 0, width: 220 })
  .lane("runners", { x: 300, width: 220 })
  .arraySignal("options", [
    ["暗い配色", 42],
    ["速い検索", 28],
    ["使いやすい API", 18],
    ["見やすい画面", 12],
  ] as unknown as (string | number)[])
  .node("dark", {
    lane: "winner",
    stack: 0,
    kind: "card",
    title: "★ 暗い配色",
    subtitle: "票が最も多い案",
  })
  .node("search", {
    lane: "runners",
    stack: 0,
    kind: "card",
    title: "検索",
    subtitle: "次に多い案",
  })
  .node("api", {
    lane: "runners",
    stack: 1,
    kind: "card",
    title: "使いやすい API",
    subtitle: "中ほどの案",
  })
  .node("ui", {
    lane: "runners",
    stack: 2,
    kind: "card",
    title: "見やすい画面",
    subtitle: "最も少ない案",
  })
  .readout.pollBar("pb", {
    source: "options",
    color: "#a08870",
    colorWinner: "#2563eb",
    label: "投票の結果 (合計)",
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
        .set("options", '[["暗い配色",7],["速い検索",6],["使いやすい API",5],["見やすい画面",4]]'),
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
        .set("options", '[["暗い配色",40],["速い検索",13],["使いやすい API",8],["見やすい画面",5]]'),
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
          '[["暗い配色",42],["速い検索",28],["使いやすい API",18],["見やすい画面",12]]',
        ),
  )
  .build();
export const subtitle__featurePoll =
  "4 つの案への投票を 1 位とその他の縦列に分け、合計付きの棒で見せる (poll-bar)";

/**
 * 83. user-stack = code review reviewer 7 人 (max 5 表示 + overflow +2)。
 */
export const reviewerStack = diagram("interactive-reviewer-stack", {
  topic: "レビュアー 7 人を 5 人表示と残りで見せる",
})
  .lane("displayed", { x: 0, width: 340 })
  .lane("overflow", { x: 380, width: 200 })
  .arraySignal("reviewers", [
    "佐藤",
    "鈴木 健",
    "高橋",
    "田中 翔",
    "伊藤",
    "渡辺 蓮",
    "山本 光",
  ])
  .node("r1", {
    lane: "displayed",
    stack: 0,
    kind: "card",
    title: "佐藤",
    subtitle: "頭文字 佐 · はじめから居る",
  })
  .node("r2", {
    lane: "displayed",
    stack: 1,
    kind: "card",
    title: "鈴木 健",
    subtitle: "頭文字 鈴健 · はじめから居る",
  })
  .node("r3", {
    lane: "displayed",
    stack: 2,
    kind: "card",
    title: "高橋",
    subtitle: "頭文字 高 · はじめから居る",
  })
  .node("r4", {
    lane: "displayed",
    stack: 3,
    kind: "card",
    title: "田中 翔",
    subtitle: "頭文字 田翔 · 途中で加わる",
  })
  .node("r5", {
    lane: "displayed",
    stack: 4,
    kind: "card",
    title: "伊藤",
    subtitle: "頭文字 伊 · 上限ちょうど",
  })
  .node("r6", {
    lane: "overflow",
    stack: 0,
    kind: "card",
    title: "渡辺 蓮",
    subtitle: "頭文字 渡蓮 · 上限を超える",
  })
  .node("r7", {
    lane: "overflow",
    stack: 1,
    kind: "card",
    title: "山本 光",
    subtitle: "頭文字 山光 · 上限を超える",
  })
  .readout.userStack("us", {
    source: "reviewers",
    max: 5,
    size: 36,
    label: "確かめる人 (重ねた丸)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "依頼した直後",
      body: "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。",
    },
    (p: PhaseBuilder) =>
      p.activate("r1", "r2", "r3").set("reviewers", '["佐藤","鈴木 健","高橋"]'),
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
        .set("reviewers", '["佐藤","鈴木 健","高橋","田中 翔","伊藤"]'),
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
        .set("reviewers", '["佐藤","鈴木 健","高橋","田中 翔","伊藤","渡辺 蓮","山本 光"]'),
  )
  .build();
export const subtitle__reviewerStack =
  "変更を確かめる 7 人を表示する 5 人と残り 2 人に分け、重ねた丸で見せる (user-stack)";

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
    ["7214093", "機能: 流れの幅を描く部品を足す", "佐藤"],
    ["5830617", "修正: 円い計器の角度のずれを直す", "鈴木"],
    ["9046251", "文書: 使い方の説明を書き直す", "高橋"],
    ["1378460", "整理: 部品の振り分けを切り出す", "田中"],
    ["6602938", "テスト: 組み立ての連なりを確かめる", "伊藤"],
  ] as unknown as (string | number)[])
  .node("featNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 280,
    title: "機能",
    subtitle: "機能を足す (佐藤)",
  })
  .node("fixNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 310,
    title: "修正",
    subtitle: "不具合を直す (鈴木)",
  })
  .node("docsNode", {
    lane: "col3",
    stack: 0,
    kind: "card",
    w: 300,
    title: "文書",
    subtitle: "説明を書く (高橋)",
  })
  .node("refactorNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 300,
    title: "整理",
    subtitle: "構造を整える (田中)",
  })
  .node("testNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 270,
    title: "テスト",
    subtitle: "検査を足す (伊藤)",
  })
  .readout.commitList("cl", {
    source: "commits",
    max: 5,
    color: "#2563eb",
    label: "変更の履歴",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 件目",
      body: "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("featNode").set("commits", '[["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]'),
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
          '[["9046251","文書: 使い方の説明を書き直す","高橋"],["5830617","修正: 円い計器の角度のずれを直す","鈴木"],["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]',
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
          '[["6602938","テスト: 組み立ての連なりを確かめる","伊藤"],["1378460","整理: 部品の振り分けを切り出す","田中"],["9046251","文書: 使い方の説明を書き直す","高橋"],["5830617","修正: 円い計器の角度のずれを直す","鈴木"],["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]',
        ),
  )
  .build();
export const subtitle__gitCommitList =
  "5 件の変更を機能 / 修正 / 文書 / 整理 / テストの種別ごとの箱に分け、変更の履歴の一覧で見せる (commit-list)";

/**
 * 85. media-player = audio player、 slider で current time、 toggle で play/pause。
 */
export const audioPlayer = diagram("interactive-audio-player", {
  topic: "再生位置と再生状態から時間表示を作る",
})
  .lane("current", { x: 0, width: 220 })
  .lane("toggle", { x: 260, width: 200 })
  .lane("duration", { x: 500, width: 220 })
  .input.slider("current", { min: 0, max: 240, defaultValue: 65, label: "再生位置 (秒)" })
  .input.toggle("playing", { defaultValue: true, label: "再生中" })
  .state("current", { initial: 65 })
  .state("duration", { initial: 240 })
  .state("playing", { initial: "true" })
  .node("currentNode", {
    lane: "current",
    stack: 0,
    kind: "card",
    title: "再生位置",
    subtitle: "{current} 秒 / 240 秒 (つまみで動かす)",
  })
  .node("toggleNode", {
    lane: "toggle",
    stack: 0,
    kind: "card",
    title: "再生の切り替え",
    subtitle: "▶ と ❚❚ を切り替える",
  })
  .node("durationNode", {
    lane: "duration",
    stack: 0,
    kind: "card",
    title: "曲の長さ",
    subtitle: "全体で 240 秒 (固定)",
  })
  .edge("currentNode", "durationNode", { label: "進み具合 %", tone: "info" })
  .edge("toggleNode", "currentNode", { label: "進める / 止める", tone: "success" })
  .readout.mediaPlayer("mp", {
    source: "current",
    durationSource: "duration",
    playingSource: "playing",
    color: "#2563eb",
    viewW: 320,
    label: "再生 (記号と進み具合と分:秒)",
  })
  .phase("p1", { duration: 1200, title: "再生位置", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode").badge("再生"),
  )
  .phase("p2", { duration: 1200, title: "再生状態", body: "" }, (p: PhaseBuilder) =>
    p.activate("currentNode", "toggleNode").badge("再生"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "時間表示",
      body: "再生位置 / 再生の切り替え / 曲の長さの 3 列が矢印でつながる。 位置を動かすと下の進み具合と時刻が、切り替えると記号の ▶ と ❚❚ が入れ替わる。",
    },
    (p: PhaseBuilder) => p.activate("currentNode", "toggleNode", "durationNode").badge("再生"),
  )
  .build();
export const subtitle__audioPlayer =
  "再生位置のつまみと再生中の切り替えから、記号と進み具合と分:秒の再生表示を作る (media-player)";

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
    ["10:23:45", "info", "3000 番で待ち受けを始めた"],
    ["10:24:12", "debug", "設定を読み込んだ"],
    ["10:24:58", "warn", "CPU の使用率が高い (82%)"],
    ["10:25:34", "error", "DB の接続が 5 秒で時間切れ"],
    ["10:26:01", "info", "つなぎ直しに成功した"],
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
  .readout.eventLog("el", { source: "events", max: 10, label: "出来事 (時系列)" })
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
          '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"]]',
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
          '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"],["10:24:58","warn","CPU の使用率が高い (82%)"],["10:25:34","error","DB の接続が 5 秒で時間切れ"]]',
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
          '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"],["10:24:58","warn","CPU の使用率が高い (82%)"],["10:25:34","error","DB の接続が 5 秒で時間切れ"],["10:26:01","info","つなぎ直しに成功した"]]',
        ),
  )
  .build();
export const subtitle__serverEventLog =
  "運用の出来事 5 件を情報 / 詳細 / 注意 / 異常の縦列に分け、時系列の記録で見せる (event-log)";

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
      "Rust の練習場",
      "Rust のコードをその場で書いて動かせる場所",
      "練習場 › Rust",
    ],
    ["ウェブ技術の手引き", "ウェブの技術をまとめた解説", "手引き › ウェブ技術"],
    ["TypeScript の手引き", "TypeScript を学ぶための案内", "手引き › TypeScript"],
    ["React の説明書", "React の使い方をまとめた資料", "説明書 › React"],
    ["Vite の案内", "画面を組み立てる道具の案内", "案内 › Vite"],
  ] as unknown as (string | number)[])
  .node("mdnNode", {
    lane: "docs",
    stack: 0,
    kind: "card",
    title: "ウェブ技術の手引き",
    subtitle: "手引き › ウェブ技術",
  })
  .node("tsNode", {
    lane: "docs",
    stack: 1,
    kind: "card",
    title: "TypeScript",
    subtitle: "手引き › TypeScript",
  })
  .node("reactNode", {
    lane: "docs",
    stack: 2,
    kind: "card",
    title: "React の説明書",
    subtitle: "説明書 › React",
  })
  .node("viteNode", {
    lane: "docs",
    stack: 3,
    kind: "card",
    title: "Vite の案内",
    subtitle: "案内 › Vite",
  })
  .node("rustNode", {
    lane: "tools",
    stack: 0,
    kind: "card",
    title: "Rust",
    subtitle: "練習場 › Rust (その場で動かす)",
  })
  .readout.searchResult("sr", {
    source: "hits",
    max: 5,
    color: "#2563eb",
    label: "検索結果 (題と抜粋と所在)",
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
          '[["Rust の練習場","Rust のコードをその場で書いて動かせる場所","練習場 › Rust"],["ウェブ技術の手引き","ウェブの技術をまとめた解説","手引き › ウェブ技術"],["TypeScript の手引き","TypeScript を学ぶための案内","手引き › TypeScript"],["React の説明書","React の使い方をまとめた資料","説明書 › React"],["Vite の案内","画面を組み立てる道具の案内","案内 › Vite"]]',
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
          '[["ウェブ技術の手引き","ウェブの技術をまとめた解説","手引き › ウェブ技術"],["TypeScript の手引き","TypeScript を学ぶための案内","手引き › TypeScript"],["React の説明書","React の使い方をまとめた資料","説明書 › React"]]',
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
          '[["Rust の練習場","Rust のコードをその場で書いて動かせる場所","練習場 › Rust"]]',
        ),
  )
  .build();
export const subtitle__searchResults =
  "5 件の検索結果を文書とその場で動かせる練習場の縦列に分け、題と抜粋と所在で見せる (search-result)";

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
    ["Q1", ["設計の決まり", "試作の機能 A"]],
    ["Q2", ["試験公開", "機能 B", "意見の取り込み"]],
    ["Q3", ["基盤の拡張", "企業との契約"]],
    ["Q4", ["正式公開", "資金調達"]],
  ] as unknown as (string | number)[])
  .node("q1Head", {
    lane: "q1",
    stack: 0,
    kind: "card",
    title: "Q1 (1〜3 月)",
    subtitle: "設計と試作",
  })
  .node("q1Item1", { lane: "q1", stack: 1, kind: "card", title: "設計の決まり", subtitle: "土台" })
  .node("q1Item2", {
    lane: "q1",
    stack: 2,
    kind: "card",
    title: "試作の機能 A",
    subtitle: "試作",
  })
  .node("q2Head", {
    lane: "q2",
    stack: 0,
    kind: "card",
    title: "Q2 (4〜6 月)",
    subtitle: "試験公開と成長",
  })
  .node("q2Item1", {
    lane: "q2",
    stack: 1,
    kind: "card",
    title: "試験公開",
    subtitle: "だれでも試せる",
  })
  .node("q2Item2", {
    lane: "q2",
    stack: 2,
    kind: "card",
    title: "機能 B",
    subtitle: "試験公開の範囲",
  })
  .node("q3Head", {
    lane: "q3",
    stack: 0,
    kind: "card",
    title: "Q3 (7〜9 月)",
    subtitle: "拡張と企業向け",
  })
  .node("q3Item1", {
    lane: "q3",
    stack: 1,
    kind: "card",
    title: "基盤の拡張",
    subtitle: "受けられる量",
  })
  .node("q3Item2", {
    lane: "q3",
    stack: 2,
    kind: "card",
    title: "企業との契約",
    subtitle: "企業向けの売上",
  })
  .node("q4Head", {
    lane: "q4",
    stack: 0,
    kind: "card",
    title: "Q4 (10〜12 月)",
    subtitle: "正式公開と資金",
  })
  .node("q4Item1", {
    lane: "q4",
    stack: 1,
    kind: "card",
    title: "正式公開",
    subtitle: "だれでも使える",
  })
  .node("q4Item2", {
    lane: "q4",
    stack: 2,
    kind: "card",
    title: "資金調達",
    subtitle: "伸ばすための資金",
  })
  .edge("q1Head", "q2Head", { label: "引き継ぐ", tone: "info" })
  .edge("q2Head", "q3Head", { label: "広げる", tone: "accent" })
  .edge("q3Head", "q4Head", { label: "公開する", tone: "success" })
  .readout.roadmap("rm", {
    source: "plan",
    viewW: 400,
    viewH: 200,
    label: "年間の計画 (4 列の一覧)",
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
        .set("plan", '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",[]],["Q3",[]],["Q4",[]]]'),
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
          '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",["試験公開","機能 B","意見の取り込み"]],["Q3",[]],["Q4",[]]]',
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
          '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",["試験公開","機能 B","意見の取り込み"]],["Q3",["基盤の拡張","企業との契約"]],["Q4",["正式公開","資金調達"]]]',
        ),
  )
  .build();
export const subtitle__yearRoadmap =
  "1 年の計画を 4 つの四半期の縦列に分けて各期の項目を積み、期と期を矢印で引き継ぐ (roadmap)";

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
    ["月曜", "☀", 24, 18],
    ["火曜", "☁", 22, 17],
    ["水曜", "☂", 19, 15],
    ["木曜", "⚡", 17, 13],
    ["金曜", "☀", 25, 19],
  ] as unknown as (string | number)[])
  .node("monNode", {
    lane: "sunny",
    stack: 0,
    kind: "card",
    title: "☀ 月曜",
    subtitle: "晴れ · 週の始まり",
  })
  .node("friNode", {
    lane: "sunny",
    stack: 1,
    kind: "card",
    title: "☀ 金曜",
    subtitle: "晴れ · 週で最も暖かい",
  })
  .node("tueNode", {
    lane: "cloudy",
    stack: 0,
    kind: "card",
    title: "☁ 火曜",
    subtitle: "曇り · 下り坂の入口",
  })
  .node("wedNode", {
    lane: "cloudy",
    stack: 1,
    kind: "card",
    title: "☂ 水曜",
    subtitle: "雨 · 気温が下がる",
  })
  .node("thuNode", {
    lane: "thunder",
    stack: 0,
    kind: "card",
    title: "⚡ 木曜",
    subtitle: "雷 · 週で最も寒い",
  })
  .readout.weatherForecast("wf", { source: "forecast", label: "1 週間 (5 日分の予報)" })
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
          '[["月曜","☀",21,16],["火曜","☁",20,15],["水曜","☂",18,14],["木曜","⚡",16,12],["金曜","☀",22,17]]',
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
          '[["月曜","☀",23,17],["火曜","☁",21,16],["水曜","☂",19,15],["木曜","⚡",17,13],["金曜","☀",24,18]]',
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
          '[["月曜","☀",24,18],["火曜","☁",22,17],["水曜","☂",19,15],["木曜","⚡",17,13],["金曜","☀",25,19]]',
        ),
  )
  .build();
export const subtitle__weekWeather =
  "5 日間の天気を晴れ / 曇りと雨 / 雷の縦列に分け、5 日分の予報で見せる (weather-forecast)";

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
    ["🎬", "はじめての Rust", "12:45", "2.4 万"],
    ["🎥", "TypeScript を深く学ぶ", "45:20", "8.2 万"],
    ["📺", "React の状態の持ち方", "18:30", "15.6 万"],
  ] as unknown as (string | number)[])
  .node("rustVideo", {
    lane: "rust",
    stack: 0,
    kind: "card",
    title: "Rust",
    subtitle: "最初に出す 1 本",
  })
  .node("tsVideo", {
    lane: "ts",
    stack: 0,
    kind: "card",
    title: "TypeScript",
    subtitle: "最も長い 1 本",
  })
  .node("reactVideo", {
    lane: "react",
    stack: 0,
    kind: "card",
    title: "React",
    subtitle: "最も見られている 1 本",
  })
  .readout.videoCard("vc", {
    source: "videos",
    max: 5,
    color: "#ef4444",
    label: "解説動画 (縮小画像の一覧)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "1 本だけ出す",
      body: "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("rustVideo").set("videos", '[["🎬","はじめての Rust","12:45","2.4 万"]]'),
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
          '[["🎬","はじめての Rust","12:45","2.4 万"],["🎥","TypeScript を深く学ぶ","45:20","8.2 万"]]',
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
          '[["🎬","はじめての Rust","12:45","2.4 万"],["🎥","TypeScript を深く学ぶ","45:20","8.2 万"],["📺","React の状態の持ち方","18:30","15.6 万"]]',
        ),
  )
  .build();
export const subtitle__tutorialVideoCards =
  "解説動画 3 本を言語ごとの縦列に分け、縮小画像の一覧で見せる (video-card)";

/**
 * 91. order-status = e-commerce 配送追跡、 stepper で current step 切替 → 4 icon step。
 */
export const shippingOrderStatus = diagram("interactive-shipping-status", {
  topic: "配送状況を 4 段階で追う",
})
  .lane("col1", { x: 0, width: 340 })
  .lane("col2", { x: 380, width: 340 })
  .input.stepper("current", { min: 0, max: 3, defaultValue: 2, label: "いまの段階" })
  .state("current", { initial: 2 })
  .arraySignal("steps", ["梱包済み", "発送済み", "配達中", "配達完了"])
  .node("packedNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 250,
    title: "📦 梱包済み",
    subtitle: "倉庫で箱に詰めた",
  })
  .node("shippedNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 270,
    title: "🚚 発送済み",
    subtitle: "運送会社に渡した",
  })
  .node("deliveryNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 290,
    title: "🏠 配達中",
    subtitle: "向かっている (初期値)",
  })
  .node("deliveredNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 290,
    title: "✅ 配達完了",
    subtitle: "受け取りが済んだ",
  })
  .edge("packedNode", "shippedNode", { label: "引き継ぐ", tone: "success" })
  .edge("shippedNode", "deliveryNode", { label: "輸送中", tone: "info" })
  .edge("deliveryNode", "deliveredNode", { label: "到着", tone: "warning" })
  .readout.orderStatus("os", {
    source: "current",
    stepsSource: "steps",
    color: "#2563eb",
    label: "配送状況 (記号の帯)",
  })
  .phase("p1", { duration: 1200, title: "梱包と発送", body: "" }, (p: PhaseBuilder) =>
    p.activate("packedNode").badge("追跡"),
  )
  .phase("p2", { duration: 1200, title: "配達中まで", body: "" }, (p: PhaseBuilder) =>
    p.activate("packedNode", "shippedNode").badge("追跡"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "配達完了",
      body: "梱包済み / 発送済み / 配達中 / 配達完了の 4 つを 2 列 2 段に置き、矢印で順につなぐ。 段階を動かすと、下の記号の帯でいまの段階までが塗られる。",
    },
    (p: PhaseBuilder) =>
      p.activate("packedNode", "shippedNode", "deliveryNode", "deliveredNode").badge("追跡"),
  )
  .build();
export const subtitle__shippingOrderStatus =
  "梱包 → 発送 → 配達中 → 配達完了の 4 段階を矢印でつなぎ、増減の入力欄で決めた段階を記号の帯で示す (order-status)";

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
    ["月", true, true, false, true],
    ["火", true, false, true, true],
    ["水", true, true, true, true],
    ["木", false, true, true, true],
    ["金", true, true, false, true],
  ] as unknown as (string | number)[])
  .arraySignal("members", ["佐藤", "鈴木", "高橋", "田中"])
  .node("aliceCard", {
    lane: "alice",
    stack: 0,
    kind: "card",
    w: 280,
    title: "佐藤",
    subtitle: "1 列目の人",
  })
  .node("bobCard", {
    lane: "bob",
    stack: 0,
    kind: "card",
    w: 280,
    title: "鈴木",
    subtitle: "2 列目の人",
  })
  .node("carolCard", {
    lane: "carol",
    stack: 0,
    kind: "card",
    w: 320,
    title: "高橋",
    subtitle: "3 列目の人",
  })
  .node("danCard", {
    lane: "dan",
    stack: 0,
    kind: "card",
    w: 250,
    title: "田中",
    subtitle: "4 列目の人 (欠けが無い)",
  })
  .readout.attendanceGrid("ag", {
    source: "attendance",
    membersSource: "members",
    color: "#22c55e",
    label: "出欠 (5 日 × 4 人)",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "週の初め",
      body: "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("aliceCard").set("attendance", '[["月",true,true,false,true]]'),
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
          '[["月",true,true,false,true],["火",true,false,true,true],["水",true,true,true,true]]',
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
          '[["月",true,true,false,true],["火",true,false,true,true],["水",true,true,true,true],["木",false,true,true,true],["金",true,true,false,true]]',
        ),
  )
  .build();
export const subtitle__teamAttendanceGrid =
  "4 人を縦列に分け、5 日 × 4 人の出欠を升目の部品で見せる (attendance-grid)";

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
    ["東京", 9, "22:30"],
    ["ロンドン", 0, "13:30"],
    ["ニューヨーク", -5, "08:30"],
    ["シドニー", 11, "00:30"],
  ] as unknown as (string | number)[])
  .node("tokyoNode", {
    lane: "tokyo",
    stack: 0,
    kind: "card",
    w: 180,
    title: "東京",
    subtitle: "時差が進んでいる側の都市",
  })
  .node("londonNode", {
    lane: "london",
    stack: 0,
    kind: "card",
    w: 180,
    title: "ロンドン",
    subtitle: "時差の基準となる都市",
  })
  .node("nycNode", {
    lane: "nyc",
    stack: 0,
    kind: "card",
    w: 200,
    title: "ニューヨーク",
    subtitle: "時差が最も遅れている都市",
  })
  .node("sydneyNode", {
    lane: "sydney",
    stack: 0,
    kind: "card",
    w: 190,
    title: "シドニー",
    subtitle: "時差が最も進んでいる都市",
  })
  .readout.timezoneClock("tc", {
    source: "clocks",
    color: "#2563eb",
    label: "都市 (4 列の升目)",
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
          '[["東京",9,"17:00"],["ロンドン",0,"08:00"],["ニューヨーク",-5,"03:00"],["シドニー",11,"19:00"]]',
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
          '[["東京",9,"22:00"],["ロンドン",0,"13:00"],["ニューヨーク",-5,"08:00"],["シドニー",11,"00:00"]]',
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
          '[["東京",9,"01:30"],["ロンドン",0,"16:30"],["ニューヨーク",-5,"11:30"],["シドニー",11,"03:30"]]',
        ),
  )
  .build();
export const subtitle__globalTimezoneClock =
  "時差の違う 4 都市を縦列に分け、現地時刻を 4 列の升目で見せる (timezone-clock)";

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
    ["名前", "佐藤 花子"],
    ["電話番号", "090-0000-1234"],
    ["年齢", "28"],
    ["国", "日本"],
    ["お知らせ", "受け取る"],
  ] as unknown as (string | number)[])
  .node("nameNode", {
    lane: "personal",
    stack: 0,
    kind: "card",
    title: "名前",
    subtitle: "本人を表す項目",
  })
  .node("ageNode", {
    lane: "personal",
    stack: 1,
    kind: "card",
    title: "年齢",
    subtitle: "本人を表す項目 (数)",
  })
  .node("emailNode", {
    lane: "contact",
    stack: 0,
    kind: "card",
    title: "電話番号",
    subtitle: "連絡先の項目",
  })
  .node("countryNode", {
    lane: "contact",
    stack: 1,
    kind: "card",
    title: "国",
    subtitle: "連絡先の項目 (所在)",
  })
  .node("newsletterNode", {
    lane: "prefs",
    stack: 0,
    kind: "card",
    title: "お知らせ",
    subtitle: "希望を表す項目",
  })
  .readout.formSummary("fs", { source: "fields", color: "#2563eb", label: "送る内容 (項目名と値)" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "入力の途中",
      body: "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("nameNode", "ageNode").set("fields", '[["名前","佐藤 花子"],["年齢","28"]]'),
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
          '[["名前","佐藤 花子"],["年齢","28"],["電話番号","090-0000-1234"],["国","日本"]]',
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
          '[["名前","佐藤 花子"],["年齢","28"],["電話番号","090-0000-1234"],["国","日本"],["お知らせ","受け取る"]]',
        ),
  )
  .build();
export const subtitle__signupFormSummary =
  "登録の 5 項目を本人 / 連絡先 / 希望の縦列に分け、送る内容を項目名と値の一覧で見せる (form-summary)";

/**
 * 95. song-queue = playlist queue 5 song、 stepper で current index。
 */
export const playlistSongQueue = diagram("interactive-playlist-queue", {
  topic: "再生待ち 5 曲を再生済 / 再生中 / 次にで分ける",
})
  .lane("played", { x: 0, width: 200 })
  .lane("now", { x: 240, width: 220 })
  .lane("next", { x: 500, width: 220 })
  .input.stepper("cur", { min: 0, max: 4, defaultValue: 1, label: "いまの曲の番号" })
  .state("cur", { initial: 1 })
  .arraySignal("queue", [
    ["紙飛行機の午後", "灯台守", "5:55"],
    ["十一月の港", "港町の二人", "6:30"],
    ["星図をひらく", "北窓", "8:02"],
    ["雨上がりの路線図", "小春日和", "5:56"],
    ["遠い約束", "白帆", "3:03"],
  ] as unknown as (string | number)[])
  .node("song0", {
    lane: "played",
    stack: 0,
    kind: "card",
    title: "✓ 紙飛行機",
    subtitle: "灯台守 · 5:55 (再生済)",
  })
  .node("song1", {
    lane: "now",
    stack: 0,
    kind: "card",
    title: "▶ 十一月の港",
    subtitle: "港町の二人 · 6:30 (再生中)",
  })
  .node("song2", {
    lane: "next",
    stack: 0,
    kind: "card",
    title: "星図",
    subtitle: "北窓 · 8:02",
  })
  .node("song3", {
    lane: "next",
    stack: 1,
    kind: "card",
    title: "雨上がり",
    subtitle: "小春日和 · 5:56",
  })
  .node("song4", {
    lane: "next",
    stack: 2,
    kind: "card",
    title: "遠い約束",
    subtitle: "白帆 · 3:03",
  })
  .readout.songQueue("sq", {
    source: "queue",
    currentSource: "cur",
    max: 8,
    color: "#2563eb",
    label: "再生待ち (いまの曲を強調)",
  })
  .phase("p1", { duration: 1200, title: "再生済", body: "" }, (p: PhaseBuilder) =>
    p.activate("song0").badge("曲"),
  )
  .phase("p2", { duration: 1200, title: "再生中", body: "" }, (p: PhaseBuilder) =>
    p.activate("song0", "song1", "song2").badge("曲"),
  )
  .phase(
    "p3",
    {
      duration: 1200,
      title: "次に続く",
      body: "再生済 / 再生中 / 次にの 3 列に 5 曲が並ぶ。 曲の番号を動かすと、下の一覧で強調される曲が移る。",
    },
    (p: PhaseBuilder) => p.activate("song0", "song1", "song2", "song3", "song4").badge("曲"),
  )
  .build();
export const subtitle__playlistSongQueue =
  "再生待ちの 5 曲を再生済 / 再生中 / 次の縦列に分け、増減の入力欄で決めた曲を強調する (song-queue)";

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
  .node("w1Card", { lane: "w1", stack: 0, kind: "card", title: "第 1 週", subtitle: "月の最初の週" })
  .node("w2Card", { lane: "w2", stack: 0, kind: "card", title: "第 2 週", subtitle: "今日を含む週" })
  .node("w3Card", { lane: "w3", stack: 0, kind: "card", title: "第 3 週", subtitle: "月の半ばの週" })
  .node("w4Card", {
    lane: "w4",
    stack: 0,
    kind: "card",
    title: "第 4〜5 週",
    subtitle: "月の終わりの週",
  })
  .node("monthSummary", {
    lane: "w4",
    stack: 1,
    kind: "card",
    title: "月の合計",
    subtitle: "月ぜんたいのまとめ",
  })
  .readout.calendarMonth("cm", {
    source: "days",
    monthName: "2026 年 1 月",
    color: "#2563eb",
    label: "1 か月 (7 列の升目)",
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
  "1 か月を 4 つの週の縦列に分け、7 列の升目の暦で見せる (calendar-month)";

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
      "ls -1",
      "作業場\n見本\nメモ",
    ],
    ["$", "cd 作業場", ""],
    ["$", "git diff", "-古い説明\n+新しい説明"],
    ["$", "pnpm -v", "9.15.0"],
    ["$", "wc -l メモ", "2 メモ"],
  ] as unknown as (string | number)[])
  .node("lsNode", {
    lane: "fs",
    stack: 0,
    kind: "card",
    title: "ls -1",
    subtitle: "中身を並べる · 出力が長い",
  })
  .node("cdNode", {
    lane: "fs",
    stack: 1,
    kind: "card",
    title: "cd 作業場",
    subtitle: "場所を移る · 出力が無い",
  })
  .node("gitStatusNode", {
    lane: "git",
    stack: 0,
    kind: "card",
    title: "git diff",
    subtitle: "変更の差分を見る",
  })
  .node("pnpmNode", {
    lane: "dev",
    stack: 0,
    kind: "card",
    title: "pnpm -v",
    subtitle: "道具の版を見る",
  })
  .node("dockerNode", {
    lane: "dev",
    stack: 1,
    kind: "card",
    title: "wc -l メモ",
    subtitle: "行の数を数える",
  })
  .readout.terminal("tm", {
    source: "cmds",
    max: 10,
    color: "var(--d-dg-2)",
    label: "端末の画面",
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
          '[["$","ls -1","作業場\\n見本\\nメモ"]]',
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
          '[["$","ls -1","作業場\\n見本"],["$","cd 作業場",""],["$","git diff","-古い説明\\n+新しい説明"]]',
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
          '[["$","ls -1","作業場\\n見本"],["$","cd 作業場",""],["$","git diff","-古い説明\\n+新しい説明"],["$","pnpm -v","9.15.0"],["$","wc -l メモ","2 メモ"]]',
        ),
  )
  .build();
export const subtitle__cliTerminalSession =
  "5 つの命令を置き場の操作 / 変更の履歴 / 開発の道具の縦列に分け、端末の画面で見せる (terminal)";

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
    // 黒の奥の列 (8 段目)
    ["a", 8, "♜"],
    ["b", 8, "♞"],
    ["c", 8, "♝"],
    ["d", 8, "♛"],
    ["e", 8, "♚"],
    ["f", 8, "♝"],
    ["g", 8, "♞"],
    ["h", 8, "♜"],
    // 黒の手前の列 (7 段目)
    ["a", 7, "♟"],
    ["b", 7, "♟"],
    ["c", 7, "♟"],
    ["d", 7, "♟"],
    ["e", 7, "♟"],
    ["f", 7, "♟"],
    ["g", 7, "♟"],
    ["h", 7, "♟"],
    // 白の手前の列 (2 段目)
    ["a", 2, "♙"],
    ["b", 2, "♙"],
    ["c", 2, "♙"],
    ["d", 2, "♙"],
    ["e", 2, "♙"],
    ["f", 2, "♙"],
    ["g", 2, "♙"],
    ["h", 2, "♙"],
    // 白の奥の列 (1 段目)
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
    title: "黒の奥の列",
    subtitle: "ポーン以外 (♜♞♝♛♚♝♞♜)",
  })
  .node("blackPawnNode", {
    lane: "blackPawn",
    stack: 0,
    kind: "card",
    w: 290,
    title: "黒の手前の列",
    subtitle: "ポーンだけの列 (♟)",
  })
  .node("whitePawnNode", {
    lane: "whitePawn",
    stack: 0,
    kind: "card",
    w: 290,
    title: "白の手前の列",
    subtitle: "ポーンだけの列 (♙)",
  })
  .node("whiteBackNode", {
    lane: "whiteBack",
    stack: 0,
    kind: "card",
    w: 270,
    title: "白の奥の列",
    subtitle: "ポーン以外 (♖♘♗♕♔♗♘♖)",
  })
  .readout.chessBoard("cb", { source: "pieces", cellSize: 28, label: "盤面 (8×8)" })
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
  "32 個の駒を黒の奥 / 黒の手前 / 白の手前 / 白の奥の 4 列に分け、8×8 の盤面で開始の形を見せる (chess-board)";

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
    ["todo", "API の型を設計する", "high"],
    ["todo", "文書を書く", "low"],
    ["inprogress", "認証の流れを作る", "high"],
    ["inprogress", "移行の手順を書く", "med"],
    ["done", "自動検査を整える", "med"],
    ["done", "リポジトリを用意する", "low"],
  ] as unknown as (string | number)[])
  .node("todoCard", {
    lane: "todo",
    stack: 0,
    kind: "card",
    title: "未着手",
    subtitle: "まだ手を付けていない列",
  })
  .node("inprogressCard", {
    lane: "inprogress",
    stack: 0,
    kind: "card",
    title: "進行中",
    subtitle: "いま進めている列",
  })
  .node("doneCard", { lane: "done", stack: 0, kind: "card", title: "完了", subtitle: "終わった列" })
  .readout.kanbanBoard("kb", { source: "tasks", columnWidth: 140, max: 5, label: "今期のかんばん" })
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
          '[["todo","API の型を設計する","high"],["todo","文書を書く","low"],["todo","認証の流れを作る","high"],["todo","移行の手順を書く","med"],["todo","自動検査を整える","med"],["todo","リポジトリを用意する","low"]]',
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
          '[["todo","API の型を設計する","high"],["todo","文書を書く","low"],["inprogress","認証の流れを作る","high"],["inprogress","移行の手順を書く","med"],["done","自動検査を整える","med"],["todo","リポジトリを用意する","low"]]',
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
          '[["todo","API の型を設計する","high"],["inprogress","文書を書く","low"],["inprogress","認証の流れを作る","high"],["done","移行の手順を書く","med"],["done","自動検査を整える","med"],["done","リポジトリを用意する","low"]]',
        ),
  )
  .build();
export const subtitle__sprintKanbanBoard =
  "6 件の作業を未着手 / 進行中 / 完了の縦列に分け、かんばんの部品で見せる (kanban-board)";

/**
 * 101. breadcrumb = navigation path、 4 区画 (Home / Docs / API / Reference) を 2 列 2 段に置いた pipeline + 3 next edge + breadcrumb readout 併存。
 * cdl primitive iteration 6 の 2 番目、 pattern taxonomy § 4 pipeline flow と直接共鳴。
 */
export const docsBreadcrumb = diagram("interactive-docs-breadcrumb", {
  topic: "階層 4 段のパンくずを順に辿る",
})
  .lane("col1", { x: 0, width: 270 })
  .lane("col2", { x: 310, width: 300 })
  .arraySignal("path", ["トップ", "文書", "API", "参照"])
  .state("cur", { initial: 2 })
  .node("homeNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 190,
    title: "トップ",
    subtitle: "最上位の階層",
  })
  .node("docsNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 140,
    title: "文書",
    subtitle: "トップの下にある階層",
  })
  .node("apiNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 220,
    title: "API",
    subtitle: "参照の上にある階層",
  })
  .node("refNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 250,
    title: "参照",
    subtitle: "最も深い階層",
  })
  .edge("homeNode", "docsNode", { label: "→", tone: "info" })
  .edge("docsNode", "apiNode", { label: "→", tone: "accent" })
  .edge("apiNode", "refNode", { label: "→", tone: "info" })
  .readout.breadcrumb("bc", {
    source: "path",
    currentSource: "cur",
    color: "#2563eb",
    label: "現在地",
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
  "トップ → 文書 → API → 参照の 4 階層を矢印でつなぎ、いまの居場所を辿った道で示す (breadcrumb)";

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
    ["09:00", "朝会", "進み具合を合わせる"],
    ["10:30", "設計の確認", "3 案を比べる"],
    ["14:00", "試験環境へ配備", "v1.2.0"],
    ["16:00", "1 対 1 の面談", "これからの仕事の話"],
    ["19:30", "振り返り", "第 42 期の締め"],
  ] as unknown as (string | number)[])
  .node("morningCard", {
    lane: "morning",
    stack: 0,
    kind: "card",
    title: "午前",
    subtitle: "9 時から 12 時まで",
  })
  .node("afternoonCard", {
    lane: "afternoon",
    stack: 0,
    kind: "card",
    title: "午後",
    subtitle: "12 時から 18 時まで",
  })
  .node("eveningCard", {
    lane: "evening",
    stack: 0,
    kind: "card",
    title: "夜",
    subtitle: "18 時から後",
  })
  .readout.timelineVertical("tv", {
    source: "events",
    color: "#2563eb",
    max: 8,
    label: "1 日の予定",
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
        .set("events", '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"]]'),
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
          '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"],["14:00","試験環境へ配備"],["16:00","1 対 1 の面談","これからの仕事の話"]]',
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
          '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"],["14:00","試験環境へ配備","v1.2.0"],["16:00","1 対 1 の面談","これからの仕事の話"],["19:30","振り返り","第 42 期の締め"]]',
        ),
  )
  .build();
export const subtitle__dayScheduleTimeline =
  "1 日の予定を午前 / 午後 / 夜の縦列に分け、縦に並べた時刻で見せる (timeline-vertical)";

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
    title: "稼働",
    subtitle: "稼働している区間 (緑)",
  })
  .node("idleCard", {
    lane: "idle",
    stack: 0,
    kind: "card",
    title: "待機",
    subtitle: "待機している区間 (灰)",
  })
  .node("errorCard", {
    lane: "error",
    stack: 0,
    kind: "card",
    title: "異常",
    subtitle: "異常が出た区間 (赤)",
  })
  .readout.statusTimeline("st", { source: "events", max: 8, label: "サーバの状態" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "平常の稼働",
      body: "同じ色の区間が続く。 区間の字は状態の名前 (稼働 / 待機 / 異常) で出ることが読める。",
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
  "稼働の記録の 6 区間を稼働 / 待機 / 異常の縦列に分け、区間を色で塗った帯で見せる (status-timeline)";

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
    ["月", true, false],
    ["火", false, false],
    ["水", true, true],
    ["木", false, false],
    ["金", true, false],
    ["土", false, false],
    ["日", false, false],
  ] as unknown as (string | number)[])
  .node("monNode", {
    lane: "mon",
    stack: 0,
    kind: "card",
    w: 110,
    title: "月曜",
    subtitle: "予定を持つ日",
  })
  .node("tueNode", {
    lane: "tue",
    stack: 0,
    kind: "card",
    w: 110,
    title: "火曜",
    subtitle: "予定を持たない日",
  })
  .node("wedNode", {
    lane: "wed",
    stack: 0,
    kind: "card",
    w: 160,
    title: "水曜",
    subtitle: "予定を持つ日",
  })
  .node("thuNode", {
    lane: "thu",
    stack: 0,
    kind: "card",
    w: 110,
    title: "木曜",
    subtitle: "予定を持たない日",
  })
  .node("friNode", {
    lane: "fri",
    stack: 0,
    kind: "card",
    w: 110,
    title: "金曜",
    subtitle: "予定を持つ日",
  })
  .node("satNode", {
    lane: "sat",
    stack: 0,
    kind: "card",
    w: 110,
    title: "土曜",
    subtitle: "予定のない週末",
  })
  .node("sunNode", {
    lane: "sun",
    stack: 0,
    kind: "card",
    w: 110,
    title: "日曜",
    subtitle: "週明け前の休日",
  })
  .readout.calendarWeek("cw", {
    source: "week",
    cellSize: 40,
    color: "#2563eb",
    label: "今週",
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
          '[["月",true,true],["火",false,false],["水",true,false],["木",false,false],["金",true,false],["土",false,false],["日",false,false]]',
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
          '[["月",true,false],["火",false,false],["水",true,true],["木",false,false],["金",true,false],["土",false,false],["日",false,false]]',
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
          '[["月",true,false],["火",false,false],["水",true,false],["木",false,false],["金",true,true],["土",false,false],["日",false,false]]',
        ),
  )
  .build();
export const subtitle__weekCalendarView =
  "1 週間を曜日ごとの 7 つの縦列に分け、今週の暦で見せる (calendar-week)";

/**
 * 105. kpi-comparison = A/B team score 比較を 2-lane 分散 + kpiComparison readout 併存。 iteration 6 wave 3、 pattern taxonomy § 3 category split。
 */
export const teamKpiComparison = diagram("interactive-team-kpi-compare", {
  topic: "2 チームの成績を並べて比べる",
})
  .lane("teamA", { x: 0, width: 340 })
  .lane("teamB", { x: 380, width: 340 })
  .arraySignal("teams", [
    ["チーム A", 82],
    ["チーム B", 65],
  ] as unknown as (string | number)[])
  .node("aCard", {
    lane: "teamA",
    stack: 0,
    kind: "card",
    title: "チーム A",
    subtitle: "上の帯 (青)",
  })
  .node("aDetail", {
    lane: "teamA",
    stack: 1,
    kind: "card",
    title: "進む速さ",
    subtitle: "上の帯が表す量",
  })
  .node("bCard", {
    lane: "teamB",
    stack: 0,
    kind: "card",
    title: "チーム B",
    subtitle: "下の帯 (橙)",
  })
  .node("bDetail", {
    lane: "teamB",
    stack: 1,
    kind: "card",
    title: "進む速さ",
    subtitle: "下の帯が表す量",
  })
  .edge("aCard", "bCard", { label: "差", tone: "warning" })
  .readout.kpiComparison("kc", {
    source: "teams",
    max: 100,
    colorA: "#2563eb",
    colorB: "#f97316",
    label: "成績の比較",
  })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "差が大きい",
      body: "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。",
    },
    (p: PhaseBuilder) => p.activate("aCard", "bCard").set("teams", '[["チーム A",82],["チーム B",41]]'),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "追い上げる",
      body: "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。",
    },
    (p: PhaseBuilder) =>
      p.activate("aCard", "aDetail", "bCard").set("teams", '[["チーム A",82],["チーム B",65]]'),
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
        .set("teams", '[["チーム A",84],["チーム B",80]]'),
  )
  .build();
export const subtitle__teamKpiComparison =
  "2 つのチームの進む速さを上の帯と下の帯に分け、差を矢印で示して比べる (kpi-comparison)";

/**
 * 106. step-progress = 4 step wizard を 4 区画 2 列 2 段の pipeline + 3 next edge + stepProgress readout 併存。 iteration 6 wave 4、 pattern taxonomy § 4 pipeline flow + § 5 fan-out。
 */
export const publishWorkflowSteps = diagram("interactive-publish-workflow", {
  topic: "記事公開の 4 工程を順に追う",
})
  .lane("col1", { x: 0, width: 300 })
  .lane("col2", { x: 340, width: 270 })
  .arraySignal("steps", ["下書き", "確認", "承認", "公開"])
  .state("cur", { initial: 2 })
  .node("draftNode", {
    lane: "col1",
    stack: 0,
    kind: "card",
    w: 190,
    title: "下書き",
    subtitle: "最初の工程",
  })
  .node("reviewNode", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 190,
    title: "確認",
    subtitle: "下書きの次の工程",
  })
  .node("approveNode", {
    lane: "col1",
    stack: 1,
    kind: "card",
    w: 250,
    title: "承認",
    subtitle: "公開の直前の工程",
  })
  .node("publishNode", {
    lane: "col2",
    stack: 1,
    kind: "card",
    w: 220,
    title: "公開",
    subtitle: "最後の工程",
  })
  .edge("draftNode", "reviewNode", { label: "出す", tone: "success" })
  .edge("reviewNode", "approveNode", { label: "確かめた", tone: "info" })
  .edge("approveNode", "publishNode", { label: "公開する", tone: "accent" })
  .readout.stepProgress("sp", {
    source: "cur",
    stepsSource: "steps",
    color: "#2563eb",
    label: "公開の手順",
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
  "下書き → 確認 → 承認 → 公開の 4 工程を矢印でつなぎ、公開の手順の進み具合で見せる (step-progress)";

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
    ["佐藤", "online"],
    ["鈴木", "away"],
    ["高橋", "online"],
    ["田中", "offline"],
    ["伊藤", "online"],
  ] as unknown as (string | number)[])
  .node("aliceCard", {
    lane: "online",
    stack: 0,
    kind: "card",
    title: "佐藤",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("carolCard", {
    lane: "online",
    stack: 1,
    kind: "card",
    title: "高橋",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("eveCard", {
    lane: "online",
    stack: 2,
    kind: "card",
    title: "伊藤",
    subtitle: "在席の人 (緑の丸)",
  })
  .node("bobCard", {
    lane: "away",
    stack: 0,
    kind: "card",
    title: "鈴木",
    subtitle: "離席の人 (黄の丸)",
  })
  .node("danCard", {
    lane: "offline",
    stack: 0,
    kind: "card",
    title: "田中",
    subtitle: "不在の人 (灰の丸)",
  })
  .readout.userPresence("up", { source: "team", max: 6, label: "チームの在席" })
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
          '[["佐藤","offline"],["鈴木","offline"],["高橋","offline"],["田中","offline"],["伊藤","offline"]]',
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
          '[["佐藤","online"],["鈴木","away"],["高橋","offline"],["田中","offline"],["伊藤","online"],["渡辺","online"]]',
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
          '[["佐藤","online"],["鈴木","away"],["高橋","offline"],["田中","offline"],["伊藤","online"],["渡辺","online"],["山本","away"]]',
        ),
  )
  .build();
export const subtitle__teamPresenceStatus =
  "5 人を在席 / 離席 / 不在の縦列に分け、色の丸で在席を見せる (user-presence)";

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
    title: "▲ 賛成票",
    subtitle: "帯の緑の側を決める票",
  })
  .node("upDetail", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "賛成",
    subtitle: "帯の緑の部分",
  })
  .node("downCard", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "▼ 反対票",
    subtitle: "帯の赤の側を決める票",
  })
  .node("downDetail", {
    lane: "down",
    stack: 1,
    kind: "card",
    title: "反対",
    subtitle: "帯の赤の部分",
  })
  .edge("upCard", "downCard", { label: "割合", tone: "warning" })
  .readout.ratingThumb("rt", {
    source: "votes",
    colorUp: "#22c55e",
    colorDown: "#ef4444",
    label: "評価",
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
  "賛成票と反対票を 2 つの縦列に分け、緑と赤の帯の割合で見せる (rating-thumb)";

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
    ["佐藤 社長", 0],
    ["鈴木 開発部長", 1],
    ["高橋 営業部長", 1],
    ["田中 開発", 2],
    ["伊藤 開発", 2],
    ["渡辺 営業", 2],
  ] as unknown as (string | number)[])
  .node("ceoCard", {
    lane: "ceo",
    stack: 0,
    kind: "card",
    title: "佐藤 社長",
    subtitle: "最上位の階層",
  })
  .node("vpEng", {
    lane: "vp",
    stack: 0,
    kind: "card",
    title: "鈴木 開発部長",
    subtitle: "中間の階層",
  })
  .node("vpSales", {
    lane: "vp",
    stack: 1,
    kind: "card",
    title: "高橋 営業部長",
    subtitle: "中間の階層",
  })
  .node("icDan", { lane: "ic", stack: 0, kind: "card", title: "田中 開発", subtitle: "最下位の階層" })
  .node("icEve", { lane: "ic", stack: 1, kind: "card", title: "伊藤 開発", subtitle: "最下位の階層" })
  .node("icFrank", {
    lane: "ic",
    stack: 2,
    kind: "card",
    title: "渡辺 営業",
    subtitle: "最下位の階層",
  })
  .edge("ceoCard", "vpEng", { label: "率いる", tone: "info" })
  .edge("ceoCard", "vpSales", { label: "率いる", tone: "info" })
  .edge("vpEng", "icDan", { label: "まとめる", tone: "accent" })
  .edge("vpEng", "icEve", { label: "まとめる", tone: "accent" })
  .edge("vpSales", "icFrank", { label: "まとめる", tone: "accent" })
  .readout.orgChartMini("oc", { source: "org", color: "#2563eb", label: "組織の階層" })
  .phase(
    "p1",
    {
      duration: 1800,
      title: "創業した頃",
      body: "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。",
    },
    (p: PhaseBuilder) => p.activate("ceoCard").set("org", '[["佐藤 社長",0]]'),
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
        .set("org", '[["佐藤 社長",0],["鈴木 開発部長",1],["高橋 営業部長",1]]'),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "現場が増える",
      body: "3 段目まで揃う。 2 段目の 2 人の下に 3 人が並び、6 つの箱で組織の全体が読める。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("ceoCard", "vpEng", "vpSales", "icDan", "icEve", "icFrank")
        .set(
          "org",
          '[["佐藤 社長",0],["鈴木 開発部長",1],["高橋 営業部長",1],["田中 開発",2],["伊藤 開発",2],["渡辺 営業",2]]',
        ),
  )
  .build();
export const subtitle__startupOrgChart =
  "社長 / 部長 2 人 / 担当 3 人の 3 階層を縦列に分け、率いる相手を矢印でつなぐ (org-chart-mini)";

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
  .node("curCard", { lane: "cur", stack: 0, kind: "card", title: "今月", subtitle: "大きく出る数" })
  .node("prevCard", {
    lane: "delta",
    stack: 0,
    kind: "card",
    title: "先月",
    subtitle: "差を求めるもとの数",
  })
  .node("deltaCard", {
    lane: "delta",
    stack: 1,
    kind: "card",
    title: "差",
    subtitle: "今月 - 先月の差",
  })
  .node("histCard", {
    lane: "hist",
    stack: 0,
    kind: "card",
    title: "推移",
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
    label: "NPS の推移",
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
  "推奨度 (NPS) の今月の値 / 先月との差 / 推移を縦列に分け、1 枚の札にまとめて見せる (kpi-trend-tile)";

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
    title: "👍 いいね",
    subtitle: "票が最も多い絵文字",
  })
  .node("heartCard", {
    lane: "heart",
    stack: 0,
    kind: "card",
    title: "❤️ 好き",
    subtitle: "次に多い絵文字",
  })
  .node("partyCard", {
    lane: "party",
    stack: 0,
    kind: "card",
    title: "🎉 お祝い",
    subtitle: "票が最も少ない絵文字",
  })
  .readout.quickPollEmoji("qp", { source: "votes", colorWinner: "#2563eb", label: "反応" })
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
  "いいね / 好き / お祝いの 3 つの絵文字への票を縦列に分け、反応の部品で見せる (quick-poll-emoji)";

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
  "送り主 / 波形 / 再生を縦列に分け、音の大小を棒の高さに、再生した位置を棒の色で見せる (voice-message)";

/**
 * 113. thread-summary = 会話スレッド概要を 3-lane (未読 / 参加者 / 直近) category split 分散 + threadSummary readout 併存 + 3 phase 動き (静か → 新着 tween → 混雑)。 iteration 7 wave 1、 pattern taxonomy § 3 category split。
 */
export const teamThreadSummary = diagram("interactive-team-thread-summary", {
  topic: "スレッドの未読 / 参加者 / 経過をまとめる",
})
  .lane("unread", { x: 0, width: 220 })
  .lane("participants", { x: 260, width: 220 })
  .lane("activity", { x: 520, width: 260 })
  .arraySignal("thread", [5, 8, "佐藤", "12 分前"] as unknown as (string | number)[])
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
      p.activate("partCard").set("thread", '[0,4,"鈴木","2 時間前"]').badge("静か"),
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
        .set("thread", '[3,6,"高橋","25 分前"]')
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
        .set("thread", '[5,8,"佐藤","12 分前"]')
        .badge("混雑"),
  )
  .build();
export const subtitle__teamThreadSummary =
  "話し合いの未読 / 参加者 / 直近の発言者 / 経過を縦列に分け、1 行の概要にまとめる (thread-summary)";

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
      body: "状態は 0。 送信の列だけが光り、灰の単チェックが出る (送ったが、まだ届いていない)。",
    },
    (p: PhaseBuilder) => p.activate("sentCard").set("status", 0).badge("送信"),
  )
  .phase(
    "p2",
    {
      duration: 1500,
      title: "配信完了",
      body: "状態を 1 にすると配信の列も光り、灰の二重チェックに変わる (届いたが、まだ読まれていない)。",
    },
    (p: PhaseBuilder) => p.activate("sentCard", "deliveredCard").set("status", 1).badge("配信"),
  )
  .phase(
    "p3",
    {
      duration: 1500,
      title: "既読",
      body: "状態を 2 にすると既読の列も光り、二重チェックが青に変わる (読まれたことが分かる)。",
    },
    (p: PhaseBuilder) =>
      p.activate("sentCard", "deliveredCard", "readCard").set("status", 2).badge("既読"),
  )
  .build();
export const subtitle__dmReadReceipt =
  "1 対 1 の連絡 (DM) の送信 / 配信 / 既読の 3 段階を矢印でつなぎ、印の数と色で示す (read-receipt)";

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
    title: "◆ パスワード",
    subtitle: "いまの段階 {pw} · 伏せ字で出す",
  })
  .node("meterBars", {
    lane: "meter",
    stack: 0,
    kind: "card",
    title: "4 区切りのメーター",
    subtitle: "段階 {pw} の数だけ色が付く",
  })
  .node("levelLabel", {
    lane: "meter",
    stack: 1,
    kind: "card",
    title: "段階の名前",
    subtitle: "メーターと同じ色で出る",
  })
  .node("rule1", {
    lane: "rules",
    stack: 0,
    kind: "card",
    title: "✓ 8 文字以上",
    subtitle: "段階 1 以上で満たす",
  })
  .node("rule2", {
    lane: "rules",
    stack: 1,
    kind: "card",
    title: "✓ 大小混合",
    subtitle: "段階 2 以上で満たす",
  })
  .node("rule3", {
    lane: "rules",
    stack: 2,
    kind: "card",
    title: "✓ 数字 + 記号",
    subtitle: "段階 3 以上で満たす",
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
      title: "弱い (段階 1)",
      body: "最初の入力で段階は 1。 メーターは 1 区切りだけ赤く、満たす決まりは 8 文字以上の 1 つだけ。 入力とメーターの列が光る。",
    },
    (p: PhaseBuilder) => p.activate("pwField", "meterBars", "rule1").set("pw", 1).badge("弱い"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "改善中 (段階 1 → 3)",
      body: "文字を足して大文字と小文字を混ぜ、段階が 1 から 3 へ上がる。 メーターが赤から橙、黄、黄緑へ続けて変わり、残り 2 つの決まりも光る。",
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
      title: "強い (段階 4)",
      body: "数字と記号を足して段階が 4 になる。 メーターは 4 区切りすべてが緑になり、決まりを全部満たして 6 つの箱がすべて光る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("pwField", "meterBars", "levelLabel", "rule1", "rule2", "rule3")
        .set("pw", 4)
        .badge("強い"),
  )
  .build();
export const subtitle__formPasswordCheck =
  "パスワードの強さを 4 区切りの目盛りと 3 つの条件で示し、段階の名前を同じ色で出す (password-strength)";

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
  .readout.otpInput("oi", { source: "otp", colorFocus: "#2563eb", label: "確認コード" })
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
  "送られた 6 桁の確認の符号 (OTP) を 6 つの枠に入れ、埋まると検証に送る (otp-input)";

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
    subtitle: "破線の枠と上向きの矢印",
  })
  .node("uploadedCard", {
    lane: "col2",
    stack: 0,
    kind: "card",
    w: 310,
    title: "◆ 顔写真.png",
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
  .edge("emptyCard", "uploadedCard", { label: "置く", tone: "info" })
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
      body: "ファイルは空。 未選択の箱だけが光り、置き場は破線の枠に上向きの矢印と案内を出す。",
    },
    (p: PhaseBuilder) => p.activate("emptyCard").set("file", "").badge("未選択"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "ドロップ受信",
      body: "ファイルを空から「顔写真.png」 に切り替え、アップロードの箱も光る。 置き場は実線の枠に変わり、ファイル名の札を出す。",
    },
    (p: PhaseBuilder) =>
      p.activate("emptyCard", "uploadedCard").set("file", "顔写真.png").badge("アップロード"),
  )
  .phase(
    "p3",
    {
      duration: 1500,
      title: "プレビュー表示",
      body: "アップロードが終わり、プレビューの箱も光る。 丸く切り抜いた顔写真が出て、3 つの箱がすべて光る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("emptyCard", "uploadedCard", "previewCard")
        .set("file", "顔写真.png")
        .badge("完了"),
  )
  .build();
export const subtitle__profileAvatarUpload =
  "未選択 → 画像を置く → 丸く切り抜いて見せるの 3 つの状態を矢印でつなぎ、画像を置く枠の部品で見せる (file-dropzone)";

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
    ["09:00:12", 1, "サーバの起動が済んだ"],
    ["09:00:15", 1, "DB の接続の枠 20"],
    ["09:01:03", 2, "メモリ使用率 82%"],
    ["09:01:47", 3, "ワーカーが落ちた: メモリ不足"],
    ["09:02:02", 1, "ワーカーを再起動した"],
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
  .readout.logStream("ls", { source: "logs", label: "ログの末尾" })
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
        .set("logs", '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"]]')
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
          '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"],["09:01:03",2,"メモリ使用率 82%"]]',
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
          '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"ワーカーが落ちた: メモリ不足"],["09:02:02",1,"ワーカーを再起動した"],["09:02:30",1,"死活監視で正常"]]',
        )
        .badge("障害"),
  )
  .build();
export const subtitle__prodLogTail =
  "本番の記録の直近 5 行を時刻 / 重さ / 本文の縦列に分け、情報 / 注意 / 異常の札の色で見せる (log-stream)";

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
      p.activate("triggerCard", "sevCard").set("alert", '[0,"CPU 68% — 通常の範囲"]').badge("情報"),
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
        .badge("注意"),
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
        .set("alert", '[3,"本番機 3 号が応答なし — 切替が要る"]')
        .badge("異常"),
  )
  .build();
export const subtitle__opsAlertBanner =
  "運用の知らせをきっかけ / 重要度 / 対応の縦列に分け、重要度で色と記号が変わる帯で見せる (alert-banner)";

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
    ["API", 2],
    ["画面", 2],
    ["認証", 2],
    ["DB", 1],
    ["一時保存", 1],
    ["待ち行列", 0],
  ] as unknown as (string | number)[])
  .node("apiCard", {
    lane: "up",
    stack: 0,
    kind: "card",
    title: "API",
    subtitle: "稼働を表す緑のマス",
  })
  .node("webCard", {
    lane: "up",
    stack: 1,
    kind: "card",
    title: "画面",
    subtitle: "稼働を表す緑のマス",
  })
  .node("authCard", {
    lane: "up",
    stack: 2,
    kind: "card",
    title: "認証",
    subtitle: "稼働を表す緑のマス",
  })
  .node("dbCard", {
    lane: "deg",
    stack: 0,
    kind: "card",
    title: "DB",
    subtitle: "劣化を表す黄のマス",
  })
  .node("cacheCard", {
    lane: "deg",
    stack: 1,
    kind: "card",
    title: "一時保存",
    subtitle: "劣化を表す黄のマス",
  })
  .node("queueCard", {
    lane: "down",
    stack: 0,
    kind: "card",
    title: "待ち行列",
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
        .set("svcs", '[["API",2],["画面",2],["認証",2],["DB",2],["一時保存",2],["待ち行列",2]]')
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
        .set("svcs", '[["API",2],["画面",2],["認証",2],["DB",1],["一時保存",1],["待ち行列",2]]')
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
        .set("svcs", '[["API",2],["画面",2],["認証",2],["DB",1],["一時保存",1],["待ち行列",0]]')
        .badge("障害"),
  )
  .build();
export const subtitle__serviceHealthGrid =
  "6 つのサービスを稼働 / 劣化 / 停止の縦列に分け、緑 / 黄 / 赤の升目で見せる (service-health)";

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
  "買い物かごの点数から小計を出し、送料を足して合計に至るまでを矢印でつなぐ (cart-summary)";

/**
 * 122. pricing-tier = SaaS 料金プラン (3 tier 比較) を 3-lane (Starter / Pro / Enterprise) category split 分散 + pricingTier readout 併存 + 3 phase 動き (Starter → Pro tween → Enterprise 検討)。 iteration 7 wave 4、 pattern taxonomy § 3 category split。
 */
export const saasPricingTier = diagram("interactive-saas-pricing-tier", {
  topic: "料金 3 プランを並べて比べる",
})
  .lane("starter", { x: 0, width: 240 })
  .lane("pro", { x: 280, width: 240 })
  .lane("enterprise", { x: 560, width: 260 })
  .arraySignal("plan", ["標準", 29, "10 席", "優先サポート", "カスタムドメイン"] as unknown as (
    string | number
  )[])
  .node("starterCard", {
    lane: "starter",
    stack: 0,
    kind: "card",
    title: "入門",
    subtitle: "最も安いプラン",
  })
  .node("proCard", { lane: "pro", stack: 0, kind: "card", title: "標準", subtitle: "中間のプラン" })
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
    title: "法人",
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
      p.activate("starterCard").set("plan", '["入門",9,"3 席"]').badge("入門"),
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
        .set("plan", '["標準",29,"10 席","優先サポート","カスタムドメイン"]')
        .badge("標準"),
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
        .set("plan", '["法人",99,"無制限の席","専任の担当","監査ログ","一括ログイン","稼働の保証"]')
        .badge("比較"),
  )
  .build();
export const subtitle__saasPricingTier =
  "入門 / 標準 / 法人の 3 つの料金の種類を縦列に分け、名前と価格と特典を並べて比べる (pricing-tier)";

/**
 * 123. coupon-code = チェックアウト クーポン適用フローを 3-lane (未入力 / 入力済 / 適用済) state-driven visibility 分散 + couponCode readout 併存 + 3 phase 動き (未入力 → 入力 → 適用 tween)。 iteration 7 wave 4、 pattern taxonomy § 2 state-driven visibility。
 */
export const checkoutCouponApply = diagram("interactive-checkout-coupon-apply", {
  topic: "クーポンの未入力から適用までを追う",
})
  .lane("empty", { x: 0, width: 240 })
  .lane("entered", { x: 280, width: 240 })
  .lane("applied", { x: 560, width: 240 })
  .arraySignal("coupon", ["春割20", 20] as unknown as (string | number)[])
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
        .set("coupon", '["春割20",0]')
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
        .set("coupon", '["春割20",20]')
        .badge("適用"),
  )
  .build();
export const subtitle__checkoutCouponApply =
  "割引の符号の未入力 → 入力済 → 適用済の 3 つの状態を矢印でつなぎ、割引の札の出方を見せる (coupon-code)";

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
    "dragon で操作できる図を作る",
    "佐藤",
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
    subtitle: "札の上に太字で出る見出し",
  })
  .node("excerptCard", {
    lane: "content",
    stack: 1,
    kind: "card",
    title: "抜粋",
    subtitle: "見出しの下に出る本文",
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
  .readout.articlePreview("ap", { source: "article", colorAccent: "#2563eb", label: "記事カード" })
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
        .set("article", '["入門","はじめの一歩","鈴木","5 分前"]')
        .badge("初期"),
  )
  .phase(
    "p2",
    {
      duration: 1800,
      title: "題と抜粋が伸びる",
      body: "題と抜粋が長くなる。 どちらも札の幅に収まる長さで、4 つの値の位置は変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbCard", "titleCard", "excerptCard")
        .set(
          "article",
          '["dragon 入門","dragon で操作できる図を作る","佐藤","2 時間前"]',
        )
        .badge("かざす"),
  )
  .phase(
    "p3",
    {
      duration: 1800,
      title: "別の記事",
      body: "4 つの値がすべて別の記事のものに入れ替わる。 札の形は変わらず、著者と経過の行も入れ替わる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("thumbCard", "titleCard", "excerptCard", "authorCard", "timeCard")
        .set(
          "article",
          '["操作できる図の手引き 2026 年版","段ごとの変化と表示部品の連動を解説","高橋","3 日前"]',
        )
        .badge("押す"),
  )
  .build();
export const subtitle__blogArticlePreview =
  "記事の縮小画像 / 見出しと抜粋 / 著者と経過を縦列に分け、1 枚の記事の札にまとめる (article-preview)";

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
  .readout.tocNav("tn", { source: "toc", colorActive: "#2563eb", label: "文書の目次" })
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
        .badge("はじめに"),
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
        .badge("導入"),
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
        .badge("最初の図"),
  )
  .build();
export const subtitle__docsTocNav =
  "文書の目次を字下げの深さで 3 つの縦列に分け、読んでいる節を示す (toc-nav)";

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
  .node("twCard", { lane: "tw", stack: 0, kind: "card", title: "X", subtitle: "共有が最も多い先" })
  .node("fbCard", { lane: "fb", stack: 0, kind: "card", title: "フェイスブック", subtitle: "次に多い先" })
  .node("liCard", { lane: "li", stack: 0, kind: "card", title: "リンクトイン", subtitle: "中ほどの先" })
  .node("rdCard", {
    lane: "li",
    stack: 1,
    kind: "card",
    title: "レディット",
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
        .set("shares", '[["tw",245],["fb",89],["li",32],["rd",18],["ig",6]]')
        .badge("バズ"),
  )
  .build();
export const subtitle__socialShareButtons =
  "記事を共有した 4 つの先を縦列に分け、共有数付きの押す先の並びで見せる (share-buttons)";

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
    eyebrow: "顧客",
    subtitle: "購入者",
  })
  .node("mobile", {
    lane: "customer-lane",
    stack: 1,
    kind: "shape-mobile-device",
    title: "iPhone",
    eyebrow: "端末",
    subtitle: "iOS 17 のブラウザ",
  })
  .node("card", {
    lane: "customer-lane",
    stack: 2,
    kind: "shape-credit-card",
    title: "VISA **1234",
    eyebrow: "カード",
    subtitle: "発行銀行のカード",
  })
  .node("shop", {
    lane: "processor",
    stack: 0,
    kind: "shape-online-shop",
    title: "ひだまり雑貨店",
    eyebrow: "加盟店",
    subtitle: "会計 · ¥{amount}",
  })
  .node("gateway", {
    lane: "processor",
    stack: 1,
    kind: "shape-api-gateway",
    title: "API の入口",
    eyebrow: "入口",
    subtitle: "認証と回数の制限",
  })
  .node("provider", {
    lane: "processor",
    stack: 2,
    kind: "shape-payment-provider",
    title: "Stripe",
    eyebrow: "決済代行",
    subtitle: "本人認証 {auth3ds}%",
  })
  .node("bankShape", {
    lane: "bank",
    stack: 0,
    kind: "shape-bank",
    title: "発行銀行",
    eyebrow: "銀行",
    subtitle: "カードの発行元 · 与信照会",
  })
  .node("ledger", {
    lane: "bank",
    stack: 1,
    kind: "shape-cylinder",
    title: "取引台帳",
    eyebrow: "記録",
    subtitle: "記帳と監査の記録",
  })
  .edge("customer", "mobile", { label: "操作", tone: "info" })
  .edge("mobile", "shop", { label: "購入", tone: "info" })
  .edge("shop", "gateway", { label: "購入を送る", tone: "info" })
  .edge("gateway", "provider", { label: "転送", tone: "info" })
  .edge("card", "provider", { label: "本人認証", tone: "accent" })
  .edge("provider", "bankShape", { label: "決済要求", tone: "success" })
  .edge("bankShape", "ledger", { label: "記帳", tone: "success" })
  .readout.stat("amountStat", { source: "amount", unit: " 円", caption: "決済金額", label: "金額" })
  .readout.gauge("authGauge", {
    source: "auth3ds",
    min: 0,
    max: 100,
    color: "#22c55e",
    label: "本人認証 %",
  })
  .readout.trafficLight("statusTL", { source: "txStatus", label: "決済の状態" })
  .readout.countup("totalCU", { source: "totalTx", unit: " 件", label: "本日の取引の累計", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2200,
      title: "商品購入",
      body: "田中様が iPhone で店に入り、会計で購入を決める。 金額が 0 から 12500 円まで上がり、決済の状態は赤、本人認証の針は最も下にある。 顧客と店の列が光る。",
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
      title: "本人認証",
      body: "入口を通って Stripe へ送り、VISA カードの本人認証を行う。 決済の状態が赤から黄へ、本人認証の針が 92% の緑の域まで上がる。 処理の列がすべて光り、カードから決済代行への矢印が強調される。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "card", "shop", "gateway", "provider")
        .tween("txStatus", 0, 1)
        .tween("auth3ds", 0, 92)
        .badge("本人認証"),
  )
  .phase(
    "p3",
    {
      duration: 2000,
      title: "銀行確定",
      body: "本人認証を通り、発行銀行に与信を照会して決済を確定する。 決済の状態が黄から緑へ、本人認証が 98% まで上がって確定し、銀行の列が光る。",
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
      body: "銀行が取引台帳に記帳し、監査の記録を残す。 本日の取引の累計が 800ms かけて 1 件増え、8 つの形がすべて光って決済が終わる。",
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
  "購入者 / 決済の窓口 / 銀行の縦列で、購入から本人認証と銀行の確定を経て記帳に至る 4 段を追い、金額と認証の割合と状態を部品で出す";

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
    eyebrow: "利用者",
    subtitle: "メールとパスワードを送る",
  })
  .node("mobile", {
    lane: "user",
    stack: 1,
    kind: "shape-mobile-device",
    title: "スマートフォン",
    eyebrow: "端末",
    subtitle: "Android 14 のブラウザ",
  })
  .node("authApi", {
    lane: "auth",
    stack: 0,
    kind: "shape-server-rack",
    title: "認証 API",
    eyebrow: "サーバ",
    subtitle: "資格情報の一次検証",
  })
  .node("mfaCheck", {
    lane: "auth",
    stack: 1,
    kind: "shape-diamond",
    title: "2 段階が要る?",
    eyebrow: "分岐",
    subtitle: "認証アプリの 6 桁か SMS",
  })
  .node("jwtSign", {
    lane: "auth",
    stack: 2,
    kind: "shape-hexagon",
    title: "JWT 発行器",
    eyebrow: "署名",
    subtitle: "署名する · 有効は 1 時間",
  })
  .node("session", {
    lane: "session-lane",
    stack: 0,
    kind: "shape-cylinder",
    title: "Redis",
    eyebrow: "一時保存",
    subtitle: "保持は 3600 秒",
  })
  .node("token", {
    lane: "session-lane",
    stack: 1,
    kind: "shape-cloud",
    title: "JWT トークン",
    eyebrow: "応答",
    subtitle: "応答に付けて返す · 画面を移す",
  })
  .edge("customer", "mobile", { label: "入力", tone: "info" })
  .edge("mobile", "authApi", { label: "認証を求める", tone: "info" })
  .edge("authApi", "mfaCheck", { label: "一次を通過", tone: "success" })
  .edge("mfaCheck", "jwtSign", { label: "2 段階目を通過", tone: "success" })
  .edge("jwtSign", "session", { label: "セッションを保存", tone: "success" })
  .edge("session", "token", { label: "トークンを発行", tone: "success" })
  .readout.trafficLight("statusTL", { source: "authStatus", label: "認証の状態 (0/1/2)" })
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
      body: "山田様がスマートフォンのログイン画面から資格情報を送る。 認証の状態は赤 (まだ確かめていない) で、応答時間の帯が 80ms まで立ち上がる。 利用者の列がすべて光る。",
    },
    (p: PhaseBuilder) =>
      p.activate("customer", "mobile").set("authStatus", 0).tween("latency", 0, 80).badge("要求"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "一次検証",
      body: "認証 API が資格情報を照らし合わせ、ハッシュを比べる。 認証の状態が赤から黄へ、応答時間が 220ms へ伸び、少数の失敗を数えて成功率が 99% に下がる。",
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
      title: "2 段階認証",
      body: "認証アプリの 6 桁を、認証サーバが時刻の幅に照らして確かめる。 認証の状態は黄のまま、2 段階目の手間で応答時間が 350ms まで伸びる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("customer", "mobile", "authApi", "mfaCheck")
        .set("authStatus", 1)
        .tween("latency", 220, 350)
        .badge("2 段階"),
  )
  .phase(
    "p4",
    {
      duration: 2000,
      title: "セッション発行",
      body: "2 段階目を通り、JWT を発行して Redis にセッションを保存する。 認証の状態が黄から緑へ、応答時間が 180ms へ縮み、成功率は 99% のまま。",
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
      body: "JWT トークンを応答に付けて返し、画面を移す。 本日成功ログインが 900ms かけて 1 回増え、応答時間が 50ms まで縮んで 7 つの形がすべて光る。",
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
  "利用者 / 認証 / 保存の縦列で、要求から一次検証と 2 段階の認証を経て応答に至る 5 段を追い、成功の数と割合と応答時間を部品で出す";

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
    title: "新着の知らせ",
    eyebrow: "きっかけ",
    subtitle: '"注文が発送されました"',
  })
  .node("kafka", {
    lane: "infra",
    stack: 0,
    kind: "shape-stack",
    title: "Kafka キュー",
    eyebrow: "キュー",
    subtitle: "残 {queued} 件 · 保持は 300 秒",
  })
  .node("fcm", {
    lane: "infra",
    stack: 1,
    kind: "shape-cloud",
    title: "配信サービス",
    eyebrow: "通知",
    subtitle: "まとめて配る処理",
  })
  .node("retryGate", {
    lane: "infra",
    stack: 2,
    kind: "shape-diamond",
    title: "再送の判定",
    eyebrow: "方針",
    subtitle: "間隔を倍に広げる · 最大 3 回",
  })
  .node("iphone", {
    lane: "devices",
    stack: 0,
    kind: "shape-mobile-device",
    title: "iPhone",
    eyebrow: "端末",
    subtitle: "iOS の通知網 · 前面で受ける",
  })
  .node("pixel", {
    lane: "devices",
    stack: 1,
    kind: "shape-mobile-device",
    title: "Android",
    eyebrow: "端末",
    subtitle: "Android の通知網 · 背面で受ける",
  })
  .node("galaxy", {
    lane: "devices",
    stack: 2,
    kind: "shape-mobile-device",
    title: "タブレット",
    eyebrow: "端末",
    subtitle: "圏外 → 再送の対象",
  })
  .edge("msg", "kafka", { label: "積む", tone: "info" })
  .edge("kafka", "fcm", { label: "取り出す", tone: "info" })
  .edge("fcm", "iphone", {
    label: "iOS へ配信",
    tone: "success",
    // 縦に走る区間の中点だと、 kafka → fcm の label と同じ高さ (y=438) に並んで 12px しか離れない。
    // 縦区間は y=272-604 と長いので上へ寄せる。 -160 まで動かすと折れ角に乗って自 path と接する。
    labelOffsetY: -120,
  })
  .edge("fcm", "pixel", { label: "Android へ配信", tone: "success" })
  .edge("fcm", "galaxy", { label: "初回失敗", tone: "error" })
  .edge("galaxy", "retryGate", { label: "再送を求める", tone: "warning" })
  .edge("retryGate", "fcm", { label: "再送指示", tone: "warning" })
  .readout.bar("queuedBar", {
    source: "queued",
    min: 0,
    max: 1000,
    color: "#f97316",
    label: "キューの残り",
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
      title: "通知のきっかけ",
      body: "注文の発送が起き、吹き出しから Kafka キューに積む。 キューの残りが 1000 件まで伸び、配信成功と失敗は 0 件、配信成功率の針は最も下にある。 知らせとキューが光る。",
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
      body: "まとめた 1000 件が処理を待ち、配信サービスが取り出し始める。 キューの残りが 800 件へ縮み、配信サービスが光って、キューからの矢印に信号が流れる。",
    },
    (p: PhaseBuilder) =>
      p.activate("msg", "kafka", "fcm").tween("queued", 1000, 800).badge("キュー"),
  )
  .phase(
    "p3",
    {
      duration: 2500,
      title: "配信中",
      body: "配信サービスが iPhone / Android 端末 / タブレットへ一斉に配る。 キューの残りが 50 件へ縮み、配信成功が 920 件まで数え上がり、失敗が 80 件、配信成功率が 92% になる。 3 台とも光り、タブレットへの矢印は失敗の赤になる。",
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
      body: "iPhone と Android 端末は受け取り、タブレットは圏外で届かない。 キューの残りが 20 件、配信成功が 950 件、失敗が 50 件、配信成功率が 95% になる。",
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
      body: "失敗した 50 件を、再送の判定が間隔を倍に広げながら送り直し、圏内に戻ったタブレットにも届く。 キューの残りが 0 件、配信成功が 992 件、失敗が 8 件、配信成功率が 99% になり、再送の判定が光る。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("msg", "kafka", "fcm", "retryGate", "iphone", "pixel", "galaxy")
        .tween("queued", 20, 0)
        .tween("delivered", 950, 992)
        .tween("failed", 50, 8)
        .tween("deliveryRate", 95, 99)
        .badge("再送"),
  )
  .build();
export const subtitle__exemplarNotificationFlow =
  "発信 / 配る仕組み / 受け取る端末の縦列で、知らせが待ち行列を経て届き、届かなかった端末へ送り直すまでの 5 段を追う";

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
  chart: { kind: line-chart, source: "series", min: 0, max: 100, viewW: 260, viewH: 70, color: "#2563eb", fill: true, label: "面グラフ" }
  chartNoFill: { kind: line-chart, source: "series", min: 0, max: 100, viewW: 260, viewH: 50, color: "#f97316", fill: false, label: "折れ線グラフ" }

lanes:
  data: { x: 0, width: 200 }
  area: { x: 240, width: 280 }
  line: { x: 540, width: 280 }

states:
  series: "[22,35,28,42,55,48,60,72,65,80]"

actors:
  - 時系列: { kind: card, lane: data, stack: 0, subtitle: "{series.length} 件 · 計 {series.sum} · 平均 {series.avg}" }
  - 面グラフ: { kind: card, lane: area, stack: 0, subtitle: "青 #2563eb · 高さ 70" }
  - 折れ線グラフ: { kind: card, lane: line, stack: 0, subtitle: "橙 #f97316 · 高さ 50" }

animation:
  - step: "序盤の値" 1.8s
    focus: ["時系列"]
    set:
      series: "[22,35,28,42,55]"
    description: "前半の値だけを持つ。 折れ線が左半分に収まる。"
  - step: "伸びる" 1.8s
    focus: ["時系列", "面グラフ"]
    set:
      series: "[22,35,28,42,55,48,60,72]"
    description: "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。"
  - step: "全体が揃う" 1.8s
    focus: ["時系列", "面グラフ", "折れ線グラフ"]
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
      "label": "面グラフ"
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
      "label": "折れ線グラフ"
    }
  ],
  "lanes": {
    "data": { "x": 0, "width": 200 },
    "area": { "x": 240, "width": 280 },
    "line": { "x": 540, "width": 280 }
  },
  "actors": [
    {
      "name": "時系列",
      "kind": "card",
      "lane": "data",
      "stack": 0,
      "subtitle": "{series.length} 件 · 計 {series.sum} · 平均 {series.avg}"
    },
    {
      "name": "面グラフ",
      "kind": "card",
      "lane": "area",
      "stack": 0,
      "subtitle": "青 #2563eb · 高さ 70"
    },
    {
      "name": "折れ線グラフ",
      "kind": "card",
      "lane": "line",
      "stack": 0,
      "subtitle": "橙 #f97316 · 高さ 50"
    }
  ],
  "flow": [],
  "states": { "series": "[22,35,28,42,55,48,60,72,65,80]" },
  "animation": [
    {
      "step": "序盤の値",
      "duration": 1.8,
      "focus": ["時系列"],
      "set": { "series": "[22,35,28,42,55]" },
      "body": "前半の値だけを持つ。 折れ線が左半分に収まる。"
    },
    {
      "step": "伸びる",
      "duration": 1.8,
      "focus": ["時系列", "面グラフ"],
      "set": { "series": "[22,35,28,42,55,48,60,72]" },
      "body": "後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。"
    },
    {
      "step": "全体が揃う",
      "duration": 1.8,
      "focus": ["時系列", "面グラフ", "折れ線グラフ"],
      "set": { "series": "[22,35,28,42,55,48,60,72,65,80]" },
      "body": "10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。"
    }
  ]
}`;

export const sourceYaml__arrayStackedBar = `title: "2 系列の配列を積み上げ棒で比べる"
type: flow

readouts:
  cmp: { kind: stacked-bar, sourceA: "groupA", sourceB: "groupB", min: 0, max: 80, colorA: "#2563eb", colorB: "#f97316", label: "A / B (横に並べた棒)" }

lanes:
  groupA: { x: 0, width: 300 }
  groupB: { x: 340, width: 300 }

states:
  groupA: "[40,55,30,65,45]"
  groupB: "[25,40,50,35,60]"

actors:
  - A 群: { kind: card, lane: groupA, stack: 0, subtitle: "合計 {groupA.sum} · 平均 {groupA.avg} · 最大 {groupA.max}" }
  - A の 5 要素: { kind: card, lane: groupA, stack: 1, subtitle: "系列 A" }
  - B 群: { kind: card, lane: groupB, stack: 0, subtitle: "合計 {groupB.sum} · 平均 {groupB.avg} · 最大 {groupB.max}" }
  - B の 5 要素: { kind: card, lane: groupB, stack: 1, subtitle: "系列 B" }

flow:
  - A 群 -> B 群: "A と B の差" (warning)

animation:
  - step: "A だけ" 1.8s
    focus: ["A 群", "A の 5 要素"]
    set:
      groupA: "[40,55,30,65,45]"
      groupB: "[0,0,0,0,0]"
    description: "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。"
  - step: "B を並べる" 1.8s
    focus: ["A 群", "A の 5 要素", "B 群"]
    set:
      groupB: "[25,40,50,35,60]"
    description: "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。"
  - step: "高さが入れ替わる" 1.8s
    focus: ["A 群", "A の 5 要素", "B 群", "B の 5 要素"]
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
      "label": "A / B (横に並べた棒)"
    }
  ],
  "lanes": {
    "groupA": { "x": 0, "width": 300 },
    "groupB": { "x": 340, "width": 300 }
  },
  "actors": [
    {
      "name": "A 群",
      "kind": "card",
      "lane": "groupA",
      "stack": 0,
      "subtitle": "合計 {groupA.sum} · 平均 {groupA.avg} · 最大 {groupA.max}"
    },
    { "name": "A の 5 要素", "kind": "card", "lane": "groupA", "stack": 1, "subtitle": "系列 A" },
    {
      "name": "B 群",
      "kind": "card",
      "lane": "groupB",
      "stack": 0,
      "subtitle": "合計 {groupB.sum} · 平均 {groupB.avg} · 最大 {groupB.max}"
    },
    { "name": "B の 5 要素", "kind": "card", "lane": "groupB", "stack": 1, "subtitle": "系列 B" }
  ],
  "flow": [
    { "from": "A 群", "to": "B 群", "label": "A と B の差", "tone": "warning" }
  ],
  "states": { "groupA": "[40,55,30,65,45]", "groupB": "[25,40,50,35,60]" },
  "animation": [
    {
      "step": "A だけ",
      "duration": 1.8,
      "focus": ["A 群", "A の 5 要素"],
      "set": { "groupA": "[40,55,30,65,45]", "groupB": "[0,0,0,0,0]" },
      "body": "1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。"
    },
    {
      "step": "B を並べる",
      "duration": 1.8,
      "focus": ["A 群", "A の 5 要素", "B 群"],
      "set": { "groupB": "[25,40,50,35,60]" },
      "body": "2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。"
    },
    {
      "step": "高さが入れ替わる",
      "duration": 1.8,
      "focus": ["A 群", "A の 5 要素", "B 群", "B の 5 要素"],
      "set": { "groupA": "[30,35,25,40,30]", "groupB": "[45,60,70,55,80]" },
      "body": "2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。"
    }
  ]
}`;

export const sourceYaml__arrayWaterfall = `title: "増減を滝グラフで正負に分けて見せる"
type: flow

readouts:
  wf: { kind: waterfall, source: "changes", min: -30, max: 150, viewW: 280, viewH: 90, colorPos: "#22c55e", colorNeg: "#ef4444", label: "増減 (滝グラフ)" }
  items: { kind: array-list, source: "changes", itemTemplate: "段 {i}: {item}", label: "各段" }

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
  - 収支: { kind: card, lane: pos, stack: 3, subtitle: "最終 = 合計 = {changes.sum}" }

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
    focus: ["+100", "+50", "+40", "-30", "-20", "収支"]
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
      "label": "増減 (滝グラフ)"
    },
    {
      "id": "items",
      "kind": "array-list",
      "source": "changes",
      "itemTemplate": "段 {i}: {item}",
      "label": "各段"
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
      "name": "収支",
      "kind": "card",
      "lane": "pos",
      "stack": 3,
      "subtitle": "最終 = 合計 = {changes.sum}"
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
      "focus": ["+100", "+50", "+40", "-30", "-20", "収支"],
      "set": { "changes": "[60,-20,40,-15,30]" },
      "body": "増減を通した合計が出る。 一覧と滝が同じ配列を見ている。"
    }
  ]
}`;

export const sourceYaml__matrixHeatmap = `title: "4×4 の混同行列を熱の色で見せる"
type: flow

readouts:
  m: { kind: matrix, source: "cm", min: 0, max: 10, cellSize: 30, colors: ["#f0f4f8", "#0369a1"], showValue: true, label: "予測の結果 (4×4)" }

lanes:
  c0: { x: 0, width: 150 }
  c1: { x: 170, width: 150 }
  c2: { x: 340, width: 150 }
  c3: { x: 510, width: 150 }

states:
  cm: "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]"

actors:
  - 区分 0 ✓: { kind: card, lane: c0, stack: 0, subtitle: "上段の正解" }
  - Class 0 ✕2: { kind: card, lane: c0, stack: 1, subtitle: "上段の取り違え", title: "区分 0 ✕" }
  - 区分 1 ✓: { kind: card, lane: c1, stack: 0, subtitle: "中上段の正解" }
  - Class 1 ✕2: { kind: card, lane: c1, stack: 1, subtitle: "中上段の取り違え", title: "区分 1 ✕" }
  - 区分 2 ✓: { kind: card, lane: c2, stack: 0, subtitle: "中下段の正解" }
  - Class 2 ✕2: { kind: card, lane: c2, stack: 1, subtitle: "中下段の取り違え", title: "区分 2 ✕" }
  - 区分 3 ✓: { kind: card, lane: c3, stack: 0, subtitle: "下段の正解" }
  - Class 3 ✕2: { kind: card, lane: c3, stack: 1, subtitle: "下段の取り違え", title: "区分 3 ✕" }

animation:
  - step: "対角だけ" 1.8s
    focus: ["区分 0 ✓", "区分 1 ✓"]
    set:
      cm: "[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]"
    description: "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。"
  - step: "誤りが混ざる" 1.8s
    focus: ["区分 0 ✓", "Class 0 ✕2", "区分 1 ✓", "Class 1 ✕2"]
    set:
      cm: "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]"
    description: "取り違えた数が対角の外に現れる。 色が対角から散らばる。"
  - step: "偏りが出る" 1.8s
    focus: ["区分 0 ✓", "Class 0 ✕2", "区分 1 ✓", "Class 1 ✕2", "区分 2 ✓", "Class 2 ✕2", "区分 3 ✓", "Class 3 ✕2"]
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
      "label": "予測の結果 (4×4)"
    }
  ],
  "lanes": {
    "c0": { "x": 0, "width": 150 },
    "c1": { "x": 170, "width": 150 },
    "c2": { "x": 340, "width": 150 },
    "c3": { "x": 510, "width": 150 }
  },
  "actors": [
    { "name": "区分 0 ✓", "kind": "card", "lane": "c0", "stack": 0, "subtitle": "上段の正解" },
    {
      "name": "Class 0 ✕2",
      "kind": "card",
      "lane": "c0",
      "stack": 1,
      "subtitle": "上段の取り違え",
      "title": "区分 0 ✕"
    },
    { "name": "区分 1 ✓", "kind": "card", "lane": "c1", "stack": 0, "subtitle": "中上段の正解" },
    {
      "name": "Class 1 ✕2",
      "kind": "card",
      "lane": "c1",
      "stack": 1,
      "subtitle": "中上段の取り違え",
      "title": "区分 1 ✕"
    },
    { "name": "区分 2 ✓", "kind": "card", "lane": "c2", "stack": 0, "subtitle": "中下段の正解" },
    {
      "name": "Class 2 ✕2",
      "kind": "card",
      "lane": "c2",
      "stack": 1,
      "subtitle": "中下段の取り違え",
      "title": "区分 2 ✕"
    },
    { "name": "区分 3 ✓", "kind": "card", "lane": "c3", "stack": 0, "subtitle": "下段の正解" },
    {
      "name": "Class 3 ✕2",
      "kind": "card",
      "lane": "c3",
      "stack": 1,
      "subtitle": "下段の取り違え",
      "title": "区分 3 ✕"
    }
  ],
  "flow": [],
  "states": { "cm": "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]" },
  "animation": [
    {
      "step": "対角だけ",
      "duration": 1.8,
      "focus": ["区分 0 ✓", "区分 1 ✓"],
      "set": { "cm": "[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]" },
      "body": "正解した数だけを置く。 対角線に色が集まり、取り違えは 0。"
    },
    {
      "step": "誤りが混ざる",
      "duration": 1.8,
      "focus": ["区分 0 ✓", "Class 0 ✕2", "区分 1 ✓", "Class 1 ✕2"],
      "set": { "cm": "[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]" },
      "body": "取り違えた数が対角の外に現れる。 色が対角から散らばる。"
    },
    {
      "step": "偏りが出る",
      "duration": 1.8,
      "focus": [
        "区分 0 ✓",
        "Class 0 ✕2",
        "区分 1 ✓",
        "Class 1 ✕2",
        "区分 2 ✓",
        "Class 2 ✕2",
        "区分 3 ✓",
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
  tasks: { kind: progress-group, source: "progress", max: 100, labelSource: "names", color: "#2563eb", label: "作業ごとの進み具合" }

lanes:
  advanced: { x: 0, width: 240 }
  behind: { x: 300, width: 240 }

states:
  progress: "[40,75,20,90]"
  names: '["設計","実装","テスト","文書"]'

actors:
  - 実装: { kind: card, lane: advanced, stack: 0, subtitle: "{progress[1]}%" }
  - 文書: { kind: card, lane: advanced, stack: 1, subtitle: "{progress[3]}%" }
  - 設計: { kind: card, lane: behind, stack: 0, subtitle: "{progress[0]}%" }
  - テスト: { kind: card, lane: behind, stack: 1, subtitle: "{progress[2]}%" }

animation:
  - step: "着手前" 1.8s
    focus: ["実装"]
    set:
      progress: "[10,20,5,15]"
    description: "4 件とも進捗が低い。 帯がどれも短い。"
  - step: "ばらつく" 1.8s
    focus: ["実装", "文書"]
    set:
      progress: "[40,75,20,90]"
    description: "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。"
  - step: "追いつく" 1.8s
    focus: ["実装", "文書", "設計", "テスト"]
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
      "label": "作業ごとの進み具合"
    }
  ],
  "lanes": {
    "advanced": { "x": 0, "width": 240 },
    "behind": { "x": 300, "width": 240 }
  },
  "actors": [
    {
      "name": "実装",
      "kind": "card",
      "lane": "advanced",
      "stack": 0,
      "subtitle": "{progress[1]}%"
    },
    {
      "name": "文書",
      "kind": "card",
      "lane": "advanced",
      "stack": 1,
      "subtitle": "{progress[3]}%"
    },
    {
      "name": "設計",
      "kind": "card",
      "lane": "behind",
      "stack": 0,
      "subtitle": "{progress[0]}%"
    },
    {
      "name": "テスト",
      "kind": "card",
      "lane": "behind",
      "stack": 1,
      "subtitle": "{progress[2]}%"
    }
  ],
  "flow": [],
  "states": { "progress": "[40,75,20,90]", "names": "[\\"設計\\",\\"実装\\",\\"テスト\\",\\"文書\\"]" },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["実装"],
      "set": { "progress": "[10,20,5,15]" },
      "body": "4 件とも進捗が低い。 帯がどれも短い。"
    },
    {
      "step": "ばらつく",
      "duration": 1.8,
      "focus": ["実装", "文書"],
      "set": { "progress": "[40,75,20,90]" },
      "body": "先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。"
    },
    {
      "step": "追いつく",
      "duration": 1.8,
      "focus": ["実装", "文書", "設計", "テスト"],
      "set": { "progress": "[85,95,80,100]" },
      "body": "遅れていた項目が追いつく。 4 本の帯が揃う。"
    }
  ]
}`;

export const sourceYaml__skillRadar = `title: "5 技能を強 / 中 / 弱に分けて見せる"
type: flow

readouts:
  radar: { kind: radar, source: "skills", max: 10, viewW: 200, viewH: 200, color: "#2563eb", labelSource: "skillNames", label: "5 技能の多角形" }

lanes:
  strong: { x: 0, width: 220 }
  middle: { x: 260, width: 220 }
  weak: { x: 520, width: 220 }

states:
  skills: "[8,5,7,3,9]"
  skillNames: '["設計","実装","テスト","文書","不具合の調査"]'

actors:
  - 設計: { kind: card, lane: strong, stack: 0, subtitle: "{skills[0]}/10" }
  - テスト: { kind: card, lane: strong, stack: 1, subtitle: "{skills[2]}/10" }
  - 不具合の調査: { kind: card, lane: strong, stack: 2, subtitle: "{skills[4]}/10" }
  - 実装: { kind: card, lane: middle, stack: 0, subtitle: "{skills[1]}/10" }
  - 文書: { kind: card, lane: weak, stack: 0, subtitle: "{skills[3]}/10" }

animation:
  - step: "偏った形" 1.8s
    focus: ["設計"]
    set:
      skills: "[9,2,3,2,3]"
    description: "1 つの技能だけが高い。 図形が一方向に伸びる。"
  - step: "広がる" 1.8s
    focus: ["設計", "テスト", "不具合の調査"]
    set:
      skills: "[8,5,7,3,9]"
    description: "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。"
  - step: "形が整う" 1.8s
    focus: ["設計", "テスト", "不具合の調査", "実装", "文書"]
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
      "label": "5 技能の多角形"
    }
  ],
  "lanes": {
    "strong": { "x": 0, "width": 220 },
    "middle": { "x": 260, "width": 220 },
    "weak": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "設計",
      "kind": "card",
      "lane": "strong",
      "stack": 0,
      "subtitle": "{skills[0]}/10"
    },
    {
      "name": "テスト",
      "kind": "card",
      "lane": "strong",
      "stack": 1,
      "subtitle": "{skills[2]}/10"
    },
    {
      "name": "不具合の調査",
      "kind": "card",
      "lane": "strong",
      "stack": 2,
      "subtitle": "{skills[4]}/10"
    },
    {
      "name": "実装",
      "kind": "card",
      "lane": "middle",
      "stack": 0,
      "subtitle": "{skills[1]}/10"
    },
    { "name": "文書", "kind": "card", "lane": "weak", "stack": 0, "subtitle": "{skills[3]}/10" }
  ],
  "flow": [],
  "states": { "skills": "[8,5,7,3,9]", "skillNames": "[\\"設計\\",\\"実装\\",\\"テスト\\",\\"文書\\",\\"不具合の調査\\"]" },
  "animation": [
    {
      "step": "偏った形",
      "duration": 1.8,
      "focus": ["設計"],
      "set": { "skills": "[9,2,3,2,3]" },
      "body": "1 つの技能だけが高い。 図形が一方向に伸びる。"
    },
    {
      "step": "広がる",
      "duration": 1.8,
      "focus": ["設計", "テスト", "不具合の調査"],
      "set": { "skills": "[8,5,7,3,9]" },
      "body": "他の技能も伸びて図形が広がる。 尖りが目立たなくなる。"
    },
    {
      "step": "形が整う",
      "duration": 1.8,
      "focus": ["設計", "テスト", "不具合の調査", "実装", "文書"],
      "set": { "skills": "[7,7,8,6,8]" },
      "body": "5 技能が近い値になり、図形が正多角形に近づく。"
    }
  ]
}`;

export const sourceYaml__perfBubbleChart = `title: "5 種の処理の負荷を大きさで比べる"
type: flow

readouts:
  bubbles: { kind: bubble-chart, source: "perf", xMin: 0, xMax: 100, yMin: 0, yMax: 100, rMin: 0, rMax: 10, viewW: 280, viewH: 180, color: "#2563eb", label: "処理ごとの負荷 (3 軸の円)" }

lanes:
  high: { x: 0, width: 300 }
  low: { x: 340, width: 300 }

states:
  perf: "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]"

actors:
  - 処理 B: { kind: card, lane: high, stack: 0, subtitle: "中央寄りの処理" }
  - 処理 C: { kind: card, lane: high, stack: 1, subtitle: "右上に位置する処理" }
  - 処理 E: { kind: card, lane: high, stack: 2, subtitle: "左上に位置する処理" }
  - 処理 A: { kind: card, lane: low, stack: 0, subtitle: "左下に位置する処理" }
  - 処理 D: { kind: card, lane: low, stack: 1, subtitle: "右寄りの処理" }

animation:
  - step: "軽い処理" 1.8s
    focus: ["処理 B"]
    set:
      perf: "[[50,20,3],[70,40,4],[90,60,3]]"
    description: "負荷の小さい処理だけを置く。 円が小さくまとまる。"
  - step: "重い処理が入る" 1.8s
    focus: ["処理 B", "処理 C", "処理 E"]
    set:
      perf: "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]"
    description: "負荷の大きい処理が加わる。 円の大小差が開く。"
  - step: "偏りが出る" 1.8s
    focus: ["処理 B", "処理 C", "処理 E", "処理 A", "処理 D"]
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
      "label": "処理ごとの負荷 (3 軸の円)"
    }
  ],
  "lanes": {
    "high": { "x": 0, "width": 300 },
    "low": { "x": 340, "width": 300 }
  },
  "actors": [
    { "name": "処理 B", "kind": "card", "lane": "high", "stack": 0, "subtitle": "中央寄りの処理" },
    {
      "name": "処理 C",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "右上に位置する処理"
    },
    {
      "name": "処理 E",
      "kind": "card",
      "lane": "high",
      "stack": 2,
      "subtitle": "左上に位置する処理"
    },
    { "name": "処理 A", "kind": "card", "lane": "low", "stack": 0, "subtitle": "左下に位置する処理" },
    { "name": "処理 D", "kind": "card", "lane": "low", "stack": 1, "subtitle": "右寄りの処理" }
  ],
  "flow": [],
  "states": { "perf": "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]" },
  "animation": [
    {
      "step": "軽い処理",
      "duration": 1.8,
      "focus": ["処理 B"],
      "set": { "perf": "[[50,20,3],[70,40,4],[90,60,3]]" },
      "body": "負荷の小さい処理だけを置く。 円が小さくまとまる。"
    },
    {
      "step": "重い処理が入る",
      "duration": 1.8,
      "focus": ["処理 B", "処理 C", "処理 E"],
      "set": { "perf": "[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]" },
      "body": "負荷の大きい処理が加わる。 円の大小差が開く。"
    },
    {
      "step": "偏りが出る",
      "duration": 1.8,
      "focus": ["処理 B", "処理 C", "処理 E", "処理 A", "処理 D"],
      "set": { "perf": "[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]" },
      "body": "右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。"
    }
  ]
}`;

export const sourceYaml__portfolioDonut = `title: "資産 4 種を伝統 / 代替に分けて見せる"
type: flow

readouts:
  d: { kind: donut, source: "assets", viewW: 160, viewH: 160, innerRatio: 0.55, label: "配分の円" }
  legend: { kind: array-list, source: "assetNames", itemTemplate: "● {item}", label: "凡例" }

lanes:
  traditional: { x: 0, width: 300 }
  alternative: { x: 340, width: 300 }

states:
  assets: "[45,30,15,10]"
  assetNames: '["株式","債券","現金","暗号資産"]'

actors:
  - 株式: { kind: card, lane: traditional, stack: 0, subtitle: "{assets[0]}%" }
  - 債券: { kind: card, lane: traditional, stack: 1, subtitle: "{assets[1]}%" }
  - 現金: { kind: card, lane: alternative, stack: 0, subtitle: "{assets[2]}%" }
  - 暗号資産: { kind: card, lane: alternative, stack: 1, subtitle: "{assets[3]}%" }
  - 資産全体: { kind: card, lane: traditional, stack: 2, subtitle: "合計 {assets.sum}% · 最大 {assets.max}%" }

animation:
  - step: "株式に寄る" 1.8s
    focus: ["株式"]
    set:
      assets: "[60,20,15,5]"
      assetNames: '["株式","債券","現金","暗号資産"]'
    description: "株式の比重が大きい配分。 円の 1 区画が広い。"
  - step: "債券を増やす" 1.8s
    focus: ["株式", "債券"]
    set:
      assets: "[45,30,15,10]"
      assetNames: '["株式","債券","暗号資産","現金"]'
    description: "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。"
  - step: "分散する" 1.8s
    focus: ["株式", "債券", "現金", "暗号資産", "資産全体"]
    set:
      assets: "[30,28,22,20]"
      assetNames: '["株式","債券","現金","暗号資産"]'
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
      "label": "配分の円"
    },
    {
      "id": "legend",
      "kind": "array-list",
      "source": "assetNames",
      "itemTemplate": "● {item}",
      "label": "凡例"
    }
  ],
  "lanes": {
    "traditional": { "x": 0, "width": 300 },
    "alternative": { "x": 340, "width": 300 }
  },
  "actors": [
    {
      "name": "株式",
      "kind": "card",
      "lane": "traditional",
      "stack": 0,
      "subtitle": "{assets[0]}%"
    },
    {
      "name": "債券",
      "kind": "card",
      "lane": "traditional",
      "stack": 1,
      "subtitle": "{assets[1]}%"
    },
    {
      "name": "現金",
      "kind": "card",
      "lane": "alternative",
      "stack": 0,
      "subtitle": "{assets[2]}%"
    },
    {
      "name": "暗号資産",
      "kind": "card",
      "lane": "alternative",
      "stack": 1,
      "subtitle": "{assets[3]}%"
    },
    {
      "name": "資産全体",
      "kind": "card",
      "lane": "traditional",
      "stack": 2,
      "subtitle": "合計 {assets.sum}% · 最大 {assets.max}%"
    }
  ],
  "flow": [],
  "states": { "assets": "[45,30,15,10]", "assetNames": "[\\"株式\\",\\"債券\\",\\"現金\\",\\"暗号資産\\"]" },
  "animation": [
    {
      "step": "株式に寄る",
      "duration": 1.8,
      "focus": ["株式"],
      "set": { "assets": "[60,20,15,5]", "assetNames": "[\\"株式\\",\\"債券\\",\\"現金\\",\\"暗号資産\\"]" },
      "body": "株式の比重が大きい配分。 円の 1 区画が広い。"
    },
    {
      "step": "債券を増やす",
      "duration": 1.8,
      "focus": ["株式", "債券"],
      "set": { "assets": "[45,30,15,10]", "assetNames": "[\\"株式\\",\\"債券\\",\\"暗号資産\\",\\"現金\\"]" },
      "body": "債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。"
    },
    {
      "step": "分散する",
      "duration": 1.8,
      "focus": ["株式", "債券", "現金", "暗号資産", "資産全体"],
      "set": { "assets": "[30,28,22,20]", "assetNames": "[\\"株式\\",\\"債券\\",\\"現金\\",\\"暗号資産\\"]" },
      "body": "4 種に近い比率で分散する。 区画の差が小さくなる。"
    }
  ]
}`;

export const sourceYaml__abTestResult = `title: "A/B テストの振り分けと結果を見せる"
type: flow

readouts:
  conv: { kind: stacked-bar, sourceA: "convA", sourceB: "convB", min: 30, max: 70, colorA: "#a08870", colorB: "#22c55e", label: "日ごとの成約率 (A と B)" }
  splitDonut: { kind: donut, source: "splitData", viewW: 120, viewH: 120, innerRatio: 0.5, label: "振り分けの割合" }
  winner: { kind: donut, source: "results", viewW: 120, viewH: 120, colors: ["#22c55e", "#a08870"], innerRatio: 0.6, label: "勝った割合 (緑が B)" }

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
  - A 案: { kind: card, lane: varA, stack: 0, subtitle: "平均 {convA.avg}%", posW: 250 }
  - Split2: { kind: card, lane: split, stack: 0, subtitle: "割合 {splitData[0]} / {splitData[1]}", posW: 200, title: "振り分け" }
  - B 案: { kind: card, lane: varB, stack: 0, subtitle: "平均 {convB.avg}%", posW: 250 }

flow:
  - Split2 -> A 案: "50%" (info) { sub: "対照群", side: "left" }
  - Split2 -> B 案: "50%" (success) { sub: "試験群" }

animation:
  - step: "振り分け" 1.8s
    focus: ["A 案", "Split2"]
    set:
      splitData: "[50,50]"
      results: "[50,50]"
      convA: "[48,50,49,51,50]"
      convB: "[49,50,51,50,52]"
    description: "利用者を半々に分ける。 振り分けの円が 2 等分になる。"
  - step: "差が出る" 1.8s
    focus: ["A 案", "Split2", "B 案"]
    set:
      splitData: "[60,40]"
      results: "[55,45]"
      convA: "[48,49,50,48,49]"
      convB: "[52,55,57,56,58]"
    description: "試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。"
  - step: "差が確定する" 1.8s
    focus: ["Split2", "B 案"]
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
      "label": "日ごとの成約率 (A と B)"
    },
    {
      "id": "splitDonut",
      "kind": "donut",
      "source": "splitData",
      "viewW": 120,
      "viewH": 120,
      "innerRatio": 0.5,
      "label": "振り分けの割合"
    },
    {
      "id": "winner",
      "kind": "donut",
      "source": "results",
      "viewW": 120,
      "viewH": 120,
      "colors": ["#22c55e", "#a08870"],
      "innerRatio": 0.6,
      "label": "勝った割合 (緑が B)"
    }
  ],
  "lanes": {
    "varA": { "x": 0, "width": 300 },
    "split": { "x": 360, "width": 250 },
    "varB": { "x": 670, "width": 300 }
  },
  "actors": [
    {
      "name": "A 案",
      "kind": "card",
      "lane": "varA",
      "stack": 0,
      "subtitle": "平均 {convA.avg}%",
      "posW": 250
    },
    {
      "name": "Split2",
      "kind": "card",
      "lane": "split",
      "stack": 0,
      "subtitle": "割合 {splitData[0]} / {splitData[1]}",
      "posW": 200,
      "title": "振り分け"
    },
    {
      "name": "B 案",
      "kind": "card",
      "lane": "varB",
      "stack": 0,
      "subtitle": "平均 {convB.avg}%",
      "posW": 250
    }
  ],
  "flow": [
    {
      "from": "Split2",
      "to": "A 案",
      "label": "50%",
      "tone": "info",
      "sub": "対照群",
      "side": "left"
    },
    {
      "from": "Split2",
      "to": "B 案",
      "label": "50%",
      "tone": "success",
      "sub": "試験群"
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
      "focus": ["A 案", "Split2"],
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
      "focus": ["A 案", "Split2", "B 案"],
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
      "focus": ["Split2", "B 案"],
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
  h: { kind: calendar-heatmap, source: "commits", max: 10, cellSize: 10, cellGap: 2, label: "1 年 (53 週 × 7 日)" }

lanes:
  q1: { x: 0, width: 160 }
  q2: { x: 180, width: 160 }
  q3: { x: 360, width: 160 }
  q4: { x: 540, width: 160 }

states:
  commits: "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6,2,10,7,3,8,2,2,10,7,3,10,4,0,10,7,3,10,8,0,7,7,3,10,8,4,0,3,3,10,8,4,0,5,0,10,8,4,0,9,1,8,8,4,0,9,5,0,4,4,0,9,5,1,6,0,0,9,5,1,10,2,0,9,5,1,10,6,0]"

actors:
  - 1〜3 月: { kind: card, lane: q1, stack: 0, subtitle: "静かな期間" }
  - 4〜6 月: { kind: card, lane: q2, stack: 0, subtitle: "活発な期間" }
  - 7〜9 月: { kind: card, lane: q3, stack: 0, subtitle: "落ち着く期間" }
  - 10〜12 月: { kind: card, lane: q4, stack: 0, subtitle: "全体の推移" }
  - 1 年の合計: { kind: card, lane: q4, stack: 1, subtitle: "合計 {commits.sum} · 最大 {commits.max} · 平均 {commits.avg}" }

animation:
  - step: "静かな期間" 1.8s
    focus: ["1〜3 月"]
    set:
      commits: "[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]"
    description: "書き込みが少ない期間。 濃い升目がまばら。"
  - step: "活発になる" 1.8s
    focus: ["1〜3 月", "4〜6 月"]
    set:
      commits: "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]"
    description: "書き込みが増えて濃い升目が続く。 帯のように連なる。"
  - step: "落ち着く" 1.8s
    focus: ["1〜3 月", "4〜6 月", "7〜9 月", "10〜12 月", "1 年の合計"]
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
      "label": "1 年 (53 週 × 7 日)"
    }
  ],
  "lanes": {
    "q1": { "x": 0, "width": 160 },
    "q2": { "x": 180, "width": 160 },
    "q3": { "x": 360, "width": 160 },
    "q4": { "x": 540, "width": 160 }
  },
  "actors": [
    { "name": "1〜3 月", "kind": "card", "lane": "q1", "stack": 0, "subtitle": "静かな期間" },
    { "name": "4〜6 月", "kind": "card", "lane": "q2", "stack": 0, "subtitle": "活発な期間" },
    { "name": "7〜9 月", "kind": "card", "lane": "q3", "stack": 0, "subtitle": "落ち着く期間" },
    { "name": "10〜12 月", "kind": "card", "lane": "q4", "stack": 0, "subtitle": "全体の推移" },
    {
      "name": "1 年の合計",
      "kind": "card",
      "lane": "q4",
      "stack": 1,
      "subtitle": "合計 {commits.sum} · 最大 {commits.max} · 平均 {commits.avg}"
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
      "focus": ["1〜3 月"],
      "set": { "commits": "[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]" },
      "body": "書き込みが少ない期間。 濃い升目がまばら。"
    },
    {
      "step": "活発になる",
      "duration": 1.8,
      "focus": ["1〜3 月", "4〜6 月"],
      "set": { "commits": "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]" },
      "body": "書き込みが増えて濃い升目が続く。 帯のように連なる。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["1〜3 月", "4〜6 月", "7〜9 月", "10〜12 月", "1 年の合計"],
      "set": { "commits": "[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]" },
      "body": "終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。"
    }
  ]
}`;

export const sourceYaml__priceCandlestick = `title: "8 日分の値動きを陽線 / 陰線で見せる"
type: flow

readouts:
  chart: { kind: candlestick, source: "ohlc", min: 95, max: 122, viewW: 300, viewH: 110, colorUp: "#22c55e", colorDown: "#ef4444", label: "ろうそく足 (4 本値)" }

lanes:
  up: { x: 0, width: 320 }
  down: { x: 360, width: 320 }

states:
  ohlc: "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109],[109,113,106,112],[112,118,111,116],[116,120,113,118]]"

actors:
  - 1 日目 ▲: { kind: card, lane: up, stack: 0, subtitle: "始 100 → 終 105 (+5)" }
  - 3 日目 ▲: { kind: card, lane: up, stack: 1, subtitle: "始 102 → 終 104 (+2)" }
  - 4 日目 ▲: { kind: card, lane: up, stack: 2, subtitle: "始 104 → 終 111 (+7)" }
  - 6 日目 ▲: { kind: card, lane: up, stack: 3, subtitle: "始 109 → 終 112 (+3)" }
  - 7 日目 ▲: { kind: card, lane: up, stack: 4, subtitle: "始 112 → 終 116 (+4)" }
  - 8 日目 ▲: { kind: card, lane: up, stack: 5, subtitle: "始 116 → 終 118 (+2)" }
  - 2 日目 ▼: { kind: card, lane: down, stack: 0, subtitle: "始 105 → 終 102 (-3)" }
  - 5 日目 ▼: { kind: card, lane: down, stack: 1, subtitle: "始 111 → 終 109 (-2)" }

animation:
  - step: "横ばい" 1.8s
    focus: ["1 日目 ▲", "2 日目 ▼"]
    set:
      ohlc: "[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]"
    description: "始値と終値が近い日が続く。 実体の短い足が並ぶ。"
  - step: "上がる" 1.8s
    focus: ["1 日目 ▲", "2 日目 ▼", "3 日目 ▲", "4 日目 ▲"]
    set:
      ohlc: "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]"
    description: "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。"
  - step: "振れる" 1.8s
    focus: ["1 日目 ▲", "2 日目 ▼", "3 日目 ▲", "4 日目 ▲", "5 日目 ▼", "6 日目 ▲", "7 日目 ▲", "8 日目 ▲"]
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
      "label": "ろうそく足 (4 本値)"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 320 },
    "down": { "x": 360, "width": 320 }
  },
  "actors": [
    {
      "name": "1 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 0,
      "subtitle": "始 100 → 終 105 (+5)"
    },
    {
      "name": "3 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 1,
      "subtitle": "始 102 → 終 104 (+2)"
    },
    {
      "name": "4 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 2,
      "subtitle": "始 104 → 終 111 (+7)"
    },
    {
      "name": "6 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 3,
      "subtitle": "始 109 → 終 112 (+3)"
    },
    {
      "name": "7 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 4,
      "subtitle": "始 112 → 終 116 (+4)"
    },
    {
      "name": "8 日目 ▲",
      "kind": "card",
      "lane": "up",
      "stack": 5,
      "subtitle": "始 116 → 終 118 (+2)"
    },
    {
      "name": "2 日目 ▼",
      "kind": "card",
      "lane": "down",
      "stack": 0,
      "subtitle": "始 105 → 終 102 (-3)"
    },
    {
      "name": "5 日目 ▼",
      "kind": "card",
      "lane": "down",
      "stack": 1,
      "subtitle": "始 111 → 終 109 (-2)"
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
      "focus": ["1 日目 ▲", "2 日目 ▼"],
      "set": { "ohlc": "[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]" },
      "body": "始値と終値が近い日が続く。 実体の短い足が並ぶ。"
    },
    {
      "step": "上がる",
      "duration": 1.8,
      "focus": ["1 日目 ▲", "2 日目 ▼", "3 日目 ▲", "4 日目 ▲"],
      "set": {
        "ohlc": "[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]"
      },
      "body": "陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。"
    },
    {
      "step": "振れる",
      "duration": 1.8,
      "focus": ["1 日目 ▲", "2 日目 ▼", "3 日目 ▲", "4 日目 ▲", "5 日目 ▼", "6 日目 ▲", "7 日目 ▲", "8 日目 ▲"],
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
  v: { kind: venn, source: "sets", viewW: 220, viewH: 140, colorA: "#2563eb", colorB: "#f97316", labelA: "利用者", labelB: "支払う人", label: "重なり (2 つの集まり)" }

lanes:
  usersOnly: { x: 0, width: 220 }
  both: { x: 260, width: 200 }
  payersOnly: { x: 500, width: 200 }

states:
  sets: "[100,40,25]"

actors:
  - 利用者の全体: { kind: card, lane: usersOnly, stack: 0, subtitle: "A 全体 {sets[0]} · 共通 {sets[2]}" }
  - 両方 (A ∩ B): { kind: card, lane: both, stack: 0, subtitle: "共通 = {sets[2]}" }
  - 支払う人の全体: { kind: card, lane: payersOnly, stack: 0, subtitle: "B 全体 = {sets[1]}" }
  - 全体: { kind: card, lane: both, stack: 1, subtitle: "A={sets[0]} · B={sets[1]}" }

animation:
  - step: "重なりなし" 1.8s
    focus: ["利用者の全体"]
    set:
      sets: "[100,40,0]"
    description: "2 つの集まりが離れている。 共通する人が居ない。"
  - step: "重なる" 1.8s
    focus: ["利用者の全体", "両方 (A ∩ B)"]
    set:
      sets: "[100,40,25]"
    description: "共通する人が現れて 2 つの円が重なる。"
  - step: "大きく重なる" 1.8s
    focus: ["利用者の全体", "両方 (A ∩ B)", "支払う人の全体", "全体"]
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
      "labelA": "利用者",
      "labelB": "支払う人",
      "label": "重なり (2 つの集まり)"
    }
  ],
  "lanes": {
    "usersOnly": { "x": 0, "width": 220 },
    "both": { "x": 260, "width": 200 },
    "payersOnly": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "利用者の全体",
      "kind": "card",
      "lane": "usersOnly",
      "stack": 0,
      "subtitle": "A 全体 {sets[0]} · 共通 {sets[2]}"
    },
    {
      "name": "両方 (A ∩ B)",
      "kind": "card",
      "lane": "both",
      "stack": 0,
      "subtitle": "共通 = {sets[2]}"
    },
    {
      "name": "支払う人の全体",
      "kind": "card",
      "lane": "payersOnly",
      "stack": 0,
      "subtitle": "B 全体 = {sets[1]}"
    },
    {
      "name": "全体",
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
      "focus": ["利用者の全体"],
      "set": { "sets": "[100,40,0]" },
      "body": "2 つの集まりが離れている。 共通する人が居ない。"
    },
    {
      "step": "重なる",
      "duration": 1.8,
      "focus": ["利用者の全体", "両方 (A ∩ B)"],
      "set": { "sets": "[100,40,25]" },
      "body": "共通する人が現れて 2 つの円が重なる。"
    },
    {
      "step": "大きく重なる",
      "duration": 1.8,
      "focus": ["利用者の全体", "両方 (A ∩ B)", "支払う人の全体", "全体"],
      "set": { "sets": "[100,60,45]" },
      "body": "共通部分が広がる。 重なりの面積で関係の強さが読める。"
    }
  ]
}`;

export const sourceYaml__scoreSlope = `title: "5 人の点数変化を上昇 / 下降で分ける"
type: flow

readouts:
  s: { kind: slope, source: "scores", min: 40, max: 100, viewW: 260, viewH: 160, colorUp: "#22c55e", colorDown: "#ef4444", label: "点数の変化 (傾き)" }

lanes:
  up: { x: 0, width: 300 }
  down: { x: 340, width: 300 }

states:
  scores: '[[65,82,"佐藤"],[70,68,"鈴木"],[55,78,"高橋"],[80,88,"田中"],[60,55,"伊藤"]]'

actors:
  - 佐藤 ↑: { kind: card, lane: up, stack: 0, subtitle: "1 人目" }
  - 高橋 ↑: { kind: card, lane: up, stack: 1, subtitle: "3 人目" }
  - 田中 ↑: { kind: card, lane: up, stack: 2, subtitle: "4 人目" }
  - 鈴木 ↓: { kind: card, lane: down, stack: 0, subtitle: "2 人目" }
  - 伊藤 ↓: { kind: card, lane: down, stack: 1, subtitle: "5 人目" }

animation:
  - step: "横並び" 1.8s
    focus: ["佐藤 ↑"]
    set:
      scores: '[[65,65,"佐藤"],[70,70,"鈴木"],[55,55,"高橋"]]'
    description: "前後で点数が変わらない状態。 線が水平に並ぶ。"
  - step: "差が出る" 1.8s
    focus: ["佐藤 ↑", "高橋 ↑", "田中 ↑"]
    set:
      scores: '[[65,82,"佐藤"],[70,68,"鈴木"],[55,78,"高橋"],[80,88,"田中"],[60,55,"伊藤"]]'
    description: "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。"
  - step: "順位が入れ替わる" 1.8s
    focus: ["佐藤 ↑", "高橋 ↑", "田中 ↑", "鈴木 ↓", "伊藤 ↓"]
    set:
      scores: '[[65,72,"佐藤"],[70,60,"鈴木"],[55,90,"高橋"],[80,75,"田中"],[60,85,"伊藤"]]'
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
      "label": "点数の変化 (傾き)"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 300 },
    "down": { "x": 340, "width": 300 }
  },
  "actors": [
    { "name": "佐藤 ↑", "kind": "card", "lane": "up", "stack": 0, "subtitle": "1 人目" },
    { "name": "高橋 ↑", "kind": "card", "lane": "up", "stack": 1, "subtitle": "3 人目" },
    { "name": "田中 ↑", "kind": "card", "lane": "up", "stack": 2, "subtitle": "4 人目" },
    { "name": "鈴木 ↓", "kind": "card", "lane": "down", "stack": 0, "subtitle": "2 人目" },
    { "name": "伊藤 ↓", "kind": "card", "lane": "down", "stack": 1, "subtitle": "5 人目" }
  ],
  "flow": [],
  "states": {
    "scores": "[[65,82,\\"佐藤\\"],[70,68,\\"鈴木\\"],[55,78,\\"高橋\\"],[80,88,\\"田中\\"],[60,55,\\"伊藤\\"]]"
  },
  "animation": [
    {
      "step": "横並び",
      "duration": 1.8,
      "focus": ["佐藤 ↑"],
      "set": { "scores": "[[65,65,\\"佐藤\\"],[70,70,\\"鈴木\\"],[55,55,\\"高橋\\"]]" },
      "body": "前後で点数が変わらない状態。 線が水平に並ぶ。"
    },
    {
      "step": "差が出る",
      "duration": 1.8,
      "focus": ["佐藤 ↑", "高橋 ↑", "田中 ↑"],
      "set": {
        "scores": "[[65,82,\\"佐藤\\"],[70,68,\\"鈴木\\"],[55,78,\\"高橋\\"],[80,88,\\"田中\\"],[60,55,\\"伊藤\\"]]"
      },
      "body": "伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。"
    },
    {
      "step": "順位が入れ替わる",
      "duration": 1.8,
      "focus": ["佐藤 ↑", "高橋 ↑", "田中 ↑", "鈴木 ↓", "伊藤 ↓"],
      "set": {
        "scores": "[[65,72,\\"佐藤\\"],[70,60,\\"鈴木\\"],[55,90,\\"高橋\\"],[80,75,\\"田中\\"],[60,85,\\"伊藤\\"]]"
      },
      "body": "前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。"
    }
  ]
}`;

export const sourceYaml__salesFunnel = `title: "訪問から購入までの絞り込みを追う"
type: flow

readouts:
  f: { kind: funnel, source: "stages", viewW: 280, viewH: 200, colorTop: "#2563eb", colorBottom: "#a08870", label: "歩留まり (台形)" }

lanes:
  col1: { x: 0, width: 220 }
  col2: { x: 260, width: 270 }

states:
  stages: '[["訪問",1000],["登録",400],["試用",150],["購入",40]]'

actors:
  - 訪問: { kind: card, lane: col1, stack: 0, subtitle: "漏斗の入口", posW: 160 }
  - 登録: { kind: card, lane: col2, stack: 0, subtitle: "登録に進む段", posW: 180 }
  - 試用: { kind: card, lane: col1, stack: 1, subtitle: "試用に進む段", posW: 170 }
  - 購入: { kind: card, lane: col2, stack: 1, subtitle: "購入に至る段", posW: 220 }

flow:
  - 訪問 -> 登録: "登録へ" (info)
  - 登録 -> 試用: "試用へ" (warning)
  - 試用 -> 購入: "購入へ" (error)

animation:
  - step: "入口だけ" 1.8s
    focus: ["訪問"]
    set:
      stages: '[["訪問",1000],["登録",0],["試用",0],["購入",0]]'
    description: "訪問だけがある状態。 漏斗の一番上が広い。"
  - step: "絞られる" 1.8s
    focus: ["訪問", "登録", "試用"]
    set:
      stages: '[["訪問",1000],["登録",400],["試用",150],["購入",40]]'
    description: "登録と試用に進む人が現れる。 段ごとに幅が細くなる。"
  - step: "歩留まりが上がる" 1.8s
    focus: ["訪問", "登録", "試用", "購入"]
    set:
      stages: '[["訪問",1000],["登録",620],["試用",340],["購入",130]]'
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
      "label": "歩留まり (台形)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 220 },
    "col2": { "x": 260, "width": 270 }
  },
  "actors": [
    {
      "name": "訪問",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "漏斗の入口",
      "posW": 160
    },
    {
      "name": "登録",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "登録に進む段",
      "posW": 180
    },
    {
      "name": "試用",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "試用に進む段",
      "posW": 170
    },
    {
      "name": "購入",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "購入に至る段",
      "posW": 220
    }
  ],
  "flow": [
    { "from": "訪問", "to": "登録", "label": "登録へ", "tone": "info" },
    { "from": "登録", "to": "試用", "label": "試用へ", "tone": "warning" },
    { "from": "試用", "to": "購入", "label": "購入へ", "tone": "error" }
  ],
  "states": { "stages": "[[\\"訪問\\",1000],[\\"登録\\",400],[\\"試用\\",150],[\\"購入\\",40]]" },
  "animation": [
    {
      "step": "入口だけ",
      "duration": 1.8,
      "focus": ["訪問"],
      "set": { "stages": "[[\\"訪問\\",1000],[\\"登録\\",0],[\\"試用\\",0],[\\"購入\\",0]]" },
      "body": "訪問だけがある状態。 漏斗の一番上が広い。"
    },
    {
      "step": "絞られる",
      "duration": 1.8,
      "focus": ["訪問", "登録", "試用"],
      "set": { "stages": "[[\\"訪問\\",1000],[\\"登録\\",400],[\\"試用\\",150],[\\"購入\\",40]]" },
      "body": "登録と試用に進む人が現れる。 段ごとに幅が細くなる。"
    },
    {
      "step": "歩留まりが上がる",
      "duration": 1.8,
      "focus": ["訪問", "登録", "試用", "購入"],
      "set": { "stages": "[[\\"訪問\\",1000],[\\"登録\\",620],[\\"試用\\",340],[\\"購入\\",130]]" },
      "body": "各段の残る割合が改善する。 漏斗の細まり方が緩くなる。"
    }
  ]
}`;

export const sourceYaml__projectGantt = `title: "4 工程の期間を横棒で並べる"
type: flow

readouts:
  g: { kind: gantt, source: "tasks", min: 0, max: 10, viewW: 320, viewH: 140, color: "#2563eb", label: "工程表 (横棒)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 330 }

states:
  tasks: '[["設計",0,3],["実装",3,5],["テスト",6,3],["公開",9,1]]'

actors:
  - 設計: { kind: card, lane: col1, stack: 0, subtitle: "最初の工程", posW: 200  }
  - 実装: { kind: card, lane: col2, stack: 0, subtitle: "最も長い工程", posW: 280  }
  - テスト: { kind: card, lane: col1, stack: 1, subtitle: "実装と重なる工程", posW: 320  }
  - 公開: { kind: card, lane: col2, stack: 1, subtitle: "最後の工程", posW: 210  }

flow:
  - 設計 -> 実装: "引き継ぐ" (info)
  - 実装 -> テスト: "テスト開始" (accent)
  - テスト -> 公開: "公開する" (success)

animation:
  - step: "設計だけ" 1.8s
    focus: ["設計"]
    set:
      tasks: '[["設計",0,3]]'
    description: "最初の作業だけが置かれた状態。 帯が 1 本。"
  - step: "連なる" 1.8s
    focus: ["設計", "実装", "テスト"]
    set:
      tasks: '[["設計",0,3],["実装",3,5],["テスト",6,3]]'
    description: "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。"
  - step: "重なる" 1.8s
    focus: ["設計", "実装", "テスト", "公開"]
    set:
      tasks: '[["設計",0,3],["実装",2,6],["テスト",6,4],["公開",9,1]]'
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
      "label": "工程表 (横棒)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 330 }
  },
  "actors": [
    {
      "name": "設計",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最初の工程",
      "posW": 200
    },
    {
      "name": "実装",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "最も長い工程",
      "posW": 280
    },
    {
      "name": "テスト",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "実装と重なる工程",
      "posW": 320
    },
    {
      "name": "公開",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "最後の工程",
      "posW": 210
    }
  ],
  "flow": [
    { "from": "設計", "to": "実装", "label": "引き継ぐ", "tone": "info" },
    { "from": "実装", "to": "テスト", "label": "テスト開始", "tone": "accent" },
    { "from": "テスト", "to": "公開", "label": "公開する", "tone": "success" }
  ],
  "states": { "tasks": "[[\\"設計\\",0,3],[\\"実装\\",3,5],[\\"テスト\\",6,3],[\\"公開\\",9,1]]" },
  "animation": [
    {
      "step": "設計だけ",
      "duration": 1.8,
      "focus": ["設計"],
      "set": { "tasks": "[[\\"設計\\",0,3]]" },
      "body": "最初の作業だけが置かれた状態。 帯が 1 本。"
    },
    {
      "step": "連なる",
      "duration": 1.8,
      "focus": ["設計", "実装", "テスト"],
      "set": { "tasks": "[[\\"設計\\",0,3],[\\"実装\\",3,5],[\\"テスト\\",6,3]]" },
      "body": "前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。"
    },
    {
      "step": "重なる",
      "duration": 1.8,
      "focus": ["設計", "実装", "テスト", "公開"],
      "set": { "tasks": "[[\\"設計\\",0,3],[\\"実装\\",2,6],[\\"テスト\\",6,4],[\\"公開\\",9,1]]" },
      "body": "作業が並行して重なる期間が出る。 帯の重なりで山場が読める。"
    }
  ]
}`;

export const sourceYaml__resourceTreemap = `title: "6 チームの予算を面積で比べる"
type: flow

readouts:
  t: { kind: treemap, source: "teams", viewW: 280, viewH: 200, label: "予算 (面積)" }

lanes:
  major: { x: 0, width: 220 }
  mid: { x: 260, width: 200 }
  minor: { x: 500, width: 200 }

states:
  teams: '[["開発",45],["営業",20],["宣伝",15],["窓口",10],["運用",6],["法務",4]]'

actors:
  - 開発: { kind: card, lane: major, stack: 0, subtitle: "最も大きい区画" }
  - 営業: { kind: card, lane: major, stack: 1, subtitle: "2 番目に大きい" }
  - 宣伝: { kind: card, lane: major, stack: 2, subtitle: "中位の区画" }
  - 窓口: { kind: card, lane: mid, stack: 0, subtitle: "小さめの区画" }
  - 運用: { kind: card, lane: mid, stack: 1, subtitle: "小さい区画" }
  - 法務: { kind: card, lane: minor, stack: 0, subtitle: "最も小さい区画" }

animation:
  - step: "均等に分ける" 1.8s
    focus: ["開発"]
    set:
      teams: '[["開発",19],["営業",18],["宣伝",17],["窓口",16],["運用",15],["法務",14]]'
    description: "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。"
  - step: "1 つに寄る" 1.8s
    focus: ["開発", "営業", "宣伝"]
    set:
      teams: '[["開発",45],["営業",20],["宣伝",15],["窓口",10],["運用",6],["法務",4]]'
    description: "1 つに配分が寄る。 大きな区画が場所を占める。"
  - step: "分け直す" 1.8s
    focus: ["開発", "営業", "宣伝", "窓口", "運用", "法務"]
    set:
      teams: '[["開発",30],["営業",28],["宣伝",18],["窓口",12],["運用",8],["法務",4]]'
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
      "label": "予算 (面積)"
    }
  ],
  "lanes": {
    "major": { "x": 0, "width": 220 },
    "mid": { "x": 260, "width": 200 },
    "minor": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "開発",
      "kind": "card",
      "lane": "major",
      "stack": 0,
      "subtitle": "最も大きい区画"
    },
    { "name": "営業", "kind": "card", "lane": "major", "stack": 1, "subtitle": "2 番目に大きい" },
    { "name": "宣伝", "kind": "card", "lane": "major", "stack": 2, "subtitle": "中位の区画" },
    { "name": "窓口", "kind": "card", "lane": "mid", "stack": 0, "subtitle": "小さめの区画" },
    { "name": "運用", "kind": "card", "lane": "mid", "stack": 1, "subtitle": "小さい区画" },
    { "name": "法務", "kind": "card", "lane": "minor", "stack": 0, "subtitle": "最も小さい区画" }
  ],
  "flow": [],
  "states": {
    "teams": "[[\\"開発\\",45],[\\"営業\\",20],[\\"宣伝\\",15],[\\"窓口\\",10],[\\"運用\\",6],[\\"法務\\",4]]"
  },
  "animation": [
    {
      "step": "均等に分ける",
      "duration": 1.8,
      "focus": ["開発"],
      "set": {
        "teams": "[[\\"開発\\",19],[\\"営業\\",18],[\\"宣伝\\",17],[\\"窓口\\",16],[\\"運用\\",15],[\\"法務\\",14]]"
      },
      "body": "6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。"
    },
    {
      "step": "1 つに寄る",
      "duration": 1.8,
      "focus": ["開発", "営業", "宣伝"],
      "set": {
        "teams": "[[\\"開発\\",45],[\\"営業\\",20],[\\"宣伝\\",15],[\\"窓口\\",10],[\\"運用\\",6],[\\"法務\\",4]]"
      },
      "body": "1 つに配分が寄る。 大きな区画が場所を占める。"
    },
    {
      "step": "分け直す",
      "duration": 1.8,
      "focus": ["開発", "営業", "宣伝", "窓口", "運用", "法務"],
      "set": {
        "teams": "[[\\"開発\\",30],[\\"営業\\",28],[\\"宣伝\\",18],[\\"窓口\\",12],[\\"運用\\",8],[\\"法務\\",4]]"
      },
      "body": "配分を組み替える。 区画の大小と位置が同時に変わる。"
    }
  ]
}`;

export const sourceYaml__trafficSankey = `title: "流入 3 経路が 1 つの成果に合流する"
type: flow

readouts:
  s: { kind: sankey, source: "flows", viewW: 340, viewH: 220, label: "流入元 → ページ (帯の太さ)" }

lanes:
  src: { x: 0, width: 180 }
  land: { x: 392, width: 180 }
  cv: { x: 784, width: 180 }

states:
  flows: '[["検索","入口",40],["検索","商品",30],["SNS","入口",25],["SNS","商品",15],["直接","入口",20],["直接","商品",10]]'

actors:
  - 検索: { kind: card, lane: src, stack: 0, subtitle: "検索からの流入"  }
  - SNS: { kind: card, lane: src, stack: 1, subtitle: "SNS からの流入"  }
  - 直接: { kind: card, lane: src, stack: 2, subtitle: "直接の流入"  }
  - 入口: { kind: card, lane: land, stack: 0, subtitle: "入口ページ"  }
  - 商品: { kind: card, lane: land, stack: 1, subtitle: "商品ページ"  }
  - 購入: { kind: card, lane: cv, stack: 0, subtitle: "成果ページ"  }

flow:
  - 検索 -> 入口: "40" (success)
  - 検索 -> 商品: "30" (success) { labelOffsetX: 90 }
  - SNS -> 入口: "25" (info) { labelOffsetX: -40 }
  - SNS -> 商品: "15" (info)
  - 直接 -> 入口: "20" (accent)
  - 直接 -> 商品: "10" (accent)
  - 入口 -> 購入: "85" (warning)
  - 商品 -> 購入: "55" (warning)

animation:
  - step: "1 経路" 1.8s
    focus: ["検索", "入口"]
    set:
      flows: '[["検索","入口",40]]'
    description: "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。"
  - step: "枝分かれ" 1.8s
    focus: ["検索", "SNS", "入口", "商品"]
    set:
      flows: '[["検索","入口",40],["検索","商品",30],["SNS","入口",25],["SNS","商品",15]]'
    description: "流入元が増え、行き先も分かれる。 帯が交差する。"
  - step: "流入元が増える" 1.8s
    focus: ["検索", "SNS", "直接", "入口", "商品", "購入"]
    set:
      flows: '[["検索","入口",40],["検索","商品",30],["SNS","入口",25],["SNS","商品",15],["直接","入口",20],["直接","商品",10]]'
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
      "label": "流入元 → ページ (帯の太さ)"
    }
  ],
  "lanes": {
    "src": { "x": 0, "width": 180 },
    "land": { "x": 392, "width": 180 },
    "cv": { "x": 784, "width": 180 }
  },
  "actors": [
    { "name": "検索", "kind": "card", "lane": "src", "stack": 0, "subtitle": "検索からの流入"  },
    { "name": "SNS", "kind": "card", "lane": "src", "stack": 1, "subtitle": "SNS からの流入"  },
    { "name": "直接", "kind": "card", "lane": "src", "stack": 2, "subtitle": "直接の流入"  },
    { "name": "入口", "kind": "card", "lane": "land", "stack": 0, "subtitle": "入口ページ"  },
    { "name": "商品", "kind": "card", "lane": "land", "stack": 1, "subtitle": "商品ページ"  },
    { "name": "購入", "kind": "card", "lane": "cv", "stack": 0, "subtitle": "成果ページ"  }
  ],
  "flow": [
    { "from": "検索", "to": "入口", "label": "40", "tone": "success" },
    { "from": "検索", "to": "商品", "label": "30", "tone": "success", "labelOffsetX": 90 },
    { "from": "SNS", "to": "入口", "label": "25", "tone": "info", "labelOffsetX": -40 },
    { "from": "SNS", "to": "商品", "label": "15", "tone": "info" },
    { "from": "直接", "to": "入口", "label": "20", "tone": "accent" },
    { "from": "直接", "to": "商品", "label": "10", "tone": "accent" },
    { "from": "入口", "to": "購入", "label": "85", "tone": "warning" },
    { "from": "商品", "to": "購入", "label": "55", "tone": "warning" }
  ],
  "states": {
    "flows": "[[\\"検索\\",\\"入口\\",40],[\\"検索\\",\\"商品\\",30],[\\"SNS\\",\\"入口\\",25],[\\"SNS\\",\\"商品\\",15],[\\"直接\\",\\"入口\\",20],[\\"直接\\",\\"商品\\",10]]"
  },
  "animation": [
    {
      "step": "1 経路",
      "duration": 1.8,
      "focus": ["検索", "入口"],
      "set": { "flows": "[[\\"検索\\",\\"入口\\",40]]" },
      "body": "1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。"
    },
    {
      "step": "枝分かれ",
      "duration": 1.8,
      "focus": ["検索", "SNS", "入口", "商品"],
      "set": {
        "flows": "[[\\"検索\\",\\"入口\\",40],[\\"検索\\",\\"商品\\",30],[\\"SNS\\",\\"入口\\",25],[\\"SNS\\",\\"商品\\",15]]"
      },
      "body": "流入元が増え、行き先も分かれる。 帯が交差する。"
    },
    {
      "step": "流入元が増える",
      "duration": 1.8,
      "focus": ["検索", "SNS", "直接", "入口", "商品", "購入"],
      "set": {
        "flows": "[[\\"検索\\",\\"入口\\",40],[\\"検索\\",\\"商品\\",30],[\\"SNS\\",\\"入口\\",25],[\\"SNS\\",\\"商品\\",15],[\\"直接\\",\\"入口\\",20],[\\"直接\\",\\"商品\\",10]]"
      },
      "body": "3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。"
    }
  ]
}`;

export const sourceYaml__activityPolar = `title: "1 週間の活動を平日 / 週末に分ける"
type: flow

readouts:
  p: { kind: polar-area, source: "hours", max: 10, viewW: 220, viewH: 220, labelSource: "days", label: "時間 (扇形)" }

lanes:
  weekday: { x: 0, width: 300 }
  weekend: { x: 380, width: 220 }

states:
  hours: "[3,5,8,6,7,4,2]"
  days: '["月曜","火曜","水曜","木曜","金曜","土曜","日曜"]'

actors:
  - 月曜: { kind: card, lane: weekday, stack: 0, subtitle: "{hours[0]} 時間" }
  - 火曜: { kind: card, lane: weekday, stack: 1, subtitle: "{hours[1]} 時間" }
  - 水曜: { kind: card, lane: weekday, stack: 2, subtitle: "{hours[2]} 時間" }
  - 木曜: { kind: card, lane: weekday, stack: 3, subtitle: "{hours[3]} 時間" }
  - 金曜: { kind: card, lane: weekday, stack: 4, subtitle: "{hours[4]} 時間" }
  - 土曜: { kind: card, lane: weekend, stack: 0, subtitle: "{hours[5]} 時間" }
  - 日曜: { kind: card, lane: weekend, stack: 1, subtitle: "{hours[6]} 時間" }

animation:
  - step: "平日だけ" 1.8s
    focus: ["月曜", "火曜"]
    set:
      hours: "[6,7,8,6,7,0,0]"
    description: "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。"
  - step: "週末も入る" 1.8s
    focus: ["月曜", "火曜", "水曜", "木曜", "金曜"]
    set:
      hours: "[3,5,8,6,7,4,2]"
    description: "週末にも時間が入る。 扇形が一周に広がる。"
  - step: "差を均す" 1.8s
    focus: ["月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"]
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
      "label": "時間 (扇形)"
    }
  ],
  "lanes": {
    "weekday": { "x": 0, "width": 300 },
    "weekend": { "x": 380, "width": 220 }
  },
  "actors": [
    { "name": "月曜", "kind": "card", "lane": "weekday", "stack": 0, "subtitle": "{hours[0]} 時間" },
    { "name": "火曜", "kind": "card", "lane": "weekday", "stack": 1, "subtitle": "{hours[1]} 時間" },
    { "name": "水曜", "kind": "card", "lane": "weekday", "stack": 2, "subtitle": "{hours[2]} 時間" },
    { "name": "木曜", "kind": "card", "lane": "weekday", "stack": 3, "subtitle": "{hours[3]} 時間" },
    { "name": "金曜", "kind": "card", "lane": "weekday", "stack": 4, "subtitle": "{hours[4]} 時間" },
    { "name": "土曜", "kind": "card", "lane": "weekend", "stack": 0, "subtitle": "{hours[5]} 時間" },
    { "name": "日曜", "kind": "card", "lane": "weekend", "stack": 1, "subtitle": "{hours[6]} 時間" }
  ],
  "flow": [],
  "states": {
    "hours": "[3,5,8,6,7,4,2]",
    "days": "[\\"月曜\\",\\"火曜\\",\\"水曜\\",\\"木曜\\",\\"金曜\\",\\"土曜\\",\\"日曜\\"]"
  },
  "animation": [
    {
      "step": "平日だけ",
      "duration": 1.8,
      "focus": ["月曜", "火曜"],
      "set": { "hours": "[6,7,8,6,7,0,0]" },
      "body": "平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。"
    },
    {
      "step": "週末も入る",
      "duration": 1.8,
      "focus": ["月曜", "火曜", "水曜", "木曜", "金曜"],
      "set": { "hours": "[3,5,8,6,7,4,2]" },
      "body": "週末にも時間が入る。 扇形が一周に広がる。"
    },
    {
      "step": "差を均す",
      "duration": 1.8,
      "focus": ["月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"],
      "set": { "hours": "[5,5,6,5,6,4,4]" },
      "body": "曜日ごとの差が縮まる。 扇形の長さが揃う。"
    }
  ]
}`;

export const sourceYaml__playerLeaderboard = `title: "6 人の順位を上位 / 中位 / 下位に分ける"
type: flow

readouts:
  lb: { kind: leaderboard, source: "players", max: 5, color: "#2563eb", label: "順位 (上位 5 人)" }

lanes:
  top: { x: 0, width: 260 }
  middle: { x: 300, width: 220 }
  bottom: { x: 540, width: 200 }

states:
  players: '[["佐藤",920],["鈴木",780],["高橋",850],["田中",680],["伊藤",890],["渡辺",720]]'

actors:
  - 🥇 1 位 佐藤: { kind: card, lane: top, stack: 0, subtitle: "首位" }
  - 🥈 2 位 伊藤: { kind: card, lane: top, stack: 1, subtitle: "上位" }
  - 🥉 3 位 高橋: { kind: card, lane: top, stack: 2, subtitle: "上位" }
  - 4 位 鈴木: { kind: card, lane: middle, stack: 0, subtitle: "中位" }
  - 5 位 渡辺: { kind: card, lane: middle, stack: 1, subtitle: "表示の末尾" }
  - 6 位 田中: { kind: card, lane: bottom, stack: 0, subtitle: "表示の外 (上位 5 人まで)" }

animation:
  - step: "接戦の状態" 1.8s
    focus: ["🥇 1 位 佐藤"]
    set:
      players: '[["佐藤",920],["鈴木",915],["高橋",910],["田中",905],["伊藤",900]]'
    description: "上位の点差が小さい状態。 並びが僅差で決まる。"
  - step: "差が開く" 1.8s
    focus: ["🥇 1 位 佐藤", "🥈 2 位 伊藤"]
    set:
      players: '[["佐藤",1180],["伊藤",890],["高橋",850],["鈴木",780],["渡辺",720]]'
    description: "首位が抜ける。 上位と下位の点差が大きくなる。"
  - step: "順位が入れ替わる" 1.8s
    focus: ["🥇 1 位 佐藤", "🥈 2 位 伊藤", "🥉 3 位 高橋", "4 位 鈴木", "5 位 渡辺", "6 位 田中"]
    set:
      players: '[["高橋",1240],["佐藤",1180],["渡辺",1050],["伊藤",890],["鈴木",780],["田中",680]]'
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
      "label": "順位 (上位 5 人)"
    }
  ],
  "lanes": {
    "top": { "x": 0, "width": 260 },
    "middle": { "x": 300, "width": 220 },
    "bottom": { "x": 540, "width": 200 }
  },
  "actors": [
    { "name": "🥇 1 位 佐藤", "kind": "card", "lane": "top", "stack": 0, "subtitle": "首位" },
    { "name": "🥈 2 位 伊藤", "kind": "card", "lane": "top", "stack": 1, "subtitle": "上位" },
    { "name": "🥉 3 位 高橋", "kind": "card", "lane": "top", "stack": 2, "subtitle": "上位" },
    { "name": "4 位 鈴木", "kind": "card", "lane": "middle", "stack": 0, "subtitle": "中位" },
    { "name": "5 位 渡辺", "kind": "card", "lane": "middle", "stack": 1, "subtitle": "表示の末尾" },
    { "name": "6 位 田中", "kind": "card", "lane": "bottom", "stack": 0, "subtitle": "表示の外 (上位 5 人まで)" }
  ],
  "flow": [],
  "states": {
    "players": "[[\\"佐藤\\",920],[\\"鈴木\\",780],[\\"高橋\\",850],[\\"田中\\",680],[\\"伊藤\\",890],[\\"渡辺\\",720]]"
  },
  "animation": [
    {
      "step": "接戦の状態",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤"],
      "set": {
        "players": "[[\\"佐藤\\",920],[\\"鈴木\\",915],[\\"高橋\\",910],[\\"田中\\",905],[\\"伊藤\\",900]]"
      },
      "body": "上位の点差が小さい状態。 並びが僅差で決まる。"
    },
    {
      "step": "差が開く",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤", "🥈 2 位 伊藤"],
      "set": {
        "players": "[[\\"佐藤\\",1180],[\\"伊藤\\",890],[\\"高橋\\",850],[\\"鈴木\\",780],[\\"渡辺\\",720]]"
      },
      "body": "首位が抜ける。 上位と下位の点差が大きくなる。"
    },
    {
      "step": "順位が入れ替わる",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤", "🥈 2 位 伊藤", "🥉 3 位 高橋", "4 位 鈴木", "5 位 渡辺", "6 位 田中"],
      "set": {
        "players": "[[\\"高橋\\",1240],[\\"佐藤\\",1180],[\\"渡辺\\",1050],[\\"伊藤\\",890],[\\"鈴木\\",780],[\\"田中\\",680]]"
      },
      "body": "別の人が首位に立つ。 並びが上下ごと組み替わる。"
    }
  ]
}`;

export const sourceYaml__techTagCloud = `title: "8 技術を使用量の大小で分けて見せる"
type: flow

readouts:
  tc: { kind: tag-cloud, source: "tags", minSize: 12, maxSize: 32, label: "技術の語 (大きさ = 使用量)" }

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
      "label": "技術の語 (大きさ = 使用量)"
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
  af: { kind: activity-feed, source: "events", max: 5, color: "#2563eb", label: "最近の出来事 (新しい順)" }

lanes:
  col1: { x: 0, width: 350 }
  col2: { x: 390, width: 370 }
  col3: { x: 800, width: 320 }

states:
  events: '[["佐藤","変更を送った","2 分前"],["鈴木","変更依頼 #42 を出した","8 分前"],["高橋","変更依頼 #40 を確かめた","15 分前"],["田中","変更依頼 #38 を取り込んだ","1 時間前"],["伊藤","v1.2 を配備した","3 時間前"]]'

actors:
  - 佐藤: { kind: card, lane: col1, stack: 0, subtitle: "最新の出来事", posW: 300 }
  - 鈴木: { kind: card, lane: col1, stack: 1, subtitle: "次に新しい出来事", posW: 290 }
  - 高橋: { kind: card, lane: col2, stack: 0, subtitle: "中ほどの出来事", posW: 320 }
  - 田中: { kind: card, lane: col2, stack: 1, subtitle: "やや古い出来事", posW: 270 }
  - 伊藤: { kind: card, lane: col3, stack: 0, subtitle: "最も古い出来事", posW: 270 }

flow:
  - 佐藤 -> 鈴木: "→" (info)
  - 鈴木 -> 高橋: "→" (info)
  - 高橋 -> 田中: "→" (accent)
  - 田中 -> 伊藤: "→" (accent)

animation:
  - step: "1 件だけ" 1.8s
    focus: ["佐藤"]
    set:
      events: '[["佐藤","変更を送った","2 分前"]]'
    description: "出来事が 1 件だけある状態。 一覧の先頭に入る。"
  - step: "積み上がる" 1.8s
    focus: ["佐藤", "鈴木", "高橋"]
    set:
      events: '[["佐藤","変更を送った","2 分前"],["鈴木","変更依頼 #42 を出した","8 分前"],["高橋","変更依頼 #40 を確かめた","15 分前"]]'
    description: "出来事が増えて一覧が伸びる。 新しいものが上に来る。"
  - step: "押し出される" 1.8s
    focus: ["佐藤", "鈴木", "高橋", "田中", "伊藤"]
    set:
      events: '[["田中","v2.0 を公開した","1 分前"],["佐藤","変更を送った","2 分前"],["鈴木","変更依頼 #42 を出した","8 分前"],["高橋","変更依頼 #40 を確かめた","15 分前"],["伊藤","変更依頼 #38 を取り込んだ","1 時間前"]]'
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
      "label": "最近の出来事 (新しい順)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 350 },
    "col2": { "x": 390, "width": 370 },
    "col3": { "x": 800, "width": 320 }
  },
  "actors": [
    {
      "name": "佐藤",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最新の出来事",
      "posW": 300
    },
    {
      "name": "鈴木",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "次に新しい出来事",
      "posW": 290
    },
    {
      "name": "高橋",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "中ほどの出来事",
      "posW": 320
    },
    {
      "name": "田中",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "やや古い出来事",
      "posW": 270
    },
    {
      "name": "伊藤",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "最も古い出来事",
      "posW": 270
    }
  ],
  "flow": [
    { "from": "佐藤", "to": "鈴木", "label": "→", "tone": "info" },
    { "from": "鈴木", "to": "高橋", "label": "→", "tone": "info" },
    { "from": "高橋", "to": "田中", "label": "→", "tone": "accent" },
    { "from": "田中", "to": "伊藤", "label": "→", "tone": "accent" }
  ],
  "states": {
    "events": "[[\\"佐藤\\",\\"変更を送った\\",\\"2 分前\\"],[\\"鈴木\\",\\"変更依頼 #42 を出した\\",\\"8 分前\\"],[\\"高橋\\",\\"変更依頼 #40 を確かめた\\",\\"15 分前\\"],[\\"田中\\",\\"変更依頼 #38 を取り込んだ\\",\\"1 時間前\\"],[\\"伊藤\\",\\"v1.2 を配備した\\",\\"3 時間前\\"]]"
  },
  "animation": [
    {
      "step": "1 件だけ",
      "duration": 1.8,
      "focus": ["佐藤"],
      "set": { "events": "[[\\"佐藤\\",\\"変更を送った\\",\\"2 分前\\"]]" },
      "body": "出来事が 1 件だけある状態。 一覧の先頭に入る。"
    },
    {
      "step": "積み上がる",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木", "高橋"],
      "set": {
        "events": "[[\\"佐藤\\",\\"変更を送った\\",\\"2 分前\\"],[\\"鈴木\\",\\"変更依頼 #42 を出した\\",\\"8 分前\\"],[\\"高橋\\",\\"変更依頼 #40 を確かめた\\",\\"15 分前\\"]]"
      },
      "body": "出来事が増えて一覧が伸びる。 新しいものが上に来る。"
    },
    {
      "step": "押し出される",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木", "高橋", "田中", "伊藤"],
      "set": {
        "events": "[[\\"田中\\",\\"v2.0 を公開した\\",\\"1 分前\\"],[\\"佐藤\\",\\"変更を送った\\",\\"2 分前\\"],[\\"鈴木\\",\\"変更依頼 #42 を出した\\",\\"8 分前\\"],[\\"高橋\\",\\"変更依頼 #40 を確かめた\\",\\"15 分前\\"],[\\"伊藤\\",\\"変更依頼 #38 を取り込んだ\\",\\"1 時間前\\"]]"
      },
      "body": "件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。"
    }
  ]
}`;

export const sourceYaml__sprintChecklist = `title: "6 タスクを完了 / 未完了で分ける"
type: flow

readouts:
  cl: { kind: checklist, source: "tasks", color: "#22c55e", label: "進み具合" }

lanes:
  done: { x: 0, width: 240 }
  todo: { x: 300, width: 240 }

states:
  tasks: '[["自動検査を整える",true],["テストを書く",true],["不具合 #42 を直す",false],["変更を確かめる",false],["配備",false],["振り返り",false]]'

actors:
  - ✓ 自動検査を整える: { kind: card, lane: done, stack: 0, subtitle: "完了" }
  - ✓ テストを書く: { kind: card, lane: done, stack: 1, subtitle: "完了" }
  - 不具合 #42 を直す: { kind: card, lane: todo, stack: 0, subtitle: "未完了 (他を止める)" }
  - 変更を確かめる: { kind: card, lane: todo, stack: 1, subtitle: "未完了 (確かめる人を待つ)" }
  - 配備: { kind: card, lane: todo, stack: 2, subtitle: "未完了 (確かめた後)" }
  - 振り返り: { kind: card, lane: todo, stack: 3, subtitle: "未完了 (最後)" }

animation:
  - step: "着手前" 1.8s
    focus: ["✓ 自動検査を整える"]
    set:
      tasks: '[["自動検査を整える",false],["テストを書く",false],["不具合 #42 を直す",false],["変更を確かめる",false],["配備",false],["振り返り",false]]'
    description: "どれも未完了の状態。 印が 1 つも付いていない。"
  - step: "半分進む" 1.8s
    focus: ["✓ 自動検査を整える", "✓ テストを書く", "不具合 #42 を直す"]
    set:
      tasks: '[["自動検査を整える",true],["テストを書く",true],["不具合 #42 を直す",true],["変更を確かめる",false],["配備",false],["振り返り",false]]'
    description: "前半が終わる。 印の付いた項目が上に集まる。"
  - step: "残り 1 件" 1.8s
    focus: ["✓ 自動検査を整える", "✓ テストを書く", "不具合 #42 を直す", "変更を確かめる", "配備", "振り返り"]
    set:
      tasks: '[["自動検査を整える",true],["テストを書く",true],["不具合 #42 を直す",true],["変更を確かめる",true],["配備",true],["振り返り",false]]'
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
      "label": "進み具合"
    }
  ],
  "lanes": {
    "done": { "x": 0, "width": 240 },
    "todo": { "x": 300, "width": 240 }
  },
  "actors": [
    { "name": "✓ 自動検査を整える", "kind": "card", "lane": "done", "stack": 0, "subtitle": "完了" },
    { "name": "✓ テストを書く", "kind": "card", "lane": "done", "stack": 1, "subtitle": "完了" },
    {
      "name": "不具合 #42 を直す",
      "kind": "card",
      "lane": "todo",
      "stack": 0,
      "subtitle": "未完了 (他を止める)"
    },
    {
      "name": "変更を確かめる",
      "kind": "card",
      "lane": "todo",
      "stack": 1,
      "subtitle": "未完了 (確かめる人を待つ)"
    },
    {
      "name": "配備",
      "kind": "card",
      "lane": "todo",
      "stack": 2,
      "subtitle": "未完了 (確かめた後)"
    },
    {
      "name": "振り返り",
      "kind": "card",
      "lane": "todo",
      "stack": 3,
      "subtitle": "未完了 (最後)"
    }
  ],
  "flow": [],
  "states": {
    "tasks": "[[\\"自動検査を整える\\",true],[\\"テストを書く\\",true],[\\"不具合 #42 を直す\\",false],[\\"変更を確かめる\\",false],[\\"配備\\",false],[\\"振り返り\\",false]]"
  },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["✓ 自動検査を整える"],
      "set": {
        "tasks": "[[\\"自動検査を整える\\",false],[\\"テストを書く\\",false],[\\"不具合 #42 を直す\\",false],[\\"変更を確かめる\\",false],[\\"配備\\",false],[\\"振り返り\\",false]]"
      },
      "body": "どれも未完了の状態。 印が 1 つも付いていない。"
    },
    {
      "step": "半分進む",
      "duration": 1.8,
      "focus": ["✓ 自動検査を整える", "✓ テストを書く", "不具合 #42 を直す"],
      "set": {
        "tasks": "[[\\"自動検査を整える\\",true],[\\"テストを書く\\",true],[\\"不具合 #42 を直す\\",true],[\\"変更を確かめる\\",false],[\\"配備\\",false],[\\"振り返り\\",false]]"
      },
      "body": "前半が終わる。 印の付いた項目が上に集まる。"
    },
    {
      "step": "残り 1 件",
      "duration": 1.8,
      "focus": ["✓ 自動検査を整える", "✓ テストを書く", "不具合 #42 を直す", "変更を確かめる", "配備", "振り返り"],
      "set": {
        "tasks": "[[\\"自動検査を整える\\",true],[\\"テストを書く\\",true],[\\"不具合 #42 を直す\\",true],[\\"変更を確かめる\\",true],[\\"配備\\",true],[\\"振り返り\\",false]]"
      },
      "body": "最後の 1 件を残して終わる。 未完了がどれか一目で分かる。"
    }
  ]
}`;

export const sourceYaml__postReactions = `title: "投稿への 4 種の反応を並べる"
type: flow

readouts:
  rb: { kind: reaction-bar, source: "reactions", color: "#2563eb", label: "反応 (札の並び)" }

lanes:
  thumb: { x: 0, width: 360 }
  heart: { x: 380, width: 270 }
  laugh: { x: 670, width: 270 }
  party: { x: 960, width: 270 }

states:
  reactions: '[["👍",24],["❤️",12],["😂",8],["🎉",5]]'

actors:
  - 👍 いいね: { kind: card, lane: thumb, stack: 0, subtitle: "最も多く付く反応", posW: 310 }
  - ❤️ Heart2: { kind: card, lane: heart, stack: 0, subtitle: "次に多い反応", posW: 220, title: "❤️ 好き" }
  - 😂 Laugh2: { kind: card, lane: laugh, stack: 0, subtitle: "中ほどの反応", posW: 220, title: "😂 笑い" }
  - 🎉 Party2: { kind: card, lane: party, stack: 0, subtitle: "最も少ない反応", posW: 220, title: "🎉 お祝い" }

animation:
  - step: "投稿した直後" 1.8s
    focus: ["👍 いいね"]
    set:
      reactions: '[["👍",5],["❤️",3],["😂",2],["🎉",1]]'
    description: "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。"
  - step: "広まる" 1.8s
    focus: ["👍 いいね", "❤️ Heart2"]
    set:
      reactions: '[["👍",14],["❤️",7],["😂",4],["🎉",2]]'
    description: "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。"
  - step: "落ち着く" 1.8s
    focus: ["👍 いいね", "❤️ Heart2", "😂 Laugh2", "🎉 Party2"]
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
      "label": "反応 (札の並び)"
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
      "name": "👍 いいね",
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
      "title": "❤️ 好き"
    },
    {
      "name": "😂 Laugh2",
      "kind": "card",
      "lane": "laugh",
      "stack": 0,
      "subtitle": "中ほどの反応",
      "posW": 220,
      "title": "😂 笑い"
    },
    {
      "name": "🎉 Party2",
      "kind": "card",
      "lane": "party",
      "stack": 0,
      "subtitle": "最も少ない反応",
      "posW": 220,
      "title": "🎉 お祝い"
    }
  ],
  "flow": [],
  "states": { "reactions": "[[\\"👍\\",24],[\\"❤️\\",12],[\\"😂\\",8],[\\"🎉\\",5]]" },
  "animation": [
    {
      "step": "投稿した直後",
      "duration": 1.8,
      "focus": ["👍 いいね"],
      "set": { "reactions": "[[\\"👍\\",5],[\\"❤️\\",3],[\\"😂\\",2],[\\"🎉\\",1]]" },
      "body": "反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。"
    },
    {
      "step": "広まる",
      "duration": 1.8,
      "focus": ["👍 いいね", "❤️ Heart2"],
      "set": { "reactions": "[[\\"👍\\",14],[\\"❤️\\",7],[\\"😂\\",4],[\\"🎉\\",2]]" },
      "body": "数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["👍 いいね", "❤️ Heart2", "😂 Laugh2", "🎉 Party2"],
      "set": { "reactions": "[[\\"👍\\",24],[\\"❤️\\",12],[\\"😂\\",8],[\\"🎉\\",5]]" },
      "body": "伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。"
    }
  ]
}`;

export const sourceYaml__techPills = `title: "技術 5 つを画面 / 基盤 / 構築で分ける"
type: flow

readouts:
  pg: { kind: pill-group, source: "stack", label: "使う技術 (札の並び)" }

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
    { "id": "pg", "kind": "pill-group", "source": "stack", "label": "使う技術 (札の並び)" }
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
  mg: { kind: metrics-grid, source: "kpis", color: "#2563eb", label: "指標 (2×2 の升目)" }

lanes:
  users: { x: 0, width: 270 }
  revenue: { x: 290, width: 250 }
  uptime: { x: 560, width: 230 }
  errors: { x: 810, width: 230 }

states:
  kpis: '[["利用者","12.4k"],["売上","$45k"],["稼働率","99.9","%"],["異常",12]]'

actors:
  - Users2: { kind: card, lane: users, stack: 0, subtitle: "月あたりの利用者", posW: 220, title: "利用者" }
  - Revenue2: { kind: card, lane: revenue, stack: 0, subtitle: "月ごとの売上", posW: 200, title: "売上" }
  - Uptime2: { kind: card, lane: uptime, stack: 0, subtitle: "動き続けた割合", posW: 180, title: "稼働率" }
  - Errors2: { kind: card, lane: errors, stack: 0, subtitle: "異常の件数 (直近)", posW: 180, title: "異常" }

animation:
  - step: "立ち上げ" 1.8s
    focus: ["Users2", "Errors2"]
    set:
      kpis: '[["利用者","3.1k"],["売上","$9k"],["稼働率","98.2","%"],["異常",47]]'
    description: "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。"
  - step: "伸びる" 1.8s
    focus: ["Users2", "Revenue2", "Errors2"]
    set:
      kpis: '[["利用者","7.8k"],["売上","$26k"],["稼働率","99.4","%"],["異常",23]]'
    description: "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。"
  - step: "落ち着く" 1.8s
    focus: ["Users2", "Revenue2", "Uptime2", "Errors2"]
    set:
      kpis: '[["利用者","12.4k"],["売上","$45k"],["稼働率","99.9","%"],["異常",12]]'
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
      "label": "指標 (2×2 の升目)"
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
      "title": "利用者"
    },
    {
      "name": "Revenue2",
      "kind": "card",
      "lane": "revenue",
      "stack": 0,
      "subtitle": "月ごとの売上",
      "posW": 200,
      "title": "売上"
    },
    {
      "name": "Uptime2",
      "kind": "card",
      "lane": "uptime",
      "stack": 0,
      "subtitle": "動き続けた割合",
      "posW": 180,
      "title": "稼働率"
    },
    {
      "name": "Errors2",
      "kind": "card",
      "lane": "errors",
      "stack": 0,
      "subtitle": "異常の件数 (直近)",
      "posW": 180,
      "title": "異常"
    }
  ],
  "flow": [],
  "states": {
    "kpis": "[[\\"利用者\\",\\"12.4k\\"],[\\"売上\\",\\"$45k\\"],[\\"稼働率\\",\\"99.9\\",\\"%\\"],[\\"異常\\",12]]"
  },
  "animation": [
    {
      "step": "立ち上げ",
      "duration": 1.8,
      "focus": ["Users2", "Errors2"],
      "set": {
        "kpis": "[[\\"利用者\\",\\"3.1k\\"],[\\"売上\\",\\"$9k\\"],[\\"稼働率\\",\\"98.2\\",\\"%\\"],[\\"異常\\",47]]"
      },
      "body": "利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。"
    },
    {
      "step": "伸びる",
      "duration": 1.8,
      "focus": ["Users2", "Revenue2", "Errors2"],
      "set": {
        "kpis": "[[\\"利用者\\",\\"7.8k\\"],[\\"売上\\",\\"$26k\\"],[\\"稼働率\\",\\"99.4\\",\\"%\\"],[\\"異常\\",23]]"
      },
      "body": "利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。"
    },
    {
      "step": "落ち着く",
      "duration": 1.8,
      "focus": ["Users2", "Revenue2", "Uptime2", "Errors2"],
      "set": {
        "kpis": "[[\\"利用者\\",\\"12.4k\\"],[\\"売上\\",\\"$45k\\"],[\\"稼働率\\",\\"99.9\\",\\"%\\"],[\\"異常\\",12]]"
      },
      "body": "4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。"
    }
  ]
}`;

export const sourceYaml__kpiIconTile = `title: "3 つの指標をアイコン付きのタイルで並べる"
type: flow

readouts:
  it: { kind: icon-tile, source: "kpis", color: "#2563eb", label: "指標 (絵記号の札)" }

lanes:
  growth: { x: 0, width: 220 }
  revenue: { x: 260, width: 220 }
  goals: { x: 520, width: 220 }

states:
  kpis: '[["📈","伸び","+15%"],["💰","売上","$50k"],["🎯","目標","8/10"]]'

actors:
  - 📈 Growth2: { kind: card, lane: growth, stack: 0, subtitle: "前の月からの伸び", title: "📈 伸び" }
  - 💰 Revenue2: { kind: card, lane: revenue, stack: 0, subtitle: "月ごとの売上", title: "💰 売上" }
  - 🎯 Goals2: { kind: card, lane: goals, stack: 0, subtitle: "達成した目標の数", title: "🎯 目標" }

animation:
  - step: "期の始め" 1.8s
    focus: ["📈 Growth2"]
    set:
      kpis: '[["📈","伸び","+2%"],["💰","売上","$18k"],["🎯","目標","2/10"]]'
    description: "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。"
  - step: "期の半ば" 1.8s
    focus: ["📈 Growth2", "💰 Revenue2"]
    set:
      kpis: '[["📈","伸び","+9%"],["💰","売上","$33k"],["🎯","目標","5/10"]]'
    description: "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。"
  - step: "期の終わり" 1.8s
    focus: ["📈 Growth2", "💰 Revenue2", "🎯 Goals2"]
    set:
      kpis: '[["📈","伸び","+15%"],["💰","売上","$50k"],["🎯","目標","8/10"]]'
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
      "label": "指標 (絵記号の札)"
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
      "title": "📈 伸び"
    },
    {
      "name": "💰 Revenue2",
      "kind": "card",
      "lane": "revenue",
      "stack": 0,
      "subtitle": "月ごとの売上",
      "title": "💰 売上"
    },
    {
      "name": "🎯 Goals2",
      "kind": "card",
      "lane": "goals",
      "stack": 0,
      "subtitle": "達成した目標の数",
      "title": "🎯 目標"
    }
  ],
  "flow": [],
  "states": {
    "kpis": "[[\\"📈\\",\\"伸び\\",\\"+15%\\"],[\\"💰\\",\\"売上\\",\\"$50k\\"],[\\"🎯\\",\\"目標\\",\\"8/10\\"]]"
  },
  "animation": [
    {
      "step": "期の始め",
      "duration": 1.8,
      "focus": ["📈 Growth2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"伸び\\",\\"+2%\\"],[\\"💰\\",\\"売上\\",\\"$18k\\"],[\\"🎯\\",\\"目標\\",\\"2/10\\"]]"
      },
      "body": "3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。"
    },
    {
      "step": "期の半ば",
      "duration": 1.8,
      "focus": ["📈 Growth2", "💰 Revenue2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"伸び\\",\\"+9%\\"],[\\"💰\\",\\"売上\\",\\"$33k\\"],[\\"🎯\\",\\"目標\\",\\"5/10\\"]]"
      },
      "body": "3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。"
    },
    {
      "step": "期の終わり",
      "duration": 1.8,
      "focus": ["📈 Growth2", "💰 Revenue2", "🎯 Goals2"],
      "set": {
        "kpis": "[[\\"📈\\",\\"伸び\\",\\"+15%\\"],[\\"💰\\",\\"売上\\",\\"$50k\\"],[\\"🎯\\",\\"目標\\",\\"8/10\\"]]"
      },
      "body": "目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。"
    }
  ]
}`;

export const sourceYaml__cryptoWallet = `title: "保有 4 銘柄を値上がり / 値下がりで分ける"
type: flow

readouts:
  tl: { kind: token-list, source: "tokens", colorUp: "#22c55e", colorDown: "#ef4444", label: "保有 (合計)" }

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
      "label": "保有 (合計)"
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
  mp: { kind: map-pin, source: "cities", xMin: 0, xMax: 120, yMin: 0, yMax: 80, viewW: 300, viewH: 200, color: "#2563eb", label: "世界地図 (平面の座標)" }

lanes:
  apac: { x: 0, width: 220 }
  amea: { x: 300, width: 220 }

states:
  cities: '[["東京",100,60],["パリ",60,30],["ニューヨーク",30,40],["シドニー",105,75],["リオ",40,65]]'

actors:
  - 東京: { kind: card, lane: apac, stack: 0, subtitle: "最初の拠点 (右寄り・やや下)" }
  - シドニー: { kind: card, lane: apac, stack: 1, subtitle: "最も下に出る点" }
  - ニューヨーク: { kind: card, lane: amea, stack: 0, subtitle: "最も左に出る点" }
  - パリ: { kind: card, lane: amea, stack: 1, subtitle: "最も上に出る点" }
  - リオ: { kind: card, lane: amea, stack: 2, subtitle: "左下に出る点" }

animation:
  - step: "拠点は 1 つ" 1.8s
    focus: ["東京"]
    set:
      cities: '[["東京",100,60]]'
    description: "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。"
  - step: "西へ広がる" 1.8s
    focus: ["東京", "ニューヨーク", "パリ"]
    set:
      cities: '[["東京",100,60],["ニューヨーク",30,40],["パリ",60,30]]'
    description: "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。"
  - step: "南半球まで" 1.8s
    focus: ["東京", "シドニー", "ニューヨーク", "パリ", "リオ"]
    set:
      cities: '[["東京",100,60],["パリ",60,30],["ニューヨーク",30,40],["シドニー",105,75],["リオ",40,65]]'
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
      "label": "世界地図 (平面の座標)"
    }
  ],
  "lanes": {
    "apac": { "x": 0, "width": 220 },
    "amea": { "x": 300, "width": 220 }
  },
  "actors": [
    {
      "name": "東京",
      "kind": "card",
      "lane": "apac",
      "stack": 0,
      "subtitle": "最初の拠点 (右寄り・やや下)"
    },
    { "name": "シドニー", "kind": "card", "lane": "apac", "stack": 1, "subtitle": "最も下に出る点" },
    { "name": "ニューヨーク", "kind": "card", "lane": "amea", "stack": 0, "subtitle": "最も左に出る点" },
    { "name": "パリ", "kind": "card", "lane": "amea", "stack": 1, "subtitle": "最も上に出る点" },
    { "name": "リオ", "kind": "card", "lane": "amea", "stack": 2, "subtitle": "左下に出る点" }
  ],
  "flow": [],
  "states": {
    "cities": "[[\\"東京\\",100,60],[\\"パリ\\",60,30],[\\"ニューヨーク\\",30,40],[\\"シドニー\\",105,75],[\\"リオ\\",40,65]]"
  },
  "animation": [
    {
      "step": "拠点は 1 つ",
      "duration": 1.8,
      "focus": ["東京"],
      "set": { "cities": "[[\\"東京\\",100,60]]" },
      "body": "点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。"
    },
    {
      "step": "西へ広がる",
      "duration": 1.8,
      "focus": ["東京", "ニューヨーク", "パリ"],
      "set": { "cities": "[[\\"東京\\",100,60],[\\"ニューヨーク\\",30,40],[\\"パリ\\",60,30]]" },
      "body": "左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。"
    },
    {
      "step": "南半球まで",
      "duration": 1.8,
      "focus": ["東京", "シドニー", "ニューヨーク", "パリ", "リオ"],
      "set": {
        "cities": "[[\\"東京\\",100,60],[\\"パリ\\",60,30],[\\"ニューヨーク\\",30,40],[\\"シドニー\\",105,75],[\\"リオ\\",40,65]]"
      },
      "body": "下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。"
    }
  ]
}`;

export const sourceYaml__tournamentPodium = `title: "表彰台を中央が 1 位になる並びで見せる"
type: flow

readouts:
  pod: { kind: podium, source: "winners", viewW: 280, viewH: 180, label: "表彰台 (3 本の縦の台)" }

lanes:
  silver: { x: 0, width: 200 }
  gold: { x: 220, width: 220 }
  bronze: { x: 460, width: 200 }

states:
  winners: '[["佐藤","1200 点"],["鈴木","1050 点"],["高橋","980 点"]]'

actors:
  - 🥈 2 位 鈴木: { kind: card, lane: silver, stack: 0, subtitle: "銀 · 中央のすぐ左" }
  - 🥇 1 位 佐藤: { kind: card, lane: gold, stack: 0, subtitle: "金 · 中央で最も高い" }
  - 🥉 3 位 高橋: { kind: card, lane: bronze, stack: 0, subtitle: "銅 · 中央のすぐ右" }

animation:
  - step: "予選の点" 1.8s
    focus: ["🥇 1 位 佐藤"]
    set:
      winners: '[["佐藤","400 点"],["鈴木","380 点"],["高橋","350 点"]]'
    description: "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。"
  - step: "準決勝" 1.8s
    focus: ["🥇 1 位 佐藤", "🥈 2 位 鈴木"]
    set:
      winners: '[["佐藤","800 点"],["鈴木","700 点"],["高橋","640 点"]]'
    description: "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。"
  - step: "決勝の点" 1.8s
    focus: ["🥇 1 位 佐藤", "🥈 2 位 鈴木", "🥉 3 位 高橋"]
    set:
      winners: '[["佐藤","1200 点"],["鈴木","1050 点"],["高橋","980 点"]]'
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
      "label": "表彰台 (3 本の縦の台)"
    }
  ],
  "lanes": {
    "silver": { "x": 0, "width": 200 },
    "gold": { "x": 220, "width": 220 },
    "bronze": { "x": 460, "width": 200 }
  },
  "actors": [
    {
      "name": "🥈 2 位 鈴木",
      "kind": "card",
      "lane": "silver",
      "stack": 0,
      "subtitle": "銀 · 中央のすぐ左"
    },
    {
      "name": "🥇 1 位 佐藤",
      "kind": "card",
      "lane": "gold",
      "stack": 0,
      "subtitle": "金 · 中央で最も高い"
    },
    {
      "name": "🥉 3 位 高橋",
      "kind": "card",
      "lane": "bronze",
      "stack": 0,
      "subtitle": "銅 · 中央のすぐ右"
    }
  ],
  "flow": [],
  "states": { "winners": "[[\\"佐藤\\",\\"1200 点\\"],[\\"鈴木\\",\\"1050 点\\"],[\\"高橋\\",\\"980 点\\"]]" },
  "animation": [
    {
      "step": "予選の点",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤"],
      "set": { "winners": "[[\\"佐藤\\",\\"400 点\\"],[\\"鈴木\\",\\"380 点\\"],[\\"高橋\\",\\"350 点\\"]]" },
      "body": "予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。"
    },
    {
      "step": "準決勝",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤", "🥈 2 位 鈴木"],
      "set": { "winners": "[[\\"佐藤\\",\\"800 点\\"],[\\"鈴木\\",\\"700 点\\"],[\\"高橋\\",\\"640 点\\"]]" },
      "body": "点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。"
    },
    {
      "step": "決勝の点",
      "duration": 1.8,
      "focus": ["🥇 1 位 佐藤", "🥈 2 位 鈴木", "🥉 3 位 高橋"],
      "set": { "winners": "[[\\"佐藤\\",\\"1200 点\\"],[\\"鈴木\\",\\"1050 点\\"],[\\"高橋\\",\\"980 点\\"]]" },
      "body": "最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。"
    }
  ]
}`;

export const sourceYaml__featurePoll = `title: "投票結果を 1 位とその他に分ける"
type: flow

readouts:
  pb: { kind: poll-bar, source: "options", color: "#a08870", colorWinner: "#2563eb", label: "投票の結果 (合計)" }

lanes:
  winner: { x: 0, width: 220 }
  runners: { x: 300, width: 220 }

states:
  options: '[["暗い配色",42],["速い検索",28],["使いやすい API",18],["見やすい画面",12]]'

actors:
  - ★ 暗い配色: { kind: card, lane: winner, stack: 0, subtitle: "票が最も多い案" }
  - 検索: { kind: card, lane: runners, stack: 0, subtitle: "次に多い案" }
  - 使いやすい API: { kind: card, lane: runners, stack: 1, subtitle: "中ほどの案" }
  - 見やすい画面: { kind: card, lane: runners, stack: 2, subtitle: "最も少ない案" }

animation:
  - step: "票が割れる" 1.8s
    focus: ["★ 暗い配色"]
    set:
      options: '[["暗い配色",7],["速い検索",6],["使いやすい API",5],["見やすい画面",4]]'
    description: "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。"
  - step: "1 案に集まる" 1.8s
    focus: ["★ 暗い配色", "検索"]
    set:
      options: '[["暗い配色",40],["速い検索",13],["使いやすい API",8],["見やすい画面",5]]'
    description: "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。"
  - step: "締め切り" 1.8s
    focus: ["★ 暗い配色", "検索", "使いやすい API", "見やすい画面"]
    set:
      options: '[["暗い配色",42],["速い検索",28],["使いやすい API",18],["見やすい画面",12]]'
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
      "label": "投票の結果 (合計)"
    }
  ],
  "lanes": {
    "winner": { "x": 0, "width": 220 },
    "runners": { "x": 300, "width": 220 }
  },
  "actors": [
    {
      "name": "★ 暗い配色",
      "kind": "card",
      "lane": "winner",
      "stack": 0,
      "subtitle": "票が最も多い案"
    },
    { "name": "検索", "kind": "card", "lane": "runners", "stack": 0, "subtitle": "次に多い案" },
    { "name": "使いやすい API", "kind": "card", "lane": "runners", "stack": 1, "subtitle": "中ほどの案" },
    { "name": "見やすい画面", "kind": "card", "lane": "runners", "stack": 2, "subtitle": "最も少ない案" }
  ],
  "flow": [],
  "states": {
    "options": "[[\\"暗い配色\\",42],[\\"速い検索\\",28],[\\"使いやすい API\\",18],[\\"見やすい画面\\",12]]"
  },
  "animation": [
    {
      "step": "票が割れる",
      "duration": 1.8,
      "focus": ["★ 暗い配色"],
      "set": {
        "options": "[[\\"暗い配色\\",7],[\\"速い検索\\",6],[\\"使いやすい API\\",5],[\\"見やすい画面\\",4]]"
      },
      "body": "4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。"
    },
    {
      "step": "1 案に集まる",
      "duration": 1.8,
      "focus": ["★ 暗い配色", "検索"],
      "set": {
        "options": "[[\\"暗い配色\\",40],[\\"速い検索\\",13],[\\"使いやすい API\\",8],[\\"見やすい画面\\",5]]"
      },
      "body": "先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。"
    },
    {
      "step": "締め切り",
      "duration": 1.8,
      "focus": ["★ 暗い配色", "検索", "使いやすい API", "見やすい画面"],
      "set": {
        "options": "[[\\"暗い配色\\",42],[\\"速い検索\\",28],[\\"使いやすい API\\",18],[\\"見やすい画面\\",12]]"
      },
      "body": "他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。"
    }
  ]
}`;

export const sourceYaml__reviewerStack = `title: "レビュアー 7 人を 5 人表示と残りで見せる"
type: flow

readouts:
  us: { kind: user-stack, source: "reviewers", max: 5, size: 36, label: "確かめる人 (重ねた丸)" }

lanes:
  displayed: { x: 0, width: 340 }
  overflow: { x: 380, width: 200 }

states:
  reviewers: '["佐藤","鈴木 健","高橋","田中 翔","伊藤","渡辺 蓮","山本 光"]'

actors:
  - 佐藤: { kind: card, lane: displayed, stack: 0, subtitle: "頭文字 佐 · はじめから居る" }
  - 鈴木 健: { kind: card, lane: displayed, stack: 1, subtitle: "頭文字 鈴健 · はじめから居る" }
  - 高橋: { kind: card, lane: displayed, stack: 2, subtitle: "頭文字 高 · はじめから居る" }
  - 田中 翔: { kind: card, lane: displayed, stack: 3, subtitle: "頭文字 田翔 · 途中で加わる" }
  - 伊藤: { kind: card, lane: displayed, stack: 4, subtitle: "頭文字 伊 · 上限ちょうど" }
  - 渡辺 蓮: { kind: card, lane: overflow, stack: 0, subtitle: "頭文字 渡蓮 · 上限を超える" }
  - 山本 光: { kind: card, lane: overflow, stack: 1, subtitle: "頭文字 山光 · 上限を超える" }

animation:
  - step: "依頼した直後" 1.8s
    focus: ["佐藤", "鈴木 健", "高橋"]
    set:
      reviewers: '["佐藤","鈴木 健","高橋"]'
    description: "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。"
  - step: "上限ちょうど" 1.8s
    focus: ["佐藤", "鈴木 健", "高橋", "田中 翔", "伊藤"]
    set:
      reviewers: '["佐藤","鈴木 健","高橋","田中 翔","伊藤"]'
    description: "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。"
  - step: "上限を超える" 1.8s
    focus: ["佐藤", "鈴木 健", "高橋", "田中 翔", "伊藤", "渡辺 蓮", "山本 光"]
    set:
      reviewers: '["佐藤","鈴木 健","高橋","田中 翔","伊藤","渡辺 蓮","山本 光"]'
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
      "label": "確かめる人 (重ねた丸)"
    }
  ],
  "lanes": {
    "displayed": { "x": 0, "width": 340 },
    "overflow": { "x": 380, "width": 200 }
  },
  "actors": [
    {
      "name": "佐藤",
      "kind": "card",
      "lane": "displayed",
      "stack": 0,
      "subtitle": "頭文字 佐 · はじめから居る"
    },
    {
      "name": "鈴木 健",
      "kind": "card",
      "lane": "displayed",
      "stack": 1,
      "subtitle": "頭文字 鈴健 · はじめから居る"
    },
    {
      "name": "高橋",
      "kind": "card",
      "lane": "displayed",
      "stack": 2,
      "subtitle": "頭文字 高 · はじめから居る"
    },
    {
      "name": "田中 翔",
      "kind": "card",
      "lane": "displayed",
      "stack": 3,
      "subtitle": "頭文字 田翔 · 途中で加わる"
    },
    {
      "name": "伊藤",
      "kind": "card",
      "lane": "displayed",
      "stack": 4,
      "subtitle": "頭文字 伊 · 上限ちょうど"
    },
    {
      "name": "渡辺 蓮",
      "kind": "card",
      "lane": "overflow",
      "stack": 0,
      "subtitle": "頭文字 渡蓮 · 上限を超える"
    },
    {
      "name": "山本 光",
      "kind": "card",
      "lane": "overflow",
      "stack": 1,
      "subtitle": "頭文字 山光 · 上限を超える"
    }
  ],
  "flow": [],
  "states": {
    "reviewers": "[\\"佐藤\\",\\"鈴木 健\\",\\"高橋\\",\\"田中 翔\\",\\"伊藤\\",\\"渡辺 蓮\\",\\"山本 光\\"]"
  },
  "animation": [
    {
      "step": "依頼した直後",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木 健", "高橋"],
      "set": { "reviewers": "[\\"佐藤\\",\\"鈴木 健\\",\\"高橋\\"]" },
      "body": "3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。"
    },
    {
      "step": "上限ちょうど",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木 健", "高橋", "田中 翔", "伊藤"],
      "set": { "reviewers": "[\\"佐藤\\",\\"鈴木 健\\",\\"高橋\\",\\"田中 翔\\",\\"伊藤\\"]" },
      "body": "表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。"
    },
    {
      "step": "上限を超える",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木 健", "高橋", "田中 翔", "伊藤", "渡辺 蓮", "山本 光"],
      "set": {
        "reviewers": "[\\"佐藤\\",\\"鈴木 健\\",\\"高橋\\",\\"田中 翔\\",\\"伊藤\\",\\"渡辺 蓮\\",\\"山本 光\\"]"
      },
      "body": "上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。"
    }
  ]
}`;

export const sourceYaml__gitCommitList = `title: "5 つのコミットを種別ごとに並べる"
type: flow

readouts:
  cl: { kind: commit-list, source: "commits", max: 5, color: "#2563eb", label: "変更の履歴" }

lanes:
  col1: { x: 0, width: 350 }
  col2: { x: 390, width: 360 }
  col3: { x: 790, width: 350 }

states:
  commits: '[["7214093","機能: 流れの幅を描く部品を足す","佐藤"],["5830617","修正: 円い計器の角度のずれを直す","鈴木"],["9046251","文書: 使い方の説明を書き直す","高橋"],["1378460","整理: 部品の振り分けを切り出す","田中"],["6602938","テスト: 組み立ての連なりを確かめる","伊藤"]]'

actors:
  - 機能: { kind: card, lane: col1, stack: 0, subtitle: "機能を足す (佐藤)", posW: 280 }
  - 修正: { kind: card, lane: col2, stack: 0, subtitle: "不具合を直す (鈴木)", posW: 310 }
  - 文書: { kind: card, lane: col3, stack: 0, subtitle: "説明を書く (高橋)", posW: 300 }
  - 整理: { kind: card, lane: col1, stack: 1, subtitle: "構造を整える (田中)", posW: 300 }
  - テスト: { kind: card, lane: col2, stack: 1, subtitle: "検査を足す (伊藤)", posW: 270 }

animation:
  - step: "1 件目" 1.8s
    focus: ["機能"]
    set:
      commits: '[["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]'
    description: "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。"
  - step: "積み上がる" 1.8s
    focus: ["機能", "修正", "文書"]
    set:
      commits: '[["9046251","文書: 使い方の説明を書き直す","高橋"],["5830617","修正: 円い計器の角度のずれを直す","鈴木"],["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]'
    description: "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。"
  - step: "表示の上限" 1.8s
    focus: ["機能", "修正", "文書", "整理", "テスト"]
    set:
      commits: '[["6602938","テスト: 組み立ての連なりを確かめる","伊藤"],["1378460","整理: 部品の振り分けを切り出す","田中"],["9046251","文書: 使い方の説明を書き直す","高橋"],["5830617","修正: 円い計器の角度のずれを直す","鈴木"],["7214093","機能: 流れの幅を描く部品を足す","佐藤"]]'
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
      "label": "変更の履歴"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 350 },
    "col2": { "x": 390, "width": 360 },
    "col3": { "x": 790, "width": 350 }
  },
  "actors": [
    {
      "name": "機能",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "機能を足す (佐藤)",
      "posW": 280
    },
    {
      "name": "修正",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "不具合を直す (鈴木)",
      "posW": 310
    },
    {
      "name": "文書",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "説明を書く (高橋)",
      "posW": 300
    },
    {
      "name": "整理",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "構造を整える (田中)",
      "posW": 300
    },
    {
      "name": "テスト",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "検査を足す (伊藤)",
      "posW": 270
    }
  ],
  "flow": [],
  "states": {
    "commits": "[[\\"7214093\\",\\"機能: 流れの幅を描く部品を足す\\",\\"佐藤\\"],[\\"5830617\\",\\"修正: 円い計器の角度のずれを直す\\",\\"鈴木\\"],[\\"9046251\\",\\"文書: 使い方の説明を書き直す\\",\\"高橋\\"],[\\"1378460\\",\\"整理: 部品の振り分けを切り出す\\",\\"田中\\"],[\\"6602938\\",\\"テスト: 組み立ての連なりを確かめる\\",\\"伊藤\\"]]"
  },
  "animation": [
    {
      "step": "1 件目",
      "duration": 1.8,
      "focus": ["機能"],
      "set": { "commits": "[[\\"7214093\\",\\"機能: 流れの幅を描く部品を足す\\",\\"佐藤\\"]]" },
      "body": "履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。"
    },
    {
      "step": "積み上がる",
      "duration": 1.8,
      "focus": ["機能", "修正", "文書"],
      "set": {
        "commits": "[[\\"9046251\\",\\"文書: 使い方の説明を書き直す\\",\\"高橋\\"],[\\"5830617\\",\\"修正: 円い計器の角度のずれを直す\\",\\"鈴木\\"],[\\"7214093\\",\\"機能: 流れの幅を描く部品を足す\\",\\"佐藤\\"]]"
      },
      "body": "行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。"
    },
    {
      "step": "表示の上限",
      "duration": 1.8,
      "focus": ["機能", "修正", "文書", "整理", "テスト"],
      "set": {
        "commits": "[[\\"6602938\\",\\"テスト: 組み立ての連なりを確かめる\\",\\"伊藤\\"],[\\"1378460\\",\\"整理: 部品の振り分けを切り出す\\",\\"田中\\"],[\\"9046251\\",\\"文書: 使い方の説明を書き直す\\",\\"高橋\\"],[\\"5830617\\",\\"修正: 円い計器の角度のずれを直す\\",\\"鈴木\\"],[\\"7214093\\",\\"機能: 流れの幅を描く部品を足す\\",\\"佐藤\\"]]"
      },
      "body": "表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。"
    }
  ]
}`;

export const sourceYaml__serverEventLog = `title: "サーバのログ 5 件を重要度で分ける"
type: flow

readouts:
  el: { kind: event-log, source: "events", max: 10, label: "出来事 (時系列)" }

lanes:
  info: { x: 0, width: 160 }
  debug: { x: 200, width: 160 }
  warn: { x: 400, width: 160 }
  error: { x: 600, width: 160 }

states:
  events: '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"],["10:24:58","warn","CPU の使用率が高い (82%)"],["10:25:34","error","DB の接続が 5 秒で時間切れ"],["10:26:01","info","つなぎ直しに成功した"]]'

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
      events: '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"]]'
    description: "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。"
  - step: "異常が出る" 1.8s
    focus: ["ℹ 起動", "· 設定", "⚠ 負荷", "✕ 切断"]
    set:
      events: '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"],["10:24:58","warn","CPU の使用率が高い (82%)"],["10:25:34","error","DB の接続が 5 秒で時間切れ"]]'
    description: "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。"
  - step: "復帰する" 1.8s
    focus: ["ℹ 起動", "ℹ 復帰", "· 設定", "⚠ 負荷", "✕ 切断"]
    set:
      events: '[["10:23:45","info","3000 番で待ち受けを始めた"],["10:24:12","debug","設定を読み込んだ"],["10:24:58","warn","CPU の使用率が高い (82%)"],["10:25:34","error","DB の接続が 5 秒で時間切れ"],["10:26:01","info","つなぎ直しに成功した"]]'
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
      "label": "出来事 (時系列)"
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
    "events": "[[\\"10:23:45\\",\\"info\\",\\"3000 番で待ち受けを始めた\\"],[\\"10:24:12\\",\\"debug\\",\\"設定を読み込んだ\\"],[\\"10:24:58\\",\\"warn\\",\\"CPU の使用率が高い (82%)\\"],[\\"10:25:34\\",\\"error\\",\\"DB の接続が 5 秒で時間切れ\\"],[\\"10:26:01\\",\\"info\\",\\"つなぎ直しに成功した\\"]]"
  },
  "animation": [
    {
      "step": "平常の記録",
      "duration": 1.8,
      "focus": ["ℹ 起動", "· 設定"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"3000 番で待ち受けを始めた\\"],[\\"10:24:12\\",\\"debug\\",\\"設定を読み込んだ\\"]]"
      },
      "body": "知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。"
    },
    {
      "step": "異常が出る",
      "duration": 1.8,
      "focus": ["ℹ 起動", "· 設定", "⚠ 負荷", "✕ 切断"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"3000 番で待ち受けを始めた\\"],[\\"10:24:12\\",\\"debug\\",\\"設定を読み込んだ\\"],[\\"10:24:58\\",\\"warn\\",\\"CPU の使用率が高い (82%)\\"],[\\"10:25:34\\",\\"error\\",\\"DB の接続が 5 秒で時間切れ\\"]]"
      },
      "body": "注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。"
    },
    {
      "step": "復帰する",
      "duration": 1.8,
      "focus": ["ℹ 起動", "ℹ 復帰", "· 設定", "⚠ 負荷", "✕ 切断"],
      "set": {
        "events": "[[\\"10:23:45\\",\\"info\\",\\"3000 番で待ち受けを始めた\\"],[\\"10:24:12\\",\\"debug\\",\\"設定を読み込んだ\\"],[\\"10:24:58\\",\\"warn\\",\\"CPU の使用率が高い (82%)\\"],[\\"10:25:34\\",\\"error\\",\\"DB の接続が 5 秒で時間切れ\\"],[\\"10:26:01\\",\\"info\\",\\"つなぎ直しに成功した\\"]]"
      },
      "body": "最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。"
    }
  ]
}`;

export const sourceYaml__searchResults = `title: "検索結果を文書 / ツールに分ける"
type: flow

readouts:
  sr: { kind: search-result, source: "hits", max: 5, color: "#2563eb", label: "検索結果 (題と抜粋と所在)" }

lanes:
  docs: { x: 0, width: 340 }
  tools: { x: 380, width: 300 }

states:
  hits: '[["Rust の練習場","Rust のコードをその場で書いて動かせる場所","練習場 › Rust"],["ウェブ技術の手引き","ウェブの技術をまとめた解説","手引き › ウェブ技術"],["TypeScript の手引き","TypeScript を学ぶための案内","手引き › TypeScript"],["React の説明書","React の使い方をまとめた資料","説明書 › React"],["Vite の案内","画面を組み立てる道具の案内","案内 › Vite"]]'

actors:
  - ウェブ技術の手引き: { kind: card, lane: docs, stack: 0, subtitle: "手引き › ウェブ技術" }
  - TypeScript: { kind: card, lane: docs, stack: 1, subtitle: "手引き › TypeScript" }
  - React の説明書: { kind: card, lane: docs, stack: 2, subtitle: "説明書 › React" }
  - Vite の案内: { kind: card, lane: docs, stack: 3, subtitle: "案内 › Vite" }
  - Rust: { kind: card, lane: tools, stack: 0, subtitle: "練習場 › Rust (その場で動かす)" }

animation:
  - step: "広い語で引く" 1.8s
    focus: ["ウェブ技術の手引き", "TypeScript", "React の説明書", "Vite の案内", "Rust"]
    set:
      hits: '[["Rust の練習場","Rust のコードをその場で書いて動かせる場所","練習場 › Rust"],["ウェブ技術の手引き","ウェブの技術をまとめた解説","手引き › ウェブ技術"],["TypeScript の手引き","TypeScript を学ぶための案内","手引き › TypeScript"],["React の説明書","React の使い方をまとめた資料","説明書 › React"],["Vite の案内","画面を組み立てる道具の案内","案内 › Vite"]]'
    description: "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。"
  - step: "語を足す" 1.8s
    focus: ["ウェブ技術の手引き", "TypeScript", "React の説明書"]
    set:
      hits: '[["ウェブ技術の手引き","ウェブの技術をまとめた解説","手引き › ウェブ技術"],["TypeScript の手引き","TypeScript を学ぶための案内","手引き › TypeScript"],["React の説明書","React の使い方をまとめた資料","説明書 › React"]]'
    description: "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。"
  - step: "絞り切る" 1.8s
    focus: ["Rust"]
    set:
      hits: '[["Rust の練習場","Rust のコードをその場で書いて動かせる場所","練習場 › Rust"]]'
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
      "label": "検索結果 (題と抜粋と所在)"
    }
  ],
  "lanes": {
    "docs": { "x": 0, "width": 340 },
    "tools": { "x": 380, "width": 300 }
  },
  "actors": [
    {
      "name": "ウェブ技術の手引き",
      "kind": "card",
      "lane": "docs",
      "stack": 0,
      "subtitle": "手引き › ウェブ技術"
    },
    {
      "name": "TypeScript",
      "kind": "card",
      "lane": "docs",
      "stack": 1,
      "subtitle": "手引き › TypeScript"
    },
    {
      "name": "React の説明書",
      "kind": "card",
      "lane": "docs",
      "stack": 2,
      "subtitle": "説明書 › React"
    },
    {
      "name": "Vite の案内",
      "kind": "card",
      "lane": "docs",
      "stack": 3,
      "subtitle": "案内 › Vite"
    },
    {
      "name": "Rust",
      "kind": "card",
      "lane": "tools",
      "stack": 0,
      "subtitle": "練習場 › Rust (その場で動かす)"
    }
  ],
  "flow": [],
  "states": {
    "hits": "[[\\"Rust の練習場\\",\\"Rust のコードをその場で書いて動かせる場所\\",\\"練習場 › Rust\\"],[\\"ウェブ技術の手引き\\",\\"ウェブの技術をまとめた解説\\",\\"手引き › ウェブ技術\\"],[\\"TypeScript の手引き\\",\\"TypeScript を学ぶための案内\\",\\"手引き › TypeScript\\"],[\\"React の説明書\\",\\"React の使い方をまとめた資料\\",\\"説明書 › React\\"],[\\"Vite の案内\\",\\"画面を組み立てる道具の案内\\",\\"案内 › Vite\\"]]"
  },
  "animation": [
    {
      "step": "広い語で引く",
      "duration": 1.8,
      "focus": ["ウェブ技術の手引き", "TypeScript", "React の説明書", "Vite の案内", "Rust"],
      "set": {
        "hits": "[[\\"Rust の練習場\\",\\"Rust のコードをその場で書いて動かせる場所\\",\\"練習場 › Rust\\"],[\\"ウェブ技術の手引き\\",\\"ウェブの技術をまとめた解説\\",\\"手引き › ウェブ技術\\"],[\\"TypeScript の手引き\\",\\"TypeScript を学ぶための案内\\",\\"手引き › TypeScript\\"],[\\"React の説明書\\",\\"React の使い方をまとめた資料\\",\\"説明書 › React\\"],[\\"Vite の案内\\",\\"画面を組み立てる道具の案内\\",\\"案内 › Vite\\"]]"
      },
      "body": "当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。"
    },
    {
      "step": "語を足す",
      "duration": 1.8,
      "focus": ["ウェブ技術の手引き", "TypeScript", "React の説明書"],
      "set": {
        "hits": "[[\\"ウェブ技術の手引き\\",\\"ウェブの技術をまとめた解説\\",\\"手引き › ウェブ技術\\"],[\\"TypeScript の手引き\\",\\"TypeScript を学ぶための案内\\",\\"手引き › TypeScript\\"],[\\"React の説明書\\",\\"React の使い方をまとめた資料\\",\\"説明書 › React\\"]]"
      },
      "body": "当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。"
    },
    {
      "step": "絞り切る",
      "duration": 1.8,
      "focus": ["Rust"],
      "set": {
        "hits": "[[\\"Rust の練習場\\",\\"Rust のコードをその場で書いて動かせる場所\\",\\"練習場 › Rust\\"]]"
      },
      "body": "当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。"
    }
  ]
}`;

export const sourceYaml__yearRoadmap = `title: "年間の計画を四半期ごとに並べる"
type: flow

readouts:
  rm: { kind: roadmap, source: "plan", viewW: 400, viewH: 200, label: "年間の計画 (4 列の一覧)" }

lanes:
  q1: { x: 0, width: 150 }
  q2: { x: 170, width: 150 }
  q3: { x: 340, width: 150 }
  q4: { x: 510, width: 150 }

states:
  plan: '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",["試験公開","機能 B","意見の取り込み"]],["Q3",["基盤の拡張","企業との契約"]],["Q4",["正式公開","資金調達"]]]'

actors:
  - Q1 (1〜3 月): { kind: card, lane: q1, stack: 0, subtitle: "設計と試作" }
  - 設計の決まり: { kind: card, lane: q1, stack: 1, subtitle: "土台" }
  - 試作の機能 A: { kind: card, lane: q1, stack: 2, subtitle: "試作" }
  - Q2 (4〜6 月): { kind: card, lane: q2, stack: 0, subtitle: "試験公開と成長" }
  - 試験公開: { kind: card, lane: q2, stack: 1, subtitle: "だれでも試せる" }
  - 機能 B: { kind: card, lane: q2, stack: 2, subtitle: "試験公開の範囲" }
  - Q3 (7〜9 月): { kind: card, lane: q3, stack: 0, subtitle: "拡張と企業向け" }
  - 基盤の拡張: { kind: card, lane: q3, stack: 1, subtitle: "受けられる量" }
  - 企業との契約: { kind: card, lane: q3, stack: 2, subtitle: "企業向けの売上" }
  - Q4 (10〜12 月): { kind: card, lane: q4, stack: 0, subtitle: "正式公開と資金" }
  - 正式公開: { kind: card, lane: q4, stack: 1, subtitle: "だれでも使える" }
  - 資金調達: { kind: card, lane: q4, stack: 2, subtitle: "伸ばすための資金" }

flow:
  - Q1 (1〜3 月) -> Q2 (4〜6 月): "引き継ぐ" (info)
  - Q2 (4〜6 月) -> Q3 (7〜9 月): "広げる" (accent)
  - Q3 (7〜9 月) -> Q4 (10〜12 月): "公開する" (success)

animation:
  - step: "手前だけ決まる" 1.8s
    focus: ["Q1 (1〜3 月)", "設計の決まり", "試作の機能 A"]
    set:
      plan: '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",[]],["Q3",[]],["Q4",[]]]'
    description: "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。"
  - step: "半年先まで" 1.8s
    focus: ["Q1 (1〜3 月)", "Q2 (4〜6 月)", "試験公開", "機能 B"]
    set:
      plan: '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",["試験公開","機能 B","意見の取り込み"]],["Q3",[]],["Q4",[]]]'
    description: "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。"
  - step: "年内が揃う" 1.8s
    focus: ["Q1 (1〜3 月)", "Q2 (4〜6 月)", "Q3 (7〜9 月)", "Q4 (10〜12 月)"]
    set:
      plan: '[["Q1",["設計の決まり","試作の機能 A"]],["Q2",["試験公開","機能 B","意見の取り込み"]],["Q3",["基盤の拡張","企業との契約"]],["Q4",["正式公開","資金調達"]]]'
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
      "label": "年間の計画 (4 列の一覧)"
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
      "name": "Q1 (1〜3 月)",
      "kind": "card",
      "lane": "q1",
      "stack": 0,
      "subtitle": "設計と試作"
    },
    { "name": "設計の決まり", "kind": "card", "lane": "q1", "stack": 1, "subtitle": "土台" },
    { "name": "試作の機能 A", "kind": "card", "lane": "q1", "stack": 2, "subtitle": "試作" },
    {
      "name": "Q2 (4〜6 月)",
      "kind": "card",
      "lane": "q2",
      "stack": 0,
      "subtitle": "試験公開と成長"
    },
    {
      "name": "試験公開",
      "kind": "card",
      "lane": "q2",
      "stack": 1,
      "subtitle": "だれでも試せる"
    },
    { "name": "機能 B", "kind": "card", "lane": "q2", "stack": 2, "subtitle": "試験公開の範囲" },
    {
      "name": "Q3 (7〜9 月)",
      "kind": "card",
      "lane": "q3",
      "stack": 0,
      "subtitle": "拡張と企業向け"
    },
    { "name": "基盤の拡張", "kind": "card", "lane": "q3", "stack": 1, "subtitle": "受けられる量" },
    { "name": "企業との契約", "kind": "card", "lane": "q3", "stack": 2, "subtitle": "企業向けの売上" },
    {
      "name": "Q4 (10〜12 月)",
      "kind": "card",
      "lane": "q4",
      "stack": 0,
      "subtitle": "正式公開と資金"
    },
    {
      "name": "正式公開",
      "kind": "card",
      "lane": "q4",
      "stack": 1,
      "subtitle": "だれでも使える"
    },
    {
      "name": "資金調達",
      "kind": "card",
      "lane": "q4",
      "stack": 2,
      "subtitle": "伸ばすための資金"
    }
  ],
  "flow": [
    { "from": "Q1 (1〜3 月)", "to": "Q2 (4〜6 月)", "label": "引き継ぐ", "tone": "info" },
    { "from": "Q2 (4〜6 月)", "to": "Q3 (7〜9 月)", "label": "広げる", "tone": "accent" },
    { "from": "Q3 (7〜9 月)", "to": "Q4 (10〜12 月)", "label": "公開する", "tone": "success" }
  ],
  "states": {
    "plan": "[[\\"Q1\\",[\\"設計の決まり\\",\\"試作の機能 A\\"]],[\\"Q2\\",[\\"試験公開\\",\\"機能 B\\",\\"意見の取り込み\\"]],[\\"Q3\\",[\\"基盤の拡張\\",\\"企業との契約\\"]],[\\"Q4\\",[\\"正式公開\\",\\"資金調達\\"]]]"
  },
  "animation": [
    {
      "step": "手前だけ決まる",
      "duration": 1.8,
      "focus": ["Q1 (1〜3 月)", "設計の決まり", "試作の機能 A"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"設計の決まり\\",\\"試作の機能 A\\"]],[\\"Q2\\",[]],[\\"Q3\\",[]],[\\"Q4\\",[]]]"
      },
      "body": "最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。"
    },
    {
      "step": "半年先まで",
      "duration": 1.8,
      "focus": ["Q1 (1〜3 月)", "Q2 (4〜6 月)", "試験公開", "機能 B"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"設計の決まり\\",\\"試作の機能 A\\"]],[\\"Q2\\",[\\"試験公開\\",\\"機能 B\\",\\"意見の取り込み\\"]],[\\"Q3\\",[]],[\\"Q4\\",[]]]"
      },
      "body": "2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。"
    },
    {
      "step": "年内が揃う",
      "duration": 1.8,
      "focus": ["Q1 (1〜3 月)", "Q2 (4〜6 月)", "Q3 (7〜9 月)", "Q4 (10〜12 月)"],
      "set": {
        "plan": "[[\\"Q1\\",[\\"設計の決まり\\",\\"試作の機能 A\\"]],[\\"Q2\\",[\\"試験公開\\",\\"機能 B\\",\\"意見の取り込み\\"]],[\\"Q3\\",[\\"基盤の拡張\\",\\"企業との契約\\"]],[\\"Q4\\",[\\"正式公開\\",\\"資金調達\\"]]]"
      },
      "body": "4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。"
    }
  ]
}`;

export const sourceYaml__weekWeather = `title: "5 日間の天気を晴 / 曇雨 / 雷で分ける"
type: flow

readouts:
  wf: { kind: weather-forecast, source: "forecast", label: "1 週間 (5 日分の予報)" }

lanes:
  sunny: { x: 0, width: 220 }
  cloudy: { x: 260, width: 220 }
  thunder: { x: 520, width: 200 }

states:
  forecast: '[["月曜","☀",24,18],["火曜","☁",22,17],["水曜","☂",19,15],["木曜","⚡",17,13],["金曜","☀",25,19]]'

actors:
  - ☀ 月曜: { kind: card, lane: sunny, stack: 0, subtitle: "晴れ · 週の始まり" }
  - ☀ 金曜: { kind: card, lane: sunny, stack: 1, subtitle: "晴れ · 週で最も暖かい" }
  - ☁ 火曜: { kind: card, lane: cloudy, stack: 0, subtitle: "曇り · 下り坂の入口" }
  - ☂ 水曜: { kind: card, lane: cloudy, stack: 1, subtitle: "雨 · 気温が下がる" }
  - ⚡ 木曜: { kind: card, lane: thunder, stack: 0, subtitle: "雷 · 週で最も寒い" }

animation:
  - step: "3 日前の予報" 1.8s
    focus: ["☀ 月曜", "☁ 火曜"]
    set:
      forecast: '[["月曜","☀",21,16],["火曜","☁",20,15],["水曜","☂",18,14],["木曜","⚡",16,12],["金曜","☀",22,17]]'
    description: "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。"
  - step: "前日の予報" 1.8s
    focus: ["☀ 月曜", "☁ 火曜", "☂ 水曜"]
    set:
      forecast: '[["月曜","☀",23,17],["火曜","☁",21,16],["水曜","☂",19,15],["木曜","⚡",17,13],["金曜","☀",24,18]]'
    description: "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。"
  - step: "当日の予報" 1.8s
    focus: ["☀ 月曜", "☀ 金曜", "☁ 火曜", "☂ 水曜", "⚡ 木曜"]
    set:
      forecast: '[["月曜","☀",24,18],["火曜","☁",22,17],["水曜","☂",19,15],["木曜","⚡",17,13],["金曜","☀",25,19]]'
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
      "label": "1 週間 (5 日分の予報)"
    }
  ],
  "lanes": {
    "sunny": { "x": 0, "width": 220 },
    "cloudy": { "x": 260, "width": 220 },
    "thunder": { "x": 520, "width": 200 }
  },
  "actors": [
    { "name": "☀ 月曜", "kind": "card", "lane": "sunny", "stack": 0, "subtitle": "晴れ · 週の始まり" },
    { "name": "☀ 金曜", "kind": "card", "lane": "sunny", "stack": 1, "subtitle": "晴れ · 週で最も暖かい" },
    { "name": "☁ 火曜", "kind": "card", "lane": "cloudy", "stack": 0, "subtitle": "曇り · 下り坂の入口" },
    { "name": "☂ 水曜", "kind": "card", "lane": "cloudy", "stack": 1, "subtitle": "雨 · 気温が下がる" },
    { "name": "⚡ 木曜", "kind": "card", "lane": "thunder", "stack": 0, "subtitle": "雷 · 週で最も寒い" }
  ],
  "flow": [],
  "states": {
    "forecast": "[[\\"月曜\\",\\"☀\\",24,18],[\\"火曜\\",\\"☁\\",22,17],[\\"水曜\\",\\"☂\\",19,15],[\\"木曜\\",\\"⚡\\",17,13],[\\"金曜\\",\\"☀\\",25,19]]"
  },
  "animation": [
    {
      "step": "3 日前の予報",
      "duration": 1.8,
      "focus": ["☀ 月曜", "☁ 火曜"],
      "set": {
        "forecast": "[[\\"月曜\\",\\"☀\\",21,16],[\\"火曜\\",\\"☁\\",20,15],[\\"水曜\\",\\"☂\\",18,14],[\\"木曜\\",\\"⚡\\",16,12],[\\"金曜\\",\\"☀\\",22,17]]"
      },
      "body": "5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。"
    },
    {
      "step": "前日の予報",
      "duration": 1.8,
      "focus": ["☀ 月曜", "☁ 火曜", "☂ 水曜"],
      "set": {
        "forecast": "[[\\"月曜\\",\\"☀\\",23,17],[\\"火曜\\",\\"☁\\",21,16],[\\"水曜\\",\\"☂\\",19,15],[\\"木曜\\",\\"⚡\\",17,13],[\\"金曜\\",\\"☀\\",24,18]]"
      },
      "body": "気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。"
    },
    {
      "step": "当日の予報",
      "duration": 1.8,
      "focus": ["☀ 月曜", "☀ 金曜", "☁ 火曜", "☂ 水曜", "⚡ 木曜"],
      "set": {
        "forecast": "[[\\"月曜\\",\\"☀\\",24,18],[\\"火曜\\",\\"☁\\",22,17],[\\"水曜\\",\\"☂\\",19,15],[\\"木曜\\",\\"⚡\\",17,13],[\\"金曜\\",\\"☀\\",25,19]]"
      },
      "body": "最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。"
    }
  ]
}`;

export const sourceYaml__tutorialVideoCards = `title: "解説動画 3 本を言語ごとに分ける"
type: flow

readouts:
  vc: { kind: video-card, source: "videos", max: 5, color: "#ef4444", label: "解説動画 (縮小画像の一覧)" }

lanes:
  rust: { x: 0, width: 220 }
  ts: { x: 260, width: 220 }
  react: { x: 520, width: 220 }

states:
  videos: '[["🎬","はじめての Rust","12:45","2.4 万"],["🎥","TypeScript を深く学ぶ","45:20","8.2 万"],["📺","React の状態の持ち方","18:30","15.6 万"]]'

actors:
  - 🎬 Rust2: { kind: card, lane: rust, stack: 0, subtitle: "最初に出す 1 本", title: "Rust" }
  - TypeScript: { kind: card, lane: ts, stack: 0, subtitle: "最も長い 1 本" }
  - 📺 React2: { kind: card, lane: react, stack: 0, subtitle: "最も見られている 1 本", title: "React" }

animation:
  - step: "1 本だけ出す" 1.8s
    focus: ["🎬 Rust2"]
    set:
      videos: '[["🎬","はじめての Rust","12:45","2.4 万"]]'
    description: "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。"
  - step: "2 本に増える" 1.8s
    focus: ["🎬 Rust2", "TypeScript"]
    set:
      videos: '[["🎬","はじめての Rust","12:45","2.4 万"],["🎥","TypeScript を深く学ぶ","45:20","8.2 万"]]'
    description: "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。"
  - step: "3 本が揃う" 1.8s
    focus: ["🎬 Rust2", "TypeScript", "📺 React2"]
    set:
      videos: '[["🎬","はじめての Rust","12:45","2.4 万"],["🎥","TypeScript を深く学ぶ","45:20","8.2 万"],["📺","React の状態の持ち方","18:30","15.6 万"]]'
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
      "label": "解説動画 (縮小画像の一覧)"
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
      "title": "Rust"
    },
    { "name": "TypeScript", "kind": "card", "lane": "ts", "stack": 0, "subtitle": "最も長い 1 本" },
    {
      "name": "📺 React2",
      "kind": "card",
      "lane": "react",
      "stack": 0,
      "subtitle": "最も見られている 1 本",
      "title": "React"
    }
  ],
  "flow": [],
  "states": {
    "videos": "[[\\"🎬\\",\\"はじめての Rust\\",\\"12:45\\",\\"2.4 万\\"],[\\"🎥\\",\\"TypeScript を深く学ぶ\\",\\"45:20\\",\\"8.2 万\\"],[\\"📺\\",\\"React の状態の持ち方\\",\\"18:30\\",\\"15.6 万\\"]]"
  },
  "animation": [
    {
      "step": "1 本だけ出す",
      "duration": 1.8,
      "focus": ["🎬 Rust2"],
      "set": { "videos": "[[\\"🎬\\",\\"はじめての Rust\\",\\"12:45\\",\\"2.4 万\\"]]" },
      "body": "行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。"
    },
    {
      "step": "2 本に増える",
      "duration": 1.8,
      "focus": ["🎬 Rust2", "TypeScript"],
      "set": {
        "videos": "[[\\"🎬\\",\\"はじめての Rust\\",\\"12:45\\",\\"2.4 万\\"],[\\"🎥\\",\\"TypeScript を深く学ぶ\\",\\"45:20\\",\\"8.2 万\\"]]"
      },
      "body": "行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。"
    },
    {
      "step": "3 本が揃う",
      "duration": 1.8,
      "focus": ["🎬 Rust2", "TypeScript", "📺 React2"],
      "set": {
        "videos": "[[\\"🎬\\",\\"はじめての Rust\\",\\"12:45\\",\\"2.4 万\\"],[\\"🎥\\",\\"TypeScript を深く学ぶ\\",\\"45:20\\",\\"8.2 万\\"],[\\"📺\\",\\"React の状態の持ち方\\",\\"18:30\\",\\"15.6 万\\"]]"
      },
      "body": "3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。"
    }
  ]
}`;

export const sourceYaml__teamAttendanceGrid = `title: "4 人 × 5 日の出欠を並べる"
type: flow

readouts:
  ag: { kind: attendance-grid, source: "attendance", membersSource: "members", color: "#22c55e", label: "出欠 (5 日 × 4 人)" }

lanes:
  alice: { x: 0, width: 330 }
  bob: { x: 350, width: 330 }
  carol: { x: 700, width: 370 }
  dan: { x: 1090, width: 300 }

states:
  attendance: '[["月",true,true,false,true],["火",true,false,true,true],["水",true,true,true,true],["木",false,true,true,true],["金",true,true,false,true]]'
  members: '["佐藤","鈴木","高橋","田中"]'

actors:
  - Alice2: { kind: card, lane: alice, stack: 0, subtitle: "1 列目の人", posW: 280, title: "佐藤" }
  - Bob2: { kind: card, lane: bob, stack: 0, subtitle: "2 列目の人", posW: 280, title: "鈴木" }
  - Carol2: { kind: card, lane: carol, stack: 0, subtitle: "3 列目の人", posW: 320, title: "高橋" }
  - Dan2: { kind: card, lane: dan, stack: 0, subtitle: "4 列目の人 (欠けが無い)", posW: 250, title: "田中" }

animation:
  - step: "週の初め" 1.8s
    focus: ["Alice2"]
    set:
      attendance: '[["月",true,true,false,true]]'
    description: "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。"
  - step: "週の半ば" 1.8s
    focus: ["Alice2", "Bob2"]
    set:
      attendance: '[["月",true,true,false,true],["火",true,false,true,true],["水",true,true,true,true]]'
    description: "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。"
  - step: "週の終わり" 1.8s
    focus: ["Alice2", "Bob2", "Carol2", "Dan2"]
    set:
      attendance: '[["月",true,true,false,true],["火",true,false,true,true],["水",true,true,true,true],["木",false,true,true,true],["金",true,true,false,true]]'
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
      "label": "出欠 (5 日 × 4 人)"
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
      "title": "佐藤"
    },
    {
      "name": "Bob2",
      "kind": "card",
      "lane": "bob",
      "stack": 0,
      "subtitle": "2 列目の人",
      "posW": 280,
      "title": "鈴木"
    },
    {
      "name": "Carol2",
      "kind": "card",
      "lane": "carol",
      "stack": 0,
      "subtitle": "3 列目の人",
      "posW": 320,
      "title": "高橋"
    },
    {
      "name": "Dan2",
      "kind": "card",
      "lane": "dan",
      "stack": 0,
      "subtitle": "4 列目の人 (欠けが無い)",
      "posW": 250,
      "title": "田中"
    }
  ],
  "flow": [],
  "states": {
    "attendance": "[[\\"月\\",true,true,false,true],[\\"火\\",true,false,true,true],[\\"水\\",true,true,true,true],[\\"木\\",false,true,true,true],[\\"金\\",true,true,false,true]]",
    "members": "[\\"佐藤\\",\\"鈴木\\",\\"高橋\\",\\"田中\\"]"
  },
  "animation": [
    {
      "step": "週の初め",
      "duration": 1.8,
      "focus": ["Alice2"],
      "set": { "attendance": "[[\\"月\\",true,true,false,true]]" },
      "body": "1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。"
    },
    {
      "step": "週の半ば",
      "duration": 1.8,
      "focus": ["Alice2", "Bob2"],
      "set": {
        "attendance": "[[\\"月\\",true,true,false,true],[\\"火\\",true,false,true,true],[\\"水\\",true,true,true,true]]"
      },
      "body": "行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。"
    },
    {
      "step": "週の終わり",
      "duration": 1.8,
      "focus": ["Alice2", "Bob2", "Carol2", "Dan2"],
      "set": {
        "attendance": "[[\\"月\\",true,true,false,true],[\\"火\\",true,false,true,true],[\\"水\\",true,true,true,true],[\\"木\\",false,true,true,true],[\\"金\\",true,true,false,true]]"
      },
      "body": "5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。"
    }
  ]
}`;

export const sourceYaml__globalTimezoneClock = `title: "4 都市の現地時刻を並べる"
type: flow

readouts:
  tc: { kind: timezone-clock, source: "clocks", color: "#2563eb", label: "都市 (4 列の升目)" }

lanes:
  tokyo: { x: 0, width: 230 }
  london: { x: 250, width: 230 }
  nyc: { x: 500, width: 230 }
  sydney: { x: 750, width: 240 }

states:
  clocks: '[["東京",9,"22:30"],["ロンドン",0,"13:30"],["ニューヨーク",-5,"08:30"],["シドニー",11,"00:30"]]'

actors:
  - Tokyo2: { kind: card, lane: tokyo, stack: 0, subtitle: "時差が進んでいる側の都市", posW: 180, title: "東京" }
  - London2: { kind: card, lane: london, stack: 0, subtitle: "時差の基準となる都市", posW: 180, title: "ロンドン" }
  - NYC2: { kind: card, lane: nyc, stack: 0, subtitle: "時差が最も遅れている都市", posW: 200, title: "ニューヨーク" }
  - Sydney2: { kind: card, lane: sydney, stack: 0, subtitle: "時差が最も進んでいる都市", posW: 190, title: "シドニー" }

animation:
  - step: "朝の会" 1.8s
    focus: ["London2"]
    set:
      clocks: '[["東京",9,"17:00"],["ロンドン",0,"08:00"],["ニューヨーク",-5,"03:00"],["シドニー",11,"19:00"]]'
    description: "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。"
  - step: "昼の会" 1.8s
    focus: ["London2", "NYC2"]
    set:
      clocks: '[["東京",9,"22:00"],["ロンドン",0,"13:00"],["ニューヨーク",-5,"08:00"],["シドニー",11,"00:00"]]'
    description: "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。"
  - step: "夜の会" 1.8s
    focus: ["Tokyo2", "London2", "NYC2", "Sydney2"]
    set:
      clocks: '[["東京",9,"01:30"],["ロンドン",0,"16:30"],["ニューヨーク",-5,"11:30"],["シドニー",11,"03:30"]]'
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
      "label": "都市 (4 列の升目)"
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
      "title": "東京"
    },
    {
      "name": "London2",
      "kind": "card",
      "lane": "london",
      "stack": 0,
      "subtitle": "時差の基準となる都市",
      "posW": 180,
      "title": "ロンドン"
    },
    {
      "name": "NYC2",
      "kind": "card",
      "lane": "nyc",
      "stack": 0,
      "subtitle": "時差が最も遅れている都市",
      "posW": 200,
      "title": "ニューヨーク"
    },
    {
      "name": "Sydney2",
      "kind": "card",
      "lane": "sydney",
      "stack": 0,
      "subtitle": "時差が最も進んでいる都市",
      "posW": 190,
      "title": "シドニー"
    }
  ],
  "flow": [],
  "states": {
    "clocks": "[[\\"東京\\",9,\\"22:30\\"],[\\"ロンドン\\",0,\\"13:30\\"],[\\"ニューヨーク\\",-5,\\"08:30\\"],[\\"シドニー\\",11,\\"00:30\\"]]"
  },
  "animation": [
    {
      "step": "朝の会",
      "duration": 1.8,
      "focus": ["London2"],
      "set": {
        "clocks": "[[\\"東京\\",9,\\"17:00\\"],[\\"ロンドン\\",0,\\"08:00\\"],[\\"ニューヨーク\\",-5,\\"03:00\\"],[\\"シドニー\\",11,\\"19:00\\"]]"
      },
      "body": "4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。"
    },
    {
      "step": "昼の会",
      "duration": 1.8,
      "focus": ["London2", "NYC2"],
      "set": {
        "clocks": "[[\\"東京\\",9,\\"22:00\\"],[\\"ロンドン\\",0,\\"13:00\\"],[\\"ニューヨーク\\",-5,\\"08:00\\"],[\\"シドニー\\",11,\\"00:00\\"]]"
      },
      "body": "時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。"
    },
    {
      "step": "夜の会",
      "duration": 1.8,
      "focus": ["Tokyo2", "London2", "NYC2", "Sydney2"],
      "set": {
        "clocks": "[[\\"東京\\",9,\\"01:30\\"],[\\"ロンドン\\",0,\\"16:30\\"],[\\"ニューヨーク\\",-5,\\"11:30\\"],[\\"シドニー\\",11,\\"03:30\\"]]"
      },
      "body": "先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。"
    }
  ]
}`;

export const sourceYaml__signupFormSummary = `title: "登録項目 5 つを意味ごとに分ける"
type: flow

readouts:
  fs: { kind: form-summary, source: "fields", color: "#2563eb", label: "送る内容 (項目名と値)" }

lanes:
  personal: { x: 0, width: 220 }
  contact: { x: 260, width: 220 }
  prefs: { x: 520, width: 200 }

states:
  fields: '[["名前","佐藤 花子"],["電話番号","090-0000-1234"],["年齢","28"],["国","日本"],["お知らせ","受け取る"]]'

actors:
  - 名前: { kind: card, lane: personal, stack: 0, subtitle: "本人を表す項目" }
  - 年齢: { kind: card, lane: personal, stack: 1, subtitle: "本人を表す項目 (数)" }
  - 電話番号: { kind: card, lane: contact, stack: 0, subtitle: "連絡先の項目" }
  - 国: { kind: card, lane: contact, stack: 1, subtitle: "連絡先の項目 (所在)" }
  - お知らせ: { kind: card, lane: prefs, stack: 0, subtitle: "希望を表す項目" }

animation:
  - step: "入力の途中" 1.8s
    focus: ["名前", "年齢"]
    set:
      fields: '[["名前","佐藤 花子"],["年齢","28"]]'
    description: "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。"
  - step: "連絡先まで" 1.8s
    focus: ["名前", "年齢", "電話番号", "国"]
    set:
      fields: '[["名前","佐藤 花子"],["年齢","28"],["電話番号","090-0000-1234"],["国","日本"]]'
    description: "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。"
  - step: "送信の直前" 1.8s
    focus: ["名前", "年齢", "電話番号", "国", "お知らせ"]
    set:
      fields: '[["名前","佐藤 花子"],["年齢","28"],["電話番号","090-0000-1234"],["国","日本"],["お知らせ","受け取る"]]'
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
      "label": "送る内容 (項目名と値)"
    }
  ],
  "lanes": {
    "personal": { "x": 0, "width": 220 },
    "contact": { "x": 260, "width": 220 },
    "prefs": { "x": 520, "width": 200 }
  },
  "actors": [
    { "name": "名前", "kind": "card", "lane": "personal", "stack": 0, "subtitle": "本人を表す項目" },
    { "name": "年齢", "kind": "card", "lane": "personal", "stack": 1, "subtitle": "本人を表す項目 (数)" },
    { "name": "電話番号", "kind": "card", "lane": "contact", "stack": 0, "subtitle": "連絡先の項目" },
    {
      "name": "国",
      "kind": "card",
      "lane": "contact",
      "stack": 1,
      "subtitle": "連絡先の項目 (所在)"
    },
    { "name": "お知らせ", "kind": "card", "lane": "prefs", "stack": 0, "subtitle": "希望を表す項目" }
  ],
  "flow": [],
  "states": {
    "fields": "[[\\"名前\\",\\"佐藤 花子\\"],[\\"電話番号\\",\\"090-0000-1234\\"],[\\"年齢\\",\\"28\\"],[\\"国\\",\\"日本\\"],[\\"お知らせ\\",\\"受け取る\\"]]"
  },
  "animation": [
    {
      "step": "入力の途中",
      "duration": 1.8,
      "focus": ["名前", "年齢"],
      "set": { "fields": "[[\\"名前\\",\\"佐藤 花子\\"],[\\"年齢\\",\\"28\\"]]" },
      "body": "本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。"
    },
    {
      "step": "連絡先まで",
      "duration": 1.8,
      "focus": ["名前", "年齢", "電話番号", "国"],
      "set": {
        "fields": "[[\\"名前\\",\\"佐藤 花子\\"],[\\"年齢\\",\\"28\\"],[\\"電話番号\\",\\"090-0000-1234\\"],[\\"国\\",\\"日本\\"]]"
      },
      "body": "組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。"
    },
    {
      "step": "送信の直前",
      "duration": 1.8,
      "focus": ["名前", "年齢", "電話番号", "国", "お知らせ"],
      "set": {
        "fields": "[[\\"名前\\",\\"佐藤 花子\\"],[\\"年齢\\",\\"28\\"],[\\"電話番号\\",\\"090-0000-1234\\"],[\\"国\\",\\"日本\\"],[\\"お知らせ\\",\\"受け取る\\"]]"
      },
      "body": "希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。"
    }
  ]
}`;

export const sourceYaml__monthCalendarView = `title: "1 か月を週ごとに並べる"
type: flow

readouts:
  cm: { kind: calendar-month, source: "days", monthName: "2026 年 1 月", color: "#2563eb", label: "1 か月 (7 列の升目)" }

lanes:
  w1: { x: 0, width: 150 }
  w2: { x: 170, width: 150 }
  w3: { x: 340, width: 150 }
  w4: { x: 510, width: 200 }

states:
  days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"

actors:
  - 第 1 週: { kind: card, lane: w1, stack: 0, subtitle: "月の最初の週" }
  - 第 2 週: { kind: card, lane: w2, stack: 0, subtitle: "今日を含む週" }
  - 第 3 週: { kind: card, lane: w3, stack: 0, subtitle: "月の半ばの週" }
  - 第 4〜5 週: { kind: card, lane: w4, stack: 0, subtitle: "月の終わりの週" }
  - 月の合計: { kind: card, lane: w4, stack: 1, subtitle: "月ぜんたいのまとめ" }

animation:
  - step: "月の初め" 1.8s
    focus: ["第 1 週", "第 2 週"]
    set:
      days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,false,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,false,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
    description: "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。"
  - step: "月の半ば" 1.8s
    focus: ["第 1 週", "第 2 週", "第 3 週"]
    set:
      days: "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
    description: "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。"
  - step: "月の終わり" 1.8s
    focus: ["第 1 週", "第 2 週", "第 3 週", "第 4〜5 週", "月の合計"]
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
      "monthName": "2026 年 1 月",
      "color": "#2563eb",
      "label": "1 か月 (7 列の升目)"
    }
  ],
  "lanes": {
    "w1": { "x": 0, "width": 150 },
    "w2": { "x": 170, "width": 150 },
    "w3": { "x": 340, "width": 150 },
    "w4": { "x": 510, "width": 200 }
  },
  "actors": [
    { "name": "第 1 週", "kind": "card", "lane": "w1", "stack": 0, "subtitle": "月の最初の週" },
    { "name": "第 2 週", "kind": "card", "lane": "w2", "stack": 0, "subtitle": "今日を含む週" },
    { "name": "第 3 週", "kind": "card", "lane": "w3", "stack": 0, "subtitle": "月の半ばの週" },
    { "name": "第 4〜5 週", "kind": "card", "lane": "w4", "stack": 0, "subtitle": "月の終わりの週" },
    { "name": "月の合計", "kind": "card", "lane": "w4", "stack": 1, "subtitle": "月ぜんたいのまとめ" }
  ],
  "flow": [],
  "states": {
    "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,true,false],[23,false,false],[24,false,false],[25,false,false],[26,true,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
  },
  "animation": [
    {
      "step": "月の初め",
      "duration": 1.8,
      "focus": ["第 1 週", "第 2 週"],
      "set": {
        "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,false,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,false,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
      },
      "body": "予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。"
    },
    {
      "step": "月の半ば",
      "duration": 1.8,
      "focus": ["第 1 週", "第 2 週", "第 3 週"],
      "set": {
        "days": "[[1,false,false],[2,false,false],[3,true,false],[4,false,false],[5,false,false],[6,false,false],[7,false,false],[8,true,false],[9,false,false],[10,false,false],[11,false,false],[12,true,false],[13,false,true],[14,false,false],[15,false,false],[16,false,false],[17,true,false],[18,false,false],[19,false,false],[20,false,false],[21,false,false],[22,false,false],[23,false,false],[24,false,false],[25,false,false],[26,false,false],[27,false,false],[28,false,false],[29,false,false],[30,false,false],[31,false,false]]"
      },
      "body": "印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。"
    },
    {
      "step": "月の終わり",
      "duration": 1.8,
      "focus": ["第 1 週", "第 2 週", "第 3 週", "第 4〜5 週", "月の合計"],
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
  tm: { kind: terminal, source: "cmds", max: 10, color: "var(--d-dg-2)", label: "端末の画面" }

lanes:
  fs: { x: 0, width: 220 }
  git: { x: 260, width: 220 }
  dev: { x: 520, width: 220 }

states:
  cmds: '[["$","ls -1","作業場\\n見本\\nメモ"],["$","cd 作業場",""],["$","git diff","-古い説明\\n+新しい説明"],["$","pnpm -v","9.15.0"],["$","wc -l メモ","2 メモ"]]'

actors:
  - ls -1: { kind: card, lane: fs, stack: 0, subtitle: "中身を並べる · 出力が長い" }
  - cd 作業場: { kind: card, lane: fs, stack: 1, subtitle: "場所を移る · 出力が無い" }
  - git diff: { kind: card, lane: git, stack: 0, subtitle: "変更の差分を見る" }
  - pnpm -v: { kind: card, lane: dev, stack: 0, subtitle: "道具の版を見る" }
  - wc -l メモ: { kind: card, lane: dev, stack: 1, subtitle: "行の数を数える" }

animation:
  - step: "打ち始め" 1.8s
    focus: ["ls -1"]
    set:
      cmds: '[["$","ls -1","作業場\\n見本\\nメモ"]]'
    description: "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。"
  - step: "場所を移る" 1.8s
    focus: ["ls -1", "cd 作業場", "git diff"]
    set:
      cmds: '[["$","ls -1","作業場\\n見本"],["$","cd 作業場",""],["$","git diff","-古い説明\\n+新しい説明"]]'
    description: "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。"
  - step: "作業が進む" 1.8s
    focus: ["ls -1", "cd 作業場", "git diff", "pnpm -v", "wc -l メモ"]
    set:
      cmds: '[["$","ls -1","作業場\\n見本"],["$","cd 作業場",""],["$","git diff","-古い説明\\n+新しい説明"],["$","pnpm -v","9.15.0"],["$","wc -l メモ","2 メモ"]]'
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
      "label": "端末の画面"
    }
  ],
  "lanes": {
    "fs": { "x": 0, "width": 220 },
    "git": { "x": 260, "width": 220 },
    "dev": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "ls -1",
      "kind": "card",
      "lane": "fs",
      "stack": 0,
      "subtitle": "中身を並べる · 出力が長い"
    },
    {
      "name": "cd 作業場",
      "kind": "card",
      "lane": "fs",
      "stack": 1,
      "subtitle": "場所を移る · 出力が無い"
    },
    { "name": "git diff", "kind": "card", "lane": "git", "stack": 0, "subtitle": "変更の差分を見る" },
    { "name": "pnpm -v", "kind": "card", "lane": "dev", "stack": 0, "subtitle": "道具の版を見る" },
    {
      "name": "wc -l メモ",
      "kind": "card",
      "lane": "dev",
      "stack": 1,
      "subtitle": "行の数を数える"
    }
  ],
  "flow": [],
  "states": {
    "cmds": "[[\\"$\\",\\"ls -1\\",\\"作業場\\\\n見本\\\\nメモ\\"],[\\"$\\",\\"cd 作業場\\",\\"\\"],[\\"$\\",\\"git diff\\",\\"-古い説明\\\\n+新しい説明\\"],[\\"$\\",\\"pnpm -v\\",\\"9.15.0\\"],[\\"$\\",\\"wc -l メモ\\",\\"2 メモ\\"]]"
  },
  "animation": [
    {
      "step": "打ち始め",
      "duration": 1.8,
      "focus": ["ls -1"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -1\\",\\"作業場\\\\n見本\\\\nメモ\\"]]"
      },
      "body": "1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。"
    },
    {
      "step": "場所を移る",
      "duration": 1.8,
      "focus": ["ls -1", "cd 作業場", "git diff"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -1\\",\\"作業場\\\\n見本\\"],[\\"$\\",\\"cd 作業場\\",\\"\\"],[\\"$\\",\\"git diff\\",\\"-古い説明\\\\n+新しい説明\\"]]"
      },
      "body": "返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。"
    },
    {
      "step": "作業が進む",
      "duration": 1.8,
      "focus": ["ls -1", "cd 作業場", "git diff", "pnpm -v", "wc -l メモ"],
      "set": {
        "cmds": "[[\\"$\\",\\"ls -1\\",\\"作業場\\\\n見本\\"],[\\"$\\",\\"cd 作業場\\",\\"\\"],[\\"$\\",\\"git diff\\",\\"-古い説明\\\\n+新しい説明\\"],[\\"$\\",\\"pnpm -v\\",\\"9.15.0\\"],[\\"$\\",\\"wc -l メモ\\",\\"2 メモ\\"]]"
      },
      "body": "組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。"
    }
  ]
}`;

export const sourceYaml__chessStartingBoard = `title: "駒 32 個を白黒と前後列で並べる"
type: flow

readouts:
  cb: { kind: chess-board, source: "pieces", cellSize: 28, label: "盤面 (8×8)" }

lanes:
  blackBack: { x: 0, width: 320 }
  blackPawn: { x: 340, width: 340 }
  whitePawn: { x: 700, width: 340 }
  whiteBack: { x: 1060, width: 320 }

states:
  pieces: '[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'

actors:
  - 黒の奥の列: { kind: card, lane: blackBack, stack: 0, subtitle: "ポーン以外 (♜♞♝♛♚♝♞♜)", posW: 270 }
  - 黒の手前の列: { kind: card, lane: blackPawn, stack: 0, subtitle: "ポーンだけの列 (♟)", posW: 290 }
  - 白の手前の列: { kind: card, lane: whitePawn, stack: 0, subtitle: "ポーンだけの列 (♙)", posW: 290 }
  - 白の奥の列: { kind: card, lane: whiteBack, stack: 0, subtitle: "ポーン以外 (♖♘♗♕♔♗♘♖)", posW: 270 }

animation:
  - step: "白を並べる" 1.8s
    focus: ["白の奥の列", "白の手前の列"]
    set:
      pieces: '[["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'
    description: "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。"
  - step: "黒の手前を置く" 1.8s
    focus: ["白の奥の列", "白の手前の列", "黒の手前の列"]
    set:
      pieces: '[["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]'
    description: "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。"
  - step: "開始の形" 1.8s
    focus: ["黒の奥の列", "黒の手前の列", "白の手前の列", "白の奥の列"]
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
      "label": "盤面 (8×8)"
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
      "name": "黒の奥の列",
      "kind": "card",
      "lane": "blackBack",
      "stack": 0,
      "subtitle": "ポーン以外 (♜♞♝♛♚♝♞♜)",
      "posW": 270
    },
    {
      "name": "黒の手前の列",
      "kind": "card",
      "lane": "blackPawn",
      "stack": 0,
      "subtitle": "ポーンだけの列 (♟)",
      "posW": 290
    },
    {
      "name": "白の手前の列",
      "kind": "card",
      "lane": "whitePawn",
      "stack": 0,
      "subtitle": "ポーンだけの列 (♙)",
      "posW": 290
    },
    {
      "name": "白の奥の列",
      "kind": "card",
      "lane": "whiteBack",
      "stack": 0,
      "subtitle": "ポーン以外 (♖♘♗♕♔♗♘♖)",
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
      "focus": ["白の奥の列", "白の手前の列"],
      "set": {
        "pieces": "[[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
      },
      "body": "白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。"
    },
    {
      "step": "黒の手前を置く",
      "duration": 1.8,
      "focus": ["白の奥の列", "白の手前の列", "黒の手前の列"],
      "set": {
        "pieces": "[[\\"a\\",7,\\"♟\\"],[\\"b\\",7,\\"♟\\"],[\\"c\\",7,\\"♟\\"],[\\"d\\",7,\\"♟\\"],[\\"e\\",7,\\"♟\\"],[\\"f\\",7,\\"♟\\"],[\\"g\\",7,\\"♟\\"],[\\"h\\",7,\\"♟\\"],[\\"a\\",2,\\"♙\\"],[\\"b\\",2,\\"♙\\"],[\\"c\\",2,\\"♙\\"],[\\"d\\",2,\\"♙\\"],[\\"e\\",2,\\"♙\\"],[\\"f\\",2,\\"♙\\"],[\\"g\\",2,\\"♙\\"],[\\"h\\",2,\\"♙\\"],[\\"a\\",1,\\"♖\\"],[\\"b\\",1,\\"♘\\"],[\\"c\\",1,\\"♗\\"],[\\"d\\",1,\\"♕\\"],[\\"e\\",1,\\"♔\\"],[\\"f\\",1,\\"♗\\"],[\\"g\\",1,\\"♘\\"],[\\"h\\",1,\\"♖\\"]]"
      },
      "body": "反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。"
    },
    {
      "step": "開始の形",
      "duration": 1.8,
      "focus": ["黒の奥の列", "黒の手前の列", "白の手前の列", "白の奥の列"],
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
  kb: { kind: kanban-board, source: "tasks", columnWidth: 140, max: 5, label: "今期のかんばん" }

lanes:
  todo: { x: 0, width: 220 }
  inprogress: { x: 260, width: 220 }
  done: { x: 520, width: 220 }

states:
  tasks: '[["todo","API の型を設計する","high"],["todo","文書を書く","low"],["inprogress","認証の流れを作る","high"],["inprogress","移行の手順を書く","med"],["done","自動検査を整える","med"],["done","リポジトリを用意する","low"]]'

actors:
  - Todo2: { kind: card, lane: todo, stack: 0, subtitle: "まだ手を付けていない列", title: "未着手" }
  - 進行中: { kind: card, lane: inprogress, stack: 0, subtitle: "いま進めている列" }
  - Done2: { kind: card, lane: done, stack: 0, subtitle: "終わった列", title: "完了" }

animation:
  - step: "着手前" 1.8s
    focus: ["Todo2"]
    set:
      tasks: '[["todo","API の型を設計する","high"],["todo","文書を書く","low"],["todo","認証の流れを作る","high"],["todo","移行の手順を書く","med"],["todo","自動検査を整える","med"],["todo","リポジトリを用意する","low"]]'
    description: "札がすべて左の列に積まれる。 重さの違いは札の色として出る。"
  - step: "動き出す" 1.8s
    focus: ["Todo2", "進行中"]
    set:
      tasks: '[["todo","API の型を設計する","high"],["todo","文書を書く","low"],["inprogress","認証の流れを作る","high"],["inprogress","移行の手順を書く","med"],["done","自動検査を整える","med"],["todo","リポジトリを用意する","low"]]'
    description: "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。"
  - step: "終盤に入る" 1.8s
    focus: ["Todo2", "進行中", "Done2"]
    set:
      tasks: '[["todo","API の型を設計する","high"],["inprogress","文書を書く","low"],["inprogress","認証の流れを作る","high"],["done","移行の手順を書く","med"],["done","自動検査を整える","med"],["done","リポジトリを用意する","low"]]'
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
      "label": "今期のかんばん"
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
      "title": "未着手"
    },
    {
      "name": "進行中",
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
      "title": "完了"
    }
  ],
  "flow": [],
  "states": {
    "tasks": "[[\\"todo\\",\\"API の型を設計する\\",\\"high\\"],[\\"todo\\",\\"文書を書く\\",\\"low\\"],[\\"inprogress\\",\\"認証の流れを作る\\",\\"high\\"],[\\"inprogress\\",\\"移行の手順を書く\\",\\"med\\"],[\\"done\\",\\"自動検査を整える\\",\\"med\\"],[\\"done\\",\\"リポジトリを用意する\\",\\"low\\"]]"
  },
  "animation": [
    {
      "step": "着手前",
      "duration": 1.8,
      "focus": ["Todo2"],
      "set": {
        "tasks": "[[\\"todo\\",\\"API の型を設計する\\",\\"high\\"],[\\"todo\\",\\"文書を書く\\",\\"low\\"],[\\"todo\\",\\"認証の流れを作る\\",\\"high\\"],[\\"todo\\",\\"移行の手順を書く\\",\\"med\\"],[\\"todo\\",\\"自動検査を整える\\",\\"med\\"],[\\"todo\\",\\"リポジトリを用意する\\",\\"low\\"]]"
      },
      "body": "札がすべて左の列に積まれる。 重さの違いは札の色として出る。"
    },
    {
      "step": "動き出す",
      "duration": 1.8,
      "focus": ["Todo2", "進行中"],
      "set": {
        "tasks": "[[\\"todo\\",\\"API の型を設計する\\",\\"high\\"],[\\"todo\\",\\"文書を書く\\",\\"low\\"],[\\"inprogress\\",\\"認証の流れを作る\\",\\"high\\"],[\\"inprogress\\",\\"移行の手順を書く\\",\\"med\\"],[\\"done\\",\\"自動検査を整える\\",\\"med\\"],[\\"todo\\",\\"リポジトリを用意する\\",\\"low\\"]]"
      },
      "body": "札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。"
    },
    {
      "step": "終盤に入る",
      "duration": 1.8,
      "focus": ["Todo2", "進行中", "Done2"],
      "set": {
        "tasks": "[[\\"todo\\",\\"API の型を設計する\\",\\"high\\"],[\\"inprogress\\",\\"文書を書く\\",\\"low\\"],[\\"inprogress\\",\\"認証の流れを作る\\",\\"high\\"],[\\"done\\",\\"移行の手順を書く\\",\\"med\\"],[\\"done\\",\\"自動検査を整える\\",\\"med\\"],[\\"done\\",\\"リポジトリを用意する\\",\\"low\\"]]"
      },
      "body": "右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。"
    }
  ]
}`;

export const sourceYaml__docsBreadcrumb = `title: "階層 4 段のパンくずを順に辿る"
type: flow

readouts:
  bc: { kind: breadcrumb, source: "path", currentSource: "cur", color: "#2563eb", label: "現在地" }

lanes:
  col1: { x: 0, width: 270 }
  col2: { x: 310, width: 300 }

states:
  path: '["トップ","文書","API","参照"]'
  cur: 2

actors:
  - トップ: { kind: card, lane: col1, stack: 0, subtitle: "最上位の階層", posW: 190  }
  - 文書: { kind: card, lane: col2, stack: 0, subtitle: "トップの下にある階層", posW: 140  }
  - API: { kind: card, lane: col1, stack: 1, subtitle: "参照の上にある階層", posW: 220  }
  - 参照: { kind: card, lane: col2, stack: 1, subtitle: "最も深い階層", posW: 250  }

flow:
  - トップ -> 文書: "→" (info)
  - 文書 -> API: "→" (accent)
  - API -> 参照: "→" (info)

animation:
  - step: "最上位に居る" 1.8s
    focus: ["トップ"]
    set:
      cur: 0
    description: "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。"
  - step: "中ほどへ降りる" 1.8s
    focus: ["トップ", "文書", "API"]
    set:
      cur: 2
    description: "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。"
  - step: "最も深い階層" 1.8s
    focus: ["トップ", "文書", "API", "参照"]
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
      "label": "現在地"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 270 },
    "col2": { "x": 310, "width": 300 }
  },
  "actors": [
    {
      "name": "トップ",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最上位の階層",
      "posW": 190
    },
    {
      "name": "文書",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "トップの下にある階層",
      "posW": 140
    },
    {
      "name": "API",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "参照の上にある階層",
      "posW": 220
    },
    {
      "name": "参照",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "最も深い階層",
      "posW": 250
    }
  ],
  "flow": [
    { "from": "トップ", "to": "文書", "label": "→", "tone": "info" },
    { "from": "文書", "to": "API", "label": "→", "tone": "accent" },
    { "from": "API", "to": "参照", "label": "→", "tone": "info" }
  ],
  "states": { "path": "[\\"トップ\\",\\"文書\\",\\"API\\",\\"参照\\"]", "cur": 2 },
  "animation": [
    {
      "step": "最上位に居る",
      "duration": 1.8,
      "focus": ["トップ"],
      "set": { "cur": 0 },
      "body": "4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。"
    },
    {
      "step": "中ほどへ降りる",
      "duration": 1.8,
      "focus": ["トップ", "文書", "API"],
      "set": { "cur": 2 },
      "body": "濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。"
    },
    {
      "step": "最も深い階層",
      "duration": 1.8,
      "focus": ["トップ", "文書", "API", "参照"],
      "set": { "cur": 3 },
      "body": "末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。"
    }
  ]
}`;

export const sourceYaml__dayScheduleTimeline = `title: "1 日の予定を朝 / 昼 / 夜で分ける"
type: flow

readouts:
  tv: { kind: timeline-vertical, source: "events", color: "#2563eb", max: 8, label: "1 日の予定" }

lanes:
  morning: { x: 0, width: 240 }
  afternoon: { x: 280, width: 240 }
  evening: { x: 560, width: 240 }

states:
  events: '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"],["14:00","試験環境へ配備","v1.2.0"],["16:00","1 対 1 の面談","これからの仕事の話"],["19:30","振り返り","第 42 期の締め"]]'

actors:
  - Morning2: { kind: card, lane: morning, stack: 0, subtitle: "9 時から 12 時まで", title: "午前" }
  - Afternoon2: { kind: card, lane: afternoon, stack: 0, subtitle: "12 時から 18 時まで", title: "午後" }
  - Evening2: { kind: card, lane: evening, stack: 0, subtitle: "18 時から後", title: "夜" }

animation:
  - step: "午前の予定" 1.8s
    focus: ["Morning2"]
    set:
      events: '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"]]'
    description: "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。"
  - step: "午後まで" 1.8s
    focus: ["Morning2", "Afternoon2"]
    set:
      events: '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"],["14:00","試験環境へ配備"],["16:00","1 対 1 の面談","これからの仕事の話"]]'
    description: "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。"
  - step: "1 日ぶん" 1.8s
    focus: ["Morning2", "Afternoon2", "Evening2"]
    set:
      events: '[["09:00","朝会","進み具合を合わせる"],["10:30","設計の確認","3 案を比べる"],["14:00","試験環境へ配備","v1.2.0"],["16:00","1 対 1 の面談","これからの仕事の話"],["19:30","振り返り","第 42 期の締め"]]'
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
      "label": "1 日の予定"
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
      "subtitle": "9 時から 12 時まで",
      "title": "午前"
    },
    {
      "name": "Afternoon2",
      "kind": "card",
      "lane": "afternoon",
      "stack": 0,
      "subtitle": "12 時から 18 時まで",
      "title": "午後"
    },
    {
      "name": "Evening2",
      "kind": "card",
      "lane": "evening",
      "stack": 0,
      "subtitle": "18 時から後",
      "title": "夜"
    }
  ],
  "flow": [],
  "states": {
    "events": "[[\\"09:00\\",\\"朝会\\",\\"進み具合を合わせる\\"],[\\"10:30\\",\\"設計の確認\\",\\"3 案を比べる\\"],[\\"14:00\\",\\"試験環境へ配備\\",\\"v1.2.0\\"],[\\"16:00\\",\\"1 対 1 の面談\\",\\"これからの仕事の話\\"],[\\"19:30\\",\\"振り返り\\",\\"第 42 期の締め\\"]]"
  },
  "animation": [
    {
      "step": "午前の予定",
      "duration": 1.8,
      "focus": ["Morning2"],
      "set": {
        "events": "[[\\"09:00\\",\\"朝会\\",\\"進み具合を合わせる\\"],[\\"10:30\\",\\"設計の確認\\",\\"3 案を比べる\\"]]"
      },
      "body": "点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。"
    },
    {
      "step": "午後まで",
      "duration": 1.8,
      "focus": ["Morning2", "Afternoon2"],
      "set": {
        "events": "[[\\"09:00\\",\\"朝会\\",\\"進み具合を合わせる\\"],[\\"10:30\\",\\"設計の確認\\",\\"3 案を比べる\\"],[\\"14:00\\",\\"試験環境へ配備\\"],[\\"16:00\\",\\"1 対 1 の面談\\",\\"これからの仕事の話\\"]]"
      },
      "body": "点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。"
    },
    {
      "step": "1 日ぶん",
      "duration": 1.8,
      "focus": ["Morning2", "Afternoon2", "Evening2"],
      "set": {
        "events": "[[\\"09:00\\",\\"朝会\\",\\"進み具合を合わせる\\"],[\\"10:30\\",\\"設計の確認\\",\\"3 案を比べる\\"],[\\"14:00\\",\\"試験環境へ配備\\",\\"v1.2.0\\"],[\\"16:00\\",\\"1 対 1 の面談\\",\\"これからの仕事の話\\"],[\\"19:30\\",\\"振り返り\\",\\"第 42 期の締め\\"]]"
      },
      "body": "点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。"
    }
  ]
}`;

export const sourceYaml__serverUptimeStatus = `title: "稼働 6 区間を稼働 / 待機 / 異常で分ける"
type: flow

readouts:
  st: { kind: status-timeline, source: "events", max: 8, label: "サーバの状態" }

lanes:
  active: { x: 0, width: 240 }
  idle: { x: 280, width: 240 }
  error: { x: 560, width: 240 }

states:
  events: '[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]'

actors:
  - Active2: { kind: card, lane: active, stack: 0, subtitle: "稼働している区間 (緑)", title: "稼働" }
  - Idle2: { kind: card, lane: idle, stack: 0, subtitle: "待機している区間 (灰)", title: "待機" }
  - Error2: { kind: card, lane: error, stack: 0, subtitle: "異常が出た区間 (赤)", title: "異常" }

animation:
  - step: "平常の稼働" 1.8s
    focus: ["Active2"]
    set:
      events: '[["09:00","active"],["09:15","active"]]'
    description: "同じ色の区間が続く。 区間の字は状態の名前 (稼働 / 待機 / 異常) で出ることが読める。"
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
      "label": "サーバの状態"
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
      "title": "稼働"
    },
    {
      "name": "Idle2",
      "kind": "card",
      "lane": "idle",
      "stack": 0,
      "subtitle": "待機している区間 (灰)",
      "title": "待機"
    },
    {
      "name": "Error2",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "異常が出た区間 (赤)",
      "title": "異常"
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
      "body": "同じ色の区間が続く。 区間の字は状態の名前 (稼働 / 待機 / 異常) で出ることが読める。"
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
  cw: { kind: calendar-week, source: "week", cellSize: 40, color: "#2563eb", label: "今週" }

lanes:
  mon: { x: 0, width: 160 }
  tue: { x: 185, width: 160 }
  wed: { x: 370, width: 210 }
  thu: { x: 605, width: 160 }
  fri: { x: 790, width: 160 }
  sat: { x: 975, width: 160 }
  sun: { x: 1160, width: 160 }

states:
  week: '[["月",true,false],["火",false,false],["水",true,true],["木",false,false],["金",true,false],["土",false,false],["日",false,false]]'

actors:
  - Mon2: { kind: card, lane: mon, stack: 0, subtitle: "予定を持つ日", posW: 110, title: "月曜" }
  - Tue2: { kind: card, lane: tue, stack: 0, subtitle: "予定を持たない日", posW: 110, title: "火曜" }
  - Wed2: { kind: card, lane: wed, stack: 0, subtitle: "予定を持つ日", posW: 160, title: "水曜" }
  - Thu2: { kind: card, lane: thu, stack: 0, subtitle: "予定を持たない日", posW: 110, title: "木曜" }
  - Fri2: { kind: card, lane: fri, stack: 0, subtitle: "予定を持つ日", posW: 110, title: "金曜" }
  - Sat2: { kind: card, lane: sat, stack: 0, subtitle: "予定のない週末", posW: 110, title: "土曜" }
  - Sun2: { kind: card, lane: sun, stack: 0, subtitle: "週明け前の休日", posW: 110, title: "日曜" }

animation:
  - step: "週の始まり" 1.8s
    focus: ["Mon2"]
    set:
      week: '[["月",true,true],["火",false,false],["水",true,false],["木",false,false],["金",true,false],["土",false,false],["日",false,false]]'
    description: "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。"
  - step: "週の半ば" 1.8s
    focus: ["Mon2", "Wed2"]
    set:
      week: '[["月",true,false],["火",false,false],["水",true,true],["木",false,false],["金",true,false],["土",false,false],["日",false,false]]'
    description: "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。"
  - step: "週の終わり" 1.8s
    focus: ["Mon2", "Wed2", "Fri2", "Sat2", "Sun2"]
    set:
      week: '[["月",true,false],["火",false,false],["水",true,false],["木",false,false],["金",true,true],["土",false,false],["日",false,false]]'
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
      "label": "今週"
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
      "title": "月曜"
    },
    {
      "name": "Tue2",
      "kind": "card",
      "lane": "tue",
      "stack": 0,
      "subtitle": "予定を持たない日",
      "posW": 110,
      "title": "火曜"
    },
    {
      "name": "Wed2",
      "kind": "card",
      "lane": "wed",
      "stack": 0,
      "subtitle": "予定を持つ日",
      "posW": 160,
      "title": "水曜"
    },
    {
      "name": "Thu2",
      "kind": "card",
      "lane": "thu",
      "stack": 0,
      "subtitle": "予定を持たない日",
      "posW": 110,
      "title": "木曜"
    },
    {
      "name": "Fri2",
      "kind": "card",
      "lane": "fri",
      "stack": 0,
      "subtitle": "予定を持つ日",
      "posW": 110,
      "title": "金曜"
    },
    {
      "name": "Sat2",
      "kind": "card",
      "lane": "sat",
      "stack": 0,
      "subtitle": "予定のない週末",
      "posW": 110,
      "title": "土曜"
    },
    {
      "name": "Sun2",
      "kind": "card",
      "lane": "sun",
      "stack": 0,
      "subtitle": "週明け前の休日",
      "posW": 110,
      "title": "日曜"
    }
  ],
  "flow": [],
  "states": {
    "week": "[[\\"月\\",true,false],[\\"火\\",false,false],[\\"水\\",true,true],[\\"木\\",false,false],[\\"金\\",true,false],[\\"土\\",false,false],[\\"日\\",false,false]]"
  },
  "animation": [
    {
      "step": "週の始まり",
      "duration": 1.8,
      "focus": ["Mon2"],
      "set": {
        "week": "[[\\"月\\",true,true],[\\"火\\",false,false],[\\"水\\",true,false],[\\"木\\",false,false],[\\"金\\",true,false],[\\"土\\",false,false],[\\"日\\",false,false]]"
      },
      "body": "今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。"
    },
    {
      "step": "週の半ば",
      "duration": 1.8,
      "focus": ["Mon2", "Wed2"],
      "set": {
        "week": "[[\\"月\\",true,false],[\\"火\\",false,false],[\\"水\\",true,true],[\\"木\\",false,false],[\\"金\\",true,false],[\\"土\\",false,false],[\\"日\\",false,false]]"
      },
      "body": "塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。"
    },
    {
      "step": "週の終わり",
      "duration": 1.8,
      "focus": ["Mon2", "Wed2", "Fri2", "Sat2", "Sun2"],
      "set": {
        "week": "[[\\"月\\",true,false],[\\"火\\",false,false],[\\"水\\",true,false],[\\"木\\",false,false],[\\"金\\",true,true],[\\"土\\",false,false],[\\"日\\",false,false]]"
      },
      "body": "塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。"
    }
  ]
}`;

export const sourceYaml__teamKpiComparison = `title: "2 チームの成績を並べて比べる"
type: flow

readouts:
  kc: { kind: kpi-comparison, source: "teams", max: 100, colorA: "#2563eb", colorB: "#f97316", label: "成績の比較" }

lanes:
  teamA: { x: 0, width: 340 }
  teamB: { x: 380, width: 340 }

states:
  teams: '[["チーム A",82],["チーム B",65]]'

actors:
  - チーム A: { kind: card, lane: teamA, stack: 0, subtitle: "上の帯 (青)" }
  - 進む速さ: { kind: card, lane: teamA, stack: 1, subtitle: "上の帯が表す量" }
  - チーム B: { kind: card, lane: teamB, stack: 0, subtitle: "下の帯 (橙)" }
  - Velocity2: { kind: card, lane: teamB, stack: 1, subtitle: "下の帯が表す量", title: "進む速さ" }

flow:
  - チーム A -> チーム B: "差" (warning)

animation:
  - step: "差が大きい" 1.8s
    focus: ["チーム A", "チーム B"]
    set:
      teams: '[["チーム A",82],["チーム B",41]]'
    description: "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。"
  - step: "追い上げる" 1.8s
    focus: ["チーム A", "進む速さ", "チーム B"]
    set:
      teams: '[["チーム A",82],["チーム B",65]]'
    description: "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。"
  - step: "ほぼ並ぶ" 1.8s
    focus: ["チーム A", "進む速さ", "チーム B", "Velocity2"]
    set:
      teams: '[["チーム A",84],["チーム B",80]]'
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
      "label": "成績の比較"
    }
  ],
  "lanes": {
    "teamA": { "x": 0, "width": 340 },
    "teamB": { "x": 380, "width": 340 }
  },
  "actors": [
    { "name": "チーム A", "kind": "card", "lane": "teamA", "stack": 0, "subtitle": "上の帯 (青)" },
    { "name": "進む速さ", "kind": "card", "lane": "teamA", "stack": 1, "subtitle": "上の帯が表す量" },
    { "name": "チーム B", "kind": "card", "lane": "teamB", "stack": 0, "subtitle": "下の帯 (橙)" },
    {
      "name": "Velocity2",
      "kind": "card",
      "lane": "teamB",
      "stack": 1,
      "subtitle": "下の帯が表す量",
      "title": "進む速さ"
    }
  ],
  "flow": [
    { "from": "チーム A", "to": "チーム B", "label": "差", "tone": "warning" }
  ],
  "states": { "teams": "[[\\"チーム A\\",82],[\\"チーム B\\",65]]" },
  "animation": [
    {
      "step": "差が大きい",
      "duration": 1.8,
      "focus": ["チーム A", "チーム B"],
      "set": { "teams": "[[\\"チーム A\\",82],[\\"チーム B\\",41]]" },
      "body": "2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。"
    },
    {
      "step": "追い上げる",
      "duration": 1.8,
      "focus": ["チーム A", "進む速さ", "チーム B"],
      "set": { "teams": "[[\\"チーム A\\",82],[\\"チーム B\\",65]]" },
      "body": "下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。"
    },
    {
      "step": "ほぼ並ぶ",
      "duration": 1.8,
      "focus": ["チーム A", "進む速さ", "チーム B", "Velocity2"],
      "set": { "teams": "[[\\"チーム A\\",84],[\\"チーム B\\",80]]" },
      "body": "2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。"
    }
  ]
}`;

export const sourceYaml__publishWorkflowSteps = `title: "記事公開の 4 工程を順に追う"
type: flow

readouts:
  sp: { kind: step-progress, source: "cur", stepsSource: "steps", color: "#2563eb", label: "公開の手順" }

lanes:
  col1: { x: 0, width: 300 }
  col2: { x: 340, width: 270 }

states:
  steps: '["下書き","確認","承認","公開"]'
  cur: 2

actors:
  - 下書き: { kind: card, lane: col1, stack: 0, subtitle: "最初の工程", posW: 190  }
  - 確認: { kind: card, lane: col2, stack: 0, subtitle: "下書きの次の工程", posW: 190  }
  - 承認: { kind: card, lane: col1, stack: 1, subtitle: "公開の直前の工程", posW: 250  }
  - 公開: { kind: card, lane: col2, stack: 1, subtitle: "最後の工程", posW: 220  }

flow:
  - 下書き -> 確認: "出す" (success)
  - 確認 -> 承認: "確かめた" (info)
  - 承認 -> 公開: "公開する" (accent)

animation:
  - step: "書き始め" 1.8s
    focus: ["下書き"]
    set:
      cur: 0
    description: "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。"
  - step: "確認を経る" 1.8s
    focus: ["下書き", "確認", "承認"]
    set:
      cur: 2
    description: "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。"
  - step: "公開する" 1.8s
    focus: ["下書き", "確認", "承認", "公開"]
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
      "label": "公開の手順"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 300 },
    "col2": { "x": 340, "width": 270 }
  },
  "actors": [
    {
      "name": "下書き",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "最初の工程",
      "posW": 190
    },
    {
      "name": "確認",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "下書きの次の工程",
      "posW": 190
    },
    {
      "name": "承認",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "公開の直前の工程",
      "posW": 250
    },
    {
      "name": "公開",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "最後の工程",
      "posW": 220
    }
  ],
  "flow": [
    { "from": "下書き", "to": "確認", "label": "出す", "tone": "success" },
    { "from": "確認", "to": "承認", "label": "確かめた", "tone": "info" },
    { "from": "承認", "to": "公開", "label": "公開する", "tone": "accent" }
  ],
  "states": { "steps": "[\\"下書き\\",\\"確認\\",\\"承認\\",\\"公開\\"]", "cur": 2 },
  "animation": [
    {
      "step": "書き始め",
      "duration": 1.8,
      "focus": ["下書き"],
      "set": { "cur": 0 },
      "body": "番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。"
    },
    {
      "step": "確認を経る",
      "duration": 1.8,
      "focus": ["下書き", "確認", "承認"],
      "set": { "cur": 2 },
      "body": "濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。"
    },
    {
      "step": "公開する",
      "duration": 1.8,
      "focus": ["下書き", "確認", "承認", "公開"],
      "set": { "cur": 3 },
      "body": "末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。"
    }
  ]
}`;

export const sourceYaml__teamPresenceStatus = `title: "5 人の在席を在席 / 離席 / 不在で分ける"
type: flow

readouts:
  up: { kind: user-presence, source: "team", max: 6, label: "チームの在席" }

lanes:
  online: { x: 0, width: 240 }
  away: { x: 280, width: 240 }
  offline: { x: 560, width: 240 }

states:
  team: '[["佐藤","online"],["鈴木","away"],["高橋","online"],["田中","offline"],["伊藤","online"]]'

actors:
  - 佐藤: { kind: card, lane: online, stack: 0, subtitle: "在席の人 (緑の丸)" }
  - 高橋: { kind: card, lane: online, stack: 1, subtitle: "在席の人 (緑の丸)" }
  - 伊藤: { kind: card, lane: online, stack: 2, subtitle: "在席の人 (緑の丸)" }
  - 鈴木: { kind: card, lane: away, stack: 0, subtitle: "離席の人 (黄の丸)" }
  - 田中: { kind: card, lane: offline, stack: 0, subtitle: "不在の人 (灰の丸)" }

animation:
  - step: "朝の在席" 1.8s
    focus: ["田中"]
    set:
      team: '[["佐藤","offline"],["鈴木","offline"],["高橋","offline"],["田中","offline"],["伊藤","offline"]]'
    description: "全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。"
  - step: "上限ちょうど" 1.8s
    focus: ["佐藤", "鈴木", "田中"]
    set:
      team: '[["佐藤","online"],["鈴木","away"],["高橋","offline"],["田中","offline"],["伊藤","online"],["渡辺","online"]]'
    description: "6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。"
  - step: "上限を超える" 1.8s
    focus: ["佐藤", "高橋", "伊藤", "鈴木", "田中"]
    set:
      team: '[["佐藤","online"],["鈴木","away"],["高橋","offline"],["田中","offline"],["伊藤","online"],["渡辺","online"],["山本","away"]]'
    description: "7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。"
`;

export const sourceJson__teamPresenceStatus = `{
  "title": "5 人の在席を在席 / 離席 / 不在で分ける",
  "type": "flow",
  "readouts": [
    { "id": "up", "kind": "user-presence", "source": "team", "max": 6, "label": "チームの在席" }
  ],
  "lanes": {
    "online": { "x": 0, "width": 240 },
    "away": { "x": 280, "width": 240 },
    "offline": { "x": 560, "width": 240 }
  },
  "actors": [
    { "name": "佐藤", "kind": "card", "lane": "online", "stack": 0, "subtitle": "在席の人 (緑の丸)" },
    { "name": "高橋", "kind": "card", "lane": "online", "stack": 1, "subtitle": "在席の人 (緑の丸)" },
    { "name": "伊藤", "kind": "card", "lane": "online", "stack": 2, "subtitle": "在席の人 (緑の丸)" },
    { "name": "鈴木", "kind": "card", "lane": "away", "stack": 0, "subtitle": "離席の人 (黄の丸)" },
    { "name": "田中", "kind": "card", "lane": "offline", "stack": 0, "subtitle": "不在の人 (灰の丸)" }
  ],
  "flow": [],
  "states": {
    "team": "[[\\"佐藤\\",\\"online\\"],[\\"鈴木\\",\\"away\\"],[\\"高橋\\",\\"online\\"],[\\"田中\\",\\"offline\\"],[\\"伊藤\\",\\"online\\"]]"
  },
  "animation": [
    {
      "step": "朝の在席",
      "duration": 1.8,
      "focus": ["田中"],
      "set": {
        "team": "[[\\"佐藤\\",\\"offline\\"],[\\"鈴木\\",\\"offline\\"],[\\"高橋\\",\\"offline\\"],[\\"田中\\",\\"offline\\"],[\\"伊藤\\",\\"offline\\"]]"
      },
      "body": "全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。"
    },
    {
      "step": "上限ちょうど",
      "duration": 1.8,
      "focus": ["佐藤", "鈴木", "田中"],
      "set": {
        "team": "[[\\"佐藤\\",\\"online\\"],[\\"鈴木\\",\\"away\\"],[\\"高橋\\",\\"offline\\"],[\\"田中\\",\\"offline\\"],[\\"伊藤\\",\\"online\\"],[\\"渡辺\\",\\"online\\"]]"
      },
      "body": "6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。"
    },
    {
      "step": "上限を超える",
      "duration": 1.8,
      "focus": ["佐藤", "高橋", "伊藤", "鈴木", "田中"],
      "set": {
        "team": "[[\\"佐藤\\",\\"online\\"],[\\"鈴木\\",\\"away\\"],[\\"高橋\\",\\"offline\\"],[\\"田中\\",\\"offline\\"],[\\"伊藤\\",\\"online\\"],[\\"渡辺\\",\\"online\\"],[\\"山本\\",\\"away\\"]]"
      },
      "body": "7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。"
    }
  ]
}`;

export const sourceYaml__feedbackThumbRating = `title: "賛成票と反対票を並べて見せる"
type: flow

readouts:
  rt: { kind: rating-thumb, source: "votes", colorUp: "#22c55e", colorDown: "#ef4444", label: "評価" }

lanes:
  up: { x: 0, width: 340 }
  down: { x: 380, width: 340 }

states:
  votes: "[24,3]"

actors:
  - ▲ 賛成票: { kind: card, lane: up, stack: 0, subtitle: "帯の緑の側を決める票" }
  - 賛成: { kind: card, lane: up, stack: 1, subtitle: "帯の緑の部分" }
  - ▼ 反対票: { kind: card, lane: down, stack: 0, subtitle: "帯の赤の側を決める票" }
  - 反対: { kind: card, lane: down, stack: 1, subtitle: "帯の赤の部分" }

flow:
  - ▲ 賛成票 -> ▼ 反対票: "割合" (warning)

animation:
  - step: "票が割れる" 1.8s
    focus: ["▲ 賛成票", "▼ 反対票"]
    set:
      votes: "[12,10]"
    description: "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。"
  - step: "賛成が増える" 1.8s
    focus: ["▲ 賛成票", "賛成", "▼ 反対票"]
    set:
      votes: "[20,10]"
    description: "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。"
  - step: "賛成に寄る" 1.8s
    focus: ["▲ 賛成票", "賛成", "▼ 反対票", "反対"]
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
      "label": "評価"
    }
  ],
  "lanes": {
    "up": { "x": 0, "width": 340 },
    "down": { "x": 380, "width": 340 }
  },
  "actors": [
    { "name": "▲ 賛成票", "kind": "card", "lane": "up", "stack": 0, "subtitle": "帯の緑の側を決める票" },
    { "name": "賛成", "kind": "card", "lane": "up", "stack": 1, "subtitle": "帯の緑の部分" },
    {
      "name": "▼ 反対票",
      "kind": "card",
      "lane": "down",
      "stack": 0,
      "subtitle": "帯の赤の側を決める票"
    },
    { "name": "反対", "kind": "card", "lane": "down", "stack": 1, "subtitle": "帯の赤の部分" }
  ],
  "flow": [
    { "from": "▲ 賛成票", "to": "▼ 反対票", "label": "割合", "tone": "warning" }
  ],
  "states": { "votes": "[24,3]" },
  "animation": [
    {
      "step": "票が割れる",
      "duration": 1.8,
      "focus": ["▲ 賛成票", "▼ 反対票"],
      "set": { "votes": "[12,10]" },
      "body": "賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。"
    },
    {
      "step": "賛成が増える",
      "duration": 1.8,
      "focus": ["▲ 賛成票", "賛成", "▼ 反対票"],
      "set": { "votes": "[20,10]" },
      "body": "賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。"
    },
    {
      "step": "賛成に寄る",
      "duration": 1.8,
      "focus": ["▲ 賛成票", "賛成", "▼ 反対票", "反対"],
      "set": { "votes": "[24,3]" },
      "body": "賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。"
    }
  ]
}`;

export const sourceYaml__startupOrgChart = `title: "3 階層の組織図を階層ごとに並べる"
type: flow

readouts:
  oc: { kind: org-chart-mini, source: "org", color: "#2563eb", label: "組織の階層" }

lanes:
  ceo: { x: 0, width: 220 }
  vp: { x: 260, width: 220 }
  ic: { x: 520, width: 260 }

states:
  org: '[["佐藤 社長",0],["鈴木 開発部長",1],["高橋 営業部長",1],["田中 開発",2],["伊藤 開発",2],["渡辺 営業",2]]'

actors:
  - 佐藤 社長: { kind: card, lane: ceo, stack: 0, subtitle: "最上位の階層" }
  - 鈴木 開発部長: { kind: card, lane: vp, stack: 0, subtitle: "中間の階層" }
  - 高橋 営業部長: { kind: card, lane: vp, stack: 1, subtitle: "中間の階層" }
  - 田中 開発: { kind: card, lane: ic, stack: 0, subtitle: "最下位の階層" }
  - 伊藤 開発: { kind: card, lane: ic, stack: 1, subtitle: "最下位の階層" }
  - 渡辺 営業: { kind: card, lane: ic, stack: 2, subtitle: "最下位の階層" }

flow:
  - 佐藤 社長 -> 鈴木 開発部長: "率いる" (info)
  - 佐藤 社長 -> 高橋 営業部長: "率いる" (info)
  - 鈴木 開発部長 -> 田中 開発: "まとめる" (accent)
  - 鈴木 開発部長 -> 伊藤 開発: "まとめる" (accent)
  - 高橋 営業部長 -> 渡辺 営業: "まとめる" (accent)

animation:
  - step: "創業した頃" 1.8s
    focus: ["佐藤 社長"]
    set:
      org: '[["佐藤 社長",0]]'
    description: "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。"
  - step: "役員を置く" 1.8s
    focus: ["佐藤 社長", "鈴木 開発部長", "高橋 営業部長"]
    set:
      org: '[["佐藤 社長",0],["鈴木 開発部長",1],["高橋 営業部長",1]]'
    description: "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。"
  - step: "現場が増える" 1.8s
    focus: ["佐藤 社長", "鈴木 開発部長", "高橋 営業部長", "田中 開発", "伊藤 開発", "渡辺 営業"]
    set:
      org: '[["佐藤 社長",0],["鈴木 開発部長",1],["高橋 営業部長",1],["田中 開発",2],["伊藤 開発",2],["渡辺 営業",2]]'
    description: "3 段目まで揃う。 2 段目の 2 人の下に 3 人が並び、6 つの箱で組織の全体が読める。"
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
      "label": "組織の階層"
    }
  ],
  "lanes": {
    "ceo": { "x": 0, "width": 220 },
    "vp": { "x": 260, "width": 220 },
    "ic": { "x": 520, "width": 260 }
  },
  "actors": [
    { "name": "佐藤 社長", "kind": "card", "lane": "ceo", "stack": 0, "subtitle": "最上位の階層" },
    { "name": "鈴木 開発部長", "kind": "card", "lane": "vp", "stack": 0, "subtitle": "中間の階層" },
    { "name": "高橋 営業部長", "kind": "card", "lane": "vp", "stack": 1, "subtitle": "中間の階層" },
    { "name": "田中 開発", "kind": "card", "lane": "ic", "stack": 0, "subtitle": "最下位の階層" },
    { "name": "伊藤 開発", "kind": "card", "lane": "ic", "stack": 1, "subtitle": "最下位の階層" },
    { "name": "渡辺 営業", "kind": "card", "lane": "ic", "stack": 2, "subtitle": "最下位の階層" }
  ],
  "flow": [
    { "from": "佐藤 社長", "to": "鈴木 開発部長", "label": "率いる", "tone": "info" },
    { "from": "佐藤 社長", "to": "高橋 営業部長", "label": "率いる", "tone": "info" },
    { "from": "鈴木 開発部長", "to": "田中 開発", "label": "まとめる", "tone": "accent" },
    { "from": "鈴木 開発部長", "to": "伊藤 開発", "label": "まとめる", "tone": "accent" },
    { "from": "高橋 営業部長", "to": "渡辺 営業", "label": "まとめる", "tone": "accent" }
  ],
  "states": {
    "org": "[[\\"佐藤 社長\\",0],[\\"鈴木 開発部長\\",1],[\\"高橋 営業部長\\",1],[\\"田中 開発\\",2],[\\"伊藤 開発\\",2],[\\"渡辺 営業\\",2]]"
  },
  "animation": [
    {
      "step": "創業した頃",
      "duration": 1.8,
      "focus": ["佐藤 社長"],
      "set": { "org": "[[\\"佐藤 社長\\",0]]" },
      "body": "階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。"
    },
    {
      "step": "役員を置く",
      "duration": 1.8,
      "focus": ["佐藤 社長", "鈴木 開発部長", "高橋 営業部長"],
      "set": { "org": "[[\\"佐藤 社長\\",0],[\\"鈴木 開発部長\\",1],[\\"高橋 営業部長\\",1]]" },
      "body": "2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。"
    },
    {
      "step": "現場が増える",
      "duration": 1.8,
      "focus": ["佐藤 社長", "鈴木 開発部長", "高橋 営業部長", "田中 開発", "伊藤 開発", "渡辺 営業"],
      "set": {
        "org": "[[\\"佐藤 社長\\",0],[\\"鈴木 開発部長\\",1],[\\"高橋 営業部長\\",1],[\\"田中 開発\\",2],[\\"伊藤 開発\\",2],[\\"渡辺 営業\\",2]]"
      },
      "body": "3 段目まで揃う。 2 段目の 2 人の下に 3 人が並び、6 つの箱で組織の全体が読める。"
    }
  ]
}`;

export const sourceYaml__npsTrendKpi = `title: "NPS の現在値と増減と推移を並べる"
type: flow

readouts:
  kt: { kind: kpi-trend-tile, source: "cur", prevSource: "prev", historySource: "hist", unit: "", colorPos: "#22c55e", colorNeg: "#ef4444", label: "NPS の推移" }

lanes:
  cur: { x: 0, width: 220 }
  delta: { x: 260, width: 220 }
  hist: { x: 520, width: 260 }

states:
  cur: 82
  prev: 75
  hist: "[60,65,70,75,80,82]"

actors:
  - 今月: { kind: card, lane: cur, stack: 0, subtitle: "大きく出る数" }
  - 先月: { kind: card, lane: delta, stack: 0, subtitle: "差を求めるもとの数" }
  - Delta2: { kind: card, lane: delta, stack: 1, subtitle: "今月 - 先月の差", title: "差" }
  - 推移: { kind: card, lane: hist, stack: 0, subtitle: "折れ線のもとになる並び" }

flow:
  - 今月 -> 先月: "比べる" (info)
  - 今月 -> 推移: "並べる" (success)

animation:
  - step: "下がった月" 1.8s
    focus: ["今月", "先月"]
    set:
      cur: 58
      prev: 64
      hist: "[70,68,66,64,60,58]"
    description: "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。"
  - step: "底を打つ" 1.8s
    focus: ["今月", "先月", "Delta2"]
    set:
      cur: 64
      prev: 64
      hist: "[68,66,64,60,58,64]"
    description: "今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。"
  - step: "持ち直す" 1.8s
    focus: ["今月", "先月", "Delta2", "推移"]
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
      "label": "NPS の推移"
    }
  ],
  "lanes": {
    "cur": { "x": 0, "width": 220 },
    "delta": { "x": 260, "width": 220 },
    "hist": { "x": 520, "width": 260 }
  },
  "actors": [
    { "name": "今月", "kind": "card", "lane": "cur", "stack": 0, "subtitle": "大きく出る数" },
    { "name": "先月", "kind": "card", "lane": "delta", "stack": 0, "subtitle": "差を求めるもとの数" },
    {
      "name": "Delta2",
      "kind": "card",
      "lane": "delta",
      "stack": 1,
      "subtitle": "今月 - 先月の差",
      "title": "差"
    },
    { "name": "推移", "kind": "card", "lane": "hist", "stack": 0, "subtitle": "折れ線のもとになる並び" }
  ],
  "flow": [
    { "from": "今月", "to": "先月", "label": "比べる", "tone": "info" },
    { "from": "今月", "to": "推移", "label": "並べる", "tone": "success" }
  ],
  "states": { "cur": 82, "prev": 75, "hist": "[60,65,70,75,80,82]" },
  "animation": [
    {
      "step": "下がった月",
      "duration": 1.8,
      "focus": ["今月", "先月"],
      "set": { "cur": 58, "prev": 64, "hist": "[70,68,66,64,60,58]" },
      "body": "今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。"
    },
    {
      "step": "底を打つ",
      "duration": 1.8,
      "focus": ["今月", "先月", "Delta2"],
      "set": { "cur": 64, "prev": 64, "hist": "[68,66,64,60,58,64]" },
      "body": "今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。"
    },
    {
      "step": "持ち直す",
      "duration": 1.8,
      "focus": ["今月", "先月", "Delta2", "推移"],
      "set": { "cur": 82, "prev": 75, "hist": "[60,65,70,75,80,82]" },
      "body": "今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。"
    }
  ]
}`;

export const sourceYaml__postReactionPoll = `title: "絵文字 3 種の投票を並べる"
type: flow

readouts:
  qp: { kind: quick-poll-emoji, source: "votes", colorWinner: "#2563eb", label: "反応" }

lanes:
  thumbs: { x: 0, width: 240 }
  heart: { x: 280, width: 240 }
  party: { x: 560, width: 240 }

states:
  votes: '[["👍",42],["❤️",28],["🎉",15]]'

actors:
  - 👍 Thumbs2: { kind: card, lane: thumbs, stack: 0, subtitle: "票が最も多い絵文字", title: "👍 いいね" }
  - ❤️ Heart2: { kind: card, lane: heart, stack: 0, subtitle: "次に多い絵文字", title: "❤️ 好き" }
  - 🎉 Party2: { kind: card, lane: party, stack: 0, subtitle: "票が最も少ない絵文字", title: "🎉 お祝い" }

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
      "label": "反応"
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
      "title": "👍 いいね"
    },
    {
      "name": "❤️ Heart2",
      "kind": "card",
      "lane": "heart",
      "stack": 0,
      "subtitle": "次に多い絵文字",
      "title": "❤️ 好き"
    },
    {
      "name": "🎉 Party2",
      "kind": "card",
      "lane": "party",
      "stack": 0,
      "subtitle": "票が最も少ない絵文字",
      "title": "🎉 お祝い"
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
  thread: '[5,8,"佐藤","12 分前"]'

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
      thread: '[0,4,"鈴木","2 時間前"]'
    badge: "静か"
    description: "未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。"
  - step: "新着が付く" 1.8s
    focus: ["未読", "参加者", "直近の発言者"]
    set:
      thread: '[3,6,"高橋","25 分前"]'
    badge: "新着"
    description: "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。"
  - step: "混雑する" 1.8s
    focus: ["未読", "参加者", "直近の発言者", "経過"]
    set:
      thread: '[5,8,"佐藤","12 分前"]'
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
  "states": { "thread": "[5,8,\\"佐藤\\",\\"12 分前\\"]" },
  "animation": [
    {
      "step": "静かなスレッド",
      "duration": 1.8,
      "focus": ["参加者"],
      "set": { "thread": "[0,4,\\"鈴木\\",\\"2 時間前\\"]" },
      "badge": "静か",
      "body": "未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。"
    },
    {
      "step": "新着が付く",
      "duration": 1.8,
      "focus": ["未読", "参加者", "直近の発言者"],
      "set": { "thread": "[3,6,\\"高橋\\",\\"25 分前\\"]" },
      "badge": "新着",
      "body": "未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。"
    },
    {
      "step": "混雑する",
      "duration": 1.8,
      "focus": ["未読", "参加者", "直近の発言者", "経過"],
      "set": { "thread": "[5,8,\\"佐藤\\",\\"12 分前\\"]" },
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
    description: "状態は 0。 送信の列だけが光り、灰の単チェックが出る (送ったが、まだ届いていない)。"
  - step: "配信完了" 1.5s
    focus: ["▶ 送信 (0)", "▶▶ 配信 (1)"]
    set:
      status: 1
    badge: "配信"
    description: "状態を 1 にすると配信の列も光り、灰の二重チェックに変わる (届いたが、まだ読まれていない)。"
  - step: "既読" 1.5s
    focus: ["▶ 送信 (0)", "▶▶ 配信 (1)", "◆ 既読 (2)"]
    set:
      status: 2
    badge: "既読"
    description: "状態を 2 にすると既読の列も光り、二重チェックが青に変わる (読まれたことが分かる)。"
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
      "body": "状態は 0。 送信の列だけが光り、灰の単チェックが出る (送ったが、まだ届いていない)。"
    },
    {
      "step": "配信完了",
      "duration": 1.5,
      "focus": ["▶ 送信 (0)", "▶▶ 配信 (1)"],
      "set": { "status": 1 },
      "badge": "配信",
      "body": "状態を 1 にすると配信の列も光り、灰の二重チェックに変わる (届いたが、まだ読まれていない)。"
    },
    {
      "step": "既読",
      "duration": 1.5,
      "focus": ["▶ 送信 (0)", "▶▶ 配信 (1)", "◆ 既読 (2)"],
      "set": { "status": 2 },
      "badge": "既読",
      "body": "状態を 2 にすると既読の列も光り、二重チェックが青に変わる (読まれたことが分かる)。"
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
  - ◆ パスワード: { kind: card, lane: input, stack: 0, subtitle: "いまの段階 {pw} · 伏せ字で出す" }
  - 4 区切りのメーター: { kind: card, lane: meter, stack: 0, subtitle: "段階 {pw} の数だけ色が付く" }
  - 段階の名前: { kind: card, lane: meter, stack: 1, subtitle: "メーターと同じ色で出る" }
  - ✓ 8 文字以上: { kind: card, lane: rules, stack: 0, subtitle: "段階 1 以上で満たす" }
  - ✓ 大小混合: { kind: card, lane: rules, stack: 1, subtitle: "段階 2 以上で満たす" }
  - ✓ 数字 + 記号: { kind: card, lane: rules, stack: 2, subtitle: "段階 3 以上で満たす" }

flow:
  - ◆ パスワード -> 4 区切りのメーター: "評価" (info)
  - 4 区切りのメーター -> 段階の名前: "注釈" (success)

animation:
  - step: "弱い (段階 1)" 1.5s
    focus: ["◆ パスワード", "4 区切りのメーター", "✓ 8 文字以上"]
    set:
      pw: 1
    badge: "弱い"
    description: "最初の入力で段階は 1。 メーターは 1 区切りだけ赤く、満たす決まりは 8 文字以上の 1 つだけ。 入力とメーターの列が光る。"
  - step: "改善中 (段階 1 → 3)" 2s
    focus: ["◆ パスワード", "4 区切りのメーター", "段階の名前", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"]
    tween:
      pw: 1 -> 3
    badge: "改善中"
    description: "文字を足して大文字と小文字を混ぜ、段階が 1 から 3 へ上がる。 メーターが赤から橙、黄、黄緑へ続けて変わり、残り 2 つの決まりも光る。"
  - step: "強い (段階 4)" 1.5s
    focus: ["◆ パスワード", "4 区切りのメーター", "段階の名前", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"]
    set:
      pw: 4
    badge: "強い"
    description: "数字と記号を足して段階が 4 になる。 メーターは 4 区切りすべてが緑になり、決まりを全部満たして 6 つの箱がすべて光る。"
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
      "name": "◆ パスワード",
      "kind": "card",
      "lane": "input",
      "stack": 0,
      "subtitle": "いまの段階 {pw} · 伏せ字で出す"
    },
    {
      "name": "4 区切りのメーター",
      "kind": "card",
      "lane": "meter",
      "stack": 0,
      "subtitle": "段階 {pw} の数だけ色が付く"
    },
    {
      "name": "段階の名前",
      "kind": "card",
      "lane": "meter",
      "stack": 1,
      "subtitle": "メーターと同じ色で出る"
    },
    {
      "name": "✓ 8 文字以上",
      "kind": "card",
      "lane": "rules",
      "stack": 0,
      "subtitle": "段階 1 以上で満たす"
    },
    {
      "name": "✓ 大小混合",
      "kind": "card",
      "lane": "rules",
      "stack": 1,
      "subtitle": "段階 2 以上で満たす"
    },
    {
      "name": "✓ 数字 + 記号",
      "kind": "card",
      "lane": "rules",
      "stack": 2,
      "subtitle": "段階 3 以上で満たす"
    }
  ],
  "flow": [
    { "from": "◆ パスワード", "to": "4 区切りのメーター", "label": "評価", "tone": "info" },
    { "from": "4 区切りのメーター", "to": "段階の名前", "label": "注釈", "tone": "success" }
  ],
  "states": { "pw": 1 },
  "animation": [
    {
      "step": "弱い (段階 1)",
      "duration": 1.5,
      "focus": ["◆ パスワード", "4 区切りのメーター", "✓ 8 文字以上"],
      "set": { "pw": 1 },
      "badge": "弱い",
      "body": "最初の入力で段階は 1。 メーターは 1 区切りだけ赤く、満たす決まりは 8 文字以上の 1 つだけ。 入力とメーターの列が光る。"
    },
    {
      "step": "改善中 (段階 1 → 3)",
      "duration": 2,
      "focus": ["◆ パスワード", "4 区切りのメーター", "段階の名前", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"],
      "tween": { "pw": [1, 3] },
      "badge": "改善中",
      "body": "文字を足して大文字と小文字を混ぜ、段階が 1 から 3 へ上がる。 メーターが赤から橙、黄、黄緑へ続けて変わり、残り 2 つの決まりも光る。"
    },
    {
      "step": "強い (段階 4)",
      "duration": 1.5,
      "focus": ["◆ パスワード", "4 区切りのメーター", "段階の名前", "✓ 8 文字以上", "✓ 大小混合", "✓ 数字 + 記号"],
      "set": { "pw": 4 },
      "badge": "強い",
      "body": "数字と記号を足して段階が 4 になる。 メーターは 4 区切りすべてが緑になり、決まりを全部満たして 6 つの箱がすべて光る。"
    }
  ]
}`;

export const sourceYaml__loginOtpVerify = `title: "OTP 6 桁の入力から検証までを追う"
type: flow

readouts:
  oi: { kind: otp-input, source: "otp", colorFocus: "#2563eb", label: "確認コード" }

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
      "label": "確認コード"
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
  - 未選択: { kind: card, lane: col1, stack: 0, subtitle: "破線の枠と上向きの矢印", posW: 280 }
  - ◆ 顔写真.png: { kind: card, lane: col2, stack: 0, subtitle: "実線枠 · ファイル名カード", posW: 310 }
  - ▶ 円形アバター: { kind: card, lane: col1, stack: 1, subtitle: "80×80 クロップ表示", posW: 220 }

flow:
  - 未選択 -> ◆ 顔写真.png: "置く" (info)
  - ◆ 顔写真.png -> ▶ 円形アバター: "プレビュー" (success)

animation:
  - step: "未選択" 1.5s
    focus: ["未選択"]
    set:
      file: ""
    badge: "未選択"
    description: "ファイルは空。 未選択の箱だけが光り、置き場は破線の枠に上向きの矢印と案内を出す。"
  - step: "ドロップ受信" 2s
    focus: ["未選択", "◆ 顔写真.png"]
    set:
      file: "顔写真.png"
    badge: "アップロード"
    description: "ファイルを空から「顔写真.png」 に切り替え、アップロードの箱も光る。 置き場は実線の枠に変わり、ファイル名の札を出す。"
  - step: "プレビュー表示" 1.5s
    focus: ["未選択", "◆ 顔写真.png", "▶ 円形アバター"]
    set:
      file: "顔写真.png"
    badge: "完了"
    description: "アップロードが終わり、プレビューの箱も光る。 丸く切り抜いた顔写真が出て、3 つの箱がすべて光る。"
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
      "subtitle": "破線の枠と上向きの矢印",
      "posW": 280
    },
    {
      "name": "◆ 顔写真.png",
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
    { "from": "未選択", "to": "◆ 顔写真.png", "label": "置く", "tone": "info" },
    { "from": "◆ 顔写真.png", "to": "▶ 円形アバター", "label": "プレビュー", "tone": "success" }
  ],
  "states": { "file": "" },
  "animation": [
    {
      "step": "未選択",
      "duration": 1.5,
      "focus": ["未選択"],
      "set": { "file": "" },
      "badge": "未選択",
      "body": "ファイルは空。 未選択の箱だけが光り、置き場は破線の枠に上向きの矢印と案内を出す。"
    },
    {
      "step": "ドロップ受信",
      "duration": 2,
      "focus": ["未選択", "◆ 顔写真.png"],
      "set": { "file": "顔写真.png" },
      "badge": "アップロード",
      "body": "ファイルを空から「顔写真.png」 に切り替え、アップロードの箱も光る。 置き場は実線の枠に変わり、ファイル名の札を出す。"
    },
    {
      "step": "プレビュー表示",
      "duration": 1.5,
      "focus": ["未選択", "◆ 顔写真.png", "▶ 円形アバター"],
      "set": { "file": "顔写真.png" },
      "badge": "完了",
      "body": "アップロードが終わり、プレビューの箱も光る。 丸く切り抜いた顔写真が出て、3 つの箱がすべて光る。"
    }
  ]
}`;

export const sourceYaml__prodLogTail = `title: "本番ログ直近 5 行を重要度付きで流す"
type: flow

readouts:
  ls: { kind: log-stream, source: "logs", label: "ログの末尾" }

lanes:
  ts: { x: 0, width: 180 }
  level: { x: 200, width: 140 }
  msg: { x: 360, width: 340 }

states:
  logs: '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"ワーカーが落ちた: メモリ不足"],["09:02:02",1,"ワーカーを再起動した"]]'

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
      logs: '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"]]'
    badge: "通常"
    description: "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。"
  - step: "注意が出る" 1.8s
    focus: ["時刻列", "レベル列", "情報の行", "注意の行"]
    set:
      logs: '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"],["09:01:03",2,"メモリ使用率 82%"]]'
    badge: "警告"
    description: "橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。"
  - step: "異常が出る" 1.8s
    focus: ["時刻列", "レベル列", "情報の行", "注意の行", "異常の行"]
    set:
      logs: '[["09:00:12",1,"サーバの起動が済んだ"],["09:00:15",1,"DB の接続の枠 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"ワーカーが落ちた: メモリ不足"],["09:02:02",1,"ワーカーを再起動した"],["09:02:30",1,"死活監視で正常"]]'
    badge: "障害"
    description: "行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。"
`;

export const sourceJson__prodLogTail = `{
  "title": "本番ログ直近 5 行を重要度付きで流す",
  "type": "flow",
  "readouts": [
    { "id": "ls", "kind": "log-stream", "source": "logs", "label": "ログの末尾" }
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
    "logs": "[[\\"09:00:12\\",1,\\"サーバの起動が済んだ\\"],[\\"09:00:15\\",1,\\"DB の接続の枠 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"],[\\"09:01:47\\",3,\\"ワーカーが落ちた: メモリ不足\\"],[\\"09:02:02\\",1,\\"ワーカーを再起動した\\"]]"
  },
  "animation": [
    {
      "step": "通常運転",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"サーバの起動が済んだ\\"],[\\"09:00:15\\",1,\\"DB の接続の枠 20\\"]]"
      },
      "badge": "通常",
      "body": "情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。"
    },
    {
      "step": "注意が出る",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行", "注意の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"サーバの起動が済んだ\\"],[\\"09:00:15\\",1,\\"DB の接続の枠 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"]]"
      },
      "badge": "警告",
      "body": "橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。"
    },
    {
      "step": "異常が出る",
      "duration": 1.8,
      "focus": ["時刻列", "レベル列", "情報の行", "注意の行", "異常の行"],
      "set": {
        "logs": "[[\\"09:00:12\\",1,\\"サーバの起動が済んだ\\"],[\\"09:00:15\\",1,\\"DB の接続の枠 20\\"],[\\"09:01:03\\",2,\\"メモリ使用率 82%\\"],[\\"09:01:47\\",3,\\"ワーカーが落ちた: メモリ不足\\"],[\\"09:02:02\\",1,\\"ワーカーを再起動した\\"],[\\"09:02:30\\",1,\\"死活監視で正常\\"]]"
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
    badge: "情報"
    description: "重要度が最も低い。 帯は青で、印は情報を表す形になる。"
  - step: "注意に上がる" 1.8s
    focus: ["きっかけ", "重要度", "重要度の印"]
    set:
      alert: '[2,"CPU 92% を 5 分継続 — 調査要"]'
    badge: "注意"
    description: "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。"
  - step: "異常に上がる" 1.8s
    focus: ["きっかけ", "重要度", "重要度の印", "対応"]
    set:
      alert: '[3,"本番機 3 号が応答なし — 切替が要る"]'
    badge: "異常"
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
      "badge": "情報",
      "body": "重要度が最も低い。 帯は青で、印は情報を表す形になる。"
    },
    {
      "step": "注意に上がる",
      "duration": 1.8,
      "focus": ["きっかけ", "重要度", "重要度の印"],
      "set": { "alert": "[2,\\"CPU 92% を 5 分継続 — 調査要\\"]" },
      "badge": "注意",
      "body": "重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。"
    },
    {
      "step": "異常に上がる",
      "duration": 1.8,
      "focus": ["きっかけ", "重要度", "重要度の印", "対応"],
      "set": { "alert": "[3,\\"本番機 3 号が応答なし — 切替が要る\\"]" },
      "badge": "異常",
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
  svcs: '[["API",2],["画面",2],["認証",2],["DB",1],["一時保存",1],["待ち行列",0]]'

actors:
  - API: { kind: card, lane: up, stack: 0, subtitle: "稼働を表す緑のマス" }
  - 画面: { kind: card, lane: up, stack: 1, subtitle: "稼働を表す緑のマス" }
  - 認証: { kind: card, lane: up, stack: 2, subtitle: "稼働を表す緑のマス" }
  - DB: { kind: card, lane: deg, stack: 0, subtitle: "劣化を表す黄のマス" }
  - 一時保存: { kind: card, lane: deg, stack: 1, subtitle: "劣化を表す黄のマス" }
  - 待ち行列: { kind: card, lane: down, stack: 0, subtitle: "停止を表す赤のマス" }

flow:
  - DB -> 待ち行列: "波及" (error)

animation:
  - step: "全て稼働" 1.8s
    focus: ["API", "画面", "認証"]
    set:
      svcs: '[["API",2],["画面",2],["認証",2],["DB",2],["一時保存",2],["待ち行列",2]]'
    badge: "全稼働"
    description: "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。"
  - step: "一部が劣化" 1.8s
    focus: ["API", "画面", "認証", "DB", "一時保存"]
    set:
      svcs: '[["API",2],["画面",2],["認証",2],["DB",1],["一時保存",1],["待ち行列",2]]'
    badge: "劣化"
    description: "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。"
  - step: "1 つが停止" 1.8s
    focus: ["API", "画面", "認証", "DB", "一時保存", "待ち行列"]
    set:
      svcs: '[["API",2],["画面",2],["認証",2],["DB",1],["一時保存",1],["待ち行列",0]]'
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
    { "name": "API", "kind": "card", "lane": "up", "stack": 0, "subtitle": "稼働を表す緑のマス" },
    { "name": "画面", "kind": "card", "lane": "up", "stack": 1, "subtitle": "稼働を表す緑のマス" },
    { "name": "認証", "kind": "card", "lane": "up", "stack": 2, "subtitle": "稼働を表す緑のマス" },
    { "name": "DB", "kind": "card", "lane": "deg", "stack": 0, "subtitle": "劣化を表す黄のマス" },
    { "name": "一時保存", "kind": "card", "lane": "deg", "stack": 1, "subtitle": "劣化を表す黄のマス" },
    { "name": "待ち行列", "kind": "card", "lane": "down", "stack": 0, "subtitle": "停止を表す赤のマス" }
  ],
  "flow": [
    { "from": "DB", "to": "待ち行列", "label": "波及", "tone": "error" }
  ],
  "states": { "svcs": "[[\\"API\\",2],[\\"画面\\",2],[\\"認証\\",2],[\\"DB\\",1],[\\"一時保存\\",1],[\\"待ち行列\\",0]]" },
  "animation": [
    {
      "step": "全て稼働",
      "duration": 1.8,
      "focus": ["API", "画面", "認証"],
      "set": {
        "svcs": "[[\\"API\\",2],[\\"画面\\",2],[\\"認証\\",2],[\\"DB\\",2],[\\"一時保存\\",2],[\\"待ち行列\\",2]]"
      },
      "badge": "全稼働",
      "body": "6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。"
    },
    {
      "step": "一部が劣化",
      "duration": 1.8,
      "focus": ["API", "画面", "認証", "DB", "一時保存"],
      "set": {
        "svcs": "[[\\"API\\",2],[\\"画面\\",2],[\\"認証\\",2],[\\"DB\\",1],[\\"一時保存\\",1],[\\"待ち行列\\",2]]"
      },
      "badge": "劣化",
      "body": "2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。"
    },
    {
      "step": "1 つが停止",
      "duration": 1.8,
      "focus": ["API", "画面", "認証", "DB", "一時保存", "待ち行列"],
      "set": {
        "svcs": "[[\\"API\\",2],[\\"画面\\",2],[\\"認証\\",2],[\\"DB\\",1],[\\"一時保存\\",1],[\\"待ち行列\\",0]]"
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
  plan: '["標準",29,"10 席","優先サポート","カスタムドメイン"]'

actors:
  - Starter2: { kind: card, lane: starter, stack: 0, subtitle: "最も安いプラン", title: "入門" }
  - Pro2: { kind: card, lane: pro, stack: 0, subtitle: "中間のプラン", title: "標準" }
  - 特典の欄: { kind: card, lane: pro, stack: 1, subtitle: "名前と価格の後に並ぶ特典" }
  - Enterprise2: { kind: card, lane: enterprise, stack: 0, subtitle: "最も高いプラン", title: "法人" }

flow:
  - Starter2 -> Pro2: "アップグレード" (info)
  - Pro2 -> Enterprise2: "アップグレード" (success)

animation:
  - step: "最も安いプラン" 1.8s
    focus: ["Starter2"]
    set:
      plan: '["入門",9,"3 席"]'
    badge: "入門"
    description: "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。"
  - step: "中間のプラン" 1.8s
    focus: ["Starter2", "Pro2", "特典の欄"]
    set:
      plan: '["標準",29,"10 席","優先サポート","カスタムドメイン"]'
    badge: "標準"
    description: "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。"
  - step: "最も高いプラン" 1.8s
    focus: ["Starter2", "Pro2", "特典の欄", "Enterprise2"]
    set:
      plan: '["法人",99,"無制限の席","専任の担当","監査ログ","一括ログイン","稼働の保証"]'
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
      "title": "入門"
    },
    {
      "name": "Pro2",
      "kind": "card",
      "lane": "pro",
      "stack": 0,
      "subtitle": "中間のプラン",
      "title": "標準"
    },
    { "name": "特典の欄", "kind": "card", "lane": "pro", "stack": 1, "subtitle": "名前と価格の後に並ぶ特典" },
    {
      "name": "Enterprise2",
      "kind": "card",
      "lane": "enterprise",
      "stack": 0,
      "subtitle": "最も高いプラン",
      "title": "法人"
    }
  ],
  "flow": [
    { "from": "Starter2", "to": "Pro2", "label": "アップグレード", "tone": "info" },
    { "from": "Pro2", "to": "Enterprise2", "label": "アップグレード", "tone": "success" }
  ],
  "states": { "plan": "[\\"標準\\",29,\\"10 席\\",\\"優先サポート\\",\\"カスタムドメイン\\"]" },
  "animation": [
    {
      "step": "最も安いプラン",
      "duration": 1.8,
      "focus": ["Starter2"],
      "set": { "plan": "[\\"入門\\",9,\\"3 席\\"]" },
      "badge": "入門",
      "body": "名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。"
    },
    {
      "step": "中間のプラン",
      "duration": 1.8,
      "focus": ["Starter2", "Pro2", "特典の欄"],
      "set": { "plan": "[\\"標準\\",29,\\"10 席\\",\\"優先サポート\\",\\"カスタムドメイン\\"]" },
      "badge": "標準",
      "body": "価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。"
    },
    {
      "step": "最も高いプラン",
      "duration": 1.8,
      "focus": ["Starter2", "Pro2", "特典の欄", "Enterprise2"],
      "set": { "plan": "[\\"法人\\",99,\\"無制限の席\\",\\"専任の担当\\",\\"監査ログ\\",\\"一括ログイン\\",\\"稼働の保証\\"]" },
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
  coupon: '["春割20",20]'

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
      coupon: '["春割20",0]'
    badge: "入力済"
    description: "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。"
  - step: "適用する" 1.8s
    focus: ["未入力", "入力済", "適用ボタン", "適用済"]
    set:
      coupon: '["春割20",20]'
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
  "states": { "coupon": "[\\"春割20\\",20]" },
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
      "set": { "coupon": "[\\"春割20\\",0]" },
      "badge": "入力済",
      "body": "符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。"
    },
    {
      "step": "適用する",
      "duration": 1.8,
      "focus": ["未入力", "入力済", "適用ボタン", "適用済"],
      "set": { "coupon": "[\\"春割20\\",20]" },
      "badge": "適用",
      "body": "割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。"
    }
  ]
}`;

export const sourceYaml__blogArticlePreview = `title: "記事カードの見出しと抜粋と著者を並べる"
type: flow

readouts:
  ap: { kind: article-preview, source: "article", colorAccent: "#2563eb", label: "記事カード" }

lanes:
  thumb: { x: 0, width: 200 }
  content: { x: 220, width: 320 }
  meta: { x: 560, width: 220 }

states:
  article: '["dragon 入門","dragon で操作できる図を作る","佐藤","2 時間前"]'

actors:
  - サムネイル: { kind: card, lane: thumb, stack: 0, subtitle: "配列の値に依らず固定" }
  - タイトル: { kind: card, lane: content, stack: 0, subtitle: "札の上に太字で出る見出し" }
  - 抜粋: { kind: card, lane: content, stack: 1, subtitle: "見出しの下に出る本文" }
  - 著者: { kind: card, lane: meta, stack: 0, subtitle: "記事を書いた人の名前" }
  - 経過: { kind: card, lane: meta, stack: 1, subtitle: "記事の公開からの経過" }

flow:
  - サムネイル -> タイトル: "視線" (info)
  - タイトル -> 著者: "帰属" (success)

animation:
  - step: "短い記事" 1.8s
    focus: ["サムネイル", "タイトル"]
    set:
      article: '["入門","はじめの一歩","鈴木","5 分前"]'
    badge: "初期"
    description: "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。"
  - step: "題と抜粋が伸びる" 1.8s
    focus: ["サムネイル", "タイトル", "抜粋"]
    set:
      article: '["dragon 入門","dragon で操作できる図を作る","佐藤","2 時間前"]'
    badge: "かざす"
    description: "題と抜粋が長くなる。 どちらも札の幅に収まる長さで、4 つの値の位置は変わらない。"
  - step: "別の記事" 1.8s
    focus: ["サムネイル", "タイトル", "抜粋", "著者", "経過"]
    set:
      article: '["操作できる図の手引き 2026 年版","段ごとの変化と表示部品の連動を解説","高橋","3 日前"]'
    badge: "押す"
    description: "4 つの値がすべて別の記事のものに入れ替わる。 札の形は変わらず、著者と経過の行も入れ替わる。"
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
      "label": "記事カード"
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
      "subtitle": "札の上に太字で出る見出し"
    },
    { "name": "抜粋", "kind": "card", "lane": "content", "stack": 1, "subtitle": "見出しの下に出る本文" },
    { "name": "著者", "kind": "card", "lane": "meta", "stack": 0, "subtitle": "記事を書いた人の名前" },
    { "name": "経過", "kind": "card", "lane": "meta", "stack": 1, "subtitle": "記事の公開からの経過" }
  ],
  "flow": [
    { "from": "サムネイル", "to": "タイトル", "label": "視線", "tone": "info" },
    { "from": "タイトル", "to": "著者", "label": "帰属", "tone": "success" }
  ],
  "states": { "article": "[\\"dragon 入門\\",\\"dragon で操作できる図を作る\\",\\"佐藤\\",\\"2 時間前\\"]" },
  "animation": [
    {
      "step": "短い記事",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル"],
      "set": { "article": "[\\"入門\\",\\"はじめの一歩\\",\\"鈴木\\",\\"5 分前\\"]" },
      "badge": "初期",
      "body": "題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。"
    },
    {
      "step": "題と抜粋が伸びる",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル", "抜粋"],
      "set": {
        "article": "[\\"dragon 入門\\",\\"dragon で操作できる図を作る\\",\\"佐藤\\",\\"2 時間前\\"]"
      },
      "badge": "かざす",
      "body": "題と抜粋が長くなる。 どちらも札の幅に収まる長さで、4 つの値の位置は変わらない。"
    },
    {
      "step": "別の記事",
      "duration": 1.8,
      "focus": ["サムネイル", "タイトル", "抜粋", "著者", "経過"],
      "set": {
        "article": "[\\"操作できる図の手引き 2026 年版\\",\\"段ごとの変化と表示部品の連動を解説\\",\\"高橋\\",\\"3 日前\\"]"
      },
      "badge": "押す",
      "body": "4 つの値がすべて別の記事のものに入れ替わる。 札の形は変わらず、著者と経過の行も入れ替わる。"
    }
  ]
}`;

export const sourceYaml__docsTocNav = `title: "3 段の目次と現在位置を見せる"
type: flow

readouts:
  tn: { kind: toc-nav, source: "toc", colorActive: "#2563eb", label: "文書の目次" }

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
    badge: "はじめに"
    description: "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。"
  - step: "下へ進む" 1.8s
    focus: ["はじめに", "スタートガイド"]
    set:
      toc: '[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
    badge: "導入"
    description: "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。"
  - step: "さらに下へ" 1.8s
    focus: ["はじめに", "API リファレンス", "スタートガイド", "高度な使い方", "インストール", "最初の図"]
    set:
      toc: '[[0,"はじめに",0],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]'
    badge: "最初の図"
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
      "label": "文書の目次"
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
      "badge": "はじめに",
      "body": "先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。"
    },
    {
      "step": "下へ進む",
      "duration": 1.8,
      "focus": ["はじめに", "スタートガイド"],
      "set": {
        "toc": "[[0,\\"はじめに\\",0],[1,\\"スタートガイド\\",1],[2,\\"インストール\\",0],[2,\\"最初の図\\",0],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]"
      },
      "badge": "導入",
      "body": "青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。"
    },
    {
      "step": "さらに下へ",
      "duration": 1.8,
      "focus": ["はじめに", "API リファレンス", "スタートガイド", "高度な使い方", "インストール", "最初の図"],
      "set": {
        "toc": "[[0,\\"はじめに\\",0],[1,\\"スタートガイド\\",0],[2,\\"インストール\\",0],[2,\\"最初の図\\",1],[1,\\"高度な使い方\\",0],[0,\\"API リファレンス\\",0]]"
      },
      "badge": "最初の図",
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
  - tw2: { kind: card, lane: tw, stack: 0, subtitle: "共有が最も多い先", title: "X" }
  - fb2: { kind: card, lane: fb, stack: 0, subtitle: "次に多い先", title: "フェイスブック" }
  - li2: { kind: card, lane: li, stack: 0, subtitle: "中ほどの先", title: "リンクトイン" }
  - レディット: { kind: card, lane: li, stack: 1, subtitle: "共有が最も少ない先" }

flow:
  - tw2 -> fb2: "拡散" (info)
  - fb2 -> li2: "拡散" (info)
  - li2 -> レディット: "拡散" (info)

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
    focus: ["tw2", "fb2", "li2", "レディット"]
    set:
      shares: '[["tw",245],["fb",89],["li",32],["rd",18],["ig",6]]'
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
      "title": "X"
    },
    {
      "name": "fb2",
      "kind": "card",
      "lane": "fb",
      "stack": 0,
      "subtitle": "次に多い先",
      "title": "フェイスブック"
    },
    {
      "name": "li2",
      "kind": "card",
      "lane": "li",
      "stack": 0,
      "subtitle": "中ほどの先",
      "title": "リンクトイン"
    },
    { "name": "レディット", "kind": "card", "lane": "li", "stack": 1, "subtitle": "共有が最も少ない先" }
  ],
  "flow": [
    { "from": "tw2", "to": "fb2", "label": "拡散", "tone": "info" },
    { "from": "fb2", "to": "li2", "label": "拡散", "tone": "info" },
    { "from": "li2", "to": "レディット", "label": "拡散", "tone": "info" }
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
      "focus": ["tw2", "fb2", "li2", "レディット"],
      "set": { "shares": "[[\\"tw\\",245],[\\"fb\\",89],[\\"li\\",32],[\\"rd\\",18],[\\"ig\\",6]]" },
      "badge": "バズ",
      "body": "4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。"
    }
  ]
}`;

export const sourceYaml__exemplarPaymentFlow = `title: "EC 決済を購入から記帳まで 4 段階で追う"
type: flow

readouts:
  amountStat: { kind: stat, source: "amount", caption: "決済金額", unit: " 円", label: "金額" }
  authGauge: { kind: gauge, source: "auth3ds", min: 0, max: 100, color: "#22c55e", label: "本人認証 %" }
  statusTL: { kind: traffic-light, source: "txStatus", label: "決済の状態" }
  totalCU: { kind: countup, source: "totalTx", decimals: 0, unit: " 件", label: "本日の取引の累計" }

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
  - 田中様: { kind: shape-person, lane: customer-lane, stack: 0, eyebrow: "顧客", subtitle: "購入者" }
  - iPhone: { kind: shape-mobile-device, lane: customer-lane, stack: 1, eyebrow: "端末", subtitle: "iOS 17 のブラウザ" }
  - VISA **1234: { kind: shape-credit-card, lane: customer-lane, stack: 2, eyebrow: "カード", subtitle: "発行銀行のカード" }
  - ひだまり雑貨店: { kind: shape-online-shop, lane: processor, stack: 0, eyebrow: "加盟店", subtitle: "会計 · ¥{amount}" }
  - API の入口: { kind: shape-api-gateway, lane: processor, stack: 1, eyebrow: "入口", subtitle: "認証と回数の制限" }
  - Stripe: { kind: shape-payment-provider, lane: processor, stack: 2, eyebrow: "決済代行", subtitle: "本人認証 {auth3ds}%" }
  - 発行銀行: { kind: shape-bank, lane: bank, stack: 0, eyebrow: "銀行", subtitle: "カードの発行元 · 与信照会" }
  - 取引台帳: { kind: shape-cylinder, lane: bank, stack: 1, eyebrow: "記録", subtitle: "記帳と監査の記録" }

flow:
  - 田中様 -> iPhone: "操作" (info)
  - iPhone -> ひだまり雑貨店: "購入" (info)
  - ひだまり雑貨店 -> API の入口: "購入を送る" (info)
  - API の入口 -> Stripe: "転送" (info)
  - VISA **1234 -> Stripe: "本人認証" (accent)
  - Stripe -> 発行銀行: "決済要求" (success)
  - 発行銀行 -> 取引台帳: "記帳" (success)

animation:
  - step: "商品購入" 2.2s
    focus: ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店"]
    tween:
      amount: 0 -> 12500
    set:
      txStatus: 0
      auth3ds: 0
    badge: "購入"
    description: "田中様が iPhone で店に入り、会計で購入を決める。 金額が 0 から 12500 円まで上がり、決済の状態は赤、本人認証の針は最も下にある。 顧客と店の列が光る。"
  - step: "本人認証" 2.5s
    focus: ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe"]
    tween:
      txStatus: 0 -> 1
      auth3ds: 0 -> 92
    badge: "本人認証"
    description: "入口を通って Stripe へ送り、VISA カードの本人認証を行う。 決済の状態が赤から黄へ、本人認証の針が 92% の緑の域まで上がる。 処理の列がすべて光り、カードから決済代行への矢印が強調される。"
  - step: "銀行確定" 2s
    focus: ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe", "発行銀行"]
    tween:
      txStatus: 1 -> 2
      auth3ds: 92 -> 98
    badge: "銀行確定"
    description: "本人認証を通り、発行銀行に与信を照会して決済を確定する。 決済の状態が黄から緑へ、本人認証が 98% まで上がって確定し、銀行の列が光る。"
  - step: "記帳完了" 1.8s
    focus: ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe", "発行銀行", "取引台帳"]
    tween:
      totalTx: 1247 -> 1248
    set:
      txStatus: 2
    badge: "記帳完了"
    description: "銀行が取引台帳に記帳し、監査の記録を残す。 本日の取引の累計が 800ms かけて 1 件増え、8 つの形がすべて光って決済が終わる。"
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
      "label": "本人認証 %"
    },
    { "id": "statusTL", "kind": "traffic-light", "source": "txStatus", "label": "決済の状態" },
    {
      "id": "totalCU",
      "kind": "countup",
      "source": "totalTx",
      "decimals": 0,
      "unit": " 件",
      "label": "本日の取引の累計"
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
      "eyebrow": "顧客",
      "subtitle": "購入者"
    },
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "customer-lane",
      "stack": 1,
      "eyebrow": "端末",
      "subtitle": "iOS 17 のブラウザ"
    },
    {
      "name": "VISA **1234",
      "kind": "shape-credit-card",
      "lane": "customer-lane",
      "stack": 2,
      "eyebrow": "カード",
      "subtitle": "発行銀行のカード"
    },
    {
      "name": "ひだまり雑貨店",
      "kind": "shape-online-shop",
      "lane": "processor",
      "stack": 0,
      "eyebrow": "加盟店",
      "subtitle": "会計 · ¥{amount}"
    },
    {
      "name": "API の入口",
      "kind": "shape-api-gateway",
      "lane": "processor",
      "stack": 1,
      "eyebrow": "入口",
      "subtitle": "認証と回数の制限"
    },
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "processor",
      "stack": 2,
      "eyebrow": "決済代行",
      "subtitle": "本人認証 {auth3ds}%"
    },
    {
      "name": "発行銀行",
      "kind": "shape-bank",
      "lane": "bank",
      "stack": 0,
      "eyebrow": "銀行",
      "subtitle": "カードの発行元 · 与信照会"
    },
    {
      "name": "取引台帳",
      "kind": "shape-cylinder",
      "lane": "bank",
      "stack": 1,
      "eyebrow": "記録",
      "subtitle": "記帳と監査の記録"
    }
  ],
  "flow": [
    { "from": "田中様", "to": "iPhone", "label": "操作", "tone": "info" },
    { "from": "iPhone", "to": "ひだまり雑貨店", "label": "購入", "tone": "info" },
    { "from": "ひだまり雑貨店", "to": "API の入口", "label": "購入を送る", "tone": "info" },
    { "from": "API の入口", "to": "Stripe", "label": "転送", "tone": "info" },
    { "from": "VISA **1234", "to": "Stripe", "label": "本人認証", "tone": "accent" },
    { "from": "Stripe", "to": "発行銀行", "label": "決済要求", "tone": "success" },
    { "from": "発行銀行", "to": "取引台帳", "label": "記帳", "tone": "success" }
  ],
  "states": { "amount": 0, "auth3ds": 0, "txStatus": 0, "totalTx": 1247 },
  "animation": [
    {
      "step": "商品購入",
      "duration": 2.2,
      "focus": ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店"],
      "tween": { "amount": [0, 12500] },
      "set": { "txStatus": 0, "auth3ds": 0 },
      "badge": "購入",
      "body": "田中様が iPhone で店に入り、会計で購入を決める。 金額が 0 から 12500 円まで上がり、決済の状態は赤、本人認証の針は最も下にある。 顧客と店の列が光る。"
    },
    {
      "step": "本人認証",
      "duration": 2.5,
      "focus": ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe"],
      "tween": { "txStatus": [0, 1], "auth3ds": [0, 92] },
      "badge": "本人認証",
      "body": "入口を通って Stripe へ送り、VISA カードの本人認証を行う。 決済の状態が赤から黄へ、本人認証の針が 92% の緑の域まで上がる。 処理の列がすべて光り、カードから決済代行への矢印が強調される。"
    },
    {
      "step": "銀行確定",
      "duration": 2,
      "focus": ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe", "発行銀行"],
      "tween": { "txStatus": [1, 2], "auth3ds": [92, 98] },
      "badge": "銀行確定",
      "body": "本人認証を通り、発行銀行に与信を照会して決済を確定する。 決済の状態が黄から緑へ、本人認証が 98% まで上がって確定し、銀行の列が光る。"
    },
    {
      "step": "記帳完了",
      "duration": 1.8,
      "focus": ["田中様", "iPhone", "VISA **1234", "ひだまり雑貨店", "API の入口", "Stripe", "発行銀行", "取引台帳"],
      "tween": { "totalTx": [1247, 1248] },
      "set": { "txStatus": 2 },
      "badge": "記帳完了",
      "body": "銀行が取引台帳に記帳し、監査の記録を残す。 本日の取引の累計が 800ms かけて 1 件増え、8 つの形がすべて光って決済が終わる。"
    }
  ]
}`;

export const sourceYaml__exemplarLoginFlow = `title: "ログインと 2 要素認証を 5 段階で追う"
type: flow

readouts:
  statusTL: { kind: traffic-light, source: "authStatus", label: "認証の状態 (0/1/2)" }
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
  - 山田様: { kind: shape-person, lane: user, stack: 0, eyebrow: "利用者", subtitle: "メールとパスワードを送る" }
  - スマートフォン: { kind: shape-mobile-device, lane: user, stack: 1, eyebrow: "端末", subtitle: "Android 14 のブラウザ" }
  - 認証 API: { kind: shape-server-rack, lane: auth, stack: 0, eyebrow: "サーバ", subtitle: "資格情報の一次検証" }
  - 2 段階が要る?: { kind: shape-diamond, lane: auth, stack: 1, eyebrow: "分岐", subtitle: "認証アプリの 6 桁か SMS" }
  - JWT 発行器: { kind: shape-hexagon, lane: auth, stack: 2, eyebrow: "署名", subtitle: "署名する · 有効は 1 時間" }
  - Redis: { kind: shape-cylinder, lane: session-lane, stack: 0, eyebrow: "一時保存", subtitle: "保持は 3600 秒" }
  - JWT トークン: { kind: shape-cloud, lane: session-lane, stack: 1, eyebrow: "応答", subtitle: "応答に付けて返す · 画面を移す" }

flow:
  - 山田様 -> スマートフォン: "入力" (info)
  - スマートフォン -> 認証 API: "認証を求める" (info)
  - 認証 API -> 2 段階が要る?: "一次を通過" (success)
  - 2 段階が要る? -> JWT 発行器: "2 段階目を通過" (success)
  - JWT 発行器 -> Redis: "セッションを保存" (success)
  - Redis -> JWT トークン: "トークンを発行" (success)

animation:
  - step: "認証要求" 1.5s
    focus: ["山田様", "スマートフォン"]
    tween:
      latency: 0 -> 80
    set:
      authStatus: 0
    badge: "要求"
    description: "山田様がスマートフォンのログイン画面から資格情報を送る。 認証の状態は赤 (まだ確かめていない) で、応答時間の帯が 80ms まで立ち上がる。 利用者の列がすべて光る。"
  - step: "一次検証" 2s
    focus: ["山田様", "スマートフォン", "認証 API", "2 段階が要る?"]
    tween:
      authStatus: 0 -> 1
      latency: 80 -> 220
      failRate: 100 -> 99
    badge: "一次検証"
    description: "認証 API が資格情報を照らし合わせ、ハッシュを比べる。 認証の状態が赤から黄へ、応答時間が 220ms へ伸び、少数の失敗を数えて成功率が 99% に下がる。"
  - step: "2 段階認証" 2.2s
    focus: ["山田様", "スマートフォン", "認証 API", "2 段階が要る?"]
    tween:
      latency: 220 -> 350
    set:
      authStatus: 1
    badge: "2 段階"
    description: "認証アプリの 6 桁を、認証サーバが時刻の幅に照らして確かめる。 認証の状態は黄のまま、2 段階目の手間で応答時間が 350ms まで伸びる。"
  - step: "セッション発行" 2s
    focus: ["山田様", "スマートフォン", "認証 API", "2 段階が要る?", "JWT 発行器", "Redis"]
    tween:
      authStatus: 1 -> 2
      latency: 350 -> 180
    badge: "発行"
    description: "2 段階目を通り、JWT を発行して Redis にセッションを保存する。 認証の状態が黄から緑へ、応答時間が 180ms へ縮み、成功率は 99% のまま。"
  - step: "応答返却" 1.8s
    focus: ["山田様", "スマートフォン", "認証 API", "2 段階が要る?", "JWT 発行器", "Redis", "JWT トークン"]
    tween:
      successLogin: 8421 -> 8422
      latency: 180 -> 50
    set:
      authStatus: 2
    badge: "応答"
    description: "JWT トークンを応答に付けて返し、画面を移す。 本日成功ログインが 900ms かけて 1 回増え、応答時間が 50ms まで縮んで 7 つの形がすべて光る。"
`;

export const sourceJson__exemplarLoginFlow = `{
  "title": "ログインと 2 要素認証を 5 段階で追う",
  "type": "flow",
  "readouts": [
    {
      "id": "statusTL",
      "kind": "traffic-light",
      "source": "authStatus",
      "label": "認証の状態 (0/1/2)"
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
      "eyebrow": "利用者",
      "subtitle": "メールとパスワードを送る"
    },
    {
      "name": "スマートフォン",
      "kind": "shape-mobile-device",
      "lane": "user",
      "stack": 1,
      "eyebrow": "端末",
      "subtitle": "Android 14 のブラウザ"
    },
    {
      "name": "認証 API",
      "kind": "shape-server-rack",
      "lane": "auth",
      "stack": 0,
      "eyebrow": "サーバ",
      "subtitle": "資格情報の一次検証"
    },
    {
      "name": "2 段階が要る?",
      "kind": "shape-diamond",
      "lane": "auth",
      "stack": 1,
      "eyebrow": "分岐",
      "subtitle": "認証アプリの 6 桁か SMS"
    },
    {
      "name": "JWT 発行器",
      "kind": "shape-hexagon",
      "lane": "auth",
      "stack": 2,
      "eyebrow": "署名",
      "subtitle": "署名する · 有効は 1 時間"
    },
    {
      "name": "Redis",
      "kind": "shape-cylinder",
      "lane": "session-lane",
      "stack": 0,
      "eyebrow": "一時保存",
      "subtitle": "保持は 3600 秒"
    },
    {
      "name": "JWT トークン",
      "kind": "shape-cloud",
      "lane": "session-lane",
      "stack": 1,
      "eyebrow": "応答",
      "subtitle": "応答に付けて返す · 画面を移す"
    }
  ],
  "flow": [
    { "from": "山田様", "to": "スマートフォン", "label": "入力", "tone": "info" },
    { "from": "スマートフォン", "to": "認証 API", "label": "認証を求める", "tone": "info" },
    { "from": "認証 API", "to": "2 段階が要る?", "label": "一次を通過", "tone": "success" },
    { "from": "2 段階が要る?", "to": "JWT 発行器", "label": "2 段階目を通過", "tone": "success" },
    { "from": "JWT 発行器", "to": "Redis", "label": "セッションを保存", "tone": "success" },
    { "from": "Redis", "to": "JWT トークン", "label": "トークンを発行", "tone": "success" }
  ],
  "states": { "authStatus": 0, "successLogin": 8421, "failRate": 100, "latency": 0 },
  "animation": [
    {
      "step": "認証要求",
      "duration": 1.5,
      "focus": ["山田様", "スマートフォン"],
      "tween": { "latency": [0, 80] },
      "set": { "authStatus": 0 },
      "badge": "要求",
      "body": "山田様がスマートフォンのログイン画面から資格情報を送る。 認証の状態は赤 (まだ確かめていない) で、応答時間の帯が 80ms まで立ち上がる。 利用者の列がすべて光る。"
    },
    {
      "step": "一次検証",
      "duration": 2,
      "focus": ["山田様", "スマートフォン", "認証 API", "2 段階が要る?"],
      "tween": { "authStatus": [0, 1], "latency": [80, 220], "failRate": [100, 99] },
      "badge": "一次検証",
      "body": "認証 API が資格情報を照らし合わせ、ハッシュを比べる。 認証の状態が赤から黄へ、応答時間が 220ms へ伸び、少数の失敗を数えて成功率が 99% に下がる。"
    },
    {
      "step": "2 段階認証",
      "duration": 2.2,
      "focus": ["山田様", "スマートフォン", "認証 API", "2 段階が要る?"],
      "tween": { "latency": [220, 350] },
      "set": { "authStatus": 1 },
      "badge": "2 段階",
      "body": "認証アプリの 6 桁を、認証サーバが時刻の幅に照らして確かめる。 認証の状態は黄のまま、2 段階目の手間で応答時間が 350ms まで伸びる。"
    },
    {
      "step": "セッション発行",
      "duration": 2,
      "focus": ["山田様", "スマートフォン", "認証 API", "2 段階が要る?", "JWT 発行器", "Redis"],
      "tween": { "authStatus": [1, 2], "latency": [350, 180] },
      "badge": "発行",
      "body": "2 段階目を通り、JWT を発行して Redis にセッションを保存する。 認証の状態が黄から緑へ、応答時間が 180ms へ縮み、成功率は 99% のまま。"
    },
    {
      "step": "応答返却",
      "duration": 1.8,
      "focus": ["山田様", "スマートフォン", "認証 API", "2 段階が要る?", "JWT 発行器", "Redis", "JWT トークン"],
      "tween": { "successLogin": [8421, 8422], "latency": [180, 50] },
      "set": { "authStatus": 2 },
      "badge": "応答",
      "body": "JWT トークンを応答に付けて返し、画面を移す。 本日成功ログインが 900ms かけて 1 回増え、応答時間が 50ms まで縮んで 7 つの形がすべて光る。"
    }
  ]
}`;

export const sourceYaml__exemplarNotificationFlow = `title: "通知配信を発火から再送まで 5 段階で追う"
type: flow

readouts:
  queuedBar: { kind: bar, source: "queued", min: 0, max: 1000, color: "#f97316", label: "キューの残り" }
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
  - 新着の知らせ: { kind: shape-message-bubble, lane: origin, stack: 0, eyebrow: "きっかけ", subtitle: '"注文が発送されました"' }
  - Kafka キュー: { kind: shape-stack, lane: infra, stack: 0, eyebrow: "キュー", subtitle: "残 {queued} 件 · 保持は 300 秒" }
  - 配信サービス: { kind: shape-cloud, lane: infra, stack: 1, eyebrow: "通知", subtitle: "まとめて配る処理" }
  - 再送の判定: { kind: shape-diamond, lane: infra, stack: 2, eyebrow: "方針", subtitle: "間隔を倍に広げる · 最大 3 回" }
  - iPhone: { kind: shape-mobile-device, lane: devices, stack: 0, eyebrow: "端末", subtitle: "iOS の通知網 · 前面で受ける" }
  - Android: { kind: shape-mobile-device, lane: devices, stack: 1, eyebrow: "端末", subtitle: "Android の通知網 · 背面で受ける" }
  - タブレット: { kind: shape-mobile-device, lane: devices, stack: 2, eyebrow: "端末", subtitle: "圏外 → 再送の対象" }

flow:
  - 新着の知らせ -> Kafka キュー: "積む" (info)
  - Kafka キュー -> 配信サービス: "取り出す" (info)
  - 配信サービス -> iPhone: "iOS へ配信" (success) { labelOffsetY: -120 }
  - 配信サービス -> Android: "Android へ配信" (success)
  - 配信サービス -> タブレット: "初回失敗" (error)
  - タブレット -> 再送の判定: "再送を求める" (warning)
  - 再送の判定 -> 配信サービス: "再送指示" (warning)

animation:
  - step: "通知のきっかけ" 1.8s
    focus: ["新着の知らせ", "Kafka キュー"]
    tween:
      queued: 0 -> 1000
    set:
      delivered: 0
      failed: 0
      deliveryRate: 0
    badge: "発火"
    description: "注文の発送が起き、吹き出しから Kafka キューに積む。 キューの残りが 1000 件まで伸び、配信成功と失敗は 0 件、配信成功率の針は最も下にある。 知らせとキューが光る。"
  - step: "キューイング" 2s
    focus: ["新着の知らせ", "Kafka キュー", "配信サービス"]
    tween:
      queued: 1000 -> 800
    badge: "キュー"
    description: "まとめた 1000 件が処理を待ち、配信サービスが取り出し始める。 キューの残りが 800 件へ縮み、配信サービスが光って、キューからの矢印に信号が流れる。"
  - step: "配信中" 2.5s
    focus: ["新着の知らせ", "Kafka キュー", "配信サービス", "iPhone", "Android", "タブレット"]
    tween:
      queued: 800 -> 50
      delivered: 0 -> 920
      failed: 0 -> 80
      deliveryRate: 0 -> 92
    badge: "配信"
    description: "配信サービスが iPhone / Android 端末 / タブレットへ一斉に配る。 キューの残りが 50 件へ縮み、配信成功が 920 件まで数え上がり、失敗が 80 件、配信成功率が 92% になる。 3 台とも光り、タブレットへの矢印は失敗の赤になる。"
  - step: "初回到達" 1.8s
    focus: ["新着の知らせ", "Kafka キュー", "配信サービス", "iPhone", "Android", "タブレット"]
    tween:
      queued: 50 -> 20
      delivered: 920 -> 950
      failed: 80 -> 50
      deliveryRate: 92 -> 95
    badge: "到達"
    description: "iPhone と Android 端末は受け取り、タブレットは圏外で届かない。 キューの残りが 20 件、配信成功が 950 件、失敗が 50 件、配信成功率が 95% になる。"
  - step: "リトライ" 2s
    focus: ["新着の知らせ", "Kafka キュー", "配信サービス", "再送の判定", "iPhone", "Android", "タブレット"]
    tween:
      queued: 20 -> 0
      delivered: 950 -> 992
      failed: 50 -> 8
      deliveryRate: 95 -> 99
    badge: "再送"
    description: "失敗した 50 件を、再送の判定が間隔を倍に広げながら送り直し、圏内に戻ったタブレットにも届く。 キューの残りが 0 件、配信成功が 992 件、失敗が 8 件、配信成功率が 99% になり、再送の判定が光る。"
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
      "label": "キューの残り"
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
      "name": "新着の知らせ",
      "kind": "shape-message-bubble",
      "lane": "origin",
      "stack": 0,
      "eyebrow": "きっかけ",
      "subtitle": "\\"注文が発送されました\\""
    },
    {
      "name": "Kafka キュー",
      "kind": "shape-stack",
      "lane": "infra",
      "stack": 0,
      "eyebrow": "キュー",
      "subtitle": "残 {queued} 件 · 保持は 300 秒"
    },
    {
      "name": "配信サービス",
      "kind": "shape-cloud",
      "lane": "infra",
      "stack": 1,
      "eyebrow": "通知",
      "subtitle": "まとめて配る処理"
    },
    {
      "name": "再送の判定",
      "kind": "shape-diamond",
      "lane": "infra",
      "stack": 2,
      "eyebrow": "方針",
      "subtitle": "間隔を倍に広げる · 最大 3 回"
    },
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 0,
      "eyebrow": "端末",
      "subtitle": "iOS の通知網 · 前面で受ける"
    },
    {
      "name": "Android",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 1,
      "eyebrow": "端末",
      "subtitle": "Android の通知網 · 背面で受ける"
    },
    {
      "name": "タブレット",
      "kind": "shape-mobile-device",
      "lane": "devices",
      "stack": 2,
      "eyebrow": "端末",
      "subtitle": "圏外 → 再送の対象"
    }
  ],
  "flow": [
    { "from": "新着の知らせ", "to": "Kafka キュー", "label": "積む", "tone": "info" },
    { "from": "Kafka キュー", "to": "配信サービス", "label": "取り出す", "tone": "info" },
    {
      "from": "配信サービス",
      "to": "iPhone",
      "label": "iOS へ配信",
      "tone": "success",
      "labelOffsetY": -120
    },
    { "from": "配信サービス", "to": "Android", "label": "Android へ配信", "tone": "success" },
    { "from": "配信サービス", "to": "タブレット", "label": "初回失敗", "tone": "error" },
    { "from": "タブレット", "to": "再送の判定", "label": "再送を求める", "tone": "warning" },
    { "from": "再送の判定", "to": "配信サービス", "label": "再送指示", "tone": "warning" }
  ],
  "states": { "queued": 0, "delivered": 0, "failed": 0, "deliveryRate": 0 },
  "animation": [
    {
      "step": "通知のきっかけ",
      "duration": 1.8,
      "focus": ["新着の知らせ", "Kafka キュー"],
      "tween": { "queued": [0, 1000] },
      "set": { "delivered": 0, "failed": 0, "deliveryRate": 0 },
      "badge": "発火",
      "body": "注文の発送が起き、吹き出しから Kafka キューに積む。 キューの残りが 1000 件まで伸び、配信成功と失敗は 0 件、配信成功率の針は最も下にある。 知らせとキューが光る。"
    },
    {
      "step": "キューイング",
      "duration": 2,
      "focus": ["新着の知らせ", "Kafka キュー", "配信サービス"],
      "tween": { "queued": [1000, 800] },
      "badge": "キュー",
      "body": "まとめた 1000 件が処理を待ち、配信サービスが取り出し始める。 キューの残りが 800 件へ縮み、配信サービスが光って、キューからの矢印に信号が流れる。"
    },
    {
      "step": "配信中",
      "duration": 2.5,
      "focus": ["新着の知らせ", "Kafka キュー", "配信サービス", "iPhone", "Android", "タブレット"],
      "tween": { "queued": [800, 50], "delivered": [0, 920], "failed": [0, 80], "deliveryRate": [0, 92] },
      "badge": "配信",
      "body": "配信サービスが iPhone / Android 端末 / タブレットへ一斉に配る。 キューの残りが 50 件へ縮み、配信成功が 920 件まで数え上がり、失敗が 80 件、配信成功率が 92% になる。 3 台とも光り、タブレットへの矢印は失敗の赤になる。"
    },
    {
      "step": "初回到達",
      "duration": 1.8,
      "focus": ["新着の知らせ", "Kafka キュー", "配信サービス", "iPhone", "Android", "タブレット"],
      "tween": {
        "queued": [50, 20],
        "delivered": [920, 950],
        "failed": [80, 50],
        "deliveryRate": [92, 95]
      },
      "badge": "到達",
      "body": "iPhone と Android 端末は受け取り、タブレットは圏外で届かない。 キューの残りが 20 件、配信成功が 950 件、失敗が 50 件、配信成功率が 95% になる。"
    },
    {
      "step": "リトライ",
      "duration": 2,
      "focus": ["新着の知らせ", "Kafka キュー", "配信サービス", "再送の判定", "iPhone", "Android", "タブレット"],
      "tween": {
        "queued": [20, 0],
        "delivered": [950, 992],
        "failed": [50, 8],
        "deliveryRate": [95, 99]
      },
      "badge": "再送",
      "body": "失敗した 50 件を、再送の判定が間隔を倍に広げながら送り直し、圏内に戻ったタブレットにも届く。 キューの残りが 0 件、配信成功が 992 件、失敗が 8 件、配信成功率が 99% になり、再送の判定が光る。"
    }
  ]
}`;

export const sourceYaml__alertNotification = `title: "通知 4 種を情報 / 注意 / 異常 / 成功で分ける"
type: flow

inputs:
  kind: { kind: dropdown, options: [{ value: "info", label: "情報" }, { value: "warn", label: "注意" }, { value: "error", label: "異常" }, { value: "success", label: "成功" }], defaultValue: "warn", label: "種類" }

readouts:
  nt: { kind: notification, kindSource: "kind", titleSource: "title", bodySource: "alertBody", label: "通知 (色と記号)" }

lanes:
  info: { x: 0, width: 170 }
  warn: { x: 190, width: 170 }
  error: { x: 380, width: 170 }
  success: { x: 570, width: 170 }

states:
  kind: "warn"
  title: "配備しています"
  alertBody: "本番用に v1.2.3 を組み立て中"

actors:
  - infoNode: { kind: card, lane: info, stack: 0, subtitle: "青 · お知らせ", title: "ℹ 情報" }
  - warnNode: { kind: card, lane: warn, stack: 0, subtitle: "黄 · 気を付ける (初期値)", title: "⚠ 注意" }
  - errorNode: { kind: card, lane: error, stack: 0, subtitle: "赤 · 失敗した", title: "✕ 異常" }
  - successNode: { kind: card, lane: success, stack: 0, subtitle: "緑 · 終わった", title: "✓ 成功" }
  - currentAlert: { kind: card, lane: warn, stack: 1, subtitle: "種類: {kind}", title: "◆ いまの通知" }

animation:
  - step: "情報と注意" 1.2s
    focus: ["infoNode"]
    badge: "通知"
  - step: "異常と成功" 1.2s
    focus: ["infoNode", "warnNode", "errorNode"]
    badge: "通知"
  - step: "いまの通知" 1.2s
    focus: ["infoNode", "warnNode", "errorNode", "successNode", "currentAlert"]
    badge: "通知"
    description: "4 種の通知が並び、いま選んでいる種類を下の箱が示す。 選択欄で種類を変えると、通知の色と記号 (ℹ / ⚠ / ✕ / ✓) が変わる。"
`;

export const sourceJson__alertNotification = `{
  "title": "通知 4 種を情報 / 注意 / 異常 / 成功で分ける",
  "type": "flow",
  "inputs": [
    {
      "id": "kind",
      "kind": "dropdown",
      "options": [
        { "value": "info", "label": "情報" },
        { "value": "warn", "label": "注意" },
        { "value": "error", "label": "異常" },
        { "value": "success", "label": "成功" }
      ],
      "defaultValue": "warn",
      "label": "種類"
    }
  ],
  "readouts": [
    {
      "id": "nt",
      "kind": "notification",
      "kindSource": "kind",
      "titleSource": "title",
      "bodySource": "alertBody",
      "label": "通知 (色と記号)"
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
      "subtitle": "青 · お知らせ",
      "title": "ℹ 情報"
    },
    {
      "name": "warnNode",
      "kind": "card",
      "lane": "warn",
      "stack": 0,
      "subtitle": "黄 · 気を付ける (初期値)",
      "title": "⚠ 注意"
    },
    {
      "name": "errorNode",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "赤 · 失敗した",
      "title": "✕ 異常"
    },
    {
      "name": "successNode",
      "kind": "card",
      "lane": "success",
      "stack": 0,
      "subtitle": "緑 · 終わった",
      "title": "✓ 成功"
    },
    {
      "name": "currentAlert",
      "kind": "card",
      "lane": "warn",
      "stack": 1,
      "subtitle": "種類: {kind}",
      "title": "◆ いまの通知"
    }
  ],
  "flow": [],
  "states": {
    "kind": "warn",
    "title": "配備しています",
    "alertBody": "本番用に v1.2.3 を組み立て中"
  },
  "animation": [
    { "step": "情報と注意", "duration": 1.2, "focus": ["infoNode"], "badge": "通知" },
    {
      "step": "異常と成功",
      "duration": 1.2,
      "focus": ["infoNode", "warnNode", "errorNode"],
      "badge": "通知"
    },
    {
      "step": "いまの通知",
      "duration": 1.2,
      "focus": ["infoNode", "warnNode", "errorNode", "successNode", "currentAlert"],
      "badge": "通知",
      "body": "4 種の通知が並び、いま選んでいる種類を下の箱が示す。 選択欄で種類を変えると、通知の色と記号 (ℹ / ⚠ / ✕ / ✓) が変わる。"
    }
  ]
}`;

export const sourceYaml__arraySignalHistogram = `title: "配列 5 要素の合計と個別値を並べる"
type: flow

inputs:
  bump: { kind: slider, min: 0, max: 50, defaultValue: 20, label: "1 本目を上書き" }

readouts:
  hist: { kind: array-bar, source: "xs", min: 0, max: 50, color: "#2563eb", label: "棒グラフ" }
  items: { kind: array-list, source: "xs", itemTemplate: "#{i} → {item}", max: 6, label: "一覧 (箇条書き)" }
  first: { kind: stat, source: "bump", label: "1 本目の値" }

lanes:
  agg: { x: 0, width: 240 }
  items: { x: 300, width: 260 }

states:
  xs: "[12,34,20,45,28]"

actors:
  - 集計: { kind: card, lane: agg, stack: 0, subtitle: "件数 {xs.length} · 合計 {xs.sum} · 平均 {xs.avg} · 最大 {xs.max}" }
  - 上書きのつまみ: { kind: card, lane: agg, stack: 1, subtitle: "1 本目だけを上書きするつまみ" }
  - #0: { kind: card, lane: items, stack: 0, subtitle: "値 {xs[0]}" }
  - #1: { kind: card, lane: items, stack: 1, subtitle: "値 {xs[1]}" }
  - #2: { kind: card, lane: items, stack: 2, subtitle: "値 {xs[2]}" }
  - #3: { kind: card, lane: items, stack: 3, subtitle: "値 {xs[3]}" }
  - #4: { kind: card, lane: items, stack: 4, subtitle: "値 {xs[4]}" }

animation:
  - step: "初期の並び" 1.8s
    focus: ["集計", "#0"]
    set:
      xs: "[12,34,20,45,28]"
    description: "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。"
  - step: "山が右へ移る" 1.8s
    focus: ["集計", "#0", "#1", "#2"]
    set:
      xs: "[40,18,30,26,48]"
    description: "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。"
  - step: "右上がりに整う" 1.8s
    focus: ["集計", "#0", "#1", "#2", "#3", "#4"]
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
      "label": "1 本目を上書き"
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
      "label": "棒グラフ"
    },
    {
      "id": "items",
      "kind": "array-list",
      "source": "xs",
      "itemTemplate": "#{i} → {item}",
      "max": 6,
      "label": "一覧 (箇条書き)"
    },
    { "id": "first", "kind": "stat", "source": "bump", "label": "1 本目の値" }
  ],
  "lanes": {
    "agg": { "x": 0, "width": 240 },
    "items": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "集計",
      "kind": "card",
      "lane": "agg",
      "stack": 0,
      "subtitle": "件数 {xs.length} · 合計 {xs.sum} · 平均 {xs.avg} · 最大 {xs.max}"
    },
    {
      "name": "上書きのつまみ",
      "kind": "card",
      "lane": "agg",
      "stack": 1,
      "subtitle": "1 本目だけを上書きするつまみ"
    },
    { "name": "#0", "kind": "card", "lane": "items", "stack": 0, "subtitle": "値 {xs[0]}" },
    { "name": "#1", "kind": "card", "lane": "items", "stack": 1, "subtitle": "値 {xs[1]}" },
    { "name": "#2", "kind": "card", "lane": "items", "stack": 2, "subtitle": "値 {xs[2]}" },
    { "name": "#3", "kind": "card", "lane": "items", "stack": 3, "subtitle": "値 {xs[3]}" },
    { "name": "#4", "kind": "card", "lane": "items", "stack": 4, "subtitle": "値 {xs[4]}" }
  ],
  "flow": [],
  "states": { "xs": "[12,34,20,45,28]" },
  "animation": [
    {
      "step": "初期の並び",
      "duration": 1.8,
      "focus": ["集計", "#0"],
      "set": { "xs": "[12,34,20,45,28]" },
      "body": "5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。"
    },
    {
      "step": "山が右へ移る",
      "duration": 1.8,
      "focus": ["集計", "#0", "#1", "#2"],
      "set": { "xs": "[40,18,30,26,48]" },
      "body": "配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。"
    },
    {
      "step": "右上がりに整う",
      "duration": 1.8,
      "focus": ["集計", "#0", "#1", "#2", "#3", "#4"],
      "set": { "xs": "[15,22,30,38,48]" },
      "body": "右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。"
    }
  ]
}`;

export const sourceYaml__audioPlayer = `title: "再生位置と再生状態から時間表示を作る"
type: flow

inputs:
  current: { kind: slider, min: 0, max: 240, defaultValue: 65, label: "再生位置 (秒)" }
  playing: { kind: toggle, defaultValue: true, label: "再生中" }

readouts:
  mp: { kind: media-player, source: "current", durationSource: "duration", playingSource: "playing", color: "#2563eb", viewW: 320, label: "再生 (記号と進み具合と分:秒)" }

lanes:
  current: { x: 0, width: 220 }
  toggle: { x: 260, width: 200 }
  duration: { x: 500, width: 220 }

states:
  current: 65
  duration: 240
  playing: "true"

actors:
  - currentNode: { kind: card, lane: current, stack: 0, subtitle: "{current} 秒 / 240 秒 (つまみで動かす)", title: "再生位置" }
  - toggleNode: { kind: card, lane: toggle, stack: 0, subtitle: "▶ と ❚❚ を切り替える", title: "再生の切り替え" }
  - durationNode: { kind: card, lane: duration, stack: 0, subtitle: "全体で 240 秒 (固定)", title: "曲の長さ" }

flow:
  - currentNode -> durationNode: "進み具合 %" (info)
  - toggleNode -> currentNode: "進める / 止める" (success)

animation:
  - step: "再生位置" 1.2s
    focus: ["currentNode"]
    badge: "再生"
  - step: "再生状態" 1.2s
    focus: ["currentNode", "toggleNode"]
    badge: "再生"
  - step: "時間表示" 1.2s
    focus: ["currentNode", "toggleNode", "durationNode"]
    badge: "再生"
    description: "再生位置 / 再生の切り替え / 曲の長さの 3 列が矢印でつながる。 位置を動かすと下の進み具合と時刻が、切り替えると記号の ▶ と ❚❚ が入れ替わる。"
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
      "label": "再生位置 (秒)"
    },
    { "id": "playing", "kind": "toggle", "defaultValue": true, "label": "再生中" }
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
      "label": "再生 (記号と進み具合と分:秒)"
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
      "subtitle": "{current} 秒 / 240 秒 (つまみで動かす)",
      "title": "再生位置"
    },
    {
      "name": "toggleNode",
      "kind": "card",
      "lane": "toggle",
      "stack": 0,
      "subtitle": "▶ と ❚❚ を切り替える",
      "title": "再生の切り替え"
    },
    {
      "name": "durationNode",
      "kind": "card",
      "lane": "duration",
      "stack": 0,
      "subtitle": "全体で 240 秒 (固定)",
      "title": "曲の長さ"
    }
  ],
  "flow": [
    { "from": "currentNode", "to": "durationNode", "label": "進み具合 %", "tone": "info" },
    { "from": "toggleNode", "to": "currentNode", "label": "進める / 止める", "tone": "success" }
  ],
  "states": { "current": 65, "duration": 240, "playing": "true" },
  "animation": [
    { "step": "再生位置", "duration": 1.2, "focus": ["currentNode"], "badge": "再生" },
    {
      "step": "再生状態",
      "duration": 1.2,
      "focus": ["currentNode", "toggleNode"],
      "badge": "再生"
    },
    {
      "step": "時間表示",
      "duration": 1.2,
      "focus": ["currentNode", "toggleNode", "durationNode"],
      "badge": "再生",
      "body": "再生位置 / 再生の切り替え / 曲の長さの 3 列が矢印でつながる。 位置を動かすと下の進み具合と時刻が、切り替えると記号の ▶ と ❚❚ が入れ替わる。"
    }
  ]
}`;

export const sourceYaml__buildStatusTrafficLight = `title: "ビルド状態を信号機の 3 色で見せる"
type: flow

inputs:
  status: { kind: dropdown, options: [{ value: "red", label: "失敗" }, { value: "yellow", label: "実行中" }, { value: "green", label: "成功" }], defaultValue: "green", label: "ビルドの状態" }

readouts:
  tl: { kind: traffic-light, source: "status", viewW: 70, viewH: 180, label: "状態 (3 色の灯り)" }

lanes:
  red: { x: 0, width: 200 }
  yellow: { x: 240, width: 200 }
  green: { x: 480, width: 200 }

states:
  status: "green"

actors:
  - redNode: { kind: card, lane: red, stack: 0, subtitle: "ビルド失敗 · 要修正", title: "● 赤" }
  - yellowNode: { kind: card, lane: yellow, stack: 0, subtitle: "ビルド実行中 · 待機", title: "● 黄" }
  - greenNode: { kind: card, lane: green, stack: 0, subtitle: "ビルド成功 · 配備できる", title: "● 緑" }
  - currentCI: { kind: card, lane: green, stack: 1, subtitle: "状態: {status}", title: "◆ いまのビルド" }

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
      "options": [
        { "value": "red", "label": "失敗" },
        { "value": "yellow", "label": "実行中" },
        { "value": "green", "label": "成功" }
      ],
      "defaultValue": "green",
      "label": "ビルドの状態"
    }
  ],
  "readouts": [
    {
      "id": "tl",
      "kind": "traffic-light",
      "source": "status",
      "viewW": 70,
      "viewH": 180,
      "label": "状態 (3 色の灯り)"
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
      "title": "● 赤"
    },
    {
      "name": "yellowNode",
      "kind": "card",
      "lane": "yellow",
      "stack": 0,
      "subtitle": "ビルド実行中 · 待機",
      "title": "● 黄"
    },
    {
      "name": "greenNode",
      "kind": "card",
      "lane": "green",
      "stack": 0,
      "subtitle": "ビルド成功 · 配備できる",
      "title": "● 緑"
    },
    {
      "name": "currentCI",
      "kind": "card",
      "lane": "green",
      "stack": 1,
      "subtitle": "状態: {status}",
      "title": "◆ いまのビルド"
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

export const sourceYaml__pattern__buildStatusTrafficLight__値のまま描く = `title: "ビルド状態を信号機の 3 色で見せる"
type: flow

inputs:
  status: { kind: dropdown, options: ["red", "yellow", "green"], defaultValue: "green", label: "ビルドの状態" }

readouts:
  tl: { kind: traffic-light, source: "status", viewW: 70, viewH: 180, label: "状態 (3 色の灯り)" }

lanes:
  red: { x: 0, width: 200 }
  yellow: { x: 240, width: 200 }
  green: { x: 480, width: 200 }

states:
  status: "green"

actors:
  - redNode: { kind: card, lane: red, stack: 0, subtitle: "ビルド失敗 · 要修正", title: "● 赤" }
  - yellowNode: { kind: card, lane: yellow, stack: 0, subtitle: "ビルド実行中 · 待機", title: "● 黄" }
  - greenNode: { kind: card, lane: green, stack: 0, subtitle: "ビルド成功 · 配備できる", title: "● 緑" }
  - currentCI: { kind: card, lane: green, stack: 1, subtitle: "状態: {status}", title: "◆ いまのビルド" }

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

export const sourceJson__pattern__buildStatusTrafficLight__値のまま描く = `{
  "title": "ビルド状態を信号機の 3 色で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "status",
      "kind": "dropdown",
      "options": ["red", "yellow", "green"],
      "defaultValue": "green",
      "label": "ビルドの状態"
    }
  ],
  "readouts": [
    {
      "id": "tl",
      "kind": "traffic-light",
      "source": "status",
      "viewW": 70,
      "viewH": 180,
      "label": "状態 (3 色の灯り)"
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
      "title": "● 赤"
    },
    {
      "name": "yellowNode",
      "kind": "card",
      "lane": "yellow",
      "stack": 0,
      "subtitle": "ビルド実行中 · 待機",
      "title": "● 黄"
    },
    {
      "name": "greenNode",
      "kind": "card",
      "lane": "green",
      "stack": 0,
      "subtitle": "ビルド成功 · 配備できる",
      "title": "● 緑"
    },
    {
      "name": "currentCI",
      "kind": "card",
      "lane": "green",
      "stack": 1,
      "subtitle": "状態: {status}",
      "title": "◆ いまのビルド"
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
  panX: { kind: slider, min: 0, max: 600, defaultValue: 300, label: "横の移動" }
  panY: { kind: slider, min: 0, max: 500, defaultValue: 250, label: "縦の移動" }

readouts:
  map: { kind: mini-map, source: "viewport", canvasW: 1000, canvasH: 800, viewW: 200, viewH: 160, color: "#2563eb", label: "全体図 (小窓)" }
  panXStat: { kind: stat, source: "panX", unit: "px", label: "横の移動量" }
  panYStat: { kind: stat, source: "panY", unit: "px", label: "縦の移動量" }

lanes:
  xpan: { x: 0, width: 200 }
  ypan: { x: 240, width: 200 }
  map: { x: 480, width: 260 }

states:
  panX: 300
  panY: 250
  viewport: "[300,250,400,300]"

actors:
  - 横の移動: { kind: card, lane: xpan, stack: 0, subtitle: "{panX}px (0〜600)" }
  - 縦の移動: { kind: card, lane: ypan, stack: 0, subtitle: "{panY}px (0〜500)" }
  - 小窓: { kind: card, lane: map, stack: 0, subtitle: "({panX}, {panY}) から 400×300" }

animation:
  - step: "左上を見る" 1.8s
    focus: ["横の移動"]
    set:
      viewport: "[0,0,400,300]"
    description: "全体図の左上を見ている状態。 小窓の枠が左上にある。"
  - step: "右へ移る" 1.8s
    focus: ["横の移動", "縦の移動"]
    set:
      viewport: "[500,0,400,300]"
    description: "見ている範囲が右へ移る。 小窓の枠も追いかける。"
  - step: "下へ移る" 1.8s
    focus: ["横の移動", "縦の移動", "小窓"]
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
      "label": "横の移動"
    },
    {
      "id": "panY",
      "kind": "slider",
      "min": 0,
      "max": 500,
      "defaultValue": 250,
      "label": "縦の移動"
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
      "label": "全体図 (小窓)"
    },
    { "id": "panXStat", "kind": "stat", "source": "panX", "unit": "px", "label": "横の移動量" },
    { "id": "panYStat", "kind": "stat", "source": "panY", "unit": "px", "label": "縦の移動量" }
  ],
  "lanes": {
    "xpan": { "x": 0, "width": 200 },
    "ypan": { "x": 240, "width": 200 },
    "map": { "x": 480, "width": 260 }
  },
  "actors": [
    {
      "name": "横の移動",
      "kind": "card",
      "lane": "xpan",
      "stack": 0,
      "subtitle": "{panX}px (0〜600)"
    },
    {
      "name": "縦の移動",
      "kind": "card",
      "lane": "ypan",
      "stack": 0,
      "subtitle": "{panY}px (0〜500)"
    },
    {
      "name": "小窓",
      "kind": "card",
      "lane": "map",
      "stack": 0,
      "subtitle": "({panX}, {panY}) から 400×300"
    }
  ],
  "flow": [],
  "states": { "panX": 300, "panY": 250, "viewport": "[300,250,400,300]" },
  "animation": [
    {
      "step": "左上を見る",
      "duration": 1.8,
      "focus": ["横の移動"],
      "set": { "viewport": "[0,0,400,300]" },
      "body": "全体図の左上を見ている状態。 小窓の枠が左上にある。"
    },
    {
      "step": "右へ移る",
      "duration": 1.8,
      "focus": ["横の移動", "縦の移動"],
      "set": { "viewport": "[500,0,400,300]" },
      "body": "見ている範囲が右へ移る。 小窓の枠も追いかける。"
    },
    {
      "step": "下へ移る",
      "duration": 1.8,
      "focus": ["横の移動", "縦の移動", "小窓"],
      "set": { "viewport": "[500,400,400,300]" },
      "body": "さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。"
    }
  ]
}`;

export const sourceYaml__colorPickerTheme = `title: "選んだ色が見本と 16 進表記に伝わる"
type: flow

inputs:
  accent: { kind: color, defaultValue: "#8a5a2a", label: "差し色" }

readouts:
  hexReadout: { kind: stat, source: "accent", caption: "16 進の色", label: "選んだ色" }

lanes:
  picker: { x: 0, width: 370 }
  swatch-lane: { x: 410, width: 230 }
  stat: { x: 680, width: 320 }

states:
  accent: "#8a5a2a"

actors:
  - 色の選択: { kind: card, lane: picker, stack: 0, subtitle: "色の入力欄 · 初期値 #8a5a2a", posW: 320 }
  - 色見本: { kind: card, lane: swatch-lane, stack: 0, subtitle: "{accent}", posW: 180 }
  - 16 進の表示: { kind: card, lane: stat, stack: 0, subtitle: "選んだ色を 16 進で出す", posW: 270 }

flow:
  - 色の選択 -> 色見本: "選ぶ" (info)
  - 色見本 -> 16 進の表示: "表示する" (success)

animation:
  - step: "色を選ぶ" 1.8s
    focus: ["色の選択"]
    description: "選んだ色が左の箱に入る。 まだ見本には伝わっていない。"
  - step: "見本に伝わる" 1.8s
    focus: ["色の選択", "色見本"]
    description: "選んだ色の 16 進表記が中央に出る。 箱の塗りは選んだ色を見ていないので、色は変わらない。"
  - step: "表記も揃う" 1.8s
    focus: ["色の選択", "色見本", "16 進の表示"]
    description: "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。"
`;

export const sourceJson__colorPickerTheme = `{
  "title": "選んだ色が見本と 16 進表記に伝わる",
  "type": "flow",
  "inputs": [
    { "id": "accent", "kind": "color", "defaultValue": "#8a5a2a", "label": "差し色" }
  ],
  "readouts": [
    {
      "id": "hexReadout",
      "kind": "stat",
      "source": "accent",
      "caption": "16 進の色",
      "label": "選んだ色"
    }
  ],
  "lanes": {
    "picker": { "x": 0, "width": 370 },
    "swatch-lane": { "x": 410, "width": 230 },
    "stat": { "x": 680, "width": 320 }
  },
  "actors": [
    {
      "name": "色の選択",
      "kind": "card",
      "lane": "picker",
      "stack": 0,
      "subtitle": "色の入力欄 · 初期値 #8a5a2a",
      "posW": 320
    },
    {
      "name": "色見本",
      "kind": "card",
      "lane": "swatch-lane",
      "stack": 0,
      "subtitle": "{accent}",
      "posW": 180
    },
    {
      "name": "16 進の表示",
      "kind": "card",
      "lane": "stat",
      "stack": 0,
      "subtitle": "選んだ色を 16 進で出す",
      "posW": 270
    }
  ],
  "flow": [
    { "from": "色の選択", "to": "色見本", "label": "選ぶ", "tone": "info" },
    { "from": "色見本", "to": "16 進の表示", "label": "表示する", "tone": "success" }
  ],
  "states": { "accent": "#8a5a2a" },
  "animation": [
    {
      "step": "色を選ぶ",
      "duration": 1.8,
      "focus": ["色の選択"],
      "body": "選んだ色が左の箱に入る。 まだ見本には伝わっていない。"
    },
    {
      "step": "見本に伝わる",
      "duration": 1.8,
      "focus": ["色の選択", "色見本"],
      "body": "選んだ色の 16 進表記が中央に出る。 箱の塗りは選んだ色を見ていないので、色は変わらない。"
    },
    {
      "step": "表記も揃う",
      "duration": 1.8,
      "focus": ["色の選択", "色見本", "16 進の表示"],
      "body": "右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。"
    }
  ]
}`;

export const sourceYaml__commitDiffCounter = `title: "追加行と削除行から差し引きを出す"
type: flow

inputs:
  add: { kind: stepper, min: 0, max: 500, step: 10, defaultValue: 120, label: "追加した行" }
  del: { kind: stepper, min: 0, max: 500, step: 10, defaultValue: 45, label: "削除した行" }

readouts:
  dc: { kind: diff-counter, additionsSource: "add", deletionsSource: "del", colorAdd: "#22c55e", colorDel: "#ef4444", label: "差分 (+N / -N の棒)" }

lanes:
  adds: { x: 0, width: 260 }
  dels: { x: 300, width: 260 }

states:
  add: 120
  del: 45

actors:
  - + 追加: { kind: card, lane: adds, stack: 0, subtitle: "+{add} 行 (緑)" }
  - 追加が多い時: { kind: card, lane: adds, stack: 1, subtitle: "追加 > 削除 → 行が増える" }
  - - 削除: { kind: card, lane: dels, stack: 0, subtitle: "-{del} 行 (赤)" }
  - 片付け: { kind: card, lane: dels, stack: 1, subtitle: "使わないコードを消す" }

flow:
  - + 追加 -> - 削除: "差し引き = 追加 - 削除" (info)

animation:
  - step: "追加を見る" 1.2s
    focus: ["+ 追加"]
    badge: "差分"
  - step: "削除を並べる" 1.2s
    focus: ["+ 追加", "追加が多い時"]
    badge: "差分"
  - step: "差し引き" 1.2s
    focus: ["+ 追加", "追加が多い時", "- 削除", "片付け"]
    badge: "差分"
    description: "追加を左、削除を右に分け、差し引きを線で示す。 増減の操作で行数を変えると、下の棒の緑と赤の比率が変わる。"
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
      "label": "追加した行"
    },
    {
      "id": "del",
      "kind": "stepper",
      "min": 0,
      "max": 500,
      "step": 10,
      "defaultValue": 45,
      "label": "削除した行"
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
      "label": "差分 (+N / -N の棒)"
    }
  ],
  "lanes": {
    "adds": { "x": 0, "width": 260 },
    "dels": { "x": 300, "width": 260 }
  },
  "actors": [
    {
      "name": "+ 追加",
      "kind": "card",
      "lane": "adds",
      "stack": 0,
      "subtitle": "+{add} 行 (緑)"
    },
    {
      "name": "追加が多い時",
      "kind": "card",
      "lane": "adds",
      "stack": 1,
      "subtitle": "追加 > 削除 → 行が増える"
    },
    {
      "name": "- 削除",
      "kind": "card",
      "lane": "dels",
      "stack": 0,
      "subtitle": "-{del} 行 (赤)"
    },
    {
      "name": "片付け",
      "kind": "card",
      "lane": "dels",
      "stack": 1,
      "subtitle": "使わないコードを消す"
    }
  ],
  "flow": [
    { "from": "+ 追加", "to": "- 削除", "label": "差し引き = 追加 - 削除", "tone": "info" }
  ],
  "states": { "add": 120, "del": 45 },
  "animation": [
    { "step": "追加を見る", "duration": 1.2, "focus": ["+ 追加"], "badge": "差分" },
    { "step": "削除を並べる", "duration": 1.2, "focus": ["+ 追加", "追加が多い時"], "badge": "差分" },
    {
      "step": "差し引き",
      "duration": 1.2,
      "focus": ["+ 追加", "追加が多い時", "- 削除", "片付け"],
      "badge": "差分",
      "body": "追加を左、削除を右に分け、差し引きを線で示す。 増減の操作で行数を変えると、下の棒の緑と赤の比率が変わる。"
    }
  ]
}`;

export const sourceYaml__deploySpinner = `title: "配備状態を実行中 / 完了 / 失敗で見せる"
type: flow

inputs:
  status: { kind: dropdown, options: [{ value: "running", label: "実行中" }, { value: "done", label: "完了" }, { value: "error", label: "失敗" }], defaultValue: "running", label: "状態" }
  msg: { kind: text, defaultValue: "本番用に組み立てています", placeholder: "状態の説明", maxLength: 60, label: "知らせる文" }

readouts:
  sp: { kind: spinner, source: "status", textSource: "msg", color: "#2563eb", label: "配備 (回る輪と文)" }

lanes:
  running: { x: 0, width: 220 }
  done: { x: 260, width: 220 }
  error: { x: 520, width: 220 }

states:
  status: "running"
  msg: "本番用に組み立てています"

actors:
  - runningNode: { kind: card, lane: running, stack: 0, subtitle: "青 · 回る輪", title: "◐ 実行中" }
  - doneNode: { kind: card, lane: done, stack: 0, subtitle: "緑 · 配備に成功", title: "✓ 完了" }
  - errorNode: { kind: card, lane: error, stack: 0, subtitle: "赤 · 配備に失敗", title: "✕ 失敗" }
  - currentState: { kind: card, lane: running, stack: 1, subtitle: "状態: {status} · {msg}", title: "◆ いまの配備" }

animation:
  - step: "実行中" 1.2s
    focus: ["runningNode"]
    badge: "配備中"
  - step: "完了と失敗" 1.2s
    focus: ["runningNode", "doneNode"]
    badge: "配備中"
  - step: "いまの状態" 1.2s
    focus: ["runningNode", "doneNode", "errorNode", "currentState"]
    badge: "配備中"
    description: "実行中 / 完了 / 失敗の 3 列と、いまの配備の箱が並ぶ。 状態を選ぶと、下の輪の形と色が選んだ状態に変わる。"
`;

export const sourceJson__deploySpinner = `{
  "title": "配備状態を実行中 / 完了 / 失敗で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "status",
      "kind": "dropdown",
      "options": [
        { "value": "running", "label": "実行中" },
        { "value": "done", "label": "完了" },
        { "value": "error", "label": "失敗" }
      ],
      "defaultValue": "running",
      "label": "状態"
    },
    {
      "id": "msg",
      "kind": "text",
      "defaultValue": "本番用に組み立てています",
      "placeholder": "状態の説明",
      "maxLength": 60,
      "label": "知らせる文"
    }
  ],
  "readouts": [
    {
      "id": "sp",
      "kind": "spinner",
      "source": "status",
      "textSource": "msg",
      "color": "#2563eb",
      "label": "配備 (回る輪と文)"
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
      "subtitle": "青 · 回る輪",
      "title": "◐ 実行中"
    },
    {
      "name": "doneNode",
      "kind": "card",
      "lane": "done",
      "stack": 0,
      "subtitle": "緑 · 配備に成功",
      "title": "✓ 完了"
    },
    {
      "name": "errorNode",
      "kind": "card",
      "lane": "error",
      "stack": 0,
      "subtitle": "赤 · 配備に失敗",
      "title": "✕ 失敗"
    },
    {
      "name": "currentState",
      "kind": "card",
      "lane": "running",
      "stack": 1,
      "subtitle": "状態: {status} · {msg}",
      "title": "◆ いまの配備"
    }
  ],
  "flow": [],
  "states": { "status": "running", "msg": "本番用に組み立てています" },
  "animation": [
    { "step": "実行中", "duration": 1.2, "focus": ["runningNode"], "badge": "配備中" },
    {
      "step": "完了と失敗",
      "duration": 1.2,
      "focus": ["runningNode", "doneNode"],
      "badge": "配備中"
    },
    {
      "step": "いまの状態",
      "duration": 1.2,
      "focus": ["runningNode", "doneNode", "errorNode", "currentState"],
      "badge": "配備中",
      "body": "実行中 / 完了 / 失敗の 3 列と、いまの配備の箱が並ぶ。 状態を選ぶと、下の輪の形と色が選んだ状態に変わる。"
    }
  ]
}`;

export const sourceYaml__deviceBattery = `title: "電池残量を低 / 中 / 高で見せる"
type: flow

inputs:
  battery: { kind: slider, min: 0, max: 100, defaultValue: 72, label: "残量 %" }

readouts:
  fb: { kind: fuel-bar, source: "battery", segments: 10, lowThreshold: 20, highThreshold: 60, viewW: 240, viewH: 32, label: "残量 (10 区切りの棒)" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 220 }

states:
  battery: 72

actors:
  - 低い帯: { kind: card, lane: low, stack: 0, subtitle: "20% 未満 (赤 · 危うい)" }
  - 中の帯: { kind: card, lane: mid, stack: 0, subtitle: "20〜60% (黄 · そろそろ充電)" }
  - 高い帯: { kind: card, lane: high, stack: 0, subtitle: "60% 以上 (緑 · 十分)" }
  - ◆ いまの残量: { kind: card, lane: high, stack: 1, subtitle: "残量 = {battery}% (初期値 72 → 高い帯)" }

animation:
  - step: "低い帯" 1.2s
    focus: ["低い帯"]
    badge: "電池"
  - step: "高い帯まで" 1.2s
    focus: ["低い帯", "中の帯"]
    badge: "電池"
  - step: "いまの残量" 1.2s
    focus: ["低い帯", "中の帯", "高い帯", "◆ いまの残量"]
    badge: "電池"
    description: "低い / 中 / 高い帯と、いまの残量の箱が並ぶ。 残量を動かすと、下の棒の埋まる区切りの数と色が変わる。"
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
      "label": "残量 %"
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
      "label": "残量 (10 区切りの棒)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "低い帯",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "20% 未満 (赤 · 危うい)"
    },
    {
      "name": "中の帯",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "20〜60% (黄 · そろそろ充電)"
    },
    {
      "name": "高い帯",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "60% 以上 (緑 · 十分)"
    },
    {
      "name": "◆ いまの残量",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "残量 = {battery}% (初期値 72 → 高い帯)"
    }
  ],
  "flow": [],
  "states": { "battery": 72 },
  "animation": [
    { "step": "低い帯", "duration": 1.2, "focus": ["低い帯"], "badge": "電池" },
    { "step": "高い帯まで", "duration": 1.2, "focus": ["低い帯", "中の帯"], "badge": "電池" },
    {
      "step": "いまの残量",
      "duration": 1.2,
      "focus": ["低い帯", "中の帯", "高い帯", "◆ いまの残量"],
      "badge": "電池",
      "body": "低い / 中 / 高い帯と、いまの残量の箱が並ぶ。 残量を動かすと、下の棒の埋まる区切りの数と色が変わる。"
    }
  ]
}`;

export const sourceYaml__dynamicReadouts = `title: "数え上げ / 増減 / 円 / 打字の 4 表示を並べる"
type: flow

inputs:
  rev: { kind: slider, min: 0, max: 500, defaultValue: 250, label: "売上" }
  status: { kind: dropdown, options: ["受付中", "保留", "終了"], defaultValue: "受付中", label: "状態" }

readouts:
  revCount: { kind: countup, source: "rev", unit: "$", label: "売上の数え上げ" }
  revDelta: { kind: delta, source: "rev", unit: "$", label: "Δ 増減" }
  revPct: { kind: percent-ring, source: "rev", max: 500, label: "進み具合の円" }
  statusText: { kind: typewriter, source: "status", charMs: 50, label: "状態の文字" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  rev: 250
  status: "受付中"

actors:
  - 数え上げ: { kind: card, lane: col1, stack: 0, subtitle: "売上 {rev} · ドルで数え上げる", posW: 320 }
  - 増減: { kind: card, lane: col2, stack: 0, subtitle: "売上 {rev} · 矢印で出す", posW: 240 }
  - 割合の円: { kind: card, lane: col1, stack: 1, subtitle: "売上 {rev} ÷ 500 の割合", posW: 310 }
  - 打ち出し: { kind: card, lane: col2, stack: 1, subtitle: "状態 {status} · 1 文字ずつ出す", posW: 320 }

animation:
  - step: "数え上げを見る" 1.8s
    focus: ["数え上げ"]
    description: "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。"
  - step: "増減と円を見る" 1.8s
    focus: ["数え上げ", "増減", "割合の円"]
    description: "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。"
  - step: "文字でも出す" 1.8s
    focus: ["数え上げ", "増減", "割合の円", "打ち出し"]
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
      "label": "売上"
    },
    {
      "id": "status",
      "kind": "dropdown",
      "options": ["受付中", "保留", "終了"],
      "defaultValue": "受付中",
      "label": "状態"
    }
  ],
  "readouts": [
    {
      "id": "revCount",
      "kind": "countup",
      "source": "rev",
      "unit": "$",
      "label": "売上の数え上げ"
    },
    { "id": "revDelta", "kind": "delta", "source": "rev", "unit": "$", "label": "Δ 増減" },
    {
      "id": "revPct",
      "kind": "percent-ring",
      "source": "rev",
      "max": 500,
      "label": "進み具合の円"
    },
    {
      "id": "statusText",
      "kind": "typewriter",
      "source": "status",
      "charMs": 50,
      "label": "状態の文字"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "数え上げ",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "売上 {rev} · ドルで数え上げる",
      "posW": 320
    },
    {
      "name": "増減",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "売上 {rev} · 矢印で出す",
      "posW": 240
    },
    {
      "name": "割合の円",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "売上 {rev} ÷ 500 の割合",
      "posW": 310
    },
    {
      "name": "打ち出し",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "状態 {status} · 1 文字ずつ出す",
      "posW": 320
    }
  ],
  "flow": [],
  "states": { "rev": 250, "status": "受付中" },
  "animation": [
    {
      "step": "数え上げを見る",
      "duration": 1.8,
      "focus": ["数え上げ"],
      "body": "件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。"
    },
    {
      "step": "増減と円を見る",
      "duration": 1.8,
      "focus": ["数え上げ", "増減", "割合の円"],
      "body": "同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。"
    },
    {
      "step": "文字でも出す",
      "duration": 1.8,
      "focus": ["数え上げ", "増減", "割合の円", "打ち出し"],
      "body": "状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。"
    }
  ]
}`;

export const sourceYaml__engineTachometer = `title: "回転数を通常 / 巡航 / 過回転で見せる"
type: flow

inputs:
  rpm: { kind: slider, min: 0, max: 8000, defaultValue: 3500, label: "回転数" }

readouts:
  g: { kind: circular-gauge, source: "rpm", min: 0, max: 8000, viewW: 200, viewH: 160, color: "#f97316", unit: "rpm", label: "回転計 (270° の目盛盤)" }

lanes:
  idle: { x: 0, width: 200 }
  cruise: { x: 240, width: 200 }
  redline: { x: 480, width: 200 }

states:
  rpm: 3500

actors:
  - idleNode: { kind: card, lane: idle, stack: 0, subtitle: "0〜2000 rpm (緑)", title: "通常の帯" }
  - cruiseNode: { kind: card, lane: cruise, stack: 0, subtitle: "2000〜5000 rpm (黄)", title: "巡航の帯" }
  - redlineNode: { kind: card, lane: redline, stack: 0, subtitle: "5000〜8000 rpm (赤) · 注意", title: "過回転" }
  - currentRpm: { kind: card, lane: cruise, stack: 1, subtitle: "{rpm} rpm (初期値 3500 = 巡航)", title: "◆ いまの回転数" }

animation:
  - step: "通常と巡航" 1.2s
    focus: ["idleNode"]
    badge: "回転計"
  - step: "過回転まで" 1.2s
    focus: ["idleNode", "cruiseNode"]
    badge: "回転計"
  - step: "いまの回転数" 1.2s
    focus: ["idleNode", "cruiseNode", "redlineNode", "currentRpm"]
    badge: "回転計"
    description: "通常 / 巡航 / 過回転の 3 つの帯と、いまの回転数が並ぶ。 つまみで回転数を動かすと、下の目盛盤の針が動く。"
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
      "label": "回転数"
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
      "label": "回転計 (270° の目盛盤)"
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
      "subtitle": "0〜2000 rpm (緑)",
      "title": "通常の帯"
    },
    {
      "name": "cruiseNode",
      "kind": "card",
      "lane": "cruise",
      "stack": 0,
      "subtitle": "2000〜5000 rpm (黄)",
      "title": "巡航の帯"
    },
    {
      "name": "redlineNode",
      "kind": "card",
      "lane": "redline",
      "stack": 0,
      "subtitle": "5000〜8000 rpm (赤) · 注意",
      "title": "過回転"
    },
    {
      "name": "currentRpm",
      "kind": "card",
      "lane": "cruise",
      "stack": 1,
      "subtitle": "{rpm} rpm (初期値 3500 = 巡航)",
      "title": "◆ いまの回転数"
    }
  ],
  "flow": [],
  "states": { "rpm": 3500 },
  "animation": [
    { "step": "通常と巡航", "duration": 1.2, "focus": ["idleNode"], "badge": "回転計" },
    {
      "step": "過回転まで",
      "duration": 1.2,
      "focus": ["idleNode", "cruiseNode"],
      "badge": "回転計"
    },
    {
      "step": "いまの回転数",
      "duration": 1.2,
      "focus": ["idleNode", "cruiseNode", "redlineNode", "currentRpm"],
      "badge": "回転計",
      "body": "通常 / 巡航 / 過回転の 3 つの帯と、いまの回転数が並ぶ。 つまみで回転数を動かすと、下の目盛盤の針が動く。"
    }
  ]
}`;

export const sourceYaml__examGrade = `title: "成績を A から F の 5 段階で見せる"
type: flow

inputs:
  score: { kind: slider, min: 0, max: 100, defaultValue: 85, label: "点数" }

readouts:
  g: { kind: grade, source: "score", max: 100, label: "成績 (A〜F の帯)" }

lanes:
  A: { x: 0, width: 130 }
  B: { x: 150, width: 130 }
  C: { x: 300, width: 130 }
  D: { x: 450, width: 130 }
  F: { x: 600, width: 130 }

states:
  score: 85

actors:
  - A: { kind: card, lane: A, stack: 0, subtitle: "90 以上 (緑)" }
  - B: { kind: card, lane: B, stack: 0, subtitle: "80〜89 (青、初期値はここ)" }
  - C: { kind: card, lane: C, stack: 0, subtitle: "70〜79 (黄)" }
  - D: { kind: card, lane: D, stack: 0, subtitle: "60〜69 (橙)" }
  - F: { kind: card, lane: F, stack: 0, subtitle: "60 未満 (赤)" }
  - ◆ いまの成績: { kind: card, lane: B, stack: 1, subtitle: "点数 = {score} / 100" }

animation:
  - step: "上の 2 段階" 1.2s
    focus: ["A", "B"]
    badge: "成績"
  - step: "下の 3 段階" 1.2s
    focus: ["A", "B", "C", "D"]
    badge: "成績"
  - step: "いまの成績" 1.2s
    focus: ["A", "B", "C", "D", "F", "◆ いまの成績"]
    badge: "成績"
    description: "A〜F の 5 段階と、いまの成績の箱が並ぶ。 点数を動かすと、下の成績の字と色が点数の入る段階に変わる。"
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
      "label": "点数"
    }
  ],
  "readouts": [
    {
      "id": "g",
      "kind": "grade",
      "source": "score",
      "max": 100,
      "label": "成績 (A〜F の帯)"
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
    { "name": "A", "kind": "card", "lane": "A", "stack": 0, "subtitle": "90 以上 (緑)" },
    {
      "name": "B",
      "kind": "card",
      "lane": "B",
      "stack": 0,
      "subtitle": "80〜89 (青、初期値はここ)"
    },
    { "name": "C", "kind": "card", "lane": "C", "stack": 0, "subtitle": "70〜79 (黄)" },
    { "name": "D", "kind": "card", "lane": "D", "stack": 0, "subtitle": "60〜69 (橙)" },
    { "name": "F", "kind": "card", "lane": "F", "stack": 0, "subtitle": "60 未満 (赤)" },
    {
      "name": "◆ いまの成績",
      "kind": "card",
      "lane": "B",
      "stack": 1,
      "subtitle": "点数 = {score} / 100"
    }
  ],
  "flow": [],
  "states": { "score": 85 },
  "animation": [
    { "step": "上の 2 段階", "duration": 1.2, "focus": ["A", "B"], "badge": "成績" },
    { "step": "下の 3 段階", "duration": 1.2, "focus": ["A", "B", "C", "D"], "badge": "成績" },
    {
      "step": "いまの成績",
      "duration": 1.2,
      "focus": ["A", "B", "C", "D", "F", "◆ いまの成績"],
      "badge": "成績",
      "body": "A〜F の 5 段階と、いまの成績の箱が並ぶ。 点数を動かすと、下の成績の字と色が点数の入る段階に変わる。"
    }
  ]
}`;

export const sourceYaml__gridLayoutMatrix = `title: "3 行 4 列の格子を列ごとに並べる"
type: flow

inputs:
  r: { kind: stepper, min: 0, max: 2, defaultValue: 0, label: "行" }
  c: { kind: stepper, min: 0, max: 3, defaultValue: 0, label: "列" }

readouts:
  hover: { kind: stat, source: "r", label: "行" }
  hoverC: { kind: stat, source: "c", label: "列" }

lanes:
  col0: { x: 0, width: 150 }
  col1: { x: 170, width: 150 }
  col2: { x: 340, width: 150 }
  col3: { x: 510, width: 150 }

states:
  r: 0
  c: 0

actors:
  - 行 0 · 列 0: { kind: card, lane: col0, stack: 0, subtitle: "縦列 0 · 段 0" }
  - 行 0 · 列 1: { kind: card, lane: col1, stack: 0, subtitle: "縦列 1 · 段 0" }
  - 行 0 · 列 2: { kind: card, lane: col2, stack: 0, subtitle: "縦列 2 · 段 0" }
  - 行 0 · 列 3: { kind: card, lane: col3, stack: 0, subtitle: "縦列 3 · 段 0" }
  - 行 1 · 列 0: { kind: card, lane: col0, stack: 1, subtitle: "縦列 0 · 段 1" }
  - 行 1 · 列 1: { kind: card, lane: col1, stack: 1, subtitle: "縦列 1 · 段 1" }
  - 行 1 · 列 2: { kind: card, lane: col2, stack: 1, subtitle: "縦列 2 · 段 1" }
  - 行 1 · 列 3: { kind: card, lane: col3, stack: 1, subtitle: "縦列 3 · 段 1" }
  - 行 2 · 列 0: { kind: card, lane: col0, stack: 2, subtitle: "縦列 0 · 段 2" }
  - 行 2 · 列 1: { kind: card, lane: col1, stack: 2, subtitle: "縦列 1 · 段 2" }
  - 行 2 · 列 2: { kind: card, lane: col2, stack: 2, subtitle: "縦列 2 · 段 2" }
  - 行 2 · 列 3: { kind: card, lane: col3, stack: 2, subtitle: "縦列 3 · 段 2" }

animation:
  - step: "1 行目を見る" 1.8s
    focus: ["行 0 · 列 0", "行 0 · 列 1", "行 0 · 列 2", "行 0 · 列 3"]
    description: "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。"
  - step: "2 行目を見る" 1.8s
    focus: ["行 1 · 列 0", "行 1 · 列 1", "行 1 · 列 2", "行 1 · 列 3"]
    description: "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。"
  - step: "3 行目を見る" 1.8s
    focus: ["行 2 · 列 0", "行 2 · 列 1", "行 2 · 列 2", "行 2 · 列 3"]
    description: "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。"
`;

export const sourceJson__gridLayoutMatrix = `{
  "title": "3 行 4 列の格子を列ごとに並べる",
  "type": "flow",
  "inputs": [
    { "id": "r", "kind": "stepper", "min": 0, "max": 2, "defaultValue": 0, "label": "行" },
    { "id": "c", "kind": "stepper", "min": 0, "max": 3, "defaultValue": 0, "label": "列" }
  ],
  "readouts": [
    { "id": "hover", "kind": "stat", "source": "r", "label": "行" },
    { "id": "hoverC", "kind": "stat", "source": "c", "label": "列" }
  ],
  "lanes": {
    "col0": { "x": 0, "width": 150 },
    "col1": { "x": 170, "width": 150 },
    "col2": { "x": 340, "width": 150 },
    "col3": { "x": 510, "width": 150 }
  },
  "actors": [
    {
      "name": "行 0 · 列 0",
      "kind": "card",
      "lane": "col0",
      "stack": 0,
      "subtitle": "縦列 0 · 段 0"
    },
    {
      "name": "行 0 · 列 1",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "縦列 1 · 段 0"
    },
    {
      "name": "行 0 · 列 2",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "縦列 2 · 段 0"
    },
    {
      "name": "行 0 · 列 3",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "縦列 3 · 段 0"
    },
    {
      "name": "行 1 · 列 0",
      "kind": "card",
      "lane": "col0",
      "stack": 1,
      "subtitle": "縦列 0 · 段 1"
    },
    {
      "name": "行 1 · 列 1",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "縦列 1 · 段 1"
    },
    {
      "name": "行 1 · 列 2",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "縦列 2 · 段 1"
    },
    {
      "name": "行 1 · 列 3",
      "kind": "card",
      "lane": "col3",
      "stack": 1,
      "subtitle": "縦列 3 · 段 1"
    },
    {
      "name": "行 2 · 列 0",
      "kind": "card",
      "lane": "col0",
      "stack": 2,
      "subtitle": "縦列 0 · 段 2"
    },
    {
      "name": "行 2 · 列 1",
      "kind": "card",
      "lane": "col1",
      "stack": 2,
      "subtitle": "縦列 1 · 段 2"
    },
    {
      "name": "行 2 · 列 2",
      "kind": "card",
      "lane": "col2",
      "stack": 2,
      "subtitle": "縦列 2 · 段 2"
    },
    {
      "name": "行 2 · 列 3",
      "kind": "card",
      "lane": "col3",
      "stack": 2,
      "subtitle": "縦列 3 · 段 2"
    }
  ],
  "flow": [],
  "states": { "r": 0, "c": 0 },
  "animation": [
    {
      "step": "1 行目を見る",
      "duration": 1.8,
      "focus": ["行 0 · 列 0", "行 0 · 列 1", "行 0 · 列 2", "行 0 · 列 3"],
      "body": "格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。"
    },
    {
      "step": "2 行目を見る",
      "duration": 1.8,
      "focus": ["行 1 · 列 0", "行 1 · 列 1", "行 1 · 列 2", "行 1 · 列 3"],
      "body": "2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。"
    },
    {
      "step": "3 行目を見る",
      "duration": 1.8,
      "focus": ["行 2 · 列 0", "行 2 · 列 1", "行 2 · 列 2", "行 2 · 列 3"],
      "body": "3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。"
    }
  ]
}`;

export const sourceYaml__inputSliderBar = `title: "スライダーの値が右の箱の説明欄に届く"
type: flow

inputs:
  value: { kind: slider, min: 0, max: 100, defaultValue: 50, label: "値" }

lanes:
  slider: { x: 0, width: 260 }
  output: { x: 300, width: 260 }

states:
  value: 50

actors:
  - sliderNode: { kind: card, lane: slider, stack: 0, subtitle: "値 = {value}", title: "つまみ" }
  - bar-node: { kind: card, lane: output, stack: 0, subtitle: "受け取った値: {value}", title: "受け手" }

flow:
  - sliderNode -> bar-node: "値を渡す" (info)

animation:
  - step: "つまみを持つ" 1.6s
    focus: ["sliderNode"]
    description: "左の縦列だけを見る。 つまみを動かすと値が変わる。 まだ右の箱には届いていない。"
  - step: "値が渡る" 1.6s
    focus: ["sliderNode", "bar-node"]
    description: "つまみと右の箱をつなぐ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。"
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
      "label": "値"
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
      "subtitle": "値 = {value}",
      "title": "つまみ"
    },
    {
      "name": "bar-node",
      "kind": "card",
      "lane": "output",
      "stack": 0,
      "subtitle": "受け取った値: {value}",
      "title": "受け手"
    }
  ],
  "flow": [
    { "from": "sliderNode", "to": "bar-node", "label": "値を渡す", "tone": "info" }
  ],
  "states": { "value": 50 },
  "animation": [
    {
      "step": "つまみを持つ",
      "duration": 1.6,
      "focus": ["sliderNode"],
      "body": "左の縦列だけを見る。 つまみを動かすと値が変わる。 まだ右の箱には届いていない。"
    },
    {
      "step": "値が渡る",
      "duration": 1.6,
      "focus": ["sliderNode", "bar-node"],
      "body": "つまみと右の箱をつなぐ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。"
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
  priceRange: { kind: range, min: 0, max: 1000, defaultLo: 200, defaultHi: 700, label: "価格の範囲" }
  tags: { kind: multi-select, options: ["新着", "値下げ", "人気", "おすすめ"], defaultValues: ["新着"], label: "札" }
  view: { kind: tabs, options: ["格子", "一覧", "詰めた一覧"], defaultValue: "格子", label: "表示の形" }
  query: { kind: text, defaultValue: "", placeholder: "検索する言葉", maxLength: 50, label: "検索語" }

lanes:
  range: { x: 0, width: 360 }
  multi: { x: 380, width: 360 }
  tabs: { x: 760, width: 230 }
  text: { x: 1010, width: 320 }

states:
  priceRange: "200,700"
  tags: "新着"
  view: "格子"
  query: ""

actors:
  - rangeNode: { kind: card, lane: range, stack: 0, subtitle: "価格 = {priceRange}", posW: 310, title: "範囲のつまみ" }
  - multiNode: { kind: card, lane: multi, stack: 0, subtitle: "札 = {tags}", posW: 310, title: "複数選択" }
  - tabsNode: { kind: card, lane: tabs, stack: 0, subtitle: "表示 = {view}", posW: 180, title: "タブ" }
  - textNode: { kind: card, lane: text, stack: 0, subtitle: "検索語 = {query}", posW: 270, title: "文字の入力" }

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
      "label": "価格の範囲"
    },
    {
      "id": "tags",
      "kind": "multi-select",
      "options": ["新着", "値下げ", "人気", "おすすめ"],
      "defaultValues": ["新着"],
      "label": "札"
    },
    {
      "id": "view",
      "kind": "tabs",
      "options": ["格子", "一覧", "詰めた一覧"],
      "defaultValue": "格子",
      "label": "表示の形"
    },
    {
      "id": "query",
      "kind": "text",
      "defaultValue": "",
      "placeholder": "検索する言葉",
      "maxLength": 50,
      "label": "検索語"
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
      "subtitle": "価格 = {priceRange}",
      "posW": 310,
      "title": "範囲のつまみ"
    },
    {
      "name": "multiNode",
      "kind": "card",
      "lane": "multi",
      "stack": 0,
      "subtitle": "札 = {tags}",
      "posW": 310,
      "title": "複数選択"
    },
    {
      "name": "tabsNode",
      "kind": "card",
      "lane": "tabs",
      "stack": 0,
      "subtitle": "表示 = {view}",
      "posW": 180,
      "title": "タブ"
    },
    {
      "name": "textNode",
      "kind": "card",
      "lane": "text",
      "stack": 0,
      "subtitle": "検索語 = {query}",
      "posW": 270,
      "title": "文字の入力"
    }
  ],
  "flow": [],
  "states": { "priceRange": "200,700", "tags": "新着", "view": "格子", "query": "" },
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
  delay: { kind: slider, min: 0, max: 300, defaultValue: 50, label: "サーバーの遅れ (ms)" }

readouts:
  seq: { kind: sequence-timeline, source: "events", min: 0, max: 700, viewW: 400, viewH: 60, color: "#2563eb", label: "やり取りの時刻" }
  finalDelay: { kind: stat, source: "delay", unit: "ms", label: "遅れ" }

lanes:
  user: { x: 0, width: 220 }
  auth: { x: 320, width: 220 }
  resource: { x: 640, width: 220 }

states:
  delay: 50
  events: '[[0,"押す"],[100,"認可画面へ"],[200,"同意"],[350,"コード発行"],[500,"トークン発行"],[650,"資源応答"]]'

actors:
  - client: { kind: card, lane: user, stack: 0, subtitle: "利用者が操作する", title: "閲覧ソフト" }
  - consent: { kind: card, lane: auth, stack: 0, subtitle: "遅れ {delay}ms", title: "認可サーバー" }
  - api: { kind: card, lane: resource, stack: 0, subtitle: "API の窓口", title: "資源サーバー" }

flow:
  - client -> consent: "1. 認可画面へ移す (識別子付き)" (info)
  - consent -> client: "2. 同意画面 (利用者が承認)" (info) { side: "left" }
  - client -> consent: "3. 認可コードを引き換える" (accent)
  - consent -> client: "4. アクセストークンを発行" (success) { side: "left" }
  - client -> api: "5. API を呼ぶ" (accent) { sub: "トークンを添える" }
  - api -> client: "6. 応答" (success) { sub: "保護された情報", side: "bottom", labelOffsetY: 120 }

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
      events: '[[0,"認可要求"],[120,"コード発行"],[260,"トークン交換"],[380,"トークン発行"],[500,"資源要求"],[620,"資源応答"]]'
    description: "コードをトークンに引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。"
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
      "label": "サーバーの遅れ (ms)"
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
      "label": "やり取りの時刻"
    },
    { "id": "finalDelay", "kind": "stat", "source": "delay", "unit": "ms", "label": "遅れ" }
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
      "subtitle": "利用者が操作する",
      "title": "閲覧ソフト"
    },
    {
      "name": "consent",
      "kind": "card",
      "lane": "auth",
      "stack": 0,
      "subtitle": "遅れ {delay}ms",
      "title": "認可サーバー"
    },
    {
      "name": "api",
      "kind": "card",
      "lane": "resource",
      "stack": 0,
      "subtitle": "API の窓口",
      "title": "資源サーバー"
    }
  ],
  "flow": [
    {
      "from": "client",
      "to": "consent",
      "label": "1. 認可画面へ移す (識別子付き)",
      "tone": "info"
    },
    {
      "from": "consent",
      "to": "client",
      "label": "2. 同意画面 (利用者が承認)",
      "tone": "info",
      "side": "left"
    },
    {
      "from": "client",
      "to": "consent",
      "label": "3. 認可コードを引き換える",
      "tone": "accent"
    },
    {
      "from": "consent",
      "to": "client",
      "label": "4. アクセストークンを発行",
      "tone": "success",
      "side": "left"
    },
    {
      "from": "client",
      "to": "api",
      "label": "5. API を呼ぶ",
      "sub": "トークンを添える",
      "tone": "accent"
    },
    {
      "from": "api",
      "to": "client",
      "label": "6. 応答",
      "sub": "保護された情報",
      "tone": "success",
      "side": "bottom",
      "labelOffsetY": 120
    }
  ],
  "states": {
    "delay": 50,
    "events": "[[0,\\"押す\\"],[100,\\"認可画面へ\\"],[200,\\"同意\\"],[350,\\"コード発行\\"],[500,\\"トークン発行\\"],[650,\\"資源応答\\"]]"
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
        "events": "[[0,\\"認可要求\\"],[120,\\"コード発行\\"],[260,\\"トークン交換\\"],[380,\\"トークン発行\\"],[500,\\"資源要求\\"],[620,\\"資源応答\\"]]"
      },
      "body": "コードをトークンに引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。"
    }
  ]
}`;

export const sourceYaml__issuePriorityBadge = `title: "課題の優先度を高 / 中 / 低で見せる"
type: flow

inputs:
  prio: { kind: dropdown, options: [{ value: "high", label: "高" }, { value: "med", label: "中" }, { value: "low", label: "低" }], defaultValue: "high", label: "優先度" }
  desc: { kind: text, defaultValue: "起動で落ちる不具合", placeholder: "課題の説明", maxLength: 60, label: "説明" }

readouts:
  pb: { kind: priority-badge, source: "prio", textSource: "desc", label: "優先度 (札と記号と文)" }

lanes:
  high: { x: 0, width: 200 }
  med: { x: 240, width: 200 }
  low: { x: 480, width: 200 }

states:
  prio: "high"
  desc: "起動で落ちる不具合"

actors:
  - highNode: { kind: card, lane: high, stack: 0, subtitle: "赤 · 落ちる / 戻った不具合", title: "▲ 高" }
  - medNode: { kind: card, lane: med, stack: 0, subtitle: "黄 · ふつうの不具合", title: "● 中" }
  - lowNode: { kind: card, lane: low, stack: 0, subtitle: "灰 · あると良い", title: "▼ 低" }
  - currentIssue: { kind: card, lane: high, stack: 1, subtitle: "優先度: {prio} · {desc}", title: "◆ いまの課題" }

animation:
  - step: "高い優先度" 1.2s
    focus: ["highNode"]
    badge: "課題"
  - step: "低い優先度まで" 1.2s
    focus: ["highNode", "medNode"]
    badge: "課題"
  - step: "いまの課題" 1.2s
    focus: ["highNode", "medNode", "lowNode", "currentIssue"]
    badge: "課題"
    description: "高 / 中 / 低の 3 列と、いまの課題の箱が並ぶ。 優先度を選ぶと、下の札の色と記号が変わり、説明の文が札に添えられる。"
`;

export const sourceJson__issuePriorityBadge = `{
  "title": "課題の優先度を高 / 中 / 低で見せる",
  "type": "flow",
  "inputs": [
    {
      "id": "prio",
      "kind": "dropdown",
      "options": [
        { "value": "high", "label": "高" },
        { "value": "med", "label": "中" },
        { "value": "low", "label": "低" }
      ],
      "defaultValue": "high",
      "label": "優先度"
    },
    {
      "id": "desc",
      "kind": "text",
      "defaultValue": "起動で落ちる不具合",
      "placeholder": "課題の説明",
      "maxLength": 60,
      "label": "説明"
    }
  ],
  "readouts": [
    {
      "id": "pb",
      "kind": "priority-badge",
      "source": "prio",
      "textSource": "desc",
      "label": "優先度 (札と記号と文)"
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
      "subtitle": "赤 · 落ちる / 戻った不具合",
      "title": "▲ 高"
    },
    {
      "name": "medNode",
      "kind": "card",
      "lane": "med",
      "stack": 0,
      "subtitle": "黄 · ふつうの不具合",
      "title": "● 中"
    },
    {
      "name": "lowNode",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "灰 · あると良い",
      "title": "▼ 低"
    },
    {
      "name": "currentIssue",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "優先度: {prio} · {desc}",
      "title": "◆ いまの課題"
    }
  ],
  "flow": [],
  "states": { "prio": "high", "desc": "起動で落ちる不具合" },
  "animation": [
    { "step": "高い優先度", "duration": 1.2, "focus": ["highNode"], "badge": "課題" },
    { "step": "低い優先度まで", "duration": 1.2, "focus": ["highNode", "medNode"], "badge": "課題" },
    {
      "step": "いまの課題",
      "duration": 1.2,
      "focus": ["highNode", "medNode", "lowNode", "currentIssue"],
      "badge": "課題",
      "body": "高 / 中 / 低の 3 列と、いまの課題の箱が並ぶ。 優先度を選ぶと、下の札の色と記号が変わり、説明の文が札に添えられる。"
    }
  ]
}`;

export const sourceYaml__kpiBullet = `title: "実績と目標を良 / 並 / 悪の帯で見せる"
type: flow

inputs:
  actual: { kind: slider, min: 0, max: 100, defaultValue: 55, label: "実績" }

readouts:
  b: { kind: bullet-chart, source: "actual", targetSource: "target", max: 100, rangeBad: 40, rangeAvg: 70, viewW: 320, viewH: 40, colorActual: "#241c14", label: "進み具合 (帯と目標線)" }
  targetStat: { kind: stat, source: "target", label: "目標" }

lanes:
  bad: { x: 0, width: 180 }
  avg: { x: 220, width: 180 }
  good: { x: 440, width: 220 }

states:
  actual: 55
  target: 80

actors:
  - 悪い帯: { kind: card, lane: bad, stack: 0, subtitle: "0〜40 (赤)" }
  - 並の帯: { kind: card, lane: avg, stack: 0, subtitle: "40〜70 (黄) · 実績 {actual} はここ" }
  - 良い帯: { kind: card, lane: good, stack: 0, subtitle: "70〜100 (緑) · 目標 {target}" }
  - ◆ 実績: { kind: card, lane: avg, stack: 1, subtitle: "{actual}" }
  - ▼ 目標: { kind: card, lane: good, stack: 1, subtitle: "{target}" }

flow:
  - ◆ 実績 -> ▼ 目標: "差 = 目標 - 実績" (warning)

animation:
  - step: "悪い帯を見る" 1.8s
    focus: ["悪い帯", "◆ 実績"]
    description: "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。"
  - step: "並の帯を見る" 1.8s
    focus: ["悪い帯", "並の帯", "◆ 実績"]
    description: "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。"
  - step: "良い帯と目標" 1.8s
    focus: ["悪い帯", "並の帯", "良い帯", "◆ 実績", "▼ 目標"]
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
      "label": "実績"
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
      "label": "進み具合 (帯と目標線)"
    },
    { "id": "targetStat", "kind": "stat", "source": "target", "label": "目標" }
  ],
  "lanes": {
    "bad": { "x": 0, "width": 180 },
    "avg": { "x": 220, "width": 180 },
    "good": { "x": 440, "width": 220 }
  },
  "actors": [
    { "name": "悪い帯", "kind": "card", "lane": "bad", "stack": 0, "subtitle": "0〜40 (赤)" },
    {
      "name": "並の帯",
      "kind": "card",
      "lane": "avg",
      "stack": 0,
      "subtitle": "40〜70 (黄) · 実績 {actual} はここ"
    },
    {
      "name": "良い帯",
      "kind": "card",
      "lane": "good",
      "stack": 0,
      "subtitle": "70〜100 (緑) · 目標 {target}"
    },
    { "name": "◆ 実績", "kind": "card", "lane": "avg", "stack": 1, "subtitle": "{actual}" },
    { "name": "▼ 目標", "kind": "card", "lane": "good", "stack": 1, "subtitle": "{target}" }
  ],
  "flow": [
    {
      "from": "◆ 実績",
      "to": "▼ 目標",
      "label": "差 = 目標 - 実績",
      "tone": "warning"
    }
  ],
  "states": { "actual": 55, "target": 80 },
  "animation": [
    {
      "step": "悪い帯を見る",
      "duration": 1.8,
      "focus": ["悪い帯", "◆ 実績"],
      "body": "実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。"
    },
    {
      "step": "並の帯を見る",
      "duration": 1.8,
      "focus": ["悪い帯", "並の帯", "◆ 実績"],
      "body": "真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。"
    },
    {
      "step": "良い帯と目標",
      "duration": 1.8,
      "focus": ["悪い帯", "並の帯", "良い帯", "◆ 実績", "▼ 目標"],
      "body": "一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。"
    }
  ]
}`;

export const sourceYaml__mlConfidenceMeter = `title: "推論の確信度を低 / 中 / 高で見せる"
type: flow

inputs:
  conf: { kind: slider, min: 0, max: 100, defaultValue: 82, label: "確信度 %" }

readouts:
  cm: { kind: confidence-meter, source: "conf", lowThreshold: 40, highThreshold: 75, viewW: 280, viewH: 40, label: "確信度 (3 つの帯)" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 220 }

states:
  conf: 82

actors:
  - 低い帯: { kind: card, lane: low, stack: 0, subtitle: "40% 未満 (赤 · 迷っている)" }
  - 中の帯: { kind: card, lane: mid, stack: 0, subtitle: "40〜74% (黄 · 境目)" }
  - 高い帯: { kind: card, lane: high, stack: 0, subtitle: "75% 以上 (緑 · 自信がある)" }
  - ◆ いまの確信度: { kind: card, lane: high, stack: 1, subtitle: "確信度 = {conf}% (初期値 82 → 高い帯)" }

animation:
  - step: "低い帯" 1.2s
    focus: ["低い帯"]
    badge: "確信度"
  - step: "高い帯まで" 1.2s
    focus: ["低い帯", "中の帯"]
    badge: "確信度"
  - step: "いまの確信度" 1.2s
    focus: ["低い帯", "中の帯", "高い帯", "◆ いまの確信度"]
    badge: "確信度"
    description: "低い / 中 / 高い帯と、いまの確信度の箱が並ぶ。 確信度を動かすと、下の帯の色が値の入る帯の色に変わる。"
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
      "label": "確信度 %"
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
      "label": "確信度 (3 つの帯)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 220 }
  },
  "actors": [
    {
      "name": "低い帯",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "40% 未満 (赤 · 迷っている)"
    },
    {
      "name": "中の帯",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "40〜74% (黄 · 境目)"
    },
    {
      "name": "高い帯",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "75% 以上 (緑 · 自信がある)"
    },
    {
      "name": "◆ いまの確信度",
      "kind": "card",
      "lane": "high",
      "stack": 1,
      "subtitle": "確信度 = {conf}% (初期値 82 → 高い帯)"
    }
  ],
  "flow": [],
  "states": { "conf": 82 },
  "animation": [
    { "step": "低い帯", "duration": 1.2, "focus": ["低い帯"], "badge": "確信度" },
    { "step": "高い帯まで", "duration": 1.2, "focus": ["低い帯", "中の帯"], "badge": "確信度" },
    {
      "step": "いまの確信度",
      "duration": 1.2,
      "focus": ["低い帯", "中の帯", "高い帯", "◆ いまの確信度"],
      "badge": "確信度",
      "body": "低い / 中 / 高い帯と、いまの確信度の箱が並ぶ。 確信度を動かすと、下の帯の色が値の入る帯の色に変わる。"
    }
  ]
}`;

export const sourceYaml__numberSparkline = `title: "現在値と履歴のミニ折れ線を並べる"
type: flow

inputs:
  val: { kind: number, defaultValue: 20, label: "値" }

readouts:
  valHist: { kind: sparkline, source: "val", history: 15, color: "#e57373", label: "履歴の折れ線" }
  valStat: { kind: stat, source: "val", caption: "入力の履歴の最新", label: "最新の値" }

lanes:
  current: { x: 0, width: 220 }
  history: { x: 260, width: 320 }

states:
  val: 20

actors:
  - currentNode: { kind: card, lane: current, stack: 0, subtitle: "値 = {val}", title: "いまの値" }
  - historyNode: { kind: card, lane: history, stack: 0, subtitle: "直近 15 回の値を折れ線で残す", title: "履歴 (15 件)" }

flow:
  - currentNode -> historyNode: "履歴に足す" (info)

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
    { "id": "val", "kind": "number", "defaultValue": 20, "label": "値" }
  ],
  "readouts": [
    {
      "id": "valHist",
      "kind": "sparkline",
      "source": "val",
      "history": 15,
      "color": "#e57373",
      "label": "履歴の折れ線"
    },
    {
      "id": "valStat",
      "kind": "stat",
      "source": "val",
      "caption": "入力の履歴の最新",
      "label": "最新の値"
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
      "subtitle": "値 = {val}",
      "title": "いまの値"
    },
    {
      "name": "historyNode",
      "kind": "card",
      "lane": "history",
      "stack": 0,
      "subtitle": "直近 15 回の値を折れ線で残す",
      "title": "履歴 (15 件)"
    }
  ],
  "flow": [
    { "from": "currentNode", "to": "historyNode", "label": "履歴に足す", "tone": "info" }
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
  current: { kind: stepper, min: 0, max: 4, defaultValue: 2, label: "いまの段" }

readouts:
  wizard: { kind: step-indicator, source: "current", stepsSource: "steps", viewW: 360, viewH: 60, colorActive: "#2563eb", colorPending: "#cbd5e1", label: "進み具合 (点の並び)" }

lanes:
  col1: { x: 0, width: 250 }
  col2: { x: 290, width: 340 }
  col3: { x: 670, width: 190 }

states:
  current: 2
  steps: '["登録","自己紹介","好みの設定","本人確認","完了"]'

actors:
  - 登録: { kind: card, lane: col1, stack: 0, subtitle: "アカウント作成", posW: 200 }
  - 自己紹介: { kind: card, lane: col1, stack: 1, subtitle: "名前と写真", posW: 200 }
  - 好みの設定: { kind: card, lane: col2, stack: 0, subtitle: "設定選択 (現在地)", posW: 290 }
  - 本人確認: { kind: card, lane: col2, stack: 1, subtitle: "認証確認", posW: 180 }
  - 完了: { kind: card, lane: col3, stack: 0, subtitle: "利用開始", posW: 140 }

flow:
  - 登録 -> 自己紹介: "次へ" (info)
  - 自己紹介 -> 好みの設定: "次へ" (info)
  - 好みの設定 -> 本人確認: "次へ" (accent)
  - 本人確認 -> 完了: "終える" (success)

animation:
  - step: "最初の 2 段" 1.2s
    focus: ["登録"]
    badge: "手順"
  - step: "中ほどまで" 1.2s
    focus: ["登録", "自己紹介", "好みの設定"]
    badge: "手順"
  - step: "最後まで" 1.2s
    focus: ["登録", "自己紹介", "好みの設定", "本人確認", "完了"]
    badge: "手順"
    description: "5 段がすべて並び、最後の完了まで線でつながる。 線の色は前半 (青)、本人確認の手前 (強調)、完了 (緑) で分けてある。 下の点の並びは、いまの段までを塗る。"
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
      "label": "いまの段"
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
      "label": "進み具合 (点の並び)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 250 },
    "col2": { "x": 290, "width": 340 },
    "col3": { "x": 670, "width": 190 }
  },
  "actors": [
    {
      "name": "登録",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "アカウント作成",
      "posW": 200
    },
    {
      "name": "自己紹介",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "名前と写真",
      "posW": 200
    },
    {
      "name": "好みの設定",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "設定選択 (現在地)",
      "posW": 290
    },
    {
      "name": "本人確認",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "認証確認",
      "posW": 180
    },
    {
      "name": "完了",
      "kind": "card",
      "lane": "col3",
      "stack": 0,
      "subtitle": "利用開始",
      "posW": 140
    }
  ],
  "flow": [
    { "from": "登録", "to": "自己紹介", "label": "次へ", "tone": "info" },
    { "from": "自己紹介", "to": "好みの設定", "label": "次へ", "tone": "info" },
    { "from": "好みの設定", "to": "本人確認", "label": "次へ", "tone": "accent" },
    { "from": "本人確認", "to": "完了", "label": "終える", "tone": "success" }
  ],
  "states": { "current": 2, "steps": "[\\"登録\\",\\"自己紹介\\",\\"好みの設定\\",\\"本人確認\\",\\"完了\\"]" },
  "animation": [
    { "step": "最初の 2 段", "duration": 1.2, "focus": ["登録"], "badge": "手順" },
    {
      "step": "中ほどまで",
      "duration": 1.2,
      "focus": ["登録", "自己紹介", "好みの設定"],
      "badge": "手順"
    },
    {
      "step": "最後まで",
      "duration": 1.2,
      "focus": ["登録", "自己紹介", "好みの設定", "本人確認", "完了"],
      "badge": "手順",
      "body": "5 段がすべて並び、最後の完了まで線でつながる。 線の色は前半 (青)、本人確認の手前 (強調)、完了 (緑) で分けてある。 下の点の並びは、いまの段までを塗る。"
    }
  ]
}`;

export const sourceYaml__playlistSongQueue = `title: "再生待ち 5 曲を再生済 / 再生中 / 次にで分ける"
type: flow

inputs:
  cur: { kind: stepper, min: 0, max: 4, defaultValue: 1, label: "いまの曲の番号" }

readouts:
  sq: { kind: song-queue, source: "queue", currentSource: "cur", max: 8, color: "#2563eb", label: "再生待ち (いまの曲を強調)" }

lanes:
  played: { x: 0, width: 200 }
  now: { x: 240, width: 220 }
  next: { x: 500, width: 220 }

states:
  cur: 1
  queue: [["紙飛行機の午後","灯台守","5:55"],["十一月の港","港町の二人","6:30"],["星図をひらく","北窓","8:02"],["雨上がりの路線図","小春日和","5:56"],["遠い約束","白帆","3:03"]]

actors:
  - ✓ 紙飛行機: { kind: card, lane: played, stack: 0, subtitle: "灯台守 · 5:55 (再生済)" }
  - ▶ 十一月の港: { kind: card, lane: now, stack: 0, subtitle: "港町の二人 · 6:30 (再生中)" }
  - 星図: { kind: card, lane: next, stack: 0, subtitle: "北窓 · 8:02" }
  - 雨上がり: { kind: card, lane: next, stack: 1, subtitle: "小春日和 · 5:56" }
  - 遠い約束: { kind: card, lane: next, stack: 2, subtitle: "白帆 · 3:03" }

animation:
  - step: "再生済" 1.2s
    focus: ["✓ 紙飛行機"]
    badge: "曲"
  - step: "再生中" 1.2s
    focus: ["✓ 紙飛行機", "▶ 十一月の港", "星図"]
    badge: "曲"
  - step: "次に続く" 1.2s
    focus: ["✓ 紙飛行機", "▶ 十一月の港", "星図", "雨上がり", "遠い約束"]
    badge: "曲"
    description: "再生済 / 再生中 / 次にの 3 列に 5 曲が並ぶ。 曲の番号を動かすと、下の一覧で強調される曲が移る。"
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
      "label": "いまの曲の番号"
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
      "label": "再生待ち (いまの曲を強調)"
    }
  ],
  "lanes": {
    "played": { "x": 0, "width": 200 },
    "now": { "x": 240, "width": 220 },
    "next": { "x": 500, "width": 220 }
  },
  "actors": [
    {
      "name": "✓ 紙飛行機",
      "kind": "card",
      "lane": "played",
      "stack": 0,
      "subtitle": "灯台守 · 5:55 (再生済)"
    },
    {
      "name": "▶ 十一月の港",
      "kind": "card",
      "lane": "now",
      "stack": 0,
      "subtitle": "港町の二人 · 6:30 (再生中)"
    },
    {
      "name": "星図",
      "kind": "card",
      "lane": "next",
      "stack": 0,
      "subtitle": "北窓 · 8:02"
    },
    {
      "name": "雨上がり",
      "kind": "card",
      "lane": "next",
      "stack": 1,
      "subtitle": "小春日和 · 5:56"
    },
    {
      "name": "遠い約束",
      "kind": "card",
      "lane": "next",
      "stack": 2,
      "subtitle": "白帆 · 3:03"
    }
  ],
  "flow": [],
  "states": {
    "cur": 1,
    "queue": "[[\\"紙飛行機の午後\\",\\"灯台守\\",\\"5:55\\"],[\\"十一月の港\\",\\"港町の二人\\",\\"6:30\\"],[\\"星図をひらく\\",\\"北窓\\",\\"8:02\\"],[\\"雨上がりの路線図\\",\\"小春日和\\",\\"5:56\\"],[\\"遠い約束\\",\\"白帆\\",\\"3:03\\"]]"
  },
  "animation": [
    { "step": "再生済", "duration": 1.2, "focus": ["✓ 紙飛行機"], "badge": "曲" },
    {
      "step": "再生中",
      "duration": 1.2,
      "focus": ["✓ 紙飛行機", "▶ 十一月の港", "星図"],
      "badge": "曲"
    },
    {
      "step": "次に続く",
      "duration": 1.2,
      "focus": ["✓ 紙飛行機", "▶ 十一月の港", "星図", "雨上がり", "遠い約束"],
      "badge": "曲",
      "body": "再生済 / 再生中 / 次にの 3 列に 5 曲が並ぶ。 曲の番号を動かすと、下の一覧で強調される曲が移る。"
    }
  ]
}`;

export const sourceYaml__productPriceTag = `title: "旧価格 / 新価格 / 割引率を並べる"
type: flow

inputs:
  newPrice: { kind: stepper, min: 0, max: 200, step: 5, defaultValue: 65, label: "新価格" }

readouts:
  pt: { kind: price-tag, oldSource: "oldPrice", newSource: "newPrice", currency: "$", colorNew: "#241c14", colorOld: "#a08870", colorDiscount: "#ef4444", label: "値札 (3 つの値)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  newPrice: 65
  oldPrice: 100

actors:
  - 旧価格: { kind: card, lane: col1, stack: 0, subtitle: "\${oldPrice} (取り消し線)", posW: 310 }
  - 新価格: { kind: card, lane: col2, stack: 0, subtitle: "\${newPrice} (増減で変わる)", posW: 320 }
  - 割引率 (%): { kind: card, lane: col1, stack: 1, subtitle: "(旧 - 新) / 旧 · 赤い札", posW: 320 }

flow:
  - 旧価格 -> 新価格: "値下げ" (warning)
  - 新価格 -> 割引率 (%): "%" (error)

animation:
  - step: "旧価格" 1.2s
    focus: ["旧価格"]
    badge: "値札"
  - step: "新価格" 1.2s
    focus: ["旧価格", "新価格"]
    badge: "値札"
  - step: "割引率" 1.2s
    focus: ["旧価格", "新価格", "割引率 (%)"]
    badge: "値札"
    description: "旧価格、新価格、割引率の 3 つが並ぶ。 増減の操作で新価格を変えると、下の値札の取り消し線と大きな数字と赤い札が一緒に変わる。"
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
      "label": "新価格"
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
      "label": "値札 (3 つの値)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "旧価格",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "\${oldPrice} (取り消し線)",
      "posW": 310
    },
    {
      "name": "新価格",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "\${newPrice} (増減で変わる)",
      "posW": 320
    },
    {
      "name": "割引率 (%)",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "(旧 - 新) / 旧 · 赤い札",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "旧価格", "to": "新価格", "label": "値下げ", "tone": "warning" },
    { "from": "新価格", "to": "割引率 (%)", "label": "%", "tone": "error" }
  ],
  "states": { "newPrice": 65, "oldPrice": 100 },
  "animation": [
    { "step": "旧価格", "duration": 1.2, "focus": ["旧価格"], "badge": "値札" },
    { "step": "新価格", "duration": 1.2, "focus": ["旧価格", "新価格"], "badge": "値札" },
    {
      "step": "割引率",
      "duration": 1.2,
      "focus": ["旧価格", "新価格", "割引率 (%)"],
      "badge": "値札",
      "body": "旧価格、新価格、割引率の 3 つが並ぶ。 増減の操作で新価格を変えると、下の値札の取り消し線と大きな数字と赤い札が一緒に変わる。"
    }
  ]
}`;

export const sourceYaml__productRating = `title: "商品評価を低 / 中 / 高の帯で見せる"
type: flow

inputs:
  score: { kind: slider, min: 0, max: 5, step: 0.5, defaultValue: 3.5, label: "評価" }

readouts:
  r: { kind: rating, source: "score", count: 5, color: "#eab308", label: "評価 (星の数)" }

lanes:
  low: { x: 0, width: 220 }
  mid: { x: 260, width: 220 }
  high: { x: 520, width: 220 }

states:
  score: 3.5

actors:
  - 低い帯: { kind: card, lane: low, stack: 0, subtitle: "星 0〜1.5 · 不満" }
  - 中の帯: { kind: card, lane: mid, stack: 0, subtitle: "星 2〜3.5 · ふつう" }
  - 高い帯: { kind: card, lane: high, stack: 0, subtitle: "星 4〜5 · とても良い" }
  - ◆ いまの評価: { kind: card, lane: mid, stack: 1, subtitle: "{score} / 5" }

animation:
  - step: "帯を並べる" 1.2s
    focus: ["低い帯"]
    badge: "評価"
  - step: "現在の帯" 1.2s
    focus: ["低い帯", "中の帯"]
    badge: "評価"
  - step: "いまの評価" 1.2s
    focus: ["低い帯", "中の帯", "高い帯", "◆ いまの評価"]
    badge: "評価"
    description: "低 / 中 / 高の 3 つの帯と、いまの評価が並ぶ。 つまみを 0.5 刻みで動かすと、下の星の数が半分の星まで含めて変わる。"
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
      "label": "評価"
    }
  ],
  "readouts": [
    {
      "id": "r",
      "kind": "rating",
      "source": "score",
      "count": 5,
      "color": "#eab308",
      "label": "評価 (星の数)"
    }
  ],
  "lanes": {
    "low": { "x": 0, "width": 220 },
    "mid": { "x": 260, "width": 220 },
    "high": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "低い帯",
      "kind": "card",
      "lane": "low",
      "stack": 0,
      "subtitle": "星 0〜1.5 · 不満"
    },
    {
      "name": "中の帯",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "星 2〜3.5 · ふつう"
    },
    {
      "name": "高い帯",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "星 4〜5 · とても良い"
    },
    {
      "name": "◆ いまの評価",
      "kind": "card",
      "lane": "mid",
      "stack": 1,
      "subtitle": "{score} / 5"
    }
  ],
  "flow": [],
  "states": { "score": 3.5 },
  "animation": [
    { "step": "帯を並べる", "duration": 1.2, "focus": ["低い帯"], "badge": "評価" },
    { "step": "現在の帯", "duration": 1.2, "focus": ["低い帯", "中の帯"], "badge": "評価" },
    {
      "step": "いまの評価",
      "duration": 1.2,
      "focus": ["低い帯", "中の帯", "高い帯", "◆ いまの評価"],
      "badge": "評価",
      "body": "低 / 中 / 高の 3 つの帯と、いまの評価が並ぶ。 つまみを 0.5 刻みで動かすと、下の星の数が半分の星まで含めて変わる。"
    }
  ]
}`;

export const sourceYaml__radioSelect = `title: "3 択のラジオで選んだ 1 つだけが光る"
type: flow

inputs:
  mode: { kind: radio, options: ["低", "中", "高"], defaultValue: "中", label: "段階" }

readouts:
  modeStat: { kind: stat, source: "mode", caption: "選択中", label: "いまの段階" }

lanes:
  low: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  high: { x: 480, width: 200 }

states:
  mode: "中"

actors:
  - 低: { kind: card, lane: low, stack: 0, subtitle: "選択肢: 低" }
  - 中: { kind: card, lane: mid, stack: 0, subtitle: "選択肢: 中 (初期値)" }
  - 高: { kind: card, lane: high, stack: 0, subtitle: "選択肢: 高" }
  - ◆ 選択中: { kind: card, lane: mid, stack: 1, subtitle: "段階 = {mode}" }

animation:
  - step: "低の札" 1.8s
    focus: ["低"]
    description: "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。"
  - step: "中の札" 1.8s
    focus: ["中"]
    description: "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。"
  - step: "高の札" 1.8s
    focus: ["高", "◆ 選択中"]
    description: "3 つ目の札。 選んだ値は右の箱にも文字で出る。"
`;

export const sourceJson__radioSelect = `{
  "title": "3 択のラジオで選んだ 1 つだけが光る",
  "type": "flow",
  "inputs": [
    {
      "id": "mode",
      "kind": "radio",
      "options": ["低", "中", "高"],
      "defaultValue": "中",
      "label": "段階"
    }
  ],
  "readouts": [
    { "id": "modeStat", "kind": "stat", "source": "mode", "caption": "選択中", "label": "いまの段階" }
  ],
  "lanes": {
    "low": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "high": { "x": 480, "width": 200 }
  },
  "actors": [
    { "name": "低", "kind": "card", "lane": "low", "stack": 0, "subtitle": "選択肢: 低" },
    {
      "name": "中",
      "kind": "card",
      "lane": "mid",
      "stack": 0,
      "subtitle": "選択肢: 中 (初期値)"
    },
    {
      "name": "高",
      "kind": "card",
      "lane": "high",
      "stack": 0,
      "subtitle": "選択肢: 高"
    },
    {
      "name": "◆ 選択中",
      "kind": "card",
      "lane": "mid",
      "stack": 1,
      "subtitle": "段階 = {mode}"
    }
  ],
  "flow": [],
  "states": { "mode": "中" },
  "animation": [
    {
      "step": "低の札",
      "duration": 1.8,
      "focus": ["低"],
      "body": "3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。"
    },
    {
      "step": "中の札",
      "duration": 1.8,
      "focus": ["中"],
      "body": "2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。"
    },
    {
      "step": "高の札",
      "duration": 1.8,
      "focus": ["高", "◆ 選択中"],
      "body": "3 つ目の札。 選んだ値は右の箱にも文字で出る。"
    }
  ]
}`;

export const sourceYaml__readoutVariety = `title: "熱セル / バッジ / 状態点の 3 表示を並べる"
type: flow

inputs:
  temp: { kind: slider, min: 0, max: 100, defaultValue: 42, label: "温度" }
  state: { kind: dropdown, options: ["稼働", "停止", "異常"], defaultValue: "稼働", label: "状態" }

readouts:
  tempHeat: { kind: heat-cell, source: "temp", min: 0, max: 100, colors: ["#4e9dc4", "#e57373"], label: "温度の濃淡" }
  tempBadge: { kind: badge, source: "temp", label: "値の札" }
  statusRead: { kind: status-dot, source: "state", map: [{ value: "稼働", color: "#22c55e", label: "稼働" }, { value: "停止", color: "#a08870", label: "停止" }, { value: "異常", color: "#ef4444", label: "異常" }], label: "状態の点" }

lanes:
  heat: { x: 0, width: 220 }
  badge: { x: 260, width: 220 }
  dot: { x: 520, width: 220 }

states:
  temp: 42
  state: "稼働"

actors:
  - 熱の升目: { kind: card, lane: heat, stack: 0, subtitle: "温度 {temp} · 色の濃淡" }
  - 札: { kind: card, lane: badge, stack: 0, subtitle: "温度 {temp} · 数字を札で出す" }
  - 状態の点: { kind: card, lane: dot, stack: 0, subtitle: "状態 {state} · 色で出す" }

animation:
  - step: "熱の升目を見る" 1.8s
    focus: ["熱の升目"]
    description: "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。"
  - step: "札でも出す" 1.8s
    focus: ["熱の升目", "札"]
    description: "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。"
  - step: "状態の点を見る" 1.8s
    focus: ["熱の升目", "札", "状態の点"]
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
      "label": "温度"
    },
    {
      "id": "state",
      "kind": "dropdown",
      "options": ["稼働", "停止", "異常"],
      "defaultValue": "稼働",
      "label": "状態"
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
      "label": "温度の濃淡"
    },
    { "id": "tempBadge", "kind": "badge", "source": "temp", "label": "値の札" },
    {
      "id": "statusRead",
      "kind": "status-dot",
      "source": "state",
      "map": [
        { "value": "稼働", "color": "#22c55e", "label": "稼働" },
        { "value": "停止", "color": "#a08870", "label": "停止" },
        { "value": "異常", "color": "#ef4444", "label": "異常" }
      ],
      "label": "状態の点"
    }
  ],
  "lanes": {
    "heat": { "x": 0, "width": 220 },
    "badge": { "x": 260, "width": 220 },
    "dot": { "x": 520, "width": 220 }
  },
  "actors": [
    {
      "name": "熱の升目",
      "kind": "card",
      "lane": "heat",
      "stack": 0,
      "subtitle": "温度 {temp} · 色の濃淡"
    },
    {
      "name": "札",
      "kind": "card",
      "lane": "badge",
      "stack": 0,
      "subtitle": "温度 {temp} · 数字を札で出す"
    },
    {
      "name": "状態の点",
      "kind": "card",
      "lane": "dot",
      "stack": 0,
      "subtitle": "状態 {state} · 色で出す"
    }
  ],
  "flow": [],
  "states": { "temp": 42, "state": "稼働" },
  "animation": [
    {
      "step": "熱の升目を見る",
      "duration": 1.8,
      "focus": ["熱の升目"],
      "body": "温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。"
    },
    {
      "step": "札でも出す",
      "duration": 1.8,
      "focus": ["熱の升目", "札"],
      "body": "同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。"
    },
    {
      "step": "状態の点を見る",
      "duration": 1.8,
      "focus": ["熱の升目", "札", "状態の点"],
      "body": "別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。"
    }
  ]
}`;

export const sourceYaml__revenueKpiCard = `title: "前期と今期の売上を推移付きで比べる"
type: flow

inputs:
  current: { kind: slider, min: 50, max: 300, defaultValue: 180, label: "今期の売上 (千ドル)" }

readouts:
  kpi: { kind: kpi-card, source: "current", historySource: "history", comparisonSource: "prev", unit: " 千ドル", colorPos: "#22c55e", colorNeg: "#ef4444", label: "売上の指標 (まとめ表示)" }
  prevStat: { kind: stat, source: "prev", unit: " 千ドル", label: "前期の値" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 350 }

states:
  current: 180
  prev: 150
  history: "[120,135,148,152,165,170]"

actors:
  - 前期: { kind: card, lane: col1, stack: 0, subtitle: "{prev} 千ドル (基準)", posW: 220 }
  - ◆ 今期: { kind: card, lane: col2, stack: 0, subtitle: "{current} 千ドル (つまみで動く)", posW: 300 }
  - 推移: { kind: card, lane: col1, stack: 1, subtitle: "6 か月の折れ線 (120〜170 千ドル)", posW: 320 }

flow:
  - 前期 -> ◆ 今期: "差 = 今期 − 前期" (success)
  - ◆ 今期 -> 推移: "折れ線の右端" (info)

animation:
  - step: "前期を見る" 1.8s
    focus: ["前期"]
    description: "比べる相手になる前期の値。 これは固定で動かない。"
  - step: "今期を見る" 1.8s
    focus: ["前期", "◆ 今期"]
    description: "今期の値はつまみで動く。 前期との差がその場で出る。"
  - step: "推移で読む" 1.8s
    focus: ["前期", "◆ 今期", "推移"]
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
      "label": "今期の売上 (千ドル)"
    }
  ],
  "readouts": [
    {
      "id": "kpi",
      "kind": "kpi-card",
      "source": "current",
      "historySource": "history",
      "comparisonSource": "prev",
      "unit": " 千ドル",
      "colorPos": "#22c55e",
      "colorNeg": "#ef4444",
      "label": "売上の指標 (まとめ表示)"
    },
    { "id": "prevStat", "kind": "stat", "source": "prev", "unit": " 千ドル", "label": "前期の値" }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 350 }
  },
  "actors": [
    {
      "name": "前期",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "{prev} 千ドル (基準)",
      "posW": 220
    },
    {
      "name": "◆ 今期",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "{current} 千ドル (つまみで動く)",
      "posW": 300
    },
    {
      "name": "推移",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "6 か月の折れ線 (120〜170 千ドル)",
      "posW": 320
    }
  ],
  "flow": [
    {
      "from": "前期",
      "to": "◆ 今期",
      "label": "差 = 今期 − 前期",
      "tone": "success"
    },
    { "from": "◆ 今期", "to": "推移", "label": "折れ線の右端", "tone": "info" }
  ],
  "states": { "current": 180, "prev": 150, "history": "[120,135,148,152,165,170]" },
  "animation": [
    {
      "step": "前期を見る",
      "duration": 1.8,
      "focus": ["前期"],
      "body": "比べる相手になる前期の値。 これは固定で動かない。"
    },
    {
      "step": "今期を見る",
      "duration": 1.8,
      "focus": ["前期", "◆ 今期"],
      "body": "今期の値はつまみで動く。 前期との差がその場で出る。"
    },
    {
      "step": "推移で読む",
      "duration": 1.8,
      "focus": ["前期", "◆ 今期", "推移"],
      "body": "推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。"
    }
  ]
}`;

export const sourceYaml__revenueScoreboard = `title: "売上の現在 / 目標 / 差分を並べる"
type: flow

inputs:
  rev: { kind: slider, min: 0, max: 999, defaultValue: 234, label: "売上" }

readouts:
  nb: { kind: number-board, source: "rev", prefix: "$", suffix: "M", size: 56, color: "#241c14", caption: "目標 $500M と比べる", label: "売上 (大きな数字)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 250 }

states:
  rev: 234

actors:
  - ◆ いまの売上: { kind: card, lane: col1, stack: 0, subtitle: "\${rev}M (つまみで変わる)", posW: 270 }
  - 目標: { kind: card, lane: col2, stack: 0, subtitle: "$500M (第 3 四半期の目標)", posW: 200 }
  - 差: { kind: card, lane: col1, stack: 1, subtitle: "目標 - いまの売上", posW: 320 }

flow:
  - ◆ いまの売上 -> 目標: "進み具合" (info)
  - 目標 -> 差: "差" (warning)

animation:
  - step: "現在を見る" 1.2s
    focus: ["◆ いまの売上"]
    badge: "大きな数字"
  - step: "目標を並べる" 1.2s
    focus: ["◆ いまの売上", "目標"]
    badge: "大きな数字"
  - step: "差を出す" 1.2s
    focus: ["◆ いまの売上", "目標", "差"]
    badge: "大きな数字"
    description: "いまの売上、目標、目標までの差の 3 つが並ぶ。 つまみで売上を動かすと、いまの売上の箱と下の大きな数字が一緒に変わる。"
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
      "label": "売上"
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
      "caption": "目標 $500M と比べる",
      "label": "売上 (大きな数字)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 250 }
  },
  "actors": [
    {
      "name": "◆ いまの売上",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "\${rev}M (つまみで変わる)",
      "posW": 270
    },
    {
      "name": "目標",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "$500M (第 3 四半期の目標)",
      "posW": 200
    },
    {
      "name": "差",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "目標 - いまの売上",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "◆ いまの売上", "to": "目標", "label": "進み具合", "tone": "info" },
    { "from": "目標", "to": "差", "label": "差", "tone": "warning" }
  ],
  "states": { "rev": 234 },
  "animation": [
    { "step": "現在を見る", "duration": 1.2, "focus": ["◆ いまの売上"], "badge": "大きな数字" },
    {
      "step": "目標を並べる",
      "duration": 1.2,
      "focus": ["◆ いまの売上", "目標"],
      "badge": "大きな数字"
    },
    {
      "step": "差を出す",
      "duration": 1.2,
      "focus": ["◆ いまの売上", "目標", "差"],
      "badge": "大きな数字",
      "body": "いまの売上、目標、目標までの差の 3 つが並ぶ。 つまみで売上を動かすと、いまの売上の箱と下の大きな数字が一緒に変わる。"
    }
  ]
}`;

export const sourceYaml__roomThermometer = `title: "室温を寒い / 快適 / 暑いで分ける"
type: flow

inputs:
  temp: { kind: slider, min: 0, max: 40, defaultValue: 24, label: "室温 °C" }

readouts:
  th: { kind: thermometer, source: "temp", min: 0, max: 40, viewW: 70, viewH: 180, color: "#ef4444", unit: "°C", label: "室温 (縦の棒)" }

lanes:
  cold: { x: 0, width: 200 }
  comfort: { x: 240, width: 220 }
  hot: { x: 500, width: 200 }

states:
  temp: 24

actors:
  - 寒い帯: { kind: card, lane: cold, stack: 0, subtitle: "15°C 未満 (青 · 暖房)" }
  - 快適な帯: { kind: card, lane: comfort, stack: 0, subtitle: "15〜25°C (緑 · 初期値の帯)" }
  - 暑い帯: { kind: card, lane: hot, stack: 0, subtitle: "25°C 以上 (赤 · 冷房)" }
  - ◆ いまの室温: { kind: card, lane: comfort, stack: 1, subtitle: "室温 = {temp}°C (初期値 24 → 快適)" }

animation:
  - step: "寒い帯" 1.2s
    focus: ["寒い帯"]
    badge: "室温"
  - step: "暑い帯まで" 1.2s
    focus: ["寒い帯", "快適な帯"]
    badge: "室温"
  - step: "いまの室温" 1.2s
    focus: ["寒い帯", "快適な帯", "暑い帯", "◆ いまの室温"]
    badge: "室温"
    description: "寒い / 快適 / 暑い帯と、いまの室温の箱が並ぶ。 室温を動かすと、下の温度計の棒の高さが変わる。"
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
      "label": "室温 °C"
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
      "label": "室温 (縦の棒)"
    }
  ],
  "lanes": {
    "cold": { "x": 0, "width": 200 },
    "comfort": { "x": 240, "width": 220 },
    "hot": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "寒い帯",
      "kind": "card",
      "lane": "cold",
      "stack": 0,
      "subtitle": "15°C 未満 (青 · 暖房)"
    },
    {
      "name": "快適な帯",
      "kind": "card",
      "lane": "comfort",
      "stack": 0,
      "subtitle": "15〜25°C (緑 · 初期値の帯)"
    },
    {
      "name": "暑い帯",
      "kind": "card",
      "lane": "hot",
      "stack": 0,
      "subtitle": "25°C 以上 (赤 · 冷房)"
    },
    {
      "name": "◆ いまの室温",
      "kind": "card",
      "lane": "comfort",
      "stack": 1,
      "subtitle": "室温 = {temp}°C (初期値 24 → 快適)"
    }
  ],
  "flow": [],
  "states": { "temp": 24 },
  "animation": [
    { "step": "寒い帯", "duration": 1.2, "focus": ["寒い帯"], "badge": "室温" },
    {
      "step": "暑い帯まで",
      "duration": 1.2,
      "focus": ["寒い帯", "快適な帯"],
      "badge": "室温"
    },
    {
      "step": "いまの室温",
      "duration": 1.2,
      "focus": ["寒い帯", "快適な帯", "暑い帯", "◆ いまの室温"],
      "badge": "室温",
      "body": "寒い / 快適 / 暑い帯と、いまの室温の箱が並ぶ。 室温を動かすと、下の温度計の棒の高さが変わる。"
    }
  ]
}`;

export const sourceYaml__shapeArcSweep = `title: "弧のゲージ角度を 4 段階で見せる"
type: flow

inputs:
  a: { kind: slider, min: 0, max: 270, defaultValue: 180, label: "角度" }

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
  - 0°: { kind: dyn-arc, lane: min, stack: 0, subtitle: "最小", shape: { kind: arc, angle: "{a0}", startAngle: -135, sweepMax: 270, fill: "#a08870" }, posW: 180, posH: 180 }
  - 90°: { kind: dyn-arc, lane: quarter, stack: 0, subtitle: "4 分の 1 周", shape: { kind: arc, angle: "{a90}", startAngle: -135, sweepMax: 270, fill: "#2563eb" }, posW: 180, posH: 180 }
  - 180°: { kind: dyn-arc, lane: half, stack: 0, subtitle: "半周", shape: { kind: arc, angle: "{a180}", startAngle: -135, sweepMax: 270, fill: "#f97316" }, posW: 180, posH: 180 }
  - つまみ: { kind: dyn-arc, lane: interactive, stack: 0, subtitle: "{a}°", shape: { kind: arc, angle: "{a}", startAngle: -135, sweepMax: 270, fill: "#8a5a2a" }, posW: 180, posH: 180 }

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
    focus: ["0°", "90°", "180°", "つまみ"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeArcSweep = `{
  "title": "弧のゲージ角度を 4 段階で見せる",
  "type": "flow",
  "inputs": [
    { "id": "a", "kind": "slider", "min": 0, "max": 270, "defaultValue": 180, "label": "角度" }
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
      "subtitle": "最小",
      "shape": { "kind": "arc", "angle": "{a0}", "startAngle": -135, "sweepMax": 270, "fill": "#a08870" },
      "posW": 180,
      "posH": 180
    },
    {
      "name": "90°",
      "kind": "dyn-arc",
      "lane": "quarter",
      "stack": 0,
      "subtitle": "4 分の 1 周",
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
      "subtitle": "半周",
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
      "name": "つまみ",
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
      "focus": ["0°", "90°", "180°", "つまみ"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shapePolyRotate = `title: "多角形の角数を 3 / 6 / 8 で見せる"
type: flow

inputs:
  rot: { kind: slider, min: 0, max: 360, defaultValue: 0, label: "回転" }
  radius: { kind: slider, min: 20, max: 80, defaultValue: 60, label: "大きさ" }

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
  - polyTri: { kind: dyn-polygon, lane: triangle, stack: 0, subtitle: "角 3 つ", shape: { kind: polygon, sides: 3, radius: "{radius60}", rotation: "{rot0}", fill: "#a08870" }, posW: 180, posH: 180, title: "三角形" }
  - polyHex: { kind: dyn-polygon, lane: hexagon, stack: 0, subtitle: "角 6 つ", shape: { kind: polygon, sides: 6, radius: "{radius60}", rotation: "{rot0}", fill: "#2563eb" }, posW: 180, posH: 180, title: "六角形" }
  - polyOct: { kind: dyn-polygon, lane: octagon, stack: 0, subtitle: "角 8 つ", shape: { kind: polygon, sides: 8, radius: "{radius60}", rotation: "{rot0}", fill: "#f97316" }, posW: 180, posH: 180, title: "八角形" }
  - p: { kind: dyn-polygon, lane: interactive, stack: 0, subtitle: "{rot}° · 大きさ {radius}", shape: { kind: polygon, sides: 6, radius: "{radius}", rotation: "{rot}", fill: "#8a5a2a" }, posW: 200, posH: 200, title: "動かす六角形" }

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
      "label": "回転"
    },
    {
      "id": "radius",
      "kind": "slider",
      "min": 20,
      "max": 80,
      "defaultValue": 60,
      "label": "大きさ"
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
      "subtitle": "角 3 つ",
      "shape": {
        "kind": "polygon",
        "sides": 3,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#a08870"
      },
      "posW": 180,
      "posH": 180,
      "title": "三角形"
    },
    {
      "name": "polyHex",
      "kind": "dyn-polygon",
      "lane": "hexagon",
      "stack": 0,
      "subtitle": "角 6 つ",
      "shape": {
        "kind": "polygon",
        "sides": 6,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#2563eb"
      },
      "posW": 180,
      "posH": 180,
      "title": "六角形"
    },
    {
      "name": "polyOct",
      "kind": "dyn-polygon",
      "lane": "octagon",
      "stack": 0,
      "subtitle": "角 8 つ",
      "shape": {
        "kind": "polygon",
        "sides": 8,
        "radius": "{radius60}",
        "rotation": "{rot0}",
        "fill": "#f97316"
      },
      "posW": 180,
      "posH": 180,
      "title": "八角形"
    },
    {
      "name": "p",
      "kind": "dyn-polygon",
      "lane": "interactive",
      "stack": 0,
      "subtitle": "{rot}° · 大きさ {radius}",
      "shape": {
        "kind": "polygon",
        "sides": 6,
        "radius": "{radius}",
        "rotation": "{rot}",
        "fill": "#8a5a2a"
      },
      "posW": 200,
      "posH": 200,
      "title": "動かす六角形"
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
  v: { kind: slider, min: 0, max: 100, defaultValue: 40, label: "値" }

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
  - 低 25%: { kind: dyn-rect, lane: low, stack: 0, shape: { kind: rect, source: "{low25}", fillMax: 100, orient: "up", fill: "#a08870" }, posW: 100, posH: 240 }
  - 中 50%: { kind: dyn-rect, lane: mid, stack: 0, shape: { kind: rect, source: "{mid50}", fillMax: 100, orient: "up", fill: "#2563eb" }, posW: 100, posH: 240 }
  - 高 75%: { kind: dyn-rect, lane: high, stack: 0, shape: { kind: rect, source: "{high75}", fillMax: 100, orient: "up", fill: "#f97316" }, posW: 100, posH: 240 }
  - つまみ ({v}%): { kind: dyn-rect, lane: interactive, stack: 0, shape: { kind: rect, source: "{v}", fillMax: 100, orient: "up", fill: "#8a5a2a" }, posW: 100, posH: 240 }

animation:
  - step: "25% を見る" 1.6s
    focus: ["低 25%"]
    description: "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。"
  - step: "50% と並べる" 1.6s
    focus: ["低 25%", "中 50%"]
    description: "半分の状態を隣に置く。 25% との差が高さで分かる。"
  - step: "75% まで並べる" 1.6s
    focus: ["低 25%", "中 50%", "高 75%"]
    description: "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。"
  - step: "つまみで動かす" 1.6s
    focus: ["低 25%", "中 50%", "高 75%", "つまみ ({v}%)"]
    description: "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
`;

export const sourceJson__shapeRectFill = `{
  "title": "四角の塗り割合を 4 段階で見せる",
  "type": "flow",
  "inputs": [
    { "id": "v", "kind": "slider", "min": 0, "max": 100, "defaultValue": 40, "label": "値" }
  ],
  "lanes": {
    "low": { "x": 0, "width": 130 },
    "mid": { "x": 150, "width": 130 },
    "high": { "x": 300, "width": 130 },
    "interactive": { "x": 450, "width": 160 }
  },
  "actors": [
    {
      "name": "低 25%",
      "kind": "dyn-rect",
      "lane": "low",
      "stack": 0,
      "shape": { "kind": "rect", "source": "{low25}", "fillMax": 100, "orient": "up", "fill": "#a08870" },
      "posW": 100,
      "posH": 240
    },
    {
      "name": "中 50%",
      "kind": "dyn-rect",
      "lane": "mid",
      "stack": 0,
      "shape": { "kind": "rect", "source": "{mid50}", "fillMax": 100, "orient": "up", "fill": "#2563eb" },
      "posW": 100,
      "posH": 240
    },
    {
      "name": "高 75%",
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
      "name": "つまみ ({v}%)",
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
      "focus": ["低 25%"],
      "body": "塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。"
    },
    {
      "step": "50% と並べる",
      "duration": 1.6,
      "focus": ["低 25%", "中 50%"],
      "body": "半分の状態を隣に置く。 25% との差が高さで分かる。"
    },
    {
      "step": "75% まで並べる",
      "duration": 1.6,
      "focus": ["低 25%", "中 50%", "高 75%"],
      "body": "4 分の 3 まで並べる。 3 段階の差が一目で比べられる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["低 25%", "中 50%", "高 75%", "つまみ ({v}%)"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__shapeWaveTank = `title: "波の水位を 4 段階で見せる"
type: flow

inputs:
  lvl: { kind: slider, min: 0, max: 100, defaultValue: 55, label: "水位" }

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
  - wLow: { kind: dyn-wave, lane: low, stack: 0, subtitle: "25%", shape: { kind: wave, level: "{lvl25}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#a08870" }, posW: 140, posH: 220, title: "低" }
  - wHalf: { kind: dyn-wave, lane: half, stack: 0, subtitle: "50%", shape: { kind: wave, level: "{lvl50}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#2563eb" }, posW: 140, posH: 220, title: "半分" }
  - wHigh: { kind: dyn-wave, lane: high, stack: 0, subtitle: "75%", shape: { kind: wave, level: "{lvl75}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#f97316" }, posW: 140, posH: 220, title: "高" }
  - w: { kind: dyn-wave, lane: interactive, stack: 0, subtitle: "{lvl}%", shape: { kind: wave, level: "{lvl}", amplitude: 100, frequency: 2, waveHeight: 5, fill: "#4e9dc4" }, posW: 140, posH: 220, title: "波" }

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
      "label": "水位"
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
      "title": "低"
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
      "title": "半分"
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
      "title": "高"
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
      "title": "波"
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
  current: { kind: stepper, min: 0, max: 3, defaultValue: 2, label: "いまの段階" }

readouts:
  os: { kind: order-status, source: "current", stepsSource: "steps", color: "#2563eb", label: "配送状況 (記号の帯)" }

lanes:
  col1: { x: 0, width: 340 }
  col2: { x: 380, width: 340 }

states:
  current: 2
  steps: '["梱包済み","発送済み","配達中","配達完了"]'

actors:
  - 📦 梱包済み: { kind: card, lane: col1, stack: 0, subtitle: "倉庫で箱に詰めた", posW: 250  }
  - 🚚 発送済み: { kind: card, lane: col2, stack: 0, subtitle: "運送会社に渡した", posW: 270  }
  - 🏠 配達中: { kind: card, lane: col1, stack: 1, subtitle: "向かっている (初期値)", posW: 290  }
  - ✅ 配達完了: { kind: card, lane: col2, stack: 1, subtitle: "受け取りが済んだ", posW: 290  }

flow:
  - 📦 梱包済み -> 🚚 発送済み: "引き継ぐ" (success)
  - 🚚 発送済み -> 🏠 配達中: "輸送中" (info)
  - 🏠 配達中 -> ✅ 配達完了: "到着" (warning)

animation:
  - step: "梱包と発送" 1.2s
    focus: ["📦 梱包済み"]
    badge: "追跡"
  - step: "配達中まで" 1.2s
    focus: ["📦 梱包済み", "🚚 発送済み"]
    badge: "追跡"
  - step: "配達完了" 1.2s
    focus: ["📦 梱包済み", "🚚 発送済み", "🏠 配達中", "✅ 配達完了"]
    badge: "追跡"
    description: "梱包済み / 発送済み / 配達中 / 配達完了の 4 つを 2 列 2 段に置き、矢印で順につなぐ。 段階を動かすと、下の記号の帯でいまの段階までが塗られる。"
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
      "label": "いまの段階"
    }
  ],
  "readouts": [
    {
      "id": "os",
      "kind": "order-status",
      "source": "current",
      "stepsSource": "steps",
      "color": "#2563eb",
      "label": "配送状況 (記号の帯)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 340 },
    "col2": { "x": 380, "width": 340 }
  },
  "actors": [
    {
      "name": "📦 梱包済み",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "倉庫で箱に詰めた",
      "posW": 250
    },
    {
      "name": "🚚 発送済み",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "運送会社に渡した",
      "posW": 270
    },
    {
      "name": "🏠 配達中",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "向かっている (初期値)",
      "posW": 290
    },
    {
      "name": "✅ 配達完了",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "受け取りが済んだ",
      "posW": 290
    }
  ],
  "flow": [
    { "from": "📦 梱包済み", "to": "🚚 発送済み", "label": "引き継ぐ", "tone": "success" },
    { "from": "🚚 発送済み", "to": "🏠 配達中", "label": "輸送中", "tone": "info" },
    { "from": "🏠 配達中", "to": "✅ 配達完了", "label": "到着", "tone": "warning" }
  ],
  "states": { "current": 2, "steps": "[\\"梱包済み\\",\\"発送済み\\",\\"配達中\\",\\"配達完了\\"]" },
  "animation": [
    { "step": "梱包と発送", "duration": 1.2, "focus": ["📦 梱包済み"], "badge": "追跡" },
    {
      "step": "配達中まで",
      "duration": 1.2,
      "focus": ["📦 梱包済み", "🚚 発送済み"],
      "badge": "追跡"
    },
    {
      "step": "配達完了",
      "duration": 1.2,
      "focus": ["📦 梱包済み", "🚚 発送済み", "🏠 配達中", "✅ 配達完了"],
      "badge": "追跡",
      "body": "梱包済み / 発送済み / 配達中 / 配達完了の 4 つを 2 列 2 段に置き、矢印で順につなぐ。 段階を動かすと、下の記号の帯でいまの段階までが塗られる。"
    }
  ]
}`;

export const sourceYaml__stepperControl = `title: "増減ボタンで棒と数値が動く"
type: flow

inputs:
  count: { kind: stepper, min: 0, max: 10, defaultValue: 3, label: "個数" }

readouts:
  countBar: { kind: bar, source: "count", min: 0, max: 10, label: "進み具合の棒" }
  countStat: { kind: stat, source: "count", unit: " 個", label: "合計" }

lanes:
  ctrl: { x: 0, width: 200 }
  bar: { x: 240, width: 220 }
  stat: { x: 480, width: 200 }

states:
  count: 3

actors:
  - 増減ボタン: { kind: card, lane: ctrl, stack: 0, subtitle: "個数 = {count} (0〜10)" }
  - 棒で見る: { kind: card, lane: bar, stack: 0, subtitle: "個数に追随する棒" }
  - 数で見る: { kind: card, lane: stat, stack: 0, subtitle: "個数に追随する数と単位" }

flow:
  - 増減ボタン -> 棒で見る: "→ 棒" (info)
  - 増減ボタン -> 数で見る: "→ 数" (success)

animation:
  - step: "3 個" 1.8s
    focus: ["増減ボタン"]
    description: "初期の 3 個。 棒の長さと数字が同じ値を見ている。"
  - step: "増やす" 1.8s
    focus: ["増減ボタン", "棒で見る"]
    description: "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。"
  - step: "読み取る" 1.8s
    focus: ["増減ボタン", "棒で見る", "数で見る"]
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
      "label": "個数"
    }
  ],
  "readouts": [
    {
      "id": "countBar",
      "kind": "bar",
      "source": "count",
      "min": 0,
      "max": 10,
      "label": "進み具合の棒"
    },
    { "id": "countStat", "kind": "stat", "source": "count", "unit": " 個", "label": "合計" }
  ],
  "lanes": {
    "ctrl": { "x": 0, "width": 200 },
    "bar": { "x": 240, "width": 220 },
    "stat": { "x": 480, "width": 200 }
  },
  "actors": [
    {
      "name": "増減ボタン",
      "kind": "card",
      "lane": "ctrl",
      "stack": 0,
      "subtitle": "個数 = {count} (0〜10)"
    },
    {
      "name": "棒で見る",
      "kind": "card",
      "lane": "bar",
      "stack": 0,
      "subtitle": "個数に追随する棒"
    },
    {
      "name": "数で見る",
      "kind": "card",
      "lane": "stat",
      "stack": 0,
      "subtitle": "個数に追随する数と単位"
    }
  ],
  "flow": [
    { "from": "増減ボタン", "to": "棒で見る", "label": "→ 棒", "tone": "info" },
    { "from": "増減ボタン", "to": "数で見る", "label": "→ 数", "tone": "success" }
  ],
  "states": { "count": 3 },
  "animation": [
    {
      "step": "3 個",
      "duration": 1.8,
      "focus": ["増減ボタン"],
      "body": "初期の 3 個。 棒の長さと数字が同じ値を見ている。"
    },
    {
      "step": "増やす",
      "duration": 1.8,
      "focus": ["増減ボタン", "棒で見る"],
      "body": "ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。"
    },
    {
      "step": "読み取る",
      "duration": 1.8,
      "focus": ["増減ボタン", "棒で見る", "数で見る"],
      "body": "右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。"
    }
  ]
}`;

export const sourceYaml__userAvatar = `title: "名前からアイコン画像を組み立てる"
type: flow

inputs:
  user: { kind: text, defaultValue: "佐藤 花子", placeholder: "氏名", maxLength: 40, label: "名前" }

readouts:
  av: { kind: avatar, source: "user", size: 56, color: "#2563eb", label: "アイコン (描いた結果)" }

lanes:
  col1: { x: 0, width: 370 }
  col2: { x: 410, width: 370 }

states:
  user: "佐藤 花子"

actors:
  - 文字の入力: { kind: card, lane: col1, stack: 0, subtitle: "名前 = {user}", posW: 270 }
  - 頭文字: { kind: card, lane: col2, stack: 0, subtitle: "語ごとの頭の 1 字を 2 つまで (佐藤 花子 → 佐花)", posW: 320 }
  - 丸: { kind: card, lane: col1, stack: 1, subtitle: "大きさ 56 · 青い丸に頭文字", posW: 320 }

flow:
  - 文字の入力 -> 頭文字: "切り出す" (info)
  - 頭文字 -> 丸: "描く" (success)

animation:
  - step: "名前を受ける" 1.2s
    focus: ["文字の入力"]
    badge: "アイコン"
  - step: "頭文字を取る" 1.2s
    focus: ["文字の入力", "頭文字"]
    badge: "アイコン"
  - step: "絵にする" 1.2s
    focus: ["文字の入力", "頭文字", "丸"]
    badge: "アイコン"
    description: "名前を受け、頭文字を取り、丸に描くまでの 3 段が並ぶ。 入力欄の名前を書き換えると、3 つの箱と下のアイコンが一緒に変わる。"
`;

export const sourceJson__userAvatar = `{
  "title": "名前からアイコン画像を組み立てる",
  "type": "flow",
  "inputs": [
    {
      "id": "user",
      "kind": "text",
      "defaultValue": "佐藤 花子",
      "placeholder": "氏名",
      "maxLength": 40,
      "label": "名前"
    }
  ],
  "readouts": [
    {
      "id": "av",
      "kind": "avatar",
      "source": "user",
      "size": 56,
      "color": "#2563eb",
      "label": "アイコン (描いた結果)"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 370 }
  },
  "actors": [
    {
      "name": "文字の入力",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "名前 = {user}",
      "posW": 270
    },
    {
      "name": "頭文字",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "語ごとの頭の 1 字を 2 つまで (佐藤 花子 → 佐花)",
      "posW": 320
    },
    {
      "name": "丸",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "大きさ 56 · 青い丸に頭文字",
      "posW": 320
    }
  ],
  "flow": [
    { "from": "文字の入力", "to": "頭文字", "label": "切り出す", "tone": "info" },
    { "from": "頭文字", "to": "丸", "label": "描く", "tone": "success" }
  ],
  "states": { "user": "佐藤 花子" },
  "animation": [
    { "step": "名前を受ける", "duration": 1.2, "focus": ["文字の入力"], "badge": "アイコン" },
    {
      "step": "頭文字を取る",
      "duration": 1.2,
      "focus": ["文字の入力", "頭文字"],
      "badge": "アイコン"
    },
    {
      "step": "絵にする",
      "duration": 1.2,
      "focus": ["文字の入力", "頭文字", "丸"],
      "badge": "アイコン",
      "body": "名前を受け、頭文字を取り、丸に描くまでの 3 段が並ぶ。 入力欄の名前を書き換えると、3 つの箱と下のアイコンが一緒に変わる。"
    }
  ]
}`;

export const sourceYaml__xypadNavigate = `title: "XY パッドの座標が 4 象限のどこかを示す"
type: flow

inputs:
  pos: { kind: xypad, xMin: 0, xMax: 100, yMin: 0, yMax: 100, defaultX: 50, defaultY: 50, label: "位置" }

readouts:
  posStat: { kind: stat, source: "pos", caption: "横, 縦 の順に 0〜100", label: "選んだ座標" }

lanes:
  q2: { x: 0, width: 160 }
  q1: { x: 180, width: 160 }
  q3: { x: 360, width: 160 }
  q4: { x: 540, width: 160 }

states:
  pos: "50,50"

actors:
  - q2Node: { kind: card, lane: q2, stack: 0, subtitle: "第 2 象限", title: "左上" }
  - q1Node: { kind: card, lane: q1, stack: 0, subtitle: "第 1 象限", title: "右上" }
  - q3Node: { kind: card, lane: q3, stack: 0, subtitle: "第 3 象限", title: "左下" }
  - q4Node: { kind: card, lane: q4, stack: 0, subtitle: "第 4 象限", title: "右下" }
  - indicator: { kind: card, lane: q1, stack: 1, subtitle: "{pos} (初期値は中央で、右上との境目)", title: "◆ いまの位置" }

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
      "label": "位置"
    }
  ],
  "readouts": [
    {
      "id": "posStat",
      "kind": "stat",
      "source": "pos",
      "caption": "横, 縦 の順に 0〜100",
      "label": "選んだ座標"
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
      "subtitle": "第 2 象限",
      "title": "左上"
    },
    {
      "name": "q1Node",
      "kind": "card",
      "lane": "q1",
      "stack": 0,
      "subtitle": "第 1 象限",
      "title": "右上"
    },
    {
      "name": "q3Node",
      "kind": "card",
      "lane": "q3",
      "stack": 0,
      "subtitle": "第 3 象限",
      "title": "左下"
    },
    {
      "name": "q4Node",
      "kind": "card",
      "lane": "q4",
      "stack": 0,
      "subtitle": "第 4 象限",
      "title": "右下"
    },
    {
      "name": "indicator",
      "kind": "card",
      "lane": "q1",
      "stack": 1,
      "subtitle": "{pos} (初期値は中央で、右上との境目)",
      "title": "◆ いまの位置"
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
  dx: { kind: slider, min: -80, max: 80, defaultValue: 0, label: "横のずれ" }
  dy: { kind: slider, min: -40, max: 40, defaultValue: 0, label: "縦のずれ" }

lanes:
  anchor-lane: { x: 0, width: 240 }
  floater-lane: { x: 300, width: 300 }

states:
  dx: 0
  dy: 0

actors:
  - 基準の点: { kind: card, lane: anchor-lane, stack: 0, subtitle: "つまみに追随しない" }
  - ずれる点: { kind: card, lane: floater-lane, stack: 0, subtitle: "横 {dx} · 縦 {dy}", renderOffsetX: "{dx}", renderOffsetY: "{dy}" }

animation:
  - step: "基準を置く" 1.6s
    focus: ["基準の点"]
    description: "動かない点を先に置く。 ここが位置の基準になる。"
  - step: "ずれを見る" 1.6s
    focus: ["基準の点", "ずれる点"]
    description: "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。"
  - step: "つまみで動かす" 1.6s
    focus: ["ずれる点"]
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
      "label": "横のずれ"
    },
    {
      "id": "dy",
      "kind": "slider",
      "min": -40,
      "max": 40,
      "defaultValue": 0,
      "label": "縦のずれ"
    }
  ],
  "lanes": {
    "anchor-lane": { "x": 0, "width": 240 },
    "floater-lane": { "x": 300, "width": 300 }
  },
  "actors": [
    {
      "name": "基準の点",
      "kind": "card",
      "lane": "anchor-lane",
      "stack": 0,
      "subtitle": "つまみに追随しない"
    },
    {
      "name": "ずれる点",
      "kind": "card",
      "lane": "floater-lane",
      "stack": 0,
      "subtitle": "横 {dx} · 縦 {dy}",
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
      "focus": ["基準の点"],
      "body": "動かない点を先に置く。 ここが位置の基準になる。"
    },
    {
      "step": "ずれを見る",
      "duration": 1.6,
      "focus": ["基準の点", "ずれる点"],
      "body": "もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。"
    },
    {
      "step": "つまみで動かす",
      "duration": 1.6,
      "focus": ["ずれる点"],
      "body": "つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。"
    }
  ]
}`;

export const sourceYaml__visualBindBar = `title: "信号の値が棒の実際の幅と高さに反映される"
type: flow

inputs:
  barW: { kind: slider, min: 40, max: 320, defaultValue: 160, label: "棒の幅" }

readouts:
  barMon: { kind: bar, source: "barW", min: 40, max: 320, label: "いまの幅" }

lanes:
  signal: { x: 0, width: 200 }
  bar-lane: { x: 240, width: 340 }
  readout: { x: 600, width: 220 }

states:
  barW: 160

actors:
  - signalNode: { kind: card, lane: signal, stack: 0, subtitle: "幅 = {barW}", title: "信号" }
  - bar: { kind: card, lane: bar-lane, stack: 0, subtitle: "幅 {barW}px", wBind: "{barW}", posW: 160, title: "横の棒" }
  - barTall: { kind: card, lane: bar-lane, stack: 1, subtitle: "高さ {barW}px", hBind: "{barW}", posH: 96, title: "縦の棒" }
  - readoutNode: { kind: card, lane: readout, stack: 0, subtitle: "同じ信号を数でも出す", title: "数の表示" }

flow:
  - signalNode -> bar: "幅に使う" (info)
  - signalNode -> barTall: "高さに使う" (warning)
  - signalNode -> readoutNode: "数で出す" (success)

animation:
  - step: "信号を見る" 1.8s
    focus: ["signalNode"]
    description: "左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。"
  - step: "棒に届く" 1.8s
    focus: ["signalNode", "bar", "barTall"]
    description: "同じ信号が、上の棒では幅に、下の棒では高さになる。 つまみを動かすと両方が追いかける。"
  - step: "数でも読む" 1.8s
    focus: ["signalNode", "bar", "barTall", "readoutNode"]
    description: "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。"
`;

export const sourceJson__visualBindBar = `{
  "title": "信号の値が棒の実際の幅と高さに反映される",
  "type": "flow",
  "inputs": [
    {
      "id": "barW",
      "kind": "slider",
      "min": 40,
      "max": 320,
      "defaultValue": 160,
      "label": "棒の幅"
    }
  ],
  "readouts": [
    {
      "id": "barMon",
      "kind": "bar",
      "source": "barW",
      "min": 40,
      "max": 320,
      "label": "いまの幅"
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
      "subtitle": "幅 = {barW}",
      "title": "信号"
    },
    {
      "name": "bar",
      "kind": "card",
      "lane": "bar-lane",
      "stack": 0,
      "subtitle": "幅 {barW}px",
      "wBind": "{barW}",
      "posW": 160,
      "title": "横の棒"
    },
    {
      "name": "barTall",
      "kind": "card",
      "lane": "bar-lane",
      "stack": 1,
      "subtitle": "高さ {barW}px",
      "hBind": "{barW}",
      "posH": 96,
      "title": "縦の棒"
    },
    {
      "name": "readoutNode",
      "kind": "card",
      "lane": "readout",
      "stack": 0,
      "subtitle": "同じ信号を数でも出す",
      "title": "数の表示"
    }
  ],
  "flow": [
    { "from": "signalNode", "to": "bar", "label": "幅に使う", "tone": "info" },
    { "from": "signalNode", "to": "barTall", "label": "高さに使う", "tone": "warning" },
    { "from": "signalNode", "to": "readoutNode", "label": "数で出す", "tone": "success" }
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
      "focus": ["signalNode", "bar", "barTall"],
      "body": "同じ信号が、上の棒では幅に、下の棒では高さになる。 つまみを動かすと両方が追いかける。"
    },
    {
      "step": "数でも読む",
      "duration": 1.8,
      "focus": ["signalNode", "bar", "barTall", "readoutNode"],
      "body": "右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。"
    }
  ]
}`;

export const sourceYaml__eip1559GasFlow = `title: "EIP-1559 の手数料が 3 ブロックで変わる"
type: flow

inputs:
  baseFee: { kind: slider, min: 10, max: 200, defaultValue: 50, label: "基準手数料 (gwei)" }
  priority: { kind: slider, min: 1, max: 30, defaultValue: 5, label: "優先手数料" }

readouts:
  gas: { kind: stacked-bar, sourceA: "burned", sourceB: "tips", min: 0, max: 120, colorA: "#ef4444", colorB: "#22c55e", label: "ブロックごとの焼却分 / 優先分" }

formulas:
  total1: { expression: "baseFee + priority", label: "ブロック N の手数料" }
  total2: { expression: "(baseFee + priority) * 12 / 10", label: "ブロック N+1 の手数料" }
  total3: { expression: "(baseFee + priority) * 15 / 10", label: "ブロック N+2 の手数料" }

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
  - 財布: { kind: card, lane: col1, stack: 0, subtitle: "基準 {baseFee} + 優先 {priority} gwei", posW: 320 }
  - ブロック N: { kind: card, lane: col1, stack: 1, subtitle: "×1.0 = {total1} gwei", posW: 240 }
  - ブロック N+1: { kind: card, lane: col2, stack: 0, subtitle: "×1.2 = {total2} gwei", posW: 250 }
  - ブロック N+2: { kind: card, lane: col2, stack: 1, subtitle: "×1.5 = {total3} gwei", posW: 250 }

flow:
  - 財布 -> ブロック N: "取引を送る" (info) { sub: "基準 + 優先" }
  - ブロック N -> ブロック N+1: "次のブロック" (warning) { sub: "手数料 +20%" }
  - ブロック N+1 -> ブロック N+2: "次のブロック" (error) { sub: "手数料 +25%" }

animation:
  - step: "1 ブロック目" 1.8s
    focus: ["財布", "ブロック N"]
    set:
      burned: "[50,0,0]"
      tips: "[5,0,0]"
    description: "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。"
  - step: "2 ブロック目" 1.8s
    focus: ["財布", "ブロック N", "ブロック N+1"]
    set:
      burned: "[50,60,0]"
      tips: "[5,8,0]"
    description: "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。"
  - step: "3 ブロック目" 1.8s
    focus: ["財布", "ブロック N", "ブロック N+1", "ブロック N+2"]
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
      "label": "基準手数料 (gwei)"
    },
    {
      "id": "priority",
      "kind": "slider",
      "min": 1,
      "max": 30,
      "defaultValue": 5,
      "label": "優先手数料"
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
      "label": "ブロックごとの焼却分 / 優先分"
    }
  ],
  "formulas": {
    "total1": { "expression": "baseFee + priority", "label": "ブロック N の手数料" },
    "total2": { "expression": "(baseFee + priority) * 12 / 10", "label": "ブロック N+1 の手数料" },
    "total3": { "expression": "(baseFee + priority) * 15 / 10", "label": "ブロック N+2 の手数料" }
  },
  "lanes": {
    "col1": { "x": 0, "width": 370 },
    "col2": { "x": 410, "width": 300 }
  },
  "actors": [
    {
      "name": "財布",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "基準 {baseFee} + 優先 {priority} gwei",
      "posW": 320
    },
    {
      "name": "ブロック N",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "×1.0 = {total1} gwei",
      "posW": 240
    },
    {
      "name": "ブロック N+1",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "×1.2 = {total2} gwei",
      "posW": 250
    },
    {
      "name": "ブロック N+2",
      "kind": "card",
      "lane": "col2",
      "stack": 1,
      "subtitle": "×1.5 = {total3} gwei",
      "posW": 250
    }
  ],
  "flow": [
    {
      "from": "財布",
      "to": "ブロック N",
      "label": "取引を送る",
      "sub": "基準 + 優先",
      "tone": "info"
    },
    {
      "from": "ブロック N",
      "to": "ブロック N+1",
      "label": "次のブロック",
      "sub": "手数料 +20%",
      "tone": "warning"
    },
    {
      "from": "ブロック N+1",
      "to": "ブロック N+2",
      "label": "次のブロック",
      "sub": "手数料 +25%",
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
      "focus": ["財布", "ブロック N"],
      "set": { "burned": "[50,0,0]", "tips": "[5,0,0]" },
      "body": "基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。"
    },
    {
      "step": "2 ブロック目",
      "duration": 1.8,
      "focus": ["財布", "ブロック N", "ブロック N+1"],
      "set": { "burned": "[50,60,0]", "tips": "[5,8,0]" },
      "body": "混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。"
    },
    {
      "step": "3 ブロック目",
      "duration": 1.8,
      "focus": ["財布", "ブロック N", "ブロック N+1", "ブロック N+2"],
      "set": { "burned": "[50,60,72]", "tips": "[5,8,10]" },
      "body": "さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。"
    }
  ]
}`;

export const sourceYaml__formulaTextBind = `title: "入力値から 2 倍と半分を自動計算する"
type: flow

inputs:
  input: { kind: number, defaultValue: 10, label: "元の値" }

formulas:
  doubled: { expression: "input * 2", label: "2 倍" }
  halved: { expression: "input / 2", label: "半分" }

lanes:
  input: { x: 0, width: 200 }
  doubled: { x: 240, width: 200 }
  halved: { x: 480, width: 200 }

states:
  input: 10
  doubled: 20
  halved: 5

actors:
  - in: { kind: card, lane: input, stack: 0, subtitle: "値 = {input}", title: "元の値" }
  - out1: { kind: card, lane: doubled, stack: 0, subtitle: "元の値 × 2 = {doubled}", title: "2 倍" }
  - out2: { kind: card, lane: halved, stack: 0, subtitle: "元の値 ÷ 2 = {halved}", title: "半分" }

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
    { "id": "input", "kind": "number", "defaultValue": 10, "label": "元の値" }
  ],
  "formulas": {
    "doubled": { "expression": "input * 2", "label": "2 倍" },
    "halved": { "expression": "input / 2", "label": "半分" }
  },
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
      "subtitle": "値 = {input}",
      "title": "元の値"
    },
    {
      "name": "out1",
      "kind": "card",
      "lane": "doubled",
      "stack": 0,
      "subtitle": "元の値 × 2 = {doubled}",
      "title": "2 倍"
    },
    {
      "name": "out2",
      "kind": "card",
      "lane": "halved",
      "stack": 0,
      "subtitle": "元の値 ÷ 2 = {halved}",
      "title": "半分"
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

export const sourceYaml__pattern__formulaTextBind__名前のまま描く = `title: "入力値から 2 倍と半分を自動計算する"
type: flow

inputs:
  input: { kind: number, defaultValue: 10, label: "元の値" }

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
  - in: { kind: card, lane: input, stack: 0, subtitle: "値 = {input}", title: "元の値" }
  - out1: { kind: card, lane: doubled, stack: 0, subtitle: "元の値 × 2 = {doubled}", title: "2 倍" }
  - out2: { kind: card, lane: halved, stack: 0, subtitle: "元の値 ÷ 2 = {halved}", title: "半分" }

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

export const sourceJson__pattern__formulaTextBind__名前のまま描く = `{
  "title": "入力値から 2 倍と半分を自動計算する",
  "type": "flow",
  "inputs": [
    { "id": "input", "kind": "number", "defaultValue": 10, "label": "元の値" }
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
      "subtitle": "値 = {input}",
      "title": "元の値"
    },
    {
      "name": "out1",
      "kind": "card",
      "lane": "doubled",
      "stack": 0,
      "subtitle": "元の値 × 2 = {doubled}",
      "title": "2 倍"
    },
    {
      "name": "out2",
      "kind": "card",
      "lane": "halved",
      "stack": 0,
      "subtitle": "元の値 ÷ 2 = {halved}",
      "title": "半分"
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

export const sourceYaml__kpiDashboard =`title: "SaaS の主要指標 4 つを 1 画面に並べる"
type: flow

inputs:
  revenueInput: { kind: slider, min: 10, max: 500, defaultValue: 120, label: "月の売上 (千ドル)" }

readouts:
  rev: { kind: stat, source: "revenueInput", unit: " 千ドル", label: "売上" }
  usr: { kind: stat, source: "users", label: "利用者" }
  chr: { kind: gauge, source: "churn", min: 0, max: 60, color: "#ef4444", label: "解約率 (%)" }
  np: { kind: percent-ring, source: "nps", max: 100, color: "#22c55e", label: "推奨度" }

formulas:
  users: { expression: "revenueInput * 8", label: "利用者" }
  churn: { expression: "50 - revenueInput / 10", label: "解約率" }
  nps: { expression: "revenueInput / 2 + 20", label: "推奨度" }

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
  - revCard: { kind: card, lane: revenue, stack: 0, subtitle: "月 {revenueInput} 千ドル", title: "売上" }
  - usersCard: { kind: card, lane: users, stack: 0, subtitle: "{users} 人が利用中", title: "利用者" }
  - churnCard: { kind: card, lane: churn, stack: 0, subtitle: "月 {churn}%", title: "解約率" }
  - npsCard: { kind: card, lane: nps, stack: 0, subtitle: "{nps} 点", title: "推奨度" }

flow:
  - revCard -> usersCard: "×8" (info) { sub: "獲得" }
  - revCard -> churnCard: "逆に動く" (error) { sub: "50 − 売上/10" }
  - revCard -> npsCard: "同じ向きに動く" (success) { sub: "売上/2 + 20", side: "bottom" }

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
      "label": "月の売上 (千ドル)"
    }
  ],
  "readouts": [
    { "id": "rev", "kind": "stat", "source": "revenueInput", "unit": " 千ドル", "label": "売上" },
    { "id": "usr", "kind": "stat", "source": "users", "label": "利用者" },
    {
      "id": "chr",
      "kind": "gauge",
      "source": "churn",
      "min": 0,
      "max": 60,
      "color": "#ef4444",
      "label": "解約率 (%)"
    },
    {
      "id": "np",
      "kind": "percent-ring",
      "source": "nps",
      "max": 100,
      "color": "#22c55e",
      "label": "推奨度"
    }
  ],
  "formulas": {
    "users": { "expression": "revenueInput * 8", "label": "利用者" },
    "churn": { "expression": "50 - revenueInput / 10", "label": "解約率" },
    "nps": { "expression": "revenueInput / 2 + 20", "label": "推奨度" }
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
      "subtitle": "月 {revenueInput} 千ドル",
      "title": "売上"
    },
    {
      "name": "usersCard",
      "kind": "card",
      "lane": "users",
      "stack": 0,
      "subtitle": "{users} 人が利用中",
      "title": "利用者"
    },
    {
      "name": "churnCard",
      "kind": "card",
      "lane": "churn",
      "stack": 0,
      "subtitle": "月 {churn}%",
      "title": "解約率"
    },
    {
      "name": "npsCard",
      "kind": "card",
      "lane": "nps",
      "stack": 0,
      "subtitle": "{nps} 点",
      "title": "推奨度"
    }
  ],
  "flow": [
    {
      "from": "revCard",
      "to": "usersCard",
      "label": "×8",
      "sub": "獲得",
      "tone": "info"
    },
    {
      "from": "revCard",
      "to": "churnCard",
      "label": "逆に動く",
      "sub": "50 − 売上/10",
      "tone": "error"
    },
    {
      "from": "revCard",
      "to": "npsCard",
      "label": "同じ向きに動く",
      "sub": "売上/2 + 20",
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
  progress: { kind: slider, min: 0, max: 100, defaultValue: 40, label: "進み具合" }

readouts:
  pp: { kind: path-progress, source: "progress", pathD: "M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10", viewW: 270, viewH: 40, strokeWidth: 5, color: "#22c55e", max: 100, label: "経路 (ジグザグ)" }
  ring: { kind: percent-ring, source: "progress", max: 100, color: "#22c55e", label: "円" }

formulas:
  done: { expression: "progress >= 100 ? 1 : 0", label: "完了したか" }

lanes:
  state: { x: 0, width: 200 }
  visual: { x: 240, width: 300 }
  done: { x: 560, width: 200 }

states:
  progress: 40
  done: 0

actors:
  - main: { kind: card, lane: state, stack: 0, subtitle: "{progress}% 完了", title: "作業の状態" }
  - pathNode: { kind: card, lane: visual, stack: 0, subtitle: "線を塗る位置で進みを出す", title: "経路の表示" }
  - ringNode: { kind: card, lane: visual, stack: 1, subtitle: "同時追随", title: "割合の円" }
  - ok: { kind: card, lane: done, stack: 0, subtitle: "100% に達すると表示される", visibleIf: "{done}", title: "✓ 完了" }

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
      "label": "進み具合"
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
      "label": "経路 (ジグザグ)"
    },
    {
      "id": "ring",
      "kind": "percent-ring",
      "source": "progress",
      "max": 100,
      "color": "#22c55e",
      "label": "円"
    }
  ],
  "formulas": { "done": { "expression": "progress >= 100 ? 1 : 0", "label": "完了したか" } },
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
      "subtitle": "{progress}% 完了",
      "title": "作業の状態"
    },
    {
      "name": "pathNode",
      "kind": "card",
      "lane": "visual",
      "stack": 0,
      "subtitle": "線を塗る位置で進みを出す",
      "title": "経路の表示"
    },
    {
      "name": "ringNode",
      "kind": "card",
      "lane": "visual",
      "stack": 1,
      "subtitle": "同時追随",
      "title": "割合の円"
    },
    {
      "name": "ok",
      "kind": "card",
      "lane": "done",
      "stack": 0,
      "subtitle": "100% に達すると表示される",
      "visibleIf": "{done}",
      "title": "✓ 完了"
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
  base: { kind: slider, min: 0, max: 60, defaultValue: 20, label: "元の値" }

formulas:
  gas1: { expression: "base", label: "ブロック 1 の手数料" }
  gas2: { expression: "gas1 * 1.2", label: "ブロック 2 の手数料" }
  gas3: { expression: "gas2 * 1.2", label: "ブロック 3 の手数料" }
  gas4: { expression: "gas3 * 1.2", label: "ブロック 4 の手数料" }
  gas5: { expression: "gas4 * 1.2", label: "ブロック 5 の手数料" }

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
  - ブロック 1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "手数料: {gas1}", shape: { kind: rect, source: "{gas1}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - ブロック 2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "手数料: {gas2}", shape: { kind: rect, source: "{gas2}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - ブロック 3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "手数料: {gas3}", shape: { kind: rect, source: "{gas3}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - ブロック 4: { kind: dyn-rect, lane: l4, stack: 0, subtitle: "手数料: {gas4}", shape: { kind: rect, source: "{gas4}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }
  - ブロック 5: { kind: dyn-rect, lane: l5, stack: 0, subtitle: "手数料: {gas5}", shape: { kind: rect, source: "{gas5}", fillMax: 130, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 220 }

animation:
  - step: "起点を置く" 1.6s
    focus: ["ブロック 1"]
    description: "元の値が 1 つ目の四角に入る。 ここが連なりの起点。"
  - step: "2 つ目まで伝わる" 1.6s
    focus: ["ブロック 1", "ブロック 2"]
    description: "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。"
  - step: "4 つ目まで伝わる" 1.6s
    focus: ["ブロック 1", "ブロック 2", "ブロック 3", "ブロック 4"]
    description: "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。"
  - step: "端まで届く" 1.6s
    focus: ["ブロック 1", "ブロック 2", "ブロック 3", "ブロック 4", "ブロック 5"]
    description: "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。"
`;

export const sourceJson__repeatDeriveChain = `{
  "title": "repeatNodes + deriveChain で N 個の rect を宣言的に生成、 前値連鎖で伝搬",
  "type": "flow",
  "inputs": [
    { "id": "base", "kind": "slider", "min": 0, "max": 60, "defaultValue": 20, "label": "元の値" }
  ],
  "formulas": {
    "gas1": { "expression": "base", "label": "ブロック 1 の手数料" },
    "gas2": { "expression": "gas1 * 1.2", "label": "ブロック 2 の手数料" },
    "gas3": { "expression": "gas2 * 1.2", "label": "ブロック 3 の手数料" },
    "gas4": { "expression": "gas3 * 1.2", "label": "ブロック 4 の手数料" },
    "gas5": { "expression": "gas4 * 1.2", "label": "ブロック 5 の手数料" }
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
      "name": "ブロック 1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "手数料: {gas1}",
      "shape": { "kind": "rect", "source": "{gas1}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "ブロック 2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "手数料: {gas2}",
      "shape": { "kind": "rect", "source": "{gas2}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "ブロック 3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "手数料: {gas3}",
      "shape": { "kind": "rect", "source": "{gas3}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "ブロック 4",
      "kind": "dyn-rect",
      "lane": "l4",
      "stack": 0,
      "subtitle": "手数料: {gas4}",
      "shape": { "kind": "rect", "source": "{gas4}", "fillMax": 130, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 220
    },
    {
      "name": "ブロック 5",
      "kind": "dyn-rect",
      "lane": "l5",
      "stack": 0,
      "subtitle": "手数料: {gas5}",
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
      "focus": ["ブロック 1"],
      "body": "元の値が 1 つ目の四角に入る。 ここが連なりの起点。"
    },
    {
      "step": "2 つ目まで伝わる",
      "duration": 1.6,
      "focus": ["ブロック 1", "ブロック 2"],
      "body": "前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。"
    },
    {
      "step": "4 つ目まで伝わる",
      "duration": 1.6,
      "focus": ["ブロック 1", "ブロック 2", "ブロック 3", "ブロック 4"],
      "body": "同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。"
    },
    {
      "step": "端まで届く",
      "duration": 1.6,
      "focus": ["ブロック 1", "ブロック 2", "ブロック 3", "ブロック 4", "ブロック 5"],
      "body": "5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。"
    }
  ]
}`;

export const sourceYaml__shapeChainFill = `title: "3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化"
type: flow

inputs:
  base: { kind: slider, min: 0, max: 100, defaultValue: 30, label: "元の値" }

formulas:
  gas1: { expression: "base", label: "ブロック 1 の手数料" }
  gas2: { expression: "base * 1.2", label: "ブロック 2 の手数料" }
  gas3: { expression: "base * 1.5", label: "ブロック 3 の手数料" }

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
  - ブロック 1: { kind: dyn-rect, lane: l1, stack: 0, subtitle: "手数料: {gas1}", shape: { kind: rect, source: "{gas1}", fillMax: 150, orient: "up", fill: "#8a5a2a" }, posW: 100, posH: 220 }
  - ブロック 2: { kind: dyn-rect, lane: l2, stack: 0, subtitle: "手数料: {gas2}", shape: { kind: rect, source: "{gas2}", fillMax: 150, orient: "up", fill: "#4e9dc4" }, posW: 100, posH: 220 }
  - ブロック 3: { kind: dyn-rect, lane: l3, stack: 0, subtitle: "手数料: {gas3}", shape: { kind: rect, source: "{gas3}", fillMax: 150, orient: "up", fill: "#7ec4dd" }, posW: 100, posH: 220 }

animation:
  - step: "等倍で見る" 1.6s
    focus: ["ブロック 1"]
    description: "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。"
  - step: "1.2 倍で見る" 1.6s
    focus: ["ブロック 1", "ブロック 2"]
    description: "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。"
  - step: "1.5 倍で見る" 1.6s
    focus: ["ブロック 1", "ブロック 2", "ブロック 3"]
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
      "label": "元の値"
    }
  ],
  "formulas": {
    "gas1": { "expression": "base", "label": "ブロック 1 の手数料" },
    "gas2": { "expression": "base * 1.2", "label": "ブロック 2 の手数料" },
    "gas3": { "expression": "base * 1.5", "label": "ブロック 3 の手数料" }
  },
  "lanes": {
    "l1": { "x": 0, "width": 130 },
    "l2": { "x": 150, "width": 130 },
    "l3": { "x": 300, "width": 130 }
  },
  "actors": [
    {
      "name": "ブロック 1",
      "kind": "dyn-rect",
      "lane": "l1",
      "stack": 0,
      "subtitle": "手数料: {gas1}",
      "shape": { "kind": "rect", "source": "{gas1}", "fillMax": 150, "orient": "up", "fill": "#8a5a2a" },
      "posW": 100,
      "posH": 220
    },
    {
      "name": "ブロック 2",
      "kind": "dyn-rect",
      "lane": "l2",
      "stack": 0,
      "subtitle": "手数料: {gas2}",
      "shape": { "kind": "rect", "source": "{gas2}", "fillMax": 150, "orient": "up", "fill": "#4e9dc4" },
      "posW": 100,
      "posH": 220
    },
    {
      "name": "ブロック 3",
      "kind": "dyn-rect",
      "lane": "l3",
      "stack": 0,
      "subtitle": "手数料: {gas3}",
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
      "focus": ["ブロック 1"],
      "body": "元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。"
    },
    {
      "step": "1.2 倍で見る",
      "duration": 1.6,
      "focus": ["ブロック 1", "ブロック 2"],
      "body": "2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。"
    },
    {
      "step": "1.5 倍で見る",
      "duration": 1.6,
      "focus": ["ブロック 1", "ブロック 2", "ブロック 3"],
      "body": "3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。"
    }
  ]
}`;

export const sourceYaml__shapeCirclePulse = `title: "円の進捗リングを 4 段階で見せる"
type: flow

inputs:
  p: { kind: slider, min: 0, max: 100, defaultValue: 60, label: "進み具合" }

formulas:
  prog: { expression: "p / 100", label: "塗る割合" }

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
  - 0%: { kind: dyn-circle, lane: empty, stack: 0, subtitle: "空", shape: { kind: circle, fillProgress: "{prog0}", fill: "#a08870" }, posW: 160, posH: 160 }
  - 33%: { kind: dyn-circle, lane: third, stack: 0, subtitle: "3 分の 1", shape: { kind: circle, fillProgress: "{prog33}", fill: "#2563eb" }, posW: 160, posH: 160 }
  - 66%: { kind: dyn-circle, lane: twothird, stack: 0, subtitle: "3 分の 2", shape: { kind: circle, fillProgress: "{prog66}", fill: "#f97316" }, posW: 160, posH: 160 }
  - 輪: { kind: dyn-circle, lane: interactive, stack: 0, subtitle: "{p}%", shape: { kind: circle, fillProgress: "{prog}", fill: "#8a5a2a" }, posW: 160, posH: 160 }

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
    focus: ["0%", "33%", "66%", "輪"]
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
      "label": "進み具合"
    }
  ],
  "formulas": { "prog": { "expression": "p / 100", "label": "塗る割合" } },
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
      "subtitle": "空",
      "shape": { "kind": "circle", "fillProgress": "{prog0}", "fill": "#a08870" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "33%",
      "kind": "dyn-circle",
      "lane": "third",
      "stack": 0,
      "subtitle": "3 分の 1",
      "shape": { "kind": "circle", "fillProgress": "{prog33}", "fill": "#2563eb" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "66%",
      "kind": "dyn-circle",
      "lane": "twothird",
      "stack": 0,
      "subtitle": "3 分の 2",
      "shape": { "kind": "circle", "fillProgress": "{prog66}", "fill": "#f97316" },
      "posW": 160,
      "posH": 160
    },
    {
      "name": "輪",
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
      "focus": ["0%", "33%", "66%", "輪"],
      "body": "右端はつまみで自由に変えられる。 3 つの見本と見比べる。"
    }
  ]
}`;

export const sourceYaml__timelineDrive = `title: "1 つの時間信号が図形 2 種を同時に動かす"
type: flow

inputs:
  t: { kind: timeline, duration: 3000, autoplay: true, loop: true, label: "時間" }

readouts:
  timeCu: { kind: countup, source: "bar", unit: "%", label: "時間 (%)" }

formulas:
  bar: { expression: "t * 100", label: "棒の長さ" }
  angle: { expression: "t * 270", label: "弧の角度" }

lanes:
  time: { x: 0, width: 200 }
  bar: { x: 240, width: 180 }
  arc: { x: 440, width: 220 }

states:
  t: 0
  bar: 0
  angle: 0

actors:
  - timeNode: { kind: card, lane: time, stack: 0, subtitle: "t は 0〜1 を 3 秒でくり返す", title: "時間" }
  - r: { kind: dyn-rect, lane: bar, stack: 0, subtitle: "棒 = t × 100", shape: { kind: rect, source: "{bar}", fillMax: 100, orient: "up", fill: "#8a5a2a" }, posW: 80, posH: 200, title: "棒 (四角)" }
  - a: { kind: dyn-arc, lane: arc, stack: 0, subtitle: "角度 = t × 270", shape: { kind: arc, angle: "{angle}", startAngle: -135, sweepMax: 270, fill: "#4e9dc4" }, posW: 140, posH: 140, title: "弧" }

flow:
  - timeNode -> r: "→ 棒" (info)
  - timeNode -> a: "→ 角度" (accent) { labelOffsetX: -45 }

animation:
  - step: "時間の元を見る" 1.8s
    focus: ["timeNode"]
    description: "時間の入力が元になる。 この値から計算式で図形の値を導く。"
  - step: "四角に届く" 1.8s
    focus: ["timeNode", "r"]
    description: "計算式の値で四角の高さが決まる。 時間が進むと自動で変わる。"
  - step: "弧にも届く" 1.8s
    focus: ["timeNode", "r", "a"]
    description: "弧の角度は別の計算式 (時間の 270 倍) で決まる。 同じ時間から別々の値を導く。"
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
      "label": "時間"
    }
  ],
  "readouts": [
    { "id": "timeCu", "kind": "countup", "source": "bar", "unit": "%", "label": "時間 (%)" }
  ],
  "formulas": {
    "bar": { "expression": "t * 100", "label": "棒の長さ" },
    "angle": { "expression": "t * 270", "label": "弧の角度" }
  },
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
      "subtitle": "t は 0〜1 を 3 秒でくり返す",
      "title": "時間"
    },
    {
      "name": "r",
      "kind": "dyn-rect",
      "lane": "bar",
      "stack": 0,
      "subtitle": "棒 = t × 100",
      "shape": { "kind": "rect", "source": "{bar}", "fillMax": 100, "orient": "up", "fill": "#8a5a2a" },
      "posW": 80,
      "posH": 200,
      "title": "棒 (四角)"
    },
    {
      "name": "a",
      "kind": "dyn-arc",
      "lane": "arc",
      "stack": 0,
      "subtitle": "角度 = t × 270",
      "shape": {
        "kind": "arc",
        "angle": "{angle}",
        "startAngle": -135,
        "sweepMax": 270,
        "fill": "#4e9dc4"
      },
      "posW": 140,
      "posH": 140,
      "title": "弧"
    }
  ],
  "flow": [
    { "from": "timeNode", "to": "r", "label": "→ 棒", "tone": "info" },
    { "from": "timeNode", "to": "a", "label": "→ 角度", "tone": "accent", "labelOffsetX": -45 }
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
      "body": "計算式の値で四角の高さが決まる。 時間が進むと自動で変わる。"
    },
    {
      "step": "弧にも届く",
      "duration": 1.8,
      "focus": ["timeNode", "r", "a"],
      "body": "弧の角度は別の計算式 (時間の 270 倍) で決まる。 同じ時間から別々の値を導く。"
    }
  ]
}`;

export const sourceYaml__timerStopwatch = `title: "秒数と実行状態から時計表示を作る"
type: flow

inputs:
  sec: { kind: stepper, min: 0, max: 3600, step: 5, defaultValue: 125, label: "経過した秒数" }
  running: { kind: toggle, defaultValue: true, label: "動作中" }

readouts:
  sw: { kind: stopwatch, source: "elapsed", runningSource: "running", size: 40, color: "#241c14", label: "時計 (分:秒.ms)" }

formulas:
  elapsed: { expression: "sec * 1000", label: "経過 (ms)" }

lanes:
  input: { x: 0, width: 200 }
  toggle: { x: 240, width: 200 }
  display: { x: 480, width: 220 }

states:
  sec: 125
  running: "true"
  elapsed: 125000

actors:
  - secNode: { kind: card, lane: input, stack: 0, subtitle: "秒数 = {sec} (0〜3600)", title: "秒数" }
  - runNode: { kind: card, lane: toggle, stack: 0, subtitle: "時計を動かすか止めるか", title: "動作中" }
  - displayNode: { kind: card, lane: display, stack: 0, subtitle: "経過 = 秒数 × 1000 = {elapsed}ms", title: "分:秒.ms" }

flow:
  - secNode -> displayNode: "× 1000" (info)
  - runNode -> displayNode: "色" (success)

animation:
  - step: "秒数" 1.2s
    focus: ["secNode"]
    badge: "時計"
  - step: "実行状態" 1.2s
    focus: ["secNode", "runNode"]
    badge: "時計"
  - step: "時計表示" 1.2s
    focus: ["secNode", "runNode", "displayNode"]
    badge: "時計"
    description: "秒数と動作中の 2 つが矢印で時計の表示に集まる。 秒数を変えると下の時計の時刻が、動作中を切り替えると時計の色が変わる。"
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
      "label": "経過した秒数"
    },
    { "id": "running", "kind": "toggle", "defaultValue": true, "label": "動作中" }
  ],
  "readouts": [
    {
      "id": "sw",
      "kind": "stopwatch",
      "source": "elapsed",
      "runningSource": "running",
      "size": 40,
      "color": "#241c14",
      "label": "時計 (分:秒.ms)"
    }
  ],
  "formulas": { "elapsed": { "expression": "sec * 1000", "label": "経過 (ms)" } },
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
      "subtitle": "秒数 = {sec} (0〜3600)",
      "title": "秒数"
    },
    {
      "name": "runNode",
      "kind": "card",
      "lane": "toggle",
      "stack": 0,
      "subtitle": "時計を動かすか止めるか",
      "title": "動作中"
    },
    {
      "name": "displayNode",
      "kind": "card",
      "lane": "display",
      "stack": 0,
      "subtitle": "経過 = 秒数 × 1000 = {elapsed}ms",
      "title": "分:秒.ms"
    }
  ],
  "flow": [
    { "from": "secNode", "to": "displayNode", "label": "× 1000", "tone": "info" },
    { "from": "runNode", "to": "displayNode", "label": "色", "tone": "success" }
  ],
  "states": { "sec": 125, "running": "true", "elapsed": 125000 },
  "animation": [
    { "step": "秒数", "duration": 1.2, "focus": ["secNode"], "badge": "時計" },
    { "step": "実行状態", "duration": 1.2, "focus": ["secNode", "runNode"], "badge": "時計" },
    {
      "step": "時計表示",
      "duration": 1.2,
      "focus": ["secNode", "runNode", "displayNode"],
      "badge": "時計",
      "body": "秒数と動作中の 2 つが矢印で時計の表示に集まる。 秒数を変えると下の時計の時刻が、動作中を切り替えると時計の色が変わる。"
    }
  ]
}`;

export const sourceYaml__visualBindOpacity = `title: "信号に追随する濃さと固定の濃さを並べる"
type: flow

inputs:
  fade: { kind: slider, min: 0, max: 100, defaultValue: 100, label: "濃さ" }

readouts:
  opGauge: { kind: gauge, source: "fade", min: 0, max: 100, label: "濃さ (%)" }

formulas:
  op: { expression: "fade / 100", label: "不透明度" }

lanes:
  control: { x: 0, width: 200 }
  target-lane: { x: 240, width: 220 }
  ref-lane: { x: 500, width: 200 }

states:
  fade: 100
  op: 1

actors:
  - 濃さの操作: { kind: card, lane: control, stack: 0, subtitle: "濃さ {fade} · 不透明度 {op}" }
  - 追随する側: { kind: card, lane: target-lane, stack: 0, subtitle: "不透明度 {op}", opacity: "{op}" }
  - 固定の側: { kind: card, lane: ref-lane, stack: 0, subtitle: "いつも見える (不透明度 1)" }

flow:
  - 濃さの操作 -> 追随する側: "濃さを渡す" (info)
  - 濃さの操作 -> 固定の側: "渡さない" (warning)

animation:
  - step: "動かす側を見る" 1.8s
    focus: ["濃さの操作", "固定の側"]
    description: "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。"
  - step: "追随する側" 1.8s
    focus: ["濃さの操作", "追随する側", "固定の側"]
    description: "追随する側は信号の値で濃さが決まる。 つまみを動かすとここだけが変わる。"
  - step: "固定の側と比べる" 1.8s
    focus: ["追随する側", "固定の側"]
    description: "固定の側は信号を見ていないので動かない。 2 つを並べると、追随するかどうかの違いが見える。"
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
      "label": "濃さ"
    }
  ],
  "readouts": [
    {
      "id": "opGauge",
      "kind": "gauge",
      "source": "fade",
      "min": 0,
      "max": 100,
      "label": "濃さ (%)"
    }
  ],
  "formulas": { "op": { "expression": "fade / 100", "label": "不透明度" } },
  "lanes": {
    "control": { "x": 0, "width": 200 },
    "target-lane": { "x": 240, "width": 220 },
    "ref-lane": { "x": 500, "width": 200 }
  },
  "actors": [
    {
      "name": "濃さの操作",
      "kind": "card",
      "lane": "control",
      "stack": 0,
      "subtitle": "濃さ {fade} · 不透明度 {op}"
    },
    {
      "name": "追随する側",
      "kind": "card",
      "lane": "target-lane",
      "stack": 0,
      "subtitle": "不透明度 {op}",
      "opacity": "{op}"
    },
    {
      "name": "固定の側",
      "kind": "card",
      "lane": "ref-lane",
      "stack": 0,
      "subtitle": "いつも見える (不透明度 1)"
    }
  ],
  "flow": [
    { "from": "濃さの操作", "to": "追随する側", "label": "濃さを渡す", "tone": "info" },
    { "from": "濃さの操作", "to": "固定の側", "label": "渡さない", "tone": "warning" }
  ],
  "states": { "fade": 100, "op": 1 },
  "animation": [
    {
      "step": "動かす側を見る",
      "duration": 1.8,
      "focus": ["濃さの操作", "固定の側"],
      "body": "左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。"
    },
    {
      "step": "追随する側",
      "duration": 1.8,
      "focus": ["濃さの操作", "追随する側", "固定の側"],
      "body": "追随する側は信号の値で濃さが決まる。 つまみを動かすとここだけが変わる。"
    },
    {
      "step": "固定の側と比べる",
      "duration": 1.8,
      "focus": ["追随する側", "固定の側"],
      "body": "固定の側は信号を見ていないので動かない。 2 つを並べると、追随するかどうかの違いが見える。"
    }
  ]
}`;

export const sourceYaml__edgeFlowBind = `title: "信号で線の太さと色と流れる点が変わる"
type: flow

inputs:
  flow: { kind: slider, min: 1, max: 15, defaultValue: 5, label: "流れの太さ" }
  t: { kind: timeline, duration: 2000, autoplay: true, loop: true, label: "時間" }
  flowColor: { kind: dropdown, options: ["#38bdf8", "#f472b6", "#facc15"], defaultValue: "#38bdf8", label: "線の色" }

formulas:
  dash: { expression: "t * 24", label: "点の位置" }

lanes:
  src: { x: 0, width: 230 }
  pipe: { x: 270, width: 350 }
  sink: { x: 660, width: 190 }

states:
  flow: 5
  t: 0
  dash: 0
  flowColor: "#38bdf8"

actors:
  - a: { kind: card, lane: src, stack: 0, subtitle: "作る側", posW: 180, title: "送り手" }
  - pipeNode: { kind: card, lane: pipe, stack: 0, subtitle: "太さ {flow} · 点の位置 {dash} · 色 {flowColor}", posW: 300, title: "管" }
  - b: { kind: card, lane: sink, stack: 0, subtitle: "使う側", posW: 140, title: "受け手" }

flow:
  - a -> pipeNode: "送る" (accent) { widthBind: "{flow}", strokeBind: "{flowColor}", dashOffsetBind: "{dash}" }
  - pipeNode -> b: "受け取る" (accent) { widthBind: "{flow}", strokeBind: "{flowColor}", dashOffsetBind: "{dash}" }

animation:
  - step: "送り手を見る" 1.6s
    focus: ["a"]
    description: "左の箱が信号を持つ。 まだ線には出ていない。"
  - step: "線に出る" 1.6s
    focus: ["a", "pipeNode"]
    description: "信号の大きさが線の太さになり、選んだ色が線の色になる。 太いほど多く流れている。"
  - step: "受け手まで届く" 1.6s
    focus: ["a", "pipeNode", "b"]
    description: "線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。"
`;

export const sourceJson__edgeFlowBind = `{
  "title": "信号で線の太さと色と流れる点が変わる",
  "type": "flow",
  "inputs": [
    {
      "id": "flow",
      "kind": "slider",
      "min": 1,
      "max": 15,
      "defaultValue": 5,
      "label": "流れの太さ"
    },
    {
      "id": "t",
      "kind": "timeline",
      "duration": 2000,
      "autoplay": true,
      "loop": true,
      "label": "時間"
    },
    {
      "id": "flowColor",
      "kind": "dropdown",
      "options": ["#38bdf8", "#f472b6", "#facc15"],
      "defaultValue": "#38bdf8",
      "label": "線の色"
    }
  ],
  "formulas": { "dash": { "expression": "t * 24", "label": "点の位置" } },
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
      "subtitle": "作る側",
      "posW": 180,
      "title": "送り手"
    },
    {
      "name": "pipeNode",
      "kind": "card",
      "lane": "pipe",
      "stack": 0,
      "subtitle": "太さ {flow} · 点の位置 {dash} · 色 {flowColor}",
      "posW": 300,
      "title": "管"
    },
    {
      "name": "b",
      "kind": "card",
      "lane": "sink",
      "stack": 0,
      "subtitle": "使う側",
      "posW": 140,
      "title": "受け手"
    }
  ],
  "flow": [
    {
      "from": "a",
      "to": "pipeNode",
      "label": "送る",
      "tone": "accent",
      "widthBind": "{flow}",
      "strokeBind": "{flowColor}",
      "dashOffsetBind": "{dash}"
    },
    {
      "from": "pipeNode",
      "to": "b",
      "label": "受け取る",
      "tone": "accent",
      "widthBind": "{flow}",
      "strokeBind": "{flowColor}",
      "dashOffsetBind": "{dash}"
    }
  ],
  "states": { "flow": 5, "t": 0, "dash": 0, "flowColor": "#38bdf8" },
  "animation": [
    { "step": "送り手を見る", "duration": 1.6, "focus": ["a"], "body": "左の箱が信号を持つ。 まだ線には出ていない。" },
    {
      "step": "線に出る",
      "duration": 1.6,
      "focus": ["a", "pipeNode"],
      "body": "信号の大きさが線の太さになり、選んだ色が線の色になる。 太いほど多く流れている。"
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
  active: { kind: toggle, defaultValue: false, onLabel: "押した", offLabel: "押していない", label: "押した状態" }

lanes:
  col1: { x: 0, width: 360 }
  col2: { x: 400, width: 370 }

actors:
  - ボタン: { kind: card, lane: col1, stack: 0, subtitle: "押す先", posW: 180 }
  - 受け取り手: { kind: card, lane: col2, stack: 0, subtitle: "押した時と触れた時に呼ばれる", posW: 320 }
  - 値の状態: { kind: card, lane: col1, stack: 1, subtitle: "押した状態 = {active}", posW: 310 }

flow:
  - ボタン -> 受け取り手: "押す / 触れる" (info)
  - 受け取り手 -> 値の状態: "切り替え" (success)

events:
  - { on: click, box: "ボタン", handler: "toggle-active" }
  - { on: hover, box: "ボタン", handler: "hover-state" }

animation:
  - step: "押す前" 1.6s
    focus: ["ボタン"]
    description: "ボタンだけがある状態。 まだ何も起きていない。"
  - step: "受け取り手を決める" 1.6s
    focus: ["ボタン", "受け取り手"]
    description: "押した時に呼ぶ受け取り手を決める。 受け取り手の中身は使う側が渡す。"
  - step: "押すと値が変わる" 1.6s
    focus: ["ボタン", "受け取り手", "値の状態"]
    description: "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"
`;

export const sourceJson__clickToggle = `{
  "title": "クリックが handler を通って状態に届く",
  "type": "flow",
  "inputs": [
    {
      "id": "active",
      "kind": "toggle",
      "defaultValue": false,
      "onLabel": "押した",
      "offLabel": "押していない",
      "label": "押した状態"
    }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 360 },
    "col2": { "x": 400, "width": 370 }
  },
  "actors": [
    {
      "name": "ボタン",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "押す先",
      "posW": 180
    },
    {
      "name": "受け取り手",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "押した時と触れた時に呼ばれる",
      "posW": 320
    },
    {
      "name": "値の状態",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "押した状態 = {active}",
      "posW": 310
    }
  ],
  "flow": [
    { "from": "ボタン", "to": "受け取り手", "label": "押す / 触れる", "tone": "info" },
    { "from": "受け取り手", "to": "値の状態", "label": "切り替え", "tone": "success" }
  ],
  "events": [
    { "on": "click", "box": "ボタン", "handler": "toggle-active" },
    { "on": "hover", "box": "ボタン", "handler": "hover-state" }
  ],
  "animation": [
    { "step": "押す前", "duration": 1.6, "focus": ["ボタン"], "body": "ボタンだけがある状態。 まだ何も起きていない。" },
    {
      "step": "受け取り手を決める",
      "duration": 1.6,
      "focus": ["ボタン", "受け取り手"],
      "body": "押した時に呼ぶ受け取り手を決める。 受け取り手の中身は使う側が渡す。"
    },
    {
      "step": "押すと値が変わる",
      "duration": 1.6,
      "focus": ["ボタン", "受け取り手", "値の状態"],
      "body": "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"
    }
  ]
}`;

export const sourceYaml__pattern__clickToggle__値のまま描く = `title: "クリックが handler を通って状態に届く"
type: flow

inputs:
  active: { kind: toggle, defaultValue: false, label: "押した状態" }

lanes:
  col1: { x: 0, width: 360 }
  col2: { x: 400, width: 370 }

actors:
  - ボタン: { kind: card, lane: col1, stack: 0, subtitle: "押す先", posW: 180 }
  - 受け取り手: { kind: card, lane: col2, stack: 0, subtitle: "押した時と触れた時に呼ばれる", posW: 320 }
  - 値の状態: { kind: card, lane: col1, stack: 1, subtitle: "押した状態 = {active}", posW: 310 }

flow:
  - ボタン -> 受け取り手: "押す / 触れる" (info)
  - 受け取り手 -> 値の状態: "切り替え" (success)

events:
  - { on: click, box: "ボタン", handler: "toggle-active" }
  - { on: hover, box: "ボタン", handler: "hover-state" }

animation:
  - step: "押す前" 1.6s
    focus: ["ボタン"]
    description: "ボタンだけがある状態。 まだ何も起きていない。"
  - step: "受け取り手を決める" 1.6s
    focus: ["ボタン", "受け取り手"]
    description: "押した時に呼ぶ受け取り手を決める。 受け取り手の中身は使う側が渡す。"
  - step: "押すと値が変わる" 1.6s
    focus: ["ボタン", "受け取り手", "値の状態"]
    description: "受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"
`;

export const sourceJson__pattern__clickToggle__値のまま描く = `{
  "title": "クリックが handler を通って状態に届く",
  "type": "flow",
  "inputs": [
    { "id": "active", "kind": "toggle", "defaultValue": false, "label": "押した状態" }
  ],
  "lanes": {
    "col1": { "x": 0, "width": 360 },
    "col2": { "x": 400, "width": 370 }
  },
  "actors": [
    {
      "name": "ボタン",
      "kind": "card",
      "lane": "col1",
      "stack": 0,
      "subtitle": "押す先",
      "posW": 180
    },
    {
      "name": "受け取り手",
      "kind": "card",
      "lane": "col2",
      "stack": 0,
      "subtitle": "押した時と触れた時に呼ばれる",
      "posW": 320
    },
    {
      "name": "値の状態",
      "kind": "card",
      "lane": "col1",
      "stack": 1,
      "subtitle": "押した状態 = {active}",
      "posW": 310
    }
  ],
  "flow": [
    { "from": "ボタン", "to": "受け取り手", "label": "押す / 触れる", "tone": "info" },
    { "from": "受け取り手", "to": "値の状態", "label": "切り替え", "tone": "success" }
  ],
  "events": [
    { "on": "click", "box": "ボタン", "handler": "toggle-active" },
    { "on": "hover", "box": "ボタン", "handler": "hover-state" }
  ],
  "animation": [
    { "step": "押す前", "duration": 1.6, "focus": ["ボタン"], "body": "ボタンだけがある状態。 まだ何も起きていない。" },
    {
      "step": "受け取り手を決める",
      "duration": 1.6,
      "focus": ["ボタン", "受け取り手"],
      "body": "押した時に呼ぶ受け取り手を決める。 受け取り手の中身は使う側が渡す。"
    },
    {
      "step": "押すと値が変わる",
      "duration": 1.6,
      "focus": ["ボタン", "受け取り手", "値の状態"],
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
  - 2 回押し: { kind: card, lane: pointer, stack: 0, subtitle: "2 回続けて押す" }
  - 選択とキー入力: { kind: card, lane: keyboard, stack: 0, subtitle: "選ぶ / 外れる / キーを押す" }
  - 長押し: { kind: card, lane: touch, stack: 0, subtitle: "押したまま 500 ミリ秒" }
  - 受け取った結果: { kind: card, lane: touch, stack: 1, subtitle: "{lastEvent} · 累計 {received} 回", posW: 220 }

events:
  - { on: double-click, box: "2 回押し", handler: "on-dbl" }
  - { on: focus, box: "選択とキー入力", handler: "on-focus" }
  - { on: blur, box: "選択とキー入力", handler: "on-blur" }
  - { on: keydown, box: "選択とキー入力", handler: "on-key" }
  - { on: long-press, box: "長押し", handler: "on-long" }

animation:
  - step: "2 回押す" 1.6s
    focus: ["2 回押し", "受け取った結果"]
    description: "1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。"
  - step: "選ぶ / キーを押す" 1.6s
    focus: ["2 回押し", "選択とキー入力", "受け取った結果"]
    description: "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。"
  - step: "長く押す" 1.6s
    focus: ["2 回押し", "選択とキー入力", "長押し", "受け取った結果"]
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
      "name": "2 回押し",
      "kind": "card",
      "lane": "pointer",
      "stack": 0,
      "subtitle": "2 回続けて押す"
    },
    {
      "name": "選択とキー入力",
      "kind": "card",
      "lane": "keyboard",
      "stack": 0,
      "subtitle": "選ぶ / 外れる / キーを押す"
    },
    {
      "name": "長押し",
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
    { "on": "double-click", "box": "2 回押し", "handler": "on-dbl" },
    { "on": "focus", "box": "選択とキー入力", "handler": "on-focus" },
    { "on": "blur", "box": "選択とキー入力", "handler": "on-blur" },
    { "on": "keydown", "box": "選択とキー入力", "handler": "on-key" },
    { "on": "long-press", "box": "長押し", "handler": "on-long" }
  ],
  "animation": [
    {
      "step": "2 回押す",
      "duration": 1.6,
      "focus": ["2 回押し", "受け取った結果"],
      "body": "1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。"
    },
    {
      "step": "選ぶ / キーを押す",
      "duration": 1.6,
      "focus": ["2 回押し", "選択とキー入力", "受け取った結果"],
      "body": "2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。"
    },
    {
      "step": "長く押す",
      "duration": 1.6,
      "focus": ["2 回押し", "選択とキー入力", "長押し", "受け取った結果"],
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
  - 段 1: { kind: card, lane: s1, stack: 0, subtitle: "進み具合: {intro}" }
  - 段 2: { kind: card, lane: s2, stack: 0, subtitle: "進み具合: {intro}" }
  - 段 3: { kind: card, lane: s3, stack: 0, subtitle: "進み具合: {intro}" }

scrolls:
  intro: { start: 0.9, end: 0.1, scrub: 1, label: "スクロールの進み具合" }

animation:
  - step: "1 箱で見る" 1.6s
    focus: ["段 1"]
    description: "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。"
  - step: "2 箱で見る" 1.6s
    focus: ["段 1", "段 2"]
    description: "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。"
  - step: "3 箱が同時に追う" 1.6s
    focus: ["段 1", "段 2", "段 3"]
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
      "name": "段 1",
      "kind": "card",
      "lane": "s1",
      "stack": 0,
      "subtitle": "進み具合: {intro}"
    },
    {
      "name": "段 2",
      "kind": "card",
      "lane": "s2",
      "stack": 0,
      "subtitle": "進み具合: {intro}"
    },
    {
      "name": "段 3",
      "kind": "card",
      "lane": "s3",
      "stack": 0,
      "subtitle": "進み具合: {intro}"
    }
  ],
  "flow": [],
  "states": { "intro": 0 },
  "scrolls": {
    "intro": { "start": 0.9, "end": 0.1, "scrub": 1, "label": "スクロールの進み具合" }
  },
  "animation": [
    {
      "step": "1 箱で見る",
      "duration": 1.6,
      "focus": ["段 1"],
      "body": "スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。"
    },
    {
      "step": "2 箱で見る",
      "duration": 1.6,
      "focus": ["段 1", "段 2"],
      "body": "同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。"
    },
    {
      "step": "3 箱が同時に追う",
      "duration": 1.6,
      "focus": ["段 1", "段 2", "段 3"],
      "body": "3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。"
    }
  ]
}`;

export const sourceYaml__supportChat = `title: "問い合わせ 5 通を客 / 担当で分ける"
type: flow

readouts:
  cb: { kind: chat-bubble, source: "thread", max: 6, colorSelf: "#2563eb", colorOther: "#f0e0b8", label: "やり取り (吹き出し)" }

lanes:
  customer: { x: 0, width: 280 }
  support: { x: 320, width: 320 }

states:
  thread: [["佐藤","注文のことで困っています",false],["窓口","承知しました。 注文番号を教えてください",true],["佐藤","#12345",false],["窓口","確認しています…",true],["窓口","返金しました。 3〜5 日で反映されます",true]]

actors:
  - 佐藤 #1: { kind: card, lane: customer, stack: 0, subtitle: "利用者の 1 通目" }
  - 佐藤 #2: { kind: card, lane: customer, stack: 1, subtitle: "利用者の 2 通目" }
  - 窓口 #1: { kind: card, lane: support, stack: 0, subtitle: "応対側の 1 通目" }
  - 窓口 #2: { kind: card, lane: support, stack: 1, subtitle: "確認中の返答" }
  - 窓口 #3: { kind: card, lane: support, stack: 2, subtitle: "解決の返答" }

animation:
  - step: "問い合わせ" 1.8s
    focus: ["佐藤 #1"]
    set:
      thread: '[["佐藤","注文のことで困っています",false]]'
    description: "利用者からの 1 通目。 左側に吹き出しが出る。"
  - step: "やり取りが続く" 1.8s
    focus: ["佐藤 #1", "窓口 #1", "佐藤 #2"]
    set:
      thread: '[["佐藤","注文のことで困っています",false],["窓口","承知しました。 注文番号を教えてください",true],["佐藤","#12345",false]]'
    description: "応対側が返し、利用者が答える。 左右に交互に並ぶ。"
  - step: "解決する" 1.8s
    focus: ["佐藤 #1", "窓口 #1", "佐藤 #2", "窓口 #2", "窓口 #3"]
    set:
      thread: '[["佐藤","注文のことで困っています",false],["窓口","承知しました。 注文番号を教えてください",true],["佐藤","#12345",false],["窓口","確認しています…",true],["窓口","返金しました。 3〜5 日で反映されます",true]]'
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
      "label": "やり取り (吹き出し)"
    }
  ],
  "lanes": {
    "customer": { "x": 0, "width": 280 },
    "support": { "x": 320, "width": 320 }
  },
  "actors": [
    {
      "name": "佐藤 #1",
      "kind": "card",
      "lane": "customer",
      "stack": 0,
      "subtitle": "利用者の 1 通目"
    },
    {
      "name": "佐藤 #2",
      "kind": "card",
      "lane": "customer",
      "stack": 1,
      "subtitle": "利用者の 2 通目"
    },
    {
      "name": "窓口 #1",
      "kind": "card",
      "lane": "support",
      "stack": 0,
      "subtitle": "応対側の 1 通目"
    },
    {
      "name": "窓口 #2",
      "kind": "card",
      "lane": "support",
      "stack": 1,
      "subtitle": "確認中の返答"
    },
    { "name": "窓口 #3", "kind": "card", "lane": "support", "stack": 2, "subtitle": "解決の返答" }
  ],
  "flow": [],
  "states": {
    "thread": "[[\\"佐藤\\",\\"注文のことで困っています\\",false],[\\"窓口\\",\\"承知しました。 注文番号を教えてください\\",true],[\\"佐藤\\",\\"#12345\\",false],[\\"窓口\\",\\"確認しています…\\",true],[\\"窓口\\",\\"返金しました。 3〜5 日で反映されます\\",true]]"
  },
  "animation": [
    {
      "step": "問い合わせ",
      "duration": 1.8,
      "focus": ["佐藤 #1"],
      "set": { "thread": "[[\\"佐藤\\",\\"注文のことで困っています\\",false]]" },
      "body": "利用者からの 1 通目。 左側に吹き出しが出る。"
    },
    {
      "step": "やり取りが続く",
      "duration": 1.8,
      "focus": ["佐藤 #1", "窓口 #1", "佐藤 #2"],
      "set": {
        "thread": "[[\\"佐藤\\",\\"注文のことで困っています\\",false],[\\"窓口\\",\\"承知しました。 注文番号を教えてください\\",true],[\\"佐藤\\",\\"#12345\\",false]]"
      },
      "body": "応対側が返し、利用者が答える。 左右に交互に並ぶ。"
    },
    {
      "step": "解決する",
      "duration": 1.8,
      "focus": ["佐藤 #1", "窓口 #1", "佐藤 #2", "窓口 #2", "窓口 #3"],
      "set": {
        "thread": "[[\\"佐藤\\",\\"注文のことで困っています\\",false],[\\"窓口\\",\\"承知しました。 注文番号を教えてください\\",true],[\\"佐藤\\",\\"#12345\\",false],[\\"窓口\\",\\"確認しています…\\",true],[\\"窓口\\",\\"返金しました。 3〜5 日で反映されます\\",true]]"
      },
      "body": "確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。"
    }
  ]
}`;

export const sourceYaml__decisionTree = `title: "3 段の決定木が 4 つの葉に分岐する"
type: flow

lanes:
  root: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }
  leaf: { x: 480, width: 240 }

actors:
  - 問い 1: { kind: card, lane: root, stack: 1, subtitle: "#0 (起点)" }
  - 問い 2: { kind: card, lane: mid, stack: 0, subtitle: "#1" }
  - 問い 3: { kind: card, lane: mid, stack: 2, subtitle: "#2" }
  - 結果 1: { kind: card, lane: leaf, stack: 0, subtitle: "#3" }
  - 結果 2: { kind: card, lane: leaf, stack: 1, subtitle: "#4" }
  - 結果 3: { kind: card, lane: leaf, stack: 2, subtitle: "#5" }
  - 結果 4: { kind: card, lane: leaf, stack: 3, subtitle: "#6" }

flow:
  - 問い 1 -> 問い 2: "○" (success)
  - 問い 1 -> 問い 3: "×" (error)
  - 問い 2 -> 結果 1: "○" (success)
  - 問い 2 -> 結果 2: "×" (error)
  - 問い 3 -> 結果 3: "○" (success)
  - 問い 3 -> 結果 4: "×" (error)

animation:
  - step: "入口に立つ" 1.6s
    focus: ["問い 1"]
    description: "一番上の分かれ道から始まる。 まだどちらにも進んでいない。"
  - step: "1 段目で分かれる" 1.6s
    focus: ["問い 1", "問い 2", "問い 3"]
    description: "最初の判断で左右に分かれる。 2 つの道ができる。"
  - step: "左の枝が分かれる" 1.6s
    focus: ["問い 1", "問い 2", "問い 3", "結果 1", "結果 2"]
    description: "左側だけがもう一度分かれて 2 つの葉になる。 右側はまだ 1 本のまま。"
  - step: "右の枝も分かれる" 1.6s
    focus: ["問い 1", "問い 2", "問い 3", "結果 1", "結果 2", "結果 3", "結果 4"]
    description: "右側も分かれて 4 つの終点すべてに届く。 2 段の判断で 4 通りの結果になる。"
`;

export const sourceJson__decisionTree = `{
  "title": "3 段の決定木が 4 つの葉に分岐する",
  "type": "flow",
  "lanes": {
    "root": { "x": 0, "width": 200 },
    "mid": { "x": 240, "width": 200 },
    "leaf": { "x": 480, "width": 240 }
  },
  "actors": [
    { "name": "問い 1", "kind": "card", "lane": "root", "stack": 1, "subtitle": "#0 (起点)" },
    { "name": "問い 2", "kind": "card", "lane": "mid", "stack": 0, "subtitle": "#1" },
    { "name": "問い 3", "kind": "card", "lane": "mid", "stack": 2, "subtitle": "#2" },
    { "name": "結果 1", "kind": "card", "lane": "leaf", "stack": 0, "subtitle": "#3" },
    { "name": "結果 2", "kind": "card", "lane": "leaf", "stack": 1, "subtitle": "#4" },
    { "name": "結果 3", "kind": "card", "lane": "leaf", "stack": 2, "subtitle": "#5" },
    { "name": "結果 4", "kind": "card", "lane": "leaf", "stack": 3, "subtitle": "#6" }
  ],
  "flow": [
    { "from": "問い 1", "to": "問い 2", "label": "○", "tone": "success" },
    { "from": "問い 1", "to": "問い 3", "label": "×", "tone": "error" },
    { "from": "問い 2", "to": "結果 1", "label": "○", "tone": "success" },
    { "from": "問い 2", "to": "結果 2", "label": "×", "tone": "error" },
    { "from": "問い 3", "to": "結果 3", "label": "○", "tone": "success" },
    { "from": "問い 3", "to": "結果 4", "label": "×", "tone": "error" }
  ],
  "animation": [
    {
      "step": "入口に立つ",
      "duration": 1.6,
      "focus": ["問い 1"],
      "body": "一番上の分かれ道から始まる。 まだどちらにも進んでいない。"
    },
    {
      "step": "1 段目で分かれる",
      "duration": 1.6,
      "focus": ["問い 1", "問い 2", "問い 3"],
      "body": "最初の判断で左右に分かれる。 2 つの道ができる。"
    },
    {
      "step": "左の枝が分かれる",
      "duration": 1.6,
      "focus": ["問い 1", "問い 2", "問い 3", "結果 1", "結果 2"],
      "body": "左側だけがもう一度分かれて 2 つの葉になる。 右側はまだ 1 本のまま。"
    },
    {
      "step": "右の枝も分かれる",
      "duration": 1.6,
      "focus": ["問い 1", "問い 2", "問い 3", "結果 1", "結果 2", "結果 3", "結果 4"],
      "body": "右側も分かれて 4 つの終点すべてに届く。 2 段の判断で 4 通りの結果になる。"
    }
  ]
}`;

export const sourceYaml__radialHubAndSpoke = `title: "中心から放射状に 4 本が伸びる"
type: flow

lanes:
  spokesTop: { x: -300, width: 200 }
  hub-lane: { x: 0, width: 200 }
  spokesBottom: { x: 300, width: 200 }

actors:
  - 中心: { kind: card, lane: hub-lane, stack: 0, subtitle: "ここから 4 本に分かれる" }
  - #0: { kind: card, lane: spokesTop, stack: 0, subtitle: "0°" }
  - #1: { kind: card, lane: spokesTop, stack: 1, subtitle: "90°" }
  - #2: { kind: card, lane: spokesBottom, stack: 0, subtitle: "180°" }
  - #3: { kind: card, lane: spokesBottom, stack: 1, subtitle: "270°" }

flow:
  - 中心 -> #0: "0°" (info)
  - 中心 -> #1: "90°" (info)
  - 中心 -> #2: "180°" (info)
  - 中心 -> #3: "270°" (info)

animation:
  - step: "中心を置く" 1.6s
    focus: ["中心"]
    description: "真ん中の箱が起点。 ここから外へ伸びる。"
  - step: "2 本伸ばす" 1.6s
    focus: ["中心", "#0", "#1"]
    description: "中心から 2 本が外へ伸びる。 向きが 2 方向に分かれる。"
  - step: "4 本に広げる" 1.6s
    focus: ["中心", "#0", "#1", "#2", "#3"]
    description: "4 本すべてが放射状に広がる。 中心 1 つに対して外が 4 つ。"
`;

export const sourceJson__radialHubAndSpoke = `{
  "title": "中心から放射状に 4 本が伸びる",
  "type": "flow",
  "lanes": {
    "spokesTop": { "x": -300, "width": 200 },
    "hub-lane": { "x": 0, "width": 200 },
    "spokesBottom": { "x": 300, "width": 200 }
  },
  "actors": [
    {
      "name": "中心",
      "kind": "card",
      "lane": "hub-lane",
      "stack": 0,
      "subtitle": "ここから 4 本に分かれる"
    },
    { "name": "#0", "kind": "card", "lane": "spokesTop", "stack": 0, "subtitle": "0°" },
    { "name": "#1", "kind": "card", "lane": "spokesTop", "stack": 1, "subtitle": "90°" },
    { "name": "#2", "kind": "card", "lane": "spokesBottom", "stack": 0, "subtitle": "180°" },
    { "name": "#3", "kind": "card", "lane": "spokesBottom", "stack": 1, "subtitle": "270°" }
  ],
  "flow": [
    { "from": "中心", "to": "#0", "label": "0°", "tone": "info" },
    { "from": "中心", "to": "#1", "label": "90°", "tone": "info" },
    { "from": "中心", "to": "#2", "label": "180°", "tone": "info" },
    { "from": "中心", "to": "#3", "label": "270°", "tone": "info" }
  ],
  "animation": [
    { "step": "中心を置く", "duration": 1.6, "focus": ["中心"], "body": "真ん中の箱が起点。 ここから外へ伸びる。" },
    {
      "step": "2 本伸ばす",
      "duration": 1.6,
      "focus": ["中心", "#0", "#1"],
      "body": "中心から 2 本が外へ伸びる。 向きが 2 方向に分かれる。"
    },
    {
      "step": "4 本に広げる",
      "duration": 1.6,
      "focus": ["中心", "#0", "#1", "#2", "#3"],
      "body": "4 本すべてが放射状に広がる。 中心 1 つに対して外が 4 つ。"
    }
  ]
}`;
