# Changelog

dragon DSL の主要変更履歴。
[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) format + [Semantic Versioning](https://semver.org/lang/ja/) 準拠。

## [Unreleased]

予定 ... npm publish (`@cardenelabs/dragon` / `@cardenelabs/cdl`) + GitHub Pages 公開後の feedback を反映した patch / minor。

## [0.7.0] - 2026-07-15

### Added

- **龍鱗ゴールド palette** = site 全 chrome を parchment (light) + obsidian (dark) + copper / amber / ember の 3-color system に redesign。 dragon = 「財宝を守る西洋龍」 metaphor、 dev tool の boring UI からの離脱。 light = illuminated manuscript vibe、 dark = dragon's hoard vibe (2 光源 radial glow: amber 75% 30% + ember 15% 90%) (#367-#375 の 5 PR で段階実装、 #373 が palette 全面差替 SSOT)
- **parts catalog** (20 parts、 rich exemplar 合成用 reusable atoms) を lazy dynamic import で分離、 non-parts route の TTI 改善 (#371)
- **breadcrumb aria-label locale 対応** (SiteHeader / ThemePicker / Toast + 6 page breadcrumb を useLocale で JA/EN 切替) (#370)
- **editor URL hash `#preset=<slug>`** で catalog / preset detail から直接 sample load、 SPA navigation でも SAMPLES へ即遷移 + slug 未登録時 toast 通知 (#367)
- **editor 「一括反映」 button** = fixable warning count で disabled 制御 + count 表示 (#367)
- **GitHub Pages deploy setup** = 手動 build + gh-pages branch push 経路 (`pnpm run deploy` = `pnpm build:pages && gh-pages -d dist`)、 CI 未使用 (#376)

### Changed

- **UI 全面日本語化** = Compare / Contribute / Release Notes / Preset Detail / Docs / Editor の 6 page 全 h1 / breadcrumb / button / aria-label (#367)
- **dark mode invisible text hotfix** = globals.css の html.dark base override 追加、 blueprint SVG viewer stage は cream paper (#fcf8ee) 維持で navy 描画明瞭 (#372)
- **preset detail nm-* class CSS 補完** + hideHeader で 01 badge / phase title overlap 解消 (#367)

### Removed

- **`/compare` page (テーマ比較)** = site palette を龍鱗ゴールド 単一に committed した文脈で 6 テーマ選択 UI は decision fatigue、 route + nav link + preset detail button + component + test entry 全削除 (cdl の 6 テーマ機能自体は `data-cdl-theme` 属性経路継続) (#374)
- **dead component 4 削除** = NmPresetCard / ThemePicker / PresetCard / shot-events.mjs = 0 参照 verified、 src/components/ 8 → 5 file (37.5% dead code 削減) (#375)

### Fixed

- CategoryPage 検索 filter の日本語 label 対応 (#367)
- editor `handleAutoFix` axis whitelist 統一で count drift 防止 (#367)
- Preset Detail の `preset.slug` URL 統一で 20 preset 全 hash 経由到達可 (#367)

## [0.6.0] - 2026-06-30

### Changed

- catalog 全 page (cookbook / patterns / text-dsl / presets / animation / styles / primitives) + docs (ja/en) を WebApp 軸の汎用 doc tool 表現に書直し、 blockchain 専用文脈から脱却
- cookbook を WebApp 軸 25 例 (API/Auth 5 + データ操作 5 + UI 5 + 非同期 5 + 運用 5) に再構築、 card 囲い 16:9 統一
- patterns を 12 種の汎用 pattern (Direct / Passthrough / Call-RW / Emit / Hook / Branch / Loop / Fan-out / Fan-in / Rollback / Schedule / Validate→Process) に再構築

### Removed

- 旧 patterns docs (bridge / permit / dex-swap / multicall / approve-pull + solidity preset 解説) を全削除
- primitives-extra の 8 NodeKind (wallet / validator / miner / blockchain-node / mempool / block / bridge-node / relayer) 参照を削除
- 旧 cookbook 25 例 (DeFi 10 / NFT 5 / DAO 5 / Bridge 5) を全削除

## [0.5.0] - 2026-06-28

### Added

Initial OSS release.

- **6 preset** ... sequence / flow / swimlane / er / state / topology
- **多数の NodeKind** ... actor / function / storage / event / service / database / cache / queue / 他
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
