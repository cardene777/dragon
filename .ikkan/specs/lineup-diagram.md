# lineup-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `lineup` の原本の JSON を JSON Schema で検査した時、チップの宣言 (`lineup.items`、名札と色と字) と、段の中の `line`、`seal`、`open`、`pick`、`stamp` の出来事を持つ図は通る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`schema-accepts-lineup-diagram`が通る | #3239 |
| `line`、`seal`、`open`、`pick`、`stamp` の出来事を列の図でない図に書いた時、列の図に`git`、`state`、`sequence`、`time`の欄か線の出来事を書いた時、5字以上の字のチップを書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`schema-rejects-misplaced-lineup-events`が通る | #3239 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3239 |
| `packages/dragon/examples/auction.dragon` を `parseNotation` が読んだ時、同じ名前の JSON と同じ JSON を返す。英語版の `.en.dragon` と `.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-compiles-lineup-examples-to-json`が通る | #3239 |
| 列の図の記法に、宣言していないチップか列を書いた `line`、同じチップを2度書いた `line`、1列の上限の12枚を超える `line`、最初の `step` より前の `line`、封をした列への `line`、封をしていない列への `open`、封をした列への2度目の `seal`、線の行、`group` の行、`act` の行のどれかがある時と、`item` の行が1つも無い時は、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-rejects-misused-lineup-lines`が通る | #3239 |
| 時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図の記法で `item`、`line`、`seal`、`open`、`pick`、`stamp` の行を書いた時、その行は列の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-limits-lineup-lines-to-lineup`が通る | #3239 |
| 列の図でない図の記法では、`item` か `line` を名札にした箱どうしの線 (`line -> db`) を今どおり読む | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-keeps-lineup-words-plain-outside-lineup`が通る | #3239 |
| 入札の図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-roundtrip-keeps-json-identical`が通る | #3239 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3239 |
| 原本の JSON から並べた時、列を宣言した順に上から並べ、列の名前を列の左上に、`note` を列の右上に置き、チップを左から等間隔に並べる。図の幅は上限の12枚の列の幅で決まり、箱どうしと字が10px以上離れる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-layout-stacks-lanes`が通る | #3239 |
| `label` を持つチップは字を出し、`label` を持たないチップは色だけを出し、`color` を持たないチップは薄い色で出す | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-chips-show-labels`が通る | #3239 |
| `line` の段で、前の段に同じチップが居た時はその位置から今の位置へ滑り、どの列にも居なかったチップは弾んで現れ、列から外れたチップは消える。元の列を書き換えていない時は元の列のチップも残る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-chips-slide-from-where-they-were`が通る | #3239 |
| `seal` の段で封が列を左から覆い、封がある間は列のチップが見えない。`open` の段で封が消え、チップが同じ並びで見える | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-seal-hides-chips`が通る | #3239 |
| `pick` の段から後、選んだ列の縁に色が付き、ほかの列が薄くなる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-pick-fades-other-lanes`が通る | #3239 |
| `stamp` の段で札が列の右に現れ、最後の段まで残る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-stamp-appears-at-its-step`が通る | #3239 |
| 入札の図を原本の JSON から描いた時、7段が順に動き、段1でメモリプールの列にチップが並び、段2でビルダーの3列が並び、段3で3列に封が付き、段4で選んだ列が残り、段5で札が出て、段6で封が開き、段7でバリデーターの列にチップが並ぶ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`auction-renders-7-steps`が通る | #3239 |
| 入札の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-keeps-motion-rules`が通る | #3239 |
| 幅390の枠で入札の図を開いた時、全体を出す見せ方 (`fixed`) になり、枠に収めた字が10.5px以上ある | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-stays-whole-when-narrow`が通る | #3239 |
| 今の6種類の描き方は今どおりで、OAuth は12段、CCIP は13段、rebase は11段、ブロックの確定は10段、注文は10段、Merkle は8段が順に動き、箱どうしと線の名前と箱が10px以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`rebase-renders-11-steps`と`finality-renders-10-steps`と`order-renders-10-steps`と`merkle-renders-8-steps`と`layout-keeps-10px-gap`が通る | #3239 |
| 列の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3239 |
| `dragon export` に入札の図の JSON を渡した時、mp4、GIF、HTML、PNG の4つを書き出し、同じ JSON を2回書き出した PNG がバイト単位で一致する | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`export-writes-lineup-diagram`が通る | #3239 |
| `packages/dragon/examples` に入札の図の日本語と英語の記法と JSON の4つの file があり、英語版の列とチップと段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-example-files-match`が通る | #3239 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3239 |
| 見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`overlaps-none-in-every-example`が通る | #3239 |
| 見本帳の一覧に図の分類が7つ (時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図) 並び、列の図の頁に入札の見本が載り、選ぶと7段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/lineup-catalog.test.ts`の検査`catalog-lists-lineup-with-examples`が通る | #3239 |
| 見本帳の図の種類だけの部品に、チップ、列の並び、封、選ぶ、札の5つが列の図の部品として並び、頁ごとに日本語と英語の記法と、列の図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/lineup-catalog.test.ts`の検査`catalog-has-lineup-parts`が通る | #3239 |
| 列の図の部品の頁は、その部品を使う見本の札を並べ、札は列の図の頁のその見本へ向かう | `pnpm exec vitest run apps/playground-spa/src/lib/lineup-catalog.test.ts`の検査`lineup-part-pages-link-examples`が通る | #3239 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3239 |
| 編集画面の棚の見本に列の図の束があって入札の図が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に `lineup` の頭の行があり、`item`、`line`、`seal`、`open`、`pick`、`stamp` の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/lineup-catalog.test.ts`の検査`editor-shelf-has-lineup`が通る | #3239 |
| 使い方の頁と `CHANGELOG.md` の前の形との対応表の頭の語が、読む部品の語と一致する。列の図の語は、対応表の後に足した語として表に行を持たない | `pnpm test`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3239 |
| 概要の頁の使いどころは今の3つのまま | `pnpm test`の検査`home-uses-stay-three`が通る | #3239 |
