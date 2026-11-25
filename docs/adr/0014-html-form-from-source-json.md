# dragonの図と頁をHTMLの要素で書き、記法とHTMLを原本のJSONを挟んで相互に変換する

## 決めたこと

dragonの図は、記法の文に加えてHTMLの形でも書ける。
HTMLの形は記法の1行を1つの要素で書く (`<dg-flow title="…">`、`<dg-box id="form">…</dg-box>`、`<dg-step name="…">`、`<dg-line from="ok" to="back">`)。
記法とHTMLの間には原本のJSONを挟み、要素と属性の名前はJSONの欄の名前から作る。
記法に語を足すと、HTMLの形にも同じ語が増える。

説明の頁のようなMarkdownの頁も、HTMLの頁と行き来できる。
頭の行は`<dragon-page>`の属性、`##`と`###`は`<section>`と見出し、引用は`<blockquote>`、`<details>`は`<details>`、用語のリンクは`<a>`へ移る。

変換は`dragon convert`の命令とpackageのAPIの関数で出す。
記法へ戻した時は整えた形になり、描かれる図と原本のJSONが元と同じになれば足りる。
頁に今と同じ1行のscriptを置くと、HTMLの形の図もその場で描かれ、段ごとに動く。
`dragon check`と崩れの検査はHTMLのfileも読み、誤りはHTMLの行と要素の名前で知らせる。
今の`<pre class="dragon">`で記法を包む形は変えずに使える。

## 選んだ案

レポートを最初から1枚のHTMLで書き、図もHTMLの道具で箱を選んで直せる。
要素の名前をJSONの欄から作るので、種類と語を足すたびにHTMLの形を手で足さずに済み、全ての種類をHTMLで書ける。
記法、HTML、原本のJSONのどれからでも、ほかの2つへ移せる。

## 却下した案とその理由

| 案 | 却下した理由 |
|---|---|
| 記法をそのまま1つの要素で包む (`<dragon-figure>`) | 図の中がHTMLの要素にならず、今の`<pre class="dragon">`とほぼ同じで、HTMLで書けるようにならない |
| 普通の要素に`data-`の属性で印を付ける | 字が一番多く、AIが書く速さが落ち、どの要素を使ったかは記法に残らない |
| 図だけを変換する | レポートを1枚のHTMLで書けない |
| 空行と字下げまでHTMLの中に持ち、元の字と同じに戻す | JSONの外に書き方の記録を持つ仕組みが要り、作るのが遅くなる |

## 拠り所

- 課題 #3908 の`## 決めたこと (step 2)`の採る行と却下の行
- `packages/dragon/README.md`の、script の1行と`<pre class="dragon">`の塊で頁に図を出す書き方
- 原本のJSON (`base.schema.json`) と、記法と原本のJSONを行き来する今の`dragon export`の形式

## 決めた日

2026-11-25
