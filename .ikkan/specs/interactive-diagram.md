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
| 試す図の最初の step より前に`choose <欄>: <値>, <値>`の行を書いた記法を読むと、原本の`ask`の部品が欄ごとの選択肢を書いた順で持ち、最初の欄にも選択肢を書け、原本の形の検査がその原本を通す | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-parses-choices`が通る | #3422 |
| 選択肢を持つ原本を記法に書き戻すと、`choose`の行が元の記法と同じ文字列で`ask`の行の後ろに並び、読み直すと元の原本と同じJSONになる | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-round-trip-keeps-notation`が通る | #3422 |
| `ask`の欄に無い欄の`choose`、同じ欄の2度目の`choose`、選択肢が2つ未満の`choose`、選択肢に無い値を書いた`item`と段の中の`ask`は、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-refuses-bad-lines`が通る | #3422 |
| 図を置くと、選択肢を持つ欄は選択肢を書いた順に並ぶ`select`の要素で描かれ、最初の選択肢を選んだ状態で開く | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-draws-select-in-order`が通る | #3422 |
| 常に、選択肢を持たない欄は`input type="text"`の要素で描かれる | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-keeps-text-without-choices`が通る | #3422 |
| `select`で選んで送ると、同じ値を自由入力の欄に打って送った時と同じ段が原本に足される | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-send-matches-typed-send`が通る | #3422 |
| ブロックの中のチップの選択肢を持つ欄を書き換える時、書き換えの欄も同じ選択肢を同じ順に並べた`select`の要素で描かれ、今の値を選んだ状態で開く | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`interactive-choose-edit-uses-select`が通る | #3422 |
| 常に、`choose`の行を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになる | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`が通る | #3422 |
| 英語と日本語のREADMEの試す図の小節と、使い方の頁の試す図の節が、`choose`の行の書き方を持つ | `pnpm exec vitest run packages/dragon/test/interactive-choices.test.ts`の検査`docs-describe-try-choices`が通る | #3422 |
| `packages/dragon/package.json`の`version`が`0.56.0`で、英語と日本語の変更履歴の`## [0.56.0]`の節が`(#3422)`の項を持ち、その項が`choose`を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-56-0-adds-try-choices`が通る | #3422 |
| 試す図の最初の step より前に`side <部品>, <部品>`の行を書いた記法を読むと、原本の試す図が同じ行に置く部品の名前を書いた順で持ち、原本の形の検査がその原本を通す | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-parses-row`が通る | #3429 |
| `side`の行を持つ原本を記法に書き戻すと、`side`の行が元の記法と同じ文字列で並び、読み直すと元の原本と同じJSONになる | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-round-trip-keeps-notation`が通る | #3429 |
| 試す図に無い部品の名前、入力の帯と釦の名前、部品が2つ未満の`side`の行、別の`side`の行に書いた部品、最初の step より後の`side`の行は、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-refuses-bad-lines`が通る | #3429 |
| 枠が広い時、`side`の行に書いた部品の四角は書いた順に左から並び、上端がそろい、互いに重ならない | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-places-parts-in-a-row`が通る | #3429 |
| 枠が広い時、`side`の行に書いた待ち行列はチップと題が入る幅だけを取り、同じ行の網が残りの幅を持つ | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-queue-takes-chip-width`が通る | #3429 |
| 枠が広い時、`side`の行を持つ試す図の高さが、同じ部品を縦に積んだ試す図の高さより低い | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-is-lower-than-stack`が通る | #3429 |
| 横に並べると字が`READABLE_PX`より小さくなる狭い枠では、`side`の行に書いた部品を、`side`の行を持たない試す図と同じ四角で縦に積む | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-stacks-when-narrow`が通る | #3429 |
| 横に並べた時、網を運ばれるチップの道の最後の点が送り先の待ち行列の席に着き、部品の題とチップの四角が重ならない | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-trip-reaches-queue`が通る | #3429 |
| 横に並べた試す図を寄って追う見せ方で再生すると、チップが待ち行列へ入る段の窓がその待ち行列の四角を含む | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-follow-holds-queue`が通る | #3429 |
| 常に、`side`の行を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになり、見本の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts packages/dragon/test/examples-svg.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`と`examples-svg-unchanged`が通る | #3429 |
| 英語と日本語のREADMEの試す図の小節と、使い方の頁の試す図の節が、`side`の行の書き方を持つ | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`docs-describe-try-side`が通る | #3429 |
| `packages/dragon/package.json`の`version`が`0.57.0`で、英語と日本語の変更履歴の`## [0.57.0]`の節が`(#3429)`の項を持ち、その項が`side`を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-57-0-adds-try-side`が通る | #3429 |
| 試す図を描くと、`.dg-bar`が`.dg-frame`の次の兄弟要素に在り、`.dg-try`が`.dg-bar`の次の兄弟要素に在る | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`interactive-caption-sits-under-frame`が通る | #3437 |
| 書き出した試す図の HTML を幅 390px と 1280px で開くと、`.dg-frame`と`.dg-bar`と`.dg-try`の四角が上からこの順に並び、互いに重ならない | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-caption-above-controls`が通る | #3437 |
| 常に、試す図でない図を描くと、`.dg-bar`が`.dg-frame`の次の兄弟要素に在り、`.dg-try`が無い | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-caption-sits-under-frame`が通る | #3437 |
| 常に、幅 390px の試す図で全ての操作が幅に収まり、縦横 44px 以上の大きさを持つ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-controls-fit-390-at-44px`が通る | #3437 |
| `packages/dragon/package.json`の`version`が`0.58.0`で、英語と日本語の変更履歴の`## [0.58.0]`の節が`(#3437)`の項を持ち、その項が段の説明とゲージの帯を図の枠のすぐ下へ移したことを書く | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-58-0-moves-try-caption`が通る | #3437 |
| `ask`の`into`に欄の名前を書いた試す図の記法を読むと、原本の入力の帯の`into`がその欄の名前になり、原本の形の検査がその原本を通し、書き戻すと元の記法と同じ文字列に戻る | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-into-field-round-trip`が通る | #3441 |
| `into`に欄の名前を書いた試す図で、入力の帯でその欄の値を選んで送ると、チップがその値と同じ名札の待ち行列に入り、ほかの待ち行列は変わらない | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-into-field-routes-by-value`が通る | #3441 |
| `into`に書いた欄が選択肢を持たない時と、選択肢の値と同じ名札の待ち行列が無い時は、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-into-field-refuses-missing-queue`が通る | #3441 |
| `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]`の行を持つ試す図の記法を読むと、原本の部品が`log`を持ち、原本の形の検査がその原本を通し、書き戻すと元の記法と同じ文字列に戻る | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-log-round-trip`が通る | #3441 |
| `into`に`log`を書いた釦を押すと、待ち行列の上から`take`件のチップが1つの記録にまとまって待ち行列から外れ、その記録は`prev`と`hash`を持たない | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-log-press-groups-chips`が通る | #3441 |
| `all`を書いた`log`の記録は、中のチップのその欄が全てその値の時に`yes`の印を、1つでも違う時に`no`の印を持つ | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-log-shows-verdict`が通る | #3441 |
| 描いた試す図の`log`の記録は、番号と、チップごとの名前と`all`の欄の値と、記録の印の字を描き、`prev`と`hash`と`SHA-256`の字を描かない | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`interactive-log-draws-without-hash`が通る | #3441 |
| 常に、`into`に待ち行列を書いた試す図と`log`を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになり、見本の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts packages/dragon/test/examples-svg.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`と`examples-svg-unchanged`が通る | #3441 |
| 英語と日本語のREADMEの試す図の小節と、使い方の頁の試す図の節が、`into`に欄を書く書き方と`log`の行の書き方を持つ | `pnpm exec vitest run packages/dragon/test/interactive-group-log.test.ts`の検査`docs-describe-try-log`が通る | #3441 |
| `packages/dragon/package.json`の`version`が`0.60.0`で、英語と日本語の変更履歴の`## [0.60.0]`の節が`(#3441)`の項を持ち、その項が`log`を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-60-0-adds-try-log`が通る | #3441 |
| 段を送った時、再生の部品は図の`SVG`を写して置き直さず、同じ要素の`--at`と`--play`と`data-motion`を替える | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-goto-keeps-the-figure`が通る | #3445 |
| 段を送った時と流し直す時、図の中の全ての動きの時刻を0にして、動きの時計を最初から数え直す。`getAnimations`を持たない環境では時刻を0にする所を飛ばし、止まらずに段を送る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-goto-rewinds-animations`が通る | #3445 |
| 見本`swap-two-hops`の全ての段を順に送る間の`CPU`時間が、その図を置く間の`CPU`時間の4分の1より短い | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-goto-costs-less-than-mount`が通る | #3445 |
| 見本`aggregator`を開いた横に長い図で、段を送ると関わる関係者の所へ枠を送り、全体の線が見ている所に付いていく | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pans-wide-figure`が通る | #3445 |
| 途中の段へ送った止め絵に、その段の札だけが出る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-still-middle-step-own-labels`が通る | #3445 |
| 1度だけ流す図が、最後の段の止め絵で止まる | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-plays-once-then-still`が通る | #3445 |
| 箱の飛び先の`link`を持つ図は、段を送った後と止めた後も読み上げに残る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-linked-figure-readable-after-replace`が通る | #3445 |
| 幅390の枠に置いた見本`aggregator`の箱を全て開いた図は、残高の字が画面で10.5px以上に見える幅で置かれ、枠は横に送る形(`pan`)になって全体の線を出す(日本語版と英語版) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-narrow-keeps-text-readable`が通る | #3450 |
| 幅390の枠に置いたほかの5つの見本と箱を閉じた`aggregator`は、今どおり図を枠の幅に収めて横に送らず、残高の字が画面で10.5px以上に見える | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-narrow-fits-readable-figures`が通る | #3450 |
| 配管の図は拡大の釦とホイールとダブルクリックで拡大でき、拡大した図を引いて動かせる | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-zooms-and-pans`が通る | #3450 |
| 幅1200の枠に置いた箱を開いた`aggregator`は、今どおり縮めずに置いて横に送り、段を送ると関わる関係者の所へ枠を送る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pans-wide-figure`が通る | #3450 |
| 6つの見本の全ての段を幅1280と幅390の枠に描いた時、決まりの表への違反が0件のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3450 |
| 配管の図の再生の部品は、図の下に段の番号と題を出し、段の説明の文を画面に出さない。読み上げの一覧には段の題と本文を今どおり出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-bar-shows-step-title`が通る | #3450 |
| 値が動く段では、動いた値ごとに送る側、量とトークン、受ける側を1本の実線の矢印で出し、呼び出しと返した値の矢印は出さない(見本`swap-two-hops`の段3は1本、箱を開いた`aggregator`の段7は2本) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-flows-show-moves`が通る | #3450 |
| 確かめる段は、満たすか満たさないかの札を式の前に置いた1行を出す(見本`swap`の段9、見本`swap-revert`の段9)。取り消す段は理由を1回だけ出し、同じ理由で続けて取り消した呼び出しを、取り消した側から戻る先までの関係者の道1本にまとめる(見本`swap-revert`の段10は、LiquidityPool、SwapRouter、Aliceの順の道1本) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-flows-show-checks-and-reverts`が通る | #3450 |
| 値が動かず確かめも取り消しも無い段は、呼び出しを点線の矢印で、返した値を返した側からの点線の矢印で出し、同じ段で戻った呼び出しは返した値の矢印1本にまとめる(見本`swap`の段1、箱を開いた`aggregator`の段4、見本`vault-proxy`の段5) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-flows-show-calls-and-returns`が通る | #3450 |
| 呼び出しの記録は「呼び出しの結果」の題で畳んで置く。開くと、先頭にいちばん外の呼び出しの呼んだ側、呼ばれた側、中身と、返した値か「返り待ち」を出し、その下に今の段までに戻った内側の呼び出しを、呼ばれた側、中身、返した値の3列で出す。返した値が無いか`true`の呼び出しは出さず、取り消した呼び出しは返した値の欄に取り消しと出し、今の段で戻った行に印を付ける(見本`swap-two-hops`の段1と段3と最後の段、見本`swap-revert`の段10) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-call-record`が通る | #3450 |
| 英語を渡した時、図の下の段の矢印と呼び出しの記録の字は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-flows-english`が通る | #3450 |
| 書き出した頁の字の file に残す配管の図の字(`pipeTexts`)は、見本の全ての段で図の下の矢印と呼び出しの記録が出す字を全て含む | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`pipe-texts-cover-flows`が通る | #3450 |
| `queue`に`accept`を書いた試す図の記法を読むと、原本の待ち行列が受け入れる名前の並びを持ち、原本の形の検査がその原本を通し、書き戻すと元の記法と同じ文字列に戻る | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-accept-round-trip`が通る | #3453 |
| `accept`を書いた待ち行列へ、書いていない名前のチップを送ると、受け入れない理由の誤りが返り、どの待ち行列も変わらず、書いた名前のチップは今どおり入る | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-accept-refuses-other-names`が通る | #3453 |
| `accept`の名前が最初の欄の選択肢に無い時と、書き手の例の`ask`が受け入れられない名前を送る時は、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-accept-refuses-bad-names`が通る | #3453 |
| 頁の入力の帯で受け入れられない名前を選ぶと、送る釦を押せなくなり、待ち行列と名前を名指した理由の文を日本語と英語で出す | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-accept-explains-refusal`が通る | #3453 |
| `press`の`from`に2つ以上の待ち行列を書いた記法を読むと、原本の釦が待ち行列の配列を持ち、1つの時は今どおり文字列を持ち、書き戻すと元の記法と同じ文字列に戻る | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-gather-round-trip`が通る | #3453 |
| `from`に2つ以上の待ち行列を書いた釦を押すと、それぞれの上から`take`件ずつが1つの記録にまとまってそれぞれの待ち行列から外れ、`log`の`all`の印はまとめた全部のチップで決まる | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-gather-takes-from-each`が通る | #3453 |
| `from`に書いた待ち行列のどれかが`take`件に満たない間は、釦を押すと足りない待ち行列を名指した誤りが返り、どの待ち行列も記録も変わらない | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`interactive-gather-waits-for-every-queue`が通る | #3453 |
| 常に、`accept`と2つ以上の`from`を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになり、見本の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts packages/dragon/test/examples-svg.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`と`examples-svg-unchanged`が通る | #3453 |
| 英語と日本語のREADMEの試す図の小節と、使い方の頁の試す図の節が、`accept`の書き方と`from`に2つ以上の待ち行列を書く書き方を持つ | `pnpm exec vitest run packages/dragon/test/interactive-accept-gather.test.ts`の検査`docs-describe-try-accept-gather`が通る | #3453 |
| `packages/dragon/package.json`の`version`が`0.62.0`で、英語と日本語の変更履歴の`## [0.62.0]`の節が`(#3453)`の項を持ち、その項が`accept`を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-62-0-adds-accept-gather`が通る | #3453 |
| `item`の行と書き手の例の`ask`が5字以上の名前を持つ試す図を描くと、待ち列のチップの字と、釦で記録に移した記録の行の字が、その名前を切らずに持つ | `pnpm exec vitest run packages/dragon/test/interactive-chip-name.test.ts`の検査`try-chip-keeps-author-name`が通る | #3458 |
| 5字以上の名前のチップは、幅がその名前の字の幅より広く、枠の幅を1440と324にして並べたどちらでも、チップが待ち列の枠の内に、待ち列が図の枠の内に収まる | `pnpm exec vitest run packages/dragon/test/interactive-chip-name.test.ts`の検査`try-chip-fits-long-name`が通る | #3458 |
| 頁の入力の帯で、選択肢の無い欄の入力欄は12字までしか打てず (`maxLength`が12)、選択肢のある欄は今どおり選択肢の箱を出す | `pnpm exec vitest run packages/dragon/test/interactive-chip-name.test.ts`の検査`try-free-field-limits-twelve`が通る | #3458 |
| 頁の入力の帯で、選択肢の無い欄に12字の名前を打って送ると、待ち列のチップの字がその12字を持つ | `pnpm exec vitest run packages/dragon/test/interactive-chip-name.test.ts`の検査`try-reader-name-shown-whole`が通る | #3458 |
| 常に、名前が4字以内の試す図は今どおり描け、見本の指紋が変わらず、記法を書き戻して読み直すと元の原本と同じJSONになる | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts packages/dragon/test/interactive-diagram.test.ts`の検査`examples-svg-unchanged`と`interactive-round-trip-keeps-json`が通る | #3458 |
| `packages/dragon/package.json`の`version`が`0.63.1`で、英語と日本語の変更履歴の`## [0.63.1]`の節が`(#3458)`の項を持ち、その項が12字の上限を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-63-1-keeps-try-chip-names`が通る | #3458 |
| 常に、プラグインの版 (`plugins/dragon/.claude-plugin/plugin.json`の`version`) が npm の package の版と同じ | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`plugin-version-matches-package`が通る | #3458 |
| 試す図の最初の`step`より前に`check <網の節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]`を書いた記法を読むと、原本の試す図が関門 (節、欄、比べ方、値、エラーの名前、再試行できるか、記録の列) を書いた順に持ち、原本の形の検査がその原本を通し、書き戻すと元の記法と同じ文字列に戻る | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-round-trip`が通る | #3476 |
| 関門の条件に合わない値のチップを入力の帯から送ると、チップはどの待ち行列にも入らず、網の道をその節まで運ばれて止まり、`into`の記録の列にチップと止まった節とエラーの名前を持つ記録が1件増え、`retry`を書いた関門なら「再試行できる」、書かない関門なら「直して送り直す」の印が付く | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-stops-at-node`が通る | #3476 |
| 2つ以上の関門に合わない値のチップは、網の`from`から辿って最初に着く節の関門で止まり、同じ節に関門が2つ以上ある時は書いた順で最初に合わない関門で止まる | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-first-on-path`が通る | #3476 |
| 関門の値が数の時は、チップの欄の値も数なら数として比べ (`85134 <= 27000`は合わず`12000 <= 27000`は合う)、数でない値は合わない。関門の値が数でない時は`==`と`!=`で字として比べる | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-compares-values`が通る | #3476 |
| どの関門の条件にも合う値のチップは、今どおり`into`の待ち行列に入り、記録の列は変わらない | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-passes-matching-chips`が通る | #3476 |
| 関門の節が網の`from`から`to`への道に無い時、欄が入力の帯に無い時、`into`が記録の列でない時、`into`の記録の列が`all`を持つ時、数でない値に`>=`、`<=`、`>`、`<`を使った時は、行と列を名指した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-refuses-bad-lines`が通る | #3476 |
| 段の中の書き手の例の`ask`が関門に合わない値を送ると、入力の帯から送った時と同じくチップが節で止まり記録が増える | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-applies-to-step-ask`が通る | #3476 |
| 頁の入力の帯で送ったチップが関門で止まると、網のその節に止まった印が出て、記録の列に止まった節とエラーの名前と再試行できるかの印が日本語と英語で出る | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-player-shows-record`が通る | #3476 |
| 常に、関門を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになり、見本の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts packages/dragon/test/examples-svg.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`と`examples-svg-unchanged`が通る | #3476 |
| 常に、配管の図の段の中の`check`は今どおり読めて書き戻せ、試す図とほかの種類の段の中に書いた`check`は配管の図 (`pipe`) を名指した誤りで止まり、時系列図と構成図と状態遷移図では`check`を名札として読む | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-compiles-pipe-examples-to-json`と`pipe-roundtrip-keeps-json-identical`と`notation-limits-pipe-lines-to-pipe`と`notation-keeps-pipe-words-plain-outside-pipe`が通る | #3476 |
| 英語と日本語のREADMEの試す図の小節と、使い方の頁の試す図の節が、`check`で関門を書く書き方を持つ | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`docs-describe-try-gate`が通る | #3476 |
| `packages/dragon/package.json`の`version`が`0.65.0`で、英語と日本語の変更履歴の`## [0.65.0]`の節が`(#3476)`の項を持ち、その項が`check`を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-65-0-adds-try-gate`が通る | #3476 |
| エラーの名前が`SEQUENCER_REQUEST_FAILED`で止まった節が`Sequencer`の関門の記録を3件以上持つ試す図を、幅324で描くと`viewBox`の幅が324以下になり、幅を渡さずに描くと740以下になる | `pnpm exec vitest run packages/dragon/test/interactive-gate-record.test.ts`の検査`try-gate-record-fits-widths`が通る | #3478 |
| 関門の記録は、止まった節の字とエラーの名前の字を別の行に持ち、どちらの字の幅も記録の枠の幅より狭い | `pnpm exec vitest run packages/dragon/test/interactive-gate-record.test.ts`の検査`try-gate-record-splits-rows`が通る | #3478 |
| 頁の入力の帯から送って関門の記録が増えた時、枠の幅を1440と324にしたどちらでも、図の`viewBox`の幅が送る前と同じ | `pnpm exec vitest run packages/dragon/test/interactive-gate-record.test.ts`の検査`try-gate-record-keeps-figure-width`が通る | #3478 |
| 常に、関門で止まったチップの記録は止まった節とエラーの名前と再試行できるかの印を持ち、どの待ち行列にも入らない | `pnpm exec vitest run packages/dragon/test/interactive-gate.test.ts`の検査`interactive-gate-stops-at-node`と`interactive-gate-player-shows-record`が通る | #3478 |
| 常に、関門を持たない試す図の記法は今どおり読めて、書き戻して読み直すと元の原本と同じJSONになり、見本の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/interactive-diagram.test.ts packages/dragon/test/examples-svg.test.ts`の検査`interactive-notation-parses`と`interactive-round-trip-keeps-json`と`examples-svg-unchanged`が通る | #3478 |
| `packages/dragon/package.json`の`version`が`0.65.2`で、英語と日本語の変更履歴の`## [0.65.2]`の節が`(#3478)`の項を持ち、その項が関門の記録を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-65-2-splits-gate-records`が通る | #3478 |
| 5つの節を1列に並べた網の試す図を幅324で描くと、網の節の名札どうしが重ならず、どの名札も図の枠の内に収まる。隣の名札とぶつからない網の名札は今の位置のまま描く | `pnpm exec vitest run packages/dragon/test/interactive-gate-record.test.ts`の検査`try-route-labels-clear-narrow`が通る | #3478 |
| 入力の帯を置いた時、`choose` で候補を書いた欄は、一番長い候補の字を`textWidth`で入力の字の型で測った幅に、左右の内側の余白と矢印の幅を足した値を、欄の幅の下限に持つ。候補を書かない入力の欄は今の基準の幅のまま | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`try-ask-field-min-from-longest-choice`が通る | #3485 |
| 欄を6つ持ち、1つの欄の候補に「順序付けの遅れ」を持つ試す図をChromiumで幅740の枠に置き、その候補を選んだ時、どの選択の欄の幅も、選んだ値の字の幅に左右の内側の余白と矢印の幅を足した値以上になる | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-choice-not-clipped`が通る | #3485 |
| 同じ図を幅740の枠に置いた時、どの欄と釦も入力の帯の右端を超えず、1行に入らない欄は次の行に並ぶ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-fields-wrap-in-strip`が通る | #3485 |
| 常に、候補が短く欄が4つの試す図を幅740の枠に置くと、全ての欄と送る釦が1行に並ぶ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-short-fields-one-row`が通る | #3485 |
| 常に、幅390の枠では全ての操作が枠に収まって縦横44px以上の大きさを持ち、段の説明の帯の下に入力の帯が在る | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-controls-fit-390-at-44px`と`interactive-caption-above-controls`が通る | #3485 |
| 常に、見本の図の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3485 |
| `packages/dragon/package.json`の`version`が`0.65.3`で、英語と日本語の変更履歴の`## [0.65.3]`の節が`(#3485)`の項を持ち、その項が入力の帯の欄の幅を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-65-3-fits-ask-choices`が通る | #3485 |
| 幅740の枠で次の行へ送った選ぶ欄は、一番長い候補が収まる幅 (基準の幅110より狭ければ110) に基準の幅110を足した幅より広がらない | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-wrapped-choice-not-stretched`が通る | #3485 |
| `mountDiagram`に`zoom: "readable"`を渡し、幅390の枠に見本`swap`を置くと、配管の図の箱の名前の字が画面で10.5px以上に見える倍率で置かれる | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-names`が通る | #3483 |
| その図は、枠を寄せた図の高さまで伸ばし、枠の中を縦に送らず横にだけ送る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-frame-height`が通る | #3483 |
| その図で段を進めると、枠がその段に関わる関係者の所へ横に送られ、全体の線が枠の見ている所を示す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-follows-step`が通る | #3483 |
| その図の拡大の度合いの札は寄せた倍率を示し、縮小の釦を押していくと100%で図の全体を枠の幅に収める | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-steps-back-to-whole`が通る | #3483 |
| その図の枠が600px以上へ広がると拡大を外して原寸で描き、600px未満へ戻ると箱の名前が読める倍率で置き直す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-follows-resize`が通る | #3483 |
| `packages/dragon/README.md`と`packages/dragon/README.ja.md`と`plugins/dragon/skills/dragon/references/setup.md`に、`zoom: "readable"`の渡し方と、600px未満の枠の配管の図だけに効くことが載る | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-docs-describe-readable-zoom`が通る | #3483 |
| `zoom`を渡さない時は、幅390の枠に置いた配管の見本を今どおり枠の幅に収める | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-narrow-fits-readable-figures`が通る | #3483 |
| 幅600px以上の枠では、`zoom: "readable"`を渡しても配管の図を拡大せず原寸で描く | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-readable-zoom-wide-frame-native`が通る | #3483 |
| 選ぶ欄を持つ試す図をChromiumで幅740の枠に置いた時、どの選ぶ欄もブラウザの矢印を描かず (`appearance`が`none`)、dragonが描いた矢印の右端から欄の右の縁までの間が、字の左端から欄の左の縁までの間と0.5px以内で同じで、矢印の左端が字を置ける所の右端より右に在る | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-arrow-matches-inset`が通る | #3492 |
| 欄を6つ持ち、1つの欄の候補に「順序付けの遅れ」を持つ試す図を幅740の枠に置いた時、次の行へ送った選ぶ欄の幅は、一番長い候補が収まる幅 (基準の幅110より狭ければ110) と0.5px以内で同じ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-wrapped-choice-not-stretched`が通る | #3492 |
| 常に、同じ図を幅740の枠に置くと、1行目の欄は伸びて、1行目の右端の欄の右端が帯の右端から1px以内に在る | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-first-row-fills`が通る | #3492 |
| 常に、選ぶ欄は一番長い候補の字が切れない幅を持ち、1行に入らない欄を次の行へ送り、候補が短く欄が4つの試す図は1行に並ぶ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-choice-not-clipped`と`try-ask-fields-wrap-in-strip`と`try-ask-short-fields-one-row`が通る | #3492 |
| 常に、幅390の枠では全ての操作が枠に収まって縦横44px以上の大きさを持ち、段の説明の帯の下に入力の帯が在る | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`interactive-controls-fit-390-at-44px`と`interactive-caption-above-controls`が通る | #3492 |
| 常に、見本の図の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3492 |
| `packages/dragon/package.json`の`version`が`0.66.1`で、英語と日本語の変更履歴の`## [0.66.1]`の節が`(#3492)`の項を持ち、その項が選ぶ欄の矢印を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-66-1-draws-ask-arrow`が通る | #3492 |
| 選ぶ欄を置いた時、欄の幅の下限 (`--dg-field-min`) は、欄の名前の字を`textWidth`で欄の名前の字の型で測った幅も下回らず、幅740の枠で次の行へ送った欄でも欄の名前が切れない | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-field-min-covers-label`と`try-ask-label-not-clipped`が通る | #3492 |
| 選ぶ欄を持つ試す図をChromiumで幅740の枠に置き、頁が図の中の全ての`svg`に`display: block; width: auto; height: auto`を当てた時、どの選ぶ欄でもdragonが描いた矢印の幅と高さは12px以下で、矢印の右端から欄の右の縁までの間が、字の左端から欄の左の縁までの間と0.5px以内で同じ | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-caret-ignores-host-svg-rule`が通る | #3499 |
| 選ぶ欄を持つ試す図を置いた時、入力の帯は`svg`の要素を持たず、選ぶ欄ごとに矢印の要素を1つ持つ | `pnpm exec vitest run packages/dragon/test/interactive-player.test.ts`の検査`try-ask-caret-not-svg`が通る | #3499 |
| 常に、頁が`svg`に規則を当てない時も、矢印の右端から欄の右の縁までの間が字の左の余白と0.5px以内で同じで、矢印が字と重ならず、どの選ぶ欄もブラウザの矢印を描かない | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-arrow-matches-inset`が通る | #3499 |
| 常に、次の行へ送った選ぶ欄は伸びず、欄の名前は切れない | `pnpm exec vitest run packages/dragon/test/interactive-browser.test.ts`の検査`try-ask-wrapped-choice-not-stretched`と`try-ask-label-not-clipped`が通る | #3499 |
| 常に、見本の図の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3499 |
| `packages/dragon/package.json`の`version`が`0.67.0`で、英語と日本語の変更履歴の`## [0.67.0]`の節が`(#3499)`の項を持ち、その項が矢印を名指す | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-67-0-caret-without-svg`が通る | #3499 |
| 待ち列と記録の列を`side`の行に書いた試す図を読むと記法の誤りにならず、書き戻した記法も同じ`side`の行を持つ | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-accepts-log`が通る | #3506 |
| 待ち列と記録の列を`side`の行に書き、記録が3件ある試す図を幅740で描いた時、図の幅は740のままで、2つの部品の上の端のずれは1未満で重ならず、どの記録も記録の列の四角の右の端より左に収まる | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-places-log-in-row`が通る | #3506 |
| 同じ図を幅324の枠で描いた時、縦に組み、部品の四角と図の高さが`side`の行を持たない図と同じ | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-log-stacks-when-narrow`が通る | #3506 |
| 英語と日本語の README の`side`の行の説明が、待ち列の残りの幅を記録の列にも渡すと書く | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`docs-side-gives-rest-to-log`が通る | #3506 |
| 待ち列と記録の列を`side`の行に書き、記録の列に割り当てた幅に3件が1段で入らない試す図を幅740で描いた時、出す記録は1段に入る数だけで全て同じ高さに並び、古い記録を畳んだ印を持つ | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-log-folds-to-one-line`が通る | #3506 |
| 記録がまだ1件も無い記録の列は、記録1件分の空いた段を取らず、図が記録1件の図より低い | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-log-empty-takes-no-line`が通る | #3506 |
| 常に、網と待ち列と機械の列を`side`の行に書いた図は今どおり並び、細い枠では縦に積む | `pnpm exec vitest run packages/dragon/test/interactive-side.test.ts`の検査`interactive-side-places-parts-in-a-row`と`interactive-side-queue-takes-chip-width`と`interactive-side-stacks-when-narrow`が通る | #3506 |
| 常に、見本の図の指紋が変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3506 |
| 英語と日本語の変更履歴の`## [0.67.0]`の節が`(#3506)`と`(#3489)`の項を持ち、`(#3506)`の項が記録の列を名指し、Unreleased にどちらの項も残らない | `pnpm exec vitest run packages/dragon/test/release-records.test.ts`の検査`changelog-0-67-0-side-log`が通る | #3506 |
