# Intake design

What to check when an order arrives, and what to return.

| Field | Meaning |
|---|---|
| `id` | Order number, given when the order is taken |
| `items` | Goods and how many of each |
| `address` | Where to deliver |

- Do not take an order that holds any goods out of stock
- Give each taken order a number and return it
