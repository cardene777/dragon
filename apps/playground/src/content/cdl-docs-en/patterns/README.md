# How to choose a pattern

This page is a hub for the 18 patterns that show up most often across blockchain and Web2.
When you want to express one of these patterns in cdl, find the pattern here first and follow the link to its guide.

Every pattern guide follows the same four-part structure: prerequisites, steps, verification, and design intent.
Each guide also contrasts the cdl version with its mermaid equivalent and ships a complete, ready-to-run code sample.

## Choose a pattern by use case

If you already know what you want to build, work backward from the table below.

| What you want to do | Recommended pattern |
|---|---|
| Sign off-chain and use the signature on-chain | [Permit](/docs/en/cdl/patterns/permit) |
| Move assets from one chain and use them on another | [Bridge](/docs/en/cdl/patterns/bridge) / CCTP |
| Express an automated market maker (AMM) | [DEX Swap](/docs/en/cdl/patterns/dex-swap) |
| Call multiple functions in a single transaction | [Multicall](/docs/en/cdl/patterns/multicall) |
| Approve an ERC-20 and then transferFrom it | [Approve -> Pull](/docs/en/cdl/patterns/approve-pull) |
| Stake and receive rewards | Staking (in the Cookbook) |
| Express collateral liquidation | Liquidation (in the Cookbook) |

## Pattern catalog

The patterns are split into 12 blockchain-domain patterns and 6 general-purpose patterns.
Patterns that have a dedicated page link straight to the guide.
For patterns marked as in the Cookbook, see the matching example in the [Cookbook](/docs/en/cdl/overview/cookbook).

### Blockchain domain (12 patterns)

| Pattern | What it expresses | Guide |
|---|---|---|
| Permit (EIP-2612) | Sign off-chain and grant allowance without spending gas | [permit.md](/docs/en/cdl/patterns/permit) |
| Bridge (Lock-Mint) | Lock an asset on the source chain and mint the same amount on the destination chain | [bridge.md](/docs/en/cdl/patterns/bridge) |
| DEX Swap (AMM) | Price a swap with constant product (x*y=k) | [dex-swap.md](/docs/en/cdl/patterns/dex-swap) |
| Multicall (through a Router) | Call multiple targets through a Router in one tx | [multicall.md](/docs/en/cdl/patterns/multicall) |
| Approve -> Pull (2 step) | Approve an ERC-20 and pull it later with transferFrom | [approve-pull.md](/docs/en/cdl/patterns/approve-pull) |
| Proxy + Implementation | The delegatecall path of an upgradeable proxy | Cookbook example 5 |
| Lending (Supply / Borrow) | The path from collateral supply to borrowing | In the Cookbook |
| Liquidation | Liquidation triggered by undercollateralization and its incentive | In the Cookbook |
| Staking | The two steps of stake and reward claim | In the Cookbook |
| CCTP (USDC Burn-Mint) | The USDC-specific path that burns on the source chain and mints on the destination chain | In the Cookbook |
| NFT Mint | Mint an NFT and transfer ownership | In the Cookbook |
| Hook callback | The callback pattern that invokes a hook on the receive side | In the Cookbook |

### General-purpose patterns (6 types)

| Pattern | What it expresses | Guide |
|---|---|---|
| Emit Event | Notify the outside world with an event after a function runs | In the Cookbook |
| Call -> Read -> Write | The read and write flow inside a function | In the Cookbook |
| Direct | Connect two adjacent nodes with a single edge | In the Cookbook |
| Passthrough | Pass through an intermediate node to express the end-to-end flow | In the Cookbook |
| Oracle | Fetch a price feed from an external oracle | In the Cookbook |
| Meta-Tx | A meta transaction where a third party pays the gas | In the Cookbook |

To see what all 18 patterns look like side by side, open the [catalog page](/catalog/patterns).

## Related docs

- The [Cookbook](/docs/en/cdl/overview/cookbook) walks you through 9 complete examples.
- The [Catalog page](/catalog/patterns) lets you scan the visuals of all 18 patterns.
