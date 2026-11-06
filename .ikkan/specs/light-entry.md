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
| 頁を開くと、最初の画面を描いた後に5種類の塊を裏で読み始める | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`site-prefetches-later-kinds`が通る | #3248 |
| 5種類の塊が届かない間、その種類の図の場所に決まった高さの枠と「読み込み中」を出し、届いたら図に替わる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`figure-waits-for-later-kind`が通る | #3248 |
| 種類の塊の読み込みが落ちると、図の場所に「読み直す」の釦を出す | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`figure-offers-reload-when-kind-fails`が通る | #3248 |
| 種類の頁の枠は「読み込み中」と読み直す釦を上寄りに出し、1366x720 の画面で開いた時に画面の高さ以内に見え、幅 390 でも枠の上端から 120 以内に字が在る | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`stage-waiting-in-first-view`が通る | #3264 |
| 編集画面で書き替えた記法の種類の塊を待つ間は前の図を残し、届いたら新しい図に替わる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`editor-keeps-figure-while-kind-loads`が通る | #3248 |
| 編集画面で塊を待つ間は状態の欄が前の図の数の代わりに「読み込み中」を出し、届いたら新しい図の数に替わる。待つ種類の記法を載せた URL で開いた時も「読み込み中」を出す | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`editor-status-waits-for-kind`が通る | #3259 |
| 5種類の塊を止めたままでも、概要の頁の図は描ける | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`home-draws-without-later-kinds`が通る | #3248 |
| 見本帳を組み立てた時、最初に読むscriptに使い方の頁の本文が入らず、後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-docs-page`が通る | #3280 |
| 見本帳を組み立てた時、最初に読むscriptに部品の一覧と分類と部品の頁の部品が入らず、後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-catalog-pages`が通る | #3280 |
| 見本帳を組み立てた時、最初に読むscriptとCSSの合計が今の237KBより小さい新しい上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3280 |
| 編集画面を開いて最初の画面を描いた後、頁を開かなくても頁の塊を裏で読み始める | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunks-start-after-first-screen`が通る | #3280 |
| 頁の塊が読めなかった時、その頁に読み直しの釦が出て、上の帯は残る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunk-failure-offers-reload`が通る | #3280 |
| 使い方と部品の一覧と分類と部品の頁のURLを直接開いた時、それぞれの本文が出る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`pages-open-directly`が通る | #3280 |
| 使い方の頁を見出しの`#`付きのURLで直接開いた時、その見出しまで移る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`docs-hash-opens-the-section`が通る | #3280 |
| 編集画面から使い方の頁へ移ると本文が出て、編集画面へ戻ると図が出る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`editor-to-docs-and-back`が通る | #3280 |
| 知らない分類と部品のURLを開いた時、見つからない頁が出る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`unknown-catalog-routes-are-not-found`が通る | #3280 |
| 頁の塊が1度だけ読めなかった時、頁を1度読み直して本文が出て、読み直しの釦は残らない | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunk-failure-reloads-once`が通る | #3288 |
| 頁の塊が読み直しても読めない時、読み直しは1度で止まり、読み直しの釦が出て上の帯は残る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunk-reload-stops-after-one`が通る | #3288 |
| 読み直して本文が出た後に、同じタブでまた読めなくなった時も、もう1度だけ自動で読み直す | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunk-reload-allowed-again`が通る | #3288 |
| 頁の塊が読めなかった時の釦の文が、図ではなく頁を読み込めなかったと日本語と英語で出す | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`page-chunk-failure-names-the-page`が通る | #3288 |
| 編集画面を開いている間に裏で読む頁の塊が読めなくても、頁を読み直さず書いた記法が残る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`editor-keeps-text-when-page-chunks-fail`が通る | #3288 |
| 見本帳を組み立てた時、`index.html`が名指すCSSに`@font-face`が無く、後から読むCSSに在る | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`first-load-css-carries-no-font-face`が通る | #3292 |
| 見本帳を組み立てた時、最初に読むscriptとCSSの合計が今の上限213KBより小さい新しい上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3292 |
| 初めて開く端末で、字のCSSの読み込みが最初の画面を描いた後に始まる | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`first-visit-reads-font-css-after-first-screen`が通る | #3292 |
| 2度目に開く端末で、字のCSSを読み終えるまで最初の画面を描かない | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`second-visit-reads-font-css-before-first-screen`が通る | #3292 |
| 字のCSSを読めない時、初めての端末でも2度目の端末でも、頁のCSSが効いた最初の画面が出る | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`font-css-failure-still-draws-first-screen`が通る | #3292 |
| 開いた後、`document.fonts`に字が載り、字の`file`を読む | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`font-faces-reach-the-page`が通る | #3292 |
| `localStorage`を使えないbrowserで開いた時、最初の画面が出て、`document.fonts`に字が載る | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`no-storage-still-draws-first-screen`が通る | #3292 |
| 字のCSSを読む時に、CSPの違反が出ない | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`font-css-respects-csp`が通る | #3292 |
| 見本帳を組み立てた時、元のNotoの番号付きの面の`unicode-range`に、切り出した字と`latin`の面の字が1字も無い | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-trims-original-faces`が通る | #3296 |
| 見本帳を組み立てた時、字のCSSが切り出した字の`file`を名指す`@font-face`を1件持ち、`font-weight`が`100 900` | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-has-one-face`が通る | #3296 |
| 幅1440pxと幅390pxで、概要の頁と編集画面と使い方の頁を開いた時に読む字の`file`がどれも3件 | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-reads-three-files`が通る | #3296 |
| 組み立て結果のscriptとCSSに在るNotoの字が全て切り出した字に入り、抜けた時は抜けた字を名指して落ちる | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-covers-every-word`が通る | #3296 |
| 字を作る命令に版の違う字を渡すと、字の`file`を書き換えず終わり方1で止まる | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-refuses-other-source`が通る | #3296 |
| 切り出した字の`file`の隣に字の利用許諾`OFL`の全文が在る | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-carries-license`が通る | #3296 |
| 切り出した字に無い字を頁に足すと、元の字の`file`を読み、端末の字ではなく頁の字で描かれる | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`unlisted-char-reads-original-file`が通る | #3296 |
| 「文章で書くと、動く図になる」の幅が、字の間隔の情報の分だけ字数より狭い | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-keeps-kerning`が通る | #3296 |
| 開いた後、`document.fonts`に字が載り、字の`file`を読む | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`font-faces-reach-the-page`が通る | #3296 |
| 字のCSSを読む時に、CSPの違反が出ない | `pnpm exec vitest run apps/playground-spa/src/lib/font-chunks.test.ts`の検査`font-css-respects-csp`が通る | #3296 |
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
