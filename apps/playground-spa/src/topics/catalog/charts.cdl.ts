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
 * | `mind` | `mind-map` 種別。 記法の `mind` は card を並べる別実装 |
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
  - 検索: "420"
  - SNS: "310"
  - 直接: "180"
  - 紹介: "90"
`;
export const chartBar = textDslToDiagram(sourceYaml__chartBar);

// ============================================================
// 2. 線で追う
// ============================================================
export const sourceYaml__chartLine = `title: "週ごとの応答時間"
type: line

actors:
  - W1: "180"
  - W2: "240"
  - W3: "210"
  - W4: "120"
  - W5: "95"
`;
export const chartLine = textDslToDiagram(sourceYaml__chartLine);

// ============================================================
// 3. 割合を見る
// ============================================================
export const sourceYaml__chartPie = `title: "費用の内訳"
type: pie

actors:
  - 計算: "45"
  - 保存: "25"
  - 通信: "20"
  - その他: "10"
`;
export const chartPie = textDslToDiagram(sourceYaml__chartPie);

// ============================================================
// 4. 絞り込みで減る
// ============================================================
export const sourceYaml__funnelStages = `title: "申込みまでの絞り込み"
type: funnel

actors:
  - 訪問: "12000"
  - 会員登録: "3400"
  - カート投入: "1200"
  - 申込み: "480"
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
  - 登録: "不満"
  - 設定: "満足"
  - 初回の成功: "最高"
`;
export const journeyMap = textDslToDiagram(sourceYaml__journeyMap);

// ============================================================
// 7. 枝分かれで広げる
// ============================================================
export const sourceYaml__mindMap = `title: "図を速くする"
type: mind

actors:
  - 図を速くする
  - 描く量を減らす
  - 計算を減らす
  - 見えない所を省く
  - 結果を覚える
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
  - 配色統一: "左下"
  - 旧記法: "右下"
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
