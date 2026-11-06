# test-tools

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 変異の一覧の 1 件を渡すと、道具が書き換える file の書き換え前の字を書き換え後の字に替えてから検査を回す | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-applies-before-running`が通る | #3107 |
| 検査が落ちた時、落ちた検査の名前を変異ごとに 1 行で結果の file に記録する | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-records-failed-names`が通る | #3107 |
| 検査が通った時も、落ちた時も、検査を起こせずに止まった時も、書き換えた file が HEAD の中身に戻る | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-restores-from-head`が通る | #3107 |
| 検査の前の build が終わり方 0 以外で終わった時と、検査の命令が集計の行を出さずに終わった時 (途中で止めた時を含む) は、その変異を測れなかったと記録して落ちた検査の名前を残さず、次の変異へ進まずに止まる | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-stops-on-unfinished-run`が通る | #3107 |
| 書き換え前の字が file の中に無いか 2 か所以上ある変異は、書き換えず検査も回さず、理由を記録して次の変異へ進む | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-skips-ambiguous-target`が通る | #3107 |
| `packages/dragon/src` の下を書き換える変異では検査の前と戻した後に描画の package を build し直し、それ以外の変異では build しない | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-rebuilds-package-sources`が通る | #3107 |
| 変異が検査の名前を持つ時はその名前に絞って回し、`--wide` を付けた時は絞らずに渡した file の検査を全部回す | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-narrows-by-names`が通る | #3107 |
| `pnpm test:mutation:values` が `scripts/mutate-values.mjs` を起こす | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-is-a-package-script`が通る | #3107 |
| 道具の冒頭の説明が、使い方と、Stryker では頁の中の値を確かめられない理由と、変異の一覧の書き方の例を持ち、例は道具が読める形をしている | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-header-example-parses`が通る | #3107 |
| 変異の一覧と結果の file と step の番号を渡すと、`## 壊して測った結果 (step N)` の見出しの後に `壊した所` と `落ちた判定の件数` の 2 列の表が続き、一覧の順に 1 変異 1 行で、壊した所は変異の `id` と `what` と落ちた検査の名前、件数は落ちた検査の数になる | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-lists-each-mutant`が通る | #3130 |
| どの検査も落ちなかった変異は、件数が 0 の行になる | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-counts-a-survivor-as-zero`が通る | #3130 |
| 書き換えずに飛ばした変異は件数の欄が `飛ばした` で、測れなかった変異は `測れなかった` で始まり、どちらも結果に残った理由が続く | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-names-skipped-and-unfinished`が通る | #3130 |
| 一覧に在るのに結果に行が無い変異 (測れなかった変異の後で止まった変異など) は、件数の欄が `回していない` の行になる | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-marks-mutants-not-run`が通る | #3130 |
| 結果の file に同じ変異の行が 2 つ以上在る時は、最後の行で表を作る | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-uses-the-last-row`が通る | #3130 |
| 壊した所の字が表の縦線を含む時は逆斜線を前に付けて逃がし、表が 2 列のまま読める | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-escapes-pipes`が通る | #3130 |
| `pnpm test:mutation:table` が `scripts/mutate-values.mjs` の表を作る呼び方を起こし、引数が 2 つの file と `--step <数>` でない時と、結果に一覧に無い変異の行が在る時は、表を出さず終わり方 2 で止まる | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-is-a-package-script`と`mutation-table-refuses-bad-input`が通る | #3130 |
| 変異を回す命令 (`pnpm test:mutation:values`) は、今どおり落ちた検査の名前と飛ばした理由を結果の file に記録する | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutate-values-records-failed-names`と`mutate-values-skips-ambiguous-target`が通る | #3130 |
| 検査を回した変異の行は、壊した所の括弧の中の最後に、変異が `names` を持ち `wide` でない回なら `名前で絞った回`、`wide` か `names` 無しの回なら `全部の検査で回した回` を書き、行は 2 列のまま読める | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-names-the-run`が通る | #3134 |
| 飛ばした変異と回していない変異の行には、回し方を書かない | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-leaves-unrun-rows-unmarked`が通る | #3134 |
| #3130 で足した表の検査が、回し方を書き足した形で通る | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-lists-each-mutant`と`mutation-table-counts-a-survivor-as-zero`と`mutation-table-names-skipped-and-unfinished`と`mutation-table-marks-mutants-not-run`と`mutation-table-uses-the-last-row`と`mutation-table-escapes-pipes`と`mutation-table-is-a-package-script`が通る | #3134 |
| 引数の形が違う時と結果に一覧に無い変異の行が在る時は今どおり終わり方 2 で止まり、変異を回す命令は今どおり落ちた検査の名前を記録する | `pnpm exec vitest run packages/dragon/test/mutate-values.test.ts`の検査`mutation-table-refuses-bad-input`と`mutate-values-records-failed-names`が通る | #3134 |
| 一式 (型検査、build、lint、検査) が終了 0 で終わる | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3107 |
| 頁を開く支え (`site.open`) に動きを嫌う設定を渡して開いた頁は、読み込みの最初の瞬間に `(prefers-reduced-motion: reduce)` が当たっている。渡さずに開いた頁では当たっていない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`open-sets-reduced-motion-before-load`が通る | #3231 |
| apps/playground-spa/src/lib の画面の検査の file で、`emulateMedia` で動きを嫌う設定を当てる所が 0 か所 | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-tests-set-motion-at-open`が通る | #3231 |
| 指で触る頁を開く時、支えは `(pointer: coarse)` が当たるまで待つ。当たらない頁では、決めた時間で「指で触る設定 (pointer: coarse) が当たらない」と頁の path を名指して落ちる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`touch-open-waits-for-coarse`が通る | #3231 |
| 部品の頁で、どの図でも使える部品を図の種類ごとに描き、段を 1 つずつ送れる | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-parts.test.ts`の検査`catalog-common-part-shows-both-kinds`が通る | #3231 |
| 枝分かれの図の部品の頁で、図を 1 段目から 1 段ずつ送れる | `pnpm exec vitest run apps/playground-spa/src/lib/git-catalog.test.ts`の検査`catalog-has-four-git-parts`が通る | #3231 |
| 指で触る幅の時系列図の分類の頁で、検索に字を入れた時とコードの側と重ね窓の部品が 44px に届く | `pnpm exec vitest run apps/playground-spa/src/lib/site-catalog-touch.test.ts`の検査`coarse-catalog-touch-targets-after-action`が通る | #3231 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了0 | #3231 #3300 #3379 |
| `startSite`で開いた頁 (概要、編集画面、カタログの一覧) が描けるまでに、手元の HTTP の server が browser から受けた要求が0件 | `pnpm exec vitest run`の検査`site-pages-skip-the-local-server`が通る | #3379 |
| 拡張子の無い経路には同じ名前の`.html`を、無い path には`404.html`を 404 で返す規則が、browser で開いた頁でも node からの問いでも同じに働く | `pnpm exec vitest run`の検査`page-routes-answer-200`と`pages-open-directly`と`unknown-catalog-routes-are-not-found`が通る | #3379 |
| 頁の塊の読み込みを止めた頁で、読み直しを促し、頁を1度だけ読み直す | `pnpm exec vitest run`の検査`page-chunk-failure-offers-reload`と`page-chunk-failure-reloads-once`が通る | #3379 |
| カタログの記法の読み込みを遅らせても、図の大きさを保つ | `pnpm exec vitest run`の検査`catalog-holds-figure-size-until-notation-arrives`が通る | #3379 |
| 後から読む図の種類の塊を待つ間、図はその塊を待つ | `pnpm exec vitest run`の検査`figure-waits-for-later-kind`が通る | #3379 |
| 2度目に開いた頁は、字の CSS を最初の画面より前に読む | `pnpm exec vitest run`の検査`second-visit-reads-font-css-before-first-screen`が通る | #3379 |
| カタログの部品の経路が build され、node からの問いに 200 で答える | `pnpm exec vitest run`の検査`catalog-part-routes-built`が通る | #3379 |
| 変えた検査の file を関係する検査を回す命令に渡した時、命令はその file を選ぶ | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-runs-changed-test-file`が通る | #3381 |
| 変えた src の file を渡した時、命令はその file へ import でたどれる検査の file を選び、たどれない検査の file を選ばない | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-picks-importers`と`related-skips-non-importers`が通る | #3381 |
| package の名前 (`@cardenelabs/dragon`) で読む検査と、build した命令や頁を起こす検査は、その元の src の file を変えた時に選ばれる | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-follows-package-and-built-entries`が通る | #3381 |
| import でたどれない材料 (見本の file、README、変更履歴、build の設定) を変えた時、命令は表がその材料に結ぶ検査の file を選ぶ | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-maps-materials-by-table`が通る | #3381 |
| 表に載った材料の名前を書く検査の file は、全て表がその材料に結んでいる | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-table-covers-material-readers`が通る | #3381 |
| 表にも import にも当たらない file を変えた時、命令は検査を回さず、その file の名前を出して終わり方1で止まる | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-names-unmapped-material`が通る | #3381 |
| file を渡さない時、命令は既定の枝から分かれた後の変更を、commit していない変更も含めて対象にする | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-defaults-to-branch-changes`が通る | #3381 |
| 命令は回す前に、選んだ検査の file の名前と数を出す | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-prints-chosen-files`が通る | #3381 |
| 1件の検査とその前後処理の上限が10秒で、超えた検査は止まって落ち、名前が出る | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`test-limit-is-ten-seconds`と`test-over-limit-is-stopped-and-named`が通る | #3381 |
| 1回の実行の上限が5分で、超えた時は実行全体が止まり、終わっていない検査の名前を出して終わり方1で終わる | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`run-limit-is-five-minutes`と`run-limit-stops-whole-run`が通る | #3381 |
| 見本帳の頁は1回の実行で1度だけ build され、頁を開く検査の file は全てその build を使う | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`site-built-once-per-run`が通る | #3381 |
| 外した検査はどの検査の file にも無く、外した検査ごとに理由と、同じ守りを担う残りの検査の名前が`docs/removed-tests.md`に在り、その残りの検査は在る | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`removed-tests-are-gone-and-covered`が通る | #3381 |
| `.ikkan/specs/`の行が名指す検査は、全て検査の file に在る | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`spec-rows-name-existing-tests`が通る | #3381 |
| `.ikkan/checks.md`が一式を軽いと宣言する | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`checks-declare-light-suite`が通る | #3381 |
| `docs/maintaining.md`が、課題ごとには関係する検査を命令で回し、一式は版を出す前の1回だけ回すと書く | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`maintainer-notes-name-related-runner`が通る | #3381 |
| `dist`が`src`より古い時は、検査を回す前に止まる | `pnpm exec vitest run packages/dragon/test/dist-freshness.test.ts`の検査`"dist が古ければ stale"`が通る | #3381 |
| 書き出しの4つの形と、同じ原本から2度書き出した結果の一致を確かめる検査が残る | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-writes-four-formats`と`export-is-deterministic`が通る | #3381 |
| 一式が通り、検査の実行は5分の上限に止められない | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終わり方0で終わる | #3381 |
| 頁を開く検査の file では、file を読む前の準備の段 (`setupFiles`) が Chromium を起こし始め、`startSite()`は自分で Chromium を起こさずにそれを使う | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`chromium-preloaded-before-file`が通る | #3388 |
| 頁を開かない検査の file では、準備の段は Chromium を起こさない | `pnpm exec vitest run apps/playground-spa/src/lib/chromium-preload.test.ts`の検査`chromium-not-preloaded-without-pages`が通る | #3388 |
| 検査の file の前後処理は Chromium を閉じず、file の process が終わると、Chromium の process と作業用の folder が残らない | `pnpm exec vitest run apps/playground-spa/src/lib/chromium-preload.test.ts`の検査`chromium-cleaned-on-process-exit`が通る | #3388 |
| 続きを回す命令が止める段に渡す書き先 (`DRAGON_UNFINISHED_OUT`) を、検査の file の process は受け継がず、検査が起こした vitest はそこへ書かない | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`unfinished-out-not-inherited-by-tests`が通る | #3388 |
| `startSite`で開いた頁が描けるまでに、手元の HTTP の server が browser から受けた要求が0件 | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`site-pages-skip-the-local-server`が通る | #3388 |
| 外した検査は検査の file に無く、同じ守りを担う検査が在る | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`removed-tests-are-gone-and-covered`が通る | #3388 |
| 頁を開く検査の file を含まない回は、準備の段が見本帳を build しない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`site-setup-skips-without-pages`が通る | #3384 #3388 |
| 見本帳の頁は1回の実行で1度だけ build され、頁を開く検査が今どおり通る | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/site-pages.test.ts`の検査`site-built-once-per-run`と`site-palette-switch-draws-arcade`が通る | #3384 #3388 |
| 編集画面で書き出した`.dragon`の file の名前と中身を、検査が今どおり確かめる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`editor-imports-and-exports-notation`が通る | #3384 #3388 |
| 1件の検査とその前後処理の上限10秒と、1回の実行の上限5分は変わらない | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`test-limit-is-ten-seconds`と`run-limit-is-five-minutes`が通る | #3384 #3386 |
| 1件の検査とその前後処理の上限10秒と、1回の実行の上限5分は変わらず、上限で止めた時は書き先に終わっていない file を書く | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`test-limit-is-ten-seconds`と`run-limit-is-five-minutes`と`run-limit-writes-unfinished-files`が通る | #3388 |
| 1回の実行の上限で止めた時、止める段は環境変数`DRAGON_UNFINISHED_OUT`が名指す file に、終わっていない検査の file と、終わった file で落ちた検査の名前を書く | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`run-limit-writes-unfinished-files`が通る | #3386 |
| `pnpm test:related`は、実行が上限で止まった時に終わっていない file だけを次の実行で回し、全部が回って落ちた検査が無ければ終わり方0で終わる | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-continues-unfinished-files`が通る | #3386 |
| 続きの実行で終わっていない file が前の実行より減らなかった時は、そこで止まり、残った file の名前を出して終わり方1で終わる | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-stops-without-progress`が通る | #3386 |
| 上限で止まった実行の中で終わった file に落ちた検査が在った時は、続きが全部通っても終わり方1で終わり、落ちた検査の名前を出す | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-keeps-failures-across-runs`が通る | #3386 |
| 1回の実行の上限を超えると、終わっていない検査の名前を出し、残りを回さずに終わり方1で止まる | `pnpm exec vitest run packages/dragon/test/test-limits.test.ts`の検査`run-limit-stops-whole-run`が通る | #3386 |
| `pnpm test:related`が変えた file から選ぶ検査の file と、選んだ file の一覧の出し方は変わらない | `pnpm exec vitest run packages/dragon/test/test-related.test.ts`の検査`related-runs-changed-test-file`と`related-picks-importers`と`related-prints-chosen-files`が通る | #3386 |
| npmに出すfileの一覧は、`package-files.test.ts`を回す時だけ準備の段が`npm pack --dry-run`を1度だけ起こして出し、検査はその一覧を読む。`package-files.test.ts`はnpmを起こすcodeを持たない | `DRAGON_TEST_LIMIT_MS=4000 pnpm exec vitest run packages/dragon/test/package-files.test.ts --maxWorkers=1`の検査`pack-list-comes-from-setup`が通る | #3410 |
| 上限を4秒に下げても、npmに出すfileに見本帳の分が入らないことを確かめる検査が通る | `DRAGON_TEST_LIMIT_MS=4000 pnpm exec vitest run packages/dragon/test/package-files.test.ts --maxWorkers=1`の検査`package-excludes-catalog-material`が通る | #3410 |
| 全ての見本を1件で描いていた検査 (`arcade`の角の3件、軽い入口と既定の入口のSVGの一致、運ぶ物の置き場) が見本ごとの検査に分かれ、上限を4秒に下げても全て通る | `DRAGON_TEST_LIMIT_MS=4000 pnpm exec vitest run packages/dragon/test/arcade-corners.test.ts packages/dragon/test/light-entry.test.ts apps/playground-spa/src/lib/carrier-slot.test.ts --maxWorkers=1`の検査`arcade-cuts-box-region-frame-corners`、`arcade-draws-no-rounded-corner`、`other-palettes-keep-rounded-corners`、`light-entry-draws-same-svg`、`carriers-clear-in-every-example`が通る | #3410 |
| 重ね窓の3件 (図の全体が見える、段を送っても図が動かない、狭い幅の段の本文) が分類の見本ごとの検査に分かれ、上限を4秒に下げても全て通る | `DRAGON_TEST_LIMIT_MS=4000 pnpm exec vitest run apps/playground-spa/src/lib/site-overlay.test.ts --maxWorkers=1`の検査`catalog-overlay-figure-whole-without-scroll`、`overlay-figure-steady-across-steps`、`narrow-caption-steady-and-inside`が通る | #3410 |
| 書き出しの命令か関数を起こす7件が1件1回の書き出しに分かれ、書き出す図と形式をその検査が確かめる最小にして、上限を4秒に下げても全て通る | `DRAGON_TEST_LIMIT_MS=4000 pnpm exec vitest run packages/dragon/test/export.test.ts packages/dragon/test/export-language.test.ts packages/dragon/test/overlap-cli.test.ts --maxWorkers=1`の検査`html-export-draws-every-kind`、`export-writes-four-formats`、`export-video-follows-camera`、`export-frame-counts-follow-rates`、`gif-palette-fits-format`、`export-lang-flag`、`export-warns-overlaps`が通る | #3410 |
| 同時に動かす数は4のままで、上限を超える数を書いた設定を断る | `pnpm exec vitest run packages/dragon/test/vitest-timeout-config.test.ts`の検査`max-workers-within-limit`と`max-workers-check-rejects-unset-and-larger`が通る | #3410 |
