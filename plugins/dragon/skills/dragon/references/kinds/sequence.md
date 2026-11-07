# sequence

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Messages between parties in time order: an HTTP request and its reply, an API call chain, a sign-in or OAuth flow, a protocol handshake, a webhook.
Each box gets a lifeline that runs down the page. Each step draws its lines on a lower row, so time reads top to bottom.

Pick `architecture` instead when the point is where the parts live, and `state` when the point is the states of one thing.

## Lines

| Line | Meaning |
|---|---|
| `box <id> as <name> [note: ..., color: ..., icon: ...]` | A party. Boxes appear left to right in the order declared |
| `<from> -> <to>: <label>` | A message. Several lines in one step run in the order written |
| `<id> -> <id>: <label>` | The same id on both ends draws a line back to the same party |
| `act <id>: <action>` | Work done inside a party, with no message |
| `note <id>: <text>` | Rewrites the caption under a party from this step on |
| `code <command>` | The request or call shown for the step |
| `strip <title>: <field>, ...` and `set <field>: <value>` | Values that a party holds and that change over the steps |

## How to write it well

- Declare parties in the order the first request travels, left to right: user, client, server, database.
- Put a request and its reply in one step when the reply is the point of the step. Put them in two steps when something happens in between.
- Put reply labels under the line with `[side: below]` so they read apart from the requests.
- Use `act` for checks and computations that matter to the reader (`act app: compare the state`).
- Use a strip for values that travel or change (tokens, codes, state), and `set` them in the step where they change.
- Use `[tag: ...]` to show what rides on a message (`[tag: code]`), and `[carry: coin]` when money moves.
- Up to about 6 parties stay readable. Merge minor parties or split the diagram.

## Example

```dragon
sequence Check a payment before shipping

box shop as Shop [note: sells the goods, color: blue, icon: cart]
box pay as Payment service [note: holds the card details, color: violet, icon: card]
box bank as Card issuer [note: approves or declines, color: slate, icon: shield]

strip Payment: Amount, Status

step Ask for the charge
  say The shop asks the payment service to charge the card for the order.
  code POST /charges amount=4980
  shop -> pay: charge 4,980 yen [tag: #42]
  set Amount: 4,980 yen
  set Status: pending

step The issuer approves
  say The payment service asks the card issuer, which checks the balance and approves.
  pay -> bank: authorize
  act bank: check the balance
  bank -> pay: approved [side: below]

step Ship the order
  say The shop receives the result and starts shipping only after the charge succeeds.
  pay -> shop: 200 charged [side: below, carry: coin]
  set Status: charged
  note shop: ready to ship
```
