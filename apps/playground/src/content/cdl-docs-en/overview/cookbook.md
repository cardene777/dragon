# Cookbook ... 25 practical recipes

This page collects 25 cdl Text DSL v0.5 recipes you frequently want to write in real projects, organized into four categories: DeFi (10), NFT (5), DAO (5), and Bridge (5).
When you think "I want to draw this kind of diagram", open the closest section and start by copy-pasting from there.

> 💡 **How to use** ... each example takes the four blocks `title:` / `type:` / `actors:` / `flow:` as the minimal unit, and adds `states:` + `animation:` where the diagram needs motion. Feed any snippet to `textDslToDiagram()` and it runs.

## Table of contents

| Category | Count | Examples |
|---|---|---|
| [A. DeFi](#a-defi-10-recipes) | 10 | ERC-20 / Permit / UniswapV2 / UniswapV3 / Aave / Compound / Curve / yEarn / MakerDAO / Lido |
| [B. NFT](#b-nft-5-recipes) | 5 | ERC-721 / Lazy mint / Auction / Royalty / Soulbound |
| [C. DAO](#c-dao-5-recipes) | 5 | Governor / Vote / Timelock / Multisig / Snapshot |
| [D. Bridge](#d-bridge-5-recipes) | 5 | LayerZero / CCTP / Wormhole / Optimism / Hop |

Vocabulary reminder: a lane is a horizontal column, a node is a box placed in a lane, an edge is the arrow between nodes, and a phase is a chapter on the time axis.
See [primitives](/docs/en/cdl/primitives/README) for details.

## A. DeFi 10 recipes

Ten of the most common DeFi (Decentralized Finance) protocols.
The collection spans the minimal ERC-20 transfer through UniswapV3 concentrated liquidity and Lido stake.

### A-1. ERC-20 transfer

The minimal `transfer(to, amount)` of ERC-20 (Ethereum's fungible-token standard).
Two steps: Sender calls the contract, the contract updates Receiver's balance.

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

The point is to tween both balances together so the viewer sees "10 tokens moved".

### A-2. Permit (EIP-2612)

EIP-2612 (Ethereum's signature-based delegation, the gasless approval pattern) Permit flow.
The Owner signs off-chain and the Spender calls `permit()` on-chain.

```text
title: "EIP-2612 Permit"
type: sequence

actors:
  - Owner: { kind: actor, subtitle: "signature only (gas 0)" }
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

  - step: "Spender relays" 1.8s
    focus: ["EIP-712 typed-data", Spender]
    badge: "relayed"

  - step: "Spender executes on-chain" 1.8s
    focus: [Spender, "permit(...sig)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"
```

[preview:cookbook/permit]

The point is to split sign / relay / execute into three phases so the off-chain vs on-chain boundary appears on the time axis.
See [Permit pattern](/docs/en/cdl/patterns/permit) for full details.

### A-3. UniswapV2 swap

UniswapV2 (an AMM that uses `x * y = k` to set the price) swap.
Trader calls the router; the router swaps in the pool — two steps.

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

The point is to tween both pool reserves and the trader's output to make the `x * y = k` invariant visible.

### A-4. UniswapV3 swap (concentrated liquidity)

UniswapV3 (V2's successor that concentrates liquidity within a price range).
The relationship between tick (price granularity) and the active liquidity range is key.

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

The point is to tween `current_tick` so viewers see how V3, unlike V2, slides ticks dynamically.
The behavior where a swap stalls once liquidity exits the active tick range is easier to depict this way.

### A-5. Aave borrow / repay

Aave (the Ethereum lending protocol) borrow and repay shown in one diagram.
Deposit collateral, borrow USDC, then repay later.

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

The point is to track collateral and debt as separate states, then move them across three phases to show "supply → borrow → repay".

### A-6. Compound supply

Supply to Compound (the lending protocol next to Aave) and the cToken mint.
Compound is distinct in minting cTokens (interest-bearing tokens that accrue value).

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

The point is to depict the exchange rate (`1 cUSDC = 1000 / 49.5 USDC`) through two parallel tweens.
You can add a follow-up phase like `tween: usdc_in_vault: 1000 -> 1005` to show value accruing over time.

### A-7. Curve stable swap

Curve (a stablecoin-focused AMM that uses the stable-swap formula to keep slippage low) swap.
The structure of handling multiple stable tokens in one pool (USDT / USDC / DAI in 3pool) is its hallmark.

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

The point is that Curve's `A` (amplification coefficient) keeps slippage near `999.5 USDC`.
A UniswapV2 constant-product pool would only return roughly `990 USDC` under the same conditions.

### A-8. yEarn vault deposit

yEarn (a yield-aggregating protocol where depositing into a vault triggers an optimized strategy) vault deposit.
When a user deposits into the vault, the strategy allocates the funds into external protocols (Aave / Compound / etc.).

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

The point is to split deposit and auto-deploy into separate phases, making clear that the user-visible "single deposit" is actually two internal steps.

### A-9. MakerDAO CDP

The MakerDAO CDP (Collateralized Debt Position) used to mint DAI.
Lock ETH as collateral, then draw DAI in two steps.

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

The point is to show the collateralization ratio (`10 ETH x $3000 / 5000 DAI = 600%`) by animating collateral and debt in separate phases.

### A-10. Lido stake

Lido (the Ethereum liquid-staking protocol that mints stETH so users keep liquidity while staking) stake.
When a user deposits ETH, stETH is minted 1:1.

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

The point is that stETH is a rebase token (its balance grows over time), so you can extend the demo with `user_steth: 1 -> 1.05` in a later phase to make that property visible.

## B. NFT 5 recipes

Five recurring patterns around NFTs (Non-Fungible Tokens).
The set covers the ERC-721 basics through lazy mint, English auction, royalty, and soulbound semantics.

### B-1. ERC-721 safe-transfer

ERC-721 (Ethereum's NFT standard) `safeTransferFrom`.
The hallmark is checking whether the receiver is an EOA (Externally Owned Account, a regular wallet) or a contract.

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

The point is to surface the `onERC721Received` callback step that verifies whether the receiver is a contract.
An EOA recipient skips the callback; a contract recipient requires it.

### B-2. Lazy mint (signature-based)

Lazy mint (a pattern that defers the actual mint to purchase time, widely used in OpenSea Seaport-style systems).
The Creator signs in advance and Buyer triggers the mint on claim.

```text
title: "Lazy mint (signature-based)"
type: sequence

actors:
  - Creator: { kind: actor, subtitle: "signature only (gas 0)" }
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
  - step: "Creator builds the voucher" 1.2s
    focus: [Creator, "Voucher"]
    badge: "signed"

  - step: "Buyer obtains the voucher" 1.2s
    focus: ["Voucher", Buyer]
    badge: "received"

  - step: "Buyer redeems" 1.8s
    focus: [Buyer, "redeem()", "tokenId 42"]
    tween:
      minted: 0 -> 1
    badge: "minted"
```

[preview:cookbook/lazy-mint]

The point is to put the Creator's signing step and the Buyer's redeem step into separate phases to make clear that the Buyer pays the mint gas.

### B-3. Auction (English bid loop)

The bid loop of an English Auction (an ascending-price auction where the highest bid wins).
Three bidders update the leading bid in sequence.

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
  - step: "Bidder 1 bids 1 ETH" 1.0s
    focus: ["Bidder 1", "Auction.bid()", "highestBid"]
    tween:
      highest: 0 -> 1
    set:
      leader: "Bidder 1"
    badge: "1 ETH"

  - step: "Bidder 2 bids 1.5 ETH" 1.0s
    focus: ["Bidder 2", "Auction.bid()", "highestBid"]
    tween:
      highest: 1 -> 1.5
    set:
      leader: "Bidder 2"
    badge: "1.5 ETH"

  - step: "Bidder 3 bids 2 ETH" 1.0s
    focus: ["Bidder 3", "Auction.bid()", "highestBid"]
    tween:
      highest: 1.5 -> 2
    set:
      leader: "Bidder 3"
    badge: "2 ETH (winning)"
```

[preview:cookbook/english-auction]

The point is to tween `highest` while switching `leader` with set so the viewer sees the staircase that signals an auction in progress.

### B-4. Royalty (EIP-2981)

EIP-2981 (the on-chain NFT royalty standard) split.
On a secondary sale, the contract splits proceeds between the royalty receiver and the seller.

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

The point is to tween the two outputs (royalty receiver and seller) in parallel to show "10 ETH split into 0.5 + 9.5" in one diagram.

### B-5. Soulbound (non-transferable)

A soulbound NFT (a non-transferable NFT, SBT, EIP-5114 family) refusing a transfer.
The design where a normal `transferFrom` call reverts is the focus.

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

The point is to use a state diagram (`type: state`) to draw the self-loop on `Bound` that always reverts.
Unlike vanilla ERC-721, the rejection of `transferFrom` is captured in a single image.

## C. DAO 5 recipes

Five governance patterns around DAOs (Decentralized Autonomous Organizations).
Includes Governor, Vote, Timelock, Multisig, and Snapshot.

### C-1. Governor propose

The OpenZeppelin Governor (a canonical DAO governance contract) propose flow.
Calling `propose()` issues a proposal ID.

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

The point is to use `set` to mark the post-propose state as `Pending` (the grace period before voting begins).

### C-2. Vote (For / Against / Abstain)

The three vote options of `castVote()` (For / Against / Abstain) and the tally.
Three voters cast one by one.

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

The point is to map each option to its matching tone (`success` / `error` / `warning`) so the three buckets are visually distinct.

### C-3. Timelock queue / execute

A Timelock (a delay mechanism that runs a proposal only after a wait, mitigating governance attacks) flow.
The proposal queues, the delay elapses, then it executes.

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

The point is to attach a `guard:` time condition to the delay transition.
Until the guard is satisfied (two days elapse), execute is rejected — and that fact is captured in one diagram.

### C-4. Multisig (Gnosis Safe)

The Gnosis Safe (the canonical multisig wallet driven by a 3-of-5 style threshold) execTransaction.
Three owners collect signatures and execute.

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
  - step: "Owner 1 signs" 1.0s
    focus: ["Owner 1", "Safe.execTransaction()"]
    tween:
      sigs_collected: 0 -> 1
    badge: "1/3"

  - step: "Owner 2 signs" 1.0s
    focus: ["Owner 2", "Safe.execTransaction()"]
    tween:
      sigs_collected: 1 -> 2
    badge: "2/3"

  - step: "Owner 3 signs + execute" 1.2s
    focus: ["Owner 3", "Safe.execTransaction()", "Target contract"]
    tween:
      sigs_collected: 2 -> 3
    badge: "3/3 executed"
```

[preview:cookbook/multisig-safe]

The point is to tween `sigs_collected` up to the threshold so viewers see "execute fires the moment the threshold is hit".

### C-5. Snapshot off-chain vote

Snapshot (a gasless off-chain DAO voting tool that uses EIP-712 signatures) tally.
Unlike on-chain DAOs, the votes themselves live on IPFS.

```text
title: "Snapshot off-chain vote"
type: sequence

actors:
  - Voter: { kind: actor, subtitle: "signature only (gas 0)" }
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
  - step: "Voter signs" 1.2s
    focus: [Voter, "EIP-712 vote"]
    badge: "signed"

  - step: "Hub tallies" 1.5s
    focus: ["EIP-712 vote", "Snapshot Hub", "IPFS"]
    badge: "stored"

  - step: "result reflected" 1.0s
    focus: ["Snapshot Hub", "Result"]
    tween:
      votes_collected: 0 -> 1
    badge: "tallied"
```

[preview:cookbook/snapshot-vote]

The point is to highlight the trade-off: zero gas in exchange for going through IPFS and Hub off-chain infrastructure, shown by lanes and phases.

## D. Bridge 5 recipes

Five representative bridge (cross-blockchain asset or message movement) protocols.
LayerZero, CCTP, Wormhole, Optimism, and Hop.

### D-1. LayerZero V2 endpoint

LayerZero V2 (an omnichain messaging protocol that connects source and destination chains through Endpoints) send flow.
DVN (Decentralized Verifier Network) verifies messages.

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
  - step: "Source sends" 1.5s
    focus: ["Source OApp", "Source Endpoint", "DVN"]
    tween:
      src_sent: 0 -> 1
    badge: "sent"

  - step: "DVN verifies" 1.5s
    focus: ["DVN", "Dest Endpoint"]
    badge: "verified"

  - step: "Destination receives" 1.5s
    focus: ["Executor", "Dest Endpoint", "Dest OApp"]
    tween:
      dst_received: 0 -> 1
    badge: "received"
```

[preview:cookbook/layerzero-v2]

The point is to put DVN and Executor in separate lanes to show LayerZero V2's "verify and execute are different services" architecture.

### D-2. CCTP (Circle Cross-Chain Transfer)

CCTP (Circle's official USDC cross-chain protocol using burn-mint to guarantee 1:1) transfer.
Burn on the source chain and mint on the destination chain.

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

  - step: "Attestation" 1.2s
    focus: ["MessageTransmitter", "Attestation API"]
    badge: "attested"

  - step: "Dest mint" 1.5s
    focus: [User, "TokenMessenger (dst)"]
    tween:
      dst_balance: 0 -> 1000
    badge: "minted"
```

[preview:cookbook/cctp]

The point is to display the moment `src_balance` hits 0 and `dst_balance` becomes 1000 in separate phases so burn-mint atomicity is visible.

### D-3. Wormhole VAA

Wormhole (a multi-chain bridge spanning 19 chains where a Guardian network signs VAAs) flow.
Guardians observe source events and emit a VAA (Verifiable Action Approval).

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
  - step: "Source publishes" 1.2s
    focus: [User, "Wormhole Core (src)", "Guardian Network"]
    badge: "published"

  - step: "Guardians sign" 1.5s
    focus: ["Guardian Network", "VAA"]
    tween:
      guardian_sigs: 0 -> 13
    badge: "13/19"

  - step: "Dest claims" 1.2s
    focus: [User, "Wormhole Core (dst)"]
    badge: "released"
```

[preview:cookbook/wormhole-vaa]

The point is to tween Guardian's threshold (13/19) so viewers see "the VAA becomes valid the moment 13 signatures are collected".

### D-4. Optimism canonical bridge

Optimism (a representative Ethereum L2 Optimistic Rollup) canonical bridge.
Deposits (L1 → L2) are instant; withdrawals (L2 → L1) include a 7-day challenge period.

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
  - step: "L1 -> L2 deposit (instant)" 1.5s
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

The point is to surface the asymmetry between deposit (instant) and withdraw (7 days) across two phases.
Why Optimistic Rollups need the challenge period becomes intuitive once it appears on the time axis.

### D-5. Hop relay

Hop Protocol (a fast L2-to-L2 transfer design in which a Bonder provides instant liquidity) relay.
The Bonder releases tokens on the destination immediately and later settles with the source chain.

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
  - "Bonder" -> "Hop Bridge (dst)": "bondWithdrawal (instant)" (accent, dotted-flow)
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

  - step: "Bonder releases instantly" 1.2s
    focus: ["Bonder", "Hop Bridge (dst)", User]
    tween:
      user_received: 0 -> 998
    badge: "released"

  - step: "Source settle" 1.0s
    focus: ["Hop Bridge (src)", "Bonder"]
    badge: "settled"
```

[preview:cookbook/hop-relay]

The point is to capture the design where the Bonder releases first and settles later through phase ordering.
From the user's point of view the flow finishes in two phases, but the Bonder reclaims funds in a delayed third phase — that asymmetry comes through.

## See also

This page leads to four follow-ups.

- Get hands-on first ... [Quickstart](/docs/en/cdl/overview/quickstart) in five steps
- Look up the grammar ... [Text DSL Specification](/docs/en/cdl/text-dsl-spec)
- Migrate from mermaid ... [Mermaid Migration](/docs/en/cdl/overview/mermaid-migration)
- Have an LLM write DSL ... [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide)
