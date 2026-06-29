import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * Catalog - Cookbook ... cookbook.md の 25 例 (DeFi 10 / NFT 5 / DAO 5 / Bridge 5) を
 * v0.5 Text DSL で実装した demo。 cookbook entry 1 件 = この catalog の 1 thumbnail = 1 export。
 *
 * 各 demo の id は cookbook.md の `[preview:cookbook/<slug>]` と一致させるため、
 * textDslToDiagram() の戻り値の `id` を slug で上書きする。
 *
 * 設計指針:
 * - DSL 本体は cookbook.md の humans tab に貼った YAML をそのまま流用 (1 SSOT)
 * - title は cookbook.md 表記をそのまま採用 (slugify 後の自動 id は使わない、 必ず withId で上書き)
 */

function withId(slug: string, diagram: CdlDiagram): CdlDiagram {
  return { ...diagram, id: slug };
}

// ─────────────────────────────────────────────────────────────
// A. DeFi 10 例
// ─────────────────────────────────────────────────────────────

/** A-1. ERC-20 transfer */
export const erc20Transfer = withId(
  "erc20-transfer",
  textDslToDiagram(`
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
`),
);

/** A-2. Permit (EIP-2612) */
export const permit = withId(
  "permit",
  textDslToDiagram(`
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
`),
);

/** A-3. UniswapV2 swap */
export const uniswapV2Swap = withId(
  "uniswap-v2-swap",
  textDslToDiagram(`
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
`),
);

/** A-4. UniswapV3 swap (concentrated liquidity) */
export const uniswapV3Swap = withId(
  "uniswap-v3-swap",
  textDslToDiagram(`
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
`),
);

/** A-5. Aave borrow / repay */
export const aaveBorrow = withId(
  "aave-borrow",
  textDslToDiagram(`
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
`),
);

/** A-6. Compound supply */
export const compoundSupply = withId(
  "compound-supply",
  textDslToDiagram(`
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
`),
);

/** A-7. Curve stable swap */
export const curveSwap = withId(
  "curve-swap",
  textDslToDiagram(`
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
`),
);

/** A-8. yEarn vault deposit */
export const yearnVault = withId(
  "yearn-vault",
  textDslToDiagram(`
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
`),
);

/** A-9. MakerDAO CDP */
export const makerCdp = withId(
  "maker-cdp",
  textDslToDiagram(`
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
`),
);

/** A-10. Lido stake */
export const lidoStake = withId(
  "lido-stake",
  textDslToDiagram(`
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
`),
);

// ─────────────────────────────────────────────────────────────
// B. NFT 5 例
// ─────────────────────────────────────────────────────────────

/** B-1. ERC-721 safe-transfer */
export const erc721Transfer = withId(
  "erc721-transfer",
  textDslToDiagram(`
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
`),
);

/** B-2. Lazy mint (signature-based) */
export const lazyMint = withId(
  "lazy-mint",
  textDslToDiagram(`
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
`),
);

/** B-3. Auction (English bid loop) */
export const englishAuction = withId(
  "english-auction",
  textDslToDiagram(`
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
`),
);

/** B-4. Royalty (EIP-2981) */
export const royalty2981 = withId(
  "royalty-2981",
  textDslToDiagram(`
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
`),
);

/** B-5. Soulbound (non-transferable)
 * NOTE ... cdl FSM は self-loop 未対応のため、 transferFrom → revert を中間 "TransferAttempt" state で表現。
 */
export const soulbound = withId(
  "soulbound",
  textDslToDiagram(`
title: "Soulbound NFT"
type: state

actors:
  - "Issued": { kind: state, initial: true }
  - "Bound": { kind: state }
  - "TransferAttempt": { kind: state }
  - "Revoked": { kind: state, final: true }

flow:
  - "Issued" -> "Bound": "first claim (success)"
  - "Bound" -> "TransferAttempt": "transferFrom → revert" { guard: "always revert" }
  - "TransferAttempt" -> "Bound": "stay bound" (warning)
  - "Bound" -> "Revoked": "issuer revokes" (warning)
`),
);

// ─────────────────────────────────────────────────────────────
// C. DAO 5 例
// ─────────────────────────────────────────────────────────────

/** C-1. Governor propose */
export const governorPropose = withId(
  "governor-propose",
  textDslToDiagram(`
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
`),
);

/** C-2. Vote (For / Against / Abstain) */
export const govVote = withId(
  "gov-vote",
  textDslToDiagram(`
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
`),
);

/** C-3. Timelock queue / execute */
export const timelock = withId(
  "timelock",
  textDslToDiagram(`
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
`),
);

/** C-4. Multisig (Gnosis Safe) */
export const multisigSafe = withId(
  "multisig-safe",
  textDslToDiagram(`
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
`),
);

/** C-5. Snapshot off-chain vote */
export const snapshotVote = withId(
  "snapshot-vote",
  textDslToDiagram(`
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
`),
);

// ─────────────────────────────────────────────────────────────
// D. Bridge 5 例
// ─────────────────────────────────────────────────────────────

/** D-1. LayerZero V2 endpoint */
export const layerzeroV2 = withId(
  "layerzero-v2",
  textDslToDiagram(`
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
`),
);

/** D-2. CCTP (Circle Cross-Chain Transfer) */
export const cctp = withId(
  "cctp",
  textDslToDiagram(`
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
`),
);

/** D-3. Wormhole VAA */
export const wormholeVaa = withId(
  "wormhole-vaa",
  textDslToDiagram(`
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
`),
);

/** D-4. Optimism canonical bridge */
export const optimismBridge = withId(
  "optimism-bridge",
  textDslToDiagram(`
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
`),
);

/** D-5. Hop relay */
export const hopRelay = withId(
  "hop-relay",
  textDslToDiagram(`
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
`),
);
