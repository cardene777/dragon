# sankey-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `sankey`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`schema-accepts-sankey-diagram`が通る | #3626 |
| `sankey`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-roundtrip-keeps-notation`が通る | #3626 |
| 量の行き先の図を描くと、出どころの無い箱を左の列に置き、行き先を出どころの右の列へ置く | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-columns-follow-the-flow`が通る | #3626 |
| 線の名前の初めの数 (`40%`の40、`1,200円`の1200) を量として読み、帯の幅を同じ出どころの量に比べて決める | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-band-width-follows-the-amount`が通る | #3626 |
| 段の中に`<出どころ> -> <行き先>: <量>`を書くと、その段でその帯が伸び、量の札が帯を渡る | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-band-grows-at-its-step`が通る | #3626 |
| 線の名前が数で始まらない線を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-rejects-a-label-without-an-amount`が通る | #3626 |
| 行き先から前の列の箱へ戻る線を書くと、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-rejects-a-line-that-flows-back`が通る | #3626 |
| 入る量より出る量の和が大きい箱を書くと、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-rejects-outflow-larger-than-inflow`が通る | #3626 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、量の行き先の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-light-entry-draws-after-load-for`が通る | #3626 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、量の行き先の図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`sankey-docs-describe-the-notation`が通る | #3626 |
| ほかの種類の図では、`sankey`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts`の検査`notation-keeps-sankey-words-plain-outside-sankey`が通る | #3626 |
| カタログの種類が量の行き先の図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3626 |
| 量の行き先の図の見本4枚 (`token-allocation`、`fee-split`、`salary`、`revenue`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/sankey-examples.test.ts`の検査`sankey-has-four-examples-in-both-langs`が通る | #3626 |
| 量の行き先の図の見本は一般の題 (`salary`、`revenue`) とWeb3の題 (`token-allocation`、`fee-split`) を2枚ずつ持つ | `pnpm exec vitest run apps/playground-spa/src/lib/sankey-examples.test.ts`の検査`sankey-examples-cover-general-and-web3`が通る | #3626 |
| 量の行き先の図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/sankey-examples.test.ts`の検査`sankey-examples-have-no-breaks`が通る | #3626 |
| 編集画面の棚に量の行き先の図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/sankey-examples.test.ts`の検査`sankey-shelf-template-reads`が通る | #3626 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3626 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3626 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3626 |
