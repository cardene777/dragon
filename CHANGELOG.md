# Changelog

CDL (Chainome Diagram Language) の主要変更履歴。
[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) format + [Semantic Versioning](https://semver.org/lang/ja/) 準拠。

## [Unreleased]

予定 ... feedback を反映した patch / minor。

## [0.5.0] - 2026-06-28

### Added

Initial OSS release.

- **12 preset** ... sequence / flow / swimlane / er / state / topology / solidity / gantt / class / pie / c4 / mind
- **29 NodeKind** ... actor / function / storage / event / service / database / cache / queue / wallet / validator / 他
- **8 EdgeStyle** ... solid / dotted / dashed / dotted-flow / 他
- **6 Tone** ... accent / teal / success / error / warning / info
- **phase / state / tween / set / badge** ... 時系列 animation を宣言的に
- **Text DSL v0.5** ... mermaid 感覚の 5 ブロック箇条書き DSL (parser + compiler、 JA / EN i18n)
- **Visual Editor** (`apps/playground`) ... GUI 編集 + live preview + SVG export
- **Catalog** ... 12 preset × animation の visual 一覧
- **Docs site** ... 全 16 概念 × JA / EN、 humans tab + LLM tab、 Diátaxis 準拠
- **Pagefind 全文検索** ... Cmd+K で全 docs 高速 lookup
- **React + Astro 両対応** ... static / SSR / hybrid どこでも動く
- **CdlDiagramThumbnail** ... thumbnail + viewport いっぱいのモーダル拡大
- **CdlDiagramView** ... phase autoplay / focusPhaseId / hideHeader / debug props
- **Performance optimization** ... spatial hash 採用、 1000 node でも 60ms 以下の layout
- **TypeScript strict 全面 ON** + zod runtime validation
- **OSS 公開準備** ... README / CONTRIBUTING / SECURITY / ISSUE_TEMPLATE / PR_TEMPLATE 整備
- **380 件のテスト** ... unit + integration + visual screenshot diff + e2e

### Changed

- chainome monorepo から独立 OSS lib として分離 (旧 `chainome/packages/cdl` + `chainome/packages/anim` + `chainome/apps/web` の cdl 関連を移植)
- repo URL を `git@github.com:cardene777/cdl.git` に変更
- playground (旧 `apps/web`) を `apps/playground` に rename

## [0.4.0] - 2026-06-27

### Added

- **Text DSL v0.4** ... 残 5 preset (flow / swimlane / er / state / topology) animation 拡張
- catalog の Text DSL demo page (`/catalog/text-dsl`) ... 6 preset × animation の visual 確認
- 全 docs code block への preview 強制 (48 件、 lint script による品質保証)
- integration test 21 件追加 (Permit / Topology / edge case / regression / 6 preset × animation)

## [0.3.0] - 2026-06-27

### Added

- **Text DSL v0.3** ... sequence preset で `アニメーション:` ブロック full compile
- DSL の `状態` / `ステップ` / `強調` / `遷移` / `切替` / `バッジ` / `説明` を実 phase / state / tween / set / activate / badge / body に注入
- highlight 解決 ... actor 名 → `header` + `footer` + `step box` を active 化、 `A→B` 矢印 → edge id を active 化
- アーキテクチャ ... animation あり時 builder 直接経路、 なし時 preset 経由 (v0.2 互換)
- test 6 件 (v0.3 機能)

## [0.2.0] - 2026-06-27

### Added

- **Text DSL v0.2** ... 6 preset 全対応 (sequence + flow + swimlane + er + state + topology)
- cardinality 自動解析 (1:1 / 1:N / N:M / 0..1 / 1..*)
- ER preset で entity 自動生成 + relation 自動 cardinality
- state preset で最初 actor = initial、 最後 = final 自動付与
- topology preset で 1 group 内 container 配置
- test 8 件 (5 preset 動作確認)

## [0.1.0] - 2026-06-27

### Added

- **Text DSL v0.1** ... 「タイトル / 種類 / 登場人物 / 流れ / アニメーション」 の 5 ブロック箇条書き DSL
- parser + compiler (sequence preset only) ... 行ベース parser + AST + LaidDiagram 変換
- 日本語 + 英語両対応 (キーワード i18n)
- 矢印正規化 (→ / -> / => / >>)
- duration 解析 (1.5 秒 / 1500ms / 2s)
- エラー親切 (行番号 + hint + 修正提案)
- LLM 生成ガイド + 5 few-shot 例
- ChatGPT/Claude/Cursor 即用 system prompt
- preview 強制 lint script (`pnpm lint:docs-preview`)
- text-dsl-spec.md + text-dsl-llm-guide.md (docs site 統合)
- test 11 件 (parse + compile + アニメーション parse)
