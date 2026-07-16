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
    code: `title: "ログインAPI"
type: sequence

actors:
  - ユーザー
  - API
  - データベース

flow:
  - ユーザー -> API: "ログイン要求"
  - API -> データベース: "ユーザー検索"
  - データベース -> API: "結果"
  - API -> ユーザー: "認証成功" (success)

animation:
  - step: "call" 1.4s
    focus: [ユーザー, API, "ユーザー -> API"]
  - step: "query" 1.4s
    focus: [API, データベース, "API -> データベース"]
  - step: "return" 1.4s
    focus: [API, データベース, "データベース -> API"]
  - step: "ok" 1.4s
    focus: [ユーザー, API, "API -> ユーザー"]
`,
  },
  {
    label: "注文チェックアウト (sequence)",
    slug: "sequence",
    code: `title: "注文チェックアウト"
type: sequence

actors:
  - ユーザー
  - カート
  - 決済

flow:
  - ユーザー -> カート: "商品追加"
  - カート -> 決済: "課金"
  - 決済 -> ユーザー: "領収書" (success)

animation:
  - step: "add" 1.2s
    focus: [ユーザー, カート, "ユーザー -> カート"]
  - step: "charge" 1.5s
    focus: [カート, 決済, "カート -> 決済"]
  - step: "receipt" 1.2s
    focus: [ユーザー, 決済, "決済 -> ユーザー"]
`,
  },
  {
    label: "CIパイプライン (flow)",
    slug: "flow",
    code: `title: "CIパイプライン"
type: flow

actors:
  - Push: { kind: event }
  - ビルド: { kind: function }
  - テスト: { kind: function }
  - デプロイ: { kind: function }

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
    label: "ユーザー登録 (swimlane)",
    slug: "swimlane",
    code: `title: "ユーザー登録"
type: swimlane

actors:
  - ユーザー
  - 認証: { kind: service }
  - データベース: { kind: database }
  - メール: { kind: service }

flow:
  - ユーザー -> 認証: "登録要求"
  - 認証 -> データベース: "ユーザー保存"
  - 認証 -> メール: "歓迎メール送信"
  - メール -> ユーザー: "メール到着"

animation:
  - step: "register" 1.4s
    focus: [ユーザー, 認証, "ユーザー -> 認証"]
  - step: "persist" 1.4s
    focus: [認証, データベース, "認証 -> データベース"]
  - step: "notify" 1.4s
    focus: [認証, メール, "認証 -> メール"]
  - step: "deliver" 1.4s
    focus: [メール, ユーザー, "メール -> ユーザー"]
`,
  },
  {
    label: "システム構成 (topology)",
    slug: "topology",
    code: `title: "システム構成"
type: topology

actors:
  - LB: { kind: cloud, subtitle: "ロードバランサー" }
  - Web: { kind: service, subtitle: "APIサーバー" }
  - キャッシュ: { kind: cache, subtitle: "Redis" }
  - データベース: { kind: database, subtitle: "Postgres" }

flow:
  - LB -> Web: "振り分け"
  - Web -> キャッシュ: "参照"
  - Web -> データベース: "問い合わせ"

animation:
  - step: "ingress" 1.2s
    focus: [LB, Web, "LB -> Web"]
  - step: "cache" 1.2s
    focus: [Web, キャッシュ, "Web -> キャッシュ"]
  - step: "fallback" 1.5s
    focus: [Web, データベース, "Web -> データベース"]
`,
  },
  {
    label: "ユーザーと投稿のスキーマ (er)",
    slug: "er",
    code: `title: "ユーザー投稿スキーマ"
type: er

actors:
  - ユーザー: { kind: storage, rows: ["id: PK", "email: string", "name: string"] }
  - 投稿: { kind: storage, rows: ["id: PK", "userId: FK", "title: string", "body: text"] }
  - コメント: { kind: storage, rows: ["id: PK", "postId: FK", "body: text"] }

flow:
  - ユーザー -> 投稿: "投稿する" { cardinality: "1:N" }
  - 投稿 -> コメント: "コメント持つ" { cardinality: "1:N" }

animation:
  - step: "reveal" 2.0s
    focus: [ユーザー, 投稿, コメント, "ユーザー -> 投稿", "投稿 -> コメント"]
`,
  },
  {
    label: "認証状態遷移 (state-machine)",
    slug: "state-machine",
    code: `title: "認証状態遷移"
type: state

viewport: { height: 420 }

actors:
  - 待機: { kind: card }
  - 検証中: { kind: card }
  - 完了: { kind: card }
  - 失敗: { kind: card }

flow:
  - 待機 -> 検証中: "送信"
  - 検証中 -> 完了: "認証成功" (success)
  - 検証中 -> 失敗: "認証失敗"
  - 失敗 -> 待機: "再試行"

animation:
  - step: "idle" 1.0s
    focus: [待機]
  - step: "submit" 1.2s
    focus: [検証中, "待機 -> 検証中"]
  - step: "success" 1.0s
    focus: [完了, "検証中 -> 完了"]
  - step: "fail" 1.0s
    focus: [失敗, "検証中 -> 失敗"]
`,
  },
  {
    label: "OOP クラス階層 (class)",
    slug: "class",
    code: `title: "動物クラス階層"
type: class

actors:
  - 動物: { kind: storage, rows: ["+name: string", "+age: int", "+speak(): void"] }
  - 犬: { kind: storage, rows: ["+breed: string", "+bark(): void"] }
  - 猫: { kind: storage, rows: ["+indoor: boolean", "+meow(): void"] }

flow:
  - 犬 -> 動物: "extends"
  - 猫 -> 動物: "extends"

animation:
  - step: "reveal" 2.0s
    focus: [動物, 犬, 猫, "犬 -> 動物", "猫 -> 動物"]
`,
  },
  {
    label: "スプリントロードマップ (gantt)",
    slug: "gantt",
    code: `title: "Q1-Q4ロードマップ"
type: gantt

actors:
  - 設計: { subtitle: "Q1" }
  - 実装: { subtitle: "Q2" }
  - テスト: { subtitle: "Q3" }
  - リリース: { subtitle: "Q4" }

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
  - root: { title: "新プロジェクト" }
  - features: { title: "機能" }
  - design: { title: "デザイン" }
  - launch: { title: "リリース" }
  - market: { title: "マーケット" }

animation:
  - step: "reveal" 2.0s
    focus: [root, features, design, launch, market]
`,
  },
  {
    label: "言語シェア (pie)",
    slug: "pie",
    code: `title: "言語シェア"
type: pie

actors:
  - TypeScript: { value: "45%" }
  - Python: { value: "30%" }
  - Rust: { value: "15%" }
  - Go: { value: "10%" }

animation:
  - step: "reveal" 2.0s
    focus: [TypeScript, Python, Rust, Go]
`,
  },
  {
    label: "C4コンテキスト (c4)",
    slug: "c4",
    code: `title: "C4コンテキストモデル"
type: c4

actors:
  - ユーザー: { kind: person, subtitle: "L1" }
  - システム: { kind: service, subtitle: "L1: system" }
  - API: { kind: service, subtitle: "L2: container" }
  - データベース: { kind: database, subtitle: "L2: container" }

flow:
  - ユーザー -> システム: "利用"
  - システム -> API: "要求"
  - API -> データベース: "問い合わせ"

animation:
  - step: "use" 1.2s
    focus: [ユーザー, システム, "ユーザー -> システム"]
  - step: "request" 1.2s
    focus: [システム, API, "システム -> API"]
  - step: "query" 1.2s
    focus: [API, データベース, "API -> データベース"]
`,
  },
];
