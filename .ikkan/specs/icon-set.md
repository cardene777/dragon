# icon-set

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 箱の行の`icon:`に`tabler:building-bridge-2`を書いた記法を既定の入口の`parseNotation`と`renderDiagram`で描くと、箱の絵柄の枠に Tabler の石の橋を 20 四方へ縮めた path が描かれる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-icon-draws-in-box`が通る | #3493 |
| 区画の行の`icon:`に`tabler:`の絵柄を書くと、区画の印に同じ path が描かれる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-icon-draws-in-group`が通る | #3493 |
| Tabler の絵柄の path は、手描きの絵柄と同じ class と同じ縮みの割合で描かれ、線の太さが手描きの絵柄と同じになる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-icon-matches-house-stroke`が通る | #3493 |
| Tabler の線の絵柄が描く path で使う命令の 1 つ 1 つについて、その命令を持つ絵柄を 20 四方へ縮めて 1 本にした path の外形の枠が、元の path の外形の枠を 20 四方へ縮めた枠と 0.1 以内で一致する。命令の一覧は手で書かず、絵柄集の file から数える | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-paths-convert-to-20-grid`が通る | #3493 |
| Tabler に無い名前`tabler:no-such-icon`を書いた記法を`parseNotation`で読むと、`icon`の属性の行と列を指し、Tabler に無いことを名指す誤りで止まる。近い名前が在ればそれを挙げる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-unknown-name-refused`が通る | #3493 |
| 原本の JSON の箱と区画の`icon`に`tabler:`の名前を書いた図は原本の形の検査`validateDiagram`を通り、Tabler に無い名前は`/boxes/0/icon`の欄を名指して断られる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-icon-passes-validator`が通る | #3493 |
| 軽い入口で`tabler:`を書いた記法を`loadFor`で待つと絵柄集の塊を読み、描いた SVG が既定の入口の SVG と同じになる | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`light-loads-tabler-for-tabler-diagram`が通る | #3493 |
| 軽い入口で`tabler:`を書かない記法を`loadFor`で待っても、絵柄集の塊を読まない | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`light-skips-tabler-for-plain-diagram`が通る | #3493 |
| 軽い入口で`loadFor`を待たずに`tabler:`を書いた図を描くと、絵柄集を読んでいないことを名指す誤りで止まり、SVG を返さない | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`light-refuses-tabler-before-load`が通る | #3493 |
| `tabler:`の絵柄を使った図を HTML に書き出すと、頁は外の URL を読まずにその絵柄を描き、手描きの絵柄で描いた同じ図の頁より 5KB 以上大きくならない | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`html-export-carries-only-used-tabler-icons`が通る | #3493 |
| Tabler の利用許諾 (MIT) の全文が、npm に出す package の file に入る | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`tabler-license-ships`が通る | #3493 |
| 常に、手描きの絵柄の名前 (`key`、`user`、`doc`) を書いた箱は、手描きの表の path をそのまま描く | `pnpm exec vitest run packages/dragon/test/icon-set.test.ts`の検査`house-icon-draws-house-path`が通る | #3493 |
| 常に、足した印のブロック (`icon: +key`) を書いた箱は、今どおりその path を描く | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-icon-block-draws-on-box`が通る | #3493 |
| 常に、script の 1 行の入口 (CDN) が時系列図 1 つの頁でその図を描くまでに読む script の合計が、gzip で 90,000 byte 以下に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3493 |
| 常に、見本帳が最初に読む script と CSS の合計が、今の上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3493 |
