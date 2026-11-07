# try

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

A model the reader drives: they type values, send them, and press buttons to see what happens. A transaction crossing a network into a mempool and a block, a priority queue, a chain of blocks whose hashes break when edited, a vote log.
The player stops at the first step and waits. Each send, press or edit by the reader adds one step and plays it. Images, videos and print show the author's example steps instead.

Pick `lineup` instead when the reader only watches.

## Parts (before the first step, stacked top to bottom in the order written)

| Line | Meaning |
|---|---|
| `route <name>: <node> - <node> - ..., ... [from: <node>, to: <node>]` | A network. A sent chip takes the path with the fewest nodes from `from` to `to` |
| `queue <name> [order: <field>]` | A waiting line, sorted from the highest value of the `order` field |
| `chain <name> [edit: <field>]` | A chain of blocks. Each block holds the previous block's `hash` as `prev`. With `edit`, the reader can change that field of a chip inside a block |
| `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` | Numbered records with no `prev` or `hash`. With `all`, a record shows `yes` when every chip has that value, `no` otherwise |
| `ask <field>, <field>, ... [into: <queue or field>, via: <route>]` | The input strip. The first field's value names the chip. With `into` naming a field, the chip enters the queue named by that field's value |
| `choose <field>: <value>, <value>, ...` | Turns a field into a choice instead of typing |
| `press <name> [from: <queue>, into: <chain or log>, take: <count>, at: <part>]` | A button that moves the top `take` chips into a new block or record. `at` places it on a part; without it, it sits in the input strip |
| `side <part>, <part>, ...` | Puts route, queue, chain and log parts on one row when the frame is wide enough |
| `check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` | A gate on a node of the shortest path of the `ask` line's `via` route. A sent chip stops at the first gate it fails (gates of a node in the written order), enters no queue, and adds a record with the node, the error and `retry` to the `into` log, which has no `all`. A number value compares numbers, other values only `==` and `!=` |
| `item <name> [<field>: <value>, ...]` | A chip declared up front |

## Lines in a step (the author's example)

| Line | Meaning |
|---|---|
| `line <part>: <chip>, <chip>, ...` | Sets a queue's contents, or adds a block or record holding those chips |
| `ask <value>, <value>, ...` | Sends a chip, as the reader would |
| `press <name>` | Presses a button |
| `item <name> [<field>: <value>]` | Changes a field of a chip already inside a block |

## How to write it well

- Start with a filled state (a couple of blocks, a few waiting chips) so the reader has something to change.
- Keep fields few (2 to 4) and values short. The first `ask` field is the chip's name.
- Write 2 to 4 example steps that show each control once: a send, a press, an edit.
- Use `choose` for fields with a fixed set of values so the reader cannot type a wrong one.

## Example

```dragon
try Edit a block and break the chain

queue Pending [order: Fee]
chain Ledger [edit: Amount]
ask Payer, Amount, Fee [into: Pending]
press Seal [from: Pending, into: Ledger, take: 2]

item p1 [Amount: 30, Fee: 4]
item p2 [Amount: 12, Fee: 6]
item p3 [Amount: 8, Fee: 2]

step Payments wait
  say One block is already sealed. Two payments wait in line, the higher fee first.
  line Ledger: p1
  line Pending: p2, p3

step You add a payment
  say Your payment joins the line by its fee.
  ask you, 50, 9

step Seal a block
  say The two highest fees go into block 2, which stores block 1's hash as prev.
  press Seal

step Change an old payment
  say Raising the amount in block 1 changes its hash, so block 2's prev no longer matches.
  item p1 [Amount: 300]
```
