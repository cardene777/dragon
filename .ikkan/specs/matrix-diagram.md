# matrix-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `matrix`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`schema-accepts-matrix-diagram`が通る | #3622 |
| `matrix`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-roundtrip-keeps-notation`が通る | #3622 |
| 2つの軸で置く図を描くと、`box`を書いた順に左上、右上、左下、右下の区画に置き、区画の名前を区画の左上に出す | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-areas-go-left-to-right-top-to-bottom`が通る | #3622 |
| `axis <名前> [from: <字>, to: <字>]`の1行目を横の軸、2行目を縦の軸にし、軸の名前と両端の字を矢印の軸に出す | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-axes-show-names-and-ends`が通る | #3622 |
| まだ`line`で区画に置いていない`item`を、区画の左の置く前の一覧に書いた順に並べる | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-items-wait-in-the-unplaced-list`が通る | #3622 |
| 段の中に`line <区画>: <課題>`を書くと、その段で課題の札が置く前の一覧から区画へ動き、その区画を光らせる | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-line-moves-the-item-into-the-area`が通る | #3622 |
| 区画の`box`が4つでない図は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-four-areas`が通る | #3622 |
| `axis`が2行でない図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-two-axes`が通る | #3622 |
| 無い区画か無い課題を書いた`line`は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-an-unknown-item-or-area`が通る | #3622 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、2つの軸で置く図を読んで描ける | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-light-entry-draws-after-load-for`が通る | #3622 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、2つの軸で置く図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-docs-describe-the-notation`が通る | #3622 |
| ほかの種類の図では、`matrix`と`axis`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`notation-keeps-matrix-words-plain-outside-matrix`が通る | #3622 |
| カタログの種類が2つの軸で置く図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3622 |
| 2つの軸で置く図の見本5枚 (`task-priority`、`risk-matrix`、`feature-scores`、`token-listing`、`chain-choice`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-has-five-examples-in-both-langs`が通る | #3622、#3637 |
| 2つの軸で置く図の見本は一般の題 (`task-priority`、`risk-matrix`、`feature-scores`) とWeb3の題 (`token-listing`、`chain-choice`) を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-examples-cover-general-and-web3`が通る | #3622、#3637 |
| 2つの軸で置く図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-examples-have-no-breaks`が通る | #3622 |
| 編集画面の棚に2つの軸で置く図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-shelf-template-reads`が通る | #3622 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3622 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3622 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3622 |
