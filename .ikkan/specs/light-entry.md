# light-entry

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 軽い入口で種類を読む関数を待った後の`renderDiagram`の SVG が、`packages/dragon/examples`の全ての見本で既定の入口の SVG と同じ | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-same-svg`が通る | #3248 |
| 軽い入口で読んでいない種類を`renderDiagram`か`mountDiagram`で描くと、その種類の名前を含む誤りで止まる | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-refuses-unloaded-kind`が通る | #3248 |
| 軽い入口が package の`exports`に在り、Node の組み込みの module を読まない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`light-entry-browser-safe`が通る | #3248 |
| 既定の入口は種類を読む関数を呼ばずに、`parseNotation`と`renderDiagram`を待たずに続けて呼ぶと全ての種類の見本を描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`default-entry-draws-every-kind`が通る | #3248 |
| 書き出した HTML の頁が、全ての種類の図を部品を後から読まずに描ける | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`html-export-draws-every-kind`が通る | #3248 |
| 見本帳の build で、最初に読む script に git、time、state、tree、lineup の描く部品が無く、それぞれの部品が後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`first-load-leaves-later-kinds-out`が通る | #3248 |
| 見本帳の build で、最初に読む script と CSS の合計が gzip で179KB以下 (検査と同じ数え方の実測168.5KBに約10KBの余裕を足した値) で、全部の塊の合計より20KB以上小さく、落ちた時の文に両方の合計を出す | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts -t page-bundle-within-budget`の検査`page-bundle-within-budget`が通る | #3248 #3280 #3292 |
| 見本帳を組み立てた時、最初に読むscriptに使い方の頁の本文が入らず、後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-docs-page`が通る | #3280 |
| 見本帳を組み立てた時、最初に読むscriptに部品の一覧と分類と部品の頁の部品が入らず、後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-catalog-pages`が通る | #3280 |
| 見本帳を組み立てた時、最初に読むscriptとCSSの合計が今の237KBより小さい新しい上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3280 |
| 見本帳を組み立てた時、`index.html`が名指すCSSに`@font-face`が無く、後から読むCSSに在る | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`first-load-css-carries-no-font-face`が通る | #3292 |
| 見本帳を組み立てた時、最初に読むscriptとCSSの合計が今の上限213KBより小さい新しい上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3292 |
| 見本帳を組み立てた時、元のNotoの番号付きの面の`unicode-range`に、切り出した字と`latin`の面の字が1字も無い | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-trims-original-faces`が通る | #3296 |
| 見本帳を組み立てた時、字のCSSが切り出した字の`file`を名指す`@font-face`を1件持ち、`font-weight`が`100 900` | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-has-one-face`が通る | #3296 |
| 組み立て結果のscriptとCSSに在るNotoの字が全て切り出した字に入り、抜けた時は抜けた字を名指して落ちる | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-covers-every-word`が通る | #3296 |
| 字を作る命令に版の違う字を渡すと、字の`file`を書き換えず終わり方1で止まる | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-refuses-other-source`が通る | #3296 |
| 切り出した字の`file`の隣に字の利用許諾`OFL`の全文が在る | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-carries-license`が通る | #3296 |
| script の1行の入口 (CDN) が時系列図 1 つの頁でその図を描くまでに読む script の合計が、gzip で 90,000 byte 以下に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3400 |
| 見本帳が最初に読む script と CSS の合計が、gzip で今の上限 191KB より 10KB 以上小さい 181KB 以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3400 |
| 軽い入口で`parseNotation`が返した図を`renderDiagram`に渡した時、原本の形の検査を読まずに描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-draws-parsed-without-validator`が通る | #3400 |
| 軽い入口で`loadFor`を待たずに原本の JSON を`renderDiagram`に渡した時、原本の形の検査を読んでいないことを名指す誤りで止まり、SVG を返さない | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-refuses-json-before-validator`が通る | #3400 |
| 軽い入口で`loadFor`に原本の JSON を渡して待った後は、その原本を検査して描き、知らないアイコン名の誤りを今と同じ欄と文で返す | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-load-for-json-reads-validator`が通る | #3400 |
| `parseNotation`が返した図の足したブロックの path を path の文法の外の字 (`"`、`<`) に書き換えて描いた時、誤りで止まり SVG を返さない | `pnpm exec vitest run packages/dragon/test/trusted-diagram.test.ts`の検査`parsed-diagram-rewritten-path-refused`が通る | #3400 |
| `parseNotation`が返した図のリンクの URL を`javascript:`で始まる字に書き換えて描いた時、誤りで止まり SVG を返さない | `pnpm exec vitest run packages/dragon/test/trusted-diagram.test.ts`の検査`parsed-diagram-rewritten-link-refused`が通る | #3400 |
| `packages/dragon/examples`の全ての`.dragon`の file を`parseNotation`で読んだ図は、原本の形の検査 (`validateDiagram`) を通る | `pnpm exec vitest run packages/dragon/test/trusted-diagram.test.ts`の検査`every-parsed-example-passes-validator`が通る | #3400 |
| 軽い入口で種類を読む関数を待った後の`renderDiagram`の SVG が、`packages/dragon/examples`の全ての見本で既定の入口の SVG と同じ | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-same-svg`が通る | #3400 |
| 既定の入口は種類を読む関数を呼ばずに、`parseNotation`と`renderDiagram`を待たずに続けて呼ぶと全ての種類の見本を描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`default-entry-draws-every-kind`が通る | #3400 |
| 書き出した HTML の頁が、全ての種類の図を部品を後から読まずに描ける | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`html-export-draws-every-kind`が通る | #3400 |
