# matrix-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `matrix`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`schema-accepts-matrix-diagram`が通る | #3622 |
| `matrix`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-roundtrip-keeps-notation`が通る | #3622 |
| 2つの軸で置く図を描くと、`box`を書いた順に左上、右上、左下、右下の区画に置き、区画の名前を区画の左上に出す | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-areas-go-left-to-right-top-to-bottom`が通る | #3622 |
| `axis <名前> [from: <字>, to: <字>]`の1行目を横の軸、2行目を縦の軸にし、軸の名前と両端の字を矢印の軸に出す | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-axes-show-names-and-ends`が通る | #3622 |
| まだ`line`で区画に置いていない`item`を、区画の左の置く前の一覧に書いた順に並べる | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-items-wait-in-the-unplaced-list`が通る | #3622 |
| 段の中に`line <区画>: <課題>`を書くと、その段で課題の札が置く前の一覧から区画へ動き、その区画を光らせる | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-line-moves-the-item-into-the-area`が通る | #3622 |
| 区画の`box`が4つでない図は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-four-areas`が通る | #3622 |
| `axis`が2行でない図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-two-axes`が通る | #3622 |
| 無い区画か無い課題を書いた`line`は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-an-unknown-item-or-area`が通る | #3622 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、2つの軸で置く図を読んで描ける | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-light-entry-draws-after-load-for`が通る | #3622 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、2つの軸で置く図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-docs-describe-the-notation`が通る | #3622 |
| ほかの種類の図では、`matrix`と`axis`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`notation-keeps-matrix-words-plain-outside-matrix`が通る | #3622 |
| カタログの種類が2つの軸で置く図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3622 |
| 2つの軸で置く図の見本5枚 (`task-priority`、`risk-matrix`、`feature-scores`、`token-listing`、`chain-choice`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-has-five-examples-in-both-langs`が通る | #3622 #3637 |
| 2つの軸で置く図の見本は一般の題 (`task-priority`、`risk-matrix`、`feature-scores`) とWeb3の題 (`token-listing`、`chain-choice`) を持つ | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-examples-cover-general-and-web3`が通る | #3622 #3637 |
| 2つの軸で置く図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-examples-have-no-breaks`が通る | #3622 |
| 編集画面の棚に2つの軸で置く図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/matrix-examples.test.ts`の検査`matrix-shelf-template-reads`が通る | #3622 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts --reporter=verbose`の検査`page-bundle-within-budget`が通る | #3622 #3637 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts --reporter=verbose`の検査`renderers-read-values-from-one-table`が通る | #3622 #3637 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts --reporter=verbose`の検査`examples-svg-unchanged`が通る | #3622 #3637 |
| 図の種類の行の`shape: "scatter"`と`table: "none"`、項目の`x`と`y`、軸の`reverse`を持つ原本の JSON を、形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`schema-accepts-scatter-look`が通る | #3637 |
| `matrix <題> [shape: scatter]`の行と、`item <id> as <名前> [x: <横>, y: <縦>]`の行と、`axis <名前> [reverse: yes]`の行と、段の`line: <項目>`の行を持つ記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-roundtrip-keeps-notation`が通る | #3637 |
| `[shape: scatter]`の図を描くと、0から10の目盛りの軸に項目を点数どおりの位置の点で打ち、点数が大きいほど右と上に置き、打った段に両方の軸から点まで線を引いて軸の上に点数の札を出す | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-plots-items-at-their-scores`が通る | #3637 |
| 段の`line: <項目>`は、その段で項目の点を打ち、点数から決めた区画を光らせる。区画は軸ごとに5以上を大きい側にする | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-line-lights-the-area-from-scores`が通る | #3637 |
| 区画を書いた`line <区画>: <項目>`で、区画が項目の点数から決めた区画と違う時、読む時に区画と点数を名指す日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`matrix-rejects-an-area-that-disagrees-with-scores`が通る | #3637 |
| `[reverse: yes]`を書いた軸は、`[shape: scatter]`の図で大きい値を左か下に打ち、点数から決める区画もその向きで決める | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-reverse-axis-puts-large-values-left-or-down`が通る | #3637 |
| `[reverse: yes]`を書いた軸は、札を置く見た目でも矢印の向きを逆にし、軸の両端の字を入れ替えて出す | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`matrix-reverse-axis-flips-the-arrow`が通る | #3637 |
| 札を置く見た目の図でも、点数を書いた項目は`line: <項目>`で点数から決めた区画へ札を置く | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`matrix-chips-take-the-area-from-scores`が通る | #3637 |
| 0から10の外の点数と、小数2桁以上の点数は、読む時に項目と値を名指す誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-rejects-scores-out-of-range`が通る | #3637 |
| `x`か`y`の片方だけを書いた項目、点数の無い項目を区画を書かずに打つ`line: <項目>`、`[shape: scatter]`の無い図の`table: none`、2つの軸で置く図の外の`reverse`と`x`と`y`は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-rejects-misused-words`が通る | #3637 |
| 同じ点数の項目が2つ以上在る時、点は1つにまとめ、後の段で打った項目の名前を前の名前の下に足す | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-merges-items-at-the-same-score`が通る | #3637 |
| `[shape: scatter]`の図は、点の図の左に置く前の課題の表を出し、項目と2つの点数を書いた順に並べ、段で打つ項目の行を光らせる | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-table-lists-items-with-scores`が通る | #3637 |
| 図の種類の行に`table: none`を書くと、置く前の課題の表を出さずに点の図を枠の幅いっぱいに描く | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-table-none-draws-the-plot-alone`が通る | #3637 |
| 携帯の幅 (390) では、置く前の課題の表を上に置き、点の図を幅いっぱいに下へ積む | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-stacks-table-above-plot-at-phone-width`が通る | #3637 |
| 見本帳に`[shape: scatter]`の見本`feature-scores`が日本語と英語で1枚ずつ在り、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-examples-in-both-langs-have-no-breaks`が通る | #3637 |
| 編集画面の棚に`[shape: scatter]`の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-shelf-template-reads`が通る | #3637 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、`[shape: scatter]`の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-light-entry-draws-after-load-for`が通る | #3637 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/README.ja.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、`[shape: scatter]`と点数と`reverse`の書き方が在る | `pnpm exec vitest run packages/dragon/test/scatter-look.test.ts --reporter=verbose`の検査`scatter-docs-describe-the-look`が通る | #3637 |
| 点数を書かない今の2つの軸で置く図は、`line <区画>: <項目>`で今と同じ区画へ札を置く | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts --reporter=verbose`の検査`matrix-line-moves-the-item-into-the-area`が通る | #3637 |
| 今の2つの軸で置く図の記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts --reporter=verbose`の検査`matrix-roundtrip-keeps-notation`が通る | #3637 |
