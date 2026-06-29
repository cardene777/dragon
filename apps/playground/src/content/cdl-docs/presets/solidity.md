# solidity preset

`solidity` は Solidity smart contract の interaction を 1 つの YAML で表現するための専用 preset です。
EOA (externally owned account) / contract / storage / event を 6 つの専用 NodeKind で扱い、 sort 順を自動最適化します。

## 用途

- ERC-20 / ERC-721 / ERC-1155 等の token transfer flow を視覚化
- DeFi protocol の interaction (Uniswap swap / Aave borrow / Compound supply 等)
- Multisig wallet (Gnosis Safe) の execution flow
- Proxy pattern (TransparentUpgradeable / Diamond) の delegatecall 経路
- Event emit log の sequence

## 専用 NodeKind 6 種

| kind | 用途 |
|---|---|
| `eoa` | Externally Owned Account (人 / wallet) |
| `contract` | Smart contract |
| `multisig` | Multisig wallet (Gnosis Safe 等) |
| `proxy` | Proxy contract (delegatecall) |
| `library` | Solidity library (SafeMath / Address 等) |
| `interface` | Interface (IERC20 / IERC721 等) |

`storage` / `event` (既存) と組み合わせて 8 種で Solidity 全領域を表現。

## 自動 layout 順

actors の宣言順に関係なく、 lane は kind 別に sort されます:

1. **EOA / multisig** ... 左 (msg.sender)
2. **contract / proxy / library / interface** ... 中央 (call target)
3. **storage** ... 右 (state change)
4. **event** ... 最右 (emit log)

これにより「左から右に call が流れ、 storage で値が変わり、 event で発火する」 という Solidity 文脈の自然な視線移動が自動で実現します。

## 最小例 (ERC-20 transfer)

::: tabs

@@@ humans 👤 For humans

```text
title: "ERC-20 transfer"
type: solidity

actors:
  - Alice: { kind: eoa, subtitle: "送り手" }
  - Bob: { kind: eoa, subtitle: "受け手" }
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
    badge: "balances 更新"
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
states:
  - { id: alice_bal, initial: 100 }
  - { id: bob_bal, initial: 0 }
phases:
  - { id: call, focus: [alice, token] }
  - { id: storage_write, focus: [token, balances], tweens: [alice_bal: 100->90, bob_bal: 0->10] }
  - { id: emit, focus: [token, Transfer] }
common_patterns:
  - ERC-20 transfer / transferFrom
  - ERC-721 safeTransferFrom
  - DeFi swap (token in -> token out)
  - Multisig execTransaction (3-of-5)
  - Proxy delegatecall
common_mistakes:
  - "msg.sender を flow の from に書き忘れる"
  - "storage 更新を 1 step にまとめてしまい変化が見えない"
  - "Transfer event を最右 lane でなく中央に置くと視線移動が崩れる"
```

:::

[preview:animation/mixed-tween-set]

## 主要パターン

### 1. ERC-20 / ERC-721 transfer

上記基本例。 `actors` に EOA + token contract + balances storage + Transfer event を並べ、 `flow` で sender -> token -> storage / event の順に呼び出し。

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

## 設計意図

### なぜ Solidity 専用 preset を独立させたか

`sequence` preset でも contract interaction は描けるが、 EOA / contract / storage / event の **視線移動順序が文脈依存** で、 author が毎回 lane 配置を考える必要があった。
`solidity` preset は kind 別 sort で「左 (sender) → 中央 (contract) → 右 (storage / event)」 を強制し、 author は actors を順不同で宣言するだけで Solidity 文脈に最適な layout が得られます。

### なぜ NodeKind を 6 種追加したか

`contract` / `eoa` / `multisig` / `proxy` / `library` / `interface` は Solidity 文脈で **意味的に区別すべき** primitive。 既存 `actor` / `function` で代替すると、 視覚 (色 / icon) で「これは contract か EOA か」 が判別不能になる。 専用 kind を作ることで render layer が文脈に応じた表現を提供できる。

## 関連

- [sequence preset](/docs/cdl/presets/sequence) ... base となる sequence 構造
- [storage primitive](/docs/cdl/primitives/state) ... rows + state + tween で storage 更新表現
- [Cookbook DeFi 10 例](/docs/cdl/overview/cookbook#defi) ... ERC-20 / Uniswap / Aave / Compound / Curve / yEarn / MakerDAO / Lido の実例
- [Cookbook NFT 5 例](/docs/cdl/overview/cookbook#nft) ... ERC-721 / Lazy mint / Auction / Royalty / Soulbound
