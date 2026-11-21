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
| ドーナツの輪の真ん中の段の名前が輪の内側の円に収まらない時、`dragon check --layout`がその名前の最初の段に`title-outside-ring`を1件出し、日本語と英語の文が段の名前を名指す。円に収まる名前と、輪を持たない横棒の図の名前では出さない | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-examples-pass-layout-check`が通る | #3560 |
| 量の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画のfileに色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3560 |
| `dragon export`が量の図をmp4、GIF、HTML、PNGの4つに書き出し、同じJSONを2回書き出したPNGがバイト単位で一致し、書き出したHTMLで全ての段を送れる | `pnpm exec vitest run packages/dragon/test/kind-cli.test.ts`の検査`chart-exports-every-format`が通る | #3560 |
| `packages/dragon/examples`に2つの見本の日本語と英語の記法とJSONの8つのfileがあり、英語版の項目と段と段ごとの`set`の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-example-files-match`が通る | #3560 |
| 今の9種類の見本の描いた形は変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3560 |
| 軽い入口が量の図を読んで描き、既定の入口と同じSVGを出す | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-samples-cover-kinds`と`light-entry-draws-same-svg`と`default-entry-draws-every-kind`が通る | #3560 |
| repoの全ての`.dragon`のfileを`parseNotation`が誤り無く読み、見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`が通る | #3560 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3560 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) に、頭の語`chart`と`[shape: donut]`と`[shape: bar]`と、`item`と`set`の行の書き方が載り、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedのAddedに量の図が載り、`.ikkan/premises/product.md`の描ける図の種類が10になる | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`docs-describe-chart-diagram`が通る | #3560 |
| AIのskillに全ての図の種類の`references/kinds/<種類>.md`が在って`SKILL.md`が全てを名指し、記法の囲みが全て読める | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-covers-every-kind`と`skill-fences-parse`が通る | #3560 |
| 図の種類を足した時に触る登録先が全て一覧に載り、見本帳が最初に読むscriptとCSSが上限に収まる | `pnpm test`の検査`extend-registry-covers-kind-additions`と`page-bundle-within-budget`が通る | #3560 |
| 量の図の原本の JSON が`shape: funnel`を受け付ける | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`schema-accepts-chart-funnel`が通る | #3621 |
| `[shape: funnel]`の量の図の記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`chart-funnel-roundtrip-keeps-notation`が通る | #3621 |
| 漏斗の見た目は項目を上から書いた順に左揃えの横の棒で並べ、棒の長さを最初の項目の値に比べて決める | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`chart-funnel-bars-follow-the-values`が通る | #3621 |
| 段の中で項目に`set`を書くと、その段でその項目の棒が現れ、前の項目との差を薄い棒で残して去った数と割合を出す | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`chart-funnel-shows-who-left`が通る | #3621 |
| 最後の段で、最初の項目のうち最後の項目まで残った割合を出す | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`chart-funnel-shows-the-overall-rate`が通る | #3621 |
| 前の項目より大きい値を書いた漏斗の見た目の量の図は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/chart-funnel.test.ts`の検査`chart-funnel-rejects-a-rising-value`が通る | #3621 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、漏斗の見た目の書き方が在る | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-funnel-docs-describe-the-shape`が通る | #3621 |
| 漏斗の見た目の見本2枚 (一般の`shop-funnel`とWeb3の`wallet-onboarding`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じで、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-funnel-examples-in-both-langs-have-no-breaks`が通る | #3621 |
| 編集画面の棚に漏斗の見た目の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-funnel-shelf-template-reads`が通る | #3621 |
| 今の量の図の記法 (`[shape: donut]`と`[shape: bar]`) を読んで書き戻すと、今と同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-roundtrip-keeps-json-identical`が通る | #3621 |
| カタログのどの種類も見本を4枚以上載せ、種類の数は変わらない | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3621 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3621 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3621 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3621 |
| 量の図の原本のJSONで種類の欄`chart`の`shape`に`line`を書き、2つの段で項目に値を書いた時、原本の検査が通る | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`schema-accepts-chart-line`が通る | #3802 |
| `chart <題> [shape: line]`と`item`と段の中の`set`で書いた記法を`parseNotation`が読み、見た目`line`の原本を返し、書き戻すと同じ記法を返す | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-roundtrip-keeps-notation`が通る | #3802 |
| 折れ線の見た目の図を描いた時、縦の軸が0から、一番大きい値を1か2か2.5か5に10の累乗を掛けた刻みで切り上げた上端までの刻みの線と値を描き、横の軸が段の題を段の順に点の下へ並べる | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-draws-both-axes`が通る | #3802 |
| 項目を2つ以上書いた時、項目ごとに色の違う線を1本ずつ引き、図の上の凡例に宣言した順で項目の名前を出す | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-draws-one-colored-line-per-item`が通る | #3802 |
| 段を送った時、各段の止め絵の時刻で、線が前の段の点から新しい段の点まで伸びて先へは伸びておらず、着いた点に丸が出て、その段の値の字が点の右に出る | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-grows-from-the-previous-point`が通る | #3802 |
| 値を書かない段で項目が前の段の値の高さに点を置き、最初に値を書いた段より前は点も線も出さない | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-keeps-values-and-starts-late`が通る | #3802 |
| 止めて置く図 (`figure: true`) で描いた時、全ての線を最後の点まで描き、図の上の行に図の題を出し、横の軸の名前は段の題のまま残す | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-still-figure-draws-every-line`が通る | #3802 |
| 折れ線の見た目の規則 (CSS) は折れ線の図のSVGにだけ書き、ドーナツと横棒と漏斗と点の図のSVGには書かない | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-css-stays-in-line-charts`が通る | #3802 |
| 記法の誤りを`dragon check`と同じ検査で読んだ時、数でない値、どの段にも値を書かない項目、`set none`、段が1つだけの図を拒み、日本語と英語の文と行と列で示す | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-rejects-notation-errors`が通る | #3802 |
| 原本のJSONで、どの段にも値を書かない項目、`none`の値、段が1つだけの図を検査が拒み、誤った欄の場所をJSON Pointerで示し、英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-schema-rejects-errors`が通る | #3802 |
| 折れ線の見本の日本語版と英語版が`packages/dragon/examples`に在り、記法として読め、既定の幅と幅390で描いて崩れの知らせが0件で、両方の項目と段と段ごとの`set`の数が同じで、見本帳の見本の一覧と量の図の頁に並ぶ | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-line-examples-in-both-langs-have-no-breaks`が通る | #3802 |
| 棚の記法の早見に`chart <題> [shape: line]`の頭の行が在り、量の図の見本の束に折れ線の見本が在って折れ線の図として読める | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-line-shelf-template-reads`が通る | #3802 |
| 根のREADMEとpackageのREADMEと使い方の頁と手引きとスキルの`chart.md`が`[shape: line]`の書き方を持ち、変更履歴のAddedに日本語と英語で載る | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`chart-line-docs-describe-the-shape`が通る | #3802 |
| 今の見本の描いたSVGの指紋が変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3802 |
| 止めて置く図の横棒とドーナツが段の名前の所に図の題を出す | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`still-figure-bar-chart-shows-title`と`still-figure-donut-shows-title`が通る | #3802 |
| 描く本体 (`render/draw.ts`) が後から読む種類の名前を持たない | `pnpm exec vitest run packages/dragon/test/kind-dispatch.test.ts`の検査`draw-names-no-later-kind`が通る | #3802 |
| 見本帳が最初に読むscriptとCSSがgzipで上限186KBに収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3802 |
| 見本帳の字の切り出しが、見本帳の全ての字を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/site-font.test.ts`の検査`site-font-covers-every-word`が通る | #3802 |
