# How to choose a pattern

blockchain と Web2 で頻出する 18 種類の pattern を cdl で書くためのハブページです。
ある pattern を cdl で表現したいときは、 まずこのページで該当 pattern を探し、 リンク先のガイドに進んでください。

各 pattern ガイドは「前提」 「手順」 「確認」 「設計の意図」 の 4 部構成で書かれています。
mermaid で書いた場合との対比と、 そのまま動く完全 code を必ず掲載しています。

## ユースケースから pattern を選ぶ

やりたいことが決まっているなら、 以下の表から逆引きしてください。

| やりたいこと | 推奨 pattern |
|---|---|
| 署名を off-chain で作って on-chain で使いたい | [Permit](/docs/cdl/patterns/permit) |
| ある chain の資産を別 chain で使いたい | [Bridge](/docs/cdl/patterns/bridge) / CCTP |
| 自動 market maker (AMM) を表現したい | [DEX Swap](/docs/cdl/patterns/dex-swap) |
| 1 transaction で複数の関数を呼びたい | [Multicall](/docs/cdl/patterns/multicall) |
| ERC-20 を approve してから transferFrom したい | [Approve → Pull](/docs/cdl/patterns/approve-pull) |
| Stake して reward をもらう流れを表現したい | Staking (Cookbook 内) |
| 担保割れによる清算を表現したい | Liquidation (Cookbook 内) |

## pattern 一覧

blockchain 領域の 12 pattern と汎用の 6 pattern に分けて並べています。
独立ページを持つ pattern はリンクから直接ガイドへ飛べます。
Cookbook 内とある pattern は [Cookbook](/docs/cdl/overview/cookbook) の該当 example を参照してください。

### blockchain 領域 (12 pattern)

| Pattern | 何を表現するか | ガイド |
|---|---|---|
| Permit (EIP-2612) | 署名を off-chain で作り gas を使わずに allowance を渡す | [permit.md](/docs/cdl/patterns/permit) |
| Bridge (Lock-Mint) | 元 chain で資産を lock し別 chain で同量を mint する | [bridge.md](/docs/cdl/patterns/bridge) |
| DEX Swap (AMM) | constant product (x*y=k) で価格を決める swap | [dex-swap.md](/docs/cdl/patterns/dex-swap) |
| Multicall (Router 経由) | Router を貫通して 1 tx で複数 target を呼ぶ | [multicall.md](/docs/cdl/patterns/multicall) |
| Approve → Pull (2 step) | ERC-20 を approve してから transferFrom で引き抜く | [approve-pull.md](/docs/cdl/patterns/approve-pull) |
| Proxy + Implementation | upgradeable proxy の delegatecall 経路 | Cookbook 内 example 5 |
| Lending (Supply / Borrow) | 担保供給から借入までの流れ | Cookbook 内 |
| Liquidation | 担保割れによる清算と incentive | Cookbook 内 |
| Staking | stake と reward 受け取りの 2 step | Cookbook 内 |
| CCTP (USDC Burn-Mint) | 元 chain で burn し別 chain で mint する USDC 専用経路 | Cookbook 内 |
| NFT Mint | NFT の mint と所有権移転 | Cookbook 内 |
| Hook callback | receive 側 hook を呼ぶ callback パターン | Cookbook 内 |

### 汎用 pattern (6 種類)

| Pattern | 何を表現するか | ガイド |
|---|---|---|
| Emit Event | function 実行後に event で外部通知する | Cookbook 内 |
| Call → Read → Write | function 内部の read と write の流れ | Cookbook 内 |
| Direct | 隣り合う node 同士を 1 本の edge でつなぐ | Cookbook 内 |
| Passthrough | 中継 node を貫通して end-to-end を表現する | Cookbook 内 |
| Oracle | 外部の oracle 価格 feed を取得する | Cookbook 内 |
| Meta-Tx | 第三者が gas を払う meta transaction | Cookbook 内 |

全 18 pattern の見た目を一覧で確認したいときは [catalog ページ](/catalog/patterns) を開いてください。

## 関連 docs

- [Cookbook](/docs/cdl/overview/cookbook) では 9 種類の完全実例を読めます
- [Catalog page](/catalog/patterns) では 18 pattern の visual を一覧できます
