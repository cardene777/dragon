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
