# @cardenelabs/dragon

動く図を、人は行ごとの記法で、AI は JSON で書くための package。

## 作り直しの最中

dragon は図の書き方と描き方を根本から作り直している。
進み具合と決めたことは [#2982](https://github.com/cardene777/dragon/issues/2982) にまとめている。

今までの記法 (日本語の鍵の YAML と JSON) と、`@cardenelabs/cdl` へ渡して描く仕組みは [#2983](https://github.com/cardene777/dragon/issues/2983) で消した。
今の版は何も公開しない。
`textDslToDiagram` と `jsonToDiagram` を含む前の入口は、この版から使えない。

作り直した後は、次の 3 つをこの package が持つ。

| 持つ物 | 形 |
|---|---|
| 原本 | 共通の骨格と図の種類ごとの欄を持つ JSON。版を持ち、古い版は読む時に変換する |
| 記法 | 1 行が 1 つの文になる行ごとの記法。JSON と行き来でき、日本語の語でも英語の語でも書ける (`examples/quick-start.md` と `examples/quick-start.en.md`) |
| 描く部品 | 原本から動く図を描く部品。cdl には頼らない |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 |

## 書き出し

書き出しは画面なしの Chromium で、頁と同じ描画を時刻を止めて 1 コマずつ撮る。
撮ったコマは同じ Chromium の中で mp4 と GIF に詰めるので、ffmpeg は要らない。
Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。

```sh
pnpm add -D playwright-core
pnpm exec playwright-core install chromium
```

原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。

```sh
dragon export ccip.json --out out
```

| 設定 | 意味 |
|---|---|
| `--out <dir>` | 書き出す先。無ければ作る (既定は今の dir) |
| `--width <px>` | 枠の幅。見せ方 (全体を止める / 寄って追う) を選び、寄って追う窓の幅になる |
| `--palette <名前>` | 色味 (`clear` / `paper` / `night`、既定は `paper`) |
| `--theme <明暗>` | `light` か `dark` |
| `--fps <数>` | mp4 の 1 秒のコマの数 (既定 30) |
| `--gif-fps <数>` | GIF の 1 秒のコマの数 (既定 10) |
| `--format <形>` | 書き出す形を `,` で区切る (既定 `mp4,gif,html,png`) |

PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
HTML は図で描く字だけに削った字の file を埋めた 1 file で、外へ何も取りに行かない。
node から呼ぶ時は `@cardenelabs/dragon/export` の `exportDiagram` を使う。

## license

MIT
