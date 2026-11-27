# judge-diagram

| Criterion | How to check | Origin |
|---|---|---|
| `judge`で規則5つと例6つを書いた時、行に例、列に規則、最後の列に判定を置いたHTMLの表を描く | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-draws-html-table` passes | #3879 |
| 例の下に`fail`を書いた規則のセルだけが✕とその外れた値を持ち、書かない規則のセルは✓になる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-marks-only-written-rules` passes | #3879 |
| 再生すると、段の送り1回で規則の列を左から1列ずつ照らして✓と✕を出し、最後の送りで判定を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-plays-column-by-column` passes | #3879 |
| `fail`の行に`[stop]`を書いた時、その後の列のセルが「—」になる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-stop-dashes-later-columns` passes | #3879 |
| 例に`[note: <字>]`を書いた時、例の名前の下にその字を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-case-note-under-name` passes | #3879 |
| 1行目に`[pass: 合格, block: 不合格]`を書いた時、判定の語が替わり、書かない時は「通す」と「止める」(英語は`pass`と`block`) を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-verdict-words-default-and-override` passes | #3879 |
| 枠の幅に収まらない時、表を横に送れて、例の列が左に留まる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-wide-table-scrolls-with-cases-kept` passes | #3879 |
| 印刷の形では、全てのセルと判定を埋めた表を描く | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-print-fills-all-cells` passes | #3879 |
| 幅728pxの枠で、判定の表の字が10.5px以上で描かれる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-text-readable-at-728` passes | #3879 |
| `judge`で始まる原本のJSONを形の検査が受け付け、記法を読んで書き戻すと同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-schema-and-roundtrip` passes | #3879 |
| 宣言していない規則を`fail`に書いた時と、同じ例に同じ規則の`fail`を2度書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-unknown-or-twice-refused` passes | #3879 |
| 最初の`case`より前に`fail`を書いた時と、規則か例が1つも無い時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-before-case-or-empty-refused` passes | #3879 |
| `judge`でない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3879 |
| 判定の表の英語の見本4つ (airdrop-check.en.dragon、refund-check.en.dragon、signup-check.en.dragon、transfer-check.en.dragon) をPNGに書き出すと、幅0で止まらずに、右端の判定の列の札まで切れずに写った画像ができる | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-shows-every-column` passes | #3923 |
| 段を選ばずに書き出した判定の表のPNGは、照らした列の色の帯を付けずに、全ての✓と✕と判定の札を見せる | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-default-shows-all-unlit` passes | #3923 |
| `--step 2`で書き出した判定の表のPNGは、2番目の規則の列を照らした色の帯を持ち、判定の列の札を見せない | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-step-lights-chosen-column` passes | #3923 |
| `--width 390`を渡して書き出した判定の表のPNGは、幅を渡さない時と同じ大きさで全ての列を写す | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-ignores-narrow-width` passes | #3923 |
| 形を選ばずに`dragon export`で判定の表を書き出すと、mp4とGIFとHTMLとPNGの4つを書く | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-export-writes-four-formats` passes | #3923 |
| 判定の表のGIFは、最初のコマで判定の列の札を見せず、最後の段のコマで判定の列の札を見せる | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-film-lights-columns-by-step` passes | #3923 |
| SVGで描く図の種類のPNGは、今と同じく図の`width`と`height`の2倍の大きさで書く | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `png-export-keeps-svg-size` passes | #3923 |
| 判定の表で図に無い段を`--step`に選ぶと、撮らずに断る | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-export-refuses-missing-step` passes | #3923 |
| 判定の表を`dragon export --format svg`で書き出すと、表の枠と地と字と✓と✕と判定の札をSVGの要素で描いたSVGを書き、`foreignObject`を持たない | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-draws-table-with-svg-elements` passes | #3891 |
| 書き出したSVGは全てのセルの✓と✕と「—」と全ての例の判定の語を描き、✕の下に外れた値を描く | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-fills-every-cell-and-verdict` passes | #3891 |
| 書き出したSVGは、例の名前と添え書きをその例の✓と✕の行の上の帯に1行で描き、左の例の列を持たない | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-puts-cases-on-bands` passes | #3891 |
| 判定の表の見本 (送金、会員登録、返金、配布の日本語と英語) のSVGは幅が728px以下で、全ての字が10.5px以上 | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-readable-at-728` passes | #3891 |
| 帯の形でも幅728pxを超える表 (規則を10個書いた表) のSVGは、728pxに収まる所で規則の列を分けて帯の形の表を縦に積み、どの段にも例の帯を、最後の段にだけ判定の列を描く | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-stacks-wide-tables` passes | #3891 |
| 書き出したSVGは描いた字の書体を`data:`で埋め、外のURLを1つも持たない | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-embeds-fonts-offline` passes | #3891 |
| `--palette`と`--theme dark`を渡すと、判定の表のSVGをその色味の暗い色で描く | `pnpm exec vitest run packages/dragon/test/judge-picture.test.ts` check `judge-svg-follows-palette-and-theme` passes | #3891 |
| 判定の表でない図を`--format svg`で書き出すと、最後の段の止め絵のSVGを書き、描いた字の書体を`data:`で埋める | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts` check `export-svg-writes-last-step-still` passes | #3891 |
| `--format`に知らない形を渡すと断り、断りの文の書ける形にsvgを並べる | `pnpm exec vitest run packages/dragon/test/cli-arguments.test.ts` check `cli-rejects-bad-format` passes | #3891 |
| 形を選ばない`dragon export`は今どおりmp4、GIF、HTML、PNGの4つを書き、SVGを書かない | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts` check `export-default-writes-no-svg` passes | #3891 |
| READMEと使い方の頁の書き出しの説明は、書ける形にSVGを並べる | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts` check `export-svg-listed-in-docs` passes | #3891 |
| 判定の表を`--format png`で書き出すと、SVGと同じ帯の形の表を、列を照らさずに幅1456画素以下 (CSSの728pxの2倍) で撮る | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-draws-band-table` passes | #3891 |
| 判定の表のPNGは今どおり全ての規則の列と全ての行の判定の札を切らずに写し、`--step`を選ぶとその段の列を照らし、`--width`に依らず同じ大きさになる | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-png-shows-every-column` and `judge-png-default-shows-all-unlit` and `judge-png-step-lights-chosen-column` and `judge-png-ignores-narrow-width` passes | #3891 |
| 判定の表の書き出しは、図に無い段を`--step`に選ぶと今どおり断り、PNGを書かない | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-export-refuses-missing-step` passes | #3891 |
| 判定の表のGIFとmp4は帯の形の表を幅728px以下で撮る | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-film-draws-band-table` passes | #3891 |
| 判定の表のGIFとmp4は今どおり段ごとに規則の列を照らし、最後の段で判定の札を見せる | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `judge-film-lights-columns-by-step` passes | #3891 |
| 書き出す入口 (`@cardenelabs/dragon/capture`) は、帯の形の判定の表のSVGを受けると、`foreignObject`を持たず字を`data:`で埋めたSVGと、列を照らさないPNGを返す | `pnpm exec vitest run packages/dragon/test/capture.test.ts` check `capture-judge-svg-draws-band-table` and `capture-judge-png-draws-band-table` passes | #3891 |
| 書き出す入口は、帯の形の判定の表のGIFとmp4を、段ごとに列を照らして作る | `pnpm exec vitest run packages/dragon/test/capture.test.ts` check `capture-judge-film-draws-band-table` passes | #3891 |
| 編集画面で判定の表を描き、書き出す窓のPNG、SVG、GIF、mp4を押すと、書き出す入口に帯の形の表のSVGを渡し、fileを保存させる | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx` check `editor-export-judge-passes-band-picture` passes | #3891 |
| 見本帳の判定の表の札で、書き出す窓のPNGを押すと、書き出す入口に帯の形の表のSVGを渡す | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-bar.test.tsx` check `catalog-export-judge-passes-band-picture` passes | #3891 |
| 見本帳の判定の表の札で画像をコピーすると、帯の形の表のSVGから撮ったPNGをコピーする | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-bar.test.tsx` check `catalog-copy-judge-passes-band-picture` passes | #3891 |
| 編集画面と見本帳の書き出す窓のHTMLは、今どおり記法から頁を作る | `pnpm exec vitest run apps/playground-spa/src/editor/export-menu.test.tsx` check `editor-export-judge-saves-file` passes | #3891 |
| 頁に置く判定の表と再生する表は今どおりHTMLの表で、字を縮めない | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-text-readable-at-728` passes | #3891 |
| SVGで描く図の種類の書き出す入口のPNGとSVGと動画は、今と同じ大きさと字で書く | `pnpm exec vitest run packages/dragon/test/capture.test.ts` check `capture-still-any-svg` and `capture-film-matches-export` passes | #3891 |
| SVGで描く図の種類の命令の書き出しのPNGは、今と同じ大きさで書く | `pnpm exec vitest run packages/dragon/test/judge-export.test.ts` check `png-export-keeps-svg-size` passes | #3891 |
