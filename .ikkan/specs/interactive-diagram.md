# interactive-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 1行目を`try`にし、`route`、`queue`、`chain`、`ask`、`press`の部品の行を上から並べた記法を読むと原本 (図のJSON) ができ、原本の形の検査がその原本を通す | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-notation-parses`が通る | #3337 |
| 部品の行を置けない所に書くと、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-misplaced-line-names-line-and-column`と`interactive-errors-in-english-carry-no-kana`が通る | #3337 |
| ほかの図の種類の原本では、`try`、`route`、`queue`、`chain`、`ask`、`press`を箱の名札として読む | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`notation-keeps-interactive-words-plain-outside-interactive`が通る | #3337 |
| 原本を記法に書き戻して読み直すと、元の原本と同じJSONになる | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-round-trip-keeps-json`が通る | #3337 |
| 図を開いた時、読み手が釦を押すまで段が進まない | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-waits-for-the-reader`が通る | #3337 |
| 入力の帯に値を打ち込んで送ると、チップが1枚でき、段が1つ足される | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-send-adds-chip-and-step`が通る | #3337 |
| 網はチップを送り手から作る人まで最短の道で運ぶ | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-net-takes-the-shortest-path`が通る | #3337 |
| 作る釦を押すと、待ち行列のチップが書き手の決めた欄の高い順に、書き手の決めた数まで機械の列の新しいブロックへ移る | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-build-moves-top-n-by-field`が通る | #3337 |
| 待ち行列が空の間、作る釦は押せない | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-build-disabled-when-queue-empty`が通る | #3337 |
| 新しいブロックのprevが1つ前のブロックのhashと同じ値になる | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-prev-matches-previous-hash`が通る | #3337 |
| ブロックのhashは、中身から`node:crypto`のSHA-256で出した値と頭の4字が一致する | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-hash-is-sha256-of-contents`が通る | #3337 |
| ブロックの中身を書き換えると、次のブロックとのつながりが食い違いの印 (橙の≠) に変わり、元の値に戻すと印も戻る | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-edit-breaks-next-link`と`interactive-restore-heals-link`が通る | #3337 |
| 待ち行列の箱に縦に収まる数までチップがたまると、送る釦が押せなくなり、押せない理由を出す | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-queue-full-disables-send`が通る | #3337 |
| 機械の列は新しい方から3つのブロックを出し、それより古いブロックを畳む | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-chain-shows-latest-three`が通る | #3337 |
| チップは名前と、並べる順に使う欄の値だけを出す | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-chip-shows-name-and-order-value`が通る | #3337 |
| 釦は書き手が置いた所に出て、置き場を書かなければ入力の帯に出る | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-button-sits-where-written`と`interactive-button-defaults-to-strip`が通る | #3337 |
| 幅390pxでは線の上の釦も入力の帯へ移り、全ての操作が幅に収まって縦横44px以上の大きさを持つ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-controls-fit-390-at-44px`が通る | #3337 |
| 動きを減らす設定では、釦を押した時に動きを飛ばして結果だけを描く | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-reduced-motion-jumps-to-result`が通る | #3337 |
| 図を描き直すと打ち込んだ値と足した段は残らない | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-remount-keeps-nothing`が通る | #3337 |
| 図を動かしている間、保存の道具を使わず、頁の外への通信が0件である | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-uses-no-storage-or-network`が通る | #3337 |
| 書き出しと印刷では、書き手が例として書いた段を描く | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-export-draws-author-steps`が通る | #3337 |
| 見本「トランザクションがブロックに入るまで」の日本語と英語の`.dragon`と`.json`が`packages/dragon/examples/`に在り、記法を読んだ原本がJSONと一致し、bitsumiの色味で描ける | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`tx-block-example-matches-json`と`tx-block-example-renders-in-bitsumi-palette`が通る | #3337 |
| 見本帳の部品の頁に新しい部品が出て、編集画面の棚から新しい種類を書き始められる | `pnpm exec vitest run apps/playground-spa/src/lib/interactive-catalog.test.ts`の検査`catalog-lists-interactive-parts`と`shelf-starts-interactive-diagram`が通る | #3337 |
| 使い方の頁、2つのREADME、日本語と英語の手引きに新しい種類の書き方が載る | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`docs-describe-interactive-kind`が通る | #3337 |
| `CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedに新しい種類と語が載る | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`changelog-lists-interactive-kind`が通る | #3337 |
| 今の図の描き方、見本、部品の頁、文字の重なり、値の表、頁の大きさの検査が通る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts packages/dragon/test/notation.test.ts packages/dragon/test/look.test.ts apps/playground-spa/src/lib/catalog-parts.test.ts apps/playground-spa/src/lib/text-overlaps.test.ts apps/playground-spa/src/lib/playground.test.ts`の検査`auction-renders-7-steps`と`every-dragon-file-parses`と`renderers-read-values-from-one-table`と`catalog-parts-cover-every-word`と`overlaps-none-in-every-example`と`page-bundle-within-budget`が通る | #3337 |
| `packages/dragon/examples/tx-block.dragon` を枠324pxで描く時、全体の見せ方 (`fixed`) になり、箱の名前の字が 10.5px 以上 | `pnpm exec vitest run --reporter=verbose`の検査`try-narrow-fixed-readable`が通る | #3366 |
| 同じ枠で描く時、ブロックの鎖のブロック 2 がブロック 1 の下に置かれる | `pnpm exec vitest run --reporter=verbose`の検査`try-narrow-stacks-blocks`が通る | #3366 |
| 同じ枠で描く時、ノードの網の全てのノードと名前が枠の中に入る | `pnpm exec vitest run --reporter=verbose`の検査`try-narrow-route-fits`が通る | #3366 |
| 同じ枠で値を送ってブロックを作った後も、全体の見せ方のまま、作ったブロックが枠の中に入る | `pnpm exec vitest run --reporter=verbose`の検査`try-narrow-new-block-fits`が通る | #3366 |
| 枠880pxで描く時、今と同じく網と待ち行列とブロックの鎖を横に広げる並べ方になる | `pnpm exec vitest run --reporter=verbose`の検査`try-wide-keeps-layout`が通る | #3366 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3366 |
