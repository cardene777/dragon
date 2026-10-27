# @cardenelabs/dragon

動く図を、人は dragon記法で、AI は JSON で書くための package。

## 入れ方

```sh
npm install @cardenelabs/dragon
```

0.35.0 は根本から作り直した版で、0.34.0 までの記法と入口は使えない。
今までの記法 (日本語の鍵の YAML と JSON)、`textDslToDiagram` と `jsonToDiagram` を含む入口、`@cardenelabs/cdl` へ渡して描く仕組みは [#2983](https://github.com/cardene777/dragon/issues/2983) で消した。
作り直しで決めたことは [#2982](https://github.com/cardene777/dragon/issues/2982) にまとめている。

この package は次の 4 つを持つ。

| 持つ物 | 形 |
|---|---|
| 原本 | 共通の骨格と図の種類ごとの欄を持つ JSON。版を持ち、古い版は読む時に変換する |
| 記法 | 行の頭の英語の語で行の種類が決まる dragon記法 (下の節)。JSON と行き来でき、名前と文は日本語でも書ける ([書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md)、[英語の書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md)) |
| 描く部品 | 原本から時系列図と構成図を描き、段ごとに動かす部品。cdl には頼らない |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 |

## dragon記法

どの行も次の決まり 4 つに従う。

1. 行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる
2. 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる
3. 空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む
4. 入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする

行の頭の語は `sequence` `architecture` `group` `end` `box` `strip` `step` `say` `code` `act` `note` `set` で、線の行は `名札 -> 名札` と書く。

```dragon
architecture 注文を倉庫へ回す

group 店側 as 店 [note: 注文を受ける側, color: blue, icon: cart]
  box 受付 [note: 注文を受ける, icon: app]
end

group 倉庫側 as 倉庫 [note: 品物を送る側, color: green, icon: box]
  box 出荷 [note: 品物を送る, icon: truck]
end

step 出荷に回す
  say
    受付が注文の番号を 2 つまとめて出荷に回す。
    出荷は届いた番号の順に品物を送る。
  受付 -> 出荷: 送ってよい [tag: "#42, #43"]
```

`parseNotation` は記法を原本の JSON に、`printNotation` は原本の JSON を記法に直す。
誤りの文の言葉は `parseNotation(text, { lang: "en" })` のように渡した言葉で決まり、渡さなければ日本語になる。
前の形の記法 (`時系列図` か `構成図` で始まる形) は読まず、その行の新しい形を示す誤りで止まる。
前の形と新しい形の対応表は [`CHANGELOG.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.md) にある。

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
| `--lang <言葉>` | 図の中の字 (全体図の札、HTML の読み上げの名前、描けない時の断りの文) と、命令が出す使い方の文と誤りの文の言葉 (`ja` か `en`)。記法の file でも JSON の原本でも、既定は `ja` |
| `--fps <数>` | mp4 の 1 秒のコマの数 (既定 30) |
| `--gif-fps <数>` | GIF の 1 秒のコマの数 (既定 10) |
| `--format <形>` | 書き出す形を `,` で区切る (既定 `mp4,gif,html,png`) |

PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
HTML は図で描く字だけに削った字の file を埋めた 1 file で、外へ何も取りに行かない。
node から呼ぶ時は `@cardenelabs/dragon/export` の `exportDiagram` を使う。

## license

MIT
