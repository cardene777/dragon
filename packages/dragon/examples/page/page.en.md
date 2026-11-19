---
title: From order to delivery
layout: entry
---

How a shop takes an order and delivers the goods, in two groups and three items.
Press a box in the diagram or a card below to move to that item's page.

#### Overview diagram

```dragon
architecture From order to delivery [view: fixed]

box web as Order screen [note: The user picks goods, link: #take-the-order]
box pay as Payment system [note: Takes the money, link: #take-the-payment]
box store as Warehouse [note: Sends the goods, link: #send-the-goods]

step Take the order
  say The user picks goods on the screen and sends the order.
  web -> pay: Order
step Take the payment
  say Only paid orders go on to the warehouse.
  pay -> store: Paid order
```

#### As a table

| Group | Item | Hands over |
|---|---|---|
| Intake | Take the order | Order number |
| Payment and delivery | Take the payment | Paid order |
| Payment and delivery | Send the goods | Tracking number |

## Intake

The group that takes orders from the screen.

### Take the order

Takes the order from the screen, checks the stock, and returns a number.

#### Result

Took only the orders with goods in stock, and returned an order number.

> [!NOTE] What was asked
> Refuse an order that holds goods out of stock.

| Check | Result |
|---|---|
| Orders taken | 12 |
| Orders refused for missing stock | 2 |

#### How it works

```dragon
sequence Take the order

box user as User's screen
box shop as Shop desk

step Ask
  say The user sends the goods and the address.
  user -> shop: Order
step Return a number
  say The shop checks the stock and returns an order number.
  shop -> user: Order number
```

#### Full output

##### Design

![Intake design](parts/design.en.md)

##### Table definition

![Order table](parts/orders.sql)

## Payment and delivery

The group that takes the money and sends the goods.

### Take the payment

Takes the money for an order and passes paid orders to the warehouse.

#### Result

Of the 12 orders, passed the 10 paid ones to the warehouse.

#### How it works

![Payment diagram](parts/pay.en.dragon)

### Send the goods

Sends the goods from the warehouse and keeps the tracking number.

#### Result

- Sent the goods of 10 orders
- Kept a tracking number for each order
