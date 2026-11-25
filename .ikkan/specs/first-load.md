# first-load

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 書き出した見本帳が最初に読む script は、英語の画面の字を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-english-text`が通る | #3646 |
| 書き出した見本帳が最初に読む script は、最初の見本3枚 (`intro`、`oauth`、`ccip`) の英語の記法を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-english-examples`が通る | #3646 |
| 書き出した見本帳が最初に読む script は、編集画面の棚の雛形を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`first-load-carries-no-shelf-templates`が通る | #3646 |
| 英語の画面の字を後から読むと、分ける前と同じ英語の字を返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-english-text-matches`が通る | #3646 |
| 最初の見本3枚の英語の記法を後から読むと、`packages/dragon/examples/`の英語の見本と同じ記法を返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-english-examples-match`が通る | #3646 |
| 棚の雛形を後から読むと、分ける前と同じ雛形を同じ順で返す | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`later-shelf-items-match`が通る | #3646 |
| 英語で開いた頁は、英語の字が届くまで画面を描かず、日本語の字を出さない | `pnpm exec vitest run apps/playground-spa/src/lib/first-load-split.test.ts`の検査`english-page-waits-for-english-text`が通る | #3646 |
| 最初に読む script と CSS は gzip で184KB以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3646 |
| 最初に読む script は崩れの検査を持たない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-layout-check`が通る | #3646 |
| 部品のブロックが棚に置く雛形の名前は、どれも棚に載る | `pnpm exec vitest run apps/playground-spa/src/lib/block-gallery.test.ts`の検査`block-shelf-ids-on-shelf`が通る | #3646 |
| 見本帳を組み立てた時、最初に読むscriptとCSSのgzip後の合計が上限の186KB (190464byte) 以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3832 |
| 見本帳を組み立てた時、最初に読むscriptとCSSは更新履歴の頁の目印と見た目の決まりを持たず、それらは後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-release-notes-page`が通る | #3832 |
| 見本帳を組み立てた時、最初に読むscriptとCSSは見つからない頁の目印と見た目の決まりを持たず、それらは後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-not-found-page`が通る | #3832 |
| 使い方の頁とカタログの頁は、今どおり最初に読むscriptに入らず後から読む塊に在る | `pnpm exec vitest run apps/playground-spa/src/lib/page-chunks.test.ts`の検査`first-load-carries-no-docs-page`と`first-load-carries-no-catalog-pages`が通る | #3832 |
| 見本帳の頁の今ある検査が通る。最初に読むscriptは崩れの検査と部品の説明を持たず、頁は配る部品で描け、経路ごとのHTMLの写しが在り、scriptは自分の置き場からしか読まない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-layout-check`と`first-load-carries-no-part-desc`と`page-draws-with-package-parts`と`page-routes-have-html-copies`と`csp-script-self-only`が通る | #3832 |
| 見本帳を組み立てた時、最初に読むscriptとCSSのgzip後の合計が上限の186KB(190464byte)以下に収まる | `pnpm test`の検査`page-bundle-within-budget`が通る | #3868 |
| 見本帳を組み立てた時、最初に読むscriptは部品の使い方の表(`blocks/*/gallery/uses.ts`)を持たない | `pnpm test`の検査`first-load-skips-part-uses`が通る | #3868 |
| 部品の表を読まずに部品のidを確かめる処理が、部品の表の全ての部品のidを部品と答え、表に無いidを部品と答えない | `pnpm test`の検査`part-ids-match-parts-table`が通る | #3868 |
| カタログの部品の頁は、今と同じく種類ごとの部品の図と設定の表を出す | `pnpm test`の検査`part-page-keeps-kind-figures`と`part-settings-rows-per-attr`が通る | #3868 |
| 見本帳の使い方の頁の組み込みの節が、READMEの組み込みの節と同じ5つのコードを出し、5つ目は押した箱のidを`closest('[data-node]')`で読むコードである | `pnpm test`の検査`docs-page-has-embed-section`が通る | #3868 |
| ベン図の描く所(`packages/dragon/src/render/venn.ts`)を変えた時、関係する検査を選ぶ命令は121以下の検査のfileを返す | `pnpm test`の検査`related-venn-draw-picks-at-most-121`が通る | #3868 #3877 #3881 #3876 #3908 #3934 #3950 |
| 時系列図の並べ方(`packages/dragon/src/kinds/sequence/layout.ts`)を変えた時、関係する検査を選ぶ命令は168以下の検査のfileを返す | `pnpm test`の検査`related-sequence-layout-picks-at-most-168`が通る | #3868 #3877 #3881 #3876 #3908 #3934 #3950 |
| 配管の図の描く所を変えた時に選ぶ検査のfileは、137以下である | `pnpm test`の検査`related-pipe-draw-picks-at-most-137`が通る | #3868 #3876 #3908 #3934 #3950 |
| 描いた箱と囲みが記法のidを`data-node`に持つ件は、`examples.test.ts`へ移した後も同じ名前で通る | `pnpm test`の検査`box-carries-notation-id`と`same-name-boxes-carry-distinct-ids`と`group-carries-notation-id`と`click-reads-innermost-node-id`と`lines-and-labels-carry-no-node-id`と`every-gallery-box-carries-its-id`と`embed-docs-name-node-attribute`が通る | #3868 |
| `dragon embed`で書き出した1枚のHTMLの箱と囲みが記法のidを持つ件は、`script-entry.test.ts`へ移した後も同じ名前で通る | `pnpm test`の検査`embed-html-keeps-node-ids`が通る | #3868 |
| jsDelivrの1行の入口が最初に読むscriptは、今と同じく90,000byte以下に収まる | `pnpm test`の検査`script-entry-within-budget`が通る | #3868 |
| `CHANGELOG.md`と`CHANGELOG.ja.md`の`Unreleased`の節に、最初に読む量を減らした直しと、使い方の頁の組み込みの節に5つ目のコードを足した直しの項がある | `pnpm test`の検査`changelog-lists-first-load-part-uses`が通る | #3868 |
