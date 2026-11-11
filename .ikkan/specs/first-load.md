# first-load

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 書き出した見本帳が最初に読む script は、英語の画面の字を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-english-text`が通る | #3646 |
| 書き出した見本帳が最初に読む script は、最初の見本3枚 (`intro`、`oauth`、`ccip`) の英語の記法を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-english-examples`が通る | #3646 |
| 書き出した見本帳が最初に読む script は、編集画面の棚の雛形を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-shelf-templates`が通る | #3646 |
| 英語の画面の字を後から読むと、分ける前と同じ英語の字を返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-english-text-matches`が通る | #3646 |
| 最初の見本3枚の英語の記法を後から読むと、`packages/dragon/examples/`の英語の見本と同じ記法を返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-english-examples-match`が通る | #3646 |
| 棚の雛形を後から読むと、分ける前と同じ雛形を同じ順で返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-shelf-items-match`が通る | #3646 |
| 英語で開いた頁は、英語の字が届くまで画面を描かず、日本語の字を出さない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`english-page-waits-for-english-text`が通る | #3646 |
| 最初に読む script と CSS は gzip で184KB以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3646 |
| 最初に読む script は崩れの検査を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-layout-check`が通る | #3646 |
| 部品のブロックが棚に置く雛形の名前は、どれも棚に載る | `pnpm exec vitest run apps/playground-spa/src/lib/block-gallery.test.ts`の検査`block-shelf-ids-on-shelf`が通る | #3646 |
