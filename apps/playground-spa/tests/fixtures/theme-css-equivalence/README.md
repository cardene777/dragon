# 意匠 CSS 等価比較

Vite の開発 server は CSS ごとに `style[data-vite-dev-id]` を作るため、この道具は開発 server だけを相手にする。
build 済み preview は CSS が 1 file にまとまるので使えない。

## 回し方

開発 server を立て、URL を `DEV_SPA_URL` へ渡す。

```sh
DEV_SPA_URL=http://localhost:4323/ node apps/playground-spa/scripts/theme-css-equivalence.mjs 選ぶ --workers 4
DEV_SPA_URL=http://localhost:4323/ node apps/playground-spa/scripts/theme-css-equivalence.mjs 比べる --workers 4 --out .context/theme-css-equivalence/result.json
```

`選ぶ` は `/catalog` に出る全分類頁の全図を、色味 7 通り、全段で走査する。
1 図につき頁を 1 回だけ開き、色味は同じ頁の中で切り替える。
既定では同じ browser の 4 頁で図を分けて走査し、`--workers N` で頁数を変えられる。
時間が掛かるため、図を終えるたびに命中規則数と実時間を標準出力へ出す。
調査中だけ頁を絞る場合は `--page charts` を付け、正式な `figures.json` は絞らずに作る。

`選ぶ` は図ごとの結果を `.context/theme-css-equivalence/select-cache.json` へ逐次保存する。
中断後に同じ旧 CSS で回せば完了済みの図を飛ばす。`--cache <file>` で置き場を変えられる。
「描けない図」の結果は完了扱いにせず、次の実行で回し直す。
cache の鍵は旧 CSS の hash と道具の版から作る。どちらかが違う cache は自動で空にして作り直す。

旧 CSS の既定は `origin/main`、新 CSS の既定は作業場所の2 fileである。
基準は `--base <git-ref>` または `THEME_CSS_BASE=<git-ref>` で変えられる。

## 出力

`figures.json` は必須の宅配見本を含み、未命中規則を最も多く増やす図を貪欲法で足した一覧である。
各図の `newlyCoveredRules` は、その図を足して初めて命中した規則数を表す。
`unmatched-rules.json` は全図を走査しても命中しなかった規則を、選択子・開始行・理由つきで持つ。
`.cdl-phase-seg` が 0 個で段が 0 のままの図は、段の札を表示しない1段の図として扱う。
最初の色味で時計の上限までに段が 0 以外へ進んだ場合は、段を持つのに札が無い図として `undrawableFigures` に頁・item id・理由つきで残す。
表示中の stage が在っても `svg[data-cdl-stage]` が無い行は CDL の図ではないため、`figuresWithoutCdlSvg` に頁・item id・stage 内容の要約つきで分けて残す。
CDL の SVG や `data-cdl-phase-index` を読めない行は `undrawableFigures` に残し、他の図は続ける。
選ばれた図が同じ状態になった場合、`比べる` はその場で失敗する。

各段は要約が3回続けて同じなら `settled`、段へ入ってから1200msまで変わり続けたらその時刻を `timed` として取る。
`比べる` の JSON は方式別件数の `captureModes`、`stateCount`、`differences`、`variableDifferences`、`incomparableStates`、`coverage`、`pixels` を持つ。
`differences` は絵に効く計算後の property と要素の在る・無い差、`variableDifferences` は `--` で始まる CSS 変数の差を持つ。
どちらの差にも図・色味・段・`data-cdl-*` 属性・DOM 経路・property・旧値・新値が入る。
作り直しの合否は `differences` で判定し、`variableDifferences` は変数名の付け替えを確認するために使う。
値と規則の対象は表示中の stage 配下、共有 `SvgDefs` 配下であり、CSS 変数は `html` と図の SVG でも比べる。
`coverage.ignoredTypes` の `keyframes` と `font-face` は規則数へ含めない。
擬似要素と動きの擬似クラスを外した記録は `coverage.selectorAdjustments` に入る。

`figures.json` は CSS 規則、見本帳の図、または図の DOM が増減した時に `選ぶ` で作り直す。
この file が空の間は、Playwright の「同一CSS」が作り方を示して失敗する。

## 静的見本との対応

推測だった行は、静的見本の題と現行の `presets.cdl.ts` / `charts.cdl.ts` の `title`・図形種を突き合わせた。

| 種 | 見本帳 | 根拠 |
|---|---|---|
| 路線 | `presets/delivery-metro-demo` | 題「荷物を届ける路線」 |
| 図表 | `charts/荷物の状態`、`営業所ごとの取扱数`、`月ごとの配達数` | pie・bar・line の3定義 |
| 段箱 | `presets/delivery-stages-demo` | 題「荷物を届ける段階」 |
| 時間軸 | `presets/delivery-timeline-demo` | 題「荷物を届ける順番」 |
| 流れ | `presets/delivery-flow-demo` | `type: flowchart` |
| 関係 | `presets/delivery-relations-demo` | 題「契約と荷物と配送状態の関係」 |
| 型 | `presets/delivery-classes-demo` | 題「荷物を運ぶ型」 |
| 構成 | `presets/delivery-components-demo` | 題「配送システムの部品」 |
| 順序 | `presets/delivery-sequence-demo` | 題「集荷から配達までの呼び出し順」 |
| 階層 | `charts/営業所の階層`、`再配達を減らす` | tree・mind の2定義 |
| 工程 | `charts/仕分け棚を入れ替える工程`、`荷主の気持ち` | gantt・journey の2定義 |
| 数 | `charts/申し込みから届くまで`、`打ち手の手間と効き目`、`営業所ごとの定時率`、`定時に届いた割合`、`配達の結果` | funnel・quadrant・slope・gauge・stacked の5定義 |
