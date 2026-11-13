# line-style

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 線の描き方を選ばずに描くと、全部の見本と部品の図のSVGが今と1字も違わない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3643 |
| 描く時の指定`line: "pen"`で描くと、絵柄と字と図の地の枠を除く形 (箱の縁、線、矢印、段の番号の輪、commit の印、小さな札、枝の帯、囲み) が`rect`、`circle`、`ellipse`、`line`、`polygon`、`polyline`でなく`path`で描かれ、その`path`がまっすぐな線と正確な円でない | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-wobbles-shapes`が通る | #3643 |
| `line: "pen"`で描いても、図の形 (箱の位置と大きさ) と字の要素 (位置と中身) が既定の線で描いた図と同じ | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-keeps-layout-and-text`が通る | #3643 |
| 同じ図を`line: "pen"`で2回描くと、SVGが1字も違わない | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-is-deterministic`が通る | #3643 |
| `line: "pen"`で描いても、開いた線の端と折れ目と、尖った角は元の位置から動かず、矢じりの先は箱に着いたまま | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-keeps-ends-and-corners`が通る | #3643 |
| `line: "pen"`で描いても、絵柄の線は既定の線と同じ形のまま | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-leaves-glyphs`が通る | #3643 |
| `line: "pen"`で描いた図をブラウザで開くと、どの形の塗りと線の色と太さも既定の線で描いた図と同じ | `pnpm exec vitest run packages/dragon/test/pen-line-colors.test.ts`の検査`pen-line-keeps-colors`が通る | #3643 |
| 全部の部品の図を`line: "pen"`で`dragon check --layout`と同じ形にかけると、崩れの知らせが0件 | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-parts-have-no-breaks`が通る | #3643 |
| 全部の見本を`line: "pen"`で`dragon check --layout`と同じ形にかけると、崩れの一覧 (`packages/dragon/test/fixtures/layout-breaks.json`) に記録した崩れのほかに知らせが出ない | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`pen-line-examples-add-no-breaks`が通る | #3643 |
| 図を差し込む関数`mountDiagram`に`line: "pen"`を渡すと、止めて見せる図も寄って追う図も手描きの線で描かれる | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`player-draws-pen-line`が通る | #3643 |
| `dragon export --line pen`で書いたHTMLの図が手描きの線で描かれる | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`cli-export-draws-pen-line`が通る | #3643 |
| `dragon export --line`に`ruler`と`pen`のほかの値を渡すと、使える値を挙げて終了2で断り、何も書かない | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`cli-refuses-unknown-line`が通る | #3643 |
| `packages/dragon/README.md`と`packages/dragon/README.ja.md`の書き出しの指定の表に`--line`の行が在り、`ruler`と`pen`を挙げる | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`readme-lists-line-option`が通る | #3643 |
| `CHANGELOG.md`と`CHANGELOG.ja.md`の#3643の項を持つ節に`--line`が在る | `pnpm exec vitest run packages/dragon/test/pen-line.test.ts`の検査`changelog-lists-pen-line`が通る | #3643 |
| 編集画面の色味の選び口の隣に線の描き方の選び口が在り、手描きを押すと図が手描きの線で描き直される | `pnpm exec vitest run apps/playground-spa/src/lib/line-style.test.tsx`の検査`stage-picks-pen-line`が通る | #3643 |
| 編集画面で手描きを選んで書き出すと、書き出したHTMLの図も手描きの線で描かれる | `pnpm exec vitest run apps/playground-spa/src/lib/line-style.test.tsx`の検査`export-menu-keeps-pen-line`が通る | #3643 |
| 図の書き方の頁の書き出しの設定の表に`--line`の行が在り、線の描き方の節に手描きの線の見本の図が載る | `pnpm exec vitest run apps/playground-spa/src/lib/line-style.test.tsx`の検査`docs-show-line-style`が通る | #3643 |
| 最初に読む script の大きさは今の上限 (gzip 後の合計90000バイト) に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3643 |
| 見本帳の頁が最初に読む大きさは今の上限 (184KB) に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3643 |
