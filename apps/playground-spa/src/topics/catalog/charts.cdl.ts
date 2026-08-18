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
 * | `mind` | **穴は塞がった** (`#1177`)。 記法の `mind` も `mind-map` 種別を作る。 枝の親を書く形だけは記法に無い (`type: tree` が持つ) |
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
    description: "検索が 420 で最も多い"
  - step: "今月" 1.2s
    tween:
      search: 420 -> 680
      sns: 310 -> 420
      direct: 180 -> 150
      referral: 90 -> 240
    description: "紹介が 90 から 240 へ伸びる"
`;
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
    description: "計算が 45% で半分近くを占める"
  - step: "今年" 1.2s
    tween:
      compute: 45 -> 30
      storage: 25 -> 35
      network: 20 -> 25
      other: 10 -> 10
    description: "計算が下がり、保存が最大になる"
`;
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
    description: "訪問 12000 から申込み 480 まで絞られる"
  - step: "改善後" 1.2s
    tween:
      visit: 12000 -> 12000
      signup: 3400 -> 5200
      cart: 1200 -> 2400
      order: 480 -> 1100
    description: "入口は同じまま、途中の残り方が変わる"
`;
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
`;
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
    description: "登録でつまずき、設定でようやく持ち直す"
  - step: "改善後" 1.2s
    set:
      signup: "満足"
      setup: "最高"
    description: "登録の作りを直すと、その後の山も上がる"
`;
export const journeyMap = textDslToDiagram(sourceYaml__journeyMap);

// ============================================================
// 7. 枝分かれで広げる
// ============================================================
export const sourceYaml__mindMap = `title: "図を速くする"
type: mind

actors:
  - 図を速くする: "{total} ms 短縮"
  - 描く量を減らす: "{draw} ms"
  - 計算を減らす: "{calc} ms"
  - 見えない所を省く: "{skip} ms"
  - 結果を覚える: "{cache} ms"

states:
  total: 0
  draw: 0
  calc: 0
  skip: 0
  cache: 0

animation:
  - step: "手を付ける前" 1.2s
    description: "どの枝もまだ 0 ms"
  - step: "4 つを入れた後" 1.2s
    tween:
      draw: 0 -> 120
      calc: 0 -> 80
      skip: 0 -> 60
      cache: 0 -> 40
      total: 0 -> 300
    description: "枝ごとの短縮が積み上がって 300 ms になる"
`;
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
`;
export const treeHierarchy = textDslToDiagram(sourceYaml__treeHierarchy);
