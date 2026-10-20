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
| 記法 | 1 行が 1 つの文になる行ごとの記法。JSON と行き来できる |
| 描く部品 | 原本から動く図を描く部品。cdl には頼らない |

## license

MIT
