# er

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

How one value goes through rows of several tables that point at each other by keys: an order total gathered from order lines, a library loan, an NFT sale, a token transfer.
Each table is a box of fields, a field with `ref` links to a field of another table, and the steps follow which row is looked up and which value is rewritten.

Pick `pipe` instead when the story is calls between contracts inside one transaction, and `architecture` when the parts are services rather than tables.

## Lines

| Line | Meaning |
|---|---|
| `er <title>` | The first line. A table relation diagram |
| `table <id> as <name> [color: ...]` | A table, written before the first `step`. The tables sit left to right in one row in the order written. A diagram takes 1 to 6 tables, and the id cannot hold a `.` |
| `field <name>: <value> [key, ref: <table>.<field>]` | A field of the table above it. `key` is the key mark (PK) and `ref` links it to a field of another table (FK). The linking field is the many side and the field it points at is the one side |
| `pick <table>.<field>` | Lights that row and its table frame in the step. The frame keeps a thin color in later steps |
| `<table>.<field> -> <table>.<field> [tag: <value>]` | Runs a value chip along the line between two linked fields. The chip stops halfway. Either direction works |
| `set <table>.<field>: <value>` | Rewrites the value of a field from that step on, in the table color |
| `note <table>.<field>: <text>` | Shows a formula card under the table from that step on. Cards on the same table stack downward |

## How to write it well

- Declare the tables in the order the value travels, so most links join neighboring tables. A link between tables that are not next to each other runs under the tables.
- Give every field a real sample value, and give the key field the value the other tables point at.
- Write `[key]` before `ref` when a field has both: `[key, ref: <table>.<field>]`.
- A line between fields that are not linked by `ref`, a line with a `: <label>`, and a `ref` to a missing table or field are refused. `box`, `group`, `act` and `strip` lines are refused too.
- Pick one row per step where you can. The step number sits at the right of the header of the table that step picks a row from.
- Put the arithmetic on a `note` card and the result in a `set` in the same step, so the reader sees how the value came out.

## Example

```dragon
er Look up the customer of an order

table users as Customers
  field id: U-7 [key]
  field name: Tanaka
  field orders: 2

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]
  field amount: $12

step Look up the order
  say Look up the row of order O-41.
  pick orders.id

step Follow the customer
  say Follow the user_id along the link and look up Tanaka, customer U-7.
  orders.user_id -> users.id [tag: U-7]
  pick users.id

step Count the order
  say Add one to the orders Tanaka has.
  note users.orders: 2 + 1 = 3
  set users.orders: 3
  pick users.orders
```
