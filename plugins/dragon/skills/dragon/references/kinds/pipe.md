# pipe

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

One transaction through smart contracts: the calls between contracts, the token balances that move, the stored values that change, and what a revert rolls back. A swap, a deposit through a proxy, an aggregator route, an approval and transfer.
Balances are tanks drawn to scale per token. Every change stays provisional (hatched) until the outermost call returns, then turns final (green). Changes a `revert` rolls back are marked red.

Pick `architecture` instead when the explanation is about which contracts exist rather than one transaction's effects.

## Declarations (before the first step)

| Line | Meaning |
|---|---|
| `box <id> as <name>` | A party: a sender, a contract, a token contract or an account. The role comes from the lines, so it is not written |
| `hold <owner>: <amount> <token>, <amount> <token>` | Starting balances. Name a token by the shown name of its party (`box usdc as USDC`, then `hold alice: 100 USDC`). `ETH` needs no party |
| `hold <contract>: <name> <value>` | A stored value plate. Wrap names that read as amounts or contain `[` in `"` (`hold usdc: "allowance[alice][router]" 100`) |

## Lines in a step

| Line | Meaning |
|---|---|
| `<caller> -> <callee>: <text>` | Opens a call |
| `... [value: <amount> ETH]` | Sends ETH with the call. The only way to move ETH |
| `... [call: delegate]` | Runs the callee's code on the caller's values. Takes no `value` |
| `... [call: static]` | A read-only call. Nothing can change inside it |
| `... [fold]` | Folds the call's inner steps into one box the reader can open |
| `return <party>: <value>` | Closes the innermost open call. `<party>` is that call's callee |
| `revert <party>: <reason>` | Fails the innermost open call and rolls back only the changes inside it |
| `move <token party>: <amount> <from> -> <to>` | Moves a balance through the token's pipe |
| `write <party>: <name> <value>` | Rewrites a value plate |
| `check <party>: <left> <op> <right>` | A check with `>=`, `<=`, `==`, `!=`, `>`, `<`. Numbers are compared for you. Add `[fail]` to make a check on other values fail |
| `emit <party>: <Name>(<arg>, ...)` | An event |
| `calc <party>: <in> -> <out>` | A conversion, such as a price calculation |

## Rules the parser checks

- Every call is closed by `return` or `revert`, innermost first, and `return`/`revert` name the innermost callee.
- An owner needs a tank before a `move` touches it. Declare `hold <owner>: 0 <token>`.
- An owner cannot send more than it holds.
- `move` starts with a token party: a party whose shown name is a unit on a `hold` line.
- Inside a `[call: static]` call, no balance, value, event or ETH can change.
- `note`, `act`, `strip`, `set` and `color` do not exist in pipe.

## How to write it well

- One step per call or effect reads best. Put a `move` with its `emit`, or a call with its `return`, in one step when they explain one thing.
- Call the token contract before moving its balance (`router -> usdc: transferFrom`, then `move usdc: ...`).
- Show the user's limit with a `check` (`check pool: 0.05 WETH >= 0.04 WETH`).
- Fold long inner call chains with `[fold]` so the outer story stays short.

## Example

```dragon
pipe Pay a shop with an allowance

box alice as Alice
box shop as Shop
box usdc as USDC

hold alice: 500 USDC
hold shop: 0 USDC
hold usdc: "allowance[alice][shop]" 100
hold shop: "paid[alice]" 0

step Alice asks the shop to take payment
  say Alice calls the shop to pay 80 USDC for her order.
  alice -> shop: pay 80 USDC

step The shop pulls the USDC
  say The shop asks USDC to move 80 from Alice, using the allowance she gave earlier.
  shop -> usdc: transferFrom alice 80
  check usdc: 100 >= 80

step The balance moves
  say USDC moves 80 from Alice to the shop and lowers the allowance by the same amount.
  move usdc: 80 alice -> shop
  write usdc: "allowance[alice][shop]" 20
  emit usdc: Transfer(alice, shop, 80)
  return usdc: true

step The payment is final
  say The shop records the payment and returns. Every change becomes final here.
  write shop: "paid[alice]" 80
  emit shop: Paid(alice, 80)
  return shop: true
```
