/**
 * Editor SAMPLES 12 diagram の SSOT (CAR-1659)。
 *
 * CdlEditor.tsx (sidebar SAMPLES tab) と packages/dragon/test/samples-validate.test.ts の
 * 双方から import される shared source of truth。 codex-review MINOR 指摘 = hardcoded 配列の
 * drift risk を構造的に解消するため、 samples をここに集約。
 *
 * slug は PRESETS.slug 命名規約 (`lib/presets.ts` SSOT) と揃える、 hash preset 経路
 * (#preset=<slug>) で editor が対応 sample を find する。
 */
export interface EditorSample {
  label: string;
  slug: string;
  code: string;
}

export const EDITOR_SAMPLES: EditorSample[] = [
  {
    label: "ログインAPI呼び出し (sequence)",
    slug: "sequence",
    code: `title: "ログインAPI呼び出し"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "ログイン要求"
  - API -> DB: "Client検索"
  - DB -> API: "結果"
  - API -> Client: "認証成功" (success)

animation:
  - step: "call" 1.4s
    focus: [Client, API, "Client -> API"]
  - step: "query" 1.4s
    focus: [API, DB, "API -> DB"]
  - step: "return" 1.4s
    focus: [API, DB, "DB -> API"]
  - step: "ok" 1.4s
    focus: [Client, API, "API -> Client"]
`,
  },
  {
    label: "注文チェックアウト (sequence)",
    slug: "sequence-checkout",
    code: `title: "注文チェックアウト"
type: sequence

actors:
  - Client
  - Cart
  - Payment

flow:
  - Client -> Cart: "商品追加"
  - Cart -> Payment: "課金"
  - Payment -> Client: "領収書" (success)

animation:
  - step: "add" 1.2s
    focus: [Client, Cart, "Client -> Cart"]
  - step: "charge" 1.5s
    focus: [Cart, Payment, "Cart -> Payment"]
  - step: "receipt" 1.2s
    focus: [Client, Payment, "Payment -> Client"]
`,
  },
  {
    label: "CIパイプライン (flow)",
    slug: "flow",
    code: `title: "CIパイプライン"
type: flow

actors:
  - Push: event
  - ビルド: function
  - テスト: function
  - デプロイ: function

flow:
  - Push -> ビルド: "トリガー"
  - ビルド -> テスト: "成果物"
  - テスト -> デプロイ: "合格" (success)

animation:
  - step: "trigger" 1.2s
    focus: [Push, ビルド, "Push -> ビルド"]
  - step: "build" 1.5s
    focus: [ビルド, テスト, "ビルド -> テスト"]
  - step: "test" 1.5s
    focus: [テスト, デプロイ, "テスト -> デプロイ"]
  - step: "deploy" 1.2s
    focus: [デプロイ]
`,
  },
  {
    label: "Client登録 (swimlane)",
    slug: "swimlane",
    code: `title: "Client登録"
type: swimlane

actors:
  - Client
  - 認証: service
  - メール: service

flow:
  - Client -> 認証: "登録要求"
  - 認証 -> メール: "歓迎メール送信"
  - メール -> Client: "メール到着"

animation:
  - step: "register" 1.4s
    focus: [Client, 認証, "Client -> 認証"]
  - step: "notify" 1.4s
    focus: [認証, メール, "認証 -> メール"]
  - step: "deliver" 1.4s
    focus: [メール, Client, "メール -> Client"]
`,
  },
  {
    label: "システム構成 (topology)",
    slug: "topology",
    code: `title: "システム構成"
type: topology

actors:
  - LB: cloud "ロードバランサー"
  - Web: service "APIサーバー"
  - キャッシュ: cache "Redis"
  - DB: database "Postgres"

flow:
  - LB -> Web: "振り分け"
  - Web -> キャッシュ: "参照"
  - Web -> DB: "問い合わせ"

animation:
  - step: "ingress" 1.2s
    focus: [LB, Web, "LB -> Web"]
  - step: "cache" 1.2s
    focus: [Web, キャッシュ, "Web -> キャッシュ"]
  - step: "fallback" 1.5s
    focus: [Web, DB, "Web -> DB"]
`,
  },
  {
    label: "Client・投稿・コメントのスキーマ (er)",
    slug: "er",
    code: `title: "Client・投稿・コメントのスキーマ"
type: er

actors:
  - Client: storage ["id: PK", "email: string", "name: string"]
  - 投稿: storage ["id: PK", "userId: FK", "title: string", "body: text"]
  - コメント: storage ["id: PK", "postId: FK", "body: text"]

flow:
  - Client -> 投稿: "投稿する" { cardinality: "1:N" }
  - 投稿 -> コメント: "コメント持つ" { cardinality: "1:N" }

animation:
  - step: "reveal" 2.0s
    focus: [Client, 投稿, コメント, "Client -> 投稿", "投稿 -> コメント"]
`,
  },
  {
    label: "認証状態遷移 (state-machine)",
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
    slug: "class",
    code: `title: "動物クラス階層"
type: class

actors:
  - 動物: storage ["+name: string", "+age: int", "+speak(): void"]
  - 犬: storage ["+breed: string", "+bark(): void"]
  - 猫: storage ["+indoor: boolean", "+meow(): void"]

flow:
  - 犬 -> 動物: "extends"
  - 猫 -> 動物: "extends"

animation:
  - step: "reveal" 2.0s
    focus: [動物, 犬, 猫, "犬 -> 動物", "猫 -> 動物"]
`,
  },
  {
    label: "Q1-Q4ロードマップ (gantt)",
    slug: "gantt",
    code: `title: "Q1-Q4ロードマップ"
type: gantt

actors:
  - 設計: "Q1"
  - 実装: "Q2"
  - テスト: "Q3"
  - リリース: "Q4"

animation:
  - step: "Q1" 1.0s
    focus: [設計]
  - step: "Q2" 1.0s
    focus: [実装]
  - step: "Q3" 1.0s
    focus: [テスト]
  - step: "Q4" 1.0s
    focus: [リリース]
`,
  },
  {
    label: "プロジェクト構想 (mind)",
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
    label: "週ごとの応答時間 (line)",
    slug: "line",
    code: `title: "週ごとの応答時間"
type: line

actors:
  - W1: "180"
  - W2: "240"
  - W3: "210"
  - W4: "120"
  - W5: "95"

animation:
  - step: "reveal" 2.0s
    focus: [W1, W2, W3, W4, W5]
`,
  },
  {
    label: "投票コントラクト (solidity)",
    slug: "solidity",
    code: `title: "投票コントラクト"
type: solidity

actors:
  - 有権者: actor
  - Ballot: contract
  - 集計: function

flow:
  - 有権者 -> Ballot: "vote(id)"
  - Ballot -> 集計: "tally()"
  - 集計 -> 有権者: "結果"

animation:
  - step: "投票" 1.5s
    focus: [有権者, Ballot]
  - step: "集計" 1.5s
    focus: [Ballot, 集計]
`,
  },
  {
    label: "申込みまでの絞り込み (funnel)",
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
    label: "障害の切り分け (radial)",
    slug: "radial",
    code: `title: "障害の切り分け"
type: radial

actors:
  - 画面が出ない
  - 通信が届かない
  - 認証が通らない
  - 描画で落ちる
  - 設定が読めない
  - 依存が古い
  - 権限が足りない
  - 資源が尽きた
`,
  },
  {
    label: "初めて使うまで (journey)",
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
    slug: "c4",
    code: `title: "C4コンテキストモデル"
type: c4

actors:
  - Client: person "L1 図を使う人"
  - システム: service "L1 対象のシステム全体"
  - API: service "L2 要求を受ける入口"
  - DB: database "L2 データを保つ"

flow:
  - Client -> システム: "利用"
  - システム -> API: "要求"
  - API -> DB: "問い合わせ"

animation:
  - step: "use" 1.2s
    focus: [Client, システム, "Client -> システム"]
  - step: "request" 1.2s
    focus: [システム, API, "システム -> API"]
  - step: "query" 1.2s
    focus: [API, DB, "API -> DB"]
`,
  },
];
