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
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了0 | #3343 #3375 |
| 頁が jsDelivr の`@cardenelabs/dragon@<版の真ん中の数まで>/dist/cdn/dragon.js`で入口を読む時、入口の後に読む file を全て`@cardenelabs/dragon@<package の今の版>/`の場所から読み、範囲の場所に入口のほかの file が無くても、時系列図と枝分かれの図の塊が図に置き換わる | `pnpm exec vitest run`の検査`script-entry-pins-own-version-on-cdn`が通る | #3375 |
| 版を含まない場所 (`http://localhost/cdn/`) から入口を読む頁で、記法の塊が図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-block-with-figure`が通る | #3375 |
| 版を含まない場所から読む頁で、書いた図の種類の塊だけを後から読む | `pnpm exec vitest run`の検査`script-entry-loads-only-used-kinds`が通る | #3375 |
| 入口の script が最初に読む量 (圧縮後) が上限 90,000 byte に収まる | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3375 |
| `dragon embed`で書いた1 file を外への通信を止めて開くと、塊が図に置き換わる | `pnpm exec vitest run`の検査`embed-writes-offline-file`が通る | #3375 |
| README の1行は package の今の版の真ん中の数までを指す jsDelivr の URL のまま変わらない | `pnpm exec vitest run`の検査`readme-shows-script-entry`が通る | #3375 |
| 時系列図だけを描く頁で、1行の入口から最初に読むscriptの合計がgzipで上限の90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3657 |
| 回り続ける図、表どうしの関係の図、考えを広げる地図、集合の重なりの図、2つの軸で置く図だけが使うブロック (`ring`、`table`、`idea`、`circle`、`axis`、`matrix-item`) の定義は、build した1行の入口で`box`のブロックの定義と同じfileに入り、そのブロックだけの最初に読むfileを作らない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-kind-blocks-share-one-file`が通る | #3657 |
| 中身の帯を描く処理 (`src/blocks/strip/draw.ts`) と色を読む処理 (`src/blocks/color/read.ts`) は、build した1行の入口で本体 (`dragon-main.js`) に入り、回り続ける図と考えを広げる地図の後から読む塊のためだけの最初に読むfileを作らない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-shared-parts-stay-in-main`が通る | #3657 |
| 時系列図だけを描く頁は後から読む図の種類の塊を読まず、枝分かれの図を描く頁はその種類の塊を読む | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-loads-only-used-kinds`が通る | #3657 #3706 |
| 軽い入口の`loadFor`を待ってから描くと、後から読む種類の見本を既定の入口と同じSVGで描く | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-load-for-reads-every-later-example`が通る | #3657 |
| 見本のSVGは部品を移す前と同じ字の並びで描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3657 |
| 回り続ける図の輪の真ん中に、中身の帯の値を段ごとに出す | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-centre-shows-strip-values`が通る | #3657 |
| 回り続ける図は、手順が2つより少ないか8つより多い図を拒む | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-rejects-too-few-or-too-many-steps`が通る | #3657 |
| 表どうしの関係の図は、表が1つより少ないか6つより多い図を拒む | `pnpm exec vitest run packages/dragon/test/er-diagram.test.ts`の検査`er-rejects-too-few-or-too-many-tables`が通る | #3657 |
| 考えを広げる地図は、真ん中の題から数えて4段目の考えを拒む | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-rejects-ideas-deeper-than-three-levels`が通る | #3657 |
| 考えを広げる地図は、`idea`の行に知らない色を書いた記法を、色の誤りの文で拒む | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-rejects-an-unknown-color`が通る | #3657 |
| 集合の重なりの図は、集まりが2つより少ないか3つより多い図を拒む | `pnpm exec vitest run packages/dragon/test/venn-diagram.test.ts`の検査`venn-rejects-other-than-two-or-three-sets`が通る | #3657 |
| 2つの軸で置く図は、区画が4つでない図を拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-four-areas`が通る | #3657 |
| 2つの軸で置く図は、軸が2つでない図を拒む | `pnpm exec vitest run packages/dragon/test/matrix-diagram.test.ts`の検査`matrix-rejects-other-than-two-axes`が通る | #3657 |
| 後から読む種類を持たない頁で、scriptの1行の入口が最初に読むscriptのgzipした後の合計が、上限90,000バイト以下になる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3656 |
| 種類の登録簿に並べ方と札の時刻の直しと描き方を登録した種類は、描き分けの本体 (`render/draw.ts`) に分かれ道を足さずに描ける | `pnpm exec vitest run packages/dragon/test/kind-dispatch.test.ts`の検査`registered-kind-draws-without-a-branch`が通る | #3656 |
| 描き分けの本体は、後から読む種類の並べ方と札の時刻の直しと描き方を、種類の名前を並べた分かれ道で選べない | `pnpm exec vitest run packages/dragon/test/kind-dispatch.test.ts`の検査`draw-names-no-later-kind`が通る | #3656 |
| 回り続ける図と表どうしの関係の図は、札が線を引き始める時に出てその段の終わりに消える時刻の直しを、1つの処理から使う | `pnpm exec vitest run packages/dragon/test/kind-dispatch.test.ts`の検査`cycle-and-er-share-one-carrier-timing`が通る | #3656 |
| 今ある見本の描いた結果の指紋は1行も変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3656 |
| scriptの1行の入口は、頁に書いた図の種類だけを後から読む | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-loads-only-used-kinds`が通る | #3656 |
| 軽い入口の`loadFor`は、後から読む全ての見本の種類を読んでから描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-load-for-reads-every-later-example`が通る | #3656 |
| 見本帳が最初に読むscriptとCSSはgzipで184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3656 |
| buildした1行の入口で、ブロックの定義 (`packages/dragon/src/blocks/<名前>/block.ts`) を持つ最初に読むfileは1つだけになり、定義ごとの小さなfileを作らない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-block-definitions-share-one-file`が通る | #3706 |
| 時系列図だけの頁で、1行の入口が最初に読むscriptのgzip後の合計は上限90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3706 |
| 種類だけが使うブロックの定義は、buildした1行の入口で`box`のブロックの定義と同じfileに入る | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-kind-blocks-share-one-file`が通る | #3706 |
| 後から読む個別ブロックの読み方で読んだ記法の見本は、既定の入口と同じSVGになり、ほかの種類の個別ブロックを読まない | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-load-for-reads-every-later-example`が通る | #3706 |
