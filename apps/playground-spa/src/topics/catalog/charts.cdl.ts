import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Charts ... 図表 9 種の見本 (#1152 / #1159)。
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
 * ## 組立て API 版から情報が落ちている
 *
 * 記法に書ける項目が少ないため、 **9 種すべてで何かが落ちている**。 記法の穴がそのまま出た形で、
 * 組立て API に戻すと「エディタで開けない」 に逆戻りするので、 穴として残す。
 *
 * | 見本 | 落ちたもの |
 * |---|---|
 * | `quadrant` | **軸の名前と区画の名前**。 「手間 × 効き」 「すぐやる / やらない」 が「小さい / 大きい」 「左上 / 右下」 になり、 何を判断する図か読めない |
 * | `mind` | **穴は塞がった** (`#1177` / `#1251`)。 記法の `mind` も `mind-map` 種別を作り、 枝の親も矢印で書ける |
 * | `gantt` | 期間。 開始しか書けず各工程が 1 コマ幅になる |
 * | `tree` | 段の深さ。 7 要素 → 5 要素 (孫を書く形が無い) |
 * | `journey` | 接点と改善の余地 (`touchpoint` / `opportunity`) |
 * | `funnel` | 各段の率 (`subtitle`) |
 * | `bar` / `pie` / `line` | 色 (`tone`) |
 *
 * 一番重いのは `quadrant`。 軸の名前が書けないと図の意味そのものが消える。
 *
 * 記法側を直す話で、 `cardene777/dragon#1160` で扱う。
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

// ============================================================
// 10. 合計を半円で示す
//
// **段の `draw` を書かない**。 描画側は半円と弧に「起点から描く」 動きを持たないため
// (`cdl#549` / `cdl#550` で対象外にした)、書いても効かない。
// 書いたのに効かない項目を見本に残さない。
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
    description: "合計 1,100 のうち契約済が 680"
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
    { "step": "期の初め", "duration": 1.2, "body": "合計 1,100 のうち契約済が 680" },
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

// ============================================================
// 11. 弧の長さで比べる
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
    description: "検索が 72 で最も高い"
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
    { "step": "先月", "duration": 1.2, "body": "検索が 72 で最も高い" },
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

// ============================================================
// 12. 値 1 つを大きく示す
//
// **前の時点の値を書くと差が出る** (`previous`)。 書かない図は数字だけになる。
// 段の `draw` は書かない = 描画側が「起点から描く」 動きを持たない。
// ============================================================
export const sourceYaml__chartStat = `title: "今月の解約率"
type: stat

actors:
  - 解約率: { value: "{now}", previous: "38" }

states:
  now: 24

animation:
  - step: "先月" 1.2s
    description: "先月は 38 件だった"
  - step: "今月" 1.2s
    tween:
      now: 24 -> 19
    description: "施策の後に 19 件まで下がる"
`;

export const sourceJson__chartStat = `{
  "title": "今月の解約率",
  "type": "stat",
  "actors": [
    { "name": "解約率", "value": "{now}", "previous": "38" }
  ],
  "flow": [],
  "states": { "now": 24 },
  "animation": [
    { "step": "先月", "duration": 1.2, "body": "先月は 38 件だった" },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "施策の後に 19 件まで下がる",
      "tween": { "now": [24, 19] }
    }
  ]
}`;

export const chartStat = textDslToDiagram(sourceYaml__chartStat);

// ============================================================
// 13. 割合を 100 個の印で示す
//
// **合計を 100 に揃える**。 揃えないと印の数が実際の割合と食い違う。
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
    description: "100 件のうち 62 件が対応済"
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
    { "step": "朝", "duration": 1.2, "body": "100 件のうち 62 件が対応済" },
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
    description: "上が前期、下が今期。 新規が伸び継続が減った"
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
    { "step": "前期との比較", "duration": 1.2, "body": "上が前期、下が今期。 新規が伸び継続が減った" },
    {
      "step": "見込みを足す",
      "duration": 1.2,
      "body": "見込みを足すと新規と乗換が伸びる",
      "tween": { "shinki": [320, 380], "norikae": [140, 200] }
    }
  ]
}`;

export const chartStackedBar = textDslToDiagram(sourceYaml__chartStackedBar);

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
