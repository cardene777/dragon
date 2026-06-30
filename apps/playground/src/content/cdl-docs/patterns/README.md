# How to choose a pattern

汎用開発で頻出する 12 種類の pattern を cdl で書くためのハブページです。
ある pattern を cdl で表現したいときは、 まずこのページで該当 pattern を探し、 リンク先のガイドに進んでください。

各 pattern ガイドは「前提」 「手順」 「確認」 「設計の意図」 の 4 部構成で書かれています。
mermaid で書いた場合との対比と、 そのまま動く完全 code を必ず掲載しています。

## ユースケースから pattern を選ぶ

やりたいことが決まっているなら、 以下の表から逆引きしてください。

| やりたいこと | 推奨 pattern |
|---|---|
| 隣り合う 2 node を 1 本の edge でつなぎたい | Direct (Cookbook 内) |
| 中継 node を貫通して end-to-end を表現したい | Passthrough (Cookbook 内) |
| 関数の中で read と write の順序を見せたい | Call → Read → Write (Cookbook 内) |
| 処理完了を外部に通知したい | Emit Event (Cookbook 内) |
| 受信側 hook を呼んで callback を返したい | Hook callback (Cookbook 内) |
| if/else / switch の分岐を表現したい | Branch (Cookbook 内) |
| 同じ処理を複数回繰り返したい | Loop (Cookbook 内) |
| 1 入力から複数 worker に分配したい | Fan-out (Cookbook 内) |
| 複数 worker の結果を集約したい | Fan-in (Cookbook 内) |
| 失敗時に元の状態へ巻き戻したい | Rollback (Cookbook 内) |
| 一定時間ごとに自動実行したい | Schedule (Cookbook 内) |
| 入力を検証してから処理したい | Validate → Process (Cookbook 内) |

## pattern 一覧

実装中の 12 pattern を載せています。 catalog page では visual を一覧できます。

| Pattern | 何を表現するか | ガイド |
|---|---|---|
| Direct | 隣り合う node 同士を 1 本の edge でつなぐ | Cookbook 内 |
| Passthrough | 中継 node を貫通して end-to-end を表現する | Cookbook 内 |
| Call → Read → Write | 関数内部の read と write の流れ | Cookbook 内 |
| Emit Event | 処理完了を外部に通知する | Cookbook 内 |
| Hook callback | 受信側 hook を呼び callback を返す | Cookbook 内 |
| Branch | 条件で経路が分岐する | Cookbook 内 |
| Loop | 同じ処理を複数回繰り返す | Cookbook 内 |
| Fan-out | 1 入力から複数 worker に分配する | Cookbook 内 |
| Fan-in | 複数 worker の結果を集約する | Cookbook 内 |
| Rollback | 失敗時に元の状態へ巻き戻す | Cookbook 内 |
| Schedule | 一定時間ごとに自動実行する | Cookbook 内 |
| Validate → Process | 入力検証後に本処理する | Cookbook 内 |

全 12 pattern の見た目を一覧で確認したいときは [catalog ページ](/catalog/patterns) を開いてください。

## 関連 docs

- [Cookbook](/docs/cdl/overview/cookbook) では 25 種類の完全実例を読めます
- [Catalog page](/catalog/patterns) では 12 pattern の visual を一覧できます
