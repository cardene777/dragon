# html-form

| Criterion | How to check | Origin |
|---|---|---|
| 記法の図を`dragon convert`でHTMLの形へ変換でき、図は`<dg-<種類>>`で包まれ、記法の各行が`<dg-<語>>`の要素になる。同じ変換をAPIの関数でもできる | `pnpm exec vitest run packages/dragon/test/html-form.test.ts` check `html-form-from-notation` passes | #3908 |
| 見本帳の全ての見本の記法を、HTMLの形へ変換して記法へ戻すと、原本のJSONが元と同じになる | `pnpm exec vitest run packages/dragon/test/html-form.test.ts` check `html-form-round-trips-every-example` passes | #3908 |
| 原本のJSONの欄に無い名前の要素と属性を持つHTMLの形は、その行と要素の名前を名指して変換を断る | `pnpm exec vitest run packages/dragon/test/html-form.test.ts` check `html-form-refuses-unknown-element` passes | #3908 |
| Markdownの頁 (説明の頁を含む) とHTMLの頁 (`<dragon-page>`) を相互に変換でき、頭の行、見出し、引用、`<details>`、用語のリンク、図が対応する要素へ移る | `pnpm exec vitest run packages/dragon/test/html-form.test.ts` check `html-page-converts-with-markdown` passes | #3908 |
| 頁に1行のscriptを置くと、HTMLの形の図がその場で描かれ、記法で書いた図と同じく再生の帯を持って段ごとに動く | `pnpm exec vitest run packages/dragon/test/html-form-browser.test.ts` check `html-form-draws-in-page` passes | #3908 |
| `dragon check`と`dragon check --layout`はHTMLのfileを読み、誤りをHTMLの行と要素の名前で知らせる | `pnpm exec vitest run packages/dragon/test/html-form.test.ts` check `html-form-check-names-line` passes | #3908 |
| dragonのskillの参照は、図と頁をHTMLの形で書く書き方を持つ | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts` check `skill-describes-html-form` passes | #3908 |
| 頁の`<pre class="dragon">`の塊は、今と同じく図に置き換わる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts` check `script-entry-replaces-block-with-figure` passes | #3908 |
| `entry`、`sidebar`、`tabs`の組み立ての見本のmdは、今と同じく書き出せる | `pnpm exec vitest run packages/dragon/test/page-export.test.ts` check `page-examples-export` passes | #3908 |
