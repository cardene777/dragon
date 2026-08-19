# Changelog

dragon DSL の主要変更履歴。
[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) format + [Semantic Versioning](https://semver.org/lang/ja/) 準拠。

## [Unreleased]

**破壊的変更を含む**。 記法から型を 1 つ落としているため、 次の版は patch ではなく minor に
なる (`package.json` は 0.8.0 に上げてある)。

### Added

- **値が「きっかけ」 で動き出す形を書けるようにした** (`trigger:` / `to:` / `dur:`、 #1161 段 2)

  それまで `values:` に書けるのは「常に成り立つ関係」 だけで、 いつ動き出すかは段に手で書く
  しかなかった。 工程が 4 つあれば段も 4 つ並べる必要があり、 「フロー 1 が終わったら
  フロー 2」 を書く場所が無かった。

  ```
  states:
    vDone: 0
    cDone: 0

  values:
    vDone: { trigger: step "取込み", to: 100, dur: 2s }
    cDone: { trigger: vDone >= 100, to: 100, dur: 2s }

  animation:
    - step: "取込み" 4s
  ```

  `trigger: step "名前"` はその段が始まった時、 `trigger: <値> >= <数>` は別の値が境目を通った
  時に動き出す。 `to:` が動いた先、 `dur:` が動く長さで、 動き始めの値は `states:` から取る。

  上の例は段を 1 つ書くだけで 2 本が順に動く。 `cDone` が動き出す時刻は `vDone` の傾斜から
  逆算されるため、 段を人が並べ直す必要が無い。

  組み立ての時点で段の中の傾斜へ畳むため、 描画側は変わらない。 畳めない形 (段が無い /
  相手が境目を通らない / 段に収まらない / きっかけが一周する) は図に載せず、 書いた行で伝える。

- **記法で「他の値から決まる値」 を書けるようにした** (`values:` / `states:`、 #1163 / #1183)

  それまで図の中の値は段ごとに手で書くしかなく、値どうしの関係を書く場所が無かった。
  要素が増えるほど段に書く量が増え、連動する図を書けない状態だった。

  ```
  states:
    inflow: 8200
    done: 130

  values:
    waiting: "{inflow} - {done}"
  ```

  `states:` が初期値を、`values:` が他の値から決まる関係を持つ。 段で `states:` の値を動かすと、
  `values:` の式がその都度解かれる。 箱の欄に `{waiting}` と書くとその値が出る。

  `#1163` が記法として読めるところまで、`#1183` が図に載せて描画側で解ける経路までを入れた。

- **JSON の入口でも値と状態を書けるようにした** (#1187)

  記法が `values:` / `states:` を受けるようになった一方、JSON の入口には受ける場所が無く、
  書いても黙って消えていた。 `DragonJson` に `states` と `values` を足して同じ機能に揃えた。

- **図表の欄が値を読めるようにした** (#1199 / #1202)

  円 / 棒 / 折れ線 / 絞り込み / 進捗の数の欄と、気持ち / 区画の語の欄が `{名前}` を受ける。
  それまで図表は配列を書いて一度描くだけで、状態を読む経路が無く永久に静止していた。

- **値の書き方を記法一覧と編集画面の見本に載せた** (#1191)

  `values:` は解けて図に載る状態まで来ていたが、記法一覧に 0 件 / catalog の図に 0 件 /
  編集画面の見本に 0 件で、**書ける人が居なかった**。 一覧と実例を足して書けるようにした。
  一覧の検査対象は実装から導き、`title:` / `type:` / `flow:` / `states:` / `values:` /
  `animation:` / `viewport:` の追加漏れを検知する。

### Changed

- **`type: mind` の絵が変わった (破壊的変更、 #1177)**

  記法の `type: mind` は `card` を 3 列 (`mind-left` / `mind-center` / `mind-right`) に並べる
  別実装で、 engine の `mind-map` 種別を使っていなかった。 中心から放射する絵を出す種別が
  engine 側にあるのに、 記法からは辿り着けない状態だった。

  ```
  title: "アイデア"
  type: mind

  actors:
    - Core        # 1 つ目が中心
    - Idea1       # 残りが枝
    - Idea2
  ```

  **既存の図の見た目が変わる**。 3 列に並んだ箱と箱の間の矢印から、 中心と放射の 1 枚絵になる。

  | 変わったこと | 前 | 後 |
  |---|---|---|
  | 箱の数 | 登場人物の数だけ | 1 つ (図全体を 1 箱で描く) |
  | 枠 | `mind-left` / `mind-center` / `mind-right` | `chart` の 1 つ |
  | 矢印 | 中心から枝へ自動で引く | 引かない (繋がりは箱の中が持つ) |
  | 位置の相対指定 | 効く | 効かない (箱が 1 つのため) |

  併せて 2 つが直った。 枝の親を見る規則 (`ruleMindMapParentReference`) が記法から作った図にも
  当たるようになり、 `SINGLE_BOX_KINDS` の `mind-map` が記法から到達する状態になった。

  **矢印は書いても描けない**。 書かれていたら伝える (`type: journey` / `type: quadrant` と同じ)。
  枝の親を矢印で書く形は `type: tree` が持っており、 `mind` は「1 つ目が中心、 残りが枝」 の
  簡便形として別に残す。

  **箱ごとに描いていた頃の欄の一部は描けなくなる**。 1 箱で描く種別が持てるのは名前、
  名前の後ろに続けて出す副題 / 値、 枝の色だけで、 以下の表で「出ない」「効かない」欄は
  書かれていたら伝える。 副題 / 値に `{状態名}` を書いた場合も、中心と枝の表示文字として
  段の状態を読む。

  | 欄 | 中心 | 枝 |
  |---|---|---|
  | 名前 | 出る | 出る |
  | 色 (`tone`) | **出ない** | 出る |
  | 副題 / 値 | 名前の後ろに出る | 名前の後ろに出る |
  | 上の小見出し / 行 | **出ない** | **出ない** |
  | 種類 / 枠の指定 / 積む順 / 色番号 | **効かない** | **効かない** |
  | 位置 (座標 / 相対) / 大きさ / 配置のずらし | **効かない** | **効かない** |

  これらを描くなら `type: tree` か `type: flow` を使う。 位置と大きさは「登場人物ごとの箱を
  どこに置くか」 の指定で、 箱が 1 つの図では置く先が無い。

  描ける欄と描けない欄の割り当ては型で固定してある。 `DslActor` に欄が増えた時、 どちらにも
  入れ忘れると型検査が落ちる。 伝える判定も同じ表から導くので、 欄を足して判定を書き忘れる
  形も型検査で止まる。

  見本 (`parts`) を重ねた登場人物は **中心にも枝にもせず**、 見本の中身だけを描く。 載せると同じ
  登場人物が 2 箇所に描かれるため。 見本しか書かなかった記法では放射の箱そのものを作らない。

- **`@cardenelabs/cdl` の依存を `^0.6.1` から `^0.7.0` に上げた** (#1205)

  cdl 0.7.0 で木 (`tree`) と放射 (`mind`) の名前が状態を読むようになったため、
  依存を上げて見本 2 件を動かした。

- **見本帳 127 件に段を付けた** (#1185 / #1193 / #1195 / #1197)

  看板が「動く図の記法」 なのに見本帳が 1 件も動いていなかった。 群ごとに段を足した。

  | 群 | 件数 | 動かし方 |
  |---|---|---|
  | primitives-extra | 21 | 指標を 1 つずつ割り当てて段で動かす |
  | `scene-*` | 30 | 箱を 1 つずつ光らせて流れを読ませる |
  | presets | 19 | 箱を 1 つずつ、図全体が箱 1 つのものは図表の中身を動かす |
  | `shape-*` / `kind-*` | 50 | 形を保ったまま副題 (値の欄 / 行) の数を動かす |
  | charts | 7 | 数の欄を段ごとに動かす |

  **検査を描画結果ベースにした**。 宣言の層で見る検査だと、値を足しても絵が変わらない種別が
  「動いている」 と判定される (値を描く経路は 2 種別しか持たない)。

- **`@cardenelabs/cdl` の依存を `^0.5.0` から `^0.6.1` に上げた** (#1166)

  同じ workspace の中で cdl の解決先が 2 つに割れており (`apps/playground-spa` が隣の
  checkout を `link:` で、 `packages/dragon` が公開版を掴む)、 同名だが別物の型として
  扱われて型検査が 103 件落ちていた。 両方を公開版に揃えて 0 件になった。

  cdl 0.6.0 は `mindMapRadial` と `mind-radial` を消しているため、 これらを使う図は
  cdl 側の移行が要る (cdl の `CHANGELOG` に手順がある)。

### Fixed

- **自分へ戻る矢印を書いても図が組み立つようにした** (#1227)

  `A -> A` の形は組み立てから外し、 書いた行で理由を伝える。 それまでは記法の側が通してしまい、
  描画の直前で図ごと落ちていた。 本文のどの行が原因かも出なかった。

  ```
  flow:
    - Wait -> Wait: "tick"    # 外して知らせる
    - Wait -> Done: "exit"    # そのまま描く
  ```

  描画側は図種を問わず自己ループを受けない (`validate` の判定に分岐が無い)。 実測すると、
  golden 検査が持つ自己ループの見本 4 件 (順序図の自分宛て / 帯図の自己ループ / ER の自己参照 /
  状態図の自己遷移) は **どれも描けない状態だった**。 外して残りを描く形にしたことで、
  4 件とも図が出るようになる。

  自己ループそのものは描けないままなので、 知らせが直し方を 2 通り案内する = 途中の箱を
  1 つ足して 2 本に分けるか、 段 (`animation`) で状態が変わる様子として見せる。

  図全体を 1 箱で描く種別は矢印を作らないため対象にしない (本数を数えて別に伝えている)。


- **見本が持つ値を重ねた先でも解けるようにした** (#1188)

  見本 (parts) は図の定義そのものなので値を持てるが、取り込む側が箱 / 矢印 / 縦列 / 状態を
  写すだけで値を写していなかった。 重ねた先で `{名前}` の生の形が出ていた。

- **図表の欄が読む値の検査を 1 か所に集めた** (#1203)

  数の欄と語の欄で同じ土台を 3 度書いており、3 度とも review で同じ形の穴を指摘されていた
  (同じ名前を 2 回宣言した時に後ろが効くこと / 段で状態に入る値も見ること)。

### Removed (破壊的変更)

- **記法から `type: radial` を外した** (#1170)

  放射状に枝を配る記法で、 繋がる先の `mind-radial` 種別を engine 側で落としたため
  (`@cardenelabs/cdl` 0.6.0)、 記法の入口も同じ段で閉じた。 閉じないと「型は通るのに
  描けない記法」 が一覧に残る。

  | 消えたもの | 代わりに使うもの |
  |---|---|
  | 記法の `type: radial` | 無し。 下記 |
  | `PresetType` の `"radial"` | 同上 |
  | `diagramJsonSchema` の型一覧の `radial` | 同上 |

  **そのまま置き換えられる記法は無い**。 `type: mind` は枝を書き並べる用途では足りるが、
  `card` を 3 列に並べる別実装なので出てくる絵が変わる (放射状にはならない)。

  `type: radial` を書いた記法は `unknown type: "radial"` で弾かれる。 黙って別の絵に
  なることは無い。

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
