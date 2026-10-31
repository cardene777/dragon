# light-entry

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 軽い入口で種類を読む関数を待った後の`renderDiagram`の SVG が、`packages/dragon/examples`の全ての見本で既定の入口の SVG と同じ | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-same-svg`が通る | #3248 |
| 軽い入口で読んでいない種類を`renderDiagram`か`mountDiagram`で描くと、その種類の名前を含む誤りで止まる | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-refuses-unloaded-kind`が通る | #3248 |
| 軽い入口が package の`exports`に在り、Node の組み込みの module を読まない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`light-entry-browser-safe`が通る | #3248 |
| 既定の入口は種類を読む関数を呼ばずに、`parseNotation`と`renderDiagram`を待たずに続けて呼ぶと全ての種類の見本を描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`default-entry-draws-every-kind`が通る | #3248 |
| 書き出した HTML の頁が、全ての種類の図を部品を後から読まずに描ける | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`html-export-draws-every-kind`が通る | #3248 |
| 見本帳の build で、最初に読む script に git、time、state、tree、lineup の描く部品が無く、それぞれの部品が後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`first-load-leaves-later-kinds-out`が通る | #3248 |
| 見本帳の build で、最初に読む script と CSS の合計が gzip で237KB以下 (検査と同じ数え方の分ける前の実測246.8KBより約10KB小さい) で、全部の塊の合計より20KB以上小さく、落ちた時の文に両方の合計を出す | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts -t page-bundle-within-budget`の検査`page-bundle-within-budget`が通る | #3248 |
| 頁を開くと、最初の画面を描いた後に5種類の塊を裏で読み始める | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`site-prefetches-later-kinds`が通る | #3248 |
| 5種類の塊が届かない間、その種類の図の場所に決まった高さの枠と「読み込み中」を出し、届いたら図に替わる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`figure-waits-for-later-kind`が通る | #3248 |
| 種類の塊の読み込みが落ちると、図の場所に「読み直す」の釦を出す | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`figure-offers-reload-when-kind-fails`が通る | #3248 |
| 編集画面で書き替えた記法の種類の塊を待つ間は前の図を残し、届いたら新しい図に替わる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`editor-keeps-figure-while-kind-loads`が通る | #3248 |
| 5種類の塊を止めたままでも、概要の頁の図は描ける | `pnpm exec vitest run apps/playground-spa/src/lib/kind-chunks.test.ts`の検査`home-draws-without-later-kinds`が通る | #3248 |
