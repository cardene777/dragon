# solidity preset

The `solidity` preset expresses Solidity smart contract interactions in a single YAML.
It introduces 6 dedicated NodeKinds for EOA / contract / storage / event and auto-optimizes sort order.

## When to use

- Visualize ERC-20 / ERC-721 / ERC-1155 token transfer flows
- DeFi protocol interactions (Uniswap swap / Aave borrow / Compound supply, etc.)
- Multisig wallet (Gnosis Safe) execution flows
- Proxy pattern (TransparentUpgradeable / Diamond) delegatecall paths
- Event emit log sequences

## 6 dedicated NodeKinds

| kind | Use |
|---|---|
| `eoa` | Externally Owned Account (human / wallet) |
| `contract` | Smart contract |
| `multisig` | Multisig wallet (Gnosis Safe, etc.) |
| `proxy` | Proxy contract (delegatecall) |
| `library` | Solidity library (SafeMath / Address, etc.) |
| `interface` | Interface (IERC20 / IERC721, etc.) |

Combined with existing `storage` / `event`, the 8 kinds cover the full Solidity domain.

## Auto lane sort

Regardless of declaration order, lanes are sorted by kind:

1. **EOA / multisig** ... left (msg.sender)
2. **contract / proxy / library / interface** ... center (call target)
3. **storage** ... right (state change)
4. **event** ... rightmost (emit log)

This realizes the natural Solidity reading flow: "call flows left to right, storage updates in the middle, event fires on the right" — author declares actors in any order and gets the right layout automatically.

## Minimal example (ERC-20 transfer)

::: tabs

@@@ humans 👤 For humans

```text
title: "ERC-20 transfer"
type: solidity

actors:
  - Alice: { kind: eoa, subtitle: "sender" }
  - Bob: { kind: eoa, subtitle: "recipient" }
  - Token: { kind: contract, subtitle: "ERC-20" }
  - balances: { kind: storage, rows: ["Alice: {alice_bal}", "Bob: {bob_bal}"] }
  - "Transfer": { kind: event, subtitle: "from, to, amount" }

states:
  alice_bal: 100
  bob_bal: 0

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> balances: "balances[Alice] -= 10" (info)
  - Token -> balances: "balances[Bob] += 10" (info)
  - Token -> "Transfer": "emit" (success)

animation:
  - step: "call" 1.2s
    focus: [Alice, Token]
    badge: "msg.sender = Alice"
  - step: "storage write" 1.5s
    focus: [Token, balances]
    tween:
      alice_bal: 100 -> 90
      bob_bal: 0 -> 10
    badge: "balances updated"
  - step: "emit" 0.8s
    focus: [Token, "Transfer"]
    badge: "Transfer(Alice, Bob, 10)"
```

@@@ llm 🤖 For LLM

```yaml
preset: solidity
intent: "ERC-20 transfer with storage update + event emit"
actors:
  - { id: alice, kind: eoa, role: msg.sender }
  - { id: bob, kind: eoa, role: recipient }
  - { id: token, kind: contract, role: ERC-20 }
  - { id: balances, kind: storage, role: state, bindings: [alice_bal, bob_bal] }
  - { id: Transfer, kind: event, signature: "Transfer(address,address,uint256)" }
flow:
  - { from: alice, to: token, fn: "transfer(Bob, 10)" }
  - { from: token, to: balances, op: write, expr: "balances[Alice] -= 10" }
  - { from: token, to: balances, op: write, expr: "balances[Bob] += 10" }
  - { from: token, to: Transfer, op: emit, tone: success }
common_patterns:
  - ERC-20 transfer / transferFrom
  - ERC-721 safeTransferFrom
  - DeFi swap (token in -> token out)
  - Multisig execTransaction (3-of-5)
  - Proxy delegatecall
common_mistakes:
  - "Forgetting msg.sender in flow's `from`"
  - "Combining storage updates into one step (changes become invisible)"
  - "Placing Transfer event in center lane (breaks visual flow)"
```

:::

[preview:animation/mixed-tween-set]

## Key patterns

### 1. ERC-20 / ERC-721 transfer

See basic example above.

### 2. DeFi swap (UniswapV2)

```text
actors:
  - User: { kind: eoa }
  - Router: { kind: contract, subtitle: "UniV2Router" }
  - Pair: { kind: contract, subtitle: "Pair WETH/USDC" }
  - reserves: { kind: storage, rows: ["WETH: {weth_r}", "USDC: {usdc_r}"] }
  - "Swap": { kind: event }

flow:
  - User -> Router: "swapExactTokensForTokens(amountIn, ...)"
  - Router -> Pair: "swap(amountOutMin, to)"
  - Pair -> reserves: "reserves update"
  - Pair -> "Swap": "emit Swap" (success)
```

### 3. Multisig (Gnosis Safe 3-of-5)

```text
actors:
  - Owner1: { kind: eoa }
  - Owner2: { kind: eoa }
  - Owner3: { kind: eoa }
  - Safe: { kind: multisig, subtitle: "3-of-5 threshold" }
  - Target: { kind: contract }

flow:
  - Owner1 -> Safe: "approveHash(txHash)"
  - Owner2 -> Safe: "approveHash(txHash)"
  - Owner3 -> Safe: "execTransaction(...)" (success)
  - Safe -> Target: "delegatecall"
```

### 4. Proxy pattern (TransparentUpgradeable)

```text
actors:
  - User: { kind: eoa }
  - Proxy: { kind: proxy }
  - Impl: { kind: contract, subtitle: "Implementation V1" }
  - storage: { kind: storage }

flow:
  - User -> Proxy: "call(data)"
  - Proxy -> Impl: "delegatecall" (info)
  - Impl -> storage: "SSTORE (proxy's storage)" (info)
```

## Design rationale

### Why a dedicated Solidity preset

While `sequence` can render contract interactions, the EOA / contract / storage / event reading order is context-dependent, forcing authors to think about lane placement every time.
`solidity` enforces "left (sender) → center (contract) → right (storage / event)" via kind-based sort. Authors declare actors in any order and get the optimal Solidity layout.

### Why 6 new NodeKinds

`contract` / `eoa` / `multisig` / `proxy` / `library` / `interface` are **semantically distinct** primitives in Solidity. Reusing existing `actor` / `function` loses the visual (color / icon) distinction between contract and EOA. Dedicated kinds let the render layer provide context-appropriate visualization.

## Related

- [sequence preset](/docs/en/cdl/presets/sequence) ... base sequence structure
- [storage primitive](/docs/en/cdl/primitives/state) ... rows + state + tween for storage updates
- [Cookbook DeFi 10 examples](/docs/en/cdl/overview/cookbook#defi)
- [Cookbook NFT 5 examples](/docs/en/cdl/overview/cookbook#nft)
