# er-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `er`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`schema-accepts-er-diagram`が通る | #3618 |
| `er`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-roundtrip-keeps-notation`が通る | #3618 |
| 表どうしの関係の図を描くと、`table`を書いた順に表を左から右へ横1列に並べ、表の中に`field`を書いた順に項目の行を並べる | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-tables-line-up-left-to-right`が通る | #3618 |
| `[key]`の項目に鍵の印を、`[ref: <表>.<項目>]`の項目に結びの印を付け、結びの項目から指す項目へ、多い側に三つ叉の端、1件の側に縦の棒の端の線を引く | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-ref-draws-one-to-many-link`が通る | #3618 |
| 段の中に`pick <表>.<項目>`を書くと、その段でその項目の行と表の枠を光らせる | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-pick-lights-the-row`が通る | #3618 |
| 段の中に`ref`で結んだ項目どうしの線`<表>.<項目> -> <表>.<項目> [tag: <値>]`を書くと、その段で値の札が結びの線に沿って走る | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-tag-runs-between-fields`が通る | #3618 |
| 段の中に`set <表>.<項目>: <値>`を書くと、その段から項目の値を書き換え、前の段は前の値のまま描く | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-set-rewrites-the-value`が通る | #3618 |
| 段の中に`note <表>.<項目>: <文>`を書くと、その段で項目に式の札を添える | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-note-shows-the-formula`が通る | #3618 |
| 無い表か無い項目を指す`ref`を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-rejects-a-ref-to-a-missing-field`が通る | #3618 |
| `ref`で結んでいない項目どうしの線を書くと、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-rejects-a-line-between-unlinked-fields`が通る | #3618 |
| 表が1つも無いか7つ以上在る図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-rejects-too-few-or-too-many-tables`が通る | #3618 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、表どうしの関係の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-light-entry-draws-after-load-for`が通る | #3618 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、表どうしの関係の図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-docs-describe-the-notation`が通る | #3618 |
| ほかの種類の図では、`table`と`field`と`pick`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`notation-keeps-er-words-plain-outside-er`が通る | #3618 |
| カタログの種類が表どうしの関係の図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3618 |
| 表どうしの関係の図の見本4枚 (`order-total`、`library-loan`、`nft-sale`、`token-transfer`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/er-examples.test.ts`の検査`er-has-four-examples-in-both-langs`が通る | #3618 |
| 表どうしの関係の図の見本は一般の題 (`order-total`、`library-loan`) とWeb3の題 (`nft-sale`、`token-transfer`) を2枚ずつ持つ | `pnpm exec vitest run apps/playground-spa/src/lib/er-examples.test.ts`の検査`er-examples-cover-general-and-web3`が通る | #3618 |
| 表どうしの関係の図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/er-examples.test.ts`の検査`er-examples-have-no-breaks`が通る | #3618 |
| 編集画面の棚に表どうしの関係の図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/er-examples.test.ts`の検査`er-shelf-template-reads`が通る | #3618 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3618 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3618 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3618 |
