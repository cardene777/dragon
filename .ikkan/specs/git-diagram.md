# git-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `git` の原本の JSON を JSON Schema で検査した時、枝の並びを種類の欄 `git` に持ち、段の中に commit を積む出来事と枝を切る出来事と札を動かす線を持つ図は通る。箱を 1 つも持たない枝分かれの図も通る | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`schema-accepts-git-diagram`が通る | #3164 |
| `git` の欄か commit を積む出来事か枝を切る出来事を枝分かれの図でない図に書いた時、枝分かれの図に `state` か `sequence` の欄を書いた時、commit の hash に 0 から 9 と a から f でない字を書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`schema-rejects-misplaced-git-fields`が通る | #3164 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3164 |
| `packages/dragon/examples/rebase.dragon` と `merge.dragon` を `parseNotation` が読んだ時、同じ名前の JSON と同じ JSON を返す。英語版の `.en.dragon` と `.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`notation-compiles-git-examples-to-json`が通る | #3164 |
| 枝分かれの図の記法に、宣言していない枝への commit、既にある名札と同じ名札の commit、無い commit を指す `from` か `copy` か札の動き、commit の無い枝の `merge`、最初の `step` より前の commit のどれかがある時、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`notation-rejects-misused-git-lines`が通る | #3164 |
| 時系列図、構成図、状態遷移図の記法で `branch` か `commit` の行を書いた時、その行は枝分かれの図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`notation-limits-git-lines-to-git`が通る | #3164 |
| 時系列図、構成図、状態遷移図の記法では、`main` や `HEAD` を名札にした箱どうしの線を今どおり読む | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`notation-keeps-ref-names-plain-outside-git`が通る | #3164 |
| rebase の図と merge の図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-roundtrip-keeps-json-identical`が通る | #3164 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3164 |
| 原本の JSON から並べた時、commit を積んだ枝の札と、その枝を指している HEAD がその commit へ進み (HEAD は最初に積んだ枝を指し、枝を切るとその枝へ移る)、当て直しで積んだ commit は枝の札を動かさず、merge commit は取り込む先の先端と取り込む枝の先端の 2 つを親に持ち、札の動きの線は commit を作らず札だけを動かす | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-derives-parents-and-refs`が通る | #3164 |
| 枝を宣言した順に上から帯に並べ、どの commit も親より右に置く。rebase の図では main の線に A、B、E、C'、D' が、feature の線に C と D が左から順に並び、merge の図では 3 本の枝が 3 つの帯に並ぶ | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-layout-places-lanes-and-commits`が通る | #3164 |
| commit の hash と一言を、一番上の帯の枝では丸の上に、ほかの枝では丸の下に 2 行で出し、どちらも書かない commit には字を出さない。枝の札は字より外に置く | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-renders-hash-and-note`が通る | #3164 |
| rebase の図を原本の JSON から描いた時、試作 (`docs/design/base/scenes/git.js`) と同じ題の 11 段が順に動き、どの枝の札からも辿れなくなった commit (feature が D' へ移る段の C と D) がその段で点線の丸に変わる | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`rebase-renders-11-steps`が通る | #3164 |
| HEAD の札は `HEAD -> <commit>` で枝から離れた段から出て、離れている間に積んだ commit へ進み、枝の札がその commit へ着いた段で消える | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-shows-head-tag-while-detached`が通る | #3164 |
| merge の図を描いた時、merge commit の丸へ 2 つの親から線が入り、取り込む先の札だけが merge commit へ進む | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`merge-renders-merge-commit`が通る | #3164 |
| rebase と merge の図を 0.25 秒ごとに止めて数えた時、線の名前が同時に見える数は 2 個以下で、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-keeps-motion-rules`が通る | #3164 |
| 見せ方を書かない枝分かれの図を開いた時、全体を止めて中だけを動かす見せ方 (`fixed`) になる | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-opens-fixed`が通る | #3164 |
| 時系列図、構成図、状態遷移図の描き方は今どおりで、OAuth は 12 段、CCIP は 13 段、注文は 10 段が順に動き、箱どうしと線の名前と箱が 10px 以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`order-renders-10-steps`と`layout-keeps-10px-gap`が通る | #3164 |
| 枝分かれの図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3164 |
| `dragon export` は図の種類に関わらず同じ処理で mp4、GIF、HTML、PNG の 4 つを書き出し、同じ JSON を 2 回書き出した PNG がバイト単位で一致する。rebaseの図は書き出した HTML で全ての段を送れる | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-writes-four-formats`と`export-is-deterministic`と`html-export-draws-every-kind`が通る | #3164 |
| `packages/dragon/examples` に rebase と merge の日本語と英語の記法と JSON の 8 つの file があり、英語版の枝と commit と段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/git-diagram.test.ts`の検査`git-example-files-match`が通る | #3164 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3164 |
| 見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならず、運ぶ物が箱と字に掛からない | `pnpm test`の検査`overlaps-none-in-every-example`と`carriers-clear-in-every-example`が通る | #3164 |
| 見本帳の一覧に図の分類が 4 つ (時系列図、構成図、状態遷移図、枝分かれの図) 並び、枝分かれの図の頁に rebase と merge の見本が載り、rebase を選ぶと 11 段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/git-catalog.test.ts`の検査`catalog-lists-git-with-examples`が通る | #3164 |
| 見本帳の図の種類だけの部品に枝、commit、当て直し、merge commit の 4 つが枝分かれの図の部品として並び、頁ごとに日本語と英語の記法と、枝分かれの図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/git-catalog.test.ts`の検査`catalog-has-four-git-parts`が通る | #3164 |
| どの図でも使う 10 個の部品の頁に、枝分かれの図で描いた図が並び、段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-parts.test.ts`の検査`catalog-common-parts-listed`と`catalog-common-part-shows-both-kinds`が通る | #3164 |
| 当て直しの頁は rebase の見本の札を、merge commit の頁は merge の見本の札を並べ、札は枝分かれの図の頁のその見本へ向かう | `pnpm exec vitest run apps/playground-spa/src/lib/git-catalog.test.ts`の検査`git-part-pages-link-examples`が通る | #3164 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3164 |
| 編集画面の棚の見本に枝分かれの図の束があって rebase と merge が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に `git` の頭の行があり、`branch`、`commit`、`copy`、`merge` と札の動きの行がある | `pnpm exec vitest run apps/playground-spa/src/lib/git-catalog.test.ts`の検査`editor-shelf-has-git`が通る | #3164 |
| 概要の頁の使いどころは今の 3 つのまま | `pnpm test`の検査`home-uses-stay-three`が通る | #3164 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3164 |
| 見本`merge`と`merge.en`を描いた時、`dragon check --layout`が`warning`の行を1つも出さない | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`merge-examples-warn-nothing`が通る | #3547 |
| 見本`rebase`と`rebase.en`を描いた時、`dragon check --layout`が`warning`の行を1つも出さない | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`rebase-examples-warn-nothing`が通る | #3547 |
| 見本`merge`の段7を描いた時、コミットBから分かれる`fix`の線と`feature`の線は、出口の間が`APART.line`に線の太さを足した値で、どこでも`APART.line`以上離れる | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`merge-branch-lines-leave-apart`が通る | #3547 |
| 同じコミットから3本の枝を切り、それぞれにcommitを積む図を描いた時、どの2本の線も、`APART.line`より近い所を番号の丸2つ分 (`LOOK.badge.r`の2倍) より長く走らず、`dragon check --layout`が`warning`の行を出さない | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`three-branch-lines-leave-apart`が通る | #3547 |
| 見本の崩れの記録`packages/dragon/test/fixtures/layout-breaks.json`が空になる | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`layout-breaks-record-is-empty`が通る | #3547 |
| 同じコミットから分かれる2本の枝の線が重なる時、`dragon check --layout`がその段と2本の線を名指す`warning`の行を出す | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`layout-check-names-overlapping-branch-lines`が通る | #3547 |
| 構成図で同じ箱の同じ所から出る2本の線が重なって走り、その先で分かれる時、`dragon check --layout`がその段と2本の線を名指す`warning`の行を出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-lines-leaving-one-spot`が通る | #3547 |
| 常に、枝を切る線と、その枝に最初に積んだcommitの線は同じ道を通り、`dragon check --layout`は重なる線に数えない | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`layout-check-skips-redrawn-branch-line`が通る | #3547 |
| 常に、試す図の網で1つのノードから別々の向きへ広がる線を、`dragon check --layout`は重なる線に数えない | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`layout-check-skips-fanning-lines`が通る | #3547 |
| 常に、`dragon check --layout`は近すぎる段の番号と並んで近すぎる線を見つけ、知らせの行とJSONに段の番号と関わる物の名前を書く | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-close-badges`と`layout-check-finds-crowded-lines`と`layout-check-line-names-step-and-parts`と`layout-check-prints-json`が通る | #3547 |
| 常に、見本を描いた時、記録の一覧に無い崩れを出さない | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3547 |
