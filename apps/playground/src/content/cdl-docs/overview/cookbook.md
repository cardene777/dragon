# Cookbook ... 25 例の実用パターン集

このページでは、 cdl Text DSL v0.5 で書ける現場頻出パターンを 25 例集めました。
DeFi 10 / NFT 5 / DAO 5 / Bridge 5 のカテゴリ別に整理しており、 あなたが書きたい図に最も近い例をコピペで始められます。

> 💡 **使い方** ... 各例は `title:` / `type:` / `actors:` / `flow:` の 4 ブロックを最小単位として持ち、 必要に応じて `states:` + `animation:` を追加した形になっています。 `textDslToDiagram()` に渡せばそのまま動きます。

## 目次

| カテゴリ | 例数 | 例題 |
|---|---|---|
| [A. DeFi](#a-defi-10-例) | 10 | ERC-20 / Permit / UniswapV2 / UniswapV3 / Aave / Compound / Curve / yEarn / MakerDAO / Lido |
| [B. NFT](#b-nft-5-例) | 5 | ERC-721 / Lazy mint / Auction / Royalty / Soulbound |
| [C. DAO](#c-dao-5-例) | 5 | Governor / Vote / Timelock / Multisig / Snapshot |
| [D. Bridge](#d-bridge-5-例) | 5 | LayerZero / CCTP / Wormhole / Optimism / Hop |

専門用語の前提として、 lane は横方向の列、 node は lane に置く箱、 edge は node 間の矢印、 phase は時系列の章を指します。
詳細は [primitives](/docs/cdl/primitives/README) を参照してください。

## A. DeFi 10 例

DeFi (Decentralized Finance、 分散型金融) の主要 protocol を 10 種類描きます。
ERC-20 transfer の最小例から、 UniswapV3 の concentrated liquidity、 Lido stake までを網羅しています。

### A-1. ERC-20 transfer

ERC-20 (Ethereum の標準トークン規格) の `transfer(to, amount)` を描く最小例です。
Sender が contract に call し、 contract が Receiver の balance を更新する 2 step です。

```text
title: "ERC-20 transfer"
type: sequence

actors:
  - Sender
  - "transfer()": function
  - Receiver

flow:
  - Sender -> "transfer()": "call(to, 10)"
  - "transfer()" -> Receiver: "emit Transfer" (success)

states:
  sender_bal: 100
  receiver_bal: 0

animation:
  - step: "transfer" 1.5s
    focus: [Sender, "transfer()", Receiver]
    tween:
      sender_bal: 100 -> 90
      receiver_bal: 0 -> 10
    badge: "+10"
```

[preview:cookbook/erc20-transfer]

ポイントは、 sender と receiver の balance を tween で同時に動かして、 「10 トークンが移動した」 ことを視覚化する点です。

### A-2. Permit (EIP-2612)

EIP-2612 (Ethereum の署名委譲方式、 gasless approval) の Permit フローです。
Owner が off-chain で署名し、 Spender が on-chain で `permit()` を実行します。

```text
title: "EIP-2612 Permit"
type: sequence

actors:
  - Owner: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - Spender: { kind: actor, subtitle: "relayer" }
  - "EIP-712 typed-data": card
  - "permit(...sig)": function
  - allowances: storage

flow:
  - Owner -> "EIP-712 typed-data": "sign" (info, dotted-flow)
  - "EIP-712 typed-data" -> Spender: "send sig" (info, dotted-flow)
  - Spender -> "permit(...sig)": "permit(sig)" (accent, dotted-flow)
  - "permit(...sig)" -> allowances: "set allowance" (teal, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Off-chain signature" 1.8s
    focus: [Owner, "EIP-712 typed-data"]
    badge: "signed"

  - step: "Spender が relay" 1.8s
    focus: ["EIP-712 typed-data", Spender]
    badge: "relayed"

  - step: "Spender が on-chain execute" 1.8s
    focus: [Spender, "permit(...sig)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"
```

[preview:cookbook/permit]

ポイントは、 sign / relay / execute の 3 phase に分けて、 off-chain と on-chain の境界を時系列で示す点です。
詳細は [Permit パターン](/docs/cdl/patterns/permit) を参照してください。

### A-3. UniswapV2 swap

UniswapV2 (constant product AMM、 `x * y = k` で価格決定する自動マーケットメーカー) の swap です。
Trader が router を呼んで、 pool で token を交換する 2 step です。

```text
title: "UniswapV2 swap"
type: sequence

actors:
  - Trader
  - "Router.swap()": function
  - "Pair (USDC/ETH)": storage

flow:
  - Trader -> "Router.swap()": "swapExactTokensForTokens" (accent)
  - "Router.swap()" -> "Pair (USDC/ETH)": "transferFrom + transfer" (teal, dotted-flow)
  - "Pair (USDC/ETH)" -> Trader: "send out token" (success, dotted-flow)

states:
  pool_usdc: 100000
  pool_eth: 50
  trader_eth: 0

animation:
  - step: "swap 1000 USDC -> ETH" 1.8s
    focus: [Trader, "Router.swap()", "Pair (USDC/ETH)"]
    tween:
      pool_usdc: 100000 -> 101000
      pool_eth: 50 -> 49.5
      trader_eth: 0 -> 0.5
    badge: "swapped"
```

[preview:cookbook/uniswap-v2-swap]

ポイントは、 pool の 2 token reserve と Trader が受け取る token を tween で同時に動かして、 `x * y = k` の不変式を可視化する点です。

### A-4. UniswapV3 swap (concentrated liquidity)

UniswapV3 (V2 の改良版、 価格範囲を指定して流動性を集中させる concentrated liquidity 方式) の swap です。
tick (価格刻み) と liquidity range の関係が肝です。

```text
title: "UniswapV3 swap"
type: sequence

actors:
  - Trader
  - "SwapRouter": function
  - "Pool (tick=200500)": storage
  - "Tick Bitmap": storage

flow:
  - Trader -> "SwapRouter": "exactInputSingle" (accent)
  - "SwapRouter" -> "Tick Bitmap": "find next tick" (info)
  - "Tick Bitmap" -> "Pool (tick=200500)": "active range" (teal)
  - "Pool (tick=200500)" -> Trader: "send out + update tick" (success, dotted-flow)

states:
  current_tick: 200500
  trader_out: 0

animation:
  - step: "compute fee + slip tick" 1.8s
    focus: ["SwapRouter", "Tick Bitmap", "Pool (tick=200500)"]
    tween:
      current_tick: 200500 -> 200480
    badge: "tick slipped"

  - step: "settle output" 1.5s
    focus: ["Pool (tick=200500)", Trader]
    tween:
      trader_out: 0 -> 500
    badge: "received"
```

[preview:cookbook/uniswap-v3-swap]

ポイントは、 V2 と異なり tick が動的に動く点を `current_tick` の tween で示す点です。
liquidity が tick range 外に出ると swap が止まる仕様も視覚化しやすくなります。

### A-5. Aave borrow / repay

Aave (Ethereum 上の lending protocol) の借入と返済を 1 図にまとめた例です。
担保 (collateral) を deposit してから USDC を borrow し、 後で repay します。

```text
title: "Aave borrow / repay"
type: sequence

actors:
  - User
  - "Pool": function
  - aWETH: storage
  - "Debt USDC": storage

flow:
  - User -> "Pool": "supply WETH" (accent)
  - "Pool" -> aWETH: "mint aWETH" (teal, dotted-flow)
  - User -> "Pool": "borrow USDC" (accent)
  - "Pool" -> "Debt USDC": "mint debt" (warning, dotted-flow)
  - User -> "Pool": "repay USDC" (success)
  - "Pool" -> "Debt USDC": "burn debt" (success, dotted-flow)

states:
  collateral: 0
  debt: 0

animation:
  - step: "supply WETH" 1.2s
    focus: [User, "Pool", aWETH]
    tween:
      collateral: 0 -> 1
    badge: "supplied"

  - step: "borrow USDC" 1.2s
    focus: [User, "Pool", "Debt USDC"]
    tween:
      debt: 0 -> 1000
    badge: "borrowed"

  - step: "repay USDC" 1.2s
    focus: [User, "Pool", "Debt USDC"]
    tween:
      debt: 1000 -> 0
    badge: "repaid"
```

[preview:cookbook/aave-borrow]

ポイントは、 collateral と debt の 2 state を別々に追跡して、 「supply → borrow → repay」 の状態変化を時系列で示す点です。

### A-6. Compound supply

Compound (Aave と並ぶ lending protocol) への supply と cToken mint です。
Compound は cToken (interest-bearing token、 利息が貯まるトークン) を mint する点が特徴です。

```text
title: "Compound supply"
type: sequence

actors:
  - User
  - "cUSDC.mint()": function
  - "USDC vault": storage
  - "cUSDC balance": storage

flow:
  - User -> "cUSDC.mint()": "mint(1000)" (accent)
  - "cUSDC.mint()" -> "USDC vault": "transferFrom 1000 USDC" (teal, dotted-flow)
  - "cUSDC.mint()" -> "cUSDC balance": "mint 49.5 cUSDC" (success, dotted-flow)

states:
  usdc_in_vault: 0
  user_ctoken: 0

animation:
  - step: "supply 1000 USDC" 1.8s
    focus: [User, "cUSDC.mint()", "USDC vault", "cUSDC balance"]
    tween:
      usdc_in_vault: 0 -> 1000
      user_ctoken: 0 -> 49.5
    badge: "supplied"
```

[preview:cookbook/compound-supply]

ポイントは、 exchange rate (`1 cUSDC = 1000 / 49.5 USDC`) を 2 つの tween で同時に示す点です。
時間経過で cUSDC value が上がる挙動も、 後続の phase で `tween: usdc_in_vault: 1000 -> 1005` のように書けます。

### A-7. Curve stable swap

Curve (stablecoin に特化した AMM、 stable swap 方式で slippage を抑える設計) の swap です。
3pool (USDT / USDC / DAI) のような複数 token を 1 pool で扱う構造が特徴です。

```text
title: "Curve stable swap"
type: sequence

actors:
  - Trader
  - "3pool.exchange()": function
  - "Reserve USDT": storage
  - "Reserve USDC": storage
  - "Reserve DAI": storage

flow:
  - Trader -> "3pool.exchange()": "exchange(0, 1, 1000)" (accent)
  - "3pool.exchange()" -> "Reserve USDT": "+1000 USDT" (teal)
  - "3pool.exchange()" -> "Reserve USDC": "-999.5 USDC" (teal, dotted-flow)
  - "3pool.exchange()" -> Trader: "send 999.5 USDC" (success, dotted-flow)

states:
  reserve_usdt: 50000
  reserve_usdc: 50000

animation:
  - step: "swap USDT -> USDC" 1.8s
    focus: [Trader, "3pool.exchange()", "Reserve USDT", "Reserve USDC"]
    tween:
      reserve_usdt: 50000 -> 51000
      reserve_usdc: 50000 -> 49000.5
    badge: "swapped"
```

[preview:cookbook/curve-swap]

ポイントは、 Curve の `A` (amplification coefficient、 stable swap の曲線を制御する係数) によって slippage が `999.5 USDC` 程度に抑えられる点です。
UniswapV2 の constant product だと同条件で `990 USDC` 程度しか受け取れません。

### A-8. yEarn vault deposit

yEarn (利回り自動運用 protocol、 vault に deposit すると最適 strategy で運用される) の vault deposit です。
User が vault に deposit すると、 strategy が外部 protocol (Aave / Compound 等) に資金を配置します。

```text
title: "yEarn vault deposit"
type: sequence

actors:
  - User
  - "yvUSDC.deposit()": function
  - "yvUSDC shares": storage
  - "Strategy": function
  - "Aave Pool": storage

flow:
  - User -> "yvUSDC.deposit()": "deposit(1000 USDC)" (accent)
  - "yvUSDC.deposit()" -> "yvUSDC shares": "mint 950 shares" (teal, dotted-flow)
  - "yvUSDC.deposit()" -> "Strategy": "report()" (info)
  - "Strategy" -> "Aave Pool": "supply 1000 USDC" (success, dotted-flow)

states:
  vault_pool: 0
  user_shares: 0

animation:
  - step: "deposit" 1.5s
    focus: [User, "yvUSDC.deposit()", "yvUSDC shares"]
    tween:
      vault_pool: 0 -> 1000
      user_shares: 0 -> 950
    badge: "deposited"

  - step: "auto-deploy" 1.5s
    focus: ["Strategy", "Aave Pool"]
    badge: "deployed"
```

[preview:cookbook/yearn-vault]

ポイントは、 deposit と auto-deploy を別 phase に分けて、 「user 視点では deposit 1 step」 だが内部では 2 step あることを時系列で示す点です。

### A-9. MakerDAO CDP

MakerDAO (DAI を発行する protocol) の CDP (Collateralized Debt Position、 担保付き債務ポジション) を描く例です。
ETH を担保にして DAI を発行する 2 step です。

```text
title: "MakerDAO CDP"
type: sequence

actors:
  - User
  - "CDP Manager": function
  - "Vault (ETH locked)": storage
  - "DAI minted": storage

flow:
  - User -> "CDP Manager": "open + lock 10 ETH" (accent)
  - "CDP Manager" -> "Vault (ETH locked)": "transferFrom 10 ETH" (teal, dotted-flow)
  - User -> "CDP Manager": "draw 5000 DAI" (accent)
  - "CDP Manager" -> "DAI minted": "mint 5000 DAI" (success, dotted-flow)
  - "DAI minted" -> User: "send DAI" (success, dotted-flow)

states:
  locked_eth: 0
  minted_dai: 0

animation:
  - step: "lock ETH" 1.2s
    focus: [User, "CDP Manager", "Vault (ETH locked)"]
    tween:
      locked_eth: 0 -> 10
    badge: "locked"

  - step: "draw DAI" 1.2s
    focus: [User, "CDP Manager", "DAI minted"]
    tween:
      minted_dai: 0 -> 5000
    badge: "minted"
```

[preview:cookbook/maker-cdp]

ポイントは、 collateralization ratio (`10 ETH x $3000 / 5000 DAI = 600%`) を視覚化するために、 担保と債務の 2 state を別 phase で動かす点です。

### A-10. Lido stake

Lido (Ethereum の liquid staking protocol、 ETH を staking しながら stETH を受け取って流動性を保つ) の stake です。
User が ETH を deposit すると stETH が同量 mint されます。

```text
title: "Lido stake"
type: sequence

actors:
  - User
  - "Lido.submit()": function
  - "stETH balance": storage
  - "Validator pool": storage

flow:
  - User -> "Lido.submit()": "submit 1 ETH" (accent)
  - "Lido.submit()" -> "stETH balance": "mint 1 stETH" (success, dotted-flow)
  - "Lido.submit()" -> "Validator pool": "deposit to validators" (teal, dotted-flow)

states:
  user_steth: 0
  pooled_eth: 0

animation:
  - step: "stake 1 ETH" 1.5s
    focus: [User, "Lido.submit()", "stETH balance", "Validator pool"]
    tween:
      user_steth: 0 -> 1
      pooled_eth: 0 -> 1
    badge: "staked"
```

[preview:cookbook/lido-stake]

ポイントは、 stETH が rebase token (時間経過で balance が増えるトークン) であることを示すために、 後続 phase で `user_steth: 1 -> 1.05` のように動かすと完全になります。

## B. NFT 5 例

NFT (Non-Fungible Token、 非代替性トークン) の主要パターンを 5 種類描きます。
ERC-721 の基本から、 lazy mint、 auction、 royalty、 soulbound まで含みます。

### B-1. ERC-721 safe-transfer

ERC-721 (Ethereum の NFT 標準規格) の `safeTransferFrom` です。
受け取り側が EOA (外部所有アカウント、 通常の wallet) か contract かを判定する点が特徴です。

```text
title: "ERC-721 safeTransferFrom"
type: sequence

actors:
  - Owner
  - "safeTransferFrom()": function
  - "ownerOf map": storage
  - Receiver

flow:
  - Owner -> "safeTransferFrom()": "tokenId=42" (accent)
  - "safeTransferFrom()" -> "ownerOf map": "update owner" (teal, dotted-flow)
  - "safeTransferFrom()" -> Receiver: "onERC721Received check" (info, dotted-flow)
  - Receiver -> "safeTransferFrom()": "return selector" (success, dotted-flow)

states:
  token_owner: "Owner"

animation:
  - step: "transfer" 1.8s
    focus: [Owner, "safeTransferFrom()", "ownerOf map", Receiver]
    set:
      token_owner: "Receiver"
    badge: "transferred"
```

[preview:cookbook/erc721-transfer]

ポイントは、 `onERC721Received` の callback で receiver が contract 対応か確認する step を明示する点です。
EOA 受け取りなら callback は不要、 contract 受け取りなら必須です。

### B-2. Lazy mint (signature-based)

Lazy mint (実際の mint を購入時まで遅延させる方式、 OpenSea Seaport 系で広く採用) です。
Creator が事前に署名し、 Buyer が claim 時に mint されます。

```text
title: "Lazy mint (signature-based)"
type: sequence

actors:
  - Creator: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - "Voucher": card
  - Buyer
  - "redeem()": function
  - "tokenId 42": storage

flow:
  - Creator -> "Voucher": "sign voucher" (info, dotted-flow)
  - "Voucher" -> Buyer: "off-chain hand-off" (info, dotted-flow)
  - Buyer -> "redeem()": "redeem(voucher, sig)" (accent)
  - "redeem()" -> "tokenId 42": "_mint + transfer" (success, dotted-flow)

states:
  minted: 0

animation:
  - step: "Creator が voucher を作成" 1.2s
    focus: [Creator, "Voucher"]
    badge: "signed"

  - step: "Buyer が voucher を入手" 1.2s
    focus: ["Voucher", Buyer]
    badge: "received"

  - step: "Buyer が redeem" 1.8s
    focus: [Buyer, "redeem()", "tokenId 42"]
    tween:
      minted: 0 -> 1
    badge: "minted"
```

[preview:cookbook/lazy-mint]

ポイントは、 mint の gas を Buyer が払う設計を示すために、 Creator の signature step と Buyer の redeem step を別 phase に分ける点です。

### B-3. Auction (English bid loop)

English Auction (価格上昇方式の auction、 入札ごとに最高額が更新される) の bid loop です。
3 人の Bidder が順に bid を更新する流れを描きます。

```text
title: "English Auction"
type: sequence

actors:
  - "Bidder 1"
  - "Bidder 2"
  - "Bidder 3"
  - "Auction.bid()": function
  - "highestBid": storage

flow:
  - "Bidder 1" -> "Auction.bid()": "bid(1 ETH)" (accent)
  - "Auction.bid()" -> "highestBid": "update to 1 ETH" (teal, dotted-flow)
  - "Bidder 2" -> "Auction.bid()": "bid(1.5 ETH)" (accent)
  - "Auction.bid()" -> "highestBid": "update to 1.5 ETH" (teal, dotted-flow)
  - "Bidder 3" -> "Auction.bid()": "bid(2 ETH)" (accent)
  - "Auction.bid()" -> "highestBid": "update to 2 ETH" (success, dotted-flow)

states:
  highest: 0
  leader: "none"

animation:
  - step: "Bidder 1 が 1 ETH bid" 1.0s
    focus: ["Bidder 1", "Auction.bid()", "highestBid"]
    tween:
      highest: 0 -> 1
    set:
      leader: "Bidder 1"
    badge: "1 ETH"

  - step: "Bidder 2 が 1.5 ETH bid" 1.0s
    focus: ["Bidder 2", "Auction.bid()", "highestBid"]
    tween:
      highest: 1 -> 1.5
    set:
      leader: "Bidder 2"
    badge: "1.5 ETH"

  - step: "Bidder 3 が 2 ETH bid" 1.0s
    focus: ["Bidder 3", "Auction.bid()", "highestBid"]
    tween:
      highest: 1.5 -> 2
    set:
      leader: "Bidder 3"
    badge: "2 ETH (winning)"
```

[preview:cookbook/english-auction]

ポイントは、 `highest` を tween で動かし、 `leader` を set で切替える点です。
時間経過とともに highest が階段状に上がっていく挙動が、 「auction が進行している」 ことを直感的に示します。

### B-4. Royalty (EIP-2981)

EIP-2981 (NFT の royalty を on-chain で宣言する標準) の royalty 分配です。
secondary sale 時に、 contract が royalty receiver と seller に value を分配します。

```text
title: "EIP-2981 royalty"
type: sequence

actors:
  - Buyer
  - "Marketplace": function
  - "royaltyInfo()": function
  - Creator: { kind: actor, eyebrow: "royalty receiver" }
  - Seller

flow:
  - Buyer -> "Marketplace": "buy NFT (10 ETH)" (accent)
  - "Marketplace" -> "royaltyInfo()": "ask royalty" (info)
  - "royaltyInfo()" -> "Marketplace": "5% = 0.5 ETH" (success, dotted-flow)
  - "Marketplace" -> Creator: "send 0.5 ETH" (success, dotted-flow)
  - "Marketplace" -> Seller: "send 9.5 ETH" (success, dotted-flow)

states:
  creator_received: 0
  seller_received: 0

animation:
  - step: "buy 10 ETH" 1.0s
    focus: [Buyer, "Marketplace"]
    badge: "purchase"

  - step: "royalty split" 1.8s
    focus: ["Marketplace", "royaltyInfo()", Creator, Seller]
    tween:
      creator_received: 0 -> 0.5
      seller_received: 0 -> 9.5
    badge: "split"
```

[preview:cookbook/royalty-2981]

ポイントは、 royalty receiver と seller の 2 出力を tween で同時に動かして、 「10 ETH が 0.5 + 9.5 に分割された」 ことを 1 図で示す点です。

### B-5. Soulbound (non-transferable)

Soulbound NFT (転送不可な NFT、 SBT、 EIP-5114 系) の transfer 拒否です。
通常の `transferFrom` が呼ばれると revert する設計を視覚化します。

```text
title: "Soulbound NFT"
type: state

actors:
  - "Issued": { kind: state, initial: true }
  - "Bound": { kind: state }
  - "Revoked": { kind: state, final: true }

flow:
  - "Issued" -> "Bound": "first claim (success)"
  - "Bound" -> "Bound": "transferFrom → revert" { guard: "always revert" }
  - "Bound" -> "Revoked": "issuer revokes" (warning)
```

[preview:cookbook/soulbound]

ポイントは、 state 遷移図 (`type: state`) で「`Bound` から `Bound` 自身への戻りが revert する」 ことを self-loop で示す点です。
通常 ERC-721 と異なり transferFrom が拒否される設計が、 1 図で把握できます。

## C. DAO 5 例

DAO (Decentralized Autonomous Organization、 分散型自律組織) の governance パターンを 5 種類描きます。
Governor / Vote / Timelock / Multisig / Snapshot を含みます。

### C-1. Governor propose

OpenZeppelin Governor (DAO governance contract の標準実装) の propose 流れです。
Proposer が `propose()` を呼ぶと提案 ID が発行されます。

```text
title: "Governor propose"
type: sequence

actors:
  - Proposer
  - "Governor.propose()": function
  - "proposals map": storage

flow:
  - Proposer -> "Governor.propose()": "propose(targets, values, calldatas, description)" (accent)
  - "Governor.propose()" -> "proposals map": "store proposalId" (teal, dotted-flow)
  - "Governor.propose()" -> Proposer: "emit ProposalCreated" (success, dotted-flow)

states:
  proposal_count: 0
  proposal_state: "Pending"

animation:
  - step: "propose" 1.5s
    focus: [Proposer, "Governor.propose()", "proposals map"]
    tween:
      proposal_count: 0 -> 1
    set:
      proposal_state: "Pending"
    badge: "proposed"
```

[preview:cookbook/governor-propose]

ポイントは、 propose 直後の state が `Pending` (投票開始前の grace period 中) であることを set で明示する点です。

### C-2. Vote (For / Against / Abstain)

`castVote()` の 3 種類の選択肢 (For / Against / Abstain) と vote tally の集計です。
3 人の Voter が順に投票する流れを描きます。

```text
title: "Governor vote"
type: sequence

actors:
  - "Voter A"
  - "Voter B"
  - "Voter C"
  - "castVote()": function
  - "vote tally": storage

flow:
  - "Voter A" -> "castVote()": "For" (success)
  - "castVote()" -> "vote tally": "+1 For" (teal, dotted-flow)
  - "Voter B" -> "castVote()": "Against" (error)
  - "castVote()" -> "vote tally": "+1 Against" (teal, dotted-flow)
  - "Voter C" -> "castVote()": "Abstain" (warning)
  - "castVote()" -> "vote tally": "+1 Abstain" (teal, dotted-flow)

states:
  for_count: 0
  against_count: 0
  abstain_count: 0

animation:
  - step: "Voter A votes For" 1.0s
    focus: ["Voter A", "castVote()", "vote tally"]
    tween:
      for_count: 0 -> 1
    badge: "For"

  - step: "Voter B votes Against" 1.0s
    focus: ["Voter B", "castVote()", "vote tally"]
    tween:
      against_count: 0 -> 1
    badge: "Against"

  - step: "Voter C votes Abstain" 1.0s
    focus: ["Voter C", "castVote()", "vote tally"]
    tween:
      abstain_count: 0 -> 1
    badge: "Abstain"
```

[preview:cookbook/gov-vote]

ポイントは、 各 vote option に対応した tone (`success` / `error` / `warning`) を使って、 視覚的に 3 種類を区別する点です。

### C-3. Timelock queue / execute

Timelock (proposal が成立してから一定時間後に実行される機構、 governance 攻撃緩和) の queue / execute です。
queue 後の delay 期間を経て execute されます。

```text
title: "Timelock queue / execute"
type: state

actors:
  - "Succeeded": { kind: state, initial: true }
  - "Queued": { kind: state }
  - "Ready": { kind: state }
  - "Executed": { kind: state, final: true }

flow:
  - "Succeeded" -> "Queued": "queue()" (accent)
  - "Queued" -> "Ready": "delay (2 days)" { guard: "block.timestamp > eta" }
  - "Ready" -> "Executed": "execute()" (success)
```

[preview:cookbook/timelock]

ポイントは、 `delay` 遷移に `guard:` で時間条件を明示する点です。
guard が外れる (2 日経過) まで execute は拒否される設計が 1 図で把握できます。

### C-4. Multisig (Gnosis Safe)

Gnosis Safe (3-of-5 など閾値署名で動く multisig wallet の代表実装) の execTransaction です。
3 owner が署名を集めて execute する流れを描きます。

```text
title: "Gnosis Safe execTransaction"
type: sequence

actors:
  - "Owner 1"
  - "Owner 2"
  - "Owner 3"
  - "Safe.execTransaction()": function
  - "Target contract": function

flow:
  - "Owner 1" -> "Safe.execTransaction()": "sig 1" (info, dotted-flow)
  - "Owner 2" -> "Safe.execTransaction()": "sig 2" (info, dotted-flow)
  - "Owner 3" -> "Safe.execTransaction()": "sig 3 + execute" (accent, dotted-flow)
  - "Safe.execTransaction()" -> "Target contract": "call(data)" (success, dotted-flow)

states:
  sigs_collected: 0
  threshold: 3

animation:
  - step: "Owner 1 が署名" 1.0s
    focus: ["Owner 1", "Safe.execTransaction()"]
    tween:
      sigs_collected: 0 -> 1
    badge: "1/3"

  - step: "Owner 2 が署名" 1.0s
    focus: ["Owner 2", "Safe.execTransaction()"]
    tween:
      sigs_collected: 1 -> 2
    badge: "2/3"

  - step: "Owner 3 が署名 + execute" 1.2s
    focus: ["Owner 3", "Safe.execTransaction()", "Target contract"]
    tween:
      sigs_collected: 2 -> 3
    badge: "3/3 executed"
```

[preview:cookbook/multisig-safe]

ポイントは、 `sigs_collected` を threshold 3 まで tween で動かして、 「閾値が満たされた瞬間に execute される」 ことを視覚化する点です。

### C-5. Snapshot off-chain vote

Snapshot (off-chain で gas-less に投票する DAO ツール、 EIP-712 signature を使う) の vote 集計です。
on-chain DAO と異なり、 voting 自体は IPFS に保存されます。

```text
title: "Snapshot off-chain vote"
type: sequence

actors:
  - Voter: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - "EIP-712 vote": card
  - "Snapshot Hub": service
  - "IPFS": storage
  - "Result": storage

flow:
  - Voter -> "EIP-712 vote": "sign vote" (info, dotted-flow)
  - "EIP-712 vote" -> "Snapshot Hub": "submit sig" (info, dotted-flow)
  - "Snapshot Hub" -> "IPFS": "store vote payload" (teal, dotted-flow)
  - "Snapshot Hub" -> "Result": "tally + show on UI" (success, dotted-flow)

states:
  votes_collected: 0

animation:
  - step: "Voter が署名" 1.2s
    focus: [Voter, "EIP-712 vote"]
    badge: "signed"

  - step: "Hub が集計" 1.5s
    focus: ["EIP-712 vote", "Snapshot Hub", "IPFS"]
    badge: "stored"

  - step: "結果反映" 1.0s
    focus: ["Snapshot Hub", "Result"]
    tween:
      votes_collected: 0 -> 1
    badge: "tallied"
```

[preview:cookbook/snapshot-vote]

ポイントは、 gas 0 で voting できる代わりに IPFS と Hub という off-chain インフラを経由する設計を、 lane と phase で明示する点です。

## D. Bridge 5 例

Bridge (異なる blockchain 間で資産やメッセージを移動する仕組み) の代表 protocol を 5 種類描きます。
LayerZero / CCTP / Wormhole / Optimism / Hop を含みます。

### D-1. LayerZero V2 endpoint

LayerZero V2 (omnichain messaging protocol、 source chain と dest chain を Endpoint で接続) の send 流れです。
DVN (Decentralized Verifier Network) が message を verify します。

```text
title: "LayerZero V2 send"
type: sequence

actors:
  - "Source OApp"
  - "Source Endpoint": function
  - "DVN": service
  - "Executor": service
  - "Dest Endpoint": function
  - "Dest OApp"

flow:
  - "Source OApp" -> "Source Endpoint": "send(message)" (accent)
  - "Source Endpoint" -> "DVN": "verify request" (info, dotted-flow)
  - "DVN" -> "Dest Endpoint": "verified payload" (info, dotted-flow)
  - "Executor" -> "Dest Endpoint": "execute()" (accent)
  - "Dest Endpoint" -> "Dest OApp": "lzReceive(message)" (success, dotted-flow)

states:
  src_sent: 0
  dst_received: 0

animation:
  - step: "Source 送信" 1.5s
    focus: ["Source OApp", "Source Endpoint", "DVN"]
    tween:
      src_sent: 0 -> 1
    badge: "sent"

  - step: "DVN verify" 1.5s
    focus: ["DVN", "Dest Endpoint"]
    badge: "verified"

  - step: "Dest 受信" 1.5s
    focus: ["Executor", "Dest Endpoint", "Dest OApp"]
    tween:
      dst_received: 0 -> 1
    badge: "received"
```

[preview:cookbook/layerzero-v2]

ポイントは、 DVN と Executor を独立 lane に置いて、 「verify と execute は別 service」 という LayerZero V2 の設計を明示する点です。

### D-2. CCTP (Circle Cross-Chain Transfer)

CCTP (Circle 公式の USDC cross-chain protocol、 burn-mint 方式で 1:1 を保証) の transfer です。
source chain で burn して dest chain で mint します。

```text
title: "CCTP USDC transfer"
type: sequence

actors:
  - User
  - "TokenMessenger (src)": function
  - "MessageTransmitter": service
  - "Attestation API": service
  - "TokenMessenger (dst)": function

flow:
  - User -> "TokenMessenger (src)": "depositForBurn(1000 USDC)" (accent)
  - "TokenMessenger (src)" -> "MessageTransmitter": "burn + emit message" (teal, dotted-flow)
  - "MessageTransmitter" -> "Attestation API": "request attestation" (info, dotted-flow)
  - "Attestation API" -> User: "attestation sig" (info, dotted-flow)
  - User -> "TokenMessenger (dst)": "receiveMessage(msg, sig)" (accent)
  - "TokenMessenger (dst)" -> User: "mint 1000 USDC" (success, dotted-flow)

states:
  src_balance: 1000
  dst_balance: 0

animation:
  - step: "Source burn" 1.5s
    focus: [User, "TokenMessenger (src)", "MessageTransmitter"]
    tween:
      src_balance: 1000 -> 0
    badge: "burned"

  - step: "Attestation 取得" 1.2s
    focus: ["MessageTransmitter", "Attestation API"]
    badge: "attested"

  - step: "Dest mint" 1.5s
    focus: [User, "TokenMessenger (dst)"]
    tween:
      dst_balance: 0 -> 1000
    badge: "minted"
```

[preview:cookbook/cctp]

ポイントは、 source の `src_balance` が 0 になる瞬間と dest の `dst_balance` が 1000 になる瞬間を別 phase で示して、 burn-mint の同時性を明示する点です。

### D-3. Wormhole VAA

Wormhole (multi-chain bridge、 19 chain 対応、 Guardian network が VAA を生成) の VAA (Verifiable Action Approval、 検証可能な署名済みメッセージ) 経路です。
Guardian network が source の event を観測して VAA を出力します。

```text
title: "Wormhole VAA bridge"
type: sequence

actors:
  - User
  - "Wormhole Core (src)": function
  - "Guardian Network": service
  - "VAA": card
  - "Wormhole Core (dst)": function

flow:
  - User -> "Wormhole Core (src)": "publishMessage" (accent)
  - "Wormhole Core (src)" -> "Guardian Network": "emit event" (info, dotted-flow)
  - "Guardian Network" -> "VAA": "sign by 13/19" (info, dotted-flow)
  - User -> "Wormhole Core (dst)": "completeTransfer(VAA)" (accent)
  - "Wormhole Core (dst)" -> User: "release token" (success, dotted-flow)

states:
  guardian_sigs: 0
  threshold: 13

animation:
  - step: "Source publish" 1.2s
    focus: [User, "Wormhole Core (src)", "Guardian Network"]
    badge: "published"

  - step: "Guardian 署名収集" 1.5s
    focus: ["Guardian Network", "VAA"]
    tween:
      guardian_sigs: 0 -> 13
    badge: "13/19"

  - step: "Dest claim" 1.2s
    focus: [User, "Wormhole Core (dst)"]
    badge: "released"
```

[preview:cookbook/wormhole-vaa]

ポイントは、 Guardian の閾値 (13/19) を tween で示して、 「13 個の署名が集まった瞬間に VAA が valid になる」 ことを視覚化する点です。

### D-4. Optimism canonical bridge

Optimism (Ethereum L2 の代表的 Optimistic Rollup) の canonical bridge です。
deposit (L1 → L2) は即時、 withdraw (L2 → L1) は 7 日 challenge period があります。

```text
title: "Optimism canonical bridge"
type: sequence

actors:
  - User
  - "L1StandardBridge": function
  - "L2StandardBridge": function
  - "withdraw queue": storage

flow:
  - User -> "L1StandardBridge": "depositETH" (accent)
  - "L1StandardBridge" -> "L2StandardBridge": "send msg" (info, dotted-flow)
  - "L2StandardBridge" -> User: "credit L2 ETH" (success, dotted-flow)
  - User -> "L2StandardBridge": "withdraw" (accent)
  - "L2StandardBridge" -> "withdraw queue": "enqueue (7d challenge)" (warning, dotted-flow)
  - "withdraw queue" -> User: "L1 release (after 7d)" (success, dotted-flow)

states:
  l1_balance: 100
  l2_balance: 0
  withdraw_pending: 0

animation:
  - step: "L1 -> L2 deposit (即時)" 1.5s
    focus: [User, "L1StandardBridge", "L2StandardBridge"]
    tween:
      l1_balance: 100 -> 0
      l2_balance: 0 -> 100
    badge: "deposited"

  - step: "L2 -> L1 withdraw (7d wait)" 1.5s
    focus: [User, "L2StandardBridge", "withdraw queue"]
    tween:
      l2_balance: 100 -> 0
      withdraw_pending: 0 -> 100
    badge: "pending 7d"

  - step: "L1 release" 1.2s
    focus: ["withdraw queue", User]
    tween:
      withdraw_pending: 100 -> 0
      l1_balance: 0 -> 100
    badge: "released"
```

[preview:cookbook/optimism-bridge]

ポイントは、 deposit と withdraw の非対称性 (即時 vs 7 日) を 2 phase で明示する点です。
Optimistic Rollup の challenge period がなぜ必要かが、 時間軸で直感的に伝わります。

### D-5. Hop relay

Hop Protocol (L2 間の高速 transfer、 bonder が即時 liquidity を提供する設計) の relay です。
Bonder が dest chain で即時に token を release し、 後で source chain から settle されます。

```text
title: "Hop relay (L2 -> L2)"
type: sequence

actors:
  - User
  - "Hop Bridge (src)": function
  - "Bonder": service
  - "Hop Bridge (dst)": function

flow:
  - User -> "Hop Bridge (src)": "send(1000 USDC)" (accent)
  - "Hop Bridge (src)" -> "Bonder": "TransferSentEvent" (info, dotted-flow)
  - "Bonder" -> "Hop Bridge (dst)": "bondWithdrawal (即時)" (accent, dotted-flow)
  - "Hop Bridge (dst)" -> User: "release 1000 USDC (- fee)" (success, dotted-flow)
  - "Hop Bridge (src)" -> "Bonder": "settle (later)" (teal, dotted-flow)

states:
  src_locked: 0
  user_received: 0

animation:
  - step: "Source lock" 1.0s
    focus: [User, "Hop Bridge (src)", "Bonder"]
    tween:
      src_locked: 0 -> 1000
    badge: "locked"

  - step: "Bonder が即時 release" 1.2s
    focus: ["Bonder", "Hop Bridge (dst)", User]
    tween:
      user_received: 0 -> 998
    badge: "released"

  - step: "Source settle" 1.0s
    focus: ["Hop Bridge (src)", "Bonder"]
    badge: "settled"
```

[preview:cookbook/hop-relay]

ポイントは、 Bonder が即時 release した後で settle が後追いで起きる設計を、 phase の順序で表現する点です。
User 視点では 2 phase で完了するが、 Bonder は 3 phase の最後で資金を回収する非対称性が見えます。

## 関連

このページから次に読む候補は 4 つあります。

- 最初から動かしたい人は [Quickstart](/docs/cdl/overview/quickstart) で 5 step
- 全 API 構文を引きたい人は [Text DSL Specification](/docs/cdl/text-dsl-spec)
- mermaid からの移行手順は [Mermaid Migration](/docs/cdl/overview/mermaid-migration)
- LLM に DSL を生成させたい人は [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide)
