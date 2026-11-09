# flow-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind`が`flow`の原本のJSONをJSON Schemaで検査した時、手順の箱 (`boxes`)、判断 (`choice`の箱)、最初の段より前の線と、段の中の線の出来事を持つ図は通る | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`schema-accepts-flow-diagram`が通る | #3561 |
| 判断の箱を手順の図でない図に書いた時、手順の図に`git`、`state`、`sequence`、`time`の欄を書いた時、検査が落ちて誤った欄の場所をJSON Pointerで示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`schema-rejects-misplaced-flow-fields`が通る | #3561 |
| schemaが使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3561 |
| ログインの判断の見本`packages/dragon/examples/login-check.dragon`を`parseNotation`が読んだ時、同じ名前のJSONと同じJSONを返す。英語版の`.en.dragon`と`.en.json`も同じ | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`notation-compiles-flow-examples-to-json`が通る | #3561 |
| 手順の図の記法に、宣言していない箱への線、同じ名札の2度の宣言、名前の無い線を持つ判断、3本以上の線を出す判断、本筋で前に置いた箱へ戻る線、`group`と`scale`と`row`の行のどれかがある時と、箱も判断も1つも無い時は、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`notation-rejects-misused-flow-lines`が通る | #3561 |
| 時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図の記法で`choice <名札> as <問い>`の行を書いた時、その行は手順の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`notation-limits-flow-lines-to-flow`が通る | #3561 |
| 手順の図でない図の記法では、`flow`か`choice`を名札にした箱どうしの線 (`choice -> db`) を今どおり読む | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`notation-keeps-flow-words-plain-outside-flow`が通る | #3561 |
| ログインの判断の図を記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-roundtrip-keeps-json-identical`が通る | #3561 |
| 段で通る本筋の箱と判断が、通る順に上から1列に並び、中心の横の位置がそろう。判断はひし形で描かれ、問いの字がひし形の内に収まる | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-places-main-path-top-to-bottom`が通る | #3561 |
| 本筋に無い箱は、そこへ線を出す最初の判断の右に置かれ、判断から本筋でない箱への線は判断の右の角から出る。2つの判断の線が同じ箱へ集まる時も、線どうしが重ならない | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-side-paths-leave-choice-to-the-right`が通る | #3561 |
| 最初の段より前に書いた線は最初の段から点線で描かれ、段の中の線はその段で実線で現れ、段の印がその線に沿って進む | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-dotted-lines-and-marker`が通る | #3561 |
| ログインの判断の図を原本のJSONから描いた時、4段が順に動き、段1で印が始まりから「入力」へ、段2で「パスワードは正しい？」へ、段3で「2FAは正しい？」へ、段4で「ログイン」を通って終わりへ進む | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`login-check-renders-4-steps`が通る | #3561 |
| 手順の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-keeps-motion-rules`が通る | #3561 |
| ログインの判断の図を日本語と英語で、枠の幅を渡さない時と390を渡した時に描いた時、`dragon check --layout`がどの段でも崩れを何も出さない | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-examples-pass-layout-check`が通る | #3561 |
| 手順の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画のfileに色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3561 |
| `dragon export`が手順の図をmp4、GIF、HTML、PNGの4つに書き出し、同じJSONを2回書き出したPNGがバイト単位で一致し、書き出したHTMLで全ての段を送れる | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-exports-every-format`が通る | #3561 |
| `packages/dragon/examples`にログインの判断の図の日本語と英語の記法とJSONの4つのfileがあり、英語版の箱と判断と線と段の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`flow-example-files-match`が通る | #3561 |
| 今の見本の描いた形は変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3561 |
| 軽い入口が手順の図を読んで描き、既定の入口と同じSVGを出す | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-samples-cover-kinds`と`light-entry-draws-same-svg`と`default-entry-draws-every-kind`が通る | #3561 |
| repoの全ての`.dragon`のfileを`parseNotation`が誤り無く読み、見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`が通る | #3561 |
| 見本帳の一覧に分岐する手順の図の分類が並び、その頁にログインの判断の見本が載り、選ぶと4段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/flow-catalog.test.ts`の検査`catalog-lists-flow-with-examples`が通る | #3561 |
| 見本帳の図の種類だけの部品に判断の部品が並び、頁に日本語と英語の記法と、手順の図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/flow-catalog.test.ts`の検査`catalog-has-flow-parts`が通る | #3561 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3561 |
| 編集画面の棚の見本に手順の図の束があってログインの判断の図が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に`flow`の頭の行と`choice`の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/flow-catalog.test.ts`の検査`editor-shelf-has-flow`が通る | #3561 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) に、頭の語`flow`と`choice`の行の書き方と、最初の段より前の線が点線になることが載り、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedのAddedに手順の図が載り、`.ikkan/premises/product.md`が手順の図を描ける図の種類に数える | `pnpm exec vitest run packages/dragon/test/flow-diagram.test.ts`の検査`docs-describe-flow-diagram`が通る | #3561 |
| 使い方の頁と`CHANGELOG.md`の前の形との対応表の頭の語が、読む部品の語と一致する | `pnpm test`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3561 |
| AIのskillに全ての図の種類の`references/kinds/<種類>.md`が在って`SKILL.md`が全てを名指し、記法の囲みが全て読める | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-covers-every-kind`と`skill-fences-parse`が通る | #3561 |
| 図の種類を足した時に触る登録先が全て一覧に載り、見本帳が最初に読むscriptとCSSが上限に収まる | `pnpm test`の検査`extend-registry-covers-kind-additions`と`page-bundle-within-budget`が通る | #3561 |
