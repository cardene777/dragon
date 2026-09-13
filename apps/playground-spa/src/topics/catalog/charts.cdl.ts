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
export const sourceYaml__chartBar = `title: "経路別の流入"
type: bar

actors:
  - 検索: "{search}"
  - SNS: "{sns}"
  - 直接: "{direct}"
  - 紹介: "{referral}"

states:
  search: 420
  sns: 310
  direct: 180
  referral: 90

animation:
  - step: "先月" 1.2s
    draw: bar
    description: "検索が 420 で最も多い"
  - step: "今月" 1.2s
    tween:
      search: 420 -> 680
      sns: 310 -> 420
      direct: 180 -> 150
      referral: 90 -> 240
    description: "紹介が 90 から 240 へ伸びる"
`;

export const sourceJson__chartBar = `{
  "title": "経路別の流入",
  "type": "bar",
  "actors": [
    { "name": "検索", "subtitle": "{search}" },
    { "name": "SNS", "subtitle": "{sns}" },
    { "name": "直接", "subtitle": "{direct}" },
    { "name": "紹介", "subtitle": "{referral}" }
  ],
  "flow": [],
  "states": { "search": 420, "sns": 310, "direct": 180, "referral": 90 },
  "animation": [
    { "step": "先月", "duration": 1.2, "draw": "bar", "body": "検索が 420 で最も多い" },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "紹介が 90 から 240 へ伸びる",
      "tween": {
        "search": [420, 680],
        "sns": [310, 420],
        "direct": [180, 150],
        "referral": [90, 240]
      }
    }
  ]
}`;

export const chartBar = textDslToDiagram(sourceYaml__chartBar);

// ------------------------------------------------------------
// 1b. 前の時点を破線で横切らせる (`パターン` の切替で選ぶ、 #1722)
//
// `previous` を書くと、棒 1 本ごとに前の時点の高さで破線が 1 本入る (`cdl#767`)。
// 書かない図では 1 本も入らないので、**同じ見本の切替で両側を見せる**。
//
// **縦軸は前の時点まで含めて決まる**。 検索は前 520 で今 420 と、前のほうが高い =
// 前だけが枠の外へ出ると「下がった」 が読めないので、天井を前と今の大きいほうで取る。
//
// 破線は棒より少し左右にはみ出す。 棒の縁と重なると、どちらが前の高さか読めなくなる。
// ------------------------------------------------------------
export const patternBase__chartBar = "今だけ";

export const sourceYaml__pattern__chartBar__前の値つき = `title: "先月と比べた経路別の流入"
type: bar

actors:
  - 検索: { value: "{search}", previous: "520" }
  - SNS: { value: "{sns}", previous: "260" }
  - 直接: { value: "{direct}", previous: "210" }
  - 紹介: { value: "{referral}", previous: "60" }

states:
  search: 420
  sns: 310
  direct: 180
  referral: 90

animation:
  - step: "今月" 1.2s
    draw: bar
    description: "破線が先月の高さ。 検索だけが 520 から 420 へ下がっている"
  - step: "来月の見込み" 1.2s
    tween:
      search: 420 -> 680
      referral: 90 -> 240
    description: "検索が破線を越えて戻る。 破線は先月のまま動かない"
`;

export const sourceJson__pattern__chartBar__前の値つき = `{
  "title": "先月と比べた経路別の流入",
  "type": "bar",
  "actors": [
    { "name": "検索", "value": "{search}", "previous": "520" },
    { "name": "SNS", "value": "{sns}", "previous": "260" },
    { "name": "直接", "value": "{direct}", "previous": "210" },
    { "name": "紹介", "value": "{referral}", "previous": "60" }
  ],
  "flow": [],
  "states": { "search": 420, "sns": 310, "direct": 180, "referral": 90 },
  "animation": [
    {
      "step": "今月",
      "duration": 1.2,
      "draw": "bar",
      "body": "破線が先月の高さ。 検索だけが 520 から 420 へ下がっている"
    },
    {
      "step": "来月の見込み",
      "duration": 1.2,
      "body": "検索が破線を越えて戻る。 破線は先月のまま動かない",
      "tween": { "search": [420, 680], "referral": [90, 240] }
    }
  ]
}`;

export const pattern__chartBar__前の値つき = textDslToDiagram(
  sourceYaml__pattern__chartBar__前の値つき,
);

// ============================================================
// 2. 線で追う
// ============================================================
export const sourceYaml__chartLine = `title: "週ごとの応答時間"
type: line

actors:
  - W1: "{w1}"
  - W2: "{w2}"
  - W3: "{w3}"
  - W4: "{w4}"
  - W5: "{w5}"

states:
  w1: 180
  w2: 240
  w3: 210
  w4: 120
  w5: 95

animation:
  - step: "改善前" 1.2s
    draw: line
    description: "2 週目に 240 ms まで伸びている"
  - step: "改善後" 1.2s
    tween:
      w1: 180 -> 140
      w2: 240 -> 160
      w3: 210 -> 130
      w4: 120 -> 90
      w5: 95 -> 70
    description: "全週が下がり、山も消える"
`;

export const sourceJson__chartLine = `{
  "title": "週ごとの応答時間",
  "type": "line",
  "actors": [
    { "name": "W1", "subtitle": "{w1}" },
    { "name": "W2", "subtitle": "{w2}" },
    { "name": "W3", "subtitle": "{w3}" },
    { "name": "W4", "subtitle": "{w4}" },
    { "name": "W5", "subtitle": "{w5}" }
  ],
  "flow": [],
  "states": { "w1": 180, "w2": 240, "w3": 210, "w4": 120, "w5": 95 },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "line", "body": "2 週目に 240 ms まで伸びている" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "全週が下がり、山も消える",
      "tween": {
        "w1": [180, 140],
        "w2": [240, 160],
        "w3": [210, 130],
        "w4": [120, 90],
        "w5": [95, 70]
      }
    }
  ]
}`;

export const chartLine = textDslToDiagram(sourceYaml__chartLine);

// ============================================================
// 3. 割合を見る
// ============================================================
export const sourceYaml__chartPie = `title: "費用の内訳"
type: pie

actors:
  - 計算: "{compute}"
  - 保存: "{storage}"
  - 通信: "{network}"
  - その他: "{other}"

states:
  compute: 45
  storage: 25
  network: 20
  other: 10

animation:
  - step: "昨年" 1.2s
    draw: pie
    description: "計算が 45% で半分近くを占める"
  - step: "今年" 1.2s
    tween:
      compute: 45 -> 30
      storage: 25 -> 35
      network: 20 -> 25
      other: 10 -> 10
    description: "計算が下がり、保存が最大になる"
`;

export const sourceJson__chartPie = `{
  "title": "費用の内訳",
  "type": "pie",
  "actors": [
    { "name": "計算", "subtitle": "{compute}" },
    { "name": "保存", "subtitle": "{storage}" },
    { "name": "通信", "subtitle": "{network}" },
    { "name": "その他", "subtitle": "{other}" }
  ],
  "flow": [],
  "states": { "compute": 45, "storage": 25, "network": 20, "other": 10 },
  "animation": [
    { "step": "昨年", "duration": 1.2, "draw": "pie", "body": "計算が 45% で半分近くを占める" },
    {
      "step": "今年",
      "duration": 1.2,
      "body": "計算が下がり、保存が最大になる",
      "tween": {
        "compute": [45, 30],
        "storage": [25, 35],
        "network": [20, 25],
        "other": [10, 10]
      }
    }
  ]
}`;

export const chartPie = textDslToDiagram(sourceYaml__chartPie);

// ------------------------------------------------------------
// 3b. 前の時点を内側の輪に重ねる (`パターン` の切替で選ぶ、 #1698)
//
// **`previous` を書くと輪が 2 つになる** (`cdl#679`)。 内が前、外が今で、
// 同じ色が内外で対応する。 書かない図は輪 1 つのまま。
//
// **効くのは `輪` の見せ方だけ**。 `積層の弧` と `銘板` は内側の輪を描かないので、
// この変種を選んだまま見せ方を変えると前の時点は消える。
// ------------------------------------------------------------
export const patternBase__chartPie = "今だけ";

export const sourceYaml__pattern__chartPie__前と今 = `title: "前期と比べた費用の内訳"
type: pie

actors:
  - 計算: { value: "{compute}", previous: "52" }
  - 保存: { value: "{storage}", previous: "18" }
  - 通信: { value: "{network}", previous: "22" }
  - その他: { value: "{other}", previous: "8" }

states:
  compute: 45
  storage: 25
  network: 20
  other: 10

animation:
  - step: "前期と今期" 1.2s
    draw: pie
    description: "内が前期、外が今期。 計算が 52% から 45% へ下がった"
  - step: "今期の見込み" 1.2s
    tween:
      compute: 45 -> 30
      storage: 25 -> 35
    description: "保存が伸びて最大になる。 内側の輪は前期のまま動かない"
`;

export const sourceJson__pattern__chartPie__前と今 = `{
  "title": "前期と比べた費用の内訳",
  "type": "pie",
  "actors": [
    { "name": "計算", "value": "{compute}", "previous": "52" },
    { "name": "保存", "value": "{storage}", "previous": "18" },
    { "name": "通信", "value": "{network}", "previous": "22" },
    { "name": "その他", "value": "{other}", "previous": "8" }
  ],
  "flow": [],
  "states": { "compute": 45, "storage": 25, "network": 20, "other": 10 },
  "animation": [
    {
      "step": "前期と今期",
      "duration": 1.2,
      "draw": "pie",
      "body": "内が前期、外が今期。 計算が 52% から 45% へ下がった"
    },
    {
      "step": "今期の見込み",
      "duration": 1.2,
      "body": "保存が伸びて最大になる。 内側の輪は前期のまま動かない",
      "tween": { "compute": [45, 30], "storage": [25, 35] }
    }
  ]
}`;

export const pattern__chartPie__前と今 = textDslToDiagram(sourceYaml__pattern__chartPie__前と今);

// ============================================================
// 4. 絞り込みで減る
// ============================================================
export const sourceYaml__funnelStages = `title: "申込みまでの絞り込み"
type: funnel

actors:
  - 訪問: "{visit}"
  - 会員登録: "{signup}"
  - カート投入: "{cart}"
  - 申込み: "{order}"

states:
  visit: 12000
  signup: 3400
  cart: 1200
  order: 480

animation:
  - step: "改善前" 1.2s
    draw: funnel
    description: "訪問 12000 から申込み 480 まで絞られる"
  - step: "改善後" 1.2s
    tween:
      visit: 12000 -> 12000
      signup: 3400 -> 5200
      cart: 1200 -> 2400
      order: 480 -> 1100
    description: "入口は同じまま、途中の残り方が変わる"
`;

export const sourceJson__funnelStages = `{
  "title": "申込みまでの絞り込み",
  "type": "funnel",
  "actors": [
    { "name": "訪問", "subtitle": "{visit}" },
    { "name": "会員登録", "subtitle": "{signup}" },
    { "name": "カート投入", "subtitle": "{cart}" },
    { "name": "申込み", "subtitle": "{order}" }
  ],
  "flow": [],
  "states": { "visit": 12000, "signup": 3400, "cart": 1200, "order": 480 },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "funnel", "body": "訪問 12000 から申込み 480 まで絞られる" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "入口は同じまま、途中の残り方が変わる",
      "tween": {
        "visit": [12000, 12000],
        "signup": [3400, 5200],
        "cart": [1200, 2400],
        "order": [480, 1100]
      }
    }
  ]
}`;

export const funnelStages = textDslToDiagram(sourceYaml__funnelStages);

// ============================================================
// 5. 期間で並べる
// ============================================================
export const sourceYaml__ganttTimeline = `title: "公開までの段取り"
type: gantt

actors:
  - 設計: "1月"
  - 実装: "2月"
  - 検証: "4月"
  - 公開: "5月"

flow:
  - 設計 -> 実装: ""
  - 実装 -> 検証: ""
  - 検証 -> 公開: ""

animation:
  - step: "段取りを引く" 1.2s
    draw: gantt
    description: "帯が各工程の始まりから右へ伸び、依存の矢印は出揃ってから出る"
`;

export const sourceJson__ganttTimeline = `{
  "title": "公開までの段取り",
  "type": "gantt",
  "actors": [
    { "name": "設計", "subtitle": "1月" },
    { "name": "実装", "subtitle": "2月" },
    { "name": "検証", "subtitle": "4月" },
    { "name": "公開", "subtitle": "5月" }
  ],
  "flow": [
    { "from": "設計", "to": "実装", "label": "" },
    { "from": "実装", "to": "検証", "label": "" },
    { "from": "検証", "to": "公開", "label": "" }
  ],
  "animation": [
    {
      "step": "段取りを引く",
      "duration": 1.2,
      "draw": "gantt",
      "body": "帯が各工程の始まりから右へ伸び、依存の矢印は出揃ってから出る"
    }
  ]
}`;

export const ganttTimeline = textDslToDiagram(sourceYaml__ganttTimeline);

/**
 * 前後の矢印を書かない形 (#1706)。
 *
 * `dependsOn` を書くと `gantt-arrow` が出る。 カタログの工程表は 3 件とも前後を書いており、
 * **矢印の無い段取りがどこにも出ていなかった**。 期日だけを並べる使い方はよくあるので、
 * 同じ見本の切替で見比べられるようにする。
 */
export const patternBase__ganttTimeline = "前後つき";

export const sourceYaml__pattern__ganttTimeline__帯だけ = `title: "四半期ごとの持ち場"
type: gantt

actors:
  - 調査: "1月"
  - 試作: "2月"
  - 検証: "4月"
  - 公開: "5月"

animation:
  - step: "帯を引く" 1.2s
    draw: gantt
    description: "前後の矢印は出ず、帯だけが始まりから右へ伸びる"
`;

export const sourceJson__pattern__ganttTimeline__帯だけ = `{
  "title": "四半期ごとの持ち場",
  "type": "gantt",
  "actors": [
    { "name": "調査", "subtitle": "1月" },
    { "name": "試作", "subtitle": "2月" },
    { "name": "検証", "subtitle": "4月" },
    { "name": "公開", "subtitle": "5月" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "帯を引く",
      "duration": 1.2,
      "draw": "gantt",
      "body": "前後の矢印は出ず、帯だけが始まりから右へ伸びる"
    }
  ]
}`;

export const pattern__ganttTimeline__帯だけ = textDslToDiagram(
  sourceYaml__pattern__ganttTimeline__帯だけ,
);

// ============================================================
// 6. 体験の起伏
// ============================================================
export const sourceYaml__journeyMap = `title: "初めて使うまで"
type: journey

actors:
  - 知る: "普通"
  - 登録: "{signup}"
  - 設定: "{setup}"
  - 初回の成功: "最高"

states:
  signup: "不満"
  setup: "満足"

animation:
  - step: "改善前" 1.2s
    draw: journey
    description: "登録でつまずき、設定でようやく持ち直す"
  - step: "改善後" 1.2s
    set:
      signup: "満足"
      setup: "最高"
    description: "登録の作りを直すと、その後の山も上がる"
`;

export const sourceJson__journeyMap = `{
  "title": "初めて使うまで",
  "type": "journey",
  "actors": [
    { "name": "知る", "subtitle": "普通" },
    { "name": "登録", "subtitle": "{signup}" },
    { "name": "設定", "subtitle": "{setup}" },
    { "name": "初回の成功", "subtitle": "最高" }
  ],
  "flow": [],
  "states": { "signup": "不満", "setup": "満足" },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "journey", "body": "登録でつまずき、設定でようやく持ち直す" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "登録の作りを直すと、その後の山も上がる",
      "set": { "signup": "満足", "setup": "最高" }
    }
  ]
}`;

export const journeyMap = textDslToDiagram(sourceYaml__journeyMap);

/**
 * 段ごとの接点を書く形 (#1706)。
 *
 * `touchpoint` を書くと `journey-chip` が出て、どこで起きた出来事かが図に載る。
 * カタログでは組立て API の見本 (`presets`) だけが書いており、記法の見本は書いていなかった。
 * **別の行に分かれていると見比べられない** ので、同じ見本の切替にする。
 */
export const patternBase__journeyMap = "気持ちだけ";

export const sourceYaml__pattern__journeyMap__接点つき = `title: "初めて使うまでの接点"
type: journey

actors:
  - 知る: { value: "普通", touchpoint: "紹介記事" }
  - 登録: { value: "{signup}", touchpoint: "申込みフォーム" }
  - 設定: { value: "{setup}", touchpoint: "設定画面" }
  - 初回の成功: { value: "最高", touchpoint: "作った図" }

states:
  signup: "不満"
  setup: "満足"

animation:
  - step: "改善前" 1.2s
    draw: journey
    description: "起伏の下に、その気持ちが起きた場所が並ぶ"
  - step: "改善後" 1.2s
    set:
      signup: "満足"
      setup: "最高"
    description: "接点はそのままで、山だけが上がる"
`;

export const sourceJson__pattern__journeyMap__接点つき = `{
  "title": "初めて使うまでの接点",
  "type": "journey",
  "actors": [
    { "name": "知る", "subtitle": "普通", "touchpoint": "紹介記事" },
    { "name": "登録", "subtitle": "{signup}", "touchpoint": "申込みフォーム" },
    { "name": "設定", "subtitle": "{setup}", "touchpoint": "設定画面" },
    { "name": "初回の成功", "subtitle": "最高", "touchpoint": "作った図" }
  ],
  "flow": [],
  "states": { "signup": "不満", "setup": "満足" },
  "animation": [
    {
      "step": "改善前",
      "duration": 1.2,
      "draw": "journey",
      "body": "起伏の下に、その気持ちが起きた場所が並ぶ"
    },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "接点はそのままで、山だけが上がる",
      "set": { "signup": "満足", "setup": "最高" }
    }
  ]
}`;

export const pattern__journeyMap__接点つき = textDslToDiagram(
  sourceYaml__pattern__journeyMap__接点つき,
);

// ============================================================
// 7. 枝分かれで広げる
// ============================================================
export const sourceYaml__mindMap = `title: "図を速くする"
type: mind

actors:
  - 図を速くする: "{total} ms 短縮"
  - 描く量を減らす: "{paint} ms"
  - 計算を減らす: "{calc} ms"
  - 見えない所を省く: "{skip} ms"
  - 結果を覚える: "{cache} ms"

states:
  total: 0
  paint: 0
  calc: 0
  skip: 0
  cache: 0

animation:
  - step: "手を付ける前" 1.2s
    draw: mind
    description: "どの枝もまだ 0 ms"
  - step: "4 つを入れた後" 1.2s
    tween:
      paint: 0 -> 120
      calc: 0 -> 80
      skip: 0 -> 60
      cache: 0 -> 40
      total: 0 -> 300
    description: "枝ごとの短縮が積み上がって 300 ms になる"
`;

export const sourceJson__mindMap = `{
  "title": "図を速くする",
  "type": "mind",
  "actors": [
    { "name": "図を速くする", "subtitle": "{total} ms 短縮" },
    { "name": "描く量を減らす", "subtitle": "{paint} ms" },
    { "name": "計算を減らす", "subtitle": "{calc} ms" },
    { "name": "見えない所を省く", "subtitle": "{skip} ms" },
    { "name": "結果を覚える", "subtitle": "{cache} ms" }
  ],
  "flow": [],
  "states": { "total": 0, "paint": 0, "calc": 0, "skip": 0, "cache": 0 },
  "animation": [
    { "step": "手を付ける前", "duration": 1.2, "draw": "mind", "body": "どの枝もまだ 0 ms" },
    {
      "step": "4 つを入れた後",
      "duration": 1.2,
      "body": "枝ごとの短縮が積み上がって 300 ms になる",
      "tween": {
        "paint": [0, 120],
        "calc": [0, 80],
        "skip": [0, 60],
        "cache": [0, 40],
        "total": [0, 300]
      }
    }
  ]
}`;

export const mindMap = textDslToDiagram(sourceYaml__mindMap);

/**
 * 根にも枝にも説明を書かない形 (#1706)。
 *
 * 説明 (`rootSubtitle` / 枝の `subtitle`) を書くと `mind-node-subtitle` が出る。
 * カタログの発想の枝は 3 件とも数字を添えており、**見出しだけで広げる形が出ていなかった**。
 * 考えを広げる段階では数字を持たないことのほうが多いので、切替で両方を見せる。
 */
export const patternBase__mindMap = "説明つき";

export const sourceYaml__pattern__mindMap__見出しだけ = `title: "速くする手立てを並べる"
type: mind

actors:
  - 速くする手立て
  - 描く量を減らす
  - 計算を減らす
  - 見えない所を省く
  - 結果を覚える

animation:
  - step: "枝を広げる" 1.2s
    draw: mind
    description: "根から 4 本の枝が伸びる。 数字は載せず、試すことだけを並べる"
`;

export const sourceJson__pattern__mindMap__見出しだけ = `{
  "title": "速くする手立てを並べる",
  "type": "mind",
  "actors": [
    { "name": "速くする手立て" },
    { "name": "描く量を減らす" },
    { "name": "計算を減らす" },
    { "name": "見えない所を省く" },
    { "name": "結果を覚える" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "枝を広げる",
      "duration": 1.2,
      "draw": "mind",
      "body": "根から 4 本の枝が伸びる。 数字は載せず、試すことだけを並べる"
    }
  ]
}`;

export const pattern__mindMap__見出しだけ = textDslToDiagram(
  sourceYaml__pattern__mindMap__見出しだけ,
);

// ============================================================
// 8. 2 軸で分ける
// ============================================================
export const sourceYaml__quadrantMatrix = `title: "着手の順番"
type: quadrant

actors:
  - 重複削除: "左上"
  - 描画刷新: "右上"
  - 配色統一: "{color}"
  - 旧記法: "{legacy}"

states:
  color: "左下"
  legacy: "右下"

animation:
  - step: "見直し前" 1.2s
    description: "配色統一と旧記法はどちらも後回しに置いてある"
  - step: "見直し後" 1.2s
    set:
      color: "左上"
      legacy: "右上"
    description: "効きを測り直すと、2 件とも上の段へ移る"
`;

export const sourceJson__quadrantMatrix = `{
  "title": "着手の順番",
  "type": "quadrant",
  "actors": [
    { "name": "重複削除", "subtitle": "左上" },
    { "name": "描画刷新", "subtitle": "右上" },
    { "name": "配色統一", "subtitle": "{color}" },
    { "name": "旧記法", "subtitle": "{legacy}" }
  ],
  "flow": [],
  "states": { "color": "左下", "legacy": "右下" },
  "animation": [
    { "step": "見直し前", "duration": 1.2, "body": "配色統一と旧記法はどちらも後回しに置いてある" },
    {
      "step": "見直し後",
      "duration": 1.2,
      "body": "効きを測り直すと、2 件とも上の段へ移る",
      "set": { "color": "左上", "legacy": "右上" }
    }
  ]
}`;

export const quadrantMatrix = textDslToDiagram(sourceYaml__quadrantMatrix);

// ============================================================
// 9. 親子で束ねる
// ============================================================
export const sourceYaml__treeHierarchy = `title: "配布物の構成"
type: tree

actors:
  - dragon
  - 記法
  - 描画
  - 読み取り
  - 配置

flow:
  - dragon -> 記法: ""
  - dragon -> 描画: ""
  - 記法 -> 読み取り: ""
  - 描画 -> 配置: ""

animation:
  - step: "構成を辿る" 1.2s
    draw: tree
    description: "枝が根から段ごとに伸び、箱は枝が届いてから出る"
`;

export const sourceJson__treeHierarchy = `{
  "title": "配布物の構成",
  "type": "tree",
  "actors": [
    { "name": "dragon" },
    { "name": "記法" },
    { "name": "描画" },
    { "name": "読み取り" },
    { "name": "配置" }
  ],
  "flow": [
    { "from": "dragon", "to": "記法", "label": "" },
    { "from": "dragon", "to": "描画", "label": "" },
    { "from": "記法", "to": "読み取り", "label": "" },
    { "from": "描画", "to": "配置", "label": "" }
  ],
  "animation": [
    {
      "step": "構成を辿る",
      "duration": 1.2,
      "draw": "tree",
      "body": "枝が根から段ごとに伸び、箱は枝が届いてから出る"
    }
  ]
}`;

export const treeHierarchy = textDslToDiagram(sourceYaml__treeHierarchy);

/**
 * 節に説明を添える形 (#1706)。
 *
 * `subtitle` を書くと `tree-node-subtitle` が出る。 カタログの系統樹は 2 件とも名前だけで、
 * **説明を添えた形がどこにも出ていなかった**。 構成を人に見せる時は名前だけでは伝わらない
 * ことが多いので、切替で両方を見せる。
 */
export const patternBase__treeHierarchy = "見出しだけ";

export const sourceYaml__pattern__treeHierarchy__説明つき = `title: "配布物の構成と役割"
type: tree

actors:
  - dragon: "配る単位"
  - 記法: "書く形"
  - 描画: "絵にする"
  - 読み取り: "文を読む"
  - 配置: "位置を決める"

flow:
  - dragon -> 記法: ""
  - dragon -> 描画: ""
  - 記法 -> 読み取り: ""
  - 描画 -> 配置: ""

animation:
  - step: "構成と役割を辿る" 1.2s
    draw: tree
    description: "枝が根から段ごとに伸び、箱には名前の下に役割が出る"
`;

export const sourceJson__pattern__treeHierarchy__説明つき = `{
  "title": "配布物の構成と役割",
  "type": "tree",
  "actors": [
    { "name": "dragon", "subtitle": "配る単位" },
    { "name": "記法", "subtitle": "書く形" },
    { "name": "描画", "subtitle": "絵にする" },
    { "name": "読み取り", "subtitle": "文を読む" },
    { "name": "配置", "subtitle": "位置を決める" }
  ],
  "flow": [
    { "from": "dragon", "to": "記法", "label": "" },
    { "from": "dragon", "to": "描画", "label": "" },
    { "from": "記法", "to": "読み取り", "label": "" },
    { "from": "描画", "to": "配置", "label": "" }
  ],
  "animation": [
    {
      "step": "構成と役割を辿る",
      "duration": 1.2,
      "draw": "tree",
      "body": "枝が根から段ごとに伸び、箱には名前の下に役割が出る"
    }
  ]
}`;

export const pattern__treeHierarchy__説明つき = textDslToDiagram(
  sourceYaml__pattern__treeHierarchy__説明つき,
);

// ============================================================
// 10. 合計を半円で示す
//
// **`draw: gauge` で 9 時から弧が伸びる** (`cdl#715`)。 伸びる向きは弧の向きそのもの。
// 合計の字と内訳の段は最初から出る = 合計はこの図の主役なので、左から半分ずつ現れると読めない。
// ============================================================
export const sourceYaml__chartGauge = `title: "今期の売上進捗"
type: gauge

actors:
  - 契約済: "{signed}"
  - 商談中: "{talking}"
  - 未着手: "{untouched}"

states:
  signed: 680
  talking: 240
  untouched: 180

animation:
  - step: "期の初め" 1.2s
    draw: gauge
    description: "弧が 9 時から伸びる。 合計 1,100 のうち契約済が 680"
  - step: "期の半ば" 1.2s
    tween:
      signed: 680 -> 820
      talking: 240 -> 160
      untouched: 180 -> 120
    description: "商談中と未着手が契約済へ移る"
`;

export const sourceJson__chartGauge = `{
  "title": "今期の売上進捗",
  "type": "gauge",
  "actors": [
    { "name": "契約済", "subtitle": "{signed}" },
    { "name": "商談中", "subtitle": "{talking}" },
    { "name": "未着手", "subtitle": "{untouched}" }
  ],
  "flow": [],
  "states": { "signed": 680, "talking": 240, "untouched": 180 },
  "animation": [
    {
      "step": "期の初め",
      "duration": 1.2,
      "draw": "gauge",
      "body": "弧が 9 時から伸びる。 合計 1,100 のうち契約済が 680"
    },
    {
      "step": "期の半ば",
      "duration": 1.2,
      "body": "商談中と未着手が契約済へ移る",
      "tween": {
        "signed": [680, 820],
        "talking": [240, 160],
        "untouched": [180, 120]
      }
    }
  ]
}`;

export const chartGauge = textDslToDiagram(sourceYaml__chartGauge);

// ------------------------------------------------------------
// 10b. 前の内訳を内側の輪に重ねる (`パターン` の切替で選ぶ、 #1722)
//
// `previous` を書くと、半円の内側に前の内訳の輪が 1 本入る (`cdl#767`)。
// 書かない図では入らないので、**同じ見本の切替で両側を見せる**。
//
// **今の弧は内側へ寄らずに細くなる**。 前の輪を足すために外側の帯を分け合う形で、
// 外周そのものは動かない = 切替を押しても図の大きさが変わらない。
//
// 前の輪は今の弧と同じ順で同じ色を使う。 順を変えると、内と外で同じ色が別の項目を指す。
// ------------------------------------------------------------
export const patternBase__chartGauge = "今だけ";

export const sourceYaml__pattern__chartGauge__前の値つき = `title: "前期と比べた売上進捗"
type: gauge

actors:
  - 契約済: { value: "{signed}", previous: "520" }
  - 商談中: { value: "{talking}", previous: "300" }
  - 未着手: { value: "{untouched}", previous: "280" }

states:
  signed: 680
  talking: 240
  untouched: 180

animation:
  - step: "期の初め" 1.2s
    draw: gauge
    description: "内が前期、外が今期。 契約済が 520 から 680 へ増えた"
  - step: "期の半ば" 1.2s
    tween:
      signed: 680 -> 820
      talking: 240 -> 160
      untouched: 180 -> 120
    description: "外の弧だけが動く。 内の輪は前期のまま動かない"
`;

export const sourceJson__pattern__chartGauge__前の値つき = `{
  "title": "前期と比べた売上進捗",
  "type": "gauge",
  "actors": [
    { "name": "契約済", "value": "{signed}", "previous": "520" },
    { "name": "商談中", "value": "{talking}", "previous": "300" },
    { "name": "未着手", "value": "{untouched}", "previous": "280" }
  ],
  "flow": [],
  "states": { "signed": 680, "talking": 240, "untouched": 180 },
  "animation": [
    {
      "step": "期の初め",
      "duration": 1.2,
      "draw": "gauge",
      "body": "内が前期、外が今期。 契約済が 520 から 680 へ増えた"
    },
    {
      "step": "期の半ば",
      "duration": 1.2,
      "body": "外の弧だけが動く。 内の輪は前期のまま動かない",
      "tween": {
        "signed": [680, 820],
        "talking": [240, 160],
        "untouched": [180, 120]
      }
    }
  ]
}`;

export const pattern__chartGauge__前の値つき = textDslToDiagram(
  sourceYaml__pattern__chartGauge__前の値つき,
);

// ============================================================
// 11. 弧の長さで比べる
//
// **`draw: radial` で各輪が 12 時から開く** (`cdl#715`)。 円グラフと起点を揃えている。
// 軌道 (全周の薄い輪) と一覧は最初から出る = 軌道は「あとどれだけで一周か」 を示す枠なので、
// 一緒に伸ばすと比べる相手が無いまま弧だけが伸びる。
// ============================================================
export const sourceYaml__chartRadial = `title: "機能ごとの利用率"
type: radial

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
    description: "各輪が 12 時から開く。 検索が 72 で最も高い"
  - step: "今月" 1.2s
    tween:
      search: 72 -> 78
      save: 45 -> 52
      share: 28 -> 41
      export: 12 -> 15
    description: "共有が 28 から 41 へ伸びる"
`;

export const sourceJson__chartRadial = `{
  "title": "機能ごとの利用率",
  "type": "radial",
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
      "body": "各輪が 12 時から開く。 検索が 72 で最も高い"
    },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "共有が 28 から 41 へ伸びる",
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
type: radial

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
    description: "印が先月の位置。 共有だけが 12 から 28 へ伸びた"
  - step: "来月の見込み" 1.2s
    tween:
      share: 28 -> 41
      export: 12 -> 15
    description: "共有がさらに伸びる。 印は先月のまま動かない"
`;

export const sourceJson__pattern__chartRadial__前の値つき = `{
  "title": "先月と比べた機能ごとの利用率",
  "type": "radial",
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
      "body": "印が先月の位置。 共有だけが 12 から 28 へ伸びた"
    },
    {
      "step": "来月の見込み",
      "duration": 1.2,
      "body": "共有がさらに伸びる。 印は先月のまま動かない",
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
export const sourceYaml__chartStat = `title: "今月の解約率"
type: stat

actors:
  - 解約率: "{now}"

states:
  now: 24

animation:
  - step: "先月" 1.2s
    description: "先月の解約は 24 件"
  - step: "今月" 1.2s
    tween:
      now: 24 -> 19
    description: "施策の後に 19 件まで下がる"
`;

export const sourceJson__chartStat = `{
  "title": "今月の解約率",
  "type": "stat",
  "actors": [
    { "name": "解約率", "value": "{now}" }
  ],
  "flow": [],
  "states": { "now": 24 },
  "animation": [
    { "step": "先月", "duration": 1.2, "body": "先月の解約は 24 件" },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "施策の後に 19 件まで下がる",
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
type: stat

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
    description: "対応済みが 128 件で全体の 66.7%"
  - step: "今週" 1.2s
    tween:
      done: 128 -> 152
      doing: 46 -> 31
      todo: 18 -> 9
    description: "未着手が 9 件まで減り、対応済みの取り分が伸びる"
`;

export const sourceJson__pattern__chartStat__複数 = `{
  "title": "問い合わせの内訳",
  "type": "stat",
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
      "body": "対応済みが 128 件で全体の 66.7%"
    },
    {
      "step": "今週",
      "duration": 1.2,
      "body": "未着手が 9 件まで減り、対応済みの取り分が伸びる",
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
export const sourceYaml__pattern__chartStat__前の値つき = `title: "前の月と比べた解約率"
type: stat

actors:
  - 解約率: { value: "{now}", previous: "38" }

states:
  now: 24

animation:
  - step: "先月" 1.2s
    description: "前の時点は 38 件。 いまは 24 件"
  - step: "今月" 1.2s
    tween:
      now: 24 -> 19
    description: "施策の後に 19 件まで下がる。 前の時点は 38 件のまま"
`;

export const sourceJson__pattern__chartStat__前の値つき = `{
  "title": "前の月と比べた解約率",
  "type": "stat",
  "actors": [
    { "name": "解約率", "value": "{now}", "previous": "38" }
  ],
  "flow": [],
  "states": { "now": 24 },
  "animation": [
    { "step": "先月", "duration": 1.2, "body": "前の時点は 38 件。 いまは 24 件" },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "施策の後に 19 件まで下がる。 前の時点は 38 件のまま",
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
export const sourceYaml__chartWaffle = `title: "対応済みの問い合わせ"
type: waffle

actors:
  - 対応済: "{done}"
  - 対応中: "{doing}"
  - 未着手: "{todo}"

states:
  done: 62
  doing: 23
  todo: 15

animation:
  - step: "朝" 1.2s
    draw: waffle
    description: "印が読む向きに埋まる。 100 件のうち 62 件が対応済"
  - step: "夕方" 1.2s
    tween:
      done: 62 -> 84
      doing: 23 -> 11
      todo: 15 -> 5
    description: "未着手が減り対応済が 84 件になる"
`;

export const sourceJson__chartWaffle = `{
  "title": "対応済みの問い合わせ",
  "type": "waffle",
  "actors": [
    { "name": "対応済", "subtitle": "{done}" },
    { "name": "対応中", "subtitle": "{doing}" },
    { "name": "未着手", "subtitle": "{todo}" }
  ],
  "flow": [],
  "states": { "done": 62, "doing": 23, "todo": 15 },
  "animation": [
    {
      "step": "朝",
      "duration": 1.2,
      "draw": "waffle",
      "body": "印が読む向きに埋まる。 100 件のうち 62 件が対応済"
    },
    {
      "step": "夕方",
      "duration": 1.2,
      "body": "未着手が減り対応済が 84 件になる",
      "tween": { "done": [62, 84], "doing": [23, 11], "todo": [15, 5] }
    }
  ]
}`;

export const chartWaffle = textDslToDiagram(sourceYaml__chartWaffle);

// ============================================================
// 14. 内訳と時点間の変化を帯で示す
//
// **`previous` を書くと帯が 2 本になる**。 書かない図は 1 本のままで、
// 内訳だけを示す図として使える。
//
// **`draw: stacked` で左から帯が伸びる** (`cdl#715`)。 帯が 2 本あっても同時に伸びる =
// 上下で同じ位置を見比べる図なので、片方だけ先に出ると比べる相手がいない時間ができる。
// ============================================================
export const sourceYaml__chartStackedBar = `title: "契約の内訳"
type: stacked

actors:
  - 新規: { value: "{shinki}", previous: "280" }
  - 継続: { value: "{keizoku}", previous: "210" }
  - 乗換: { value: "{norikae}", previous: "90" }

states:
  shinki: 320
  keizoku: 180
  norikae: 140

animation:
  - step: "前期との比較" 1.2s
    draw: stacked
    description: "帯が左から伸びる。 上が前期、下が今期。 新規が伸び継続が減った"
  - step: "見込みを足す" 1.2s
    tween:
      shinki: 320 -> 380
      norikae: 140 -> 200
    description: "見込みを足すと新規と乗換が伸びる"
`;

export const sourceJson__chartStackedBar = `{
  "title": "契約の内訳",
  "type": "stacked",
  "actors": [
    { "name": "新規", "value": "{shinki}", "previous": "280" },
    { "name": "継続", "value": "{keizoku}", "previous": "210" },
    { "name": "乗換", "value": "{norikae}", "previous": "90" }
  ],
  "flow": [],
  "states": { "shinki": 320, "keizoku": 180, "norikae": 140 },
  "animation": [
    {
      "step": "前期との比較",
      "duration": 1.2,
      "draw": "stacked",
      "body": "帯が左から伸びる。 上が前期、下が今期。 新規が伸び継続が減った"
    },
    {
      "step": "見込みを足す",
      "duration": 1.2,
      "body": "見込みを足すと新規と乗換が伸びる",
      "tween": { "shinki": [320, 380], "norikae": [140, 200] }
    }
  ]
}`;

export const chartStackedBar = textDslToDiagram(sourceYaml__chartStackedBar);

// ------------------------------------------------------------
// 14b. 今の内訳だけを 1 本の帯で示す (`パターン` の切替で選ぶ、 #1698)
//
// **`previous` を書かない図は帯が 1 本のまま** (`cdl#551`)。 時点を比べず、
// 今の内訳だけを見せる図になる。 上の節が言う「1 本のまま使える」 形がこれ。
// ------------------------------------------------------------
export const patternBase__chartStackedBar = "前と今";

export const sourceYaml__pattern__chartStackedBar__今だけ = `title: "今期の契約の内訳"
type: stacked

actors:
  - 新規: "{shinki}"
  - 継続: "{keizoku}"
  - 乗換: "{norikae}"

states:
  shinki: 320
  keizoku: 180
  norikae: 140

animation:
  - step: "今期の内訳" 1.2s
    draw: stacked
    description: "帯が左から伸びる。 新規が最も長い"
  - step: "見込みを足す" 1.2s
    tween:
      shinki: 320 -> 380
      norikae: 140 -> 200
    description: "見込みを足すと新規と乗換が伸びる"
`;

export const sourceJson__pattern__chartStackedBar__今だけ = `{
  "title": "今期の契約の内訳",
  "type": "stacked",
  "actors": [
    { "name": "新規", "value": "{shinki}" },
    { "name": "継続", "value": "{keizoku}" },
    { "name": "乗換", "value": "{norikae}" }
  ],
  "flow": [],
  "states": { "shinki": 320, "keizoku": 180, "norikae": 140 },
  "animation": [
    {
      "step": "今期の内訳",
      "duration": 1.2,
      "draw": "stacked",
      "body": "帯が左から伸びる。 新規が最も長い"
    },
    {
      "step": "見込みを足す",
      "duration": 1.2,
      "body": "見込みを足すと新規と乗換が伸びる",
      "tween": { "shinki": [320, 380], "norikae": [140, 200] }
    }
  ]
}`;

export const pattern__chartStackedBar__今だけ = textDslToDiagram(
  sourceYaml__pattern__chartStackedBar__今だけ,
);

// ------------------------------------------------------------
// 15. 2 時点を線で結んで増減を見る
// ------------------------------------------------------------
export const sourceYaml__chartSlope = `title: "経路別の申込み"
type: slope

actors:
  - 検索: { value: "{kensaku}", previous: "380" }
  - SNS: { value: "{sns}", previous: "190" }
  - メール: { value: "{mail}", previous: "240" }
  - 紹介: { value: "{shokai}", previous: "60" }

states:
  kensaku: 420
  sns: 310
  mail: 180
  shokai: 90

animation:
  - step: "前期と今期" 1.2s
    draw: slope
    description: "左が前期、右が今期。 SNS が伸びてメールを追い越した"
  - step: "見込みを足す" 1.2s
    tween:
      sns: 310 -> 400
      mail: 180 -> 150
    description: "見込みを足すと SNS が検索に迫る"
`;

export const sourceJson__chartSlope = `{
  "title": "経路別の申込み",
  "type": "slope",
  "actors": [
    { "name": "検索", "value": "{kensaku}", "previous": "380" },
    { "name": "SNS", "value": "{sns}", "previous": "190" },
    { "name": "メール", "value": "{mail}", "previous": "240" },
    { "name": "紹介", "value": "{shokai}", "previous": "60" }
  ],
  "flow": [],
  "states": { "kensaku": 420, "sns": 310, "mail": 180, "shokai": 90 },
  "animation": [
    {
      "step": "前期と今期",
      "duration": 1.2,
      "draw": "slope",
      "body": "左が前期、右が今期。 SNS が伸びてメールを追い越した"
    },
    {
      "step": "見込みを足す",
      "duration": 1.2,
      "body": "見込みを足すと SNS が検索に迫る",
      "tween": { "sns": [310, 400], "mail": [180, 150] }
    }
  ]
}`;

export const chartSlope = textDslToDiagram(sourceYaml__chartSlope);
