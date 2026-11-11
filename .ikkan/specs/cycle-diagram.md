# cycle-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `cycle`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`schema-accepts-cycle-diagram`が通る | #3623 |
| `cycle`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-roundtrip-keeps-notation`が通る | #3623 |
| 回り続ける図を描くと、`box`を書いた順に真上から右回りに輪の上へ手順を置く | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-boxes-go-clockwise-from-top`が通る | #3623 |
| 段の中に輪の次の手順への線`<id> -> <id> [tag: <字>]`を書くと、その段で札が弧に沿って次の手順へ走り、走った弧は光ったまま残る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-tag-runs-along-the-arc`が通る | #3623 |
| `strip`の欄を段の中の`set`で書くと、輪の真ん中にその段の欄の値を出す | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-centre-shows-strip-values`が通る | #3623 |
| 輪の次の手順でない手順への線 (1つ飛ばす線、逆回りの線) を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-rejects-a-line-that-skips-a-step`が通る | #3623 |
| 手順が2つより少ないか8つより多い回り続ける図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-rejects-too-few-or-too-many-steps`が通る | #3623 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、回り続ける図を読んで描ける | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-light-entry-draws-after-load-for`が通る | #3623 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、回り続ける図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-docs-describe-the-notation`が通る | #3623 |
| ほかの種類の図では、`cycle`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`notation-keeps-cycle-words-plain-outside-cycle`が通る | #3623 |
| カタログの12種類のどれも見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3623 |
| 回り続ける図の見本4枚 (`eth-slot`、`sprint`、`pdca`、`restake`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-has-four-examples-in-both-langs`が通る | #3623 |
| 回り続ける図の見本は一般の題 (`sprint`、`pdca`) とWeb3の題 (`eth-slot`、`restake`) を2枚ずつ持つ | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-examples-cover-general-and-web3`が通る | #3623 |
| 回り続ける図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-examples-have-no-breaks`が通る | #3623 |
| 編集画面の棚に回り続ける図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-shelf-template-reads`が通る | #3623 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3623 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3623 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3623 |
