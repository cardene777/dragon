# cards-diagram

| Criterion | How to check | Origin |
|---|---|---|
| `cards`で始まる原本のJSONを形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`schema-accepts-cards-diagram`が通る | #3846 |
| `cards`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-roundtrip-keeps-notation`が通る | #3846 |
| 持ち主ごとのカードの図を描くと、箱を書いた順に左から縦の列に並べ、`item <id> as <名前> in <列>, <列>`のカードを書いた全ての列に書いた順で上から積み、カードの無い列は空のまま残す | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-stack-in-every-listed-column`が通る | #3846 |
| 段の中に書いた`item`のカードはその段でできた物として出て、段の中の`delete <id>`のカードは消し線で残る | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-step-creates-and-deletes`が通る | #3846 |
| 段の中で在るカードの`item <id> in <列>`を書き直すと、カードがその段で書いた列へ動く | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-step-moves-a-card`が通る | #3846 |
| 段の中の`<列> -> <カード>: <名前>`は、列の見出しからカードへの呼び出しの線を引く | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-call-runs-from-column-head-to-card`が通る | #3846 |
| 段の中の`refuse <id>: <理由>`は、カードを1枚も変えず、idがカードならそのカードの下に、列ならその列のカードの下に、断られた札と理由を出す | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-refuse-changes-nothing`が通る | #3846 |
| 列ごとの合計は、その列の消えていないカードの量を単位ごとに足して列の下に出し、段で変わった合計は前の量を消し線で添える | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-total-sums-live-cards-by-unit`が通る | #3846 |
| 列ごとの合計は`[total: none]`のカードの量を足さず、そのカードの量はカードに出す | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-total-skips-total-none-cards`が通る | #3846 |
| カードの`[mark: <列>]`は、その列に載るそのカードにだけ、列の`[mark: <印の語>]`の札を出し、`mark:`を繰り返すと書いた全ての列に出す | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-mark-shows-only-on-named-columns`が通る | #3846 |
| 描いた図は、図の根、列、列の見出し、カード、カードの名と量、印、理由の札、合計、段の番号と送りのボタンに、Tracelythと約束した`data-dragon`の印を持つ | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-dom-carries-the-promised-marks`が通る | #3846 |
| 知らない列にカードを置く行と、知らないカードを消す、動かす、断る、呼ぶ行を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-rejects-unknown-names`が通る | #3846 |
| 印の語を持たない列をカードの`mark`に選ぶと、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`cards-rejects-a-mark-without-a-word`が通る | #3846 |
| ほかの種類の図では、`cards`と`refuse`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/cards-diagram.test.ts`の検査`notation-keeps-cards-words-plain-outside-cards`が通る | #3846 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、持ち主ごとのカードの図を読んで描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-each-later-kind-after-load-for`が通る | #3846 |
| 使い方の頁と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、持ち主ごとのカードの図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`cards-docs-describe-the-notation`が通る | #3846 |
| 見本帳に日本語と英語の見本で持ち主ごとのカードの図が載り、編集画面の棚から書き始められる | `pnpm exec vitest run apps/playground-spa/src/lib/cards-examples.test.ts`の検査`cards-examples-in-catalog-and-shelf`が通る | #3846 |
| 手引き2つは、図の種類ごとの節を持ち、各節はその種類の頭の語の書き方を持つ | `pnpm exec vitest run packages/dragon/test/readme-public.test.ts`の検査`guide-has-a-section-per-kind`が通る | #3846 |
| 描き方のfileは色と字の大きさを直に書かず、値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3846 |
| 描く本体は後から読む種類の名前の字を持たない | `pnpm exec vitest run packages/dragon/test/kind-dispatch.test.ts`の検査`draw-names-no-later-kind`が通る | #3846 |
| 見本のfileの最初の注釈の行は作業の番号を持たない | `pnpm exec vitest run packages/dragon/test/examples.test.ts`の検査`example-descriptions-carry-no-issue-number`が通る | #3846 |
| 頁が最初に読むscriptとCSSは上限の大きさに収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3846 |
| 持ち主ごとのカードの図の全ての見本で、寄って追う形の全体図に部品が在る | `pnpm exec vitest run packages/dragon/test/overview-all-kinds.test.ts --reporter=verbose`の検査`overview-parts-cards`が通る | #3912 |
