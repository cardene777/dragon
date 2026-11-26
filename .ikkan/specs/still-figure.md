# still-figure

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `renderDiagram`に`figure: true`を渡して描いた図は、段の番号の丸を出さない | `pnpm exec vitest run`の検査`still-figure-hides-step-badges`が通る | #3801 |
| `figure: true`で描いた図は、最後の段の止め絵の時刻で止まり、再生の部品が無くても最後の段の形を描く | `pnpm exec vitest run`の検査`still-figure-freezes-at-last-step`が通る | #3801 |
| `figure: true`で描いた横棒の量の図は、段の名前の所に図の題を描く | `pnpm exec vitest run`の検査`still-figure-bar-chart-shows-title`が通る | #3801 |
| `figure: true`で描いたドーナツの量の図は、輪の真ん中に図の題を描く | `pnpm exec vitest run`の検査`still-figure-donut-shows-title`が通る | #3801 #3809 |
| `figure: true`で描いた図の字の並びは、dragonの字の後に一般のsans-serifを持ち、dragonの字を読まない頁でも明朝に落ちない | `pnpm exec vitest run`の検査`still-figure-font-has-fallback-stack`が通る | #3801 |
| `figure: true`で描いた図は、頁の`data-theme="dark"`の時と、`data-theme="light"`でない頁で暗い`prefers-color-scheme`の時に、暗い色に変わる | `pnpm exec vitest run`の検査`still-figure-follows-page-theme`が通る | #3801 #3809 |
| `figure`を渡さずに描いた図は、今と同じく段の番号の丸を持ち、止め絵の時刻を書き込まない | `pnpm exec vitest run`の検査`still-figure-off-keeps-render`が通る | #3801 #3809 |
| 頁に`data-still`を持つ塊を置くと、塊は再生の部品を持たない止めて置く図のSVGに置き換わる | `pnpm exec vitest run`の検査`page-still-block-places-svg-without-player`が通る | #3801 |
| `data-still`を持つ塊の記法に誤りがある時、図にせず誤りの文を出す | `pnpm exec vitest run`の検査`page-still-block-shows-notation-errors`が通る | #3801 |
| `data-still`を持たない塊は、今と同じく動く図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-block-with-figure`が通る | #3801 |
| `dragon embed`は、止めて置く塊だけの頁で、塊を止めて置く図のSVGに描いて置き換え、束ねたscriptを入れない | `pnpm exec vitest run`の検査`embed-still-only-page-has-no-script`が通る | #3801 |
| `dragon embed`は、止めて置く塊と動く塊が混ざる頁で、止めて置く塊をSVGに描き、動く塊のために束ねたscriptを入れる | `pnpm exec vitest run`の検査`embed-mixed-page-keeps-script`が通る | #3801 |
| `dragon embed`は、`data-still`を持たない頁を今と同じく埋める | `pnpm exec vitest run`の検査`embedded-page-draws-pipe-without-route`が通る | #3801 |
| `README.ja.md`と`README.md`とdragonのスキルの`references/embed.md`が、`data-still`の書き方と、止めて置く図が出さない物を持つ | `pnpm exec vitest run`の検査`still-figure-docs-name-data-still`が通る | #3801 |
| `figure: true`で描いた図の見た目の規則は、明るい頁の規則と暗い頁の規則の両方で、`--bg`を`var(--dragon-figure-background,<その色味の地の色>)`にする | `pnpm exec vitest run`の検査`still-figure-background-follows-page`が通る | #3809 |
| `figure`を渡さずに描いた図は、`--dragon-figure-background`を読まない | `pnpm exec vitest run`の検査`still-figure-off-ignores-page-background`が通る | #3809 |
| ドーナツの真ん中の名前が輪の内側の縁から余白を空けた円に1行で収まらない時、名前を2行に折り返し、どの行の字の四角の角もその円に収まる | `pnpm exec vitest run`の検査`donut-long-title-wraps-inside-ring`が通る | #3809 |
| ドーナツの真ん中の名前がその円に1行で収まる時は、今と同じく1行で描く | `pnpm exec vitest run`の検査`donut-short-title-keeps-one-line`が通る | #3809 |
| `figure: true`で描いた手順の帯 (`cycle`の`[shape: band]`) の山形の上の縁は、`figure`を渡さずに描いた同じ図より番号の丸の空きの分だけ上に在る | `pnpm exec vitest run`の検査`still-figure-band-drops-badge-room`が通る | #3809 |
| `figure: true`で描いた手順の帯は、手順の名前を、その手順の山形の上の縁と下の縁の間で、山形の左右の縁の内側に描く | `pnpm exec vitest run`の検査`still-figure-band-writes-names-inside`が通る | #3809 |
| `dragon embed`で埋めた止めて置く図も、`--dragon-figure-background`を読み、長いドーナツの名前を2行に折り返し、手順の帯の名前を山形の中に描く | `pnpm exec vitest run`の検査`embed-still-figure-follows-page-look`が通る | #3809 |
| `packages/dragon/README.ja.md`と`packages/dragon/README.md`とdragonのスキルの`references/embed.md`が、`--dragon-figure-background`で図の地の色を頁に合わせる書き方を持つ | `pnpm exec vitest run`の検査`still-figure-docs-name-figure-background`が通る | #3809 |
| `figure: true`で描いた流れ図と横棒とドーナツと折れ線は、keyframesも`animation-name`も持たない | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`still-figure-has-no-keyframes`が通る | #3812 |
| 止めて置くドーナツの弧は、値の割合どおりの長さと始まりの位置を`stroke-dasharray`と`stroke-dashoffset`の値として持つ | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`still-figure-donut-arcs-keep-shares`が通る | #3812 |
| 止めて置く横棒は、一番大きい値の棒に対する長さの割合を`scaleX`の値として持つ | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`still-figure-bars-keep-lengths`が通る | #3812 |
| 動きの道具に止める時刻を渡すと、keyframesを足さずにその時刻の性質ごとの値を返し、動いている途中の時刻では前後の点の数を補間する | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`motion-freeze-writes-values-at-time`が通る | #3812 |
| `dragon embed`が止めて置く塊を描いた頁は、keyframesを持たない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`embed-still-block-has-no-keyframes`が通る | #3812 |
| `figure`を渡さずに描いた図は、今と同じkeyframesと`animation-name`で動く | `pnpm exec vitest run packages/dragon/test/still-figure.test.ts`の検査`moving-figure-keeps-keyframes`が通る | #3812 |
| 折れ線の値の字の四角は、どの線の区間とも点の丸とも他の値の字とも重ならず、凡例の行の下から横の軸の名前の上までに収まる | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-values-clear-of-lines`が通る | #3812 |
| 前後の点より高い点の値の字は、点の上に置く | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-peak-value-sits-above`が通る | #3812 |
| 止めて置く折れ線は、最後の段の値だけでなく全ての段の値の字を出す | `pnpm exec vitest run packages/dragon/test/chart-line.test.ts`の検査`chart-line-still-figure-shows-every-value`が通る | #3812 |
| `<pre class="dragon" data-step="3">`で置いた図は、置いた時に流さず、帯の番号で3段目の止め絵で止まり、再生の釦は流す絵柄で待つ | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`page-block-step-pauses-at-step`が通る | #3831 |
| `data-step`に段の数より大きい数を書いた図は、最後の段で止まる | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`page-block-step-past-count-stops-last`が通る | #3831 |
| `data-step`に1以上の整数でない値 (`0`、`-1`、`2.5`、`abc`) を書いた塊は図を描かず、属性の名前と書ける値を示す誤りの文に置き換わる | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`page-block-step-refuses-bad-value`が通る | #3831 |
| `data-header`と`data-step`を一緒に書いた塊は、帯つきの図にも同じ段で止める設定を渡す | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`page-block-step-reaches-framed-figure`が通る | #3831 |
| `data-still`を持つ塊は、今どおり再生の部品を置かず、最後の段の止め絵のSVGに置き換わる | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`page-block-still-keeps-last-step-svg`が通る | #3831 |
| READMEの英語と日本語の版が、`data-step`の書き方と、段を1から数えることを書く | `pnpm exec vitest run packages/dragon/test/page-step.test.ts`の検査`readme-describes-data-step`が通る | #3831 |
| `mountDiagram`に`still: true`だけを渡した図は、流さずに最後の段の止め絵で止まり、全ての段の線の名前を出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-still-alone-stops-on-last-step`が通る | #3831 |
| `still: true`と`pausedAt`を一緒に渡した図は、最後の段でなく`pausedAt`の段で止まる | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-still-with-paused-at-keeps-step`が通る | #3831 |
| `still: true`の図を途中の段へ送ると、その段の線の名前だけを札の濃さで出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-still-middle-step-own-labels`が通る | #3831 |
| `still`も`pausedAt`も渡さない図は、今どおり置いた時から流して繰り返す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-default-loops`が通る | #3831 |
| 時系列図は、段を送った後も過ぎた段の線の名前を最後の段まで薄い灰の字で残し、その段の間は今どおり札で出す | `pnpm exec vitest run packages/dragon/test/render-still.test.ts`の検査`sequence-keeps-past-line-names-faint`が通る | #3831 |
| 構成図も、過ぎた段の線の名前を最後の段まで薄い灰の字で残す | `pnpm exec vitest run packages/dragon/test/render-still.test.ts`の検査`architecture-keeps-past-line-names-faint`が通る | #3831 |
| 薄く残す線の名前は、字の下に図の地の色 (`--bg`) の四角を敷き、後ろの線が字を通らない | `pnpm exec vitest run packages/dragon/test/render-still.test.ts`の検査`past-line-names-sit-on-figure-ground`が通る | #3831 |
| 止め絵を選んだ図の最後の段は、今どおり全ての線の名前を札の濃さで出し、薄い灰の字を残さない | `pnpm exec vitest run packages/dragon/test/render-still.test.ts`の検査`render-still-shows-all-labels`が通る | #3831 |
| 状態遷移図は、今どおり過ぎた段の線の名前を最後の段まで薄く残す | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-keeps-past-line-names-faint`が通る | #3831 |
| 見本の崩れは、記録した一覧に無い物が増えない | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3831 |
