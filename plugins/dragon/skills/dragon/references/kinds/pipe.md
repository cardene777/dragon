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
| `box <id> as <name> [note: <text>]` | The small text under a token box's name, in place of `balanceOf` (`box usdc as USDC [note: Holding]`). Use it when the asset is not an ERC-20 token, such as a Daml `Holding`. Only a token party takes it |
| `hold <owner>: <amount> <token>, <amount> <token>` | Starting balances. Name a token by the shown name of its party (`box usdc as USDC`, then `hold alice: 100 USDC`). `ETH` needs no party |
| `hold <owner>: <count> #<id> <token>` | A starting balance of an NFT or ERC-1155 token ID. Without a count it is one (`hold alice: #1 ART`, `hold alice: 5 #1 ITEMS`). Each ID gets its own tank, shown as `ART #1` |
| `hold <contract>: <name> <value>` | A stored value plate. Wrap names that read as amounts, start with `#` or contain `[` in `"` (`hold usdc: "allowance[alice][router]" 100`) |
| `layout <shape>` | How to place the token boxes and tanks, at most one line before the first step. `top` and `bottom` put the token boxes above or below the row of people, `ledger`, `mesh` and `bus` set the tanks in one row per token, and `auto` tries `top` and `bottom` and the box orders (up to 4 token boxes) and picks the one with the fewest crossing lines. Without it the diagram keeps the current placement |
| `route <person> -> <contract>` | A call path that `layout top` and `layout bottom` keep open, one pair per line after the `layout` line (`route bob -> usdc`). Both names must be declared parties. Without route lines the placement keeps open only the calls from people that appear in the steps, so list every pair a set of diagrams uses to keep the boxes and tanks in the same places across them |

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
| `move <token party>: <amount> <from> -> <to>` | Moves a balance through the token's pipe (`move usdc: 100 alice -> bob`) |
| `move <token party>: <count> #<id> <from> -> <to>` | Moves an NFT or ERC-1155 token ID through its own pipe. Without a count it is one (`move art: #1 alice -> bob`, `move items: 2 #1 alice -> bob`) |
| `mint <token party>: <amount> -> <to>` | Mints: only the receiver's tank fills (`mint usdc: 100 -> alice`, `mint art: #3 -> alice`). No zero address is drawn |
| `burn <token party>: <amount> <holder>` | Burns: only the holder's tank drains (`burn usdc: 100 alice`, `burn art: #3 alice`). No zero address is drawn |
| `write <party>: <name> <value>` | Rewrites a value plate |
| `check <party>: <left> <op> <right>` | A check with `>=`, `<=`, `==`, `!=`, `>`, `<`. Numbers are compared for you. Add `[fail]` to make a check on other values fail |
| `emit <party>: <Name>(<arg>, ...)` | An event |
| `calc <party>: <in> -> <out>` | A conversion, such as a price calculation |
| `gist <key point>` | A key point shown under the step's arrows. Pipe only. At most one per step |

## Rules the parser checks

- Every call is closed by `return` or `revert`, innermost first, and `return`/`revert` name the innermost callee.
- An owner needs a tank before a `move`, `mint` or `burn` touches it. Declare `hold <owner>: 0 <token>`, or `hold <owner>: 0 #<id> <token>` for a token ID.
- An owner cannot send or burn more than it holds.
- `move`, `mint` and `burn` start with a token party: a party whose shown name is a unit on a `hold` line.
- `[note: <text>]` goes only on a token party's `box` line. A `note` on a person or a contract is refused.
- A `#` must be followed by a token ID written as digits. `move art: # alice -> bob` is refused.
- Write a mint or burn as `mint` or `burn`, not as a move from or to a zero address party.
- Inside a `[call: static]` call, no balance, value, event or ETH can change.
- `note`, `act`, `strip`, `set` and `color` do not exist in pipe.

## How to write it well

- One step per call or effect reads best. Put a `move` with its `emit`, or a call with its `return`, in one step when they explain one thing.
- Call the token contract before moving its balance (`router -> usdc: transferFrom`, then `move usdc: ...`).
- Show the user's limit with a `check` (`check pool: 0.05 WETH >= 0.04 WETH`).
- Fold long inner call chains with `[fold]` so the outer story stays short.
- The player does not show the `say` body under a pipe diagram. Put a point the reader must not miss in `gist`, such as the step where every change becomes final.

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
  gist Every change becomes final when the outermost call returns
  write shop: "paid[alice]" 80
  emit shop: Paid(alice, 80)
  return shop: true
```
