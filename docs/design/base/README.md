# 見本帳の土台

作り直し (#2982) で、図の見た目を決めるために組んだ見本帳。
6 枚の図 (CCIP、OAuth、注文の状態、Web の構成、Git の枝、確定の進み) を、共通の部品と色味 3 案で、明るい背景と暗い背景の両方に描く。
製品の描画は `packages/dragon` に作る (#2985)。
ここは、その描画が同じ見た目になっているかを見比べる見本として置く。

## 開き方

```bash
python3 docs/design/base/build.py
```

隣に `gallery.html` ができるので、ブラウザで開く。
図の id を渡すと (`build.py oauth`)、その図だけを載せた `preview-oauth.html` を作る。
頁の URL に `?scene=<図の id>&theme=<lt か dk>&palette=<色味の id>` を付けると、図と明暗と色味を選んで開ける。

## 中身

| file | 持つ物 |
|---|---|
| `GRAMMAR.md` | 部品の決まり (色の役、部品の使い方、運ぶ物の続き方、字、置き方) |
| `engine.js` と `engine.css` | 部品 (区画、箱、線、運ぶ物、段の番号、中身の帯) と、段に合わせて動かす仕組み |
| `palettes.json` | 色味 3 案の明暗それぞれの値。id は `paper` (紙と墨、既定)、`clear` (澄んだ色)、`night` (夜の計器) |
| `scenes/*.js` | 6 枚の図。段ごとの題と本文もここが持つ |
| `build.py` | 上の file を 1 枚の HTML に組む |
| `probe.mjs` | 0.25 秒ごとに止めて、運ぶ物が 1 つも見えない時間の割合と、同時に見える線の名前と番号の数を図ごとに測る |
| `check-palettes.mjs` | 色味 3 案の 5 色を、明暗それぞれの地に対して見分けの検査にかける |
| `search-palette.mjs` | 色味の 5 色を、全ての組が見分けられる範囲から探す |
| `tritan-shift.mjs` | 色味の 5 色を少しずつ動かし、3 型 (青と黄が見分けにくい色覚) を模した見え方でも全ての組が見分けられる値を探す |
| `finalize-palettes.mjs` | 線と塗りの色から、字に使う濃さを決める |
| `calm-dark.mjs` | 暗い側の色の鮮やかさと、区画に敷く色の量を抑える |
| `carry-light.mjs` | 明るい側の運ぶ物 (封筒と札) を塗る灰を決める |

## 色の script の動かし方

色の値を求める script は、色の見分けと濃さの比を測る道具 `validate_palette.js` (Claude Code の dataviz skill が同梱する) を使う。
道具は repo の外にあるので、置き場を環境変数 `DATAVIZ_VALIDATOR` に入れて動かす。
読み込みは `validator.mjs` が 1 か所で持つ。

```bash
DATAVIZ_VALIDATOR=<validate_palette.js の path> node docs/design/base/check-palettes.mjs
```

`probe.mjs` は `gallery.html` を開いて測るので、先に `build.py` を動かす。
