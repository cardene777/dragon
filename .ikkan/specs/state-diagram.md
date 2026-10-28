# state-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `state` の原本の JSON を JSON Schema で検査した時、`start` から出る線と `finish` へ入る線を段に持ち、最初の段より前に書いた通らない道を種類の欄 `state` に持つ図は通る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`schema-accepts-state-diagram`が通る | #3163 |
| 状態遷移図の箱の名札に `start` か `finish` を使った時、`state` の欄を状態遷移図でない図に書いた時、状態遷移図に `sequence` の欄を書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`schema-rejects-misplaced-state-fields`が通る | #3163 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3163 |
| `packages/dragon/examples/order.dragon` を `parseNotation` が読んだ時、`order.json` と同じ JSON を返す。英語版の `order.en.dragon` と `order.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`notation-compiles-order-to-json`が通る | #3163 |
| 状態遷移図の記法に、`start` へ入る線、`finish` から出る線、`start` か `finish` を名札にした `box` の行、宣言していない名札への通らない道のどれかがある時、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`notation-rejects-misused-start-and-finish`が通る | #3163 |
| 時系列図と構成図の記法では、最初の `step` より前の線の行を今どおり誤りにし、`start` と `finish` を宣言の要る普通の名札として読む | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`notation-keeps-start-and-finish-plain-outside-state`が通る | #3163 |
| 注文の図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致し、書き戻した記法は通らない道を最初の `step` より前に書く | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-roundtrip-keeps-json-identical`が通る | #3163 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3163 |
| 段をまたぐ線 (発送準備から発送済み) が上の段の箱の下端から出て 2 つの段の間を通り、下の段の箱の上端へ入る。線はどれも始まりと終わりの箱でない箱から 10px 以上離れ、箱どうしと線の名前と箱も 10px 以上離れる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-layout-routes-between-rows`が通る | #3163 #3171 |
| どの段も辿り着かない状態 (キャンセル) を点線の箱で描き、その状態とそこから出る線と終わりの印を、1 段目より上の点線の囲みに入れる。囲みには日本語で `脇道` と `今回は通らない`、英語を渡すと `Side path` と `Not taken this time` を出す | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-renders-side-path`が通る | #3163 |
| 段より前に書いた線のうちどの段にも出ない線を点線で描き、その線には運ぶ物を走らせない。段の中に書いた線は、その段で運ぶ物が走る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-dots-paths-not-taken`が通る | #3163 |
| 始まりの印を最初の状態の上に、終わりの印を終わりへ移る状態の下に描き、日本語で `始まり` と `終わり`、英語を渡すと `Start` と `End` を添える。脇道の中の終わりの印は状態の右に点線で描く | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-renders-start-and-finish`が通る | #3163 |
| 注文の図を原本の JSON から描いた時、試作 (`docs/design/base/scenes/order.js`) と同じ題の 10 段が順に動き、各段で札 `#1042` が線の上を走って着いた状態に乗る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`order-renders-10-steps`が通る | #3163 |
| 状態の箱は、札が乗っている段の間は光り、札が出た後は右上に済んだ印が残る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-marks-current-and-left-states`が通る | #3163 |
| 同じ状態へ戻る線 (検品する) を状態の箱の下に描き、その段で札がその線を回る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-draws-self-loop-under-box`が通る | #3163 #3171 |
| 見せ方を書かない注文の図を開いた時、字の大きさから全体を止めて中だけを動かす見せ方 (`fixed`) になる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`order-opens-fixed`が通る | #3163 |
| OAuth は 12 段、CCIP は 13 段が順に動き、箱どうしと線の名前と箱が 10px 以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`layout-keeps-10px-gap`が通る | #3163 #3171 |
| 描画は色、字、余白、線の曲がりの半径を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3163 #3171 |
| `dragon export` に注文の図の JSON を渡した時、mp4、GIF、HTML、PNG の 4 つを書き出し、同じ JSON を 2 回書き出した PNG がバイト単位で一致する | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`export-writes-state-diagram`が通る | #3163 #3171 |
| `packages/dragon/examples` に `order.dragon`、`order.en.dragon`、`order.json`、`order.en.json` があり、英語版の状態と段と段ごとの線の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`order-example-files-match`が通る | #3163 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3163 |
| 見本帳の一覧に図の分類が 3 つ (時系列図、構成図、状態遷移図) 並び、状態遷移図の頁に注文の見本が載り、選ぶと 10 段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/state-catalog.test.ts`の検査`catalog-lists-state-with-order`が通る | #3163 |
| 見本帳の図の種類だけの部品に「始まりと終わり」と「通らない道」の 2 つが状態遷移図の部品として並び、頁ごとに日本語と英語の記法と、状態遷移図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/state-catalog.test.ts`の検査`catalog-has-two-state-parts`が通る | #3163 |
| どの図でも使う 10 個の部品の頁に、状態遷移図で描いた図が並び、段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/state-catalog.test.ts`の検査`common-parts-draw-state`が通る | #3163 |
| 「始まりと終わり」の頁は `start` か `finish` の線を持つ見本の札を、「通らない道」の頁は最初の段より前に線を書いた見本の札を並べ、札は状態遷移図の頁のその見本へ向かう | `pnpm exec vitest run apps/playground-spa/src/lib/state-catalog.test.ts`の検査`state-part-pages-link-order`が通る | #3163 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3163 #3171 |
| 編集画面の棚の見本に状態遷移図の束があって注文が載り、選ぶと書く欄に注文の記法が入って図が描ける。記法の早見の図の種類の行に `state` の頭の行があり、`start` と `finish` の線の行と、最初の段より前に書く通らない道の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/state-catalog.test.ts`の検査`editor-shelf-has-state`が通る | #3163 |
| 概要の頁の使いどころは今の 3 つのまま | `pnpm test`の検査`home-uses-stay-three`が通る | #3163 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3163 #3171 |
| 注文の図を描いた時、1 段目は左から右へ、2 段目は右から左へ状態を並べ、1 段目の最後の状態から 2 段目の最初の状態への線は真下への 1 本になる。状態が 9 つ以上の図では 3 段目を再び左から右へ並べる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-layout-snakes-rows`が通る | #3171 |
| 状態遷移図で段が終わった後、その段の線と段の番号を共通の値の表の灰で描き、今の段の線と番号だけを移った先の状態の色で描く | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-greys-past-lines`が通る | #3171 |
| 状態遷移図では、通った線と今の段の線を実線で描き、まだ通っていない線の灰の点線と模様で見分けられる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-draws-taken-lines-solid`が通る | #3171 |
| 状態の箱の済んだ印を、状態の色でなく墨の 1 色で描く | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-marks-done-in-ink`が通る | #3171 |
| 時系列図、構成図、状態遷移図のどれでも、3 点以上を通る線は曲がりを共通の値の表の半径で丸め、直角の角を持たない | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`lines-round-their-bends`が通る | #3171 |
| 同じ状態へ戻る線 (検品する) を箱の下の弧で描き、線は直線の区間を持たず、箱の幅からはみ出さない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-draws-self-loop-as-arc`が通る | #3171 |
| 状態遷移図で段が終わった後も、その段の線の名前を今の段の名前より薄い濃さで残す。どの時刻でも、普通の濃さで見える線の名前は 2 個以下 | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-keeps-past-line-names-faint`が通る | #3171 |
| 脇道の囲みは、脇道へ入る線を持つ状態のうち最も左の状態の列から図の右端までを占め、始まりの印とその添え書きに重ならない。添え書きは日本語で `今回は通らない` と `3 つの状態から入れる`、英語で `Not taken this time` と `Enterable from 3 states` の 2 行 | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-renders-side-path-top-right`が通る | #3171 |
| 脇道の点線の札は、絵柄を左に、名前と添え書きを右に並べる。脇道の状態が 2 つ以上ある図では、同じ囲みの中で横に並べる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-lines-up-side-states`が通る | #3171 |
| 絵柄の一覧に `undo` (戻る矢印) と `yen` (円の印) があり、注文の見本は返品の受付に `undo`、返金済みに `yen` を使う。英語版も同じ | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-order-uses-undo-and-yen`が通る | #3171 |
| 状態遷移図の帯の最後に、通った状態を状態の色の点で並べる欄 (日本語で `通った状態`、英語で `States passed`) を出し、まだ着いていない状態は輪郭だけの点にする。注文の見本の帯に状態の欄は無い | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-strip-shows-passed-states`が通る | #3171 |
| 状態遷移図の帯で、段の中で変わった値をその段の今の状態の色で描き、欄の名前の横に同じ色の点を置く。次の段が始まると墨に戻る | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-strip-tints-changed-values`が通る | #3171 |
| 段の中の線は、その段が来る前から灰の点線で見え、その段で色の線が引かれる | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-shows-future-lines-dotted`が通る | #3171 |
| 注文の図を 0.25 秒ごとに止めて数えた時、運ぶ物が図のどこにも見えない時刻が全体の 2% 以下で、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-keeps-carrier-and-badge-rules`が通る | #3171 |
| 時系列図と構成図では、通った線を今どおり細かい点の線で描く | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`non-state-lines-keep-dotted-texture`が通る | #3171 |
| 時系列図と構成図では、線の名前はその段の間だけ出て、どの時刻でも同時に見える数が 2 個以下 | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`labels-show-only-during-their-step`が通る | #3171 |
