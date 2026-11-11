# venn-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `venn`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`schema-accepts-venn-diagram`が通る | #3620 |
| `venn`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-roundtrip-keeps-notation`が通る | #3620 |
| 段の中で集まりに初めて`set <id>: <数>`を書くと、その段でその集まりの円が現れ、円の外に名前と全体の数を出す | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-circles-appear-at-their-step`が通る | #3620 |
| `set <id> & <id>: <数>`で重なりの数を書くと、その段でその重なりの区画を光らせる | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-overlap-lights-at-its-step`が通る | #3620 |
| 全体と重なりの数から、それぞれだけの区画の数を出して区画の中に書く | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-regions-show-exclusive-counts`が通る | #3620 |
| `set none: <数>`を書くと、その段でどれにも入らない数を円の外の枠に出す | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-none-shows-outside-count`が通る | #3620 |
| 集まりが2つより少ないか3つより多い図は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-rejects-other-than-two-or-three-sets`が通る | #3620 |
| 重なりの数が重なる集まりのどれかの数より大きい図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-rejects-an-overlap-larger-than-its-set`が通る | #3620 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、集合の重なりの図を読んで描ける | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-light-entry-draws-after-load-for`が通る | #3620 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、集合の重なりの図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-docs-describe-the-notation`が通る | #3620 |
| ほかの種類の図では、`venn`と`none`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`notation-keeps-venn-words-plain-outside-venn`が通る | #3620 |
| カタログの種類が集合の重なりの図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3620 |
| 集合の重なりの図の見本4枚 (`wallet-usage`、`l2-chains`、`hobbies`、`skills`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/venn-examples.test.ts`の検査`venn-has-four-examples-in-both-langs`が通る | #3620 |
| 集合の重なりの図の見本は一般の題 (`hobbies`、`skills`) とWeb3の題 (`wallet-usage`、`l2-chains`) を2枚ずつ持つ | `pnpm exec vitest run apps/playground-spa/src/lib/venn-examples.test.ts`の検査`venn-examples-cover-general-and-web3`が通る | #3620 |
| 集合の重なりの図の見本は、2つの集まりの図と3つの集まりの図の両方を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/venn-examples.test.ts`の検査`venn-examples-cover-two-and-three-sets`が通る | #3620 |
| 集合の重なりの図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/venn-examples.test.ts`の検査`venn-examples-have-no-breaks`が通る | #3620 |
| 編集画面の棚に集合の重なりの図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/venn-examples.test.ts`の検査`venn-shelf-template-reads`が通る | #3620 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3620 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3620 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3620 |
