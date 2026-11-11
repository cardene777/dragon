# playground

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 見本 3 つの英語版が、日本語版と同じ数の箱と線と段を持つ | `pnpm test`の検査`english-examples-match-japanese`が通る | #2995 |
| build した頁の script と CSS の合計が、gzip で 270KB 以下に収まる | `pnpm test`の検査`page-bundle-within-budget`が通る | #2995 #3199 |
| 頁の図を描く code が `@cardenelabs/dragon/light` の部品を呼び、`apps/playground-spa` の中に SVG を組む code が無い | `pnpm test`の検査`page-draws-with-package-parts`が通る | #2995 |
| 配る頁の CSP が、script を自分の置き場だけにし、inline と eval を許さない | `pnpm test`の検査`csp-script-self-only`が通る | #2995 |
| 重なりの一覧の各件が、重なる字の四角を持つ (2 つの字の重なりは 2 つ、線が字を横切る所は横切られる字の 1 つ) | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-carry-rects`が通る | #3178 |
| 重なりを知らせる文は、重なる 2 つの字を日本語と英語で書き、段の番号を「段の番号 N」(英語は `step number N`) と呼ぶ | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`overlap-message-in-both-languages`が通る | #3178 |
| 再生の部品の段へ移る呼び出しで、図がその段で止まる | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`player-goes-to-step`が通る | #3178 |
| 再生の部品に四角を渡すと、図の上に点線の四角を描き、空を渡すと消す。止めて見せる図でも寄って追う図でも、四角は図の中身と同じ所に在る | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`player-marks-rects`が通る | #3178 |
| 書き出しの命令が字の重ならない図を書き出す時、標準エラーに何も出さない | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`export-quiet-without-overlaps`が通る | #3178 |
| 頁の側では SVG を組まない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-draws-with-package-parts`が通る | #3178 |
| 全ての見本の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3178 |
| 書き出しの命令が、2 段目に図に描いた 2 つの字を組にした重なりを 1 件足した状態遷移図 (packages/dragon/test/fixtures/corner-note.dragon) を書き出した時、file を書き出し、標準エラーに「段 2」と文を並べた 1 行だけを出し、終わり方 0 で終える。英語を選ぶと「Step 2」と英語の文を出す | `pnpm exec vitest run packages/dragon/test/overlap-cli.test.ts`の検査`export-warns-overlaps`が通る | #3197 |
| 組み上がった書き出しの命令は、重ならない図を書き出す時に標準エラーに何も出さない (重なりを足す包みが組み上がった命令に入らない) | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`export-quiet-without-overlaps`が通る | #3197 |
| 見本帳の build で、最初に読む script に、概要の頁と編集画面の最初の見本 (`intro`、`oauth`、`ccip`) を除く見本の記法と、部品の図の記法の字の並びが含まれない | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-chunks.test.ts`の検査`first-load-carries-no-catalog-notation`が通る | #3246 |
| 見本帳の build で、後から読む塊のうち見本の記法を持つ塊と部品の図の記法を持つ塊がそれぞれ1つだけで、除いた全ての見本と全ての部品の図の記法を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-chunks.test.ts`の検査`catalog-notation-in-two-chunks`が通る | #3246 |
| 見本帳の build で、最初に読む script が概要の頁と編集画面の最初の見本 (`intro`、`oauth`、`ccip`) の日本語と英語の記法を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-chunks.test.ts`の検査`first-load-keeps-home-examples`が通る | #3246 |
| 頁が許す script の読み込み先は自分の置き場 (`'self'`) だけ | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts -t csp-script-self-only`の検査`csp-script-self-only`が通る | #3246 |
| 見本帳を組み立てた時、最初に読む script に部品の説明の字 (各ブロックの`gallery/desc.ts`の日本語と英語の字) が1件も入らず、説明の字を足すと最初に読む script の gzip が5,000バイト以上増える | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-part-desc`が通る | #3531 |
| 各ブロックの置き場の見本帳の分が、部品の説明を持つ`gallery/desc.ts`を持つ | `pnpm exec vitest run packages/dragon/test/blocks.test.ts`の検査`block-folder-holds-whole-definition`が通る | #3531 |
| 各ブロックの`gallery/text.ts`は部品の名前だけを持ち、`gallery/desc.ts`は日本語と英語の説明を持ち、説明の表`BLOCK_DESC`は部品の頁だけが読む`blocks-desc.gen.ts`に書き出され、最初の画面が読む`blocks.gen.ts`に無い | `pnpm exec vitest run apps/playground-spa/src/lib/block-gallery.test.ts`の検査`part-desc-apart-from-names`が通る | #3531 |
| 見本帳が最初に読む script と CSS の合計が、今の上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3531 |
| 見本帳の一覧と部品の頁と編集画面の棚と使い方の頁は、ブロックの置き場から作られる | `pnpm exec vitest run apps/playground-spa/src/lib/block-gallery.test.ts`の検査`catalog-built-from-block-folders`と`grammar-parts-table-from-blocks`が通る | #3531 |
| 書き出した一覧の file は置き場の dir と食い違わない | `pnpm exec vitest run packages/dragon/test/blocks.test.ts`の検査`block-registry-derived-from-folders`が通る | #3531 |
| 見本帳の分の file は package の処理を読まず、npm に出す package の file に入らない | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-files.test.ts`の検査`gallery-imports-no-package-runtime`と`package-excludes-catalog-material`が通る | #3531 |
| 見本帳の今ある検査 (`apps/playground-spa`の検査) が全て通る | `pnpm exec vitest run apps/ --reporter=verbose`が終了0 | #3531 |
| 最初に読むscriptとCSSのgzipの合計が上限186,368バイトに収まり、上限の値は変えない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3565 |
| 部品の説明の字と、カタログの見本の記法は、今どおり最初に読むscriptに入らない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/catalog-chunks.test.ts`の検査`first-load-carries-no-part-desc`と`first-load-carries-no-catalog-notation`が通る | #3565 |
| 記法の欄で、`box`の行の頭の語、線の`->`、`[carry: …]`の鍵と値、`//`の注釈を、それぞれ別の役の要素で描く | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-notation-roles`が通る | #3613 |
| 記法の8つの役 (図の種類の名前、行の頭の語、`as`、線の`->`、設定の鍵、設定の値、注釈、`code`の命令) の色が、サイトの5つの意匠の明暗の10通りの全てで互いに違う | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-notation-colors-differ`が通る | #3613 |
| JSONの欄で、鍵と字の列と数と真偽と`null`を別の役の要素で描き、鍵と字の列と数の色が10通りの全てで互いに違う | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-json-roles`が通る | #3613 |
| 色を付ける行の頭の語と図の種類の名前を記法の読み取りが持つ語の一覧から引き、編集画面の色付けのcodeは語の一覧の字を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-words-from-reader`が通る | #3613 |
| 見本の全ての記法 (日本語と英語) とそのJSONで、色の層の字を繋ぐと書く欄の字と一字も違わない | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-paint-keeps-text`が通る | #3613 |
| 書く欄の字を打ち替えると色の層も同じ字になり、書く欄を送ると色の層も同じ量だけ送られる。色の層は読み上げに出さない | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-paint-follows-typing-and-scroll`が通る | #3613 |
| 日本語の入力で字を組んでいる間は書く欄の字を見せ、組み終えると色の層に戻す | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-paint-steps-aside-while-composing`が通る | #3613 |
| 色を付けた字と書く欄の地の濃さの比が、10通りの全てで4.5以上 | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`syntax-colors-readable`が通る | #3613 |
| 棚の部品を押すと、今までどおり書く欄に部品の行が足される | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`editor-shelf-part-inserts-lines`が通る | #3613 |
| 知らせの欄の行番号を押すと、今までどおり書く欄でその行が選ばれる | `pnpm exec vitest run apps/playground-spa/src/lib/syntax-color.test.tsx`の検査`editor-notice-line-selects-line`が通る | #3613 |
