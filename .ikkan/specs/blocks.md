# blocks

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 各ブロックの置き場 (`packages/dragon/src/blocks/<名前>/`) が、語、原本の形、読む処理、書き戻す処理、日英の誤りの文、描き方、付け方、使い方の決まり、見本帳の名前と説明と部品の図と棚の書き始めと使い方の頁の本文を持つ | `pnpm exec vitest run`の検査`block-folder-holds-whole-definition`が通る | #3345、#3347、#3348 |
| 各図の種類の置き場 (`packages/dragon/src/kinds/<種類>/`) が、並べ方と、受け付ける付け方だけを持つ | `pnpm exec vitest run`の検査`kind-folder-holds-layout-and-attach-types`が通る | #3345、#3347、#3348 |
| ブロックを使える図の種類は付け方から導かれ、コアブロックと個別ブロックの分け方も同じ所から導かれる。見本帳の部品の表に手で書いた図の種類の一覧が無い | `pnpm exec vitest run`の検査`block-kinds-derived-from-attach-types`が通る | #3348 |
| ブロックの一覧と図の種類の一覧は置き場の dir から導かれ、手で書いた一覧を持たない | `pnpm exec vitest run`の検査`block-registry-derived-from-folders`が通る | #3345 |
| 今の見本 (`packages/dragon/examples/` の記法と原本) を描いた SVG が、作り直す前に取った SVG と同じになる | `pnpm exec vitest run`の検査`examples-svg-unchanged`が通る | #3345、#3346、#3347、#3348 |
| 記法を読んで原本にし、書き戻すと同じ記法に戻る | `pnpm exec vitest run`の検査`roundtrip-keeps-json-identical`が通る | #3345 |
| 原本の形の検査の関数は、build の時にブロックの形を束ねて書き出され、ブロックの形と食い違うと落ちる | `pnpm exec vitest run`の検査`validator-built-from-block-shapes`が通る | #3346 |
| 原本の JSON はブロックを並べる版2の形になり、版1の JSON を読むと版2へ移して警告を返す | `pnpm exec vitest run`の検査`read-version-1-upgrades-to-blocks`が通る | #3346 |
| `migrateFile` が版1の原本の file を版2の形に書き換える | `pnpm exec vitest run`の検査`migrate-file-writes-version-2`が通る | #3346 |
| 付け方が合う全てのブロックと図の種類の組で、記法を読んで描ける | `pnpm exec vitest run`の検査`every-block-draws-on-every-matching-kind`が通る | #3347 |
| 軽い入口はコアブロックと図の種類を入口に持ち、個別ブロックは書いた図が使う物だけを読む | `pnpm exec vitest run`の検査`light-entry-loads-only-used-blocks`が通る | #3349 |
| 見本帳の分が npm に出す file に入らない | `pnpm exec vitest run`の検査`package-excludes-catalog-material`が通る | #3350 |
| 見本帳の部品の一覧と部品の頁と編集画面の棚と使い方の頁の部品の節は、ブロックの置き場から作られ、一覧の段の名前をコアブロックと個別ブロックにする | `pnpm exec vitest run`の検査`catalog-built-from-block-folders`が通る | #3350 |
| `docs/design/base/GRAMMAR.md` の部品と使い方の表の行が、ブロックの決まりの行をブロックの並びの順に並べた物と同じ | `pnpm exec vitest run`の検査`grammar-parts-table-from-blocks`が通る | #3350 |
| ブロックを足す時の登録先の表が 6 行以下で、置き場の外で個別ブロックを 2 つ以上並べて持つ file が全て表の行に当たる | `pnpm exec vitest run`の検査`extend-registry-block-rows-shrink`が通る | #3350 |
| 前提の部品の考え方の節が、ブロック、コアブロック、個別ブロック、接続ブロック、付け方、図、図の種類の言葉で書かれ、ブロックと図の種類の置き場の dir を名指す | `pnpm exec vitest run`の検査`parts-concept-names-block-and-kind-folders`が通る | #3350 |
| 前提の目的の節が、mermaid と同じ手軽さで書けて表示まで出る理念を書き、script の 1 行の入口の課題 #3343 を名指す | `pnpm exec vitest run`の検査`premise-purpose-names-script-entry`が通る | #3350 |
