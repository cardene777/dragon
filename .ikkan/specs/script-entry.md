# script-entry

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 入口の file を読む `<script type="module">` の1行と `<pre class="dragon">` の記法の塊だけを置いた HTML を開くと、塊が動く図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-block-with-figure`が通る | #3343 |
| 同じ頁に記法の塊を2つ置くと、2つとも図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-every-block`が通る | #3343 |
| 記法に誤りがある塊は図に置き換えず、誤りの文を塊の場所に出す | `pnpm exec vitest run`の検査`script-entry-shows-notation-errors`が通る | #3343 |
| 時系列図の塊だけを置いた頁では、入口は後から読む図の種類の塊を読まず、枝分かれの図の塊を置いた頁ではその種類の塊を読む | `pnpm exec vitest run`の検査`script-entry-loads-only-used-kinds`が通る | #3343 |
| 入口の script が最初に読む量 (圧縮後) が検査の上限を持ち、上限を超えると落ちる | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3343 |
| 入口は図の字の CSS を jsDelivr から読む `<link>` を、頁に1度だけ足す | `pnpm exec vitest run`の検査`script-entry-adds-font-link-once`が通る | #3343 |
| 命令 `dragon embed <HTML の file>` が、入口の1行を束ねた script の中身に置き換えた1 file を書き、外への通信を止めて開くと塊が図に置き換わり、字の `<link>` を足さない | `pnpm exec vitest run`の検査`embed-writes-offline-file`が通る | #3343 |
| `packages/dragon/README.md` と `packages/dragon/README.ja.md` に、package の今の版の真ん中の数まで固定した jsDelivr の URL の1行で図を出す書き方と、`dragon embed` で1 file に埋める書き方がある | `pnpm exec vitest run`の検査`readme-shows-script-entry`が通る | #3343 |
| 軽い入口の `loadFor` を待ってから `mountDiagram` で描く今の使い方は、後から読む種類の見本を既定の入口と同じ SVG で描く | `pnpm exec vitest run`の検査`light-load-for-reads-every-later-example`が通る | #3343 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了0 | #3343 |
