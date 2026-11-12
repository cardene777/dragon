# dots-look

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 原本のJSONの形の検査が、量の図と集合の重なりの図の`shape: dots`と、1点の件数`unit`を受け付ける | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`schema-accepts-dots-look`が通る | #3635 |
| `chart <題> [shape: dots]`と`venn <題> [shape: dots]`の記法を頭の行の`[unit: <数>]`と量の図の`set none: <数>`も含めて読んで書き戻した時と、`set none: <数>`を書いた`[shape: donut]`と`[shape: bar]`の量の図の記法を読んで書き戻した時に、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-roundtrip-keeps-notation`が通る | #3635 |
| 頭の行に`unit`を書かない時、1と2と5に10の累乗を掛けた数のうち、全体が最も大きい段で点の数が100に最も近くなる値を1点の件数に選び、段の間で変えない | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-unit-picks-a-round-number`が通る | #3635 |
| 頭の行に`[unit: <数>]`を書いた時、1点の件数をその値にする | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-unit-follows-the-head-line`が通る | #3635 |
| 書いた`unit`で点の数がどれかの段で200を超える図は、読む時に頭の行と上限の200を名指して`unit`を上げるよう促す日本語と英語の誤りの文を返し、図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-rejects-too-many-dots`が通る | #3635 |
| 集合の重なりの図に`dots`のほかの`shape`を書いた時と、`dots`でない図に`unit`を書いた時と、`unit`に0より大きい数でない値を書いた時は、読む時に日本語と英語の誤りの文を返し、図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-rejects-misused-words`が通る | #3635 |
| 群れの件数を1点の件数で割って四捨五入した数の点を描き、群れの名前の近くに件数を字で正確に出す | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-round-counts-and-show-exact-text`が通る | #3635 |
| 全体の箱に、群れの件数と`none`の件数の和を1点の件数で割った数の空の点を描き、集まりか項目に初めて件数を書いた段で、その件数の点が箱から群れへ寄る | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-move-from-box-to-groups`が通る | #3635 |
| `set none: <数>`を書いた段で、どこにも入らない点を全体の箱に灰色で残す | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-none-stays-grey-in-the-box`が通る | #3635 |
| 集合の重なりの図で2つ以上の集まりに入る点を、入る集まりの色で1点を扇形に等分に塗る | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-venn-paints-overlaps-as-pie-slices`が通る | #3635 |
| 量の図で項目ごとの点を1行に並べ、図の幅に収まる点の数で折り返し、項目の名前を左に揃える | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-chart-lays-items-in-rows`が通る | #3635 |
| 段を送った時、点は群れごとに少しずらした時刻に滑り始める | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-groups-slide-with-a-stagger`が通る | #3635 |
| 段を送って件数が増えた時は増えた分の点が弾んで現れ、減った時は減った分の点が消えていく | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-added-pop-and-removed-fade`が通る | #3635 |
| 枠の幅に390を渡して描いた時、全体の箱を上に置き、点の群れをその下に積む | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-stack-box-above-groups-at-phone-width`が通る | #3635 |
| 点で数える見た目の見本2枚 (一般の量の図`device-dots`とWeb3の集合の重なりの図`wallet-dots`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じで、枠の幅を渡さない時と390を渡した時に`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-examples-in-both-langs-have-no-breaks`が通る | #3635 |
| 編集画面の棚に点で数える見た目の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-shelf-template-reads`が通る | #3635 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、点で数える見た目の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-light-entry-draws-after-load-for`が通る | #3635 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`と、AIのskillの量の図と集合の重なりの図の手引きに、点で数える見た目の書き方と量の図の`set none`の書き方が在る | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`dots-docs-describe-the-look`が通る | #3635 |
| `[shape: donut]`と`[shape: bar]`の量の図で`set none: <数>`を書いた段で、どこにも入らない件数を項目の後ろに灰色の弧か棒で描き、集合の重なりの図と同じ言葉 (`どれにも入らない`、`In none`) で名前を出す | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`chart-none-draws-grey-in-donut-and-bar`が通る | #3635 |
| `[shape: funnel]`の量の図で`set none: <数>`を書いた時は、今どおり宣言していない項目として誤りを返し、図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/dots-look.test.ts`の検査`chart-funnel-keeps-none-undeclared`が通る | #3635 |
| 今の量の図の記法 (`[shape: donut]`と`[shape: bar]`) を読んで書き戻すと、今と同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/chart-diagram.test.ts`の検査`chart-roundtrip-keeps-json-identical`が通る | #3635 |
| `[shape: dots]`を書かない集合の重なりの図を読んで書き戻すと、今と同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-roundtrip-keeps-notation`が通る | #3635 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3635 |
| 描き方のfileは色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3635 |
| カタログのどの種類も見本を4枚以上載せ、種類の数は変わらない | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3635 |
| 見本帳が最初に読むscriptとCSSはgzipで184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3635 |
