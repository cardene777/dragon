# cards

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Who holds which card, and how much: balances held as notes that are spent and replaced, tickets or gift cards that change hands, books a club lends out, permits that are granted and taken back.
Each owner is a column, every card sits as a copy in each column it belongs to, and the steps make, delete, move and refuse cards.

Pick `lineup` instead when items wait in lanes and move one by one without owners or amounts, `pipe` when the question is the calls and balances inside one transaction, and `chart` when only the sizes are compared.

## Lines

| Line | Meaning |
|---|---|
| `cards <title>` | The first line. An owner card diagram |
| `box <id> as <name> [note: ..., mark: <word>]` | An owner column, written before the first `step`. Columns sit from left to right in the order written. `note` is the caption next to the name and `mark` is the mark word that column shows. A box takes no `color`, `icon` or `link` |
| `item <id> as <name> in <column>, <column> [amount: ..., total: none, mark: <column>]` | A card. Every column in `in` gets its own copy, stacked from the top in the order made. Before the first `step` the card is there from the start; inside a step it is made in that step |
| `item <id> in <column>, <column>` | Inside a step, moves an existing card to those columns. The copies in the other columns go away. A move takes no name and no attributes |
| `delete <card>` | Inside a step, strikes a card through. The card stays in place, struck through, in this and later steps, and leaves the column totals |
| `refuse <card or column>: <reason>` | Inside a step, shows a refused panel with the reason and changes nothing. The panel goes under the cards of the column that called the card, the card's first column, or the refused column |
| `<column> -> <card>: <name>` | Inside a step, a call from the column head to the card. The card's edge lights up in the line color, rose when the card or column is refused in that step |

## How to write it well

- Write an amount as a number and a unit (`1000 USDC`, `1 vol.`, `500 yen`). Totals add amounts unit by unit, so keep one spelling per unit. Wrap an amount with `,` in `"`, as in `[amount: "3,000 yen"]`.
- `[total: none]` shows a card's amount but leaves it out of the column total. Use it for permits, allowances and limits that are not holdings.
- `[mark: <column>]` on a card shows that column's `mark` word on the copy in that column only. Repeat it for each column (`[mark: alice, mark: usdc]`); the column must have a `mark` word.
- Put the call line first in a step, then the change: `alice -> n1: Send 100`, then `delete n1` and the new `item` lines. The call lights the card it reaches.
- Use `refuse` for an attempt that changes nothing, such as a balance that is too small or an account that does not exist. Write no other change for that card in the same step.
- A column with no cards in a step shows a dashed empty slot, so a column that will receive cards later can be declared from the start.
- A line takes no `tag`, `carry` or `side`, and `group`, `strip`, `act`, `note` and `set` lines are refused. In other diagram kinds `refuse` and `cards` still read as ordinary box ids.

## Example

```dragon
cards Send 100 USDC with notes

box alice as Alice [note: Sender]
box bob as Bob [note: Receiver]
box usdc as USDC ledger [mark: Signed]

item n1 as Note #1 in alice, usdc [amount: 1000 USDC, mark: usdc]
item n2 as Note #2 in bob, usdc [amount: 200 USDC, mark: usdc]

step Alice sends 100 to Bob
  say Note #1 is spent and replaced by two new notes.
  alice -> n1: Send 100
  delete n1
  item n3 as Note #3 in alice, usdc [amount: 900 USDC, mark: usdc]
  item n4 as Note #4 in bob, usdc [amount: 100 USDC, mark: usdc]

step Bob tries to send 500
  say His note is too small, so nothing changes.
  bob -> n2: Send 500
  refuse n2: Not enough balance
```
