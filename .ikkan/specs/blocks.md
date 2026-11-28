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
| `[note: pop]`を書かない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3877 #3896 |
| `scene`を2つ書いた図を並べる見せ方で描いた時、2つの場面が縦に並び、同じ箱が全ての場面で同じ横の位置に描かれる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-stack-same-box-positions` passes | #3878 |
| 共通の段の線は全ての場面に描かれ、`scene`と`end`の間の段の線は、その場面にだけ描かれる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-own-steps-only-in-their-scene` passes | #3878 |
| 並べる見せ方で段を送った時、全ての場面が同じ段へ同時に進み、`stop <理由>`を書いた段に着いた場面は、そこで止まって理由の文を出し、後の段を進めない | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-stop-holds-and-shows-reason` passes | #3878 |
| 並べる見せ方で、共通の段の線は灰色、`scene`の中の段の線は場面の色で描く。分かれる位置の縦の点線は #4019 で分かれ目の札に替えた | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-fork-badge-and-colors` passes | #3878 |
| 図の1行目に`[scenes: pick]`を書いた時、場面の名前の釦が出て、釦を押すとその場面の1段目に戻り、段を送ると選んだ場面の段だけを進める | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-pick-buttons-follow-one-scene` passes | #3878 |
| flowとlineupの2種類で、同じ書き方の`scene`と`stop`で場面を持てる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-same-in-flow-and-lineup` passes | #3878 |
| 印刷の形では、並べる見せ方でも選ぶ見せ方でも、全ての場面を最後の段まで進めて縦に並べる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-print-stacks-all-at-last-step` passes | #3878 |
| 幅728pxの枠で、場面の図の字が10.5px以上で描かれる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-text-readable-at-728` passes | #3878 |
| 1行目に`[note: pop]`を書いた場面の図で箱を押した時、押した場面の箱のすぐ下に札が開く | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-note-card-opens-under-pressed-scene` passes | #3878 |
| 4つ目の`scene`を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-fourth-refused` passes | #3878 |
| 図の1行目の`scenes`に`stack`と`pick`の外の値を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-unknown-mode-refused` passes | #3878 |
| `try`の図に`scene`を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-in-try-refused` passes | #3878 |
| `scene`の外の段に`stop`を書いた時と、`end`で閉じない`scene`を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/scenes.test.ts` check `scenes-stop-outside-and-unclosed-refused` passes | #3878 |
| `scene`を書かない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3878 |
| `gauge budget as 1日の予算 [on: vi, limit: 100, unit: USDC]`を宣言し、段で`set budget: 20`を書いた時、棒が上限の2割まで動き、「20 / 100 USDC」の字が出る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-bar-moves-to-value` passes | #3880 |
| 目盛りは`on`で指した箱のすぐ下に描かれ、`on`を書かない目盛りは図の上の帯に描かれる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-under-its-box-or-top-band` passes | #3880 |
| 同じ箱を指す目盛りは、宣言した順に箱の下に縦に積まれる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-stacks-in-declared-order` passes | #3880 |
| 値を書かない段は前の段の値を保ち、前より小さい値を書いた段で棒が縮む | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-keeps-and-shrinks` passes | #3880 |
| 値が変わった段で、棒の横に増えた量 (`+20`) か減った量 (`−20`) の札が出る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-delta-chip-on-change` passes | #3880 |
| 上限を超えた値の段で、上限の位置に点線が引かれ、超えた分だけが赤で伸び、値の字が赤になる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-over-limit-extends-red` passes | #3880 |
| 上限を超えた段で目盛りのすぐ下に「上限を超えた」の札が出て、宣言に`[over: <字>]`を書いた時はその字に替わる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-over-label-default-and-override` passes | #3880 |
| 上限を書かない目盛りは、棒を描かず値と単位だけを出す | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-without-limit-shows-value-only` passes | #3880 |
| flowとlineupの2種類で、同じ書き方で目盛りを置ける | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-same-in-flow-and-lineup` passes | #3880 |
| 幅728pxの枠で、目盛りの字が10.5px以上で描かれる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-text-readable-at-728` passes | #3880 |
| `on`に宣言していない箱を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-unknown-box-refused` passes | #3880 |
| 宣言していない目盛りへの`set`と、負の数か数でない値の`set`を書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-bad-set-refused` passes | #3880 |
| 目盛りの名札が同じ図の別の名札と同じ時と、`gauge`を段の中に書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-name-clash-or-in-step-refused` passes | #3880 |
| 目盛りを書かない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3880 |
| 場面の図 (手順の図と列の図) で、場面の中の段の`set`はその場面の目盛りだけを動かし、並べる見せ方でも選ぶ見せ方でも、場面ごとの最後の段の目盛りがその場面の値を出す | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `scene-gauge-moves-only-its-scene` passes | #3894 |
| 並べる見せ方で、全ての場面の図に宣言した目盛りが1つずつ出て、箱を指した目盛りはその場面の図の箱の下に出る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `scene-gauge-under-each-scene-box` passes | #3894 |
| 共通の段で書いた値は全ての場面の目盛りに出て、`set`を書かない場面の段は共通の段の値を保つ | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `scene-gauge-keeps-common-value` passes | #3894 |
| 見本帳の列の図の場面の見本 (日本語と英語) を、最初の行に`view`を書かずにPNGとSVGとHTMLへ書き出せる | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scene-lineup-sample-exports` passes | #4018 |
| 列の図に場面と目盛りを書いた原本を、並べる見せ方と選ぶ見せ方の両方でSVGとHTMLへ書き出せる | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scene-lineup-gauge-exports-both-shows` passes | #4018 |
| 場面を持つ図 (手順の図と列の図) は、見せ方を選ぶ決まりが枠の幅に依らず止めた形を選び、書き出しも止めた形で書く | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scene-figures-stay-fixed` passes | #4018 |
| 見本と部品の図を描いた絵は今と同じになる | `pnpm exec vitest run packages/dragon/test/export-svg.test.ts packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `examples-svg-unchanged` passes | #4018 |
| 並べる見せ方の場面の図 (手順の図と列の図、日本語と英語) は、場面ごとに分かれる箱か帯の上の縁に、場面の色で「ここから分かれる」(英語は「splits here」) の札を1つ付け、縦の点線を引かない。選ぶ見せ方の図と場面が1つの図には札を付けない。共通の段の線は灰色、場面の段の線は場面の色のまま | `pnpm exec vitest run packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scenes-fork-badge-and-colors` passes | #4019 |
| 分かれ目の札は、ほかの箱と帯、線の札、分かれる箱へ入る線の矢じり、目盛り、段の題と文に重ならず、図の枠に収まる | `pnpm exec vitest run packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scenes-fork-badge-clear-of-parts` passes | #4019 |
| 列の図の場面の図で、「この先」の帯はその場面の後の段だけを並べ、後の段が無い段は帯の見出しも描かない | `pnpm exec vitest run packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scenes-ahead-lists-own-steps` passes | #4019 |
| 使い方の頁と手引き (日本語と英語) と文法の表は、分かれる所の札を書き、分かれる所に縦の点線を引くとは書かない | `pnpm exec vitest run packages/dragon/test/scenes.test.ts packages/dragon/test/examples-svg.test.ts --reporter=verbose` check `scenes-docs-name-fork-badge` passes | #4019 |
| `gauge budget as 1日の予算 [on: vi, limit: 100, unit: USDC]`で、段に`set budget: 40 [hold: 30]`を書くと、棒の左から上限の4割までを濃い色、続けて7割までを同じ色の淡い塗りで塗り、値の字は「70 / 100 USDC」になる。手順の図と列の図の2種類で同じ | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-paints-pale-after-confirmed` passes | #3895 |
| 予約を持つ段は、棒の下の行に棒と同じ色の四角を添えて「確定 40」「予約 30」(英語の図は`confirmed 40`と`held 30`) を並べ、予約が0の段はその行を出さない | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-breakdown-row` passes | #3895 |
| `hold`を書かない`set`は予約を0に戻す。`set budget: 40 [hold: 30]`の次の段に`set budget: 70`を書くと70まで濃い色になって淡い分が消え、`set budget: 40`を書くと淡い分が縮んで「−30」の札が出る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-confirm-or-cancel` passes | #3895 |
| 確定と予約の合計が上限を超えた段 (`limit: 100`で`set budget: 80 [hold: 40]`) は、上限の位置から超えた分を赤で伸ばし、値の字「120 / 100 USDC」を赤にして、上限を超えた札を出す | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-over-limit-by-total` passes | #3895 |
| `limit`の無い目盛りへの`hold`と、負の数か数でない`hold`を書いた`set`は、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-bad-hold-refused` passes | #3895 |
| `set budget: 40 [hold: 30]`を読んで書き戻すと同じ記法に戻り、原本のJSONの出来事は`hold: 30`を持つ | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-round-trips` passes | #3895 |
| 幅728pxの枠で、内訳の行の字が10.5px以上で描かれる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-text-readable-at-728` passes | #3895 |
| 使い方の頁の目盛りの段落、文法の表の目盛りの行、手引き (日本語と英語) の目盛りの節、dragonのスキルの`cheatsheet`が`[hold: <量>]`を書き、スキルの`cheatsheet`の版を1.1.0に上げる | `pnpm exec vitest run packages/dragon/test/gauge.test.ts --reporter=verbose` check `gauge-hold-docs` passes | #3895 |
| 目盛りを書かない図と、予約を書かない目盛りの図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3895 |
| `import`と`require`の型のfileで、どの入口からも出ていない型が無く、目盛りの内訳の語の型`Split`は`SceneGauge`と同じ入口から名前で出る | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts --reporter=verbose` check `entry-types-all-exported` passes | #4034 |
| 描く入口の型のfileは今どおり`mountDiagram`と`PlayerOptions`を出し、型で組んだ設定を`mountDiagram`に渡すcodeが型検査を通る | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts --reporter=verbose` check `player-options-type-exported` and `player-options-type-checks` passes | #4034 |
| 最初に読むscriptのgzip後の合計が、上限の90,000 byte以下になる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts` check `script-entry-within-budget` passes | #4043 |
| 最初に読む言葉の表 (`packages/dragon/src/figure-text.ts`) は目盛りの語を持たず、目盛りの語は目盛りのブロックの置き場が持つ | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-words-stay-out-of-first-load` passes | #4043 |
| 上限を超えた札の既定の字は、日本語の図で「上限を超えた」、英語の図で`over the limit`のまま描く | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-over-label-default-and-override` passes | #4043 |
| 内訳の行の語は、日本語の図で「確定」と「予約」、英語の図で`confirmed`と`held`のまま描く | `pnpm exec vitest run packages/dragon/test/gauge.test.ts` check `gauge-hold-breakdown-row` passes | #4043 |
| 全ての見本の図を、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #4043 |
| 1行目に`[note: pop]`を書いた手順の図は、値を1度でも書いた目盛りの名前のすぐ右に丸いiの印を描き、目盛りを印の幅だけ広げて、印と値の字を重ねない | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-mark-after-name` passes | #3896 |
| 印の付いた目盛りを押すと、目盛りのすぐ下に、目盛りの名前と上限と単位を見出しにした札が開き、札の外か閉じるのアイコンを押すか段を送ると閉じる | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-opens-under-gauge` passes | #3896 |
| 札は、目盛りに`set`を書いた段のうち今見ている段までを段の順に並べ、各行は段の番号と名前、増えた量 (増えた段は「+40」、減った段は「−20」、変わらない段は「±0」)、その時の値 (「70 USDC」) を持つ。まだ来ていない段の行は出さない | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-rows-up-to-step` passes | #3896 |
| 上限を書いた目盛りの札の各行は、その段の終わりの目盛りを図と同じ塗り (確定の濃い色、予約の淡い色、上限を超えた分の赤) の小さな棒で描き、棒の長さを上限に対する値の割合に揃える。上限を書かない目盛りの札の行は棒を描かない | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-row-bars` passes | #3896 |
| 予約を持つ段の行は、棒の下に色の四角と「確定 40」「予約 30」(英語の図は`confirmed 40`と`held 30`) を添え、上限を超えた段の行は値の字を図の値と同じ赤で描く | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-hold-and-over` passes | #3896 |
| 印刷の形では、全ての目盛りの札を開き、画面で今の段まで絞った札も含めて全ての段の行を並べる | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-print-shows-all-rows` passes | #3896 |
| `[note: pop]`を書かない図の目盛りと、値を1度も書かない目盛りは、印も札も持たない | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-only-with-pop-and-values` passes | #3896 |
| 使い方の頁の目盛りの段落、手引き (日本語と英語) の目盛りの節、dragonのスキルの`cheatsheet`が、`[note: pop]`の図で目盛りを押すと内訳の札が開くことを書き、スキルの`cheatsheet`の版を1.2.0に上げる | `pnpm exec vitest run packages/dragon/test/gauge-card.test.ts --reporter=verbose` check `gauge-card-docs` passes | #3896 |
| 箱の説明の札は、今と同じく押した箱のすぐ下に開く | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts` check `note-pop-opens-card-under-box` passes | #3896 |
| 最初に読むscriptのgzip後の合計が、上限の90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts` check `script-entry-within-budget` passes | #3896 |
| 図の種類の置き場 (`kinds/<種類>/`) は`kind.ts`と`layout.ts`だけを持つ | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `kind-folder-holds-layout-and-attach-types` passes | #4050 |
| 目盛りの内訳の札の型`GaugeNote`と`GaugeNoteRow`がpackageの入口から出る | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `entry-types-all-exported` passes | #4050 |
| 列の図と配管の図の語は、移した後も最初に読む塊に入らない | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `first-load-carries-no-lineup-or-pipe-words` passes | #4050 |
| 最初に読むscriptの量は上限の中に収まる | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `script-entry-within-budget` passes | #4050 |
| 見本帳の頁が最初に読む量は上限の中に収まる | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `page-bundle-within-budget` passes | #4050 |
| 日本語の図の字は、名前の前後に空白を入れない | `pnpm exec vitest run packages/dragon/test/blocks.test.ts packages/dragon/test/package-entries.test.ts packages/dragon/test/figure-text-ja.test.ts packages/dragon/test/script-entry.test.ts apps/playground-spa/src/lib/playground.test.ts apps/playground-spa/src/lib/first-load-split.test.ts --reporter=verbose` check `figure-text-ja-has-no-space-around-names` passes | #4050 |
