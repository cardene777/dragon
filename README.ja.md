# dragon

> 動く図を、人は書きやすい記法で、AI は JSON で書く。

[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md)

dragon は、短い文の file から段ごとに動く図を描く。
箱と、箱をつなぐ線と、線の上を運ばれる物を描き、段を送るごとに話が進む。
人は dragon記法で図を書き、AI は同じ図を JSON で書ける。
同じ原本を頁に置いて動かし、mp4、GIF、HTML、PNG にも書き出せる。

見本帳 (全ての種類の図と、書くとその場で動く編集画面) は <https://cardene777.github.io/dragon/> にある。

## 入れ方

```sh
npm install @cardenelabs/dragon
```

## 最初の図

```dragon
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
```

見本帳の編集画面に貼ると、その場で動く。
自分の頁に置く時は、`parseNotation` で読んだ結果を `mountDiagram` に渡す ([頁に置く](packages/dragon/README.ja.md#頁に置く))。

## できること

| 項目 | 形 |
|---|---|
| 原本 | 共通の骨格と図の種類ごとの欄を持つ JSON。版を持ち、古い版は読む時に変換する |
| 人が書く記法 | 行の頭の英語の語で行の種類が決まる dragon記法 (下の節)。JSON と行き来でき、書き戻す時は整えた形で出す。名前と文は日本語でも書ける |
| 描く部品 | 原本を頁に描き、段ごとに動かす |
| 描ける図 | 時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図 |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 `dragon export` |

## dragon記法

人は dragon記法で図を書く。
どの行も次の決まり 4 つに従う。

1. 行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる
2. 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる
3. 空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む
4. 入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする

| 行の頭 | 書く物 |
|---|---|
| `sequence` `architecture` `state` `git` `time` `tree` | 図の種類と題。見せ方は属性の `view` |
| `group` … `end` | 区画。間に書いた `box` の行の箱を区画の中に置く |
| `box` | 箱。`as` の後が見せる名前。飛び先は属性の `link` で、描いた図で箱が link になる |
| `strip` | 中身の帯と、その欄。時間軸の図では欄に属性の `meter` を付けると物差しになる |
| `branch` | 枝分かれの図の枝。上から順に帯を並べる |
| `scale` 単位 長さ 数 | 時間軸の図の目盛り。長さは数と単位の組 (`12s` など) で書き、その数の目盛りを軸に等間隔で並べる |
| `period` 名前 目盛りの数 | 時間軸の図の区切り。境ごとに名前と番号を置く |
| `row` | 時間軸の図の印の列。目盛りごとに印が並び、属性の `empty` に書いた目盛りは空きの印になる |
| `point` 名札 `at` 目盛り | 時間軸の図で軸の下に置く節目。状態は `note` で書き換える |
| `zoom` 範囲 | 時間軸の図で上の帯に拡大する目盛り。宣言した箱が列ごとに並び、線は属性の `at` と `into` で列を選ぶ |
| `step` | 段。次の `step` まで続く |
| `say` | 段の本文。長い時は次の行から字下げして続ける |
| `code` | 段で打つ命令 |
| `source` | 段の出典。名前の後ろの属性 `url` に在り処を書き、読み上げの段の一覧に名前の link で出る |
| `commit` 名札 `on` 枝 | 枝分かれの図で枝に積む commit。`copy` で当て直しの commit、`merge` で merge commit になり、`hash` と `note` は属性 |
| 枝 `from` commit | 枝分かれの図で、その commit から枝を切る |
| `mark` 列 範囲 | 時間軸の図で、その列の範囲の印の色を属性の `color` に変える |
| `span` 範囲: 字 | 時間軸の図で、軸の下に範囲の括弧を出す。属性の `shape: box` で印の列を囲む枠になる |
| `leaf` 名札 | 木の図の葉。段の中に書き、書いた順に左から並ぶ。値は属性の `hash` で、値を書くと名札は葉の下の札に出る |
| `node` 名札 `of` 子, 子 | 木の図の親。段の中に書き、子の真ん中の上に置かれる。値は属性の `hash` で、どの親にも組まれなかった箱が根になる |
| 名札 `->` 名札 | 線。運ぶ物 (`carry`、`tag`) と名前を置く側 (`side`) は属性 |
| `start` `->` 名札、名札 `->` `finish` | 状態遷移図の始まりの印から出る線と、終わりの印へ入る線。最初の `step` より前に書いた線は今回は通らない道 |
| 枝か `HEAD` `->` commit | 枝分かれの図で、commit を作らずに枝の札か HEAD を動かす |
| `now ->` 目盛り | 時間軸の図で、針をその目盛りまで進める。過ぎた目盛りの印がその時に出る |
| `act` | 箱の中で行う処理 |
| `note` | 箱の下の小さな字を、その段から書き換える |
| `set` | 帯の欄の値と札 |
| `//` | 注釈。図には出ない |

```dragon
sequence 注文の状態を追う

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]

strip 注文: 番号, 状態

step 注文する
  say 客が注文を送り、店のアプリが番号を振る。
  客 -> 店: 注文する
  set 番号: 42
  set 状態: 受付

step 送る
  say 店のアプリが品物を送り、注文を送った状態にする。
  店 -> 客: 品物を送る [carry: none]
  set 状態 [tag: 送った]
```

書き方の全部は [`packages/dragon/examples/quick-start.md`](packages/dragon/examples/quick-start.md) (英語は [`quick-start.en.md`](packages/dragon/examples/quick-start.en.md)) にある。
前の形の記法 (`時系列図` か `構成図` で始まる形) は読めない。
書き直す時は、[`CHANGELOG.md`](CHANGELOG.md) と見本帳の使い方の頁にある前の形と新しい形の対応表を使う。

## 詳しい書き方

| 読む物 | 何が書いてあるか |
|---|---|
| [`packages/dragon/README.ja.md`](packages/dragon/README.ja.md) | 頁に置く書き方、図の種類の部品を後から読む書き方、図の種類ごとの記法、書き出し |
| [書き方の手引き](packages/dragon/examples/quick-start.md) | 全ての行の形と属性 |
| [`CHANGELOG.md`](CHANGELOG.md) | 版ごとの変更と、前の形の記法を書き直す対応表 |

## 手伝う

Issue と pull request を歓迎する。
build と検査の回し方は [`CONTRIBUTING.md`](CONTRIBUTING.md) にある。

## license

MIT
