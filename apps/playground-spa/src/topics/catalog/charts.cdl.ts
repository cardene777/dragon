import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Charts ... 図表系 10 種の見本 (#1152)。
 *
 * 図表系の 10 種を **1 つずつ単体で** 見せる。
 *
 * 9 種は `presets` にも出るが、 そちらは完成した図の型 (スイムレーン / ER 図 等) の中に埋まって
 * いて、 「この種別だけを見たい」 時に届かない。 `chart-bar` は本当にどこにも無かった。
 *
 * 他の catalog と同じく lane の幅を揃える (SVG の viewBox が同じ大きさになり、 一覧の格子が
 * 崩れない)。 値を持たせて描く = 空の枠だけの見本にしない。
 *
 * ## 値は動かない
 *
 * この 10 種は `chartData` / `ganttData` のような **配列をそのまま受け取って描く**。 動く部品
 * (`dyn-*`) が `{signal}` を読んで値を追うのとは別の仕組みで、 `tween` の対象にできない。
 *
 * なので段は「どこを見るか」 を切り替える形で組む (`activate` で 1 つを強調する)。 値そのものが
 * 動く見本が要るなら `dyn-*` の側 (parts / animation) を見る。
 */

const W = 440;

/** 1. chart-bar = 値の大小を棒の高さで比べる */
export const chartBar = diagram("chart-bar", { topic: "chart-bar (棒で比べる)" })
  .lane("l", { x: 0, width: W })
  .node("c", {
    lane: "l",
    stack: 0,
    kind: "chart-bar",
    title: "経路別の流入",
    w: 400,
    h: 260,
    chartData: [
      { label: "検索", value: 420, tone: "info" },
      { label: "SNS", value: 310, tone: "accent" },
      { label: "直接", value: 180 },
      { label: "紹介", value: 90, tone: "warning" },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "棒で比べる", body: "値の大小を棒の高さで見る。 順序に意味が無い項目に向く。" },
    (p: PhaseBuilder) => p.activate("c"),
  )
  .build();

/** 2. chart-line = 値の移り変わりを線で追う */
export const chartLine = diagram("chart-line", { topic: "chart-line (線で追う)" })
  .lane("l", { x: 0, width: W })
  .node("c", {
    lane: "l",
    stack: 0,
    kind: "chart-line",
    title: "週ごとの応答時間",
    subtitle: "ミリ秒",
    w: 400,
    h: 260,
    chartData: [
      { label: "W1", value: 180 },
      { label: "W2", value: 240 },
      { label: "W3", value: 210 },
      { label: "W4", value: 120 },
      { label: "W5", value: 95 },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "線で追う", body: "並び順に意味がある値を線で結ぶ。 増減の向きが読める。" },
    (p: PhaseBuilder) => p.activate("c"),
  )
  .build();

/** 3. chart-pie = 全体に占める割合を扇で見る */
export const chartPie = diagram("chart-pie", { topic: "chart-pie (割合を見る)" })
  .lane("l", { x: 0, width: W })
  .node("c", {
    lane: "l",
    stack: 0,
    kind: "chart-pie",
    title: "費用の内訳",
    w: 400,
    h: 300,
    chartData: [
      { label: "計算", value: 45, tone: "info" },
      { label: "保存", value: 25, tone: "accent" },
      { label: "通信", value: 20, tone: "warning" },
      { label: "その他", value: 10 },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "割合を見る", body: "合計に対する取り分を扇の角度で見る。 項目が多いと読みにくい。" },
    (p: PhaseBuilder) => p.activate("c"),
  )
  .build();

/** 4. funnel-stages = 段を下るごとに減る数を見る */
export const funnelStages = diagram("funnel-stages", { topic: "funnel-stages (絞り込みで減る)" })
  .lane("l", { x: 0, width: W })
  .node("f", {
    lane: "l",
    stack: 0,
    kind: "funnel-stages",
    title: "申込みまでの絞り込み",
    w: 400,
    h: 320,
    funnelData: [
      { id: "s1", title: "訪問", count: 12000, subtitle: "全体" },
      { id: "s2", title: "会員登録", count: 3400, subtitle: "28%" },
      { id: "s3", title: "カート投入", count: 1200, subtitle: "10%" },
      { id: "s4", title: "申込み", count: 480, subtitle: "4%" },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "絞り込みで減る", body: "段を下るごとに数が減る様子を見る。 どこで落ちるかが分かる。" },
    (p: PhaseBuilder) => p.activate("f"),
  )
  .build();

/** 5. gantt-timeline = 期間の重なりと前後を見る */
export const ganttTimeline = diagram("gantt-timeline", { topic: "gantt-timeline (期間で並べる)" })
  .lane("l", { x: 0, width: W })
  .node("g", {
    lane: "l",
    stack: 0,
    kind: "gantt-timeline",
    title: "公開までの段取り",
    w: 400,
    h: 340,
    ganttData: [
      { id: "t1", title: "設計", startIdx: 0, endIdx: 1, startLabel: "1月", endLabel: "2月", owner: "設計", tone: "info" },
      { id: "t2", title: "実装", startIdx: 1, endIdx: 2, startLabel: "2月", endLabel: "3月", owner: "開発", dependsOn: "t1", tone: "accent" },
      { id: "t2b", title: "見直し", startIdx: 2, endIdx: 3, startLabel: "3月", endLabel: "4月", owner: "開発", dependsOn: "t2" },
      { id: "t3", title: "検証", startIdx: 3, endIdx: 4, startLabel: "4月", endLabel: "5月", owner: "品質", dependsOn: "t2b" },
      { id: "t4", title: "公開", startIdx: 4, endIdx: 4, startLabel: "5月", endLabel: "5月", owner: "運用", dependsOn: "t3", tone: "success" },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "期間で並べる", body: "いつからいつまでかを横帯で見る。 前後関係は線で結ぶ。" },
    (p: PhaseBuilder) => p.activate("g"),
  )
  .build();

/** 6. journey-map = 体験の道筋を気持ちの起伏つきで見る */
export const journeyMap = diagram("journey-map", { topic: "journey-map (体験の起伏)" })
  .lane("l", { x: 0, width: W })
  .node("j", {
    lane: "l",
    stack: 0,
    kind: "journey-map",
    title: "初めて使うまで",
    w: 400,
    h: 320,
    journeyData: [
      { id: "j1", title: "知る", emotion: "neutral", touchpoint: "記事" },
      { id: "j2", title: "登録", emotion: "frustrated", touchpoint: "入力欄", opportunity: "項目を減らす" },
      { id: "j3", title: "設定", emotion: "happy", touchpoint: "案内" },
      { id: "j4", title: "初回の成功", emotion: "delighted", touchpoint: "完了画面" },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "体験の起伏", body: "道筋の各点で気持ちがどう動くかを見る。 谷が直す場所になる。" },
    (p: PhaseBuilder) => p.activate("j"),
  )
  .build();

/** 7. mind-map = 中心から枝分かれさせて広げる */
export const mindMap = diagram("mind-map", { topic: "mind-map (枝分かれで広げる)" })
  .lane("l", { x: 0, width: W })
  .node("m", {
    lane: "l",
    stack: 0,
    kind: "mind-map",
    title: "図を速くする",
    w: 400,
    h: 320,
    mindData: {
      rootId: "r",
      rootTitle: "図を速くする",
      branches: [
        { id: "b1", title: "描く量を減らす", parent: "r", tone: "info" },
        { id: "b2", title: "計算を減らす", parent: "r", tone: "accent" },
        { id: "b11", title: "見えない所を省く", parent: "b1" },
        { id: "b12", title: "細部を間引く", parent: "b1" },
        { id: "b21", title: "結果を覚える", parent: "b2" },
        { id: "b22", title: "上限で打ち切る", parent: "b2" },
      ],
    },
  })
  .phase(
    "p",
    { duration: 1500, title: "枝分かれで広げる", body: "中心の題から枝を伸ばす。 思いつきを整理する時に使う。" },
    (p: PhaseBuilder) => p.activate("m"),
  )
  .build();

/** 8. mind-radial = 同じ枝分かれを放射状に置く */
export const mindRadial = diagram("mind-radial", { topic: "mind-radial (放射状に置く)" })
  .lane("l", { x: 0, width: W })
  .node("m", {
    lane: "l",
    stack: 0,
    kind: "mind-radial",
    title: "扱う入力",
    w: 400,
    h: 360,
    mindData: {
      rootId: "r",
      rootTitle: "扱う入力",
      branches: [
        { id: "b1", title: "記法", parent: "r", tone: "info" },
        { id: "b2", title: "JSON", parent: "r", tone: "accent" },
        { id: "b3", title: "組立て", parent: "r", tone: "success" },
        { id: "b4", title: "取込み", parent: "r", tone: "warning" },
      ],
    },
  })
  .phase(
    "p",
    { duration: 1500, title: "放射状に置く", body: "枝を四方へ均等に配る。 枝の数が同格な時に向く。" },
    (p: PhaseBuilder) => p.activate("m"),
  )
  .build();

/** 9. quadrant-matrix = 2 つの軸で 4 つに分ける */
export const quadrantMatrix = diagram("quadrant-matrix", { topic: "quadrant-matrix (2 軸で分ける)" })
  .lane("l", { x: 0, width: W })
  .node("q", {
    lane: "l",
    stack: 0,
    kind: "quadrant-matrix",
    title: "着手の順番",
    w: 400,
    h: 360,
    quadrantData: {
      xAxis: { left: "手間が小さい", right: "手間が大きい" },
      yAxis: { bottom: "効きが小さい", top: "効きが大きい" },
      quadrantLabels: {
        topLeft: "すぐやる",
        topRight: "計画して",
        bottomLeft: "余力で",
        bottomRight: "やらない",
      },
      items: [
        { id: "i1", title: "重複削除", quadrant: "topLeft", subtitle: "1 日" },
        { id: "i2", title: "描画刷新", quadrant: "topRight", subtitle: "1 ヶ月" },
        { id: "i3", title: "配色統一", quadrant: "bottomLeft" },
        { id: "i4", title: "旧記法", quadrant: "bottomRight" },
      ],
    },
  })
  .phase(
    "p",
    { duration: 1500, title: "2 軸で分ける", body: "2 つのものさしで 4 つに仕分ける。 優先順位を決める時に使う。" },
    (p: PhaseBuilder) => p.activate("q"),
  )
  .build();

/** 10. tree-hierarchy = 親子の入れ子を段で見る */
export const treeHierarchy = diagram("tree-hierarchy", { topic: "tree-hierarchy (親子で束ねる)" })
  .lane("l", { x: 0, width: W })
  .node("t", {
    lane: "l",
    stack: 0,
    kind: "tree-hierarchy",
    title: "配布物の構成",
    w: 400,
    h: 340,
    treeData: [
      { id: "root", title: "dragon", eyebrow: "配布物" },
      { id: "c1", title: "記法", parent: "root", subtitle: "文字から図へ" },
      { id: "c2", title: "描画", parent: "root", subtitle: "図から SVG へ" },
      { id: "c11", title: "読み取り", parent: "c1" },
      { id: "c12", title: "組立て", parent: "c1" },
      { id: "c21", title: "配置", parent: "c2" },
      { id: "c22", title: "名札", parent: "c2" },
    ],
  })
  .phase(
    "p",
    { duration: 1500, title: "親子で束ねる", body: "含む / 含まれる の関係を段で見る。 枝の深さが階層になる。" },
    (p: PhaseBuilder) => p.activate("t"),
  )
  .build();
