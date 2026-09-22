/**
 * Editor SAMPLES の SSOT (CAR-1659)。
 *
 * 件数はここにも検査の題にも数字で書かない。 見本を足すたびにずれるため (#2060)。
 * 件数を数字と比べる宣言は `packages/dragon/test/samples-validate.test.ts` の 1 か所だけが持つ。
 *
 * CdlEditor.tsx (sidebar SAMPLES tab) と packages/dragon/test/samples-validate.test.ts の
 * 双方から import される shared source of truth。 2 か所が別々に配列を持つと、片方だけ直して
 * 食い違うため、見本の実体はここ 1 か所に集約している。
 *
 * slug は PRESETS.slug 命名規約 (`lib/presets.ts` SSOT) と揃える、 hash preset 経路
 * (#preset=<slug>) で editor が対応 sample を find する。
 */
export interface EditorSample {
  /**
   * 日本語の名前。 **見本を指す identity も兼ねる** = 選んでいる見本の判定と、
   * 群 (`(sequence)` の中身) の導出と、検索の突き合わせがこの値を見る。
   * 画面に出す字は言語で選ぶので、identity として使う所では `label` のまま扱う。
   */
  label: string;
  /**
   * 英語の名前 (#2454)。 画面の言語が英語の時に出す。
   * 群を導けるように、`label` と同じく `(<図の型>)` を末尾に付ける。
   */
  labelEn: string;
  slug: string;
  code: string;
}

/** 一覧と書類名に出す名前。 identity は `label` のまま、出す字だけを言語で選ぶ (#2454) */
export function sampleLabel(sample: EditorSample, locale: "ja" | "en"): string {
  return locale === "ja" ? sample.label : sample.labelEn;
}

// **必ず 1 件以上持つ**。 編集画面は先頭を初期値に使うため、空にすると本文も名前も
// `undefined` になる。 型で表しておくと空にした時点で落ちる
export const EDITOR_SAMPLES: [EditorSample, ...EditorSample[]] = [
  {
    label: "ログインAPI呼び出し (sequence)",
    labelEn: "Login API call (sequence)",
    slug: "sequence",
    code: `title: "ログインAPI呼び出し"
type: sequence

actors:
  - 利用者
  - API
  - DB

flow:
  - 利用者 -> API: "ログイン要求"
  - API -> DB: "利用者検索"
  - DB -> API: "結果"
  - API -> 利用者: "認証成功" { kind: return }

animation:
  - step: "call" 1.4s
    focus: [利用者, API, "利用者 -> API"]
  - step: "query" 1.4s
    focus: [API, DB, "API -> DB"]
  - step: "return" 1.4s
    focus: [API, DB, "DB -> API"]
  - step: "ok" 1.4s
    focus: [利用者, API, "API -> 利用者"]
`,
  },
  {
    label: "注文チェックアウト (sequence)",
    labelEn: "Order checkout (sequence)",
    slug: "sequence-checkout",
    code: `title: "注文チェックアウト"
type: sequence

actors:
  - 利用者
  - 買い物かご
  - 支払い

flow:
  - 利用者 -> 買い物かご: "商品追加"
  - 買い物かご -> 支払い: "課金"
  - 支払い -> 利用者: "領収書" { kind: return }

animation:
  - step: "add" 1.2s
    focus: [利用者, 買い物かご, "利用者 -> 買い物かご"]
  - step: "charge" 1.5s
    focus: [買い物かご, 支払い, "買い物かご -> 支払い"]
  - step: "receipt" 1.2s
    focus: [利用者, 支払い, "支払い -> 利用者"]
`,
  },
  {
    label: "CIパイプライン (flow)",
    labelEn: "CI pipeline (flow)",
    slug: "flow",
    code: `title: "CIパイプライン"
type: flow

actors:
  - プッシュ: event
  - ビルド: function
  - テスト: function
  - デプロイ: function

flow:
  - プッシュ -> ビルド: "トリガー"
  - ビルド -> テスト: "成果物"
  - テスト -> デプロイ: "合格" (success)

animation:
  - step: "trigger" 1.2s
    focus: [プッシュ, ビルド, "プッシュ -> ビルド"]
  - step: "build" 1.5s
    focus: [ビルド, テスト, "ビルド -> テスト"]
  - step: "test" 1.5s
    focus: [テスト, デプロイ, "テスト -> デプロイ"]
  - step: "deploy" 1.2s
    focus: [デプロイ]
`,
  },
  {
    label: "利用者登録 (swimlane)",
    labelEn: "User sign-up (swimlane)",
    slug: "swimlane",
    code: `title: "利用者登録"
type: swimlane

actors:
  - 利用者
  - 認証: service
  - メール: service

flow:
  - 利用者 -> 認証: "登録要求"
  - 認証 -> メール: "歓迎メール送信"
  - メール -> 利用者: "メール到着"

animation:
  - step: "register" 1.4s
    focus: [利用者, 認証, "利用者 -> 認証"]
  - step: "notify" 1.4s
    focus: [認証, メール, "認証 -> メール"]
  - step: "deliver" 1.4s
    focus: [メール, 利用者, "メール -> 利用者"]
`,
  },
  {
    label: "システム構成 (topology)",
    labelEn: "System layout (topology)",
    slug: "topology",
    code: `title: "システム構成"
type: topology

actors:
  - 負荷分散: cloud "ロードバランサー"
  - Web: service "APIサーバー"
  - キャッシュ: cache "Redis"
  - DB: database "Postgres"

flow:
  - 負荷分散 -> Web: "振り分け"
  - Web -> キャッシュ: "参照"
  - Web -> DB: "問い合わせ"

animation:
  - step: "ingress" 1.2s
    focus: [負荷分散, Web, "負荷分散 -> Web"]
  - step: "cache" 1.2s
    focus: [Web, キャッシュ, "Web -> キャッシュ"]
  - step: "fallback" 1.5s
    focus: [Web, DB, "Web -> DB"]
`,
  },
  {
    label: "利用者・投稿・コメントのスキーマ (er)",
    labelEn: "Users, posts and comments (er)",
    slug: "er",
    code: `title: "利用者・投稿・コメントのスキーマ"
type: er

actors:
  - 利用者: storage ["id: PK", "email: string", "name: string"]
  - 投稿: storage ["id: PK", "userId: FK", "title: string", "body: text"]
  - コメント: storage ["id: PK", "postId: FK", "body: text"]

flow:
  - 利用者 -> 投稿: "投稿する" { cardinality: "1:N" }
  - 投稿 -> コメント: "コメント持つ" { cardinality: "1:N" }

animation:
  - step: "reveal" 2.0s
    focus: [利用者, 投稿, コメント, "利用者 -> 投稿", "投稿 -> コメント"]
`,
  },
  {
    label: "認証状態遷移 (state)",
    labelEn: "Sign-in state changes (state)",
    slug: "state-machine",
    code: `title: "認証状態遷移"
type: state

viewport: { height: 420 }

actors:
  - 待機: card
  - 検証中: card
  - 完了: card

flow:
  - 待機 -> 検証中: "送信"
  - 検証中 -> 完了: "認証成功" (success)
  - 検証中 -> 待機: "認証失敗・再試行"

animation:
  - step: "idle" 1.0s
    focus: [待機]
  - step: "submit" 1.2s
    focus: [検証中, "待機 -> 検証中"]
  - step: "success" 1.0s
    focus: [完了, "検証中 -> 完了"]
  - step: "fail" 1.0s
    focus: [待機, "検証中 -> 待機"]
`,
  },
  {
    label: "動物クラス階層 (class)",
    labelEn: "Animal class hierarchy (class)",
    slug: "class",
    code: `title: "動物クラス階層"
type: class

actors:
  - 動物: ["+name: string", "+age: int", "+speak(): void"]
  - 犬: ["+breed: string", "+bark(): void"]
  - 猫: ["+indoor: boolean", "+meow(): void"]

flow:
  - 犬 -> 動物: "extends"
  - 猫 -> 動物: "extends"

animation:
  - step: "reveal" 2.0s
    focus: [動物, 犬, 猫, "犬 -> 動物", "猫 -> 動物"]
`,
  },
  {
    label: "四半期ロードマップ (gantt)",
    labelEn: "Quarterly roadmap (gantt)",
    slug: "gantt",
    code: `title: "四半期ロードマップ"
type: gantt

actors:
  - 設計: "1期"
  - 実装: "2期"
  - テスト: "3期"
  - リリース: "4期"

animation:
  - step: "reveal" 2.0s
    focus: [設計, 実装, テスト, リリース]
`,
  },
  {
    label: "プロジェクト構想 (mind)",
    labelEn: "Project outline (mind)",
    slug: "mind",
    code: `title: "プロジェクト構想"
type: mind

actors:
  - 新プロジェクト
  - 機能
  - デザイン
  - リリース
  - マーケット

animation:
  - step: "reveal" 2.0s
    focus: [新プロジェクト, 機能, デザイン, リリース, マーケット]
`,
  },
  {
    label: "言語シェア (pie)",
    labelEn: "Language share (pie)",
    slug: "pie",
    code: `title: "言語シェア"
type: pie

actors:
  - TypeScript: "45%"
  - Python: "30%"
  - Rust: "15%"
  - Go: "10%"

animation:
  - step: "reveal" 2.0s
    focus: [TypeScript, Python, Rust, Go]
`,
  },
  {
    label: "経路別の流入 (bar)",
    labelEn: "Traffic by channel (bar)",
    slug: "bar",
    code: `title: "経路別の流入"
type: bar

actors:
  - 検索: "420"
  - SNS: "310"
  - 直接: "180"
  - 紹介: "90"

animation:
  - step: "reveal" 2.0s
    focus: [検索, SNS, 直接, 紹介]
`,
  },
  {
    label: "今期の売上進捗 (gauge)",
    labelEn: "Sales progress this term (gauge)",
    slug: "gauge",
    code: `title: "今期の売上進捗"
type: gauge

actors:
  - 契約済: "680"
  - 商談中: "240"
  - 未着手: "180"

animation:
  - step: "reveal" 2.0s
    focus: [契約済, 商談中, 未着手]
`,
  },
  {
    label: "機能ごとの利用率 (radial)",
    labelEn: "Usage by feature (radial)",
    slug: "radial",
    code: `title: "機能ごとの利用率"
type: radial

actors:
  - 検索: "72"
  - 保存: "45"
  - 共有: "28"
  - 書き出し: "12"

animation:
  - step: "reveal" 2.0s
    focus: [検索, 保存, 共有, 書き出し]
`,
  },
  {
    label: "今月の解約率 (stat)",
    labelEn: "Churn this month (stat)",
    slug: "stat",
    code: `title: "今月の解約率"
type: stat

actors:
  - 解約率: { value: "24", previous: "38" }

animation:
  - step: "reveal" 2.0s
    focus: [解約率]
`,
  },
  {
    label: "対応済みの問い合わせ (waffle)",
    labelEn: "Tickets handled (waffle)",
    slug: "waffle",
    code: `title: "対応済みの問い合わせ"
type: waffle

actors:
  - 対応済: "62"
  - 対応中: "23"
  - 未着手: "15"

animation:
  - step: "reveal" 2.0s
    focus: [対応済, 対応中, 未着手]
`,
  },
  {
    label: "契約の内訳 (stacked)",
    labelEn: "Contract breakdown (stacked)",
    slug: "stacked",
    code: `title: "契約の内訳"
type: stacked

actors:
  - 新規: { value: "320", previous: "280" }
  - 継続: { value: "180", previous: "210" }
  - 乗換: { value: "140", previous: "90" }

animation:
  - step: "reveal" 2.0s
    focus: [新規, 継続, 乗換]
`,
  },
  {
    label: "経路別の申込み (slope)",
    labelEn: "Sign-ups by channel (slope)",
    slug: "slope",
    code: `title: "経路別の申込み"
type: slope

actors:
  - 検索: { value: "420", previous: "380" }
  - SNS: { value: "310", previous: "190" }
  - メール: { value: "180", previous: "240" }

animation:
  - step: "reveal" 2.0s
    focus: [検索, SNS, メール]
`,
  },
  {
    label: "週ごとの応答時間 (line)",
    labelEn: "Response time by week (line)",
    slug: "line",
    code: `title: "週ごとの応答時間"
type: line

actors:
  - 1週: "180"
  - 2週: "240"
  - 3週: "210"
  - 4週: "120"
  - 5週: "95"

animation:
  - step: "reveal" 2.0s
    focus: [1週, 2週, 3週, 4週, 5週]
`,
  },
  {
    label: "投票コントラクト (solidity)",
    labelEn: "Voting contract (solidity)",
    slug: "solidity",
    code: `title: "投票コントラクト"
type: solidity

actors:
  - 有権者: actor
  - 投票箱: contract
  - 集計: function

flow:
  - 有権者 -> 投票箱: "vote(id)"
  - 投票箱 -> 集計: "tally()"
  - 集計 -> 有権者: "結果"

animation:
  - step: "投票" 1.5s
    focus: [有権者, 投票箱]
  - step: "集計" 1.5s
    focus: [投票箱, 集計]
  - step: "結果" 1.2s
    focus: ["集計 -> 有権者"]
`,
  },
  {
    label: "申込みまでの絞り込み (funnel)",
    labelEn: "Funnel to sign-up (funnel)",
    slug: "funnel",
    code: `title: "申込みまでの絞り込み"
type: funnel

actors:
  - 訪問: "12000"
  - 会員登録: "3400"
  - カート投入: "1200"
  - 申込み: "480"
`,
  },
  {
    label: "配布物の構成 (tree)",
    labelEn: "What ships (tree)",
    slug: "tree",
    code: `title: "配布物の構成"
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
`,
  },
  {
    label: "初めて使うまで (journey)",
    labelEn: "First run (journey)",
    slug: "journey",
    code: `title: "初めて使うまで"
type: journey

actors:
  - 記事で知る: "普通"
  - 登録画面: "不満"
  - メール確認: "怒り"
  - 初期設定: "普通"
  - 見本を開く: "満足"
  - 初めて描けた: "最高"
  - 共有する: "満足"
`,
  },
  {
    label: "着手の順番 (quadrant)",
    labelEn: "What to tackle first (quadrant)",
    slug: "quadrant",
    code: `title: "着手の順番"
type: quadrant

actors:
  - 重複削除: "左上"
  - 警告の文面: "左上"
  - 描画刷新: "右上"
  - 記法の拡張: "右上"
  - 配色統一: "左下"
  - 用語の統一: "左下"
  - 旧記法: "右下"
  - 実験機能: "右下"
`,
  },
  {
    label: "C4コンテキストモデル (c4)",
    labelEn: "C4 context model (c4)",
    slug: "c4",
    code: `title: "C4コンテキストモデル"
type: c4

actors:
  - 利用者: person "L1 図を使う人"
  - システム: service "L1 対象のシステム全体"
  - API: service "L2 要求を受ける入口"
  - DB: database "L2 データを保つ"

flow:
  - 利用者 -> システム: "利用"
  - システム -> API: "要求"
  - API -> DB: "問い合わせ"

animation:
  - step: "use" 1.2s
    focus: [利用者, システム, "利用者 -> システム"]
  - step: "request" 1.2s
    focus: [システム, API, "システム -> API"]
  - step: "query" 1.2s
    focus: [API, DB, "API -> DB"]
`,
  },
];
