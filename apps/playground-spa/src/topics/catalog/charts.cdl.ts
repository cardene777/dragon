import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Charts ... 図表の見本 (#1152 / #1159)。
 *
 * **種別の数はここに書かない**。 実物 (`nodes[0].kind`) が SSOT で、写すと種別を足すたびに
 * 片方だけ古くなる (実測で `9 種` と名乗ったまま 15 種になっていた)。
 * 下の節番号は読む順を示すためのもので、種別の数を数えるためのものではない
 * (`b` / `c` を付けた枝番は変種を指す)。
 *
 * **記法で書く**。 図は記法から組み立てる。
 *
 * 最初は組立て API (`diagram(...).node(...)`) で書いていたが、 それだと 3 つが同時に起きる。
 *
 * | 症状 | 原因 |
 * |---|---|
 * | 「エディタで開く」 が効かない | エディタは記法を編集する画面。 組立て API の図は渡せない |
 * | コードを見る経路が無い | 元が記法でないので、 出せる記法が無い |
 * | 記法の穴に気付けない | 記法で書けるかを誰も確かめていない |
 *
 * 記法を元にすると 3 つとも消える。 見本が **利用者と同じ書き方** になり、 写せばそのまま動く。
 *
 * `sourceYaml__<key>` は一覧が拾う約束の名前 (`moduleToItems`)。 これがあると画面にコードの
 * タブが出て、 「エディタで開く」 が中身を渡せるようになる。
 *
 * ## 記法にまだ書けない項目
 *
 * 記法に書ける項目が組立て API より少なく、 その分が見本から落ちる。 組立て API に戻すと
 * 「エディタで開けない」 に逆戻りするので、 落ちたまま残して記法側を直す
 * (`cardene777/dragon#1160`)。
 *
 * | 見本 | 落ちたもの | 実測 |
 * |---|---|---|
 * | `quadrant` | **軸の名前と区画の名前**。 何を判断する図か読めない | `xAxis` が「小さい / 大きい」、 区画が「左上 / 右下」 のまま |
 * | `gantt` | 期間。 開始しか書けず各工程が 1 コマ幅になる | 全工程が `startIdx === endIdx` |
 * | `bar` / `pie` / `line` | 色 (`tone`) | 記法で書いた見本が 1 件も無い |
 *
 * **この表に書くのは「記法で書けない」 ものだけ** (#1706)。 「記法では書けるが engine が
 * 描かない」 欄 (漏斗の段の説明 等) は別物で、 見本を足しても見えるものが無い。 そちらは
 * `src/lib/catalog-payload-coverage.test.tsx` の `描かない欄` が理由付きで持ち、 engine が
 * 描き始めたら落ちる。
 *
 * **節と矢印の欄は同じ file の別の表が持つ** (#1707)。 engine の型に在って記法に口が無い欄は
 * `書けない欄`、 記法から書けるのに絵に届かない欄は `届かない欄`。 どちらも実物を読んで
 * 理由の生死を確かめるので、 この表と違って手で直す必要が無い。
 *
 * **手で並べた表は実物とずれる**。 `mind` の枝 (`#1177` / `#1251`)、 `tree` の孫、
 * `journey` の接点と改善の余地 (`touchpoint` / `opportunity`) はいずれも書けるようになって
 * いたのに、 表には落ちたままだと書いてあった。 いまはどれも記法で書いた見本がある。
 */

// ============================================================
// 1. 棒で比べる
// ============================================================
export const sourceYaml__branchParcelsBar = `title: "営業所ごとの取扱数"
figureSize: {"width":896,"height":1008}
type: chart
shape: bar
figureCard: {"label":"棒","note":"今月 / 単位 件"}

actors:
  - 東京: "{tokyo}"
  - 大阪: "{osaka}"
  - 名古屋: "{nagoya}"
  - 福岡: "{fukuoka}"
  - 札幌: "{sapporo}"

states:
  tokyo: 620
  osaka: 390
  nagoya: 280
  fukuoka: 210
  sapporo: 130

animation:
  - step: "先月" 1.2s
    draw: bar
    description: "先月も東京営業所の取扱数が最も多い。"
  - step: "今月" 1.2s
    tween:
      tokyo: 620 -> 680
      osaka: 390 -> 420
      nagoya: 280 -> 310
      fukuoka: 210 -> 240
      sapporo: 130 -> 150
    description: "今月は東京が 680 件で、5 営業所の中で最も多い。"
`;

export const sourceJson__branchParcelsBar = `{
  "title": "営業所ごとの取扱数",
  "figureSize": { "width": 896, "height": 1008 },
  "type": "chart",
  "shape": "bar",
  "figureCard": { "label": "棒", "note": "今月 / 単位 件" },
  "actors": [
    { "name": "東京", "subtitle": "{tokyo}" },
    { "name": "大阪", "subtitle": "{osaka}" },
    { "name": "名古屋", "subtitle": "{nagoya}" },
    { "name": "福岡", "subtitle": "{fukuoka}" },
    { "name": "札幌", "subtitle": "{sapporo}" }
  ],
  "flow": [],
  "states": { "tokyo": 620, "osaka": 390, "nagoya": 280, "fukuoka": 210, "sapporo": 130 },
  "animation": [
    { "step": "先月", "duration": 1.2, "draw": "bar", "description": "先月も東京営業所の取扱数が最も多い。" },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "今月は東京が 680 件で、5 営業所の中で最も多い。",
      "tween": {
        "tokyo": [620, 680],
        "osaka": [390, 420],
        "nagoya": [280, 310],
        "fukuoka": [210, 240],
        "sapporo": [130, 150]
      }
    }
  ]
}`;

export const branchParcelsBar = textDslToDiagram(sourceYaml__branchParcelsBar);

// ------------------------------------------------------------
// 1b. 前の時点を破線で横切らせる (`パターン` の切替で選ぶ、 #1722)
//
// `previous` を書くと、棒 1 本ごとに前の時点の高さで破線が 1 本入る (`cdl#767`)。
// 書かない図では 1 本も入らないので、**同じ見本の切替で両側を見せる**。
//
// **縦軸は前の時点まで含めて決まる**。 東京は前 700 で今 680 と、前のほうが高い =
// 前だけが枠の外へ出ると「下がった」 が読めないので、天井を前と今の大きいほうで取る。
//
// 破線は棒より少し左右にはみ出す。 棒の縁と重なると、どちらが前の高さか読めなくなる。
// ------------------------------------------------------------
export const patternBase__branchParcelsBar = "今だけ";

export const sourceYaml__pattern__branchParcelsBar__前の値つき = `title: "先月と比べた営業所ごとの取扱数"
figureSize: {"width":896,"height":1008}
type: chart
shape: bar

actors:
  - 東京: { value: "{tokyo}", previous: "700" }
  - 大阪: { value: "{osaka}", previous: "390" }
  - 名古屋: { value: "{nagoya}", previous: "280" }
  - 福岡: { value: "{fukuoka}", previous: "210" }
  - 札幌: { value: "{sapporo}", previous: "130" }

states:
  tokyo: 680
  osaka: 420
  nagoya: 310
  fukuoka: 240
  sapporo: 150

animation:
  - step: "今月の集計" 1.2s
    draw: bar
    description: "破線が先月の取扱数で、棒が今月の取扱数。"
  - step: "来月の見込み" 1.2s
    tween:
      tokyo: 680 -> 720
      fukuoka: 240 -> 270
    description: "東京と福岡の来月の見込みが伸びる。 先月の破線は動かない。"
`;

export const sourceJson__pattern__branchParcelsBar__前の値つき = `{
  "title": "先月と比べた営業所ごとの取扱数",
  "figureSize": { "width": 896, "height": 1008 },
  "type": "chart",
  "shape": "bar",
  "actors": [
    { "name": "東京", "value": "{tokyo}", "previous": "700" },
    { "name": "大阪", "value": "{osaka}", "previous": "390" },
    { "name": "名古屋", "value": "{nagoya}", "previous": "280" },
    { "name": "福岡", "value": "{fukuoka}", "previous": "210" },
    { "name": "札幌", "value": "{sapporo}", "previous": "130" }
  ],
  "flow": [],
  "states": { "tokyo": 680, "osaka": 420, "nagoya": 310, "fukuoka": 240, "sapporo": 150 },
  "animation": [
    {
      "step": "今月の集計",
      "duration": 1.2,
      "draw": "bar",
      "description": "破線が先月の取扱数で、棒が今月の取扱数。"
    },
    {
      "step": "来月の見込み",
      "duration": 1.2,
      "description": "東京と福岡の来月の見込みが伸びる。 先月の破線は動かない。",
      "tween": { "tokyo": [680, 720], "fukuoka": [240, 270] }
    }
  ]
}`;

export const pattern__branchParcelsBar__前の値つき = textDslToDiagram(
  sourceYaml__pattern__branchParcelsBar__前の値つき,
);

// ------------------------------------------------------------
// 1c. 棒を段のどこまでで伸ばし終えるか (`draw: bar 0.4`、#1969)
//
// 書かない図は段の終わりに伸ばし終わる。 割合を書くと、その時点で伸ばし終えて残りは伸びた棒を見せる。
// 違いは段の途中にだけ出るので、同じ図で割合だけを変えた切替にする。
// ------------------------------------------------------------
export const sourceYaml__pattern__branchParcelsBar__4割で伸ばし終える = `title: "段の 4 割で伸ばし終える営業所ごとの取扱数"
figureSize: {"width":896,"height":1008}
type: chart
shape: bar

actors:
  - 東京: "{tokyo}"
  - 大阪: "{osaka}"
  - 名古屋: "{nagoya}"
  - 福岡: "{fukuoka}"
  - 札幌: "{sapporo}"

states:
  tokyo: 620
  osaka: 390
  nagoya: 280
  fukuoka: 210
  sapporo: 130

animation:
  - step: "先月" 1.2s
    draw: bar 0.4
    description: "棒は段の 4 割で伸びきり、先月の営業所ごとの取扱数を見せる。"
  - step: "今月" 1.2s
    tween:
      tokyo: 620 -> 680
      osaka: 390 -> 420
      nagoya: 280 -> 310
      fukuoka: 210 -> 240
      sapporo: 130 -> 150
    description: "今月は東京が 680 件まで伸びる。"
`;

export const sourceJson__pattern__branchParcelsBar__4割で伸ばし終える = `{
  "title": "段の 4 割で伸ばし終える営業所ごとの取扱数",
  "figureSize": { "width": 896, "height": 1008 },
  "type": "chart",
  "shape": "bar",
  "actors": [
    { "name": "東京", "subtitle": "{tokyo}" },
    { "name": "大阪", "subtitle": "{osaka}" },
    { "name": "名古屋", "subtitle": "{nagoya}" },
    { "name": "福岡", "subtitle": "{fukuoka}" },
    { "name": "札幌", "subtitle": "{sapporo}" }
  ],
  "flow": [],
  "states": { "tokyo": 620, "osaka": 390, "nagoya": 280, "fukuoka": 210, "sapporo": 130 },
  "animation": [
    {
      "step": "先月",
      "duration": 1.2,
      "draw": "bar",
      "drawRatio": 0.4,
      "description": "棒は段の 4 割で伸びきり、先月の営業所ごとの取扱数を見せる。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "今月は東京が 680 件まで伸びる。",
      "tween": {
        "tokyo": [620, 680],
        "osaka": [390, 420],
        "nagoya": [280, 310],
        "fukuoka": [210, 240],
        "sapporo": [130, 150]
      }
    }
  ]
}`;

export const pattern__branchParcelsBar__4割で伸ばし終える = textDslToDiagram(
  sourceYaml__pattern__branchParcelsBar__4割で伸ばし終える,
);

// ============================================================
// 2. 線で追う
// ============================================================
export const sourceYaml__monthlyDeliveriesLine = `title: "月ごとの配達数"
figureSize: {"width":768,"height":464}
type: chart
shape: line
figureCard: {"label":"折れ線","note":"計画 と 実績"}
chartSeriesSkipMuted: true
chartLineSeries: [{"label":"計画","points":[{"label":"6月","value":1000},{"label":"7月","value":1150},{"label":"8月","value":1300},{"label":"9月","value":1450},{"label":"10月","value":1600}],"tone":"muted","dash":"dotted","marker":"none","valueIndexes":[4]},{"points":[{"label":"6月","value":900},{"label":"7月","value":1180},{"label":"8月","value":1250},{"label":"9月","value":1520},{"label":"10月","value":1750}],"dash":"solid","marker":"hollow","valueIndexes":[0,4]}]

actors:
  - 6月: "{jun}"
  - 7月: "{jul}"
  - 8月: "{aug}"
  - 9月: "{sep}"
  - 10月: "{oct}"

states:
  jun: 1000
  jul: 1150
  aug: 1300
  sep: 1450
  oct: 1600

animation:
  - step: "計画" 1.2s
    draw: line
    description: "計画の点線と実績の実線を同時に置き、月ごとの差を比べる。"
  - step: "実績" 1.2s
    description: "実績の 6 月 900 件と 10 月 1750 件を、計画と並べたまま読む。"
`;

export const sourceJson__monthlyDeliveriesLine = `{
  "title": "月ごとの配達数",
  "figureSize": { "width": 768, "height": 464 },
  "type": "chart",
  "shape": "line",
  "figureCard": { "label": "折れ線", "note": "計画 と 実績" },
  "chartSeriesSkipMuted": true,
  "chartLineSeries": [
    { "label": "計画", "points": [{ "label": "6月", "value": 1000 }, { "label": "7月", "value": 1150 }, { "label": "8月", "value": 1300 }, { "label": "9月", "value": 1450 }, { "label": "10月", "value": 1600 }], "tone": "muted", "dash": "dotted", "marker": "none", "valueIndexes": [4] },
    { "points": [{ "label": "6月", "value": 900 }, { "label": "7月", "value": 1180 }, { "label": "8月", "value": 1250 }, { "label": "9月", "value": 1520 }, { "label": "10月", "value": 1750 }], "dash": "solid", "marker": "hollow", "valueIndexes": [0, 4] }
  ],
  "actors": [
    { "name": "6月", "subtitle": "{jun}" },
    { "name": "7月", "subtitle": "{jul}" },
    { "name": "8月", "subtitle": "{aug}" },
    { "name": "9月", "subtitle": "{sep}" },
    { "name": "10月", "subtitle": "{oct}" }
  ],
  "flow": [],
  "states": { "jun": 1000, "jul": 1150, "aug": 1300, "sep": 1450, "oct": 1600 },
  "animation": [
    { "step": "計画", "duration": 1.2, "draw": "line", "description": "計画の点線と実績の実線を同時に置き、月ごとの差を比べる。" },
    {
      "step": "実績",
      "duration": 1.2,
      "description": "実績の 6 月 900 件と 10 月 1750 件を、計画と並べたまま読む。"
    }
  ]
}`;

export const monthlyDeliveriesLine = textDslToDiagram(sourceYaml__monthlyDeliveriesLine);

// ------------------------------------------------------------
// 2b. 1 本の線 (`パターン` の切替で選ぶ)
//
// 複数系列では意味を持たない塗りとなぞりを試せる、3 段目 b より前の単系列の見本。
// 値と「計画 → 実績」の tween は主の図と同じに保つ。
// ------------------------------------------------------------
export const patternBase__monthlyDeliveriesLine = "計画と実績";

export const sourceYaml__pattern__monthlyDeliveriesLine__1本の線 = `title: "1 本の線で見る月ごとの配達数"
figureSize: {"width":768,"height":464}
type: chart
shape: line

actors:
  - 6月: "{jun}"
  - 7月: "{jul}"
  - 8月: "{aug}"
  - 9月: "{sep}"
  - 10月: "{oct}"

states:
  jun: 1000
  jul: 1150
  aug: 1300
  sep: 1450
  oct: 1600

animation:
  - step: "計画" 1.2s
    draw: line
    description: "6 月から 10 月までの配達計画を線で結ぶ。"
  - step: "実績" 1.2s
    tween:
      jun: 1000 -> 900
      jul: 1150 -> 1180
      aug: 1300 -> 1250
      sep: 1450 -> 1520
      oct: 1600 -> 1750
    description: "実績は 6 月の 900 件から 10 月の 1750 件まで伸びる。"
`;

export const sourceJson__pattern__monthlyDeliveriesLine__1本の線 = `{
  "title": "1 本の線で見る月ごとの配達数",
  "figureSize": { "width": 768, "height": 464 },
  "type": "chart",
  "shape": "line",
  "actors": [
    { "name": "6月", "subtitle": "{jun}" },
    { "name": "7月", "subtitle": "{jul}" },
    { "name": "8月", "subtitle": "{aug}" },
    { "name": "9月", "subtitle": "{sep}" },
    { "name": "10月", "subtitle": "{oct}" }
  ],
  "flow": [],
  "states": { "jun": 1000, "jul": 1150, "aug": 1300, "sep": 1450, "oct": 1600 },
  "animation": [
    { "step": "計画", "duration": 1.2, "draw": "line", "description": "6 月から 10 月までの配達計画を線で結ぶ。" },
    {
      "step": "実績",
      "duration": 1.2,
      "description": "実績は 6 月の 900 件から 10 月の 1750 件まで伸びる。",
      "tween": {
        "jun": [1000, 900],
        "jul": [1150, 1180],
        "aug": [1300, 1250],
        "sep": [1450, 1520],
        "oct": [1600, 1750]
      }
    }
  ]
}`;

export const pattern__monthlyDeliveriesLine__1本の線 = textDslToDiagram(
  sourceYaml__pattern__monthlyDeliveriesLine__1本の線,
);

// ============================================================
// 3. 割合を見る
// ============================================================
export const sourceYaml__parcelStatusPie = `title: "荷物の状態"
figureSize: {"width":768,"height":496}
type: chart
shape: pie
figureCard: {"label":"内訳","note":"合計 1,284 件"}
form: table
chartPieCenterLabel: "件"
chartPieTableColumns: value
chartPieRingWidth: thin

actors:
  - 配達中: "{delivering}"
  - 集荷済: "{collected}"
  - 受付済: "{accepted}"
  - 完了: { value: "{completed}", tone: muted }

states:
  delivering: 210
  collected: 132
  accepted: 70
  completed: 720

animation:
  - step: "月の半ば" 1.2s
    draw: pie
    description: "月の半ばまでに集計した荷物の状態を輪で分ける。"
  - step: "今月" 1.2s
    tween:
      delivering: 210 -> 270
      collected: 132 -> 141
      accepted: 70 -> 77
      completed: 720 -> 796
    description: "今月の荷物は合計 1284 件で、完了が 796 件。"
`;

export const sourceJson__parcelStatusPie = `{
  "title": "荷物の状態",
  "figureSize": { "width": 768, "height": 496 },
  "type": "chart",
  "shape": "pie",
  "figureCard": { "label": "内訳", "note": "合計 1,284 件" },
  "見せ方": "銘板",
  "chartPieCenterLabel": "件",
  "chartPieTableColumns": "value",
  "chartPieRingWidth": "thin",
  "actors": [
    { "name": "配達中", "subtitle": "{delivering}" },
    { "name": "集荷済", "subtitle": "{collected}" },
    { "name": "受付済", "subtitle": "{accepted}" },
    { "name": "完了", "value": "{completed}", "tone": "muted" }
  ],
  "flow": [],
  "states": { "delivering": 210, "collected": 132, "accepted": 70, "completed": 720 },
  "animation": [
    { "step": "月の半ば", "duration": 1.2, "draw": "pie", "description": "月の半ばまでに集計した荷物の状態を輪で分ける。" },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "今月の荷物は合計 1284 件で、完了が 796 件。",
      "tween": {
        "delivering": [210, 270],
        "collected": [132, 141],
        "accepted": [70, 77],
        "completed": [720, 796]
      }
    }
  ]
}`;

export const parcelStatusPie = textDslToDiagram(sourceYaml__parcelStatusPie);

// ------------------------------------------------------------
// 3b. 前の時点を内側の輪に重ねる (`パターン` の切替で選ぶ、 #1698)
//
// **`previous` を書くと輪が 2 つになる** (`cdl#679`)。 内が前、外が今で、
// 同じ色が内外で対応する。 書かない図は輪 1 つのまま。
//
// **効くのは `輪` の見せ方だけ**。 `積層の弧` と `銘板` は内側の輪を描かないので、
// この変種を選んだまま見せ方を変えると前の時点は消える。
// ------------------------------------------------------------
export const patternBase__parcelStatusPie = "今だけ";

export const sourceYaml__pattern__parcelStatusPie__前と今 = `title: "昨日と比べた荷物の状態"
figureSize: {"width":768,"height":496}
type: chart
shape: pie

actors:
  - 配達中: { value: "{delivering}", previous: "240" }
  - 集荷済: { value: "{collected}", previous: "130" }
  - 受付済: { value: "{accepted}", previous: "82" }
  - 完了: { value: "{completed}", previous: "748", tone: muted }

states:
  delivering: 270
  collected: 141
  accepted: 77
  completed: 796

animation:
  - step: "昨日と今日" 1.2s
    draw: pie
    description: "内側が昨日、外側が今日の荷物の状態。"
  - step: "今日の夕方の見込み" 1.2s
    tween:
      delivering: 270 -> 300
      completed: 796 -> 840
    description: "配達中と完了が増える。 内側の昨日の輪は動かない。"
`;

export const sourceJson__pattern__parcelStatusPie__前と今 = `{
  "title": "昨日と比べた荷物の状態",
  "figureSize": { "width": 768, "height": 496 },
  "type": "chart",
  "shape": "pie",
  "actors": [
    { "name": "配達中", "value": "{delivering}", "previous": "240" },
    { "name": "集荷済", "value": "{collected}", "previous": "130" },
    { "name": "受付済", "value": "{accepted}", "previous": "82" },
    { "name": "完了", "value": "{completed}", "previous": "748", "tone": "muted" }
  ],
  "flow": [],
  "states": { "delivering": 270, "collected": 141, "accepted": 77, "completed": 796 },
  "animation": [
    {
      "step": "昨日と今日",
      "duration": 1.2,
      "draw": "pie",
      "description": "内側が昨日、外側が今日の荷物の状態。"
    },
    {
      "step": "今日の夕方の見込み",
      "duration": 1.2,
      "description": "配達中と完了が増える。 内側の昨日の輪は動かない。",
      "tween": { "delivering": [270, 300], "completed": [796, 840] }
    }
  ]
}`;

export const pattern__parcelStatusPie__前と今 = textDslToDiagram(sourceYaml__pattern__parcelStatusPie__前と今);

// ============================================================
// 4. 絞り込みで減る
// ============================================================
export const sourceYaml__orderToDeliveryFunnel = `title: "申し込みから届くまで"
figureSize: {"width":544,"height":496}
type: funnel
figureCard: {"label":"漏斗","note":"先月 / 件"}
funnelForm: proportional-bars
funnelRate: conversion
chartSeriesSkipMuted: true

actors:
  - 見た: { value: "{viewed}", tone: muted }
  - 申し込んだ: { value: "{ordered}", tone: muted }
  - 集荷した: { value: "{collected}", tone: muted }
  - 届いた: { value: "{delivered}", emphasis: primary }

states:
  viewed: 12000
  ordered: 2800
  collected: 2300
  delivered: 2150

animation:
  - step: "届く前" 1.2s
    draw: funnel
    description: "見た人から届く見込みまで、宅配の段を追う。"
  - step: "先月" 1.2s
    tween:
      viewed: 12000 -> 12000
      ordered: 2800 -> 3400
      collected: 2300 -> 2900
      delivered: 2150 -> 2750
    description: "先月は見た 12000 件から届いた 2750 件まで、率は 28%・85%・95%。"
`;

export const sourceJson__orderToDeliveryFunnel = `{
  "title": "申し込みから届くまで",
  "figureSize": { "width": 544, "height": 496 },
  "type": "funnel",
  "figureCard": { "label": "漏斗", "note": "先月 / 件" },
  "funnelForm": "proportional-bars",
  "funnelRate": "conversion",
  "chartSeriesSkipMuted": true,
  "actors": [
    { "name": "見た", "value": "{viewed}", "tone": "muted" },
    { "name": "申し込んだ", "value": "{ordered}", "tone": "muted" },
    { "name": "集荷した", "value": "{collected}", "tone": "muted" },
    { "name": "届いた", "value": "{delivered}", "emphasis": "primary" }
  ],
  "flow": [],
  "states": { "viewed": 12000, "ordered": 2800, "collected": 2300, "delivered": 2150 },
  "animation": [
    { "step": "届く前", "duration": 1.2, "draw": "funnel", "description": "見た人から届く見込みまで、宅配の段を追う。" },
    {
      "step": "先月",
      "duration": 1.2,
      "description": "先月は見た 12000 件から届いた 2750 件まで、率は 28%・85%・95%。",
      "tween": {
        "viewed": [12000, 12000],
        "ordered": [2800, 3400],
        "collected": [2300, 2900],
        "delivered": [2150, 2750]
      }
    }
  ]
}`;

export const orderToDeliveryFunnel = textDslToDiagram(sourceYaml__orderToDeliveryFunnel);

// ============================================================
// 5. 期間で並べる
// ============================================================
export const sourceYaml__sortingShelfGantt = `title: "仕分け棚を入れ替える工程"
type: gantt
figureCard: {"label":"ガント","note":"色の付いた棒が遅れると本番も遅れる"}
figureSize: {"width":1712,"height":592}
ticks: [2026年6月, 2026年7月, 2026年8月, 2026年9月, 2026年10月]
ganttToday: { index: 3.30, label: "今日" }
ganttTickLabels: [6月, 7月, 8月, 9月, 10月]
ganttBarEnd: position
ganttBarThickness: thin

actors:
  - 調べる: { value: "2026年6月", end: "{survey_end}", tone: muted }
  - 設計する: { value: "2026年6月+0.55", end: "{design_end}", tone: accent, emphasis: primary }
  - 棚を作る: { value: "2026年8月", end: "{shelf_end}", tone: accent, emphasis: primary }
  - 端末を入れる: { value: "2026年8月+0.30", end: "{terminal_end}", tone: muted }
  - 試す: { value: "2026年9月+0.60", end: "{trial_end}", tone: accent, emphasis: primary }
  - 本番: { value: "2026年10月+0.45", startLabel: "10月半ば", milestone: true }

states:
  survey_end: 0.75
  design_end: 1.80
  shelf_end: 3
  terminal_end: 3.25
  trial_end: 4.20

flow:
  - 設計する -> 棚を作る: ""
  - 棚を作る -> 試す: ""
  - 端末を入れる -> 試す: ""
  - 試す -> 本番: ""

animation:
  - step: "入れ替え前の予定" 1.2s
    draw: gantt
    description: "6 月から 10 月までの仕分け棚の入れ替え予定を並べる。"
  - step: "入れ替え工程" 1.2s
    set:
      shelf_end: 3.20
      terminal_end: 3.25
      trial_end: 4.20
    description: "棚と端末を 9 月までに揃え、試した後で 10 月半ばの本番へ進む。 今日は 9 月上旬。"
`;

export const sourceJson__sortingShelfGantt = `{
  "title": "仕分け棚を入れ替える工程",
  "type": "gantt",
  "figureCard": { "label": "ガント", "note": "色の付いた棒が遅れると本番も遅れる" },
  "figureSize": { "width": 1712, "height": 592 },
  "目盛り": ["2026年6月", "2026年7月", "2026年8月", "2026年9月", "2026年10月"],
  "ganttToday": { "index": 3.30, "label": "今日" },
  "ganttTickLabels": ["6月", "7月", "8月", "9月", "10月"],
  "ganttBarEnd": "position",
  "ganttBarThickness": "thin",
  "actors": [
    { "name": "調べる", "subtitle": "2026年6月", "end": "{survey_end}", "tone": "muted" },
    { "name": "設計する", "subtitle": "2026年6月+0.55", "end": "{design_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "棚を作る", "subtitle": "2026年8月", "end": "{shelf_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "端末を入れる", "subtitle": "2026年8月+0.30", "end": "{terminal_end}", "tone": "muted" },
    { "name": "試す", "subtitle": "2026年9月+0.60", "end": "{trial_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "本番", "subtitle": "2026年10月+0.45", "startLabel": "10月半ば", "milestone": true }
  ],
  "flow": [
    { "from": "設計する", "to": "棚を作る", "label": "" },
    { "from": "棚を作る", "to": "試す", "label": "" },
    { "from": "端末を入れる", "to": "試す", "label": "" },
    { "from": "試す", "to": "本番", "label": "" }
  ],
  "states": { "survey_end": 0.75, "design_end": 1.80, "shelf_end": 3, "terminal_end": 3.25, "trial_end": 4.20 },
  "animation": [
    {
      "step": "入れ替え前の予定",
      "duration": 1.2,
      "draw": "gantt",
      "description": "6 月から 10 月までの仕分け棚の入れ替え予定を並べる。"
    },
    {
      "step": "入れ替え工程",
      "duration": 1.2,
      "description": "棚と端末を 9 月までに揃え、試した後で 10 月半ばの本番へ進む。 今日は 9 月上旬。",
      "set": { "shelf_end": 3.20, "terminal_end": 3.25, "trial_end": 4.20 }
    }
  ]
}`;

export const sortingShelfGantt = textDslToDiagram(sourceYaml__sortingShelfGantt);

/**
 * 前後の矢印を書かない形 (#1706)。
 *
 * `dependsOn` を書くと `gantt-arrow` が出る。 カタログのガントチャートは 3 件とも前後を書いており、
 * **矢印の無い段取りがどこにも出ていなかった**。 期日だけを並べる使い方はよくあるので、
 * 同じ見本の切替で見比べられるようにする。
 */
export const patternBase__sortingShelfGantt = "前後つき";

export const sourceYaml__pattern__sortingShelfGantt__帯だけ = `title: "矢印なしの仕分け棚を入れ替える工程"
figureSize: {"width":1712,"height":592}
type: gantt
ticks: [2026年6月, 2026年7月, 2026年8月, 2026年9月, 2026年10月]
ganttToday: { index: 3.30, label: "今日" }
ganttTickLabels: [6月, 7月, 8月, 9月, 10月]
ganttBarEnd: position
ganttBarThickness: thin

actors:
  - 調べる: { value: "2026年6月", end: "{survey_end}", tone: muted }
  - 設計する: { value: "2026年6月+0.55", end: "{design_end}", tone: accent, emphasis: primary }
  - 棚を作る: { value: "2026年8月", end: "{shelf_end}", tone: accent, emphasis: primary }
  - 端末を入れる: { value: "2026年8月+0.30", end: "{terminal_end}", tone: muted }
  - 試す: { value: "2026年9月+0.60", end: "{trial_end}", tone: accent, emphasis: primary }
  - 本番: { value: "2026年10月+0.45", startLabel: "10月半ば", milestone: true }

states:
  survey_end: 0.75
  design_end: 1.80
  shelf_end: 3.20
  terminal_end: 3.25
  trial_end: 4.20

animation:
  - step: "工程の帯を引く" 1.2s
    draw: gantt
    description: "依存の矢印を出さず、仕分け棚を入れ替える工程の帯だけを示す。"
`;

export const sourceJson__pattern__sortingShelfGantt__帯だけ = `{
  "title": "矢印なしの仕分け棚を入れ替える工程",
  "figureSize": { "width": 1712, "height": 592 },
  "type": "gantt",
  "目盛り": ["2026年6月", "2026年7月", "2026年8月", "2026年9月", "2026年10月"],
  "ganttToday": { "index": 3.30, "label": "今日" },
  "ganttTickLabels": ["6月", "7月", "8月", "9月", "10月"],
  "ganttBarEnd": "position",
  "ganttBarThickness": "thin",
  "actors": [
    { "name": "調べる", "subtitle": "2026年6月", "end": "{survey_end}", "tone": "muted" },
    { "name": "設計する", "subtitle": "2026年6月+0.55", "end": "{design_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "棚を作る", "subtitle": "2026年8月", "end": "{shelf_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "端末を入れる", "subtitle": "2026年8月+0.30", "end": "{terminal_end}", "tone": "muted" },
    { "name": "試す", "subtitle": "2026年9月+0.60", "end": "{trial_end}", "tone": "accent", "emphasis": "primary" },
    { "name": "本番", "subtitle": "2026年10月+0.45", "startLabel": "10月半ば", "milestone": true }
  ],
  "flow": [],
  "states": { "survey_end": 0.75, "design_end": 1.80, "shelf_end": 3.20, "terminal_end": 3.25, "trial_end": 4.20 },
  "animation": [
    {
      "step": "工程の帯を引く",
      "duration": 1.2,
      "draw": "gantt",
      "description": "依存の矢印を出さず、仕分け棚を入れ替える工程の帯だけを示す。"
    }
  ]
}`;

export const pattern__sortingShelfGantt__帯だけ = textDslToDiagram(
  sourceYaml__pattern__sortingShelfGantt__帯だけ,
);

/**
 * `milestone` / `emphasis` を書かない時との対照。 記法の省略時も従来の帯を描くことを、
 * 同じ工程と依存関係のまま見比べられるようにする。
 */
export const sourceYaml__pattern__sortingShelfGantt__強調なし = `title: "強調なしの仕分け棚を入れ替える工程"
figureSize: {"width":1712,"height":592}
type: gantt
eyebrow: "棚の終わり {shelf_end}"
ticks: [2026年6月, 2026年7月, 2026年8月, 2026年9月, 2026年10月]
ganttToday: { index: 3.30, label: "今日" }
ganttTickLabels: [6月, 7月, 8月, 9月, 10月]
ganttBarEnd: position
ganttBarThickness: thin

actors:
  - 調べる: { value: "2026年6月", end: "{survey_end}", tone: muted }
  - 設計する: { value: "2026年6月+0.55", end: "{design_end}", tone: accent }
  - 棚を作る: { value: "2026年8月", end: "{shelf_end}", tone: accent }
  - 端末を入れる: { value: "2026年8月+0.30", end: "{terminal_end}", tone: muted }
  - 試す: { value: "2026年9月+0.60", end: "{trial_end}", tone: accent }
  - 本番: { value: "2026年10月+0.45", startLabel: "10月半ば" }

flow:
  - 設計する -> 棚を作る: ""
  - 棚を作る -> 試す: ""
  - 端末を入れる -> 試す: ""
  - 試す -> 本番: ""

states:
  survey_end: 0.75
  design_end: 1.80
  shelf_end: 3
  terminal_end: 3.25
  trial_end: 4.20

animation:
  - step: "入れ替え前の予定" 1.2s
    draw: gantt
    description: "6 月から 10 月までの仕分け棚の入れ替え予定を並べる。"
  - step: "入れ替え工程" 1.2s
    set:
      shelf_end: 3.20
      terminal_end: 3.25
      trial_end: 4.20
    description: "節目や主役の強調を付けず、同じ工程を通常の帯で示す。 今日は 9 月上旬。"
`;

export const sourceJson__pattern__sortingShelfGantt__強調なし = `{
  "title": "強調なしの仕分け棚を入れ替える工程",
  "figureSize": { "width": 1712, "height": 592 },
  "type": "gantt",
  "eyebrow": "棚の終わり {shelf_end}",
  "目盛り": ["2026年6月", "2026年7月", "2026年8月", "2026年9月", "2026年10月"],
  "ganttToday": { "index": 3.30, "label": "今日" },
  "ganttTickLabels": ["6月", "7月", "8月", "9月", "10月"],
  "ganttBarEnd": "position",
  "ganttBarThickness": "thin",
  "actors": [
    { "name": "調べる", "subtitle": "2026年6月", "end": "{survey_end}", "tone": "muted" },
    { "name": "設計する", "subtitle": "2026年6月+0.55", "end": "{design_end}", "tone": "accent" },
    { "name": "棚を作る", "subtitle": "2026年8月", "end": "{shelf_end}", "tone": "accent" },
    { "name": "端末を入れる", "subtitle": "2026年8月+0.30", "end": "{terminal_end}", "tone": "muted" },
    { "name": "試す", "subtitle": "2026年9月+0.60", "end": "{trial_end}", "tone": "accent" },
    { "name": "本番", "subtitle": "2026年10月+0.45", "startLabel": "10月半ば" }
  ],
  "flow": [
    { "from": "設計する", "to": "棚を作る", "label": "" },
    { "from": "棚を作る", "to": "試す", "label": "" },
    { "from": "端末を入れる", "to": "試す", "label": "" },
    { "from": "試す", "to": "本番", "label": "" }
  ],
  "states": { "survey_end": 0.75, "design_end": 1.80, "shelf_end": 3, "terminal_end": 3.25, "trial_end": 4.20 },
  "animation": [
    {
      "step": "入れ替え前の予定",
      "duration": 1.2,
      "draw": "gantt",
      "description": "6 月から 10 月までの仕分け棚の入れ替え予定を並べる。"
    },
    {
      "step": "入れ替え工程",
      "duration": 1.2,
      "description": "節目や主役の強調を付けず、同じ工程を通常の帯で示す。 今日は 9 月上旬。",
      "set": { "shelf_end": 3.20, "terminal_end": 3.25, "trial_end": 4.20 }
    }
  ]
}`;

export const pattern__sortingShelfGantt__強調なし = textDslToDiagram(
  sourceYaml__pattern__sortingShelfGantt__強調なし,
);

// ============================================================
// 6. 体験の起伏
// ============================================================
export const sourceYaml__shipperFeelingJourney = `title: "荷主の気持ち"
type: journey
journeyForm: rules
journeyLineForm: straight
journeyLabels: {"delighted":"最高","happy":"満足","neutral":"普通","frustrated":"不満","angry":"怒り"}
figureCard: {"label":"ジャーニー","note":"最高 から 怒り の 5 段"}
figureSize: {"width":1712,"height":384}

actors:
  - 申し込む: "{order}"
  - 集荷を待つ: "{wait}"
  - 運ばれる: "{carry}"
  - 不在だった: { value: "{absence}", opportunity: "不在票に気づかなかった", opportunityPosition: below-point }
  - 再配達を頼む: "{redelivery}"
  - 受け取る: "{receive}"

states:
  order: "普通"
  wait: "不満"
  carry: "普通"
  absence: "不満"
  redelivery: "不満"
  receive: "満足"

animation:
  - step: "届く前" 1.2s
    draw: journey
    description: "申し込みから受け取るまでの荷主の気持ちを追う。"
  - step: "不在と再配達" 1.2s
    set:
      order: "満足"
      wait: "普通"
      carry: "満足"
      absence: "怒り"
      redelivery: "不満"
      receive: "最高"
    description: "不在票に気づかなかった時が谷になり、受け取る時に最高まで上がる。"
`;

export const sourceJson__shipperFeelingJourney = `{
  "title": "荷主の気持ち",
  "type": "journey",
  "journeyForm": "rules",
  "journeyLineForm": "straight",
  "journeyLabels": { "delighted": "最高", "happy": "満足", "neutral": "普通", "frustrated": "不満", "angry": "怒り" },
  "figureCard": { "label": "ジャーニー", "note": "最高 から 怒り の 5 段" },
  "figureSize": { "width": 1712, "height": 384 },
  "actors": [
    { "name": "申し込む", "subtitle": "{order}" },
    { "name": "集荷を待つ", "subtitle": "{wait}" },
    { "name": "運ばれる", "subtitle": "{carry}" },
    { "name": "不在だった", "value": "{absence}", "opportunity": "不在票に気づかなかった", "opportunityPosition": "below-point" },
    { "name": "再配達を頼む", "subtitle": "{redelivery}" },
    { "name": "受け取る", "subtitle": "{receive}" }
  ],
  "flow": [],
  "states": { "order": "普通", "wait": "不満", "carry": "普通", "absence": "不満", "redelivery": "不満", "receive": "満足" },
  "animation": [
    { "step": "届く前", "duration": 1.2, "draw": "journey", "description": "申し込みから受け取るまでの荷主の気持ちを追う。" },
    {
      "step": "不在と再配達",
      "duration": 1.2,
      "description": "不在票に気づかなかった時が谷になり、受け取る時に最高まで上がる。",
      "set": { "order": "満足", "wait": "普通", "carry": "満足", "absence": "怒り", "redelivery": "不満", "receive": "最高" }
    }
  ]
}`;

export const shipperFeelingJourney = textDslToDiagram(sourceYaml__shipperFeelingJourney);

/**
 * 段ごとの接点を書く形 (#1706)。
 *
 * `touchpoint` を書くと `journey-chip` が出て、どこで起きた出来事かが図に載る。
 * カタログでは組立て API の見本 (`presets`) だけが書いており、記法の見本は書いていなかった。
 * **別の行に分かれていると見比べられない** ので、同じ見本の切替にする。
 */
export const patternBase__shipperFeelingJourney = "気持ちだけ";

export const sourceYaml__pattern__shipperFeelingJourney__接点つき = `title: "荷主の気持ちと接点"
figureSize: {"width":1712,"height":384}
type: journey

actors:
  - 申し込む: { value: "満足", touchpoint: "申し込み画面" }
  - 集荷を待つ: { value: "普通", touchpoint: "集荷予定" }
  - 運ばれる: { value: "満足", touchpoint: "追跡画面" }
  - 不在だった: { value: "{absence}", touchpoint: "不在票", opportunity: "不在票に気づかなかった", opportunityPosition: below-point }
  - 再配達を頼む: { value: "{redelivery}", touchpoint: "再配達受付" }
  - 受け取る: { value: "最高", touchpoint: "受け取り" }

states:
  absence: "怒り"
  redelivery: "不満"

animation:
  - step: "接点を辿る" 1.2s
    draw: journey
    description: "起伏の下に、その気持ちが起きた場所が並ぶ。"
  - step: "知らせた後" 1.2s
    set:
      absence: "普通"
      redelivery: "満足"
    description: "接点はそのままで、不在の前に知らせると谷が上がる。"
`;

export const sourceJson__pattern__shipperFeelingJourney__接点つき = `{
  "title": "荷主の気持ちと接点",
  "figureSize": { "width": 1712, "height": 384 },
  "type": "journey",
  "actors": [
    { "name": "申し込む", "value": "満足", "touchpoint": "申し込み画面" },
    { "name": "集荷を待つ", "value": "普通", "touchpoint": "集荷予定" },
    { "name": "運ばれる", "value": "満足", "touchpoint": "追跡画面" },
    { "name": "不在だった", "value": "{absence}", "touchpoint": "不在票", "opportunity": "不在票に気づかなかった", "opportunityPosition": "below-point" },
    { "name": "再配達を頼む", "value": "{redelivery}", "touchpoint": "再配達受付" },
    { "name": "受け取る", "value": "最高", "touchpoint": "受け取り" }
  ],
  "flow": [],
  "states": { "absence": "怒り", "redelivery": "不満" },
  "animation": [
    {
      "step": "接点を辿る",
      "duration": 1.2,
      "draw": "journey",
      "description": "起伏の下に、その気持ちが起きた場所が並ぶ。"
    },
    {
      "step": "知らせた後",
      "duration": 1.2,
      "description": "接点はそのままで、不在の前に知らせると谷が上がる。",
      "set": { "absence": "普通", "redelivery": "満足" }
    }
  ]
}`;

export const pattern__shipperFeelingJourney__接点つき = textDslToDiagram(
  sourceYaml__pattern__shipperFeelingJourney__接点つき,
);

/**
 * 気持ちの 5 段を全て通る形 (#1966)。
 *
 * 描画エンジンは段の顔を 5 通り描き分ける (`最高` / `満足` / `普通` / `不満` / `怒り`)。
 * 元の見本は `怒り` を書いておらず、いちばん低い顔がどこにも出ていなかった。
 * 抜けは `lib/catalog-value-coverage.test.ts` が engine の一覧と突き合わせて数える。
 *
 * 図表の見本は段で動かす決まりなので (`catalog-motion-render.test.tsx`)、1 段目で 5 つの顔を全て出し、
 * 2 段目で窓口を直した後の山に置き換える。
 *
 * 段の名前は短い名詞にする = 横幅 1440 の画面で 5 つを並べると、動詞の句 (「たらい回しにされる」) は
 * 隣の段の名前と重なる。
 */
export const sourceYaml__pattern__shipperFeelingJourney__5つの気持ち = `title: "荷主が通る 5 つの気持ち"
figureSize: {"width":1712,"height":384}
type: journey

actors:
  - 申し込む: "満足"
  - 集荷を待つ: "普通"
  - 運ばれる: "満足"
  - 不在だった: { value: "{absence}", opportunity: "不在票に気づかなかった", opportunityPosition: below-point }
  - 再配達を頼む: "{redelivery}"
  - 受け取る: "最高"

states:
  absence: "不満"
  redelivery: "普通"

animation:
  - step: "届く前の気持ち" 1.2s
    draw: journey
    description: "届く前は不在を不満、再配達を普通として仮置きする。"
  - step: "5 つの気持ち" 1.2s
    set:
      absence: "怒り"
      redelivery: "不満"
    description: "荷主の道筋で、怒りから最高まで 5 つの気持ちを描き分ける。"
`;

export const sourceJson__pattern__shipperFeelingJourney__5つの気持ち = `{
  "title": "荷主が通る 5 つの気持ち",
  "figureSize": { "width": 1712, "height": 384 },
  "type": "journey",
  "actors": [
    { "name": "申し込む", "subtitle": "満足" },
    { "name": "集荷を待つ", "subtitle": "普通" },
    { "name": "運ばれる", "subtitle": "満足" },
    { "name": "不在だった", "value": "{absence}", "opportunity": "不在票に気づかなかった", "opportunityPosition": "below-point" },
    { "name": "再配達を頼む", "subtitle": "{redelivery}" },
    { "name": "受け取る", "subtitle": "最高" }
  ],
  "flow": [],
  "states": { "absence": "不満", "redelivery": "普通" },
  "animation": [
    {
      "step": "届く前の気持ち",
      "duration": 1.2,
      "draw": "journey",
      "description": "届く前は不在を不満、再配達を普通として仮置きする。"
    },
    {
      "step": "5 つの気持ち",
      "duration": 1.2,
      "description": "荷主の道筋で、怒りから最高まで 5 つの気持ちを描き分ける。",
      "set": { "absence": "怒り", "redelivery": "不満" }
    }
  ]
}`;

export const pattern__shipperFeelingJourney__5つの気持ち = textDslToDiagram(
  sourceYaml__pattern__shipperFeelingJourney__5つの気持ち,
);

// ============================================================
// 7. 枝分かれで広げる
// ============================================================
export const sourceYaml__redeliveryIdeasMind = `title: "再配達を減らす"
type: mind
mindForm: outline
mindSize: {"root":{"width":330,"height":61.891,"fontSize":29},"branch":{"width":220,"height":62.891,"fontSize":29},"leaf":{"fontSize":23},"rootBranchGap":155,"branchLeafGap":70,"branchRowGap":290,"branchRowOffset":10,"leafRowGap":92,"leafRowOffset":6}
figureSize: {"width":1680,"height":470}

actors:
  - "{theme}"
  - 置き場所
  - 時間
  - 知らせる
  - 受け取り方
  - 置き配
  - 宅配ロッカー
  - 時間指定
  - 夜の便
  - 前日に知らせる
  - 着く前に電話
  - コンビニで受け取る
  - 職場に届ける

flow:
  - 置き場所 -> 置き配: ""
  - 置き場所 -> 宅配ロッカー: ""
  - 時間 -> 時間指定: ""
  - 時間 -> 夜の便: ""
  - 知らせる -> 前日に知らせる: ""
  - 知らせる -> 着く前に電話: ""
  - 受け取り方 -> コンビニで受け取る: ""
  - 受け取り方 -> 職場に届ける: ""

states:
  theme: "困りごと"

animation:
  - step: "困りごと" 1.2s
    draw: mind
    description: "受け取りの困りごとから、置き場所と時間の枝を考える。"
  - step: "再配達を減らす" 1.2s
    set:
      theme: "再配達を減らす"
    description: "中心を再配達を減らすに定め、4 本の手立てと 8 枚の葉を読む。"
`;

export const sourceJson__redeliveryIdeasMind = `{
  "title": "再配達を減らす",
  "type": "mind",
  "mindForm": "outline",
  "mindSize": {
    "root": { "width": 330, "height": 61.891, "fontSize": 29 },
    "branch": { "width": 220, "height": 62.891, "fontSize": 29 },
    "leaf": { "fontSize": 23 },
    "rootBranchGap": 155,
    "branchLeafGap": 70,
    "branchRowGap": 290,
    "branchRowOffset": 10,
    "leafRowGap": 92,
    "leafRowOffset": 6
  },
  "figureSize": { "width": 1680, "height": 470 },
  "actors": [
    { "name": "{theme}" },
    { "name": "置き場所" },
    { "name": "時間" },
    { "name": "知らせる" },
    { "name": "受け取り方" },
    { "name": "置き配" },
    { "name": "宅配ロッカー" },
    { "name": "時間指定" },
    { "name": "夜の便" },
    { "name": "前日に知らせる" },
    { "name": "着く前に電話" },
    { "name": "コンビニで受け取る" },
    { "name": "職場に届ける" }
  ],
  "flow": [
    { "from": "置き場所", "to": "置き配", "label": "" },
    { "from": "置き場所", "to": "宅配ロッカー", "label": "" },
    { "from": "時間", "to": "時間指定", "label": "" },
    { "from": "時間", "to": "夜の便", "label": "" },
    { "from": "知らせる", "to": "前日に知らせる", "label": "" },
    { "from": "知らせる", "to": "着く前に電話", "label": "" },
    { "from": "受け取り方", "to": "コンビニで受け取る", "label": "" },
    { "from": "受け取り方", "to": "職場に届ける", "label": "" }
  ],
  "states": { "theme": "困りごと" },
  "animation": [
    { "step": "困りごと", "duration": 1.2, "draw": "mind", "description": "受け取りの困りごとから、置き場所と時間の枝を考える。" },
    { "step": "再配達を減らす", "duration": 1.2, "description": "中心を再配達を減らすに定め、4 本の手立てと 8 枚の葉を読む。", "set": { "theme": "再配達を減らす" } }
  ]
}`;

export const redeliveryIdeasMind = textDslToDiagram(sourceYaml__redeliveryIdeasMind);

/**
 * 根にも枝にも説明を書かない形 (#1706)。
 *
 * 説明 (`rootSubtitle` / 枝の `subtitle`) を書くと `mind-node-subtitle` が出る。
 * カタログの発想の枝は 3 件とも数字を添えており、**見出しだけで広げる形が出ていなかった**。
 * 考えを広げる段階では数字を持たないことのほうが多いので、切替で両方を見せる。
 */
export const patternBase__redeliveryIdeasMind = "見出しだけ";

export const sourceYaml__pattern__redeliveryIdeasMind__説明つき = `title: "再配達を減らす手立ての説明"
figureSize: {"width":1680,"height":470}
type: mind
mindSize: {"root":{"width":330,"height":61.891,"fontSize":29},"branch":{"width":220,"height":62.891,"fontSize":29},"leaf":{"fontSize":23},"rootBranchGap":155,"branchLeafGap":70,"branchRowGap":290,"branchRowOffset":10,"leafRowGap":92,"leafRowOffset":6}

actors:
  - 再配達を減らす: "受け取りやすくする"
  - 置き場所: "宅配箱"
  - 時間: "指定"
  - 知らせる: "事前に"
  - 受け取り方: "届け先を選べる"

animation:
  - step: "説明を添える" 1.2s
    draw: mind
    description: "再配達を減らす 4 本の枝に短い説明を添える。"
`;

export const sourceJson__pattern__redeliveryIdeasMind__説明つき = `{
  "title": "再配達を減らす手立ての説明",
  "figureSize": { "width": 1680, "height": 470 },
  "type": "mind",
  "mindSize": {
    "root": { "width": 330, "height": 61.891, "fontSize": 29 },
    "branch": { "width": 220, "height": 62.891, "fontSize": 29 },
    "leaf": { "fontSize": 23 },
    "rootBranchGap": 155,
    "branchLeafGap": 70,
    "branchRowGap": 290,
    "branchRowOffset": 10,
    "leafRowGap": 92,
    "leafRowOffset": 6
  },
  "actors": [
    { "name": "再配達を減らす", "subtitle": "受け取りやすくする" },
    { "name": "置き場所", "subtitle": "宅配箱" },
    { "name": "時間", "subtitle": "指定" },
    { "name": "知らせる", "subtitle": "事前に" },
    { "name": "受け取り方", "subtitle": "届け先を選べる" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "説明を添える",
      "duration": 1.2,
      "draw": "mind",
      "description": "再配達を減らす 4 本の枝に短い説明を添える。"
    }
  ]
}`;

export const pattern__redeliveryIdeasMind__説明つき = textDslToDiagram(
  sourceYaml__pattern__redeliveryIdeasMind__説明つき,
);

// ============================================================
// 8. 2 軸で分ける
// ============================================================
export const sourceYaml__measureEffortQuadrant = `title: "打ち手の手間と効き目"
figureSize: {"width":544,"height":496}
type: quadrant
figureCard: {"label":"四象限","note":"左上から手を付ける"}
quadrantPointLabelSide: right

axes:
  x: { label: "手間", direction: true }
  y: { label: "効き目", direction: true }

regions:
  左上: "先にやる"
  右上: "計画してやる"
  左下: "ついでにやる"
  右下: "やらない"

actors:
  - 置き配: { at: ["{dropoff_x}", "{dropoff_y}"] }
  - 前日に知らせる: { at: ["{notice_x}", "{notice_y}"] }
  - 宅配ロッカー: { at: ["{locker_x}", "{locker_y}"] }
  - 不在票を電子に: { at: ["{digital_x}", "{digital_y}"] }
  - 夜の便: { at: ["{night_x}", "{night_y}"] }

states:
  dropoff_x: 0.12
  dropoff_y: 0.70
  notice_x: 0.38
  notice_y: 0.88
  locker_x: 0.84
  locker_y: 0.84
  digital_x: 0.36
  digital_y: 0.16
  night_x: 0.88
  night_y: 0.34

animation:
  - step: "案を並べる" 1.2s
    description: "宅配の打ち手を手間と効き目で仮置きする。"
  - step: "優先度を決める" 1.2s
    set:
      dropoff_x: 0.20
      dropoff_y: 0.82
      notice_x: 0.30
      notice_y: 0.62
      locker_x: 0.70
      locker_y: 0.70
      digital_x: 0.22
      digital_y: 0.32
      night_x: 0.76
      night_y: 0.20
    description: "置き配と前日の知らせを先にやり、宅配ロッカーは計画して進める。"
`;

export const sourceJson__measureEffortQuadrant = `{
  "title": "打ち手の手間と効き目",
  "figureSize": { "width": 544, "height": 496 },
  "type": "quadrant",
  "figureCard": { "label": "四象限", "note": "左上から手を付ける" },
  "quadrantPointLabelSide": "right",
  "axes": {
    "x": { "label": "手間", "direction": true },
    "y": { "label": "効き目", "direction": true }
  },
  "regions": {
    "左上": "先にやる",
    "右上": "計画してやる",
    "左下": "ついでにやる",
    "右下": "やらない"
  },
  "actors": [
    { "name": "置き配", "at": ["{dropoff_x}", "{dropoff_y}"] },
    { "name": "前日に知らせる", "at": ["{notice_x}", "{notice_y}"] },
    { "name": "宅配ロッカー", "at": ["{locker_x}", "{locker_y}"] },
    { "name": "不在票を電子に", "at": ["{digital_x}", "{digital_y}"] },
    { "name": "夜の便", "at": ["{night_x}", "{night_y}"] }
  ],
  "flow": [],
  "states": {
    "dropoff_x": 0.12, "dropoff_y": 0.70, "notice_x": 0.38, "notice_y": 0.88,
    "locker_x": 0.84, "locker_y": 0.84, "digital_x": 0.36, "digital_y": 0.16,
    "night_x": 0.88, "night_y": 0.34
  },
  "animation": [
    { "step": "案を並べる", "duration": 1.2, "description": "宅配の打ち手を手間と効き目で仮置きする。" },
    {
      "step": "優先度を決める",
      "duration": 1.2,
      "description": "置き配と前日の知らせを先にやり、宅配ロッカーは計画して進める。",
      "set": {
        "dropoff_x": 0.20, "dropoff_y": 0.82, "notice_x": 0.30, "notice_y": 0.62,
        "locker_x": 0.70, "locker_y": 0.70, "digital_x": 0.22, "digital_y": 0.32,
        "night_x": 0.76, "night_y": 0.20
      }
    }
  ]
}`;

export const measureEffortQuadrant = textDslToDiagram(sourceYaml__measureEffortQuadrant);

// ============================================================
// 9. 親子で束ねる
// ============================================================
export const sourceYaml__deliveryOfficeTree = `title: "営業所の階層"
type: tree
treeNodeForm: frame
treeEdgeTone: depth
treeEdgeHead: triangle
treeSize: {"nodeWidths":[260,240,220],"nodeHeight":91.891,"titleFontSize":29,"subtitleFontSize":19,"siblingGap":180,"levelGap":58.109}
figureSize: {"width":1680,"height":392}

actors:
  - 本社: "全国 12 営業所"
  - 東日本: "7 営業所"
  - 西日本: "5 営業所"
  - 東京: "42 人"
  - 仙台: "18 人"
  - 大阪: "35 人"
  - 福岡: "21 人"

flow:
  - 本社 -> 東日本: ""
  - 本社 -> 西日本: ""
  - 東日本 -> 東京: ""
  - 東日本 -> 仙台: ""
  - 西日本 -> 大阪: ""
  - 西日本 -> 福岡: ""

animation:
  - step: "本社から営業所へ" 1.2s
    draw: tree
    description: "本社から東西の地域を通り、4 営業所へ枝を伸ばす。"
`;

export const sourceJson__deliveryOfficeTree = `{
  "title": "営業所の階層",
  "type": "tree",
  "treeNodeForm": "frame",
  "treeEdgeTone": "depth",
  "treeEdgeHead": "triangle",
  "treeSize": {
    "nodeWidths": [260, 240, 220],
    "nodeHeight": 91.891,
    "titleFontSize": 29,
    "subtitleFontSize": 19,
    "siblingGap": 180,
    "levelGap": 58.109
  },
  "figureSize": { "width": 1680, "height": 392 },
  "actors": [
    { "name": "本社", "subtitle": "全国 12 営業所" },
    { "name": "東日本", "subtitle": "7 営業所" },
    { "name": "西日本", "subtitle": "5 営業所" },
    { "name": "東京", "subtitle": "42 人" },
    { "name": "仙台", "subtitle": "18 人" },
    { "name": "大阪", "subtitle": "35 人" },
    { "name": "福岡", "subtitle": "21 人" }
  ],
  "flow": [
    { "from": "本社", "to": "東日本", "label": "" },
    { "from": "本社", "to": "西日本", "label": "" },
    { "from": "東日本", "to": "東京", "label": "" },
    { "from": "東日本", "to": "仙台", "label": "" },
    { "from": "西日本", "to": "大阪", "label": "" },
    { "from": "西日本", "to": "福岡", "label": "" }
  ],
  "animation": [
    {
      "step": "本社から営業所へ",
      "duration": 1.2,
      "draw": "tree",
      "description": "本社から東西の地域を通り、4 営業所へ枝を伸ばす。"
    }
  ]
}`;

export const deliveryOfficeTree = textDslToDiagram(sourceYaml__deliveryOfficeTree);

/**
 * 節に説明を添える形 (#1706)。
 *
 * `subtitle` を書くと `tree-node-subtitle` が出る。 カタログの系統樹は 2 件とも名前だけで、
 * **説明を添えた形がどこにも出ていなかった**。 構成を人に見せる時は名前だけでは伝わらない
 * ことが多いので、切替で両方を見せる。
 */
export const patternBase__deliveryOfficeTree = "説明つき";

export const sourceYaml__pattern__deliveryOfficeTree__見出しだけ = `title: "営業所の階層を見出しだけで示す"
figureSize: {"width":1680,"height":392}
type: tree
treeSize: {"nodeWidths":[260,240,220],"nodeHeight":91.891,"titleFontSize":29,"subtitleFontSize":19,"siblingGap":180,"levelGap":58.109}

actors:
  - 本社
  - 東日本
  - 西日本
  - 東京
  - 仙台
  - 大阪
  - 福岡

flow:
  - 本社 -> 東日本: ""
  - 本社 -> 西日本: ""
  - 東日本 -> 東京: ""
  - 東日本 -> 仙台: ""
  - 西日本 -> 大阪: ""
  - 西日本 -> 福岡: ""

animation:
  - step: "営業所を辿る" 1.2s
    draw: tree
    description: "補足を省き、本社から営業所までの階層だけを辿る。"
`;

export const sourceJson__pattern__deliveryOfficeTree__見出しだけ = `{
  "title": "営業所の階層を見出しだけで示す",
  "figureSize": { "width": 1680, "height": 392 },
  "type": "tree",
  "treeSize": {
    "nodeWidths": [260, 240, 220],
    "nodeHeight": 91.891,
    "titleFontSize": 29,
    "subtitleFontSize": 19,
    "siblingGap": 180,
    "levelGap": 58.109
  },
  "actors": [
    { "name": "本社" },
    { "name": "東日本" },
    { "name": "西日本" },
    { "name": "東京" },
    { "name": "仙台" },
    { "name": "大阪" },
    { "name": "福岡" }
  ],
  "flow": [
    { "from": "本社", "to": "東日本", "label": "" },
    { "from": "本社", "to": "西日本", "label": "" },
    { "from": "東日本", "to": "東京", "label": "" },
    { "from": "東日本", "to": "仙台", "label": "" },
    { "from": "西日本", "to": "大阪", "label": "" },
    { "from": "西日本", "to": "福岡", "label": "" }
  ],
  "animation": [
    {
      "step": "営業所を辿る",
      "duration": 1.2,
      "draw": "tree",
      "description": "補足を省き、本社から営業所までの階層だけを辿る。"
    }
  ]
}`;

export const pattern__deliveryOfficeTree__見出しだけ = textDslToDiagram(
  sourceYaml__pattern__deliveryOfficeTree__見出しだけ,
);

// ============================================================
// 10. 合計を半円で示す
//
// **`draw: gauge` で 9 時から弧が伸びる** (`cdl#715`)。 伸びる向きは弧の向きそのもの。
// 合計の字と内訳の段は最初から出る = 合計はこの図の主役なので、左から半分ずつ現れると読めない。
// ============================================================
export const sourceYaml__onTimeShareGauge = `title: "定時に届いた割合"
figureSize: {"width":544,"height":496}
type: chart
shape: gauge
figureCard: {"label":"半円","note":"目標 80%"}
chartGaugeValue: {"max":100,"current":"{on_time}","target":80,"previous":72,"previousLabel":"先月"}

actors:
  - 定時に届いた: "{on_time}"
  - 遅れた: "{late}"

states:
  on_time: 72
  late: 28

animation:
  - step: "先月" 1.2s
    draw: gauge
    description: "先月の定時率は 72%。 比較元も 72% なので、先月より 0。"
  - step: "今月" 1.2s
    tween:
      on_time: 72 -> 78
      late: 28 -> 22
    description: "定時に届いた割合は 78%。 目標 80% まであと 2、先月より +6。"
`;

export const sourceJson__onTimeShareGauge = `{
  "title": "定時に届いた割合",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "gauge",
  "figureCard": { "label": "半円", "note": "目標 80%" },
  "chartGaugeValue": { "max": 100, "current": "{on_time}", "target": 80, "previous": 72, "previousLabel": "先月" },
  "actors": [
    { "name": "定時に届いた", "subtitle": "{on_time}" },
    { "name": "遅れた", "subtitle": "{late}" }
  ],
  "flow": [],
  "states": { "on_time": 72, "late": 28 },
  "animation": [
    {
      "step": "先月",
      "duration": 1.2,
      "draw": "gauge",
      "description": "先月の定時率は 72%。 比較元も 72% なので、先月より 0。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "定時に届いた割合は 78%。 目標 80% まであと 2、先月より +6。",
      "tween": {
        "on_time": [72, 78],
        "late": [28, 22]
      }
    }
  ]
}`;

export const onTimeShareGauge = textDslToDiagram(sourceYaml__onTimeShareGauge);

// ------------------------------------------------------------
// 10b. 固定の尺・内訳・前の内訳を `パターン` で見比べる (#1722 / #2854)
//
// actor の `previous` を書くと、半円の内側に前の内訳の輪が入る (`cdl#767`)。
// 主の固定尺は `chartGaugeValue.previous` の比較印を持つため、内訳だけの図を間に置き、
// **比較印 1 本 / なし / 内訳の輪 2 本**を同じ見本の切替で見せる。
//
// **今の弧は内側へ寄らずに細くなる**。 前の輪を足すために外側の帯を分け合う形で、
// 外周そのものは動かない = 切替を押しても図の大きさが変わらない。
//
// 前の輪は今の弧と同じ順で同じ色を使う。 順を変えると、内と外で同じ色が別の項目を指す。
// ------------------------------------------------------------
export const patternBase__onTimeShareGauge = "固定の尺";

export const sourceYaml__pattern__onTimeShareGauge__内訳だけ = `title: "定時に届いた割合の内訳"
figureSize: {"width":544,"height":496}
type: chart
shape: gauge

actors:
  - 定時に届いた: "{on_time}"
  - 遅れた: { value: "{late}", tone: muted }

states:
  on_time: 72
  late: 28

animation:
  - step: "先月" 1.2s
    draw: gauge
    description: "先月は定時に届いた割合 72%、遅れた割合 28% の内訳。"
  - step: "今月" 1.2s
    tween:
      on_time: 72 -> 78
      late: 28 -> 22
    description: "定時に届いた割合 78% と遅れた割合 22% の内訳。"
`;

export const sourceJson__pattern__onTimeShareGauge__内訳だけ = `{
  "title": "定時に届いた割合の内訳",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "gauge",
  "actors": [
    { "name": "定時に届いた", "subtitle": "{on_time}" },
    { "name": "遅れた", "value": "{late}", "tone": "muted" }
  ],
  "flow": [],
  "states": { "on_time": 72, "late": 28 },
  "animation": [
    {
      "step": "先月",
      "duration": 1.2,
      "draw": "gauge",
      "description": "先月は定時に届いた割合 72%、遅れた割合 28% の内訳。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "定時に届いた割合 78% と遅れた割合 22% の内訳。",
      "tween": {
        "on_time": [72, 78],
        "late": [28, 22]
      }
    }
  ]
}`;

export const pattern__onTimeShareGauge__内訳だけ = textDslToDiagram(
  sourceYaml__pattern__onTimeShareGauge__内訳だけ,
);

export const sourceYaml__pattern__onTimeShareGauge__前の値つき = `title: "先月と比べた定時に届いた割合"
figureSize: {"width":544,"height":496}
type: chart
shape: gauge

actors:
  - 定時に届いた: { value: "{on_time}", previous: "72" }
  - 遅れた: { value: "{late}", previous: "28", tone: muted }

states:
  on_time: 78
  late: 22

animation:
  - step: "先月と今月" 1.2s
    draw: gauge
    description: "内側が先月、外側が今月。 定時に届いた割合が 72% から 78% へ増えた。"
  - step: "目標へ" 1.2s
    tween:
      on_time: 78 -> 80
      late: 22 -> 20
    description: "外側だけが目標 80% へ動き、内側の先月 72% は動かない。"
`;

export const sourceJson__pattern__onTimeShareGauge__前の値つき = `{
  "title": "先月と比べた定時に届いた割合",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "gauge",
  "actors": [
    { "name": "定時に届いた", "value": "{on_time}", "previous": "72" },
    { "name": "遅れた", "value": "{late}", "previous": "28", "tone": "muted" }
  ],
  "flow": [],
  "states": { "on_time": 78, "late": 22 },
  "animation": [
    {
      "step": "先月と今月",
      "duration": 1.2,
      "draw": "gauge",
      "description": "内側が先月、外側が今月。 定時に届いた割合が 72% から 78% へ増えた。"
    },
    {
      "step": "目標へ",
      "duration": 1.2,
      "description": "外側だけが目標 80% へ動き、内側の先月 72% は動かない。",
      "tween": {
        "on_time": [78, 80],
        "late": [22, 20]
      }
    }
  ]
}`;

export const pattern__onTimeShareGauge__前の値つき = textDslToDiagram(
  sourceYaml__pattern__onTimeShareGauge__前の値つき,
);

// ============================================================
// 11. 弧の長さで比べる
//
// **`draw: radial` で各輪が 12 時から開く** (`cdl#715`)。 円グラフと起点を揃えている。
// 軌道 (全周の薄い輪) と一覧は最初から出る = 軌道は「あとどれだけで一周か」 を示す枠なので、
// 一緒に伸ばすと比べる相手が無いまま弧だけが伸びる。
// ============================================================
export const sourceYaml__chartRadial = `title: "機能ごとの利用率"
type: chart
shape: radial

actors:
  - 検索: "{search}"
  - 保存: "{save}"
  - 共有: "{share}"
  - 書き出し: "{export}"

states:
  search: 72
  save: 45
  share: 28
  export: 12

animation:
  - step: "先月" 1.2s
    draw: radial
    description: "各輪が 12 時から開く。 検索が 72 で最も高い。"
  - step: "今月" 1.2s
    tween:
      search: 72 -> 78
      save: 45 -> 52
      share: 28 -> 41
      export: 12 -> 15
    description: "共有が 28 から 41 へ伸びる。"
`;

export const sourceJson__chartRadial = `{
  "title": "機能ごとの利用率",
  "type": "chart",
  "shape": "radial",
  "actors": [
    { "name": "検索", "subtitle": "{search}" },
    { "name": "保存", "subtitle": "{save}" },
    { "name": "共有", "subtitle": "{share}" },
    { "name": "書き出し", "subtitle": "{export}" }
  ],
  "flow": [],
  "states": { "search": 72, "save": 45, "share": 28, "export": 12 },
  "animation": [
    {
      "step": "先月",
      "duration": 1.2,
      "draw": "radial",
      "description": "各輪が 12 時から開く。 検索が 72 で最も高い。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "共有が 28 から 41 へ伸びる。",
      "tween": {
        "search": [72, 78],
        "save": [45, 52],
        "share": [28, 41],
        "export": [12, 15]
      }
    }
  ]
}`;

export const chartRadial = textDslToDiagram(sourceYaml__chartRadial);

// ------------------------------------------------------------
// 11b. 前の時点を帯の上の印で示す (`パターン` の切替で選ぶ、 #1722)
//
// `previous` を書くと、輪 1 本ごとに前の時点の角度で印が 1 つ入る (`cdl#767`)。
// 書かない図では入らないので、**同じ見本の切替で両側を見せる**。
//
// **印は帯を横切る短い線**。 弧を重ねると今の弧に隠れるか、前が小さい時に外から見えない =
// 帯の幅いっぱいを横切って少しはみ出す形にすることで、前後どちらが大きくても読める。
//
// 共有は前 12 で今 28、書き出しは前 14 で今 12。 増えた側と減った側の両方を置いている。
// ------------------------------------------------------------
export const patternBase__chartRadial = "今だけ";

export const sourceYaml__pattern__chartRadial__前の値つき = `title: "先月と比べた機能ごとの利用率"
type: chart
shape: radial

actors:
  - 検索: { value: "{search}", previous: "65" }
  - 保存: { value: "{save}", previous: "50" }
  - 共有: { value: "{share}", previous: "12" }
  - 書き出し: { value: "{export}", previous: "14" }

states:
  search: 72
  save: 45
  share: 28
  export: 12

animation:
  - step: "今月" 1.2s
    draw: radial
    description: "印が先月の位置。 共有だけが 12 から 28 へ伸びた。"
  - step: "来月の見込み" 1.2s
    tween:
      share: 28 -> 41
      export: 12 -> 15
    description: "共有がさらに伸びる。 印は先月のまま動かない。"
`;

export const sourceJson__pattern__chartRadial__前の値つき = `{
  "title": "先月と比べた機能ごとの利用率",
  "type": "chart",
  "shape": "radial",
  "actors": [
    { "name": "検索", "value": "{search}", "previous": "65" },
    { "name": "保存", "value": "{save}", "previous": "50" },
    { "name": "共有", "value": "{share}", "previous": "12" },
    { "name": "書き出し", "value": "{export}", "previous": "14" }
  ],
  "flow": [],
  "states": { "search": 72, "save": 45, "share": 28, "export": 12 },
  "animation": [
    {
      "step": "今月",
      "duration": 1.2,
      "draw": "radial",
      "description": "印が先月の位置。 共有だけが 12 から 28 へ伸びた。"
    },
    {
      "step": "来月の見込み",
      "duration": 1.2,
      "description": "共有がさらに伸びる。 印は先月のまま動かない。",
      "tween": { "share": [28, 41], "export": [12, 15] }
    }
  ]
}`;

export const pattern__chartRadial__前の値つき = textDslToDiagram(
  sourceYaml__pattern__chartRadial__前の値つき,
);

// ============================================================
// 12. 値を大きく示す
//
// **割合は件が 2 つ以上の図でだけ出る** (`cdl#759`)。 件が 1 つだと分母が自分自身になり
// 必ず 100% になるため、割合の字と弧を描かない。 2 つの形を別々の見本で見せる。
// 段の `draw` は書かない = 描画側が「起点から描く」 動きを持たない。
// **`previous` は下の `パターン` が見せる** (`cdl#763` で描かれるようになった)。 ここでは
// 書かない側を持ち、押すと前の時点を添えた側に入れ替わる。
// ============================================================
export const sourceYaml__chartStat = `title: "今月の解約件数"
type: chart
shape: stat

actors:
  - 解約件数: "{now}"

states:
  now: 24

animation:
  - step: "先月" 1.2s
    description: "先月の解約は 24 件。 比べる元になる値。"
  - step: "今月" 1.2s
    tween:
      now: 24 -> 19
    description: "施策の後に 19 件まで下がる。"
`;

export const sourceJson__chartStat = `{
  "title": "今月の解約件数",
  "type": "chart",
  "shape": "stat",
  "actors": [
    { "name": "解約件数", "value": "{now}" }
  ],
  "flow": [],
  "states": { "now": 24 },
  "animation": [
    { "step": "先月", "duration": 1.2, "description": "先月の解約は 24 件。 比べる元になる値。" },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "施策の後に 19 件まで下がる。",
      "tween": { "now": [24, 19] }
    }
  ]
}`;

export const chartStat = textDslToDiagram(sourceYaml__chartStat);

// ------------------------------------------------------------
// 12b. 数を並べて取り分も見せる (`パターン` の切替で選ぶ、 #1696)
//
// 件が 2 つ以上あると分母が全件の合計になり、割合の字と弧が出る (`cdl#759`)。
// **一覧の別行にはしない** = 一覧は「この記法でこう描ける」 の目録で、同じ記法の
// 中身違いが行を持つと項目の数と記法の型の数がずれる。 `pattern__<元>__<名前>` で
// export すると図の上の `パターン` の切替に並び、押すと中身が入れ替わる。
// ------------------------------------------------------------
export const patternBase__chartStat = "1 件";

export const sourceYaml__pattern__chartStat__複数 = `title: "問い合わせの内訳"
type: chart
shape: stat

actors:
  - 対応済み: "{done}"
  - 対応中: "{doing}"
  - 未着手: "{todo}"

states:
  done: 128
  doing: 46
  todo: 18

animation:
  - step: "先週" 1.2s
    description: "対応済みが 128 件で全体の 66.7%。"
  - step: "今週" 1.2s
    tween:
      done: 128 -> 152
      doing: 46 -> 31
      todo: 18 -> 9
    description: "未着手が 9 件まで減り、対応済みの取り分が伸びる。"
`;

export const sourceJson__pattern__chartStat__複数 = `{
  "title": "問い合わせの内訳",
  "type": "chart",
  "shape": "stat",
  "actors": [
    { "name": "対応済み", "value": "{done}" },
    { "name": "対応中", "value": "{doing}" },
    { "name": "未着手", "value": "{todo}" }
  ],
  "flow": [],
  "states": { "done": 128, "doing": 46, "todo": 18 },
  "animation": [
    {
      "step": "先週",
      "duration": 1.2,
      "description": "対応済みが 128 件で全体の 66.7%。"
    },
    {
      "step": "今週",
      "duration": 1.2,
      "description": "未着手が 9 件まで減り、対応済みの取り分が伸びる。",
      "tween": { "done": [128, 152], "doing": [46, 31], "todo": [18, 9] }
    }
  ]
}`;

export const pattern__chartStat__複数 = textDslToDiagram(sourceYaml__pattern__chartStat__複数);

// ------------------------------------------------------------
// 12c. 前の時点を添える (`パターン` の切替で選ぶ、 #1711)
//
// `previous` を書くと、数値の下に前の時点が 1 行出る (`cdl#763`)。 書かない図では
// 1 行も出ないので、**同じ見本の切替で両側を見せる** = 押して見比べれば「書くと何が
// 増えるか」 が 1 画面で読める。
//
// 前の値は段で動かさない。 動かすと「前の時点」 が段ごとに変わり、今の値との差が
// 読み手の記憶に頼ることになる。
// ------------------------------------------------------------
export const sourceYaml__pattern__chartStat__前の値つき = `title: "前の月と比べた解約件数"
type: chart
shape: stat

actors:
  - 解約件数: { value: "{now}", previous: "38" }

states:
  now: 24

animation:
  - step: "先月" 1.2s
    description: "前の時点は 38 件。 いまは 24 件。"
  - step: "今月" 1.2s
    tween:
      now: 24 -> 19
    description: "施策の後に 19 件まで下がる。 前の時点は 38 件のまま。"
`;

export const sourceJson__pattern__chartStat__前の値つき = `{
  "title": "前の月と比べた解約件数",
  "type": "chart",
  "shape": "stat",
  "actors": [
    { "name": "解約件数", "value": "{now}", "previous": "38" }
  ],
  "flow": [],
  "states": { "now": 24 },
  "animation": [
    { "step": "先月", "duration": 1.2, "description": "前の時点は 38 件。 いまは 24 件。" },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "施策の後に 19 件まで下がる。 前の時点は 38 件のまま。",
      "tween": { "now": [24, 19] }
    }
  ]
}`;

export const pattern__chartStat__前の値つき = textDslToDiagram(
  sourceYaml__pattern__chartStat__前の値つき,
);

// ============================================================
// 13. 割合を 100 個の印で示す
//
// **合計を 100 に揃える**。 揃えないと印の数が実際の割合と食い違う。
//
// **`draw: waffle` で印が読む向きに 1 個ずつ埋まる** (`cdl#719`)。 左の一覧は最初から出る =
// この図は「数えて確かめられる」 ことが存在理由で、一覧はその答え合わせの表になる。
// ============================================================
export const sourceYaml__parcelSizeWaffle = `title: "荷物の大きさ"
figureSize: {"width":544,"height":496}
type: chart
shape: waffle
figureCard: {"label":"升目","note":"1 マス = 1%"}
chartWaffleLegendPosition: right

actors:
  - 小さい: "{small}"
  - ふつう: "{medium}"
  - 大きい: { value: "{large}", tone: muted }

states:
  small: 48
  medium: 34
  large: 18

animation:
  - step: "集荷時" 1.2s
    draw: waffle
    description: "1 マスを 1% として、集荷時の荷物の大きさを 100 個の印で示す。"
  - step: "今月" 1.2s
    tween:
      small: 48 -> 52
      medium: 34 -> 31
      large: 18 -> 17
    description: "今月は小さい 52%、ふつう 31%、大きい 17%。"
`;

export const sourceJson__parcelSizeWaffle = `{
  "title": "荷物の大きさ",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "waffle",
  "figureCard": { "label": "升目", "note": "1 マス = 1%" },
  "chartWaffleLegendPosition": "right",
  "actors": [
    { "name": "小さい", "subtitle": "{small}" },
    { "name": "ふつう", "subtitle": "{medium}" },
    { "name": "大きい", "value": "{large}", "tone": "muted" }
  ],
  "flow": [],
  "states": { "small": 48, "medium": 34, "large": 18 },
  "animation": [
    {
      "step": "集荷時",
      "duration": 1.2,
      "draw": "waffle",
      "description": "1 マスを 1% として、集荷時の荷物の大きさを 100 個の印で示す。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "今月は小さい 52%、ふつう 31%、大きい 17%。",
      "tween": { "small": [48, 52], "medium": [34, 31], "large": [18, 17] }
    }
  ]
}`;

export const parcelSizeWaffle = textDslToDiagram(sourceYaml__parcelSizeWaffle);

// ============================================================
// 14. 内訳と時点間の変化を帯で示す
//
// **`previous` を書くと帯が 2 本になる**。 書かない図は 1 本のままで、
// 内訳だけを示す図として使える。
//
// **`draw: stacked` で左から帯が伸びる** (`cdl#715`)。 帯が 2 本あっても同時に伸びる =
// 上下で同じ位置を見比べる図なので、片方だけ先に出ると比べる相手がいない時間ができる。
// ============================================================
export const sourceYaml__deliveryResultStacked = `title: "配達の結果"
figureSize: {"width":544,"height":496}
type: chart
shape: stacked
figureCard: {"label":"内訳の帯","note":"月ごと / %"}
chartStackedPeriods: [{"label":"6月","values":[79,19,2]},{"label":"7月","values":[81,17,2]},{"label":"8月","values":[77,21,2]},{"label":"9月","values":[83,16,1]},{"label":"10月","values":[86,13,1]}]
chartStackedRateId: "再配達"
chartStackedLegendPosition: top
chartSeriesSkipMuted: true

actors:
  - 一度で届いた: { value: "{first_try}", previous: "83", tone: muted }
  - 再配達: { value: "{redelivery}", previous: "16", emphasis: primary }
  - 戻った: { value: "{returned}", previous: "1" }

states:
  first_try: 83
  redelivery: 16
  returned: 1

animation:
  - step: "9月" 1.2s
    draw: stacked
    description: "6 月 79/19/2、7 月 81/17/2、8 月 77/21/2 を経て、9 月は 83/16/1。"
  - step: "10月" 1.2s
    tween:
      first_try: 83 -> 86
      redelivery: 16 -> 13
      returned: 1 -> 1
    description: "10 月は一度で届いた 86%、再配達 13%、戻った 1%。 上が 9 月、下が 10 月。"
`;

export const sourceJson__deliveryResultStacked = `{
  "title": "配達の結果",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "stacked",
  "figureCard": { "label": "内訳の帯", "note": "月ごと / %" },
  "chartStackedPeriods": [
    { "label": "6月", "values": [79, 19, 2] },
    { "label": "7月", "values": [81, 17, 2] },
    { "label": "8月", "values": [77, 21, 2] },
    { "label": "9月", "values": [83, 16, 1] },
    { "label": "10月", "values": [86, 13, 1] }
  ],
  "chartStackedRateId": "再配達",
  "chartStackedLegendPosition": "top",
  "chartSeriesSkipMuted": true,
  "actors": [
    { "name": "一度で届いた", "value": "{first_try}", "previous": "83", "tone": "muted" },
    { "name": "再配達", "value": "{redelivery}", "previous": "16", "emphasis": "primary" },
    { "name": "戻った", "value": "{returned}", "previous": "1" }
  ],
  "flow": [],
  "states": { "first_try": 83, "redelivery": 16, "returned": 1 },
  "animation": [
    {
      "step": "9月",
      "duration": 1.2,
      "draw": "stacked",
      "description": "6 月 79/19/2、7 月 81/17/2、8 月 77/21/2 を経て、9 月は 83/16/1。"
    },
    {
      "step": "10月",
      "duration": 1.2,
      "description": "10 月は一度で届いた 86%、再配達 13%、戻った 1%。 上が 9 月、下が 10 月。",
      "tween": { "first_try": [83, 86], "redelivery": [16, 13], "returned": [1, 1] }
    }
  ]
}`;

export const deliveryResultStacked = textDslToDiagram(sourceYaml__deliveryResultStacked);

// ------------------------------------------------------------
// 14b. 今の内訳だけを 1 本の帯で示す (`パターン` の切替で選ぶ、 #1698)
//
// **`previous` を書かない図は帯が 1 本のまま** (`cdl#551`)。 時点を比べず、
// 今の内訳だけを見せる図になる。 上の節が言う「1 本のまま使える」 形がこれ。
// ------------------------------------------------------------
export const patternBase__deliveryResultStacked = "前と今";

export const sourceYaml__pattern__deliveryResultStacked__今だけ = `title: "10月の配達の結果"
figureSize: {"width":544,"height":496}
type: chart
shape: stacked
chartSeriesSkipMuted: true

actors:
  - 一度で届いた: { value: "{first_try}", tone: muted }
  - 再配達: { value: "{redelivery}", emphasis: primary }
  - 戻った: "{returned}"

states:
  first_try: 83
  redelivery: 16
  returned: 1

animation:
  - step: "9月" 1.2s
    draw: stacked
    description: "9 月の配達の結果を 1 本の帯で示す。"
  - step: "10月" 1.2s
    tween:
      first_try: 83 -> 86
      redelivery: 16 -> 13
      returned: 1 -> 1
    description: "10 月は再配達が 13% に下がる。"
`;

export const sourceJson__pattern__deliveryResultStacked__今だけ = `{
  "title": "10月の配達の結果",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "stacked",
  "chartSeriesSkipMuted": true,
  "actors": [
    { "name": "一度で届いた", "value": "{first_try}", "tone": "muted" },
    { "name": "再配達", "value": "{redelivery}", "emphasis": "primary" },
    { "name": "戻った", "value": "{returned}" }
  ],
  "flow": [],
  "states": { "first_try": 83, "redelivery": 16, "returned": 1 },
  "animation": [
    {
      "step": "9月",
      "duration": 1.2,
      "draw": "stacked",
      "description": "9 月の配達の結果を 1 本の帯で示す。"
    },
    {
      "step": "10月",
      "duration": 1.2,
      "description": "10 月は再配達が 13% に下がる。",
      "tween": { "first_try": [83, 86], "redelivery": [16, 13], "returned": [1, 1] }
    }
  ]
}`;

export const pattern__deliveryResultStacked__今だけ = textDslToDiagram(
  sourceYaml__pattern__deliveryResultStacked__今だけ,
);

// ------------------------------------------------------------
// 15. 2 時点を線で結んで増減を見る
// ------------------------------------------------------------
export const sourceYaml__onTimeRateSlope = `title: "営業所ごとの定時率"
figureSize: {"width":544,"height":496}
type: chart
shape: slope
figureCard: {"label":"傾き","note":"先月 → 今月"}
chartSlopePeriods: ["先月", "今月"]
chartSlopeEmphasisIds: ["大阪", "名古屋"]
chartSlopeUnit: "%"

actors:
  - 名古屋: { value: "{nagoya}", previous: "79", tone: accent }
  - 東京: { value: "{tokyo}", previous: "84" }
  - 大阪: { value: "{osaka}", previous: "86", tone: error }
  - 福岡: { value: "{fukuoka}", previous: "82" }

states:
  tokyo: 86
  osaka: 84
  nagoya: 82
  fukuoka: 82

animation:
  - step: "先月" 1.2s
    draw: slope
    description: "左が先月、右が今月途中の営業所ごとの定時率。"
  - step: "今月" 1.2s
    tween:
      tokyo: 86 -> 88
      osaka: 84 -> 80
      nagoya: 82 -> 85
      fukuoka: 82 -> 83
    description: "大阪は 86% から 80% へ下がり、名古屋は 79% から 85% へ上がる。"
`;

export const sourceJson__onTimeRateSlope = `{
  "title": "営業所ごとの定時率",
  "figureSize": { "width": 544, "height": 496 },
  "type": "chart",
  "shape": "slope",
  "figureCard": { "label": "傾き", "note": "先月 → 今月" },
  "chartSlopePeriods": ["先月", "今月"],
  "chartSlopeEmphasisIds": ["大阪", "名古屋"],
  "chartSlopeUnit": "%",
  "actors": [
    { "name": "名古屋", "value": "{nagoya}", "previous": "79", "tone": "accent" },
    { "name": "東京", "value": "{tokyo}", "previous": "84" },
    { "name": "大阪", "value": "{osaka}", "previous": "86", "tone": "error" },
    { "name": "福岡", "value": "{fukuoka}", "previous": "82" }
  ],
  "flow": [],
  "states": { "tokyo": 86, "osaka": 84, "nagoya": 82, "fukuoka": 82 },
  "animation": [
    {
      "step": "先月",
      "duration": 1.2,
      "draw": "slope",
      "description": "左が先月、右が今月途中の営業所ごとの定時率。"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "description": "大阪は 86% から 80% へ下がり、名古屋は 79% から 85% へ上がる。",
      "tween": { "tokyo": [86, 88], "osaka": [84, 80], "nagoya": [82, 85], "fukuoka": [82, 83] }
    }
  ]
}`;

export const onTimeRateSlope = textDslToDiagram(sourceYaml__onTimeRateSlope);
