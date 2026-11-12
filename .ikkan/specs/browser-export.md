# browser-export

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 描く入口 (`@cardenelabs/dragon`) の`editorUrl`に記法を渡すと、エディタの`/dragon/editor`の頁のURLを返し、その`#`から後ろを`apps/playground-spa/src/share.ts`の`fromHash`に渡すと、日本語と絵文字を含む記法でも同じ文字列が返る | `pnpm exec vitest run packages/dragon/test/editor-url.test.ts`の検査`editor-url-roundtrip`が通る | #3644 |
| `editorUrl`に`base`を渡すと、その置き場の`editor`の頁のURLを返し、渡さない時は公開したエディタの置き場を使う | `pnpm exec vitest run packages/dragon/test/editor-url.test.ts`の検査`editor-url-base`が通る | #3644 |
| エディタの共有のURLは描く入口の関数で作り、`share.ts`は記法をURLの形にする処理を自分で持たない | `pnpm exec vitest run packages/dragon/test/editor-url.test.ts`の検査`playground-share-uses-package`が通る | #3644 |
| 書き出す入口 (`@cardenelabs/dragon/capture`) が package の`exports`に在り、Node の組み込みの module を読まない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`capture-entry-browser-safe`が通る | #3644 |
| 描く入口の書き出した file は、詰める道具 (`gifenc`と`mediabunny`) を読まない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`main-entry-skips-encoders`が通る | #3644 |
| Chromium の頁で描いた図を書き出す入口の関数に渡すと、GIFとMP4のBlobを返し、コマの数と縦横の大きさが同じ図を`exportDiagram`で書き出したfileと同じになる | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-film-matches-export`が通る | #3644 |
| dragonの図でないSVGを渡すと、縦横を2倍にしたPNGのBlobと、描いた字を埋めたSVGの文字列を返す | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-still-any-svg`が通る | #3644 |
| 書き出したSVGは、描いた字の範囲に当たる字の file だけを`data:`で埋め、描いていない範囲の file を埋めない | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-embeds-used-fonts-only`が通る | #3644 |
| 頁が字の file を読めない時、書き出す入口の関数は読めない字の名前と範囲を名指して断り、字の無い画像を返さない | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-refuses-unreadable-font`が通る | #3644 |
| エディタの図の上の道具の列の右端に「書き出す」の釦が在り、押すとPNG、SVG、GIF、MP4を選ぶ小さな窓が開き、Escで閉じる | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx`の検査`editor-export-menu-lists-formats`が通る | #3644 |
| エディタの書き出す窓で形を選ぶと、書き出す入口の関数を呼んでその形のfileを保存し、書き出している間は同じ釦を押せない | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx`の検査`editor-export-saves-chosen-format`が通る | #3644 |
| エディタの図の下の`dragon export`の案内が残る | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx`の検査`editor-export-keeps-cli-hint`が通る | #3644 |
| エディタの頁が最初に読む量は、書き出す入口を足しても上限の中に収まる。書き出す入口は書き出すの釦を押した時に読む | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3644 |
| `dragon export`の命令は、今と同じく4つの形を1度ずつ書き出す | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`four-formats-written-once-from-json`が通る | #3644 |
| 配った後の確かめは、npmの最新の版が包んだ版と違う時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-after-judges-npm-and-pages`が通る | #3644 |
| Chromiumの頁で書き出す入口の`captureHtml`に記法を渡すと、同じ記法を`exportDiagram`で書いたHTMLと、字の`@font-face`の中身を除いて同じ文字列を返す | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-html-matches-export`が通る | #3667 |
| `captureHtml`が返したHTMLを、外を読めない別のChromiumの文脈で開くと、図と再生の帯が描かれ、頁の外へ1度も読みに行かない | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-html-opens-offline`が通る | #3667 |
| 頁が字のfileを読めない時、`captureHtml`は読めない字の名前と範囲を名指して断り、字の無いHTMLを返さない | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-html-refuses-unreadable-font`が通る | #3667 |
| 書き出す入口を読んだだけでは再生の部品のfileを読まず、`captureHtml`を呼んだ時に1度だけ読む | `pnpm exec vitest run packages/dragon/test/capture.test.ts`の検査`capture-html-loads-player-on-call`が通る | #3667 |
| 常に、書き出す入口はpackageの`exports`に在り、Nodeの組み込みのmoduleを読まない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`capture-entry-browser-safe`が通る | #3667 |
| 常に、`dragon export`の命令は4つの形を1度ずつ書き出す | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`four-formats-written-once-from-json`が通る | #3667 |
| エディタの「書き出す」の窓は、PNG、SVG、GIF、MP4、HTMLを選べる | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx`の検査`editor-export-menu-lists-formats`が通る | #3667 |
| エディタの書き出す窓でHTMLを選ぶと、`captureHtml`を呼んで`.html`のfileを保存する | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx`の検査`editor-export-saves-chosen-format`が通る | #3667 |
| 常に、エディタの頁が最初に読む量は上限の中に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3667 |
| 常に、scriptの1行の入口が最初に読む量は上限の中に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3667 |
| 常に、配った後の確かめは、npmの最新の版が包んだ版と違う時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-after-judges-npm-and-pages`が通る | #3667 |
