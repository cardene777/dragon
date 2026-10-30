# tree-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `tree` の原本の JSON を JSON Schema で検査した時、段の中に葉の出来事 (`leaf`、名札と値 `hash`) と親の出来事 (`node`、名札と 1 つ以上の子 `children` と値 `hash`) を持つ図は通る。値を持たない葉と親も通る | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`schema-accepts-tree-diagram`が通る | #3233 |
| `leaf` か `node` の出来事を木の図でない図に書いた時、木の図に `git`、`state`、`sequence`、`time` の欄を書いた時、子の無い `node` を書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`schema-rejects-misplaced-tree-events`が通る | #3233 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3233 |
| `packages/dragon/examples/merkle.dragon` を `parseNotation` が読んだ時、同じ名前の JSON と同じ JSON を返す。英語版の `.en.dragon` と `.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`notation-compiles-tree-examples-to-json`が通る | #3233 |
| 木の図の記法に、まだ書いていない名札を子にした `node`、木の箱でない箱 (`box`) を子にした `node`、既にある名札 (箱、葉、親) と同じ名札の `leaf` か `node`、2 つの親の子になる箱、最初の `step` より前の `leaf` か `node`、最後の段を終えて親を持たない葉か親が 2 つ以上残る木 (行の誤りが無い時だけ確かめる)、のどれかがある時、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`notation-rejects-misused-tree-lines`が通る | #3233 |
| 時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図の記法で `leaf` か `node` の行を書いた時、その行は木の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`notation-limits-tree-lines-to-tree`が通る | #3233 |
| 木の図でない図の記法では、`leaf` か `node` を名札にした箱どうしの線 (`node -> db`) を今どおり読む | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`notation-keeps-leaf-and-node-plain-outside-tree`が通る | #3233 |
| Merkle の図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-roundtrip-keeps-json-identical`が通る | #3233 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3233 |
| 原本の JSON から並べた時、根を上の真ん中に置き、根からの深さが同じ箱を同じ高さに並べ、葉を書いた順に左から並べ、親を子の真ん中の上に置く。子が 1 つの親と、葉の深さが揃わない木でも、箱どうしが 10px 以上離れる。木の箱でない箱 (`box`) は木の右に、根と同じ高さから縦に並べる | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-layout-puts-root-on-top`が通る | #3233 |
| 値を持つ葉は箱に値だけを出し、名札を葉の下の札に出し、札は最初の段から見える。値を持つ親は箱に値を大きく、名札を小さく出す。値を持たない葉と親は箱に名札を出す。根の箱は枝の絵を持ち、ほかの木の箱より大きい | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-boxes-show-values`が通る | #3233 |
| `leaf` と `node` を書いた段で、その箱と子から親への木の線が現れ、それより前の段では見えない | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-boxes-appear-at-their-step`が通る | #3233 |
| 親子の箱どうしの運ぶ物の線は、向きを問わず子と親を結ぶ木の線の上を走り、別の線を引かない。運ぶ物が通った木の線は、その段から運ぶ物の色で残る。親子でない箱どうしの線は今の線と同じく引く | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-carriers-run-along-tree-lines`が通る | #3233 |
| 木の線を運ぶ物が通った段から後は、それまでに運ぶ物を送るか受けた木の箱と線を濃く出し、ほかの木の箱と線と札を薄く出す。Merkle の図の段 8 では、取引3、取引4、3から4、1から2、1から4、5から8、根の 7 つの箱が濃く、残りの 8 つの箱が薄い | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-proof-fades-untouched-boxes`が通る | #3233 |
| Merkle の図を原本の JSON から描いた時、8 段が順に動き、段 1 で葉 8 つ、段 2 で親 4 つ、段 3 で親 2 つ、段 4 で根が現れ、段 5 で中身の帯の確かめる取引が取引3になり、段 6 から段 8 で運ぶ物が取引3の葉から根まで 1 段ずつ上り、段 8 で中身の帯の結果が一致になる | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`merkle-renders-8-steps`が通る | #3233 |
| Merkle の図を 0.25 秒ごとに止めて数えた時、線の名前が同時に見える数は 2 個以下で、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-keeps-motion-rules`が通る | #3233 |
| 全体を枠に収めた字が 10.5px を下回る幅 390 の枠で Merkle の図を開いた時、寄って見せる見せ方 (`follow`) になり、どの段の終わりでも、その段の番号の丸と、その段で運ぶ物が最後に着いた箱か、運ぶ物の無い段では最初に現れた木の箱が、見ている窓の中にある | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-follows-when-narrow`が通る | #3233 |
| 今の 5 種類の描き方は今どおりで、OAuth は 12 段、CCIP は 13 段、rebase は 11 段、ブロックの確定は 10 段、注文は 10 段が順に動き、箱どうしと線の名前と箱が 10px 以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`rebase-renders-11-steps`と`finality-renders-10-steps`と`order-renders-10-steps`と`layout-keeps-10px-gap`が通る | #3233 |
| 木の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3233 |
| `dragon export` に Merkle の図の JSON を渡した時、mp4、GIF、HTML、PNG の 4 つを書き出し、同じ JSON を 2 回書き出した PNG がバイト単位で一致する | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`export-writes-tree-diagram`が通る | #3233 |
| `packages/dragon/examples` に Merkle の日本語と英語の記法と JSON の 4 つの file があり、英語版の葉と親と段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/tree-diagram.test.ts`の検査`tree-example-files-match`が通る | #3233 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3233 |
| 見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならず、運ぶ物が箱と字に掛からない | `pnpm test`の検査`overlaps-none-in-every-example`と`carriers-clear-in-every-example`が通る | #3233 |
| 見本帳の一覧に図の分類が 6 つ (時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図) 並び、木の図の頁に Merkle の見本が載り、選ぶと 8 段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/tree-catalog.test.ts`の検査`catalog-lists-tree-with-examples`が通る | #3233 |
| 見本帳の一覧の図の分類が時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図の順で始まり、時間軸の図の頁にブロックの確定と引き出しの見本が載り、ブロックの確定を選ぶと 10 段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/time-catalog.test.ts`の検査`catalog-lists-time-with-examples`が通る | #3233 |
| 見本帳の図の種類だけの部品に、葉と札、組んだ親の 2 つが木の図の部品として並び、頁ごとに日本語と英語の記法と、木の図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/tree-catalog.test.ts`の検査`catalog-has-two-tree-parts`が通る | #3233 |
| どの図でも使う部品の全ての頁に、木の図で描いた図が並び、段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/tree-catalog.test.ts`の検査`common-parts-draw-tree`が通る | #3233 |
| 木の図の部品の頁は、その部品を使う見本の札を並べ、札は木の図の頁のその見本へ向かう | `pnpm exec vitest run apps/playground-spa/src/lib/tree-catalog.test.ts`の検査`tree-part-pages-link-examples`が通る | #3233 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3233 |
| 編集画面の棚の見本に木の図の束があって Merkle が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に `tree` の頭の行があり、`leaf` と `node` の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/tree-catalog.test.ts`の検査`editor-shelf-has-tree`が通る | #3233 |
| 使い方の頁と `CHANGELOG.md` の前の形との対応表の頭の語が、読む部品の語と一致する。木の図の語は、対応表の後に足した語として表に行を持たない | `pnpm test`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3233 |
| 概要の頁の使いどころは今の 3 つのまま | `pnpm test`の検査`home-uses-stay-three`が通る | #3233 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3233 |
