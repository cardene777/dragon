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
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts --reporter=verbose`の検査`page-bundle-within-budget`が通る | #3626 #3641 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts --reporter=verbose`の検査`renderers-read-values-from-one-table`が通る | #3626 #3641 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3626 |
| 根の`sankey`の欄に`shape: "rows"`を持つ量の行き先の図の原本の JSON を、形の検査が受け付ける。`rows`のほかの値は断る | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`schema-accepts-sankey-rows`が通る | #3641 |
| `sankey <題> [shape: rows]`の行を持つ記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-roundtrip-keeps-notation`が通る | #3641 |
| `[shape: rows]`の量の行き先の図を描くと、段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分け、区画の幅を出どころの無い箱の量の和に比べた量で決め、分かれた区画を出どころの区画の幅の内に線を書いた順で左から置く | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-stack-one-row-per-step`が通る | #3641 |
| その段で新しく分かれた区画と最後の行の区画は名前と量を書き、前の段から続いている区画は字を書かずに薄い帯だけにする | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-carried-sections-stay-quiet`が通る | #3641 |
| 出どころの無い箱のまだ分けていない残りは、点線の枠を描かずに灰色の帯にし、`残り22%`の形で残りの量を書く | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-rest-is-a-gray-bar`が通る | #3641 |
| 上の行から下の行へ下りる帯と量の札は、その段で新しく分かれた区画にだけ引き、続いている区画には引かない | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-drops-only-new-splits`が通る | #3641 |
| 携帯の幅 (390) で名前が区画に入らない時は、区画に量だけを書き、その行の帯の下に色の印と名前を並べ、帯は幅いっぱいのまま保つ | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-names-below-when-narrow`が通る | #3641 |
| 量の行き先の図の`shape`に`rows`のほかの値を書いた時は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-rejects-unknown-shape`が通る | #3641 |
| 見本帳に`[shape: rows]`の見本`day-hours` (1日24時間の使い方) が日本語と英語で1枚ずつ在り、英語版の形が日本語版と同じで、`dragon check --layout`の崩れが既定の幅と幅390で0件 | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-examples-in-both-langs-have-no-breaks`が通る | #3641 |
| 編集画面の棚に`[shape: rows]`の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-shelf-template-reads`が通る | #3641 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、`[shape: rows]`の量の行き先の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-light-entry-draws-after-load-for`が通る | #3641 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/README.ja.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、`[shape: rows]`の書き方が在る | `pnpm exec vitest run packages/dragon/test/sankey-rows.test.ts --reporter=verbose`の検査`sankey-rows-docs-describe-the-shape`が通る | #3641 |
| `shape`を書かない量の行き先の図は、今どおり出どころの無い箱を左の列に置き、行き先を出どころの右の列へ置く | `pnpm exec vitest run packages/dragon/test/sankey-diagram.test.ts --reporter=verbose`の検査`sankey-columns-follow-the-flow`が通る | #3641 |
| 量の行き先の図の今ある見本4枚の日本語と英語で、今どおり`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/sankey-examples.test.ts --reporter=verbose`の検査`sankey-examples-have-no-breaks`が通る | #3641 |
| `examples/`の今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts --reporter=verbose`の検査`examples-svg-unchanged`が通る | #3641 |
