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
| `.claude/skills/dragon-extend/references/registry.md` のブロックを足す時の表が6行以下で、表の path が全て在る | `pnpm exec vitest run`の検査`extend-registry-block-rows-shrink`が通る | #3350 |
| 見本帳の名前と説明と部品の図と使い方の頁の本文は、npm に出す package の file に入らない | `pnpm exec vitest run`の検査`package-excludes-catalog-material`が通る | #3350 |
| 見本帳の部品の一覧と部品の頁と編集画面の棚と使い方の頁の部品の節は、ブロックの置き場から作られ、一覧の段の名前をコアブロックと個別ブロックにする | `pnpm exec vitest run`の検査`catalog-built-from-block-folders`が通る | #3350 |
| `docs/design/base/GRAMMAR.md` の部品の表はブロックの使い方の決まりから作られ、食い違うと落ちる | `pnpm exec vitest run`の検査`grammar-parts-table-from-blocks`が通る | #3350 |
| 前提の `## 部品の考え方` の節が、ブロック、コアブロック、個別ブロック、接続ブロック、付け方、図、図の種類の言葉で書かれ、ブロックと図の種類の置き場の dir を名指し、名指す path が全て在る | `pnpm exec vitest run`の検査`parts-concept-names-block-and-kind-folders`が通る | #3350 |
| 前提の `## 目的` の節が、mermaid と同じ手軽さで書けて表示まで出ることを理念として書き、script の1行の入口の課題 #3343 を名指す | `pnpm exec vitest run`の検査`premise-purpose-names-script-entry`が通る | #3350 |
| 図の1行目に`[note: pop]`を書いた時、`note`を持つ箱だけが右上にiの印を持ち、名前の下に`note`の字を描かない | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-badge-only-on-boxes-with-note` passes | #3877 |
| 印の付いた箱を押した時、その箱のすぐ下に、箱の名前と`note`の全文を持つ札が出る | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-opens-card-under-box` passes | #3877 |
| 箱に`[example: …]`を書いた時だけ、札の下に例の帯が出る | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-example-band-only-when-written` passes | #3877 |
| 札の外か閉じるのアイコンを押した時、札が閉じる | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-closes-outside` passes | #3877 |
| 札を開いたまま段を送った時、札が閉じる | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-closes-on-step` passes | #3877 |
| sequence、architecture、flowの3種類で、同じ書き方で印と札が出る | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-same-in-three-kinds` passes | #3877 |
| Markdownの頁の上の行に`note: pop`を書いた時、頁の全ての図が札で見せ、1行目に`[note: under]`を書いた図だけは名前の下の字で見せる | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `page-note-pop-default-and-override` passes | #3877 |
| 印刷の形で、全ての札が箱の下に開いて描かれる | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-print-opens-all-cards` passes | #3877 |
| 図の1行目の`note`に`pop`と`under`の外の値を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-mode-unknown-refused` passes | #3877 |
| 札で見せない図の箱に`[example: …]`を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `example-without-pop-refused` passes | #3877 |
| `[note: pop]`を書かない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3877 |
