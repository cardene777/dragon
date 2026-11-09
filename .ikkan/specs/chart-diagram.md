# chart-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind`が`chart`の原本のJSONをJSON Schemaで検査した時、種類の欄`chart`に見た目 (`shape`、`donut`か`bar`) と項目の宣言 (`items`、名札と名前と色) を持ち、段の中に項目の値を変える出来事 (`set`) を持つ図は通る | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`schema-accepts-chart-diagram`が通る | #3560 |
| `chart`の欄か値の出来事を量の図でない図に書いた時、量の図に`git`、`state`、`sequence`、`time`の欄を書いた時、`shape`に`donut`と`bar`のほかの値を書いた時、値に負の数か数でない値を書いた時、検査が落ちて誤った欄の場所をJSON Pointerで示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`schema-rejects-misplaced-chart-fields`が通る | #3560 |
| schemaが使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3560 |
| ドーナツの見本`packages/dragon/examples/os-share.dragon`と横棒の見本`packages/dragon/examples/tickets.dragon`を`parseNotation`が読んだ時、同じ名前のJSONと同じJSONを返す。英語版の`.en.dragon`と`.en.json`も同じ | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`notation-compiles-chart-examples-to-json`が通る | #3560 |
| 量の図の記法に、宣言していない項目への`set`、同じ名札の2度の`item`、最初の`step`より前の`set`、数でない値か負の値の`set`、`donut`と`bar`のほかの`shape`、9つ以上の`item`、箱と線と`group`の行のどれかがある時と、`item`の行が1つも無い時は、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`notation-rejects-misused-chart-lines`が通る | #3560 |
| 量の図でない図の記法では、`chart`を名札にした箱どうしの線 (`chart -> db`) と、列の図と試す図の`item`の行と、帯の`set`の行を今どおり読む | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`notation-keeps-chart-words-plain-outside-chart`が通る | #3560 |
| 2つの見本を記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-roundtrip-keeps-json-identical`が通る | #3560 |
| `[shape: donut]`の図を描いた時、項目ごとの弧が値を合計で割った割合の角度を持ち、12時の向きから時計回りに宣言した順で並ぶ。輪の真ん中に段の名前が出て、凡例に項目の名前と整数に丸めた割合 (%) が宣言した順に並ぶ | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-donut-draws-arcs-by-share`が通る | #3560 |
| `[shape: bar]`の図を描いた時、項目ごとの横棒が宣言した順に上から並び、棒の長さが値を一番大きい値で割った割合に比例する。棒の左に項目の名前、棒の端に値が出る | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-bar-draws-lengths-by-value`が通る | #3560 |
| 段を送った時、弧と棒が前の段の値から新しい値へ動く。`set`を書かない項目は前の段の値を保ち、まだ値の無い項目は0として弧も棒も出さない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-values-move-from-previous-step`が通る | #3560 |
| 量の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-keeps-motion-rules`が通る | #3560 |
| 2つの見本を日本語と英語で、枠の幅を渡さない時と390を渡した時に描いた時、`dragon check --layout`がどの段でも崩れを何も出さない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-examples-pass-layout-check`が通る | #3560 |
| 量の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画のfileに色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3560 |
| `dragon export`が量の図をmp4、GIF、HTML、PNGの4つに書き出し、同じJSONを2回書き出したPNGがバイト単位で一致し、書き出したHTMLで全ての段を送れる | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-exports-every-format`が通る | #3560 |
| `packages/dragon/examples`に2つの見本の日本語と英語の記法とJSONの8つのfileがあり、英語版の項目と段と段ごとの`set`の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-example-files-match`が通る | #3560 |
| 今の9種類の見本の描いた形は変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3560 |
| 軽い入口が量の図を読んで描き、既定の入口と同じSVGを出す | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-samples-cover-kinds`と`light-entry-draws-same-svg`と`default-entry-draws-every-kind`が通る | #3560 |
| repoの全ての`.dragon`のfileを`parseNotation`が誤り無く読み、見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`が通る | #3560 |
| 見本帳の一覧に図の分類が10並び、量を比べる図の頁にドーナツと横棒の2つの見本が載り、選ぶと段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/chart-catalog.test.ts`の検査`catalog-lists-chart-with-examples`が通る | #3560 |
| 見本帳の図の種類だけの部品に、量の図の項目と値と見た目の部品が並び、頁ごとに日本語と英語の記法と、量の図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/chart-catalog.test.ts`の検査`catalog-has-chart-parts`が通る | #3560 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3560 |
| 編集画面の棚の見本に量の図の束があって2つの見本が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に`chart`の頭の行と`[shape: ]`があり、`item`と`set`の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/chart-catalog.test.ts`の検査`editor-shelf-has-chart`が通る | #3560 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) に、頭の語`chart`と`[shape: donut]`と`[shape: bar]`と、`item`と`set`の行の書き方が載り、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedのAddedに量の図が載り、`.ikkan/premises/product.md`の描ける図の種類が10になる | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`docs-describe-chart-diagram`が通る | #3560 |
| 使い方の頁と`CHANGELOG.md`の前の形との対応表の頭の語が、読む部品の語と一致する | `pnpm test`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3560 |
| AIのskillに全ての図の種類の`references/kinds/<種類>.md`が在って`SKILL.md`が全てを名指し、記法の囲みが全て読める | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-covers-every-kind`と`skill-fences-parse`が通る | #3560 |
| 図の種類を足した時に触る登録先が全て一覧に載り、見本帳が最初に読むscriptとCSSが上限に収まる | `pnpm test`の検査`extend-registry-covers-kind-additions`と`page-bundle-within-budget`が通る | #3560 |
