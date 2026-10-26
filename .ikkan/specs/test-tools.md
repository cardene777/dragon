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
| 一式 (型検査、build、lint、検査) が終了 0 で終わる | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3107 |
