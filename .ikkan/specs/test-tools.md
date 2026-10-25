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
| 一式 (型検査、build、lint、検査) が終了 0 で終わる | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3107 |
