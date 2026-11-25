---
title: Guide from order to delivery
layout: guide
note: pop
---

How a shop takes an order and delivers the goods, one question at a time.
Click an underlined word to see what it means on a card.

![Terms](glossary.en.md)

## Take the order

### Which orders does the shop take?

> The shop takes an [order](glossary.en.md#order) only when every item is in stock, and returns an [order number](glossary.en.md#order-number).

```dragon
sequence Take the order

box user as Order screen [note: Picks the items and the address, example: Three apples to a house in Tokyo]
box shop as Shop desk [note: Checks the stock and returns a number]

step Ask
  say The user sends the items and the address.
  user -> shop: Order
step Answer
  say The shop checks the stock and returns the order number.
  shop -> user: Order number
```

An order with even one item out of stock is turned down as a whole.

<details>
<summary>What happens to an order with one item out of stock?</summary>

The shop turns it down. It does not split the order.

</details>

<details>
<summary>What does the shop return for an order it takes?</summary>

The order number. The user can check the address later with it.

</details>

### Where do turned-down orders go?

> A turned-down order stays in the desk's record with the reason.

| Checked | Result |
|---|---|
| Orders taken | 12 |
| Orders turned down for stock | 2 |

## Deliver

### What happens after the payment?

> Only an order with a finished [payment](glossary.en.md#payment) goes to the warehouse, which ships it with a tracking number.

```dragon
architecture From payment to shipping

box pay as Payment system [note: Takes the payment]
box store as Warehouse [note: Ships the goods, example: Tracking number A-1024]

step Pass
  say Only paid orders go to the warehouse.
  pay -> store: Paid order
```

<details>
<summary>Does an unpaid order go to the warehouse?</summary>

No. Only paid orders go to the warehouse.

</details>
