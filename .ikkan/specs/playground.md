# playground

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 編集画面 (`/dragon/editor`) を開いた時、書く欄に OAuth の見本の記法が入り、右に OAuth の図が描かれて段が進む | `pnpm test`の検査`playground-opens-with-oauth`が通る | #2995、#3030 |
| 書く欄の記法を書き換えた時、右の図が書き換えた内容で描き直される | `pnpm test`の検査`editing-notation-redraws-diagram`が通る | #2995 |
| 記法に誤りがある時、誤りの行の番号と理由を欄の下の知らせの欄に出し、図は最後に描けた図のまま残す | `pnpm test`の検査`notation-error-shows-line-and-keeps-diagram`が通る | #2995、#3031 |
| JSON の側に切り替えた時、今の図の JSON が出て、JSON を書き換えると図と記法の側に反映する | `pnpm test`の検査`json-side-edits-sync-to-notation`が通る | #2995 |
| JSON に誤りがある時、eval を許さない頁の CSP の下で、誤った欄の場所 (JSON Pointer) と理由を出す | `pnpm test`の検査`json-error-shows-pointer-under-csp`が通る | #2995 |
| 編集画面の左の棚の見本の一覧で入門の例か CCIP を選んだ時、その見本の記法が欄に入り、図が替わる | `pnpm test`の検査`example-picker-loads-example`が通る | #2995、#3031 |
| 書いた中身が URL の `#` の後ろに入り、その URL を新しく開くと同じ記法と図が出る | `pnpm test`の検査`url-hash-restores-notation`が通る | #2995 |
| 言葉を EN に切り替えた時、頁の言葉と選んでいる見本が英語版になる。端末の言語が日本語でない時は英語で開く | `pnpm test`の検査`english-switches-page-and-example`が通る | #2995 |
| 見本 3 つの英語版が、日本語版と同じ数の箱と線と段を持つ | `pnpm test`の検査`english-examples-match-japanese`が通る | #2995 |
| 色味 3 案を編集画面で、明暗を上の帯で選んだ時、図の地の色と字の色が選んだ色味と明暗の値になり、頁の地は色味で替わらず前のサイトの明暗の値になる | `pnpm test`の検査`palette-and-theme-apply-to-diagram`が通る | #2995、#3030 |
| 明暗を選んでいない時は端末の明暗の設定に従い、図の色味は紙と墨で開き、頁の地は前のサイトの明暗の値になる | `pnpm test`の検査`theme-follows-device-by-default`が通る | #2995、#3030 |
| 頁の字が、図と同じ同梱した字 (Noto Sans JP と JetBrains Mono) で描かれる | `pnpm test`の検査`page-text-uses-bundled-fonts`が通る | #2995 |
| 前に共有した URL (`/dragon/#n=...`) を開いた時、編集画面 (`/dragon/editor`) へ移り、`#` の後ろの記法が書く欄に入る | `pnpm test`の検査`old-share-link-opens-editor`が通る | #3030 |
| 幅 390px で開いた時、図が書く欄の上に来て、書く欄を畳める | `pnpm test`の検査`narrow-width-stacks-diagram-above-editor`が通る | #2995 |
| 頁に書き出しの命令 (`dragon export`) の案内があり、「作り直しの最中」の案内の文が無い | `pnpm test`の検査`page-shows-export-command-not-rebuilding-notice`が通る | #2995 |
| build した頁の script と CSS の合計が、gzip で 250KB 以下に収まる | `pnpm test`の検査`page-bundle-within-budget`が通る | #2995 |
| 頁の図を描く code が `@cardenelabs/dragon` の部品を呼び、`apps/playground-spa` の中に SVG を組む code が無い | `pnpm test`の検査`page-draws-with-package-parts`が通る | #2995 |
| 配る頁の CSP が、script を自分の置き場だけにし、inline と eval を許さない | `pnpm test`の検査`csp-script-self-only`が通る | #2995 |
| 重なりの一覧の各件が、重なる字の四角を持つ (2 つの字の重なりは 2 つ、線が字を横切る所は横切られる字の 1 つ) | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-carry-rects`が通る | #3178 |
| 重なりを知らせる文は、重なる 2 つの字を日本語と英語で書き、段の番号を「段の番号 N」(英語は `step number N`) と呼ぶ | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`overlap-message-in-both-languages`が通る | #3178 |
| 再生の部品の段へ移る呼び出しで、図がその段で止まる | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`player-goes-to-step`が通る | #3178 |
| 再生の部品に四角を渡すと、図の上に点線の四角を描き、空を渡すと消す。止めて見せる図でも寄って追う図でも、四角は図の中身と同じ所に在る | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`player-marks-rects`が通る | #3178 |
| 書き出しの命令が字の重ならない図を書き出す時、標準エラーに何も出さない | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`export-quiet-without-overlaps`が通る | #3178 |
| 編集画面で字の重ならない見本を開いた時、「読めています」だけが出て、重なりの欄も図の上の囲みも出ない | `pnpm exec vitest run apps/playground-spa/src/lib/overlap-notice.test.ts`の検査`editor-quiet-without-overlaps`が通る | #3178 |
| 頁の側では SVG を組まない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-draws-with-package-parts`が通る | #3178 |
| 全ての見本の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3178 |
