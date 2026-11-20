# still-figure

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `renderDiagram`に`figure: true`を渡して描いた図は、段の番号の丸を出さない | `pnpm exec vitest run`の検査`still-figure-hides-step-badges`が通る | #3801 |
| `figure: true`で描いた図は、最後の段の止め絵の時刻で止まり、再生の部品が無くても最後の段の形を描く | `pnpm exec vitest run`の検査`still-figure-freezes-at-last-step`が通る | #3801 |
| `figure: true`で描いた横棒の量の図は、段の名前の所に図の題を描く | `pnpm exec vitest run`の検査`still-figure-bar-chart-shows-title`が通る | #3801 |
| `figure: true`で描いたドーナツの量の図は、輪の真ん中に図の題を描く | `pnpm exec vitest run`の検査`still-figure-donut-shows-title`が通る | #3801 |
| `figure: true`で描いた図の字の並びは、dragonの字の後に一般のsans-serifを持ち、dragonの字を読まない頁でも明朝に落ちない | `pnpm exec vitest run`の検査`still-figure-font-has-fallback-stack`が通る | #3801 |
| `figure: true`で描いた図は、頁の`data-theme="dark"`の時と、`data-theme="light"`でない頁で暗い`prefers-color-scheme`の時に、暗い色に変わる | `pnpm exec vitest run`の検査`still-figure-follows-page-theme`が通る | #3801 |
| `figure`を渡さずに描いた図は、今と同じく段の番号の丸を持ち、止め絵の時刻を書き込まない | `pnpm exec vitest run`の検査`still-figure-off-keeps-render`が通る | #3801 |
| 頁に`data-still`を持つ塊を置くと、塊は再生の部品を持たない止めて置く図のSVGに置き換わる | `pnpm exec vitest run`の検査`page-still-block-places-svg-without-player`が通る | #3801 |
| `data-still`を持つ塊の記法に誤りがある時、図にせず誤りの文を出す | `pnpm exec vitest run`の検査`page-still-block-shows-notation-errors`が通る | #3801 |
| `data-still`を持たない塊は、今と同じく動く図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-block-with-figure`が通る | #3801 |
| `dragon embed`は、止めて置く塊だけの頁で、塊を止めて置く図のSVGに描いて置き換え、束ねたscriptを入れない | `pnpm exec vitest run`の検査`embed-still-only-page-has-no-script`が通る | #3801 |
| `dragon embed`は、止めて置く塊と動く塊が混ざる頁で、止めて置く塊をSVGに描き、動く塊のために束ねたscriptを入れる | `pnpm exec vitest run`の検査`embed-mixed-page-keeps-script`が通る | #3801 |
| `dragon embed`は、`data-still`を持たない頁を今と同じく埋める | `pnpm exec vitest run`の検査`embedded-page-draws-pipe-without-route`が通る | #3801 |
| `README.ja.md`と`README.md`とdragonのスキルの`references/embed.md`が、`data-still`の書き方と、止めて置く図が出さない物を持つ | `pnpm exec vitest run`の検査`still-figure-docs-name-data-still`が通る | #3801 |
